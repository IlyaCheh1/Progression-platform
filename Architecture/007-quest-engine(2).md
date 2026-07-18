---
document: 007-quest-engine
title: Quest Engine
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
related_documents:
  - 008-talent-engine
  - 009-item-engine
  - 010-inventory-engine
  - 011-season-engine
---

# Quest Engine

> **Platform contract conformance:** all Event envelopes, lifecycle facts,
> dependency edges, Season facts, and Reward integration MUST conform to
> `002a-platform-contract-standard` and `002b-cross-engine-integration`.

## Executive Summary

The Quest Engine is the authoritative platform component for defining, offering, activating, evaluating, completing, failing, and presenting directed Character activities.

A Quest is a bounded, intentional journey composed of one or more Objectives. It gives a Character a clear next action, a reason to act, progress feedback, and a narrative resolution. A Quest is not a generic task table, a marketing campaign, a workflow automation service, an Achievement, a Reward, a calendar booking, or a business-process engine. Business Modules and platform Engines publish immutable Events describing facts that have already happened. The Quest Engine consumes registered Event contracts, maps eligible facts to active Quest Instances, updates Objective state, advances a bounded Quest graph, and records terminal outcomes.

The Engine owns:

- immutable published Quest Definition versions;
- Quest Editions and occurrence policies;
- offer, assignment, acceptance, activation, deadline, and terminal-state semantics;
- per-Character Quest Instances;
- Objective, Stage, branch, and choice state inside those Instances;
- exact evidence used to justify Objective progress and Quest completion;
- prerequisite, eligibility, exclusivity, and concurrency evaluation based on local projections;
- repeatability and deterministic occurrence identity;
- Quest read projections, history, explanations, replay, backfill, and reconciliation;
- controlled Campaign sequencing primitives where a Campaign is represented as a versioned graph of Quest references.

The Engine does not own Character identity, Experience, Levels, Prestige, Rewards, Achievements, Inventory, Items, Talents, Reputation, Seasons, payments, schedules, notifications, or business-domain truth. It never directly grants XP, Items, Currency, Titles, cosmetics, Talents, or any other benefit. When a Quest reaches a valid terminal completion, the Engine publishes `quest.completed.v1`. The Reward Engine may map that Event to one or more Reward Definitions through its own immutable Trigger Bindings. The Quest Engine never waits for Reward fulfillment in order to consider the Quest complete.

Published Quest Definitions are data, not executable code. They use a bounded typed model for Objectives, predicates, counters, distinct counts, accumulation, sequences, snapshots, time windows, dependencies, optional Objectives, Stages, mutually exclusive branches, and explicit player choices. Arbitrary scripts, SQL fragments, remote callbacks, client-side completion authority, unregistered payload paths, and unbounded cyclic graphs are prohibited.

The authoritative write path is primarily Event-driven. HTTP APIs exist for reads, user acceptance, user abandonment where allowed, explicit choices, controlled assignment, authoring, simulation, administration, and repair. Business Modules do not mutate Quest progress directly and do not call a generic “complete Quest” endpoint. A trusted source may request an offer or assignment using a typed command or Event, but completion remains evidence-based and owned by the Quest Engine.

The Engine is designed around the following invariants:

1. Only the Quest Engine may write Quest Instance, Objective, Stage, branch, choice, and Quest outcome state.
2. Every Quest Instance references exactly one immutable Quest Definition version and one immutable Quest Edition.
3. A logical source Event has at most one durable contribution to the same Quest Objective node, even under retry, replay, concurrency, or regional redelivery.
4. Published Definition versions are immutable; changes create new versions.
5. Runtime evaluation is deterministic for the same ordered facts, Definition version, occurrence context, lifecycle projection, and time basis.
6. Quest graphs are finite directed acyclic graphs in version 1. Loops and dynamically generated graph nodes are prohibited.
7. A Quest Instance has at most one terminal outcome.
8. Completion is recorded atomically with the final Objective transition and transactional outbox Events.
9. Reward fulfillment is asynchronous and cannot roll back or block Quest completion.
10. A repeatable Quest creates a new occurrence and a new Quest Instance. An existing completed Instance is never reset in place.
11. Deadlines are evaluated using explicit time-basis policy and recorded independently from Event delivery time.
12. Late Events are accepted or rejected according to immutable grace policy; wall-clock arrival alone never silently changes semantics.
13. Business-domain facts are validated by their producer. The Quest Engine validates schemas, trust, eligibility, and Quest semantics, not whether the real-world action was legitimate.
14. Character lifecycle restrictions are enforced using a fail-closed local projection of Character state.
15. Cross-Engine state is consumed through Events and local projections, never by writing foreign databases.
16. Quest completion history is not silently deleted. Exceptional corrections use explicit integrity status and audit workflows.
17. Hidden Objectives and secret branches are protected server-side and never leaked through unauthorized projections, errors, logs, or client bundles.
18. Progress values used for authoritative decisions use integers, fixed-precision decimals, exact sets, or deterministic temporal representations; floating-point arithmetic is prohibited.
19. Every state transition is explainable by the Definition fingerprint, source evidence, actor, command or Event, and aggregate version.
20. When correctness and availability conflict, the Engine prefers delayed evaluation or quarantine over duplicate progress, premature completion, privacy leakage, or inconsistent terminal state.

This RFC is normative for the Quest Engine ownership boundary, domain model, Definition lifecycle, Quest Instance lifecycle, Objective semantics, graph execution, Event contracts, persistence, APIs, authoring, administration, UX, security, privacy, performance, auditability, edge cases, and production acceptance tests.

---

## Purpose

The purpose of this document is to define a production-ready specification for the Quest Engine of Progression Platform.

It establishes:

- the authoritative ownership boundary for Quest Definitions and Character Quest Instances;
- canonical language for Quest Editions, occurrences, offers, assignments, Objectives, Stages, branches, choices, progress, deadlines, completion, failure, and integrity;
- immutable Definition versioning and release semantics;
- deterministic eligibility, activation, evaluation, and terminal-state behavior;
- a bounded data-driven Objective and Quest graph model;
- repeatability, recurrence, concurrency, exclusivity, and occurrence identity;
- live Event evaluation, late Events, corrections, replay, migration, backfill, and reconciliation;
- consumed and produced Event contracts;
- read models and write models;
- a reference PostgreSQL schema;
- owner, public, internal, and administrative APIs;
- content authoring, simulation, review, publication, support, and incident workflows;
- security, privacy, performance, observability, and audit requirements;
- deterministic handling of duplicate, out-of-order, corrected, missing, delayed, and malicious inputs;
- acceptance tests sufficient for implementation and production release.

The specification is domain-agnostic. Terms such as lesson, workout, purchase, course, tournament, contribution, session, or match may appear only in examples. The Engine core MUST operate on canonical Event envelopes, registered schemas, versioned Quest Definitions, typed Objective plans, opaque source references, and local eligibility projections.

### Normative language

The key words **MUST**, **MUST NOT**, **REQUIRED**, **SHALL**, **SHALL NOT**, **SHOULD**, **SHOULD NOT**, **RECOMMENDED**, **MAY**, and **OPTIONAL** are normative requirement levels.

An implementation that allows a Module, administrator, client, Reward Engine, Achievement Engine, or analytics job to directly mutate Quest Instance rows violates this RFC unless an approved ADR explicitly replaces the ownership model.

### Design posture

The first production Module is a historical fencing school, but the Quest Engine MUST work unchanged for fitness, education, gaming communities, marketplaces, creator ecosystems, corporate learning, and future domains.

Version 1 SHOULD use:

- a relational authoritative store;
- transactional inbox and outbox patterns;
- immutable published configuration;
- a compiled bounded evaluation plan;
- exact per-Character Quest Instance state;
- asynchronous Event consumption with at-least-once delivery;
- exactly-once logical effect through idempotency constraints;
- explicit deadline scheduler and reconciliation workers;
- separate owner, public, directory, support, and administration projections;
- resumable migration, backfill, and repair jobs.

A general workflow engine, BPMN runtime, arbitrary scripting environment, globally shared event processor, synchronous distributed transaction, or real-time game simulation is not required.

---

## Goals

### G-1. Authoritative Quest ownership

Provide one authoritative writer for Quest Definitions, Quest Editions, per-Character Quest Instances, Objective progress, graph state, and terminal outcomes.

### G-2. Directed meaningful activity

Turn platform Events into clear, intentional, narratively coherent activities that tell a Character what to do next and why it matters.

### G-3. Domain independence

Support multiple business domains through Event contracts and data configuration without domain-specific Engine code.

### G-4. Data-driven authoring

Represent eligibility, Objectives, Stages, dependencies, branches, choices, time limits, visibility, repeatability, and presentation as versioned data.

### G-5. Deterministic evaluation

Produce the same Quest state for the same immutable Definition version, ordered evidence, occurrence context, lifecycle state, and time policy.

### G-6. Event-driven integration

Consume immutable facts and publish typed Quest lifecycle Events without direct writes to other Engines.

### G-7. Exact idempotent progress

Guarantee at most one durable contribution from a logical source Event to a specific Quest Objective node.

### G-8. Safe Quest evolution

Support draft, validation, review, publication, activation, pause, retirement, new versions, and explicit migration without rewriting history.

### G-9. Multiple participation modes

Support auto-assigned, offered, opt-in, explicitly assigned, immediately active, scheduled, and prerequisite-gated Quests.

### G-10. Bounded graph semantics

Support linear, staged, optional, branching, and choice-driven Quests through a finite directed acyclic graph.

### G-11. Repeatability without reset ambiguity

Represent each daily, weekly, seasonal, event-based, or custom recurrence as a deterministic occurrence and a new Quest Instance.

### G-12. Time-safe behavior

Provide explicit start, deadline, grace, pause, late-arrival, expiry, and scheduling semantics that remain deterministic across retries and regions.

### G-13. Reward decoupling

Publish completion facts for Reward Engine while never owning Reward fulfillment or waiting for it.

### G-14. Achievement distinction

Preserve the semantic difference between directed temporary activity and permanent recognition, while allowing either Engine to consume the other’s published facts under acyclic rules.

### G-15. Explainable progress

Retain exact evidence and evaluation decisions sufficient to explain why an Objective progressed, why a branch opened, and why a Quest completed or failed.

### G-16. Privacy-aware presentation

Support public, owner-only, hidden, secret, and redacted Quest content without leaking criteria or sensitive source evidence.

### G-17. Operational resilience

Provide retries, backpressure, quarantine, replay, scheduler recovery, reconciliation, projection rebuild, and emergency controls.

### G-18. Horizontal scalability

Scale by Character, Quest Edition, and Event partition while preserving aggregate consistency and bounding hot-key contention.

### G-19. Full auditability

Make every Definition change, offer, acceptance, assignment, progress mutation, choice, completion, failure, correction, and administrative action traceable.

### G-20. Safe failure behavior

Prefer delay, quarantine, or explicit degraded state over duplicate progress, incorrect completion, hidden-content leakage, or irreversible history corruption.

---

## Non Goals

### NG-1. Business truth validation

The Engine does not determine whether a lesson occurred, a purchase settled, a workout was genuine, or a contribution was valid. Source systems own fact validity and fraud prevention.

### NG-2. Reward fulfillment

The Engine does not grant Experience, Items, Currency, Reputation, Titles, cosmetics, Talents, or entitlements.

### NG-3. Achievement ownership

The Engine does not own permanent milestone recognition. Quest completion may be evidence for an Achievement, but the Achievement Engine owns the unlock decision.

### NG-4. Character lifecycle ownership

The Engine consumes Character lifecycle facts but does not create, suspend, close, restore, or anonymize Characters.

### NG-5. Calendar and booking management

The Engine does not schedule lessons, reserve resources, manage attendance rosters, or replace a calendar system.

### NG-6. Generic workflow automation

The Engine is not an enterprise workflow orchestrator, approval engine, BPMN runtime, or arbitrary human-task system.

### NG-7. Notification delivery

The Engine publishes lifecycle Events and read projections. A Notification Engine or product client owns delivery and messaging channels.

### NG-8. Season ownership

The Engine may reference a Season and consume Season lifecycle Events, but the Season Engine owns Season schedules and state.

### NG-9. Inventory, Item, Talent, or Reputation ownership

Eligibility may depend on locally projected facts from those Engines, but Quest Engine does not mutate their state.

### NG-10. General-purpose rule engine

The Objective language is bounded to Quest semantics. It is not a platform-wide arbitrary rules runtime.

### NG-11. Client-authoritative progress

Clients cannot report “Objective completed” as authoritative truth. They may send user commands such as accept, abandon, or choose when permitted.

### NG-12. Unbounded cyclic content

Quest graphs with loops, recursion, dynamic code-generated nodes, or indefinite runtime expansion are unsupported in version 1.

### NG-13. Shared multi-Character aggregate

Cooperative guild, team, household, or raid Quests are not authoritative v1 semantics. Each Quest Instance belongs to exactly one Character.

### NG-14. Cross-Character transfers

Quest progress, completion, choices, or Instances cannot be transferred between Characters.

### NG-15. Real-time combat simulation

The Engine is not intended for frame-level or tick-level game simulation.

### NG-16. Analytics warehouse ownership

The Engine retains operational evidence and projections, not an unlimited analytical copy of all source Events.

### NG-17. Silent historical reinterpretation

Publishing a new Definition version never automatically changes existing Quest Instances or completed history.

### NG-18. Arbitrary manual completion

Support staff cannot freely mark Quests complete. Exceptional integrity tools require evidence, approval, reason, and audit.

### NG-19. Distributed atomicity

Quest completion and Reward fulfillment are not one distributed transaction. Consistency is achieved through durable Events and idempotency.

### NG-20. Marketing campaign management

Segmentation, messaging, attribution, ad delivery, and CRM campaign automation are outside scope even when a Quest is used in a promotion.

---

## Responsibilities

### R-1. Quest Definition management

Store, validate, version, review, publish, schedule, activate, pause, and retire immutable Quest Definition versions.

### R-2. Quest Edition management

Bind a Definition version to a release identity, availability policy, recurrence policy, realm, locale bundle, Season reference, and operational lifecycle.

### R-3. Objective plan compilation

Compile typed Objective and graph configuration into a canonical evaluation plan and immutable fingerprint.

### R-4. Eligibility evaluation

Evaluate Character eligibility from explicit policies and local projections without synchronous foreign-database writes.

### R-5. Offer and assignment lifecycle

Create idempotent offers or assignments from trusted Events, schedules, administrative jobs, or user-discovery policy.

### R-6. Acceptance and activation

Process opt-in acceptance, auto-start, scheduled activation, prerequisite release, and activation refusal deterministically.

### R-7. Quest Instance Aggregate management

Create and mutate the authoritative per-Character Quest Instance with optimistic concurrency and exactly one terminal outcome.

### R-8. Objective evaluation

Map registered source Events to candidate active Objective nodes, evaluate predicates, apply exact progress, and record evidence.

### R-9. Stage and graph advancement

Unlock and activate subsequent nodes according to finite graph dependencies, completion policy, and branch decisions.

### R-10. Player choice management

Validate allowed choices, ensure one-time idempotent selection, activate selected branches, and permanently close excluded branches.

### R-11. Deadline and expiry processing

Schedule and reconcile start times, deadlines, grace windows, expiry, failure, and cancellation with explicit time-basis semantics.

### R-12. Repeatability and occurrence identity

Create deterministic recurrence occurrences and prevent duplicate Instances for the same Character, Edition, and occurrence.

### R-13. Quest completion and failure decisions

Record completion, failure, expiry, abandonment, cancellation, or invalidation according to immutable policies.

### R-14. Evidence and history

Retain exact contribution records, state transitions, graph decisions, and terminal evidence required for explanation and audit.

### R-15. Event publication

Publish typed Quest lifecycle, progress, choice, completion, failure, and integrity Events through a transactional outbox.

### R-16. Projection generation

Maintain owner, public, directory, internal, support, and administrative read models.

### R-17. Correction handling

Apply source corrections before terminal completion and route post-completion contradictions to integrity workflows.

### R-18. Migration and backfill

Support explicit migration of eligible active Instances and controlled historical assignment or evaluation jobs.

### R-19. Reconciliation and repair

Detect and repair drift among aggregate rows, Objective state, evidence, scheduler records, projections, and outbox publication.

### R-20. Explainability

Provide machine-readable and human-readable explanations for eligibility, progress, branch decisions, terminal outcomes, and suppressed Events.

### R-21. Authoring and simulation

Provide validation, preview, simulation, Event trace, graph visualization data, cardinality estimates, and publication gates.

### R-22. Operational controls

Provide safe pause, resume, quarantine, rate limiting, scheduler drain, replay, projection rebuild, and regional failover controls.

---

## Dependencies

### Character Engine

The Quest Engine depends on Character Engine Events and a local Character Eligibility Projection.

Required facts include:

- `character.created.v1`;
- `character.activated.v1` or equivalent active lifecycle fact;
- `character.suspended.v1`;
- `character.restored.v1`;
- `character.closed.v1`;
- `character.anonymized.v1`;
- realm or tenant association when platform policy requires it;
- privacy or minor-safety flags when relevant to content eligibility.

The Quest Engine MUST fail closed for writes when Character state is missing, stale beyond the configured safety threshold, suspended, closed, or anonymized. Suspension policy may either freeze deadlines or allow them to continue, but that policy MUST be explicit per Edition and MUST NOT be inferred by clients.

### Reward Engine

The Quest Engine publishes `quest.completed.v1`, `quest.failed.v1`, and related lifecycle Events. Reward Engine may consume those Events through immutable Trigger Bindings.

Quest Engine MUST NOT:

- call Reward Engine synchronously inside the completion transaction;
- write Reward tables;
- mark Reward state on the authoritative Quest Aggregate;
- reopen a Quest because Reward fulfillment failed;
- expose “reward delivered” as Quest completion truth.

A read projection MAY decorate a completed Quest with Reward summary obtained asynchronously, but that decoration is non-authoritative.

### Achievement Engine

Achievement Engine may consume Quest lifecycle Events as milestone evidence. Quest eligibility MAY reference locally projected Achievement unlock facts when a Definition explicitly declares them as prerequisites.

Causal graphs across Quest and Achievement Definitions MUST be statically analyzed. A cycle such as “complete Quest A to unlock Achievement B; Achievement B starts Quest A” MUST be rejected unless an approved bounded-bootstrap ADR defines deterministic seed behavior.

### Progression Engine

Quest eligibility and presentation MAY reference locally projected Progression facts such as Track, Level, or Prestige. Progression facts are snapshots for gating; Quest Engine does not own them and does not infer XP operations.

A Quest Definition MUST declare whether eligibility is evaluated:

- only at offer creation;
- again at acceptance;
- continuously while active;
- only at explicit stage gates.

Loss of a prerequisite after activation MUST follow explicit policy: `IGNORE_AFTER_START`, `PAUSE`, or `FAIL`. The default is `IGNORE_AFTER_START`.

### Inventory, Item, Talent, Reputation, Currency, and Entitlement Engines

The Engine MAY maintain local projections of typed ownership or status facts for eligibility and Objectives. It never writes those domains.

Objectives that require consumption of an Item or Currency are unsupported unless the owning Engine provides an explicit idempotent reservation or consumption protocol. A simple snapshot predicate such as “owns item X” MUST NOT be misrepresented as destructive consumption.

### Season Engine

Quest Editions MAY reference a Season. Season Engine owns Season lifecycle and schedule. Quest Engine consumes Season activation, pause, close, and correction Events.

Season closure behavior MUST be explicit per Edition:

- `EXPIRE_ACTIVE`;
- `FAIL_ACTIVE`;
- `ALLOW_GRACE`;
- `DETACH_AND_CONTINUE`.

### Event infrastructure

Required capabilities:

- at-least-once delivery;
- stable Event identifiers;
- partition keys;
- schema identifiers and versions;
- producer identity;
- occurred-at and recorded-at timestamps;
- correlation and causation identifiers;
- dead-letter or quarantine routing;
- replay by bounded range;
- retention sufficient for configured lookback and recovery.

The Quest Engine provides exactly-once logical effect through its inbox and uniqueness constraints. It MUST NOT assume exactly-once transport.

### Schema Registry

Every consumed and produced Event type MUST have a registered schema, compatibility policy, ownership metadata, privacy classification, and retention classification.

Unregistered Event types or payload paths MUST NOT appear in published Quest Definitions.

### Configuration Registry or LiveOps Engine

A platform configuration service MAY distribute approved Definition manifests, activation windows, feature flags, emergency pauses, and realm-specific release state.

The Quest Engine remains authoritative for its compiled Definition fingerprint and active Edition routing. Runtime configuration distribution cannot mutate an already published Definition version.

### Identity and Access Management

Required for owner commands, authoring, approval, administration, support, privacy, security, and repair operations.

Authorization MUST be evaluated using server-side identity and scope. Character identifiers supplied by clients are never sufficient proof of ownership.

### Time service

The Engine requires a monotonic process clock and a trusted UTC wall clock. All persisted instants MUST be UTC. Calendar recurrence additionally requires an immutable IANA time-zone identifier and tzdb version policy.

### Search and projection infrastructure

Optional for discovery and rich read experiences. Search indexes are non-authoritative and MUST enforce visibility and secret-content suppression.

### Audit and observability infrastructure

Required for append-only audit export, metrics, traces, structured logs, alerting, and incident response.

### Database

A transactional relational database is RECOMMENDED for authoritative state in version 1. PostgreSQL is the reference implementation.

### Forbidden dependencies

The Quest Engine MUST NOT depend on:

- a School Module database;
- a Fitness Module database;
- CRM tables;
- client-side state as authority;
- Reward Engine tables;
- Achievement Engine tables;
- mutable analytics aggregates for authoritative completion;
- arbitrary external HTTP callbacks during aggregate transactions;
- unversioned configuration files deployed with application code.

---

## Architecture Overview

### Context

```text
Business Module / Platform Engine
              │
              │ immutable source Event
              ▼
        Event Infrastructure
              │
              ▼
       Quest Event Ingress
              │
      ┌───────┴─────────┐
      │                 │
      ▼                 ▼
Candidate Router   Character Lifecycle Projection
      │                 │
      └───────┬─────────┘
              ▼
      Quest Evaluation Service
              │
      ┌───────┼────────────────────────────┐
      ▼       ▼                            ▼
Instance Repo Objective/Evidence Repo  Deadline Scheduler
      │       │                            │
      └───────┴──────────────┬─────────────┘
                             ▼
                    Transactional Outbox
                             │
                             ▼
                      Event Infrastructure
                  ┌──────────┼───────────────┐
                  ▼          ▼               ▼
             Reward Engine Achievement   Projections /
                           Engine         Notifications
```

### Ownership boundary

The Quest Engine is the sole writer of:

- Quest Definition versions;
- Quest Editions;
- trigger and eligibility bindings owned by Quest semantics;
- Character Quest offers;
- Character Quest Instances;
- Objective and Stage state;
- branch and choice state;
- Quest evidence and transition history;
- Quest deadline and scheduler state;
- Quest integrity cases;
- Quest inbox, outbox, and reconciliation state.

It is not the sole source of every fact used in Quest evaluation. Source Events remain owned by their producers, and projected prerequisites remain owned by their respective Engines.

### Internal components

#### 1. Definition Registry

Stores drafts, immutable published versions, Edition manifests, compiled plans, fingerprints, validation reports, and release metadata.

#### 2. Definition Compiler

Validates schemas, payload paths, numeric types, graph acyclicity, branch closure, recurrence bounds, visibility policy, prerequisite dependencies, and complexity budgets. It emits a canonical compiled plan.

#### 3. Edition Router

Resolves which active Edition and occurrence apply to a Character, realm, Event time, schedule, and release cohort.

#### 4. Offer and Assignment Service

Creates idempotent offers or assignments from bindings, schedules, user discovery, administrative jobs, or trusted requests.

#### 5. Character Eligibility Projection

Maintains fail-closed local projections of Character lifecycle and declared cross-Engine prerequisites.

#### 6. Event Ingress and Inbox

Validates envelope, schema, producer trust, payload hash, partition ownership, and duplicate identity before registering the Event.

#### 7. Candidate Router

Maps Event type and indexed predicates to active Objective candidates without scanning every Quest Definition or Character Instance.

#### 8. Quest Evaluation Service

Loads the Quest Instance Aggregate, evaluates the compiled Objective plan, applies exact contributions, advances graph state, resolves terminal status, and writes evidence.

#### 9. Aggregate Repository

Provides optimistic concurrency, row locking where required, immutable history append, and atomic commit boundaries.

#### 10. Deadline Scheduler

Creates durable timers for activation, deadline, grace, expiry, failure, recurrence, and offer expiration. Timer delivery is at least once; logical effects are idempotent.

#### 11. Choice Service

Validates authenticated player choices and applies deterministic branch activation in the same aggregate transaction.

#### 12. Transactional Outbox

Stores outgoing Events in the same database transaction as authoritative state.

