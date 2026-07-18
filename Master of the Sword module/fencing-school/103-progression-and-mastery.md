---
document: school-fencing-progression-mastery
title: Fencing School Progression and Weapon Mastery
owner: School Product Team
status: Proposed
version: 1.0.0
last_updated: 2026-07-18
depends_on:
  - 004a-standard-level-profile
  - school-fencing-domain-model-events
---

# Progression and Weapon Mastery

## Two Independent Systems

| System | Owner | Range | Can decrease? | Purpose |
|---|---|---:|---:|---|
| Primary Character Level | Progression Engine | 1-100 | no in normal play | lifelong cross-domain identity |
| Weapon Mastery Rank | School Mastery capability | 0-10 per weapon | points may decay to earned rank floor | school method and technical focus |

They are deliberately not summed, synchronized, or stored in each other's
ledger.

------------------------------------------------------------------------

# Primary Level 1-100

The school binds primary progression to
`platform.standard.100.v1`.

The Progression Engine derives Level only from the explicit thresholds in
`004a-standard-level-profile`. The school publishes trustworthy facts; Reward
Engine maps those facts to Experience.

## Starter Experience Policy

These are versioned Reward policies, not Engine constants.

| Fact | Base Experience | Eligibility and cap |
|---|---:|---|
| first completed profile and association | 300 | once |
| trial attendance confirmed | 300 | once per Character |
| regular training attendance | 500 | one grant per completed scheduled session |
| first training record confirmed | 300 | once |
| weekly consistency quest | 300 | once per week |
| curriculum quest | 200-800 | Definition-specific |
| school event participation | 500 | one per registered event |
| standard Achievement | 250-1,000 | once |
| major mastery or long-term Achievement | 1,500-5,000 | once per tier |
| Level milestone Reward | Item or cosmetic preferred | no Experience loop |

Default training Experience cap is 1,500 per local day. The cap is evaluated by
Reward policy before fulfillment.

## Attendance Eligibility

A regular-attendance Reward requires:

- active Character association at the effective time or an approved late-link
  policy;
- completed school Session;
- attendance status `PRESENT`;
- coach or authorized administrator confirmation;
- no superseding correction or void;
- unique `attendanceRecordId/revision`;
- no duplicate Reward binding for the same session and Character.

Payment amount, equipment weight, raw action count and coach payroll never
multiply primary Experience.

## Pacing Checkpoints

With only 500 Experience per eligible session and no other Rewards:

| Target | Cumulative Experience | Sessions |
|---|---:|---:|
| Level 2 | 600 | 2 |
| Level 5 | 3,000 | 6 |
| Level 10 | 9,000 | 18 |
| Level 25 | 42,000 | 84 |
| Level 50 | 147,000 | 294 |
| Level 75 | 314,500 | 629 |
| Level 100 | 544,500 | 1,089 |

Quests and Achievements shorten this path. The first production cohort should be
simulated at one, two and three sessions per week before content activation.

------------------------------------------------------------------------

# Weapon Mastery Inputs

A confirmed exercise entry has integer inputs:

| Input | Unit |
|---|---|
| right-side sets | count |
| left-side sets | count |
| actions per set | count |
| verified equipment mass | grams |
| weapon configuration | canonical stable key |
| monthly bonus | exact 0% or 10% ratio |
| curriculum and equipment version | immutable IDs |

No client supplies calculated points.

## Action Count

```text
actionCount = (rightSideSets + leftSideSets) × actionsPerSet
```

All operands are non-negative integers and are bounded by curriculum safety
policy.

## Integer Mastery Unit

The spreadsheet formula is preserved exactly without authoritative
floating-point arithmetic:

```text
displayedMasteryPoints = actionCount × massInKilograms ÷ 10
masteryUnits = actionCount × massInGrams
displayedMasteryPoints = masteryUnits ÷ 10,000
```

`masteryUnits` is the ledger unit. Ten thousand units equal one displayed
Mastery Point.

Example:

```text
actionCount = 1,000
mass = 1,250 grams
masteryUnits = 1,250,000
displayedMasteryPoints = 125
```

The UI may display up to two decimals, but the ledger never stores a float.

------------------------------------------------------------------------

# Equipment Classification

An Equipment Specification records:

- measured mass in grams;
- measured overall length in millimeters;
- component type and configuration;
- resolved weapon key;
- verifier and verification time;
- policy version;
- bounded classification reason.

Default guidance from the current school method:

- a longsword is two-handed, up to 1,400 mm and up to 2,000 g;
- a two-handed sword is two-handed, at least 1,400 mm or over 2,000 g;
- ambiguous combinations are resolved by a coach and persisted in the Equipment
  Specification rather than recalculated for every training record;
- paired configurations use total measured mass of all components.

The coach decision is versioned. Historical Training Records keep the Equipment
Specification version used at the time.

------------------------------------------------------------------------

# Paired-Weapon Allocation

The following configurations allocate 75% to the paired track and 25% to its
base-weapon track:

| Configuration | 75% track | 25% track |
|---|---|---|
| `due_spade` | `due_spade` | `spada_a_una_mano` |
| `spada_e_scudo` | `spada_e_scudo` | `spada_a_una_mano` |
| `spiedo_e_scudo` | `spiedo_e_scudo` | `spiedo_e_partesana` |

Deterministic conservation rule:

```text
pairedUnits = floor(totalUnits × 75 ÷ 100)
baseUnits = totalUnits - pairedUnits
```

