# Master of Sword — Progression Platform

Production-oriented platform for `school.fencing` Context Module.

## Stack

- **Web:** Next.js + React 19 + Tailwind (`apps/web`)
- **APIs/Workers:** Go (`apps/platform-api`, `apps/school-api`, workers)
- **Data:** PostgreSQL (source of truth), Redis (cache/locks), MinIO (objects)
- **Auth:** OnlyID-compatible adapter (`apps/auth-adapter`)

See `docs/adr/ADR-001-implementation-stack.md`.

## Quick start

```bash
# prerequisites: Go 1.22+, Node 22+, pnpm 9+, Python 3 + openpyxl
pnpm install
python scripts/excel_seed.py
go build -o bin/school-api.exe ./apps/school-api/cmd/school-api
go build -o bin/platform-api.exe ./apps/platform-api/cmd/platform-api
go build -o bin/auth-adapter.exe ./apps/auth-adapter/cmd/auth-adapter
./bin/school-api.exe          # 127.0.0.1:8082 — loads demo students + temp admin auth
./bin/platform-api.exe        # :8081
./bin/auth-adapter.exe        # :8083 OnlyID sandbox
pnpm --filter @mos/web dev    # :3000
```

Optional infra (when Docker available): `docker compose -f infra/local/docker-compose.yml up -d`

Demo accounts: `docs/demo-accounts.md` (Excel seed, local/staging only).

## Docs

- Agent TZ: `015-platform-development-agent-spec.md`
- Architecture RFCs: `Architecture/`
- School module: `Master of the Sword module/fencing-school/`
- Status: `docs/implementation-status.md`
