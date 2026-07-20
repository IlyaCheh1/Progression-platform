import { decryptPayload, encryptPayload, isSecureRequest } from "@/lib/onlyid/crypto";

export const SSO_PATHS = {
  authorize: "/api/v1/user/oauth/authorize",
  token: "/api/v1/user/oauth/token",
  userinfo: "/api/v1/user/oauth/userinfo",
  logout: "/api/v1/user/oauth/logout",
  jwks: "/api/v1/user/.well-known/jwks.json",
  issuerSuffix: "/api/v1/user",
} as const;

const PKCE_COOKIE = "mos_oauth_pkce";
const PKCE_SALT = "mos-onlyid-oauth-pkce";
const PKCE_MAX_AGE = 600;

export type OAuthPkcePayload = {
  state: string;
  codeVerifier: string;
  nonce: string;
  expiresAt: number;
};

export type SsoUserInfo = {
  sub: string;
  email: string;
  email_verified?: boolean;
  username?: string;
  preferred_username?: string;
  name?: string;
  is_active?: boolean;
  is_blocked?: boolean;
};

export function randomBase64Url(bytes: number): string {
  const buf = crypto.getRandomValues(new Uint8Array(bytes));
  return Buffer.from(buf)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
}

export async function sha256Base64Url(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Buffer.from(hash)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
}

export function getPublicOrigin(requestUrl: string): string {
  const fromEnv =
    process.env.SSO_OAUTH_CALLBACK_URL?.replace(/\/api\/auth\/oauth\/callback\/?$/, "") ||
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
  if (fromEnv) return fromEnv;

  if (process.env.NODE_ENV !== "production") {
    return new URL(requestUrl).origin;
  }

  throw new Error("NEXT_PUBLIC_SITE_URL or SSO_OAUTH_CALLBACK_URL must be set in production");
}

/** Same-origin relative path only (blocks // and /\ open redirects). */
export function isSafeReturnPath(value: string | null | undefined): value is string {
  if (!value) return false;
  if (!value.startsWith("/")) return false;
  if (value.startsWith("//") || value.startsWith("/\\")) return false;
  if (value.includes("\\") || value.includes("@")) return false;
  return /^\/[A-Za-z0-9._~/?&=%+,#\-]*$/.test(value);
}

export function buildCallbackUrl(requestUrl: string): string {
  const fullCallback = process.env.SSO_OAUTH_CALLBACK_URL?.replace(/\/$/, "");
  if (fullCallback) return fullCallback;
  return `${getPublicOrigin(requestUrl)}/api/auth/oauth/callback`;
}

export function schoolApiBaseUrl(): string {
  return (
    process.env.SCHOOL_API_INTERNAL_URL?.replace(/\/$/, "") ||
    process.env.NEXT_PUBLIC_SCHOOL_API?.replace(/\/$/, "") ||
    "http://127.0.0.1:8082"
  );
}

export function extractDisplayName(info: SsoUserInfo): string {
  const raw = info.name || info.preferred_username || info.username || info.email;
  return typeof raw === "string" && raw.trim() ? raw.trim() : info.email;
}

export async function buildOAuthPkceCookie(
  payload: OAuthPkcePayload,
  secret: string,
  options?: { secure?: boolean },
): Promise<string> {
  const secure = options?.secure ?? process.env.NODE_ENV === "production";
  const encrypted = await encryptPayload(JSON.stringify(payload), secret, PKCE_SALT);
  const parts = [
    `${PKCE_COOKIE}=${encrypted}`,
    "Path=/",
    "HttpOnly",
    ...(secure ? ["Secure"] : []),
    "SameSite=Lax",
    `Max-Age=${PKCE_MAX_AGE}`,
  ];
  return parts.join("; ");
}

export async function readOAuthPkceCookie(request: Request, secret: string): Promise<OAuthPkcePayload | null> {
  const raw = request.headers
    .get("cookie")
    ?.split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${PKCE_COOKIE}=`))
    ?.slice(PKCE_COOKIE.length + 1);
  if (!raw) return null;

  const decrypted = await decryptPayload(raw, secret, PKCE_SALT);
  if (!decrypted) return null;

  try {
    const payload = JSON.parse(decrypted) as OAuthPkcePayload;
    if (!payload.state || !payload.codeVerifier || !payload.nonce) return null;
    if (payload.expiresAt < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

export function clearOAuthPkceCookie(options?: { secure?: boolean }): string {
  const secure = options?.secure ?? process.env.NODE_ENV === "production";
  return [
    `${PKCE_COOKIE}=`,
    "Path=/",
    "HttpOnly",
    ...(secure ? ["Secure"] : []),
    "SameSite=Lax",
    "Max-Age=0",
  ].join("; ");
}

export { isSecureRequest };
