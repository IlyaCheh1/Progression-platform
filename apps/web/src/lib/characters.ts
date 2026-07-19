/** Каталог образов учеников школы «Мастер меча». */
export type OgCharacterId = "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" | "10";
export type OgCharacterGender = "male" | "female";

export type OgCharacter = {
  id: OgCharacterId;
  slug: string;
  name: string;
  description: string;
  gender: OgCharacterGender;
  bonus?: string;
  avatarSrc: string;
  fullSrc: string;
  thumbnailSrc: string;
};

export const DEFAULT_SELECTED_SKIN: Record<"MALE" | "FEMALE", OgCharacterId> = {
  MALE: "3",
  FEMALE: "8",
};

/** Стартовые образы онбординга: один мужской и один женский. */
export const OG_CHARACTERS: OgCharacter[] = [
  {
    id: "3",
    slug: "sword-master",
    name: "Мастер клинка",
    description:
      "Спокойная стойка и уверенный хват длинного меча. Учит держать дистанцию, читать противника и заканчивать обмен одним точным ударом",
    gender: "male",
    bonus: "+2% К наградам зала",
    avatarSrc: "/media/characters/male/sword-master/avatar.webp",
    fullSrc: "/media/characters/male/sword-master/full.webp",
    thumbnailSrc: "/media/characters/male/sword-master/thumbnail.webp",
  },
  {
    id: "8",
    slug: "staff-adept",
    name: "Хранительница шеста",
    description:
      "Сидячая готовность и контроль шеста. Чувствует ритм боя, ловит момент входа и отвечает резкой сменой дистанции",
    gender: "female",
    bonus: "+1 Очко талантов",
    avatarSrc: "/media/characters/female/staff-adept/avatar.webp",
    fullSrc: "/media/characters/female/staff-adept/full.webp",
    thumbnailSrc: "/media/characters/female/staff-adept/thumbnail.webp",
  },
];

const BY_ID = new Map(OG_CHARACTERS.map((item) => [item.id, item]));

const LEGACY_SKIN_TO_CHARACTER: Record<string, OgCharacterId> = {
  novice: "3",
  scholar: "3",
  duelist: "3",
  shield: "3",
  polearm: "3",
};

/** Старые id образов → актуальный стартовый образ того же пола. */
const LEGACY_CHARACTER_ID_ALIAS: Record<string, OgCharacterId> = {
  "1": "3",
  "2": "3",
  "4": "3",
  "5": "3",
  "6": "8",
  "7": "8",
  "9": "8",
  "10": "8",
};

export function getCharacterById(id?: string | null): OgCharacter | null {
  if (!id) return null;
  const resolved = (LEGACY_CHARACTER_ID_ALIAS[id] ?? id) as OgCharacterId;
  return BY_ID.get(resolved) ?? null;
}

export function charactersForGender(gender: "MALE" | "FEMALE"): OgCharacter[] {
  const ogGender = gender === "FEMALE" ? "female" : "male";
  return OG_CHARACTERS.filter((item) => item.gender === ogGender);
}

export function normalizeSelectedSkinId(value?: string | null, gender: "MALE" | "FEMALE" = "MALE"): OgCharacterId {
  const raw = (value ?? "").trim();
  const aliased = LEGACY_CHARACTER_ID_ALIAS[raw] ?? raw;
  if (BY_ID.has(aliased as OgCharacterId)) {
    const character = BY_ID.get(aliased as OgCharacterId)!;
    const ogGender = gender === "FEMALE" ? "female" : "male";
    if (character.gender === ogGender) return character.id;
  }
  if (LEGACY_SKIN_TO_CHARACTER[raw]) {
    return LEGACY_SKIN_TO_CHARACTER[raw];
  }
  return DEFAULT_SELECTED_SKIN[gender];
}

export function characterAvatarPath(selectedSkinId?: string | null, gender: "MALE" | "FEMALE" = "MALE"): string {
  const id = normalizeSelectedSkinId(selectedSkinId, gender);
  return getCharacterById(id)?.avatarSrc ?? "/media/characters/male/sword-master/avatar.webp";
}

export function characterFullPath(selectedSkinId?: string | null, gender: "MALE" | "FEMALE" = "MALE"): string {
  const id = normalizeSelectedSkinId(selectedSkinId, gender);
  return getCharacterById(id)?.fullSrc ?? "/media/characters/male/sword-master/full.webp";
}

export function characterInitial(selectedSkinId?: string | null, gender: "MALE" | "FEMALE" = "MALE"): string {
  const character = getCharacterById(normalizeSelectedSkinId(selectedSkinId, gender));
  return character?.name[0]?.toUpperCase() ?? "У";
}

export const CENTER_CAROUSEL_INDEX = 2;
