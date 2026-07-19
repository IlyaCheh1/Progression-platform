import test from "node:test";
import assert from "node:assert/strict";

const LEGACY = { "5": "northern_lights", "2": "prison" };
const PATHS = {
  northern_lights: "/media/backgrounds/northern_lights.webp",
  volcano: "/media/backgrounds/volcano.webp",
};

function normalizeBackgroundId(value) {
  const raw = (value ?? "").trim();
  if (!raw) return "northern_lights";
  if (PATHS[raw]) return raw;
  if (LEGACY[raw]) return LEGACY[raw];
  return "northern_lights";
}

function backgroundImagePath(value) {
  const id = normalizeBackgroundId(value);
  return PATHS[id] ?? "/media/backgrounds/northern_lights.webp";
}

test("normalizeBackgroundId maps legacy numeric keys to OG slugs", () => {
  assert.equal(normalizeBackgroundId("5"), "northern_lights");
  assert.equal(normalizeBackgroundId("2"), "prison");
});

test("backgroundImagePath resolves OG assets in public/media/backgrounds", () => {
  assert.equal(backgroundImagePath("northern_lights"), "/media/backgrounds/northern_lights.webp");
  assert.equal(backgroundImagePath("volcano"), "/media/backgrounds/volcano.webp");
  assert.equal(backgroundImagePath(undefined), "/media/backgrounds/northern_lights.webp");
});
