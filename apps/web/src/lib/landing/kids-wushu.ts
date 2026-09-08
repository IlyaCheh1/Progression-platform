/** Canon kids-mode copy from poster variant A (Шагал). Variant B is not approved. */

export const KIDS_SAGE = "#5a8f7b";
export const KIDS_AMBER = "#d4a84b";

export const KIDS_WUSHU = {
  school: "Детская школа ушу",
  section: "Детская секция ушу",
  slogan: "Сила тела. Дух дракона. Путь чемпиона.",
  lead: "Мы формируем характер, волю и уверенность — и растим чемпионов.",
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
    // Official text-free poster A collage (Шагал). Do not use Pexels or owner-cropped halves.
    heroDesktop: "/media/hero/kids-wushu-hero-16x9.webp",
    heroMobile: "/media/hero/kids-wushu-hero-9x16.webp",
    trainer: "/media/trainers/tatyana-gribanova.webp",
    logo: "/media/logo-mark.png",
  },
} as const;

export function kidsPhoneHref(): string {
  return `tel:${KIDS_WUSHU.phoneTel}`;
}
