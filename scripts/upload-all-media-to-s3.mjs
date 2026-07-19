#!/usr/bin/env node
/**
 * Upload all static media from apps/web/public/media to S3.
 *
 * Local:
 *   node --env-file=infra/local/.env scripts/upload-all-media-to-s3.mjs
 *   node --env-file=/path/to/.env scripts/upload-all-media-to-s3.mjs
 *
 * Coolify (S3 env already in container):
 *   sh scripts/coolify-upload-all-media-s3.sh
 *
 * Env:
 *   S3_ENDPOINT, S3_ACCESS_KEY, S3_SECRET_KEY, S3_BUCKET
 * Optional:
 *   S3_REGION=ru-7
 *   S3_PUBLIC_BASE_URL
 *   S3_PREFIX=media
 *   MEDIA_DIR=/absolute/path/to/media
 *   DRY_RUN=1
 *   SKIP_EXISTING=1
 *   UPLOAD_CONCURRENCY=8
 */
import { statSync } from "node:fs";
import { relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { buildMediaBaseUrl } from "./lib/s3-public-url.mjs";
import {
  collectMediaFiles,
  createS3Client,
  mapWithConcurrency,
  readS3Env,
  resolveExistingDir,
  uploadMediaFile,
} from "./lib/s3-upload.mjs";

const scriptRoot = resolve(fileURLToPath(new URL("..", import.meta.url)));
const prefix = (process.env.S3_PREFIX || "media").replace(/^\/+|\/+$/g, "");
const dryRun = process.env.DRY_RUN === "1" || process.env.DRY_RUN === "true";
const skipExisting = process.env.SKIP_EXISTING === "1" || process.env.SKIP_EXISTING === "true";
const concurrency = Number.parseInt(process.env.UPLOAD_CONCURRENCY || "8", 10);

const mediaRoot = resolveExistingDir([
  process.env.MEDIA_DIR,
  resolve(scriptRoot, "apps/web/public/media"),
  resolve(process.cwd(), "apps/web/public/media"),
  resolve(process.cwd(), "public/media"),
]);

let env;
try {
  env = readS3Env();
} catch (error) {
  console.error(error.message);
  process.exit(1);
}

if (!mediaRoot) {
  console.error("Media directory not found. Checked:");
  console.error("  MEDIA_DIR, apps/web/public/media, public/media");
  process.exit(1);
}

if (!Number.isFinite(concurrency) || concurrency < 1) {
  console.error("UPLOAD_CONCURRENCY must be a positive integer");
  process.exit(1);
}

const client = createS3Client(env);
const files = collectMediaFiles(mediaRoot);

if (files.length === 0) {
  console.error(`No media files under ${mediaRoot}`);
  process.exit(1);
}

const totalBytes = files.reduce((sum, filePath) => sum + statSize(filePath), 0);

console.log(`Uploading ${files.length} files from ${mediaRoot}`);
console.log(`Bucket=${env.bucket} prefix=${prefix}/ endpoint=${env.endpoint}`);
console.log(
  `Options: dryRun=${dryRun} skipExisting=${skipExisting} concurrency=${concurrency} total=${formatBytes(totalBytes)}`,
);

/** @type {{ uploaded: number, skipped: number, failed: number }} */
const stats = { uploaded: 0, skipped: 0, failed: 0 };
let processed = 0;

await mapWithConcurrency(files, concurrency, async (filePath) => {
  const rel = relative(mediaRoot, filePath).replace(/\\/g, "/");
  const key = `${prefix}/${rel}`;
  const size = statSize(filePath);

  process.stdout.write(`→ ${key} (${formatBytes(size)}) ... `);

  try {
    const result = await uploadMediaFile(client, {
      bucket: env.bucket,
      key,
      filePath,
      skipExisting,
      dryRun,
    });

    processed += 1;
    if (result.skipped) {
      stats.skipped += 1;
      console.log("skip");
      return;
    }

    stats.uploaded += 1;
    console.log(dryRun ? "dry-run" : "ok");
  } catch (error) {
    processed += 1;
    stats.failed += 1;
    console.log("fail");
    console.error(`  ${error instanceof Error ? error.message : String(error)}`);
  }
});

console.log("\n=== Summary ===");
console.log(`Processed: ${processed}/${files.length}`);
console.log(`Uploaded: ${stats.uploaded}`);
console.log(`Skipped: ${stats.skipped}`);
console.log(`Failed: ${stats.failed}`);

if (stats.failed > 0) {
  process.exit(1);
}

if (dryRun) {
  console.log("\nDry run complete. Re-run without DRY_RUN=1 to upload.");
  process.exit(0);
}

const mediaBase = buildMediaBaseUrl({
  publicBase: env.publicBase,
  endpoint: env.endpoint,
  bucket: env.bucket,
  prefix,
});

console.log("\n=== Suggested web env (Buildtime + Runtime), then Rebuild ===");
console.log(`NEXT_PUBLIC_MEDIA_ROOT=${mediaBase}`);
console.log(`NEXT_PUBLIC_MEDIA_BASE_URL=${buildMediaBaseUrl({
  publicBase: env.publicBase,
  endpoint: env.endpoint,
  bucket: env.bucket,
  prefix: `${prefix}/hero`,
})}`);
console.log(`NEXT_PUBLIC_CONTENT_ICONS_BASE_URL=${buildMediaBaseUrl({
  publicBase: env.publicBase,
  endpoint: env.endpoint,
  bucket: env.bucket,
  prefix: `${prefix}/content-icons`,
})}`);

function statSize(filePath) {
  return statSync(filePath).size;
}

function formatBytes(bytes) {
  if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${bytes} B`;
}
