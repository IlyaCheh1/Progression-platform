import { NextRequest, NextResponse } from "next/server";
import {
  createRemoteJWKSet,
  jwtVerify,
  type JWTPayload,
  type JWTVerifyOptions,
} from "jose";

import { BRIDGE_COOKIE, BRIDGE_MAX_AGE, signBridgeCookieValue } from "@/lib/onlyid/bridge";
import {
  buildCallbackUrl,
  cookieOptions,
  extractDisplayName,
  getPublicOrigin,
  isSafeReturnPath,
  PKCE_COOKIE,
  readPkceCookieValue,
  REDIRECT_COOKIE,
  schoolApiBaseUrl,
  SSO_PATHS,
  type SsoUserInfo,
} from "@/lib/onlyid/sso";
import { normalizeRole, normalizeRoles, primaryRole, type SessionUser } from "@/lib/session";

export const dynamic = "force-dynamic";

type TokenResponse = {
  access_token: string;
  id_token: string;
};

type SchoolAuthResponse = {
  accessToken: string;
  role?: string;
  roles?: string[];
  student: {
    id?: string;
    displayName?: string;
    DisplayName?: string;
    login?: string;
    characterId?: string;
    CharacterID?: string;
    profileComplete?: boolean;
  };
};

function redirectWithError(request: NextRequest, error: string): NextResponse {
  let origin: string;
  try {
    origin = getPublicOrigin(request.url);
  } catch {
    origin = request.nextUrl.origin;
  }
  const url = new URL("/login", origin);
  url.searchParams.set("login_error", error);
  const res = NextResponse.redirect(url);
  const options = cookieOptions(request, 0);
  res.cookies.set(PKCE_COOKIE, "", { ...options, maxAge: 0 });
  res.cookies.set(REDIRECT_COOKIE, "", { ...options, maxAge: 0 });
  return res;
}

function sessionFromSchool(data: SchoolAuthResponse, email: string): SessionUser | null {
  const student = data.student ?? {};
  const studentId = String(student.id ?? "");
  const accessToken = String(data.accessToken ?? "");
  if (!studentId || !accessToken) return null;
  const roles = normalizeRoles(data.roles ?? data.role ?? "student");
  return {
    studentId,
    name: String(student.displayName ?? student.DisplayName ?? email),
    login: String(student.login ?? email),
    characterId: String(student.characterId ?? student.CharacterID ?? ""),
    accessToken,
    roles,
    role: normalizeRole(data.role ?? primaryRole(roles)),
    profileComplete: Boolean(student.profileComplete),
  };
}

