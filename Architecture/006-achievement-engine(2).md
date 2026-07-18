---
document: 006-achievement-engine
title: Achievement Engine
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
related_documents:
  - 007-quest-engine
  - 008-talent-engine
  - 009-item-engine
  - 010-inventory-engine
  - 011-season-engine
---

# Achievement Engine

> **Platform contract conformance:** all Event envelopes, lifecycle facts,
> dependency edges, and Reward integration MUST conform to
> `002a-platform-contract-standard` and `002b-cross-engine-integration`.

## Executive Summary

The Achievement Engine is the authoritative platform component for defining, evaluating, recording, and presenting permanent Character milestones.

An Achievement represents evidence that a Character has reached a meaningful condition. It is not a generic badge table, a marketing label, a Reward, a Quest, a statistic warehouse, or an arbitrary rule script. Business Modules and platform Engines publish immutable Events describing facts that have already happened. The Achievement Engine consumes registered Event contracts, updates version-bound Character Achievement progress, evaluates deterministic condition graphs, and records an immutable unlock when all required Conditions become true.

The Engine owns:

- immutable published Achievement Definition versions;
- the mapping from registered Event facts to Achievement evaluation plans;
- per-Character Achievement progress owned specifically for milestone evaluation;
- exact evidence used to justify progress and unlock decisions;
- the permanent unlock record;
- integrity status for disputed or invalidated unlocks;
- public and private Achievement projections;
- backfill, replay, reconciliation, and explanation workflows.

The Engine does not own Character identity, Experience, Levels, Prestige, Rewards, Inventory, Items, Talents, Reputation, Quests, Seasons, social relationships, or business-domain truth. It never directly grants XP, Items, Currency, Titles, cosmetics, or any other benefit. When an Achievement is unlocked, the Engine publishes `achievement.unlocked.v1`. The Reward Engine may map that Event to a Reward through its own immutable Trigger Binding. This direction is deliberate: Achievement evaluation produces a milestone fact; Reward policy reacts to that fact. An Achievement unlock MUST NOT be implemented as a generic Reward Component because that would create ambiguous ownership and causal cycles.

Published Achievement Definitions are data, not code. They use a bounded, typed condition model that supports event matches, exact counters, exact distinct counts, extrema, boolean latches, snapshot comparisons, calendar streaks, Achievement dependencies, and bounded composite logic. Arbitrary executable code, SQL fragments, remote callbacks, approximate cardinality algorithms for unlock decisions, and unregistered payload paths are prohibited.

The authoritative write path is asynchronous and Event-driven. HTTP APIs exist for reads, authoring, controlled administration, simulation, backfill orchestration, and exceptional integrity actions. Business Modules do not call a mutable “unlock Achievement” endpoint. Trusted migration and integrity tools may request controlled operations, but every result remains evidence-based, versioned, idempotent, and audited.

The Engine is designed around the following invariants:

1. Only the Achievement Engine may write Character Achievement progress, unlock, and integrity state.
2. An Achievement unlock is a permanent historical fact. It is never silently deleted or converted back into an ordinary locked state.
3. Exceptional fraud or data-correction workflows may mark an unlock `INVALIDATED`, but the original unlock record remains immutable and traceable.
4. Every unlock references the exact immutable Achievement Definition version and the evidence frontier that justified it.
5. The same logical Event has at most one effect on the same Character Achievement node, even under retries, replay, or concurrent delivery.
6. Published Definition versions are immutable. A change creates a new version.
7. Runtime evaluation is deterministic for the same ordered facts, definition version, lifecycle context, and evaluation time basis.
8. Exact integer or fixed-precision arithmetic is used for authoritative progress. Floating-point arithmetic is prohibited.
9. Approximate analytics may inform design, but approximate values MUST NOT unlock an Achievement.
10. Business-domain semantics live in Event contracts and configuration namespaces, never in Engine source code.
11. Character state, node state, evidence, unlock record, ledger entries, and outgoing Events are committed atomically within the Achievement Engine database.
12. Cross-Engine effects are asynchronous. The Engine never writes another Engine’s database.
13. Definition dependency graphs and Event-trigger graphs MUST be acyclic or protected by an approved bounded-cascade policy.
14. Secret Achievement policy is enforced by server-side projections; hidden metadata is never sent to unauthorized clients.
15. Reprocessing history cannot create a second unlock for an already unlocked Achievement edition.
16. Seasonal or repeatable-looking milestones are represented as distinct Achievement editions. A single Achievement edition is unlocked at most once per Character.

This RFC is normative for the Achievement Engine domain model, ownership boundary, condition semantics, Definition lifecycle, evaluation pipeline, Event contracts, database schema, APIs, administration, UX behavior, security, privacy, performance, auditability, edge cases, and production acceptance tests.

---

## Purpose

The purpose of this document is to define a production-ready specification for the Achievement Engine of Progression Platform.

It establishes:

- the authoritative responsibility boundary of Achievement evaluation;
- canonical language for Achievement Definitions, editions, Conditions, progress, evidence, unlocks, and integrity;
- immutable Definition versioning and activation semantics;
- a deterministic, bounded Condition model;
- the Character Achievement Aggregate and its invariants;
- live evaluation, replay, retroactive evaluation, migration, and reconciliation behavior;
- consumed and produced Event contracts;
- read models and write models;
- a reference PostgreSQL schema;
- public, internal, and administrative APIs;
- authoring, simulation, approval, release, support, and incident workflows;
- security, privacy, performance, observability, and audit requirements;
- deterministic responses to duplicates, out-of-order Events, corrections, suspension, closure, and partial data;
- acceptance tests sufficient for implementation and production release.

The document is domain-agnostic. Terms such as lesson, workout, purchase, course, tournament, contribution, or match may appear only in examples. The Engine core MUST operate on canonical Event envelopes, registered schemas, versioned Achievement Definitions, typed Conditions, and opaque source references.

### Normative language

The key words **MUST**, **MUST NOT**, **REQUIRED**, **SHALL**, **SHALL NOT**, **SHOULD**, **SHOULD NOT**, **RECOMMENDED**, **MAY**, and **OPTIONAL** are normative requirement levels.

Where an earlier high-level document describes an Achievement simply as a permanent milestone, this RFC specifies how progress, evidence, unlock, invalidation, and version evolution preserve that permanence in a distributed system.

Any implementation that permits another Engine or Module to directly insert unlock rows, mutate progress tables, or bypass Definition versioning violates this RFC unless an approved ADR explicitly replaces the ownership model.

### Design posture

The initial production Module is a historical fencing school, but the Achievement Engine MUST work unchanged for fitness, education, gaming communities, marketplaces, creator ecosystems, and future domains.

Version 1 SHOULD use:

- a relational authoritative store;
- transactional inbox and outbox patterns;
- immutable published configuration;
- a compiled bounded Condition plan;
- exact per-Character progress state;
- asynchronous Event consumption with at-least-once delivery;
- exactly-once logical effect through idempotency constraints;
- separate read projections for owner, public, directory, and administration use;
- resumable backfill and reconciliation jobs.

A general complex-event-processing platform, arbitrary scripting runtime, globally shared statistics warehouse, or synchronous service mesh transaction is not required.

---

## Goals

### G-1. Authoritative Achievement ownership

Provide one authoritative writer for Achievement Definitions, Character Achievement progress, unlock records, evidence, and integrity status.

### G-2. Permanent meaningful milestones

Represent milestones as durable parts of a Character’s history rather than disposable notifications or mutable badge flags.

### G-3. Domain independence

Support multiple business domains through Event schemas and data configuration without domain-specific Engine code.

### G-4. Data-driven evaluation

Represent Conditions, thresholds, dependencies, visibility, rarity, presentation, activation, and retroactivity as versioned data.

### G-5. Deterministic results

Produce the same progress and unlock outcome for the same Definition version and canonical evidence sequence.

### G-6. Event-driven integration

Consume immutable facts and publish typed progress and unlock Events without synchronous writes to other Engines.

### G-7. Idempotent processing

Guarantee at most one durable contribution from a logical Event to a specific progress node.

### G-8. Exact evidence

Retain enough evidence, hashes, and aggregate transitions to explain why an Achievement progressed or unlocked.

### G-9. Safe Definition evolution

Support draft validation, review, publication, scheduling, activation, retirement, new versions, and explicit migration without rewriting history.

### G-10. Retroactive evaluation

Support bounded lookback and controlled historical backfill when a Definition is intentionally configured to recognize past behavior.

### G-11. Secret and private Achievements

Support hidden criteria and presentation while preventing metadata leakage through APIs, logs, search, or error behavior.

### G-12. Progress-aware UX

Expose exact, percent, step, boolean, or hidden progress according to Definition policy, without forcing clients to reproduce evaluation logic.

### G-13. Reward decoupling

Publish milestone facts that the Reward Engine may consume while preserving independent ownership and avoiding causal cycles.

### G-14. Operational resilience

Provide backpressure, retries, quarantine, replay, repair, reconciliation, projection rebuild, and emergency controls suitable for production.

### G-15. Horizontal scalability

Scale by Character and Definition partitions while preserving per-aggregate consistency and bounded hot-key contention.

### G-16. Full auditability

Make every Definition change, progress mutation, unlock, suppression, invalidation, replay, and administrative action explainable.

### G-17. Privacy minimization

Store only evidence fields needed for evaluation, support retention policies, and keep private source details out of public projections.

### G-18. Narrative compatibility

Provide stable semantic keys and milestone context so products can present a coherent Character journey rather than a list of disconnected counters.

### G-19. Exact dependency semantics

Support meta-Achievements and prerequisite Achievements through an explicit directed acyclic dependency graph.

### G-20. Safe failure behavior

Prefer delayed evaluation or quarantine over incorrect unlock, duplicate unlock, insecure fallback, or silent progress loss.

---

## Non Goals

### NG-1. Business truth validation

The Engine does not determine whether a lesson happened, a payment settled, a workout was legitimate, or a match result was fair. The source Module or Engine owns fact validity and fraud controls.

### NG-2. Reward granting

The Engine does not grant Experience, Items, Currency, Reputation, Titles, cosmetics, Talents, or any other Reward. It publishes Achievement facts for the Reward Engine.

### NG-3. Quest ownership

The Engine does not own Quest activation, Objectives, branching, deadlines, acceptance, abandonment, or completion. A Quest is a directed activity; an Achievement is a permanent milestone.

### NG-4. General statistics warehouse

The Engine does not calculate arbitrary business analytics, reporting metrics, dashboards, funnels, or ad hoc queries. It maintains only state required by published Achievement Definitions.

### NG-5. Generic rules platform

The Engine does not execute arbitrary code, external webhooks, SQL, user-authored scripts, or unrestricted expressions.

### NG-6. Character lifecycle ownership

Character creation, ownership, suspension, closure, restoration, and anonymization belong to the Character Engine. The Achievement Engine keeps a local eligibility projection only.

### NG-7. Progression ownership

Experience, Levels, Prestige, and Progression Tracks belong to the Progression Engine. Their Events may be Achievement evidence.

### NG-8. Inventory and entitlement ownership

Items, Inventory quantities, Titles, cosmetics, and equip state remain owned by their respective Engines. Their typed Events may be evidence.

### NG-9. Season schedule ownership

The Season Engine owns Season lifecycle and schedule. Achievement Definitions may reference a Season or edition as an opaque scope.

### NG-10. Notification delivery

The Engine does not send email, push, chat, or in-product notifications. It publishes events and presentation-ready projections.

### NG-11. Social ranking

The Engine does not own leaderboards, social comparison, friends, followers, guilds, or public ranking policy.

### NG-12. Manual free-form unlocks

Normal operators cannot arbitrarily unlock a badge by name. Exceptional imports or integrity repairs require typed evidence, privileged commands, dual control where configured, and immutable audit.

### NG-13. Approximate unlock decisions

HyperLogLog, probabilistic membership, sampled analytics, machine-learning probability, and eventually corrected estimates MUST NOT be authoritative unlock inputs.

### NG-14. Infinite event history retention

The Engine is not required to preserve every raw source Event forever. It preserves minimum evidence and relies on configured source retention and archival policy for replay.

### NG-15. Cross-Character pooled Achievements

Guild, team, classroom, household, or community Achievements are outside version 1 unless modeled as a distinct future aggregate owner. Character Achievements apply to one Character.

### NG-16. Real-time combat evaluation

Frame-level, millisecond combat achievements and anti-cheat telemetry processing are outside the initial service. A game-specific event aggregator may publish validated summary Events.

### NG-17. Arbitrary reversible Achievements

Normal product behavior cannot re-lock a permanent Achievement. Exceptional invalidation preserves historical unlock evidence and uses a separate integrity state.

### NG-18. Client-side authority

Clients may display progress but MUST NOT calculate authoritative unlocks or submit arbitrary progress deltas.

### NG-19. Definition mutation in place

Published Conditions, presentation, visibility, or semantics are never edited in place. New behavior requires a new immutable version.

### NG-20. Automatic historical reinterpretation

Activating a new Definition version does not silently reinterpret all prior Events. Retroactive behavior requires an explicit policy and job.

---

## Responsibilities

### R-1. Achievement Definition management

The Engine MUST support creating, validating, reviewing, publishing, scheduling, activating, retiring, and archiving immutable Achievement Definition versions.

### R-2. Condition compilation

The Engine MUST validate and compile the bounded Condition graph into a deterministic evaluation plan with explicit Event subscriptions and typed field extraction.

### R-3. Event subscription resolution

The Engine MUST resolve which active Achievement Definition versions are affected by each registered Event type without scanning every Definition.

### R-4. Character Achievement Aggregate management

The Engine MUST maintain one version-bound aggregate for each materialized `(character_id, achievement_edition_id)` pair.

### R-5. Progress evaluation

The Engine MUST update exact node state and overall progress according to the compiled plan.

### R-6. Evidence recording

The Engine MUST record the source Event, affected node, normalized contribution, before/after state, and Definition fingerprint needed for explanation and replay safety.

### R-7. Unlock decision

The Engine MUST atomically detect the first transition from not unlocked to unlocked, write the permanent unlock record, append ledger entries, and publish `achievement.unlocked.v1`.

### R-8. Dependency evaluation

The Engine MUST support Achievement prerequisites and meta-Achievements through an acyclic dependency graph and bounded cascade processing.

### R-9. Character eligibility projection

The Engine MUST consume Character lifecycle Events and reject, hold, or replay evaluation according to explicit lifecycle policy.

### R-10. Definition version routing

The Engine MUST select the correct immutable active version for the Event’s scope and effective time, then retain that version reference on all resulting state.

### R-11. Retroactive evaluation

The Engine MUST provide resumable, rate-limited backfill workflows for Definitions whose publication policy permits historical recognition.

### R-12. Correction handling

The Engine MUST process typed source corrections and reversals for progress that has not unlocked. Post-unlock corrections use integrity workflows and never silently delete history.

### R-13. Integrity management

The Engine MUST support `VALID`, `CONTESTED`, and `INVALIDATED` recognition states with append-only transitions, authorization, reason codes, and evidence references.

### R-14. Projection generation

The Engine MUST maintain owner, public, summary, catalog, recent-unlock, and administrative projections with privacy and secret-policy filtering.

### R-15. Event publication

The Engine MUST publish progress, unlock, integrity, Definition lifecycle, and operational Events through a transactional outbox.

### R-16. Idempotency and ordering

The Engine MUST deduplicate input Events and serialize conflicting mutations to the same Character Achievement Aggregate.

### R-17. Reconciliation and repair

The Engine MUST detect and repair inbox gaps, projection drift, missing subscriptions, inconsistent node totals, and incomplete backfills.

### R-18. Explainability

The Engine MUST expose a privileged evaluation trace that links Definition version, source facts, node changes, lifecycle gating, and unlock result.

### R-19. Administration and authoring

The Engine MUST provide safe Definition authoring, simulation, diff, approval, release, retirement, backfill, support inspection, and integrity tools.

### R-20. Operational controls

The Engine MUST support producer quarantine, Definition pause, scope pause, live-evaluation throttling, backfill throttling, projection rebuild, and emergency public suppression.

---

## Dependencies

Dependencies are divided into normative platform contracts, optional downstream services, and forbidden coupling.

### Character Engine

The Character Engine owns canonical Character identity and lifecycle.

The Achievement Engine MUST maintain a local Character eligibility projection containing at minimum:

- `character_id`;
- lifecycle state;
- state version;
- state effective time;
- creation time;
- closure or anonymization marker;
- optional realm or residency key;
- source Event sequence or aggregate version.

The live evaluation path MUST NOT synchronously call the Character Engine for every Event. A missing Character projection is not equivalent to an active Character. The Event is retried, parked, or quarantined according to policy.

### Event infrastructure

The Engine requires durable Event transport with:

- at-least-once delivery;
- globally unique Event identifiers;
- registered schema versions;
- authenticated producer identity;
- partition or routing metadata;
- consumer retries and dead-letter support;
- retention compatible with operational replay objectives;
- correlation and causation metadata.

Exactly-once transport is not required. Exactly-once logical effect is implemented by the Engine’s inbox and evidence uniqueness constraints.

### Schema Registry

Every source Event type referenced by a published Achievement Definition MUST have a registered, compatible schema.

The registry MUST expose:

- canonical Event type and version;
- producer allowlist;
- subject and Character identity location;
- typed payload paths;
- field sensitivity classification;
- ordering guarantees where any exist;
- correction or reversal contract where supported;
- retention and replay characteristics.

A Definition MUST NOT publish when it references unknown, deprecated without replacement, incompatible, or privacy-prohibited fields.

### Reward Engine

The Reward Engine may consume `achievement.unlocked.v1` through its own Trigger Bindings.

The Achievement Engine MUST NOT:

- call a Reward mutation endpoint synchronously;
- write Reward Grant state;
- declare a Reward successful;
- embed foreign component mutation payloads in the unlock transaction;
- wait for Reward fulfillment before considering the Achievement unlocked.

Reward failure does not undo the Achievement. Support surfaces may correlate the Achievement unlock with a Reward Grant, but the two aggregates remain independent.

### Progression Engine

The Achievement Engine may consume typed Progression Events such as Level change, cap reached, or Prestige completed. It treats them as immutable facts and does not read Progression tables.

### Quest Engine

The Achievement Engine may consume typed Quest completion or Objective facts. It MUST NOT infer Quest completion from raw business Events when the Quest Engine is authoritative for that fact.

### Inventory, Item, Talent, Reputation, Currency, and Season Engines

These Engines may publish typed facts used by Achievements. The Achievement Engine stores only the minimum normalized evidence required by a Definition.

A published Definition MUST reference registered Events rather than foreign database tables.

### Configuration Registry or LiveOps Engine

A shared configuration or LiveOps component MAY coordinate activation windows and rollout scopes. The Achievement Engine remains authoritative for Definition content, version fingerprints, and activation records.

### Identity and Access Management

Interactive APIs require authenticated principals, service identities, scoped authorization, and separation of duties.

### Time service

Authoritative timestamps use synchronized server-side UTC time.

Calendar Conditions additionally require a versioned timezone and calendar policy. Client timestamps are never authoritative.

### Search and projection infrastructure

Search, cache, analytics, notification, and profile composition services are optional downstream dependencies. Their outage MUST NOT block authoritative progress or unlock commits.

### Object storage

Object storage MAY hold large immutable simulation fixtures, export files, or archived evaluation traces. Core state and minimum evidence remain in the authoritative database.

### Database

The authoritative store MUST support:

- ACID transactions;
- unique and exclusion constraints;
- row-level locking or compare-and-swap;
- JSON with schema validation where appropriate;
- indexed Character, Definition, Event, and time queries;
- transactional inbox and outbox;
- online schema migration;
- append-only history retention;
- partitioning of high-volume evidence tables.

The reference implementation uses PostgreSQL.

### Forbidden dependencies

The Achievement Engine MUST NOT depend on:

- School Module tables or any other business database;
- direct synchronous reads from Progression, Quest, Reward, Inventory, Talent, Reputation, or Season databases;
- arbitrary remote webhooks;
- client-calculated progress;
- unversioned JSON files loaded directly into runtime;
- shared mutable tables owned by other Engines;
- analytics estimates as unlock truth;
- a general-purpose scripting service;
- transport-level exactly-once guarantees;
- synchronous Reward fulfillment.

---

## Architecture Overview

### Context

```text
Business Modules / Platform Engines
              │
              │ immutable registered Events
              ▼
       Event Infrastructure
              │
              ▼
┌───────────────────────────────────────────────────────────────────┐
│                       Achievement Engine                          │
│                                                                   │
│  Inbox → Schema Gate → Character Gate → Subscription Resolver    │
│                                      │                            │
│                                      ▼                            │
│                         Compiled Evaluation Plan                  │
│                                      │                            │
│       ┌──────────────────────────────┼──────────────────────┐     │
│       ▼                              ▼                      ▼     │
│  Node State                    Evidence Ledger        Dependency  │
│       │                              │                   Graph    │
│       └──────────────────────────────┴───────────────┬────────────┘
│                                                     ▼             │
│                                      Character Achievement       │
│                                             Aggregate             │
│                                                     │             │
│                             first completion────────┤             │
│                                                     ▼             │
│                                           Unlock Ledger           │
│                                                     │             │
│                                      Transactional Outbox         │
└─────────────────────────────────────────────────────┬─────────────┘
                                                      │
                        achievement.progress.changed / unlocked
                                                      │
                    ┌─────────────────────────────────┼─────────────┐
                    ▼                                 ▼             ▼
              Reward Engine                    Projections    Notification
```

### Control plane and data plane

The Engine is separated into two logical planes.

The **control plane** owns:

- Definition drafts and immutable versions;
- validation and compilation;
- dependency graph validation;
- simulation fixtures;
- approval and publication;
- activation, scheduling, retirement, and rollout;
- backfill policy and jobs;
- administration and integrity workflows.

The **data plane** owns:

- Event ingestion;
- inbox deduplication;
- Character lifecycle gating;
- subscription resolution;
- deterministic plan evaluation;
- node and aggregate mutation;
- evidence and unlock ledgers;
- outbox publication;
- projections and reconciliation.

Control-plane outage MUST NOT change the meaning of already published and cached immutable Definitions. Data-plane workers MUST continue using verified Definition fingerprints available in durable storage.

### Evaluation pipeline

For each inbound Event, the Engine performs the following stages:

1. Authenticate producer identity from transport context.
2. Validate the Event envelope and registered payload schema.
3. Persist or detect the inbox record by `event_id`.
4. Resolve the Character subject and trusted scope.
5. Apply Character lifecycle gating.
6. Resolve active subscriptions by Event type, version, producer, scope, and effective time.
7. Load compiled immutable evaluation plans.
8. Evaluate Event predicates and typed extraction paths.
9. Derive exact node contributions.
10. Lock or compare-and-swap affected Character Achievement Aggregates in deterministic order.
11. Apply node contributions once.
12. Recompute bounded composite nodes and overall completion.
13. Append evidence and operation ledger entries.
14. If completion transitions for the first time, append the immutable unlock record.
15. Write progress and unlock Events to the transactional outbox.
16. Commit atomically.
17. Publish outbox Events asynchronously.
18. Update read projections idempotently.

An Event that affects multiple Achievements MAY be processed in independent transactions to reduce contention. The inbox fan-out record MUST track each target evaluation so one failure does not force already committed targets to roll back.

### Ownership boundary

| Concern | Authoritative owner | Achievement Engine behavior |
|---|---|---|
| Character identity and lifecycle | Character Engine | Maintains local eligibility projection. |
| Business fact validity | Source Module or Engine | Validates registered contract and trusts authorized producer. |
| Achievement Definition | Achievement Engine | Creates, versions, compiles, publishes, activates. |
| Achievement progress | Achievement Engine | Owns exact node and aggregate state. |
| Achievement unlock | Achievement Engine | Owns permanent unlock record. |
| Unlock integrity status | Achievement Engine | Owns contested and invalidated recognition state. |
| XP, Level, Prestige | Progression Engine | Consumes typed Events only. |
| Quest completion | Quest Engine | Consumes typed Events only. |
| Reward decision and fulfillment | Reward Engine | Publishes unlock Event; does not grant Reward. |
| Item and Inventory state | Item/Inventory Engines | Consumes typed Events only. |
| Talent state | Talent Engine | Consumes typed Events only. |
| Season lifecycle | Season Engine | Uses opaque Season scope and Events. |
| Notification delivery | Notification component | Publishes semantic outcome Events. |
| Public Character profile | Character Engine / approved projection | Supplies privacy-filtered Achievement projection. |

### Partitioning and concurrency

The primary consistency boundary is `(character_id, achievement_edition_id)`.

Recommended routing:

- inbound source Events partition by `character_id` when possible;
- progress mutation locks one Character Achievement Aggregate at a time;
- when one Event affects multiple aggregates, locks are acquired in lexical `achievement_edition_id` order if a single transaction is used;
- meta-Achievement cascades are partitioned by Character and processed with bounded depth;
- backfills use the same logical operation identities as live evaluation but separate workload queues.

No global lock is permitted on the live path.

### Exactly-once logical effect

At-least-once Event delivery is converted into exactly-once logical contribution through:

- a unique inbox row per `(consumer_name, event_id)`;
- a unique fan-out target per `(event_id, achievement_edition_id, character_id)`;
- a unique evidence contribution key per `(event_id, node_id, contribution_ordinal)`;
- aggregate version checks;
- transactional state, ledger, unlock, and outbox writes;
- idempotent projection consumers.

Duplicate transport delivery MAY repeat validation and lookup, but it MUST NOT increment a counter, add a distinct member, extend a streak, or unlock twice.

### Event ordering model

The Engine MUST NOT assume total global order.

Condition plans declare one of these ordering requirements:

- `COMMUTATIVE`: contributions may arrive in any order;
- `EVENT_TIME_ORDERED`: result depends on trusted `occurredAt` and requires bounded lateness handling;
- `SOURCE_SEQUENCE_ORDERED`: result depends on a producer aggregate sequence;
- `DEPENDENCY_ORDERED`: result depends on prerequisite Achievement Events.

A Definition using ordered semantics MUST publish only when the referenced source contract supplies the necessary sequence or when the configured lateness and repair policy is sufficient.

### Causal cycle prevention

The control plane constructs a graph across:

- Event types consumed by Achievement Definitions;
- `achievement.unlocked` Events produced by those Definitions;
- Reward Trigger Bindings that react to Achievement unlocks;
- Events produced by Reward owner Engines that can return to Achievement evaluation;
- Achievement-to-Achievement dependencies.

Direct self-dependency and Achievement dependency cycles are prohibited.

Reward-related source Events are denied by default. They MAY be consumed only when:

- a publication-time graph analysis proves no cycle for the configured scope;
- runtime lineage contains bounded `causationId` ancestry or a cycle guard token;
- cascade depth and total emitted operations are bounded;
- an ADR approves the use case.

### Failure isolation

Invalid payloads, unknown Characters, missing Definition versions, and deterministic evaluation errors are quarantined per target. A single malformed Definition MUST NOT block unrelated Achievements.

Transient infrastructure failures are retried with the same Event and operation identities.

No failure path may convert “unknown” into “Condition satisfied.”

---

## Canonical Definitions

### Achievement

A permanent Character milestone unlocked when the Conditions of one Achievement Edition become true.

An Achievement is identified for product and authoring purposes by a stable `achievement_key`. Historical runtime behavior references an immutable `achievement_definition_version_id` and an `achievement_edition_id`.

### Achievement Definition

The logical authored identity of an Achievement across versions.

It contains stable ownership metadata such as namespace, key, category, and governance policy. Mutable draft content is stored in Definition Versions.

### Achievement Definition Version

An immutable published specification containing:

