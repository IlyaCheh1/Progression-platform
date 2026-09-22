import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";

import { TRAINING_FORMATS } from "./training-formats.ts";

describe("training format cards", () => {
  it("lists the three site formats with local webp photos", () => {
    assert.deepEqual(
      TRAINING_FORMATS.map((item) => item.title),
      ["Групповые тренировки", "Индивидуальные тренировки", "Онлайн-курс"],
    );
    assert.equal(
      TRAINING_FORMATS[0].summary,
      "Занятия в группе: ритм зала, партнёрская работа и общий прогресс школы.",
    );
    assert.equal(
      TRAINING_FORMATS[1].summary,
      "Персональный разбор техники с тренером и ускоренная коррекция ошибок.",
    );
    assert.equal(TRAINING_FORMATS[2].summary, "Индивидуальное занятие в онлайн-формате с тренером.");
    assert.match(TRAINING_FORMATS[0].details.join(" "), /1 000 ₽/);
    assert.match(TRAINING_FORMATS[0].details.join(" "), /2 000 ₽/);
    assert.match(TRAINING_FORMATS[0].details.join(" "), /5 000 ₽/);
    assert.match(TRAINING_FORMATS[1].details.join(" "), /4 000 ₽/);
    assert.match(TRAINING_FORMATS[1].details.join(" "), /12 800 ₽/);
    assert.match(TRAINING_FORMATS[2].details.join(" "), /4 000 ₽ за час/);

    for (const item of TRAINING_FORMATS) {
      assert.match(item.photo, /^\/media\/formats\/.+\.webp$/);
      const file = fileURLToPath(new URL(`../../../public${item.photo}`, import.meta.url));
      assert.equal(existsSync(file), true, `missing ${item.photo}`);
    }
  });

  it("opens a modal from Подробнее and does not use the gym reference wording", () => {
    const landing = readFileSync(fileURLToPath(new URL("../../screens/landing/services.tsx", import.meta.url)), "utf8");
    const css = readFileSync(fileURLToPath(new URL("../../screens/landing/styles.css", import.meta.url)), "utf8");
    assert.match(landing, /Подробнее/);
    assert.match(landing, /aria-label="Закрыть"/);
    assert.match(landing, /format-dialog/);
    assert.match(landing, /TRAINING_FORMATS/);
    assert.match(landing, /object-cover/);
    assert.match(css, /\.format-card-photo img[\s\S]*object-fit:\s*cover/);
    assert.match(css, /\.format-dialog/);
    assert.doesNotMatch(landing, /Инвентарь/);
    assert.doesNotMatch(landing, /персональную программу/);
    assert.doesNotMatch(`${landing}\n${TRAINING_FORMATS.map((item) => item.details.join(" ")).join("\n")}`, /\.jpg/);
  });
});
