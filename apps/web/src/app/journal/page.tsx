import type { Metadata } from "next";
import Link from "next/link";
import { PublicPageShell } from "@/components/public-page-shell";
import { JOURNAL_ARTICLES } from "@/lib/landing/articles";
import { LEGAL_ENTITY } from "@/lib/legal/content";

export const metadata: Metadata = {
  title: `Журнал — ${LEGAL_ENTITY.siteName}`,
  description: "Материалы школы «Мастер меча» об историческом фехтовании.",
};

export default function JournalPage() {
  return (
    <PublicPageShell>
      <div className="mx-auto max-w-6xl">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-mos-amber">Мастер меча</p>
        <h1 className="mt-3 font-unbounded text-4xl text-white md:text-6xl">Журнал</h1>
        <p className="mt-4 max-w-2xl text-white/50">Макеты статей. Обложки — существующие фото школы, не стоковые люди.</p>
        <div className="mt-12 grid gap-5 md:grid-cols-2">
          {JOURNAL_ARTICLES.map((article) => (
            <Link key={article.slug} href={`/journal/${article.slug}`} className="article-card">
              <span className="article-card-cover">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={article.cover} alt="" />
                <span className="article-card-mock">Макет</span>
              </span>
              <span className="p-5">
                <span className="block text-[10px] uppercase tracking-[0.14em] text-white/35">{article.date}</span>
                <span className="mt-2 block font-unbounded text-lg text-white">{article.title}</span>
                <span className="mt-2 block text-sm text-white/50">{article.teaser}</span>
              </span>
            </Link>
          ))}
        </div>
      </div>
    </PublicPageShell>
  );
}
