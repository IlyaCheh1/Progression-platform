export const AUDIENCE_MODES = ["adults", "kids"] as const;
export type AudienceMode = (typeof AUDIENCE_MODES)[number];

export const AUDIENCE_QUERY = "audience";
export const KIDS_HOME = "/kids";

export function isAudienceMode(value: unknown): value is AudienceMode {
  return value === "adults" || value === "kids";
}

export function parseAudience(value: string | null | undefined): AudienceMode | null {
  if (!value) return null;
  const normalized = value.trim().toLowerCase();
  if (normalized === "kids" || normalized === "children" || normalized === "deti") return "kids";
  if (normalized === "adults" || normalized === "vzroslye") return "adults";
  return null;
}

export function audienceFromSearch(audience: string | string[] | undefined): AudienceMode {
  const raw = Array.isArray(audience) ? audience[0] : audience;
  return parseAudience(raw) ?? "adults";
}

export function isKidsPath(pathname: string | null | undefined): boolean {
  if (!pathname) return false;
  return pathname === KIDS_HOME || pathname.startsWith(`${KIDS_HOME}/`);
}

export function audienceFromPathname(pathname: string | null | undefined): AudienceMode {
  return isKidsPath(pathname) ? "kids" : "adults";
}

export function homeForAudience(mode: AudienceMode): string {
  return mode === "kids" ? KIDS_HOME : "/";
}

export function isLandingPath(pathname: string | null | undefined): boolean {
  const path = (pathname ?? "").split("?")[0];
  return path === "" || path === "/" || path === KIDS_HOME;
}

function rewriteHomePath(path: string, mode: AudienceMode): string {
  if (path === "" || path === "/" || path === KIDS_HOME) return homeForAudience(mode);
  return path;
}

export function withAudience(href: string, mode: AudienceMode): string {
  const hashIndex = href.indexOf("#");
  const hash = hashIndex >= 0 ? href.slice(hashIndex) : "";
  const withoutHash = hashIndex >= 0 ? href.slice(0, hashIndex) : href;
  const [path, query = ""] = withoutHash.split("?");
  const params = new URLSearchParams(query);
  params.delete(AUDIENCE_QUERY);
  const nextPath = rewriteHomePath(path, mode);
  const qs = params.toString();
  return `${nextPath}${qs ? `?${qs}` : ""}${hash}`;
}

const KIDS_HIDDEN_HREFS = new Set(["/#directions"]);

export function publicNavForAudience<T extends { href: string }>(
  items: readonly T[],
  mode: AudienceMode,
): T[] {
  if (mode !== "kids") return [...items];
  return items.filter((item) => !KIDS_HIDDEN_HREFS.has(item.href));
}
