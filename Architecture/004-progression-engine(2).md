---
document: 004-progression-engine
title: Progression Engine
owner: Platform Team
status: Proposed
version: 1.2.0
last_updated: 2026-07-18
depends_on:
  - 000-product-philosophy
  - 001-domain-definition
  - 002-platform-architecture
  - 002a-platform-contract-standard
  - 002b-cross-engine-integration
  - 003-character-engine
related_documents:
  - 004a-standard-level-profile
  - 005-reward-engine
  - 006-achievement-engine
  - 007-quest-engine
  - 008-talent-engine
  - 011-season-engine
---

# Progression Engine

> **Platform contract conformance:** cross-Engine Events, identifiers, Reward
> fulfillment, and Season integration MUST conform to
> `002a-platform-contract-standard` and `002b-cross-engine-integration`.

## Executive Summary

The Progression Engine is the authoritative platform component for experience-based Character progression. It owns the durable state and deterministic lifecycle of Experience, Level, and Prestige for every configured Progression Track.

The Engine converts validated, typed progression operations into auditable Character state changes. It does not decide whether a lesson, purchase, workout, community contribution, or any other business action deserves Experience. Business Modules publish domain Events. The Reward Engine and other policy-owning platform components translate those Events into typed reward operations. The Progression Engine applies the resulting Experience operation, derives Level and Prestige transitions from a versioned Progression Track Definition, persists the result atomically, and publishes immutable outcome Events.

The authoritative write path is event-driven. HTTP APIs exist for reads, administration, controlled correction, and explicit player commands such as manual Prestige. They do not permit arbitrary clients or Business Modules to mutate progression state directly.

The Engine is designed around the following invariants:

1. A single Engine owns a single class of state. Only the Progression Engine may write Experience, Level, Prestige, and Progression Track state.
2. Every mutation is traceable to an immutable Event or an explicitly authorized administrative operation.
3. Reprocessing the same input produces exactly one durable effect.
4. Published Progression Track versions are immutable.
5. Level and Prestige transitions are deterministic for a given prior state, operation, and Track Definition version.
6. Experience is represented as integer units. Floating-point arithmetic is prohibited in authoritative calculations.
7. Business-domain semantics never appear in the Engine core. The Engine processes canonical progression operations and opaque references.
8. Configuration authoring may use formulas, but publication materializes explicit thresholds so runtime behavior is stable and replayable.
9. State, ledger, transition history, and outgoing Events are committed atomically.
10. User-facing projections may be eventually consistent, but authoritative state must never be partially applied.
11. The platform-provided primary progression profile uses the immutable
    Level 1-100 thresholds defined in `004a-standard-level-profile`.

This document is normative for backend implementation, event contracts, storage, APIs, administrative controls, security boundaries, operational behavior, and acceptance testing of the Progression Engine.

---

## Purpose

The purpose of this RFC is to define a production-ready specification for the Progression Engine of Progression Platform.

It establishes:

- the responsibility boundary of the Engine;
- the canonical progression model;
- the aggregate and invariants;
- the lifecycle of definitions and Character progression state;
- all inbound and outbound Event contracts;
- read and write models;
- the reference relational schema;
- public, internal, and administrative APIs;
- operational, security, privacy, performance, and audit requirements;
- deterministic behavior for edge cases;
- acceptance criteria sufficient for implementation and release.

The document is intentionally domain-agnostic. Terms such as lesson, membership, workout, order, course, guild, or tournament may appear only in non-normative examples. Runtime logic must not depend on them.

### Normative language

The key words **MUST**, **MUST NOT**, **REQUIRED**, **SHALL**, **SHALL NOT**, **SHOULD**, **SHOULD NOT**, **RECOMMENDED**, **MAY**, and **OPTIONAL** are to be interpreted as normative requirement levels.

Where this RFC refines a high-level diagram or informal statement in an earlier document, the ownership and contracts defined here take precedence for the Progression Engine. Any cross-document inconsistency must be resolved through an ADR rather than by allowing two Engines to write the same state.

---

## Goals

The Progression Engine has the following goals.

### G-1. Authoritative state ownership

Provide one authoritative writer for Experience, Level, Prestige, and per-Character Progression Track state.

### G-2. Domain-independent progression

Support schools, fitness products, education products, game communities, marketplaces, and future domains without changing Engine code.

### G-3. Deterministic calculation

Produce the same result when the same ordered operations are replayed against the same versioned definitions.

### G-4. Event-driven integration

Accept typed Events and publish typed outcome Events without synchronous Engine-to-Engine invocation.

### G-5. Data-driven rules

Represent level thresholds, cap behavior, Prestige behavior, activation windows, and presentation metadata as versioned data.

### G-6. Safe evolution

Permit new Track Definition versions, controlled migration, rollback of activation, replay, and correction without destructive database edits.

### G-7. Idempotent processing

Guarantee exactly-once durable effect for each logical progression request despite at-least-once Event delivery.

### G-8. Full auditability

Make every state change explainable through immutable ledger entries, source references, definition versions, actor identity, and before/after values.

### G-9. High-throughput operation

Scale horizontally across Characters and Progression Tracks while preserving per-aggregate consistency.

### G-10. Narrative-compatible output

Expose semantic transition Events and presentation metadata that allow products to communicate growth as a journey rather than as raw arithmetic.

### G-11. Operational safety

Provide validation, rate limits, dead-letter handling, reconciliation, repair, observability, and administrative controls suitable for production operation.

### G-12. Minimal coupling

Depend only on stable platform contracts and local projections. The critical mutation path must not require synchronous availability of another Engine.

---

## Non Goals

The following concerns are explicitly outside the responsibility of the Progression Engine.

### NG-1. Business action evaluation

The Engine does not determine whether a business action occurred, whether it was valid, or whether it should be rewarded.

### NG-2. Reward policy ownership

The Engine does not map arbitrary domain Events to rewards and does not own reward bundles, loot tables, currencies, Items, Titles, or cosmetics.

### NG-3. Reputation progression

Reputation is part of the broader canonical concept of Progression, but Reputation state is owned by the Reputation Engine. The Progression Engine owns only Experience-based Progression Tracks, Levels, and Prestige.

### NG-4. Achievement and Quest evaluation

The Engine does not evaluate Achievement Conditions, Quest Objectives, Campaign progression, or collections. It publishes transitions that those Engines may consume.

### NG-5. Talent ownership

The Engine does not own Talents or calculate Talent eligibility. Any modifier that affects an Experience reward must be resolved before the final Experience operation reaches this Engine, unless a future ADR introduces a shared deterministic modifier protocol.

### NG-6. Character lifecycle ownership

Creation, ownership, suspension, merge, deletion, and restoration of a Character are owned by the Character Engine. The Progression Engine mirrors only the minimum lifecycle state required to accept or reject operations.

### NG-7. Leaderboard ownership

The Engine provides progression data suitable for ranking but does not own social ranking rules, cohorts, anti-cheat ranking policy, or public leaderboard privacy.

### NG-8. Notification delivery

The Engine publishes transitions. It does not send email, push, chat, or in-product notifications.

### NG-9. Generic rule engine

The Engine is not a general-purpose expression runtime. Authoring tools may generate thresholds, but runtime progression behavior is intentionally constrained and explicit.

### NG-10. Arbitrary decrement mechanics

Experience is not a spendable currency. Routine product mechanics must not consume Experience. Negative changes are reserved for reversal, correction, migration, or explicitly approved future mechanics.

### NG-11. Real-time combat or simulation

The Engine is not a frame-based game system and does not process real-time combat statistics, abilities, cooldowns, or physics.

### NG-12. Cross-Character transactions

Transfers, shared pools, guild progression, family progression, and party progression are not part of the initial Engine scope.

---

## Responsibilities

The Progression Engine is responsible for the following capabilities.

### R-1. Progression Track Definition management

The Engine MUST support authoring, validation, versioning, publication, scheduling, activation, retirement, and archival of Progression Track Definitions.

### R-2. Character Progression Aggregate management

The Engine MUST maintain one aggregate for each `(Character, Progression Track)` pair that has been started or materially referenced.

### R-3. Experience operation processing

The Engine MUST process typed grants, reversals, administrative adjustments, migrations, and Prestige commands.

### R-4. Level derivation

The Engine MUST derive the current Level from the active state and the exact Track Definition version used for the operation.

### R-5. Prestige lifecycle

The Engine MUST enforce the configured Prestige mode, eligibility, reset behavior, overflow behavior, rank limits, and transition semantics.

### R-6. Cap behavior

The Engine MUST apply a configured cap policy deterministically when a Character reaches the maximum Level.

### R-7. Idempotency and ordering

The Engine MUST deduplicate logical operations and serialize conflicting writes to the same aggregate.

### R-8. Ledger maintenance

The Engine MUST append an immutable ledger entry for every accepted mutation, including no-op outcomes that are operationally significant, such as a capped grant whose applied amount is zero.

### R-9. Transition detection

The Engine MUST detect and record Level increases, Level decreases, cap reached, cap left, Prestige became available, Prestige completed, Prestige revoked, Track started, Track frozen, and Track closed.

### R-10. Event publication

The Engine MUST publish outcome Events using a transactional outbox or an equivalent atomic mechanism.

### R-11. Projection generation

The Engine MUST maintain read models for Character summaries, Track detail, progress history, transition history, and administrative inspection.

### R-12. Definition migration

The Engine MUST support explicit, resumable migration of Character aggregates between compatible Track Definition versions.

### R-13. Correction and reconciliation

The Engine MUST support authorized reversal, correction, replay, consistency checks, and repair workflows without direct database mutation.

### R-14. Explainability

The Engine MUST expose enough structured information to explain how a result was calculated, which source caused it, and which configuration version was used.

### R-15. Operational controls

The Engine MUST support freeze, unfreeze, dead-letter inspection, retry, throttling, health checks, metrics, logs, traces, and alerts.

---

## Dependencies

Dependencies are divided into normative platform contracts and implementation infrastructure.

### Character Engine

The Progression Engine depends on the Character Engine for canonical Character identity and lifecycle.

The Progression Engine MUST NOT synchronously call the Character Engine on every operation. It SHOULD consume Character lifecycle Events and maintain a local Character eligibility projection containing at minimum:

- `character_id`;
- lifecycle status;
- creation time;
- deletion or closure marker;
- optional realm or partition key if introduced by the Character Engine;
- source version or sequence.

If eligibility cannot be established, the operation MUST be retried or quarantined according to the missing-dependency policy. It MUST NOT be silently applied to an unknown Character.

### Reward Engine

The Reward Engine is the expected source of finalized Experience Reward
fulfillment requests.

The Reward Engine owns the decision that an action yields Experience and the calculation of the final reward amount, including policy-controlled multipliers. The Progression Engine owns application of that amount to progression state.

The two Engines communicate through the canonical
`reward.fulfillment.requested.v1` and fulfillment/reversal result Events from
`002b-cross-engine-integration`. Neither Engine may write the other Engine's
database.

### Event infrastructure

The Engine depends on durable Event transport providing:

- at-least-once delivery;
- stable Event identifiers;
- partitioning or routing metadata;
- consumer retry;
- dead-letter handling;
- retention sufficient for replay requirements;
- schema version identification.

Exactly-once transport is not required. Exactly-once durable effect is implemented by this Engine.

### Configuration Registry or LiveOps Engine

The Engine MAY use a shared configuration registry or LiveOps Engine for activation orchestration. Published Track Definition content remains owned and versioned by the Progression Engine.

External activation systems may request activation but MUST NOT mutate published definitions.

### Season Engine

The Season Engine MAY provide activation context for seasonal Tracks. The Progression Engine treats season references as opaque identifiers and consumes activation Events. It does not calculate Season schedules independently when the Season Engine is authoritative.

### Identity and Access Management

Administrative and command APIs depend on platform authentication, service identity, authorization scopes, and role assignment.

### Audit and observability infrastructure

The Engine depends on centralized logging, metrics, tracing, secret management, alerting, backup, and archival infrastructure. These dependencies must not become synchronous dependencies of the core write transaction except where required for security enforcement.

### Time source

The Engine requires a trusted UTC time source. Server processing timestamps MUST be generated from synchronized infrastructure time. Client timestamps are informational and untrusted.

### Database

The Engine requires a transactional datastore capable of:

- unique constraints;
- atomic multi-row transactions;
- row or optimistic concurrency control;
- durable append-only ledger storage;
- ordered pagination;
- online indexing and migration;
- point-in-time recovery.

A relational database is the reference implementation.

---

## Architecture Overview

### Context

```text
Business Module
    │
    │ domain Event
    ▼
Reward Engine / policy-owning Engine
    │
    │ progression.experience.grant.requested
    ▼
Event Bus
    │
    ▼
Progression Engine
    ├── validates and deduplicates
    ├── resolves Track Definition version
    ├── loads Character Progression Aggregate
    ├── applies deterministic state transition
    ├── appends ledger and transition records
    ├── commits transactional outbox
    └── updates local read models
            │
            ├── progression.experience.applied
            ├── progression.level.changed
            ├── progression.prestige.available
            ├── progression.prestige.completed
            └── progression.operation.rejected
                    │
                    ▼
        Quest / Achievement / Notification /
        Analytics / Projection consumers
```

### Ownership boundary

The Progression Engine is the sole authoritative writer for:

- Character Experience within a Progression Track;
- current Level;
- current Prestige Rank;
- cap and Prestige availability state;
- Progression ledger entries;
- Level and Prestige transition records;
- assignment of a Character aggregate to a Track Definition version.

Other systems MAY cache or project these values but MUST treat them as derived, read-only data.

### Internal components

A reference implementation contains the following logical components.

#### 1. Inbound Event Consumer

Receives Events, validates the platform Event envelope, checks supported schema versions, and routes operations by type.

#### 2. Operation Registry

Stores the processing status of each logical operation and enforces idempotency using both Event identity and business request identity.

#### 3. Character Eligibility Projection

Maintains the minimum Character lifecycle information required to reject operations for nonexistent, deleted, closed, or prohibited Characters.

#### 4. Definition Resolver

Resolves a Track key and optional requested version to one immutable published Track Definition version. It also applies activation policy and rejects ambiguous resolution.

#### 5. Aggregate Repository

Loads and persists the Character Progression Aggregate with optimistic concurrency or row-level locking.

#### 6. Progression Calculator

Pure deterministic domain logic. Given prior aggregate state, a validated operation, and a definition version, it returns:

- next aggregate state;
- applied and unapplied amounts;
- ledger data;
- semantic transitions;
- outcome Events;
- rejection or no-op reason.

The calculator MUST have no network access, current-time dependency, database access, random number generation, or hidden configuration.

#### 7. Ledger Writer

Appends immutable ledger records and links reversals or corrections to their source entries.

#### 8. Transition Recorder

Stores Level, cap, and Prestige transitions as explicit records rather than requiring clients to infer them from ledger arithmetic.

#### 9. Transactional Outbox

Persists outgoing Events in the same transaction as aggregate and ledger updates.

#### 10. Outbox Publisher

Publishes committed Events and records delivery attempts. Duplicate publication is allowed; consumers must remain idempotent.

#### 11. Projection Workers

Build read-optimized views. A synchronous projection MAY be updated in the write transaction for critical reads, while secondary projections MAY be eventual.

#### 12. Administration Service

Provides definition authoring, validation, simulation, publication, activation, migration, correction, freeze, replay, and inspection workflows.

#### 13. Reconciliation Worker

Detects divergence between aggregate state, ledger replay, transitions, outbox status, and read models.

### Write transaction

For an accepted operation, the Engine MUST perform the following steps atomically:

1. claim or create the operation record;
2. load the target aggregate and lock its expected version;
3. resolve the immutable Track Definition version;
4. validate operation-specific invariants;
5. calculate next state;
6. append one ledger entry;
7. append zero or more transition records;
8. update aggregate state and increment aggregate version;
9. create outgoing outbox records;
10. mark the operation as applied or as an accepted no-op;
11. commit.

If the transaction rolls back, no partial state, ledger, transition, or outgoing Event may remain visible.

### Delivery semantics

Transport is at-least-once. Processing effect is exactly once per logical request.

The Engine MUST deduplicate by:

- inbound `event_id`;
- canonical `request_id` in the Event payload;
- source-specific uniqueness where required, such as `(reward_grant_id, reward_component_id)`.

A repeated operation with identical canonical content MUST return the original result.

A repeated identifier with materially different content MUST be rejected as an idempotency conflict and generate a security-relevant audit record.

### Ordering model

Global ordering is not required.

All operations targeting the same `(character_id, track_id)` aggregate MUST be serialized by transaction conflict handling, partition affinity, or both.

Event occurrence time does not define mutation order. By default, operations are applied in committed processing order. A source that requires strict source ordering MUST provide a monotonic source sequence and use a Track policy that enables sequence validation.

### Consistency model

- Aggregate state, ledger, transitions, and outbox: strongly consistent within one write transaction.
- Primary Character Track read: read-your-write when accessed through the command result or primary store.
- Summary and feed projections: eventually consistent.
- External consumers: eventually consistent according to Event delivery.
- Analytics: non-authoritative.

### Failure isolation

A malformed or unsupported operation MUST fail independently and must not block unrelated partitions.

Repeated transient failures MUST use bounded retry with backoff and jitter. Permanent validation failures MUST be rejected. Unknown dependency or suspected deployment mismatch SHOULD be quarantined for operator review rather than discarded.

---

## Canonical Definitions

The following definitions are normative additions for the Progression Engine and must be incorporated into the shared Domain Definition when that document is revised.

### Progression Track

A named, independently configured path of Experience-based Character growth.

A Character MAY participate in multiple Progression Tracks. A Track is domain-agnostic and may represent platform-wide growth, a bounded program, a seasonal path, or another configured progression context.

A Track does not own a Character and does not alter Character ownership.

### Track Key

A stable, human-readable identifier for a Progression Track across versions, for example `core`, `season_2026_03`, or `mastery_alpha`.

A Track Key is immutable after creation. Display names are localized presentation data and may change through new versions.

Track Keys MUST use lowercase ASCII letters, digits, dots, underscores, or hyphens and MUST be unique within the platform namespace.

### Progression Track Definition

The immutable, published configuration that determines runtime behavior for one Track version.

It includes:

- Level range;
- cumulative Experience thresholds;
- cap policy;
- Prestige policy;
- operation limits;
- optional activation metadata;
- localization keys;
- presentation metadata;
- migration compatibility metadata.

### Track Definition Version

A positive integer that identifies one immutable published version of a Progression Track Definition.

Draft revisions are not runtime versions. A version number is assigned no later than publication and is never reused.

### Experience

An integer unit representing quantitative progress within one Progression Track.

Experience is non-spendable. It is changed through grants, reversals, corrections, and migrations.

The abbreviation `XP` MAY be used in user-facing copy, examples, and field descriptions, but canonical API and database names SHOULD use `experience` unless an established compatibility contract requires `xp`.

### Experience Threshold

The cumulative Experience required to occupy a Level within a specific Track Definition version.

The minimum Level threshold MUST be zero. Thresholds MUST be strictly increasing for successive Levels.

### Level

The discrete stage derived from the Character's current Experience within the active Prestige cycle and the applicable Track Definition version.

Level is authoritative state owned by the Engine but is always derivable from the same state and definition. It is stored for efficient access and validated against derivation.

### Maximum Level

The highest Level in a Track Definition version.

### Level Transition

An immutable record that a Character moved from one Level to another as a result of one operation.

A single operation may cross multiple Levels. The Engine MUST store both the aggregate transition and, when configured for detailed history, each intermediate Level boundary.

### Cap

The state in which a Character has reached the maximum Level for the current Prestige cycle.

Being at cap does not by itself imply that Prestige is enabled or available.

### Cap Policy

The configured behavior for Experience applied while a Character is at or crosses the maximum Level.

Initial supported values are:

- `clamp`: Experience above the maximum threshold is not applied;
- `bank_overflow`: Experience above the maximum threshold is stored as overflow but does not change Level;
- `auto_prestige`: overflow is consumed by automatic Prestige transitions according to the Prestige policy.

A Track MUST select exactly one cap policy.

### Overflow Experience

Experience accepted beyond the maximum Level threshold and stored separately according to `bank_overflow` or temporarily used during `auto_prestige` calculation.

Overflow Experience is not included in Level derivation until a policy explicitly consumes it.

### Prestige

An optional progression cycle that allows a Character at the maximum Level to begin a new cycle and increment Prestige Rank.

Prestige is not a synonym for Level. It is a separate state dimension.

### Prestige Rank

A non-negative integer indicating how many completed Prestige transitions exist for the Character in the Track.

### Prestige Mode

The configured initiation behavior for Prestige:

- `disabled`: Prestige is unavailable;
- `manual`: an authorized player or service command initiates Prestige after eligibility;
- `automatic`: the Engine initiates Prestige when an Experience operation satisfies the configured threshold and cap policy is `auto_prestige`.

### Prestige Eligibility

A derived state indicating that all configured conditions for manual Prestige are satisfied.

The initial specification supports conditions based on:

- current Level equals maximum Level;
- minimum overflow Experience;
- maximum Prestige Rank not reached;
- aggregate not frozen or closed;
- Track active for progression.

Cross-Engine Conditions are outside initial scope.

### Progression Position

The tuple describing current authoritative progression state within one Track:

- Prestige Rank;
- current Experience in the active cycle;
- overflow Experience;
- current Level;
- cap state;
- Prestige eligibility.

### Character Progression Aggregate

The consistency boundary for one Character in one Progression Track.

### Progression Operation

A typed request to mutate or explicitly evaluate a Character Progression Aggregate.

Supported initial operation types are:

- `experience_grant`;
- `experience_reversal`;
- `experience_adjustment`;
- `definition_migration`;
- `prestige_commit`;
- `prestige_revoke`;
- `track_freeze`;
- `track_unfreeze`;
- `track_close`;
- `track_reopen`.

### Experience Grant

A positive Experience operation produced by an authorized platform policy owner, normally the Reward Engine.

### Experience Reversal

An operation that reverses all or part of a previously applied grant or adjustment by referencing the original ledger entry.

### Experience Adjustment

An explicitly authorized correction that changes Experience without representing a normal Reward. Adjustments require a reason code and elevated authorization.

### Progression Ledger Entry

An immutable record of one accepted operation and its applied effect.

### Accepted No-op

An operation that is valid and durably recorded but applies zero Experience or no state change because of a deterministic policy, such as a clamped grant at cap or an already satisfied freeze request.

### Source Event

The immutable Event that ultimately caused a progression operation. A Progression operation may also reference an intermediate Reward grant Event.

### Definition Migration

An explicit operation that moves an aggregate from one Track Definition version to another according to a published migration policy.

### Aggregate Version

A monotonically increasing integer used for optimistic concurrency and Event ordering within one Character Progression Aggregate.

### Progression Projection

A read-optimized, non-authoritative representation of progression state.

---

## Lifecycle

The Progression Engine manages two related lifecycles:

1. the lifecycle of a Progression Track Definition;
2. the lifecycle of a Character Progression Aggregate within a Track.

The lifecycles are independent. Retiring a definition does not delete Character state, and closing one Character aggregate does not alter the Track Definition.

### Progression Track Definition lifecycle

```text
DRAFT
  │ validate
  ▼
VALIDATED
  │ publish
  ▼
PUBLISHED
  │ activate now / schedule
  ├──────────────► SCHEDULED
  │                    │ activation time or Event
  ▼                    ▼
ACTIVE ◄───────────────┘
  │ replace or retire
  ▼
RETIRED
  │ retention elapsed and no operational dependency
  ▼
ARCHIVED
```

#### DRAFT

A mutable authoring state.

A Draft MAY be edited, simulated, cloned, or deleted. It MUST NOT be resolved by runtime operations.

#### VALIDATED

A Draft that passed structural, semantic, overflow, compatibility, and simulation checks.

Validation does not make content immutable. Any edit returns the Draft to `DRAFT` and invalidates prior validation results.

#### PUBLISHED

An immutable version with a permanent version number and content hash.

Publication MUST atomically store:

