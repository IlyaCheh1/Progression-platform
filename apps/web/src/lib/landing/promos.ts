export type PromoTariffChoice = {
  title: string;
  price: string;
  note: string;
};

/** Public landing prices. There is no entrance fee. */
export const PROMO_TARIFF_CHOICES: PromoTariffChoice[] = [
  { title: "Пробное занятие", price: "1 000 ₽", note: "одно посещение" },
  { title: "Групповой абонемент", price: "от 5 000 ₽", note: "в месяц · 1 раз в неделю" },
  { title: "Разовое групповое", price: "2 000 ₽", note: "одно занятие без абонемента" },
  { title: "Индивидуальное разовое", price: "4 000 ₽", note: "час с тренером" },
  { title: "Индивидуальный абонемент", price: "от 12 800 ₽", note: "в месяц · 1 раз в неделю" },
  { title: "Онлайн", price: "4 000 ₽", note: "час в дистанционном формате" },
];

export const PROMO_NO_ENTRANCE_FEE = "Отдельного вступительного взноса нет. Оплачивается выбранный тариф.";

export type PromoItem = {
  id: string;
  slug: string;
  title: string;
  teaser: string;
  badge: string;
  image: string;
  featured: boolean;
  showOnKids: boolean;
  lead: string;
  paragraphs: string[];
  includedLabel: string;
  included: string[];
  signup: string;
  signupHref: string;
  footnotes: string[];
};

export const LANDING_PROMOS: PromoItem[] = [
  {
    id: "second-subscription",
    slug: "vtoroj-abonement",
    title: "Второй абонемент за полцены",
    teaser: "50% на второй групповой абонемент — для пары и для семьи. Курсы: Клинки Востока, Итальянская рапира, Иберийский двуручный меч.",
    badge: "−50%",
    image: "/media/formats/group.webp",
    featured: true,
    showOnKids: true,
    lead: "50% на второй групповой абонемент для влюблённых и внутри семьи.",
    paragraphs: [
      "50% скидка на второй абонемент для влюблённых. 50% скидка на второй абонемент внутри семьи: дети и родители, сёстры и братья.",
      "Скидка считается от стоимости второго группового абонемента. Первый абонемент оплачивается по тарифу школы.",
    ],
    includedLabel: "Про курсы",
    included: ["Клинки Востока", "Итальянская рапира", "Иберийский двуручный меч"],
    signup: "Оформить абонемент можно в тарифах на главной.",
    signupHref: "/#tariffs",
    footnotes: [
      "50% считается от стоимости второго группового абонемента.",
      "Скидка действует на курсах: Клинки Востока, Итальянская рапира, Иберийский двуручный меч.",
    ],
  },
  {
    id: "trial",
    slug: "probnoe-zanyatie",
    title: "Пробное занятие",
    teaser: "Первый выход в зал за 1 000 ₽ — знакомство с тренером и направлением.",
    badge: "1 000 ₽",
    image: "/media/formats/solo.webp",
    featured: false,
    showOnKids: false,
    lead: "Пробное занятие в зале — 1 000 ₽.",
    paragraphs: [
      "Одно посещение, чтобы познакомиться с техникой, тренером и залом.",
      "В занятие входят знакомство с тренером и базовая безопасность.",
    ],
    includedLabel: "Что входит",
    included: ["Одно посещение", "Знакомство с тренером", "Базовая безопасность"],
    signup: "Запись открывается с тарифа «Пробное занятие».",
    signupHref: "/#tariffs",
    footnotes: ["Цена пробного занятия — 1 000 ₽."],
  },
  {
    id: "kids-wushu",
    slug: "pervoe-zanyatie",
    title: "Первое занятие бесплатно",
    teaser: "Детская секция ушу. Набор от 6 лет. Количество мест ограничено. Тренер Татьяна: +7 (915) 048-61-60.",
    badge: "Бесплатно",
    image: "/media/hero/kids-wushu-hero-16x9.webp",
    featured: false,
    showOnKids: true,
    lead: "Первое занятие в детской секции ушу бесплатно.",
    paragraphs: [
      "Набор от 6 лет. Количество мест ограничено.",
      "Тренер Татьяна: +7 (915) 048-61-60.",
    ],
    includedLabel: "Что входит",
    included: ["Первое занятие бесплатно", "Набор от 6 лет", "Количество мест ограничено"],
    signup: "Запись в детскую секцию: +7 (915) 048-61-60.",
    signupHref: "/kids#join",
    footnotes: ["Бесплатно только первое занятие. Дальше действуют тарифы школы."],
  },
];

export function getLandingPromo(slug: string): PromoItem | undefined {
  return LANDING_PROMOS.find((item) => item.slug === slug);
}