The remainder always goes to the base track, so allocation never creates or
loses units.

Other configurations allocate 100% to their own track.

------------------------------------------------------------------------

# Monthly d8 Bonus

Once per calendar month, a Character may receive one result from 1 through 8,
mapped in canonical weapon order:

| d8 | weaponKey |
|---:|---|
| 1 | `spada_a_una_mano` |
| 2 | `due_spade` |
| 3 | `spada_e_scudo` |
| 4 | `spada_a_due_mani` |
| 5 | `spadone` |
| 6 | `ascia_e_alabarda` |
| 7 | `spiedo_e_partesana` |
| 8 | `spiedo_e_scudo` |

The Bonus Roll aggregate is unique by
`masteryAccountId/yearMonth/policyVersion`.

Allowed sources:

- server-generated auditable random result;
- coach-confirmed physical roll with actor and time.

Reroll is prohibited unless an approved correction voids the original roll.

The 10% bonus applies after paired allocation and only to positive units
allocated to the selected track:

```text
bonusUnits = floor(selectedTrackBaseUnits × 10 ÷ 100)
finalSelectedTrackUnits = selectedTrackBaseUnits + bonusUnits
```

The Bonus does not multiply decay, corrections, imports, or primary Experience.

------------------------------------------------------------------------

# Daily Decay

The current `−10` rule becomes a persisted, replayable policy.

## Policy v1

- time zone: `Europe/Moscow`;
- logical day boundary: 03:00 local time;
- decay amount: 100,000 mastery units, displayed as 10 points;
- a track opens after its first positive allocation;
- an open track decays for a closed local date with no positive allocation to
  that track;
- a track does not decay on a date where it received positive training units;
- decay never crosses the floor of the highest earned Rank;
- formal membership freeze pauses decay when
  `pauseOnMembershipFreeze=true`;
- missed timer execution is backfilled by logical date;
- daylight-saving and clock changes use local-date identities, not elapsed
  24-hour arithmetic.

This reproduces the source example: one weekly training day followed by six
days without that weapon loses 60 displayed points before the next equivalent
training date.

## Timer Identity

```text
masteryTrackId / localDate / decayPolicyVersion
```

Retrying the same timer creates no second decay.

------------------------------------------------------------------------

# Mastery Rank Thresholds

| Rank | Displayed points | Mastery units |
|---:|---:|---:|
| 0 | 0 | 0 |
| 1 | 2,000 | 20,000,000 |
| 2 | 6,000 | 60,000,000 |
| 3 | 12,000 | 120,000,000 |
| 4 | 20,000 | 200,000,000 |
| 5 | 30,000 | 300,000,000 |
| 6 | 42,000 | 420,000,000 |
| 7 | 56,000 | 560,000,000 |
| 8 | 72,000 | 720,000,000 |
| 9 | 90,000 | 900,000,000 |
| 10 | 110,000 | 1,100,000,000 |

The highest earned Rank is permanent unless an approved historical correction
proves that the transition itself was invalid.

```text
rankFloorUnits = threshold(highestEarnedRank)
nextUnits = max(rankFloorUnits, currentUnits + signedLedgerDelta)
```

Routine decay can reduce current points but not the highest earned Rank.
Corrections may produce a review state if they would invalidate a Rank Reward
already fulfilled.

------------------------------------------------------------------------

# Calculation Order

For a confirmed Training Record:

1. resolve immutable curriculum and equipment versions;
2. validate sets, actions and mass bounds;
3. compute integer `actionCount`;
4. compute `masteryUnits`;
5. allocate paired configuration 75/25 when applicable;
6. apply the monthly 10% bonus to the selected positive allocation;
7. append one ledger entry per affected track;
8. derive current points and Rank;
9. persist transitions and outbox atomically;
10. publish private points facts and safe Rank facts.

Changing this order requires a new policy version and migration plan.

------------------------------------------------------------------------

# Correction and Replay

A Training Record correction never edits Mastery state directly.

The Mastery capability:

1. finds the exact prior allocation ledger entries;
2. computes the new allocation using the pinned policy versions;
3. appends signed compensating entries;
4. replays daily decay and floors from the earliest affected local date;
5. emits points and Rank correction facts;
6. requests Reward review when a platform outcome depended on the old fact.

A replay produces the same final ledger hash, current units and Rank.

------------------------------------------------------------------------

# Safety and Fairness

- curriculum bounds reject implausible actions, mass and duration;
- suspicious volume goes to coach review, not automatic punishment;
- raw physical load is private and is not a public leaderboard metric;
- heavier equipment does not increase primary Character Experience;
- quests cannot require exceeding the approved training plan;
- minors do not receive public physical-performance comparisons by default;
- medical freeze evidence remains outside Mastery payloads;
- a coach correction is transparent to the student through a safe explanation.

------------------------------------------------------------------------

# Required Test Vectors

1. 1,000 actions with 1,250 g produces 1,250,000 units and 125 points.
2. 1,000 actions with 1,750 g produces 1,750,000 units and 175 points.
3. 1,000,003 units in a paired configuration yields 750,002 paired and 250,001
   base units.
4. A 10% bonus on 750,002 units adds 75,000 units.
5. Six no-training dates apply exactly 600,000 decay units.
6. Decay from 20,050,000 units at Rank 1 stops at 20,000,000.
7. Duplicate Training Record Event applies once.
8. A corrected mass produces only the signed difference.
9. A late record deterministically replays intervening decay.
10. Primary Experience remains unchanged by Mastery decay.