- canonical serialized definition;
- explicit Level thresholds;
- version number;
- author and approver identity;
- validation report hash;
- publication timestamp;
- content hash;
- compatibility classification.

A Published version may be inactive.

#### SCHEDULED

A Published version with a future activation instruction.

Scheduling MUST record the authoritative time zone context, but the normalized activation time MUST be stored in UTC.

#### ACTIVE

A Published version eligible for resolution by new operations according to activation policy.

At most one version of a Track may be the default Active version for new aggregates at a given instant. Multiple versions may remain operational because existing aggregates can be pinned to older versions.

#### RETIRED

A Published version that is no longer assigned to new aggregates and is not selected as the default for unpinned operations.

Existing aggregates MAY continue to use a Retired version until migrated or closed.

#### ARCHIVED

A retained, immutable version removed from normal administrative lists. Archived versions MUST remain retrievable for audit, replay, and historical explanation while dependent ledger or aggregate records exist.

### Definition lifecycle rules

1. Published content MUST NOT be edited.
2. A change to any runtime-semantic field MUST create a new version.
3. Localization text MAY be independently versioned if it cannot affect calculation. Localization keys referenced by a published definition remain immutable identifiers.
4. Deactivating a version MUST NOT rewrite existing aggregates.
5. Activation and retirement MUST emit Events.
6. A version with active migration jobs MUST NOT be archived.
7. A version referenced by ledger entries MUST NOT be physically deleted.
8. A version cannot become Active if its predecessor compatibility policy requires a migration plan and no approved plan exists.
9. Scheduled activation MUST be idempotent.
10. Clock failure or duplicate scheduler execution MUST not activate the same version twice.

### Character Progression Aggregate lifecycle

```text
NOT_STARTED
    │ first accepted grant, migration seed, or explicit start
    ▼
ACTIVE ───────────────► FROZEN
  │  ▲                    │
  │  └──── unfreeze ──────┘
  │
  ├── reaches max Level ─► CAPPED
  │                         │
  │                         ├── manual eligibility ─► PRESTIGE_AVAILABLE
  │                         │                            │
  │                         │                            └── commit ─► ACTIVE
  │                         │
  │                         └── correction/reversal ─► ACTIVE
  │
  └── close ─────────────► CLOSED
                              │
                              └── authorized reopen ─► ACTIVE/FROZEN/CAPPED
```

`CAPPED` and `PRESTIGE_AVAILABLE` are derived operational statuses of an otherwise open aggregate. They do not create a separate storage aggregate.

#### NOT_STARTED

No aggregate row exists, or an optional lazy placeholder exists with no applied ledger entries.

A read request for a not-started Track MUST return a deterministic zero-state projection when the Track is visible, without necessarily creating storage.

#### ACTIVE

The aggregate accepts eligible progression operations.

#### CAPPED

The current Level equals the maximum Level. Handling of further Experience depends on cap policy.

#### PRESTIGE_AVAILABLE

Manual Prestige is enabled and eligibility is true.

#### FROZEN

Normal grants and player commands are rejected or deferred according to freeze policy. Administrative correction, reversal, migration, and unfreeze remain available to authorized actors.

A freeze is intended for fraud investigation, support intervention, migration safety, or operational incident containment. It is not a business-domain suspension mechanism.

#### CLOSED

The aggregate does not accept normal progression operations. Historical state remains readable subject to privacy policy.

Closure may result from Character closure, Track shutdown, legal restriction, or an explicit administrative action.

### Aggregate start

An aggregate is created lazily on the first accepted operation requiring durable state.

Initial state MUST be:

- `experience = 0`;
- `overflow_experience = 0`;
- `level = minimum_level`;
- `prestige_rank = 0`;
- `lifetime_positive_experience = 0`;
- `lifetime_net_experience = 0`;
- `status = active`, unless the operation explicitly creates a frozen or closed aggregate;
- `definition_version = resolved version`;
- `aggregate_version = 1` after the first committed mutation.

The first mutation MUST also emit `progression.track.started.v1`.

### Character lifecycle propagation

The Engine MUST react to Character lifecycle Events.

Recommended behavior:

- `character.created`: update eligibility projection; do not eagerly create progression aggregates;
- `character.suspended`: apply policy-driven freeze to open aggregates or reject new operations through eligibility projection;
- `character.reactivated`: restore eligibility but do not automatically unfreeze an aggregate frozen for another reason;
- `character.closed`: close all open aggregates using resumable batch processing;
- `character.restored`: make aggregates eligible for explicit reopen according to policy;
- `character.deleted`: preserve or anonymize records according to privacy and legal policy; do not hard-delete ledger records without approved retention processing;
- `character.merged`: unsupported in initial release unless a dedicated migration plan exists.

### Definition migration lifecycle

A migration job follows:

```text
DRAFT → VALIDATED → APPROVED → RUNNING → PAUSED → RUNNING → COMPLETED
                                      └──────────────► FAILED
                                      └──────────────► CANCELLED
```

Each aggregate migration is independently idempotent.

A migration MUST specify one of the supported strategies:

- `preserve_experience`: keep cycle Experience and derive Level using the target thresholds;
- `preserve_level_floor`: guarantee the prior Level or higher by increasing Experience to the target threshold if required;
- `preserve_relative_position`: map normalized progress through the prior Level to the equivalent target Level interval;
- `explicit_mapping`: use a materialized mapping table;
- `reset_with_compensation`: reset state and reference a separately approved compensation plan.

The initial implementation SHOULD support `preserve_experience` and `explicit_mapping`. Other strategies MAY be introduced only with deterministic specifications and test vectors.

A migration MUST NOT silently reduce Prestige Rank. Any strategy that can reduce Level or remove banked overflow requires explicit approval and user communication metadata.

---

## Aggregate

### Aggregate identity

The aggregate key is:

```text
(character_id, track_id)
```

`track_id` identifies the stable Track, not a version. The aggregate stores the currently assigned Track Definition version.

### Aggregate root

The aggregate root is `CharacterProgression`.

Reference fields:

```text
CharacterProgression
├── character_id
├── track_id
├── track_key
├── definition_version
├── status
├── experience
├── overflow_experience
├── level
├── prestige_rank
├── prestige_available
├── lifetime_positive_experience
├── lifetime_net_experience
├── last_ledger_sequence
├── aggregate_version
├── started_at
├── updated_at
├── capped_at
├── frozen_at
├── closed_at
└── state_hash
```

### Aggregate invariants

The following invariants MUST hold after every committed operation.

#### Identity invariants

1. `character_id` is immutable.
2. `track_id` is immutable.
3. There is at most one aggregate per `(character_id, track_id)`.
4. `track_key` matches `track_id` and is stored only as a denormalized diagnostic value.

#### Numeric invariants

1. `experience >= 0`.
2. `overflow_experience >= 0`.
3. `prestige_rank >= 0`.
4. `lifetime_positive_experience >= 0`.
5. `lifetime_net_experience` may be negative only for a corrupted or imported historical case; normal runtime processing MUST prevent it from becoming negative.
6. All arithmetic MUST be checked for signed 64-bit overflow before persistence.
7. `level` is within the definition's minimum and maximum Level.
8. For non-corrupt state, `level = derive_level(experience, definition)`.

#### Version invariants

1. `definition_version` references a Published, Scheduled, Active, Retired, or Archived immutable version.
2. Every ledger entry references the exact definition version used for its calculation.
3. `aggregate_version` increases by exactly one for each accepted operation that creates a ledger entry.
4. `last_ledger_sequence` increases by exactly one for each ledger entry in the aggregate.
5. The aggregate state hash corresponds to the canonical persisted state.

#### Status invariants

1. A Closed aggregate rejects normal grants.
2. A Frozen aggregate rejects normal grants unless freeze policy is `queue` and a separate deferred operation mechanism is enabled.
3. `prestige_available` may be true only when Prestige mode is `manual`, eligibility is satisfied, and aggregate status permits Prestige.
4. `capped_at` is non-null if and only if the current state is at cap, unless retained as historical metadata in a separate field.
5. `closed_at` is non-null for Closed state.

#### Cap invariants

1. Under `clamp`, `experience` MUST NOT exceed the maximum Level threshold and `overflow_experience` MUST equal zero.
2. Under `bank_overflow`, `experience` MUST equal the maximum Level threshold while capped and excess accepted Experience is stored in `overflow_experience`.
3. Under `auto_prestige`, excess Experience MUST be applied through zero or more deterministic Prestige cycles, subject to rank limits.
4. If automatic Prestige reaches a maximum Prestige Rank, remaining Experience follows the configured terminal cap behavior, which MUST be either `clamp` or `bank_overflow`.

#### Ledger invariants

1. Every state-changing operation has exactly one ledger entry.
2. Every accepted no-op has exactly one ledger entry with `applied_delta = 0` and a non-null no-op reason.
3. A rejected operation has no progression ledger entry but has an operation record and audit record.
4. A reversal references an existing reversible ledger entry.
5. Cumulative reversals MUST NOT exceed the reversible applied amount of the source entry unless an administrator uses an independent adjustment instead.

### Aggregate commands

The aggregate supports the following domain commands.

#### ApplyExperienceGrant

Inputs:

- request identity;
- Character and Track identity;
- positive requested amount;
- source references;
- finalized calculation breakdown;
- optional definition version constraint;
- optional source sequence;
- Event occurrence time.

Outputs:

- applied amount;
- unapplied amount;
- next state;
- zero or more transitions;
- ledger entry;
- outcome Events.

#### ApplyExperienceReversal

Inputs include the source ledger entry and positive amount to reverse.

The Engine converts the requested reversal into a negative applied delta. A reversal is not represented as a negative grant.

#### ApplyExperienceAdjustment

Inputs include signed adjustment amount, reason code, operator identity, approval reference when required, and expected aggregate version.

#### CommitPrestige

Valid only for manual Prestige and eligible state.

#### RevokePrestige

Administrative operation. It requires an explicit target rank or transition reference, a migration-quality calculation plan, and dual authorization above configured risk thresholds.

#### MigrateDefinition

Changes the assigned definition version and transforms state according to an approved migration plan.

#### Freeze and Unfreeze

Changes operation eligibility without modifying Experience.

#### Close and Reopen

Changes lifecycle status while preserving history.

### Calculation order

For an Experience grant, the pure calculator MUST use this order:

1. validate positive requested amount;
2. validate aggregate lifecycle and Track availability;
3. determine definition version;
4. validate source sequence if enabled;
5. determine current cap and Prestige state from prior authoritative state;
6. apply amount according to cap and Prestige policy;
7. derive next Level;
8. calculate Prestige eligibility;
9. detect transitions;
10. calculate lifetime counters;
11. produce a deterministic result hash.

No presentation rounding or localized data may affect calculation.

### Level derivation

Given explicit thresholds sorted by Level:

```text
level = greatest L where threshold[L] <= experience
```

The implementation SHOULD use binary search or an equivalent indexed lookup.

For a Track with minimum Level `1`, the threshold for Level `1` MUST be `0`.

`experience_into_level` is:

```text
experience - threshold[current_level]
```

`experience_to_next_level` is:

```text
threshold[next_level] - experience
```

At maximum Level, `experience_to_next_level` is `null`.

### Multiple-Level transitions

A single operation may cross any number of Levels up to configured safety limits.

The Engine MUST:

- store the prior and final Level;
- emit one `progression.level.changed.v1` Event containing all crossed Level numbers or a bounded summary;
- optionally emit one boundary Event per Level if a consumer contract explicitly requires it;
- prevent unbounded Event amplification by enforcing a maximum detailed boundary count;
- retain complete transition information in storage even if the outbound Event uses compact representation.

### Reversal calculation

A reversal MUST reference a prior ledger entry and may reverse all or part of its remaining reversible amount.

The Engine MUST:

1. verify the source entry belongs to the same Character and Track;
2. verify the source type is reversible;
3. compute remaining reversible amount;
4. reject an excessive reversal;
5. apply the negative delta without allowing Experience below zero;
6. update Level and cap state;
7. preserve Prestige Rank by default unless the reversal explicitly targets a Prestige-causing transition under an approved correction workflow;
8. record the linkage in both entries;
9. emit Level decrease or cap-left Events when applicable.

The default preservation of Prestige prevents routine reward reversals from silently removing a permanent milestone. This rule does not make erroneous Prestige irreversible; it requires a separate privileged correction.

### Administrative adjustment calculation

An adjustment may be positive or negative.

- Positive adjustment follows grant cap behavior unless `bypass_cap_policy` is explicitly authorized.
- Negative adjustment may reduce Level.
- Negative adjustment MUST NOT reduce Experience below zero.
- Adjustment MUST NOT change Prestige Rank unless the operation type is `prestige_revoke`.
- Adjustment at a prior definition version is prohibited. It applies to the aggregate's current version.

### Manual Prestige calculation

On successful manual Prestige:

1. confirm eligibility using the current immutable definition;
2. confirm the expected aggregate version to prevent stale double commitment;
3. increment Prestige Rank by one;
4. set cycle Experience to the configured reset Experience, normally zero;
5. process banked overflow according to `prestige_overflow_policy`;
6. derive reset Level;
7. recalculate eligibility;
8. record a Prestige transition and ledger entry;
9. emit `progression.prestige.completed.v1` and any resulting Level transition Event.

Supported `prestige_overflow_policy` values:

- `discard`: set overflow to zero;
- `carry`: move overflow into the new cycle, potentially crossing Levels but not automatically causing another manual Prestige;
- `retain_banked`: keep overflow banked and require explicit application through a future command.

A Track MUST choose one policy when manual Prestige is enabled.

### Automatic Prestige calculation

Automatic Prestige requires `cap_policy = auto_prestige` and `prestige_mode = automatic`.

The calculator applies the grant iteratively or mathematically across cycles. It MUST produce the same result independent of batching.

For example, applying one grant of `10,000` Experience must produce the same final Position as applying ten ordered grants of `1,000`, unless a documented per-operation limit or modifier makes the operations semantically different before reaching this Engine.

The Engine MUST enforce a maximum automatic Prestige transitions per operation. If the amount would exceed the limit, the operation MUST be rejected before mutation or processed through a bounded batch protocol. Silent truncation is prohibited.

### Determinism requirements

The following inputs fully determine a result:

- prior aggregate state;
- canonical operation payload;
- immutable Track Definition version;
- explicit migration policy when applicable.

The following MUST NOT affect the result:

- processing node;
- database query plan;
- wall-clock time at processing;
- message retry count;
- locale;
- client platform;
- unordered JSON object representation;
- floating-point implementation;
- external service response.

---

## State Model

### Platform Standard Level Profile

The Engine MUST ship the published Track Definition
`platform.standard.100.v1` defined by `004a-standard-level-profile`.

The standard profile has these invariants:

- minimum Level `1` and maximum Level `100`;
- Level `1` starts at `0` cumulative Experience;
- the 100 cumulative thresholds are materialized integers and immutable;
- Prestige is disabled;
- the terminal cap policy is `clamp`;
- routine business activity cannot reduce Experience;
- every Experience Reward names its target Track explicitly.

New Context Modules SHOULD bind their primary Character progression to this
profile. A Module that requires a different primary curve MUST publish an ADR,
simulation evidence, migration policy, and user-facing compatibility plan.

Domain mastery, certification, rank, decay, physical workload, commercial
status, and attendance are not aliases for the standard Character Level. Such
state remains in its authoritative business owner or a separately published
Progression Track when it satisfies this Engine's non-decreasing Experience
semantics. Levels from different Tracks MUST NOT be added together to invent a
new authoritative Level.

The formula retained in authoring provenance MUST NOT be evaluated at runtime.
Runtime derivation uses only the explicit threshold rows published with the
Definition.

### Track Definition model

A Progression Track Definition contains the following normative fields.

| Field | Type | Required | Description |
|---|---:|---:|---|
| `track_id` | UUIDv7 | yes | Stable internal Track identifier. |
| `track_key` | string | yes | Stable external Track key. |
| `version` | integer | yes | Immutable published version. |
| `status` | enum | yes | Definition lifecycle status. |
| `minimum_level` | integer | yes | Lowest Level, normally `1`. |
| `maximum_level` | integer | yes | Highest Level. |
| `thresholds` | array | yes | Explicit cumulative Experience thresholds. |
| `cap_policy` | enum | yes | `clamp`, `bank_overflow`, or `auto_prestige`. |
| `terminal_cap_policy` | enum/null | conditional | Behavior after maximum Prestige Rank. |
| `prestige_policy` | object | yes | Disabled or configured Prestige behavior. |
| `operation_limits` | object | yes | Per-operation and state safety limits. |
| `activation` | object | yes | Runtime assignment and visibility metadata. |
| `presentation` | object | yes | Localization and visual metadata without calculation semantics. |
| `compatibility` | object | yes | Migration compatibility declaration. |
| `content_hash` | string | yes | Hash of canonical published content. |
| `published_at` | timestamp | yes | Publication time. |
| `published_by` | principal id | yes | Publisher identity. |

### Level threshold model

Each Level Definition contains:

| Field | Type | Required | Description |
|---|---:|---:|---|
| `level` | integer | yes | Sequential Level number. |
| `minimum_experience` | int64 | yes | Cumulative Experience threshold. |
| `display_name_key` | string | no | Localization key. |
| `narrative_key` | string | no | Narrative description key. |
| `icon_key` | string | no | Asset reference. |
| `metadata` | object | no | Non-authoritative presentation metadata. |

Runtime calculation MUST use only `level` and `minimum_experience`.

### Prestige policy model

| Field | Type | Required | Description |
|---|---:|---:|---|
| `mode` | enum | yes | `disabled`, `manual`, or `automatic`. |
| `maximum_rank` | integer/null | yes | Null means no configured rank cap, subject to platform safety limit. |
| `reset_experience` | int64 | conditional | New cycle Experience after Prestige. |
| `minimum_overflow_for_manual` | int64 | conditional | Required banked overflow for manual Prestige. |
| `overflow_policy` | enum | conditional | Manual Prestige overflow behavior. |
| `rank_display_key_pattern` | string | no | Presentation key pattern. |
| `terminal_cap_policy` | enum | conditional | Applied when maximum rank is reached. |

`reset_experience` MUST resolve to a valid Level and MUST NOT exceed the maximum Level threshold.

### Operation limits model

Initial limits SHOULD include:

- maximum requested Experience per grant;
- maximum positive adjustment;
- maximum negative adjustment;
- maximum banked overflow;
- maximum Prestige transitions per operation;
- maximum detailed Level boundaries per Event;
- maximum metadata size;
- maximum source timestamp skew accepted without review;
- optional maximum operations per Character per minute.

Limits are security and operational controls. A change to a runtime calculation limit that can alter accepted results requires a new Track Definition version or a separately versioned platform policy with auditability.

### Character Progression state

| Field | Type | Description |
|---|---:|---|
| `character_id` | UUIDv7 | Character identity. |
| `track_id` | UUIDv7 | Stable Track identity. |
| `definition_version` | integer | Assigned immutable version. |
| `status` | enum | `active`, `frozen`, or `closed`. |
| `experience` | int64 | Current cycle Experience. |
| `overflow_experience` | int64 | Banked Experience beyond cap. |
| `level` | integer | Derived current Level. |
| `prestige_rank` | integer | Completed Prestige count. |
| `prestige_available` | boolean | Derived manual Prestige eligibility. |
| `lifetime_positive_experience` | int64 | Sum of positive applied Experience, excluding migration-only synthetic movement unless configured. |
| `lifetime_net_experience` | int64 | Sum of signed applied Experience deltas. |
| `last_source_sequence` | int64/null | Optional strict source ordering cursor. |
| `last_ledger_sequence` | int64 | Per-aggregate ledger sequence. |
| `aggregate_version` | int64 | Optimistic concurrency version. |
| `state_hash` | string | Canonical state checksum. |
| timestamps | timestamp | Start, update, cap, freeze, close metadata. |

### Derived state

The following fields SHOULD be computed in projections rather than stored as independent authoritative values unless performance requires caching:

- Experience into current Level;
- Experience to next Level;
- Level progress ratio;
- Track completion ratio;
- next Level presentation metadata;
- is at cap;
- Prestige requirement progress;
- user-facing narrative state.

If cached, they MUST be recomputable and MUST NOT participate in command validation without verification against authoritative state.

### Progress ratio

For a non-maximum Level:

```text
numerator   = experience - threshold[current_level]
denominator = threshold[next_level] - threshold[current_level]
ratio       = numerator / denominator
```

The authoritative API SHOULD return `numerator` and `denominator` as integers. A convenience decimal ratio MAY be returned as a string with defined precision. Floating-point ratios MUST NOT be used for state transitions.

At maximum Level:

- `level_progress_numerator` equals zero or the cap-specific displayed value;
- `level_progress_denominator` is null;
- `level_progress_ratio` is null;
- cap and Prestige fields communicate the next meaningful action.

### Ledger state

A ledger entry contains:

- immutable ledger identifier;
- aggregate identity;
- per-aggregate sequence;
- operation type;
- requested amount;
- applied delta;
- unapplied amount;
- Experience before and after;
- overflow before and after;
- Level before and after;
- Prestige Rank before and after;
- definition version;
- source references;
- reason code;
- actor and authorization context;
- original entry reference for reversal;
- calculation breakdown hash;
- prior and resulting state hashes;
- creation time.

### Operation state

Operation processing status is one of:

- `received`;
- `processing`;
- `applied`;
- `accepted_noop`;
- `rejected`;
- `retry_pending`;
- `quarantined`;
- `dead_lettered`.

The operation record is the idempotency authority. It stores the canonical request hash and final result reference.

### Transition state

Transition types are:

- `track_started`;
- `level_increased`;
- `level_decreased`;
- `cap_reached`;
- `cap_left`;
- `prestige_available`;
- `prestige_unavailable`;
- `prestige_completed`;
- `prestige_revoked`;
- `definition_migrated`;
- `track_frozen`;
- `track_unfrozen`;
- `track_closed`;
- `track_reopened`.

Transitions are immutable and ordered by aggregate version.

---

## Events

### Event design principles

1. Events describe facts that have occurred or typed operations requested.
2. Event names use lowercase dot-separated namespaces and include a schema version suffix.
3. Events are immutable.
4. Outcome Events are published only after the authoritative transaction commits.
5. Consumers must deduplicate by canonical `eventId`.
6. Payloads contain canonical identifiers and bounded metadata, not arbitrary business payloads.
7. Personally identifiable information MUST NOT be copied into progression Events.
8. Event time and processing time are separate.
9. Every mutation Event includes correlation and causation identifiers.
10. Breaking schema changes require a new versioned Event type.

### Inbound Events

The initial Engine supports the following inbound Event types.

| Event type | Producer | Purpose |
|---|---|---|
| `reward.fulfillment.requested.v1` with `componentType=EXPERIENCE` and `ownerEngine=progression` | Reward Engine | Apply one finalized Experience Reward Component. |
| `reward.reversal.requested.v1` with `componentType=EXPERIENCE` and `ownerEngine=progression` | Reward Engine | Reverse the exact prior Experience fulfillment where permitted. |
| `progression.experience.grant.requested.v1` | Explicitly registered non-Reward platform policy service | Apply a finalized positive Experience operation outside Reward policy. |
| `progression.experience.reversal.requested.v1` | Support or fraud workflow | Reverse a prior non-Reward or legacy Experience entry. |
| `progression.experience.adjustment.requested.v1` | Administration service | Apply authorized correction. |
| `progression.prestige.commit.requested.v1` | API gateway, client command service, or trusted service | Commit manual Prestige. |
| `progression.prestige.revoke.requested.v1` | Administration service | Correct an erroneous Prestige. |
| `progression.definition.migration.requested.v1` | Migration orchestrator | Move one aggregate to a target version. |
| `progression.track.freeze.requested.v1` | Administration, fraud, Character lifecycle workflow | Freeze an aggregate. |
| `progression.track.unfreeze.requested.v1` | Administration workflow | Unfreeze an aggregate. |
| `progression.track.close.requested.v1` | Character lifecycle workflow or administration | Close an aggregate. |
| `progression.track.reopen.requested.v1` | Character restoration or administration | Reopen an aggregate. |
| `character.created.v1` | Character Engine | Update eligibility projection. |
| `character.suspended.v1` | Character Engine | Restrict progression according to policy. |
| `character.reactivated.v1` | Character Engine | Restore Character eligibility. |
| `character.closed.v1` | Character Engine | Close related aggregates. |
| `character.restored.v1` | Character Engine | Permit controlled reopen. |
| `progression.definition.activation.requested.v1` | Administration or LiveOps | Activate a published version. |
| `progression.definition.retirement.requested.v1` | Administration or LiveOps | Retire a version. |
| `season.content.binding.activated.v1` | Season Engine | Activate the exact seasonal Track binding context. |
| `season.content.binding.deactivated.v1` | Season Engine | Stop new operations under the binding according to Track policy. |
| `season.schedule.revised.v1` | Season Engine | Update the locally projected governing schedule revision. |
| `season.edition.closed.v1` | Season Engine | Apply the Track-owned close and lateness policy for the bound Edition. |

