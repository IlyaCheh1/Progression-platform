---
document: 005-reward-engine
title: Reward Engine
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
related_documents:
  - 006-achievement-engine
  - 007-quest-engine
  - 008-talent-engine
  - 009-item-engine
  - 010-inventory-engine
  - 011-season-engine
---

# Reward Engine

> **Platform contract conformance:** the canonical fulfillment and reversal
> wire contracts are defined by `002a-platform-contract-standard` and
> `002b-cross-engine-integration`. Owner-specific payloads may extend only the
> registered `componentPayload` and `outcome` fields.

## Executive Summary

The Reward Engine is the authoritative platform component for deciding, recording, coordinating, and explaining Rewards granted to a Character.

A Reward is a first-class platform decision, not an incidental side effect of another Engine. Business Modules and platform Engines publish immutable Events. Versioned Reward Policies may map eligible Events to Reward Definitions, while trusted producers may explicitly request a known Reward Definition. The Reward Engine validates the request, resolves the exact immutable definition version, evaluates only reward-specific eligibility and repeatability rules, creates one durable Reward Grant, and coordinates fulfillment by the Engines that own the affected state.

The Reward Engine does **not** write Experience, Levels, Prestige, Items, Inventory, Currency balances, Reputation, Talents, Skills, Titles, cosmetics, or any other foreign aggregate. Those values remain owned by their respective Engines. The Reward Engine publishes typed `reward.fulfillment.requested.v1` Events. Each target Engine applies its own component using the shared grant and fulfillment identifiers, then publishes the canonical typed success or failure result. The Reward Engine aggregates those results into the final Reward Grant state.

This separation preserves the platform rule that one Engine owns one class of state. It also acknowledges a fundamental distributed-systems constraint: a multi-component Reward cannot be committed atomically across independent services by a single local database transaction. The Engine therefore implements a durable, replay-safe saga with explicit partial states, retries, compensation or reversal where supported, and complete audit history. It MUST NOT conceal partial fulfillment behind a misleading `reward.granted` Event.

The Engine supports both automatic and claim-required Rewards, immutable versioned definitions, bundles of typed components, deterministic bounded expressions, source-event bindings, eligibility conditions evaluated from immutable context or local projections, repeatability policies, time windows, component-level fulfillment, revocation workflows, reconciliation, and explainable user-facing history.

The authoritative invariants are:

1. Every logical Reward decision has one globally unique `reward_grant_id`.
2. The same logical request produces at most one Reward Grant, even under duplicate Event delivery, retries, or concurrent consumers.
3. A published Reward Definition version is immutable.
4. Every Reward Grant stores or references the exact immutable snapshots required to replay and explain the decision.
5. Only the owning Engine may mutate the state represented by a Reward Component.
6. The Reward Engine may declare a Grant `GRANTED` only after every required component has been confirmed by its owner.
7. A failed or delayed component is visible as an explicit state; it is never silently treated as success.
8. Reward calculations use integers or explicitly defined fixed-precision decimal semantics. Authoritative floating-point arithmetic is prohibited.
9. Business-domain semantics are represented in configuration and source Events, never hardcoded into the Engine core.
10. Grant state, component state, ledger entries, operation records, and outgoing Events are committed atomically within the Reward Engine database.
11. Revocation is a new audited workflow. Historical grant records are never deleted or rewritten.
12. Arbitrary executable code, arbitrary target topics, and untyped custom mutation payloads are prohibited in published Reward Definitions.

This RFC is normative for the Reward Engine domain model, ownership boundary, configuration lifecycle, Event contracts, fulfillment protocol, database design, APIs, administrative tooling, security, privacy, performance, auditability, edge-case behavior, and release acceptance criteria.

---

## Purpose

The purpose of this document is to define a production-ready specification for the Reward Engine of Progression Platform.

It establishes:

- the Engine responsibility and ownership boundary;
- the canonical Reward language;
- the lifecycle of Reward Definitions, Trigger Bindings, Grants, Claims, Fulfillments, and Revocations;
- the aggregate model and invariants;
- deterministic eligibility, repeatability, and component-resolution behavior;
- the saga protocol used to coordinate state-owning Engines;
- inbound and outbound Event contracts;
- read and write models;
- a reference PostgreSQL schema;
- public, internal, and administrative APIs;
- authoring, simulation, approval, support, and reconciliation workflows;
- security, privacy, performance, observability, and audit requirements;
- deterministic responses to failures and edge cases;
- acceptance tests sufficient for implementation and production release.

The document is domain-agnostic. Terms such as lesson, workout, purchase, tournament, subscription, course, or community contribution may appear only in examples. The Engine core MUST operate on canonical Events, typed Reward Definitions, bounded conditions, and opaque source references.

### Normative language

The key words **MUST**, **MUST NOT**, **REQUIRED**, **SHALL**, **SHALL NOT**, **SHOULD**, **SHOULD NOT**, **RECOMMENDED**, **MAY**, and **OPTIONAL** are normative requirement levels.

Where an earlier high-level document informally states that the Reward Engine “applies” every Reward, this RFC defines application as orchestration and verified fulfillment. It does not authorize the Reward Engine to write state owned by another Engine.

### Design posture

The Engine is designed one abstraction level above the first School Module while remaining implementable without speculative general-purpose machinery.

The initial implementation SHOULD use:

- a relational authoritative store;
- transactional inbox and outbox patterns;
- immutable published configuration;
- typed component executors implemented by external owner Engines;
- bounded JSON-based conditions and expressions;
- asynchronous fulfillment with at-least-once delivery and exactly-once logical effect;
- read projections optimized separately from authoritative writes.

A generic scripting language, distributed transaction coordinator, or plugin runtime is not required for version 1.

---

## Goals

### G-1. Authoritative Reward decision ownership

Provide one authoritative component for Reward Definition resolution, eligibility, repeatability, Grant creation, fulfillment coordination, and Reward history.

### G-2. Preserve single-writer state ownership

Coordinate Reward effects without directly mutating state owned by Progression, Inventory, Currency, Reputation, Talent, Character, or future Engines.

### G-3. Domain independence

Support schools, fitness products, education, communities, gaming, marketplaces, and future Modules without domain-specific code in the Engine.

### G-4. Data-driven configuration

Represent Reward Definitions, component bundles, source bindings, conditions, repeatability, claim behavior, presentation, and activation windows as versioned data.

### G-5. Deterministic resolution

Produce the same Grant plan for the same source snapshot, Character eligibility snapshot, configuration versions, and evaluation time.

### G-6. Event-driven integration

Consume immutable source Events and publish typed coordination and outcome Events without synchronous Engine-to-Engine mutation calls.

### G-7. Idempotent granting

Guarantee at most one durable Reward Grant per logical deduplication scope despite duplicate delivery and concurrent processing.

### G-8. Reliable multi-component fulfillment

Track every component independently, retry transient failures, expose partial progress, and finalize only when required components reach terminal success.

### G-9. Claimable Rewards

Support Rewards that are immediately fulfilled and Rewards that require an explicit Character claim before a deadline.

### G-10. Repeatability control

Support bounded, understandable policies such as once per source Event, once per Character, limited count, and time-bucket limits.

### G-11. Safe revocation

Support authorized reversal or compensation workflows without deleting history or performing direct foreign-state edits.

### G-12. Full traceability

Explain who or what caused a Reward, why it qualified, which definition version was used, what components were requested, which owner Engine fulfilled each component, and why any component failed.

### G-13. Safe configuration evolution

Permit draft validation, simulation, review, publication, scheduling, retirement, and activation rollback without mutating published versions.

### G-14. Operational resilience

Provide backpressure, retries, dead-letter and quarantine handling, reconciliation, repair, pause controls, and observability suitable for production.

### G-15. Narrative-compatible output

Expose semantic presentation keys and structured component summaries so products can present a meaningful Reward moment instead of a raw technical transaction.

### G-16. Security by construction

Allow only trusted producers, registered component types, allowlisted owner Engines, bounded expressions, authorized administrative operations, and auditable changes.

### G-17. Privacy minimization

Store only the source and Character context needed to decide, fulfill, audit, and support a Reward.

### G-18. Horizontal scalability

Scale processing by Reward Grant or Character partitions while preserving deterministic per-scope repeatability and conflict handling.

---

## Non Goals

### NG-1. Foreign aggregate ownership

The Reward Engine does not own or directly mutate Experience, Level, Prestige, Inventory, Items, Currency, Reputation, Achievements, Talents, Skills, Titles, cosmetics, account data, or Character profile data.

### NG-2. Validation of business truth

The Engine does not determine whether a lesson occurred, a payment settled, a workout was legitimate, or a community action was valuable. The producing Module owns source-event truth and fraud controls.

### NG-3. Generic workflow engine

The Engine is not a general-purpose BPM, orchestration, or arbitrary saga platform. Its orchestration is limited to Reward Grants and registered Reward Components.

### NG-4. Arbitrary rules runtime

The Engine does not execute JavaScript, Python, Lua, SQL fragments, templates with side effects, remote webhooks, or uploaded code.

### NG-5. Achievement evaluation

Achievement Conditions and unlock semantics belong to the Achievement Engine. An Achievement unlock SHOULD NOT be modeled as a generic Reward Component in version 1 because doing so creates ambiguous ownership and cycles.

### NG-6. Quest evaluation

Quest Objectives and completion belong to the Quest Engine. Quest completion may request a Reward, but the Reward Engine does not decide whether the Quest was completed.

### NG-7. Talent eligibility

The Talent Engine owns Talent prerequisites and state. A Reward may request a specific Talent entitlement only when the Talent Engine contract explicitly supports such fulfillment.

### NG-8. Loot simulation beyond definitions

Complex procedural loot generation, random item affixes, combat drops, and economy simulation are outside version 1. Deterministic weighted selection MAY be added later through a dedicated ADR.

### NG-9. Payment and financial settlement

Platform Currency Rewards are game or product entitlements. The Engine is not a banking ledger, payment processor, tax system, or real-money wallet.

### NG-10. Notification delivery

The Engine publishes Reward outcome Events but does not send email, push, chat, or in-product notifications.

### NG-11. User-interface rendering

The Engine provides presentation data and APIs but does not render reward animations, modals, sound, or narrative copy.

### NG-12. Cross-Character transfer

Trading, gifting, shared household Rewards, guild treasuries, pooled Rewards, and Character-to-Character transfers are outside version 1.

### NG-13. True distributed atomicity

The Engine does not provide a two-phase commit across independent Engines. It provides durable saga semantics with explicit partial state and compensation where supported.

### NG-14. Silent retroactive policy mutation

Changing an active Definition does not rewrite historical Grants. Historical re-evaluation requires an explicit backfill or correction job.

### NG-15. Arbitrary manual granting

Operators cannot create untyped free-form Rewards. Manual grants must reference a published Definition or an approved, typed administrative adjustment Definition.

### NG-16. Analytics warehouse ownership

The Engine emits and exposes operational data but is not the long-term analytics warehouse or experimentation platform.

---

## Responsibilities

### R-1. Reward Definition management

Manage immutable versions of Reward Definitions and their typed components.

### R-2. Trigger Binding management

Manage data-driven bindings from allowlisted source Event types to published Reward Definitions.

### R-3. Explicit Grant request processing

Accept typed requests from trusted platform Engines and Modules for a specific Reward Definition.

### R-4. Source Event evaluation

Evaluate only configured reward eligibility against the immutable source Event, approved local projections, and deterministic evaluation context.

### R-5. Repeatability and deduplication

Derive and enforce logical deduplication keys and repeatability counters transactionally.

### R-6. Grant plan resolution

Resolve the exact Definition version, component payloads, quantities, requiredness, fulfillment targets, claim policy, expiration, and presentation snapshot.

### R-7. Reward Grant Aggregate management

Own the durable Reward Grant, component state, claim state, fulfillment state, and revocation state.

### R-8. Fulfillment coordination

Publish typed fulfillment requests and consume typed results from owner Engines.

### R-9. Retry and timeout policy

Retry transient component failures according to versioned operational policy while preventing duplicate logical effects.

### R-10. Claim processing

Authorize, validate, and record Character claims for claim-required Rewards.

### R-11. Revocation coordination

Coordinate component reversals or compensations through owner Engines and record the final outcome.

### R-12. Immutable Reward ledger

Append decision, claim, dispatch, fulfillment, failure, expiry, revocation, and repair entries.

### R-13. Event publication

Publish immutable lifecycle and outcome Events through a transactional outbox.

### R-14. Read projections

Maintain Reward history, inbox, claimable Reward, catalog, administration, and operational projections.

### R-15. Explainability

Provide machine-readable decision traces without exposing secrets or unnecessary personal data.

### R-16. Configuration simulation

Validate Definitions and Bindings against fixtures, schema contracts, and sampled historical Events before publication.

### R-17. Reconciliation and repair

Detect divergence between Grant state, component results, ledger entries, and owner-Engine acknowledgements; repair by append-only operations.

### R-18. Operational controls

Support pausing, draining, quarantining, retrying, rate limiting, and bulk-job control without direct database mutation.

---

## Dependencies

### Character Engine

The Reward Engine depends on Character lifecycle Events and a local eligibility projection.

The local projection MUST contain only fields needed for Reward acceptance, such as:

- `character_id`;
- lifecycle status;
- suspension or closure restrictions relevant to Rewards;
- platform tenant or realm boundary where applicable;
- source sequence and Event identity.

The critical Grant path MUST NOT synchronously call the Character Engine. Unknown or stale Character state is handled according to explicit eligibility policy.

The Reward Engine MUST NOT update Character profile or lifecycle state.

### Progression Engine

The Progression Engine is the fulfillment owner for `EXPERIENCE` components.

The Reward Engine publishes a typed fulfillment request containing the final integer amount, Progression Track key, Reward Grant identity, component identity, definition snapshot references, and idempotency identity. It consumes the resulting progression operation outcome.

The Reward Engine MUST NOT write progression tables or infer Level changes as authoritative state.

### Inventory and Item Engines

The Inventory Engine is the fulfillment owner for Item ownership. The Item Engine owns Item Definitions.

At publication time, the Reward Engine SHOULD validate referenced Item Definition versions through a catalog projection or registry. Runtime fulfillment remains authoritative in the Inventory Engine.

### Currency or Wallet Engine

A dedicated platform Currency or Wallet Engine owns spendable balance state. Until that Engine exists, `CURRENCY` components MUST remain disabled in production or be mapped to an explicitly registered fulfillment provider with equivalent ledger guarantees.

### Reputation Engine

The Reputation Engine owns Reputation tracks and balances. Reward Engine coordinates typed Reputation grant operations only.

### Talent Engine

The Talent Engine owns Talent and Skill state. Reward components may request typed unlocks only through contracts defined by the Talent Engine and only when cycle validation passes.

Talent Engine also publishes complete monotonic
`talent.effect.set.changed.v1` snapshots. Reward Engine is the registered
consumer for the `reward-calculation` scope. It maintains a local projection,
pins the applied effect revision and fingerprint in the evaluation context,
and resolves every applicable modifier before publishing an EXPERIENCE
fulfillment request. Progression Engine receives only the finalized integer.

### Entitlement provider

Titles, cosmetics, feature unlocks, and presentation assets SHOULD be modeled as typed entitlements fulfilled by an Entitlement or Inventory capability. The Character Engine may validate presentation selection but MUST NOT become the ownership store for those Rewards.

### Achievement, Quest, and Season Engines

These Engines may request Reward Grants after reaching their own authoritative outcomes. They MUST provide stable source entity and completion identifiers.

Reward outcome Events may be consumed by those Engines only when cycle analysis proves that the resulting chain cannot recursively produce the same Reward.

### Event infrastructure

Required capabilities:

- durable at-least-once delivery;
- globally unique Event identifiers;
- schema versioning;
- producer identity;
- partition key support;
- dead-letter or quarantine routing;
- replay tooling;
- trace and correlation propagation;
- retention sufficient for operational recovery.

The Reward Engine creates exactly-once logical effects on top of at-least-once delivery through inbox, operation, deduplication, and aggregate constraints.

### Configuration Registry or LiveOps Engine

Published Reward Definition and Trigger Binding versions may be distributed through a Configuration Registry or LiveOps capability.

The Reward Engine database remains authoritative for the versions it activates and uses. A cache or registry outage MUST NOT change the meaning of an already resolved Grant.

### Schema Registry

Every source Event used by a Trigger Binding and every fulfillment Event MUST have a registered schema. Publication validation MUST reject unknown or incompatible schemas.

### Authorization and Policy service

Interactive APIs require authenticated principals and policy evaluation. Administrative scopes, separation of duties, support access, privacy access, and emergency roles are defined in the Security section.

### Audit and observability infrastructure

The Engine exports append-only audit Events, metrics, structured logs, and traces. The local Reward ledger remains the authoritative operational explanation.

### Time source

All authoritative timestamps MUST use a synchronized server-side UTC time source. Client timestamps are context only.

For deterministic historical replay, the original `occurred_at`, `received_at`, activation version, and evaluation timestamp MUST be preserved.

### Database

The authoritative store MUST support:

- ACID transactions;
- unique constraints;
- row-level locking or equivalent compare-and-swap;
- JSON with validation where appropriate;
- append-only ledger retention;
- transactional inbox and outbox;
- indexed temporal and Character queries;
- online schema migration.

The reference design uses PostgreSQL.

### Optional dependencies

Search, notification, analytics, experimentation, and media services are optional downstream dependencies. Their outage MUST NOT block authoritative Reward Grant state transitions.

### Forbidden dependencies

The Reward Engine MUST NOT depend on:

- School Module database tables;
- synchronous mutation APIs of owner Engines in the authoritative Event path;
- client-provided reward quantities without server-side definition constraints;
- arbitrary remote webhooks;
- unversioned configuration files loaded directly at runtime;
- shared mutable tables owned by other Engines.

---

## Architecture Overview

### Context

```text
Business Module / Platform Engine
            │
            │ source Event or reward.grant.requested
            ▼
      Event Infrastructure
            │
            ▼
┌───────────────────────────────────────────────────────────────┐
│                         Reward Engine                         │
│                                                               │
│  Inbox → Binding Resolver → Eligibility → Grant Aggregate     │
│                              │                                │
│                              ├── Claim workflow               │
│                              ├── Repeatability registry       │
│                              ├── Reward ledger                │
│                              └── Transactional outbox         │
└──────────────────────────────┬────────────────────────────────┘
                               │ reward.fulfillment.requested
              ┌────────────────┼─────────────────┬──────────────┐
              ▼                ▼                 ▼              ▼
      Progression Engine  Inventory Engine  Reputation Engine  Other
              │                │                 │              Owner
              └────────────────┴─────────────────┴──────────────┘
                               │ fulfillment result Events
                               ▼
                         Reward Engine
                               │
              reward.granted / failed / revoked
                               ▼
                 Projections / Notifications / Clients
```

### Ownership boundary

| Concern | Authoritative owner | Reward Engine behavior |
|---|---|---|
| Reward Definition | Reward Engine | Creates, versions, validates, publishes, activates. |
| Event-to-Reward Binding | Reward Engine | Creates and evaluates bounded data-driven bindings. |
| Reward eligibility | Reward Engine | Evaluates reward-specific conditions from immutable inputs. |
| Reward repeatability | Reward Engine | Owns counters and deduplication decisions. |
| Reward Grant lifecycle | Reward Engine | Owns aggregate and ledger. |
| Reward claim state | Reward Engine | Owns claim authorization and deadline. |
| Component fulfillment status | Reward Engine | Tracks acknowledgements; does not own target state. |
| Experience, Level, Prestige | Progression Engine | Requests fulfillment and records result. |
| Item ownership | Inventory Engine | Requests fulfillment and records result. |
| Item Definition | Item Engine | References immutable identifiers and versions. |
| Currency balance | Currency or Wallet Engine | Requests fulfillment and records result. |
| Reputation | Reputation Engine | Requests fulfillment and records result. |
| Talent or Skill state | Talent Engine | Requests typed fulfillment and records result. |
| Title and cosmetic entitlement | Entitlement or Inventory owner | Requests fulfillment and records result. |
| Character lifecycle and profile | Character Engine | Mirrors eligibility only. |
| Achievement or Quest completion | Respective Engine | Accepts completed outcome as a source. |
| Notifications | Notification Engine | Publishes outcome Events only. |

### Why the Reward Engine does not directly apply foreign state

Allowing the Reward Engine to update progression, inventory, and reputation tables would create:

- multiple writers for the same aggregate;
- database coupling between Engines;
- impossible independent deployment;
- inconsistent validation rules;
- bypassed owner-Engine audit and limits;
- unsafe replay behavior;
- a platform core that cannot evolve by adding new fulfillment types.

Therefore “apply a Reward” means:

1. make an authoritative Reward decision;
2. create a stable component plan;
3. request each owning Engine to apply its component;
4. verify owner acknowledgement;
5. publish the final Grant outcome.

### Internal components

#### 1. Inbound Event Consumer

Validates the Event envelope, producer authorization, schema version, partition key, payload size, and replay metadata before inserting the inbox record.

#### 2. Trigger Binding Resolver

Selects active Trigger Binding versions whose source Event type, producer scope, activation window, tenant or realm scope, and optional discriminator match the Event.

#### 3. Grant Request Handler

Processes explicit `reward.grant.requested` Events from trusted producers and resolves the referenced Reward Definition.

#### 4. Eligibility Evaluator

Evaluates bounded, side-effect-free conditions against the immutable evaluation context. It cannot perform arbitrary network calls.

#### 5. Repeatability Registry

Computes and reserves deduplication and repeatability scopes transactionally.

#### 6. Definition Resolver

Loads the exact immutable Reward Definition version and validates its active state for the request context.

#### 7. Component Planner

Resolves component quantities, payload parameters, owner type, requiredness, fulfillment order, expiration, and presentation snapshot.

#### 8. Reward Grant Repository

Loads and persists the Reward Grant Aggregate under optimistic concurrency or row-level locking.

#### 9. Claim Service

Validates claim identity, status, deadline, Character ownership, version precondition, and one-time transition to fulfillment.

#### 10. Fulfillment Dispatcher

Creates one outbox Event per component attempt and schedules retries without producing duplicate logical fulfillment identities.

#### 11. Fulfillment Result Consumer

Correlates owner-Engine outcomes to a component, validates producer ownership, records the result, and recalculates aggregate status.

#### 12. Revocation Orchestrator

Creates reversal requests in a safe order, tracks unsupported reversals, and finalizes the revocation outcome.

#### 13. Reward Ledger Writer

Appends immutable business-significant entries within the same transaction as aggregate mutation.

#### 14. Transactional Outbox

Stores outbound domain and coordination Events atomically with state changes.

#### 15. Outbox Publisher

Publishes outbox Events and records broker acknowledgement. Duplicate publication is safe because consumers use stable Event and request identities.

#### 16. Projection Workers

Build user, support, administration, search, and analytical read models from committed Events or change streams.

#### 17. Reconciliation Worker

Compares aggregate state, component state, ledger, outbox, and owner acknowledgements; records divergence without silently rewriting history.

#### 18. Configuration Administration Service

Supports authoring, validation, simulation, approval, publication, scheduling, retirement, and rollback of activation pointers.

### Source paths

The Engine supports two canonical creation paths.

#### Bound source Event path

A Business Module or Engine publishes an immutable source Event. An active Trigger Binding maps that Event to one or more Reward Definitions.

This path is appropriate when configuration owns the complete event-to-reward relationship.

#### Explicit Grant request path

A trusted producer publishes `reward.grant.requested.v1` referencing a Reward Definition key and stable source identity.

This path is appropriate when another Engine owns the qualifying decision, such as Quest completion or Achievement unlock.

Both paths converge before repeatability reservation and Grant creation.

### Authoritative write transaction

For a qualifying, automatically fulfilled Reward, the initial transaction MUST:

1. lock or insert the inbox record;
2. validate request identity and producer authorization;
3. resolve active Binding and Definition versions;
4. build the immutable evaluation context;
5. evaluate eligibility;
6. derive logical deduplication scope;
7. reserve repeatability capacity;
8. create the Reward Grant Aggregate;
9. create component records with stable `fulfillment_id` values;
10. append decision and planning ledger entries;
11. create fulfillment-request outbox records for dispatchable components;
12. create Grant lifecycle outbox Events;
13. mark the inbox item processed;
14. commit once.

No outbound Event may become visible before commit.

For claim-required Rewards, step 11 is deferred until a valid claim transaction.

### Fulfillment saga

A multi-component Reward is a durable saga, not a distributed database transaction.

Each component has:

- one stable logical `fulfillment_id`;
- one owner Engine and component type;
- zero or more delivery attempts;
- one authoritative terminal outcome;
- optional reversal capability metadata.

The owner Engine MUST implement exactly-once logical effect using `fulfillment_id` or an equivalent idempotency key. If the Reward Engine republishes a request, the owner MUST return the original outcome or an idempotent accepted no-op.

### Component completion policy

Each component is classified as:

- `REQUIRED`: final Grant success requires terminal fulfillment success;
- `OPTIONAL`: failure does not block final success but is visible and audited;
- `INFORMATIONAL`: no foreign mutation; used only for presentation and MUST be explicitly allowlisted.

Version 1 SHOULD minimize optional components because they complicate user expectations.

A Grant is `GRANTED` only when all required components are `FULFILLED` and every optional component is terminal or has been explicitly abandoned by policy.

### Fulfillment ordering

Definitions MAY assign a bounded integer `fulfillment_order`.

The default strategy is parallel dispatch. Sequential dispatch MAY be used when:

- a later component depends on a stable reference produced by an earlier owner;
- compensation risk requires reversible components first;
- a target Engine has documented ordering semantics.

Ordering MUST NOT be used to encode arbitrary workflows.

### Failure model

Failures are classified as:

- `TRANSIENT`: retryable without changing request semantics;
- `RATE_LIMITED`: retryable after owner-provided delay;
- `DEPENDENCY_UNAVAILABLE`: retryable;
- `VALIDATION_REJECTED`: terminal unless configuration or source is corrected through a new operation;
- `CHARACTER_INELIGIBLE`: terminal for the Grant;
- `DEFINITION_REFERENCE_INVALID`: terminal and usually a publication-validation defect;
- `CONFLICT`: requires reconciliation or a new expected version;
- `UNSUPPORTED`: terminal;
- `UNKNOWN`: quarantined until classified.

