---
document: 011-season-engine
title: Season Engine
owner: Platform Team
status: Proposed
version: 1.1.0
last_updated: 2026-07-18
depends_on:
  - 000-product-philosophy
  - 001-domain-definition
  - 002-platform-architecture
  - 002a-platform-contract-standard
  - 002b-cross-engine-integration
  - 003-character-engine
  - 004-progression-engine
  - 005-reward-engine
  - 006-achievement-engine
  - 007-quest-engine
  - 008-talent-engine
  - 009-item-engine
  - 010-inventory-engine
related_documents:
  - liveops-engine
  - notification-engine
  - reputation-engine
  - leaderboard-engine
  - currency-engine
---

# Season Engine

> **Platform contract conformance:** all Event names, envelopes, binding
> acknowledgements, and lifecycle facts MUST conform to
> `002a-platform-contract-standard` and `002b-cross-engine-integration`.

## Executive Summary

The Season Engine is the authoritative platform component for defining, scheduling, activating, pausing, closing, and finalizing time-bounded progression contexts called Seasons.

A Season is a platform-owned temporal container. It gives multiple independent Engines a shared, immutable answer to questions such as:

- which Season Edition is active in a realm;
- which phase is active at a specific instant;
- when enrollment opens and closes;
- when participation starts and ends;
- which exact content bindings belong to the Season;
- how a Character entered or left the Season;
- which operational schedule revision governed an action;
- whether the Season is paused, closing, closed, cancelled, or finalized;
- which grace and settlement windows remain open;
- which lifecycle facts downstream Engines may rely on.

The Season Engine owns:

- stable Season Definitions;
- immutable Season Definition Versions;
- concrete Season Editions representing scheduled releases;
- immutable Season Manifests that reference exact content identities owned by other Engines;
- phase plans and authoritative UTC schedules;
- enrollment, participation, closure, grace, settlement, and finalization windows;
- Season Edition lifecycle and schedule revisions;
- Character Season Participation lifecycle;
- deterministic audience and eligibility policy evaluation using registered facts;
- explicit content activation and deactivation signals;
- durable timers, lifecycle transitions, correction history, and reconciliation;
- authoritative Season context lookup;
- event publication, read projections, administrative workflows, audit, and operational controls.

The Season Engine does **not** own Experience, Levels, Progression Tracks, Quest state, Achievement progress, Rewards, Items, Inventory, Talents, Skills, Reputation, Currency, leaderboards, purchases, payments, notifications, business calendars, or business-domain truth.

A seasonal Progression Track remains owned by the Progression Engine. A seasonal Quest remains owned by the Quest Engine. A seasonal Achievement remains owned by the Achievement Engine. A Season Reward remains defined and fulfilled by the Reward Engine. Item ownership remains in Inventory Engine. The Season Engine references those resources by exact immutable identities and publishes lifecycle facts; it never edits their databases, rewrites their definitions, or assumes distributed transactions.

The Engine is an orchestrator of **time and context**, not a universal workflow engine. It establishes a common temporal boundary while preserving Engine autonomy. Downstream Engines subscribe to Season lifecycle Events and apply their own published policies. A Season close may cause one Quest Edition to expire active Instances, another to allow grace, and a Progression Track to stop accepting new grants. Those effects are owned and committed by the respective Engines.

Every concrete release is represented by a new Season Edition. Reusing an Edition for a new year, cohort, realm, or recurrence is prohibited. A recurring annual event therefore produces separate Editions such as `summer-2026` and `summer-2027`, even when both use the same stable Season Definition and similar content.

Every published Season Edition is governed by an immutable Manifest plus explicit lifecycle overlays. Schedule correction does not mutate history. Extension, pause, early close, cancellation, or administrative correction appends a new Schedule Revision and publishes Events describing the change. Downstream consumers can therefore identify which schedule facts were known and effective when they made a decision.

The Engine is designed around the following non-negotiable invariants:

1. Only Season Engine may authoritatively change Season Edition lifecycle or Character Season Participation state.
2. Every Season Edition references one immutable Season Definition Version.
3. Every Season Edition has a globally unique immutable identifier that is never reused.
4. Every published Manifest is immutable and content-addressed.
5. Content bindings reference exact published identities owned by the target Engine.
6. Season Engine never mutates another Engine's aggregate.
7. Every lifecycle transition originates from a command, timer, or immutable Event and is auditable.
8. Server UTC time is authoritative; client clocks are never trusted for lifecycle decisions.
9. Ambiguous local times are resolved before publication and stored as UTC instants.
10. Schedule correction appends a revision; it never rewrites previously effective history.
11. At most one active phase exists per phase lane unless the Manifest explicitly permits parallel lanes.
12. Every Character has at most one Participation Aggregate per Season Edition.
13. Enrollment retries with the same idempotency key have at most one logical effect.
14. Eligibility is evaluated from versioned facts and a pinned policy revision.
15. A downstream Engine decides how its own state responds to Season lifecycle Events.
16. Season close is not evidence that all downstream effects have settled.
17. Season finalization occurs only after configured settlement conditions and reconciliation complete.
18. Finalization does not delete or silently normalize historical participation.
19. Cancellation before activation and termination after activation are distinct outcomes.
20. Pausing does not implicitly extend deadlines unless the published pause-clock policy says so.
21. Extension never shortens a previously published deadline.
22. Early close requires explicit policy, authorization, reason, and user-impact preview.
23. Overlapping Seasons are permitted unless a declared exclusivity group forbids them.
24. Exclusivity is enforced by stable group and realm identities, not display names.
25. New Events arriving after close are handled by explicit lateness policy, not wall-clock guesswork.
26. A Character suspension restricts participation according to policy without erasing history.
27. Character anonymization preserves only the minimum pseudonymous integrity record required by policy.
28. Hidden or embargoed Season content is not exposed in unauthorized payloads, indexes, logs, or errors.
29. Administrative actions use the same state machines, idempotency, outbox, and audit guarantees as automated actions.
30. Direct SQL mutation of Season lifecycle, schedule, participation, or ledger tables is prohibited.
31. Exactly-once transport is not required; exactly-once logical effects are implemented through durable deduplication.
32. When correctness and availability conflict, the Engine prefers delayed activation or closure over contradictory Season state.

This RFC is normative for Season terminology, ownership, lifecycle, schedules, manifests, participation, cross-Engine integration, persistence, APIs, administration, security, privacy, performance, audit, edge cases, and production acceptance tests.

---

## Purpose

The purpose of this document is to define a production-ready specification for the Season Engine of Progression Platform.

It establishes:

- the authoritative boundary between a Season and content owned by other Engines;
- canonical identities for Definition, Version, Edition, Manifest, Phase, Schedule Revision, Participation, and Settlement;
- deterministic temporal behavior based on trusted UTC time;
- safe activation, pause, extension, close, cancellation, and finalization workflows;
- versioned content bindings without cross-Engine state ownership;
- enrollment and participation models for opt-in, automatic, invitation, and qualification-based Seasons;
- overlap and exclusivity semantics;
- late Event, correction, backfill, and replay behavior;
- transactional inbox and outbox requirements;
- reference database schemas and indexes;
- owner-facing, public, internal, and administrative APIs;
- operational controls, auditability, privacy, security, and release gates.

The specification is domain-agnostic. A school may use a Season for an academic term, tournament cycle, or summer training program. A fitness product may use it for a twelve-week challenge. An education product may use it for a cohort. A community may use it for a contribution season. A marketplace may use it for a loyalty campaign. These modules may choose different names in their own UX, but they map to the same platform entity and do not change the Engine's semantics.

### Normative language

The key words **MUST**, **MUST NOT**, **REQUIRED**, **SHALL**, **SHALL NOT**, **SHOULD**, **SHOULD NOT**, **RECOMMENDED**, **MAY**, and **OPTIONAL** indicate normative requirement levels.

An implementation that lets a Module, client, administrator, scheduler, analytics job, or another Engine directly edit Season tables violates this RFC unless an approved ADR replaces the ownership boundary.

### Design posture

Version 1 SHOULD favor:

- PostgreSQL or an equivalent transactional relational store;
- immutable published configuration;
- UTC instants with an explicit presentation time zone;
- append-only lifecycle and schedule history;
- materialized current state updated in the same transaction as history;
- transactional inbox and outbox patterns;
- durable timer records claimed with leases;
- stable command idempotency keys;
- explicit schedule revisions;
- exact foreign identities rather than human-readable names;
- asynchronous cross-Engine integration;
- bounded policy expression languages;
- safe preview and simulation before publication;
- repair through auditable commands rather than direct data edits.

Version 1 SHOULD avoid:

- a general-purpose BPMN runtime;
- arbitrary scripts in Season configuration;
- distributed transactions;
- synchronous fan-out to every dependent Engine during lifecycle transitions;
- silent schedule mutation;
- automatic reinterpretation of historical Events;
- client-calculated season membership;
- unbounded audience expressions;
- hidden coupling to the School Module.

---

## Goals

### G-1. Authoritative temporal context

Provide one authoritative source for Season Edition lifecycle, phase, windows, and schedule revisions.

### G-2. Platform independence

Support schools, fitness, education, communities, gaming, marketplaces, and future domains without domain-specific code.

### G-3. Immutable release identity

Represent every concrete scheduled run as a distinct Edition bound to an immutable Definition Version and Manifest.

### G-4. Cross-Engine coordination

Publish stable lifecycle facts that independent Engines can consume without direct invocation or shared database writes.

### G-5. Deterministic scheduling

Resolve all lifecycle transitions from trusted UTC time, explicit commands, and persisted schedule policy.

### G-6. Safe schedule evolution

Support extension, pause, resume, early close, and correction through append-only revisions and visible impact analysis.

### G-7. Participation ownership

Own enrollment and Season Participation state without owning the progress mechanics inside the Season.

### G-8. Multiple participation modes

Support automatic, opt-in, invitation, qualification, and administrative enrollment.

### G-9. Overlap and exclusivity

Allow overlapping Seasons while enforcing explicitly declared exclusivity groups where required.

### G-10. Explicit lateness

Define how late Events, late enrollment, grace periods, and settlement windows are handled.

### G-11. Finalization safety

Separate close from settlement and finalization so downstream effects can reconcile safely.

### G-12. Data-driven authoring

Represent schedule, phases, content bindings, participation policy, and lifecycle policy as validated data.

### G-13. Explainability

Explain why an Edition or Participation is in its current state and which rule or transition produced it.

### G-14. Idempotent commands

Guarantee at most one logical effect for a repeated command or consumed Event.

### G-15. Operational resilience

Recover from worker crashes, duplicate Events, delayed delivery, partial projection failure, and timer retries.

### G-16. Auditability

Preserve immutable history for publication, schedule changes, lifecycle transitions, participation, and administrative actions.

### G-17. Privacy by design

Minimize participant data, enforce visibility, and support Character privacy workflows.

### G-18. Secure hidden content

Protect secret, embargoed, invite-only, and unreleased Season metadata from unauthorized disclosure.

### G-19. Horizontal scalability

Scale read traffic, enrollment, timer processing, and Event fan-out without one global Season lock.

### G-20. Implementation clarity

Define enough contracts, schemas, invariants, and tests for implementation without unresolved ownership questions.

---

## Non Goals

### NG-1. Progression ownership

The Engine does not own XP, Levels, Prestige, seasonal Progression balances, or tier thresholds.

### NG-2. Quest ownership

The Engine does not evaluate Quest Objectives, complete Quest Instances, or alter Quest deadlines directly.

### NG-3. Achievement ownership

The Engine does not evaluate Achievement Conditions or unlock Achievements.

### NG-4. Reward ownership

The Engine does not define Reward fulfillment semantics, grant Items or XP, or mutate Reward Grant state.

### NG-5. Item and Inventory ownership

The Engine does not define Items or own Item quantities, instances, equipment, or transfers.

### NG-6. Talent ownership

The Engine does not unlock Talents, activate Skills, or manage loadouts and cooldowns.

### NG-7. Character identity

The Engine does not create, suspend, close, or anonymize Characters.

### NG-8. Leaderboard calculation

The Engine does not calculate ranks, scores, ties, or competitive placement. A future Leaderboard Engine owns those facts.

### NG-9. Business calendar

The Engine is not a class schedule, booking system, workforce calendar, tournament bracket, or academic attendance system.

### NG-10. Commerce

The Engine does not process purchases, subscriptions, payments, refunds, taxes, or entitlements.

### NG-11. Notification delivery

The Engine publishes lifecycle Events but does not send email, push, SMS, or in-app notifications.

### NG-12. Arbitrary workflow runtime

The Engine does not execute arbitrary graphs, scripts, callbacks, or user-authored code.

### NG-13. Analytics warehouse

The Engine does not replace event analytics, BI, experimentation, or long-term data warehousing.

### NG-14. Content authoring ownership

The Engine references content Definitions owned by other Engines; it does not edit those definitions.

### NG-15. Generic audience platform

Audience policies are bounded to Season eligibility. The Engine is not a general marketing segmentation product.

### NG-16. Real-time combat or match simulation

The Engine does not run game sessions, matches, battles, or physical activities.

### NG-17. Cross-region synchronous consensus

Version 1 does not require one globally synchronous lifecycle transaction across regions.

### NG-18. Silent historical reinterpretation

A new Manifest or policy version does not retroactively change prior participation or decisions.

### NG-19. Automatic legal judgment

The Engine records approved disqualification or restriction commands; it does not infer legal, disciplinary, or fraud decisions.

### NG-20. Client-authoritative time

Client-provided timestamps, locale, countdown state, or network receipt time do not determine authoritative lifecycle.

---

## Responsibilities

### R-1. Season Definition management

Create stable Season Definitions with immutable keys, ownership metadata, and governance status.

### R-2. Definition Version management

Author, validate, publish, deprecate, and archive immutable Definition Versions.

### R-3. Season Edition management

Create concrete scheduled Editions bound to exact Definition Versions.

### R-4. Manifest compilation

Compile and fingerprint a complete immutable Manifest containing phases, windows, bindings, policies, and references.

### R-5. Schedule validation

Validate ordering, overlap, duration, phase lanes, grace windows, and time-zone resolution before publication.

### R-6. Lifecycle orchestration

Schedule and execute transitions through draft, scheduled, active, paused, closing, closed, cancelled, and finalized states.

### R-7. Phase orchestration

Start and end phases deterministically and publish phase lifecycle Events.

### R-8. Schedule revisions

Append extensions, pauses, resumptions, early closures, and corrections with effective times and reasons.

### R-9. Content binding lifecycle

Publish activation and deactivation facts for exact cross-Engine content references.

### R-10. Participation policy

Own participation modes, entry windows, re-entry rules, exit policy, and finalization behavior.

### R-11. Eligibility evaluation

Evaluate bounded, versioned predicates using registered fact projections.

### R-12. Enrollment

Create idempotent Participation Aggregates through automatic, opt-in, invitation, qualification, or administrative entry.

### R-13. Participation lifecycle

Activate, pause, exit, disqualify, complete, close, and finalize Character participation.

### R-14. Exclusivity enforcement

Enforce declared exclusivity groups within a realm and configured scope.

### R-15. Character lifecycle integration

React deterministically to Character suspension, restoration, closure, and anonymization.

### R-16. Temporal context lookup

Answer authoritative Edition, phase, window, and schedule-revision queries for a trusted instant.

### R-17. Late Event policy

Classify processing against occurred-at, recorded-at, close, grace, and settlement policy without rewriting source Events.

### R-18. Close and settlement

Separate closure of new activity from downstream settlement and finalization.

### R-19. Finalization

Finalize Editions and Participations only after configured gates and reconciliation pass.

### R-20. Event publication

Publish immutable versioned Events through a transactional outbox.

### R-21. Event consumption

Consume Character, content-readiness, governance, and correction Events idempotently through a durable inbox.

### R-22. Read models

Build owner, public, internal, authoring, and administrative projections.

### R-23. Explainability

Expose transition reasons, governing Manifest, effective schedule revision, and blocking finalization conditions.

### R-24. Simulation

Preview schedules, phase transitions, enrollment counts, overlap, exclusivity, content dependencies, and user impact.

### R-25. Reconciliation

Detect and repair missing timers, projection drift, incomplete fan-out, impossible state combinations, and dependency lag.

### R-26. Governance

Require authorization, separation of duties, approval, and audit for high-impact publication and schedule changes.

### Explicitly forbidden responsibilities

Season Engine MUST NOT:

- write another Engine's tables;
- grant Rewards directly;
- adjust Progression balances;
- complete Quests or Achievements;
- create or delete Inventory ownership;
- execute arbitrary code from a Manifest;
- infer business truth from descriptive text;
- trust a client countdown;
- hide a schedule correction by editing old rows;
- finalize while mandatory settlement gates are unresolved;
- use display names as cross-Engine identities.

---

## Dependencies

### Character Engine

Season Engine depends on Character Engine for:

- immutable `character_id`;
- current lifecycle eligibility;
- owner-authorized access;
- privacy and anonymization Events;
- optional realm or platform restrictions exposed through registered facts.

Season Engine stores only the minimum Character reference required for Participation. It never treats a business Module membership as Character identity.

### Progression Engine

Season Engine may bind exact Progression Track versions or Editions into a Manifest and publish activation, pause, close, and correction context. Progression Engine owns balances, thresholds, Levels, Prestige, grant acceptance, and track-specific close behavior.

Season Engine MUST NOT calculate seasonal XP. Progression Engine MUST NOT infer Season schedule independently when a binding declares Season Engine authority.

### Reward Engine

Reward Engine may map authoritative Season Events such as `season.participation.completed.v1` or `season.edition.finalized.v1` to immutable Reward Definitions.

Season Engine does not wait for Reward delivery to consider its own lifecycle transition committed unless the Manifest explicitly declares Reward settlement as a finalization gate. Even then, the gate observes Reward outcomes; it does not own or mutate them.

### Achievement Engine

Achievement Editions may reference a Season Edition. Achievement Engine consumes Season lifecycle facts and applies its own close or grace policy. Season Engine does not evaluate conditions or unlock milestones.

### Quest Engine

Quest Editions may reference a Season Edition. Quest Engine consumes activation, pause, close, and schedule correction Events and owns the resulting Quest Instance behavior.

A Season Manifest MUST NOT imply that closing a Season directly edits a Quest Instance. It declares a binding and expected policy contract that Quest Engine validates at publication or activation time.

### Talent Engine

Season-scoped capability availability may be referenced through exact Talent content identities or Effect Set contracts. Talent Engine remains the owner of acquisition, loadout, Skill activation, charges, cooldowns, and effect revisions.

### Item Engine

Season Manifests may reference exact Item Definition Versions for catalogs, visual identity, or Reward dependencies. Item Engine remains the source of Item semantics and lifecycle.

### Inventory Engine

Inventory facts may be used for bounded eligibility predicates. Inventory Engine remains authoritative for ownership and consumption. A Season enrollment rule requiring destructive consumption is unsupported unless an explicit idempotent reservation or consumption protocol exists.

### Future Leaderboard Engine

Competitive placement, tie breaking, score correction, and rank finalization belong to a Leaderboard Engine. Season Engine may observe a signed leaderboard finalization fact as a settlement gate and include a leaderboard reference in its Manifest.

### Configuration Registry or LiveOps Engine

A Configuration Registry or LiveOps Engine may distribute published Manifests and request operational activation. It MUST NOT mutate authoritative Season state.

### Event infrastructure

Required capabilities:

- durable at-least-once delivery;
- globally unique Event identifiers;
- producer identity;
- schema identifiers and versions;
- partition keys;
- occurred-at and recorded-at timestamps;
- correlation and causation propagation;
- replay by bounded range;
- dead-letter or quarantine routing;
- retention sufficient for recovery and audit.

Exactly-once transport is not required. Season Engine implements exactly-once logical effects.

### Schema Registry

Every produced and consumed Event contract MUST be registered, compatibility-checked, and versioned.

### Identity and Access Management

All APIs depend on authenticated principals, service identities, scopes, roles, realm boundaries, and policy enforcement.

### Trusted time infrastructure

The Engine requires synchronized UTC infrastructure time. Timer scheduling, lease expiry, lifecycle transitions, and authoritative context resolution use server time.

### Database

The authoritative store MUST support:

- atomic multi-row transactions;
- unique and exclusion constraints;
- row or optimistic locking;
- append-only history;
- indexed range queries;
- online migration;
- point-in-time recovery;
- durable timer claims;
- transactional outbox.

### Observability and audit infrastructure

Metrics, logs, traces, alerting, secret management, backup, and archive are required. Telemetry failure MUST NOT silently cancel a committed lifecycle transition.

---

## Architecture Overview

### Context diagram

```text
Business Module Events              Administrative Commands
          │                                   │
          ▼                                   ▼
   Event Infrastructure ───────────────► Season Command API
          │                                   │
          ▼                                   ▼
  Transactional Inbox                 Authorization / Validation
          │                                   │
          └──────────────┬────────────────────┘
                         ▼
                 Season Domain Core
       ┌─────────────────┼──────────────────┐
       ▼                 ▼                  ▼
 Definition/Manifest  Edition/Phase    Participation
    Aggregate          Aggregate        Aggregate
       │                 │                  │
       └─────────────────┼──────────────────┘
                         ▼
              Authoritative PostgreSQL
       ┌─────────────────┼──────────────────┐
       ▼                 ▼                  ▼
 Lifecycle Ledger     Timer Queue      Transactional Outbox
       │                 │                  │
       ▼                 ▼                  ▼
 Explainability      Timer Workers       Event Bus
                                              │
                     ┌────────────────────────┼──────────────────────┐
                     ▼                        ▼                      ▼
             Progression Engine        Quest Engine          Reward Engine
                     ▼                        ▼                      ▼
             Achievement Engine        Talent Engine         Other Engines
```

### Component model

The reference implementation contains:

1. **Authoring API** for Definitions, Versions, Manifests, simulation, publication, and approvals.
2. **Season Command API** for Edition lifecycle, enrollment, exit, schedule revision, and operational controls.
3. **Season Query API** for catalog, current phase, Participation, context, and history.
4. **Domain Core** implementing state machines and invariants without infrastructure dependencies.
5. **Policy Compiler** validating bounded eligibility and participation expressions.
6. **Manifest Compiler** resolving exact references and generating a canonical fingerprint.
7. **Scheduler** materializing durable transition timers from effective Schedule Revisions.
8. **Timer Workers** claiming due timers with leases and executing idempotent commands.
9. **Inbox Workers** consuming external Events with stable deduplication.
10. **Outbox Relay** publishing committed domain Events.
11. **Projection Workers** building eventually consistent read models.
12. **Reconciliation Workers** detecting drift and resuming incomplete workflows.
13. **Bulk Job Workers** handling auto-enrollment, backfill, correction, and finalization scans.
14. **Audit Exporter** producing immutable governance and compliance views.

### Write path

A command write path is:

1. authenticate principal;
2. authorize realm and operation;
3. validate command schema;
4. normalize identifiers and timestamps;
5. derive command fingerprint;
6. insert or resolve idempotency receipt;
7. lock required aggregate rows in canonical order;
8. load exact Definition Version, Manifest, and effective Schedule Revision;
9. evaluate preconditions and policy;
10. append lifecycle and audit history;
11. update authoritative materialized state;
12. create, cancel, or supersede durable timers;
13. enqueue outbox Events;
14. commit one database transaction;
15. return authoritative receipt;
16. publish asynchronously.

### Timer path

A timer worker:

1. selects due timers using `FOR UPDATE SKIP LOCKED` or equivalent;
2. claims a bounded batch with lease identity and expiry;
3. reconstructs the exact intended command;
4. executes through the same Domain Core as an API command;
5. records success, no-op, supersession, or retry;
6. publishes Events through the outbox;
7. never assumes timer delivery is exactly once.

### Event path

An Event worker:

1. validates schema and producer authorization;
2. stores the Event in the inbox;
3. deduplicates by producer and Event ID;
4. loads affected aggregate identities;
5. applies deterministic Event policy;
6. records consumed evidence and state transition;
7. writes outbox Events;
8. commits;
9. acknowledges transport only after commit.

### Read path

Authoritative operational queries read normalized current state or an in-transaction projection. High-volume catalog and public views use projections and caches. Every eventually consistent response includes an `asOf` or revision field when staleness matters.

### Consistency model

Within the authoritative owning region:

- Edition lifecycle transitions are strongly consistent;
- schedule revision publication is strongly consistent;
- Participation mutations are strongly consistent per Participation Aggregate;
- exclusivity checks are strongly consistent within the declared scope;
- read projections are eventually consistent;
- cross-Engine reactions are eventually consistent;
- finalization is a coordinated asynchronous process, not a distributed transaction.

### Partitioning model

Recommended partition keys:

- Definition authoring by `season_definition_id`;
- Edition lifecycle by `season_edition_id`;
- Participation by `season_edition_id` plus hash of `character_id`;
- timer claims by due-time bucket and shard;
- Event publication by `season_edition_id`;
- public catalog by realm and availability window.

One global lock for all Seasons is prohibited.

### Failure posture

When a cross-Engine dependency is unavailable:

