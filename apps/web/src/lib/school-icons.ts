const SCHOOL_ICON_FILES: Record<string, string> = {
  witcher: "witcher.png",
  east: "east.png",
  spanish_rapier: "spanish_rapier.png",
  italian_rapier: "italian_rapier.png",
  montante: "montante.png",
  navaja: "navaja.png",
};

export function getSchoolIconSrc(key: string): string {
  const file = SCHOOL_ICON_FILES[key];
  return file ? `/media/school-icons/${file}` : `/media/school-icons/${key}.png`;
}
