import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";

describe("landing mobile layout guards", () => {
  it("keeps header offset, 44px audience badges and compact reconstruction tracks", () => {
    const css = readFileSync(fileURLToPath(new URL("../../screens/landing/styles.css", import.meta.url)), "utf8");
    assert.match(css, /--landing-header-offset/);
    assert.match(css, /env\(safe-area-inset-top/);
    assert.match(css, /hero-audience-badge[\s\S]*min-height:\s*44px/);
    assert.match(css, /\.recon-tracks[\s\S]*grid-template-columns:\s*1fr 1fr/);
    assert.match(css, /kids-hero \.hero-bottom-copy[\s\S]*display:\s*none/);
  });

  it("does not reintroduce wheel trapping on direction slides", () => {
    const hook = readFileSync(fileURLToPath(new URL("../../hooks/landing/useRoomsScroll.ts", import.meta.url)), "utf8");
    assert.doesNotMatch(hook, /addEventListener\(\s*["']wheel["']/);
  });
});
