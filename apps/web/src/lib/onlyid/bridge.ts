import { SignJWT, jwtVerify } from "jose";

import type { SessionUser } from "@/lib/session";

export const BRIDGE_COOKIE = "mos_auth_bridge";
const BRIDGE_MAX_AGE = 120;

function secretKey(secret: string): Uint8Array {
  return new TextEncoder().encode(secret);
}

export async function signBridgeCookieValue(session: SessionUser, secret: string): Promise<string> {
  return new SignJWT({ session })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${BRIDGE_MAX_AGE}s`)
    .sign(secretKey(secret));
}

export async function readBridgeCookieValue(
  raw: string | undefined,
  secret: string,
): Promise<SessionUser | null> {
  if (!raw) return null;
  try {
    const { payload } = await jwtVerify(raw, secretKey(secret), {
      algorithms: ["HS256"],
    });
    const session = payload.session as SessionUser | undefined;
    if (!session?.accessToken || !session.studentId) return null;
    return session;
  } catch {
    return null;
  }
}

export { BRIDGE_MAX_AGE };
