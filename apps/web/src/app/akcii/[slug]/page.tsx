import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PublicPageShell } from "@/components/public-page-shell";
import { getLandingPromo, LANDING_PROMOS, PROMO_NO_ENTRANCE_FEE } from "@/lib/landing/promos";
import { LEGAL_ENTITY } from "@/lib/legal/content";
import CallbackBlock from "@/screens/landing/callback";
import PromoSignup from "@/screens/landing/promo-signup";
import Tariffs from "@/screens/landing/tariffs";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return LANDING_PROMOS.map((promo) => ({ slug: promo.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const promo = getLandingPromo(slug);
  if (!promo) return { title: `Акции — ${LEGAL_ENTITY.siteName}` };
  return { title: `${promo.title} — ${LEGAL_ENTITY.siteName}`, description: promo.lead };
}

export default async function PromoDetailsPage({ params }: Props) {
  const { slug } = await params;
  const promo = getLandingPromo(slug);
  if (!promo) notFound();

  const purchaseTariffId = promo.id === "second-subscription" ? "monthly" : "trial";

  return (
    <PublicPageShell flush>
      <article className="promo-detail">
        <div className="mx-auto max-w-6xl px-4 md:px-6">
          <nav className="promo-detail-crumbs" aria-label="Хлебные крошки">
            <Link href="/">Главная</Link>
            <span aria-hidden="true">/</span>
            <Link href="/akcii">Акции</Link>
            <span aria-hidden="true">/</span>
            <h1>{promo.title}</h1>
          </nav>
          <div className="promo-detail-top">
            <div className="promo-detail-hero">
              <img src={promo.image} alt="" />
            </div>
            <section className="landing-frame promo-conditions-card" aria-labelledby="promo-conditions">
              <h2 id="promo-conditions">Условия</h2>
              <ul className="promo-detail-notes">
                {promo.footnotes.map((note) => (
                  <li key={note}>{note}</li>
                ))}
              </ul>
              <p>{PROMO_NO_ENTRANCE_FEE}</p>
              <PromoSignup tariffId={purchaseTariffId} />
            </section>
          </div>
        </div>

        <section className="mx-auto max-w-6xl px-4 pt-8 pb-4 md:px-6 md:pt-12" aria-labelledby="promo-description">
          <div className="landing-frame">
            <h2 id="promo-description">Описание</h2>
            <p className="promo-detail-lead">{promo.lead}</p>
            {promo.paragraphs.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
            <p className="promo-detail-label">{promo.includedLabel}</p>
            <ul className="promo-detail-included">
              {promo.included.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <p>
              {promo.signup}{" "}
              <Link href={promo.signupHref} className="text-mos-amber">
                Перейти
              </Link>
            </p>
            <Link href="/akcii" className="mt-8 inline-flex text-xs uppercase tracking-[0.12em] text-mos-amber">
              ← Все акции
            </Link>
          </div>
        </section>
      </article>
      <Tariffs />
      <CallbackBlock />
    </PublicPageShell>
  );
}
