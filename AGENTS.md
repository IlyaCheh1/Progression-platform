# Project instructions

> Keep this file short and always relevant. Put subsystem rules in nested `AGENTS.md` or scoped `.cursor/rules/*.mdc`; put rare procedures in `docs/runbooks/`.

<!-- agents-policy-block:version=1 source=repository-instruction-standardization -->
> **Managed policy:** sections 7–9 (safety, Git/worktree, Definition of Done) are the repository root contract. Update them only via an explicit repository instruction-standardization task.
<!-- /agents-policy-block -->

## 1. Product and scope

- **Purpose:** Progression Platform turns real-world actions into durable RPG character progression. This repository implements the platform stack and the first Context Module `school.fencing` (“Master of the Sword” fencing school).
- **Repository owns:** web cabinets/landing (`apps/web`), school/platform Go APIs and workers, OnlyID-compatible auth adapter, support-chat service + embeddable widget, shared Go contracts, event/content schemas, local infra, and the fencing-school module canon under `Master of the Sword module/fencing-school/`.
- **Out of scope:** neighboring product repositories; editing generated artifacts as sources; treating `README_RU.md` / `SETTINGS_RU.md` / `PROMPTS_RU.md` as product canon (Cursor kit overlays — operational README is `README.md`).
- If the task crosses repositories, use a separate worktree and final report for each repository.

## 2. Repository map

| Path | Responsibility | Notes |
|---|---|---|
| `apps/web` | Next.js App Router + React 19 UI | Tests: `node --test` via `pnpm test:web` |
| `apps/school-api` | School modular monolith API | Go module in `go.work` |
| `apps/platform-api` | Platform API | Go module in `go.work` |
| `apps/platform-worker` | Inbox/outbox, timers, reward fulfillment | Go module in `go.work` |
| `apps/auth-adapter` | OnlyID / og-sso compatible adapter | Go module in `go.work` |
| `apps/support-chat` | Support chat backend | Own Makefile/`go.mod`; optional GitLab CI |
| `apps/school-worker` | Stub `cmd/` only | **Not** in `go.work`; no module gates yet |
| `packages/contracts` | Shared Go contracts (envelope, outbox, engines, school) | Go module in `go.work` |
| `packages/support-chat-widget` | Embeddable chat widget | Own `package-lock.json` (npm); build copies into web |
| `packages/design-tokens` | Design tokens package | No scripts/gates declared |
| `schemas/events`, `schemas/content` | Event/content JSON schemas | Align with module produces/consumes |
| `Master of the Sword module/fencing-school/` | **Canonical** school Context Module docs + full `module-manifest.yaml` | See nested `AGENTS.md` |
| `modules/fencing-school/` | Short copied stub of the manifest | Not the full canon — do not treat as complete |
| `Architecture/` | Normative platform RFCs (philosophy → engines → module framework) | Design intent; may lead implementation |
| `docs/adr/`, `docs/implementation-status.md`, `docs/decisions/open-conflicts.md` | Accepted stack/topology decisions, status, conflicts | Implementation truth vs RFC intent |
| `docs/runbooks/` | Operational procedures | Outbox, school-api, support-chat |
| `infra/local/` | Docker Compose, migrations, `.env.example` | Local Postgres/Redis/MinIO |
| `015-platform-development-agent-spec.md` | Large implementation brief / TZ | Normative intent for delivery phases |
| `013-context-module-integration-specification-template.md` | Template for new Context Modules | Not school-specific canon |

Before editing, read this root file and every applicable nested `AGENTS.md` along the target path (nested files are not assumed to auto-load). Nested instructions specialize local behavior; they must not weaken safety, authorization, or verification. Report conflicting instructions rather than guessing precedence.

## 3. Sources of truth

| Topic | Edit this source | Derived/generated files | Validation |
|---|---|---|---|
| School module identity, capabilities, event contracts | `Master of the Sword module/fencing-school/module-manifest.yaml` (+ numbered `100`–`107` docs) | Short copy `modules/fencing-school/module-manifest.yaml` | Diff against full manifest; do not expand the stub as canon |
| Platform architecture & contracts | `Architecture/002*.md`, engine RFCs `003`–`012` | Code under `apps/*`, `packages/contracts` | Normative design ≠ shipped behavior; reconcile with ADRs/status |
| Implementation stack & topology | `docs/adr/ADR-001-*.md`, `ADR-002-*.md` | Runtime layout in `apps/*` | Follow ADR when RFCs and code disagree on stack |
| Event JSON schemas | `schemas/events/*.json` | Producers/consumers in Go/TS | Keep names aligned with manifest `produces`/`consumes` |
| Shared Go types / outbox helpers | `packages/contracts/**` | Importers via `go.work` replace | `go test`/`vet`/`build` in that module |
| Web app | `apps/web/**` | `.next/` build output | `pnpm lint:web`, `pnpm test:web`, `pnpm build:web` |
| Support chat widget bundle | `packages/support-chat-widget/**` | `dist/`, `apps/web/public/chat/og-chat.js` | Widget `build`; then web `chat:build` if embedding |
| Local DB schema | `infra/local/migrations/*.sql` | Runtime DB state | Apply only on local/explicit target |
| Demo roster / Excel seed | `scripts/excel_seed.py`, `docs/accounts.xlsx` | `infra/local/data/*` when seeded | Do not run mutating seed/upload without need |
| Product status | `docs/implementation-status.md` | — | May lag or contradict code; verify in tree |