- Conditions;
- Event subscriptions;
- progress semantics;
- visibility and secrecy;
- presentation keys;
- rarity metadata;
- activation scope;
- retroactivity policy;
- evidence policy;
- integrity policy;
- compiled plan fingerprint.

Draft Versions may change. Published Versions MUST NOT change.

### Achievement Edition

A once-per-Character unlockable milestone instance.

Seasonal, annual, cohort-specific, or recurring milestones MUST use separate Editions. Reusing the same Edition to unlock repeatedly is prohibited.

Examples:

- `community.first_contribution` has one enduring Edition;
- `school.yearly_attendance` may have Editions `2026`, `2027`, and `2028`;
- a Season-scoped Achievement uses the Season identifier as part of its Edition identity.

### Achievement Key

A stable, human-readable key unique within a namespace, for example `platform.first_milestone` or `school.consistency.apprentice`.

Keys use lowercase ASCII letters, digits, dots, underscores, and hyphens. They are not localized labels.

### Namespace

The governance and authorization boundary that owns Definition authoring.

Namespaces do not alter core Engine behavior. A Module namespace may define domain-specific Achievements using registered domain Events, while the Character’s resulting Achievement remains platform-owned state.

### Category

A presentation and discovery grouping such as `mastery`, `consistency`, `exploration`, `community`, or `collection`.

Categories are data. They MUST NOT change evaluation behavior unless a separate explicit policy field defines that behavior.

### Rarity

A configured presentation classification such as `COMMON`, `UNCOMMON`, `RARE`, `EPIC`, `LEGENDARY`, or a platform-defined equivalent.

Rarity is not calculated from live unlock percentage unless an explicit analytics projection provides a separate observed rarity. Configured rarity MUST be distinguished from observed rarity.

### Condition

A typed deterministic requirement within an Achievement Definition Version.

A Condition is represented by one or more nodes in a directed acyclic Condition Graph.

### Condition Node

An immutable node with:

- `node_id` stable within one Definition Version;
- node type;
- typed configuration;
- child references where composite;
- progress weight or presentation role;
- evidence retention policy;
- optional visibility policy.

### Condition Graph

A directed acyclic graph whose root determines Achievement completion.

The graph is compiled at publication into an Evaluation Plan. Cycles, unreachable nodes, ambiguous types, and unbounded fan-out are invalid.

### Evaluation Plan

The canonical compiled form used at runtime.

It contains:

- normalized Condition nodes;
- typed extractors;
- Event subscriptions;
- dependency ordering;
- exact arithmetic rules;
- progress projection instructions;
- safety limits;
- a cryptographic fingerprint.

The original authored Definition and compiled plan fingerprint are both retained.

### Event Predicate

A bounded boolean expression evaluated against a registered Event payload and trusted envelope metadata.

It may compare typed values, membership in bounded constant sets, existence, normalized string equality, and explicit numeric ranges. It cannot execute code or query external systems.

### Contribution

The exact normalized effect of one source Event on one Condition Node.

Examples:

- increment count by `1`;
- add integer quantity `5`;
- add distinct hashed subject key;
- set boolean latch to `true`;
- update maximum from `12` to `19`;
- mark one calendar period completed.

### Evidence

An immutable record connecting a Contribution or unlock to its source Event and Definition Version.

Evidence stores minimized normalized values and hashes, not arbitrary copies of entire source payloads.

### Character Achievement Aggregate

The authoritative version-bound state for one Character and one Achievement Edition.

It contains aggregate status, node progress references, root completion, first-tracked time, unlocked time, integrity state, version, and Definition references.

### Node State

The exact authoritative state maintained for one materialized progress node.

Examples include counter value, distinct cardinality, maximum, latch state, streak state, or dependency completion.

### Progress

The current measurable advancement toward unlock.

Progress is not always a percentage. The Definition declares one of:

- `NONE`;
- `BOOLEAN`;
- `EXACT`;
- `PERCENT`;
- `STEPS`;
- `COMPOSITE_SUMMARY`;
- `HIDDEN`.

Clients MUST use server-provided progress semantics.

### Unlock

The first authoritative transition where the root Condition becomes true for a Character and Achievement Edition.

Unlock is permanent history and has a globally unique `achievement_unlock_id`.

### Recognition State

The current integrity classification of an unlocked Achievement:

- `VALID`;
- `CONTESTED`;
- `INVALIDATED`.

Recognition State does not erase the original unlock.

### Contest

A temporary integrity review indicating that source evidence or policy is disputed.

A contested Achievement may be hidden from public projections while remaining visible to authorized support and, according to policy, the owner.

### Invalidation

An exceptional append-only decision that the historical unlock should no longer be treated as valid recognition.

Invalidation MUST reference reason, actor, evidence, and policy. It publishes `achievement.invalidated.v1`; it does not publish a fictional “locked again” Event.

### Restoration of Recognition

An exceptional decision returning an invalidated or contested unlock to `VALID` after review. The prior integrity history remains immutable.

### Retroactivity Policy

The policy controlling whether Events before Definition activation may contribute:

- `NONE`;
- `FROM_ACTIVATION`;
- `LOOKBACK_WINDOW`;
- `FULL_AVAILABLE_HISTORY`;
- `SNAPSHOT_BOOTSTRAP`.

Retroactivity is explicit and versioned.

### Backfill

A controlled asynchronous process that evaluates historical facts or trusted snapshots for a published Definition Version.

### Definition Activation

The time- and scope-bound record that routes eligible Events to one published Definition Version.

### Definition Retirement

The end of new live evaluation for an activation. Existing unlock records remain valid and readable.

### Secret Achievement

An Achievement whose metadata, Conditions, or progress are hidden before unlock according to a secrecy policy.

### Hidden Progress

A policy where the Character may know an Achievement exists but receives no exact progress details.

### Meta-Achievement

An Achievement whose Conditions include other Achievement unlock facts.

Meta-Achievement dependencies MUST form a DAG and use exact Edition references or a bounded selector compiled at publication.

### Calendar Streak

A Condition that requires qualifying activity in consecutive policy-defined calendar periods.

It uses a versioned timezone, period unit, boundary rule, grace policy, and late-event policy. Device locale and client timezone are not authoritative.

### Source Correction

A typed Event that reverses or corrects a previously accepted source fact.

Before unlock, the Engine may compensate progress exactly when the Definition and source contract support reversal. After unlock, correction may trigger integrity review but does not silently remove the unlock.

### Evaluation Operation

An immutable record of one target-specific evaluation attempt, outcome, Definition Version, aggregate versions, and error classification.

### Projection

A query-optimized representation derived from authoritative state and filtered for a specific audience.

### Unlock Rate

An analytical ratio of Characters who unlocked an Achievement within a defined population. It is not authoritative Achievement state and MUST NOT affect unlock logic.


---

## Lifecycle

The Achievement Engine contains several related but independent lifecycles. Implementations MUST model them explicitly rather than collapsing all status into one field.

### Achievement Definition Version lifecycle

```text
DRAFT
  │ validate
  ▼
VALIDATED
  │ submit
  ▼
IN_REVIEW
  ├── reject ───────────────▶ DRAFT
  │ approve
  ▼
APPROVED
  │ publish
  ▼
PUBLISHED
  ├── schedule ─────────────▶ SCHEDULED
  ├── activate now ─────────▶ ACTIVE
  └── archive unused ───────▶ ARCHIVED
SCHEDULED
  ├── activate at window ───▶ ACTIVE
  ├── cancel before start ──▶ PUBLISHED
  └── supersede ────────────▶ ARCHIVED
ACTIVE
  ├── retire ───────────────▶ RETIRED
  └── emergency pause ──────▶ PAUSED
PAUSED
  ├── resume ───────────────▶ ACTIVE
  └── retire ───────────────▶ RETIRED
RETIRED
  └── archive metadata ─────▶ ARCHIVED
```

#### DRAFT

Editable authoring state. Conditions, presentation, scope, and policy may change. Drafts MUST NOT be used by live evaluation.

Each Draft save increments a draft revision and records the author, timestamp, and content hash.

#### VALIDATED

The current Draft revision passed deterministic structural validation, type checking, schema compatibility, dependency analysis, privacy classification, safety limits, and compilation.

Any content change returns the Version to `DRAFT` and invalidates the validation result.

#### IN_REVIEW

The Version is awaiting required approval. Reviewers see:

- semantic diff from prior version;
- compiled subscriptions;
- Condition graph;
- simulation results;
- expected population impact where available;
- privacy and security findings;
- retroactivity and backfill cost;
- Reward cycle analysis;
- rollout and rollback plan.

#### APPROVED

Required reviewers approved the exact validated content hash. A content change voids approvals.

#### PUBLISHED

The Definition Version is immutable and addressable by stable id and fingerprint. Publication alone does not necessarily route live Events.

#### SCHEDULED

An activation record exists for a future time or scope. The activation scheduler MUST use server UTC and persist the resolved window.

#### ACTIVE

The Version receives eligible live Events for its activation scope.

At most one Version of the same Achievement Edition may be active for the same scope and effective instant unless an approved shadow-evaluation mode explicitly prevents double mutation.

#### PAUSED

New live evaluation is temporarily stopped because of incident, producer corruption, or operational control. Already committed progress and unlocks remain unchanged.

Events during pause follow the activation’s pause policy:

- `BUFFER_AND_REPLAY`;
- `QUARANTINE`;
- `DROP_WITH_AUDIT`, allowed only for non-retroactive non-critical Definitions;
- `SOURCE_REPLAY_REQUIRED`.

The policy MUST be visible before pause.

#### RETIRED

The Version no longer receives new live Contributions. Historical progress and unlocks remain readable. Retirement does not delete or invalidate Achievements.

A retired Definition MAY remain eligible for a bounded approved backfill if its policy allows it.

#### ARCHIVED

The Version is removed from normal authoring lists but retained for history, explanation, and referential integrity.

Published content and fingerprints remain retrievable by privileged systems.

### Definition transition rules

- Only Draft content may be edited.
- Publication requires successful compilation and approval of the same hash.
- Published Versions cannot return to Draft.
- Activation window overlap is rejected transactionally.
- Emergency pause does not mutate Definition content.
- Retired Versions cannot be reactivated in place when doing so would create temporal ambiguity; a new activation or Version is required according to policy.
- Archive never deletes a Version referenced by progress, evidence, unlock, Event, audit, or backfill state.

### Achievement Edition lifecycle

An Edition has a simpler catalog lifecycle:

```text
PLANNED → AVAILABLE → RETIRED → ARCHIVED
```

- `PLANNED`: Definition exists but no active Version.
- `AVAILABLE`: at least one active or scheduled Version exists.
- `RETIRED`: no new live progress is accepted.
- `ARCHIVED`: hidden from normal catalog discovery but retained for history.

An Edition does not become “completed.” Completion is Character-specific.

### Character Achievement lifecycle

The absence of a row means the Character has no materialized state for that Edition. The Engine MUST NOT create locked rows for every Character and every catalog entry.

```text
           first qualifying contribution
ABSENT  ─────────────────────────────────▶ TRACKING
                                               │
                              more evidence────┤
                                               │ root false
                                               ▼
                                           TRACKING
                                               │ root true for first time
                                               ▼
                                           UNLOCKED
                                               │ integrity review
                                               ▼
                                           CONTESTED
                                           │       │
                                restore────┘       └────invalidate
                                           ▼                 ▼
                                        UNLOCKED         INVALIDATED
                                                              │
                                                   restore─────┘
                                                              ▼
                                                           UNLOCKED
```

The aggregate status values are:

- `TRACKING`;
- `UNLOCKED`;
- `CONTESTED`;
- `INVALIDATED`;
- `FROZEN`, represented as an orthogonal processing flag rather than an attainment state where possible.

#### ABSENT

No state has been materialized. The Character is effectively locked, but this is derived from catalog and absence rather than stored as an aggregate status.

A read projection MAY show a locked catalog entry by joining active catalog data with Character state.

#### TRACKING

At least one material Contribution or bootstrap state exists, and the root Condition is false.

`TRACKING` state includes exact node progress, Definition Version binding, first-tracked time, last-contribution time, and aggregate version.

#### UNLOCKED

The root Condition became true and an immutable unlock record was committed.

Once reached, routine source Events no longer mutate attainment. The Engine MAY retain post-unlock analytics separately, but those values are non-authoritative and MUST NOT alter the unlock.

#### CONTESTED

The unlock is under integrity review. The original unlock remains present.

Public display defaults to suppressed. Owner display follows policy and MUST not reveal sensitive investigation details.

#### INVALIDATED

An authorized integrity decision concluded that the unlock should not be recognized as valid.

The original `achievement_unlock` row remains immutable. The current Recognition State becomes `INVALIDATED`, public projections remove or mark the Achievement according to policy, and `achievement.invalidated.v1` is published.

This state is not equivalent to an ordinary locked Achievement and MUST NOT permit automatic re-unlock from the same evidence. Restoration requires a separate authorized integrity transition.

### Progress freeze lifecycle

Progress processing may be frozen independently for:

- one Character Achievement Aggregate;
- one Character across all Achievements;
- one Achievement Edition;
- one namespace;
- one producer;
- one realm or tenant scope.

Freeze states:

- `ACTIVE`;
- `FROZEN_BUFFER`;
- `FROZEN_QUARANTINE`;
- `FROZEN_REJECT`.

Freeze does not change prior state. The command records effective time, reason code, actor, expiration, and handling policy.

### Evaluation operation lifecycle

```text
RECEIVED
   │ validated and target resolved
   ▼
READY
   │ aggregate mutation begins
   ▼
EVALUATING
   ├── no predicate match ─────────▶ NO_EFFECT
   ├── duplicate contribution ─────▶ DUPLICATE
   ├── gated by lifecycle ─────────▶ HELD / REJECTED
   ├── deterministic error ────────▶ QUARANTINED
   ├── progress committed ─────────▶ APPLIED
   └── unlock committed ───────────▶ UNLOCKED
```

Terminal outcomes are:

- `NO_EFFECT`;
- `DUPLICATE`;
- `APPLIED`;
- `UNLOCKED`;
- `HELD`;
- `REJECTED`;
- `QUARANTINED`;
- `FAILED_TRANSIENT`, which is retriable and not a logical terminal result until retry policy ends.

The same target operation identity MUST converge on the same terminal logical result.

### Backfill job lifecycle

```text
DRAFT → VALIDATED → APPROVED → QUEUED → RUNNING
                                      │      │
                                      │      ├── pause ─────▶ PAUSED
                                      │      ├── cancel ────▶ CANCELLING → CANCELLED
                                      │      ├── complete ──▶ COMPLETED
                                      │      └── terminal failures ─▶ COMPLETED_WITH_ERRORS
                                      └─────────────────────▶ FAILED_TO_START
```

A Backfill Job MUST be resumable from durable checkpoints. Cancellation stops future items but does not roll back already committed progress or unlocks.

### Integrity case lifecycle

```text
OPEN → INVESTIGATING → DECISION_PENDING → RESOLVED_VALID
                                   ├────▶ RESOLVED_INVALID
                                   └────▶ CLOSED_NO_ACTION
```

Opening a case MAY transition Recognition State to `CONTESTED` according to policy. Closing a case requires an explicit final decision and audit trail.

### Character lifecycle gating

The local Character projection controls whether new Achievement progress may be committed.

Recommended default behavior:

| Character state | Live progress | Historical backfill | Public display |
|---|---:|---:|---:|
| `ACTIVE` | Allowed | Allowed | According to visibility. |
| `SUSPENDED` | Held or quarantined | Disabled by default | Suppressed or policy-filtered. |
| `CLOSED` | Rejected | Privileged pre-closure repair only | Suppressed. |
| `ANONYMIZED` | Rejected | Prohibited | Suppressed; minimum tombstone only. |
| Unknown | Retry or quarantine | Prohibited | No data. |

A late Event whose `occurredAt` predates suspension MUST NOT be accepted solely because of its timestamp. If the platform requires interval-aware eligibility, the Character projection MUST include signed lifecycle intervals and the Definition must declare that policy. Otherwise current lifecycle state governs.

### Unlock timing semantics

`unlocked_at` is the authoritative business-effective time selected by policy:

- normally the time of the final qualifying Event;
- for snapshot bootstrap, the bootstrap observation time;
- for backfill, the latest evidence time required for completion when determinable;
- otherwise the backfill evaluation time with `time_basis = EVALUATED_AT`.

`recorded_at` is when the Engine committed the unlock.

The API and Events MUST preserve both when they differ.

### Retirement and incomplete progress

When an Edition retires, incomplete Character progress follows the Definition policy:

- `PRESERVE_READ_ONLY`;
- `HIDE_INCOMPLETE`;
- `ARCHIVE_INCOMPLETE`;
- `ALLOW_APPROVED_BACKFILL`.

Retirement MUST NOT automatically unlock, delete, or transfer progress.

### Definition Version change lifecycle for existing progress

A new Version requires one explicit progress strategy:

1. `CONTINUE_BOUND_VERSION` — existing aggregates continue using their bound Version; new aggregates use the new Version.
2. `MIGRATE_COMPATIBLE` — an explicit migration maps node state to the new Version.
3. `RECOMPUTE_FROM_EVIDENCE` — a controlled job rebuilds state from retained evidence or source replay.
4. `NEW_EDITION` — semantics differ materially, so a distinct Achievement Edition is created.

Silent reinterpretation is prohibited.

A migration MUST define:

- source and target Version ids;
- node mapping;
- type compatibility;
- threshold changes;
- treatment of already unlocked Characters;
- rollback or forward-fix plan;
- progress display impact;
- required simulation and approval;
- deterministic operation id.

Already unlocked Characters retain the original unlock Version. A new Version MUST NOT cause duplicate unlock of the same Edition.

---

## Aggregate

### Aggregate root

`CharacterAchievement` is the authoritative aggregate root for one Character and one Achievement Edition.

The aggregate key is:

```text
(character_id, achievement_edition_id)
```

The aggregate references exactly one current bound `achievement_definition_version_id` while tracking. The immutable unlock record stores the Version that produced the unlock.

### Aggregate-owned state

The Aggregate owns:

- aggregate identity and version;
- Character id;
- Achievement Edition id;
- bound Definition Version id and fingerprint;
- attainment status;
- Recognition State;
- first-tracked and last-evaluated times;
- root completion state;
- normalized progress summary;
- materialized Condition Node states;
- exact distinct members where required;
- calendar streak state where required;
- evidence frontier and contribution references;
- unlock reference;
- processing freeze state;
- integrity transition references;
- operation and transition history.

### Referenced but not owned

The Aggregate references but does not own:

- Character lifecycle;
- source Event payloads outside retained evidence;
- Progression, Quest, Reward, Item, Inventory, Talent, Reputation, Currency, or Season state;
- localized strings and media assets;
- Reward Grants triggered by unlock;
- notification delivery state;
- analytics population metrics.

### Aggregate invariants

#### A-1. Stable identity

`character_id` and `achievement_edition_id` never change.

#### A-2. One row per Character and Edition

There is at most one Character Achievement Aggregate for the key.

#### A-3. Version binding

A tracking Aggregate has exactly one bound published Definition Version. Version change occurs only through a typed migration operation.

#### A-4. One unlock

There is at most one `achievement_unlock` row for the Aggregate.

#### A-5. Unlock monotonicity

Once `unlocked_at` is set, it is never cleared or changed.

#### A-6. Recognition separation

Recognition State may change after unlock, but attainment history remains unlocked.

#### A-7. Exact root evaluation

The stored root completion state equals the deterministic result of the materialized node states under the bound compiled plan at the committed aggregate version.

#### A-8. Evidence uniqueness

The same logical source contribution cannot affect the same node twice.

#### A-9. Atomic unlock

The transition to unlocked, unlock row, ledger entry, aggregate version, and outbox Event are committed in one transaction.

#### A-10. No cross-aggregate mutation

An Aggregate transaction does not directly mutate another Character’s Achievement state.

#### A-11. Definition immutability

The fingerprint referenced by the Aggregate resolves to immutable published content.

#### A-12. Bounded state

Node count, distinct-member count, evidence metadata, and graph depth respect platform limits.

#### A-13. Character eligibility

A mutation is allowed only under the Character lifecycle policy recorded on the evaluation operation.

#### A-14. Integer and fixed precision

Counters and thresholds use integers or fixed-precision decimal values with Definition-declared scale. Floating-point state is prohibited.

#### A-15. No post-unlock drift

Authoritative progress nodes are frozen after unlock unless an integrity or migration workflow explicitly records additional state for investigation. Normal Events do not alter the unlock basis.

#### A-16. Integrity transition validity

`CONTESTED` and `INVALIDATED` require an existing unlock and append-only integrity transition.

#### A-17. Secret policy enforcement

Secret metadata is not stored in audience-neutral projections that unauthorized consumers can read.

#### A-18. Aggregate version monotonicity

Every committed mutation increments `aggregate_version` exactly once.

### Transaction boundary

One live evaluation transaction SHOULD mutate one Character Achievement Aggregate.

The transaction includes:

- target evaluation operation state;
- aggregate row creation or lock;
- node state mutations;
- exact distinct-member or streak-period mutations;
- evidence rows;
- progress transition row;
- optional unlock row;
- outbox rows;
- aggregate version update.

A source Event affecting multiple Achievements may commit each target independently. Fan-out status records permit retry of only failed targets.

### Aggregate loading

The runtime loads:

- Aggregate root;
- only node states reachable from affected subscriptions;
- required ancestor composite states;
- relevant exact distinct or streak rows;
- immutable compiled plan from cache verified by fingerprint.

Loading every evidence row is prohibited on the live path.

### Aggregate creation

An Aggregate is materialized only when:

- an Event produces a non-zero or state-changing Contribution;
- a snapshot bootstrap creates material progress;
- an approved import creates evidence;
- a migration or backfill requires explicit zero state for correctness.

A predicate miss MUST NOT create an Aggregate unless operational policy requires a short-lived evaluation trace outside the Aggregate.

### Composite recomputation

After leaf changes, the Engine recomputes only affected ancestor nodes in topological order.

The compiled plan MUST include parent adjacency so recomputation is bounded.

### Optimistic concurrency

The reference implementation uses row locking or compare-and-swap on `aggregate_version`.

Concurrent Events for the same Aggregate may be retried. Retry uses the same target operation id and source contribution keys.

Lost updates are prohibited.

### Aggregate snapshots

For large histories, the Engine MAY store periodic Aggregate snapshots for repair or export. Snapshots are optimization artifacts and MUST include:

- aggregate version;
- Definition Version and fingerprint;
- complete node state hash;
- unlock and integrity references;
- evidence frontier;
- created time.

Snapshots do not replace authoritative normalized state or immutable ledgers unless an ADR defines event sourcing as the primary model.

### Aggregate deletion

Physical deletion is prohibited while the Character exists or any retention obligation remains.

After Character anonymization, the Engine may retain a minimized tombstone containing:

- Character id;
- Edition id;
- unlock existence and time if policy permits;
- Definition Version id;
- integrity state;
- non-personal hashes;
- retention and erasure workflow reference.

Personal evidence and source metadata MUST be removed or de-identified according to Privacy policy.

---

## State Model

### Achievement Definition model

A logical Definition contains:

```text
AchievementDefinition
- achievement_definition_id
- namespace
- achievement_key
- owner_team
- governance_policy_key
- created_at
- created_by
- catalog_state
```

A Version contains:

```text
AchievementDefinitionVersion
- achievement_definition_version_id
- achievement_definition_id
- version_number
- achievement_edition_id
- schema_version
- status
- category_key
- rarity_key
- secrecy_policy
- progress_presentation_policy
- localization_keys
- media_references
- activation_constraints
- retroactivity_policy
- lifecycle_gate_policy
- condition_graph
- compiled_plan
- compiled_plan_fingerprint
- evidence_policy
- integrity_policy
- source_contract_fingerprints
- authored_by
- reviewed_by
- published_at
```

### Edition identity

`achievement_edition_id` is immutable and globally unique.

An Edition has:

- stable edition key;
- optional series key;
- optional Season reference;
- optional cohort or realm scope;
- once-per-Character semantics;
- catalog availability window;
- historical display policy.

The Edition id, not only the Definition key, is used in Character Aggregate uniqueness.

### Condition node types

Version 1 supports the following authoritative node types.

#### `EVENT_COUNT`

Counts qualifying Events.

Configuration:

- registered Event types and versions;
- producer allowlist;
- Event Predicate;
- threshold integer;
- optional contribution amount fixed at `1` or extracted bounded integer;
- optional scope discriminator;
- optional correction contract.

#### `VALUE_SUM`

Adds a typed integer or fixed-precision value extracted from qualifying Events.

Configuration includes minimum and maximum contribution, overflow policy, scale, and threshold.

#### `DISTINCT_COUNT`

Counts exact distinct normalized values, such as unique activity identifiers, categories, or approved counterpart keys.

Requirements:

- value path is schema-registered;
- normalization version is immutable;
- values are stored as keyed hashes when plaintext is unnecessary;
- exact uniqueness is enforced by database constraint;
- maximum cardinality is bounded;
- approximate sketches are prohibited for unlock.

#### `MAX_VALUE`

Tracks the maximum qualifying numeric value.

#### `MIN_VALUE`

Tracks the minimum qualifying numeric value after at least one observation.

#### `BOOLEAN_LATCH`

Becomes true after one qualifying Event and remains true unless an exact pre-unlock correction reverses the source.

#### `SNAPSHOT_THRESHOLD`

Compares a value from a trusted typed snapshot Event to a threshold.

The Event must identify snapshot version, owner Engine, and observation time. The Achievement Engine does not synchronously fetch the value.

#### `CALENDAR_STREAK`

Tracks consecutive qualifying calendar periods.

Configuration includes:

- period unit: day, week, month;
- IANA timezone id;
- timezone database version or platform calendar policy version;
- qualifying Event Predicate;
- minimum qualifying count per period;
- target consecutive periods;
- grace policy;
- maximum accepted lateness;
- correction behavior;
- whether current incomplete period is displayed.

#### `ACHIEVEMENT_DEPENDENCY`

Becomes true when one specified prerequisite Achievement Edition has a valid unlock for the same Character.

Selectors over a series MUST compile to a bounded exact list or a versioned catalog query result frozen at publication.

#### `ALL_OF`

True when all child nodes are true.

#### `ANY_OF`

True when at least one child node is true.

#### `AT_LEAST`

True when at least `k` of `n` child nodes are true.

#### `WEIGHTED_THRESHOLD`

True when the exact sum of configured integer child weights for true children reaches a threshold.

Weights affect completion only when explicitly configured. They are not UI percentages by default.

#### `MANUAL_EVIDENCE`

Accepts a typed, privileged evidence assertion from an approved verification workflow.

This node type is disabled by default and requires:

- namespace policy approval;
- allowlisted issuer role;
- evidence attachment or reference;
- dual control where configured;
- expiration or permanence semantics;
- full audit;
- no arbitrary direct unlock command.

### Future node types not in version 1

The following require separate ADRs:

- arbitrary ordered sequences;
- geospatial path evaluation;
- probabilistic conditions;
- machine-learning classification;
- cross-Character aggregation;
- real-time combat windows;
- economic balance comparisons requiring synchronous reads;
- negative or decaying Achievements;
- arbitrary user-defined expressions.

### Condition type system

The compiler supports:

- boolean;
- signed and unsigned bounded integer;
- fixed-precision decimal with explicit scale;
- normalized string enum;
- UUID or opaque identifier;
- UTC instant;
- local calendar date derived by policy;
- bounded set of constants;
- nullable values only where schema permits.

Implicit lossy conversion is prohibited.

String comparison MUST define normalization and case behavior. Locale-dependent comparison is prohibited in runtime Conditions.

### Arithmetic rules

