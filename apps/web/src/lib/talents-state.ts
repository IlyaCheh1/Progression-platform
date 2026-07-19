import {
  MAX_FAVORITE_SKILLS,
  STARTING_SKILL_POINTS,
  buildTalentTrees,
  type MosTalent,
  type MosTalentTree,
} from "@/lib/talents-catalog";

const STORAGE_KEY = "mos.talents.v1";

export type TalentsPersisted = {
  points: number;
  learned: Record<string, number>; // id -> tier
  activated: string[];
  favorites: string[];
  cooldowns: Record<string, string>; // id -> ISO until
};

function emptyState(): TalentsPersisted {
  return {
    points: STARTING_SKILL_POINTS,
    learned: {},
    activated: [],
    favorites: [],
    cooldowns: {},
  };
}

export function loadTalentsState(): TalentsPersisted {
  if (typeof window === "undefined") return emptyState();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyState();
    const parsed = JSON.parse(raw) as TalentsPersisted;
    return {
      points: typeof parsed.points === "number" ? parsed.points : STARTING_SKILL_POINTS,
      learned: parsed.learned ?? {},
      activated: parsed.activated ?? [],
      favorites: parsed.favorites ?? [],
      cooldowns: parsed.cooldowns ?? {},
    };
  } catch {
    return emptyState();
  }
}

export function saveTalentsState(state: TalentsPersisted) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function applyStateToTrees(state: TalentsPersisted): MosTalentTree[] {
  const now = Date.now();
  return buildTalentTrees().map((tree) => ({
    ...tree,
    skills: tree.skills.map((skill) => {
      const tier = state.learned[skill.id] ?? 0;
      const cooldownUntil = state.cooldowns[skill.id];
      const onCooldown = Boolean(cooldownUntil && new Date(cooldownUntil).getTime() > now);
      return {
        ...skill,
        tier,
        isLearned: tier > 0,
        isActivated: state.activated.includes(skill.id),
        isFavorite: state.favorites.includes(skill.id),
        isOnCooldown: onCooldown,
        cooldownUntil: onCooldown ? cooldownUntil : undefined,
      };
    }),
  }));
}

export function canLearnTalent(talent: MosTalent, skills: MosTalent[], points: number): boolean {
  if (talent.isLearned) return false;
  if (talent.maxTier <= 0) return false;
  if (points < talent.skillPointsCost) return false;
  if (talent.requiredTalents.length === 0) return true;
  const required = talent.requiredTalents
    .map((id) => skills.find((s) => s.id === id))
    .filter(Boolean) as MosTalent[];
  if (required.length !== talent.requiredTalents.length) return false;
  return required.every((t) => t.isLearned);
}

export function learnTalentInState(state: TalentsPersisted, talent: MosTalent): TalentsPersisted | { error: string } {
  if (talent.maxTier <= 0) return { error: "Умение пока недоступно" };
  if ((state.learned[talent.id] ?? 0) > 0) return { error: "Уже изучено" };
  if (state.points < talent.skillPointsCost) return { error: "Недостаточно очков умений" };
  return {
    ...state,
    points: state.points - talent.skillPointsCost,
    learned: { ...state.learned, [talent.id]: 1 },
  };
}

export function activateTalentInState(state: TalentsPersisted, talent: MosTalent): TalentsPersisted | { error: string } {
  if (!(state.learned[talent.id] > 0)) return { error: "Сначала изучите умение" };
  const until = state.cooldowns[talent.id];
  if (until && new Date(until).getTime() > Date.now()) {
    return { error: "Умение на перезарядке" };
  }
  const next: TalentsPersisted = {
    ...state,
    activated: state.activated.includes(talent.id)
      ? state.activated
      : [...state.activated, talent.id],
  };
  if (talent.type === "ACTIVE_TYPE" && talent.cooldownSeconds > 0) {
    next.cooldowns = {
      ...state.cooldowns,
      [talent.id]: new Date(Date.now() + talent.cooldownSeconds * 1000).toISOString(),
    };
  }
  return next;
}

export function toggleFavoriteInState(state: TalentsPersisted, talentId: string): TalentsPersisted | { error: string } {
  const isFav = state.favorites.includes(talentId);
  if (!isFav && state.favorites.length >= MAX_FAVORITE_SKILLS) {
    return { error: `В избранном максимум ${MAX_FAVORITE_SKILLS} умения` };
  }
  if (!(state.learned[talentId] > 0)) return { error: "Сначала изучите умение" };
  return {
    ...state,
    favorites: isFav ? state.favorites.filter((id) => id !== talentId) : [...state.favorites, talentId],
  };
}

export function favoriteTalentsFromTrees(trees: MosTalentTree[], favorites: string[]): MosTalent[] {
  const map = new Map(trees.flatMap((t) => t.skills).map((s) => [s.id, s]));
  return favorites.map((id) => map.get(id)).filter(Boolean) as MosTalent[];
}