Retries MUST reuse the same `fulfillment_id` and immutable component request.

### Consistency model

The Reward Engine provides:

- strong consistency for a single Reward Grant Aggregate transaction;
- transactional consistency between aggregate, component state, ledger, inbox, and outbox;
- exactly-once logical Grant creation per deduplication scope;
- exactly-once logical component effect when owner contracts comply;
- eventual consistency between Reward Engine and owner-Engine state;
- eventual consistency for client projections.

The Engine does not claim instant global atomicity.

### Ordering model

Grant lifecycle transitions are serialized by aggregate version.

Events MUST include:

- `aggregate_id = reward_grant_id`;
- monotonically increasing `aggregate_version` for Grant lifecycle Events;
- a partition key based on `reward_grant_id` for fulfillment results;
- source sequence when the producer provides an authoritative ordered stream.

Repeatability scopes spanning multiple Grants MAY require a separate locked counter row or serializable transaction.

### Delivery semantics

Inbound and outbound delivery are at least once.

Exactly-once logical behavior requires:

- unique inbox Event identity;
- unique request identity per producer;
- unique Grant deduplication key per repeatability scope;
- stable fulfillment identity per component;
- immutable request fingerprint;
- owner-Engine idempotency;
- transactional outbox;
- terminal outcome reuse.

### Failure isolation

A malformed Event, broken Definition, unavailable owner Engine, or poisoned component MUST NOT block unrelated Grants.

Isolation controls include:

- bounded consumer batches;
- per-producer and per-component-type circuit breakers;
- per-owner retry queues;
- quarantine for unknown failures;
- partition-level pause;
- bulkhead concurrency limits;
- definition activation rollback;
- component-specific backlog metrics.

### Deployment model

The Engine MAY be deployed as one service or several independently scaled workers, provided all implementations preserve the same aggregate, inbox, outbox, and configuration invariants.

A practical deployment separates:

- command and query API;
- source Event consumers;
- fulfillment-result consumers;
- outbox publishers;
- retry scheduler;
- projection workers;
- reconciliation workers;
- administration jobs.

---
## Canonical Definitions

### Reward

A **Reward** is an authorized positive platform outcome intended for a Character and represented by one immutable Reward Definition version plus a resolved set of Reward Components.

A Reward is not the foreign state mutation itself. It is the platform decision and coordinated delivery contract that causes owner Engines to perform typed mutations.

### Reward Definition

A **Reward Definition** is a stable logical configuration identity, addressed by `reward_definition_key`, that groups immutable versions over time.

Examples of valid keys:

- `platform.onboarding.completed`;
- `school.lesson.first_attendance`;
- `community.contribution.weekly`;
- `season.2026.summer.final_reward`.

Keys are namespaced data identifiers. Their text does not create runtime business logic.

### Reward Definition Version

A **Reward Definition Version** is an immutable, published configuration containing:

- semantic version or monotonic version number;
- activation scope and window;
- component definitions;
- eligibility conditions;
- repeatability policy;
- claim policy;
- expiration policy;
- presentation metadata;
- fulfillment and revocation policy;
- schema references;
- audit metadata.

A Grant always records the exact version used.

### Reward Component

A **Reward Component** is one typed outcome inside a Reward Definition.

A Component contains:

- stable `component_key` within the Definition version;
- registered `component_type`;
- owner Engine type;
- immutable typed payload template;
- quantity expression where applicable;
- requiredness;
- fulfillment order;
- retry class;
- reversal capability expectation;
- presentation metadata.

### Component Type

A **Component Type** is a platform-registered contract between the Reward Engine and one owner Engine.

Initial types are:

| Component type | Owner | Numeric semantics |
|---|---|---|
| `EXPERIENCE` | Progression Engine | Positive int64 Experience units. |
| `ITEM` | Inventory Engine | Positive integer quantity of an immutable Item Definition reference. |
| `CURRENCY` | Currency or Wallet Engine | Positive fixed-precision minor units or integer units defined by the currency contract. |
| `REPUTATION` | Reputation Engine | Positive integer units on a named Reputation Track. |
| `ENTITLEMENT` | Entitlement or Inventory provider | One typed entitlement reference, optionally quantity one. |
| `TALENT_UNLOCK` | Talent Engine | Typed unlock request; owner validates compatibility. |
| `SKILL_UNLOCK` | Talent Engine or Skill owner | Typed unlock request; owner validates compatibility. |

New types require a Component Type registration and compatibility ADR. A published Definition MUST NOT use an unregistered type.

### Component Type Registry

The **Component Type Registry** defines:

- canonical type name and version;
- owner Engine producer identity;
- request and result Event schemas;
- payload limits;
- quantity semantics;
- supported reversal semantics;
- timeout and retry defaults;
- privacy classification;
- operational owner.

Registry entries are platform configuration, not user-authored plugin code.

### Reward Bundle

A **Reward Bundle** is a Reward Definition containing more than one Component.

The term is descriptive. It is not a separate aggregate in version 1.

### Reward Policy

A **Reward Policy** is the complete published behavior of one Reward Definition version, including eligibility, repeatability, claim, expiration, fulfillment, and revocation rules.

### Trigger Binding

A **Trigger Binding** maps an allowlisted source Event type and producer scope to one Reward Definition.

A Binding may include:

- source Event type and schema version range;
- producer allowlist;
- optional tenant, realm, Module, or namespace scope;
- bounded discriminator and eligibility conditions;
- parameter mappings;
- priority;
- activation window;
- stop-processing behavior;
- definition version selection policy.

### Explicit Grant Request

An **Explicit Grant Request** is a trusted Event requesting that the Reward Engine evaluate and create a Grant for a referenced Reward Definition.

The producer owns the external qualifying decision but does not control component semantics beyond allowed input parameters.

### Source Event

The **Source Event** is the immutable Event that caused evaluation.

For a bound path, it is the Business Module or platform Event itself. For an explicit path, the source Event may be the `reward.grant.requested` Event plus an immutable reference to the producer’s qualifying Event.

### Source Identity

A **Source Identity** is the stable tuple used to explain and deduplicate the origin of a Grant. It normally includes:

- source producer;
- source Event id;
- source Event type;
- source entity type;
- source entity id;
- source occurrence or completion id where relevant.

### Evaluation Context

The **Evaluation Context** is the immutable input object used by the Eligibility Evaluator and Component Planner.

It contains only allowlisted values from:

- source Event payload;
- source Event metadata;
- explicit Grant parameters;
- local Character eligibility projection;
- local Talent `reward-calculation` effect-set projection;
- activation context;
- server evaluation time;
- immutable configuration metadata.

The context MUST be versioned and either persisted in sanitized form or reproducible from immutable references.

For an Experience calculation, the context MUST record the Talent effect-set
revision, effect fingerprint, freshness decision, exact registered operation
order, and final integer result. Stale projection behavior is explicit per
Reward Binding: fail closed, retry, or use a published no-modifier fallback.
Silently applying an unknown or partially received effect set is prohibited.

### Condition

A **Condition** is a bounded, side-effect-free predicate evaluated against the Evaluation Context.

Supported primitives in version 1 SHOULD include:

- equality and inequality;
- membership in a bounded literal set;
- numeric comparison;
- string prefix or exact match where explicitly allowlisted;
- existence and null checks;
- Boolean `all`, `any`, and `not` composition;
- timestamp comparison against explicit policy windows;
- Character lifecycle eligibility;
- source producer and schema checks.

Regex, unbounded collection traversal, remote calls, and arbitrary functions are prohibited by default.

### Expression

An **Expression** is a bounded, deterministic calculation used to resolve a Component quantity or allowed payload field.

Version 1 expressions MAY support:

- integer constants;
- allowlisted integer source fields;
- addition, subtraction, multiplication, integer division with explicit rounding;
- `min`, `max`, and bounded clamp;
- fixed-precision decimal conversion where the component contract defines scale.

Expressions MUST declare overflow behavior. Floating-point execution is prohibited.

### Reward Candidate

A **Reward Candidate** is an internal, non-authoritative evaluation result produced before repeatability reservation and Grant creation.

It MUST NOT be exposed as a granted Reward.

### Reward Grant

A **Reward Grant** is the authoritative aggregate representing one logical Reward decision for one Character.

It owns:

- identity and source references;
- Definition and Binding versions;
- evaluation result and trace;
- deduplication and repeatability reservation;
- claim state;
- resolved component plan;
- component fulfillment states;
- final Grant state;
- revocation state;
- aggregate version;
- ledger and operation references.

### Reward Grant ID

`reward_grant_id` is a globally unique immutable UUID or equivalent platform identifier. It is never reused.

### Grant Request ID

`request_id` is the stable idempotency identity supplied by a trusted producer or generated deterministically for a Binding evaluation.

A producer MUST reuse the same `request_id` for retries of the same logical request and MUST use a new one for a new logical request.

### Deduplication Key

A **Deduplication Key** is the canonical hash or normalized tuple enforcing one Grant within an idempotency or repeatability scope.

It is derived by the Reward Engine. A client-provided string alone is not authoritative.

### Repeatability Policy

A **Repeatability Policy** controls how often a Character may receive a Definition.

Initial modes:

- `ONCE_PER_SOURCE_EVENT`;
- `ONCE_PER_SOURCE_ENTITY`;
- `ONCE_PER_CHARACTER`;
- `LIMITED_PER_CHARACTER`;
- `ONCE_PER_TIME_BUCKET`;
- `LIMITED_PER_TIME_BUCKET`;
- `UNBOUNDED`.

`UNBOUNDED` still requires request idempotency.

### Repeatability Scope

A **Repeatability Scope** is the normalized key and counter period used to enforce a Repeatability Policy.

Examples include Character plus Definition, Character plus source entity, or Character plus UTC calendar week plus Definition.

### Time Bucket

A **Time Bucket** is a deterministic interval derived from a declared timezone and calendar rule.

The Definition MUST specify timezone semantics. The Engine MUST NOT infer a client timezone.

### Claim Policy

A **Claim Policy** defines whether fulfillment begins automatically or requires an explicit claim.

Modes:

- `AUTOMATIC`;
- `CLAIM_REQUIRED`.

A claim-required policy specifies deadline, expiration behavior, and whether expiry releases repeatability capacity.

### Claim

A **Claim** is the authenticated Character action accepting a `PENDING_CLAIM` Grant and authorizing fulfillment.

A Claim is idempotent and creates a ledger entry even when repeated as an accepted no-op.

### Grant Expiration

**Grant Expiration** is the terminal transition of an unclaimed or otherwise expirable Grant after its configured deadline.

Expiration is produced by an explicit scheduled operation using server time. It is not a query-time illusion.

### Fulfillment

A **Fulfillment** is one owner-Engine request to apply one resolved Reward Component.

### Fulfillment ID

`fulfillment_id` is the globally unique and stable logical idempotency identity for one Component of one Grant.

Retries and redeliveries MUST reuse it.

### Fulfillment Attempt

A **Fulfillment Attempt** is one physical dispatch or retry of a Fulfillment. Attempts have unique attempt identifiers but share the same `fulfillment_id`.

### Fulfillment Receipt

A **Fulfillment Receipt** is the owner Engine’s authoritative acknowledgement containing its operation id, result status, applied values, aggregate version where applicable, and Event reference.

### Required Component

A **Required Component** must reach `FULFILLED` before the Grant can become `GRANTED`.

### Optional Component

An **Optional Component** may fail without preventing Grant completion only when the Definition explicitly declares that user expectation and presentation behavior.

### Grant State

The canonical Grant states are:

- `RECEIVED`;
- `EVALUATING`;
- `PENDING_CLAIM`;
- `FULFILLMENT_PENDING`;
- `FULFILLING`;
- `PARTIALLY_FULFILLED`;
- `GRANTED`;
- `GRANTED_WITH_WARNINGS`;
- `SKIPPED`;
- `REJECTED`;
- `FAILED`;
- `EXPIRED`;
- `REVOCATION_PENDING`;
- `REVOCATION_PARTIAL`;
- `REVOKED`;
- `REVOCATION_FAILED`.

### Skipped Grant

A **Skipped Grant** is an evaluated request that intentionally creates no Reward because eligibility or repeatability policy did not permit it.

The Engine records a durable decision operation and MAY create a lightweight terminal Grant record according to retention policy. It MUST publish a typed skip outcome when the source contract requires one.

### Rejected Request

A **Rejected Request** is invalid, unauthorized, incompatible, or malformed. It differs from an eligible-but-repeat-limited skip.

### Failed Grant

A **Failed Grant** was validly created but could not reach a successful terminal state and has no active retry or compensation path.

### Partial Fulfillment

**Partial Fulfillment** means at least one Component succeeded while at least one required Component is non-terminal or failed.

It is an explicit state and a support concern.

### Revocation

A **Revocation** is an authorized workflow intended to reverse or compensate a previously fulfilled Reward.

Revocation never deletes the original Grant.

### Reversal

A **Reversal** is an owner-Engine operation that negates a specific prior Fulfillment using its stable reference.

### Compensation

A **Compensation** is a domain-approved alternate action used when literal reversal is not supported. Compensation MUST be typed, configured, and auditable; it is not arbitrary operator discretion.

### Irreversible Component

An **Irreversible Component** is a type or instance whose owner cannot guarantee reversal.

Definitions containing such components MUST declare revocation behavior and SHOULD require stronger publication approval.

### Reward Ledger Entry

A **Reward Ledger Entry** is an immutable append-only record of a business-significant Grant transition or decision.

### Reward Operation

A **Reward Operation** records one inbound command or Event-processing attempt and its deterministic outcome.

### Accepted No-op

An **Accepted No-op** is a valid repeated command whose intended state is already true. It returns the original or current result without creating a second effect.

### Presentation Snapshot

A **Presentation Snapshot** contains immutable localization keys, icon references, rarity or category labels, and component summaries used to explain the Grant as it was awarded.

The snapshot MUST NOT contain rendered locale-specific prose as the only source of meaning.

### Aggregate Version

`aggregate_version` is a monotonically increasing integer incremented once per committed Reward Grant mutation.

### Definition Fingerprint

A **Definition Fingerprint** is a canonical cryptographic hash of the published semantic Definition content.

### Decision Trace

A **Decision Trace** is a bounded machine-readable explanation of condition results, selected Binding, resolved values, repeatability decision, and policy versions.

It MUST be safe for authorized support use and MUST NOT expose secrets or arbitrary source payload fields.

---

## Lifecycle

### Reward Definition lifecycle

```text
DRAFT → VALIDATED → APPROVED → PUBLISHED → SCHEDULED → ACTIVE → RETIRED → ARCHIVED
  │         │           │           │           │          │
  └─────────┴───────────┴───────────┴───────────┴──────────┘
                  new immutable version for semantic change
```

#### DRAFT

Mutable authoring state. It MUST NOT be used for production Grants.

#### VALIDATED

The Draft passed structural, schema, expression, condition, reference, cycle, and simulation validation for a specific content fingerprint.

Any semantic edit invalidates validation.

#### APPROVED

Required reviewers approved the exact validated fingerprint.

#### PUBLISHED

An immutable version exists. Publication does not necessarily make it active.

#### SCHEDULED

The version has a future activation window.

#### ACTIVE

The version may be resolved for new Grants within its activation scope.

At most one version per Definition key and exact activation scope may be effective at one instant unless an explicit deterministic experiment or segment policy is defined.

#### RETIRED

The version is not selected for new Grants but remains valid for historical Grants, delayed claims, retries, revocations, replay, and support.

#### ARCHIVED

Hidden from normal authoring and catalog views. Historical references remain resolvable.

### Definition transition rules

- Published semantic content is immutable.
- Presentation corrections that alter historical meaning require a new version.
- Activation pointers may be changed through audited scheduling operations.
- Retirement MUST NOT invalidate existing pending Claims or Fulfillments unless an explicit emergency policy is executed.
- Deleting a referenced published version is prohibited.
- A Definition cannot become active if any component type, referenced content, Event schema, or owner contract is missing.

### Trigger Binding lifecycle

Trigger Bindings use the same authoring lifecycle with these additional rules:

- A Binding MUST reference a published Reward Definition version-selection policy.
- A Binding cannot activate before its source Event schema and producer are registered.
- Overlapping Bindings with equal priority and incompatible stop-processing behavior are rejected.
- Cycle validation MUST analyze source and outcome Event chains.
- Retiring a Binding affects only future source Event evaluations.

### Grant lifecycle state machine

```text
RECEIVED
   │
   ▼
EVALUATING ──ineligible/repeat-limited──▶ SKIPPED
   │
   ├──invalid/unauthorized──────────────▶ REJECTED
   │
   ├──claim required────────────────────▶ PENDING_CLAIM ──deadline──▶ EXPIRED
   │                                            │
   │                                            └──claim──▶ FULFILLMENT_PENDING
   │
   └──automatic─────────────────────────▶ FULFILLMENT_PENDING
                                                   │
                                                   ▼
                                              FULFILLING
                                                │     │
                               some success─────┘     └──terminal no success──▶ FAILED
                                                ▼
                                     PARTIALLY_FULFILLED
                                          │             │
                               all required│             └──unrecoverable──▶ FAILED
                                          ▼
                               GRANTED / GRANTED_WITH_WARNINGS
                                          │
                                          └──authorized revoke──▶ REVOCATION_PENDING
                                                                      │
                                                        partial───────┤
                                                                      ▼
                                                       REVOCATION_PARTIAL
                                                          │          │
                                                   complete│          └──terminal──▶ REVOCATION_FAILED
                                                          ▼
                                                       REVOKED
```

### RECEIVED

A valid envelope and request identity have been durably accepted. No eligibility decision has yet been committed.

This state MAY be transient within one transaction but remains canonical for recovery and observability.

### EVALUATING

The Engine is resolving configuration, evaluation context, conditions, repeatability, and component plan.

The evaluation MUST be deterministic and bounded.

### PENDING_CLAIM

The Reward decision is authorized and repeatability capacity is reserved, but no fulfillments have been dispatched.

The Grant includes:

- `claim_available_at`;
- `claim_expires_at` when applicable;
- claim authorization scope;
- presentation snapshot;
- resolved component preview;
- expiration behavior.

### FULFILLMENT_PENDING

Fulfillment is authorized and component requests are ready for outbox dispatch.

### FULFILLING

At least one required Component has been dispatched and no component has yet succeeded, or work is actively in progress.

### PARTIALLY_FULFILLED

At least one Component is fulfilled and at least one required Component remains pending or failed.

The state MUST remain visible until the Grant completes, fails, or enters revocation.

### GRANTED

Every required Component fulfilled successfully and no optional component ended in an unresolved failure.

The `reward.granted.v1` Event is published only on this transition.

### GRANTED_WITH_WARNINGS

Every required Component fulfilled, but one or more optional Components reached an approved terminal failure or were abandoned according to policy.

Clients MUST NOT imply that the missing optional component was received.

### SKIPPED

The request was valid but produced no Grant because a published eligibility or repeatability rule returned a non-error negative decision.

Canonical skip reasons include:

- condition false;
- duplicate source Event;
- once-per-Character already granted;
- time-bucket limit reached;
- source outside activation window;
- Character not eligible under a non-error skip policy.

### REJECTED

The request could not be safely evaluated or authorized.

Examples:

- unauthorized producer;
- unsupported schema;
- unknown Definition;
- invalid parameters;
- component mapping failure;
- Definition fingerprint mismatch;
- malformed source identity;
- forbidden recursion.

### FAILED

A valid Grant cannot reach success because required fulfillment failed terminally, claim processing encountered an unrecoverable invariant violation, or repair policy closed the Grant.

A Failed Grant is not equivalent to no Reward. Any successful components remain visible and may require revocation or support action.

### EXPIRED

A claim-required Reward passed its claim deadline without a successful Claim, or an explicitly expirable pending state reached its deadline.

Expiry behavior for repeatability reservation MUST be declared:

- `CONSUME`: the expired opportunity still counts;
- `RELEASE`: capacity is released through an audited counter operation;
- `RETRYABLE_OFFER`: a new Grant may be created only by a new source request under policy.

### REVOCATION_PENDING

A revocation was authorized and reversal requests are pending or dispatchable.

### REVOCATION_PARTIAL

At least one fulfilled Component was reversed or compensated while at least one other targeted Component remains unresolved.

### REVOKED

Every targeted reversible component completed its reversal or approved compensation, and any irreversible residual state is explicitly represented by policy.

A Grant with unacknowledged irreversible residual effects MUST NOT be called fully revoked unless the Definition’s approved semantics define that outcome.

### REVOCATION_FAILED

The revocation reached a terminal state with unresolved required reversals or compensations.

### Claim lifecycle

A Claim operation transitions only:

- `PENDING_CLAIM` to `FULFILLMENT_PENDING`;
- `PENDING_CLAIM` to `EXPIRED` when server time is past deadline and the expiry operation races with claim;
- repeated valid Claim to accepted no-op.

The first transaction that acquires the aggregate lock and validates server time wins deterministically.

### Component lifecycle

Canonical Component states:

- `PLANNED`;
- `BLOCKED_BY_ORDER`;
- `DISPATCH_PENDING`;
- `DISPATCHED`;
- `RETRY_SCHEDULED`;
- `FULFILLED`;
- `FAILED_RETRYABLE`;
- `FAILED_TERMINAL`;
- `ABANDONED_OPTIONAL`;
- `REVERSAL_PENDING`;
- `REVERSING`;
- `REVERSED`;
- `COMPENSATED`;
- `REVERSAL_FAILED`.

Transitions are monotonic except that retry states may cycle through attempts while logical state remains non-terminal.

### Revocation lifecycle

Revocation requires:

1. authorization and reason;
2. original Grant eligibility for revocation;
3. impact plan showing reversible, compensatable, and irreversible components;
4. approval according to risk;
5. stable reversal ids per original fulfillment;
6. owner-Engine reversal requests;
7. explicit final outcome;
8. post-revocation reconciliation.

Revocation MUST NOT mutate the original component receipt. It appends reversal records.

### Character lifecycle propagation

The Reward Engine maintains a local Character eligibility projection.

Default behavior:

| Character state | New automatic Grants | Claim | Pending fulfillment | Revocation |
|---|---|---|---|---|
| `ACTIVE` | Allowed by policy. | Allowed. | Continue. | Allowed. |
| `SUSPENDED` | Reject, skip, or quarantine according to Definition policy; default reject. | Default deny. | Default pause undispatched work; in-flight owner operation may finish. | Allowed for authorized operators. |
| `CLOSED` | Deny. | Deny. | Pause and require policy decision. | Allowed. |
| `ANONYMIZED` | Deny. | Deny. | No new dispatch; reconcile legal retention state. | Only privacy/legal workflow. |
| Unknown | Quarantine or retry; never assume active. | Deny. | Pause dispatch. | Restricted. |

Existing successful Rewards are not automatically revoked when a Character is suspended or closed.

### Definition retirement and pending Grants

A pending Claim or Fulfillment continues using its recorded immutable Definition version after retirement.

Emergency cancellation requires a separate audited operation and MUST define whether component reversals are initiated.

### Timeout lifecycle

Timeout is an operational state transition, not proof that the owner Engine did not apply an effect.

On timeout, the Reward Engine MUST retry with the same `fulfillment_id` or query/reconcile through an approved protocol. It MUST NOT create a new logical fulfillment identity.

---

## Aggregate

### Aggregate identity

The aggregate root is identified by `reward_grant_id`.

One Reward Grant belongs to exactly one Character in version 1.

A source Event may produce multiple Grants through multiple Bindings. Each Grant has a distinct id and Definition identity, while deduplication constraints prevent repeated creation for the same logical Binding evaluation.

### Aggregate root

The Reward Grant Aggregate contains:

```text
RewardGrant
├── reward_grant_id
├── character_id
├── state
├── definition_key
├── definition_version_id
├── definition_fingerprint
├── trigger_binding_version_id?
├── source_identity
├── request_identity
├── evaluation_context_reference
├── decision_trace
├── repeatability_scope
├── claim_policy_snapshot
├── claim_state
├── presentation_snapshot
├── components[]
│   ├── component_id
│   ├── component_key
│   ├── component_type
│   ├── owner_engine
│   ├── payload_snapshot
│   ├── quantity
│   ├── requiredness
│   ├── fulfillment_id
│   ├── fulfillment_state
│   ├── receipt
│   └── reversal_state
├── revocation
├── created_at
├── terminal_at?
├── aggregate_version
└── state_hash
```

### Aggregate invariants

#### Identity invariants

- `reward_grant_id` is immutable and globally unique.
- `character_id` is immutable.
- Definition version and fingerprint are immutable after Grant creation.
- Source identity is immutable after Grant creation.
- Every component id and fulfillment id is unique.
- One component belongs to exactly one Grant.

#### Decision invariants

- A Grant cannot exist without a published immutable Definition version.
- A Grant’s resolved Components cannot change after creation.
- Retry policy may alter scheduling metadata but not semantic component payload.
- Decision trace must correspond to the stored Definition and evaluation context versions.

#### Repeatability invariants

- The repeatability reservation and Grant creation commit atomically.
- One deduplication key maps to at most one accepted Grant decision.
- A duplicate request with a different canonical fingerprint is an idempotency conflict, not an accepted duplicate.
- Released expiry capacity is represented by a separate immutable counter operation.

#### Claim invariants

- Automatic Grants cannot enter `PENDING_CLAIM`.
- Claim-required Grants cannot dispatch fulfillment before a successful Claim.
- A Claim records server time and authenticated actor.
- A Grant can be claimed at most once logically.
- Claim expiration uses server time and the stored deadline.

#### Component invariants

- Required Components cannot be abandoned as optional.
- A Component cannot become `FULFILLED` without a valid result from its registered owner producer.
- A Fulfilled receipt is immutable.
- Retry attempts reuse the same logical fulfillment id.
- Terminal owner rejection cannot be overwritten by a later contradictory success without a reconciliation operation.
- Quantity must satisfy the registered component schema and Definition bounds.