- publication MAY fail closed if exact references cannot be validated;
- activation SHOULD be delayed when mandatory dependencies are not ready;
- an already active Edition remains authoritative according to its last committed state;
- close commits locally and downstream consumers catch up asynchronously;
- finalization remains blocked while mandatory settlement facts are unresolved;
- no operator may simulate success by direct database edits.

---

## Canonical Definitions

### Season

A **Season** is a time-bounded platform context that coordinates content, participation, rules, and lifecycle across independent Engines.

A Season is not a score, Progression balance, Quest, Reward, business campaign, calendar appointment, or Module.

### Season Definition

A **Season Definition** is the stable conceptual identity of a Season family across releases.

Examples:

- `platform_summer`;
- `school_academic_term`;
- `community_contribution_cycle`;
- `fitness_twelve_week_challenge`.

A Definition has a stable `season_key`, ownership metadata, governance scope, and version history. It has no active schedule by itself.

### Season Definition Version

A **Season Definition Version** is an immutable authored specification containing narrative metadata, participation policy, phase template, lifecycle policy, binding declarations, visibility, and governance requirements.

Publication makes the Version immutable.

### Season Edition

A **Season Edition** is one concrete scheduled release of a Season Definition Version in a realm.

Examples:

- Summer 2026;
- Autumn Term 2026;
- Community Season 14.

An Edition owns lifecycle, schedule, phase occurrences, Manifest identity, and Participants. It is never reused for a later recurrence.

### Season Manifest

A **Season Manifest** is the immutable, canonical, content-addressed release manifest for one Edition.

It includes:

- exact Definition Version;
- exact content bindings;
- phase plan;
- participation policy;
- lifecycle policy;
- schedule policy;
- lateness policy;
- settlement gates;
- visibility;
- realm and exclusivity scope;
- schema versions;
- canonical fingerprint.

The Manifest does not copy or own foreign content state. It pins foreign identifiers and expected contracts.

### Content Binding

A **Content Binding** is an immutable reference from a Manifest to an exact resource owned by another Engine.

A binding includes:

- `binding_id`;
- owner Engine;
- resource type;
- exact immutable resource identity;
- activation phase or window;
- close behavior contract;
- required or optional dependency;
- dependency fingerprint;
- visibility and audience constraints;
- operational readiness requirement.

Examples include a Progression Track Version, Quest Edition, Achievement Edition, Reward Definition Version, Item Definition Version, or Talent content identity.

### Realm

A **Realm** is a bounded platform namespace used for availability, authorization, and exclusivity.

A realm may represent a product environment, tenant, region, community, or other platform partition. Realm semantics are defined by platform architecture, not by Season display text.

### Audience Policy

An **Audience Policy** is a versioned bounded predicate that determines discoverability, eligibility, or automatic enrollment from registered facts.

Audience Policy cannot execute arbitrary code or remote requests.

### Participation Policy

A **Participation Policy** defines how Characters enter, remain in, exit, complete, and finalize participation.

It declares:

- participation mode;
- entry window;
- eligibility evaluation points;
- re-entry behavior;
- suspension behavior;
- exit behavior;
- disqualification semantics;
- completion rule;
- finalization rule;
- visibility.

### Participation Mode

Supported core modes are:

- `AUTO_ENROLL`;
- `OPT_IN`;
- `INVITATION`;
- `QUALIFICATION`;
- `ADMINISTRATIVE`.

New modes require an Engine contract version and ADR when they introduce new state semantics.

### Season Participation

A **Season Participation** is the authoritative Character-specific aggregate for one Season Edition.

It records:

- entry source;
- governing policy revision;
- eligibility evidence references;
- enrollment and activation timestamps;
- lifecycle state;
- exit or disqualification reason;
- completion and finalization timestamps;
- effective schedule revision;
- integrity status.

Participation does not store XP, Quest progress, rewards, inventory, rank, or score.

### Invitation

An **Invitation** is a single-use or bounded-use authorization to enroll one Character or an approved audience into an invitation-based Edition.

An Invitation is not a Reward or Entitlement unless another Engine explicitly owns that fact and the Season policy consumes it.

### Qualification Fact

A **Qualification Fact** is an immutable or versioned external fact proving that a Character satisfies a qualification gate.

The owner of the source domain remains authoritative. Season Engine stores only the source identity, revision, evaluation result, and bounded evidence summary.

### Phase

A **Phase** is a named interval or operational state within an Edition.

Core phase kinds MAY include:

- `PREVIEW`;
- `ENROLLMENT`;
- `ACTIVE`;
- `MIDSEASON`;
- `FINALE`;
- `GRACE`;
- `SETTLEMENT`;
- `ARCHIVE`.

The names are presentation-independent. A Manifest may define domain-specific labels while mapping to registered phase semantics.

### Phase Lane

A **Phase Lane** is an ordered sequence of non-overlapping phases.

Parallel lanes are permitted for independent concerns such as content, enrollment, competition, and claims. Within one lane, two phase occurrences MUST NOT overlap.

### Phase Occurrence

A **Phase Occurrence** is the concrete scheduled interval for one Phase in one Edition under one Schedule Revision.

### Window

A **Window** is a named interval controlling one operation.

Core windows include:

- discoverability;
- enrollment;
- activation;
- progress acceptance;
- completion grace;
- claim;
- settlement;
- public archive.

A Window may align with a Phase but is not required to.

### Schedule Revision

A **Schedule Revision** is an immutable ordered revision of effective UTC instants, pause intervals, phase occurrences, and windows for one Edition.

Revision `1` is created at publication. Every approved extension, pause, resume, early close, or correction creates the next revision.

### Effective Time

**Effective Time** is the UTC instant from which a Schedule Revision or lifecycle correction governs decisions.

It may differ from the time the revision was recorded. Backdated effective time requires elevated authorization and impact analysis.

### Trusted Instant

A **Trusted Instant** is a server-generated or cryptographically trusted UTC timestamp accepted for authoritative Season decisions.

Client time is never a Trusted Instant.

### Activation

**Activation** is the transition that makes an Edition operationally active and publishes binding activation facts.

Activation does not synchronously mutate bound content.

### Pause

A **Pause** is a temporary Edition lifecycle state that restricts operations according to published pause policy.

A Pause is not automatically equivalent to extending the Season.

### Pause Clock Policy

The **Pause Clock Policy** defines schedule behavior during a Pause:

- `WALL_CLOCK_CONTINUES`;
- `EXTEND_BY_PAUSE_DURATION`;
- `EXPLICIT_REVISION_REQUIRED`.

The policy is pinned in the Manifest.

### Close

**Close** ends normal new Season activity according to the Manifest. Close may open grace or settlement windows.

Close is not Finalization.

### Cancellation

**Cancellation** terminates an Edition before meaningful activation or under an explicitly approved cancellation workflow.

Cancellation after activation MUST be represented as `TERMINATED`, not as if the Edition never started.

### Termination

**Termination** is an exceptional early end after activation.

It preserves active history and publishes explicit impact policy.

### Settlement

**Settlement** is the period during which downstream outcomes, corrections, Rewards, leaderboards, or completion facts may finish and be reconciled.

Season Engine observes declared gates but does not own their aggregates.

### Settlement Gate

A **Settlement Gate** is a typed condition that must be satisfied before Edition or Participation Finalization.

Core gate types include:

- required time elapsed;
- required Event received;
- external aggregate finalized;
- no unresolved integrity cases;
- reconciliation completed;
- manual approval.

### Finalization

**Finalization** is the terminal declaration that an Edition's governed lifecycle is complete and required settlement gates are satisfied or explicitly waived.

Finalization is append-only and cannot be undone in v1. A factual correction after Finalization creates an integrity case and compensating records.

### Grace Period

A **Grace Period** is an explicitly configured interval after normal close during which named operations remain acceptable.

Grace never exists implicitly.

### Lateness Policy

A **Lateness Policy** determines whether an Event is applicable based on `occurred_at`, `recorded_at`, receipt time, Event source trust, close, grace, and settlement boundaries.

### Exclusivity Group

An **Exclusivity Group** is a stable identity declaring that a Character may hold at most a configured number of active Participations across matching Editions in a scope.

### Schedule Conflict

A **Schedule Conflict** is an invalid or warning-level overlap detected between phase lanes, windows, dependencies, or exclusivity declarations.

### Season Context

A **Season Context** is an immutable response or Event fragment identifying:

- Edition;
- Manifest;
- effective Schedule Revision;
- active phases;
- applicable windows;
- Participation identity and state when authorized;
- resolution instant;
- resolution reason.

A context is evidence, not a transferable authorization token unless explicitly signed and scoped.

### Lifecycle Ledger Entry

A **Lifecycle Ledger Entry** is an immutable record of a Definition, Edition, Phase, Schedule, or Participation transition.

### Timer

A **Timer** is a durable intended future command with due time, aggregate identity, expected revision, lease state, and idempotency key.

### Integrity Case

An **Integrity Case** records a contradiction, suspected invalid state, post-finalization correction, or unresolved external dependency requiring controlled review.

### Backfill

A **Backfill** is a bounded job that evaluates historical Characters or Events against a published policy under explicit semantics.

Backfill never silently impersonates live occurrence time.

### Reconciliation

**Reconciliation** compares authoritative state, timers, ledgers, projections, dependency facts, and outbox publication to detect drift.

### Projection

A **Projection** is a query-optimized representation derived from authoritative state and Events. It is not a write model.

---

## Lifecycle

### Definition lifecycle

A Season Definition uses:

```text
DRAFT → ACTIVE → DEPRECATED → ARCHIVED
```

Rules:

- `DRAFT` may be edited.
- `ACTIVE` may receive new Versions.
- `DEPRECATED` may not receive new Editions without an approved exception.
- `ARCHIVED` is retained for history and cannot be referenced by new Editions.
- Definition state does not rewrite existing Versions or Editions.

### Definition Version lifecycle

A Definition Version uses:

```text
DRAFT → VALIDATING → APPROVED → PUBLISHED → DEPRECATED
              └──────────────► REJECTED
```

Rules:

- only `DRAFT` may change authored fields;
- validation produces immutable reports;
- approval and publication may require separate principals;
- `PUBLISHED` content is immutable;
- deprecation prevents new Editions unless policy permits;
- rejection records reasons and does not delete the draft;
- a published Version cannot return to draft.

### Edition lifecycle

The canonical Edition lifecycle is:

```text
DRAFT
  │
  ▼
VALIDATING
  ├────────────► REJECTED
  ▼
APPROVED
  ▼
SCHEDULED
  ├────────────► CANCELLED
  ▼
ACTIVATING
  ├────────────► ACTIVATION_BLOCKED
  ▼
ACTIVE ◄─────────────┐
  │                  │
  ├────► PAUSED ─────┘
  │
  ├────► TERMINATING
  │             ▼
  │         TERMINATED
  │             ▼
  ▼             │
CLOSING ◄───────┘
  ▼
CLOSED
  ▼
SETTLING
  ▼
FINALIZING
  ├────────────► FINALIZATION_BLOCKED
  ▼
FINALIZED
```

`CANCELLED`, `TERMINATED`, and `FINALIZED` are terminal lifecycle outcomes for normal commands.

### Edition transition requirements

Every transition MUST validate:

- current state and expected aggregate version;
- principal or timer authorization;
- exact Manifest fingerprint;
- effective Schedule Revision;
- transition-specific preconditions;
- dependency readiness where mandatory;
- idempotency receipt;
- transition reason;
- outbox Event generation.

### Draft

`DRAFT` permits changes to unpublished Edition metadata and schedule proposals. No external consumer may treat a Draft as available.

### Validating

`VALIDATING` runs:

- schema validation;
- phase and window ordering;
- time-zone resolution;
- overlap checks;
- exclusivity checks;
- cross-Engine reference validation;
- dependency readiness;
- audience policy compilation;
- privacy review;
- hidden-content review;
- estimated enrollment impact;
- finalization gate validation.

### Approved

`APPROVED` means governance requirements are met. It is not yet scheduled or discoverable unless preview policy says otherwise.

### Scheduled

`SCHEDULED` means Manifest revision `1` and initial timers are committed. The Edition may become discoverable according to preview windows.

### Activating

`ACTIVATING` is a short operational state used while activation preconditions and binding readiness are checked.

Activation MUST NOT synchronously wait for every consumer to apply the Event. It commits local state and publishes activation facts.

### Activation Blocked

`ACTIVATION_BLOCKED` records that activation did not commit because a mandatory gate failed.

The Engine MUST:

- retain the intended due time;
- record blocking reasons;
- alert operators;
- retry according to policy;
- never claim the Edition is active.

### Active

`ACTIVE` permits operations declared by the active windows and Participation state.

An Edition can be Active while some optional bindings are unavailable. Mandatory binding readiness policy determines whether this is allowed.

### Paused

`PAUSED` applies explicit policies for:

- new enrollment;
- new progression acceptance;
- Quest activation;
- claim operations;
- visibility;
- timer advancement;
- external binding signals.

Downstream Engines receive `season.edition.paused.v1` and decide their own aggregate behavior according to published contracts.

### Resumed

Resume transitions back to `ACTIVE` and creates a Schedule Revision when pause policy changes effective deadlines.

### Closing

`CLOSING` is a bounded transition state used to:

- stop new enrollment;
- publish close-intent;
- snapshot the effective schedule;
- prepare close fan-out;
- evaluate immediate completion rules.

It MUST NOT remain indefinitely without alerting and repair.

### Closed

`CLOSED` means normal active operations are no longer accepted by Season Engine. Grace and settlement operations may remain open.

### Settling

`SETTLING` evaluates declared gates, late Events, correction windows, external finalization facts, and reconciliation jobs.

### Finalizing

`FINALIZING` attempts a terminal commit after all mandatory gates pass.

### Finalization Blocked

`FINALIZATION_BLOCKED` identifies unresolved conditions. It is operationally non-terminal and may return to `SETTLING` after correction.

### Finalized

`FINALIZED` means:

- all mandatory gates passed or were explicitly waived;
- final schedule and Manifest are pinned;
- Edition summary is sealed;
- unresolved exceptions are zero or accepted through governance;
- finalization Event is committed.

Finalization does not imply that all optional notifications, analytics exports, or caches are complete.

### Cancelled

`CANCELLED` is allowed before activation. Cancellation policy declares:

- whether Invitations are invalidated;
- whether opt-ins are closed;
- whether preview remains visible;
- whether bound content receives deactivation;
- whether any pre-activation Reward requests require compensation.

### Terminated

`TERMINATED` is used after activation. It records:

- termination effective time;
- reason;
- impact policy;
- participation outcome policy;
- grace and claim policy;
- binding close policy;
- settlement gates.

History continues to show that the Edition was active.

### Phase lifecycle

A Phase Occurrence uses:

```text
PLANNED → STARTED → ENDED
        └────────► SKIPPED
STARTED ────────► INTERRUPTED
```

A phase may be `SKIPPED` before start by a Schedule Revision. A started phase may be `INTERRUPTED` by termination. Existing phase history is immutable.

### Participation lifecycle

The canonical Participation lifecycle is:

```text
PENDING
  ├────────────► REJECTED
  ▼
ENROLLED
  ├────────────► WITHDRAWN
  ├────────────► DISQUALIFIED
  ▼
ACTIVE
  ├────────────► PAUSED
  │                 │
  │                 └────► ACTIVE
  ├────────────► EXITED
  ├────────────► DISQUALIFIED
  ├────────────► COMPLETED
  ▼
CLOSED
  ▼
FINALIZED
```

Not every policy uses every state.

### Pending Participation

`PENDING` exists while invitation, qualification, eligibility, approval, or exclusivity checks are unresolved.

### Enrolled Participation

`ENROLLED` means entry was accepted, but the Edition or activation window may not yet be active.

### Active Participation

`ACTIVE` means the Character is enrolled and the Edition permits participation.

### Paused Participation

Participation pause may result from Character suspension, Edition pause, policy restriction, or administrative review. Reason and source are mandatory.

### Withdrawn

`WITHDRAWN` applies before meaningful activation when policy permits cancellation of entry.

### Exited

`EXITED` applies after activation when voluntary or policy-driven exit is permitted.

### Disqualified

`DISQUALIFIED` is an exceptional state requiring authoritative reason, actor, evidence reference, and appeal policy. It does not erase prior activity.

### Completed

`COMPLETED` means the Season's own participation-completion rule is satisfied. This rule MUST be based only on Season-owned facts or signed external facts declared in the Manifest.

Completion does not mean Rewards were delivered.

### Closed Participation

`CLOSED` means no additional normal Participation mutations are accepted, but settlement and integrity review may remain.

### Finalized Participation

`FINALIZED` seals the Participation outcome under the Edition finalization revision.

### Participation re-entry

Re-entry policy is one of:

- `PROHIBITED`;
- `BEFORE_ACTIVATION_ONLY`;
- `WITHIN_ENTRY_WINDOW`;
- `ADMIN_REVIEW`;
- `NEW_PARTICIPATION_NOT_ALLOWED`.

Because one Character has only one Participation per Edition, re-entry changes the existing Aggregate through an explicit transition; it never creates a second active record.

### Character suspension

The Manifest declares one policy:

- `PAUSE_PARTICIPATION`;
- `BLOCK_MUTATIONS_KEEP_ACTIVE`;
- `EXIT`;
- `ADMIN_REVIEW`.

Suspension never deletes Participation history.

### Character restoration

Restoration follows the pinned policy and never assumes deadlines should be extended. A resume may be denied if entry or participation windows have closed.

### Character closure

Closure moves non-final Participation to the configured terminal or restricted state. Finalized history remains.

### Character anonymization

Anonymization:

- replaces direct Character references with a policy-approved pseudonymous key where retention is required;
- removes display and contact projections;
- preserves aggregate counts and integrity evidence minimally;
- prevents owner-facing lookup through the old identity;
- never reassigns the Participation to another Character.

### Schedule revision lifecycle

A Schedule Revision uses:

```text
PROPOSED → VALIDATED → APPROVED → EFFECTIVE
                       └───────► REJECTED
```

Once Effective, it is immutable. A later revision may supersede future schedule facts but not delete prior revision history.

### Timer lifecycle

A Timer uses:

```text
PENDING → CLAIMED → EXECUTED
    │         ├──► RETRY
    │         └──► SUPERSEDED
    └────────────► CANCELLED
```

Lease expiry returns an uncommitted claimed Timer to retry. Command idempotency protects against duplicate execution.

---

## Aggregate

### Aggregate family

Season Engine uses multiple aggregates to avoid one unbounded lock.

#### Season Definition Aggregate

Owns:

- Definition identity;
- stable key;
- owner scope;
- lifecycle;
- Version sequence;
- governance metadata.

#### Season Definition Version Aggregate

Owns:

- immutable authored content after publication;
- validation result;
- approval record;
- canonical content fingerprint.

#### Season Edition Aggregate

Owns:

- Edition identity;
- Definition Version and Manifest;
- realm;
- lifecycle;
- current Schedule Revision;
- current phase facts;
- close, settlement, and finalization state;
- lifecycle ledger sequence.

#### Schedule Revision Aggregate

Owns one immutable schedule revision and its phase/window occurrences.

#### Season Participation Aggregate

Owns one Character's participation in one Edition:

- entry identity;
- state;
- policy revision;
- eligibility evidence;
- timestamps;
- transition history;
- integrity state.

#### Invitation Aggregate

Owns invitation token hash, scope, usage limit, expiry, revocation, and redemption facts.

#### Integrity Case Aggregate

Owns review state, evidence references, decisions, remediation, and closure.

#### Bulk Job Aggregate

Owns auto-enrollment, backfill, correction, finalization scan, or projection rebuild progress.

### Aggregate invariants

#### Definition invariants

- `season_key` is unique within owner scope.
- Published Versions are immutable.
- Version numbers increase monotonically.
- A Version fingerprint uniquely represents canonical content.

#### Edition invariants

- Each Edition references exactly one published Version.
- Each Edition references exactly one published Manifest.
- `season_edition_id` is globally unique.
- Lifecycle transitions are monotonic except `PAUSED → ACTIVE` and blocked recovery paths.
- Current lifecycle state equals the last committed lifecycle ledger outcome.
- Current schedule revision is the highest effective committed revision.
- A finalized Edition cannot accept normal lifecycle or schedule commands.
- A cancelled Edition was never active.
- A terminated Edition was active at least once.
- Mandatory phase lanes contain no overlap.
- Windows required by policy exist and are ordered.
- Finalization cannot precede close.
- Settlement end cannot precede close.
- Claim end cannot precede the last event that may create a claim unless explicitly unsupported.

#### Participation invariants

- `(season_edition_id, character_id)` is unique before anonymization.
- One Participation has one immutable entry identity.
- State transitions follow the pinned policy.
- Finalized Participation is immutable except integrity annotations.
- Disqualification requires a reason code and actor.
- Eligibility evidence references are immutable.
- Participation cannot be Active while Edition is Draft, Rejected, Cancelled, or Finalized.
- Participation may remain in settlement states after Edition close.
- Duplicate enrollment returns the original result.
- Exclusivity constraints are checked atomically.

#### Invitation invariants

- Raw invitation secrets are never stored.
- Redemption count never exceeds usage limit.
- Expired or revoked Invitations cannot be redeemed.
- Redemption is idempotent by command and Character.

#### Timer invariants

- A timer targets one aggregate and expected revision.
- Superseded timers never execute a state transition.
- Timer execution uses the same command contract as manual execution.
- Due time is UTC.
- Lease identity and expiry are recorded.

### Locking order

When one transaction touches multiple aggregates, the normative lock order is:

1. Definition;
2. Definition Version;
3. Edition;
4. Schedule Revision metadata;
5. Exclusivity group rows sorted by stable key;
6. Participation rows sorted by Character ID;
7. Invitation;
8. lifecycle ledger sequence;
9. timer rows;
10. outbox rows.

Implementations MAY avoid some locks with serializable constraints, but MUST preserve equivalent correctness.

### Aggregate size limits

- Manifest binding count MUST be bounded.
- Phase count and lane count MUST be bounded.
- Participation history is paginated and may be partitioned.
- Large auto-enrollment runs use Bulk Jobs and do not lock the Edition for the full scan.
- Edition summary counters are sharded or asynchronously projected.
- Evidence payloads are bounded and externally referenced when large.

---

## State Model

### Season Definition state

```yaml
season_definition_id: uuid
season_key: string
owner_scope: string
lifecycle_state: DRAFT | ACTIVE | DEPRECATED | ARCHIVED
latest_version_number: integer
created_at: instant
created_by: principal
updated_at: instant
aggregate_version: integer
```

### Definition Version state

```yaml
season_definition_version_id: uuid
season_definition_id: uuid
version_number: integer
lifecycle_state: DRAFT | VALIDATING | APPROVED | PUBLISHED | DEPRECATED | REJECTED
schema_version: integer
narrative:
  title_key: string
  summary_key: string
  description_key: string
  theme_key: string?
participation_policy: object
phase_template: object
lifecycle_policy: object
lateness_policy: object
settlement_policy: object
visibility_policy: object
governance_policy: object
content_fingerprint: sha256
published_at: instant?
aggregate_version: integer
```

### Edition state

```yaml
season_edition_id: uuid
season_definition_id: uuid
season_definition_version_id: uuid
season_manifest_id: uuid
realm_id: string
edition_key: string
lifecycle_state: enum
visibility_state: HIDDEN | PREVIEW | DISCOVERABLE | ARCHIVED
current_schedule_revision: integer
current_phase_revision: integer
activated_at: instant?
closed_at: instant?
finalized_at: instant?
cancelled_at: instant?
terminated_at: instant?
exclusivity_group_key: string?
aggregate_version: integer
created_at: instant
updated_at: instant
```

### Manifest state

```yaml
season_manifest_id: uuid
season_edition_id: uuid
manifest_schema_version: integer
definition_version_id: uuid
realm_id: string
phase_plan: array
windows: array
content_bindings: array
participation_policy_revision: string
eligibility_policy_revision: string
pause_clock_policy: enum
lateness_policy_revision: string
settlement_gates: array
visibility_policy: object
dependency_contracts: array
canonical_json: object
manifest_fingerprint: sha256
published_at: instant
```

### Schedule Revision state

```yaml
schedule_revision_id: uuid
season_edition_id: uuid
revision_number: integer
effective_from: instant
recorded_at: instant
reason_code: string
change_type: INITIAL | EXTENSION | PAUSE | RESUME | EARLY_CLOSE | CORRECTION | TERMINATION
display_timezone: iana_timezone
phase_occurrences: array
windows: array
pause_intervals: array
supersedes_revision: integer?
approved_by: principal
schedule_fingerprint: sha256
```

### Participation state

```yaml
season_participation_id: uuid
season_edition_id: uuid
character_id: uuid?
pseudonymous_character_key: string?
entry_mode: enum
entry_source_id: string
state: enum
policy_revision: string
eligibility_decision_id: uuid
effective_schedule_revision: integer
enrolled_at: instant?
activated_at: instant?
completed_at: instant?
closed_at: instant?
finalized_at: instant?
exited_at: instant?
disqualified_at: instant?
reason_code: string?
integrity_state: VALID | CONTESTED | INVALIDATED
aggregate_version: integer
```

### Eligibility Decision state

