#!/bin/sh
# Coolify: upload all apps/web/public/media assets to S3
set -eu

ROOT="$(CDPATH= cd -- "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "[coolify-upload-all-media] cwd=$ROOT"

if [ -z "${S3_ENDPOINT:-}" ] || [ -z "${S3_ACCESS_KEY:-}" ] || [ -z "${S3_SECRET_KEY:-}" ] || [ -z "${S3_BUCKET:-}" ]; then
  echo "ERROR: S3 env missing in this container."
  echo "Set Runtime vars: S3_ENDPOINT S3_ACCESS_KEY S3_SECRET_KEY S3_BUCKET"
  exit 1
fi

if [ ! -d "apps/web/public/media" ] && [ ! -d "public/media" ]; then
  echo "ERROR: media directory not found in image."
  echo "Ensure apps/web/public/media is included in the deploy (not dockerignored)."
  exit 1
fi

if [ ! -d "node_modules/@aws-sdk/client-s3" ]; then
  echo "[coolify-upload-all-media] installing @aws-sdk/client-s3 ..."
  if command -v pnpm >/dev/null 2>&1; then
    pnpm add -w @aws-sdk/client-s3
  elif command -v npm >/dev/null 2>&1; then
    npm install @aws-sdk/client-s3 --no-save
  else
    echo "ERROR: pnpm/npm not found"
    exit 1
  fi
fi

node scripts/upload-all-media-to-s3.mjs