#### Grant-state invariants

- `GRANTED` requires all required Components fulfilled.
- `GRANTED_WITH_WARNINGS` requires all required Components fulfilled and only optional terminal issues.
- `PARTIALLY_FULFILLED` requires at least one successful component and at least one unresolved required component.
- `SKIPPED`, `REJECTED`, and `EXPIRED` have no successfully fulfilled Components.
- Terminal success Events are published once per aggregate transition.
- Aggregate version increments exactly once per committed mutation.

#### Revocation invariants

- Only successful Components can be reversed.
- One original fulfillment has at most one active logical reversal workflow.
- Reversal requests use stable reversal ids.
- Original ledger and receipts remain immutable.
- `REVOKED` requires the configured revocation completion condition.

#### Audit invariants

- Every aggregate mutation appends at least one operation or ledger record.
- Actor, source, correlation, causation, and timestamp are present for privileged mutations.
- State hash is recalculated after each mutation.

### Aggregate commands

Canonical commands:

- `EvaluateBoundSourceEvent`;
- `RequestRewardGrant`;
- `ClaimRewardGrant`;
- `RecordFulfillmentDispatched`;
- `RecordFulfillmentSucceeded`;
- `RecordFulfillmentFailed`;
- `ScheduleFulfillmentRetry`;
- `ExpireRewardGrant`;
- `RequestRewardRevocation`;
- `RecordReversalSucceeded`;
- `RecordReversalFailed`;
- `AbandonOptionalComponent`;
- `CancelPendingGrant`;
- `ReconcileRewardGrant`;
- `RepairRewardGrant`.

No command permits arbitrary replacement of aggregate state.

### Validation order

To produce stable error behavior, Grant creation validation SHOULD occur in this order:

1. envelope syntax and schema;
2. producer authentication and authorization;
3. request id and payload fingerprint;
4. source identity validity;
5. Character identity and local eligibility freshness;
6. Binding selection or explicit Definition authorization;
7. Definition publication and activation;
8. parameter schema and bounds;
9. evaluation context construction;
10. eligibility conditions;
11. repeatability scope derivation;
12. duplicate and capacity checks;
13. component type and owner registration;
14. expression evaluation and numeric bounds;
15. component reference validation;
16. claim and expiration calculation;
17. aggregate creation.

A failure at an earlier stage prevents later side effects.

### EvaluateBoundSourceEvent behavior

For each matching active Binding, the command:

1. verifies source producer and schema;
2. constructs a Binding-specific request identity;
3. resolves the Definition version deterministically;
4. maps allowlisted source fields to parameters;
5. evaluates conditions;
6. creates, skips, or rejects one independent logical decision;
7. records the Binding version and source Event identity.

One failing Binding MUST NOT roll back unrelated successful Binding decisions from the same source Event. Each Binding evaluation is an isolated operation.

### RequestRewardGrant behavior

The command accepts a trusted producer request referencing:

- Character;
- Reward Definition key and optional allowed version selector;
- stable request id;
- source identity;
- bounded parameters;
- optional requested presentation context;
- expected definition fingerprint when strict pinning is required.

The producer cannot supply arbitrary Components unless using a dedicated administrative typed Definition workflow.

### Repeatability reservation

The Engine derives a normalized scope key. It then performs one transaction that:

- locks or creates the scope counter;
- verifies the limit;
- increments or reserves capacity;
- inserts the Grant with its unique deduplication key.

A concurrent loser returns the existing Grant or a deterministic skip result.

### Component planning

Planning resolves every dynamic value once.

The stored plan includes:

- final component type and schema version;
- final owner Engine;
- final integer or fixed-precision quantity;
- final payload;
- target definition references;
- requiredness;
- order;
- retry and timeout policy snapshot;
- reversal policy snapshot;
- stable fulfillment id.

Later retries MUST use this stored plan, not re-evaluate current configuration.

### ClaimRewardGrant behavior

The command:

1. authenticates the acting User or service;
2. authorizes control of the Character;
3. loads the aggregate with an expected version or lock;
4. verifies `PENDING_CLAIM`;
5. checks server time against claim window;
6. records Claim identity and timestamp;
7. transitions to `FULFILLMENT_PENDING`;
8. creates component outbox requests;
9. appends ledger and lifecycle Events;
10. commits atomically.

A repeated Claim returns the existing result. A Claim after expiry returns the terminal expiry outcome.

### RecordFulfillmentSucceeded behavior

The command:

1. validates that the producer owns the Component Type;
2. correlates `reward_grant_id`, `component_id`, and `fulfillment_id`;
3. validates immutable request fingerprint;
4. treats an identical duplicate receipt as an accepted no-op;
5. rejects contradictory receipts into reconciliation;
6. stores the owner operation and applied-value receipt;
7. marks the Component fulfilled;
8. unblocks ordered Components;
9. recalculates Grant state;
10. appends ledger and outgoing Events.

The owner’s applied values may differ from requested values only when the Component contract explicitly permits a deterministic capped or accepted-no-op result. The difference MUST be visible in the receipt.

### RecordFulfillmentFailed behavior

The command classifies the failure using owner-provided and local policy.

For retryable failure it:

- stores the attempt result;
- calculates bounded retry time;
- marks retry scheduled;
- keeps the Grant non-terminal.

For terminal failure it:

- marks the Component terminal;
- evaluates optional versus required policy;
- dispatches no dependent ordered Components unless policy allows;
- transitions the Grant to warning, partial, failed, or compensation workflow;
- publishes an explicit failure Event.

### Retry scheduling

Retry calculation MUST be deterministic from:

- attempt count;
- component retry policy snapshot;
- owner `retry_after` when trusted and bounded;
- current server time;
- configured jitter method.

Jitter may vary physical dispatch time but MUST NOT alter request semantics.

### ExpireRewardGrant behavior

Expiry uses an idempotent scheduled command with expected status and deadline.

It:

- locks the Grant;
- confirms it remains claimable and expired;
- transitions to `EXPIRED`;
- applies configured repeatability reservation behavior;
- appends ledger;
- publishes `reward.expired`.

### RequestRewardRevocation behavior

The command requires:

- original Grant id;
- reason code;
- case or source correction reference;
- actor and authorization;
- expected aggregate version;
- requested scope: all fulfilled components or an explicitly permitted subset;
- impact plan fingerprint;
- approval context when required.

The Engine builds reversal records from immutable receipts and dispatches typed owner requests. It does not compute foreign-state corrections itself.

### Cancellation behavior

Cancellation is allowed only before any Component is fulfilled unless a revocation workflow is used.

A pending claim may be cancelled by an authorized source or administrator according to Definition policy. Cancellation consumes or releases repeatability capacity explicitly.

### Optimistic concurrency

Interactive commands SHOULD require `If-Match` or an `expected_aggregate_version`.

Event handlers use row locks or atomic compare-and-swap. Conflicts are retried from fresh state with the same operation identity.

### Canonical serialization

Request fingerprints, Definition fingerprints, and state hashes MUST use:

- stable field ordering;
- normalized Unicode where strings are permitted;
- explicit numeric scale;
- UTC timestamps with declared precision;
- omitted-field versus null semantics;
- schema-version-specific canonicalization.

### State hash

The state hash covers semantic aggregate state but excludes volatile fields such as last projection timestamp or physical retry worker id.

It supports reconciliation, not authorization.

---
## State Model

### Reward Definition state

```json
{
  "rewardDefinitionKey": "school.lesson.first_attendance",
  "displayNameKey": "reward.school.first_attendance.name",
  "category": "MILESTONE",
  "tags": ["school", "onboarding"],
  "defaultClaimPolicy": "AUTOMATIC",
  "defaultRepeatability": "ONCE_PER_CHARACTER",
  "ownerNamespace": "school",
  "createdAt": "2026-07-18T00:00:00Z"
}
```

The stable Definition record contains identity and ownership metadata only. Semantic behavior belongs to versions.

### Reward Definition Version state

```json
{
  "rewardDefinitionVersionId": "uuid",
  "rewardDefinitionKey": "school.lesson.first_attendance",
  "version": 3,
  "status": "ACTIVE",
  "fingerprint": "sha256:...",
  "effectiveFrom": "2026-08-01T00:00:00Z",
  "effectiveUntil": null,
  "scope": {
    "tenantId": null,
    "realmKey": "global",
    "environment": "production"
  },
  "eligibilityPolicy": {
    "characterStates": ["ACTIVE"],
    "conditions": []
  },
  "repeatabilityPolicy": {
    "mode": "ONCE_PER_CHARACTER",
    "limit": 1,
    "bucket": null,
    "expiryReservationBehavior": "CONSUME"
  },
  "claimPolicy": {
    "mode": "AUTOMATIC",
    "claimWindowSeconds": null
  },
  "components": [],
  "presentation": {},
  "operationalPolicy": {},
  "createdBy": "principal",
  "approvedBy": "principal",
  "publishedAt": "2026-07-25T00:00:00Z"
}
```

### Component Definition state

```json
{
  "componentKey": "base_xp",
  "componentType": "EXPERIENCE",
  "componentSchemaVersion": 1,
  "ownerEngine": "progression",
  "requiredness": "REQUIRED",
  "fulfillmentOrder": 100,
  "payloadTemplate": {
    "trackKey": "core",
    "amountExpression": {
      "op": "constant",
      "value": 100
    }
  },
  "bounds": {
    "minimumAmount": 1,
    "maximumAmount": 100
  },
  "retryPolicyKey": "standard_mutation",
  "reversalPolicy": "SUPPORTED_REQUIRED",
  "presentation": {
    "labelKey": "reward.component.experience",
    "iconRef": "asset:xp-core"
  }
}
```

### Eligibility policy state

Eligibility configuration MUST declare:

- allowed Character lifecycle states;
- source producer constraints;
- source schema constraints;
- bounded Condition tree;
- missing-field behavior;
- stale Character projection behavior;
- evaluation-time semantics;
- decision-trace visibility.

Missing-field behavior is one of:

- `REJECT_CONFIGURATION_ERROR`;
- `CONDITION_FALSE`;
- `USE_DECLARED_DEFAULT`.

Implicit null coercion is prohibited.

### Expression state

A versioned AST is preferred over a string expression.

Example:

```json
{
  "expressionVersion": 1,
  "resultType": "INT64",
  "rounding": "FLOOR",
  "ast": {
    "op": "clamp",
    "minimum": 10,
    "maximum": 500,
    "value": {
      "op": "multiply",
      "left": {"op": "field", "path": "parameters.baseUnits"},
      "right": {"op": "constant", "value": 2}
    }
  }
}
```

Every field path MUST be declared in the Binding or explicit request parameter schema. Unknown paths reject publication.

### Trigger Binding state

```json
{
  "triggerBindingVersionId": "uuid",
  "bindingKey": "school.lesson.completed.first_attendance",
  "version": 2,
  "status": "ACTIVE",
  "sourceEventType": "lesson.completed.v1",
  "sourceSchemaVersions": [1],
  "allowedProducers": ["school-module"],
  "priority": 100,
  "stopProcessing": false,
  "definitionSelector": {
    "rewardDefinitionKey": "school.lesson.first_attendance",
    "mode": "ACTIVE_AT_SOURCE_OCCURRED_AT"
  },
  "conditions": [],
  "parameterMappings": {},
  "effectiveFrom": "2026-08-01T00:00:00Z",
  "effectiveUntil": null,
  "fingerprint": "sha256:..."
}
```

### Definition version selection

Supported selection modes:

- `ACTIVE_AT_EVALUATION_TIME`;
- `ACTIVE_AT_SOURCE_OCCURRED_AT`;
- `PINNED_VERSION`.

The selected mode is part of the Binding version.

`ACTIVE_AT_SOURCE_OCCURRED_AT` is recommended for delayed delivery when the business meaning should match the policy active when the action happened. It requires trustworthy producer timestamps and bounded lateness policy.

### Character eligibility projection state

```json
{
  "characterId": "uuid",
  "lifecycleState": "ACTIVE",
  "rewardRestriction": "NONE",
  "sourceSequence": 42,
  "sourceEventId": "uuid",
  "observedAt": "2026-07-18T12:00:00Z",
  "projectionVersion": 7
}
```

The projection MUST NOT include profile biography, display name, avatar, or unrelated personal data.

### Talent effect-set projection state

```json
{
  "characterId": "uuid",
  "effectScope": "reward-calculation",
  "effectRevision": 31,
  "effectFingerprint": "sha256:...",
  "effects": [],
  "sourceEventId": "uuid",
  "observedAt": "2026-07-18T12:00:00Z"
}
```

The payload is a complete snapshot. A greater revision replaces the prior
snapshot atomically; effects are never appended to the previous set. Gaps or a
fingerprint conflict trigger retry or reconciliation.

### Repeatability counter state

```json
{
  "scopeKeyHash": "sha256:...",
  "characterId": "uuid",
  "rewardDefinitionKey": "school.lesson.first_attendance",
  "scopeType": "CHARACTER_DEFINITION",
  "scopeValue": "...",
  "bucketStart": null,
  "bucketEnd": null,
  "grantedOrReservedCount": 1,
  "releasedCount": 0,
  "version": 1,
  "updatedAt": "2026-07-18T12:00:00Z"
}
```

The effective consumed count is derived from immutable counter operations or represented by explicitly versioned mutable totals backed by an append-only counter ledger.

### Reward Grant state

```json
{
  "rewardGrantId": "uuid",
  "characterId": "uuid",
  "state": "FULFILLING",
  "rewardDefinitionKey": "school.lesson.first_attendance",
  "rewardDefinitionVersionId": "uuid",
  "definitionFingerprint": "sha256:...",
  "triggerBindingVersionId": "uuid",
  "requestId": "binding-event:...",
  "requestFingerprint": "sha256:...",
  "source": {
    "eventId": "uuid",
    "eventType": "lesson.completed.v1",
    "producer": "school-module",
    "entityType": "lesson_completion",
    "entityId": "uuid",
    "occurredAt": "2026-07-18T10:00:00Z"
  },
  "repeatabilityScopeHash": "sha256:...",
  "claimMode": "AUTOMATIC",
  "claimAvailableAt": null,
  "claimExpiresAt": null,
  "claimedAt": null,
  "createdAt": "2026-07-18T10:00:01Z",
  "updatedAt": "2026-07-18T10:00:02Z",
  "terminalAt": null,
  "aggregateVersion": 3,
  "stateHash": "sha256:..."
}
```

### Reward Component state

```json
{
  "componentId": "uuid",
  "rewardGrantId": "uuid",
  "componentKey": "base_xp",
  "componentType": "EXPERIENCE",
  "ownerEngine": "progression",
  "requiredness": "REQUIRED",
  "fulfillmentOrder": 100,
  "fulfillmentId": "uuid",
  "state": "DISPATCHED",
  "payloadFingerprint": "sha256:...",
  "componentPayload": {
    "trackKey": "core",
    "amount": 100
  },
  "requestedAt": "2026-07-18T10:00:01Z",
  "fulfilledAt": null,
  "ownerOperationId": null,
  "attemptCount": 1,
  "nextAttemptAt": null,
  "lastFailureCode": null,
  "version": 2
}
```

### Fulfillment receipt state

A receipt MUST store:

- owner producer identity;
- owner operation id;
- owner aggregate id where relevant;
- owner aggregate version where relevant;
- requested payload fingerprint;
- applied outcome;
- accepted-no-op indicator;
- result Event id;
- result timestamp;
- optional reversible amount or reference;
- sanitized owner metadata.

The applied outcome is typed by Component Type schema.

### Fulfillment attempt state

Attempts record physical delivery and response behavior:

```json
{
  "attemptId": "uuid",
  "fulfillmentId": "uuid",
  "attemptNumber": 2,
  "outboxEventId": "uuid",
  "dispatchedAt": "2026-07-18T10:01:00Z",
  "brokerAcknowledgedAt": "2026-07-18T10:01:00.100Z",
  "responseEventId": null,
  "resultClass": "TIMEOUT",
  "failureCode": "reward.fulfillment_timeout",
  "retryAt": "2026-07-18T10:03:00Z"
}
```

### Claim state

The Grant stores:

- claim mode;
- availability time;
- expiry time;
- claimed time;
- claimant User id or service principal;
- claim operation id;
- accepted-no-op count only in operational metrics, not as aggregate meaning;
- expiry operation id;
- reservation release operation if applicable.

### Presentation state

Presentation snapshot SHOULD include:

- Reward name localization key;
- Reward description localization key;
- category;
- rarity or emphasis token where product policy permits;
- icon or media reference;
- narrative context key;
- ordered component summaries;
- source display reference type;
- claim-call-to-action key;
- disclosure flags for partial or delayed delivery.

Presentation MUST NOT override the technical truth of fulfillment.

### Operation state

Canonical operation statuses:

- `RECEIVED`;
- `PROCESSING`;
- `APPLIED`;
- `ACCEPTED_NOOP`;
- `SKIPPED`;
- `REJECTED`;
- `RETRYABLE_FAILURE`;
- `QUARANTINED`;
- `FAILED_TERMINAL`.

Operations store canonical request fingerprint, actor, source, outcome, linked Grant, and error data.

### Ledger state

Ledger entry types include:

- `GRANT_REQUEST_RECEIVED`;
- `BINDING_MATCHED`;
- `ELIGIBILITY_PASSED`;
- `ELIGIBILITY_SKIPPED`;
- `REPEATABILITY_RESERVED`;
- `REPEATABILITY_RELEASED`;
- `GRANT_CREATED`;
- `CLAIM_MADE`;
- `GRANT_EXPIRED`;
- `FULFILLMENT_PLANNED`;
- `FULFILLMENT_DISPATCHED`;
- `FULFILLMENT_RETRY_SCHEDULED`;
- `COMPONENT_FULFILLED`;
- `COMPONENT_FAILED`;
- `GRANT_COMPLETED`;
- `GRANT_FAILED`;
- `REVOCATION_REQUESTED`;
- `REVERSAL_DISPATCHED`;
- `COMPONENT_REVERSED`;
- `COMPONENT_COMPENSATED`;
- `REVOCATION_COMPLETED`;
- `REPAIR_APPLIED`.

### Derived state

Derived values include:

- fulfilled required component count;
- total required component count;
- fulfilled optional component count;
- failed component count;
- progress percentage for UI;
- next retry time;
- whether support attention is required;
- whether revocation is possible;
- claimability at server time;
- projection freshness.

Derived state MUST NOT replace authoritative stored transition facts.

### Retention state

Reward Grants and ledger records are long-lived platform history.

Retention classifications:

- aggregate core: long-term;
- ledger: append-only long-term;
- source payload snapshot: minimized and policy-limited;
- decision trace: support retention, then reduced or archived where permitted;
- fulfillment attempts: operational retention, then summarized;
- outbox payload: broker recovery retention, then archived;
- personal display projections: rebuildable and deletable.

---

## Events

### Event design principles

All Events MUST be:

- immutable;
- schema-versioned;
- globally identifiable;
- attributable to an authenticated producer;
- timestamped in UTC;
- correlated and causally linked;
- bounded in size;
- safe for at-least-once delivery;
- explicit about aggregate and request identity;
- free of secrets and unnecessary personal data.

### Event envelope

All Reward Events use the exact camelCase canonical envelope from
`002a-platform-contract-standard`.

- Reward Grant lifecycle Events use `rewardGrantId` as `partitionKey`.
- `reward.fulfillment.requested.v1` uses `characterId` so the owner Engine can
  serialize Character state.
- fulfillment and reversal result Events use `rewardGrantId` so Reward Engine
  can serialize saga state.
- derived Events preserve lineage and append the activated Reward Binding token
  to `cycleGuard`.

### Envelope requirements

- The complete canonical field set from `002a-platform-contract-standard` is
  required, including `recordedAt`, actor, subject, realm, lineage, replay, and
  data classification.
- Character-targeted requests MUST carry the Character as subject or in a schema-defined payload field.
- `partitionKey` for Reward Grant lifecycle Events MUST be `rewardGrantId`.
- Producer identity is derived from transport authentication and MUST match the envelope declaration.
- Events outside configured age or future-skew bounds are rejected or quarantined according to source policy.
- Unknown top-level fields are ignored only when schema compatibility explicitly permits them.

### Inbound Events

The Engine consumes:

- source Event types referenced by active Trigger Bindings;
- `reward.grant.requested.v1`;
- `reward.claim.requested.v1` where claims are accepted through Event channels;
- `reward.revoke.requested.v1` from trusted correction workflows;
- typed `reward.fulfillment.succeeded.v1` results;
- typed `reward.fulfillment.failed.v1` results;
- typed `reward.reversal.succeeded.v1` results;
- typed `reward.reversal.failed.v1` results;
- Character lifecycle Events required for the local eligibility projection;
- `talent.effect.set.changed.v1` for the registered `reward-calculation`
  effect scope;
- canonical Season binding, schedule, and participation facts required by an
  active Reward Binding;
- component catalog and definition lifecycle Events required for reference validation;
- operational retry, expiry, and reconciliation commands represented as internal Events.

### Outbound Events

The Engine publishes:

- `reward.grant.accepted.v1`;
- `reward.pending.claim.v1`;
- `reward.claimed.v1`;
- `reward.expired.v1`;
- `reward.fulfillment.requested.v1`;
- `reward.component.fulfilled.v1`;
- `reward.component.failed.v1`;
- `reward.partially.fulfilled.v1`;
- `reward.granted.v1`;
- `reward.granted.with.warnings.v1`;
- `reward.skipped.v1`;
- `reward.rejected.v1`;
- `reward.failed.v1`;
- `reward.revocation.started.v1`;
- `reward.reversal.requested.v1`;
- `reward.component.reversed.v1`;
- `reward.revoked.v1`;
- `reward.revocation.failed.v1`;
- configuration lifecycle Events;
- operational reconciliation Events.

### Event publication ordering

Within one Grant aggregate version, outbox sequence MUST preserve:

1. component or lifecycle fact Events;
2. aggregate summary Event;
3. projection invalidation Event where used.

For initial automatic Grants, `reward.grant.accepted` precedes physical publication of component requests in outbox sequence, although consumers MUST rely on ids rather than wall-clock observation order across topics.

### Event recursion and cycle prevention

Reward outcome Events MAY trigger other Engines, but Trigger Binding publication MUST reject unsafe cycles.

At minimum, validation MUST detect direct cycles such as:

```text
reward.granted → Binding A → same Reward Definition → reward.granted
```

It SHOULD detect bounded multi-Engine cycles represented in the platform Event dependency registry.

Every Grant evaluation carries a causal chain summary with bounded depth. Runtime MUST reject a request that repeats the same Definition identity in the same causal Reward chain unless an explicitly approved recursion policy exists. Version 1 SHOULD prohibit such recursion entirely.

### Rejection behavior

Malformed or unauthorized Events MUST NOT create a Reward Grant.

The Engine records a sanitized operation result and publishes `reward.rejected` only when doing so does not reveal sensitive validation information to an unauthorized producer.

Poison Events are quarantined after bounded attempts.

---

## Event Contracts

### Common Reward Grant summary

Outcome Events SHOULD include:

```json
{
  "rewardGrantId": "uuid",
  "characterId": "uuid",
  "rewardDefinitionKey": "school.lesson.first_attendance",
  "rewardDefinitionVersionId": "uuid",
  "definitionFingerprint": "sha256:...",
  "state": "GRANTED",
  "aggregateVersion": 5,
  "source": {
    "eventId": "uuid",
    "eventType": "lesson.completed.v1",
    "producer": "school-module",
    "entityType": "lesson_completion",
    "entityId": "uuid"
  },
  "presentation": {
    "nameKey": "reward.school.first_attendance.name",
    "category": "MILESTONE",
    "iconRef": "asset:first-lesson"
  },
  "occurredAt": "2026-07-18T12:00:00Z"
}
```

### `reward.grant.requested.v1`

Purpose: request evaluation and creation of a published Reward Definition.

```json
{
  "requestId": "quest-completion:uuid:reward-main",
  "characterId": "uuid",
  "rewardDefinitionKey": "quest.beginner.completed",
  "definitionSelector": {
    "mode": "ACTIVE_AT_SOURCE_OCCURRED_AT",
    "versionId": null,
    "expectedFingerprint": null
  },
  "source": {
    "eventId": "uuid",
    "eventType": "quest.completed.v1",
    "producer": "quest-engine",
    "entityType": "quest_completion",
    "entityId": "uuid",
    "occurredAt": "2026-07-18T11:59:00Z"
  },
  "parameters": {
    "difficultyTier": 2
  },
  "requestedAt": "2026-07-18T12:00:00Z"
}
```

Requirements:

- producer MUST be authorized for the Definition namespace or explicit allowlist;
- `requestId` is stable for retries;
- parameters MUST conform to the Definition input schema;
- source identity MUST be immutable and verifiable;
- producer cannot override component types or owner Engines;
- unknown parameters are rejected unless forward compatibility explicitly allows them.

### `reward.grant.accepted.v1`

Published when a Grant Aggregate is created.

```json
{
  "rewardGrantId": "uuid",
  "requestId": "quest-completion:uuid:reward-main",
  "characterId": "uuid",
  "rewardDefinitionKey": "quest.beginner.completed",
  "rewardDefinitionVersionId": "uuid",
  "claimMode": "AUTOMATIC",
  "state": "FULFILLMENT_PENDING",
  "componentCount": 2,
  "aggregateVersion": 1,
  "acceptedAt": "2026-07-18T12:00:00.010Z"
}
```

This Event means the Reward decision is durably accepted. It does not mean the Components were received.

### `reward.pending.claim.v1`

```json
{
  "rewardGrantId": "uuid",
  "characterId": "uuid",
  "rewardDefinitionKey": "season.weekly.claim",
  "rewardDefinitionVersionId": "uuid",
  "state": "PENDING_CLAIM",
  "claimAvailableAt": "2026-07-18T12:00:00Z",
  "claimExpiresAt": "2026-07-25T12:00:00Z",
  "componentPreview": [
    {
      "componentKey": "xp",
      "componentType": "EXPERIENCE",
      "quantity": 250,
      "labelKey": "reward.component.experience"
    }
  ],
  "aggregateVersion": 1
}
```

