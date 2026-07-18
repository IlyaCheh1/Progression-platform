# Implementation Status

Last updated: 2026-07-19

| Stage | Status | Notes |
|---|---|---|
| Stage 0 Intake | **done** | ADRs 001–005, reference-intake, conflicts, traceability, monorepo |
| Stage 1 Foundation | **done** | envelopes, outbox memory store, Character/Progression/Reward slice, auth-adapter, migrations SQL |
| Stage 2 Vertical slice | **done** | attendance→XP exactly-once tests; mastery 75/25 tests |
| Stage 3 School ops + landing + Excel | **done** | Next landing (Witcher), tariffs/RPG/legal; Excel seed 45 accounts; school-api load |
| Stage 4 Game MVP + profile pages | **done** | profile shell, onboarding, achievements/tasks, talents, settings, schools dropdown |
| Stage 5 Studio | **partial** | `/studio` catalog viewer over starter bundle; full editors later |
| Stage 6 Phase 2 | **scaffold** | Season/Pass/Talent hardening pending Postgres + Studio publish |
| Stage 7 Hardening | **scaffold** | runbooks started; DR/load later |

## Verification performed

- `go test ./...` in `packages/contracts` — pass
- `go build` platform-api, school-api, auth-adapter — pass
- `pnpm --filter @mos/web build` — pass
- Excel import → `docs/demo-accounts.md` + `infra/local/seed/demo-students.json`
- school-api `/health` + `/v1/auth/login` with seeded user

## Blockers (TZ §40)

- Production OnlyID / payment / SMS / TG / hosting
- Tariff price finalization
- Docker not installed on this machine — Compose file ready for when available
