---
document: school-fencing-delivery-roadmap
title: Fencing School Delivery Roadmap and Acceptance
owner: School Product Team
status: Proposed
version: 1.0.0
last_updated: 2026-07-18
depends_on:
  - school-fencing-functional-capabilities
  - school-fencing-content-pack
  - school-fencing-integrations-data
---

# Delivery Roadmap and Acceptance

## Delivery Strategy

Build one vertical slice from a real school fact to a visible Character outcome
before expanding the content catalog:

```text
Schedule → Attendance → Reward → Experience → Level → Cabinet receipt
```

In parallel, build the independent training-to-Mastery slice:

```text
Training Record → Mastery ledger → Decay/Rank → Achievement → Cabinet
```

This proves the Module boundary and the existing Engine protocols.

------------------------------------------------------------------------

# Stage 0: Foundation

## Scope

- approve Module Manifest identity, tenant and owners;
- establish school Person, student, guardian and Character association;
- create canonical hall, group, session, weapon, exercise and equipment IDs;
- implement command, audit, inbox and outbox infrastructure;
- publish Event schemas and consumer contracts;
- prepare standard Level Track binding;
- create spreadsheet import staging and dry-run reports;
- approve privacy, minors, retention and guardian policy;
- establish CI gates for JSON, YAML, content dependencies and Event catalogs.

## Exit Criteria

- one test Character is associated with one staged student;
- duplicate and fingerprint-conflict tests pass;
- one synthetic attendance fact reaches a sandbox Reward and Progression result;
- one synthetic Training Record produces deterministic Mastery units;
- no unresolved owner, schema or tenant remains except production provider
  credentials.

------------------------------------------------------------------------

# MVP

## Operational Scope

- mobile-first public site and direction landing pages;
- live group schedule and capacity;
- trial booking and optional trial payment;
- membership purchase, proration, family allocation and unified payment ledger;
- basic CRM funnel and tasks;
- unified hall calendar with manual rental bookings;
- SMS/Telegram confirmations and reminders;
- student cabinet;
- mobile coach attendance;
- baseline reports: active students, revenue, average receipt and funnel.

## Game Scope

- standard primary Level 1-100;
- attendance and onboarding Reward policies;
- eight weapon Mastery tracks;
- structured Training Record and Equipment Specification;
- daily decay and Rank 0-10;
- onboarding campaign;
- five training-day and seven weekly Quest Definitions;
- foundational, attendance and weapon Rank Achievements;
- starter avatars, frames, banners, titles and seals;
- private progression history and correction explanations;
- content release bundle with kill switches.

## MVP Exit Criteria

- the first student can buy a membership without administrator intervention;
- all monthly payments appear in one reconciled registry;
- a coach can confirm attendance in two primary interactions;
- one attendance produces exactly one eligible XP grant;
- a duplicate attendance Event produces no second effect;
- an exercise record matches the integer calculation test vectors;
- six inactive dates create exactly six decay entries;
- Rank floor prevents further decay below an earned threshold;
- a correction produces compensating Mastery and Reward review;
- a minor's progression and Inventory are private by default;
- source-to-import totals have an approved difference report.

------------------------------------------------------------------------

# Phase 2

## Operational Scope

- public hall rental with online payment;
- certificates, event tickets and package quotes;
- recurring membership payment;
- coach cabinet with compensation projection;
- CRM triggers, segments and campaigns;
- UTM-to-revenue analytics;
- Telegram booking flow;
- iCal/Google calendar export.

## Game Scope

- academic Season and Eight Paths campaign;
- full monthly Quest catalog;
- Discipline of the Hall Talent tree;
- manuscript collection;
- seasonal cosmetic sets;
- event participation content;
- guardian-aware progression settings;
- content simulation dashboard.

## Exit Criteria

- the first rental is booked and paid without a call;
- no booking can overlap a blocking hall reservation;
- “trial attended but not purchased” automation is active;
- a Season activates only with acknowledged content bindings;
- all new Talent effects resolve to registered contracts;
- Level pacing for three attendance cohorts remains within approved bands.

------------------------------------------------------------------------

# Phase 3

## Operational Scope

- renter cabinet and recurring slots;
- waitlist offers;
- cohort and churn analytics;
- hall-utilization heat map;
- A/B-tested landing offers;
- call tracking;
- access-control integration;
- advanced export and owner dashboards.

## Game Scope

- advanced collection views;
- master-rank review workflow;
- event Editions and limited collectibles;
- optional public-safe adult leaderboards by consent;
- cross-module Character composition when a second Context Module exists.

## Exit Criteria

- non-prime revenue is independently visible;
- access entitlement follows booking lifecycle and revokes on cancellation;
- waitlist capacity claim is atomic;
- no minor appears in public ranking;
- cross-module composition does not duplicate Character or Level state.

------------------------------------------------------------------------

# End-to-End Acceptance Scenarios

## A1. Advertising to active student

A guest enters from a tagged campaign, books a trial, receives confirmation,
attends, buys a membership, receives a fiscal receipt and becomes active.

Expected:

