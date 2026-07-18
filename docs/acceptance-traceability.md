# Acceptance Traceability

IDs follow `DEV-S<section>-<n>`.

| ID | Source | Package | Migration | Contract | Test | Evidence | Status |
|---|---|---|---|---|---|---|---|
| DEV-S0-01 | TZ §36 Stage 0 | docs/* | — | — | docs review | reference-intake.md | done |
| DEV-S0-02 | TZ §8 ADR stack | docs/adr | — | ADR-001..005 | — | adr/* | done |
| DEV-S1-01 | TZ §10 Command/Event | packages/contracts | — | event-envelope | unit | go test | done |
| DEV-S1-02 | TZ §10.4 outbox | packages/contracts/outbox | 001_foundation | outbox | unit | memory store dedup | done |
| DEV-S1-03 | TZ §11 Character | packages/contracts/engines | 001 | character.* | unit | CreateCharacter | done |
| DEV-S1-04 | TZ §12 Progression | packages/contracts/progression | 001 | progression.* | unit | Standard100 | done |
| DEV-S1-05 | TZ §13 Reward | packages/contracts/engines | 001 | reward path | unit | RecordAttendance | done |
| DEV-S2-01 | E2E-02 Attendance XP | engines | 002 | attendance.recorded.v1 | unit | vertical_slice_test | done |
| DEV-S2-02 | E2E-03 Duplicate | outbox/inbox | 002 | — | unit | duplicate guard | done |
| DEV-S2-03 | E2E-05 Mastery | mastery | 002 | mastery.* | unit | 75/25 + floor | done |
| DEV-S3-01 | TZ §23.1 Public site | apps/web | — | — | next build | landing routes | done |
| DEV-S3-02 | TZ §28 Excel | scripts/excel_seed.py | 003 | import seed | manual+API | 44 mastery accounts | done |
| DEV-S4-01 | TZ §23.7 Profile | apps/web | — | BFF/login | build | /profile Witcher nav | done |
| DEV-S4-02 | 104 content pack | schemas/content | seed | definitions | build | quests/achievements/talents | done |
| DEV-S5-01 | TZ §21 Studio | apps/web /studio | — | authoring | build | catalog viewer MVP | partial |
