import starter from "../../public/content/starter.json";

export type Quest = { key: string; title: string; type: string; xp: number };
export type Achievement = { key: string; title: string; tiers: number | number[]; xp: number };
export type Talent = { key: string; title: string; rank: number };
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

export const content = starter as {
  quests: Quest[];
  achievements: Achievement[];
  talents: Talent[];
  items: ContentItem[];
  rewards: RewardBundle[];
  schools: School[];
};

export const directions = content.schools;
