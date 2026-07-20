import { NextRequest, NextResponse } from "next/server";

import { getPublicOrigin, SSO_PATHS } from "@/lib/onlyid/sso";

/**
 * Clears local client session is done in the browser.
 * This endpoint returns an optional OnlyID end-session URL for full SSO logout.
 */
export async function POST(request: NextRequest) {
  const ssoBase = process.env.SSO_BASE_URL?.replace(/\/$/, "");
  const clientId = process.env.SSO_CLIENT_ID;
  let origin: string;
  try {
    origin = getPublicOrigin(request.url);
  } catch {
    return NextResponse.json({ ssoLogoutUrl: null });
  }
  const postLogout = `${origin}/login`;

  if (!ssoBase || !clientId) {
    return NextResponse.json({ ssoLogoutUrl: null });
  }

  const endSession = new URL(`${ssoBase}${SSO_PATHS.logout}`);
  endSession.searchParams.set("client_id", clientId);
  endSession.searchParams.set("post_logout_redirect_uri", postLogout);

  return NextResponse.json({ ssoLogoutUrl: endSession.toString() });
}