#### 13. Outbox Publisher

Publishes Events with retry, ordering metadata, and duplicate-safe semantics.

#### 14. Projection Workers

Build owner, public, directory, support, analytics, and administrative read models from authoritative changes.

#### 15. Backfill and Migration Workers

Execute resumable bounded jobs under workload budgets and immutable job manifests.

#### 16. Reconciliation Service

Verifies aggregate consistency, Objective totals, graph reachability, timer presence, terminal uniqueness, outbox completeness, and projection freshness.

#### 17. Administration Service

Provides controlled authoring, simulation, release, pause, replay, repair, integrity, and support operations.

### Write transaction

For a normal source Event contribution, the Engine MUST perform one authoritative transaction:

1. lock or create the inbox record for `(consumer_name, event_id)`;
2. verify payload hash consistency;
3. resolve the active Definition plan and candidate Quest Instance;
4. load the Aggregate at expected version;
5. verify Character and Quest lifecycle eligibility;
6. evaluate matching Objective nodes;
7. insert idempotent evidence contributions;
8. update Objective, Stage, branch, and Quest Instance state;
9. create or update deadline records when graph state changes;
10. append immutable transition records;
11. enqueue outgoing Events in the outbox;
12. mark the inbox item processed;
13. commit atomically.

Projection updates and Event publication occur asynchronously after commit.

### Delivery semantics

Transport is at least once. The Engine provides exactly-once logical effect through:

- unique inbox identity per Event;
- immutable payload hash verification;
- unique evidence key per logical contribution;
- aggregate version checks;
- unique Quest Instance occurrence identity;
- unique terminal outcome constraint;
- idempotent timer keys;
- transactional outbox identifiers.

Receiving the same `event_id` with a different payload hash is a security and integrity incident, not a normal retry.

### Ordering model

Absolute global ordering is not required. Ordering is established by:

- Character partition where available;
- `occurred_at` for fact semantics;
- source sequence when a producer contract provides one;
- deterministic tie-break by Event identifier;
- aggregate version for committed state transitions.

Definitions that require sequence order MUST declare the ordering field and producer guarantee. Without a trustworthy ordering guarantee, a sequence Objective MUST use a bounded reorder buffer and explicit late policy or be rejected at publication.

### Consistency model

Authoritative Quest state is strongly consistent inside one Quest Instance transaction. Cross-Engine facts and read projections are eventually consistent.

User-facing APIs MUST return projection freshness metadata where stale state could affect decisions. User commands that mutate a Quest Instance MUST read authoritative state or a transactionally safe command model, not rely solely on search indexes.

### Failure isolation

Failures MUST be isolated by Event, Definition, Edition, Character partition, timer, or job where possible. One malformed Definition or poison Event MUST NOT halt unrelated Quest evaluation.

The Engine MUST support:

- per-Definition emergency pause;
- per-producer quarantine;
- per-Event retry and dead-letter state;
- per-partition backpressure;
- live-workload protection from backfill;
- scheduler drain and recovery;
- projection rebuild independent of authoritative replay.

---

## Canonical Definitions

### Quest

A **Quest** is a directed, bounded activity offered or assigned to a Character and completed by satisfying a versioned graph of Objectives under explicit lifecycle and time policies.

A Quest communicates intent. It answers:

- what the Character is invited or required to do;
- which progress matters;
- when the activity starts and ends;
- which choices or branches are available;
- what outcome was reached.

### Quest Definition

A **Quest Definition** is the stable semantic identity of a Quest across revisions. It has a globally unique `quest_definition_id` and stable `quest_key` within its namespace.

The Definition identity does not contain mutable evaluation logic. Evaluation logic belongs to immutable Quest Definition Versions.

### Quest Definition Version

A **Quest Definition Version** is an immutable published configuration containing:

- metadata and localization keys;
- participation mode;
- eligibility policy;
- Objective definitions;
- Stage and graph definitions;
- branch and choice definitions;
- completion and failure policy;
- timing and grace policy;
- recurrence policy;
- visibility and disclosure policy;
- presentation metadata;
- Event subscriptions and typed predicates;
- dependency references;
- migration and retroactivity policy;
- compiled plan and fingerprint.

A published version is never edited in place.

### Quest Edition

A **Quest Edition** is a releaseable, operational identity that binds one Quest Definition Version to a realm, audience, availability window, recurrence policy, optional Season, and release lifecycle.

The same narrative Quest may have multiple Editions for:

- different Seasons;
- annual repetitions;
- realms or tenants;
- localization or regulation variants;
- materially different balance or Objective logic;
- controlled experiments.

A Quest Edition has a stable `quest_edition_id`. It is not reused after retirement.

### Occurrence

An **Occurrence** is one deterministic availability cycle of a repeatable Quest Edition.

Examples include:

- the calendar day of 2026-07-18 in `Europe/Berlin`;
- ISO week `2026-W29`;
- a specific Season identifier;
- a tournament Event identifier;
- a one-time permanent occurrence;
- a custom window generated from a trusted schedule.

Occurrence identity MUST be deterministic and represented by `occurrence_key`. The uniqueness boundary is `(character_id, quest_edition_id, occurrence_key)` unless the Edition explicitly permits multiple numbered attempts.

### Quest Instance

A **Quest Instance** is the authoritative per-Character Aggregate representing participation in one Quest Edition occurrence.

It contains:

- lifecycle status;
- availability and timing;
- Objective state;
- Stage state;
- active graph frontier;
- branch and choice state;
- evidence frontier;
- completion or failure outcome;
- integrity status;
- aggregate version.

A Quest Instance belongs to exactly one Character.

### Offer

An **Offer** is a discoverable invitation to accept a Quest. It may expire. An Offer is not active Quest participation and MUST NOT receive ordinary Objective progress unless the Edition explicitly supports pre-acceptance accumulation.

### Assignment

An **Assignment** is a trusted instruction that a Quest Instance should be created for a Character. Depending on policy, assignment may create an `OFFERED`, `ASSIGNED`, `SCHEDULED`, or `ACTIVE` Instance.

Assignment is not permission to mark progress or completion.

### Participation Mode

The **Participation Mode** defines how a Character enters a Quest:

- `AUTO_START` — Instance becomes active automatically when assignment and eligibility are satisfied;
- `OFFER_AND_ACCEPT` — an Offer is created and the Character must accept;
- `EXPLICIT_ASSIGNMENT` — a trusted actor or system assigns the Quest;
- `DISCOVERABLE_OPT_IN` — eligible Characters may browse and accept without a prior individual Offer;
- `SCHEDULED_AUTO_START` — an eligible Instance activates at a configured time;
- `PREREQUISITE_RELEASE` — an Instance or Offer appears when declared prerequisite facts become true.

### Objective

An **Objective** is one measurable requirement inside a Quest Instance.

Every Objective has:

- stable `objective_key` within the Definition Version;
- type and typed configuration;
- activation dependencies;
- required, optional, or mutually exclusive role;
- progress visibility;
- completion threshold or predicate;
- evidence policy;
- failure policy when applicable.

### Objective Node

An **Objective Node** is the compiled runtime node corresponding to an Objective Definition in the Quest graph.

### Objective Type

Version 1 supports bounded Objective Types:

- `EVENT_COUNT`;
- `EVENT_DISTINCT_COUNT`;
- `VALUE_ACCUMULATION`;
- `VALUE_MAXIMUM`;
- `VALUE_MINIMUM`;
- `BOOLEAN_LATCH`;
- `SNAPSHOT_PREDICATE`;
- `SEQUENCE`;
- `CALENDAR_STREAK`;
- `QUEST_DEPENDENCY`;
- `ACHIEVEMENT_DEPENDENCY`;
- `COMPOSITE`.

Each type has a registered schema and deterministic merge behavior.

### Stage

A **Stage** is a named group of Objective and decision nodes that becomes active as one narrative step.

Stages are presentation and graph units. A Stage may complete when:

- all required Objectives complete;
- at least `N` of `M` Objectives complete;
- a declared composite completion expression becomes true;
- one terminal branch node completes.

### Quest Graph

A **Quest Graph** is a finite directed acyclic graph of Stages, Objectives, gates, choices, and terminal nodes.

Every published graph MUST have:

- one entry node or an explicitly defined entry set;
- at least one reachable terminal node;
- no cycles;
- no unreachable required nodes;
- deterministic branch closure;
- bounded maximum node count and cascade depth.

### Graph Frontier

The **Graph Frontier** is the set of currently active nodes eligible to receive progress or commands.

### Gate

A **Gate** is a non-progress graph node that opens when a typed predicate over local Quest state or projected prerequisite facts becomes true.

### Branch

A **Branch** is a mutually exclusive or conditional path through the Quest graph.

Branches may be selected by:

- explicit authenticated Character choice;
- deterministic data-driven predicate;
- first-completed path;
- external trusted decision Event with registered semantics.

### Choice

A **Choice** is an immutable Character decision among allowed branch options. Once committed, the choice cannot be changed unless the Definition explicitly defines a pre-progress cancellation window and no irreversible branch effect has occurred.

Version 1 default is irreversible choice.

### Required Objective

A **Required Objective** must be satisfied for its enclosing Stage or Quest completion policy.

### Optional Objective

An **Optional Objective** may provide narrative, scoring, or downstream Event output but is not required for Quest completion unless the completion policy references it.

Optional Objective completion MUST NOT directly grant Rewards. It may publish an Objective Event that Reward Engine maps under explicit configuration.

### Hidden Objective

A **Hidden Objective** is evaluated authoritatively but its criteria, progress, or existence is redacted according to disclosure policy.

### Bonus Objective

A **Bonus Objective** is an optional Objective explicitly presented as additional activity. It may complete before or after the main Quest terminal state only if the Edition declares a post-completion bonus window. The default is to close all incomplete Objective nodes on Quest completion.

### Evidence

**Evidence** is the minimal authoritative record demonstrating why an Objective received or lost progress.

Evidence includes source Event identity, schema version, contribution, relevant extracted values, Definition fingerprint, and processing metadata. Sensitive source payloads MUST NOT be copied wholesale.

### Contribution

A **Contribution** is the deterministic change derived from one source fact for one Objective node.

Examples:

- increment counter by one;
- add fixed decimal quantity;
- insert exact distinct key;
- update maximum;
- mark boolean true;
- advance a sequence position;
- mark a calendar period complete.

### Progress

**Progress** is the current authoritative Objective state derived from accepted Contributions and corrections.

Progress is not necessarily a scalar. It may be a count, exact set cardinality, accumulated fixed decimal, sequence cursor, streak state, boolean, extrema, or composite result.

### Completion

**Completion** is the terminal success outcome of a Quest Instance after all Definition completion conditions are satisfied and no higher-priority failure condition applies in the same deterministic evaluation step.

### Failure

**Failure** is a terminal unsuccessful outcome caused by an explicit failure predicate, exhausted attempt policy, missed hard deadline, failed branch, or trusted cancellation policy.

### Expiry

**Expiry** is a terminal outcome indicating the Quest was not completed within its availability or deadline policy. An Edition may map expiry to failure presentation, but the canonical state remains distinct.

### Abandonment

**Abandonment** is a terminal Character-initiated exit from an active or offered Quest when Definition policy permits it.

### Cancellation

**Cancellation** is a terminal system or administrative outcome caused by Edition withdrawal, source invalidation, safety policy, or operational action. Cancellation is not treated as Character failure unless explicitly configured for presentation, and it SHOULD NOT trigger failure penalties.

### Integrity Status

**Integrity Status** is orthogonal to lifecycle outcome and records whether the historical outcome is trusted:

- `VALID`;
- `CONTESTED`;
- `INVALIDATED`;
- `RESTORED`.

A completed Quest may remain historically `COMPLETED` while its integrity status becomes `INVALIDATED`. This preserves audit history and prevents silent deletion.

### Eligibility

**Eligibility** is the deterministic decision that a Character may be offered, assigned, accept, or continue a Quest under declared policy.

Eligibility is not a general audience-segmentation language. It uses bounded predicates over registered local projections and immutable occurrence context.

### Prerequisite

A **Prerequisite** is a typed fact that must exist before a Quest, Stage, or node becomes available.

### Exclusivity Group

An **Exclusivity Group** identifies Quest Editions or Instances that cannot be active simultaneously for the same Character under declared policy.

### Concurrency Limit

A **Concurrency Limit** bounds the number of active Quest Instances per Character, namespace, category, Edition, or exclusivity group.

### Recurrence Policy

A **Recurrence Policy** defines how Occurrences are generated. Supported policies include:

- `ONCE`;
- `DAILY_CALENDAR`;
- `WEEKLY_CALENDAR`;
- `MONTHLY_CALENDAR`;
- `SEASON`;
- `EVENT_KEYED`;
- `FIXED_INTERVAL` with explicit anchor;
- `CUSTOM_SCHEDULE` from a trusted versioned schedule.

Calendar policies MUST declare time zone and daylight-saving behavior.

### Time Basis

**Time Basis** defines which timestamp determines semantic eligibility:

- source `occurred_at`;
- trusted source sequence time;
- server `recorded_at`;
- explicit business-effective time from a registered field.

The default for action Objectives is trusted source `occurred_at`.

### Deadline

A **Deadline** is the semantic instant after which ordinary progress is no longer accepted, subject to late-arrival grace and correction policy.

### Late-Arrival Grace

**Late-Arrival Grace** is a bounded period after a Deadline during which Events that occurred before the Deadline may still be processed.

Grace extends delivery acceptance, not the action window.

### Definition Fingerprint

A **Definition Fingerprint** is a cryptographic digest of the canonical compiled Quest plan, schema references, graph, policies, and presentation contract relevant to behavior.

### Campaign

A **Campaign** is a versioned long-form narrative composed of Quest Edition references and dependency edges.

In version 1, Quest Engine MAY own a minimal Campaign graph needed to release Quests in sequence. Marketing segmentation, messaging, and CRM campaign behavior remain out of scope.

### Realm

A **Realm** is a platform partition for configuration, release, policy, or tenancy. Realm boundaries MUST be enforced in every Definition, Instance, Event, API, and query path.

---

## Lifecycle

### Quest Definition lifecycle

Quest Definition Versions move through:

```text
DRAFT
  │ validate
  ▼
VALIDATED
  │ submit
  ▼
IN_REVIEW
  │ approve
  ▼
APPROVED
  │ publish
  ▼
PUBLISHED
  │ schedule/activate through Edition
  ▼
RETIRED
```

Additional exceptional states:

- `REJECTED` — review failed; author may create a new draft revision;
- `WITHDRAWN` — approved but not published version withdrawn before use;
- `QUARANTINED` — published version disabled because of security or integrity incident.

#### Draft

Drafts are mutable working copies and have no runtime authority. Draft identifiers MUST NOT be referenced by Quest Instances.

#### Validated

Validation includes:

- schema existence and compatibility;
- registered producer ownership;
- payload path types;
- graph acyclicity and reachability;
- Objective type constraints;
- time and recurrence consistency;
- prerequisite dependency graph analysis;
- privacy classification;
- hidden-content leakage checks;
- complexity budgets;
- deterministic occurrence identity;
- localization completeness policy;
- migration and retroactivity declarations.

#### In Review

Review MUST include at least product/content review and technical validation. High-risk Quests additionally require security, privacy, economy, or legal approval according to policy.

#### Approved

An approved version is content-frozen but not yet runtime-active.

#### Published

Publishing creates an immutable canonical representation, compiled plan, fingerprint, schema reference set, and audit record. Published does not necessarily mean available to Characters; availability is controlled by Editions.

#### Retired

Retirement prevents new Editions or new Occurrences unless explicitly allowed. Existing Instances continue under their Edition policy.

### Quest Edition lifecycle

Quest Editions move through:

```text
DRAFT → VALIDATED → SCHEDULED → ACTIVE → PAUSED → ACTIVE
                                   │          │
                                   └──────────┴──→ CLOSED → RETIRED
```

Exceptional state: `QUARANTINED`.

#### Scheduled

The Edition has a future activation instant and validated audience/realm configuration.

#### Active

The Edition may create Offers, Assignments, Occurrences, and Instances.

#### Paused

Pause stops new Offers and assignments and optionally freezes active Instance timers according to the immutable pause policy.

Pause MUST NOT silently discard incoming Events. Events are either buffered, processed for already active Instances, or quarantined according to explicit policy.

#### Closed

No new Instances are created. Existing Instances follow close policy: continue, grace, expire, fail, or cancel.

#### Retired

Operational history remains queryable, but the Edition cannot be reactivated. A new Edition is required.

### Offer lifecycle

```text
CREATED → AVAILABLE → ACCEPTED
                 ├──→ EXPIRED
                 ├──→ DECLINED
                 ├──→ WITHDRAWN
                 └──→ INELIGIBLE
```

An Offer is uniquely identified for `(character_id, quest_edition_id, occurrence_key, offer_channel)` unless policy explicitly permits multiple channels that converge on one Instance.

Accepting an Offer atomically creates or activates the corresponding Quest Instance and consumes the Offer. Concurrent accepts MUST return the same resulting Instance.

### Quest Instance lifecycle

Canonical lifecycle states:

- `PENDING`;
- `OFFERED`;
- `ASSIGNED`;
- `SCHEDULED`;
- `ACTIVE`;
- `PAUSED`;
- `COMPLETED`;
- `FAILED`;
- `EXPIRED`;
- `ABANDONED`;
- `CANCELLED`.

`COMPLETED`, `FAILED`, `EXPIRED`, `ABANDONED`, and `CANCELLED` are terminal lifecycle states.

#### Pending

The Instance identity exists, but activation awaits prerequisite projection, future schedule, capacity, or an asynchronous validation.

#### Offered

The Character may accept. Ordinary progress is ignored unless `pre_acceptance_progress_policy` is configured.

#### Assigned

A trusted system or actor assigned the Quest, but activation may await time or acknowledgement.

#### Scheduled

The Quest has an activation instant in the future.

#### Active

Active Objective nodes may receive Contributions. Character commands such as choice or abandonment are accepted according to policy.

#### Paused

Progress handling depends on pause policy:

- `BUFFER_ELIGIBLE_EVENTS`;
- `IGNORE_EVENTS`;
- `PROCESS_BUT_HIDE`;
- `REJECT_AND_AUDIT`.

Deadlines either continue or freeze according to explicit timer policy. Freeze MUST persist the remaining duration, not recalculate from mutable configuration.

#### Completed

All required completion semantics have been satisfied. The completion record is immutable.

#### Failed

An explicit failure condition occurred. Failure reason is mandatory.

#### Expired

The hard action window ended without completion. Expiry reason and deadline basis are mandatory.

#### Abandoned

The Character voluntarily exited. Abandonment may create a cooldown or block re-entry for the same Occurrence.

#### Cancelled

The platform terminated the Instance for a non-Character-failure reason.

### Allowed transitions

| From | To | Condition |
|---|---|---|
| `PENDING` | `OFFERED` | eligibility and availability become true |
| `PENDING` | `ASSIGNED` | trusted assignment accepted |
| `PENDING` | `SCHEDULED` | future start resolved |
| `PENDING` | `ACTIVE` | auto-start conditions satisfied |
| `PENDING` | `CANCELLED` | policy, Edition closure, or invalid configuration |
| `OFFERED` | `ACTIVE` | authenticated idempotent acceptance |
| `OFFERED` | `EXPIRED` | offer expiry reached |
| `OFFERED` | `CANCELLED` | Offer withdrawn or Edition cancelled |
| `ASSIGNED` | `SCHEDULED` | future start applies |
| `ASSIGNED` | `ACTIVE` | activation conditions satisfied |
| `ASSIGNED` | `CANCELLED` | assignment withdrawn by trusted policy |
| `SCHEDULED` | `ACTIVE` | activation timer fires and eligibility policy passes |
| `SCHEDULED` | `CANCELLED` | Edition or Character policy prevents activation |
| `ACTIVE` | `PAUSED` | explicit policy action or lifecycle restriction |
| `PAUSED` | `ACTIVE` | resume policy passes |
| `ACTIVE` | `COMPLETED` | completion plan resolves true |
| `ACTIVE` | `FAILED` | failure predicate wins |
| `ACTIVE` | `EXPIRED` | deadline and grace reconciliation close progress |
| `ACTIVE` | `ABANDONED` | owner command allowed |
| `ACTIVE` | `CANCELLED` | platform cancellation |
| `PAUSED` | terminal | explicit close policy |

Any unspecified transition MUST be rejected.

### Transition priority

When multiple terminal conditions become true in one deterministic evaluation step, priority is:

1. integrity or security cancellation explicitly marked highest priority;
2. explicit failure predicate whose Event occurred before completion evidence;
3. valid completion;
4. hard deadline expiry;
5. administrative cancellation;
6. abandonment command.

Definitions MAY override failure-versus-completion ordering only with a validated policy and deterministic timestamp basis. They cannot override security cancellation.

### Objective lifecycle

Objective state is:

- `LOCKED`;
- `AVAILABLE`;
- `ACTIVE`;
- `COMPLETED`;
- `FAILED`;
- `SKIPPED`;
- `CLOSED`.

`LOCKED` nodes are unreachable from the current frontier. `AVAILABLE` nodes may await explicit choice or start command. `ACTIVE` nodes receive Events. `SKIPPED` indicates a non-selected optional or branch node. `CLOSED` indicates an incomplete node made irrelevant by Quest terminal state.

An Objective completed state is immutable within normal processing. Source correction before Quest terminal state MAY reopen an Objective only when its type is reversible and the Definition explicitly permits reversible progress. After Quest completion, contradictions use integrity workflow rather than ordinary reopening.

### Stage lifecycle

Stage state is:

- `LOCKED`;
- `ACTIVE`;
- `COMPLETED`;
- `FAILED`;
- `SKIPPED`;
- `CLOSED`.

Stage transitions are derived from contained node state and graph policy. Clients MUST NOT calculate Stage completion independently.

### Choice lifecycle

A Choice begins `AVAILABLE`, then becomes `SELECTED` or `CLOSED`. Selection records:

- choice node id;
- option id;
- actor Character and authenticated User;
- selected at;
- command id;
- aggregate version;
- Definition fingerprint;
- optional client context without trusting it as authority.

### Deadline lifecycle

Durable timer state is:

- `SCHEDULED`;
- `CLAIMED`;
- `FIRED`;
- `SUPERSEDED`;
- `CANCELLED`;
- `FAILED_RETRYABLE`;
- `QUARANTINED`.

Timer workers MUST be idempotent. Firing an old superseded deadline cannot affect the Aggregate because the timer carries expected aggregate version and timer generation.

### Integrity lifecycle

Integrity cases move through:

```text
OPEN → INVESTIGATING → CONTESTED → RESOLVED_VALID
                             └──→ RESOLVED_INVALIDATED
RESOLVED_INVALIDATED → RESTORED
```

Opening an integrity case does not automatically change lifecycle state. Policy MAY suppress public display and Reward triggers while investigation proceeds, but suppression MUST be explicit and audited.

### Character lifecycle interaction

#### Suspension

On `character.suspended.v1`, the Engine MUST prevent new offers, acceptance, choices, and ordinary progress. Existing Instances follow Edition suspension policy:

- freeze and pause;
- continue deadline but block progress;
- cancel for safety-sensitive content.

#### Restoration

On restoration, eligible paused Instances resume according to persisted timer policy. Missed timers are reconciled deterministically.

#### Closure

Character closure prevents new participation. Active Instances are cancelled or privacy-suppressed according to platform policy. Historical outcomes remain for audit and may remain owner-accessible during a reversible closure window.

#### Anonymization

Anonymization removes or pseudonymizes personal presentation and source evidence according to privacy policy. Quest Instance identifiers and aggregate history may remain under irreversible pseudonymous Character identity when legally permitted. Public projections MUST be removed.

### Edition pause and emergency behavior

Emergency pause policy MUST specify independently:

- whether new Instances stop;
- whether active progress stops;
- whether timers freeze;
- whether incoming Events buffer;
- whether user commands stop;
- whether public visibility changes;
- whether outbox publication continues.

A single vague `paused` flag is insufficient for production.

### Migration lifecycle

A migration moves explicitly selected non-terminal Instances from one Definition Version to another only when:

- an approved migration plan exists;
- source and target graph compatibility is validated;
- node mapping is complete;
- progress conversion is deterministic;
- rollback and reconciliation strategy exists;
- affected Characters and occurrence semantics are identified;
- the operation is audited and resumable.

Completed, failed, expired, abandoned, or cancelled Instances MUST NOT be migrated in place.

---

## Aggregate

### Aggregate root

`CharacterQuestInstance` is the aggregate root.

Aggregate identity is `quest_instance_id` and the uniqueness key is normally:

```text
(character_id, quest_edition_id, occurrence_key, attempt_number)
```

For ordinary Quests, `attempt_number = 1`. Multiple attempts require an explicit bounded attempt policy.

### Aggregate members

The Aggregate owns:

