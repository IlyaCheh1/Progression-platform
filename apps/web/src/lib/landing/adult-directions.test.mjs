import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";

import { COURSE_ENROLL_HASH } from "../courses/constants.ts";
import { SCHOOL_HERO_VIDEO, WITCHER_HERO_VIDEO } from "../hero-media.ts";

function read(rel) {
  return readFileSync(fileURLToPath(new URL(rel, import.meta.url)), "utf8");
}

describe("adult direction slides", () => {
  const catalog = read("./adult-directions.ts");
  const data = read("../courses/data.ts");
  const landing = read("../../screens/landing/index.tsx");

  it("keeps school intro copy and a courses CTA", () => {
    assert.match(catalog, /title: "Мастер меча"/);
    assert.doesNotMatch(catalog, /«Мастер меча»/);
    assert.match(catalog, /мало обычного спорта"/);
    assert.doesNotMatch(catalog, /мало обычного спорта\./);
    assert.match(catalog, /любым клинком:\\nот китайского меча до европейского полуторника"/);
    assert.doesNotMatch(catalog, /и не только/);
    assert.doesNotMatch(catalog, /полуторника\./);
    assert.doesNotMatch(catalog, /directions:/);
    assert.doesNotMatch(catalog, /arsenal:/);
    assert.match(catalog, /cta: "Выбрать тренировки"/);
    assert.doesNotMatch(catalog, /Выбрать курсы/);
    assert.doesNotMatch(catalog, /Выбери подходящее именно тебе/);
    assert.doesNotMatch(catalog, /RPG-прокачкой/);
    assert.doesNotMatch(catalog, /опыт, способности, достижения и награды/);
    assert.equal(SCHOOL_HERO_VIDEO, "A-diagonal-fighters-moving-5s.mp4");
    assert.match(catalog, /ADULT_SCHOOL_VIDEO/);
    assert.match(catalog, /SCHOOL_HERO_VIDEO/);
    assert.equal(
      existsSync(fileURLToPath(new URL("../../../public/media/hero/A-diagonal-fighters-moving-5s.mp4", import.meta.url))),
      true,
    );
    assert.equal(
      existsSync(fileURLToPath(new URL("../../../public/media/hero/A-diagonal-fighters-moving-5s.webp", import.meta.url))),
      true,
    );
    const directions = read("../../screens/landing/directions.tsx");
    assert.match(directions, /text-\[1\.5em\]/);
    assert.match(directions, /calc\(0\.72em\+2pt\)/);
    assert.match(directions, /calc\(0\.875rem\+3pt\)/);
    assert.match(directions, /calc\(0\.875rem\+5pt\)/);
    assert.match(directions, /onOpenCourses/);
    assert.match(directions, /goToRoom\(1\)/);
  });

  it("lists adult courses with pages and enroll hashes", () => {
    for (const title of [
      "Ушу",
      "Ведьмак",
      "Два меча",
      "Шпага XVII века",
      "Сабля XVI-XVII века",
      "Веер",
    ]) {
      assert.match(catalog, new RegExp(title.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
    }

    for (const slug of ["ushu-vzroslye", "vedmak", "dva-mecha", "shpaga-xvii", "sablya", "veer"]) {
      assert.match(catalog, new RegExp(`courseSlug: "${slug}"`));
      assert.match(data, new RegExp(`slug: "${slug}"`));
      assert.match(data, new RegExp(`path: "/courses/${slug}"`));
    }

    assert.match(catalog, /comingSoon: true/);
    assert.match(data, /slug: "veer"[\s\S]*comingSoon: true/);
    assert.equal(COURSE_ENROLL_HASH, "enroll");
  });

  it("binds course slides to new studio stills and drops old hero videos", () => {
    const heroDir = fileURLToPath(new URL("../../../public/media/hero", import.meta.url));
    const stills = [
      ["two_swords", "2.webp", "dva-mecha"],
      ["fan", "5.webp", "veer"],
      ["ushu", "6.webp", "ushu-vzroslye"],
      ["rapier_xvii", "3.webp", "shpaga-xvii"],
      ["saber", "4.webp", "sablya"],
    ];

    for (const [key, file, slug] of stills) {
      assert.equal(existsSync(`${heroDir}/${file}`), true, `missing ${file}`);
      assert.match(
        catalog,
        new RegExp(`key: "${key}"[\\s\\S]*?image: "${file}"[\\s\\S]*?courseSlug: "${slug}"`),
      );
    }

    assert.doesNotMatch(catalog, /HERO_VIDEOS/);
    assert.doesNotMatch(catalog, /imageOnly/);
    assert.equal(WITCHER_HERO_VIDEO, "1.mp4");
    assert.equal(existsSync(`${heroDir}/1.mp4`), true);
    assert.equal(existsSync(`${heroDir}/1.webp`), true);
    const witcherBlock = catalog.match(/key: "witcher"[\s\S]*?courseSlug: "vedmak"/)?.[0] ?? "";
    assert.match(witcherBlock, /video: WITCHER_HERO_VIDEO/);
    assert.doesNotMatch(witcherBlock, /image:/);
  });

  it("does not render the old adult hero on the landing", () => {
    assert.match(landing, /isKids \? <Hero \/> : <Directions \/>/);
    assert.doesNotMatch(landing, /<Hero \/>\s*<Directions \/>/);
  });

  it("puts the adult join block on the landing lead form", () => {
    const join = read("../../screens/landing/join.tsx");
    assert.match(join, /LandingLeadForm/);
    assert.doesNotMatch(join, /\/contact/);
    assert.match(join, /Пора взять в руки меч"/);
    assert.doesNotMatch(join, /Хватит быть героем в цифровом мире/);
    assert.doesNotMatch(join, /Пора взять в руки меч\./);
  });
});
