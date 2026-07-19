#!/usr/bin/env node
/**
 * Upload landing hero videos (+ posters) to Selectel S3.
 *
 * Coolify (env уже в контейнере):
 *   sh scripts/coolify-upload-hero-s3.sh
 *   # или:
 *   node scripts/upload-hero-media-to-s3.mjs
 *
 * Local:
 *   node --env-file=infra/local/.env scripts/upload-hero-media-to-s3.mjs
 *
 * Env (как в GFF):
 *   S3_ENDPOINT, S3_ACCESS_KEY, S3_SECRET_KEY, S3_BUCKET
 * Optional:
 *   S3_REGION=ru-7
 *   S3_PUBLIC_BASE_URL
 *   S3_PREFIX=media/hero
 *   HERO_MEDIA_DIR=/absolute/path/to/hero
 */
import { createReadStream, existsSync, readdirSync, statSync } from "node:fs";
import { basename, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { buildMediaBaseUrl, buildPublicObjectUrl } from "./lib/s3-public-url.mjs";

const scriptRoot = resolve(fileURLToPath(new URL("..", import.meta.url)));
const cwd = process.cwd();
const prefix = (process.env.S3_PREFIX || "media/hero").replace(/^\/+|\/+$/g, "");

function resolveHeroDir() {
  const candidates = [
    process.env.HERO_MEDIA_DIR,
    join(scriptRoot, "apps/web/public/media/hero"),
    join(cwd, "apps/web/public/media/hero"),
    join(cwd, "public/media/hero"),
    join(scriptRoot, "public/media/hero"),
  ].filter(Boolean);

  for (const dir of candidates) {
    if (existsSync(dir)) return resolve(dir);
  }
  return null;
}

const endpoint = process.env.S3_ENDPOINT;
const region = process.env.S3_REGION || "ru-7";
const accessKey = process.env.S3_ACCESS_KEY;
const secretKey = process.env.S3_SECRET_KEY;
const bucket = process.env.S3_BUCKET;
const publicBase = process.env.S3_PUBLIC_BASE_URL;

if (!endpoint || !accessKey || !secretKey || !bucket) {
  console.error("Missing S3 env. Need:");
  console.error("  S3_ENDPOINT, S3_ACCESS_KEY, S3_SECRET_KEY, S3_BUCKET");
  console.error("On Coolify these must be Runtime variables of this service.");
  process.exit(1);
}

const heroDir = resolveHeroDir();
if (!heroDir) {
  console.error("Hero media directory not found. Checked:");
  console.error("  HERO_MEDIA_DIR, apps/web/public/media/hero, public/media/hero");
  process.exit(1);
}

const contentTypes = {
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
};

function publicUrl(key) {
  return buildPublicObjectUrl({ publicBase, endpoint, bucket, key });
}

function mediaBaseUrl() {
  return buildMediaBaseUrl({ publicBase, endpoint, bucket, prefix });
}

const client = new S3Client({
  region,
  endpoint,
  credentials: { accessKeyId: accessKey, secretAccessKey: secretKey },
  forcePathStyle: true,
});

const files = readdirSync(heroDir)
  .filter((name) => /\.(mp4|webm|png|jpe?g|webp)$/i.test(name))
  .sort();

if (files.length === 0) {
  console.error(`No media files in ${heroDir}`);
  process.exit(1);
}

console.log(`Uploading ${files.length} files from ${heroDir}`);
console.log(`Bucket=${bucket} prefix=${prefix}/ endpoint=${endpoint}`);

const uploaded = [];
for (const name of files) {
  const filePath = join(heroDir, name);
  const ext = name.slice(name.lastIndexOf(".")).toLowerCase();
  const key = `${prefix}/${basename(name)}`;
  const size = statSync(filePath).size;
  process.stdout.write(`→ ${key} (${(size / 1024 / 1024).toFixed(1)} MB) ... `);
  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: createReadStream(filePath),
      ContentType: contentTypes[ext] || "application/octet-stream",
      CacheControl: "public, max-age=31536000, immutable",
    }),
  );
  uploaded.push({ key, url: publicUrl(key), size });
  console.log("ok");
}

const videos = uploaded.filter((u) => u.key.endsWith(".mp4"));
console.log(`\nDone. Uploaded ${uploaded.length} objects (${videos.length} videos).`);
console.log("\nVideo URLs:");
for (const item of videos) {
  console.log(item.url);
}

console.log("\n=== Add to Coolify WEB service (Buildtime + Runtime), then Rebuild ===");
console.log(`NEXT_PUBLIC_MEDIA_BASE_URL=${mediaBaseUrl()}`);
