---
document: 004a-standard-level-profile
title: Platform Standard Level Profile
owner: Platform Team
status: Proposed
version: 1.0.0
last_updated: 2026-07-18
depends_on:
  - 004-progression-engine
---

# Platform Standard Level Profile

## Purpose

Define the reusable primary Character progression profile for all Context
Modules. The profile provides one understandable Level scale from 1 through
100 while leaving domain mastery, certification, rank, attendance, reputation,
and commercial status to their proper owners.

This document is normative content for the Progression Engine Track Definition
`platform.standard.100.v1`.

------------------------------------------------------------------------

# Contract

| Field | Value |
|---|---|
| Track key | `platform.standard.100` |
| Definition version | `1` |
| Minimum Level | `1` |
| Maximum Level | `100` |
| Experience at Level 1 | `0` |
| Prestige | disabled |
| Cap policy | `clamp` |
| Experience unit | signed 64-bit integer; positive Rewards only in normal play |
| Runtime calculation | explicit cumulative thresholds below |

A Context Module MUST NOT change these thresholds in place. A new curve is a
new Track Definition and requires an ADR and migration plan.

------------------------------------------------------------------------

# Authoring Formula

The formula exists only to generate and verify the published table:

```text
threshold(1) = 0
threshold(L) = 50 × (L - 1) × (L + 10), for 2 ≤ L ≤ 100
delta(L → L + 1) = 100 × (L + 5)
```

The resulting curve grows linearly per Level and quadratically in cumulative
Experience. It gives fast early feedback, predictable mid-game pacing, and a
long-lived upper progression range without exponential runaway.

Runtime services MUST NOT evaluate the formula. They use the materialized
thresholds and immutable Definition content hash.

------------------------------------------------------------------------

# Materialized Thresholds

`minimumExperience` is the cumulative Experience required to occupy the
Level. `experienceToNextAtFloor` is informational and equals the delta from
the current Level floor to the next floor.

| Level | minimumExperience | experienceToNextAtFloor |
|---:|---:|---:|
| 1 | 0 | 600 |
| 2 | 600 | 700 |
| 3 | 1300 | 800 |
| 4 | 2100 | 900 |
| 5 | 3000 | 1000 |
| 6 | 4000 | 1100 |
| 7 | 5100 | 1200 |
| 8 | 6300 | 1300 |
| 9 | 7600 | 1400 |
| 10 | 9000 | 1500 |
| 11 | 10500 | 1600 |
| 12 | 12100 | 1700 |
| 13 | 13800 | 1800 |
| 14 | 15600 | 1900 |
| 15 | 17500 | 2000 |
| 16 | 19500 | 2100 |
| 17 | 21600 | 2200 |
| 18 | 23800 | 2300 |
| 19 | 26100 | 2400 |
| 20 | 28500 | 2500 |
| 21 | 31000 | 2600 |
| 22 | 33600 | 2700 |
| 23 | 36300 | 2800 |
| 24 | 39100 | 2900 |
| 25 | 42000 | 3000 |
| 26 | 45000 | 3100 |
| 27 | 48100 | 3200 |
| 28 | 51300 | 3300 |
| 29 | 54600 | 3400 |
| 30 | 58000 | 3500 |
| 31 | 61500 | 3600 |
| 32 | 65100 | 3700 |
| 33 | 68800 | 3800 |
| 34 | 72600 | 3900 |
| 35 | 76500 | 4000 |
| 36 | 80500 | 4100 |
| 37 | 84600 | 4200 |
| 38 | 88800 | 4300 |
| 39 | 93100 | 4400 |
| 40 | 97500 | 4500 |
| 41 | 102000 | 4600 |
| 42 | 106600 | 4700 |
| 43 | 111300 | 4800 |
| 44 | 116100 | 4900 |
| 45 | 121000 | 5000 |
| 46 | 126000 | 5100 |
| 47 | 131100 | 5200 |
| 48 | 136300 | 5300 |
| 49 | 141600 | 5400 |
| 50 | 147000 | 5500 |
| 51 | 152500 | 5600 |
| 52 | 158100 | 5700 |
| 53 | 163800 | 5800 |
| 54 | 169600 | 5900 |
| 55 | 175500 | 6000 |
| 56 | 181500 | 6100 |
| 57 | 187600 | 6200 |
| 58 | 193800 | 6300 |
| 59 | 200100 | 6400 |
| 60 | 206500 | 6500 |
| 61 | 213000 | 6600 |
| 62 | 219600 | 6700 |
| 63 | 226300 | 6800 |
| 64 | 233100 | 6900 |
| 65 | 240000 | 7000 |
| 66 | 247000 | 7100 |
| 67 | 254100 | 7200 |
| 68 | 261300 | 7300 |
| 69 | 268600 | 7400 |
| 70 | 276000 | 7500 |
| 71 | 283500 | 7600 |
| 72 | 291100 | 7700 |
| 73 | 298800 | 7800 |
| 74 | 306600 | 7900 |
| 75 | 314500 | 8000 |
| 76 | 322500 | 8100 |
| 77 | 330600 | 8200 |
| 78 | 338800 | 8300 |
| 79 | 347100 | 8400 |
| 80 | 355500 | 8500 |
| 81 | 364000 | 8600 |
| 82 | 372600 | 8700 |
| 83 | 381300 | 8800 |
| 84 | 390100 | 8900 |
| 85 | 399000 | 9000 |
| 86 | 408000 | 9100 |
| 87 | 417100 | 9200 |
| 88 | 426300 | 9300 |
| 89 | 435600 | 9400 |
| 90 | 445000 | 9500 |
| 91 | 454500 | 9600 |
| 92 | 464100 | 9700 |
| 93 | 473800 | 9800 |
| 94 | 483600 | 9900 |
| 95 | 493500 | 10000 |
| 96 | 503500 | 10100 |
| 97 | 513600 | 10200 |
| 98 | 523800 | 10300 |
| 99 | 534100 | 10400 |
| 100 | 544500 | — |

