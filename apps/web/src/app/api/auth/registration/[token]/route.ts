import { NextResponse } from "next/server";

import { isRegistrationToken, readRegistrationInvite } from "@/lib/auth/registration-invites";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ token: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { token } = await context.params;
  if (!isRegistrationToken(token)) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  const invite = readRegistrationInvite(token);
  if (!invite) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  return NextResponse.json({
    displayName: invite.displayName,
    login: invite.login,
    expiresAt: new Date(invite.expiresAt).toISOString(),
  });
}
