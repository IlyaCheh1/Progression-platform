import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { PublicPageShell } from "@/components/public-page-shell";
import { getJournalArticle, JOURNAL_ARTICLES } from "@/lib/landing/articles";
import { LEGAL_ENTITY } from "@/lib/legal/content";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return JOURNAL_ARTICLES.map((article) => ({ slug: article.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const article = getJournalArticle(slug);
  if (!article) return { title: `Журнал — ${LEGAL_ENTITY.siteName}` };
  return { title: `${article.title} — ${LEGAL_ENTITY.siteName}`, description: article.teaser };
}

export default async function JournalArticlePage({ params }: Props) {
  const { slug } = await params;
  const article = getJournalArticle(slug);
  if (!article) notFound();

  return (
    <PublicPageShell>
      <article className="mx-auto max-w-3xl">
        <p className="text-xs uppercase tracking-[0.14em] text-mos-amber">Макет статьи</p>
        <h1 className="mt-3 font-unbounded text-4xl text-white">{article.title}</h1>
        <p className="mt-3 text-sm text-white/40">{article.date}</p>
        <div className="article-card-cover mt-8 overflow-hidden rounded-[24px]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={article.cover} alt="" className="h-72 w-full object-cover" />
        </div>
        <p className="mt-8 text-base leading-relaxed text-white/60">{article.teaser}</p>
        <p className="mt-4 text-base leading-relaxed text-white/45">
          Полный текст появится позже. Это не новость и не биография сотрудника — только каркас раздела «Мастер меча».
        </p>
        <Link href="/journal" className="mt-8 inline-flex text-xs uppercase tracking-[0.12em] text-mos-amber">
          ← Все материалы
        </Link>
      </article>
    </PublicPageShell>
  );
}
