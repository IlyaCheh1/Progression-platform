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
    assert.doesNotMatch(hero, /KIDS_WUSHU\.section/);
    assert.doesNotMatch(hero, /hero-audience-toggle/);
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
    assert.match(header, /data-kids=\{isKids \|\| undefined\}/);
    assert.match(header, /AudienceToggle/);
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

  it("exposes /kids as a real page and redirects the old query", () => {
    const home = readFileSync(fileURLToPath(new URL("../../app/page.tsx", import.meta.url)), "utf8");
    const kids = readFileSync(fileURLToPath(new URL("../../app/kids/page.tsx", import.meta.url)), "utf8");
    const toggle = readFileSync(fileURLToPath(new URL("../../components/audience-toggle.tsx", import.meta.url)), "utf8");
    const css = readFileSync(fileURLToPath(new URL("../../screens/landing/styles.css", import.meta.url)), "utf8");

    assert.match(kids, /initialAudience="kids"/);
    assert.match(kids, /canonical: "\/kids"/);
    assert.match(home, /permanentRedirect\("\/kids"\)/);
    assert.match(home, /initialAudience="adults"/);
    assert.match(toggle, /homeForAudience\("kids"\)/);
    assert.match(toggle, /homeForAudience\("adults"\)/);
    assert.match(css, /kids-age-ribbon[\s\S]*font-size:\s*calc\(0\.68rem \* 2\)/);
    assert.match(css, /hero-audience-badge \{[\s\S]*font-size:\s*calc\(0\.68rem \* 1\.2\)/);
    assert.match(css, /landing-header\[data-kids\] \.hero-audience-badge\[data-active\][\s\S]*background:\s*#5a8f7b/);
  });
});
