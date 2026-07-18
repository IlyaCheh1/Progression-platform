---
document: 010-inventory-engine
title: Inventory Engine
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
  - 005-reward-engine
  - 009-item-engine
related_documents:
  - 004-progression-engine
  - 006-achievement-engine
  - 007-quest-engine
  - 008-talent-engine
  - 011-season-engine
---

# Inventory Engine

> **Platform contract conformance:** all Event names, envelopes, Reward owner
> results, Item manifests, and lifecycle integration MUST conform to
> `002a-platform-contract-standard` and `002b-cross-engine-integration`.

## Executive Summary

The Inventory Engine is the authoritative platform component for recording, protecting, and changing Item ownership associated with a Character.

The Item Engine defines what an Item is. The Inventory Engine proves whether a Character owns it, how many copies exist, whether ownership is represented by a stack or an individually addressable instance, where owned copies are stored, whether they are bound, reserved, equipped, consumed, expired, destroyed, transferred, or quarantined, and which immutable operations produced the current state.

The Inventory Engine owns:

- one Inventory Account for every eligible Character;
- Item Holdings for stackable and virtual-unique ownership;
- Item Instances for individually addressable copies;
- Containers, slots, equipment locations, and capacity policies registered for Inventory use;
- quantity, availability, binding, reservation, expiration, durability, charge, and typed instance-state values declared by immutable Item manifests;
- acquisition, release, move, split, merge, reserve, consume, destroy, equip, unequip, transfer, expiration, quarantine, recovery, and correction workflows;
- the authoritative Inventory Ledger and operation receipts;
- exactly-once logical application of Item Reward components;
- reversal of a specific Reward fulfillment where catalog and current state permit it;
- deterministic enforcement of stackability, uniqueness, duplicate-acquisition policy, binding, transferability, destruction, compatibility, capacity, and ownership constraints;
- Character lifecycle restrictions projected from Character Engine Events;
- Item catalog compatibility projected from Item Engine Events and exact immutable manifest lookups;
- purpose-built owner, public, internal, and administrative read models;
- transactional inbox and outbox processing, retries, reconciliation, projection rebuilds, and invariant repair.

The Inventory Engine does **not** define Item content. It does not own Item names, descriptions, rarity, assets, categories, property schemas, interaction capability schemas, or the semantic meaning of an immutable Item Definition Version. Those facts belong to the Item Engine and are referenced by exact identifiers and fingerprints.

The Inventory Engine does **not** decide why a Character deserves an Item. Reward Engine owns Reward eligibility, repeatability, Grant state, and the fulfillment saga. Inventory Engine receives a typed `ITEM` fulfillment request, validates the immutable Item reference and Character eligibility, applies one logical ownership effect using `fulfillment_id` as the idempotency identity, and publishes the authoritative fulfillment result. Inventory Engine may report an accepted no-op only when the immutable Item manifest declares a duplicate policy that permits it.

The Inventory Engine does **not** own Character identity, Progression, Quests, Achievements, Talents, Skills, Reputation, Currency, Seasons, purchases, orders, payments, marketplace listings, crafting recipes, loot-table selection, notifications, or business-domain truth. It may expose typed ownership facts and publish immutable Inventory Events that those owners consume, but it never mutates their aggregates.

Inventory is modeled as an append-only history plus authoritative materialized state. Every committed mutation creates one Inventory Operation, one or more Ledger Entries, versioned state changes, and transactional outbox Events. Current state is never accepted without evidence that explains how it was derived. Historical operations are never rewritten to make a correction appear as if the original action did not happen.

The Engine is designed around the following non-negotiable invariants:

1. Only Inventory Engine may create or mutate Character Item ownership records.
2. Every owned copy references an exact immutable `item_definition_version_id`.
3. Display names, Item keys, assets, rarity, and current recommended versions are never ownership identifiers.
4. A published Item version changing lifecycle state does not silently rewrite existing Inventory.
5. One logical external request has at most one logical Inventory effect.
6. Reward fulfillment retries reuse the same `fulfillment_id` and return the original authoritative outcome.
7. Inventory quantities are non-negative integers; floating-point quantities are prohibited.
8. Every quantity decrement is bounded by currently available quantity after reservations and policy restrictions.
9. Every Item Instance has at most one current owner and at most one current location.
10. A stack represents only copies whose immutable merge keys are equal.
11. An Item requiring instances is never represented only as an anonymous quantity.
12. A virtual-unique Item has at most one active ownership fact in its declared uniqueness scope.
13. Duplicate acquisition behavior is taken from the exact Item manifest used by the request.
14. Binding and transfer state can become stricter only through an explicit, audited transition unless an approved owner contract allows release.
15. A reserved quantity or instance cannot be consumed, destroyed, transferred, or equipped by an unrelated operation.
16. Equipment state is Inventory-owned; Character presentation selection remains Character-owned.
17. A consumed, destroyed, expired, or fully reversed copy cannot become available again except through an explicit restoration or correction workflow that appends new history.
18. Inventory never invokes arbitrary Item-authored code or remote callbacks.
19. Item capabilities are interpreted only through registered, versioned contracts with bounded schemas.
20. Inventory never trusts client-provided ownership, quantity, Item semantics, price, rarity, binding, or operation result.
21. Character suspension or closure restricts mutation according to policy but does not erase ownership history.
22. Character anonymization removes or pseudonymizes personal associations while preserving the minimum non-personal integrity history required by policy.
23. Multi-row mutations lock authoritative records in deterministic order and commit atomically in one database boundary.
24. Cross-Engine effects are asynchronous; no distributed transaction is assumed.
25. Timeouts are not evidence that an external operation failed to apply.
26. Every mutation is attributable to an actor, source, reason, correlation identity, and idempotency identity.
27. Administrative operations use the same invariants, validation, ledger, outbox, and authorization controls as ordinary operations.
28. Direct SQL edits to Inventory state, quantity, ownership, reservation, or ledger records are prohibited.
29. Search, cache, and UI projections may be eventually consistent; authoritative operation reads and ownership checks are strongly consistent within the owning region.
30. When correctness and availability conflict, the Engine prefers a rejected or delayed operation over ambiguous ownership, negative quantity, duplicate creation, or silent Item loss.

This RFC is normative for Inventory Engine ownership, terminology, lifecycle, aggregate boundaries, state transitions, Item integration, Reward fulfillment, persistence, APIs, administration, security, privacy, performance, auditability, edge cases, and production acceptance tests.

---

## Purpose

The purpose of this document is to define a production-ready specification for the Inventory Engine of Progression Platform.

It establishes:

- the authoritative boundary between Item Definitions and owned Inventory;
- canonical language for Inventory Account, Holding, Stack, Item Instance, Container, Slot, Reservation, Binding, Equipment, Transfer, Consumption, Expiration, and Inventory Operation;
- deterministic application of immutable Item semantics;
- exactly-once logical Reward fulfillment and safe reversal;
- state machines for ownership and Item availability;
- concurrency, locking, idempotency, and consistency guarantees;
- append-only ledger and immutable operation receipts;
- reference database schemas and indexes;
- owner-facing, internal, and administrative APIs;
- lifecycle behavior for Character and Item catalog changes;
- security, privacy, performance, observability, repair, and acceptance requirements.

The specification is domain-agnostic. A school may use Inventory for training sashes, uniforms, trophies, manuals, event tokens, and cosmetic insignia. A fitness product may use it for passes, collectibles, equipment entitlements, and challenge rewards. An education module may use it for certificates, access artifacts, and course materials. A gaming community may use it for cosmetics, consumables, collectibles, and equipment. These examples do not introduce business logic into the Engine.

### Normative language

The key words **MUST**, **MUST NOT**, **REQUIRED**, **SHALL**, **SHALL NOT**, **SHOULD**, **SHOULD NOT**, **RECOMMENDED**, **MAY**, and **OPTIONAL** indicate normative requirement levels.

An implementation that allows Reward Engine, Item Engine, a business Module, an administrator, a client, analytics tooling, or a migration script to modify Inventory ownership tables directly violates this RFC unless an approved ADR explicitly replaces the ownership model.

### Design posture

Version 1 should favor:

- PostgreSQL or an equivalent relational authoritative store;
- integer quantities and explicit decimal precision only where a registered capability requires it;
- immutable Item Definition Version references;
- append-only Inventory Ledger entries;
- materialized current state updated in the same transaction as ledger entries;
- transactional inbox and outbox patterns;
- stable command idempotency keys and operation fingerprints;
- deterministic row-lock ordering;
- optimistic concurrency for client-visible aggregate versions;
- asynchronous projection, search, notification, and analytics updates;
- a typed capability registry rather than executable Item scripts;
- resumable expiration, migration, reconciliation, and repair jobs;
- explicit overflow behavior rather than silent Item loss.

Version 1 does not require event sourcing as the only persistence model, cross-region active-active writes for one Character, arbitrary container graphs, player-to-player trading, marketplace settlement, crafting execution, procedural Item generation, or a general scripting runtime.

---

## Goals

### G-1. Authoritative ownership

Provide one authoritative component that can answer whether a Character owns an Item, the exact immutable version owned, the quantity or instance identities, and the current availability state.

### G-2. Preserve Item meaning

Ensure every owned copy remains interpretable using the exact immutable Item Definition Version and manifest fingerprint used when the ownership effect was committed.

### G-3. Exactly-once logical mutation

Apply duplicate commands and at-least-once Event deliveries with at most one logical ownership effect, while returning the original result for safe retries.

### G-4. Correct stacking

Represent equivalent copies efficiently without merging Items whose version, binding, expiration bucket, durability semantics, custom state, or other registered merge keys differ.

### G-5. Instance identity

Provide stable opaque identities for serial, non-stackable, individually mutable, equipped, transferable, or otherwise instance-required Items.

### G-6. Deterministic uniqueness

Enforce registered uniqueness scopes and duplicate-acquisition policies under concurrency without relying on eventually consistent projections.

### G-7. Safe Reward fulfillment

Fulfill typed Item Reward components, publish authoritative receipts, and support idempotent reversal where the original effect remains safely reversible.

### G-8. Explicit availability

Distinguish total owned quantity from available, reserved, equipped, locked, expired, consumed, destroyed, transferred, and quarantined quantities or instances.

### G-9. Capacity without loss

Enforce container and slot limits while ensuring no successful acquisition silently drops or hides ownership. Overflow behavior must be explicit and auditable.

### G-10. Typed Item interactions

Execute only registered Inventory-owned capabilities such as consume, equip, durability adjustment, charge use, or expiration, using bounded schemas and deterministic rules.

### G-11. Transfer safety

Support a platform transfer primitive only where immutable Item semantics, binding, policy, destination eligibility, and operation authorization all permit it.

### G-12. Full traceability

Explain every current ownership state through immutable operations, ledger entries, source references, actors, reasons, and Item manifest snapshots.

### G-13. Character lifecycle compliance

Apply local read-only, restricted, closed, and anonymized behavior from Character lifecycle Events without allowing Character Engine to write Inventory state.

### G-14. Operational resilience

Continue safe processing under duplicate delivery, broker outages, projection lag, partial cache failure, delayed Item lifecycle Events, and retry storms.

### G-15. Horizontal read scalability

Serve owner inventory views, counts, equipment, availability, and public-safe projections through purpose-specific read models and caches.

### G-16. Bounded write contention

Partition and lock data so that high-volume Item grants do not require locking one unbounded Character row for every unrelated operation.

### G-17. Repairability

Provide reconciliation, replay, projection rebuild, quarantine, and approved correction workflows that preserve history and never require silent direct edits.

### G-18. Privacy by design

Minimize personal data in Inventory state and Events while retaining sufficient pseudonymous history for ownership integrity and fraud investigation.

### G-19. Domain independence

Support schools, fitness, education, communities, gaming, marketplaces, and future Modules without embedding their business vocabulary or rules.

### G-20. Implementation clarity

Define contracts, invariants, schemas, state transitions, error semantics, and tests sufficiently for a backend team to implement the Engine with minimal unresolved design questions.

---

## Non Goals

### NG-1. Item catalog ownership

Inventory Engine does not author, version, publish, localize, classify, deprecate, retire, or replace Item Definitions.

### NG-2. Reward eligibility

Inventory Engine does not decide whether a Character deserves an Item Reward, how often a Reward repeats, or whether a Quest or Achievement should produce it.

### NG-3. Character identity

Inventory Engine references `character_id` and a local lifecycle projection. It does not own users, profiles, handles, privacy preferences, or public presentation selections.

### NG-4. Progression and capability ownership

Inventory Engine does not own Experience, Levels, Prestige, Reputation, Talents, Skills, Quests, Achievements, or Seasons.

### NG-5. Commerce

Purchases, carts, orders, invoices, refunds, taxes, payment settlement, marketplace listings, and economic pricing are not Inventory responsibilities.

### NG-6. Currency ledger

Spendable currency balances require a dedicated Currency or Wallet owner. An Item quantity is not silently treated as money.

### NG-7. Loot selection

Inventory may receive an already resolved Item acquisition. It does not roll loot tables, randomize Reward outcomes, or choose prize probabilities.

### NG-8. Crafting recipes

Recipe definition, ingredient selection, crafting eligibility, and output planning belong to a future Crafting owner. Inventory may reserve and atomically consume specified inputs under a typed contract.

### NG-9. Arbitrary gameplay runtime

Inventory does not simulate combat, physics, equipment statistics, buffs, cooldowns, or domain gameplay. It publishes ownership and equipment facts for registered consumers.

### NG-10. General workflow engine

Inventory operations are bounded domain state machines, not an arbitrary orchestration or scripting platform.

### NG-11. Social graph

Friends, guild membership, group trust, and recipient relationship policy are external facts used by authorization when transfer is supported.

### NG-12. Asset storage

Images, models, downloadable files, and media transformations are referenced from Item manifests; Inventory does not host them.

### NG-13. Notification delivery

Inventory publishes Events. Notification Engine decides channels, templates, preferences, and delivery.

### NG-14. Analytics warehouse

Operational projections and metrics are in scope; long-term product analytics and behavioral warehousing are not.

### NG-15. Physical stock

Warehouse stock, shipping, serial hardware custody, and real-world fulfillment are separate domains unless mapped through an explicit Module contract.

### NG-16. Unbounded metadata

Clients and Modules cannot attach arbitrary JSON blobs to Holdings or Instances. Mutable fields require registered schemas, size limits, and ownership rules.

### NG-17. Cross-region synchronous consensus

Version 1 does not provide simultaneous active writes for the same Character in multiple regions. One authoritative write home is selected per Inventory Account.

### NG-18. Silent historical normalization

Inventory never rewrites old Item version references to the latest recommended version merely for convenience.

### NG-19. Automatic legal or business revocation

Item retirement, a refund, membership cancellation, or moderation outcome does not itself delete Inventory unless the owning policy publishes an authorized typed command.

### NG-20. Client-authoritative offline mutation

Offline clients may queue commands but cannot finalize ownership, consumption, transfer, or equipment state without server authorization and authoritative commit.

---

## Responsibilities

### R-1. Inventory Account lifecycle

Create and maintain the platform Inventory Account associated with an eligible Character, including lifecycle restrictions, home region, policy revision, and aggregate version.

### R-2. Acquisition

Validate and commit Item acquisition from authorized commands and typed Reward fulfillment requests.

### R-3. Item manifest resolution

Resolve and snapshot the exact immutable Item manifest required to interpret each mutation. Reject drafts, unknown versions, incompatible schemas, and disallowed acquisition states.

### R-4. Holdings and stacks

Create, increment, decrement, split, merge, deplete, expire, quarantine, and reconcile stackable or virtual-unique Holdings.

### R-5. Item Instances

Create and maintain stable Item Instance identities and their state, location, binding, durability, charges, expiration, and typed mutable properties.

### R-6. Uniqueness

Enforce Item-declared uniqueness scopes using authoritative constraints and supported scope resolvers.

### R-7. Duplicate acquisition

Execute `ACCEPT_NO_OP`, `REJECT`, `CONVERT_VIA_OWNER_CONTRACT`, or `INCREMENT_AUXILIARY_COUNTER` only through registered deterministic policies.

### R-8. Containers and slots

Own Inventory container, slot, equipment-location, capacity, occupancy, overflow, and compatibility state.

### R-9. Reservations

Reserve quantity or instances for a bounded purpose and release, commit, or expire reservations idempotently.

### R-10. Consumption and use

Apply Inventory-owned consume or use semantics, record the ownership decrement or state transition, and publish a typed outcome Event without directly mutating foreign Engines.

### R-11. Equipment

Equip and unequip Item Instances or eligible virtual ownership into registered slots while preserving location and exclusivity invariants.

### R-12. Transfer

Coordinate authorized ownership transfer using a durable transfer operation, deterministic locking, binding policy, recipient eligibility, and complete ledger evidence.

### R-13. Destruction and discard

Apply owner-requested or administrative destruction only where immutable Item semantics and policy allow it.

### R-14. Expiration

Apply time-based expiration deterministically using persisted `expires_at`, resumable scanning, idempotent operations, and explicit late-processing semantics.

### R-15. Reward fulfillment

Consume `reward.fulfillment.requested.v1` for `ITEM`, apply one logical effect per `fulfillment_id`, and publish success or sanitized failure.

### R-16. Reward reversal

Consume `reward.reversal.requested.v1`, determine whether the exact original acquisition remains reversible, reverse safely or fail explicitly, and never remove the original receipt.

### R-17. Character lifecycle enforcement

Project Character state and enforce allowed, read-only, support-only, or prohibited operations.

### R-18. Item lifecycle enforcement

Project Item publication, deprecation, retirement, quarantine, recovery, and compatibility facts for future operations while preserving existing ownership.

### R-19. Ledger and receipts

Append immutable business-significant ledger entries and expose durable operation receipts.

### R-20. Event publication

Publish Inventory domain Events and generic Reward fulfillment or reversal results through a transactional outbox.

### R-21. Read models

Maintain authoritative and eventually consistent projections for owner inventory, public-safe equipment, counts, availability, history, support, and downstream facts.

### R-22. Authorization

Evaluate owner, service, Module, support, and administrator permissions before command execution.

### R-23. Idempotency and concurrency

Validate idempotency keys, request fingerprints, aggregate versions, row-lock order, and operation replay behavior.

### R-24. Explainability

Return machine-readable reasons for accepted no-ops, restrictions, capacity decisions, duplicate handling, transfer denial, reversal denial, and Item unavailability.

### R-25. Reconciliation

Detect and repair projection drift, impossible quantities, orphan locations, stale reservations, missing outbox messages, and manifest compatibility issues through audited workflows.

### R-26. Governance

Provide risk-based approvals for bulk grants, bulk removals, transfer enablement, destructive corrections, schema migrations, and emergency quarantine.

### Explicitly forbidden responsibilities

Inventory Engine MUST NOT:

- create or modify Item Definition content;
- decide Reward eligibility;
- write Character profile or presentation selections;
- mutate Progression, Quest, Achievement, Talent, Reputation, Currency, Season, or Module aggregates;
- execute arbitrary capability code;
- infer ownership from analytics, UI state, or Reward presentation;
- use display names as Item identifiers;
- delete ledger history;
- silently repair quantity without a correction operation;
- expose hidden Item content to unauthorized callers;
- bypass capacity, uniqueness, binding, or idempotency for administrators.

---

## Dependencies

### Required platform dependencies

#### Character Engine

Inventory Engine consumes Character lifecycle Events and maintains a minimal local projection containing:

- `character_id`;
- lifecycle state;
- eligibility for owner mutation;
- anonymization state;
- aggregate version or event ordinal;
- optional home-region routing fact.

Character Engine never writes Inventory rows. Inventory Engine does not require Character profile fields.

#### Item Engine

Item Engine is the authoritative source for immutable Item Definition Version manifests. Inventory Engine requires:

- exact manifest lookup by `item_definition_version_id`;
- publication and lifecycle Events;
- inventory semantics and merge keys;
- capability schemas;
- manifest fingerprints;
- acquisition and historical-fulfillment policy;
- compatibility requirements;
- replacement and quarantine metadata.

Inventory caches manifests but verifies fingerprints and supports exact re-fetch. A cache miss may delay a mutation; it must not cause fallback to a mutable recommended version.

#### Event infrastructure

The Engine requires:

- durable at-least-once delivery;
- globally unique Event IDs;
- producer authentication;
- schema registration;
- dead-letter and quarantine routing;
- transactional outbox dispatch;
- inbox deduplication;
- replay with bounded rate controls.

Exactly-once broker delivery is not assumed.

#### Authorization and Policy service

Authorization evaluates principals, operation purpose, ownership, service identity, Module scope, transfer permission, destructive action approval, and support access. Inventory remains responsible for domain invariants after authorization succeeds.

#### Database

The authoritative store MUST support:

- ACID transactions;
- unique and exclusion constraints;
- foreign keys or equivalent integrity guarantees;
- deterministic row locking;
- append-only permissions for ledger tables;
- online indexing and partitioning;
- point-in-time recovery;
- encrypted backups;
- transactionally consistent outbox writes.

#### Time source

Authoritative operations use server time from a synchronized source. Client timestamps may be retained as evidence but never decide expiration, reservation validity, or transfer ordering.

#### Schema and capability registry

Every command, Event, Item capability, mutable Item property, container type, slot type, uniqueness scope, duplicate policy, and transfer contract MUST have a versioned schema and owner.

#### Audit and observability infrastructure

The Engine requires structured logs, metrics, traces, immutable audit export, alerting, and privacy-aware support tooling.

### Logical upstream dependencies

#### Reward Engine

Reward Engine sends typed Item fulfillment and reversal requests. Inventory validates the generic envelope and `ITEM` payload, applies the ownership operation, and returns the authoritative result.

#### Business Modules

Modules may request bounded Inventory operations through authorized APIs or publish typed Events consumed by a registered policy. Modules never receive direct database access and cannot invent Item semantics.

#### Future Commerce, Marketplace, Crafting, and Trade owners

These systems may coordinate purchase, listing, recipe, or exchange workflows. Inventory supplies reservation, transfer, and consumption primitives; it does not assume their business correctness.

### Logical downstream consumers

Potential consumers include:

- Character Engine presentation eligibility projections;
- Reward Engine fulfillment saga;
- Quest and Achievement Engines consuming ownership or use Events;
- Talent or gameplay consumers of equipment facts;
- Notification Engine;
- search and public profile projections;
- analytics and fraud systems;
- future marketplace, crafting, collection, and season systems.

Consumers MUST treat Inventory Events as facts, not permission to write Inventory.

### Forbidden runtime dependencies

Inventory mutation MUST NOT synchronously require:

- Notification Engine;
- analytics warehouse;
- search index;
- client acknowledgement;
- public profile projection;
- Item recommendation lookup;
- Reward aggregate lookup after a valid immutable fulfillment request is received;
- arbitrary Module callback;
- external asset delivery.

Failure of these dependencies may delay secondary projections but must not corrupt ownership.

### Dependency degradation policy

- If Item exact manifest lookup is unavailable and a verified immutable cached manifest exists, the Engine MAY proceed according to cache-age policy.
- If no verified manifest exists, acquisition or interaction MUST fail retryably rather than guess.
- If Event dispatch is unavailable, the transaction may commit with outbox rows and dispatch later.
- If search or cache infrastructure is unavailable, authoritative APIs continue with degraded latency.
- If Character lifecycle projection is stale beyond the configured safety window, risky writes fail closed.
- If Authorization is unavailable, writes fail closed; owner reads may use bounded cached decisions only if policy allows.

---

## Architecture Overview

### Context

```text
                        immutable manifests and lifecycle
        ┌────────────── Item Engine ───────────────────────────┐
        │                                                      │
        ▼                                                      │
┌─────────────────────────────────────────────────────────────────────┐
│                         Inventory Engine                            │
│                                                                     │
│  Command/API Gateway                                                │
│        │                                                            │
│        ▼                                                            │
│  Authorization + Idempotency + Character Eligibility                │
│        │                                                            │
│        ▼                                                            │
│  Manifest Resolver + Policy Compiler                                │
│        │                                                            │
│        ▼                                                            │
│  Inventory Operation Coordinator                                    │
│   ├── Account and lifecycle                                         │
│   ├── Holdings and Item Instances                                   │
│   ├── Containers, slots, equipment                                  │
│   ├── Reservations and transfers                                    │
│   ├── Consumption, expiration, destruction                          │
│   ├── Reward fulfillment and reversal                               │
│   └── Correction and reconciliation                                 │
│        │                                                            │
│        ▼                                                            │
│  Authoritative State + Append-only Ledger + Inbox/Outbox             │
└───────────────┬──────────────────────────────┬──────────────────────┘
                │                              │
                │ Inventory domain Events      │ Reward owner results
                ▼                              ▼
       Platform Engines and Modules       Reward Engine
```

### Ownership boundary

