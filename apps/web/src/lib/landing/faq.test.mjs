import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { faqForAudience, LANDING_FAQ } from "./faq.ts";

describe("landing FAQ", () => {
  it("keeps shared items and splits kids vs adults", () => {
    const kids = faqForAudience(true);
    const adults = faqForAudience(false);

    assert.ok(kids.some((item) => item.id === "kids-age"));
    assert.ok(!kids.some((item) => item.id === "rpg"));
    assert.ok(adults.some((item) => item.id === "formats"));
    assert.ok(!adults.some((item) => item.id === "kids-age"));
    assert.ok(LANDING_FAQ.every((item) => kids.includes(item) || adults.includes(item)));
  });
});
