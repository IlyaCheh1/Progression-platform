#!/bin/sh
# Coolify: upload quest/achievement PNG icons to S3
set -eu
ROOT="$(CDPATH= cd -- "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
if [ -z "${S3_ENDPOINT:-}" ] || [ -z "${S3_ACCESS_KEY:-}" ] || [ -z "${S3_SECRET_KEY:-}" ] || [ -z "${S3_BUCKET:-}" ]; then
  echo "ERROR: S3 env missing. Set S3_ENDPOINT S3_ACCESS_KEY S3_SECRET_KEY S3_BUCKET"
  exit 1
fi
if [ ! -d "node_modules/@aws-sdk/client-s3" ]; then
  if command -v pnpm >/dev/null 2>&1; then pnpm add -w @aws-sdk/client-s3
  elif command -v npm >/dev/null 2>&1; then npm install @aws-sdk/client-s3 --no-save
  else echo "ERROR: pnpm/npm not found"; exit 1; fi
fi
node scripts/upload-content-icons-to-s3.mjs
