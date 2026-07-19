#!/usr/bin/env node
/**
 * School weapon icons are stored locally as SVG in:
 * apps/web/public/media/school-icons/
 *
 * Keys: witcher, east, spanish_rapier, italian_rapier, montante, navaja
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, "../apps/web/public/media/school-icons");
const required = ["witcher", "east", "spanish_rapier", "italian_rapier", "montante", "navaja"];

const missing = required.filter((key) => !fs.existsSync(path.join(outDir, `${key}.svg`)));
if (missing.length) {
  console.error(`Missing icons: ${missing.join(", ")}`);
  process.exit(1);
}

console.log(`All ${required.length} school icons present in ${outDir}`);