- Integer overflow causes deterministic quarantine unless Definition policy specifies safe saturation below platform limits.
- Decimal operations use exact fixed scale and declared rounding mode.
- Division is prohibited in live Conditions unless the compiler transforms it into exact cross-multiplication with overflow safety.
- Percent progress is derived for presentation after authoritative state calculation.
- NaN, Infinity, and floating-point payload values are rejected for authoritative numeric Conditions.

### Event Predicate model

Allowed operations:

- equality and inequality on compatible types;
- numeric comparison;
- membership in a bounded immutable set;
- field existence;
- boolean conjunction and disjunction with bounded depth;
- approved normalized prefix or exact string comparison;
- envelope producer, type, realm, and subject checks;
- explicit null handling.

Prohibited operations:

- regular expressions with unbounded behavior;
- arbitrary JSONPath recursion;
- SQL or code execution;
- network access;
- current database reads;
- random values;
- unversioned current time;
- mutable feature-flag lookup during replay;
- unrestricted list iteration.

### Time basis

Every time-sensitive Definition declares a `time_basis`:

- `EVENT_OCCURRED_AT`;
- `SOURCE_SEQUENCE_TIME`;
- `ENGINE_RECORDED_AT`;
- `CALENDAR_POLICY_TIME`.

Using wall-clock “now” without recording the evaluation timestamp is prohibited.

### Progress normalization

The Engine stores authoritative node values and a normalized progress projection.

For simple threshold nodes:

```text
current = min(authoritative_value, target) for display
raw_current = authoritative_value
 target = configured threshold
complete = raw_current >= target
```

For composite graphs, Definition authors select one display model:

- root boolean;
- completed leaf count;
- weighted child summary;
- named steps;
- one designated primary node;
- hidden.

Clients MUST NOT infer composite completion from incomplete public node data.

### Evidence frontier

The Aggregate stores a compact frontier describing processed evidence:

- highest source aggregate sequence where ordered;
- last qualifying occurred time;
- last evaluation operation id;
- contribution count;
- state hash;
- optional backfill watermark.

The frontier accelerates reconciliation but does not replace uniqueness constraints.

### Distinct state

For `DISTINCT_COUNT`, each exact member record contains:

- Character Achievement id;
- node id;
- normalized keyed hash;
- first evidence id;
- first observed time;
- optional removal time for pre-unlock correction;
- active flag.

Re-adding a corrected member uses append-only history or a versioned membership record according to schema design. The current active uniqueness constraint remains exact.

### Streak state

A calendar streak maintains:

- current consecutive completed periods;
- longest consecutive periods if needed for explanation;
- last completed period key;
- current period qualifying count;
- target;
- timezone and calendar policy version;
- bounded recent period states required for late corrections;
- last recompute watermark.

The Engine MUST retain enough recent period detail to apply configured lateness and correction policy exactly.

### Dependency state

A dependency node stores:

- prerequisite Edition id;
- prerequisite unlock id;
- prerequisite Recognition State observed;
- source `achievement.unlocked` Event id;
- satisfied time.

If a prerequisite becomes contested or invalidated, the dependent Achievement does not automatically relock. Before dependent unlock, the node may become unsatisfied according to policy. After dependent unlock, integrity propagation requires an explicit policy and case workflow.

### Recognition state model

`VALID` is the default after unlock.

`CONTESTED` requires:

- integrity case id;
- opened reason code;
- opened actor;
- opened time;
- public suppression policy;
- review deadline where applicable.

`INVALIDATED` requires:

- final reason code;
- evidence references;
- approving actor or dual approval;
- effective time;
- affected downstream notification list;
- Reward correlation where compensation may be considered by Reward policy.

Recognition restoration appends a new transition and never deletes the invalidation row.

### Public visibility state

Public visibility is derived from:

- Character profile visibility and lifecycle;
- Achievement secrecy policy;
- owner-selected showcase settings owned by Character Engine;
- Recognition State;
- Module or realm policy;
- age or minor-safety policy where applicable;
- Definition retirement display policy.

The Achievement Engine SHOULD publish a privacy-filtered visibility decision, but final Character profile composition remains coordinated with Character Engine projections.

### Source payload retention

The Engine retains only:

- source Event id and type;
- producer;
- occurred time;
- subject Character id;
- normalized fields actually used by the plan;
- hashes or tokens where sufficient;
- source aggregate id and version where needed;
- correlation and causation ids;
- correction linkage;
- plan fingerprint.

Full payload retention requires an explicit evidence classification and retention policy.


---

## Events

### Event principles

All Achievement Engine integration uses immutable, versioned Events.

Events describe facts or requested control-plane operations. They do not expose database commands and do not grant another component permission to mutate Achievement tables.

Every Event MUST:

- use the canonical platform envelope;
- have a globally unique `eventId`;
- declare a versioned `eventType` and `schemaVersion`;
- identify an authenticated producer;
- include server-authoritative `occurredAt` and `recordedAt` timestamps;
- carry correlation and causation identifiers;
- identify the Character subject when Character-scoped;
- include tenant or realm scope where configured;
- validate against a registered schema;
- avoid unnecessary personal data;
- be safe for at-least-once delivery.

### Inbound Event classes

The Engine consumes four classes of Events.

#### Source fact Events

These are business or platform facts referenced by active Achievement Definitions.

Examples include:

- `lesson.completed.v1`;
- `activity.completed.v1`;
- `content.published.v1`;
- `community.contribution.accepted.v1`;
- `progression.level.changed.v1`;
- `progression.prestige.completed.v1`;
- `quest.completed.v1`;
- `inventory.item.acquired.v1`;
- `talent.unlocked.v1`;
- `reputation.rank.changed.v1`;
- `season.participation.completed.v1`;
- `achievement.unlocked.v1` for acyclic meta-Achievements.

The Engine subscribes only to Event types required by active compiled plans.

#### Character lifecycle Events

The Engine consumes Character lifecycle facts to maintain local eligibility and privacy projections.

Required contracts include the current equivalents of:

- `character.created.v1`;
- `character.activated.v1`;
- `character.suspended.v1`;
- `character.reactivated.v1`;
- `character.closed.v1`;
- `character.restored.v1`;
- `character.anonymized.v1`;
- `character.visibility.changed.v1` where needed for projection suppression.

#### Correction and reversal Events

A source owner may publish a typed correction referencing a prior Event.

Examples:

- `source.fact.reversed.v1`;
- domain-specific `lesson.completion.reversed.v1`;
- `quest.integrity.invalidated.v1`;
- `quest.progress.corrected.v1` or a registered source-owner correction Event;
- `progression.experience.applied.v1` carrying a reversal or adjustment.

A Definition can consume a correction only when the source schema declares the relationship and the compiled plan defines exact compensation semantics.

#### Internal control Events

Authorized internal workflows may publish:

- `achievement.backfill.requested.v1`;
- `achievement.recompute.requested.v1`;
- `achievement.integrity.review.requested.v1`;
- `achievement.projection.rebuild.requested.v1`;
- `achievement.definition.activation.requested.v1`;
- `achievement.scope.pause.requested.v1`.

These Events require stricter authorization and are not accepted from ordinary Business Modules.

### Outbound Event classes

The Engine publishes:

#### Definition lifecycle Events

- `achievement.definition.published.v1`;
- `achievement.definition.scheduled.v1`;
- `achievement.definition.activated.v1`;
- `achievement.definition.paused.v1`;
- `achievement.definition.resumed.v1`;
- `achievement.definition.retired.v1`.

#### Progress Events

- `achievement.tracking.started.v1`;
- `achievement.progress.changed.v1`;
- `achievement.progress.corrected.v1`;
- `achievement.progress.migrated.v1`.

Progress Event emission may be sampled or thresholded for presentation, but authoritative state changes remain fully recorded locally.

#### Unlock Events

- `achievement.unlocked.v1`;
- `achievement.unlock.contested.v1`;
- `achievement.invalidated.v1`;
- `achievement.recognition.restored.v1`.

#### Operational Events

- `achievement.evaluation.quarantined.v1`;
- `achievement.backfill.started.v1`;
- `achievement.backfill.completed.v1`;
- `achievement.backfill.completed.with.errors.v1`;
- `achievement.reconciliation.drift.detected.v1`;
- `achievement.reconciliation.repaired.v1`;
- `achievement.projection.rebuilt.v1`.

### Progress Event emission policy

Publishing every counter increment may create unnecessary Event volume and reveal private behavior.

Each Definition Version declares one progress publication policy:

- `NONE` — no external progress Events;
- `ON_TRACKING_START`;
- `ON_VALUE_CHANGE`;
- `ON_PERCENT_STEP`, for example each 10%;
- `ON_NAMED_STEP`;
- `ON_COMPLETION_ONLY`;
- `OWNER_PRIVATE_ONLY` through a restricted topic.

The policy affects outbound Events only. It does not alter authoritative evaluation or evidence.

### Event publication ordering

Within one Aggregate transaction, outbox sequence MUST preserve:

1. progress transition facts;
2. immutable unlock fact when produced;
3. optional projection invalidation or presentation Event;
4. operational summary.

Consumers MUST still be idempotent and tolerate independent topic delivery.

`achievement.unlocked.v1` MUST include the resulting Aggregate version and unique unlock id so downstream consumers can deduplicate.

### Event partitioning

Recommended partition keys:

- Character-scoped progress and unlock Events: `character_id`;
- Definition lifecycle Events: `achievement_definition_id`;
- Backfill job Events: `backfill_job_id`;
- integrity case Events: `integrity_case_id`.

When platform infrastructure requires aggregate ordering, Character Achievement lifecycle Events MAY use `character_achievement_id`. Downstream Reward and profile consumers must still be able to route by Character.

### Replay metadata

Replayed Events MUST preserve original Event identity where replaying the same logical fact.

The envelope includes:

- `replay.isReplay`;
- `replay.replayId`;
- `replay.originalRecordedAt`;
- optional source archive reference.

A replay MUST NOT create a new logical Contribution by changing `eventId`. If a source system cannot preserve ids, it must supply a stable `originalEventId`, and the Achievement schema must derive contribution identity from it.

### Causation lineage

Every produced Event carries:

- original correlation id;
- immediate causation id;
- root source Event id where available;
- bounded causal depth;
- optional cycle guard set or fingerprint.

Meta-Achievement and Reward integrations use this lineage to prevent recursive cascades.

### Event age and future skew

Each source contract declares:

- maximum future clock skew;
- normal live lateness;
- maximum accepted lateness;
- historical replay policy;
- correction retention.

Events beyond normal bounds are not silently discarded. They are classified as live, late-but-accepted, backfill-required, quarantined, or expired according to Definition and source policy.

### Unknown Event version

An unknown or incompatible Event version MUST be quarantined. The Engine MUST NOT attempt best-effort field interpretation.

### Producer authorization

Transport identity MUST match the envelope producer. Definition publication records the allowlisted producer or producer class for every source subscription.

An Event with a valid schema but unauthorized producer is rejected and audited without revealing Definition details.

### Event privacy classification

Event fields used in Conditions are classified as:

- public;
- internal;
- sensitive;
- highly sensitive;
- prohibited for Achievement evidence.

Definition publication fails when its evidence policy is incompatible with field classification.

---

## Event Contracts

### Canonical platform Event envelope

Achievement Events use the exact camelCase canonical envelope from
`002a-platform-contract-standard`. Character evaluation and unlock Events use
`characterId` as `partitionKey`, identify the Character as `subject`, and carry
the Achievement Aggregate version. Definition lifecycle Events use the
Definition Version ID as partition key.

Meta-Achievement processing preserves lineage and appends the activated
Achievement dependency token to `cycleGuard`.

### Envelope requirements

- The complete canonical field set from `002a-platform-contract-standard` is
  required, including `recordedAt`, actor, subject, realm, lineage, replay, and
  data classification.
- Character-targeted source Events MUST identify the Character in the schema-defined subject field.
- Producer is verified from transport credentials and cannot be trusted solely from JSON.
- `occurredAt` is source-authoritative only when the source contract grants that authority.
- `recordedAt` is assigned by the producer's authoritative commit, not the client.
- `partitionKey` SHOULD be the Character id for source facts.
- Unknown top-level fields are accepted only under explicit forward-compatibility rules.
- Payload size is bounded by platform limits.
- Personal free text MUST NOT be copied into Achievement Events unless a registered Condition explicitly requires a classified normalized field and policy permits it.

### Source fact contract requirements

A source Event eligible for Achievement evaluation MUST document:

- business fact meaning;
- authoritative producer;
- Character subject mapping;
- uniqueness semantics;
- whether duplicates can have different Event ids;
- aggregate id and sequence semantics;
- correction or reversal contract;
- allowed lateness;
- replay behavior;
- field types and bounds;
- privacy classification;
- retention availability.

### Example source Event

```json
{
  "eventId": "7dd0ac69-c3f2-4bc7-9c6d-73f0e3a2f32f",
  "eventType": "activity.completed.v1",
  "schemaVersion": 1,
  "producer": "fitness-module",
  "occurredAt": "2026-07-18T10:15:00Z",
  "recordedAt": "2026-07-18T10:15:00.120Z",
  "subject": {
    "type": "character",
    "id": "62bf5446-cbf4-47ec-8563-ef6d13bbfdb7"
  },
  "aggregate": {
    "type": "activity",
    "id": "a40da34c-bb4b-4318-8c20-91ba38d8e861",
    "version": 4
  },
  "correlationId": "0a3247a3-b180-49a5-b817-2529bb59e78f",
  "causationId": "e79e2022-c79c-42db-9915-8130ef12e99b",
  "traceId": "trace-id",
  "tenantId": null,
  "realmKey": "global",
  "partitionKey": "62bf5446-cbf4-47ec-8563-ef6d13bbfdb7",
  "replay": {
    "isReplay": false,
    "replayId": null,
    "originalRecordedAt": null
  },
  "lineage": {
    "rootEventId": "e79e2022-c79c-42db-9915-8130ef12e99b",
    "depth": 1,
    "cycleGuard": []
  },
  "metadata": {
    "contract": "platform-event-envelope.v1"
  },
  "payload": {
    "activityId": "a40da34c-bb4b-4318-8c20-91ba38d8e861",
    "activityType": "practice",
    "durationSeconds": 3600,
    "validated": true,
    "sourcePolicyVersion": 3
  }
}
```

### `achievement.tracking.started.v1`

Published when a Character Achievement Aggregate is first materialized with meaningful progress.

```json
{
  "eventId": "7ea7dcf9-21dc-4dff-8803-839f07c36329",
  "eventType": "achievement.tracking.started.v1",
  "schemaVersion": 1,
  "producer": "achievement-engine",
  "occurredAt": "2026-07-18T10:15:00Z",
  "recordedAt": "2026-07-18T10:15:00.250Z",
  "subject": {
    "type": "character",
    "id": "62bf5446-cbf4-47ec-8563-ef6d13bbfdb7"
  },
  "aggregate": {
    "type": "character_achievement",
    "id": "48e043df-aef3-47b5-91ed-f89780231150",
    "version": 1
  },
  "correlationId": "0a3247a3-b180-49a5-b817-2529bb59e78f",
  "causationId": "7dd0ac69-c3f2-4bc7-9c6d-73f0e3a2f32f",
  "traceId": "trace-id",
  "tenantId": null,
  "realmKey": "global",
  "partitionKey": "62bf5446-cbf4-47ec-8563-ef6d13bbfdb7",
  "replay": {
    "isReplay": false,
    "replayId": null,
    "originalRecordedAt": null
  },
  "lineage": {
    "rootEventId": "7dd0ac69-c3f2-4bc7-9c6d-73f0e3a2f32f",
    "depth": 2,
    "cycleGuard": ["achievement:consistency.apprentice:2026"]
  },
  "metadata": {
    "contract": "platform-event-envelope.v1",
    "audience": "internal"
  },
  "payload": {
    "characterAchievementId": "48e043df-aef3-47b5-91ed-f89780231150",
    "achievementDefinitionId": "99f51350-959d-4995-a445-adc68e01da5b",
    "achievementDefinitionVersionId": "98a60b28-e005-4483-96c7-80f004e3f8a9",
    "achievementEditionId": "79f84209-4e6d-47e2-8747-b7f2056fd66e",
    "achievementKey": "consistency.apprentice",
    "namespace": "school",
    "definitionFingerprint": "sha256:...",
    "firstTrackedAt": "2026-07-18T10:15:00Z",
    "progress": {
      "mode": "EXACT",
      "current": "1",
      "target": "10",
      "complete": false
    },
    "aggregateVersion": 1
  }
}
```

Secret Achievements MUST NOT publish identifying `achievementKey` or visible progress on a broad topic before unlock. They use a restricted topic or omit this Event.

### `achievement.progress.changed.v1`

```json
{
  "eventId": "77b92416-d722-4d4c-ac97-d3ab480ddff2",
  "eventType": "achievement.progress.changed.v1",
  "schemaVersion": 1,
  "producer": "achievement-engine",
  "occurredAt": "2026-07-18T10:15:00Z",
  "recordedAt": "2026-07-18T10:15:00.260Z",
  "subject": {
    "type": "character",
    "id": "62bf5446-cbf4-47ec-8563-ef6d13bbfdb7"
  },
  "aggregate": {
    "type": "character_achievement",
    "id": "48e043df-aef3-47b5-91ed-f89780231150",
    "version": 7
  },
  "correlationId": "0a3247a3-b180-49a5-b817-2529bb59e78f",
  "causationId": "7dd0ac69-c3f2-4bc7-9c6d-73f0e3a2f32f",
  "traceId": "trace-id",
  "tenantId": null,
  "realmKey": "global",
  "partitionKey": "62bf5446-cbf4-47ec-8563-ef6d13bbfdb7",
  "replay": {
    "isReplay": false,
    "replayId": null,
    "originalRecordedAt": null
  },
  "lineage": {
    "rootEventId": "7dd0ac69-c3f2-4bc7-9c6d-73f0e3a2f32f",
    "depth": 2,
    "cycleGuard": ["achievement:consistency.apprentice:2026"]
  },
  "metadata": {
    "contract": "platform-event-envelope.v1",
    "audience": "owner-private"
  },
  "payload": {
    "characterAchievementId": "48e043df-aef3-47b5-91ed-f89780231150",
    "achievementEditionId": "79f84209-4e6d-47e2-8747-b7f2056fd66e",
    "achievementKey": "consistency.apprentice",
    "namespace": "school",
    "definitionVersionId": "98a60b28-e005-4483-96c7-80f004e3f8a9",
    "progress": {
      "mode": "EXACT",
      "before": {
        "current": "6",
        "target": "10",
        "complete": false
      },
      "after": {
        "current": "7",
        "target": "10",
        "complete": false
      },
      "presentationStepKey": "achievement.progress.70_percent"
    },
    "source": {
      "eventId": "7dd0ac69-c3f2-4bc7-9c6d-73f0e3a2f32f",
      "eventType": "activity.completed.v1",
      "occurredAt": "2026-07-18T10:15:00Z"
    },
    "aggregateVersion": 7
  }
}
```

The public contract SHOULD omit source detail unless policy explicitly permits it.

### `achievement.unlocked.v1`

This is the canonical milestone fact.

```json
{
  "eventId": "b1d2418d-7c56-4cc0-88fa-b565193a0013",
  "eventType": "achievement.unlocked.v1",
  "schemaVersion": 1,
  "producer": "achievement-engine",
  "occurredAt": "2026-07-18T10:15:00Z",
  "recordedAt": "2026-07-18T10:15:00.270Z",
  "subject": {
    "type": "character",
    "id": "62bf5446-cbf4-47ec-8563-ef6d13bbfdb7"
  },
  "aggregate": {
    "type": "character_achievement",
    "id": "48e043df-aef3-47b5-91ed-f89780231150",
    "version": 10
  },
  "correlationId": "0a3247a3-b180-49a5-b817-2529bb59e78f",
  "causationId": "7dd0ac69-c3f2-4bc7-9c6d-73f0e3a2f32f",
  "traceId": "trace-id",
  "tenantId": null,
  "realmKey": "global",
  "partitionKey": "62bf5446-cbf4-47ec-8563-ef6d13bbfdb7",
  "replay": {
    "isReplay": false,
    "replayId": null,
    "originalRecordedAt": null
  },
  "lineage": {
    "rootEventId": "7dd0ac69-c3f2-4bc7-9c6d-73f0e3a2f32f",
    "depth": 2,
    "cycleGuard": ["achievement:consistency.apprentice:2026"]
  },
  "metadata": {
    "contract": "platform-event-envelope.v1",
    "audience": "platform"
  },
  "payload": {
    "achievementUnlockId": "5a66b92a-6946-4bf6-8ec4-f16f2fd644d3",
    "characterAchievementId": "48e043df-aef3-47b5-91ed-f89780231150",
    "achievementDefinitionId": "99f51350-959d-4995-a445-adc68e01da5b",
    "achievementDefinitionVersionId": "98a60b28-e005-4483-96c7-80f004e3f8a9",
    "achievementEditionId": "79f84209-4e6d-47e2-8747-b7f2056fd66e",
    "achievementKey": "consistency.apprentice",
    "editionKey": "2026",
    "seriesKey": "consistency.apprentice",
    "namespace": "school",
    "categoryKey": "consistency",
    "rarityKey": "rare",
    "unlockedAt": "2026-07-18T10:15:00Z",
    "recordedAt": "2026-07-18T10:15:00.250Z",
    "timeBasis": "EVENT_OCCURRED_AT",
    "recognitionState": "VALID",
    "definitionFingerprint": "sha256:...",
    "presentation": {
      "nameKey": "achievement.school.consistency.apprentice.name",
      "descriptionKey": "achievement.school.consistency.apprentice.description",
      "iconAssetId": "asset-id",
      "celebrationKey": "achievement.unlock.standard"
    },
    "sourceSummary": {
      "rootEventId": "7dd0ac69-c3f2-4bc7-9c6d-73f0e3a2f32f",
      "evidenceCount": 10
    },
    "aggregateVersion": 10
  }
}
```

Requirements:

- `achievementUnlockId` is globally unique and stable.
- `achievementEditionId` identifies once-per-Character semantics.
- `definitionFingerprint` identifies exact evaluation behavior.
- `unlockedAt` and `recordedAt` are distinct.
- Reward Engine deduplicates using unlock id or a configured Trigger Binding key.
- Sensitive evidence is not included.
- A secret Achievement becomes revealable only according to its unlock secrecy policy.

### `achievement.unlock.contested.v1`

```json
{
  "eventId": "dbf95dca-eb40-4ffc-b938-721387d561b5",
  "eventType": "achievement.unlock.contested.v1",
  "schemaVersion": 1,
  "producer": "achievement-engine",
  "occurredAt": "2026-07-20T09:00:00Z",
  "recordedAt": "2026-07-20T09:00:00.100Z",
  "subject": {
    "type": "character",
    "id": "62bf5446-cbf4-47ec-8563-ef6d13bbfdb7"
  },
  "aggregate": {
    "type": "character_achievement",
    "id": "48e043df-aef3-47b5-91ed-f89780231150",
    "version": 11
  },
  "correlationId": "integrity-case-id",
  "causationId": "integrity-request-event-id",
  "traceId": "trace-id",
  "tenantId": null,
  "realmKey": "global",
  "partitionKey": "62bf5446-cbf4-47ec-8563-ef6d13bbfdb7",
  "replay": {
    "isReplay": false,
    "replayId": null,
    "originalRecordedAt": null
  },
  "metadata": {
    "contract": "platform-event-envelope.v1",
    "audience": "restricted"
  },
  "payload": {
    "achievementUnlockId": "5a66b92a-6946-4bf6-8ec4-f16f2fd644d3",
    "characterAchievementId": "48e043df-aef3-47b5-91ed-f89780231150",
    "achievementEditionId": "79f84209-4e6d-47e2-8747-b7f2056fd66e",
    "integrityCaseId": "4ce101b2-3fd4-4b75-b9c9-1545a6b0265e",
    "previousRecognitionState": "VALID",
    "recognitionState": "CONTESTED",
    "publicVisibility": "SUPPRESSED",
    "safeReasonKey": "achievement.integrity.under_review",
    "effectiveAt": "2026-07-20T09:00:00Z",
    "aggregateVersion": 11
  }
}
```

Internal investigation reasons MUST NOT be included on broad topics.

### `achievement.invalidated.v1`

```json
{
  "eventId": "a57fa20d-3f0f-463f-9dd5-518b6bb77e30",
  "eventType": "achievement.invalidated.v1",
  "schemaVersion": 1,
  "producer": "achievement-engine",
  "occurredAt": "2026-07-22T13:00:00Z",
  "recordedAt": "2026-07-22T13:00:00.100Z",
  "subject": {
    "type": "character",
    "id": "62bf5446-cbf4-47ec-8563-ef6d13bbfdb7"
  },
  "aggregate": {
    "type": "character_achievement",
    "id": "48e043df-aef3-47b5-91ed-f89780231150",
    "version": 12
  },
  "correlationId": "integrity-case-id",
  "causationId": "integrity-decision-event-id",
  "traceId": "trace-id",
  "tenantId": null,
  "realmKey": "global",
  "partitionKey": "62bf5446-cbf4-47ec-8563-ef6d13bbfdb7",
  "replay": {
    "isReplay": false,
    "replayId": null,
    "originalRecordedAt": null
  },
  "metadata": {
    "contract": "platform-event-envelope.v1",
    "audience": "platform"
  },
  "payload": {
    "achievementUnlockId": "5a66b92a-6946-4bf6-8ec4-f16f2fd644d3",
    "characterAchievementId": "48e043df-aef3-47b5-91ed-f89780231150",
    "achievementEditionId": "79f84209-4e6d-47e2-8747-b7f2056fd66e",
    "previousRecognitionState": "CONTESTED",
    "recognitionState": "INVALIDATED",
    "publicVisibility": "SUPPRESSED",
    "safeReasonCode": "SOURCE_FACT_INVALIDATED",
    "integrityCaseId": "4ce101b2-3fd4-4b75-b9c9-1545a6b0265e",
    "effectiveAt": "2026-07-22T13:00:00Z",
    "downstreamReviewRecommended": true,
    "aggregateVersion": 12
  }
}
```

This Event does not command Reward revocation. Reward policy decides whether a correlated Reward requires a separate revocation workflow.

### `achievement.recognition.restored.v1`

Published when an authorized decision returns Recognition State to `VALID`.

Required payload fields:

- unlock id;
- Character Achievement id;
- Edition id;
- previous Recognition State;
- restored state;
- integrity case id;
- safe reason code;
- effective time;
- aggregate version.

### Source correction contract

```json
{
  "eventId": "2fbd0dc1-1b13-4ff8-a3d7-21fdb0ccbf5f",
  "eventType": "source.fact.reversed.v1",
  "schemaVersion": 1,
  "producer": "fitness-module",
  "occurredAt": "2026-07-19T08:00:00Z",
  "recordedAt": "2026-07-19T08:00:00.100Z",
  "subject": {
    "type": "character",
    "id": "62bf5446-cbf4-47ec-8563-ef6d13bbfdb7"
  },
  "aggregate": {
    "type": "activity",
    "id": "a40da34c-bb4b-4318-8c20-91ba38d8e861",
    "version": 5
  },
  "correlationId": "correction-id",
  "causationId": "original-validation-change-id",
  "traceId": "trace-id",
  "tenantId": null,
  "realmKey": "global",
  "partitionKey": "62bf5446-cbf4-47ec-8563-ef6d13bbfdb7",
  "replay": {
    "isReplay": false,
    "replayId": null,
    "originalRecordedAt": null
  },
  "metadata": {
    "contract": "platform-event-envelope.v1"
  },
  "payload": {
    "originalEventId": "7dd0ac69-c3f2-4bc7-9c6d-73f0e3a2f32f",
    "correctionId": "72c6b928-a94c-417f-a793-0bc019657ce8",
    "reasonCode": "SOURCE_VALIDATION_REVERSED",
    "effectiveAt": "2026-07-19T08:00:00Z",
    "replacementEventId": null
  }
}
```

