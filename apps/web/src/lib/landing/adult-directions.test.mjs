import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";

import { COURSE_ENROLL_HASH } from "../courses/constants.ts";
import { HERO_VIDEOS, SCHOOL_HERO_VIDEO } from "../hero-media.ts";

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
    assert.match(catalog, /мало обычного спорта/);
    assert.match(catalog, /китайского меча до европейского полуторника/);
    assert.match(catalog, /сабли, шпаги, копья, алебарды, щиты и многое другое/);
    assert.match(catalog, /cta: "Выбрать курсы"/);
    assert.doesNotMatch(catalog, /Выбери подходящее именно тебе/);
    assert.equal(SCHOOL_HERO_VIDEO, "school.mp4");
    assert.match(catalog, /ADULT_SCHOOL_VIDEO/);
    assert.match(catalog, /SCHOOL_HERO_VIDEO/);
    assert.equal(
      existsSync(fileURLToPath(new URL("../../../public/media/hero/school.mp4", import.meta.url))),
      true,
    );
    assert.equal(
      existsSync(fileURLToPath(new URL("../../../public/media/hero/school.webp", import.meta.url))),
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

  it("maps hero videos in the requested order", () => {
    assert.match(catalog, new RegExp(`video: HERO_VIDEOS\\[1\\][\\s\\S]*ushu-vzroslye`));
    assert.equal(HERO_VIDEOS[1], "6.mp4");
    assert.equal(HERO_VIDEOS[0], "1.mp4");
    assert.equal(HERO_VIDEOS[4], "4.mp4");
    assert.match(catalog, /key: "ushu"[\s\S]*HERO_VIDEOS\[1\]/);
    assert.match(catalog, /key: "witcher"[\s\S]*HERO_VIDEOS\[0\]/);
    assert.match(catalog, /key: "rapier_xvii"[\s\S]*HERO_VIDEOS\[3\]/);
    assert.match(catalog, /key: "saber"[\s\S]*HERO_VIDEOS\[4\]/);
    assert.equal(HERO_VIDEOS[3], "3.mp4");
  });

  it("does not render the old adult hero on the landing", () => {
    assert.match(landing, /isKids \? <Hero \/> : <Directions \/>/);
    assert.doesNotMatch(landing, /<Hero \/>\s*<Directions \/>/);
  });
});