### `reward.claim.requested.v1`

```json
{
  "requestId": "uuid",
  "rewardGrantId": "uuid",
  "characterId": "uuid",
  "expectedAggregateVersion": 1,
  "claimedBy": {
    "type": "USER",
    "id": "uuid"
  },
  "requestedAt": "2026-07-19T09:00:00Z"
}
```

Interactive HTTP claim is preferred. Event claims are reserved for trusted platform workflows and MUST still prove Character authorization.

### `reward.claimed.v1`

```json
{
  "rewardGrantId": "uuid",
  "characterId": "uuid",
  "claimOperationId": "uuid",
  "claimedAt": "2026-07-19T09:00:00.010Z",
  "state": "FULFILLMENT_PENDING",
  "aggregateVersion": 2
}
```

### `reward.fulfillment.requested.v1`

This is the generic envelope. The payload body is further validated by Component Type schema.

```json
{
  "rewardGrantId": "uuid",
  "componentId": "uuid",
  "componentKey": "base_xp",
  "fulfillmentId": "uuid",
  "attemptId": "uuid",
  "attemptNumber": 1,
  "characterId": "uuid",
  "componentType": "EXPERIENCE",
  "componentSchemaVersion": 1,
  "ownerEngine": "progression",
  "requiredness": "REQUIRED",
  "requestFingerprint": "sha256:...",
  "rewardDefinitionVersionId": "uuid",
  "sourceEventId": "uuid",
  "componentPayload": {
    "trackKey": "core",
    "amount": 100
  },
  "requestedAt": "2026-07-18T12:00:00.020Z",
  "timeoutAt": "2026-07-18T12:05:00Z"
}
```

Requirements:

- `fulfillmentId` remains stable across attempts;
- `attemptId` changes per physical dispatch;
- owner Engine validates its own schema and Character eligibility;
- owner Engine MUST use `fulfillmentId` as logical idempotency identity;
- owner result MUST echo request fingerprint;
- Reward Engine MUST NOT publish to an arbitrary owner named in user data; owner is resolved from the registry.

### EXPERIENCE fulfillment payload

```json
{
  "trackKey": "core",
  "amount": 100,
  "operationKind": "REWARD_GRANT"
}
```

Progression Engine consumes the generic fulfillment request directly. It
remains authoritative for cap, Level, Prestige, limits, and final applied
amount; no undocumented translation Event is required.

### ITEM fulfillment payload

```json
{
  "itemDefinitionKey": "cosmetic.training_sash",
  "itemDefinitionVersionId": "uuid",
  "quantity": 1,
  "stackingPolicyExpectation": "OWNER_DEFAULT",
  "metadata": {}
}
```

The Inventory Engine remains authoritative for stacking, unique ownership, capacity behavior, and accepted no-op semantics.

### CURRENCY fulfillment payload

```json
{
  "currencyKey": "platform.token",
  "amountMinorUnits": 500,
  "ledgerReason": "REWARD_GRANT"
}
```

Currency precision is defined by the owner contract. The Reward Engine stores integer minor units.

### REPUTATION fulfillment payload

```json
{
  "reputationTrackKey": "school.mastery",
  "amount": 10
}
```

### ENTITLEMENT fulfillment payload

```json
{
  "entitlementKey": "title.first_step",
  "entitlementVersionId": "uuid",
  "quantity": 1
}
```

### `reward.fulfillment.succeeded.v1`

Published by the registered owner Engine.

```json
{
  "rewardGrantId": "uuid",
  "componentId": "uuid",
  "fulfillmentId": "uuid",
  "requestFingerprint": "sha256:...",
  "componentType": "EXPERIENCE",
  "ownerEngine": "progression",
  "ownerOperationId": "uuid",
  "ownerAggregate": {
    "type": "character_progression",
    "id": "uuid",
    "version": 44
  },
  "outcome": {
    "status": "APPLIED",
    "requestedAmount": 100,
    "appliedAmount": 100,
    "acceptedNoop": false
  },
  "fulfilledAt": "2026-07-18T12:00:00.100Z"
}
```

A capped or duplicate accepted no-op is allowed only if the Component Type contract defines it. The outcome must explain the difference.

### `reward.fulfillment.failed.v1`

```json
{
  "rewardGrantId": "uuid",
  "componentId": "uuid",
  "fulfillmentId": "uuid",
  "requestFingerprint": "sha256:...",
  "componentType": "ITEM",
  "ownerEngine": "inventory",
  "ownerOperationId": "uuid",
  "failure": {
    "class": "RETRYABLE",
    "code": "inventory.capacityService.unavailable",
    "messageKey": "reward.fulfillment.temporarily_unavailable",
    "retryable": true,
    "retryAfterSeconds": 30,
    "details": {}
  },
  "failedAt": "2026-07-18T12:00:02Z"
}
```

Sensitive owner errors MUST be sanitized.

### `reward.component.fulfilled.v1`

```json
{
  "rewardGrantId": "uuid",
  "characterId": "uuid",
  "componentId": "uuid",
  "componentKey": "base_xp",
  "componentType": "EXPERIENCE",
  "fulfillmentId": "uuid",
  "ownerOperationId": "uuid",
  "outcome": {
    "requestedQuantity": 100,
    "appliedQuantity": 100,
    "acceptedNoop": false
  },
  "grantState": "PARTIALLY_FULFILLED",
  "aggregateVersion": 4,
  "fulfilledAt": "2026-07-18T12:00:00.110Z"
}
```

### `reward.component.failed.v1`

Includes failure class, retry status, next retry time, requiredness, and current Grant state. It MUST NOT claim terminal Grant failure while retry remains scheduled.

### `reward.partially.fulfilled.v1`

Published on the first transition into partial fulfillment and on material support-relevant changes according to Event coalescing policy.

```json
{
  "rewardGrantId": "uuid",
  "characterId": "uuid",
  "state": "PARTIALLY_FULFILLED",
  "fulfilledRequired": 1,
  "totalRequired": 2,
  "failedRequired": 0,
  "pendingRequired": 1,
  "nextRetryAt": "2026-07-18T12:03:00Z",
  "aggregateVersion": 5
}
```

### `reward.granted.v1`

```json
{
  "rewardGrantId": "uuid",
  "characterId": "uuid",
  "rewardDefinitionKey": "school.lesson.first_attendance",
  "rewardDefinitionVersionId": "uuid",
  "source": {
    "eventId": "uuid",
    "eventType": "lesson.completed.v1",
    "entityType": "lesson_completion",
    "entityId": "uuid"
  },
  "components": [
    {
      "componentId": "uuid",
      "componentKey": "base_xp",
      "componentType": "EXPERIENCE",
      "requestedQuantity": 100,
      "appliedQuantity": 100,
      "ownerOperationId": "uuid"
    }
  ],
  "presentation": {
    "nameKey": "reward.school.first_attendance.name",
    "descriptionKey": "reward.school.first_attendance.description",
    "iconRef": "asset:first-lesson",
    "category": "MILESTONE"
  },
  "grantedAt": "2026-07-18T12:00:00.200Z",
  "aggregateVersion": 6
}
```

This Event is the canonical successful Reward outcome.

### `reward.granted.with.warnings.v1`

Same summary shape as granted, plus explicit optional failures. Consumers MUST treat it as successful for required components but preserve warnings.

### `reward.skipped.v1`

```json
{
  "requestId": "binding-event:...",
  "characterId": "uuid",
  "rewardDefinitionKey": "school.lesson.first_attendance",
  "triggerBindingVersionId": "uuid",
  "reason": {
    "code": "reward.repeatability_limit_reached",
    "messageKey": "reward.skipped.already_received",
    "details": {
      "scopeType": "CHARACTER_DEFINITION"
    }
  },
  "existingRewardGrantId": "uuid",
  "evaluatedAt": "2026-07-18T12:00:00Z"
}
```

The Event MUST NOT expose internal Condition values to untrusted consumers.

### `reward.rejected.v1`

```json
{
  "requestId": "uuid",
  "characterId": "uuid",
  "rewardDefinitionKey": "unknown-key",
  "reason": {
    "code": "reward.definition_unknown",
    "messageKey": "reward.request.invalid",
    "retryable": false
  },
  "rejectedAt": "2026-07-18T12:00:00Z"
}
```

### `reward.failed.v1`

Published when a created Grant reaches terminal failure.

It includes successful, failed, and unresolved Component summaries so downstream support and UX do not lose partial-effect information.

### `reward.expired.v1`

```json
{
  "rewardGrantId": "uuid",
  "characterId": "uuid",
  "rewardDefinitionKey": "season.weekly.claim",
  "claimExpiredAt": "2026-07-25T12:00:00Z",
  "repeatabilityReservationBehavior": "CONSUME",
  "aggregateVersion": 2
}
```

### `reward.revoke.requested.v1`

```json
{
  "requestId": "uuid",
  "rewardGrantId": "uuid",
  "scope": "ALL_FULFILLED_COMPONENTS",
  "reasonCode": "SOURCE_EVENT_REVERSED",
  "sourceCorrection": {
    "eventId": "uuid",
    "eventType": "lesson.completion.reversed.v1"
  },
  "caseReference": "case-123",
  "expectedAggregateVersion": 6,
  "requestedBy": {
    "type": "SERVICE",
    "id": "school-module"
  },
  "requestedAt": "2026-07-19T12:00:00Z"
}
```

### `reward.revocation.started.v1`

Includes the impact plan summary, reversible count, compensatable count, irreversible count, and aggregate version.

### `reward.reversal.requested.v1`

```json
{
  "rewardGrantId": "uuid",
  "componentId": "uuid",
  "fulfillmentId": "uuid",
  "reversalId": "uuid",
  "characterId": "uuid",
  "componentType": "EXPERIENCE",
  "ownerEngine": "progression",
  "originalOwnerOperationId": "uuid",
  "requestFingerprint": "sha256:...",
  "requestedScope": "FULL_APPLIED_EFFECT",
  "reasonCode": "SOURCE_EVENT_REVERSED",
  "componentPayload": {
    "originalAppliedAmount": 100
  },
  "requestedAt": "2026-07-19T12:00:01Z"
}
```

### `reward.reversal.succeeded.v1`

Published by the owner Engine with stable reversal id, owner reversal operation id, actual reversed amount or outcome, and original fulfillment reference.

The payload MUST echo `rewardGrantId`, `componentId`, `fulfillmentId`,
`reversalId`, `characterId`, `componentType`, `ownerEngine`, and
`requestFingerprint`. It includes `ownerOperationId`, a bounded `outcome`, and
`reversedAt`.

### `reward.reversal.failed.v1`

Published by the owner Engine when a reversal cannot currently or permanently
complete. The payload echoes the same correlation identities as the request and
contains the canonical failure object:

```json
{
  "rewardGrantId": "uuid",
  "componentId": "uuid",
  "fulfillmentId": "uuid",
  "reversalId": "uuid",
  "characterId": "uuid",
  "requestFingerprint": "sha256:...",
  "componentType": "EXPERIENCE",
  "ownerEngine": "progression",
  "ownerOperationId": "uuid",
  "failure": {
    "class": "TERMINAL",
    "code": "progression.reversal.notReversible",
    "messageKey": "reward.reversal.not_reversible",
    "retryable": false,
    "retryAfterSeconds": null,
    "details": {}
  },
  "failedAt": "2026-07-19T12:00:02Z"
}
```

The Reward Engine keeps the revocation saga explicit when one or more required
reversals fail. It never treats absence of a result or a timeout as success.

### `reward.revoked.v1`

Published only when the configured revocation completion condition is met.

### Compatibility rules

Event evolution MUST follow:

- additive optional fields within a major schema version where consumers tolerate them;
- new major Event type for breaking semantic changes;
- stable enum meaning;
- no field repurposing;
- explicit deprecation window;
- registry-based producer and consumer compatibility checks;
- replay fixtures for every supported version.

The Engine MUST preserve the ability to interpret historical Events for at least the operational and legal retention period.

---
## Read Models

Read models are projections. They MUST NOT be used as authoritative write state and MAY lag behind committed Grant state.

Every response SHOULD expose projection freshness where stale data can affect user decisions.

### Character Reward Feed

Purpose: chronological user-facing Reward history.

Example:

```json
{
  "characterId": "uuid",
  "items": [
    {
      "rewardGrantId": "uuid",
      "state": "GRANTED",
      "rewardDefinitionKey": "school.lesson.first_attendance",
      "presentation": {
        "nameKey": "reward.school.first_attendance.name",
        "descriptionKey": "reward.school.first_attendance.description",
        "iconRef": "asset:first-lesson",
        "category": "MILESTONE"
      },
      "componentSummary": [
        {
          "componentType": "EXPERIENCE",
          "requestedQuantity": 100,
          "appliedQuantity": 100,
          "labelKey": "reward.component.experience"
        }
      ],
      "sourceDisplay": {
        "type": "lesson_completion",
        "referenceId": "uuid",
        "labelKey": "source.lesson.completed"
      },
      "createdAt": "2026-07-18T12:00:00Z",
      "grantedAt": "2026-07-18T12:00:00.200Z"
    }
  ],
  "nextCursor": null,
  "projection": {
    "generatedAt": "2026-07-18T12:00:01Z",
    "sourceAggregateVersion": 6
  }
}
```

Rules:

- default feed excludes rejected technical requests;
- skipped decisions are shown only when product policy says the explanation benefits the Character;
- partial and failed Grants are visible when any component may have applied;
- sensitive source details are filtered by authorization;
- cursor ordering uses `(effective_time, reward_grant_id)` for stability.

### Claimable Reward Inbox

Purpose: list `PENDING_CLAIM` Grants available to a Character.

Fields:

- Reward Grant id;
- presentation snapshot;
- component preview;
- available and expiry times;
- server time;
- claim eligibility;
- blocking reason when temporarily unavailable;
- aggregate version for optimistic concurrency.

Expired Grants MUST disappear only after authoritative expiry or be returned with a non-claimable expired marker during bounded projection lag.

### Reward Grant Detail

Purpose: authoritative or near-authoritative explanation of one Grant.

It contains:

- identity and state;
- Definition identity and presentation;
- source summary;
- claim state;
- every Component with requested and applied outcome;
- pending retry status;
- warning and failure summaries;
- revocation state;
- lifecycle timeline;
- user-safe explanation keys;
- projection freshness.

The public response MUST NOT expose internal producer secrets, raw condition traces, support case ids, or unrestricted source payload.

### Reward Component Status

Purpose: support asynchronous UI updates.

```json
{
  "rewardGrantId": "uuid",
  "state": "PARTIALLY_FULFILLED",
  "progress": {
    "fulfilledRequired": 1,
    "totalRequired": 2,
    "fulfilledOptional": 0,
    "totalOptional": 0
  },
  "components": [
    {
      "componentKey": "xp",
      "state": "FULFILLED",
      "appliedQuantity": 100
    },
    {
      "componentKey": "item",
      "state": "RETRY_SCHEDULED",
      "nextRetryAt": "2026-07-18T12:03:00Z",
      "userMessageKey": "reward.delivery.pending"
    }
  ]
}
```

### Reward Catalog

Purpose: expose published Reward presentation and claim behavior when products need previews.

The catalog MUST distinguish:

- active public Rewards;
- hidden operational Rewards;
- secret or discovery-based Rewards;
- retired versions;
- Module or realm scope.

A hidden Reward MUST NOT leak through catalog enumeration.

### Reward Eligibility Preview

A limited preview MAY be exposed to trusted internal tools.

It is advisory because source Event truth and repeatability may change before an actual request. It MUST NOT be presented to end users as guaranteed unless a Grant is already created.

### Reward Grant History

Administrative history includes:

- all aggregate versions;
- ledger entries;
- operations;
- source and causal references;
- component attempts and receipts;
- retries;
- reconciliation issues;
- revocation records;
- actor and approval context.

### Definition Catalog View

Fields:

- Definition key;
- owner namespace;
- active version;
- lifecycle status;
- activation scope and window;
- component summary;
- repeatability and claim policy;
- linked Bindings;
- validation and approval status;
- Grant volume and failure indicators;
- last updated metadata.

### Definition Version Detail

Includes immutable semantic JSON, canonical fingerprint, authoring diff, references, validation report, simulation report, approvals, activation history, and affected Grant counts.

### Trigger Binding View

Includes source Event contract, producer allowlist, selection mode, priority, conditions, parameter mappings, cycle analysis, activation, and observed match/skip/error rates.

### Operations Queue View

Shows:

- pending source evaluations;
- pending fulfillment dispatch;
- retry schedule;
- owner backlog;
- timed-out fulfillments;
- quarantined operations;
- pending expirations;
- pending revocations.

### Reconciliation View

Shows:

- aggregate and ledger hash mismatch;
- missing outbox or receipt;
- owner acknowledgement without local state;
- local fulfilled state without valid owner receipt;
- contradictory outcomes;
- stale pending Grants;
- repeatability counter divergence;
- projection lag.

### Projection rebuild

Every projection MUST be rebuildable from authoritative database state and immutable Events or ledger records.

Projection rebuild MUST:

- use generation identifiers;
- avoid destructive replacement before validation;
- preserve cursor correctness;
- compare counts and sampled records;
- support rollback to the prior generation;
- expose rebuild progress and lag.

---

## Write Models

Write models are commands. External systems MUST NOT mutate Reward Engine tables directly.

### RewardGrantRequestCommand

```json
{
  "requestId": "uuid-or-stable-producer-key",
  "characterId": "uuid",
  "rewardDefinitionKey": "quest.beginner.completed",
  "definitionSelector": {
    "mode": "ACTIVE_AT_SOURCE_OCCURRED_AT",
    "versionId": null,
    "expectedFingerprint": null
  },
  "source": {
    "eventId": "uuid",
    "eventType": "quest.completed.v1",
    "producer": "quest-engine",
    "entityType": "quest_completion",
    "entityId": "uuid",
    "occurredAt": "2026-07-18T11:59:00Z"
  },
  "parameters": {},
  "expectedCharacterProjectionVersion": null
}
```

### RewardClaimCommand

```json
{
  "requestId": "uuid",
  "rewardGrantId": "uuid",
  "characterId": "uuid",
  "expectedAggregateVersion": 1,
  "actor": {
    "type": "USER",
    "id": "uuid"
  }
}
```

### RewardRevocationCommand

```json
{
  "requestId": "uuid",
  "rewardGrantId": "uuid",
  "scope": "ALL_FULFILLED_COMPONENTS",
  "componentIds": [],
  "reasonCode": "SOURCE_EVENT_REVERSED",
  "caseReference": "case-123",
  "sourceCorrectionEventId": "uuid",
  "expectedAggregateVersion": 6,
  "impactPlanFingerprint": "sha256:...",
  "approvalId": "uuid",
  "actor": {
    "type": "SERVICE",
    "id": "school-module"
  }
}
```

### OptionalComponentAbandonCommand

Only authorized operations roles may abandon an optional component after retry exhaustion.

Required fields:

- Grant and Component ids;
- expected versions;
- terminal failure reference;
- reason code;
- case reference;
- actor;
- approval when configured.

### PendingGrantCancelCommand

Allowed only before successful fulfillment.

The command declares repeatability reservation handling and requires Definition policy compatibility.

### RewardRepairCommand

Generated by reconciliation tooling, never free-form.

It contains:

- issue id;
- expected aggregate and component versions;
- deterministic repair actions;
- dry-run state hash;
- expected post-repair state hash;
- approval context;
- actor;
- reason.

### GrantMutationResult

```json
{
  "operationId": "uuid",
  "requestId": "uuid",
  "outcome": "APPLIED",
  "rewardGrantId": "uuid",
  "state": "FULFILLMENT_PENDING",
  "aggregateVersion": 1,
  "idempotentReplay": false,
  "createdAt": "2026-07-18T12:00:00Z"
}
```

### Definition Draft Write Model

A Draft contains:

- Definition identity;
- input parameter schema;
- eligibility policy;
- repeatability policy;
- claim and expiration policy;
- ordered Components;
- typed expressions;
- presentation metadata;
- operational policy;
- revocation policy;
- fixtures and expected simulations;
- author notes;
- change reason.

### Trigger Binding Draft Write Model

Contains:

- Binding identity;
- source Event type and schema range;
- allowed producers;
- activation scope;
- Definition selector;
- conditions;
- parameter mappings;
- priority and stop-processing policy;
- lateness policy;
- fixtures;
- cycle exemptions, which require explicit approval.

### Bulk Grant Job Write Model

Bulk granting is asynchronous and references a published Definition.

It MUST include:

- immutable audience selection snapshot or uploaded Character id file hash;
- reason and campaign reference;
- Definition version pin;
- parameter template;
- per-Character request-id derivation;
- maximum audience count;
- rate and concurrency limits;
- dry-run report;
- approval;
- schedule;
- cancellation policy.

A bulk job creates one independent Grant request per Character. It MUST NOT create one cross-Character transaction.

### Canonical error model

```json
{
  "error": {
    "code": "reward.repeatability_limit_reached",
    "messageKey": "reward.request.not_available",
    "retryable": false,
    "correlationId": "uuid",
    "details": {
      "existingRewardGrantId": "uuid"
    }
  }
}
```

Error details are authorization-filtered.

---

## Database Schema

### General storage rules

The reference schema uses PostgreSQL types and syntax.

Requirements:

- UUIDs or equivalent globally unique ids;
- `TIMESTAMPTZ` in UTC;
- int64-compatible `BIGINT` for integer quantities and counters;
- fixed-precision `NUMERIC` only when a registered component requires it;
- `JSONB` only for schema-validated bounded documents;
- explicit foreign keys within the Reward Engine database;
- no foreign keys to another Engine database;
- check constraints for local enum and numeric invariants;
- immutable published semantic rows;
- append-only ledger and receipt history;
- partitioning based on measured volume, not premature assumption.

Application-level validation remains required in addition to database constraints.

### Entity relationship overview

```text
reward_definition
    └── reward_definition_version
           ├── reward_component_definition
           ├── reward_definition_activation
           └── reward_definition_validation

reward_trigger_binding
    └── reward_trigger_binding_version
           └── reward_binding_activation

reward_grant
    ├── reward_grant_component
    │      ├── reward_fulfillment_attempt
    │      ├── reward_fulfillment_receipt
    │      └── reward_component_reversal
    ├── reward_grant_claim
    ├── reward_operation
    └── reward_ledger_entry

reward_repeatability_scope
    └── reward_repeatability_ledger

reward_inbox_event
reward_outbox_event
reward_character_eligibility
reward_reconciliation_issue
reward_bulk_job
    └── reward_bulk_job_item
```

### Extensions and enum posture

Database-native enums MAY be used when operational migration is mature. Portable implementations may use `VARCHAR` plus check constraints.

Semantic enum values MUST be centrally defined in code and schema migration tests.

### `reward_definition`

```sql
CREATE TABLE reward_definition (
    reward_definition_id       UUID PRIMARY KEY,
    reward_definition_key      VARCHAR(160) NOT NULL UNIQUE,
    owner_namespace            VARCHAR(96) NOT NULL,
    category                   VARCHAR(64) NOT NULL,
    visibility_class           VARCHAR(32) NOT NULL,
    created_at                 TIMESTAMPTZ NOT NULL,
    created_by                 VARCHAR(160) NOT NULL,
    archived_at                TIMESTAMPTZ NULL,
    archived_by                VARCHAR(160) NULL,
    CONSTRAINT ck_reward_definition_key
        CHECK (reward_definition_key ~ '^[a-z0-9][a-z0-9._-]{2,159}$')
);
```

### `reward_definition_version`

```sql
CREATE TABLE reward_definition_version (
    reward_definition_version_id UUID PRIMARY KEY,
    reward_definition_id         UUID NOT NULL REFERENCES reward_definition(reward_definition_id),
    version_number               INTEGER NOT NULL,
    lifecycle_status             VARCHAR(32) NOT NULL,
    semantic_document            JSONB NOT NULL,
    input_schema                 JSONB NOT NULL,
    eligibility_policy           JSONB NOT NULL,
    repeatability_policy         JSONB NOT NULL,
    claim_policy                 JSONB NOT NULL,
    presentation                 JSONB NOT NULL,
    operational_policy           JSONB NOT NULL,
    revocation_policy            JSONB NOT NULL,
    semantic_fingerprint         VARCHAR(96) NOT NULL,
    schema_version               INTEGER NOT NULL,
    created_at                   TIMESTAMPTZ NOT NULL,
    created_by                   VARCHAR(160) NOT NULL,
    validated_at                 TIMESTAMPTZ NULL,
    validated_by                 VARCHAR(160) NULL,
    approved_at                  TIMESTAMPTZ NULL,
    approved_by                  VARCHAR(160) NULL,
    published_at                 TIMESTAMPTZ NULL,
    published_by                 VARCHAR(160) NULL,
    retired_at                   TIMESTAMPTZ NULL,
    UNIQUE (reward_definition_id, version_number),
    UNIQUE (semantic_fingerprint),
    CONSTRAINT ck_reward_definition_version_number CHECK (version_number > 0),
    CONSTRAINT ck_reward_definition_schema_version CHECK (schema_version > 0)
);
```

Published rows MUST be protected from semantic `UPDATE` and `DELETE` by application policy and SHOULD be protected by database trigger or restricted role.

### `reward_component_definition`

```sql
CREATE TABLE reward_component_definition (
    reward_component_definition_id UUID PRIMARY KEY,
    reward_definition_version_id   UUID NOT NULL REFERENCES reward_definition_version(reward_definition_version_id),
    component_key                  VARCHAR(96) NOT NULL,
    component_type                 VARCHAR(64) NOT NULL,
    component_schema_version       INTEGER NOT NULL,
    owner_engine                   VARCHAR(96) NOT NULL,
    requiredness                   VARCHAR(32) NOT NULL,
    fulfillment_order              INTEGER NOT NULL,
    payload_template               JSONB NOT NULL,
    quantity_expression            JSONB NULL,
    bounds                         JSONB NOT NULL,
    retry_policy                   JSONB NOT NULL,
    reversal_policy                JSONB NOT NULL,
    presentation                   JSONB NOT NULL,
    semantic_fingerprint           VARCHAR(96) NOT NULL,
    UNIQUE (reward_definition_version_id, component_key),
    CONSTRAINT ck_component_order CHECK (fulfillment_order >= 0),
    CONSTRAINT ck_component_schema_version CHECK (component_schema_version > 0)
);
```