The Engine MUST reject arbitrary business Events such as `lesson.completed` unless an explicit platform architecture revision assigns reward mapping responsibility to the Progression Engine. The initial ownership model requires a typed Experience request.

### Outbound Events

| Event type | Meaning |
|---|---|
| `progression.operation.applied.v1` | A progression operation committed successfully. |
| `progression.operation.accepted.noop.v1` | A valid operation committed with no state effect. |
| `progression.operation.rejected.v1` | A permanent validation or authorization failure occurred. |
| `progression.track.started.v1` | A Character began a Track. |
| `progression.experience.applied.v1` | Experience was applied, reversed, or adjusted. |
| `progression.level.changed.v1` | Level changed in either direction. |
| `progression.cap.reached.v1` | Maximum Level was reached. |
| `progression.cap.left.v1` | Character moved below cap. |
| `progression.prestige.available.v1` | Manual Prestige became available. |
| `progression.prestige.unavailable.v1` | Manual Prestige ceased to be available. |
| `progression.prestige.completed.v1` | Prestige Rank increased. |
| `progression.prestige.revoked.v1` | Prestige Rank was administratively reduced. |
| `progression.definition.published.v1` | A Track Definition version was published. |
| `progression.definition.activated.v1` | A version became Active. |
| `progression.definition.retired.v1` | A version was retired. |
| `progression.definition.migrated.v1` | One aggregate moved to a target version. |
| `progression.track.frozen.v1` | An aggregate was frozen. |
| `progression.track.unfrozen.v1` | An aggregate was unfrozen. |
| `progression.track.closed.v1` | An aggregate was closed. |
| `progression.track.reopened.v1` | An aggregate was reopened. |
| `progression.reconciliation.failed.v1` | A consistency check found divergence. |
| `progression.reconciliation.repaired.v1` | An approved repair completed. |
| `reward.fulfillment.succeeded.v1` | Progression applied or accepted one Experience Reward Component. |
| `reward.fulfillment.failed.v1` | Progression rejected, quarantined, or could not currently apply the Component. |
| `reward.reversal.succeeded.v1` | Progression committed the compensating reversal. |
| `reward.reversal.failed.v1` | The requested reversal is retryable, invalid, or not reversible. |

### Event envelope

All Progression Events MUST use the exact camelCase canonical envelope from
`002a-platform-contract-standard`. Character Progression operations use
`characterId` as `partitionKey`, identify the Character as `subject`, and
include the resulting Progression Aggregate identity and version.

Reward fulfillment results use `rewardGrantId` as `partitionKey` as required by
the cross-Engine protocol. SQL and internal model names may remain snake_case;
wire contracts may not.

### Envelope validation

The Engine MUST validate:

- required fields exist;
- Event type and version are supported;
- identifiers satisfy length and character constraints;
- timestamps parse as UTC or include an explicit offset;
- payload size is within limits;
- source is authorized for the Event type;
- partition key is compatible with Character identity;
- metadata does not contain prohibited data;
- signature or transport identity is valid when required.

A malformed envelope is rejected before aggregate access.

### Event publication ordering

For Events emitted by one aggregate operation:

1. `progression.operation.applied.v1` or `accepted_noop` is the summary fact;
2. `progression.track.started.v1`, when applicable;
3. `progression.experience.applied.v1`, when applicable;
4. Level, cap, and Prestige transition Events in deterministic transition order;
5. definition migration or lifecycle Events as applicable.

Every Event MUST include `aggregate_version`. Consumers can use it to detect gaps or stale delivery.

The Event transport may deliver duplicates or reorder across partitions. Consumers must not assume global order.

---

## Event Contracts

### `reward.fulfillment.requested.v1` — EXPERIENCE owner contract

Progression consumes the canonical payload from
`002b-cross-engine-integration` only when `componentType=EXPERIENCE` and
`ownerEngine=progression`.

The registered `componentPayload` is:

```json
{
  "trackKey": "core",
  "amount": 250,
  "operationKind": "REWARD_GRANT",
  "rewardGrantId": "uuid",
  "rewardComponentId": "uuid",
  "calculation": {
    "baseAmount": 200,
    "modifierAmount": 50,
    "finalAmount": 250,
    "policyVersion": "reward-policy-42",
    "effectSetRevision": 31,
    "breakdownHash": "sha256:..."
  }
}
```

Progression maps `fulfillmentId` to its logical operation identity, validates
the immutable request fingerprint, and uses `(rewardGrantId, componentId)` as a
secondary uniqueness constraint. The finalized `amount` is an integer greater
than zero. Progression never recalculates Reward or Talent modifiers.

On commit, Progression publishes `reward.fulfillment.succeeded.v1` in the same
outbox transaction as its Progression domain Events. The canonical `outcome`
includes `requestedAmount`, `appliedAmount`, `unappliedAmount`,
`acceptedNoop`, `trackKey`, `levelBefore`, and `levelAfter`.

Retryable, terminal, and quarantined failures use
`reward.fulfillment.failed.v1`. A timeout is not proof of failure and is handled
by Reward retrying the same `fulfillmentId`.

### `reward.reversal.requested.v1` — EXPERIENCE owner contract

Progression resolves the exact original operation by `fulfillmentId` and
validates `reversalId`, `requestFingerprint`, Character, Track, original owner
operation, and remaining reversible amount.

A committed compensating ledger entry publishes
`reward.reversal.succeeded.v1`. Invalid, already consumed, conflicting, or
temporarily unavailable reversals publish `reward.reversal.failed.v1` with the
canonical failure object. The original ledger entry is never deleted.

### Common payload fields

Every progression operation request MUST include:

| Field | Type | Required | Description |
|---|---:|---:|---|
| `requestId` | string | yes | Stable logical idempotency identifier. |
| `characterId` | UUIDv7 | yes | Target Character. |
| `trackKey` | string | yes | Stable Track Key. |
| `requestedDefinitionVersion` | integer/null | no | Optional strict version constraint. |
| `reasonCode` | string | yes | Canonical machine-readable reason. |
| `sourceEventId` | UUIDv7 | yes | Ultimate source Event. |
| `sourceSequence` | int64/null | no | Optional ordered source sequence. |
| `effectiveAt` | timestamp/null | no | Business-effective time for history; does not control processing order. |
| `attributes` | object | no | Bounded, allow-listed, non-PII diagnostic metadata. |

`requestId` MUST be unique for the logical operation. Retrying a request MUST reuse it.

### `progression.experience.grant.requested.v1`

Purpose: request application of finalized positive Experience.

```json
{
  "requestId": "uuid",
  "characterId": "uuid",
  "trackKey": "core",
  "amount": 250,
  "requestedDefinitionVersion": null,
  "rewardGrantId": "uuid",
  "rewardComponentId": "xp-core-1",
  "reasonCode": "reward_component_applied",
  "sourceEventId": "uuid",
  "sourceSequence": null,
  "effectiveAt": "2026-07-18T12:30:00Z",
  "calculation": {
    "baseAmount": 200,
    "modifierAmount": 50,
    "finalAmount": 250,
    "policyVersion": "reward-policy-42",
    "breakdownHash": "sha256:..."
  },
  "attributes": {
    "campaignId": "optional-opaque-id"
  }
}
```

Validation rules:

1. `amount` MUST be an integer greater than zero.
2. `calculation.final_amount`, when present, MUST equal `amount`.
3. `rewardGrantId` and `rewardComponentId` MUST form a unique component identity.
4. The producer MUST be authorized to grant Experience for the Track.
5. The amount MUST not exceed the Track limit.
6. `requestedDefinitionVersion`, when present, MUST equal the aggregate version or be valid for new aggregate resolution.
7. Unknown calculation fields are ignored only if forward-compatible schema rules allow them; otherwise reject.

Idempotency keys:

- primary: `requestId`;
- secondary: `(reward_grant_id, reward_component_id)`;
- transport: `eventId`.

### `progression.experience.reversal.requested.v1`

Purpose: reverse a prior ledger effect.

```json
{
  "requestId": "uuid",
  "characterId": "uuid",
  "trackKey": "core",
  "originalLedgerEntryId": "uuid",
  "amount": 250,
  "reasonCode": "reward_revoked",
  "sourceEventId": "uuid",
  "effectiveAt": "2026-07-18T13:00:00Z",
  "attributes": {
    "caseId": "support-case-opaque-reference"
  }
}
```

Validation rules:

1. `amount` MUST be positive.
2. Original entry MUST exist and be reversible.
3. Original entry MUST belong to the same Character and Track.
4. Amount MUST not exceed remaining reversible applied amount.
5. Producer MUST be authorized for reversal.
6. A reversal of a reversal is prohibited; restoration uses a new positive grant or authorized adjustment.

### `progression.experience.adjustment.requested.v1`

Purpose: perform an authorized correction.

```json
{
  "requestId": "uuid",
  "characterId": "uuid",
  "trackKey": "core",
  "amount": -100,
  "expectedAggregateVersion": 73,
  "reasonCode": "support_correction",
  "approval": {
    "workflowId": "uuid",
    "approvedBy": ["principal-a", "principal-b"]
  },
  "sourceEventId": "uuid",
  "effectiveAt": "2026-07-18T13:15:00Z",
  "attributes": {
    "ticketId": "TICKET-1234"
  }
}
```

Validation rules:

1. `amount` MUST be a non-zero integer.
2. Expected aggregate version is REQUIRED for interactive administration.
3. Reason code MUST be from the adjustment allow-list.
4. Authorization and approval thresholds depend on absolute amount and potential Level impact.
5. The adjustment MUST NOT make Experience negative.
6. The adjustment MUST NOT alter Prestige Rank.

### `progression.prestige.commit.requested.v1`

```json
{
  "requestId": "uuid",
  "characterId": "uuid",
  "trackKey": "core",
  "expectedAggregateVersion": 88,
  "reasonCode": "player_prestige_commit",
  "sourceEventId": "uuid",
  "attributes": {}
}
```

Validation rules:

- Track Prestige mode MUST be `manual`.
- Aggregate MUST be eligible.
- Expected version MUST match.
- Character MUST be permitted to act.
- The command MUST not be accepted twice.

### `progression.definition.migration.requested.v1`

```json
{
  "requestId": "uuid",
  "migrationJobId": "uuid",
  "characterId": "uuid",
  "trackKey": "core",
  "fromVersion": 3,
  "toVersion": 4,
  "strategy": "preserve_experience",
  "mappingId": null,
  "expectedAggregateVersion": 91,
  "reasonCode": "track_version_rollout",
  "sourceEventId": "uuid",
  "attributes": {}
}
```

Validation rules:

- Source version MUST match current assignment.
- Target version MUST be Published or later lifecycle state and migration-approved.
- Strategy MUST match the approved migration plan.
- Operation MUST be idempotent per aggregate and job.
- A migration MUST not race with another migration or unbounded write stream.

### `progression.operation.applied.v1`

Summary Event for a committed operation.

```json
{
  "requestId": "uuid",
  "operationId": "uuid",
  "operationType": "experience_grant",
  "characterId": "uuid",
  "trackKey": "core",
  "definitionVersion": 4,
  "aggregateVersion": 92,
  "ledgerEntryId": "uuid",
  "result": {
    "requestedAmount": 250,
    "appliedDelta": 250,
    "unappliedAmount": 0,
    "experienceBefore": 950,
    "experienceAfter": 1200,
    "levelBefore": 4,
    "levelAfter": 5,
    "prestigeRankBefore": 0,
    "prestigeRankAfter": 0
  },
  "sourceEventId": "uuid"
}
```

### `progression.experience.applied.v1`

This Event MUST distinguish requested, applied, and unapplied amounts.

Required fields:

- operation and ledger identifiers;
- Character and Track;
- definition version;
- operation type;
- requested amount;
- signed applied delta;
- unapplied amount;
- Experience and overflow before/after;
- lifetime counters after;
- reason code;
- source references;
- aggregate version.

### `progression.level.changed.v1`

```json
{
  "characterId": "uuid",
  "trackKey": "core",
  "definitionVersion": 4,
  "aggregateVersion": 92,
  "operationId": "uuid",
  "direction": "increase",
  "fromLevel": 4,
  "toLevel": 5,
  "crossedLevels": [5],
  "crossedLevelCount": 1,
  "experienceAfter": 1200,
  "prestigeRank": 0,
  "sourceEventId": "uuid"
}
```

For very large transitions, `crossedLevels` MAY be truncated, but `crossedLevelCount`, first boundary, last boundary, and a transition record reference MUST be present.

### `progression.prestige.completed.v1`

Required fields:

- Character and Track;
- prior and next Prestige Rank;
- Level and Experience before/after;
- overflow before/after;
- mode: `manual` or `automatic`;
- operation and ledger identifiers;
- definition version;
- aggregate version;
- source Event;
- presentation keys for narrative consumers, when configured.

### Rejection Event

`progression.operation.rejected.v1` MUST NOT expose secrets, internal stack traces, or unnecessary Character data.

It includes:

- request and operation identifiers;
- Event type;
- Character and Track identifiers when valid;
- stable rejection code;
- retryability classification;
- producer-visible message key;
- source Event;
- processing timestamp.

It MAY omit or hash sensitive administrative references.

### Compatibility rules

1. Producers MUST ignore unknown optional fields.
2. Consumers MUST use Event type version, not infer schema from field presence.
3. Required field removal or semantic change requires a new Event version.
4. Adding an optional field is backward compatible.
5. Enum expansion is backward compatible only when consumers are contractually required to tolerate unknown values; otherwise use a new version.
6. Event schemas MUST be registered and compatibility-checked in CI.
7. Example payloads in this RFC are illustrative. Machine-readable JSON Schema is authoritative once published under `schemas/events/progression/`.

---

## Read Models

Read Models are projections. They are optimized for product and operational use and are not authoritative mutation sources.

Every Read Model MUST expose a freshness indicator or projection cursor where stale data can affect user decisions.

### Character Progression Summary

Purpose: render a Character's progression overview across visible Tracks.

Key fields:

```json
{
  "character_id": "uuid",
  "tracks": [
    {
      "track_key": "core",
      "definition_version": 4,
      "status": "active",
      "level": 5,
      "minimum_level": 1,
      "maximum_level": 50,
      "experience": 1200,
      "overflow_experience": 0,
      "level_progress": {
        "current_threshold": 1000,
        "next_threshold": 1500,
        "numerator": 200,
        "denominator": 500,
        "ratio": "0.4000"
      },
      "prestige_rank": 0,
      "prestige_available": false,
      "at_cap": false,
      "presentation": {
        "track_name_key": "progression.track.core.name",
        "level_name_key": "progression.track.core.level.5.name",
        "narrative_key": "progression.track.core.level.5.narrative",
        "icon_key": "progression/core/levels/5"
      },
      "aggregate_version": 92,
      "updated_at": "2026-07-18T12:34:56.789Z"
    }
  ],
  "projection": {
    "built_at": "2026-07-18T12:34:56.900Z",
    "cursor": "progression-summary:98459212"
  }
}
```

Rules:

- hidden or administrator-only Tracks MUST be excluded unless the caller is authorized;
- NOT_STARTED visible Tracks MAY be returned as zero-state when product configuration requests it;
- the summary MUST not expose internal reason codes or support notes;
- display ordering comes from presentation configuration, not Track creation time;
- the summary SHOULD return no more than a configured maximum number of Tracks and use pagination when required.

### Character Track Detail

Purpose: render one Track with precise progress, cap, Prestige, and recent transition information.

Additional fields SHOULD include:

- full current Level metadata;
- next Level metadata;
- threshold table subset needed by the client;
- Prestige requirements and current eligibility;
- cap behavior explanation key;
- recent Experience receipts;
- pending projection status, if a command result is newer than the projection;
- migration or freeze banners;
- user-action permissions such as `can_commit_prestige`.

The API MUST calculate permissions server-side. Clients must not infer that a command is allowed only from state fields.

### Progression History

Purpose: provide an explainable chronological list of applied progression operations.

Each history item includes:

- ledger entry id;
- occurred time and processed time;
- operation type;
- signed applied delta;
- requested and unapplied amount where relevant;
- Level and Prestige before/after;
- public reason key;
- source display reference if allowed;
- reversal status;
- aggregate version;
- optional narrative presentation key.

Internal actor identity, approval references, security flags, and raw metadata MUST be omitted from user-facing history.

History MUST use cursor pagination ordered by `(created_at desc, ledger_entry_id desc)` or an equivalent stable order.

### Level Transition History

Purpose: support timelines, celebration replay, Achievement evaluation, support investigation, and analytics.

Fields:

- transition id and type;
- from/to Level;
- from/to Prestige Rank;
- crossed boundary count;
- source operation;
- definition version;
- occurred and processed time;
- whether user celebration was acknowledged, if that state is stored by a separate presentation service.

The Progression Engine MUST NOT own notification-read state. A presentation service may join it externally.

### Definition Catalog

Purpose: provide visible Track metadata and thresholds to clients and administrative tools.

Public definition views MUST expose only:

- active or otherwise visible versions;
- localized presentation keys or resolved text;
- Level thresholds if product policy allows disclosure;
- cap and Prestige explanation metadata;
- activation and retirement visibility windows relevant to the user.

Internal limits, approval metadata, migration notes, and hidden future content MUST not be exposed.

### Administration Aggregate View

Purpose: provide complete support and operational inspection.

It includes:

- authoritative aggregate fields;
- state hash and aggregate version;
- definition assignment and content hash;
- lifecycle flags;
- last source sequence;
- operation counts;
- recent ledger entries;
- reversals and remaining reversible amounts;
- transition history;
- outbox delivery state;
- projection lag;
- reconciliation status;
- active freezes, cases, and migration jobs;
- authorization-filtered actor data.

### Migration Progress View

Includes:

- job id;
- Track and versions;
- strategy and mapping version;
- status;
- total candidate aggregates;
- processed, succeeded, skipped, conflicted, failed, and quarantined counts;
- throughput and estimated completion based on observed rate;
- last checkpoint;
- pause reason;
- sampled impact distribution by Level change;
- approval and operator metadata.

Estimated completion is informational and MUST not affect job correctness.

### Reconciliation View

Includes:

- aggregate identity;
- stored state hash;
- replayed state hash;
- first divergent ledger sequence;
- divergence category;
- severity;
- detected time;
- repair eligibility;
- repair status;
- operator and approval references.

### Projection rebuild

Every projection MUST be rebuildable from authoritative definitions, aggregates, ledger entries, and transitions.

Projection rebuild MUST:

- support bounded ranges or partitions;
- be resumable;
- preserve online read availability when possible;
- write to a new projection generation and switch atomically;
- expose progress and validation metrics;
- not mutate authoritative ledger data.

---

## Write Models

Write Models are internal command and persistence structures. They MUST not be reused as public API representations.

### ExperienceGrantCommand

```text
ExperienceGrantCommand
- operation_id
- request_id
- inbound_event_id
- character_id
- track_key
- requested_definition_version?
- amount
- reward_grant_id
- reward_component_id
- reason_code
- source_event_id
- source_sequence?
- occurred_at
- effective_at?
- calculation_breakdown?
- attributes
- producer_principal
- canonical_request_hash
```

### ExperienceReversalCommand

```text
ExperienceReversalCommand
- operation_id
- request_id
- inbound_event_id
- character_id
- track_key
- original_ledger_entry_id
- amount
- reason_code
- source_event_id
- effective_at?
- attributes
- producer_principal
- canonical_request_hash
```

### ExperienceAdjustmentCommand

```text
ExperienceAdjustmentCommand
- operation_id
- request_id
- character_id
- track_key
- signed_amount
- expected_aggregate_version
- reason_code
- approval_context
- source_event_id
- effective_at?
- attributes
- operator_principal
- canonical_request_hash
```

### PrestigeCommitCommand

```text
PrestigeCommitCommand
- operation_id
- request_id
- character_id
- track_key
- expected_aggregate_version
- source_event_id
- actor_principal
- canonical_request_hash
```

### DefinitionMigrationCommand

```text
DefinitionMigrationCommand
- operation_id
- request_id
- migration_job_id
- character_id
- track_id
- from_version
- to_version
- strategy
- mapping_id?
- expected_aggregate_version
- source_event_id
- canonical_request_hash
```

### ProgressionMutationResult

All mutation handlers return an internal result with:

```text
ProgressionMutationResult
- status: applied | accepted_noop | rejected | retry
- rejection_code?
- retry_classification?
- operation_id
- ledger_entry?
- prior_state?
- next_state?
- transitions[]
- outbox_events[]
- result_hash
```

### Definition Draft Write Model

A Draft MUST separate authoring intent from published runtime content.

Authoring fields MAY include:

- formula expression or curve generator parameters;
- designer notes;
- simulation scenarios;
- source spreadsheet reference;
- localization draft references;
- visual preview settings.

Publication MUST compile authoring data into a canonical runtime definition with explicit thresholds. Formula source MAY be retained for provenance but MUST not be evaluated at runtime.

### Canonical serialization

The Engine MUST define canonical serialization for request hashing, definition hashing, and state hashing.

Canonicalization requirements:

- UTF-8;
- normalized object key order;
- normalized integer representation;
- timestamps in UTC RFC 3339 with defined fractional precision;
- no insignificant whitespace;
- no floating-point values in authoritative content;
- absent optional values represented consistently;
- metadata fields excluded or included according to a documented hash profile.

Hash algorithm SHOULD be SHA-256 or a platform-standard cryptographic hash with collision resistance.

---

## Database Schema

This section defines the normative logical schema and a reference PostgreSQL physical schema. Implementations may use another transactional database only if they preserve all constraints, ordering, idempotency, atomicity, and audit behavior.

### General storage rules

1. All timestamps MUST be stored in UTC using a timezone-aware type.
2. Platform identifiers MUST use canonical UUIDv7 as defined by
   `002a-platform-contract-standard`.
3. Experience values MUST use signed 64-bit integers.
4. JSON fields MUST be bounded and schema-validated before storage.
5. Published definitions and ledger entries are append-only.
6. Foreign keys SHOULD be enforced within the Engine database.
7. Cross-service foreign keys are prohibited; external identities are stored as validated identifiers.
8. Direct manual updates to authoritative tables are prohibited.
9. Every mutable table MUST have optimistic versioning or equivalent concurrency protection.
10. High-volume tables MUST support time- or hash-based partitioning without changing semantic keys.

### Entity relationship overview

```text
progression_track
    1 ──── * progression_track_version
                 1 ──── * progression_level_definition
                 1 ──── * progression_definition_activation

progression_track
    1 ──── * character_progression * ──── 1 Character (external)
                 1 ──── * progression_operation
                 1 ──── * progression_ledger_entry
                 1 ──── * progression_transition

progression_migration_job
    1 ──── * progression_migration_item

progression_outbox_event
progression_inbox_event
progression_reconciliation_issue
```

### `progression_track`

Stable Track identity.