```yaml
eligibility_decision_id: uuid
season_edition_id: uuid
character_id: uuid
policy_revision: string
evaluation_point: DISCOVERY | ENROLLMENT | ACTIVATION | CONTINUOUS | FINALIZATION
result: ELIGIBLE | INELIGIBLE | UNKNOWN | REVIEW
fact_revision_vector: object
reason_codes: array
evidence_refs: array
evaluated_at: instant
expires_at: instant?
```

### Lifecycle Ledger state

Every entry contains:

- ledger entry ID;
- aggregate type and ID;
- sequence number;
- previous state;
- new state;
- transition type;
- effective time;
- recorded time;
- actor type and actor ID;
- command ID;
- source Event ID;
- reason code;
- Manifest fingerprint;
- Schedule Revision;
- correlation and causation IDs;
- bounded metadata;
- entry hash;
- previous entry hash where hash chaining is enabled.

### Current phase derivation

Current phase is derived from:

1. current effective Schedule Revision;
2. trusted instant;
3. Edition lifecycle;
4. phase lane;
5. explicit pause or termination overlays.

A cached current phase MUST be treated as materialized state with revision metadata, not as independent truth.

### Window derivation

An operation window is open only if:

- Edition lifecycle permits the operation;
- the named Window exists;
- trusted instant is within `[opens_at, closes_at)`, unless the policy declares inclusive close;
- Participation state permits the operation;
- no restriction or pause policy blocks it;
- the effective Schedule Revision matches or is resolved.

### Boundary convention

All time intervals SHOULD use half-open form:

```text
[start_at, end_at)
```

An Event exactly at `end_at` is outside the interval unless a contract explicitly states otherwise.

### Time-zone rules

- Storage is UTC.
- Authoring may use IANA time zones.
- Publication resolves local time to an exact UTC instant.
- Missing or duplicated DST local times require explicit author resolution.
- Fixed numeric offsets are not accepted as a substitute for recurring local schedule rules.
- Presentation timezone is metadata and does not change authoritative UTC.
- Leap seconds follow infrastructure time policy and are never client-calculated.

### Overlap model

Overlapping Editions are allowed by default.

Exclusivity may be declared by:

- group key;
- realm;
- Character scope;
- maximum concurrent active Participations;
- overlap interval;
- priority;
- conflict policy.

Conflict policies are:

- `REJECT_NEW`;
- `QUEUE_PENDING`;
- `REQUIRE_EXIT`;
- `ADMIN_REVIEW`.

Automatic silent exit from another Edition is prohibited.

### Participation completion model

Core completion rules MAY include:

- active through close;
- explicit owner Event received;
- minimum active duration;
- signed external completion fact;
- no disqualification;
- policy expression over Season-owned facts.

A completion rule MUST NOT directly query mutable foreign databases during commit. Required external facts are consumed as versioned Events or local projections.

### Integrity model

Integrity state is separate from lifecycle state:

- `VALID` — no known contradiction;
- `CONTESTED` — evidence or correction requires review;
- `INVALIDATED` — outcome deemed invalid by approved workflow.

Invalidation never deletes ledger history. Reward compensation or external correction remains owned by the relevant Engine.

---

## Events

### Event envelope

Every Season Event uses the exact camelCase canonical envelope from
`002a-platform-contract-standard`. Edition lifecycle Events use
`seasonEditionId` as `partitionKey`; Participation Events use `characterId`
when Character ordering is required. The Event body is always `payload`, never
`data`.

Season Events include canonical subject, aggregate, lineage, replay, realm, and
data-classification fields.

### Envelope requirements

- `eventId` is globally unique.
- `eventType` includes major schema version.
- `occurredAt` is domain effective time.
- `recordedAt` is commit time.
- `partitionKey` preserves aggregate order where required.
- actor is explicit.
- correlation and causation are propagated.
- sensitive data is omitted or referenced.
- payload size is bounded.
- Events are immutable.

### Produced Event catalog

#### Definition and publication

- `season.definition.created.v1`
- `season.definition.version.published.v1`
- `season.definition.version.deprecated.v1`
- `season.edition.approved.v1`
- `season.edition.scheduled.v1`
- `season.manifest.published.v1`

#### Edition lifecycle

- `season.edition.activation.blocked.v1`
- `season.edition.activated.v1`
- `season.edition.paused.v1`
- `season.edition.resumed.v1`
- `season.edition.closing.v1`
- `season.edition.closed.v1`
- `season.edition.cancelled.v1`
- `season.edition.terminated.v1`
- `season.edition.settlement.started.v1`
- `season.edition.finalization.blocked.v1`
- `season.edition.finalized.v1`

#### Schedule and phases

- `season.schedule.revised.v1`
- `season.phase.started.v1`
- `season.phase.ended.v1`
- `season.phase.skipped.v1`
- `season.phase.interrupted.v1`
- `season.window.opened.v1`
- `season.window.closed.v1`

#### Content bindings

- `season.content.binding.activated.v1`
- `season.content.binding.deactivated.v1`
- `season.content.binding.blocked.v1`
- `season.content.binding.corrected.v1`

#### Participation

- `season.participation.pending.v1`
- `season.participation.enrolled.v1`
- `season.participation.rejected.v1`
- `season.participation.activated.v1`
- `season.participation.paused.v1`
- `season.participation.resumed.v1`
- `season.participation.withdrawn.v1`
- `season.participation.exited.v1`
- `season.participation.disqualified.v1`
- `season.participation.completed.v1`
- `season.participation.closed.v1`
- `season.participation.finalized.v1`
- `season.participation.integrity.changed.v1`

#### Invitation and eligibility

- `season.invitation.issued.v1`
- `season.invitation.revoked.v1`
- `season.invitation.redeemed.v1`
- `season.eligibility.evaluated.v1`

#### Operations

- `season.reconciliation.completed.v1`
- `season.backfill.completed.v1`
- `season.integrity.case.opened.v1`
- `season.integrity.case.closed.v1`

#### Canonical naming and compatibility aliases

The canonical v1 lifecycle namespace is `season.edition.*`.

Earlier repository drafts may reference:

- `season.activated.v1`;
- `season.closed.v1`;
- `season.ended.v1`;
- `season.edition.ended.v1`;
- `season.occurrence.changed.v1`.

These names are deprecated aliases and MUST be normalized as follows:

| Deprecated alias | Canonical Event |
|---|---|
| `season.activated.v1` | `season.edition.activated.v1` |
| `season.closed.v1` | `season.edition.closed.v1` |
| `season.ended.v1` | `season.edition.closed.v1` |
| `season.edition.ended.v1` | `season.edition.closed.v1` |
| `season.occurrence.changed.v1` | `season.schedule.revised.v1` |

The Season Engine domain core MUST emit only canonical Events. During migration, a dedicated compatibility adapter MAY derive aliases. Derived aliases MUST include the canonical Event ID, MUST NOT be treated as an additional domain transition, and MUST be disabled after all consumers migrate. New consumers MUST use canonical names.

### Consumed Event catalog

#### Character Events

- `character.created.v1`
- `character.activated.v1`
- `character.suspended.v1`
- `character.restored.v1`
- `character.closed.v1`
- `character.anonymized.v1`

#### Foreign content lifecycle Events

The Engine may consume published, deprecated, retired, quarantined, or readiness Events from Progression, Reward, Achievement, Quest, Talent, Item, and Inventory Engines to validate bindings and settlement gates.

Consumed Events are facts, not permission to mutate foreign state.

#### External qualification Events

Registered providers may publish qualification facts under approved schemas. Unknown producers or unregistered schemas are quarantined.

#### Settlement Events

Examples:

- progression track finalized;
- leaderboard finalized;
- Reward Grant terminal;
- Quest migration complete;
- reconciliation complete.

The exact catalog is registry-driven and bounded by Manifest gate contracts.

### Event ordering

The Engine assumes:

- at-least-once delivery;
- possible duplication;
- possible delay;
- possible reordering across partitions;
- ordered delivery only within a declared partition when provided.

State transitions rely on aggregate version, source sequence where available, effective time, and idempotency identity rather than transport arrival alone.

### Event replay

Replay MUST specify:

- source range;
- target consumer version;
- dry-run or apply mode;
- duplicate policy;
- historical schedule resolution policy;
- side-effect publication policy;
- operator and approval;
- reconciliation plan.

A replay MUST NOT republish historical lifecycle Events as new facts unless explicitly using a correction contract.

---

## Event Contracts

### `season.manifest.published.v1`

```json
{
  "eventId": "4ec9c0ae-e2e9-4a27-bb7c-452f86a8e7b1",
  "eventType": "season.manifest.published.v1",
  "schemaVersion": 1,
  "producer": "season-engine",
  "partitionKey": "3cc2504e-dcde-4f84-a0c9-9805115db819",
  "occurredAt": "2026-03-01T10:00:00Z",
  "recordedAt": "2026-03-01T10:00:00.121Z",
  "actor": {
    "type": "ADMIN",
    "id": "principal-412"
  },
  "correlationId": "9d464e32-aa5b-469e-95d1-ee4049b59a1f",
  "causationId": "81383140-9f9b-4164-b1b1-4f72cff8fae6",
  "payload": {
    "seasonEditionId": "3cc2504e-dcde-4f84-a0c9-9805115db819",
    "seasonDefinitionVersionId": "f50d40cb-b8aa-41ae-a822-d7b3ae833c70",
    "seasonManifestId": "f4e780fb-c7cb-44d1-a2dc-23e2f4136f57",
    "realmId": "platform-eu",
    "editionKey": "summer-2026",
    "manifestSchemaVersion": 1,
    "manifestFingerprint": "sha256:...",
    "initialScheduleRevision": 1
  }
}
```

Contract rules:

- payload never embeds the full Manifest;
- consumers resolve it through an authorized immutable endpoint or registry;
- fingerprint mismatch is fatal;
- publication does not mean activation.

### `season.edition.scheduled.v1`

```json
{
  "eventType": "season.edition.scheduled.v1",
  "payload": {
    "seasonEditionId": "3cc2504e-dcde-4f84-a0c9-9805115db819",
    "seasonManifestId": "f4e780fb-c7cb-44d1-a2dc-23e2f4136f57",
    "scheduleRevision": 1,
    "displayTimezone": "Europe/Berlin",
    "previewOpensAt": "2026-05-01T08:00:00Z",
    "enrollmentOpensAt": "2026-05-15T08:00:00Z",
    "activationAt": "2026-06-01T08:00:00Z",
    "normalCloseAt": "2026-08-31T21:59:59Z",
    "settlementEndsAt": "2026-09-14T21:59:59Z",
    "plannedFinalizationAt": "2026-09-15T08:00:00Z",
    "scheduleFingerprint": "sha256:..."
  }
}
```

### `season.edition.activated.v1`

```json
{
  "eventType": "season.edition.activated.v1",
  "payload": {
    "seasonEditionId": "3cc2504e-dcde-4f84-a0c9-9805115db819",
    "seasonDefinitionId": "0750d541-adcb-42dd-afb1-960cc1f8cff8",
    "seasonDefinitionVersionId": "f50d40cb-b8aa-41ae-a822-d7b3ae833c70",
    "seasonManifestId": "f4e780fb-c7cb-44d1-a2dc-23e2f4136f57",
    "manifestFingerprint": "sha256:...",
    "realmId": "platform-eu",
    "scheduleRevision": 1,
    "activatedAt": "2026-06-01T08:00:00Z",
    "activePhaseKeys": ["main"],
    "activeWindowKeys": ["participation", "progress"],
    "activationReason": "SCHEDULED_TIMER"
  }
}
```

Requirements:

- Event is emitted only after the Edition state commits as Active.
- Retries return the original transition receipt.
- Downstream consumers MUST be idempotent.
- Activation is not rolled back because a consumer is delayed.

### `season.edition.paused.v1`

```json
{
  "eventType": "season.edition.paused.v1",
  "payload": {
    "seasonEditionId": "3cc2504e-dcde-4f84-a0c9-9805115db819",
    "scheduleRevision": 2,
    "pausedAt": "2026-07-03T12:30:00Z",
    "pauseReasonCode": "PLATFORM_INCIDENT",
    "pauseClockPolicy": "EXTEND_BY_PAUSE_DURATION",
    "operationPolicy": {
      "enrollment": "BLOCKED",
      "newProgress": "BLOCKED",
      "claims": "ALLOWED",
      "publicVisibility": "VISIBLE"
    },
    "expectedResumeAt": null
  }
}
```

### `season.edition.resumed.v1`

```json
{
  "eventType": "season.edition.resumed.v1",
  "payload": {
    "seasonEditionId": "3cc2504e-dcde-4f84-a0c9-9805115db819",
    "previousScheduleRevision": 2,
    "newScheduleRevision": 3,
    "resumedAt": "2026-07-04T15:00:00Z",
    "pauseDurationSeconds": 95400,
    "scheduleFingerprint": "sha256:..."
  }
}
```

### `season.schedule.revised.v1`

```json
{
  "eventType": "season.schedule.revised.v1",
  "payload": {
    "seasonEditionId": "3cc2504e-dcde-4f84-a0c9-9805115db819",
    "previousRevision": 3,
    "newRevision": 4,
    "changeType": "EXTENSION",
    "effectiveFrom": "2026-08-20T10:00:00Z",
    "recordedAt": "2026-08-20T10:02:11Z",
    "reasonCode": "SERVICE_INTERRUPTION_COMPENSATION",
    "changedWindows": [
      {
        "windowKey": "progress",
        "oldClosesAt": "2026-08-31T21:59:59Z",
        "newClosesAt": "2026-09-03T21:59:59Z"
      }
    ],
    "scheduleFingerprint": "sha256:...",
    "impactSummary": {
      "activeParticipants": 18421,
      "activeBindings": 14,
      "downstreamAcknowledgementRequired": true
    }
  }
}
```

Old schedule data MUST remain queryable.

### `season.phase.started.v1`

```json
{
  "eventType": "season.phase.started.v1",
  "payload": {
    "seasonEditionId": "3cc2504e-dcde-4f84-a0c9-9805115db819",
    "phaseOccurrenceId": "427035e5-17a0-4446-8465-f85f4505ee30",
    "phaseKey": "finale",
    "phaseKind": "FINALE",
    "laneKey": "content",
    "scheduleRevision": 4,
    "startedAt": "2026-08-20T08:00:00Z",
    "endsAt": "2026-09-03T21:59:59Z"
  }
}
```

### `season.edition.closed.v1`

```json
{
  "eventType": "season.edition.closed.v1",
  "payload": {
    "seasonEditionId": "3cc2504e-dcde-4f84-a0c9-9805115db819",
    "seasonManifestId": "f4e780fb-c7cb-44d1-a2dc-23e2f4136f57",
    "scheduleRevision": 4,
    "closedAt": "2026-09-03T21:59:59Z",
    "closeReason": "SCHEDULED",
    "graceWindows": [
      {
        "windowKey": "late_completion",
        "closesAt": "2026-09-07T21:59:59Z"
      },
      {
        "windowKey": "claims",
        "closesAt": "2026-09-14T21:59:59Z"
      }
    ],
    "settlementEndsAt": "2026-09-14T21:59:59Z"
  }
}
```

Consumers MUST apply their own snapshotted close policies.

### `season.edition.terminated.v1`

```json
{
  "eventType": "season.edition.terminated.v1",
  "payload": {
    "seasonEditionId": "3cc2504e-dcde-4f84-a0c9-9805115db819",
    "terminatedAt": "2026-07-11T16:00:00Z",
    "reasonCode": "REGULATORY_RESTRICTION",
    "impactPolicyRevision": "termination-policy-3",
    "participationOutcomePolicy": "CLOSE_WITHOUT_COMPLETION",
    "claimPolicy": "ALLOW_ALREADY_EARNED",
    "settlementRequired": true
  }
}
```

### `season.edition.finalized.v1`

```json
{
  "eventType": "season.edition.finalized.v1",
  "payload": {
    "seasonEditionId": "3cc2504e-dcde-4f84-a0c9-9805115db819",
    "seasonManifestId": "f4e780fb-c7cb-44d1-a2dc-23e2f4136f57",
    "finalScheduleRevision": 4,
    "finalizedAt": "2026-09-15T08:04:18Z",
    "outcome": "COMPLETED",
    "participantSummary": {
      "enrolled": 20114,
      "activated": 19482,
      "completed": 13921,
      "disqualified": 17,
      "exited": 842
    },
    "settlementSummary": {
      "mandatoryGates": 6,
      "passed": 6,
      "waived": 0,
      "openIntegrityCases": 0
    },
    "finalizationFingerprint": "sha256:..."
  }
}
```

Participant summary is informational and derived from a sealed projection revision. Individual facts remain authoritative in Participation Aggregates.

### `season.content.binding.activated.v1`

```json
{
  "eventType": "season.content.binding.activated.v1",
  "payload": {
    "seasonEditionId": "3cc2504e-dcde-4f84-a0c9-9805115db819",
    "bindingId": "7b50b442-b195-403f-bf0f-67e225a3a0ad",
    "ownerEngine": "quest-engine",
    "resourceType": "QUEST_EDITION",
    "resourceId": "113e0b40-9dcb-4594-a7af-f4dd1bc86935",
    "resourceFingerprint": "sha256:...",
    "activationPolicyRevision": "binding-policy-1",
    "scheduleRevision": 4,
    "activatedAt": "2026-08-20T08:00:00Z",
    "seasonContext": {
      "phaseKey": "finale",
      "windowKeys": ["progress"]
    }
  }
}
```

The Event is an activation fact, not a command to bypass the target Engine's own validation.

### `season.participation.enrolled.v1`

```json
{
  "eventType": "season.participation.enrolled.v1",
  "payload": {
    "seasonParticipationId": "20af38a2-8f42-499e-9870-f205a93f61d0",
    "seasonEditionId": "3cc2504e-dcde-4f84-a0c9-9805115db819",
    "characterId": "561a95e7-cce7-4b38-8cf6-b77ee486c00d",
    "entryMode": "OPT_IN",
    "entrySourceId": "cmd:9f47a640",
    "policyRevision": "participation-policy-2",
    "eligibilityDecisionId": "b4df034e-4fd6-4fe5-a244-7449de3bf249",
    "enrolledAt": "2026-05-17T14:41:00Z",
    "effectiveScheduleRevision": 1
  }
}
```

### `season.participation.completed.v1`

```json
{
  "eventType": "season.participation.completed.v1",
  "payload": {
    "seasonParticipationId": "20af38a2-8f42-499e-9870-f205a93f61d0",
    "seasonEditionId": "3cc2504e-dcde-4f84-a0c9-9805115db819",
    "characterId": "561a95e7-cce7-4b38-8cf6-b77ee486c00d",
    "completedAt": "2026-09-03T21:59:59Z",
    "completionRuleRevision": "completion-rule-1",
    "completionEvidenceRefs": [
      "fact:leaderboard-participation:4d6803",
      "fact:active-through-close:20af38"
    ],
    "manifestFingerprint": "sha256:...",
    "integrityState": "VALID"
  }
}
```

Reward Engine MAY bind this Event to Rewards. Season Engine does not include Reward status.

### `season.participation.disqualified.v1`

```json
{
  "eventType": "season.participation.disqualified.v1",
  "payload": {
    "seasonParticipationId": "20af38a2-8f42-499e-9870-f205a93f61d0",
    "seasonEditionId": "3cc2504e-dcde-4f84-a0c9-9805115db819",
    "characterId": "561a95e7-cce7-4b38-8cf6-b77ee486c00d",
    "disqualifiedAt": "2026-08-28T10:22:18Z",
    "reasonCode": "APPROVED_INTEGRITY_DECISION",
    "decisionId": "integrity-decision-901",
    "appealPolicyRevision": "appeal-policy-1",
    "priorState": "ACTIVE"
  }
}
```

Sensitive evidence is referenced, not embedded.

### `season.eligibility.evaluated.v1`

```json
{
  "eventType": "season.eligibility.evaluated.v1",
  "payload": {
    "eligibilityDecisionId": "b4df034e-4fd6-4fe5-a244-7449de3bf249",
    "seasonEditionId": "3cc2504e-dcde-4f84-a0c9-9805115db819",
    "characterId": "561a95e7-cce7-4b38-8cf6-b77ee486c00d",
    "evaluationPoint": "ENROLLMENT",
    "policyRevision": "eligibility-policy-5",
    "result": "ELIGIBLE",
    "reasonCodes": ["REALM_MEMBER", "MINIMUM_LEVEL_MET"],
    "factRevisionVector": {
      "character": 19,
      "progression/core": 74,
      "inventory": 31
    },
    "evaluatedAt": "2026-05-17T14:40:59Z",
    "expiresAt": "2026-05-17T14:45:59Z"
  }
}
```

### `season.context.resolved.v1`

This Event is OPTIONAL and SHOULD be used only where asynchronous context assignment is required.

```json
{
  "eventType": "season.context.resolved.v1",
  "payload": {
    "resolutionId": "c3da514c-a886-4980-b460-fe5653dd1fe5",
    "seasonEditionId": "3cc2504e-dcde-4f84-a0c9-9805115db819",
    "seasonManifestId": "f4e780fb-c7cb-44d1-a2dc-23e2f4136f57",
    "scheduleRevision": 4,
    "resolvedForOccurredAt": "2026-08-25T18:04:00Z",
    "phaseKeys": ["finale"],
    "windowKeys": ["progress"],
    "participationId": "20af38a2-8f42-499e-9870-f205a93f61d0",
    "participationState": "ACTIVE",
    "resolutionPolicyRevision": "context-policy-1"
  }
}
```

### Error Event policy

Normal command validation failures SHOULD return command receipts and audit records, not publish domain failure Events.

Operationally significant asynchronous failures MAY publish:

- `season.operation.blocked.v1`;
- `season.dependency.unavailable.v1`;
- `season.integrity.case.opened.v1`.

Failure Events MUST NOT expose hidden content or personal evidence.

### Contract compatibility

- Additive optional fields are backward compatible.
- Renaming, removing, changing meaning, or changing units requires a new major Event version.
- Enums are closed unless the schema explicitly declares unknown handling.
- Consumers MUST quarantine unsupported major versions.
- Event examples in this RFC are illustrative; registered schemas are normative.

---

## Read Models

Read models are derived query representations. They MUST NOT be used as command write stores.

### Season Catalog

Purpose:

- list discoverable current and upcoming Editions;
- support realm, status, tag, time, and audience filters;
- expose only authorized narrative and schedule data.

Fields SHOULD include:

- Edition ID and key;
- Definition key;
- title, summary, and visual references;
- realm;
- visibility state;
- lifecycle state suitable for the caller;
- preview, enrollment, activation, and close instants;
- current or next phase;
- participation mode;
- owner Participation summary when authorized;
- Manifest and Schedule Revision;
- `asOf`.

Hidden bindings, secret phases, internal reasons, and exact audience predicates MUST be omitted.

### Season Detail

Provides one authorized Edition view:

- narrative;
- timeline;
- current phase;
- windows;
- participation policy summary;
- visible content bindings;
- owner participation;
- completion and claim guidance;
- pause or extension notices;
- archive summary;
- accessibility metadata;
- revision and freshness.

The client MUST NOT infer authorization from missing fields.

### Current Season Context

Optimized strongly consistent or low-latency view answering:

```yaml
realmId: string
trustedInstant: instant
activeEditions:
  - seasonEditionId: uuid
    manifestId: uuid
    scheduleRevision: integer
    phaseKeys: [string]
    windowKeys: [string]
    lifecycleState: string
resolvedAt: instant
```

An internal variant may include Participation state and exact binding identities.

### Character Season Portfolio

Lists a Character's:

- upcoming enrollments;
- active Participations;
- paused Participations;
- completed and finalized history;
- invitations;
- pending qualification decisions;
- visible claim deadlines as supplied by authorized Reward projections;
- integrity notices suitable for the owner.

This model joins only through projections. Season Engine remains authoritative only for its fields.

### Participation Detail

Contains:

- Participation identity;
- Edition identity;
- entry mode and timestamp;
- state and state history;
- effective policy and Schedule Revision;
- eligibility explanation;
- exit or disqualification reason safe for the caller;
- completion and finalization facts;
- integrity state;
- linked foreign summaries clearly marked as projections.

### Season Timeline

An ordered, immutable view of:

- initial schedule;
- phase boundaries;
- pauses;
- resumptions;
- extensions;
- early close;
- termination;
- close;
- settlement;
- finalization.

Every row includes effective and recorded time so retroactive corrections are visible.

### Public Archive

For finalized public Seasons:

- narrative summary;
- final timeline;
- public participation statistics;
- public content references;
- outcome summary;
- archive visibility.

It MUST NOT expose private participant identities, hidden content, integrity evidence, or internal operational reasons.

### Authoring Dashboard

Provides:

- Definition and Version lifecycle;
- validation reports;
- dependency readiness;
- schedule preview;
- overlap and exclusivity conflicts;
- estimated audience;
- approval state;
- publication fingerprint;
- impact preview.

### Operations Dashboard

Provides:

- due and failed timers;
- activation blocks;
- phase drift;
- close and finalization gates;
- outbox lag;
- projection lag;
- dependency health;
- open integrity cases;
- bulk job progress;
- reconciliation status.

### Settlement Dashboard

Provides per gate:

