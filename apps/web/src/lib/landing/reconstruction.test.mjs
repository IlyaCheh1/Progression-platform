import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { RECONSTRUCTION_TRACKS } from "./reconstruction.ts";

describe("reconstruction tracks", () => {
  it("has four marked mock directions", () => {
    assert.equal(RECONSTRUCTION_TRACKS.length, 4);
    for (const track of RECONSTRUCTION_TRACKS) {
      assert.equal(track.mock, true);
      assert.ok(track.id.startsWith("mock-recon-"));
      assert.match(track.description, /заглушка/i);
    }
  });
});