Correction processing rules:

- the producer must be authorized to correct the original source contract;
- the original Event id must resolve to retained evidence or a source archive reference;
- the same correction id applies at most once;
- before unlock, exact inverse Contribution is applied when supported;
- after unlock, the Aggregate remains unlocked and an integrity policy decides whether to open a case;
- unsupported correction semantics are quarantined, not guessed;
- a replacement Event is evaluated separately and idempotently.

### `achievement.definition.published.v1`

Required payload:

- Definition id;
- Version id and number;
- Edition id;
- namespace and key;
- compiled plan fingerprint;
- source Event subscriptions and schema fingerprints;
- dependency Edition ids;
- secrecy and progress policy;
- retroactivity policy;
- publisher and approval references;
- publication time.

The Event MUST NOT include secret localized prose when the topic audience is broad.

### `achievement.definition.activated.v1`

Required payload:

- activation id;
- Definition Version id;
- Edition id;
- scope;
- effective start and optional end;
- rollout mode;
- retroactivity mode;
- backfill job id when applicable;
- activation actor or scheduler;
- activation version.

### `achievement.backfill.completed.v1`

Required payload:

- Backfill Job id;
- Definition Version and Edition ids;
- scope;
- source time range;
- processed Character count;
- progress mutation count;
- unlock count;
- duplicate count;
- error and quarantine count;
- start and completion time;
- checkpoint fingerprint;
- result manifest reference.

### Error contract

Deterministic evaluation errors use internal structured codes, for example:

- `UNKNOWN_CHARACTER`;
- `CHARACTER_INELIGIBLE`;
- `SCHEMA_INCOMPATIBLE`;
- `UNAUTHORIZED_PRODUCER`;
- `DEFINITION_NOT_RESOLVABLE`;
- `PLAN_FINGERPRINT_MISMATCH`;
- `TYPE_CONVERSION_FAILED`;
- `CONTRIBUTION_OUT_OF_BOUNDS`;
- `ORDER_GAP`;
- `LATE_EVENT_OUTSIDE_POLICY`;
- `CORRECTION_UNSUPPORTED`;
- `DEPENDENCY_CYCLE_GUARD`;
- `AGGREGATE_CONFLICT_EXHAUSTED`;
- `PRIVACY_POLICY_VIOLATION`.

Public APIs receive safe error codes and correlation ids, not internal stack traces or secret Achievement details.

### Contract compatibility

- Additive optional fields may be introduced within a schema version only when consumers explicitly tolerate them.
- Removing or changing meaning requires a new Event version.
- Definition publication pins accepted source schema versions or a tested compatibility range.
- An incompatible source version does not fall back to an older extractor.
- Outbound Event evolution follows consumer migration and deprecation policy.


---

## Read Models

Read models are derived, audience-specific, and non-authoritative. They MUST NOT be used to perform mutations or reconstruct secret Conditions on untrusted clients.

### Read model principles

- Authoritative writes use Aggregate state, not projections.
- Every projection records source aggregate version and Definition fingerprint.
- Projection consumers are idempotent by Event id.
- A projection never exposes more information than its audience policy permits.
- Secret and contested Achievements use explicit suppression, not client-side hiding.
- Pagination is cursor-based for unbounded collections.
- Eventual consistency is visible through version or freshness metadata where relevant.
- Projection rebuilds are deterministic from authoritative state and immutable Definitions.

### Owner Achievement Catalog

Provides the Character owner’s catalog view.

Contains:

- visible active and historical Achievement Editions;
- lock, tracking, unlock, contested, or invalidated presentation state;
- progress according to owner policy;
- localization and media keys;
- category and rarity;
- first-tracked and unlock times;
- Definition retirement status;
- secret placeholder or revealed metadata;
- whether the Achievement is eligible for profile showcase;
- freshness and aggregate version.

The owner catalog MUST NOT expose internal source predicates, fraud signals, private Module identifiers, raw evidence payloads, or Definition authoring metadata.

### Public Character Achievement Summary

Provides privacy-filtered public information for profile composition.

Contains only Achievements that are:

- validly unlocked;
- allowed by Character visibility;
- allowed by Achievement policy;
- not suppressed by lifecycle, integrity, minor-safety, or Module policy;
- selected or discoverable according to public presentation rules.

Fields may include:

- Edition id;
- public Achievement key where non-secret after unlock;
- public localization keys;
- icon or media reference;
- category and rarity;
- unlocked date with configured precision;
- public narrative key;
- verified recognition marker.

It MUST NOT include exact source Events, progress before unlock, internal reason codes, or owner-only history.

### Character Achievement Detail

Owner or privileged read for one Edition.

Contains:

- Definition presentation;
- current state;
- progress model;
- named steps and allowed node summaries;
- unlock and recording times;
- integrity status with safe user-facing reason;
- recent qualifying activity summary when policy permits;
- Definition retirement or version migration state;
- support correlation id for unresolved issues.

### Achievement Catalog Projection

Provides discoverable Definition metadata independent of one Character.

Supports filters by:

- namespace;
- category;
- rarity;
- availability;
- Season or Edition;
- secrecy class where authorized;
- status;
- tags;
- locale availability.

The public catalog MUST not reveal hidden secret Achievement metadata.

### Recent Unlock Feed Projection

A privacy-filtered stream of recent unlocks for the owner or approved community surfaces.

Requirements:

- no broad public feed by default;
- visibility evaluated at read time or through revocable projection tokens;
- invalidation and Character privacy changes remove entries promptly;
- cursor pagination;
- anti-scraping limits;
- no inference through stable ordering of hidden entries.

### Character Achievement Summary Projection

Internal compact model used by Character profile, Quest, or content systems.

Contains:

- Character id;
- total valid unlocked count;
- count by category where approved;
- selected showcase Achievement references;
- latest valid unlock summary;
- projection version and source watermark.

This summary is not sufficient to evaluate new Achievements.

### Achievement Progress Projection

Optimized private model for live progress UI.

Contains:

- current and target values as strings for exact transport;
- complete flag;
- percent basis points when configured;
- named step completion;
- next presentation threshold;
- last changed time;
- projection freshness;
- pending command or Event receipt where applicable.

Clients MUST NOT derive unlock eligibility from this model.

### Administration Definition Projection

Contains:

- all Version statuses;
- authored and compiled graph;
- source subscriptions;
- dependency graph;
- activation windows;
- validation findings;
- approvals;
- simulation results;
- observed processing volume;
- backfill estimates;
- current incidents;
- immutable fingerprints.

### Administration Character Inspection Projection

Contains:

- Aggregate root;
- node state;
- evidence summaries;
- evaluation operations;
- unlock record;
- integrity transitions;
- correlated source and downstream Event ids;
- projection status;
- support-safe and restricted views.

Access to raw evidence is separately authorized and audited.

### Definition Analytics Projection

Non-authoritative analytics may include:

- Characters tracking;
- unlock count;
- unlock rate by approved cohort;
- median time to unlock;
- progress distribution;
- source Event volume;
- error and quarantine rate;
- late Event rate;
- backfill impact;
- secret Achievement exposure checks.

Analytics MUST use privacy thresholds and MUST NOT alter authoritative evaluation.

### Projection versioning

Every projection record SHOULD contain:

- source Aggregate version;
- source Definition Version id;
- Definition fingerprint;
- last Event id;
- last projected time;
- privacy policy version;
- projection schema version.

A lower Aggregate version MUST NOT overwrite a higher one.

### Projection gap handling

If a consumer receives version `N+2` before `N+1`, it may:

- buffer within a bounded window;
- fetch an authoritative snapshot;
- mark a repair requirement;
- apply the newer complete snapshot where contract permits.

It MUST NOT later apply stale version `N+1` over `N+2`.

### Cache behavior

- Public caches use short TTL and explicit invalidation for privacy or integrity changes.
- Secret metadata MUST not share cache keys with public placeholders.
- Owner and public responses use separate cache namespaces.
- Character closure, anonymization, visibility tightening, contest, and invalidation trigger high-priority purge.
- Cache failure must not weaken authorization or secrecy.

---

## Write Models

All mutations are commands or consumed Events. Direct table writes from external systems are prohibited.

### General command requirements

Every command includes:

- `operation_id` or `Idempotency-Key`;
- authenticated actor or service identity;
- authorization scope;
- correlation id;
- expected resource version where concurrent editing matters;
- reason code for privileged operations;
- server-recorded request time;
- bounded typed payload;
- tenant or realm context where applicable.

A repeated operation id with the same canonical request returns the original result. Reuse with different content returns an idempotency conflict.

### Definition commands

#### `CreateAchievementDefinition`

Creates the stable logical Definition and initial Draft Version.

Required inputs:

- namespace;
- Achievement key;
- owner team;
- governance policy;
- Edition identity;
- initial draft content.

#### `CreateDefinitionVersion`

Creates a new Draft Version based on an existing published or Draft Version.

Published content is copied, never edited in place.

#### `UpdateDefinitionDraft`

Updates Draft content with optimistic concurrency.

Requires expected draft revision.

#### `ValidateDefinitionVersion`

Runs structural, schema, type, privacy, dependency, cycle, safety, and compilation validation.

Validation result references the exact content hash.

#### `SubmitDefinitionForReview`

Transitions a validated hash to review.

#### `ApproveDefinitionVersion`

Records approval by a principal authorized under governance policy.

Self-approval is prohibited where separation of duties is configured.

#### `RejectDefinitionVersion`

Returns Version to Draft with reason and review findings.

#### `PublishDefinitionVersion`

Creates immutable published content and compiled plan.

Publication requires all approvals and matching content hash.

#### `ScheduleDefinitionActivation`

Creates a non-overlapping activation window and rollout scope.

#### `ActivateDefinitionVersion`

Activates immediately under authorized policy.

#### `PauseDefinitionActivation`

Pauses routing without mutating Definition content.

#### `ResumeDefinitionActivation`

Resumes routing with explicit handling of Events accumulated during pause.

#### `RetireDefinitionActivation`

Stops new live evaluation.

#### `ArchiveDefinitionVersion`

Hides a retired or unused Version from normal administration lists while retaining it.

### Runtime Event evaluation command

Inbound Event processing is represented internally as `EvaluateSourceEventTarget`.

Fields include:

- source Event id and schema fingerprint;
- Character id;
- target Edition and Definition Version;
- compiled plan fingerprint;
- target operation id;
- lifecycle projection version;
- evaluation time;
- replay or backfill context;
- expected ordering metadata.

This command is not a public API.

### Progress correction commands

#### `ApplySourceCorrection`

Applies a typed exact correction before unlock or opens an integrity workflow after unlock.

#### `RecomputeCharacterAchievement`

Rebuilds one Aggregate from retained exact evidence or an approved source replay manifest.

It requires dry-run diff before commit unless incident policy explicitly authorizes immediate repair.

#### `MigrateCharacterAchievementVersion`

Applies an approved Version migration mapping.

### Integrity commands

#### `OpenAchievementIntegrityCase`

Creates a case and optionally moves Recognition State to `CONTESTED`.

#### `InvalidateAchievementRecognition`

Moves Recognition State to `INVALIDATED` while retaining unlock history.

Requires privileged scope, reason code, evidence reference, and dual approval where policy requires.

#### `RestoreAchievementRecognition`

Returns Recognition State to `VALID` with a new append-only transition.

#### `CloseIntegrityCaseNoAction`

Closes a case without changing valid recognition.

### Backfill commands

#### `CreateAchievementBackfillJob`

Defines:

- Definition Version and Edition;
- Character or realm scope;
- source Event types;
- historical time range;
- source archive or snapshot provider;
- rate limit;
- batch size;
- retroactivity policy;
- dry-run mode;
- expected volume;
- approval policy.

#### `ValidateBackfillJob`

Checks source retention, Definition compatibility, cost limits, privacy, duplicate safety, and expected impact.

#### `ApproveBackfillJob`

Records required approvals.

#### `StartBackfillJob`

Queues resumable work.

#### `PauseBackfillJob`

Stops new batches after current transactions complete.

#### `ResumeBackfillJob`

Continues from checkpoint.

#### `CancelBackfillJob`

Stops future work. Committed effects remain.

### Projection commands

- `RebuildAchievementProjection`;
- `PurgeCharacterAchievementCaches`;
- `ReindexAchievementCatalog`;
- `ReconcileProjectionVersion`.

Projection commands cannot mutate authoritative Achievement state.

### Freeze commands

- `FreezeCharacterAchievement`;
- `UnfreezeCharacterAchievement`;
- `PauseDefinitionScope`;
- `QuarantineProducer`;
- `ResumeProducer`.

Every freeze command declares Event handling policy and expiration.

### Import command

`ImportAchievementEvidence` is available only for migration from an approved legacy system.

Requirements:

- typed import schema;
- stable external record id;
- source system identity;
- evidence time;
- Definition Version mapping;
- exact idempotency key;
- dry-run and reconciliation report;
- no free-form direct unlock unless the migration policy represents the legacy unlock as verified evidence;
- immutable import manifest.

### Command result model

Command responses include:

- operation id;
- status;
- resource id;
- prior and resulting version where applicable;
- accepted, applied, or pending state;
- validation findings or safe error code;
- correlation id;
- projection freshness expectation;
- links or identifiers for asynchronous jobs.

### Forbidden write paths

The following are prohibited:

- direct SQL by Business Modules;
- admin UI writing tables without command service;
- client-submitted counter deltas;
- direct “unlock by key” endpoint for ordinary producers;
- changing `unlocked_at`;
- deleting evidence to hide an unlock;
- editing a published Condition graph;
- updating progress from an analytics query;
- inserting Reward state from the Achievement Engine;
- bulk updates without per-item operation identities.

---

## Database Schema

The following PostgreSQL schema is a reference design. Implementations MAY use equivalent storage, but MUST preserve the ownership, immutability, uniqueness, transaction, and query semantics.

### Extensions and conventions

```sql
CREATE EXTENSION IF NOT EXISTS pgcrypto;
```

Conventions:

- all identifiers are UUIDs generated server-side;
- all timestamps are `TIMESTAMPTZ` in UTC;
- logical keys use bounded `VARCHAR`;
- large append-only tables are partitionable by time and optionally realm;
- JSONB content is validated by the application and publication pipeline;
- authoritative numeric progress uses `BIGINT` or `NUMERIC`, never floating point;
- status constraints are explicit;
- immutable rows are protected by restricted database roles and update triggers where practical.

### `achievement_definition`

```sql
CREATE TABLE achievement_definition (
    achievement_definition_id       UUID PRIMARY KEY,
    namespace                       VARCHAR(128) NOT NULL,
    achievement_key                 VARCHAR(192) NOT NULL,
    owner_team_key                  VARCHAR(128) NOT NULL,
    governance_policy_key           VARCHAR(128) NOT NULL,
    catalog_state                   VARCHAR(32) NOT NULL,
    created_by_actor_type           VARCHAR(32) NOT NULL,
    created_by_actor_id             UUID NULL,
    created_at                      TIMESTAMPTZ NOT NULL,
    updated_at                      TIMESTAMPTZ NOT NULL,
    CONSTRAINT uq_achievement_definition_key
        UNIQUE (namespace, achievement_key),
    CONSTRAINT ck_achievement_definition_catalog_state CHECK (
        catalog_state IN ('PLANNED', 'AVAILABLE', 'RETIRED', 'ARCHIVED')
    ),
    CONSTRAINT ck_achievement_key_format CHECK (
        achievement_key ~ '^[a-z0-9][a-z0-9._-]{0,191}$'
    )
);
```

### `achievement_edition`

```sql
CREATE TABLE achievement_edition (
    achievement_edition_id          UUID PRIMARY KEY,
    achievement_definition_id       UUID NOT NULL
        REFERENCES achievement_definition(achievement_definition_id),
    edition_key                     VARCHAR(128) NOT NULL,
    series_key                      VARCHAR(192) NULL,
    season_id                       UUID NULL,
    realm_key                       VARCHAR(128) NOT NULL DEFAULT 'global',
    catalog_state                   VARCHAR(32) NOT NULL,
    once_per_character              BOOLEAN NOT NULL DEFAULT TRUE,
    available_from                  TIMESTAMPTZ NULL,
    available_until                 TIMESTAMPTZ NULL,
    historical_display_policy       VARCHAR(32) NOT NULL,
    created_at                      TIMESTAMPTZ NOT NULL,
    updated_at                      TIMESTAMPTZ NOT NULL,
    CONSTRAINT uq_achievement_edition
        UNIQUE (achievement_definition_id, edition_key, realm_key),
    CONSTRAINT ck_achievement_edition_once CHECK (once_per_character),
    CONSTRAINT ck_achievement_edition_catalog_state CHECK (
        catalog_state IN ('PLANNED', 'AVAILABLE', 'RETIRED', 'ARCHIVED')
    ),
    CONSTRAINT ck_achievement_edition_window CHECK (
        available_until IS NULL OR available_from IS NULL OR
        available_until > available_from
    )
);
```

Version 1 requires `once_per_character = true`. The column makes the invariant visible and prevents accidental reuse for repeatable mechanics.

### `achievement_definition_version`

```sql
CREATE TABLE achievement_definition_version (
    achievement_definition_version_id UUID PRIMARY KEY,
    achievement_definition_id         UUID NOT NULL
        REFERENCES achievement_definition(achievement_definition_id),
    achievement_edition_id            UUID NOT NULL
        REFERENCES achievement_edition(achievement_edition_id),
    version_number                    INTEGER NOT NULL,
    schema_version                    INTEGER NOT NULL,
    status                            VARCHAR(32) NOT NULL,
    draft_revision                    BIGINT NOT NULL DEFAULT 1,
    category_key                      VARCHAR(128) NOT NULL,
    rarity_key                        VARCHAR(64) NOT NULL,
    secrecy_policy                    JSONB NOT NULL,
    progress_policy                   JSONB NOT NULL,
    presentation                     JSONB NOT NULL,
    condition_graph                   JSONB NOT NULL,
    compiled_plan                     JSONB NULL,
    compiled_plan_fingerprint         BYTEA NULL,
    activation_constraints            JSONB NOT NULL,
    retroactivity_policy              JSONB NOT NULL,
    lifecycle_gate_policy             JSONB NOT NULL,
    evidence_policy                   JSONB NOT NULL,
    integrity_policy                  JSONB NOT NULL,
    source_contract_fingerprints      JSONB NOT NULL,
    content_hash                       BYTEA NOT NULL,
    validation_result                 JSONB NULL,
    validation_hash                   BYTEA NULL,
    authored_by_actor_type            VARCHAR(32) NOT NULL,
    authored_by_actor_id              UUID NULL,
    published_by_actor_type           VARCHAR(32) NULL,
    published_by_actor_id             UUID NULL,
    published_at                      TIMESTAMPTZ NULL,
    created_at                        TIMESTAMPTZ NOT NULL,
    updated_at                        TIMESTAMPTZ NOT NULL,
    CONSTRAINT uq_achievement_definition_version
        UNIQUE (achievement_definition_id, version_number),
    CONSTRAINT ck_achievement_definition_version_status CHECK (
        status IN (
            'DRAFT', 'VALIDATED', 'IN_REVIEW', 'APPROVED',
            'PUBLISHED', 'SCHEDULED', 'ACTIVE', 'PAUSED',
            'RETIRED', 'ARCHIVED'
        )
    ),
    CONSTRAINT ck_condition_graph_object CHECK (
        jsonb_typeof(condition_graph) = 'object'
    ),
    CONSTRAINT ck_compiled_plan_object CHECK (
        compiled_plan IS NULL OR jsonb_typeof(compiled_plan) = 'object'
    )
);

CREATE INDEX ix_achievement_definition_version_status
    ON achievement_definition_version(status, updated_at DESC);

CREATE INDEX ix_achievement_definition_version_edition
    ON achievement_definition_version(achievement_edition_id, version_number DESC);
```

Published rows MUST be immutable through application authorization and SHOULD be protected by a trigger rejecting updates to normative columns when status has reached `PUBLISHED` or later.

### `achievement_definition_approval`

```sql
CREATE TABLE achievement_definition_approval (
    approval_id                       UUID PRIMARY KEY,
    achievement_definition_version_id UUID NOT NULL
        REFERENCES achievement_definition_version(achievement_definition_version_id),
    content_hash                      BYTEA NOT NULL,
    approval_role                     VARCHAR(64) NOT NULL,
    decision                          VARCHAR(16) NOT NULL,
    reviewer_actor_type               VARCHAR(32) NOT NULL,
    reviewer_actor_id                 UUID NULL,
    comment                           TEXT NULL,
    decided_at                        TIMESTAMPTZ NOT NULL,
    CONSTRAINT ck_achievement_approval_decision CHECK (
        decision IN ('APPROVED', 'REJECTED')
    )
);

CREATE INDEX ix_achievement_approval_version
    ON achievement_definition_approval(
        achievement_definition_version_id,
        decided_at DESC
    );
```

### `achievement_activation`

```sql
CREATE TABLE achievement_activation (
    achievement_activation_id         UUID PRIMARY KEY,
    achievement_definition_version_id UUID NOT NULL
        REFERENCES achievement_definition_version(achievement_definition_version_id),
    achievement_edition_id            UUID NOT NULL
        REFERENCES achievement_edition(achievement_edition_id),
    tenant_id                         UUID NULL,
    realm_key                         VARCHAR(128) NOT NULL DEFAULT 'global',
    scope_expression                  JSONB NOT NULL,
    starts_at                         TIMESTAMPTZ NOT NULL,
    ends_at                           TIMESTAMPTZ NULL,
    status                            VARCHAR(32) NOT NULL,
    rollout_mode                      VARCHAR(32) NOT NULL,
    pause_handling_policy             VARCHAR(32) NOT NULL,
    activation_version                BIGINT NOT NULL DEFAULT 1,
    created_by_actor_type             VARCHAR(32) NOT NULL,
    created_by_actor_id               UUID NULL,
    created_at                        TIMESTAMPTZ NOT NULL,
    updated_at                        TIMESTAMPTZ NOT NULL,
    CONSTRAINT ck_achievement_activation_status CHECK (
        status IN ('SCHEDULED', 'ACTIVE', 'PAUSED', 'RETIRED', 'CANCELLED')
    ),
    CONSTRAINT ck_achievement_activation_window CHECK (
        ends_at IS NULL OR ends_at > starts_at
    ),
    CONSTRAINT ck_achievement_pause_policy CHECK (
        pause_handling_policy IN (
            'BUFFER_AND_REPLAY', 'QUARANTINE',
            'DROP_WITH_AUDIT', 'SOURCE_REPLAY_REQUIRED'
        )
    )
);

CREATE INDEX ix_achievement_activation_lookup
    ON achievement_activation(
        achievement_edition_id,
        realm_key,
        status,
        starts_at,
        ends_at
    );
```

Overlapping active windows for the same Edition and scope SHOULD be prevented with an exclusion constraint using `tstzrange` after normalizing nullable end times.

### `achievement_event_subscription`

```sql
CREATE TABLE achievement_event_subscription (
    achievement_event_subscription_id UUID PRIMARY KEY,
    achievement_definition_version_id UUID NOT NULL
        REFERENCES achievement_definition_version(achievement_definition_version_id),
    node_id                            VARCHAR(128) NOT NULL,
    event_type                         VARCHAR(192) NOT NULL,
    minimum_schema_version             INTEGER NOT NULL,
    maximum_schema_version             INTEGER NOT NULL,
    producer_allowlist                 TEXT[] NOT NULL,
    predicate_plan                     JSONB NOT NULL,
    extraction_plan                    JSONB NOT NULL,
    ordering_requirement               VARCHAR(32) NOT NULL,
    source_contract_fingerprint        BYTEA NOT NULL,
    enabled                            BOOLEAN NOT NULL DEFAULT TRUE,
    created_at                         TIMESTAMPTZ NOT NULL,
    CONSTRAINT uq_achievement_event_subscription
        UNIQUE (
            achievement_definition_version_id,
            node_id,
            event_type
        ),
    CONSTRAINT ck_achievement_subscription_ordering CHECK (
        ordering_requirement IN (
            'COMMUTATIVE', 'EVENT_TIME_ORDERED',
            'SOURCE_SEQUENCE_ORDERED', 'DEPENDENCY_ORDERED'
        )
    )
);

CREATE INDEX ix_achievement_subscription_event_lookup
    ON achievement_event_subscription(event_type, enabled)
    INCLUDE (
        achievement_definition_version_id,
        node_id,
        minimum_schema_version,
        maximum_schema_version
    );
```

### `achievement_definition_dependency`

```sql
CREATE TABLE achievement_definition_dependency (
    dependency_id                     UUID PRIMARY KEY,
    achievement_definition_version_id UUID NOT NULL
        REFERENCES achievement_definition_version(achievement_definition_version_id),
    node_id                            VARCHAR(128) NOT NULL,
    prerequisite_edition_id            UUID NOT NULL
        REFERENCES achievement_edition(achievement_edition_id),
    required_recognition_state         VARCHAR(32) NOT NULL DEFAULT 'VALID',
    created_at                         TIMESTAMPTZ NOT NULL,
    CONSTRAINT uq_achievement_dependency
        UNIQUE (
            achievement_definition_version_id,
            node_id,
            prerequisite_edition_id
        )
);

CREATE INDEX ix_achievement_dependency_prerequisite
    ON achievement_definition_dependency(prerequisite_edition_id);
```

Publication-time graph validation remains required; relational constraints alone cannot prove acyclicity.

### `character_lifecycle_projection`

```sql
CREATE TABLE achievement_character_lifecycle_projection (
    character_id                      UUID PRIMARY KEY,
    lifecycle_state                   VARCHAR(32) NOT NULL,
    source_aggregate_version           BIGINT NOT NULL,
    state_effective_at                TIMESTAMPTZ NOT NULL,
    character_created_at              TIMESTAMPTZ NOT NULL,
    closed_at                         TIMESTAMPTZ NULL,
    anonymized_at                     TIMESTAMPTZ NULL,
    realm_key                         VARCHAR(128) NOT NULL DEFAULT 'global',
    last_source_event_id              UUID NOT NULL,
    projected_at                      TIMESTAMPTZ NOT NULL,
    CONSTRAINT ck_achievement_character_lifecycle_state CHECK (
        lifecycle_state IN ('ACTIVE', 'SUSPENDED', 'CLOSED', 'ANONYMIZED')
    )
);
```

Projection updates require monotonic `source_aggregate_version`.

### `character_achievement`