- gate key and type;
- owner system;
- expected fact;
- current status;
- first blocked time;
- last checked time;
- waiver eligibility;
- evidence reference;
- timeout policy.

### Schedule Diff

Shows a human-readable and machine-readable comparison between revisions:

- changed phases;
- changed windows;
- added or removed pause intervals;
- deadlines moved;
- affected bindings;
- estimated participants affected;
- downstream acknowledgement status.

### Content Binding Projection

Indexes exact foreign references by:

- Edition;
- owner Engine;
- resource type;
- activation phase;
- lifecycle;
- required or optional status;
- last observed readiness;
- dependency fingerprint.

### Internal Eligibility Projection

Stores bounded facts required for eligibility evaluation. It MUST:

- record source owner and revision;
- expire stale facts according to contract;
- avoid copying unnecessary personal data;
- be rebuildable from authoritative Events;
- never become the source of foreign truth.

### Projection consistency

Every projection MUST expose at least one of:

- source aggregate version;
- Manifest fingerprint;
- Schedule Revision;
- projection sequence;
- `asOf`.

Sensitive operations such as enrollment, exit, schedule revision, pause, close, and finalization MUST re-read authoritative state rather than trusting a stale projection.

### Cache policy

- Public catalog may be cached by realm and revision.
- Owner Participation views may be privately cached with short TTL and explicit invalidation.
- Hidden and invitation-only content MUST NOT use shared public caches.
- Cache keys MUST include authorization scope, locale, realm, visibility, Manifest revision, and Schedule Revision where applicable.
- A stale cache MUST never be used to authorize enrollment or a write.

---

## Write Models

All writes are commands. External callers MUST NOT write database rows directly.

### Common command envelope

```json
{
  "commandId": "uuid",
  "commandType": "season.edition.pause.v1",
  "idempotencyKey": "caller-stable-key",
  "expectedAggregateVersion": 17,
  "actor": {
    "type": "ADMIN",
    "id": "principal-412"
  },
  "realmId": "platform-eu",
  "correlationId": "uuid",
  "causationId": "uuid",
  "requestedAt": "2026-07-03T12:29:58Z",
  "reasonCode": "PLATFORM_INCIDENT",
  "data": {}
}
```

### Common command rules

- `commandId` is unique.
- `idempotencyKey` is stable for one logical request.
- same idempotency key with a different canonical payload is rejected.
- expected aggregate version is required for administrative edits unless the endpoint defines a safe blind command.
- actor identity comes from authentication, not request body alone.
- client `requestedAt` is informational.
- commands return durable receipts.
- successful commands publish Events through the outbox.
- rejected commands do not partially mutate state.

### Definition commands

#### CreateSeasonDefinition

Creates stable identity and draft lifecycle.

Required:

- stable key;
- owner scope;
- governance owner;
- default realm policy;
- idempotency key.

#### CreateSeasonDefinitionVersion

Creates an editable draft Version from an optional base Version.

Cloning copies content but creates a new identity and fingerprint after changes.

#### SubmitSeasonVersionForValidation

Freezes the validation candidate revision and starts deterministic checks.

#### ApproveSeasonVersion

Records governance approval. The approving principal MUST satisfy separation-of-duties policy.

#### PublishSeasonVersion

Publishes an immutable Version. Publication requires a matching approved content fingerprint.

#### DeprecateSeasonVersion

Prevents new use according to policy but preserves existing Editions.

### Edition authoring commands

#### CreateSeasonEdition

Creates a Draft Edition referencing one published Version.

Required fields:

- Edition key;
- realm;
- display timezone;
- proposed schedule;
- binding proposals;
- visibility;
- exclusivity;
- owner metadata.

#### CompileSeasonManifest

Resolves exact references, validates policies, canonicalizes content, and creates a candidate Manifest.

Compilation does not publish.

#### ValidateSeasonEdition

Runs complete release validation and stores a report.

#### ApproveSeasonEdition

Records release approval and impact acknowledgement.

#### PublishAndScheduleSeasonEdition

Atomically:

- publishes the immutable Manifest;
- creates Schedule Revision `1`;
- creates phase and window occurrences;
- creates timers;
- moves Edition to `SCHEDULED`;
- emits publication and scheduled Events.

If any step fails, none commit.

### Edition lifecycle commands

#### ActivateSeasonEdition

Inputs:

- Edition ID;
- expected version;
- effective instant;
- activation source;
- expected Schedule Revision.

Preconditions:

- state is Scheduled or Activation Blocked;
- effective activation window permits;
- required dependencies are ready or waived;
- no conflicting active exclusivity condition;
- Manifest fingerprint matches;
- activation timer is current.

#### PauseSeasonEdition

Inputs:

- effective pause time;
- reason;
- operation policy;
- expected duration if known;
- pause clock policy confirmation;
- impact preview revision.

High-impact pause may require two-person approval.

#### ResumeSeasonEdition

Inputs:

- effective resume time;
- revised schedule proposal when required;
- impact preview;
- expected pause transition.

#### ExtendSeasonEdition

Creates a Schedule Revision. It MUST:

- identify changed windows;
- preserve or extend previously published deadlines;
- validate dependent binding policy;
- publish impact;
- supersede relevant future timers;
- create replacement timers atomically.

#### CloseSeasonEdition

May be scheduled or manual. It commits close state and grace/settlement facts locally.

#### TerminateSeasonEdition

Requires elevated authorization, reason, impact policy, and settlement plan.

#### CancelSeasonEdition

Allowed only when the Edition has never activated.

#### FinalizeSeasonEdition

Checks all mandatory settlement gates, reconciliation status, open integrity cases, and finalization approval.

#### WaiveSettlementGate

Requires:

- named gate;
- waiver reason;
- evidence;
- approved role;
- optional second approver;
- audit annotation.

Waiver never pretends the gate passed.

### Phase commands

#### StartPhase

Normally timer-driven. It verifies expected Edition lifecycle, Schedule Revision, phase lane, and due time.

#### EndPhase

Ends a started phase and activates dependent next phases only through separate committed commands.

#### SkipPhase

Allowed only before start through an approved Schedule Revision.

#### InterruptPhase

Used by termination or correction after start.

### Participation commands

#### EvaluateSeasonEligibility

Produces a durable Eligibility Decision from a pinned policy and fact revision vector.

#### EnrollCharacterInSeason

Inputs:

- Edition;
- Character;
- entry mode;
- invitation or qualification reference where needed;
- eligibility decision or request to evaluate;
- idempotency key.

The command atomically checks:

- Character lifecycle;
- Edition and entry window;
- participation policy;
- existing Participation;
- eligibility freshness;
- Invitation validity;
- exclusivity;
- capacity policy if any.

#### RedeemSeasonInvitation

Consumes Invitation usage and creates or resolves Participation in one transaction.

#### ActivateSeasonParticipation

Usually follows Edition activation or enrollment into an already Active Edition.

#### WithdrawSeasonParticipation

Applies only when policy and state allow.

#### ExitSeasonParticipation

Requires exit reason and policy evaluation.

#### PauseSeasonParticipation

Used for Character suspension or integrity review.

#### ResumeSeasonParticipation

Revalidates applicable lifecycle and policy.

#### DisqualifySeasonParticipation

Requires elevated role, decision reference, reason, and appeal policy.

#### CompleteSeasonParticipation

Evaluates Season-owned completion rule and signed external facts.

#### CloseSeasonParticipation

Moves remaining non-terminal Participations into closure state according to policy.

#### FinalizeSeasonParticipation

Seals outcome under the Edition finalization revision.

### Invitation commands

- `IssueSeasonInvitation`
- `IssueInvitationBatch`
- `RevokeSeasonInvitation`
- `RedeemSeasonInvitation`
- `ExpireSeasonInvitation`

Invitation secrets are returned only once and stored hashed.

### Schedule correction commands

#### CorrectScheduleRevision

Used for factual errors rather than product extensions.

It MUST state:

- erroneous revision;
- corrected facts;
- effective time;
- recorded time;
- reason;
- user impact;
- affected decisions;
- whether backfill is required.

Backdating is restricted.

#### ReevaluateTemporalDecision

Recomputes one prior context or eligibility decision under a named correction policy. It creates a new decision and links the superseded decision.

### Integrity commands

- `OpenSeasonIntegrityCase`
- `ContestSeasonParticipation`
- `InvalidateSeasonParticipation`
- `RestoreSeasonParticipationIntegrity`
- `CloseSeasonIntegrityCase`

Integrity commands append state and never remove original evidence.

### Bulk commands

- `StartAutoEnrollmentJob`
- `StartEligibilityBackfillJob`
- `StartParticipationCloseJob`
- `StartParticipationFinalizationJob`
- `StartContextRebuildJob`
- `StartProjectionRebuildJob`
- `CancelBulkJob`
- `ResumeBulkJob`

Bulk jobs are resumable, partitioned, rate limited, and idempotent per target.

### Internal timer command

```json
{
  "commandType": "season.timer.execute.v1",
  "timerId": "uuid",
  "targetAggregateId": "uuid",
  "targetCommandType": "season.phase.start.v1",
  "expectedAggregateVersion": 22,
  "expectedScheduleRevision": 4,
  "dueAt": "2026-08-20T08:00:00Z",
  "leaseId": "worker-lease-uuid"
}
```

### Command receipts

Every command receipt includes:

- command ID;
- idempotency key;
- canonical request fingerprint;
- aggregate identity;
- previous and resulting aggregate version;
- status;
- result code;
- transition identity;
- Event IDs;
- committed at;
- retry classification.

The original receipt is returned for idempotent replay.

### Error model

Core error codes include:

- `SEASON_NOT_FOUND`;
- `EDITION_NOT_FOUND`;
- `PARTICIPATION_NOT_FOUND`;
- `MANIFEST_NOT_PUBLISHED`;
- `MANIFEST_FINGERPRINT_MISMATCH`;
- `INVALID_LIFECYCLE_TRANSITION`;
- `AGGREGATE_VERSION_CONFLICT`;
- `IDEMPOTENCY_PAYLOAD_CONFLICT`;
- `WINDOW_CLOSED`;
- `EDITION_NOT_ACTIVE`;
- `EDITION_PAUSED`;
- `CHARACTER_NOT_ELIGIBLE`;
- `ELIGIBILITY_STALE`;
- `INVITATION_INVALID`;
- `INVITATION_EXPIRED`;
- `EXCLUSIVITY_CONFLICT`;
- `SCHEDULE_CONFLICT`;
- `DEPENDENCY_NOT_READY`;
- `SETTLEMENT_GATE_BLOCKED`;
- `FINALIZATION_BLOCKED`;
- `HIDDEN_RESOURCE`;
- `AUTHORIZATION_DENIED`;
- `RATE_LIMITED`;
- `INTEGRITY_REVIEW_REQUIRED`.

Unauthorized hidden resources SHOULD return a non-enumerating not-found response.

---

## Database Schema

The following PostgreSQL-oriented schema is a reference model. Equivalent implementations MUST preserve the same ownership, immutability, uniqueness, and transactional guarantees.

### Extensions and conventions

Recommended:

```sql
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS btree_gist;
```

Conventions:

- identifiers use UUID;
- timestamps use `timestamptz`;
- quantities and counters use integer or bigint;
- canonical payloads use bounded `jsonb`;
- hashes use bytea or normalized text;
- lifecycle enums MAY use lookup tables for online evolution;
- all tables include creation metadata where operationally required;
- soft deletion is not used to erase authoritative history.

### `season_definitions`

```sql
CREATE TABLE season_definitions (
    season_definition_id        uuid PRIMARY KEY,
    season_key                  text NOT NULL,
    owner_scope                 text NOT NULL,
    lifecycle_state             text NOT NULL,
    latest_version_number       integer NOT NULL DEFAULT 0,
    governance_owner            text NOT NULL,
    aggregate_version           bigint NOT NULL DEFAULT 0,
    created_at                  timestamptz NOT NULL,
    created_by                  text NOT NULL,
    updated_at                  timestamptz NOT NULL,
    CONSTRAINT uq_season_definition_key UNIQUE (owner_scope, season_key),
    CONSTRAINT ck_season_definition_state
      CHECK (lifecycle_state IN ('DRAFT','ACTIVE','DEPRECATED','ARCHIVED'))
);
```

### `season_definition_versions`

```sql
CREATE TABLE season_definition_versions (
    season_definition_version_id uuid PRIMARY KEY,
    season_definition_id         uuid NOT NULL REFERENCES season_definitions,
    version_number               integer NOT NULL,
    lifecycle_state              text NOT NULL,
    schema_version               integer NOT NULL,
    authored_content             jsonb NOT NULL,
    content_fingerprint          text NOT NULL,
    validation_report_id         uuid,
    approved_at                  timestamptz,
    approved_by                  text,
    published_at                 timestamptz,
    published_by                 text,
    deprecated_at                timestamptz,
    aggregate_version            bigint NOT NULL DEFAULT 0,
    created_at                   timestamptz NOT NULL,
    created_by                   text NOT NULL,
    CONSTRAINT uq_season_definition_version
      UNIQUE (season_definition_id, version_number),
    CONSTRAINT uq_season_version_fingerprint
      UNIQUE (season_definition_id, content_fingerprint),
    CONSTRAINT ck_season_version_state
      CHECK (lifecycle_state IN
        ('DRAFT','VALIDATING','APPROVED','PUBLISHED','DEPRECATED','REJECTED'))
);
```

Published rows MUST be protected by a trigger or restricted role that rejects updates to authored content, schema version, and fingerprint.

### `season_editions`

```sql
CREATE TABLE season_editions (
    season_edition_id             uuid PRIMARY KEY,
    season_definition_id          uuid NOT NULL REFERENCES season_definitions,
    season_definition_version_id  uuid NOT NULL REFERENCES season_definition_versions,
    season_manifest_id            uuid,
    realm_id                      text NOT NULL,
    edition_key                   text NOT NULL,
    lifecycle_state               text NOT NULL,
    visibility_state              text NOT NULL,
    current_schedule_revision     integer NOT NULL DEFAULT 0,
    display_timezone              text NOT NULL,
    exclusivity_group_key         text,
    activated_at                  timestamptz,
    closed_at                     timestamptz,
    finalized_at                  timestamptz,
    cancelled_at                  timestamptz,
    terminated_at                 timestamptz,
    aggregate_version             bigint NOT NULL DEFAULT 0,
    created_at                    timestamptz NOT NULL,
    created_by                    text NOT NULL,
    updated_at                    timestamptz NOT NULL,
    CONSTRAINT uq_season_edition_key UNIQUE (realm_id, edition_key),
    CONSTRAINT ck_season_edition_state CHECK (lifecycle_state IN (
      'DRAFT','VALIDATING','REJECTED','APPROVED','SCHEDULED',
      'ACTIVATING','ACTIVATION_BLOCKED','ACTIVE','PAUSED',
      'TERMINATING','TERMINATED','CLOSING','CLOSED','SETTLING',
      'FINALIZING','FINALIZATION_BLOCKED','FINALIZED','CANCELLED'
    )),
    CONSTRAINT ck_season_visibility
      CHECK (visibility_state IN ('HIDDEN','PREVIEW','DISCOVERABLE','ARCHIVED'))
);
```

### `season_manifests`

```sql
CREATE TABLE season_manifests (
    season_manifest_id           uuid PRIMARY KEY,
    season_edition_id            uuid NOT NULL UNIQUE REFERENCES season_editions,
    manifest_schema_version      integer NOT NULL,
    canonical_manifest           jsonb NOT NULL,
    manifest_fingerprint         text NOT NULL UNIQUE,
    binding_count                integer NOT NULL,
    phase_count                  integer NOT NULL,
    published_at                 timestamptz NOT NULL,
    published_by                 text NOT NULL,
    CONSTRAINT ck_manifest_binding_count CHECK (binding_count >= 0),
    CONSTRAINT ck_manifest_phase_count CHECK (phase_count >= 0)
);
```

Published Manifest rows are immutable.

### `season_content_bindings`

```sql
CREATE TABLE season_content_bindings (
    binding_id                   uuid PRIMARY KEY,
    season_manifest_id           uuid NOT NULL REFERENCES season_manifests,
    binding_key                  text NOT NULL,
    owner_engine                 text NOT NULL,
    resource_type                text NOT NULL,
    resource_id                  text NOT NULL,
    resource_fingerprint         text NOT NULL,
    activation_phase_key         text,
    activation_window_key        text,
    close_policy                 text NOT NULL,
    dependency_requirement       text NOT NULL,
    visibility_policy            jsonb NOT NULL DEFAULT '{}'::jsonb,
    contract_version             integer NOT NULL,
    ordinal                      integer NOT NULL,
    CONSTRAINT uq_season_binding_key
      UNIQUE (season_manifest_id, binding_key),
    CONSTRAINT uq_season_binding_resource
      UNIQUE (season_manifest_id, owner_engine, resource_type, resource_id),
    CONSTRAINT ck_dependency_requirement
      CHECK (dependency_requirement IN ('REQUIRED','OPTIONAL','INFORMATIONAL'))
);
```

### `season_schedule_revisions`

```sql
CREATE TABLE season_schedule_revisions (
    schedule_revision_id         uuid PRIMARY KEY,
    season_edition_id            uuid NOT NULL REFERENCES season_editions,
    revision_number              integer NOT NULL,
    lifecycle_state              text NOT NULL,
    change_type                  text NOT NULL,
    effective_from               timestamptz NOT NULL,
    recorded_at                  timestamptz NOT NULL,
    display_timezone             text NOT NULL,
    reason_code                  text NOT NULL,
    canonical_schedule           jsonb NOT NULL,
    schedule_fingerprint         text NOT NULL,
    supersedes_revision          integer,
    approved_by                  text NOT NULL,
    approval_id                  uuid,
    CONSTRAINT uq_schedule_revision
      UNIQUE (season_edition_id, revision_number),
    CONSTRAINT uq_schedule_fingerprint
      UNIQUE (season_edition_id, schedule_fingerprint),
    CONSTRAINT ck_schedule_revision_state
      CHECK (lifecycle_state IN ('PROPOSED','VALIDATED','APPROVED','EFFECTIVE','REJECTED'))
);
```

### `season_phase_occurrences`

```sql
CREATE TABLE season_phase_occurrences (
    phase_occurrence_id          uuid PRIMARY KEY,
    season_edition_id            uuid NOT NULL REFERENCES season_editions,
    schedule_revision_id         uuid NOT NULL REFERENCES season_schedule_revisions,
    phase_key                    text NOT NULL,
    phase_kind                   text NOT NULL,
    lane_key                     text NOT NULL,
    starts_at                    timestamptz NOT NULL,
    ends_at                      timestamptz NOT NULL,
    lifecycle_state              text NOT NULL,
    started_at                   timestamptz,
    ended_at                     timestamptz,
    aggregate_version            bigint NOT NULL DEFAULT 0,
    CONSTRAINT ck_phase_interval CHECK (starts_at < ends_at),
    CONSTRAINT uq_phase_revision_key
      UNIQUE (schedule_revision_id, phase_key, lane_key),
    CONSTRAINT ck_phase_state
      CHECK (lifecycle_state IN ('PLANNED','STARTED','ENDED','SKIPPED','INTERRUPTED'))
);
```

For effective phase rows, an exclusion constraint SHOULD prevent overlap in one lane:

```sql
ALTER TABLE season_phase_occurrences
ADD CONSTRAINT ex_phase_lane_overlap
EXCLUDE USING gist (
  season_edition_id WITH =,
  schedule_revision_id WITH =,
  lane_key WITH =,
  tstzrange(starts_at, ends_at, '[)') WITH &&
);
```

### `season_windows`

```sql
CREATE TABLE season_windows (
    season_window_id             uuid PRIMARY KEY,
    season_edition_id            uuid NOT NULL REFERENCES season_editions,
    schedule_revision_id         uuid NOT NULL REFERENCES season_schedule_revisions,
    window_key                   text NOT NULL,
    opens_at                     timestamptz NOT NULL,
    closes_at                    timestamptz NOT NULL,
    operation_policy             jsonb NOT NULL,
    CONSTRAINT ck_season_window_interval CHECK (opens_at < closes_at),
    CONSTRAINT uq_season_window
      UNIQUE (schedule_revision_id, window_key)
);
```

### `season_pause_intervals`

```sql
CREATE TABLE season_pause_intervals (
    pause_interval_id            uuid PRIMARY KEY,
    season_edition_id            uuid NOT NULL REFERENCES season_editions,
    schedule_revision_id         uuid NOT NULL REFERENCES season_schedule_revisions,
    paused_at                    timestamptz NOT NULL,
    resumed_at                   timestamptz,
    reason_code                  text NOT NULL,
    pause_clock_policy           text NOT NULL,
    operation_policy             jsonb NOT NULL,
    CONSTRAINT ck_pause_interval
      CHECK (resumed_at IS NULL OR paused_at < resumed_at)
);
```

### `season_participations`

```sql
CREATE TABLE season_participations (
    season_participation_id      uuid PRIMARY KEY,
    season_edition_id            uuid NOT NULL REFERENCES season_editions,
    character_id                 uuid,
    pseudonymous_character_key   text,
    entry_mode                   text NOT NULL,
    entry_source_id              text NOT NULL,
    lifecycle_state              text NOT NULL,
    policy_revision              text NOT NULL,
    eligibility_decision_id      uuid,
    effective_schedule_revision  integer NOT NULL,
    integrity_state              text NOT NULL DEFAULT 'VALID',
    reason_code                  text,
    enrolled_at                  timestamptz,
    activated_at                 timestamptz,
    completed_at                 timestamptz,
    exited_at                    timestamptz,
    disqualified_at              timestamptz,
    closed_at                    timestamptz,
    finalized_at                 timestamptz,
    aggregate_version            bigint NOT NULL DEFAULT 0,
    created_at                   timestamptz NOT NULL,
    updated_at                   timestamptz NOT NULL,
    CONSTRAINT ck_participation_identity
      CHECK (
        (character_id IS NOT NULL AND pseudonymous_character_key IS NULL) OR
        (character_id IS NULL AND pseudonymous_character_key IS NOT NULL)
      ),
    CONSTRAINT ck_participation_state CHECK (lifecycle_state IN (
      'PENDING','REJECTED','ENROLLED','ACTIVE','PAUSED','WITHDRAWN',
      'EXITED','DISQUALIFIED','COMPLETED','CLOSED','FINALIZED'
    )),
    CONSTRAINT ck_participation_integrity
      CHECK (integrity_state IN ('VALID','CONTESTED','INVALIDATED'))
);
```

Partial unique indexes preserve identity before and after anonymization:

```sql
CREATE UNIQUE INDEX uq_participation_character
ON season_participations (season_edition_id, character_id)
WHERE character_id IS NOT NULL;

CREATE UNIQUE INDEX uq_participation_pseudonym
ON season_participations (season_edition_id, pseudonymous_character_key)
WHERE pseudonymous_character_key IS NOT NULL;
```

### `season_eligibility_decisions`

```sql
CREATE TABLE season_eligibility_decisions (
    eligibility_decision_id     uuid PRIMARY KEY,
    season_edition_id            uuid NOT NULL REFERENCES season_editions,
    character_id                 uuid NOT NULL,
    policy_revision              text NOT NULL,
    evaluation_point             text NOT NULL,
    result                       text NOT NULL,
    fact_revision_vector         jsonb NOT NULL,
    reason_codes                 jsonb NOT NULL,
    evidence_refs                jsonb NOT NULL,
    evaluated_at                 timestamptz NOT NULL,
    expires_at                   timestamptz,
    supersedes_decision_id       uuid,
    decision_fingerprint         text NOT NULL,
    CONSTRAINT ck_eligibility_result
      CHECK (result IN ('ELIGIBLE','INELIGIBLE','UNKNOWN','REVIEW'))
);
```

### `season_invitations`

```sql
CREATE TABLE season_invitations (
    season_invitation_id         uuid PRIMARY KEY,
    season_edition_id            uuid NOT NULL REFERENCES season_editions,
    token_hash                   text NOT NULL UNIQUE,
    invitation_scope             jsonb NOT NULL,
    usage_limit                  integer NOT NULL,
    redeemed_count               integer NOT NULL DEFAULT 0,
    lifecycle_state              text NOT NULL,
    expires_at                   timestamptz NOT NULL,
    issued_at                    timestamptz NOT NULL,
    issued_by                    text NOT NULL,
    revoked_at                   timestamptz,
    revoked_by                   text,
    aggregate_version            bigint NOT NULL DEFAULT 0,
    CONSTRAINT ck_invitation_usage
      CHECK (usage_limit > 0 AND redeemed_count >= 0 AND redeemed_count <= usage_limit),
    CONSTRAINT ck_invitation_state
      CHECK (lifecycle_state IN ('ACTIVE','EXHAUSTED','EXPIRED','REVOKED'))
);
```

### `season_invitation_redemptions`

```sql
CREATE TABLE season_invitation_redemptions (
    redemption_id                uuid PRIMARY KEY,
    season_invitation_id         uuid NOT NULL REFERENCES season_invitations,
    character_id                 uuid NOT NULL,
    season_participation_id      uuid NOT NULL REFERENCES season_participations,
    command_id                   uuid NOT NULL,
    redeemed_at                  timestamptz NOT NULL,
    CONSTRAINT uq_invitation_character
      UNIQUE (season_invitation_id, character_id),
    CONSTRAINT uq_invitation_command UNIQUE (command_id)
);
```

