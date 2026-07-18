---
document: 008-talent-engine
title: Talent Engine
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
related_documents:
  - 009-item-engine
  - 010-inventory-engine
  - 011-season-engine
---

# Talent Engine

> **Platform contract conformance:** all Event names, envelopes, Reward owner
> results, Season facts, and effect-set consumers MUST conform to
> `002a-platform-contract-standard` and `002b-cross-engine-integration`.

## Executive Summary

The Talent Engine is the authoritative platform component for defining, publishing, granting, ranking, activating, equipping, evaluating, and presenting persistent Character capabilities.

A Talent is a durable capability owned by a Character. It may represent mastery, specialization, permission, passive modifier, active Skill entitlement, or a bounded change to how another platform mechanic interprets future actions. A Talent is not Experience, a Level, an Achievement, a Quest, an Item, a generic feature flag, an arbitrary script, or a business-domain role. Talents describe what a Character has permanently learned or unlocked; Skills describe explicitly activatable capabilities governed by activation rules, charges, cooldowns, and effect contracts.

The Engine owns:

- immutable published Talent Definition versions;
- immutable published Skill Definition versions;
- Talent Tree Definitions, versions, Editions, nodes, ranks, prerequisites, paths, exclusions, and presentation metadata;
- Character Talent Portfolio state;
- permanent Talent unlock and rank-acquisition history;
- Talent-resource pools when the resource exists solely to acquire Talents;
- Talent loadouts and activation selections where a Talent must be equipped to contribute effects;
- Skill unlock, activation, charge, cooldown, and activation-receipt state;
- compiled declarative effect descriptors and authoritative effective-effect-set revisions;
- local eligibility projections needed to evaluate Talent prerequisites safely;
- exact evidence, operation history, audit records, replay, migration, reconciliation, and repair workflows;
- read projections for owner, public profile, internal consumers, support, and administration.

The Engine does not own Character identity, Experience, Levels, Prestige, Reward decisions, Achievement evaluation, Quest progress, Items, Inventory, Currency, Reputation, Seasons, notifications, payment state, learning records, or business-domain truth. It does not directly mutate foreign aggregates. When a Talent or Skill changes the future interpretation of another Engine, the Talent Engine publishes a typed and versioned effect-set Event. The receiving owner Engine decides how that contract affects its own state and remains the only writer of that state.

Reward Engine integration follows the platform ownership boundary. A Reward Definition may include a typed `TALENT_UNLOCK`, `TALENT_RANK_GRANT`, `SKILL_UNLOCK`, or `TALENT_RESOURCE_GRANT` component. Reward Engine publishes `reward.fulfillment.requested.v1`; Talent Engine validates and applies the component idempotently, then publishes `reward.fulfillment.succeeded.v1` or `reward.fulfillment.failed.v1`. Reward Engine owns the Reward Grant saga; Talent Engine owns the Talent-side effect and receipt. A Talent may also be acquired by spending a Talent-owned resource through a Character command, subject to immutable Tree Edition policy.

Published Talent content is data, not executable code. The effect language is a bounded typed contract registry. Arbitrary source code, SQL, expression-language escape hatches, remote callbacks, client-authored formulas, unregistered target fields, and dynamic code loading are prohibited. New effect semantics require an explicit contract, an owning consumer, compatibility rules, cycle analysis, security review, operational limits, and usually an ADR.

The Engine is designed around the following invariants:

1. Only the Talent Engine may write Character Talent, Skill, Talent-resource, loadout, cooldown, and Talent effect-set state.
2. A published Talent, Skill, or Talent Tree version is immutable.
3. Every permanent unlock and rank acquisition is append-only and traceable to a command, Reward fulfillment, migration, or approved repair.
4. A permanent Talent unlock is never silently removed, downgraded, or rewritten.
5. A Character cannot acquire a rank unless all prerequisites, scope rules, rank-order rules, and Edition policies are satisfied at the same authoritative decision point.
6. The same logical acquisition or Reward fulfillment has at most one durable effect, despite retries, replay, concurrency, or regional redelivery.
7. Talent-owned resource balances cannot become negative.
8. Talent cost reservation, acquisition, ledger entry, effect-set revision, and outbox publication are atomic.
9. A Talent may influence a foreign Engine only through a registered typed effect contract or a published capability fact.
10. Talent Engine never writes Experience, Quest, Achievement, Inventory, Reputation, Character profile, or Reward state.
11. An effect-set revision is a complete deterministic projection for a defined scope, not an unbounded sequence of imperative side effects.
12. Consumers must be able to deduplicate and order effect-set revisions by Character, scope, and monotonic revision.
13. Progression amounts reaching Progression Engine remain finalized integers; any Talent modifier to an Experience Reward is resolved before the Progression operation is applied.
14. Active Skill activation is accepted only against a published Skill version, an owned unlock, an allowed loadout, a valid Character lifecycle state, sufficient charges, and an expired cooldown.
15. A Skill activation request is not proof that a business-domain action succeeded. It produces a capability activation fact; the relevant Module or Engine validates its own business action.
16. Client clocks are never authoritative for cooldown, expiry, occurrence, or activation ordering.
17. Hidden Talents, unrevealed branches, secret prerequisites, and private loadouts are protected server-side.
18. Eligibility based on foreign state uses versioned local projections or explicit signed snapshots; direct foreign-database reads are prohibited.
19. Runtime evaluation is deterministic for the same Definition versions, Portfolio state, projection versions, occurrence context, command fingerprint, and server time basis.
20. Floating-point arithmetic is prohibited in authoritative costs, ranks, charges, durations, and numeric modifiers.
21. Definition dependency graphs and effect dependency graphs must be finite and acyclic within the declared evaluation layer.
22. Loadout mutations use optimistic concurrency and produce a single new effective-effect-set revision.
23. Character suspension, closure, or anonymization is enforced fail-closed using Character lifecycle projections.
24. Historical acquisitions remain interpretable after content retirement because state stores immutable version identifiers and fingerprints.
25. Definition retirement prevents new acquisition but does not erase existing ownership.
26. Exceptional invalidation uses a visible integrity workflow and never destroys the original acquisition ledger.
27. Administrative repair cannot bypass audit, idempotency, authorization, or effect recomputation.
28. When correctness and availability conflict, the Engine prefers delayed acquisition, activation rejection, quarantine, or stale-but-labeled reads over duplicate ownership, negative balances, cooldown bypass, or inconsistent foreign effects.

This RFC is normative for Talent Engine ownership, terminology, content lifecycle, Character Portfolio lifecycle, rank and resource semantics, Skill activation, effect contracts, Event contracts, persistence, APIs, authoring, administration, UX, security, privacy, performance, auditability, edge cases, and production acceptance tests.

---

## Purpose

The purpose of this document is to define a production-ready specification for the Talent Engine of Progression Platform.

It establishes:

- the authoritative boundary between Talent state and the state owned by other Engines;
- canonical language for Talent, Skill, Talent Tree, node, rank, unlock, acquisition, resource, loadout, effect, activation, charge, cooldown, and integrity;
- immutable Definition, version, Edition, publication, retirement, and migration semantics;
- deterministic prerequisite and cost evaluation;
- permanent acquisition and rank progression rules;
- data-driven passive and active capability semantics;
- bounded cross-Engine effect contracts;
- typed Reward fulfillment integration;
- exact idempotency, concurrency, replay, correction, and reconciliation behavior;
- Character lifecycle handling;
- consumed and produced Events;
- owner, public, internal, support, and administrative read models;
- command models and write ownership;
- a reference PostgreSQL schema;
- external and internal API contracts;
- content authoring, simulation, review, publication, repair, and incident workflows;
- security, privacy, performance, audit, and observability requirements;
- acceptance tests sufficient for implementation and production release.

The specification is domain-agnostic. A historical fencing school may define Talents such as footwork mastery, coaching permission, or tournament readiness. A fitness product may define recovery discipline or movement specialization. An education product may define research methods or mentor capability. A gaming community may define moderation powers or event-hosting Skills. These are content examples only. The Engine core must operate on canonical Definitions, registered facts, typed effects, immutable Events, and Character-scoped Portfolio state.

### Normative language

The key words **MUST**, **MUST NOT**, **REQUIRED**, **SHALL**, **SHALL NOT**, **SHOULD**, **SHOULD NOT**, **RECOMMENDED**, **MAY**, and **OPTIONAL** are normative requirement levels.

An implementation that allows a Module, client, administrator, Reward Engine, Progression Engine, or analytics process to mutate Talent-owned rows directly violates this RFC unless an approved ADR explicitly replaces the ownership model.

### Design posture

Version 1 should favor:

- a relational authoritative store;
- append-only acquisition and resource ledgers;
- transactional inbox and outbox patterns;
- immutable published configuration;
- precompiled prerequisite and effect plans;
- local projections of foreign eligibility facts;
- optimistic concurrency on Character Portfolio and loadouts;
- at-least-once Event delivery with exactly-once logical effect;
- server-authoritative cooldown and activation processing;
- explicit reconciliation and resumable migration jobs;
- bounded effect semantics with target-owner governance;
- separate write models and purpose-specific read projections.

Version 1 does not require an arbitrary rules engine, general ability scripting runtime, distributed transaction, globally synchronous modifier service, combat simulator, feature-flag system, or real-time frame-based game engine.

---

## Goals

### G-1. Authoritative Talent ownership

Provide one authoritative writer for Talent and Skill Definitions, Character unlocks, ranks, Talent-owned resources, loadouts, activations, charges, cooldowns, and effective effect sets.

### G-2. Persistent meaningful capability

Represent durable Character growth as understandable capabilities, specializations, permissions, and play-style choices rather than as disconnected numeric bonuses.

### G-3. Platform independence

Support schools, fitness, education, communities, marketplaces, and future domains without embedding module-specific vocabulary or logic in the Engine.

### G-4. Data-driven content

Allow authorized content teams to define Talent Trees, prerequisites, costs, ranks, Skills, loadouts, and registered effects through validated configuration.

### G-5. Immutable publication

Guarantee that published versions remain immutable and that historical ownership always references the exact content that was acquired.

### G-6. Deterministic acquisition

Ensure that identical authoritative inputs produce identical eligibility, cost, acquisition, and effect outcomes.

### G-7. Permanent ownership

Preserve the history and meaning of acquired Talents. Retirement or content evolution must not silently erase Character capability.

### G-8. Safe cross-Engine influence

Enable Talents to influence future Reward, Quest eligibility, Character presentation, Module permissions, and other registered consumers without violating aggregate ownership.

### G-9. Typed Reward fulfillment

Apply Talent-related Reward components through idempotent typed fulfillment contracts while preserving Reward Engine saga ownership.

### G-10. Active Skill lifecycle

Support server-authoritative Skill unlock, activation, charges, cooldowns, loadout constraints, and activation receipts.

### G-11. Explainability

Answer why a Talent was eligible, ineligible, acquired, rejected, active, suppressed, or contributing an effect using exact versions, evidence, costs, and decisions.

### G-12. Replay safety

Tolerate duplicate, delayed, out-of-order, and replayed Events without duplicate unlocks, double spending, charge corruption, or repeated activations.

### G-13. Horizontal scalability

Partition Character runtime workloads by Character while allowing Definitions and compiled plans to be cached globally.

### G-14. Operational repairability

Provide reconciliation, projection rebuild, effect recomputation, migration, and controlled repair without direct database mutation.

### G-15. Privacy-aware presentation

Support private, owner-only, public, and hidden Talent presentation without leaking secret content or unrelated personal data.

### G-16. Evolution without semantic drift

Allow new Definitions and registered effect types to be introduced while retaining compatibility and explicit migration policy.

### G-17. Consumer independence

Ensure foreign Engines can consume Talent facts and effect revisions asynchronously and remain independently deployable.

### G-18. Production observability

Expose metrics, traces, audit records, dead-letter states, projection lag, effect convergence, and cooldown processing health.

---

## Non Goals

### NG-1. Character identity

Character creation, ownership, suspension, closure, anonymization, profile data, and visibility defaults belong to Character Engine.

### NG-2. Progression ownership

Experience, Levels, Tracks, Prestige, and their ledgers belong to Progression Engine. Talent Engine may consume progression facts for prerequisites but never edits progression.

### NG-3. Reward decision ownership

Reward Definitions, Trigger Bindings, claims, fulfillment orchestration, and Reward Grant saga state belong to Reward Engine.

### NG-4. Quest and Achievement evaluation

Talent Engine does not evaluate Quest Objectives or Achievement Conditions. It may publish Talent facts that those Engines consume.

### NG-5. Inventory and Item ownership

Items, stacks, equipment ownership, inventory capacity, durability, and Item Definitions belong to Item and Inventory Engines. A Talent loadout is not an Item equipment loadout.

### NG-6. Generic currency ledger

Gold, credits, loyalty points, or spendable business currencies do not belong here. Talent-owned resources exist only when their sole semantic purpose is Talent acquisition or Skill use.

### NG-7. Business permissions system

Talents may publish capability facts, but they do not replace business authorization, RBAC, licensing, safeguarding, or legal approval systems. A Module remains responsible for enforcing its own protected operation.

### NG-8. Arbitrary modifier scripting

The Engine does not execute untrusted scripts, formulas, SQL, templates with side effects, remote hooks, or user-authored code.

### NG-9. Combat or simulation engine

Skill activation is an auditable capability event, not a combat-resolution, physics, animation, or real-time simulation system.

### NG-10. Notification delivery

The Engine publishes lifecycle Events and read models. Notification delivery belongs to a Notification Engine or client.

### NG-11. Season ownership

Season schedules, state, and content activation windows belong to Season Engine. Talent Editions may reference Season context through typed projections.

### NG-12. General feature flags

Operational flags and product rollout controls belong to configuration or feature-management systems. A Talent is Character-owned progression, not an internal rollout mechanism.

### NG-13. Social graph ownership

Friendships, guild membership, teams, and social moderation structures do not belong to Talent Engine, although local projections may be used as prerequisites when a registered contract exists.

### NG-14. Client-authoritative ownership or cooldown

Clients cannot declare a Talent unlocked, resource spent, Skill activated, charge consumed, or cooldown completed.

### NG-15. Silent respec

Version 1 does not support arbitrary user-driven removal, refund, or downgrade of permanently acquired Talents. Reversible allocation is a future capability requiring explicit semantics.

### NG-16. Cross-Engine synchronous transaction

The Engine does not attempt a distributed ACID transaction across Reward, Progression, Quest, Inventory, Character, or Module databases.

---

## Responsibilities

### R-1. Definition management

The Engine owns authoring, validation, publication, retirement, and immutable versioning for:

- Talent Definitions;
- Talent ranks;
- Skill Definitions;
- Talent Tree Definitions;
- Tree nodes and edges;
- Tree Editions;
- Talent-owned resource definitions;
- loadout definitions;
- prerequisite plans;
- effect descriptors;
- localization and presentation references.

### R-2. Definition compilation

The Engine compiles published content into bounded runtime plans, validates schemas and references, calculates canonical fingerprints, detects cycles, and rejects unsupported semantics before publication.

### R-3. Character Talent Portfolio

The Engine creates and maintains one logical Portfolio per Character and realm. The Portfolio contains acquired ranks, Skills, resource accounts, loadouts, suppressions, integrity states, and effect-set revisions.

### R-4. Eligibility evaluation

The Engine evaluates acquisition prerequisites using:

- current Portfolio state;
- immutable Definition versions;
- local projections of registered foreign facts;
- Edition and availability context;
- explicit scope and occurrence policy;
- Character lifecycle state;
- server time where time is part of policy.

### R-5. Cost processing

For Talent-owned resources, the Engine atomically reserves and spends exact integer or fixed-precision amounts. Foreign costs are unsupported in a direct acquisition transaction unless a future saga contract is approved.

### R-6. Permanent acquisition

The Engine records Talent unlocks and rank acquisitions as immutable operations with exact source, cost, prerequisite snapshot, content version, and resulting effect-set revision.

### R-7. Reward component fulfillment

The Engine consumes typed Talent-related Reward fulfillment requests and returns idempotent typed results.

### R-8. Loadout management

Where content requires activation slots, the Engine validates and stores Character loadouts, exclusivity, capacity, and slot constraints using optimistic concurrency.

### R-9. Effective effect-set calculation

The Engine derives the complete active effect set from acquired ranks, loadouts, Character restrictions, Editions, suppressions, and effect compatibility rules.

### R-10. Effect publication

The Engine publishes monotonic effect-set revisions and capability facts to registered consumers. It does not imperatively apply effects to foreign state.

### R-11. Skill lifecycle

The Engine owns Skill unlocks, loadout eligibility, activation validation, charges, cooldown start, cooldown completion semantics, and activation receipts.

### R-12. Character lifecycle enforcement

The Engine consumes Character lifecycle Events, blocks acquisition and activation when required, and produces effect-set updates when restrictions suppress active capabilities.

### R-13. Read projections

The Engine produces optimized owner, public, internal eligibility, effect consumer, support, directory, and administration projections.

### R-14. Audit and explanation

The Engine stores immutable ledgers, decision traces, source evidence references, fingerprints, aggregate versions, actor identity, and correlation metadata.

### R-15. Replay, migration, and reconciliation

The Engine provides bounded, resumable workflows for inbox replay, projection rebuild, content migration, effect recomputation, cooldown reconciliation, and integrity repair.

### R-16. Governance

The Engine enforces publication review, effect-contract registration, permission separation, secret-content controls, and high-risk administrative approvals.

### Responsibility matrix

| Concern | Authoritative owner | Talent Engine behavior |
|---|---|---|
| Character lifecycle | Character Engine | Consumes lifecycle projection and fails closed. |
| Experience and Levels | Progression Engine | Consumes facts for prerequisites only. |
| Reward Grant saga | Reward Engine | Applies typed Talent-side components and returns receipts. |
| Achievement state | Achievement Engine | Consumes unlock facts for prerequisites. |
| Quest state | Quest Engine | Consumes completion or assignment facts for prerequisites. |
| Item definition | Item Engine | May consume Item ownership facts, never writes them. |
| Inventory ownership | Inventory Engine | May consume inventory facts, never writes them. |
| Talent definition and ownership | Talent Engine | Owns. |
| Skill unlock, activation, cooldown | Talent Engine | Owns in version 1. |
| Reputation | Reputation Engine | Consumes facts only. |
| Season schedule | Season Engine | Consumes active occurrence context. |
| Business action validity | Business Module | Trusts registered facts; does not revalidate the real-world action. |
| Module authorization | Business Module or authorization service | Publishes capability facts but is not the final legal authorization source. |
| Notifications | Notification Engine/client | Publishes Events only. |

---

## Dependencies

### Required platform dependencies

#### Event Bus

The Event Bus provides authenticated, durable, at-least-once delivery, partition ordering where configured, schema registration, dead-letter routing, and replay controls.

#### Character Engine

Talent Engine requires Character lifecycle facts and stable `character_id`. It must not query or mutate Character tables directly.

#### Identity and Authorization

User and service authentication, principal identity, role claims, and policy enforcement are required for commands and administration.

#### Relational Storage

The authoritative store must support transactions, unique constraints, foreign keys within the Engine boundary, row-level locking or equivalent optimistic concurrency, JSON validation strategy, and durable indexes.

#### Schema Registry

Inbound and outbound Event payloads, Reward component payloads, effect descriptors, Definition schemas, and API representations require versioned contracts.

#### Clock Service

Server-authoritative UTC time is required for Edition windows, Skill cooldowns, charge regeneration, and operation timestamps. Implementations should use monotonic elapsed time internally where available while persisting UTC boundaries.

#### Object Storage

Large authoring packages, simulation reports, export artifacts, and archived audit bundles may be stored outside the transactional database using immutable references.

### Logical upstream dependencies

Talent Engine may consume typed Events from:

- Character Engine;
- Progression Engine;
- Reward Engine;
- Achievement Engine;
- Quest Engine;
- Item and Inventory Engines;
- Reputation Engine;
- Season Engine;
- trusted Business Modules;
- approved entitlement or membership providers.

These are asynchronous logical dependencies, not synchronous database dependencies.

### Logical downstream consumers

The following may consume Talent Events and projections:

- Reward Engine;
- Quest Engine;
- Achievement Engine;
- Character profile projection;
- Business Modules;
- authorization or eligibility services;
- Notification Engine;
- analytics and data platform;
- search and directory projections;
- support and administration tools.

### Forbidden dependencies

The Engine MUST NOT:

- write another Engine's database;
- require synchronous reads from Progression, Reward, Quest, Achievement, Inventory, Reputation, Season, or Module databases for a normal acquisition or activation;
- execute arbitrary code from Definition payloads;
- trust client clocks or client-calculated prerequisites;
- depend on analytics tables for authoritative decisions;
- treat a cache as authoritative ownership state;
- call a Business Module to verify a historical Event during the transaction;
- publish raw secrets, personal profile data, or unrestricted prerequisite details;
- make Reward completion depend on a synchronous callback;
- allow a foreign Engine to edit Talent rows.

### Availability posture

If a required local foreign-state projection is unavailable or stale beyond policy:

- acquisitions whose prerequisites depend on that projection MUST fail closed with a retryable outcome;
- pure reads MAY return a labeled stale projection;
- Skill activation MAY proceed only if its validation does not depend on stale foreign facts and Character lifecycle state is fresh;
- Reward fulfillment MUST return retryable failure rather than assume eligibility;
- administrative repair MUST remain available through a separate controlled path.

### Dependency versioning

Every consumed contract must declare:

- Event type and schema version;
- producer allowlist;
- subject and aggregate semantics;
- ordering expectations;
- correction behavior;
- retention and replay behavior;
- projection freshness policy;
- compatibility window;
- deprecation owner.

---

## Architecture Overview

### High-level flow

```text
Authoring / Admin
      │
      ▼
Definition Validation ──► Compilation ──► Immutable Publication
                                             │
Trusted Events / Commands                    │
      │                                      │
      ▼                                      ▼
Authenticated Ingress                  Definition Cache
      │                                      │
      ▼                                      │
Transactional Inbox                          │
      │                                      │
      ├──► Character / Foreign Fact Projections
      │
      ▼
Portfolio Command Router
      │
      ├──► Acquire Talent / Rank
      ├──► Fulfill Reward Component
      ├──► Grant Talent Resource
      ├──► Update Loadout
      ├──► Activate Skill
      └──► Repair / Recompute
      │
      ▼
Character Talent Portfolio Aggregate
      │
      ├──► Acquisition Ledger
      ├──► Resource Ledger
      ├──► Skill Activation Ledger
      ├──► Effective Effect Set
      ├──► Audit Log
      └──► Transactional Outbox
                    │
                    ▼
             Event Bus / Projections
                    │
       ┌────────────┼───────────────┐
       ▼            ▼               ▼
Reward Engine   Other Engines   Client Read Models
```

### Component model

#### Definition Service

Owns draft lifecycle, validation, review, publication, retirement, localization references, immutable version storage, and fingerprints.

#### Compiler

Transforms validated Talent, Skill, and Tree configuration into runtime plans. Compilation resolves references, topologically sorts prerequisite graphs, normalizes numeric values, validates effect contracts, and emits a deterministic fingerprint.

#### Event Ingress

Authenticates producers, validates envelopes and payload schemas, enforces replay policy, persists inbox records, and routes accepted Events.

#### Command API

Accepts owner, trusted service, Reward fulfillment, and administrative commands. It applies authorization, idempotency, canonicalization, and optimistic concurrency before aggregate execution.

#### Portfolio Processor

Serializes or safely coordinates Character-scoped mutations, evaluates prerequisites, validates costs, applies acquisitions, changes loadouts, activates Skills, and advances aggregate versions.

#### Resource Ledger

Stores Talent-owned resource grants, reservations, spends, expirations where allowed, reversals, and balances using exact arithmetic.

#### Effect Resolver

Builds a deterministic active effect set from owned ranks, loadouts, restrictions, and Definition plans. It emits a complete revision per scope and stores a content hash.

#### Skill Runtime

Validates unlock, loadout, target context, charges, cooldown, activation idempotency, and produces activation receipts and lifecycle Events.

#### Projection Workers

Build owner, public, internal, support, directory, effect-consumer, and analytics-safe projections from authoritative outbox or change stream.

#### Timer and Reconciliation Workers

Process cooldown visibility, regenerating charges, Edition transitions, stale pending operations, effect convergence, inbox retries, and projection repair. Timers never bypass aggregate invariants.

#### Administration and Support Service

Provides inspected, audited workflows for simulation, migration, repair, suppression, invalidation, restoration, and evidence review.

### Partitioning

Runtime state should be partitioned by `character_id` or a stable hash of it. All operations that mutate one Character Portfolio use the same partition key. Definition publication uses a separate content partition.

Cross-Character atomic mutation is prohibited in version 1. Bulk grants are represented as resumable jobs that issue independent Character-scoped operations.

### Consistency model

