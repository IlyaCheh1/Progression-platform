import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";

const css = readFileSync(fileURLToPath(new URL("./team-board.css", import.meta.url)), "utf8");
const pieces = readFileSync(fileURLToPath(new URL("./pieces.tsx", import.meta.url)), "utf8");
const board = readFileSync(fileURLToPath(new URL("./index.tsx", import.meta.url)), "utf8");
const copy = readFileSync(fileURLToPath(new URL("./copy.ts", import.meta.url)), "utf8");
const landing = readFileSync(fileURLToPath(new URL("../index.tsx", import.meta.url)), "utf8");

describe("team-board OG layout contract", () => {
  it("keeps adults-only mount and hides the board for kids", () => {
    assert.match(landing, /\{!isKids \? <TeamBoard \/> : null\}/);
    assert.doesNotMatch(landing, /isKids && <TeamBoard/);
    assert.match(landing, /\{isKids \? <Trainers \/> : null\}/);
    assert.doesNotMatch(landing, /<Trainers \/>\s*\n\s*\{!isKids \? <TeamBoard/);
  });

  it("exposes MobileSideSwitcher with aria-pressed", () => {
    assert.match(pieces, /export function MobileSideSwitcher/);
    assert.match(pieces, /aria-pressed=\{activeSide === side\}/);
    assert.match(board, /<MobileSideSwitcher/);
    assert.doesNotMatch(board, /addEventListener\(\s*["']wheel["']/);
  });

  it("drags mouse cards onto the field after a short move and keeps tap-to-open on touch", () => {
    assert.match(board, /DRAG_START_THRESHOLD_PX/);
    assert.match(board, /pointerType === "touch" \|\| !isFinePointer\(\)/);
    assert.match(board, /matchMedia\("\(pointer: fine\)"\)/);
    assert.match(board, /suppressNextClick/);
    assert.match(pieces, /onDragStart/);
  });

  it("uses MOS amber/void tokens instead of OG yellow/violet", () => {
    assert.match(css, /--team-amber:\s*var\(--mos-amber\)/);
    assert.match(css, /background:\s*var\(--void\)/);
    assert.doesNotMatch(css, /#c9b458|#7c5cff|#6d28d9/);
  });

  it("hides the inactive side, divider and placards on mobile", () => {
    const mobile = css.slice(css.indexOf("@media (max-width: 767px)"));
    assert.match(mobile, /\.team-board \.team-side-panel/);
    assert.match(mobile, /\[data-active-side="sideA"\] \[data-side="sideB"\]/);
    assert.match(mobile, /\[data-active-side="sideB"\] \[data-side="sideA"\]/);
    assert.match(mobile, /\.team-board-divider/);
    assert.match(mobile, /display:\s*none/);
    assert.match(mobile, /\.team-side-switch/);
    assert.match(mobile, /display:\s*flex/);
  });

  it("turns the mobile hand into a horizontal swipe strip", () => {
    const mobile = css.slice(css.indexOf("@media (max-width: 767px)"), css.indexOf("@media (min-width: 768px)"));
    assert.match(mobile, /overflow-x:\s*auto/);
    assert.match(mobile, /scroll-snap-type:\s*x proximity/);
    assert.match(mobile, /touch-action:\s*pan-x pan-y/);
    assert.match(mobile, /margin-left:\s*0/);
    assert.match(mobile, /\.team-hand \.team-card[\s\S]*transform:\s*none/);
  });

  it("stacks tablet play as handTop → panelTop → field → panelBot → handBot", () => {
    const tablet = css.slice(css.indexOf("@media (min-width: 768px)"), css.indexOf("@media (min-width: 1280px)"));
    assert.match(tablet, /\.team-hand\[data-side="sideA"\][\s\S]*order:\s*1/);
    assert.match(tablet, /\.team-side-panel\[data-side="sideA"\][\s\S]*order:\s*2/);
    assert.match(tablet, /\.team-board-field[\s\S]*order:\s*3/);
    assert.match(tablet, /\.team-side-panel\[data-side="sideB"\][\s\S]*order:\s*4/);
    assert.match(tablet, /\.team-hand\[data-side="sideB"\][\s\S]*order:\s*5/);
  });

  it("uses the desktop play grid in skirmish and a two-row team grid in explore", () => {
    const desktop = css.slice(css.indexOf("@media (min-width: 1280px)"));
    assert.match(
      desktop,
      /grid-template:\s*"handTop handTop"\s*"panelTop field" 1fr\s*"panelBot field" 1fr\s*"handBot handBot"/,
    );
    assert.match(
      desktop,
      /\[data-mode="explore"\] \.team-board[\s\S]*grid-template:\s*"panelTop handTop"\s*"panelBot handBot"/,
    );
  });

  it("hides the play field in teams mode and shows it only in skirmish", () => {
    assert.match(board, /className="team-board-field"/);
    assert.match(board, /className="team-board-side"/);
    assert.match(board, /\{playing \? \(\s*<div className="team-board-field"/);
    assert.match(board, /canPlay=\{playing \? canSelectPlayerCard\(play, expandedCard\.id\) : false\}/);
    assert.match(copy, /modeExplore: "Команды"/);
    assert.match(copy, /modePlay: "Схватка"/);
    assert.match(copy, /resetBoard: "Сбросить команды"/);
  });

  it("uses OG faction names in full and remounts the field after a match starts", () => {
    assert.match(copy, /title: "Королевства Севера"/);
    assert.match(copy, /title: "Нильфгаард"/);
    assert.doesNotMatch(copy, /title: "Школа"|title: "Спарринг"|Master of the Sword/);
    assert.match(board, /useRevealFade\(sectionRef, 0\.05, playing \? play\.phase : mode\)/);
    assert.match(board, /querySelectorAll\("\.reveal-fade"\)[\s\S]*classList\.add\("visible"\)/);
  });

  it("uses OG faction card-backs on placards and drops the description badge", () => {
    assert.match(css, /--side-panel-bg:\s*url\("\/media\/team\/factions\/northern-realms\.png"\)/);
    assert.match(css, /--side-panel-bg:\s*url\("\/media\/team\/factions\/nilfgaard\.png"\)/);
    assert.doesNotMatch(pieces, /team-side-panel-description/);
    assert.doesNotMatch(board, /TEAM_COPY\.sides\[side\]\.description/);
    assert.equal(existsSync(fileURLToPath(new URL("../../../../public/media/team/factions/northern-realms.png", import.meta.url))), true);
    assert.equal(existsSync(fileURLToPath(new URL("../../../../public/media/team/factions/nilfgaard.png", import.meta.url))), true);
  });

  it("styles play lanes as Gwent parchment rows with centered lane icons", () => {
    assert.match(css, /board-parchment\.svg/);
    assert.match(css, /\.team-row-sigil[\s\S]*left:\s*50%/);
    assert.match(pieces, /data-lane=\{sigil\}/);
    assert.match(pieces, /ROW_SIGILS/);
    assert.equal(existsSync(fileURLToPath(new URL("../../../../public/media/team/board-parchment.svg", import.meta.url))), true);
  });
});

describe("team-board Gwent card face", () => {
  it("renders power gem, faction chip, frame and name plate", () => {
    assert.match(pieces, /export function TeamCardFace/);
    assert.match(pieces, /team-card-power-gem/);
    assert.match(pieces, /team-card-faction/);
    assert.match(pieces, /team-card-frame/);
    assert.match(pieces, /team-card-plate/);
    assert.match(pieces, /team-card-vignette/);
    assert.match(pieces, /shownPower = power \?\? basePowerOf\(card\)/);
    assert.match(css, /\.team-card[\s\S]*aspect-ratio:\s*2 \/ 3/);
    assert.match(css, /\.team-card-face[\s\S]*aspect-ratio:\s*2 \/ 3/);
    assert.match(css, /\.team-dialog-art \.team-card-face/);
    assert.match(css, /\.team-card-power[\s\S]*left:\s*0\.18rem/);
    assert.match(css, /\.team-card-faction[\s\S]*right:\s*0\.28rem/);
    assert.match(css, /\[data-rarity="bronze"\]/);
  });

  it("lifts the desktop hand fan on fine pointers", () => {
    assert.match(css, /@media \(min-width: 768px\) and \(pointer: fine\)/);
    assert.match(css, /\.team-hand \.team-hand-slot:hover/);
    assert.match(css, /translateY\(-14px\)/);
  });

  it("shows trainer name, role and bio paragraphs in the card dialog", () => {
    assert.match(pieces, /team-dialog-name/);
    assert.match(pieces, /card\.role/);
    assert.match(pieces, /card\.fullDescription\.split/);
    assert.match(pieces, /team-dialog-bio/);
  });
});