| State or decision | Authoritative owner | Inventory behavior |
|---|---|---|
| Item Definition and version | Item Engine | References exact immutable version. |
| Item presentation and rarity | Item Engine | Projects only authorized presentation. |
| Character identity and lifecycle | Character Engine | Maintains minimal eligibility projection. |
| Reward eligibility and Grant state | Reward Engine | Fulfills typed Item component. |
| Character Item ownership | Inventory Engine | Sole writer. |
| Stack quantity and Item Instance state | Inventory Engine | Sole writer. |
| Containers, slots, equipment, reservations | Inventory Engine | Sole writer. |
| Character profile presentation selection | Character Engine | Consumes Inventory entitlement facts. |
| Progression and Talent effects | Respective Engine | Consumes typed Inventory Events if configured. |
| Purchase and payment state | Commerce owner | May request Inventory acquisition after settlement. |
| Marketplace listing and price | Marketplace owner | May reserve or transfer through typed contracts. |

### Logical components

#### 1. Command Gateway

Validates envelope size, schema version, principal identity, correlation ID, idempotency key, expected version, and request fingerprint.

#### 2. Event Inbox Consumer

Authenticates producers, deduplicates Event IDs, validates schema compatibility, and dispatches trusted Event handlers.

#### 3. Character Eligibility Projector

Maintains local lifecycle state and mutation restrictions from Character Events.

#### 4. Item Manifest Resolver

Loads exact immutable manifests, validates fingerprints, applies lifecycle overlays, and caches compiled Inventory semantics.

#### 5. Policy Compiler

Converts registered manifest fields into bounded internal decisions for stacking, uniqueness, binding, capacity, transfer, destruction, expiration, and interaction.

#### 6. Inventory Operation Coordinator

Creates one durable operation, locks affected state in deterministic order, applies invariant checks, writes state and ledger entries, creates outbox Events, and commits atomically.

#### 7. Holding Service

Owns stackable and virtual-unique state, quantity arithmetic, merge keys, overflow, and duplicate handling.

#### 8. Item Instance Service

Owns serial Item identities, mutable registered state, location, equipment, reservation, binding, and terminal transitions.

#### 9. Container and Slot Service

Owns capacity, compatibility, location graph, slot occupancy, and equipment exclusivity.

#### 10. Reservation Service

Creates purpose-bound claims over quantity or instances and supports commit, release, extension, and expiration.

#### 11. Transfer Coordinator

Coordinates source lock, destination eligibility, binding checks, ownership move, and dual-sided ledger entries in one authoritative transaction when accounts share a shard.

#### 12. Reward Fulfillment Adapter

Maps `ITEM` fulfillment requests to acquisition operations and publishes generic success or failure results with stable owner receipts.

#### 13. Reversal Adapter

Locates the exact original effect by `fulfillment_id`, verifies reversibility, and appends a compensating ownership operation.

#### 14. Expiration Worker

Claims due records with skip-locked batches, executes idempotent expiration operations, and publishes resulting Events.

#### 15. Ledger Writer

Appends immutable operation entries and state deltas in the same transaction as current-state updates.

#### 16. Projection Builders

Build owner views, item counts, equipment, public-safe facts, operation history, support views, and analytics Events.

#### 17. Reconciliation and Repair Service

Validates ledger-to-state consistency, orphan locations, reservation balances, manifest compatibility, and outbox completeness.

### Write path

A normal mutation follows this sequence:

1. authenticate the caller or Event producer;
2. validate the command or Event schema;
3. derive the canonical idempotency identity and request fingerprint;
4. check the operation registry for an existing outcome;
5. load Character eligibility;
6. resolve the exact Item manifest and lifecycle overlay;
7. authorize the requested operation;
8. determine all affected authoritative rows;
9. lock rows in canonical order;
10. re-check idempotency and expected versions inside the transaction;
11. evaluate stacking, uniqueness, binding, capacity, reservation, transfer, and lifecycle invariants;
12. create the Inventory Operation;
13. apply materialized state changes;
14. append immutable Ledger Entries;
15. create domain and integration outbox records;
16. persist the operation receipt;
17. mark inbox delivery processed where applicable;
18. commit once;
19. dispatch outbox records asynchronously;
20. rebuild secondary projections asynchronously.

No successful response is returned before the authoritative transaction commits.

### Aggregate and transaction strategy

A single unbounded Character aggregate would become a hotspot and make unrelated Item operations contend. The Engine therefore uses an aggregate family:

- `InventoryAccount` for lifecycle, routing, and policy revision;
- `InventoryHolding` for one stackable merge identity;
- `ItemInstance` for one individually addressable copy;
- `InventoryContainer` for capacity and slot occupancy;
- `InventoryReservation` for one purpose-bound reservation;
- `InventoryTransfer` for one ownership transfer workflow;
- `InventoryOperation` for one idempotent multi-aggregate mutation.

Operations affecting multiple aggregates commit in one database transaction within the Character's write shard. Rows are locked in a deterministic tuple order: account, uniqueness key, container, holding, instance, reservation, transfer. The ordering is normative and must be consistent across command handlers.

### Partitioning

The primary partition key is `character_id` or a stable Inventory Account shard key derived from it. Most operations remain single-partition.

Cross-Character transfer is exceptional. Version 1 SHOULD route both accounts to a transfer-capable coordinator. If the accounts are on different physical shards, the Engine MUST use a durable transfer saga with escrow state; it MUST NOT pretend the move was atomically committed across shards. Player transfer MAY remain disabled until this workflow is production-ready.

Ledger and Event tables may be time-partitioned while preserving lookup indexes by `inventory_account_id`, `operation_id`, `fulfillment_id`, and `item_instance_id`.

### Consistency model

Authoritative command responses and exact ownership checks are strongly consistent within the account's write home.

The following may be eventually consistent:

- search and discovery;
- public equipment cards;
- aggregate Item counts used only for display;
- analytics;
- Notification delivery;
- Collection and Achievement projections;
- cross-region read replicas.

A caller requiring a write-after-read decision MUST use an authoritative endpoint or provide an expected aggregate or entity version.

### Idempotency model

Every externally initiated mutation includes an idempotency identity scoped to the caller and operation type. Event-driven handlers additionally deduplicate by Event ID.

The Engine stores:

- idempotency scope;
- idempotency key;
- request fingerprint;
- operation ID;
- terminal or current operation status;
- response snapshot;
- retention policy.

Reusing a key with an identical fingerprint returns the original result. Reusing it with a different fingerprint fails with `INVENTORY_IDEMPOTENCY_CONFLICT`.

Reward requests use `fulfillment_id` as the primary logical idempotency identity across all attempts. The `attempt_id` is delivery metadata only.

### Ordering model

Global Event order is not assumed. For one Inventory entity, Events include entity version and operation sequence. Consumers order by:

1. Inventory Account routing epoch;
2. entity aggregate version;
3. operation ordinal where multiple Events are produced by one transaction.

Late Item or Character lifecycle Events are applied only when their source ordinal is newer than the local projection.

### Delivery semantics

The Engine provides at-least-once Event publication through a transactional outbox and exactly-once logical state effects through inbox, idempotency, unique constraints, and stable operation identities.

An outbox retry preserves Event ID and payload. A consumer retry must be safe. Broker acknowledgement is not treated as downstream business completion.

### Failure isolation

- A failed projection does not roll back committed ownership.
- A failed Notification does not block Inventory.
- A failed Reward result dispatch leaves an outbox record and is retried.
- A malformed Event is quarantined and does not poison the partition.
- An unknown manifest version fails the affected operation, not the entire Engine.
- A stuck reservation or transfer is repaired by durable timeout workflows, not memory timers.
- A reconciliation finding may quarantine a Holding or Instance without changing unrelated Items.

### Deployment model

The Engine may be deployed as one service or several operational components sharing one authoritative domain boundary. Splitting components must not create multiple writers for the same state.

Recommended deployable processes are:

- API and command workers;
- Event consumers;
- outbox dispatchers;
- expiration and reservation workers;
- projection workers;
- reconciliation workers;
- administrative job workers.

All write-capable processes use the same schema contracts, lock order, operation library, authorization policy, and ledger implementation.

---
## Canonical Definitions

### Inventory

The complete authoritative Item ownership domain associated with an Inventory Account, including current state, reservations, locations, operations, and ledger history.

### Inventory Account

The lifecycle and routing root associated with one Character. It contains policy state and references to Holdings, Instances, Containers, Reservations, and Operations but is not implemented as one unbounded locked row containing every Item.

### Inventory Account ID

An opaque immutable UUID generated by Inventory Engine. It is not equal to `character_id`, although version 1 normally has one account per Character.

### Inventory Account State

One of:

- `PROVISIONING`;
- `ACTIVE`;
- `READ_ONLY`;
- `SUSPENDED`;
- `CLOSED`;
- `ANONYMIZED`.

The state constrains allowed operations but does not erase ownership.

### Item Definition Version Reference

The exact tuple of `item_definition_id`, `item_definition_version_id`, Item key, manifest fingerprint, and relevant lifecycle snapshot used by Inventory.

### Inventory Manifest

The bounded immutable subset of an Item Definition Version required by Inventory. It includes stack mode, instance requirement, merge keys, uniqueness, duplicate policy, binding, transferability, destruction, expiration, mutable-state schemas, capabilities, and compatibility declarations.

### Manifest Snapshot

The fingerprint and selected semantics stored with an Inventory Operation or owned entity so historical behavior remains explainable even when catalog lifecycle overlays change.

### Item Holding

The authoritative ownership record for stackable or virtual-unique copies sharing one merge identity within one Inventory Account and binding scope.

### Holding ID

An opaque immutable UUID identifying one Holding.

### Stack

A Holding whose `stack_mode` is `STACKABLE` and whose quantity may be greater than one.

### Virtual-Unique Holding

A present-or-absent ownership record for an Item whose `stack_mode` is `VIRTUAL_UNIQUE`. Its effective quantity is normally zero or one, although an auxiliary duplicate counter may be maintained by a registered policy.

### Merge Identity

A deterministic hash of all immutable and mutable fields declared by the Item manifest as required for safe stack merging. At minimum it includes exact Item Definition Version, binding scope, expiration bucket when applicable, and registered merge keys.

### Merge-Compatible

Two Holdings are merge-compatible when their manifest contract versions and merge identities are equal and neither state prohibits merging.

### Item Instance

An individually addressable owned copy with an opaque `item_instance_id`, exact Item Definition Version, owner, state, location, binding, and optional typed mutable state.

### Item Instance ID

A server-generated opaque UUID. It is never chosen by the client and is never reused after terminal destruction.

### Serial Reference

An optional external or presentation-safe serial value governed by a registered schema. It is not the primary key and may not be globally disclosed.

### Quantity

A non-negative integer count of copies represented by a Holding. Authoritative quantities use signed 64-bit storage with constraints preventing negative state and overflow.

### Total Quantity

All currently owned non-terminal quantity in a Holding, including available, reserved, equipped-equivalent, and policy-locked portions as defined by its model.

### Available Quantity

The quantity currently eligible for a requested ordinary operation after subtracting reservations and applying lifecycle, location, expiration, quarantine, and policy restrictions.

### Reserved Quantity

Quantity claimed by active Reservations and unavailable to unrelated operations.

### Auxiliary Counter

A registered non-ownership counter used only when the duplicate policy is `INCREMENT_AUXILIARY_COUNTER`. It cannot be interpreted as additional Item quantity unless its contract explicitly says so.

### Container

An Inventory-owned location that may contain Holdings, Item Instances, or child containers according to a registered container type and capacity policy.

### Root Container

A system-created top-level location such as `PRIMARY`, `EQUIPMENT`, `OVERFLOW`, `ARCHIVE`, or `ESCROW`. Root container types are platform registry entries, not business strings invented per request.

### Container ID

An opaque immutable UUID.

### Slot

A named capacity unit inside a Container or equipment layout. A slot has a registered slot type, occupancy cardinality, compatibility contract, and current occupant reference.

### Equipment Slot

A Slot whose occupancy indicates that an Item is equipped for a registered consumer context. Equipment is an Inventory location and availability state, not a Character profile selection.

### Location

The current authoritative placement of a Holding or Item Instance. An entity has at most one current location.

### Overflow Container

A system-controlled location used when a successful acquisition cannot fit the preferred ordinary Container and policy permits safe overflow. Items in overflow remain owned and visible; they are never silently dropped.

### Capacity Policy

A versioned registered contract that defines limits such as maximum distinct Holdings, maximum Instances, maximum total units, slot count, weight budget, or capability-specific constraints.

### Capacity Reservation

A temporary claim on destination capacity associated with a Reservation or Transfer. It prevents overbooking under concurrency.

### Binding

An Inventory-owned restriction associating a Holding or Instance with a supported scope such as Character, User, account group, Module association, or season occurrence.

### Binding Scope

The type and identifier of the subject to which an owned copy is bound.

### Binding State

One of `UNBOUND`, `BOUND`, `BINDING_PENDING`, or `RELEASE_PENDING`. Version 1 normally supports `UNBOUND` to `BOUND` and prohibits ordinary reversal.

### Uniqueness Scope

The catalog-declared scope in which duplicate ownership is constrained. Inventory supports only scopes registered with a deterministic authoritative resolver.

### Uniqueness Key

A normalized tuple derived from Item Definition identity and resolved scope identifier, protected by a unique constraint or equivalent serialization mechanism.

### Duplicate Acquisition

An acquisition that would violate the Item's uniqueness constraint or virtual-unique ownership rule.

### Duplicate Acquisition Policy

The immutable policy declared by Item Engine:

- `ACCEPT_NO_OP`;
- `REJECT`;
- `CONVERT_VIA_OWNER_CONTRACT`;
- `INCREMENT_AUXILIARY_COUNTER`.

### Accepted No-op

A successful operation result that intentionally changes no ownership because the exact contract permits it. It records the existing Holding or Instance and a reason code.

### Inventory Operation

The durable idempotent record representing one requested mutation and its authoritative result.

### Operation ID

An opaque immutable UUID generated by Inventory Engine.

### Operation Kind

A registered value such as `ACQUIRE`, `REVERSE_ACQUISITION`, `MOVE`, `SPLIT`, `MERGE`, `RESERVE`, `RELEASE_RESERVATION`, `CONSUME`, `EQUIP`, `UNEQUIP`, `TRANSFER`, `DESTROY`, `EXPIRE`, `QUARANTINE`, `RECOVER`, or `CORRECT`.

### Operation Fingerprint

A cryptographic hash of the canonical command semantics. It detects conflicting reuse of an idempotency key.

### Inventory Ledger Entry

An immutable record of a business-significant delta or state transition caused by an Inventory Operation.

### Ledger Sequence

A monotonic sequence within one Inventory Account or ledger partition used to order authoritative history.

### Source Reference

The immutable origin of an operation, such as Reward fulfillment, Module command, Item consumption, transfer, expiration job, privacy workflow, or administrative correction.

### Actor

The authenticated User, service principal, administrator, or automated worker that initiated or authorized an operation.

### Reason Code

A registered machine-readable explanation. Free text may supplement it for internal audit but cannot replace it.

### Reservation

A durable purpose-bound claim over quantity, Item Instances, and optionally destination capacity.

### Reservation ID

An opaque UUID.

### Reservation Purpose

A registered contract such as `CRAFT_INPUT`, `MARKETPLACE_LISTING`, `TRANSFER`, `QUEST_SUBMISSION`, `CONSUMPTION`, or `ADMIN_REPAIR`. Merely naming a purpose does not authorize it.

### Reservation State

One of `PENDING`, `ACTIVE`, `COMMITTED`, `RELEASED`, `EXPIRED`, `CANCELLED`, or `FAILED`.

### Reservation Lease

An optional bounded expiration time after which an active reservation becomes eligible for idempotent release. Long-running workflows should renew explicitly rather than create indefinite leases.

### Transfer

A durable workflow moving ownership from one Inventory Account to another without creating or destroying net Item quantity, except where a typed tax or conversion owner explicitly participates.

### Transfer ID

An opaque UUID used across source, destination, escrow, and Events.

### Transfer State

One of `REQUESTED`, `VALIDATING`, `RESERVED`, `IN_ESCROW`, `COMPLETED`, `CANCELLED`, `EXPIRED`, `FAILED`, or `RECONCILIATION_REQUIRED`.

### Escrow

An Inventory-owned temporary location in which source ownership is unavailable while a cross-shard Transfer awaits destination commit. Escrow is not a marketplace or payment service.

### Consumption

An Inventory operation that decreases stack quantity or terminally transitions one Item Instance according to a registered consume capability.

### Use

An authorized invocation of an Inventory-owned Item capability. A use may consume quantity, charges, durability, or nothing, but its authoritative Inventory effect is explicit.

### Use Outcome

A typed Inventory Event or explicit Reward request reference emitted after commit. It does not directly mutate foreign Engine state.

### Destruction

An intentional terminal removal of owned quantity or an Instance where the Item destruction policy and caller authorization permit it.

### Expiration

A time-based transition at or after persisted `expires_at`. Expiration is based on server time and is idempotent.

### Expiration Bucket

A normalized value included in merge identity when copies with different expirations cannot safely share a stack.

### Durability

A registered integer-valued mutable state for an Item Instance or compatible Holding. Inventory stores and bounds it; gameplay meaning belongs to the registered consumer contract.

### Charge

A registered integer-valued use count stored on an Instance or Holding where the Item manifest defines charge semantics.

### Equipment State

The current relationship between an Item Instance or eligible Holding and one equipment Slot.

### Equipped

A non-terminal availability state indicating that the Item occupies an equipment Slot. Whether it affects another Engine is determined by a typed downstream contract.

### Quarantine

A restrictive Integrity state applied to a Holding or Instance when ownership or Item safety is uncertain. Quarantine blocks unsafe operations but preserves evidence.

### Integrity State

One of `VALID`, `CONTESTED`, `QUARANTINED`, `CORRECTION_PENDING`, or `INVALIDATED`. Integrity state is separate from ownership lifecycle.

### Correction

An approved compensating operation that repairs state while preserving the original ledger. It is not an UPDATE to historical facts.

### Fulfillment ID

The stable logical idempotency identity assigned by Reward Engine for one Reward component.

### Owner Operation Receipt

The Inventory-signed result identifying `operation_id`, affected entities, requested and applied quantity, accepted no-op status, aggregate versions, and ledger sequence range.

### Reversal ID

The stable identity of one Reward reversal workflow targeting one original Fulfillment.

### Projection

A purpose-specific read model derived from authoritative Inventory state and ledger.

### Authoritative Read

A query served from the write home or a transactionally consistent source suitable for decisions.

### Eventual Read

A projection or cache suitable for display but not for mutation preconditions.

### Home Region

The region authorized to accept writes for one Inventory Account during a routing epoch.

### Routing Epoch

A monotonic version preventing stale clients or workers from writing to a previous home after migration.

---

## Lifecycle

### Inventory Account lifecycle

```text
PROVISIONING ──activate──> ACTIVE
      │                     │
      │                     ├──policy restriction──> READ_ONLY
      │                     ├──character suspend───> SUSPENDED
      │                     └──character close─────> CLOSED
      │
      └──failure──> CLOSED

READ_ONLY ──policy clear──> ACTIVE
SUSPENDED ──character reactivate──> ACTIVE or READ_ONLY
CLOSED ──character restore──> ACTIVE or READ_ONLY
CLOSED ──privacy workflow──> ANONYMIZED
ANONYMIZED is terminal
```

Account lifecycle state controls command eligibility:

| Account state | Owner reads | Ordinary acquisition | Owner mutation | Reward fulfillment | Support correction |
|---|---:|---:|---:|---:|---:|
| `PROVISIONING` | Limited | No | No | Retryable wait | Yes |
| `ACTIVE` | Yes | Yes | Yes | Yes | Yes |
| `READ_ONLY` | Yes | Policy-specific | No | Policy-specific | Yes |
| `SUSPENDED` | Yes, privacy-safe | Normally no | No | Normally retryable or blocked | Yes |
| `CLOSED` | Export/support only | No | No | Terminally blocked unless restoration contract | Yes |
| `ANONYMIZED` | Minimal legal view | No | No | No | Integrity-only |

A Character lifecycle change never deletes Holdings or Instances. Downstream operations apply local policy after consuming the Event.

### Provisioning

Inventory Account creation is normally triggered by `character.created.v1` or `character.activated.v1`.

Provisioning MUST:

1. deduplicate the source Event;
2. create or locate the account by `character_id`;
3. assign home region and routing epoch;
4. create required root Containers;
5. initialize lifecycle and policy revision;
6. append an account ledger record;
7. publish `inventory.account.created.v1`;
8. return an accepted no-op if already provisioned from the same logical source.

Inventory provisioning does not grant starter Items. Starter Items are separate Reward or authorized acquisition workflows.

### Acquisition lifecycle

An acquisition transitions through one durable Inventory Operation:

```text
RECEIVED -> VALIDATING -> APPLYING -> SUCCEEDED
                     \-> ACCEPTED_NOOP
                     \-> REJECTED
                     \-> FAILED_RETRYABLE
                     \-> FAILED_TERMINAL
```

For synchronous APIs, intermediate states may exist only within one transaction. Event-driven fulfillment may persist retryable operational status when exact manifest resolution or a dependency is temporarily unavailable.

Acquisition validation order is normative:

1. idempotency;
2. Character and account eligibility;
3. producer and caller authorization;
4. exact Item manifest existence and compatibility;
5. quantity bounds;
6. Item lifecycle and acquisition policy;
7. uniqueness and duplicate policy;
8. binding resolution;
9. merge identity;
10. capacity and destination;
11. registered mutable-state initialization;
12. final invariant check under locks.

Changing the order may produce inconsistent external errors or race behavior and requires compatibility review.

### Stackable acquisition

For `STACKABLE` Items:

- resolve merge identity;
- locate a compatible active Holding;
- lock candidate Holdings in stable order;
- fill existing stacks up to `max_stack_quantity` if policy allows;
- create additional Holdings for remaining quantity;
- place them in the selected or overflow Container;
- append one operation and one or more quantity delta entries;
- return all affected Holding IDs.

The Engine MUST NOT merge across Item Definition Versions unless the exact Item manifest registers a compatibility mapping and an approved Inventory migration contract is used. Ordinary acquisition never performs implicit version migration.

### Virtual-unique acquisition

For `VIRTUAL_UNIQUE` Items:

- create the uniqueness key;
- serialize on the key;
- if no ownership exists, create one Holding with effective quantity one;
- if ownership exists, execute the immutable duplicate policy;
- record accepted no-op, rejection, registered conversion request, or auxiliary counter increment explicitly.

A duplicate conversion is not arbitrary. The policy must identify a registered owner contract and deterministic payload. If the converter is unavailable, the acquisition remains pending or fails according to contract; Inventory never invents a substitute.

### Non-stackable acquisition

For `NON_STACKABLE` or `instance_required` Items, the Engine creates one Item Instance per applied unit unless a registered bulk-serial contract safely allocates a range. Each Instance receives:

- server-generated `item_instance_id`;
- exact Item version and manifest fingerprint;
- binding state;
- location;
- initial typed mutable state;
- optional expiration;
- creation ledger entry.

A partial instance batch MUST NOT be reported as complete. The transaction either creates the entire bounded quantity or none, unless the request contract explicitly allows partial application and the result enumerates it.

### Move lifecycle

Move changes only location. It must:

- verify ownership and availability;
- reject unrelated reservations;
- validate destination compatibility and capacity;
- lock source and destination in canonical order;
- update one current location;
- append `MOVE_OUT` and `MOVE_IN` ledger entries or one normalized move entry;
- publish `inventory.item.moved.v1`.

Moving a Holding may require a split when only part of its quantity moves. The split is part of the same operation.

### Split lifecycle

A split creates a new Holding with the same merge identity and state-compatible fields while preserving total quantity.

Preconditions:

- source is stackable and active;
- split quantity is positive and less than available source quantity unless reservations are explicitly reassigned;
- destination can accept the new Holding;
- no uniqueness or max-stack rule is violated.

The original and new Holdings receive incremented versions and ledger entries. Split never creates net quantity.

### Merge lifecycle

Merge combines compatible Holdings in one location or approved destination.

Preconditions:

- exact merge identity equality;
- compatible lifecycle, binding, expiration, integrity, and reservation state;
- destination max-stack capacity;
- deterministic source selection.

A fully depleted source Holding becomes `DEPLETED` and is retained for history. It is not physically deleted by the command.

### Reservation lifecycle

```text
PENDING -> ACTIVE -> COMMITTED
                 \-> RELEASED
                 \-> EXPIRED
                 \-> CANCELLED
PENDING -> FAILED
```

Activation locks the referenced quantity or instances and optional capacity. Commit must be executed by the registered purpose owner and converts the reservation into the intended operation. Release and expiry restore availability.

A reservation:

- cannot exceed available quantity;
- cannot reference terminal Items;
- cannot silently change purpose;
- has one owner principal and one purpose reference;
- may have a lease and bounded renewal count;
- is idempotent by reservation ID and command key;
- survives process restart.

### Consumption lifecycle

Consumption is an atomic Inventory mutation followed by asynchronous integration Events.

For a stack:

1. validate consume capability and requested quantity;
2. exclude reserved quantity;
3. decrement quantity;
4. mark Holding `DEPLETED` when quantity reaches zero;
5. append ledger entries;
6. publish `inventory.item.consumed.v1` with capability outcome reference.

For an Instance:

- decrement registered charge or durability if the capability defines it; or
- transition to `CONSUMED` if one-time use; or
- leave ownership available when the capability is explicitly non-consuming.

