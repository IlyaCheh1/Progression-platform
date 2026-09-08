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
    assert.match(hero, /<picture>/);
    assert.match(hero, /KIDS_WUSHU\.media\.heroMobile/);
    assert.match(hero, /KIDS_WUSHU\.media\.heroDesktop/);
    assert.doesNotMatch(hero, /KIDS_WUSHU\.media\.hero"/);
    assert.match(hero, /KIDS_WUSHU\.school/);
    assert.match(hero, /KIDS_WUSHU\.section/);
    assert.match(hero, /KIDS_WUSHU\.lead/);
    assert.match(hero, /items-center justify-center[\s\S]*text-center/);
    assert.doesNotMatch(hero, /KIDS_WUSHU\.slogan/);
    assert.doesNotMatch(hero, /KIDS_WUSHU\.body/);
    assert.doesNotMatch(hero, /Тренер Татьяна|Сила тела\. Дух дракона/);
    assert.doesNotMatch(hero, /KIDS_WUSHU\.brand/);
    assert.doesNotMatch(hero, /Школа фехтования|Мастер меча/);
  });

  it("keeps kids chrome on wushu naming only", () => {
    const header = readFileSync(fileURLToPath(new URL("../../components/header-public.tsx", import.meta.url)), "utf8");
    const articles = readFileSync(fileURLToPath(new URL("../../screens/landing/articles.tsx", import.meta.url)), "utf8");
    const footer = readFileSync(fileURLToPath(new URL("../../components/footer.tsx", import.meta.url)), "utf8");

    assert.match(header, /useHeroVisible/);
    assert.match(header, /data-over-hero=\{overHero \|\| undefined\}/);
    assert.match(header, /isKids \? `\$\{KIDS_WUSHU\.school\} — главная`/);
    assert.match(articles, /isKids \? KIDS_WUSHU\.school : "Мастер меча"/);
    assert.match(footer, /KIDS_WUSHU\.school/);
    assert.match(footer, /KIDS_WUSHU\.section/);
    assert.match(footer, /isKids/);
  });

  it("commits official text-free Shagal poster A hero art", () => {
    const desktop = fileURLToPath(new URL("../../../public/media/hero/kids-wushu-hero-16x9.webp", import.meta.url));
    const mobile = fileURLToPath(new URL("../../../public/media/hero/kids-wushu-hero-9x16.webp", import.meta.url));
    const pexels = fileURLToPath(new URL("../../../public/media/hero/kids-wushu-child.webp", import.meta.url));
    assert.equal(existsSync(desktop), true);
    assert.equal(existsSync(mobile), true);
    assert.equal(existsSync(pexels), false);
    const credit = readFileSync(fileURLToPath(new URL("../../../public/media/hero/ATTRIBUTION.md", import.meta.url)), "utf8");
    assert.match(credit, /poster A/);
    assert.match(credit, /FECHTOGRAPHY/);
    assert.match(credit, /text-free/);
    assert.doesNotMatch(credit, /Pexels/i);
  });
});
