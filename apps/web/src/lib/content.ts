import starter from "../../public/content/starter.json";

export type Quest = { key: string; title: string; type: string; xp: number; icon?: string };
export type Achievement = { key: string; title: string; tiers: number | number[]; xp: number; icon?: string };
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