```sql
CREATE TABLE progression_track (
    track_id                 UUID PRIMARY KEY,
    track_key                VARCHAR(128) NOT NULL UNIQUE,
    lifecycle_status         VARCHAR(32) NOT NULL,
    default_active_version   INTEGER NULL,
    created_at               TIMESTAMPTZ NOT NULL,
    created_by               VARCHAR(256) NOT NULL,
    updated_at               TIMESTAMPTZ NOT NULL,
    row_version              BIGINT NOT NULL DEFAULT 0,
    CONSTRAINT ck_progression_track_key
        CHECK (track_key ~ '^[a-z0-9][a-z0-9._-]{0,127}$'),
    CONSTRAINT ck_progression_track_status
        CHECK (lifecycle_status IN ('active', 'retired', 'archived'))
);
```

The Track row is not a published runtime definition. `default_active_version` is an activation pointer and MUST reference a Published version through application-level or deferred constraint logic.

### `progression_track_version`

```sql
CREATE TABLE progression_track_version (
    track_id                    UUID NOT NULL,
    version                     INTEGER NOT NULL,
    definition_status           VARCHAR(32) NOT NULL,
    minimum_level               INTEGER NOT NULL,
    maximum_level               INTEGER NOT NULL,
    cap_policy                  VARCHAR(32) NOT NULL,
    terminal_cap_policy         VARCHAR(32) NULL,
    prestige_mode               VARCHAR(32) NOT NULL,
    prestige_policy             JSONB NOT NULL,
    operation_limits            JSONB NOT NULL,
    activation_metadata         JSONB NOT NULL,
    presentation_metadata       JSONB NOT NULL,
    compatibility_metadata      JSONB NOT NULL,
    canonical_definition        JSONB NOT NULL,
    content_hash                VARCHAR(128) NOT NULL,
    validation_report_hash      VARCHAR(128) NOT NULL,
    published_at                TIMESTAMPTZ NOT NULL,
    published_by                VARCHAR(256) NOT NULL,
    retired_at                  TIMESTAMPTZ NULL,
    archived_at                 TIMESTAMPTZ NULL,
    PRIMARY KEY (track_id, version),
    FOREIGN KEY (track_id) REFERENCES progression_track(track_id),
    UNIQUE (track_id, content_hash),
    CONSTRAINT ck_progression_track_version_positive CHECK (version > 0),
    CONSTRAINT ck_progression_level_range CHECK (
        minimum_level >= 0 AND maximum_level >= minimum_level
    ),
    CONSTRAINT ck_progression_definition_status CHECK (
        definition_status IN ('published', 'scheduled', 'active', 'retired', 'archived')
    ),
    CONSTRAINT ck_progression_cap_policy CHECK (
        cap_policy IN ('clamp', 'bank_overflow', 'auto_prestige')
    ),
    CONSTRAINT ck_progression_prestige_mode CHECK (
        prestige_mode IN ('disabled', 'manual', 'automatic')
    )
);
```

Drafts SHOULD be stored in a separate table so immutability rules cannot be accidentally bypassed.

### `progression_track_draft`

```sql
CREATE TABLE progression_track_draft (
    draft_id                  UUID PRIMARY KEY,
    track_id                  UUID NOT NULL,
    based_on_version          INTEGER NULL,
    draft_status              VARCHAR(32) NOT NULL,
    authoring_document        JSONB NOT NULL,
    compiled_definition       JSONB NULL,
    validation_report         JSONB NULL,
    validation_report_hash    VARCHAR(128) NULL,
    created_at                TIMESTAMPTZ NOT NULL,
    created_by                VARCHAR(256) NOT NULL,
    updated_at                TIMESTAMPTZ NOT NULL,
    updated_by                VARCHAR(256) NOT NULL,
    row_version               BIGINT NOT NULL DEFAULT 0,
    FOREIGN KEY (track_id) REFERENCES progression_track(track_id),
    CONSTRAINT ck_progression_draft_status CHECK (
        draft_status IN ('draft', 'validated', 'discarded')
    )
);
```

### `progression_level_definition`

```sql
CREATE TABLE progression_level_definition (
    track_id                 UUID NOT NULL,
    version                  INTEGER NOT NULL,
    level                    INTEGER NOT NULL,
    minimum_experience       BIGINT NOT NULL,
    display_name_key         VARCHAR(256) NULL,
    narrative_key            VARCHAR(256) NULL,
    icon_key                 VARCHAR(512) NULL,
    presentation_metadata    JSONB NOT NULL DEFAULT '{}'::jsonb,
    PRIMARY KEY (track_id, version, level),
    FOREIGN KEY (track_id, version)
        REFERENCES progression_track_version(track_id, version),
    UNIQUE (track_id, version, minimum_experience),
    CONSTRAINT ck_progression_level_nonnegative CHECK (level >= 0),
    CONSTRAINT ck_progression_threshold_nonnegative CHECK (minimum_experience >= 0)
);

CREATE INDEX ix_progression_level_threshold_lookup
    ON progression_level_definition(track_id, version, minimum_experience DESC);
```

Strictly increasing thresholds and complete sequential Level coverage require publication-time validation or a deferred database procedure.

### `progression_definition_activation`

```sql
CREATE TABLE progression_definition_activation (
    activation_id            UUID PRIMARY KEY,
    track_id                 UUID NOT NULL,
    version                  INTEGER NOT NULL,
    activation_type          VARCHAR(32) NOT NULL,
    starts_at                TIMESTAMPTZ NOT NULL,
    ends_at                  TIMESTAMPTZ NULL,
    status                   VARCHAR(32) NOT NULL,
    requested_by             VARCHAR(256) NOT NULL,
    approved_by              VARCHAR(256) NULL,
    activated_at             TIMESTAMPTZ NULL,
    retired_at               TIMESTAMPTZ NULL,
    request_id               VARCHAR(256) NOT NULL UNIQUE,
    row_version              BIGINT NOT NULL DEFAULT 0,
    FOREIGN KEY (track_id, version)
        REFERENCES progression_track_version(track_id, version),
    CONSTRAINT ck_progression_activation_window CHECK (
        ends_at IS NULL OR ends_at > starts_at
    )
);
```

### `character_progression`

```sql
CREATE TABLE character_progression (
    character_id                  UUID NOT NULL,
    track_id                      UUID NOT NULL,
    definition_version            INTEGER NOT NULL,
    status                        VARCHAR(32) NOT NULL,
    experience                    BIGINT NOT NULL,
    overflow_experience           BIGINT NOT NULL,
    level                         INTEGER NOT NULL,
    prestige_rank                 INTEGER NOT NULL,
    prestige_available            BOOLEAN NOT NULL,
    lifetime_positive_experience  BIGINT NOT NULL,
    lifetime_net_experience       BIGINT NOT NULL,
    last_source_sequence          BIGINT NULL,
    last_ledger_sequence          BIGINT NOT NULL,
    aggregate_version             BIGINT NOT NULL,
    state_hash                    VARCHAR(128) NOT NULL,
    started_at                    TIMESTAMPTZ NOT NULL,
    updated_at                    TIMESTAMPTZ NOT NULL,
    capped_at                     TIMESTAMPTZ NULL,
    frozen_at                     TIMESTAMPTZ NULL,
    frozen_reason_code            VARCHAR(128) NULL,
    closed_at                     TIMESTAMPTZ NULL,
    closed_reason_code            VARCHAR(128) NULL,
    PRIMARY KEY (character_id, track_id),
    FOREIGN KEY (track_id, definition_version)
        REFERENCES progression_track_version(track_id, version),
    CONSTRAINT ck_character_progression_status CHECK (
        status IN ('active', 'frozen', 'closed')
    ),
    CONSTRAINT ck_character_progression_experience CHECK (experience >= 0),
    CONSTRAINT ck_character_progression_overflow CHECK (overflow_experience >= 0),
    CONSTRAINT ck_character_progression_prestige CHECK (prestige_rank >= 0),
    CONSTRAINT ck_character_progression_lifetime_positive CHECK (
        lifetime_positive_experience >= 0
    ),
    CONSTRAINT ck_character_progression_versions CHECK (
        last_ledger_sequence >= 0 AND aggregate_version >= 0
    )
);

CREATE INDEX ix_character_progression_character
    ON character_progression(character_id, updated_at DESC);

CREATE INDEX ix_character_progression_track_level
    ON character_progression(track_id, prestige_rank DESC, level DESC, experience DESC);

CREATE INDEX ix_character_progression_definition
    ON character_progression(track_id, definition_version, status);
```

The Track ranking index is operationally useful but does not make this table a public leaderboard source.

### `progression_operation`

```sql
CREATE TABLE progression_operation (
    operation_id               UUID PRIMARY KEY,
    request_id                 VARCHAR(256) NOT NULL UNIQUE,
    inbound_event_id           UUID NULL UNIQUE,
    fulfillment_id             UUID NULL UNIQUE,
    reversal_id                UUID NULL UNIQUE,
    reward_grant_id            UUID NULL,
    reward_component_id        UUID NULL,
    request_fingerprint        VARCHAR(128) NULL,
    operation_type             VARCHAR(64) NOT NULL,
    character_id               UUID NULL,
    track_id                   UUID NULL,
    status                     VARCHAR(32) NOT NULL,
    canonical_request_hash     VARCHAR(128) NOT NULL,
    result_hash                VARCHAR(128) NULL,
    ledger_entry_id            UUID NULL,
    rejection_code             VARCHAR(128) NULL,
    retry_classification       VARCHAR(64) NULL,
    attempt_count              INTEGER NOT NULL DEFAULT 0,
    first_received_at          TIMESTAMPTZ NOT NULL,
    last_attempt_at            TIMESTAMPTZ NULL,
    completed_at               TIMESTAMPTZ NULL,
    producer_principal         VARCHAR(256) NOT NULL,
    correlation_id             VARCHAR(256) NULL,
    causation_id               VARCHAR(256) NULL,
    trace_id                   VARCHAR(128) NULL,
    sanitized_request          JSONB NOT NULL,
    CONSTRAINT ck_progression_operation_status CHECK (
        status IN (
            'received', 'processing', 'applied', 'accepted_noop',
            'rejected', 'retry_pending', 'quarantined', 'dead_lettered'
        )
    )
);

CREATE INDEX ix_progression_operation_target
    ON progression_operation(character_id, track_id, first_received_at DESC);

CREATE INDEX ix_progression_operation_status
    ON progression_operation(status, last_attempt_at);

CREATE UNIQUE INDEX ux_progression_reward_component
    ON progression_operation(reward_grant_id, reward_component_id)
    WHERE reward_grant_id IS NOT NULL AND reward_component_id IS NOT NULL;
```

Reward fulfillment identities and request fingerprints are dedicated columns;
storing idempotency-critical keys only inside JSON is prohibited.

### `progression_ledger_entry`

```sql
CREATE TABLE progression_ledger_entry (
    ledger_entry_id              UUID PRIMARY KEY,
    character_id                 UUID NOT NULL,
    track_id                     UUID NOT NULL,
    ledger_sequence              BIGINT NOT NULL,
    aggregate_version            BIGINT NOT NULL,
    operation_id                 UUID NOT NULL UNIQUE,
    operation_type               VARCHAR(64) NOT NULL,
    definition_version           INTEGER NOT NULL,
    requested_amount             BIGINT NULL,
    applied_delta                BIGINT NOT NULL,
    unapplied_amount             BIGINT NOT NULL DEFAULT 0,
    experience_before            BIGINT NOT NULL,
    experience_after             BIGINT NOT NULL,
    overflow_before              BIGINT NOT NULL,
    overflow_after               BIGINT NOT NULL,
    level_before                 INTEGER NOT NULL,
    level_after                  INTEGER NOT NULL,
    prestige_rank_before         INTEGER NOT NULL,
    prestige_rank_after          INTEGER NOT NULL,
    lifetime_positive_after      BIGINT NOT NULL,
    lifetime_net_after           BIGINT NOT NULL,
    original_ledger_entry_id     UUID NULL,
    reversible_amount            BIGINT NOT NULL DEFAULT 0,
    reversed_amount              BIGINT NOT NULL DEFAULT 0,
    accepted_noop_reason         VARCHAR(128) NULL,
    reason_code                  VARCHAR(128) NOT NULL,
    source_event_id              UUID NOT NULL,
    source_sequence              BIGINT NULL,
    reward_grant_id              UUID NULL,
    reward_component_id          UUID NULL,
    effective_at                 TIMESTAMPTZ NULL,
    occurred_at                  TIMESTAMPTZ NOT NULL,
    processed_at                 TIMESTAMPTZ NOT NULL,
    actor_type                   VARCHAR(32) NOT NULL,
    actor_id                     VARCHAR(256) NOT NULL,
    authorization_context        JSONB NOT NULL,
    calculation_breakdown        JSONB NULL,
    calculation_breakdown_hash   VARCHAR(128) NULL,
    attributes                   JSONB NOT NULL DEFAULT '{}'::jsonb,
    prior_state_hash             VARCHAR(128) NOT NULL,
    resulting_state_hash         VARCHAR(128) NOT NULL,
    previous_entry_hash          VARCHAR(128) NULL,
    entry_hash                   VARCHAR(128) NOT NULL,
    UNIQUE (character_id, track_id, ledger_sequence),
    UNIQUE (character_id, track_id, aggregate_version),
    FOREIGN KEY (operation_id) REFERENCES progression_operation(operation_id),
    FOREIGN KEY (character_id, track_id)
        REFERENCES character_progression(character_id, track_id),
    FOREIGN KEY (track_id, definition_version)
        REFERENCES progression_track_version(track_id, version),
    FOREIGN KEY (original_ledger_entry_id)
        REFERENCES progression_ledger_entry(ledger_entry_id),
    CONSTRAINT ck_progression_ledger_nonnegative_values CHECK (
        unapplied_amount >= 0
        AND experience_before >= 0
        AND experience_after >= 0
        AND overflow_before >= 0
        AND overflow_after >= 0
        AND prestige_rank_before >= 0
        AND prestige_rank_after >= 0
        AND reversible_amount >= 0
        AND reversed_amount >= 0
        AND reversed_amount <= reversible_amount
    )
);

CREATE INDEX ix_progression_ledger_history
    ON progression_ledger_entry(character_id, track_id, processed_at DESC, ledger_entry_id DESC);

CREATE INDEX ix_progression_ledger_source_event
    ON progression_ledger_entry(source_event_id);

CREATE UNIQUE INDEX ux_progression_reward_component
    ON progression_ledger_entry(reward_grant_id, reward_component_id)
    WHERE reward_grant_id IS NOT NULL AND reward_component_id IS NOT NULL;

CREATE INDEX ix_progression_ledger_original
    ON progression_ledger_entry(original_ledger_entry_id)
    WHERE original_ledger_entry_id IS NOT NULL;
```

Ledger rows MUST NOT be updated except for narrowly scoped reversal accounting fields if the implementation cannot derive them efficiently. The preferred design stores reversal links as new rows and derives totals. If `reversed_amount` is updated, it MUST be changed atomically with the new reversal row and fully audited.

### `progression_transition`

```sql
CREATE TABLE progression_transition (
    transition_id              UUID PRIMARY KEY,
    character_id               UUID NOT NULL,
    track_id                   UUID NOT NULL,
    aggregate_version          BIGINT NOT NULL,
    transition_ordinal         INTEGER NOT NULL,
    transition_type            VARCHAR(64) NOT NULL,
    operation_id               UUID NOT NULL,
    ledger_entry_id            UUID NOT NULL,
    definition_version         INTEGER NOT NULL,
    from_level                 INTEGER NULL,
    to_level                   INTEGER NULL,
    from_prestige_rank         INTEGER NULL,
    to_prestige_rank           INTEGER NULL,
    crossed_levels             JSONB NULL,
    transition_metadata        JSONB NOT NULL DEFAULT '{}'::jsonb,
    occurred_at                TIMESTAMPTZ NOT NULL,
    processed_at               TIMESTAMPTZ NOT NULL,
    UNIQUE (character_id, track_id, aggregate_version, transition_ordinal),
    FOREIGN KEY (operation_id) REFERENCES progression_operation(operation_id),
    FOREIGN KEY (ledger_entry_id) REFERENCES progression_ledger_entry(ledger_entry_id),
    FOREIGN KEY (track_id, definition_version)
        REFERENCES progression_track_version(track_id, version)
);

CREATE INDEX ix_progression_transition_history
    ON progression_transition(character_id, track_id, processed_at DESC);

CREATE INDEX ix_progression_transition_type
    ON progression_transition(transition_type, processed_at DESC);
```

### `progression_inbox_event`

If the Event infrastructure does not provide an equivalent durable inbox, the Engine SHOULD store:

```sql
CREATE TABLE progression_inbox_event (
    event_id                   UUID PRIMARY KEY,
    event_type                 VARCHAR(256) NOT NULL,
    schema_version             INTEGER NOT NULL,
    canonical_event_hash       VARCHAR(128) NOT NULL,
    status                     VARCHAR(32) NOT NULL,
    received_at                TIMESTAMPTZ NOT NULL,
    processed_at               TIMESTAMPTZ NULL,
    operation_id               UUID NULL,
    attempt_count              INTEGER NOT NULL DEFAULT 0,
    last_error_code            VARCHAR(128) NULL,
    sanitized_envelope         JSONB NOT NULL
);
```

### `progression_outbox_event`

```sql
CREATE TABLE progression_outbox_event (
    outbox_id                  UUID PRIMARY KEY,
    event_id                   UUID NOT NULL UNIQUE,
    aggregate_type             VARCHAR(64) NOT NULL,
    aggregate_key              VARCHAR(512) NOT NULL,
    aggregate_version          BIGINT NULL,
    event_type                 VARCHAR(256) NOT NULL,
    schema_version             INTEGER NOT NULL,
    event_document             JSONB NOT NULL,
    event_hash                 VARCHAR(128) NOT NULL,
    partition_key              VARCHAR(256) NOT NULL,
    status                     VARCHAR(32) NOT NULL,
    created_at                 TIMESTAMPTZ NOT NULL,
    available_at               TIMESTAMPTZ NOT NULL,
    published_at               TIMESTAMPTZ NULL,
    attempt_count              INTEGER NOT NULL DEFAULT 0,
    last_error_code            VARCHAR(128) NULL,
    lease_owner                VARCHAR(256) NULL,
    lease_expires_at           TIMESTAMPTZ NULL,
    CONSTRAINT ck_progression_outbox_status CHECK (
        status IN ('pending', 'publishing', 'published', 'failed', 'dead_lettered')
    )
);

CREATE INDEX ix_progression_outbox_publish
    ON progression_outbox_event(status, available_at, created_at);
```

### Migration tables

```sql
CREATE TABLE progression_migration_job (
    migration_job_id           UUID PRIMARY KEY,
    track_id                   UUID NOT NULL,
    from_version               INTEGER NOT NULL,
    to_version                 INTEGER NOT NULL,
    strategy                   VARCHAR(64) NOT NULL,
    mapping_id                 UUID NULL,
    status                     VARCHAR(32) NOT NULL,
    request_id                 VARCHAR(256) NOT NULL UNIQUE,
    plan_hash                  VARCHAR(128) NOT NULL,
    approval_context           JSONB NOT NULL,
    selection_filter           JSONB NOT NULL,
    batch_size                 INTEGER NOT NULL,
    rate_limit_per_second      INTEGER NOT NULL,
    checkpoint                 JSONB NULL,
    created_at                 TIMESTAMPTZ NOT NULL,
    created_by                 VARCHAR(256) NOT NULL,
    started_at                 TIMESTAMPTZ NULL,
    completed_at               TIMESTAMPTZ NULL,
    row_version                BIGINT NOT NULL DEFAULT 0,
    FOREIGN KEY (track_id, from_version)
        REFERENCES progression_track_version(track_id, version),
    FOREIGN KEY (track_id, to_version)
        REFERENCES progression_track_version(track_id, version)
);

CREATE TABLE progression_migration_item (
    migration_job_id           UUID NOT NULL,
    character_id               UUID NOT NULL,
    track_id                   UUID NOT NULL,
    request_id                 VARCHAR(256) NOT NULL UNIQUE,
    status                     VARCHAR(32) NOT NULL,
    source_aggregate_version   BIGINT NOT NULL,
    result_aggregate_version   BIGINT NULL,
    operation_id               UUID NULL,
    attempt_count              INTEGER NOT NULL DEFAULT 0,
    last_error_code            VARCHAR(128) NULL,
    processed_at               TIMESTAMPTZ NULL,
    PRIMARY KEY (migration_job_id, character_id),
    FOREIGN KEY (migration_job_id)
        REFERENCES progression_migration_job(migration_job_id)
);
```

### Reconciliation table

```sql
CREATE TABLE progression_reconciliation_issue (
    issue_id                   UUID PRIMARY KEY,
    character_id               UUID NOT NULL,
    track_id                   UUID NOT NULL,
    detected_aggregate_version BIGINT NOT NULL,
    category                   VARCHAR(64) NOT NULL,
    severity                   VARCHAR(32) NOT NULL,
    stored_state_hash          VARCHAR(128) NULL,
    replayed_state_hash        VARCHAR(128) NULL,
    first_divergent_sequence   BIGINT NULL,
    status                     VARCHAR(32) NOT NULL,
    details                    JSONB NOT NULL,
    detected_at                TIMESTAMPTZ NOT NULL,
    repaired_at                TIMESTAMPTZ NULL,
    repair_operation_id        UUID NULL,
    approval_context           JSONB NULL
);
```

### Character eligibility projection

```sql
CREATE TABLE progression_character_eligibility (
    character_id              UUID PRIMARY KEY,
    lifecycle_status          VARCHAR(32) NOT NULL,
    source_sequence           BIGINT NOT NULL,
    source_event_id           VARCHAR(256) NOT NULL,
    created_at                TIMESTAMPTZ NULL,
    closed_at                 TIMESTAMPTZ NULL,
    updated_at                TIMESTAMPTZ NOT NULL
);
```

### Partitioning

High-volume ledger, operation, transition, inbox, and outbox tables SHOULD be partitioned.

Recommended strategies:

- hash partition by `character_id` for write distribution and aggregate locality;
- time subpartition by `processed_at` for retention and archival;
- outbox partition by `created_at` and status-aware indexes;
- migration items partition by job id for operational cleanup.

Partition design MUST preserve unique idempotency constraints. If the database cannot enforce a global unique constraint across partitions, use a dedicated idempotency table or routing strategy.

### Retention

Suggested baseline:

- authoritative aggregate: lifetime of Character plus legal retention;
- ledger and transitions: lifetime or archival storage sufficient for full explanation and replay;
- operation and inbox payloads: retain sanitized forms according to incident and replay needs;
- outbox published rows: hot retention for operational replay, then compact archival;
- Drafts: configurable cleanup after discard;
- validation reports and published definitions: retain indefinitely while referenced;
- audit records: according to platform security policy, never shorter than ledger explanation needs.

Retention MUST be formalized in a Privacy and Data Retention ADR before production launch.

### Backup and recovery

The database MUST support:

- automated backups;
- point-in-time recovery;
- restoration testing;
- region-level recovery according to platform disaster recovery objectives;
- consistency verification after restore;
- replay or republish of outbox Events without double-applying inbound operations.

A restore procedure MUST define how to reconcile Event transport offsets with restored inbox, operation, and outbox state.

---

## API Specification

Events are the primary mutation interface. HTTP APIs provide reads, controlled commands, and administration.

### API conventions

- Base path: `/v1`.
- JSON encoded as UTF-8.
- Timestamps use RFC 3339 UTC.
- IDs are opaque strings.
- Mutation requests require `Idempotency-Key` unless they are naturally idempotent by resource version.
- Interactive state-changing requests require `If-Match` or `expected_aggregate_version` where stale decisions are unsafe.
- Cursor pagination is required for history and catalogs.
- Errors use a stable machine-readable error code.
- APIs MUST propagate or create correlation and trace identifiers.
- Clients MUST NOT send or infer authoritative Level values in mutation commands.

### Authentication and authorization

Public Character reads require a principal authorized to view that Character.

Player commands require Character control authorization.

Administrative endpoints require scoped service or operator roles. Authorization is evaluated per action, Track, environment, amount, and data sensitivity.

### Error format

```json
{
  "error": {
    "code": "progression.aggregate_version_conflict",
    "message": "The progression state changed before this command was applied.",
    "message_key": "errors.progression.aggregate_version_conflict",
    "retryable": true,
    "correlation_id": "uuid",
    "details": {
      "current_aggregate_version": 93
    }
  }
}
```

