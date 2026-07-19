import { createReadStream, existsSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { HeadObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

export const CONTENT_TYPES = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".gif": "image/gif",
  ".ico": "image/x-icon",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".mp3": "audio/mpeg",
  ".ogg": "audio/ogg",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".html": "text/html; charset=utf-8",
  ".json": "application/json",
};

/**
 * @returns {{ endpoint: string, region: string, accessKey: string, secretKey: string, bucket: string, publicBase?: string }}
 */
export function readS3Env() {
  const endpoint = process.env.S3_ENDPOINT;
  const region = process.env.S3_REGION || "ru-7";
  const accessKey = process.env.S3_ACCESS_KEY;
  const secretKey = process.env.S3_SECRET_KEY;
  const bucket = process.env.S3_BUCKET;
  const publicBase = process.env.S3_PUBLIC_BASE_URL;

  if (!endpoint || !accessKey || !secretKey || !bucket) {
    throw new Error("Missing S3 env. Need S3_ENDPOINT, S3_ACCESS_KEY, S3_SECRET_KEY, S3_BUCKET");
  }

  return { endpoint, region, accessKey, secretKey, bucket, publicBase };
}

/**
 * @param {ReturnType<typeof readS3Env>} env
 */
export function createS3Client(env) {
  return new S3Client({
    region: env.region,
    endpoint: env.endpoint,
    credentials: { accessKeyId: env.accessKey, secretAccessKey: env.secretKey },
    forcePathStyle: true,
  });
}

export function contentTypeForExt(ext) {
  return CONTENT_TYPES[String(ext || "").toLowerCase()] || "application/octet-stream";
}

/**
 * @param {string} dir
 * @param {{ ignoreNames?: Set<string> }} [options]
 */
export function collectMediaFiles(dir, options = {}) {
  const ignoreNames = options.ignoreNames ?? new Set([".DS_Store", "Thumbs.db"]);
  /** @type {string[]} */
  const files = [];

  function walk(currentDir) {
    for (const name of readdirSync(currentDir)) {
      if (ignoreNames.has(name)) continue;
      const full = join(currentDir, name);
      if (statSync(full).isDirectory()) {
        walk(full);
        continue;
      }
      files.push(full);
    }
  }

  walk(dir);
  return files.sort();
}

/**
 * @param {S3Client} client
 * @param {{ bucket: string, key: string, filePath: string, skipExisting?: boolean, dryRun?: boolean }} opts
 */
export async function uploadMediaFile(client, opts) {
  const { bucket, key, filePath, skipExisting = false, dryRun = false } = opts;
  const ext = filePath.slice(filePath.lastIndexOf(".")).toLowerCase();
  const size = statSync(filePath).size;

  if (skipExisting) {
    try {
      await client.send(new HeadObjectCommand({ Bucket: bucket, Key: key }));
      return { key, size, skipped: true };
    } catch (error) {
      const status = error?.$metadata?.httpStatusCode;
      const notFound = status === 404 || error?.name === "NotFound" || error?.name === "NoSuchKey";
      if (!notFound) throw error;
    }
  }

  if (dryRun) {
    return { key, size, skipped: false, dryRun: true };
  }

  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: createReadStream(filePath),
      ContentType: contentTypeForExt(ext),
      CacheControl: "public, max-age=31536000, immutable",
    }),
  );

  return { key, size, skipped: false };
}

/**
 * @template T
 * @param {T[]} items
 * @param {number} concurrency
 * @param {(item: T, index: number) => Promise<void>} worker
 */
export async function mapWithConcurrency(items, concurrency, worker) {
  const limit = Math.max(1, concurrency);
  let index = 0;

  async function runWorker() {
    while (index < items.length) {
      const current = index++;
      await worker(items[current], current);
    }
  }

  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, runWorker));
}

/**
 * @param {string[]} candidates
 */
export function resolveExistingDir(candidates) {
  for (const dir of candidates.filter(Boolean)) {
    if (existsSync(dir)) return dir;
  }
  return null;
}
