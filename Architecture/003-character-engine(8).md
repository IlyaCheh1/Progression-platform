---
document: 003-character-engine
title: Character Engine
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
related_documents:
  - 004-progression-engine
  - 005-reward-engine
  - 006-achievement-engine
  - 007-quest-engine
  - 008-talent-engine
  - 009-item-engine
  - 010-inventory-engine
  - 011-season-engine
---

# Character Engine

> **Platform contract conformance:** cross-Engine Events, identifiers, command
> semantics, and lifecycle integration MUST conform to
> `002a-platform-contract-standard` and `002b-cross-engine-integration`.

## Executive Summary

The Character Engine is the authoritative platform component for persistent Character identity. It owns the creation, lifecycle, ownership relationship, platform-wide profile, discoverability policy, presentation configuration, and domain-independent associations of a Character.

A Character is not an account, a school student record, a game avatar owned by one module, a CRM contact, or a progression balance. A Character is a durable platform identity that survives individual products and business contexts. Business Modules may associate their own domain subjects with a Character, publish Events about real actions, and render Character projections, but they MUST NOT create competing Character identities or directly mutate Character state.

The Character Engine intentionally does not own Experience, Levels, Prestige, Rewards, Items, Inventory, Achievements, Quests, Talents, Reputation, social relationships, billing state, learning state, or business membership. Those concerns belong to their respective Engines or Business Modules. The Character Engine publishes lifecycle and profile Events that downstream components consume through local projections. It does not synchronously coordinate distributed state changes across Engines.

The authoritative write path is command- and Event-driven. Every mutation is authenticated, authorized, idempotent, auditable, and committed atomically with an outbox Event. Read APIs are served from purpose-built projections and may be eventually consistent. Direct database mutation by clients, Business Modules, support tools, or other Engines is prohibited.

The Engine is designed around the following invariants:

1. A Character belongs to the platform and has one stable `character_id` for its lifetime.
2. Only the Character Engine may create, suspend, close, restore, anonymize, or change authoritative Character identity and profile state.
3. A Character has exactly one current owner relationship in the initial release; ownership transfer is not a normal operation.
4. Business Module participation is not Character state. The Engine may own an association reference, but the Module owns the business meaning and lifecycle of membership.
5. Profile data contains presentation and discoverability information only. Progression and entitlement values are projections or references, never authoritative profile fields.
6. Every accepted mutation is traceable to an immutable input Event or an explicitly authorized command.
7. Reprocessing the same logical command produces at most one durable effect.
8. Lifecycle transitions are explicit, deterministic, and append-only in history.
9. Character closure and privacy erasure are distinct operations. Closure disables normal use; anonymization irreversibly removes or de-identifies personal profile data while retaining minimum integrity records.
10. Other Engines consume Character lifecycle Events and maintain local eligibility projections. They MUST NOT require synchronous Character Engine availability on their critical write paths.
11. Public profile output is privacy filtered by the Character Engine or by an approved projection that applies the same policy version.
12. State changes and outgoing Events are committed atomically through the transactional outbox pattern.

This RFC is normative for backend implementation, Event contracts, storage, APIs, administrative tooling, security boundaries, privacy behavior, operational controls, and acceptance testing of the Character Engine.

---

## Purpose

The purpose of this RFC is to define a production-ready specification for the Character Engine of Progression Platform.

It establishes:

- the authoritative ownership boundary of Character identity;
- the canonical Character lifecycle;
- the Character Aggregate and its invariants;
- the distinction between User, Character, Profile, Module Association, and external Engine state;
- consumed and produced Event contracts;
- read and write models;
- the reference relational schema;
- public, internal, and administrative APIs;
- moderation, discoverability, profile presentation, and privacy behavior;
- security, performance, audit, and resilience requirements;
- deterministic handling of concurrency, retries, closure, restoration, and anonymization;
- acceptance criteria sufficient for implementation and production release.

The document is intentionally domain-agnostic. Terms such as student, member, athlete, subscriber, guild member, customer, creator, or player may appear only in non-normative examples. Runtime logic MUST use canonical platform terms and opaque domain references.

### Normative language

The key words **MUST**, **MUST NOT**, **REQUIRED**, **SHALL**, **SHALL NOT**, **SHOULD**, **SHOULD NOT**, **RECOMMENDED**, **MAY**, and **OPTIONAL** are to be interpreted as normative requirement levels.

Where this RFC refines a high-level diagram or an earlier draft, the ownership and contracts defined here take precedence for the Character Engine. Any cross-document inconsistency MUST be resolved through an ADR rather than by allowing two components to own the same state.

### Design posture

The initial production module is a school, but no Character Engine rule may depend on lessons, instructors, classes, subscriptions, or school membership. The same Engine implementation MUST support future modules without source-code changes to its core domain behavior.

---

## Goals

### G-1. Persistent platform identity

Provide a stable Character identity that can remain meaningful across products, modules, seasons, and years.

### G-2. Authoritative ownership

Provide one authoritative writer for Character lifecycle, owner relationship, platform profile, discoverability, and Character-owned presentation configuration.

### G-3. Domain independence

Support schools, fitness products, education products, communities, games, marketplaces, and future domains without embedding domain-specific state or rules.

### G-4. Event-driven integration

Publish typed lifecycle and profile Events so other Engines and Business Modules can maintain local projections without synchronous coupling.

### G-5. Privacy by design

Minimize personal data, support field-level disclosure policy, closure, export, and anonymization, and prevent public data leakage by default.

### G-6. Deterministic lifecycle

Apply explicit transition rules so the same command against the same state produces the same outcome.

### G-7. Idempotent mutation

Guarantee exactly-once durable effect for each logical operation despite retries and at-least-once Event delivery.

### G-8. Safe profile evolution

Support mutable profile data, optimistic concurrency, moderation, revision history, rollback by compensating update, and versioned projections.

### G-9. Stable module integration

Provide a domain-independent association mechanism between a Character and an external Module subject without taking ownership of business membership semantics.

### G-10. Presentation composition

Allow a Character to select profile presentation references, such as avatar asset, title, frame, theme, or badge placement, while entitlement ownership remains in the responsible Engine.

### G-11. Full auditability

Make every identity, lifecycle, ownership, privacy, moderation, association, and profile mutation explainable through immutable audit records and transition history.

### G-12. Operational safety

Provide rate limits, moderation controls, quarantine, reconciliation, projection repair, backpressure, and emergency controls suitable for production operation.

### G-13. Horizontal scalability

Scale reads and writes by `character_id` while preserving per-Character consistency and bounded contention.

### G-14. Narrative compatibility

Expose a stable identity and profile surface through which other Engines can present a coherent long-term journey rather than disconnected points and badges.

---

## Non Goals

### NG-1. Authentication and account credentials

The Engine does not authenticate people, store passwords, manage sessions, issue access tokens, or own account recovery. Those responsibilities belong to the Identity Provider and User account system.

### NG-2. Progression ownership

The Engine does not own Experience, Levels, Prestige, Progression Tracks, Reputation, or any numeric growth state.

### NG-3. Reward and entitlement ownership

The Engine does not grant Rewards, own Items, validate Inventory quantities, award Titles, or decide whether a Character is entitled to a cosmetic. It may store selected presentation references after validation against local entitlement projections.

### NG-4. Quest, Achievement, Talent, and Season logic

The Engine does not evaluate Objectives, Conditions, Talent effects, Campaigns, or Season rules.

### NG-5. Business membership

The Engine does not own enrollment, subscription, class attendance, team membership, guild membership, marketplace seller state, employment, or any other domain membership lifecycle. A Module Association is only a platform identity link.

### NG-6. Social graph

The Engine does not own friendships, followers, blocks, guilds, parties, or relationship permissions. It may consume a privacy decision projection from a future social or policy component.

### NG-7. Generic user preferences

The Engine is not a general settings database. Locale, communication consent, billing preferences, device settings, and account security preferences belong elsewhere. Only Character-specific presentation and disclosure settings are in scope.

### NG-8. Media storage and transformation

The Engine does not store binary avatar files, scan uploads, resize images, or deliver media. It stores approved asset references from a Media Service.

### NG-9. General content management

The Engine is not a CMS. Biography and display fields are bounded profile attributes, not arbitrary documents, posts, or pages.

### NG-10. Cross-Engine distributed transactions

The Engine does not atomically update Character state together with Progression, Inventory, Reward, or Module databases. Consistency across components is Event-driven.

### NG-11. Arbitrary ownership transfer

Character sale, gift, transfer, delegation, or shared ownership is unsupported in the initial release. Account merge and legal recovery require dedicated privileged workflows.

### NG-12. Character merge

Merging two Characters is not a routine v1 operation because downstream state may be non-mergeable. A future merge capability requires an ADR and per-Engine migration protocol.

### NG-13. Real-time avatar simulation

The Engine is not a game runtime, 3D avatar controller, combat entity, or animation system.

### NG-14. Module-specific profile extensions in core tables

Business Modules MUST NOT add school-, fitness-, game-, or marketplace-specific columns to Character Engine tables. Module-specific profile data remains in the Module or in an approved extension mechanism outside the aggregate.

---

## Responsibilities

### R-1. Character creation

The Engine MUST validate and create a Character from an authorized, idempotent creation request. It MUST generate the canonical `character_id`, initialize lifecycle state, create a baseline profile and privacy policy, append lifecycle history, and publish `character.created.v1` atomically.

### R-2. Owner relationship

The Engine MUST maintain the authoritative current relationship between a Character and its owning User identifier. The initial release supports exactly one current owner. Normal APIs MUST NOT change this relationship.

### R-3. Character lifecycle

The Engine MUST own activation, suspension, reactivation, closure, restoration, and anonymization according to explicit policy and transition rules.

### R-4. Platform profile

The Engine MUST own mutable presentation attributes such as display name, biography, avatar reference, profile theme reference, pronoun display text where enabled, and other approved bounded profile fields.

### R-5. Discoverability and visibility

The Engine MUST own global Character directory visibility, public profile visibility, and field-level disclosure settings. Business Modules MAY impose stricter visibility in their own surfaces but MUST NOT weaken platform policy.

### R-6. Handle management

Where public handles are enabled, the Engine MUST own normalization, uniqueness, reservation, rename policy, moderation state, and history.

### R-7. Presentation selection

The Engine MUST own the Character's choice of references placed into configured profile presentation slots. It MUST NOT treat a selection as proof of entitlement.

### R-8. Module Association registry

The Engine MAY maintain domain-independent links between a Character and an external Module subject. It MUST store only the identifiers and state required for identity resolution, not business membership details.

### R-9. Moderation state

The Engine MUST support policy-driven review, rejection, hiding, and restoration of profile content. Moderation decisions MUST be explicit and audited.

### R-10. Idempotency and concurrency

The Engine MUST deduplicate logical operations, reject idempotency conflicts, and serialize writes to the same Character Aggregate.

### R-11. Event publication

The Engine MUST publish immutable lifecycle, profile, association, and presentation outcome Events through a transactional outbox.

### R-12. Read projections

The Engine MUST maintain or publish enough information to build owner, public, directory, internal summary, and administration projections.

### R-13. Privacy workflows

The Engine MUST support access export, profile suppression, closure, retention policy, anonymization, and legal hold behavior.

### R-14. Reconciliation and repair

The Engine MUST detect and repair projection drift, outbox gaps, handle index inconsistencies, and incomplete lifecycle workflows without silent destructive edits.

### R-15. Explainability

The Engine MUST expose a privileged explanation trace that connects a request, authorization decision, prior state, validation, resulting state, outgoing Events, and projection status.

### R-16. Operational controls

The Engine MUST provide safe pause, queue quarantine, producer revocation, profile write lock, directory disablement, and anonymization freeze controls.

---

## Dependencies

The Character Engine depends on stable platform capabilities. Dependencies are classified as authoritative, asynchronous, optional, and forbidden.

### Identity Provider and User account system

The Identity Provider authenticates principals and issues verifiable credentials. The User account system owns the account lifecycle and the platform User identifier.

The Character Engine consumes only the minimum account information required to establish ownership and policy:

- `owner_user_id` as an opaque stable identifier;
- account lifecycle state relevant to Character eligibility;
- verified service or user principal claims;
- delegated administration context where applicable;
- coarse policy attributes such as minor restriction level, legal region, or account risk state when supplied by an approved policy service.

The Character Engine MUST NOT store passwords, session tokens, recovery secrets, raw identity documents, or unnecessary account PII.

The normal mutation path MUST validate authorization from token claims or a local policy decision. It MUST NOT synchronously fetch the full User profile for every command.

### Event infrastructure

Required Event capabilities:

- at-least-once delivery;
- durable retention sufficient for replay and recovery;
- stable partition key routing by `character_id` where available;
- schema registry or equivalent compatibility control;
- dead-letter or quarantine support;
- producer identity and authorization;
- observable consumer lag;
- replay with bounded scope;
- transactional outbox publication from the Character database.

Exactly-once broker delivery is not required. Exactly-once durable effect is implemented by Character Engine idempotency and transactional storage.

### Authorization and Policy service

A platform authorization capability evaluates roles, owner access, service permissions, administrative scopes, and high-risk action approvals.

The Character Engine remains responsible for enforcing the final authorization decision. A client-supplied role or owner identifier is never trusted.

The Engine SHOULD maintain a local cache of stable policy data but MUST fail closed for privileged writes if policy cannot be verified.

### Media Service

The Media Service owns binary avatar and profile assets, malware scanning, transformation, moderation metadata, and delivery URLs.

The Character Engine stores only immutable or versioned asset references and validation state. Arbitrary external avatar URLs are prohibited in authoritative profile state.

The dependency is asynchronous for normal profile rendering. A selected asset may remain `PENDING_VALIDATION` until the Engine receives an approved asset Event.

### Moderation service

An automated or human moderation capability may evaluate display names, biographies, handles, and profile assets.

The Character Engine owns the enforcement state for Character profile fields. It MAY publish moderation requests and consume decisions. If moderation is unavailable, policy determines whether content remains draft, is hidden, or uses a previously approved value. The Engine MUST NOT publish unreviewed content when policy requires pre-moderation.

### Entitlement projections

Inventory, Achievement, Reward, Talent, or other Engines may publish entitlement Events relevant to presentation selections.

The Character Engine SHOULD consume these Events into a minimal local eligibility projection containing:

- `character_id`;
- `resource_type`;
- `resource_id`;
- grant or revoke state;
- source Engine;
- source version or sequence;
- effective timestamps.

The Character Engine MUST NOT synchronously call another Engine on every profile read. A missing entitlement projection is not proof of entitlement.

### Search infrastructure

Public Character discovery MAY use a dedicated search index. The Character Engine remains authoritative for source profile and visibility state.

Search indexing is asynchronous and privacy filtered. Search documents MUST contain no fields that are not permitted for directory disclosure. Deindexing after closure, privacy change, moderation action, or anonymization is a high-priority workflow.

### Audit and observability infrastructure

The Engine depends on centralized metrics, traces, logs, security audit retention, alerting, and incident response tooling. Domain history stored locally does not replace security audit logs.

### Time source

All servers MUST use a synchronized UTC time source. Client timestamps are advisory and MUST NOT define authoritative lifecycle ordering.

### Database

The reference implementation uses a relational database with:

- ACID transactions;
- unique constraints;
- row-level or optimistic concurrency control;
- transactional outbox support;
- encrypted backups;
- point-in-time recovery;
- partitioning and online index operations where scale requires them.

PostgreSQL is the reference database in this RFC. Equivalent storage MAY be used only if it preserves all defined invariants.

### Optional notification dependency

A Notification Engine may consume Character Events. The Character Engine does not synchronously send email, push, chat, or in-product messages.

### Forbidden dependencies

The Character Engine MUST NOT require synchronous runtime calls to:

- Progression Engine;
- Reward Engine;
- Quest Engine;
- Achievement Engine;
- Talent Engine;
- Item Engine;
- Inventory Engine;
- Season Engine;
- any Business Module database.

It MAY consume their Events or local projections for profile presentation validation.

---

## Architecture Overview

### Context

```text
Authenticated User / Administrator / Service
                    │
                    ▼
        API Gateway and Authorization
                    │
        Command or inbound Event
                    │
                    ▼
┌───────────────────────────────────────────────────────────┐
│                    Character Engine                       │
│                                                           │
│  Inbox / Idempotency                                      │
│           │                                               │
│           ▼                                               │
│  Command Handler ──► Policy and Validation                │
│           │                  │                            │
│           ▼                  ▼                            │
│       Character Aggregate   Local Projections             │
│           │                  - owner/account state         │
│           │                  - entitlement state           │
│           │                  - media/moderation state       │
│           ▼                                               │
│  Authoritative Store + History + Outbox                   │
│           │                                               │
└───────────┼───────────────────────────────────────────────┘
            │
            ▼
       Event Bus
            │
  ┌─────────┼───────────┬────────────┬──────────────┐
  ▼         ▼           ▼            ▼              ▼
Progression Inventory  Search   Notifications   Business Modules
projection  projection projection   projection      projections
```

### Ownership boundary

The Character Engine owns:

- Character identifier;
- current owner relationship;
- Character lifecycle state;
- platform-wide profile source data;
- Character visibility and directory policy;
- public handle where enabled;
- presentation slot selections;
- generic Module Association references;
- Character-local revision and lifecycle history;
- operation idempotency records;
- Character Engine inbox and outbox.

The Character Engine does not own:

- account authentication or credentials;
- domain membership state;
- Experience, Levels, Prestige, Reputation;
- Rewards, Items, Inventory, Achievements, Quests, Talents;
- social graph;
- notification delivery;
- binary assets;
- analytics warehouse copies;
- Business Module data.

### Internal components

#### Command API

Accepts authenticated owner, internal service, and administrative commands. It validates request shape, authorization, idempotency, expected aggregate version, and operation-specific policy.

#### Event Consumer

Consumes authorized account, moderation, media, entitlement, and privacy Events. It persists inbox state before applying effects and supports retry, quarantine, and replay.

#### Identity Resolver

Resolves owner and Module Association references using local authoritative indexes. It never trusts a Module-provided `character_id` without producer authorization and consistency checks.

#### Character Aggregate Repository

Loads and persists authoritative Character state. It enforces aggregate versioning, row-level consistency, and immutable identifiers.

#### Lifecycle Policy

Validates allowed transitions, required reasons, recovery windows, legal holds, and downstream propagation behavior.

#### Profile Policy

Validates field limits, normalization, visibility, moderation requirements, allowed asset references, and minor-safe restrictions.

#### Handle Registry

Provides normalized uniqueness, reservation, cooldown, redirect, and abuse controls for public handles.

#### Presentation Validator

Validates selected profile resources against local entitlement and media projections. It never grants an entitlement.

#### Association Registry

Maintains generic identity links to Module subjects. It validates Module producer scope and uniqueness without interpreting membership semantics.

#### Privacy Orchestrator

Executes closure, export, anonymization, deindexing, and downstream privacy propagation as resumable, idempotent workflows.

#### Projection Publisher

Builds or emits source Events for owner, public, directory, internal, and administrative read models.

#### Inbox and Idempotency Store

Deduplicates inbound Events and synchronous commands. It distinguishes safe duplicate retry from conflicting idempotency-key reuse.

#### Transactional Outbox

Persists outgoing Events in the same transaction as authoritative state. An independent publisher delivers them to the Event Bus.

#### Reconciliation Worker

Verifies state-to-history consistency, handle uniqueness, projection freshness, outbox publication, association indexes, and anonymization completion.

### Write transaction

Every authoritative mutation MUST use the following logical sequence:

1. authenticate the caller or verify Event producer identity;
2. authorize the requested operation and target Character;
3. validate the Event envelope or API request;
4. register or load the idempotency record;
5. lock or compare-and-swap the Character Aggregate;
6. verify expected aggregate version when supplied;
7. resolve required local policy and projection state;
8. execute the aggregate command deterministically;
9. persist Character, profile, indexes, and append-only history;
10. write the operation result;
11. write one or more outbox Events;
12. commit the transaction;
13. publish asynchronously;
14. update read projections idempotently.

No successful response may be returned before the authoritative transaction commits. Outbox publication may occur after the response.

### Delivery semantics

Inbound Events are delivered at least once. The Engine provides exactly-once durable effect using:

- globally unique `event_id`;
- producer-scoped idempotency keys for logical commands;
- canonical request hash;
- inbox unique constraints;
- operation result reuse for exact duplicates;
- aggregate version checks;
- atomic state and outbox commit.

If the same idempotency key is reused with a different canonical payload, the request MUST be rejected as `IDEMPOTENCY_CONFLICT` and audited.

### Ordering model

All mutations for the same `character_id` MUST be serialized by broker partition affinity, database locking, optimistic versioning, or a combination of these controls.

Global ordering across Characters is neither required nor guaranteed.

Lifecycle Event consumers MUST use the Character `aggregate_version` to reject stale updates. Timestamps alone are insufficient for ordering.

### Consistency model

Authoritative Character state is strongly consistent per aggregate.

Read projections, search documents, notification state, and downstream Engine eligibility projections are eventually consistent. Projection Events MUST carry `aggregate_version`, `profile_version`, and relevant policy versions so consumers can apply monotonic updates.

### Failure isolation

Failure of Search, Notification, Media delivery, Progression, Inventory, or any Business Module MUST NOT corrupt Character state or block unrelated Character writes.

Failure of a required authorization or database dependency causes the write to fail closed.

Moderation and entitlement dependency failures follow explicit policy:

- retain previous approved profile state;
- keep new content in draft or pending state;
- do not silently publish unvalidated content;
- retry asynchronously;
- expose pending status to the owner where appropriate.

### Deployment model

The Engine SHOULD separate:

- mutation workers;
- public read API;
- owner read API;
- administrative control plane;
- search projection workers;
- privacy workflow workers;
- reconciliation and replay workers.

These workloads MAY share a codebase but SHOULD be independently scalable and rate limited.

---

## Canonical Definitions

### Character

A persistent digital identity owned by a User and governed by Progression Platform.

A Character is the aggregate root of the Character Engine. It is referenced by other Engines through `character_id` but does not contain their state.

### Character ID

An immutable, opaque, globally unique identifier generated by the Character Engine.

The reference implementation stores it as PostgreSQL `UUID`. UUIDv7 is RECOMMENDED for new identifiers because it provides sortable generation without exposing business meaning. Consumers MUST treat the identifier as opaque.

A Character ID is never reused, including after closure or anonymization.

### User

The authenticated platform account that owns one or more Characters. User authentication, credentials, and account profile are outside the Character Engine.

### Owner Relationship

The authoritative link between a Character and one owning User.

The initial release permits exactly one current owner. The relationship contains identifiers and lifecycle metadata, not credentials or arbitrary User profile data.

### Character Slot Key

A stable key identifying the Character position within a User account when multiple Characters are enabled.

The initial default is `primary`. Data storage MUST support more than one slot without requiring Character ID changes, but product policy MAY limit creation to one active Character.

### Character Lifecycle State

The authoritative operational state of a Character:

- `PENDING`;
- `ACTIVE`;
- `SUSPENDED`;
- `CLOSED`;
- `ANONYMIZED`.

Lifecycle state is distinct from profile moderation state, directory visibility, and Module Association state.

### Pending Character

A Character record whose creation transaction or required policy checks have not completed for normal use.

A `PENDING` Character is not eligible for public discovery or downstream progression. The normal implementation SHOULD create and activate atomically, making `PENDING` transient or internal.

### Active Character

A Character eligible for normal owner mutations and downstream platform activity, subject to authorization and policy.

### Suspended Character

A temporarily restricted Character. Suspension may result from moderation, security, legal, fraud, or administrative policy.

Suspension does not erase state. Read visibility and allowed operations are determined by suspension policy. Normal progression and profile mutation are rejected unless explicitly permitted.

### Closed Character

A logically closed Character that is unavailable for normal activity and hidden from public discovery.

Closure may be owner-requested, account-driven, administrative, or legal. It is potentially reversible during a configured recovery window unless anonymization has begun.

### Anonymized Character

An irreversibly de-identified Character tombstone retained only to preserve referential integrity, fraud controls, legal obligations, and non-personal historical consistency.

An anonymized Character cannot be restored. Public profile, handle, discoverability, direct owner link, and personal profile fields are removed or cryptographically de-identified according to policy.

### Profile

The Character-owned presentation record containing bounded display attributes and visibility policy.

Profile is not progression and MUST NOT be used as the authoritative store for values owned by other Engines.

### Profile Version

A monotonically increasing integer incremented for every accepted profile source change. It is separate from the Character Aggregate version so consumers can optimize profile-only projection updates.

### Display Name

A mutable, non-unique human-readable name shown in permitted profile contexts.

Display names are normalized, bounded, policy-checked, and moderation-controlled. They are not identity keys.

### Handle

An OPTIONAL unique public locator assigned to a Character within a defined namespace.

A handle is mutable under policy, but historical ownership and reservations are audited. Clients MUST use `character_id` for durable references.

### Handle Namespace

The uniqueness boundary for a handle. The initial platform namespace is `global`. Future regional, branded, or realm namespaces require explicit configuration and collision rules.

### Normalized Handle

The canonical representation used for uniqueness and lookup. Normalization MUST be deterministic, versioned, Unicode-aware, and resistant to case and confusable-character abuse.

### Biography

A bounded optional plain-text profile description. Rich HTML, executable markup, embedded scripts, and arbitrary links are prohibited in authoritative biography content.

### Avatar Reference

An immutable or versioned reference to an asset owned by the Media Service. It is not an external URL and not binary data.

### Profile Visibility

The global policy controlling who may retrieve a Character's public profile:

- `PUBLIC` — available to unauthenticated clients, subject to field policy;
- `AUTHENTICATED` — available only to authenticated platform principals;
- `PRIVATE` — available only to owner and authorized administrators;
- `HIDDEN_BY_POLICY` — suppressed by moderation, suspension, closure, legal, or safety policy.

`HIDDEN_BY_POLICY` is system-controlled and cannot be selected by the owner.

### Directory Visibility

A separate policy controlling whether a Character may appear in search, suggestions, directories, or public listings:

- `LISTED`;
- `UNLISTED`;
- `HIDDEN_BY_POLICY`.

A Character may have a readable profile while remaining unlisted.

### Field Visibility

An OPTIONAL per-field disclosure override that can only be equal to or stricter than the global Profile Visibility.

### Profile Moderation State

The enforcement state of mutable profile content:

- `APPROVED`;
- `PENDING_REVIEW`;
- `REJECTED`;
- `HIDDEN`.

A profile may retain the previous approved revision while a new revision is pending review.

### Profile Revision

An immutable snapshot of submitted profile source fields and moderation outcome. The current approved revision is referenced by the Character Profile.

### Presentation Slot

A configured location in the profile presentation, such as `avatar`, `title`, `frame`, `theme`, `badge_primary`, or a future domain-independent slot.