Foreign outcomes occur only after the Inventory commit. If a downstream Reward or Quest reaction fails, consumed ownership is not automatically restored without an explicit compensation workflow.

### Equipment lifecycle

```text
AVAILABLE -> EQUIPPED -> AVAILABLE
RESERVED, TRANSFER_PENDING, CONSUMED, DESTROYED, EXPIRED, QUARANTINED cannot equip
```

Equip validates:

- ownership;
- exact capability and slot compatibility;
- Character and account eligibility;
- binding;
- reservation absence;
- slot availability;
- exclusive group constraints;
- current Item state.

If the target slot is occupied, replacement behavior must be explicit: reject, atomically unequip existing, or move existing to a specified safe destination. Silent displacement is prohibited.

Equipment Events publish typed facts. They do not directly change Character presentation, Talent state, or gameplay simulation.

### Destruction lifecycle

Destruction is terminal for affected quantity or Instances. It requires:

- an Item destruction policy permitting the caller class;
- explicit confirmation for owner-facing destructive actions;
- no active unrelated reservation;
- no escrow or transfer state;
- policy-specific checks for equipped Items;
- immutable reason and actor evidence.

Destroyed state is not ordinary deletion. The row and ledger remain.

### Expiration lifecycle

Each expirable entity stores `expires_at` and expiration policy snapshot. The Engine considers it semantically expired at `expires_at` even if the worker processes it later.

Authoritative availability checks compare server time to `expires_at`; they do not wait for the background worker. The worker materializes terminal state and Events idempotently.

Expiration behavior may be:

- quantity decrement;
- full Holding expiration;
- Instance transition to `EXPIRED`;
- movement to archive;
- publication of a typed conversion request where explicitly registered.

The policy cannot execute arbitrary code.

### Transfer lifecycle

For same-shard transfer:

1. authenticate sender and destination contract;
2. create Transfer operation;
3. resolve Item manifest and transfer policy;
4. lock source account, destination account, uniqueness keys, capacity, Holdings, and Instances in canonical order;
5. validate source availability and binding;
6. validate destination lifecycle, uniqueness, and capacity;
7. split source Holding if needed;
8. change ownership and location atomically;
9. append source and destination ledger entries;
10. publish one completed Transfer Event.

For cross-shard transfer, the minimum safe saga is:

```text
REQUESTED -> RESERVED -> IN_ESCROW -> DESTINATION_COMMITTED -> COMPLETED
                                      \-> RECONCILIATION_REQUIRED
```

The source becomes unavailable in escrow before destination ownership is created. A unique transfer token prevents duplication. Cancellation may restore source only before destination commit. The feature MUST remain disabled until chaos and reconciliation tests pass.

### Reward fulfillment lifecycle

Inventory receives `reward.fulfillment.requested.v1` with `componentType=ITEM`.

It MUST:

- authenticate Reward Engine as producer;
- validate component schema and owner name;
- use `fulfillment_id` as logical idempotency identity;
- verify request fingerprint consistency;
- resolve exact Item version;
- apply acquisition or accepted no-op;
- persist the Reward source reference and owner receipt;
- publish `reward.fulfillment.succeeded.v1` or sanitized `reward.fulfillment.failed.v1`;
- return the original result on duplicate attempts.

A broker timeout never authorizes a new logical fulfillment ID for the same component.

### Reward reversal lifecycle

A reversal targets one original successful Fulfillment.

Inventory verifies:

- reversal producer and schema;
- stable `reversal_id`;
- exact original operation and applied entities;
- whether copies remain owned and unmodified in a reversible state;
- whether quantity can be removed without consuming unrelated acquisitions;
- whether binding, transfer, consumption, destruction, equipment, or downstream use makes literal reversal unsafe;
- the Item's reversal capability snapshot.

If safe, Inventory appends a compensating operation and publishes `reward.reversal.succeeded.v1`. If not safe, it publishes a terminal or retryable failure explaining residual state. It never deletes the original acquisition ledger.

### Item lifecycle reaction

- `DEPRECATED`: existing ownership unchanged; new acquisition follows manifest policy and caller override rules.
- `RETIRED`: existing ownership remains; new acquisition follows `new_acquisition_policy` and historical commitment timestamp.
- `QUARANTINED`: affected ownership receives restrictions such as hide media, block use, block transfer, block equip, or quarantine state according to Event payload.
- `RECOVERED`: restrictions are recalculated from the new lifecycle overlay; ownership history remains.
- `REPLACEMENT_DECLARED`: no automatic migration occurs.
- `ERRATUM_APPLIED`: presentation projections refresh; mechanical state does not change.

### Character lifecycle reaction

- `character.suspended.v1`: account normally becomes `SUSPENDED`; owner mutation stops; support and privacy operations remain.
- `character.reactivated.v1`: account returns to prior policy-compatible active state.
- `character.closed.v1`: account becomes `CLOSED`; public projections hide and ordinary fulfillment stops.
- `character.restored.v1`: account may become `ACTIVE` after projection and policy checks.
- `character.anonymized.v1`: account becomes terminal `ANONYMIZED`; personal references are minimized and downstream privacy propagation begins.

### Correction lifecycle

A correction is proposed, simulated, approved, executed, verified, and closed. High-risk correction requires dual control.

Corrections MUST:

- reference the finding or incident;
- describe expected before and after state;
- use a registered correction type;
- use ordinary locks and constraints;
- append ledger entries;
- publish repair Events;
- preserve original operations;
- support postcondition verification.

---

## Aggregate

### Aggregate family

Inventory uses multiple bounded aggregates coordinated by one Inventory Operation. This preserves invariants without turning every Character mutation into an unbounded aggregate rewrite.

### InventoryAccount aggregate

```text
InventoryAccount
├── inventory_account_id
├── character_id
├── state
├── home_region
├── routing_epoch
├── policy_revision
├── root_container_ids
├── aggregate_version
├── created_at
└── updated_at
```

Invariants:

- one active account per Character in version 1;
- immutable account and Character identity;
- monotonic routing epoch;
- valid lifecycle transitions only;
- root container requirements satisfied;
- account state consistent with latest Character projection.

### InventoryHolding aggregate

```text
InventoryHolding
├── holding_id
├── inventory_account_id
├── item_definition_id
├── item_definition_version_id
├── manifest_fingerprint
├── merge_identity
├── stack_mode
├── quantity_total
├── quantity_reserved
├── auxiliary_counter
├── binding_scope
├── location_id
├── expires_at?
├── lifecycle_state
├── integrity_state
├── mutable_state
├── aggregate_version
└── timestamps
```

Invariants:

- only stackable or virtual-unique Items use Holdings;
- `quantity_total >= 0`;
- `quantity_reserved >= 0`;
- `quantity_reserved <= quantity_total`;
- active stack quantity does not exceed manifest max unless a migration quarantine explicitly records the violation;
- exact version and manifest fingerprint are immutable;
- merge identity changes only through a registered split or migration operation;
- one current location;
- terminal state is consistent with quantity and expiration;
- virtual-unique effective quantity is at most one.

### ItemInstance aggregate

```text
ItemInstance
├── item_instance_id
├── inventory_account_id
├── item_definition_id
├── item_definition_version_id
├── manifest_fingerprint
├── serial_reference?
├── lifecycle_state
├── availability_state
├── integrity_state
├── binding_scope
├── location_id
├── reservation_id?
├── equipped_slot_id?
├── durability?
├── charges?
├── expires_at?
├── mutable_state
├── aggregate_version
└── timestamps
```

Invariants:

- exact Item version is immutable;
- one current owner;
- one current location;
- at most one active reservation;
- equipped slot and location agree;
- terminal lifecycle states are unavailable;
- mutable fields conform to the exact registered schema;
- durability and charges remain within stored bounds;
- instance ID is never reused.

### InventoryContainer aggregate

```text
InventoryContainer
├── container_id
├── inventory_account_id
├── container_type
├── parent_container_id?
├── lifecycle_state
├── capacity_policy_version
├── occupancy_counters
├── slot_layout_version?
├── aggregate_version
└── timestamps
```

Invariants:

- container graph has bounded depth and no cycles;
- one Inventory Account owns the container unless it is registered escrow;
- capacity counters equal authoritative occupants;
- slot identities are unique within the container;
- terminal containers accept no new occupants;
- moving a container cannot create an ownership boundary violation.

### InventoryReservation aggregate

```text
InventoryReservation
├── reservation_id
├── inventory_account_id
├── purpose_type
├── purpose_reference
├── owner_principal
├── state
├── reserved_entities
├── reserved_capacity
├── expires_at?
├── aggregate_version
└── timestamps
```

Invariants:

- active reservation quantities are reflected in Holdings;
- one Instance has at most one active reservation;
- purpose and referenced entities are immutable after activation;
- terminal reservations cannot reactivate;
- commit or release is idempotent.

### InventoryTransfer aggregate

```text
InventoryTransfer
├── transfer_id
├── source_account_id
├── destination_account_id
├── item_reference
├── quantity_or_instance_ids
├── state
├── escrow_reference?
├── source_operation_id
├── destination_operation_id?
├── policy_snapshot
├── aggregate_version
└── timestamps
```

Invariants:

- source and destination differ;
- net quantity is conserved for literal transfer;
- one transfer token creates at most one destination effect;
- source cannot be restored after destination commit without a new reverse transfer;
- terminal state is immutable except approved integrity annotation.

### InventoryOperation aggregate

```text
InventoryOperation
├── operation_id
├── inventory_account_id
├── operation_kind
├── state
├── idempotency_scope
├── idempotency_key
├── request_fingerprint
├── source_reference
├── actor
├── reason_code
├── affected_entities
├── requested_effect
├── applied_effect
├── accepted_noop
├── ledger_sequence_from
├── ledger_sequence_to
├── response_snapshot
├── aggregate_version
└── timestamps
```

Invariants:

- idempotency tuple is unique;
- request fingerprint is immutable;
- successful operation has a durable response snapshot;
- ledger range exists for every applied mutation;
- rejected validation may have no ledger delta but remains auditable according to retention policy;
- terminal operation result does not change, except appended support annotations.

### Aggregate lock order

The normative lock order is:

1. account rows sorted by account ID;
2. uniqueness-lock rows sorted by uniqueness hash;
3. containers sorted by container ID;
4. Holdings sorted by Holding ID;
5. Item Instances sorted by Instance ID;
6. Reservations sorted by Reservation ID;
7. Transfers sorted by Transfer ID;
8. operation-idempotency row.

Implementations may optimize acquisition of the idempotency row before domain rows if they prove equivalent deadlock safety. All handlers must share one lock-order library.

### Aggregate versioning

Each mutable aggregate has a monotonic `aggregate_version`. A transaction increments only aggregates whose material state changed. Accepted no-op operations do not increment Item state versions but do create or return an Operation receipt.

Client commands that depend on prior state SHOULD include expected versions. Version mismatch returns a stable conflict error and the current version, without partial mutation.

---

## State Model

### Inventory Account states

#### `PROVISIONING`

The account exists but required root Containers or routing state are not complete. Ordinary writes are unavailable.

#### `ACTIVE`

Ordinary owner and service operations may proceed subject to policy.

#### `READ_ONLY`

Reads and export are allowed; ordinary owner mutations are blocked. Specific service acquisition may be permitted by explicit policy.

#### `SUSPENDED`

Character policy has temporarily disabled ordinary Inventory use. Ownership remains intact.

#### `CLOSED`

The Character is closed. Only restoration, privacy, audit, and approved support workflows remain.

#### `ANONYMIZED`

Terminal privacy state. Personal links are minimized; ordinary ownership operations are prohibited.

### Holding lifecycle states

- `ACTIVE`: positive owned quantity or active virtual ownership;
- `DEPLETED`: quantity reached zero through a committed operation;
- `EXPIRED`: all represented copies are expired;
- `DESTROYED`: all represented copies were intentionally destroyed;
- `TRANSFERRED`: ownership left the account through a completed transfer;
- `QUARANTINED`: operation is restricted pending integrity or safety resolution;
- `ARCHIVED`: retained only for history after policy-defined terminal state.

A Holding with mixed expirations or terminal status must be split before transition unless the manifest explicitly permits homogeneous bulk treatment.

### Item Instance lifecycle states

- `ACTIVE`;
- `CONSUMED`;
- `DESTROYED`;
- `EXPIRED`;
- `TRANSFERRED`;
- `INVALIDATED`.

Lifecycle state is distinct from availability and integrity.

### Item Instance availability states

- `AVAILABLE`;
- `RESERVED`;
- `EQUIPPED`;
- `IN_USE`;
- `TRANSFER_PENDING`;
- `POLICY_LOCKED`;
- `UNAVAILABLE_TERMINAL`.

Only `ACTIVE` Instances can normally be available, reserved, equipped, or in use.

### Integrity states

- `VALID`: no known integrity issue;
- `CONTESTED`: evidence conflicts but ordinary use may continue according to policy;
- `QUARANTINED`: unsafe mutations blocked;
- `CORRECTION_PENDING`: approved repair is being executed;
- `INVALIDATED`: ownership fact remains historical but is not considered valid current ownership.

Integrity transitions require reason, actor, and evidence reference.

### Reservation states

| State | Meaning | Terminal |
|---|---|---:|
| `PENDING` | Created but not yet holding resources. | No |
| `ACTIVE` | Resources and optional capacity reserved. | No |
| `COMMITTED` | Consumed by the registered purpose. | Yes |
| `RELEASED` | Explicitly returned to availability. | Yes |
| `EXPIRED` | Lease elapsed and resources released. | Yes |
| `CANCELLED` | Cancelled before activation or commit. | Yes |
| `FAILED` | Could not activate. | Yes |

### Transfer states

| State | Meaning |
|---|---|
| `REQUESTED` | Durable request exists. |
| `VALIDATING` | Policy and destination are being evaluated. |
| `RESERVED` | Source and destination capacity are reserved. |
| `IN_ESCROW` | Source is unavailable and transfer token controls release. |
| `COMPLETED` | Destination owns the Item. |
| `CANCELLED` | No destination effect; source restored if needed. |
| `EXPIRED` | Transfer window ended safely. |
| `FAILED` | Terminal failure without ambiguous ownership. |
| `RECONCILIATION_REQUIRED` | Outcome cannot be proven automatically and is quarantined. |

### Operation states

- `RECEIVED`;
- `VALIDATING`;
- `APPLYING`;
- `SUCCEEDED`;
- `ACCEPTED_NOOP`;
- `REJECTED`;
- `FAILED_RETRYABLE`;
- `FAILED_TERMINAL`;
- `RECONCILIATION_REQUIRED`.

Only one terminal logical result exists per idempotency identity.

### Quantity model

For a normal Holding:

```text
available_quantity = quantity_total - quantity_reserved - quantity_policy_locked
```

All terms are non-negative integers. `quantity_policy_locked` may be materialized or derived from homogeneous state. The implementation must not count the same unavailable unit twice.

For virtual-unique ownership, `quantity_total` is one while active and zero after terminal removal. Duplicate auxiliary counters are separate.

### Capacity model

Capacity is evaluated from registered dimensions. Supported initial dimensions are:

- distinct Holding count;
- Item Instance count;
- total unit count;
- slot occupancy;
- integer weight units;
- capability-specific integer budget.

A Container type declares which dimensions are enforced. Unknown dimensions fail publication or operation validation. Capacity arithmetic uses checked integers.

### Binding model

Binding transitions are explicit and versioned. Initial policies include:

- `UNBOUND`;
- `CHARACTER_BOUND_ON_ACQUIRE`;
- `USER_BOUND_ON_ACQUIRE`;
- `BIND_ON_EQUIP`;
- `BIND_ON_USE`;
- `MODULE_SCOPE_BOUND`;
- `NON_TRANSFERABLE` as an independent transfer declaration.

Inventory resolves the supported scope ID from authoritative projections. It never trusts the caller to supply a binding subject without verification.

### Expiration model

Expiration uses server timestamps with inclusive semantics: an Item is unavailable when `now >= expires_at` unless a registered grace contract states otherwise.

Operations store:

- expiration source;
- original timestamp;
- timezone only for display or recurrence provenance;
- policy version;
- expiration bucket;
- materialization status.

### Mutable Item state

Mutable state may contain only fields registered by the exact Item capability schema. Each field defines:

- type;
- precision;
- minimum and maximum;
- default;
- merge relevance;
- privacy classification;
- allowed operation owners;
- Event disclosure policy.

Unknown fields, schema downgrades, and unbounded strings are rejected.

### Accepted no-op model

An accepted no-op is permitted for:

- duplicate virtual-unique acquisition under `ACCEPT_NO_OP`;
- replay of an already committed idempotent request;
- release of an already terminal Reservation with the same intended result;
- unequip when the same operation already unequipped the Item;
- an explicitly idempotent quarantine or recovery transition;
- Reward reversal already completed under the same `reversal_id`.

It is not permitted merely to hide a capacity failure, missing manifest, authorization denial, or unsupported policy.

### Error classification

Errors are classified as:

- `VALIDATION`: malformed or unsupported request;
- `AUTHORIZATION`: principal cannot perform the operation;
- `CONFLICT`: expected version, reservation, capacity, uniqueness, or current state conflict;
- `POLICY`: immutable Item or Character policy forbids the action;
- `TRANSIENT`: dependency or lock condition suitable for retry;
- `INTEGRITY`: ownership outcome is uncertain or invariant violation detected;
- `INTERNAL`: sanitized unexpected failure.

Each error includes stable code, retryability, correlation ID, and safe structured details.

---
## Events

### Event envelope

Every Inventory-produced Event uses the exact camelCase canonical envelope from
`002a-platform-contract-standard`.

Character Inventory Events use `characterId` as `partitionKey`, identify the
Character as `subject`, and include the affected Inventory Aggregate identity
and version. Reward fulfillment and reversal result Events use
`rewardGrantId` as required by the cross-Engine protocol.

Inventory payloads additionally include `inventoryAccountId`, `characterId`
where permitted, `operationId`, and entity aggregate versions relevant to the
fact.

### Consumed Events

#### Character lifecycle

- `character.created.v1`;
- `character.activated.v1`;
- `character.suspended.v1`;
- `character.reactivated.v1`;
- `character.closed.v1`;
- `character.restored.v1`;
- `character.anonymized.v1`.

#### Item catalog lifecycle

- `item.definition.published.v1`;
- `item.definition.version.recommended.v1`;
- `item.definition.deprecated.v1`;
- `item.definition.retired.v1`;
- `item.definition.quarantined.v1`;
- `item.definition.recovered.v1`;
- `item.definition.replacement.declared.v1`;
- `item.presentation.erratum.applied.v1`;
- `item.catalog.compatibility.violation.detected.v1`.

#### Reward integration

- `reward.fulfillment.requested.v1` where `componentType=ITEM` and `ownerEngine=inventory`;
- `reward.reversal.requested.v1` targeting an Inventory fulfillment.

#### Authorized future integrations

- typed reservation, consumption, transfer, crafting-input, marketplace-escrow, commerce-acquisition, or correction Events registered to Inventory handlers;
- internal expiration, timeout, reconciliation, and projection-rebuild Events.

Unknown or unregistered Event types MUST NOT be routed to a generic mutation interpreter.

### Produced domain Events

#### Account lifecycle

- `inventory.account.created.v1`;
- `inventory.account.state.changed.v1`;
- `inventory.account.routing.changed.v1`;
- `inventory.account.anonymized.v1`.

#### Acquisition and ownership

- `inventory.item.acquired.v1`;
- `inventory.item.acquisition.noop.v1`;
- `inventory.holding.created.v1`;
- `inventory.holding.quantity.changed.v1`;
- `inventory.instance.created.v1`;
- `inventory.item.moved.v1`;
- `inventory.holding.split.v1`;
- `inventory.holding.merged.v1`.

#### Reservation

- `inventory.reservation.created.v1`;
- `inventory.reservation.activated.v1`;
- `inventory.reservation.committed.v1`;
- `inventory.reservation.released.v1`;
- `inventory.reservation.expired.v1`;
- `inventory.reservation.failed.v1`.

#### Interaction and lifecycle

- `inventory.item.used.v1`;
- `inventory.item.consumed.v1`;
- `inventory.item.equipped.v1`;
- `inventory.item.unequipped.v1`;
- `inventory.item.destroyed.v1`;
- `inventory.item.expired.v1`;
- `inventory.item.bound.v1`;
- `inventory.item.quarantined.v1`;
- `inventory.item.recovered.v1`.

#### Transfer

- `inventory.transfer.requested.v1`;
- `inventory.transfer.reserved.v1`;
- `inventory.transfer.escrowed.v1`;
- `inventory.transfer.completed.v1`;
- `inventory.transfer.cancelled.v1`;
- `inventory.transfer.failed.v1`;
- `inventory.transfer.reconciliation.required.v1`.

#### Operations and integrity

- `inventory.operation.rejected.v1`;
- `inventory.operation.failed.v1`;
- `inventory.integrity.violation.detected.v1`;
- `inventory.correction.applied.v1`;
- `inventory.reconciliation.completed.v1`;
- `inventory.projection.rebuilt.v1`.

#### Reward owner results

- `reward.fulfillment.succeeded.v1`;
- `reward.fulfillment.failed.v1`;
- `reward.reversal.succeeded.v1`;
- `reward.reversal.failed.v1`.

The generic Reward result Events follow Reward Engine schemas. Inventory-specific domain Events may be emitted in the same transaction with distinct Event IDs and deterministic ordinals.

### Event ordering

Events produced by one Inventory Operation include:

- one `operation_id`;
- `operation_ordinal` starting at one;
- entity aggregate versions;
- Inventory Account ledger sequence range.

Consumers MUST order facts for the same entity by aggregate version, not by wall-clock timestamps. No total global order exists across Characters.

### Event idempotency

The outbox record maps one-to-one to a stable canonical `eventId`. Retries
preserve Event ID and payload. Consumers deduplicate by Event ID and handler
version.

Inventory inbox deduplication retains enough history to cover the maximum supported replay window. Business idempotency such as `fulfillment_id` is retained according to the underlying ownership lifetime and MUST NOT expire while a Reward reversal may still reference it.

### Event minimization

Inventory Events MUST NOT contain:

- User email, legal name, or credentials;
- full hidden Item descriptions or unreleased assets;
- arbitrary mutable-state blobs;
- private administrator notes;
- payment data;
- authorization tokens;
- unnecessary location history;
- full Inventory snapshots.

Events contain only the identifiers and bounded facts needed by registered consumers.

### Event compatibility

Breaking changes require a new Event version. Producers may dual-publish during a bounded migration. Consumers declare supported versions in the platform contract registry. Optional fields cannot change authoritative meaning when omitted.

---

## Event Contracts

### Common Inventory subject

```json
{
  "inventoryAccountId": "uuid",
  "characterId": "uuid",
  "operationId": "uuid",
  "ledgerSequenceFrom": 1041,
  "ledgerSequenceTo": 1043
}
```

### `inventory.account.created.v1`

```json
{
  "inventoryAccountId": "uuid",
  "characterId": "uuid",
  "state": "ACTIVE",
  "homeRegion": "eu-central-1",
  "routingEpoch": 1,
  "rootContainers": [
    {"type": "PRIMARY", "containerId": "uuid"},
    {"type": "EQUIPMENT", "containerId": "uuid"},
    {"type": "OVERFLOW", "containerId": "uuid"}
  ],
  "aggregateVersion": 1,
  "createdAt": "2026-07-18T17:30:00Z"
}
```

### `inventory.account.state.changed.v1`

```json
{
  "inventoryAccountId": "uuid",
  "characterId": "uuid",
  "previousState": "ACTIVE",
  "state": "SUSPENDED",
  "source": {
    "eventId": "uuid",
    "eventType": "character.suspended.v1",
    "sourceOrdinal": 18
  },
  "policyRevision": 7,
  "aggregateVersion": 12,
  "changedAt": "2026-07-18T17:40:00Z"
}
```

### `inventory.item.acquired.v1`

```json
{
  "inventoryAccountId": "uuid",
  "characterId": "uuid",
  "operationId": "uuid",
  "operationKind": "ACQUIRE",
  "source": {
    "type": "REWARD_FULFILLMENT",
    "referenceId": "uuid",
    "eventId": "uuid"
  },
  "item": {
    "itemDefinitionId": "uuid",
    "itemDefinitionVersionId": "uuid",
    "itemDefinitionKey": "cosmetic.training_sash",
    "manifestFingerprint": "sha256:..."
  },
  "requestedQuantity": 1,
  "appliedQuantity": 1,
  "acceptedNoop": false,
  "affectedHoldings": [
    {
      "holdingId": "uuid",
      "quantityDelta": 1,
      "quantityAfter": 1,
      "aggregateVersion": 1
    }
  ],
  "createdInstances": [],
  "binding": {
    "type": "CHARACTER",
    "subjectId": "uuid"
  },
  "destination": {
    "containerId": "uuid",
    "overflowed": false
  },
  "ledgerSequenceFrom": 1041,
  "ledgerSequenceTo": 1042,
  "occurredAt": "2026-07-18T17:45:00Z"
}
```

For instance-required Items, `createdInstances` contains bounded summaries and `affectedHoldings` is empty. Large bulk operations publish a summary plus a secure paginated receipt reference rather than an unbounded array.