Within one Portfolio transaction, the following are strongly consistent:

- rank ownership;
- Talent-resource balances;
- loadout state;
- Skill charges and cooldown state;
- acquisition and activation ledgers;
- effective effect-set revision;
- inbox outcome;
- outbox records.

Across Engines and read projections, consistency is eventual. APIs must expose projection revision and freshness where it changes user interpretation.

### Delivery semantics

Transport delivery is at least once. Logical effects are exactly once through:

- immutable operation identifiers;
- canonical request fingerprints;
- inbox uniqueness;
- Reward `fulfillment_id` uniqueness;
- acquisition source uniqueness;
- activation idempotency keys;
- aggregate version checks;
- database constraints;
- transactional outbox;
- deterministic accepted-no-op responses.

### Command/Event separation

A command requests a future decision or mutation and may be rejected. An Event states an immutable fact that already occurred.

Examples:

- `AcquireTalentRank` is a command;
- `talent.rank.acquired.v1` is an Event;
- `ActivateSkill` is a command;
- `skill.activated.v1` is an Event;
- `reward.fulfillment.requested.v1` is an Event carrying another Engine's durable request, but Talent Engine still validates and applies its owned component;
- `progression.level.changed.v1` is a fact projected for prerequisites.

### Cross-Engine effect model

The Engine supports three influence patterns:

1. **Capability facts.** Consumers react to durable facts such as `talent.unlocked.v1` or `skill.unlocked.v1`.
2. **Effective effect-set revisions.** Consumers project a complete typed set such as Reward calculation modifiers or Module capability grants.
3. **Skill activation facts.** Consumers decide how an accepted activation affects their owned business operation.

The Engine does not send imperative database mutations to consumers except through the Reward fulfillment protocol when it is the receiving owner.

### Effect convergence

Each effect set is identified by:

- `character_id`;
- `effect_scope`;
- monotonic `effect_revision`;
- complete ordered list of typed effects;
- source Talent version references;
- effective-from timestamp;
- fingerprint.

A consumer replaces its previous projection for the same Character and scope only when the incoming revision is greater. Missing revisions trigger reconciliation but do not require processing every intermediate revision if the latest complete snapshot is available.

### Failure strategy

Failures are classified as:

- deterministic rejection;
- accepted no-op;
- retryable dependency failure;
- optimistic concurrency conflict;
- quarantined contract conflict;
- terminal configuration failure;
- integrity incident;
- projection lag;
- infrastructure failure.

The Engine must never convert an unknown outcome into a second spend or activation. A timed-out caller retries with the same idempotency key.

---

## Canonical Definitions

This section extends the platform Domain Definition for Talent Engine. These terms are normative. Synonyms in APIs, Events, schemas, code, and administration should be avoided.

### Talent

A persistent Character-owned capability represented by a logical Talent Definition and one or more immutable versions.

A Talent may contribute:

- a passive effect;
- a capability fact;
- access to a Skill;
- eligibility for other content;
- a presentation marker;
- a loadout-selectable specialization;
- one or more ranked improvements.

A Talent is not the same as the Event or Reward that caused its acquisition.

### Talent Definition

The stable logical identity of a Talent across versions. It is identified by a globally unique `talent_key`, for example `platform.mentorship` or `school.footwork_control`.

The logical Definition contains governance metadata. Runtime behavior always references a specific immutable Talent Version.

### Talent Version

An immutable published representation of a Talent Definition. It contains rank structure, prerequisites, effects, presentation references, visibility, acquisition policy, and compatibility metadata.

A version identifier is never reused. Draft edits do not mutate a published version.

### Talent Rank

An ordered acquisition level inside a Talent Version. Rank numbers start at `1` and are contiguous. Rank `n` may require rank `n-1` and may add, replace, or strengthen typed effects according to explicit stacking policy.

### Rank Acquisition

The immutable fact that a Character acquired a specific rank of a specific Talent Version through an authorized operation.

### Talent Unlock

The first successful Rank Acquisition for a Talent. A single-rank Talent unlocks and reaches maximum rank in one operation.

### Skill

An explicitly activatable Character capability with server-authoritative activation rules. A Skill may have charges, a cooldown, loadout requirements, target-context schema, and one or more activation effect descriptors.

### Skill Definition

The stable logical identity of a Skill across immutable versions.

### Skill Version

An immutable published Skill contract containing activation, cooldown, charge, visibility, loadout, and effect semantics.

### Skill Unlock

The durable Character entitlement to use a specific Skill according to its current valid policy. The unlock may originate from a Talent rank, Reward component, migration, or approved administration operation.

### Skill Activation

An accepted Character-scoped operation that consumes required charges, starts or extends cooldown, records context, and emits `skill.activated.v1` atomically.

An activation does not assert that a downstream business operation succeeded.

### Cooldown

A server-authoritative period during which a Skill cannot be activated again under the same cooldown scope.

### Charge

An exact unit consumed by Skill activation. Charges may be fixed, granted, regenerated, or reset according to a bounded policy.

### Charge Account

The Skill-owned state containing current charges, maximum charges, regeneration anchor, and ledger references for one Character and charge scope.

### Talent Tree

A curated, directed, acyclic content structure that organizes Talent nodes, prerequisites, paths, and acquisition resources.

A Tree is a presentation and acquisition structure. The underlying Talent ownership remains in the Character Portfolio.

### Talent Tree Definition

The stable logical identity of a Talent Tree.

### Talent Tree Version

An immutable graph referencing exact Talent Versions, resource policy, node metadata, prerequisites, exclusions, loadout policy, and presentation structure.

### Talent Tree Edition

An immutable runtime release of one Talent Tree Version into a realm, audience, Season, Module context, or availability window.

An Edition determines whether new acquisitions are available. It does not erase already acquired Talents when it ends.

### Talent Node

A node in a Talent Tree Version that references a Talent rank, Skill unlock, or explicit structural checkpoint. Version 1 should prefer one node per acquirable Talent rank.

### Prerequisite

A typed condition that must be satisfied for an acquisition, activation, loadout change, or Edition participation.

Prerequisites may reference:

- prior Talent ranks;
- Progression facts;
- Achievement facts;
- Quest facts;
- Item or Inventory facts;
- Reputation facts;
- Season or Module facts;
- Character attributes exposed through approved projections;
- server time or occurrence context;
- explicit entitlement facts.

Prerequisites cannot execute arbitrary code.

### Acquisition Policy

The immutable rules that determine how a Talent rank may be acquired. Supported modes include:

- `RESOURCE_SPEND`;
- `REWARD_ONLY`;
- `DIRECT_GRANT_ONLY`;
- `AUTOMATIC_ON_ELIGIBILITY` where explicitly allowed;
- `MIXED` with a deterministic precedence policy.

### Talent Resource

A Character-owned, Engine-scoped resource used exclusively for Talent or Skill acquisition or use. Examples include Talent Points or Mastery Tokens when they have no meaning outside Talent Engine.

### Talent Resource Definition

The immutable contract for a resource key, precision, scope, expiry behavior, grant sources, spend policy, and presentation.

### Resource Account

The authoritative balance state for one Character, resource key, realm, and optional scope such as Tree Edition or Season.

### Resource Ledger Entry

An append-only record of grant, reservation, spend, release, expiry, correction, or reversal affecting a Resource Account.

### Reservation

A temporary exact hold against a Talent Resource used only when an acquisition workflow requires asynchronous completion. Normal local acquisition should spend atomically and does not require a long-lived reservation.

### Talent Portfolio

The Character-scoped aggregate containing all Talent-owned runtime state for a realm.

### Talent Ownership

The derived collection of valid acquired Talent ranks and Skill unlocks held by a Character.

### Loadout

A named or typed ordered selection of acquired Talents and Skills that are active for a defined effect scope.

### Loadout Definition

A versioned contract defining slots, capacities, accepted categories, exclusivity groups, default behavior, and visibility.

### Slot

A position in a Loadout accepting a bounded set of Talent or Skill references.

### Equipped Talent

An acquired Talent whose loadout-dependent effects are currently active in a specific scope.

### Active Effect

A typed effect descriptor currently included in an effective effect set after ownership, rank, loadout, restriction, suppression, and compatibility evaluation.

### Effect Definition

A typed declarative descriptor attached to a Talent rank or Skill Version. It names an effect contract, target scope, operation, value, stacking behavior, priority, and consumer compatibility version.

### Effect Type

A registered schema and semantic contract, such as:

- `REWARD_AMOUNT_MODIFIER`;
- `REWARD_ELIGIBILITY_CAPABILITY`;
- `QUEST_ELIGIBILITY_FACT`;
- `MODULE_CAPABILITY`;
- `CHARACTER_PRESENTATION_ENTITLEMENT`;
- `SKILL_ACTIVATION_CAPABILITY`;
- `COOLDOWN_MODIFIER` within Talent Engine;
- future approved types.

The name alone is not sufficient; every type has a versioned schema and owner.

### Effect Scope

The bounded consumer domain for an effect set, for example `reward-calculation`, `module:school`, `character-presentation`, or `talent-runtime`.

### Effect Set

The complete deterministic collection of currently active typed effects for one Character and Effect Scope.

### Effect Revision

A monotonic Character-and-scope sequence number assigned whenever the effective Effect Set changes.

### Effect Fingerprint

A canonical cryptographic hash of the ordered normalized Effect Set and its source version references.

### Stacking Policy

The declared deterministic rule for combining compatible effects of the same type and target. Supported policies may include:

- `ADDITIVE_FIXED`;
- `MULTIPLICATIVE_BASIS_POINTS` with defined order;
- `MAXIMUM`;
- `MINIMUM`;
- `HIGHEST_PRIORITY_ONLY`;
- `SET_UNION`;
- `DENY_OVERRIDES_ALLOW` where security-reviewed;
- `NON_STACKING`.

Every policy uses exact arithmetic and a canonical ordering.

### Suppression

A temporary state that prevents an owned Talent or Skill from contributing effects or being activated without deleting ownership.

Suppression may result from Character lifecycle, content integrity, policy, incompatible Edition state, or approved administration.

### Retirement

A Definition or Edition lifecycle state that prevents new use or acquisition while preserving historical interpretation and existing ownership according to policy.

### Integrity State

A separate classification indicating whether ownership or activation history is considered valid, contested, invalidated, or restored.

Canonical values:

- `VALID`;
- `CONTESTED`;
- `INVALIDATED`;
- `RESTORED` as an audit transition leading to `VALID`.

### Acquisition Source

The immutable origin of a rank or Skill acquisition, such as Reward fulfillment, resource spend, migration, support repair, or direct trusted grant.

### Evidence Snapshot

A minimized immutable record of prerequisite facts, projection versions, and source references used for an acquisition decision.

### Decision Trace

A structured explanation of a command outcome, including evaluated prerequisites, costs, content versions, restriction state, and rejection codes.

### Operation

An idempotent command or Event handling attempt with a stable operation identifier and canonical request fingerprint.

### Accepted No-op

A successful idempotent response indicating that the requested logical effect already exists with the same fingerprint.

### Conflict

A request using an existing idempotency identifier with a different canonical fingerprint.

### Portfolio Revision

A monotonic version of the Character Talent Portfolio aggregate.

### Projection Revision

A monotonic version of a purpose-specific read model. It is not necessarily identical to Portfolio Revision.

### Realm

A platform partition or policy context in which content, ownership, and effects are interpreted. Version 1 defaults to `global` unless multi-realm behavior is explicitly enabled.

### Scope Key

A canonical string identifying the exact context of a resource, cooldown, loadout, Edition, or effect.

### Definition Fingerprint

A cryptographic hash of the canonical immutable published Definition payload and resolved references.

### Content Package

A reviewed set of Talent, Skill, Tree, resource, loadout, and localization artifacts intended for coordinated publication.

---

## Lifecycle

Talent Engine contains several related but independent lifecycles. Implementations must not collapse them into one generic `status` field.

### Talent Definition lifecycle

Canonical states:

- `DRAFT`;
- `IN_REVIEW`;
- `APPROVED`;
- `PUBLISHED`;
- `RETIRED`;
- `REJECTED`;
- `SUPERSEDED` as a derived relationship rather than a mutable replacement state where possible.

#### Transitions

```text
DRAFT ──submit──► IN_REVIEW
IN_REVIEW ──approve──► APPROVED
IN_REVIEW ──reject──► REJECTED
REJECTED ──revise as new draft──► DRAFT
APPROVED ──publish──► PUBLISHED
PUBLISHED ──retire──► RETIRED
```

A published version cannot return to draft or be edited. A correction requires a new version.

### Skill Definition lifecycle

Skill Definitions follow the same immutable publication lifecycle. A Skill Version may be retired independently from the Talent Version that originally granted it, but retirement policy must define whether existing owners may continue activation.

Supported retirement policies:

- `NO_NEW_UNLOCKS_EXISTING_USE_ALLOWED`;
- `NO_NEW_UNLOCKS_ACTIVATION_SUPPRESSED`;
- `EMERGENCY_DISABLED` requiring incident authority;
- `MIGRATE_TO_VERSION` through an explicit migration job.

### Talent Tree lifecycle

Tree Definition versions use:

- `DRAFT`;
- `IN_REVIEW`;
- `APPROVED`;
- `PUBLISHED`;
- `RETIRED`.

Publication validates all referenced Talent, Skill, Resource, Loadout, localization, and effect contracts.

### Talent Tree Edition lifecycle

Canonical Edition states:

- `PLANNED`;
- `SCHEDULED`;
- `ACTIVE`;
- `PAUSED`;
- `ENDED`;
- `CANCELLED`.

#### Rules

- `PLANNED` Editions are editable only by creating or replacing an unpublished Edition record.
- `SCHEDULED` Editions have an immutable content fingerprint and activation time.
- `ACTIVE` Editions allow acquisition according to policy.
- `PAUSED` prevents new acquisition but preserves ownership and normally preserves active effects.
- `ENDED` prevents new acquisition unless a grace policy explicitly allows completion of an already reserved operation.
- `CANCELLED` never becomes active.
- Edition state changes are Events and are independently auditable.

### Character Talent Portfolio lifecycle

Canonical states:

- `INITIALIZING`;
- `ACTIVE`;
- `RESTRICTED`;
- `CLOSED`;
- `ANONYMIZED`.

#### `INITIALIZING`

Created after `character.created.v1`. Definition defaults and projections may still be initializing. Acquisition and activation are blocked until initialization completes.

#### `ACTIVE`

Normal acquisition, loadout, and activation behavior is allowed.

#### `RESTRICTED`

Ownership remains intact, but acquisition, Skill activation, public visibility, or effect publication may be partially or fully suppressed according to Character restriction policy.

#### `CLOSED`

No user operations are accepted. Ownership is retained for restoration and audit. Effective effects are published as empty or restricted according to consumer contract.

#### `ANONYMIZED`

Personal links are removed or pseudonymized according to Character Engine privacy workflow. The Portfolio retains only the minimum non-personal technical history required by policy. It cannot return to `ACTIVE`.

### Talent ownership lifecycle

A Character Talent rank has these semantic states:

- `NOT_OWNED`;
- `ACQUIRED_VALID`;
- `ACQUIRED_CONTESTED`;
- `ACQUIRED_INVALIDATED`;
- `ACQUIRED_SUPPRESSED` as an effective state, not deletion;
- `MIGRATED` as an acquisition relationship, not removal.

Ownership history is append-only. `NOT_OWNED` is absence, not a row that is overwritten.

### Skill ownership lifecycle

Canonical states:

- `LOCKED`;
- `UNLOCKED`;
- `SUPPRESSED`;
- `RETIRED_USE_ALLOWED`;
- `RETIRED_DISABLED`;
- `INVALIDATED`.

### Skill activation lifecycle

An activation operation uses:

- `RECEIVED`;
- `VALIDATING`;
- `APPLIED`;
- `ACCEPTED_NOOP`;
- `REJECTED`;
- `RETRYABLE_FAILURE`;
- `QUARANTINED`.

The activation fact itself is immutable once `APPLIED`.

### Cooldown lifecycle

A cooldown record is derived as:

- `READY` when `server_now >= ready_at`;
- `COOLING_DOWN` when `server_now < ready_at`;
- `SUPPRESSED` when activation is unavailable regardless of time.

A background timer may publish `skill.cooldown.ready.v1` for UX, but readiness is determined from authoritative timestamps during activation, not from timer delivery.

### Resource account lifecycle

Canonical states:

- `OPEN`;
- `FROZEN`;
- `CLOSED`.

A frozen account cannot spend but may receive grants if policy permits. Closing requires zero active reservations and an explicit retention outcome.

### Loadout lifecycle

A loadout uses:

- `DRAFT` only for client-side composition, not authoritative server state;
- `ACTIVE` for the current authoritative selection;
- `SUPERSEDED` for prior revisions;
- `INVALID` when content changes make it incompatible;
- `REPAIRED` as an audit transition.

The server stores immutable revisions plus a pointer to the current revision.

### Effect-set lifecycle

Each Character-and-scope effect set progresses through monotonic revisions:

```text
revision 0: empty baseline
revision 1: first active effects
revision 2: loadout or acquisition change
revision 3: restriction suppression
revision 4: restoration
```

A revision is never mutated after publication. The latest authoritative revision pointer may advance only by one aggregate transaction, although consumers may skip intermediate complete snapshots.

### Reward fulfillment lifecycle inside Talent Engine

For each `fulfillment_id`:

- `RECEIVED`;
- `VALIDATING`;
- `APPLIED`;
- `ACCEPTED_NOOP`;
- `FAILED_RETRYABLE`;
- `FAILED_TERMINAL`;
- `QUARANTINED`.

The same `fulfillment_id` and payload fingerprint returns the original result. A conflicting fingerprint is quarantined and never applied.

### Migration lifecycle

Content or Character migrations use:

- `PLANNED`;
- `VALIDATED`;
- `APPROVED`;
- `RUNNING`;
- `PAUSED`;
- `COMPLETED`;
- `COMPLETED_WITH_EXCEPTIONS`;
- `FAILED`;
- `CANCELLED`.

Migrations are resumable, Character-scoped, rate limited, and produce per-Character immutable operation results.

### Integrity lifecycle

An acquisition may move:

```text
VALID ──contest──► CONTESTED
CONTESTED ──confirm invalid──► INVALIDATED
CONTESTED ──dismiss──► VALID
INVALIDATED ──restore──► VALID
```

The original acquisition record remains. Integrity transitions generate separate records and effect-set revisions.

---

## Aggregate

### Aggregate root

The runtime aggregate root is `CharacterTalentPortfolio` identified by:

```text
(character_id, realm_key)
```

A Character has at most one authoritative Portfolio per realm.

### Aggregate-owned entities

The Portfolio owns:

- Talent Rank Ownership records;
- Skill Ownership records;
- Talent Resource Accounts;
- Talent Resource Reservations;
- current Loadout pointers and immutable Loadout revisions;
- Skill Charge Accounts;
- Skill Cooldown state;
- acquisition operations;
- Skill activation operations;
- suppression and integrity state;
- current Effect Set pointers and immutable effect revisions;
- Portfolio ledger entries;
- linked inbox outcomes and outbox Events;
- decision traces and minimized evidence snapshots.

### Aggregate references

The Portfolio references but does not own:

- Character lifecycle versions;
- Talent Definition versions;
- Skill Definition versions;
- Talent Tree versions and Editions;
- Reward Grants and fulfillment identifiers;
- Progression, Achievement, Quest, Item, Inventory, Reputation, Season, Module, and entitlement facts;
- localization assets;
- media assets;
- actor identities.

### Aggregate invariants

#### Identity invariants

- `character_id` and `realm_key` are immutable.
- Portfolio Revision increases monotonically.
- A Portfolio can be created only for a known non-anonymized Character.

#### Rank invariants

- A Character has at most one acquisition for the same logical Talent rank and acquisition lineage.
- Rank numbers are contiguous and cannot skip unless the Definition explicitly defines a grant mode that atomically grants all missing ranks.
- Acquisition stores exact Talent Version and rank fingerprint.
- Maximum owned rank cannot exceed the published version maximum.
- A rank cannot be acquired from an unpublished or unavailable version except through approved migration or repair.

#### Resource invariants

- Available balance equals posted grants minus posted spends minus active reservations minus expirations plus releases and approved corrections.
- Available balance is never negative.
- Ledger amounts use exact integer minor units or fixed precision declared by Resource Definition.
- A spend and its acquisition commit in the same transaction for local acquisition.
- Expired resources cannot be spent.

#### Loadout invariants

- Every equipped reference is owned and valid for the Loadout Definition.
- Slot capacity and category constraints are satisfied.
- Exclusivity groups contain no more than the allowed count.
- A current Loadout revision is immutable after creation.
- Effect recomputation uses exactly one committed Loadout revision per scope.

#### Skill invariants

- A Skill may be activated only if unlocked and not suppressed.
- Required loadout membership is checked against the current committed revision.
- Current charges cannot exceed maximum or fall below zero.
- Activation cannot occur before `ready_at` for the relevant cooldown scope.
- One activation idempotency key maps to one canonical request fingerprint and one receipt.
- Charge consumption, cooldown update, activation ledger, effect-set changes if any, and outbox Event are atomic.

#### Effect invariants

- Every active effect is attributable to one or more valid owned sources.
- Effect types and schema versions are registered.
- Effect ordering and stacking are deterministic.
- Each Character-and-scope revision is unique and monotonic.
- A revision fingerprint uniquely represents normalized content.
- An effect cannot directly name a foreign database table or mutation endpoint.

#### Lifecycle invariants

- `CLOSED` and `ANONYMIZED` Portfolios reject user acquisition and activation.
- Character restriction changes cannot delete ownership.
- `ANONYMIZED` is irreversible.

#### Audit invariants

- Every mutation has actor, source, idempotency key, correlation id, causation id, request fingerprint, aggregate version, timestamp, and outcome.
- Direct SQL repair is prohibited.
- Administrative override records the original decision and the reason for override.

### Transaction boundaries

A normal resource-spend acquisition transaction includes:

1. lock or compare Portfolio Revision;
2. validate Portfolio and Character lifecycle;
3. resolve immutable Definition plans;
4. evaluate prerequisites against stored projection versions;
5. check idempotency;
6. validate resource balance;
7. append spend ledger entry;
8. append rank acquisition;
9. update ownership projection;
10. recompute affected effect scopes;
11. increment Portfolio Revision;
12. append audit record;
13. persist command outcome;
14. write outbox Events;
15. commit.

A Reward fulfillment acquisition follows the same boundary without resource spend and with a fulfillment receipt.

### Concurrency control

The reference implementation uses optimistic concurrency on `portfolio_version` plus unique constraints. Hot Characters may use a short row-level lock or partition-serialized command queue.

A concurrency conflict returns a retryable error and does not partially apply state. Callers retry with the same idempotency key and refreshed expected version.

### Aggregate size

The aggregate should not be loaded as one unbounded object. Implementations may use a logical aggregate with transactional relational tables and targeted queries. Required invariant data must remain in the same transactional boundary.

Old activation and ledger records may be partitioned or archived, but current balances, ownership, cooldowns, and latest effect pointers remain efficient to load.

### Cross-aggregate operations

Bulk grants, migrations, and content retirements are job aggregates that produce independent Character Portfolio operations. They never hold locks across multiple Characters.

---

## State Model

### Character Talent Portfolio state

```json
{
  "characterId": "uuid",
  "realmKey": "global",
  "portfolioState": "ACTIVE",
  "characterLifecycleState": "ACTIVE",
  "characterProjectionVersion": 42,
  "portfolioVersion": 128,
  "ownedTalentCount": 12,
  "ownedRankCount": 21,
  "unlockedSkillCount": 3,
  "currentLoadoutRevision": 18,
  "effectScopes": {
    "reward-calculation": 31,
    "module:school": 14,
    "character-presentation": 7
  },
  "createdAt": "2026-07-18T12:00:00Z",
  "updatedAt": "2026-07-18T15:00:00Z"
}
```

### Talent ownership state

```json
{
  "characterId": "uuid",
  "talentKey": "school.footwork_control",
  "talentDefinitionId": "uuid",
  "talentVersionId": "uuid",
  "definitionFingerprint": "sha256:...",
  "highestOwnedRank": 2,
  "maximumRank": 3,
  "firstAcquiredAt": "2026-07-01T10:00:00Z",
  "lastAcquiredAt": "2026-07-18T12:00:00Z",
  "integrityState": "VALID",
  "suppressionState": "NONE",
  "sourceEditionId": "uuid",
  "version": 4
}
```

### Rank acquisition state

Each acquired rank stores:

- acquisition id;
- Character id and realm;
- logical Talent key;
- exact Talent Version id;
- rank number;
- acquisition source type and source id;
- Tree Version and Edition where relevant;
- resource cost and ledger references;
- prerequisite evidence snapshot id;
- operation id and request fingerprint;
- acquired timestamp;
- Definition fingerprint;
- integrity state;
- migration lineage;
- Portfolio version after commit.

