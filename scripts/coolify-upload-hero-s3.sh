#!/bin/sh
# =============================================================================
# Coolify: выгрузка hero-видео лендинга в Selectel S3
# =============================================================================
# Предварительно в Environment сервиса (Runtime) должны быть:
#   S3_ENDPOINT, S3_REGION, S3_ACCESS_KEY, S3_SECRET_KEY, S3_BUCKET
#   S3_PUBLIC_BASE_URL  (опционально, но лучше задать)
#
# Как запустить в Coolify:
#   1) Открой сервис web → Terminal / Execute Command
#   2) Выполни:
#        sh scripts/coolify-upload-hero-s3.sh
#   3) Скопируй из вывода NEXT_PUBLIC_MEDIA_BASE_URL в env web
#   4) Rebuild web
# =============================================================================
set -eu

ROOT="$(CDPATH= cd -- "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "[coolify-upload] cwd=$ROOT"

if [ -z "${S3_ENDPOINT:-}" ] || [ -z "${S3_ACCESS_KEY:-}" ] || [ -z "${S3_SECRET_KEY:-}" ] || [ -z "${S3_BUCKET:-}" ]; then
  echo "ERROR: S3 env missing in this container."
  echo "Set Runtime vars: S3_ENDPOINT S3_ACCESS_KEY S3_SECRET_KEY S3_BUCKET"
  exit 1
fi

if [ ! -d "apps/web/public/media/hero" ] && [ ! -d "public/media/hero" ]; then
  echo "ERROR: hero media not found in image."
  echo "Ensure apps/web/public/media/hero/*.mp4 are in the deploy (not dockerignored)."
  exit 1
fi

if [ ! -d "node_modules/@aws-sdk/client-s3" ]; then
  echo "[coolify-upload] installing @aws-sdk/client-s3 ..."
  if command -v pnpm >/dev/null 2>&1; then
    pnpm add -w @aws-sdk/client-s3
  elif command -v npm >/dev/null 2>&1; then
    npm install @aws-sdk/client-s3 --no-save
  else
    echo "ERROR: pnpm/npm not found"
    exit 1
  fi
fi

node scripts/upload-hero-media-to-s3.mjs
