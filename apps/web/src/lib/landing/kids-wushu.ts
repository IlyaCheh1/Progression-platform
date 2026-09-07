/** Canon kids-mode copy from poster variant A (Шагал). Variant B is not approved. */

export const KIDS_SAGE = "#5a8f7b";
export const KIDS_AMBER = "#d4a84b";

export const KIDS_WUSHU = {
  school: "Детская школа ушу",
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
    // Temporary kids hero. Replace with Шагал text-free poster A artwork
    // (Tatyana + kids + dragon smoke, no text overlays). Do not use owner-cropped poster halves.
    // Current file: kids-wushu-child.webp — Pexels #7988769, cottonbro studio.
    hero: "/media/hero/kids-wushu-child.webp",
    trainer: "/media/trainers/tatyana-gribanova.webp",
    logo: "/media/logo-mark.png",
  },
} as const;

export function kidsPhoneHref(): string {
  return `tel:${KIDS_WUSHU.phoneTel}`;
}