### Skill ownership state

```json
{
  "characterId": "uuid",
  "skillKey": "school.focused_breathing",
  "skillVersionId": "uuid",
  "unlockSourceType": "TALENT_RANK",
  "unlockSourceId": "uuid",
  "unlockedAt": "2026-07-18T12:00:00Z",
  "state": "UNLOCKED",
  "suppressionReasons": [],
  "integrityState": "VALID",
  "version": 2
}
```

### Resource account state

```json
{
  "characterId": "uuid",
  "resourceKey": "core.talent_point",
  "scopeKey": "global",
  "precision": 0,
  "postedBalance": 8,
  "reservedAmount": 0,
  "availableBalance": 8,
  "accountState": "OPEN",
  "ledgerSequence": 17,
  "version": 17,
  "updatedAt": "2026-07-18T12:00:00Z"
}
```

### Resource ledger state

Ledger entry types:

- `GRANT`;
- `SPEND`;
- `RESERVE`;
- `RELEASE`;
- `EXPIRE`;
- `REVERSAL`;
- `CORRECTION_CREDIT`;
- `CORRECTION_DEBIT`;
- `MIGRATION_OPENING_BALANCE`.

Each entry stores before and after balances, exact amount, source operation, definition reference, actor, timestamp, and sequence.

### Loadout state

```json
{
  "loadoutId": "uuid",
  "characterId": "uuid",
  "loadoutKey": "school.training",
  "loadoutDefinitionVersionId": "uuid",
  "revision": 18,
  "state": "ACTIVE",
  "slots": [
    {
      "slotKey": "passive_1",
      "entryType": "TALENT",
      "entryKey": "school.footwork_control",
      "rank": 2
    },
    {
      "slotKey": "active_1",
      "entryType": "SKILL",
      "entryKey": "school.focused_breathing"
    }
  ],
  "fingerprint": "sha256:...",
  "createdAt": "2026-07-18T12:00:00Z",
  "createdBy": "user:uuid"
}
```

### Effect-set state

```json
{
  "characterId": "uuid",
  "effectScope": "reward-calculation",
  "effectRevision": 31,
  "effectiveFrom": "2026-07-18T12:00:00Z",
  "effects": [
    {
      "effectInstanceId": "uuid",
      "effectType": "REWARD_AMOUNT_MODIFIER",
      "schemaVersion": 1,
      "target": {
        "rewardCategory": "TRAINING_XP"
      },
      "operation": "ADD_BASIS_POINTS",
      "valueBasisPoints": 500,
      "stackingPolicy": "ADDITIVE_FIXED",
      "priority": 100,
      "source": {
        "talentKey": "school.footwork_control",
        "talentVersionId": "uuid",
        "rank": 2
      }
    }
  ],
  "fingerprint": "sha256:...",
  "portfolioVersion": 128,
  "publishedEventId": "uuid"
}
```

### Effect normalization

Before fingerprinting, effects are normalized by:

1. canonical field names;
2. explicit schema version;
3. normalized exact numeric units;
4. normalized target identifiers;
5. stable source references;
6. deterministic priority;
7. deterministic sort by type, target, priority, source, and instance id;
8. omission of non-semantic presentation fields.

### Skill charge state

```json
{
  "characterId": "uuid",
  "skillKey": "school.focused_breathing",
  "chargeScopeKey": "global",
  "currentCharges": 1,
  "maximumCharges": 2,
  "regenerationPolicy": "INTERVAL",
  "nextChargeAt": "2026-07-18T18:00:00Z",
  "regenerationAnchorAt": "2026-07-18T12:00:00Z",
  "ledgerSequence": 9,
  "version": 9
}
```

### Skill cooldown state

```json
{
  "characterId": "uuid",
  "skillKey": "school.focused_breathing",
  "cooldownScopeKey": "global",
  "lastActivationId": "uuid",
  "startedAt": "2026-07-18T12:00:00Z",
  "readyAt": "2026-07-18T13:00:00Z",
  "durationMilliseconds": 3600000,
  "cooldownDefinitionVersionId": "uuid",
  "version": 6
}
```

### Skill activation receipt

```json
{
  "activationId": "uuid",
  "characterId": "uuid",
  "skillKey": "school.focused_breathing",
  "skillVersionId": "uuid",
  "idempotencyKey": "opaque-client-operation",
  "requestFingerprint": "sha256:...",
  "contextType": "school.training_session",
  "contextReference": "opaque-id",
  "acceptedAt": "2026-07-18T12:00:00Z",
  "chargeConsumed": 1,
  "cooldownReadyAt": "2026-07-18T13:00:00Z",
  "loadoutRevision": 18,
  "portfolioVersion": 129,
  "activationEffectFingerprint": "sha256:..."
}
```

### Foreign fact projection state

A local prerequisite projection contains only required facts:

```json
{
  "characterId": "uuid",
  "factNamespace": "progression",
  "facts": {
    "core.level": 12,
    "core.prestige": 1
  },
  "sourceAggregateVersion": 44,
  "sourceEventId": "uuid",
  "observedAt": "2026-07-18T12:00:00Z",
  "projectionVersion": 51,
  "freshnessState": "FRESH"
}
```

Display names, biographies, payment data, and unrelated source payloads are prohibited.

### Eligibility decision state

A decision trace contains:

- operation id;
- Talent, Tree, Edition, and rank references;
- Portfolio version;
- Character lifecycle projection version;
- each prerequisite id, operator, expected value, observed value or redacted outcome;
- resource cost and available balance;
- acquisition mode;
- visibility-safe reason codes;
- authoritative result;
- decision fingerprint;
- server timestamp.

Secret prerequisites are redacted from user-facing traces.

### Operation state

Canonical statuses:

- `RECEIVED`;
- `PROCESSING`;
- `APPLIED`;
- `ACCEPTED_NOOP`;
- `REJECTED`;
- `RETRYABLE_FAILURE`;
- `QUARANTINED`;
- `FAILED_TERMINAL`.

Operations store request fingerprint, actor, source, expected Portfolio version, outcome, linked ledger entries, linked acquisition or activation, and emitted Event ids.

### Integrity transition state

Integrity transitions store:

- transition id;
- target type and id;
- previous and new integrity state;
- reason code;
- evidence references;
- requested by;
- approved by where dual control is required;
- effective timestamp;
- resulting suppression behavior;
- resulting effect revisions;
- audit correlation.

### Retention classifications

- Definition versions and fingerprints: long-term immutable.
- Acquisition ledger: long-term immutable.
- Resource ledger: long-term immutable or legally required financial-like retention.
- Skill activation records: product-policy retention, then minimized or aggregated.
- Target context references: minimized and time-limited.
- Decision traces: support retention, then redacted or archived.
- Effect revisions: latest plus historical audit according to retention policy.
- Inbox and outbox: operational retention with archive.
- Owner and public projections: rebuildable and deletable.
- Personal actor data: pseudonymized according to privacy policy.

---

## Events

### Event principles

Every consumed or produced Event MUST be:

- immutable;
- schema-versioned;
- globally identifiable;
- authenticated at transport level;
- attributable to a declared producer;
- timestamped in UTC;
- bounded in payload size;
- correlated and causally linked;
- safe under at-least-once delivery;
- explicit about subject, aggregate, realm, and partition key;
- free of secrets and unnecessary personal data;
- compatible with registered replay and correction policy.

### Canonical envelope

Talent Events use the exact camelCase canonical envelope from
`002a-platform-contract-standard`. Character Portfolio, Skill, resource,
loadout, and effect-set Events use `characterId` as `partitionKey`, identify the
Character as `subject`, and include the resulting Portfolio Aggregate version.

Reward fulfillment and reversal result Events use `rewardGrantId` as required
by the cross-Engine protocol.

### Envelope requirements

- The complete canonical field set from `002a-platform-contract-standard` is
  required, including `recordedAt`, actor, subject, realm, lineage, replay, and
  data classification.
- Character-targeted Events MUST use Character as subject.
- Portfolio mutation Events MUST use `characterId` as partition key.
- Definition lifecycle Events may use Definition id as partition key.
- Producer identity from transport authentication MUST match the envelope.
- Future clock skew and maximum Event age are configured per producer.
- Unknown incompatible schema versions are quarantined.
- A replay flag does not bypass idempotency or lifecycle checks.
- Event payloads must use canonical IDs and exact numeric units.

### Consumed Event categories

#### Character lifecycle

- `character.created.v1`;
- `character.activated.v1` where applicable;
- `character.suspended.v1`;
- `character.suspended.v1`;
- `character.restored.v1`;
- `character.closed.v1`;
- `character.anonymized.v1`.

These Events update the local lifecycle projection and may trigger effect-set suppression or restoration.

#### Reward fulfillment

- `reward.fulfillment.requested.v1` for Talent-owned Component Types;
- `reward.reversal.requested.v1` only for Component Types whose reversal semantics are explicitly supported;
- `reward.revoked.v1` as non-authoritative context where needed.

#### Progression facts

- `progression.level.changed.v1`;
- `progression.track.started.v1`;
- `progression.track.frozen.v1`;
- `progression.track.unfrozen.v1`;
- `progression.track.closed.v1`;
- `progression.track.reopened.v1`;
- `progression.prestige.completed.v1`;
- `progression.prestige.revoked.v1`;
- registered correction Events.

#### Achievement facts

- `achievement.unlocked.v1`;
- `achievement.invalidated.v1`;
- `achievement.recognition.restored.v1`;
- registered migration Events.

#### Quest facts

- `quest.completed.v1`;
- `quest.activated.v1` only when registered as a prerequisite fact;
- `quest.progress.corrected.v1`;
- `quest.integrity.invalidated.v1`.

#### Item and Inventory facts

- `inventory.item.acquired.v1`;
- `inventory.item.consumed.v1`;
- `inventory.item.destroyed.v1`;
- `inventory.item.expired.v1`;
- registered Collection owner facts;
- typed ownership snapshots or corrections.

#### Reputation and entitlement facts

- `reputation.rank.changed.v1`;
- `entitlement.granted.v1`;
- `entitlement.revoked.v1`;
- trusted Module membership or certification facts.

#### Season facts

- `season.edition.activated.v1`;
- `season.edition.closed.v1`;
- `season.schedule.revised.v1`;
- `season.content.binding.activated.v1`;
- `season.content.binding.deactivated.v1`.

#### Talent internal commands represented as Events

- `talent.resource.grant.requested.v1` from trusted sources;
- `talent.rank.grant.requested.v1` from migration or administration;
- `skill.unlock.requested.v1` from trusted sources;
- `talent.integrity.review.requested.v1`;
- internal timer and reconciliation Events.

### Produced Event categories

#### Definition lifecycle

- `talent.definition.published.v1`;
- `talent.definition.retired.v1`;
- `skill.definition.published.v1`;
- `skill.definition.retired.v1`;
- `talent.tree.published.v1`;
- `talent.tree.edition.state.changed.v1`;
- `talent.effect.contract.registered.v1` where registry ownership is local.

#### Portfolio lifecycle

- `talent.portfolio.initialized.v1`;
- `talent.portfolio.restricted.v1`;
- `talent.portfolio.restored.v1`;
- `talent.portfolio.closed.v1`;
- `talent.portfolio.anonymized.v1`.

#### Ownership

- `talent.unlocked.v1`;
- `talent.rank.acquired.v1`;
- `talent.ownership.integrity.changed.v1`;
- `talent.suppression.changed.v1`;
- `skill.unlocked.v1`;
- `skill.suppression.changed.v1`.

#### Resources

- `talent.resource.granted.v1`;
- `talent.resource.spent.v1`;
- `talent.resource.expired.v1`;
- `talent.resource.balance.changed.v1`.

#### Loadouts and effects

- `talent.loadout.updated.v1`;
- `talent.loadout.invalidated.v1`;
- `talent.effect.set.changed.v1`;
- `talent.capability.changed.v1` for selected capability projection contracts.

#### Skills

- `skill.activated.v1`;
- `skill.activation.rejected.v1` only for asynchronous trusted requests where a result Event is required;
- `skill.charge.changed.v1`;
- `skill.cooldown.started.v1`;
- `skill.cooldown.ready.v1` as optional UX signal.

#### Reward protocol

- `reward.fulfillment.succeeded.v1`;
- `reward.fulfillment.failed.v1`;
- `reward.reversal.succeeded.v1`;
- `reward.reversal.failed.v1`.

#### Operations

- migration, backfill, repair, and reconciliation lifecycle Events;
- security and integrity incident Events routed to restricted topics.

### Event ordering

Ordering is guaranteed only within a configured partition. Character runtime Events use `character_id`. Definition Events use their logical aggregate identifier.

Consumers must not rely on global ordering. When causal ordering is required:

- aggregate version is checked;
- source sequence is projected;
- missing versions trigger retry or reconciliation;
- old versions are accepted as no-op when already represented;
- contradictory versions are quarantined.

### Corrections

A source correction Event never mutates the original source Event. It references it and states the corrected fact.

Before a Talent acquisition, corrected prerequisite projections may change eligibility. After permanent acquisition, a correction does not silently remove ownership. It may:

- have no retroactive effect;
- open an integrity review;
- suppress effects temporarily;
- result in explicit invalidation under approved policy;
- trigger compensation rather than destructive rollback.

The policy must be declared per prerequisite and source contract.

### Replay behavior

Replay modes:

- `PROJECTION_REBUILD`: rebuild local foreign fact projections without reissuing Character ownership mutations;
- `PORTFOLIO_RECOMPUTE`: recompute derived effect sets from authoritative Talent state;
- `HISTORICAL_ELIGIBILITY_BACKFILL`: evaluate past facts under a specific immutable content package;
- `DISASTER_RECOVERY`: restore inbox/outbox processing with original IDs;
- `MIGRATION_REPLAY`: apply approved transformation operations.

Replayed source Events must not cause automatic acquisitions unless the Edition and backfill policy explicitly permit it.

### Payload minimization

Talent Events must not include:

- display name, biography, email, or avatar;
- unrestricted Definition content for secret Talents;
- raw source Event payloads;
- payment details;
- sensitive moderation reasons;
- unredacted prerequisite evidence;
- client device identifiers unless security policy requires a separately protected field.

---

## Event Contracts

This section defines normative version 1 payloads. All examples omit fields already defined by the canonical envelope.

### `talent.definition.published.v1`

Purpose: announce an immutable published Talent Version.

```json
{
  "payload": {
    "talentDefinitionId": "uuid",
    "talentKey": "school.footwork_control",
    "talentVersionId": "uuid",
    "versionNumber": 3,
    "definitionFingerprint": "sha256:...",
    "maximumRank": 3,
    "visibility": "PUBLIC_AFTER_UNLOCK",
    "publishedAt": "2026-07-18T12:00:00Z",
    "effectScopes": ["reward-calculation", "module:school"],
    "compatibility": {
      "minimumConsumerVersions": {
        "reward-engine": 1,
        "school-module": 2
      }
    }
  }
}
```

Requirements:

- the payload is safe for authorized catalog consumers;
- secret presentation and prerequisite details are omitted;
- fingerprint must match canonical stored content;
- repeated publication with the same version id and fingerprint is an accepted no-op;
- the same version id with a different fingerprint is a critical conflict.

### `talent.definition.retired.v1`

```json
{
  "payload": {
    "talentDefinitionId": "uuid",
    "talentKey": "school.footwork_control",
    "talentVersionId": "uuid",
    "retirementPolicy": "NO_NEW_ACQUISITIONS_EXISTING_EFFECTS_ALLOWED",
    "retiredAt": "2026-10-01T00:00:00Z",
    "replacementTalentVersionId": null,
    "reasonCode": "content.superseded"
  }
}
```

### `skill.definition.published.v1`

```json
{
  "payload": {
    "skillDefinitionId": "uuid",
    "skillKey": "school.focused_breathing",
    "skillVersionId": "uuid",
    "versionNumber": 1,
    "definitionFingerprint": "sha256:...",
    "activationContextSchema": "school.training_session.v1",
    "cooldown": {
      "scope": "CHARACTER_SKILL",
      "durationMilliseconds": 3600000
    },
    "charges": {
      "maximum": 2,
      "activationCost": 1,
      "regenerationPolicy": "INTERVAL"
    },
    "publishedAt": "2026-07-18T12:00:00Z"
  }
}
```

### `talent.tree.published.v1`

```json
{
  "payload": {
    "treeDefinitionId": "uuid",
    "treeKey": "school.core_mastery",
    "treeVersionId": "uuid",
    "versionNumber": 2,
    "definitionFingerprint": "sha256:...",
    "nodeCount": 24,
    "resourceKeys": ["core.talent_point"],
    "loadoutDefinitionVersionIds": ["uuid"],
    "publishedAt": "2026-07-18T12:00:00Z"
  }
}
```

### `talent.tree.edition.state.changed.v1`

```json
{
  "payload": {
    "editionId": "uuid",
    "treeVersionId": "uuid",
    "previousState": "SCHEDULED",
    "newState": "ACTIVE",
    "availability": {
      "startsAt": "2026-07-18T12:00:00Z",
      "endsAt": null,
      "realmKey": "global",
      "seasonId": null
    },
    "changedAt": "2026-07-18T12:00:00Z",
    "reasonCode": "schedule.activation"
  }
}
```

### `talent.portfolio.initialized.v1`

```json
{
  "payload": {
    "characterId": "uuid",
    "realmKey": "global",
    "portfolioState": "ACTIVE",
    "portfolioVersion": 1,
    "initializedAt": "2026-07-18T12:00:00Z"
  }
}
```

### `talent.unlocked.v1`

Purpose: announce first valid acquisition of a logical Talent.

```json
{
  "payload": {
    "characterId": "uuid",
    "talentKey": "school.footwork_control",
    "talentDefinitionId": "uuid",
    "talentVersionId": "uuid",
    "definitionFingerprint": "sha256:...",
    "firstRank": 1,
    "maximumRank": 3,
    "acquisitionId": "uuid",
    "acquisitionSource": {
      "type": "RESOURCE_SPEND",
      "sourceId": "uuid",
      "rewardGrantId": null,
      "fulfillmentId": null
    },
    "treeVersionId": "uuid",
    "editionId": "uuid",
    "acquiredAt": "2026-07-18T12:00:00Z",
    "portfolioVersion": 128,
    "integrityState": "VALID"
  }
}
```

Requirements:

- emitted only for first rank of a logical Talent lineage;
- emitted atomically with ownership and outbox;
- does not include secret prerequisites or cost evidence;
- does not imply Reward Grant completion;
- consumers deduplicate by Event id and acquisition id.

### `talent.rank.acquired.v1`

```json
{
  "payload": {
    "characterId": "uuid",
    "talentKey": "school.footwork_control",
    "talentVersionId": "uuid",
    "definitionFingerprint": "sha256:...",
    "rank": 2,
    "previousRank": 1,
    "maximumRank": 3,
    "acquisitionId": "uuid",
    "sourceType": "REWARD_FULFILLMENT",
    "sourceId": "uuid",
    "treeVersionId": "uuid",
    "editionId": "uuid",
    "acquiredAt": "2026-07-18T12:00:00Z",
    "portfolioVersion": 128,
    "affectedEffectScopes": ["reward-calculation", "module:school"]
  }
}
```

For rank 1, both `talent.unlocked.v1` and `talent.rank.acquired.v1` may be emitted in the same transaction. Consumers should choose the contract matching their semantic need.

### `talent.ownership.integrity.changed.v1`

```json
{
  "payload": {
    "characterId": "uuid",
    "targetType": "TALENT_RANK_ACQUISITION",
    "targetId": "uuid",
    "talentKey": "school.footwork_control",
    "previousIntegrityState": "VALID",
    "newIntegrityState": "CONTESTED",
    "effectBehavior": "SUPPRESS_PENDING_REVIEW",
    "reasonCode": "source_evidence.corrected",
    "changedAt": "2026-07-18T12:00:00Z",
    "portfolioVersion": 129,
    "affectedEffectScopes": ["reward-calculation"]
  }
}
```

Sensitive evidence remains in restricted audit storage.

### `talent.resource.granted.v1`

```json
{
  "payload": {
    "characterId": "uuid",
    "resourceKey": "core.talent_point",
    "scopeKey": "global",
    "ledgerEntryId": "uuid",
    "amount": 1,
    "balanceAfter": 8,
    "grantSource": {
      "type": "REWARD_FULFILLMENT",
      "sourceId": "uuid"
    },
    "expiresAt": null,
    "occurredAt": "2026-07-18T12:00:00Z",
    "portfolioVersion": 127
  }
}
```

### `talent.resource.spent.v1`

```json
{
  "payload": {
    "characterId": "uuid",
    "resourceKey": "core.talent_point",
    "scopeKey": "global",
    "ledgerEntryId": "uuid",
    "amount": 2,
    "balanceAfter": 6,
    "acquisitionId": "uuid",
    "talentKey": "school.footwork_control",
    "rank": 2,
    "spentAt": "2026-07-18T12:00:00Z",
    "portfolioVersion": 128
  }
}
```

### `talent.resource.balance.changed.v1`

This compact Event is intended for projections that need current balance but not ledger semantics.

```json
{
  "payload": {
    "characterId": "uuid",
    "resourceKey": "core.talent_point",
    "scopeKey": "global",
    "balance": 6,
    "resourceAccountVersion": 18,
    "portfolioVersion": 128,
    "reason": "SPEND"
  }
}
```

### `talent.loadout.updated.v1`

```json
{
  "payload": {
    "characterId": "uuid",
    "loadoutKey": "school.training",
    "loadoutDefinitionVersionId": "uuid",
    "previousRevision": 17,
    "newRevision": 18,
    "loadoutFingerprint": "sha256:...",
    "changedSlots": ["passive_1", "active_1"],
    "updatedAt": "2026-07-18T12:00:00Z",
    "portfolioVersion": 129,
    "affectedEffectScopes": ["reward-calculation", "module:school"]
  }
}
```

The Event may omit exact hidden selections from public topics. Internal authorized consumers may receive a separate protected projection.

### `talent.effect.set.changed.v1`

Purpose: publish the complete authoritative effect set for one scope.

```json
{
  "payload": {
    "characterId": "uuid",
    "effectScope": "reward-calculation",
    "previousEffectRevision": 30,
    "effectRevision": 31,
    "effectiveFrom": "2026-07-18T12:00:00Z",
    "effects": [
      {
        "effectInstanceId": "uuid",
        "effectType": "REWARD_AMOUNT_MODIFIER",
        "schemaVersion": 1,
        "target": {
          "rewardCategory": "TRAINING_XP"
        },
        "operation": "ADD_BASIS_POINTS",
        "valueBasisPoints": 500,
        "stackingPolicy": "ADDITIVE_FIXED",
        "priority": 100,
        "source": {
          "talentKey": "school.footwork_control",
          "talentVersionId": "uuid",
          "rank": 2
        }
      }
    ],
    "effectFingerprint": "sha256:...",
    "portfolioVersion": 129,
    "reason": "LOADOUT_UPDATED"
  }
}
```

Requirements:

- payload is a complete snapshot for the scope;
- revision is monotonic;
- consumer replaces older projection only with a greater revision;
- numeric values use exact declared units;
- secret source labels may be replaced by opaque source references where the consumer does not need them;
- an empty effect list is a valid complete revision;
- effect payload size must remain bounded; large sets require registered compaction or query projection.

### `talent.capability.changed.v1`

For consumers needing only boolean or enumerated capabilities:

```json
{
  "payload": {
    "characterId": "uuid",
    "capabilityNamespace": "module:school",
    "capabilityRevision": 14,
    "capabilities": [
      {
        "key": "school.can_assist_beginner_group",
        "value": true,
        "sourceType": "TALENT",
        "sourceReference": "opaque-id"
      }
    ],
    "fingerprint": "sha256:...",
    "portfolioVersion": 129
  }
}
```

This Event is advisory progression state. A Module must still apply business authorization.

### `skill.unlocked.v1`

```json
{
  "payload": {
    "characterId": "uuid",
    "skillKey": "school.focused_breathing",
    "skillDefinitionId": "uuid",
    "skillVersionId": "uuid",
    "definitionFingerprint": "sha256:...",
    "unlockId": "uuid",
    "unlockSourceType": "TALENT_RANK",
    "unlockSourceId": "uuid",
    "unlockedAt": "2026-07-18T12:00:00Z",
    "portfolioVersion": 128
  }
}
```

### `skill.activated.v1`

