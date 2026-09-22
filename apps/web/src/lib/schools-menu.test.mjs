import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";

const read = (relativePath) => readFileSync(fileURLToPath(new URL(relativePath, import.meta.url)), "utf8");

describe("cabinet schools menu", () => {
  const menu = read("../components/profile-header/schools-menu.tsx");
  const adult = read("./landing/adult-directions.ts");

  it("lists the current adult sections and keeps the existing schools", () => {
    assert.match(menu, /ADULT_COURSE_SLIDES/);
    assert.match(menu, /directions\.map/);
    const adultAt = menu.indexOf("ADULT_COURSE_SLIDES.map");
    const schoolsAt = menu.indexOf("directions.map");
    assert.ok(adultAt >= 0 && schoolsAt > adultAt);
    for (const title of ["Ушу", "Ведьмак", "Два меча", "Шпага XVII века", "Сабля XVI-XVII века", "Веер"]) {
      assert.match(adult, new RegExp(title.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
    }
  });

  it("opens each adult section on its course page", () => {
    assert.match(menu, /coursePageHref\(section\.courseSlug\)/);
    assert.match(menu, /slide\.key !== "witcher"/);
    assert.match(menu, /getSchoolIconSrc\("witcher"\)/);
    assert.match(menu, /comingSoon \? "Скоро в наборе"/);
  });
});
