# school-api runbook (local / staging)

## Health

- `GET /health` — process alive
- `GET /ready` — postgres ping when `DATABASE_URL` is set

## Persistence

Priority:

1. `DATABASE_URL` → **row-level repos** (migration `004_row_level.sql`) — source of truth
2. Legacy `platform_snapshot` blob — auto-migrated once on first load if rows empty
3. `SCHOOL_STATE_PATH` → local JSON file (dev fallback when Postgres unavailable)

Apply migrations:

```bash
psql "$DATABASE_URL" -f infra/local/migrations/001_foundation.sql
psql "$DATABASE_URL" -f infra/local/migrations/002_school_ops.sql
psql "$DATABASE_URL" -f infra/local/migrations/003_phase_f.sql
psql "$DATABASE_URL" -f infra/local/migrations/004_row_level.sql
```

## Backup / restore

- Row-level: backup Postgres schemas (`school_*`, `platform_*`, `outbox`)
- Legacy blob (if present): `SELECT payload FROM platform_snapshot WHERE id = 'platform.main'`
- File dev fallback: copy `SCHOOL_STATE_PATH` snapshot

## Key flows to smoke-test

1. Login → attendance confirm → mastery page
2. `/membership` checkout → webhook → active membership
3. `/schedule` trial → waitlist when full
4. `/renter` night slot booking
5. `/studio?tab=validation` content health
6. `/admin/import` stage + commit

## Outbox worker

When `DATABASE_URL` is set, `school-api` syncs in-memory outbox → `outbox.events` on save tick and drains via `platform-worker` or embedded tick.

```bash
go run ./apps/platform-worker/cmd/platform-worker
```

## Out of scope (deferred)

- OnlyID OAuth
- Real ЮKassa HTTP + fiscal provider (sandbox only until credentials available)
- SMS/Telegram delivery