```sql
CREATE TABLE character_achievement (
    character_achievement_id           UUID PRIMARY KEY,
    character_id                       UUID NOT NULL,
    achievement_edition_id             UUID NOT NULL
        REFERENCES achievement_edition(achievement_edition_id),
    achievement_definition_version_id  UUID NOT NULL
        REFERENCES achievement_definition_version(achievement_definition_version_id),
    definition_fingerprint             BYTEA NOT NULL,
    attainment_state                   VARCHAR(32) NOT NULL,
    recognition_state                  VARCHAR(32) NULL,
    root_complete                      BOOLEAN NOT NULL DEFAULT FALSE,
    progress_mode                      VARCHAR(32) NOT NULL,
    progress_current                   NUMERIC(38, 9) NULL,
    progress_target                    NUMERIC(38, 9) NULL,
    progress_summary                   JSONB NOT NULL,
    first_tracked_at                   TIMESTAMPTZ NOT NULL,
    last_evaluated_at                  TIMESTAMPTZ NOT NULL,
    last_contribution_at               TIMESTAMPTZ NULL,
    unlocked_at                        TIMESTAMPTZ NULL,
    achievement_unlock_id              UUID NULL,
    processing_freeze_state            VARCHAR(32) NOT NULL DEFAULT 'ACTIVE',
    aggregate_version                  BIGINT NOT NULL,
    state_hash                         BYTEA NOT NULL,
    created_at                         TIMESTAMPTZ NOT NULL,
    updated_at                         TIMESTAMPTZ NOT NULL,
    CONSTRAINT uq_character_achievement
        UNIQUE (character_id, achievement_edition_id),
    CONSTRAINT ck_character_achievement_attainment CHECK (
        attainment_state IN ('TRACKING', 'UNLOCKED', 'CONTESTED', 'INVALIDATED')
    ),
    CONSTRAINT ck_character_achievement_recognition CHECK (
        recognition_state IS NULL OR
        recognition_state IN ('VALID', 'CONTESTED', 'INVALIDATED')
    ),
    CONSTRAINT ck_character_achievement_progress_mode CHECK (
        progress_mode IN (
            'NONE', 'BOOLEAN', 'EXACT', 'PERCENT',
            'STEPS', 'COMPOSITE_SUMMARY', 'HIDDEN'
        )
    ),
    CONSTRAINT ck_character_achievement_freeze CHECK (
        processing_freeze_state IN (
            'ACTIVE', 'FROZEN_BUFFER', 'FROZEN_QUARANTINE', 'FROZEN_REJECT'
        )
    ),
    CONSTRAINT ck_character_achievement_unlock_consistency CHECK (
        (
            attainment_state = 'TRACKING' AND
            unlocked_at IS NULL AND
            achievement_unlock_id IS NULL AND
            recognition_state IS NULL
        ) OR (
            attainment_state IN ('UNLOCKED', 'CONTESTED', 'INVALIDATED') AND
            unlocked_at IS NOT NULL AND
            achievement_unlock_id IS NOT NULL AND
            recognition_state IS NOT NULL
        )
    )
);

CREATE INDEX ix_character_achievement_character_state
    ON character_achievement(character_id, attainment_state, updated_at DESC);

CREATE INDEX ix_character_achievement_edition_state
    ON character_achievement(achievement_edition_id, attainment_state, updated_at DESC);
```

The foreign key from `achievement_unlock_id` is added after creation of the unlock table to avoid circular DDL order.

### `character_achievement_node_state`

```sql
CREATE TABLE character_achievement_node_state (
    character_achievement_id           UUID NOT NULL
        REFERENCES character_achievement(character_achievement_id),
    node_id                            VARCHAR(128) NOT NULL,
    node_type                          VARCHAR(64) NOT NULL,
    boolean_value                      BOOLEAN NULL,
    integer_value                      BIGINT NULL,
    decimal_value                      NUMERIC(38, 9) NULL,
    string_value                       VARCHAR(256) NULL,
    state_payload                      JSONB NOT NULL DEFAULT '{}'::jsonb,
    complete                           BOOLEAN NOT NULL,
    first_satisfied_at                 TIMESTAMPTZ NULL,
    last_changed_at                    TIMESTAMPTZ NOT NULL,
    node_version                       BIGINT NOT NULL,
    state_hash                         BYTEA NOT NULL,
    PRIMARY KEY (character_achievement_id, node_id)
);

CREATE INDEX ix_character_achievement_node_complete
    ON character_achievement_node_state(
        character_achievement_id,
        complete,
        node_id
    );
```

The application enforces the allowed value column for each node type.

### `character_achievement_distinct_member`

```sql
CREATE TABLE character_achievement_distinct_member (
    distinct_member_id                 UUID PRIMARY KEY,
    character_achievement_id           UUID NOT NULL
        REFERENCES character_achievement(character_achievement_id),
    node_id                            VARCHAR(128) NOT NULL,
    normalized_value_hash              BYTEA NOT NULL,
    normalization_version              INTEGER NOT NULL,
    active                             BOOLEAN NOT NULL,
    first_evidence_id                  UUID NOT NULL,
    first_observed_at                  TIMESTAMPTZ NOT NULL,
    removed_by_correction_id           UUID NULL,
    removed_at                         TIMESTAMPTZ NULL,
    created_at                         TIMESTAMPTZ NOT NULL
);

CREATE UNIQUE INDEX uq_character_achievement_distinct_active
    ON character_achievement_distinct_member(
        character_achievement_id,
        node_id,
        normalized_value_hash,
        normalization_version
    )
    WHERE active;

CREATE INDEX ix_character_achievement_distinct_node
    ON character_achievement_distinct_member(
        character_achievement_id,
        node_id,
        active
    );
```

### `character_achievement_streak_period`

```sql
CREATE TABLE character_achievement_streak_period (
    character_achievement_id           UUID NOT NULL
        REFERENCES character_achievement(character_achievement_id),
    node_id                            VARCHAR(128) NOT NULL,
    period_key                         VARCHAR(64) NOT NULL,
    timezone_id                       VARCHAR(64) NOT NULL,
    calendar_policy_version           INTEGER NOT NULL,
    qualifying_count                  BIGINT NOT NULL,
    period_complete                   BOOLEAN NOT NULL,
    first_evidence_at                 TIMESTAMPTZ NULL,
    last_evidence_at                  TIMESTAMPTZ NULL,
    state_version                     BIGINT NOT NULL,
    updated_at                        TIMESTAMPTZ NOT NULL,
    PRIMARY KEY (character_achievement_id, node_id, period_key)
);
```

Only bounded recent periods remain in hot storage; older required evidence is archived according to Definition policy.

### `achievement_evaluation_operation`

```sql
CREATE TABLE achievement_evaluation_operation (
    evaluation_operation_id            UUID PRIMARY KEY,
    source_event_id                    UUID NOT NULL,
    original_event_id                  UUID NULL,
    character_id                       UUID NOT NULL,
    achievement_edition_id             UUID NOT NULL,
    achievement_definition_version_id  UUID NOT NULL,
    character_achievement_id           UUID NULL,
    operation_kind                     VARCHAR(32) NOT NULL,
    status                             VARCHAR(32) NOT NULL,
    replay_id                          UUID NULL,
    backfill_job_id                    UUID NULL,
    lifecycle_projection_version       BIGINT NULL,
    prior_aggregate_version            BIGINT NULL,
    resulting_aggregate_version        BIGINT NULL,
    contribution_count                 INTEGER NOT NULL DEFAULT 0,
    error_code                         VARCHAR(128) NULL,
    error_detail                       JSONB NULL,
    plan_fingerprint                   BYTEA NOT NULL,
    started_at                         TIMESTAMPTZ NOT NULL,
    completed_at                       TIMESTAMPTZ NULL,
    created_at                         TIMESTAMPTZ NOT NULL,
    CONSTRAINT uq_achievement_evaluation_target
        UNIQUE (source_event_id, character_id, achievement_edition_id),
    CONSTRAINT ck_achievement_evaluation_status CHECK (
        status IN (
            'RECEIVED', 'READY', 'EVALUATING', 'NO_EFFECT', 'DUPLICATE',
            'APPLIED', 'UNLOCKED', 'HELD', 'REJECTED', 'QUARANTINED',
            'FAILED_TRANSIENT'
        )
    )
);

CREATE INDEX ix_achievement_evaluation_character_time
    ON achievement_evaluation_operation(character_id, started_at DESC);

CREATE INDEX ix_achievement_evaluation_status
    ON achievement_evaluation_operation(status, started_at);
```

### `achievement_evidence`

```sql
CREATE TABLE achievement_evidence (
    achievement_evidence_id             UUID PRIMARY KEY,
    character_achievement_id            UUID NOT NULL
        REFERENCES character_achievement(character_achievement_id),
    evaluation_operation_id             UUID NOT NULL
        REFERENCES achievement_evaluation_operation(evaluation_operation_id),
    source_event_id                     UUID NOT NULL,
    source_event_type                   VARCHAR(192) NOT NULL,
    source_producer                     VARCHAR(128) NOT NULL,
    source_aggregate_id                 UUID NULL,
    source_aggregate_version            BIGINT NULL,
    source_occurred_at                  TIMESTAMPTZ NOT NULL,
    node_id                             VARCHAR(128) NOT NULL,
    contribution_ordinal                INTEGER NOT NULL,
    contribution_type                   VARCHAR(64) NOT NULL,
    normalized_contribution             JSONB NOT NULL,
    before_state_hash                   BYTEA NOT NULL,
    after_state_hash                    BYTEA NOT NULL,
    evidence_hash                       BYTEA NOT NULL,
    correction_state                    VARCHAR(32) NOT NULL DEFAULT 'ACTIVE',
    corrected_by_evidence_id            UUID NULL,
    retention_class                     VARCHAR(64) NOT NULL,
    created_at                          TIMESTAMPTZ NOT NULL,
    CONSTRAINT uq_achievement_evidence_contribution
        UNIQUE (
            source_event_id,
            character_achievement_id,
            node_id,
            contribution_ordinal
        ),
    CONSTRAINT ck_achievement_evidence_correction_state CHECK (
        correction_state IN ('ACTIVE', 'REVERSED', 'REPLACED')
    )
);

CREATE INDEX ix_achievement_evidence_aggregate_time
    ON achievement_evidence(
        character_achievement_id,
        source_occurred_at DESC,
        achievement_evidence_id DESC
    );

CREATE INDEX ix_achievement_evidence_source_event
    ON achievement_evidence(source_event_id);
```

High-volume deployments SHOULD partition this table by `created_at` or `source_occurred_at`, with retention-aware archival.

### `achievement_progress_transition`

```sql
CREATE TABLE achievement_progress_transition (
    progress_transition_id             UUID PRIMARY KEY,
    character_achievement_id           UUID NOT NULL
        REFERENCES character_achievement(character_achievement_id),
    evaluation_operation_id            UUID NOT NULL
        REFERENCES achievement_evaluation_operation(evaluation_operation_id),
    prior_aggregate_version            BIGINT NOT NULL,
    resulting_aggregate_version        BIGINT NOT NULL,
    prior_progress                     JSONB NOT NULL,
    resulting_progress                 JSONB NOT NULL,
    changed_node_ids                   TEXT[] NOT NULL,
    transition_type                    VARCHAR(32) NOT NULL,
    effective_at                       TIMESTAMPTZ NOT NULL,
    recorded_at                        TIMESTAMPTZ NOT NULL,
    created_at                         TIMESTAMPTZ NOT NULL,
    CONSTRAINT uq_achievement_progress_transition_version
        UNIQUE (character_achievement_id, resulting_aggregate_version),
    CONSTRAINT ck_achievement_progress_transition_type CHECK (
        transition_type IN (
            'TRACKING_STARTED', 'PROGRESS_APPLIED', 'PROGRESS_CORRECTED',
            'VERSION_MIGRATED', 'ROOT_COMPLETED'
        )
    )
);
```

### `achievement_unlock`

```sql
CREATE TABLE achievement_unlock (
    achievement_unlock_id              UUID PRIMARY KEY,
    character_achievement_id           UUID NOT NULL UNIQUE
        REFERENCES character_achievement(character_achievement_id),
    character_id                       UUID NOT NULL,
    achievement_edition_id             UUID NOT NULL,
    achievement_definition_version_id  UUID NOT NULL,
    definition_fingerprint             BYTEA NOT NULL,
    unlock_operation_id                UUID NOT NULL UNIQUE
        REFERENCES achievement_evaluation_operation(evaluation_operation_id),
    root_source_event_id               UUID NULL,
    evidence_frontier                  JSONB NOT NULL,
    evidence_set_hash                  BYTEA NOT NULL,
    unlocked_at                        TIMESTAMPTZ NOT NULL,
    recorded_at                        TIMESTAMPTZ NOT NULL,
    time_basis                         VARCHAR(32) NOT NULL,
    initial_recognition_state          VARCHAR(32) NOT NULL DEFAULT 'VALID',
    created_at                         TIMESTAMPTZ NOT NULL,
    CONSTRAINT uq_achievement_unlock_character_edition
        UNIQUE (character_id, achievement_edition_id),
    CONSTRAINT ck_achievement_unlock_time_basis CHECK (
        time_basis IN (
            'EVENT_OCCURRED_AT', 'SOURCE_SEQUENCE_TIME',
            'ENGINE_RECORDED_AT', 'CALENDAR_POLICY_TIME',
            'EVALUATED_AT'
        )
    ),
    CONSTRAINT ck_achievement_unlock_initial_recognition CHECK (
        initial_recognition_state = 'VALID'
    )
);

ALTER TABLE character_achievement
    ADD CONSTRAINT fk_character_achievement_unlock
    FOREIGN KEY (achievement_unlock_id)
    REFERENCES achievement_unlock(achievement_unlock_id);

CREATE INDEX ix_achievement_unlock_character_time
    ON achievement_unlock(character_id, unlocked_at DESC, achievement_unlock_id DESC);

CREATE INDEX ix_achievement_unlock_edition_time
    ON achievement_unlock(achievement_edition_id, unlocked_at DESC);
```

Updates and deletes on `achievement_unlock` MUST be prohibited for application roles.

### `achievement_integrity_case`

```sql
CREATE TABLE achievement_integrity_case (
    integrity_case_id                   UUID PRIMARY KEY,
    achievement_unlock_id               UUID NOT NULL
        REFERENCES achievement_unlock(achievement_unlock_id),
    status                              VARCHAR(32) NOT NULL,
    opened_reason_code                  VARCHAR(128) NOT NULL,
    opened_by_actor_type                VARCHAR(32) NOT NULL,
    opened_by_actor_id                  UUID NULL,
    decision_reason_code                VARCHAR(128) NULL,
    decision_evidence                   JSONB NULL,
    decided_by_actor_type               VARCHAR(32) NULL,
    decided_by_actor_id                 UUID NULL,
    opened_at                          TIMESTAMPTZ NOT NULL,
    decided_at                         TIMESTAMPTZ NULL,
    closed_at                          TIMESTAMPTZ NULL,
    created_at                         TIMESTAMPTZ NOT NULL,
    updated_at                         TIMESTAMPTZ NOT NULL,
    CONSTRAINT ck_achievement_integrity_case_status CHECK (
        status IN (
            'OPEN', 'INVESTIGATING', 'DECISION_PENDING',
            'RESOLVED_VALID', 'RESOLVED_INVALID', 'CLOSED_NO_ACTION'
        )
    )
);

CREATE INDEX ix_achievement_integrity_case_status
    ON achievement_integrity_case(status, opened_at);
```

### `achievement_integrity_transition`

```sql
CREATE TABLE achievement_integrity_transition (
    integrity_transition_id             UUID PRIMARY KEY,
    integrity_case_id                   UUID NOT NULL
        REFERENCES achievement_integrity_case(integrity_case_id),
    character_achievement_id            UUID NOT NULL
        REFERENCES character_achievement(character_achievement_id),
    achievement_unlock_id               UUID NOT NULL
        REFERENCES achievement_unlock(achievement_unlock_id),
    prior_recognition_state              VARCHAR(32) NOT NULL,
    resulting_recognition_state          VARCHAR(32) NOT NULL,
    safe_reason_code                     VARCHAR(128) NOT NULL,
    restricted_reason_code               VARCHAR(128) NULL,
    actor_type                           VARCHAR(32) NOT NULL,
    actor_id                             UUID NULL,
    effective_at                        TIMESTAMPTZ NOT NULL,
    recorded_at                         TIMESTAMPTZ NOT NULL,
    resulting_aggregate_version          BIGINT NOT NULL,
    created_at                          TIMESTAMPTZ NOT NULL,
    CONSTRAINT uq_achievement_integrity_transition_version
        UNIQUE (character_achievement_id, resulting_aggregate_version),
    CONSTRAINT ck_achievement_integrity_states CHECK (
        prior_recognition_state IN ('VALID', 'CONTESTED', 'INVALIDATED') AND
        resulting_recognition_state IN ('VALID', 'CONTESTED', 'INVALIDATED')
    )
);
```

### `achievement_event_inbox`

```sql
CREATE TABLE achievement_event_inbox (
    consumer_name                       VARCHAR(128) NOT NULL,
    event_id                            UUID NOT NULL,
    event_type                          VARCHAR(192) NOT NULL,
    schema_version                      INTEGER NOT NULL,
    producer                            VARCHAR(128) NOT NULL,
    character_id                       UUID NULL,
    payload_hash                       BYTEA NOT NULL,
    received_at                        TIMESTAMPTZ NOT NULL,
    status                             VARCHAR(32) NOT NULL,
    target_count                        INTEGER NOT NULL DEFAULT 0,
    completed_target_count              INTEGER NOT NULL DEFAULT 0,
    error_code                         VARCHAR(128) NULL,
    completed_at                       TIMESTAMPTZ NULL,
    PRIMARY KEY (consumer_name, event_id),
    CONSTRAINT ck_achievement_inbox_status CHECK (
        status IN (
            'RECEIVED', 'VALIDATED', 'FANOUT_CREATED',
            'COMPLETED', 'PARTIAL', 'QUARANTINED', 'REJECTED'
        )
    )
);

CREATE INDEX ix_achievement_inbox_status
    ON achievement_event_inbox(status, received_at);
```

### `achievement_event_fanout`

```sql
CREATE TABLE achievement_event_fanout (
    event_id                            UUID NOT NULL,
    character_id                       UUID NOT NULL,
    achievement_edition_id             UUID NOT NULL,
    evaluation_operation_id            UUID NOT NULL UNIQUE,
    status                             VARCHAR(32) NOT NULL,
    attempt_count                      INTEGER NOT NULL DEFAULT 0,
    next_attempt_at                    TIMESTAMPTZ NULL,
    last_error_code                    VARCHAR(128) NULL,
    updated_at                         TIMESTAMPTZ NOT NULL,
    PRIMARY KEY (event_id, character_id, achievement_edition_id)
);

CREATE INDEX ix_achievement_event_fanout_retry
    ON achievement_event_fanout(status, next_attempt_at)
    WHERE status IN ('READY', 'FAILED_TRANSIENT', 'HELD');
```

### `achievement_outbox`

```sql
CREATE TABLE achievement_outbox (
    outbox_id                           UUID PRIMARY KEY,
    aggregate_type                      VARCHAR(64) NOT NULL,
    aggregate_id                        UUID NOT NULL,
    aggregate_version                   BIGINT NOT NULL,
    event_id                            UUID NOT NULL UNIQUE,
    event_type                          VARCHAR(192) NOT NULL,
    partition_key                       VARCHAR(192) NOT NULL,
    payload                             JSONB NOT NULL,
    headers                             JSONB NOT NULL,
    sequence_in_transaction             INTEGER NOT NULL,
    created_at                          TIMESTAMPTZ NOT NULL,
    published_at                        TIMESTAMPTZ NULL,
    publish_attempt_count               INTEGER NOT NULL DEFAULT 0,
    next_publish_at                     TIMESTAMPTZ NULL,
    last_error_code                     VARCHAR(128) NULL,
    CONSTRAINT uq_achievement_outbox_aggregate_sequence
        UNIQUE (aggregate_id, aggregate_version, sequence_in_transaction)
);

CREATE INDEX ix_achievement_outbox_unpublished
    ON achievement_outbox(created_at, outbox_id)
    WHERE published_at IS NULL;
```

### `achievement_backfill_job`

```sql
CREATE TABLE achievement_backfill_job (
    backfill_job_id                     UUID PRIMARY KEY,
    achievement_definition_version_id  UUID NOT NULL,
    achievement_edition_id             UUID NOT NULL,
    status                             VARCHAR(32) NOT NULL,
    scope                              JSONB NOT NULL,
    source_manifest                    JSONB NOT NULL,
    source_from                        TIMESTAMPTZ NULL,
    source_to                          TIMESTAMPTZ NULL,
    dry_run                            BOOLEAN NOT NULL,
    rate_limit_per_second              INTEGER NOT NULL,
    batch_size                         INTEGER NOT NULL,
    checkpoint                         JSONB NOT NULL DEFAULT '{}'::jsonb,
    expected_character_count           BIGINT NULL,
    processed_character_count          BIGINT NOT NULL DEFAULT 0,
    mutation_count                     BIGINT NOT NULL DEFAULT 0,
    unlock_count                       BIGINT NOT NULL DEFAULT 0,
    duplicate_count                    BIGINT NOT NULL DEFAULT 0,
    error_count                        BIGINT NOT NULL DEFAULT 0,
    created_by_actor_type              VARCHAR(32) NOT NULL,
    created_by_actor_id                UUID NULL,
    approved_at                        TIMESTAMPTZ NULL,
    started_at                         TIMESTAMPTZ NULL,
    completed_at                       TIMESTAMPTZ NULL,
    created_at                         TIMESTAMPTZ NOT NULL,
    updated_at                         TIMESTAMPTZ NOT NULL,
    CONSTRAINT ck_achievement_backfill_status CHECK (
        status IN (
            'DRAFT', 'VALIDATED', 'APPROVED', 'QUEUED', 'RUNNING',
            'PAUSED', 'CANCELLING', 'CANCELLED', 'COMPLETED',
            'COMPLETED_WITH_ERRORS', 'FAILED_TO_START'
        )
    ),
    CONSTRAINT ck_achievement_backfill_limits CHECK (
        rate_limit_per_second > 0 AND batch_size > 0
    )
);
```

### `achievement_backfill_item`

```sql
CREATE TABLE achievement_backfill_item (
    backfill_job_id                     UUID NOT NULL
        REFERENCES achievement_backfill_job(backfill_job_id),
    item_key                            VARCHAR(256) NOT NULL,
    character_id                       UUID NOT NULL,
    status                             VARCHAR(32) NOT NULL,
    operation_manifest                 JSONB NOT NULL,
    attempt_count                      INTEGER NOT NULL DEFAULT 0,
    last_error_code                    VARCHAR(128) NULL,
    started_at                         TIMESTAMPTZ NULL,
    completed_at                       TIMESTAMPTZ NULL,
    updated_at                         TIMESTAMPTZ NOT NULL,
    PRIMARY KEY (backfill_job_id, item_key)
);

CREATE INDEX ix_achievement_backfill_item_status
    ON achievement_backfill_item(backfill_job_id, status, item_key);
```

### `achievement_operation_idempotency`

```sql
CREATE TABLE achievement_operation_idempotency (
    idempotency_scope                   VARCHAR(128) NOT NULL,
    idempotency_key                     VARCHAR(256) NOT NULL,
    request_hash                        BYTEA NOT NULL,
    operation_type                     VARCHAR(128) NOT NULL,
    resource_id                        UUID NULL,
    result_status                      VARCHAR(64) NOT NULL,
    result_payload                     JSONB NOT NULL,
    created_at                         TIMESTAMPTZ NOT NULL,
    expires_at                         TIMESTAMPTZ NULL,
    PRIMARY KEY (idempotency_scope, idempotency_key)
);
```

Idempotency retention MUST exceed the maximum retry and replay window for the operation class.

### `achievement_audit_log`

```sql
CREATE TABLE achievement_audit_log (
    audit_id                            UUID PRIMARY KEY,
    occurred_at                        TIMESTAMPTZ NOT NULL,
    actor_type                         VARCHAR(32) NOT NULL,
    actor_id                           UUID NULL,
    service_identity                   VARCHAR(128) NULL,
    action_key                         VARCHAR(192) NOT NULL,
    resource_type                      VARCHAR(64) NOT NULL,
    resource_id                        UUID NULL,
    character_id                       UUID NULL,
    namespace                          VARCHAR(128) NULL,
    reason_code                        VARCHAR(128) NULL,
    correlation_id                     UUID NOT NULL,
    request_id                         VARCHAR(128) NULL,
    prior_state_hash                   BYTEA NULL,
    resulting_state_hash               BYTEA NULL,
    details                            JSONB NOT NULL,
    data_classification                VARCHAR(32) NOT NULL,
    created_at                         TIMESTAMPTZ NOT NULL
);

CREATE INDEX ix_achievement_audit_resource_time
    ON achievement_audit_log(resource_type, resource_id, occurred_at DESC);

CREATE INDEX ix_achievement_audit_character_time
    ON achievement_audit_log(character_id, occurred_at DESC)
    WHERE character_id IS NOT NULL;
```

Audit storage SHOULD be append-only and exported to tamper-evident archival infrastructure.

### Projection tables

Implementations MAY maintain tables such as:

- `achievement_owner_catalog_projection`;
- `achievement_public_profile_projection`;
- `achievement_character_summary_projection`;
- `achievement_catalog_projection`;
- `achievement_recent_unlock_projection`;
- `achievement_definition_analytics_projection`;
- `achievement_projection_checkpoint`.

Projection tables MUST include source versions and privacy policy versions and MUST be rebuildable.

### Referential integrity and Engine boundaries

The reference schema does not declare a foreign key from `character_id` to a Character Engine database. Cross-service ownership is enforced through Events and local projections, not cross-database foreign keys.

### Immutability controls

The following rows are append-only after commit:

- published Definition normative content;
- evidence;
- progress transitions;
- unlocks;
- integrity transitions;
- completed evaluation operations;
- published outbox payloads;
- audit entries.

Corrections append new rows and update only current summary state where required.

### Retention and partitioning

Recommended partition candidates:

- evidence by month and realm;
- evaluation operations by month;
- inbox by received month;
- outbox by created month after publication retention;
- audit by month and classification;
- progress transitions by month.

Partition removal MUST respect legal hold, support, replay, unlock explanation, and privacy policy.

### Database authorization

Use distinct database roles for:

- runtime evaluator;
- outbox publisher;
- projection writer;
- control-plane authoring;
- migration worker;
- privacy workflow;
- read-only support;
- restricted integrity reviewer.

No application role receives unrestricted superuser or direct delete access.


---

## API Specification

The API is divided into owner/public reads, trusted internal reads, control-plane authoring, administration, and asynchronous job control.

The Event bus remains the primary runtime mutation interface.

### API conventions

- Base path: `/v1`.
- JSON request and response bodies use camelCase.
- UUIDs are opaque strings.
- Timestamps are RFC 3339 UTC.
- Exact numeric values are transported as strings when precision may exceed safe client integer ranges.
- List endpoints use opaque cursor pagination.
- Write endpoints require `Idempotency-Key` unless explicitly read-only.
- Concurrent Draft and policy updates require `If-Match` or expected version.
- Responses include `correlationId`.
- Errors use stable machine-readable codes and safe messages.
- Authorization is evaluated server-side for every request.
- Public existence behavior MUST not leak secret Achievements.

### Owner APIs

#### `GET /v1/characters/{characterId}/achievements`

Returns the owner-visible catalog and Character state.

Query parameters:

- `state`;
- `category`;
- `namespace`;
- `edition`;
- `seasonId`;
- `includeRetired`;
- `sort`;
- `cursor`;
- `limit`.

Example response:

```json
{
  "characterId": "62bf5446-cbf4-47ec-8563-ef6d13bbfdb7",
  "items": [
    {
      "achievementEditionId": "79f84209-4e6d-47e2-8747-b7f2056fd66e",
      "achievementKey": "consistency.apprentice",
      "state": "TRACKING",
      "recognitionState": null,
      "categoryKey": "consistency",
      "rarityKey": "rare",
      "presentation": {
        "nameKey": "achievement.school.consistency.apprentice.name",
        "descriptionKey": "achievement.school.consistency.apprentice.description",
        "iconAssetId": "asset-id"
      },
      "progress": {
        "mode": "EXACT",
        "current": "7",
        "target": "10",
        "complete": false,
        "percentBasisPoints": 7000
      },
      "firstTrackedAt": "2026-06-01T10:00:00Z",
      "lastChangedAt": "2026-07-18T10:15:00Z",
      "aggregateVersion": 7
    }
  ],
  "nextCursor": null,
  "projection": {
    "projectedAt": "2026-07-18T10:15:00.400Z",
    "freshness": "CURRENT"
  },
  "correlationId": "uuid"
}
```