```json
{
  "payload": {
    "activationId": "uuid",
    "characterId": "uuid",
    "skillKey": "school.focused_breathing",
    "skillVersionId": "uuid",
    "definitionFingerprint": "sha256:...",
    "activationContext": {
      "type": "school.training_session",
      "reference": "opaque-id",
      "schemaVersion": 1
    },
    "acceptedAt": "2026-07-18T12:00:00Z",
    "chargeConsumed": 1,
    "chargesRemaining": 1,
    "cooldown": {
      "scopeKey": "global",
      "readyAt": "2026-07-18T13:00:00Z"
    },
    "loadoutRevision": 18,
    "portfolioVersion": 130,
    "activationEffects": [
      {
        "effectType": "MODULE_CAPABILITY_ACTIVATION",
        "schemaVersion": 1,
        "targetNamespace": "school",
        "effectKey": "focused_breathing_active",
        "durationMilliseconds": 600000
      }
    ],
    "activationEffectFingerprint": "sha256:..."
  }
}
```

Requirements:

- accepted only after atomic charge and cooldown mutation;
- context fields are validated against registered schema;
- the Event is not a guarantee that the target Module applied the effect;
- downstream consumers deduplicate by `activationId`;
- sensitive target identifiers are opaque and purpose-limited.

### `skill.cooldown.started.v1`

```json
{
  "payload": {
    "characterId": "uuid",
    "skillKey": "school.focused_breathing",
    "activationId": "uuid",
    "cooldownScopeKey": "global",
    "startedAt": "2026-07-18T12:00:00Z",
    "readyAt": "2026-07-18T13:00:00Z",
    "durationMilliseconds": 3600000,
    "portfolioVersion": 130
  }
}
```

### `skill.cooldown.ready.v1`

```json
{
  "payload": {
    "characterId": "uuid",
    "skillKey": "school.focused_breathing",
    "cooldownScopeKey": "global",
    "readyAt": "2026-07-18T13:00:00Z",
    "observedReadyAt": "2026-07-18T13:00:02Z",
    "sourceActivationId": "uuid"
  }
}
```

This Event is optional and non-authoritative. A missing or delayed Event does not keep a Skill on cooldown.

### `reward.fulfillment.requested.v1` — Talent component interpretation

Talent Engine processes only registered Component Types whose `ownerEngine` is `talent`.

Example `TALENT_UNLOCK` component:

```json
{
  "rewardGrantId": "uuid",
  "componentId": "uuid",
  "fulfillmentId": "uuid",
  "attemptId": "uuid",
  "attemptNumber": 1,
  "componentKey": "unlock_footwork",
  "componentType": "TALENT_UNLOCK",
  "componentSchemaVersion": 1,
  "ownerEngine": "talent",
  "characterId": "uuid",
  "requestFingerprint": "sha256:...",
  "componentPayload": {
    "talentKey": "school.footwork_control",
    "talentVersionSelector": {
      "mode": "EXACT",
      "talentVersionId": "uuid"
    },
    "grantMode": "GRANT_MISSING_TO_RANK",
    "targetRank": 1,
    "editionId": "uuid",
    "prerequisitePolicy": "BYPASS_ACQUISITION_COST_REQUIRE_CONTENT_COMPATIBILITY"
  },
  "requestedAt": "2026-07-18T12:00:00Z"
}
```

Supported Talent-owned Reward Component Types in version 1:

| Component Type | Purpose |
|---|---|
| `TALENT_UNLOCK` | Grant first rank or exact configured rank policy. |
| `TALENT_RANK_GRANT` | Grant one or more missing ranks to a bounded target rank. |
| `SKILL_UNLOCK` | Grant a Skill entitlement. |
| `TALENT_RESOURCE_GRANT` | Credit a Talent-owned resource account. |
| `SKILL_CHARGE_GRANT` | Credit charges when the Skill contract permits external grants. |

A Reward grant may bypass ordinary resource cost, but it cannot bypass:

- Character identity and lifecycle validity;
- Definition existence and publication compatibility;
- maximum rank;
- realm restrictions;
- conflict and idempotency checks;
- prohibited cycle policy;
- emergency disablement;
- schema validation.

Whether ordinary prerequisites are enforced is explicit in the component payload and publication policy. The default is to bypass acquisition prerequisites for a direct Reward grant while retaining content compatibility checks.

### `reward.fulfillment.succeeded.v1` — Talent result

```json
{
  "rewardGrantId": "uuid",
  "componentId": "uuid",
  "fulfillmentId": "uuid",
  "componentType": "TALENT_UNLOCK",
  "ownerEngine": "talent",
  "characterId": "uuid",
  "requestFingerprint": "sha256:...",
  "ownerOperationId": "uuid",
  "ownerAggregate": {
    "type": "CHARACTER_TALENT_PORTFOLIO",
    "id": "uuid",
    "version": 128
  },
  "outcome": {
    "status": "APPLIED",
    "acceptedNoop": false,
    "talentKey": "school.footwork_control",
    "talentVersionId": "uuid",
    "ranksGranted": [1],
    "acquisitionIds": ["uuid"],
    "effectRevisions": {
      "reward-calculation": 31
    }
  },
  "fulfilledAt": "2026-07-18T12:00:00Z"
}
```

Accepted no-op is success when the exact requested ownership already exists from the same or compatible lineage according to Component Type policy.

### `reward.fulfillment.failed.v1` — Talent result

```json
{
  "rewardGrantId": "uuid",
  "componentId": "uuid",
  "fulfillmentId": "uuid",
  "componentType": "TALENT_UNLOCK",
  "ownerEngine": "talent",
  "characterId": "uuid",
  "requestFingerprint": "sha256:...",
  "ownerOperationId": "uuid",
  "failure": {
    "class": "TERMINAL",
    "code": "talent.definition.notFound",
    "messageKey": "talent.fulfillment.definition_not_found",
    "retryable": false,
    "retryAfterSeconds": null,
    "details": {}
  },
  "failedAt": "2026-07-18T12:00:00Z"
}
```

Failure classes:

- `RETRYABLE` for temporary dependency, lock, or infrastructure failures;
- `TERMINAL` for invalid content reference, incompatible realm, maximum rank conflict, or unsupported semantics;
- `QUARANTINED` for fingerprint conflict, unauthorized producer, or contradictory prior result.

### `reward.reversal.requested.v1`

Permanent Talent acquisition is non-reversible by default. Component publication must declare reversal policy:

- `NOT_REVERSIBLE`;
- `COMPENSATE_ONLY`;
- `INTEGRITY_INVALIDATION_REQUIRED`;
- `RESOURCE_CREDIT_REVERSIBLE` for unspent Talent Resource grants where exact ledger semantics allow reversal;
- `CHARGE_GRANT_REVERSIBLE_IF_UNSPENT`.

A request to reverse a permanent Talent unlock normally returns terminal failure `talent.permanent_acquisition_not_reversible` and may open a support workflow if fraud or integrity is involved.

Talent Engine publishes `reward.reversal.succeeded.v1` or
`reward.reversal.failed.v1` using the canonical payloads from
`002b-cross-engine-integration`. `TALENT_RESOURCE_GRANT` and
`SKILL_CHARGE_GRANT` may succeed only when the exact credited units remain
reversible; permanent acquisition components return an explicit terminal
failure.

### `talent.suppression.changed.v1`

```json
{
  "payload": {
    "characterId": "uuid",
    "targetType": "TALENT",
    "targetKey": "school.footwork_control",
    "previousSuppression": "NONE",
    "newSuppression": "CHARACTER_RESTRICTED",
    "reasonCode": "character.suspended",
    "effectiveAt": "2026-07-18T12:00:00Z",
    "portfolioVersion": 131,
    "affectedEffectScopes": ["reward-calculation", "module:school"]
  }
}
```

### Error taxonomy

Canonical error codes include:

- `talent.character_not_found`;
- `talent.character_not_active`;
- `talent.portfolio_initializing`;
- `talent.portfolio_closed`;
- `talent.definition_not_found`;
- `talent.definition_not_published`;
- `talent.definition_retired`;
- `talent.version_conflict`;
- `talent.edition_not_active`;
- `talent.edition_scope_mismatch`;
- `talent.prerequisite_not_met`;
- `talent.prerequisite_projection_stale`;
- `talent.rank_already_owned`;
- `talent.rank_sequence_invalid`;
- `talent.maximum_rank_reached`;
- `talent.resource_account_not_found`;
- `talent.insufficient_resource`;
- `talent.resource_frozen`;
- `talent.resource_expired`;
- `talent.exclusivity_conflict`;
- `talent.loadout_version_conflict`;
- `talent.loadout_invalid`;
- `talent.slot_constraint_failed`;
- `talent.effect_contract_unknown`;
- `talent.effect_contract_incompatible`;
- `talent.effect_cycle_detected`;
- `talent.idempotency_conflict`;
- `talent.event_fingerprint_conflict`;
- `talent.fulfillment_unauthorized`;
- `talent.fulfillment_payload_conflict`;
- `talent.permanent_acquisition_not_reversible`;
- `skill.not_unlocked`;
- `skill.suppressed`;
- `skill.not_equipped`;
- `skill.invalid_context`;
- `skill.no_charges`;
- `skill.cooldown_active`;
- `skill.activation_conflict`;
- `skill.definition_retired`;
- `skill.emergency_disabled`;
- `talent.retryable_dependency_failure`;
- `talent.concurrent_update`;
- `talent.integrity_review_required`.

User-facing responses use localization keys and must not leak hidden prerequisite or secret Talent details.

---

## Read Models

Read models are purpose-specific projections. They are never authoritative write models and must expose freshness metadata where eventual consistency is relevant.

### Owner Talent Portfolio

Purpose: render the Character owner's complete Talent experience.

Contains:

- Portfolio state and revision;
- visible owned Talents and ranks;
- next-rank eligibility summaries;
- Talent-resource balances;
- active Tree Editions;
- current and available Loadouts;
- Skills, charges, and cooldown readiness;
- active and suppressed effects in owner-safe language;
- recent acquisitions and activations;
- projection freshness;
- redacted failure explanations;
- reward fulfillment status only through a federated or separately projected view, never as Talent-owned truth.

Must not include:

- unrestricted secret prerequisites;
- internal producer trust classifications;
- sensitive integrity evidence;
- other Characters' private state;
- raw Event payloads.

Example:

```json
{
  "characterId": "uuid",
  "portfolioState": "ACTIVE",
  "portfolioVersion": 130,
  "projectionVersion": 155,
  "talents": [],
  "resources": [],
  "loadouts": [],
  "skills": [],
  "activeEditions": [],
  "updatedAt": "2026-07-18T12:00:00Z",
  "freshness": {
    "state": "FRESH",
    "lagMilliseconds": 120
  }
}
```

### Talent Tree View

Purpose: show one Tree Edition and Character-specific node state.

Each node may expose:

- `LOCKED_HIDDEN`;
- `LOCKED_VISIBLE`;
- `ELIGIBLE`;
- `AFFORDABLE`;
- `ELIGIBLE_INSUFFICIENT_RESOURCE`;
- `ACQUIRED`;
- `MAX_RANK`;
- `SUPPRESSED`;
- `RETIRED_OWNED`;
- `UNAVAILABLE`.

The view includes a safe reason model:

```json
{
  "nodeKey": "footwork_rank_2",
  "state": "ELIGIBLE_INSUFFICIENT_RESOURCE",
  "cost": {
    "resourceKey": "core.talent_point",
    "amount": 2,
    "currentBalance": 1
  },
  "prerequisites": [
    {
      "presentationKey": "talent.requirement.previous_rank",
      "satisfied": true
    },
    {
      "presentationKey": "talent.requirement.hidden",
      "satisfied": false,
      "redacted": true
    }
  ]
}
```

### Talent Detail View

Contains:

- localized name, narrative, icon, category, rarity token where used;
- visible rank descriptions;
- owned rank;
- visible prerequisites and costs;
- effect summaries in user language;
- acquisition source summary;
- Edition availability;
- loadout requirement;
- suppression or integrity banner where permitted;
- version and freshness metadata.

Technical effect payloads are not sent to ordinary clients unless a client contract explicitly requires them.

### Skill Runtime View

Contains:

- unlock state;
- loadout state;
- current and maximum charges;
- authoritative `readyAt`;
- server time in response metadata;
- activation context requirements;
- visibility-safe activation rejection reason;
- most recent activation receipt reference;
- suppression or retirement state.

The client may render a countdown but must revalidate activation server-side.

### Public Talent Profile

Purpose: show explicitly public Talent accomplishments on Character Profile.

Contains only:

- public-after-unlock Talent badges;
- selected featured Talents where Character policy allows;
- safe rank label;
- public Skill or capability markers;
- no resources, cooldowns, hidden branches, private loadouts, or source evidence.

Public projection combines Character visibility rules with Talent visibility policy. The stricter rule wins.

### Internal Eligibility Projection

Purpose: allow Quest, Achievement, Reward, Module, or authorization-related consumers to project Talent facts without reading Talent storage.

May contain:

- boolean ownership by logical Talent key;
- highest valid rank;
- Skill unlock state;
- capability set revision;
- integrity and suppression-safe effective state;
- source aggregate version;
- updated timestamp.

It must not include authoring metadata or unrelated Talent state.

### Effect Consumer Projection

Purpose: provide the latest complete Effect Set for one Character and scope.

Contains:

- Character id;
- effect scope;
- latest effect revision;
- normalized effects;
- fingerprint;
- effective timestamp;
- source Portfolio version;
- convergence status;
- optional last acknowledged consumer revision.

Consumers may obtain this via Event projection or internal query API.

### Support Character View

Contains:

- Portfolio lifecycle;
- acquisitions with source lineage;
- resource ledger summaries;
- current and historical Loadouts;
- Skills, charges, and cooldowns;
- effect revisions and consumer convergence;
- idempotency operations;
- Reward fulfillment receipts;
- integrity cases;
- recent errors;
- links to restricted evidence where authorized.

Support views redact secret content unless the operator has explicit permission.

### Definition Catalog View

Contains logical Definitions, versions, lifecycle, fingerprints, references, validation reports, compatibility, and publication history.

### Administration Operations View

Contains migration, bulk grant, recompute, repair, integrity, and retirement jobs with counts, checkpoints, failures, and approvals.

### Analytics projection

Analytics receives event-derived, minimized, pseudonymized facts such as:

- acquisition counts by content version;
- resource source and spend aggregates;
- loadout adoption;
- Skill activation counts;
- cooldown rejection counts;
- Definition conversion funnels;
- effect-set size distributions;
- operational latency.

Analytics must not become authoritative or expose secret content broadly.

### Read consistency

Owner read-after-write may be provided by:

- returning the authoritative operation result directly;
- waiting for a bounded projection barrier;
- reading through to authoritative state for the changed Character;
- showing pending synchronization with operation status.

A stale projection must never falsely claim that an acquisition failed after an authoritative success. Responses include operation and projection revisions to reconcile UI state.

### Caching

- Published Definition versions are immutable and cacheable by version id and fingerprint.
- Owner projections use short TTL and revision-aware invalidation.
- Public projections use privacy-aware cache keys and purge on visibility changes.
- Skill readiness must not be cached without `readyAt` and server-time interpretation.
- Secret content must not enter shared public caches.
- Effect consumer cache entries are keyed by Character, scope, and revision.

---

## Write Models

All mutations are commands or authenticated Event handlers. External callers never update persistence tables directly.

### `CreateTalentDraft`

Creates a draft logical Definition or a new draft version.

Required:

- logical key;
- owner team;
- content namespace;
- initial schema version;
- idempotency key.

### `UpdateTalentDraft`

Updates an unpublished draft using expected draft revision. Draft editing is optimistic and audit logged.

### `SubmitTalentVersionForReview`

Runs validation and transitions a draft to review. Validation failure leaves the draft editable.

### `ApproveTalentVersion`

Requires reviewer authority distinct from the last author for high-risk effect types.

### `PublishTalentVersion`

Publishes immutable content after successful compilation and compatibility validation.

### `RetireTalentVersion`

Applies explicit retirement policy. It does not modify existing Character ownership.

Equivalent commands exist for Skill, Tree, Edition, Resource, and Loadout Definitions.

### `AcquireTalentRank`

Owner-facing acquisition command.

```json
{
  "characterId": "uuid",
  "treeEditionId": "uuid",
  "nodeKey": "footwork_rank_2",
  "expectedPortfolioVersion": 127,
  "expectedResourceAccountVersion": 17,
  "idempotencyKey": "opaque",
  "clientContext": {
    "surface": "talent-tree"
  }
}
```

Server resolves exact Talent Version, rank, prerequisite plan, and cost from the Edition. Clients cannot send an authoritative amount or effect payload.

Command outcomes:

- `APPLIED`;
- `ACCEPTED_NOOP`;
- `REJECTED` with safe code;
- `CONFLICT` for version mismatch;
- `RETRYABLE_FAILURE`.

### `GrantTalentRank`

Trusted command for migration or administration. It requires explicit source, policy, reason, approval, and target version. It does not silently bypass compatibility.

### `GrantTalentResource`

Credits a Talent Resource through trusted internal source or Reward fulfillment. Ordinary clients cannot call it.

### `UpdateTalentLoadout`

```json
{
  "characterId": "uuid",
  "loadoutKey": "school.training",
  "expectedLoadoutRevision": 17,
  "expectedPortfolioVersion": 128,
  "slots": [
    {
      "slotKey": "passive_1",
      "entryType": "TALENT",
      "entryKey": "school.footwork_control",
      "rank": 2
    }
  ],
  "idempotencyKey": "opaque"
}
```

The server validates ownership, slot type, exclusivity, capacity, restrictions, and compatibility, then creates a new immutable revision.

### `ActivateSkill`

```json
{
  "characterId": "uuid",
  "skillKey": "school.focused_breathing",
  "activationContext": {
    "type": "school.training_session",
    "schemaVersion": 1,
    "reference": "opaque-id"
  },
  "expectedPortfolioVersion": 129,
  "idempotencyKey": "opaque"
}
```

The caller cannot specify charge cost, cooldown duration, or activation effects.

### `SuppressTalentOwnership`

Restricted administrative or automated lifecycle command. It preserves ownership and recomputes effects.

### `OpenTalentIntegrityCase`

Creates a contested state with evidence references and review policy.

### `ResolveTalentIntegrityCase`

Requires authorized resolution and, for invalidation, dual control where configured.

### `RecomputeEffectSets`

Rebuilds affected scopes from authoritative Portfolio state. It is idempotent by Character, source Portfolio version, and recompute policy version.

### `RebuildTalentProjection`

Recreates a read projection without changing authoritative state.

### `MigrateTalentOwnership`

Applies an approved mapping from one exact Definition version to another. It records lineage and never overwrites original acquisition.

### `RepairTalentPortfolio`

A restricted command with typed repair actions. Arbitrary field patches are prohibited.

Supported repair examples:

- recreate missing Effect Set revision;
- rebuild resource balance from ledger;
- regenerate missing Skill Ownership derived from a valid acquired rank;
- close orphan reservation;
- republish missing outbox Event;
- correct projection pointer;
- restore a wrongly suppressed acquisition after approved review.

### Command idempotency

Every mutation command has:

- caller-defined or system-derived idempotency key;
- caller scope;
- canonical request fingerprint;
- retention period appropriate to duplicate risk;
- stored outcome;
- conflict behavior.

The same key and fingerprint returns the original outcome. The same key with a different fingerprint returns `409 talent.idempotency_conflict` and performs no mutation.

### Authorization model

Write authorization distinguishes:

- Character owner;
- trusted Module service;
- Reward Engine service;
- content author;
- reviewer;
- publisher;
- support operator;
- integrity investigator;
- privacy operator;
- migration operator;
- security administrator.

No broad `admin` role should bypass all boundaries.

---

## Database Schema

The following PostgreSQL schema is a normative reference model. Implementations may rename physical objects or split services if all invariants, constraints, ownership rules, and contracts remain equivalent.

### Extensions and conventions

```sql
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE DOMAIN exact_nonnegative_bigint AS BIGINT
  CHECK (VALUE >= 0);
```

All timestamps use `TIMESTAMPTZ`. Keys exposed outside the service use UUID or stable canonical strings. JSON payloads are validated by application schema and, where practical, database constraints.

### Logical Definitions

```sql
CREATE TABLE talent_definition (
    talent_definition_id       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    talent_key                 VARCHAR(160) NOT NULL UNIQUE,
    namespace                  VARCHAR(96) NOT NULL,
    owner_team                 VARCHAR(128) NOT NULL,
    lifecycle_state            VARCHAR(32) NOT NULL,
    created_at                 TIMESTAMPTZ NOT NULL,
    created_by                 VARCHAR(200) NOT NULL,
    updated_at                 TIMESTAMPTZ NOT NULL,
    record_version             BIGINT NOT NULL DEFAULT 1,
    CONSTRAINT ck_talent_definition_key
      CHECK (talent_key ~ '^[a-z0-9][a-z0-9._-]{2,159}$')
);

CREATE TABLE talent_version (
    talent_version_id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    talent_definition_id       UUID NOT NULL REFERENCES talent_definition,
    version_number             INTEGER NOT NULL,
    schema_version             INTEGER NOT NULL,
    lifecycle_state            VARCHAR(32) NOT NULL,
    maximum_rank               INTEGER NOT NULL,
    visibility_policy          VARCHAR(48) NOT NULL,
    acquisition_policy         VARCHAR(48) NOT NULL,
    definition_payload         JSONB NOT NULL,
    definition_fingerprint     VARCHAR(80) NOT NULL,
    compiled_plan              JSONB NULL,
    compiled_plan_fingerprint  VARCHAR(80) NULL,
    created_at                 TIMESTAMPTZ NOT NULL,
    created_by                 VARCHAR(200) NOT NULL,
    submitted_at               TIMESTAMPTZ NULL,
    approved_at                TIMESTAMPTZ NULL,
    approved_by                VARCHAR(200) NULL,
    published_at               TIMESTAMPTZ NULL,
    retired_at                 TIMESTAMPTZ NULL,
    retirement_policy          VARCHAR(64) NULL,
    UNIQUE (talent_definition_id, version_number),
    UNIQUE (talent_version_id, definition_fingerprint),
    CONSTRAINT ck_talent_max_rank CHECK (maximum_rank BETWEEN 1 AND 100),
    CONSTRAINT ck_talent_schema_version CHECK (schema_version > 0)
);

CREATE INDEX ix_talent_version_published
  ON talent_version (talent_definition_id, published_at DESC)
  WHERE lifecycle_state = 'PUBLISHED';

CREATE TABLE talent_rank_definition (
    talent_version_id          UUID NOT NULL REFERENCES talent_version,
    rank_number                INTEGER NOT NULL,
    rank_payload               JSONB NOT NULL,
    prerequisite_plan          JSONB NOT NULL,
    acquisition_cost_plan      JSONB NOT NULL,
    rank_fingerprint           VARCHAR(80) NOT NULL,
    PRIMARY KEY (talent_version_id, rank_number),
    CONSTRAINT ck_rank_number CHECK (rank_number > 0)
);
```

Publication validation ensures rank numbers are contiguous and do not exceed `maximum_rank`.

### Skills

```sql
CREATE TABLE skill_definition (
    skill_definition_id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    skill_key                  VARCHAR(160) NOT NULL UNIQUE,
    namespace                  VARCHAR(96) NOT NULL,
    owner_team                 VARCHAR(128) NOT NULL,
    lifecycle_state            VARCHAR(32) NOT NULL,
    created_at                 TIMESTAMPTZ NOT NULL,
    created_by                 VARCHAR(200) NOT NULL,
    record_version             BIGINT NOT NULL DEFAULT 1
);

CREATE TABLE skill_version (
    skill_version_id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    skill_definition_id        UUID NOT NULL REFERENCES skill_definition,
    version_number             INTEGER NOT NULL,
    schema_version             INTEGER NOT NULL,
    lifecycle_state            VARCHAR(32) NOT NULL,
    activation_context_schema  VARCHAR(160) NOT NULL,
    definition_payload         JSONB NOT NULL,
    definition_fingerprint     VARCHAR(80) NOT NULL,
    compiled_plan              JSONB NULL,
    published_at               TIMESTAMPTZ NULL,
    retired_at                 TIMESTAMPTZ NULL,
    retirement_policy          VARCHAR(64) NULL,
    created_at                 TIMESTAMPTZ NOT NULL,
    created_by                 VARCHAR(200) NOT NULL,
    UNIQUE (skill_definition_id, version_number)
);
```

### Trees and Editions

