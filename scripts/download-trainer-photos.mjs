#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, "../apps/web/public/media/trainers");
const FILES = ["max-kiselev.jpg", "nikolay-lobanov.jpg", "tatyana-gribanova.jpg", "ivan-bobrovsky.jpg"];

const html = fs.readFileSync(
  "C:/Users/IlyaChekh/.cursor/projects/l-Master-of-Sword/agent-tools/9ad69dc0-ee67-45b6-b262-0912678fbc38.txt",
  "utf8",
);

const urls = [...html.matchAll(/article_object_photo__image_blur[^>]+src="([^"]+)"/g)]
  .map((match) => match[1].replace(/\s+/g, "").replace(/cs=\d+x0/, "cs=1080x0"));

if (urls.length !== FILES.length) {
  throw new Error(`Expected ${FILES.length} photo URLs, got ${urls.length}`);
}

fs.mkdirSync(outDir, { recursive: true });

for (let i = 0; i < FILES.length; i += 1) {
  const file = FILES[i];
  const url = urls[i];
  const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
  if (!res.ok) throw new Error(`${file}: HTTP ${res.status} for ${url}`);
  const bytes = Buffer.from(await res.arrayBuffer());
  fs.writeFileSync(path.join(outDir, file), bytes);
  console.log(`saved ${file} (${bytes.length} bytes)`);
}