Owner authorization is required. Delegated access follows Character Engine policy.

#### `GET /v1/characters/{characterId}/achievements/{achievementEditionId}`

Returns owner-visible detail for one Edition.

For a secret Achievement before unlock, the response follows secrecy policy:

- `404` indistinguishable from unknown;
- generic secret placeholder;
- visible name with hidden criteria;
- visible criteria with hidden progress.

The selected policy is Definition data and is enforced server-side.

#### `GET /v1/characters/{characterId}/achievements/recent`

Returns recent owner-visible unlocks with cursor pagination.

#### `GET /v1/characters/{characterId}/achievements/summary`

Returns compact count and showcase-compatible summary.

### Public APIs

#### `GET /v1/public/characters/{characterId}/achievements`

Returns only public valid unlocked Achievements permitted by Character and Achievement policy.

The endpoint MUST:

- suppress contested and invalidated recognition;
- apply Character lifecycle and visibility;
- honor showcase and discoverability policy;
- avoid revealing hidden total counts;
- rate limit scraping;
- return generic not-found behavior for private Characters.

#### `GET /v1/public/achievements/catalog`

Returns public catalog metadata for non-secret or intentionally teased Achievements.

#### `GET /v1/public/achievements/{achievementEditionId}`

Returns public Definition presentation only when policy permits.

### Internal read APIs

#### `GET /v1/internal/characters/{characterId}/achievements/summary`

For approved platform consumers such as Character profile composition.

Requires service identity and audience scope.

#### `GET /v1/internal/characters/{characterId}/achievements/{achievementEditionId}/status`

Returns exact authoritative or near-authoritative status for trusted decision support.

Other Engines SHOULD prefer consumed Events or local projections for critical paths. This API is not a substitute for Event-driven integration.

#### `POST /v1/internal/achievement-unlocks:batchResolve`

Resolves a bounded list of `(characterId, achievementEditionId)` pairs for repair or migration tooling.

Strict limit, authorization, and audit apply.

### Definition authoring APIs

#### `POST /v1/admin/achievement-definitions`

Creates a Definition and initial Draft.

#### `POST /v1/admin/achievement-definitions/{definitionId}/versions`

Creates a new Draft Version.

#### `GET /v1/admin/achievement-definitions/{definitionId}`

Returns control-plane detail and Version list.

#### `GET /v1/admin/achievement-definition-versions/{versionId}`

Returns one Version including authored graph, compiled plan, validation, approvals, and activation state according to authorization.

#### `PATCH /v1/admin/achievement-definition-versions/{versionId}`

Updates a Draft.

Requires:

- `If-Match` with draft revision;
- `Idempotency-Key`;
- authoring scope for namespace.

#### `POST /v1/admin/achievement-definition-versions/{versionId}:validate`

Runs validation and returns structured findings.

Response categories:

- errors blocking publication;
- warnings requiring acknowledgement;
- informational findings;
- estimated subscriptions and state cost;
- privacy classification;
- cycle analysis;
- backfill estimate.

#### `POST /v1/admin/achievement-definition-versions/{versionId}:simulate`

Evaluates immutable fixtures or an approved sampled dataset in a non-mutating environment.

Simulation response includes:

- plan fingerprint;
- per-fixture node trace;
- expected progress and unlock;
- duplicates and ordering behavior;
- correction behavior;
- cascade analysis;
- performance estimate.

Simulation MUST NOT write Character Achievement state or publish unlock Events.

#### `POST /v1/admin/achievement-definition-versions/{versionId}:submit`

Submits for review.

#### `POST /v1/admin/achievement-definition-versions/{versionId}:approve`

Records approval of exact content hash.

#### `POST /v1/admin/achievement-definition-versions/{versionId}:reject`

Records rejection and findings.

#### `POST /v1/admin/achievement-definition-versions/{versionId}:publish`

Publishes immutable Version.

#### `POST /v1/admin/achievement-definition-versions/{versionId}/activations`

Schedules activation.

#### `POST /v1/admin/achievement-activations/{activationId}:pause`

Pauses routing with handling policy.

#### `POST /v1/admin/achievement-activations/{activationId}:resume`

Resumes routing.

#### `POST /v1/admin/achievement-activations/{activationId}:retire`

Retires activation.

### Backfill APIs

#### `POST /v1/admin/achievement-backfills`

Creates a Draft Backfill Job.

#### `POST /v1/admin/achievement-backfills/{jobId}:validate`

Validates source availability, cost, privacy, and idempotency.

#### `POST /v1/admin/achievement-backfills/{jobId}:approve`

Approves the exact job manifest.

#### `POST /v1/admin/achievement-backfills/{jobId}:start`

Starts asynchronous work.

#### `POST /v1/admin/achievement-backfills/{jobId}:pause`

Pauses after current bounded transactions.

#### `POST /v1/admin/achievement-backfills/{jobId}:resume`

Resumes from checkpoint.

#### `POST /v1/admin/achievement-backfills/{jobId}:cancel`

Stops future work.

#### `GET /v1/admin/achievement-backfills/{jobId}`

Returns progress, checkpoint, counts, errors, rate, estimated completion range, and manifest fingerprint.

### Character administration APIs

#### `GET /v1/admin/characters/{characterId}/achievements`

Returns support inspection projection.

#### `GET /v1/admin/character-achievements/{characterAchievementId}/explanation`

Returns an evaluation explanation:

- Definition and fingerprint;
- current node state;
- selected evidence;
- source contract versions;
- lifecycle gate decisions;
- operation history;
- unlock frontier;
- integrity history;
- projection lag.

Sensitive evidence requires elevated scope and generates a separate audit record.

#### `POST /v1/admin/character-achievements/{id}:recompute-dry-run`

Calculates a non-mutating diff from retained evidence.

#### `POST /v1/admin/character-achievements/{id}:recompute`

Applies an approved repair using the dry-run manifest hash.

#### `POST /v1/admin/character-achievements/{id}:freeze`

Freezes processing with reason and handling policy.

#### `POST /v1/admin/character-achievements/{id}:unfreeze`

Resumes processing and selects buffered Event handling.

### Integrity APIs

#### `POST /v1/admin/achievement-unlocks/{unlockId}/integrity-cases`

Opens a case.

#### `POST /v1/admin/achievement-integrity-cases/{caseId}:contest`

Moves valid recognition to contested when not already done.

#### `POST /v1/admin/achievement-integrity-cases/{caseId}:invalidate`

Invalidates recognition.

Requires reason, evidence manifest, expected Aggregate version, and approval tokens where policy requires.

#### `POST /v1/admin/achievement-integrity-cases/{caseId}:restore`

Restores valid recognition.

#### `POST /v1/admin/achievement-integrity-cases/{caseId}:close-no-action`

Closes without state change.

### Operational APIs

- `GET /health/live`;
- `GET /health/ready`;
- `GET /health/dependencies` for restricted operations;
- `GET /v1/admin/achievement-quarantine`;
- `POST /v1/admin/achievement-quarantine/{itemId}:retry`;
- `POST /v1/admin/achievement-quarantine/{itemId}:discard` with reason and approval;
- `POST /v1/admin/achievement-producers/{producer}:quarantine`;
- `POST /v1/admin/achievement-projections:rebuild`;
- `POST /v1/admin/achievement-reconciliation:run`.

### HTTP status behavior

- `200 OK`: successful read or idempotent existing result.
- `201 Created`: new Definition, Version, Job, or Case.
- `202 Accepted`: asynchronous command accepted.
- `204 No Content`: successful state command without response body where appropriate.
- `400 Bad Request`: malformed request.
- `401 Unauthorized`: missing or invalid authentication.
- `403 Forbidden`: authenticated but not authorized.
- `404 Not Found`: absent or intentionally concealed resource.
- `409 Conflict`: state, activation overlap, or idempotency conflict.
- `412 Precondition Failed`: expected version mismatch.
- `422 Unprocessable Entity`: valid JSON but Definition or command validation failed.
- `429 Too Many Requests`: rate or workload limit.
- `503 Service Unavailable`: safe transient dependency or capacity failure.

### Error response

```json
{
  "error": {
    "code": "ACHIEVEMENT_DEFINITION_VALIDATION_FAILED",
    "message": "The Achievement Definition cannot be published.",
    "details": [
      {
        "path": "/conditionGraph/nodes/4/threshold",
        "code": "VALUE_OUT_OF_RANGE"
      }
    ]
  },
  "correlationId": "uuid"
}
```

Secret names, hidden Conditions, internal evidence, and fraud reasons MUST NOT appear in unauthorized errors.

### Rate and size limits

Initial configurable limits:

- public list page: 100 items;
- owner list page: 200 items;
- admin list page: 200 items;
- batch resolve: 500 pairs;
- Draft document: 1 MiB canonical JSON;
- Condition nodes: 256 per Version;
- Condition graph depth: 16;
- source subscriptions: 128 per Version;
- constant set entries per predicate: 1,000;
- simulation fixtures: 10,000 per request or asynchronous job;
- API idempotency key: 256 characters;
- free-text review comment: 8,000 Unicode scalar values.

Limits may evolve through versioned platform policy.

---

## Admin Features

Administration is part of the product specification, not an afterthought. Unsafe or opaque authoring tools will produce unsafe runtime behavior.

### Definition workspace

The workspace MUST provide:

- namespace and Edition identity;
- category, rarity, secrecy, and progress policy;
- visual Condition Graph editor and canonical JSON view;
- Event schema browser with field types and privacy classifications;
- typed predicate builder;
- dependency selector;
- calendar policy editor;
- presentation and localization keys;
- retroactivity and migration policy;
- evidence retention preview;
- validation and compilation status;
- immutable content hash.

The UI MUST make it difficult to confuse an Achievement Edition with a repeatable Reward or Quest.

### Validation console

Validation findings include:

- graph cycles;
- unreachable nodes;
- unsupported type conversions;
- unknown Event fields;
- incompatible schema versions;
- unauthorized producers;
- missing correction semantics;
- unbounded distinct cardinality;
- ambiguous calendar timezone;
- secret metadata leakage;
- activation overlap;
- Achievement dependency cycles;
- Reward causal cycle risk;
- estimated Event amplification;
- privacy retention conflicts;
- migration incompatibility;
- missing localization keys;
- inaccessible media references;
- performance limit violations.

### Simulation laboratory

Authors MUST be able to:

- run positive and negative fixtures;
- deliver duplicates;
- reorder Events;
- inject late Events;
- apply source corrections;
- simulate Character suspension;
- replay the same history;
- compare old and new Versions;
- inspect every node transition;
- verify secret output filtering;
- measure expected state rows and execution time;
- simulate meta-Achievement cascades;
- verify no duplicate unlock.

### Definition diff

The review UI highlights semantic changes, not only JSON text changes:

- threshold changes;
- source Event additions or removals;
- predicate changes;
- node type changes;
- dependency changes;
- visibility and secrecy changes;
- retroactivity expansion;
- calendar policy changes;
- evidence retention changes;
- rollout scope changes;
- migration requirement.

### Approval workflow

Governance policy may require approval from:

- product owner;
- platform engineer;
- game designer;
- security reviewer;
- privacy reviewer;
- Module owner;
- LiveOps operator.

The required set is data-driven by risk classification. Approvals reference exact content hash and expire on content change.

### Activation console

Operators can:

- schedule activation;
- choose realm or cohort scope;
- preview overlap;
- select live and retroactive behavior;
- configure rollout percentage when supported;
- observe Event and mutation rate;
- pause and resume;
- retire;
- compare active fingerprint across regions.

A rollout percentage MUST use stable Character bucketing and MUST NOT move Characters between Versions unpredictably.

### Backfill console

Displays:

- source history availability;
- estimated Character and Event count;
- dry-run unlock estimate;
- rate limits;
- live workload protection;
- current checkpoint;
- mutation and duplicate counts;
- errors and quarantine samples;
- pause, resume, and cancel controls;
- immutable result manifest.

### Character support view

Support can inspect:

- owner-safe state;
- exact Aggregate status;
- Definition Version;
- progress and node summaries;
- recent evaluation operations;
- projection lag;
- unlock and integrity history;
- related Reward correlation if available;
- safe remediation actions.

Raw sensitive evidence requires a higher role and an access reason.

### Integrity case management

The case UI supports:

- evidence collection;
- source-owner consultation;
- public suppression preview;
- downstream impact list;
- dual approval;
- invalidation or restoration decision;
- safe owner communication key;
- closure and retention.

The UI MUST never present “delete Achievement” as an action.

### Quarantine console

Quarantined items are grouped by:

- producer;
- Event type and version;
- Definition Version;
- error code;
- realm;
- age;
- impact count.

Operators can retry only after the underlying issue is understood or corrected. Discard requires reason, authorization, and audit.

### Reconciliation console

Provides:

- Aggregate versus node-state hash mismatch;
- unlock without outbox Event;
- outbox Event without projection;
- missing Definition fingerprint;
- duplicate source identity anomaly;
- stale Character lifecycle projection;
- dependency graph drift;
- secret cache exposure check;
- repair plan and dry-run diff.

### Emergency controls

Authorized incident commanders may:

- pause one Definition;
- quarantine one producer;
- disable progress Event publication while preserving state;
- suppress public Achievement output globally or by scope;
- stop backfills;
- reduce worker concurrency;
- force cache purge;
- enter read-only control-plane mode.

Emergency actions expire automatically where possible and are fully audited.

### Forbidden admin features

Admin tools MUST NOT provide:

- unrestricted direct unlock;
- editing published Definitions;
- changing unlock timestamps;
- deleting evidence or integrity history;
- arbitrary SQL console;
- bypass of Character lifecycle policy;
- public reveal of secret metadata without Version change and approval;
- synchronous cross-Engine Reward mutation;
- unaudited bulk import.

---

## UX Requirements

The Achievement Engine owns UX contracts and semantic data, not rendering.

### Meaning before badge count

An Achievement should communicate a meaningful milestone. Clients SHOULD present:

- what was accomplished;
- why it matters in the product narrative;
- when it was achieved;
- how it relates to the Character’s journey;
- progress toward visible future milestones where appropriate.

The platform SHOULD avoid overwhelming users with trivial Achievements whose only purpose is notification volume.

### Locked Achievement presentation

For a normal visible Achievement, the client may show:

- name and description;
- icon or locked icon;
- category and rarity;
- exact or summarized Conditions;
- progress according to server policy;
- availability or retirement state.

For secret Achievements, the server response determines whether the client shows nothing, a generic placeholder, or partial teaser metadata.

### Unlock presentation

`achievement.unlocked.v1` and owner projections provide:

- stable unlock id for deduplication;
- presentation keys;
- icon or media reference;
- category and rarity;
- unlock and recording times;
- source-safe narrative context;
- celebration intensity key;
- whether the unlock came from backfill.

Clients MUST deduplicate celebration by `achievementUnlockId`.

A replay, projection rebuild, or repeated Event MUST NOT cause repeated celebration.

### Backfilled unlocks

A historical unlock recognized during backfill SHOULD be presented differently from a live moment when appropriate.

The API exposes:

- `unlockedAt`;
- `recordedAt`;
- `timeBasis`;
- optional `recognizedRetroactively` flag.

The UI MUST NOT imply that the user completed the action at the backfill processing time when historical evidence provides an earlier time.

### Progress display

Clients use the server-provided mode.

#### Exact

Show `current / target` using exact values.

#### Percent

Use integer basis points or provided numerator and denominator. Do not calculate from rounded display strings.

#### Steps

Show named steps and completion state without exposing hidden nodes.

#### Boolean

Show complete or incomplete only.

#### Hidden

Show no progress. The client MUST not infer it from Event activity.

#### Composite summary

Render the provided summary. The client MUST not reconstruct hidden graph logic.

### Multi-node progress

When an Achievement has several visible Conditions, the API may return:

- child labels;
- completion flags;
- exact values;
- ordering;
- optional weight;
- overall completion.

Hidden or security-sensitive nodes are omitted. Omission does not imply nonexistence.

### Secret Achievement reveal

At unlock, the secrecy policy declares:

- reveal full name and criteria;
- reveal name but retain source details;
- reveal only a narrative summary;
- remain private to owner;
- remain hidden from public profile.

The UI must not cache pre-unlock placeholders under the same public cache key as revealed content without invalidation.

### Contested and invalidated recognition

Owner-facing UX uses safe language such as:

- “This Achievement is under review.”
- “This Achievement is no longer shown as verified.”

It MUST NOT expose fraud detection methods, reporter identity, internal evidence, or operator notes.

Invalidation is not displayed as “you never earned this” when history shows an unlock. The UI may show it in private history as invalidated according to policy.

### Retired Achievements

Unlocked retired Achievements remain in history unless privacy or integrity policy suppresses them.

Incomplete retired Achievements follow Definition display policy and SHOULD clearly indicate that new progress is unavailable.

### Version changes

A migration that changes visible progress MUST provide a safe presentation reason and avoid showing progress moving without explanation.

The UI SHOULD not expose internal Definition Version numbers to ordinary users, but support views may.

### Eventual consistency

After a source action, Achievement progress may update asynchronously.

Clients MUST NOT repeatedly resubmit the business action because Achievement projection has not changed.

Where source products need immediate feedback, they may display a non-authoritative “processing” receipt tied to the source correlation id. Only Achievement Engine output confirms progress or unlock.

### Accessibility

Achievement UX contracts MUST support:

- text alternatives for icons;
- no reliance on color alone;
- reduced motion celebration;
- screen-reader descriptions of progress;
- keyboard navigation;
- sufficient contrast metadata or asset standards;
- locale-aware number and date formatting;
- bidirectional text;
- avoiding time-only animations for critical information.

### Localization

The Engine stores localization keys, not final localized prose.

Definition publication SHOULD verify required locale fallback keys.

Missing non-default localization must not change evaluation. Missing default presentation may block publication according to governance policy.

### Time display

The API returns UTC instants. Clients localize display.

For calendar streaks, the UI SHOULD disclose the policy timezone when relevant to user understanding.

### Rarity display

Configured rarity and observed rarity MUST be labeled distinctly.

Observed unlock percentage may be delayed, cohort-specific, or privacy-thresholded. It is never used as the configured rarity source unless an explicit content pipeline copies a reviewed value into a new Definition Version.

### Profile showcase

Selection of Achievements for profile showcase belongs to Character Engine presentation slots.

The Achievement Engine supplies eligible valid unlock references. It does not own slot ordering or equip state.

### Notification fatigue

Progress Events SHOULD be emitted at meaningful thresholds rather than every increment when user-facing consumers subscribe.

Unlock notifications are handled downstream and respect communication policy.

### Narrative keys

Definitions MAY provide:

- `journeyChapterKey`;
- `milestoneNarrativeKey`;
- `celebrationKey`;
- `progressEncouragementKeys` by threshold;
- `retirementNarrativeKey`.

These are presentation semantics and cannot alter Condition evaluation.

---

## Security

Achievement state has reputational, social, and potentially economic value. Unauthorized unlocks, hidden-condition leakage, Definition tampering, or duplicate Reward triggers can damage user trust and platform integrity.

### Security objectives

The Engine MUST protect:

- Definition authoring and activation;
- progress and unlock integrity;
- secret Achievement metadata;
- evidence confidentiality;
- Character and tenant isolation;
- Event producer authenticity;
- administrative and integrity actions;
- audit trail integrity;
- downstream Event authenticity;
- availability under abusive Event load.

### Threat model

Relevant threats include:

- forged source Events;
- compromised Module producer;
- replay and duplicate storms;
- Event id collision or reuse;
- payload tampering;
- Condition injection;
- malicious or catastrophic Definition;
- causal Reward loops;
- secret Achievement enumeration;
- cross-tenant access;
- operator privilege abuse;
- unauthorized manual unlock;
- evidence exfiltration;
- backfill amplification;
- hot-Character denial of service;
- projection cache leakage;
- supply-chain modification of compiled plans;
- database role escalation;
- audit deletion;
- timing side channels revealing secret Definitions.

### Authentication

- Event producers use mutually authenticated transport or signed workload identity.
- API principals use platform authentication.
- Service identity is verified independently of request body.
- Credentials are short-lived where supported.
- Anonymous writes are prohibited.

### Authorization

Authorization scopes SHOULD include:

- `achievements.read.owner`;
- `achievements.read.public`;
- `achievements.read.internal`;
- `achievements.definition.author`;
- `achievements.definition.review`;
- `achievements.definition.publish`;
- `achievements.activation.manage`;
- `achievements.backfill.manage`;
- `achievements.support.read`;
- `achievements.evidence.read.restricted`;
- `achievements.integrity.open`;
- `achievements.integrity.decide`;
- `achievements.operations.manage`;
- `achievements.privacy.manage`.

Scopes are further constrained by namespace, realm, tenant, and resource policy.

### Separation of duties

High-risk actions SHOULD require distinct principals:

- author and publisher;
- integrity investigator and final approver;
- backfill creator and approver;
- privacy requester and privacy executor where legal policy requires;
- emergency action initiator and reviewer.

Break-glass access is time-limited, reason-bound, alerted, and reviewed.

### Producer allowlisting

Every source subscription pins:

- Event type and compatible versions;
- producer identities or class;
- schema fingerprint;
- Character subject mapping;
- expected volume and size bounds;
- correction authority.

A valid Event type from an unauthorized producer is rejected.

### Payload integrity

The Engine verifies transport integrity and schema. Where Events cross lower-trust boundaries, detached signatures or broker-level immutable headers SHOULD be used.

The stored payload hash detects id reuse with changed content.

### Definition security

The publication pipeline prevents:

- code execution;
- unbounded recursion;
- unbounded regex;
- arbitrary network access;
- arbitrary topic publication;
- unknown field extraction;
- overflow and precision ambiguity;
- hidden cross-tenant selectors;
- unbounded distinct values;
- cycles and excessive cascade depth.

Compiled plans are signed or fingerprint-verified before runtime use.

### Secret Achievement protection

- Public APIs use policy-aware existence behavior.
- Secret metadata is stored in restricted projection fields or separate tables.
- Logs do not print secret names or Conditions for ordinary errors.
- Metrics use opaque ids.
- Search indexes exclude hidden content.
- Cache keys separate audience and secrecy state.
- Timing and response-size differences SHOULD be minimized for concealed not-found behavior.
- Client bundles MUST NOT contain secret criteria.

### Idempotency security

Idempotency keys are scoped to actor or producer and operation type. A different actor cannot use another namespace’s key to retrieve result data.

Request hashes prevent malicious key reuse with changed content.

### Tenant and realm isolation

- tenant and realm are derived from trusted identity or Event metadata;
- every Definition activation and Character evaluation includes scope;
- queries include scope filters;
- cross-tenant Character and Definition combinations are rejected without existence leakage;
- database row-level security MAY supplement application authorization;
- tests cover inference through ids, counts, errors, and cursors.

### Data encryption

- TLS is required in transit.
- Database and backups are encrypted at rest.
- highly sensitive evidence may use field-level envelope encryption.
- keyed hashes use managed rotating keys where reversibility is unnecessary.
- key rotation preserves evidence verification according to policy.

### Administrative action protection

High-risk commands require:

- fresh authentication;
- reason code;
- expected version;
- idempotency key;
- approval token where configured;
- audit record;
- alert for unusual volume.

### Rate limiting and abuse prevention

Limits apply by:

- public IP and authenticated principal;
- Character;
- producer;
- Event type;
- Definition namespace;
- tenant or realm;
- administration role;
- backfill job.

A compromised producer can be quarantined without stopping all Achievement evaluation.

### Supply-chain controls

- compiled plan artifacts are reproducible from canonical Definition content;
- build and deployment artifacts are signed;
- schema migrations are reviewed;
- dependency vulnerabilities are monitored;
- production Definition publication does not depend on untrusted client compilation.

### Logging security

Logs MUST NOT contain:

- full sensitive source payloads;
- secret Conditions in general logs;
- raw personal identifiers beyond approved fields;
- access tokens;
- private investigation notes;
- decrypted evidence values unless explicitly routed to restricted audit.

### Incident response

The Engine MUST support:

- producer quarantine;
- Definition pause;
- public suppression;
- cache purge;
- evidence access review;
- affected Character and unlock identification;
- replay and correction planning;
- downstream consumer notification;
- credential revocation;
- preservation of security evidence;
- post-incident reconciliation.

---

## Privacy

Achievement history may reveal education, fitness, purchase, community, behavioral, or social information. Privacy controls apply even when an Achievement appears harmless in isolation.

### Privacy principles

- purpose limitation;
- data minimization;
- audience separation;
- privacy by default;
- retention proportional to explanation needs;
- no public inference from hidden state;
- Character lifecycle propagation;
- regional and tenant isolation;
- auditable access;
- deletion and anonymization workflows.

### Data classification

Achievement data includes:

#### Public-capable

- public Achievement name and icon;
- valid unlock date at approved precision;
- category and rarity;
- public Character association when visibility permits.

#### Internal

- Definition Version id;
- progress values;
- source Event type;
- operation ids;
- projection status.

#### Sensitive

- detailed evidence;
- activity patterns;
- Module-specific identifiers;
- exact timestamps;
- support history;
- correction reasons.

#### Highly sensitive

- health-related source facts;
- minor-related data;
- fraud investigation evidence;
- protected educational or employment data;
- legal hold metadata.

### Evidence minimization

The compiler derives an evidence retention manifest listing only fields needed to:

- deduplicate;
- apply correction;
- explain progress;
- prove unlock;
- satisfy support or legal requirements.

Unused payload fields are not stored.

Where possible, store:

- keyed hash instead of plaintext identifier;
- category key instead of free text;
- date bucket instead of exact timestamp;
- aggregate reference instead of full payload;
- source archive pointer with access control instead of duplicate content.

### Public visibility

Public display requires all of:

- Character is public enough;
- Achievement policy permits public display;
- unlock Recognition State is `VALID`;
- secret policy permits reveal;
- owner showcase or discoverability policy permits it;
- Module or legal policy does not impose stricter restriction.

A public endpoint MUST not reveal how many hidden Achievements were omitted.

### Owner visibility

The owner normally sees their progress and unlock history, subject to:

- secret policy;
- ongoing sensitive integrity investigation;
- legal restriction;
- minor-safety policy;
- source-domain restrictions.

Restrictions require a safe user-facing explanation where legally and operationally appropriate.

### Character closure

On Character closure:

- live evaluation stops;
- public projections and feeds are suppressed;
- owner access follows Character Engine closure policy;
- caches and search entries are purged;
- retained history is protected for restoration, support, and legal obligations;
- no new Reward trigger is emitted from late Events unless an approved pre-closure repair policy permits it.

### Character restoration

On restoration:

- public visibility does not automatically return beyond current Character policy;
- valid unlock history may become visible again;
- held Events are replayed only according to explicit policy;
- projections are rebuilt from authoritative state;
- stale pre-closure caches are not reused.

### Character anonymization

On irreversible anonymization:

- direct owner relationship is removed from Achievement projections;
- public and owner views are suppressed;
- personal evidence is deleted, tokenized, or cryptographically erased according to field policy;
- source identifiers are minimized;
- minimum tombstones preserve idempotency and aggregate integrity;
- analytics use approved anonymous aggregation only;
- downstream erasure Events are published to projections and archives;
- Reward correlation containing personal context is handled by its owner.

The Engine MUST document a field-level erasure matrix.

### Data access export

A Character data export SHOULD include:

- visible Achievement catalog state;
- progress and unlock history;
- Definition presentation and versions relevant to the Character;
- safe evidence summaries;
- integrity state and user-facing reasons;
- processing timestamps;
- source categories where disclosure is permitted.

It MUST exclude:

