export const SCHOOL_COLORS: Record<string, string> = {
  witcher: "#c45c2a",
  east: "#5a8f7b",
  spanish_rapier: "#5c7d99",
  italian_rapier: "#a64d56",
  montante: "#a67c52",
  navaja: "#6b7d8f",
};

export const SCHOOL_COLOR_FALLBACKS = ["#d4a84b", "#5a8f7b", "#5c7d99", "#a64d56", "#b8924a", "#7a6b99"] as const;

export function getSchoolColor(key: string, index = 0): string {
  return SCHOOL_COLORS[key] ?? SCHOOL_COLOR_FALLBACKS[index % SCHOOL_COLOR_FALLBACKS.length];
}
