import test from "node:test";
import assert from "node:assert/strict";

/** Mirrors resolveContentIconsBase in content-icons.ts (no Next/TS import). */
const LOCAL = "/media/content-icons";

function isSelectelUuidPublicHost(host) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.selstorage\.ru$/i.test(
    host,
  );
}

function resolveContentIconsBase(raw) {
  const trimmed = (raw ?? LOCAL).trim().replace(/\/$/, "");
  if (!trimmed) return LOCAL;

  try {
    const url = new URL(trimmed);
    const host = url.hostname.toLowerCase();

    if (host.endsWith(".selstorage.ru") && !isSelectelUuidPublicHost(host)) {
      return LOCAL;
    }

    if (host.endsWith(".selstorage.ru") || host.endsWith(".selcdn.ru")) {
      const parts = url.pathname.split("/").filter(Boolean);
      const mediaIdx = parts.indexOf("media");
      if (mediaIdx > 0) {
        url.pathname = `/${parts.slice(mediaIdx).join("/")}`;
      }
    }

    return url.toString().replace(/\/$/, "");
  } catch {
    return trimmed.startsWith("/") ? trimmed : LOCAL;
  }
}

test("rejects bucket-name selstorage host (prod misconfig)", () => {
  assert.equal(
    resolveContentIconsBase("https://swordmaster.selstorage.ru/media/content-icons"),
    LOCAL,
  );
});

test("keeps UUID selstorage host", () => {
  assert.equal(
    resolveContentIconsBase(
      "https://aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee.selstorage.ru/media/content-icons",
    ),
    "https://aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee.selstorage.ru/media/content-icons",
  );
});

test("strips doubled bucket segment on UUID host", () => {
  assert.equal(
    resolveContentIconsBase(
      "https://aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee.selstorage.ru/swordmaster/media/content-icons",
    ),
    "https://aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee.selstorage.ru/media/content-icons",
  );
});

test("keeps local fallback", () => {
  assert.equal(resolveContentIconsBase("/media/content-icons"), LOCAL);
  assert.equal(resolveContentIconsBase(undefined), LOCAL);
});