Slot definitions are data-driven. Core code MUST NOT embed school- or game-specific slot names.

### Presentation Selection

The Character-owned choice of a resource reference for a Presentation Slot.

The selection proves preference, not entitlement. It becomes active only when the local entitlement and asset projections permit it.

### Entitlement Projection

A non-authoritative local projection indicating whether a Character may currently use a referenced presentation resource.

### Module

A business-domain implementation built on top of the platform.

### Module Association

A domain-independent identity link between a Character and an external subject in a Module context.

It MAY contain:

- `module_key`;
- `module_instance_id`;
- opaque `external_subject_id`;
- association state;
- creation and revocation timestamps;
- producer and source references.

It MUST NOT contain lessons, subscriptions, team roles, enrollment state, orders, or other domain semantics.

### Association State

The lifecycle of a Module Association:

- `PENDING`;
- `ACTIVE`;
- `INACTIVE`;
- `REVOKED`.

The Module owns why the association changed. The Character Engine owns only whether the identity link is usable.

### Aggregate Version

A monotonically increasing integer incremented for every accepted authoritative Character mutation. It is used for optimistic concurrency and downstream monotonic processing.

### Character Operation

A recorded request to mutate Character state. It contains operation identity, request hash, actor, target, status, result, timestamps, and error information.

### Accepted No-op

A valid idempotent or policy operation that changes no authoritative state but is recorded as successfully handled, such as re-suspending an already suspended Character with the same suspension case.

### Source Event

The immutable Event or authorized command that caused a Character operation.

### Actor

The authenticated principal responsible for an operation. Actor types include owner User, platform administrator, trusted service, privacy workflow, and system repair worker.

### Subject

The Character or external entity affected by an Event. In Character lifecycle Events, the subject is normally `character_id`.

### Closure Recovery Window

The configured period during which a Closed Character may be restored before anonymization eligibility.

### Legal Hold

A policy state preventing deletion or anonymization of specified records while still allowing public suppression and operational closure.

### Tombstone

The minimal non-personal record retained after anonymization to prevent identifier reuse, preserve referential integrity, and communicate terminal state to downstream consumers.

### Character Projection

A read model derived from authoritative Character state and, where explicitly defined, local projections from other Engines. A projection is never a write model.


---

## Lifecycle

### Character lifecycle state machine

```text
                      ┌───────────────┐
                      │    PENDING    │
                      └───────┬───────┘
                              │ activate
                              ▼
                      ┌───────────────┐
          reactivate  │    ACTIVE     │  suspend
        ┌─────────────┤               ├──────────────┐
        │             └───────┬───────┘              │
        │                     │ close                ▼
        │                     │              ┌───────────────┐
        │                     │              │   SUSPENDED   │
        │                     │              └───────┬───────┘
        │                     │                      │ close
        │                     ▼                      │
        │             ┌───────────────┐              │
        └─────────────┤    CLOSED     │◄─────────────┘
             restore  └───────┬───────┘
                              │ anonymize after policy checks
                              ▼
                      ┌───────────────┐
                      │  ANONYMIZED   │
                      └───────────────┘
```

### Lifecycle transition matrix

| From | Command | To | Allowed actor | Required conditions |
|---|---|---|---|---|
| none | CreateCharacter | `PENDING` or `ACTIVE` | authorized account workflow or platform service | valid owner; slot available; idempotency valid |
| `PENDING` | ActivateCharacter | `ACTIVE` | system creation workflow | required initialization complete |
| `PENDING` | CloseCharacter | `CLOSED` | system or administrator | failed or abandoned provisioning policy |
| `ACTIVE` | SuspendCharacter | `SUSPENDED` | authorized administrator or policy service | reason and case reference where required |
| `SUSPENDED` | ReactivateCharacter | `ACTIVE` | authorized administrator or policy service | suspension cleared |
| `ACTIVE` | CloseCharacter | `CLOSED` | owner, account workflow, privacy workflow, administrator | closure policy satisfied |
| `SUSPENDED` | CloseCharacter | `CLOSED` | privacy workflow or administrator | closure policy satisfied |
| `CLOSED` | RestoreCharacter | `ACTIVE` or `SUSPENDED` | owner or administrator | recovery window open; no anonymization; account eligible |
| `CLOSED` | AnonymizeCharacter | `ANONYMIZED` | privacy workflow | retention elapsed or approved erasure; no blocking legal hold |
| `ANONYMIZED` | any normal command | unchanged | none | always rejected |

The previous active restriction state MAY be retained when a suspended Character is closed. Restoration policy determines whether the Character returns to `ACTIVE` or `SUSPENDED`.

### Creation lifecycle

Character creation MUST be idempotent and must not produce partially usable identity.

The creation workflow is:

1. receive an authorized creation command;
2. validate owner User existence or trusted account Event;
3. validate account eligibility and Character slot policy;
4. normalize the requested profile draft;
5. reserve requested handle if present;
6. generate `character_id` server-side;
7. create Character state, baseline profile, privacy policy, and owner relationship;
8. record the creation operation and lifecycle transition;
9. write `character.created.v1` to the outbox;
10. commit atomically;
11. submit profile content for moderation if required;
12. publish projections after commit.

The implementation SHOULD create the Character directly as `ACTIVE` if all mandatory checks can be completed in one transaction. `PENDING` exists for workflows that require asynchronous initialization or approval.

A `PENDING` Character:

- MUST NOT appear in public or authenticated directories;
- MUST NOT be considered eligible by downstream Engines;
- MAY be visible to its owner as provisioning;
- MUST have a bounded expiration or repair workflow;
- MUST either activate, close, or be quarantined for investigation.

### Default Character policy

Platform product policy MAY automatically request a primary Character after `user.registered.v1`.

This policy MUST be externalized as configuration or account onboarding behavior. The Character Aggregate itself does not assume that every User must have a Character.

The initial product MAY enforce one non-anonymized Character in slot `primary` per User. The database and contracts MUST use `character_slot_key` so future multiple-Character support does not require identifier changes.

### Activation

Activation establishes normal eligibility.

On activation, the Engine MUST:

- set lifecycle state to `ACTIVE`;
- clear provisioning-only restrictions;
- increment aggregate version;
- append lifecycle history;
- publish `character.activated.v1` if activation is not included in `character.created.v1`;
- expose the owner projection;
- publish directory data only if profile and moderation policy permit it.

### Suspension

Suspension is temporary and reversible. It is not a privacy erasure mechanism.

A suspension command MUST include:

- a stable reason code;
- initiating actor;
- source policy, case, or incident reference where applicable;
- effective time;
- optional expiration time;
- visibility policy during suspension;
- operation idempotency key.

While suspended:

- progression eligibility MUST be false unless a future policy explicitly defines a limited exception;
- normal owner profile writes SHOULD be rejected;
- owner privacy-tightening operations MAY remain allowed;
- account data export and legal rights MUST remain available;
- public profile behavior is controlled by suspension policy and normally becomes `HIDDEN_BY_POLICY`;
- administrative correction and restoration workflows remain available to authorized principals;
- downstream Engines receive `character.suspended.v1` and apply their own local restrictions.

The Character Engine MUST NOT directly freeze Progression, Inventory, Quests, or Rewards. It publishes the lifecycle Event; each Engine owns its resulting state behavior.

### Reactivation

Reactivation removes a temporary suspension.

The Engine MUST verify:

- the current state is `SUSPENDED`;
- the actor is authorized to clear the suspension category;
- all required case or policy conditions are satisfied;
- the owner account is still eligible;
- no closure or anonymization workflow is in progress.

Reactivation restores the Character's pre-suspension owner-selected visibility unless policy changed it explicitly. It does not automatically restore rejected profile content.

### Closure

Closure makes a Character unavailable for normal use while retaining state for recovery, legal obligations, and downstream consistency.

Closure sources include:

- owner request;
- User account closure;
- administrative enforcement;
- privacy request;
- abandoned provisioning;
- platform policy.

Closing a Character MUST:

1. transition lifecycle state to `CLOSED`;
2. set effective public and directory visibility to `HIDDEN_BY_POLICY`;
3. revoke active profile sessions or cached write capabilities where applicable;
4. freeze handle reassignment until the configured reservation policy permits release;
5. deactivate Module Associations for identity resolution unless policy requires retention;
6. append lifecycle history and closure reason;
7. publish `character.closed.v1`;
8. enqueue search deindexing and cache invalidation;
9. make the Character ineligible in downstream Engine projections;
10. record restoration deadline and anonymization eligibility where applicable.

Closure MUST be idempotent. Repeating the same logical closure request returns the original operation outcome.

Closure does not erase Character history or downstream state. Other Engines determine their own retention and closure response.

### Restoration

A Closed Character MAY be restored if:

- anonymization has not started or completed;
- the recovery window remains open, or an authorized legal/support override exists;
- the owner account is active and authorized;
- no legal, security, or moderation policy blocks restoration;
- the Character ID and owner relationship remain intact;
- required downstream reconciliation can be initiated.

Restoration MUST NOT create a new Character. It reactivates the existing `character_id`.

Restoration MUST:

- increment aggregate version;
- append lifecycle history;
- publish `character.restored.v1`;
- restore owner-selected visibility subject to current policy;
- reactivate eligible Module Associations only when their owning Modules confirm them independently;
- trigger projection rebuild and cache invalidation;
- not silently reactivate rejected profile content or revoked entitlements.

### Anonymization

Anonymization is irreversible and distinct from closure.

The workflow MUST be resumable, idempotent, and externally auditable. It MUST support legal hold and failure recovery.

Before anonymization, the Engine MUST verify:

- Character state is `CLOSED`;
- required recovery period has elapsed or an approved immediate-erasure basis exists;
- no blocking legal hold applies;
- ownership and profile export obligations are satisfied or explicitly waived by policy;
- downstream privacy propagation has a durable workflow record;
- the request has required approval for privileged or exceptional cases.

Authoritative anonymization MUST:

- replace or remove direct `owner_user_id` according to retention policy;
- erase display name, biography, pronoun text, custom profile fields, and personal moderation payloads;
- remove avatar and presentation references that can identify the person;
- release or permanently reserve the handle according to safety policy;
- remove public and directory projections;
- revoke Module Associations or pseudonymize external references;
- retain `character_id`, terminal state, timestamps, non-personal reason category, and minimum integrity hashes;
- increment aggregate version;
- append an anonymization lifecycle record that contains no erased content;
- publish `character.anonymized.v1` with a minimized payload;
- enqueue downstream privacy propagation and verification.

Sensitive historical values MUST NOT remain in ordinary logs, outbox payloads, operation error text, or unrestricted audit views.

### Legal hold

A legal hold prevents deletion or anonymization of specified records but does not require public exposure.

When a hold applies:

- closure and public suppression MAY continue;
- restoration MAY be blocked;
- anonymization MUST pause before destructive steps;
- the hold reason and authority MUST be restricted to privileged audit systems;
- the owner-facing API SHOULD disclose only the legally permitted status;
- removal of the hold MUST resume the workflow idempotently.

### Account lifecycle propagation

The Engine MUST consume account lifecycle Events from the authoritative User account system.

Recommended behavior:

- `user.registered.v1`: optionally request Character creation according to onboarding policy;
- `user.suspended.v1`: suspend owned Characters according to mapped platform policy;
- `user.reactivated.v1`: evaluate Character reactivation; do not blindly reactivate Characters suspended for independent reasons;
- `user.closed.v1`: close all owned Characters through resumable batch processing;
- `user.restored.v1`: permit controlled Character restoration;
- `user.anonymization.requested.v1`: start Character privacy workflow;
- `user.merged.v1`: unsupported until an ownership migration ADR exists.

Account Events MUST use an operation key that permits safe replay across all affected Characters.

### Module Association lifecycle

Module Associations have an independent lifecycle from the Character.

```text
PENDING → ACTIVE → INACTIVE → ACTIVE
                 └──────────→ REVOKED
PENDING ────────────────────→ REVOKED
```

Rules:

- only an authorized Module producer or platform identity workflow may request association;
- the same external subject cannot map to multiple active Characters within the same association namespace unless policy explicitly permits it;
- association activation does not imply business membership, payment, enrollment, role, or entitlement;
- closing a Character makes associations unusable for normal resolution but does not necessarily erase them immediately;
- revocation is terminal for that association record; relinking creates a new association identity or an explicitly versioned reactivation according to policy;
- association payload metadata is bounded and schema-controlled.

### Profile revision lifecycle

```text
DRAFT → PENDING_REVIEW → APPROVED
   └───────────────→ REJECTED
PENDING_REVIEW ────→ REJECTED
APPROVED ──────────→ HIDDEN
HIDDEN ────────────→ APPROVED through explicit moderation action
```

A profile update may contain fields that do not require moderation and fields that do. The Engine MAY split their activation behavior, but the resulting public state MUST be explainable from immutable revisions.

The recommended model is:

- store every submitted source revision;
- keep the last approved public revision active;
- expose the pending revision only to the owner and authorized moderators;
- atomically switch the approved revision pointer after moderation approval;
- publish one profile update Event for the submission and another for activation when they differ.

### Handle lifecycle

A handle passes through:

- `RESERVED` during a bounded creation or rename transaction;
- `ACTIVE` while assigned to a visible or unlisted Character;
- `COOLDOWN` after rename, closure, or moderation release;
- `BLOCKED` for policy, trademark, impersonation, or abuse reasons;
- `RELEASED` when available for reassignment.

A closed or anonymized Character's former handle MUST NOT become immediately available if doing so enables impersonation or privacy harm.

### Presentation selection lifecycle

A Presentation Selection may be:

- `PENDING_VALIDATION`;
- `ACTIVE`;
- `INACTIVE_NOT_ENTITLED`;
- `INACTIVE_ASSET_UNAVAILABLE`;
- `REMOVED`.

Selection state reacts to local entitlement and media projection Events. Revocation MUST not delete history; it deactivates the selection and publishes an outcome Event.

---

## Aggregate

### Aggregate identity

The Character Aggregate is identified by:

```text
character_id
```

All authoritative Character mutations occur within this aggregate boundary.

Module Associations, handle records, profile revisions, and presentation selections are persisted in separate tables for indexing and history, but their authoritative mutations are coordinated by the Character Aggregate transaction.

### Aggregate root

```text
Character
├── character_id
├── owner_relationship
│   ├── owner_user_id
│   ├── slot_key
│   ├── relationship_state
│   └── created_at
├── lifecycle
│   ├── state
│   ├── state_reason_code
│   ├── state_effective_at
│   ├── suspended_until
│   ├── closed_at
│   ├── recovery_deadline
│   └── anonymized_at
├── profile
│   ├── current_source_revision_id
│   ├── current_approved_revision_id
│   ├── display_name
│   ├── biography
│   ├── avatar_asset_id
│   ├── theme_resource_id
│   ├── moderation_state
│   ├── profile_visibility
│   ├── directory_visibility
│   ├── profile_version
│   └── policy_version
├── handle_assignment
├── presentation_selections[]
├── module_associations[]
├── restrictions[]
├── aggregate_version
├── created_at
└── updated_at
```

### Aggregate invariants

The implementation MUST enforce all of the following invariants.

1. `character_id` is immutable and globally unique.
2. `character_id` is never reused.
3. A Character has exactly one current lifecycle state.
4. `ANONYMIZED` is terminal.
5. A non-anonymized Character has exactly one current owner relationship in v1.
6. Normal commands cannot change `owner_user_id`.
7. The pair `(owner_user_id, character_slot_key)` is unique for non-terminal Character relationships according to product policy.
8. Display name is not a durable identity key and need not be unique.
9. Active handles are unique within their namespace after deterministic normalization.
10. Public profile data is derived only from an approved revision and effective visibility policy.
11. Owner-submitted pending content cannot replace the public approved revision before required moderation.
12. A field-level visibility setting cannot be less restrictive than the global profile policy.
13. A `CLOSED` or `ANONYMIZED` Character cannot be directory listed.
14. A `SUSPENDED` Character cannot be publicly visible when suspension policy requires suppression.
15. A Presentation Selection cannot be `ACTIVE` without a locally valid entitlement and usable asset projection when those checks apply.
16. A Module Association cannot encode domain membership semantics in unrestricted metadata.
17. There is at most one active association for a configured uniqueness key.
18. Aggregate version increments exactly once per committed mutation that changes authoritative state.
19. Profile version increments exactly once per committed profile source or effective profile policy change.
20. Every changed aggregate version has a corresponding operation record and outbox Event set.
21. An exact duplicate operation returns the original result and does not increment versions.
22. Conflicting reuse of an idempotency key is rejected.
23. Owner privacy tightening MUST be allowed whenever legally and operationally possible, even if ordinary profile editing is locked.
24. Anonymization must not leave personal source values in active profile, handle, association, or presentation tables.
25. Downstream Engine state is never directly written inside the Character transaction.

### Aggregate commands

The aggregate supports the following canonical commands:

- `CreateCharacter`;
- `ActivateCharacter`;
- `UpdateProfile`;
- `ChangeHandle`;
- `ChangeVisibility`;
- `SelectPresentationResource`;
- `RemovePresentationResource`;
- `ApplyModerationDecision`;
- `CreateModuleAssociation`;
- `ActivateModuleAssociation`;
- `DeactivateModuleAssociation`;
- `RevokeModuleAssociation`;
- `SuspendCharacter`;
- `ReactivateCharacter`;
- `CloseCharacter`;
- `RestoreCharacter`;
- `PlaceLegalHold`;
- `RemoveLegalHold`;
- `AnonymizeCharacter`;
- `ApplyOwnerAccountState`;
- `RepairCharacterInvariant`.

Each command MUST define:

- required authorization scope;
- allowed source states;
- canonical request schema;
- idempotency semantics;
- expected version behavior;
- validation order;
- resulting state changes;
- emitted Events;
- audit requirements;
- retryability of each failure.

### Validation order

Commands MUST be evaluated in this order unless a more restrictive security control fails earlier:

1. envelope and syntax validation;
2. authentication;
3. producer or principal authorization;
4. idempotency lookup and canonical hash comparison;
5. Character existence and target validation;
6. aggregate version precondition;
7. lifecycle eligibility;
8. policy and restriction evaluation;
9. field normalization and semantic validation;
10. local projection validation;
11. uniqueness and reservation checks;
12. deterministic state transition;
13. persistence and Event generation.

This order prevents expensive work before security and idempotency checks and produces stable error behavior.

### Optimistic concurrency

Owner-facing profile writes MUST support an expected version using `If-Match`, explicit `expected_profile_version`, or both.

Administrative lifecycle commands MUST use `expected_aggregate_version` unless the operation is explicitly designed as idempotent against any current version.

On version mismatch, the Engine returns `VERSION_CONFLICT` and the current version. It MUST NOT automatically overwrite intervening profile changes.

### Partial profile updates

`UpdateProfile` uses an explicit field mask. Omitted fields remain unchanged. A client MUST NOT clear a field by omitting it.

To clear a nullable field, the field mask includes the field and the value is `null`.

Mass assignment of unknown or server-controlled fields is prohibited.

### Normalization

Normalization MUST occur before validation, request hashing, uniqueness checks, and persistence.

At minimum:

- Unicode text is normalized using a documented versioned normalization form;
- leading and trailing whitespace is removed where policy permits;
- line endings are canonicalized;
- control characters and bidi override abuse are rejected or sanitized according to field policy;
- handles are case-folded and normalized by the Handle Policy version;
- asset and resource identifiers are parsed as opaque canonical identifiers;
- locale-sensitive transformations are not used for identity uniqueness unless explicitly versioned.

The original submitted text MAY be retained in restricted moderation evidence if legally permitted, but authoritative display values use canonicalized content.

### CreateCharacter behavior

`CreateCharacter` MUST:

- reject an ineligible or nonexistent owner unless the producer is the authoritative account workflow;
- enforce slot policy;
- generate identifiers server-side;
- initialize privacy-safe defaults;
- initialize an approved fallback display name or pending profile revision according to policy;
- reserve a handle atomically when requested;
- create a lifecycle history entry;
- produce `character.created.v1`;
- optionally produce `character.profile.submitted.v1` and moderation request Events;
- never synchronously create Progression, Inventory, Quests, or other Engine state.

### UpdateProfile behavior

`UpdateProfile` MUST:

- validate owner or delegated profile-edit permission;
- reject writes when lifecycle or moderation lock prohibits them;
- allow privacy-tightening changes under a narrower policy path;
- normalize and validate each changed field;
- create an immutable Profile Revision;
- determine whether changes can be approved immediately or require review;
- retain the prior approved public revision until approval;
- increment aggregate and profile versions for accepted source changes;
- publish submission and activation Events as applicable.

### ChangeHandle behavior

`ChangeHandle` MUST:

- verify the feature is enabled for the Character context;
- normalize using the active Handle Policy version;
- reject reserved, blocked, invalid, deceptive, or conflicting handles;
- rate limit lookup and change attempts;
- reserve the new handle within the transaction;
- move the old handle to cooldown or redirect state;
- update public profile routing only after commit;
- publish `character.handle.changed.v1` with no hidden moderation evidence;
- retain immutable history.

### ChangeVisibility behavior

Visibility changes MUST take effect in authoritative state immediately after commit.

Privacy-tightening changes MUST receive higher processing priority than search indexing or ordinary projection work. Public caches and indexes MUST be invalidated or deindexed through high-priority Events.

A client cannot set `HIDDEN_BY_POLICY`. An owner request for `PUBLIC` or `AUTHENTICATED` is constrained by effective policy, moderation, minor safety, lifecycle, and legal restrictions.

### Presentation selection behavior

`SelectPresentationResource` MUST:

- validate the configured slot;
- validate resource type compatibility;
- load local entitlement and asset projection state;
- reject or mark pending when state is missing according to slot policy;
- store the selection without duplicating entitlement data;
- update effective public profile only when selection is active;
- publish a selection outcome Event.

If entitlement is later revoked, the Engine MUST deactivate the selection idempotently and fall back to the configured default without deleting history.

### Module Association behavior

`CreateModuleAssociation` MUST:

- authenticate an authorized Module producer or platform identity workflow;
- validate Module and instance registration;
- normalize the opaque external subject key without interpreting its business semantics;
- enforce configured uniqueness;
- prevent an untrusted Module from associating another Module's subjects;
- store minimal metadata;
- publish `character.module.association.created.v1`.

The command MUST NOT grant access to the Character. Authorization remains based on platform identity and Module policy.

### Suspension behavior

`SuspendCharacter` MUST be deterministic for a reason category and case reference.

A duplicate suspension with the same logical operation is an exact duplicate. A new suspension request against an already suspended Character MAY:

- extend `suspended_until` if authorized;
- add a separate restriction record;
- leave lifecycle state unchanged but increment aggregate version if policy state materially changes;
- return an accepted no-op if nothing changes.

The model SHOULD store restrictions separately so independent suspension reasons can be cleared safely.

### Closure behavior

`CloseCharacter` MUST be allowed from `ACTIVE` or `SUSPENDED`. It MUST preserve the prior restriction set and owner-selected privacy settings for possible restoration while making effective public policy hidden.

It MUST write a restoration deadline where policy permits restoration and a privacy workflow reference when closure is part of erasure.

### RestoreCharacter behavior

`RestoreCharacter` MUST re-evaluate current account, moderation, legal, safety, and privacy policy. It MUST NOT simply copy all pre-closure effective state.

The command restores the same Character ID and profile history. It may reactivate the last approved profile revision only if that revision remains policy-compliant.

### AnonymizeCharacter behavior

`AnonymizeCharacter` is a privileged workflow command rather than a single unbounded transaction.

The workflow MUST:

- acquire a workflow-level idempotency identity;
- mark destructive processing state;
- prevent concurrent restoration or profile mutation;
- execute bounded transactional stages;
- checkpoint each stage;
- write a minimized tombstone;
- publish terminal Event only after authoritative personal fields are removed;
- verify downstream propagation separately;
- support retry without restoring erased values.

### Repair behavior

Repair MUST be additive and auditable. Direct SQL edits are prohibited outside an approved disaster procedure.

A repair command MUST include:

- detected invariant violation;
- evidence reference;
- proposed repair action;
- before-state hash;
- expected aggregate version;
- approval and case reference;
- generated after-state hash;
- repair Event.

---

## State Model

### Character core state

| Field | Type | Required | Description |
|---|---|---:|---|
| `character_id` | UUID | yes | Immutable Character identifier. |
| `owner_user_id` | UUID/opaque ID | conditional | Current owner; removed or tokenized after anonymization. |
| `character_slot_key` | string | yes | Stable account slot, default `primary`. |
| `lifecycle_state` | enum | yes | Current Character lifecycle state. |
| `lifecycle_reason_code` | string | no | Current state reason category. |
| `lifecycle_effective_at` | timestamp | yes | Server time of current state. |
| `suspended_until` | timestamp | no | Optional automatic review or expiration time. |
| `closed_at` | timestamp | no | Closure time. |
| `recovery_deadline` | timestamp | no | Last ordinary restoration time. |
| `anonymization_eligible_at` | timestamp | no | Earliest policy-driven anonymization time. |
| `anonymized_at` | timestamp | no | Terminal anonymization time. |
| `legal_hold_state` | enum | yes | `NONE`, `ACTIVE`, or restricted internal state. |
| `aggregate_version` | bigint | yes | Monotonic aggregate version. |
| `created_at` | timestamp | yes | Creation time. |
| `updated_at` | timestamp | yes | Last authoritative mutation time. |

### Owner relationship state

The initial implementation MAY store the current owner directly on the Character row while maintaining immutable history in `character_owner_history`.

Owner history includes:

- relationship id;
- Character ID;
- owner User ID or protected token;
- slot key;
- relationship state;
- valid-from and valid-to timestamps;
- source operation;
- reason code;
- aggregate version.

No public Event or API may expose ownership history beyond authorized need.

### Profile source state

| Field | Type | Required | Description |
|---|---|---:|---|
| `character_id` | UUID | yes | Aggregate identity. |
| `display_name` | string | yes | Current approved display name or safe fallback. |
| `biography` | string | no | Current approved biography. |
| `pronoun_text` | string | no | Optional bounded display text where enabled. |
| `avatar_asset_id` | opaque ID | no | Current effective approved avatar. |
| `theme_resource_id` | opaque ID | no | Current effective theme selection. |
| `profile_visibility_requested` | enum | yes | Owner preference. |
| `profile_visibility_effective` | enum | yes | Policy-constrained effective value. |
| `directory_visibility_requested` | enum | yes | Owner preference. |
| `directory_visibility_effective` | enum | yes | Policy-constrained effective value. |
| `moderation_state` | enum | yes | State of current source or effective revision. |
| `current_source_revision_id` | UUID | yes | Latest submitted revision. |
| `current_approved_revision_id` | UUID | no | Revision used for public profile. |
| `profile_policy_version` | integer | yes | Policy version used for effective visibility. |
| `profile_version` | bigint | yes | Monotonic profile version. |
| `updated_at` | timestamp | yes | Last profile source/effective change. |

