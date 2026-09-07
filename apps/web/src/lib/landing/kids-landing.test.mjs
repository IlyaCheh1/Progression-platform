import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";

describe("kids landing hotfix", () => {
  it("keeps a simple kids hero and skips the rooms slider", () => {
    const landing = readFileSync(fileURLToPath(new URL("../../screens/landing/index.tsx", import.meta.url)), "utf8");
    const directions = readFileSync(fileURLToPath(new URL("../../screens/landing/directions.tsx", import.meta.url)), "utf8");
    const hero = readFileSync(fileURLToPath(new URL("../../screens/landing/hero.tsx", import.meta.url)), "utf8");

    assert.match(landing, /\{!isKids \? <Directions \/> : null\}/);
    assert.doesNotMatch(directions, /KIDS_SLIDES/);
    assert.doesNotMatch(directions, /useAudience/);
    assert.match(hero, /isKids \? \(/);
    assert.match(hero, /KIDS_WUSHU\.media\.hero/);
  });

  it("commits a local child wushu hero image", () => {
    const image = fileURLToPath(new URL("../../../public/media/hero/kids-wushu-child.webp", import.meta.url));
    assert.equal(existsSync(image), true);
    const credit = readFileSync(fileURLToPath(new URL("../../../public/media/hero/ATTRIBUTION.md", import.meta.url)), "utf8");
    assert.match(credit, /7988769/);
    assert.match(credit, /Pexels/i);
  });
});
