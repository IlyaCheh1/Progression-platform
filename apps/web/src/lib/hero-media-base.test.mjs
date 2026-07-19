import test from "node:test";
import assert from "node:assert/strict";

/** Mirrors normalizeMediaBase in screens/landing/hero.tsx */
function normalizeMediaBase(raw) {
  const trimmed = raw.trim().replace(/\/$/, "");
  try {
    const url = new URL(trimmed);
    const host = url.hostname.toLowerCase();
    if (host.endsWith(".selstorage.ru") || host.endsWith(".selcdn.ru")) {
      const parts = url.pathname.split("/").filter(Boolean);
      const mediaIdx = parts.indexOf("media");
      if (mediaIdx > 0) {
        url.pathname = `/${parts.slice(mediaIdx).join("/")}`;
        return url.toString().replace(/\/$/, "");
      }
    }
  } catch {
    // relative
  }
  return trimmed;
}

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