- CRM keeps the source and funnel transitions;
- payment and receipt reconcile;
- attendance is confirmed once;
- Reward grants the configured primary XP;
- Character cabinet shows the receipt with source explanation;
- reports include active student and attributed revenue;
- no contact or payment data enters platform game Events.

## A2. Night hall rental

A producer selects 01:00-04:00, pays and receives confirmation.

Expected:

- reservation conflict is checked transactionally;
- payment and receipt settle;
- the hall calendar blocks the interval;
- no group can be scheduled over it;
- non-prime revenue report updates;
- no default primary XP is granted for spending.

## A3. Multi-group offer

An existing student accepts an eligible second-group offer.

Expected:

- Commerce computes the configured discount;
- membership line allocation remains explicit;
- schedule capacity is checked;
- analytics updates average receipt and multi-group share;
- any game content is driven by participation, not purchase amount.

## A4. Membership renewal and churn risk

A membership approaches expiry, reminder is sent, recurring payment is
attempted, and a failed payment remains unresolved for the policy period.

Expected:

- Commerce records each attempt;
- CRM enters at-risk status through a committed fact;
- administrator task is created;
- existing Character and earned progression remain intact;
- no negative XP or public penalty occurs.

## A5. Group cancellation

An administrator cancels a session.

Expected:

- schedule revision commits;
- affected bookings are cancelled or moved by policy;
- group notifications are queued;
- hall occupancy is released;
- attendance cannot be confirmed for the cancelled occurrence;
- active Quests receive explicit expiry or replacement behavior.

## A6. Attendance to Level

A coach confirms one eligible attendance and the Event is delivered twice.

Expected:

- one Reward Grant and one Progression ledger effect;
- Experience rises by the configured amount;
- Level changes only if a standard threshold is crossed;
- the duplicate is acknowledged without a second effect;
- the cabinet shows one receipt.

## A7. Paired-weapon training

A confirmed sword-and-shield entry contains valid sets, actions and two
Equipment Specifications.

Expected:

- total mass is the component sum;
- integer units are conserved;
- 75% reaches `spada_e_scudo`;
- 25% reaches `spada_a_una_mano`;
- a monthly bonus affects only the selected final track;
- raw load remains private.

## A8. Weekly decay and floor

A track receives positive units on Monday, no units Tuesday through Sunday,
and has already earned Rank 1.

Expected:

- six unique decay timer operations;
- total displayed loss is 60 points unless the floor is reached;
- current points never fall below 2,000;
- primary Experience does not change.

## A9. Historical correction

A coach corrects equipment mass after a Reward and Rank transition.

Expected:

- original Training Record and Events remain;
- signed compensating Mastery entries are appended;
- decay is replayed from the affected date;
- Rank enters integrity review if necessary;
- Reward reversal uses the owner protocol;
- the student sees a safe explanation.

## A10. Monthly d8 retry

A student completes a monthly roll and the command is retried.

Expected:

- one Bonus Roll aggregate and one outcome;
- no reroll;
- the same weapon remains selected for the month;
- bonus applies only to later eligible positive allocations.

## A11. Minor and guardian

A guardian manages a child's booking and payment.

Expected:

- the guardian can access only granted dependant scopes;
- coach notes and social presentation follow separate policy;
- the Character is private;
- no public leaderboard entry exists;
- payment allocation identifies the student without transferring Character
  ownership to the payer.

## A12. Spreadsheet migration

The same source workbook is imported twice.

Expected:

- source hash and logical-row identities deduplicate the second import;
- ambiguous students remain staged;
- aliases map to canonical weapon keys;
- floating values are converted to integer units with an explained difference;
- totals reconcile before approval;
- import provenance is visible in private history.

------------------------------------------------------------------------

# Release Gates

## Architecture

- single writers and schema boundaries verified;
- no Engine depends on school code;
- all cross-boundary mutation is typed and asynchronous;
- all root facts use transactional outbox.

## Content

- one immutable bundle pins all Definitions;
- global dependency graph is acyclic;
- every Reward Component has a live owner;
- unsupported Item or Talent capability blocks activation;
- milestone Rewards cannot recursively grant XP.

## Quality

- canonical JSON examples parse;
- YAML Manifest parses;
- duplicate, retry, replay, late arrival, correction and reversal tests pass;
- booking concurrency test proves no double booking;
- formula tests prove no float is used authoritatively;
- restore and reconciliation drills pass.

## Privacy and Safety

- guardian, minor, coach, renter, administrator and owner access tests pass;
- restricted data is absent from general Events and logs;
- public progression is opt-in where permitted;
- quests and achievements pass coach safety review;
- payment, medical and payroll data never scale game progression.

------------------------------------------------------------------------

# Product Metrics for the Pilot

Measure without turning every metric into a target:

- trial-to-attendance and trial-to-membership conversion;
- no-show rate before and after reminders;
- active students and renewal;
- attendance recording completeness;
- percent of eligible attendance producing one terminal Reward result;
- Quest participation and completion by cohort;
- progression pacing by weekly attendance frequency;
- Mastery correction and timer-backfill rate;
- content opt-out and notification suppression;
- student/guardian support requests about calculations;
- hall utilization and non-prime revenue.

A successful pilot proves correctness, trust and operational adoption before
maximizing engagement.