### Profile field limits

Initial recommended platform limits:

- display name: 1–80 Unicode scalar values after normalization;
- biography: 0–1,000 Unicode scalar values;
- pronoun display text: 0–40 Unicode scalar values;
- handle: 3–32 normalized characters;
- profile custom attributes: disabled in v1 unless schema-registered;
- field mask: maximum 20 fields;
- profile request body: maximum 16 KiB;
- moderation evidence attachment references: maximum 20 per case.

Limits are configuration with hard platform ceilings. A Business Module cannot increase them by adding arbitrary payload fields.

### Profile revision state

Each revision stores:

- revision id;
- Character ID;
- submitted normalized fields;
- submitted field mask;
- source profile version;
- moderation state;
- moderation policy version;
- automated decision references;
- human decision reference where applicable;
- rejection reason category;
- submitted by actor;
- submitted at;
- decided at;
- activated at;
- content hash.

Revisions are immutable. Corrections create a new revision.

### Handle assignment state

| Field | Description |
|---|---|
| `handle_assignment_id` | Immutable assignment record. |
| `namespace` | Uniqueness boundary. |
| `normalized_handle` | Canonical uniqueness value. |
| `display_handle` | Approved display representation. |
| `character_id` | Current or historical assignee. |
| `state` | `RESERVED`, `ACTIVE`, `COOLDOWN`, `BLOCKED`, `RELEASED`. |
| `normalization_version` | Algorithm version. |
| `reserved_until` | Reservation expiry. |
| `cooldown_until` | Earliest release time. |
| `reason_code` | Non-sensitive state reason. |
| `assigned_at` | Activation time. |
| `released_at` | Release time. |

### Restriction state

A Character may have multiple independent restrictions.

Each restriction includes:

- restriction id;
- restriction type;
- source system;
- reason code;
- case reference;
- scope, such as lifecycle, profile write, public visibility, directory, or presentation;
- effective time;
- optional expiration;
- state;
- created and cleared actor;
- audit reference.

Effective lifecycle and visibility are derived from the most restrictive active policy.

### Presentation slot definition state

Presentation Slot Definitions are configuration, not Character Aggregate source data.

A definition includes:

- slot key;
- allowed resource types;
- cardinality;
- default resource;
- entitlement requirement;
- asset requirement;
- visibility contexts;
- fallback behavior;
- activation window;
- definition version;
- publication state.

Published versions are immutable.

### Presentation selection state

| Field | Description |
|---|---|
| `selection_id` | Immutable selection identity. |
| `character_id` | Character. |
| `slot_key` | Configured slot. |
| `resource_type` | Canonical resource type. |
| `resource_id` | Opaque referenced resource. |
| `source_engine` | Entitlement authority. |
| `selection_state` | Pending, active, inactive, removed. |
| `entitlement_version` | Local eligibility evidence version. |
| `asset_version` | Local asset evidence version. |
| `selected_at` | Owner selection time. |
| `effective_at` | Activation time. |
| `removed_at` | Removal time. |
| `aggregate_version` | Version that produced this state. |

### Module Association state

| Field | Description |
|---|---|
| `association_id` | Immutable association identity. |
| `character_id` | Character identity. |
| `module_key` | Registered Module type. |
| `module_instance_id` | Registered Module deployment or tenant context. |
| `external_subject_id` | Opaque Module subject identifier. |
| `external_subject_hash` | Optional keyed hash for indexed privacy-safe lookup. |
| `association_state` | Pending, active, inactive, revoked. |
| `source_event_id` | Authoritative source Event. |
| `linked_at` | Creation or activation time. |
| `inactive_at` | Inactivation time. |
| `revoked_at` | Terminal revocation time. |
| `metadata` | Bounded schema-registered metadata only. |
| `aggregate_version` | Character version. |

### Operation state

Character operations use:

- `RECEIVED`;
- `VALIDATING`;
- `APPLIED`;
- `NO_OP`;
- `REJECTED`;
- `FAILED_RETRYABLE`;
- `QUARANTINED`.

An operation record includes canonical request hash and serialized result so an exact duplicate can receive the original response.

### Lifecycle history state

Lifecycle history is append-only and records:

- transition id;
- Character ID;
- from state;
- to state;
- reason code;
- restriction or workflow reference;
- actor type and protected actor id;
- operation id;
- aggregate version;
- occurred at;
- effective at;
- state hash.

### Derived state

The following values are derived and MUST NOT have independent authoritative writers:

- `is_progression_eligible`;
- `is_owner_editable`;
- `is_publicly_readable`;
- `is_directory_listed`;
- `is_restorable`;
- `effective_avatar_asset_id`;
- `effective_presentation_slots`;
- `effective_profile_visibility`;
- `effective_directory_visibility`.

Derived state may be materialized for performance if its source versions are retained and reconciliation is available.

### State hash

The Engine SHOULD calculate a canonical `state_hash` after each aggregate mutation. The hash excludes volatile storage fields and uses a versioned canonical serialization.

State hashes support reconciliation, audit, and tamper detection. They are not a substitute for access control or database integrity.


---

## Events

### Event design principles

1. Events describe facts or explicit requests, never hidden synchronous calls.
2. Event names use lowercase dot-separated canonical terms and a numeric schema suffix.
3. Events are immutable after publication.
4. Every Event has a globally unique UUIDv7 `eventId`.
5. Every Character Event carries `characterId` and the resulting `aggregateVersion` where applicable.
6. Profile Events carry `profileVersion` when profile state changes.
7. Events contain identifiers and bounded canonical data only. They MUST NOT include secrets, raw moderation evidence, access tokens, identity documents, or unnecessary personal data.
8. Consumers are idempotent and monotonic by Event id and aggregate version.
9. A request Event and its outcome Event are distinct contracts.
10. Rejection Events expose stable machine-readable reason codes without leaking sensitive policy internals.
11. Terminal privacy Events use minimized payloads.
12. Schema evolution is backward compatible within a version. Breaking changes require a new Event type version.

### Event envelope

All Character Engine Events use the exact camelCase canonical envelope from
`002a-platform-contract-standard`. Character mutation Events use
`characterId` as `partitionKey`, identify the Character as `subject`, include
the resulting Character Aggregate version, and preserve canonical causality,
lineage, replay, realm, and data-classification fields.

Event IDs, correlation IDs, operation IDs, and Character IDs are UUIDv7. SQL
column names remain snake_case; wire field names do not.

### Envelope requirements

| Field | Required | Rules |
|---|---:|---|
| `eventId` | yes | Globally unique UUIDv7; immutable. |
| `eventType` | yes | Registered exact type including `.vN`. |
| `schemaVersion` | yes | Positive integer matching the Event suffix. |
| `occurredAt` | yes | Authoritative domain occurrence time. |
| `recordedAt` | yes | Producer authoritative commit time. |
| `producer` | yes | Registered producer identity. |
| `subject` | yes | Canonical affected entity. |
| `actor` | conditional | Required for user/admin actions; system actor for automated workflows. |
| `correlationId` | yes | Groups a business or workflow chain. |
| `causationId` | conditional | Required when caused by another Event or command. |
| `lineage` | yes | Root Event, bounded depth, and cycle guard. |
| `replay` | yes | Explicit replay metadata. |
| `dataClassification` | yes | Registered privacy classification. |
| `partitionKey` | yes | `characterId` for Character mutations. |
| `payload` | yes | Contract-specific object. |
| `metadata` | no | Bounded, schema-restricted operational context. |

### Inbound request Events

| Event | Authorized producer | Purpose |
|---|---|---|
| `character.create.requested.v1` | account onboarding, trusted platform service | Create a Character. |
| `character.profile.update.requested.v1` | API command adapter, trusted service | Submit a profile revision. |
| `character.handle.change.requested.v1` | API command adapter | Change public handle. |
| `character.visibility.change.requested.v1` | API command adapter | Change owner privacy preferences. |
| `character.presentation.select.requested.v1` | API command adapter | Select a presentation resource. |
| `character.presentation.remove.requested.v1` | API command adapter | Remove a presentation selection. |
| `character.suspend.requested.v1` | moderation, security, policy, administration | Suspend a Character. |
| `character.reactivate.requested.v1` | moderation, security, policy, administration | Clear suspension. |
| `character.close.requested.v1` | owner API, account service, privacy workflow, administration | Close a Character. |
| `character.restore.requested.v1` | owner API, account service, administration | Restore a Closed Character. |
| `character.anonymize.requested.v1` | privacy workflow | Irreversibly anonymize a Closed Character. |
| `character.module.association.create.requested.v1` | registered Module or identity workflow | Link an external subject. |
| `character.module.association.state.requested.v1` | registered Module or identity workflow | Change association state. |
| `profile.moderation.decision.recorded.v1` | moderation service | Apply moderation outcome. |
| `media.asset.state.changed.v1` | Media Service | Update avatar or profile asset eligibility. |
| `entitlement.state.changed.v1` | owning entitlement Engine | Update presentation entitlement projection. |
| `user.lifecycle.changed.v1` | User account system | Propagate owner account lifecycle. |
| `privacy.legal.hold.changed.v1` | privacy/legal service | Place or remove a legal hold. |
| `privacy.propagation.acknowledged.v1` | registered Engine or Platform Privacy Orchestrator | Record downstream privacy-workflow completion or retryable failure. |

### Outbound domain Events

| Event | Purpose |
|---|---|
| `character.created.v1` | New Character exists and is addressable. |
| `character.creation.rejected.v1` | Creation request was permanently rejected. |
| `character.activated.v1` | Pending Character became Active. |
| `character.profile.submitted.v1` | Owner profile source revision was accepted. |
| `character.profile.updated.v1` | Effective approved profile or visibility changed. |
| `character.profile.rejected.v1` | Submitted profile revision was rejected. |
| `character.handle.changed.v1` | Effective public handle changed. |
| `character.visibility.changed.v1` | Effective disclosure or directory policy changed. |
| `character.presentation.changed.v1` | Effective presentation selection changed. |
| `character.module.association.created.v1` | Generic Module identity association exists. |
| `character.module.association.changed.v1` | Association state changed. |
| `character.suspended.v1` | Character became suspended. |
| `character.reactivated.v1` | Character became Active after suspension. |
| `character.closed.v1` | Character became Closed. |
| `character.restored.v1` | Character was restored from Closed. |
| `character.anonymization.started.v1` | Destructive privacy workflow began. |
| `character.anonymized.v1` | Character reached terminal anonymized state. |
| `character.operation.rejected.v1` | A Character mutation was rejected. |
| `character.repaired.v1` | An approved invariant repair changed state. |

### Internal operational Events

Internal Events MAY include:

- `character.projection.rebuild.requested.v1`;
- `character.search.deindex.requested.v1`;
- `character.privacy.propagation.requested.v1`;
- `character.reconciliation.issue.detected.v1`;
- `character.outbox.delivery.failed.v1`;
- `character.moderation.review.requested.v1`;
- `character.handle.reservation.expired.v1`.

Internal Events remain schema-registered and auditable. They MUST NOT become an undocumented second command API.

### Event publication ordering

Within one aggregate transaction, the Engine assigns an ordinal to each outbox Event.

Recommended ordering for profile update:

1. `character.profile.submitted.v1`;
2. `character.profile.updated.v1` if immediately approved;
3. `character.visibility.changed.v1` if effective visibility changed;
4. `character.presentation.changed.v1` if effective presentation changed.

Recommended ordering for closure:

1. `character.closed.v1`;
2. `character.visibility.changed.v1` if consumers require a distinct projection Event;
3. search deindex and privacy propagation requests.

Consumers MUST rely on `aggregate_version` and `event_ordinal`, not wall-clock timestamp, when multiple Events describe one mutation.

### Rejection behavior

Requests rejected before authoritative mutation MAY produce `character.operation.rejected.v1` when the producer has a legitimate asynchronous need for an outcome.

The Event MUST include:

- request Event id;
- operation id;
- target Character when safely known;
- stable rejection code;
- retryability;
- policy-safe message key;
- producer-visible details only.

It MUST NOT expose whether a private Character exists to an unauthorized producer.

---

## Event Contracts

### Common lifecycle payload fields

Character lifecycle outcome payloads SHOULD include:

| Field | Type | Description |
|---|---|---|
| `characterId` | UUIDv7 | Character identity. |
| `ownerUserId` | opaque ID | Included only where consumer authorization and privacy policy permit it. |
| `characterSlotKey` | string | Account Character slot. |
| `previousState` | enum/null | State before transition. |
| `state` | enum | State after transition. |
| `reasonCode` | string | Stable non-sensitive category. |
| `effectiveAt` | timestamp | Transition effective time. |
| `aggregateVersion` | integer | Resulting aggregate version. |
| `operationId` | UUIDv7 | Character operation reference. |
| `stateHash` | string | Optional canonical resulting state hash. |

### `character.create.requested.v1`

```json
{
  "eventType": "character.create.requested.v1",
  "idempotencyKey": "onboarding:user:018f...:slot:primary",
  "payload": {
    "ownerUserId": "018f2f1e-8f0a-7c91-a3d1-0242ac120003",
    "characterSlotKey": "primary",
    "requestedProfile": {
      "displayName": "A. Example",
      "biography": null,
      "avatarAssetId": null,
      "requestedHandle": null
    },
    "privacy": {
      "profileVisibility": "PRIVATE",
      "directoryVisibility": "UNLISTED"
    },
    "creationPolicyKey": "default-primary-character",
    "creationPolicyVersion": 1
  }
}
```

Validation rules:

- `ownerUserId` is required and must match producer authority;
- `characterSlotKey` is required and normalized;
- defaults are privacy restrictive;
- requested profile fields follow the same validation as profile update;
- unknown fields are rejected;
- producer must be authorized for the creation policy;
- exact duplicates return the existing Character result;
- a conflicting request for an occupied slot returns `CHARACTER_SLOT_OCCUPIED` without creating a second Character.

### `character.created.v1`

```json
{
  "eventType": "character.created.v1",
  "subject": {
    "type": "character",
    "id": "018f2f1e-8f0a-7c91-a3d1-0242ac120002"
  },
  "payload": {
    "characterId": "018f2f1e-8f0a-7c91-a3d1-0242ac120002",
    "ownerUserId": "018f2f1e-8f0a-7c91-a3d1-0242ac120003",
    "characterSlotKey": "primary",
    "currentState": "ACTIVE",
    "profileVersion": 1,
    "profileVisibilityEffective": "PRIVATE",
    "directoryVisibilityEffective": "UNLISTED",
    "createdAt": "2026-07-18T15:00:00.000Z",
    "aggregateVersion": 1,
    "operationId": "uuid"
  }
}
```

Consumer rules:

- downstream Engines create only local eligibility or reference projections;
- consumers MUST NOT eagerly create all possible Engine aggregates unless their own RFC requires it;
- owner identity fields may be removed from broad Event topics through audience-specific Event variants or field-level access controls;
- duplicate or stale Event delivery has no additional effect.

### `character.activated.v1`

Published only when a previously Pending Character becomes Active. Creation
that starts directly in Active state publishes `character.created.v1` with
`state=ACTIVE` and does not also publish an activation Event.

```json
{
  "characterId": "018f2f1e-8f0a-7c91-a3d1-0242ac120002",
  "previousState": "PENDING",
  "state": "ACTIVE",
  "effectiveAt": "2026-07-18T15:01:00.000Z",
  "aggregateVersion": 2,
  "operationId": "018f2f1e-8f0a-7c91-a3d1-0242ac120050"
}
```

Consumers apply this lifecycle fact only when `aggregateVersion` is greater
than their current Character lifecycle projection version.

### `character.profile.update.requested.v1`

```json
{
  "eventType": "character.profile.update.requested.v1",
  "idempotencyKey": "profile-update:client-generated-key",
  "payload": {
    "characterId": "018f2f1e-8f0a-7c91-a3d1-0242ac120002",
    "expectedProfileVersion": 7,
    "fieldMask": [
      "display_name",
      "biography",
      "avatar_asset_id"
    ],
    "values": {
      "displayName": "Example Name",
      "biography": "Learning, training, and building a long-term journey.",
      "avatarAssetId": "uuid"
    },
    "clientContext": {
      "locale": "en-GB"
    }
  }
}
```

Rules:

- owner identity comes from authenticated context, not payload trust;
- `expectedProfileVersion` is required for owner writes;
- fields absent from `fieldMask` are ignored and MUST NOT be cleared;
- unknown field-mask entries are rejected;
- values are normalized before request hashing;
- public activation depends on moderation and media state;
- client context is bounded and not authoritative.

### `character.profile.submitted.v1`

```json
{
  "eventType": "character.profile.submitted.v1",
  "payload": {
    "characterId": "018f2f1e-8f0a-7c91-a3d1-0242ac120002",
    "revisionId": "uuid",
    "changedFields": ["display_name", "biography", "avatar_asset_id"],
    "moderationState": "PENDING_REVIEW",
    "effectiveProfileChanged": false,
    "profileVersion": 8,
    "aggregateVersion": 12,
    "operationId": "uuid",
    "submittedAt": "2026-07-18T15:05:00.000Z"
  }
}
```

This Event MUST NOT contain biography text or other mutable profile content unless a dedicated protected topic is explicitly required. Consumers that need public data use the privacy-filtered profile projection.

### `profile.moderation.decision.recorded.v1`

```json
{
  "eventType": "profile.moderation.decision.recorded.v1",
  "payload": {
    "characterId": "018f2f1e-8f0a-7c91-a3d1-0242ac120002",
    "revisionId": "uuid",
    "decision": "APPROVE",
    "policyKey": "global-profile-content",
    "policyVersion": 14,
    "decisionReference": "moderation-case-opaque-id",
    "decidedAt": "2026-07-18T15:05:03.000Z"
  }
}
```

Rules:

- producer must be the registered moderation authority;
- the decision is idempotent by decision Event id and revision id;
- conflicting decisions for the same moderation stage are quarantined;
- late approval of a superseded revision does not automatically replace a newer approved revision unless policy explicitly permits it;
- sensitive evidence remains in the moderation system.

### `character.profile.updated.v1`

```json
{
  "eventType": "character.profile.updated.v1",
  "payload": {
    "characterId": "018f2f1e-8f0a-7c91-a3d1-0242ac120002",
    "revisionId": "uuid",
    "changedFields": ["display_name", "biography", "avatar_asset_id"],
    "profileVersion": 8,
    "aggregateVersion": 13,
    "profileVisibilityEffective": "AUTHENTICATED",
    "directoryVisibilityEffective": "UNLISTED",
    "moderationState": "APPROVED",
    "effectiveAt": "2026-07-18T15:05:03.000Z",
    "operationId": "uuid"
  }
}
```

This Event describes that effective profile state changed. It SHOULD contain change metadata rather than full profile content. Projection consumers retrieve or receive a dedicated privacy-filtered snapshot contract.

### `character.handle.change.requested.v1`

```json
{
  "eventType": "character.handle.change.requested.v1",
  "idempotencyKey": "handle-change:client-generated-key",
  "payload": {
    "characterId": "018f2f1e-8f0a-7c91-a3d1-0242ac120002",
    "requestedHandle": "example-name",
    "expectedAggregateVersion": 13,
    "handlePolicyVersion": 4
  }
}
```

The caller MAY omit `handlePolicyVersion`; the Engine then resolves the active version. The resolved version is stored in the operation and outcome Event.

### `character.handle.changed.v1`

```json
{
  "eventType": "character.handle.changed.v1",
  "payload": {
    "characterId": "018f2f1e-8f0a-7c91-a3d1-0242ac120002",
    "namespace": "global",
    "previousHandle": "old-handle",
    "currentHandle": "example-name",
    "normalizationVersion": 4,
    "profileVersion": 9,
    "aggregateVersion": 14,
    "effectiveAt": "2026-07-18T15:06:00.000Z",
    "operationId": "uuid"
  }
}
```

For privacy-sensitive closure or anonymization, public Events SHOULD omit the previous handle. Historical values remain in restricted audit storage.

### `character.visibility.change.requested.v1`

```json
{
  "eventType": "character.visibility.change.requested.v1",
  "payload": {
    "characterId": "018f2f1e-8f0a-7c91-a3d1-0242ac120002",
    "expectedProfileVersion": 9,
    "profileVisibilityRequested": "PRIVATE",
    "directoryVisibilityRequested": "UNLISTED",
    "fieldVisibility": {
      "biography": "PRIVATE"
    }
  }
}
```

### `character.visibility.changed.v1`

```json
{
  "eventType": "character.visibility.changed.v1",
  "payload": {
    "characterId": "018f2f1e-8f0a-7c91-a3d1-0242ac120002",
    "profileVisibilityRequested": "PRIVATE",
    "profileVisibilityEffective": "PRIVATE",
    "directoryVisibilityRequested": "UNLISTED",
    "directoryVisibilityEffective": "UNLISTED",
    "changedFields": ["profile_visibility", "directory_visibility", "biography.visibility"],
    "profilePolicyVersion": 8,
    "profileVersion": 10,
    "aggregateVersion": 15,
    "effectiveAt": "2026-07-18T15:07:00.000Z"
  }
}
```

Privacy-tightening Events SHOULD be published on a high-priority topic or priority class.

### `character.presentation.select.requested.v1`

```json
{
  "eventType": "character.presentation.select.requested.v1",
  "payload": {
    "characterId": "018f2f1e-8f0a-7c91-a3d1-0242ac120002",
    "slotKey": "title",
    "resourceType": "title",
    "resourceId": "uuid",
    "expectedProfileVersion": 10
  }
}
```

### `character.presentation.changed.v1`

```json
{
  "eventType": "character.presentation.changed.v1",
  "payload": {
    "characterId": "018f2f1e-8f0a-7c91-a3d1-0242ac120002",
    "slotKey": "title",
    "previousResource": null,
    "currentResource": {
      "resourceType": "title",
      "resourceId": "uuid",
      "sourceEngine": "achievement-engine"
    },
    "selectionState": "ACTIVE",
    "reasonCode": "OWNER_SELECTED",
    "profileVersion": 11,
    "aggregateVersion": 16,
    "effectiveAt": "2026-07-18T15:08:00.000Z"
  }
}
```

If entitlement is revoked, `reasonCode` may be `ENTITLEMENT_REVOKED` and `currentResource` may contain the fallback resource or `null`.

### `character.module.association.create.requested.v1`

```json
{
  "eventType": "character.module.association.create.requested.v1",
  "idempotencyKey": "school-eu:student:opaque-123:character-link",
  "payload": {
    "characterId": "018f2f1e-8f0a-7c91-a3d1-0242ac120002",
    "moduleKey": "school",
    "moduleInstanceId": "school-eu-production",
    "externalSubjectId": "opaque-student-subject-123",
    "requestedState": "ACTIVE",
    "associationSchemaVersion": 1,
    "metadata": {
      "identitySource": "verified-owner-link"
    }
  }
}
```

The example `moduleKey` is descriptive only. Core behavior is identical for all registered Modules.

### `character.module.association.created.v1`

```json
{
  "eventType": "character.module.association.created.v1",
  "payload": {
    "associationId": "uuid",
    "characterId": "018f2f1e-8f0a-7c91-a3d1-0242ac120002",
    "moduleKey": "school",
    "moduleInstanceId": "school-eu-production",
    "associationState": "ACTIVE",
    "linkedAt": "2026-07-18T15:09:00.000Z",
    "aggregateVersion": 17,
    "operationId": "uuid"
  }
}
```

The outbound Event SHOULD omit `externalSubjectId` from broad topics. The owning Module can correlate through request identifiers or a protected audience-specific Event.

### `character.suspend.requested.v1`

```json
{
  "eventType": "character.suspend.requested.v1",
  "payload": {
    "characterId": "018f2f1e-8f0a-7c91-a3d1-0242ac120002",
    "reasonCode": "PROFILE_POLICY_VIOLATION",
    "restrictionScope": ["LIFECYCLE", "PUBLIC_PROFILE", "DIRECTORY"],
    "caseReference": "case-opaque-id",
    "effectiveAt": "2026-07-18T15:10:00.000Z",
    "suspendedUntil": null,
    "expectedAggregateVersion": 17
  }
}
```

### `character.suspended.v1`

```json
{
  "eventType": "character.suspended.v1",
  "payload": {
    "characterId": "018f2f1e-8f0a-7c91-a3d1-0242ac120002",
    "previousState": "ACTIVE",
    "currentState": "SUSPENDED",
    "reasonCode": "PROFILE_POLICY_VIOLATION",
    "effectiveAt": "2026-07-18T15:10:00.000Z",
    "suspendedUntil": null,
    "progressionEligible": false,
    "publicProfileVisible": false,
    "directoryListed": false,
    "aggregateVersion": 18,
    "operationId": "uuid"
  }
}
```

Consumer rules:

- `progressionEligible` is a convenience derived flag, not permission for consumers to ignore their own policies;
- consumers update local eligibility monotonically by aggregate version;
- a stale `character.reactivated.v1` MUST NOT override a newer suspension.

### `character.reactivated.v1`

```json
{
  "eventType": "character.reactivated.v1",
  "payload": {
    "characterId": "018f2f1e-8f0a-7c91-a3d1-0242ac120002",
    "previousState": "SUSPENDED",
    "currentState": "ACTIVE",
    "reasonCode": "RESTRICTION_CLEARED",
    "effectiveAt": "2026-07-19T10:00:00.000Z",
    "profileVisibilityEffective": "AUTHENTICATED",
    "directoryVisibilityEffective": "UNLISTED",
    "aggregateVersion": 19,
    "operationId": "uuid"
  }
}
```

### `character.close.requested.v1`

```json
{
  "eventType": "character.close.requested.v1",
  "payload": {
    "characterId": "018f2f1e-8f0a-7c91-a3d1-0242ac120002",
    "reasonCode": "OWNER_REQUESTED",
    "privacyWorkflowId": "uuid",
    "expectedAggregateVersion": 19,
    "requestedAt": "2026-07-20T10:00:00.000Z"
  }
}
```

### `character.closed.v1`

```json
{
  "eventType": "character.closed.v1",
  "payload": {
    "characterId": "018f2f1e-8f0a-7c91-a3d1-0242ac120002",
    "previousState": "ACTIVE",
    "currentState": "CLOSED",
    "reasonCode": "OWNER_REQUESTED",
    "closedAt": "2026-07-20T10:00:00.000Z",
    "recoveryDeadline": "2026-08-19T10:00:00.000Z",
    "anonymizationEligibleAt": "2026-08-19T10:00:00.000Z",
    "aggregateVersion": 20,
    "operationId": "uuid"
  }
}
```

The Event MUST NOT state that downstream Engine data was deleted. It only communicates Character lifecycle.

### `character.restore.requested.v1`

