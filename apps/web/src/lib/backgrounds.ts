/** Каталог фонов профиля — зеркало OnlyGames Appearance Service seed. */
export type BackgroundId =
  | "onboarding_background"
  | "northern_lights"
  | "prison"
  | "building_castle"
  | "volcano"
  | "grate_wall"
  | "apocalips_hill_view"
  | "apocalips_city"
  | "beach"
  | "red_squere"
  | "apocalips_atomic_blow"
  | "heaven"
  | "moon";

export type ProfileBackground = {
  id: BackgroundId;
  label: string;
  category: string;
  unlock: "default" | "subscription" | "purchase" | "onboarding";
  src: string;
};

export const DEFAULT_BACKGROUND_ID: BackgroundId = "northern_lights";
export const ONBOARDING_BACKGROUND_ID: BackgroundId = "onboarding_background";

/** Numeric legacy keys from ранней версии MoS → OG slug. */
const LEGACY_NUMERIC_MAP: Record<string, BackgroundId> = {
  "1": "northern_lights",
  "2": "prison",
  "3": "building_castle",
  "4": "volcano",
  "5": "northern_lights",
  "6": "grate_wall",
};

export const PROFILE_BACKGROUNDS: ProfileBackground[] = [
  {
    id: "onboarding_background",
    label: "Onboarding",
    category: "onboarding",
    unlock: "onboarding",
    src: "/media/backgrounds/onboarding_background.webp",
  },
  {
    id: "northern_lights",
    label: "Северное сияние",
    category: "nature",
    unlock: "default",
    src: "/media/backgrounds/northern_lights.webp",
  },
  {
    id: "prison",
    label: "Тюремная камера",
    category: "fantasy",
    unlock: "default",
    src: "/media/backgrounds/prison.webp",
  },
  {
    id: "building_castle",
    label: "Холм и замок",
    category: "fantasy",
    unlock: "default",
    src: "/media/backgrounds/building_castle.webp",
  },
  {
    id: "volcano",
    label: "Вулкан",
    category: "fantasy",
    unlock: "default",
    src: "/media/backgrounds/volcano.webp",
  },
  {
    id: "grate_wall",
    label: "Великая стена",
    category: "fantasy",
    unlock: "subscription",
    src: "/media/backgrounds/grate_wall.webp",
  },
  {
    id: "apocalips_hill_view",
    label: "Пустошь",
    category: "apocalypse",
    unlock: "subscription",
    src: "/media/backgrounds/apocalips_hill_view.webp",
  },
  {
    id: "apocalips_city",
    label: "Разрушенный город",
    category: "apocalypse",
    unlock: "subscription",
    src: "/media/backgrounds/apocalips_city.webp",
  },
  {
    id: "beach",
    label: "Пляж",
    category: "apocalypse",
    unlock: "subscription",
    src: "/media/backgrounds/beach.webp",
  },
  {
    id: "red_squere",
    label: "Красная площадь",
    category: "city",
    unlock: "purchase",
    src: "/media/backgrounds/red_squere.webp",
  },
  {
    id: "apocalips_atomic_blow",
    label: "Атомный взрыв",
    category: "apocalypse",
    unlock: "purchase",
    src: "/media/backgrounds/apocalips_atomic_blow.webp",
  },
  {
    id: "heaven",
    label: "Рай",
    category: "heaven",
    unlock: "purchase",
    src: "/media/backgrounds/heaven.webp",
  },
  {
    id: "moon",
    label: "Лунная панорама",
    category: "cosmic",
    unlock: "purchase",
    src: "/media/backgrounds/moon.webp",
  },
];

const BACKGROUND_BY_ID = new Map(PROFILE_BACKGROUNDS.map((item) => [item.id, item]));

export function getBackgroundById(id?: string | null): ProfileBackground | null {
  const raw = (id ?? "").trim();
  if (!raw) return null;
  if (BACKGROUND_BY_ID.has(raw as BackgroundId)) {
    return BACKGROUND_BY_ID.get(raw as BackgroundId) ?? null;
  }
  if (LEGACY_NUMERIC_MAP[raw]) {
    return BACKGROUND_BY_ID.get(LEGACY_NUMERIC_MAP[raw]) ?? null;
  }
  return null;
}

export function normalizeBackgroundId(value?: string | null): BackgroundId {
  const raw = (value ?? "").trim();
  if (!raw) return DEFAULT_BACKGROUND_ID;
  if (BACKGROUND_BY_ID.has(raw as BackgroundId)) return raw as BackgroundId;
  if (LEGACY_NUMERIC_MAP[raw]) return LEGACY_NUMERIC_MAP[raw];
  return DEFAULT_BACKGROUND_ID;
}

export function backgroundImagePath(value?: string | null): string {
  const id = normalizeBackgroundId(value);
  return BACKGROUND_BY_ID.get(id)?.src ?? "/media/backgrounds/default.png";
}

export function onboardingBackgroundPath(): string {
  return BACKGROUND_BY_ID.get(ONBOARDING_BACKGROUND_ID)?.src ?? "/media/backgrounds/onboarding_background.webp";
}

export function isKnownBackgroundId(value: string): boolean {
  return BACKGROUND_BY_ID.has(value as BackgroundId) || Boolean(LEGACY_NUMERIC_MAP[value]);
}