------------------------------------------------------------------------

# Module Binding Rules

1. Every Experience Reward Component names a target Track.
2. A Context Module SHOULD use `platform.standard.100` for its primary
   Character Level.
3. The same Character may participate in many Modules without receiving a new
   identity or having Levels arithmetically combined.
4. A Module MAY publish a separate standard-curve Track only when the product
   deliberately needs a visible module-specific Level. That Track has its own
   stable key and ledger but MUST reuse this exact threshold table if it claims
   standard-profile compatibility.
5. Domain mastery with decay or rank floors is not standard Experience.
6. Payment amount, medical information, physical load, and unsafe repetition
   volume MUST NOT directly scale primary Character Experience.
7. Reward policy may cap, deduplicate, reverse, or correct a grant before the
   Progression Engine applies it.

------------------------------------------------------------------------

# Presentation Milestones

The profile reserves no mandatory Rewards, but products SHOULD author meaningful
milestones at Levels `5`, `10`, `15`, `20`, `25`, `30`, `40`,
`50`, `60`, `75`, `90`, and `100`.

Milestones are configured through Reward, Achievement, Item, Inventory,
Character presentation, and Talent content. They are not hard-coded in the
Progression Engine.

------------------------------------------------------------------------

# Deterministic Test Vectors

| Experience | Expected Level | Into Level | To Next |
|---:|---:|---:|---:|
| 0 | 1 | 0 | 600 |
| 599 | 1 | 599 | 1 |
| 600 | 2 | 0 | 700 |
| 8,999 | 9 | 1,399 | 1 |
| 9,000 | 10 | 0 | 1,500 |
| 42,000 | 25 | 0 | 3,000 |
| 147,000 | 50 | 0 | 5,500 |
| 314,500 | 75 | 0 | 8,000 |
| 544,499 | 99 | 10,399 | 1 |
| 544,500 | 100 | 0 | null |
| 600,000 under clamp | 100 | 0 | null |

------------------------------------------------------------------------

# Acceptance Criteria

- Exactly 100 sequential threshold rows exist.
- Level 1 threshold is 0.
- Thresholds are strictly increasing after Level 1.
- Every threshold and delta is an integer.
- Level 100 threshold is 544,500.
- Runtime and simulation produce the test vectors above.
- Duplicate Reward delivery creates one logical Experience effect.
- A grant above cap clamps without creating Level 101.
- Routine Module Events cannot submit negative standard Experience.
