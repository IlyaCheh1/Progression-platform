import { NextRequest, NextResponse } from "next/server";

import { BRIDGE_COOKIE, readBridgeCookieValue } from "@/lib/onlyid/bridge";
import { cookieOptions } from "@/lib/onlyid/sso";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const authSecret = process.env.AUTH_SECRET;
  if (!authSecret) {
    return NextResponse.json({ error: "sso_not_configured" }, { status: 503 });
  }

  const session = await readBridgeCookieValue(request.cookies.get(BRIDGE_COOKIE)?.value, authSecret);
  if (!session) {
    return NextResponse.json({ error: "no_bridge_session" }, { status: 401 });
  }

  const res = NextResponse.json({ session });
  res.headers.set("Cache-Control", "no-store");
  res.cookies.set(BRIDGE_COOKIE, "", { ...cookieOptions(request, 0), maxAge: 0 });
  return res;
}
