import { SignJWT, jwtVerify } from "jose";

export const SSO_PATHS = {
  authorize: "/api/v1/user/oauth/authorize",
  token: "/api/v1/user/oauth/token",
  userinfo: "/api/v1/user/oauth/userinfo",
  logout: "/api/v1/user/oauth/logout",
  jwks: "/api/v1/user/.well-known/jwks.json",
  issuerSuffix: "/api/v1/user",
} as const;

export const PKCE_COOKIE = "mos_oauth_pkce";
export const REDIRECT_COOKIE = "oauth_redirect_after";
const PKCE_MAX_AGE = 600;

export type OAuthPkcePayload = {
  state: string;
  codeVerifier: string;
  nonce: string;
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

export type CookieWriteOptions = {
  httpOnly: true;
  secure: boolean;
  sameSite: "lax";
  path: "/";
  maxAge: number;
};

function secretKey(secret: string): Uint8Array {
  return new TextEncoder().encode(secret);
}

export function cookieSecurity(request: Request): boolean {
  if (process.env.NODE_ENV === "production") return true;
  const proto = request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim();
  if (proto) return proto === "https";
  try {
    return new URL(request.url).protocol === "https:";
  } catch {
    return false;
  }
}

export function cookieOptions(request: Request, maxAge: number): CookieWriteOptions {
  return {
    httpOnly: true,
    secure: cookieSecurity(request),
    sameSite: "lax",
    path: "/",
    maxAge,
  };
}

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

export async function signPkceCookieValue(payload: OAuthPkcePayload, secret: string): Promise<string> {
  return new SignJWT({
    codeVerifier: payload.codeVerifier,
    nonce: payload.nonce,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.state)
    .setIssuedAt()
    .setExpirationTime(`${PKCE_MAX_AGE}s`)
    .sign(secretKey(secret));
}

export async function readPkceCookieValue(
  raw: string | undefined,
  secret: string,
): Promise<OAuthPkcePayload | null> {
  if (!raw) return null;
  try {
    const { payload } = await jwtVerify(raw, secretKey(secret), {
      algorithms: ["HS256"],
    });
    const state = typeof payload.sub === "string" ? payload.sub : "";
    const codeVerifier = typeof payload.codeVerifier === "string" ? payload.codeVerifier : "";
    const nonce = typeof payload.nonce === "string" ? payload.nonce : "";
    if (!state || !codeVerifier || !nonce) return null;
    return { state, codeVerifier, nonce };
  } catch {
    return null;
  }
}

export { PKCE_MAX_AGE };