- Instance lifecycle state;
- occurrence and timing context;
- Definition and Edition references;
- eligibility decision snapshot;
- Objective states;
- Stage states;
- graph frontier;
- branch closures;
- Choices;
- progress summary;
- terminal outcome;
- integrity reference;
- aggregate version;
- transition sequence.

Evidence records may be physically stored separately for scale but remain logically owned by the Aggregate.

### Aggregate invariants

#### A-1. Single Character owner

A Quest Instance belongs to exactly one immutable `character_id`.

#### A-2. Immutable Definition binding

`quest_definition_version_id`, `quest_edition_id`, `definition_fingerprint`, `realm_id`, and `occurrence_key` cannot change except through an approved migration that creates an explicit migration record.

#### A-3. Unique occurrence

At most one ordinary Instance exists for the same Character, Edition, and occurrence. Concurrent creation MUST converge on the existing Instance.

#### A-4. One terminal outcome

At most one terminal lifecycle transition may be recorded. Terminal transitions are not overwritten.

#### A-5. Monotonic aggregate version

Every authoritative mutation increments `aggregate_version` by exactly one.

#### A-6. Active-node-only contribution

A Contribution may affect only an `ACTIVE` Objective unless pre-acceptance or buffered-progress policy explicitly authorizes another state.

#### A-7. Evidence uniqueness

The same logical source Event cannot contribute twice to the same Objective node and contribution slot.

#### A-8. Exact arithmetic

Counters use signed 64-bit integers within validated bounds. Quantities use fixed-precision decimal with Definition-declared scale. Floating-point state is forbidden.

#### A-9. Graph closure

When a branch is selected, mutually exclusive branches become `SKIPPED` or `CLOSED` atomically.

#### A-10. Choice immutability

A committed choice cannot be replaced in normal processing.

#### A-11. Completion consistency

A completed Quest MUST have a completion record, terminal transition, outbox Event, and graph state satisfying the compiled completion plan in the same transaction.

#### A-12. Deadline consistency

Every active hard deadline has one current timer generation. Superseded timers cannot mutate the Aggregate.

#### A-13. Definition fingerprint consistency

Every mutation verifies that the runtime compiled plan fingerprint equals the Instance fingerprint. Mismatch quarantines processing.

#### A-14. Character eligibility safety

No mutation that advances participation occurs when local Character lifecycle state is unsafe or stale beyond policy.

#### A-15. Terminal history preservation

Corrections and integrity actions append state; they do not delete terminal history.

#### A-16. Reward independence

Reward status is not an Aggregate invariant and cannot affect Quest terminal state.

#### A-17. Realm isolation

All references and source Events must belong to the same realm unless an explicit cross-realm platform Event contract is approved.

#### A-18. Bounded state

Definition publication MUST enforce maximum nodes, exact-set cardinality, evidence retention, sequence buffer, and branch depth so one Aggregate cannot grow without bound.

### Command handling

Every command includes:

- `command_id`;
- command type and schema version;
- actor identity and authorization context;
- `character_id`;
- target Quest or Instance identity;
- expected aggregate version where appropriate;
- correlation and causation identifiers;
- requested timestamp;
- idempotency key;
- reason for administrative commands.

The handler:

1. authenticates and authorizes;
2. validates schema and realm;
3. resolves idempotency record;
4. loads authoritative Aggregate;
5. checks expected version;
6. evaluates lifecycle and Definition policy;
7. applies deterministic transition;
8. writes audit and outbox;
9. returns authoritative result.

### Concurrency model

The reference implementation SHOULD use optimistic concurrency for ordinary Event updates and row-level locking for terminal transitions, choice selection, or high-contention Instances.

On conflict, the worker reloads and re-evaluates from the immutable Event. It MUST NOT blindly replay a stale state delta.

### Snapshotting

Aggregate snapshots MAY be used for performance. A snapshot MUST include:

- aggregate version;
- Definition fingerprint;
- state checksum;
- Objective and graph state;
- evidence frontier;
- timer generation;
- terminal record reference.

Snapshots are caches of authoritative history and may be rebuilt.

### Aggregate deletion

Physical deletion is prohibited during normal operations. Privacy erasure uses field-level deletion, cryptographic erasure, pseudonymization, projection removal, and retention policy. Legal purge must preserve non-personal referential tombstones sufficient to prevent identifier reuse and duplicate processing.

---

## State Model

### Quest Instance state

```json
{
  "questInstanceId": "uuid",
  "realmId": "uuid",
  "characterId": "uuid",
  "questDefinitionId": "uuid",
  "questDefinitionVersionId": "uuid",
  "questEditionId": "uuid",
  "definitionFingerprint": "sha256:...",
  "occurrenceKey": "2026-W29",
  "attemptNumber": 1,
  "participationMode": "OFFER_AND_ACCEPT",
  "status": "ACTIVE",
  "integrityStatus": "VALID",
  "offeredAt": "2026-07-18T08:00:00Z",
  "acceptedAt": "2026-07-18T08:10:00Z",
  "activatedAt": "2026-07-18T08:10:00Z",
  "actionWindowStart": "2026-07-18T08:10:00Z",
  "actionWindowEnd": "2026-07-25T08:10:00Z",
  "lateArrivalGraceEnd": "2026-07-26T08:10:00Z",
  "activeStageKeys": ["practice"],
  "activeNodeKeys": ["attend-3-sessions"],
  "aggregateVersion": 7,
  "createdAt": "2026-07-18T08:00:00Z",
  "updatedAt": "2026-07-20T18:12:00Z"
}
```

### Eligibility state

Eligibility result contains:

- `decision`: `ELIGIBLE`, `INELIGIBLE`, `PENDING_DATA`, `BLOCKED`;
- evaluated policy version;
- projection versions used;
- reason codes;
- decision time;
- expiry or re-evaluation time;
- redacted owner-facing explanation;
- full administrative explanation.

Eligibility MUST NOT expose hidden prerequisite details to unauthorized clients.

### Objective state by type

#### EVENT_COUNT

```json
{
  "objectiveKey": "attend-3-sessions",
  "type": "EVENT_COUNT",
  "status": "ACTIVE",
  "current": 2,
  "target": 3,
  "lastContributionAt": "2026-07-20T18:00:00Z"
}
```

Increment is normally one per matching Event. A typed `contribution_path` MAY provide another integer within validated bounds.

#### EVENT_DISTINCT_COUNT

Stores an exact set of normalized distinct keys or a collision-safe digest plus original-type discriminator. Approximate sketches MUST NOT determine completion.

```json
{
  "objectiveKey": "train-with-3-partners",
  "type": "EVENT_DISTINCT_COUNT",
  "status": "ACTIVE",
  "current": 2,
  "target": 3,
  "distinctKeyType": "PARTNER_CHARACTER_ID"
}
```

#### VALUE_ACCUMULATION

Uses fixed precision:

```json
{
  "objectiveKey": "practice-minutes",
  "type": "VALUE_ACCUMULATION",
  "current": "90.00",
  "target": "120.00",
  "scale": 2,
  "unit": "minute"
}
```

Unit conversion MUST occur through a registered deterministic conversion contract before contribution.

#### VALUE_MAXIMUM and VALUE_MINIMUM

Retain the qualifying source Event and exact value. Correction may recompute from retained bounded evidence or trigger reconciliation.

#### BOOLEAN_LATCH

Transitions from false to true on first qualifying Event. It is reversible only when Definition correction policy and retained evidence allow it.

#### SNAPSHOT_PREDICATE

Evaluates a versioned local projection fact. Snapshot predicates MUST declare whether they are checked at activation, continuously, at stage gate, or at terminal evaluation.

#### SEQUENCE

State includes:

- current expected step;
- completed steps;
- ordering key;
- bounded reorder buffer;
- reset policy;
- maximum attempts;
- last accepted Event reference.

Sequence reset policies:

- `IGNORE_NON_MATCH`;
- `RESET_TO_START`;
- `FALLBACK_PREFIX` for validated finite patterns;
- `FAIL_OBJECTIVE`.

#### CALENDAR_STREAK

State includes exact completed calendar periods, current run, best run where needed, time zone, period boundary policy, and last reconciled period.

A streak Definition MUST specify:

- calendar unit;
- time zone source;
- daylight-saving behavior;
- minimum qualifying Events per period;
- allowed missed periods;
- late-arrival policy;
- whether the Character time zone is snapshotted at activation.

#### QUEST_DEPENDENCY

Satisfied by a locally projected valid completion of an explicitly referenced Quest Edition, Definition key, or Campaign node. Dependency semantics MUST specify whether invalidated completions count.

#### ACHIEVEMENT_DEPENDENCY

Satisfied by a locally projected valid Achievement unlock. Secret Achievement dependency explanations MUST remain redacted.

#### COMPOSITE

Combines child nodes through bounded operators:

- `ALL`;
- `ANY`;
- `AT_LEAST_N`;
- `EXACTLY_N` only for terminal snapshot semantics;
- `NOT` only over monotonic prerequisite snapshots and never over unbounded future Events.

Composite depth and fan-out are limited at publication.

### Progress clamping

Presentation progress MAY clamp at target. Authoritative state MAY retain overage only if required for bonus tiers or explanation. Definitions MUST declare `retain_overage`.

Negative progress is prohibited unless a reversible Objective explicitly supports signed corrections. Ordinary source Events cannot decrement progress.

### Completion state

Completion record contains:

- `quest_completion_id`;
- Quest Instance identity;
- Character identity;
- Definition and Edition identity;
- occurrence key and attempt;
- completed at semantic time;
- recorded at processing time;
- completion path and terminal node;
- completed required and optional Objectives;
- evidence frontier and checksum;
- aggregate version;
- integrity status;
- correlation and causation identifiers.

### Failure state

Failure record contains:

- failure type;
- reason code;
- semantic failure time;
- recorded time;
- triggering Event or timer;
- graph path;
- incomplete required Objectives;
- whether retry in a new attempt is permitted;
- cooldown or next eligible occurrence.

### Timing state

Timing is snapshotted per Instance:

- offer start and expiry;
- scheduled activation;
- action window start and end;
- late-arrival grace end;
- pause intervals;
- total frozen duration;
- timer generation;
- recurrence occurrence boundaries;
- time zone and tzdb policy.

Changing Edition timing configuration does not mutate existing Instance timing unless an approved migration explicitly does so.

### Attempt state

Multiple attempts are optional. If enabled:

- maximum attempts is bounded;
- each attempt has a unique Instance or explicit sub-aggregate according to Edition policy;
- evidence cannot leak across attempts unless carry-over is declared;
- attempt numbering is monotonic;
- concurrent active attempts are prohibited by default;
- completion closes future attempts for the occurrence unless policy says otherwise.

Reference v1 RECOMMENDS one Quest Instance per attempt for clearer idempotency and history.

### Visibility state

Visibility dimensions are independent:

- discoverability;
- title visibility;
- description visibility;
- Objective visibility;
- progress visibility;
- completion visibility;
- source-evidence visibility;
- public-profile eligibility.

Allowed modes include:

- `PUBLIC`;
- `MEMBERS`;
- `OWNER_ONLY`;
- `HIDDEN_UNTIL_OFFERED`;
- `HIDDEN_UNTIL_ACCEPTED`;
- `HIDDEN_UNTIL_COMPLETED`;
- `SECRET`.

### Public recognition

Quest completion is not automatically public. Public projection requires:

- Character profile visibility;
- Edition completion visibility policy;
- valid integrity status;
- no privacy suppression;
- no realm policy restriction.

### Projection freshness

Every read model SHOULD include:

- `projectionVersion`;
- `sourceAggregateVersion`;
- `projectedAt`;
- optional `staleAfter`;
- privacy and integrity filter version.

### State checksums

The Engine SHOULD calculate checksums for:

- compiled Definition plan;
- Objective state set;
- graph frontier;
- evidence frontier;
- terminal outcome.

Checksums support reconciliation but do not replace relational invariants.

---

## Events

### Event principles

All Events consumed or produced by the Quest Engine MUST:

- use the canonical platform Event envelope;
- have globally unique `event_id`;
- identify schema name and version;
- identify producer and realm;
- include `occurred_at` and `recorded_at`;
- include correlation and causation identifiers where available;
- use immutable payload semantics;
- declare Character subject explicitly when Character-scoped;
- carry privacy classification metadata;
- be idempotently processable.

Event names use lowercase dot-separated semantic names with a version suffix in the schema registry, for example `quest.completed.v1`.

### Consumed Event categories

#### Character lifecycle Events

- `character.created.v1`;
- `character.activated.v1`;
- `character.suspended.v1`;
- `character.restored.v1`;
- `character.closed.v1`;
- `character.anonymized.v1`.

#### Source action Events

Any registered domain Event may be used by an Objective if:

- the producer is trusted for that fact;
- schema and payload paths are registered;
- the Quest Definition references the exact schema range;
- privacy classification permits processing;
- cardinality and fan-out budgets pass validation.

Examples only:

- `lesson.completed.v1`;
- `workout.completed.v1`;
- `course.module.completed.v1`;
- `community.contribution.accepted.v1`;
- `purchase.completed.v1`;
- `match.finished.v1`.

#### Platform prerequisite Events

- `achievement.unlocked.v1`;
- `achievement.invalidated.v1`;
- `achievement.recognition.restored.v1`;
- `progression.level.changed.v1`;
- `progression.prestige.completed.v1`;
- `progression.prestige.revoked.v1`;
- `inventory.item.acquired.v1`;
- `inventory.item.consumed.v1`;
- `inventory.item.destroyed.v1`;
- `inventory.item.expired.v1`;
- `talent.unlocked.v1`;
- `reputation.tier.changed.v1`;
- `season.edition.activated.v1`;
- `season.edition.closed.v1`;
- `season.schedule.revised.v1`.

#### Quest Events

Quest Engine may consume its own published Events for dependencies and Campaign sequencing, but processing MUST use an acyclic dependency graph and idempotent Event identity.

- `quest.completed.v1`;
- `quest.failed.v1`;
- `quest.objective.completed.v1`;
- `quest.progress.corrected.v1`;
- `quest.integrity.invalidated.v1`.

#### Assignment and orchestration Events

Trusted producers may publish:

- `quest.offer.requested.v1`;
- `quest.assignment.requested.v1`;
- `quest.cancellation.requested.v1`;
- `quest.eligibility.recheck.requested.v1`.

These are requests, not authoritative outcomes. Quest Engine validates them and publishes accepted, rejected, or resulting lifecycle Events.

#### Correction Events

Every source Event type used for reversible evaluation SHOULD define correction or invalidation semantics. Canonical patterns:

- `<source>.corrected.v1` referencing original Event id;
- `<source>.invalidated.v1` referencing original Event id;
- platform `event.fact.corrected.v1` where schema governance permits.

A correction MUST identify the original logical fact, correction sequence, reason category, and replacement or invalidation semantics.

#### Timer Events

Timer delivery may be internal but SHOULD use the same durable envelope principles:

- `quest.timer.activation.due.v1`;
- `quest.timer.offer.expiry.due.v1`;
- `quest.timer.deadline.due.v1`;
- `quest.timer.grace.end.due.v1`;
- `quest.timer.recurrence.due.v1`.

### Produced Events

#### Definition and Edition Events

- `quest.definition.published.v1`;
- `quest.definition.retired.v1`;
- `quest.edition.scheduled.v1`;
- `quest.edition.activated.v1`;
- `quest.edition.paused.v1`;
- `quest.edition.resumed.v1`;
- `quest.edition.closed.v1`;
- `quest.edition.quarantined.v1`.

#### Offer and participation Events

- `quest.offered.v1`;
- `quest.offer.expired.v1`;
- `quest.offer.declined.v1`;
- `quest.assigned.v1`;
- `quest.accepted.v1`;
- `quest.activated.v1`;
- `quest.paused.v1`;
- `quest.resumed.v1`;
- `quest.abandoned.v1`;
- `quest.cancelled.v1`.

#### Progress and graph Events

- `quest.objective.progressed.v1`;
- `quest.objective.completed.v1`;
- `quest.objective.failed.v1`;
- `quest.stage.activated.v1`;
- `quest.stage.completed.v1`;
- `quest.choice.available.v1`;
- `quest.choice.selected.v1`;
- `quest.branch.activated.v1`.

#### Terminal Events

- `quest.completed.v1`;
- `quest.failed.v1`;
- `quest.expired.v1`.

#### Integrity and operations Events

- `quest.progress.corrected.v1`;
- `quest.integrity.contested.v1`;
- `quest.integrity.invalidated.v1`;
- `quest.integrity.restored.v1`;
- `quest.migration.completed.v1`;
- `quest.backfill.completed.v1`.

### Event emission rules

The Engine MUST NOT emit a progress Event for every internal mutation when a Definition or platform policy suppresses noisy updates. It MUST always retain authoritative history. Published progress Events MAY use thresholds, debouncing, or transition-only policy.

The Engine MUST always emit:

- Instance creation or Offer outcome;
- activation;
- Objective completion;
- player choice;
- terminal outcome;
- integrity change;
- Definition and Edition activation changes.

### Event ordering metadata

Produced Quest Events SHOULD include:

- `quest_instance_id` as aggregate id;
- `aggregate_version`;
- `transition_sequence`;
- `quest_edition_id`;
- `occurrence_key`;
- semantic `occurred_at`;
- processing `recorded_at`.

Consumers MUST use aggregate version when they require ordered Quest state.

### Event minimization

Public integration Events MUST contain stable identifiers and minimal non-sensitive summaries. Full Objective criteria, secret branches, biography data, raw source payloads, moderator notes, and private evidence MUST NOT be published broadly.

---

## Event Contracts

### Canonical Event envelope

Quest Events use the exact camelCase canonical envelope from
`002a-platform-contract-standard`. `eventType` always includes the `.vN`
suffix; separate `eventVersion` and `schemaId` fields are prohibited.

Character Quest Events use `characterId` as `partitionKey`, identify the
Character as `subject`, and include Quest Instance Aggregate identity and
version. Definition lifecycle Events use the Definition Version ID.

### `quest.offer.requested.v1`

Purpose: request creation of an Offer for a Character. Only trusted producers may emit it.

```json
{
  "requestId": "uuid",
  "characterId": "uuid",
  "questEditionId": "uuid",
  "occurrenceKey": "2026-W29",
  "requestedBy": {
    "type": "MODULE",
    "id": "school-module"
  },
  "sourceReference": {
    "type": "COHORT_ASSIGNMENT",
    "id": "uuid"
  },
  "notBefore": "2026-07-18T08:00:00Z",
  "expiresAt": "2026-07-20T08:00:00Z"
}
```

Rules:

- `requestId` is the idempotency key;
- request cannot override published Edition timing or eligibility;
- unknown Edition, wrong realm, ineligible Character, closed Edition, or duplicate occurrence produces a rejection audit and optional typed rejection Event;
- arbitrary Objective state is not accepted.

### `quest.assignment.requested.v1`

```json
{
  "requestId": "uuid",
  "characterId": "uuid",
  "questEditionId": "uuid",
  "occurrenceKey": "event:tournament-2026-07",
  "activationMode": "POLICY_DEFAULT",
  "sourceReference": {
    "type": "REGISTERED_EVENT",
    "id": "uuid"
  },
  "reasonCode": "QUALIFIED_FOR_EVENT"
}
```

The request MAY create `ASSIGNED`, `SCHEDULED`, or `ACTIVE` state depending on immutable Edition policy. Producer cannot force a less restrictive state.

### `quest.offered.v1`

```json
{
  "questOfferId": "uuid",
  "questInstanceId": "uuid",
  "characterId": "uuid",
  "questDefinitionId": "uuid",
  "questDefinitionVersionId": "uuid",
  "questEditionId": "uuid",
  "occurrenceKey": "2026-W29",
  "definitionFingerprint": "sha256:...",
  "availableFrom": "2026-07-18T08:00:00Z",
  "offerExpiresAt": "2026-07-20T08:00:00Z",
  "aggregateVersion": 1
}
```

Secret criteria and full eligibility evidence are excluded.

### `quest.accepted.v1`

```json
{
  "questInstanceId": "uuid",
  "questOfferId": "uuid",
  "characterId": "uuid",
  "questEditionId": "uuid",
  "occurrenceKey": "2026-W29",
  "acceptedAt": "2026-07-18T08:10:00Z",
  "activatedAt": "2026-07-18T08:10:00Z",
  "actionWindowEnd": "2026-07-25T08:10:00Z",
  "lateArrivalGraceEnd": "2026-07-26T08:10:00Z",
  "aggregateVersion": 2
}
```

### `quest.activated.v1`

```json
{
  "questInstanceId": "uuid",
  "characterId": "uuid",
  "questEditionId": "uuid",
  "occurrenceKey": "2026-W29",
  "activationReason": "USER_ACCEPTED",
  "activeStageKeys": ["practice"],
  "activeObjectiveKeys": ["attend-3-sessions"],
  "activatedAt": "2026-07-18T08:10:00Z",
  "aggregateVersion": 2
}
```

For hidden content, Objective keys may be omitted from broad Event distribution or replaced by disclosure-safe semantic tags.

### `quest.objective.progressed.v1`

```json
{
  "questInstanceId": "uuid",
  "characterId": "uuid",
  "questEditionId": "uuid",
  "occurrenceKey": "2026-W29",
  "objectiveKey": "attend-3-sessions",
  "objectiveType": "EVENT_COUNT",
  "visibility": "OWNER_ONLY",
  "before": {
    "current": "1",
    "target": "3",
    "complete": false
  },
  "after": {
    "current": "2",
    "target": "3",
    "complete": false
  },
  "sourceEventId": "uuid",
  "progressedAt": "2026-07-20T18:00:00Z",
  "aggregateVersion": 5
}
```

Rules:

- values serialize as strings when decimal scale or range safety requires;
- raw distinct keys and private evidence are excluded;
- progress Event policy may suppress intermediate transitions;
- source Event identity may be redacted for public topics.

### `quest.objective.completed.v1`

```json
{
  "questInstanceId": "uuid",
  "characterId": "uuid",
  "questDefinitionId": "uuid",
  "questEditionId": "uuid",
  "occurrenceKey": "2026-W29",
  "objectiveKey": "attend-3-sessions",
  "completedAt": "2026-07-22T18:00:00Z",
  "sourceEventId": "uuid",
  "aggregateVersion": 6
}
```

This Event may be consumed by Reward or Achievement configuration only when the content dependency graph remains acyclic. Rewarding every Objective is a content policy, not Quest Engine logic.

### `quest.stage.completed.v1`

```json
{
  "questInstanceId": "uuid",
  "characterId": "uuid",
  "questEditionId": "uuid",
  "stageKey": "practice",
  "completedAt": "2026-07-22T18:00:00Z",
  "nextStageKeys": ["reflection"],
  "aggregateVersion": 7
}
```

Hidden next stages MUST be omitted or redacted.

### `quest.choice.selected.v1`

```json
{
  "questInstanceId": "uuid",
  "characterId": "uuid",
  "questEditionId": "uuid",
  "choiceKey": "choose-path",
  "optionKey": "technical-mastery",
  "selectedAt": "2026-07-22T18:05:00Z",
  "selectedByUserId": "uuid",
  "activatedBranchKey": "mastery-branch",
  "aggregateVersion": 8
}
```

The broad integration topic MAY omit `selectedByUserId` and secret option identifiers. The authoritative audit retains actor identity.

### `quest.completed.v1`

```json
{
  "questCompletionId": "uuid",
  "questInstanceId": "uuid",
  "characterId": "uuid",
  "questDefinitionId": "uuid",
  "questDefinitionVersionId": "uuid",
  "questEditionId": "uuid",
  "questKey": "foundation.weekly-practice",
  "occurrenceKey": "2026-W29",
  "attemptNumber": 1,
  "definitionFingerprint": "sha256:...",
  "completionPath": "technical-mastery",
  "requiredObjectiveKeys": [
    "attend-3-sessions",
    "complete-reflection"
  ],
  "completedOptionalObjectiveKeys": [
    "help-peer"
  ],
  "completedAt": "2026-07-25T07:45:00Z",
  "recordedAt": "2026-07-25T07:45:00.180Z",
  "aggregateVersion": 12,
  "integrityStatus": "VALID",
  "sourceSummary": {
    "evidenceCount": 5,
    "evidenceFrontierHash": "sha256:..."
  }
}
```

Contract rules:

- emitted exactly once logically per Quest Instance;
- committed atomically with completion state;
- does not contain Reward definitions or fulfillment state;
- `completedAt` is deterministic semantic time, normally the latest required evidence time or choice time that made completion true;
- `recordedAt` is processing time;
- secret path and Objective keys MAY be redacted on broad topics, with a restricted internal variant for approved consumers;
- invalidation never deletes or rewrites this Event; a later integrity Event supersedes trust state.

### `quest.failed.v1`