### `reward_definition_activation`

```sql
CREATE TABLE reward_definition_activation (
    activation_id                  UUID PRIMARY KEY,
    reward_definition_id           UUID NOT NULL REFERENCES reward_definition(reward_definition_id),
    reward_definition_version_id   UUID NOT NULL REFERENCES reward_definition_version(reward_definition_version_id),
    environment_key                VARCHAR(64) NOT NULL,
    tenant_id                      UUID NULL,
    realm_key                      VARCHAR(96) NULL,
    effective_from                 TIMESTAMPTZ NOT NULL,
    effective_until                TIMESTAMPTZ NULL,
    status                         VARCHAR(32) NOT NULL,
    priority                       INTEGER NOT NULL DEFAULT 0,
    created_at                     TIMESTAMPTZ NOT NULL,
    created_by                     VARCHAR(160) NOT NULL,
    superseded_at                  TIMESTAMPTZ NULL,
    CONSTRAINT ck_definition_activation_window
        CHECK (effective_until IS NULL OR effective_until > effective_from)
);

CREATE INDEX ix_reward_definition_activation_lookup
    ON reward_definition_activation
    (reward_definition_id, environment_key, tenant_id, realm_key, effective_from, effective_until)
    WHERE status IN ('SCHEDULED', 'ACTIVE');
```

Overlap exclusion SHOULD be implemented with PostgreSQL range constraints or publication transaction validation.

### `reward_definition_validation`

```sql
CREATE TABLE reward_definition_validation (
    validation_id                  UUID PRIMARY KEY,
    reward_definition_version_id   UUID NOT NULL REFERENCES reward_definition_version(reward_definition_version_id),
    semantic_fingerprint           VARCHAR(96) NOT NULL,
    validator_version              VARCHAR(64) NOT NULL,
    status                         VARCHAR(32) NOT NULL,
    report                         JSONB NOT NULL,
    fixture_results                JSONB NOT NULL,
    dependency_snapshot            JSONB NOT NULL,
    created_at                     TIMESTAMPTZ NOT NULL,
    created_by                     VARCHAR(160) NOT NULL
);
```

### `reward_trigger_binding`

```sql
CREATE TABLE reward_trigger_binding (
    trigger_binding_id             UUID PRIMARY KEY,
    binding_key                    VARCHAR(180) NOT NULL UNIQUE,
    owner_namespace                VARCHAR(96) NOT NULL,
    created_at                     TIMESTAMPTZ NOT NULL,
    created_by                     VARCHAR(160) NOT NULL,
    archived_at                    TIMESTAMPTZ NULL
);
```

### `reward_trigger_binding_version`

```sql
CREATE TABLE reward_trigger_binding_version (
    trigger_binding_version_id     UUID PRIMARY KEY,
    trigger_binding_id             UUID NOT NULL REFERENCES reward_trigger_binding(trigger_binding_id),
    version_number                 INTEGER NOT NULL,
    lifecycle_status               VARCHAR(32) NOT NULL,
    source_event_type              VARCHAR(180) NOT NULL,
    source_schema_min_version      INTEGER NOT NULL,
    source_schema_max_version      INTEGER NOT NULL,
    allowed_producers              JSONB NOT NULL,
    definition_selector            JSONB NOT NULL,
    condition_document             JSONB NOT NULL,
    parameter_mappings             JSONB NOT NULL,
    priority                       INTEGER NOT NULL,
    stop_processing                BOOLEAN NOT NULL DEFAULT FALSE,
    lateness_policy                JSONB NOT NULL,
    semantic_fingerprint           VARCHAR(96) NOT NULL,
    created_at                     TIMESTAMPTZ NOT NULL,
    created_by                     VARCHAR(160) NOT NULL,
    validated_at                   TIMESTAMPTZ NULL,
    approved_at                    TIMESTAMPTZ NULL,
    published_at                   TIMESTAMPTZ NULL,
    UNIQUE (trigger_binding_id, version_number),
    CONSTRAINT ck_binding_schema_range
        CHECK (source_schema_min_version > 0 AND source_schema_max_version >= source_schema_min_version)
);
```

### `reward_binding_activation`

```sql
CREATE TABLE reward_binding_activation (
    activation_id                  UUID PRIMARY KEY,
    trigger_binding_id             UUID NOT NULL REFERENCES reward_trigger_binding(trigger_binding_id),
    trigger_binding_version_id     UUID NOT NULL REFERENCES reward_trigger_binding_version(trigger_binding_version_id),
    environment_key                VARCHAR(64) NOT NULL,
    tenant_id                      UUID NULL,
    realm_key                      VARCHAR(96) NULL,
    effective_from                 TIMESTAMPTZ NOT NULL,
    effective_until                TIMESTAMPTZ NULL,
    status                         VARCHAR(32) NOT NULL,
    created_at                     TIMESTAMPTZ NOT NULL,
    created_by                     VARCHAR(160) NOT NULL,
    CONSTRAINT ck_binding_activation_window
        CHECK (effective_until IS NULL OR effective_until > effective_from)
);
```

### `reward_grant`

```sql
CREATE TABLE reward_grant (
    reward_grant_id                UUID PRIMARY KEY,
    character_id                   UUID NOT NULL,
    state                          VARCHAR(40) NOT NULL,
    reward_definition_id           UUID NOT NULL REFERENCES reward_definition(reward_definition_id),
    reward_definition_version_id   UUID NOT NULL REFERENCES reward_definition_version(reward_definition_version_id),
    definition_fingerprint         VARCHAR(96) NOT NULL,
    trigger_binding_version_id     UUID NULL REFERENCES reward_trigger_binding_version(trigger_binding_version_id),
    request_id                     VARCHAR(200) NOT NULL,
    request_producer               VARCHAR(120) NOT NULL,
    request_fingerprint            VARCHAR(96) NOT NULL,
    deduplication_key_hash         VARCHAR(96) NOT NULL,
    repeatability_scope_hash       VARCHAR(96) NOT NULL,
    source_event_id                UUID NOT NULL,
    source_event_type              VARCHAR(180) NOT NULL,
    source_producer                VARCHAR(120) NOT NULL,
    source_entity_type             VARCHAR(120) NULL,
    source_entity_id               VARCHAR(200) NULL,
    source_occurred_at             TIMESTAMPTZ NOT NULL,
    evaluation_time                TIMESTAMPTZ NOT NULL,
    evaluation_context             JSONB NOT NULL,
    decision_trace                 JSONB NOT NULL,
    claim_mode                     VARCHAR(32) NOT NULL,
    claim_available_at             TIMESTAMPTZ NULL,
    claim_expires_at               TIMESTAMPTZ NULL,
    claimed_at                     TIMESTAMPTZ NULL,
    presentation_snapshot          JSONB NOT NULL,
    aggregate_version              BIGINT NOT NULL,
    state_hash                     VARCHAR(96) NOT NULL,
    created_at                     TIMESTAMPTZ NOT NULL,
    updated_at                     TIMESTAMPTZ NOT NULL,
    terminal_at                    TIMESTAMPTZ NULL,
    CONSTRAINT uq_reward_request UNIQUE (request_producer, request_id),
    CONSTRAINT uq_reward_dedup UNIQUE (deduplication_key_hash),
    CONSTRAINT ck_reward_grant_version CHECK (aggregate_version > 0),
    CONSTRAINT ck_reward_claim_window CHECK (
        claim_expires_at IS NULL OR
        (claim_available_at IS NOT NULL AND claim_expires_at > claim_available_at)
    )
);

CREATE INDEX ix_reward_grant_character_time
    ON reward_grant (character_id, created_at DESC, reward_grant_id DESC);

CREATE INDEX ix_reward_grant_state_retry
    ON reward_grant (state, updated_at)
    WHERE state IN ('FULFILLMENT_PENDING', 'FULFILLING', 'PARTIALLY_FULFILLED', 'REVOCATION_PENDING', 'REVOCATION_PARTIAL');

CREATE INDEX ix_reward_grant_source
    ON reward_grant (source_producer, source_event_id);
```

For skipped or rejected requests, implementations MAY store a terminal operation without a full `reward_grant` row. The response contract must remain deterministic.

### `reward_grant_component`

```sql
CREATE TABLE reward_grant_component (
    component_id                   UUID PRIMARY KEY,
    reward_grant_id                UUID NOT NULL REFERENCES reward_grant(reward_grant_id),
    component_key                  VARCHAR(96) NOT NULL,
    component_type                 VARCHAR(64) NOT NULL,
    component_schema_version       INTEGER NOT NULL,
    owner_engine                   VARCHAR(96) NOT NULL,
    requiredness                   VARCHAR(32) NOT NULL,
    fulfillment_order              INTEGER NOT NULL,
    fulfillment_id                 UUID NOT NULL UNIQUE,
    state                          VARCHAR(40) NOT NULL,
    payload                        JSONB NOT NULL,
    payload_fingerprint            VARCHAR(96) NOT NULL,
    requested_quantity_int         BIGINT NULL,
    requested_quantity_decimal     NUMERIC(38, 12) NULL,
    applied_outcome                JSONB NULL,
    owner_operation_id             VARCHAR(200) NULL,
    owner_aggregate_type           VARCHAR(120) NULL,
    owner_aggregate_id             VARCHAR(200) NULL,
    owner_aggregate_version        BIGINT NULL,
    attempt_count                  INTEGER NOT NULL DEFAULT 0,
    next_attempt_at                TIMESTAMPTZ NULL,
    last_failure_class             VARCHAR(48) NULL,
    last_failure_code              VARCHAR(160) NULL,
    fulfilled_at                   TIMESTAMPTZ NULL,
    terminal_at                    TIMESTAMPTZ NULL,
    version                        BIGINT NOT NULL,
    created_at                     TIMESTAMPTZ NOT NULL,
    updated_at                     TIMESTAMPTZ NOT NULL,
    UNIQUE (reward_grant_id, component_key),
    CONSTRAINT ck_component_attempt_count CHECK (attempt_count >= 0),
    CONSTRAINT ck_component_quantity_one_kind CHECK (
        NOT (requested_quantity_int IS NOT NULL AND requested_quantity_decimal IS NOT NULL)
    )
);

CREATE INDEX ix_reward_component_dispatch
    ON reward_grant_component (state, next_attempt_at, owner_engine)
    WHERE state IN ('DISPATCH_PENDING', 'RETRY_SCHEDULED', 'REVERSAL_PENDING');
```

### `reward_grant_claim`

```sql
CREATE TABLE reward_grant_claim (
    claim_id                       UUID PRIMARY KEY,
    reward_grant_id                UUID NOT NULL UNIQUE REFERENCES reward_grant(reward_grant_id),
    claim_operation_id             UUID NOT NULL UNIQUE,
    request_id                     VARCHAR(200) NOT NULL,
    actor_type                     VARCHAR(32) NOT NULL,
    actor_id                       VARCHAR(160) NOT NULL,
    request_fingerprint            VARCHAR(96) NOT NULL,
    claimed_at                     TIMESTAMPTZ NOT NULL,
    created_at                     TIMESTAMPTZ NOT NULL
);
```

### `reward_fulfillment_attempt`

```sql
CREATE TABLE reward_fulfillment_attempt (
    attempt_id                     UUID PRIMARY KEY,
    component_id                   UUID NOT NULL REFERENCES reward_grant_component(component_id),
    fulfillment_id                 UUID NOT NULL,
    attempt_number                 INTEGER NOT NULL,
    outbox_event_id                UUID NOT NULL,
    request_fingerprint            VARCHAR(96) NOT NULL,
    state                          VARCHAR(32) NOT NULL,
    dispatched_at                  TIMESTAMPTZ NULL,
    broker_acknowledged_at         TIMESTAMPTZ NULL,
    response_event_id              UUID NULL,
    result_class                   VARCHAR(48) NULL,
    failure_code                   VARCHAR(160) NULL,
    retry_at                       TIMESTAMPTZ NULL,
    created_at                     TIMESTAMPTZ NOT NULL,
    UNIQUE (component_id, attempt_number),
    UNIQUE (outbox_event_id),
    CONSTRAINT ck_fulfillment_attempt_number CHECK (attempt_number > 0)
);
```

### `reward_fulfillment_receipt`

```sql
CREATE TABLE reward_fulfillment_receipt (
    receipt_id                     UUID PRIMARY KEY,
    component_id                   UUID NOT NULL UNIQUE REFERENCES reward_grant_component(component_id),
    fulfillment_id                 UUID NOT NULL UNIQUE,
    result_event_id                UUID NOT NULL UNIQUE,
    request_fingerprint            VARCHAR(96) NOT NULL,
    owner_engine                   VARCHAR(96) NOT NULL,
    owner_operation_id             VARCHAR(200) NOT NULL,
    owner_aggregate                JSONB NULL,
    outcome                        JSONB NOT NULL,
    outcome_fingerprint            VARCHAR(96) NOT NULL,
    accepted_noop                  BOOLEAN NOT NULL,
    fulfilled_at                   TIMESTAMPTZ NOT NULL,
    received_at                    TIMESTAMPTZ NOT NULL
);
```

### `reward_component_reversal`

```sql
CREATE TABLE reward_component_reversal (
    reversal_id                    UUID PRIMARY KEY,
    component_id                   UUID NOT NULL REFERENCES reward_grant_component(component_id),
    original_fulfillment_id        UUID NOT NULL,
    state                          VARCHAR(40) NOT NULL,
    reason_code                    VARCHAR(96) NOT NULL,
    request_fingerprint            VARCHAR(96) NOT NULL,
    owner_reversal_operation_id    VARCHAR(200) NULL,
    reversal_outcome               JSONB NULL,
    attempt_count                  INTEGER NOT NULL DEFAULT 0,
    next_attempt_at                TIMESTAMPTZ NULL,
    requested_at                   TIMESTAMPTZ NOT NULL,
    completed_at                   TIMESTAMPTZ NULL,
    version                        BIGINT NOT NULL,
    UNIQUE (component_id),
    CONSTRAINT ck_reversal_attempt_count CHECK (attempt_count >= 0)
);
```

### `reward_repeatability_scope`

```sql
CREATE TABLE reward_repeatability_scope (
    scope_key_hash                 VARCHAR(96) PRIMARY KEY,
    character_id                   UUID NOT NULL,
    reward_definition_id           UUID NOT NULL REFERENCES reward_definition(reward_definition_id),
    scope_type                     VARCHAR(48) NOT NULL,
    scope_value                    VARCHAR(300) NOT NULL,
    bucket_start                   TIMESTAMPTZ NULL,
    bucket_end                     TIMESTAMPTZ NULL,
    reserved_count                 BIGINT NOT NULL,
    released_count                 BIGINT NOT NULL,
    version                        BIGINT NOT NULL,
    created_at                     TIMESTAMPTZ NOT NULL,
    updated_at                     TIMESTAMPTZ NOT NULL,
    CONSTRAINT ck_repeatability_counts CHECK (
        reserved_count >= 0 AND released_count >= 0 AND released_count <= reserved_count
    )
);

CREATE INDEX ix_repeatability_character_definition
    ON reward_repeatability_scope (character_id, reward_definition_id, bucket_start);
```

### `reward_repeatability_ledger`

```sql
CREATE TABLE reward_repeatability_ledger (
    entry_id                       UUID PRIMARY KEY,
    scope_key_hash                 VARCHAR(96) NOT NULL REFERENCES reward_repeatability_scope(scope_key_hash),
    reward_grant_id                UUID NULL REFERENCES reward_grant(reward_grant_id),
    operation_type                 VARCHAR(32) NOT NULL,
    quantity                       BIGINT NOT NULL,
    before_reserved                BIGINT NOT NULL,
    after_reserved                 BIGINT NOT NULL,
    before_released                BIGINT NOT NULL,
    after_released                 BIGINT NOT NULL,
    reason_code                    VARCHAR(96) NOT NULL,
    operation_id                   UUID NOT NULL,
    created_at                     TIMESTAMPTZ NOT NULL,
    CONSTRAINT ck_repeatability_ledger_quantity CHECK (quantity > 0)
);
```

### `reward_operation`

```sql
CREATE TABLE reward_operation (
    operation_id                   UUID PRIMARY KEY,
    operation_type                 VARCHAR(64) NOT NULL,
    request_id                     VARCHAR(200) NOT NULL,
    producer                       VARCHAR(120) NOT NULL,
    request_fingerprint            VARCHAR(96) NOT NULL,
    reward_grant_id                UUID NULL REFERENCES reward_grant(reward_grant_id),
    character_id                   UUID NULL,
    status                         VARCHAR(40) NOT NULL,
    outcome_code                   VARCHAR(160) NULL,
    outcome                        JSONB NOT NULL,
    correlation_id                 UUID NULL,
    causation_id                   UUID NULL,
    actor_type                     VARCHAR(32) NULL,
    actor_id                       VARCHAR(160) NULL,
    received_at                    TIMESTAMPTZ NOT NULL,
    completed_at                   TIMESTAMPTZ NULL,
    UNIQUE (producer, request_id)
);
```

### `reward_ledger_entry`

```sql
CREATE TABLE reward_ledger_entry (
    ledger_entry_id                UUID PRIMARY KEY,
    reward_grant_id                UUID NOT NULL REFERENCES reward_grant(reward_grant_id),
    component_id                   UUID NULL REFERENCES reward_grant_component(component_id),
    sequence_number                BIGINT NOT NULL,
    entry_type                     VARCHAR(64) NOT NULL,
    aggregate_version              BIGINT NOT NULL,
    operation_id                   UUID NOT NULL REFERENCES reward_operation(operation_id),
    actor_type                     VARCHAR(32) NULL,
    actor_id                       VARCHAR(160) NULL,
    source_event_id                UUID NULL,
    correlation_id                 UUID NULL,
    causation_id                   UUID NULL,
    before_state                   JSONB NULL,
    after_state                    JSONB NULL,
    details                        JSONB NOT NULL,
    created_at                     TIMESTAMPTZ NOT NULL,
    UNIQUE (reward_grant_id, sequence_number)
);

CREATE INDEX ix_reward_ledger_grant_time
    ON reward_ledger_entry (reward_grant_id, sequence_number);
```

Ledger rows are append-only. Database permissions MUST deny update and delete to the normal application role.

### `reward_inbox_event`

```sql
CREATE TABLE reward_inbox_event (
    event_id                       UUID PRIMARY KEY,
    event_type                     VARCHAR(180) NOT NULL,
    schema_version                 INTEGER NOT NULL,
    producer                       VARCHAR(120) NOT NULL,
    partition_key                  VARCHAR(200) NULL,
    event_fingerprint              VARCHAR(96) NOT NULL,
    payload                        JSONB NOT NULL,
    status                         VARCHAR(40) NOT NULL,
    attempt_count                  INTEGER NOT NULL DEFAULT 0,
    next_attempt_at                TIMESTAMPTZ NULL,
    last_error_code                VARCHAR(160) NULL,
    received_at                    TIMESTAMPTZ NOT NULL,
    processed_at                   TIMESTAMPTZ NULL,
    quarantined_at                 TIMESTAMPTZ NULL
);

CREATE INDEX ix_reward_inbox_work
    ON reward_inbox_event (status, next_attempt_at, received_at)
    WHERE status IN ('RECEIVED', 'RETRY_SCHEDULED');
```

### `reward_outbox_event`

```sql
CREATE TABLE reward_outbox_event (
    outbox_event_id                UUID PRIMARY KEY,
    event_type                     VARCHAR(180) NOT NULL,
    schema_version                 INTEGER NOT NULL,
    aggregate_type                 VARCHAR(96) NOT NULL,
    aggregate_id                   UUID NOT NULL,
    aggregate_version              BIGINT NOT NULL,
    partition_key                  VARCHAR(200) NOT NULL,
    destination                    VARCHAR(160) NOT NULL,
    payload                        JSONB NOT NULL,
    payload_fingerprint            VARCHAR(96) NOT NULL,
    sequence_in_transaction        INTEGER NOT NULL,
    status                         VARCHAR(32) NOT NULL,
    attempt_count                  INTEGER NOT NULL DEFAULT 0,
    next_attempt_at                TIMESTAMPTZ NULL,
    created_at                     TIMESTAMPTZ NOT NULL,
    published_at                   TIMESTAMPTZ NULL,
    broker_message_id              VARCHAR(200) NULL,
    UNIQUE (aggregate_id, aggregate_version, sequence_in_transaction)
);

CREATE INDEX ix_reward_outbox_publish
    ON reward_outbox_event (status, next_attempt_at, created_at)
    WHERE status IN ('PENDING', 'RETRY_SCHEDULED');
```

### `reward_character_eligibility`

```sql
CREATE TABLE reward_character_eligibility (
    character_id                   UUID PRIMARY KEY,
    lifecycle_state                VARCHAR(32) NOT NULL,
    reward_restriction             VARCHAR(48) NOT NULL,
    source_sequence                BIGINT NOT NULL,
    source_event_id                UUID NOT NULL,
    projection_version             BIGINT NOT NULL,
    observed_at                    TIMESTAMPTZ NOT NULL,
    updated_at                     TIMESTAMPTZ NOT NULL
);
```

### `reward_reconciliation_issue`

```sql
CREATE TABLE reward_reconciliation_issue (
    issue_id                       UUID PRIMARY KEY,
    reward_grant_id                UUID NULL REFERENCES reward_grant(reward_grant_id),
    component_id                   UUID NULL REFERENCES reward_grant_component(component_id),
    category                       VARCHAR(80) NOT NULL,
    severity                       VARCHAR(32) NOT NULL,
    status                         VARCHAR(32) NOT NULL,
    expected_state_hash            VARCHAR(96) NULL,
    observed_state_hash            VARCHAR(96) NULL,
    details                        JSONB NOT NULL,
    detected_at                    TIMESTAMPTZ NOT NULL,
    acknowledged_at                TIMESTAMPTZ NULL,
    repaired_at                    TIMESTAMPTZ NULL,
    repair_operation_id            UUID NULL,
    approval_context               JSONB NULL
);
```

### `reward_bulk_job`

```sql
CREATE TABLE reward_bulk_job (
    bulk_job_id                    UUID PRIMARY KEY,
    state                          VARCHAR(40) NOT NULL,
    reward_definition_version_id   UUID NOT NULL REFERENCES reward_definition_version(reward_definition_version_id),
    audience_snapshot              JSONB NOT NULL,
    audience_fingerprint           VARCHAR(96) NOT NULL,
    parameter_template             JSONB NOT NULL,
    reason_code                    VARCHAR(96) NOT NULL,
    campaign_reference             VARCHAR(200) NULL,
    total_items                    BIGINT NOT NULL,
    processed_items                BIGINT NOT NULL DEFAULT 0,
    succeeded_items                BIGINT NOT NULL DEFAULT 0,
    skipped_items                  BIGINT NOT NULL DEFAULT 0,
    failed_items                   BIGINT NOT NULL DEFAULT 0,
    rate_limit_per_second          INTEGER NOT NULL,
    created_at                     TIMESTAMPTZ NOT NULL,
    created_by                     VARCHAR(160) NOT NULL,
    approved_at                    TIMESTAMPTZ NULL,
    approved_by                    VARCHAR(160) NULL,
    scheduled_at                   TIMESTAMPTZ NULL,
    started_at                     TIMESTAMPTZ NULL,
    completed_at                   TIMESTAMPTZ NULL,
    CONSTRAINT ck_bulk_job_counts CHECK (
        total_items >= 0 AND processed_items >= 0 AND
        succeeded_items >= 0 AND skipped_items >= 0 AND failed_items >= 0
    )
);
```

### `reward_bulk_job_item`

```sql
CREATE TABLE reward_bulk_job_item (
    bulk_job_id                    UUID NOT NULL REFERENCES reward_bulk_job(bulk_job_id),
    item_sequence                  BIGINT NOT NULL,
    character_id                   UUID NOT NULL,
    derived_request_id             VARCHAR(200) NOT NULL,
    state                          VARCHAR(40) NOT NULL,
    reward_grant_id                UUID NULL REFERENCES reward_grant(reward_grant_id),
    outcome_code                   VARCHAR(160) NULL,
    attempt_count                  INTEGER NOT NULL DEFAULT 0,
    next_attempt_at                TIMESTAMPTZ NULL,
    processed_at                   TIMESTAMPTZ NULL,
    PRIMARY KEY (bulk_job_id, item_sequence),
    UNIQUE (derived_request_id)
);
```

### Partitioning

Potential high-volume tables:

- ledger;
- inbox;
- outbox;
- fulfillment attempts;
- bulk-job items;
- Grant history.

Partitioning MAY use creation month or hash of Character/Grant id after measurement. Partition keys MUST preserve unique constraints through global indexes or key composition.

### Encryption and access

- database storage and backups MUST be encrypted;
- source context and decision trace columns SHOULD support field-level or application-envelope encryption when they can contain sensitive Module data;
- application roles MUST have least privilege;
- ledger and published configuration mutation permissions MUST be separated;
- support query roles MUST access redacted views rather than base tables where practical.

### Backup and recovery

Recovery objectives are defined under Performance. Restore tests MUST verify:

- Grant and component referential integrity;
- inbox/outbox consistency;
- ledger sequence continuity;
- repeatability counters;
- publication activation state;
- ability to resume retries without new logical ids;
- no duplicate owner effects after replay.

---
## API Specification

### API principles

- Commands mutate state; queries do not.
- Public clients cannot create arbitrary Reward Grants.
- Every mutation requires authentication, authorization, idempotency, and audit context.
- Public responses expose user-safe explanations, not raw internal traces.
- Internal service commands use mTLS or equivalent workload identity.
- Administrative endpoints require dedicated scopes and often separation of duties.
- APIs use versioned contracts independent from internal table shape.
- Long-running bulk, publication, replay, and reconciliation work returns asynchronous job resources.
- Cursor pagination is preferred over offsets for mutable histories.
- HTTP success does not imply all Reward Components are fulfilled unless state is `GRANTED` or `GRANTED_WITH_WARNINGS`.

