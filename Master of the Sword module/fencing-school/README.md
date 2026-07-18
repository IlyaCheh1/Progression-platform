---
document: school-fencing-module-readme
title: Fencing School Context Module
owner: School Product Team
status: Proposed
version: 1.0.0
last_updated: 2026-07-18
depends_on:
  - 012-context-module-framework
  - 004a-standard-level-profile
---

# Fencing School Context Module

## Outcome

`school.fencing` is the first Context Module for Progression Platform. It
combines the school's public site, CRM, calendars, bookings, memberships,
payments, attendance, training records and the “Master of the Sword” method
with reusable platform progression.

The Module owns school operations and weapon mastery. Platform Engines own the
Character, primary Level 1-100, Rewards, Quests, Achievements, Items, Inventory,
Talents and Seasons.

------------------------------------------------------------------------

# Source Set

| Source | Use |
|---|---|
| Functional specification for the fencing-school site, July 2026 | operational capabilities, roles, phases, integrations and acceptance flows |
| Descriptive “Master of the Sword” rules | weapon taxonomy, load formula, rank thresholds, decay and monthly d8 bonus |
| Individual March training workbook | exercise-entry formula, paired-weapon allocation and bonus layout |
| School-wide monthly workbook | current student/day aggregation, decay practice and migration evidence |
| OnlyGames Wiki | reference patterns for Levels, quests, achievements, cosmetics, notifications and profile UX |
| Progression Platform RFCs | authoritative Engine boundaries and contracts |

The spreadsheets are evidence of current practice, not runtime specifications.

------------------------------------------------------------------------

# Canonical Decisions

1. Primary Character progression uses `platform.standard.100`.
2. Primary Experience never decays.
3. Weapon mastery is a Module-owned domain ledger with ranks 0-10, daily decay
   and earned-rank floors.
4. CRM, scheduling, commerce and attendance remain outside platform Engines.
5. A student, payer, guardian, User and Character are distinct identities.
6. One resource calendar owns all hall occupancy and prevents double booking.
7. Payments and game Rewards use separate ledgers.
8. Training Experience is based on verified participation and curriculum
   outcomes, not payment amount or unsafe physical volume.
9. Raw training load remains private by default.
10. The first implementation may be a modular monolith with strict bounded
    contexts and transactional outboxes.

------------------------------------------------------------------------

# Document Map

| Document | Contents |
|---|---|
| `module-manifest.yaml` | activation identity, capabilities, contracts and privacy |
| `100-module-architecture.md` | boundaries, components, ownership and runtime flows |
| `101-functional-capabilities.md` | functional scope derived from the site specification |
| `102-domain-model-and-events.md` | aggregates, identities, Event catalog and correction rules |
| `103-progression-and-mastery.md` | Level 1-100 binding and exact fencing mastery mathematics |
| `104-content-pack.md` | starter quests, achievements, Items, Rewards, skins, Talents and Season |
| `105-integrations-and-data.md` | providers, privacy, analytics, migration and reconciliation |
| `106-delivery-roadmap-and-acceptance.md` | MVP phases, release gates and end-to-end scenarios |
| `107-excel-migration-notes.md` | findings from the two current workbooks and migration mapping |

------------------------------------------------------------------------

# Suggested Repository Placement

```text
modules/fencing-school/
├── README.md
├── module-manifest.yaml
├── 100-module-architecture.md
├── 101-functional-capabilities.md
├── 102-domain-model-and-events.md
├── 103-progression-and-mastery.md
├── 104-content-pack.md
├── 105-integrations-and-data.md
├── 106-delivery-roadmap-and-acceptance.md
└── 107-excel-migration-notes.md
```

------------------------------------------------------------------------

# Definition of Ready for Implementation

- school legal entity, tenant ID and production domains are confirmed;
- guardian and age policy is approved;
- halls, groups, trainers, tariffs and memberships have stable IDs;
- exercise codes and equipment measurement rules are validated by coaches;
- source workbook owners approve the migration cut-off;
- payment, fiscal receipt, SMS and Telegram providers are selected;
- every Event schema and content Definition is assigned an owner;
- MVP content is reviewed for safety, fairness and minors privacy.