export async function GET(request: NextRequest) {
  const authSecret = process.env.AUTH_SECRET?.trim();
  const ssoBase = process.env.SSO_BASE_URL?.trim().replace(/\/$/, "");
  const clientId = process.env.SSO_CLIENT_ID?.trim();
  const clientSecret = process.env.SSO_CLIENT_SECRET?.trim();
  const bridgeSecret = process.env.SSO_BRIDGE_SECRET?.trim();

  if (!authSecret || !ssoBase || !clientId || !clientSecret || !bridgeSecret) {
    return redirectWithError(request, "sso_not_configured");
  }

  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");
  const errorParam = request.nextUrl.searchParams.get("error");

  if (errorParam) {
    return redirectWithError(request, errorParam);
  }
  if (!code || !state) {
    return redirectWithError(request, "invalid_callback");
  }

  const rawPkce = request.cookies.get(PKCE_COOKIE)?.value;
  const pkce = await readPkceCookieValue(rawPkce, authSecret);
  if (!pkce) {
    console.error("[oauth/callback] missing or invalid PKCE cookie", {
      hasCookie: Boolean(rawPkce),
      cookieNames: request.cookies.getAll().map((c) => c.name),
    });
    return redirectWithError(request, "invalid_state");
  }
  if (pkce.state !== state) {
    console.error("[oauth/callback] state mismatch");
    return redirectWithError(request, "invalid_state");
  }

  const { codeVerifier, nonce } = pkce;
  const callbackUrl = buildCallbackUrl(request.url);

  try {
    const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
    const tokenRes = await fetch(`${ssoBase}${SSO_PATHS.token}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${basicAuth}`,
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        client_id: clientId,
        code,
        redirect_uri: callbackUrl,
        code_verifier: codeVerifier,
      }),
    });

    if (!tokenRes.ok) {
      console.error("[oauth/callback] token exchange failed", tokenRes.status);
      return redirectWithError(request, "token_exchange_failed");
    }

    const tokens = (await tokenRes.json()) as TokenResponse;
    if (!tokens.id_token || !tokens.access_token) {
      return redirectWithError(request, "no_id_token");
    }

    const issuer =
      process.env.SSO_ISSUER?.replace(/\/$/, "") || `${ssoBase}${SSO_PATHS.issuerSuffix}`;

    const jwksFromBase = `${ssoBase}${SSO_PATHS.jwks}`;
    let jwksUrlToTry = jwksFromBase;
    try {
      jwksUrlToTry = `${new URL(issuer).origin}${SSO_PATHS.jwks}`;
    } catch {
      // keep jwksFromBase
    }

    const jwksUrls = jwksUrlToTry === jwksFromBase ? [jwksUrlToTry] : [jwksUrlToTry, jwksFromBase];
    const verifyOptions: JWTVerifyOptions = {
      issuer,
      audience: clientId,
      algorithms: ["RS256", "RS384", "RS512", "ES256", "ES384", "ES512"],
    };

    let idClaims: JWTPayload | null = null;
    for (const jwksUrl of jwksUrls) {
      try {
        const jwks = createRemoteJWKSet(new URL(jwksUrl));
        const result = await jwtVerify(tokens.id_token, jwks, verifyOptions);
        idClaims = result.payload;
        break;
      } catch (error) {
        const err = error as { code?: string; claim?: string };
        if (err.code === "ERR_JWS_SIGNATURE_VERIFICATION_FAILED" && jwksUrls.indexOf(jwksUrl) < jwksUrls.length - 1) {
          continue;
        }
        if (err.code === "ERR_JWS_SIGNATURE_VERIFICATION_FAILED") {
          return redirectWithError(request, "id_token_signature_failed");
        }
        if (err.code === "ERR_JWT_CLAIM_VALIDATION_FAILED" && err.claim === "iss") {
          return redirectWithError(request, "id_token_issuer_mismatch");
        }
        throw error;
      }
    }

    if (!idClaims) {
      return redirectWithError(request, "id_token_signature_failed");
    }
    if (idClaims.nonce !== nonce) {
      return redirectWithError(request, "nonce_mismatch");
    }

    const userinfoRes = await fetch(`${ssoBase}${SSO_PATHS.userinfo}`, {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });
    if (!userinfoRes.ok) {
      console.error("[oauth/callback] userinfo failed", userinfoRes.status);
      return redirectWithError(request, "userinfo_failed");
    }

    const userinfo = (await userinfoRes.json()) as SsoUserInfo;
    if (!userinfo.email) {
      return redirectWithError(request, "no_email");
    }
    // OnlyID часто отдаёт email_verified=false даже для рабочих аккаунтов.
    // Доступ в школу всё равно ограничен ростером (login == email) через /v1/auth/onlyid.
    if (userinfo.email_verified === false) {
      console.warn("[oauth/callback] email_verified=false; continuing with roster check", {
        emailDomain: userinfo.email.split("@")[1] || "",
      });
    }
    if (userinfo.is_blocked) {
      return redirectWithError(request, "user_blocked");
    }

    const schoolRes = await fetch(`${schoolApiBaseUrl()}/v1/auth/onlyid`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-SSO-Bridge-Secret": bridgeSecret,
      },
      body: JSON.stringify({
        email: userinfo.email,
        sub: userinfo.sub,
        displayName: extractDisplayName(userinfo),
      }),
    });

    if (!schoolRes.ok) {
      console.error("[oauth/callback] school bridge failed", schoolRes.status);
      if (schoolRes.status >= 500) {
        return redirectWithError(request, "provision_failed");
      }
      return redirectWithError(request, "school_session_failed");
    }

    const schoolData = (await schoolRes.json()) as SchoolAuthResponse;
    const session = sessionFromSchool(schoolData, userinfo.email);
    if (!session) {
      return redirectWithError(request, "school_session_failed");
    }

    let origin: string;
    try {
      origin = getPublicOrigin(request.url);
    } catch {
      return redirectWithError(request, "sso_not_configured");
    }
    const redirectTo = request.cookies.get(REDIRECT_COOKIE)?.value || "/profile";
    const safeRedirect =
      isSafeReturnPath(redirectTo) && redirectTo !== "/" && redirectTo !== "/auth/callback"
        ? redirectTo
        : "/profile";

    const landing = new URL("/auth/callback", origin);
    if (safeRedirect !== "/profile") {
      landing.searchParams.set("next", safeRedirect);
    }

    const bridgeValue = await signBridgeCookieValue(session, authSecret);
    const res = NextResponse.redirect(landing);
    const bridgeOpts = cookieOptions(request, BRIDGE_MAX_AGE);
    const clearOpts = cookieOptions(request, 0);
    res.cookies.set(BRIDGE_COOKIE, bridgeValue, bridgeOpts);
    res.cookies.set(PKCE_COOKIE, "", { ...clearOpts, maxAge: 0 });
    res.cookies.set(REDIRECT_COOKIE, "", { ...clearOpts, maxAge: 0 });
    return res;
  } catch (error) {
    console.error("[oauth/callback]", error);
    return redirectWithError(request, "sso_error");
  }
}
