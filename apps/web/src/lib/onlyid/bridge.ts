import type { SessionUser } from "@/lib/session";
import { decryptPayload, encryptPayload } from "@/lib/onlyid/crypto";

const BRIDGE_COOKIE = "mos_auth_bridge";
const BRIDGE_SALT = "mos-onlyid-auth-bridge";
const BRIDGE_MAX_AGE = 120;

export type AuthBridgePayload = {
  session: SessionUser;
  expiresAt: number;
};

export async function buildAuthBridgeCookie(
  session: SessionUser,
  secret: string,
  options?: { secure?: boolean },
): Promise<string> {
  const secure = options?.secure ?? process.env.NODE_ENV === "production";
  const payload: AuthBridgePayload = {
    session,
    expiresAt: Date.now() + BRIDGE_MAX_AGE * 1000,
  };
  const encrypted = await encryptPayload(JSON.stringify(payload), secret, BRIDGE_SALT);
  return [
    `${BRIDGE_COOKIE}=${encrypted}`,
    "Path=/",
    "HttpOnly",
    ...(secure ? ["Secure"] : []),
    "SameSite=Lax",
    `Max-Age=${BRIDGE_MAX_AGE}`,
  ].join("; ");
}

export async function readAuthBridgeCookie(request: Request, secret: string): Promise<SessionUser | null> {
  const raw = request.headers
    .get("cookie")
    ?.split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${BRIDGE_COOKIE}=`))
    ?.slice(BRIDGE_COOKIE.length + 1);
  if (!raw) return null;

  const decrypted = await decryptPayload(raw, secret, BRIDGE_SALT);
  if (!decrypted) return null;

  try {
    const payload = JSON.parse(decrypted) as AuthBridgePayload;
    if (!payload.session?.accessToken || !payload.session.studentId) return null;
    if (payload.expiresAt < Date.now()) return null;
    return payload.session;
  } catch {
    return null;
  }
}

export function clearAuthBridgeCookie(options?: { secure?: boolean }): string {
  const secure = options?.secure ?? process.env.NODE_ENV === "production";
  return [
    `${BRIDGE_COOKIE}=`,
    "Path=/",
    "HttpOnly",
    ...(secure ? ["Secure"] : []),
    "SameSite=Lax",
    "Max-Age=0",
  ].join("; ");
}
