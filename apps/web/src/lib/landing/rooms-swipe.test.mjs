import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";

import {
  applyWheelDelta,
  classifySwipeAxis,
  createWheelGesture,
  horizontalSlideStep,
  pointerSlideStep,
} from "./rooms-swipe.ts";

describe("direction slide gestures", () => {
  it("classifies horizontal vs vertical swipes without locking tiny moves", () => {
    assert.equal(classifySwipeAxis(2, 1), null);
    assert.equal(classifySwipeAxis(48, 10), "horizontal");
    assert.equal(classifySwipeAxis(8, 40), "vertical");
  });

  it("steps a trackpad wheel opposite a finger drag and ignores vertical wheel", () => {
    assert.equal(horizontalSlideStep(-48, 4, "touch"), 1);
    assert.equal(horizontalSlideStep(48, 4, "touch"), -1);
    assert.equal(horizontalSlideStep(48, 4, "wheel"), 1);
    assert.equal(horizontalSlideStep(-48, 4, "wheel"), -1);
    assert.equal(horizontalSlideStep(10, 80, "wheel"), 0);

    let gesture = createWheelGesture();
    let prevented = 0;
    for (const deltaY of [20, 30, 40]) {
      const decision = applyWheelDelta(gesture, 1, deltaY);
      gesture = decision.gesture;
      if (decision.preventDefault) prevented += 1;
      assert.equal(decision.step, 0);
    }
    assert.equal(prevented, 0);

    gesture = createWheelGesture();
    const first = applyWheelDelta(gesture, 50, 4);
    assert.equal(first.step, 1);
    assert.equal(first.preventDefault, true);
    const rest = applyWheelDelta(first.gesture, 40, 0);
    assert.equal(rest.step, 0);
    assert.equal(rest.preventDefault, true);
  });

  it("lets a mouse drag change slides and leaves touch pointers to the phone path", () => {
    assert.equal(pointerSlideStep(-50, 4, "mouse"), 1);
    assert.equal(pointerSlideStep(50, 4, "pen"), -1);
    assert.equal(pointerSlideStep(-50, 4, "touch"), 0);
    assert.equal(pointerSlideStep(-12, 0, "mouse"), 0);
    const helper = readFileSync(fileURLToPath(new URL("./rooms-swipe.ts", import.meta.url)), "utf8");
    assert.match(helper, /max-width: 767px/);
  });

  it("captures horizontal laptop wheel and pointer drag without trapping vertical scroll", () => {
    const source = readFileSync(fileURLToPath(new URL("../../hooks/landing/useRoomsScroll.ts", import.meta.url)), "utf8");
    assert.match(source, /addEventListener\(\s*["']wheel["']/);
    assert.match(source, /applyWheelDelta/);
    assert.match(source, /if \(decision\.preventDefault\) event\.preventDefault\(\)/);
    assert.match(source, /LAPTOP_GESTURE_PHONE_QUERY/);
    assert.match(source, /pointerType === ["']touch["']/);
    assert.match(source, /addEventListener\(\s*["']touchstart["']/);
    assert.doesNotMatch(source, /onWheel/);
  });
});