### Public Character APIs

#### `GET /v1/characters/{characterId}/rewards`

Returns the Character Reward Feed.

Query parameters:

- `state` repeated filter;
- `category`;
- `component_type`;
- `created_after` and `created_before` with bounded range;
- `cursor`;
- `limit`, default 25, maximum 100.

Authorization:

- owner or explicitly authorized viewer;
- public visibility is not implied by Character profile visibility;
- source details are filtered.

#### `GET /v1/characters/{characterId}/rewards/claimable`

Returns active `PENDING_CLAIM` Grants.

The response includes server time and projection freshness.

#### `GET /v1/reward-grants/{rewardGrantId}`

Returns user-safe Reward Grant Detail.

A caller who does not control the Character receives `404` rather than existence disclosure unless an explicit sharing policy applies.

#### `POST /v1/reward-grants/{rewardGrantId}:claim`

Headers:

- `Idempotency-Key` REQUIRED;
- `If-Match` RECOMMENDED using aggregate-version ETag.

Request:

```json
{
  "characterId": "uuid"
}
```

Response:

```json
{
  "operationId": "uuid",
  "rewardGrantId": "uuid",
  "state": "FULFILLMENT_PENDING",
  "aggregateVersion": 2,
  "idempotentReplay": false,
  "claimedAt": "2026-07-19T09:00:00Z"
}
```

Possible semantic errors:

- not claimable;
- expired;
- Character not controlled by caller;
- Character lifecycle restricted;
- aggregate version conflict;
- idempotency conflict.

#### `GET /v1/reward-grants/{rewardGrantId}/status`

A compact polling endpoint for pending asynchronous fulfillment.

It SHOULD support conditional GET and return a stable ETag based on aggregate version.

### Internal service APIs

The authoritative integration path is Event-driven. Internal HTTP APIs MAY exist for controlled commands, testing, support workflows, and systems that cannot yet publish Events. They MUST produce the same command and outbox behavior.

#### `POST /internal/v1/reward-grants`

Creates or returns a Reward Grant request result.

Required headers:

- workload authentication;
- `Idempotency-Key`;
- correlation and trace headers.

The service principal is authorized by Definition namespace and producer allowlist.

#### `GET /internal/v1/reward-grants/{rewardGrantId}`

Returns authoritative aggregate detail for trusted services with field-level authorization.

#### `POST /internal/v1/reward-grants/{rewardGrantId}:revoke`

Restricted to correction-capable services and approved source reversal workflows.

It MUST NOT accept arbitrary component mutation payloads.

#### `POST /internal/v1/reward-grants/{rewardGrantId}:cancel`

Restricted to pending, unfulfilled Grants and policy-compatible cancellation.

#### `POST /internal/v1/reward-grants/{rewardGrantId}/components/{componentId}:retry`

Operations-only endpoint. It reuses the existing fulfillment id and immutable payload.

#### `GET /internal/v1/reward-grants:by-request`

Lookup by producer plus request id. Used for idempotent recovery.

### Definition administration APIs

#### `POST /admin/v1/reward-definitions`

Creates a stable Definition identity and initial Draft.

#### `GET /admin/v1/reward-definitions`

Supports filters by namespace, status, component type, category, activation, and owner.

#### `GET /admin/v1/reward-definitions/{definitionKey}`

Returns catalog summary and versions.

#### `POST /admin/v1/reward-definitions/{definitionKey}/versions`

Creates a Draft, optionally cloned from a published version.

#### `PATCH /admin/v1/reward-definition-versions/{versionId}`

Updates a Draft only.

Requires `If-Match` using Draft revision.

#### `POST /admin/v1/reward-definition-versions/{versionId}:validate`

Runs structural, semantic, dependency, cycle, fixture, and simulation validation.

Returns a validation job when historical simulation is large.

#### `POST /admin/v1/reward-definition-versions/{versionId}:approve`

Approves the exact validated fingerprint.

#### `POST /admin/v1/reward-definition-versions/{versionId}:publish`

Creates or confirms the immutable published version.

#### `POST /admin/v1/reward-definition-versions/{versionId}:schedule`

Request:

```json
{
  "environmentKey": "production",
  "tenantId": null,
  "realmKey": "global",
  "effectiveFrom": "2026-08-01T00:00:00Z",
  "effectiveUntil": null,
  "changeReference": "RFC-123"
}
```

#### `POST /admin/v1/reward-definition-versions/{versionId}:retire`

Retires new selection while preserving historical use.

#### `GET /admin/v1/reward-definition-versions/{versionId}/impact`

Returns affected Bindings, pending Grants, historical volume, component owners, revocation risk, and compatibility analysis.

### Trigger Binding administration APIs

#### `POST /admin/v1/reward-trigger-bindings`

Creates a Binding Draft.

#### `PATCH /admin/v1/reward-trigger-binding-versions/{versionId}`

Updates Draft-only fields.

#### `POST /admin/v1/reward-trigger-binding-versions/{versionId}:validate`

Validates source schema, producer authorization, conditions, mappings, Definition selection, overlap, and cycles.

#### `POST /admin/v1/reward-trigger-binding-versions/{versionId}:simulate`

Accepts fixture Events or an authorized historical Event sample and returns matched, skipped, rejected, and resolved component results without creating Grants.

#### `POST /admin/v1/reward-trigger-binding-versions/{versionId}:publish`

Publishes an immutable version after approval.

#### `POST /admin/v1/reward-trigger-binding-versions/{versionId}:schedule`

Schedules activation.

### Support and operations APIs

#### `GET /admin/v1/reward-grants`

Filters:

- Character id;
- Grant id;
- producer and request id;
- source Event id;
- Definition key and version;
- Binding version;
- state;
- component type and owner;
- failure code;
- correlation id;
- case reference;
- time range.

Sensitive searches are audited.

#### `GET /admin/v1/reward-grants/{rewardGrantId}`

Returns authoritative state, sanitized decision trace, ledger, component receipts, retries, and reconciliation issues.

#### `POST /admin/v1/reward-grants/{rewardGrantId}:plan-revocation`

Performs a dry run and returns:

- reversible components;
- compensation requirements;
- irreversible residuals;
- expected owner operations;
- risk level;
- approvals required;
- plan fingerprint.

#### `POST /admin/v1/reward-grants/{rewardGrantId}:revoke`

Executes an approved plan.

#### `POST /admin/v1/reward-grants/{rewardGrantId}:expire`

Emergency or repair endpoint for a claimable Grant whose scheduled expiry worker failed. Server-side deadline validation remains mandatory.

#### `POST /admin/v1/reward-grants/{rewardGrantId}/components/{componentId}:abandon`

Only optional terminal-failed Components may be abandoned, with reason and approval.

#### `GET /admin/v1/reward-operations/{operationId}`

Returns operation state, sanitized request, deterministic outcome, attempts, and linked entities.

#### `POST /admin/v1/reward-operations/{operationId}:retry`

Allowed only for retryable or quarantined operations. Logical request identity remains unchanged.

### Reconciliation APIs

#### `POST /admin/v1/reward-reconciliation:scan`

Starts a bounded scan by Grant range, Character range, Definition, time range, or issue category.

#### `GET /admin/v1/reward-reconciliation/issues`

#### `GET /admin/v1/reward-reconciliation/issues/{issueId}`

#### `POST /admin/v1/reward-reconciliation/issues/{issueId}:plan-repair`

#### `POST /admin/v1/reward-reconciliation/issues/{issueId}:repair`

Repair requires expected state, dry run, plan fingerprint, authorization, and audit.

### Bulk APIs

#### `POST /admin/v1/reward-bulk-jobs:dry-run`

Returns audience count, duplicates, ineligible Character count, expected component volume, estimated owner load, repeatability skips, and risk warnings.

#### `POST /admin/v1/reward-bulk-jobs`

Creates an approved asynchronous job.

#### `GET /admin/v1/reward-bulk-jobs/{jobId}`

#### `POST /admin/v1/reward-bulk-jobs/{jobId}:pause`

#### `POST /admin/v1/reward-bulk-jobs/{jobId}:resume`

#### `POST /admin/v1/reward-bulk-jobs/{jobId}:cancel`

Cancellation stops undispatched items. Existing Grants follow normal lifecycle.

### API idempotency

For every mutation:

- idempotency key scope includes authenticated principal or producer;
- canonical request fingerprint is stored;
- same key plus same fingerprint returns original outcome;
- same key plus different fingerprint returns `409 reward.idempotency_conflict`;
- retention covers the maximum retry and replay period;
- idempotency records are not evicted while the linked Grant can still be retried ambiguously.

### API concurrency

Aggregate mutations use ETag or expected version.

- stale version returns `412` or `409` according to endpoint semantics;
- retry response includes current aggregate version when authorized;
- commands MUST NOT silently overwrite a concurrent claim, expiry, fulfillment, or revocation.

### API status codes

| Status | Usage |
|---:|---|
| `200` | Successful read or idempotent command result. |
| `201` | Definition, Draft, Grant, or job resource created. |
| `202` | Asynchronous job or fulfillment workflow accepted. |
| `204` | Successful operation with no response body. |
| `400` | Malformed request. |
| `401` | Missing or invalid authentication. |
| `403` | Authenticated but unauthorized. |
| `404` | Resource absent or intentionally undisclosed. |
| `409` | Idempotency, lifecycle, activation, or deduplication conflict. |
| `412` | Failed version precondition. |
| `422` | Semantically invalid request or Definition. |
| `429` | Rate or quota limit exceeded. |
| `500` | Unexpected internal failure. |
| `503` | Temporary dependency or capacity failure. |

### Stable error catalog

Initial codes include:

- `reward.event_schema_unsupported`;
- `reward.event_source_unauthorized`;
- `reward.event_timestamp_out_of_bounds`;
- `reward.idempotency_conflict`;
- `reward.request_duplicate`;
- `reward.request_parameters_invalid`;
- `reward.character_unknown`;
- `reward.character_not_eligible`;
- `reward.character_projection_stale`;
- `reward.definition_unknown`;
- `reward.definition_not_active`;
- `reward.definition_version_conflict`;
- `reward.definition_fingerprint_conflict`;
- `reward.binding_unknown`;
- `reward.binding_ambiguous`;
- `reward.binding_cycle_detected`;
- `reward.condition_invalid`;
- `reward.condition_false`;
- `reward.expression_invalid`;
- `reward.expression_overflow`;
- `reward.component_type_unknown`;
- `reward.component_owner_mismatch`;
- `reward.component_reference_invalid`;
- `reward.component_quantity_invalid`;
- `reward.repeatability_limit_reached`;
- `reward.repeatability_scope_conflict`;
- `reward.claim_not_required`;
- `reward.claim_not_available`;
- `reward.claim_expired`;
- `reward.claim_already_completed`;
- `reward.aggregate_version_conflict`;
- `reward.fulfillment_result_unauthorized`;
- `reward.fulfillment_fingerprint_conflict`;
- `reward.fulfillment_result_contradictory`;
- `reward.fulfillment_timeout`;
- `reward.fulfillment_retry_exhausted`;
- `reward.required_component_failed`;
- `reward.optional_component_not_abandonable`;
- `reward.revocation_not_supported`;
- `reward.revocation_requires_approval`;
- `reward.revocation_plan_conflict`;
- `reward.reversal_failed`;
- `reward.reconciliation_required`;
- `reward.bulk_job_limit_exceeded`.

---

## Admin Features

Administrative tooling is a controlled product capability, not a database editor.

### Reward Definition authoring

Authorized content designers MUST be able to:

- create a stable Definition key;
- clone a prior version;
- define typed input parameters;
- add ordered typed Components;
- configure constant or bounded expression quantities;
- configure eligibility and Character-state policy;
- configure repeatability and time buckets;
- configure automatic or claim-required delivery;
- set expiration behavior;
- define presentation keys and asset references;
- configure retries and optionality within platform limits;
- declare revocation behavior;
- add fixtures and expected outcomes;
- submit for validation and review.

The UI MUST never expose raw arbitrary code execution.

### Component editor

For each Component, the authoring interface MUST obtain its form and validation schema from the Component Type Registry.

Examples:

- EXPERIENCE requires Track key and integer amount expression;
- ITEM requires Item Definition reference and quantity;
- CURRENCY requires currency key and minor-unit amount;
- REPUTATION requires track key and integer amount;
- ENTITLEMENT requires entitlement reference.

The UI MUST show the authoritative owner Engine and reversal capability. Authors cannot change the owner manually.

### Expression builder

The builder SHOULD use visual typed operations rather than free-form text.

It MUST show:

- result type;
- field sources;
- rounding;
- minimum and maximum bound;
- overflow behavior;
- sample values;
- canonical AST preview for expert users.

### Eligibility builder

The builder MUST distinguish:

- source validation owned by the producer;
- reward-specific eligibility;
- repeatability;
- Character lifecycle policy;
- activation window.

This prevents content authors from recreating business validation in Reward configuration.

### Repeatability simulator

Authors SHOULD be able to simulate:

- duplicate Event delivery;
- repeated source entities;
- once-per-Character behavior;
- bucket boundaries;
- timezone changes and daylight-saving transitions;
- expired claim capacity release;
- concurrent requests;
- historical replay.

### Claim configuration

The interface MUST clearly show:

- automatic versus claim-required;
- claim availability time;
- deadline;
- server-time semantics;
- expiration outcome;
- repeatability reservation behavior;
- user messaging keys;
- pending Reward visibility.

### Trigger Binding authoring

Authors with Module integration permission can:

- choose a registered Event schema;
- select allowed producers;
- add bounded filters;
- map allowlisted fields to Definition parameters;
- choose Definition version selection time;
- set priority;
- configure lateness limits;
- test fixture Events;
- view overlap and cycle analysis.

The tool MUST prevent binding to unregistered or private Event fields.

### Validation report

Validation MUST include:

#### Structural checks

- required fields and identifiers;
- unique component keys;
- valid lifecycle and policy enums;
- bounded document sizes;
- valid localization and asset reference format;
- valid input schema;
- component count limits.

#### Component checks

- registered Component Type and schema version;
- owner Engine availability;
- valid target definition references;
- positive quantity and declared bounds;
- int64 or fixed-precision safety;
- supported requiredness;
- retry and timeout compatibility;
- reversal policy compatibility;
- order dependency validity.

#### Eligibility and expression checks

- every field path declared;
- no forbidden operation;
- bounded AST depth and node count;
- explicit missing-field behavior;
- explicit rounding;
- no division by zero;
- overflow simulation;
- deterministic time semantics.

#### Repeatability checks

- valid scope inputs;
- explicit timezone for calendar buckets;
- limit greater than zero;
- expiry reservation behavior;
- deduplication compatibility;
- no unbounded cardinality generated from unsafe source strings.

#### Binding checks

- registered Event schema;
- producer authorization;
- Definition selector resolves;
- activation overlap;
- priority ambiguity;
- cycle analysis;
- source timestamp trust and lateness;
- parameter mapping compatibility.

#### Saga checks

- at least one meaningful Component;
- all required owner contracts available;
- no unsupported all-or-nothing promise;
- sequential dependencies form a DAG;
- irreversible Components disclosed;
- optional failure presentation exists;
- revocation plan is coherent.

### Simulation

Simulation MUST be side-effect-free and display:

- selected Binding and Definition version;
- Condition trace;
- repeatability key and decision;
- resolved component payloads;
- claim deadline;
- expected dispatch order;
- owner contract validation;
- potential cap or owner-adjusted behavior as advisory only;
- final predicted Grant state assuming success;
- all warnings.

Historical simulation MUST use authorized redacted Event samples and MUST NOT persist excess source data.

### Definition diff

The diff view MUST distinguish:

- presentation-only changes;
- input schema changes;
- eligibility changes;
- repeatability changes;
- claim and expiry changes;
- component quantity changes;
- component additions and removals;
- requiredness changes;
- owner or schema changes;
- revocation-risk changes;
- activation changes.

Impact analysis SHOULD estimate:

- Grants per day;
- component operations per owner;
- change in total awarded quantities;
- duplicate and skip rates;
- claim expiry volume;
- irreversible Reward exposure;
- affected pending Grants;
- potential notification volume.

### Publication workflow

Production publication SHOULD require:

1. author completes Draft and fixtures;
2. validator produces an exact fingerprint report;
3. reviewer examines diff, simulation, economics, and owner load;
4. security or economy approver reviews high-risk types;
5. publisher schedules immutable activation;
6. monitoring window and rollback owner are recorded.

High-value Currency, rare Items, irreversible entitlements, and large bulk audiences SHOULD require stronger approval.

### Reward support console

Authorized support staff need:

- exact Grant state;
- user-safe and internal explanation;
- source reference;
- Definition and Binding versions;
- repeatability decision;
- component request and receipt;
- pending retry time;
- partial effect warning;
- claim and expiry history;
- revocation eligibility;
- reconciliation issues;
- projection freshness.

The console MUST distinguish authoritative facts from projections and predictions.

### Manual Reward workflow

Support or operations MAY grant only approved Definitions designated for manual use.

The workflow requires:

- Character id;
- published manual Definition;
- reason code;
- case reference;
- bounded parameters;
- preview;
- repeatability decision;
- approval above thresholds;
- deterministic request id;
- audit.

Free-form component payloads and direct quantity edits are prohibited.

### Revocation workflow

The UI MUST:

- show every fulfilled component;
- show owner receipt and applied amount;
- classify reversible, compensatable, and irreversible effects;
- explain potential downstream consequences;
- generate a stable plan;
- require reason and case;
- require approval by risk;
- execute asynchronously;
- surface partial reversal;
- run post-operation reconciliation.

### Dead-letter and quarantine management

Operators need:

- grouped failure reason;
- source producer and schema;
- first and latest attempt;
- sanitized payload;
- affected Definition and owner;
- retry eligibility;
- safe bulk retry with rate limits;
- resolution notes;
- inability to silently discard valid mutation requests.

### Operational dashboard

The dashboard SHOULD show:

- source Event input rate;
- matched, skipped, rejected, and created Grant rates;
- claimable and expiring counts;
- fulfillment latency by owner and type;
- partial and failed Grants;
- retries and timeout age;
- outbox and inbox backlog;
- repeatability conflicts;
- Binding error rates;
- definition-version rollout comparison;
- revocation status;
- reconciliation issues.

### Emergency controls

Authorized operations roles MAY:

- pause one Binding version;
- pause one Definition activation;
- pause a producer;
- pause dispatch to one owner Engine;
- reduce worker concurrency;
- stop a bulk job;
- disable claims for a compromised Definition;
- pause outcome Event publication by type;
- switch projections to a prior generation.

Emergency controls MUST be time-bounded where practical, audited, and visible. They MUST NOT mutate published semantic content.

---

## UX Requirements

### Narrative-first Reward moment

Clients SHOULD present the Reward as the consequence of meaningful action using presentation and source context keys.

A Reward moment SHOULD communicate:

- what was earned;
- why it was earned;
- whether delivery is complete;
- what changed for the Character;
- what can happen next.

Raw ids, internal rule names, and technical owner-Engine terms MUST NOT appear in end-user UI.

### Truthful delivery state

The UI MUST distinguish:

- available to claim;
- claimed and delivering;
- partially delivered;
- fully granted;
- granted with optional warnings;
- failed with possible partial effects;
- expired;
- revoked or partially revoked.

A pending or partial Reward MUST NOT be shown as fully received.

### Claimable Reward UX

Claim UI MUST show:

- Reward name and component preview;
- clear claim action;
- expiration date and time using the user’s display locale;
- authoritative server-time basis;
- disabled state with reason when Character is restricted;
- idempotent loading and retry behavior;
- final delivery progress after claim.

Clients SHOULD refresh server time and Grant status near expiration to avoid misleading local-clock behavior.

### Component summaries

Component presentation is typed.

Examples:

- Experience: `+100 Experience` plus Track display name;
- Item: quantity, item name, and icon;
- Currency: formatted amount using owner-defined precision;
- Reputation: amount and track name;
- Entitlement: unlocked title or cosmetic.

Clients MUST use applied outcome where it differs from requested quantity.

### Partial fulfillment

When one component is delayed:

- already received Components remain visible as received;
- pending Components show a neutral pending state;
- UI provides a support path after a configurable delay;
- clients do not ask the user to repeatedly claim or trigger the source action;
- technical retry details remain hidden unless in support UI.

### Duplicate source action

If the Reward was already granted, user-facing flows SHOULD link to the existing Reward rather than display a generic error.

For secret Rewards, duplicate responses must not leak hidden Definition details beyond what the Character already owns.

### Failure messaging

User messages MUST be stable localization keys categorized as:

- temporary delay;
- not eligible;
- already received;
- expired;
- account restricted;
- support required.

Raw owner errors and stack traces are prohibited.

### Revocation UX

Revocation is usually a support or policy event. When shown to users, the UI MUST explain:

- which Reward was affected;
- which components were removed or compensated;
- which effects remain;
- the high-level reason where policy permits;
- support path.

The UI MUST not erase the original Reward history as though it never happened.

### Accessibility

Reward state MUST not rely on color, motion, or sound alone.

Requirements:

- textual status labels;
- screen-reader ordering for component summaries;
- reduced-motion support;
- no mandatory timed interaction without accessible notice;
- localization-safe number and date formatting;
- sufficient contrast owned by clients.

### Offline and reconnect behavior

Clients MAY optimistically acknowledge that a claim request was submitted, but MUST wait for server response before marking the Claim accepted.

On reconnect, the client fetches Grant status by id. It MUST NOT create a new logical claim id for automatic retries of the same user action.

### Projection lag

When a Reward outcome Event is known but a read projection lags, clients MAY use the command response temporarily and reconcile when the projection catches up.

The UI SHOULD avoid flickering a successful Reward out of history during rebuild or lag.

---

## Security

### Security objectives

The Engine MUST prevent:

- unauthorized Reward creation;
- component quantity manipulation;
- Definition substitution;
- duplicate exploitation;
- claim theft;
- forged owner receipts;
- unsafe expression execution;
- cross-tenant leakage;
- support abuse;
- hidden direct state mutation;
- replay-induced double fulfillment.

### Trust boundaries

Trust boundaries exist between:

- Business Modules and Event infrastructure;
- Event infrastructure and Reward Engine;
- Reward Engine and owner Engines;
- public clients and API;
- administration clients and configuration APIs;
- support staff and sensitive history;
- Reward Engine database and analytics systems.

Every boundary requires authenticated identity, authorization, schema validation, and audit where appropriate.

### Service authentication

Service producers and owner Engines MUST use workload identity such as mTLS, signed service tokens, or cloud-native identity.

Transport identity is authoritative. Envelope `producer` text alone is insufficient.

### Producer authorization

Authorization is scoped by:

- Event type;
- Definition namespace or explicit Definition allowlist;
- tenant or realm;
- environment;
- operation type;
- maximum request rate;
- parameter schema.

A Quest Engine authorized for quest completion Rewards MUST NOT be able to request arbitrary economy administration Rewards.

### Owner receipt authorization

A fulfillment result is accepted only when:

- authenticated producer matches Component Type Registry owner;
- Grant and Component identity match;
- fulfillment id matches;
- request fingerprint matches;
- result schema is valid;
- Event id is new or an identical replay;
- owner operation id is present.

Contradictory results are quarantined and alerted.

### Public authorization

Claim and read APIs verify:

- caller identity;
- Character ownership or delegated control;
- Character lifecycle and restriction state;
- tenant or realm boundary;
- Grant visibility;
- aggregate precondition.

Authorization is checked server-side on every request.

### Administrative RBAC

Recommended scopes:

- `reward.definition.read`;
- `reward.definition.author`;
- `reward.definition.validate`;
- `reward.definition.approve`;
- `reward.definition.publish`;
- `reward.binding.author`;
- `reward.binding.publish`;
- `reward.grant.support.read`;
- `reward.grant.manual.create`;
- `reward.grant.retry`;
- `reward.grant.revoke.plan`;
- `reward.grant.revoke.execute`;
- `reward.bulk.create`;
- `reward.bulk.approve`;
- `reward.reconciliation.read`;
- `reward.reconciliation.repair`;
- `reward.emergency.control`;
- `reward.privacy.read`.

High-risk operations SHOULD require a separate approver.

### Definition integrity

Published configuration MUST be protected by:

- immutable version rows;
- canonical fingerprint;
- signed or audited publication record;
- exact validation fingerprint;
- approval linkage;
- restricted database role;
- deployment and activation history.

Runtime MUST verify the stored fingerprint before use where corruption risk is non-negligible.

### Expression safety

The evaluator MUST enforce:

- allowlisted AST nodes;
- maximum depth;
- maximum node count;
- maximum string and collection size;
- execution step budget;
- integer overflow checks;
- explicit division and rounding;
- no recursion;
- no I/O;
- no reflection;
- no dynamic code;
- no secrets in context.

### Input validation

All payloads require:

- schema validation;
- size limits;
- UTF-8 validation and normalization;
- enum validation;
- identifier format validation;
- numeric bounds;
- timestamp skew checks;
- unknown-field policy;
- nested-depth limits.

### Idempotency abuse protection

The Engine SHOULD detect:

- high rate of unique request ids for the same source entity;
- repeated conflicting fingerprints;
- source Event id churn;
- attempts to bypass once-per-source rules;
- claim replay from multiple Users;
- suspicious bulk jobs.

Security detection does not replace deterministic constraints.

### Tenant and realm isolation

Where multi-tenancy exists:

- tenant context is derived from authenticated identity and trusted Event metadata;
- queries include tenant boundaries;
- Definition activation is tenant-scoped;
- deduplication scopes include tenant where required;
- cross-tenant Reward references are rejected;
- support access is tenant-restricted;
- tests verify no cross-tenant inference through ids or error responses.

### Secrets and logging

Secrets, credentials, payment data, and unrestricted source payloads MUST NOT be stored in Reward Events, ledger details, or logs.

Logs use ids and sanitized codes. High-cardinality payloads are not metric labels.

### Rate limits

Rate limits apply by:

