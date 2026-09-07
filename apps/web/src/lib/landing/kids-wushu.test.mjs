import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { KIDS_AMBER, KIDS_SAGE, KIDS_WUSHU, kidsPhoneHref } from "./kids-wushu.ts";

describe("kids wushu canon (poster A)", () => {
  it("keeps poster A copy, palette and media wiring", () => {
    assert.equal(KIDS_WUSHU.school, "Школа фехтования");
    assert.equal(KIDS_WUSHU.brand, "Мастер меча");
    assert.equal(KIDS_WUSHU.section, "Детская секция ушу");
    assert.equal(KIDS_WUSHU.slogan, "Сила тела. Дух дракона. Путь чемпиона.");
    assert.match(KIDS_WUSHU.body, /характер, волю и уверенность/);
    assert.match(KIDS_WUSHU.body, /10 лет преподавания, 25 лет в спорте/);
    assert.deepEqual(
      KIDS_WUSHU.bullets.map((item) => item.title),
      [
        "Традиционное и современное ушу",
        "Координация, гибкость и акробатика",
        "Дисциплина и внутренняя сила",
        "Соревнования и показательные выступления",
      ],
    );
    assert.equal(KIDS_WUSHU.cta, "Первое занятие бесплатно!");
    assert.equal(KIDS_WUSHU.age, "Набор от 6 лет");
    assert.equal(KIDS_WUSHU.enroll, "Запишись сейчас");
    assert.equal(KIDS_WUSHU.phoneDisplay, "+7 (915) 048-61-60");
    assert.equal(kidsPhoneHref(), "tel:+79150486160");
    assert.equal(KIDS_SAGE, "#5a8f7b");
    assert.equal(KIDS_AMBER, "#d4a84b");
    assert.equal(KIDS_WUSHU.media.hero, "/media/courses/east-hero.webp");
    assert.equal(KIDS_WUSHU.media.trainer, "/media/trainers/tatyana-gribanova.webp");
    assert.equal(KIDS_WUSHU.media.logo, "/media/logo-mark.png");
  });
});
