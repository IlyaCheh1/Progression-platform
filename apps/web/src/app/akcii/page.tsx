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
        <h1 className="mt-3 font-unbounded text-4xl text-white md:text-6xl">Специальные предложения</h1>
        <p className="mt-4 max-w-2xl text-white/50">
          Отдельная страница, не только секция лендинга. Часть формулировок ещё черновая.
        </p>
        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {LANDING_PROMOS.map((promo) => (
            <article key={promo.id} className="promo-card">
              <span className="promo-card-badge">{promo.badge}</span>
              <h2 className="mt-4 font-unbounded text-xl text-white">{promo.title}</h2>
              <p className="mt-3 text-sm leading-relaxed text-white/55">{promo.teaser}</p>
              <Link href={promo.href} className="mt-5 inline-flex text-xs uppercase tracking-[0.12em] text-mos-amber">
                К действию
              </Link>
            </article>
          ))}
        </div>
      </div>
    </PublicPageShell>
  );
}