- public User;
- Character;
- service producer;
- Definition;
- Binding;
- tenant;
- owner Engine;
- administrative principal;
- bulk job.

Limits SHOULD protect both Reward Engine and downstream owners.

### Threat scenarios

Required threat modeling includes:

- forged `reward.grant.requested`;
- stolen claim token or session;
- replay after idempotency retention;
- malicious Definition author;
- expression resource exhaustion;
- compromised owner publishing false success;
- source Event rollback without revocation;
- bulk grant abuse;
- hidden Reward enumeration;
- Event recursion amplification;
- support account misuse;
- database role bypass.

### Break-glass access

Emergency access is time-limited, strongly authenticated, separately alerted, and fully audited. It MUST NOT permit unaudited direct ledger edits.

---

## Privacy

### Data minimization

The Reward Engine stores only data required to:

- identify the Character and source;
- evaluate Reward-specific conditions;
- enforce repeatability;
- coordinate fulfillment;
- explain and support the Reward;
- meet audit and legal requirements.

Profile biography, display name, email, payment details, or raw Module records are not required in authoritative Reward state.

### Character identifier

`character_id` is pseudonymous but still personal data where linkable. Access, retention, and export policy apply.

### Source context

Trigger Bindings MUST explicitly allowlist copied source fields.

The Engine SHOULD prefer immutable source references over full payload snapshots. When fields are required for deterministic replay, store a minimized sanitized evaluation context or encrypted snapshot with retention classification.

### Decision traces

Decision traces MUST:

- contain Condition identifiers and Boolean outcomes;
- redact sensitive compared values where possible;
- avoid copying unrestricted strings;
- separate support-safe and security-only detail;
- follow retention policy;
- be included in data access exports only when appropriate and understandable.

### User access and export

A Character data export SHOULD include:

- Reward history;
- Reward Definition presentation identity;
- source category and reference where permitted;
- claimed, fulfilled, expired, failed, and revoked timestamps;
- component outcomes;
- user-relevant reasons.

It SHOULD NOT include internal fraud signals, other Users’ data, secrets, or privileged support notes.

### Correction

Reward history is append-only. Incorrect source or Reward decisions are corrected through revocation, compensation, or new corrective Grants.

The export may show both original and correction events.

### Character closure

On Character closure:

- new Grants and Claims are denied by default;
- pending work follows lifecycle policy;
- Reward history remains retained according to platform policy;
- public projections are removed or restricted;
- owner Engines handle their own foreign state.

### Anonymization

On irreversible Character anonymization:

- direct User linkage is removed or replaced according to Character Engine contract;
- Reward Grant ids and ledger may remain for integrity, fraud, accounting, and aggregate analytics;
- source context is minimized or cryptographically erased where policy permits;
- free-text support details are reviewed and removed according to retention;
- public and support projections are rebuilt with anonymized identity;
- new fulfillment is prohibited;
- unresolved workflows are moved to privacy reconciliation.

The Reward Engine MUST NOT invent a new Character id or reuse the old id.

### Legal hold

Legal hold may suspend deletion or reduction for specified records. It does not authorize new Reward processing.

Legal hold actions and release are audited.

### Children and protected users

Modules serving minors may require stricter policies:

- reduced source context;
- hidden social Reward details;
- guardian-controlled claims;
- restricted support access;
- shorter operational retention where legally permitted;
- no manipulative countdown design.

These are policy inputs, not hardcoded School logic.

### Analytics

Analytics exports SHOULD use pseudonymous ids and minimized component facts.

Raw decision contexts and support case references MUST NOT be exported by default.

### Retention schedule

A production retention schedule MUST define durations for:

- Grants and ledger;
- operation requests;
- source snapshots;
- decision traces;
- fulfillment attempts;
- inbox and outbox payloads;
- support views;
- bulk audience snapshots;
- reconciliation records.

Deletion jobs MUST be restartable, auditable, and safe against deleting data needed for active Grants or revocations.

---

## Performance

### Initial service objectives

Unless superseded by measured product SLOs, the initial production targets are:

- public Reward feed availability: 99.9% monthly;
- claim command availability: 99.95% monthly;
- internal Grant acceptance availability: 99.95% monthly;
- authoritative single-Grant read p95: 150 ms, p99: 400 ms under normal load;
- claim command commit p95: 250 ms, excluding downstream fulfillment;
- explicit Grant acceptance commit p95: 300 ms;
- bound source Event to fulfillment outbox creation p95: 2 seconds, p99: 10 seconds under normal load;
- outbox publish lag p95: 2 seconds;
- projection lag p95: 5 seconds;
- no unresolved retryable fulfillment older than its owner-specific SLO without alert;
- recovery point objective: 5 minutes or better;
- recovery time objective: 60 minutes or better.

Owner-Engine fulfillment latency has separate SLOs and is reported independently.

### Capacity dimensions

Capacity planning MUST model:

- source Events per second;
- average Bindings per Event type;
- Condition complexity;
- Grants per source Event;
- Components per Grant;
- owner dispatch rate;
- result Events per second;
- claim peaks near expiry;
- bulk jobs;
- retry amplification;
- ledger write volume;
- read feed traffic;
- long-tail pending Grants.

### Horizontal scaling

Workers MAY scale horizontally by:

- source Event partition;
- Grant id partition;
- owner Engine queue;
- retry time shard;
- projection partition;
- bulk job shard.

Repeatability counters require careful locking and SHOULD avoid global hot keys.

### Hot-scope mitigation

Once-per-time-bucket Rewards with enormous shared scopes are prohibited; scopes are Character-centered in version 1.

For high-volume Character-specific counters:

- use indexed deterministic keys;
- keep transactions short;
- avoid scanning historical Grants during every request;
- use counter rows backed by ledger;
- monitor lock contention.

### Definition caching

Published Definition and Binding versions MAY be cached by immutable id and fingerprint.

Activation selection caches MUST:

- have bounded TTL;
- support explicit invalidation;
- include scope and evaluation time;
- fail closed on ambiguous selection;
- never mutate resolved Grant meaning.

### Database transaction limits

A single Grant transaction SHOULD have bounded:

- component count;
- ledger entries;
- JSON document size;
- outbox rows;
- lock duration.

Initial limits SHOULD be configurable, for example:

- maximum 32 Components per Definition;
- maximum Condition AST 256 nodes;
- maximum Expression AST 128 nodes per field;
- maximum evaluation context 64 KiB after sanitization;
- maximum Event payload 256 KiB;
- maximum synchronous Bindings evaluated per source Event 64.

Higher limits require capacity review.

### Bulk workload isolation

Bulk jobs MUST use separate quotas and worker pools. They MUST yield to real-time claims, source Grants, fulfillment results, and revocations.

Bulk rate is constrained by downstream owner capacity.

### Retry amplification

Retry policy MUST include:

- exponential or bounded backoff;
- jitter;
- maximum attempts or maximum age;
- owner-provided retry-after cap;
- circuit breaking;
- dead-letter or quarantine;
- no new fulfillment identity.

The system MUST alert before retry storms threaten fresh work.

### Read caching

Character Reward Feed and catalog projections MAY be cached.

Claimable inbox caching must be short-lived and invalidated on claim, expiry, lifecycle restriction, or Grant update.

Authoritative claim validation never trusts cache state.

### Backpressure

When overloaded, the Engine SHOULD:

- slow non-critical Binding evaluation;
- pause bulk jobs;
- reduce optional projection work;
- apply producer quotas;
- preserve claim and fulfillment-result processing;
- avoid dropping accepted Events;
- expose backlog age.

### Disaster recovery

Recovery procedures MUST verify idempotency before replaying inbox or outbox.

After restore:

1. freeze bulk work;
2. validate configuration activation;
3. reconcile published outbox acknowledgements;
4. resume fulfillment results;
5. resume claims and real-time Grants;
6. replay pending outbox with stable ids;
7. resume retries;
8. rebuild projections;
9. resume bulk work.

### Performance tests

Required tests include:

- sustained source Event load;
- duplicate Event storm;
- one hot Character repeatability contention;
- owner outage and retry backlog;
- claim spike before expiry;
- large but valid Definition;
- maximum Components per Grant;
- bulk job coexisting with real-time traffic;
- projection rebuild under writes;
- database failover and outbox replay;
- reconciliation scan impact.

---

## Audit

### Audit objectives

The Engine MUST answer:

- who or what requested the Reward;
- which source action caused it;
- which Binding and Definition version applied;
- why eligibility passed, skipped, or rejected;
- how repeatability was decided;
- what exact Components were planned;
- which owner Engine received each request;
- what the owner applied;
- whether and why retries occurred;
- who claimed, cancelled, retried, repaired, or revoked;
- what was visible to the Character;
- whether history has been anonymized or placed on hold.

### Audit event categories

Audit categories include:

- configuration authoring;
- validation and simulation;
- approval and publication;
- activation and retirement;
- Binding changes;
- manual Grant;
- claim;
- bulk job;
- component retry or abandon;
- revocation and compensation;
- emergency control;
- reconciliation and repair;
- privacy export and anonymization access;
- privileged search and record access.

### Required audit fields

- audit id;
- UTC timestamp;
- actor type and id;
- authenticated session or workload id;
- action;
- target type and id;
- tenant or realm;
- reason code;
- case or change reference where required;
- before and after semantic fingerprints;
- request and correlation ids;
- approval ids;
- outcome;
- source IP or device context for privileged interactive actions according to privacy policy.

### Ledger versus audit log

The Reward Ledger records business state facts for a Grant.

The security audit log records privileged access and administrative actions, including reads that do not mutate the Grant.

Neither replaces the other.

### Immutability

Ledger and audit stores SHOULD use:

- append-only database permissions;
- write-once object retention or tamper-evident export for high-risk environments;
- hash chaining or signed batches where required;
- independent backup;
- monitored deletion attempts.

### Observability

#### Metrics

Core metrics include:

- source Events received by type and producer;
- Binding evaluations by outcome;
- Grant creation, skip, rejection, and failure rates;
- claimable count, claim rate, and expiry rate;
- fulfillment dispatch and success by type and owner;
- fulfillment latency histograms;
- retry count and oldest retry age;
- partial Grant count and age;
- terminal required-component failures;
- outbox and inbox lag;
- repeatability conflicts;
- idempotent replay count;
- contradictory receipt count;
- revocation outcomes;
- reconciliation issues;
- projection lag;
- Definition-version comparison.

Metric labels MUST be bounded. Grant ids, Character ids, and source entity ids are prohibited as labels.

#### Logs

Structured logs include:

- operation id;
- Grant id where present;
- component id where present;
- Event type;
- producer or owner;
- Definition and Binding version ids;
- state transition;
- stable error code;
- correlation and trace ids;
- latency;
- retry number.

Logs MUST not include full payloads by default.

#### Traces

Distributed traces SHOULD connect:

- source Event ingestion;
- Grant decision transaction;
- outbox publication;
- owner Engine fulfillment;
- result ingestion;
- final Reward outcome;
- notification projection.

Trace absence MUST NOT affect correctness.

### Alerts

Alert conditions include:

- elevated rejection or failure rate;
- Definition version causing statistically significant errors;
- owner fulfillment SLO breach;
- growing partial-Grant age;
- retry storm;
- outbox or inbox backlog;
- claim expiry worker delay;
- contradictory owner receipts;
- repeatability uniqueness violation;
- configuration fingerprint mismatch;
- unauthorized producer attempts;
- bulk job exceeding predicted volume;
- reconciliation critical issue;
- audit pipeline failure.

### Reconciliation

Reconciliation modes:

- structural: database invariants and ledger continuity;
- deterministic replay: rebuild expected Grant state from ledger;
- owner receipt: compare local success with owner operation evidence;
- outbox: ensure required Events exist for transitions;
- repeatability: compare counters to reservation ledger;
- projection: compare read models to authoritative state;
- configuration: verify referenced immutable versions and fingerprints.

Repair always appends operations. It never edits history to hide divergence.

---
## Edge Cases

Every case below requires deterministic behavior, stable error codes, idempotent replay, and auditability.

### Duplicate source Event delivery

The same `event_id` and identical fingerprint is an inbox accepted no-op.

No Binding is re-evaluated into a second Grant. Existing outcomes may be republished only through an explicit recovery tool using the original identities.

### Same Event id with different payload

This is an integrity conflict.

The Event is quarantined, the producer is alerted, and no new Grant is created. The original accepted Event remains authoritative.

### Same request id with different parameters

Return `reward.idempotency_conflict`. Do not return or mutate the existing Grant as if the request matched.

### Different request ids for the same source entity

Request idempotency alone does not protect against this case. Repeatability and source-scope deduplication determine whether a second Grant is skipped.

Definitions using `UNBOUNDED` must explicitly accept that multiple logical requests for the same source entity may create multiple Grants.

### Concurrent once-per-Character requests

Both evaluate, but only one transaction reserves repeatability capacity. The loser returns a deterministic skip or the existing Grant reference.

No optimistic application followed by rollback is allowed.

### Multiple Bindings match one Event

Each Binding is evaluated independently in deterministic priority order.

`stop_processing` affects only lower-priority Bindings in the same declared Binding group and scope. It MUST NOT silently suppress unrelated namespaces unless publication explicitly validates that behavior.

### Ambiguous active Definition versions

If activation resolution returns more than one equally valid version without an approved experiment policy, evaluation is rejected with `reward.definition_version_conflict` and alerted.

The Engine MUST NOT pick “latest” by accident.

### Event arrives late after Definition retirement

Behavior follows Binding version selection and lateness policy.

- `ACTIVE_AT_SOURCE_OCCURRED_AT` may select the historical version if lateness is within bounds.
- `ACTIVE_AT_EVALUATION_TIME` uses current activation and may skip if none is active.
- events outside permitted lateness are rejected or quarantined.

The decision and reason are recorded.

### Event occurred before activation but published after activation

Selection based on source time does not award unless policy explicitly covers that source time. Selection based on evaluation time may award. The Binding defines the semantics.

### Untrusted source timestamp

A producer without trusted timestamp capability cannot use source-time version selection or time-bucket repeatability based solely on `occurred_at`.

The Engine uses received/evaluation time or rejects the Binding at publication.

### Daylight-saving time bucket boundary

The bucket is derived using the Definition’s IANA timezone and calendar rule, then stored as UTC start and end instants.

Ambiguous or skipped local times are resolved by the platform calendar library version recorded in configuration validation. Tests cover both transitions.

### Character is suspended between evaluation and dispatch

If the initial Grant transaction already created fulfillment requests, in-flight owner operations may complete.

Undispatched Components are paused or rejected according to the stored Character lifecycle policy. The Engine does not silently cancel successful components.

### Character is suspended while a Reward is claimable

Claim is denied by default. The Grant remains `PENDING_CLAIM` until restoration or expiry unless policy explicitly cancels it.

### Character closes after one Component succeeds

The Grant becomes or remains partial. No new dispatch occurs by default. Operations review policy determines whether to resume after restoration, fail, or revoke the successful component.

### Character is anonymized with pending fulfillment

No new fulfillment dispatch occurs. The Grant enters privacy reconciliation. Already published owner requests are reconciled, and retained records are minimized according to policy.

### Claim and expiry race

Both commands lock the same aggregate.

- If claim commits before the authoritative deadline check and expiry transaction, fulfillment proceeds.
- If expiry commits first or server time is beyond deadline when claim validates, claim returns expired.

Only one aggregate transition is committed.

### Duplicate claim from multiple devices

The first valid Claim creates fulfillment. Later identical or semantically equivalent claims return the current result. Different idempotency keys do not create new fulfillments.

### Claim by wrong User

Return `404` or `403` according to disclosure policy. Record a security event. Do not reveal Reward content.

### Client clock differs from server clock

Server time is authoritative. API responses include server time and deadline. Client local time cannot extend a claim window.

### Automatic Reward has no Components

Publication rejects the Definition unless it is a registered informational Reward type with explicit product approval. Version 1 SHOULD require at least one authoritative Component.

### Component expression resolves to zero

Default behavior is publication or runtime rejection because Rewards represent positive outcomes.

A Component Type may permit zero only as an explicit accepted-no-op semantic, and the Definition must declare whether the component is omitted or fulfilled as no-op.

### Component expression resolves negative

Reject evaluation with `reward.component_quantity_invalid`. Negative values are corrections or reversals, not Rewards.

### Integer overflow

Reject before Grant creation. No truncated, wrapped, clamped, or floating-point fallback is allowed unless an explicit bounded clamp exists in the published expression.

### Missing mapped source field

Apply the declared missing-field behavior. Never coerce missing to zero, empty string, or null implicitly.

### Unknown Component Type at runtime

A published Definition should make this impossible. If registry data is unavailable or inconsistent, reject new Grant creation and alert. Existing resolved Grants retain their stored owner and schema snapshot but dispatch only when the registered contract is verifiable.

### Referenced Item version retired

Retirement alone does not invalidate a pinned immutable Item Definition version if the Inventory contract permits historical fulfillment.

If the reference is no longer fulfillable, owner rejection is terminal and triggers the Definition’s failure policy.

### Unique Item already owned

The Inventory Engine decides whether the result is an accepted no-op, conversion, duplicate instance, or rejection according to its contract.

The Reward Engine records the owner outcome and MUST NOT invent replacement value.

### Progression amount capped

The Progression Engine may report applied amount lower than requested according to its cap policy.

The Reward Component can be considered fulfilled only if the EXPERIENCE contract defines capped application as success. UI uses applied amount and may explain cap behavior.

### Owner Engine returns success before local dispatch marker

This can occur through replay or transaction timing. The result is correlated by stable fulfillment id.

If a valid planned Component exists and request fingerprint matches, the Engine records the receipt and reconciles the missing attempt marker. If no valid Component exists, quarantine as an unsolicited result.

### Owner result arrives twice

Identical result Event or identical receipt is an accepted no-op.

A different Event carrying the same semantic receipt is also idempotent if fingerprints match.

### Owner returns success then failure

Contradictory terminal results are quarantined. The original committed valid terminal result remains authoritative until reconciliation confirms owner state.

### Owner returns failure then success

If failure was retryable and success corresponds to the same fulfillment id, success may finalize the Component.

If failure was terminal and already caused Grant terminalization or compensation, the contradictory late success requires reconciliation and possibly revocation. It MUST NOT silently rewrite history.

### Timeout after owner applied effect

The Reward Engine retries with the same fulfillment id. The owner returns the original success or accepted no-op. No second effect occurs.

### Broker publishes outbox Event twice

Consumers use Event and fulfillment idempotency. Reward Engine records multiple physical attempts if applicable but one logical request.

### Outbox row committed but service crashes before publish

Publisher resumes from pending outbox after restart.

### Event published but publisher crashes before marking row published

The Event may be republished. Consumer idempotency handles the duplicate.

### All Components succeed in different order

Aggregate result is the same. Ledger sequence reflects receipt order, while final Grant state requires all required Components.

### Sequential Component prerequisite fails

Blocked later Components are never dispatched. Required failure terminalizes or compensates according to policy. Optional dependent components follow their declared dependency behavior.

### Optional Component retry exhausts

The Grant may transition to `GRANTED_WITH_WARNINGS` only after the component reaches approved terminal failure or an authorized abandon command. The missing component is listed.

### Required Component retry exhausts after another succeeded

The Grant becomes terminal `FAILED` with partial effects unless automatic compensation policy starts revocation. It MUST NOT become `SKIPPED` or hide the successful component.

### Compensation fails

The Grant or revocation remains partial and support-visible. Automatic retry follows compensation policy. Terminal failure publishes a revocation or compensation failure Event.

### Irreversible Component plus required failure

Publication validation must warn strongly. At runtime, the successful irreversible effect remains visible. The final state is failure or a policy-defined success with warnings only if that semantic was explicitly approved.

### Revocation requested before Grant succeeds

If no Component has fulfilled, cancel pending work where safe and transition through the approved cancellation/revocation path.

If any Component may be in flight, first reconcile or allow owner idempotent cancellation protocol. Do not assume unpublished result means unapplied effect.

### Duplicate revocation request

Same request and fingerprint returns the existing revocation. A new request for an already active or completed revocation returns current state or conflict according to scope.

### Partial revocation requested

Allowed only when Definition and component contracts permit independent reversal and product semantics remain coherent. Otherwise only full-scope revocation is accepted.

### Source Event later corrected

The source producer publishes an explicit correction or reversal Event. A configured trusted workflow requests Reward revocation. The Reward Engine does not poll source databases or infer corrections.

### Reward outcome triggers its own Binding

Publication rejects the cycle. Runtime causal-chain guard rejects any missed recursive request and emits a security/operational alert.

### Replay of historical source Events

Replay metadata and stable original Event ids are required.

The normal default is idempotent reconstruction with no new Grants. Backfill that intentionally applies previously unprocessed history uses a separate approved replay id and policy while preserving source identity and repeatability.

### Replay after idempotency data archival

Idempotency and deduplication retention MUST exceed supported replay horizon. If not provable, replay is blocked pending reconciliation rather than risking duplicate Rewards.

### Definition changed during evaluation

The transaction resolves one immutable version id and fingerprint. Later activation changes do not alter the in-flight decision.

### Definition retired while Grant is pending claim

The Grant remains claimable using its recorded version unless an explicit emergency cancellation operation changes it.

### Definition contains hidden Reward presentation

Public catalog excludes it. Once granted, visibility follows the Definition’s reveal policy. Support access remains controlled.

### Localization key removed

Presentation falls back through the platform localization policy. Grant truth remains available from typed component data. Missing localization is alerted but does not change fulfillment state.

### Media asset missing

Use fallback icon. Do not fail the Reward Grant for a presentation dependency.

### Projection shows stale claimable Reward after claim

The authoritative claim endpoint returns accepted no-op/current status. Projection catches up. Client removes the item based on command response or status refresh.

### Bulk job includes duplicate Character ids

Audience normalization detects duplicates. One derived request id per unique intended item is used. Dry run reports duplicates.

### Bulk job partially fails

Each item has an independent outcome. The job summary is terminal only after every item is terminal or explicitly cancelled. Successful Grants are not rolled back because another Character failed.

### Bulk job cancelled

Undispatched items become cancelled. Already created Grants continue normally unless a separate approved revocation job is launched.

### Database deadlock

The transaction retries with the same operation identity and bounded attempts. It does not create a new Grant id on each retry after an insert may have committed ambiguously.

### Database commit outcome unknown

Recovery queries by producer and request id before retrying. Never assume failure and issue a fresh logical request.

### Repeatability counter and Grant diverge

Reconciliation reconstructs expected reservations from ledger and Grants. Repair appends counter correction entries under approval.

### Ledger missing an entry

Critical reconciliation issue. Repair may append a recovery entry referencing the detected gap; it does not backdate or rewrite neighboring entries deceptively.

### State hash mismatch

Freeze privileged mutation on the affected Grant, scan ledger and component receipts, generate a repair plan, and alert.

### Owner Engine permanently decommissioned

Existing pending Components require a migration ADR and registered replacement owner capable of honoring original ids and contracts, or terminal failure with explicit support workflow. Updating registry alone MUST NOT redirect historical requests silently.

### Cross-tenant source reference

Reject before Grant creation. Do not disclose whether the foreign Character or source exists.

### Support operator tries direct high-value manual Grant

Only a published manual-use Definition within role and approval limits is allowed. Otherwise deny and audit.

### Emergency pause during in-flight work

Pause stops new dispatch. Already published requests may complete. Results continue to be consumed so state does not drift.

### Notification consumer unavailable

Reward fulfillment and finalization continue. Notification catches up from Events.

### Analytics pipeline unavailable

No effect on authoritative processing.

---

## Acceptance Tests

The following tests are minimum release criteria. They SHOULD be automated at unit, contract, integration, property, migration, performance, and chaos levels.

### Definition and configuration tests

1. A valid Draft can be validated, approved, published, scheduled, activated, retired, and historically resolved.
2. A semantic edit after validation invalidates the validation fingerprint.
3. A published Definition version cannot be semantically updated or deleted by the application role.
4. Two versions with the same Definition and version number are rejected.
5. Activation overlap without deterministic selection is rejected.
6. A Definition with zero Components is rejected unless an approved informational type exists.
7. Duplicate component keys are rejected.
8. An unregistered Component Type is rejected.
9. A Component owner different from the Registry owner is rejected.
10. An invalid Item, Track, Currency, Reputation, Talent, Skill, or Entitlement reference is rejected during publication when the registry can validate it.
11. A missing reference dependency prevents production activation.
12. A negative quantity expression is rejected.
13. A possible int64 overflow is detected by validation fixtures or runtime checks.
14. Floating-point AST nodes are rejected.
15. An expression using an undeclared field path is rejected.
16. A Condition with forbidden regex or remote call is rejected.
17. AST depth and node limits are enforced.
18. A time-bucket policy without timezone is rejected.
19. An expiry policy without repeatability reservation behavior is rejected.
20. An irreversible required Component produces a high-risk approval requirement.
21. Sequential component dependencies containing a cycle are rejected.
22. A direct Reward Event recursion cycle is rejected.
23. A known multi-Engine Event cycle is rejected by dependency analysis.
24. Binding to an unregistered Event schema is rejected.
25. Binding producer allowlist is mandatory.
26. Ambiguous equal-priority Bindings are rejected where stop-processing semantics conflict.
27. Historical fixture simulation returns the same plan on repeated execution.
28. Definition fingerprint is stable under non-semantic JSON field order changes.
29. Definition fingerprint changes when semantic quantity or policy changes.
30. Presentation-only change classification is correct and still creates a new immutable version when published.

### Grant creation and idempotency tests

