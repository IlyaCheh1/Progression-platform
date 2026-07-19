import test from "node:test";
import assert from "node:assert/strict";
import { buildMediaBaseUrl, buildPublicObjectUrl, isVirtualHostedPublicBase } from "./s3-public-url.mjs";

test("Selectel *.selstorage.ru does not double the bucket in the path", () => {
  assert.equal(isVirtualHostedPublicBase("https://abc123.selstorage.ru", "mos"), true);
  assert.equal(
    buildPublicObjectUrl({
      publicBase: "https://abc123.selstorage.ru",
      endpoint: "https://s3.ru-7.storage.selcloud.ru",
      bucket: "mos",
      key: "media/hero/1.mp4",
    }),
    "https://abc123.selstorage.ru/media/hero/1.mp4",
  );
  assert.equal(
    buildMediaBaseUrl({
      publicBase: "https://abc123.selstorage.ru",
      endpoint: "https://s3.ru-7.storage.selcloud.ru",
      bucket: "mos",
      prefix: "media/hero",
    }),
    "https://abc123.selstorage.ru/media/hero",
  );
});

test("path-style endpoint keeps /bucket/key", () => {
  assert.equal(
    buildPublicObjectUrl({
      endpoint: "https://s3.ru-7.storage.selcloud.ru",
      bucket: "mos",
      key: "media/hero/1.mp4",
    }),
    "https://s3.ru-7.storage.selcloud.ru/mos/media/hero/1.mp4",
  );
});

test("path-style S3_PUBLIC_BASE_URL keeps /bucket/key", () => {
  assert.equal(
    buildMediaBaseUrl({
      publicBase: "https://s3.ru-7.storage.selcloud.ru",
      endpoint: "https://s3.ru-7.storage.selcloud.ru",
      bucket: "mos",
      prefix: "media/hero",
    }),
    "https://s3.ru-7.storage.selcloud.ru/mos/media/hero",
  );
});
