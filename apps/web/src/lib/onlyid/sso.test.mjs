import assert from "node:assert/strict";
import { describe, it } from "node:test";

// Mirror of isSafeReturnPath — keep in sync with sso.ts
function isSafeReturnPath(value) {
  if (!value) return false;
  if (!value.startsWith("/")) return false;
  if (value.startsWith("//") || value.startsWith("/\\")) return false;
  if (value.includes("\\") || value.includes("@")) return false;
  return /^\/[A-Za-z0-9._~/?&=%+,#\-]*$/.test(value);
}

describe("isSafeReturnPath", () => {
  it("allows normal app paths", () => {
    assert.equal(isSafeReturnPath("/"), true);
    assert.equal(isSafeReturnPath("/cabinet"), true);
    assert.equal(isSafeReturnPath("/settings?tab=personal"), true);
  });

  it("blocks open redirects", () => {
    assert.equal(isSafeReturnPath("//evil.com"), false);
    assert.equal(isSafeReturnPath("/\\evil.com"), false);
    assert.equal(isSafeReturnPath("https://evil.com"), false);
    assert.equal(isSafeReturnPath("/foo@evil.com"), false);
  });
});
