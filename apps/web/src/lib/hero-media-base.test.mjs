import test from "node:test";
import assert from "node:assert/strict";

import { heroStillFile, isHeroImageFile, normalizeMediaBase } from "./hero-media.ts";

test("strips doubled bucket segment on selstorage.ru", () => {
  assert.equal(
    normalizeMediaBase("https://abc.selstorage.ru/mos/media/hero"),
    "https://abc.selstorage.ru/media/hero",
  );
});

test("keeps correct selstorage media base", () => {
  assert.equal(
    normalizeMediaBase("https://abc.selstorage.ru/media/hero"),
    "https://abc.selstorage.ru/media/hero",
  );
});

test("keeps local fallback", () => {
  assert.equal(normalizeMediaBase("/media/hero"), "/media/hero");
});

test("detects still files and school posters", () => {
  assert.equal(heroStillFile("school.mp4"), "school.webp");
  assert.equal(heroStillFile("5.webp"), "5.webp");
  assert.equal(isHeroImageFile("2.webp"), true);
  assert.equal(isHeroImageFile("school.mp4"), false);
});
