import type { Metadata } from "next";
import HallRentalForm from "@/components/hall-rental-form";
import { PublicPageShell } from "@/components/public-page-shell";
import { HALL_RENTAL_FACTS, HALL_RENTAL_PHOTOS } from "@/lib/landing/hall-rental";
import { LEGAL_ENTITY } from "@/lib/legal/content";

export const metadata: Metadata = {
  title: `Аренда зала — ${LEGAL_ENTITY.siteName}`,
  description: "Аренда зала школы «Мастер меча»: 80 м², зеркала, покрытие ласточкин хвост, 3 000 ₽ / час.",
};

const FACTS = [
  { label: "Цена", value: HALL_RENTAL_FACTS.price },
  { label: "Площадь", value: HALL_RENTAL_FACTS.area },
  { label: "Зеркала", value: HALL_RENTAL_FACTS.mirrors },
  { label: "Покрытие", value: HALL_RENTAL_FACTS.floor },
] as const;

export default function ArendaPage() {
  return (
    <PublicPageShell>
      <div className="mx-auto max-w-6xl">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-mos-amber">Аренда зала</p>
        <h1 className="mt-3 font-unbounded text-4xl text-white md:text-6xl">Зал на час</h1>
        <p className="mt-4 max-w-2xl text-white/50">
          {HALL_RENTAL_FACTS.price}. {HALL_RENTAL_FACTS.area}, {HALL_RENTAL_FACTS.mirrors.toLowerCase()}, покрытие —{" "}
          {HALL_RENTAL_FACTS.floor}. Фото — фотореалистичные макеты зала.
        </p>

        <ul className="mt-10 grid grid-cols-2 gap-3 md:grid-cols-4">
          {FACTS.map((fact) => (
            <li key={fact.label} className="promo-card p-4">
              <p className="text-[0.62rem] font-bold uppercase tracking-[0.14em] text-mos-amber">{fact.label}</p>
              <p className="mt-2 font-unbounded text-base text-white md:text-lg">{fact.value}</p>
            </li>
          ))}
        </ul>

        <div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-4">
          {HALL_RENTAL_PHOTOS.map((photo) => (
            <figure key={photo.src} className="hall-photo-card">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={photo.src} alt={photo.alt} className="h-full w-full object-cover object-center" />
              <figcaption>{photo.caption}</figcaption>
            </figure>
          ))}
        </div>

        <section className="mt-14 max-w-2xl">
          <h2 className="font-unbounded text-2xl text-white">Заявка администратору</h2>
          <p className="mt-2 text-sm text-white/50">
            Укажите дни, время и длительность. Заявка сохраняется для ролей administrator / platform_admin. Inbox в ЛК —
            фаза 2.
          </p>
          <div className="mt-8">
            <HallRentalForm />
          </div>
        </section>
      </div>
    </PublicPageShell>
  );
}
