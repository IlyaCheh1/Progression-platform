import assert from "node:assert/strict";
import test from "node:test";
import { canOptimizeImageSrc } from "./image-src.ts";

test("canOptimizeImageSrc allows local and Selectel hosts", () => {
  assert.equal(canOptimizeImageSrc("/media/ui/coin.webp"), true);
  assert.equal(canOptimizeImageSrc("https://abcd1234-aaaa-bbbb-cccc-ddddeeee0000.selstorage.ru/x.webp"), true);
  assert.equal(canOptimizeImageSrc("https://cdn.selcdn.ru/bucket/x.webp"), true);
  assert.equal(canOptimizeImageSrc("https://example.com/x.webp"), false);
  assert.equal(canOptimizeImageSrc("not-a-url"), false);
});
