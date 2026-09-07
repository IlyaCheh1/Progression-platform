import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";

import { classifySwipeAxis } from "./rooms-swipe.ts";

describe("direction slide gestures", () => {
  it("classifies horizontal vs vertical swipes without locking tiny moves", () => {
    assert.equal(classifySwipeAxis(2, 1), null);
    assert.equal(classifySwipeAxis(48, 10), "horizontal");
    assert.equal(classifySwipeAxis(8, 40), "vertical");
  });

  it("does not attach a wheel listener that would trap page scroll", () => {
    const source = readFileSync(fileURLToPath(new URL("../../hooks/landing/useRoomsScroll.ts", import.meta.url)), "utf8");
    assert.doesNotMatch(source, /addEventListener\(\s*["']wheel["']/);
    assert.doesNotMatch(source, /onWheel/);
    assert.match(source, /classifySwipeAxis/);
  });
});