```json
{
  "eventType": "character.restore.requested.v1",
  "payload": {
    "characterId": "018f2f1e-8f0a-7c91-a3d1-0242ac120002",
    "expectedAggregateVersion": 20,
    "reasonCode": "OWNER_RECOVERY",
    "requestedAt": "2026-07-25T10:00:00.000Z"
  }
}
```

### `character.restored.v1`

```json
{
  "eventType": "character.restored.v1",
  "payload": {
    "characterId": "018f2f1e-8f0a-7c91-a3d1-0242ac120002",
    "previousState": "CLOSED",
    "currentState": "ACTIVE",
    "reasonCode": "OWNER_RECOVERY",
    "restoredAt": "2026-07-25T10:00:00.000Z",
    "profileVisibilityEffective": "PRIVATE",
    "directoryVisibilityEffective": "UNLISTED",
    "aggregateVersion": 21,
    "operationId": "uuid"
  }
}
```

A privacy-safe restoration MAY default to stricter visibility than the pre-closure value until the owner confirms settings.

### `character.anonymize.requested.v1`

```json
{
  "eventType": "character.anonymize.requested.v1",
  "payload": {
    "characterId": "018f2f1e-8f0a-7c91-a3d1-0242ac120002",
    "privacyWorkflowId": "uuid",
    "legalBasisCode": "ERASURE_REQUEST",
    "requestedAt": "2026-08-20T10:00:00.000Z",
    "expectedAggregateVersion": 20
  }
}
```

This Event belongs on a restricted privacy topic. `legalBasisCode` is a category, not free-form legal detail.

### `character.anonymization.started.v1`

```json
{
  "eventType": "character.anonymization.started.v1",
  "payload": {
    "characterId": "018f2f1e-8f0a-7c91-a3d1-0242ac120002",
    "privacyWorkflowId": "uuid",
    "startedAt": "2026-08-20T10:00:01.000Z",
    "aggregateVersion": 21
  }
}
```

### `character.anonymized.v1`

```json
{
  "eventType": "character.anonymized.v1",
  "payload": {
    "characterId": "018f2f1e-8f0a-7c91-a3d1-0242ac120002",
    "previousState": "CLOSED",
    "currentState": "ANONYMIZED",
    "anonymizedAt": "2026-08-20T10:00:05.000Z",
    "privacyWorkflowId": "uuid",
    "aggregateVersion": 22,
    "operationId": "uuid"
  }
}
```

The payload MUST NOT include owner identity, prior handle, display name, biography, asset ids, Module external subject ids, or sensitive reason detail.

### `entitlement.state.changed.v1`

The Character Engine consumes a canonical entitlement projection Event:

```json
{
  "eventType": "entitlement.state.changed.v1",
  "payload": {
    "characterId": "018f2f1e-8f0a-7c91-a3d1-0242ac120002",
    "resourceType": "title",
    "resourceId": "uuid",
    "sourceEngine": "achievement-engine",
    "state": "GRANTED",
    "sourceVersion": 44,
    "effectiveAt": "2026-07-18T15:08:00.000Z"
  }
}
```

Only registered source Engines may author entitlement state for their resource types. Consumers use `(source_engine, character_id, resource_type, resource_id, source_version)` for monotonic application.

### `media.asset.state.changed.v1`

```json
{
  "eventType": "media.asset.state.changed.v1",
  "payload": {
    "assetId": "uuid",
    "ownerSubject": {
      "type": "character",
      "id": "018f2f1e-8f0a-7c91-a3d1-0242ac120002"
    },
    "assetPurpose": "profile_avatar",
    "state": "APPROVED",
    "assetVersion": 3,
    "effectiveAt": "2026-07-18T15:05:02.000Z"
  }
}
```

The Character Engine validates ownership subject and purpose before activating the asset reference.

### `character.operation.rejected.v1`

```json
{
  "eventType": "character.operation.rejected.v1",
  "payload": {
    "operationId": "uuid",
    "requestEventId": "uuid",
    "characterId": "018f2f1e-8f0a-7c91-a3d1-0242ac120002",
    "operationType": "UPDATE_PROFILE",
    "rejectionCode": "VERSION_CONFLICT",
    "retryable": true,
    "messageKey": "character.error.version_conflict",
    "rejectedAt": "2026-07-18T15:05:00.000Z"
  }
}
```

For unauthorized or privacy-sensitive lookup attempts, `characterId` MAY be omitted and the response normalized to prevent enumeration.

### Compatibility rules

- Producers MUST NOT remove or change the meaning of existing fields within a schema version.
- Optional fields may be added when consumers ignore unknown fields.
- Enum additions require consumer compatibility review; consumers MUST handle unknown values safely.
- Breaking payload changes require a new Event type version.
- Event aliases are prohibited in new contracts.
- Deprecated Event versions require a published migration window, consumer inventory, and retirement plan.
- Public and protected Event audiences MAY use separate contracts when privacy needs differ. They MUST represent the same authoritative transition and share correlation identifiers.


---

## Read Models

Read models are projections optimized for specific audiences. They MUST NOT be used as authoritative write models.

Every projection includes a source `aggregate_version`, relevant `profile_version`, and projection update time. Projection consumers MUST apply Events idempotently and monotonically.

### Owner Character Detail

Purpose: provide the authenticated owner with complete non-restricted Character state required for profile management.

Example:

```json
{
  "character_id": "018f2f1e-8f0a-7c91-a3d1-0242ac120002",
  "character_slot_key": "primary",
  "lifecycle": {
    "state": "ACTIVE",
    "effective_at": "2026-07-18T15:00:00.000Z",
    "restorable": false,
    "owner_editable": true
  },
  "profile": {
    "display_name": "Example Name",
    "biography": "Learning, training, and building a long-term journey.",
    "avatar": {
      "asset_id": "uuid",
      "delivery_variant": "profile-256",
      "state": "APPROVED"
    },
    "handle": "example-name",
    "profile_visibility_requested": "AUTHENTICATED",
    "profile_visibility_effective": "AUTHENTICATED",
    "directory_visibility_requested": "UNLISTED",
    "directory_visibility_effective": "UNLISTED",
    "moderation_state": "APPROVED",
    "profile_version": 11
  },
  "presentation": {
    "title": {
      "resource_type": "title",
      "resource_id": "uuid",
      "state": "ACTIVE"
    }
  },
  "pending_revision": null,
  "module_associations": [
    {
      "association_id": "uuid",
      "module_key": "school",
      "module_instance_id": "school-eu-production",
      "state": "ACTIVE"
    }
  ],
  "aggregate_version": 16,
  "updated_at": "2026-07-18T15:08:00.000Z"
}
```

Owner detail rules:

- ownership MUST be derived from authenticated identity;
- moderation evidence and internal case references are excluded;
- effective and requested visibility are both shown when they differ;
- pending revisions are shown with policy-safe status and rejected field categories;
- external Module subject identifiers are shown only when needed and authorized;
- referenced external Engine state is clearly marked as projected and may include freshness metadata.

### Public Character Profile

Purpose: render a privacy-filtered public or authenticated Character profile.

The projection contains only fields allowed by current effective policy.

```json
{
  "character_id": "018f2f1e-8f0a-7c91-a3d1-0242ac120002",
  "handle": "example-name",
  "display_name": "Example Name",
  "biography": "Learning, training, and building a long-term journey.",
  "avatar": {
    "asset_id": "uuid",
    "delivery_variant": "profile-256"
  },
  "presentation": {
    "title": {
      "resource_type": "title",
      "resource_id": "uuid"
    }
  },
  "profile_visibility": "PUBLIC",
  "profile_version": 11,
  "projection_updated_at": "2026-07-18T15:08:01.000Z"
}
```

Public profile rules:

- no owner User ID;
- no lifecycle reason;
- no exact suspension, closure, or moderation detail;
- no Module external subject identifiers;
- no pending or rejected content;
- no email, phone, date of birth, legal name, account identifiers, IP address, or device data;
- no full entitlement inventory;
- no fields hidden by field-level policy;
- response for private, hidden, closed, anonymized, or nonexistent Character follows anti-enumeration policy.

### Character Card

Purpose: compact rendering in lists, activity feeds, leaderboards, quest views, and Module surfaces.

Fields:

- `character_id`;
- display name or safe fallback;
- small avatar reference;
- active title or primary badge reference;
- handle where visible;
- minimal lifecycle availability indicator only when authorized;
- profile version;
- projection freshness.

A Character Card MUST NOT include biography or owner identity.

### Internal Character Summary

Purpose: allow trusted platform services to maintain eligibility and routing projections.

Fields MAY include:

- Character ID;
- lifecycle state;
- lifecycle effective time;
- aggregate version;
- owner User ID where service scope permits;
- slot key;
- progression eligibility;
- profile visibility effective;
- directory visibility effective;
- anonymized terminal flag;
- current region or residency routing key if approved;
- policy version.

The summary MUST exclude profile free text unless the consuming service has an explicit need.

### Character Eligibility Projection

Purpose: local projection in other Engines.

Minimum contract:

```json
{
  "character_id": "018f2f1e-8f0a-7c91-a3d1-0242ac120002",
  "lifecycle_state": "ACTIVE",
  "eligible": true,
  "aggregate_version": 16,
  "effective_at": "2026-07-18T15:08:00.000Z",
  "source_event_id": "uuid"
}
```

This projection is maintained by consumers, not served as a synchronous dependency on every operation.

### Character Directory Document

Purpose: search and discovery.

Allowed fields:

- Character ID;
- normalized handle search tokens;
- approved display name search tokens;
- approved avatar thumbnail reference;
- permitted presentation references;
- locale or language only when explicitly disclosed or operationally required;
- profile version;
- directory policy version;
- index version.

Directory documents MUST NOT contain biography by default. Biography search requires an explicit privacy and abuse review.

Directory indexing rules:

- only `ACTIVE` Characters with effective `LISTED` directory visibility;
- only approved content;
- delete on privacy tightening, suspension suppression, closure, or anonymization;
- monotonic update by profile and aggregate version;
- periodic authoritative reconciliation;
- bounded search tokenization and anti-homograph handling.

### Handle Resolution Projection

Purpose: resolve a public handle to Character ID.

Fields:

- namespace;
- normalized handle;
- Character ID;
- assignment state;
- redirect target where policy permits;
- profile visibility eligibility;
- handle policy version;
- cache expiry.

A handle resolution endpoint MUST apply current lifecycle and visibility policy before returning a public Character.

### Module Association Resolution

Purpose: allow an authorized registered Module to resolve its own external subject to Character ID.

Fields:

- association id;
- Module key and instance;
- external subject key or keyed hash;
- Character ID;
- association state;
- Character lifecycle eligibility;
- association version;
- aggregate version.

A Module may query only its authorized namespace. Cross-Module lookup is prohibited.

### Presentation Profile Projection

Purpose: provide clients with effective profile presentation after entitlement and asset validation.

Fields:

- Character ID;
- slot definitions used;
- effective selected resource for each slot;
- fallback reason where owner-visible;
- profile version;
- source entitlement versions;
- source asset versions.

Public clients receive only active effective resources. Owners may see pending or inactive selections.

### Profile Revision History

Purpose: owner support and moderation review.

Owner view includes:

- revision id;
- submitted time;
- changed field names;
- status;
- activation time;
- policy-safe rejection category;
- profile version.

Moderation view MAY include normalized submitted content and protected decision references under strict authorization.

### Lifecycle History

Purpose: administration, support, privacy, and security operations.

Fields:

- transition id;
- from and to state;
- reason category;
- actor type;
- effective time;
- operation id;
- aggregate version;
- restriction summary;
- audit link.

Owner-facing history SHOULD use product language and omit sensitive enforcement detail.

### Operation Inspector

Purpose: diagnose one mutation.

Fields:

- operation id and type;
- source Event or request id;
- idempotency key hash;
- canonical request hash;
- actor and authorization summary;
- status;
- retryability;
- prior and resulting aggregate versions;
- result code;
- outbox Event ids and delivery status;
- trace and correlation ids;
- timestamps.

Raw secrets and erased content are never displayed.

### Privacy Workflow View

Purpose: track closure, export, anonymization, legal hold, and downstream propagation.

Fields:

- workflow id;
- Character ID;
- workflow type;
- state;
- legal hold status;
- recovery deadline;
- current stage;
- checkpoint;
- downstream consumer acknowledgements;
- retry counts;
- blocked reason category;
- timestamps;
- approval references.

### Reconciliation View

Purpose: expose detected integrity and projection issues.

Fields:

- issue id;
- Character ID or index key;
- issue type;
- severity;
- detected state and expected state hashes;
- first and last seen;
- automatic repair eligibility;
- repair operation;
- resolution status.

### Projection rebuild

Every read projection MUST support deterministic rebuild from authoritative state and immutable history or source Events.

Rebuild requirements:

- idempotent by projection key and source version;
- resumable with checkpoints;
- isolated from live mutation capacity;
- capable of targeted rebuild by Character;
- privacy aware;
- no resurrection of deleted or anonymized content from stale Events;
- current authoritative terminal state takes precedence during replay;
- verification compares projection source versions and content hashes.

---

## Write Models

Write models are command contracts. They are not database entities and MUST NOT be accepted as unrestricted JSON blobs.

### Common command fields

All commands include:

- `operation_id` generated or accepted by the Engine;
- `idempotency_key` scoped to producer or principal;
- `character_id` except creation;
- `actor_context` from verified authentication, not untrusted body data;
- `expected_aggregate_version` or `expected_profile_version` where applicable;
- `reason_code` for lifecycle and privileged operations;
- `correlation_id`;
- `causation_id` when caused by another operation;
- bounded request metadata;
- request received time.

### CreateCharacterCommand

```text
owner_user_id
character_slot_key
requested_profile
requested_privacy
creation_policy_key
creation_policy_version
source_event_id
idempotency_key
```

Output:

```text
character_id
lifecycle_state
profile_version
aggregate_version
moderation_state
created_at
outcome_code
```

### UpdateProfileCommand

```text
character_id
expected_profile_version
field_mask[]
display_name?
biography?
pronoun_text?
avatar_asset_id?
theme_resource_id?
profile_visibility_requested?
directory_visibility_requested?
field_visibility?
idempotency_key
```

Output:

```text
revision_id
submission_state
effective_profile_changed
profile_version
aggregate_version
pending_fields[]
rejected_fields[]
outcome_code
```

### ChangeHandleCommand

```text
character_id
requested_handle
namespace
expected_aggregate_version
handle_policy_version?
idempotency_key
```

Output:

```text
normalized_handle
display_handle
previous_handle?
reservation_state
handle_policy_version
profile_version
aggregate_version
outcome_code
```

### ChangeVisibilityCommand

```text
character_id
expected_profile_version
profile_visibility_requested?
directory_visibility_requested?
field_visibility_changes?
idempotency_key
```

The command MUST distinguish absent field, explicit reset to default, and explicit visibility value.

### SelectPresentationResourceCommand

```text
character_id
slot_key
resource_type
resource_id
expected_profile_version
idempotency_key
```

Output includes selection state, validation source versions, effective resource, profile version, and aggregate version.

### RemovePresentationResourceCommand

```text
character_id
slot_key
expected_profile_version
idempotency_key
```

Removal is idempotent. If the slot is already empty, the result is `NO_OP` unless policy state changes.

### CreateModuleAssociationCommand

```text
character_id
module_key
module_instance_id
external_subject_id
requested_state
association_schema_version
metadata
source_event_id
idempotency_key
```

The external subject identifier MUST be treated as opaque. Metadata must validate against the registered association schema for that Module.

### ChangeModuleAssociationStateCommand

```text
association_id
character_id
requested_state
reason_code
source_event_id
expected_aggregate_version?
idempotency_key
```

### SuspendCharacterCommand

```text
character_id
reason_code
restriction_scope[]
case_reference
suspended_until?
visibility_policy
expected_aggregate_version
idempotency_key
```

### ReactivateCharacterCommand

```text
character_id
restriction_ids_to_clear[]
reason_code
case_reference
expected_aggregate_version
idempotency_key
```

A reactivation command MUST identify which independent restrictions it clears. The Character becomes Active only if no lifecycle-blocking restriction remains.

### CloseCharacterCommand

```text
character_id
reason_code
privacy_workflow_id?
recovery_policy_key
expected_aggregate_version
idempotency_key
```

### RestoreCharacterCommand

```text
character_id
reason_code
expected_aggregate_version
visibility_confirmation?
idempotency_key
```

### AnonymizeCharacterCommand

```text
character_id
privacy_workflow_id
legal_basis_code
retention_policy_version
expected_aggregate_version
approval_reference
idempotency_key
```

The command initiates or advances a resumable workflow; it does not accept arbitrary fields to erase.

### ApplyModerationDecisionCommand

```text
character_id
revision_id
decision
policy_key
policy_version
decision_reference
decision_event_id
```

### ApplyEntitlementProjectionCommand

```text
character_id
resource_type
resource_id
source_engine
state
source_version
effective_at
source_event_id
```

### ApplyMediaProjectionCommand

```text
asset_id
owner_subject
asset_purpose
state
asset_version
effective_at
source_event_id
```

### RepairCharacterInvariantCommand

```text
character_id
issue_id
repair_type
expected_aggregate_version
before_state_hash
approved_action
case_reference
idempotency_key
```

### CharacterMutationResult

All mutation paths return or persist a canonical result:

```json
{
  "operation_id": "uuid",
  "status": "APPLIED",
  "outcome_code": "PROFILE_REVISION_ACCEPTED",
  "character_id": "018f2f1e-8f0a-7c91-a3d1-0242ac120002",
  "aggregate_version": 16,
  "profile_version": 11,
  "result": {},
  "outbox_event_ids": ["uuid"],
  "processed_at": "2026-07-18T15:08:00.000Z"
}
```

### Canonical serialization

Idempotency request hashes MUST be based on canonical normalized command content.

Canonical serialization rules:

- stable field ordering;
- normalized Unicode;
- normalized timestamps in UTC;
- explicit distinction between absent and null;
- sorted sets where order is not semantic;
- preserved order where order is semantic;
- no volatile transport headers;
- no untrusted whitespace differences;
- versioned serialization algorithm;
- cryptographic hash using an approved algorithm.

---

## Database Schema

The following PostgreSQL schema is a normative reference model. Implementations MAY rename physical objects but MUST preserve constraints and semantics.

### General storage rules

- authoritative tables use UTC `TIMESTAMPTZ`;
- identifiers use `UUID` unless a registered opaque string type is required;
- enumerations SHOULD use constrained text or lookup tables to permit controlled evolution;
- JSONB is allowed only for bounded schema-validated data;
- personal profile source data is encrypted at rest;
- append-only history cannot be updated by ordinary application roles;
- all mutable rows include version and update time;
- all list access uses indexed cursor pagination;
- foreign keys are used within the Character database where operationally safe;
- cross-service foreign keys are prohibited;
- state and outbox are committed in one database transaction.

### Entity relationship overview

```text
character
  ├── character_owner_history
  ├── character_profile
  │     ├── character_profile_revision
  │     └── character_field_visibility
  ├── character_handle_assignment
  ├── character_restriction
  ├── character_presentation_selection
  ├── character_module_association
  ├── character_lifecycle_transition
  ├── character_operation
  ├── character_privacy_workflow
  └── character_outbox_event

local projections
  ├── character_entitlement_projection
  ├── character_media_projection
  ├── character_account_projection
  └── character_inbox_event
```

### `character`

```sql
CREATE TABLE character (
    character_id                   UUID PRIMARY KEY,
    owner_user_id                  UUID NULL,
    owner_token                    BYTEA NULL,
    character_slot_key             VARCHAR(64) NOT NULL,
    lifecycle_state                VARCHAR(32) NOT NULL,
    lifecycle_reason_code          VARCHAR(128) NULL,
    lifecycle_effective_at         TIMESTAMPTZ NOT NULL,
    suspended_until                TIMESTAMPTZ NULL,
    closed_at                      TIMESTAMPTZ NULL,
    recovery_deadline              TIMESTAMPTZ NULL,
    anonymization_eligible_at      TIMESTAMPTZ NULL,
    anonymization_started_at       TIMESTAMPTZ NULL,
    anonymized_at                  TIMESTAMPTZ NULL,
    legal_hold_state               VARCHAR(32) NOT NULL DEFAULT 'NONE',
    aggregate_version              BIGINT NOT NULL,
    state_hash                     BYTEA NOT NULL,
    created_at                     TIMESTAMPTZ NOT NULL,
    updated_at                     TIMESTAMPTZ NOT NULL,
    CONSTRAINT ck_character_lifecycle_state CHECK (
        lifecycle_state IN ('PENDING', 'ACTIVE', 'SUSPENDED', 'CLOSED', 'ANONYMIZED')
    ),
    CONSTRAINT ck_character_aggregate_version CHECK (aggregate_version > 0),
    CONSTRAINT ck_character_owner_presence CHECK (
        (lifecycle_state <> 'ANONYMIZED' AND owner_user_id IS NOT NULL)
        OR lifecycle_state = 'ANONYMIZED'
    ),
    CONSTRAINT ck_character_anonymized_time CHECK (
        (lifecycle_state = 'ANONYMIZED' AND anonymized_at IS NOT NULL)
        OR lifecycle_state <> 'ANONYMIZED'
    )
);

CREATE UNIQUE INDEX uq_character_owner_slot_active
    ON character(owner_user_id, character_slot_key)
    WHERE owner_user_id IS NOT NULL
      AND lifecycle_state <> 'ANONYMIZED';

CREATE INDEX ix_character_lifecycle_updated
    ON character(lifecycle_state, updated_at, character_id);

CREATE INDEX ix_character_recovery_deadline
    ON character(recovery_deadline, character_id)
    WHERE lifecycle_state = 'CLOSED' AND recovery_deadline IS NOT NULL;

CREATE INDEX ix_character_anonymization_eligible
    ON character(anonymization_eligible_at, character_id)
    WHERE lifecycle_state = 'CLOSED' AND anonymization_eligible_at IS NOT NULL;
```

`owner_token` is optional protected pseudonymous linkage used after anonymization or in privacy-restricted deployments. It MUST NOT be reversible by ordinary application roles.

### `character_owner_history`

```sql
CREATE TABLE character_owner_history (
    owner_history_id               UUID PRIMARY KEY,
    character_id                   UUID NOT NULL REFERENCES character(character_id),
    owner_user_id                  UUID NULL,
    owner_token                    BYTEA NULL,
    character_slot_key             VARCHAR(64) NOT NULL,
    relationship_state             VARCHAR(32) NOT NULL,
    valid_from                     TIMESTAMPTZ NOT NULL,
    valid_to                       TIMESTAMPTZ NULL,
    source_operation_id            UUID NOT NULL,
    reason_code                    VARCHAR(128) NOT NULL,
    aggregate_version              BIGINT NOT NULL,
    created_at                     TIMESTAMPTZ NOT NULL,
    UNIQUE (character_id, aggregate_version)
);

CREATE INDEX ix_character_owner_history_owner
    ON character_owner_history(owner_user_id, valid_from DESC)
    WHERE owner_user_id IS NOT NULL;
```

This table is restricted PII and must not be joined into public projections.

### `character_profile`

```sql
CREATE TABLE character_profile (
    character_id                   UUID PRIMARY KEY REFERENCES character(character_id),
    display_name                   VARCHAR(320) NOT NULL,
    biography                      TEXT NULL,
    pronoun_text                   VARCHAR(160) NULL,
    avatar_asset_id                VARCHAR(128) NULL,
    theme_resource_id              VARCHAR(128) NULL,
    profile_visibility_requested   VARCHAR(32) NOT NULL,
    profile_visibility_effective   VARCHAR(32) NOT NULL,
    directory_visibility_requested VARCHAR(32) NOT NULL,
    directory_visibility_effective VARCHAR(32) NOT NULL,
    moderation_state               VARCHAR(32) NOT NULL,
    current_source_revision_id     UUID NOT NULL,
    current_approved_revision_id   UUID NULL,
    profile_policy_version         INTEGER NOT NULL,
    profile_version                BIGINT NOT NULL,
    profile_state_hash             BYTEA NOT NULL,
    created_at                     TIMESTAMPTZ NOT NULL,
    updated_at                     TIMESTAMPTZ NOT NULL,
    CONSTRAINT ck_profile_visibility_requested CHECK (
        profile_visibility_requested IN ('PUBLIC', 'AUTHENTICATED', 'PRIVATE')
    ),
    CONSTRAINT ck_profile_visibility_effective CHECK (
        profile_visibility_effective IN ('PUBLIC', 'AUTHENTICATED', 'PRIVATE', 'HIDDEN_BY_POLICY')
    ),
    CONSTRAINT ck_directory_visibility_requested CHECK (
        directory_visibility_requested IN ('LISTED', 'UNLISTED')
    ),
    CONSTRAINT ck_directory_visibility_effective CHECK (
        directory_visibility_effective IN ('LISTED', 'UNLISTED', 'HIDDEN_BY_POLICY')
    ),
    CONSTRAINT ck_profile_moderation_state CHECK (
        moderation_state IN ('APPROVED', 'PENDING_REVIEW', 'REJECTED', 'HIDDEN')
    ),
    CONSTRAINT ck_profile_version CHECK (profile_version > 0)
);

CREATE INDEX ix_character_profile_public
    ON character_profile(profile_visibility_effective, updated_at, character_id);

CREATE INDEX ix_character_profile_directory
    ON character_profile(directory_visibility_effective, updated_at, character_id);
```

The physical column sizes use bytes larger than user-visible scalar limits to support UTF-8 storage. Application validation enforces semantic limits.

### `character_profile_revision`

```sql
CREATE TABLE character_profile_revision (
    revision_id                    UUID PRIMARY KEY,
    character_id                   UUID NOT NULL REFERENCES character(character_id),
    base_profile_version           BIGINT NOT NULL,
    resulting_profile_version      BIGINT NOT NULL,
    field_mask                     TEXT[] NOT NULL,
    normalized_content             JSONB NOT NULL,
    content_hash                   BYTEA NOT NULL,
    moderation_state               VARCHAR(32) NOT NULL,
    moderation_policy_key          VARCHAR(128) NOT NULL,
    moderation_policy_version      INTEGER NOT NULL,
    submitted_actor_type           VARCHAR(32) NOT NULL,
    submitted_actor_id             UUID NULL,
    source_operation_id            UUID NOT NULL,
    decision_reference             VARCHAR(256) NULL,
    rejection_reason_code          VARCHAR(128) NULL,
    submitted_at                   TIMESTAMPTZ NOT NULL,
    decided_at                     TIMESTAMPTZ NULL,
    activated_at                   TIMESTAMPTZ NULL,
    superseded_at                  TIMESTAMPTZ NULL,
    created_at                     TIMESTAMPTZ NOT NULL,
    UNIQUE (character_id, resulting_profile_version),
    CONSTRAINT ck_profile_revision_content_object CHECK (jsonb_typeof(normalized_content) = 'object')
);

CREATE INDEX ix_profile_revision_character_time
    ON character_profile_revision(character_id, submitted_at DESC, revision_id DESC);

CREATE INDEX ix_profile_revision_moderation_queue
    ON character_profile_revision(moderation_state, submitted_at, revision_id)
    WHERE moderation_state = 'PENDING_REVIEW';
```

