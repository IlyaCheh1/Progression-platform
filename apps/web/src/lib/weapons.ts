import { achievementIconUrl } from "@/lib/content-icons";

/** Canonical weapon keys stored in student.mastery / student.ranks (Go mastery.WeaponKeys). */
export const WEAPON_KEYS = [
  "spada_a_uno_mano",
  "due_spade",
  "spada_e_scudo",
  "spada_a_due_mani",
  "spadone",
  "acia_alabarda",
  "spiedo_partesana",
  "spiedo_e_scudo",
] as const;

export type WeaponKey = (typeof WEAPON_KEYS)[number];

export type WeaponDefinition = {
  key: WeaponKey;
  label: string;
  /** Achievement icon path segment under content-icons/achievements */
  iconKey: string;
};

/**
 * Eight Paths — labels from content pack / mastery docs.
 * iconKey follows files in public/media/content-icons/achievements
 * (some filenames use the doc spelling, not the ledger key).
 */
export const WEAPONS: WeaponDefinition[] = [
  {
    key: "spada_a_uno_mano",
    label: "Одноручный меч",
    iconKey: "mastery.spada_a_uno_mano.rank",
  },
  {
    key: "due_spade",
    label: "Два меча",
    iconKey: "mastery.due_spade.rank",
  },
  {
    key: "spada_e_scudo",
    label: "Меч и щит",
    iconKey: "mastery.spada_e_scudo.rank",
  },
  {
    key: "spada_a_due_mani",
    label: "Двуручный меч",
    iconKey: "mastery.spada_a_due_mani.rank",
  },
  {
    key: "spadone",
    label: "Спадоне",
    iconKey: "mastery.spadone.rank",
  },
  {
    key: "acia_alabarda",
    label: "Топор и алебарда",
    iconKey: "mastery.ascia_e_alabarda.rank",
  },
  {
    key: "spiedo_partesana",
    label: "Копьё и протазан",
    iconKey: "mastery.spiedo_e_partesana.rank",
  },
  {
    key: "spiedo_e_scudo",
    label: "Копьё и щит",
    iconKey: "mastery.spiedo_e_scudo.rank",
  },
];

/** Displayed mastery points thresholds for ranks 0–10 (doc 103). */
export const MASTERY_RANK_THRESHOLDS_POINTS = [
  0, 2000, 6000, 12000, 20000, 30000, 42000, 56000, 72000, 90000, 110000,
] as const;

export const MASTERY_MAX_RANK = 10;

/** Ledger: 10_000 units = 1 displayed mastery point (doc 103). */
export function masteryUnitsToPoints(units: number): number {
  return units / 10_000;
}

export function clampMasteryRank(rank: number): number {
  if (!Number.isFinite(rank) || rank < 0) return 0;
  if (rank > MASTERY_MAX_RANK) return MASTERY_MAX_RANK;
  return Math.floor(rank);
}

/** Progress inside the current rank toward the next threshold (displayed points). */
export function masteryRankProgress(points: number, rank: number): { value: number; max: number } {
  const r = clampMasteryRank(rank);
  if (r >= MASTERY_MAX_RANK) {
    return { value: 1, max: 1 };
  }
  const floor = MASTERY_RANK_THRESHOLDS_POINTS[r] ?? 0;
  const next = MASTERY_RANK_THRESHOLDS_POINTS[r + 1] ?? floor;
  const span = Math.max(1, next - floor);
  const into = Math.min(span, Math.max(0, points - floor));
  return { value: into, max: span };
}

export function weaponIconUrl(weapon: WeaponDefinition): string {
  return achievementIconUrl(weapon.iconKey);
}
