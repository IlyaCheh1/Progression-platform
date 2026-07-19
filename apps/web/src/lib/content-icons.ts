/** Content icon URLs for quests and achievements (PNG on CDN/S3 or local public). */
const ICONS_BASE = (
  process.env.NEXT_PUBLIC_CONTENT_ICONS_BASE_URL ?? "/media/content-icons"
).replace(/\/$/, "");

function resolveIcon(icon: string | undefined, kind: "quests" | "achievements", key: string): string {
  if (icon) {
    if (icon.startsWith("http://") || icon.startsWith("https://") || icon.startsWith("/")) {
      return icon;
    }
    return `${ICONS_BASE}/${icon.replace(/^\//, "")}`;
  }
  return `${ICONS_BASE}/${kind}/${key}.png`;
}

export function questIconUrl(key: string, icon?: string): string {
  return resolveIcon(icon, "quests", key);
}

export function achievementIconUrl(key: string, icon?: string): string {
  return resolveIcon(icon, "achievements", key);
}

export { ICONS_BASE as contentIconsBaseUrl };
