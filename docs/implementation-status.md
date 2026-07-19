# Implementation Status

Last updated: 2026-07-19

| Stage | Status | Notes |
|---|---|---|
| Stage 0 Intake | **done** | ADRs 001–005, reference-intake, conflicts, traceability, monorepo |
| Stage 1 Foundation | **done** | envelopes, outbox memory store, Character/Progression/Reward slice, auth-adapter, migrations SQL |
| Stage 2 Vertical slice | **done** | attendance→XP; training record→mastery; decay; correction; tests |
| Stage 3 School ops | **partial** | CRM/schedule/booking/commerce/comms/import API; ЮMoney sandbox; Postgres wiring pending |
| Stage 4 Game MVP | **partial** | quest/achievement runtime; kill switches |
| Stage 5 Studio | **partial** | live catalog, validation, simulation, release center |
| Stage 6 Phase 2 | **partial** | Season/BattlePass/rental API scaffold; full content pending |
| Stage 7 Hardening | **scaffold** | runbooks started |

## Latest (continue in order)

- **JSON persistence:** `SCHOOL_STATE_PATH` + `packages/contracts/persist/` (auto-save every 30s)
- **Comms:** `/v1/comms/send`, `/v1/comms/reminders/run`, `/v1/comms/log`
- **Import pipeline:** stage → preview → commit (`/v1/import/*`), UI `/admin/import`
- **Studio Phase D:** live catalog, validation, quest simulation, release center (`/studio?tab=validation`)

## Local dev

```bash
export SCHOOL_STATE_PATH=infra/local/data/platform-state.json
# run school-api — state survives restarts
```

## Blockers

- Postgres `DATABASE_URL` for production durability
- Real ЮKassa HTTP client
- OnlyID deferred
- SMS/TG real providers
