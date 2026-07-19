import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = join(dirname(fileURLToPath(import.meta.url)), "../../public/content/starter.json");
const starter = JSON.parse(readFileSync(root, "utf8"));

/** Ключи квестов из 104-content-pack.md (Quest Catalog + сезонная кампания). */
const EXPECTED_QUESTS = [
  "path.profile",
  "path.safety",
  "path.first_trial",
  "path.first_training",
  "path.first_record",
  "path.choose_weapon",
  "path.monthly_roll",
  "path.open_inventory",
  "path.choose_cosmetic",
  "path.complete",
  "training.ready",
  "training.focus",
  "training.balance",
  "training.partner",
  "training.reflection",
  "weekly.rhythm.2",
  "weekly.rhythm.3",
  "weekly.two_paths",
  "weekly.curriculum",
  "weekly.history",
  "weekly.community",
  "weekly.event_prep",
  "monthly.roll",
  "monthly.sessions.8",
  "monthly.new_path",
  "monthly.consistency",
  "monthly.event",
  "season.eight_paths",
];

/** Явные achievementKey из content-pack (+ 8 оружейных meta-треков). */
const EXPECTED_ACHIEVEMENTS = [
  "start.first_salute",
  "start.safety",
  "start.character",
  "start.inventory",
  "start.quest",
  "start.event",
  "practice.sessions",
  "practice.weeks",
  "practice.years",
  "practice.return",
  "mastery.first_rank",
  "mastery.four_paths",
  "mastery.eight_paths",
  "mastery.two_rank_five",
  "mastery.one_rank_ten",
  "mastery.all_rank_ten",
  "mastery.spada_a_una_mano.rank",
  "mastery.due_spade.rank",
  "mastery.spada_e_scudo.rank",
  "mastery.spada_a_due_mani.rank",
  "mastery.spadone.rank",
  "mastery.ascia_e_alabarda.rank",
  "mastery.spiedo_e_partesana.rank",
  "mastery.spiedo_e_scudo.rank",
  "curriculum.objectives",
  "curriculum.marozzo",
  "community.events",
  "community.mentor",
  "community.tournament",
  "community.masterclass",
];

const EXPECTED_TALENTS = [
  "discipline.observer",
  "discipline.chronicler",
  "discipline.scholar",
  "discipline.pathfinder",
  "discipline.companion",
  "discipline.curator",
  "discipline.archivist",
  "discipline.herald",
  "discipline.collector",
  "discipline.universalist",
  "discipline.steward",
  "discipline.master",
];

const EXPECTED_ITEMS = [
  "school.fencing.avatar.novice",
  "school.fencing.avatar.scholar",
  "school.fencing.avatar.duelist",
  "school.fencing.avatar.shieldbearer",
  "school.fencing.avatar.polearm",
  "school.fencing.avatar.universal",
  "school.fencing.frame.hall",
  "school.fencing.frame.bronze",
  "school.fencing.frame.steel",
  "school.fencing.frame.crimson",
  "school.fencing.frame.manuscript",
  "school.fencing.frame.eight_paths",
  "school.fencing.banner.night_hall",
  "school.fencing.banner.manuscript_1536",
  "school.fencing.banner.arsenal",
  "school.fencing.banner.eight_paths",
  "school.fencing.theme.parchment",
  "school.fencing.theme.steel",
  "school.fencing.title.student",
  "school.fencing.title.marozzo_student",
  "school.fencing.title.steadfast",
  "school.fencing.title.companion",
  "school.fencing.title.weapon_master",
  "school.fencing.title.eight_paths",
  "school.fencing.title.master_of_sword",
  "school.fencing.collectible.monthly_die",
];

const EXPECTED_REWARDS = [
  "school.fencing.reward.welcome",
  "school.fencing.reward.first_training",
  "school.fencing.reward.training_attendance",
  "school.fencing.reward.weekly_rhythm",
  "school.fencing.reward.monthly_discipline",
  "school.fencing.reward.weapon_rank_minor",
  "school.fencing.reward.weapon_rank_major",
  "school.fencing.reward.weapon_rank_master",
  "school.fencing.reward.event_participant",
  "school.fencing.reward.mentor",
  "school.fencing.reward.level_milestone",
  "school.fencing.reward.referral",
];

const CYRILLIC = /[А-Яа-яЁё]/;

function assertKeys(label, actual, expected) {
  const keys = new Set(actual.map((item) => item.key));
  const missing = expected.filter((key) => !keys.has(key));
  assert.deepEqual(missing, [], `${label}: missing keys: ${missing.join(", ")}`);
}

function assertRussianTitles(label, items) {
  for (const item of items) {
    assert.ok(item.title && CYRILLIC.test(item.title), `${label} ${item.key}: title must be Russian`);
  }
}

test("starter bundle imports all content-pack quest keys", () => {
  assertKeys("quests", starter.quests, EXPECTED_QUESTS);
  assertRussianTitles("quest", starter.quests);
});

test("starter bundle imports all content-pack achievement keys", () => {
  assertKeys("achievements", starter.achievements, EXPECTED_ACHIEVEMENTS);
  assertRussianTitles("achievement", starter.achievements);
});

test("starter bundle imports all content-pack talent keys", () => {
  assertKeys("talents", starter.talents, EXPECTED_TALENTS);
  assertRussianTitles("talent", starter.talents);
  assert.equal(starter.talentTrees?.length, 4, "talentTrees: expected 4 branches");
  for (const talent of starter.talents) {
    assert.ok(talent.treeId, `talent ${talent.key}: treeId required`);
    assert.ok(Array.isArray(talent.position) && talent.position.length === 2, `talent ${talent.key}: position required`);
  }
});

test("starter bundle imports starter items and reward bundles in Russian", () => {
  assertKeys("items", starter.items, EXPECTED_ITEMS);
  assertKeys("rewards", starter.rewards, EXPECTED_REWARDS);
  assertRussianTitles("item", starter.items);
  assertRussianTitles("reward", starter.rewards);
  for (const reward of starter.rewards) {
    assert.ok(CYRILLIC.test(reward.components), `reward ${reward.key}: components must be Russian`);
  }
});
