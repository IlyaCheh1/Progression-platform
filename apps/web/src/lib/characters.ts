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

export const OG_CHARACTERS: OgCharacter[] = [
  {
    id: "1",
    slug: "black-assassin",
    name: "Тень клинка",
    description:
      "Мастер короткой дистанции: тихий вход, точный укол, исчезновение. Учит чувствовать момент атаки раньше, чем противник поднимет оружие",
    gender: "male",
    bonus: "+5% К опыту",
    avatarSrc: "/media/characters/male/black-assassin/avatar.webp",
    fullSrc: "/media/characters/male/black-assassin/full.webp",
    thumbnailSrc: "/media/characters/male/black-assassin/thumbnail.webp",
  },
  {
    id: "2",
    slug: "god-with-hammer",
    name: "Страж зала",
    description:
      "Сила в стойке и надёжная защита. Любит тяжёлое оружие, крепкий хват и sparring, после которого звенит даже тренировочный меч",
    gender: "male",
    bonus: "+1% Скидка на экипировку",
    avatarSrc: "/media/characters/male/god-with-hammer/avatar.webp",
    fullSrc: "/media/characters/male/god-with-hammer/full.webp",
    thumbnailSrc: "/media/characters/male/god-with-hammer/thumbnail.webp",
  },
  {
    id: "3",
    slug: "orange-hot-dog",
    name: "Искра",
    description:
      "Новичок с огнём в глазах: ещё путает стойки, но уже рвётся в бой. Идеальный старт пути — от первой тренировки до первых побед в зале",
    gender: "male",
    bonus: "+2% К наградам зала",
    avatarSrc: "/media/characters/male/orange-hot-dog/avatar.webp",
    fullSrc: "/media/characters/male/orange-hot-dog/full.webp",
    thumbnailSrc: "/media/characters/male/orange-hot-dog/thumbnail.webp",
  },
  {
    id: "4",
    slug: "pink-superhero",
    name: "Чемпион ринга",
    description:
      "Живёт турнирами и аплодисментами. Яркая техника, смелые атаки и привычка превращать каждый поединок в маленькое шоу",
    gender: "male",
    bonus: "+1 Бесплатная тренировка",
    avatarSrc: "/media/characters/male/pink-superhero/avatar.webp",
    fullSrc: "/media/characters/male/pink-superhero/full.webp",
    thumbnailSrc: "/media/characters/male/pink-superhero/thumbnail.webp",
  },
  {
    id: "5",
    slug: "purple-courier",
    name: "Гонцовый клинок",
    description:
      "Скорость ног важнее силы удара. Легкий шаг, резкая смена дистанции и умение оказаться там, куда противник ещё не успел посмотреть",
    gender: "male",
    bonus: "+1 Очко талантов",
    avatarSrc: "/media/characters/male/purple-courier/avatar.webp",
    fullSrc: "/media/characters/male/purple-courier/full.webp",
    thumbnailSrc: "/media/characters/male/purple-courier/thumbnail.webp",
  },
  {
    id: "6",
    slug: "gray-business-girl",
    name: "Маэстра",
    description:
      "Дисциплина, контроль и холодный расчёт. Ведёт бой как партитуру: каждый шаг, укол и защита — строго по замыслу",
    gender: "female",
    bonus: "+1 Месяц подписки",
    avatarSrc: "/media/characters/female/gray-business-girl/avatar.webp",
    fullSrc: "/media/characters/female/gray-business-girl/full.webp",
    thumbnailSrc: "/media/characters/female/gray-business-girl/thumbnail.webp",
  },
  {
    id: "7",
    slug: "pink-costume-girl",
    name: "Валькирия зала",
    description:
      "Смешивает школы и стили без страха ошибиться. Любит эксперименты, новые клинки и тренировки, где можно рискнуть ради красивого приёма",
    gender: "female",
    bonus: "+1% Скидка на экипировку",
    avatarSrc: "/media/characters/female/pink-costume-girl/avatar.webp",
    fullSrc: "/media/characters/female/pink-costume-girl/full.webp",
    thumbnailSrc: "/media/characters/female/pink-costume-girl/thumbnail.webp",
  },
  {
    id: "8",
    slug: "red-dress-girl",
    name: "Алая рапира",
    description:
      "Страсть испанской школы: дерзкий темп, опасная дистанция и улыбка, от которой противник забывает про защиту",
    gender: "female",
    bonus: "+1 Очко талантов",
    avatarSrc: "/media/characters/female/red-dress-girl/avatar.webp",
    fullSrc: "/media/characters/female/red-dress-girl/full.webp",
    thumbnailSrc: "/media/characters/female/red-dress-girl/thumbnail.webp",
  },
  {
    id: "9",
    slug: "white-dress-elf",
    name: "Белая гвардия",
    description:
      "Классическая точность и безупречная линия клинка. Побеждает не силой, а чистотой техники и спокойствием в решающий миг",
    gender: "female",
    bonus: "+5% К опыту",
    avatarSrc: "/media/characters/female/white-dress-elf/avatar.webp",
    fullSrc: "/media/characters/female/white-dress-elf/full.webp",
    thumbnailSrc: "/media/characters/female/white-dress-elf/thumbnail.webp",
  },
  {
    id: "10",
    slug: "yellow-miner-girl",
    name: "Стальная воля",
    description:
      "Закалена бесконечными кругами и тяжёлой работой в зале. Не сдаётся в конце спарринга — именно тогда её клинок становится опаснее всего",
    gender: "female",
    bonus: "+250 Крышек за уровень",
    avatarSrc: "/media/characters/female/yellow-miner-girl/avatar.webp",
    fullSrc: "/media/characters/female/yellow-miner-girl/full.webp",
    thumbnailSrc: "/media/characters/female/yellow-miner-girl/thumbnail.webp",
  },
];