`normalized_content` is bounded by application and database check or trigger. Access is restricted because it may contain personal free text.

### `character_field_visibility`

```sql
CREATE TABLE character_field_visibility (
    character_id                   UUID NOT NULL REFERENCES character(character_id),
    field_key                      VARCHAR(128) NOT NULL,
    requested_visibility           VARCHAR(32) NOT NULL,
    effective_visibility           VARCHAR(32) NOT NULL,
    policy_version                 INTEGER NOT NULL,
    profile_version                BIGINT NOT NULL,
    updated_at                     TIMESTAMPTZ NOT NULL,
    PRIMARY KEY (character_id, field_key)
);
```

Only schema-registered field keys are accepted.

### `character_handle_assignment`

```sql
CREATE TABLE character_handle_assignment (
    handle_assignment_id           UUID PRIMARY KEY,
    namespace                      VARCHAR(64) NOT NULL,
    normalized_handle              VARCHAR(128) NOT NULL,
    display_handle                 VARCHAR(128) NOT NULL,
    character_id                   UUID NULL REFERENCES character(character_id),
    assignment_state               VARCHAR(32) NOT NULL,
    normalization_version          INTEGER NOT NULL,
    reserved_until                 TIMESTAMPTZ NULL,
    cooldown_until                 TIMESTAMPTZ NULL,
    reason_code                    VARCHAR(128) NULL,
    source_operation_id            UUID NOT NULL,
    assigned_at                    TIMESTAMPTZ NULL,
    released_at                    TIMESTAMPTZ NULL,
    created_at                     TIMESTAMPTZ NOT NULL,
    updated_at                     TIMESTAMPTZ NOT NULL,
    CONSTRAINT ck_handle_state CHECK (
        assignment_state IN ('RESERVED', 'ACTIVE', 'COOLDOWN', 'BLOCKED', 'RELEASED')
    )
);

CREATE UNIQUE INDEX uq_handle_namespace_active
    ON character_handle_assignment(namespace, normalized_handle)
    WHERE assignment_state IN ('RESERVED', 'ACTIVE', 'COOLDOWN', 'BLOCKED');

CREATE UNIQUE INDEX uq_handle_character_active
    ON character_handle_assignment(character_id, namespace)
    WHERE character_id IS NOT NULL AND assignment_state = 'ACTIVE';

CREATE INDEX ix_handle_reservation_expiry
    ON character_handle_assignment(reserved_until, handle_assignment_id)
    WHERE assignment_state = 'RESERVED';

CREATE INDEX ix_handle_cooldown_expiry
    ON character_handle_assignment(cooldown_until, handle_assignment_id)
    WHERE assignment_state = 'COOLDOWN';
```

A separate immutable handle history table MAY be used if state updates on this table would obscure history. At minimum, every state transition is audited and linked to an operation.

### `character_restriction`

```sql
CREATE TABLE character_restriction (
    restriction_id                 UUID PRIMARY KEY,
    character_id                   UUID NOT NULL REFERENCES character(character_id),
    restriction_type               VARCHAR(64) NOT NULL,
    restriction_scope              TEXT[] NOT NULL,
    restriction_state              VARCHAR(32) NOT NULL,
    source_system                  VARCHAR(128) NOT NULL,
    reason_code                    VARCHAR(128) NOT NULL,
    case_reference                 VARCHAR(256) NULL,
    effective_at                   TIMESTAMPTZ NOT NULL,
    expires_at                     TIMESTAMPTZ NULL,
    cleared_at                     TIMESTAMPTZ NULL,
    created_operation_id           UUID NOT NULL,
    cleared_operation_id           UUID NULL,
    created_at                     TIMESTAMPTZ NOT NULL,
    updated_at                     TIMESTAMPTZ NOT NULL,
    CONSTRAINT ck_restriction_state CHECK (
        restriction_state IN ('ACTIVE', 'CLEARED', 'EXPIRED')
    )
);

CREATE INDEX ix_character_restriction_active
    ON character_restriction(character_id, effective_at DESC)
    WHERE restriction_state = 'ACTIVE';
```

### `character_presentation_selection`

```sql
CREATE TABLE character_presentation_selection (
    selection_id                   UUID PRIMARY KEY,
    character_id                   UUID NOT NULL REFERENCES character(character_id),
    slot_key                       VARCHAR(128) NOT NULL,
    resource_type                  VARCHAR(128) NOT NULL,
    resource_id                    VARCHAR(128) NOT NULL,
    source_engine                  VARCHAR(128) NOT NULL,
    selection_state                VARCHAR(64) NOT NULL,
    entitlement_version            BIGINT NULL,
    asset_version                  BIGINT NULL,
    selected_at                    TIMESTAMPTZ NOT NULL,
    effective_at                   TIMESTAMPTZ NULL,
    removed_at                     TIMESTAMPTZ NULL,
    source_operation_id            UUID NOT NULL,
    aggregate_version              BIGINT NOT NULL,
    created_at                     TIMESTAMPTZ NOT NULL,
    updated_at                     TIMESTAMPTZ NOT NULL,
    CONSTRAINT ck_presentation_selection_state CHECK (
        selection_state IN (
            'PENDING_VALIDATION',
            'ACTIVE',
            'INACTIVE_NOT_ENTITLED',
            'INACTIVE_ASSET_UNAVAILABLE',
            'REMOVED'
        )
    )
);

CREATE UNIQUE INDEX uq_presentation_active_slot
    ON character_presentation_selection(character_id, slot_key)
    WHERE selection_state IN ('PENDING_VALIDATION', 'ACTIVE', 'INACTIVE_NOT_ENTITLED', 'INACTIVE_ASSET_UNAVAILABLE');

CREATE INDEX ix_presentation_resource
    ON character_presentation_selection(source_engine, resource_type, resource_id, selection_state);
```

If a slot supports multiple selections, uniqueness includes a configured position key. The v1 reference assumes cardinality one.

### `character_module_association`

```sql
CREATE TABLE character_module_association (
    association_id                 UUID PRIMARY KEY,
    character_id                   UUID NOT NULL REFERENCES character(character_id),
    module_key                     VARCHAR(128) NOT NULL,
    module_instance_id             VARCHAR(256) NOT NULL,
    external_subject_ciphertext    BYTEA NULL,
    external_subject_hash          BYTEA NOT NULL,
    association_state              VARCHAR(32) NOT NULL,
    association_schema_version     INTEGER NOT NULL,
    metadata                       JSONB NOT NULL DEFAULT '{}'::jsonb,
    source_event_id                UUID NULL,
    source_operation_id            UUID NOT NULL,
    linked_at                      TIMESTAMPTZ NOT NULL,
    inactive_at                    TIMESTAMPTZ NULL,
    revoked_at                     TIMESTAMPTZ NULL,
    aggregate_version              BIGINT NOT NULL,
    created_at                     TIMESTAMPTZ NOT NULL,
    updated_at                     TIMESTAMPTZ NOT NULL,
    CONSTRAINT ck_association_state CHECK (
        association_state IN ('PENDING', 'ACTIVE', 'INACTIVE', 'REVOKED')
    ),
    CONSTRAINT ck_association_metadata_object CHECK (jsonb_typeof(metadata) = 'object')
);

CREATE UNIQUE INDEX uq_module_external_subject_active
    ON character_module_association(module_key, module_instance_id, external_subject_hash)
    WHERE association_state IN ('PENDING', 'ACTIVE', 'INACTIVE');

CREATE INDEX ix_module_association_character
    ON character_module_association(character_id, association_state, updated_at DESC);
```

The keyed hash supports lookup without exposing raw external subject ids to ordinary indexes. Encryption keys and hash secrets are managed outside the database.

### `character_lifecycle_transition`

```sql
CREATE TABLE character_lifecycle_transition (
    transition_id                  UUID PRIMARY KEY,
    character_id                   UUID NOT NULL REFERENCES character(character_id),
    from_state                     VARCHAR(32) NULL,
    to_state                       VARCHAR(32) NOT NULL,
    reason_code                    VARCHAR(128) NOT NULL,
    restriction_id                 UUID NULL,
    privacy_workflow_id            UUID NULL,
    actor_type                     VARCHAR(32) NOT NULL,
    actor_id                       UUID NULL,
    source_operation_id            UUID NOT NULL,
    aggregate_version              BIGINT NOT NULL,
    occurred_at                    TIMESTAMPTZ NOT NULL,
    effective_at                   TIMESTAMPTZ NOT NULL,
    state_hash                     BYTEA NOT NULL,
    created_at                     TIMESTAMPTZ NOT NULL,
    UNIQUE (character_id, aggregate_version)
);

CREATE INDEX ix_lifecycle_transition_character
    ON character_lifecycle_transition(character_id, aggregate_version DESC);
```

### `character_operation`

```sql
CREATE TABLE character_operation (
    operation_id                   UUID PRIMARY KEY,
    operation_type                 VARCHAR(128) NOT NULL,
    character_id                   UUID NULL,
    producer_scope                 VARCHAR(256) NOT NULL,
    idempotency_key                VARCHAR(256) NOT NULL,
    canonical_request_hash         BYTEA NOT NULL,
    source_event_id                UUID NULL,
    actor_type                     VARCHAR(32) NOT NULL,
    actor_id                       UUID NULL,
    operation_status               VARCHAR(32) NOT NULL,
    outcome_code                   VARCHAR(128) NULL,
    retryable                      BOOLEAN NULL,
    prior_aggregate_version        BIGINT NULL,
    resulting_aggregate_version    BIGINT NULL,
    prior_profile_version          BIGINT NULL,
    resulting_profile_version      BIGINT NULL,
    result_document                JSONB NULL,
    error_document                 JSONB NULL,
    correlation_id                 VARCHAR(128) NOT NULL,
    causation_id                   VARCHAR(128) NULL,
    first_received_at              TIMESTAMPTZ NOT NULL,
    completed_at                   TIMESTAMPTZ NULL,
    created_at                     TIMESTAMPTZ NOT NULL,
    updated_at                     TIMESTAMPTZ NOT NULL,
    UNIQUE (producer_scope, idempotency_key),
    UNIQUE (source_event_id)
);

CREATE INDEX ix_character_operation_character
    ON character_operation(character_id, first_received_at DESC, operation_id DESC);

CREATE INDEX ix_character_operation_status
    ON character_operation(operation_status, updated_at, operation_id);
```

`result_document` and `error_document` are schema-controlled and MUST NOT contain erased profile content or secrets.

### `character_inbox_event`

```sql
CREATE TABLE character_inbox_event (
    event_id                       UUID PRIMARY KEY,
    event_type                     VARCHAR(256) NOT NULL,
    producer_service               VARCHAR(128) NOT NULL,
    partition_key                  VARCHAR(256) NOT NULL,
    payload_hash                   BYTEA NOT NULL,
    processing_status              VARCHAR(32) NOT NULL,
    attempt_count                  INTEGER NOT NULL DEFAULT 0,
    first_received_at              TIMESTAMPTZ NOT NULL,
    last_attempt_at                TIMESTAMPTZ NULL,
    processed_at                   TIMESTAMPTZ NULL,
    operation_id                   UUID NULL,
    error_code                     VARCHAR(128) NULL,
    quarantine_reference           VARCHAR(256) NULL,
    created_at                     TIMESTAMPTZ NOT NULL,
    updated_at                     TIMESTAMPTZ NOT NULL
);

CREATE INDEX ix_character_inbox_retry
    ON character_inbox_event(processing_status, last_attempt_at, event_id)
    WHERE processing_status IN ('RECEIVED', 'FAILED_RETRYABLE');
```

### `character_outbox_event`

```sql
CREATE TABLE character_outbox_event (
    outbox_event_id                UUID PRIMARY KEY,
    event_type                     VARCHAR(256) NOT NULL,
    schema_version                 INTEGER NOT NULL,
    character_id                   UUID NULL,
    aggregate_version              BIGINT NULL,
    profile_version                BIGINT NULL,
    event_ordinal                  INTEGER NOT NULL,
    partition_key                  VARCHAR(256) NOT NULL,
    event_document                 JSONB NOT NULL,
    event_hash                     BYTEA NOT NULL,
    publication_status             VARCHAR(32) NOT NULL,
    attempt_count                  INTEGER NOT NULL DEFAULT 0,
    next_attempt_at                TIMESTAMPTZ NULL,
    created_at                     TIMESTAMPTZ NOT NULL,
    published_at                   TIMESTAMPTZ NULL,
    last_error_code                VARCHAR(128) NULL,
    UNIQUE (character_id, aggregate_version, event_ordinal)
);

CREATE INDEX ix_character_outbox_pending
    ON character_outbox_event(publication_status, next_attempt_at, created_at)
    WHERE publication_status IN ('PENDING', 'FAILED_RETRYABLE');
```

### `character_privacy_workflow`

```sql
CREATE TABLE character_privacy_workflow (
    privacy_workflow_id            UUID PRIMARY KEY,
    character_id                   UUID NOT NULL REFERENCES character(character_id),
    workflow_type                  VARCHAR(64) NOT NULL,
    workflow_state                 VARCHAR(64) NOT NULL,
    legal_basis_code               VARCHAR(128) NULL,
    retention_policy_version       INTEGER NOT NULL,
    legal_hold_state               VARCHAR(32) NOT NULL,
    current_stage                  VARCHAR(128) NOT NULL,
    checkpoint_document            JSONB NOT NULL DEFAULT '{}'::jsonb,
    requested_by_actor_type        VARCHAR(32) NOT NULL,
    requested_by_actor_id          UUID NULL,
    approval_reference             VARCHAR(256) NULL,
    source_operation_id            UUID NOT NULL,
    started_at                     TIMESTAMPTZ NULL,
    completed_at                   TIMESTAMPTZ NULL,
    failed_at                      TIMESTAMPTZ NULL,
    created_at                     TIMESTAMPTZ NOT NULL,
    updated_at                     TIMESTAMPTZ NOT NULL,
    UNIQUE (character_id, workflow_type, source_operation_id)
);

CREATE INDEX ix_privacy_workflow_active
    ON character_privacy_workflow(workflow_state, updated_at, privacy_workflow_id)
    WHERE workflow_state NOT IN ('COMPLETED', 'CANCELLED');
```

### `character_privacy_propagation`

```sql
CREATE TABLE character_privacy_propagation (
    privacy_workflow_id            UUID NOT NULL REFERENCES character_privacy_workflow(privacy_workflow_id),
    consumer_key                   VARCHAR(128) NOT NULL,
    required_action                VARCHAR(64) NOT NULL,
    propagation_state              VARCHAR(32) NOT NULL,
    request_event_id               UUID NULL,
    acknowledgement_event_id       UUID NULL,
    attempt_count                  INTEGER NOT NULL DEFAULT 0,
    last_attempt_at                TIMESTAMPTZ NULL,
    acknowledged_at                TIMESTAMPTZ NULL,
    error_code                     VARCHAR(128) NULL,
    updated_at                     TIMESTAMPTZ NOT NULL,
    PRIMARY KEY (privacy_workflow_id, consumer_key)
);
```

### `character_entitlement_projection`

```sql
CREATE TABLE character_entitlement_projection (
    character_id                   UUID NOT NULL,
    source_engine                  VARCHAR(128) NOT NULL,
    resource_type                  VARCHAR(128) NOT NULL,
    resource_id                    VARCHAR(128) NOT NULL,
    entitlement_state              VARCHAR(32) NOT NULL,
    source_version                 BIGINT NOT NULL,
    effective_at                   TIMESTAMPTZ NOT NULL,
    source_event_id                UUID NOT NULL,
    updated_at                     TIMESTAMPTZ NOT NULL,
    PRIMARY KEY (character_id, source_engine, resource_type, resource_id)
);
```

The table is a projection and can be rebuilt from source Engine Events.

### `character_media_projection`

```sql
CREATE TABLE character_media_projection (
    asset_id                       VARCHAR(128) PRIMARY KEY,
    owner_subject_type             VARCHAR(64) NOT NULL,
    owner_subject_id               UUID NULL,
    asset_purpose                  VARCHAR(64) NOT NULL,
    asset_state                    VARCHAR(32) NOT NULL,
    asset_version                  BIGINT NOT NULL,
    source_event_id                UUID NOT NULL,
    effective_at                   TIMESTAMPTZ NOT NULL,
    updated_at                     TIMESTAMPTZ NOT NULL
);
```

### `character_account_projection`

```sql
CREATE TABLE character_account_projection (
    owner_user_id                  UUID PRIMARY KEY,
    account_state                  VARCHAR(32) NOT NULL,
    minor_restriction_level        VARCHAR(32) NULL,
    legal_region                   VARCHAR(32) NULL,
    source_version                 BIGINT NOT NULL,
    source_event_id                UUID NOT NULL,
    effective_at                   TIMESTAMPTZ NOT NULL,
    updated_at                     TIMESTAMPTZ NOT NULL
);
```

The projection stores only policy-relevant attributes.

### Search projection storage

Search documents SHOULD live in a dedicated search system. If a relational staging table is used, it MUST contain only directory-safe data and support immediate tombstone updates.

### Audit storage

Security audit records SHOULD be written to centralized append-only or tamper-evident storage. Local operation and lifecycle tables are domain evidence but do not replace centralized audit.

### Partitioning

At scale, large append-only tables SHOULD be partitioned by time and optionally hash-partitioned by Character.

Recommended:

- `character_operation`: monthly time partitions with Character index;
- `character_profile_revision`: hash by Character or time partitions based on workload;
- `character_outbox_event`: time partition with pending partial index;
- audit export: separate retention store;
- Module Associations: hash by `character_id` or Module instance according to lookup patterns.

The primary Character row SHOULD remain directly addressable by `character_id`.

### Retention

Retention classes differ:

- current Character and profile: life of Character until anonymization;
- profile revisions: configurable, with shorter retention for rejected free text unless legal or moderation need requires longer;
- handle history: long enough for abuse prevention and dispute handling;
- operation records: long enough for idempotency, support, and audit;
- inbox/outbox payloads: bounded operational retention after durable publication and audit extraction;
- lifecycle history: long-term while Character exists, minimized after anonymization;
- Module Associations: according to identity resolution and privacy policy;
- security audit: according to legal and security policy;
- search projections: deleted promptly when no longer allowed.

Retention jobs MUST be idempotent, observable, and legal-hold aware.

### Backup and recovery

The reference deployment MUST provide:

- encrypted backups;
- point-in-time recovery;
- regular restore tests;
- documented recovery point objective and recovery time objective;
- outbox/inbox consistency verification after restore;
- privacy tombstone preservation;
- protection against restoring erased profile content into active projections;
- regional recovery procedures;
- audit evidence of restoration operations.

After point-in-time restore, Event replay and outbox recovery MUST not duplicate Character effects.


---

## API Specification

### API conventions

The API is split into:

- owner-facing Character APIs;
- public profile and handle APIs;
- trusted internal service APIs;
- administrative control-plane APIs;
- privacy workflow APIs;
- operations and diagnostics APIs.

All endpoints are versioned under `/v1` or through an equivalent media-type strategy.

Requirements:

- JSON request and response bodies use `snake_case`;
- timestamps use RFC 3339 UTC;
- Character identifiers are opaque;
- write requests use `Idempotency-Key`;
- concurrency-sensitive requests use `If-Match` or explicit expected version;
- list endpoints use opaque cursor pagination;
- unknown request fields are rejected for write contracts;
- response fields may be added compatibly;
- public APIs never reveal owner User ID;
- internal and admin endpoints use separate audiences and authorization scopes;
- all write responses include operation id and resulting versions;
- asynchronous workflows return workflow status rather than pretending completion.

### Authentication and authorization

Authentication methods MAY include OAuth 2.0 access tokens, workload identity, mTLS, or platform-signed service credentials.

Required scopes include examples such as:

- `character:read:self`;
- `character:write:self`;
- `character:close:self`;
- `character:restore:self`;
- `character:read:public`;
- `character:resolve:module`;
- `character:read:internal`;
- `character:suspend`;
- `character:moderate`;
- `character:privacy:operate`;
- `character:admin:read`;
- `character:admin:repair`.

Scope names are illustrative but separation is normative.

Authorization MUST evaluate:

- authenticated principal;
- target Character ownership;
- delegated role;
- service producer registration;
- Character lifecycle;
- active restrictions;
- field sensitivity;
- requested action;
- environment and region where required;
- step-up authentication for high-risk owner actions;
- approval state for privileged actions.

### Error format

```json
{
  "error": {
    "code": "VERSION_CONFLICT",
    "message_key": "character.error.version_conflict",
    "retryable": true,
    "operation_id": "uuid",
    "correlation_id": "uuid",
    "details": {
      "current_profile_version": 12
    }
  }
}
```

Error messages returned to public callers MUST be privacy safe. Internal details are available only through audit and operation inspection.

### Stable error catalog

| Code | HTTP | Retryable | Meaning |
|---|---:|---:|---|
| `CHARACTER_NOT_FOUND` | 404 | no | Target is absent or intentionally indistinguishable. |
| `CHARACTER_NOT_ACCESSIBLE` | 404/403 | no | Access denied under anti-enumeration policy. |
| `CHARACTER_SLOT_OCCUPIED` | 409 | no | Owner slot already has a non-terminal Character. |
| `CHARACTER_STATE_INVALID` | 409 | no | Command is not valid in current lifecycle state. |
| `CHARACTER_SUSPENDED` | 423 | no | Operation blocked by suspension. |
| `CHARACTER_CLOSED` | 410/409 | no | Normal operation blocked by closure. |
| `CHARACTER_ANONYMIZED` | 410 | no | Character is terminal and cannot be restored. |
| `VERSION_CONFLICT` | 409 | yes | Expected aggregate or profile version is stale. |
| `IDEMPOTENCY_CONFLICT` | 409 | no | Same key used with different normalized payload. |
| `PROFILE_FIELD_INVALID` | 422 | no | One or more profile values violate schema. |
| `PROFILE_WRITE_LOCKED` | 423 | no | Policy or moderation lock blocks profile edit. |
| `PROFILE_REVIEW_REQUIRED` | 202/result | no | Submission accepted but not yet public. |
| `HANDLE_INVALID` | 422 | no | Handle violates normalization or syntax policy. |
| `HANDLE_UNAVAILABLE` | 409 | no | Handle is active, reserved, cooling down, or blocked. |
| `HANDLE_RATE_LIMITED` | 429 | yes | Handle search or change limit exceeded. |
| `ASSET_NOT_APPROVED` | 409 | yes/no | Asset is missing, pending, rejected, or wrong purpose. |
| `ENTITLEMENT_NOT_FOUND` | 409 | yes/no | Resource selection not currently entitled. |
| `MODULE_NOT_AUTHORIZED` | 403 | no | Producer cannot manage the association namespace. |
| `ASSOCIATION_CONFLICT` | 409 | no | External subject already maps incompatibly. |
| `RESTORE_WINDOW_EXPIRED` | 409 | no | Ordinary restoration is no longer permitted. |
| `LEGAL_HOLD_ACTIVE` | 409 | no | Destructive privacy action is blocked. |
| `ANONYMIZATION_IN_PROGRESS` | 409 | no | Concurrent normal mutation is blocked. |
| `POLICY_UNAVAILABLE` | 503 | yes | Required authorization or policy decision unavailable. |
| `DEPENDENCY_PROJECTION_MISSING` | 409/503 | yes | Required local projection has not arrived. |
| `RATE_LIMITED` | 429 | yes | Caller or Character limit exceeded. |
| `REQUEST_TOO_LARGE` | 413 | no | Body exceeds platform limit. |
| `VALIDATION_FAILED` | 422 | no | Structured request validation failed. |

### Owner APIs

#### Create Character

```http
POST /v1/characters
Idempotency-Key: <key>
Authorization: Bearer <token>
Content-Type: application/json
```

```json
{
  "character_slot_key": "primary",
  "profile": {
    "display_name": "Example Name"
  },
  "privacy": {
    "profile_visibility": "PRIVATE",
    "directory_visibility": "UNLISTED"
  }
}
```

Response:

```http
201 Created
Location: /v1/characters/{character_id}
ETag: "character-1"
```

```json
{
  "operation_id": "uuid",
  "character": {
    "character_id": "018f2f1e-8f0a-7c91-a3d1-0242ac120002",
    "character_slot_key": "primary",
    "lifecycle_state": "ACTIVE",
    "aggregate_version": 1,
    "profile_version": 1
  }
}
```

The authenticated User is the owner. Clients cannot create a Character for arbitrary `owner_user_id` through this endpoint.

#### List own Characters

```http
GET /v1/me/characters?limit=20&cursor=<opaque>
```

Returns current and restorable Characters according to account policy. Anonymized tombstones are excluded from ordinary UI.

#### Get owner Character detail

```http
GET /v1/characters/{character_id}
Authorization: Bearer <token>
```

Returns Owner Character Detail after ownership authorization.

#### Update profile

```http
PATCH /v1/characters/{character_id}/profile
Idempotency-Key: <key>
If-Match: "profile-11"
```

```json
{
  "field_mask": ["display_name", "biography"],
  "values": {
    "display_name": "Example Name",
    "biography": "A long-term learning journey."
  }
}
```

Response may be:

- `200 OK` when effective approved state changed immediately;
- `202 Accepted` when moderation is pending;
- `409 Conflict` on version or idempotency conflict;
- `422 Unprocessable Entity` on validation error;
- `423 Locked` when profile editing is restricted.

#### Get profile revision status

```http
GET /v1/characters/{character_id}/profile/revisions/{revision_id}
```

Returns owner-safe status, changed fields, submission time, and policy-safe rejection reasons.

#### List profile revisions

```http
GET /v1/characters/{character_id}/profile/revisions?limit=20&cursor=<opaque>
```

The API MUST NOT return old rejected free text after retention or anonymization.

#### Change visibility

```http
PUT /v1/characters/{character_id}/visibility
Idempotency-Key: <key>
If-Match: "profile-11"
```

```json
{
  "profile_visibility": "PRIVATE",
  "directory_visibility": "UNLISTED",
  "field_visibility": {
    "biography": "PRIVATE"
  }
}
```

Privacy tightening SHOULD return after authoritative commit and trigger priority cache invalidation.

#### Change handle

```http
PUT /v1/characters/{character_id}/handle
Idempotency-Key: <key>
If-Match: "character-16"
```

```json
{
  "handle": "example-name"
}
```

The API MUST NOT provide unbounded handle availability enumeration. Availability checks and changes are rate limited.

#### Check handle syntax and availability

```http
POST /v1/handles/check
```

```json
{
  "handle": "example-name"
}
```

Response SHOULD be coarse:

```json
{
  "valid": true,
  "available": false,
  "reason": "UNAVAILABLE"
}
```

