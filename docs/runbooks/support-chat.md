# Support Chat (og-chat)

Realtime support widget + Telegram operator inbox (forum topics).

## Units

| Piece | Path | Port (local) |
|---|---|---|
| Backend | `apps/support-chat` | `:8084` (API + WS) |
| Widget source | `packages/support-chat-widget` | — |
| Widget bundle | `apps/web/public/chat/og-chat.js` | served by Next |

## Local run

1. Postgres + MinIO (`infra/local/docker-compose.yml`).
2. Migrate chat schema:

```bash
cd apps/support-chat
# env: OGC_TELEGRAM_* from repo root .env.local
make migrate-up
make run
```

3. Rebuild widget after theme/API changes:

```bash
cd apps/web && npm run chat:build
```

4. Web app (`npm run dev` in `apps/web`) — widget appears when session exists (not on `/login`).

## Env (OGC_ prefix)

| Variable | Purpose |
|---|---|
| `OGC_TELEGRAM_BOT_TOKEN` | BotFather token |
| `OGC_TELEGRAM_SUPPORT_CHAT_ID` | Supergroup id (`-100...`) |
| `OGC_TELEGRAM_WEBHOOK_SECRET` | Webhook path secret |
| `OGC_POSTGRESQL_*` | Override `configs/values.yml` |

Frontend:

| Variable | Default |
|---|---|
| `NEXT_PUBLIC_SUPPORT_CHAT_API` | `http://127.0.0.1:8084` |
| `NEXT_PUBLIC_SUPPORT_CHAT_WS` | `ws://127.0.0.1:8084` |

## Telegram webhook (staging/prod)

Permanent URL pattern:

```text
https://chat-api.mastersword.ru/integrations/telegram/webhook/<OGC_TELEGRAM_WEBHOOK_SECRET>
```

On production start, support-chat auto-registers webhook when `OGC_TELEGRAM__PUBLIC_BASE_URL` is set.

Manual register:

```bash
sh scripts/set-telegram-webhook.sh
```

Legacy manual curl:

```bash
curl "https://api.telegram.org/bot$OGC_TELEGRAM_BOT_TOKEN/setWebhook" \
  -d "url=https://<host>/integrations/telegram/webhook/$OGC_TELEGRAM_WEBHOOK_SECRET" \
  -d "allowed_updates=[\"message\"]"
```

Operators reply inside the **forum topic** for each case. Close with `/closed [reason]`.

## Theme

Widget theme `mos` uses site amber tokens (`#d4a84b`, `#f0c35a`) — see `packages/support-chat-widget/src/themes.ts`.
