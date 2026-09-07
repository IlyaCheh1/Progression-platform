export type PromoItem = {
  id: string;
  title: string;
  teaser: string;
  badge: string;
  href: string;
};

export const LANDING_PROMOS: PromoItem[] = [
  {
    id: "family",
    title: "Семейный абонемент",
    teaser: "50% на второй абонемент внутри семьи — дети, родители, сёстры и братья.",
    badge: "Скидка",
    href: "/tariffs",
  },
  {
    id: "trial",
    title: "Пробное занятие",
    teaser: "Первый выход в зал за 1 000 ₽ — знакомство с тренером и направлением.",
    badge: "Старт",
    href: "/contact",
  },
  {
    id: "kids-wushu",
    title: "Детское ушу с 6 лет",
    teaser: "Группа «Клинки Востока» для детей. Место и расписание уточняются — это черновик акции.",
    badge: "Дети",
    href: "/?audience=kids#directions",
  },
];