It MUST NOT distinguish blocked, reserved, cooling down, or assigned states to untrusted callers.

#### Select presentation resource

```http
PUT /v1/characters/{character_id}/presentation/{slot_key}
Idempotency-Key: <key>
If-Match: "profile-11"
```

```json
{
  "resource_type": "title",
  "resource_id": "uuid"
}
```

Response includes `ACTIVE`, `PENDING_VALIDATION`, or a stable rejection.

#### Remove presentation resource

```http
DELETE /v1/characters/{character_id}/presentation/{slot_key}
Idempotency-Key: <key>
If-Match: "profile-12"
```

#### Close own Character

```http
POST /v1/characters/{character_id}:close
Idempotency-Key: <key>
```

```json
{
  "reason_code": "OWNER_REQUESTED",
  "confirmation_token": "step-up-confirmation-reference"
}
```

Requirements:

- step-up authentication MAY be required;
- consequences and recovery deadline MUST be shown before confirmation;
- request is idempotent;
- the response distinguishes closure from deletion;
- privacy erasure requires a separate account/privacy workflow when applicable.

#### Restore own Character

```http
POST /v1/characters/{character_id}:restore
Idempotency-Key: <key>
```

The endpoint validates recovery window and account eligibility. It does not permit restoration after terminal anonymization.

#### Export Character data

```http
POST /v1/characters/{character_id}/exports
Idempotency-Key: <key>
```

Creates an asynchronous, authenticated export workflow. The export artifact is encrypted, expires, and is audited.

### Public APIs

#### Get public profile by Character ID

```http
GET /v1/public/characters/{character_id}
```

#### Get public profile by handle

```http
GET /v1/public/handles/{handle}
```

Public lookup behavior:

- apply current profile visibility;
- apply moderation and lifecycle suppression;
- use safe caching keyed by visibility policy version;
- normalize private, hidden, anonymized, and nonexistent responses according to anti-enumeration policy;
- do not redirect old handles after closure or privacy-sensitive rename unless policy explicitly permits it;
- include cache validators based on profile version;
- use conservative cache-control for policy-sensitive states.

#### Character directory search

```http
GET /v1/public/characters?query=<term>&limit=20&cursor=<opaque>
```

Search requirements:

- only listed profiles;
- abuse-resistant query limits;
- no exact email or external identifier search;
- no search of private biography by default;
- coarse ranking explanations only;
- safe handling of minors and protected accounts;
- immediate deindexing path;
- cursor pagination;
- query logging minimization.

### Internal service APIs

Internal APIs are not substitutes for Events. They exist for bounded reads, controlled commands, and recovery.

#### Get Character eligibility

```http
GET /internal/v1/characters/{character_id}/eligibility
```

This endpoint MAY support bootstrap or repair. Other Engines SHOULD normally use their local Event projection.

#### Batch get Character summaries

```http
POST /internal/v1/characters:batchGet
```

```json
{
  "character_ids": ["..."],
  "fields": ["lifecycle_state", "aggregate_version"]
}
```

Batch limits and field authorization are mandatory. Arbitrary profile fields are not available by default.

#### Resolve owner Character

```http
GET /internal/v1/users/{owner_user_id}/characters?slot_key=primary
```

Only trusted platform services with explicit owner-resolution scope may call this endpoint.

#### Resolve Module Association

```http
POST /internal/v1/module-associations:resolve
```

```json
{
  "module_key": "school",
  "module_instance_id": "school-eu-production",
  "external_subject_id": "opaque-student-subject-123"
}
```

The authenticated service identity determines permitted Module namespace. The response includes Character ID only if the association and Character are eligible.

#### Create Module Association

```http
POST /internal/v1/module-associations
Idempotency-Key: <key>
```

The service cannot associate a subject outside its registered namespace.

#### Change Module Association state

```http
POST /internal/v1/module-associations/{association_id}:changeState
Idempotency-Key: <key>
```

### Administrative Character APIs

#### Read administration view

```http
GET /admin/v1/characters/{character_id}
```

Returns bounded administrative state, restrictions, revisions, associations, lifecycle, operation history, and projection health according to role.

#### Suspend Character

```http
POST /admin/v1/characters/{character_id}:suspend
Idempotency-Key: <key>
If-Match: "character-18"
```

```json
{
  "reason_code": "PROFILE_POLICY_VIOLATION",
  "restriction_scope": ["LIFECYCLE", "PUBLIC_PROFILE", "DIRECTORY"],
  "case_reference": "case-opaque-id",
  "suspended_until": null
}
```

#### Reactivate Character

```http
POST /admin/v1/characters/{character_id}:reactivate
Idempotency-Key: <key>
If-Match: "character-19"
```

```json
{
  "restriction_ids_to_clear": ["uuid"],
  "reason_code": "RESTRICTION_CLEARED",
  "case_reference": "case-opaque-id"
}
```

#### Hide profile

```http
POST /admin/v1/characters/{character_id}/profile:hide
```

Hiding profile content does not necessarily suspend the Character. The action MUST identify scope and reason.

#### Apply moderation decision

```http
POST /admin/v1/profile-revisions/{revision_id}:decide
Idempotency-Key: <key>
```

Human moderation endpoints require queue assignment, decision reason, and separation from ordinary support roles.

#### Place legal hold

```http
POST /admin/v1/characters/{character_id}/legal-holds
Idempotency-Key: <key>
```

The API is restricted and stores sensitive detail in a dedicated legal system or protected audit store.

#### Remove legal hold

```http
DELETE /admin/v1/characters/{character_id}/legal-holds/{hold_id}
Idempotency-Key: <key>
```

#### Repair invariant

```http
POST /admin/v1/characters/{character_id}:repair
Idempotency-Key: <key>
If-Match: "character-22"
```

```json
{
  "issue_id": "uuid",
  "repair_type": "REBUILD_EFFECTIVE_VISIBILITY",
  "before_state_hash": "base64-hash",
  "case_reference": "incident-or-ticket-id",
  "approval_reference": "approval-id"
}
```

### Privacy APIs

#### Start anonymization workflow

```http
POST /privacy/v1/characters/{character_id}:anonymize
Idempotency-Key: <key>
```

This endpoint is available only to the privacy orchestration service. It returns `202 Accepted` with workflow id.

#### Get privacy workflow

```http
GET /privacy/v1/workflows/{privacy_workflow_id}
```

#### Acknowledge downstream privacy action

```http
POST /privacy/v1/workflows/{privacy_workflow_id}/consumers/{consumer_key}:acknowledge
Idempotency-Key: <key>
```

Acknowledgements are authenticated by registered consumer identity and cannot mark another consumer complete.

### Operations APIs

#### Get operation

```http
GET /ops/v1/character-operations/{operation_id}
```

#### Search operations

```http
GET /ops/v1/character-operations?character_id=<id>&status=<status>&limit=50&cursor=<opaque>
```

Queries MUST be bounded. Free-form search across personal content is prohibited.

#### Replay inbox Event

```http
POST /ops/v1/inbox-events/{event_id}:replay
Idempotency-Key: <key>
```

Replay requires a retryable or quarantined state and does not bypass idempotency.

#### Retry outbox Event

```http
POST /ops/v1/outbox-events/{event_id}:retry
Idempotency-Key: <key>
```

#### Rebuild Character projections

```http
POST /ops/v1/characters/{character_id}/projections:rebuild
Idempotency-Key: <key>
```

#### Run reconciliation

```http
POST /ops/v1/characters/{character_id}:reconcile
Idempotency-Key: <key>
```

### Bulk APIs

Bulk lifecycle, association, export, and repair operations MUST be asynchronous jobs.

Requirements:

- bounded input size;
- per-item idempotency;
- validation before execution;
- preview or dry run for high-risk operations;
- checkpointing;
- pause and resume;
- independent failed-item handling;
- workload isolation;
- audit of creator, approver, and executor;
- no single transaction spanning unrelated Characters.

### API status codes

- `200 OK`: successful read or immediate idempotent result;
- `201 Created`: new Character, association, or workflow resource;
- `202 Accepted`: moderation, export, privacy, or bulk workflow accepted;
- `204 No Content`: successful removal with no representation;
- `400 Bad Request`: malformed syntax;
- `401 Unauthorized`: authentication missing or invalid;
- `403 Forbidden`: authenticated but not authorized, unless anti-enumeration policy uses 404;
- `404 Not Found`: absent or intentionally indistinguishable;
- `409 Conflict`: state, version, uniqueness, or idempotency conflict;
- `410 Gone`: terminal anonymized or non-restorable public resource where safe to disclose;
- `413 Payload Too Large`: limit exceeded;
- `422 Unprocessable Entity`: semantic validation failed;
- `423 Locked`: active restriction blocks action;
- `429 Too Many Requests`: rate limit;
- `503 Service Unavailable`: retryable required dependency or capacity failure.

### Rate limits

Separate rate limits MUST exist for:

- Character creation per User and device risk context;
- profile updates per Character;
- handle checks and handle changes;
- public lookup by handle and Character ID;
- directory search;
- Module Association operations per producer;
- export requests;
- closure and restore attempts;
- administrative mutation;
- replay and rebuild operations.

Rate limits are security controls and product safeguards, not only performance controls.

---

## Admin Features

### Character support console

The support console SHOULD show:

- Character ID and lifecycle state;
- owner relationship status without unnecessary User PII;
- current and requested visibility;
- profile moderation state;
- current approved and pending revision summaries;
- handle state;
- active restrictions;
- presentation selection status;
- Module Association summaries;
- recent operations and Events;
- projection freshness;
- privacy workflow state;
- audit links.

The console MUST distinguish authoritative state from projections.

### Lifecycle workflow

Authorized administrators can:

- suspend with defined restriction scope;
- extend or amend a suspension;
- clear individual restrictions;
- reactivate when no blocking restriction remains;
- close for approved reasons;
- restore under policy;
- view transition history.

The UI MUST prevent impossible transitions and require expected version.

### Moderation queue

Moderators need:

- policy-specific work queues;
- normalized submitted content;
- prior approved content for comparison;
- automated signals and confidence;
- asset preview through safe Media Service tooling;
- decision reason categories;
- escalation and appeal status;
- assignment and locking to avoid conflicting review;
- decision audit;
- no access to unrelated account or progression data.

### Profile diff

The administration UI MUST show field-level differences between:

- current approved revision;
- pending submitted revision;
- previous revision;
- policy-normalized values.

Dangerous invisible characters, Unicode confusables, and whitespace differences SHOULD be highlighted.

### Handle administration

Authorized roles MAY:

- inspect normalization result;
- block a handle;
- reserve protected terms;
- release a handle after policy checks;
- view restricted assignment history;
- manage impersonation or trademark cases;
- trigger handle index reconciliation.

Ordinary support agents MUST NOT manually assign arbitrary handles by direct database edit.

### Restriction management

The UI MUST model restrictions as independent records rather than one free-form suspension flag.

It SHOULD show:

- restriction scope;
- source;
- reason category;
- effective and expiration times;
- clearing authority;
- downstream propagation state;
- active aggregate effect.

### Module Association inspector

Authorized platform operators and scoped Module administrators MAY inspect:

- association id;
- Character ID;
- Module and instance;
- state;
- hashed external subject reference;
- creation source;
- uniqueness conflict;
- lifecycle eligibility;
- recent association Events.

Raw external subject identifiers are revealed only when operationally required and authorized.

### Presentation inspector

The console SHOULD show:

- selected resource;
- slot definition version;
- entitlement source and version;
- media asset state;
- effective/fallback state;
- last change reason;
- related Events.

Support can remove an unsafe selection but cannot grant the underlying entitlement.

### Privacy operations

Privacy administrators need:

- closure and recovery deadline;
- export workflow;
- anonymization eligibility;
- legal hold status;
- workflow stages and checkpoints;
- downstream consumer propagation;
- failed acknowledgements;
- verification report;
- approval and legal basis categories.

The UI MUST make irreversible steps visually distinct and require strong authorization and confirmation.

### Operation inspector

For every mutation, operators SHOULD be able to trace:

```text
request or source Event
  → producer authentication
  → authorization decision
  → idempotency lookup
  → prior aggregate version
  → validation and policy versions
  → state transition
  → profile or lifecycle versions
  → outbox Events
  → broker publication
  → projection application
```

### Dead-letter and quarantine management

Operators MUST be able to:

- inspect redacted payload summary;
- see failure classification;
- retry safe failures;
- quarantine malformed or conflicting Events;
- revoke producer access;
- attach incident reference;
- compare payload hash on duplicate Event ids;
- avoid editing the original Event.

### Reconciliation and repair

The console SHOULD support:

- targeted Character reconciliation;
- handle uniqueness verification;
- profile approved-pointer verification;
- lifecycle-to-restriction verification;
- outbox completeness check;
- search deindex verification;
- Module Association uniqueness check;
- anonymization completion verification;
- projection rebuild;
- approved repair commands.

### Feature flags and emergency controls

Emergency controls MAY include:

- pause Character creation;
- disable public directory search;
- force public profiles to authenticated or private presentation;
- pause profile free-text publication;
- block handle changes;
- pause one Module producer;
- pause anonymization before destructive stage;
- force Media assets to fallback;
- pause bulk jobs;
- disable a broken Event schema version.

Emergency controls MUST be scoped, time-bounded where possible, audited, and safe by default.

---

## UX Requirements

### Identity continuity

Clients MUST present Character as a persistent identity, not as a disposable score container belonging to one Module.

Module branding may frame the experience, but the Character ID and core identity remain platform-owned.

### Narrative-first profile

The profile SHOULD communicate who the Character is and what journey they are on. Numeric values owned by other Engines may be included through projections, but profile hierarchy SHOULD prioritize identity, milestones, presentation, and story context over raw counters.

### Creation experience

Character creation SHOULD:

- explain that the Character persists across platform experiences;
- use privacy-safe defaults;
- avoid requiring a public handle;
- allow a safe generated display name when moderation is pending;
- clearly distinguish account name from Character display name;
- avoid collecting unnecessary personal data;
- show provisioning or review status without exposing infrastructure detail.

### Profile editing

Profile editing MUST:

- show current approved public state;
- show pending changes separately;
- preserve user input during version conflict where safe;
- indicate which fields require moderation;
- explain rejected fields with actionable, policy-safe messages;
- prevent silent overwrite from concurrent sessions;
- support accessible character counts and validation;
- never imply that changing display name changes the permanent Character identity.

### Visibility controls

Visibility UX MUST distinguish:

- who can open the profile;
- whether the Character appears in search or suggestions;
- field-level visibility where supported;
- owner preference versus stricter effective policy.

Privacy tightening must feel immediate. The UI SHOULD confirm authoritative application even while downstream cache invalidation is completing.

### Public handle UX

The handle UI MUST:

- explain that handles are public and mutable;
- show normalized result before confirmation;
- avoid revealing why an unavailable handle is unavailable;
- explain cooldown or rename limits;
- warn that links may change;
- use Character ID internally for durable references;
- support Unicode safely or restrict allowed scripts according to policy;
- provide accessible error messages.

### Moderation UX

When a revision is pending:

- the owner sees the pending content and current approved public content;
- other users continue to see only approved content;
- estimated moderation duration MUST NOT be promised unless operationally reliable;
- rejection provides a category and next allowed action;
- appeal flow, if supported, is separate from repeated resubmission.

### Suspension UX

A suspended owner SHOULD see:

- that Character activity is restricted;
- which broad capabilities are unavailable;
- whether the restriction is temporary;
- an appeal or support route where policy permits;
- privacy and data-right options still available.

The UI MUST NOT expose sensitive fraud, security, or moderation detection logic.

### Closure UX

Before owner closure, the product MUST explain:

- normal activity will stop;
- public profile and discovery will be hidden;
- other Engine state is retained according to policy;
- restoration window and deadline, if any;
- closure is not necessarily immediate erasure;
- how to request export or erasure.

Closure requires explicit confirmation and SHOULD use step-up authentication for high-value Characters.

### Restoration UX

Restoration MUST:

- use the same Character identity;
- re-confirm privacy settings;
- explain that Module Associations and downstream experiences may require independent reactivation;
- not promise restoration after anonymization;
- show pending projection recovery without claiming data loss.

### Anonymization UX

Where user-facing:

- irreversible consequences are explicit;
- export is offered before destruction where required;
- legal or retention limitations are described in product language;
- progress state is shown as a privacy workflow, not a fake immediate success;
- the final state does not expose retained security or legal metadata.

### Presentation selection UX

Clients MUST distinguish:

- selected and active;
- selected but pending validation;
- no longer available;
- fallback applied.

If entitlement is revoked, the UI SHOULD explain that the selection is unavailable without claiming the Character lost an Item through the Character Engine.

### Eventual consistency

After an accepted mutation, the owner UI SHOULD update from the command result immediately and reconcile with projections.

If a public projection is stale:

- show the last confirmed state where safe;
- retry with bounded backoff;
- do not re-submit the mutation automatically with a new idempotency key;
- avoid showing hidden content due to stale cache;
- privacy-restrictive state always wins.

### Accessibility

All Character experiences MUST support:

- keyboard navigation;
- screen reader labels;
- text alternatives for avatars and visual status;
- sufficient contrast;
- non-color status indicators;
- scalable text;
- accessible confirmation dialogs;
- localized validation messages;
- motion reduction for profile transitions.

### Localization

Profile UI and error messages are localized, but authoritative identifiers and Event codes are not translated.

Display names and biographies support Unicode under moderation policy. Handle normalization rules are locale-independent and versioned.

### Time display

APIs return UTC. Clients localize lifecycle, revision, and recovery times using user locale and timezone. Recovery deadlines MUST include an exact date and time, not only relative wording.

### Minor-safe experience

When account policy indicates a minor or protected user:

- default profile is private or authenticated according to jurisdictional policy;
- directory listing may be disabled;
- free-text fields may require pre-moderation;
- public handle may be unavailable;
- contact or location fields remain prohibited;
- admin views minimize age-related information.

---

## Security

### Security objectives

The Character Engine protects durable identity, public reputation, profile content, privacy controls, and platform-wide eligibility. Security failures can affect every connected product.

Objectives:

1. prevent unauthorized Character creation or takeover;
2. prevent owner and Character enumeration;
3. prevent unauthorized profile mutation;
4. prevent lifecycle abuse and fraudulent suspension or restoration;
5. prevent handle impersonation and namespace abuse;
6. prevent malicious content and asset injection;
7. prevent replay and duplicate effects;
8. prevent cross-Module identity association;
9. protect personal profile data and ownership links;
10. provide non-repudiable privileged action audit;
11. preserve integrity during partial dependency failure;
12. support rapid privacy suppression and incident response.

### Trust boundaries

Trust boundaries include:

- untrusted public clients;
- authenticated owner clients;
- API gateway;
- Character Engine service;
- Identity Provider;
- authorization service;
- Event Bus and producers;
- Media and moderation services;
- other Engines;
- Business Modules;
- administrative tools;
- database and backup systems;
- search infrastructure;
- analytics and audit pipelines.

Every boundary requires authentication, authorization, schema validation, rate limiting, and observability appropriate to risk.

### Owner authentication and account takeover protection

High-risk actions SHOULD require recent or step-up authentication:

- closure;
- restore;
- handle change;
- public visibility expansion;
- export creation;
- presentation changes involving high-value identity markers where product risk warrants it.

The Engine relies on verified token claims and MUST reject stale, revoked, wrong-audience, or wrong-environment credentials.

### Object-level authorization

Every owner command MUST verify that the authenticated User owns the target Character.

The Character ID in the URL or body is never sufficient. Cached authorization MUST be versioned and short-lived for lifecycle-sensitive actions.

Batch endpoints verify every item and MUST not return partial unauthorized records.

### Service producer authorization

Each inbound Event type has an allowlist of producer identities and scopes.

Authorization checks include:

- producer service identity;
- environment;
- Event type;
- Module key and instance;
- resource type for entitlement Events;
- subject namespace;
- maximum rate and payload size;
- schema version.

A Module registered for `school-eu-production` cannot create associations for another Module instance.

### Event authenticity

Event transport SHOULD provide authenticated producer identity through broker ACL, workload identity, signed envelope, mTLS, or equivalent controls.

If Events are signed:

- signatures cover canonical envelope and payload;
- keys rotate;
- verification failures are quarantined;
- replay windows are enforced;
- signing keys are scoped by producer;
- key identifiers are audited.

### Replay protection

The Engine MUST combine:

- unique Event id;
- source Event payload hash;
- producer-scoped idempotency key;
- canonical command hash;
- aggregate version;
- bounded timestamp validation for commands where appropriate.

If the same Event id arrives with a different payload hash, processing stops, the Event is quarantined, and a security alert is raised.

### Input validation

All external input is untrusted.

Validation includes:

- strict JSON schema;
- request size;
- string scalar count and byte count;
- Unicode normalization;
- control and invisible characters;
- bidi control abuse;
- null and absent semantics;
- identifier format;
- enum allowlist;
- timestamp range;
- field mask allowlist;
- metadata schema;
- array cardinality;
- nested object depth;
- canonical resource type;
- safe error output.

### Profile content security

Biography and display fields are plain text.

The Engine MUST:

- reject executable markup;
- encode output for each client context;
- prohibit script, iframe, style, and event handler content;
- prevent stored XSS;
- strip or reject unsafe control characters;
- scan links only if links are explicitly supported by future schema;
- avoid rendering untrusted Unicode as an identifier;
- retain moderation evidence only in restricted storage;
- apply content policy without exposing classifier internals.

### Avatar and asset security

The Engine stores asset IDs, not arbitrary URLs.

Media Service requirements include:

- ownership verification;
- malware scanning;
- content-type validation;
- decompression bomb protection;
- image transcoding;
- metadata stripping;
- moderation;
- safe CDN delivery;
- immutable asset versions.

The Character Engine MUST validate asset purpose and owner subject before activation.

### Handle security

Handle policy MUST address:

- Unicode normalization and case folding;
- confusable characters;
- mixed-script restrictions;
- reserved system names;
- trademarks and impersonation;
- offensive terms;
- invisible characters;
- misleading punctuation;
- bidirectional text;
- rapid rename abuse;
- squatting and enumeration;
- cooldown after release;
- protected historical names.

Normalization algorithm changes require migration analysis. Existing handles MUST NOT silently collide after an update.

### Mass assignment prevention

Write models use explicit field allowlists and field masks. Server-controlled fields such as owner id, lifecycle, moderation state, versions, policy version, and effective visibility cannot be supplied through owner profile APIs.

### Association security

Module Association operations MUST prevent:

- one Module resolving another Module's subjects;
- external subject identifier leakage;
- unauthorized relinking of a subject to another Character;
- association takeover through guessed identifiers;
- use of association as proof of owner authentication;
- oversized or unregistered metadata;
- cross-environment links;
- stale Module credentials.

High-risk relinking requires explicit owner or platform identity verification and may require a cooling-off period.

### Administrative authorization

Administrative roles are separated:

- support reader;
- profile moderator;
- lifecycle moderator;
- privacy operator;
- legal hold operator;
- security operator;
- repair operator;
- platform administrator.

No role should combine unrestricted moderation, privacy destruction, and audit deletion capabilities.

### Separation of duties

The following actions SHOULD require approval or dual control:

- exceptional restoration after recovery deadline;
- anonymization override;
- legal hold removal;
- manual owner relationship migration;
- protected handle reassignment;
- bulk suspension or closure;
- direct repair of authoritative state;
- production Event replay with wide scope.

### Database security

- application roles receive least privilege;
- public read services cannot access owner history or profile revisions;
- moderation services access only assigned content;
- privacy workers have narrowly scoped destructive procedures;
- direct table update is denied to support tools;
- schema migration roles are separate from runtime roles;
- database audit captures privileged access;
- row-level security MAY provide defense in depth but does not replace application authorization.

### Encryption

- TLS is required in transit;
- databases, replicas, backups, and export artifacts are encrypted at rest;
- profile free text and external subject identifiers SHOULD use field or envelope encryption where threat model requires it;
- keys are managed by centralized KMS;
- key access is audited;
- rotation is supported;
- anonymization MAY use cryptographic erasure for selected encrypted fields;
- secrets never appear in Event metadata or logs.

### Logging security

Logs MUST NOT contain:

- access tokens;
- session identifiers;
- raw biography or rejected profile content;
- raw external Module subject identifiers;
- full owner User identity where not required;
- moderation evidence;
- legal hold detail;
- export download URLs;
- encryption material.

Logs SHOULD contain operation id, Character ID, Event id, result code, versions, latency, and redacted actor type.

### Enumeration resistance

Public and unauthorized APIs MUST avoid revealing whether a private, closed, suspended, anonymized, or nonexistent Character exists.

Controls include:

- normalized 404 responses;
- similar response timing where practical;
- rate limits;
- no owner lookup by email;
- coarse handle availability response;
- opaque pagination;
- no sequential Character IDs;
- abuse detection.

### Denial-of-service controls

The Engine MUST enforce:

- maximum payload and field sizes;
- per-principal and per-IP rate limits;
- per-Character mutation limits;
- per-producer Event quotas;
- bounded moderation queues;
- bounded association metadata;
- cursor pagination;
- timeout and circuit-breaker policies;
- backpressure;
- bulk workload isolation;
- quarantine for invalid Event storms.

### Abuse and anomaly signals

The Engine SHOULD emit security signals for:

- rapid Character creation across linked accounts or devices;
- repeated handle probing;
- repeated profile policy violations;
- rapid public/private visibility toggling used for evasion;
- repeated association relinking;
- lifecycle actions from unusual privileged principals;
- stale or conflicting Event replay;
- high-rate profile updates;
- anonymization or export abuse;
- search scraping patterns.

Signals do not directly change state unless an authorized policy workflow issues a command.

### Supply-chain and deployment security

- dependencies are pinned and scanned;
- build artifacts are signed;
- deployment provenance is retained;
- secrets are not built into images;
- production changes use review and controlled rollout;
- database migrations are backward compatible during rolling deployment;
- Event schema compatibility is checked in CI;
- emergency rollback does not bypass privacy suppression.

### Security testing

Required testing includes:

- broken object-level authorization;
- owner/account takeover scenarios;
- Event spoofing and replay;
- idempotency conflict;
- stored XSS and output encoding;
- Unicode confusable and bidi attacks;
- handle enumeration;
- malicious asset references;
- cross-Module association access;
- privilege escalation;
- bulk API abuse;
- privacy workflow interruption;
- backup restore of erased data;
- search cache privacy leakage;
- race between closure, restore, and anonymization;
- rate-limit bypass;
- dependency outage behavior.

### Incident response capabilities

The Engine MUST support:

- immediate public profile suppression;
- handle resolution disablement;
- producer credential revocation;
- Module Association namespace pause;
- targeted access-log search;
- affected Character identification;
- source Event and downstream consumer inventory;
- profile revision and projection verification;
- forced token/session invalidation through account systems;
- evidence preservation;
- targeted privacy and projection repair.


