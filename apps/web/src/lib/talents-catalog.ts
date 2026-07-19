/** Каталог деревьев талантов MoS — из content store (starter.json / GET /v1/talents/catalog). */

import { talentIconUrl } from "@/lib/content-icons";

export type TalentTreeType = "blade" | "chronicle" | "path" | "school";
export type TalentKind = "PASSIVE" | "ACTIVE_TYPE";

export type ContentTalentTree = {
  id: string;
  title: string;
  theme: TalentTreeType | string;
};

export type ContentTalent = {
  key: string;
  title: string;
  rank: number;
  description?: string;
  treeId?: string;
  kind?: TalentKind;
  position?: [number, number];
  requires?: string[];
  maxTier?: number;
  cooldownSeconds?: number;
  effects?: Record<string, string>;
  icon?: string;
};

export type TalentCatalogResponse = {
  trees: ContentTalentTree[];
  talents: ContentTalent[];
};

export type MosTalent = {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  type: TalentKind;
  position: [number, number];
  requiredTalents: string[];
  tier: number;
  maxTier: number;
  skillPointsCost: number;
  cooldownSeconds: number;
  effects: Record<string, string>;
  isLearned: boolean;
  isActivated: boolean;
  isFavorite: boolean;
  isOnCooldown: boolean;
  cooldownUntil?: string;
};

export type MosTalentTree = {
  type: TalentTreeType;
  name: string;
  matrix: string[][];
  skills: MosTalent[];
};

const DEFAULT_TREES: ContentTalentTree[] = [
  { id: "arsenal.paths", title: "Путь клинка", theme: "blade" },
  { id: "wolf.brotherhood", title: "Братство Волка", theme: "path" },
  { id: "codex.lore", title: "Кодекс", theme: "chronicle" },
];


function toMosTalent(t: ContentTalent): MosTalent {
  const kind = t.kind ?? "PASSIVE";
  const maxTier = t.maxTier ?? 1;
  const effects =
    t.effects ??
    (t.description ? { Эффект: t.description } : {});

  return {
    id: t.key,
    name: t.title,
    description: t.description ?? "",
    imageUrl: talentIconUrl(t.key, t.icon),
    type: kind,
    position: t.position ?? [5, 3],
    requiredTalents: t.requires ?? [],
    tier: 0,
    maxTier,
    skillPointsCost: 1,
    cooldownSeconds: t.cooldownSeconds ?? 0,
    effects,
    isLearned: false,
    isActivated: false,
    isFavorite: false,
    isOnCooldown: false,
  };
}

function matrixFromSkills(skills: MosTalent[], rows = 6, cols = 7): string[][] {
  const matrix = Array.from({ length: rows }, () => Array.from({ length: cols }, () => "0"));
  for (const skill of skills) {
    const [r, c] = skill.position;
    if (r >= 0 && r < rows && c >= 0 && c < cols) matrix[r][c] = "1";
  }
  return matrix;
}

export function buildTalentTreesFromCatalog(catalog: TalentCatalogResponse): MosTalentTree[] {
  const trees = catalog.trees.length > 0 ? catalog.trees : DEFAULT_TREES;
  const byTree = new Map<string, ContentTalent[]>();

  for (const talent of catalog.talents) {
    const treeId = talent.treeId ?? "unknown";
    const list = byTree.get(treeId) ?? [];
    list.push(talent);
    byTree.set(treeId, list);
  }

  return trees.map((treeDef) => {
    const skills = (byTree.get(treeDef.id) ?? []).map(toMosTalent);
    return {
      type: treeDef.theme as TalentTreeType,
      name: treeDef.title,
      matrix: matrixFromSkills(skills),
      skills,
    };
  });
}

export const TREE_LABEL_CLASS: Record<TalentTreeType, string> = {
  blade: "text-[#7dba5a]",
  chronicle: "text-[#6b9fff]",
  path: "text-mos-amber",
  school: "text-[#ee4810]",
};

export const TREE_GRADIENT: Record<TalentTreeType, "green" | "blue" | "amber" | "orange"> = {
  blade: "green",
  chronicle: "blue",
  path: "amber",
  school: "orange",
};

export const TREE_BORDER_COLOR: Record<TalentTreeType, string> = {
  blade: "#7dba5a",
  chronicle: "#2d68ff",
  path: "#d4a84b",
  school: "#ee4810",
};

export const MAX_FAVORITE_SKILLS = 3;

/** Доступные очки: уровень (+1 за каждый) + бонус образа − потраченные на изучение. */
export function availableTalentPoints(level: number, characterBonus: number, spent: number): number {
  const earned = Math.max(1, Math.floor(level)) + Math.max(0, Math.floor(characterBonus));
  return Math.max(0, earned - Math.max(0, Math.floor(spent)));
}