```json
{
  "questFailureId": "uuid",
  "questInstanceId": "uuid",
  "characterId": "uuid",
  "questEditionId": "uuid",
  "occurrenceKey": "2026-W29",
  "failureType": "EXPLICIT_FAILURE_CONDITION",
  "reasonCode": "MAX_ATTEMPTS_EXHAUSTED",
  "failedAt": "2026-07-24T09:00:00Z",
  "recordedAt": "2026-07-24T09:00:00.120Z",
  "retryPolicy": {
    "retryAllowed": false,
    "nextEligibleOccurrenceKey": "2026-W30"
  },
  "aggregateVersion": 10
}
```

### `quest.expired.v1`

```json
{
  "questInstanceId": "uuid",
  "characterId": "uuid",
  "questEditionId": "uuid",
  "occurrenceKey": "2026-W29",
  "actionWindowEnd": "2026-07-25T08:10:00Z",
  "lateArrivalGraceEnd": "2026-07-26T08:10:00Z",
  "expiredAt": "2026-07-26T08:10:00Z",
  "incompleteRequiredObjectiveKeys": ["complete-reflection"],
  "aggregateVersion": 11
}
```

Expiry MUST be decided after processing or reconciling all accepted Events whose semantic time is within the action window and whose delivery is allowed by grace policy.

### `quest.abandoned.v1`

```json
{
  "questInstanceId": "uuid",
  "characterId": "uuid",
  "questEditionId": "uuid",
  "occurrenceKey": "2026-W29",
  "abandonedAt": "2026-07-21T10:00:00Z",
  "reasonCode": "OWNER_REQUESTED",
  "reentryPolicy": "NEXT_OCCURRENCE_ONLY",
  "aggregateVersion": 6
}
```

Free-form user reason text SHOULD NOT be published in the Event.

### `quest.cancelled.v1`

```json
{
  "questInstanceId": "uuid",
  "characterId": "uuid",
  "questEditionId": "uuid",
  "occurrenceKey": "2026-W29",
  "cancelledAt": "2026-07-21T10:00:00Z",
  "reasonCode": "EDITION_WITHDRAWN",
  "actorType": "SYSTEM",
  "compensationReviewRequired": true,
  "aggregateVersion": 6
}
```

Quest Engine signals compensation review but does not grant compensation itself.

### `quest.progress.corrected.v1`

```json
{
  "questInstanceId": "uuid",
  "characterId": "uuid",
  "questEditionId": "uuid",
  "objectiveKey": "attend-3-sessions",
  "originalSourceEventId": "uuid",
  "correctionEventId": "uuid",
  "before": {
    "current": "2",
    "complete": false
  },
  "after": {
    "current": "1",
    "complete": false
  },
  "reasonCode": "SOURCE_FACT_INVALIDATED",
  "aggregateVersion": 7
}
```

### `quest.integrity.invalidated.v1`

```json
{
  "integrityCaseId": "uuid",
  "questInstanceId": "uuid",
  "questCompletionId": "uuid",
  "characterId": "uuid",
  "questEditionId": "uuid",
  "previousIntegrityStatus": "CONTESTED",
  "newIntegrityStatus": "INVALIDATED",
  "reasonCode": "SOURCE_EVIDENCE_REVOKED",
  "effectiveAt": "2026-08-01T12:00:00Z",
  "recordedAt": "2026-08-01T12:00:00.200Z",
  "decisionReference": "case-reference",
  "aggregateVersion": 14
}
```

Reward Engine may consume integrity invalidation under a separately approved revocation policy. Quest Engine does not directly reverse Rewards.

### Event contract compatibility

Additive optional fields are backward compatible. Changing meaning, requiredness, identifier semantics, timestamp semantics, or enum behavior requires a new schema version.

Consumers MUST ignore unknown optional fields and MUST NOT infer behavior from presentation strings.

### Rejected Event handling

An Event may be:

- `PROCESSED`;
- `DUPLICATE`;
- `IGNORED_NO_CANDIDATE`;
- `IGNORED_INACTIVE_INSTANCE`;
- `REJECTED_SCHEMA`;
- `REJECTED_PRODUCER`;
- `REJECTED_REALM`;
- `REJECTED_TIME_WINDOW`;
- `BLOCKED_CHARACTER_STATE`;
- `QUARANTINED_DEFINITION_MISMATCH`;
- `QUARANTINED_PAYLOAD_CONFLICT`;
- `FAILED_RETRYABLE`.

Every non-processed result MUST be observable and explainable. Ordinary no-candidate Events need not create permanent per-Event audit rows beyond configured retention, but security and payload-conflict cases do.

---

## Read Models

### Read-model principles

Read models are derived, disposable, and optimized for a specific audience. They MUST NOT be used as authoritative write state.

Every read model MUST enforce:

- realm isolation;
- Character ownership or visibility policy;
- hidden and secret content suppression;
- integrity suppression;
- privacy status;
- projection freshness metadata.

### Character Quest Dashboard

Owner-facing summary grouped by:

- active;
- offered;
- scheduled;
- awaiting choice;
- completed;
- failed or expired;
- archived history.

Fields include display-safe title, short narrative, progress summary, deadline, urgency state, current Stage, next available action, reward preview reference where permitted, and freshness.

### Quest Detail

Owner-facing full projection:

- Quest metadata;
- Edition and occurrence;
- lifecycle state;
- timing;
- Objectives with disclosure policy;
- Stages and completed path;
- available choices;
- progress and units;
- completion/failure history;
- Reward preview obtained from configuration projection;
- explanation links;
- accessibility metadata.

Raw evidence and internal predicates are excluded.

### Quest Offer Card

Minimal data for discovery or inbox:

- offer id;
- Quest Edition id;
- title and image asset reference;
- estimated effort category;
- availability and offer expiry;
- high-level eligibility statement;
- participation mode;
- reward preview policy;
- accept or decline capability;
- secret-safe content.

### Active Quest HUD Projection

Compact projection for clients that need a minimal progress surface:

- Quest Instance id;
- title;
- current Objective summaries;
- normalized progress;
- deadline state;
- pending choice indicator;
- aggregate/projection version.

Clients MUST NOT use this projection to infer authoritative completion.

### Quest History

Paginated immutable history of terminal Instances with filters by Edition, category, Season, outcome, and date.

Invalidated completions remain present with correct integrity presentation and no public recognition.

### Public Quest Completion

Contains only publicly visible completion facts:

- Character profile reference;
- Quest semantic key or public title;
- public Edition art;
- completion date with configured precision;
- optional public path or badge;
- integrity-valid status.

Active Quest progress is owner-only by default.

### Quest Directory

Searchable catalog of discoverable Editions, not Character participation. It includes availability, eligibility hints, tags, content rating, locale, Season, and participation mode.

Secret Editions and hidden criteria MUST NOT be indexed.

### Internal Quest Summary

For trusted Engines and platform services:

- authoritative identifiers;
- lifecycle status;
- aggregate version;
- Definition fingerprint;
- occurrence key;
- timing;
- terminal outcome;
- integrity status;
- redacted progress summary.

Internal does not automatically mean access to raw evidence.

### Support Projection

Support staff see:

- lifecycle timeline;
- owner-visible content;
- reason codes;
- projection lag;
- Event and timer references;
- idempotency outcomes;
- approved evidence summaries;
- integrity case links.

Sensitive source payloads require elevated scope.

### Administration Projection

Includes Definition version, compiled fingerprint, graph state, exact Objective state, active timers, inbox/outbox status, migration state, and reconciliation findings.

### Authoring Preview

Shows draft graph, localized content, simulated progress, branch paths, estimated Event fan-out, recurrence calendar, and validation findings. It is not available to ordinary users.

### Campaign Projection

When Campaign primitives are enabled, the projection shows:

- Campaign version;
- Quest node sequence;
- Character-completed nodes;
- available next nodes;
- blocked prerequisites;
- narrative progress;
- Season association.

### Read consistency options

Endpoints MAY support:

- eventual projection read;
- `minAggregateVersion` wait with bounded timeout;
- authoritative read for owner command confirmation;
- ETag based on projection version.

A timeout waiting for projection freshness MUST NOT imply command failure.

### Pagination

Cursor pagination MUST use stable opaque cursors containing sort key, entity id, realm, filter fingerprint, and expiry/signature where appropriate.

Offset pagination SHOULD NOT be used for large mutable Quest lists.

### Caching

Cache keys MUST include realm, viewer visibility class, locale, projection version, privacy policy version, and Definition content version. Shared caches MUST NOT mix owner and public projections.

---

## Write Models

### Write-model principles

All mutations are commands or consumed Events. Direct database writes from Modules, clients, support tools, analytics jobs, and other Engines are prohibited.

Commands MUST be idempotent where retry is expected.

### CreateQuestDefinitionDraft

Creates a mutable draft shell.

Required fields:

- namespace;
- stable quest key;
- realm scope;
- owner team;
- initial metadata;
- authoring idempotency key.

It does not publish runtime content.

### UpdateQuestDefinitionDraft

Updates a draft with optimistic version. Published versions cannot use this command.

### ValidateQuestDefinitionDraft

Runs all static validation and returns a signed validation report tied to draft hash.

### SubmitQuestDefinitionForReview

Freezes the reviewed draft revision and creates approval tasks.

### ApproveQuestDefinition

Requires reviewer scopes and separation-of-duties policy.

### PublishQuestDefinitionVersion

Creates immutable canonical JSON, compiled plan, fingerprint, schema references, and publication audit.

### CreateQuestEdition

Binds a published Definition Version to realm, participation mode, availability, recurrence, optional Season, and release policy.

### ScheduleQuestEdition

Schedules activation. Requires validated time zone, occurrence policy, and operational capacity checks.

### PauseQuestEdition / ResumeQuestEdition / CloseQuestEdition

Operational lifecycle commands with explicit active-Instance and timer policy.

### RequestQuestOffer

Trusted command equivalent to the typed Event request. It creates or returns an idempotent Offer outcome.

### AssignQuest

Trusted command for explicit assignment. Requires actor, reason, source reference, and Edition policy permission.

### AcceptQuest

Owner command:

```json
{
  "commandId": "uuid",
  "questOfferId": "uuid",
  "questInstanceId": "uuid",
  "characterId": "uuid",
  "expectedAggregateVersion": 1,
  "acceptedAtClient": "2026-07-18T08:09:59Z"
}
```

`acceptedAtClient` is telemetry only. Server recorded time determines command acceptance unless an approved offline-command contract exists.

### DeclineQuestOffer

Owner command. Decline may be reversible only by creating a new Offer under Edition policy; the original Offer remains declined.

### AbandonQuest

Owner command requiring active Instance, allowed policy, expected version, and optional bounded reason code. It cannot abandon a terminal Instance.

### SelectQuestChoice

Owner command requiring:

- active Instance;
- available choice node;
- allowed option;
- expected aggregate version;
- idempotency key.

Two concurrent different choices: exactly one succeeds; the other receives `409 CHOICE_ALREADY_SELECTED` with the authoritative selected option only if disclosure policy permits.

### RequestQuestCancellation

Trusted administrative or system command. Requires reason, scope, impact preview, and authorization.

### OpenQuestIntegrityCase

Creates a case without mutating outcome. Requires evidence references and reason category.

### ContestQuestOutcome

Marks integrity contested and applies configured projection suppression.

### InvalidateQuestOutcome

Exceptional dual-control operation. It never deletes completion or failure history.

### RestoreQuestIntegrity

Restores valid recognition after review, preserving all transitions.

### StartQuestMigrationJob

Creates immutable source/target manifest, Character selection, node mapping, dry-run report, workload budget, and approval references.

### StartQuestBackfillJob

Creates controlled offer, assignment, or historical evaluation job. Backfill MUST declare:

- target Edition and occurrence;
- Character selection snapshot;
- source Event range;
- whether terminal outcomes may be created;
- notification policy;
- Reward trigger policy;
- maximum rate;
- dry-run counts;
- rollback or compensation plan.

### ReconcileQuestInstance

Recomputes expected state from authoritative retained evidence and compares it with persisted state. Automatic repair is limited to approved deterministic repairs.

### RebuildQuestProjections

Rebuilds derived read models without re-emitting business lifecycle Events.

### ReplayQuestEvent

Retries an inbox Event using the same Event identity and payload hash. Replay MUST NOT create a new logical contribution.

### Command result model

A command response contains:

- command id;
- status: `ACCEPTED`, `APPLIED`, `DUPLICATE`, `REJECTED`, or `PENDING`;
- resulting aggregate id and version;
- reason code;
- retryability;
- projection freshness hint;
- correlation id.

### Error taxonomy

Canonical command errors include:

- `AUTHENTICATION_REQUIRED`;
- `AUTHORIZATION_DENIED`;
- `REALM_MISMATCH`;
- `CHARACTER_NOT_ACTIVE`;
- `CHARACTER_STATE_UNKNOWN`;
- `QUEST_DEFINITION_NOT_FOUND`;
- `QUEST_EDITION_NOT_ACTIVE`;
- `QUEST_NOT_ELIGIBLE`;
- `QUEST_OFFER_EXPIRED`;
- `QUEST_ALREADY_ACCEPTED`;
- `QUEST_INSTANCE_TERMINAL`;
- `QUEST_ABANDONMENT_NOT_ALLOWED`;
- `CHOICE_NOT_AVAILABLE`;
- `CHOICE_OPTION_INVALID`;
- `CHOICE_ALREADY_SELECTED`;
- `AGGREGATE_VERSION_CONFLICT`;
- `IDEMPOTENCY_KEY_CONFLICT`;
- `DEFINITION_FINGERPRINT_MISMATCH`;
- `OPERATION_QUARANTINED`;
- `RATE_LIMITED`;
- `DEPENDENCY_DATA_STALE`.

Public errors MUST avoid revealing hidden Quests or prerequisites. Unauthorized and nonexistent secret resources SHOULD be indistinguishable.

---

## Database Schema

### Reference technology

PostgreSQL 16 or newer is the reference authoritative store. Equivalent databases MAY be used only if they provide:

- ACID transactions;
- unique and check constraints;
- row-level concurrency control;
- transactional outbox support;
- partitioning;
- JSON schema-compatible storage for immutable configuration;
- deterministic fixed-precision numeric types;
- online index management and backup/restore guarantees.

The schema below is normative at the logical level. Physical names may differ, but ownership, uniqueness, immutability, and transaction boundaries MUST be preserved.

### Conventions

- UUIDv7 or another time-sortable globally unique identifier is RECOMMENDED for new rows.
- All timestamps use `timestamptz` in UTC.
- Semantic keys use lowercase restricted ASCII with dot, hyphen, or underscore according to platform naming convention.
- `jsonb` may store immutable configuration or bounded metadata, but core lifecycle and query invariants MUST use typed columns.
- Every realm-scoped table includes `realm_id`.
- Foreign keys to other Engines are logical identifiers, not cross-database constraints.
- Audit and ledger tables are append-only through database permissions.
- Row-level security MAY supplement application authorization but does not replace it.

### `quest_definitions`

```sql
CREATE TABLE quest_definitions (
    quest_definition_id       uuid PRIMARY KEY,
    realm_id                  uuid NOT NULL,
    namespace                 text NOT NULL,
    quest_key                 text NOT NULL,
    owner_team                text NOT NULL,
    created_at                timestamptz NOT NULL,
    created_by                uuid NOT NULL,
    retired_at                timestamptz,
    metadata                  jsonb NOT NULL DEFAULT '{}'::jsonb,
    CONSTRAINT uq_quest_definition_key
        UNIQUE (realm_id, namespace, quest_key),
    CONSTRAINT ck_quest_key_format
        CHECK (quest_key ~ '^[a-z0-9][a-z0-9._-]{1,127}$')
);
```

Stable Definition identity. No runtime evaluation configuration belongs here.

### `quest_definition_drafts`

```sql
CREATE TABLE quest_definition_drafts (
    quest_definition_draft_id uuid PRIMARY KEY,
    quest_definition_id       uuid NOT NULL REFERENCES quest_definitions,
    draft_revision            bigint NOT NULL,
    draft_status              text NOT NULL,
    draft_document            jsonb NOT NULL,
    document_hash             bytea NOT NULL,
    validation_report         jsonb,
    created_at                timestamptz NOT NULL,
    created_by                uuid NOT NULL,
    updated_at                timestamptz NOT NULL,
    updated_by                uuid NOT NULL,
    submitted_at              timestamptz,
    CONSTRAINT uq_quest_draft_revision
        UNIQUE (quest_definition_id, draft_revision),
    CONSTRAINT ck_quest_draft_status
        CHECK (draft_status IN (
            'DRAFT','VALIDATED','IN_REVIEW','APPROVED',
            'REJECTED','WITHDRAWN','PUBLISHED'
        ))
);
```

Draft mutation uses optimistic revision checks.

### `quest_definition_versions`

```sql
CREATE TABLE quest_definition_versions (
    quest_definition_version_id uuid PRIMARY KEY,
    quest_definition_id         uuid NOT NULL REFERENCES quest_definitions,
    version_number              integer NOT NULL,
    semantic_version            text NOT NULL,
    lifecycle_status            text NOT NULL,
    canonical_document          jsonb NOT NULL,
    compiled_plan               jsonb NOT NULL,
    definition_fingerprint      bytea NOT NULL,
    schema_reference_set        jsonb NOT NULL,
    privacy_classification      text NOT NULL,
    complexity_score            integer NOT NULL,
    published_at                timestamptz NOT NULL,
    published_by                uuid NOT NULL,
    retired_at                  timestamptz,
    quarantined_at              timestamptz,
    quarantine_reason_code      text,
    CONSTRAINT uq_quest_definition_version
        UNIQUE (quest_definition_id, version_number),
    CONSTRAINT uq_quest_definition_fingerprint
        UNIQUE (quest_definition_id, definition_fingerprint),
    CONSTRAINT ck_quest_definition_lifecycle
        CHECK (lifecycle_status IN ('PUBLISHED','RETIRED','QUARANTINED')),
    CONSTRAINT ck_quest_complexity_positive
        CHECK (complexity_score >= 0)
);
```

Database roles used by runtime MUST have no `UPDATE` permission on published configuration columns. Lifecycle status transitions are performed through restricted stored procedures or application roles and audit.

### `quest_editions`

```sql
CREATE TABLE quest_editions (
    quest_edition_id              uuid PRIMARY KEY,
    realm_id                      uuid NOT NULL,
    quest_definition_version_id   uuid NOT NULL REFERENCES quest_definition_versions,
    edition_key                   text NOT NULL,
    lifecycle_status              text NOT NULL,
    participation_mode            text NOT NULL,
    availability_start            timestamptz,
    availability_end              timestamptz,
    season_id                     uuid,
    recurrence_policy             jsonb NOT NULL,
    eligibility_policy            jsonb NOT NULL,
    timing_policy                 jsonb NOT NULL,
    close_policy                  jsonb NOT NULL,
    suspension_policy             jsonb NOT NULL,
    visibility_policy             jsonb NOT NULL,
    presentation_bundle_id        uuid NOT NULL,
    activation_cohort_policy      jsonb NOT NULL DEFAULT '{}'::jsonb,
    max_active_instances          integer,
    activated_at                  timestamptz,
    paused_at                     timestamptz,
    closed_at                     timestamptz,
    retired_at                    timestamptz,
    created_at                    timestamptz NOT NULL,
    created_by                    uuid NOT NULL,
    CONSTRAINT uq_quest_edition_key UNIQUE (realm_id, edition_key),
    CONSTRAINT ck_quest_edition_status
        CHECK (lifecycle_status IN (
            'DRAFT','VALIDATED','SCHEDULED','ACTIVE','PAUSED',
            'CLOSED','RETIRED','QUARANTINED'
        )),
    CONSTRAINT ck_quest_edition_availability
        CHECK (availability_end IS NULL OR availability_start IS NULL
               OR availability_end > availability_start),
    CONSTRAINT ck_quest_edition_max_active
        CHECK (max_active_instances IS NULL OR max_active_instances > 0)
);
```

Only validated and immutable policy documents may be used after activation. If operational status changes, policy documents remain unchanged.

### `quest_edition_occurrences`

```sql
CREATE TABLE quest_edition_occurrences (
    quest_occurrence_id       uuid PRIMARY KEY,
    realm_id                  uuid NOT NULL,
    quest_edition_id          uuid NOT NULL REFERENCES quest_editions,
    occurrence_key            text NOT NULL,
    occurrence_start          timestamptz,
    occurrence_end            timestamptz,
    grace_end                 timestamptz,
    time_zone                 text,
    tzdb_version              text,
    source_reference_type     text,
    source_reference_id       text,
    lifecycle_status          text NOT NULL,
    generated_at              timestamptz NOT NULL,
    generation_fingerprint    bytea NOT NULL,
    CONSTRAINT uq_quest_occurrence
        UNIQUE (quest_edition_id, occurrence_key),
    CONSTRAINT ck_quest_occurrence_status
        CHECK (lifecycle_status IN ('SCHEDULED','ACTIVE','CLOSED','CANCELLED')),
    CONSTRAINT ck_quest_occurrence_window
        CHECK (occurrence_end IS NULL OR occurrence_start IS NULL
               OR occurrence_end > occurrence_start),
    CONSTRAINT ck_quest_occurrence_grace
        CHECK (grace_end IS NULL OR occurrence_end IS NULL OR grace_end >= occurrence_end)
);
```

For `ONCE`, an occurrence row MAY still be created to standardize identity.

### `quest_campaigns` and `quest_campaign_versions`

Minimal optional Campaign support:

```sql
CREATE TABLE quest_campaigns (
    quest_campaign_id uuid PRIMARY KEY,
    realm_id          uuid NOT NULL,
    campaign_key      text NOT NULL,
    owner_team        text NOT NULL,
    created_at        timestamptz NOT NULL,
    CONSTRAINT uq_quest_campaign_key UNIQUE (realm_id, campaign_key)
);

CREATE TABLE quest_campaign_versions (
    quest_campaign_version_id uuid PRIMARY KEY,
    quest_campaign_id         uuid NOT NULL REFERENCES quest_campaigns,
    version_number            integer NOT NULL,
    canonical_graph           jsonb NOT NULL,
    graph_fingerprint         bytea NOT NULL,
    published_at              timestamptz NOT NULL,
    published_by              uuid NOT NULL,
    retired_at                timestamptz,
    CONSTRAINT uq_quest_campaign_version UNIQUE (quest_campaign_id, version_number)
);
```

Campaign graph references immutable Quest Editions or Edition resolution policies. Cycles are prohibited in v1.

### `character_quest_offers`

```sql
CREATE TABLE character_quest_offers (
    quest_offer_id             uuid PRIMARY KEY,
    realm_id                   uuid NOT NULL,
    character_id               uuid NOT NULL,
    quest_edition_id           uuid NOT NULL REFERENCES quest_editions,
    quest_occurrence_id        uuid REFERENCES quest_edition_occurrences,
    occurrence_key             text NOT NULL,
    offer_channel              text NOT NULL,
    status                     text NOT NULL,
    available_from             timestamptz NOT NULL,
    expires_at                 timestamptz,
    accepted_at                timestamptz,
    declined_at                timestamptz,
    withdrawn_at               timestamptz,
    request_id                 uuid,
    source_reference_type      text,
    source_reference_id        text,
    eligibility_snapshot       jsonb NOT NULL,
    created_at                 timestamptz NOT NULL,
    updated_at                 timestamptz NOT NULL,
    CONSTRAINT uq_character_quest_offer
        UNIQUE (character_id, quest_edition_id, occurrence_key, offer_channel),
    CONSTRAINT ck_quest_offer_status
        CHECK (status IN (
            'CREATED','AVAILABLE','ACCEPTED','EXPIRED',
            'DECLINED','WITHDRAWN','INELIGIBLE'
        )),
    CONSTRAINT ck_quest_offer_expiry
        CHECK (expires_at IS NULL OR expires_at > available_from)
);
```

### `character_quest_instances`

