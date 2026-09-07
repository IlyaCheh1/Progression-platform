export type FaqItem = {
  id: string;
  question: string;
  answer: string;
  audience: "all" | "adults" | "kids";
};

export const LANDING_FAQ: FaqItem[] = [
  {
    id: "start",
    question: "С чего начать, если я никогда не фехтовал?",
    answer:
      "С пробного занятия. Оружие даёт школа, специальная форма на первый раз не нужна. На пробном тренер подскажет направление.",
    audience: "adults",
  },
  {
    id: "kids-age",
    question: "С какого возраста принимают детей?",
    answer: "Набор в детскую секцию ушу — от 6 лет. Количество мест ограничено.",
    audience: "kids",
  },
  {
    id: "kids-free",
    question: "Сколько стоит первое занятие?",
    answer: "Первое занятие бесплатно. Дальше — запись к Татьяне: +7 (915) 048-61-60.",
    audience: "kids",
  },
  {
    id: "gear",
    question: "Нужно ли своё оружие?",
    answer: "На старте нет. Школа выдаёт учебное оружие. Свой клинок можно принести позже, когда освоите базу.",
    audience: "all",
  },
  {
    id: "formats",
    question: "Какие форматы тренировок есть?",
    answer:
      "Групповые, индивидуальные, сплиты на двоих и парные онлайн. Подробности и цены — на странице тарифов.",
    audience: "adults",
  },
  {
    id: "rpg",
    question: "Что такое RPG-персонаж?",
    answer:
      "Цифровой лист ученика: опыт за тренировки, пути мастерства и достижения. Он живёт внутри направления, а не в шапке сайта.",
    audience: "adults",
  },
  {
    id: "arenda",
    question: "Можно ли арендовать зал?",
    answer:
      "Да. 3 000 ₽ / час, 80 м², зеркала, покрытие «ласточкин хвост». Заявка — в меню «Аренда зала» или на странице /arenda.",
    audience: "all",
  },
  {
    id: "record",
    question: "Как записаться?",
    answer: "Оставьте заявку в контактах или напишите в сообщество ВКонтакте. Отдельная регистрация после оплаты — в следующей фазе.",
    audience: "adults",
  },
  {
    id: "kids-record",
    question: "Как записать ребёнка?",
    answer: "Запишись сейчас: +7 (915) 048-61-60, Татьяна. Первое занятие бесплатно, количество мест ограничено.",
    audience: "kids",
  },
];

export function faqForAudience(isKids: boolean): FaqItem[] {
  return LANDING_FAQ.filter((item) => item.audience === "all" || item.audience === (isKids ? "kids" : "adults"));
}