User-facing messages MUST be localized by presentation layers. The API returns a safe default message and message key.

### Read APIs

#### `GET /v1/characters/{characterId}/progression`

Returns Character Progression Summary.

Query parameters:

- `include_not_started`: boolean, default false;
- `status`: optional Track status filter;
- `cursor`;
- `limit`, maximum configured by server;
- `locale`, when server-side localization is supported.

Responses:

- `200 OK`;
- `403 Forbidden`;
- `404 Not Found` when Character does not exist or disclosure is prohibited;
- `429 Too Many Requests`;
- `503 Service Unavailable` for projection outage when no safe fallback exists.

The response SHOULD include `ETag` based on projection cursor and Character visibility context.

#### `GET /v1/characters/{characterId}/progression/tracks/{trackKey}`

Returns Character Track Detail.

Optional query:

- `consistency=eventual|authoritative`.

`authoritative` MAY be restricted and rate-limited. It reads the primary aggregate and derives presentation data from the pinned definition.

#### `GET /v1/characters/{characterId}/progression/tracks/{trackKey}/history`

Query parameters:

- `cursor`;
- `limit`;
- `from` and `to` timestamps;
- `operation_type` allow-listed filter;
- `include_reversed`, default true.

The user-facing history view MUST not expose internal administrative metadata.

#### `GET /v1/progression/tracks`

Returns visible Track catalog.

#### `GET /v1/progression/tracks/{trackKey}`

Returns active public definition metadata.

#### `GET /v1/progression/tracks/{trackKey}/levels`

Returns threshold and presentation data when disclosure is enabled. Large Tracks require pagination or range parameters.

### Player command API

#### `POST /v1/characters/{characterId}/progression/tracks/{trackKey}/prestige`

Commits manual Prestige.

Headers:

- `Idempotency-Key`: REQUIRED;
- `If-Match`: aggregate version ETag or body expected version.

Request:

```json
{
  "expected_aggregate_version": 88
}
```

Response `202 Accepted` when command is emitted asynchronously:

```json
{
  "command_id": "uuid",
  "status": "accepted",
  "status_url": "/v1/progression/commands/uuid"
}
```

A deployment MAY process the command synchronously and return `200 OK` with authoritative result, but it MUST still create the canonical Event and preserve idempotency.

Expected errors:

- `progression.prestige_disabled`;
- `progression.prestige_not_available`;
- `progression.aggregate_frozen`;
- `progression.aggregate_closed`;
- `progression.aggregate_version_conflict`;
- `progression.character_not_eligible`.

#### `GET /v1/progression/commands/{commandId}`

Returns command status without exposing internal operation data.

### Internal service API

The Event contract is preferred. An internal synchronous endpoint MAY exist for trusted low-latency orchestration:

#### `POST /internal/v1/progression/experience-grants`

Requirements:

- service-to-service authentication;
- same payload semantics as the grant Event;
- mandatory idempotency key;
- mandatory source Event reference;
- transactional application and outbox publication;
- rate and amount limits;
- no use by Business Modules directly.

The endpoint MUST create the same operation record and outcome Events as Event ingestion. It is an adapter, not a separate mutation path.

### Administrative Track APIs

#### `POST /admin/v1/progression/tracks`

Creates stable Track identity and initial Draft.

#### `POST /admin/v1/progression/tracks/{trackKey}/drafts`

Creates a Draft based on an existing version or blank template.

#### `GET /admin/v1/progression/tracks/{trackKey}/drafts/{draftId}`

Returns Draft and validation status.

#### `PATCH /admin/v1/progression/tracks/{trackKey}/drafts/{draftId}`

Updates Draft using optimistic concurrency.

`If-Match` is REQUIRED.

#### `POST /admin/v1/progression/tracks/{trackKey}/drafts/{draftId}:validate`

Runs structural and semantic validation and stores a report.

Validation request MAY include simulation scenarios.

#### `POST /admin/v1/progression/tracks/{trackKey}/drafts/{draftId}:simulate`

Runs pure calculations without mutation.

Example request:

```json
{
  "scenarios": [
    {
      "name": "new-character-large-grant",
      "initial": {
        "experience": 0,
        "overflow_experience": 0,
        "level": 1,
        "prestige_rank": 0
      },
      "operations": [
        {"type": "experience_grant", "amount": 10000}
      ]
    }
  ]
}
```

Simulation uses compiled explicit thresholds and returns deterministic traces.

#### `POST /admin/v1/progression/tracks/{trackKey}/drafts/{draftId}:publish`

Publishes an immutable version.

Requirements:

- Draft status `validated`;
- validation report still matches content hash;
- publisher authorization;
- approval workflow when required;
- idempotency key;
- optional requested version only when platform version policy permits it.

#### `POST /admin/v1/progression/tracks/{trackKey}/versions/{version}:schedule`

Schedules activation.

#### `POST /admin/v1/progression/tracks/{trackKey}/versions/{version}:activate`

Activates immediately.

#### `POST /admin/v1/progression/tracks/{trackKey}/versions/{version}:retire`

Retires the version for new resolution.

#### `GET /admin/v1/progression/tracks/{trackKey}/versions/{version}:diff`

Compares semantics, thresholds, impact, and compatibility against another version.

### Administrative Character APIs

#### `GET /admin/v1/characters/{characterId}/progression/tracks/{trackKey}`

Returns full Administration Aggregate View.

#### `POST /admin/v1/characters/{characterId}/progression/tracks/{trackKey}/adjustments`

Creates an adjustment operation.

Request:

```json
{
  "amount": -100,
  "expected_aggregate_version": 73,
  "reason_code": "support_correction",
  "ticket_id": "TICKET-1234",
  "note": "Sensitive operator note stored in audit system, not public history."
}
```

The endpoint MUST validate approval requirements before emitting the adjustment request Event.

#### `POST /admin/v1/characters/{characterId}/progression/tracks/{trackKey}/reversals`

Creates a linked reversal. The operator selects a source ledger entry and amount.

#### `POST /admin/v1/characters/{characterId}/progression/tracks/{trackKey}:freeze`

#### `POST /admin/v1/characters/{characterId}/progression/tracks/{trackKey}:unfreeze`

#### `POST /admin/v1/characters/{characterId}/progression/tracks/{trackKey}:close`

#### `POST /admin/v1/characters/{characterId}/progression/tracks/{trackKey}:reopen`

All lifecycle commands require expected aggregate version and reason code.

### Migration APIs

#### `POST /admin/v1/progression/migrations`

Creates a migration Draft and impact analysis.

#### `POST /admin/v1/progression/migrations/{jobId}:validate`

#### `POST /admin/v1/progression/migrations/{jobId}:approve`

#### `POST /admin/v1/progression/migrations/{jobId}:start`

#### `POST /admin/v1/progression/migrations/{jobId}:pause`

#### `POST /admin/v1/progression/migrations/{jobId}:resume`

#### `POST /admin/v1/progression/migrations/{jobId}:cancel`

Cancellation stops unstarted items. It MUST NOT roll back completed migrations automatically.

#### `GET /admin/v1/progression/migrations/{jobId}`

Returns Migration Progress View.

### Operations APIs

#### `GET /admin/v1/progression/operations/{operationId}`

Returns processing attempts, final outcome, sanitized request, and linked records.

#### `POST /admin/v1/progression/operations/{operationId}:retry`

Allowed only for retryable or quarantined operations. It MUST preserve the same request identity.

#### `GET /admin/v1/progression/reconciliation/issues`

#### `POST /admin/v1/progression/reconciliation/issues/{issueId}:repair`

Repair requires a generated plan, dry-run result, authorization, and audit record.

### Bulk APIs

Bulk mutation endpoints MUST NOT accept an unbounded array and process it in one transaction.

Bulk operations use asynchronous jobs with:

- immutable selection criteria snapshot;
- per-item idempotency;
- bounded batches;
- rate limits;
- pause and resume;
- item-level results;
- aggregate conflict handling;
- audit and approval.

### API status codes

| Status | Usage |
|---:|---|
| `200` | Successful synchronous read or mutation result. |
| `201` | Resource created. |
| `202` | Asynchronous command or job accepted. |
| `204` | Successful idempotent action with no response body. |
| `400` | Malformed request. |
| `401` | Missing or invalid authentication. |
| `403` | Authenticated but unauthorized. |
| `404` | Resource absent or intentionally undisclosed. |
| `409` | Idempotency or state conflict. |
| `412` | Failed `If-Match` precondition. |
| `422` | Semantically invalid operation. |
| `429` | Rate limit exceeded. |
| `500` | Unexpected server failure. |
| `503` | Temporary dependency or capacity failure. |

### Stable error catalog

Initial error codes include:

- `progression.event_schema_unsupported`;
- `progression.event_source_unauthorized`;
- `progression.idempotency_conflict`;
- `progression.character_unknown`;
- `progression.character_not_eligible`;
- `progression.track_unknown`;
- `progression.track_not_active`;
- `progression.definition_version_unknown`;
- `progression.definition_version_conflict`;
- `progression.amount_invalid`;
- `progression.amount_limit_exceeded`;
- `progression.numeric_overflow`;
- `progression.aggregate_frozen`;
- `progression.aggregate_closed`;
- `progression.aggregate_version_conflict`;
- `progression.source_sequence_stale`;
- `progression.source_sequence_gap`;
- `progression.original_entry_unknown`;
- `progression.original_entry_not_reversible`;
- `progression.reversal_exceeds_remaining_amount`;
- `progression.adjustment_requires_approval`;
- `progression.prestige_disabled`;
- `progression.prestige_not_available`;
- `progression.prestige_rank_limit_reached`;
- `progression.migration_not_approved`;
- `progression.migration_strategy_incompatible`;
- `progression.reconciliation_required`.

---

## Admin Features

The administrative experience is a product capability, not a thin database editor.

### Track authoring

Administrators with content-design permission MUST be able to:

- create a Track Draft;
- clone a prior version;
- define Level count and presentation metadata;
- enter explicit thresholds;
- generate thresholds from an authoring formula;
- import thresholds from a validated file format;
- configure cap and Prestige behavior;
- configure limits;
- preview user-facing Level cards and progress bars;
- add internal notes;
- submit for validation and approval.

Formula-generated thresholds MUST be materialized and displayed before publication.

### Curve visualization

The authoring interface SHOULD show:

- cumulative Experience by Level;
- Experience required per Level;
- percentage increase between adjacent Levels;
- total Experience to cap;
- simulated time-to-Level for sample earning rates;
- discontinuities and suspicious spikes;
- int64 safety margin;
- comparison with prior version.

Visualization is advisory. Published thresholds are authoritative.

### Validation report

Validation MUST include:

#### Structural checks

- required fields;
- valid identifiers;
- Level sequence completeness;
- unique thresholds;
- threshold monotonicity;
- valid cap and Prestige combinations;
- valid localization key format;
- metadata size limits.

#### Semantic checks

- Level 1 threshold is zero unless an approved alternate minimum Level model exists;
- maximum Level is within platform limit;
- maximum threshold is within int64;
- reset Experience resolves to a valid Level;
- automatic Prestige has compatible cap policy;
- terminal cap behavior exists when maximum Prestige Rank is finite;
- manual Prestige overflow policy is defined;
- operation limits are internally consistent.

#### Compatibility checks

- threshold changes that can lower existing Levels;
- maximum Level reduction;
- Prestige mode changes;
- cap policy changes;
- reset behavior changes;
- presentation-only versus semantic changes;
- migration requirement classification.

#### Simulation checks

- zero-state;
- exact threshold boundaries;
- one unit below and above each sampled boundary;
- maximum grant;
- cap overflow;
- manual Prestige;
- automatic multi-Prestige;
- negative adjustment to zero;
- partial reversal;
- numeric overflow attempts;
- batch equivalence property.

### Definition diff

The diff view MUST distinguish:

- presentation-only changes;
- threshold changes;
- behavior changes;
- security limit changes;
- migration compatibility;
- estimated Character impact.

For existing Characters, impact analysis SHOULD report:

- number and percentage with unchanged Level;
- number moving up;
- number moving down;
- maximum Level delta;
- cap and Prestige eligibility changes;
- overflow impact;
- sampled examples.

### Publication workflow

Production publication SHOULD require separation of duties:

1. author submits validated Draft;
2. reviewer examines diff and simulation;
3. approver confirms migration and communication plan;
4. publisher activates or schedules the immutable version.

The same principal SHOULD NOT author and approve high-impact changes unless an emergency role is used and audited.

### Character support console

Authorized support staff need:

- exact current Position;
- readable history of why Experience changed;
- source Event and Reward references;
- Level and Prestige transition timeline;
- reversal availability;
- pending and failed operations;
- projection freshness;
- freeze and migration status;
- safe correction workflows.

The console MUST clearly separate:

- authoritative state;
- projected display state;
- pending commands;
- analytical estimates.

### Adjustment workflow

The workflow MUST:

- require a reason code;
- require a support ticket or case reference for manual corrections;
- preview before/after state;
- show Level and Prestige impact;
- show cap and overflow impact;
- require additional approval above configured thresholds;
- require expected aggregate version;
- create an immutable operation;
- never execute direct SQL.

### Reversal workflow

The operator selects a source entry. The interface shows:

- original requested and applied amount;
- already reversed amount;
- remaining reversible amount;
- projected state after reversal;
- whether Level decreases;
- whether cap is left;
- whether a separate Prestige correction would be required.

### Freeze workflow

Freeze requires:

- reason code;
- scope: one Track or all Tracks through an orchestrated Character workflow;
- expiration time when temporary;
- case reference;
- policy for inbound grants: reject or quarantine;
- notification policy owned outside this Engine.

Automatic expiration MUST emit an explicit unfreeze operation rather than silently changing state through a query-time rule.

### Operation inspector

Operators can search by:

- request id;
- Event id;
- source Event id;
- reward grant id;
- Character id;
- Track key;
- ledger entry id;
- correlation id;
- time range;
- rejection code;
- status.

Sensitive search capabilities MUST be access-controlled and audited.

### Dead-letter and quarantine management

Operators need:

- grouped failure reason;
- first and latest attempt;
- sanitized payload;
- deployment and schema version;
- dependency status;
- retry eligibility;
- bulk retry with rate limits;
- discard prohibition for valid mutation requests without a documented resolution.

A permanently invalid request may be marked resolved, but its record must remain auditable.

### Reconciliation and repair

The console MUST support:

- replay without mutation;
- divergence explanation;
- generated repair plan;
- dry-run result;
- impact preview;
- approval;
- repair operation execution;
- post-repair verification.

Repair MUST append new records. It MUST NOT rewrite or delete the historical ledger to make the history appear correct.

### Feature flags and emergency controls

Operations staff SHOULD have controlled ability to:

- pause inbound processing by Track;
- pause a producer;
- reduce grant limits;
- disable manual Prestige commands;
- pause migration jobs;
- pause outbox publication for a specific Event type;
- switch read traffic to an earlier projection generation.

Emergency controls MUST be time-bounded where possible and fully audited. They MUST not alter published Track semantics without a versioned change.

---

## UX Requirements

The Progression Engine is backend infrastructure, but its contracts shape user experience. The following requirements protect narrative quality, clarity, and trust.

### Narrative-first presentation

Clients SHOULD present progression as meaningful growth using Level names, narrative keys, milestones, and context.

Raw Experience totals MAY be shown, but they MUST NOT be the only representation of progress where a configured narrative exists.

The Engine provides presentation keys and semantic transition Events; it does not render final copy.

### Progress clarity

A user MUST be able to understand:

- current Level;
- progress toward the next Level;
- what happens at cap;
- whether Prestige exists;
- whether Prestige is available;
- why recent Experience changed;
- whether displayed data is pending or delayed.

### Progress bars

Clients MUST use integer numerator and denominator values returned by the API.

Clients MUST NOT calculate progress from rounded percentages.

At maximum Level, a normal next-Level progress bar SHOULD be replaced with cap or Prestige-specific UI.

### Level-up experience

A Level increase Event SHOULD contain enough information for a presentation service to:

- show the new Level;
- identify all crossed Levels;
- choose a compact or detailed celebration;
- associate the transition with the causative action;
- avoid celebrating the same transition twice.

Deduplication of celebration is a presentation concern but should use `transition_id`.

### Multiple-Level gain

When one operation crosses many Levels:

- the UI SHOULD summarize the journey without forcing one blocking animation per Level;
- important configured milestones MAY receive separate treatment;
- the final state MUST be visible immediately;
- celebration must not delay access to the product.

### Level decrease

A correction or reversal that decreases Level MUST be communicated honestly.

The UI MUST NOT show a celebratory animation. It SHOULD provide a safe reason category and support path where appropriate.

Internal fraud or operator notes MUST not be exposed.

### Eventual consistency

After a successful command, the client MAY temporarily have a result newer than the projection.

The command response SHOULD include the authoritative next state or aggregate version so the client can display an optimistic receipt marked as pending projection.

The UI MUST NOT repeatedly submit the same command because a projection has not updated.

### Accepted no-op

When a grant is clamped at cap, user-facing systems SHOULD receive a meaningful result indicating why no Experience was added.

Products must decide whether to display this fact. The Engine provides a safe presentation reason key such as `progression.noop.at_cap`.

### Manual Prestige

Before confirmation, the UI MUST show:

- current Prestige Rank;
- next Prestige Rank;
- Level and Experience reset behavior;
- overflow behavior;
- irreversible or support-limited consequences;
- benefits, which are supplied by other systems or content configuration;
- a fresh eligibility check.

The command MUST use expected aggregate version so a stale confirmation cannot apply after state changes.

### Freeze and closed state

The user-facing API SHOULD return a safe status and presentation key.

It MUST NOT reveal fraud investigation, internal security classification, or operator identity.

### Accessibility

Progression UI contracts MUST support:

- text alternatives for icons;
- no reliance on color alone;
- reduced motion presentation;
- screen-reader-friendly Level and progress descriptions;
- locale-aware number formatting in clients;
- bidirectional text when localized.

### Localization

The Engine stores localization keys, not authoritative localized prose.

Level and Track presentation metadata MUST support fallback keys. Missing localization must not block calculation or mutation.

### Time display

The Engine returns UTC timestamps. Clients localize them.

Business-effective time and processing time SHOULD be distinguishable in support history when they differ.

### Privacy-aware UX

Public Profile views MUST not expose detailed Experience sources unless explicitly permitted. A Character owner may have access to private history that is not available to other users.

---

## Security

Progression state has economic, reputational, and social value. Unauthorized Experience grants, silent Level manipulation, or definition tampering can damage user trust and platform integrity. Security controls are therefore part of the domain specification rather than an infrastructure afterthought.

### Security objectives

The Engine MUST protect:

- integrity of Experience, Level, Prestige, definitions, and ledger history;
- authenticity of operation producers;
- confidentiality of private progression history and administrative metadata;
- availability of reads and mutation processing;
- non-repudiation of privileged administrative actions;
- isolation between environments and platform security boundaries;
- resistance to replay, duplication, tampering, and abuse.

### Trust boundaries

The following are separate trust zones:

1. public clients;
2. first-party product backends and Business Modules;
3. platform Engines;
4. administrative clients;
5. data infrastructure;
6. analytics and export systems;
7. operators and support personnel.

Crossing a trust boundary requires authenticated identity, authorized action, schema validation, bounded input, and audit context.

### Producer authorization

Each inbound Event type MUST have an allow-list of producer identities.

Examples:

- normal Experience grants: Reward Engine and explicitly approved platform services;
- reversals: Reward Engine, fraud workflow, support correction workflow;
- adjustments: administration service only;
- Prestige commit: player command service and approved internal orchestrators;
- definition activation: content administration or LiveOps service;
- migration: migration orchestrator only.

A producer authorized for one Event type is not automatically authorized for another.

Authorization SHOULD be further constrained by:

- Track allow-list;
- environment;
- maximum amount;
- operation rate;
- reason code allow-list;
- source namespace;
- time-bounded credentials.

### Event authenticity

The Engine MUST authenticate transport producers using platform-standard service identity, such as mutual TLS, workload identity, or signed broker credentials.

For high-risk cross-boundary ingestion, Events SHOULD also carry a verifiable signature or broker-attested producer identity.

The Engine MUST NOT trust `source`, `actor`, or `module` fields merely because they appear in JSON. They must match authenticated transport identity or an approved delegation claim.

### Replay protection

Replay protection uses:

- unique `event_id`;
- unique `request_id`;
- source-specific unique keys;
- canonical request hash;
- optional source sequence.

A duplicate with the same hash returns the original result.

A duplicate identifier with a different hash MUST:

1. be rejected;
2. generate a high-severity security audit event;
3. increment an abuse metric;
4. retain both hashes and safe producer context;
5. avoid exposing prior request content to the caller.

### Input validation

All inputs MUST be validated before mutation.

Validation includes:

- schema and type checks;
- string length and character allow-lists;
- integer bounds;
- JSON depth, key count, and size limits;
- timestamp validity and skew policy;
- identifier format;
- enum allow-lists;
- metadata allow-lists;
- prohibition of executable expressions in runtime definitions;
- rejection of NaN, Infinity, decimal Experience, and numeric strings where integer is required.

Unknown fields must follow explicit compatibility policy. They must never be copied blindly into logs or database fields.

### Amount controls

The Engine MUST enforce:

- per-operation amount maximum;
- per-producer rate limit;
- per-Character velocity limit or alert threshold;
- per-Track aggregate anomaly detection;
- administrative approval thresholds;
- numeric overflow checks before arithmetic;
- maximum automatic Prestige transitions per operation.

Velocity limits SHOULD initially alert rather than reject legitimate high-volume workflows unless product policy is well-defined. Hard rejection rules must be deterministic and documented.

### Authorization model

Recommended roles and scopes:

| Role | Capabilities |
|---|---|
| `progression.viewer` | Read permitted Character progression. |
| `progression.support_reader` | Read internal support view with limited source metadata. |
| `progression.support_adjuster` | Propose bounded corrections and reversals. |
| `progression.adjustment_approver` | Approve high-impact corrections. |
| `progression.content_author` | Create and edit Drafts. |
| `progression.content_reviewer` | Validate and review definitions. |
| `progression.content_publisher` | Publish and schedule approved versions. |
| `progression.migration_operator` | Create and run approved migration jobs. |
| `progression.security_operator` | Freeze Tracks or Characters and inspect abuse signals. |
| `progression.platform_admin` | Emergency operations; use must be rare and audited. |

Permissions MUST support Track- and environment-level scope.

### Separation of duties

The Engine SHOULD enforce separation of duties for:

- high-impact definition publication;
- negative adjustments above threshold;
- Prestige revocation;
- bulk corrections;
- migration that can reduce Level;
- reconciliation repair;
- emergency limit bypass.

An emergency break-glass path MAY bypass normal separation but MUST require strong authentication, explicit reason, time-bounded elevation, and immediate alerting.

### Client authorization and IDOR prevention

Every Character-scoped API MUST verify that the authenticated principal may access the target Character.

Authorization must be performed using canonical Character ownership or delegated access, not by trusting route identifiers or client claims.

For privacy-sensitive endpoints, returning `404` rather than `403` MAY be used to avoid disclosing Character existence.

### Definition security

Published definitions are security-sensitive configuration.

Controls MUST include:

- immutable published content;
- content hash;
- authenticated author, reviewer, approver, and publisher;
- CI schema validation;
- threshold overflow analysis;
- diff and impact report;
- protected production activation;
- prohibition of runtime code execution;
- audit trail for every lifecycle transition;
- environment isolation.

A Draft imported from a spreadsheet or file must be treated as untrusted input.

### Database security

- Application roles MUST use least privilege.
- Runtime mutation service MUST not have DELETE or unrestricted UPDATE permission on ledger and published definition tables.
- Administrative read access SHOULD use audited service APIs rather than direct database credentials.
- Production database access requires approved operational procedure.
- Backups and replicas must use encryption and access controls equivalent to primary data.
- Row-level security MAY be used as defense in depth but does not replace service authorization.