### `season_lifecycle_ledger`

```sql
CREATE TABLE season_lifecycle_ledger (
    lifecycle_entry_id           uuid PRIMARY KEY,
    aggregate_type               text NOT NULL,
    aggregate_id                 uuid NOT NULL,
    sequence_number              bigint NOT NULL,
    previous_state               text,
    new_state                    text NOT NULL,
    transition_type              text NOT NULL,
    effective_at                 timestamptz NOT NULL,
    recorded_at                  timestamptz NOT NULL,
    actor_type                   text NOT NULL,
    actor_id                     text NOT NULL,
    command_id                   uuid,
    source_event_id              uuid,
    reason_code                  text NOT NULL,
    manifest_fingerprint         text,
    schedule_revision            integer,
    correlation_id               uuid,
    causation_id                 uuid,
    metadata                     jsonb NOT NULL DEFAULT '{}'::jsonb,
    previous_entry_hash          text,
    entry_hash                   text NOT NULL,
    CONSTRAINT uq_lifecycle_sequence
      UNIQUE (aggregate_type, aggregate_id, sequence_number),
    CONSTRAINT uq_lifecycle_command
      UNIQUE (aggregate_type, aggregate_id, command_id)
);
```

Ledger rows are append-only.

### `season_timers`

```sql
CREATE TABLE season_timers (
    season_timer_id              uuid PRIMARY KEY,
    season_edition_id            uuid NOT NULL REFERENCES season_editions,
    target_aggregate_type        text NOT NULL,
    target_aggregate_id          uuid NOT NULL,
    timer_type                   text NOT NULL,
    due_at                       timestamptz NOT NULL,
    expected_aggregate_version   bigint,
    expected_schedule_revision   integer NOT NULL,
    lifecycle_state              text NOT NULL,
    idempotency_key              text NOT NULL,
    lease_id                     uuid,
    lease_expires_at             timestamptz,
    attempt_count                integer NOT NULL DEFAULT 0,
    last_error_code              text,
    created_at                   timestamptz NOT NULL,
    executed_at                  timestamptz,
    CONSTRAINT uq_season_timer_idempotency UNIQUE (idempotency_key),
    CONSTRAINT ck_season_timer_state
      CHECK (lifecycle_state IN
        ('PENDING','CLAIMED','RETRY','EXECUTED','SUPERSEDED','CANCELLED'))
);
```

Recommended due index:

```sql
CREATE INDEX ix_season_timers_due
ON season_timers (due_at, season_timer_id)
WHERE lifecycle_state IN ('PENDING','RETRY');
```

### `season_settlement_gates`

```sql
CREATE TABLE season_settlement_gates (
    settlement_gate_id           uuid PRIMARY KEY,
    season_edition_id            uuid NOT NULL REFERENCES season_editions,
    gate_key                     text NOT NULL,
    gate_type                    text NOT NULL,
    owner_system                 text NOT NULL,
    contract_version             integer NOT NULL,
    lifecycle_state              text NOT NULL,
    expected_fact                jsonb NOT NULL,
    observed_fact_ref            text,
    first_blocked_at             timestamptz,
    satisfied_at                 timestamptz,
    waived_at                    timestamptz,
    waived_by                    text,
    waiver_reason                text,
    last_checked_at              timestamptz,
    aggregate_version            bigint NOT NULL DEFAULT 0,
    CONSTRAINT uq_settlement_gate UNIQUE (season_edition_id, gate_key),
    CONSTRAINT ck_settlement_gate_state
      CHECK (lifecycle_state IN ('PENDING','SATISFIED','BLOCKED','WAIVED','FAILED'))
);
```

### `season_integrity_cases`

```sql
CREATE TABLE season_integrity_cases (
    integrity_case_id            uuid PRIMARY KEY,
    season_edition_id            uuid NOT NULL REFERENCES season_editions,
    season_participation_id      uuid REFERENCES season_participations,
    case_type                    text NOT NULL,
    lifecycle_state              text NOT NULL,
    severity                     text NOT NULL,
    evidence_refs                jsonb NOT NULL,
    decision_ref                 text,
    remediation                  jsonb,
    opened_at                    timestamptz NOT NULL,
    opened_by                    text NOT NULL,
    closed_at                    timestamptz,
    closed_by                    text,
    aggregate_version            bigint NOT NULL DEFAULT 0,
    CONSTRAINT ck_integrity_case_state
      CHECK (lifecycle_state IN ('OPEN','INVESTIGATING','DECIDED','REMEDIATING','CLOSED'))
);
```

### `season_command_receipts`

```sql
CREATE TABLE season_command_receipts (
    command_id                   uuid PRIMARY KEY,
    caller_scope                 text NOT NULL,
    idempotency_key              text NOT NULL,
    request_fingerprint          text NOT NULL,
    aggregate_type               text NOT NULL,
    aggregate_id                 uuid,
    status                       text NOT NULL,
    result_code                  text NOT NULL,
    result_payload               jsonb NOT NULL,
    previous_aggregate_version   bigint,
    resulting_aggregate_version  bigint,
    committed_at                 timestamptz,
    created_at                   timestamptz NOT NULL,
    CONSTRAINT uq_season_idempotency UNIQUE (caller_scope, idempotency_key)
);
```

### `season_event_inbox`

```sql
CREATE TABLE season_event_inbox (
    producer                     text NOT NULL,
    event_id                     uuid NOT NULL,
    event_type                   text NOT NULL,
    schema_version               integer NOT NULL,
    partition_key                text,
    occurred_at                  timestamptz NOT NULL,
    recorded_at                  timestamptz NOT NULL,
    payload                      jsonb NOT NULL,
    processing_state             text NOT NULL,
    attempt_count                integer NOT NULL DEFAULT 0,
    next_attempt_at              timestamptz,
    processed_at                 timestamptz,
    last_error_code              text,
    PRIMARY KEY (producer, event_id)
);
```

### `season_event_outbox`

```sql
CREATE TABLE season_event_outbox (
    outbox_id                    uuid PRIMARY KEY,
    aggregate_type               text NOT NULL,
    aggregate_id                 uuid NOT NULL,
    aggregate_sequence           bigint NOT NULL,
    event_id                     uuid NOT NULL UNIQUE,
    event_type                   text NOT NULL,
    schema_version               integer NOT NULL,
    partition_key                text NOT NULL,
    payload                      jsonb NOT NULL,
    occurred_at                  timestamptz NOT NULL,
    created_at                   timestamptz NOT NULL,
    publish_state                text NOT NULL,
    attempt_count                integer NOT NULL DEFAULT 0,
    next_attempt_at              timestamptz,
    published_at                 timestamptz,
    broker_metadata              jsonb,
    CONSTRAINT uq_season_outbox_sequence
      UNIQUE (aggregate_type, aggregate_id, aggregate_sequence)
);
```

### `season_bulk_jobs`

```sql
CREATE TABLE season_bulk_jobs (
    bulk_job_id                  uuid PRIMARY KEY,
    season_edition_id            uuid REFERENCES season_editions,
    job_type                     text NOT NULL,
    lifecycle_state              text NOT NULL,
    policy_revision              text NOT NULL,
    input_snapshot_ref           text,
    cursor                       jsonb,
    target_count_estimate        bigint,
    processed_count              bigint NOT NULL DEFAULT 0,
    success_count                bigint NOT NULL DEFAULT 0,
    skipped_count                bigint NOT NULL DEFAULT 0,
    failed_count                 bigint NOT NULL DEFAULT 0,
    rate_limit_per_second        integer,
    started_at                   timestamptz,
    completed_at                 timestamptz,
    created_at                   timestamptz NOT NULL,
    created_by                   text NOT NULL,
    aggregate_version            bigint NOT NULL DEFAULT 0,
    CONSTRAINT ck_bulk_job_state
      CHECK (lifecycle_state IN
        ('PLANNED','RUNNING','PAUSED','CANCELLING','CANCELLED','COMPLETED','FAILED'))
);
```

### `season_audit_records`

Audit storage may be centralized, but the Season Engine MUST produce records containing:

- audit ID;
- principal;
- action;
- target;
- authorization decision;
- request and result fingerprints;
- reason;
- effective and recorded time;
- before and after state references;
- approval chain;
- correlation;
- source network and service context where lawful;
- retention class.

### Row-level and role security

Recommended database roles:

- `season_app_write`;
- `season_app_read`;
- `season_projection`;
- `season_outbox_relay`;
- `season_reconciliation`;
- `season_audit_read`;
- `season_migration`.

No application role receives unrestricted table owner privileges. Published content and ledger tables deny update and delete.

### Partitioning

High-volume tables SHOULD be partitioned:

- Participation by Edition or realm plus hash;
- lifecycle ledger by time and aggregate type;
- inbox and outbox by recorded month;
- audit by retention class and time;
- eligibility decisions by Edition;
- timers by due-time bucket.

Partitioning MUST preserve uniqueness and query correctness.

### Retention

- published Manifests and lifecycle ledger: long-term or permanent according to platform policy;
- Participation: product and legal retention policy;
- direct Character linkage: minimized and anonymizable;
- command receipts: at least maximum retry and dispute period;
- inbox/outbox: sufficient for recovery and audit;
- transient validation reports: configurable;
- sensitive invitation data: delete token hashes after retention need expires;
- projections: rebuildable and shorter-lived.

### Database invariants and triggers

The reference implementation SHOULD enforce:

- no update to published Version authored content;
- no update or delete to published Manifest;
- no update or delete to lifecycle ledger;
- monotonic aggregate version;
- valid state transitions through application-controlled procedures;
- Schedule Revision monotonicity;
- phase interval validity;
- one Participation per Character and Edition;
- no Invitation over-redemption;
- command idempotency uniqueness;
- outbox sequence uniqueness.

Triggers MUST remain simple and deterministic. Domain policy belongs in tested application code, while structural immutability belongs in the database.

---

## API Specification

### API principles

- Commands and queries are separated.
- Writes require authentication and authorization.
- Owner queries enforce Character ownership or delegated access.
- Hidden resources are non-enumerable.
- Every mutation accepts an idempotency key.
- Administrative mutations accept expected aggregate version.
- API timestamps are RFC 3339 UTC.
- Locale affects presentation only.
- Pagination is cursor-based.
- Error responses use stable machine codes.
- Public API never exposes raw policy expressions or internal evidence.
- Internal APIs use service identity and explicit scopes.
- Bulk operations are asynchronous jobs with durable status.

### Versioning

Reference base paths:

```text
/api/v1/seasons
/internal/v1/seasons
/admin/v1/seasons
/authoring/v1/seasons
```

Breaking contract changes require a new major API version. Resource representation revisions are exposed independently from API major version.

### Public and owner query endpoints

#### List discoverable Seasons

```http
GET /api/v1/seasons?realmId=platform-eu&status=active&cursor=...
```

Response:

```json
{
  "items": [
    {
      "seasonEditionId": "3cc2504e-dcde-4f84-a0c9-9805115db819",
      "editionKey": "summer-2026",
      "title": "Summer Season",
      "summary": "A platform-wide summer journey.",
      "lifecycleState": "ACTIVE",
      "currentPhase": {
        "key": "main",
        "endsAt": "2026-08-20T07:59:59Z"
      },
      "enrollment": {
        "mode": "OPT_IN",
        "open": true,
        "closesAt": "2026-06-14T21:59:59Z"
      },
      "scheduleRevision": 1,
      "asOf": "2026-06-03T12:00:00Z"
    }
  ],
  "nextCursor": null
}
```

The endpoint MUST apply visibility before filtering or counting.

#### Read Season detail

```http
GET /api/v1/seasons/{seasonEditionId}
```

Optional query:

- `include=timeline`;
- `locale=ru-RU`;
- owner authorization context.

#### Read current timeline

```http
GET /api/v1/seasons/{seasonEditionId}/timeline
```

Returns effective schedule plus revision history visible to the caller.

#### Read owner Participation

```http
GET /api/v1/seasons/{seasonEditionId}/participation
```

The authenticated owner Character is resolved server-side unless an explicit Character ID is authorized.

#### List Character Season portfolio

```http
GET /api/v1/characters/{characterId}/seasons?state=active,completed
```

#### List owner Invitations

```http
GET /api/v1/characters/{characterId}/season-invitations
```

Invitation secrets are not returned after initial issue or secure delivery.

### Owner command endpoints

#### Enroll

```http
POST /api/v1/seasons/{seasonEditionId}/enroll
Idempotency-Key: <stable-key>
If-Match: "<edition-or-participation-version>"
```

Request:

```json
{
  "characterId": "561a95e7-cce7-4b38-8cf6-b77ee486c00d",
  "invitationToken": null
}
```

Response:

```json
{
  "commandId": "uuid",
  "status": "COMMITTED",
  "seasonParticipationId": "20af38a2-8f42-499e-9870-f205a93f61d0",
  "participationState": "ENROLLED",
  "aggregateVersion": 1,
  "eventIds": ["uuid"]
}
```

#### Redeem invitation

```http
POST /api/v1/seasons/{seasonEditionId}/invitations/redeem
```

The raw token is accepted over TLS, never logged, and immediately hashed for lookup.

#### Withdraw before activation

```http
POST /api/v1/seasons/{seasonEditionId}/participation/withdraw
```

#### Exit active Season

```http
POST /api/v1/seasons/{seasonEditionId}/participation/exit
```

Request includes an allowed reason code. Free-text reason is optional, length-bounded, and privacy-classified.

### Internal query endpoints

#### Resolve temporal context

```http
POST /internal/v1/seasons/context:resolve
```

Request:

```json
{
  "realmId": "platform-eu",
  "occurredAt": "2026-08-25T18:04:00Z",
  "characterId": "561a95e7-cce7-4b38-8cf6-b77ee486c00d",
  "requiredBindingOwner": "quest-engine"
}
```

Response:

```json
{
  "resolutionId": "uuid",
  "resolvedAt": "2026-08-25T18:04:01Z",
  "editions": [
    {
      "seasonEditionId": "3cc2504e-dcde-4f84-a0c9-9805115db819",
      "seasonManifestId": "f4e780fb-c7cb-44d1-a2dc-23e2f4136f57",
      "manifestFingerprint": "sha256:...",
      "scheduleRevision": 4,
      "phaseKeys": ["finale"],
      "windowKeys": ["progress"],
      "participation": {
        "seasonParticipationId": "20af38a2-8f42-499e-9870-f205a93f61d0",
        "state": "ACTIVE"
      }
    }
  ]
}
```

This endpoint is strongly authorized, rate limited, and MUST NOT be used as a synchronous dependency for every high-volume Event when a local projection contract is available.

#### Read immutable Manifest

```http
GET /internal/v1/seasons/manifests/{seasonManifestId}
```

Supports `If-None-Match` using the Manifest fingerprint.

#### Read effective schedule revision

```http
GET /internal/v1/seasons/{seasonEditionId}/schedule/effective?at=...
```

#### Validate binding

```http
POST /internal/v1/seasons/bindings:validate
```

Used by foreign Engines to verify exact Season context during their own publication workflow.

#### Read settlement gate status

```http
GET /internal/v1/seasons/{seasonEditionId}/settlement-gates
```

### Authoring endpoints

#### Create Definition

```http
POST /authoring/v1/seasons/definitions
```

#### Create Version

```http
POST /authoring/v1/seasons/definitions/{seasonDefinitionId}/versions
```

#### Update draft Version

```http
PUT /authoring/v1/seasons/definition-versions/{versionId}
If-Match: "<aggregate-version>"
```

Only draft content may be updated.

#### Validate Version

```http
POST /authoring/v1/seasons/definition-versions/{versionId}:validate
```

#### Approve and publish Version

```http
POST /authoring/v1/seasons/definition-versions/{versionId}:approve
POST /authoring/v1/seasons/definition-versions/{versionId}:publish
```

#### Create Edition

```http
POST /authoring/v1/seasons/editions
```

#### Compile Manifest

```http
POST /authoring/v1/seasons/editions/{editionId}/manifest:compile
```

#### Simulate Edition

```http
POST /authoring/v1/seasons/editions/{editionId}:simulate
```

Simulation input may include:

- hypothetical trusted instant;
- audience sample snapshot;
- dependency health;
- proposed revision;
- pause interval;
- close time.

Simulation output is non-authoritative and clearly labeled.

#### Publish and schedule

```http
POST /authoring/v1/seasons/editions/{editionId}:publish-and-schedule
```

Requires approval token bound to exact Manifest and schedule fingerprints.

### Administrative lifecycle endpoints

```http
POST /admin/v1/seasons/{editionId}:activate
POST /admin/v1/seasons/{editionId}:pause
POST /admin/v1/seasons/{editionId}:resume
POST /admin/v1/seasons/{editionId}:extend
POST /admin/v1/seasons/{editionId}:close
POST /admin/v1/seasons/{editionId}:cancel
POST /admin/v1/seasons/{editionId}:terminate
POST /admin/v1/seasons/{editionId}:finalize
```

Every endpoint requires:

- scope;
- expected version;
- reason;
- idempotency;
- impact preview revision where applicable;
- elevated approval for high-impact actions.

### Administrative Participation endpoints

```http
POST /admin/v1/seasons/{editionId}/participations/{participationId}:pause
POST /admin/v1/seasons/{editionId}/participations/{participationId}:resume
POST /admin/v1/seasons/{editionId}/participations/{participationId}:disqualify
POST /admin/v1/seasons/{editionId}/participations/{participationId}:complete
POST /admin/v1/seasons/{editionId}/participations/{participationId}:contest
POST /admin/v1/seasons/{editionId}/participations/{participationId}:invalidate
```

Administrative completion MUST still satisfy an approved correction or override workflow and MUST NOT be a generic “set completed” mutation.

### Bulk job endpoints

```http
POST /admin/v1/seasons/{editionId}/jobs/auto-enrollment
POST /admin/v1/seasons/{editionId}/jobs/eligibility-backfill
POST /admin/v1/seasons/{editionId}/jobs/participation-close
POST /admin/v1/seasons/{editionId}/jobs/finalization
GET  /admin/v1/seasons/jobs/{jobId}
POST /admin/v1/seasons/jobs/{jobId}:pause
POST /admin/v1/seasons/jobs/{jobId}:resume
POST /admin/v1/seasons/jobs/{jobId}:cancel
```

### Reconciliation endpoints

```http
POST /admin/v1/seasons/{editionId}:reconcile
GET  /admin/v1/seasons/{editionId}/reconciliation
POST /admin/v1/seasons/{editionId}/repairs/{repairType}
```

Repair endpoints accept only registered repair types and never arbitrary SQL.

### HTTP semantics

- `200 OK` for idempotent replay or synchronous query.
- `201 Created` for new aggregate.
- `202 Accepted` for bulk job.
- `204 No Content` only where no receipt is needed; mutation endpoints SHOULD return receipts.
- `400 Bad Request` for schema errors.
- `401 Unauthorized` for missing authentication.
- `403 Forbidden` for known resource with denied action when non-enumeration is not required.
- `404 Not Found` for missing or hidden resource.
- `409 Conflict` for lifecycle, exclusivity, or version conflict.
- `412 Precondition Failed` for ETag mismatch.
- `422 Unprocessable Entity` for valid schema but invalid policy.
- `429 Too Many Requests` for rate limits.
- `503 Service Unavailable` for fail-closed dependency outage.

### Pagination

Cursor payload SHOULD include:

- stable sort values;
- resource scope;
- filter fingerprint;
- projection revision;
- expiration;
- signature.

Clients MUST NOT edit cursors.

### ETags

ETags SHOULD derive from aggregate version or projection revision. Manifest responses use immutable fingerprint ETags.

### Rate limits

Separate quotas apply to:

- public catalog;
- context resolution;
- owner enrollment;
- invitation redemption;
- authoring validation;
- administrative mutation;
- bulk job creation.

Invitation redemption and hidden resource lookup require abuse-specific throttling.

---

## Admin Features

### Definition and Version authoring

Administrators and product authors need:

- structured form and validated JSON views;
- draft cloning;
- version diff;
- schema validation;
- policy linting;
- localization completeness;
- content dependency search;
- approval workflow;
- immutable publication receipt.

### Edition planner

The planner MUST provide:

- visual UTC and local-time timeline;
- phase lanes;
- operation windows;
- DST warnings;
- overlap detection;
- exclusivity conflicts;
- dependency readiness;
- settlement window preview;
- close and claim cutoff preview;
- recurrence comparison without reusing Edition IDs.

### Manifest inspector

Displays:

- canonical Manifest;
- fingerprint;
- exact foreign references;
- dependency contract versions;
- required/optional classification;
- visibility;
- activation and close policy;
- validation status;
- approval identity.

### Impact preview

Before pause, extension, early close, cancellation, termination, or backdated correction, the operator sees:

- current participants;
- current phase and windows;
- affected deadlines;
- active foreign bindings;
- pending Invitations;
- estimated unresolved Quests or Rewards from projections;
- settlement impact;
- user communication requirement;
- irreversible consequences;
- required approvers.

### Lifecycle controls

Controls MUST:

- show current aggregate version;
- require reason code;
- require typed confirmation for destructive/high-impact operations;
- prevent impossible transitions;
- display resulting Schedule Revision;
- produce command receipt;
- never expose a direct state dropdown.

### Timer operations

Operators can:

- inspect due, claimed, retrying, failed, and superseded timers;
- requeue safe timers;
- cancel obsolete timers;
- inspect lease owner;
- compare timer expected revision to current revision;
- execute dry-run;
- open an integrity case.

They cannot mark a timer executed without running the command.

### Participation operations

Authorized staff can:

- search by exact Character ID or approved owner lookup;
- inspect Participation history;
- view safe eligibility explanation;
- pause or resume for approved reasons;
- disqualify through review workflow;
- manage appeal status;
- correct a proven factual error;
- anonymize or restrict view according to privacy policy.

### Invitation management

Features:

- create single or batch Invitations;
- define scope and expiration;
- revoke unused Invitations;
- monitor aggregate redemption counts;
- export through secure delivery;
- never display stored raw tokens;
- rotate delivery secrets;
- detect brute-force attempts.

### Settlement console

Shows:

- mandatory and optional gates;
- owner system;
- last observed fact;
- blocked duration;
- retry status;
- waiver eligibility;
- reconciliation results;
- finalization preview;
- sealed final summary after commit.

### Integrity console

Supports:

- case opening;
- evidence references;
- restricted investigator notes;
- decision approval;
- remediation plan;
- external compensation references;
- appeal;
- closure;
- immutable history.

### Bulk job console

Shows:

- policy and input snapshot;
- target estimate;
- shard count;
- cursor;
- throughput;
- success, skipped, failed;
- top error codes;
- pause and resume;
- cancellation status;
- downloadable safe report.

### Audit explorer

Filter by:

- Edition;
- Participation;
- principal;
- action;
- reason;
- time;
- command;
- Event;
- approval;
- Schedule Revision;
- integrity case.

Sensitive evidence requires additional scope.

### Operational safeguards

- no production mutation from generic database consoles;
- two-person approval for defined high-risk actions;
- just-in-time elevation;
- short-lived admin sessions;
- mandatory reason taxonomy;
- immutable command receipts;
- production banner and realm confirmation;
- dry-run where feasible;
- rate limits on bulk changes;
- break-glass actions alerted and reviewed.

---

## UX Requirements

### Narrative-first presentation

The Season should appear as a chapter, journey, term, challenge, or campaign appropriate to the product. The UI should communicate:

- why the Season matters;
- what is currently happening;
- what the Character can do now;
- what changes next;
- when important windows close;
- how participation history remains part of the Character story.

The UI SHOULD avoid presenting the Season as only a countdown and a collection of numbers.

### Timeline clarity

The participant timeline MUST distinguish:

- preview;
- enrollment;
- active participation;
- finale;
- grace;
- claims;
- settlement;
- archive.

Important deadlines display:

- absolute local date and time;
- time zone;
- relative countdown as secondary;
- revision notice after a change.

### Countdown correctness

- Countdown is derived from server-provided UTC deadline.
- Client clock drift is handled.
- On reconnect, the client refreshes authoritative time.
- Countdown reaching zero does not locally commit close.
- UI waits for authoritative lifecycle or context response.
- DST transitions are explained where relevant.

### Enrollment UX

Enrollment flow shows:

- participation mode;
- eligibility result;
- why the Character is eligible or not;
- required invitation or qualification;
- exclusivity conflicts;
- entry deadline;
- withdrawal and exit policy;
- privacy implications;
- confirmation.

The UI MUST NOT claim enrollment before the authoritative receipt returns.

### Automatic enrollment

Auto-enrolled Characters receive an explanation of:

- why they were enrolled;
- when participation became active;
- whether exit is permitted;
- visibility;
- where to find rules.

Notification delivery is owned elsewhere.

### Pause UX

During Pause:

- status is explicit;
- operations still allowed are listed;
- countdown behavior is explained;
- estimated resume is labeled as estimated;
- stale cached “active” controls are disabled after authoritative rejection;
- extension is not promised until a Schedule Revision commits.

### Extension UX

After extension:

