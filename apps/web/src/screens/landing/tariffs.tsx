"use client";

import { useRef, useState } from "react";
import Button from "@/components/ui/button";
import { useRevealFade } from "@/hooks/landing/useRevealFade";
import { cn } from "@/lib/utils";

type PricingCard = {
  id: string;
  title: string;
  description: string;
  price: string;
  priceSuffix?: string;
  popular?: boolean;
  accent: string;
  features: string[];
  bundleLabel?: string;
  cta: string;
  ctaVariant: "primary" | "secondary";
};

const GROUP_CARDS: PricingCard[] = [
  {
    id: "trial",
    title: "Пробное занятие",
    description: "Первый выход в зал — познакомиться с техникой, тренером и атмосферой школы.",
    price: "1 000 ₽",
    accent: "#5a574f",
    features: ["Одно посещение", "Знакомство с тренером", "Базовая безопасность"],
    cta: "Записаться",
    ctaVariant: "secondary",
  },
  {
    id: "monthly",
    title: "Абонемент",
    description: "Групповые тренировки один раз в неделю.",
    price: "от 5 000 ₽",
    priceSuffix: "в месяц · 1 раз в неделю",
    popular: true,
    accent: "#d4a84b",
    features: ["Групповые тренировки", "RPG-прогресс и XP", "Система скидок", "Доступ к залу"],
    cta: "Выбрать тариф",
    ctaVariant: "primary",
  },
  {
    id: "single",
    title: "Разовое занятие",
    description: "Одно групповое занятие без абонемента — удобно для нерегулярного графика.",
    price: "2 000 ₽",
    accent: "#8a8780",
    features: ["Одно групповое занятие", "Без абонемента", "Запись по расписанию"],
    cta: "Записаться",
    ctaVariant: "secondary",
  },
];

const SOLO_CARDS: PricingCard[] = [
  {
    id: "solo-single",
    title: "Разовое занятие",
    description: "Одно индивидуальное занятие с тренером в зале — без абонемента.",
    price: "4 000 ₽",
    priceSuffix: "за час",
    accent: "#5a574f",
    features: ["1 час с тренером", "Персональный разбор", "Без абонемента"],
    cta: "Записаться",
    ctaVariant: "secondary",
  },
  {
    id: "solo-monthly",
    title: "Абонемент",
    description: "Индивидуальные тренировки один раз в неделю с тренером.",
    price: "от 12 800 ₽",
    priceSuffix: "в месяц · 1 раз в неделю",
    popular: true,
    accent: "#d4a84b",
    features: [
      "Индивидуально с тренером",
      "1 раз в неделю · 1 час",
      "Ставка 3 200 ₽/ч при абонементе",
      "Система скидок на срок",
    ],
    cta: "Выбрать тариф",
    ctaVariant: "primary",
  },
  {
    id: "solo-online",
    title: "Онлайн",
    description: "Индивидуальное занятие в онлайн-формате с тренером.",
    price: "4 000 ₽",
    priceSuffix: "за час",
    accent: "#8a8780",
    features: ["1 час с тренером", "Дистанционный формат", "Разбор техники"],
    cta: "Записаться",
    ctaVariant: "secondary",
  },
];

const GROUP_DISCOUNTS = [
  "50% скидка на второй абонемент для влюблённых",
  "50% скидка на второй абонемент внутри семьи (дети и родители, сёстры и братья)",
] as const;

const DISCOUNT_COURSES = "Клинки Востока, Итальянская рапира, Иберийский двуручный меч";

const SUBSCRIPTION_MONTHLY_BASE = 5000;
const SOLO_SUBSCRIPTION_MONTHLY_BASE = 12800;

const SUBSCRIPTION_TERMS = [
  { months: 1, discountPercent: 0 },
  { months: 3, discountPercent: 5 },
  { months: 6, discountPercent: 10 },
  { months: 12, discountPercent: 15 },
] as const;

type SubscriptionMonths = (typeof SUBSCRIPTION_TERMS)[number]["months"];

function formatRubles(amount: number): string {
  return `${new Intl.NumberFormat("ru-RU").format(amount)} ₽`;
}

function calcSubscriptionTotal(months: number, discountPercent: number, monthlyBase: number): number {
  return Math.round(monthlyBase * months * (1 - discountPercent / 100));
}