- other Characters’ data;
- fraud detection methods;
- reporter identity;
- secret unrevealed Achievement criteria when policy or law permits withholding;
- internal security tokens;
- unrelated raw Module payloads.

### Retention

Retention is configured by data class:

- unlock records: long-lived or lifetime of Character plus legal retention;
- minimum Definition versions: as long as referenced;
- detailed evidence: shortest period compatible with correction and explanation;
- evaluation operations: operational retention then archive or aggregate;
- inbox and outbox: retry and audit retention;
- public projections: deleted promptly after visibility loss;
- audit: policy-defined tamper-evident retention;
- backfill manifests: long enough for reproducibility.

An unlock may remain after detailed evidence expires if an approved evidence-set hash and minimum proof record are sufficient.

### Legal hold

Legal hold suspends normal deletion for identified records while restricting access. Hold metadata is separated from ordinary user-facing data.

### Regional residency

- Character realm or residency is propagated from trusted projection;
- evidence storage and processing follow region policy;
- cross-region Definition metadata contains no unnecessary Character data;
- backfill source movement is reviewed;
- backups and disaster recovery respect residency;
- public global projections contain minimized fields.

### Analytics privacy

Achievement analytics MUST use:

- pseudonymous or aggregated identifiers;
- minimum cohort thresholds;
- purpose and retention controls;
- opt-out where required;
- deletion or anonymization propagation;
- no raw secret Achievement enumeration in broadly accessible datasets.

The analytics warehouse is not authoritative and cannot repair or unlock Achievements.

### Privacy-sensitive Definitions

Definitions using sensitive fields require elevated review and MAY be prohibited from:

- public display;
- broad progress Events;
- long evidence retention;
- cross-realm activation;
- observed rarity publication;
- use for economic Rewards.

### Backup privacy

Restored backups MUST apply current closure, anonymization, integrity suppression, and erasure ledgers before serving reads or emitting Events.

### Privacy incident response

The Engine supports:

- identifying affected Definitions, Characters, evidence fields, projections, and consumers;
- immediate public suppression;
- source and cache purge;
- restricted access review;
- export or erasure;
- downstream notification;
- legal hold where required;
- post-incident validation of secret metadata isolation.


---

## Performance

Performance requirements are baseline service objectives, not permission to sacrifice correctness, privacy, or auditability.

### Availability objectives

Recommended initial monthly objectives:

- authoritative live Event ingestion: `99.95%`;
- progress and unlock commit path: `99.95%`;
- owner read API: `99.95%`;
- public read API: `99.95%`;
- control-plane administration: `99.9%`;
- backfill orchestration: `99.9%`;
- no acknowledged authoritative mutation may be lost.

A dependency outage MUST fail safely. The Engine prefers delayed evaluation over accepting unknown Character state, unknown Definition content, unverified producer, or approximate evidence.

### Latency objectives

Under normal production load, excluding source Event transport time:

- inbox acceptance and validation: p50 <= 20 ms, p95 <= 100 ms, p99 <= 300 ms;
- simple one-node evaluation commit: p50 <= 30 ms, p95 <= 150 ms, p99 <= 500 ms;
- bounded composite evaluation commit: p50 <= 50 ms, p95 <= 250 ms, p99 <= 750 ms;
- unlock commit including outbox write: p50 <= 50 ms, p95 <= 250 ms, p99 <= 1 s;
- owner catalog read: p95 <= 150 ms, p99 <= 500 ms;
- public Character Achievement read: p95 <= 100 ms, p99 <= 300 ms;
- Definition validation for normal graph: p95 <= 2 s;
- simulation of 1,000 fixtures: p95 <= 10 s or asynchronous response;
- outbox publication: 99% within 2 seconds, 99.9% within 30 seconds;
- standard projection freshness: 99% within 2 seconds;
- privacy or integrity suppression: 99% within 2 seconds, 99.9% within 30 seconds.

Definitions exceeding synchronous validation or simulation limits are processed as jobs.

### Throughput objectives

The initial production benchmark SHOULD demonstrate at least:

- 2,000 sustained inbound source Events per second per region;
- fan-out to 10,000 target evaluations per second per region for simple plans;
- 1,000 sustained Aggregate mutation commits per second per region;
- burst of 10,000 source Events per second for 5 minutes without data loss;
- 10% duplicate delivery with no duplicate Contribution;
- 5% out-of-order delivery for commutative Conditions;
- 100 concurrent writes targeting one hot Character serialized without lost updates;
- 1,000 active Definitions without scanning all Definitions per Event;
- 100 million Character Achievement Aggregate rows without changing ownership model;
- 1 billion partitioned evidence rows with bounded indexed queries;
- 1 million-Character backfill without starving live evaluation.

Actual launch traffic may be lower, but the architecture MUST not require a domain or ownership redesign to reach these levels.

### Subscription indexing

The live path MUST resolve candidate Definitions through indexed subscriptions keyed by:

- Event type;
- compatible schema version;
- producer;
- tenant or realm;
- activation time;
- optional discriminator prefilter.

Scanning every active Definition for every Event is prohibited.

Compiled subscriptions SHOULD be cached in memory by Event type and activation generation. Cache entries are verified by immutable fingerprint.

### Compiled plan caching

- Published plans are immutable.
- Cache miss loads from durable authoritative storage.
- Cache corruption or fingerprint mismatch causes quarantine, not best-effort evaluation.
- Cache eviction does not change semantics.
- Activation changes use generation-aware invalidation.
- Regional caches converge before activation effective time where possible.

### Aggregate contention

The partition key is Character and Edition. Hot contention is addressed through:

- Character-partitioned Event routing;
- short transactions;
- no external calls inside transactions;
- deterministic retry with jitter;
- bounded per-Character queue;
- separation of unrelated Editions;
- backfill throttling;
- source aggregation where high-frequency raw facts are inappropriate.

If a Definition requires thousands of Events per second for one Character, the source domain SHOULD publish validated summaries rather than force the Achievement Engine to act as a telemetry processor.

### Condition complexity limits

Initial platform limits:

- 256 nodes per graph;
- graph depth 16;
- 128 source subscriptions;
- 1,000 constants in a predicate set;
- 64 visible progress steps;
- 32 Achievement dependencies;
- dependency cascade depth 16;
- 100 affected Achievement targets per source Event before producer aggregation or special review;
- 16 KiB normalized evidence per target operation;
- 1 MiB canonical Definition document;
- 10,000 exact distinct values per node by default;
- 366 hot calendar periods per streak node;
- 100 progress transitions emitted externally per Character per minute by default.

Definitions may request higher approved limits only after load testing and an ADR or platform policy exception.

### Exact distinct-count performance

Exact distinct state is required for unlock truth.

Strategies include:

- unique indexed keyed hashes;
- partitioning by Character or Edition;
- stopping new member storage after threshold when post-threshold detail is unnecessary;
- retaining a completion latch and evidence-set hash after unlock;
- using trusted upstream exact aggregate snapshots for extremely high cardinality.

Approximate sketches may be used only in analytics projections.

### Streak performance

Streak evaluation loads only bounded recent periods required by lateness policy.

A Definition with unlimited retroactive calendar correction is invalid because it requires unbounded hot state.

Historical streak recomputation runs in isolated background workloads.

### Evidence retention performance

The evidence table is partitioned and indexed by Character Achievement and source Event.

Normal read APIs do not query raw evidence. Support and explanation queries are bounded and cursor-paginated.

Large evidence export is asynchronous.

### Event amplification

One source Event may affect multiple Achievements and trigger meta-Achievements and Rewards.

The Engine MUST bound:

- candidate subscriptions;
- target evaluations;
- progress Events;
- dependency cascade depth;
- total causal operations per root Event;
- outbox payload size.

When a bound is exceeded, remaining targets are quarantined or deferred with a continuation manifest. They are not silently skipped.

### Workload classes

The implementation SHOULD isolate:

1. live Event validation and fan-out;
2. live Aggregate mutation;
3. public reads;
4. owner reads;
5. control-plane authoring;
6. backfill and migration;
7. reconciliation and repair;
8. projection rebuild;
9. analytics export;
10. privacy and anonymization workflows.

Bulk work MUST NOT starve live evaluation or privacy suppression.

### Backpressure

When capacity is exceeded, the Engine MUST:

- allow durable queue depth within retention and SLO limits;
- throttle or pause backfills first;
- reject synchronous admin work with retryable status;
- apply producer quotas;
- expose backlog by producer and Event type;
- avoid unbounded in-memory buffering;
- preserve Event ids and ordering metadata;
- alert before retention risk.

### Database query requirements

- Cursor pagination is required for unbounded lists.
- Offset pagination on evidence and operations is prohibited.
- Critical queries require indexed plans verified in performance tests.
- N+1 Definition or node queries are prohibited.
- Full scans run only as approved background jobs.
- Support queries are bounded by Character, Edition, Event, case, or time.
- Long transactions across many Characters are prohibited.

### Projection performance

Projection consumers checkpoint independently and apply monotonic versions.

Public suppression Events receive higher priority than ordinary catalog updates.

Projection rebuild is rate-limited and does not replay user celebrations or Reward triggers.

### Multi-region behavior

Recommended version 1 model:

- a Character has one authoritative write region;
- source Events route to that region;
- Definition metadata replicates globally as immutable content;
- public projections may replicate;
- failover preserves inbox, aggregate, and outbox consistency;
- split-brain writes are prohibited.

Active-active writes for one Character require a future ADR with conflict-free exact unlock semantics.

### Capacity planning metrics

Track at minimum:

- Events received per type and producer;
- candidate targets per Event;
- predicate match rate;
- mutation and no-effect rate;
- Aggregate lock wait and retry count;
- evidence rows per mutation;
- distinct and streak state size;
- unlock rate;
- progress Event emission rate;
- inbox and outbox lag;
- projection lag;
- quarantine rate;
- backfill throughput;
- database size and partition growth;
- cache hit rate;
- hot Characters and Editions;
- causal cascade depth.

### Resilience tests

Performance and resilience tests MUST include:

- broker redelivery storm;
- broker partition reordering;
- database failover;
- outbox publisher pause;
- plan cache loss;
- schema registry outage;
- stale Character projection;
- hot Character;
- hot Edition;
- mass Definition activation;
- mass backfill;
- correction storm;
- invalid payload storm;
- public cache outage;
- regional recovery;
- secret Achievement cache purge;
- Reward consumer outage, proving unlock path remains independent.

---

## Audit

Auditability is a product requirement because Achievement history affects identity and trust.

### Audit principles

- Every authoritative mutation is attributable.
- Published behavior is reproducible from immutable content.
- Historical unlocks are never silently rewritten.
- Administrative access to sensitive evidence is itself audited.
- Audit records are append-only and tamper-evident.
- Public explanations are safe; restricted explanations remain available to authorized investigators.
- Correlation spans source Event, progress, unlock, Reward trigger, and projection where available.

### Audited actions

At minimum:

- Definition creation and Draft update;
- validation and compilation;
- review, approval, rejection, publication;
- activation, pause, resume, retirement;
- source subscription and dependency changes;
- backfill creation, approval, start, pause, resume, cancel;
- runtime progress and unlock transitions through ledger references;
- source correction processing;
- recompute and migration;
- freeze and unfreeze;
- integrity case open, contest, invalidate, restore, close;
- evidence access;
- privacy export, closure propagation, anonymization;
- quarantine retry or discard;
- producer quarantine;
- projection rebuild and reconciliation repair;
- emergency control use;
- database migration affecting authoritative state.

### Audit record contents

Audit records include:

- audit id;
- action key;
- actor type and id;
- service identity;
- resource type and id;
- Character id where applicable;
- namespace, tenant, and realm;
- reason code;
- correlation and request ids;
- prior and resulting state hashes;
- exact Definition content hash where relevant;
- authorization decision reference;
- approval references;
- timestamp;
- data classification;
- safe structured details.

Sensitive payloads SHOULD be referenced through protected evidence ids rather than copied into general audit.

### Achievement ledger

The operational ledger consists of:

- evaluation operations;
- evidence Contributions;
- progress transitions;
- unlock row;
- integrity transitions;
- outbox Events.

Together these MUST answer:

- which Event caused progress;
- why the predicate matched;
- which node changed;
- what the before and after state was;
- which Definition Version was used;
- why root completion became true;
- when the milestone effectively occurred;
- whether it was live or backfilled;
- whether recognition changed later;
- which downstream Event was published.

### Explainability levels

#### User-safe explanation

Contains meaningful progress, unlock time, and safe source category.

#### Support explanation

Contains operation ids, Definition Version, node summaries, and safe error details.

#### Restricted engineering explanation

Contains normalized evidence, hashes, schema versions, plan trace, ordering, and correction details.

#### Security and integrity explanation

Contains investigation evidence and actor access under elevated policy.

### Tamper evidence

Audit and immutable ledger rows SHOULD support:

- append-only database permissions;
- periodic hash chaining or Merkle manifests;
- signed archival exports;
- independent retention storage;
- alerting on unexpected update or delete attempts;
- reconciliation between database and Event broker.

### Reconciliation controls

Scheduled reconciliation verifies:

- every unlocked Aggregate has exactly one unlock row;
- every unlock row has an emitted or pending outbox Event;
- Aggregate Definition fingerprint resolves;
- node state hash matches Aggregate state hash;
- unique evidence constraints hold;
- progress transition versions are monotonic;
- Recognition State matches latest integrity transition;
- public projection contains no invalid or private unlock;
- no secret metadata appears in public catalog;
- inbox completed counts match fan-out terminal states;
- backfill checkpoints match item results.

### Audit access

- Access is role- and purpose-limited.
- Search by Character or source id is audited.
- Bulk audit export requires approval.
- Raw evidence viewing requires a separate permission.
- Audit interfaces redact secret or personal fields by default.
- Break-glass access expires and triggers review.

### Audit retention

Retention follows legal and platform policy. Unlock and Definition proof records are retained as long as needed to explain enduring Character history. Detailed evidence may expire earlier when the minimum proof remains sufficient.

---

## Edge Cases

The following cases have normative deterministic behavior.

### Duplicate source Event delivery

The inbox and contribution uniqueness constraints return the prior result. No counter, distinct member, streak period, or unlock changes twice.

### Same logical fact with different Event ids

The source contract must provide a stable business uniqueness key or original Event id. Without one, the producer owns duplicate truth. High-risk contracts SHOULD require aggregate id and version deduplication.

### Event id reused with changed payload

The payload hash mismatch is a security incident. The Event is quarantined and producer metrics alert. The existing committed effect is not overwritten.

### Unknown Character

The Event is retried within a bounded dependency window, then quarantined. No Aggregate is created.

### Character suspended after Event publication but before processing

Current lifecycle gate applies unless interval-aware policy is explicitly configured. The Event is held or quarantined; it is not silently accepted.

### Character closes after progress but before unlock Event publication

If the unlock transaction committed, the outbox Event remains authoritative but audience and Reward policy must evaluate closure according to contract. Public projections suppress the Character. The outbox row is not deleted.

### Character anonymized while backfill is running

Pending items for that Character are cancelled or rejected. Existing personal evidence is processed by anonymization workflow. Backfill MUST consume the anonymization tombstone before serving results.

### No qualifying subscription

Inbox processing completes with zero targets. No Aggregate is created.

### Predicate false

Target evaluation records `NO_EFFECT` according to retention policy. No Aggregate is created unless state already exists and the operation trace is retained.

### Contribution equals zero

A zero Contribution is normally `NO_EFFECT`. It may be recorded only when required for correction frontier or audit. It does not start tracking.

### Negative contribution from ordinary source

Rejected unless the node and source correction contract explicitly allow an inverse operation. Business Events cannot decrement progress by using a negative value field.

### Numeric overflow

The target is quarantined. Saturation is permitted only if the published plan explicitly defines a safe cap and completion semantics remain exact.

### Decimal scale mismatch

Rejected or converted only by the explicit compiled rounding rule. Implicit rounding is prohibited.

### Distinct value is null

No Contribution or deterministic schema error according to predicate configuration. Null never becomes a shared distinct member.

### Distinct hash collision concern

Use cryptographically strong keyed hashes with negligible collision probability and appropriate digest length. For legally or economically critical use, retain encrypted canonical value or collision resolution metadata according to privacy policy.

### Distinct count reaches target

The node may stop retaining new members if post-threshold corrections and explanation policy permit. The completion latch and target evidence remain exact.

### Event correction before unlock

Apply exact inverse Contribution once. Recompute affected ancestors. Progress may decrease.

### Event correction after unlock

Do not clear unlock. Apply integrity policy: no action, open contest, or automated contest for high-confidence source invalidation. Any invalidation is a separate decision.

### Replacement Event

Reverse original and evaluate replacement as separate idempotent operations. Ordering is deterministic by correction linkage, not arrival race.

### Late Event inside streak lateness window

Update affected period and recompute bounded streak state exactly.

### Late Event outside streak lateness window

Quarantine or require historical recompute according to policy. Do not mutate live streak approximately.

### Timezone rule changes

Existing Definition Version uses its pinned calendar policy. New timezone database behavior requires a new policy Version or explicit recompute decision.

### Daylight-saving transition

Calendar period boundaries use IANA timezone rules and local date semantics, not fixed 24-hour duration.

### Leap day and leap second

Calendar policy defines date handling. UTC timestamp parser accepts platform-supported standards; leap-second normalization is explicit and tested.

### Source Event occurred before Character creation

Rejected unless an approved import policy explicitly maps pre-existing identity history. Current source producer cannot award progress to a not-yet-created Character by backdating.

### Definition activated while Event is in transit

Version routing uses Event effective time and activation policy, not only receive time. The selected Version and activation id are recorded.

### Definition retired while target operation is queued

If the Event was eligible at its effective time and target fan-out was durably created before retirement, process according to retirement in-flight policy. Otherwise reject or backfill according to explicit policy.

### Overlapping activation attempt

The command fails with conflict. Runtime never randomly selects between Versions.

### New Version with incompatible node ids

Migration validation fails unless a complete mapping or evidence recompute plan exists.

### Threshold lowered below current progress

A migration or new Version may unlock during explicit migration. The resulting unlock records migration as causation and uses the approved time basis. Silent live unlock from changing a row is prohibited.

### Threshold raised for already unlocked Character

Historical unlock remains. New Version does not relock or invalidate it.

### Definition deleted from authoring UI

Published or referenced Versions remain archived and resolvable. Physical deletion is prohibited.

### Secret Achievement before unlock

Public and unauthorized owner routes follow secrecy policy and do not reveal stable key, criteria, progress, or existence through timing and count.

### Secret Achievement unlocks during backfill

Reveal follows normal unlock policy, with retroactive recognition metadata. Celebration may be summarized to avoid a flood.

### Meta-Achievement dependency cycle

Publication fails. Runtime cycle guard also prevents unexpected recursive processing.

### Meta-Achievement cascade exceeds depth

Remaining operations are deferred or quarantined with continuation. Already committed unlocks remain. No silent skip.

### Prerequisite invalidated before dependent unlock

Dependency node becomes unsatisfied if policy requires valid recognition. Progress recomputes before dependent unlock.

### Prerequisite invalidated after dependent unlock

Dependent unlock remains historical. Integrity propagation occurs only through explicit configured case policy.

### Reward Engine unavailable

Achievement unlock commits and outbox retries. The Achievement does not wait or roll back.

### Reward Trigger Binding missing

Achievement remains unlocked. Lack of Reward is Reward configuration behavior, not Achievement failure.

### Reward granted twice due consumer bug

Achievement Engine still emits one unlock Event. Reward Engine owns its idempotency and remediation.

### Projection displays stale locked state after unlock

Command/Event receipt and Aggregate version permit repair. Projection consumer catches up. The source action is not repeated.

### Projection displays invalidated Achievement

High-priority suppression and reconciliation remove it. This is a privacy and integrity incident metric.

### Public cache contains secret metadata

Emergency suppression and purge execute. The incident response identifies affected keys and access logs.

### One Event matches many Achievements

Fan-out is bounded. Each target is independent and idempotent. Excess targets require source aggregation or approved continuation.

### Concurrent Events complete the same Achievement

Aggregate serialization allows one first unlock. The other Event may commit no additional progress or a final duplicate evidence outcome according to post-unlock policy. Only one unlock Event is produced.

### Concurrent correction and final qualifying Event

Operations serialize. The resulting state follows committed order and correction linkage. Reconciliation can rebuild from evidence if the source sequence requires a different canonical order.

### Database commit succeeds but broker publish fails

Outbox retries the same Event id and payload. No Aggregate rollback or duplicate unlock occurs.

### Broker publish succeeds but outbox acknowledgement fails

Republish may occur. Consumers deduplicate by Event id.

### Worker crashes after lock acquisition

Database transaction rolls back or commits atomically. Retry uses same target operation identity.

### Plan cache contains wrong content

Fingerprint mismatch quarantines evaluation. Runtime never uses unverified cached content.

### Schema Registry unavailable

Already pinned and locally verified schemas may continue according to cache policy. New or unknown schema versions are delayed. Definition publication is blocked.

### Backfill overlaps live Events

Source Event ids and contribution keys deduplicate. Backfill and live paths use the same Aggregate rules. Checkpoints do not assume exclusive access.

### Backfill cancelled after some unlocks

Committed unlocks remain valid. Job reports partial completion. Restart uses a new or resumed manifest and deduplicates.

### Dry-run differs from commit because live state changed

Commit requires manifest validity and expected versions or performs a new diff. It does not blindly apply stale results.

### Legacy import contains duplicate unlocks

Import mapping creates at most one unlock per Character and Edition. Duplicates are reported in the import manifest.

### Operator attempts direct unlock

Denied unless using approved legacy evidence or integrity repair workflow. No free-form path exists.

### Integrity invalidation while public feed consumer is down

Authoritative state changes and outbox persists. Public read path SHOULD consult suppression cache or authoritative tombstone to prevent stale disclosure.

### Integrity state restored

A new transition restores Recognition State. Original invalidation history remains. Downstream consumers receive restoration Event.

### Character merges in future

Unsupported in version 1. No automatic movement of Achievements occurs. A future protocol must preserve unlock identities and resolve duplicates.

### Cross-realm Character reference

Rejected without existence leakage unless an approved migration workflow controls both realms.

### Source payload contains unexpected personal data

Schema validation or data-loss prevention policy rejects or strips prohibited fields before evidence storage and alerts the producer owner.

### Audit storage unavailable

High-risk control-plane and integrity writes fail closed. Live progress may continue only if local immutable ledger and buffered audit outbox satisfy approved policy.

### Disk pressure on evidence partitions

Backfills pause, producer quotas tighten, and alerts fire. The Engine does not delete recent evidence ad hoc or continue until corruption.

### Retention removes detailed evidence

Minimum unlock proof and evidence-set hash remain according to policy. Explanation indicates evidence archived or expired rather than fabricating detail.

### Definition localization missing

Evaluation continues only if publication policy permitted fallback. User responses use default fallback key. Missing presentation does not change unlock logic.

### Media asset removed

Achievement state remains. Projection uses fallback asset and alerts content owners.

### Observed rarity is unavailable

Configured rarity displays. No unlock or catalog failure occurs.

### Clock skew

Events beyond future-skew limit are quarantined. Server recorded time is retained. Clients cannot force an earlier unlock by sending timestamps.

### Same source Event replayed years later

Stable Event id produces duplicate no-op. If id was not preserved, source replay manifest must map original identity or the replay is rejected for Definitions requiring strict deduplication.

---

## Acceptance Tests

The following tests are normative release criteria. Equivalent automated tests MAY be organized differently, but every behavior must be covered.

### Definition and publication

1. A valid namespace and Achievement key create one logical Definition.
2. Duplicate `(namespace, achievement_key)` creation is rejected.
3. One Definition may contain multiple immutable Versions.
4. One Edition is unlockable at most once per Character.
5. A seasonal recurrence requires a distinct Edition.
6. Draft content may be edited with the expected revision.
7. Draft update with a stale revision is rejected.
8. Validation references the exact Draft content hash.
9. Editing a validated Draft returns it to `DRAFT`.
10. Approval references the exact validated content hash.
11. Editing content invalidates prior approvals.
12. A Version cannot publish without required approvals.
13. A published Version cannot be edited.
14. Published content resolves by Version id and fingerprint.
15. Invalid Condition graph cycle blocks publication.
16. Unreachable Condition node blocks or warns according to policy and cannot silently execute.
17. Unknown node type blocks publication.
18. Node id duplication blocks publication.
19. Graph depth above platform limit blocks publication.
20. Node count above platform limit blocks publication.
21. Unknown Event type blocks publication.
22. Incompatible Event schema version blocks publication.
23. Unauthorized source producer configuration blocks publication.
24. Unknown payload path blocks publication.
25. Type mismatch between payload field and Condition blocks publication.
26. Floating-point authoritative Condition blocks publication.
27. Unbounded distinct-count configuration blocks publication.
28. Calendar streak without timezone blocks publication.
29. Calendar streak without lateness policy blocks publication.
30. Direct Achievement dependency cycle blocks publication.
31. Indirect Achievement dependency cycle blocks publication.
32. Reward causal cycle risk is detected and blocks or requires approved exception.
33. Secret Achievement public projection leakage finding blocks publication.
34. Retroactivity policy without source retention compatibility blocks publication.
35. Published compiled plan is reproducible from canonical Definition.
36. Runtime rejects a plan whose fingerprint does not match.
37. Two overlapping active Versions for the same Edition and scope are rejected.
38. Scheduled activation occurs at the persisted UTC time.
39. Pause does not mutate Definition content.
40. Retirement stops new live routing and preserves history.
41. Archive preserves referenced published content.
42. Definition diff identifies threshold changes semantically.
43. Definition diff identifies Event subscription changes semantically.
44. Definition diff identifies secrecy-policy changes semantically.
45. Simulation never writes Character Achievement state.
46. Simulation of duplicate Events shows one logical contribution.
47. Simulation of correction produces the configured inverse result.
48. Simulation of meta-Achievement cascade respects depth bounds.

### Event ingestion and authorization

49. Valid registered source Event is accepted.
50. Invalid envelope is rejected.
51. Missing Event id is rejected.
52. Unknown Event version is quarantined.
53. Producer identity mismatch is rejected and audited.
54. Valid schema from unauthorized producer is rejected.
55. Payload above size limit is rejected.
56. Event beyond future-skew policy is quarantined.
57. Event beyond lateness policy follows configured late behavior.
58. Event with no active subscription completes with zero targets.
59. Source Event fan-out resolves only indexed candidate Definitions.
60. One malformed target does not block unrelated targets.
61. Same Event delivery twice creates one inbox record.
62. Same Event id with changed payload is quarantined as an integrity incident.
63. Replay with original Event id produces no duplicate contribution.
64. Replay manifest with stable original id deduplicates correctly.
65. Replay without stable identity is rejected where strict deduplication is required.
66. Unknown Character is not treated as active.
67. Missing Character projection causes retry or quarantine.
68. Suspended Character follows configured hold or reject policy.
69. Closed Character receives no normal live progress.
70. Anonymized Character receives no progress and no public projection.
71. Character lifecycle projection ignores stale aggregate versions.
72. Cross-realm Character and Definition combination is rejected.
73. Prohibited personal field is not retained as evidence.
74. Correlation and causation identifiers propagate to outbound Events.
75. Causal depth limit prevents recursive cascade.

### Evaluation semantics