---

## Privacy

### Privacy principles

1. Collect only data required for Character identity and presentation.
2. Use opaque identifiers rather than personal attributes for integration.
3. Make private and unlisted states first-class, not exceptional.
4. Separate closure, retention, legal hold, and anonymization.
5. Never place unnecessary personal content in broad Events.
6. Apply privacy tightening before optional enrichment.
7. Rebuild and replay must not resurrect erased or hidden data.
8. Retention is field- and purpose-specific.
9. Access to ownership and historical profile data is restricted and audited.
10. Downstream consumers remain responsible for their own data, but the Character Engine must provide reliable lifecycle and privacy signals.

### Data minimization

The Character Engine SHOULD store only:

- Character ID;
- owner User ID or protected relationship token;
- lifecycle state;
- bounded profile presentation fields;
- visibility and discoverability policy;
- handle where enabled;
- presentation references;
- generic Module Association identifiers;
- operation, history, and audit metadata;
- minimum policy projections.

The Engine MUST NOT store by default:

- password or authentication secret;
- email address;
- phone number;
- precise date of birth;
- legal identity documents;
- payment details;
- physical address;
- precise geolocation;
- health data;
- school records;
- attendance records;
- purchases;
- private messages;
- contact list;
- social graph;
- arbitrary Module payloads.

### Data classification

Recommended classification:

| Data | Classification |
|---|---|
| Character ID | internal/pseudonymous; public only through permitted profile |
| Owner User ID | confidential identity linkage |
| Display name | user-provided public or confidential according to visibility |
| Biography | user-provided personal data |
| Handle | public identifier when active |
| Avatar reference | personal/public according to visibility |
| Lifecycle state | internal; coarse availability may be public |
| Suspension reason | restricted |
| Moderation evidence | highly restricted |
| Module external subject id | confidential cross-system identifier |
| Operation and IP context | restricted security data |
| Legal hold data | highly restricted |
| State and content hashes | internal integrity data |

### Purpose limitation

Profile data is used for Character presentation and discovery only under the configured policy. It MUST NOT be repurposed for advertising, credit, employment, health, or unrelated profiling without a separate legal and product basis.

Module Associations are used for identity resolution. They MUST NOT become a cross-domain behavioral warehouse.

### Public disclosure

Public profile disclosure is opt-in or policy-controlled according to product and jurisdiction.

Public output MUST be generated from effective visibility, not requested visibility alone.

Public caches MUST vary by authorization context where authenticated visibility exists. A response generated for an owner or administrator MUST never be cached as public.

### Field-level privacy

Where field-level visibility is supported:

- each field has a schema-defined maximum audience;
- owner preference can only narrow disclosure;
- policy can narrow it further;
- unknown fields default to private;
- derived public projections include only allowed fields;
- visibility changes increment profile version;
- projection rebuild applies current policy.

### Children and protected users

The Character Engine SHOULD consume only a coarse restriction level rather than exact age.

Policy MAY enforce:

- private profile default;
- disabled public directory;
- pre-moderation of all free text;
- restricted handle creation;
- disabled Module cross-link display;
- restricted data export delivery;
- guardian-mediated actions through the account system.

The Engine MUST not infer age from profile content.

### Owner access

An authenticated owner MAY access current Character state and profile history subject to safety, legal, and security restrictions.

Owner access does not include:

- internal fraud signals;
- third-party reports;
- moderator identity;
- protected legal information;
- secrets or security controls;
- unrelated Module data.

### Data export

A Character export SHOULD include:

- Character identifiers and lifecycle history in understandable form;
- current profile and owner-submitted revisions still retained;
- visibility settings;
- handle history where legally appropriate;
- presentation selections;
- Module Association summaries without exposing third-party secrets;
- Character Engine operation history at an appropriate level;
- references to other Engines' separate export domains.

The Character Engine MUST NOT fabricate a complete platform export by synchronously scraping other Engines. A platform privacy orchestrator coordinates per-component exports.

Export security:

- requester re-authentication;
- asynchronous generation;
- encrypted artifact;
- short-lived signed access;
- one-time or bounded download;
- audit;
- no inclusion of erased content;
- safe handling of minors and delegated access.

### Closure and erasure

Closure is operational deactivation. Erasure is a privacy process.

The product MUST not describe closure as deletion when data remains during recovery or retention.

Erasure may result in anonymization rather than physical deletion when minimum records are required for:

- identifier uniqueness;
- fraud and abuse prevention;
- legal claims;
- financial or security obligations outside this Engine;
- Event and referential integrity;
- audit of privileged actions.

Retained records MUST be minimized and inaccessible for ordinary product use.

### Anonymization details

Anonymization SHOULD use one or more of:

- row field deletion;
- replacement with non-identifying fallback values;
- owner relationship detachment;
- keyed token replacement;
- encryption key destruction;
- external subject ciphertext deletion;
- search document deletion;
- profile revision content deletion or redaction;
- log and audit access restriction;
- retention expiration.

The method MUST be documented per field and tested.

The tombstone SHOULD contain:

- Character ID;
- terminal state;
- created and anonymized times;
- non-sensitive policy version;
- minimum state hash;
- optional non-reversible owner token for duplicate/fraud controls;
- privacy workflow reference.

### Event privacy

Broad lifecycle Events SHOULD contain Character ID and state only.

Owner User ID and Module external subject ids belong only on restricted topics or in audience-specific payloads.

Profile free text SHOULD NOT be published in general domain Events. Consumers use privacy-filtered projections or protected snapshot delivery.

Event retention must account for the fact that immutable logs can preserve personal data. Therefore personal payload minimization is required at design time.

### Search privacy

Search and directory systems are high-risk copies.

Requirements:

- index only effective listed profiles;
- maintain source aggregate and profile versions;
- high-priority delete Event;
- periodic full reconciliation;
- deletion verification;
- no indexing of pending/rejected content;
- no index of private owner identifiers;
- query log minimization and retention;
- anti-scraping controls;
- no stale restore after replay.

### Analytics

Analytics Events SHOULD use Character ID or approved pseudonymous analytics identifier and avoid profile free text.

Analytics use must respect:

- consent and legal basis;
- purpose limitation;
- retention;
- region;
- opt-out where applicable;
- deletion/anonymization propagation;
- aggregation thresholds.

The analytics warehouse is not an authoritative Character store.

### Cross-region processing

If the platform uses regional storage:

- Character residency routing is explicit;
- cross-region replication is documented;
- public read copies contain minimized data;
- owner and Module identifiers are protected;
- transfers are audited;
- anonymization propagates to replicas and backups according to policy;
- disaster recovery does not violate residency or erasure guarantees.

### Backup privacy

Backups may retain erased data until expiration. Access is restricted and restoration procedures MUST reapply post-backup tombstones and privacy workflows before restored systems serve traffic.

A restored environment MUST process an erasure ledger or tombstone feed before public availability.

### Privacy incident response

The Engine MUST support:

- identifying affected Characters and fields;
- finding exposed projections and Event audiences;
- emergency public suppression;
- credential and access revocation;
- cache purge and search deindexing;
- preservation of security evidence;
- targeted data export or deletion;
- downstream consumer notification;
- post-incident reconciliation.

---

## Performance

Performance requirements are baseline service objectives. Capacity targets MUST be validated with realistic profile sizes, moderation latency, handle contention, Event duplication, search indexing, privacy workflows, and hot-Character behavior.

### Availability objectives

Recommended initial objectives:

- authoritative Character mutation ingestion: `99.95%` monthly excluding approved maintenance;
- owner Character read API: `99.95%` monthly;
- public profile read API: `99.95%` monthly;
- handle resolution: `99.95%` monthly;
- administration and privacy control plane: `99.9%` monthly;
- no acknowledged authoritative mutation may be lost.

A dependency outage must not cause insecure fallback. It is preferable to delay publication or reject a write than to bypass authorization, moderation, privacy, or idempotency.

### Latency objectives

Under normal production load:

- Character creation authoritative commit: p50 <= 80 ms, p95 <= 300 ms, p99 <= 1 s, excluding required asynchronous moderation;
- profile submission commit: p50 <= 50 ms, p95 <= 250 ms, p99 <= 1 s;
- visibility tightening commit: p95 <= 200 ms, p99 <= 750 ms;
- owner Character detail read: p95 <= 100 ms, p99 <= 300 ms;
- public profile read: p95 <= 100 ms, p99 <= 300 ms;
- handle resolution: p95 <= 50 ms, p99 <= 150 ms;
- Module Association resolution: p95 <= 100 ms, p99 <= 300 ms;
- administrative Character view: p95 <= 1 s for bounded history;
- standard projection freshness: 99% within 2 seconds;
- privacy-tightening projection and cache invalidation: 99% within 2 seconds, 99.9% within 30 seconds;
- outbox publication: 99% within 2 seconds, 99.9% within 30 seconds;
- search directory update: 99% within 5 seconds for normal updates;
- search deindex after closure/privacy suppression: 99% within 2 seconds, 99.9% within 30 seconds.

These objectives do not permit stale public disclosure after authoritative privacy restriction. Public read paths SHOULD check a fast authoritative suppression cache or tombstone path when search and content caches may lag.

### Throughput objectives

The initial production benchmark SHOULD demonstrate at least:

- 500 sustained Character mutations per second per deployment region;
- 5,000 public profile reads per second per region;
- 10,000 handle resolutions per second per region with cache;
- burst of 2,000 profile submissions per second for 5 minutes;
- 10% duplicate Event delivery without duplicate effects;
- 100 concurrent writes to one Character serialized without lost updates;
- 100,000 Character closures processed by a controlled asynchronous job without starving live traffic;
- search and projection rebuild independently throttled.

Actual launch traffic may be lower, but the architecture MUST not require ownership or data model redesign to reach these baselines.

### Partitioning strategy

The primary mutation partition key is `character_id`.

Benefits:

- all Character writes serialize locally;
- profile, lifecycle, presentation, and association state remain consistent;
- load spreads across Characters;
- downstream consumers can preserve per-Character order.

Creation before `character_id` assignment MAY partition by `owner_user_id` and slot key to prevent duplicate concurrent creation.

Handle uniqueness is a secondary global contention domain. The Handle Registry MUST use a unique database constraint or equivalent strongly consistent reservation. Cache-only uniqueness is prohibited.

### Concurrency control

Supported approaches:

- row-level lock on Character;
- compare-and-swap aggregate version;
- broker partition affinity plus database versioning;
- actor-style serialization.

The database transaction remains the final consistency boundary.

On optimistic conflict, the Engine MAY retry internal projection-driven commands with bounded jitter. Owner profile commands SHOULD return a version conflict so the user can reconcile edits.

### Caching

Public profile and Character Card projections MAY be cached.

Cache keys MUST include:

- Character ID or normalized handle;
- audience class;
- profile version;
- relevant policy version;
- locale only when presentation differs;
- asset delivery variant.

Cache rules:

- private or owner responses are never stored in shared public cache;
- lifecycle suppression uses short-lived or push-invalidated negative state;
- privacy tightening invalidates all audience variants;
- anonymized tombstones prevent stale cache repopulation;
- cache miss loads from privacy-filtered projection, not raw profile tables;
- cache failure degrades to authoritative or safe hidden response, not broader disclosure.

### Handle lookup performance

Handle lookup SHOULD use:

- deterministic normalization in application code;
- unique indexed normalized handle;
- read-through cache for active assignments;
- negative caching with short TTL and enumeration safeguards;
- suppression check before public resolution;
- periodic cache-to-database reconciliation.

A handle change MUST invalidate old and new lookup keys.

### Profile write amplification

A profile submission may create:

- operation record;
- immutable revision;
- profile row update;
- field visibility changes;
- handle or presentation changes;
- lifecycle-safe audit record;
- one or more outbox Events.

The implementation MUST keep transactions bounded and avoid synchronous search indexing, notification, or external Engine calls.

### Event amplification

One lifecycle transition can affect many downstream Engines. The Character Engine publishes one compact canonical Event rather than one Event per downstream consumer.

Privacy workflows may create consumer-specific propagation requests, but these are asynchronous and bounded by a registered consumer inventory.

### Read projection composition

Public profile projection SHOULD be denormalized for one bounded read.

N+1 calls to Media, Inventory, Achievement, or Progression services are prohibited on the public profile critical path.

Referenced resource display metadata SHOULD be supplied by local projections or client-side resource catalogs with versioned fallbacks.

### Moderation workload

Moderation is asynchronous and isolated from authoritative profile submission.

The Engine MUST support:

- queue partitioning by policy and risk;
- prioritization;
- deduplication of identical content hashes where policy permits;
- stale revision suppression;
- bounded retries;
- backpressure;
- fallback to previous approved profile;
- queue age metrics.

### Privacy workflow performance

Anonymization and bulk closure are asynchronous control-plane workloads.

They MUST support:

- configurable batch size;
- per-Character transaction boundaries;
- checkpointing;
- pause and resume;
- downstream acknowledgement tracking;
- retry with exponential backoff;
- legal hold pause;
- live traffic priority;
- verification stage;
- completion SLO reporting.

No privacy workflow may lock a Character row for long-running network calls.

### Search indexing

Search projection workers MUST:

- process Events idempotently;
- enforce monotonic aggregate and profile versions;
- prioritize delete/suppress operations;
- batch ordinary updates;
- detect version gaps;
- rebuild from authoritative privacy-filtered projection;
- avoid indexing when state is ambiguous;
- expose index lag and deletion verification metrics.

### Database query requirements

- direct Character lookup uses primary key;
- owner Character list uses indexed owner and slot key;
- handle lookup uses unique normalized index;
- profile revision list uses Character/time cursor;
- lifecycle and operation history use Character/version or time cursor;
- association resolution uses Module namespace and keyed subject hash;
- no offset pagination on large tables;
- no unbounded wildcard query on profile content;
- no full table scan from interactive APIs;
- query plans for critical paths are load-tested.

### Backpressure

When overloaded, the Engine MUST:

- protect lifecycle, privacy tightening, and security operations;
- prioritize live owner mutations over rebuild and analytics;
- prioritize closure/deindex over ordinary search enrichment;
- pause bulk and repair jobs;
- expose queue depth and oldest age;
- reject synchronous requests with retryable status rather than indefinite timeout;
- avoid unbounded in-memory queues;
- enforce producer quotas;
- retain durable Events until processed.

### Workload classes

The implementation SHOULD isolate:

1. authoritative owner writes;
2. lifecycle and security writes;
3. privacy writes;
4. public reads;
5. owner reads;
6. handle resolution;
7. Module Association resolution;
8. moderation processing;
9. search projection;
10. reconciliation and replay;
11. bulk closure/anonymization;
12. analytics export.

### Capacity safety limits

Initial recommended limits:

- maximum 10 non-anonymized Characters per User at platform hard ceiling, even if product default is one;
- maximum 100 profile revisions retained in hot storage per Character before archive policy;
- maximum 50 Module Associations per Character in initial deployment;
- maximum 32 presentation slots;
- maximum 20 active restrictions;
- maximum 16 KiB profile write body;
- maximum 8 KiB association metadata hard ceiling, with lower schema limits;
- maximum 100 ids per internal batch get;
- maximum 100 items per list page;
- maximum 10 handle checks per minute per untrusted principal before stricter risk controls;
- maximum one active anonymization workflow per Character.

These are configurable platform safety limits, not promises to product clients.

### Resilience tests

Performance and resilience tests MUST include:

- database failover during profile update;
- broker duplicate and out-of-order delivery;
- outbox publisher pause;
- cache loss;
- search index unavailability;
- moderation backlog;
- Media Service delay;
- entitlement projection gap;
- hot handle contention;
- concurrent close and profile update;
- concurrent restore and anonymization;
- duplicate Character creation for one owner slot;
- invalid Event storm from one Module;
- public scraping load;
- regional failover;
- backup restore followed by privacy tombstone replay;
- bulk closure during peak traffic.

---

## Audit

### Audit principles

1. Every accepted Character mutation is explainable.
2. Every rejected privileged request is traceable.
3. Ownership and lifecycle changes are non-repudiable within platform identity guarantees.
4. Profile revision history is immutable while retained.
5. Moderation decisions are attributable and reviewable.
6. Privacy destruction has explicit authorization, checkpoints, and verification.
7. Repair adds history; it does not erase evidence.
8. Audit access is itself audited.
9. Audit content is minimized and protected according to sensitivity.
10. State hashes and version continuity support tamper detection.

### Audit record categories

The Engine MUST audit:

- Character creation and activation;
- duplicate and conflicting creation attempts;
- profile submissions, approvals, rejections, hiding, and restoration;
- visibility and directory changes;
- handle checks at aggregate abuse level and all handle assignments or releases;
- presentation selection and automatic deactivation;
- Module Association creation, change, conflict, and revocation;
- suspension, restriction amendment, reactivation, closure, and restoration;
- export, legal hold, anonymization, and privacy propagation;
- rejected or conflicting idempotency requests;
- authorization failures for privileged operations;
- administrative reads of sensitive data;
- bulk jobs;
- Event replay, quarantine, and repair;
- emergency controls;
- schema and policy publication affecting runtime behavior.

### Required audit fields

Each audit record SHOULD include:

- audit event id;
- action type;
- principal type and protected principal id;
- authenticated service identity;
- delegated identity where applicable;
- authorization scope and decision;
- target Character or association;
- operation id;
- source Event id;
- request and correlation ids;
- source network/workload identity where appropriate;
- before and after state summaries;
- aggregate and profile versions;
- policy versions;
- reason code;
- case, ticket, workflow, or approval reference;
- result;
- timestamp;
- environment and region;
- application version;
- state and content hash references.

Free-text profile values SHOULD NOT be duplicated into general audit logs. Audit records reference restricted revisions.

### Lifecycle history as domain evidence

`character_lifecycle_transition` explains domain state but does not replace security audit.

A lifecycle transition SHOULD be hash chained:

```text
transition_hash = HASH(
    previous_transition_hash
    + canonical_transition_content
    + resulting_state_hash
)
```

The genesis value and canonical serialization version are documented.

### Profile revision evidence

Profile revisions store normalized content hash, moderation policy version, decision reference, source operation, and activation state.

When content is removed by retention or anonymization, the system MAY retain a non-reversible hash if legally permitted and operationally useful. The hash MUST not be used to reconstruct content or create an indefinite behavioral fingerprint without policy approval.

### Handle audit

Handle audit MUST establish:

- normalization input category and resulting canonical handle;
- policy version;
- reservation and assignment times;
- prior and new Character references where allowed;
- cooldown or block reason;
- actor and approval for protected reassignment;
- lookup index propagation.

Public support views do not expose full historical assignees.

### Moderation audit

Moderation audit includes:

- assigned queue;
- automated signals reference;
- reviewer role;
- decision;
- reason category;
- policy version;
- decision time;
- appeal or override relationship;
- content revision reference;
- any subsequent hide or restore.

The identity of reporters or protected reviewers is access controlled.

### Privacy audit

Privacy workflows require:

- requester and verification;
- legal basis category;
- retention policy version;
- recovery deadline;
- legal hold checks;
- approvals;
- stage timestamps;
- fields/actions completed;
- downstream consumers notified;
- acknowledgements;
- failures and retries;
- final verification;
- terminal tombstone hash.

Audit must prove that the workflow executed without retaining erased content in the audit payload itself.

### Explain endpoint

A privileged explain operation SHOULD return:

```text
source request/Event
  → principal authentication
  → owner/service authorization
  → idempotency result
  → prior Character and profile versions
  → lifecycle and restriction evaluation
  → normalization and policy versions
  → moderation/media/entitlement projection state
  → uniqueness checks
  → resulting state
  → lifecycle/profile revision records
  → outbox Events
  → projection and search status
```

### Tamper detection

Reconciliation SHOULD verify:

- aggregate version continuity;
- state hash against canonical state;
- lifecycle transition hash chain;
- profile revision content hash where content remains;
- operation-to-outbox completeness;
- active handle uniqueness;
- active association uniqueness;
- anonymization field emptiness;
- public projection privacy match.

### Audit retention and access

Audit retention differs by category and legal region.

Access is role-based, purpose-limited, and logged. Bulk export of audit records requires approval. Audit stores MUST support legal hold without making records generally visible.

---

## Edge Cases

### Duplicate Character creation

**Scenario:** account onboarding retries the same creation Event.

**Required behavior:** the same idempotency key and canonical payload return the original Character. No second Character, profile, handle reservation, or `character.created` Event is created.

### Concurrent Character creation for one slot

**Scenario:** two different requests attempt to create `primary` Character for one User.

**Required behavior:** database uniqueness permits one success. The other request receives `CHARACTER_SLOT_OCCUPIED`. If requests represent the same logical onboarding but use different keys, the losing result MAY return the existing Character only when producer authorization and policy allow safe convergence.

### Event id reused with different payload

**Scenario:** an inbound Event id is replayed with altered content.

**Required behavior:** quarantine, security alert, no state mutation.

### Idempotency key reused with different profile update

**Required behavior:** reject `IDEMPOTENCY_CONFLICT`; do not apply either new interpretation.

### Concurrent profile edits

**Scenario:** two sessions edit profile version 11.

**Required behavior:** one commits version 12. The other receives `VERSION_CONFLICT` and current version. No silent last-write-wins.

### Pending moderation followed by newer update

**Scenario:** revision A is pending; owner submits revision B.

**Required behavior:** both remain immutable. Policy marks A superseded. Late approval of A does not replace B or the current approved revision unless explicitly reactivated by authorized moderation workflow.

### Moderation Event arrives before profile transaction visibility

**Required behavior:** consumer retries or buffers based on revision id. It MUST not create a synthetic revision.

### Media asset approved after profile submission

**Required behavior:** selection remains pending or uses previous avatar until the approved Media Event arrives. Activation increments effective profile version and publishes `character.profile.updated.v1` or presentation Event.

### Media asset later rejected

**Required behavior:** deactivate the asset reference, apply safe fallback, publish effective profile change, preserve history, and optionally submit moderation action. Do not delete unrelated profile fields.

### Entitlement revoked for equipped title

**Required behavior:** mark selection `INACTIVE_NOT_ENTITLED`, apply fallback, publish `character.presentation.changed.v1`, retain selection history. Character Engine does not revoke the entitlement itself.

### Entitlement Event arrives out of order

**Required behavior:** ignore stale source version. A stale grant cannot override a newer revoke.

### Unknown entitlement state

**Required behavior:** treat as not active or pending according to slot policy. Never default to entitled.

### Handle collision after normalization

**Scenario:** visually different input normalizes to an active handle.

**Required behavior:** reject as unavailable. Uniqueness is on normalized form.

### Handle normalization algorithm update creates collision

**Required behavior:** publication is blocked until migration analysis resolves every collision. Existing assignments are not silently changed.

### Handle reservation expires during creation

**Required behavior:** the creation transaction either atomically activates the reservation or fails. An expired standalone reservation cannot be reused without a new operation.

### Old handle cached after rename

**Required behavior:** invalidate old key. Redirect is allowed only under explicit policy and must respect privacy and closure. Otherwise old handle resolves as unavailable/not found.

### Closed Character's handle requested by another User

**Required behavior:** enforce cooldown or protected reservation. Do not immediately release if impersonation risk exists.

### Private Character requested publicly

**Required behavior:** return privacy-safe not-found response. Do not reveal private state.

### Search index contains Character after privacy tightening

**Required behavior:** public profile gateway suppression prevents disclosure even before deindex completes. High-priority deletion retries and alerting begin.

### Profile cache contains old public response after suspension

**Required behavior:** lifecycle suppression key or authoritative policy check invalidates/blocks cached content. Stale public disclosure is treated as an incident.

### Module sends Character ID belonging to another external subject

**Required behavior:** association uniqueness and producer namespace validation reject the link. Existing association remains unchanged.

### Two Modules use the same external subject string

**Required behavior:** no conflict because uniqueness includes Module key and instance. Cross-Module correlation is not inferred.

### Module Association active while Character closes

**Required behavior:** association remains historical but becomes unusable for normal resolution. `character.closed.v1` drives Module projection behavior. The Character Engine need not rewrite every association synchronously.

### Module removes business membership

**Required behavior:** Module may inactivate or revoke its identity association if no longer needed. Character lifecycle and other Module Associations remain unchanged.

### Owner account suspended while Character already independently suspended

**Required behavior:** add or update independent restrictions. Account reactivation clears only the account-derived restriction. Character remains suspended if another blocking restriction exists.

### Suspension expires automatically

**Required behavior:** an authorized scheduler issues a re-evaluation command. Time passage alone does not mutate state. If no blocking restrictions remain, publish reactivation; otherwise remain suspended.

### Profile privacy change while suspended

**Required behavior:** allow changes that make visibility stricter. Reject expansion or unrelated profile edits unless policy permits.

### Close and profile update race

**Required behavior:** aggregate serialization allows one order. If closure commits first, profile update is rejected. If profile update commits first, closure then hides it. No public projection may publish profile content after a higher aggregate-version closure.

### Close and suspend race

**Required behavior:** one transition commits first. Closure is valid from Active or Suspended. Final state is Closed. Restrictions remain in history.

### Restore and anonymize race

**Required behavior:** workflow lock and aggregate version allow only one destructive direction. Once anonymization begins its irreversible stage, restore is rejected. Before that point, policy may cancel anonymization and restore through explicit workflow action.

### Restore after recovery deadline

**Required behavior:** ordinary owner restore is rejected. Exceptional administrative restore requires dedicated approval and is impossible after anonymization.

### Anonymization under legal hold

**Required behavior:** workflow pauses before destructive step with `LEGAL_HOLD_ACTIVE`. Public suppression remains. No partial erasure is represented as complete.

### Anonymization interrupted after profile erasure

**Required behavior:** resume from checkpoint. Erased values are not restored. Terminal Event publishes only after authoritative minimum steps complete.

### Backup restored from before anonymization

**Required behavior:** restored environment consumes privacy tombstone ledger before serving traffic, re-applies anonymization, and verifies search/cache deletion.

### Downstream Engine misses `character.closed.v1`

**Required behavior:** consumer detects version gap or reconciliation compares eligibility projection. Character Engine can replay the Event or serve bounded bootstrap state. No synchronous distributed transaction is assumed.

### Character Event arrives before downstream aggregate creation

**Required behavior:** consumer creates or updates its local eligibility projection only. It does not require a preexisting progression or inventory aggregate.

### Downstream consumer receives reactivation before suspension

**Required behavior:** aggregate version ordering causes stale suspension or reactivation to be ignored appropriately. Consumers may buffer gaps or fetch current state.

### Character not found for trusted internal Event

**Required behavior:** retry only when Event ordering could explain absence, such as creation Event lag. Otherwise quarantine and alert. Do not auto-create a Character from unrelated Events.

### Public profile request for anonymized Character

