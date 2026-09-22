import type { Metadata } from "next";
import Link from "next/link";
import { PublicPageShell } from "@/components/public-page-shell";
import { LANDING_PROMOS } from "@/lib/landing/promos";
import { LEGAL_ENTITY } from "@/lib/legal/content";

export const metadata: Metadata = {
  title: `Акции — ${LEGAL_ENTITY.siteName}`,
  description: "Текущие акции школы исторического фехтования «Мастер меча».",
};

export default function AkciiPage() {
  return (
    <PublicPageShell>
      <div className="mx-auto max-w-6xl">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-mos-amber">Акции</p>
        <h1 className="mt-3 font-unbounded text-4xl text-white md:text-6xl">Все акции</h1>
        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {LANDING_PROMOS.map((promo) => (
            <article key={promo.id} className="promo-tile">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={promo.image} alt="" />
              <div className="promo-tile-shade" aria-hidden />
              <span className="promo-tile-badge">{promo.badge}</span>
              <div className="promo-tile-body">
                <h2 className="font-unbounded text-xl text-white">{promo.title}</h2>
                <p className="text-sm leading-relaxed text-white/80">{promo.teaser}</p>
                <Link href={`/akcii/${promo.slug}`} className="promo-tile-more">
                  Подробнее
                </Link>
              </div>
            </article>
          ))}
        </div>
      </div>
    </PublicPageShell>
  );
}
