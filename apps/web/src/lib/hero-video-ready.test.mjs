import test from "node:test";
import assert from "node:assert/strict";
import { HERO_VIDEO_MIN_READY_STATE, isHeroVideoReady } from "./hero-video-ready.ts";

test("isHeroVideoReady matches canplay threshold", () => {
  assert.equal(HERO_VIDEO_MIN_READY_STATE, 3);
  assert.equal(isHeroVideoReady(2), false);
  assert.equal(isHeroVideoReady(3), true);
  assert.equal(isHeroVideoReady(4), true);
});
