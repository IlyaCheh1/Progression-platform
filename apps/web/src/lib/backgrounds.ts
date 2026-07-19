/** Каталог фонов профиля — зеркало OnlyGames Appearance Service seed. */
export type BackgroundId =
  | "onboarding_background"
  | "northern_lights"
  | "mountain_terrace"
  | "aurora_flow"
  | "cloud_ridge"
  | "crimson_peak"
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
  | "moon"
  | "neon_dragon"
  | "moss_dragon";

export type ProfileBackground = {
  id: BackgroundId;
  label: string;
  category: string;
  unlock: "default" | "purchase";
  src: string;
  /** Цена в золотых монетах (только для unlock: purchase). */
  price?: number;
};

/** Раскладка сцены профиля: куда смотрит фон и где стоят ноги персонажа. */
export type StageBackgroundLayout = {
  backgroundPosition: string;
  /** Доп. классы для контейнера фигуры (поднять/опустить ноги на площадку). */
  figureClassName?: string;
};

/** Пока один общий стартовый фон для всех персонажей. */
export const DEFAULT_BACKGROUND_ID: BackgroundId = "mountain_terrace";
export const ONBOARDING_BACKGROUND_ID: BackgroundId = "onboarding_background";

export function defaultBackgroundForGender(_gender?: "MALE" | "FEMALE"): BackgroundId {
  return DEFAULT_BACKGROUND_ID;
}

/** Numeric legacy keys from ранней версии MoS → OG slug. */
const LEGACY_NUMERIC_MAP: Record<string, BackgroundId> = {
  "1": "northern_lights",
  "2": "prison",
  "3": "building_castle",
  "4": "volcano",
  "5": "northern_lights",
  "6": "grate_wall",
};

const BUY = "/media/backgrounds/buy";

export const PROFILE_BACKGROUNDS: ProfileBackground[] = [
  {
    id: "onboarding_background",
    label: "Зал посвящения",
    category: "onboarding",
    unlock: "default",
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
    id: "mountain_terrace",
    label: "Горная терраса",
    category: "fantasy",
    unlock: "default",
    src: "/media/backgrounds/mountain_terrace.webp",
  },
  {
    id: "aurora_flow",
    label: "Неоновая дымка",
    category: "cosmic",
    unlock: "default",
    src: "/media/backgrounds/aurora_flow.webp",
  },
  {
    id: "cloud_ridge",
    label: "Хребет в облаках",
    category: "nature",
    unlock: "default",
    src: "/media/backgrounds/cloud_ridge.webp",
  },
  {
    id: "crimson_peak",
    label: "Алый пик",
    category: "fantasy",
    unlock: "default",
    src: "/media/backgrounds/crimson_peak.webp",
  },
  {
    id: "prison",
    label: "Тюремная камера",
    category: "fantasy",
    unlock: "purchase",
    price: 250,
    src: `${BUY}/prison.webp`,
  },
  {
    id: "building_castle",
    label: "Холм и замок",
    category: "fantasy",
    unlock: "purchase",
    price: 300,
    src: `${BUY}/building_castle.webp`,
  },
  {
    id: "volcano",
    label: "Вулкан",
    category: "fantasy",
    unlock: "purchase",
    price: 350,
    src: `${BUY}/volcano.webp`,
  },
  {
    id: "grate_wall",
    label: "Великая стена",
    category: "fantasy",
    unlock: "purchase",
    price: 400,
    src: `${BUY}/grate_wall.webp`,
  },
  {
    id: "apocalips_hill_view",
    label: "Пустошь",
    category: "apocalypse",
    unlock: "purchase",
    price: 450,
    src: `${BUY}/apocalips_hill_view.webp`,
  },
  {
    id: "apocalips_city",
    label: "Разрушенный город",
    category: "apocalypse",
    unlock: "purchase",
    price: 450,
    src: `${BUY}/apocalips_city.webp`,
  },
  {
    id: "beach",
    label: "Пляж",
    category: "apocalypse",
    unlock: "purchase",
    price: 500,
    src: `${BUY}/beach.webp`,
  },
  {
    id: "red_squere",
    label: "Красная площадь",
    category: "city",
    unlock: "purchase",
    price: 550,
    src: `${BUY}/red_squere.webp`,
  },
  {
    id: "apocalips_atomic_blow",
    label: "Атомный взрыв",
    category: "apocalypse",
    unlock: "purchase",
    price: 600,
    src: `${BUY}/apocalips_atomic_blow.webp`,
  },
  {
    id: "heaven",
    label: "Рай",
    category: "heaven",
    unlock: "purchase",
    price: 650,
    src: `${BUY}/heaven.webp`,
  },
  {
    id: "moon",
    label: "Лунная панорама",
    category: "cosmic",
    unlock: "purchase",
    price: 700,
    src: `${BUY}/moon.webp`,
  },
  {
    id: "neon_dragon",
    label: "Изумрудный дракон",
    category: "fantasy",
    unlock: "purchase",
    price: 750,
    src: `${BUY}/neon_dragon.webp`,
  },
  {
    id: "moss_dragon",
    label: "Дракон водопада",
    category: "nature",
    unlock: "purchase",
    price: 800,
    src: `${BUY}/moss_dragon.webp`,
  },
];

const BACKGROUND_BY_ID = new Map(PROFILE_BACKGROUNDS.map((item) => [item.id, item]));

/** Фоны из папки buy — доступны в лавке за золотые монеты. */
export const STORE_BACKGROUNDS = PROFILE_BACKGROUNDS.filter((item) => item.unlock === "purchase");

/** Подгонка ног персонажа под горизонт/площадку конкретного фона. */
export const STAGE_LAYOUT_BY_BACKGROUND: Partial<Record<BackgroundId, StageBackgroundLayout>> = {
  mountain_terrace: {
    // Каменная площадка в нижней трети кадра; чуть поднимаем точку привязки,
    // чтобы ноги стояли на плитах, а не на обрыве у низа картинки.
    backgroundPosition: "center 72%",
    figureClassName: "character-stage-figure--terrace mb-[3vh] md:mb-[5vh]",
  },
};

export function stageLayoutForBackground(id?: string | null): StageBackgroundLayout {
  const normalized = normalizeBackgroundId(id);
  return (
    STAGE_LAYOUT_BY_BACKGROUND[normalized] ?? {
      backgroundPosition: "center center",
    }
  );
}

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

export function backgroundStorePrice(id: BackgroundId): number {
  return BACKGROUND_BY_ID.get(id)?.price ?? 0;
}