### `inventory.item.acquisition.noop.v1`

```json
{
  "inventoryAccountId": "uuid",
  "characterId": "uuid",
  "operationId": "uuid",
  "itemDefinitionVersionId": "uuid",
  "requestedQuantity": 1,
  "appliedQuantity": 0,
  "reason": "DUPLICATE_VIRTUAL_UNIQUE_ACCEPTED",
  "existingOwnership": {
    "holdingId": "uuid",
    "effectiveQuantity": 1
  },
  "duplicatePolicy": "ACCEPT_NO_OP",
  "occurredAt": "2026-07-18T17:46:00Z"
}
```

### `inventory.holding.quantity.changed.v1`

```json
{
  "inventoryAccountId": "uuid",
  "characterId": "uuid",
  "operationId": "uuid",
  "holdingId": "uuid",
  "itemDefinitionVersionId": "uuid",
  "reason": "CONSUME",
  "quantityBefore": 7,
  "quantityDelta": -1,
  "quantityAfter": 6,
  "reservedQuantityAfter": 2,
  "availableQuantityAfter": 4,
  "aggregateVersion": 19,
  "ledgerSequence": 1102,
  "occurredAt": "2026-07-18T18:00:00Z"
}
```

### `inventory.instance.created.v1`

```json
{
  "inventoryAccountId": "uuid",
  "characterId": "uuid",
  "operationId": "uuid",
  "itemInstanceId": "uuid",
  "itemDefinitionVersionId": "uuid",
  "manifestFingerprint": "sha256:...",
  "binding": {
    "type": "CHARACTER",
    "subjectId": "uuid"
  },
  "location": {
    "containerId": "uuid",
    "slotId": null
  },
  "expiresAt": null,
  "aggregateVersion": 1,
  "createdAt": "2026-07-18T18:05:00Z"
}
```

### `inventory.holding.split.v1`

```json
{
  "inventoryAccountId": "uuid",
  "characterId": "uuid",
  "operationId": "uuid",
  "sourceHolding": {
    "holdingId": "uuid",
    "quantityBefore": 20,
    "quantityAfter": 15,
    "aggregateVersion": 8
  },
  "createdHolding": {
    "holdingId": "uuid",
    "quantity": 5,
    "containerId": "uuid",
    "aggregateVersion": 1
  },
  "mergeIdentity": "sha256:...",
  "occurredAt": "2026-07-18T18:10:00Z"
}
```

### `inventory.reservation.activated.v1`

```json
{
  "inventoryAccountId": "uuid",
  "characterId": "uuid",
  "reservationId": "uuid",
  "operationId": "uuid",
  "purpose": {
    "type": "QUEST_SUBMISSION",
    "referenceId": "uuid",
    "ownerService": "quest-engine"
  },
  "reserved": [
    {
      "entityType": "HOLDING",
      "entityId": "uuid",
      "quantity": 3
    }
  ],
  "expiresAt": "2026-07-18T18:25:00Z",
  "aggregateVersion": 2,
  "activatedAt": "2026-07-18T18:15:00Z"
}
```

### `inventory.reservation.committed.v1`

```json
{
  "inventoryAccountId": "uuid",
  "characterId": "uuid",
  "reservationId": "uuid",
  "commitOperationId": "uuid",
  "purposeType": "QUEST_SUBMISSION",
  "resultingOperationKind": "CONSUME",
  "affectedEntities": [
    {"entityType": "HOLDING", "entityId": "uuid", "quantity": 3}
  ],
  "committedAt": "2026-07-18T18:20:00Z"
}
```

### `inventory.item.consumed.v1`

```json
{
  "inventoryAccountId": "uuid",
  "characterId": "uuid",
  "operationId": "uuid",
  "itemDefinitionVersionId": "uuid",
  "capability": {
    "type": "inventory.consume.v2",
    "schemaVersion": 2,
    "capabilityFingerprint": "sha256:..."
  },
  "consumed": {
    "holdingId": "uuid",
    "quantity": 1
  },
  "outcomeContract": {
    "type": "REWARD_REQUEST_REFERENCE",
    "rewardDefinitionVersionId": "uuid"
  },
  "ledgerSequence": 1120,
  "consumedAt": "2026-07-18T18:30:00Z"
}
```

The Event reports committed Inventory fact. A registered policy or Reward binding may act on the outcome contract. The Inventory transaction does not wait for the foreign effect.

### `inventory.item.used.v1`

```json
{
  "inventoryAccountId": "uuid",
  "characterId": "uuid",
  "operationId": "uuid",
  "itemInstanceId": "uuid",
  "itemDefinitionVersionId": "uuid",
  "capabilityType": "inventory.charge.use.v1",
  "stateDelta": {
    "chargesBefore": 5,
    "chargesDelta": -1,
    "chargesAfter": 4
  },
  "terminal": false,
  "usedAt": "2026-07-18T18:35:00Z"
}
```

### `inventory.item.equipped.v1`

```json
{
  "inventoryAccountId": "uuid",
  "characterId": "uuid",
  "operationId": "uuid",
  "itemInstanceId": "uuid",
  "itemDefinitionVersionId": "uuid",
  "equipment": {
    "containerId": "uuid",
    "slotId": "uuid",
    "slotType": "PRIMARY_COSMETIC",
    "layoutVersion": 3
  },
  "previousLocation": {
    "containerId": "uuid",
    "slotId": null
  },
  "aggregateVersion": 9,
  "equippedAt": "2026-07-18T18:40:00Z"
}
```

### `inventory.item.expired.v1`

```json
{
  "inventoryAccountId": "uuid",
  "characterId": "uuid",
  "operationId": "uuid",
  "entityType": "ITEM_INSTANCE",
  "entityId": "uuid",
  "itemDefinitionVersionId": "uuid",
  "expiresAt": "2026-07-18T18:00:00Z",
  "materializedAt": "2026-07-18T18:02:12Z",
  "lateByMilliseconds": 132000,
  "expirationPolicyVersion": 2,
  "resultingState": "EXPIRED"
}
```

### `inventory.transfer.completed.v1`

```json
{
  "transferId": "uuid",
  "source": {
    "inventoryAccountId": "uuid",
    "characterId": "uuid",
    "operationId": "uuid"
  },
  "destination": {
    "inventoryAccountId": "uuid",
    "characterId": "uuid",
    "operationId": "uuid"
  },
  "itemDefinitionVersionId": "uuid",
  "quantity": 2,
  "sourceEntities": ["uuid"],
  "destinationEntities": ["uuid"],
  "transferPolicyVersion": 1,
  "completedAt": "2026-07-18T18:50:00Z"
}
```

Public or broadly subscribed Event streams SHOULD pseudonymize or omit counterparty Character IDs. Full transfer evidence is restricted.

### Item Reward fulfillment request

Inventory accepts the Reward Engine generic envelope with this payload:

The following object is the registered `componentPayload`; the generic fields
including `fulfillmentId`, `characterId`, `ownerEngine`, and
`requestFingerprint` remain at the canonical outer payload level.

```json
{
  "itemDefinitionKey": "cosmetic.training_sash",
  "itemDefinitionVersionId": "uuid",
  "quantity": 1,
  "stackingPolicyExpectation": "OWNER_DEFAULT",
  "metadata": {}
}
```

Additional Inventory-specific constraints:

- `quantity` is an integer greater than zero and within registered batch limits;
- `itemDefinitionKey` must match the exact resolved version;
- `metadata` is empty by default and accepts only allowlisted fields defined by component schema;
- Reward cannot override binding, uniqueness, stack mode, expiration, or destination policy;
- preferred destination may be accepted only through a registered field and still remains subject to Inventory policy;
- fulfillment committed time is taken from the signed Reward envelope for historical retirement policy.

### `reward.fulfillment.succeeded.v1` for Item

```json
{
  "rewardGrantId": "uuid",
  "componentId": "uuid",
  "fulfillmentId": "uuid",
  "characterId": "uuid",
  "requestFingerprint": "sha256:...",
  "componentType": "ITEM",
  "ownerEngine": "inventory",
  "ownerOperationId": "uuid",
  "ownerAggregate": {
    "type": "INVENTORY_ACCOUNT",
    "id": "uuid",
    "version": 41
  },
  "outcome": {
    "status": "APPLIED",
    "itemDefinitionVersionId": "uuid",
    "requestedQuantity": 1,
    "appliedQuantity": 1,
    "acceptedNoop": false,
    "holdingIds": ["uuid"],
    "itemInstanceIds": [],
    "overflowed": false,
    "ledgerSequenceFrom": 1041,
    "ledgerSequenceTo": 1042
  },
  "fulfilledAt": "2026-07-18T17:45:00Z"
}
```

For duplicate `ACCEPT_NO_OP`, `status` is `ACCEPTED_NOOP`, `appliedQuantity` is zero, `acceptedNoop` is true, and the existing ownership reference is included.

### `reward.fulfillment.failed.v1` for Item

```json
{
  "rewardGrantId": "uuid",
  "componentId": "uuid",
  "fulfillmentId": "uuid",
  "characterId": "uuid",
  "requestFingerprint": "sha256:...",
  "componentType": "ITEM",
  "ownerEngine": "inventory",
  "ownerOperationId": "uuid",
  "failure": {
    "class": "RETRYABLE",
    "code": "inventory.itemManifest.unavailable",
    "messageKey": "reward.fulfillment.temporarily_unavailable",
    "retryable": true,
    "retryAfterSeconds": 30,
    "details": {
      "itemDefinitionVersionId": "uuid"
    }
  },
  "failedAt": "2026-07-18T17:45:02Z"
}
```

Internal errors, hidden Item data, capacity topology, and authorization policy details are sanitized.

### `reward.reversal.requested.v1` Item payload

```json
{
  "rewardGrantId": "uuid",
  "componentId": "uuid",
  "fulfillmentId": "uuid",
  "reversalId": "uuid",
  "characterId": "uuid",
  "requestFingerprint": "sha256:...",
  "componentType": "ITEM",
  "ownerEngine": "inventory",
  "originalOwnerOperationId": "uuid",
  "requestedScope": "FULL_APPLIED_EFFECT",
  "reasonCode": "SOURCE_EVENT_CORRECTED",
  "requestedAt": "2026-07-18T19:00:00Z"
}
```

### `reward.reversal.succeeded.v1` for Item

```json
{
  "rewardGrantId": "uuid",
  "componentId": "uuid",
  "fulfillmentId": "uuid",
  "reversalId": "uuid",
  "characterId": "uuid",
  "requestFingerprint": "sha256:...",
  "componentType": "ITEM",
  "ownerEngine": "inventory",
  "ownerOperationId": "uuid",
  "originalOwnerOperationId": "uuid",
  "outcome": {
    "status": "REVERSED",
    "removedQuantity": 1,
    "affectedHoldingIds": ["uuid"],
    "affectedItemInstanceIds": [],
    "residualQuantity": 0,
    "acceptedNoop": false
  },
  "reversedAt": "2026-07-18T19:00:01Z"
}
```

### `reward.reversal.failed.v1` for Item

```json
{
  "rewardGrantId": "uuid",
  "componentId": "uuid",
  "fulfillmentId": "uuid",
  "reversalId": "uuid",
  "characterId": "uuid",
  "requestFingerprint": "sha256:...",
  "componentType": "ITEM",
  "ownerEngine": "inventory",
  "originalOwnerOperationId": "uuid",
  "failure": {
    "class": "TERMINAL",
    "code": "inventory.reversal.itemAlreadyConsumed",
    "messageKey": "inventory.reversal.item_already_consumed",
    "retryable": false,
    "retryAfterSeconds": null,
    "residualState": {
      "appliedQuantity": 1,
      "reversibleQuantity": 0,
      "consumedQuantity": 1
    }
  },
  "failedAt": "2026-07-18T19:00:01Z"
}
```

### `inventory.integrity.violation.detected.v1`

```json
{
  "findingId": "uuid",
  "inventoryAccountId": "uuid",
  "severity": "HIGH",
  "findingType": "RESERVED_QUANTITY_EXCEEDS_TOTAL",
  "affectedEntities": [
    {"entityType": "HOLDING", "entityId": "uuid"}
  ],
  "detectedBy": "ledger_state_reconciler.v3",
  "automaticAction": "QUARANTINE_ENTITY",
  "detectedAt": "2026-07-18T19:10:00Z"
}
```

### `inventory.correction.applied.v1`

```json
{
  "correctionId": "uuid",
  "findingId": "uuid",
  "inventoryAccountId": "uuid",
  "operationId": "uuid",
  "correctionType": "REBUILD_RESERVED_QUANTITY",
  "beforeStateHash": "sha256:...",
  "afterStateHash": "sha256:...",
  "ledgerSequenceFrom": 1201,
  "ledgerSequenceTo": 1202,
  "approvedBy": ["uuid", "uuid"],
  "appliedAt": "2026-07-18T19:20:00Z"
}
```

### Error contract

```json
{
  "error": {
    "code": "INVENTORY_INSUFFICIENT_AVAILABLE_QUANTITY",
    "message": "The requested quantity is not currently available.",
    "messageKey": "inventory.error.insufficient_quantity",
    "retryable": false,
    "correlationId": "uuid",
    "details": {
      "holdingId": "uuid",
      "requestedQuantity": 5,
      "availableQuantity": 3
    }
  }
}
```

Stable error codes include:

- `INVENTORY_ACCOUNT_NOT_FOUND`;
- `INVENTORY_ACCOUNT_NOT_ACTIVE`;
- `INVENTORY_ACCOUNT_READ_ONLY`;
- `INVENTORY_CHARACTER_SUSPENDED`;
- `INVENTORY_CHARACTER_CLOSED`;
- `INVENTORY_ITEM_DEFINITION_VERSION_NOT_FOUND`;
- `INVENTORY_ITEM_DEFINITION_VERSION_NOT_ACQUIRABLE`;
- `INVENTORY_ITEM_MANIFEST_UNAVAILABLE`;
- `INVENTORY_ITEM_MANIFEST_FINGERPRINT_MISMATCH`;
- `INVENTORY_ITEM_SCHEMA_UNSUPPORTED`;
- `INVENTORY_QUANTITY_INVALID`;
- `INVENTORY_QUANTITY_OVERFLOW`;
- `INVENTORY_INSUFFICIENT_AVAILABLE_QUANTITY`;
- `INVENTORY_STACK_LIMIT_EXCEEDED`;
- `INVENTORY_MERGE_INCOMPATIBLE`;
- `INVENTORY_UNIQUENESS_CONFLICT`;
- `INVENTORY_DUPLICATE_REJECTED`;
- `INVENTORY_DUPLICATE_CONVERSION_UNAVAILABLE`;
- `INVENTORY_CAPACITY_EXCEEDED`;
- `INVENTORY_OVERFLOW_UNAVAILABLE`;
- `INVENTORY_BINDING_FORBIDS_OPERATION`;
- `INVENTORY_TRANSFER_NOT_ALLOWED`;
- `INVENTORY_DESTINATION_NOT_ELIGIBLE`;
- `INVENTORY_ITEM_RESERVED`;
- `INVENTORY_RESERVATION_NOT_FOUND`;
- `INVENTORY_RESERVATION_EXPIRED`;
- `INVENTORY_RESERVATION_CONFLICT`;
- `INVENTORY_ITEM_NOT_AVAILABLE`;
- `INVENTORY_ITEM_EXPIRED`;
- `INVENTORY_ITEM_QUARANTINED`;
- `INVENTORY_ITEM_NOT_CONSUMABLE`;
- `INVENTORY_ITEM_NOT_EQUIPPABLE`;
- `INVENTORY_SLOT_INCOMPATIBLE`;
- `INVENTORY_SLOT_OCCUPIED`;
- `INVENTORY_DESTRUCTION_FORBIDDEN`;
- `INVENTORY_EXPECTED_VERSION_MISMATCH`;
- `INVENTORY_IDEMPOTENCY_CONFLICT`;
- `INVENTORY_FULFILLMENT_FINGERPRINT_CONFLICT`;
- `INVENTORY_REVERSAL_NOT_FOUND`;
- `INVENTORY_REVERSAL_NOT_SAFE`;
- `INVENTORY_REVERSAL_ITEM_ALREADY_CONSUMED`;
- `INVENTORY_REVERSAL_ITEM_TRANSFERRED`;
- `INVENTORY_ROUTING_EPOCH_STALE`;
- `INVENTORY_INTEGRITY_QUARANTINE`;
- `INVENTORY_OPERATION_RETRY_LATER`;
- `INVENTORY_INTERNAL_ERROR`.

---
## Read Models

Read models are purpose-specific and MUST NOT be treated as mutation authority unless explicitly marked authoritative.

### Owner Inventory Overview

Provides:

- Inventory Account state;
- total distinct Item count;
- total Instance count;
- overflow count;
- active reservation count;
- expiring-soon count;
- equipment summary;
- projection watermark;
- authoritative-read link when freshness is insufficient.

### Owner Item List

A paginated projection grouped or ungrouped by Item according to client needs. Each row includes:

- exact Item Definition Version reference;
- authorized localized presentation snapshot or Item lookup reference;
- total, available, reserved, and equipped quantity;
- Holding and Instance summaries;
- binding and transferability summary;
- expiration summary;
- current restrictions;
- projection version.

Hidden Item content is disclosed according to the Item Definition disclosure policy and caller authorization. Ownership existence may itself be sensitive.

### Holding Detail

An authoritative or near-authoritative view containing:

- Holding identity and version;
- exact Item manifest reference;
- merge identity summary;
- quantity breakdown;
- location;
- binding;
- expiration;
- mutable state;
- active Reservations;
- integrity state;
- permitted next operations with policy reasons.

### Item Instance Detail

Contains:

- Item Instance ID;
- exact Item version;
- lifecycle, availability, and integrity states;
- location and equipment slot;
- binding;
- durability, charges, and typed mutable state;
- expiration;
- active Reservation;
- provenance summary;
- recent operation history;
- supported owner actions.

Sensitive serial references are redacted unless scope permits.

### Equipment Projection

Optimized by Character and equipment layout. It includes each slot, occupant, exact Item version, equipment revision, and effective restrictions. It is suitable for downstream facts only when accompanied by a monotonic revision.

### Ownership Fact Projection

A compact internal projection answering:

```text
Does character_id own item_definition_id or version?
How much is total, available, or equipped?
What is the authoritative projection revision?
```

Consumers must declare whether they require exact version, stable Item identity, category, tag, or capability. Broad tag-based queries may be eventually consistent and must not be used for destructive operations.

### Item Count Projection

Aggregates quantity by Character, Item Definition, version, state, and optional Module scope. This projection supports Quest, Achievement, Collection, and analytics reads but does not replace authoritative availability checks.

### Reservation View

Provides reservation purpose, owner service, entities, quantities, lease, state, and commit/release permissions. Owner-facing clients receive only safe purpose labels.

### Transfer View

Provides source or destination perspective, state, Item summary, quantity, counterparty disclosure allowed by policy, expiry, and support status.

### Inventory History

A paginated owner-safe history derived from Ledger and operation presentation snapshots. It includes acquisitions, uses, moves, equipment changes, transfers, expirations, and corrections without exposing internal security notes.

### Reward Fulfillment Receipt View

Internal view by `fulfillment_id`, `reward_grant_id`, or operation ID. It returns the immutable request fingerprint, Item reference, applied entities, quantities, accepted no-op state, result Event IDs, and reversal state.

### Support Inventory View

Restricted view combining:

- account state and routing;
- authoritative Holdings and Instances;
- active Reservations and Transfers;
- ledger range;
- projection lag;
- Item manifest compatibility;
- integrity findings;
- outbox and inbox state;
- safe correction actions.

Support views are auditable and purpose-bound.

### Public Equipment View

Contains only Items intentionally exposed by Character presentation or a registered public equipment policy. Inventory ownership alone does not make an Item public.

### Projection watermarks

Every eventual projection includes:

- source ledger sequence;
- last operation ID;
- built-at timestamp;
- schema version;
- optional lag in milliseconds;
- rebuild generation.

Clients must not infer that absence from a stale projection proves non-ownership.

### Caching

Cache keys include caller visibility class, Character ID, projection revision, locale where presentation is embedded, and disclosure policy revision. Cache invalidation is Event-driven. Sensitive owner views must not be shared across principals.

---

## Write Models

All state changes are command based. External callers cannot submit arbitrary row patches.

### Command envelope

```json
{
  "commandId": "uuid",
  "commandType": "inventory.acquire.v1",
  "idempotencyKey": "caller-scoped-key",
  "correlationId": "uuid",
  "expectedRoutingEpoch": 3,
  "expectedAggregateVersions": {},
  "actor": {
    "type": "SERVICE",
    "id": "reward-engine"
  },
  "reasonCode": "REWARD_FULFILLMENT",
  "payload": {}
}
```

Commands are canonicalized before fingerprinting. Unknown fields fail according to schema policy rather than being silently ignored.

### `ProvisionInventoryAccount`

Inputs:

- Character ID;
- source Character Event ID and ordinal;
- desired home region;
- policy revision.

Behavior:

- creates one account and required root Containers;
- returns existing account on identical replay;
- rejects conflicting Character identity;
- publishes account creation.

### `AcquireItem`

Trusted internal command used by Reward fulfillment, commerce settlement, migration, or approved Module integrations.

Inputs:

- Inventory Account or Character ID;
- exact Item Definition Version ID;
- positive quantity;
- source reference;
- preferred destination policy key;
- idempotency identity;
- optional registered acquisition context;
- committed-at timestamp when historical fulfillment policy requires it.

The caller cannot override immutable Item semantics.

### `MoveInventoryEntity`

Inputs:

- Holding ID and quantity, or Item Instance ID;
- source version;
- destination Container or Slot;
- replacement behavior where target slot is occupied;
- idempotency key.

Partial Holding moves perform an atomic split.

### `SplitHolding`

Inputs:

- source Holding ID;
- split quantity;
- expected version;
- destination;
- optional reservation reassignment contract.

### `MergeHoldings`

Inputs:

- source Holding IDs;
- destination Holding ID or destination Container;
- expected versions.

The Engine recomputes merge compatibility; caller assertions are not authoritative.

### `CreateReservation`

Inputs:

- purpose type and reference;
- requested Holding quantities or Instance IDs;
- optional destination capacity;
- lease duration bounded by purpose policy;
- owner service;
- idempotency key.

### `CommitReservation`

Inputs:

- Reservation ID;
- purpose-owner authorization;
- expected reservation version;
- registered resulting operation and payload.

Only resulting operations registered for the Reservation purpose are accepted.

### `ReleaseReservation`

Inputs:

- Reservation ID;
- expected version;
- release reason.

Repeated release returns original terminal outcome.

### `ConsumeItem`

Inputs:

- Holding quantity or Item Instance ID;
- exact capability type and version;
- expected entity version;
- use context from a registered schema;
- idempotency key.

Inventory resolves the capability from the exact Item manifest; the client cannot submit an outcome contract.

### `EquipItem`

Inputs:

- Item Instance ID or eligible Holding reference;
- equipment Slot ID;
- expected Item and Slot versions;
- replacement policy;
- idempotency key.

### `UnequipItem`

Inputs:

- equipped entity;
- destination Container;
- expected versions;
- idempotency key.

### `DestroyItem`

Inputs:

- Holding quantity or Instance ID;
- expected version;
- explicit confirmation token where owner-facing;
- reason code;
- idempotency key.

### `TransferItem`

Inputs:

- source Character or account;
- destination Character or account;
- Holding quantity or Instance IDs;
- transfer policy key;
- expected versions;
- destination disclosure and authorization context;
- idempotency key.

The feature may return `INVENTORY_TRANSFER_NOT_ENABLED` even if Item semantics allow transfer.

### `ApplyExpiration`

Internal command containing entity identity, expected expiry timestamp, policy version, and worker claim token. If state already reflects the same expiration, it returns accepted no-op.

### `ApplyItemQuarantine`

Internal command from Item lifecycle projection or security workflow. It applies only registered restrictions and records source Event ordinal.

### `CorrectInventoryState`

Restricted command requiring:

- correction proposal ID;
- finding or incident ID;
- correction type;
- exact target entities;
- before-state hash;
- expected versions;
- approval evidence;
- dry-run fingerprint;
- reason and ticket reference.

Arbitrary quantity values are not accepted outside a registered correction type.

### Reward fulfillment handler

The handler validates `reward.fulfillment.requested.v1`, derives the command fingerprint from the immutable Reward envelope, and invokes `AcquireItem` with:

- idempotency scope `REWARD_ITEM_FULFILLMENT`;
- idempotency key `fulfillment_id`;
- source reference containing Reward Grant and component IDs;
- exact Item version and quantity;
- historical commitment timestamp;
- Reward request fingerprint.

It persists the generic Reward result Event in the same transaction as the acquisition.

### Reward reversal handler

The handler resolves the original operation by `fulfillment_id`, verifies `reversal_id` uniqueness and request fingerprint, computes a bounded impact plan, and executes `ReverseAcquisition`.

Reversal removes only copies proven to originate from the target fulfillment. For stackable Holdings, provenance allocation must support this proof through ledger lots or equivalent deterministic accounting. FIFO removal without provenance is insufficient for authoritative reversal.

### Bulk operations