76. `EVENT_COUNT` increments exactly once for a qualifying Event.
77. `EVENT_COUNT` does not increment when predicate is false.
78. `VALUE_SUM` adds exact integer contribution.
79. `VALUE_SUM` enforces minimum and maximum contribution.
80. Decimal sum uses declared exact scale and rounding mode.
81. Numeric overflow quarantines the target.
82. `DISTINCT_COUNT` counts the same normalized value once.
83. Different normalized values count separately.
84. Null distinct value does not create a member.
85. Exact distinct target unlocks without approximate algorithms.
86. `MAX_VALUE` updates only when a higher value arrives.
87. `MIN_VALUE` initializes on first value and updates only lower values.
88. `BOOLEAN_LATCH` becomes true on qualifying Event.
89. `SNAPSHOT_THRESHOLD` uses typed snapshot Event and version.
90. `ALL_OF` completes only when all children complete.
91. `ANY_OF` completes when the first child completes.
92. `AT_LEAST` completes at exactly the configured `k` children.
93. `WEIGHTED_THRESHOLD` uses exact integer weights.
94. Composite ancestors recompute in topological order.
95. Unaffected branches are not loaded or recomputed unnecessarily.
96. Event-time-ordered plan applies bounded lateness semantics.
97. Source-sequence-ordered plan detects a sequence gap.
98. Commutative plan produces same result under Event reordering.
99. Calendar day boundaries use configured IANA timezone.
100. Daylight-saving transition does not create duplicate or missing calendar dates.
101. Streak increments after qualifying consecutive periods.
102. Streak resets or pauses according to explicit gap policy.
103. Late Event inside window repairs bounded streak exactly.
104. Late Event outside window requires historical recompute or quarantine.
105. Achievement dependency completes from valid prerequisite unlock.
106. Invalid prerequisite Recognition State is handled according to policy.
107. Manual evidence node rejects unauthorized issuer.
108. Approved manual evidence is idempotent by assertion id.
109. Predicate evaluation cannot make network calls.
110. Predicate evaluation cannot execute code or SQL.
111. Evaluation result is stable for same plan and evidence order.
112. Zero Contribution does not materialize tracking state by default.
113. Ordinary negative contribution is rejected.
114. State hash changes exactly with authoritative state.
115. Aggregate version increments once per committed mutation.

### Idempotency and concurrency

116. Duplicate target operation returns prior logical result.
117. One Event cannot affect one node twice.
118. Concurrent qualifying Events do not lose increments.
119. Concurrent final Events create exactly one unlock.
120. Concurrent distinct-member insert preserves exact uniqueness.
121. Concurrent correction and Contribution serialize deterministically.
122. Worker crash before commit produces no partial state.
123. Worker crash after commit but before publish leaves outbox for retry.
124. Broker redelivery after publish does not duplicate downstream logical effect.
125. Idempotency key reused with different admin request returns conflict.
126. Idempotency scope prevents cross-actor result disclosure.
127. Aggregate retry exhaustion produces retriable or quarantined outcome without silent loss.
128. One hot Character does not require a global lock.
129. Backfill and live Event for same source id deduplicate.
130. Projection replay does not produce new unlock or Reward trigger.

### Progress and unlock

131. First material Contribution creates `TRACKING` Aggregate.
132. Predicate miss does not create Aggregate.
133. Progress summary matches authoritative node state.
134. Exact progress transport preserves large integers as strings.
135. Percent progress uses server-provided basis points.
136. Hidden progress omits exact values from owner response.
137. Secret Achievement follows concealed existence policy.
138. Root transition to true creates one immutable unlock row.
139. Unlock transaction includes Aggregate update, transition, unlock, and outbox atomically.
140. `unlocked_at` is never cleared.
141. `unlocked_at` and `recorded_at` are both retained.
142. Backfill unlock uses correct time basis.
143. Unlock references exact Definition Version and fingerprint.
144. Unlock stores evidence frontier and evidence-set hash.
145. Already unlocked Edition ignores routine further progress.
146. New Definition Version does not duplicate unlock of same Edition.
147. Threshold increase does not relock an existing unlock.
148. Threshold decrease unlocks only through explicit migration or evaluation.
149. Retired Edition preserves valid unlock history.
150. Incomplete retired progress follows configured display policy.
151. `achievement.unlocked.v1` contains stable unlock id.
152. Replayed unlock Event is deduplicable by downstream consumer.
153. Reward Engine outage does not block unlock commit.
154. Missing Reward binding does not fail Achievement.
155. Public unlock payload contains no sensitive evidence.
156. Secret Achievement reveals only configured metadata at unlock.
157. Live and backfilled celebrations are distinguishable.

### Corrections and integrity

158. Typed source correction before unlock applies once.
159. Pre-unlock correction can decrease counter progress.
160. Pre-unlock distinct correction removes the exact active member.
161. Unsupported correction is quarantined rather than guessed.
162. Replacement Event is evaluated separately after correction.
163. Source correction after unlock does not delete unlock.
164. Post-unlock policy can open an integrity case.
165. Opening a case records actor, reason, and evidence reference.
166. Contest transition preserves unlock and changes Recognition State.
167. Public projection suppresses contested recognition.
168. Invalidation requires authorized decision.
169. Dual approval is enforced where configured.
170. Invalidation preserves immutable unlock row.
171. `achievement.invalidated.v1` is published once per transition.
172. Invalidation does not directly revoke Reward state.
173. Recognition restoration appends a new transition.
174. Restoration does not delete prior invalidation history.
175. Invalid prerequisite before dependent unlock can unsatisfy dependency.
176. Invalid prerequisite after dependent unlock does not silently relock dependent Achievement.
177. Integrity reason visible to owner is safe and does not reveal investigation detail.
178. Raw evidence access is separately authorized and audited.

### Version migration and backfill

179. Existing Aggregate remains on bound Version under `CONTINUE_BOUND_VERSION`.
180. Compatible migration validates every node mapping.
181. Incompatible node type mapping is rejected.
182. Migration dry run reports per-Aggregate diff.
183. Migration commit references approved manifest hash.
184. Migration is idempotent per Character and Edition.
185. Already unlocked Character retains original unlock Version.
186. Recompute from retained evidence reproduces state hash.
187. Recompute cannot fabricate missing evidence.
188. Backfill Job validates source history availability.
189. Backfill Job requires approval when policy specifies it.
190. Backfill resumes from durable checkpoint.
191. Backfill pause stops new batches without rolling back commits.
192. Backfill cancel preserves committed unlocks and reports partial result.
193. Backfill retry does not duplicate progress.
194. Backfill rate limit protects live workload.
195. Backfill dry run writes no authoritative state.
196. Backfill completion manifest reports mutations, unlocks, duplicates, and errors.
197. Character anonymized during backfill is skipped and privacy workflow applies.
198. Definition retirement during backfill follows explicit in-flight policy.
199. Backfill and live evaluation can run concurrently without lost updates.
200. Full available history policy is rejected when source identity cannot support deduplication.

### APIs and projections

201. Owner catalog requires owner or delegated authorization.
202. Public endpoint returns only permitted valid unlocks.
203. Private Character does not leak Achievement existence.
204. Secret Achievement does not leak through public count.
205. Contested and invalidated Achievements are absent from public projection.
206. Owner detail returns progress according to policy.
207. Public detail omits internal Definition Version metadata.
208. List endpoints use cursor pagination.
209. Lower projection version cannot overwrite higher version.
210. Projection gap triggers repair or snapshot fetch.
211. Character closure purges public projection and cache.
212. Character restoration rebuilds from authoritative state.
213. Character anonymization removes personal evidence according to field matrix.
214. Public cache keys separate audience and secret state.
215. Cache failure does not weaken authorization.
216. Recent unlock feed respects current privacy, not only unlock-time privacy.
217. Profile showcase eligibility excludes invalid recognition.
218. Character Engine remains owner of showcase slot selection.
219. API error does not reveal hidden Achievement key.
220. Admin explanation requires elevated authorization for raw evidence.
221. Synchronous API limits are enforced.
222. Asynchronous large simulation returns job reference.
223. Idempotent admin command returns original result.
224. Stale `If-Match` returns precondition failure.

### Security and privacy

225. Forged producer Event is rejected.
226. Transport identity mismatch is audited.
227. Cross-tenant Definition access is denied without existence leakage.
228. Published plan modification attempt is rejected.
229. Unauthorized manual unlock endpoint does not exist.
230. Secret Conditions are absent from client bundles and public search.
231. General logs contain no sensitive source payload.
232. Evidence fields are minimized according to compiled manifest.
233. Keyed distinct hashes cannot be read by ordinary support role.
234. Break-glass evidence access expires and is audited.
235. Definition author cannot self-publish when separation of duties is required.
236. Integrity investigator cannot self-approve invalidation when dual control is required.
237. Public rate limiting mitigates scraping.
238. Producer quota contains a compromised producer.
239. Definition pause contains a faulty Condition without deleting state.
240. Privacy suppression is prioritized over ordinary projection updates.
241. Data export contains owner-safe Achievement history.
242. Data export excludes other Characters and protected investigation details.
243. Anonymization tombstone preserves idempotency without direct identity.
244. Restored backup applies erasure and suppression ledgers before serving.
245. Sensitive Definition requires elevated privacy review.
246. Approximate analytics cannot unlock or repair Achievement state.

### Operations and resilience

247. Database failover does not produce partial unlock.
248. Outbox pause accumulates durable unpublished Events.
249. Outbox recovery publishes original Event ids.
250. Schema Registry outage blocks unknown schemas but may use verified pinned cache.
251. Compiled plan cache loss does not change evaluation semantics.
252. Plan fingerprint mismatch quarantines target.
253. Quarantine retry uses original operation identity.
254. Quarantine discard requires reason and audit.
255. Producer quarantine stops only affected producer scope.
256. Emergency public suppression hides Achievements without mutating unlock history.
257. Reconciliation detects unlock without published outbox state.
258. Reconciliation detects Recognition State mismatch.
259. Reconciliation detects public projection containing invalid recognition.
260. Repair workflow produces dry-run diff and audit.
261. Evidence partition pressure pauses bulk work before data loss.
262. Hot Character test shows bounded queue and no lost updates.
263. Duplicate storm creates no duplicate Contributions.
264. Correction storm remains idempotent.
265. Meta-Achievement cascade remains within configured depth.
266. Reward consumer outage does not reduce Achievement availability.
267. Projection rebuild does not replay user celebration.
268. Projection rebuild does not trigger Reward.
269. Audit write failure causes high-risk control-plane command to fail closed.
270. Metrics expose inbox, fan-out, mutation, unlock, outbox, projection, quarantine, and backfill lag.

### UX and accessibility

271. Unlock celebration is deduplicated by unlock id.
272. Reduced-motion client can render unlock without required animation.
273. Progress is readable by screen reader.
274. UI does not rely on rarity color alone.
275. Exact values are localized only in client presentation.
276. UTC timestamps are localized without changing authoritative order.
277. Calendar streak exposes policy timezone when needed.
278. Backfilled unlock does not claim to have occurred at processing time.
279. Invalidated recognition is not presented as an ordinary locked Achievement.
280. Retired incomplete Achievement clearly indicates unavailable progress.
281. Missing media uses fallback without changing state.
282. Configured and observed rarity are labeled distinctly.
283. Hidden progress is not reconstructed client-side.
284. Public profile never shows private source evidence.

### Release acceptance

The Engine is production-ready only when:

- all normative tests pass;
- schema migrations pass forward and rollback drills where rollback is supported;
- load and resilience targets are met in an environment representative of production;
- security threat review is approved;
- privacy and retention review is approved;
- disaster recovery and outbox replay are demonstrated;
- Definition publication and emergency pause runbooks are exercised;
- backfill pause, resume, and cancel are demonstrated;
- integrity invalidation and restoration are demonstrated end to end;
- Reward integration proves one unlock maps to at most one Reward Grant under duplicate delivery;
- Character closure and anonymization propagation are demonstrated;
- dashboards, alerts, and on-call runbooks are available;
- no unresolved ownership conflict exists with another Engine.

---

## Future Extensions

Future capabilities may be added without weakening current invariants.

### Achievement Series

A first-class catalog model for related Editions, tiered presentation, and journey grouping while preserving one unlock per Edition.

### Tiered Achievements

Bronze, Silver, Gold, and higher tiers represented as distinct Editions or an explicit Series DAG. A tier MUST NOT mutate one unlock row through multiple values.

### Cross-Character group milestones

Guild, team, class, household, or community Achievements require a new aggregate owner and identity model. Character recognition may be derived from a group milestone Event.

### Verified external credentials

Cryptographically verifiable certificates or credentials may become evidence through a dedicated issuer registry and revocation protocol.

### Portable Achievement proofs

Exportable signed proofs could allow a Character to demonstrate selected milestones across products without exposing underlying evidence.

### Advanced sequence Conditions

Ordered sequences, finite-state patterns, and bounded temporal logic may be introduced through a dedicated typed model and ADR, not arbitrary CEP scripts.

### Trusted upstream statistic snapshots

A future Statistics Engine may own reusable exact metrics. Achievement Engine could consume versioned exact snapshot Events rather than duplicating high-cardinality state.

### Progressive disclosure

Definitions may reveal additional narrative or visual layers at configured progress milestones without changing evaluation.

### Cooperative recognition

A future model may recognize contributors to a shared event while keeping each Character Achievement independently evidenced.

### Dynamic observed rarity

Privacy-safe analytics may expose observed rarity by approved cohort and time window, clearly separate from configured rarity.

### Achievement recommendations

A recommendation service may suggest visible Achievements based on owner-authorized projections. It MUST NOT reveal secret Conditions or alter progress.

### Creator-authored Achievements

Trusted community creators may author within constrained namespaces, templates, approval policy, and abuse controls.

### Verifiable anti-cheat attestations

High-value game Achievements may require signed anti-cheat or adjudication evidence.

### Multi-region active-active

Conflict-free exact processing across active regions requires a separate ADR covering Event identity, Character home region, and unlock uniqueness.

### Character merge protocol

A future cross-Engine merge protocol must preserve unlock ids, resolve duplicate Editions, retain provenance, and avoid rewriting historical evidence.

### Recognition appeals

A formal user appeal workflow could integrate with integrity cases while protecting investigation confidentiality.

### Achievement collections

A Collection Engine or catalog projection may group Achievements and track collection completion without transferring unlock ownership.

### Time-limited visibility

An Achievement may remain permanent while specific presentation campaigns or profile effects are time-limited through external content or Season policy.

### AI-assisted authoring

AI may propose Conditions, fixtures, descriptions, or risk findings. Generated content is untrusted Draft material and cannot approve, publish, or bypass deterministic validation.

### Formal verification

Critical Definition compilers may use property testing, model checking, or proof-oriented validation for idempotency, boundedness, and cycle safety.

---

## ADR References

The following decisions are normative in this RFC and the shared platform
contract RFCs. Standalone ADR files MAY mirror them for repository traceability
but may not redefine the contracts independently.

- **ADR-001 — Platform First:** platform Engines remain independent from Business Modules.
- **ADR-002 — Event-Driven Engine Integration:** Engines communicate through immutable versioned Events.
- **ADR-003 — Platform-Owned Character:** Character identity belongs to the platform.
- **ADR-004 — Single Writer per Aggregate Class:** only Achievement Engine mutates Achievement progress and unlock state.
- **ADR-005 — Transactional Inbox and Outbox:** at-least-once delivery becomes exactly-once logical effect.
- **ADR-006 — Immutable Published Configuration:** historical evaluation references immutable Definition Versions and fingerprints.
- **ADR-007 — Bounded Achievement Condition Model:** arbitrary executable code and unbounded evaluation are prohibited.
- **ADR-008 — Achievement Edition Semantics:** one Edition unlocks at most once per Character; recurrence uses new Editions.
- **ADR-009 — Permanent Unlock and Integrity State:** invalidation never deletes or rewrites the original unlock.
- **ADR-010 — Exact Evidence and Progress:** approximate statistics cannot unlock Achievements.
- **ADR-011 — Achievement Definition Activation:** temporal and scope routing is explicit and non-overlapping.
- **ADR-012 — Definition Version Migration:** progress is never silently reinterpreted.
- **ADR-013 — Retroactive Evaluation and Backfill:** historical recognition is explicit, resumable, and workload-isolated.
- **ADR-014 — Character Eligibility Projection:** live evaluation uses local lifecycle state and fails safely when unknown.
- **ADR-015 — Achievement-to-Reward Direction:** unlock Events may trigger Reward policy; Achievement unlock is not a generic Reward Component.
- **ADR-016 — Causal Cycle Prevention:** dependency and cross-Engine Event graphs are bounded and cycle-safe.
- **ADR-017 — Secret Achievement Protection:** secrecy is enforced server-side across APIs, caches, logs, and search.
- **ADR-018 — Calendar Streak Semantics:** timezone, period, lateness, and correction policies are versioned.
- **ADR-019 — Evidence Retention and Privacy:** minimum proof is retained while personal source data is minimized.
- **ADR-020 — Achievement Integrity Workflow:** contest, invalidation, restoration, and downstream review are append-only.
- **ADR-021 — Exact Distinct Counting:** keyed exact membership is authoritative; approximate sketches are analytics-only.
- **ADR-022 — Workload Isolation:** live evaluation has priority over backfill, migration, projection rebuild, and analytics.
- **ADR-023 — Achievement Projection Audiences:** owner, public, internal, and administration models are separately filtered.
- **ADR-024 — Legacy Achievement Import:** imports use typed evidence and immutable manifests, not direct free-form unlocks.

Any implementation that differs from ownership, permanence, idempotency, exactness, or versioning defined here requires an approved ADR before release.

---

## Appendix

### Appendix A — Responsibility matrix

| Action | Achievement Engine | Source Module/Engine | Reward Engine | Character Engine |
|---|---|---|---|---|
| Prove business fact happened | No | Yes | No | No |
| Define Achievement Conditions | Yes | May author in namespace | No | No |
| Evaluate Achievement progress | Yes | No | No | No |
| Store Achievement evidence | Yes, minimized | Owns source truth | No | No |
| Unlock Achievement | Yes | No | No | No |
| Grant Reward for unlock | No | No | Yes | No |
| Change Character lifecycle | No | No | No | Yes |
| Select Achievement for profile showcase | Supplies eligible reference | No | No | Yes |
| Send notification | Publishes Event | No | No | No |
| Invalidate source fact | Processes correction | Yes, source owner | No | No |
| Invalidate Achievement recognition | Yes, integrity workflow | Supplies evidence | May review Reward separately | No |
| Delete original unlock | Never | Never | Never | Never |

### Appendix B — Character Achievement transition matrix

| Current | Input | Next | Notes |
|---|---|---|---|
| Absent | non-qualifying Event | Absent | No row created. |
| Absent | qualifying partial Contribution | `TRACKING` | Aggregate and evidence created. |
| Absent | qualifying completing Contribution | `UNLOCKED` | Aggregate, evidence, unlock, outbox atomic. |
| `TRACKING` | qualifying partial Contribution | `TRACKING` | Progress advances. |
| `TRACKING` | exact correction | `TRACKING` | Progress may decrease. |
| `TRACKING` | root becomes true | `UNLOCKED` | First unlock only. |
| `UNLOCKED` | ordinary Event | `UNLOCKED` | No authoritative progress mutation. |
| `UNLOCKED` | integrity contest | `CONTESTED` | Unlock retained. |
| `CONTESTED` | valid decision | `UNLOCKED` | Recognition restored to valid. |
| `CONTESTED` | invalid decision | `INVALIDATED` | Unlock retained, public suppressed. |
| `INVALIDATED` | restoration decision | `UNLOCKED` | New integrity transition. |

### Appendix C — Condition node support matrix

| Node type | Commutative | Correction support | Exact state | Version 1 |
|---|---:|---:|---:|---:|
| `EVENT_COUNT` | Yes | Yes when source links original | Counter | Yes |
| `VALUE_SUM` | Yes | Yes with exact inverse | Integer/decimal | Yes |
| `DISTINCT_COUNT` | Yes | Yes with exact member | Exact set | Yes |
| `MAX_VALUE` | Usually | Recompute may be needed | Maximum plus evidence policy | Yes |
| `MIN_VALUE` | Usually | Recompute may be needed | Minimum plus evidence policy | Yes |
| `BOOLEAN_LATCH` | Yes | Optional before unlock | Boolean/evidence | Yes |
| `SNAPSHOT_THRESHOLD` | Latest-version order | Replacement snapshot | Typed value | Yes |
| `CALENDAR_STREAK` | No | Bounded period recompute | Period rows | Yes |
| `ACHIEVEMENT_DEPENDENCY` | Dependency order | Integrity policy | Unlock reference | Yes |
| `ALL_OF` | Derived | Derived | Child states | Yes |
| `ANY_OF` | Derived | Derived | Child states | Yes |
| `AT_LEAST` | Derived | Derived | Child states | Yes |
| `WEIGHTED_THRESHOLD` | Derived | Derived | Child states | Yes |
| arbitrary sequence | No | Complex | State machine | Future |
| approximate count | N/A | N/A | Approximation | Never for unlock |

### Appendix D — Definition validation checklist

A Version cannot publish until the platform confirms:

- stable Definition and Edition identity;
- once-per-Character Edition semantics;
- valid DAG;
- bounded nodes and depth;
- typed thresholds and extraction;
- registered Event contracts;
- producer authorization;
- Character subject resolution;
- duplicate identity semantics;
- ordering and lateness compatibility;
- correction semantics;
- exact arithmetic;
- exact distinct bounds;
- calendar timezone policy;
- dependency cycle safety;
- Reward causal cycle safety;
- progress presentation consistency;
- secret metadata isolation;
- privacy field classification;
- evidence retention compatibility;
- localization and asset policy;
- activation scope and overlap;
- retroactivity source availability;
- migration strategy;
- simulation fixtures;
- governance approvals;
- compiled plan fingerprint.

### Appendix E — Example Definition

```json
{
  "schemaVersion": 1,
  "namespace": "school",
  "achievementKey": "consistency.apprentice",
  "edition": {
    "editionKey": "2026",
    "seriesKey": "consistency.apprentice",
    "oncePerCharacter": true
  },
  "categoryKey": "consistency",
  "rarityKey": "rare",
  "secrecyPolicy": {
    "mode": "VISIBLE",
    "revealOnUnlock": true,
    "publicAfterUnlock": true
  },
  "progressPolicy": {
    "mode": "EXACT",
    "primaryNodeId": "completed-practices",
    "eventEmission": {
      "mode": "ON_PERCENT_STEP",
      "stepBasisPoints": 1000
    }
  },
  "presentation": {
    "nameKey": "achievement.school.consistency.apprentice.name",
    "descriptionKey": "achievement.school.consistency.apprentice.description",
    "iconAssetId": "asset-id",
    "celebrationKey": "achievement.unlock.standard"
  },
  "retroactivityPolicy": {
    "mode": "FROM_ACTIVATION"
  },
  "lifecycleGatePolicy": {
    "active": "ALLOW",
    "suspended": "HOLD",
    "closed": "REJECT",
    "anonymized": "REJECT"
  },
  "conditionGraph": {
    "rootNodeId": "all",
    "nodes": [
      {
        "nodeId": "completed-practices",
        "type": "EVENT_COUNT",
        "eventTypes": ["lesson.completed.v1"],
        "producerAllowlist": ["school-module"],
        "predicate": {
          "op": "AND",
          "children": [
            {
              "op": "EQ",
              "path": "/payload/completionState",
              "value": "VALID"
            },
            {
              "op": "EQ",
              "path": "/payload/activityCategory",
              "value": "PRACTICE"
            }
          ]
        },
        "threshold": 10,
        "correctionEventType": "lesson.completion.reversed.v1"
      },
      {
        "nodeId": "all",
        "type": "ALL_OF",
        "children": ["completed-practices"]
      }
    ]
  },
  "evidencePolicy": {
    "retainSourceEventId": true,
    "retainNormalizedFields": ["activityCategory"],
    "retentionClass": "achievement-standard"
  },
  "integrityPolicy": {
    "postUnlockCorrection": "OPEN_CASE",
    "publicWhileContested": "SUPPRESS"
  }
}
```

This example is illustrative. The Engine does not know what a lesson or practice means; it validates the registered Event contract and evaluates the published data.

### Appendix F — Example evaluation trace

```json
{
  "evaluationOperationId": "uuid",
  "sourceEventId": "uuid",
  "characterId": "uuid",
  "achievementEditionId": "uuid",
  "definitionVersionId": "uuid",
  "definitionFingerprint": "sha256:...",
  "lifecycleGate": {
    "characterState": "ACTIVE",
    "projectionVersion": 12,
    "decision": "ALLOW"
  },
  "subscription": {
    "eventType": "lesson.completed.v1",
    "schemaVersion": 1,
    "producer": "school-module",
    "matched": true
  },
  "nodes": [
    {
      "nodeId": "completed-practices",
      "predicateMatched": true,
      "contribution": {
        "type": "INCREMENT",
        "value": "1"
      },
      "before": {
        "value": "9",
        "complete": false
      },
      "after": {
        "value": "10",
        "complete": true
      }
    },
    {
      "nodeId": "all",
      "before": {
        "complete": false
      },
      "after": {
        "complete": true
      }
    }
  ],
  "result": {
    "status": "UNLOCKED",
    "achievementUnlockId": "uuid",
    "aggregateVersion": 10,
    "unlockedAt": "2026-07-18T10:15:00Z",
    "recordedAt": "2026-07-18T10:15:00.250Z"
  }
}
```

### Appendix G — Operational dashboards

Minimum dashboards:

1. Event ingestion by producer and type.
2. Candidate fan-out and predicate match rate.
3. Evaluation latency and mutation latency.
4. Aggregate conflict and retry rate.
5. Unlock volume by Edition and realm.
6. Inbox and outbox backlog age.
7. Projection freshness and privacy suppression lag.
8. Quarantine by error code.
9. Backfill throughput and live-workload impact.
10. Database partitions, evidence growth, and distinct-state size.
11. Secret Achievement public exposure canaries.
12. Integrity case volume and age.
13. Definition activation and fingerprint consistency by region.
14. Causal cascade depth and cycle-guard blocks.
15. Character lifecycle projection lag.

### Appendix H — Alerts

Critical alerts include:

- possible duplicate unlock invariant violation;
- unlock row without Aggregate reference;
- outbox age above SLO;
- privacy or integrity suppression lag above threshold;
- public projection contains invalid recognition;
- secret metadata exposure canary;
- Event id payload mismatch;
- compiled plan fingerprint mismatch;
- Definition activation overlap;
- database partition near capacity;
- source producer volume anomaly;
- quarantine spike;
- Character lifecycle projection stale beyond safety limit;
- backfill consuming live workload budget;
- audit append failure;
- cross-tenant authorization anomaly.

### Appendix I — Runbook index

Required runbooks:

- pause faulty Definition;
- quarantine compromised producer;
- drain and replay inbox backlog;
- repair outbox publication;
- rebuild projections without replaying business effects;
- reconcile one Character Achievement;
- correct source Event before unlock;
- open and resolve integrity case;
- purge public and secret caches;
- pause and resume Backfill Job;
- recover from database failover;
- restore backup with privacy tombstones;
- rotate evidence hashing or encryption keys;
- handle schema incompatibility;
- respond to duplicate Event id with changed payload;
- investigate suspected duplicate Reward trigger;
- perform regional failover;
- execute Character anonymization propagation.

### Appendix J — Document completion criteria

This RFC is complete when implementation teams can answer without undocumented assumptions:

- who owns Achievement progress and unlock;
- how a source Event becomes exact progress;
- how Definitions are versioned and activated;
- how duplicates and concurrency are handled;
- how secret Achievements remain secret;
- how an unlock triggers but does not own a Reward;
- how corrections work before and after unlock;
- how backfill and migration remain safe;
- how Character lifecycle affects evaluation and visibility;
- how the database guarantees one unlock;
- how users, support, security, and privacy teams inspect behavior;
- how the service scales and recovers;
- which tests prove production readiness.

> An Achievement is not a mutable badge flag. It is durable, explainable recognition of a Character milestone.