### Encryption

- Data in transit MUST use current platform-standard transport encryption.
- Data at rest MUST be encrypted.
- Secrets and credentials MUST be stored in a secret manager.
- Sensitive audit fields MAY require field-level encryption or tokenization.
- Cryptographic key rotation MUST not make historical records unreadable.

### Logging security

Logs MUST NOT contain:

- full authentication tokens;
- raw personal data;
- unrestricted Event payloads;
- private support notes;
- secret configuration;
- stack traces returned to clients.

Logs SHOULD contain:

- operation id;
- request id;
- Event id;
- Character id in approved pseudonymous form where required;
- Track key;
- aggregate version;
- result or rejection code;
- latency;
- retry count;
- trace id.

Log access is privileged and audited.

### Metadata injection

User- or producer-controlled metadata MUST never be:

- interpreted as code;
- embedded unescaped into SQL, HTML, logs, or metric labels;
- used as an authorization decision without validation;
- promoted to high-cardinality metrics;
- forwarded to other consumers without allow-listing.

### Denial-of-service controls

The Engine MUST protect against:

- oversized payloads;
- extreme JSON nesting;
- grant storms for one Character;
- hot Track partitions;
- malicious retry loops;
- migration overload;
- outbox backlog;
- expensive unbounded history queries;
- excessive detailed Level transition generation;
- repeated failed Prestige commands.

Controls include bounded queues, backpressure, quotas, circuit breakers, pagination, cost limits, and workload isolation.

### Fraud and anomaly signals

The Engine SHOULD emit security telemetry for:

- amount exceeding normal producer baseline;
- unusual grant velocity;
- repeated idempotency conflicts;
- excessive reversals;
- repeated Level oscillation from adjustments;
- unauthorized Track access;
- source sequence anomalies;
- configuration activation outside approved window;
- large bulk correction;
- frequent freeze/unfreeze cycles.

The Engine does not decide fraud outcomes. It provides signals and controlled freeze capabilities.

### Supply-chain and deployment security

Production artifacts MUST be built through approved CI/CD, scanned, signed where platform policy requires, and deployed with immutable version identification.

The running service version, event schema version set, and definition compiler version MUST be observable for incident analysis.

### Security testing

Required testing includes:

- authorization matrix tests;
- replay and idempotency conflict tests;
- malformed payload fuzzing;
- integer boundary tests;
- injection tests;
- object-level authorization tests;
- privilege escalation tests;
- rate-limit tests;
- break-glass workflow tests;
- dependency spoofing tests;
- published definition tamper detection;
- backup access control tests.

---

## Privacy

The Progression Engine stores behavioral history. Even when it does not contain direct identifiers such as names or email addresses, a detailed progression ledger can reveal participation patterns, activity timing, corrections, and product relationships. Privacy requirements apply to both authoritative and projected data.

### Data minimization

The Engine MUST store only data necessary to:

- apply and explain progression;
- enforce idempotency and security;
- audit privileged actions;
- reconcile and repair state;
- satisfy legal and contractual obligations.

Business Event payloads MUST NOT be copied wholesale into progression records.

The Engine SHOULD store opaque source references and canonical reason codes rather than domain-specific descriptions.

### Prohibited data

Progression Events, attributes, and ledger metadata MUST NOT contain unless explicitly approved by a privacy review:

- names;
- email addresses;
- phone numbers;
- postal addresses;
- payment card or bank data;
- health diagnoses;
- free-form educational evaluations;
- private message content;
- government identifiers;
- precise location;
- authentication secrets;
- data about another person.

Free-form administrative notes belong in an approved case-management or audit system and should be referenced by opaque identifier.

### Data classification

Suggested classification:

- Track Definitions: internal or public depending on visibility;
- aggregate state: private Character data;
- user-facing history: private Character data;
- source references: confidential operational data;
- administrative notes and approvals: restricted;
- security anomaly signals: restricted;
- anonymized aggregate analytics: internal.

### Purpose limitation

Progression history collected to operate the platform MUST NOT be repurposed for unrelated profiling, advertising, employment decisions, credit decisions, or sensitive inference without an explicit lawful basis and product approval.

### Character owner access

A Character owner SHOULD be able to access:

- current progression state;
- user-facing Experience history;
- Level and Prestige history;
- safe explanations of corrections;
- Track visibility and status.

Internal fraud indicators, operator identity, security controls, and third-party confidential references are excluded.

### Public visibility

Public Profiles MAY expose configured Level, Prestige, or selected progression milestones.

Detailed Experience amounts, source actions, correction history, and timestamps MUST remain private by default.

Public visibility is controlled by Profile or privacy configuration outside the Progression Engine. The Engine must provide privacy-safe projections and enforce calling-service scope.

### Deletion and closure

Character deletion does not automatically imply immediate physical deletion of every ledger record because the platform may require integrity, anti-fraud, financial reconciliation, or legal retention.

The Character Engine MUST publish deletion or closure intent. The Progression Engine then applies a documented policy:

1. stop normal processing;
2. close aggregates;
3. remove or pseudonymize non-required presentation data;
4. detach direct User linkage if Character identity design permits;
5. retain minimal ledger and audit evidence for the approved period;
6. delete or irreversibly anonymize after retention expires;
7. rebuild projections and caches to remove deleted data;
8. propagate deletion Events to downstream processors.

The exact retention basis requires a platform-level privacy ADR and jurisdiction review.

### Pseudonymization

Where feasible, historical storage SHOULD reference Character identifiers rather than User identity.

Pseudonymization is not anonymization. Access controls and retention still apply.

### Data export

A privacy export SHOULD include:

- Track names or keys;
- current Experience, Level, and Prestige;
- user-facing ledger history;
- Level and Prestige transitions;
- definition versions relevant to interpretation;
- timestamps;
- safe source explanations.

It MUST exclude:

- other users' data;
- internal security signals;
- secrets;
- confidential operator notes;
- unrelated service data.

Export generation must be authenticated, rate-limited, and audited.

### Retention differentiation

Different records may have different retention periods:

- authoritative state: while Character exists and for approved post-closure period;
- ledger explanation: long-lived, potentially archival;
- raw inbound sanitized payload: shorter operational period;
- outbox delivery details: operational period;
- administrative approval records: security policy period;
- aggregate analytics: retain only in anonymized or properly governed form.

### Analytics

Analytics consumers MUST use approved data contracts.

The Progression Engine SHOULD publish minimized analytical Events or views rather than granting broad access to operational tables.

High-cardinality source metadata and private history must not be exported by default.

### Children and vulnerable users

If a product serves minors or vulnerable groups, Track visibility, public Profile exposure, history access, retention, and guardian controls require product-specific privacy design outside the Engine core. The Engine must support restrictive defaults and must not assume adult consent.

### Cross-region processing

If regional data residency applies, Character progression records, backups, and Event routes MUST follow the Character's assigned data region or platform residency policy.

Cross-region migration requires auditable transfer and verification.

### Privacy incident response

The Engine MUST support:

- identifying affected Character and time ranges;
- identifying downstream Event consumers;
- revoking leaked credentials;
- freezing sensitive exports;
- reconstructing accessed records from audit logs;
- targeted projection rebuild or deletion;
- evidence preservation.

---

## Performance

Performance requirements are baseline service objectives. Production capacity targets must be validated through load tests using realistic Track shapes, Character distribution, Event duplication, retries, and hot-key behavior.

### Availability objectives

Recommended initial objectives:

- authoritative mutation ingestion availability: `99.95%` monthly, excluding approved maintenance;
- Character progression read availability: `99.95%` monthly;
- administration and migration control plane: `99.9%` monthly;
- no acknowledged operation may be lost.

An availability failure must not lead to silent state loss. It is preferable to delay processing than to bypass validation or idempotency.

### Latency objectives

Under normal production load and excluding intentional queue delay:

- inbound Event processing, commit latency: p50 <= 50 ms, p95 <= 250 ms, p99 <= 1 s;
- synchronous internal grant endpoint: p95 <= 300 ms, p99 <= 1 s;
- primary Track read: p95 <= 100 ms, p99 <= 300 ms;
- Character summary projection read: p95 <= 150 ms, p99 <= 500 ms;
- administrative aggregate view: p95 <= 1 s for bounded history;
- projection freshness: 99% of committed operations visible in standard read projections within 2 seconds;
- outbox publication: 99% within 2 seconds, 99.9% within 30 seconds.

These objectives are not permission to drop or reorder operations.

### Throughput objectives

The implementation MUST scale horizontally by Character partition.

The initial production benchmark SHOULD demonstrate at least:

- sustained 1,000 Experience operations per second per deployment region;
- burst 5,000 operations per second for 5 minutes;
- duplicate delivery rate of 10% without incorrect effects;
- 100 concurrent operations against one hot Character serialized without state loss;
- migration throughput configurable independently from live traffic.

Actual launch requirements may be lower, but architecture must not require redesign to reach these baselines.

### Partitioning strategy

The primary partition key is `character_id`, optionally combined with stable platform realm if introduced.

Benefits:

- operations for one Character are co-located;
- aggregate ordering is easier;
- load spreads across Characters;
- Track-wide hot spots do not force one write partition.

A partitioning scheme by Track alone is prohibited for the authoritative write path because a popular Track would become a hot partition.

### Concurrency control

The implementation may use:

- broker partition affinity plus database optimistic concurrency;
- row-level lock on `(character_id, track_id)`;
- compare-and-swap aggregate version;
- actor-style per-aggregate serialization.

Database transactions remain the final consistency boundary.

On optimistic conflict, the Engine MUST reload and retry a bounded number of times with jitter. It MUST not reuse a calculation based on stale state.

### Definition caching

Published Track Definitions are immutable and SHOULD be cached by `(track_id, version, content_hash)`.

Cache rules:

- cache entries may be long-lived;
- cache miss loads from authoritative storage;
- content hash must be verified where practical;
- activation pointers have shorter cache lifetime or Event-driven invalidation;
- a stale activation pointer must not move an aggregate away from its pinned version;
- cache failure must degrade to authoritative storage, not default configuration.

### Character eligibility caching

Eligibility projection reads SHOULD be local and indexed.

A missing eligibility record is not equivalent to eligible. It triggers retry, quarantine, or an explicitly approved bootstrap lookup.

### Level lookup performance

Explicit thresholds SHOULD be loaded with the immutable definition and resolved using binary search in memory.

Database lookup per Level boundary is prohibited on the normal mutation path.

### Event amplification

One grant may cross many Levels or Prestige cycles. The Engine MUST bound outbound Event count.

Recommended behavior:

- one operation summary Event;
- one Experience Event;
- one compact Level change Event;
- one Prestige Event containing multiple completed ranks when automatic processing crosses several ranks, or a bounded set with summary;
- complete detail retained in transitions.

### Backpressure

When capacity is exceeded, the Engine MUST:

- allow queue depth to grow within retention and SLO limits;
- apply producer quotas where supported;
- prioritize live mutations over migration and projection rebuild;
- slow or pause bulk work;
- expose backlog metrics;
- avoid unbounded in-memory buffering;
- reject synchronous requests with retryable status rather than timing out unpredictably.

### Workload classes

The implementation SHOULD isolate:

1. live progression mutations;
2. public reads;
3. administration reads;
4. migrations;
5. reconciliation and replay;
6. projection rebuild;
7. analytics export.

Bulk or analytical workloads MUST NOT starve live mutations.

### Database query requirements

- All production list endpoints require indexed cursor pagination.
- Offset pagination on large ledger tables is prohibited.
- Queries must be bounded by Character, Track, time, or status.
- Full table scans require an approved background job and workload isolation.
- N+1 definition or Level queries are prohibited.
- Query plans for critical paths must be captured in performance tests.

### Batch processing

Migration and bulk correction workers MUST support:

- configurable batch size;
- rate limit;
- checkpointing;
- pause and resume;
- per-item idempotency;
- adaptive reduction under live load;
- bounded transaction size;
- independent failed-item handling.

A batch transaction MUST NOT lock many unrelated Character aggregates for a long duration.

### Projection performance

Projection consumers SHOULD process Events independently and checkpoint by partition.

Projection writes must be idempotent by Event id and monotonic by aggregate version.

If a projection receives aggregate version `N+2` before `N+1`, it may:

- buffer within a bounded window;
- fetch authoritative state;
- mark a gap and continue with latest snapshot where the projection semantics permit;
- trigger repair.

It must not silently apply stale version `N+1` after `N+2`.

### Capacity safety limits

Platform limits MUST exist for:

- maximum Levels per Track;
- maximum Track Definition size;
- maximum operation metadata;
- maximum history page size;
- maximum aggregate writes per second;
- maximum transition details;
- maximum migration concurrency;
- maximum outbox retry age.

Initial recommended limits:

- 10,000 Levels per Track;
- 1 MiB canonical definition document;
- 16 KiB operation attributes after validation;
- 100 history items per page;
- 100 automatic Prestige transitions per operation;
- 1,000 detailed crossed Levels stored per operation before compact range representation is required.

These values are configurable platform limits, not user-facing design recommendations.

### Resilience tests

Performance tests MUST include:

- database failover;
- broker redelivery;
- outbox publisher pause;
- cache loss;
- projection lag;
- one hot Character;
- one hot Track;
- duplicate storm;
- invalid payload storm;
- migration during peak load;
- definition activation during traffic;
- regional recovery scenario.

---

## Audit

Auditability is a core product requirement because progression represents long-term user identity and trust.

### Audit principles

1. Every accepted mutation is explainable.
2. Every rejected privileged request is traceable.
3. Published definitions are immutable and attributable.
4. Administrative actions are non-repudiable within the platform's identity guarantees.
5. Audit data is append-only or tamper-evident.
6. Historical explanation uses the exact definition version active for the operation.
7. Repair adds new history; it does not erase inconvenient history.

### Audit record categories

The Engine MUST audit:

- grant, reversal, adjustment, migration, Prestige, freeze, close, and repair operations;
- rejected and idempotency-conflicting operations;
- Track creation and Draft lifecycle;
- validation and simulation runs used for publication;
- publication, scheduling, activation, retirement, and archival;
- migration creation, approval, start, pause, resume, cancel, and completion;
- reconciliation detection and repair;
- role and permission use for high-risk actions;
- break-glass access;
- export and bulk read of sensitive administrative data;
- production configuration changes and emergency controls.

### Required audit fields

Each audit record SHOULD include:

- audit event id;
- action type;
- principal id and type;
- authenticated service identity;
- delegated user identity, when applicable;
- role and authorization decision;
- target Character, Track, definition, operation, or job;
- request id and correlation id;
- source IP or workload identity where appropriate;
- before and after summaries;
- reason code;
- case, ticket, or approval reference;
- result;
- timestamp;
- environment and region;
- application version;
- immutable content or state hash references.

### Ledger as audit evidence

The progression ledger is part of the audit trail but does not replace security audit logs.

Ledger records explain domain state. Security audit logs explain access, authorization, administrative intent, and system actions.

### Tamper evidence

Ledger entries SHOULD form a per-aggregate hash chain:

```text
entry_hash = HASH(
    previous_entry_hash
    + canonical_ledger_content
    + resulting_state_hash
)
```

The first entry uses a documented genesis value.

A reconciliation job SHOULD verify hash continuity. Hash chaining detects unauthorized modification but does not prevent it; database controls and external audit retention remain necessary.

### Definition audit

Publication stores:

- Draft id;
- canonical content hash;
- validation report hash;
- compiler version;
- source import hash if applicable;
- author;
- reviewer;
- approver;
- publisher;
- timestamps;
- semantic diff classification;
- migration plan reference;
- activation request.

### Explain endpoint

Administrative tools SHOULD provide an explain operation that returns a structured trace:

```text
source Event
  → Reward grant reference
  → progression request
  → producer authorization
  → definition resolution
  → prior Position
  → cap / Prestige calculation
  → applied and unapplied amount
  → next Position
  → transitions
  → outgoing Events
  → projection status
```

The trace must be generated from stored facts, not reconstructed from current configuration alone.

### Audit retention

Audit retention must satisfy:

- progression explanation lifetime;
- security investigation needs;
- legal requirements;
- privacy minimization;
- backup and archival policy.

Audit data must not be retained indefinitely without purpose. Retention decisions require platform policy and legal review.

### Audit access

Audit access is restricted. Reads are themselves audited.

Search and export must be rate-limited, scoped, and protected against broad data extraction.

### Clock and ordering

Audit records contain both Event occurrence time and trusted processing time.

Ordering within an aggregate is determined by aggregate version and ledger sequence, not wall-clock timestamps.

### Reconciliation audit

Every reconciliation run records:

- scope;
- code and definition versions;
- start and end time;
- counts checked;
- divergence categories;
- false-positive classification;
- repair references;
- operator or scheduled job identity.

---

## Edge Cases

All edge cases in this section are normative. Implementations MUST produce deterministic outcomes and stable error codes.

### Event delivery and idempotency

#### EC-001. Duplicate Event with identical request

**Situation:** The broker redelivers an Event with the same `event_id`, `request_id`, and canonical payload.

**Required behavior:** Return or republish the original operation outcome as policy allows. Do not create a second ledger entry, increment aggregate version, or repeat a migration.

#### EC-002. Different Event id, same request id and identical payload

**Required behavior:** Treat as a logical duplicate. Link the additional inbound Event to the existing operation for diagnostics if storage permits. Do not apply again.

#### EC-003. Same request id, different payload

**Required behavior:** Reject with `progression.idempotency_conflict`, create a security audit record, and do not mutate state.

#### EC-004. Same Reward component, different request id

**Required behavior:** Secondary uniqueness on `(reward_grant_id, reward_component_id)` prevents double application. If canonical content is equivalent, return the original result. Otherwise reject as conflict.

#### EC-005. Event delivered after operation completed but before outcome Event published

**Required behavior:** The duplicate input returns the committed result. The outbox publisher independently publishes the pending outcome. Input retry MUST not create replacement outbox records with different semantic identity.

#### EC-006. Outbox Event published twice

**Required behavior:** Allowed by transport semantics. Event id remains stable. Consumers deduplicate.

#### EC-007. Unknown Event schema version

**Required behavior:** Quarantine or reject according to deployment compatibility policy. Do not guess field semantics. Emit operational alert when the producer is expected to be compatible.

#### EC-008. Future-dated `occurred_at`

**Required behavior:** Processing order remains current commit order. If skew exceeds configured limit, quarantine or accept with anomaly flag according to Track policy. Never use future time to bypass activation or eligibility checks.

#### EC-009. Very old Event

**Required behavior:** Apply if source, Track, Character, version, and retention policy permit it. Otherwise reject with a stable expiration or unavailable-definition code. Do not resolve against an unrelated current definition when a strict historical version was required.

#### EC-010. Missing source Event id

**Required behavior:** Reject. Every mutation must be causally traceable.

### Character eligibility

#### EC-011. Character unknown locally

**Required behavior:** Retry or quarantine for a bounded dependency window. A trusted bootstrap lookup MAY be used if approved. Do not create an aggregate for an unknown Character.

#### EC-012. Character created Event arrives after grant request

**Required behavior:** The grant remains retryable until eligibility projection catches up. Once eligible, the same request is applied exactly once.

#### EC-013. Character closed

**Required behavior:** Reject normal grants and player Prestige. Administrative reversal or privacy workflow may remain allowed.

#### EC-014. Character suspended

**Required behavior:** Follow the configured Character-to-progression policy: reject, quarantine, or freeze. The policy must be explicit and consistent across Tracks.

#### EC-015. Multiple Characters owned by one User

**Required behavior:** Progression is applied only to the specified Character. User identity must not be substituted for Character identity.

#### EC-016. Character merge request

**Required behavior:** Initial implementation rejects automatic merge. A dedicated migration plan is required because ledger identity, duplicate rewards, Levels, and Prestige cannot be safely combined by default.

### Track and definition resolution

#### EC-017. Unknown Track Key

**Required behavior:** Reject with `progression.track_unknown`. Do not auto-create Tracks from producer input.

#### EC-018. Track exists but no Active default version

**Required behavior:** A new aggregate grant is rejected or quarantined. Existing pinned aggregates may continue on their assigned version if policy allows.

#### EC-019. Requested version differs from aggregate version

**Required behavior:** Reject with `progression.definition_version_conflict` unless the operation is an approved migration.

#### EC-020. Existing aggregate pinned to Retired version

**Required behavior:** Continue processing on the pinned version if Track policy permits. Retirement prevents new assignment; it does not invalidate historical aggregates.

#### EC-021. Definition cache contains stale activation pointer

**Required behavior:** Existing aggregate remains pinned. New aggregate resolution must verify activation pointer version or use Event-driven cache coherence. Never assign a Draft or unpublished version.

#### EC-022. Published definition missing Level row

**Required behavior:** Publication must have prevented this. Runtime detection marks the definition invalid, stops affected mutations, and raises a critical alert. Do not approximate thresholds.

#### EC-023. Content hash mismatch

**Required behavior:** Treat as integrity failure. Stop use of the affected definition, quarantine operations, and alert security and operations.

### Numeric and threshold behavior

#### EC-024. Zero grant

**Required behavior:** Reject normal Experience grant as invalid. A no-op grant should not be used as a heartbeat.

#### EC-025. Negative grant

**Required behavior:** Reject. Negative movement requires reversal or adjustment type.

#### EC-026. Decimal or floating-point amount

**Required behavior:** Reject schema validation. Do not round.

#### EC-027. Amount exceeds per-operation limit

**Required behavior:** Reject before mutation. Producers may split only when splitting does not change semantics and each part has unique idempotency identity.

#### EC-028. Signed 64-bit overflow

**Required behavior:** Reject with `progression.numeric_overflow` before any write. Do not clamp implicitly except where the configured cap policy explicitly clamps progression value below numeric overflow.

#### EC-029. Grant exactly reaches Level threshold

**Required behavior:** Character occupies the new Level. Threshold comparison is inclusive.

#### EC-030. Grant one unit below threshold

**Required behavior:** Level remains unchanged.

#### EC-031. Negative adjustment exactly reaches lower threshold

**Required behavior:** Character occupies the lower threshold's Level. Level derivation uses greatest threshold less than or equal to Experience.

#### EC-032. Negative adjustment would go below zero

**Required behavior:** Reject the entire operation. Partial application is prohibited for adjustments unless an explicit `clamp_to_zero` correction mode is introduced and approved.

#### EC-033. Track with one Level

**Required behavior:** Valid if maximum equals minimum and threshold is zero. Character is immediately at cap. Cap and Prestige policies still apply.

#### EC-034. Very large number of Levels crossed

**Required behavior:** Apply within safety limits, store compact transition representation when needed, and bound outbound Event size. Reject if computation would exceed configured limits.

### Cap behavior

#### EC-035. Grant at cap under `clamp`

**Required behavior:** Accepted no-op with applied delta zero, full amount unapplied, ledger entry created, and no duplicate cap-reached Event if cap was already true.

#### EC-036. Grant crosses cap under `clamp`

**Required behavior:** Apply only the amount required to reach maximum threshold. Record remaining amount as unapplied. Emit Level change and cap reached.

#### EC-037. Grant at cap under `bank_overflow`

**Required behavior:** Add full permitted amount to overflow, subject to overflow maximum. Experience remains at maximum threshold.

#### EC-038. Overflow maximum would be exceeded

**Required behavior:** Follow explicit Track policy: reject entire operation or accept up to maximum and mark remainder unapplied. The policy must be part of the versioned definition. Default is reject entire operation to avoid hidden partial reward loss.

#### EC-039. Reversal while capped under `bank_overflow`

**Required behavior:** Reverse from the exact applied component represented by the source ledger semantics. If the source grant contributed overflow, reduce overflow first according to its recorded allocation. If it contributed cycle Experience, reduce cycle Experience and potentially leave cap. Do not infer allocation from current state alone.

#### EC-040. Cap policy changes between versions

**Required behavior:** Requires migration analysis. Existing aggregate behavior remains on the old version until migration. Activation alone does not reinterpret stored overflow.

### Prestige behavior

#### EC-041. Manual Prestige requested while not eligible

