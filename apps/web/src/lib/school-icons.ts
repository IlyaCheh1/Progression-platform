const SCHOOL_ICON_FILES: Record<string, string> = {
  witcher: "witcher.webp",
  east: "east.webp",
  spanish_rapier: "spanish_rapier.webp",
  italian_rapier: "italian_rapier.webp",
  montante: "montante.webp",
  navaja: "navaja.webp",
};

export function getSchoolIconSrc(key: string): string {
  const file = SCHOOL_ICON_FILES[key];
  return file ? `/media/school-icons/${file}` : `/media/school-icons/${key}.webp`;
}

/** Short subtitle for profile nav school popup (first phrase before comma or colon). */
export function schoolMenuSubtitle(description: string): string {
  const comma = description.indexOf(",");
  if (comma >= 0) return description.slice(0, comma).trim();
  const colon = description.indexOf(":");
  if (colon >= 0) return description.slice(0, colon).trim();
  return description.trim();
}
