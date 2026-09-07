export const AUDIENCE_MODES = ["adults", "kids"] as const;
export type AudienceMode = (typeof AUDIENCE_MODES)[number];

export const AUDIENCE_QUERY = "audience";
export const AUDIENCE_STORAGE_KEY = "mos.audience";

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

export function readStoredAudience(): AudienceMode | null {
  if (typeof window === "undefined") return null;
  try {
    return parseAudience(window.localStorage.getItem(AUDIENCE_STORAGE_KEY));
  } catch {
    return null;
  }
}

export function writeStoredAudience(mode: AudienceMode) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(AUDIENCE_STORAGE_KEY, mode);
  } catch {
    // private mode / quota
  }
}

export function resolveAudience(search: string | URLSearchParams | null | undefined): AudienceMode {
  const params = typeof search === "string" ? new URLSearchParams(search.startsWith("?") ? search.slice(1) : search) : search;
  return parseAudience(params?.get(AUDIENCE_QUERY)) ?? readStoredAudience() ?? "adults";
}

export function withAudience(href: string, mode: AudienceMode): string {
  const hashIndex = href.indexOf("#");
  const hash = hashIndex >= 0 ? href.slice(hashIndex) : "";
  const withoutHash = hashIndex >= 0 ? href.slice(0, hashIndex) : href;
  const [path, query = ""] = withoutHash.split("?");
  const params = new URLSearchParams(query);
  if (mode === "kids") params.set(AUDIENCE_QUERY, "kids");
  else params.delete(AUDIENCE_QUERY);
  const qs = params.toString();
  return `${path}${qs ? `?${qs}` : ""}${hash}`;
}

export const AUDIENCE_CHANGED_EVENT = "mos:audience-changed";