Bulk grant, migration, expiration, quarantine, or correction jobs are represented as resumable Jobs containing:

- immutable job definition;
- target selector snapshot;
- dry-run result and sample;
- approval state;
- rate and concurrency limits;
- cursor;
- per-target idempotency keys;
- success, no-op, rejection, and failure counts;
- cancellation policy;
- audit and verification state.

A bulk job is not one unbounded transaction.

---

## Database Schema

The following PostgreSQL-style schema is a normative reference model. Implementations may rename physical objects but MUST preserve ownership, constraints, idempotency, ledger, and lifecycle semantics.

### Extensions and conventions

```sql
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- UUIDs are generated server-side.
-- All timestamps are timestamptz in UTC.
-- Quantities use bigint with checked arithmetic.
-- JSONB is allowed only behind registered schemas and size limits.
```

### `inventory_accounts`

```sql
CREATE TABLE inventory_accounts (
    inventory_account_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    character_id uuid NOT NULL UNIQUE,
    state text NOT NULL CHECK (state IN (
        'PROVISIONING','ACTIVE','READ_ONLY','SUSPENDED','CLOSED','ANONYMIZED'
    )),
    home_region text NOT NULL,
    routing_epoch bigint NOT NULL DEFAULT 1 CHECK (routing_epoch > 0),
    policy_revision bigint NOT NULL DEFAULT 1 CHECK (policy_revision > 0),
    character_source_ordinal bigint NOT NULL DEFAULT 0 CHECK (character_source_ordinal >= 0),
    aggregate_version bigint NOT NULL DEFAULT 1 CHECK (aggregate_version > 0),
    created_at timestamptz NOT NULL,
    updated_at timestamptz NOT NULL,
    closed_at timestamptz,
    anonymized_at timestamptz
);

CREATE INDEX inventory_accounts_state_idx
    ON inventory_accounts (state, updated_at);
```

### `inventory_character_projection`

```sql
CREATE TABLE inventory_character_projection (
    character_id uuid PRIMARY KEY,
    lifecycle_state text NOT NULL,
    mutation_policy text NOT NULL,
    source_event_id uuid NOT NULL,
    source_ordinal bigint NOT NULL,
    routing_hint text,
    updated_at timestamptz NOT NULL
);
```

### `inventory_item_manifests`

Verified immutable cache:

```sql
CREATE TABLE inventory_item_manifests (
    item_definition_version_id uuid PRIMARY KEY,
    item_definition_id uuid NOT NULL,
    item_definition_key text NOT NULL,
    version_number integer NOT NULL CHECK (version_number > 0),
    manifest_schema text NOT NULL,
    manifest_schema_version integer NOT NULL,
    manifest_fingerprint text NOT NULL,
    mechanical_fingerprint text NOT NULL,
    inventory_semantics jsonb NOT NULL,
    capability_manifest jsonb NOT NULL,
    disclosure_policy jsonb NOT NULL,
    publication_status text NOT NULL,
    lifecycle_overlay jsonb NOT NULL,
    source_publication_sequence bigint NOT NULL,
    verified_at timestamptz NOT NULL,
    cached_at timestamptz NOT NULL,
    UNIQUE (item_definition_id, version_number),
    UNIQUE (item_definition_key, item_definition_version_id)
);
```

Database roles that process ordinary Inventory mutations MAY read but MUST NOT update immutable manifest body columns. Lifecycle overlay updates are performed by a restricted projector and source-sequence check.

### `inventory_containers`

```sql
CREATE TABLE inventory_containers (
    container_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    inventory_account_id uuid NOT NULL REFERENCES inventory_accounts,
    container_type text NOT NULL,
    parent_container_id uuid REFERENCES inventory_containers,
    lifecycle_state text NOT NULL CHECK (lifecycle_state IN ('ACTIVE','LOCKED','CLOSED','ARCHIVED')),
    capacity_policy_version_id uuid NOT NULL,
    slot_layout_version_id uuid,
    occupancy_distinct_holdings bigint NOT NULL DEFAULT 0 CHECK (occupancy_distinct_holdings >= 0),
    occupancy_instances bigint NOT NULL DEFAULT 0 CHECK (occupancy_instances >= 0),
    occupancy_units bigint NOT NULL DEFAULT 0 CHECK (occupancy_units >= 0),
    occupancy_weight_units bigint NOT NULL DEFAULT 0 CHECK (occupancy_weight_units >= 0),
    aggregate_version bigint NOT NULL DEFAULT 1 CHECK (aggregate_version > 0),
    created_at timestamptz NOT NULL,
    updated_at timestamptz NOT NULL,
    UNIQUE (inventory_account_id, container_type, container_id)
);

CREATE INDEX inventory_containers_account_idx
    ON inventory_containers (inventory_account_id, lifecycle_state);
```

Container graph cycle prevention is enforced by a bounded-depth command validator and a deferred integrity check or closure table.

### `inventory_slots`

```sql
CREATE TABLE inventory_slots (
    slot_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    container_id uuid NOT NULL REFERENCES inventory_containers,
    slot_key text NOT NULL,
    slot_type text NOT NULL,
    compatibility_contract_version_id uuid NOT NULL,
    occupancy_limit integer NOT NULL DEFAULT 1 CHECK (occupancy_limit > 0),
    aggregate_version bigint NOT NULL DEFAULT 1 CHECK (aggregate_version > 0),
    created_at timestamptz NOT NULL,
    updated_at timestamptz NOT NULL,
    UNIQUE (container_id, slot_key)
);
```

### `inventory_holdings`

```sql
CREATE TABLE inventory_holdings (
    holding_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    inventory_account_id uuid NOT NULL REFERENCES inventory_accounts,
    item_definition_id uuid NOT NULL,
    item_definition_version_id uuid NOT NULL REFERENCES inventory_item_manifests,
    manifest_fingerprint text NOT NULL,
    stack_mode text NOT NULL CHECK (stack_mode IN ('STACKABLE','VIRTUAL_UNIQUE')),
    merge_identity text NOT NULL,
    quantity_total bigint NOT NULL CHECK (quantity_total >= 0),
    quantity_reserved bigint NOT NULL DEFAULT 0 CHECK (quantity_reserved >= 0),
    quantity_policy_locked bigint NOT NULL DEFAULT 0 CHECK (quantity_policy_locked >= 0),
    auxiliary_counter bigint NOT NULL DEFAULT 0 CHECK (auxiliary_counter >= 0),
    binding_type text NOT NULL,
    binding_subject_id uuid,
    container_id uuid NOT NULL REFERENCES inventory_containers,
    expires_at timestamptz,
    expiration_bucket text,
    lifecycle_state text NOT NULL CHECK (lifecycle_state IN (
        'ACTIVE','DEPLETED','EXPIRED','DESTROYED','TRANSFERRED','QUARANTINED','ARCHIVED'
    )),
    integrity_state text NOT NULL CHECK (integrity_state IN (
        'VALID','CONTESTED','QUARANTINED','CORRECTION_PENDING','INVALIDATED'
    )),
    mutable_state jsonb NOT NULL DEFAULT '{}'::jsonb,
    aggregate_version bigint NOT NULL DEFAULT 1 CHECK (aggregate_version > 0),
    created_at timestamptz NOT NULL,
    updated_at timestamptz NOT NULL,
    terminal_at timestamptz,
    CHECK (quantity_reserved + quantity_policy_locked <= quantity_total)
);

CREATE INDEX inventory_holdings_account_item_idx
    ON inventory_holdings (inventory_account_id, item_definition_id, lifecycle_state);

CREATE INDEX inventory_holdings_account_version_idx
    ON inventory_holdings (inventory_account_id, item_definition_version_id, lifecycle_state);

CREATE INDEX inventory_holdings_merge_idx
    ON inventory_holdings (inventory_account_id, container_id, merge_identity)
    WHERE lifecycle_state = 'ACTIVE';

CREATE INDEX inventory_holdings_expiry_idx
    ON inventory_holdings (expires_at, holding_id)
    WHERE lifecycle_state = 'ACTIVE' AND expires_at IS NOT NULL;
```

A trigger or stored constraint function SHOULD validate checked arithmetic and virtual-unique quantity rules using the cached manifest class.

### `inventory_uniqueness_claims`

```sql
CREATE TABLE inventory_uniqueness_claims (
    uniqueness_hash text PRIMARY KEY,
    item_definition_id uuid NOT NULL,
    uniqueness_scope_type text NOT NULL,
    uniqueness_scope_id uuid NOT NULL,
    inventory_account_id uuid NOT NULL REFERENCES inventory_accounts,
    holding_id uuid REFERENCES inventory_holdings,
    item_instance_id uuid,
    state text NOT NULL CHECK (state IN ('ACTIVE','RELEASING','RELEASED','QUARANTINED')),
    created_operation_id uuid NOT NULL,
    released_operation_id uuid,
    created_at timestamptz NOT NULL,
    released_at timestamptz
);

CREATE UNIQUE INDEX inventory_uniqueness_active_entity_idx
    ON inventory_uniqueness_claims (holding_id, item_instance_id)
    WHERE state = 'ACTIVE';
```

### `inventory_item_instances`

```sql
CREATE TABLE inventory_item_instances (
    item_instance_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    inventory_account_id uuid NOT NULL REFERENCES inventory_accounts,
    item_definition_id uuid NOT NULL,
    item_definition_version_id uuid NOT NULL REFERENCES inventory_item_manifests,
    manifest_fingerprint text NOT NULL,
    serial_reference text,
    lifecycle_state text NOT NULL CHECK (lifecycle_state IN (
        'ACTIVE','CONSUMED','DESTROYED','EXPIRED','TRANSFERRED','INVALIDATED'
    )),
    availability_state text NOT NULL CHECK (availability_state IN (
        'AVAILABLE','RESERVED','EQUIPPED','IN_USE','TRANSFER_PENDING','POLICY_LOCKED','UNAVAILABLE_TERMINAL'
    )),
    integrity_state text NOT NULL CHECK (integrity_state IN (
        'VALID','CONTESTED','QUARANTINED','CORRECTION_PENDING','INVALIDATED'
    )),
    binding_type text NOT NULL,
    binding_subject_id uuid,
    container_id uuid NOT NULL REFERENCES inventory_containers,
    slot_id uuid REFERENCES inventory_slots,
    active_reservation_id uuid,
    durability bigint,
    durability_max bigint,
    charges bigint,
    charges_max bigint,
    expires_at timestamptz,
    mutable_state jsonb NOT NULL DEFAULT '{}'::jsonb,
    aggregate_version bigint NOT NULL DEFAULT 1 CHECK (aggregate_version > 0),
    created_at timestamptz NOT NULL,
    updated_at timestamptz NOT NULL,
    terminal_at timestamptz,
    CHECK (durability IS NULL OR durability >= 0),
    CHECK (durability_max IS NULL OR durability_max >= 0),
    CHECK (durability IS NULL OR durability_max IS NULL OR durability <= durability_max),
    CHECK (charges IS NULL OR charges >= 0),
    CHECK (charges_max IS NULL OR charges_max >= 0),
    CHECK (charges IS NULL OR charges_max IS NULL OR charges <= charges_max)
);

CREATE INDEX inventory_instances_account_item_idx
    ON inventory_item_instances (inventory_account_id, item_definition_id, lifecycle_state);

CREATE INDEX inventory_instances_location_idx
    ON inventory_item_instances (container_id, slot_id, availability_state);

CREATE INDEX inventory_instances_expiry_idx
    ON inventory_item_instances (expires_at, item_instance_id)
    WHERE lifecycle_state = 'ACTIVE' AND expires_at IS NOT NULL;
```

The `active_reservation_id` foreign key may be added as deferrable after Reservation table creation.

### `inventory_holding_lots`

Tracks acquisition provenance for stackable reversal and audit:

```sql
CREATE TABLE inventory_holding_lots (
    holding_lot_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    holding_id uuid NOT NULL REFERENCES inventory_holdings,
    acquisition_operation_id uuid NOT NULL,
    source_type text NOT NULL,
    source_reference_id uuid,
    fulfillment_id uuid,
    quantity_original bigint NOT NULL CHECK (quantity_original > 0),
    quantity_remaining bigint NOT NULL CHECK (quantity_remaining >= 0),
    acquired_at timestamptz NOT NULL,
    expires_at timestamptz,
    lot_state text NOT NULL CHECK (lot_state IN ('ACTIVE','DEPLETED','REVERSED','QUARANTINED')),
    CHECK (quantity_remaining <= quantity_original)
);

CREATE UNIQUE INDEX inventory_lots_fulfillment_idx
    ON inventory_holding_lots (fulfillment_id, holding_lot_id)
    WHERE fulfillment_id IS NOT NULL;
```

Lot allocation policy for ordinary consumption is deterministic and versioned, for example earliest-expiry-first then acquisition sequence. Reward reversal targets the original lot and fails safely if insufficient original quantity remains.

### `inventory_instance_provenance`

```sql
CREATE TABLE inventory_instance_provenance (
    item_instance_id uuid PRIMARY KEY REFERENCES inventory_item_instances,
    acquisition_operation_id uuid NOT NULL,
    source_type text NOT NULL,
    source_reference_id uuid,
    fulfillment_id uuid,
    acquired_at timestamptz NOT NULL,
    reversal_operation_id uuid,
    UNIQUE (fulfillment_id, item_instance_id)
);
```

### `inventory_reservations`

```sql
CREATE TABLE inventory_reservations (
    reservation_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    inventory_account_id uuid NOT NULL REFERENCES inventory_accounts,
    purpose_type text NOT NULL,
    purpose_reference_id uuid NOT NULL,
    owner_service text NOT NULL,
    state text NOT NULL CHECK (state IN (
        'PENDING','ACTIVE','COMMITTED','RELEASED','EXPIRED','CANCELLED','FAILED'
    )),
    expires_at timestamptz,
    aggregate_version bigint NOT NULL DEFAULT 1 CHECK (aggregate_version > 0),
    created_operation_id uuid NOT NULL,
    terminal_operation_id uuid,
    created_at timestamptz NOT NULL,
    updated_at timestamptz NOT NULL,
    terminal_at timestamptz,
    UNIQUE (owner_service, purpose_type, purpose_reference_id)
);

CREATE INDEX inventory_reservations_expiry_idx
    ON inventory_reservations (expires_at, reservation_id)
    WHERE state = 'ACTIVE' AND expires_at IS NOT NULL;
```

### `inventory_reservation_items`

```sql
CREATE TABLE inventory_reservation_items (
    reservation_item_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    reservation_id uuid NOT NULL REFERENCES inventory_reservations,
    entity_type text NOT NULL CHECK (entity_type IN ('HOLDING','ITEM_INSTANCE','CAPACITY')),
    holding_id uuid REFERENCES inventory_holdings,
    item_instance_id uuid REFERENCES inventory_item_instances,
    container_id uuid REFERENCES inventory_containers,
    quantity bigint,
    created_at timestamptz NOT NULL,
    CHECK (
      (entity_type = 'HOLDING' AND holding_id IS NOT NULL AND quantity > 0) OR
      (entity_type = 'ITEM_INSTANCE' AND item_instance_id IS NOT NULL AND quantity IS NULL) OR
      (entity_type = 'CAPACITY' AND container_id IS NOT NULL AND quantity > 0)
    )
);
```

### `inventory_transfers`

```sql
CREATE TABLE inventory_transfers (
    transfer_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    source_account_id uuid NOT NULL REFERENCES inventory_accounts,
    destination_account_id uuid NOT NULL REFERENCES inventory_accounts,
    state text NOT NULL CHECK (state IN (
        'REQUESTED','VALIDATING','RESERVED','IN_ESCROW','COMPLETED','CANCELLED','EXPIRED','FAILED','RECONCILIATION_REQUIRED'
    )),
    transfer_policy_version_id uuid NOT NULL,
    source_operation_id uuid,
    destination_operation_id uuid,
    escrow_token text UNIQUE,
    request_fingerprint text NOT NULL,
    expires_at timestamptz,
    aggregate_version bigint NOT NULL DEFAULT 1 CHECK (aggregate_version > 0),
    created_at timestamptz NOT NULL,
    updated_at timestamptz NOT NULL,
    terminal_at timestamptz,
    CHECK (source_account_id <> destination_account_id)
);

CREATE INDEX inventory_transfers_source_idx
    ON inventory_transfers (source_account_id, state, created_at DESC);
CREATE INDEX inventory_transfers_destination_idx
    ON inventory_transfers (destination_account_id, state, created_at DESC);
```

### `inventory_transfer_items`

Contains exact Holding lots, quantities, or Instance IDs assigned to the Transfer. It is immutable after escrow.

### `inventory_operations`

```sql
CREATE TABLE inventory_operations (
    operation_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    inventory_account_id uuid REFERENCES inventory_accounts,
    operation_kind text NOT NULL,
    state text NOT NULL CHECK (state IN (
        'RECEIVED','VALIDATING','APPLYING','SUCCEEDED','ACCEPTED_NOOP','REJECTED',
        'FAILED_RETRYABLE','FAILED_TERMINAL','RECONCILIATION_REQUIRED'
    )),
    idempotency_scope text NOT NULL,
    idempotency_key text NOT NULL,
    request_fingerprint text NOT NULL,
    source_type text NOT NULL,
    source_reference_id uuid,
    source_event_id uuid,
    actor_type text NOT NULL,
    actor_id text NOT NULL,
    reason_code text NOT NULL,
    requested_effect jsonb NOT NULL,
    applied_effect jsonb,
    accepted_noop boolean NOT NULL DEFAULT false,
    ledger_sequence_from bigint,
    ledger_sequence_to bigint,
    response_snapshot jsonb,
    aggregate_version bigint NOT NULL DEFAULT 1 CHECK (aggregate_version > 0),
    created_at timestamptz NOT NULL,
    updated_at timestamptz NOT NULL,
    terminal_at timestamptz,
    UNIQUE (idempotency_scope, idempotency_key)
);

CREATE INDEX inventory_operations_account_idx
    ON inventory_operations (inventory_account_id, created_at DESC);
CREATE INDEX inventory_operations_source_idx
    ON inventory_operations (source_type, source_reference_id);
```

Request and response JSON are bounded, schema-validated operational envelopes, not arbitrary state stores.

### `inventory_reward_fulfillments`

```sql
CREATE TABLE inventory_reward_fulfillments (
    fulfillment_id uuid PRIMARY KEY,
    reward_grant_id uuid NOT NULL,
    reward_component_id uuid NOT NULL,
    inventory_account_id uuid NOT NULL REFERENCES inventory_accounts,
    operation_id uuid NOT NULL UNIQUE REFERENCES inventory_operations,
    request_fingerprint text NOT NULL,
    item_definition_version_id uuid NOT NULL,
    requested_quantity bigint NOT NULL CHECK (requested_quantity > 0),
    applied_quantity bigint NOT NULL CHECK (applied_quantity >= 0),
    accepted_noop boolean NOT NULL,
    result_event_id uuid NOT NULL,
    reversal_state text NOT NULL DEFAULT 'NONE',
    created_at timestamptz NOT NULL,
    UNIQUE (reward_grant_id, reward_component_id)
);
```

### `inventory_reward_reversals`

```sql
CREATE TABLE inventory_reward_reversals (
    reversal_id uuid PRIMARY KEY,
    fulfillment_id uuid NOT NULL REFERENCES inventory_reward_fulfillments,
    operation_id uuid UNIQUE REFERENCES inventory_operations,
    request_fingerprint text NOT NULL,
    state text NOT NULL CHECK (state IN ('REQUESTED','SUCCEEDED','FAILED_RETRYABLE','FAILED_TERMINAL')),
    impact_plan jsonb NOT NULL,
    result_event_id uuid,
    created_at timestamptz NOT NULL,
    updated_at timestamptz NOT NULL,
    UNIQUE (fulfillment_id, reversal_id)
);
```

### `inventory_ledger_entries`

```sql
CREATE TABLE inventory_ledger_entries (
    ledger_entry_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    inventory_account_id uuid NOT NULL REFERENCES inventory_accounts,
    ledger_sequence bigint NOT NULL,
    operation_id uuid NOT NULL REFERENCES inventory_operations,
    entry_ordinal integer NOT NULL CHECK (entry_ordinal > 0),
    entry_type text NOT NULL,
    entity_type text NOT NULL,
    entity_id uuid NOT NULL,
    item_definition_version_id uuid,
    quantity_delta bigint,
    state_before jsonb,
    state_after jsonb,
    source_reference jsonb NOT NULL,
    reason_code text NOT NULL,
    occurred_at timestamptz NOT NULL,
    integrity_hash text NOT NULL,
    UNIQUE (inventory_account_id, ledger_sequence),
    UNIQUE (operation_id, entry_ordinal)
) PARTITION BY RANGE (occurred_at);
```

Ledger table roles deny UPDATE and DELETE. Retention and archival use controlled partition workflows preserving integrity hashes and query references.

### `inventory_ledger_counters`

```sql
CREATE TABLE inventory_ledger_counters (
    inventory_account_id uuid PRIMARY KEY REFERENCES inventory_accounts,
    next_sequence bigint NOT NULL CHECK (next_sequence > 0)
);
```

Sequences are allocated transactionally in bounded ranges per operation.

### `inventory_inbox`

```sql
CREATE TABLE inventory_inbox (
    event_id uuid PRIMARY KEY,
    event_type text NOT NULL,
    producer text NOT NULL,
    schema_version integer NOT NULL,
    partition_key text NOT NULL,
    payload_fingerprint text NOT NULL,
    processing_state text NOT NULL,
    handler_version text NOT NULL,
    received_at timestamptz NOT NULL,
    processed_at timestamptz,
    operation_id uuid,
    error_code text
);
```

### `inventory_outbox`

```sql
CREATE TABLE inventory_outbox (
    event_id uuid PRIMARY KEY,
    event_type text NOT NULL,
    schema_version integer NOT NULL,
    partition_key text NOT NULL,
    operation_id uuid,
    operation_ordinal integer NOT NULL,
    payload jsonb NOT NULL,
    headers jsonb NOT NULL,
    state text NOT NULL DEFAULT 'PENDING',
    available_at timestamptz NOT NULL,
    attempt_count integer NOT NULL DEFAULT 0,
    created_at timestamptz NOT NULL,
    dispatched_at timestamptz,
    UNIQUE (operation_id, operation_ordinal)
);

CREATE INDEX inventory_outbox_dispatch_idx
    ON inventory_outbox (state, available_at, created_at)
    WHERE state IN ('PENDING','RETRY');
```

### `inventory_projection_watermarks`

Stores projection name, partition, ledger sequence, rebuild generation, source schema version, status, and timestamps.

### `inventory_integrity_findings`

Stores finding type, severity, affected entities, evidence references, automatic quarantine, state, owner, and resolution.

### `inventory_correction_proposals`

Stores immutable proposed correction, dry-run fingerprint, before-state hash, required approvals, execution operation, and verification result.

### `inventory_jobs`

Stores resumable bulk job configuration, selector snapshot, cursor, rate limit, counts, approval, cancellation, and final verification.

### Row-level security and roles

Recommended roles:

- `inventory_api_writer`;
- `inventory_event_writer`;
- `inventory_job_writer`;
- `inventory_projection_reader`;
- `inventory_support_reader`;
- `inventory_audit_reader`;
- `inventory_ledger_append_only`;
- `inventory_manifest_projector`;
- `inventory_schema_owner`.

No application role may update or delete Ledger entries. Administrative consoles call APIs; they do not receive database credentials.

### Referential and invariant checks

Required database or transaction-level checks include:

- no negative quantities;
- reserved plus locked quantity not above total;
- one active uniqueness claim per scope key;
- one active reservation per Item Instance;
- one occupant per single-cardinality Slot;
- exact Item version exists in verified manifest cache;
- one operation per idempotency tuple;
- one fulfillment per `fulfillment_id`;
- one result Event per fulfillment logical outcome;
- one ledger sequence per account;
- terminal state timestamps consistent;
- account and entity ownership consistent;
- transfer source and destination differ.

### Migration strategy

Schema migrations MUST:

- be backward-compatible during rolling deployment;
- separate expand, backfill, verify, and contract phases;
- avoid rewriting immutable Ledger history;
- include projection rebuild plans;
- rate-limit state backfills;
- provide rollback before destructive contract phase;
- preserve Item manifest fingerprints and operation receipts;
- include shadow invariant checks.

---
## API Specification

All APIs are versioned. Public HTTP examples are illustrative; gRPC or message contracts may implement the same semantics.

### API principles

- Commands mutate; queries do not.
- Every command requires authentication, authorization, idempotency, and schema validation.
- Item semantics are resolved server-side from exact immutable versions.
- Owner-facing APIs never accept arbitrary source references or administrative reasons.
- Internal APIs use service identity and least-privilege scopes.
- Responses include `correlationId` and relevant aggregate versions.
- Pagination uses opaque cursors with stable sort keys.
- Authoritative and eventual endpoints are explicitly labeled.
- Bulk endpoints create Jobs rather than executing unbounded synchronous loops.

### Owner query APIs

#### `GET /v1/characters/{characterId}/inventory`

Returns Inventory overview and paginated Item groups.

Query parameters may include:

