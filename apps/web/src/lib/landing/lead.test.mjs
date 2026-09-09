import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { COURSE_LEAD_SOURCE, LANDING_LEAD_SOURCE, validateLandingLeadInput } from "./lead.ts";

const valid = {
  name: "Иван Петров",
  phone: "89151234567",
  email: "ivan@example.com",
  comment: "Хочу пробное",
};

describe("validateLandingLeadInput", () => {
  it("accepts a complete request and normalizes phone", () => {
    const result = validateLandingLeadInput(valid);
    assert.equal(result.ok, true);
    if (!result.ok) return;
    assert.equal(result.value.phone, "+79151234567");
    assert.equal(result.value.source, LANDING_LEAD_SOURCE);
    assert.equal(result.value.email, "ivan@example.com");
    assert.equal(result.value.comment, "Хочу пробное");
  });

  it("stores a course direction and course source", () => {
    const result = validateLandingLeadInput({
      name: "Анна",
      phone: "+7 915 123-45-67",
      direction: "sablya",
      source: COURSE_LEAD_SOURCE,
    });
    assert.equal(result.ok, true);
    if (!result.ok) return;
    assert.equal(result.value.direction, "sablya");
    assert.equal(result.value.source, COURSE_LEAD_SOURCE);
  });

  it("rejects short name, short phone, bad email and bad direction", () => {
    const result = validateLandingLeadInput({
      name: "И",
      phone: "123",
      email: "not-an-email",
      direction: "not a slug",
    });
    assert.equal(result.ok, false);
    if (result.ok) return;
    assert.equal(result.errors.name, "Укажите имя.");
    assert.equal(result.errors.phone, "Укажите телефон, минимум 10 цифр.");
    assert.equal(result.errors.email, "Некорректный email.");
    assert.equal(result.errors.direction, "Некорректное направление.");
  });
});
