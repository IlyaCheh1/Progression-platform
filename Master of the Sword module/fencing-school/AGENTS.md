# Fencing school Context Module — agent notes

Read from repository root first: [`AGENTS.md`](../../AGENTS.md). Nested files are not assumed to auto-load.

## Canon

- **Full canon path:** this directory (`Master of the Sword module/fencing-school/`).
- **Manifest source of truth:** `module-manifest.yaml` (full file here).
- **Stub, not canon:** `modules/fencing-school/module-manifest.yaml` is a short copy with a pointer comment — never expand or edit it as the complete module contract.

## Read order

1. `README.md` — outcome and canonical decisions  
2. `module-manifest.yaml` — activation, capabilities, produces/consumes, privacy, ops  
3. `100-module-architecture.md` → `101` → `102` → `103` as needed for the task  
4. `104`–`107` for content pack, integrations, acceptance, Excel migration  

## Boundaries

- Module owns school ops + weapon mastery ledger; Platform Engines own Character / primary Level / Rewards / Quests / Achievements / Items / Inventory / Talents / Seasons.
- Spreadsheets and `Old/` / media folders are evidence or assets — not runtime specs.
- Normative module docs may lead `apps/school-api` implementation; report gaps instead of silently shrinking the canon.
