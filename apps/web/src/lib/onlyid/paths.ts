export const SSO_PATHS = {
  authorize: "/api/v1/user/oauth/authorize",
  token: "/api/v1/user/oauth/token",
  userinfo: "/api/v1/user/oauth/userinfo",
  logout: "/api/v1/user/oauth/logout",
  jwks: "/api/v1/user/.well-known/jwks.json",
  issuerSuffix: "/api/v1/user",
} as const;

/** Public OnlyID site hosts. OAuth lives on api.onlyid.ru (OIDC discovery). */
const ONLYID_PUBLIC_HOSTS = new Set(["onlyid.ru", "www.onlyid.ru"]);
const ONLYID_API_ORIGIN = "https://api.onlyid.ru";

export type SsoEnv = {
  ssoBaseUrl?: string | null;
  ssoIssuer?: string | null;
};

function trimUrl(value: string | null | undefined): string {
  return value?.trim().replace(/\/$/, "") ?? "";
}

function hostnameOf(value: string): string | null {
  try {
    return new URL(value).hostname.toLowerCase();
  } catch {
    return null;
  }
}

function originOf(value: string): string | null {
  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
}

/**
 * Resolve the OnlyID API origin used for authorize/token/userinfo/logout/jwks.
 * Coolify historically sets SSO_BASE_URL=https://onlyid.ru while discovery
 * endpoints live on https://api.onlyid.ru.
 */
export function resolveSsoApiBase(env: SsoEnv = {}): string {
  const base = trimUrl(env.ssoBaseUrl ?? process.env.SSO_BASE_URL);
  const issuer = trimUrl(env.ssoIssuer ?? process.env.SSO_ISSUER);

  if (base) {
    const host = hostnameOf(base);
    if (host && ONLYID_PUBLIC_HOSTS.has(host)) {
      return ONLYID_API_ORIGIN;
    }
    return base;
  }

  if (issuer) {
    return originOf(issuer) ?? "";
  }

  return "";
}

export function ssoEndpoint(path: string, env: SsoEnv = {}): string {
  return `${resolveSsoApiBase(env)}${path}`;
}

export function resolveSsoIssuer(env: SsoEnv = {}): string {
  const issuer = trimUrl(env.ssoIssuer ?? process.env.SSO_ISSUER);
  if (issuer) return issuer;
  const apiBase = resolveSsoApiBase(env);
  return apiBase ? `${apiBase}${SSO_PATHS.issuerSuffix}` : "";
}

/** Same-origin relative path only (blocks // and /\ open redirects). */
export function isSafeReturnPath(value: string | null | undefined): value is string {
  if (!value) return false;
  if (!value.startsWith("/")) return false;
  if (value.startsWith("//") || value.startsWith("/\\")) return false;
  if (value.includes("\\") || value.includes("@")) return false;
  return /^\/[A-Za-z0-9._~/?&=%+,#\-]*$/.test(value);
}

/** Landing "/" is marketing; after OnlyID send users to the profile cabinet. */
export function resolvePostLoginPath(value: string | null | undefined): string {
  if (!isSafeReturnPath(value)) return "/profile";
  if (value === "/" || value === "/auth/callback") return "/profile";
  return value;
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

export function buildCallbackUrl(requestUrl: string): string {
  const fullCallback = process.env.SSO_OAUTH_CALLBACK_URL?.replace(/\/$/, "");
  if (fullCallback) return fullCallback;
  return `${getPublicOrigin(requestUrl)}/api/auth/oauth/callback`;
}