- `cursor`;
- `limit` bounded by service policy;
- `containerId`;
- `itemDefinitionId`;
- `itemType`;
- `lifecycleState`;
- `availability`;
- `includeInstances`;
- `locale`.

The endpoint is owner-authorized and projection-backed. Response includes a watermark and optional `isStale` indicator.

#### `GET /v1/characters/{characterId}/inventory/holdings/{holdingId}`

Returns authoritative Holding detail when `consistency=authoritative`, otherwise a projection.

#### `GET /v1/characters/{characterId}/inventory/instances/{itemInstanceId}`

Returns authorized Item Instance detail. Sensitive serial and provenance fields require elevated scope.

#### `GET /v1/characters/{characterId}/inventory/equipment`

Returns current equipment layout, slot revisions, and Item summaries.

#### `GET /v1/characters/{characterId}/inventory/history`

Returns owner-safe Ledger-derived history.

#### `GET /v1/characters/{characterId}/inventory/operations/{operationId}`

Returns operation status and receipt when the caller is authorized to see the source.

### Owner command APIs

#### `POST /v1/characters/{characterId}/inventory/moves`

```json
{
  "idempotencyKey": "uuid-or-client-stable-key",
  "entity": {
    "type": "ITEM_INSTANCE",
    "id": "uuid"
  },
  "destination": {
    "containerId": "uuid",
    "slotId": null
  },
  "expectedVersions": {
    "entity": 8,
    "destinationContainer": 12
  }
}
```

#### `POST /v1/characters/{characterId}/inventory/holdings/{holdingId}/split`

```json
{
  "idempotencyKey": "uuid",
  "quantity": 5,
  "destinationContainerId": "uuid",
  "expectedHoldingVersion": 9
}
```

#### `POST /v1/characters/{characterId}/inventory/merges`

```json
{
  "idempotencyKey": "uuid",
  "sourceHoldingIds": ["uuid", "uuid"],
  "destinationHoldingId": "uuid",
  "expectedVersions": {
    "uuid": 4
  }
}
```

#### `POST /v1/characters/{characterId}/inventory/uses`

```json
{
  "idempotencyKey": "uuid",
  "entity": {
    "type": "HOLDING",
    "id": "uuid",
    "quantity": 1
  },
  "capabilityType": "inventory.consume.v2",
  "expectedEntityVersion": 18,
  "context": {
    "clientActionId": "uuid"
  }
}
```

The server ignores any client attempt to specify Reward output, Item properties, or post-use foreign state.

#### `POST /v1/characters/{characterId}/inventory/equipment/{slotId}`

Equips an Item.

```json
{
  "idempotencyKey": "uuid",
  "itemInstanceId": "uuid",
  "replacementBehavior": "ATOMIC_UNEQUIP_TO_PRIMARY",
  "expectedItemVersion": 5,
  "expectedSlotVersion": 11
}
```

#### `DELETE /v1/characters/{characterId}/inventory/equipment/{slotId}`

Uses an idempotency header or body and a destination Container.

#### `POST /v1/characters/{characterId}/inventory/destructions`

Requires explicit confirmation and returns the immutable destruction receipt.

#### `POST /v1/characters/{characterId}/inventory/transfers`

May be unavailable in version 1 deployment. When enabled, creates a Transfer workflow and never returns success until the state is durably recorded.

### Internal acquisition API

#### `POST /internal/v1/inventory/acquisitions`

Restricted to registered service principals.

```json
{
  "idempotencyScope": "COMMERCE_ORDER_LINE",
  "idempotencyKey": "order-line-uuid",
  "characterId": "uuid",
  "itemDefinitionVersionId": "uuid",
  "quantity": 1,
  "source": {
    "type": "COMMERCE_SETTLEMENT",
    "referenceId": "uuid"
  },
  "committedAt": "2026-07-18T20:00:00Z",
  "reasonCode": "PURCHASE_FULFILLED"
}
```

The endpoint requires a registered source type. Generic Modules cannot call it without explicit contract registration.

### Internal ownership check API

#### `POST /internal/v1/inventory/ownership-checks`

Supports bounded batches and returns authoritative facts.

```json
{
  "characterId": "uuid",
  "checks": [
    {
      "checkId": "quest-objective-1",
      "itemDefinitionId": "uuid",
      "minimumAvailableQuantity": 1
    }
  ],
  "consistency": "AUTHORITATIVE"
}
```

Response:

```json
{
  "inventoryAccountId": "uuid",
  "ledgerSequence": 1400,
  "results": [
    {
      "checkId": "quest-objective-1",
      "satisfied": true,
      "totalQuantity": 2,
      "availableQuantity": 1
    }
  ]
}
```

The API is for checks, not reservation. A caller that needs guaranteed future availability must create a Reservation.

### Internal reservation API

- `POST /internal/v1/inventory/reservations`;
- `POST /internal/v1/inventory/reservations/{id}/commit`;
- `POST /internal/v1/inventory/reservations/{id}/release`;
- `GET /internal/v1/inventory/reservations/{id}`.

Each purpose type maps to an allowlisted owner service and allowed commit operation.

### Reward integration endpoint

Reward fulfillment is Event-first. A synchronous internal endpoint MAY exist for testing and controlled recovery:

`POST /internal/v1/inventory/reward-fulfillments`

It accepts the exact registered Reward Event payload and returns the same logical result. It must use `fulfillment_id`; it is not a second mutation path.

### Administrative APIs

- `GET /admin/v1/inventory/accounts/{id}`;
- `GET /admin/v1/inventory/operations/{operationId}`;
- `GET /admin/v1/inventory/fulfillments/{fulfillmentId}`;
- `GET /admin/v1/inventory/findings`;
- `POST /admin/v1/inventory/findings/{id}/quarantine`;
- `POST /admin/v1/inventory/corrections/simulate`;
- `POST /admin/v1/inventory/corrections`;
- `POST /admin/v1/inventory/jobs`;
- `POST /admin/v1/inventory/jobs/{id}/approve`;
- `POST /admin/v1/inventory/jobs/{id}/cancel`;
- `POST /admin/v1/inventory/projections/rebuild`;
- `POST /admin/v1/inventory/reconciliation/run`.

Administrative writes require reason codes, ticket references, and risk-based approvals.

### Response semantics

Successful mutation response:

```json
{
  "operationId": "uuid",
  "status": "SUCCEEDED",
  "acceptedNoop": false,
  "aggregateVersions": {
    "inventoryAccount": 41,
    "holding:uuid": 12
  },
  "ledgerSequenceFrom": 1041,
  "ledgerSequenceTo": 1042,
  "result": {},
  "correlationId": "uuid"
}
```

HTTP mapping recommendations:

- `200`: successful query or idempotent existing result;
- `201`: newly created operation/resource;
- `202`: durable asynchronous Job or transfer accepted;
- `400`: validation;
- `401`: unauthenticated;
- `403`: unauthorized or policy-hidden;
- `404`: not found or intentionally undisclosed;
- `409`: version, state, uniqueness, reservation, or idempotency conflict;
- `422`: semantically unsupported request;
- `423`: policy locked or quarantined;
- `429`: rate limited;
- `503`: retryable dependency or routing unavailability.

### Pagination and limits

Defaults and maximums are configuration but MUST be bounded. Recommended initial values:

- Item groups: default 50, maximum 200;
- Instances expanded per Item: default 20, maximum 100;
- history entries: default 50, maximum 200;
- ownership checks: maximum 100 per request;
- ordinary acquisition quantity: maximum 1,000 stackable units or 100 instances;
- bulk operations: Job-only;
- mutable-state payload: maximum 16 KiB after canonicalization unless a capability ADR allows less or more.

### API evolution

Breaking command meaning requires a new endpoint or command schema version. Adding an optional response field is compatible only when clients can safely ignore it. Error codes are stable contracts and cannot be repurposed.

---

## Admin Features

### Inventory account inspector

Administrators can view lifecycle, routing, root Containers, aggregate versions, projection lag, and recent operations without seeing unnecessary User PII.

### Ownership inspector

Provides authoritative Holdings, Instances, provenance lots, binding, location, reservations, expiration, and integrity state. It must clearly distinguish current ownership from historical terminal records.

### Operation explorer

Search by:

- operation ID;
- Character or Inventory Account ID;
- idempotency key hash;
- source reference;
- fulfillment ID;
- Reward Grant or component ID;
- Item Instance ID;
- Holding ID;
- transfer ID;
- Event ID;
- correlation ID.

Sensitive keys are hashed or partially redacted in ordinary support views.

### Ledger explorer

Displays immutable sequence, state deltas, source, reason, actor, integrity hash, and corresponding operation. It cannot edit or delete entries.

### Reward fulfillment diagnostics

Shows the original request fingerprint, attempts observed, applied effect, result Event dispatch, Reward acknowledgement if available, and reversal capability.

### Reservation and transfer diagnostics

Displays active leases, purpose owner, source and destination, stuck state, retry schedule, and safe actions. Manual force-complete is prohibited; remediation uses registered commands.

### Item manifest diagnostics

Shows exact cached manifest, source fingerprint, lifecycle overlay, compatibility version, and last verification. Hidden presentation remains redacted by authorization.

### Reconciliation dashboard

Shows findings by severity and type:

- quantity mismatch;
- reservation mismatch;
- orphan location;
- duplicate uniqueness claim;
- equipment occupancy mismatch;
- missing provenance;
- ledger/state divergence;
- missing outbox Event;
- manifest incompatibility;
- stale lifecycle projection;
- cross-shard transfer ambiguity.

### Correction workflow

The UI requires:

1. finding or incident;
2. registered correction type;
3. target selection;
4. dry-run before/after diff;
5. impact count;
6. rollback or compensation strategy;
7. approval according to risk;
8. execution rate limit;
9. postcondition verification;
10. final audit note.

High-risk quantity creation, ownership removal, binding change, or transfer repair requires dual control.

### Bulk jobs

Admin users can create bounded Jobs for approved acquisition, quarantine, migration, expiration replay, or projection rebuild. The UI shows cursor, throughput, error distribution, pause/cancel state, and samples.

### Emergency quarantine

Security operators may quarantine exact Item versions, Holdings, Instances, or accounts. Emergency action is fast but still requires authenticated reason, incident reference, outbox Event, and later review.

### Impersonation and support access

Support tools MUST NOT silently impersonate the owner. Read access and owner-visible actions identify the real support principal and are audited. High-risk actions require step-up authentication.

### Forbidden admin capabilities

The admin interface must not provide:

- raw quantity field editing;
- arbitrary JSON mutation;
- direct Item version replacement on owned copies;
- ledger deletion;
- idempotency record deletion to force replay;
- force transfer without policy and destination checks;
- hidden bypass of binding, reservation, or Character lifecycle;
- arbitrary SQL console access.

---

## UX Requirements

### Ownership clarity

Clients must distinguish:

- owned and available;
- owned but reserved;
- equipped;
- in overflow;
- expiring soon;
- expired;
- quarantined or temporarily unavailable;
- consumed, destroyed, or transferred history;
- acquisition pending at Reward level versus already present in Inventory.

### Reward presentation

When a Reward component is fulfilled, the UI may celebrate acquisition after `reward.granted.v1` or a product-defined optimistic threshold. It must not show an Item as owned solely because a Reward was offered or claimed.

Accepted duplicate no-op must be presented honestly, for example “Already owned,” not “A second copy was added.” Conversion or auxiliary-counter outcomes use their own presentation.

### Capacity and overflow

If an acquisition goes to overflow, the user sees:

- that ownership succeeded;
- why the preferred Container could not accept it;
- where the Item is stored;
- which actions can resolve capacity.

The UI must never imply Item loss.

### Reservations

Reserved Items show purpose and expiration in owner-safe language. A user action blocked by a Reservation should explain the blocking category without exposing confidential marketplace or moderation data.

### Destructive actions

Destroy and irreversible consume actions require clear confirmation, Item identity, quantity, consequences, and whether recovery is impossible. Bulk destruction requires an additional review step.

### Equipment

The UI validates optimistically but treats server response as authoritative. Slot conflicts, binding-on-equip, replacement behavior, and downstream effect delay are shown before confirmation when material.

### Expiration

Expiring Items display absolute time and localized relative time. The client must not decide availability from its local clock. After expiry, stale clients reconcile with server state.

### Transfer

Transfer UI must show recipient identity safely, quantity, binding consequences, reversibility, pending state, and final completion. “Sent” is not displayed before durable completion.

### Hidden and spoiler-sensitive Items

Unauthorized clients receive placeholders or absence according to Item disclosure policy. Client bundles must not contain hidden names, images, or descriptions.

### Error experience

Stable error codes map to localized user messages. Internal details are not exposed. Retryable states show retry guidance; terminal policy denials do not encourage repeated attempts.

### Accessibility

Inventory interfaces must support keyboard navigation, screen-reader labels, non-color status indicators, scalable text, localized numbers and dates, and reduced-motion alternatives for acquisition animations.

### Offline and reconnect

Offline clients may queue idempotent commands with stable keys. On reconnect, the client submits and reconciles against operation receipts. It must not invent local ownership or decrement quantity permanently before confirmation.

### Projection freshness

When a projection is stale, UI should display a refresh state or query the authoritative endpoint for operations requiring certainty. A stale list must not prevent a newly acquired Item from being accessed through its operation receipt.

### Privacy

Public profile or social UI never enumerates full Inventory by default. Public exposure requires a Character-owned presentation decision or an explicit registered visibility policy.

---

## Security

### Threat model

The Engine must defend against:

- forged Reward or Module Events;
- duplicate replay intended to create Items;
- idempotency-key collision attacks;
- quantity overflow and underflow;
- race conditions around consume, reserve, equip, and transfer;
- client attempts to override Item semantics;
- hidden Item enumeration;
- insecure direct object references;
- privilege escalation through support APIs;
- malicious capability payloads;
- stale lifecycle or routing writes;
- ledger tampering;
- cross-tenant or cross-Character data leakage;
- transfer duplication;
- denial-of-service through high-cardinality Inventory or huge payloads;
- compromised Item media or quarantined definitions;
- insider direct database mutation.

### Authentication

All writes require authenticated principals. Event producers use mutually authenticated service identity and signed broker credentials. Owner APIs use the platform authentication system. Admin APIs require workforce identity and step-up controls for high-risk operations.

### Authorization

Authorization checks:

- principal type and scope;
- Character ownership or delegated permission;
- service contract registration;
- operation kind;
- Item disclosure class;
- source and destination account policy;
- support purpose;
- risk level and approvals;
- Module boundary where relevant.

Authorization success never bypasses Inventory invariants.

### Object access control

Every Holding, Instance, Container, Reservation, Transfer, and Operation lookup verifies account scope. APIs do not accept a Character ID and entity ID independently without checking their relationship.

### Event producer validation

Inventory maintains an allowlist mapping Event type and schema version to producer identity. Reward fulfillment is accepted only from Reward Engine and only for owner `inventory`. Character and Item lifecycle Events are accepted only from their authoritative Engines.

### Replay protection

Protection combines:

- Event ID inbox deduplication;
- business idempotency identities;
- request fingerprints;
- unique constraints;
- producer authentication;
- bounded timestamp and schema checks where appropriate.

Deleting an inbox row must not permit duplicate business effect because durable operation identity remains.

### Input validation

- quantities are canonical integers;
- UUIDs are parsed strictly;
- strings have length and character limits;
- JSON follows registered schemas;
- unknown capability types fail closed;
- Item keys are cross-checked against exact versions;
- client timestamps are non-authoritative;
- URLs and asset references are never executed by Inventory;
- reason codes come from registries.

### Capability safety

Published capability payloads are data only. The Engine prohibits:

- executable source code;
- SQL;
- dynamic language expressions;
- file paths;
- arbitrary network endpoints;
- class names for reflection;
- unrestricted regular expressions;
- recursive payloads beyond depth limits;
- unbounded arrays or strings.

New capability types require security review and deterministic resource limits.

### Concurrency security

Race safety is part of security. Quantity, uniqueness, Reservation, Slot, and Transfer decisions are made under authoritative locks and constraints. Read-then-write logic without locking is prohibited for state-changing checks.

### Database security

- least-privilege roles;
- encrypted connections;
- encryption at rest and backups;
- no application UPDATE/DELETE rights on Ledger;
- schema-owner credentials separated from runtime;
- audit of privileged queries;
- secrets managed outside the database;
- row-level security or equivalent service enforcement for support reads.

### Hidden content protection

Hidden Item existence and ownership must not leak through:

- list counts;
- error differences;
- predictable IDs;
- cache keys;
- logs;
- metrics labels;
- Event payloads;
- public equipment projections;
- client-side filtering.

### Rate limiting

Apply per-principal, per-Character, per-command-type, and per-service limits. Transfer, ownership checks, history export, and admin search require stricter controls. Internal batch producers receive quotas and backpressure rather than unrestricted throughput.

### Abuse and fraud signals

Inventory publishes or records signals for:

- repeated conflicting idempotency keys;
- unusual acquisition velocity;
- repeated reversal failures after consumption;
- transfer loops;
- reservation abuse;
- repeated hidden Item probes;
- impossible routing epochs;
- support access anomalies.

Fraud systems may react but cannot directly alter Inventory.

### Security incident response

The Engine supports:

- Item version quarantine;
- account or entity quarantine;
- producer credential revocation;
- Event consumer pause by type;
- outbox replay;
- forensic ledger export;
- manifest cache invalidation;
- correction workflow;
- post-incident reconciliation.

---

## Privacy

### Data minimization

Inventory stores Character and service identifiers, not User profile data. It does not require email, legal name, biography, or authentication credentials.

### Data classification

- Character and Inventory Account IDs: pseudonymous internal identifiers;
- ownership and equipment: potentially sensitive behavioral data;
- transfer counterparties: restricted;
- operation source and support notes: restricted operational data;
- Item presentation: classification inherited from Item Engine;
- ledger integrity hashes: internal;
- public equipment projection: public only by explicit policy.

### Purpose limitation

Ownership data is processed for Inventory functionality, support, security, compliance, and approved product projections. Unrelated marketing access requires a separate lawful and product-approved data path.

### Owner access and export

Privacy export includes:

- current owned Item references and quantities;
- Item Instance identifiers where appropriate;
- binding and expiration;
- owner-visible history;
- transfer history subject to counterparty minimization;
- source categories;
- correction history relevant to the owner.

Internal security evidence and other persons' data are redacted according to policy.

### Closure

Character closure hides public Inventory projections and blocks ordinary mutation. Data is retained according to restoration, fraud, legal, and accounting policy.

### Anonymization

On terminal Character anonymization, Inventory Engine:

- marks the account `ANONYMIZED`;
- removes direct User references if any leaked into allowed operational fields;
- pseudonymizes or deletes free-text support annotations according to retention policy;
- minimizes transfer counterparty views;
- preserves Item IDs, quantities, operation hashes, source categories, and non-personal integrity evidence only as required;
- publishes minimized privacy completion Events;
- verifies downstream projection deletion.

Ledger rows are not casually deleted if doing so would break integrity. Personal fields are designed to be absent or tokenized so lawful erasure can be achieved without destroying non-personal accounting facts.

### Retention

Retention classes are explicit:

- current ownership: for account lifetime;
- operation receipts: account lifetime plus reversal and support window;
- immutable Ledger: long-term integrity policy;
- inbox: replay window, except durable business idempotency records;
- outbox: until confirmed plus audit window;
- support search indexes: shorter retention;
- logs and traces: minimized operational period;
- transfer details: policy-defined period with progressive minimization.

### Public disclosure

Inventory data is private by default. Public disclosure requires either:

- Character presentation selection validated against ownership;
- explicit public equipment policy;
- owner consent represented by the appropriate owner Engine;
- legally required disclosure.

### Children and protected users

Products serving minors may disable transfer, public equipment, serial display, and detailed history. These restrictions are policy inputs and do not create school-specific logic in Inventory.

### Analytics

Analytics Events use pseudonymous IDs, bounded Item classifications, and minimized detail. Rare hidden Item identifiers should be generalized or access-controlled to prevent re-identification.

---

## Performance

### Service-level objectives

Initial production targets, subject to load validation:

- authoritative ownership check p95 under 100 ms, p99 under 250 ms;
- ordinary single-Holding or single-Instance mutation p95 under 200 ms, p99 under 500 ms excluding external queue delay;
- Reward Item fulfillment internal processing p95 under 250 ms when manifest is cached;
- owner Inventory first page p95 under 250 ms from projection;
- equipment read p95 under 100 ms;
- Event outbox dispatch p99 under 5 seconds in healthy operation;
- projection lag p99 under 10 seconds;
- zero accepted negative quantity or duplicate logical fulfillment.

Correctness SLOs are stronger than latency SLOs.

### Capacity assumptions

The implementation must document tested limits. A baseline design should support:

- tens of millions of Inventory Accounts;
- thousands of distinct Holdings per heavy Character;
- tens of thousands of historical operations per active Character;
- bursty Reward campaigns;
- millions of expiration candidates per day;
- bounded large collectors with substantially higher history through pagination and partitioning.

Characters exceeding operational limits are not silently truncated; they may use specialized partitions or support workflows.

### Hot-path optimization

- cache exact compiled Item manifests by immutable version ID;
- use covering indexes for account and Item lookups;
- lock only affected rows;
- avoid loading full Ledger history during mutation;
- allocate Ledger sequence ranges in one row lock;
- batch outbox dispatch;
- precompute container occupancy;
- use authoritative counts, not `COUNT(*)`, on every mutation;
- keep mutable-state payloads bounded;
- separate owner projections from write tables.

### Contention control

- deterministic lock order;
- short transactions without network calls inside locks;
- manifest resolution before transaction when cache fingerprint is verified, followed by lifecycle re-check as needed;
- retry deadlocks with bounded jitter and same idempotency key;
- partition high-volume expiration and projection work;
- use `FOR UPDATE SKIP LOCKED` for workers;
- isolate bulk jobs from live traffic through rate budgets.

### Manifest cache

Cache entries are immutable by version except lifecycle overlay metadata. Cache keys include manifest fingerprint and schema version. A lifecycle Event invalidates or updates overlays. Periodic verification detects drift.

### Expiration performance

Expiration workers query indexed due records in bounded batches. They must not scan all active Inventory. Availability reads enforce time semantics even if materialization lags.

### Projection performance

Projection builders consume Ledger or domain Events and checkpoint watermarks. Rebuilds use shadow tables or generations, then atomically switch readers. Live and rebuild workloads have separate quotas.

### Large bulk operations

Bulk grants and corrections:

- snapshot target selector;
- generate per-target idempotency keys;
- process bounded batches;
- apply backpressure;
- publish progress metrics;
- pause on error-rate threshold;
- never hold one transaction across targets.

### Multi-region

One Character has one write home per routing epoch. Reads may use regional replicas with labeled staleness. Home migration drains writes, advances routing epoch, transfers state, verifies Ledger watermark, and then enables the new home.

### Backup and restore

Backups must support point-in-time recovery. Restore drills verify:

- state and Ledger consistency;
- uniqueness constraints;
- outbox replay safety;
- idempotency retention;
- Item manifest availability;
- projection rebuild;
- encryption key access;
- transfer reconciliation.

---

## Audit

### Audit principles

Every business-significant mutation must be attributable, reproducible, and explainable. Audit is not limited to application logs.

### Required audit fields

- operation ID and kind;
- account and affected entity IDs;
- actor type and ID;
- authorization decision reference;
- source reference and source Event ID;
- reason code;
- idempotency scope and hashed key;
- request fingerprint;
- exact Item version and manifest fingerprint;
- before and after state hashes;
- quantity or state deltas;
- Ledger sequence range;
- outbox Event IDs;
- correlation and trace IDs;
- timestamps;
- deployment and handler version;
- approval evidence for privileged actions.

### Ledger integrity

Ledger entries include a deterministic integrity hash. Implementations SHOULD chain hashes within an Inventory Account or partition and periodically anchor batch roots in a separate integrity store. Hashing does not replace database permissions.

### Operational metrics

At minimum:

- acquisitions by source and outcome;
- applied and accepted-noop quantities;
- fulfillment latency and retries;
- reversal success and failure reasons;
- quantity mutations by operation kind;
- active Holdings and Instances;
- reservation count, age, and expiry;
- transfer count and stuck states;
- overflow occupancy;
- expiration due and lag;
- quarantine count;
- command conflicts and deadlocks;
- inbox duplicate rate;
- outbox backlog and oldest age;
- projection lag;
- manifest cache hit rate;
- reconciliation findings;
- correction volume;
- database latency and lock wait.

Metrics labels must avoid unbounded Character, Item Instance, operation, or hidden Item identifiers.

### Logs

Structured logs include correlation identities and safe error codes. They exclude full Inventory snapshots, hidden Item content, authorization tokens, arbitrary mutable state, and PII.

### Tracing

Distributed traces connect Reward request, Inventory Operation, database transaction, outbox dispatch, and Reward result processing. Trace sampling is increased for failures but payload privacy remains enforced.

### Alerts

Critical alerts include:

- negative quantity constraint attempt;
- duplicate fulfillment inconsistency;
- Ledger/state divergence;
- uniqueness duplicate;
- transfer ambiguity;
- outbox backlog above threshold;
- expiration lag threatening product semantics;
- manifest fingerprint mismatch;
- unauthorized producer attempts;
- bulk job error threshold;
- database replication or backup failure.

