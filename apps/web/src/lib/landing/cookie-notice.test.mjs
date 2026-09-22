import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";

const read = (relativePath) => readFileSync(fileURLToPath(new URL(relativePath, import.meta.url)), "utf8");

describe("cookie notice", () => {
  const notice = read("../../components/cookie-notice.tsx");
  const layout = read("../../app/layout.tsx");

  it("shows a local accept bar on public pages and links the existing privacy policy", () => {
    assert.match(layout, /<CookieNotice \/>/);
    assert.match(notice, /Сайт использует файлы cookies/);
    assert.match(notice, /href="\/legal\/privacy"/);
    assert.match(notice, /Принять/);
    assert.match(notice, /localStorage\.setItem\(STORAGE_KEY, "accepted"\)/);
    assert.match(notice, /localStorage\.getItem\(STORAGE_KEY\) !== "accepted"/);
    assert.match(notice, /pathname === "\/"/);
    assert.match(notice, /\/kids/);
    assert.match(notice, /\/akcii/);
    assert.match(notice, /\/journal/);
    assert.doesNotMatch(notice, /fetch\(|\/api\//);
    assert.doesNotMatch(notice, /Напишите школе/);
  });
});