- old and new deadline may be shown;
- effective time and reason are visible;
- local timezone is explicit;
- changed phases and windows are highlighted;
- user does not need to re-enroll.

### Close UX

At close, the UI separates:

- Season activity closed;
- late completion grace;
- claim window;
- settlement in progress;
- final results pending;
- finalized archive.

“Season ended” MUST NOT imply all Rewards are delivered.

### Termination and cancellation UX

Cancellation before start and termination after start have different language.

Termination messaging must state:

- what happened at a safe level;
- what activity remains recorded;
- what claims or compensation may apply;
- what happens next;
- support or appeal route.

### Participation state UX

Owner-facing states are translated into clear language. Internal terms such as `FINALIZATION_BLOCKED` may be rendered as “Results are still being verified.”

### Disqualification UX

- disclose only policy-approved reason;
- provide appeal path when applicable;
- avoid exposing investigator identity or other participants;
- clearly distinguish disqualification from technical pause;
- avoid implying Reward compensation is complete until its owner confirms.

### Hidden Seasons

Hidden or invitation-only Seasons:

- do not appear in search;
- do not leak through counts;
- do not reveal title in unauthorized errors;
- do not preload assets;
- use non-enumerable URLs and authorization;
- protect social previews and analytics labels.

### Accessibility

- timelines are keyboard navigable;
- status is not conveyed by color alone;
- countdown changes do not create disruptive announcements every second;
- pause and deadline alerts use accessible live regions sparingly;
- local dates have machine-readable values;
- animations respect reduced-motion settings;
- text meets contrast and zoom requirements.

### Localization

- narrative uses localization keys;
- date and time format uses locale;
- authoritative timezone remains visible;
- phase labels are localized;
- reason messages use stable safe codes;
- right-to-left layouts are supported where platform requires;
- localization cannot alter policy meaning.

### Offline and stale clients

Offline clients may display cached read data with a stale indicator. They MUST NOT:

- authorize enrollment;
- assume a window remains open;
- commit exit;
- claim current phase;
- infer a Schedule Revision.

On reconnect, writes are retried with the original idempotency key.

---

## Security

### Security objectives

Protect:

- lifecycle authority;
- hidden content;
- participant privacy;
- invitation secrets;
- governance approvals;
- schedule integrity;
- cross-Engine contracts;
- audit evidence;
- service availability.

### Authentication

- public reads may be anonymous only for public resources;
- owner reads require authenticated User-to-Character authorization;
- internal APIs require workload identity;
- administrative APIs require MFA-capable identity and elevated scopes;
- bulk and high-impact operations require short-lived authorization.

### Authorization

Authorization evaluates:

- principal;
- role;
- realm;
- owner scope;
- resource visibility;
- action;
- lifecycle state;
- approval requirement;
- data classification;
- separation of duties.

Authorization is server-side and recorded for mutations.

### Service-to-service trust

- mutual TLS or equivalent workload identity;
- least-privilege scopes;
- producer allowlists for consumed Events;
- schema registry validation;
- key rotation;
- no shared static superuser credentials;
- replay protection where signed requests are used.

### Hidden content protection

Hidden data MUST be excluded from:

- unauthorized API responses;
- GraphQL or search indexes;
- shared caches;
- client bundles;
- asset manifests;
- logs;
- traces;
- metrics labels;
- error messages;
- analytics event names;
- URL slugs where enumeration is possible.

### Invitation security

- tokens use cryptographically secure randomness;
- raw tokens are never stored;
- comparisons are constant-time where practical;
- redemption is rate limited by token, principal, IP risk, and realm;
- tokens are scoped and expire;
- batch export is encrypted and audited;
- token rotation and revocation are supported;
- successful redemption invalidates or increments usage atomically.

### Policy expression security

Audience and eligibility policy language:

- has a closed operator set;
- has bounded depth and node count;
- has no loops;
- has no network access;
- has no filesystem access;
- cannot invoke arbitrary functions;
- validates fact types;
- has deterministic evaluation;
- enforces CPU and memory budgets.

### Manifest supply-chain security

- canonicalization is deterministic;
- fingerprint is verified on publication and retrieval;
- approvals bind to fingerprint;
- foreign dependencies include exact fingerprint;
- registry artifacts may be signed;
- production accepts only trusted schema and compiler versions;
- compiler version is audit-recorded.

### Command security

- idempotency keys are scoped to caller;
- request fingerprint prevents key reuse with different payload;
- expected version prevents lost updates;
- high-impact commands require impact preview;
- free-text fields are sanitized and bounded;
- reason codes are controlled;
- no mass assignment of lifecycle state.

### Event security

- validate producer and schema;
- reject unexpected Character or realm scope;
- quarantine invalid signatures;
- bound payload size and nesting;
- never deserialize executable objects;
- preserve original Event for forensic review under retention policy;
- do not trust source `recordedAt` as local commit time.

### Database security

- application roles are least privilege;
- published and ledger tables deny update/delete;
- backups are encrypted;
- point-in-time restore access is restricted;
- production data is not copied to lower environments without approved anonymization;
- row-level realm controls are applied where appropriate;
- database audit logs exclude secrets.

### Administrative security

- MFA;
- just-in-time elevation;
- two-person approval for publication, backdated correction, early termination, and gate waiver where policy requires;
- break-glass logging and alerting;
- session recording where lawful;
- no shared admin accounts;
- periodic access review.

### Abuse prevention

Protect against:

- invitation brute force;
- repeated enrollment attempts;
- hidden Season enumeration;
- bulk job abuse;
- context endpoint scraping;
- schedule mutation spam;
- oversized policy payloads;
- Event replay floods;
- expensive simulation queries.

### Threat examples

#### Forged client timestamp

A client submits an action with an in-window timestamp after close. Season Engine uses trusted source policy and Event lateness contract; client time alone is rejected.

#### Stolen Invitation

Risk is reduced through expiration, scope, usage limits, owner binding where possible, rate limits, and revocation. Redemption history is auditable.

#### Malicious operator shortens deadline

The command requires authorization, impact preview, approval, reason, append-only revision, and audit. Default extension endpoint cannot shorten.

#### Compromised downstream consumer

A consumer cannot mutate Season state. Event scopes and immutable API access limit data. Rotation and revocation isolate service identity.

---

## Privacy

### Data minimization

Season Engine stores only data required for:

- Participation identity;
- eligibility decision;
- lifecycle;
- Invitations;
- audit;
- integrity;
- authorized reporting.

It SHOULD store fact references and revision vectors instead of copying full profile, attendance, purchase, health, or disciplinary data.

### Personal data classification

Potential personal data includes:

- Character ID;
- Participation history;
- Invitation linkage;
- eligibility results;
- exit and disqualification reasons;
- administrative notes;
- network and audit context.

Each field requires classification, lawful purpose, access policy, and retention.

### Sensitive eligibility facts

Health, age, minor status, payment state, disciplinary state, or other sensitive facts MUST remain with the authoritative owner where possible. Season Engine stores only the minimum decision and reason code required.

### Public participation

Participation is private by default unless an explicit visibility policy and Character consent allow public display.

Public aggregate counts MUST apply minimum cohort thresholds and disclosure controls where re-identification risk exists.

### Character closure

Closure:

- removes owner-facing active access according to Character policy;
- transitions Participation safely;
- does not erase required financial, fraud, or integrity records owned elsewhere;
- schedules privacy review.

### Character anonymization

Anonymization workflow MUST be:

- idempotent;
- resumable;
- auditable;
- scoped across authoritative and projection stores;
- verified by reconciliation.

Direct Character ID is replaced only where retention requires a pseudonymous record. Reversible mapping, if required, is held by a separate restricted privacy service.

### Erasure

Erasure requests are evaluated against:

- legal retention;
- fraud and security needs;
- contractual requirements;
- immutable public history;
- aggregate statistical need.

The Engine should delete or anonymize personal fields while preserving non-personal structural history. It never claims erasure from foreign Engines.

### Access and export

A privacy export may include:

- Season Participations;
- enrollment source;
- lifecycle timeline;
- safe eligibility explanation;
- Invitations associated with the Character;
- integrity decisions appropriate for disclosure.

Internal security evidence and other users' data are excluded.

### Rectification

Factual correction creates new records and links to superseded decisions. It does not silently rewrite lifecycle history.

### Minors

Where minor-safe mode applies:

- public participation is disabled by default;
- invitation and consent policy is stricter;
- disqualification messaging is limited;
- audit access is restricted;
- retention follows child-safety policy;
- profiling and audience rules undergo additional review.

### Retention

Retention classes SHOULD distinguish:

- public Season archive;
- private Participation;
- eligibility evidence;
- Invitation;
- integrity case;
- security audit;
- command receipt;
- operational telemetry.

### Analytics

Analytics receives pseudonymous or aggregate Events. Raw eligibility evidence, Invitation tokens, private reasons, and hidden content are prohibited.

### Cross-border and realm controls

Realm policy may restrict storage region, replication, support access, and export. Cross-region failover MUST preserve these restrictions.

---

## Performance

### Service-level objectives

Reference production objectives, subject to platform tier:

- authoritative Season detail read: p95 under 150 ms;
- owner Participation read: p95 under 200 ms;
- enrollment command without external synchronous lookup: p95 under 300 ms;
- lifecycle command commit: p95 under 500 ms;
- context resolution from local authoritative store or projection: p95 under 100 ms;
- timer due-to-commit latency: p99 under 30 seconds under normal load;
- outbox publication latency: p99 under 10 seconds;
- public catalog availability: 99.95%;
- mutation availability: 99.9%;
- zero acknowledged committed transitions lost.

SLOs exclude caller network and declared asynchronous jobs.

### Capacity assumptions

The design SHOULD support:

- millions of Participants per large Edition;
- thousands of concurrent Editions across realms;
- hundreds of bindings per Edition only within configured bounds;
- high read amplification around activation and close;
- burst enrollment;
- burst timer transitions at common boundaries;
- long-tail settlement.

### Hotspot prevention

- do not increment one Edition counter for every enrollment in the enrollment transaction;
- shard or asynchronously project summary counters;
- partition Participation;
- hash Character IDs within Edition;
- use bounded timer batches;
- jitter non-authoritative follow-up work;
- cache immutable Manifests;
- avoid one exclusivity lock for unrelated groups.

### Enrollment scaling

Auto-enrollment uses:

- snapshot or stable cursor;
- partitioned jobs;
- per-Character idempotency;
- bounded transactions;
- backpressure;
- rate limits;
- retry classification;
- progress checkpoints;
- no full-job rollback.

### Timer scaling

- due-time index;
- `SKIP LOCKED` claiming;
- leases;
- bounded batch size;
- separate queues for critical Edition transitions and low-priority windows;
- expected Schedule Revision to supersede stale timers;
- clock skew monitoring;
- alert on due backlog.

### Activation and close fan-out

The Engine commits one lifecycle Event and binding Events to the outbox. It does not synchronously call every consumer.

For very large binding sets, outbox fan-out may be chunked while preserving:

- one authoritative Edition transition;
- deterministic binding sequence;
- idempotent Event IDs;
- completion tracking;
- reconciliation.

### Read scaling

- immutable Manifest CDN or internal cache;
- public catalog projections;
- read replicas for non-authoritative history;
- private cache partitioning;
- cursor pagination;
- precomputed timeline;
- bounded joins;
- no unbounded participant list.

### Database indexes

Required index families:

- Edition by realm, lifecycle, visibility, activation, close;
- Participation by Edition and Character;
- Participation by Character and state;
- timer by due time and state;
- ledger by aggregate and sequence;
- outbox by publish state and next attempt;
- inbox by processing state;
- settlement gate by Edition and state;
- binding reverse lookup by foreign resource;
- invitation token hash;
- integrity case by state and severity.

### Backpressure

When overloaded:

- preserve lifecycle transition workers;
- preserve outbox relay;
- rate-limit authoring simulation;
- slow bulk enrollment;
- pause projection rebuild;
- return retryable errors for non-critical reads;
- never accept an enrollment then drop its commit;
- never skip close because analytics is slow.

### Dependency outage

Publication validation may use cached immutable dependency manifests with fingerprints. Runtime lifecycle should not require synchronous dependency availability except for declared mandatory readiness or finalization gates.

### Projection lag

Owner UI may show lag, but command APIs return authoritative receipts. Alert thresholds differ for:

- catalog;
- Participation;
- operations dashboard;
- public archive;
- analytics.

### Rebuilds

Projection rebuilds:

- use immutable state and ledgers;
- are versioned;
- can run alongside live traffic;
- use shadow tables or namespaces;
- switch atomically;
- validate counts and checksums;
- do not mutate authoritative aggregates.

### Disaster recovery

Requirements:

- regular encrypted backups;
- point-in-time recovery;
- tested restore;
- outbox and inbox preservation;
- timer regeneration from authoritative schedule;
- reconciliation after failover;
- documented RPO and RTO;
- no duplicate logical transitions after replay.

---

## Audit

### Audit principles

Every meaningful mutation is attributable, explainable, ordered, and tamper-evident.

Audit answers:

- who acted;
- what changed;
- why;
- under which authorization;
- against which Manifest and Schedule Revision;
- when it became effective;
- when it was recorded;
- which command or Event caused it;
- what Events were emitted;
- whether approval or waiver was used.

### Mandatory audited actions

- Definition and Version creation;
- validation;
- approval;
- publication;
- Edition creation and scheduling;
- activation block and override;
- pause and resume;
- extension;
- early close;
- cancellation;
- termination;
- settlement gate waiver;
- finalization;
- Invitation issue and revoke;
- administrative enrollment;
- disqualification;
- integrity invalidation;
- backdated correction;
- bulk job start, pause, resume, cancel;
- repair;
- privacy transformation;
- break-glass access.

### Dual time

Audit records include:

- `effective_at`;
- `recorded_at`.

Backdated actions are therefore visible and queryable.

### Hash chaining

Lifecycle ledger MAY use hash chaining per aggregate. If enabled:

- canonical entry serialization is versioned;
- chain verification is automated;
- key rotation does not rewrite history;
- verification failure opens a critical integrity case.

### Audit access

- owner-safe history is separate from operator audit;
- investigator evidence is restricted;
- support staff see only necessary fields;
- export is logged;
- audit search is rate limited;
- retention is policy-driven.

### Metrics

Core metrics:

- Editions by lifecycle state;
- activation success and block rate;
- timer lag;
- phase transition lag;
- schedule revisions by type;
- pause duration;
- enrollment attempts and outcomes;
- exclusivity conflicts;
- eligibility result rate;
- active Participants;
- close latency;
- settlement duration;
- blocked gates;
- finalization latency;
- outbox lag;
- inbox retry;
- projection lag;
- open integrity cases;
- bulk job throughput;
- reconciliation drift.

### Alerts

Critical alerts:

- activation overdue;
- close overdue;
- finalization unexpectedly blocked;
- timer backlog;
- outbox stuck;
- Manifest fingerprint mismatch;
- impossible lifecycle state;
- duplicate active exclusive Participation;
- Invitation over-redemption attempt;
- published row mutation attempt;
- ledger sequence gap;
- database clock drift;
- privacy workflow failure.

### Tracing

Trace spans SHOULD cover:

- command validation;
- policy evaluation;
- aggregate lock;
- transaction;
- timer claim;
- outbox publish;
- Event consumption;
- dependency validation;
- projection update.

Sensitive policy facts and tokens are never span attributes.

### Reconciliation reports

A reconciliation report includes:

- scope;
- source revisions;
- checks performed;
- discrepancies;
- safe automatic repairs;
- manual actions;
- final checksum;
- operator or job identity;
- completion time.

---

## Edge Cases

### Activation timer fires twice

Both executions use the same timer idempotency key. One commits activation; the other returns the original receipt or a safe no-op.

### Activation timer fires after manual activation

Expected lifecycle or timer revision no longer matches. Timer becomes superseded.

### Activation dependency is unavailable

If required, activation becomes blocked and retries. If optional, activation proceeds and binding status records the dependency issue.

### Server clocks differ

The platform monitors skew. Timer workers use database or trusted time. Excess skew removes a worker from lifecycle processing.

### DST spring-forward time does not exist

Publication rejects the local time until the author selects an exact valid instant.

### DST fall-back time occurs twice

Publication requires explicit offset or chosen occurrence and stores UTC.

### Event occurs exactly at close

Half-open interval policy applies. At `close_at`, normal window is closed unless contract explicitly says inclusive.

### Event recorded after close but occurred before close

Lateness policy determines whether trusted `occurred_at` is accepted and which settlement window applies.

### Client falsifies occurred time

Untrusted client time is ignored or treated as evidence only. The authoritative source contract decides trust.

### Schedule is extended after a downstream Engine already closed content

The new Schedule Revision is published. The downstream Engine applies its own correction/reopen policy. Season Engine does not edit it directly. If reopening is unsupported, an integrity or product remediation workflow is required.

### Extension is requested after finalization

Rejected. A new Edition or post-finalization correction workflow is required.

### Pause crosses planned close

Pause policy determines whether wall clock continues or a revision extends close. Ambiguity is rejected.

### Resume time is unknown

Edition remains Paused. Estimated time is non-authoritative and not stored as a committed deadline unless explicitly revised.

### Edition closes while enrollment job runs

Each target command rechecks window and lifecycle. Remaining targets are skipped with `WINDOW_CLOSED`; already committed enrollments remain.

### Character enrolls concurrently through opt-in and auto-enrollment

Unique Participation and idempotency constraints produce one Aggregate. Both sources are auditable; one is canonical entry source and the other records duplicate resolution.

### Character redeems two Invitations concurrently

At most one Participation exists. Each Invitation's usage accounting remains atomic and policy determines whether the second is consumed or returned unused. Default is unused.

### Invitation is revoked during redemption

Row locking serializes revoke and redemption. Exactly one valid outcome commits.

### Invitation raw token appears in logs

This is a security incident. Logging filters and tests MUST prevent it; discovered leakage triggers token revocation and incident workflow.

### Eligibility facts change after enrollment

Pinned policy declares whether eligibility is checked only at enrollment, at activation, continuously, or at finalization. No silent policy switch occurs.

### Character loses an Item used only as entry eligibility

If policy is `AT_ENROLLMENT_ONLY`, Participation remains. Continuous enforcement requires an explicit fact update and transition policy.

### Character is suspended during Active Season

Participation follows pinned suspension policy. Other Engines independently enforce Character restrictions.

### Character restored after close

Resume is denied unless grace and policy permit. History remains Paused or transitions to Closed/Finalized according to policy.

### Character anonymized while settlement is open

Direct identity is transformed. Settlement references use authorized pseudonymous correlation or privacy service mapping. No Reward or foreign ownership is reassigned.

### Two exclusive Seasons activate simultaneously

Exclusivity policy applies at Participation activation, not by assuming Edition activation is mutually exclusive. Conflicts are resolved deterministically by priority and committed state.

### Realm is migrated

Realm identity changes require explicit migration. Display or tenant rename does not rewrite historical realm keys.

### Bound Quest is retired before Season activation

Required binding blocks activation or publication; optional binding is marked unavailable. The exact contract decides.

### Bound Item is quarantined during Active Season

Season Engine publishes or records dependency status. Inventory and Reward Engines own grant behavior. Season may pause, continue, or revise binding only through approved policy.

### Reward settlement never completes

Finalization remains blocked until gate timeout policy allows waiver or failure outcome. Season Engine never marks the Reward successful.

### Leaderboard has a tie dispute

Leaderboard gate remains unresolved. Season stays Settling. Season Engine does not calculate the tie.

### A late correction changes qualification

A new Eligibility Decision is created. Participation correction follows explicit policy and may open an integrity case. History is not deleted.

### Finalization Event is published but projection fails

Authoritative state remains Finalized. Projection retries and rebuilds from ledger/outbox.

### Outbox publishes duplicate lifecycle Event

Consumers deduplicate by Event ID. Duplicate transport does not create duplicate effects.

### Outbox Event is delayed for hours

Season authoritative state remains committed. Operations dashboard shows lag. Consumers process in aggregate order or reconcile.

### Old schedule Event arrives after new revision

Consumer compares revision. It ignores or stores the superseded revision according to contract.

### Backdated correction predates participant enrollment

Impact analysis enumerates affected decisions. Automatic mutation is forbidden unless correction policy explicitly authorizes a bounded backfill.

### Manual database edit creates impossible state

Reconciliation detects mismatch between current state, ledger, and hash. It opens a critical case. Repair uses approved commands; the edit is not normalized silently.

### Edition has zero participants

It may still close and finalize if policy allows. Summary records zero without divide-by-zero metrics.

### Edition has millions of participants

Close and finalization use partitioned jobs and gates. Edition lifecycle does not lock all Participation rows in one transaction.

### Participant finalization fails for one shard

Job resumes from cursor. Edition finalization policy determines whether zero failures are mandatory or a reviewed exception is permitted.

### Optional binding never activates

Edition may proceed. Final archive records unavailable optional content without pretending activation occurred.

### Mandatory phase timer was missed during outage

On recovery, due timer executes with intended effective time if policy permits, records late execution, and publishes both effective and recorded times. If transition is no longer valid, it opens an operational case.

### Cancellation after Invitations were issued

Invitations are revoked or marked unusable according to cancellation policy. Raw tokens remain unrecoverable.

### Cancellation requested after first activation commit

Rejected; operator must use termination.

### Season title changes after publication

Published narrative is immutable. A corrected localized presentation bundle may use a separately versioned localization mechanism if it does not change mechanics or identity.

### Public archive needs typo correction

Presentation correction is versioned and audited. Final lifecycle and Manifest remain immutable.

### Participation completion Event is delivered twice to Reward Engine

Same Event ID and source completion identity allow Reward Engine idempotency. Season Engine publishes once logically.

### Reward is revoked after Season finalization

Season history remains finalized. A foreign Reward correction may open or annotate an integrity case but does not reopen the Edition.

### User changes locale or timezone

Presentation changes only. Authoritative UTC schedule and Edition identity remain.

### Browser countdown reaches zero during network loss

Client displays “checking status” and does not assume close or activation.

### A hidden Season is referenced from a public foreign resource

Publication validation should reject the visibility mismatch or require a safe public alias. Unauthorized users never receive hidden identity.

### Policy compiler version changes

Published policy keeps compiler/runtime compatibility metadata. New runtime must pass deterministic compatibility tests or use the old interpreter.

### Fact projection is stale at enrollment

Eligibility decision becomes `UNKNOWN` or fails closed when policy requires fresh facts. It never assumes eligibility from absence.

### Enrollment capacity is reached concurrently

If capacity is a Season-owned policy, a strongly consistent capacity reservation or deterministic queue is required. Approximate projection counts are not authorization.

### Capacity later increases

Pending queue may be reevaluated through a job. Rejected commands are not silently converted to enrolled without policy and Event.

### Phase lanes intentionally overlap

Overlap is allowed only across different declared lanes. Same-lane overlap is rejected.

### Settlement window closes before external fact arrives

Gate follows timeout policy: blocked, failed, or eligible for waiver. Late fact may create an integrity case after finalization.

### Finalization command races with new integrity case

Locking and gate checks serialize. Finalization cannot commit if a mandatory open-case constraint appears first.

### Privacy erasure races with owner read

Authorization and privacy workflow revision ensure the read either returns permitted data before transformation or a post-transformation response; caches are invalidated.

### Duplicate command with changed payload

Rejected with `IDEMPOTENCY_PAYLOAD_CONFLICT`, even if the first command failed deterministically.

### Command times out after commit

Retry with same idempotency key returns original receipt. Caller must not create a new key merely because response was lost.

### Cross-region failover replays timer

Idempotency and aggregate version prevent duplicate transition. Reconciliation verifies outbox and timer state.

### An Edition is scheduled years ahead

Timer storage and retention support long horizons. Periodic reconciliation ensures future timers still exist and policies remain compatible.

### A required dependency is deprecated but still valid

Manifest contract decides whether deprecation blocks new activation. Retirement or quarantine has separate semantics.

### A Season contains no foreign content bindings

Allowed for a pure temporal or participation container if Definition policy permits. It still owns lifecycle and Participation only.

### One Event qualifies for multiple overlapping Seasons

Context resolution may return multiple Editions. Each downstream owner applies its own binding and Participation policy. Season Engine does not arbitrarily select one unless exclusivity declares it.

### Source Event has no realm

Context resolution fails or uses an explicitly authorized source-to-realm mapping. It never guesses from Character display data.

### Aggregate version overflows

Use bigint and operational monitoring. Overflow is treated as critical and not wrapped.

### Manifest payload exceeds bounds

Compilation fails. Large assets or rule data remain in owner systems and are referenced.

### Free-text admin reason contains personal data

UI warns and server classification/redaction policy applies. Controlled reason codes are mandatory.

### Unknown Event enum value

Closed enum contract causes quarantine. Consumers do not interpret unknown values as a safe default.

### Settlement gate is manually waived

Final summary records `WAIVED`, approvers, reason, and evidence. It is never reported as `PASSED`.

### Finalized summary counter differs from rebuilt count

Open integrity case. Corrected archive summary is versioned; finalized lifecycle fact remains.

### Edition is copied for next year

Copy creates new Draft Edition, new identity, new Manifest, new schedule, and revalidation. It never duplicates Participants or lifecycle history.