**Required behavior:** Reject with `progression.prestige_not_available`. No ledger entry.

#### EC-042. Two manual Prestige commands race

**Required behavior:** Expected aggregate version or row serialization permits exactly one. The second returns version conflict or not available.

#### EC-043. Manual Prestige at maximum rank

**Required behavior:** Reject with `progression.prestige_rank_limit_reached`.

#### EC-044. Automatic grant crosses multiple Prestige cycles

**Required behavior:** Apply deterministically up to allowed transitions. Result must be equivalent to sequential grant application under the same definition.

#### EC-045. Automatic grant exceeds transition safety limit

**Required behavior:** Reject before mutation or route through approved bounded batch protocol. Do not partially Prestige and then fail.

#### EC-046. Automatic Prestige reaches maximum rank with remaining Experience

**Required behavior:** Apply terminal cap policy exactly. The definition is invalid if no terminal policy exists.

#### EC-047. Reversal of grant that triggered automatic Prestige

**Required behavior:** Routine reversal reduces current Experience according to the source allocation but preserves completed Prestige by default. If exact economic reversal requires rank rollback, route to privileged Prestige correction workflow.

#### EC-048. Correction revokes Prestige

**Required behavior:** Requires explicit `prestige_revoke`, impact simulation, approval, expected version, and narrative/support handling. It cannot be expressed as a large negative Experience adjustment.

#### EC-049. Definition migration changes reset Experience

**Required behavior:** Does not retroactively alter prior Prestige transitions. Future Prestige uses the target definition after migration.

#### EC-050. Banked overflow carried into manual Prestige crosses maximum Level again

**Required behavior:** Under `carry`, apply overflow to the new cycle. It may reach cap and make Prestige available again, but it MUST NOT automatically commit another manual Prestige.

### Reversal and correction

#### EC-051. Partial reversal

**Required behavior:** Apply requested portion, update remaining reversible amount, and retain source linkage.

#### EC-052. Multiple partial reversals race

**Required behavior:** Source reversible amount is checked and updated under the same aggregate transaction. Total reversal cannot exceed original applied amount.

#### EC-053. Reverse an accepted no-op

**Required behavior:** Reject as not reversible because applied amount is zero.

#### EC-054. Reverse a migration entry

**Required behavior:** Reject through normal reversal. Migration rollback requires a new approved migration.

#### EC-055. Reverse an administrative adjustment

**Required behavior:** Allowed only if the adjustment entry is marked reversible and authorization permits it. Otherwise use a new adjustment.

#### EC-056. Source entry belongs to another Track

**Required behavior:** Reject without disclosing unauthorized details.

#### EC-057. Correction causes Level decrease

**Required behavior:** Store and emit Level decrease transition. Public explanation uses safe reason metadata.

#### EC-058. Correction leaves cap

**Required behavior:** Clear cap state, update `capped_at` according to model, emit `progression.cap.left.v1`, and recalculate Prestige availability.

#### EC-059. Adjustment and grant race

**Required behavior:** Serialize by aggregate. Interactive adjustment with stale expected version fails and must be re-previewed.

### Migration

#### EC-060. Aggregate changes after migration preview

**Required behavior:** Migration item expected version fails. Worker reloads, recomputes impact, and retries or marks conflict according to job policy.

#### EC-061. Aggregate already on target version

**Required behavior:** Accepted no-op or skipped item with explicit reason. Do not create duplicate migration transition.

#### EC-062. Aggregate on unexpected third version

**Required behavior:** Mark item conflicted. Do not chain migrations implicitly.

#### EC-063. Migration lowers Level

**Required behavior:** Allowed only if approved plan explicitly permits it. Emit definition migration and Level decrease transitions. User communication is coordinated externally.

#### EC-064. Migration job cancelled

**Required behavior:** Completed items remain migrated. Unstarted items stop. In-progress item transactions complete or roll back atomically.

#### EC-065. Migration process crashes after commit before checkpoint

**Required behavior:** Per-item idempotency identifies completed work on retry. Job checkpoint may lag without duplicate effect.

#### EC-066. Target definition retired during migration

**Required behavior:** Job policy determines whether already approved migration continues. Default: pause and require operator confirmation. Never switch to another version automatically.

### Concurrency and ordering

#### EC-067. Concurrent grants to same aggregate

**Required behavior:** Both apply exactly once in a serializable order. Final Experience equals the deterministic composition of both operations.

#### EC-068. Concurrent grants to different Tracks for same Character

**Required behavior:** They may process independently because aggregate keys differ, unless a future cross-Track invariant is introduced.

#### EC-069. Stale source sequence

**Required behavior:** Reject as stale when strict sequence mode is enabled.

#### EC-070. Source sequence gap

**Required behavior:** Buffer, retry, or quarantine according to sequence policy. Do not skip silently.

#### EC-071. Out-of-order Event without strict sequence

**Required behavior:** Apply in committed processing order. Preserve `occurred_at` for history.

#### EC-072. Database deadlock

**Required behavior:** Roll back and retry with jitter. Idempotency record must not be left falsely completed.

### Lifecycle and operations

#### EC-073. Grant arrives during freeze

**Required behavior:** Reject or quarantine according to freeze policy. The outcome must be explicit and observable.

#### EC-074. Freeze expires while grants are queued

**Required behavior:** An explicit unfreeze operation changes state. Quarantined grants are retried using original request identity and current definition policy unless the freeze workflow pinned alternative behavior.

#### EC-075. Close and grant race

**Required behavior:** Serialized order determines result. If close commits first, grant rejects. If grant commits first, it remains valid and close follows.

#### EC-076. Projection shows stale Level after successful grant

**Required behavior:** Command result or operation status exposes newer aggregate version. Projection worker catches up. No duplicate grant is submitted.

#### EC-077. Reconciliation finds aggregate-state mismatch

**Required behavior:** Freeze affected aggregate for risky mutations when severity requires, open issue, generate replay evidence, and repair only through approved operation.

#### EC-078. Reconciliation finds projection-only mismatch

**Required behavior:** Rebuild or correct projection without modifying authoritative aggregate or ledger.

#### EC-079. Database restore causes broker redelivery

**Required behavior:** Restored inbox and operation idempotency prevent reapplication. Missing outbox publications are republished. Recovery run reconciles offsets and state.

#### EC-080. Published Event lost after commit

**Required behavior:** Transactional outbox retains it. Publisher retries until success or dead-letter escalation. Aggregate mutation is not rolled back because transport is temporarily unavailable.

#### EC-081. Audit sink unavailable

**Required behavior:** Domain transaction may continue only if local durable audit evidence is committed. Privileged actions MAY fail closed if platform policy requires synchronous audit durability.

#### EC-082. Localization key missing

**Required behavior:** Mutation succeeds. Client uses fallback key or generic presentation. Missing localization generates content quality alert.

#### EC-083. Public Track hidden after user progressed

**Required behavior:** Authoritative state remains. Public catalog and summary hide it according to visibility policy. Authorized history and administration remain available.

#### EC-084. Season ends while Event is delayed

**Required behavior:** The source policy owner determines whether the reward request is valid and which Track/version it targets. The Progression Engine follows the typed request and pinned aggregate rules; it does not reinterpret business eligibility from current Season time.

#### EC-085. Producer sends PII in attributes

**Required behavior:** Reject or strip only according to an explicit allow-list policy. Security and privacy telemetry records the violation without copying the prohibited value.

#### EC-086. Request metadata exceeds limit

**Required behavior:** Reject before persistence.

#### EC-087. Track archived while ledger still references it

**Required behavior:** Archive only affects normal listing. Definitions remain resolvable for history and replay.

#### EC-088. Aggregate row absent but ledger exists

**Required behavior:** Critical consistency issue. Stop mutation, quarantine request, and run reconciliation. Do not create a zero aggregate over existing ledger history.

#### EC-089. Aggregate exists with no ledger due to historical import

**Required behavior:** Allowed only when marked as migration seed with a synthetic genesis ledger entry. Normal runtime must not produce this state.

#### EC-090. State hash mismatch on load

**Required behavior:** Treat as corruption or tampering. Prevent mutation, create reconciliation issue, and alert.

---

## Acceptance Tests

The following tests are minimum release criteria. They may be implemented as unit, property, contract, integration, security, migration, and performance tests. A production release is not accepted while any MUST test fails.

### Definition validation tests

#### AT-DEF-001. Valid explicit thresholds publish

**Given** a Draft with Levels 1 through 5 and thresholds `0, 100, 300, 600, 1000`  
**When** validation and publication complete  
**Then** an immutable version is created with the same thresholds and content hash.

#### AT-DEF-002. Non-monotonic threshold rejected

**Given** thresholds `0, 100, 90`  
**When** validation runs  
**Then** publication is blocked with a precise validation error.

#### AT-DEF-003. Missing Level rejected

**Given** Level rows `1, 2, 4`  
**Then** validation rejects incomplete sequence.

#### AT-DEF-004. First threshold must be zero

**Given** minimum Level 1 and threshold 10  
**Then** validation rejects the Draft.

#### AT-DEF-005. Duplicate threshold rejected

**Given** adjacent Levels with equal cumulative Experience  
**Then** validation rejects the Draft.

#### AT-DEF-006. Runtime formula prohibited

**Given** a Draft with a curve formula  
**When** publication occurs  
**Then** thresholds are materialized and runtime canonical definition contains explicit values; calculation does not evaluate formula source.

#### AT-DEF-007. Incompatible auto Prestige rejected

**Given** `prestige_mode=automatic` and `cap_policy=clamp`  
**Then** validation rejects the combination.

#### AT-DEF-008. Finite Prestige requires terminal cap policy

**Given** automatic Prestige with `maximum_rank=10` and no terminal policy  
**Then** validation fails.

#### AT-DEF-009. Published version immutable

**Given** version 3 is Published  
**When** an update is attempted  
**Then** the update fails and a new Draft is required.

#### AT-DEF-010. Content hash stable

**Given** semantically identical canonical content serialized on two nodes  
**Then** both produce the same content hash.

#### AT-DEF-011. Presentation-only change classified

**Given** only localization and icon keys change  
**Then** compatibility analysis classifies the change as presentation-only.

#### AT-DEF-012. Threshold reduction impact reported

**Given** existing Character state and a target version with changed thresholds  
**Then** impact analysis reports Level increases, decreases, and unchanged counts correctly.

### Basic grant tests

#### AT-GRANT-001. First grant creates aggregate

**Given** an eligible Character and Active Track  
**When** a positive grant is applied  
**Then** the aggregate, operation, ledger entry, Track started Event, and Experience applied Event are committed atomically.

#### AT-GRANT-002. Grant below next threshold

**Given** Level 1 at 0 Experience and next threshold 100  
**When** 50 Experience is granted  
**Then** Experience is 50 and Level remains 1.

#### AT-GRANT-003. Grant exactly reaches threshold

**When** total Experience becomes exactly 100  
**Then** Level becomes 2 and Level changed Event is emitted.

#### AT-GRANT-004. Grant crosses multiple Levels

**Given** thresholds `0, 100, 300, 600`  
**When** 650 Experience is applied from zero under a compatible cap policy  
**Then** final Level is maximum, all crossed Levels are recorded, and one compact Level Event is published.

#### AT-GRANT-005. Lifetime counters

**Given** grants of 100 and 50 followed by a reversal of 30  
**Then** lifetime positive Experience is 150 and lifetime net Experience is 120.

#### AT-GRANT-006. Zero rejected

**When** amount is zero  
**Then** operation is rejected and no ledger entry exists.

#### AT-GRANT-007. Negative rejected

**When** grant amount is negative  
**Then** schema or semantic validation rejects it.

#### AT-GRANT-008. Decimal rejected

**When** amount is `1.5`  
**Then** validation rejects it without rounding.

#### AT-GRANT-009. Unknown Character retried

**Given** Character eligibility has not arrived  
**Then** operation enters retry or quarantine state and does not create an aggregate.

#### AT-GRANT-010. Closed Character rejected

**Given** Character is closed  
**Then** grant is rejected with no progression ledger mutation.

#### AT-GRANT-011. Pinned definition used

**Given** aggregate is pinned to version 2 and version 3 is Active for new aggregates  
**When** a grant applies  
**Then** version 2 determines the result.

#### AT-GRANT-012. Calculation is pure

**Given** identical prior state, command, and definition  
**When** calculator runs repeatedly on different nodes  
**Then** state, transitions, and result hash are identical.

### Idempotency tests

#### AT-IDEM-001. Same Event duplicate

**When** the same Event is delivered ten times  
**Then** exactly one ledger entry exists and aggregate version increments once.

#### AT-IDEM-002. Same request, new Event id

**Then** exactly one effect exists and original result is returned.

#### AT-IDEM-003. Same request, changed amount

**Then** second request is rejected as idempotency conflict and security audit is written.

#### AT-IDEM-004. Same Reward component, new request

**Then** secondary uniqueness prevents a second effect.

#### AT-IDEM-005. Retry after transaction rollback

**Given** a failure before commit  
**When** the same request retries  
**Then** it can apply once and no partial rows from the first attempt exist.

#### AT-IDEM-006. Retry after commit before acknowledgement

**Then** the retry resolves to the committed operation without a second mutation.

### Cap tests

#### AT-CAP-001. Clamp crossing cap

**Given** maximum threshold 1000 and current Experience 900  
**When** 250 is granted  
**Then** 100 is applied, 150 is unapplied, final Experience is 1000, and cap reached emits once.

#### AT-CAP-002. Clamp at cap

**Given** current Experience 1000  
**When** 50 is granted  
**Then** accepted no-op ledger entry records applied 0 and unapplied 50.

#### AT-CAP-003. Bank overflow crossing cap

**Given** current Experience 900  
**When** 250 is granted  
**Then** Experience is 1000 and overflow is 150.

#### AT-CAP-004. Overflow limit enforced

**Given** banked overflow near configured maximum  
**When** grant exceeds remaining capacity  
**Then** behavior matches versioned reject-or-partial policy exactly.

#### AT-CAP-005. Reversal leaves cap

**Given** capped state caused by a reversible grant  
**When** sufficient amount is reversed  
**Then** Level decreases or cap clears as derived and cap-left Event is emitted.

#### AT-CAP-006. No duplicate cap Event

**Given** Character already capped  
**When** accepted no-op grants occur  
**Then** no additional cap-reached transition is created.

### Prestige tests

#### AT-PRE-001. Manual eligibility

**Given** manual Prestige, maximum Level, required overflow, and available rank  
**Then** `prestige_available` is true and availability Event emits on transition.

#### AT-PRE-002. Manual Prestige commit

**When** eligible Character commits with current aggregate version  
**Then** rank increments, reset and overflow policy apply, ledger and Prestige transition commit atomically.

#### AT-PRE-003. Manual Prestige stale version

**When** expected version is stale  
**Then** command fails without state change.

#### AT-PRE-004. Manual Prestige duplicate

**When** same request retries  
**Then** only one rank increment occurs.

#### AT-PRE-005. Manual Prestige not eligible

**Then** command rejects with `progression.prestige_not_available`.

#### AT-PRE-006. Automatic one cycle

**Given** automatic Prestige and sufficient grant to cross one cycle  
**Then** rank increments exactly once and remaining Experience is correct.

#### AT-PRE-007. Automatic multiple cycles

**Given** a grant sufficient for three cycles  
**Then** rank increments by three and final Position matches sequential application.

#### AT-PRE-008. Batch equivalence property

**For all** generated valid grant partitions whose sum is `X`  
**Then** one grant of `X` and ordered grants summing to `X` produce equal final Position under automatic Prestige, absent per-operation semantic differences.

#### AT-PRE-009. Rank limit terminal clamp

**Given** maximum rank reached and terminal policy clamp  
**Then** remaining Experience is unapplied at cap.

#### AT-PRE-010. Rank limit terminal bank

**Given** maximum rank reached and terminal policy bank overflow  
**Then** remaining Experience is banked within limit.

#### AT-PRE-011. Transition safety limit

**When** one grant would cause more automatic Prestige transitions than allowed  
**Then** entire operation rejects before mutation.

#### AT-PRE-012. Routine reversal preserves Prestige

**Given** grant caused Prestige  
**When** grant is reversed through normal reversal  
**Then** Prestige Rank remains and Experience correction follows recorded policy.

#### AT-PRE-013. Prestige revoke requires privilege

**When** unprivileged producer requests revoke  
**Then** authorization rejects and audit records the attempt.

### Reversal and adjustment tests

#### AT-REV-001. Full reversal

**Given** reversible grant of 100  
**When** 100 is reversed  
**Then** applied delta is -100 and remaining reversible amount is zero.

#### AT-REV-002. Partial reversal

**When** 40 of 100 is reversed  
**Then** remaining reversible amount is 60.

#### AT-REV-003. Excessive reversal rejected

**When** 61 is requested after 40 already reversed  
**Then** operation rejects without mutation.

#### AT-REV-004. Concurrent reversals

**When** two reversals race for remaining 60  
**Then** total committed reversal never exceeds 60.

#### AT-REV-005. Cross-Track source rejected

**Then** no source details beyond safe error are exposed.

#### AT-ADJ-001. Positive adjustment

**Then** cap policy applies and approval rules are enforced.

#### AT-ADJ-002. Negative adjustment Level decrease

**Then** Experience and Level decrease, transition is stored, and Prestige Rank remains unchanged.

#### AT-ADJ-003. Below-zero adjustment rejected

**Then** no partial clamp occurs.

#### AT-ADJ-004. Stale admin preview rejected

**Given** expected version changed after preview  
**Then** adjustment fails and must be re-previewed.

#### AT-ADJ-005. High-impact approval required

**When** amount or Level effect crosses threshold  
**Then** one-person submission is insufficient and operation cannot be emitted.

### Concurrency tests

#### AT-CON-001. One hundred concurrent grants

**Given** one Character Track and 100 unique grants of 10  
**When** all process concurrently  
**Then** final net Experience increases by 1000, 100 ledger entries exist, and aggregate version has no gaps.

#### AT-CON-002. Deadlock retry

**Given** injected database deadlock  
**Then** operation retries and applies once.

#### AT-CON-003. Different Tracks parallel

**Then** operations do not require one Character-wide lock unless configured by future invariant.

#### AT-CON-004. Sequence stale

**Given** strict source sequence current value 10  
**When** sequence 9 arrives  
**Then** it rejects as stale.

#### AT-CON-005. Sequence gap

**When** sequence 12 arrives before 11  
**Then** configured gap policy is followed and 12 is not silently committed.

### Migration tests

#### AT-MIG-001. Preserve Experience

**Given** version 1 Experience 500  
**When** migrated to version 2 with preserve Experience  
**Then** Experience remains 500 and Level derives from version 2.

#### AT-MIG-002. Explicit mapping

**Given** approved mapping row for a source Position  
**Then** target Position exactly matches mapping and mapping hash is stored.

#### AT-MIG-003. Unexpected source version

**Then** item is conflicted and not mutated.

#### AT-MIG-004. Item retry after commit

**Then** no second migration entry is created.

#### AT-MIG-005. Pause and resume

**Then** completed items remain committed, no new items start while paused, and resume continues from checkpoint.

#### AT-MIG-006. Cancel

**Then** unstarted items stop and completed items remain.

#### AT-MIG-007. Level decrease communication metadata

**Given** approved migration lowers Level  
**Then** transition and outward Event include safe migration reason and impact metadata.

#### AT-MIG-008. Live grant conflict

**Given** grant changes aggregate during migration attempt  
**Then** expected version conflict prevents stale migration and worker recomputes.

### Event contract tests

#### AT-EVT-001. Schema compatibility

Every registered producer and consumer contract passes compatibility checks in CI.

#### AT-EVT-002. Required envelope validation

Missing Event id, source, subject, correlation, or payload required fields rejects before mutation.

#### AT-EVT-003. Producer allow-list

Unauthorized service cannot emit grants even with a syntactically valid payload.

#### AT-EVT-004. Outcome after commit

Fault injection proves no externally visible outcome Event exists for a rolled-back mutation.

#### AT-EVT-005. Stable aggregate version

All outcome Events from one operation carry the committed aggregate version.

#### AT-EVT-006. Compact large transition

Large Level crossing Event stays below payload limit while complete detail remains queryable.

#### AT-EVT-007. No PII propagation

PII-like test fields in attributes are rejected or removed according to allow-list and never appear in outcome Events.

### API tests

#### AT-API-001. Character authorization

A principal cannot read another Character without delegated permission.

#### AT-API-002. Cursor stability

History pagination returns every item exactly once under stable snapshot semantics or documents insert behavior without duplicates.

#### AT-API-003. ETag conflict

Stale `If-Match` prevents mutation.

#### AT-API-004. Idempotency-Key required

Administrative mutation without key is rejected.

#### AT-API-005. Error safety

Responses contain stable code and correlation id but no stack trace, SQL, token, or private note.

#### AT-API-006. Authoritative read

Authorized authoritative Track read matches database aggregate and pinned definition.

#### AT-API-007. Projection freshness metadata

Summary response includes projection cursor or build time.

#### AT-API-008. Public definition filtering

Hidden and future Tracks are absent for unauthorized callers.

### Security tests

#### AT-SEC-001. Role matrix

Every administrative endpoint is tested against every defined role for allow and deny behavior.

#### AT-SEC-002. Track-scoped authorization

A content publisher for Track A cannot publish Track B.

#### AT-SEC-003. Environment isolation

Non-production identity cannot mutate production.

#### AT-SEC-004. Oversized JSON

Payload above limit rejects before expensive parsing or database access where infrastructure permits.

#### AT-SEC-005. Integer boundary fuzzing

Values around int64 minimum and maximum never wrap.

#### AT-SEC-006. Metadata injection

Control characters, SQL fragments, HTML, and metric label abuse remain inert and safely handled.

#### AT-SEC-007. Break-glass audit

Emergency action produces immediate security alert and complete audit context.

#### AT-SEC-008. Definition tamper

Modified canonical definition with old hash is detected and cannot process mutations.

#### AT-SEC-009. Audit read audited

Restricted audit export records who accessed what scope and when.

#### AT-SEC-010. Duplicate conflict alert

Changed payload under reused request id triggers security telemetry.

### Privacy tests

#### AT-PRI-001. User history excludes internal notes

#### AT-PRI-002. Public Profile excludes source history by default

#### AT-PRI-003. Privacy export contains only authorized Character data

#### AT-PRI-004. Deletion workflow removes projections and caches

#### AT-PRI-005. Retained ledger is pseudonymized according to policy

#### AT-PRI-006. Downstream deletion Event is emitted

#### AT-PRI-007. Logs contain no prohibited payload fields

### Audit and reconciliation tests

#### AT-AUD-001. Ledger replay equals aggregate

For sampled and full test aggregates, replay produces stored state hash.

#### AT-AUD-002. Hash-chain verification

Tampering with any ledger row causes reconciliation failure.

#### AT-AUD-003. Definition-version explanation

Historical entry explanation uses its stored version, not current Active version.

#### AT-AUD-004. Repair is append-only

Approved repair creates new operation and ledger entry; original history remains.

#### AT-AUD-005. Projection divergence repair

Projection rebuild fixes read state without modifying authoritative ledger.

#### AT-AUD-006. Missing aggregate detection

Ledger-without-aggregate state is detected as critical.

### Performance and resilience tests

#### AT-PERF-001. Sustained throughput

Reference workload sustains target operations per second while meeting p95 commit latency.

#### AT-PERF-002. Burst throughput

Five-minute burst does not lose or duplicate operations and backlog recovers within defined objective.

#### AT-PERF-003. Hot Character

One hundred concurrent requests serialize correctly without unbounded latency or deadlock storm.

#### AT-PERF-004. Duplicate storm

Ten percent duplicate delivery does not materially degrade correctness or exceed capacity plan.

#### AT-PERF-005. Projection objective

99% of committed operations appear in summary projection within two seconds under normal load.

#### AT-PERF-006. Outbox pause and recovery

Pausing publication grows bounded backlog; resume publishes all Events without changing domain state.

#### AT-PERF-007. Database failover

In-flight transactions either commit once or roll back; retries apply once.

