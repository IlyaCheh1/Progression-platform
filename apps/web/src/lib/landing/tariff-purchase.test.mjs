import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";

import {
  PURCHASE_ONLINE_ADDON,
  PURCHASE_PAYMENT_NOTICE,
  PURCHASE_SCHOOL_NAME,
  PURCHASE_TARIFFS,
  lookupPurchaseClient,
  purchasePhone,
  registrationErrors,
} from "./tariff-purchase.ts";

describe("landing tariff purchase", () => {
  it("treats every phone as a new client and does not log it", () => {
    assert.deepEqual(lookupPurchaseClient("+79990001122"), { known: false });
    assert.deepEqual(lookupPurchaseClient("any"), { known: false });
    const source = readFileSync(fileURLToPath(new URL("./tariff-purchase.ts", import.meta.url)), "utf8");
    assert.match(source, /return \{ known: false \}/);
    assert.doesNotMatch(source, /console\.(log|info|debug|warn|error)/);
    assert.doesNotMatch(source, /localStorage|checkoutMembership|yoomoney|fetch\(/);
  });

  it("lists the landing tariffs, six sections, and a non-charging pay notice", () => {
    assert.deepEqual(
      PURCHASE_TARIFFS.map((item) => item.priceLabel),
      ["1 000 ₽", "от 5 000 ₽", "2 000 ₽", "4 000 ₽", "от 12 800 ₽", "4 000 ₽", "макет · 2 человека"],
    );
    assert.equal(PURCHASE_SCHOOL_NAME, "Мастер меча");
    assert.match(PURCHASE_ONLINE_ADDON.detail, /фехтования и ушу/);
    assert.equal(PURCHASE_ONLINE_ADDON.priceLabel, "4 000 ₽");
    assert.match(PURCHASE_PAYMENT_NOTICE, /не отправляется/);
    const slides = readFileSync(fileURLToPath(new URL("./adult-directions.ts", import.meta.url)), "utf8");
    for (const title of ["Ушу", "Ведьмак", "Два меча", "Шпага XVII века", "Сабля XVI-XVII века", "Веер"]) {
      assert.match(slides, new RegExp(`title: "${title.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}"`));
    }
    assert.equal(purchasePhone("8 (915) 123-45-67"), "+79151234567");
    assert.equal(purchasePhone("123"), null);
    const errors = registrationErrors({
      name: "",
      surname: "",
      email: "bad",
      birthDate: "",
      phone: "1",
      gender: "",
    });
    assert.ok(errors.name && errors.surname && errors.email && errors.birthDate && errors.phone && errors.gender);
  });

  it("opens from Купить and skips to payment only when the lookup is known", () => {
    const tariffs = readFileSync(fileURLToPath(new URL("../../screens/landing/tariffs.tsx", import.meta.url)), "utf8");
    const dialog = readFileSync(fileURLToPath(new URL("../../screens/landing/tariff-purchase.tsx", import.meta.url)), "utf8");
    assert.match(tariffs, /Купить/);
    assert.doesNotMatch(tariffs, /Записаться|Выбрать тариф/);
    assert.match(tariffs, /<TariffPurchase/);
    assert.match(dialog, /lookup\.known/);
    assert.match(dialog, /setStep\("subscribe"\)/);
    assert.match(dialog, /setStep\("register"\)/);
    assert.match(dialog, /ADULT_COURSE_SLIDES/);
    assert.match(dialog, /\/media\/hero\//);
    assert.match(dialog, /Регистрация/);
    assert.match(dialog, /Секция/);
    assert.match(dialog, /Подписка/);
    assert.match(dialog, /Промокод/);
    assert.match(dialog, /Домашний клуб/);
    assert.match(dialog, />Школа</);
    assert.doesNotMatch(dialog, /вступительн|localStorage|checkoutMembership|fetch\(/i);
    assert.doesNotMatch(dialog, /фитнес|опыт тренировок/i);
    assert.match(dialog, /Давайте знакомиться/);
    assert.doesNotMatch(dialog, /Введите номер телефона|Номер на сайте не сохраняется/);
    assert.match(dialog, /\+7/);
    assert.match(dialog, /Проверить/);
    assert.match(dialog, /получение информационных материалов/);
    assert.match(dialog, /\/legal\/info-consent/);
    assert.match(dialog, /scrollTo\(scrollX, scrollY\)/);
    assert.doesNotMatch(dialog, /500\s*₽|скидк/i);
    const styles = readFileSync(fileURLToPath(new URL("../../screens/landing/styles.css", import.meta.url)), "utf8");
    assert.match(styles, /\.purchase-dialog \{[\s\S]*?position:\s*fixed/);
  });
});