---

## Acceptance Tests

The following tests are normative release gates. Equivalent automated tests MAY be grouped, but every behavior MUST be demonstrably covered in unit, integration, contract, migration, security, resilience, or end-to-end suites.

### Definition and Version governance

- **AT-001.** Creating a Definition with a unique key returns one stable Definition identity.
- **AT-002.** Creating a duplicate Definition key in the same owner scope is rejected.
- **AT-003.** The same Definition key may exist in a different approved owner scope.
- **AT-004.** A Draft Definition Version may be updated with optimistic concurrency.
- **AT-005.** Updating a Draft Version with a stale aggregate version is rejected.
- **AT-006.** Submitting a Version for validation freezes the candidate fingerprint.
- **AT-007.** Validation rejects an unsupported schema version.
- **AT-008.** Validation rejects an audience policy with an unregistered operator.
- **AT-009.** Validation rejects an unbounded policy expression.
- **AT-010.** Approval is bound to the exact content fingerprint.
- **AT-011.** Approval with a changed fingerprint is rejected.
- **AT-012.** Separation-of-duties policy prevents the author from self-approving when required.
- **AT-013.** Publishing an unapproved Version is rejected.
- **AT-014.** Publishing creates an immutable Version and publication Event.
- **AT-015.** Updating authored content after publication is rejected by application and database controls.
- **AT-016.** Deprecating a published Version does not modify existing Editions.
- **AT-017.** Archiving a Definition does not delete Versions or Edition references.
- **AT-018.** Creating a new Edition from an archived Definition is rejected.
- **AT-019.** Cloning a Version creates a new identity and no shared mutable payload.
- **AT-020.** Canonical serialization produces the same fingerprint for semantically identical normalized content.
### Manifest and dependency bindings

- **AT-021.** Compiling a Manifest resolves every required foreign resource by exact immutable identity.
- **AT-022.** Compilation rejects a foreign resource referenced only by display name.
- **AT-023.** Compilation rejects a required dependency fingerprint mismatch.
- **AT-024.** Compilation records optional dependency unavailability without silently removing the binding.
- **AT-025.** Two bindings with the same binding key are rejected.
- **AT-026.** Duplicate exact resource bindings in one Manifest are rejected unless the contract explicitly permits aliases.
- **AT-027.** Binding count above the configured bound is rejected.
- **AT-028.** Manifest payload above the configured size bound is rejected.
- **AT-029.** Publishing stores one immutable Manifest for the Edition.
- **AT-030.** Published Manifest update and delete operations are rejected.
- **AT-031.** Manifest retrieval returns an ETag equal to the immutable fingerprint.
- **AT-032.** Conditional Manifest retrieval returns not-modified for a matching ETag.
- **AT-033.** A hidden binding is absent from unauthorized catalog and detail responses.
- **AT-034.** Binding activation Event contains exact resource identity and fingerprint.
- **AT-035.** Binding activation never writes the target Engine database.
- **AT-036.** Required dependency readiness failure blocks activation when policy says fail closed.
- **AT-037.** Optional dependency readiness failure allows activation when policy permits.
- **AT-038.** Reverse dependency lookup finds every Edition referencing a retired foreign resource.
- **AT-039.** Binding close policy is preserved exactly in the published Manifest.
- **AT-040.** Compiler version and schema version are recorded for deterministic reproduction.
### Schedule and trusted time

- **AT-041.** Initial publication creates Schedule Revision 1.
- **AT-042.** All persisted authoritative schedule instants are UTC.
- **AT-043.** An invalid IANA timezone is rejected.
- **AT-044.** A nonexistent spring-forward local time requires author correction.
- **AT-045.** An ambiguous fall-back local time requires explicit occurrence selection.
- **AT-046.** Half-open windows accept an operation at opens_at.
- **AT-047.** Half-open windows reject a normal operation exactly at closes_at.
- **AT-048.** A display timezone change does not alter authoritative UTC instants.
- **AT-049.** An extension creates a new immutable Schedule Revision.
- **AT-050.** An extension cannot shorten an existing deadline.
- **AT-051.** An early-close command uses a distinct change type and elevated authorization.
- **AT-052.** An effective Schedule Revision cannot be updated or deleted.
- **AT-053.** Old Schedule Revisions remain queryable after supersession.
- **AT-054.** Schedule diff identifies every changed phase and window.
- **AT-055.** Schedule revision publication supersedes obsolete future timers atomically.
- **AT-056.** A stale timer referencing an old Schedule Revision becomes superseded.
- **AT-057.** Pause with WALL_CLOCK_CONTINUES does not move planned close.
- **AT-058.** Pause with EXTEND_BY_PAUSE_DURATION creates revised downstream deadlines on resume.
- **AT-059.** Pause with EXPLICIT_REVISION_REQUIRED cannot resume without an approved revision when deadlines need change.
- **AT-060.** Overlapping phases in the same lane are rejected.
- **AT-061.** Overlapping phases in different declared lanes are accepted.
- **AT-062.** A phase with starts_at equal to ends_at is rejected.
- **AT-063.** A settlement window ending before close is rejected.
- **AT-064.** A claim window ending before its declared eligible event can occur is rejected.
- **AT-065.** Server trusted time, not client time, determines window status.
- **AT-066.** Clock skew above threshold removes a worker from timer execution.
- **AT-067.** A context query for a historical instant resolves the revision effective at that instant.
- **AT-068.** A backdated schedule correction records distinct effective_at and recorded_at.
- **AT-069.** A backdated correction without elevated approval is rejected.
- **AT-070.** Schedule fingerprint changes whenever a mechanical schedule fact changes.
### Edition lifecycle

- **AT-071.** A validated and approved Edition can be published and scheduled atomically.
- **AT-072.** Publication failure rolls back Manifest, Revision, timers, state, and outbox rows.
- **AT-073.** A scheduled activation timer transitions the Edition to Active once.
- **AT-074.** A duplicate activation timer returns the original transition result.
- **AT-075.** Manual activation followed by the scheduled timer leaves one activation.
- **AT-076.** Activation from Draft is rejected.
- **AT-077.** Activation with a stale expected aggregate version is rejected.
- **AT-078.** Mandatory dependency failure moves the attempt to Activation Blocked without claiming Active.
- **AT-079.** Recovery from Activation Blocked rechecks all mandatory gates.
- **AT-080.** Activation Event is emitted only after local commit.
- **AT-081.** Consumer outage does not roll back a committed activation.
- **AT-082.** An Active Edition may transition to Paused.
- **AT-083.** A Paused Edition may transition to Active through resume.
- **AT-084.** Resume from any non-Paused state is rejected.
- **AT-085.** Pause records operation policy and reason.
- **AT-086.** Close from Active commits Closing then Closed according to implementation contract.
- **AT-087.** Close from Paused follows the published policy and remains auditable.
- **AT-088.** Close stops new normal Season operations.
- **AT-089.** Close does not imply Finalized.
- **AT-090.** Cancellation is permitted before any activation.
- **AT-091.** Cancellation after activation is rejected.
- **AT-092.** Termination after activation records that the Edition was active.
- **AT-093.** Termination before activation is rejected in favor of cancellation.
- **AT-094.** A Cancelled Edition cannot activate.
- **AT-095.** A Terminated Edition can enter settlement when policy requires.
- **AT-096.** A Closed Edition can enter Settling.
- **AT-097.** Finalization with unresolved mandatory gates is blocked.
- **AT-098.** Finalization after all mandatory gates pass commits once.
- **AT-099.** A Finalized Edition rejects extension, pause, resume, close, and normal correction commands.
- **AT-100.** Finalization Event contains final Manifest and Schedule Revision.
- **AT-101.** Lifecycle current state equals the last ledger transition.
- **AT-102.** Lifecycle ledger sequence has no gaps after committed commands.
- **AT-103.** Lifecycle Events preserve aggregate ordering by partition key.
- **AT-104.** Edition with zero participants can close and finalize when policy allows.
- **AT-105.** An Edition cannot be reused for a later recurrence.
- **AT-106.** Copying an Edition creates a new Draft identity without participants.
- **AT-107.** A finalized public archive uses the sealed final summary revision.
- **AT-108.** An operational projection failure does not alter authoritative lifecycle.
- **AT-109.** Reconciliation recreates a missing safe timer without duplicating a transition.
- **AT-110.** Direct database state mutation is detected as ledger divergence.
### Phases and windows

- **AT-111.** A due phase timer starts one planned Phase Occurrence.
- **AT-112.** Starting a phase twice has one logical effect.
- **AT-113.** A phase cannot start before its effective start without an approved manual override.
- **AT-114.** A phase started late records intended effective and actual recorded time.
- **AT-115.** Ending a phase publishes one phase-ended Event.
- **AT-116.** A phase cannot end before it starts.
- **AT-117.** A planned phase may be skipped only through an approved revision.
- **AT-118.** A started phase cannot be marked Skipped.
- **AT-119.** Termination interrupts every currently started phase according to policy.
- **AT-120.** At most one phase is active in one lane.
- **AT-121.** Parallel lanes return all active phase keys in context.
- **AT-122.** A window-open Event uses the effective Schedule Revision.
- **AT-123.** A window-close Event is idempotent.
- **AT-124.** A stale cached window cannot authorize an enrollment command.
- **AT-125.** Pause policy can block progress while leaving claims open.
- **AT-126.** Context resolution returns no closed window as open.
- **AT-127.** Historical timeline includes skipped and interrupted phase states.
- **AT-128.** Changing a localized phase label does not change phase identity.
- **AT-129.** Unknown phase kind is rejected unless registered by schema.
- **AT-130.** Phase activation binding fires only for bindings mapped to that phase.
### Participation and enrollment

- **AT-131.** Opt-in enrollment during the entry window creates one Participation.
- **AT-132.** Opt-in enrollment before the entry window is rejected.
- **AT-133.** Opt-in enrollment exactly at entry close is rejected under half-open semantics.
- **AT-134.** Automatic enrollment uses one idempotency identity per Character and Edition.
- **AT-135.** Concurrent automatic and opt-in enrollment creates one Participation.
- **AT-136.** Duplicate enrollment with the same payload returns the original receipt.
- **AT-137.** Duplicate enrollment with a different payload and same key is rejected.
- **AT-138.** A Character cannot have two Participations in one Edition.
- **AT-139.** Enrollment rejects an ineligible Character.
- **AT-140.** Enrollment fails closed when required eligibility facts are stale.
- **AT-141.** Enrollment rejects a suspended Character when policy requires Active status.
- **AT-142.** Enrollment into a Cancelled Edition is rejected.
- **AT-143.** Enrollment into a Finalized Edition is rejected.
- **AT-144.** Enrollment into an Active Edition succeeds only when late-entry policy permits.
- **AT-145.** Enrollment atomically enforces exclusivity.
- **AT-146.** Concurrent enrollment into two exclusive Editions yields at most the configured maximum active Participations.
- **AT-147.** REJECT_NEW exclusivity leaves the existing Participation unchanged.
- **AT-148.** QUEUE_PENDING exclusivity creates a Pending Participation only when policy permits.
- **AT-149.** REQUIRE_EXIT exclusivity does not silently exit another Season.
- **AT-150.** ADMIN_REVIEW exclusivity produces a reviewable pending result.
- **AT-151.** An Enrolled Participation activates when the Edition activates.
- **AT-152.** Enrollment into an already Active Edition creates Active state when policy permits.
- **AT-153.** Participation pause records source and reason.
- **AT-154.** Character suspension applies the pinned suspension policy.
- **AT-155.** Character restoration does not extend deadlines implicitly.
- **AT-156.** Withdrawal before activation succeeds only under policy.
- **AT-157.** Withdrawal after activation is rejected in favor of exit.
- **AT-158.** Exit from Active state records the exit reason and time.
- **AT-159.** Re-entry prohibited policy rejects a later resume or re-enroll attempt.
- **AT-160.** Re-entry within entry window uses the existing Aggregate.
- **AT-161.** Disqualification requires elevated authorization and a decision reference.
- **AT-162.** Disqualification preserves prior lifecycle history.
- **AT-163.** Completion uses only Season-owned or registered signed facts.
- **AT-164.** Participation completion does not assert Reward delivery.
- **AT-165.** Participation close can be executed in resumable shards.
- **AT-166.** Participation finalization pins the Edition finalization revision.
- **AT-167.** Finalized Participation rejects normal lifecycle mutation.
- **AT-168.** An integrity annotation may be added without deleting Finalized history.
- **AT-169.** Character closure transitions open Participation according to policy.
- **AT-170.** Character anonymization removes direct Character identity while preserving unique pseudonymous history.
- **AT-171.** Anonymized Participation cannot be resolved through owner API with the old Character ID.
- **AT-172.** Participation summary counters are not updated through one global lock.
- **AT-173.** Capacity enforcement uses authoritative reservation, not approximate projection counts.
- **AT-174.** Concurrent finalization and integrity-case opening serialize safely.
- **AT-175.** One failed Participation shard does not roll back successfully finalized shards.
### Invitations

- **AT-176.** Issuing an Invitation stores only a token hash.
- **AT-177.** The raw Invitation token is returned only through the secure issue response.
- **AT-178.** A valid Invitation can be redeemed once for a one-use policy.
- **AT-179.** Redeeming an expired Invitation is rejected.
- **AT-180.** Redeeming a revoked Invitation is rejected.
- **AT-181.** Redemption and revocation racing produce one deterministic outcome.
- **AT-182.** Redemption count never exceeds usage limit.
- **AT-183.** Concurrent redemption by the same Character creates one Participation.
- **AT-184.** A second Invitation redemption for an already enrolled Character follows the declared consume-or-preserve policy.
- **AT-185.** Default duplicate redemption preserves the unused second Invitation.
- **AT-186.** Invitation lookup is rate limited and non-enumerating.
- **AT-187.** Raw Invitation token is absent from logs, traces, audit payloads, and database.
- **AT-188.** Batch Invitation creation is bounded and audited.
- **AT-189.** Cancellation revokes or disables Invitations according to policy.
- **AT-190.** Invitation token comparison does not expose timing-based existence information.
### Eligibility and audience policy

- **AT-191.** Eligibility evaluation records the exact policy revision.
- **AT-192.** Eligibility evaluation records a fact revision vector.
- **AT-193.** An unknown required fact returns UNKNOWN or fail-closed according to policy.
- **AT-194.** A policy cannot call an unregistered remote service.
- **AT-195.** A policy with a loop is rejected by the compiler.
- **AT-196.** A policy exceeding node depth is rejected.
- **AT-197.** Equivalent normalized policy produces a stable fingerprint.
- **AT-198.** Discovery audience and enrollment eligibility may use different policies.
- **AT-199.** An ineligible hidden Season does not leak through reason details.
- **AT-200.** AT_ENROLLMENT_ONLY policy does not eject a Character when a later fact changes.
- **AT-201.** AT_ACTIVATION policy rechecks facts before Participation activation.
- **AT-202.** CONTINUOUS policy responds only to registered fact-change Events.
- **AT-203.** FINALIZATION policy can block completion without rewriting earlier eligibility.
- **AT-204.** Eligibility Decision expiry prevents stale reuse.
- **AT-205.** A correction creates a new Decision linked to the superseded Decision.
- **AT-206.** Evidence payload stores references rather than unnecessary personal source data.
- **AT-207.** Fact owner and revision are preserved.
- **AT-208.** Untrusted producer facts are quarantined.
- **AT-209.** Policy runtime budget exhaustion fails deterministically.
- **AT-210.** Policy compiler upgrade passes compatibility fixtures for published policies.
### Idempotency and concurrency

- **AT-211.** Every mutation accepts a caller-scoped idempotency key.
- **AT-212.** Same key and same canonical payload returns the original receipt.
- **AT-213.** Same key and different canonical payload returns conflict.
- **AT-214.** A timeout after commit is safely retried with the same key.
- **AT-215.** Expected aggregate version prevents lost lifecycle updates.
- **AT-216.** Canonical lock order prevents deadlock among Edition, exclusivity, Participation, and Invitation rows.
- **AT-217.** A deadlock retry reuses command identity and creates at most one effect.
- **AT-218.** Two operators pausing concurrently produce one committed transition.
- **AT-219.** Pause and close racing produce a deterministic valid lifecycle result.
- **AT-220.** Extend and close racing cannot create a revision that reopens a Finalized Edition.
- **AT-221.** Invitation redemption and enrollment share one transaction.
- **AT-222.** Timer lease expiry does not create duplicate lifecycle transitions.
- **AT-223.** Outbox insert is committed in the same transaction as state.
- **AT-224.** Ledger sequence and aggregate version advance atomically.
- **AT-225.** Bulk job retry uses stable per-target keys.
- **AT-226.** Projection rebuild never writes authoritative Aggregate rows.
- **AT-227.** Serializable conflict returns retryable classification.
- **AT-228.** One global lock is not taken for unrelated Editions.
- **AT-229.** Cross-region replay does not duplicate a logical transition.
- **AT-230.** Aggregate version uses bigint and never wraps silently.
### Events, inbox, and outbox

- **AT-231.** Every produced Event uses a globally unique Event ID.
- **AT-232.** Every Event type includes a major schema version.
- **AT-233.** Every Event includes occurredAt and recordedAt.
- **AT-234.** Every Event includes correlation and causation where available.
- **AT-235.** Sensitive eligibility evidence is absent from public Events.
- **AT-236.** Consumed duplicate Event is deduplicated by producer and Event ID.
- **AT-237.** Same Event ID from a different producer does not collide unless global policy says otherwise.
- **AT-238.** Unsupported major Event version is quarantined.
- **AT-239.** Invalid producer identity is rejected.
- **AT-240.** Oversized Event payload is rejected before domain processing.
- **AT-241.** Event processing acknowledges transport only after commit.
- **AT-242.** Outbox relay retry republishes the same Event ID.
- **AT-243.** Duplicate transport is safe for consumers.
- **AT-244.** Aggregate Event sequence is monotonic.
- **AT-245.** Delayed older Schedule Revision Event is identifiable as superseded.
- **AT-246.** Replay dry-run emits no production side effects.
- **AT-247.** Replay apply mode requires explicit side-effect policy.
- **AT-248.** Dead-letter recovery preserves original Event metadata.
- **AT-249.** Outbox lag alert fires above the configured threshold.
- **AT-250.** Inbox poison Event does not block unrelated partitions.
### Settlement and finalization

- **AT-251.** Close creates or activates every declared settlement gate.
- **AT-252.** A required elapsed-time gate cannot pass before its due instant.
- **AT-253.** A required external Event gate passes only for the expected owner, schema, and identity.
- **AT-254.** An unrelated Reward terminal Event does not satisfy a gate.
- **AT-255.** A gate fact with fingerprint mismatch is rejected.
- **AT-256.** Blocked gate records first-blocked and last-checked times.
- **AT-257.** Optional gate failure does not block finalization unless policy says mandatory.
- **AT-258.** Mandatory failed gate blocks finalization.
- **AT-259.** Waiving a gate requires authorized reason and approval.
- **AT-260.** A waived gate is reported as WAIVED, not SATISFIED.
- **AT-261.** Finalization preview lists every unresolved gate.
- **AT-262.** Finalization checks open integrity cases atomically.
- **AT-263.** Finalization and a new mandatory integrity case cannot both commit inconsistently.
- **AT-264.** Settlement timeout does not imply foreign operation failure.
- **AT-265.** Late foreign fact before finalization can satisfy the gate.
- **AT-266.** Late foreign fact after finalization opens or annotates an integrity case.
- **AT-267.** Finalization does not wait for optional analytics export.
- **AT-268.** Finalization summary counts use a sealed projection revision.
- **AT-269.** A rebuilt count mismatch opens an integrity case.
- **AT-270.** Finalization Event is published exactly once logically.
- **AT-271.** Reward revocation after Season finalization does not reopen the Edition.
- **AT-272.** Leaderboard dispute keeps the relevant gate unresolved.
- **AT-273.** Gate waiver is visible in the final archive to authorized operators.
- **AT-274.** Terminated Edition follows its explicit settlement policy.
- **AT-275.** Cancelled pre-activation Edition may finalize a cancellation outcome without normal participant settlement.
### Corrections, replay, and backfill

- **AT-276.** Schedule correction appends a new Revision and preserves the erroneous Revision.
- **AT-277.** Backdated correction requires elevated authorization and impact analysis.
- **AT-278.** Correction records effective and recorded time separately.
- **AT-279.** Correction cannot silently change a published Manifest.
- **AT-280.** Historical context resolution can reproduce the originally effective schedule.
- **AT-281.** Reevaluation creates a new temporal or eligibility decision.
- **AT-282.** Reevaluation links the superseded decision.
- **AT-283.** Correction affecting enrolled Participants produces a bounded impact set.
- **AT-284.** Automatic remediation runs only when an approved policy permits it.
- **AT-285.** Backfill job records policy revision and input snapshot.
- **AT-286.** Backfill is resumable from a durable cursor.
- **AT-287.** Backfill retry does not duplicate Participations.
- **AT-288.** Backfill does not impersonate original live processing time.
- **AT-289.** Backfill can run in dry-run mode.
- **AT-290.** Backfill rate limiting protects live lifecycle workers.
- **AT-291.** Projection rebuild uses shadow output and atomic switch.
- **AT-292.** Timer rebuild recreates only missing current-revision timers.
- **AT-293.** Reconciliation detects current-state and ledger mismatch.
- **AT-294.** Safe repair appends an auditable repair transition.
- **AT-295.** Unsafe discrepancy opens an integrity case instead of auto-repair.
- **AT-296.** Replay of lifecycle source Events does not republish new lifecycle facts by default.
- **AT-297.** Post-finalization factual correction does not unfinalize the Edition.
- **AT-298.** Correction of archive presentation creates a presentation revision only.
- **AT-299.** Migration from one policy schema preserves published interpreter compatibility.
- **AT-300.** Bulk job cancellation stops new shards and preserves committed target results.
### API and authorization

- **AT-301.** Public catalog returns only visible authorized Editions.
- **AT-302.** Hidden Edition lookup returns a non-enumerating response.
- **AT-303.** Owner Participation endpoint verifies User-to-Character authorization.
- **AT-304.** Internal Manifest endpoint requires service scope.
- **AT-305.** Administrative mutation requires expected aggregate version.
- **AT-306.** High-impact administrative mutation requires reason code.
- **AT-307.** Configured high-impact mutation requires two-person approval.
- **AT-308.** Approval token is bound to the exact Manifest and schedule fingerprints.
- **AT-309.** Stale approval token is rejected after content change.
- **AT-310.** Cursor pagination is stable and signed.
- **AT-311.** Modified cursor is rejected.
- **AT-312.** Manifest ETag supports immutable caching.
- **AT-313.** Write API returns a durable command receipt.
- **AT-314.** Bulk API returns a job identity and does not claim immediate completion.
- **AT-315.** 422 is returned for semantically invalid policy.
- **AT-316.** 409 is returned for exclusivity conflict.
- **AT-317.** 412 is returned for stale ETag or precondition.
- **AT-318.** 503 fail-closed response is used when mandatory dependency validation is unavailable.
- **AT-319.** Owner endpoint never exposes investigator-only evidence.
- **AT-320.** Context endpoint rate limiting protects against cross-Character scraping.
### Security and privacy

- **AT-321.** Administrative APIs require authenticated elevated identity.
- **AT-322.** Service Events from an untrusted producer are quarantined.
- **AT-323.** Published Manifest fingerprint mismatch blocks use.
- **AT-324.** Policy payload cannot execute code or network requests.
- **AT-325.** Hidden Season names are absent from logs and metrics labels for unauthorized requests.
- **AT-326.** Shared caches never contain invitation-only detail responses.
- **AT-327.** Invitation secrets are redacted by structured logging filters.
- **AT-328.** Database application role cannot update lifecycle ledger.
- **AT-329.** Database application role cannot update a published Manifest.
- **AT-330.** Break-glass action produces immediate alert and review record.
- **AT-331.** Privacy export includes owner-safe Participation history.
- **AT-332.** Privacy export excludes other participants and restricted evidence.
- **AT-333.** Anonymization workflow is idempotent.
- **AT-334.** Anonymization removes Character ID from projections.
- **AT-335.** Anonymization preserves minimum pseudonymous integrity linkage.
- **AT-336.** Erasure does not claim deletion from foreign Engines.
- **AT-337.** Minor-safe policy disables public participation by default.
- **AT-338.** Aggregate public counts below disclosure threshold are suppressed.
- **AT-339.** Analytics Events exclude Invitation tokens and private reasons.
- **AT-340.** Cross-region failover respects realm data residency.
- **AT-341.** Security audit detects attempted raw SQL lifecycle mutation.
- **AT-342.** Free-text reasons are bounded, sanitized, and classified.
- **AT-343.** Token brute-force protection applies per risk dimensions.
- **AT-344.** Backup restore preserves encryption and access controls.
- **AT-345.** Lower environment import rejects non-anonymized production Participation data.
### Persistence and recovery

