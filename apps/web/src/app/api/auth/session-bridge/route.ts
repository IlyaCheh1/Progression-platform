import { NextRequest, NextResponse } from "next/server";

import { clearAuthBridgeCookie, readAuthBridgeCookie } from "@/lib/onlyid/bridge";
import { isSecureRequest } from "@/lib/onlyid/sso";

export async function GET(request: NextRequest) {
  const authSecret = process.env.AUTH_SECRET;
  if (!authSecret) {
    return NextResponse.json({ error: "sso_not_configured" }, { status: 503 });
  }

  const session = await readAuthBridgeCookie(request, authSecret);
  if (!session) {
    return NextResponse.json({ error: "no_bridge_session" }, { status: 401 });
  }

  const secure = isSecureRequest(request);
  const res = NextResponse.json({ session });
  res.headers.set("Cache-Control", "no-store");
  res.headers.append("Set-Cookie", clearAuthBridgeCookie({ secure }));
  return res;
}