```sql
CREATE TABLE talent_tree_definition (
    tree_definition_id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tree_key                   VARCHAR(160) NOT NULL UNIQUE,
    namespace                  VARCHAR(96) NOT NULL,
    owner_team                 VARCHAR(128) NOT NULL,
    lifecycle_state            VARCHAR(32) NOT NULL,
    created_at                 TIMESTAMPTZ NOT NULL,
    created_by                 VARCHAR(200) NOT NULL
);

CREATE TABLE talent_tree_version (
    tree_version_id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tree_definition_id         UUID NOT NULL REFERENCES talent_tree_definition,
    version_number             INTEGER NOT NULL,
    schema_version             INTEGER NOT NULL,
    lifecycle_state            VARCHAR(32) NOT NULL,
    definition_payload         JSONB NOT NULL,
    compiled_graph             JSONB NULL,
    definition_fingerprint     VARCHAR(80) NOT NULL,
    node_count                 INTEGER NOT NULL,
    published_at               TIMESTAMPTZ NULL,
    retired_at                 TIMESTAMPTZ NULL,
    created_at                 TIMESTAMPTZ NOT NULL,
    created_by                 VARCHAR(200) NOT NULL,
    UNIQUE (tree_definition_id, version_number),
    CONSTRAINT ck_tree_node_count CHECK (node_count BETWEEN 1 AND 10000)
);

CREATE TABLE talent_tree_node (
    tree_version_id            UUID NOT NULL REFERENCES talent_tree_version,
    node_key                   VARCHAR(160) NOT NULL,
    node_type                  VARCHAR(32) NOT NULL,
    talent_version_id          UUID NULL REFERENCES talent_version,
    rank_number                INTEGER NULL,
    skill_version_id           UUID NULL REFERENCES skill_version,
    node_payload               JSONB NOT NULL,
    prerequisite_plan          JSONB NOT NULL,
    PRIMARY KEY (tree_version_id, node_key)
);

CREATE TABLE talent_tree_edge (
    tree_version_id            UUID NOT NULL REFERENCES talent_tree_version,
    from_node_key              VARCHAR(160) NOT NULL,
    to_node_key                VARCHAR(160) NOT NULL,
    edge_type                  VARCHAR(32) NOT NULL,
    edge_payload               JSONB NOT NULL DEFAULT '{}'::jsonb,
    PRIMARY KEY (tree_version_id, from_node_key, to_node_key, edge_type),
    FOREIGN KEY (tree_version_id, from_node_key)
      REFERENCES talent_tree_node (tree_version_id, node_key),
    FOREIGN KEY (tree_version_id, to_node_key)
      REFERENCES talent_tree_node (tree_version_id, node_key)
);

CREATE TABLE talent_tree_edition (
    edition_id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tree_version_id            UUID NOT NULL REFERENCES talent_tree_version,
    edition_key                VARCHAR(160) NOT NULL,
    realm_key                  VARCHAR(96) NOT NULL,
    lifecycle_state            VARCHAR(32) NOT NULL,
    starts_at                  TIMESTAMPTZ NULL,
    ends_at                    TIMESTAMPTZ NULL,
    season_id                  UUID NULL,
    audience_policy            JSONB NOT NULL,
    acquisition_policy        JSONB NOT NULL,
    edition_fingerprint        VARCHAR(80) NOT NULL,
    created_at                 TIMESTAMPTZ NOT NULL,
    created_by                 VARCHAR(200) NOT NULL,
    activated_at               TIMESTAMPTZ NULL,
    ended_at                   TIMESTAMPTZ NULL,
    UNIQUE (realm_key, edition_key),
    CONSTRAINT ck_edition_window CHECK (ends_at IS NULL OR starts_at IS NULL OR ends_at > starts_at)
);
```

### Effect contracts and Definition effects

```sql
CREATE TABLE talent_effect_contract (
    effect_type                VARCHAR(96) NOT NULL,
    schema_version             INTEGER NOT NULL,
    owner_team                 VARCHAR(128) NOT NULL,
    consumer_scope_pattern     VARCHAR(200) NOT NULL,
    schema_document            JSONB NOT NULL,
    stacking_policies          JSONB NOT NULL,
    security_classification    VARCHAR(32) NOT NULL,
    lifecycle_state            VARCHAR(32) NOT NULL,
    contract_fingerprint       VARCHAR(80) NOT NULL,
    created_at                 TIMESTAMPTZ NOT NULL,
    published_at               TIMESTAMPTZ NULL,
    PRIMARY KEY (effect_type, schema_version)
);

CREATE TABLE talent_rank_effect (
    talent_version_id          UUID NOT NULL,
    rank_number                INTEGER NOT NULL,
    effect_key                 VARCHAR(160) NOT NULL,
    effect_type                VARCHAR(96) NOT NULL,
    effect_schema_version      INTEGER NOT NULL,
    effect_scope               VARCHAR(160) NOT NULL,
    stacking_policy            VARCHAR(64) NOT NULL,
    priority                   INTEGER NOT NULL,
    effect_payload             JSONB NOT NULL,
    effect_fingerprint         VARCHAR(80) NOT NULL,
    PRIMARY KEY (talent_version_id, rank_number, effect_key),
    FOREIGN KEY (talent_version_id, rank_number)
      REFERENCES talent_rank_definition (talent_version_id, rank_number),
    FOREIGN KEY (effect_type, effect_schema_version)
      REFERENCES talent_effect_contract (effect_type, schema_version)
);
```

### Portfolio

```sql
CREATE TABLE character_talent_portfolio (
    portfolio_id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    character_id               UUID NOT NULL,
    realm_key                  VARCHAR(96) NOT NULL,
    portfolio_state            VARCHAR(32) NOT NULL,
    character_lifecycle_state  VARCHAR(32) NOT NULL,
    character_projection_version BIGINT NOT NULL,
    portfolio_version          BIGINT NOT NULL DEFAULT 0,
    created_at                 TIMESTAMPTZ NOT NULL,
    updated_at                 TIMESTAMPTZ NOT NULL,
    anonymized_at              TIMESTAMPTZ NULL,
    UNIQUE (character_id, realm_key),
    CONSTRAINT ck_portfolio_version CHECK (portfolio_version >= 0)
);

CREATE TABLE character_talent_ownership (
    ownership_id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    portfolio_id               UUID NOT NULL REFERENCES character_talent_portfolio,
    talent_definition_id       UUID NOT NULL REFERENCES talent_definition,
    talent_key                 VARCHAR(160) NOT NULL,
    highest_owned_rank         INTEGER NOT NULL,
    first_talent_version_id    UUID NOT NULL REFERENCES talent_version,
    current_interpretation_version_id UUID NOT NULL REFERENCES talent_version,
    integrity_state            VARCHAR(32) NOT NULL,
    suppression_state          VARCHAR(48) NOT NULL,
    first_acquired_at          TIMESTAMPTZ NOT NULL,
    last_acquired_at           TIMESTAMPTZ NOT NULL,
    record_version             BIGINT NOT NULL,
    UNIQUE (portfolio_id, talent_definition_id),
    CONSTRAINT ck_owned_rank CHECK (highest_owned_rank > 0)
);

CREATE TABLE talent_rank_acquisition (
    acquisition_id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    portfolio_id               UUID NOT NULL REFERENCES character_talent_portfolio,
    character_id               UUID NOT NULL,
    talent_definition_id       UUID NOT NULL REFERENCES talent_definition,
    talent_version_id          UUID NOT NULL REFERENCES talent_version,
    rank_number                INTEGER NOT NULL,
    rank_fingerprint           VARCHAR(80) NOT NULL,
    acquisition_source_type    VARCHAR(48) NOT NULL,
    acquisition_source_id      VARCHAR(200) NOT NULL,
    reward_grant_id            UUID NULL,
    fulfillment_id             UUID NULL,
    tree_version_id            UUID NULL REFERENCES talent_tree_version,
    edition_id                 UUID NULL REFERENCES talent_tree_edition,
    evidence_snapshot_id       UUID NULL,
    operation_id               UUID NOT NULL,
    request_fingerprint        VARCHAR(80) NOT NULL,
    integrity_state            VARCHAR(32) NOT NULL,
    migration_parent_id        UUID NULL REFERENCES talent_rank_acquisition,
    acquired_at                TIMESTAMPTZ NOT NULL,
    portfolio_version_after    BIGINT NOT NULL,
    UNIQUE (portfolio_id, talent_definition_id, rank_number),
    UNIQUE (fulfillment_id),
    UNIQUE (operation_id)
);

CREATE INDEX ix_talent_acquisition_character_time
  ON talent_rank_acquisition (character_id, acquired_at DESC);
```

The uniqueness model may be extended for parallel version lineages only through an ADR. Version 1 treats one logical Talent key as one rank lineage per Character and realm.

### Skill ownership and runtime

```sql
CREATE TABLE character_skill_ownership (
    skill_ownership_id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    portfolio_id               UUID NOT NULL REFERENCES character_talent_portfolio,
    skill_definition_id        UUID NOT NULL REFERENCES skill_definition,
    skill_key                  VARCHAR(160) NOT NULL,
    skill_version_id           UUID NOT NULL REFERENCES skill_version,
    unlock_source_type         VARCHAR(48) NOT NULL,
    unlock_source_id           VARCHAR(200) NOT NULL,
    integrity_state            VARCHAR(32) NOT NULL,
    suppression_state          VARCHAR(48) NOT NULL,
    unlocked_at                TIMESTAMPTZ NOT NULL,
    record_version             BIGINT NOT NULL,
    UNIQUE (portfolio_id, skill_definition_id)
);

CREATE TABLE skill_charge_account (
    charge_account_id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    portfolio_id               UUID NOT NULL REFERENCES character_talent_portfolio,
    skill_definition_id        UUID NOT NULL REFERENCES skill_definition,
    scope_key                  VARCHAR(160) NOT NULL,
    current_charges            INTEGER NOT NULL,
    maximum_charges            INTEGER NOT NULL,
    regeneration_policy        VARCHAR(48) NOT NULL,
    regeneration_anchor_at     TIMESTAMPTZ NULL,
    next_charge_at             TIMESTAMPTZ NULL,
    ledger_sequence            BIGINT NOT NULL,
    record_version             BIGINT NOT NULL,
    UNIQUE (portfolio_id, skill_definition_id, scope_key),
    CONSTRAINT ck_skill_charges CHECK (
      current_charges >= 0 AND maximum_charges >= 0 AND current_charges <= maximum_charges
    )
);

CREATE TABLE skill_charge_ledger (
    charge_ledger_id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    charge_account_id          UUID NOT NULL REFERENCES skill_charge_account,
    sequence_number            BIGINT NOT NULL,
    entry_type                 VARCHAR(32) NOT NULL,
    amount                     INTEGER NOT NULL,
    charges_before             INTEGER NOT NULL,
    charges_after              INTEGER NOT NULL,
    source_type                VARCHAR(48) NOT NULL,
    source_id                  VARCHAR(200) NOT NULL,
    occurred_at                TIMESTAMPTZ NOT NULL,
    operation_id               UUID NOT NULL,
    UNIQUE (charge_account_id, sequence_number),
    UNIQUE (operation_id)
);

CREATE TABLE skill_cooldown_state (
    cooldown_state_id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    portfolio_id               UUID NOT NULL REFERENCES character_talent_portfolio,
    skill_definition_id        UUID NOT NULL REFERENCES skill_definition,
    scope_key                  VARCHAR(160) NOT NULL,
    last_activation_id         UUID NULL,
    started_at                 TIMESTAMPTZ NULL,
    ready_at                   TIMESTAMPTZ NULL,
    duration_milliseconds      BIGINT NULL,
    cooldown_version_id        UUID NULL,
    record_version             BIGINT NOT NULL,
    UNIQUE (portfolio_id, skill_definition_id, scope_key)
);

CREATE TABLE skill_activation (
    activation_id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    portfolio_id               UUID NOT NULL REFERENCES character_talent_portfolio,
    character_id               UUID NOT NULL,
    skill_definition_id        UUID NOT NULL REFERENCES skill_definition,
    skill_version_id           UUID NOT NULL REFERENCES skill_version,
    idempotency_scope          VARCHAR(200) NOT NULL,
    idempotency_key            VARCHAR(200) NOT NULL,
    request_fingerprint        VARCHAR(80) NOT NULL,
    activation_context         JSONB NOT NULL,
    activation_effects         JSONB NOT NULL,
    effect_fingerprint         VARCHAR(80) NOT NULL,
    charge_consumed            INTEGER NOT NULL,
    cooldown_ready_at          TIMESTAMPTZ NULL,
    loadout_revision           BIGINT NULL,
    accepted_at                TIMESTAMPTZ NOT NULL,
    portfolio_version_after    BIGINT NOT NULL,
    UNIQUE (idempotency_scope, idempotency_key)
);
```

### Talent resources

```sql
CREATE TABLE talent_resource_definition (
    resource_definition_id     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    resource_key               VARCHAR(160) NOT NULL UNIQUE,
    precision_scale            INTEGER NOT NULL,
    scope_policy               VARCHAR(48) NOT NULL,
    expiry_policy              VARCHAR(48) NOT NULL,
    definition_payload         JSONB NOT NULL,
    definition_fingerprint     VARCHAR(80) NOT NULL,
    lifecycle_state            VARCHAR(32) NOT NULL,
    published_at               TIMESTAMPTZ NULL,
    CONSTRAINT ck_resource_precision CHECK (precision_scale BETWEEN 0 AND 6)
);

CREATE TABLE talent_resource_account (
    resource_account_id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    portfolio_id               UUID NOT NULL REFERENCES character_talent_portfolio,
    resource_definition_id     UUID NOT NULL REFERENCES talent_resource_definition,
    resource_key               VARCHAR(160) NOT NULL,
    scope_key                  VARCHAR(160) NOT NULL,
    posted_balance             NUMERIC(30,6) NOT NULL,
    reserved_amount            NUMERIC(30,6) NOT NULL,
    account_state              VARCHAR(32) NOT NULL,
    ledger_sequence            BIGINT NOT NULL,
    record_version             BIGINT NOT NULL,
    updated_at                 TIMESTAMPTZ NOT NULL,
    UNIQUE (portfolio_id, resource_definition_id, scope_key),
    CONSTRAINT ck_resource_nonnegative CHECK (
      posted_balance >= 0 AND reserved_amount >= 0 AND posted_balance >= reserved_amount
    )
);

CREATE TABLE talent_resource_ledger (
    resource_ledger_id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    resource_account_id        UUID NOT NULL REFERENCES talent_resource_account,
    sequence_number            BIGINT NOT NULL,
    entry_type                 VARCHAR(32) NOT NULL,
    amount                     NUMERIC(30,6) NOT NULL,
    posted_before              NUMERIC(30,6) NOT NULL,
    posted_after               NUMERIC(30,6) NOT NULL,
    reserved_before            NUMERIC(30,6) NOT NULL,
    reserved_after             NUMERIC(30,6) NOT NULL,
    source_type                VARCHAR(48) NOT NULL,
    source_id                  VARCHAR(200) NOT NULL,
    acquisition_id             UUID NULL REFERENCES talent_rank_acquisition,
    expires_at                 TIMESTAMPTZ NULL,
    occurred_at                TIMESTAMPTZ NOT NULL,
    operation_id               UUID NOT NULL,
    request_fingerprint        VARCHAR(80) NOT NULL,
    UNIQUE (resource_account_id, sequence_number),
    UNIQUE (operation_id)
);

CREATE INDEX ix_resource_ledger_expiry
  ON talent_resource_ledger (expires_at)
  WHERE expires_at IS NOT NULL;
```

### Loadouts

```sql
CREATE TABLE talent_loadout_definition_version (
    loadout_definition_version_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    loadout_key                VARCHAR(160) NOT NULL,
    version_number             INTEGER NOT NULL,
    lifecycle_state            VARCHAR(32) NOT NULL,
    definition_payload         JSONB NOT NULL,
    definition_fingerprint     VARCHAR(80) NOT NULL,
    published_at               TIMESTAMPTZ NULL,
    UNIQUE (loadout_key, version_number)
);

CREATE TABLE character_talent_loadout (
    loadout_id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    portfolio_id               UUID NOT NULL REFERENCES character_talent_portfolio,
    loadout_key                VARCHAR(160) NOT NULL,
    current_revision           BIGINT NOT NULL,
    loadout_state              VARCHAR(32) NOT NULL,
    updated_at                 TIMESTAMPTZ NOT NULL,
    UNIQUE (portfolio_id, loadout_key)
);

CREATE TABLE character_talent_loadout_revision (
    loadout_id                 UUID NOT NULL REFERENCES character_talent_loadout,
    revision_number            BIGINT NOT NULL,
    loadout_definition_version_id UUID NOT NULL REFERENCES talent_loadout_definition_version,
    slots_payload              JSONB NOT NULL,
    loadout_fingerprint        VARCHAR(80) NOT NULL,
    operation_id               UUID NOT NULL,
    created_at                 TIMESTAMPTZ NOT NULL,
    created_by                 VARCHAR(200) NOT NULL,
    PRIMARY KEY (loadout_id, revision_number),
    UNIQUE (operation_id)
);
```

### Effect sets

```sql
CREATE TABLE character_effect_scope (
    effect_scope_id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    portfolio_id               UUID NOT NULL REFERENCES character_talent_portfolio,
    effect_scope               VARCHAR(160) NOT NULL,
    current_effect_revision    BIGINT NOT NULL,
    current_fingerprint        VARCHAR(80) NOT NULL,
    updated_at                 TIMESTAMPTZ NOT NULL,
    UNIQUE (portfolio_id, effect_scope)
);

CREATE TABLE character_effect_set_revision (
    effect_scope_id            UUID NOT NULL REFERENCES character_effect_scope,
    effect_revision            BIGINT NOT NULL,
    effects_payload            JSONB NOT NULL,
    effect_fingerprint         VARCHAR(80) NOT NULL,
    source_portfolio_version   BIGINT NOT NULL,
    reason_code                VARCHAR(64) NOT NULL,
    effective_from             TIMESTAMPTZ NOT NULL,
    outbox_event_id            UUID NOT NULL,
    created_at                 TIMESTAMPTZ NOT NULL,
    PRIMARY KEY (effect_scope_id, effect_revision),
    UNIQUE (outbox_event_id)
);
```

### Foreign fact projections

```sql
CREATE TABLE talent_foreign_fact_projection (
    character_id               UUID NOT NULL,
    realm_key                  VARCHAR(96) NOT NULL,
    fact_namespace             VARCHAR(96) NOT NULL,
    facts_payload              JSONB NOT NULL,
    source_aggregate_version   BIGINT NULL,
    source_sequence            BIGINT NULL,
    source_event_id            UUID NOT NULL,
    projection_version         BIGINT NOT NULL,
    observed_at                TIMESTAMPTZ NOT NULL,
    freshness_state            VARCHAR(32) NOT NULL,
    PRIMARY KEY (character_id, realm_key, fact_namespace)
);
```

### Operations, evidence, integrity, and audit

```sql
CREATE TABLE talent_operation (
    operation_id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    operation_type             VARCHAR(64) NOT NULL,
    character_id               UUID NULL,
    realm_key                  VARCHAR(96) NULL,
    idempotency_scope          VARCHAR(200) NOT NULL,
    idempotency_key            VARCHAR(200) NOT NULL,
    request_fingerprint        VARCHAR(80) NOT NULL,
    operation_state            VARCHAR(32) NOT NULL,
    actor_type                 VARCHAR(32) NOT NULL,
    actor_id                   VARCHAR(200) NOT NULL,
    correlation_id             UUID NULL,
    causation_id               UUID NULL,
    request_payload            JSONB NOT NULL,
    result_payload             JSONB NULL,
    error_code                 VARCHAR(128) NULL,
    created_at                 TIMESTAMPTZ NOT NULL,
    completed_at               TIMESTAMPTZ NULL,
    UNIQUE (idempotency_scope, idempotency_key)
);

CREATE TABLE talent_evidence_snapshot (
    evidence_snapshot_id       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    character_id               UUID NOT NULL,
    operation_id               UUID NOT NULL REFERENCES talent_operation,
    definition_references      JSONB NOT NULL,
    projection_references      JSONB NOT NULL,
    evaluated_requirements     JSONB NOT NULL,
    snapshot_fingerprint       VARCHAR(80) NOT NULL,
    security_classification    VARCHAR(32) NOT NULL,
    created_at                 TIMESTAMPTZ NOT NULL
);

ALTER TABLE talent_rank_acquisition
  ADD CONSTRAINT fk_acquisition_evidence
  FOREIGN KEY (evidence_snapshot_id) REFERENCES talent_evidence_snapshot;

CREATE TABLE talent_integrity_case (
    integrity_case_id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    portfolio_id               UUID NOT NULL REFERENCES character_talent_portfolio,
    target_type                VARCHAR(48) NOT NULL,
    target_id                  UUID NOT NULL,
    case_state                 VARCHAR(32) NOT NULL,
    previous_integrity_state   VARCHAR(32) NOT NULL,
    current_integrity_state    VARCHAR(32) NOT NULL,
    reason_code                VARCHAR(128) NOT NULL,
    evidence_references        JSONB NOT NULL,
    opened_by                  VARCHAR(200) NOT NULL,
    opened_at                  TIMESTAMPTZ NOT NULL,
    resolved_by                VARCHAR(200) NULL,
    approved_by                VARCHAR(200) NULL,
    resolved_at                TIMESTAMPTZ NULL,
    resolution_code            VARCHAR(128) NULL
);

CREATE TABLE talent_audit_log (
    audit_id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    occurred_at                TIMESTAMPTZ NOT NULL,
    actor_type                 VARCHAR(32) NOT NULL,
    actor_id                   VARCHAR(200) NOT NULL,
    action                     VARCHAR(128) NOT NULL,
    target_type                VARCHAR(64) NOT NULL,
    target_id                  VARCHAR(200) NOT NULL,
    character_id               UUID NULL,
    correlation_id             UUID NULL,
    causation_id               UUID NULL,
    operation_id               UUID NULL REFERENCES talent_operation,
    before_fingerprint         VARCHAR(80) NULL,
    after_fingerprint          VARCHAR(80) NULL,
    reason_code                VARCHAR(128) NULL,
    metadata                   JSONB NOT NULL DEFAULT '{}'::jsonb
);
```

### Reward fulfillment receipts

```sql
CREATE TABLE talent_reward_fulfillment_receipt (
    fulfillment_id             UUID PRIMARY KEY,
    reward_grant_id            UUID NOT NULL,
    component_id               UUID NOT NULL,
    component_type             VARCHAR(64) NOT NULL,
    character_id               UUID NOT NULL,
    request_fingerprint        VARCHAR(80) NOT NULL,
    operation_id               UUID NOT NULL REFERENCES talent_operation,
    fulfillment_state          VARCHAR(32) NOT NULL,
    owner_result_payload       JSONB NULL,
    result_fingerprint         VARCHAR(80) NULL,
    result_event_id            UUID NULL UNIQUE,
    received_at                TIMESTAMPTZ NOT NULL,
    completed_at               TIMESTAMPTZ NULL
);
```

### Inbox and outbox

```sql
CREATE TABLE talent_event_inbox (
    event_id                   UUID PRIMARY KEY,
    event_type                 VARCHAR(160) NOT NULL,
    schema_version             INTEGER NOT NULL,
    producer                   VARCHAR(160) NOT NULL,
    payload_fingerprint        VARCHAR(80) NOT NULL,
    partition_key              VARCHAR(200) NULL,
    occurred_at                TIMESTAMPTZ NOT NULL,
    received_at                TIMESTAMPTZ NOT NULL,
    processing_state           VARCHAR(32) NOT NULL,
    attempt_count              INTEGER NOT NULL DEFAULT 0,
    next_attempt_at            TIMESTAMPTZ NULL,
    operation_id               UUID NULL,
    result_event_id            UUID NULL,
    error_code                 VARCHAR(128) NULL,
    completed_at               TIMESTAMPTZ NULL
);

CREATE TABLE talent_event_outbox (
    outbox_event_id            UUID PRIMARY KEY,
    event_type                 VARCHAR(160) NOT NULL,
    schema_version             INTEGER NOT NULL,
    aggregate_type             VARCHAR(96) NOT NULL,
    aggregate_id               VARCHAR(200) NOT NULL,
    aggregate_version          BIGINT NULL,
    partition_key              VARCHAR(200) NOT NULL,
    correlation_id             UUID NULL,
    causation_id               UUID NULL,
    payload                    JSONB NOT NULL,
    payload_fingerprint        VARCHAR(80) NOT NULL,
    created_at                 TIMESTAMPTZ NOT NULL,
    published_at               TIMESTAMPTZ NULL,
    publish_attempt_count      INTEGER NOT NULL DEFAULT 0,
    next_attempt_at            TIMESTAMPTZ NULL
);

CREATE INDEX ix_talent_outbox_pending
  ON talent_event_outbox (created_at)
  WHERE published_at IS NULL;

CREATE INDEX ix_talent_inbox_retry
  ON talent_event_inbox (next_attempt_at)
  WHERE processing_state = 'RETRYABLE_FAILURE';
```

### Jobs

