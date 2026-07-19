#!/usr/bin/env sh
# Register Telegram webhook for support-chat (production or manual run).
# Reads OGC_* from environment or ../../.env.local when sourced manually.

set -eu

if [ -f ".env.local" ]; then
  # shellcheck disable=SC2046
  export $(grep -E '^OGC_TELEGRAM_' .env.local | xargs)
elif [ -f "../../.env.local" ]; then
  # shellcheck disable=SC2046
  export $(grep -E '^OGC_TELEGRAM_' ../../.env.local | xargs)
fi

BASE_URL="${OGC_TELEGRAM__PUBLIC_BASE_URL:-${OGC_TELEGRAM_PUBLIC_BASE_URL:-https://chat-api.mastersword.ru}}"
SECRET="${OGC_TELEGRAM_WEBHOOK_SECRET:?OGC_TELEGRAM_WEBHOOK_SECRET required}"
TOKEN="${OGC_TELEGRAM_BOT_TOKEN:?OGC_TELEGRAM_BOT_TOKEN required}"

WEBHOOK_URL="${BASE_URL%/}/integrations/telegram/webhook/${SECRET}"

echo "Setting webhook: ${WEBHOOK_URL}"

curl -sS -X POST "https://api.telegram.org/bot${TOKEN}/setWebhook" \
  -H "Content-Type: application/json" \
  -d "{\"url\":\"${WEBHOOK_URL}\",\"allowed_updates\":[\"message\"]}"

echo ""
curl -sS "https://api.telegram.org/bot${TOKEN}/getWebhookInfo"
echo ""
