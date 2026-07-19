#!/usr/bin/env node
/**
 * Upload quest/achievement PNG icons to S3.
 *
 * Local:
 *   node --env-file=infra/local/.env scripts/upload-content-icons-to-s3.mjs
 *   node --env-file=/path/to/.env scripts/upload-content-icons-to-s3.mjs
 *
 * Env: S3_ENDPOINT, S3_ACCESS_KEY, S3_SECRET_KEY, S3_BUCKET
 * Optional: S3_REGION, S3_PUBLIC_BASE_URL, S3_PREFIX=media/content-icons
 */
import { createReadStream, existsSync, readdirSync, statSync } from "node:fs";
import { basename, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

const scriptRoot = resolve(fileURLToPath(new URL("..", import.meta.url)));
const prefix = (process.env.S3_PREFIX || "media/content-icons").replace(/^\/+|\/+$/g, "");

function resolveIconsRoot() {
  const candidates = [
    process.env.CONTENT_ICONS_DIR,
    join(scriptRoot, "apps/web/public/media/content-icons"),
    join(process.cwd(), "apps/web/public/media/content-icons"),
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
  console.error("Missing S3 env. Need S3_ENDPOINT, S3_ACCESS_KEY, S3_SECRET_KEY, S3_BUCKET");
  process.exit(1);
}

const iconsRoot = resolveIconsRoot();
if (!iconsRoot) {
  console.error("Content icons directory not found.");
  process.exit(1);
}

const contentTypes = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
};

function publicUrl(key) {
  if (publicBase) {
    return `${publicBase.replace(/\/$/, "")}/${bucket}/${key}`;
  }
  return `${endpoint.replace(/\/$/, "")}/${bucket}/${key}`;
}

function mediaBaseUrl() {
  if (publicBase) {
    return `${publicBase.replace(/\/$/, "")}/${bucket}/${prefix}`;
  }
  return `${endpoint.replace(/\/$/, "")}/${bucket}/${prefix}`;
}

function collectPngFiles(dir, acc = []) {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) {
      collectPngFiles(full, acc);
      continue;
    }
    if (/\.png$/i.test(name)) acc.push(full);
  }
  return acc;
}

const client = new S3Client({
  region,
  endpoint,
  credentials: { accessKeyId: accessKey, secretAccessKey: secretKey },
  forcePathStyle: true,
});

const files = collectPngFiles(iconsRoot).sort();
if (files.length === 0) {
  console.error(`No PNG files under ${iconsRoot}`);
  process.exit(1);
}

console.log(`Uploading ${files.length} PNG icons from ${iconsRoot}`);
console.log(`Bucket=${bucket} prefix=${prefix}/ endpoint=${endpoint}`);

const uploaded = [];
for (const filePath of files) {
  const rel = relative(iconsRoot, filePath).replace(/\\/g, "/");
  const ext = rel.slice(rel.lastIndexOf(".")).toLowerCase();
  const key = `${prefix}/${rel}`;
  const size = statSync(filePath).size;
  process.stdout.write(`→ ${key} (${(size / 1024).toFixed(1)} KB) ... `);
  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: createReadStream(filePath),
      ContentType: contentTypes[ext] || "application/octet-stream",
      CacheControl: "public, max-age=31536000, immutable",
    }),
  );
  uploaded.push({ key, url: publicUrl(key), rel, size });
  console.log("ok");
}

console.log(`\nDone. Uploaded ${uploaded.length} icons.`);
console.log("\n=== Add to web env (Buildtime + Runtime), then Rebuild ===");
console.log(`NEXT_PUBLIC_CONTENT_ICONS_BASE_URL=${mediaBaseUrl()}`);
