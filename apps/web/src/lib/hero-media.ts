/** Same-origin files from the Next.js public/ folder (always deployed with the web app). */
export const LOCAL_HERO_MEDIA_BASE = "/media/hero";

/** Local backdrop for the adult school intro slide. */
export const SCHOOL_HERO_VIDEO = "A-diagonal-fighters-moving-5s.mp4" as const;

/** Phone-only still for the adult school intro. Desktop keeps the video. */
export const SCHOOL_HERO_MOBILE_STILL = "school-mobile.webp" as const;

/** Existing adult witcher direction video. */
export const WITCHER_HERO_VIDEO = "1.mp4" as const;

/**
 * Selectel public domain is https://<bucket-uuid>.selstorage.ru/<key>.
 * Bucket name (e.g. swordmaster.selstorage.ru) is NOT a valid public host — use the UUID from Selectel.
 * Older upload scripts printed .../selstorage.ru/<bucket>/media/hero — strip the extra segment.
 */
export function normalizeMediaBase(raw: string): string {
  const trimmed = raw.trim().replace(/\/$/, "");
  try {
    const url = new URL(trimmed);
    const host = url.hostname.toLowerCase();
    if (host.endsWith(".selstorage.ru") || host.endsWith(".selcdn.ru")) {
      const parts = url.pathname.split("/").filter(Boolean);
      const mediaIdx = parts.indexOf("media");
      if (mediaIdx > 0) {
        url.pathname = `/${parts.slice(mediaIdx).join("/")}`;
        return url.toString().replace(/\/$/, "");
      }
    }
  } catch {
    // relative /media/hero
  }
  return trimmed;
}

export const REMOTE_HERO_MEDIA_BASE = normalizeMediaBase(
  process.env.NEXT_PUBLIC_MEDIA_BASE_URL ?? LOCAL_HERO_MEDIA_BASE,
);

export const CAN_FALLBACK_HERO_MEDIA_TO_LOCAL = REMOTE_HERO_MEDIA_BASE !== LOCAL_HERO_MEDIA_BASE;

export function heroMediaUrl(file: string, useLocal = false): string {
  const base = useLocal ? LOCAL_HERO_MEDIA_BASE : REMOTE_HERO_MEDIA_BASE;
  return `${base}/${file}`;
}

export function heroPosterUrl(file: string, useLocal = false): string {
  return heroMediaUrl(heroStillFile(file), useLocal);
}

export function heroStillFile(file: string): string {
  return file.replace(/\.mp4$/i, ".webp");
}

export function isHeroImageFile(file: string): boolean {
  return /\.(webp|jpe?g|png)$/i.test(file);
}
