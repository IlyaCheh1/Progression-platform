/**
 * Downloads Higgs talent icons from tmp-higgs/talents/urls.json
 * into public/media/content-icons/talents/{key}.png
 *
 * Direct CloudFront downloads often stall in this environment;
 * we fetch via wsrv.nl image proxy (512px PNG).
 *
 * Usage: node apps/web/scripts/download-talent-icons.mjs
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const urlsPath = join(root, "../../tmp-higgs/talents/urls.json");
const outDir = join(root, "public/media/content-icons/talents");

mkdirSync(outDir, { recursive: true });
const urls = JSON.parse(readFileSync(urlsPath, "utf8").replace(/^\uFEFF/, ""));

let ok = 0;
let fail = 0;
const entries = Object.entries(urls);
for (let i = 0; i < entries.length; i++) {
  const [key, src] = entries[i];
  const dest = join(outDir, `${key}.png`);
  if (existsSync(dest) && statSync(dest).size > 50_000) {
    console.log(`[${i + 1}/${entries.length}] SKIP ${key}`);
    ok++;
    continue;
  }
  const proxy = `https://wsrv.nl/?url=${encodeURIComponent(src)}&output=png&w=512&h=512&fit=cover`;
  let saved = false;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetch(proxy, {
        headers: { "User-Agent": "Mozilla/5.0" },
        signal: AbortSignal.timeout(120_000),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const buf = Buffer.from(await res.arrayBuffer());
      if (buf[0] !== 0x89 || buf[1] !== 0x50) throw new Error("not PNG");
      writeFileSync(dest, buf);
      console.log(`[${i + 1}/${entries.length}] OK ${key} ${buf.length}`);
      ok++;
      saved = true;
      break;
    } catch (e) {
      console.log(`[${i + 1}/${entries.length}] RETRY ${attempt} ${key}: ${e.message}`);
      await new Promise((r) => setTimeout(r, 1000 * attempt));
    }
  }
  if (!saved) {
    fail++;
    console.log(`[${i + 1}/${entries.length}] FAIL ${key}`);
  }
  await new Promise((r) => setTimeout(r, 400));
}
console.log(`DONE ok=${ok} fail=${fail}`);
process.exit(fail ? 1 : 0);
