import test from "node:test";
import assert from "node:assert/strict";

const CHARACTERS = [
  { id: "1", gender: "male" },
  { id: "3", gender: "male" },
  { id: "8", gender: "female" },
];

function normalizeSelectedSkinId(value, gender = "MALE") {
  const raw = (value ?? "").trim();
  const found = CHARACTERS.find((item) => item.id === raw);
  const ogGender = gender === "FEMALE" ? "female" : "male";
  if (found && found.gender === ogGender) return found.id;
  const legacy = { scholar: "3", novice: "1" };
  if (legacy[raw]) return legacy[raw];
  return gender === "FEMALE" ? "8" : "3";
}

test("normalizeSelectedSkinId resolves OG ids and legacy skins", () => {
  assert.equal(normalizeSelectedSkinId("8", "FEMALE"), "8");
  assert.equal(normalizeSelectedSkinId("scholar", "MALE"), "3");
  assert.equal(normalizeSelectedSkinId("", "MALE"), "3");
});
