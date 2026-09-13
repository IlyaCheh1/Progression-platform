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
    assert.match(tsx, /activeRoom > 0/);
    assert.match(css, /#directions \.school-slide-copy[\s\S]*padding-top:\s*calc\(var\(--landing-header-offset\) \+ 2\.25rem\)/);
    assert.match(tsx, /school-slide-facts/);
  });

  it("keeps two course CTAs and a school intro slide", () => {
    assert.match(tsx, /Описание курса/);
    assert.match(tsx, /Записаться/);
    assert.match(tsx, /room-panel--school/);
    assert.match(css, /\.room-panel--school \.video-overlay[\s\S]*transparent 38%/);
    assert.doesNotMatch(css, /\.room-panel--school \.room-panel-left-vignette[\s\S]*0\.72\) 100%/);
    assert.match(tsx, /ADULT_SCHOOL_VIDEO/);
    assert.match(tsx, /forceLocal=\{slide.kind === "school"\}/);
    assert.match(tsx, /HeroVideoBackdrop/);
  });

  it("does not let extra blocks inflate the equalized middle height", () => {
    const middle = tsx.slice(tsx.indexOf('className="room-panel-middle"'));
    const middleBlock = middle.slice(0, middle.indexOf("<div className=\"flex flex-wrap"));
    assert.match(middleBlock, /room-panel-description/);
    assert.doesNotMatch(middleBlock, /recon-tracks/);
  });

  it("keeps course slide description one point larger across breakpoints", () => {
    assert.match(css, /\.room-panel-description \{\s*font-size:\s*calc\(0\.75rem - 1pt\)/);
    assert.match(css, /\.room-panel-description \{\s*font-size:\s*calc\(0\.875rem \+ 1pt\)/);
    assert.match(css, /\.room-panel-description,\s*\.room-panel--montante \.room-panel-description \{\s*font-size:\s*calc\(1\.125rem - 1pt\)/);
  });
});
