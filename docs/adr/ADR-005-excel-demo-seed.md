# ADR-005: Excel production roster seed

Status: Accepted (supersedes demo-only framing)  
Date: 2026-07-20

## Decision

School students and weapon mastery are bootstrapped from `Master of the Sword module/Old/Мастер Меча.xlsx` (school-wide mastery ledger) via the staging/import pipeline (doc 107 + TZ §28).

1. As-of cut-off = environment school date (Europe/Moscow).
2. Per student × weapon: `LEGACY_SNAPSHOT` with integer `masteryUnits`.
3. Conversion: recompute when possible; else `roundHalfUp(decimalPoints × 10_000)`.
4. Mastery snapshot does **not** auto-grant quests or achievements; character XP/level may be derived from mastery display points (1:1) at API startup.
5. Each student gets a deterministic login/password documented in `docs/accounts.md` / `docs/accounts.xlsx`. Initial passwords are production bootstrap credentials — change after first login.
6. Roster file: `infra/local/seed/students.json` (`kind: production-roster`). Excel students are real school members (PII intentional for this tenant).
7. Service accounts (`admin@`, `coach@`, `guardian@`, `renter@`, `adult@`, `student@`) remain for staff/cabinet flows; stable IDs (including historical `demo-*` prefixes) are not renamed once persisted in Postgres.
8. Staff role overlays on Excel accounts: Киселёв / Грибанова → `administrator`+`coach`; Лобаев → `student`+`coach`; everyone else → `student`.
9. Re-import same file hash → zero new mastery effects; API seed runs only when the platform has **no** students (empty DB bootstrap).
10. Content catalog (`starter.json`) is production product content (quests, achievements, talents, items, schools/directions) — not demo fixtures.

## Consequences

- Coolify school-api with `DATABASE_URL` restores Postgres first; roster seed is skipped when students already exist.
- Landing directions and tariffs stay as published product surfaces; they are not treated as disposable demo UI.
