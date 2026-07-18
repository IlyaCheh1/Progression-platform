---
document: school-fencing-excel-migration-notes
title: Fencing School Excel Findings and Migration Notes
owner: School Data Migration
status: Proposed
version: 1.0.0
last_updated: 2026-07-18
depends_on:
  - school-fencing-progression-mastery
  - school-fencing-integrations-data
---

# Excel Findings and Migration Notes

## Purpose

Document what the two supplied workbooks reveal about the current process and
define a safe path into the Module.

The workbooks remain source evidence. They are not converted into production
database schemas.

------------------------------------------------------------------------

# Workbook 1: Individual March Training Calculation

Observed structure:

- 31 worksheets, one for each day of a month;
- each worksheet uses `A1:AB38`;
- eight weapon sections arranged as four upper and four lower blocks;
- repeated exercise-entry columns: exercise, actions per round, modifier,
  right, left, actions and experience;
- approximately 195 formulas on a normal day, with a few day-specific
  additions;
- separate rows for four 10% bonus inputs;
- sheet totals for actions and calculated points.

The core formulas are consistent with the descriptive rules:

```text
actions = (right + left) × actionsPerRound
points = actions × weightModifier ÷ 10
```

Paired sword tracks allocate 75% to the paired category and 25% to the
one-handed sword. Spear-and-shield uses the equivalent paired/base allocation.

## Useful evidence

- exercise codes already exist and should become stable catalog keys;
- mass is treated as the scoring modifier;
- right and left sets are separate inputs;
- paired allocation is implemented after line totals;
- monthly bonus is tracked per weapon;
- all eight tracks are represented.

## Problems to remove

- a worksheet name is not a durable training date or record ID;
- formulas and editable inputs share the same surface;
- weights use floating-point display values;
- special formulas differ on some days without versioned policy;
- no actor, confirmation, correction reason or revision exists;
- no idempotency identity prevents repeated entry or import;
- the workbook cannot prove which curriculum or equipment version was used;
- manual bonus cells can be changed without an audit trail.

------------------------------------------------------------------------

# Workbook 2: School-Wide Mastery Ledger

Observed structure:

| Worksheet | Used range |
|---|---|
| January | `A1:AH798` |
| February | `A1:AH798` |
| March | `A1:AH861` |
| April | `A1:AH903` |
| May | `A1:AH901` |
| June | `A1:AH1861` |
| July | `A1:AH945` |
| August | `A1:AH861` |

The workbook contains eight monthly worksheets. Student blocks repeat the
eight weapon tracks, daily columns and final totals. Most formulas sum a row or
the eight weapon totals for a student. Daily `−10` values are predominantly
literal cells rather than generated, idempotent operations.

Observed literal `−10` cell counts range from 1,270 to 2,250 in populated
months; August contains none in the supplied state. This confirms that decay is
a manual data-entry process, not a reliable timer.

## Useful evidence

- the school expects a daily per-weapon timeline;
- points and a second raw total are retained per weapon;
- Rank floors are applied conceptually across months;
- students may train several weapons;
- month-end totals feed later periods.

## Problems to remove

- student names are business keys;
- no stable student, Character, training, equipment or policy IDs exist;
- daily decay is typed manually and can be skipped or duplicated;
- formula coverage differs by sheet;
- floating-point artifacts are visible, for example long binary-decimal tails;
- opening balance, daily delta, raw load and current balance are not separate
  ledger concepts;
- Rank floors are not enforced by an authoritative invariant;
- late training and corrections cannot be replayed deterministically;
- there is no source-event link or audit actor;
- weapon labels differ between narrative and sheets;
- blank, zero and “not applicable” are not consistently distinguished;
- a copied block can silently inherit incorrect formulas.

No obvious formula-error tokens were found in inspected ranges, but that does
not make the model auditable or replayable.

------------------------------------------------------------------------

# Canonical Mapping

| Workbook concept | Module concept |
|---|---|
| sheet/day | `TrainingRecord.occurredAt` |
| student name | staged identity match to `studentId` |
| exercise code | versioned Exercise Catalog key |
| weight modifier | Equipment Specification mass in grams |
| right/left | integer side-set counts |
| actions per round | integer actions per set |
| calculated actions | derived `actionCount` |
| calculated experience | derived integer `masteryUnits` |
| weapon heading | canonical `weaponKey` |
| 10% bonus row | Monthly Bonus Roll plus derived bonus allocation |
| daily `−10` | persisted decay timer ledger entry |
| total | Mastery projection, never imported as an editable formula |
| level threshold | Mastery Rank Definition |
| month opening value | legacy snapshot or prior ledger projection |

