import { COURSE_ENROLL_HASH } from "../courses/constants";
import { SCHOOL_HERO_MOBILE_STILL, SCHOOL_HERO_VIDEO } from "../hero-media";
import { getSchoolColor } from "../school-colors";

export const ADULT_SCHOOL_SLIDE = {
  key: "school",
  title: "Мастер меча",
  titleAccent: "фехтование для тех, кому мало обычного спорта",
  lead: "Учим управляться с любым клинком (и не только):\nот китайского меча до европейского полуторника",
  directions: "историческое фехтование разных стран Европы и китайское ушу для детей и взрослых.",
  arsenal: "мечи (одноручные, длинные, двуручные), сабли, шпаги, копья, алебарды, щиты и многое другое.",
  cta: "Выбрать тренировки",
} as const;

/** Temporary local backdrop for the school intro slide. */
export const ADULT_SCHOOL_VIDEO = SCHOOL_HERO_VIDEO;

/** Portrait still used only while the school intro is on a phone. */
export const ADULT_SCHOOL_MOBILE_STILL = SCHOOL_HERO_MOBILE_STILL;

export type AdultCourseSlideKey = "ushu" | "witcher" | "two_swords" | "rapier_xvii" | "saber" | "fan";

export type AdultCourseSlide = {
  key: AdultCourseSlideKey;
  title: string;
  description: string;
  /** Local studio still in /media/hero. */
  image?: `${string}.webp`;
  /** Local hero video when the slide has no new still. */
  video?: `${string}.mp4`;
  courseSlug: string;
  comingSoon?: boolean;
  color: string;
};

export const ADULT_COURSE_SLIDES: readonly AdultCourseSlide[] = [
  {
    key: "ushu",
    title: "Ушу",
    description:
      "Взрослая секция ушу: координация, гибкость и владение клинком в восточной традиции. Эпические формы и сила тела — в ритме взрослого зала.",
    image: "6.webp",
    courseSlug: "ushu-vzroslye",
    color: getSchoolColor("ushu"),
  },
  {
    key: "witcher",
    title: "Ведьмак",
    description:
      "Сражайся как ведьмак. Основы владения длинным мечом, передвижение в боевой стойке, удары и защиты — точность и скорость, чтобы выйти победителем против любого противника.",
    image: "witcher.webp",
    courseSlug: "vedmak",
    color: getSchoolColor("witcher"),
  },
  {
    key: "two_swords",
    title: "Два меча",
    description:
      "Парная работа двумя клинками: независимые руки, ритм и контроль дистанции. Каждый меч — и атака, и защита; курс учит вести бой, когда оружия двое.",
    image: "2.webp",
    courseSlug: "dva-mecha",
    color: getSchoolColor("two_swords"),
  },
  {
    key: "rapier_xvii",
    title: "Шпага XVII века",
    description:
      "Курс построен на исторических источниках. Рапира Фабриса — высшая точка итальянской школы начала XVII века: дуэльная техника Капоферро, Джиганти и Фабриса, ставшая эталоном для Европы.",
    image: "3.webp",
    courseSlug: "shpaga-xvii",
    color: getSchoolColor("rapier_xvii"),
  },
  {
    key: "saber",
    title: "Сабля XVI-XVII века",
    description: "Курс построен на исторических источниках. Рубка, укол и работа калибром по трактатам эпохи — от строевой практики до дуэльной дистанции.",
    image: "4.webp",
    courseSlug: "sablya",
    color: getSchoolColor("saber"),
  },
  {
    key: "fan",
    title: "Веер",
    description:
      "Боевой веер: пластика, дистанция и скрытая сила восточного оружия. Курс в подготовке — можно оставить заявку и узнать о наборе первым.",
    image: "5.webp",
    courseSlug: "veer",
    comingSoon: true,
    color: getSchoolColor("fan"),
  },
] as const;

export function coursePageHref(slug: string): string {
  return `/courses/${slug}`;
}

export function courseEnrollHref(slug: string): string {
  return `${coursePageHref(slug)}#${COURSE_ENROLL_HASH}`;
}

export function adultCourseSlideCount(): number {
  return 1 + ADULT_COURSE_SLIDES.length;
}