- Never edit generated/copied stubs as if they were canon (`modules/fencing-school/` short manifest, widget `dist/`, `.next/`).
- If sources disagree, stop and report the conflict; do not silently choose the most convenient file.
- **Normative vs implementation:** `Architecture/` and `Master of the Sword module/` describe required design. `apps/`, `packages/`, `docs/adr/`, and `docs/implementation-status.md` describe what is actually built. Prefer ADRs + live code for “what runs”; prefer RFCs/module docs for “what must be true”; record gaps instead of inventing parity.

## 4. Architecture invariants

- Business facts and engine outcomes are **immutable Events**. Corrections/reversals are new Events, not in-place mutation of history.
- Every aggregate class has **one authoritative state owner** (single writer). Cross-boundary mutation uses typed async protocols; sync reads only via approved read contracts.
- Delivery is at-least-once. Exactly-once *effect* requires **inbox dedup** (`eventId` + handler version), **domain idempotency** keys/fingerprints, and **atomic** state + ledger + inbox + **transactional outbox** commit.
- Outbox stores the full canonical envelope before commit; retries must not alter `eventId`, payload, or envelope hash.
- Context Modules (e.g. school) own domain operations and module-specific ledgers (weapon mastery); Platform Engines own Character, primary Level 1–100, Rewards, Quests, Achievements, Items, Inventory, Talents, Seasons. Modules must not compute primary progression directly.
- Primary Experience never decays; negative primary XP is forbidden. Money stays in minor units; XP/mastery are integers.
- AuthN then AuthZ on every protected action; minors/privacy rules from module manifest apply to public progression and leaderboards.
- Point to contracts: `Architecture/002a-platform-contract-standard.md`, `packages/contracts/outbox`, runbook `docs/runbooks/outbox-stuck.md`.

## 5. Toolchain and bootstrap

- **JS runtime:** Node 22+ (deploy pin: `nixpacks.toml` → `nodejs_22`). No `.nvmrc` in-repo.
- **Package manager (workspace):** `pnpm@9.15.0` from root `package.json#packageManager`; lockfile `pnpm-lock.yaml`. Install: `pnpm install` (CI/deploy: `pnpm install --frozen-lockfile`).
- **Widget package:** `packages/support-chat-widget` uses **npm** (`package-lock.json`). Prefer `npm ci` / `npm run build` there (root web script also uses `npm --prefix`).
- **Go:** workspace `go.work` declares `go 1.24.0`; individual modules mostly `go 1.22` (`apps/support-chat` is `1.24.0`). Run Go tools **inside each affected module directory** listed in `go.work` (plus `scripts/excel-import` when touched).
- **Python:** 3.x + `openpyxl` for `scripts/excel_seed.py` / roster export.
- **Local services:** `docker compose -f infra/local/docker-compose.yml up -d` when Docker is available (Postgres, Redis, MinIO, …).
- **Environment template:** `infra/local/.env.example` → local `infra/local/.env` (untracked). Also `.env.cursor.example` for MCP keys. Never read, print, or commit real secrets/PII.
- **Quick start commands:** see `README.md` (build/run school-api, platform-api, auth-adapter, `pnpm --filter @mos/web dev`).

## 6. Quality gates

Run only commands that exist in this repository. Do not change runners or weaken flags to make a gate pass. Gates must **PASS**, not merely start. Fail / blocked / not-run ⇒ task incomplete.