```sql
CREATE TABLE talent_job (
    job_id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_type                   VARCHAR(64) NOT NULL,
    job_state                  VARCHAR(32) NOT NULL,
    definition_payload         JSONB NOT NULL,
    definition_fingerprint     VARCHAR(80) NOT NULL,
    requested_by               VARCHAR(200) NOT NULL,
    approved_by                VARCHAR(200) NULL,
    created_at                 TIMESTAMPTZ NOT NULL,
    started_at                 TIMESTAMPTZ NULL,
    completed_at               TIMESTAMPTZ NULL,
    checkpoint                 JSONB NULL,
    total_count                BIGINT NULL,
    processed_count            BIGINT NOT NULL DEFAULT 0,
    success_count              BIGINT NOT NULL DEFAULT 0,
    noop_count                 BIGINT NOT NULL DEFAULT 0,
    failure_count              BIGINT NOT NULL DEFAULT 0
);

CREATE TABLE talent_job_item (
    job_id                     UUID NOT NULL REFERENCES talent_job,
    item_key                   VARCHAR(240) NOT NULL,
    character_id               UUID NULL,
    item_state                 VARCHAR(32) NOT NULL,
    operation_id               UUID NULL,
    attempt_count              INTEGER NOT NULL DEFAULT 0,
    error_code                 VARCHAR(128) NULL,
    result_payload             JSONB NULL,
    updated_at                 TIMESTAMPTZ NOT NULL,
    PRIMARY KEY (job_id, item_key)
);
```

### Database access rules

- Runtime application roles receive least-privilege access.
- No foreign service receives write access.
- Read replicas may serve non-authoritative projections, not acquisition decisions.
- Ledger and audit tables deny update and delete to normal application roles.
- Published Definition rows deny update through database permissions and application guards.
- Administrative commands use the same domain transaction path as ordinary operations.
- Row-level security may be used for internal tools but does not replace service authorization.
- Backups, replicas, exports, and logs use encryption and retention controls.

### Partitioning and archival

High-volume tables may be partitioned:

- inbox and outbox by month;
- activations by month or Character hash;
- audit by month;
- ledgers by Character hash;
- effect revisions by Character hash and time;
- job items by job id.

Partition maintenance must not break unique idempotency guarantees. If global uniqueness is difficult across partitions, a dedicated operation index must preserve it.

### Schema migrations

Migrations must be backward compatible through the supported deployment window. Recommended sequence:

1. add nullable or defaulted structures;
2. deploy dual-read or dual-write where required;
3. backfill with resumable jobs;
4. validate constraints;
5. switch readers;
6. remove deprecated fields only after consumer compatibility expires.

Published Event schemas are versioned separately from database migrations.

---

## API Specification

The API is divided into owner-facing, public, trusted internal, authoring, support, and administrative surfaces. Authentication and authorization are mandatory unless an endpoint is explicitly public.

### General API rules

- Base path: `/v1`.
- JSON uses camelCase.
- Timestamps are RFC 3339 UTC.
- Amounts use strings when fixed precision could exceed safe client integer ranges; integer Talent Points may use JSON integers.
- Mutating requests require `Idempotency-Key`.
- Optimistic commands use `If-Match` or explicit expected revision.
- Responses include `requestId`, `operationId` where applicable, and revision metadata.
- Errors use stable machine code, localization key, safe details, and retryability.
- Secret content is filtered before serialization.
- Pagination uses opaque cursors.
- Bulk list size is bounded.
- Public APIs never expose Definition payloads or effect schemas directly.

### Error envelope

```json
{
  "error": {
    "code": "talent.prerequisite_not_met",
    "messageKey": "talent.acquire.prerequisite_not_met",
    "retryable": false,
    "details": {
      "requirementPresentationKeys": [
        "talent.requirement.previous_rank"
      ],
      "redactedRequirementCount": 1
    },
    "requestId": "uuid"
  }
}
```

### Owner endpoints

#### `GET /v1/characters/{characterId}/talents`

Returns the owner Portfolio projection.

Query parameters:

- `include=resources,loadouts,skills,recentActivity`;
- `treeEditionId` optional;
- `locale`;
- `projectionBarrier` optional operation id.

Authorization: Character owner or delegated principal.

#### `GET /v1/characters/{characterId}/talent-trees`

Returns active and visible Tree Editions with Character summary state.

#### `GET /v1/characters/{characterId}/talent-trees/{editionId}`

Returns Character-specific node states and safe eligibility explanations.

#### `GET /v1/characters/{characterId}/talents/{talentKey}`

Returns Talent detail for the owner, including rank history and safe next-rank decision.

#### `POST /v1/characters/{characterId}/talent-acquisitions`

Acquires the rank represented by a Tree node.

Headers:

- `Idempotency-Key` required;
- `If-Match: "portfolio-{version}"` recommended.

Request:

```json
{
  "treeEditionId": "uuid",
  "nodeKey": "footwork_rank_2",
  "expectedResourceVersions": {
    "core.talent_point:global": 17
  }
}
```

Success `201`:

```json
{
  "operationId": "uuid",
  "outcome": "APPLIED",
  "acquisition": {
    "acquisitionId": "uuid",
    "talentKey": "school.footwork_control",
    "rank": 2,
    "acquiredAt": "2026-07-18T12:00:00Z"
  },
  "resourceChanges": [
    {
      "resourceKey": "core.talent_point",
      "balanceAfter": 6,
      "accountVersion": 18
    }
  ],
  "effectRevisions": {
    "reward-calculation": 31
  },
  "portfolioVersion": 128
}
```

The same request returns `200` with `ACCEPTED_NOOP` or the original `201` semantics according to API gateway convention.

#### `GET /v1/characters/{characterId}/talent-resources`

Returns current Talent Resource accounts and scope-safe expiry information.

#### `GET /v1/characters/{characterId}/talent-loadouts`

Returns available Loadout Definitions and current revisions.

#### `PUT /v1/characters/{characterId}/talent-loadouts/{loadoutKey}`

Creates a new immutable Loadout revision.

Request:

```json
{
  "expectedRevision": 17,
  "slots": [
    {
      "slotKey": "passive_1",
      "entryType": "TALENT",
      "entryKey": "school.footwork_control",
      "rank": 2
    },
    {
      "slotKey": "active_1",
      "entryType": "SKILL",
      "entryKey": "school.focused_breathing"
    }
  ]
}
```

Returns affected effect revisions and new Portfolio version.

#### `GET /v1/characters/{characterId}/skills`

Returns owner Skill Runtime View.

#### `POST /v1/characters/{characterId}/skills/{skillKey}/activations`

Activates a Skill.

Request:

```json
{
  "activationContext": {
    "type": "school.training_session",
    "schemaVersion": 1,
    "reference": "opaque-id"
  }
}
```

Success `201` includes activation id, charges remaining, cooldown `readyAt`, and accepted activation effect summary.

A cooldown conflict returns `409 skill.cooldown_active` with authoritative `readyAt` and `serverTime`.

#### `GET /v1/operations/{operationId}`

Returns owner-safe asynchronous operation state.

### Public endpoints

#### `GET /v1/public/characters/{characterId}/talents`

Returns public Talent projection subject to Character visibility and Talent policy.

#### `GET /v1/catalog/talent-trees/{editionKey}`

Returns public static Tree content without Character-specific secret state. Hidden nodes may be omitted entirely.

Public responses use CDN caching only when content and privacy classification permit it.

### Trusted internal query endpoints

#### `GET /internal/v1/characters/{characterId}/talent-facts`

Returns current valid effective ownership facts for an authorized consumer namespace.

The caller must declare `consumer` and requested fact keys. The service applies field-level authorization.

#### `GET /internal/v1/characters/{characterId}/effect-scopes/{scope}`

Returns latest complete Effect Set for the exact authorized scope.

Response includes revision and fingerprint. Consumers may use it for bootstrap or reconciliation after Event gaps.

#### `POST /internal/v1/effect-reconciliation`

Allows a registered consumer to report its last applied revision and request missing or latest complete state. This endpoint does not mutate Talent state.

### Reward fulfillment interface

Primary integration is Event-based. An internal synchronous endpoint may exist only as a transport adapter that uses the same idempotent command path:

#### `POST /internal/v1/reward-fulfillments`

Authorized only to Reward Engine. Requires `fulfillmentId`, request fingerprint, Component Type, and payload. It returns the same semantic result later published as a fulfillment Event. The endpoint must not create a different execution path.

### Trusted grant endpoints

#### `POST /internal/v1/characters/{characterId}/talent-resources/{resourceKey}/grants`

Restricted to approved services and preferably replaced by Reward fulfillment.

#### `POST /internal/v1/characters/{characterId}/talent-grants`

Restricted to migration or explicitly approved direct-grant sources. It requires source policy and cannot be a generic Module convenience endpoint.

### Authoring endpoints

- `POST /admin/v1/talent-definitions`;
- `POST /admin/v1/talent-definitions/{id}/versions`;
- `PATCH /admin/v1/talent-versions/{versionId}`;
- `POST /admin/v1/talent-versions/{versionId}/validate`;
- `POST /admin/v1/talent-versions/{versionId}/submit`;
- `POST /admin/v1/talent-versions/{versionId}/approve`;
- `POST /admin/v1/talent-versions/{versionId}/publish`;
- `POST /admin/v1/talent-versions/{versionId}/retire`;
- equivalent Skill and Tree endpoints;
- `POST /admin/v1/talent-tree-editions`;
- `POST /admin/v1/talent-tree-editions/{editionId}/activate`;
- `POST /admin/v1/talent-tree-editions/{editionId}/pause`;
- `POST /admin/v1/talent-tree-editions/{editionId}/end`;
- `POST /admin/v1/effect-contracts/validate`;
- `POST /admin/v1/content-packages/simulations`.

### Simulation endpoint

#### `POST /admin/v1/talent-simulations`

Inputs:

- draft or published content package;
- synthetic or authorized Character snapshot;
- operation sequence;
- expected effect scopes;
- optional historical Event sample references.

Outputs:

- validation errors;
- prerequisite decisions;
- resource balance transitions;
- acquisitions;
- loadout outcomes;
- Skill activation outcomes;
- effect-set diffs;
- compatibility warnings;
- cycle and size analysis;
- performance estimate.

Simulation cannot mutate production state.

### Support endpoints

- `GET /support/v1/characters/{characterId}/talent-portfolio`;
- `GET /support/v1/operations/{operationId}`;
- `GET /support/v1/reward-fulfillments/{fulfillmentId}`;
- `GET /support/v1/integrity-cases/{caseId}`;
- `POST /support/v1/characters/{characterId}/recompute-effects`;
- `POST /support/v1/characters/{characterId}/rebuild-projections`;
- `POST /support/v1/integrity-cases`;
- `POST /support/v1/integrity-cases/{caseId}/resolve`.

Sensitive fields require elevated permissions and purpose logging.

### Job endpoints

- `POST /admin/v1/talent-jobs`;
- `GET /admin/v1/talent-jobs/{jobId}`;
- `POST /admin/v1/talent-jobs/{jobId}/pause`;
- `POST /admin/v1/talent-jobs/{jobId}/resume`;
- `POST /admin/v1/talent-jobs/{jobId}/cancel`;
- `GET /admin/v1/talent-jobs/{jobId}/failures`;
- `POST /admin/v1/talent-jobs/{jobId}/retry-failures`.

### Rate limits

Recommended default limits are policy, not fixed normative values:

- owner acquisition: low burst per Character;
- loadout updates: bounded burst with debounce guidance;
- Skill activation: per Skill and Character, in addition to domain cooldown;
- catalog reads: CDN-friendly;
- internal effect queries: service quota and cache;
- support queries: operator quota;
- simulations and jobs: asynchronous concurrency limits.

Rate limiting never substitutes for cooldown or idempotency.

### API compatibility

- Additive response fields may be introduced within a version.
- Behavioral changes require a new API or content contract version.
- Error codes are stable.
- Removed fields require deprecation telemetry and published sunset.
- Client-provided Definition versions are never silently reinterpreted.

---

## Admin Features

### Content authoring workspace

The administration UI should support:

- logical Talent, Skill, Tree, Resource, and Loadout catalog navigation;
- immutable version history;
- draft editing with schema-aware forms;
- graph visualization;
- rank comparison;
- effect contract selection;
- prerequisite builder using registered fact paths;
- localization completeness;
- secret-content classification;
- ownership and reviewer assignment;
- validation and compilation reports;
- diff against prior published version;
- compatibility warnings;
- simulated Character journeys;
- publication scheduling.

### Graph validation

The Tree editor must detect:

- cycles;
- unreachable nodes;
- rank gaps;
- missing references;
- contradictory prerequisites;
- impossible exclusivity combinations;
- insufficient resource supply assumptions where a package includes modeled sources;
- hidden-node leaks;
- loadout categories without slots;
- effects with unknown consumers;
- effect stacking ambiguity;
- Skill unlocks without valid Skill Versions.

### Effect governance

New effect types require:

- semantic owner;
- consumer owner;
- schema;
- exact units;
- stacking policy;
- ordering policy;
- security classification;
- privacy classification;
- compatibility range;
- failure behavior;
- replay behavior;
- maximum payload contribution;
- cycle analysis;
- test vectors;
- approved ADR for high-impact semantics.

Content authors may instantiate only registered effect types.

### Review and approval

High-risk actions require separation of duties:

- an author cannot be sole publisher of their own new effect contract;
- emergency Skill disablement requires incident role;
- bulk grant requires approval and dry run;
- permanent invalidation requires integrity role and approver;
- privacy export or anonymization requires privacy role;
- repair affecting resource balances requires dual review above configured threshold.

### Character inspection

Authorized support can inspect:

- exact owned ranks and version lineage;
- why a rank was acquired;
- resource ledger and balance derivation;
- current and historical loadouts;
- Skill activation receipts;
- cooldown and charge calculations;
- current effect sets and source Talents;
- consumer convergence;
- Reward fulfillment linkage;
- integrity cases;
- outbox and projection status.

### Safe repair actions

Admin UI exposes typed actions, never arbitrary row editing:

- republish missing Event;
- rebuild projection;
- recompute effect scope;
- recalculate resource account from ledger;
- close orphan reservation;
- restore missing derived Skill unlock;
- suppress Talent pending review;
- restore valid ownership;
- initiate migration;
- issue compensating resource credit;
- retry failed Reward fulfillment result publication.

### Bulk operations

Bulk operations support:

- explicit target query snapshot;
- immutable job definition;
- dry-run count and sample;
- estimated effect size;
- approval;
- concurrency and rate limits;
- pause, resume, and cancel;
- per-Character idempotency;
- exception export;
- final signed report.

A bulk operation never means one transaction across all Characters.

### Incident controls

Authorized incident operators may:

- pause an Edition;
- emergency-disable Skill activation;
- suppress a specific effect contract scope;
- stop a job;
- pause Event consumption by contract;
- enable fail-closed consumer response;
- trigger effect reconciliation;
- route conflicting Events to quarantine.

Emergency controls must be time-bounded, audited, and followed by formal resolution.

### Definition deletion

Drafts may be deleted according to audit policy. Published Definitions, versions, Editions, and referenced content cannot be physically deleted through ordinary administration.

---

## UX Requirements

### Narrative-first presentation

The UI should explain Talents as capabilities and identity choices, not merely as percentage bonuses. Each Talent should answer:

- what the Character has learned or become;
- what new possibility it creates;
- why the next rank matters;
- how it relates to the Character's journey;
- whether it is permanent, equipped, suppressed, or currently usable.

### Tree comprehension

A Talent Tree must provide:

- visible progression direction;
- clear node ownership state;
- understandable prerequisites;
- exact costs;
- current resource balance;
- rank comparison;
- branch or exclusivity warning before irreversible acquisition;
- confirmation for permanent spend;
- accessible non-graph alternative.

### Irreversible acquisition

Before resource spend, the UI must show:

- exact Talent and rank;
- permanent nature of acquisition;
- exact resource cost and balance after;
- mutually exclusive consequences if any;
- effect summary;
- content Edition where relevant.

The server response is authoritative. The client must not optimistically subtract resources permanently before success.

### Hidden content

Secret Talents and prerequisites may appear as:

- omitted;
- silhouette;
- generic unknown requirement;
- narrative clue;
- revealed only after eligibility or unlock.

The server determines visibility. Hiding only with CSS or client filtering is prohibited.

### Loadout editing

Loadout UX must:

- distinguish owned from active;
- show slot constraints;
- show effect changes before confirmation using server simulation or validated local preview;
- identify conflicts;
- use optimistic concurrency;
- recover from another-device edits;
- avoid implying that unequipping deletes ownership.

### Skill activation

Skill UI must display:

- unlock and equipped state;
- current charges;
- authoritative cooldown countdown based on `readyAt`;
- activation context requirements;
- confirmation for costly or high-impact activations where appropriate;
- accepted activation receipt;
- downstream pending state only when the product integrates a separate consumer acknowledgement.

A client animation is not proof of server acceptance.

### Latency and feedback

- Acquisition should return an authoritative result synchronously when possible.
- If processing is asynchronous, UI shows a pending operation and prevents duplicate action using the same idempotency key.
- Read projection lag is reconciled with the command response.
- Skill activation should meet interactive latency targets and return deterministic rejection details.
- Effect propagation to foreign consumers may be eventually consistent and should be labeled only where visible to the user.

### Accessibility

Talent UIs must support:

- keyboard navigation;
- screen-reader descriptions;
- non-color state indicators;
- zoom and responsive layout;
- text alternative to graph edges;
- localized pluralization and number formatting;
- reduced motion;
- clear cooldown time text;
- sufficient contrast;
- confirmation that is not dependent on pointer precision.

### Integrity and suppression UX

Public users should not see sensitive investigation details. Owners may see safe states such as:

- “temporarily unavailable”;
- “under review”;
- “content retired; ownership preserved”;
- “Skill disabled temporarily.”

Support and administration views carry the exact reason under permission.

### Reward separation

When a Reward grants a Talent, the product may present one combined narrative moment, but technical status remains separate:

- Reward Grant status is owned by Reward Engine;
- Talent ownership status is owned by Talent Engine;
- the UI should not claim Reward completion until Reward projection confirms it;
- accepted-no-op fulfillment may still be a successful Reward component.

### Public profile

Only explicitly public Talent facts appear. Private loadouts, resources, Skill cooldowns, and secret sources never appear publicly.

---

## Security

### Threat model

The Engine must defend against:

- forged Reward fulfillment Events;
- client attempts to grant Talents or resources;
- replayed acquisition and activation requests;
- idempotency-key substitution;
- race conditions causing double spend or cooldown bypass;
- unauthorized access to secret content;
- malicious Definition payloads;
- effect contract injection;
- cross-tenant or cross-realm reference confusion;
- privilege escalation through Module capability facts;
- support-tool misuse;
- bulk grant abuse;
- ledger tampering;
- Event producer spoofing;
- stale projection exploitation;
- denial of service through pathological graphs or effect sets;
- sensitive context leakage in logs or Events.

### Authentication

- User commands require current authenticated identity.
- Service Events require workload identity and transport authentication.
- Producer allowlists are enforced per Event type.
- Reward fulfillment accepts only Reward Engine identity.
- Internal queries require mTLS or equivalent service authentication.
- Administrative sessions require strong authentication and step-up for high-risk operations.

### Authorization

Authorization is evaluated server-side for every command and query.

Owner commands require ownership or explicit delegation from Character Engine. Service roles are scoped to namespaces, Component Types, effect scopes, and operations.

A Talent capability fact must never automatically grant service-level authorization inside Talent Engine. Business Modules must enforce their own access policy.

### Definition security

- Definition JSON is schema validated.
- String interpolation into SQL or code is prohibited.
- Payload size, depth, node count, prerequisite count, and effect count are bounded.
- References use canonical registries.
- New effect contracts require approval.
- HTML or rich text is sanitized at presentation boundaries.
- Media references are indirect and validated.
- Secret content is stored with restricted access classification.

### Event security

- Transport identity must match `producer`.
- Event schema and fingerprint are validated before processing.
- Duplicate Event id with different fingerprint is quarantined and alerted.
- Correlation metadata is not trusted for authorization.
- Replayed Events preserve original identity and cannot bypass policies.
- Restricted Events use access-controlled topics.

### Concurrency security

Database constraints and aggregate version checks are mandatory. Application-level “check then write” without transaction protection is insufficient.

Skill activation checks and charge/cooldown writes occur in one transaction. Resource balance and Talent acquisition occur in one transaction.

### Secret Talent protection

Secret details must not leak through:

- public catalog APIs;
- owner API before reveal policy;
- error specificity;
- GraphQL introspection or generic entity APIs;
- CDN cache keys;
- logs;
- analytics dimensions;
- client bundles;
- search indexes;
- support roles without permission;
- Event payloads sent to broad topics.

### Administrative security

- High-risk actions use reason codes and ticket references.
- Dual control is required for configured bulk grants, resource corrections, and invalidations.
- Every admin read of restricted evidence is purpose logged.
- Break-glass access expires automatically.
- Direct production database access is emergency-only and cannot be the standard repair path.

### Rate and abuse controls

- Acquisition and activation endpoints are rate limited per principal and Character.
- Skill cooldown remains authoritative even if rate limiting fails.
- Repeated invalid attempts feed abuse telemetry.
- Expensive simulations and catalog validations have quotas.
- Bulk jobs have global and namespace concurrency caps.

### Encryption and secrets

- Data is encrypted in transit and at rest.
- Service credentials are managed outside Definition data.
- No secrets appear in Event payloads, source code configuration packages, or logs.
- Sensitive audit exports use encrypted object storage and expiring access.

### Supply-chain controls

Compiler and schema dependencies are pinned, scanned, and reproducible. A content package fingerprint includes compiler contract version where compilation semantics matter.

---

## Privacy

### Data minimization

The Engine stores only data required for Talent functionality, audit, security, and operations. It should not copy profile content, email, billing details, or complete foreign Event payloads.

### Character identifiers

`character_id` is the primary subject identifier. User account identifiers are used only where authorization or audit requires them and are not propagated in broad Talent Events.

### Visibility

Visibility is the intersection of:

- Character profile visibility;
- Talent Definition visibility;
- Character owner selection where allowed;
- Module or realm privacy policy;
- minor-safe policy;
- integrity or moderation suppression.

The strictest applicable rule wins.

### Purpose limitation

Foreign fact projections contain only facts needed by registered prerequisites. A new prerequisite path requires documented purpose and retention.

Skill activation context is minimized to type and opaque reference. Raw location, health, attendance, or behavioral data is not copied unless a separately reviewed contract requires it.

### Right of access

A Character data export should include:

- owned Talents and ranks;
- acquisition dates and human-readable sources where legally permitted;
- Talent Resource ledger;
- loadouts;
- Skills and relevant activation history under retention policy;
- privacy-visible integrity state;
- effect summaries;
- automated decision explanations at an appropriate level.

Internal security signals, other individuals' data, and protected fraud methods may be excluded according to law and policy.

### Correction

Incorrect profile identity is corrected by Character Engine. Incorrect Talent state uses controlled repair or integrity workflow. Historical audit is preserved while current projections are corrected.

### Closure and anonymization

On Character closure:

- user mutations stop;
- public projections are removed;
- active effects are suppressed or cleared through new revisions;
- ownership is retained for restoration and audit.

On anonymization:

- personal actor references are pseudonymized or removed where allowed;
- public and owner projections are deleted;
- activation contexts are removed or irreversibly tokenized according to retention;
- the Portfolio becomes irreversible `ANONYMIZED`;
- aggregate history may retain non-personal technical identifiers and Definition references;
- downstream consumers receive empty or tombstone effect revisions.

### Retention

Retention is configured by data class and jurisdiction. Skill activation context should have shorter retention than permanent acquisition history. Inbox payloads and decision traces should be minimized after operational need expires.

### Children and vulnerable users

Minor-safe policy may:

- restrict public Talent display;
- hide social or performance comparisons;
- disable certain Skill contexts;
- reduce support exposure;
- require guardian or organization policy for public sharing.

The Engine consumes the policy projection and does not infer age from behavior.

### Analytics privacy

Analytics uses pseudonymous identifiers, aggregation thresholds, and purpose-limited datasets. Secret Talent keys and sensitive Skill context are excluded unless explicitly approved.

---

## Performance

### Service-level objectives

Illustrative production targets, subject to deployment ADR:

- owner Portfolio read: p95 under 200 ms from regional API cache or projection;
- Tree view read: p95 under 300 ms for up to 500 visible nodes;
- Talent acquisition command: p95 under 350 ms excluding external gateway latency;
- Loadout update: p95 under 300 ms;
- Skill activation: p95 under 150 ms in-region;
- Reward fulfillment processing: p95 under 1 second from Event receipt when dependencies are healthy;
- outbox publication lag: p99 under 5 seconds;
- effect-set projection propagation: p99 under 10 seconds;
- Character lifecycle suppression: p99 under 10 seconds;
- read availability: at least 99.9%;
- mutation availability: at least 99.9% unless stronger platform SLO is adopted.

### Definition limits

Version 1 recommended hard limits:

