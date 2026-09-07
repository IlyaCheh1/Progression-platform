"use client";

import { useRef } from "react";
import Link from "next/link";
import Button from "@/components/ui/button";
import { useAudience } from "@/hooks/landing/useAudience";
import { useRevealFade } from "@/hooks/landing/useRevealFade";
import { articlesForAudience } from "@/lib/landing/articles";
import { withAudience } from "@/lib/audience";

export default function Articles() {
  const sectionRef = useRef<HTMLElement>(null);
  const { mode, isKids } = useAudience();
  useRevealFade(sectionRef);
  const items = articlesForAudience(isKids);

  return (
    <section id="journal" ref={sectionRef} className="relative py-24" style={{ background: "var(--mos-bg)" }}>
      <div className="relative z-10 mx-auto max-w-6xl px-6">
        <div className="reveal-fade mb-12 text-center">
          <span className="mb-3 block text-xs font-semibold uppercase tracking-[0.12em] text-mos-amber">Мастер меча</span>
          <h2 className="font-unbounded text-[calc(2.25rem-2pt)] font-medium text-white md:text-5xl">
            Журнал школы
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm text-white/45">
            Черновые материалы о фехтовании. Обложки из существующих медиа, тексты помечены как заглушки.
          </p>
        </div>
        <div className="grid gap-5 md:grid-cols-2">
          {items.map((article, index) => (
            <Link
              key={article.slug}
              href={withAudience(`/journal/${article.slug}`, mode)}
              className="article-card reveal-fade"
              style={{ transitionDelay: `${index * 0.05}s` }}
            >
              <span className="article-card-cover">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={article.cover} alt="" />
                <span className="article-card-mock">Макет</span>
              </span>
              <span className="p-5">
                <span className="block text-[10px] uppercase tracking-[0.14em] text-white/35">{article.date}</span>
                <span className="mt-2 block font-unbounded text-lg text-white">{article.title}</span>
                <span className="mt-2 block text-sm leading-relaxed text-white/50">{article.teaser}</span>
              </span>
            </Link>
          ))}
        </div>
        <div className="reveal-fade mt-10 flex justify-center">
          <Button href={withAudience("/journal", mode)} variant="stroke" size="md" className="uppercase">
            Все материалы
          </Button>
        </div>
      </div>
    </section>
  );
}
