# Acceptance Traceability

IDs follow `DEV-S<section>-<n>`. E2E scenarios from TZ §37 (`015-platform-development-agent-spec.md`).

## E2E scenarios (E2E-01 … E2E-18)

| E2E | Scenario | API / UI | Test | Status |
|---|---|---|---|---|
| E2E-01 | Guest → trial → reminder → attendance → membership → receipt | `/schedule`, `/membership`, comms reminders, CRM leads | manual smoke | **partial** — trial + checkout + webhook sandbox; no ad/UTM chain |
| E2E-02 | Attendance → one XP → level projection | `POST /v1/training/records/:id/confirm`, `/profile` | unit `vertical_slice_test` | **done** |
| E2E-03 | Duplicate event → one effect | outbox dedup | unit | **done** |
| E2E-04 | Correction → reversal → append-only history | `POST /v1/training/records/:id/correct` | unit `training_record_test` | **partial** — correction + mastery delta; reward reversal stub |
| E2E-05 | Mastery 75/25, decay, rank floor | `RunDailyDecay`, `/mastery` | unit mastery + decay tests | **partial** — math + decay worker; monthly d8 not wired |
| E2E-06 | Quest validation → progress → completion → reward | quest runtime, kill switches | unit quest progress | **partial** — attendance-driven progress; no Studio publish loop |
| E2E-07 | Achievement tiers from thresholds | achievement runtime | unit | **partial** — attendance + mastery tiers |
| E2E-08 | Rank → title → inventory → equip | rank grant, inventory equip | unit titles_internal_test | **partial** |
| E2E-09 | Season schedule → activation → close | `/v1/season/*` | manual | **partial** |
| E2E-10 | Battle Pass XP → tier → claim | `/v1/battlepass/me` | manual | **partial** |
| E2E-11 | Content rollback / kill switch | kill switches, `/studio` | manual | **partial** |
| E2E-12 | Guardian dependant view | `/guardian`, `/v1/guardian/*` | manual | **partial** |
| E2E-13 | Support chat → correction workflow | `/support`, support API | manual | **partial** |
| E2E-14 | Excel import dedup + reconciliation | `/admin/import`, `/v1/import/*` | manual | **partial** |
| E2E-15 | Cross-tenant deny | single-tenant MVP | — | **deferred** |
| E2E-16 | Provider failure → retry, no duplicate | ЮMoney sandbox | manual | **deferred** (real ЮKassa N/A) |
| E2E-17 | Image asset → bundle → CDN | `/v1/admin/assets` | manual | **partial** — review stub |
| E2E-18 | Minor privacy / leaderboard block | leaderboard, public-share | unit privacy_test | **partial** |

## Delivery stages (DEV-S*)

| ID | Source | Package | Migration | Contract | Test | Evidence | Status |
|---|---|---|---|---|---|---|---|
| DEV-S0-01 | TZ §36 Stage 0 | docs/* | — | — | docs review | reference-intake.md | done |
| DEV-S0-02 | TZ §8 ADR stack | docs/adr | — | ADR-001..006 | — | adr/* | done |
| DEV-S1-01 | TZ §10 Command/Event | packages/contracts | — | event-envelope | unit | go test | done |
| DEV-S1-02 | TZ §10.4 outbox | packages/contracts/outbox | 001_foundation | outbox | unit | memory store dedup | done |
| DEV-S1-03 | TZ §11 Character | packages/contracts/engines | 001 | character.* | unit | CreateCharacter | done |
| DEV-S1-04 | TZ §12 Progression | packages/contracts/progression | 001 | progression.* | unit | Standard100 | done |
| DEV-S1-05 | TZ §13 Reward | packages/contracts/engines | 001 | reward path | unit | RecordAttendance | done |
| DEV-S2-01 | E2E-02 Attendance XP | engines | 002 | attendance.recorded.v1 | unit | vertical_slice_test | done |
| DEV-S2-02 | E2E-03 Duplicate | outbox/inbox | 002 | — | unit | duplicate guard | done |
| DEV-S2-03 | E2E-05 Mastery | mastery | 002 | mastery.* | unit | 75/25 + floor | partial |
| DEV-S2-04 | Training Record | engines | 002 | training.record | unit | training_record_test | done |
| DEV-S2-05 | Postgres row-level repos | persist | 004_row_level | per-entity tables | manual | DATABASE_URL load/save | done |
| DEV-S3-01 | TZ §23.1 Public site | apps/web | — | — | next build | landing routes | done |
| DEV-S3-02 | Live schedule + waitlist | apps/web | — | booking | build | /schedule | partial |
| DEV-S3-03 | CRM admin | apps/web | 002 | crm.* | build | /admin/crm | done |
| DEV-S3-04 | Commerce checkout | school-api | 002 | commerce.* | manual | /membership | partial |
| DEV-S3-05 | Comms + reminders | engines | 002 | comms | manual | /v1/comms/* | partial |
| DEV-S3-06 | Excel import pipeline | scripts + API | 003 | import | manual | /admin/import | partial |
| DEV-S4-01 | TZ §23.7 Profile | apps/web | — | BFF/login | build | /profile Witcher nav | done |
| DEV-S4-02 | 104 content pack | schemas/content | seed | definitions | build | starter bundle | partial (26 items) |
| DEV-S4-03 | Quest / Achievement runtime | engines | — | game | unit | quest.go achievement.go | partial |
| DEV-S4-04 | Renter cabinet | apps/web | 003 | rental booking | build | /renter | done |
| DEV-S5-01 | TZ §21 Studio | apps/web | — | validate/simulate | build | /studio | partial |
| DEV-S5-02 | Season + Battle Pass | engines | 003 | season | manual | /v1/season/* | partial |
| DEV-S6-01 | Waitlist | engines | 003 | waitlist | unit | waitlist_test | done |
| DEV-S6-02 | Master rank review | engines | 003 | review workflow | manual | API routes | done |
| DEV-S6-03 | Runbook + /ready | school-api | 003 | health | manual | docs/runbooks/school-api.md | done |

## Event schemas (manifest produces)

| Event | Schema file | Status |
|---|---|---|
| school.training.attendance.recorded.v1 | schemas/events/... | done |
| school.training.attendance.corrected.v1 | schemas/events/... | done |
| school.weapon.mastery.points.applied.v1 | schemas/events/... | done |
| school.weapon.mastery.rank.changed.v1 | schemas/events/... | done |
| school.booking.confirmed.v1 | schemas/events/... | done |
| school.membership.activated.v1 | schemas/events/... | done |
| school.payment.completed.v1 | schemas/events/... | done |
| Remaining 13 produce types | — | **done** (20/20) |

## FS-* MVP capabilities (summary)

| FS area | Status |
|---|---|
| FS-CRM-01..03 CRM funnel | partial — leads/tasks, no campaigns |
| FS-SCH-01..04 Scheduling | partial — sessions + conflicts |
| FS-BKG-01..02 Booking | partial — trial + waitlist |
| FS-COM-01..08 Commerce | partial — ЮMoney sandbox |
| FS-TRN-01..05 Training | partial — record + correction |
| FS-MAS-01..05 Mastery | partial — decay; no monthly d8 |
| FS-MSG-01..02 Communications | partial — in-memory log |
| FS-REP-01..06 Analytics | partial — basic counters API |
| FS-RPG-05 Kill switches | partial |
