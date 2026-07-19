#!/usr/bin/env node
/**
 * Upload selected profile background WebPs to S3 (Selectel).
 *
 *   node --env-file=infra/local/.env scripts/upload-backgrounds-to-s3.mjs
 *   node --env-file=/path/to/.env scripts/upload-backgrounds-to-s3.mjs buy/neon_dragon buy/moss_dragon
 *
 * Env: S3_ENDPOINT, S3_ACCESS_KEY, S3_SECRET_KEY, S3_BUCKET, optional S3_PUBLIC_BASE_URL
 */
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { buildPublicObjectUrl } from "./lib/s3-public-url.mjs";
import { createS3Client, readS3Env, uploadMediaFile } from "./lib/s3-upload.mjs";

const scriptRoot = resolve(fileURLToPath(new URL("..", import.meta.url)));
const mediaDir = resolve(scriptRoot, "apps/web/public/media/backgrounds");
const names = process.argv.slice(2);
const targets =
  names.length > 0
    ? names.map((name) => (name.endsWith(".webp") ? name : `${name}.webp`))
    : [
        "aurora_flow.webp",
        "cloud_ridge.webp",
        "crimson_peak.webp",
        "buy/neon_dragon.webp",
        "buy/moss_dragon.webp",
      ];

const env = readS3Env();
const client = createS3Client(env);

for (const relativeName of targets) {
  const filePath = resolve(mediaDir, relativeName);
  if (!existsSync(filePath)) {
    console.error(`missing ${filePath}`);
    process.exit(1);
  }
  const key = `media/backgrounds/${relativeName.replace(/\\/g, "/")}`;
  const result = await uploadMediaFile(client, {
    bucket: env.bucket,
    key,
    filePath,
  });
  const publicUrl = buildPublicObjectUrl({
    publicBase: env.publicBase,
    endpoint: env.endpoint,
    bucket: env.bucket,
    key,
  });
  console.log(`${result.skipped ? "skip" : "ok  "} ${key} -> ${publicUrl}`);
}