### Reconciliation

Scheduled reconciliation verifies:

1. Holding quantity equals sum of active provenance lots, adjusted by registered non-lot migrations;
2. reserved quantity equals active Reservation items;
3. Container occupancy equals active residents;
4. Slot occupancy matches equipped Item state;
5. uniqueness claims map to active ownership;
6. Reward fulfillment receipts map to one operation and result Event;
7. Ledger deltas reproduce current state for sampled or full partitions;
8. terminal entities have terminal timestamps;
9. outbox Events exist for committed operations requiring them;
10. Item manifest fingerprints remain resolvable.

Findings are immutable records with lifecycle and resolution evidence.

### Administrative audit

Every support view of sensitive Inventory and every admin mutation records purpose, principal, target, time, and result. Export access is rate-limited and reviewed.

---

## Edge Cases

### Duplicate and retry cases

1. Two identical Reward attempts with the same `fulfillment_id` arrive concurrently. One operation commits; the other returns the same receipt.
2. The same `fulfillment_id` arrives with a different Item version or quantity. Inventory rejects fingerprint conflict and emits no second effect.
3. Outbox dispatch succeeds but broker acknowledgement is lost. The same Event ID is resent.
4. Reward Engine times out after Inventory commits. Retry returns original success.
5. Inbox retention expired but fulfillment record remains. Business idempotency still prevents duplication.
6. An API client retries after receiving a network error. Identical idempotency key returns original result.
7. A client reuses an idempotency key for a different destination. Conflict is returned.

### Quantity and stack cases

8. Two consumers attempt to decrement the last available unit. One succeeds; one receives insufficient quantity.
9. A stack has reserved quantity and an owner tries to move all units. The move rejects or splits only available units according to command.
10. A merge would exceed max stack. The Engine fills deterministically and leaves or creates a remainder only if contract permits.
11. Two stacks share Item key but different version IDs. Ordinary merge rejects.
12. Two stacks share version but different expiration buckets. Merge rejects.
13. Quantity arithmetic would exceed int64. Operation rejects before mutation.
14. A zero or negative quantity arrives. Validation rejects.
15. A Holding reaches zero. It becomes depleted and remains historical.
16. A virtual-unique duplicate policy is `ACCEPT_NO_OP`. Fulfillment succeeds with applied zero.
17. Duplicate policy is `REJECT`. Fulfillment fails terminally with no mutation.
18. Duplicate policy requests conversion but converter is unavailable. No original Item quantity is added; retry policy follows contract.

### Instance cases

19. Bulk instance creation crashes after transaction commit but before response. Retry returns all original Instance IDs.
20. A client supplies an Instance ID. The server ignores or rejects it; IDs are server-generated.
21. An Instance is equipped and a consume request arrives. Capability policy decides whether equipped use is allowed; default rejects.
22. An Instance is reserved and transfer is requested. Transfer rejects.
23. An expired Instance remains materialized as active because worker lagged. Authoritative read treats it unavailable and operation materializes expiry idempotently.
24. Mutable-state payload contains unknown field. Request rejects.
25. Durability decrement would go below zero. It clamps only if schema explicitly declares saturation; otherwise rejects.

### Capacity and location cases

26. Preferred Container is full but overflow is available. Acquisition succeeds into overflow.
27. Both preferred and overflow are unavailable. Acquisition fails explicitly; no ownership is created.
28. Container occupancy projection is stale but authoritative counter is correct. Mutation uses authoritative counter.
29. Moving a parent Container into its descendant would create a cycle. Reject.
30. Equipment replacement Item cannot fit the fallback Container. Atomic replace rejects without changing either Item.
31. Slot compatibility manifest changed for future Item versions. Existing exact version semantics remain.
32. Container is closed while a move command is in flight. Lock-time recheck rejects.

### Reservation cases

33. Reservation expiry worker and commit race. Row lock and state transition allow only one terminal result.
34. Reservation is renewed after already expiring. Reject or create a new Reservation according to purpose contract.
35. Purpose owner retries commit. Original commit receipt returns.
36. Owner tries to destroy reserved quantity. Reject.
37. Holding split occurs with active Reservation. Only a registered reassignment path may proceed.
38. Service creates indefinite Reservations. Policy rejects lease above maximum.
39. Reservation references an Item that becomes quarantined. Commit follows quarantine policy; ordinary release remains allowed.

### Reward reversal cases

40. Original stackable Reward lot remains untouched. Full reversal succeeds.
41. Part of the original lot was consumed. Literal full reversal fails with residual state.
42. Equivalent quantity from another acquisition remains, but original lot was consumed. Inventory does not take unrelated copies to fake reversal.
43. Original Item Instance was transferred. Reversal fails or invokes an explicitly registered reverse-transfer compensation; it never silently deletes destination ownership.
44. Original virtual-unique grant was accepted no-op. Reversal also succeeds as accepted no-op without removing pre-existing ownership.
45. Reversal request is duplicated. Same result returns.
46. Different reversal fingerprint uses same `reversal_id`. Conflict.
47. Original fulfillment succeeded but result Event was not dispatched. Reversal lookup still finds operation.

### Character lifecycle cases

48. Character suspends during an acquisition transaction. Source ordinal and lock-time eligibility determine a single consistent outcome; later operations obey suspension.
49. Reward was committed before closure but delivered after closure. Historical fulfillment policy determines retryable or terminal behavior.
50. Character restores. Existing ownership becomes visible after account reactivation and projection rebuild.
51. Character anonymizes with an active transfer. Transfer is cancelled or quarantined according to privacy policy before final completion.
52. Character closes while Items are equipped publicly. Public projections are hidden independently of ownership.

### Item lifecycle cases

53. Item retires after Reward Grant but before fulfillment. `committed_at` and historical fulfillment policy decide acquisition.
54. Item is quarantined after ownership. Use and transfer block; ledger remains.
55. Item recovers. Restrictions clear only after newer lifecycle ordinal.
56. Item replacement is declared. Existing ownership is not migrated automatically.
57. Presentation erratum changes icon. Inventory mechanical state and manifest fingerprint remain; presentation cache refreshes.
58. Item manifest cache fingerprint differs from Item Engine. Operation fails and security alert fires.
59. Old owned version becomes unsupported by a new Inventory deployment. Deployment must retain reader compatibility or quarantine; it cannot silently reinterpret.

### Transfer cases

60. Source and destination are the same account. Reject.
61. Destination already owns a unique Item. Duplicate policy is applied at destination before source leaves ordinary ownership.
62. Source Transfer reaches escrow and destination shard is unavailable. Item remains unavailable in escrow; durable retries continue.
63. Destination committed but source worker crashed before final state. Transfer token reconciliation proves completion and prevents source restoration.
64. Transfer expires before escrow. Reservation releases.
65. Transfer expires after destination commit. Completion wins; expiry cannot restore source.
66. Binding-on-acquire forbids transfer. Reject before Reservation.
67. Item is unbound but business transfer feature is disabled. Reject with feature-policy code.

### Equipment and use cases

68. Two equip commands target one slot concurrently. One wins version and lock checks.
69. Equip triggers binding-on-equip. Binding and location commit atomically.
70. Downstream gameplay consumer is unavailable. Equipment still commits and Event dispatch retries.
71. Item quarantines while equipped. Inventory marks policy lock and emits fact; registered policy may auto-unequip through a separate operation.
72. Use Event triggers Reward, but Reward fails. Inventory consumption remains; compensation requires explicit workflow.
73. Client predicts use locally and disconnects. Reconnect reconciles from operation receipt.

### Integrity and operations cases

74. Ledger entry exists but projection update failed. Projection rebuild catches up.
75. State row changed but outbox insert would fail. Transaction rolls back entirely.
76. Reconciler detects reserved quantity mismatch. Entity quarantines and correction proposal is created.
77. Administrator tries direct quantity edit. Database permissions deny it.
78. Correction dry-run state changed before execution. Before-state hash mismatch rejects.
79. Bulk grant is cancelled. Completed target operations remain; pending targets stop.
80. Deadlock occurs. Transaction retries with same idempotency key and no duplicate effect.
81. Routing epoch changes during request. Stale home rejects and client reroutes.
82. Read replica lags after acquisition. Operation receipt links to authoritative read.
83. Hidden Item ownership is probed through error differences. API returns policy-safe not-found behavior.
84. An unbounded Item capability payload arrives. Schema and size limits reject before database work.

---
## Acceptance Tests

The following tests are normative release criteria. A production implementation may add tests but may not omit an applicable requirement without an approved ADR.

### Ownership and boundaries

1. Only Inventory Engine credentials can create or mutate Holdings and Item Instances.
2. Item Engine publication cannot create Character ownership by itself.
3. Reward Engine cannot write Inventory tables and must use the fulfillment contract.
4. A business Module direct database mutation attempt is denied.
5. Character Engine lifecycle Events restrict Inventory without writing Inventory rows.
6. Inventory never changes Progression, Quest, Achievement, Talent, Reputation, Currency, or Season state directly.
7. An owned copy always retains an exact Item Definition Version ID.
8. Changing an Item display name does not change ownership identity.
9. Changing the recommended Item version does not rewrite existing owned copies.
10. A public profile projection cannot be used as proof of Inventory ownership.
11. An analytics event cannot initiate Inventory mutation unless a separately registered command contract exists.
12. Unknown external owner services cannot register themselves through request data.
13. Inventory rejects arbitrary executable capability payloads.
14. All administrative writes pass through the same command and ledger path as ordinary writes.
15. Direct UPDATE or DELETE on Ledger tables is denied to runtime and admin roles.

### Account provisioning and lifecycle

16. A valid character.created Event provisions one Inventory Account and required root Containers.
17. Duplicate provisioning Events create no duplicate account or root Containers.
18. Conflicting provisioning for the same Character returns an integrity error.
19. A PROVISIONING account rejects ordinary acquisition.
20. Activation changes the account to ACTIVE and publishes the state Event.
21. A Character suspension transitions the account to SUSPENDED exactly once.
22. A stale suspension Event with lower source ordinal is ignored.
23. A reactivation Event restores the correct prior policy-compatible state.
24. A closed Character blocks ordinary owner mutation.
25. Character restoration does not recreate or duplicate owned Items.
26. Character anonymization transitions the account to terminal ANONYMIZED.
27. ANONYMIZED cannot transition back to ACTIVE.
28. Closure hides public equipment projections without deleting ownership.
29. Account home-region migration increments routing epoch.
30. A request with a stale routing epoch is rejected without mutation.

### Item manifest resolution

31. Acquisition resolves the exact Item Definition Version rather than the current recommended version.
32. An unknown Item Definition Version is rejected.
33. A draft Item version is rejected.
34. A manifest key/version mismatch is rejected.
35. A manifest fingerprint mismatch fails closed and emits an alertable finding.
36. A verified immutable cached manifest may be used during Item Engine outage according to cache policy.
37. An unverified cache entry cannot authorize mutation.
38. Unknown stack mode is rejected.
39. Unknown uniqueness scope is rejected.
40. Unknown duplicate policy is rejected.
41. Unknown binding policy is rejected.
42. Unknown mutable-state field is rejected.
43. Unknown capability type is rejected.
44. Manifest payload above the configured size limit is rejected or quarantined.
45. Lifecycle overlays apply only when source publication sequence is newer.

### Acquisition core

46. A valid stackable acquisition increments total quantity and appends Ledger entries atomically.
47. A valid non-stackable acquisition creates one server-generated Instance per applied unit.
48. A valid virtual-unique acquisition creates one active ownership fact.
49. Zero quantity acquisition is rejected.
50. Negative quantity acquisition is rejected.
51. Quantity above the command batch limit is rejected or routed to a bulk Job.
52. Checked arithmetic prevents bigint overflow.
53. A successful acquisition stores the exact manifest fingerprint.
54. A successful acquisition stores source type and reference.
55. A successful acquisition records binding resolved by server policy.
56. A caller cannot override stack mode.
57. A caller cannot override uniqueness scope.
58. A caller cannot override binding policy.
59. A caller cannot override expiration semantics.
60. A caller cannot supply Item Instance IDs.
61. A failed acquisition produces no Holding, Instance, quantity delta, or success Event.
62. State and outbox insertion fail or commit together.
63. Acquisition to preferred Container succeeds when capacity exists.
64. Acquisition uses overflow when preferred capacity is unavailable and policy permits it.
65. Acquisition fails explicitly when no valid destination exists.
66. Overflow acquisition remains visible and fully owned.
67. A large instance batch is atomic when partial application is not declared.
68. An identical acquisition retry returns the original operation receipt.
69. Acquisition response includes authoritative entity versions and Ledger sequence range.
70. Acquisition history remains queryable after the Holding becomes terminal.

### Stacking, split, and merge

71. Equivalent stackable copies merge only when merge identity matches.
72. Different Item Definition Versions never merge through ordinary acquisition.
73. Different binding scopes do not merge.
74. Different expiration buckets do not merge.
75. Different registered merge-key values do not merge.
76. A stack never exceeds manifest max stack quantity.
77. Excess acquisition creates deterministic additional Holdings when allowed.
78. Split preserves total quantity.
79. Split quantity must be positive and below the eligible source quantity.
80. Split cannot consume reserved quantity without a registered reassignment workflow.
81. Split creates a new Holding with the same exact version and merge identity.
82. Merge preserves total quantity.
83. Merge rejects incompatible lifecycle states.
84. Merge rejects incompatible integrity states.
85. Merge rejects incompatible active Reservations.
86. A fully merged source becomes DEPLETED rather than being physically deleted.
87. Concurrent merges lock Holdings in deterministic order without duplicate quantity.
88. Concurrent acquisition and merge produce one serializable valid state.
89. Available quantity equals total minus reserved and policy-locked quantity.
90. A Holding reaching zero transitions to DEPLETED with terminal timestamp.

### Item Instances and mutable state

91. Every instance-required Item receives an opaque unique Item Instance ID.
92. An Item Instance ID is never reused after destruction.
93. An Instance has one current Inventory Account owner.
94. An Instance has one current location.
95. An Instance has at most one active Reservation.
96. An equipped Instance references exactly one compatible Slot.
97. Terminal Instances are unavailable.
98. Durability cannot become negative.
99. Durability cannot exceed configured maximum.
100. Charges cannot become negative.
101. Charges cannot exceed configured maximum.
102. Mutable state conforms to the exact capability schema version.
103. Unbounded strings and arrays in mutable state are rejected.
104. A serial reference cannot replace the primary Item Instance ID.
105. Sensitive serial values are redacted from unauthorized reads.
106. Instance provenance identifies the acquisition operation.
107. A duplicate command creating Instances returns the original Instance IDs.
108. An Instance terminal transition preserves the row and Ledger history.
109. A correction cannot change exact Item Definition Version without a registered migration contract.
110. An incompatible deployment quarantines rather than silently reinterprets old mutable state.

### Uniqueness and duplicate policies

111. A uniqueness claim is serialized by an authoritative unique key.
112. Two concurrent unique acquisitions create at most one active ownership fact.
113. CHARACTER uniqueness resolves to the authoritative Character scope.
114. Unsupported uniqueness scope blocks Item acquisition.
115. ACCEPT_NO_OP returns success with applied quantity zero and existing ownership reference.
116. ACCEPT_NO_OP does not increment ownership quantity.
117. REJECT returns a terminal duplicate error without mutation.
118. CONVERT_VIA_OWNER_CONTRACT invokes only a registered deterministic contract.
119. Unavailable conversion does not silently grant the original duplicate.
120. INCREMENT_AUXILIARY_COUNTER changes only the registered counter.
121. Auxiliary counter is not reported as Item quantity.
122. A released uniqueness claim can be reacquired only when Item and operation policy allow it.
123. A quarantined uniqueness claim blocks ambiguous reacquisition.
124. Uniqueness claim and ownership mutation commit atomically.
125. Duplicate policy is taken from the exact owned/acquired version, not current catalog recommendation.

### Containers, slots, and capacity

126. Required root Containers exist for every active account.
127. Container graph rejects cycles.
128. Container graph enforces configured maximum depth.
129. A closed Container accepts no new occupants.
130. Container occupancy counters change atomically with resident movement.
131. Distinct-Holding capacity is enforced under concurrency.
132. Instance-count capacity is enforced under concurrency.
133. Unit-count capacity is enforced under concurrency.
134. Integer weight capacity uses checked arithmetic.
135. Unknown capacity dimension is rejected.
136. One-cardinality Slot has at most one occupant.
137. Slot compatibility is validated from registered contracts.
138. A move to an incompatible Slot is rejected.
139. A move to a full Container is rejected or uses explicit overflow behavior.
140. Moving part of a Holding performs atomic split and move.
141. Moving an Instance updates location and versions atomically.
142. Source and destination locks follow canonical order.
143. A failed move leaves source and destination unchanged.
144. A stale occupancy projection cannot authorize over-capacity mutation.
145. Reconciliation detects occupancy counter drift.

### Reservations

146. A valid Reservation reduces available quantity without changing total quantity.
147. A Reservation cannot exceed available quantity.
148. An Instance can be reserved only when available.
149. Reservation purpose must be registered to the caller service.
150. Reservation lease above policy maximum is rejected.
151. Reservation activation and quantity reservation commit atomically.
152. Duplicate Reservation creation returns the existing Reservation.
153. Reservation commit is allowed only to the purpose owner.
154. Reservation commit executes only a registered resulting operation.
155. Reservation commit is idempotent.
156. Reservation release restores availability exactly once.
157. Reservation expiry restores availability exactly once.
158. Commit and expiry race has one terminal winner.
159. Released Reservation cannot reactivate.
160. Expired Reservation cannot be committed.
161. Destroy rejects reserved Items.
162. Unrelated consumption rejects reserved quantity.
163. Transfer uses a purpose-bound Reservation.
164. Stale Reservations are discoverable by support and reconciliation.
165. Reservation Events contain bounded owner-safe purpose data.

### Consumption and use

166. Consume validates the exact registered capability from the Item manifest.
167. Client-provided foreign outcome is ignored or rejected.
168. Stack consumption decrements only available quantity.
169. Stack consumption depletes the Holding at zero.
170. One-time Instance consumption transitions it to CONSUMED.
171. Charge use decrements charges atomically.
172. Durability use applies only registered integer delta semantics.
173. A non-consuming use leaves ownership quantity unchanged and records the operation.
174. An expired Item cannot be used.
175. A quarantined Item cannot be used unless quarantine policy explicitly permits a safe operation.
176. A reserved Item cannot be used by an unrelated command.
177. A duplicate use command returns the original result without a second decrement.
178. Use and resulting Inventory Event commit atomically.
179. Foreign Reward or Quest processing failure does not roll back committed Inventory use automatically.
180. Compensation requires a new authorized operation.
181. Use Event omits unneeded hidden Item content.
182. Concurrent use of the final charge yields one success and one conflict.
183. Server time, not client time, determines expiration eligibility.

### Equipment

184. Only Items with a registered equip capability can be equipped.
185. Equip validates slot compatibility.
186. Equip validates Character and account eligibility.
187. Equip rejects reserved Items.
188. Equip rejects terminal or expired Items.
189. Equip and binding-on-equip commit atomically.
190. Equip updates Item location and Slot occupancy atomically.
191. Two concurrent equips to one single Slot produce one winner.
192. Occupied-slot behavior follows explicit replacement policy.
193. Atomic replacement fails entirely if the displaced Item has no valid destination.
194. Unequip returns the Item to a valid Container.
195. Duplicate unequip returns accepted no-op or original result according to idempotency.
196. Equipment Event dispatch failure does not roll back equipment state.
197. Public equipment remains hidden unless Character presentation or public policy exposes it.
198. Item quarantine while equipped applies registered restrictions and emits a fact.

### Expiration

199. An Item is semantically unavailable at now greater than or equal to expires_at.
200. Worker lag does not extend Item availability.
201. Expiration worker processes due rows in bounded skip-locked batches.
202. Duplicate expiration execution has one logical effect.
203. Expiration records original expires_at and materialization time.
204. Stack copies with incompatible expirations do not merge.
205. Mixed expiration state is split before partial expiration when required.
206. Expiration of an equipped Item follows registered equipment policy.
207. Expiration of a reserved Item follows registered Reservation policy without double release.
208. Expiration conversion uses only a typed registered contract.
209. Expired state and Event commit atomically.
210. Expiration lag metrics and alerts fire beyond threshold.

### Transfer

211. Transfer is unavailable by default unless the feature and contract are enabled.
212. Source and destination accounts must differ.
213. Transfer validates Item transferability from exact manifest.
214. Transfer validates current binding state.
215. Transfer validates source availability.
216. Transfer validates destination lifecycle state.
217. Transfer validates destination uniqueness before source completion.
218. Transfer validates destination capacity.
219. Same-shard transfer conserves net quantity atomically.
220. Same-shard Instance transfer changes owner exactly once.
221. Source and destination Ledger entries reference one Transfer ID.
222. Duplicate Transfer command returns the existing workflow.
223. Transfer cancellation before destination commit restores source availability exactly once.
224. Transfer cannot cancel after destination commit.
225. Cross-shard Transfer uses a unique escrow token.
226. Cross-shard retry cannot create duplicate destination ownership.
227. Ambiguous cross-shard outcome transitions to RECONCILIATION_REQUIRED.
228. Transfer expiry before escrow releases Reservations.
229. Transfer expiry after destination commit cannot restore source.
230. Counterparty details are minimized in broad Event streams.

### Reward fulfillment

231. Inventory accepts Item fulfillment only from authenticated Reward Engine producer.
232. Fulfillment ownerEngine must equal inventory.
233. Fulfillment componentType must equal ITEM.
234. fulfillment_id is the logical idempotency key.
235. attempt_id may change without changing the logical effect.
236. Duplicate simultaneous attempts apply at most one acquisition.
237. A conflicting request fingerprint for one fulfillment_id is rejected.
238. The exact Reward Item version and key must agree.
239. Reward cannot override binding, stack, uniqueness, expiration, or transfer semantics.
240. Successful fulfillment publishes reward.fulfillment.succeeded.v1 in the same transaction as ownership.
241. Retryable manifest outage publishes or returns a sanitized retryable failure without mutation.
242. Terminal duplicate policy REJECT produces a terminal fulfillment failure.
243. ACCEPT_NO_OP produces successful fulfillment with applied quantity zero.
244. Success receipt contains operation ID, applied quantity, entity IDs, and Ledger range.
245. Large Instance results use a bounded receipt reference.
246. Broker timeout after commit is safe to retry.
247. Missing Reward acknowledgement does not change Inventory state.
248. Fulfillment remains queryable by Reward Grant and component ID.
249. One Reward component maps to one durable Inventory fulfillment record.
250. Sensitive internal errors are removed from generic Reward failure Events.

### Reward reversal

251. Reversal accepts only authenticated Reward Engine producer.
252. reversal_id is stable and idempotent.
253. Reversal locates the exact original fulfillment operation.
254. Original acquisition receipt remains immutable after reversal.
255. Untouched stack provenance lot can be fully reversed.
256. Consumed original lot cannot be replaced by unrelated equivalent quantity for reversal.
257. Partially consumed lot produces explicit residual-state failure or supported partial policy.
258. Untouched Item Instances from the fulfillment can be reversed.
259. Transferred original Instance cannot be silently deleted from destination.
260. Equipped original Item follows explicit reversal policy.
261. Accepted-noop original fulfillment reverses as accepted no-op without removing pre-existing ownership.
262. Duplicate reversal returns the original result.
263. Conflicting reversal fingerprint is rejected.
264. Successful reversal appends a compensating operation and Ledger entries.
265. Successful reversal publishes reward.reversal.succeeded.v1 atomically.
266. Unsafe reversal publishes sanitized terminal failure with residual state.
267. Retryable reversal failure does not create a second logical reversal.
268. Reconciliation can prove reversal outcome after result Event dispatch failure.

### Item and Character lifecycle integration

269. Item deprecation does not remove existing ownership.
270. Item retirement obeys historical fulfillment policy for pending Reward requests.
271. Item retirement blocks new ordinary acquisition when policy says BLOCK.
272. Item quarantine applies registered restrictions to existing ownership.
273. Item quarantine does not delete Ledger or ownership history.
274. Item recovery with newer source sequence recalculates restrictions.
275. Item replacement declaration does not auto-migrate Inventory.
276. Presentation erratum refreshes display projection without mechanical mutation.
277. Character suspension blocks ordinary owner mutation.
278. Character reactivation restores mutation according to policy.
279. Character closure blocks new ordinary fulfillment.
280. Character restoration preserves all pre-closure ownership.
281. Character anonymization minimizes personal links and preserves required integrity history.
282. Stale Character lifecycle Event does not overwrite newer projection.
283. Lifecycle projection unavailability beyond safety window fails risky writes closed.

### Idempotency and concurrency