- 100 ranks per Talent, with practical content guidance far lower;
- 10,000 nodes per Tree Version;
- 100 prerequisites per node after compilation;
- 100 effects per rank;
- 2,000 active effects per Character and scope before compaction is required;
- 100 loadout slots per definition;
- bounded JSON depth and payload size;
- bounded Skill activation effect count.

Limits prevent pathological content and may be lower by namespace.

### Hot path optimization

- Cache immutable compiled Definitions by id and fingerprint.
- Query only affected ownership and resource rows.
- Precompute prerequisite dependency indexes.
- Recompute only affected effect scopes.
- Use canonical effect diffs internally but publish complete scope snapshots.
- Avoid synchronous foreign service calls.
- Partition by Character.
- Keep Skill charge and cooldown state indexed by Portfolio and Skill.
- Use prepared statements and bounded transactions.

### Effect computation

Effect recomputation complexity should be proportional to active sources in affected scopes, not all historical acquisitions. The Engine maintains a source-to-scope index.

If the computed fingerprint equals the current fingerprint, no new effect revision is required unless policy requires a semantic timestamp boundary. The operation records an accepted no-op for effects.

### Charge regeneration

Charge readiness is calculated lazily during reads and activation from the persisted regeneration anchor and policy. Background jobs may materialize updates for UX but are not required for correctness.

This avoids one timer per Character Skill.

### Cooldown readiness

Cooldown uses `ready_at`; no database write is needed when time passes. Optional readiness Events are generated by a scalable delayed queue or scan and are non-authoritative.

### Projection scaling

- Owner projections are sharded by Character.
- Catalog projections are globally cacheable by immutable version.
- Effect projections are partitioned by Character and scope.
- Search indexes contain only visibility-safe fields.
- Rebuilds use snapshot plus Event tail where available.

### Backpressure

Priority order under load:

1. Skill activation and Character lifecycle restrictions;
2. owner acquisition and Reward fulfillment;
3. outbox publication;
4. current read projections;
5. reconciliation;
6. backfill, migration, analytics, and simulation.

Low-priority jobs pause automatically when live latency or database pressure crosses thresholds.

### Bulk jobs

Jobs use bounded batches, checkpoints, jitter, and per-partition rate limits. They must not create a thundering herd of effect-set Events. Coalescing may publish only the final complete revision per Character and scope when intermediate job steps are not externally meaningful.

### Database performance

- Index by Character, Definition, operation, fulfillment, and pending work.
- Use append-only partitions for high-volume ledgers.
- Prevent unbounded JSON scans on hot paths.
- Analyze query plans under production-scale cardinality.
- Keep transactions short.
- Archive historical activation detail while retaining required audit summary.

### Capacity planning

Capacity models include:

- Characters and active Characters;
- average owned ranks;
- acquisition rate;
- Skill activation rate;
- Resource ledger rate;
- effect scopes per Character;
- average effects per scope;
- Definition count and publication rate;
- projection fan-out;
- Event replay volume;
- bulk job worst case.

---

## Audit

### Audit goals

The Engine must reconstruct:

- who created, reviewed, approved, published, paused, retired, or disabled content;
- why a Character acquired a Talent rank;
- what prerequisites and resource state were used;
- whether a request was duplicate, conflicting, or rejected;
- how each Resource balance was derived;
- why a Skill activation was accepted or rejected;
- what effect-set revision resulted;
- which consumer revision was published;
- what administrative or integrity action occurred;
- how a migration transformed ownership.

### Audit event classes

- content authoring and publication;
- acquisition commands;
- trusted grants and Reward fulfillments;
- Resource ledger operations;
- Loadout updates;
- Skill unlocks and activations;
- cooldown and charge corrections;
- effect-set revisions;
- Character lifecycle suppression;
- integrity cases;
- administrative reads of restricted data;
- repair and migration jobs;
- security conflicts;
- privacy export and anonymization.

### Required audit fields

Every audit record contains:

- immutable audit id;
- UTC timestamp;
- actor type and id;
- authenticated session or workload identity reference;
- action;
- target type and id;
- Character id where applicable;
- operation id;
- correlation and causation ids;
- before and after fingerprints;
- reason code;
- approval reference where required;
- source IP or security context according to privacy policy;
- sanitized metadata.

### Decision explanations

Acquisition explanations include exact Definition and projection versions. User-facing explanations may redact hidden details; support explanations show more under permission; security evidence remains separately restricted.

### Ledger reconciliation

Scheduled controls verify:

- Resource account balances equal ledger derivation;
- charge accounts equal charge ledger derivation;
- every acquisition has an operation and audit record;
- every applied Reward fulfillment has a receipt and result Event;
- every current effect pointer references an immutable revision;
- every effect revision sources valid ownership or explicit suppression;
- every outbox Event is eventually published or alerted;
- no published Definition changed fingerprint;
- no Portfolio has negative or impossible state.

### Metrics

Core metrics:

- acquisition requests, successes, no-ops, rejections, conflicts;
- prerequisite rejection by safe code;
- insufficient-resource rate;
- Resource grants and spends by source;
- Reward fulfillment latency and failure class;
- loadout update rate and conflicts;
- Skill activations, cooldown rejections, charge rejections;
- effect recomputation latency and effect-set size;
- effect publication lag and consumer convergence;
- inbox duplicate and fingerprint conflict rate;
- outbox backlog;
- projection lag;
- integrity cases;
- job throughput and failures;
- admin high-risk actions;
- secret-content access attempts.

### Tracing

Distributed traces propagate correlation and causation but never use trace metadata as authorization. Sensitive payloads are excluded from spans.

### Alerting

Alert conditions include:

- negative balance constraint attempt;
- duplicate fulfillment fingerprint conflict;
- cooldown bypass invariant failure;
- unpublished Definition used for acquisition;
- effect revision regression;
- outbox lag above SLO;
- projection gap not self-healed;
- Resource reconciliation mismatch;
- anomalous bulk grant volume;
- unauthorized secret content access;
- elevated activation conflict rate;
- Character closure without empty/restricted effect publication;
- changed fingerprint for published content.

### Audit retention

Audit retention must meet legal, security, and product requirements. Append-only history is protected from ordinary deletion. Privacy-sensitive metadata is minimized or pseudonymized independently from the non-personal progression fact.

---

## Edge Cases

The following cases define deterministic behavior. An implementation must not rely on undefined “best effort” outcomes.

### Duplicate acquisition command

The same idempotency key and request fingerprint returns the original outcome. No second Resource spend, acquisition, audit mutation, Portfolio increment, or effect revision occurs.

### Reused idempotency key with different node

The request is rejected with `talent.idempotency_conflict`. Neither request is reinterpreted.

### Concurrent acquisition of the same rank

At most one transaction commits. The loser retries or returns accepted no-op after observing the committed acquisition. The Resource is spent once.

### Concurrent acquisition of different ranks

Rank sequencing and expected Portfolio version serialize outcomes. A request for rank 3 cannot commit before rank 2 unless the grant mode atomically includes missing ranks.

### Concurrent spend from one Resource account

Unique ledger sequence and row/version locking prevent negative balance. One request may fail with insufficient Resource or concurrency conflict after the other commits.

### Request timeout after commit

The caller retries with the same idempotency key. The original result is returned. A new key may create a second logical attempt and should be prevented by UI and source-operation design where duplicate acquisition is impossible.

### Definition retired between page render and command

The server evaluates current authoritative Edition and retirement policy. The command is rejected even if the client displayed an older eligible state.

### Edition ends during command processing

The transaction uses server time at the defined decision point. If the command was durably received before the deadline and policy defines receipt-time eligibility, it may succeed; otherwise it is rejected. The policy must be explicit and immutable.

### Future-dated client timestamp

Ignored for acquisition and Skill readiness. Server time is authoritative.

### Stale Progression prerequisite projection

If freshness exceeds the prerequisite policy limit, acquisition returns retryable `talent.prerequisite_projection_stale`; it does not guess.

### Out-of-order foreign fact Events

Older source aggregate versions are ignored as accepted no-op. Missing versions trigger reconciliation where required. A contradictory same-version payload is quarantined.

### Source correction before acquisition

The corrected local projection is used. The original fact remains in inbox history.

### Source correction after acquisition

Ownership is not silently removed. Policy may open an integrity case. Effects may remain, be contested, or be suppressed according to approved integrity configuration.

### Reward fulfillment for already-owned rank

If Component Type policy treats existing ownership as satisfying the request, Talent Engine returns successful accepted no-op with exact current ownership. It does not emit a duplicate acquisition Event.

### Reward fulfillment targets lower rank than current

Returns accepted no-op when compatible. It never downgrades the Character.

### Reward fulfillment targets rank beyond maximum

Returns terminal failure. It does not clamp silently.

### Reward fulfillment references retired exact version

Behavior follows component and retirement policy. A migration-safe exact historical grant may be allowed only when publication explicitly permits it; otherwise terminal failure.

### Duplicate `fulfillment_id`, same fingerprint

Returns the original result Event semantics.

### Duplicate `fulfillment_id`, different fingerprint

Quarantines the request and alerts. No state change.

### Reward reversal for permanent Talent

Returns `talent.permanent_acquisition_not_reversible` unless the Component Type explicitly supports an integrity or compensation workflow. Original ownership remains.

### Resource grant reversal after Resource was spent

A strict reversal that would make balance negative fails terminally or requires compensation workflow. The Engine never rewrites historical spend.

### Expiring Resource spent at expiry boundary

The authoritative comparison is defined as `server_now < expires_at` for availability. At exactly `expires_at`, the Resource is expired.

### Multiple expiring Resource lots

Spend ordering is deterministic, normally earliest-expiry-first, then ledger sequence. The selected lots are recorded.

### Resource precision mismatch

Request is rejected. Values are not rounded implicitly.

### Definition cost changed in a new version

Existing Tree Edition continues to use its exact referenced version. The client cannot substitute a newer cost.

### Rank grant unlocks a Skill already unlocked independently

Skill ownership becomes accepted no-op or records an additional entitlement source according to source-set policy. There is still one effective Skill ownership.

### Talent rank invalidated but Skill has another valid source

Skill remains unlocked. Source derivation recomputes across all valid sources.

### Talent removed from Loadout after Skill activation

The accepted activation remains historical. Future activation requires current loadout. Downstream active-duration semantics are owned by the activation consumer contract and are not retroactively cancelled unless a typed revocation protocol exists.

### Loadout update on another device

The stale revision receives `talent.loadout_version_conflict` and current revision metadata. It does not overwrite newer state.

### Loadout contains owned but suppressed Talent

The loadout may retain the selection for restoration, but effects exclude it and UI marks it suppressed. Policy may alternatively reject new selection while preserving existing revision.

### Content retirement invalidates a Loadout slot

The current revision becomes `INVALID` or remains active under retirement policy. An effect recomputation publishes the correct complete set. The system may create a repaired default revision only through explicit deterministic policy.

### Empty Loadout

Valid only when the Loadout Definition allows it. The resulting effect set may be empty.

### Effect stacking overflow

Compilation and runtime exact arithmetic enforce limits. Overflow rejects publication or operation; values are never wrapped.

### Unknown effect contract during publication

Publication fails. Draft remains editable.

### Effect consumer unavailable

Talent mutation still commits and outbox retries. No synchronous consumer dependency exists. Convergence monitoring alerts if lag persists.

### Consumer misses effect revisions

It queries latest complete Effect Set and applies the greater revision. Intermediate revisions may be skipped safely.

### Effect fingerprint unchanged after Loadout edit

Loadout revision commits, but no new Effect Set revision is required unless the consumer contract requires one. Audit records the no-effect result.

### Character suspended during acquisition

Whichever transaction observes lifecycle first determines outcome under serialized Portfolio version. If acquisition commits before the suspension projection transaction, the subsequent suspension suppresses effects. If suspension commits first, acquisition is rejected.

### Character closed while Reward fulfillment is pending

The fulfillment follows configured lifecycle policy, normally retryable or terminal rejection. It must not reactivate the Character or publish active effects.

### Character restored

Ownership remains. Effect sets are recomputed and published from current valid content and loadouts. Cooldowns are not automatically cleared unless policy says suspension pauses or advances them; that policy must be explicit.

### Character anonymized

All future commands fail terminally. Personal context is removed. Empty/tombstone effect revisions are published. The Character id is never reassigned.

### Cooldown timer delayed

Activation at or after `ready_at` succeeds regardless of missing `skill.cooldown.ready.v1`.

### Clock moves backward

Persisted `ready_at` remains authoritative. Implementations use trusted time and monotonic safeguards. A detected major clock anomaly may fail closed and alert.

### Skill activation duplicated by network retry

Same idempotency key returns original activation receipt; charges and cooldown are not applied twice.

### Skill activation with new key during active cooldown

Rejected with cooldown state. A new key does not bypass cooldown.

### Simultaneous Skill activations

Transactional lock/version ensures at most the permitted number consumes charges. Shared cooldown scope serializes correctly.

### Multiple Skills share a cooldown group

The group scope key is common. Activating one updates the shared cooldown state and blocks the others according to Definition.

### Charge regeneration and activation at same instant

The transaction first materializes deterministic charge state at server time, then validates and consumes. The result is independent of background timer execution.

### Charge maximum reduced in a new Skill Version

Existing account migration policy defines whether excess charges are preserved temporarily, capped with ledger correction, or consumed first. Silent deletion is prohibited.

### Skill emergency-disabled after client opens screen

Server rejects activation. UI refreshes from authoritative error.

### Invalid activation context reference

Schema validation rejects malformed context. Talent Engine may validate reference shape and trust scope but does not call the Module to prove the referenced action exists unless an approved signed-context contract is used.

### Downstream Module rejects accepted Skill activation

The Skill activation remains accepted history. The Module may publish a typed application failure. Compensation of charges or cooldown requires explicit policy and idempotent protocol; it is not inferred automatically.

### Hidden Talent inferred through error timing

Authorization and error behavior must be normalized. Unknown and hidden-unavailable identifiers should not provide distinguishable details to unauthorized clients.

### Secret node included in public cache

This is a privacy/security incident. Cache is purged, access logged, contract fixed, and affected Definition reviewed.

### Definition fingerprint mismatch in cache

The cache entry is discarded and reloaded. Published database fingerprint is authoritative. A changed persisted fingerprint is a critical incident.

### Inbox Event id collision

Same fingerprint is accepted duplicate. Different fingerprint is quarantined and no handler runs.

### Outbox publish acknowledged but database not updated

Retry republishes the same Event id. Consumers deduplicate.

### Projection built before outbox Event publish

Allowed if projection and Event both originate from committed state. Consumers use revision, not wall-clock publish order, for convergence.

### Projection lag after acquisition

Command response remains authoritative. Owner UI may use operation result until projection catches up.

### Migration partially fails

Completed Character items remain committed. Job pauses or continues according to policy. Retry uses the same per-Character operation IDs.

### Migration maps two old Talents to one new Talent

Mapping policy defines source merging. The new ownership is acquired once with lineage to both sources; effects are deduplicated deterministically.

### Migration would reduce rank

Prohibited by default. A new version may reinterpret rank presentation only with explicit compatibility policy; owned historical ranks are not overwritten.

### Bulk grant targets Character twice

Job item identity and Character operation idempotency produce one effect.

### Support recompute runs during acquisition

Recompute uses Portfolio version and retries if it changes. It must not publish an effect set based on a stale mixed snapshot.

### Ledger mismatch detected

Resource account is frozen for spend, alert is raised, and a controlled ledger-derived repair is required. The Engine does not silently adjust balance.

### Orphan acquisition without outbox Event

Reconciliation republishes the missing deterministic Event with a stable repair Event id and audit record.

### Missing derived Skill unlock

Reconciliation derives it from valid Talent sources and applies an idempotent repair. It does not create a second Talent acquisition.

### Invalidated acquisition had contributed public badge

Public projection removes or marks it according to policy, while audit preserves history. Character Engine presentation receives a new entitlement/effect revision.

### Deleted localization asset

Technical ownership remains. UI falls back to stable placeholder localization key and alerts content operations.

### Consumer interprets unsupported effect schema

Consumer rejects/quarantines it and requests reconciliation. Publication should have prevented incompatible content, but runtime must fail safe.

### Effect cycle across Engines

Publication is rejected when registry dependency analysis finds a prohibited cycle, such as Talent effect changing Reward that grants the same Talent automatically without a repeatability boundary.

### Automatic-on-eligibility cascade

Version 1 must bound cascades by acyclic dependency graph, maximum acquisitions per transaction/job, and explicit source facts. Unbounded recursive unlock is prohibited.

### Business Module removes membership

Projected prerequisites and capability scopes update. Ownership remains; Module-scoped effects may be suppressed if policy requires active membership.

### Season ends

New Edition acquisition stops. Existing permanent ownership remains. Season-scoped loadouts, effects, charges, or Skills follow explicit end policy and publish revisions.

### Multiple realms

Ownership and resources are isolated by realm unless a Definition explicitly declares global scope. Cross-realm transfer requires migration, not accidental key reuse.

### Tenant removal

Tenant-scoped content stops new use. Platform-owned Character history remains according to contractual and privacy policy. Namespace and realm boundaries prevent another tenant from adopting identifiers implicitly.

---

## Acceptance Tests

The following tests are normative release criteria. They may be implemented as unit, property, contract, integration, migration, security, load, or chaos tests. A production release must maintain traceability from each applicable requirement to automated evidence.

### Definition lifecycle

1. A valid Talent draft can be created with a unique canonical key.
2. A duplicate Talent key is rejected.
3. A draft can be updated only with the expected draft revision.
4. A stale draft update returns a conflict and preserves the newer draft.
5. Submission runs schema validation.
6. A Talent with zero ranks cannot be submitted.
7. Non-contiguous ranks are rejected.
8. A rank above declared maximum is rejected.
9. A prerequisite using an unregistered fact path is rejected.
10. A prerequisite graph cycle is rejected.
11. A Tree graph cycle is rejected.
12. An unreachable mandatory Tree node produces a validation error.
13. A missing Talent Version reference prevents Tree publication.
14. A missing Skill Version reference prevents publication.
15. An unknown Talent Resource key prevents publication.
16. An unknown Loadout Definition prevents publication.
17. An unknown effect type prevents publication.
18. An unsupported effect schema version prevents publication.
19. An unsupported stacking policy prevents publication.
20. Floating-point numeric effect values are rejected.
21. Effect arithmetic outside configured bounds is rejected.
22. Secret content without security classification is rejected.
23. A new high-risk effect contract requires reviewer approval.
24. An author cannot solely approve their own protected effect contract.
25. Published content receives a deterministic fingerprint.
26. Recompiling identical canonical content produces the same fingerprint.
27. Reordering non-semantic JSON fields does not change fingerprint.
28. Changing semantic effect value changes fingerprint.
29. A published Talent Version cannot be edited.
30. Publishing a correction creates a new immutable version.
31. Retiring a Talent Version prevents new ordinary acquisition.
32. Retirement does not delete existing ownership.
33. A Skill retirement policy is enforced exactly.
34. A Tree Edition activates only at or after its server-authoritative schedule.
35. Pausing an Edition blocks new acquisition.
36. Ending an Edition preserves existing ownership.
37. Cancelling a planned Edition prevents activation.
38. A Definition Event contains the exact stored fingerprint.
39. Publishing the same version twice with the same fingerprint is a no-op.
40. The same version id with a different fingerprint raises a critical conflict.

### Portfolio lifecycle

41. `character.created.v1` creates at most one Portfolio per realm.
42. Duplicate Character creation Event does not create a second Portfolio.
43. Portfolio initialization publishes `talent.portfolio.initialized.v1` once.
44. Acquisition is blocked while Portfolio is `INITIALIZING`.
45. Active Character permits eligible operations.
46. Character suspension transitions Portfolio to restricted behavior.
47. Suspension does not delete ownership.
48. Suspension publishes effect revisions reflecting suppression.
49. Character restoration recomputes current valid effects.
50. Character closure rejects user acquisition.
51. Character closure rejects Skill activation.
52. Closure preserves acquisition ledger.
53. Closure removes or suppresses public projection.
54. Anonymization is irreversible.
55. Anonymization removes owner/public projections.
56. Anonymization publishes empty or tombstone effect revisions.
57. An anonymized Character id is never reused.
58. An older lifecycle Event cannot overwrite a newer projection.
59. Same lifecycle source version with contradictory payload is quarantined.
60. Portfolio version increases once per committed mutation.

### Eligibility and acquisition

61. An eligible Character with sufficient Resource acquires rank 1.
62. Rank 1 emits `talent.unlocked.v1`.
63. Every acquired rank emits `talent.rank.acquired.v1`.
64. Acquisition stores exact Talent Version and fingerprint.
65. Acquisition stores exact Tree Version and Edition when applicable.
66. Acquisition stores a minimized prerequisite evidence snapshot.
67. Acquisition with unmet visible prerequisite is rejected with safe detail.
68. Acquisition with unmet secret prerequisite is rejected without leaking it.
69. Acquisition with stale required projection fails retryably.
70. Acquisition with current projection evaluates deterministically.
71. Rank 2 cannot be acquired before rank 1.
72. A bounded grant mode may atomically grant all missing ranks.
73. A Character cannot exceed maximum rank.
74. Reacquiring an owned rank is an accepted no-op under compatible request.
75. A conflicting lineage request is rejected or quarantined according to policy.
76. An inactive Edition rejects ordinary acquisition.
77. A realm mismatch rejects acquisition.
78. A retired Definition rejects ordinary acquisition.
79. A resource-only acquisition cannot bypass cost.
80. A reward-only Talent rejects owner resource-spend acquisition.
81. A direct-grant-only Talent rejects ordinary owner acquisition.
82. An exclusivity conflict is detected before spend.
83. A successful acquisition and Resource spend commit atomically.
84. An acquisition failure leaves Resource unchanged.
85. An acquisition success creates audit and outbox records atomically.
86. A database failure before commit creates no partial acquisition.
87. A timeout after commit is safely retried.
88. Same idempotency key and fingerprint returns original result.
89. Same idempotency key and different fingerprint returns conflict.
90. Concurrent duplicate acquisitions produce one durable acquisition.
91. Concurrent Resource spends cannot produce negative balance.
92. Definition retirement between read and command is enforced by server.
93. Server time, not client time, decides Edition boundary.
94. Exact boundary semantics are covered for start and end timestamps.
95. Foreign source correction before acquisition changes eligibility projection.
96. Foreign source correction after acquisition does not silently delete ownership.
97. An integrity case may be opened from post-acquisition correction.
98. Automatic-on-eligibility content is bounded and acyclic.
99. One source Event cannot cause duplicate automatic acquisition.
100. Replay does not auto-acquire unless backfill policy permits it.

### Talent Resources

101. A trusted valid grant creates a Resource account when allowed.
102. A Resource grant appends an immutable ledger entry.
103. Balance after grant equals previous balance plus exact amount.
104. Duplicate grant operation is a no-op.
105. Conflicting duplicate grant is rejected.
106. Resource spend selects deterministic lots where expiry applies.
107. Resource spend at exactly expiry time rejects expired lot.
108. Resource balance never becomes negative.
109. Resource precision is enforced.
110. Implicit rounding is rejected.
111. A frozen Resource account cannot spend.
112. Policy may allow grants to a frozen account only when configured.
113. Expiry appends a ledger entry rather than editing a grant.
114. A reversal appends a ledger entry.
115. A reversal that would create negative balance is rejected or compensated explicitly.
116. Resource account balance can be rebuilt exactly from ledger.
117. A reconciliation mismatch freezes spend and alerts.
118. Ledger sequence is monotonic per account.
119. Concurrent ledger writes preserve unique sequence.
120. Resource balance change Event carries account version.
121. Resource ledger contains source operation and actor.
122. Resource data is absent from public projection.

### Reward fulfillment

123. Talent Engine accepts fulfillment only from authenticated Reward Engine.
124. An unauthorized producer is rejected before mutation.
125. `TALENT_UNLOCK` grants configured rank according to policy.
126. `TALENT_RANK_GRANT` grants missing ranks up to bounded target.
127. `SKILL_UNLOCK` grants exactly one Skill entitlement.
128. `TALENT_RESOURCE_GRANT` credits exact Resource amount.
129. `SKILL_CHARGE_GRANT` is accepted only when Skill policy allows it.
130. Unknown Component Type is rejected terminally.
131. Wrong owner Engine is rejected.
132. Missing Definition reference is rejected terminally.
133. Rank above maximum is rejected terminally.
134. Character lifecycle restriction follows Component policy.
135. Reward grant may bypass ordinary cost only when Component schema says so.
136. Reward grant cannot bypass Definition compatibility.
137. Same fulfillment id and fingerprint returns original success.
138. Same fulfillment id and fingerprint returns original failure.
139. Same fulfillment id with different fingerprint is quarantined.
140. Successful fulfillment stores receipt before result publication.
141. Result Event contains owner operation id and Portfolio version.
142. Applied result lists exact acquisitions or Resource ledger entries.
143. Existing compatible ownership may return successful accepted no-op.
144. Accepted no-op does not emit duplicate rank acquisition Event.
145. Retryable infrastructure failure returns retryable class.
146. Terminal content failure returns terminal class.
147. Permanent Talent reversal request fails with explicit non-reversible code.
148. Reversible unspent Resource grant follows exact reversal policy.
149. Reward Engine timeout retry cannot double apply.
150. Reward fulfillment does not require a synchronous distributed transaction.

