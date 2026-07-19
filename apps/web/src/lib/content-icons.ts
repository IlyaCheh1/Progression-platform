/** Same-origin icons from Next.js `public/` (always shipped with the web image). */
export const LOCAL_CONTENT_ICONS_BASE = "/media/content-icons";

/**
 * Selectel public host is `https://<bucket-uuid>.selstorage.ru/...`.
 * Bucket name hosts like `swordmaster.selstorage.ru` are NXDOMAIN — never use them.
 */
function isSelectelUuidPublicHost(host: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.selstorage\.ru$/i.test(
    host,
  );
}

/**
 * Resolve content-icons base URL.
 * Falls back to same-origin when the env points at an invalid Selectel host.
 */
export function resolveContentIconsBase(
  raw: string | undefined = process.env.NEXT_PUBLIC_CONTENT_ICONS_BASE_URL,
): string {
  const trimmed = (raw ?? LOCAL_CONTENT_ICONS_BASE).trim().replace(/\/$/, "");
  if (!trimmed) return LOCAL_CONTENT_ICONS_BASE;

  try {
    const url = new URL(trimmed);
    const host = url.hostname.toLowerCase();

    if (host.endsWith(".selstorage.ru") && !isSelectelUuidPublicHost(host)) {
      return LOCAL_CONTENT_ICONS_BASE;
    }

    // Older upload scripts printed .../selstorage.ru/<bucket>/media/content-icons
    if (host.endsWith(".selstorage.ru") || host.endsWith(".selcdn.ru")) {
      const parts = url.pathname.split("/").filter(Boolean);
      const mediaIdx = parts.indexOf("media");
      if (mediaIdx > 0) {
        url.pathname = `/${parts.slice(mediaIdx).join("/")}`;
      }
    }

    return url.toString().replace(/\/$/, "");
  } catch {
    // relative path, e.g. /media/content-icons
    return trimmed.startsWith("/") ? trimmed : LOCAL_CONTENT_ICONS_BASE;
  }
}

const ICONS_BASE = resolveContentIconsBase();

function resolveIcon(icon: string | undefined, kind: "quests" | "achievements" | "talents", key: string): string {
  if (icon) {
    if (icon.startsWith("http://") || icon.startsWith("https://") || icon.startsWith("/")) {
      return icon;
    }
    return `${ICONS_BASE}/${icon.replace(/^\//, "")}`;
  }
  return `${ICONS_BASE}/${kind}/${key}.webp`;
}

export function questIconUrl(key: string, icon?: string): string {
  return resolveIcon(icon, "quests", key);
}

export function achievementIconUrl(key: string, icon?: string): string {
  return resolveIcon(icon, "achievements", key);
}

export function talentIconUrl(key: string, icon?: string): string {
  return resolveIcon(icon, "talents", key);
}

export { ICONS_BASE as contentIconsBaseUrl };