function SubscriptionTermPicker({
  value,
  onChange,
}: {
  value: SubscriptionMonths;
  onChange: (months: SubscriptionMonths) => void;
}) {
  return (
    <div className="mt-4 grid grid-cols-4 gap-2">
      {SUBSCRIPTION_TERMS.map((term) => {
        const selected = value === term.months;

        return (
          <button
            key={term.months}
            type="button"
            onClick={() => onChange(term.months)}
            className={cn(
              "flex flex-col items-center rounded-xl border px-2 py-2 transition-all duration-200",
              selected
                ? "border-mos-amber/50 bg-mos-amber/10 text-mos-amber"
                : "border-white/10 bg-white/[0.03] text-mos-muted hover:border-white/20 hover:text-mos-text",
            )}
          >
            <span className="font-unbounded text-sm leading-none">{term.months}</span>
            <span className="mt-1 text-[10px] uppercase tracking-[0.08em]">
              {term.discountPercent > 0 ? `−${term.discountPercent}%` : "мес."}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function SubscriptionPrice({
  months,
  monthlyBase,
}: {
  months: SubscriptionMonths;
  monthlyBase: number;
}) {
  const term = SUBSCRIPTION_TERMS.find((item) => item.months === months) ?? SUBSCRIPTION_TERMS[0];
  const total = calcSubscriptionTotal(term.months, term.discountPercent, monthlyBase);
  const monthly = Math.round(total / term.months);

  return (
    <div className="mt-6">
      <p className="font-unbounded text-3xl text-mos-text">{formatRubles(total)}</p>
      <p className="mt-1 text-sm text-mos-muted">
        {term.months === 1
          ? "в месяц · 1 раз в неделю"
          : `${formatRubles(monthly)}/мес · скидка ${term.discountPercent}% · 1 раз в неделю`}
      </p>
    </div>
  );
}

function isSubscriptionCard(cardId: string): boolean {
  return cardId === "monthly" || cardId === "solo-monthly";
}

function subscriptionMonthlyBase(cardId: string): number {
  return cardId === "solo-monthly" ? SOLO_SUBSCRIPTION_MONTHLY_BASE : SUBSCRIPTION_MONTHLY_BASE;
}

function CheckIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden className="shrink-0 text-mos-amber">
      <path
        d="M3.5 8.2 6.4 11.1 12.5 5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function Tariffs() {
  const sectionRef = useRef<HTMLElement>(null);
  const [tab, setTab] = useState<"group" | "solo">("group");
  const [subscriptionMonths, setSubscriptionMonths] = useState<SubscriptionMonths>(1);
  useRevealFade(sectionRef, 0.12, tab);
  const cards = tab === "group" ? GROUP_CARDS : SOLO_CARDS;

  return (
    <section id="tariffs" ref={sectionRef} className="relative py-24" style={{ background: "var(--mos-bg)" }}>
      <div className="mx-auto max-w-6xl px-6">
        <div className="reveal-fade text-center">
          <h2 className="font-unbounded text-3xl tracking-[0.12em] text-mos-amber md:text-5xl">Тарифы</h2>
          <p className="mx-auto mt-3 max-w-2xl font-golos text-mos-muted">
            Два раздела: групповые и индивидуальные тренировки.
          </p>
          <div className="mt-6 inline-flex rounded-2xl border border-mos-line/40 bg-mos-stone/60 p-1">
            {(
              [
                { id: "group", label: "Групповые" },
                { id: "solo", label: "Индивидуальные" },
              ] as const
            ).map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setTab(item.id)}
                className={cn(
                  "rounded-xl px-5 py-2 font-unbounded text-[10px] uppercase tracking-[0.12em] transition-all duration-300",
                  tab === item.id ? "bg-mos-amber text-mos-bg" : "text-mos-muted hover:text-mos-text",
                )}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-12 grid gap-5 lg:grid-cols-3 lg:items-center">
          {cards.map((card, i) => (
            <article
              key={card.id}
              className={cn(
                "pricing-card reveal-fade relative flex h-full flex-col overflow-hidden rounded-[28px] border border-white/10 bg-white/[0.03] backdrop-blur-xl",
                card.popular && "pricing-card--popular",
              )}
              style={{ transitionDelay: `${i * 0.06}s` }}
            >
              {card.popular && (
                <span className="absolute right-5 top-5 rounded-full border border-mos-amber/30 bg-mos-amber/10 px-3 py-1 text-[10px] uppercase tracking-[0.18em] text-mos-amber">
                  Самое популярное
                </span>
              )}

              <div
                className="pricing-card-hero relative h-40 overflow-hidden border-b border-white/5"
                style={{
                  background: `radial-gradient(circle at 30% 20%, ${card.accent}55 0%, transparent 42%), linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0))`,
                }}
              >
                <div className="pricing-card-x" aria-hidden />
                <div
                  className="absolute bottom-5 left-5 flex h-14 w-14 items-center justify-center rounded-full border border-white/10"
                  style={{ background: `${card.accent}22`, boxShadow: `0 0 40px ${card.accent}33` }}
                >
                  <span className="font-unbounded text-lg text-mos-text">◆</span>
                </div>
              </div>

              <div className="flex flex-1 flex-col p-6 md:p-7">
                <h3 className="font-unbounded text-2xl text-mos-text">{card.title}</h3>
                <p className="mt-3 min-h-[72px] text-sm leading-relaxed text-mos-muted">{card.description}</p>

                {isSubscriptionCard(card.id) ? (
                  <>
                    <SubscriptionTermPicker value={subscriptionMonths} onChange={setSubscriptionMonths} />
                    <SubscriptionPrice months={subscriptionMonths} monthlyBase={subscriptionMonthlyBase(card.id)} />
                  </>
                ) : (
                  <div className="mt-6">
                    <p className="font-unbounded text-3xl text-mos-text">{card.price}</p>
                    {card.priceSuffix && <p className="mt-1 text-sm text-mos-muted">{card.priceSuffix}</p>}
                  </div>
                )}

                <div className="mt-6">
                  <Button
                    href="/login"
                    variant={card.ctaVariant}
                    size="lg"
                    className={cn("w-full uppercase", card.popular && "cta-pulse")}
                  >
                    {card.cta}
                  </Button>
                </div>

                <div className="mt-8 space-y-3">
                  {card.features.map((feature) => (
                    <div key={feature} className="flex items-start gap-3 text-sm text-mos-text/80">
                      <CheckIcon />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>

                {card.bundleLabel && (
                  <div className="pricing-card-bundle mt-8">
                    <span>{card.bundleLabel}</span>
                  </div>
                )}
              </div>
            </article>
          ))}
        </div>

        {tab === "group" && (
          <div className="reveal-fade mx-auto mt-10 max-w-3xl rounded-2xl bg-mos-stone/30 p-6">
            <h3 className="font-unbounded text-sm uppercase tracking-[0.12em] text-mos-amber">Система скидок</h3>
            <p className="mt-2 text-sm text-mos-muted">Действует на курсах: {DISCOUNT_COURSES}.</p>
            <ul className="mt-4 space-y-2 text-sm text-mos-text/85">
              {GROUP_DISCOUNTS.map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <CheckIcon />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
}
