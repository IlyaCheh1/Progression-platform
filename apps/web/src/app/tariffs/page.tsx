import type { Metadata } from "next";
import Button from "@/components/ui/button";
import { PublicPageShell } from "@/components/public-page-shell";
import { LEGAL_ENTITY } from "@/lib/legal/content";

export const metadata: Metadata = {
  title: `Тарифы — ${LEGAL_ENTITY.siteName}`,
  description: "Групповые, индивидуальные, сплиты и парные онлайн-тренировки школы «Мастер меча».",
};

const BLOCKS = [
  {
    id: "group",
    title: "Групповые",
    price: "от 5 000 ₽ / мес",
    text: "Общий ритм зала, партнёрская работа и RPG-прогресс. Пробное занятие — 1 000 ₽.",
    points: ["1 раз в неделю", "Разовое 2 000 ₽", "Семейные скидки"],
  },
  {
    id: "solo",
    title: "Индивидуальные",
    price: "от 12 800 ₽ / мес",
    text: "Час с тренером в зале. Разовое — 4 000 ₽. Ставка ниже на абонементе.",
    points: ["Персональный разбор", "Гибкий слот", "1 час"],
  },
  {
    id: "split",
    title: "Сплиты",
    price: "макет · 2 человека",
    text: "Заглушка. Парная персоналка на двоих — цена и слоты появятся после ТЗ.",
    points: ["Двое в зале", "Общий тренер", "Черновик формата"],
  },
  {
    id: "online",
    title: "Онлайн (парные)",
    price: "макет · пара",
    text: "Заглушка. Дистанционный разбор техники в паре. Не путать с индивидуальным онлайном зала.",
    points: ["Видеосвязь", "Два ученика", "Текст уточняется"],
  },
] as const;

export default function TariffsPage() {
  return (
    <PublicPageShell>
      <div className="mx-auto max-w-6xl">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-mos-amber">Запись</p>
        <h1 className="mt-3 font-unbounded text-4xl text-white md:text-6xl">Тарифы</h1>
        <p className="mt-4 max-w-2xl text-white/50">
          Четыре формата. Живые цены — у групповых и индивидуальных. Сплиты и парный онлайн пока помечены как макеты.
          Детская группа ушу идёт в тех же блоках; отдельный детский прайс подтвердим при записи.
        </p>

        <div className="mt-12 grid gap-5 md:grid-cols-2">
          {BLOCKS.map((block) => (
            <article key={block.id} className="promo-card">
              <span className="promo-card-badge">{block.id === "split" || block.id === "online" ? "Макет" : "Зал"}</span>
              <h2 className="mt-4 font-unbounded text-2xl text-white">{block.title}</h2>
              <p className="mt-2 font-unbounded text-mos-amber">{block.price}</p>
              <p className="mt-3 text-sm leading-relaxed text-white/55">{block.text}</p>
              <ul className="mt-4 space-y-2 text-sm text-white/70">
                {block.points.map((point) => (
                  <li key={point}>◆ {point}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>

        <div className="questions-section mt-14 rounded-[28px] px-6 py-10 text-center">
          <h2 className="font-unbounded text-2xl text-white">Готовы выйти в зал?</h2>
          <p className="mx-auto mt-3 max-w-xl text-sm text-white/50">
            Как в клубном фитнесе: заявка в контакты, затем пробное или абонемент. Онлайн-оплата и кабинет после покупки — фаза 2.
          </p>
          <div className="mt-6 flex justify-center">
            <Button href="/contact" variant="primary" size="lg" className="uppercase">
              Оставить заявку
            </Button>
          </div>
        </div>
      </div>
    </PublicPageShell>
  );
}