#### AT-PERF-008. Cache loss

Definition cache loss increases latency within tolerated range but does not change results.

#### AT-PERF-009. Migration isolation

Running migration at configured rate does not violate live mutation SLOs.

#### AT-PERF-010. Restore and redelivery

Disaster recovery exercise restores data, reconciles offsets, republishes missing outbox Events, and prevents duplicate progression effects.

### Release acceptance

The Engine is release-ready only when:

- all normative schemas are published;
- all MUST acceptance tests pass;
- security and privacy reviews are approved;
- disaster recovery exercise succeeds;
- production limits and alerts are configured;
- at least one real module integrates only through approved Event contracts;
- no Business Module writes progression tables or calls private persistence interfaces;
- operational runbooks exist;
- migration and rollback procedures are exercised;
- dashboards expose SLOs, backlog, failures, and integrity status.

---

## Future Extensions

Future capabilities may be added without invalidating the core ownership and determinism principles.

### Multiple Experience categories within a Track

A future version may support category-specific Experience contributing to one Track. This requires explicit allocation, threshold, and reversal semantics. It must not become an arbitrary currency system.

### Cross-Track prerequisites

A Track may require state in another Track. This introduces cross-aggregate consistency and should be implemented through asynchronous eligibility projections, not distributed transactions.

### Branching progression paths

A Character could choose among branches or specializations. Branch choice would require a new aggregate concept and migration semantics. Level thresholds alone are insufficient.

### Dynamic Level names and narrative arcs

Presentation metadata may become context-aware while calculation remains unchanged. Narrative systems should consume transitions rather than modify Experience directly.

### Guild, team, or community progression

Shared progression requires a separate aggregate owner. Reusing Character Progression tables for groups is prohibited without a domain RFC.

### Account-wide progression

User-owned progression distinct from Character progression may be introduced. It must not overload Character identity and requires a separate canonical entity.

### Experience decay

Decay is intentionally excluded from initial scope because it can violate permanent-growth expectations. If introduced, it requires explicit user communication, scheduled operation semantics, replay behavior, and privacy review.

### Soft resets

Seasonal or campaign resets may be modeled as new Tracks or explicit migration/reset operations. Silent timestamp-based reset is prohibited.

### Adaptive progression curves

Personalized thresholds would undermine shared determinism and comparability unless every Character receives an immutable assigned definition. Any adaptive design must preserve explainability and prohibit opaque manipulation.

### Modifier protocol

A shared deterministic modifier contract could allow Talent, Season, membership, or event modifiers to contribute to final Experience calculation. The preferred boundary remains that Reward Engine produces a finalized integer amount plus signed breakdown.

### Offline and edge ingestion

Offline products may submit delayed signed activity Events. Reward eligibility and anti-fraud remain upstream. Progression applies typed grants with source sequence and delay policy.

### Federated platform instances

Cross-instance Character progression would require globally unique identities, conflict-free operation ownership, regional routing, and legal residency rules. Ledger merging is not safe without a federation RFC.

### Cryptographic receipts

Users or partners may receive signed progression receipts proving an operation was applied without exposing private history. This could use ledger hashes and verifiable credentials.

### Public milestone proofs

Selected Level or Prestige milestones could be exposed as privacy-preserving attestations owned by Profile or credential services.

### Advanced ranking feeds

The Engine may publish rank-safe progression snapshots to a Leaderboard Engine. Ranking windows, tie-breaking, anti-cheat, opt-out, and privacy remain outside this Engine.

### Predictive UX

Read Models may provide estimates such as time to next Level based on user-approved or aggregate historical rates. Estimates are non-authoritative and must not influence progression calculation.

### Alternative storage implementation

A high-scale implementation may adopt event sourcing or distributed state stores. It must preserve the logical ledger, atomic outcome publication, versioned definitions, replay, idempotency, and audit semantics in this RFC.

### Definition modules

Reusable threshold templates and Prestige policy templates may improve authoring. Publication must still materialize a self-contained immutable definition.

### Milestone hooks

Tracks may define named milestone boundaries beyond Levels. The Engine may publish milestone transitions if they are deterministic functions of Track state. Achievement ownership remains separate.

---

## ADR References

### Existing ADRs

#### ADR-001 — Platform First

The Progression Engine is domain-agnostic. Business Modules publish Events and do not own Character progression state.

#### ADR-002 — Engine Driven

The Engine reacts to typed Events and publishes outcome Events. It does not rely on direct Engine invocation.

#### ADR-003 — Character Ownership

Character belongs to the platform. Progression Track state references Character but is not owned by a Business Module.

### Normative architecture decisions

The following decisions are ratified by this RFC and the shared platform
contract RFCs. Standalone ADR files MAY mirror them for repository traceability
but may not redefine the contracts independently.

#### ADR-004 — Single Writer per State Domain

Decision: only the Progression Engine writes Experience, Level, Prestige, and Progression Track aggregate state. Reward Engine dispatches typed rewards but does not apply progression directly.

#### ADR-005 — Typed Reward Application Protocol

Decision: XP Rewards are delivered through
`reward.fulfillment.requested.v1` with `componentType=EXPERIENCE`, finalized
integer amount, source references, `fulfillmentId`, and request fingerprint.
`progression.experience.grant.requested.v1` remains only for explicitly
registered non-Reward platform operations and bounded migration compatibility.

#### ADR-006 — Immutable Versioned Progression Definitions

Decision: published definitions are immutable; runtime uses explicit materialized thresholds.

#### ADR-007 — Exactly-Once Effect over At-Least-Once Delivery

Decision: inbox/operation idempotency, unique logical keys, aggregate transaction, and outbox provide exactly-once durable effect.

#### ADR-008 — Aggregate Concurrency Strategy

Decision: route Character operations with `characterId` partition affinity,
lock the authoritative Character-and-Track row in the database transaction,
and enforce optimistic `aggregateVersion` comparison. Broker ordering improves
throughput but is never the final consistency boundary.

#### ADR-009 — Identifier Standard

Decision: use canonical UUIDv7 platform identifiers as defined by
`002a-platform-contract-standard`; PostgreSQL stores them as `UUID`.

#### ADR-010 — Progression Retention and Privacy

Decision: retain the non-personal Progression ledger for integrity according to
the published regional retention schedule; pseudonymize Character association
after anonymization, exclude Progression from public visibility by default,
provide scoped exports, and process erasure through the platform privacy
workflow. A deployment cannot enter production without an approved retention
schedule for its realm.

#### ADR-011 — Event Envelope and Schema Governance

Decision: use the canonical Event envelope, UUIDv7 identities, authenticated
producer registry, and compatibility policy from
`002a-platform-contract-standard`.

#### ADR-012 — Track Definition Activation and Migration

Decision: activation affects new resolution; existing aggregates remain pinned until explicit migration.

#### ADR-013 — Prestige Reversal Semantics

Decision: normal reward reversal preserves completed Prestige; rank correction uses a privileged explicit operation.

#### ADR-014 — Audit Tamper Evidence

Decision: every Character-and-Track ledger uses a hash chain, daily checkpoints
are exported to the restricted audit sink, and checkpoint verification runs at
least daily and after restore. Signature and retention policy follow the
platform audit key and realm retention standards.

#### ADR-015 — Multi-Region Ownership

Decision: version 1 uses one authoritative home region per Character aggregate.
Failover transfers the routing epoch under controlled fencing. Multi-writer
active-active Progression is disabled until a separate ADR proves conflict
prevention and ledger ordering.

### Recommended ADR outcomes encoded by this RFC

Until superseded by an approved ADR, implementation SHOULD adopt:

- finalized Experience amount calculated upstream;
- one aggregate per Character and Track;
- explicit thresholds;
- integer Experience;
- pinned definition versions;
- append-only ledger;
- transactional outbox;
- manual and automatic Prestige as specified;
- normal reversal preserving Prestige Rank;
- relational reference storage.

---

## Appendix

### Appendix A. Reference Progression Track Definition

```json
{
  "track_id": "0190f7d0-8c4f-7a5a-b0b6-5ac91f0d6631",
  "track_key": "core",
  "version": 4,
  "minimum_level": 1,
  "maximum_level": 10,
  "thresholds": [
    {"level": 1, "minimum_experience": 0},
    {"level": 2, "minimum_experience": 100},
    {"level": 3, "minimum_experience": 250},
    {"level": 4, "minimum_experience": 475},
    {"level": 5, "minimum_experience": 800},
    {"level": 6, "minimum_experience": 1250},
    {"level": 7, "minimum_experience": 1850},
    {"level": 8, "minimum_experience": 2650},
    {"level": 9, "minimum_experience": 3700},
    {"level": 10, "minimum_experience": 5000}
  ],
  "cap_policy": "bank_overflow",
  "terminal_cap_policy": null,
  "prestige_policy": {
    "mode": "manual",
    "maximum_rank": 20,
    "reset_experience": 0,
    "minimum_overflow_for_manual": 500,
    "overflow_policy": "carry",
    "terminal_cap_policy": "bank_overflow",
    "rank_display_key_pattern": "progression.track.core.prestige.{rank}.name"
  },
  "operation_limits": {
    "maximum_grant": 100000,
    "maximum_positive_adjustment": 100000,
    "maximum_negative_adjustment": 100000,
    "maximum_overflow": 1000000,
    "overflow_limit_behavior": "reject",
    "maximum_automatic_prestige_transitions": 100,
    "maximum_detailed_level_boundaries": 1000,
    "maximum_attributes_bytes": 16384,
    "maximum_source_time_skew_seconds": 2592000
  },
  "activation": {
    "assignment_policy": "default_for_new_aggregates",
    "visible_when_not_started": true,
    "display_order": 100
  },
  "presentation": {
    "name_key": "progression.track.core.name",
    "description_key": "progression.track.core.description",
    "icon_key": "progression/core/icon",
    "theme_key": "progression/core/default"
  },
  "compatibility": {
    "classification": "requires_impact_analysis",
    "allowed_migration_strategies": [
      "preserve_experience",
      "explicit_mapping"
    ]
  }
}
```

### Appendix B. Grant calculation pseudocode

```text
function applyExperienceGrant(prior, command, definition):
    assert command.amount > 0
    assert prior.status allows normal grant
    assert definition.version == prior.definitionVersion
    assert command.amount <= definition.limits.maximumGrant
    assert no integer overflow is possible

    next = copy(prior)
    requested = command.amount
    remaining = requested
    applied = 0
    unapplied = 0
    transitions = []

    if definition.capPolicy == CLAMP:
        capacity = maxThreshold(definition) - next.experience
        grantToCycle = min(remaining, max(0, capacity))
        next.experience += grantToCycle
        applied += grantToCycle
        remaining -= grantToCycle
        unapplied += remaining
        remaining = 0

    else if definition.capPolicy == BANK_OVERFLOW:
        capacity = maxThreshold(definition) - next.experience
        grantToCycle = min(remaining, max(0, capacity))
        next.experience += grantToCycle
        applied += grantToCycle
        remaining -= grantToCycle

        if remaining > 0:
            assert overflow policy allows full operation
            assert next.overflow + remaining <= maximumOverflow
            next.overflow += remaining
            applied += remaining
            remaining = 0

    else if definition.capPolicy == AUTO_PRESTIGE:
        transitionsUsed = 0

        while remaining > 0:
            capacity = maxThreshold(definition) - next.experience
            grantToCycle = min(remaining, max(0, capacity))
            next.experience += grantToCycle
            applied += grantToCycle
            remaining -= grantToCycle

            if remaining == 0:
                break

            if cannotPrestige(next, definition):
                applyTerminalCapPolicy(next, remaining, definition)
                applied += terminalAppliedAmount
                unapplied += terminalUnappliedAmount
                remaining = 0
                break

            transitionsUsed += 1
            assert transitionsUsed <= maximumAutomaticPrestigeTransitions

            next.prestigeRank += 1
            next.experience = definition.prestige.resetExperience
            record prestige transition

    next.level = deriveLevel(next.experience, definition)
    next.prestigeAvailable = derivePrestigeAvailability(next, definition)
    detect level, cap, and availability transitions

    next.lifetimePositiveExperience += applied
    next.lifetimeNetExperience += applied
    next.aggregateVersion += 1
    next.lastLedgerSequence += 1
    next.stateHash = hash(next)

    return mutationResult(next, applied, unapplied, transitions)
```

The production implementation should avoid inefficient loops when automatic Prestige can be calculated mathematically, but optimized behavior MUST match this reference semantics.

### Appendix C. Reversal allocation

To reverse correctly under cap and overflow policies, each grant ledger entry SHOULD store how its applied amount was allocated:

```json
{
  "allocation": {
    "cycle_experience": 100,
    "overflow_experience": 150,
    "automatic_prestige_cycles": [
      {
        "rank_from": 0,
        "rank_to": 1,
        "experience_consumed": 5000
      }
    ]
  }
}
```

A reversal uses source allocation and current correction policy. It must not assume that the Character's present overflow came entirely from the most recent grant.

When exact allocation reversal is impossible because subsequent Prestige or migration transformed state, the operation is escalated to a correction workflow rather than applying misleading arithmetic.

### Appendix D. Definition validation pseudocode

```text
function validateDefinition(definition):
    require valid track key
    require minimumLevel <= maximumLevel
    require number of thresholds == maximumLevel - minimumLevel + 1
    require thresholds cover every Level exactly once
    require threshold[minimumLevel] == 0

    previous = -1
    for threshold in thresholds ordered by Level:
        require threshold.minimumExperience >= 0
        require threshold.minimumExperience > previous
        require threshold.minimumExperience <= INT64_MAX
        previous = threshold.minimumExperience

    require capPolicy in supported values
    require prestigeMode in supported values

    if prestigeMode == AUTOMATIC:
        require capPolicy == AUTO_PRESTIGE

    if capPolicy == AUTO_PRESTIGE:
        require prestigeMode == AUTOMATIC

    if prestigeMode != DISABLED:
        require resetExperience >= 0
        require resetExperience <= maxThreshold
        require deriveLevel(resetExperience) is valid

    if maximumPrestigeRank is finite:
        require terminalCapPolicy is configured

    require all operation limits are positive and internally consistent
    require canonical serialized definition size <= platform maximum
    require simulation suite passes
    require no arithmetic test vector overflows

    return validationReport with content hash
```

### Appendix E. Canonical operation reason codes

Reason codes are machine-readable and stable. They do not contain free-form domain language.

Initial grant reason codes:

- `reward_component_applied`;
- `migration_compensation`;
- `administrative_grant`;
- `system_recovery_grant`.

Initial reversal reason codes:

- `reward_revoked`;
- `duplicate_source_correction`;
- `fraud_correction`;
- `administrative_reversal`.

Initial adjustment reason codes:

- `support_correction`;
- `data_migration_correction`;
- `incident_repair`;
- `legal_correction`;
- `reconciliation_repair`.

Lifecycle reason codes:

- `character_suspended`;
- `character_closed`;
- `fraud_review`;
- `support_investigation`;
- `migration_lock`;
- `track_retired`;
- `character_restored`;
- `administrative_action`.

Reason code registries MUST be versioned and documented. Producers may not invent arbitrary reason codes in production.

### Appendix F. Accepted no-op reason codes

- `at_cap_clamped`;
- `already_frozen`;
- `already_unfrozen`;
- `already_closed`;
- `already_reopened`;
- `already_on_target_definition`;
- `duplicate_equivalent_request`;
- `zero_effect_after_policy`.

A duplicate equivalent request normally returns the original result and does not create a second ledger entry. The code exists for operation-level diagnostics, not to represent a new mutation.

### Appendix G. Rejection classification

| Classification | Retry? | Example |
|---|---:|---|
| `invalid_request` | no | Negative grant, malformed id. |
| `unauthorized` | no | Producer lacks scope. |
| `conflict` | caller decision | Stale aggregate version. |
| `dependency_lag` | yes | Character eligibility not yet projected. |
| `transient_infrastructure` | yes | Database failover. |
| `definition_integrity` | no automatic retry | Content hash mismatch. |
| `security_conflict` | no | Reused request id with different payload. |
| `capacity` | yes | Temporary rate or resource exhaustion. |
| `quarantine_required` | operator review | Unknown compatible schema or sequence gap. |

### Appendix H. Metrics

Minimum metrics:

#### Mutation metrics

- operations received by type and producer;
- operations applied;
- accepted no-ops by reason;
- rejected by code;
- retries and retry age;
- quarantined and dead-lettered count;
- idempotency duplicate and conflict count;
- commit latency;
- optimistic conflict and deadlock count;
- grants, reversals, and adjustments amount distributions.

#### State metrics

- active aggregates by Track and definition version;
- Level distribution;
- Prestige Rank distribution;
- capped and Prestige-available count;
- frozen and closed count;
- banked overflow distribution;
- aggregates on Retired versions.

State metrics must avoid user-identifying labels.

#### Event metrics

- inbox lag;
- outbox backlog and age;
- publish latency;
- publish retry and dead-letter count;
- aggregate version gaps observed by projectors.

#### Integrity metrics

- reconciliation checks;
- divergence count by category;
- state hash mismatch;
- ledger hash-chain failure;
- missing definition or aggregate reference;
- repair success and failure.

#### Definition and migration metrics

- Draft validation failures by rule;
- activation success and failure;
- migration item status;
- migration throughput;
- Level impact distribution;
- migration conflict rate.

### Appendix I. Alerts

Critical alerts:

- ledger or state hash mismatch;
- published definition hash mismatch;
- acknowledged operation loss suspicion;
- operation idempotency conflict spike;
- outbox oldest pending age above threshold;
- database recovery point objective at risk;
- reconciliation divergence affecting many aggregates;
- unauthorized producer attempts;
- migration causing unapproved Level decrease;
- automatic Prestige safety-limit failures spike.

High alerts:

- mutation rejection spike;
- dependency lag backlog;
- projection freshness SLO violation;
- dead-letter growth;
- hot Character contention;
- grants above anomaly threshold;
- aggregates remaining on obsolete version beyond migration objective.

### Appendix J. Operational runbooks required

Before production launch, the repository MUST contain runbooks for:

1. Event backlog and consumer lag;
2. database failover;
3. outbox publication failure;
4. idempotency conflict investigation;
5. published definition integrity failure;
6. incorrect Track activation;
7. migration pause and rollback planning;
8. reconciliation divergence;
9. Character-specific freeze and repair;
10. bulk erroneous reward reversal;
11. privacy deletion and export;
12. disaster recovery and broker offset reconciliation;
13. credential compromise;
14. projection rebuild;
15. hot partition mitigation.

### Appendix K. Implementation package structure

A recommended repository structure is:

```text
engines/progression/
├── domain/
│   ├── aggregate/
│   ├── calculator/
│   ├── definitions/
│   ├── operations/
│   ├── transitions/
│   └── errors/
├── application/
│   ├── commands/
│   ├── queries/
│   ├── migrations/
│   ├── reconciliation/
│   └── authorization/
├── infrastructure/
│   ├── database/
│   ├── event-consumer/
│   ├── outbox/
│   ├── cache/
│   └── observability/
├── api/
│   ├── public/
│   ├── internal/
│   └── admin/
├── schemas/
│   ├── events/
│   ├── api/
│   └── definitions/
├── tests/
│   ├── unit/
│   ├── property/
│   ├── contract/
│   ├── integration/
│   ├── security/
│   ├── performance/
│   └── recovery/
└── runbooks/
```

The domain calculator package MUST remain independent from infrastructure packages.

### Appendix L. Implementation readiness checklist

#### Domain

- [ ] Canonical terms approved.
- [ ] Single-writer ownership approved.
- [ ] Cap policies approved.
- [ ] Prestige reversal semantics approved.
- [ ] Migration strategies approved.
- [ ] Reason code registry approved.

#### Contracts

- [ ] Event envelope schema published.
- [ ] Inbound Event JSON Schemas published.
- [ ] Outbound Event JSON Schemas published.
- [ ] API OpenAPI specification published.
- [ ] Producer and consumer compatibility tests active.

#### Storage

- [ ] Database schema reviewed.
- [ ] Partitioning tested.
- [ ] Unique idempotency constraints verified.
- [ ] Backup and restore tested.
- [ ] Ledger immutability permissions verified.
- [ ] Point-in-time recovery objective validated.

#### Security and privacy

- [ ] Threat model reviewed.
- [ ] Authorization matrix approved.
- [ ] Approval thresholds configured.
- [ ] PII allow-list and rejection policy implemented.
- [ ] Data retention ADR approved.
- [ ] Deletion and export flows tested.
- [ ] Break-glass controls tested.

#### Operations

- [ ] SLO dashboards live.
- [ ] Alerts tested.
- [ ] Dead-letter workflow tested.
- [ ] Reconciliation scheduled.
- [ ] Projection rebuild tested.
- [ ] Migration pause/resume tested.
- [ ] Disaster recovery exercise completed.
- [ ] Runbooks reviewed by on-call team.

#### Product

- [ ] At least one production Track validated with realistic earning scenarios.
- [ ] User-facing cap behavior approved.
- [ ] Manual Prestige confirmation UX approved where enabled.
- [ ] Level decrease communication approved.
- [ ] Narrative and localization keys complete.
- [ ] Accessibility review completed.

### Appendix M. Glossary mapping

| Canonical term | Permitted contextual presentation | Prohibited technical substitution |
|---|---|---|
| Experience | XP | points, score, coins when referring to Experience |
| Level | rank only in user-facing domain copy when mapped explicitly | tier as an undocumented synonym |
| Prestige Rank | prestige, cycle count in presentation | Level |
| Progression Track | path, journey in presentation | module-owned Character |
| Experience Grant | XP reward in presentation | direct Level update |
| Ledger Entry | progression receipt in support UI | mutable transaction row |
| Track Definition Version | rules version | current config without version |
| Accepted No-op | no Experience applied | silent success |

### Appendix N. Non-normative example flows

#### Example 1. Real action grants Experience

```text
lesson.completed
    → Reward Engine resolves reward policy
    → reward.fulfillment.requested.v1 componentType=EXPERIENCE amount=100
    → Progression Engine applies Experience
    → progression.experience.applied.v1
    → progression.level.changed.v1, if threshold crossed
    → Achievement and Notification consumers react
```

The Progression Engine never interprets `lesson.completed`.

#### Example 2. Purchase refund reverses Experience

```text
purchase.refunded
    → Reward Engine identifies prior reward component
    → reward.reversal.requested.v1 componentType=EXPERIENCE
    → progression.experience.reversal.requested.v1
    → Progression Engine links original ledger entry
    → Experience and Level may decrease
    → progression.experience.applied.v1
    → progression.level.changed.v1 direction=decrease, when applicable
```

#### Example 3. Manual Prestige

```text
Client reads Character Track Detail
    → can_commit_prestige=true, aggregate_version=88
Client confirms narrative reset
    → POST prestige with expected version 88
Command service publishes prestige commit request
    → Progression Engine commits Rank 1
    → publishes prestige completed and reset Level transition
```

#### Example 4. Definition rollout

```text
Designer clones version 3
    → changes thresholds in Draft
    → validates and simulates
    → impact analysis identifies 2% Level decreases
    → approval requires migration and communication plan
    → version 4 published and activated for new aggregates
    → existing aggregates remain on version 3
    → approved migration job moves selected Characters
```

### Appendix O. Final invariants summary

A conforming Progression Engine implementation MUST guarantee:

1. no Business Module directly mutates progression state;
2. no other Engine writes Experience, Level, or Prestige;
3. every accepted operation has one durable, explainable effect;
4. duplicate delivery never duplicates progression;
5. published rules are immutable and replayable;
6. Experience arithmetic is integer and overflow-safe;
7. Level is deterministic from Position and definition;
8. Prestige behavior is explicit and versioned;
9. ledger, aggregate, transitions, and outbox commit atomically;
10. correction never erases history;
11. projections are rebuildable;
12. sensitive data is minimized and protected;
13. operational failure delays or rejects safely rather than silently corrupting progression;
14. new business domains integrate by publishing canonical Events and configuring data, not by changing Engine code.

---

> **Progression is not a number added to a profile. It is an authoritative, explainable history of Character growth.**