```sql
CREATE TABLE character_quest_instances (
    quest_instance_id              uuid PRIMARY KEY,
    realm_id                       uuid NOT NULL,
    character_id                   uuid NOT NULL,
    quest_definition_id            uuid NOT NULL REFERENCES quest_definitions,
    quest_definition_version_id    uuid NOT NULL REFERENCES quest_definition_versions,
    quest_edition_id               uuid NOT NULL REFERENCES quest_editions,
    quest_occurrence_id            uuid REFERENCES quest_edition_occurrences,
    quest_offer_id                 uuid REFERENCES character_quest_offers,
    occurrence_key                 text NOT NULL,
    attempt_number                 integer NOT NULL DEFAULT 1,
    definition_fingerprint         bytea NOT NULL,
    participation_mode             text NOT NULL,
    lifecycle_status               text NOT NULL,
    integrity_status               text NOT NULL DEFAULT 'VALID',
    eligibility_snapshot           jsonb NOT NULL,
    offered_at                     timestamptz,
    assigned_at                    timestamptz,
    accepted_at                    timestamptz,
    scheduled_activation_at        timestamptz,
    activated_at                   timestamptz,
    paused_at                      timestamptz,
    action_window_start            timestamptz,
    action_window_end              timestamptz,
    late_arrival_grace_end         timestamptz,
    completed_at                   timestamptz,
    failed_at                      timestamptz,
    expired_at                     timestamptz,
    abandoned_at                   timestamptz,
    cancelled_at                   timestamptz,
    terminal_reason_code           text,
    completion_path                text,
    timer_generation               bigint NOT NULL DEFAULT 0,
    aggregate_version              bigint NOT NULL DEFAULT 1,
    state_checksum                 bytea,
    created_at                     timestamptz NOT NULL,
    updated_at                     timestamptz NOT NULL,
    CONSTRAINT uq_character_quest_instance
        UNIQUE (character_id, quest_edition_id, occurrence_key, attempt_number),
    CONSTRAINT ck_quest_instance_attempt
        CHECK (attempt_number > 0),
    CONSTRAINT ck_quest_instance_version
        CHECK (aggregate_version > 0),
    CONSTRAINT ck_quest_instance_status
        CHECK (lifecycle_status IN (
            'PENDING','OFFERED','ASSIGNED','SCHEDULED','ACTIVE','PAUSED',
            'COMPLETED','FAILED','EXPIRED','ABANDONED','CANCELLED'
        )),
    CONSTRAINT ck_quest_integrity_status
        CHECK (integrity_status IN ('VALID','CONTESTED','INVALIDATED','RESTORED')),
    CONSTRAINT ck_quest_instance_window
        CHECK (action_window_end IS NULL OR action_window_start IS NULL
               OR action_window_end > action_window_start),
    CONSTRAINT ck_quest_instance_grace
        CHECK (late_arrival_grace_end IS NULL OR action_window_end IS NULL
               OR late_arrival_grace_end >= action_window_end)
);
```

A partial unique index SHOULD enforce one active attempt when multiple attempts are configured:

```sql
CREATE UNIQUE INDEX uq_character_quest_one_nonterminal_attempt
ON character_quest_instances(character_id, quest_edition_id, occurrence_key)
WHERE lifecycle_status IN ('PENDING','OFFERED','ASSIGNED','SCHEDULED','ACTIVE','PAUSED');
```

### `character_quest_objectives`

```sql
CREATE TABLE character_quest_objectives (
    quest_instance_id          uuid NOT NULL REFERENCES character_quest_instances,
    objective_key              text NOT NULL,
    objective_type             text NOT NULL,
    lifecycle_status           text NOT NULL,
    stage_key                  text,
    branch_key                 text,
    required_role              text NOT NULL,
    visibility_mode            text NOT NULL,
    integer_current            bigint,
    integer_target             bigint,
    decimal_current            numeric(38, 12),
    decimal_target             numeric(38, 12),
    boolean_current            boolean,
    sequence_cursor            integer,
    state_document             jsonb NOT NULL DEFAULT '{}'::jsonb,
    completed_at               timestamptz,
    failed_at                  timestamptz,
    last_contribution_at       timestamptz,
    objective_version          bigint NOT NULL DEFAULT 1,
    state_checksum             bytea,
    PRIMARY KEY (quest_instance_id, objective_key),
    CONSTRAINT ck_quest_objective_status
        CHECK (lifecycle_status IN (
            'LOCKED','AVAILABLE','ACTIVE','COMPLETED','FAILED','SKIPPED','CLOSED'
        )),
    CONSTRAINT ck_quest_objective_required_role
        CHECK (required_role IN ('REQUIRED','OPTIONAL','BONUS','BRANCH')),
    CONSTRAINT ck_quest_objective_version CHECK (objective_version > 0)
);
```

Type-specific checks SHOULD ensure only appropriate scalar columns are populated.

### `character_quest_stages`

```sql
CREATE TABLE character_quest_stages (
    quest_instance_id      uuid NOT NULL REFERENCES character_quest_instances,
    stage_key              text NOT NULL,
    lifecycle_status       text NOT NULL,
    activated_at           timestamptz,
    completed_at           timestamptz,
    failed_at              timestamptz,
    stage_version          bigint NOT NULL DEFAULT 1,
    state_document         jsonb NOT NULL DEFAULT '{}'::jsonb,
    PRIMARY KEY (quest_instance_id, stage_key),
    CONSTRAINT ck_quest_stage_status
        CHECK (lifecycle_status IN ('LOCKED','ACTIVE','COMPLETED','FAILED','SKIPPED','CLOSED'))
);
```

### `character_quest_choices`

```sql
CREATE TABLE character_quest_choices (
    quest_choice_id        uuid PRIMARY KEY,
    quest_instance_id      uuid NOT NULL REFERENCES character_quest_instances,
    choice_key             text NOT NULL,
    option_key             text NOT NULL,
    selected_by_user_id    uuid NOT NULL,
    command_id             uuid NOT NULL,
    selected_at            timestamptz NOT NULL,
    aggregate_version      bigint NOT NULL,
    definition_fingerprint bytea NOT NULL,
    CONSTRAINT uq_quest_choice_node UNIQUE (quest_instance_id, choice_key),
    CONSTRAINT uq_quest_choice_command UNIQUE (command_id)
);
```

### `quest_objective_evidence`

Partition by time and optionally realm hash.

```sql
CREATE TABLE quest_objective_evidence (
    quest_evidence_id          uuid NOT NULL,
    realm_id                   uuid NOT NULL,
    quest_instance_id          uuid NOT NULL,
    objective_key              text NOT NULL,
    source_event_id            uuid NOT NULL,
    source_event_type          text NOT NULL,
    source_event_version       integer NOT NULL,
    source_producer            text NOT NULL,
    source_occurred_at         timestamptz NOT NULL,
    source_recorded_at         timestamptz NOT NULL,
    source_payload_hash        bytea NOT NULL,
    contribution_slot          text NOT NULL DEFAULT 'default',
    contribution_type          text NOT NULL,
    integer_delta              bigint,
    decimal_delta              numeric(38, 12),
    distinct_key_hash          bytea,
    extracted_values           jsonb NOT NULL DEFAULT '{}'::jsonb,
    evidence_status            text NOT NULL,
    correction_event_id        uuid,
    definition_fingerprint     bytea NOT NULL,
    applied_aggregate_version  bigint NOT NULL,
    recorded_at                timestamptz NOT NULL,
    PRIMARY KEY (quest_evidence_id, recorded_at),
    CONSTRAINT uq_quest_evidence_logical
        UNIQUE (quest_instance_id, objective_key, source_event_id, contribution_slot, recorded_at),
    CONSTRAINT ck_quest_evidence_status
        CHECK (evidence_status IN ('APPLIED','REVERSED','SUPERSEDED','IGNORED'))
) PARTITION BY RANGE (recorded_at);
```

Because PostgreSQL partitioned uniqueness constraints must include the partition key, a separate unpartitioned registry SHOULD enforce logical uniqueness:

```sql
CREATE TABLE quest_evidence_registry (
    quest_instance_id   uuid NOT NULL,
    objective_key       text NOT NULL,
    source_event_id     uuid NOT NULL,
    contribution_slot   text NOT NULL,
    quest_evidence_id   uuid NOT NULL,
    payload_hash        bytea NOT NULL,
    created_at          timestamptz NOT NULL,
    PRIMARY KEY (quest_instance_id, objective_key, source_event_id, contribution_slot)
);
```

Registry insert and evidence insert occur in one transaction.

### `quest_objective_distinct_values`

```sql
CREATE TABLE quest_objective_distinct_values (
    quest_instance_id      uuid NOT NULL,
    objective_key          text NOT NULL,
    distinct_key_hash      bytea NOT NULL,
    key_type               text NOT NULL,
    first_source_event_id  uuid NOT NULL,
    first_seen_at          timestamptz NOT NULL,
    active                 boolean NOT NULL DEFAULT true,
    correction_event_id    uuid,
    PRIMARY KEY (quest_instance_id, objective_key, distinct_key_hash, key_type)
);
```

Hashing MUST use a realm-scoped keyed digest or collision-resistant canonical encoding. Security review determines whether original values may be retained encrypted for collision resolution and support.

### `quest_sequence_events`

Optional bounded reorder buffer:

```sql
CREATE TABLE quest_sequence_events (
    quest_instance_id    uuid NOT NULL,
    objective_key        text NOT NULL,
    source_event_id      uuid NOT NULL,
    ordering_value       text NOT NULL,
    sequence_step_key    text NOT NULL,
    occurred_at          timestamptz NOT NULL,
    buffer_status        text NOT NULL,
    expires_at           timestamptz NOT NULL,
    PRIMARY KEY (quest_instance_id, objective_key, source_event_id)
);
```

Publication limits maximum rows per Objective.

### `quest_calendar_periods`

```sql
CREATE TABLE quest_calendar_periods (
    quest_instance_id      uuid NOT NULL,
    objective_key          text NOT NULL,
    period_key             text NOT NULL,
    period_start           timestamptz NOT NULL,
    period_end             timestamptz NOT NULL,
    qualifying_count       bigint NOT NULL DEFAULT 0,
    completed              boolean NOT NULL DEFAULT false,
    reconciled_at          timestamptz,
    PRIMARY KEY (quest_instance_id, objective_key, period_key)
);
```

### `quest_terminal_outcomes`

```sql
CREATE TABLE quest_terminal_outcomes (
    quest_terminal_outcome_id uuid PRIMARY KEY,
    quest_instance_id         uuid NOT NULL UNIQUE REFERENCES character_quest_instances,
    outcome_type              text NOT NULL,
    semantic_at               timestamptz NOT NULL,
    recorded_at               timestamptz NOT NULL,
    reason_code               text,
    completion_path           text,
    triggering_event_id       uuid,
    triggering_timer_id       uuid,
    evidence_frontier_hash    bytea NOT NULL,
    aggregate_version         bigint NOT NULL,
    integrity_status          text NOT NULL,
    details                   jsonb NOT NULL DEFAULT '{}'::jsonb,
    CONSTRAINT ck_quest_terminal_type
        CHECK (outcome_type IN ('COMPLETED','FAILED','EXPIRED','ABANDONED','CANCELLED'))
);
```

### `quest_instance_transitions`

Append-only:

```sql
CREATE TABLE quest_instance_transitions (
    quest_transition_id    uuid PRIMARY KEY,
    quest_instance_id      uuid NOT NULL,
    transition_sequence    bigint NOT NULL,
    aggregate_version      bigint NOT NULL,
    transition_type        text NOT NULL,
    from_status            text,
    to_status              text,
    actor_type             text NOT NULL,
    actor_id               text,
    source_event_id        uuid,
    command_id             uuid,
    timer_id               uuid,
    reason_code            text,
    transition_document    jsonb NOT NULL,
    occurred_at            timestamptz NOT NULL,
    recorded_at            timestamptz NOT NULL,
    CONSTRAINT uq_quest_transition_sequence
        UNIQUE (quest_instance_id, transition_sequence),
    CONSTRAINT uq_quest_transition_version
        UNIQUE (quest_instance_id, aggregate_version)
);
```

### `quest_deadline_timers`

```sql
CREATE TABLE quest_deadline_timers (
    quest_timer_id          uuid PRIMARY KEY,
    quest_instance_id       uuid NOT NULL,
    timer_type              text NOT NULL,
    timer_generation        bigint NOT NULL,
    due_at                  timestamptz NOT NULL,
    lifecycle_status        text NOT NULL,
    expected_aggregate_version bigint,
    claimed_by              text,
    claimed_until           timestamptz,
    attempt_count           integer NOT NULL DEFAULT 0,
    last_error_code         text,
    created_at              timestamptz NOT NULL,
    fired_at                timestamptz,
    CONSTRAINT uq_quest_timer_generation
        UNIQUE (quest_instance_id, timer_type, timer_generation),
    CONSTRAINT ck_quest_timer_status
        CHECK (lifecycle_status IN (
            'SCHEDULED','CLAIMED','FIRED','SUPERSEDED','CANCELLED',
            'FAILED_RETRYABLE','QUARANTINED'
        ))
);

CREATE INDEX ix_quest_timer_due
ON quest_deadline_timers(due_at, quest_timer_id)
WHERE lifecycle_status IN ('SCHEDULED','FAILED_RETRYABLE');
```

Workers claim timers using `FOR UPDATE SKIP LOCKED` or equivalent.

### `quest_eligibility_projection`

```sql
CREATE TABLE quest_eligibility_projection (
    realm_id                  uuid NOT NULL,
    character_id              uuid NOT NULL,
    character_lifecycle       text NOT NULL,
    character_projection_version bigint NOT NULL,
    progression_facts         jsonb NOT NULL DEFAULT '{}'::jsonb,
    achievement_facts         jsonb NOT NULL DEFAULT '{}'::jsonb,
    inventory_facts           jsonb NOT NULL DEFAULT '{}'::jsonb,
    talent_facts              jsonb NOT NULL DEFAULT '{}'::jsonb,
    reputation_facts          jsonb NOT NULL DEFAULT '{}'::jsonb,
    season_facts              jsonb NOT NULL DEFAULT '{}'::jsonb,
    privacy_flags             jsonb NOT NULL DEFAULT '{}'::jsonb,
    projected_at              timestamptz NOT NULL,
    stale_after               timestamptz NOT NULL,
    PRIMARY KEY (realm_id, character_id)
);
```

Only declared facts SHOULD be retained; it is not a general Character mirror.

### `quest_inbox_events`

```sql
CREATE TABLE quest_inbox_events (
    consumer_name          text NOT NULL,
    event_id               uuid NOT NULL,
    realm_id               uuid NOT NULL,
    event_type             text NOT NULL,
    event_version          integer NOT NULL,
    producer               text NOT NULL,
    partition_key          text,
    occurred_at            timestamptz NOT NULL,
    recorded_at            timestamptz NOT NULL,
    payload_hash           bytea NOT NULL,
    processing_status      text NOT NULL,
    attempt_count          integer NOT NULL DEFAULT 0,
    next_attempt_at        timestamptz,
    last_error_code        text,
    received_at            timestamptz NOT NULL,
    processed_at           timestamptz,
    PRIMARY KEY (consumer_name, event_id),
    CONSTRAINT ck_quest_inbox_status
        CHECK (processing_status IN (
            'RECEIVED','PROCESSING','PROCESSED','DUPLICATE','IGNORED',
            'FAILED_RETRYABLE','QUARANTINED'
        ))
);
```

The full payload MAY be stored encrypted in a short-retention side table or fetched from durable Event storage. Hash is retained according to audit policy.

### `quest_outbox_events`

```sql
CREATE TABLE quest_outbox_events (
    outbox_event_id        uuid PRIMARY KEY,
    realm_id               uuid NOT NULL,
    aggregate_type         text NOT NULL,
    aggregate_id           uuid NOT NULL,
    aggregate_version      bigint NOT NULL,
    transition_sequence    bigint NOT NULL,
    event_type             text NOT NULL,
    event_version          integer NOT NULL,
    partition_key          text NOT NULL,
    event_envelope         jsonb NOT NULL,
    payload_hash           bytea NOT NULL,
    publication_status     text NOT NULL,
    attempt_count          integer NOT NULL DEFAULT 0,
    next_attempt_at        timestamptz,
    created_at             timestamptz NOT NULL,
    published_at           timestamptz,
    broker_reference       text,
    CONSTRAINT uq_quest_outbox_aggregate_event
        UNIQUE (aggregate_id, aggregate_version, event_type),
    CONSTRAINT ck_quest_outbox_status
        CHECK (publication_status IN ('PENDING','PUBLISHING','PUBLISHED','FAILED_RETRYABLE','QUARANTINED'))
);
```

### `quest_command_idempotency`

```sql
CREATE TABLE quest_command_idempotency (
    realm_id               uuid NOT NULL,
    actor_scope            text NOT NULL,
    idempotency_key        text NOT NULL,
    request_hash           bytea NOT NULL,
    command_type           text NOT NULL,
    command_id             uuid NOT NULL,
    result_status          text NOT NULL,
    result_document        jsonb NOT NULL,
    created_at             timestamptz NOT NULL,
    expires_at             timestamptz NOT NULL,
    PRIMARY KEY (realm_id, actor_scope, idempotency_key)
);
```

Same key with different request hash returns `IDEMPOTENCY_KEY_CONFLICT`.

### `quest_integrity_cases`

```sql
CREATE TABLE quest_integrity_cases (
    quest_integrity_case_id uuid PRIMARY KEY,
    realm_id                uuid NOT NULL,
    quest_instance_id       uuid NOT NULL,
    lifecycle_status        text NOT NULL,
    reason_category         text NOT NULL,
    opened_by               uuid NOT NULL,
    opened_at               timestamptz NOT NULL,
    assigned_to             uuid,
    decision                text,
    decision_reason_code    text,
    decision_reference      text,
    decided_by              uuid,
    decided_at              timestamptz,
    evidence_manifest       jsonb NOT NULL,
    public_suppression      boolean NOT NULL DEFAULT false,
    CONSTRAINT ck_quest_integrity_case_status
        CHECK (lifecycle_status IN (
            'OPEN','INVESTIGATING','CONTESTED',
            'RESOLVED_VALID','RESOLVED_INVALIDATED','RESTORED'
        ))
);
```

### `quest_migration_jobs`

```sql
CREATE TABLE quest_migration_jobs (
    quest_migration_job_id      uuid PRIMARY KEY,
    realm_id                    uuid NOT NULL,
    source_definition_version_id uuid NOT NULL,
    target_definition_version_id uuid NOT NULL,
    selection_manifest          jsonb NOT NULL,
    node_mapping                jsonb NOT NULL,
    conversion_policy           jsonb NOT NULL,
    dry_run_report              jsonb NOT NULL,
    lifecycle_status            text NOT NULL,
    cursor_state                jsonb,
    processed_count             bigint NOT NULL DEFAULT 0,
    succeeded_count             bigint NOT NULL DEFAULT 0,
    failed_count                bigint NOT NULL DEFAULT 0,
    approved_by                 uuid NOT NULL,
    created_at                  timestamptz NOT NULL,
    started_at                  timestamptz,
    completed_at                timestamptz
);
```

### `quest_backfill_jobs`

Contains immutable target, Character selection, source Event range, occurrence policy, Reward-trigger policy, rate budget, notification policy, and resumable cursor.

### `quest_reconciliation_findings`

Append-only findings with severity, invariant code, observed state, expected state, repairability, job reference, and resolution audit.

### `quest_audit_log`

Append-only security and administrative audit:

- actor;
- action;
- target;
- before and after hashes;
- reason;
- approval chain;
- request context;
- result;
- timestamp;
- correlation id.

Application roles MUST NOT update or delete audit rows.

### Indexes

Minimum indexes include:

- active Instances by Character and deadline;
- Instances by Edition and occurrence;
- Offers by Character and status;
- Objective candidates by Instance and active status;
- evidence by source Event id;
- due timers;
- inbox retry queue;
- outbox publication queue;
- integrity cases by status and age;
- Definition and Edition lifecycle;
- migration/backfill job status.

### Partitioning

High-volume tables SHOULD be partitioned:

- inbox by received month and realm hash;
- outbox by created month;
- evidence by recorded month and optional realm hash;
- transitions by recorded month;
- audit by month under retention policy.

Partition operations MUST preserve uniqueness registries, backups, privacy deletion, and replay requirements.

### Retention

Suggested baseline, subject to legal and product policy:

- Definition versions: permanent;
- Quest Instance and terminal outcomes: life of Character plus legal retention;
- transition history: long-term or compacted after verified snapshot;
- minimal evidence: sufficient for correction, integrity, and contractual history;
- full source payload copies: avoid; short retention only when necessary;
- inbox payload: short operational retention, hash longer;
- outbox envelope: at least replay and audit horizon;
- timer rows: retain terminal rows for operational investigation, then compact;
- public projections: delete promptly on privacy or integrity suppression.

### Backup and restore

Backups MUST include Definition versions, Editions, Instances, Objective state, evidence registries, terminal outcomes, transitions, timers, inbox, outbox, idempotency, integrity cases, and privacy tombstones.

Restore procedures MUST prevent:

- republishing already published outbox Events under new ids;
- reapplying already consumed source Events;
- resurrecting privacy-deleted projections;
- activating retired Editions;
- reusing occurrence identity;
- losing timer generation state.

A restore rehearsal is REQUIRED before production launch and at least annually.

### Database permissions

Separate roles SHOULD exist for:

- runtime command and evaluation service;
- Definition authoring;
- publication;
- scheduler;
- projection workers;
- reconciliation;
- privacy processing;
- read-only support;
- migration/backfill;
- break-glass administration.

No ordinary role receives unrestricted table ownership.

---

## API Specification

### API principles

- APIs are versioned independently from Event schemas.
- Owner APIs use authenticated User identity and server-resolved Character ownership.
- Realm is derived from trusted routing context and validated against resource identity.
- Commands require idempotency keys where retries can create side effects.
- Reads may use projections; mutations use authoritative command handlers.
- Secret resources do not reveal existence through differential errors.
- Administrative APIs require scoped authorization, reason, and audit.
- API representations use localization keys or resolved localized content according to endpoint contract.

### Owner read APIs

#### List Character Quests

```http
GET /v1/characters/{characterId}/quests?status=ACTIVE,OFFERED&cursor=...
```

Response:

```json
{
  "items": [
    {
      "questInstanceId": "uuid",
      "questEditionId": "uuid",
      "status": "ACTIVE",
      "title": "Weekly Practice",
      "summary": "Complete three practice sessions.",
      "progress": {
        "completedRequired": 1,
        "totalRequired": 2,
        "normalized": "0.66"
      },
      "deadline": {
        "actionWindowEnd": "2026-07-25T08:10:00Z",
        "state": "DUE_SOON"
      },
      "currentStage": {
        "stageKey": "practice",
        "title": "Build momentum"
      },
      "aggregateVersion": 7,
      "projectionVersion": 9,
      "projectedAt": "2026-07-20T18:12:00Z"
    }
  ],
  "nextCursor": "opaque"
}
```

Authorization: owner or explicitly delegated viewer. Public viewers use separate endpoints.

#### Get Quest Detail

```http
GET /v1/characters/{characterId}/quests/{questInstanceId}
```

Supports `If-None-Match`. Returns disclosure-safe Objectives, choices, timing, narrative, and history.

#### List Quest History

```http
GET /v1/characters/{characterId}/quest-history?outcome=COMPLETED&cursor=...
```

#### List Available Quest Catalog

```http
GET /v1/characters/{characterId}/quest-catalog?category=...&cursor=...
```

Eligibility hints may be approximate only when clearly labeled. Acceptance always re-evaluates authoritative eligibility.

#### Get Quest Explanation

```http
GET /v1/characters/{characterId}/quests/{questInstanceId}/explanation
```

Owner-safe explanation includes:

- why offered or blocked;
- which visible Objective Events contributed;
- deadline basis;
- why a choice is or is not available;
- why the Quest completed, failed, or expired.

It excludes hidden predicate details and sensitive source payloads.

### Owner command APIs

#### Accept Quest

```http
POST /v1/characters/{characterId}/quests/{questInstanceId}:accept
Idempotency-Key: <opaque>
If-Match: "aggregate-version-1"
```

Body:

```json
{
  "questOfferId": "uuid"
}
```

Success: `200` if already accepted idempotently, `201` if activation created, or `202` if activation is pending dependency data.

#### Decline Offer

```http
POST /v1/characters/{characterId}/quest-offers/{questOfferId}:decline
Idempotency-Key: <opaque>
```

#### Abandon Quest

```http
POST /v1/characters/{characterId}/quests/{questInstanceId}:abandon
Idempotency-Key: <opaque>
If-Match: "aggregate-version-7"
```

Body accepts a bounded reason code and optional user feedback stored under separate privacy policy.

#### Select Choice

```http
POST /v1/characters/{characterId}/quests/{questInstanceId}/choices/{choiceKey}:select
Idempotency-Key: <opaque>
If-Match: "aggregate-version-8"
```

```json
{
  "optionKey": "technical-mastery"
}
```

### Public APIs

#### Public Quest Completion

```http
GET /v1/public/characters/{profileId}/quest-completions?cursor=...
```

Returns only visibility-approved, integrity-valid completions. Active progress is omitted by default.

#### Public Quest Catalog

```http
GET /v1/public/quest-editions/{questEditionId}
```

Returns discoverable Edition content. Secret Editions use indistinguishable `404` behavior.

### Internal APIs

Internal APIs require service identity, mTLS or equivalent, realm scope, and least privilege.

#### Resolve Quest Instance Summary

```http
GET /internal/v1/quest-instances/{questInstanceId}/summary
```

#### Request Offer

```http
POST /internal/v1/quest-offers:request
Idempotency-Key: <request-id>
```

Event integration is preferred for asynchronous bulk workloads.

#### Request Assignment

```http
POST /internal/v1/quest-assignments
Idempotency-Key: <request-id>
```

#### Batch Eligibility Check

```http
POST /internal/v1/quest-editions/{questEditionId}:check-eligibility
```