- **AT-346.** Authoritative transaction updates state, ledger, timer, receipt, and outbox atomically.
- **AT-347.** A crash before commit leaves no partial transition.
- **AT-348.** A crash after commit and before response is resolved by idempotent receipt.
- **AT-349.** A crash after outbox commit and before broker publish is recovered by relay.
- **AT-350.** A database restore preserves command receipts.
- **AT-351.** A database restore preserves inbox deduplication.
- **AT-352.** A database restore allows timer regeneration from Schedule Revision.
- **AT-353.** Point-in-time recovery followed by reconciliation detects broker divergence.
- **AT-354.** Published rows remain immutable after restore.
- **AT-355.** Lifecycle ledger sequence uniqueness is enforced.
- **AT-356.** Participation uniqueness survives partitioning.
- **AT-357.** Invitation over-redemption is blocked by constraint and locking.
- **AT-358.** Phase lane overlap is blocked for effective rows.
- **AT-359.** Malformed current state is detected by invariant scan.
- **AT-360.** Projection tables can be dropped and rebuilt without authoritative loss.
- **AT-361.** Old partitions remain queryable under retention policy.
- **AT-362.** Archive process preserves Manifest and lifecycle history.
- **AT-363.** Command receipt retention exceeds maximum caller retry period.
- **AT-364.** Inbox retention supports configured replay horizon.
- **AT-365.** Outbox cleanup occurs only after durable publication evidence and retention.
### Performance and operations

- **AT-366.** Public Season detail meets the defined p95 target under representative load.
- **AT-367.** Enrollment meets the defined p95 target without synchronous foreign calls.
- **AT-368.** Timer due-to-commit latency meets p99 target under normal load.
- **AT-369.** Activation boundary burst does not require one transaction per participant.
- **AT-370.** Close boundary burst does not lock all Participations.
- **AT-371.** Auto-enrollment scales by partitioned shards.
- **AT-372.** Summary counters are sharded or projected asynchronously.
- **AT-373.** Immutable Manifest cache reduces repeated database reads.
- **AT-374.** Critical lifecycle workers retain capacity under bulk-job load.
- **AT-375.** Projection rebuild is deprioritized under lifecycle pressure.
- **AT-376.** Due-timer index supports bounded claim latency.
- **AT-377.** SKIP LOCKED or equivalent prevents worker convoy.
- **AT-378.** Outbox relay scales independently from command API.
- **AT-379.** Context resolution uses indexed Edition and schedule ranges.
- **AT-380.** Participant history uses cursor pagination and bounded result size.
- **AT-381.** Operational dashboard exposes timer, outbox, inbox, and projection lag.
- **AT-382.** Activation-overdue alert fires with Edition identity and blocking reason.
- **AT-383.** Finalization-blocked alert includes unresolved gates.
- **AT-384.** Clock-skew alert prevents unsafe timer execution.
- **AT-385.** Disaster recovery exercise proves documented RPO and RTO.
- **AT-386.** Optional dependency outage does not saturate retry workers.
- **AT-387.** Poison Event retries use backoff and dead-letter policy.
- **AT-388.** Bulk job pause and resume preserve cursor.
- **AT-389.** Large Edition remains operable without a global aggregate counter lock.
- **AT-390.** Database index plan is verified against production-scale cardinality.
### UX and accessibility

- **AT-391.** Countdown uses server deadline and refreshes after reconnect.
- **AT-392.** Countdown reaching zero does not locally assert lifecycle transition.
- **AT-393.** Timeline displays absolute local time and timezone.
- **AT-394.** Schedule extension visibly identifies changed deadline.
- **AT-395.** Pause screen states which operations remain available.
- **AT-396.** Close screen distinguishes activity close, grace, claims, settlement, and finalization.
- **AT-397.** Cancellation and termination use distinct user language.
- **AT-398.** Enrollment UI waits for authoritative receipt before success.
- **AT-399.** Ineligible explanation uses safe reason codes without hidden-policy leakage.
- **AT-400.** Disqualification view provides appeal path when configured.
- **AT-401.** Status is not conveyed by color alone.
- **AT-402.** Timeline is keyboard navigable.
- **AT-403.** Rapid countdown updates do not overwhelm screen readers.
- **AT-404.** Offline write retry reuses the original idempotency key.
- **AT-405.** Hidden Season assets are not preloaded into unauthorized clients.

---

## Future Extensions

Future work must preserve current ownership boundaries and require ADR review when it introduces new state semantics.

### Recurring Season templates

A template service may generate Draft Editions for annual, quarterly, monthly, or custom recurrence.

Requirements:

- every occurrence receives a new Edition identity;
- schedule is recalculated in the declared IANA timezone;
- DST ambiguity is surfaced;
- Manifest is recompiled;
- foreign references are revalidated;
- publication is never automatic without governance policy;
- Participants and lifecycle history are never copied.

### Cohorts

A future Cohort capability may group Participants within one Edition.

Season Engine may own cohort assignment only when the cohort is purely Season-scoped. Persistent teams, guilds, classes, or organizations belong to their own domain owner.

A Cohort extension would require:

- stable Cohort identity;
- assignment lifecycle;
- capacity;
- balancing policy;
- privacy;
- cohort-scoped bindings;
- migration;
- acceptance tests.

### Season Pass orchestration

A commercial or free Season Pass may combine:

- one seasonal Progression Track;
- claimable tier Rewards;
- premium entitlement;
- catch-up policy;
- archive.

Ownership remains distributed:

- commerce owns purchase;
- entitlement owner owns access;
- Progression Engine owns track;
- Reward Engine owns tier grants;
- Season Engine owns time context.

Season Engine MUST NOT become a wallet or entitlement ledger.

### Multi-stage settlement

A future settlement graph may support ordered gates such as:

1. progression ingestion closed;
2. leaderboard preliminary;
3. appeal window;
4. leaderboard final;
5. Reward Grants requested;
6. critical Reward fulfillment terminal;
7. Edition finalized.

The graph must remain bounded, typed, and data-driven. Arbitrary workflow scripting remains prohibited.

### Competitive divisions

A Leaderboard Engine may publish division placement and finalization facts. Season Engine may:

- bind the leaderboard;
- expose its public reference;
- wait on finalization;
- emit participation completion based on a signed fact.

Season Engine does not calculate score or rank.

### Regional schedules

One conceptual release may have separate Editions by realm or region. A future parent Release Group could aggregate them for authoring and reporting without creating shared mutable lifecycle.

### Dynamic content drops

A future LiveOps integration may publish additional Content Binding Bundles during an Active Edition.

This requires a new Manifest Amendment contract because the current Manifest is immutable. Any amendment must:

- be append-only;
- have its own fingerprint and approval;
- define activation and close behavior;
- preserve prior Manifest;
- avoid silently changing existing Participant obligations;
- publish explicit amendment Events.

### Controlled Season transfer

A future migration may allow a Participation to move between equivalent Editions after realm or cohort migration. It must not rewrite history. The source Participation closes with a transfer outcome and the target Participation references the transfer.

### Team participation

Team or guild Season Participation requires a separate aggregate owner or a carefully bounded extension. Individual Character Participation must not be overloaded to represent shared ownership.

### Capacity queues

A future queue may support waitlists. Requirements include:

- stable queue entry;
- fair deterministic ordering;
- anti-abuse controls;
- expiry;
- offer window;
- idempotent promotion;
- privacy;
- no approximate-count authorization.

### Signed temporal context tokens

High-volume trusted producers may use short-lived signed context tokens to avoid synchronous resolution.

A token must include:

- Edition;
- Manifest;
- Schedule Revision;
- phase and window;
- realm;
- subject scope;
- issue and expiry;
- signer;
- nonce or replay policy.

Tokens cannot outlive the correction risk policy and do not override a later explicit revocation contract unless the consumer checks it.

### Formal policy verification

The policy compiler may add:

- satisfiability checks;
- dead-rule detection;
- overlap proofs;
- test-case generation;
- equivalence comparison;
- privacy linting;
- cost estimation.

### Multi-region active-active

A future active-active architecture requires an ADR for:

- lifecycle authority;
- timer ownership;
- conflict-free enrollment;
- exclusivity;
- global Edition identity;
- Event ordering;
- failover;
- data residency.

The current model assumes one authoritative owning region per aggregate.

### Cryptographic audit anchoring

Lifecycle ledger roots may be periodically anchored to an external trusted store. This improves tamper evidence but does not replace database authorization, backup, or application audit.

### Public Season federation

A future federation protocol may allow external communities to publish compatible Season manifests. Federated content must not become trusted merely because it follows the schema. Signature, trust domain, moderation, privacy, and resource isolation are mandatory.

### Experimentation

Season narrative or UI experiments may vary presentation, but a mechanical experiment that changes eligibility, schedule, bindings, or completion must use explicit policy variants and preserve assignment evidence.

### AI-assisted authoring

AI may suggest:

- phase plans;
- descriptions;
- schedule risk;
- test cases;
- dependency checks.

AI output remains Draft, must pass deterministic validation, and cannot publish or operate a Season autonomously.

### Calendar export

Clients may export visible milestones to calendar formats. Export is a projection and not authoritative. Schedule revisions should generate updated export revisions rather than editing a user's external calendar without consent.

### Advanced archive

A future archive may include:

- narrative recap;
- selected public milestones;
- final content gallery;
- signed outcome summary;
- migration to a museum or collection.

Archive remains privacy-aware and does not expose private Participation.

---

## ADR References

The following ADRs are required or recommended. Existing ADR identifiers should be reconciled with the repository's canonical ADR index.

### ADR-001 — Platform First

The Season Engine is domain-agnostic and contains no School-specific lifecycle or vocabulary.

### ADR-002 — Event-Driven Engine Integration

Cross-Engine coordination uses immutable Events and exact references. Direct Engine-to-Engine state mutation is prohibited.

### ADR-003 — Platform-Owned Character

Participation references a platform Character and never transfers Character ownership to a Module or Season.

### ADR-004 — Single Writer per Aggregate

Season Engine is the sole writer of Season Definitions, Editions, Schedules, and Participations.

### ADR-005 — Immutable Published Configuration

Published Definition Versions and Manifests are immutable and content-addressed.

### ADR-006 — At-Least-Once Delivery with Exactly-Once Logical Effect

Inbox, command receipts, unique constraints, aggregate versioning, and outbox provide replay safety.

### ADR-007 — Transactional Outbox

Every committed domain transition and its Events share one local transaction.

### ADR-008 — Trusted UTC Time

Authoritative lifecycle decisions use trusted UTC instants. Local time is resolved before publication.

### ADR-009 — Append-Only Schedule Revisions

Pause, extension, early close, and correction create immutable revisions rather than mutating history.

### ADR-010 — Close Is Not Finalize

Season close stops normal activity; finalization occurs only after settlement gates and reconciliation.

### ADR-011 — Cross-Engine Content Bindings

Season Manifests reference exact immutable foreign identities while each owner retains aggregate authority.

### ADR-012 — Participation as a Separate Aggregate

Per-Character Participation is isolated from the Edition Aggregate to prevent unbounded locks and state growth.

### ADR-013 — No Distributed Transactions

Cross-Engine lifecycle effects are asynchronous and reconciled through Events, gates, and idempotent contracts.

### ADR-014 — Bounded Policy Language

Eligibility and audience policies use deterministic registered operators with no arbitrary code or network access.

### ADR-015 — Privacy-Minimized Fact Projections

Season Engine stores decisions and revision vectors rather than copying foreign personal data whenever possible.

### ADR-016 — Durable Timers

Lifecycle scheduling uses persisted timer intent, leases, idempotent commands, and reconciliation.

### ADR-017 — Half-Open Time Intervals

Windows and phases default to `[start, end)` semantics to eliminate boundary ambiguity.

### ADR-018 — Cancellation and Termination Are Distinct

Cancellation is pre-activation. Termination preserves post-activation history and settlement obligations.

### ADR-019 — Finalization Is Terminal

Normal state reopening after Finalization is prohibited. Corrections use integrity and compensating workflows.

### ADR-020 — Hidden Content Is Server-Side

Visibility is enforced before indexing, caching, serialization, logging, and asset delivery.

### ADR candidates

The following need dedicated ADRs when implemented:

- Manifest amendments during Active Editions;
- active-active multi-region lifecycle;
- signed temporal context tokens;
- team Participation;
- capacity queues;
- federated Seasons;
- cryptographic audit anchoring;
- Season Pass commercial integration.

---

## Appendix

### A. Canonical Edition lifecycle transition table

| Current state | Command or trigger | Next state | Required notes |
|---|---|---|---|
| DRAFT | validate | VALIDATING | Candidate fingerprint pinned |
| VALIDATING | validation failed | REJECTED | Report retained |
| VALIDATING | validation passed | APPROVED | Governance may be separate |
| APPROVED | publish and schedule | SCHEDULED | Manifest and Revision 1 immutable |
| SCHEDULED | cancel | CANCELLED | Only before activation |
| SCHEDULED | activation due | ACTIVATING | Timer or authorized command |
| ACTIVATING | dependency blocked | ACTIVATION_BLOCKED | No Active claim |
| ACTIVATION_BLOCKED | retry succeeds | ACTIVE | All mandatory gates rechecked |
| ACTIVATING | commit | ACTIVE | Activation Event outboxed |
| ACTIVE | pause | PAUSED | Explicit operation policy |
| PAUSED | resume | ACTIVE | Schedule revision when required |
| ACTIVE | terminate | TERMINATING | Elevated workflow |
| TERMINATING | commit termination | TERMINATED | History preserved |
| ACTIVE | close | CLOSING | New normal operations stop |
| PAUSED | close | CLOSING | Policy-specific |
| TERMINATED | settle | SETTLING | If settlement required |
| CLOSING | close committed | CLOSED | Grace may remain |
| CLOSED | start settlement | SETTLING | Gates evaluated |
| SETTLING | finalize attempt | FINALIZING | Snapshot gate state |
| FINALIZING | blocked | FINALIZATION_BLOCKED | Reasons recorded |
| FINALIZATION_BLOCKED | resume settlement | SETTLING | After correction or waiver |
| FINALIZING | commit | FINALIZED | Terminal |
| CANCELLED | archive/final summary | FINALIZED or retained terminal | Product policy; no Active history |

The exact implementation may combine transient states in one transaction, but Events and audit must preserve equivalent semantics.

### B. Participation transition table

| Current state | Trigger | Next state |
|---|---|---|
| none | enrollment requires review | PENDING |
| none | enrollment accepted | ENROLLED |
| PENDING | accepted | ENROLLED |
| PENDING | rejected | REJECTED |
| ENROLLED | Edition active | ACTIVE |
| ENROLLED | withdraw | WITHDRAWN |
| ACTIVE | suspension/review | PAUSED |
| PAUSED | valid resume | ACTIVE |
| ACTIVE | voluntary exit | EXITED |
| ACTIVE/PAUSED/ENROLLED | approved disqualification | DISQUALIFIED |
| ACTIVE | completion rule true | COMPLETED |
| ACTIVE/PAUSED/COMPLETED | Edition close policy | CLOSED |
| CLOSED/COMPLETED | finalization | FINALIZED |

### C. Core lifecycle reason codes

Recommended stable codes:

- `SCHEDULED_TIMER`;
- `AUTHORIZED_MANUAL`;
- `PLATFORM_INCIDENT`;
- `DEPENDENCY_UNAVAILABLE`;
- `DEPENDENCY_RECOVERED`;
- `SERVICE_INTERRUPTION_COMPENSATION`;
- `PRODUCT_EXTENSION`;
- `SCHEDULE_CORRECTION`;
- `REGULATORY_RESTRICTION`;
- `SECURITY_INCIDENT`;
- `CONTENT_SAFETY`;
- `CHARACTER_SUSPENDED`;
- `CHARACTER_RESTORED`;
- `CHARACTER_CLOSED`;
- `OWNER_WITHDRAWAL`;
- `OWNER_EXIT`;
- `ELIGIBILITY_FAILED`;
- `EXCLUSIVITY_CONFLICT`;
- `INVITATION_REDEEMED`;
- `QUALIFICATION_CONFIRMED`;
- `APPROVED_INTEGRITY_DECISION`;
- `SETTLEMENT_COMPLETE`;
- `SETTLEMENT_GATE_WAIVED`;
- `PRIVACY_TRANSFORMATION`;
- `DATA_REPAIR`.

Free text may supplement but never replace a controlled reason.

### D. Required Manifest validation checks

A release validator MUST check at least:

1. Definition Version is published.
2. Edition key is unique in realm.
3. display timezone is valid IANA.
4. every local time resolves exactly.
5. activation precedes normal close.
6. settlement does not end before close.
7. phase intervals are valid.
8. same-lane phases do not overlap.
9. required windows exist.
10. operation windows are ordered.
11. grace is explicit.
12. pause policy is declared.
13. lateness policy is declared.
14. participation mode is registered.
15. eligibility policy compiles.
16. policy cost is bounded.
17. completion policy uses allowed facts.
18. finalization gates are typed.
19. every foreign binding resolves.
20. every required dependency fingerprint matches.
21. visibility compatibility is valid.
22. hidden content cannot leak through public bindings.
23. exclusivity group policy is valid.
24. estimated enrollment is within capacity.
25. privacy classification is complete.
26. minor-safe requirements are satisfied.
27. localization baseline exists.
28. administrative approval policy is satisfied.
29. Manifest canonicalization is deterministic.
30. simulation produces no fatal conflicts.

### E. Recommended timer types

- `EDITION_PREVIEW_OPEN`;
- `EDITION_ENROLLMENT_OPEN`;
- `EDITION_ACTIVATE`;
- `PHASE_START`;
- `PHASE_END`;
- `WINDOW_OPEN`;
- `WINDOW_CLOSE`;
- `EDITION_CLOSE`;
- `GRACE_CLOSE`;
- `CLAIM_CLOSE`;
- `SETTLEMENT_START`;
- `SETTLEMENT_CHECK`;
- `EDITION_FINALIZE`;
- `INVITATION_EXPIRE`;
- `PARTICIPATION_ACTIVATE`;
- `PARTICIPATION_CLOSE`;
- `RECONCILIATION_RUN`.

### F. Lateness decision matrix

A registered lateness policy should consider:

| occurred_at | recorded_at / received_at | Window | Typical decision |
|---|---|---|---|
| inside | inside | open | accept |
| inside | after close, before grace end | grace configured | accept or review |
| inside | after settlement end | closed | reject or integrity case |
| outside | inside due to bad source clock | source untrusted | reject |
| exactly close | any | half-open | outside |
| unknown | any | trusted occurrence required | reject |
| inside old revision | after extension | corrected schedule | resolve by effective revision |
| after termination | any | terminated | reject normal activity |

The target Engine remains responsible for its own Event acceptance. Season Engine provides authoritative context and policy facts.

### G. Finalization gate examples

#### Time gate

```json
{
  "gateKey": "claim-window-elapsed",
  "gateType": "TIME_ELAPSED",
  "required": true,
  "dueAt": "2026-09-14T21:59:59Z"
}
```

#### External aggregate gate

```json
{
  "gateKey": "season-leaderboard-final",
  "gateType": "EXTERNAL_AGGREGATE_FINALIZED",
  "required": true,
  "ownerSystem": "leaderboard-engine",
  "expectedIdentity": {
    "leaderboardEditionId": "uuid"
  },
  "expectedEventType": "leaderboard.edition.finalized.v1"
}
```

#### Reconciliation gate

```json
{
  "gateKey": "participation-reconciliation",
  "gateType": "RECONCILIATION_COMPLETE",
  "required": true,
  "scope": "ALL_PARTICIPATIONS"
}
```

### H. Example Manifest fragment

```json
{
  "manifestSchemaVersion": 1,
  "seasonEditionId": "3cc2504e-dcde-4f84-a0c9-9805115db819",
  "definitionVersionId": "f50d40cb-b8aa-41ae-a822-d7b3ae833c70",
  "realmId": "platform-eu",
  "displayTimezone": "Europe/Berlin",
  "participation": {
    "mode": "OPT_IN",
    "entryWindowKey": "enrollment",
    "eligibilityPolicyRevision": "eligibility-policy-5",
    "reentryPolicy": "PROHIBITED",
    "suspensionPolicy": "PAUSE_PARTICIPATION"
  },
  "schedule": {
    "pauseClockPolicy": "EXPLICIT_REVISION_REQUIRED",
    "intervalConvention": "[)"
  },
  "bindings": [
    {
      "bindingKey": "season-track",
      "ownerEngine": "progression-engine",
      "resourceType": "PROGRESSION_TRACK_VERSION",
      "resourceId": "uuid",
      "resourceFingerprint": "sha256:...",
      "activationPhaseKey": "main",
      "closePolicy": "STOP_NEW_GRANTS",
      "dependencyRequirement": "REQUIRED"
    },
    {
      "bindingKey": "finale-quest",
      "ownerEngine": "quest-engine",
      "resourceType": "QUEST_EDITION",
      "resourceId": "uuid",
      "resourceFingerprint": "sha256:...",
      "activationPhaseKey": "finale",
      "closePolicy": "ALLOW_GRACE",
      "dependencyRequirement": "REQUIRED"
    }
  ],
  "settlementGates": [
    {
      "gateKey": "claim-window-elapsed",
      "gateType": "TIME_ELAPSED",
      "required": true
    }
  ]
}
```

### I. Operational runbook summary

#### Activation blocked

1. Verify trusted time and timer revision.
2. Inspect mandatory dependency status.
3. Compare Manifest fingerprint.
4. Confirm realm and exclusivity policy.
5. Retry only through the command.
6. If override is allowed, obtain approval and record waiver.
7. Verify activation Event publication.
8. Run reconciliation.

#### Close overdue

1. Inspect close timer and current Schedule Revision.
2. Determine whether Pause policy superseded it.
3. Execute close command with the original timer idempotency identity where safe.
4. Verify grace and settlement timers.
5. Verify binding close Events.
6. Alert product operations if user-visible deadline differs from authoritative schedule.

#### Finalization blocked

1. List mandatory gates.
2. Inspect external fact identity and schema.
3. Reconcile Participations and outbox.
4. Open integrity case for contradictory facts.
5. Waive only through approved policy.
6. Retry finalization with the same logical request where applicable.
7. Seal final summary only after commit.

#### Outbox lag

1. Preserve authoritative write availability if safe.
2. Scale relay workers.
3. inspect broker and credentials;
4. retry same Event IDs;
5. do not synthesize replacement lifecycle Events;
6. reconcile consumer acknowledgements where available.

### J. Implementation checklist

Before production:

- [ ] Domain Core state machines implemented and property-tested.
- [ ] Published immutability enforced in database.
- [ ] Manifest canonicalization is deterministic.
- [ ] Schedule Revision and DST tests pass.
- [ ] Durable timers survive restart and failover.
- [ ] Command idempotency receipts are durable.
- [ ] Inbox and outbox are transactional.
- [ ] Event schemas are registered.
- [ ] Cross-Engine binding contracts are approved.
- [ ] Eligibility policy runtime is sandboxed and bounded.
- [ ] Hidden content leak tests pass.
- [ ] Invitation secret tests pass.
- [ ] Participation uniqueness and exclusivity tests pass.
- [ ] Character privacy workflows pass.
- [ ] Settlement and finalization gates pass.
- [ ] Reconciliation and repair runbooks are tested.
- [ ] Projection rebuild is tested at scale.
- [ ] Backup and point-in-time restore are tested.
- [ ] Timer backlog and clock-skew alerts are live.
- [ ] High-impact admin approvals are configured.
- [ ] All acceptance tests in this RFC pass or have approved exceptions.

### K. Glossary distinctions

#### Season vs Campaign

A Season is primarily a time-bounded operational container. A Campaign is primarily a narrative structure composed of Quests. A Campaign may be bound to a Season, span multiple Seasons, or exist without one.

#### Season vs Progression Track

A Season owns time context and participation. A Progression Track owns XP, Levels, thresholds, and Prestige. A seasonal Track references or is bound to an Edition.

#### Season vs Quest

A Season coordinates when a Quest Edition is available. Quest Engine owns Objectives, Instances, choices, deadlines, and completion.

#### Season vs LiveOps

Season Engine owns the authoritative Season domain. LiveOps may distribute configuration and coordinate releases across many domains but does not mutate Season aggregates.

#### Closed vs Finalized

Closed means normal activity has ended. Finalized means settlement is complete and the outcome is sealed.

#### Cancelled vs Terminated

Cancelled means the Edition did not meaningfully activate. Terminated means an active Edition ended exceptionally and history is preserved.

#### Eligibility vs Entitlement

Eligibility is a Season policy decision. Entitlement is an owned access right managed by its authoritative provider. Eligibility may consume an Entitlement fact but does not own it.

### L. Cross-document normalization status

Quest, Talent, and Item Engine consumer catalogs use the canonical
`season.edition.*` and `season.schedule.revised.v1` contracts. Deprecated
aliases remain documented only for migration of already deployed consumers.
They MUST NOT appear in new configuration or subscriptions.

### M. Document completion criteria

This RFC is complete for version 1 when:

- every Engine owner agrees with the cross-Engine boundary;
- Event contracts are registered;
- schema and migration review pass;
- security and privacy review pass;
- operational SLOs and alerts are accepted;
- release governance is implemented;
- the acceptance suite passes;
- no business-specific School logic is present in the Season Engine.

> A Season is not a reset button. It is an immutable chapter in the Character's long-term story, coordinated through time without sacrificing ownership boundaries.
