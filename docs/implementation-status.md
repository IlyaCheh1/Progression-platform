# Implementation Status

Last updated: 2026-07-19

| Stage | Status | Notes |
|---|---|---|
| Stage 0–2 | **done** | foundation + vertical slices |
| Stage 3 School ops | **partial** | CRM/schedule/booking/commerce/comms/import; ЮMoney sandbox only |
| Stage 4 Game MVP | **partial** | quest/achievement, titles on rank, kill switches |
| Stage 5 Studio | **partial** | validation, simulation, release |
| Stage 6 Phase 2 | **partial** | season, battle pass, rental |
| Stage 7 Hardening | **partial** | postgres outbox sync, guardian, support, minor privacy |

## Delivered (excluding real ЮKassa)

- **Event catalog:** all 20 `produces` schemas from module manifest
- **Guardian cabinet (E2E-12):** `/guardian`, API `/v1/guardian/dependants*`, demo link `demo-guardian` → `student-synthetic-adult`
- **Minor privacy (E2E-18):** `SetMinor`, leaderboard exclusion, public-share block, achievements hidden for minors
- **Title → inventory (E2E-08):** rank unlock grants title item; equip via `/v1/inventory/equip` kind `title`
- **Support chat stub (E2E-13):** `/support`, cases API, admin resolve + optional correction
- **Asset pipeline stub (E2E-17):** `/v1/admin/assets` review workflow
- **Analytics:** cohorts, churn, hall heatmap APIs
- **Postgres:** row-level repos (`004_row_level.sql`) + outbox sync; legacy blob auto-migrated once

## Explicitly deferred

- Real ЮKassa HTTP + webhook signatures (not available yet)
- OnlyID OAuth
- Row-level Postgres repos (replace snapshot blob)

## Local dev

```bash
export SCHOOL_STATE_PATH=infra/local/data/platform-state.json
# shared outbox (optional):
export DATABASE_URL=postgres://...
psql "$DATABASE_URL" -f infra/local/migrations/001_foundation.sql
psql "$DATABASE_URL" -f infra/local/migrations/002_school_ops.sql
psql "$DATABASE_URL" -f infra/local/migrations/003_phase_f.sql
```
