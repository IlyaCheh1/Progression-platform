/** Каталог деревьев талантов — зеркало OG backend seed (talents/migrations/002). */

export type TalentTreeType = "gamer" | "developer" | "streamer" | "esport";
export type TalentKind = "PASSIVE" | "ACTIVE_TYPE";

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

const CDN = "https://storage.yandexcloud.net/og-main-media/talents";

type SeedTalent = {
  id: string;
  name: string;
  description: string;
  image: string;
  type: TalentKind;
  position: [number, number];
  required: string[];
  maxTier: number;
  cooldownSeconds: number;
  effects: Record<string, string>;
};

function t(
  id: string,
  name: string,
  description: string,
  image: string,
  type: TalentKind,
  position: [number, number],
  required: string[],
  maxTier: number,
  cooldownSeconds: number,
  effects: Record<string, string>,
): SeedTalent {
  return { id, name, description, image, type, position, required, maxTier, cooldownSeconds, effects };
}

function toTalent(seed: SeedTalent): MosTalent {
  return {
    id: seed.id,
    name: seed.name,
    description: seed.description,
    imageUrl: seed.image.startsWith("http") ? seed.image : `${CDN}/${seed.image}`,
    type: seed.type,
    position: seed.position,
    requiredTalents: seed.required,
    tier: 0,
    maxTier: seed.maxTier,
    skillPointsCost: 1,
    cooldownSeconds: seed.cooldownSeconds,
    effects: seed.effects,
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

const GAMER: SeedTalent[] = [
  t("gamer_sniper_discount", "Снайпер скидок", "Раз в неделю можно вручную активировать дополнительную скидку 5% на любую игру.", "gamer/1.webp", "ACTIVE_TYPE", [5, 3], [], 1, 604800, { "Активная скидка": "5%" }),
  t("gamer_lucky_hunter", "Ловец Удачи", "Скидка 40% на игру из раздела Инди. Перезарядка 14 дней.", "gamer/2-1.webp", "ACTIVE_TYPE", [4, 2], ["gamer_sniper_discount"], 1, 1209600, { "Скидка на инди": "50%" }),
  t("gamer_viral_author", "Вирусный автор", "Если твоя статья наберет 500+ лайков, получаешь 100 крышек.", "gamer/2-2.webp", "PASSIVE", [4, 4], ["gamer_sniper_discount"], 1, 0, { "Награда за статью крышками": "100" }),
  t("gamer_top", "Топ", "При активации твой канал попадает в «Рекомендуемое» на один день. Перезарядка 14 дней.", "gamer/2-3.webp", "ACTIVE_TYPE", [4, 6], ["gamer_viral_author"], 1, 1209600, { "Канал в ТОП (час)": "24" }),
  t("gamer_collectioner", "Коллекционер", "Скидка 30% на любое издание. Перезарядка 14 дней.", "gamer/3.webp", "ACTIVE_TYPE", [3, 3], ["gamer_sniper_discount", "gamer_lucky_hunter", "gamer_viral_author"], 1, 1209600, { "Скидка на издание": "30%" }),
  t("gamer_cashback_master", "Кэшбэк Мастер", "% от суммы покупки возвращаются в виде Крышек. Скидка 1%, 2%, 3%.", "gamer/4.webp", "PASSIVE", [2, 2], ["gamer_sniper_discount", "gamer_lucky_hunter", "gamer_viral_author", "gamer_collectioner"], 3, 0, { Кэшбэк: "1-3% от покупки" }),
  t("gamer_loyal_customer", "Верный клиент", "Накопительная скидка: 1% за каждые 1000 потраченных Крышек.", "gamer/5.webp", "PASSIVE", [1, 1], ["gamer_sniper_discount", "gamer_lucky_hunter", "gamer_viral_author", "gamer_collectioner", "gamer_cashback_master"], 3, 0, { "Накопительная скидка до": "25%" }),
  t("gamer_black_friday", "Черная пятница", "За каждые 10 купленных игр от 3000 рублей даётся бесплатная игра из прошлых распродаж.", "gamer/6-1.webp", "PASSIVE", [0, 2], ["gamer_sniper_discount", "gamer_lucky_hunter", "gamer_viral_author", "gamer_collectioner", "gamer_cashback_master", "gamer_loyal_customer"], 1, 0, { "Бесплатная игра": "1" }),
  t("gamer_mass_buyer", "Массовый покупатель", "При покупке 3+ игр в чеке – дополнительная скидка 5%.", "gamer/gamer_default.webp", "PASSIVE", [0, 4], ["gamer_black_friday"], 1, 0, { "Дополнительная скидка": "5%" }),
  t("gamer_lucky_champion", "Счастливчик", "Скидка 35% на любую игру до 2000 рублей. Перезарядка 30 дней.", "gamer/7.webp", "ACTIVE_TYPE", [0, 6], ["gamer_mass_buyer", "gamer_black_friday"], 1, 2592000, { Скидка: "35%" }),
];

const DEVELOPER: SeedTalent[] = [
  t("developer_1", "Coming soon", "Ветка в разработке.", "developer/developer_default.webp", "PASSIVE", [5, 3], [], 0, 0, {}),
  t("developer_2", "Coming soon", "Ветка в разработке.", "developer/developer_default.webp", "ACTIVE_TYPE", [4, 4], ["coming_soon_placeholder"], 0, 0, {}),
  t("developer_3", "Coming soon", "Ветка в разработке.", "developer/developer_default.webp", "PASSIVE", [4, 2], ["coming_soon_placeholder"], 0, 0, {}),
  t("developer_4", "Coming soon", "Ветка в разработке.", "developer/developer_default.webp", "ACTIVE_TYPE", [3, 5], ["coming_soon_placeholder"], 0, 0, {}),
  t("developer_5", "Coming soon", "Ветка в разработке.", "developer/developer_default.webp", "PASSIVE", [3, 1], ["coming_soon_placeholder"], 0, 0, {}),
  t("developer_6", "Coming soon", "Ветка в разработке.", "developer/developer_default.webp", "ACTIVE_TYPE", [2, 6], ["coming_soon_placeholder"], 0, 0, {}),
  t("developer_7", "Coming soon", "Ветка в разработке.", "developer/developer_default.webp", "PASSIVE", [2, 0], ["coming_soon_placeholder"], 0, 0, {}),
  t("developer_8", "Coming soon", "Ветка в разработке.", "developer/developer_default.webp", "ACTIVE_TYPE", [1, 5], ["coming_soon_placeholder"], 0, 0, {}),
  t("developer_9", "Coming soon", "Ветка в разработке.", "developer/developer_default.webp", "ACTIVE_TYPE", [1, 1], ["coming_soon_placeholder"], 0, 0, {}),
];

const STREAMER: SeedTalent[] = [
  t("stream_loyal_wallet", "Лояльный кошелёк", "Каждая 5-я подписка продлевается со скидкой 20%.", "streamer/1.webp", "PASSIVE", [5, 3], [], 1, 0, { "Каждая 5-я подписка (скидка)": "20%" }),
  t("stream_hot_streak", "Горящая Ж", "Даётся особый набор стикеров.", "streamer/2.webp", "PASSIVE", [4, 4], ["stream_loyal_wallet"], 1, 0, { "Особый набор стикеров": "5" }),
  t("stream_permanent_guest", "Постоянный гость", "Получить подписку на канал (один на выбор) на 3 дня. Перезарядка 30 дней.", "streamer/3-1.webp", "ACTIVE_TYPE", [3, 3], ["stream_loyal_wallet", "stream_hot_streak"], 1, 2592000, { "Постоянный гость (дней)": "3" }),
  t("stream_master_all_hands", "Мастер на все руки", "На 1 час попасть в рекомендации в любой категории. Перезарядка 14 дней.", "streamer/3-2.webp", "ACTIVE_TYPE", [3, 5], ["stream_loyal_wallet", "stream_hot_streak"], 1, 1209600, { "Мастер на все руки (час)": "1" }),
  t("stream_unrivaled", "Неподражаемый", "Получить особый значок и цвет в чате на 3 дня. Перезарядка 14 дней.", "streamer/5.webp", "ACTIVE_TYPE", [2, 2], ["stream_loyal_wallet", "stream_hot_streak", "stream_permanent_guest"], 1, 1209600, { "Неподражаемый значок (дней)": "3" }),
  t("stream_world_top", "Вершина мира", "50% стоимости подписки возвращается крышками. Перезарядка 30 дней.", "streamer/6.webp", "ACTIVE_TYPE", [1, 3], ["stream_loyal_wallet", "stream_hot_streak", "stream_permanent_guest", "stream_unrivaled"], 1, 2592000, { "Кэшбэк за подписки": "50%" }),
];

const ESPORT: SeedTalent[] = [
  t("cybersportsman_free_ticket", "Бесплатный вход", "1 бесплатный билет на турнир. Перезарядка 10 дней.", "cybersportsman/1.webp", "ACTIVE_TYPE", [5, 3], [], 1, 864000, { "Бесплатный билет": "1" }),
  t("cybersportsman_legends", "Легенды", "Специальный цвет никнейма или названия команды.", "cybersportsman/2-1.webp", "PASSIVE", [4, 2], ["cybersportsman_free_ticket"], 1, 0, { "Специальный цвет": "1" }),
  t("cybersportsman_luck", "Удача", "Скидка 10% на билет.", "cybersportsman/2-2.webp", "PASSIVE", [4, 4], ["cybersportsman_free_ticket"], 1, 0, { "Скидка на билет": "10%" }),
  t("cybersportsman_backflip", "Камбэк", "При проигрыше на турнире деньги за билет возвращаются. Перезарядка 14 дней.", "cybersportsman/3.webp", "ACTIVE_TYPE", [3, 5], ["cybersportsman_free_ticket", "cybersportsman_legends", "cybersportsman_luck"], 1, 1209600, { "Камбэк возврат": "100%" }),
  t("cybersportsman_victory_bonus", "Бонус за Победу", "5% крышек за первое место.", "cybersportsman/4.webp", "PASSIVE", [2, 6], ["cybersportsman_free_ticket", "cybersportsman_legends", "cybersportsman_luck", "cybersportsman_backflip"], 1, 0, { "Бонус за Победу": "5%" }),
  t("cybersportsman_persona", "Персона", "3 бесплатных билета на турниры. Перезарядка 14 дней.", "cybersportsman/5-1.webp", "ACTIVE_TYPE", [1, 3], ["cybersportsman_free_ticket", "cybersportsman_legends", "cybersportsman_luck", "cybersportsman_backflip", "cybersportsman_victory_bonus"], 1, 1209600, { "Персона бесплатные билеты": "3" }),
  t("cybersportsman_unbeatable", "Бесподобный", "10% крышек за первое место.", "cybersportsman/5-2.webp", "PASSIVE", [1, 5], ["cybersportsman_persona"], 1, 0, { "Бесподобный бонус крышками": "10%" }),
  t("cybersportsman_vip", "VIP", "5 бесплатных билетов на турниры. Перезарядка 30 дней.", "cybersportsman/6.webp", "ACTIVE_TYPE", [0, 6], ["cybersportsman_free_ticket", "cybersportsman_luck", "cybersportsman_backflip", "cybersportsman_victory_bonus", "cybersportsman_persona"], 1, 2592000, { "VIP бесплатные билеты": "5" }),
];

function buildTree(type: TalentTreeType, name: string, seeds: SeedTalent[]): MosTalentTree {
  const skills = seeds.map(toTalent);
  return { type, name, matrix: matrixFromSkills(skills), skills };
}

export function buildTalentTrees(): MosTalentTree[] {
  return [
    buildTree("gamer", "Геймер", GAMER),
    buildTree("developer", "Разработчик", DEVELOPER),
    buildTree("streamer", "Стример", STREAMER),
    buildTree("esport", "Киберспорт", ESPORT),
  ];
}

export const TREE_LABEL_CLASS: Record<TalentTreeType, string> = {
  gamer: "text-[#7dba5a]",
  developer: "text-[#6b9fff]",
  streamer: "text-mos-amber",
  esport: "text-[#ee4810]",
};

export const TREE_GRADIENT: Record<TalentTreeType, "green" | "blue" | "amber" | "orange"> = {
  gamer: "green",
  developer: "blue",
  streamer: "amber",
  esport: "orange",
};

export const TREE_LINE_CLASS: Record<TalentTreeType, string> = {
  gamer: "bg-blade-line-gradient",
  developer: "bg-chronicle-line-gradient",
  streamer: "bg-path-line-gradient",
  esport: "bg-school-line-gradient",
};

export const TREE_BORDER_COLOR: Record<TalentTreeType, string> = {
  gamer: "#7dba5a",
  developer: "#2d68ff",
  streamer: "#d4a84b",
  esport: "#ee4810",
};

export const MAX_FAVORITE_SKILLS = 3;
export const STARTING_SKILL_POINTS = 8;