**Required behavior:** no profile data. Response follows anti-enumeration policy or a generic gone state when product/legal policy permits disclosure.

### Display name becomes empty after normalization

**Required behavior:** reject validation. Do not store invisible-only names.

### Biography exceeds scalar or byte limit

**Required behavior:** reject with field-specific limit code. Do not truncate silently.

### Malicious Unicode control sequence

**Required behavior:** reject or sanitize according to versioned field policy, retain safe moderation evidence only if authorized, and do not render raw content in admin HTML.

### Unknown profile field in field mask

**Required behavior:** reject entire command. Do not ignore unknown write fields because that can hide client/server contract bugs.

### Unknown Event enum value

**Required behavior:** if contract permits forward-compatible unknown values, quarantine or apply safe default according to field. Lifecycle unknown values MUST fail closed.

### Search unavailable during Character creation

**Required behavior:** creation commits. Search projection retries. Character remains undiscoverable until index is ready.

### Moderation unavailable during profile update

**Required behavior:** submission commits as pending; current approved profile remains public. Policy may reject new public expansion until moderation returns.

### Authorization service unavailable

**Required behavior:** owner and privileged writes fail closed unless a validated, unexpired local authorization decision explicitly supports the action. Public reads may continue from privacy-filtered cache if suppression controls remain available.

### Outbox publisher unavailable

**Required behavior:** state commits with pending outbox. Alerts fire on lag. No manual duplicate mutation is required. Publisher resumes from durable rows.

### Database commit succeeds but client times out

**Required behavior:** client retries with same idempotency key and receives original result.

### Public projection has version greater than replayed Event

**Required behavior:** ignore stale Event. Rebuild never decrements source version unless the projection is explicitly reset in an isolated operation.

### Multiple Character support enabled later

**Required behavior:** existing Character remains in `primary` slot. APIs and owner indexes already support multiple slots. No Character ID migration is required.

### User account merge requested

**Required behavior:** reject or quarantine until a dedicated ownership migration workflow and ADR exist. Do not directly replace `owner_user_id`.

### Character merge requested

**Required behavior:** unsupported. Provide export or account-level alternatives. No automatic merge of downstream Engine state.

### Direct database correction requested by support

**Required behavior:** prohibited. Use audited repair command or approved disaster procedure.

---

## Acceptance Tests

The following tests are normative minimums. Implementations MUST add lower-level unit, integration, contract, security, migration, and load tests.

### Character creation

**AT-001 — Create primary Character**

Given an eligible User without a primary Character, when an authorized creation command is processed, then exactly one Active Character, owner relationship, baseline profile, operation record, lifecycle transition, and `character.created.v1` outbox Event are committed.

**AT-002 — Duplicate creation retry**

Given a completed creation operation, when the same producer, idempotency key, and canonical payload are retried, then the original result is returned and no versions or Events are added.

**AT-003 — Conflicting idempotency key**

Given a completed creation operation, when the same idempotency key is reused with a different normalized profile, then `IDEMPOTENCY_CONFLICT` is returned and state is unchanged.

**AT-004 — Concurrent slot creation**

Given two concurrent different requests for one owner slot, then at most one Character is created and the database uniqueness invariant holds.

**AT-005 — Invalid owner**

Given an unauthorized or ineligible owner reference, Character creation is rejected without leaking account details.

**AT-006 — No downstream eager state**

After Character creation, Character Engine storage contains no Experience, Inventory, Quest, Achievement, Reward, Talent, or Reputation state.

### Profile mutation

**AT-010 — Immediate approved profile update**

Given an Active owner and a field allowed without review, update creates a revision, increments profile and aggregate versions, updates effective profile, and publishes submission and update Events.

**AT-011 — Pending moderation**

Given a field requiring review, update creates a pending revision while public projection remains on the prior approved revision.

**AT-012 — Moderation approval**

Given a current pending revision, authorized approval activates it exactly once and publishes an effective profile update.

**AT-013 — Superseded moderation approval**

Given revision A superseded by revision B, late approval of A does not replace B or newer approved state.

**AT-014 — Moderation rejection**

Rejected revision remains immutable, current approved profile remains unchanged, owner receives policy-safe status, and public Event contains no rejected free text.

**AT-015 — Optimistic concurrency**

Two writes using the same expected profile version cannot both succeed.

**AT-016 — Field mask semantics**

Omitted fields remain unchanged; explicit null clears nullable included fields; unknown fields reject the command.

**AT-017 — Unicode normalization**

Equivalent normalized profile inputs produce the same canonical request hash and validation result.

**AT-018 — Invisible display name**

A display name consisting only of invisible or stripped characters is rejected.

**AT-019 — Stored XSS defense**

Profile content containing executable markup cannot execute in public or administration rendering and is rejected or safely encoded according to policy.

### Visibility and directory

**AT-020 — Privacy tightening**

Changing a public listed profile to private unlisted commits immediately, publishes high-priority visibility Event, and public gateway stops disclosure before or independent of search deindex completion.

**AT-021 — Policy override**

Owner-requested public visibility remains effectively hidden when lifecycle or moderation policy requires suppression.

**AT-022 — Private anti-enumeration**

Unauthorized lookup of a private Character is indistinguishable from allowed not-found behavior.

**AT-023 — Directory eligibility**

Only Active, approved, effectively listed Characters appear in the directory projection.

**AT-024 — Stale directory Event**

A lower profile or aggregate version cannot reindex a Character after closure or privacy tightening.

### Handle management

**AT-030 — Handle uniqueness**

Two handles that normalize to the same canonical value cannot both be active in one namespace.

**AT-031 — Atomic rename**

Handle rename activates the new handle and moves the old handle to cooldown without an interval where both can be assigned to different Characters.

**AT-032 — Handle retry**

Exact duplicate rename returns original outcome without extending cooldown or adding history.

**AT-033 — Handle enumeration protection**

Untrusted availability API does not reveal whether a handle is assigned, blocked, reserved, or cooling down.

**AT-034 — Handle policy migration**

A normalization version cannot be published if it creates unresolved active collisions.

### Presentation selections

**AT-040 — Valid selection**

Given matching active entitlement and approved asset projections, selection becomes Active and publishes presentation change.

**AT-041 — Missing entitlement**

A selection cannot become Active when required entitlement is missing.

**AT-042 — Entitlement revocation**

A newer revoke Event deactivates the selection, applies fallback, and stale grant replay cannot reactivate it.

**AT-043 — Asset rejection**

Rejected avatar asset is removed from effective profile without deleting the Profile Revision history.

**AT-044 — Character Engine does not grant**

Selecting a resource creates no entitlement in Inventory, Achievement, Reward, or Item storage.

### Module Associations

**AT-050 — Authorized association**

Registered Module producer can create an association only in its own Module and instance namespace.

**AT-051 — Cross-Module rejection**

A producer cannot resolve or mutate another Module's external subjects.

**AT-052 — External subject uniqueness**

One active external subject uniqueness key cannot map to two Characters.

**AT-053 — Business semantics excluded**

Association schema rejects unregistered membership, subscription, lesson, order, or role payload fields.

**AT-054 — Closed Character resolution**

An association may remain stored after closure but normal resolution returns ineligible/no result according to policy.

### Suspension and reactivation

**AT-060 — Suspend Active Character**

Suspension changes lifecycle, hides public profile when configured, writes restriction and history, and publishes `character.suspended.v1` atomically.

**AT-061 — Independent restrictions**

Clearing one of two blocking restrictions does not reactivate the Character.

**AT-062 — Final restriction cleared**

Clearing the final lifecycle-blocking restriction transitions to Active and publishes reactivation.

**AT-063 — Suspended profile privacy tightening**

A suspended owner can make profile more private while ordinary profile expansion remains blocked.

**AT-064 — Downstream ownership boundary**

Suspension publishes Event but does not directly write Progression, Inventory, Quest, or Module databases.

### Closure and restoration

**AT-070 — Owner closure**

Closing an Active Character sets Closed, hides profile/directory, records recovery deadline, and publishes `character.closed.v1`.

**AT-071 — Duplicate closure**

Exact duplicate closure is idempotent.

**AT-072 — Close/profile race**

Concurrent closure and profile update serialize without public content at a version later than closure.

**AT-073 — Restore within window**

Closed Character restores with the same Character ID after current account and policy checks.

**AT-074 — Restore expired**

Ordinary restoration after deadline is rejected.

**AT-075 — Restore after anonymization**

Anonymized Character cannot be restored by any normal or administrative API.

### Anonymization and privacy

**AT-080 — Legal hold blocks anonymization**

An active legal hold pauses workflow before destructive changes and leaves public profile suppressed.

**AT-081 — Terminal anonymization**

Completed anonymization removes direct owner and personal profile fields, hides projections, preserves minimal tombstone, and publishes minimized `character.anonymized.v1`.

**AT-082 — No personal terminal Event payload**

Anonymized Event contains no owner User ID, handle, display name, biography, asset, or external Module subject id.

**AT-083 — Interrupted workflow retry**

Failure after one destructive stage resumes from checkpoint without reintroducing erased data.

**AT-084 — Search deletion verification**

Privacy workflow does not report verified completion until registered search projection deletion is acknowledged or explicitly handled by policy.

**AT-085 — Backup restoration privacy**

Restoring a pre-anonymization backup and replaying tombstones results in no active personal profile or public search document.

**AT-086 — Export authorization**

Only the owner or authorized privacy actor can create export, artifact expires, and access is audited.

### Events and idempotency

**AT-090 — State and outbox atomicity**

Failure before commit produces neither state change nor visible outbox Event. Commit produces both.

**AT-091 — Publisher retry**

Outbox delivery retries may duplicate broker delivery but consumers can identify the same Event id.

**AT-092 — Event payload conflict**

Same inbound Event id with different hash is quarantined and does not mutate state.

**AT-093 — Out-of-order lifecycle Event**

Consumer projection does not apply a lower aggregate version after a higher version.

**AT-094 — Operation timeout retry**

When client times out after commit, retry with same key returns original result.

### Authorization and security

**AT-100 — IDOR prevention**

Authenticated User cannot read or modify another User's owner Character detail by guessing Character ID.

**AT-101 — Public data minimization**

Public profile never includes owner User ID, lifecycle reason, moderation evidence, Module external subject, or pending content.

**AT-102 — Service producer scope**

Unregistered producer cannot publish lifecycle or association commands.

**AT-103 — Admin separation**

Support reader cannot suspend, anonymize, remove legal hold, or repair state.

**AT-104 — Step-up action**

Closure or high-risk handle change fails when required recent authentication is absent.

**AT-105 — Log redaction**

Automated tests verify raw biography, access tokens, and external subject ids are absent from application logs.

### Reconciliation and recovery

**AT-110 — State hash reconciliation**

Reconciliation detects a mismatched canonical Character state hash.

**AT-111 — Missing outbox detection**

A committed aggregate version without required outbox Event is detected and repaired through approved additive process.

**AT-112 — Handle index reconciliation**

Active handle registry and public resolution projection converge after targeted rebuild.

**AT-113 — Search stale disclosure detection**

Reconciliation identifies a listed search document for a private, Closed, Suspended-hidden, or Anonymized Character.

**AT-114 — Projection rebuild privacy**

Rebuilding from historical Events cannot resurrect a profile hidden by a newer authoritative terminal state.

### Performance and resilience

**AT-120 — Hot Character concurrency**

One hundred concurrent writes do not lose updates or violate aggregate version continuity.

**AT-121 — Duplicate storm**

Ten percent duplicate Event load does not create duplicate effects and remains within defined latency degradation budget.

**AT-122 — Search outage**

Character writes continue while directory publication retries; private/suppressed profiles remain non-public.

**AT-123 — Moderation outage**

Profile submissions remain pending and previous approved state remains public.

**AT-124 — Database failover**

No acknowledged operation is lost and retry does not duplicate effects.

**AT-125 — Bulk closure isolation**

Bulk closure job stays within configured resource share and does not violate live mutation SLO beyond approved budget.

### Contract tests

Every Event and API schema MUST have:

- producer validation tests;
- consumer compatibility tests;
- unknown field tests;
- enum evolution tests;
- maximum-size tests;
- canonical serialization tests;
- redaction tests;
- idempotency hash fixtures;
- example payload validation.

---

## Future Extensions

Future work is allowed only when it preserves current ownership boundaries or introduces an explicit ADR.

### Multiple Characters per User

Enable additional slot policies, Character selection, archive rules, and Module Association constraints while preserving existing primary Character IDs.

### Account merge and ownership migration

A controlled protocol may move a Character owner relationship after verified User account merge. It requires:

- source and destination account proof;
- conflict handling for Character slots;
- downstream authorization update;
- audit and rollback boundary;
- privacy review;
- no Character ID change.

### Character merge

Potential future capability to consolidate two Characters. This is high complexity because every Engine must define merge semantics. It requires a platform-wide migration RFC and MUST NOT be implemented only inside Character Engine.

### Delegated management

Guardian, family, team, or organization delegates may receive limited Character management rights without becoming owners. Delegation belongs to an authorization model, not a second owner column.

### Verified Characters

Verification badges or identity proofs may be represented as entitlements or profile presentation resources. Raw verification documents remain outside Character Engine.

### Portable Character identity

Export/import or federation across platform deployments may use signed Character identity manifests, conflict rules, and provenance. Imported progression remains separate and requires per-Engine policy.

### Decentralized identifiers

A future DID or external identity binding could be represented as a verified association. It MUST not replace platform access control without a dedicated security RFC.

### Rich profile schema

Additional fields may be introduced through versioned, globally registered profile field definitions with privacy, moderation, localization, and retention metadata. Arbitrary Module-defined JSON in core profile remains prohibited.

### Configurable audience policies

Future social or relationship Engines may support audiences such as connections, groups, guilds, or Module members. Character Engine would consume a policy decision or audience projection rather than own the social graph.

### Profile layout composition

Presentation Slot Definitions may evolve into versioned profile layouts with bounded component types. Components remain references and approved text, not arbitrary executable templates.

### Historical identity aliases

Safe redirects or signed alias records may support renamed handles and cross-product links while respecting closure, privacy, and impersonation policy.

### Character provenance

Character may expose a non-personal creation provenance, such as original platform context, without becoming owned by that Module.

### Regional residency routing

Character metadata may include a stable residency or home-region routing key. It must not be exposed publicly and requires migration and disaster recovery rules.

### Advanced moderation

Possible extensions:

- appeals;
- policy simulation;
- multilingual review;
- trusted user tiers;
- content similarity detection;
- coordinated abuse signals;
- transparent owner-facing policy history.

Automated decisions remain reviewable where required.

### Recovery keys and succession

Long-lived Character identity may eventually support estate, succession, or memorialization policy. This requires legal, privacy, and product RFCs and MUST not be modeled as ordinary ownership transfer.

### Character authenticity and anti-fraud

A future Trust Engine may publish verification and risk projections. Character Engine may enforce lifecycle restrictions through authorized Events but does not own risk scoring.

### Event audience segmentation

The platform may introduce public, internal, restricted identity, and privacy Event channels generated from one authoritative transition to minimize broad personal-data distribution.

### Cryptographic transparency

State or lifecycle hash checkpoints may be anchored in an external tamper-evident log for high-trust deployments.

---

## ADR References

The following ADRs are normative dependencies or required follow-up decisions.

### Existing architectural principles

- **ADR-001 — Platform First:** Character belongs to Progression Platform, not a Business Module.
- **ADR-002 — Engine Driven / Event-Driven Architecture:** other components react to Character Events and do not synchronously mutate Character state.
- **ADR-003 — Character Ownership:** Character identity is platform-owned and referenced across modules.

### Normative architecture decisions

The decisions below are ratified by this RFC and the shared platform contract
RFCs. Standalone ADR files MAY mirror them for repository traceability but may
not redefine the contracts independently.

- **ADR-004 — Character Identifier Format:** UUIDv7 is the canonical platform
  identifier format and is generated by the owning service.
- **ADR-005 — Character Lifecycle Semantics:** approve `PENDING`, `ACTIVE`, `SUSPENDED`, `CLOSED`, and `ANONYMIZED` transitions.
- **ADR-006 — User-to-Character Cardinality:** define initial primary-slot policy while preserving multiple-Character storage.
- **ADR-007 — Transactional Outbox and Inbox:** define platform Event delivery and idempotency implementation.
- **ADR-008 — Profile Moderation Model:** define pre- versus post-moderation by field and audience.
- **ADR-009 — Handle Namespace and Normalization:** define allowed scripts, uniqueness, cooldown, and migration.
- **ADR-010 — Profile Visibility Model:** define public, authenticated, private, directory, and future audience policy.
- **ADR-011 — Module Association Security:** define registered Module namespaces and external subject protection.
- **ADR-012 — Presentation Entitlement Projection:** define canonical entitlement Event contract used by Character profile selections.
- **ADR-013 — Character Closure and Anonymization:** define retention, recovery window, tombstone, and legal hold behavior.
- **ADR-014 — Search Privacy and Suppression:** define directory index, deletion SLO, and public gateway suppression.
- **ADR-015 — Character Data Residency:** define regional routing, replication, and backup privacy.
- **ADR-016 — Administrative Separation of Duties:** define roles and approvals for lifecycle, privacy, and repair actions.
- **ADR-017 — State Hash and Audit Chain:** define canonical serialization and tamper-evident verification.

### ADRs required before future extensions

- User account merge and Character ownership migration;
- Character merge;
- delegated or guardian management;
- cross-platform federation;
- relationship-based profile audiences;
- verified Character identity;
- memorialization or succession;
- rich profile component framework.

---

## Appendix

### Appendix A — Responsibility matrix

| Capability | Character Engine | Other owner |
|---|---|---|
| Character ID | authoritative | none |
| Owner relationship | authoritative | User system owns account itself |
| Authentication | no | Identity Provider |
| Lifecycle | authoritative | downstream Engines mirror eligibility |
| Display name and biography | authoritative | none |
| Avatar binary | reference only | Media Service |
| Profile visibility | authoritative | Modules may be stricter locally |
| Handle | authoritative | none |
| Experience and Level | no | Progression Engine |
| Reputation | no | Reputation Engine |
| Reward grant | no | Reward Engine |
| Item definition | no | Item Engine |
| Item ownership | no | Inventory Engine |
| Achievement | no | Achievement Engine |
| Quest | no | Quest Engine |
| Talent | no | Talent Engine |
| Season | no | Season Engine |
| Presentation choice | authoritative selection | entitlement remains owning Engine |
| Business membership | no | Business Module |
| Generic Module identity link | authoritative association registry | Module owns external subject |
| Public search index | source policy | Search projection infrastructure |
| Notification | no | Notification Engine |
| Account privacy orchestration | participant | platform Privacy service |

### Appendix B — Lifecycle permission matrix

| Operation | Pending | Active | Suspended | Closed | Anonymized |
|---|---:|---:|---:|---:|---:|
| Owner read | limited | yes | yes, restricted | yes, restricted | no ordinary profile |
| Public read | no | policy | policy, normally no | no | no |
| Profile update | no/limited | yes | normally no | no | no |
| Privacy tightening | yes | yes | yes | not needed | no |
| Presentation select | no | yes | no | no | no |
| Module Association create | no | yes | policy | no | no |
| Suspend | policy | yes | update restriction | no | no |
| Reactivate | no | no-op | yes | no | no |
| Close | yes | yes | yes | idempotent | no |
| Restore | no | no-op | no | yes | never |
| Export | policy | yes | yes | yes | tombstone only/policy |
| Anonymize | no | no | no | yes | idempotent terminal |

### Appendix C — Effective visibility calculation

Effective profile visibility is the most restrictive result of:

1. owner-requested profile visibility;
2. Character lifecycle policy;
3. active restriction policy;
4. profile moderation state;
5. account protection policy;
6. minor-safe policy;
7. legal or security policy;
8. field-level visibility;
9. asset or entitlement eligibility for referenced resources.

Conceptual ordering:

```text
PUBLIC < AUTHENTICATED < PRIVATE < HIDDEN_BY_POLICY
LISTED < UNLISTED < HIDDEN_BY_POLICY
```

The actual implementation MUST use explicit policy tables or code with versioned tests, not string comparison.

### Appendix D — Character Event consumer rules

All consumers MUST:

- deduplicate by Event id;
- partition or serialize by Character ID;
- store last applied aggregate version;
- ignore stale versions;
- detect gaps where full sequence matters;
- treat unknown lifecycle values as ineligible;
- preserve terminal anonymized state against stale replay;
- avoid synchronous callbacks into Character Engine on every operation;
- expose projection freshness and repair capability;
- minimize retained owner and profile data.

### Appendix E — Recommended reason codes

Reason codes are stable categories, not free text.

Lifecycle examples:

- `CREATED_BY_ONBOARDING`;
- `CREATED_BY_OWNER`;
- `PROFILE_POLICY_VIOLATION`;
- `ACCOUNT_SUSPENDED`;
- `SECURITY_RESTRICTION`;
- `FRAUD_REVIEW`;
- `LEGAL_RESTRICTION`;
- `OWNER_REQUESTED`;
- `ACCOUNT_CLOSED`;
- `PRIVACY_REQUEST`;
- `ABANDONED_PROVISIONING`;
- `RESTRICTION_CLEARED`;
- `OWNER_RECOVERY`;
- `ADMINISTRATIVE_RESTORE`;
- `ANONYMIZED_BY_POLICY`.

Profile examples:

- `APPROVED_AUTOMATICALLY`;
- `APPROVED_BY_MODERATOR`;
- `REJECTED_UNSAFE_CONTENT`;
- `REJECTED_IMPERSONATION`;
- `REJECTED_PERSONAL_DATA`;
- `HIDDEN_PENDING_REVIEW`;
- `ASSET_UNAVAILABLE`;
- `ENTITLEMENT_REVOKED`;
- `OWNER_SELECTED`;
- `OWNER_REMOVED`.

Detailed internal evidence remains outside public reason codes.

### Appendix F — Example creation sequence

```text
User account created
  → onboarding emits character.create.requested.v1
  → Character Engine authenticates producer
  → deduplicates request
  → validates account projection and primary slot
  → creates Character and private baseline Profile
  → commits lifecycle history and outbox
  → publishes character.created.v1
  → Progression Engine updates eligibility projection
  → Inventory Engine updates eligibility projection
  → Module may create identity association
  → public directory remains empty until owner opts in and profile is approved
```

### Appendix G — Example moderated profile sequence

```text
Owner submits biography
  → UpdateProfile command accepted
  → immutable revision created as PENDING_REVIEW
  → prior approved profile remains public
  → moderation request published
  → moderation decision arrives
  → Character Aggregate verifies current revision policy
  → approved revision pointer changes
  → profile and aggregate versions increment
  → character.profile.updated.v1 published
  → public profile and search projections update
```

### Appendix H — Example suspension sequence

```text
Moderation policy issues suspension request
  → restriction record created
  → Character transitions ACTIVE → SUSPENDED
  → effective public and directory visibility become hidden
  → state, history, audit, and outbox commit
  → character.suspended.v1 published
  → downstream Engines update local eligibility
  → search deindex and cache suppression run asynchronously
```

### Appendix I — Example closure and anonymization sequence

```text
Owner requests closure
  → Character transitions to CLOSED
  → public profile suppressed
  → recovery deadline recorded
  → character.closed.v1 published
  → downstream Engines stop normal activity according to their policies

After recovery/retention policy:
  → privacy workflow verifies no legal hold
  → anonymization starts and locks normal mutation
  → profile personal fields erased
  → handle and associations released/revoked under policy
  → tombstone written
  → character.anonymized.v1 published
  → downstream consumers acknowledge privacy action
  → verification completes workflow
```

### Appendix J — Implementation checklist

Before production release, the team MUST confirm:

- aggregate invariants are database- and application-enforced;
- owner IDOR tests pass;
- creation is idempotent under concurrency;
- profile revisions are immutable;
- moderation cannot activate superseded content accidentally;
- visibility tightening has priority suppression path;
- handle normalization and collision corpus tests pass;
- Module Association namespaces are producer-scoped;
- presentation selection does not grant entitlement;
- lifecycle Events match downstream eligibility contracts;
- closure, restore, and anonymization race tests pass;
- backup restore re-applies privacy tombstones;
- search deindex SLO is monitored;
- logs contain no prohibited personal content;
- inbox/outbox recovery is tested;
- admin separation of duties is enforced;
- privacy export and anonymization are auditable;
- load and failover tests meet launch targets;
- every Event schema is registered and compatibility-tested;
- operational runbooks exist.

### Appendix K — Operational runbooks required

The production service MUST have runbooks for:

- Character creation failure or duplicate spike;
- owner authorization incident;
- profile moderation backlog;
- public profile privacy leak;
- search deindex failure;
- handle collision or normalization bug;
- Module Association conflict;
- outbox backlog;
- poison Event and producer revocation;
- lifecycle projection drift in downstream Engines;
- privacy workflow stuck or partially completed;
- legal hold conflict;
- database failover and point-in-time restore;
- regional outage;
- emergency directory shutdown;
- targeted Character reconciliation;
- audit evidence collection.

### Appendix L — Glossary

**Character** — Persistent platform-owned digital identity.

**User** — Authenticated account that owns one or more Characters.

**Owner Relationship** — Authoritative link between Character and User.

**Profile** — Character-owned presentation and visibility source data.

**Profile Revision** — Immutable submitted snapshot of profile source fields.

**Handle** — Optional mutable public locator; not durable identity.

**Presentation Slot** — Configured location for a referenced profile resource.

**Presentation Selection** — Character preference for a resource; not entitlement.

**Module Association** — Generic identity link to an external Module subject; not business membership.

**Restriction** — Independent policy record limiting lifecycle or profile capabilities.

**Closure** — Reversible logical deactivation within policy.

**Anonymization** — Irreversible removal or de-identification of personal Character data.

**Tombstone** — Minimal retained terminal identity record.

**Projection** — Read model derived from authoritative state.

**Aggregate Version** — Monotonic version of all authoritative Character mutations.

**Profile Version** — Monotonic version of effective and submitted profile state.

### Appendix M — Final architectural rules

1. Character belongs to Progression Platform.
2. Character ID is permanent and opaque.
3. User account and Character are different entities.
4. Character Engine owns identity and lifecycle, not progression.
5. Profile contains presentation, not authoritative state from other Engines.
6. Business Modules publish Events and maintain their own business state.
7. Module Association is identity linkage, not membership.
8. Every mutation is authorized, idempotent, versioned, and audited.
9. Other Engines consume lifecycle Events and maintain local eligibility projections.
10. Privacy restriction always wins over stale projection or cache.
11. Closure is not erasure; anonymization is terminal.
12. No support tool or Module may mutate Character tables directly.
13. No synchronous cross-Engine transaction is permitted.
14. Data-driven extension is preferred over Module-specific core columns.
15. Evolution requires compatibility, migration, and explicit ADRs.

> A Character is the durable identity through which real actions become a coherent lifelong journey.
