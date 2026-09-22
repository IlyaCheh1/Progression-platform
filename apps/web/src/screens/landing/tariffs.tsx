"use client";

import { useRef, useState, type CSSProperties } from "react";
import type { PurchaseTariffId } from "@/lib/landing/tariff-purchase";
import TariffPurchase from "@/screens/landing/tariff-purchase";
import { useHorizontalSwipe } from "@/hooks/landing/useHorizontalSwipe";
import { useMobileMedia } from "@/hooks/landing/useMobileMedia";
import { useRevealFade } from "@/hooks/landing/useRevealFade";
import { cn } from "@/lib/utils";
import { getSchoolColor } from "@/lib/school-colors";

type TariffFormat = "solo" | "group" | "online" | "split";

type PricingCard = {
  id: string;
  format: TariffFormat;
  lane: "Групповые" | "Персональные" | "Сплиты";
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

const GROUP_PAGE_TEXT =
  "Общий ритм зала, партнёрская работа и RPG-прогресс. Пробное занятие — 1 000 ₽.";
const SOLO_PAGE_TEXT = "Час с тренером в зале. Разовое — 4 000 ₽. Ставка ниже на абонементе.";

const GROUP_CARDS: PricingCard[] = [
  {
    id: "trial",
    format: "group",
    lane: "Групповые",
    title: "Пробное занятие",
    description: GROUP_PAGE_TEXT,
    price: "1 000 ₽",
    accent: getSchoolColor("ushu"),
    features: ["Одно посещение", "Знакомство с тренером", "Базовая безопасность"],
    cta: "Купить",
    ctaVariant: "secondary",
  },
  {
    id: "monthly",
    format: "group",
    lane: "Групповые",
    title: "Абонемент",
    description: GROUP_PAGE_TEXT,
    price: "от 5 000 ₽",
    priceSuffix: "в месяц · 1 раз в неделю",
    popular: true,
    accent: getSchoolColor("witcher"),
    features: ["Групповые тренировки", "RPG-прогресс и XP", "Система скидок", "Доступ к залу"],
    cta: "Купить",
    ctaVariant: "primary",
  },
  {
    id: "single",
    format: "group",
    lane: "Групповые",
    title: "Разовое занятие",
    description: GROUP_PAGE_TEXT,
    price: "2 000 ₽",
    accent: getSchoolColor("two_swords"),
    features: ["Одно групповое занятие", "Без абонемента", "Запись по расписанию"],
    cta: "Купить",
    ctaVariant: "secondary",
  },
];

const SOLO_CARDS: PricingCard[] = [
  {
    id: "solo-single",
    format: "solo",
    lane: "Персональные",
    title: "Разовое занятие",
    description: SOLO_PAGE_TEXT,
    price: "4 000 ₽",
    priceSuffix: "за час",
    accent: getSchoolColor("rapier_xvii"),
    features: ["1 час с тренером", "Персональный разбор", "Без абонемента"],
    cta: "Купить",
    ctaVariant: "secondary",
  },
  {
    id: "solo-monthly",
    format: "solo",
    lane: "Персональные",
    title: "Абонемент",
    description: SOLO_PAGE_TEXT,
    price: "от 12 800 ₽",
    priceSuffix: "в месяц · 1 раз в неделю",
    popular: true,
    accent: getSchoolColor("saber"),
    features: [
      "Индивидуально с тренером",
      "1 раз в неделю · 1 час",
      "Ставка 3 200 ₽/ч при абонементе",
      "Система скидок на срок",
    ],
    cta: "Купить",
    ctaVariant: "primary",
  },
  {
    id: "solo-online",
    format: "online",
    lane: "Персональные",
    title: "Онлайн",
    description: "Индивидуальное занятие в онлайн-формате с тренером.",
    price: "4 000 ₽",
    priceSuffix: "за час",
    accent: getSchoolColor("fan"),
    features: ["1 час с тренером", "Дистанционный формат", "Разбор техники"],
    cta: "Купить",
    ctaVariant: "secondary",
  },
];

const SPLIT_CARD: PricingCard = {
  id: "split",
  format: "split",
  lane: "Сплиты",
  title: "Сплит",
  description: "Заглушка. Парная персоналка на двоих — цена и слоты появятся после ТЗ.",
  price: "макет · 2 человека",
  accent: getSchoolColor("split"),
  features: ["Двое в зале", "Общий тренер", "Черновик формата"],
  cta: "Купить",
  ctaVariant: "secondary",
};

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
    <div className="tariff-terms" role="group" aria-label="Срок абонемента">
      {SUBSCRIPTION_TERMS.map((term) => {
        const selected = value === term.months;

        return (
          <button
            key={term.months}
            type="button"
            onClick={() => onChange(term.months)}
            className={cn("tariff-term", selected && "is-selected")}
            aria-pressed={selected}
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

function subscriptionFigures(months: SubscriptionMonths, monthlyBase: number) {
  const term = SUBSCRIPTION_TERMS.find((item) => item.months === months) ?? SUBSCRIPTION_TERMS[0];
  const total = calcSubscriptionTotal(term.months, term.discountPercent, monthlyBase);
  const monthly = Math.round(total / term.months);
  const note =
    term.months === 1
      ? "в месяц · 1 раз в неделю"
      : `${formatRubles(monthly)}/мес · скидка ${term.discountPercent}% · 1 раз в неделю`;
  return { price: formatRubles(total), note };
}

function isSubscriptionCard(cardId: string): boolean {
  return cardId === "monthly" || cardId === "solo-monthly";
}

function subscriptionMonthlyBase(cardId: string): number {
  return cardId === "solo-monthly" ? SOLO_SUBSCRIPTION_MONTHLY_BASE : SUBSCRIPTION_MONTHLY_BASE;
}

function CheckIcon() {
  return (
    <span className="tariff-check" aria-hidden>
      <svg width="12" height="12" viewBox="0 0 16 16">
        <path
          d="M3.5 8.2 6.4 11.1 12.5 5"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}

function PricingCardView({
  card,
  subscriptionMonths,
  onSubscriptionMonthsChange,
  onBuy,
  className,
  style,
}: {
  card: PricingCard;
  subscriptionMonths: SubscriptionMonths;
  onSubscriptionMonthsChange: (months: SubscriptionMonths) => void;
  onBuy: (id: PurchaseTariffId) => void;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <article
      className={cn("pricing-card tariff-plan", card.popular && "pricing-card--popular", className)}
      style={{ ...style, "--plan": card.accent, "--plan-ink": card.accent === getSchoolColor("fan") ? "#1a1814" : "#fff" } as CSSProperties}
    >
      <div className="tariff-plan-head">
        <h3 className="font-unbounded">{card.title}</h3>
        <p className="tariff-plan-price">
          <strong className={cn("font-unbounded", card.id === "split" && "is-mock")}>
            {isSubscriptionCard(card.id)
              ? subscriptionFigures(subscriptionMonths, subscriptionMonthlyBase(card.id)).price
              : card.price}
          </strong>
        </p>
        {isSubscriptionCard(card.id) ? (
          <p className="tariff-plan-note">{subscriptionFigures(subscriptionMonths, subscriptionMonthlyBase(card.id)).note}</p>
        ) : card.priceSuffix ? (
          <p className="tariff-plan-note">{card.priceSuffix}</p>
        ) : null}
      </div>

      <div className="tariff-plan-body">
        {isSubscriptionCard(card.id) ? (
          <SubscriptionTermPicker value={subscriptionMonths} onChange={onSubscriptionMonthsChange} />
        ) : null}
        <p className="tariff-plan-lead">{card.description}</p>
        <ul className="tariff-features">
          {card.features.map((feature) => (
            <li key={feature}>
              <CheckIcon />
              <span>{feature}</span>
            </li>
          ))}
        </ul>
        <button type="button" className="tariff-buy" onClick={() => onBuy(card.id as PurchaseTariffId)}>
          {card.cta}
        </button>
      </div>
    </article>
  );
}

const TARIFF_FORMATS: readonly { id: TariffFormat; label: string }[] = [
  { id: "solo", label: "Индивидуальные" },
  { id: "group", label: "Групповые" },
  { id: "online", label: "Онлайн" },
];

const TARIFF_CARDS: PricingCard[] = [...GROUP_CARDS, ...SOLO_CARDS, SPLIT_CARD];

function visibleTariffs(cards: readonly PricingCard[], start: number, count: number): PricingCard[] {
  if (cards.length === 0) return [];
  return Array.from({ length: Math.min(count, cards.length) }, (_, offset) => cards[(start + offset) % cards.length]);
}

function TariffArrow({ direction, label, onClick }: { direction: "prev" | "next"; label: string; onClick: () => void }) {
  return (
    <button type="button" className="tariff-arrow" aria-label={label} onClick={onClick}>
      <svg className="tariff-arrow-icon" viewBox="0 0 24 24" aria-hidden>
        <path
          d={direction === "prev" ? "M16 5 8 12l8 7" : "M8 5l8 7-8 7"}
          fill="none"
          stroke="currentColor"
          strokeWidth="2.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}

export default function Tariffs() {
  const sectionRef = useRef<HTMLElement>(null);
  const isMobile = useMobileMedia();
  const [formatId, setFormatId] = useState<TariffFormat>("group");
  const [start, setStart] = useState(0);
  const [subscriptionMonths, setSubscriptionMonths] = useState<SubscriptionMonths>(1);
  const [purchaseTariffId, setPurchaseTariffId] = useState<PurchaseTariffId | null>(null);
  useRevealFade(sectionRef);
  const cards = TARIFF_CARDS;
  const visibleCount = isMobile ? 1 : 3;
  const visible = visibleTariffs(cards, start, visibleCount);
  const step = (delta: number) => setStart((index) => (index + delta + cards.length) % cards.length);
  const swipeRef = useHorizontalSwipe(step);
  const chooseFormat = (next: TariffFormat) => {
    setFormatId(next);
  };

  return (
    <section id="tariffs" ref={sectionRef} className="pricing-section relative py-16 md:py-24" style={{ background: "var(--mos-bg)" }}>
      <div className="mx-auto max-w-6xl px-4 md:px-6">
        <div className="landing-frame">
        <div className="landing-frame-head reveal-fade">
          <h2 className="font-unbounded text-3xl tracking-[0.12em] md:text-5xl">Тарифы</h2>
          <div className="flex shrink-0 items-center gap-2">
            <TariffArrow direction="prev" label="Предыдущие тарифы" onClick={() => step(-1)} />
            <TariffArrow direction="next" label="Следующие тарифы" onClick={() => step(1)} />
          </div>
        </div>
        <p className="landing-frame-copy mt-3 max-w-2xl font-golos">
          Групповые и персональные в зале. Сплит — макет на двоих, без рублёвой цены.
        </p>
        <div className="mt-4 flex flex-wrap gap-2" role="tablist" aria-label="Формат">
          {TARIFF_FORMATS.map((format) => (
            <button
              key={format.id}
              type="button"
              role="tab"
              className={`hall-day-chip${format.id === formatId ? " is-active" : ""}`}
              aria-selected={format.id === formatId}
              onClick={() => chooseFormat(format.id)}
            >
              {format.label}
            </button>
          ))}
        </div>

        <div
          ref={swipeRef}
          className={cn("tariff-swipe mt-10 grid items-stretch gap-5", visibleCount === 1 ? "grid-cols-1" : "grid-cols-3")}
          aria-roledescription="карусель"
          aria-label="Тарифы"
        >
          {visible.map((card) => (
            <PricingCardView
              key={card.id}
              card={card}
              subscriptionMonths={subscriptionMonths}
              onSubscriptionMonthsChange={setSubscriptionMonths}
              onBuy={setPurchaseTariffId}
            />
          ))}
        </div>
        <div className="hall-filmstrip-dots" role="tablist" aria-label="Кадры тарифов">
          {cards.map((card, index) => (
            <button
              key={card.id}
              type="button"
              role="tab"
              className={`hall-filmstrip-dot${index === start ? " is-active" : ""}`}
              aria-selected={index === start}
              aria-label={`${card.lane}: ${card.title}`}
              onClick={() => setStart(index)}
            />
          ))}
        </div>

        </div>
      </div>
      {purchaseTariffId ? (
        <TariffPurchase tariffId={purchaseTariffId} onClose={() => setPurchaseTariffId(null)} />
      ) : null}
    </section>
  );
}