Batch size is bounded. Responses are for orchestration and do not reserve eligibility.

### Authoring APIs

- `POST /admin/v1/quest-definitions`;
- `POST /admin/v1/quest-definitions/{id}/drafts`;
- `PATCH /admin/v1/quest-definition-drafts/{draftId}`;
- `POST /admin/v1/quest-definition-drafts/{draftId}:validate`;
- `POST /admin/v1/quest-definition-drafts/{draftId}:simulate`;
- `POST /admin/v1/quest-definition-drafts/{draftId}:submit-review`;
- `POST /admin/v1/quest-definition-drafts/{draftId}:approve`;
- `POST /admin/v1/quest-definition-drafts/{draftId}:publish`;
- `POST /admin/v1/quest-editions`;
- `POST /admin/v1/quest-editions/{id}:schedule`;
- `POST /admin/v1/quest-editions/{id}:activate`;
- `POST /admin/v1/quest-editions/{id}:pause`;
- `POST /admin/v1/quest-editions/{id}:resume`;
- `POST /admin/v1/quest-editions/{id}:close`.

Publication endpoints require approval references and immutable validation hash.

### Simulation API

```http
POST /admin/v1/quest-definition-drafts/{draftId}:simulate
```

Input:

- synthetic or approved historical Event sequence;
- Character projection snapshot;
- occurrence context;
- time controls;
- optional choice commands.

Output:

- candidate routing;
- predicate results;
- Contributions;
- Objective before/after state;
- Stage transitions;
- graph frontier;
- timer creation;
- terminal outcome;
- produced Event previews;
- complexity and fan-out diagnostics.

Simulation MUST NOT mutate production state or publish Events.

### Support APIs

- retrieve lifecycle timeline;
- explain ignored Event;
- inspect timer state;
- compare projection with aggregate;
- open integrity case;
- request authorized replay;
- request reconciliation.

Support APIs MUST not expose arbitrary SQL or mutation controls.

### Operations APIs

- inbox backlog and quarantine;
- outbox retry;
- scheduler health;
- pause producer or Definition;
- start projection rebuild;
- start migration/backfill;
- reconcile partition;
- drain worker shard.

Operations endpoints SHOULD be asynchronous jobs with status resources.

### HTTP status semantics

- `200` — successful read or idempotent existing result;
- `201` — new resource or applied command created;
- `202` — accepted asynchronous operation;
- `204` — successful command without body where appropriate;
- `400` — malformed request;
- `401` — authentication required;
- `403` — authorization denied, except hidden-resource policies;
- `404` — absent or intentionally undisclosed resource;
- `409` — lifecycle, choice, idempotency, or version conflict;
- `412` — `If-Match` failed;
- `422` — semantically invalid authoring configuration;
- `429` — rate limit;
- `503` — dependency projection unavailable or service unavailable with retry guidance.

### Rate limits

Separate quotas apply to:

- owner reads;
- owner commands;
- internal assignment;
- bulk eligibility;
- authoring simulation;
- administration;
- support evidence access.

Rate-limit keys include realm and authenticated principal. Security-sensitive limits MUST not reveal hidden resource existence.

### ETags and optimistic concurrency

Owner detail endpoints SHOULD return:

```http
ETag: "quest-instance:<id>:<aggregate-version>:<projection-version>"
```

Mutating commands SHOULD use `If-Match` or `expectedAggregateVersion`. Idempotent duplicate commands return original result even when current aggregate version has advanced, provided request hash matches.

### API deprecation

API versions require published deprecation windows, usage telemetry, migration documentation, and no silent field semantic changes. Event schema compatibility is governed separately.

---

## Admin Features

### Administrative philosophy

Administration exists to safely author, release, inspect, pause, reconcile, and correct Quest behavior. It is not a shortcut around domain invariants.

Every administrative action MUST be:

- authenticated;
- authorized by explicit scope;
- realm-bound;
- reason-coded;
- idempotent where retried;
- audited with actor and correlation id;
- previewable when impact is broad;
- reversible when technically possible;
- protected by dual control when high risk.

### Quest authoring workspace

The authoring workspace SHOULD provide:

- stable Quest key and namespace management;
- versioned draft editing;
- localized title, summary, narrative, and Objective text;
- graph editor for Stages, Objectives, gates, branches, and choices;
- typed Objective configuration forms;
- schema-aware Event field picker;
- eligibility policy editor;
- recurrence and calendar preview;
- time-window and grace editor;
- visibility and secret-content controls;
- reward preview references without editing Reward Engine configuration;
- Campaign dependency visualization;
- accessibility checks;
- content-rating and minor-safety metadata;
- validation and simulation results.

The editor MUST generate canonical data, not executable scripts.

### Static validation

Publication-blocking validation includes:

- duplicate semantic keys;
- invalid Event schema references;
- incompatible field types;
- untrusted producer use;
- graph cycles;
- unreachable required nodes;
- dead-end non-terminal paths;
- branch options that do not converge or terminate according to policy;
- ambiguous completion and failure precedence;
- unbounded exact distinct state;
- impossible or negative thresholds;
- decimal scale mismatch;
- invalid time zones;
- recurrence ambiguity around daylight-saving transitions;
- deadline before activation;
- grace before deadline;
- secret-content leakage through public strings;
- circular Quest/Achievement/Campaign dependencies;
- concurrency or exclusivity conflicts;
- migration policy absence for replacing an active Edition;
- missing required localization;
- complexity budget exceedance;
- estimated fan-out above approved limits;
- forbidden Reward ownership fields;
- privacy classification mismatch.

Warnings may include estimated low completion rate, excessive steps, unclear narrative, long duration, high Event volume, or inaccessible copy. Warnings require acknowledgment but do not always block publication.

### Graph visualization

The tool SHOULD visualize:

- entry nodes;
- active dependencies;
- optional nodes;
- mutually exclusive branches;
- explicit choices;
- terminal outcomes;
- hidden nodes;
- external prerequisites;
- Event subscriptions;
- Reward and Achievement downstream edges;
- cycle analysis result.

The visualization is derived from canonical data and MUST display the compiled fingerprint.

### Simulation console

Authors and engineers can run deterministic scenarios:

- happy path;
- duplicate Events;
- out-of-order Events;
- late delivery before and after grace;
- source correction;
- Character suspension;
- Edition pause;
- concurrent choice commands;
- branch selection;
- deadline race;
- recurrence boundary;
- projection staleness;
- post-completion invalidation.

Simulation output MUST identify every state transition and emitted Event.

### Approval workflow

Minimum roles:

- Author;
- Content Reviewer;
- Technical Reviewer;
- Publisher.

One person MUST NOT author and publish a high-impact Quest without an approved exception. Economy-linked, paid, minor-facing, regulated, or mass-assignment Quests require additional review according to policy.

### Release management

Administrators can:

- schedule Edition activation;
- activate by realm and cohort;
- perform canary release;
- pause new Offers only;
- pause all evaluation;
- freeze timers;
- close an Edition;
- quarantine a Definition;
- compare regional fingerprints;
- rollback routing to a prior Edition for new Instances.

Rollback never moves existing Instances unless a migration is approved.

### Live monitoring

Per Edition dashboards SHOULD show:

- eligible population;
- Offer creation and acceptance;
- active Instances;
- Objective funnel;
- branch distribution;
- choice latency;
- completion, failure, expiry, abandonment;
- median and percentile completion time;
- Event candidate and match rates;
- deadline backlog;
- projection lag;
- Reward-trigger publication lag;
- error and quarantine rates;
- Character support contacts.

Analytics are for observation and design. They do not mutate authoritative progress.

### Character support tools

Authorized support may:

- search by Character and Quest Instance;
- see owner-safe Quest detail;
- inspect lifecycle timeline;
- explain eligibility and ignored Events;
- inspect deadline and pause history;
- compare source Event reference with Contribution;
- request replay;
- request projection refresh;
- open integrity case;
- attach support case reference.

Support MUST NOT:

- edit counters;
- select choices for a Character except under a documented accessibility delegation workflow;
- mark completion directly;
- delete evidence;
- change Definition binding;
- grant associated Rewards.

### Bulk assignment

Bulk assignment requires:

- immutable Character selection snapshot or query hash;
- dry-run eligible/ineligible counts;
- duplicate and existing-Instance analysis;
- rate and partition budget;
- Offer or auto-start mode;
- notification policy;
- cancellation and compensation plan;
- approval chain;
- resumable job;
- per-Character idempotency.

A bulk job MUST not hold one large database transaction.

### Backfill administration

Backfill UI must distinguish:

- historical offer creation;
- historical assignment;
- historical progress evaluation;
- terminal completion creation;
- notification publication;
- Reward-trigger publication.

These flags are independent. A historical evaluation MUST NOT unexpectedly grant Rewards merely because it completed old Quests. Reward behavior requires explicit approved policy.

### Integrity operations

High-risk actions:

- contest completion;
- invalidate completion;
- restore integrity;
- suppress public recognition;
- request downstream Reward revocation review.

They require dual authorization, structured reason, evidence manifest, impact preview, and immutable decision record.

### Definition diff

A semantic diff between versions SHOULD highlight:

- Event schema changes;
- predicate changes;
- threshold changes;
- graph node additions/removals;
- branch changes;
- timing changes;
- recurrence changes;
- eligibility changes;
- visibility changes;
- downstream Event changes;
- migration compatibility.

Raw JSON diff alone is insufficient.

### Emergency controls

Break-glass operations include:

- quarantine source producer;
- pause one Definition fingerprint;
- pause one Edition;
- stop new assignments globally by realm;
- freeze deadline scheduler;
- stop outbox topic publication;
- suppress public projections;
- disable authoring publication.

Every break-glass action expires automatically unless renewed and generates a critical alert.

---

## UX Requirements

### Narrative-first presentation

Quest UX MUST emphasize intention and story before raw mechanics. A Character should understand:

- why the Quest matters;
- what action is expected now;
- how current progress connects to a larger journey;
- what deadline or choice exists;
- what completion means.

Numeric progress is supporting information, not the entire experience.

### Owner dashboard

The dashboard SHOULD prioritize:

1. urgent active Quests with near deadlines;
2. Quests awaiting a Character choice;
3. active Quests with a clear next action;
4. new Offers;
5. scheduled Quests;
6. recently completed history.

Sorting MUST be deterministic and server-provided. Clients SHOULD NOT invent urgency from raw timestamps without policy metadata.

### Quest card

A card contains:

- title;
- short narrative;
- status;
- current Stage or next action;
- progress summary;
- deadline state;
- participation action;
- reward preview when permitted;
- content and accessibility indicators;
- offline/stale state when relevant.

### Quest detail

Detail view SHOULD include:

- narrative introduction;
- visible Objective list;
- Stage progression;
- completed actions;
- available choices and consequences at allowed disclosure level;
- action window and time zone;
- failure or abandonment implications;
- completion history;
- support explanation access.

### Progress representation

Server chooses representation per Objective:

- exact count: `2 of 3`;
- fixed decimal and unit: `90 of 120 minutes`;
- checklist;
- sequence steps;
- streak calendar;
- boolean complete/incomplete;
- normalized bar;
- hidden or mystery state.

Clients MUST NOT derive a percentage when the server marks progress non-linear or hidden.

### Hidden content

Disclosure modes:

- show full criteria;
- show title but hide criteria;
- show a vague hint;
- show only after activation;
- reveal Objective after prerequisite Stage;
- reveal only after completion;
- fully secret.

A secret Quest or Objective MUST not leak through counts such as “3 of 4 hidden objectives,” predictable asset URLs, analytics events, accessibility labels, cached API responses, or error messages.

### Choices

Choice UX MUST:

- clearly distinguish reversible preview from irreversible commit;
- show consequences only to the configured disclosure level;
- require explicit confirmation for irreversible choices;
- prevent duplicate submission;
- display authoritative selected state after concurrency conflict;
- remain accessible by keyboard and assistive technology;
- avoid dark patterns.

### Deadlines

Display MUST include:

- absolute date and local time;
- time zone when ambiguity exists;
- relative countdown as secondary information;
- distinction between action deadline and processing grace;
- pause or frozen status;
- expired state.

Clients MUST NOT present late-arrival grace as extra time to perform the action.

### Offers

Offer UX states:

- available;
- accepted;
- declined;
- expired;
- withdrawn;
- no longer eligible.

Accepting an Offer MUST be idempotent and provide immediate authoritative confirmation, even if the projection refresh is pending.

### Completion

Completion experience may use animation and narrative, but it MUST:

- display Quest completion independently from Reward fulfillment;
- avoid claiming a Reward was delivered until Reward projection confirms it;
- support delayed Reward state gracefully;
- record completion date correctly;
- respect reduced-motion preference;
- remain understandable without sound or animation.

### Failure and expiry

Failure UX MUST use neutral, respectful language. It SHOULD explain:

- what happened;
- whether retry is possible;
- next eligible occurrence;
- which progress was retained or closed;
- whether the Quest ended because of platform cancellation rather than user behavior.

Cancellation MUST not be presented as personal failure.

### Abandonment

Before abandonment, show:

- whether re-entry is allowed;
- whether current progress is lost for the occurrence;
- any cooldown;
- whether associated rewards become unavailable.

No manipulative guilt language is allowed.

### Stale and offline state

Clients MUST show a pending or stale indicator when:

- a command succeeded but projection is catching up;
- offline actions await source-system confirmation;
- the local cache is older than `staleAfter`;
- Character eligibility projection is unavailable.

Clients MUST not optimistically mark Objectives complete unless clearly labeled as pending and later reconciled.

### Localization

All user-facing strings use localization keys and versioned bundles. Definition publication validates required locales.

Pluralization, units, date/time formatting, right-to-left layout, text expansion, and culturally appropriate narrative are required.

### Accessibility

Minimum requirements:

- WCAG 2.2 AA for platform-owned clients;
- semantic heading and list structure;
- keyboard-operable choices and actions;
- screen-reader progress descriptions;
- non-color status indicators;
- reduced-motion support;
- sufficient contrast;
- accessible deadline announcements;
- no essential information only in imagery;
- clear errors and focus management.

### Minor safety

Minor-facing Quests require:

- age-appropriate narrative;
- no public active-location disclosure;
- restricted social or partner identifiers;
- safe notification hours;
- guardian or organization policy where required;
- no coercive streak loss or financial pressure;
- privacy-minimized evidence.

### Reward preview

Reward previews are projections from Reward configuration. They MUST be labeled as expected, potential, randomized, claim-required, or fulfilled according to actual Reward semantics.

Quest Engine UX MUST not hardcode Reward quantities into Quest content unless the value is versioned and reconciled with Reward Definition.

### Integrity presentation

When a completion is contested or invalidated:

- public recognition is suppressed according to policy;
- owner sees a neutral status and support path;
- private investigation details are not disclosed;
- history is not silently removed;
- restored outcomes return through an explicit state.

---

## Security

### Security objectives

Protect:

- authoritative Quest state;
- secret content;
- Character privacy;
- Definition publication integrity;
- Event trust boundary;
- administrative operations;
- downstream economy from fraudulent completion;
- availability under high Event volume.

### Threat model

Relevant threats include:

- forged source Events;
- Event replay and duplicate amplification;
- payload mutation under reused Event id;
- unauthorized Quest assignment;
- client-side progress fabrication;
- Character ownership spoofing;
- cross-realm access;
- hidden Quest enumeration;
- secret predicate extraction;
- malicious Definition publication;
- graph or expression denial of service;
- timer manipulation;
- race-condition double completion;
- support-tool privilege abuse;
- bulk-assignment misuse;
- data exfiltration through evidence or logs;
- downstream Reward abuse;
- supply-chain compromise of configuration artifacts.

### Authentication

All write APIs require authenticated principals. Internal services use workload identity with short-lived credentials and mutually authenticated transport or equivalent.

Anonymous access is allowed only for explicitly public catalog and profile endpoints.

### Authorization

Authorization decisions include:

- principal;
- realm;
- Character ownership or delegation;
- action scope;
- resource visibility;
- Definition/Edition owner team;
- environment;
- high-risk approval state.

Every command re-evaluates authorization server-side. Client claims are not trusted.

### Character ownership

Owner commands resolve User-to-Character ownership through authoritative identity context or a trusted local projection. Supplying a Character id does not grant access.

Delegation, guardian, coach, or organization roles require explicit scoped relationships and must not imply unrestricted evidence access.

### Realm isolation

Realm id is validated at ingress, command handling, database query, cache key, Event publication, search indexing, and audit.

Cross-realm identifiers cause rejection and security telemetry. Database row-level security is RECOMMENDED as defense in depth.

### Event producer trust

Each consumed Event type has an allowlist of producer identities and schema versions. The Engine validates:

- transport authentication;
- producer identity;
- schema id;
- realm;
- signature or broker provenance where applicable;
- Event id;
- payload hash;
- timestamp bounds;
- privacy metadata.

A producer cannot gain authority by using another producer’s Event type string.

### Replay protection

Inbox uniqueness prevents duplicate logical processing. Payload hash mismatch for an existing Event id triggers quarantine and critical security alert.

Old Events outside retention or allowed lateness are rejected or routed to approved backfill, not silently processed.

### Definition supply chain

Published Definition artifacts MUST be:

- canonicalized;
- hashed;
- signed or publication-attested;
- linked to approvals;
- immutable;
- replicated with fingerprint verification;
- loaded only from trusted registry.

Runtime nodes compare artifact fingerprint across regions. Mismatch disables evaluation for that Definition.

### Expression and graph safety

The bounded DSL prohibits:

- arbitrary code;
- regular expressions without safe engine and limits;
- recursive expressions;
- network access;
- filesystem access;
- SQL;
- user-defined functions;
- dynamic field paths;
- unbounded iteration.

Publication enforces node count, depth, predicate cost, set cardinality, sequence buffer, and fan-out limits.

### API security

Requirements:

- TLS in transit;
- strict request size limits;
- JSON parser depth limits;
- schema validation;
- idempotency-key length and entropy validation;
- CSRF protection where cookie authentication is used;
- CORS allowlist;
- rate limiting;
- abuse detection;
- no sensitive data in URL query parameters;
- secure error redaction.

### Hidden content protection

Secret and hidden content remain server-side. Protection includes:

- separate restricted projections;
- no secret Definition document in client bundles;
- no predictable asset paths;
- no secret keys in analytics;
- no differential `403` versus `404` enumeration;
- no full criteria in logs or traces;
- cache partition by disclosure class;
- redaction tests and canaries.

### Administrative security

High-risk actions require:

- phishing-resistant MFA;
- privileged role;
- just-in-time elevation;
- dual approval;
- ticket or incident reference;
- bounded scope;
- automatic expiration;
- immutable audit;
- alerting.

### Separation of duties

Author, approver, publisher, integrity investigator, and break-glass operator SHOULD be separate roles for high-impact content.

### Choice security

Choice commands use authenticated owner context, expected aggregate version, idempotency key, and server-side option allowlist. Clients cannot submit hidden arbitrary branch keys.

### Timer security

Clients cannot invoke deadline timers. Timer rows are created from authoritative policy and claimed by workload identity. Clock drift is monitored. Manual timer firing requires privileged audited operation.

### Evidence security

Evidence stores minimal extracted values. Sensitive fields are encrypted at rest and access is scope-controlled. Raw Event payload access is exceptional and audited.

Hashing identifiers without a secret key may still allow dictionary attacks. Realm-scoped keyed HMAC is RECOMMENDED for pseudonymous distinct keys.

### Downstream Reward protection

`quest.completed.v1` is published only from transactional authoritative completion. Reward Engine must validate producer identity and idempotently bind the exact completion id.

Quest Engine SHOULD provide a restricted integrity topic so Reward Engine can review invalidated completions according to its own reversal policy.

### Denial-of-service protection

Controls include:

- candidate indexes;
- per-Definition fan-out budgets;
- producer quotas;
- Event batch limits;
- circuit breakers;
- partition backpressure;
- Definition quarantine;
- bounded retries;
- scheduler sharding;
- backfill workload caps;
- database resource groups.

### Secrets management

Credentials, signing keys, HMAC keys, encryption keys, and database passwords are stored in an approved secrets manager, rotated, and never embedded in Definitions or logs.

### Security logging

Security Events include:

- authorization denial;
- cross-realm attempt;
- payload hash conflict;
- unknown producer;
- hidden-resource enumeration anomaly;
- high-rate accept or choice attempts;
- publication fingerprint mismatch;
- privileged action;
- integrity invalidation;
- bulk assignment launch;
- evidence export.

### Vulnerability management

The service requires dependency scanning, container and artifact signing, static analysis, secret scanning, penetration testing of authoring and hidden-content paths, and regular threat-model review.

---

## Privacy

### Privacy principles

The Engine follows data minimization, purpose limitation, least privilege, retention limitation, transparency, and privacy by design.

Quest progress may reveal behavior, attendance, education, fitness, purchases, location patterns, interests, or community participation. Such data can be sensitive even when each source Event appears ordinary.

### Data classification

At minimum:

- Definition metadata: public, internal, confidential, or secret;
- Quest Instance participation: personal;
- active progress: personal, owner-only by default;
- source evidence: confidential personal data;
- minor data: restricted;
- health, education, location, or regulated evidence: sensitive/restricted;
- public completion: public only with policy and Character visibility.

### Data minimization

The Engine SHOULD store:

- Event id and type;
- minimal extracted values needed for evaluation;
- cryptographic payload hash;
- Contribution;
- timestamps;
- opaque source reference.

It SHOULD NOT copy full source payloads, free-form notes, exact location, payment details, medical details, or unnecessary personal identifiers.

### Purpose limitation

Evidence collected for Quest evaluation MUST NOT be reused for unrelated profiling, advertising, or eligibility decisions without a separate lawful basis and product policy.

### Visibility defaults

- active Quest participation: owner-only;
- Objective progress: owner-only;
- failure and abandonment: owner-only;
- completion: owner-only unless explicitly made public by policy and profile settings;
- source evidence: restricted support/admin only;
- secret content: server-side only.

### Character privacy settings

Public projection combines Quest Edition policy with Character profile visibility. The stricter rule wins.

A Character cannot make public content that the Edition marks owner-only or secret.

### Consent and transparency

Where required, the user must be informed:

- which actions contribute to a Quest;
- whether participation is automatic or opt-in;
- whether completion may become public;
- whether a Reward may follow;
- how long progress and history are retained;
- how to abandon or hide participation;
- how to request access or correction.

Hidden Objectives may withhold game criteria but not legally required privacy information.

### Minor data

For minors:

- active progress MUST NOT be public by default;
- source partner or location identifiers are minimized;
- guardian and organization access is explicitly scoped;
- evidence access is highly restricted;
- retention may be shorter;
- behavioral pressure mechanics require safety review.

### Data subject access

Export SHOULD include:

- Offers and assignments;
- accepted and active Quest history;
- visible Objective progress;
- terminal outcomes;
- Character choices;
- integrity statuses;
- human-readable source categories;
- public visibility state.

Export MUST not reveal other Characters’ personal data, secret anti-fraud rules, internal security notes, or protected Definition criteria.

### Correction requests

A user may dispute source facts or Quest outcome. Quest Engine records the request and routes fact correction to the owning producer. It does not rewrite source truth itself.

If source correction arrives, Quest Engine follows correction and integrity policy.

### Erasure and anonymization

On Character anonymization:

- owner and public projections are removed;
- personal presentation fields are deleted;
- source evidence is deleted, pseudonymized, or cryptographically erased according to retention basis;
- Character id may be replaced by irreversible pseudonymous linkage where required for ledger integrity;
- idempotency tombstones remain non-personal where possible;
- search indexes and caches are purged;
- backups retain tombstone instructions for restore-time re-erasure.

The Engine MUST document which fields remain and lawful basis.

### Retention policies

Retention is configurable by realm and data class but bounded by platform minimums for integrity and legal requirements.

Different retention may apply to:

- active state;
- completed history;
- failed/abandoned history;
- raw evidence;
- exact distinct keys;
- inbox payloads;
- audit logs;
- support notes;
- public projections.

### Location and time data

Exact location MUST NOT be retained unless an Objective explicitly requires a trusted geospatial fact and privacy review approves it. Prefer producer-issued boolean or region-level qualification Events.

Calendar streaks retain period keys rather than continuous activity traces when possible.

### Social and distinct-count privacy

Objectives such as “interact with three distinct people” SHOULD store keyed digests, not other Characters’ display names. Owner UX should avoid exposing participant identity unless the source product separately authorizes it.

### Analytics

Analytics exports SHOULD use aggregated or pseudonymized data. Small cohorts and rare secret paths require suppression to reduce re-identification.

Operational metrics MUST not use Character identifiers as unbounded labels.

### Cache privacy

Privacy and integrity changes trigger cache invalidation. Shared caches use viewer class and realm in keys. Public responses MUST NOT be served from owner cache entries.

### Logging and tracing

Logs and traces MUST avoid:

- raw source payloads;
- biography or free-form user text;
- exact partner identifiers;
- secret Objective criteria;
- access tokens;
- sensitive evidence values.

Use opaque ids and reason codes.

### Privacy incidents

Runbooks cover:

- secret criteria exposure;
- public active-progress exposure;
- cross-realm data leak;
- stale cache after anonymization;
- backup restore resurrecting erased data;
- unauthorized evidence export.

---

## Performance

### Performance objectives

The Engine MUST support high Event volume while preserving correctness. Exact SLO values are environment-specific, but production release requires explicit targets and load tests.

Recommended baseline for steady-state production:

- owner Quest list read: p95 under 200 ms from regional projection;
- owner Quest detail: p95 under 250 ms;
- accept, abandon, or choice command: p95 under 400 ms excluding client network;
- Event ingress registration: p95 under 100 ms;
- ordinary Objective mutation after Event availability: p95 under 2 seconds, p99 under 10 seconds;
- Quest completion Event outbox publication: p95 under 2 seconds after commit;
- deadline firing: 99.9% within 60 seconds of due time under normal load;
- privacy suppression projection: p99 under 60 seconds, with critical path target lower;
- no lost logical Contributions under tested failover.

### Capacity dimensions

Capacity planning includes:

- registered Characters;
- active Characters;
- active Quest Instances per Character;
- active Editions;
- Objective nodes per Instance;
- source Events per second;
- candidate fan-out per Event;
- exact distinct values per Objective;
- evidence rows per second;
- due timers per minute;
- recurrence creation volume;
- read query rate;
- backfill volume;
- outbox backlog.

### Complexity budgets

Publication limits SHOULD include:

- maximum 100 graph nodes per Quest by default;
- maximum graph depth 20;
- maximum composite depth 8;
- maximum branch fan-out 10;
- maximum active Objectives 25 at once;
- maximum exact distinct target 10,000 without special approval;
- maximum sequence reorder buffer 1,000 Events;
- maximum active duration 365 days without special approval;
- maximum candidate Editions per source Event and Character;
- maximum downstream lifecycle Events per one source Event.

Limits are configurable by platform policy but cannot be absent.

### Candidate routing

The Engine MUST avoid scanning all Definitions or all active Instances.

Routing indexes include:

- Event type and version;
- realm;
- indexed equality predicates;
- Character id;
- active Objective type;
- Edition activation range;
- occurrence.

Complex predicates run only after coarse candidate filtering.

### Partitioning strategy

Primary processing partition SHOULD be Character id to serialize most per-Character changes and reduce aggregate conflicts.

Additional sharding may use realm and Character hash. Edition-wide jobs use separate work queues to avoid hot partitions.

### Hot Character handling

A Character with many active Quests may cause fan-out. Controls:

- active Quest concurrency limits;
- per-Event candidate cap;
- compiled shared predicate evaluation;
- batching Aggregate loads;
- priority queues;
- quarantine on pathological content.

### Hot Edition handling

Mass assignment or global Event triggers can create hotspots. Controls:

- cohort-based rollout;
- distributed occurrence generation;
- rate-limited fan-out;
- asynchronous assignment jobs;
- partitioned Edition indexes;
- precomputed eligibility segments only as hints, with authoritative checks at mutation.

### Database transaction size

One ordinary transaction SHOULD mutate one Quest Instance plus inbox/outbox and evidence. It MUST NOT update all Instances for an Edition in one transaction.

Large exact sets and histories use append-only side tables rather than growing one JSON document.

### Locking

Lock order MUST be documented. Recommended:

1. inbox/idempotency row;
2. Quest Instance row;
3. Objective rows in stable key order;
4. evidence registry;
5. timer rows;
6. outbox rows.

Deadlock retries reload and re-evaluate.

### Caching

Cache immutable Definition plans aggressively by fingerprint. Cache read projections by version and viewer class. Do not cache authoritative command decisions across Character state changes without explicit invalidation.

### Scheduler scalability

Deadline timers are sharded by due time and realm. Workers claim bounded batches using skip-locked semantics. Scheduler must handle:

- burst at round calendar boundaries;
- daylight-saving transitions;
- regional failover;
- missed timer reconciliation;
- pause/resume generation changes.

### Backfill isolation

Backfill uses separate queues, connection pools, quotas, and priorities. Live Event processing and deadlines always have priority.

Backfill auto-pauses when:

- live latency exceeds threshold;
- database replication lag rises;
- outbox backlog exceeds limit;
- lock conflicts exceed limit;
- storage growth exceeds budget.

### Projection performance

Projection workers consume transition/outbox streams and perform idempotent upserts. Full rebuild is isolated from live projection updates using versioned indexes or shadow tables.

### Search

Quest catalog search uses a dedicated index. Character participation queries do not depend on full-text search.

Secret and retired content is excluded at indexing time and filtered again at query time.

### Load shedding

Under overload, priority order is:

1. security and privacy changes;
2. terminal Quest transactions and outbox;
3. owner commands;
4. deadline processing;
5. live source Events;
6. owner reads;
7. public reads;
8. projections;
9. analytics;
10. backfill and simulation.

Correctness-critical accepted Events must remain durably queued even when evaluation is delayed.

### Resilience

The Engine SHOULD be multi-instance and zone-redundant. Database high availability, broker redundancy, idempotent failover, and regional recovery objectives are required.

### Disaster recovery

Define and test:

- RPO;
- RTO;
- backup restore;
- inbox/outbox reconciliation;
- timer recovery;
- projection rebuild;
- privacy tombstone reapplication;
- Definition fingerprint verification;
- duplicate-safe broker republish.

### Performance testing

Required tests:

- peak Event volume;
- mass daily/weekly recurrence boundary;
- deadline burst;
- global Edition activation;
- hot Character;
- high distinct-count Objective;
- branch cascade;
- database failover;
- broker redelivery storm;
- outbox backlog recovery;
- backfill under live load;
- privacy suppression surge.

---

## Audit

### Audit principles

Every authoritative state change must be attributable, ordered, and explainable. Audit history is append-only and distinct from user-facing history.

### Audited Definition actions

- draft creation and update;
- validation;
- review submission;
- approval or rejection;
- publication;
- Edition creation;
- scheduling and activation;
- pause, resume, close, retirement, quarantine;
- localization replacement;
- dependency change;
- migration approval.

Audit stores before/after document hashes, not necessarily duplicate full documents when immutable versions already exist.

### Audited Character actions

- Offer creation, decline, expiry, withdrawal;
- assignment;
- acceptance;
- activation;
- Objective Contribution and correction;
- Stage transition;
- choice selection;
- pause/resume;
- completion, failure, expiry, abandonment, cancellation;
- integrity transition;
- privacy suppression;
- migration.

High-volume progress audit may reference immutable transition and evidence tables rather than duplicate every field in a separate security log.

### Actor model

Actor types:

- `USER`;
- `CHARACTER`;
- `MODULE`;
- `ENGINE`;
- `ADMIN`;
- `SUPPORT`;
- `SYSTEM_TIMER`;
- `MIGRATION_JOB`;
- `BACKFILL_JOB`;
- `RECONCILIATION_JOB`.

### Correlation

Every command and Event should preserve:

- correlation id for one user or business flow;
- causation id for immediate predecessor;
- trace id for distributed diagnostics;
- source reference;
- aggregate version.

### Explainability record

For each evaluation mutation, explainability includes:

- Definition fingerprint;
- candidate routing reason;
- predicate result;
- extracted values;
- Contribution;
- Objective before/after;
- graph transitions;
- terminal evaluation;
- ignored or rejected reason;
- timestamp basis.

Sensitive values are redacted by audience.

### Audit immutability

Audit and transition tables MUST deny update/delete to runtime roles. Periodic digest chains, write-once archive, or signed exports SHOULD detect tampering.

### Audit retention

Retention follows legal and platform policy. Security and integrity decisions generally require long-term retention. Personal fields are minimized or pseudonymized during privacy processing while preserving non-personal accountability.

### Observability metrics

Minimum metrics:

- Events received, processed, ignored, duplicate, retrying, quarantined;
- candidate count and predicate match rate;
- Objective mutations and completions;
- Quest Offers, accepts, activations, completions, failures, expiry, abandonment;
- aggregate conflict rate;
- inbox and outbox age;
- deadline lateness;
- projection freshness;
- Definition fingerprint mismatch;
- active Instances per Character distribution;
- exact-set size;
- backfill and migration throughput;
- integrity case count and age;
- privacy suppression latency.

Metrics MUST avoid unbounded Character or Instance labels.

### Structured logs

Logs contain opaque ids, reason codes, aggregate version, Event type, latency, and result. They exclude raw payloads, secret criteria, access tokens, and personal free text.

### Tracing

Distributed traces SHOULD connect source Event ingress through evaluation, database commit, outbox publication, and projection. Sampling policy retains errors, terminal outcomes, security events, and slow transactions at higher rates.

### Reconciliation audit

Every reconciliation run records:

- selection and invariant set;
- code and Definition version;
- start/end time;
- findings;
- automatic repairs;
- manual follow-up;
- checksum before/after.

### Compliance export

The Engine SHOULD support signed audit export by bounded realm, time range, Definition, Character pseudonym, or incident reference. Export access is privileged and audited.

---

## Edge Cases

### Duplicate source Event

The same Event id and payload arrives multiple times.

Expected behavior:

- inbox returns existing result;
- no duplicate evidence;
- no second progress mutation;
- no duplicate Objective or Quest completion Event;
- processing metrics count duplicate separately.

### Reused Event id with different payload

Expected behavior:

- reject and quarantine;
- do not mutate Quest state;
- emit critical security alert;
- preserve both observed hashes in restricted audit;
- require producer investigation.

### Same real-world fact with different Event ids

Transport idempotency cannot detect semantic duplicates with different ids. The source producer MUST provide a stable fact id or deduplication key when duplicates are possible. Quest Definition may use that registered fact id as contribution identity.

Without a trustworthy semantic key, the Engine processes each valid Event independently and cannot guess equivalence.

### Event arrives before Offer acceptance

Behavior follows `pre_acceptance_progress_policy`:

- `IGNORE` — no Contribution;
- `BUFFER` — retain bounded candidate until acceptance or Offer expiry;
- `ACCUMULATE` — apply to pre-active state and reveal on acceptance;
- `RETROACTIVE_WINDOW` — on acceptance, evaluate retained Event history within explicit lookback.

Default is `IGNORE`. Policy is immutable per Edition.

### Event occurs before acceptance but arrives after acceptance

Semantic eligibility uses Event `occurred_at`, not arrival time. Under default policy it is rejected as pre-acceptance even though delivered later.

### Event occurs before deadline but arrives during grace

Accept and process if schema, producer, semantic time, and grace policy pass.

### Event occurs after deadline but arrives before grace end

Reject for progress because grace covers delivery, not action time.

### Event occurs before deadline but arrives after grace

Reject from live processing. An approved correction or backfill may evaluate it later under explicit policy. It MUST NOT silently alter terminal history.

### Deadline timer fires before an in-flight qualifying Event is processed

The deadline timer first transitions the Instance to a deadline-pending reconciliation state internally or verifies inbox watermark according to partition contract. Final expiry occurs only after configured grace and Event-watermark safety.

If the Event was durably available before the grace end and meets semantic time, it must be considered.

### Completion and deadline have identical semantic timestamp

Definition must specify boundary inclusion. Default action window is half-open `[start, end)`: Event at exact `action_window_end` is late and does not count. A different policy requires explicit configuration and tests.

### Out-of-order counter Events

Counters are commutative. Process idempotently in any order, while `completedAt` is derived deterministically from the Event that first makes the ordered semantic evidence set satisfy the threshold.

### Out-of-order sequence Events

Use source sequence or declared ordering key. Events enter bounded reorder buffer. On buffer expiry, apply Definition late policy. Do not order by broker arrival.

### Source sequence gap

Sequence Objective waits within configured gap timeout. After timeout:

- remain blocked;
- reset;
- fail Objective;
- quarantine for missing source data;

according to immutable policy.

### Concurrent progress Events for one Instance

One transaction wins aggregate version. Losers reload and re-evaluate. Contributions remain unique. Completion is emitted once.

### Concurrent final Objective Events

Both may independently appear to complete the Quest from stale state. Unique terminal outcome and aggregate locking ensure one completion transaction; the other contributes or is recognized as already terminal according to Event ordering and post-terminal policy.

### Concurrent different Choice commands

Exactly one option commits. The other receives conflict. No branch nodes from the losing choice activate.

### Duplicate identical Choice command

Returns original successful result without new transition.

### Choice command races with Quest completion

If completion does not require the choice and commits first, later choice is rejected because Instance is terminal. If choice is required, completion cannot be true before choice commits.

### Choice branch receives Event before selection

Event is ignored or buffered only under explicit branch pre-buffer policy. Default is ignore because the branch was not active.

### Event qualifies multiple Objectives in one Quest

The same Event may contribute to multiple Objective nodes if Definition explicitly routes it to each. Evidence uniqueness is per Objective node. All mutations occur in one aggregate transaction where possible.

### Event qualifies multiple active Quests

It may contribute to each independently. Candidate fan-out budget and content policy apply. This is not a duplicate because Aggregates differ.

### One Objective completes multiple Stages through composites

Graph cascade executes deterministically in one transaction up to bounded cascade depth. All resulting Stage and terminal Events are written to outbox in transition order.

### Optional Objective completes after required completion

Default: incomplete optional nodes close when Quest completes, and later Events do not count.

If post-completion bonus window is enabled, bonus Objective state is modeled in a separate bounded bonus sub-lifecycle and MUST NOT change the already recorded main completion.

### Source correction before Objective completion

Reverse or supersede Contribution, recompute exact state, append correction transition, and emit `quest.progress.corrected.v1` when externally relevant.

### Source correction after Objective completion but before Quest completion

If Objective type and policy are reversible, reopen Objective and close downstream nodes that have no independent valid support. Recompute graph deterministically. Choices already committed remain immutable; if correction makes chosen branch impossible, open integrity/repair case rather than silently selecting another branch.

### Source correction after Quest completion

Do not reopen ordinary lifecycle. Open or update integrity case. Public recognition and downstream revocation review follow integrity policy.

### Correction arrives before original Event

Store bounded pending correction keyed by original Event id. When original arrives, apply corrected semantics directly. If original never arrives, expire pending correction under retention policy with audit.

### Multiple corrections for one source fact

Require monotonic correction sequence or trusted replacement chain. Process latest valid sequence exactly once. Conflicting branches quarantine.

### Character suspended while active

Apply Edition suspension policy atomically after lifecycle Event. New progress is blocked. Deadline freeze or continuation is persisted.

### Character restored after deadline

If timers continued during suspension, reconcile and expire/fail as appropriate. If frozen, compute new deadline from persisted remaining duration, not current Edition policy.

### Character anonymized while completion Event remains downstream

Quest Engine removes personal projections and minimizes evidence. Downstream Events retain pseudonymous Character id only under platform policy. Public recognition is purged.

### Character ownership changes or account merge

Character id remains stable. User ownership is resolved by Character Engine; Quest Aggregate does not change identity. Command authorization uses current owner.

### Edition paused while Event arrives

Behavior follows explicit pause policy. Event is never silently lost: process, buffer, ignore with durable reason, or quarantine.

### Edition resumed after long pause

Resume timers from persisted policy. Buffered Events are replayed in semantic order with original ids. Existing Instances retain Definition fingerprint.

### Edition closed with active Instances

Apply close policy per Instance idempotently. New Offers and Instances stop immediately. Closure job is resumable.

### Edition quarantined after suspected exploit

Stop affected evaluation, preserve inbox Events, suppress broad completion publication if policy requires, and open incident. Do not delete existing state.

### Definition artifact differs across regions

Fingerprint mismatch blocks evaluation for that Definition in the divergent region and alerts. It does not fall back to another version.

### New Definition Version published while Instance active

Existing Instance remains on old version. New Instances route to new Edition/version according to release policy.

### Migration node removed

Migration plan must map old node to target node, preserve as historical completed/closed state, or declare deterministic discard. Missing mapping blocks migration.

### Migration changes threshold below current progress

Dry run identifies immediate completion. Publication policy must state whether migration may complete Quests and emit downstream Reward triggers. Default is no automatic terminal completion without explicit approval.

### Migration changes branch structure after choice

Only compatible branch mapping is allowed. If selected option has no target equivalent, Instance cannot be auto-migrated.

### Daily recurrence during daylight-saving spring forward

Occurrence boundaries use IANA zone rules and stored tzdb version. Missing local hour does not create a shorter logical identity ambiguity.

### Daily recurrence during daylight-saving fall back

Repeated local hour belongs to one calendar day occurrence. Occurrence key is date-based, not ambiguous local timestamp.

### Character changes time zone mid-Quest

Default: time zone is snapshotted at activation for that Instance and recurrence. Future Occurrences may use new time zone. Dynamic time-zone policy requires explicit anti-abuse rules.

### Monthly recurrence on day 31

Policy must specify `LAST_VALID_DAY`, `SKIP_MONTH`, or fixed UTC schedule. Publication rejects ambiguity.

### Leap day recurrence

Policy must explicitly define non-leap-year behavior.

### Season closes before Quest deadline

Season close policy on Edition wins and is snapshotted. It may expire, fail, grace, or detach.

### Eligibility projection stale

Offer/accept/activation commands return pending or fail closed. Ordinary active progress may continue only if policy allows and Character lifecycle projection is still within safety threshold.

### Prerequisite lost after activation

Apply declared policy. Default is ignore after start. Continuous-gate Quests may pause or fail, but behavior must be visible and deterministic.

### Achievement prerequisite invalidated after Quest completion

Quest history does not automatically change. If prerequisite integrity is declared continuing and critical, open Quest integrity case.

### Item ownership prerequisite with concurrent removal

Snapshot-based eligibility is eventually consistent. If true atomic possession or consumption is required, use owning Engine reservation protocol; otherwise publication must warn that the condition is snapshot-based.

### Bulk assignment rerun

Per-Character request identity and Instance uniqueness return prior results. No duplicate Offers or Instances.

### Bulk assignment partially fails

Job records per-Character result, retries retryable failures, and resumes cursor. Successful assignments are not rolled back solely because others failed.

### Backfill completes historical Quests

Completion Event and Reward trigger policy are explicit. Default backfill may reconstruct history without publishing Reward-triggering events to broad topics.

### Reward Engine unavailable

Quest completion commits and outbox retries publication. Quest is not reopened. User UX may show Reward pending after Reward projection becomes available.

### Outbox broker acknowledgement lost

Publisher retries same outbox Event id. Consumers deduplicate.

### Projection update fails

Authoritative state remains correct. Projection retries or rebuilds. Command response returns aggregate version and pending projection hint.

### Database commit succeeds but API response is lost

Client retries with same idempotency key and receives original result.

### Database failover during transaction

Uncommitted transaction retries from immutable input. Committed transaction is detected through inbox/idempotency and aggregate state.

### Timer fires twice

Unique timer generation and terminal state make second firing no-op with audit result.

### Old superseded timer fires

Expected generation mismatch causes no state mutation.

### Clock skew between workers

Database or trusted time service determines due evaluation. Worker-local clock is not authoritative. Drift alerts fire.

### Counter overflow

Publication validates practical bounds. Runtime checked arithmetic quarantines instead of wrapping.

### Decimal scale mismatch

Reject Event contribution or Definition publication; never silently round beyond declared policy.

### Distinct-key hash collision

Use collision-resistant keyed digest and type discriminator. If original encrypted canonical values are retained for collision resolution, compare them. A suspected collision triggers reconciliation rather than incorrect completion.

### Exact-set cardinality limit reached

Stop contribution for affected Objective, quarantine Definition/Instance, and alert. Do not switch to approximate counting for authoritative completion.

### Invalid localization asset

Runtime falls back only to an approved locale chain. Missing required locale blocks release. Secret content must not fall back to a string that reveals criteria.

### Public cache contains now-invalid completion

Integrity change triggers purge. Until purge confirmation, public endpoint applies authoritative suppression overlay or fail-closed policy.

### Search index lag exposes retired Edition

Query-time Edition lifecycle filter prevents discovery even if index document is stale.

### Unauthorized user probes secret Quest id

Return indistinguishable not-found behavior, do not reveal eligibility, and record abuse telemetry at aggregate-safe rate.

### Support agent attempts manual counter edit

Operation does not exist. Support may request source correction, replay, reconciliation, or integrity review.

### Quest completes with no configured Reward

Valid. Completion is meaningful independently of Reward.

### Reward configured twice for same completion

Reward Engine Trigger Binding and idempotency own prevention. Quest Engine publishes one completion Event and does not infer duplicate Reward policy.

### Quest completion triggers Achievement that unlocks another Quest

Allowed if global dependency graph is acyclic and cascade depth bounded. Each Engine processes asynchronously with its own idempotency.

### Campaign graph has a cycle

Publication rejected.

### Campaign prerequisite Event arrives before campaign projection

Event is retained through normal Quest history. Campaign projection catches up idempotently and releases next Quest once.

### Terminal Event consumers request full hidden path

Only restricted schema/topic may include hidden path, and authorization is producer/consumer allowlist-based. Broad topic remains redacted.

### Free-form user feedback contains sensitive data

Store outside core Aggregate under separate retention and access policy, or reject free-form text. Never include it in Events or logs.

### Malformed Event causes repeated failure

Bounded retries, then quarantine with reason. Other Events continue.

### One Definition causes excessive fan-out

Automatic circuit breaker pauses or quarantines Definition, preserves Events according to policy, and alerts owner team.

### Reconciliation finds outcome without outbox Event

Create deterministic missing outbox Event using original aggregate version and Event id derivation, then publish. Repair is audited.

### Reconciliation finds outbox completion without terminal row

Critical invariant violation. Stop affected partition, quarantine Event publication if not already sent, and require incident repair. Do not fabricate terminal state without evidence.

### Restore from backup reintroduces erased Character projections

Restore pipeline reapplies privacy tombstone log before serving traffic or rebuilding public indexes.

---

## Acceptance Tests

The following tests are minimum production acceptance criteria. They are normative behavior tests, not an exhaustive unit-test inventory.

### Definition and publication

1. Creating a Definition draft produces no runtime-active content.
2. Two Definitions in the same realm and namespace cannot share a Quest key.
3. The same Quest key may exist in a different realm only when realm policy allows independent namespaces.
4. Publishing creates an immutable Definition Version.
5. Runtime roles cannot update a published canonical document.
6. Changing one predicate creates a different Definition fingerprint.
7. Canonical-equivalent JSON ordering produces the same fingerprint.
8. Publication fails for an unknown Event schema.
9. Publication fails for an unauthorized Event producer.
10. Publication fails for an incompatible payload field type.
11. Publication fails for a graph cycle.
12. Publication fails for an unreachable required Objective.
13. Publication fails for a non-terminal dead end.
14. Publication fails for ambiguous recurrence time zone.
15. Publication fails when deadline precedes activation.
16. Publication fails when grace ends before deadline.
17. Publication fails for floating-point authoritative arithmetic.
18. Publication fails for arbitrary script or SQL content.
19. Publication fails when graph complexity exceeds configured budget.
20. Publication fails when exact-distinct target exceeds limit without approval.
21. Publication fails for a Quest/Achievement dependency cycle.
22. Publication fails when secret criteria appear in public localization.
23. Publication records reviewer and publisher separately for high-risk content.
24. Retiring a Definition Version does not alter existing Instances.
25. A quarantined Definition cannot evaluate new Events.

### Edition and occurrence

26. Creating an Edition requires a published Definition Version.
27. Activating an Edition requires validated recurrence and availability.
28. Scheduled activation occurs once under duplicate timer delivery.
29. Pausing an Edition stops new Offers according to policy.
30. Pausing an Edition preserves existing Definition binding.
31. Resuming an Edition does not replay ignored Events unless policy buffered them.
32. Closing an Edition prevents new Instances.
33. Existing Instances follow immutable close policy.
34. Retired Edition cannot be reactivated.
35. `ONCE` recurrence creates one deterministic occurrence.
36. Daily recurrence creates one occurrence per configured calendar date.
37. Weekly recurrence uses configured week standard and time zone.
38. DST spring-forward day produces one daily occurrence.
39. DST fall-back day produces one daily occurrence.
40. Monthly day-31 policy behaves exactly as configured.
41. Duplicate occurrence generation returns existing occurrence.
42. Occurrence generation fingerprint mismatch quarantines the schedule.
43. Event-keyed occurrence uses trusted stable event key.
44. Character time zone snapshot remains unchanged for active Instance.
45. Future occurrence may use changed Character time zone according to policy.

### Offers, assignment, and eligibility

