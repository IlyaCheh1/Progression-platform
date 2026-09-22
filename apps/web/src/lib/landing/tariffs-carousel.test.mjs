import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";

describe("landing tariff carousel", () => {
  const source = readFileSync(fileURLToPath(new URL("../../screens/landing/tariffs.tsx", import.meta.url)), "utf8");

  it("keeps the current tariff names, prices, and included items", () => {
    for (const text of [
      "Пробное занятие",
      "1 000 ₽",
      "от 5 000 ₽",
      "2 000 ₽",
      "4 000 ₽",
      "от 12 800 ₽",
      "Групповые тренировки",
      "RPG-прогресс и XP",
      "Индивидуально с тренером",
      "Ставка 3 200 ₽/ч при абонементе",
      "Дистанционный формат",
      "Разбор техники",
      "Система скидок",
      "Общий ритм зала, партнёрская работа и RPG-прогресс. Пробное занятие — 1 000 ₽.",
      "Час с тренером в зале. Разовое — 4 000 ₽. Ставка ниже на абонементе.",
      "Индивидуальное занятие в онлайн-формате с тренером.",
      'title: "Сплит"',
      "макет · 2 человека",
      "Заглушка. Парная персоналка на двоих — цена и слоты появятся после ТЗ.",
      "Двое в зале",
      "Общий тренер",
      "Черновик формата",
      "tariff-plan-lead",
    ]) {
      assert.match(source, new RegExp(text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
    }
    assert.doesNotMatch(source, /50% скидка на второй абонемент/);
    assert.doesNotMatch(source, /Клинки Востока/);
    assert.doesNotMatch(source, /Infinity/);
    assert.doesNotMatch(source, /InBody/);
    assert.doesNotMatch(source, /PLUS/);
    assert.doesNotMatch(source, /Smart/);
    assert.match(source, /tariff-plan-head/);
    assert.match(source, /tariff-plan-body/);
    assert.match(source, /className="tariff-buy"/);
    assert.match(source, /hall-filmstrip-dot/);
    assert.match(source, /onBuy\(card\.id as PurchaseTariffId\)/);
  });

  it("switches the card row with previous and next arrows", () => {
    assert.match(source, /label="Предыдущие тарифы"/);
    assert.match(source, /label="Следующие тарифы"/);
    assert.match(source, /aria-label=\{label\}/);
    assert.match(source, /\(index \+ delta \+ cards\.length\) % cards\.length/);
    assert.match(source, /Индивидуальные/);
    assert.match(source, /Онлайн/);
    assert.match(source, /const cards = TARIFF_CARDS;/);
    assert.doesNotMatch(source, /card\.format === formatId/);
    assert.doesNotMatch(source, /Все форматы/);
    assert.doesNotMatch(source, /Заявка в контакты/);
    assert.doesNotMatch(source, /полной странице тарифов/);
    assert.doesNotMatch(source, /Онлайн \(парные\)|макет · пара/);
    const redirect = readFileSync(fileURLToPath(new URL("../../app/tariffs/page.tsx", import.meta.url)), "utf8");
    assert.match(redirect, /location\.replace\("\/#tariffs"\)/);
    assert.doesNotMatch(redirect, /Групповые|Сплиты|promo-card/);
    assert.match(source, /visibleCount === 1 \? "grid-cols-1" : "grid-cols-3"/);
    assert.match(source, /useHorizontalSwipe\(step\)/);
    assert.match(source, /tariff-swipe/);
    const swipe = readFileSync(fileURLToPath(new URL("../../hooks/landing/useHorizontalSwipe.ts", import.meta.url)), "utf8");
    assert.match(swipe, /max-width: 767px/);
    assert.match(swipe, /classifySwipeAxis/);
    assert.doesNotMatch(swipe, /addEventListener\(\s*["']wheel["']/);
    assert.doesNotMatch(source, /<PricingCardView[\s\S]*reveal-fade/);
  });

  it("keeps the subscription price note on one full-width line", () => {
    const css = readFileSync(fileURLToPath(new URL("../../screens/landing/styles.css", import.meta.url)), "utf8");
    const price = css.match(/#tariffs \.tariff-plan-price \{[^}]*\}/);
    const note = css.match(/#tariffs \.tariff-plan-note \{[^}]*\}/);
    assert.ok(price && note);
    assert.match(price[0], /grid-column:\s*2/);
    assert.match(price[0], /grid-row:\s*1/);
    assert.match(note[0], /grid-column:\s*1 \/ -1/);
    assert.match(note[0], /grid-row:\s*2/);
    assert.match(note[0], /white-space:\s*nowrap/);
    assert.match(note[0], /max-width:\s*none/);
    assert.match(source, /tariff-plan-note/);
    const trial = readFileSync(fileURLToPath(new URL("../../screens/landing/trial-banner.tsx", import.meta.url)), "utf8");
    assert.match(trial, /Первый выход: знакомство с тренером, техникой и залом\./);
    assert.doesNotMatch(trial, /Первый выход в зал:/);
    const journal = readFileSync(fileURLToPath(new URL("../../app/journal/page.tsx", import.meta.url)), "utf8");
    assert.match(journal, />Журнал</);
    assert.doesNotMatch(journal, />Мастер меча</);
  });
});
