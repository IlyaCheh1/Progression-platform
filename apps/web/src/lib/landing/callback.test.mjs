import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";

const read = (relativePath) => readFileSync(fileURLToPath(new URL(relativePath, import.meta.url)), "utf8");

describe("landing callback and draft legal docs", () => {
  const landing = read("../../screens/landing/index.tsx");
  const callback = read("../../screens/landing/callback.tsx");
  const legal = read("../legal/content.ts");

  it("places the callback after the trial banner and before the footer", () => {
    const trialAt = landing.indexOf("<TrialBanner />");
    const callbackAt = landing.indexOf("<CallbackBlock />");
    const footerAt = landing.indexOf("<Footer />");
    const answersAt = landing.indexOf("<Answers />");
    assert.ok(answersAt >= 0 && trialAt > answersAt && callbackAt > trialAt && footerAt > callbackAt);
  });

  it("requires both consents and does not send or store the phone", () => {
    assert.match(callback, /personal-data/);
    assert.match(callback, /info-consent/);
    assert.match(callback, /Остались вопросы\?/);
    assert.doesNotMatch(callback, /Нужен звонок\?/);
    assert.doesNotMatch(callback, /Напишите школе/);
    assert.match(callback, /Нужны обе отметки/);
    assert.match(callback, /\/legal\/personal-data/);
    assert.match(callback, /\/legal\/info-consent/);
    assert.doesNotMatch(callback, /fetch\(|localStorage|console\.|\/api\/leads/);
    assert.doesNotMatch(callback, /Номер на сайте не сохраняется/);
    assert.match(callback, /setPhone\(""\)/);
  });

  it("hosts school drafts and does not paste the source campaign", () => {
    assert.match(legal, /personal-data/);
    assert.match(legal, /info-consent/);
    assert.match(legal, /770974466360/);
    assert.match(legal, /326774600434003/);
    assert.match(legal, /Политика обработки персональных данных/);
    assert.match(legal, /Согласие на получение информационных материалов/);
    assert.doesNotMatch(legal, /Черновик|не юридическое заключение|консультации юриста/);
    assert.doesNotMatch(legal, /DDX|ИЛОН|ddxfitness|Infinity/i);
  });

  it("points the footer at the school offer, user terms, and recurrent draft", () => {
    const footer = read("../../components/footer.tsx");
    assert.match(footer, /href: "\/legal\/offer"/);
    assert.match(footer, /href: "\/legal\/terms"/);
    assert.match(footer, /href: "\/legal\/recurrent"/);
    assert.match(legal, /recurrent:/);
    assert.match(legal, /Публичная оферта/);
    assert.match(legal, /Пользовательское соглашение/);
    assert.match(legal, /Рекуррентные платежи/);
    assert.match(legal, /ИП Грибанов Татьяна Николаевна/);
    assert.doesNotMatch(legal, /Грибанова/);
    assert.match(legal, /770974466360/);
    assert.match(legal, /326774600434003/);
    assert.doesNotMatch(legal, /DDX|ИЛОН|ddxfitness|Infinity/i);
  });
});