46. An eligible Character receives one Offer for the uniqueness key.
47. Duplicate Offer request returns the existing Offer.
48. Same request id with different payload is rejected.
49. Ineligible Character does not receive an active Offer.
50. Hidden prerequisite is not disclosed in rejection response.
51. Suspended Character cannot receive a new Offer.
52. Closed Character cannot receive a new Offer.
53. Stale Character lifecycle projection fails closed.
54. Offer expiration transitions exactly once.
55. Expired Offer cannot be accepted.
56. Concurrent accepts create one active Instance.
57. Retried acceptance returns the original result.
58. Declined Offer remains historically declined.
59. Withdrawn Offer cannot be accepted.
60. Auto-start assignment activates only after eligibility passes.
61. Scheduled assignment does not progress before activation by default.
62. Explicit assignment cannot override Edition participation mode without permission.
63. Concurrency limit blocks excess active Quest acceptance.
64. Exclusivity group prevents conflicting active Instances.
65. Losing prerequisite before acceptance causes authoritative recheck failure.
66. Default prerequisite loss after activation does not cancel the Quest.
67. Continuous prerequisite policy pauses or fails exactly as configured.
68. Bulk assignment is idempotent per Character.
69. Partial bulk failure resumes without duplicating successful assignments.
70. Assignment audit includes source reference and actor.

### Instance lifecycle

71. A Quest Instance binds exactly one Character.
72. Definition Version and Edition references are immutable in normal processing.
73. Aggregate version increments exactly once per mutation.
74. Unspecified lifecycle transition is rejected.
75. Active Quest can be paused only by authorized policy.
76. Paused Quest resumes using persisted timer policy.
77. Owner may abandon only when Edition allows it.
78. Abandoning a terminal Quest is rejected.
79. Cancellation records non-user-failure reason.
80. A Quest Instance records at most one terminal outcome.
81. Completed Quest cannot later become ordinarily failed.
82. Failed Quest cannot later become ordinarily completed.
83. Terminal outcome and outbox Event commit atomically.
84. Reward failure does not change Quest lifecycle.
85. Projection failure does not roll back terminal state.

### Objective routing and progress

86. Non-matching Event produces no Contribution.
87. Matching Event affects only candidate active Objective nodes.
88. Locked Objective ignores Event by default.
89. Same Event id contributes at most once to one Objective.
90. Same Event may contribute to two explicitly configured Objectives.
91. Same Event may contribute to separate active Quest Instances.
92. Reused Event id with changed payload quarantines processing.
93. Counter increments use checked integer arithmetic.
94. Counter completion occurs at target.
95. Presentation clamps overage when configured.
96. Overage is retained only when configured.
97. Accumulation uses declared fixed decimal scale.
98. Scale mismatch is rejected without mutation.
99. Maximum Objective retains qualifying Event reference.
100. Minimum Objective retains qualifying Event reference.
101. Boolean latch completes on first valid match.
102. Exact distinct duplicate does not increase cardinality.
103. Exact distinct new key increases cardinality once.
104. Approximate sketch is never used for completion.
105. Distinct cardinality limit breach quarantines rather than approximates.
106. Snapshot predicate evaluates at declared lifecycle point.
107. Composite `ALL` completes only when all children complete.
108. Composite `ANY` completes when first child completes.
109. `AT_LEAST_N` uses exact child states.
110. Hidden Objective progresses without leaking criteria.
111. Optional Objective does not block Quest completion.
112. Required Objective blocks completion until satisfied.
113. Bonus Objective follows post-completion policy.
114. Objective progress Event suppression does not remove authoritative history.
115. Explanation identifies accepted source Event and Contribution.

### Sequence and streaks

116. In-order sequence Events advance cursor.
117. Duplicate sequence Event does not advance twice.
118. Out-of-order sequence Event enters bounded buffer.
119. Missing sequence gap follows configured timeout policy.
120. Non-match follows configured reset policy.
121. Sequence cannot use broker arrival as authoritative order when source order is declared.
122. Calendar streak uses snapshotted time zone.
123. Multiple qualifying Events in one period count according to period policy.
124. Late Event before period deadline updates streak within grace.
125. Event after semantic period end does not count merely because it arrived during grace.
126. DST transition does not create duplicate period keys.
127. Allowed missed-period policy is applied exactly.
128. Streak correction recomputes exact affected run.

### Stages, branches, and choices

129. Entry Stage activates when Quest activates.
130. Completing required Objectives completes the Stage.
131. Stage completion activates reachable next nodes atomically.
132. Graph cascade respects maximum depth.
133. Unselected mutually exclusive branch becomes skipped or closed.
134. Explicit Choice exposes only allowed options.
135. Valid Choice commits once.
136. Duplicate identical Choice returns original result.
137. Concurrent different Choices yield one winner.
138. Losing Choice activates no nodes.
139. Hidden branch identifier is absent from unauthorized response.
140. Event before branch activation is ignored by default.
141. Auto-branch predicate selects deterministically.
142. First-completed branch uses deterministic evidence order.
143. Choice remains immutable after downstream progress.
144. Correction that invalidates chosen prerequisite opens repair/integrity flow.
145. Every reachable path terminates according to compiled graph.

### Timing and deadlines

146. Action Event before start is rejected by default.
147. Event at exact inclusive start is accepted.
148. Event before exclusive deadline is accepted.
149. Event at exact exclusive deadline is rejected.
150. Event before deadline arriving during grace is accepted.
151. Event after deadline arriving during grace is rejected.
152. Event before deadline arriving after grace is rejected from live processing.
153. Duplicate deadline timer has one logical effect.
154. Superseded timer cannot mutate Instance.
155. Scheduler recovery processes missed timers idempotently.
156. Freeze policy stores remaining duration.
157. Resume calculates deadline from stored remaining duration.
158. Continue policy allows deadline to expire during suspension.
159. Grace is not displayed as action time.
160. Completion/deadline race resolves by declared semantic ordering.
161. Expiry waits for configured Event watermark/grace safety.
162. Timer failure is retried without duplicate terminal outcome.

### Completion, failure, and downstream Events

163. Satisfying completion plan creates one completion record.
164. `quest.completed.v1` includes exact Instance, Edition, occurrence, fingerprint, and aggregate version.
165. Completion Event excludes Reward fulfillment state.
166. Completion is valid when no Reward is configured.
167. Reward Engine unavailability does not block completion.
168. Objective completion Event precedes Quest completion Event in aggregate transition order.
169. Failure predicate creates one failure record.
170. Expiry creates one expiry record after grace policy.
171. Abandonment creates one abandonment outcome.
172. Cancellation creates one cancellation outcome.
173. Cancellation is not presented as Character failure.
174. Completion path matches committed branch.
175. Secret completion path is redacted on broad topic.
176. Achievement Engine can consume completion idempotently.
177. Campaign dependency releases next Quest once.
178. Global dependency cycle is rejected before activation.

### Corrections and integrity

179. Correction before completion reverses exact Contribution.
180. Correction can reopen reversible Objective before terminal outcome.
181. Correction recomputes downstream Stage state deterministically.
182. Correction after Quest completion does not delete completion.
183. Post-completion contradiction opens integrity workflow.
184. Contest status can suppress public projection.
185. Invalidation preserves original completion record and Event.
186. `quest.integrity.invalidated.v1` references exact completion.
187. Reward reversal is not performed directly by Quest Engine.
188. Restoration appends a new integrity transition.
189. Correction arriving before original Event is retained and later applied.
190. Conflicting correction sequence quarantines the fact.
191. Integrity invalidation requires approved role and reason.
192. High-risk invalidation requires dual control.
193. Support cannot edit progress directly.

### Idempotency and concurrency

194. Duplicate Event delivery has one logical effect.
195. Duplicate timer delivery has one logical effect.
196. Duplicate command with same request hash returns original result.
197. Same idempotency key with different request hash is rejected.
198. Concurrent final Contributions produce one terminal outcome.
199. Aggregate conflict reloads and re-evaluates immutable input.
200. API response loss followed by retry returns committed result.
201. Broker acknowledgement loss republishes same outbox Event identity.
202. Database failover does not create duplicate evidence.
203. Database failover does not create duplicate completion.
204. Inbox processed state and aggregate mutation are atomic.
205. Outbox row and aggregate mutation are atomic.

### Security

206. Unauthorized owner command is denied.
207. User cannot operate another User’s Character.
208. Cross-realm identifier is rejected.
209. Unknown producer cannot contribute progress.
210. Producer cannot impersonate another Event type authority.
211. Secret Quest probing does not reveal existence.
212. Secret criteria are absent from public API, logs, traces, cache, and client bundle.
213. Definition artifact fingerprint mismatch blocks evaluation.
214. Arbitrary executable code is rejected at publication.
215. Request body and expression complexity limits prevent resource abuse.
216. Privileged publication requires MFA and scoped role.
217. Break-glass pause is audited and expires.
218. Evidence export requires elevated scope and audit.
219. Choice option not in server allowlist is rejected.
220. Client-reported Objective completion is never authoritative.

### Privacy

221. Active Quest progress is owner-only by default.
222. Public completion requires both Edition and Character visibility permission.
223. Invalidated completion is removed from public projection.
224. Character anonymization removes owner and public projections.
225. Restore workflow reapplies privacy tombstones before serving traffic.
226. Raw source payload is not copied when extracted values suffice.
227. Distinct social key uses protected digest.
228. Data export contains Character Quest history without other Characters’ personal data.
229. Secret anti-fraud or Objective criteria are excluded from export.
230. Logs contain no sensitive evidence values.
231. Cache keys separate owner and public viewer classes.
232. Minor profile does not expose active Quest progress publicly.
233. Privacy suppression meets configured SLO.

### Performance and resilience

234. Candidate routing avoids scanning all Definitions.
235. One malformed Event does not stop unrelated partitions.
236. One faulty Definition can be paused independently.
237. Live workload retains priority over backfill.
238. Backfill auto-pauses under live latency threshold breach.
239. Deadline burst remains within tested lateness SLO.
240. Hot Character fan-out is bounded.
241. Exact distinct storage remains within published bound.
242. Projection rebuild does not re-emit completion Events.
243. Search-index lag cannot expose closed or secret Edition due to query-time filter.
244. Outbox backlog drains without duplicate consumer effects.
245. Regional failover verifies Definition fingerprints before processing.
246. Restore rehearsal preserves occurrence uniqueness and timer generations.

### Administration and operations

247. Author cannot publish own high-risk Quest without required approval.
248. Semantic diff identifies threshold and graph changes.
249. Simulation produces no production mutations or Events.
250. Bulk assignment dry run reports eligible, duplicate, and blocked counts.
251. Migration dry run identifies immediate terminal outcomes.
252. Migration cannot move terminal Instances in place.
253. Migration with incomplete node mapping is rejected.
254. Reconciliation detects missing outbox Event.
255. Approved repair creates deterministic missing outbox Event.
256. Reconciliation treats outbox completion without terminal row as critical incident.
257. Projection rebuild preserves privacy and integrity suppression.
258. Edition emergency pause records exact sub-policies applied.
259. Definition quarantine preserves inbox Events according to incident policy.
260. All administrative mutations include actor, reason, correlation, and audit record.

### End-to-end scenarios

261. An eligible Character accepts an offered linear Quest, completes all Objectives through source Events, receives one `quest.completed.v1`, and Reward Engine may fulfill independently.
262. A repeatable weekly Quest creates separate Instances for two occurrence keys and preserves both histories.
263. A branching Quest records one Character choice, closes the alternate branch, completes the selected path, and publishes one completion.
264. A source Event duplicated five times produces one Contribution.
265. Two final Events delivered concurrently produce one completion and consistent Objective history.
266. A qualifying Event delivered after deadline but within grace counts only when its semantic time is before deadline.
267. A Character suspended mid-Quest resumes with correctly frozen remaining time.
268. A completed Quest later invalidated by source correction remains historically completed but loses valid recognition through integrity status.
269. A hidden Quest can progress and complete without leaking criteria before configured reveal.
270. A mass backfill reconstructs history under rate limits without starving live Events or unexpectedly granting Rewards.

Production release requires all applicable tests above, schema migration tests, load tests, failover tests, privacy review, security review, and operational runbook rehearsal.

---

## Future Extensions

The following extensions are intentionally deferred and MUST require new RFCs or explicit versioned additions.

### Cooperative Quests

Multi-Character, team, guild, or household Quests require a new aggregate ownership model, contribution attribution, membership changes, privacy policy, concurrency strategy, and Reward allocation semantics.

### Competitive Quests

Ranked races, first-to-complete, and limited-winner Quests require authoritative competition state and likely a separate Competition Engine. They MUST NOT be approximated with per-Character Quest state alone.

### Procedural Quest generation

Generated Quests require signed generation manifests, bounded templates, reproducibility, safety review, localization, and deterministic fingerprints. Arbitrary AI-generated runtime rules are prohibited without a dedicated design.

### Adaptive difficulty

Future Editions may select among pre-published difficulty variants using transparent policy. Existing Instance thresholds must remain immutable.

### Dynamic branching from narrative service

A future Narrative Engine may provide approved branch content, but Quest graph authority and deterministic version binding must remain explicit.

### Offline trusted commands

Offline acceptance or choices require signed client commands, replay protection, clock policy, and conflict UX.

### Consumptive Objectives

Item or Currency consumption requires a reservation/commit protocol with the owning Engine and saga semantics. Snapshot ownership is insufficient.

### Location-based Quests

Require privacy-preserving geofencing facts produced by a trusted service, anti-spoofing controls, minor safety, and regional legal review.

### Campaign Engine extraction

If Campaign orchestration grows beyond bounded Quest sequencing, it may become a separate Engine. Quest Engine contracts should allow extraction without changing Quest Instance identity.

### Quest templates and inheritance

Authoring-time templates may reduce duplication. Published runtime Definitions must remain fully resolved and immutable; runtime inheritance is discouraged.

### Post-completion bonus tracks

May be modeled as separate linked Quests or a versioned bonus sub-aggregate. They must not mutate the original completion fact.

### Shared organization assignments

Institutional mandatory assignments require organization-role policy, due-date governance, consent, accessibility, and reporting boundaries without making Quest Engine an LMS.

### Advanced temporal logic

More complex temporal predicates require bounded deterministic semantics and cost analysis. General complex-event processing remains out of scope.

### Verifiable credentials

Quest completion may later issue or support verifiable credentials through a separate credential service. Quest Engine would publish completion evidence references, not manage cryptographic credential lifecycle.

### Federated platform Events

Cross-platform Quest participation requires trust federation, Event provenance, realm mapping, privacy agreements, and conflict policy.

### Personal Quest authoring

User-created Quests require moderation, sandboxed schemas, visibility controls, abuse prevention, and separation from platform-certified content.

---

## ADR References

The following ADRs are required or recommended. Existing repository numbering MUST be used when ADR files are created; identifiers below describe subjects rather than reserving final numbers.

- **Platform First** — core Engines remain independent from School and future Modules.
- **Event-Driven Engine Integration** — immutable Events are the only normal cross-Engine mutation trigger.
- **Platform-Owned Character** — Quest Instances reference platform Character identity.
- **Single Writer per Aggregate** — Quest Engine exclusively owns Quest state.
- **Immutable Published Configuration** — published Definition versions are never edited in place.
- **Transactional Inbox and Outbox** — at-least-once transport with exactly-once logical effect.
- **Quest Completion and Reward Decoupling** — completion is independent from Reward fulfillment.
- **Quest versus Achievement Semantics** — directed activity and permanent milestone remain separate domains.
- **Finite Acyclic Quest Graphs** — no runtime loops in v1.
- **Repeatability through Occurrences** — repeated Quests create new Instances instead of resetting state.
- **Semantic Time and Late-Arrival Grace** — occurred-at governs action validity; grace governs delivery.
- **Exact Authoritative Progress** — no floating point or approximate distinct count for completion.
- **Character Lifecycle Fail-Closed Projection** — unsafe or stale lifecycle data blocks progression.
- **Hidden Content Server-Side Enforcement** — secrecy is a projection and security concern, not client convention.
- **Terminal History Preservation** — corrections use integrity state rather than deletion.
- **Cross-Engine Dependency Graph Governance** — Quest, Achievement, Reward, and Campaign cycles are prohibited.
- **Bulk Jobs as Resumable Sagas** — assignment, backfill, and migration use bounded idempotent jobs.
- **Privacy Tombstones on Restore** — backups cannot resurrect erased projections.

---

## Appendix

### Appendix A — Example linear Quest Definition

```json
{
  "schema": "quest-definition.v1",
  "questKey": "foundation.weekly-practice",
  "participationMode": "OFFER_AND_ACCEPT",
  "eligibility": {
    "all": [
      {"fact": "character.lifecycle", "operator": "EQ", "value": "ACTIVE"},
      {"fact": "progression.foundation.level", "operator": "GTE", "value": 2}
    ]
  },
  "timing": {
    "startBasis": "ACCEPTANCE_TIME",
    "duration": "P7D",
    "deadlineBoundary": "EXCLUSIVE",
    "lateArrivalGrace": "P1D",
    "suspensionPolicy": "FREEZE"
  },
  "graph": {
    "entry": ["practice"],
    "stages": [
      {
        "stageKey": "practice",
        "completion": {"operator": "ALL", "objectives": ["attend-3", "reflect"]},
        "objectives": [
          {
            "objectiveKey": "attend-3",
            "type": "EVENT_COUNT",
            "requiredRole": "REQUIRED",
            "event": {
              "schemaId": "lesson.completed.v1",
              "producer": "school-module",
              "predicate": {
                "path": "payload.result",
                "operator": "EQ",
                "value": "COMPLETED"
              }
            },
            "target": 3,
            "deduplicationPath": "payload.lessonParticipationId"
          },
          {
            "objectiveKey": "reflect",
            "type": "BOOLEAN_LATCH",
            "requiredRole": "REQUIRED",
            "event": {
              "schemaId": "reflection.submitted.v1",
              "producer": "school-module"
            }
          }
        ],
        "next": ["success"]
      }
    ],
    "terminals": [
      {"nodeKey": "success", "outcome": "COMPLETED"}
    ]
  },
  "visibility": {
    "discoverability": "MEMBERS",
    "objectives": "OWNER_ONLY",
    "completion": "OWNER_ONLY"
  }
}
```

The example contains School Event names only in configuration. Engine code remains domain-agnostic.

### Appendix B — Example branching Quest

```json
{
  "questKey": "path.choose-specialization",
  "graph": {
    "entry": ["foundation"],
    "stages": [
      {
        "stageKey": "foundation",
        "objectives": [
          {
            "objectiveKey": "complete-basics",
            "type": "EVENT_COUNT",
            "target": 5,
            "event": {"schemaId": "practice.completed.v1"}
          }
        ],
        "next": ["choose-path"]
      }
    ],
    "choices": [
      {
        "choiceKey": "choose-path",
        "irreversible": true,
        "options": [
          {"optionKey": "technical", "next": "technical-stage"},
          {"optionKey": "leadership", "next": "leadership-stage"}
        ]
      }
    ],
    "terminals": [
      {"nodeKey": "technical-success", "outcome": "COMPLETED"},
      {"nodeKey": "leadership-success", "outcome": "COMPLETED"}
    ]
  }
}
```

### Appendix C — Evaluation pseudocode

```text
handleSourceEvent(event):
    validateEnvelope(event)
    inbox = registerInbox(event.id, hash(event.payload))
    if inbox.isDuplicate:
        return inbox.previousResult

    updateLocalPrerequisiteProjectionIfApplicable(event)
    candidates = routeCandidates(event.type, event.realm, event.subject)

    for each candidate ordered by questInstanceId:
        retryOnConflict:
            aggregate = loadAggregate(candidate.questInstanceId)
            plan = loadPlan(aggregate.definitionFingerprint)

            if not characterStateSafe(aggregate.characterId):
                recordIgnored(candidate, BLOCKED_CHARACTER_STATE)
                continue

            if not instanceAcceptsEvent(aggregate, event, plan.timePolicy):
                recordIgnored(candidate, INACTIVE_OR_OUTSIDE_WINDOW)
                continue

            mutations = evaluateActiveObjectives(plan, aggregate, event)
            if mutations.isEmpty:
                continue

            begin transaction
                verifyInboxPayload(event)
                lockAggregateAtVersion(aggregate.version)
                insertEvidenceRegistryRows(mutations)
                applyObjectiveMutations(mutations)
                cascadeGraph(plan)
                resolveTerminalOutcome(plan)
                appendTransitions()
                upsertTimers()
                insertOutboxEvents()
                incrementAggregateVersion()
                markInboxCandidateProcessed()
            commit

    markInboxProcessed(event.id)
```

Physical implementation may process candidates in separate transactions, but inbox candidate state must make retries complete and observable.

### Appendix D — Completion-time derivation

For ordinary monotonic Objectives:

1. order accepted required evidence by declared semantic ordering;
2. identify the evidence or command transition that first makes the full completion expression true;
3. set `completed_at` to that transition’s semantic timestamp;
4. set `recorded_at` to commit time;
5. retain the evidence frontier hash.

For snapshot gates evaluated after all Event Objectives, completion time is the later of the final required evidence semantic time and the authoritative snapshot Event time that made the gate true.

### Appendix E — Error response

```json
{
  "error": {
    "code": "AGGREGATE_VERSION_CONFLICT",
    "message": "The quest changed before this action was applied.",
    "retryable": true,
    "correlationId": "uuid",
    "details": {
      "currentAggregateVersion": 9
    }
  }
}
```

Hidden-resource errors omit details that reveal existence.

### Appendix F — Operational dashboards

Minimum dashboards:

1. Event ingress by producer and type.
2. Candidate fan-out and predicate match rate.
3. Objective mutation and completion latency.
4. Quest Offer and acceptance funnel.
5. Active Instances and concurrency distribution.
6. Completion, failure, expiry, abandonment, cancellation.
7. Branch and choice distribution.
8. Inbox and outbox backlog age.
9. Deadline scheduler lateness and retry rate.
10. Projection freshness and cache purge status.
11. Definition fingerprint consistency by region.
12. Quarantine by Definition, producer, and reason.
13. Exact-set and evidence storage growth.
14. Backfill/migration throughput and live-workload impact.
15. Integrity cases and public suppression lag.
16. Character lifecycle projection staleness.
17. Secret-content exposure canaries.

### Appendix G — Alerts

Critical alerts:

- duplicate terminal outcome invariant violation;
- completion outbox without terminal outcome;
- terminal outcome without completion outbox beyond transaction/reconciliation threshold;
- Event id payload mismatch;
- Definition fingerprint mismatch;
- secret content exposure canary;
- cross-realm access anomaly;
- scheduler lateness above SLO;
- inbox or outbox age above SLO;
- privacy suppression lag;
- exact-set cardinality breach;
- candidate fan-out anomaly;
- database partition capacity;
- audit append failure;
- bulk assignment anomaly;
- Character lifecycle projection stale beyond safety threshold.

### Appendix H — Runbook index

Required runbooks:

- pause or quarantine faulty Definition;
- pause Edition without losing Events;
- quarantine compromised producer;
- drain inbox backlog;
- repair outbox publication;
- recover deadline scheduler;
- process missed deadlines after outage;
- resolve Event id payload conflict;
- reconcile one Quest Instance;
- repair missing outbox Event;
- rebuild owner and public projections;
- purge secret/public cache;
- open and resolve integrity case;
- pause and resume bulk assignment;
- pause and resume backfill;
- perform Definition migration;
- recover from database failover;
- restore backup with privacy tombstones;
- verify regional Definition fingerprints;
- execute Character anonymization propagation;
- investigate suspected duplicate Reward trigger.

### Appendix I — Glossary distinctions

| Term | Distinction |
|---|---|
| Quest | Directed bounded activity with Objectives and lifecycle |
| Achievement | Permanent recognition of a milestone |
| Reward | Positive outcome decided and coordinated by Reward Engine |
| Objective | One measurable requirement inside a Quest |
| Stage | Narrative/graph grouping of nodes |
| Campaign | Long-form graph of Quest references |
| Offer | Invitation to participate |
| Assignment | Trusted request to create participation |
| Occurrence | One deterministic repetition window |
| Quest Instance | One Character’s authoritative participation in one occurrence |
| Completion | Terminal successful Quest outcome |
| Integrity status | Trust assessment of historical outcome |

### Appendix J — Document completion criteria

This RFC is complete when implementation teams can answer without undocumented assumptions:

- who owns Quest state;
- how a source Event becomes Objective progress;
- how Offers, assignments, acceptance, and activation differ;
- how Definitions and Editions are versioned;
- how graph, branches, and choices execute;
- how repeatability creates Occurrences and Instances;
- how deadlines and late Events behave;
- how duplicates and concurrency are handled;
- how completion triggers but does not own Rewards;
- how Quest differs from Achievement;
- how corrections work before and after completion;
- how hidden content remains secret;
- how Character lifecycle affects participation;
- how the database enforces one terminal outcome;
- how users, support, authors, security, and privacy teams inspect behavior;
- how the service scales, fails over, and recovers;
- which tests prove production readiness.

> A Quest is not a mutable checklist. It is a versioned, explainable journey whose every step is grounded in real Events.