const BY_ID = new Map(OG_CHARACTERS.map((item) => [item.id, item]));

const LEGACY_SKIN_TO_CHARACTER: Record<string, OgCharacterId> = {
  novice: "1",
  scholar: "3",
  duelist: "4",
  shield: "2",
  polearm: "5",
};

export function getCharacterById(id?: string | null): OgCharacter | null {
  if (!id) return null;
  return BY_ID.get(id as OgCharacterId) ?? null;
}

export function charactersForGender(gender: "MALE" | "FEMALE"): OgCharacter[] {
  const ogGender = gender === "FEMALE" ? "female" : "male";
  return OG_CHARACTERS.filter((item) => item.gender === ogGender);
}

export function normalizeSelectedSkinId(value?: string | null, gender: "MALE" | "FEMALE" = "MALE"): OgCharacterId {
  const raw = (value ?? "").trim();
  if (BY_ID.has(raw as OgCharacterId)) {
    const character = BY_ID.get(raw as OgCharacterId)!;
    const ogGender = gender === "FEMALE" ? "female" : "male";
    if (character.gender === ogGender) return character.id;
  }
  if (LEGACY_SKIN_TO_CHARACTER[raw]) {
    const mapped = LEGACY_SKIN_TO_CHARACTER[raw];
    const character = BY_ID.get(mapped)!;
    const ogGender = gender === "FEMALE" ? "female" : "male";
    if (character.gender === ogGender) return mapped;
  }
  return DEFAULT_SELECTED_SKIN[gender];
}

export function characterAvatarPath(selectedSkinId?: string | null, gender: "MALE" | "FEMALE" = "MALE"): string {
  const id = normalizeSelectedSkinId(selectedSkinId, gender);
  return getCharacterById(id)?.avatarSrc ?? "/media/characters/male/orange-hot-dog/avatar.webp";
}

export function characterFullPath(selectedSkinId?: string | null, gender: "MALE" | "FEMALE" = "MALE"): string {
  const id = normalizeSelectedSkinId(selectedSkinId, gender);
  return getCharacterById(id)?.fullSrc ?? "/media/characters/male/orange-hot-dog/full.webp";
}

export function characterInitial(selectedSkinId?: string | null, gender: "MALE" | "FEMALE" = "MALE"): string {
  const character = getCharacterById(normalizeSelectedSkinId(selectedSkinId, gender));
  return character?.name[0]?.toUpperCase() ?? "У";
}

export const CENTER_CAROUSEL_INDEX = 2;
