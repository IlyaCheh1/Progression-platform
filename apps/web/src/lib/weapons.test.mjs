import assert from "node:assert/strict";
import test from "node:test";

const WEAPON_KEYS = [
  "spada_a_uno_mano",
  "due_spade",
  "spada_e_scudo",
  "spada_a_due_mani",
  "spadone",
  "acia_alabarda",
  "spiedo_partesana",
  "spiedo_e_scudo",
];

const MASTERY_RANK_THRESHOLDS_POINTS = [
  0, 2000, 6000, 12000, 20000, 30000, 42000, 56000, 72000, 90000, 110000,
];

const MASTERY_MAX_RANK = 10;

function masteryUnitsToPoints(units) {
  return units / 10_000;
}

function clampMasteryRank(rank) {
  if (!Number.isFinite(rank) || rank < 0) return 0;
  if (rank > MASTERY_MAX_RANK) return MASTERY_MAX_RANK;
  return Math.floor(rank);
}

function masteryRankProgress(points, rank) {
  const r = clampMasteryRank(rank);
  if (r >= MASTERY_MAX_RANK) return { value: 1, max: 1 };
  const floor = MASTERY_RANK_THRESHOLDS_POINTS[r] ?? 0;
  const next = MASTERY_RANK_THRESHOLDS_POINTS[r + 1] ?? floor;
  const span = Math.max(1, next - floor);
  const into = Math.min(span, Math.max(0, points - floor));
  return { value: into, max: span };
}

test("eight canonical weapon keys from school mastery ledger", () => {
  assert.equal(WEAPON_KEYS.length, 8);
});

test("units convert to displayed points (doc 103)", () => {
  assert.equal(masteryUnitsToPoints(1_250_000), 125);
  assert.equal(masteryUnitsToPoints(0), 0);
});

test("rank progress uses doc 103 thresholds", () => {
  assert.deepEqual(masteryRankProgress(0, 0), { value: 0, max: 2000 });
  assert.deepEqual(masteryRankProgress(1000, 0), { value: 1000, max: 2000 });
  assert.deepEqual(masteryRankProgress(2000, 1), { value: 0, max: 4000 });
  assert.deepEqual(masteryRankProgress(4000, 1), { value: 2000, max: 4000 });
  assert.deepEqual(masteryRankProgress(200000, 10), { value: 1, max: 1 });
});

test("clamp mastery rank", () => {
  assert.equal(clampMasteryRank(-1), 0);
  assert.equal(clampMasteryRank(3.9), 3);
  assert.equal(clampMasteryRank(99), MASTERY_MAX_RANK);
});
