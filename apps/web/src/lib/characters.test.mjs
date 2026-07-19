import test from "node:test";
import assert from "node:assert/strict";

const CHARACTERS = [
  { id: "3", gender: "male" },
  { id: "8", gender: "female" },
];

const LEGACY_ALIAS = {
  "1": "3",
  "2": "3",
  "4": "3",
  "5": "3",
  "6": "8",
  "7": "8",
  "9": "8",
  "10": "8",
};

function normalizeSelectedSkinId(value, gender = "MALE") {
  const raw = (value ?? "").trim();
  const resolved = LEGACY_ALIAS[raw] ?? raw;
  const found = CHARACTERS.find((item) => item.id === resolved);
  const ogGender = gender === "FEMALE" ? "female" : "male";
  if (found && found.gender === ogGender) return found.id;
  const legacy = { scholar: "3", novice: "3" };
  if (legacy[raw]) return legacy[raw];
  return gender === "FEMALE" ? "8" : "3";
}

test("normalizeSelectedSkinId resolves OG ids and legacy skins", () => {
  assert.equal(normalizeSelectedSkinId("8", "FEMALE"), "8");
  assert.equal(normalizeSelectedSkinId("scholar", "MALE"), "3");
  assert.equal(normalizeSelectedSkinId("", "MALE"), "3");
  assert.equal(normalizeSelectedSkinId("1", "MALE"), "3");
  assert.equal(normalizeSelectedSkinId("6", "FEMALE"), "8");
});
