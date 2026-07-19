import starter from "../../public/content/starter.json";

export type Quest = {
  key: string;
  title: string;
  type: string;
  xp: number;
  /** Золотые монеты вместо/вместе с XP. */
  coins?: number;
  description?: string;
  icon?: string;
};
export type Achievement = {
  key: string;
  title: string;
  tiers: number | number[];
  xp: number;
  /** Золотые монеты вместо/вместе с XP. */
  coins?: number;
  description?: string;
  icon?: string;
};

export type RewardKind = "xp" | "coins";

export function rewardKindOf(item: { xp?: number; coins?: number }): RewardKind {
  return (item.coins ?? 0) > 0 && (item.xp ?? 0) <= 0 ? "coins" : "xp";
}

export function rewardValueOf(item: { xp?: number; coins?: number }, stageIndex = 0): number {
  const coins = item.coins ?? 0;
  if (coins > 0 && (item.xp ?? 0) <= 0) {
    return coins * (stageIndex + 1);
  }
  if ((item.xp ?? 0) > 0) return item.xp ?? 0;
  return 100;
}
export type Talent = {
  key: string;
  title: string;
  rank: number;
  description?: string;
  treeId?: string;
  kind?: string;
  position?: [number, number];
  requires?: string[];
  maxTier?: number;
  cooldownSeconds?: number;
  effects?: Record<string, string>;
  icon?: string;
};
export type TalentTree = { id: string; title: string; theme: string };
export type School = { key: string; title: string; description: string };
export type ContentItem = {
  key: string;
  title: string;
  type: string;
  category: string;
};
export type RewardBundle = {
  key: string;
  title: string;
  components: string;
};

export const content = starter as unknown as {
  quests: Quest[];
  achievements: Achievement[];
  talents: Talent[];
  talentTrees: TalentTree[];
  items: ContentItem[];
  rewards: RewardBundle[];
  schools: School[];
};

export const directions = content.schools;