| Change type | Required commands | Prerequisites / notes |
|---|---|---|
| Docs / agent instructions only | `git diff --check`; verify linked paths exist | **Do not** claim web/Go product gates ran |
| `apps/web` source | `pnpm lint:web`; `pnpm test:web` (canonical runner: **`node --test`**, not `tsx`); `pnpm build:web` for user-facing/routing/config changes | `pnpm install` first if deps missing |
| `packages/support-chat-widget` | From that dir: `npm ci` (if needed), `npm run build` (`vue-tsc && vite build`) | If web embed updated: `pnpm --filter @mos/web chat:build` or equivalent copy step |
| Go module (`apps/*`, `packages/contracts`, `scripts/excel-import`) | In **each touched** module: `go test ./...`; `go vet ./...`; `go build ./...` | Use module directory (not repo root alone). `apps/support-chat` may use `make test` / `make build` |
| Event/schema / contracts | Schema/manifest consistency review + Go tests in `packages/contracts` and affected APIs | Update `schemas/events` with producers |
| DB migration (`infra/local/migrations`) | Review SQL; apply only on local/explicit DB; smoke related API tests if feasible | Never shared/prod without explicit request |
| Seed / S3 upload / Coolify scripts | Run only when the task requires; prefer dry-run flags where present | Mutating; needs explicit intent + local `.env` |
| Infrastructure / deploy configs | Render/build/smoke as applicable; **no deploy** by default | `nixpacks.toml` deploys web only |

**Missing-gate debt (honest):**

- No root or `@mos/web` `typecheck` / `tsc --noEmit` script — do not invent one; report if types are only checked via `next build` / editor.
- No repo-wide Go lint toolchain beyond `go vet`.
- `packages/design-tokens` has no test/lint/build scripts.
- `apps/school-worker` has no `go.mod` / workspace entry — no module gates.
- No unified root CI for the whole monorepo (only nested CI under support-chat/widget).

## 7. Safety and forbidden actions

- Do not expose or commit `.env`, credentials, tokens, certificates, production data, or PII (rosters, guardian contacts, minors).
- Do not run destructive scripts, reset databases, apply shared/production migrations, deploy, release, sign, or publish without an explicit request.
- Do not run mutating product scripts (`excel_seed`, S3 uploads, Coolify upload shells, Telegram webhook setters) unless the task explicitly needs them.
- Preserve unrelated work. Never use force push, `--no-verify`, hook bypasses, or Git-config changes.
- Payments/auth/media: treat YooMoney/OnlyID/S3 credentials and webhook surfaces as security-sensitive; see `docs/security/threat-model.md` and `.cursor/rules/70-security.mdc`.

## 8. Git and worktree contract

- Product code is changed only inside the isolated Cursor worktree assigned to the task.
- **NEW task:** orchestrator fetches `origin/main`, then creates/uses `hermes/<task>`. If `origin/main` is unavailable, stop, report, and explicitly agree a fallback with the user — do not invent another base.
- **RESUME:** preserve the assigned existing branch and baseline WIP; do not reset, recreate, or discard the worktree/branch.
- Do not switch branches, rebase/reset unrelated work, or create a nested worktree inside product checkouts.
- Before editing, verify assigned worktree, branch, and `git status --short`; record the baseline. Stop if unrelated changes overlap the task or ownership is unclear.
- Create worktrees only under the configured **external** worktree root — never nested inside canonical product directories. Do not auto-remove worktrees: cleanup requires process/dirty/untracked/unpreserved-commit checks and **separate authorization**.
- Commit, push, merge request, merge, deploy, and release are separate actions — only when explicitly requested. **Never** force-push, `--no-verify`, or hook bypass. **Never** push directly to `main` / `origin/main` or rewrite history to land on `main`.
- Instruction/docs edits ship with the **next substantive** product change; no standalone docs-only commit/MR. Local untracked instruction files are not delivered to fresh clones until tracked in such a change.
- One repository ⇒ one branch/diff/MR. Multi-repo work uses separate worktrees.

## 9. Definition of Done

A task is complete only when:

1. The requested behavior and acceptance criteria are satisfied.
2. The diff contains no unrelated or accidental generated changes.
3. Every applicable quality gate above was actually run and **passed**.
4. A reproducible defect has a regression test when test infrastructure exists.
5. API/schema/migration changes include required artifacts and compatibility checks.
6. The final report states:
   - changed files and behavior;
   - commands run and pass/fail results;
   - checks not run and the exact reason;
   - remaining risks and manual verification;
   - current worktree/branch; no claim of commit/push/MR unless verified.

## 10. References

- Product README: `README.md`
- Architecture RFCs: `Architecture/` (start `Architecture/README(2).md`, `002-platform-architecture(3).md`, `002a-platform-contract-standard.md`)
- School module: `Master of the Sword module/fencing-school/` (nested `AGENTS.md`)
- Agent TZ: `015-platform-development-agent-spec.md`
- Status / conflicts: `docs/implementation-status.md`, `docs/decisions/open-conflicts.md`
- ADRs: `docs/adr/`
- Runbooks: `docs/runbooks/`
- Cursor rules: `.cursor/rules/*.mdc`
