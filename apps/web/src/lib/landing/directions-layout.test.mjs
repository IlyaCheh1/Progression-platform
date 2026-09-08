import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";

describe("directions slide layout", () => {
  const css = readFileSync(fileURLToPath(new URL("../../screens/landing/styles.css", import.meta.url)), "utf8");
  const tsx = readFileSync(fileURLToPath(new URL("../../screens/landing/directions.tsx", import.meta.url)), "utf8");

  it("keeps slide copy below the header and does not clip titles", () => {
    assert.match(css, /#directions \.room-panel-text[\s\S]*justify-content:\s*safe flex-end/);
    assert.match(css, /#directions \.room-panel-text[\s\S]*padding-top:\s*calc\(var\(--landing-header-offset\) \+ 2\.25rem\)/);
    assert.match(css, /\.mobile-fluid-room-title[\s\S]*line-height:\s*1\.12/);
    assert.match(css, /#directions \.rooms-index[\s\S]*top:\s*calc\(var\(--landing-header-offset\)/);
    assert.doesNotMatch(css, /\.room-panel-text\s*\{[^}]*transform:\s*scale\(1\.5\)/);
    assert.doesNotMatch(tsx, /leading-none/);
    assert.match(tsx, /className="rooms-index /);
  });

  it("does not let reconstruction tracks inflate the equalized middle height", () => {
    const middle = tsx.slice(tsx.indexOf('className="room-panel-middle"'));
    const middleBlock = middle.slice(0, middle.indexOf("{slide.tracks"));
    assert.match(middleBlock, /room-panel-tagline/);
    assert.match(middleBlock, /room-panel-description/);
    assert.doesNotMatch(middleBlock, /recon-tracks/);
  });
});
