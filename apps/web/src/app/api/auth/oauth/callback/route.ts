import { NextRequest, NextResponse } from "next/server";
import {
  createRemoteJWKSet,
  jwtVerify,
  type JWTPayload,
  type JWTVerifyOptions,
} from "jose";

import { buildAuthBridgeCookie } from "@/lib/onlyid/bridge";
import {
  buildCallbackUrl,
  clearOAuthPkceCookie,
  extractDisplayName,
  getPublicOrigin,
  isSafeReturnPath,
  isSecureRequest,
  readOAuthPkceCookie,
  schoolApiBaseUrl,
  SSO_PATHS,
  type SsoUserInfo,
} from "@/lib/onlyid/sso";
import { normalizeRole, normalizeRoles, primaryRole, type SessionUser } from "@/lib/session";

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
  return NextResponse.redirect(url);
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
  const authSecret = process.env.AUTH_SECRET;
  const ssoBase = process.env.SSO_BASE_URL?.replace(/\/$/, "");
  const clientId = process.env.SSO_CLIENT_ID;
  const clientSecret = process.env.SSO_CLIENT_SECRET;
  const bridgeSecret = process.env.SSO_BRIDGE_SECRET;

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

  const pkce = await readOAuthPkceCookie(request, authSecret);
  if (!pkce || pkce.state !== state) {
    return redirectWithError(request, "invalid_state");
  }

  const { codeVerifier, nonce } = pkce;
  const secure = isSecureRequest(request);
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
    if (userinfo.email_verified === false) {
      return redirectWithError(request, "email_not_verified");
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

    if (schoolRes.status === 404) {
      return redirectWithError(request, "account_not_linked");
    }
    if (!schoolRes.ok) {
      console.error("[oauth/callback] school bridge failed", schoolRes.status);
      return redirectWithError(request, "school_session_failed");
    }

    const schoolData = (await schoolRes.json()) as SchoolAuthResponse;
    const session = sessionFromSchool(schoolData, userinfo.email);
    if (!session) {
      return redirectWithError(request, "school_session_failed");
    }

    const bridgeCookie = await buildAuthBridgeCookie(session, authSecret, { secure });
    let origin: string;
    try {
      origin = getPublicOrigin(request.url);
    } catch {
      return redirectWithError(request, "sso_not_configured");
    }
    const redirectTo = request.cookies.get("oauth_redirect_after")?.value || "/auth/callback";
    const safeRedirect = isSafeReturnPath(redirectTo) ? redirectTo : "/auth/callback";

    // Always land on /auth/callback so the client can hydrate localStorage from the bridge cookie.
    const landing = new URL("/auth/callback", origin);
    if (safeRedirect !== "/auth/callback") {
      landing.searchParams.set("next", safeRedirect);
    }

    const res = NextResponse.redirect(landing);
    res.headers.append("Set-Cookie", bridgeCookie);
    res.headers.append("Set-Cookie", clearOAuthPkceCookie({ secure }));
    res.headers.append(
      "Set-Cookie",
      `oauth_redirect_after=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax${secure ? "; Secure" : ""}`,
    );
    return res;
  } catch (error) {
    console.error("[oauth/callback]", error);
    return redirectWithError(request, "sso_error");
  }
}