### Loadouts

151. A Loadout accepts only owned entries.
152. A Loadout rejects unknown slot keys.
153. A slot rejects an incompatible entry category.
154. Capacity limits are enforced.
155. Exclusivity groups are enforced.
156. Duplicate entry policy is enforced.
157. Updating a Loadout creates an immutable revision.
158. The prior revision remains auditable.
159. Expected revision prevents lost updates.
160. A stale update receives current revision metadata.
161. A Loadout may retain suppressed ownership without activating effects when policy allows.
162. An invalid retired entry follows explicit repair policy.
163. Empty Loadout is accepted only when definition permits it.
164. Loadout update and effect recomputation commit atomically.
165. A loadout edit with unchanged effects does not publish unnecessary revision.
166. Loadout Event does not leak secret entries to unauthorized topic.
167. Public API never exposes private Loadout.
168. Character restoration reapplies valid current Loadout effects.
169. Migration preserves Loadout lineage or records deterministic repair.
170. Concurrent edits cannot merge silently.

### Effect sets

171. Every active effect has a valid owned source.
172. Suppressed ownership contributes no active effect.
173. Invalidated ownership contributes according to integrity policy.
174. Effect normalization is deterministic.
175. Effect ordering is deterministic.
176. Additive fixed stacking produces exact expected result.
177. Basis-point multiplication uses declared canonical order.
178. `MAXIMUM` and `MINIMUM` stacking select deterministic values.
179. `HIGHEST_PRIORITY_ONLY` resolves ties deterministically.
180. Non-stacking conflict is rejected during publication or recomputation.
181. Effect arithmetic does not use floating point.
182. Overflow fails safely.
183. Effect revision is monotonic per Character and scope.
184. Effect fingerprint changes when semantic effect changes.
185. Effect fingerprint remains when only presentation metadata changes.
186. Published Event is a complete snapshot for the scope.
187. An empty Effect Set is published when all effects are suppressed.
188. A consumer can bootstrap from internal latest-effect query.
189. A consumer ignores older revisions.
190. A consumer detects same revision with different fingerprint as conflict.
191. Missing intermediate revisions can be healed using latest complete snapshot.
192. Acquisition affects only indexed scopes.
193. Effect recompute from the same Portfolio version is idempotent.
194. Recompute racing with acquisition retries on Portfolio change.
195. Consumer unavailability does not roll back Talent acquisition.
196. Outbox retry republishes the same Event id.
197. Cross-Engine effect dependency cycle is rejected.
198. Experience-related effect is consumed before final Progression operation.
199. Progression Engine receives finalized integer amount, not Talent script.
200. Module capability effect does not bypass Module authorization.

### Skills, charges, and cooldowns

201. An unlocked, equipped, ready Skill with charges can activate.
202. Activation appends immutable receipt.
203. Activation consumes exact configured charges.
204. Activation starts exact configured cooldown.
205. Charge, cooldown, activation, audit, and outbox commit atomically.
206. A locked Skill cannot activate.
207. A suppressed Skill cannot activate.
208. A loadout-required Skill cannot activate when unequipped.
209. Invalid activation context is rejected.
210. Client cannot override charge cost.
211. Client cannot override cooldown duration.
212. Client cannot inject activation effects.
213. Same activation idempotency key returns original receipt.
214. Conflicting reuse of activation key is rejected.
215. New key during cooldown does not bypass cooldown.
216. Cooldown readiness is based on server `readyAt`.
217. Missing cooldown-ready timer Event does not block activation after `readyAt`.
218. A Skill on cooldown returns authoritative `readyAt`.
219. Current charges never become negative.
220. Current charges never exceed maximum.
221. Lazy charge regeneration equals background-materialized result.
222. Simultaneous activations consume at most available charges.
223. Shared cooldown group blocks all configured Skills.
224. Different cooldown scopes remain independent.
225. Emergency-disabled Skill rejects activation.
226. Retired-use-allowed Skill remains activatable for existing owner.
227. Retired-disabled Skill is suppressed.
228. Accepted activation Event includes exact Skill Version and fingerprint.
229. Downstream Module can deduplicate activation by activation id.
230. Downstream rejection does not erase activation history.
231. Compensation occurs only under explicit typed protocol.
232. Skill activation context is absent from public projection.
233. Activation retention minimization removes expired sensitive context safely.
234. Character closure blocks activation immediately after lifecycle projection applies.
235. Restoration follows configured cooldown passage policy.

### Integrity, migration, and repair

236. Opening integrity review preserves original acquisition.
237. Contested state publishes configured suppression effect revision.
238. Dismissing a case restores valid effects.
239. Invalidation requires authorized role.
240. High-risk invalidation requires approval.
241. Invalidation never deletes Resource ledger or acquisition.
242. Restoration records a new integrity transition.
243. Public projection follows integrity visibility policy.
244. Migration references exact source and target versions.
245. Migration records lineage.
246. Migration does not lower rank silently.
247. Duplicate migration item is a no-op.
248. Partial job failure does not roll back completed Characters.
249. Job resumes from checkpoint.
250. Job cancellation stops new items but preserves completed operations.
251. Bulk target set is snapshotted or deterministically query-versioned.
252. Bulk grant duplicate Character target applies once.
253. Dry run performs no mutation.
254. Effect recompute repair does not change ownership.
255. Resource rebuild derives exact ledger balance.
256. Missing outbox Event can be republished through typed repair.
257. Missing derived Skill unlock can be repaired from valid sources.
258. Arbitrary SQL patch is not exposed through admin API.
259. Every repair creates audit and operation records.
260. Repair idempotency prevents repeated correction.

### Event processing and resilience

261. Duplicate inbox Event with same fingerprint is accepted once.
262. Duplicate Event id with different fingerprint is quarantined.
263. Unknown schema version is quarantined.
264. Unauthorized producer is rejected.
265. Old source aggregate version cannot regress projection.
266. Contradictory same source version alerts.
267. At-least-once delivery produces exactly-once logical effect.
268. Inbox and mutation commit in the same transaction or equivalent safe protocol.
269. Outbox record commits with state mutation.
270. Broker redelivery does not duplicate downstream effect.
271. Process crash after commit before acknowledgement is safe.
272. Process crash before commit leaves no partial state.
273. Retryable inbox failure schedules retry with backoff.
274. Poison Event reaches dead-letter/quarantine after policy threshold.
275. Replay preserves original id and does not bypass idempotency.
276. Projection rebuild does not emit duplicate acquisitions.
277. Disaster recovery replay reconstructs the same ownership and balances.
278. Event payloads contain no profile biography or email.
279. Secret prerequisite details are absent from broad Event topics.
280. Correlation id is propagated without being trusted for authorization.

### Security and privacy

281. Owner cannot mutate another Character's Portfolio.
282. Delegated access follows Character Engine authorization projection.
283. A Module service cannot call content publication without role.
284. Reward Engine is limited to registered Component Types.
285. Public catalog cannot enumerate secret Talent keys.
286. Error timing and content do not reveal hidden Talent existence materially.
287. Shared cache keys include privacy and visibility dimensions.
288. Secret content is absent from client bundle.
289. Definition rich text is sanitized.
290. Malicious deeply nested Definition is rejected by limits.
291. Logs redact activation context where classified.
292. Restricted support evidence requires explicit permission.
293. Restricted evidence reads are purpose logged.
294. Break-glass permission expires.
295. Bulk grant requires configured approval.
296. Resource correction above threshold requires dual control.
297. Data export contains owner-visible Talent history.
298. Data export excludes protected fraud methods.
299. Character closure removes public Talent projection.
300. Anonymization removes personal actor references according to policy.
301. Analytics projection is pseudonymized.
302. Minor-safe policy suppresses public Talent display where required.
303. Cross-realm request cannot access another realm's Resource account.
304. Cross-tenant key confusion is rejected.
305. Service credentials never appear in Definition payload.

### Performance and operations

306. Immutable Definition cache serves exact version by fingerprint.
307. Skill activation meets target latency at expected load.
308. Acquisition meets target latency at expected load.
309. Tree view meets target latency at configured maximum size.
310. Outbox backlog remains within SLO at expected peak.
311. Effect recomputation scales with affected active sources, not total history.
312. Lazy cooldown and charge evaluation avoids timer-per-Skill correctness dependency.
313. Live workload receives priority over backfill.
314. Bulk job throttles under database pressure.
315. Projection lag is measurable.
316. Consumer effect convergence is measurable.
317. Resource ledger reconciliation runs successfully at production scale.
318. Partition archival preserves idempotency uniqueness.
319. Read replica is not used for authoritative acquisition decision.
320. Chaos test of broker redelivery produces no duplicate acquisition.
321. Chaos test of database failover preserves committed ledger invariants.
322. Chaos test of consumer outage preserves outbox and later convergence.
323. Clock anomaly detection fails safe for cooldown-sensitive operations.
324. A stale owner projection is reconciled with command response revision.
325. Published Definition fingerprint mutation triggers critical alert.

---

## Future Extensions

The following capabilities are intentionally deferred. They require separate RFCs or ADRs before implementation.

### Reversible allocation and respec

A future model may distinguish permanent Talent entitlement from reversible point allocation. It must define:

- what remains permanently owned;
- refund rules;
- cooldown and cost for respec;
- effects during transition;
- interaction with Rewards already earned;
- exploit prevention;
- audit and narrative presentation;
- migration from permanent-only version 1.

### Multi-loadout presets

Characters may maintain multiple named presets with activation costs or context switching. Switching must remain server-authoritative and bounded.

### Contextual automatic loadouts

A future Engine may select loadouts by trusted context such as activity type. It must not allow clients to forge context or create unbounded evaluation.

### Shared group Talents

Guild, team, organization, or household capability aggregates require a new owner aggregate. They must not be forced into Character Portfolio.

### Temporary borrowed Talents

Items, Seasons, mentors, or events may lend temporary capabilities. This requires explicit lease, expiry, source-loss, and effect convergence semantics distinct from permanent ownership.

### Talent crafting or synthesis

Combining multiple Talents into a new capability would require a deterministic recipe and ownership-consumption policy.

### Dynamic mastery tracks

Per-Talent usage mastery could be introduced, but long-term Experience-like progression should remain in Progression Engine unless the metric is strictly Talent-owned and an ADR defines the boundary.

### Rich Skill effect acknowledgement

A two-phase activation/application protocol may allow a Module to acknowledge that a Skill effect was consumed and trigger conditional charge refund. It requires strict idempotency and timeout semantics.

### Offline activation tokens

Offline clients may receive bounded signed activation capabilities. This is high risk because of cooldown and replay; it requires cryptographic token, expiry, counter, and reconciliation design.

### Regional active-active writes

Multi-region Character mutation requires globally safe idempotency, partition ownership, conflict resolution, and clock policy. Version 1 should prefer single-writer home region per Character.

### Effect contract negotiation

Consumers may publish supported effect schema ranges and receive compatibility gating automatically. Publication already records minimum versions; dynamic negotiation is future work.

### Effect compaction

Large Effect Sets may use registered aggregate descriptors or query-backed projections while preserving deterministic complete-state semantics.

### Formal rules verification

Content compiler may use SAT/SMT techniques to detect unreachable combinations, contradictory prerequisites, and economic impossibility.

### AI-assisted authoring

AI may suggest Talents, descriptions, graph layouts, and balance risks. It cannot publish content, create effect contracts, or bypass deterministic validation and human approval.

### Marketplace Talent packages

Third-party Talent content requires namespace isolation, sandboxed effect contracts, signatures, moderation, commercial licensing, and revocation policy.

### Portable Character capability export

A signed capability credential could allow selected Talent facts to be verified outside the platform. Privacy, expiry, revocation, and issuer trust require a separate RFC.

### Advanced cooldown policies

Future policies may support charges with independent cooldowns, daily reset in explicit time zones, shared category cooldown, or cooldown reduction effects. Each requires deterministic temporal semantics.

### Talent recommendation

A recommendation service may suggest next Talents using read models. It must not become authoritative, expose secret nodes, or manipulate acquisition.

### Experimentation

A/B testing of presentation is allowed outside authoritative semantics. Testing different costs, prerequisites, or effects requires separate immutable Editions and must preserve fairness and explainability.

---

## ADR References

The following decisions are normative in this RFC and the shared platform
contract RFCs. Standalone ADR files MAY mirror them for repository traceability
but may not redefine the contracts independently.

### ADR-001 — Platform First

The platform core remains independent from School and future Module logic.

### ADR-002 — Event-Driven Engine Communication

Engines communicate through immutable Events and local projections rather than direct database mutation.

### ADR-003 — Platform-Owned Character

Talent state belongs to the platform Character and not to a Business Module.

### ADR-004 — Single Writer per Aggregate

Talent Engine is the only writer of Talent Portfolio, Skill runtime, Talent Resource, Loadout, and Effect Set state.

### ADR-005 — Immutable Published Content

Published Talent, Skill, Tree, Edition, Resource, and Loadout versions are immutable.

### ADR-006 — Transactional Inbox and Outbox

At-least-once transport is converted to exactly-once logical effect using durable idempotency and transactional messaging patterns.

### ADR-007 — Bounded Declarative Rule Language

Prerequisites and effects use typed schemas; arbitrary scripts are prohibited.

### ADR-008 — Permanent Talent Acquisition

Version 1 Talent rank acquisition is append-only and non-reversible by ordinary user action.

### ADR-009 — Typed Cross-Engine Effect Sets

Talents influence foreign state through complete versioned effect-set projections and capability facts, not imperative writes.

### ADR-010 — Reward Fulfillment Ownership

Reward Engine owns the grant saga; Talent Engine owns application and receipt of Talent-related components.

### ADR-011 — Finalized Progression Amounts

Talent modifiers affecting Experience are resolved before Progression Engine receives the final integer operation.

### ADR-012 — Server-Authoritative Skill Runtime

Skill charges, cooldowns, and activation acceptance use trusted server time and atomic Character-scoped state.

### ADR-013 — Integrity over Destructive Rollback

Corrections to permanent Talent history use contested, invalidated, restored, suppression, and compensation workflows rather than deletion.

### ADR-014 — Local Foreign-Fact Projections

Talent prerequisites consume minimized local projections with version and freshness, not synchronous foreign database reads.

### ADR-015 — Effect Consumer Convergence

Effect Events are complete monotonic snapshots per Character and scope; consumers can recover from gaps by querying latest state.

### ADR-016 — Talent Resource Boundary

Only resources whose sole semantic purpose is Talent acquisition or Skill use belong to Talent Engine.

### ADR-017 — Character Lifecycle Fail-Closed Policy

Stale or restricted Character lifecycle state blocks sensitive mutations and suppresses active capabilities according to policy.

### ADR-018 — Secret Content Server-Side Enforcement

Hidden Talents and prerequisites are filtered before API, Event, cache, log, and index boundaries.

---

## Appendix

### Appendix A — Example Talent Definition

```yaml
talent_key: school.footwork_control
version_number: 3
schema_version: 1
visibility_policy: PUBLIC_AFTER_UNLOCK
acquisition_policy: RESOURCE_SPEND
maximum_rank: 3
presentation:
  name_key: talent.school.footwork_control.name
  description_key: talent.school.footwork_control.description
  icon_asset_id: asset:talent-footwork-control
  category: TECHNIQUE
ranks:
  - rank: 1
    prerequisite:
      all:
        - fact: progression.core.level
          operator: GTE
          value: 3
    cost:
      resource_key: core.talent_point
      amount: 1
    effects:
      - effect_key: training_xp_rank_1
        effect_type: REWARD_AMOUNT_MODIFIER
        schema_version: 1
        effect_scope: reward-calculation
        target:
          reward_category: TRAINING_XP
        operation: ADD_BASIS_POINTS
        value_basis_points: 200
        stacking_policy: ADDITIVE_FIXED
        priority: 100
  - rank: 2
    prerequisite:
      all:
        - talent_rank:
            talent_key: school.footwork_control
            rank: 1
        - fact: achievement.school.consistent_training
          operator: EQ
          value: true
    cost:
      resource_key: core.talent_point
      amount: 2
    effects:
      - effect_key: training_xp_rank_2
        effect_type: REWARD_AMOUNT_MODIFIER
        schema_version: 1
        effect_scope: reward-calculation
        target:
          reward_category: TRAINING_XP
        operation: ADD_BASIS_POINTS
        value_basis_points: 500
        stacking_policy: ADDITIVE_FIXED
        priority: 100
  - rank: 3
    prerequisite:
      all:
        - talent_rank:
            talent_key: school.footwork_control
            rank: 2
        - fact: quest.school.advanced_footwork.completed
          operator: EQ
          value: true
    cost:
      resource_key: core.talent_point
      amount: 3
    grants_skills:
      - skill_key: school.focused_breathing
        version_selector:
          mode: EXACT
          skill_version_id: 11111111-1111-1111-1111-111111111111
```

### Appendix B — Example Skill Definition

```yaml
skill_key: school.focused_breathing
version_number: 1
schema_version: 1
visibility_policy: OWNER_AND_PUBLIC_AFTER_UNLOCK
activation:
  context_schema: school.training_session.v1
  requires_loadout:
    loadout_key: school.training
    slot_category: ACTIVE_SKILL
  charges:
    maximum: 2
    activation_cost: 1
    regeneration:
      policy: INTERVAL
      interval_milliseconds: 21600000
  cooldown:
    scope: CHARACTER_SKILL
    duration_milliseconds: 3600000
  effects:
    - effect_type: MODULE_CAPABILITY_ACTIVATION
      schema_version: 1
      target_namespace: school
      effect_key: focused_breathing_active
      duration_milliseconds: 600000
```

### Appendix C — Example Talent Tree

```yaml
tree_key: school.core_mastery
version_number: 2
resource_keys:
  - core.talent_point
nodes:
  - node_key: footwork_rank_1
    type: TALENT_RANK
    talent_key: school.footwork_control
    talent_version_id: 22222222-2222-2222-2222-222222222222
    rank: 1
    position: {column: 1, row: 1}
  - node_key: footwork_rank_2
    type: TALENT_RANK
    talent_key: school.footwork_control
    talent_version_id: 22222222-2222-2222-2222-222222222222
    rank: 2
    position: {column: 1, row: 2}
edges:
  - from: footwork_rank_1
    to: footwork_rank_2
    type: REQUIRES
```

### Appendix D — Prerequisite operators

Version 1 bounded operators:

- `EQ`;
- `NEQ` where secret leakage risk is reviewed;
- `GT`;
- `GTE`;
- `LT`;
- `LTE`;
- `IN_SET`;
- `CONTAINS` for registered set facts;
- `EXISTS`;
- `ALL`;
- `ANY`;
- `NOT` only where publication analysis can preserve explainability;
- exact Talent rank prerequisite;
- active Edition prerequisite;
- time-window prerequisite using server time.

Unbounded regex, arbitrary JSONPath, scripts, remote calls, and general expressions are prohibited.

### Appendix E — Effect contract checklist

Every effect contract specifies:

1. unique type and schema version;
2. semantic owner;
3. consuming system;
4. exact target schema;
5. exact value units;
6. allowed operations;
7. stacking behavior;
8. priority and tie-breaking;
9. maximum value and count;
10. compatibility rules;
11. replay and deduplication behavior;
12. security classification;
13. privacy classification;
14. public explainability strategy;
15. failure and fallback behavior;
16. cycle dependencies;
17. test vectors;
18. deprecation policy.

### Appendix F — Canonical acquisition algorithm

```text
function acquire_rank(command):
    authenticate_and_authorize(command.actor, command.character_id)
    operation = register_idempotent_operation(command)
    if operation.has_terminal_result:
        return operation.result

    begin transaction
      portfolio = lock_portfolio(command.character_id, realm)
      assert_expected_version(command.expected_portfolio_version)
      assert_portfolio_allows_acquisition(portfolio)

      edition = load_immutable_edition(command.tree_edition_id)
      node = edition.resolve_node(command.node_key)
      rank_plan = node.resolve_rank_plan()

      assert_server_time_in_edition_policy(edition)
      assert_definition_is_compatible(rank_plan)
      assert_rank_sequence(portfolio, rank_plan)
      assert_not_already_owned_or_return_noop()

      facts = load_required_local_projections(rank_plan)
      assert_projection_freshness(facts)
      decision = evaluate_prerequisites(rank_plan, portfolio, facts)
      assert_eligible(decision)

      account = lock_resource_account(rank_plan.cost)
      materialize_expiry(account, server_now)
      assert_exact_available_balance(account, rank_plan.cost)

      append_resource_spend(account, rank_plan.cost)
      append_rank_acquisition(portfolio, rank_plan, decision)
      derive_skill_unlocks(portfolio, rank_plan)
      recompute_affected_effect_scopes(portfolio, rank_plan)
      increment_portfolio_version(portfolio)
      append_audit_and_outbox()
      complete_operation()
    commit

    return authoritative_result
```

### Appendix G — Canonical Skill activation algorithm

```text
function activate_skill(command):
    authenticate_and_authorize(command.actor, command.character_id)
    operation = register_idempotent_operation(command)
    if operation.has_terminal_result:
        return operation.result

    begin transaction
      portfolio = lock_portfolio(command.character_id, realm)
      assert_expected_version_if_supplied()
      assert_portfolio_allows_activation(portfolio)

      ownership = load_valid_skill_ownership(command.skill_key)
      assert_unlocked_and_not_suppressed(ownership)
      skill = load_immutable_skill_version(ownership.skill_version_id)
      assert_skill_runtime_policy(skill)
      validate_activation_context(skill.context_schema, command.context)
      assert_required_loadout(portfolio, skill)

      charges = lock_and_materialize_charges(portfolio, skill, server_now)
      cooldown = lock_cooldown(portfolio, skill.cooldown_scope)
      assert(charges.available >= skill.activation_cost)
      assert(server_now >= cooldown.ready_at)

      consume_charges(charges, skill.activation_cost)
      update_cooldown(cooldown, server_now, skill.duration)
      activation = append_activation_receipt()
      increment_portfolio_version(portfolio)
      append_audit_and_outbox(skill.activated, cooldown.started)
      complete_operation()
    commit

    return activation
```

### Appendix H — Consumer effect application algorithm

```text
on talent.effect_set_changed(event):
    authenticate_producer(event)
    validate_schema(event)
    current = load_consumer_projection(event.character_id, event.effect_scope)

    if event.effect_revision < current.revision:
        accept_noop()
    else if event.effect_revision == current.revision:
        assert(event.effect_fingerprint == current.fingerprint)
        accept_noop()
    else:
        validate_registered_effects(event.effects)
        replace_complete_scope_projection(event)
        record_applied_revision()
```

A consumer must not append modifiers from a complete snapshot to the previous set.

### Appendix I — State ownership summary

| State | Owner |
|---|---|
| Character lifecycle and owner | Character Engine |
| Experience, Level, Prestige | Progression Engine |
| Reward Definitions and Grant saga | Reward Engine |
| Achievement progress and unlock | Achievement Engine |
| Quest Instances and completion | Quest Engine |
| Talent Definitions and rank ownership | Talent Engine |
| Skill unlock, charges, cooldown, activation | Talent Engine |
| Talent-only Resource ledger | Talent Engine |
| Item Definitions | Item Engine |
| Inventory ownership | Inventory Engine |
| Season schedule | Season Engine |
| Business authorization and action result | Business Module |
| Public Character profile | Character Engine projection consuming entitlements |

### Appendix J — Production readiness checklist

A release is not production-ready until:

- all published schemas are registered;
- content compiler is deterministic;
- Definition immutability is enforced;
- Character lifecycle projection is operational;
- inbox/outbox recovery is tested;
- Resource and charge ledger reconciliation is automated;
- Reward fulfillment contracts pass consumer-driven tests;
- effect consumers pass revision and gap recovery tests;
- secret-content leakage tests pass;
- Skill activation concurrency tests pass;
- migration and repair runbooks exist;
- dashboards and alerts exist;
- backup and restore are tested;
- privacy export and anonymization are tested;
- rate and content limits are configured;
- load and chaos tests meet approved SLO;
- all applicable acceptance tests in this RFC are automated or formally waived by architecture and product owners.

### Appendix K — Final architectural rule

A Talent is a durable statement about Character capability. The Talent Engine may publish what that capability means through bounded contracts, but it must never become an unbounded script runner or a privileged backdoor into another Engine's state.

> **Own capability once. Apply meaning through contracts. Preserve the Character's history.**
