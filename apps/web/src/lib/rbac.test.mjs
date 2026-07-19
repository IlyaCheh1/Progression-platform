import test from "node:test";
import assert from "node:assert/strict";

import { homePathForRoles } from "./rbac.ts";

test("homePathForRoles sends everyone to onboarding when profile is missing", () => {
  assert.equal(homePathForRoles(["student"], false), "/onboarding");
  assert.equal(homePathForRoles(["administrator"], false), "/onboarding");
  assert.equal(homePathForRoles(["coach", "student"], false), "/onboarding");
});

test("homePathForRoles sends everyone to profile when profile is ready", () => {
  assert.equal(homePathForRoles(["student"], true), "/profile");
  assert.equal(homePathForRoles(["platform_admin"], true), "/profile");
  assert.equal(homePathForRoles(["guardian", "renter"], true), "/profile");
});
