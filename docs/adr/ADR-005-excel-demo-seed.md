# ADR-005: Excel Demo Seed

Status: Accepted  
Date: 2026-07-19

## Decision

Demo/staging students are seeded from `Master of the Sword module/Old/Мастер Меча.xlsx` (school-wide mastery ledger) via staging pipeline (doc 107 + TZ §28).

1. As-of cut-off = environment school date (Europe/Moscow).
2. Per student × weapon: `LEGACY_SNAPSHOT` with integer `masteryUnits`.
3. Conversion: recompute when possible; else `roundHalfUp(decimalPoints × 10_000)`.
4. Mastery snapshot does **not** auto-grant primary Level XP, Quests, or Achievements.
5. Each student gets deterministic demo login/password documented in `docs/demo-accounts.md` (local/staging only).
6. Production seed never includes real student PII.
7. Re-import same file hash → zero new effects.
