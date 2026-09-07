/** Canon kids-mode copy from poster variant A (Шагал). Variant B is not approved. */

export const KIDS_SAGE = "#5a8f7b";
export const KIDS_AMBER = "#d4a84b";

export const KIDS_WUSHU = {
  school: "Школа фехтования",
  brand: "Мастер меча",
  section: "Детская секция ушу",
  slogan: "Сила тела. Дух дракона. Путь чемпиона.",
  body: "Мы формируем характер, волю и уверенность — и растим чемпионов. Тренер Татьяна: 10 лет преподавания, 25 лет в спорте.",
  bullets: [
    { id: "tradition", title: "Традиционное и современное ушу" },
    { id: "acro", title: "Координация, гибкость и акробатика" },
    { id: "spirit", title: "Дисциплина и внутренняя сила" },
    { id: "stage", title: "Соревнования и показательные выступления" },
  ],
  cta: "Первое занятие бесплатно!",
  age: "Набор от 6 лет",
  enroll: "Запишись сейчас",
  phoneDisplay: "+7 (915) 048-61-60",
  phoneTel: "+79150486160",
  trainerShort: "Татьяна",
  trainerFull: "Татьяна Грибанова",
  places: "Количество мест ограничено",
  media: {
    hero: "/media/courses/east-hero.webp",
    trainer: "/media/trainers/tatyana-gribanova.webp",
    logo: "/media/logo-mark.png",
  },
} as const;

export function kidsPhoneHref(): string {
  return `tel:${KIDS_WUSHU.phoneTel}`;
}
