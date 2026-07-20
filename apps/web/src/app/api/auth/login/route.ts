import { NextRequest, NextResponse } from "next/server";

import {
  buildCallbackUrl,
  cookieOptions,
  isSafeReturnPath,
  PKCE_COOKIE,
  PKCE_MAX_AGE,
  randomBase64Url,
  REDIRECT_COOKIE,
  sha256Base64Url,
  signPkceCookieValue,
  SSO_PATHS,
} from "@/lib/onlyid/sso";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const authSecret = process.env.AUTH_SECRET?.trim();
  const ssoBase = process.env.SSO_BASE_URL?.trim().replace(/\/$/, "");
  const clientId = process.env.SSO_CLIENT_ID?.trim();
  const clientSecret = process.env.SSO_CLIENT_SECRET?.trim();

  if (!authSecret || !ssoBase || !clientId || !clientSecret) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("login_error", "sso_not_configured");
    return NextResponse.redirect(loginUrl);
  }

  try {
    const state = randomBase64Url(32);
    const nonce = randomBase64Url(32);
    const codeVerifier = randomBase64Url(64);
    const codeChallenge = await sha256Base64Url(codeVerifier);
    const options = cookieOptions(request, PKCE_MAX_AGE);

    const pkceValue = await signPkceCookieValue(
      { state, codeVerifier, nonce },
      authSecret,
    );

    const callbackUrl = buildCallbackUrl(request.url);
    const rawReturn =
      request.nextUrl.searchParams.get("returnUrl") ||
      request.nextUrl.searchParams.get("redirect") ||
      "/";
    const returnUrl = isSafeReturnPath(rawReturn) ? rawReturn : "/";

    const params = new URLSearchParams({
      redirect_uri: callbackUrl,
      client_id: clientId,
      response_type: "code",
      scope: "openid profile email",
      state,
      nonce,
      code_challenge: codeChallenge,
      code_challenge_method: "S256",
    });

    const prompt = request.nextUrl.searchParams.get("prompt");
    if (prompt && ["select_account", "login", "none"].includes(prompt)) {
      params.set("prompt", prompt);
    }

    const authorizeUrl = `${ssoBase}${SSO_PATHS.authorize}?${params.toString()}`;
    const res = NextResponse.redirect(authorizeUrl);
    res.cookies.set(PKCE_COOKIE, pkceValue, options);
    res.cookies.set(REDIRECT_COOKIE, returnUrl, options);
    return res;
  } catch (error) {
    console.error("[api/auth/login]", error);
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("login_error", "sso_error");
    return NextResponse.redirect(loginUrl);
  }
}
