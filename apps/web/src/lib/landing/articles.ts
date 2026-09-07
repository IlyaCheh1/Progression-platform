export type JournalArticle = {
  slug: string;
  title: string;
  teaser: string;
  cover: string;
  date: string;
  mock: true;
};

export const JOURNAL_ARTICLES: JournalArticle[] = [
  {
    slug: "pochemu-dlinnym-mechom",
    title: "Почему начинают с длинного меча",
    teaser: "Заглушка. Короткий разбор, зачем школе базовый ведьмачий курс и как он связан с остальными клинками.",
    cover: "/media/directions/1.webp",
    date: "2026-08-12",
    mock: true,
  },
  {
    slug: "detskoe-ushu-s-6-let",
    title: "Детское ушу: что происходит на ковре",
    teaser: "Заглушка. Как устроена группа «Клинки Востока» для детей и чего ждать родителям на первой тренировке.",
    cover: "/media/trainers/tatyana-gribanova.webp",
    date: "2026-08-28",
    mock: true,
  },
  {
    slug: "rapira-dve-shkoly",
    title: "Итальянская и испанская рапира — в чём разница",
    teaser: "Заглушка. Две линии рапиры в одной школе: дистанция, темп и характер клинка.",
    cover: "/media/directions/3.webp",
    date: "2026-09-01",
    mock: true,
  },
  {
    slug: "rekonstrukciya-bez-mifov",
    title: "Реконструкция без мифов",
    teaser: "Заглушка. Четыре будущих трека реконструкции — щит, древко, построения и быт. Тексты уточним.",
    cover: "/media/directions/7.webp",
    date: "2026-09-04",
    mock: true,
  },
];

export function getJournalArticle(slug: string): JournalArticle | undefined {
  return JOURNAL_ARTICLES.find((item) => item.slug === slug);
}

export function articlesForAudience(isKids: boolean): JournalArticle[] {
  if (!isKids) return JOURNAL_ARTICLES;
  return JOURNAL_ARTICLES.filter((item) => item.slug.includes("detskoe") || item.slug.includes("ushu"));
}