Legacy labels map only in the import adapter. The production catalog uses the
canonical keys from `102-domain-model-and-events`.

------------------------------------------------------------------------

# Recommended Migration Strategy

## Snapshot Cutover

Recommended for the pilot:

1. choose a final trustworthy cut-off date;
2. hash and archive every source workbook;
3. stage students and resolve each to a stable `studentId`;
4. select the last approved current balance per weapon;
5. derive the highest earned Rank from approved historical evidence;
6. import one `LEGACY_SNAPSHOT` ledger entry per student and weapon;
7. pin the migration policy and source hash;
8. reconcile totals and Rank floors;
9. activate automated decay from the next logical school date;
10. disable workbook writes after parallel verification.

This avoids manufacturing false daily audit history from manually typed cells.

Historical snapshots do not automatically grant primary XP, Quests,
Achievements or seasonal content. A separately approved recognition migration
may grant existing Rank seals without creating an engagement spike.

## Full Historical Replay

Use only when the school needs detailed history and can supply reliable raw
exercise records.

Requirements:

- resolve every exercise code and equipment mass;
- identify each training date, student and coach evidence;
- distinguish training allocations from manual corrections;
- reconstruct monthly bonus rolls;
- reproduce decay by logical date;
- explain every difference before commit.

A full replay is substantially higher risk and should not block the MVP.

------------------------------------------------------------------------

# Numeric Conversion

Preferred order:

1. recompute `masteryUnits` from integer action count and mass in grams;
2. if raw inputs are absent, parse displayed decimal points with decimal
   arithmetic and convert to units;
3. never use binary float as authoritative import arithmetic;
4. report source value, converted units, displayed converted value and
   difference;
5. reject NaN, infinity, negative raw load and values outside approved bounds.

For an aggregate displayed value:

```text
masteryUnits = roundHalfUp(decimalPoints × 10,000)
```

The import policy must state the rounding mode. Production training calculation
does not need rounding because it starts from integer gram-actions.

------------------------------------------------------------------------

# Import Staging Tables

Minimum staging records:

- `import_batch`: source hash, filename, operator, status and cut-off;
- `import_sheet`: workbook sheet identity and detected period;
- `import_student_match`: source label, candidate IDs, decision and reviewer;
- `import_training_entry`: parsed raw entry and validation results;
- `import_mastery_snapshot`: student, weapon, current units and Rank floor;
- `import_difference`: expected, converted, accepted and reason category;
- `import_commit_operation`: target owner command and terminal result.

Staging data is never queried by runtime cabinets.

------------------------------------------------------------------------

# Validation Rules

Reject or queue for review when:

- a student match is ambiguous;
- a weapon alias is unknown;
- dates overlap the cut-over boundary;
- current points are below the claimed Rank floor;
- negative values are not recognized decay or correction;
- raw actions or mass exceed curriculum bounds;
- a monthly bonus appears for several weapons without an explained correction;
- the same logical row occurs in two source files;
- totals do not reconcile within the approved exact-unit rule;
- source formulas reference missing or unexpected cells.

------------------------------------------------------------------------

# Cutover Runbook

1. announce the final workbook write window;
2. export and hash source files;
3. run staging in dry-run mode;
4. review identity and numeric differences;
5. approve the snapshot and policy version;
6. pause Mastery decay timers;
7. commit import commands idempotently;
8. reconcile per student, weapon and total;
9. enable automated timers and Module writes;
10. run parallel read-only comparison for an agreed period;
11. mark workbooks archived;
12. retain rollback as compensating owner commands, not database restore of
    unrelated state.

------------------------------------------------------------------------

# Migration Acceptance Criteria

- re-importing the same files has zero new effect;
- every accepted snapshot has source hash and reviewer;
- every student match is stable and tenant-scoped;
- all weapon labels resolve canonically;
- no authoritative float remains;
- current units respect Rank floors;
- imported totals equal approved staged totals exactly;
- decay starts once at the cut-over boundary;
- historical import creates no unapproved primary XP;
- all ambiguities and differences are downloadable for review;
- source workbooks remain available as immutable evidence according to policy.

