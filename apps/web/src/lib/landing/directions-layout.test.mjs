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
    assert.match(tsx, /flex flex-1 flex-col items-center justify-center/);
    assert.match(tsx, /school-slide-band w-full items-start/);
    assert.match(css, /#directions \.school-slide-band \{\s*display:\s*grid;/);
    assert.match(css, /grid-template-columns:\s*minmax\(0,\s*1fr\) auto minmax\(0,\s*1fr\)/);
    assert.match(css, /#directions \.school-slide-side \{\s*justify-self:\s*center;/);
    assert.match(css, /#directions \.school-slide-side \{\s*justify-self:\s*center;\s*width:\s*min\(30rem, 100%\)/);
    assert.match(
      css,
      /@media \(max-width: 767px\) \{[\s\S]*#directions \.school-slide-side,\s*#directions \.school-slide-only \{\s*display:\s*none;/,
    );
    assert.match(tsx, /school-slide-only/);
    assert.match(css, /#directions \.school-slide-side > p:first-child \{\s*white-space:\s*nowrap;/);
    assert.match(css, /#directions \.school-slide-band \{\s*display:\s*grid;[\s\S]*min-height:\s*16\.6875rem;/);
    assert.match(css, /@media \(max-width: 767px\) \{[\s\S]*#directions \.school-slide-band \{[\s\S]*min-height:\s*0;/);
    assert.match(tsx, /school-slide-cta flex items-start justify-center/);
    assert.match(tsx, /school-slide-facts[\s\S]*text-center/);
    assert.match(tsx, /uppercase tracking-\[0\.08em\] text-white">Направления/);
    assert.match(tsx, /uppercase tracking-\[0\.08em\] text-white">Арсенал/);
    assert.match(tsx, /text-\[calc\(0\.75rem\+2pt\+2px\)\]/);
    assert.match(tsx, /md:text-\[calc\(0\.875rem\+2pt\+2px\)\]/);
    assert.match(tsx, /whitespace-pre-line/);
    assert.doesNotMatch(tsx, /text-left/);
    assert.doesNotMatch(tsx, /text-right/);
  });

  it("breaks only the sabre title onto two nowrap lines", () => {
    assert.match(tsx, /slide\.key === "saber" \? " room-panel-title--saber"/);
    assert.match(tsx, /<span className="room-panel-title-line">Сабля XVI-XVII<\/span>/);
    assert.match(tsx, /<span className="room-panel-title-line">века<\/span>/);
    assert.match(css, /#directions \.room-panel-title--saber \{\s*font-size:\s*10\.4cqi;/);
    assert.match(css, /\.room-panel-title--saber \.room-panel-title-line \{\s*display:\s*block;\s*white-space:\s*nowrap;/);
    assert.equal(tsx.match(/room-panel-title-line/g)?.length, 2);
  });

  it("keeps two course CTAs and a school intro slide", () => {
    assert.match(tsx, /Описание курса/);
    assert.match(tsx, /Записаться/);
    assert.match(tsx, /room-panel--school/);
    assert.match(css, /\.room-panel--school \.video-overlay[\s\S]*transparent 38%/);
    assert.doesNotMatch(css, /\.room-panel--school \.room-panel-left-vignette[\s\S]*0\.72\) 100%/);
    assert.match(tsx, /ADULT_SCHOOL_VIDEO/);
    assert.match(tsx, /slide.kind === "school" \? ADULT_SCHOOL_VIDEO : \(slide.image \?\? slide.video\)/);
    assert.match(tsx, /forceLocal/);
    assert.match(tsx, /HeroVideoBackdrop/);
  });

  it("centers hero arrows with geometric icons, not font glyphs", () => {
    assert.match(tsx, /className="rooms-arrow-icon"/);
    assert.match(tsx, /<ArrowIcon direction=\{direction\} \/>/);
    assert.doesNotMatch(tsx, /[‹›]/);
    assert.match(css, /\.rooms-arrow \{[\s\S]*?padding:\s*0;/);
    assert.match(css, /\.rooms-arrow \{[\s\S]*?border:\s*none;/);
    assert.doesNotMatch(css.match(/\.rooms-arrow \{[^}]*\}/)?.[0] ?? "", /border-radius:\s*999/);
    assert.match(css, /\.rooms-arrow-icon \{[\s\S]*?display:\s*block;/);
    assert.match(css, /\.rooms-arrow-icon \{[\s\S]*?width:\s*2\.75rem;/);
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
