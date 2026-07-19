#!/usr/bin/env node
/**
 * Adds icon paths to quests/achievements in starter content JSON files.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "../../..");
const targets = [
  join(root, "schemas/content/school.fencing.starter.json"),
  join(root, "apps/web/public/content/starter.json"),
];

for (const file of targets) {
  const data = JSON.parse(readFileSync(file, "utf8"));
  data.quests = data.quests.map((q) => ({
    ...q,
    icon: q.icon ?? `quests/${q.key}.png`,
  }));
  data.achievements = data.achievements.map((a) => ({
    ...a,
    icon: a.icon ?? `achievements/${a.key}.png`,
  }));
  writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`);
  console.log(`Updated ${file}`);
}
