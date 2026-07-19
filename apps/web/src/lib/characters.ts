/** Каталог персонажей OnlyGames Appearance Service (seed 002). */
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
    name: "Хакер-ассасин",
    description: "Интроверт, любитель rogue-like игр. Возомнил себя ассасином и крадётся на кухню в костюме",
    gender: "male",
    bonus: "+5% К опыту",
    avatarSrc: "/media/characters/male/black-assassin/avatar.webp",
    fullSrc: "/media/characters/male/black-assassin/full.webp",
    thumbnailSrc: "/media/characters/male/black-assassin/thumbnail.webp",
  },
  {
    id: "2",
    slug: "god-with-hammer",
    name: "Работяга с завода",
    description: "Работает своим молотом так, что только искры летят. А в плаще удобно выносить ништяки с завода",
    gender: "male",
    bonus: "+1% Скидка на маркете",
    avatarSrc: "/media/characters/male/god-with-hammer/avatar.webp",
    fullSrc: "/media/characters/male/god-with-hammer/full.webp",
    thumbnailSrc: "/media/characters/male/god-with-hammer/thumbnail.webp",
  },
  {
    id: "3",
    slug: "orange-hot-dog",
    name: "Предприниматель",
    description: "Начинающий стартапер в поисках инвестиций, а подработка в костюме хот-дога — для души",
    gender: "male",
    bonus: "+2% Кэшбек крышками",
    avatarSrc: "/media/characters/male/orange-hot-dog/avatar.webp",
    fullSrc: "/media/characters/male/orange-hot-dog/full.webp",
    thumbnailSrc: "/media/characters/male/orange-hot-dog/thumbnail.webp",
  },
  {
    id: "4",
    slug: "pink-superhero",
    name: "СуперСтример",
    description: "S — значит Sтример. Любит стримить инди-игры и создавать тренды, а не идти на поводу у толпы",
    gender: "male",
    bonus: "+1 Инди-игра в подарок",
    avatarSrc: "/media/characters/male/pink-superhero/avatar.webp",
    fullSrc: "/media/characters/male/pink-superhero/full.webp",
    thumbnailSrc: "/media/characters/male/pink-superhero/thumbnail.webp",
  },
  {
    id: "5",
    slug: "purple-courier",
    name: "Квадробер-курьер",
    description: "Особо опасный элемент. Но попробовали бы вы поездить на электровелике зимой без шапки…",
    gender: "male",
    bonus: "+1 Очко талантов",
    avatarSrc: "/media/characters/male/purple-courier/avatar.webp",
    fullSrc: "/media/characters/male/purple-courier/full.webp",
    thumbnailSrc: "/media/characters/male/purple-courier/thumbnail.webp",
  },
  {
    id: "6",
    slug: "gray-business-girl",
    name: "Госпожа",
    description: "Любит брать контроль в свои руки. Хранит в сумочке не только документы, но и… геймпад",
    gender: "female",
    bonus: "+1 Месяц подписки",
    avatarSrc: "/media/characters/female/gray-business-girl/avatar.webp",
    fullSrc: "/media/characters/female/gray-business-girl/full.webp",
    thumbnailSrc: "/media/characters/female/gray-business-girl/thumbnail.webp",
  },
  {
    id: "7",
    slug: "pink-costume-girl",
    name: "Хипстерша",
    description: "Любит латте на миндальном, скейты и неудачников. Всегда за разнообразие — в играх и не только",
    gender: "female",
    bonus: "+1% Скидка на маркете",
    avatarSrc: "/media/characters/female/pink-costume-girl/avatar.webp",
    fullSrc: "/media/characters/female/pink-costume-girl/full.webp",
    thumbnailSrc: "/media/characters/female/pink-costume-girl/thumbnail.webp",
  },
  {
    id: "8",
    slug: "red-dress-girl",
    name: "Красная Шапочка",
    description: "Никто так и не понял, она убегает от волка, или он от неё… Любит свою бабулю и пирожки",
    gender: "female",
    bonus: "+1 Очко талантов",
    avatarSrc: "/media/characters/female/red-dress-girl/avatar.webp",
    fullSrc: "/media/characters/female/red-dress-girl/full.webp",
    thumbnailSrc: "/media/characters/female/red-dress-girl/thumbnail.webp",
  },
  {
    id: "9",
    slug: "white-dress-elf",
    name: "Эльфийская принцесса",
    description: "Бессмертна, прекрасна и гораздо мудрее других. Она не стала отдавать кольцо, а воспользовалась им",
    gender: "female",
    bonus: "+5% К опыту",
    avatarSrc: "/media/characters/female/white-dress-elf/avatar.webp",
    fullSrc: "/media/characters/female/white-dress-elf/full.webp",
    thumbnailSrc: "/media/characters/female/white-dress-elf/thumbnail.webp",
  },
  {
    id: "10",
    slug: "yellow-miner-girl",
    name: "Криптовалютчица",
    description: "Умеет майнить не только биток, но и может поработать киркой. Так что лучше не умничай",
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
