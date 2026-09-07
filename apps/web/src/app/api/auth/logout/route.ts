import { NextRequest, NextResponse } from "next/server";

import {
  cookieOptions,
  getPublicOrigin,
  ID_TOKEN_COOKIE,
  resolveSsoApiBase,
  ssoEndpoint,
  SSO_PATHS,
} from "@/lib/onlyid/sso";

/**
 * Local session is cleared in the browser.
 * Returns an OnlyID end-session URL (with id_token_hint when available).
 */
export async function POST(request: NextRequest) {
  const clientId = process.env.SSO_CLIENT_ID?.trim();
  const ssoBase = resolveSsoApiBase();
  let origin: string;
  try {
    origin = getPublicOrigin(request.url);
  } catch {
    return NextResponse.json({ ssoLogoutUrl: null });
  }
  const postLogout = `${origin}/login`;

  const clearOpts = { ...cookieOptions(request, 0), maxAge: 0 };
  const empty = NextResponse.json({ ssoLogoutUrl: null });
  empty.cookies.set(ID_TOKEN_COOKIE, "", clearOpts);

  if (!ssoBase || !clientId) {
    return empty;
  }

  const endSession = new URL(ssoEndpoint(SSO_PATHS.logout));
  endSession.searchParams.set("client_id", clientId);
  endSession.searchParams.set("post_logout_redirect_uri", postLogout);

  const idToken = request.cookies.get(ID_TOKEN_COOKIE)?.value?.trim();
  if (idToken) {
    endSession.searchParams.set("id_token_hint", idToken);
  }

  const res = NextResponse.json({ ssoLogoutUrl: endSession.toString() });
  res.cookies.set(ID_TOKEN_COOKIE, "", clearOpts);
  return res;
}