284. Identical idempotency key and fingerprint returns the original response snapshot.
285. Same key with a different fingerprint returns INVENTORY_IDEMPOTENCY_CONFLICT.
286. Idempotency survives process restart.
287. Business idempotency survives inbox retention expiry.
288. All handlers use the normative lock order.
289. Deadlock retries reuse the same idempotency identity.
290. Concurrent decrements cannot produce negative quantity.
291. Concurrent unique acquisitions cannot create duplicates.
292. Concurrent Slot occupancy cannot exceed cardinality.
293. Concurrent Reservations cannot over-reserve quantity.
294. Concurrent expiration and consume have one valid serialized outcome.
295. Concurrent release and commit have one terminal Reservation result.
296. Concurrent transfer and destroy cannot both consume the same Item.
297. Expected entity version mismatch causes no partial mutation.
298. Aggregate versions increment only for changed entities.
299. Accepted no-op does not increment Item state versions unnecessarily.
300. Network calls are not made while authoritative rows are locked.
301. A transaction failure before commit leaves no state, Ledger, or outbox partials.
302. A response failure after commit is recovered by idempotent retry.
303. Stale home-region request is rejected by routing epoch.

### Events and projections

304. Every committed mutation requiring integration creates transactional outbox rows.
305. Outbox retry preserves Event ID and payload.
306. Event payload includes operation ID and relevant versions.
307. Multiple Events from one operation have deterministic ordinals.
308. Consumers can order one entity by aggregate version.
309. No global ordering across Characters is promised.
310. Malformed consumed Event is quarantined without poisoning the partition.
311. Unknown producer is rejected.
312. Unknown Event schema version is rejected or routed to compatibility handling.
313. Projection failure does not roll back ownership.
314. Projection watermark advances only after durable projection commit.
315. Projection rebuild uses a new generation and atomic reader switch.
316. Stale projection is labeled with watermark and lag.
317. Public projection contains only authorized Item data.
318. Absence from a stale projection is not treated as authoritative non-ownership.

### API behavior

319. Owner list endpoint enforces Character ownership authorization.
320. Entity detail endpoint verifies entity belongs to the requested account.
321. Pagination cursors are opaque and tamper-resistant.
322. Query limits are bounded.
323. Ownership-check batch size is bounded.
324. Authoritative ownership checks return a Ledger watermark.
325. A check API does not reserve quantity.
326. Mutation response includes correlation ID and operation ID.
327. Version conflicts map to stable 409 semantics.
328. Policy locks map to stable safe error semantics.
329. Hidden Item not-found behavior does not leak existence.
330. Unknown request fields follow strict schema policy.
331. Bulk target operations create a Job rather than one huge transaction.
332. Admin APIs require reason and ticket for high-risk actions.
333. Error codes are stable and not repurposed across versions.

### Security

334. Forged Reward Event is rejected before mutation.
335. Forged Character or Item lifecycle Event is rejected.
336. Cross-Character insecure direct object reference is denied.
337. Client Item semantics override attempt is rejected.
338. Client timestamp cannot extend expiration.
339. Capability payload cannot contain executable code or network callback.
340. Payload depth and size limits are enforced.
341. Rate limits apply per principal and Character.
342. Transfer endpoints have stricter abuse controls.
343. Support access is purpose-bound and audited.
344. High-risk corrections require step-up authentication and dual approval.
345. Runtime roles cannot alter Ledger history.
346. Database connections and backups are encrypted.
347. Hidden Item identifiers do not appear in unauthorized logs or metrics labels.
348. Conflicting idempotency attempts emit fraud signals.
349. Repeated hidden Item probes emit abuse signals.
350. Compromised Item version can be quarantined quickly.
351. Producer credentials can be revoked without database mutation.

### Privacy

352. Inventory stores no User email or legal name for ordinary ownership.
353. Ownership data is private by default.
354. Public equipment requires explicit presentation or public policy.
355. Privacy export contains owner-visible current ownership and history.
356. Privacy export minimizes transfer counterparty data.
357. Character closure hides public Inventory.
358. Anonymization removes direct personal references where present.
359. Anonymization preserves only required non-personal integrity evidence.
360. Logs omit full Inventory snapshots and mutable-state secrets.
361. Analytics Events use pseudonymous identifiers.
362. Rare hidden Item analytics are access-controlled or generalized.
363. Minor-safe policy can disable transfer and public equipment.
364. Support annotations follow shorter retention and redaction policy.
365. Cache keys include caller visibility class.
366. Owner views are never shared across principals.

### Performance and resilience

367. Cached-manifest fulfillment meets the defined latency target under tested load.
368. Authoritative ownership checks meet the defined p95 target under tested load.
369. Owner first-page projection meets the defined p95 target.
370. Write transactions do not load complete Inventory history.
371. Expiration worker uses indexed due-record scans.
372. Expiration processing is resumable after restart.
373. Outbox dispatch backlog is observable and retryable.
374. Live operations have priority over backfill Jobs.
375. Bulk Jobs respect rate and concurrency budgets.
376. Projection rebuild does not block ordinary writes.
377. Manifest cache invalidation reacts to lifecycle Events.
378. Manifest cache drift is detected by periodic verification.
379. Large collector accounts remain paginated without truncation.
380. Ledger partitions preserve lookup by account and operation.
381. Home-region migration verifies Ledger watermark before cutover.
382. Point-in-time restore preserves idempotency records.
383. Restore drill verifies outbox replay safety.
384. Dependency outage fails closed or uses verified cached facts according to policy.

### Audit, reconciliation, and correction

385. Every applied mutation has an Inventory Operation.
386. Every applied mutation has one or more immutable Ledger entries.
387. Ledger sequence is unique and monotonic within account.
388. Audit records actor, source, reason, Item version, and fingerprint.
389. Ledger integrity hashes verify after backup restore.
390. Reconciler detects Holding quantity versus provenance-lot mismatch.
391. Reconciler detects reserved quantity mismatch.
392. Reconciler detects Container occupancy mismatch.
393. Reconciler detects Slot/equipment mismatch.
394. Reconciler detects orphan uniqueness claim.
395. Reconciler detects missing Reward result Event.
396. Reconciler detects terminal state without terminal timestamp.
397. High-severity finding can quarantine only affected entities.
398. Correction proposal includes before-state hash and dry-run fingerprint.
399. Correction execution rejects stale before-state hash.
400. Correction appends history rather than rewriting original entries.
401. Correction publishes inventory.correction.applied Event.
402. Post-correction verification closes the finding only when invariants pass.
403. Bulk correction cancellation leaves completed target history intact.
404. Sensitive support reads and exports are audited.

### Database and migrations

405. Database constraints reject negative quantity.
406. Database constraints reject reserved quantity above total.
407. Unique idempotency tuple prevents duplicate operations.
408. Unique fulfillment ID prevents duplicate Reward application.
409. One active uniqueness claim exists per uniqueness hash.
410. One active single-cardinality Slot occupant exists.
411. Foreign keys or equivalent checks prevent orphan account ownership.
412. Ledger roles deny UPDATE and DELETE.
413. Rolling migration uses expand-before-contract sequence.
414. Backfill is resumable and rate-limited.
415. Migration does not rewrite immutable Item version references silently.
416. Migration verifies projection rebuild before old schema removal.
417. Schema downgrade cannot discard unknown authoritative state.
418. Backup restoration rebuilds projections from authoritative state and Ledger.
419. Migration failure can roll back before destructive contract phase.

A release candidate passes this RFC only when all 419 applicable tests are automated or have an approved, time-bounded exception with owner and remediation date.

---

## Future Extensions

Future capabilities may extend Inventory Engine only when they preserve the ownership boundary and single-writer guarantees of this RFC.

### Multiple Inventory Accounts per Character

Future products may require separate account scopes such as personal, guild, seasonal, sandbox, or organization Inventory. This requires an explicit account-purpose model and routing rules. It must not overload Containers to impersonate ownership boundaries.

### Shared and organization-owned Inventory

Guilds, teams, families, and organizations may own Items independently of a Character. This requires a generalized Inventory Subject contract, authorization model, contribution ledger, and privacy policy. Character ownership must remain unambiguous.

### Cross-shard transfer

A production-grade escrow saga may enable player-to-player and account-to-account transfer across shards. Required work includes destination idempotency, source escrow, timeout policy, reconciliation, fraud controls, abuse rate limits, and chaos testing.

### Marketplace integration

Marketplace Engine may reserve, list, settle, and transfer Items through typed Inventory primitives. Marketplace owns listing, price, matching, fees, and payment. Inventory owns custody, escrow, binding, and final ownership movement.

### Crafting integration

Crafting Engine may request atomic Reservation and consumption of exact inputs and acquisition of exact outputs. Recipe and success logic remain outside Inventory. Cross-Engine output failure requires an explicit saga and compensation model.

### Durability and repair

Expanded registered capabilities may support durability loss, repair Reservations, state transitions, and owner receipts. Inventory stores bounded state; gameplay and economic interpretation remain with registered owners.

### Item sockets and attachments

A future Container relationship may represent attachments, gems, modules, or nested components. It requires bounded graph depth, ownership invariants, transfer semantics, destruction policy, and migration rules.

### Loadout presets

Inventory may store reusable equipment-layout presets distinct from current Slot occupancy. Applying a preset is an atomic planned operation with conflict reporting. Character presentation presets remain Character-owned.

### Temporary lending

A lending workflow may move availability rights without transferring permanent ownership. It requires separate lender ownership, borrower custody, return deadline, equipment policy, and fraud handling.

### Instance provenance certificates

High-value Items may expose signed provenance summaries derived from Ledger without revealing private counterparties. This is not a blockchain requirement and must preserve privacy.

### Item version migration

Inventory may support approved migration from one exact Item version to another through a typed Migration Definition owned jointly by Item and Inventory governance. Migration is explicit, idempotent, auditable, reversible where possible, and never triggered only by a recommended-version change.

### Offline signed operation intents

Some products may require offline-capable use. A future protocol may issue bounded signed intents with nonce, expiry, Item capability, and maximum effect. Server commit remains authoritative and double-use must be prevented.

### Regional active-active reads with ownership proofs

Read performance may improve through cryptographically verifiable ownership projection snapshots. Writes still route to one home unless a future consensus design replaces this RFC through ADR.

### Archival tiers

Very old terminal Instances and Ledger partitions may move to lower-cost storage while exact operation and reversal lookup remain available within policy. Archival cannot break integrity chains or privacy workflows.

### Advanced duplicate conversions

A registered Conversion Engine may convert duplicate unique Items into Currency, resources, or alternate Rewards. Inventory only reports the duplicate and coordinates the typed owner contract; it does not invent exchange rates.

### Policy simulation

Authoring and LiveOps tooling may simulate capacity, duplicate, expiration, and transfer effects against anonymized Inventory distributions before Item publication or policy activation.

### Formal invariant verification

Critical quantity, transfer, and reversal state machines may be modeled in TLA+, Alloy, or another formal method. Models complement, not replace, executable tests.

### Event-sourced implementation

A future implementation may use Ledger Events as the primary source of truth. Migration requires proof that current semantics, idempotency, privacy, query performance, and repair workflows remain equivalent.

---

## ADR References

This RFC depends on or proposes the following architectural decisions. ADR identifiers should be created or aligned with the repository's final ADR registry.

### ADR-001 — Platform First

Core Inventory semantics remain independent from the School Module and every other business domain.

### ADR-002 — Event-Driven Engine Integration

Inventory consumes and publishes immutable Events. Cross-Engine state changes do not use direct database writes.

### ADR-003 — Platform-Owned Character

Inventory associates ownership with the platform Character identifier rather than a Module-specific student, player, customer, or member record.

### ADR-004 — Single Writer per State Domain

Inventory Engine is the only writer of Item ownership, while Item Engine owns Item Definitions and Reward Engine owns Reward decisions.

### ADR-005 — Immutable Published Item Versions

Every owned copy references an immutable Item Definition Version. Existing ownership is not rebound to mutable recommended content.

### ADR-006 — Transactional Inbox and Outbox

At-least-once delivery is made safe through durable inbox deduplication, business idempotency, and transactional outbox publication.

### ADR-007 — Append-Only Inventory Ledger

Current state is materialized for performance, while business-significant history remains immutable and auditable.

### ADR-008 — Aggregate Family instead of One Giant Character Aggregate

Account, Holding, Instance, Container, Reservation, Transfer, and Operation are bounded aggregates coordinated in one write shard.

### ADR-009 — Deterministic Lock Ordering

All multi-row Inventory mutations use a shared canonical lock order to prevent deadlocks and race-dependent semantics.

### ADR-010 — Integer Quantity Semantics

Authoritative Item quantities, durability, charges, capacities, and rule parameters use integers or explicitly scaled decimals; floating-point state is prohibited.

### ADR-011 — Typed Item Capabilities

Item-authored behavior is data validated against registered contracts. Arbitrary scripts, callbacks, and executable payloads are prohibited.

### ADR-012 — Reward Fulfillment Saga

Reward Engine decides and coordinates; Inventory applies the `ITEM` component idempotently and publishes the authoritative result.

### ADR-013 — Provenance Lots for Reversible Stackable Grants

Stackable acquisitions retain source lots so a specific Reward fulfillment can be reversed without removing unrelated equivalent copies.

### ADR-014 — Explicit Overflow Policy

Successful acquisition never silently loses Items. Capacity overflow is represented by a visible system Container or the operation fails.

### ADR-015 — One Write Home per Inventory Account

Version 1 routes one Character's Inventory writes to one authoritative region and uses routing epochs during migration.

### ADR-016 — Privacy-Minimized Operational Events

Inventory Events contain bounded ownership facts and pseudonymous identifiers, not User profiles or full Inventory snapshots.

### ADR-017 — Correction by Compensation, Not History Rewrite

Repairs append new operations and Ledger entries. Original facts remain attributable.

### ADR-018 — Transfer Feature Gate

Transferability declared by an Item is necessary but not sufficient. Runtime transfer remains disabled until authorization, escrow, fraud, and reconciliation controls are production-ready.

---

## Appendix

### Appendix A — Reference acquisition algorithm

The following pseudocode illustrates the normative decision flow. It is not executable Item scripting.

```text
function acquire(command):
    validate_command_schema(command)
    principal = authenticate(command.actor)
    canonical = canonicalize(command)
    fingerprint = sha256(canonical)

    existing = find_operation(command.idempotency_scope, command.idempotency_key)
    if existing exists:
        if existing.request_fingerprint != fingerprint:
            fail INVENTORY_IDEMPOTENCY_CONFLICT
        return existing.response_snapshot

    account = load_account_for_write_home(command.character_id)
    assert_routing_epoch(account, command.expected_routing_epoch)
    assert_character_and_account_eligible(account, command.source_type)
    authorize(principal, command.operation_kind, account, command.source)

    manifest = resolve_exact_verified_manifest(command.item_definition_version_id)
    assert_key_matches(command.item_definition_key, manifest)
    assert_acquisition_lifecycle(manifest, command.committed_at, command.source_type)
    semantics = compile_inventory_semantics(manifest)
    validate_quantity(command.quantity, semantics)

    begin transaction
        recheck_or_create_idempotency_guard(command, fingerprint)
        lock account
        resolve and lock uniqueness key if required
        resolve destination and lock containers
        lock compatible Holdings in canonical order
        recheck lifecycle and all invariants

        if duplicate:
            result = execute_registered_duplicate_policy(...)
        else if semantics.instance_required:
            result = create_instances(...)
        else:
            result = add_stackable_or_virtual_holding(...)

        operation = persist_operation(result)
        append_ledger(operation, result)
        persist_provenance(operation, result)
        create_domain_outbox_events(operation, result)
        create_owner_result_event_if_required(operation, result)
        persist_response_snapshot(operation, result)
    commit

    return operation.response_snapshot
```

### Appendix B — Reference stack consumption allocation

For stackable Items with provenance lots, default allocation SHOULD be deterministic:

1. lots already constrained to the selected expiration bucket;
2. earliest `expires_at` first, null last;
3. acquisition ledger sequence ascending;
4. lot ID ascending as final tie-breaker.

A capability may register another policy, but it must be deterministic and versioned. The operation records the policy version and exact lot deltas.

### Appendix C — Reward reversal impact plan

Before reversing a stackable Item fulfillment, Inventory computes:

```json
{
  "fulfillmentId": "uuid",
  "originalAppliedQuantity": 5,
  "originalLots": [
    {
      "holdingLotId": "uuid",
      "quantityOriginal": 5,
      "quantityRemaining": 3,
      "currentHoldingId": "uuid"
    }
  ],
  "reversibleQuantity": 3,
  "consumedQuantity": 2,
  "transferredQuantity": 0,
  "destroyedQuantity": 0,
  "quarantinedQuantity": 0,
  "literalFullReversalSafe": false,
  "supportedOutcome": "FAIL_WITH_RESIDUAL_STATE"
}
```

The plan is fingerprinted and stored. A later execution revalidates current state under locks. A changed plan requires re-evaluation and, where risk policy requires, new approval.

### Appendix D — State transition matrix for Item Instances

| Current lifecycle | Current availability | Operation | Allowed result |
|---|---|---|---|
| `ACTIVE` | `AVAILABLE` | reserve | `ACTIVE / RESERVED` |
| `ACTIVE` | `RESERVED` | release | `ACTIVE / AVAILABLE` |
| `ACTIVE` | `RESERVED` | commit consume | `CONSUMED / UNAVAILABLE_TERMINAL` or updated charges |
| `ACTIVE` | `AVAILABLE` | equip | `ACTIVE / EQUIPPED` |
| `ACTIVE` | `EQUIPPED` | unequip | `ACTIVE / AVAILABLE` |
| `ACTIVE` | `AVAILABLE` | transfer start | `ACTIVE / TRANSFER_PENDING` |
| `ACTIVE` | `TRANSFER_PENDING` | transfer complete | `TRANSFERRED / UNAVAILABLE_TERMINAL` in source |
| `ACTIVE` | allowed by policy | destroy | `DESTROYED / UNAVAILABLE_TERMINAL` |
| `ACTIVE` | any non-terminal | expire | `EXPIRED / UNAVAILABLE_TERMINAL` |
| terminal | terminal | ordinary mutation | rejected |
| any | any | quarantine | integrity becomes `QUARANTINED`; availability restricted |

The complete implementation matrix must additionally account for exact capabilities, binding, Character state, and Reservation purpose.

### Appendix E — State transition matrix for Holdings

| Current | Operation | Preconditions | Result |
|---|---|---|---|
| `ACTIVE` | acquire | merge-compatible and capacity | quantity increases or new Holding |
| `ACTIVE` | consume | sufficient available quantity | quantity decreases |
| `ACTIVE` | reserve | sufficient available quantity | reserved increases |
| `ACTIVE` | release | matching active Reservation | reserved decreases |
| `ACTIVE` | split | eligible quantity and capacity | source decreases, new Holding created |
| `ACTIVE` | merge | exact compatibility | destination increases, source may deplete |
| `ACTIVE` | destroy | policy and available quantity | quantity decreases |
| `ACTIVE` | expire | due policy | quantity decreases or state expires |
| `ACTIVE` | transfer | transfer policy and destination valid | source decreases or transfers |
| `DEPLETED` | acquire | ordinary acquisition creates or reactivates only by explicit implementation rule | normally new Holding |
| terminal | ordinary owner mutation | none | rejected |

Reusing a terminal Holding for a new acquisition is discouraged because it complicates provenance and terminal history. The reference implementation creates a new Holding unless an approved optimization preserves all invariants.

### Appendix F — Consistency guide for consumers

| Consumer need | Recommended contract |
|---|---|
| Display owner Inventory | Owner projection with watermark |
| Decide whether to show a cosmetic as selectable | Inventory entitlement projection plus Character selection validation |
| Complete a Quest requiring current possession | Authoritative ownership check or Reservation |
| Consume an Item for a Quest | Inventory Reservation then commit |
| Display Item count for analytics | Eventual Item Count projection |
| Reverse a Reward Item | Reward reversal contract using fulfillment ID |
| Publish public equipment | Character-authorized public equipment projection |
| Create marketplace listing | Reservation/escrow contract, never a plain read |

### Appendix G — Initial registry values

#### Stack modes

- `STACKABLE`;
- `NON_STACKABLE`;
- `VIRTUAL_UNIQUE`.

#### Duplicate policies

- `ACCEPT_NO_OP`;
- `REJECT`;
- `CONVERT_VIA_OWNER_CONTRACT`;
- `INCREMENT_AUXILIARY_COUNTER`.

#### Root Container types

- `PRIMARY`;
- `EQUIPMENT`;
- `OVERFLOW`;
- `ARCHIVE`;
- `ESCROW`.

#### Binding types

- `UNBOUND`;
- `CHARACTER`;
- `USER`;
- `ACCOUNT_GROUP`;
- `MODULE_SCOPE`;
- `SEASON_OCCURRENCE`.

Only types with authoritative scope resolvers may be activated.

#### Initial Inventory capability contracts

- `inventory.consume.v2`;
- `inventory.charge.use.v1`;
- `inventory.durability.adjust.v1`;
- `inventory.equip.v1`;
- `inventory.expire.v1`;
- `inventory.transfer.v1`;
- `inventory.destroy.v1`.

Activation of a capability does not guarantee every deployment enables its command surface.

### Appendix H — Operational runbooks

#### Reward fulfillment stuck

1. locate fulfillment by `fulfillment_id`;
2. verify request fingerprint;
3. inspect Inventory Operation and transaction outcome;
4. inspect outbox result Event;
5. republish the same Event ID if pending;
6. never create a new acquisition command;
7. reconcile Reward acknowledgement separately.

#### Quantity integrity finding

1. quarantine affected entity when severity requires;
2. preserve current rows and logs;
3. compare Ledger, provenance lots, Reservations, and state;
4. identify earliest divergent operation;
5. simulate registered correction;
6. obtain approvals;
7. execute correction with before-state hash;
8. rebuild projections;
9. verify invariants;
10. close finding with evidence.

#### Item manifest mismatch

1. stop affected Item version mutations;
2. compare cache fingerprint with Item Engine exact lookup;
3. validate producer authenticity and registry versions;
4. invalidate compromised cache;
5. quarantine ownership interactions if mechanical meaning is uncertain;
6. restore only after compatibility verification;
7. run affected-operation reconciliation.

#### Transfer ambiguity

1. block source and destination entities;
2. inspect escrow token and both shard receipts;
3. determine whether destination effect exists;
4. never restore source if destination commit is proven;
5. apply registered reconciliation transition;
6. publish final Transfer Event;
7. verify net quantity conservation.

### Appendix I — Implementation checklist

#### Domain and persistence

- [ ] Inventory Account lifecycle implemented.
- [ ] Holdings and Item Instances separated correctly.
- [ ] Exact immutable Item version references enforced.
- [ ] Provenance lots implemented for stackable acquisitions.
- [ ] Containers, Slots, and capacity counters implemented.
- [ ] Reservations implemented with durable expiry.
- [ ] Equipment state and Slot invariants implemented.
- [ ] Transfer feature disabled unless complete.
- [ ] Append-only Ledger permissions verified.
- [ ] Inbox and outbox transactional patterns verified.
- [ ] Idempotency records retained for business lifetime.

#### Integrations

- [ ] Character lifecycle projector.
- [ ] Item exact manifest resolver and lifecycle projector.
- [ ] Reward Item fulfillment handler.
- [ ] Reward Item reversal handler.
- [ ] Generic Reward result schemas validated.
- [ ] Capability Registry integration.
- [ ] Authorization and Policy integration.
- [ ] Notification and analytics remain asynchronous.

#### APIs and UX

- [ ] Owner list and detail APIs.
- [ ] Authoritative ownership checks.
- [ ] Move, split, merge, use, equip, unequip, and destruction commands.
- [ ] Reservation internal APIs.
- [ ] Operation receipt endpoint.
- [ ] Projection watermarks exposed.
- [ ] Stable localized error mapping.
- [ ] Hidden Item disclosure tested server-side.
- [ ] Accessibility requirements tested.

#### Operations

- [ ] Metrics and alerts.
- [ ] Ledger/state reconciler.
- [ ] Reservation and expiration workers.
- [ ] Projection rebuild tooling.
- [ ] Correction simulation and approvals.
- [ ] Bulk Job controls.
- [ ] Backup and restore drills.
- [ ] Home-region migration runbook.
- [ ] Security quarantine runbook.
- [ ] Load, concurrency, replay, and chaos tests.

### Appendix J — Release criteria

Inventory Engine may enter production only when:

1. all applicable Acceptance Tests pass;
2. Item and Reward contract compatibility tests pass against production candidate versions;
3. negative quantity, duplicate fulfillment, uniqueness, and Slot race tests pass under concurrency;
4. Ledger/state reconciliation returns no unexplained findings on the release dataset;
5. backup restore and projection rebuild drills succeed;
6. outbox replay produces no duplicate logical effects;
7. privacy export, closure, and anonymization workflows pass;
8. hidden Item penetration tests pass;
9. operational dashboards and alerts are live;
10. support and correction runbooks are approved;
11. transfer remains disabled unless its dedicated release gate passes;
12. the owning Platform Team accepts the measured capacity envelope and known limitations.

### Appendix K — Canonical summary

The shortest correct description of this Engine is:

> Item Engine defines the immutable meaning of an Item. Reward Engine decides that an Item should be granted. Inventory Engine is the sole authority that records and changes ownership of the exact Item version, protects that ownership under concurrency, and explains every resulting state through an immutable ledger.

Business Modules integrate by publishing Events and invoking registered commands. They do not modify the Engine or its database.
