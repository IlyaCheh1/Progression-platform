import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";

const read = (relativePath) => readFileSync(fileURLToPath(new URL(relativePath, import.meta.url)), "utf8");

describe("landing promotions", () => {
  const promos = read("./promos.ts");
  const block = read("../../screens/landing/promos.tsx");
  const landing = read("../../screens/landing/index.tsx");
  const tariffs = read("../../screens/landing/tariffs.tsx");
  const listPage = read("../../app/akcii/page.tsx");
  const detailPage = read("../../app/akcii/[slug]/page.tsx");

  it("moves the tariff offer into the promotions data", () => {
    for (const text of [
      "50% скидка на второй абонемент для влюблённых",
      "50% скидка на второй абонемент внутри семьи",
      "Клинки Востока",
      "Итальянская рапира",
      "Иберийский двуручный меч",
      "1 000 ₽",
      "Первое занятие бесплатно",
    ]) {
      assert.match(promos, new RegExp(text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
    }
    assert.doesNotMatch(promos, /Infinity|DDX|66%/);
  });

  it("places the framed mosaic immediately after tariffs", () => {
    const tariffsAt = landing.indexOf("<Tariffs />");
    const promosAt = landing.indexOf("<Promos />");
    const addressAt = landing.indexOf("<Address />");
    assert.ok(tariffsAt >= 0 && promosAt > tariffsAt && addressAt > promosAt);
    assert.equal(landing.indexOf("<Promos />", promosAt + 1), -1);
    assert.match(block, /landing-frame/);
    assert.match(block, /Все акции/);
    assert.match(block, /Подробнее/);
    assert.match(block, /promo-tile-feature/);
    assert.match(block, /Акции/);
  });

  it("drops the offer copy from the tariffs block", () => {
    assert.doesNotMatch(tariffs, /50% скидка на второй абонемент/);
    assert.doesNotMatch(tariffs, /Клинки Востока/);
    assert.doesNotMatch(tariffs, /Первое занятие в детской секции ушу бесплатно/);
    assert.doesNotMatch(tariffs, /<h3[^>]*>Система скидок<\/h3>/);
    assert.match(tariffs, /Система скидок/);
  });

  it("lists the same offers and opens a structured details page", () => {
    for (const slug of ["vtoroj-abonement", "probnoe-zanyatie", "pervoe-zanyatie"]) {
      assert.match(listPage, new RegExp(`/akcii/\\$\\{promo\\.slug\\}|${slug}`));
    }
    assert.match(listPage, /Подробнее/);
    assert.match(listPage, /LANDING_PROMOS/);
    const crumbsAt = detailPage.indexOf("promo-detail-crumbs");
    const imageAt = detailPage.indexOf("promo-detail-hero");
    const conditionsAt = detailPage.indexOf(">Условия<");
    const descriptionAt = detailPage.indexOf(">Описание<");
    const tariffsAt = detailPage.indexOf("<Tariffs />");
    const formAt = detailPage.indexOf("<CallbackBlock />");
    assert.ok(crumbsAt >= 0 && imageAt > crumbsAt && conditionsAt > imageAt && descriptionAt > conditionsAt);
    assert.ok(tariffsAt > descriptionAt && formAt > tariffsAt);
    assert.equal(detailPage.indexOf("<Answers"), -1);
    assert.match(detailPage, /promo-detail-included/);
    assert.match(detailPage, /Главная/);
    assert.match(detailPage, /href="\/akcii"/);
    assert.match(detailPage, /promo-detail-top/);
    assert.match(detailPage, /<h1>\{promo\.title\}<\/h1>/);
    assert.match(detailPage, /promo\.image/);
    assert.match(detailPage, /promo\.lead/);
    assert.match(detailPage, /promo\.included/);
    assert.match(detailPage, /promo\.footnotes/);
    assert.match(detailPage, /PROMO_NO_ENTRANCE_FEE/);
    assert.match(detailPage, /<PromoSignup /);
    assert.doesNotMatch(detailPage, /Выбери свой тариф|Напишите школе|Questions/);
    assert.doesNotMatch(detailPage, /Infinity|DDX|66%|вступительный платёж|Купить сейчас/i);
    const signup = read("../../screens/landing/promo-signup.tsx");
    assert.match(signup, /TariffPurchase/);
    assert.match(signup, /Купить/);
    const css = read("../../screens/landing/styles.css");
    assert.match(css, /\.promo-detail-top \{[\s\S]*?grid-template-columns: minmax\(0, 1\.15fr\)/);
    const signupRule = css.match(/\.promo-detail-signup \{[^}]*\}/);
    assert.ok(signupRule);
    assert.match(signupRule[0], /width:\s*50%/);
    assert.match(signupRule[0], /align-self:\s*center/);
    assert.match(signupRule[0], /justify-content:\s*center/);
    assert.match(css, /\.promo-detail-notes \{[^}]*padding-left:\s*0/);
    assert.match(css, /\.promo-detail-notes \{[^}]*text-align:\s*left/);
    assert.match(css, /\.promo-detail-included \{[^}]*list-style:\s*disc/);
    assert.match(landing, /<Answers \/>/);
    assert.doesNotMatch(css, /\.tariff-buy \{[^}]*width:\s*50%/);
    assert.doesNotMatch(landing, /<Questions|Напишите школе/);
  });
});
