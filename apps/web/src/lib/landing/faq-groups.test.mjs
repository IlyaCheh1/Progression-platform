import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";

import { FAQ_GROUPS } from "./faq-groups.ts";

describe("grouped landing FAQ", () => {
  it("keeps the three topics and school facts instead of gym-chain products", () => {
    assert.deepEqual(
      FAQ_GROUPS.map((group) => group.label),
      ["Подписка", "Оплата", "Тренировка"],
    );
    const text = FAQ_GROUPS.flatMap((group) => group.items.flatMap((item) => [item.question, item.answer])).join("\n");
    assert.match(text, /1 000 ₽/);
    assert.match(text, /от 5 000 ₽/);
    assert.match(text, /4 000 ₽ за час/);
    assert.match(text, /12 800 ₽/);
    assert.match(text, /3 000 ₽ \/ час/);
    assert.match(text, /Госпитальный вал 5к18/);
    assert.doesNotMatch(text, /5к1(?!\d)/);
    assert.match(text, /Сколько стоит аренда зала/);
    assert.match(text, /Какие залы можно арендовать/);
    assert.match(text, /Зал УШУ и зал фехтования/);
    assert.match(text, /\/arenda#zayavka/);
    assert.match(text, /зеркала/);
    assert.match(text, /ласточкин хвост/);
    assert.match(text, /от 6 лет/);
    assert.doesNotMatch(text, /Infinity|InBody|Smart Start|DDX|спа-зон|браслет|Light|ресепшен/i);

    const landing = readFileSync(fileURLToPath(new URL("../../screens/landing/answers.tsx", import.meta.url)), "utf8");
    const index = readFileSync(fileURLToPath(new URL("../../screens/landing/index.tsx", import.meta.url)), "utf8");
    assert.match(landing, /Вопросы и ответы/);
    assert.match(landing, /aria-expanded/);
    assert.match(landing, /FAQ_GROUPS/);
    assert.match(index, /<Answers \/>/);
    assert.doesNotMatch(index, /<Questions \/>|Напишите школе/);
  });
});