31. A valid explicit request creates exactly one Reward Grant.
32. The same producer request id and same fingerprint returns the original Grant.
33. The same producer request id and different fingerprint returns idempotency conflict.
34. Duplicate source Event delivery creates no duplicate Binding evaluation effect.
35. Same Event id with different payload is quarantined.
36. Once-per-source Event policy creates one Grant.
37. Once-per-source entity policy skips a second Event for the same entity.
38. Once-per-Character policy skips later requests across different source entities.
39. Limited-per-Character policy allows exactly the configured count.
40. Once-per-time-bucket policy uses the declared timezone.
41. Two concurrent requests for the final repeatability slot produce one winner.
42. `UNBOUNDED` still deduplicates retries of the same request id.
43. Character unknown behavior follows policy and never assumes active.
44. Suspended Character is denied by default.
45. Active Character passes lifecycle eligibility.
46. Missing source field follows declared behavior.
47. Condition false produces `SKIPPED`, not technical failure.
48. Unauthorized producer produces `REJECTED` and no Grant.
49. Definition inactive at selected evaluation time produces deterministic skip or rejection according to contract.
50. Source-time version selection resolves the historical active version.
51. Evaluation-time version selection resolves the current active version.
52. Late Event beyond allowed bound is rejected or quarantined.
53. Multiple matching Bindings create independent Grants according to priority and stop policy.
54. One failed Binding does not roll back another successful Binding from the same Event.
55. Runtime causal-chain guard blocks recursive Reward creation.

### Component planning tests

56. Resolved Component payload is stored immutably.
57. Retry after Definition activation change uses the original stored payload.
58. Integer expression rounding is deterministic.
59. Clamp behavior matches published AST.
60. Quantity outside configured bounds is rejected before Grant creation.
61. Stable fulfillment id is created once per component.
62. Component order and requiredness are stored exactly.
63. Presentation snapshot remains unchanged after localization catalog updates.
64. Definition and payload fingerprints verify after serialization and database round trip.

### Automatic fulfillment tests

65. Automatic Grant creates fulfillment outbox rows in the same transaction.
66. No owner Event is visible when the Grant transaction rolls back.
67. Outbox replay publishes duplicate physical Events with the same logical fulfillment id.
68. Owner success marks exactly one Component fulfilled.
69. Duplicate identical owner success is an accepted no-op.
70. Owner success with wrong producer is rejected.
71. Owner success with wrong fulfillment id is rejected.
72. Owner success with wrong request fingerprint is quarantined.
73. Contradictory owner success receipts create a reconciliation issue.
74. One-component required Reward transitions to `GRANTED` only after owner success.
75. Multi-component Reward remains non-granted until all required Components succeed.
76. Components may succeed in any order without changing final semantic result.
77. Partial success transitions to `PARTIALLY_FULFILLED`.
78. Optional terminal failure plus all required success transitions to `GRANTED_WITH_WARNINGS` only under approved policy.
79. Required terminal failure with no successful component transitions to `FAILED`.
80. Required terminal failure after another component succeeded records partial effects.
81. `reward.granted` is published once.
82. `reward.granted` contains applied, not merely requested, owner outcomes.
83. A capped Progression outcome is represented according to the EXPERIENCE contract.
84. Unique Item accepted no-op is represented according to Inventory contract.
85. Presentation dependency failure does not fail authoritative Grant.

### Retry and timeout tests

86. Transient owner failure schedules retry with the same fulfillment id.
87. Attempt id increments while fulfillment id remains stable.
88. Retry backoff respects configured maximum.
89. Trusted owner retry-after is bounded.
90. Timeout does not create a new logical fulfillment.
91. Owner applies before timeout and duplicate retry returns original success without double effect.
92. Retry exhaustion produces correct optional or required terminal behavior.
93. Owner circuit breaker isolates one Component Type without blocking unrelated owners.
94. Emergency owner pause stops new dispatch but continues result consumption.
95. Retry storm does not starve claim and fulfillment-result processing.

### Claim tests

96. Claim-required Grant creates no fulfillment outbox before Claim.
97. Valid owner Claim transitions to fulfillment exactly once.
98. Duplicate Claim from the same device is idempotent.
99. Duplicate Claim from another device does not duplicate fulfillment.
100. Wrong User cannot claim and learns no protected details.
101. Suspended Character cannot claim by default.
102. Claim before `claim_available_at` is rejected.
103. Claim at a valid instant before deadline succeeds.
104. Claim after deadline expires deterministically.
105. Concurrent Claim and expiry commit only one winning transition.
106. Expiry publishes one `reward.expired` Event.
107. `CONSUME` expiry keeps repeatability capacity consumed.
108. `RELEASE` expiry appends a repeatability release operation.
109. Projection lag after Claim does not permit a second logical Claim.

### Revocation tests

110. Revocation cannot delete or mutate original Grant history.
111. Revocation plan classifies every fulfilled Component.
112. Revocation without required approval is denied.
113. Reversal request references original fulfillment and stable reversal id.
114. Duplicate reversal dispatch produces one owner reversal effect.
115. All reversible Components succeeding transitions to `REVOKED`.
116. Partial reversal transitions to `REVOCATION_PARTIAL`.
117. Terminal required reversal failure transitions to `REVOCATION_FAILED`.
118. Irreversible residual prevents misleading full-revoked status unless approved policy defines completion.
119. Revocation before any fulfillment uses cancellation semantics where allowed.
120. Late owner fulfillment during revocation creates a reconciliation issue and is handled without history rewrite.
121. Source correction Event can request a revocation through an authorized mapping.
122. Unauthorized Module cannot revoke a Grant from another namespace.

### Database and transaction tests

123. Grant, components, repeatability reservation, ledger, inbox, and outbox commit atomically.
124. Rollback leaves no partial reservation.
125. Ledger sequence is unique and monotonic per Grant.
126. Application role cannot update or delete ledger rows.
127. Published configuration rows reject semantic update.
128. Unique constraints enforce request and deduplication identities.
129. Database deadlock retry returns one logical result.
130. Unknown commit outcome is recovered by request lookup.
131. Backup restore preserves all ids and fingerprints.
132. Outbox replay after restore causes no duplicate owner effects.
133. Repeatability counters reconstruct from ledger.
134. State hash replay matches stored state for healthy Grants.

### API tests

135. Public Reward Feed enforces Character authorization.
136. Grant detail returns `404` for unauthorized callers according to disclosure policy.
137. Claim requires idempotency key.
138. Same claim key and changed body returns conflict.
139. Stale `If-Match` returns precondition failure.
140. Cursor pagination has no duplicates or gaps under concurrent inserts within documented consistency semantics.
141. Hidden Rewards are absent from public catalog enumeration.
142. Internal Grant API enforces workload namespace scope.
143. Admin Definition endpoints enforce separation of author, approver, and publisher for high-risk changes.
144. Bulk API enforces maximum audience and approval.
145. Error responses contain stable code and no stack trace.

### Security and privacy tests

146. Envelope producer mismatch is rejected.
147. Cross-tenant Character and Definition combination is rejected without existence leakage.
148. Oversized payload is rejected before expensive evaluation.
149. Malicious deep AST is rejected.
150. Logs contain no raw source payload, credentials, or personal profile fields.
151. Metrics contain no Character or Grant ids as labels.
152. Support read access is audited.
153. Break-glass use creates an alert and expiration.
154. Character export includes user-relevant Reward history and excludes privileged traces.
155. Character anonymization removes direct User linkage and public projections while preserving permitted ledger integrity.
156. Legal hold prevents configured deletion without enabling new Grants.
157. Decision trace redacts sensitive compared values.

### Operational and performance tests

158. Sustained expected peak keeps Grant acceptance within SLO.
159. Duplicate Event storm does not increase logical Grant count.
160. Owner outage produces bounded retry backlog and alerts.
161. Claim spike before deadline remains within claim SLO or degrades safely.
162. Bulk job does not starve real-time requests.
163. Projection rebuild runs while writes continue and swaps generations safely.
164. Definition rollback stops new selection without affecting existing Grants.
165. Quarantined poison Event does not block its partition indefinitely where isolation is configured.
166. Reconciliation detects missing receipt, contradictory outcome, ledger gap, and counter divergence fixtures.
167. Repair applies only the approved plan and produces expected post-repair hash.
168. Disaster recovery runbook resumes with no duplicate logical fulfillment.

### Property-based tests

169. For any identical canonical input and configuration snapshot, component plan is identical.
170. For any order of independent Component success receipts, final Grant success state is equivalent.
171. Aggregate version never decreases.
172. A terminal fulfilled receipt never changes under identical replay.
173. Effective repeatability consumed count is never negative.
174. A `GRANTED` state implies every required Component is fulfilled.
175. `SKIPPED`, `REJECTED`, and `EXPIRED` imply no fulfilled Component.
176. Every component terminal success has exactly one valid owner receipt.
177. Every outbound lifecycle Event corresponds to a committed ledger transition.
178. No sequence of duplicate inputs creates more than one logical Grant or component effect.

### Release gate

Production release is blocked unless:

- all critical invariants have automated tests;
- Component owner contract tests pass;
- migration and rollback tests pass;
- security review and threat model are approved;
- load and retry-storm tests meet targets;
- reconciliation tooling is operational;
- dashboards and alerts exist;
- runbooks are tested;
- at least one end-to-end Reward is fulfilled through Progression Engine in staging;
- no Business Module or Engine bypasses the Reward Engine for configured Reward decisions;
- no Reward Engine code directly mutates foreign aggregate storage.

---

## Future Extensions

Future work is permitted only when validated by production needs and an ADR.

### Weighted deterministic selection

Support loot tables or one-of-many Components using a cryptographically auditable deterministic seed, published probability table, regulatory review where relevant, and replay-safe selection.

Randomness MUST never depend on process-local pseudo-random state that cannot be reproduced.

### Choice Rewards

Allow a Character to select one option from a published set before fulfillment.

This requires:

- choice state and deadline;
- option snapshot;
- one-time authorization;
- inventory or entitlement compatibility;
- accessibility and fairness UX;
- deterministic idempotency.

### Deferred fulfillment schedules

Allow a Grant to release Components over time. This should remain Reward-specific and not become a generic workflow engine.

### Conditional owner alternatives

Support a published fallback such as convert duplicate unique Item to Currency, but only when the owner contract and economy policy explicitly define the conversion. Reward Engine must not invent exchange rates.

### Shared or group Rewards

Support party, guild, household, classroom, or organization recipients through new aggregate types rather than overloading Character Grant semantics.

### Giftable Reward Offers

Support a controlled transfer before claim, with ownership, fraud, expiry, and recipient privacy rules.

### Reward economy budgets

Introduce configuration-level issuance budgets, cost models, and anomaly controls for high-value virtual economies.

These controls supplement, not replace, per-Character repeatability.

### Experiment variants

Support deterministic experiment assignment and variant-specific Definition resolution with immutable assignment evidence and analytics integration.

Experiments MUST not create ambiguous activation or undermine auditability.

### Personalized Rewards

Use approved segment or recommendation snapshots to select among published Definitions. Personalization must be explainable, privacy-reviewed, and incapable of arbitrary component generation.

### Cross-Engine transaction reservations

Owner Engines may introduce reserve/commit/cancel contracts for rare high-value bundles. This requires a dedicated ADR and must not claim perfect atomicity under partitions.

### Marketplace and monetary value

Rewards connected to regulated value, taxes, coupons, or real-money instruments require separate financial architecture, compliance, and ledger specifications.

### Advanced claim channels

Guardian approval, organizational approval, external code redemption, and offline QR claims may be added through authenticated typed workflows.

### Reward discovery and collections

A separate projection or Collection Engine may display discovered and undiscovered Rewards without transferring ownership of Grant state.

### Expiring fulfilled entitlements

Time-limited access may be represented by owner Engine entitlement contracts. The Reward Engine coordinates initial grant but does not own ongoing entitlement expiration.

### Definition migration assistant

Tools may suggest conversion from legacy hardcoded reward logic into Definitions and Bindings. Generated configuration still requires validation and approval.

### Formal Event dependency graph — required release dependency

The platform-wide Contract Registry MUST prove absence of Reward recursion and
other reactive Engine cycles before publication or activation. The validation
result and registry revision are pinned in the release bundle. Runtime lineage
and cycle-guard tokens provide a second bounded defense as defined by
`002b-cross-engine-integration`.

### Multi-region active-active

Global Grants may require region-aware id generation, repeatability serialization, home-region routing, and conflict resolution. Strong invariants must be preserved before enabling multi-writer operation.

### Tamper-evident ledger

High-value deployments may add signed ledger batches, Merkle proofs, or write-once archival storage.

### Policy-as-code for authorization

Administrative and producer authorization may move to a centrally verified policy language. Reward Conditions remain bounded data and must not inherit arbitrary policy execution.

### AI-assisted authoring

AI may propose Definitions, expressions, tests, and narrative keys, but cannot publish, approve, or bypass deterministic validation. Every generated artifact is treated as untrusted Draft content.

---

## ADR References

The following decisions are normative in this RFC and the shared platform
contract RFCs. Standalone ADR files MAY mirror them for repository traceability
but may not redefine the contracts independently.

- **ADR-001 — Platform First:** platform Engines remain independent from Business Modules.
- **ADR-002 — Event-Driven Engine Integration:** Engines communicate through immutable versioned Events.
- **ADR-003 — Platform-Owned Character:** Character identity belongs to the platform.
- **ADR-004 — Single Writer per Aggregate Class:** only the owning Engine mutates its authoritative state.
- **ADR-005 — Transactional Inbox and Outbox:** at-least-once transport is converted into exactly-once logical effect.
- **ADR-006 — Immutable Published Configuration:** historical behavior references immutable versions and fingerprints.
- **ADR-007 — Reward Fulfillment Saga:** Reward Engine coordinates owner Engines without distributed two-phase commit.
- **ADR-008 — Typed Component Registry:** new Reward Component types require registered schemas, owners, and reversal semantics.
- **ADR-009 — Bounded Condition and Expression DSL:** arbitrary executable code is prohibited.
- **ADR-010 — Reward Repeatability Semantics:** idempotency and product repeatability are separate controls.
- **ADR-011 — Claimable Reward Model:** claim-required Rewards reserve repeatability and expire through explicit operations.
- **ADR-012 — Reward Revocation and Compensation:** corrections append reversal workflows rather than rewriting history.
- **ADR-013 — Event Cycle Prevention:** configuration publication and runtime causal guards prevent recursive Reward chains.
- **ADR-014 — Character Eligibility Projection:** Reward critical path uses local Character lifecycle projection.
- **ADR-015 — Reward Privacy and Retention:** source context and decision traces are minimized and classified.
- **ADR-016 — Bulk Reward Isolation:** bulk issuance uses independent jobs, quotas, and per-Character idempotency.

Any implementation that differs from this RFC’s ownership, idempotency, or success semantics requires an approved ADR before release.

---

## Appendix

### Appendix A — Canonical responsibility matrix

| Action | Reward Engine | Source Module/Engine | Owner Engine |
|---|---|---|---|
| Prove business action happened | No | Yes | No |
| Decide source completion | No | Yes | No |
| Map Event to Reward Definition | Yes, through Binding | May request explicit Definition | No |
| Evaluate reward-specific eligibility | Yes | Supplies trusted context | No |
| Enforce Reward repeatability | Yes | No | No |
| Resolve component quantity | Yes, bounded Definition logic | Supplies allowed parameters | Validates owner constraints |
| Create Reward Grant | Yes | No | No |
| Apply Experience | No | No | Progression Engine |
| Apply Item | No | No | Inventory Engine |
| Apply Currency | No | No | Currency/Wallet Engine |
| Apply Reputation | No | No | Reputation Engine |
| Apply Talent/Skill unlock | No | No | Talent/Skill owner |
| Record owner operation receipt | Yes | No | Publishes it |
| Declare final Reward success | Yes | No | No |
| Notify Character | No | No | Notification consumer |
| Reverse foreign state | Coordinates | May request correction | Applies reversal |

### Appendix B — Grant transition matrix

| Current state | Command/Event | Next state | Notes |
|---|---|---|---|
| `RECEIVED` | begin evaluation | `EVALUATING` | May occur in one transaction. |
| `EVALUATING` | eligible, automatic | `FULFILLMENT_PENDING` | Grant and components created. |
| `EVALUATING` | eligible, claim required | `PENDING_CLAIM` | No fulfillment dispatch. |
| `EVALUATING` | Condition false | `SKIPPED` | No component effect. |
| `EVALUATING` | invalid request | `REJECTED` | No component effect. |
| `PENDING_CLAIM` | valid Claim | `FULFILLMENT_PENDING` | Idempotent. |
| `PENDING_CLAIM` | deadline passed | `EXPIRED` | Explicit operation. |
| `FULFILLMENT_PENDING` | first dispatch | `FULFILLING` | Outbox publication may lag. |
| `FULFILLING` | first success, work remains | `PARTIALLY_FULFILLED` | Partial state explicit. |
| `FULFILLING` | all required succeed | `GRANTED` or warnings | Final success. |
| `FULFILLING` | terminal required failure, none succeeded | `FAILED` | No partial effect. |
| `PARTIALLY_FULFILLED` | all required succeed | `GRANTED` or warnings | Final success. |
| `PARTIALLY_FULFILLED` | terminal required failure | `FAILED` | Successful effects remain recorded. |
| `GRANTED` | approved revoke | `REVOCATION_PENDING` | New saga. |
| `GRANTED_WITH_WARNINGS` | approved revoke | `REVOCATION_PENDING` | Scope based on fulfilled components. |
| `FAILED` with effects | approved revoke | `REVOCATION_PENDING` | Cleanup possible. |
| `REVOCATION_PENDING` | some reversal succeeds | `REVOCATION_PARTIAL` | Partial explicit. |
| `REVOCATION_PENDING` | all complete | `REVOKED` | Policy completion condition. |
| `REVOCATION_PARTIAL` | all complete | `REVOKED` | Final. |
| revocation state | terminal unresolved | `REVOCATION_FAILED` | Support required. |

Undefined transitions are rejected.

### Appendix C — Component transition matrix

| Current | Input | Next |
|---|---|---|
| `PLANNED` | order ready | `DISPATCH_PENDING` |
| `PLANNED` | prior order incomplete | `BLOCKED_BY_ORDER` |
| `BLOCKED_BY_ORDER` | prerequisite success | `DISPATCH_PENDING` |
| `DISPATCH_PENDING` | outbox dispatched | `DISPATCHED` |
| `DISPATCHED` | success receipt | `FULFILLED` |
| `DISPATCHED` | retryable failure | `FAILED_RETRYABLE` |
| `FAILED_RETRYABLE` | retry scheduled | `RETRY_SCHEDULED` |
| `RETRY_SCHEDULED` | redispatch | `DISPATCHED` |
| non-terminal | terminal failure | `FAILED_TERMINAL` |
| optional terminal failure | authorized abandon | `ABANDONED_OPTIONAL` |
| `FULFILLED` | revocation starts | `REVERSAL_PENDING` |
| `REVERSAL_PENDING` | dispatch | `REVERSING` |
| `REVERSING` | literal reversal success | `REVERSED` |
| `REVERSING` | compensation success | `COMPENSATED` |
| reversal non-terminal | terminal failure | `REVERSAL_FAILED` |

### Appendix D — Repeatability examples

#### Once per source Event

Scope input:

```text
Character + Definition + Source Producer + Source Event ID
```

Use when duplicate delivery must not create another Reward but separate qualifying Events may.

#### Once per source entity

```text
Character + Definition + Source Entity Type + Source Entity ID
```

Use when multiple Events may describe one logical completion.

#### Once per Character

```text
Character + Definition
```

Use for one-time onboarding or milestones.

#### Limited per UTC day

```text
Character + Definition + Bucket[UTC day]
limit = N
```

Use only when UTC is the intended product calendar.

#### Limited per local calendar week

```text
Character + Definition + Bucket[Europe/Berlin, ISO week]
limit = N
```

The exact bucket boundaries are stored in UTC.

### Appendix E — Definition authoring example

```yaml
reward_definition_key: school.lesson.first_attendance
version: 3
input_schema:
  type: object
  properties: {}
  additionalProperties: false
eligibility:
  character_states: [ACTIVE]
  conditions: []
repeatability:
  mode: ONCE_PER_CHARACTER
  expiry_reservation_behavior: CONSUME
claim:
  mode: AUTOMATIC
components:
  - component_key: base_xp
    component_type: EXPERIENCE
    schema_version: 1
    requiredness: REQUIRED
    fulfillment_order: 100
    payload:
      track_key: core
      amount:
        expression_version: 1
        result_type: INT64
        ast:
          op: constant
          value: 100
    bounds:
      minimum: 1
      maximum: 100
    retry_policy: standard_mutation
    reversal_policy: SUPPORTED_REQUIRED
  - component_key: first_step_title
    component_type: ENTITLEMENT
    schema_version: 1
    requiredness: REQUIRED
    fulfillment_order: 100
    payload:
      entitlement_key: title.first_step
      entitlement_version_id: 11111111-1111-1111-1111-111111111111
      quantity: 1
presentation:
  name_key: reward.school.first_attendance.name
  description_key: reward.school.first_attendance.description
  icon_ref: asset:first-lesson
  category: MILESTONE
operational_policy:
  fulfillment_timeout_seconds: 300
  max_component_attempts: 12
revocation_policy:
  mode: REVERSE_WHERE_SUPPORTED
```

This is configuration, not source code. The School Module publishes the source Event; the core Engine does not know what a lesson means.

### Appendix F — Example end-to-end sequence

```text
1. School Module commits lesson completion and outbox Event.
2. lesson.completed.v1 reaches Reward Engine at least once.
3. Inbox deduplicates Event id.
4. Active Binding selects school.lesson.first_attendance v3.
5. Eligibility passes.
6. Repeatability scope Character + Definition is reserved.
7. Reward Grant and two Components are created.
8. Transaction commits Grant, ledger, and fulfillment outbox.
9. EXPERIENCE request reaches Progression Engine.
10. ENTITLEMENT request reaches Entitlement owner.
11. Progression Engine applies 100 XP exactly once and responds.
12. Reward Grant becomes PARTIALLY_FULFILLED.
13. Entitlement owner grants title and responds.
14. Reward Grant becomes GRANTED.
15. reward.granted.v1 is published.
16. Notification and Character projections update asynchronously.
17. Duplicate lesson.completed delivery returns existing decision and creates no effect.
```

### Appendix G — Implementation modules

A reference codebase MAY separate:

```text
reward-domain/
  aggregate/
  definitions/
  conditions/
  expressions/
  repeatability/
  fulfillment/
  revocation/
  errors/

reward-application/
  commands/
  event-handlers/
  services/
  policies/
  reconciliation/

reward-infrastructure/
  postgres/
  event-bus/
  schema-registry/
  auth/
  observability/

reward-api/
  public/
  internal/
  admin/

reward-workers/
  source-consumer/
  fulfillment-result-consumer/
  outbox-publisher/
  retry-scheduler/
  expiry-scheduler/
  projections/
  reconciliation/
  bulk-jobs/
```

Package boundaries are non-normative. Domain invariants are normative.

### Appendix H — Implementation checklist

#### Domain

- [ ] Grant Aggregate and state machine implemented.
- [ ] Component state machine implemented.
- [ ] Repeatability scope derivation implemented and property-tested.
- [ ] Claim and expiry race handled transactionally.
- [ ] Revocation plan and state machine implemented.
- [ ] Canonical serialization and fingerprints implemented.

#### Configuration

- [ ] Draft, validation, approval, publication, activation, retirement.
- [ ] Typed Component Registry.
- [ ] Bounded Condition and Expression AST.
- [ ] Binding overlap and cycle validation.
- [ ] Fixture and simulation framework.

#### Persistence

- [ ] Schema migrations and constraints.
- [ ] Transactional inbox and outbox.
- [ ] Append-only ledger permissions.
- [ ] Operation idempotency constraints.
- [ ] Repeatability counter ledger.
- [ ] Backup and restore validation.

#### Integration

- [ ] Progression EXPERIENCE contract.
- [ ] Inventory ITEM contract.
- [ ] Entitlement contract.
- [ ] Character eligibility projection.
- [ ] Talent `reward-calculation` effect-set projection and freshness policy.
- [ ] Modifier calculation pins revision, fingerprint, order, and breakdown.
- [ ] Schema Registry compatibility tests.
- [ ] Owner receipt authentication.

#### APIs

- [ ] Character Reward Feed.
- [ ] Claimable inbox and claim command.
- [ ] Internal Grant request.
- [ ] Definition and Binding administration.
- [ ] Support and revocation console APIs.
- [ ] Bulk jobs.
- [ ] Reconciliation APIs.

#### Operations

- [ ] Metrics, logs, traces, and alerts.
- [ ] Retry scheduler and circuit breakers.
- [ ] Quarantine tooling.
- [ ] Projection rebuild.
- [ ] Reconciliation scans and repair plans.
- [ ] Emergency pause controls.
- [ ] Runbooks and disaster recovery exercise.

#### Security and privacy

- [ ] Workload identity and producer authorization.
- [ ] Administrative RBAC and separation of duties.
- [ ] Threat model.
- [ ] Payload and AST limits.
- [ ] Redacted support views.
- [ ] Export, closure, anonymization, retention, and legal-hold workflows.

### Appendix I — Non-negotiable implementation rules

1. Reward Engine never writes another Engine’s aggregate tables.
2. `reward.granted` never means “requests were sent”; it means required owner acknowledgements succeeded.
3. A retry never receives a new logical fulfillment id.
4. A published Definition is never edited in place.
5. Duplicate handling never relies only on broker guarantees.
6. Timeout is never interpreted as proof of no effect.
7. Partial fulfillment is never hidden.
8. Revocation never deletes the original history.
9. User-provided data never selects arbitrary owner topics or component classes.
10. Business Module vocabulary never becomes hardcoded Reward Engine behavior.

### Appendix J — Document completion criteria

This specification is considered implemented only when:

- the ownership boundary is enforced in code and deployment permissions;
- the Event and API contracts have consumer-driven tests;
- configuration authoring cannot publish unsafe Definitions;
- exactly-once logical Grant and fulfillment behavior is demonstrated under duplicate delivery and crash recovery;
- partial failure and revocation are operable, not merely modeled;
- reconciliation can detect and safely repair seeded divergence;
- user-facing clients distinguish pending, partial, complete, failed, expired, and revoked states;
- support staff can explain any Grant without direct database edits;
- the first School Module integration uses configuration and Events without School logic inside the Engine.

---

> A Reward is a durable promise. The platform records why it was made, asks each owner to fulfill its part, and declares success only when that promise is true.
