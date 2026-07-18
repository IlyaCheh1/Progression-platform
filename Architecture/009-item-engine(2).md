---
document: 009-item-engine
title: Item Engine
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
related_documents:
  - 004-progression-engine
  - 006-achievement-engine
  - 007-quest-engine
  - 008-talent-engine
  - 010-inventory-engine
  - 011-season-engine
---

# Item Engine

> **Platform contract conformance:** all Event names, envelopes, Season facts,
> and immutable manifest contracts MUST conform to
> `002a-platform-contract-standard` and `002b-cross-engine-integration`.

## Executive Summary

The Item Engine is the authoritative platform component for defining, validating, versioning, publishing, classifying, presenting, and retiring reusable Item content.

An Item Definition describes what an Item **is**. It defines canonical identity, immutable versioned content, category, tags, presentation, stack and uniqueness semantics, binding policy, compatibility constraints, registered interaction capabilities, typed properties, lifecycle policy, and references required by downstream Engines. It does not represent who owns the Item, where it is stored, how many copies a Character has, whether a particular instance is equipped, or whether a consumable has already been used.

The Item Engine owns:

- stable Item Definition keys;
- immutable published Item Definition versions;
- Item type and property-schema registries;
- category, tag, rarity, collection-membership, and presentation metadata;
- stackability, uniqueness, binding, transferability, expiration-capability, and instance-requirement declarations;
- typed Item capability and interaction contracts;
- deterministic validation and compilation of Item content;
- compatibility declarations for Inventory, Character presentation, Reward, Quest, Collection, Season, marketplace, and future consumers;
- publication, activation, deprecation, retirement, replacement, and migration metadata;
- localizations, media references, accessibility metadata, and disclosure policy;
- catalog search and discovery projections;
- content fingerprints, dependency graphs, audit history, review state, and publication evidence;
- inbox, outbox, reconciliation, and cache-invalidation state needed to operate the catalog safely.

The Item Engine does **not** own Character Item ownership. The Inventory Engine is the only writer of Item instances, stacks, quantities, containers, slots, equipment state, reservations, transfers, consumption, expiration of owned copies, and Inventory ledgers. Reward Engine owns the decision and saga for granting an Item Reward. Item Engine supplies an immutable Definition reference and validates that the referenced version exists and is compatible; Inventory Engine applies the ownership effect idempotently.

The Item Engine also does not own prices, purchases, orders, payments, marketplace listings, trading, crafting execution, random loot resolution, currencies, Character identity, profile selection, progression, achievements, quests, talents, reputation, seasons, notifications, or business-domain truth. It may define typed capabilities that those owners consume, but it never writes their aggregates.

Published Item content is data, not executable code. Arbitrary source code, SQL, unrestricted expression languages, remote callbacks, client-provided formulas, dynamic class loading, and hidden side effects are prohibited. A new Item capability requires a registered contract, an explicit consumer owner, versioning rules, deterministic validation, security review, operational limits, and compatibility tests.

The Engine is designed around the following non-negotiable invariants:

1. Only Item Engine may create, version, publish, deprecate, retire, or replace Item Definitions and Item property schemas.
2. A published Item Definition version is immutable.
3. A stable Item Definition key is never reused for a semantically different Item.
4. Item ownership is never stored in Item Engine.
5. Inventory state is never inferred from catalog state.
6. Retirement prevents new ordinary acquisition unless a consumer contract explicitly permits historical fulfillment; retirement never deletes existing owned copies.
7. Every owned copy must remain interpretable by retaining its exact Item Definition version or an approved compatibility mapping.
8. A catalog edit cannot silently alter the meaning of an already granted Item.
9. Runtime consumers reference immutable version identifiers, not mutable drafts or display names.
10. Display names, descriptions, icons, and localization are not identifiers.
11. Stackability, uniqueness, binding, and instance requirements are explicit, typed, versioned semantics.
12. Item Engine never modifies Character, Reward, Inventory, Progression, Quest, Achievement, Talent, Season, Currency, Reputation, or marketplace state.
13. Every publication is validated against registered schemas, dependency rules, consumer compatibility, localization policy, and media policy.
14. Published dependency graphs are finite and acyclic within layers that require acyclicity.
15. Item Definition references cannot resolve to drafts.
16. Unknown property keys and unknown capability types fail closed.
17. Floating-point values are prohibited for authoritative quantities, durability units, charges, dimensions used in rules, and numeric capability parameters; scaled integers or decimals with explicit precision are required.
18. Client input is never authoritative for Item identity, version, ownership, rarity, binding, capability, or use outcome.
19. Catalog publication is auditable and attributable to an actor, review decision, exact source revision, and content fingerprint.
20. Duplicate commands and duplicate Events have at most one logical effect.
21. Item Engine search projections may be eventually consistent, but authoritative lookup by immutable version must be read-after-write consistent after publication commits.
22. Hidden, unreleased, internal-only, or spoiler-sensitive Item content is protected server-side.
23. Media assets are referenced, not embedded as mutable binary truth in Item Definition rows.
24. Replacement and migration metadata are advisory contracts; they do not mutate owned Inventory without an Inventory-owned migration command.
25. An Item Definition can declare an interaction capability, but execution and foreign-state mutation remain with the registered owner Engine.
26. Corrections to published content require a new version, an explicit erratum overlay allowed by this RFC, or an approved security emergency process; direct mutation is prohibited.
27. Administrative repair never bypasses schema validation, audit, authorization, idempotency, or publication gates.
28. When correctness and availability conflict, the Engine prefers delayed publication, stale-but-labeled catalog reads, quarantine, or rejected references over ambiguous Item identity or silent semantic drift.

This RFC is normative for Item Engine ownership, terminology, content lifecycle, Definition modeling, property and capability contracts, publication, persistence, APIs, authoring, administration, UX, security, privacy, performance, auditability, edge cases, and production acceptance tests.

---

## Purpose

The purpose of this document is to define a production-ready specification for the Item Engine of Progression Platform.

It establishes:

- the authoritative boundary between Item Definitions and Character-owned Inventory;
- canonical language for Item, Item Definition, Item Definition Version, Item Type, Property Schema, Capability, Interaction, Variant, Rarity, Tag, Collection Membership, Replacement, and Retirement;
- immutable publication and versioning semantics;
- deterministic validation and compilation rules;
- typed contracts for stacking, uniqueness, binding, transferability, equipment compatibility, consumability, expiration capability, and presentation;
- safe integration with Reward and Inventory fulfillment;
- stable catalog discovery and exact version lookup;
- localizations, assets, accessibility, disclosure, and hidden-content rules;
- reference persistence and API models;
- content authoring, simulation, review, publication, rollback, deprecation, and incident workflows;
- security, privacy, performance, observability, and audit requirements;
- acceptance tests sufficient for backend implementation and production release.

The specification is domain-agnostic. A historical fencing school may publish uniforms, training weapons, rank sashes, trophies, manuals, event tokens, and cosmetic emblems. A fitness module may publish badges, equipment entitlements, class passes, and collectibles. An education module may publish certificates, notebooks, access keys, and course artifacts. A gaming community may publish cosmetics, trophies, consumables, materials, and event collectibles. These are content examples only; the Engine core operates on canonical typed Definitions.

### Normative language

The key words **MUST**, **MUST NOT**, **REQUIRED**, **SHALL**, **SHALL NOT**, **SHOULD**, **SHOULD NOT**, **RECOMMENDED**, **MAY**, and **OPTIONAL** indicate normative requirement levels.

An implementation that allows Inventory, Reward, a Module, an administrator, a client, or analytics tooling to mutate published Item Definition rows directly violates this RFC unless an approved ADR explicitly replaces the ownership model.

### Design posture

Version 1 should favor:

- a relational authoritative store;
- immutable published Definition versions;
- transactional inbox and outbox patterns;
- stable human-readable keys plus opaque UUID version identifiers;
- JSON Schema or an equivalent bounded property-schema registry;
- precompiled validation and capability manifests;
- explicit consumer compatibility declarations;
- purpose-specific read projections;
- deterministic content fingerprints;
- optimistic concurrency for draft editing;
- approval gates for publication;
- asynchronous search indexing and cache invalidation;
- reconciliation and projection rebuild tools.

Version 1 does not require a general scripting runtime, procedural generation engine, marketplace, crafting engine, loot table engine, combat equipment simulator, economy optimizer, asset pipeline, digital-rights management platform, or distributed transaction across Item and Inventory stores.

---

## Goals

### G-1. Authoritative catalog ownership

Provide one authoritative writer for Item Definition identity, versions, schemas, capabilities, metadata, and lifecycle.

### G-2. Stable historical meaning

Ensure every granted or referenced Item remains interpretable years later using the exact immutable Definition version that existed at acquisition time.

### G-3. Platform independence

Support multiple business domains without embedding school, fitness, education, marketplace, or game-specific logic in the Engine.

### G-4. Data-driven content

Allow authorized teams to define Items through validated configuration rather than source-code changes.

### G-5. Clear Inventory boundary

Keep catalog semantics and ownership state separate so Item Engine can evolve independently from Inventory Engine.

### G-6. Typed semantics

Represent stack, uniqueness, binding, transfer, equipment, consumption, expiration, and interaction declarations through explicit registered contracts.

### G-7. Deterministic publication

Produce the same compiled manifest and fingerprint for the same normalized source content and registry versions.

### G-8. Safe Reward integration

Allow Reward Definitions to reference immutable Item versions and permit Inventory Engine to fulfill grants without ambiguity.

### G-9. Explainability

Answer what an Item is, why it is valid or invalid, which version is active, which capabilities it declares, and which consumers depend on it.

### G-10. Discoverable catalog

Provide efficient, localized, audience-aware catalog projections for clients, authoring tools, administration, and internal consumers.

### G-11. Hidden-content protection

Prevent spoiler-sensitive, internal, unreleased, or audience-restricted Items from leaking through APIs, errors, indexes, caches, or assets.

### G-12. Safe evolution

Support new versions, replacements, deprecations, and migrations without mutating historical ownership or silently changing semantics.

### G-13. Consumer independence

Allow Inventory, Reward, Quest, Achievement, Talent, Character presentation, Collection, Season, and future Engines to consume Item catalog facts asynchronously.

### G-14. Horizontal read scalability

Serve high-volume catalog reads from caches and projections while preserving exact authoritative lookup by immutable version.

### G-15. Operational repairability

Provide rebuild, reconciliation, reindex, republish, quarantine, and controlled erratum workflows without direct database edits.

### G-16. Production observability

Expose publication health, invalid references, cache age, projection lag, search lag, dependency failures, and consumer compatibility metrics.

### G-17. Accessibility and localization

Make presentation metadata localizable and accessible without allowing localization changes to alter mechanical semantics.

### G-18. Governance

Require review and approval proportional to the risk of Item semantics, hidden content, economic effects, and downstream dependencies.

---

## Non Goals

### NG-1. Inventory ownership

The Engine does not own Item instances, stacks, quantities, containers, slots, equipment state, reservations, transfers, consumption, or Inventory ledgers.

### NG-2. Reward decisions

The Engine does not decide whether a Character deserves an Item and does not own Reward Grant sagas.

### NG-3. Commerce

The Engine does not own prices, catalogs for sale, orders, purchases, refunds, tax, settlement, marketplace listings, bids, trades, or payment state.

### NG-4. Currency

The Engine does not own balances, exchange rates, wallets, or monetary policy.

### NG-5. Character profile state

The Engine may describe presentation capabilities, but Character Engine owns profile selection and visibility.

### NG-6. Equipment runtime

The Engine may define equipment compatibility metadata. Inventory or a dedicated Equipment Engine owns equip commands, slot occupancy, and runtime state.

### NG-7. Procedural generation

Random affixes, seeds, generated stats, loot rolls, and procedural instance creation are outside version 1.

### NG-8. Crafting execution

Recipes, crafting jobs, material reservation, success rolls, and output ownership are outside Item Engine. Future recipe definitions may reference Item versions but require a dedicated owner.

### NG-9. Item use orchestration

The Engine declares registered interactions; it does not decrement inventory or execute foreign effects.

### NG-10. General rules engine

The Engine is not a universal expression evaluator or arbitrary automation system.

### NG-11. Asset hosting

The Engine references media assets but is not the binary asset store, transcoder, CDN, or moderation pipeline.

### NG-12. Search as truth

Search indexes are projections and never authoritative for validation or fulfillment.

### NG-13. Analytics warehouse

Operational events may feed analytics, but Item Engine is not the warehouse or BI layer.

### NG-14. Business taxonomy ownership

Modules may maintain business-specific categories and map them to platform tags. Item Engine does not become a universal business master-data system.

### NG-15. Physical inventory

Warehouse stock, shipping, serial-number logistics, and real-world fulfillment are outside scope.

### NG-16. Intellectual-property licensing

The Engine stores references and rights metadata needed for serving content but does not replace legal-rights management.

---

## Responsibilities

### R-1. Stable Item identity

Create and protect a stable `item_definition_key` and opaque `item_definition_id` for each canonical Item concept.

### R-2. Immutable versioning

Create draft versions, validate them, publish immutable versions, and preserve every historical version referenced by downstream state.

### R-3. Type registry

Own the registry of Item Types and the allowed property schemas and capability families associated with each type.

### R-4. Property validation

Validate typed Item properties against versioned schemas, bounds, units, enums, precision, and cross-field invariants.

### R-5. Capability compilation

Compile registered capability declarations into deterministic consumer manifests.

### R-6. Inventory semantics declaration

Declare stackability, maximum stack policy, instance requirement, uniqueness scope, binding modes, transferability, tradability hint, expiration capability, and destruction policy.

These are catalog declarations. Inventory Engine remains authoritative for application.

### R-7. Presentation metadata

Own canonical names, descriptions, icons, artwork references, rarity presentation, accessibility labels, disclosure policy, and localizations.

### R-8. Classification

Own platform-level categories, tags, rarity references, audience markers, and collection-membership declarations that describe the Item.

### R-9. Dependency validation

Validate references to media assets, property schemas, capability types, collection keys, season keys, replacement Items, and registered external contracts.

### R-10. Publication lifecycle

Support draft, review, approved, scheduled, published, deprecated, retired, quarantined, and superseded states under explicit rules.

### R-11. Exact lookup

Provide authoritative lookup by Definition ID, stable key, and immutable version ID.

### R-12. Catalog projections

Maintain audience-aware, localized, searchable projections for public, owner, internal, support, and admin contexts.

### R-13. Event publication

Publish lifecycle and compatibility Events through a transactional outbox.

### R-14. Consumer compatibility

Track which consumer contract versions a published Item requires and reject incompatible publication.

### R-15. Replacement metadata

Declare suggested replacement or successor Items without changing existing ownership.

### R-16. Errata

Support narrowly scoped presentation-only errata where legally or operationally necessary, while preserving the mechanical fingerprint.

### R-17. Audit

Record source revisions, validation results, review decisions, approvals, publication actors, timestamps, correlation IDs, and fingerprints.

### R-18. Reconciliation

Detect broken references, projection divergence, index lag, missing outbox publication, and impossible lifecycle states.

### R-19. Security

Enforce role-based authoring, approval separation, hidden-content access, tenant/module scope, and protected asset references.

### R-20. Privacy

Minimize personal data and ensure author/audit identity is handled under platform retention and access policy.

### R-21. Migration support

Publish explicit compatibility and migration metadata while leaving Inventory-owned migrations to Inventory Engine.

### R-22. Documentation generation

Expose machine-readable schemas and contract manifests so SDKs, validators, and authoring tools can remain aligned.

### Explicitly forbidden responsibilities

Item Engine SHALL NOT:

- grant Items to Characters;
- create owned instances;
- increment or decrement Inventory quantity;
- equip or unequip Items;
- reserve or transfer ownership;
- consume or destroy owned copies;
- issue Rewards;
- change Character profile state;
- modify Progression, Quest, Achievement, Talent, Reputation, Season, or Currency state;
- calculate purchase eligibility or price;
- execute arbitrary Item effects;
- infer ownership from Event history;
- mutate published versions in place;
- expose drafts to runtime consumers;
- use display names as stable identifiers.

---

## Dependencies

### Required platform dependencies

#### Event transport

A durable at-least-once Event transport is required for lifecycle publication, cache invalidation, compatibility notifications, and reconciliation.

#### Relational authoritative storage

A transactional relational database is required for Definitions, versions, schemas, lifecycle, dependencies, reviews, audit, inbox, and outbox.

#### Identity and access provider

Author, reviewer, publisher, administrator, support, and service identities must be authenticated and authorized.

#### Clock service

A trusted server clock is required for scheduled publication, retirement, audit, and cache metadata.

#### Asset registry

Media references must resolve through a registered asset service that supplies immutable asset version IDs, moderation status, integrity hashes, and access policy.

#### Localization service or repository

Localized strings may be stored directly or referenced, but publication must validate locale completeness and fallback policy.

#### Schema registry

Item property and capability payloads require versioned schemas with compatibility metadata.

#### Search infrastructure

Search is optional for correctness but required for production catalog discovery at scale.

#### Cache infrastructure

Distributed caching is recommended for published exact-version lookups and localized catalog cards.

### Engine dependencies

| Dependency | Relationship |
|---|---|
| Character Engine | Supplies lifecycle and visibility facts for audience-aware presentation; Item Engine never writes Character state. |
| Reward Engine | References immutable Item versions in Reward Definitions and requests Item fulfillment from Inventory Engine. |
| Inventory Engine | Consumes Definition manifests and owns Character Item state. |
| Achievement Engine | May reference Item ownership facts from Inventory, not Item Engine ownership. May use Definition metadata for display. |
| Quest Engine | May reference immutable Item versions in objectives or requirements; ownership facts come from Inventory. |
| Talent Engine | May reference Item Definition metadata for prerequisites or presentation; ownership facts come from Inventory. |
| Season Engine | May activate seasonal catalog views or associate Item Editions; does not mutate published Definition versions. |
| Collection capability | May consume Item membership declarations and ownership facts from Inventory. |
| Notification Engine | Consumes publication or grant-related Events as needed; Item Engine does not send notifications directly. |

### Forbidden runtime dependencies

Item Engine MUST NOT:

- read Inventory tables directly;
- read Reward tables directly;
- query Module operational databases for publication decisions;
- synchronously call Inventory during ordinary catalog reads;
- require search availability for exact version lookup;
- require analytics availability for commands;
- rely on client clocks;
- call arbitrary URLs from Item capability configuration;
- execute untrusted content code.

### Dependency degradation policy

| Dependency unavailable | Required behavior |
|---|---|
| Search | Exact lookup continues; discovery may be stale or unavailable with explicit status. |
| Cache | Read through to authoritative store; rate limits protect the database. |
| Event bus | Publication transaction commits with outbox; dispatcher retries. |
| Asset registry | New publication referencing unverified assets is rejected; existing published versions remain readable from cached metadata. |
| Localization service | Publication follows declared fallback policy; required locale failure blocks publication. |
| Schema registry | New or changed content publication fails closed; existing compiled manifests continue. |
| Inventory Engine | Catalog operation continues; no ownership action is attempted. |
| Reward Engine | Catalog operation continues; Reward validation may be delayed. |

---

## Architecture Overview

### Logical components

```text
Authoring Client / Admin API
            |
            v
     Command Gateway
            |
            v
 Draft & Review Service -----> Validation / Compilation Pipeline
            |                              |
            |                              v
            |                      Contract Registries
            v
   Publication Coordinator
            |
      single transaction
            |
   +--------+---------+------------------+
   |                  |                  |
   v                  v                  v
Definition Store   Dependency Store   Outbox
   |                                      |
   v                                      v
Exact Lookup API                       Event Bus
   |
   +--------------------+
   |                    |
   v                    v
Catalog Projector    Cache Projector
   |                    |
   v                    v
Search Index         Distributed Cache
```

### Runtime fulfillment relationship

```text
Reward Engine
  reward.fulfillment.requested.v1
            |
            v
     Inventory Engine --------------------+
            |                              |
            | exact immutable reference   |
            v                              |
       Item Engine                         |
   authoritative manifest                 |
            |                              |
            +------------------------------+
            |
     Inventory mutation
            |
 reward.fulfillment.succeeded.v1 / failed.v1
            |
            v
       Reward Engine
```

Item Engine is not in the ownership transaction. Inventory Engine may use a local catalog projection or exact lookup, but it remains the writer and fulfillment authority.

### Write path

1. An authenticated author creates a Definition or draft version.
2. The API normalizes the command and applies optimistic concurrency.
3. The draft is stored with a source revision.
4. Validation resolves schemas, properties, capabilities, assets, localizations, and dependencies.
5. Compilation produces a normalized manifest and deterministic fingerprint.
6. Review policy determines required approvals.
7. A publisher schedules or executes publication.
8. Publication atomically writes immutable version state, lifecycle records, dependency snapshots, audit, and outbox Events.
9. Projectors update exact caches, catalog views, search indexes, and consumer registries.
10. Consumers adopt the version according to their own lifecycle and compatibility policy.

### Read path

Authoritative exact lookup:

1. Resolve by immutable `item_definition_version_id` or stable key plus explicit version.
2. Read from immutable cache if fingerprint matches.
3. On miss, read authoritative published storage.
4. Return normalized manifest with lifecycle and disclosure metadata.

Catalog discovery:

1. Normalize audience, locale, filters, cursor, and projection watermark.
2. Query the purpose-specific search projection.
3. Apply server-side disclosure filtering.
4. Return localized cards and freshness metadata.
5. Never use search output to authorize a grant or validate a Definition reference.

### Consistency model

- Draft writes are strongly consistent within the primary region.
- Publication commit is strongly consistent for authoritative exact lookup.
- Outbox delivery is at least once.
- Cache invalidation and catalog search are eventually consistent.
- Logical publication effect is exactly once by command idempotency and version uniqueness.
- Consumer adoption is asynchronous and independently observable.

### Partitioning

Definitions may be partitioned by `catalog_scope` and stable key hash. Runtime Item lookup is read-heavy and globally cacheable. Draft writes and publication are low-volume compared with reads. The authoritative design should optimize correctness and auditability first, then distribute immutable published content through caches and replicas.

### Multi-region posture

Version 1 SHOULD use a single authoritative write region for each catalog scope. Published immutable versions may be replicated globally. Active-active publication is not required. If introduced later, stable-key allocation, optimistic revisions, publication sequencing, and outbox ordering require a dedicated ADR.

### Failure model

The Engine assumes:

- commands may be retried;
- Events may be duplicated, delayed, and reordered;
- projectors may crash after applying but before acknowledging;
- caches may retain stale entries;
- asset or schema registries may be unavailable;
- publication may fail after validation but before commit;
- a consumer may lag behind a new contract version;
- search may index partial data;
- authors may attempt invalid or conflicting changes.

Every path must produce deterministic, observable, and repairable outcomes.

---

## Canonical Definitions

### Item

A canonical kind of collectible, usable, equipable, presentational, access-bearing, or otherwise inventory-addressable content represented by an Item Definition.

In this RFC, “Item” without qualification refers to the concept defined by the catalog. A Character-owned copy is an **Item Instance** or **Item Stack**, owned by Inventory Engine.

### Item Definition

The stable aggregate identity for one Item concept across versions.

It contains:

- `item_definition_id`;
- stable `item_definition_key`;
- catalog scope;
- Definition lifecycle;
- version sequence;
- current recommended published version pointer;
- governance metadata.

It does not contain mutable runtime ownership.

### Item Definition Version

An immutable published snapshot of Item semantics and presentation.

A version includes:

- type and schema versions;
- mechanical properties;
- Inventory semantics;
- capabilities;
- classification;
- localization bundle references;
- asset references;
- dependency snapshot;
- disclosure policy;
- compatibility requirements;
- normalized manifest;
- content fingerprint.

Draft versions are mutable through revisioned commands. Published versions are immutable.

### Stable key

A globally or scope-unique human-readable identifier such as `cosmetic.training_sash`.

The key is intended for configuration and diagnostics. It MUST NOT be changed after the first publication and MUST NOT be reused.

### Version ID

An opaque globally unique identifier for one immutable Item Definition Version. Runtime contracts SHOULD use this identifier.

### Catalog scope

The namespace and governance boundary in which a Definition key is unique and visible. Typical scopes are `platform` or an approved Module/content namespace. Scope is not ownership by a Module; the platform remains authoritative.

### Item Type

A registered semantic family that determines allowed property schemas, capabilities, and validation rules. Examples may include `COSMETIC`, `COLLECTIBLE`, `CONSUMABLE`, `TROPHY`, `QUEST_ITEM`, `MATERIAL`, `ACCESS_TOKEN`, and `GENERIC`.

Types are extensible through governance. They are not free-form strings authored per Item.

### Property Schema

A versioned registered schema defining allowed typed properties for an Item Type or capability. It includes field types, bounds, units, precision, required fields, defaults, compatibility classification, and validation rules.

### Property

A typed declarative value attached to an Item Definition Version. Properties are data and cannot invoke code.

### Capability

A registered declaration that an Item may participate in a bounded interaction or consumer behavior. A capability includes a type, schema version, consumer owner, payload, disclosure level, and compatibility range.

Examples:

- `inventory.stack.v1`;
- `inventory.unique.v1`;
- `inventory.bind.v1`;
- `inventory.consume.v1`;
- `character.cosmetic.v1`;
- `equipment.slot_compatibility.v1`;
- `quest.requirement.reference.v1`;
- `collection.member.v1`.

A capability is not execution. The registered consumer decides how to apply it.

### Inventory semantics

The subset of Definition semantics consumed by Inventory Engine, including:

- stack mode;
- maximum quantity per stack;
- instance requirement;
- uniqueness scope;
- binding policy;
- transferability;
- destruction policy;
- expiration capability;
- durability capability;
- merge compatibility.

### Stack mode

One of:

- `NON_STACKABLE`: every owned copy requires an instance;
- `STACKABLE`: equivalent copies may share a quantity record;
- `VIRTUAL_UNIQUE`: ownership is represented as present/absent and duplicate grants follow a declared policy.

### Instance requirement

Whether every owned copy requires an opaque Inventory-owned instance ID. Non-stackable, serializable, individually mutable, or uniquely equipped Items generally require instances.

### Uniqueness scope

The scope in which duplicate ownership is constrained. Registered values may include:

- `NONE`;
- `CHARACTER`;
- `USER`;
- `ACCOUNT_GROUP`;
- `SEASON_OCCURRENCE`;
- `MODULE_MEMBERSHIP`.

Only scopes supported by Inventory Engine may be published.

### Duplicate acquisition policy

The declared behavior when a grant would violate uniqueness. Registered values may include:

- `ACCEPT_NO_OP`;
- `REJECT`;
- `CONVERT_VIA_OWNER_CONTRACT`;
- `INCREMENT_AUXILIARY_COUNTER`.

Item Engine declares policy; Inventory or another registered owner executes it.

### Binding policy

A declaration governing whether ownership may become bound to a Character, User, module context, or other supported scope. Binding is applied and stored by Inventory Engine.

### Transferability

A catalog declaration indicating whether transfer is semantically allowed and under which contract. It is not proof that a transfer endpoint is available or that business policy permits a specific transfer.

### Rarity

A presentation and classification reference such as `COMMON`, `RARE`, or a registered domain-independent rarity key. Rarity MUST NOT silently control economic value, grant probability, or progression unless an explicit consumer contract says so.

### Tag

A stable classification label used for search, filtering, rules, and discovery. Tags have a registry and cannot be arbitrary user-authored strings in published content.

### Variant

A related Item Definition that shares a declared family but has independent identity and versioning. Variants are not mutable fields on an owned instance unless a dedicated instance-customization contract exists.

### Variant family

A stable grouping of Item Definitions for presentation or compatibility. It does not imply ownership substitution.

### Collection membership

A declaration that an Item Definition belongs to a curated Collection. Collection completion state is owned by the Collection capability using Inventory ownership facts.

### Localization bundle

A versioned set of locale-specific names, descriptions, lore, accessibility labels, and disclosure-safe text. Localization changes that do not alter semantics may be released through a presentation version or erratum policy defined below.

### Asset reference

An immutable reference to an approved media asset version. Assets include icons, images, models, audio, and thumbnails. Asset availability and rights are validated before publication.

### Disclosure policy

Rules that determine whether an Item is public, owner-visible, members-only, hidden until discovered, secret until acquired, internal-only, or embargoed until a time or occurrence.

### Edition

An optional release container that associates one or more immutable Item Definition Versions with a distribution period, Season, campaign, event, or presentation theme. Edition does not replace Definition Version and does not own Inventory.

### Replacement

A versioned advisory relationship indicating that a Definition is superseded by another Definition for future acquisition or presentation. Replacement does not mutate existing ownership.

### Deprecation

A lifecycle state indicating that an Item remains resolvable but should not be selected for new content without explicit approval.

### Retirement

A lifecycle state that prevents ordinary new references or acquisitions according to policy. Existing versions remain readable.

### Quarantine

An emergency state that restricts serving, acquisition validation, or asset exposure because of security, legal, rights, safety, or severe semantic defects. Quarantine is visible in audit and consumer Events.

### Mechanical fingerprint

A deterministic hash over normalized semantics that affect Inventory or registered consumer behavior.

### Presentation fingerprint

A deterministic hash over normalized localizations and presentation references.

### Full content fingerprint

A deterministic hash covering the complete published manifest and registry versions.

### Erratum overlay

A narrowly scoped, audited correction that may replace unsafe or legally invalid presentation text or assets without changing mechanical semantics. It cannot alter type, properties, capabilities, stack behavior, uniqueness, binding, dependencies, or consumer outcomes.

### Item Instance

An Inventory-owned record representing one particular owned copy. Item Engine never creates or stores Item Instances.

### Item Stack

An Inventory-owned quantity of equivalent Item copies represented together under Definition compatibility rules.

### Catalog projection

A non-authoritative read model optimized for discovery. It may combine Item metadata with audience, localization, availability hints, or ownership overlays supplied by other services.

### Compatibility manifest

A normalized declaration of required consumer contracts and supported version ranges for one Item Definition Version.

### Publication sequence

A monotonic sequence within a catalog scope used for projector ordering and cache invalidation. It is not the Item Definition Version number.

### Content source revision

The optimistic-concurrency revision of editable draft source before publication.

---

## Lifecycle

### Item Definition lifecycle

```text
DRAFT
  |
  v
IN_REVIEW -----> REJECTED
  |
  v
APPROVED
  |
  +------> SCHEDULED
  |             |
  v             v
PUBLISHED <-----+
  |
  +------> DEPRECATED
  |             |
  |             v
  +----------> RETIRED
  |
  +----------> QUARANTINED
                   |
                   +----> PUBLISHED / DEPRECATED / RETIRED
                         through approved recovery
```

The aggregate Definition lifecycle reflects the state of its catalog identity. Individual versions have their own lifecycle.

### Draft version lifecycle

| State | Meaning |
|---|---|
| `DRAFT` | Editable source revision. Not available to runtime consumers. |
| `VALIDATING` | A validation job is running against a fixed source revision. |
| `INVALID` | Validation completed with blocking findings. |
| `VALID` | Validation completed successfully for the exact source revision and registry snapshot. |
| `IN_REVIEW` | Submitted for governance review. Editing creates a new source revision and invalidates approvals. |
| `APPROVED` | Required approvals exist for the exact fingerprint. |
| `SCHEDULED` | Approved publication is scheduled. |
| `PUBLISHED` | Immutable and available to permitted runtime consumers. |
| `SUPERSEDED` | A newer recommended version exists; this version remains valid and immutable. |
| `DEPRECATED` | Existing references resolve, but new references require explicit permission. |
| `RETIRED` | Ordinary new references or acquisition are blocked by policy. |
| `QUARANTINED` | Emergency restrictions apply. |

### Allowed transitions

| From | To | Preconditions |
|---|---|---|
| none | `DRAFT` | Stable key reserved; actor authorized. |
| `DRAFT` | `VALIDATING` | Source revision exists; no validation already active for same revision. |
| `VALIDATING` | `VALID` | No blocking findings; compiled fingerprint stored. |
| `VALIDATING` | `INVALID` | One or more blocking findings. |
| `INVALID` | `DRAFT` | Author creates a new source revision. |
| `VALID` | `IN_REVIEW` | Review package frozen to exact source and registry snapshot. |
| `IN_REVIEW` | `APPROVED` | Required approvals complete; no source or registry invalidation. |
| `IN_REVIEW` | `REJECTED` | Reviewer supplies reason. |
| `REJECTED` | `DRAFT` | Author creates new revision. |
| `APPROVED` | `SCHEDULED` | Valid future server time and release policy. |
| `APPROVED` | `PUBLISHED` | Publication transaction succeeds. |
| `SCHEDULED` | `PUBLISHED` | Due time reached; validation freshness remains acceptable. |
| `SCHEDULED` | `APPROVED` | Schedule cancelled before commit. |
| `PUBLISHED` | `SUPERSEDED` | A newer recommended published version is selected. |
| `PUBLISHED` | `DEPRECATED` | Authorized deprecation with reason. |
| `SUPERSEDED` | `DEPRECATED` | Authorized deprecation. |
| `PUBLISHED` / `SUPERSEDED` / `DEPRECATED` | `RETIRED` | Retirement impact check complete. |
| any published state | `QUARANTINED` | Emergency authority and incident reason. |
| `QUARANTINED` | prior safe state | Recovery review confirms safety. |

### Immutability boundary

Publication freezes:

- type and schema versions;
- mechanical properties;
- Inventory semantics;
- capabilities and payloads;
- compatibility requirements;
- tags and collection declarations that are used mechanically;
- disclosure semantics;
- dependency snapshot;
- normalized manifest;
- fingerprints.

Any semantic change requires a new Item Definition Version.

### Presentation-only change policy

Presentation changes SHOULD normally create a new version or a versioned localization bundle. An erratum overlay MAY be used only for:

- removing unsafe or illegal text;
- correcting a broken or rights-revoked asset;
- fixing a severe accessibility issue;
- correcting a factual typo that cannot affect interpretation or rules.

An erratum overlay MUST:

- preserve the mechanical fingerprint;
- have an immutable overlay revision;
- be authorized under emergency or editorial policy;
- publish `item.presentation.erratum.applied.v1`;
- remain fully auditable;
- never change stable identifiers or capability payloads.

### Retirement behavior

Retirement:

- does not delete the Definition or version;
- does not remove owned Items;
- does not automatically replace Inventory state;
- prevents new authoring references unless explicitly allowed;
- may reject new grant validation according to fulfillment policy;
- may still permit replay of a historically committed Reward Grant if the immutable reference was valid when committed;
- may expose a suggested replacement;
- must publish an impact summary.

### Quarantine behavior

Quarantine may independently restrict:

- catalog discovery;
- exact public lookup;
- media delivery;
- new Reward validation;
- new Inventory acquisition;
- Item interaction execution;
- marketplace visibility;
- profile presentation.

The quarantine Event must state which restrictions apply. Inventory Engine decides how to surface or temporarily disable owned copies without deleting them.

### Stable-key lifecycle

A stable key moves through:

```text
RESERVED -> ACTIVE -> RETIRED
```

It never returns to the unreserved pool and is never reassigned to a different semantic Item.

### Schema lifecycle

Property and capability schemas use:

```text
DRAFT -> REVIEWED -> ACTIVE -> DEPRECATED -> RETIRED
```

Published Item versions continue to reference retired schema versions. A schema cannot be physically deleted while referenced.

### Edition lifecycle

```text
DRAFT -> APPROVED -> SCHEDULED -> ACTIVE -> ENDED -> ARCHIVED
```

An Edition controls discovery or distribution context but does not mutate the Item versions it contains.

### Scheduled publication

Scheduled publication uses trusted server time. The scheduler must:

1. claim due work idempotently;
2. revalidate approval freshness and dependency status;
3. commit publication and outbox atomically;
4. retry transient failures;
5. quarantine permanent failures for operator action;
6. never publish twice.

### Deletion policy

- Drafts with no published descendants MAY be logically deleted under retention policy.
- Published Definitions, versions, manifests, fingerprints, lifecycle history, and audit records MUST NOT be physically deleted while referenced by any retained platform record.
- Legal or security removal uses quarantine, redaction overlays, asset revocation, and retention policy rather than identity reuse.

---
## Aggregate

### Aggregate root

`ItemDefinition` is the aggregate root for stable Item identity and version governance.

```text
ItemDefinition
├── DefinitionIdentity
├── StableKeyReservation
├── DraftVersions[]
│   ├── SourceRevision[]
│   ├── ValidationRun[]
│   ├── ReviewPackage
│   └── Approval[]
├── PublishedVersions[]
│   ├── NormalizedManifest
│   ├── InventorySemantics
│   ├── PropertyValues[]
│   ├── Capabilities[]
│   ├── Classification[]
│   ├── LocalizationBundleRef[]
│   ├── AssetRef[]
│   ├── DependencySnapshot[]
│   ├── CompatibilityManifest
│   └── Fingerprints
├── LifecycleHistory[]
├── ReplacementRelations[]
├── ErratumOverlay[]
└── AuditTrail[]
```

### Aggregate identity

The aggregate is identified by `item_definition_id`. The stable key is unique within `catalog_scope` and permanently reserved.

### Aggregate invariants

#### Identity invariants

1. `item_definition_id` is immutable.
2. `catalog_scope` is immutable after first publication.
3. `item_definition_key` is immutable after reservation and never reused.
4. Display names and localizations are never identity fields.
5. Version sequence is monotonic within one Definition.

#### Draft invariants

1. Every mutation specifies `expected_source_revision`.
2. A successful mutation increments the source revision exactly once.
3. Validation output applies only to the exact source revision and registry snapshot.
4. Editing after validation invalidates review and approval state.
5. Only one active review package may exist per draft version.

#### Publication invariants

1. Publication requires a valid compiled manifest.
2. Required approvals must reference the exact full fingerprint.
3. All required dependencies must be resolvable and publication-compatible.
4. Published version number and version ID are unique.
5. Publication, lifecycle history, dependency snapshot, audit, and outbox are one transaction.
6. A published row is immutable at the database and service layers.
7. Only one version may be marked `recommended` per audience and release channel unless an explicit routing policy exists.

#### Semantic invariants

1. Stack mode and instance requirement are compatible.
2. `NON_STACKABLE` requires Inventory instances.
3. `STACKABLE` requires deterministic merge compatibility.
4. `VIRTUAL_UNIQUE` requires uniqueness scope and duplicate policy.
5. Maximum stack quantity is a positive integer when stackable.
6. Transferability cannot exceed the supported binding policy.
7. A capability type must exist in the registry and name a consumer owner.
8. Capability payload must validate against its exact schema version.
9. Unknown properties are prohibited.
10. Authoritative numeric properties use declared units and precision.
11. Mechanical dependencies cannot form prohibited cycles.
12. Hidden disclosure cannot reference publicly exposed assets without protected delivery policy.
13. Item Type and capability combinations must satisfy registry rules.
14. Replacement relations cannot form cycles.
15. A Definition cannot replace itself.

#### Ownership-boundary invariants

1. No Character ID is required to define or publish an Item.
2. No Inventory quantity or instance ID is stored in the aggregate.
3. No Reward Grant status is stored in the aggregate.
4. Consumer state is not updated inside the publication transaction.
5. Migration metadata does not imply migration execution.

### Aggregate commands

The aggregate accepts:

- `ReserveItemDefinitionKey`;
- `CreateItemDefinition`;
- `CreateItemDefinitionDraftVersion`;
- `UpdateItemDefinitionDraft`;
- `AttachItemAssetReference`;
- `SetItemLocalizationBundle`;
- `ValidateItemDefinitionDraft`;
- `SubmitItemDefinitionForReview`;
- `ApproveItemDefinitionVersion`;
- `RejectItemDefinitionVersion`;
- `ScheduleItemDefinitionPublication`;
- `CancelScheduledItemPublication`;
- `PublishItemDefinitionVersion`;
- `MarkItemVersionRecommended`;
- `SupersedeItemDefinitionVersion`;
- `DeprecateItemDefinitionVersion`;
- `RetireItemDefinitionVersion`;
- `QuarantineItemDefinitionVersion`;
- `RecoverItemDefinitionVersion`;
- `DeclareItemReplacement`;
- `ApplyItemPresentationErratum`;
- `RegisterItemType`;
- `RegisterItemPropertySchema`;
- `RegisterItemCapabilityType`.

Registry commands operate on separate governance aggregates but are documented here because they form the Item Engine boundary.

### Transaction boundary

One command may atomically mutate only one Item Definition aggregate plus engine-owned audit, inbox, outbox, and idempotency records. Cross-Definition validation is performed against immutable snapshots. Bulk publication is a job coordinating independent aggregate commands; it is not one unbounded database transaction.

### Aggregate concurrency

Draft mutation uses optimistic concurrency:

```text
expected_source_revision == current_source_revision
```

Publication uses both:

- expected source revision;
- expected compiled full fingerprint;
- expected review package ID;
- idempotency key.

Conflicts return `409 ITEM_DRAFT_REVISION_CONFLICT` with the current revision and no partial mutation.

### Cross-aggregate references

Definitions may reference other Items only through immutable version IDs or stable keys plus an explicit resolution mode. Publication resolves and snapshots every dependency. Mutable “latest” references are prohibited in mechanical semantics.

Allowed resolution modes:

- `PINNED_VERSION`: exact immutable version;
- `RECOMMENDED_AT_PUBLICATION`: resolved once and pinned during publication;
- `FAMILY_MEMBERSHIP`: references a stable variant family with registry-defined semantics;
- `TAG_QUERY_PRESENTATION_ONLY`: allowed only for non-authoritative discovery content.

### Aggregate snapshots

Snapshotting is optional for performance because Definition aggregates are low-write. If event-sourced internally, snapshots must include sequence, fingerprint, and registry snapshot IDs. The reference implementation may use state tables plus immutable history rather than full event sourcing.

---

## State Model

### Item Definition state

```json
{
  "itemDefinitionId": "uuid",
  "catalogScope": "platform",
  "itemDefinitionKey": "cosmetic.training_sash",
  "aggregateStatus": "PUBLISHED",
  "latestVersionNumber": 3,
  "recommendedVersionId": "uuid",
  "sourceRevision": 19,
  "createdAt": "2026-07-18T17:15:00Z",
  "updatedAt": "2026-07-18T17:44:00Z"
}
```

### Published version state

```json
{
  "itemDefinitionVersionId": "uuid",
  "itemDefinitionId": "uuid",
  "versionNumber": 3,
  "versionStatus": "PUBLISHED",
  "itemType": {
    "typeKey": "COSMETIC",
    "schemaVersion": 2
  },
  "inventorySemantics": {
    "stackMode": "VIRTUAL_UNIQUE",
    "instanceRequired": false,
    "uniquenessScope": "CHARACTER",
    "duplicateAcquisitionPolicy": "ACCEPT_NO_OP",
    "bindingPolicy": "CHARACTER_BOUND_ON_ACQUIRE",
    "transferability": "NOT_TRANSFERABLE",
    "destructionPolicy": "OWNER_DISALLOWED"
  },
  "properties": {
    "cosmetic.slot": "WAIST",
    "cosmetic.layer": 20
  },
  "capabilities": [],
  "tags": ["cosmetic", "school_identity"],
  "rarityKey": "UNCOMMON",
  "disclosurePolicy": "PUBLIC",
  "compatibility": {
    "inventoryManifest": "inventory.item.v2",
    "characterCosmetic": "character.cosmetic.v1"
  },
  "mechanicalFingerprint": "sha256:...",
  "presentationFingerprint": "sha256:...",
  "fullFingerprint": "sha256:...",
  "publishedAt": "2026-07-18T17:44:00Z"
}
```

### Draft source state

A draft stores normalized source separate from compiled output:

```json
{
  "sourceRevision": 19,
  "itemTypeKey": "COSMETIC",
  "itemTypeSchemaVersion": 2,
  "inventorySemanticsSource": {},
  "propertySource": {},
  "capabilitySource": [],
  "classificationSource": {},
  "localizationSource": {},
  "assetSource": [],
  "disclosureSource": {},
  "replacementSource": null,
  "authorNotes": "Editorial notes not included in runtime manifest"
}
```

### Mechanical state

Mechanical state includes everything that may affect ownership or consumer behavior:

- Item Type and schema version;
- stack mode;
- maximum stack quantity;
- instance requirement;
- uniqueness scope;
- duplicate acquisition policy;
- binding and transfer declarations;
- destruction policy;
- expiration capability;
- durability capability;
- authoritative properties;
- capability types and payloads;
- compatibility requirements;
- mechanically significant tags or collection references;
- dependency version IDs.

Mechanical state is included in `mechanical_fingerprint`.

### Presentation state

Presentation state includes:

- localized name;
- short and long description;
- lore;
- icon and artwork references;
- 3D model or animation references;
- accessibility label and alt text;
- rarity presentation;
- sort and display hints;
- spoiler-safe placeholder;
- attribution and rights notices.

Presentation state is included in `presentation_fingerprint`.

### Inventory semantics model

```json
{
  "stackMode": "STACKABLE",
  "maxStackQuantity": 999,
  "instanceRequired": false,
  "mergeKeyFields": [
    "itemDefinitionVersionId",
    "bindingScope",
    "expirationBucket"
  ],
  "uniquenessScope": "NONE",
  "duplicateAcquisitionPolicy": "INCREMENT_QUANTITY",
  "bindingPolicy": "UNBOUND",
  "transferability": "TRANSFERABLE_IF_UNBOUND",
  "destructionPolicy": "OWNER_ALLOWED",
  "expirationCapability": {
    "mode": "NONE"
  }
}
```

`mergeKeyFields` is a registered list, not an author-defined expression. Inventory Engine validates support.

### Item Type registry state

```json
{
  "itemTypeKey": "CONSUMABLE",
  "registryVersion": 4,
  "status": "ACTIVE",
  "allowedPropertySchemas": [
    "item.core.v1",
    "item.consumable.v2"
  ],
  "allowedCapabilityTypes": [
    "inventory.consume.v2",
    "reward.bundle.reference.v1"
  ],
  "requiredCapabilities": ["inventory.consume.v2"],
  "forbiddenCapabilities": ["character.cosmetic.v1"],
  "defaultDisclosurePolicy": "PUBLIC"
}
```

### Capability state

```json
{
  "capabilityId": "uuid",
  "capabilityType": "inventory.consume.v2",
  "schemaVersion": 2,
  "consumerOwner": "inventory-engine",
  "payload": {
    "quantityPerUse": 1,
    "useMode": "OWNER_COMMAND",
    "outcomeContract": {
      "type": "REWARD_REQUEST_REFERENCE",
      "rewardDefinitionVersionId": "uuid"
    }
  },
  "disclosure": "OWNER_AFTER_ACQUISITION"
}
```

This declaration does not execute the Reward. Inventory Engine coordinates use according to the registered contract and remains responsible for atomic consumption semantics.

### Disclosure state

Supported base policies:

- `PUBLIC`;
- `AUTHENTICATED`;
- `MODULE_MEMBERS`;
- `OWNER_AFTER_ACQUISITION`;
- `HIDDEN_UNTIL_DISCOVERED`;
- `SECRET_UNTIL_ACQUIRED`;
- `EMBARGOED`;
- `INTERNAL_ONLY`;
- `QUARANTINED`.

Disclosure may be combined with scope and time constraints, but policy evaluation remains bounded and server-side.

### Localization state

Each locale entry stores:

- locale;
- localization bundle version;
- name;
- short description;
- long description;
- lore;
- accessibility label;
- asset-caption references;
- translator attribution if required;
- review status;
- fallback locale;
- presentation fingerprint contribution.

Mechanical values MUST NOT be embedded only in localized prose.

### Asset state

Each reference stores:

- immutable asset version ID;
- role such as `ICON`, `CARD_ART`, `MODEL`, `AUDIO`, `PLACEHOLDER`;
- content hash;
- media type;
- moderation status;
- rights status and expiry if applicable;
- audience policy;
- fallback asset reference;
- dimensions or technical metadata needed for clients.

### Replacement state

```json
{
  "sourceItemDefinitionId": "uuid",
  "targetItemDefinitionId": "uuid",
  "relationship": "SUCCESSOR",
  "effectiveFrom": "2026-09-01T00:00:00Z",
  "newAcquisitionPolicy": "PREFER_TARGET",
  "ownedCopyPolicy": "NO_AUTOMATIC_CHANGE",
  "reasonCode": "CONTENT_REFRESH"
}
```

### Edition state

An Item Edition contains:

- `edition_id` and stable key;
- immutable membership revision;
- activation window;
- Season or campaign references;
- discovery policy;
- ordering and presentation metadata;
- explicit Item Definition Version IDs.

Edition membership cannot use mutable “latest” at runtime.

### State ownership matrix

| State | Owner | Item Engine access |
|---|---|---|
| Item Definition | Item Engine | Read/write |
| Item Definition Version | Item Engine | Read/write draft; immutable after publication |
| Item Instance | Inventory Engine | Reference only |
| Item Stack | Inventory Engine | Reference only |
| Equipped Item | Inventory or Equipment owner | Read projection only if needed |
| Character profile cosmetic | Character Engine | Definition metadata only |
| Reward Grant | Reward Engine | No mutation |
| Item Reward fulfillment | Inventory Engine | Definition lookup only |
| Purchase/listing | Commerce owner | Catalog reference only |
| Collection completion | Collection owner | Membership declaration only |
| Season availability | Season Engine | Association metadata only |

### State machine validation

Every command validates current lifecycle state under a transaction lock or compare-and-swap revision. Invalid transitions return a stable machine-readable error and produce no state or outbox change.

### State retention

Published versions and fingerprints are retained for at least as long as any Inventory, Reward, Quest, Achievement, audit, or legal record may reference them. Retention policy must therefore be coordinated at platform level and default to indefinite logical retention.

---

## Events

### Event envelope

Item Events use the exact camelCase canonical envelope from
`002a-platform-contract-standard`. Definition lifecycle Events use the exact
Item Definition Version ID as `partitionKey` and subject, and include the
resulting aggregate version. `producer`, `schemaVersion`, `realmKey`, lineage,
replay, and metadata contract fields are mandatory.

### Consumed Events

Item Engine consumes only Events needed for local projections or lifecycle integration. It MUST NOT consume business Events to create ownership.

| Event | Purpose |
|---|---|
| `asset.version.approved.v1` | Update asset registry projection. |
| `asset.version.quarantined.v1` | Detect affected published Items and apply policy. |
| `asset.version.retired.v1` | Validate fallback or replacement requirements. |
| `schema.version.activated.v1` | Update local schema projection and validation cache. |
| `schema.version.deprecated.v1` | Flag drafts and published dependencies. |
| `season.edition.activated.v1` | Activate edition discovery projection if configured. |
| `season.edition.closed.v1` | End edition discovery without retiring Item versions. |
| `module.scope.retired.v1` | Restrict authoring and discovery for affected scope. |
| `character.created.v1`, `character.activated.v1`, `character.suspended.v1`, `character.reactivated.v1`, `character.closed.v1`, `character.restored.v1`, `character.anonymized.v1` | Optional audience projection inputs; never change Item Definitions. |
| `content.rights.revoked.v1` | Trigger impact analysis or emergency quarantine workflow. |

Consumed Events are processed through an inbox with idempotency by canonical
`eventId` and handler version.

### Produced Events

#### Definition identity

- `item.definition.created.v1`;
- `item.definition.key.reserved.v1`.

#### Draft and validation

- `item.definition.draft.created.v1`;
- `item.definition.draft.updated.v1`;
- `item.definition.validation.completed.v1`;
- `item.definition.review.submitted.v1`;
- `item.definition.review.approved.v1`;
- `item.definition.review.rejected.v1`.

#### Publication lifecycle

- `item.definition.publication.scheduled.v1`;
- `item.definition.publication.cancelled.v1`;
- `item.definition.published.v1`;
- `item.definition.version.recommended.v1`;
- `item.definition.version.superseded.v1`;
- `item.definition.deprecated.v1`;
- `item.definition.retired.v1`;
- `item.definition.quarantined.v1`;
- `item.definition.recovered.v1`.

#### Replacement and errata

- `item.definition.replacement.declared.v1`;
- `item.presentation.erratum.applied.v1`.

#### Registry lifecycle

- `item.type.registered.v1`;
- `item.property.schema.activated.v1`;
- `item.capability.type.activated.v1`;
- `item.registry.entry.deprecated.v1`.

#### Operational

- `item.catalog.projection.rebuilt.v1`;
- `item.catalog.compatibility.violation.detected.v1`;
- `item.catalog.dependency.broken.v1`;
- `item.catalog.reconciliation.completed.v1`.

### Event ordering

Events include:

- aggregate sequence for one Definition;
- publication sequence for catalog projectors;
- immutable version number where applicable.

Consumers MUST order lifecycle Events by aggregate sequence for the same Definition. Global ordering across unrelated Definitions is not guaranteed.

### Event idempotency

The outbox row ID equals or maps one-to-one to canonical `eventId`. Dispatch
retries preserve the same Event ID and payload. Consumers deduplicate by Event
ID and handler version.

### Event minimization

Events contain identifiers, lifecycle facts, fingerprints, and bounded consumer manifests. They MUST NOT contain:

- full unreleased localization bundles;
- hidden lore unless audience permits;
- embedded binary assets;
- personal author notes;
- secrets or credentials;
- Inventory ownership data;
- arbitrary source drafts.

### Event compatibility

Breaking payload changes require a new Event version. Producers may dual-publish during migration. Consumers declare supported versions in the platform contract registry.

---

## Event Contracts

### `item.definition.created.v1`

```json
{
  "itemDefinitionId": "uuid",
  "catalogScope": "platform",
  "itemDefinitionKey": "cosmetic.training_sash",
  "createdBy": "uuid",
  "createdAt": "2026-07-18T17:15:00Z"
}
```

### `item.definition.validation.completed.v1`

```json
{
  "itemDefinitionId": "uuid",
  "draftVersionId": "uuid",
  "sourceRevision": 19,
  "validationRunId": "uuid",
  "registrySnapshotId": "uuid",
  "status": "VALID",
  "blockingFindingCount": 0,
  "warningCount": 2,
  "mechanicalFingerprint": "sha256:...",
  "presentationFingerprint": "sha256:...",
  "fullFingerprint": "sha256:...",
  "completedAt": "2026-07-18T17:35:00Z"
}
```

### `item.definition.published.v1`

```json
{
  "itemDefinitionId": "uuid",
  "itemDefinitionKey": "cosmetic.training_sash",
  "catalogScope": "platform",
  "itemDefinitionVersionId": "uuid",
  "versionNumber": 3,
  "publicationSequence": 8821,
  "itemType": {
    "typeKey": "COSMETIC",
    "schemaVersion": 2
  },
  "inventoryManifest": {
    "stackMode": "VIRTUAL_UNIQUE",
    "instanceRequired": false,
    "uniquenessScope": "CHARACTER",
    "duplicateAcquisitionPolicy": "ACCEPT_NO_OP",
    "bindingPolicy": "CHARACTER_BOUND_ON_ACQUIRE",
    "transferability": "NOT_TRANSFERABLE"
  },
  "capabilityTypes": ["character.cosmetic.v1"],
  "mechanicalFingerprint": "sha256:...",
  "presentationFingerprint": "sha256:...",
  "fullFingerprint": "sha256:...",
  "recommended": true,
  "publishedAt": "2026-07-18T17:44:00Z"
}
```

The Event contains a bounded Inventory manifest sufficient for cache invalidation and compatibility checks. Consumers requiring the complete manifest retrieve it by immutable version ID.

### `item.definition.version.recommended.v1`

```json
{
  "itemDefinitionId": "uuid",
  "previousRecommendedVersionId": "uuid",
  "recommendedVersionId": "uuid",
  "audienceKey": "DEFAULT",
  "releaseChannel": "PRODUCTION",
  "publicationSequence": 8822,
  "effectiveAt": "2026-07-18T17:45:00Z"
}
```

Changing the recommended pointer does not alter existing references pinned to older versions.

### `item.definition.deprecated.v1`

```json
{
  "itemDefinitionId": "uuid",
  "itemDefinitionVersionId": "uuid",
  "reasonCode": "SUPERSEDED_CONTENT",
  "newReferencePolicy": "REQUIRE_EXPLICIT_OVERRIDE",
  "suggestedReplacementItemDefinitionId": "uuid",
  "effectiveAt": "2026-08-01T00:00:00Z"
}
```

### `item.definition.retired.v1`

```json
{
  "itemDefinitionId": "uuid",
  "itemDefinitionVersionId": "uuid",
  "reasonCode": "RIGHTS_EXPIRED",
  "newAcquisitionPolicy": "BLOCK",
  "historicalFulfillmentPolicy": "ALLOW_IF_COMMITTED_BEFORE_RETIREMENT",
  "ownedCopyPolicy": "NO_AUTOMATIC_CHANGE",
  "publicPresentationPolicy": "USE_SAFE_PLACEHOLDER",
  "effectiveAt": "2026-09-01T00:00:00Z"
}
```

### `item.definition.quarantined.v1`

```json
{
  "itemDefinitionId": "uuid",
  "itemDefinitionVersionId": "uuid",
  "incidentId": "uuid",
  "reasonCode": "SECURITY_ASSET_COMPROMISE",
  "restrictions": [
    "HIDE_FROM_DISCOVERY",
    "BLOCK_NEW_ACQUISITION",
    "BLOCK_INTERACTION",
    "REVOKE_MEDIA_DELIVERY"
  ],
  "safePlaceholderVersionId": "uuid",
  "quarantinedAt": "2026-07-18T18:00:00Z"
}
```

### `item.definition.replacement.declared.v1`

```json
{
  "sourceItemDefinitionId": "uuid",
  "targetItemDefinitionId": "uuid",
  "relationship": "SUCCESSOR",
  "newReferencePolicy": "PREFER_TARGET",
  "ownedCopyPolicy": "NO_AUTOMATIC_CHANGE",
  "effectiveAt": "2026-09-01T00:00:00Z",
  "reasonCode": "CONTENT_REFRESH"
}
```

### `item.presentation.erratum.applied.v1`

```json
{
  "itemDefinitionVersionId": "uuid",
  "erratumOverlayId": "uuid",
  "overlayRevision": 1,
  "changedPresentationFields": [
    "localizations.en-US.longDescription",
    "assets.CARD_ART"
  ],
  "mechanicalFingerprintUnchanged": true,
  "newPresentationFingerprint": "sha256:...",
  "reasonCode": "RIGHTS_REMEDIATION",
  "appliedAt": "2026-07-18T18:10:00Z"
}
```

### `item.catalog.compatibility.violation.detected.v1`

```json
{
  "itemDefinitionVersionId": "uuid",
  "consumerOwner": "inventory-engine",
  "requiredContract": "inventory.item.v2",
  "observedConsumerVersion": "1.7.0",
  "severity": "BLOCKING_FOR_NEW_ACQUISITION",
  "detectedAt": "2026-07-18T18:20:00Z"
}
```

### Item exact manifest contract

The authoritative internal manifest returned by immutable version lookup follows this shape:

```json
{
  "schema": "platform.item_manifest.v1",
  "itemDefinitionId": "uuid",
  "itemDefinitionVersionId": "uuid",
  "itemDefinitionKey": "consumable.lesson_token",
  "catalogScope": "platform",
  "versionNumber": 2,
  "status": "PUBLISHED",
  "itemType": {
    "key": "CONSUMABLE",
    "registryVersion": 4
  },
  "inventorySemantics": {
    "stackMode": "STACKABLE",
    "maxStackQuantity": 99,
    "instanceRequired": false,
    "uniquenessScope": "NONE",
    "duplicateAcquisitionPolicy": "INCREMENT_QUANTITY",
    "bindingPolicy": "CHARACTER_BOUND_ON_ACQUIRE",
    "transferability": "NOT_TRANSFERABLE",
    "destructionPolicy": "OWNER_ALLOWED",
    "mergeCompatibility": {
      "contract": "inventory.merge.v1",
      "fields": ["itemDefinitionVersionId", "bindingScope"]
    }
  },
  "properties": {
    "core.weight_milligrams": 0
  },
  "capabilities": [
    {
      "type": "inventory.consume.v2",
      "schemaVersion": 2,
      "consumerOwner": "inventory-engine",
      "payload": {
        "quantityPerUse": 1,
        "outcomeContract": {
          "type": "REWARD_REQUEST_REFERENCE",
          "rewardDefinitionVersionId": "uuid"
        }
      }
    }
  ],
  "classification": {
    "categoryKey": "CONSUMABLE",
    "rarityKey": "COMMON",
    "tags": ["lesson", "token"]
  },
  "dependencies": [
    {
      "type": "REWARD_DEFINITION_VERSION",
      "id": "uuid",
      "required": true
    }
  ],
  "compatibility": {
    "requiredConsumerContracts": [
      {
        "consumer": "inventory-engine",
        "contract": "inventory.item.v2",
        "minimumVersion": 2
      }
    ]
  },
  "disclosure": {
    "policy": "OWNER_AFTER_ACQUISITION"
  },
  "fingerprints": {
    "mechanical": "sha256:...",
    "presentation": "sha256:...",
    "full": "sha256:..."
  },
  "publishedAt": "2026-07-18T17:44:00Z"
}
```

### Inventory validation contract

Inventory Engine may call:

```text
ValidateItemAcquisitionReference(
  item_definition_version_id,
  requested_quantity,
  acquisition_context,
  committed_at
)
```

The response contains catalog facts only:

```json
{
  "valid": true,
  "itemDefinitionVersionId": "uuid",
  "status": "PUBLISHED",
  "acquisitionPolicy": "ALLOW",
  "inventoryManifestFingerprint": "sha256:...",
  "inventorySemantics": {},
  "warnings": []
}
```

Item Engine does not inspect Character ownership and cannot determine whether a uniqueness constraint is already satisfied. Inventory Engine applies that decision.

### Error contract

All command and internal APIs use:

```json
{
  "error": {
    "code": "ITEM_DEFINITION_VERSION_RETIRED",
    "message": "The referenced Item Definition Version is retired for new acquisition.",
    "retryable": false,
    "correlationId": "uuid",
    "details": {
      "itemDefinitionVersionId": "uuid",
      "historicalFulfillmentPolicy": "ALLOW_IF_COMMITTED_BEFORE_RETIREMENT"
    }
  }
}
```

Stable error codes include:

- `ITEM_DEFINITION_NOT_FOUND`;
- `ITEM_DEFINITION_VERSION_NOT_FOUND`;
- `ITEM_DEFINITION_VERSION_NOT_PUBLISHED`;
- `ITEM_DEFINITION_VERSION_DEPRECATED`;
- `ITEM_DEFINITION_VERSION_RETIRED`;
- `ITEM_DEFINITION_VERSION_QUARANTINED`;
- `ITEM_STABLE_KEY_CONFLICT`;
- `ITEM_DRAFT_REVISION_CONFLICT`;
- `ITEM_DRAFT_INVALID`;
- `ITEM_REVIEW_STALE`;
- `ITEM_APPROVALS_INCOMPLETE`;
- `ITEM_SCHEMA_UNKNOWN`;
- `ITEM_PROPERTY_INVALID`;
- `ITEM_CAPABILITY_UNKNOWN`;
- `ITEM_CAPABILITY_INVALID`;
- `ITEM_DEPENDENCY_UNRESOLVED`;
- `ITEM_DEPENDENCY_CYCLE`;
- `ITEM_CONSUMER_INCOMPATIBLE`;
- `ITEM_ASSET_UNAPPROVED`;
- `ITEM_LOCALIZATION_INCOMPLETE`;
- `ITEM_DISCLOSURE_FORBIDDEN`;
- `ITEM_TRANSITION_INVALID`;
- `ITEM_PUBLICATION_ALREADY_COMMITTED`;
- `ITEM_IDEMPOTENCY_CONFLICT`.

---
## Read Models

Read models are projections optimized for a purpose. They MUST NOT be used as write models or as the sole authority for fulfillment.

### RM-1. Authoritative Item Version Manifest

Purpose: exact internal lookup by immutable version ID.

Fields:

- Definition and version IDs;
- stable key and catalog scope;
- lifecycle and acquisition policy;
- normalized type, properties, Inventory semantics, capabilities, dependencies, compatibility, disclosure, and fingerprints;
- publication and erratum metadata.

Consistency: read-after-write after publication commit in the authoritative region.

Consumers: Inventory, Reward validation, Quest authoring, Talent authoring, Season, Collection, support tooling.

### RM-2. Recommended Item Version

Purpose: resolve a stable key to the recommended version for a declared audience and release channel during authoring.

Fields:

- stable key;
- recommended version ID;
- version number;
- lifecycle;
- effective interval;
- release channel;
- compatibility summary;
- publication sequence.

Runtime mechanical references SHOULD pin the returned version rather than persist a moving recommended pointer.

### RM-3. Public Catalog Card

Purpose: display discoverable Items.

Fields:

- stable public Item ID;
- localized name and short description;
- icon and card artwork URLs or references;
- rarity presentation;
- public tags and category;
- disclosure-safe capability hints;
- Edition or Season badges;
- availability hint clearly labeled non-authoritative;
- version-independent public route where permitted.

The card excludes internal capability payloads, dependencies, hidden tags, author notes, and mechanical fields not approved for disclosure.

### RM-4. Owner Catalog Card

Purpose: display an Item to a Character who owns or has discovered it.

It may include:

- full localized description and lore;
- owner-visible usage instructions;
- compatibility details;
- binding and transfer explanation;
- Inventory-supplied ownership overlay;
- equipment slot hints;
- expiration explanation;
- collection membership;
- accessibility details.

Ownership overlay is joined at an API composition layer or client. Item Engine does not persist it.

### RM-5. Internal Catalog Summary

Purpose: low-latency service-to-service lookup.

Fields:

- version ID;
- stable key;
- type;
- lifecycle;
- Inventory manifest fingerprint;
- acquisition policy;
- required consumer contracts;
- mechanical fingerprint;
- publication sequence.

### RM-6. Authoring Draft View

Purpose: complete editable source and validation state.

Fields:

- source revision;
- source JSON;
- normalized preview;
- validation findings grouped by severity and path;
- dependency graph;
- unresolved references;
- localization coverage;
- asset status;
- risk classification;
- review and approval state;
- diff from selected prior version;
- simulation results.

### RM-7. Review Package

Purpose: immutable review evidence.

Fields:

- exact source revision;
- normalized manifest;
- fingerprints;
- mechanical and presentation diff;
- dependency diff;
- Inventory semantics diff;
- capability diff;
- consumer compatibility report;
- asset and rights report;
- localization report;
- risk level;
- required approver roles;
- reviewer decisions.

### RM-8. Item Lifecycle Timeline

Purpose: support and audit.

Fields:

- Definition and version identity;
- every lifecycle transition;
- actor and role;
- reason code;
- correlation and command IDs;
- review package;
- timestamps;
- publication sequence;
- incident or replacement references.

### RM-9. Dependency Impact View

Purpose: determine affected content before deprecation, retirement, quarantine, schema change, or asset revocation.

Includes inbound and outbound references grouped by:

- Reward Definition versions;
- Quest Definition versions;
- Achievement definitions;
- Talent definitions;
- Season Editions;
- Collections;
- Item Definitions;
- asset versions;
- schema versions;
- consumer contracts.

The view may include Inventory aggregate counts supplied by an asynchronous aggregate-only projection, but never Character-level ownership unless the caller is authorized for a specific investigation.

### RM-10. Catalog Search Document

Indexed fields:

- Definition ID and version ID;
- stable key;
- locale-specific normalized text;
- public tags and category;
- rarity;
- Item Type;
- Edition and Season references;
- disclosure policy;
- lifecycle;
- publication time;
- scope;
- sort rank;
- projection watermark.

Hidden fields must be excluded, not merely filtered client-side.

### RM-11. Consumer Compatibility Matrix

Purpose: publication gating and operations.

Rows contain:

- Item version;
- required consumer owner;
- required contract and minimum version;
- observed deployed or registered compatibility;
- status `COMPATIBLE`, `WARNING`, `BLOCKED`, or `UNKNOWN`;
- last checked time;
- evidence source.

### RM-12. Registry Documentation View

Purpose: SDK and authoring-tool generation.

Includes active Item Types, property schemas, capability schemas, enum registries, units, examples, compatibility rules, and deprecation notices.

### RM-13. Edition Catalog View

Purpose: list immutable Item versions associated with an Edition, including ordering, disclosure, activation interval, and presentation metadata.

### RM-14. Erratum Overlay View

Purpose: show effective presentation and original immutable presentation with overlay history to authorized users.

### RM-15. Operations Health View

Includes:

- unpublished due schedules;
- outbox lag;
- projector checkpoints;
- search lag;
- cache invalidation lag;
- broken dependencies;
- quarantined versions;
- stale reviews;
- incompatible consumers;
- failed reconciliation jobs.

### Pagination

List endpoints use opaque cursor pagination. Offset pagination MAY be used only for bounded administrative lists. Cursors encode stable sort fields and projection watermark and must be signed or opaque.

### Freshness metadata

Every projection response includes, where relevant:

- `projectionVersion`;
- `publicationSequence` or checkpoint;
- `generatedAt`;
- `sourceUpdatedAt`;
- `isStale`;
- `stalenessReason`.

### Localization fallback

The server returns:

- requested locale;
- resolved locale;
- fallback reason;
- whether any fields are placeholder-safe.

A missing translation must never reveal hidden default-locale content to an unauthorized audience.

### Cache keys

Recommended patterns:

```text
item:manifest:{item_definition_version_id}:{full_fingerprint}
item:card:{audience_class}:{locale}:{item_definition_version_id}:{presentation_fingerprint}:{overlay_revision}
item:recommended:{scope}:{stable_key}:{audience}:{channel}:{publication_sequence}
item:registry:{registry_snapshot_id}
```

### Negative caching

Not-found results may be cached briefly. Draft, hidden, embargoed, and unauthorized results MUST use indistinguishable public error behavior to prevent enumeration. Authorization-sensitive negative caches must include audience class and scope.

---

## Write Models

All mutations are commands. Direct external database mutation is prohibited.

### Common command envelope

```json
{
  "commandId": "uuid",
  "idempotencyKey": "string",
  "commandType": "PublishItemDefinitionVersion",
  "issuedAt": "2026-07-18T17:40:00Z",
  "actor": {
    "type": "USER",
    "id": "uuid",
    "roles": ["ITEM_PUBLISHER"]
  },
  "correlationId": "uuid",
  "causationId": "uuid",
  "catalogScope": "platform",
  "expectedRevision": 19,
  "payload": {}
}
```

### Idempotency rules

1. `command_id` is globally unique.
2. API clients provide an idempotency key for every mutating request.
3. The server stores a request fingerprint and terminal response.
4. Reuse with the same fingerprint returns the original response.
5. Reuse with different content returns `409 ITEM_IDEMPOTENCY_CONFLICT`.
6. Failed validation commands may be retried with the same content and return the same logical result.
7. Publication retries cannot allocate another version number.

### `ReserveItemDefinitionKey`

Input:

```json
{
  "catalogScope": "platform",
  "itemDefinitionKey": "cosmetic.training_sash",
  "reservationPurpose": "NEW_DEFINITION"
}
```

Validation:

- normalized key syntax;
- scope authorization;
- no existing or retired reservation;
- prohibited-name registry;
- no confusing Unicode or case collision.

Output:

- reservation ID;
- normalized stable key;
- expiration for unpublished reservations if policy permits;
- ownership actor/team.

Published keys never expire.

### `CreateItemDefinition`

Creates the aggregate and initial draft. It requires a valid key reservation.

### `CreateItemDefinitionDraftVersion`

Creates a new draft based on:

- empty template;
- prior published version;
- another draft revision;
- approved import package.

Cloning never reuses the source Definition identity.

### `UpdateItemDefinitionDraft`

Supports JSON Merge Patch or typed operations over bounded source fields. Commands must include expected revision. Server normalization removes unknown fields and rejects ambiguous null semantics.

### `ValidateItemDefinitionDraft`

Input includes source revision and optional validation profile:

- `STANDARD`;
- `STRICT_PUBLICATION`;
- `CONSUMER_COMPATIBILITY_ONLY`;
- `LOCALIZATION_ONLY`;
- `ASSET_ONLY`.

Validation is asynchronous for large dependency graphs. The job snapshots registry versions and dependencies to make the result reproducible.

### `SubmitItemDefinitionForReview`

Freezes an immutable review package. The source cannot be edited without invalidating the package.

### `ApproveItemDefinitionVersion`

Requires a reviewer role and exact review package fingerprint. Separation of duties may prohibit the primary author from satisfying all required approvals.

### `RejectItemDefinitionVersion`

Requires reason code and bounded reviewer note.

### `ScheduleItemDefinitionPublication`

Requires:

- approved review package;
- future server time;
- release channel;
- audience route;
- dependency and compatibility status;
- no conflicting scheduled publication.

### `PublishItemDefinitionVersion`

The transaction:

1. locks the Definition aggregate;
2. verifies idempotency and expected revision;
3. verifies approval and validation freshness;
4. rechecks critical dependency lifecycle;
5. allocates immutable version number and publication sequence;
6. persists normalized manifest and all child rows;
7. updates recommended pointer if requested;
8. persists lifecycle and audit;
9. persists outbox Events;
10. commits atomically.

No external call is inside the transaction.

### `MarkItemVersionRecommended`

Changes only the recommended routing pointer. It does not modify either version.

### `DeprecateItemDefinitionVersion`

Requires impact analysis, reason, effective time, new-reference policy, and optional replacement.

### `RetireItemDefinitionVersion`

Requires:

- impact report;
- new-acquisition policy;
- historical-fulfillment policy;
- public-presentation policy;
- owned-copy policy fixed to non-destructive values in v1;
- governance approval.

### `QuarantineItemDefinitionVersion`

Emergency command with restrictions, incident ID, reason, safe placeholder, and reviewer authority. It may bypass ordinary scheduling but not audit or authentication.

### `RecoverItemDefinitionVersion`

Requires incident resolution evidence, revalidation, asset and rights confirmation, compatibility check, and approval.

### `DeclareItemReplacement`

Validates target existence, compatibility metadata, absence of cycles, and explicit owned-copy policy.

### `ApplyItemPresentationErratum`

Requires a machine-verified unchanged mechanical fingerprint. The command is rejected if any mechanical field differs.

### Registry write commands

#### `RegisterItemType`

Requires architecture and consumer-owner approval. A type declaration includes allowed/required/forbidden schemas and capabilities.

#### `RegisterItemPropertySchema`

Requires schema compatibility classification:

- `BACKWARD_COMPATIBLE`;
- `FORWARD_COMPATIBLE`;
- `FULLY_COMPATIBLE`;
- `BREAKING`.

Published Items remain pinned to exact schema versions.

#### `RegisterItemCapabilityType`

Requires:

- stable capability key;
- schema version;
- consumer owner;
- execution owner;
- disclosure rules;
- security classification;
- maximum payload size;
- deterministic validation;
- compatibility and retirement policy;
- acceptance contract from the consumer team.

### Bulk commands

Bulk authoring, validation, publication, deprecation, retirement, and errata use resumable jobs. Each Item command is independent and idempotent. A bulk job reports per-item outcomes and cannot hide partial success.

### Import model

Imports accept a signed package containing:

- package schema version;
- source Items;
- localizations;
- asset references;
- dependency references;
- expected fingerprints;
- package signer and provenance.

Import creates or updates drafts only. It never directly publishes content.

### Dry run

Every high-impact command SHOULD support dry run returning:

- normalized command;
- validation findings;
- affected Definitions and consumers;
- proposed lifecycle transitions;
- fingerprints;
- whether approval is required;
- no state mutation.

### Command authorization matrix

| Command | Author | Reviewer | Publisher | Security Admin | Platform Admin |
|---|---:|---:|---:|---:|---:|
| Create/update draft | yes | optional | yes | no | yes |
| Validate | yes | yes | yes | yes | yes |
| Submit review | yes | no | yes | no | yes |
| Approve | no for own required approval | yes | yes if policy | security scope only | yes |
| Publish | no | no | yes | emergency only | yes |
| Deprecate | no | review | yes | security scope | yes |
| Retire | no | required | required | security scope | yes |
| Quarantine | no | no | no | yes | yes |
| Erratum | limited | required | yes | yes | yes |
| Registry change | no | architecture review | platform publisher | security review | yes |

### Write failure semantics

- Validation failures return deterministic findings and no partial state except the validation-run record.
- Concurrency conflicts return the current revision.
- Transient infrastructure failures are retryable with the same idempotency key.
- Unknown commit outcome is resolved by idempotency lookup before retry.
- An outbox dispatcher failure never rolls back a committed publication.
- Projector failure does not change authoritative lifecycle.

---

## Database Schema

The following PostgreSQL schema is a reference design. Names may change, but ownership, uniqueness, immutability, idempotency, and audit constraints are normative.

### Extensions and conventions

```sql
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS citext;

-- All timestamps use TIMESTAMPTZ in UTC.
-- JSON payloads are validated in the service and may additionally use CHECK helpers.
-- Published rows are immutable through permissions and update triggers.
```

### `item_definition`

```sql
CREATE TABLE item_definition (
    item_definition_id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    catalog_scope                   TEXT NOT NULL,
    item_definition_key             CITEXT NOT NULL,
    aggregate_status                TEXT NOT NULL,
    source_revision                 BIGINT NOT NULL DEFAULT 0,
    latest_version_number           INTEGER NOT NULL DEFAULT 0,
    recommended_version_id          UUID NULL,
    created_by_actor_type           TEXT NOT NULL,
    created_by_actor_id             UUID NOT NULL,
    created_at                      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at                      TIMESTAMPTZ NOT NULL DEFAULT now(),
    archived_at                     TIMESTAMPTZ NULL,
    CONSTRAINT uq_item_definition_key UNIQUE (catalog_scope, item_definition_key),
    CONSTRAINT ck_item_definition_revision CHECK (source_revision >= 0),
    CONSTRAINT ck_item_definition_version CHECK (latest_version_number >= 0),
    CONSTRAINT ck_item_definition_status CHECK (
        aggregate_status IN (
            'DRAFT','IN_REVIEW','APPROVED','SCHEDULED','PUBLISHED',
            'DEPRECATED','RETIRED','QUARANTINED'
        )
    )
);
```

The foreign key for `recommended_version_id` is added after the version table to avoid creation-order issues.

### `item_key_reservation`

```sql
CREATE TABLE item_key_reservation (
    catalog_scope                   TEXT NOT NULL,
    normalized_key                  CITEXT NOT NULL,
    reservation_id                 UUID NOT NULL DEFAULT gen_random_uuid(),
    reservation_status             TEXT NOT NULL,
    reserved_by_actor_id            UUID NOT NULL,
    reserved_for_definition_id      UUID NULL,
    reserved_at                     TIMESTAMPTZ NOT NULL DEFAULT now(),
    expires_at                      TIMESTAMPTZ NULL,
    retired_at                      TIMESTAMPTZ NULL,
    PRIMARY KEY (catalog_scope, normalized_key),
    UNIQUE (reservation_id),
    CONSTRAINT ck_item_key_reservation_status CHECK (
        reservation_status IN ('RESERVED','ACTIVE','RETIRED')
    )
);
```

### `item_definition_draft`

```sql
CREATE TABLE item_definition_draft (
    draft_version_id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    item_definition_id              UUID NOT NULL REFERENCES item_definition(item_definition_id),
    proposed_version_number         INTEGER NULL,
    source_revision                 BIGINT NOT NULL,
    source_document                 JSONB NOT NULL,
    source_fingerprint              TEXT NOT NULL,
    draft_status                    TEXT NOT NULL,
    based_on_version_id             UUID NULL,
    created_by_actor_id             UUID NOT NULL,
    created_at                      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at                      TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_item_draft_revision UNIQUE (item_definition_id, source_revision),
    CONSTRAINT ck_item_draft_status CHECK (
        draft_status IN (
            'DRAFT','VALIDATING','INVALID','VALID','IN_REVIEW',
            'REJECTED','APPROVED','SCHEDULED','PUBLISHED'
        )
    )
);
```

### `item_validation_run`

```sql
CREATE TABLE item_validation_run (
    validation_run_id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    draft_version_id                UUID NOT NULL REFERENCES item_definition_draft(draft_version_id),
    source_revision                 BIGINT NOT NULL,
    registry_snapshot_id            UUID NOT NULL,
    validation_profile              TEXT NOT NULL,
    status                          TEXT NOT NULL,
    normalized_manifest             JSONB NULL,
    mechanical_fingerprint          TEXT NULL,
    presentation_fingerprint        TEXT NULL,
    full_fingerprint                TEXT NULL,
    blocking_finding_count          INTEGER NOT NULL DEFAULT 0,
    warning_count                   INTEGER NOT NULL DEFAULT 0,
    started_at                      TIMESTAMPTZ NOT NULL,
    completed_at                    TIMESTAMPTZ NULL,
    CONSTRAINT uq_item_validation_exact UNIQUE (
        draft_version_id, source_revision, registry_snapshot_id, validation_profile
    ),
    CONSTRAINT ck_item_validation_counts CHECK (
        blocking_finding_count >= 0 AND warning_count >= 0
    ),
    CONSTRAINT ck_item_validation_status CHECK (
        status IN ('PENDING','RUNNING','VALID','INVALID','FAILED','CANCELLED')
    )
);
```

### `item_validation_finding`

```sql
CREATE TABLE item_validation_finding (
    validation_run_id               UUID NOT NULL REFERENCES item_validation_run(validation_run_id),
    finding_sequence                INTEGER NOT NULL,
    severity                        TEXT NOT NULL,
    finding_code                    TEXT NOT NULL,
    json_pointer                    TEXT NULL,
    message_key                     TEXT NOT NULL,
    details                         JSONB NOT NULL DEFAULT '{}'::jsonb,
    PRIMARY KEY (validation_run_id, finding_sequence),
    CONSTRAINT ck_item_finding_severity CHECK (
        severity IN ('INFO','WARNING','ERROR','BLOCKING')
    )
);
```

### `item_review_package`

```sql
CREATE TABLE item_review_package (
    review_package_id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    draft_version_id                UUID NOT NULL REFERENCES item_definition_draft(draft_version_id),
    source_revision                 BIGINT NOT NULL,
    validation_run_id               UUID NOT NULL REFERENCES item_validation_run(validation_run_id),
    full_fingerprint                TEXT NOT NULL,
    risk_level                      TEXT NOT NULL,
    package_document                JSONB NOT NULL,
    status                          TEXT NOT NULL,
    submitted_by_actor_id           UUID NOT NULL,
    submitted_at                    TIMESTAMPTZ NOT NULL,
    closed_at                       TIMESTAMPTZ NULL,
    CONSTRAINT uq_item_review_exact UNIQUE (draft_version_id, source_revision, full_fingerprint),
    CONSTRAINT ck_item_review_status CHECK (
        status IN ('OPEN','APPROVED','REJECTED','STALE','CANCELLED')
    )
);
```

### `item_review_decision`

```sql
CREATE TABLE item_review_decision (
    review_package_id               UUID NOT NULL REFERENCES item_review_package(review_package_id),
    reviewer_actor_id               UUID NOT NULL,
    reviewer_role                   TEXT NOT NULL,
    decision                        TEXT NOT NULL,
    reason_code                     TEXT NULL,
    note_ciphertext                 BYTEA NULL,
    decided_at                      TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (review_package_id, reviewer_actor_id, reviewer_role),
    CONSTRAINT ck_item_review_decision CHECK (
        decision IN ('APPROVE','REJECT','REQUEST_CHANGES','ABSTAIN')
    )
);
```

### `item_definition_version`

```sql
CREATE TABLE item_definition_version (
    item_definition_version_id      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    item_definition_id              UUID NOT NULL REFERENCES item_definition(item_definition_id),
    version_number                  INTEGER NOT NULL,
    version_status                  TEXT NOT NULL,
    item_type_key                   TEXT NOT NULL,
    item_type_registry_version      INTEGER NOT NULL,
    normalized_manifest             JSONB NOT NULL,
    inventory_manifest              JSONB NOT NULL,
    compatibility_manifest          JSONB NOT NULL,
    disclosure_policy               TEXT NOT NULL,
    mechanical_fingerprint          TEXT NOT NULL,
    presentation_fingerprint        TEXT NOT NULL,
    full_fingerprint                TEXT NOT NULL,
    publication_sequence            BIGINT NOT NULL,
    published_from_draft_id         UUID NOT NULL REFERENCES item_definition_draft(draft_version_id),
    published_from_review_id        UUID NOT NULL REFERENCES item_review_package(review_package_id),
    published_by_actor_id           UUID NOT NULL,
    published_at                    TIMESTAMPTZ NOT NULL,
    effective_from                  TIMESTAMPTZ NOT NULL,
    effective_until                 TIMESTAMPTZ NULL,
    deprecated_at                   TIMESTAMPTZ NULL,
    retired_at                      TIMESTAMPTZ NULL,
    quarantined_at                  TIMESTAMPTZ NULL,
    CONSTRAINT uq_item_version_number UNIQUE (item_definition_id, version_number),
    CONSTRAINT uq_item_publication_sequence UNIQUE (publication_sequence),
    CONSTRAINT ck_item_version_number CHECK (version_number > 0),
    CONSTRAINT ck_item_version_status CHECK (
        version_status IN (
            'PUBLISHED','SUPERSEDED','DEPRECATED','RETIRED','QUARANTINED'
        )
    ),
    CONSTRAINT ck_item_effective_window CHECK (
        effective_until IS NULL OR effective_until > effective_from
    )
);

ALTER TABLE item_definition
    ADD CONSTRAINT fk_item_recommended_version
    FOREIGN KEY (recommended_version_id)
    REFERENCES item_definition_version(item_definition_version_id);
```

### Published-row immutability trigger

```sql
CREATE OR REPLACE FUNCTION prevent_item_version_update()
RETURNS trigger AS $$
BEGIN
    RAISE EXCEPTION 'published item_definition_version rows are immutable';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_item_version_immutable
BEFORE UPDATE OR DELETE ON item_definition_version
FOR EACH ROW EXECUTE FUNCTION prevent_item_version_update();
```

Lifecycle status changes SHOULD be stored in a separate state table rather than updating immutable version content.

### `item_version_lifecycle`

```sql
CREATE TABLE item_version_lifecycle (
    item_definition_version_id      UUID PRIMARY KEY REFERENCES item_definition_version(item_definition_version_id),
    current_status                  TEXT NOT NULL,
    acquisition_policy              TEXT NOT NULL,
    historical_fulfillment_policy   TEXT NOT NULL,
    public_presentation_policy      TEXT NOT NULL,
    lifecycle_revision              BIGINT NOT NULL DEFAULT 0,
    updated_at                      TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT ck_item_lifecycle_revision CHECK (lifecycle_revision >= 0)
);
```

### `item_property_value`

```sql
CREATE TABLE item_property_value (
    item_definition_version_id      UUID NOT NULL REFERENCES item_definition_version(item_definition_version_id),
    property_schema_key             TEXT NOT NULL,
    property_schema_version         INTEGER NOT NULL,
    property_key                    TEXT NOT NULL,
    value_json                      JSONB NOT NULL,
    mechanical                     BOOLEAN NOT NULL,
    PRIMARY KEY (item_definition_version_id, property_key)
);
```

### `item_capability`

```sql
CREATE TABLE item_capability (
    item_capability_id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    item_definition_version_id      UUID NOT NULL REFERENCES item_definition_version(item_definition_version_id),
    capability_type                 TEXT NOT NULL,
    capability_schema_version       INTEGER NOT NULL,
    consumer_owner                  TEXT NOT NULL,
    execution_owner                 TEXT NOT NULL,
    disclosure_policy               TEXT NOT NULL,
    payload                         JSONB NOT NULL,
    payload_fingerprint             TEXT NOT NULL,
    UNIQUE (item_definition_version_id, capability_type, capability_schema_version, payload_fingerprint)
);
```

### `item_classification`

```sql
CREATE TABLE item_classification (
    item_definition_version_id      UUID PRIMARY KEY REFERENCES item_definition_version(item_definition_version_id),
    category_key                    TEXT NOT NULL,
    rarity_key                      TEXT NULL,
    variant_family_key              TEXT NULL,
    sort_rank                       BIGINT NOT NULL DEFAULT 0
);

CREATE TABLE item_tag_assignment (
    item_definition_version_id      UUID NOT NULL REFERENCES item_definition_version(item_definition_version_id),
    tag_key                         TEXT NOT NULL,
    mechanical                     BOOLEAN NOT NULL DEFAULT false,
    public                          BOOLEAN NOT NULL DEFAULT true,
    PRIMARY KEY (item_definition_version_id, tag_key)
);
```

### `item_localization_bundle`

```sql
CREATE TABLE item_localization_bundle (
    item_definition_version_id      UUID NOT NULL REFERENCES item_definition_version(item_definition_version_id),
    locale                          TEXT NOT NULL,
    bundle_version                  INTEGER NOT NULL,
    localized_content               JSONB NOT NULL,
    presentation_fingerprint        TEXT NOT NULL,
    review_status                   TEXT NOT NULL,
    fallback_locale                 TEXT NULL,
    PRIMARY KEY (item_definition_version_id, locale, bundle_version)
);
```

### `item_asset_reference`

```sql
CREATE TABLE item_asset_reference (
    item_definition_version_id      UUID NOT NULL REFERENCES item_definition_version(item_definition_version_id),
    asset_role                      TEXT NOT NULL,
    asset_version_id                UUID NOT NULL,
    asset_content_hash              TEXT NOT NULL,
    audience_policy                 TEXT NOT NULL,
    fallback_asset_version_id       UUID NULL,
    rights_expires_at               TIMESTAMPTZ NULL,
    PRIMARY KEY (item_definition_version_id, asset_role)
);
```

### `item_dependency`

```sql
CREATE TABLE item_dependency (
    item_definition_version_id      UUID NOT NULL REFERENCES item_definition_version(item_definition_version_id),
    dependency_type                 TEXT NOT NULL,
    dependency_key                  TEXT NOT NULL,
    dependency_version_id           UUID NULL,
    resolution_mode                 TEXT NOT NULL,
    required                        BOOLEAN NOT NULL,
    dependency_fingerprint          TEXT NULL,
    PRIMARY KEY (
        item_definition_version_id,
        dependency_type,
        dependency_key
    )
);

CREATE INDEX ix_item_dependency_reverse
    ON item_dependency (dependency_type, dependency_version_id);
```

### `item_replacement_relation`

```sql
CREATE TABLE item_replacement_relation (
    replacement_relation_id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_item_definition_id       UUID NOT NULL REFERENCES item_definition(item_definition_id),
    target_item_definition_id       UUID NOT NULL REFERENCES item_definition(item_definition_id),
    relationship_type               TEXT NOT NULL,
    new_reference_policy            TEXT NOT NULL,
    owned_copy_policy               TEXT NOT NULL,
    reason_code                     TEXT NOT NULL,
    effective_from                  TIMESTAMPTZ NOT NULL,
    created_by_actor_id             UUID NOT NULL,
    created_at                      TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT ck_item_replacement_distinct CHECK (
        source_item_definition_id <> target_item_definition_id
    )
);
```

### `item_erratum_overlay`

```sql
CREATE TABLE item_erratum_overlay (
    erratum_overlay_id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    item_definition_version_id      UUID NOT NULL REFERENCES item_definition_version(item_definition_version_id),
    overlay_revision                INTEGER NOT NULL,
    overlay_document                JSONB NOT NULL,
    original_mechanical_fingerprint TEXT NOT NULL,
    new_presentation_fingerprint    TEXT NOT NULL,
    reason_code                     TEXT NOT NULL,
    approved_by_actor_id            UUID NOT NULL,
    applied_by_actor_id             UUID NOT NULL,
    applied_at                      TIMESTAMPTZ NOT NULL DEFAULT now(),
    superseded_at                   TIMESTAMPTZ NULL,
    UNIQUE (item_definition_version_id, overlay_revision)
);
```

### Registry tables

```sql
CREATE TABLE item_type_registry (
    item_type_key                   TEXT NOT NULL,
    registry_version               INTEGER NOT NULL,
    status                         TEXT NOT NULL,
    declaration                    JSONB NOT NULL,
    declaration_fingerprint        TEXT NOT NULL,
    activated_at                   TIMESTAMPTZ NULL,
    deprecated_at                  TIMESTAMPTZ NULL,
    PRIMARY KEY (item_type_key, registry_version)
);

CREATE TABLE item_property_schema_registry (
    property_schema_key             TEXT NOT NULL,
    schema_version                  INTEGER NOT NULL,
    status                          TEXT NOT NULL,
    json_schema                     JSONB NOT NULL,
    compatibility_class             TEXT NOT NULL,
    schema_fingerprint              TEXT NOT NULL,
    activated_at                   TIMESTAMPTZ NULL,
    PRIMARY KEY (property_schema_key, schema_version)
);

CREATE TABLE item_capability_registry (
    capability_type                TEXT NOT NULL,
    schema_version                 INTEGER NOT NULL,
    status                         TEXT NOT NULL,
    consumer_owner                 TEXT NOT NULL,
    execution_owner                TEXT NOT NULL,
    payload_schema                 JSONB NOT NULL,
    security_classification        TEXT NOT NULL,
    max_payload_bytes              INTEGER NOT NULL,
    compatibility_declaration      JSONB NOT NULL,
    activated_at                   TIMESTAMPTZ NULL,
    PRIMARY KEY (capability_type, schema_version),
    CONSTRAINT ck_item_capability_payload_size CHECK (max_payload_bytes > 0)
);
```

### `item_edition`

```sql
CREATE TABLE item_edition (
    edition_id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    edition_key                     CITEXT NOT NULL UNIQUE,
    status                          TEXT NOT NULL,
    activation_start               TIMESTAMPTZ NULL,
    activation_end                 TIMESTAMPTZ NULL,
    presentation                   JSONB NOT NULL,
    membership_revision            BIGINT NOT NULL DEFAULT 0,
    created_at                      TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT ck_item_edition_window CHECK (
        activation_end IS NULL OR activation_start IS NULL OR activation_end > activation_start
    )
);

CREATE TABLE item_edition_member (
    edition_id                      UUID NOT NULL REFERENCES item_edition(edition_id),
    item_definition_version_id      UUID NOT NULL REFERENCES item_definition_version(item_definition_version_id),
    display_order                   BIGINT NOT NULL DEFAULT 0,
    disclosure_override            TEXT NULL,
    PRIMARY KEY (edition_id, item_definition_version_id)
);
```

### Lifecycle and audit

```sql
CREATE TABLE item_lifecycle_history (
    lifecycle_event_id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    item_definition_id              UUID NOT NULL REFERENCES item_definition(item_definition_id),
    item_definition_version_id      UUID NULL REFERENCES item_definition_version(item_definition_version_id),
    aggregate_sequence              BIGINT NOT NULL,
    from_status                     TEXT NULL,
    to_status                       TEXT NOT NULL,
    reason_code                     TEXT NULL,
    actor_type                      TEXT NOT NULL,
    actor_id                        UUID NOT NULL,
    command_id                      UUID NOT NULL,
    correlation_id                  UUID NOT NULL,
    details                         JSONB NOT NULL DEFAULT '{}'::jsonb,
    occurred_at                    TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (item_definition_id, aggregate_sequence),
    UNIQUE (command_id)
);

CREATE TABLE item_audit_record (
    audit_record_id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    action_type                     TEXT NOT NULL,
    resource_type                   TEXT NOT NULL,
    resource_id                     UUID NOT NULL,
    actor_type                      TEXT NOT NULL,
    actor_id                        UUID NOT NULL,
    authorization_context          JSONB NOT NULL,
    command_id                      UUID NULL,
    correlation_id                  UUID NOT NULL,
    request_fingerprint             TEXT NULL,
    before_fingerprint              TEXT NULL,
    after_fingerprint               TEXT NULL,
    reason_code                     TEXT NULL,
    metadata                        JSONB NOT NULL DEFAULT '{}'::jsonb,
    occurred_at                    TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### Idempotency

```sql
CREATE TABLE item_command_idempotency (
    idempotency_scope               TEXT NOT NULL,
    idempotency_key                 TEXT NOT NULL,
    command_id                      UUID NOT NULL,
    request_fingerprint             TEXT NOT NULL,
    status                          TEXT NOT NULL,
    response_code                   INTEGER NULL,
    response_body                   JSONB NULL,
    resource_id                     UUID NULL,
    created_at                      TIMESTAMPTZ NOT NULL DEFAULT now(),
    completed_at                    TIMESTAMPTZ NULL,
    expires_at                      TIMESTAMPTZ NULL,
    PRIMARY KEY (idempotency_scope, idempotency_key),
    UNIQUE (command_id)
);
```

### Inbox and outbox

```sql
CREATE TABLE item_event_inbox (
    event_id                        UUID NOT NULL,
    handler_name                    TEXT NOT NULL,
    handler_version                 INTEGER NOT NULL,
    event_type                      TEXT NOT NULL,
    event_payload                   JSONB NOT NULL,
    status                          TEXT NOT NULL,
    attempts                        INTEGER NOT NULL DEFAULT 0,
    received_at                     TIMESTAMPTZ NOT NULL DEFAULT now(),
    available_at                    TIMESTAMPTZ NOT NULL DEFAULT now(),
    processed_at                    TIMESTAMPTZ NULL,
    last_error_code                 TEXT NULL,
    PRIMARY KEY (event_id, handler_name, handler_version)
);

CREATE TABLE item_event_outbox (
    outbox_id                       UUID PRIMARY KEY,
    aggregate_type                  TEXT NOT NULL,
    aggregate_id                    UUID NOT NULL,
    aggregate_sequence              BIGINT NOT NULL,
    event_type                      TEXT NOT NULL,
    event_version                   INTEGER NOT NULL,
    event_payload                   JSONB NOT NULL,
    headers                         JSONB NOT NULL,
    status                          TEXT NOT NULL DEFAULT 'PENDING',
    attempts                        INTEGER NOT NULL DEFAULT 0,
    available_at                    TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_at                      TIMESTAMPTZ NOT NULL DEFAULT now(),
    published_at                    TIMESTAMPTZ NULL,
    last_error_code                 TEXT NULL,
    UNIQUE (aggregate_type, aggregate_id, aggregate_sequence, event_type)
);

CREATE INDEX ix_item_outbox_dispatch
    ON item_event_outbox (status, available_at, created_at)
    WHERE status IN ('PENDING','RETRY');
```

### Projector checkpoint

```sql
CREATE TABLE item_projector_checkpoint (
    projector_name                  TEXT PRIMARY KEY,
    last_publication_sequence       BIGINT NOT NULL DEFAULT 0,
    last_event_id                   UUID NULL,
    updated_at                      TIMESTAMPTZ NOT NULL DEFAULT now(),
    status                          TEXT NOT NULL DEFAULT 'RUNNING'
);
```

### Scheduled publication

```sql
CREATE TABLE item_publication_schedule (
    schedule_id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    item_definition_id              UUID NOT NULL REFERENCES item_definition(item_definition_id),
    draft_version_id                UUID NOT NULL REFERENCES item_definition_draft(draft_version_id),
    review_package_id               UUID NOT NULL REFERENCES item_review_package(review_package_id),
    expected_full_fingerprint       TEXT NOT NULL,
    scheduled_for                   TIMESTAMPTZ NOT NULL,
    release_channel                 TEXT NOT NULL,
    audience_key                    TEXT NOT NULL,
    status                          TEXT NOT NULL,
    command_id                      UUID NOT NULL UNIQUE,
    attempts                        INTEGER NOT NULL DEFAULT 0,
    claimed_by                      TEXT NULL,
    claimed_until                   TIMESTAMPTZ NULL,
    completed_at                    TIMESTAMPTZ NULL
);

CREATE INDEX ix_item_publication_due
    ON item_publication_schedule (status, scheduled_for)
    WHERE status IN ('SCHEDULED','RETRY');
```

### Bulk jobs

```sql
CREATE TABLE item_bulk_job (
    bulk_job_id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_type                        TEXT NOT NULL,
    status                          TEXT NOT NULL,
    requested_by_actor_id           UUID NOT NULL,
    request_document                JSONB NOT NULL,
    total_items                     BIGINT NOT NULL,
    processed_items                 BIGINT NOT NULL DEFAULT 0,
    succeeded_items                 BIGINT NOT NULL DEFAULT 0,
    failed_items                    BIGINT NOT NULL DEFAULT 0,
    skipped_items                   BIGINT NOT NULL DEFAULT 0,
    created_at                      TIMESTAMPTZ NOT NULL DEFAULT now(),
    started_at                      TIMESTAMPTZ NULL,
    completed_at                    TIMESTAMPTZ NULL,
    CONSTRAINT ck_item_bulk_counts CHECK (
        total_items >= 0 AND processed_items >= 0 AND succeeded_items >= 0
        AND failed_items >= 0 AND skipped_items >= 0
    )
);

CREATE TABLE item_bulk_job_entry (
    bulk_job_id                     UUID NOT NULL REFERENCES item_bulk_job(bulk_job_id),
    entry_sequence                  BIGINT NOT NULL,
    item_definition_id              UUID NULL,
    idempotency_key                 TEXT NOT NULL,
    status                          TEXT NOT NULL,
    result_document                 JSONB NULL,
    error_code                      TEXT NULL,
    attempts                        INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (bulk_job_id, entry_sequence),
    UNIQUE (bulk_job_id, idempotency_key)
);
```

### Reconciliation jobs

```sql
CREATE TABLE item_reconciliation_job (
    reconciliation_job_id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reconciliation_type             TEXT NOT NULL,
    scope_document                  JSONB NOT NULL,
    status                          TEXT NOT NULL,
    checkpoint                      JSONB NULL,
    findings_count                  BIGINT NOT NULL DEFAULT 0,
    repair_mode                     TEXT NOT NULL,
    requested_by_actor_id           UUID NOT NULL,
    created_at                      TIMESTAMPTZ NOT NULL DEFAULT now(),
    completed_at                    TIMESTAMPTZ NULL
);

CREATE TABLE item_reconciliation_finding (
    reconciliation_job_id           UUID NOT NULL REFERENCES item_reconciliation_job(reconciliation_job_id),
    finding_sequence                BIGINT NOT NULL,
    finding_type                    TEXT NOT NULL,
    severity                        TEXT NOT NULL,
    resource_type                   TEXT NOT NULL,
    resource_id                     UUID NULL,
    details                         JSONB NOT NULL,
    status                          TEXT NOT NULL,
    PRIMARY KEY (reconciliation_job_id, finding_sequence)
);
```

### Search projection example

Search infrastructure may use an external index. A relational fallback projection may be:

```sql
CREATE TABLE item_catalog_projection (
    audience_class                  TEXT NOT NULL,
    locale                          TEXT NOT NULL,
    item_definition_version_id      UUID NOT NULL,
    item_definition_id              UUID NOT NULL,
    catalog_scope                   TEXT NOT NULL,
    item_definition_key             TEXT NOT NULL,
    localized_name                  TEXT NOT NULL,
    localized_short_description     TEXT NULL,
    category_key                    TEXT NOT NULL,
    rarity_key                      TEXT NULL,
    tags                            TEXT[] NOT NULL DEFAULT '{}',
    card_document                   JSONB NOT NULL,
    publication_sequence            BIGINT NOT NULL,
    presentation_fingerprint        TEXT NOT NULL,
    overlay_revision                INTEGER NOT NULL DEFAULT 0,
    updated_at                      TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (audience_class, locale, item_definition_version_id)
);

CREATE INDEX ix_item_catalog_scope_category
    ON item_catalog_projection (catalog_scope, locale, category_key, localized_name);

CREATE INDEX ix_item_catalog_tags
    ON item_catalog_projection USING GIN (tags);
```

### Indexing requirements

At minimum:

- unique stable key by scope;
- version lookup by ID;
- version list by Definition and number;
- lifecycle filters;
- reverse dependency lookup;
- due schedules;
- outbox dispatch;
- inbox retry;
- audit by resource and time;
- catalog search by scope, locale, category, tag, and lifecycle.

### Database permissions

- Runtime query role: read published tables and projections only.
- Authoring role: mutate drafts through stored application paths, never published tables.
- Publisher role: execute publication service transactions.
- Projector role: read outbox and write projections/checkpoints.
- Support role: read audited views with field-level redaction.
- No external Engine receives direct write permission.

### Backup and recovery

Backups must preserve:

- stable key reservations;
- all published versions;
- manifests and fingerprints;
- lifecycle history;
- registries;
- review evidence;
- audit;
- inbox/outbox.

Recovery procedures must verify fingerprint integrity and publication sequence continuity before reopening writes.

---
## API Specification

### API principles

1. Command and query APIs are separate.
2. Every mutation requires authentication, authorization, correlation ID, and idempotency key.
3. Runtime mechanical references use immutable version IDs.
4. Public APIs never reveal unauthorized existence through distinguishable errors.
5. Search is not authoritative for fulfillment.
6. Responses use stable error codes and explicit freshness metadata.
7. Bulk APIs are asynchronous jobs.
8. ETags or explicit source revisions protect draft editing.
9. Server-side audience evaluation is mandatory.
10. Administrative APIs are not exposed through public gateways.

### Base paths

Recommended versioned paths:

```text
/platform/v1/items
/platform/v1/item-definitions
/platform/v1/item-catalog
/internal/v1/items
/admin/v1/items
```

### Public and authenticated catalog queries

#### `GET /platform/v1/item-catalog`

Query parameters:

- `scope`;
- `locale`;
- `category`;
- `rarity`;
- `tag` repeated;
- `edition`;
- `season`;
- `itemType`;
- `q`;
- `sort`;
- `cursor`;
- `limit` capped by policy.

Response:

```json
{
  "items": [
    {
      "itemId": "public-opaque-id",
      "itemDefinitionKey": "cosmetic.training_sash",
      "name": "Training Sash",
      "shortDescription": "A visible mark of dedicated practice.",
      "category": "COSMETIC",
      "rarity": "UNCOMMON",
      "icon": {
        "assetVersionId": "uuid",
        "url": "signed-or-public-url",
        "alt": "Red training sash"
      },
      "tags": ["cosmetic"],
      "disclosure": "PUBLIC"
    }
  ],
  "page": {
    "nextCursor": "opaque",
    "projectionVersion": 8822,
    "generatedAt": "2026-07-18T18:30:00Z",
    "isStale": false
  }
}
```

#### `GET /platform/v1/item-catalog/{publicItemId}`

Returns an audience-safe catalog detail. It does not expose internal immutable version IDs unless the product surface requires them and policy permits.

#### `GET /platform/v1/item-catalog/by-key/{scope}/{key}`

May return the recommended public presentation only. Mechanical consumers MUST use internal exact lookup.

### Owner-composed query

#### `GET /platform/v1/characters/{characterId}/items/{inventoryReference}/presentation`

This endpoint SHOULD be implemented by an API composition layer or Inventory facade. It combines Inventory-owned state with Item catalog metadata. Item Engine itself validates only the catalog portion.

### Internal exact lookup

#### `GET /internal/v1/items/versions/{itemDefinitionVersionId}`

Authorization: registered platform service.

Headers:

- `If-None-Match: "full-fingerprint"` optional;
- `X-Consumer-Contract` required for compatibility logging.

Returns the authoritative normalized manifest.

#### `POST /internal/v1/items/versions:batchGet`

Input:

```json
{
  "itemDefinitionVersionIds": ["uuid", "uuid"],
  "include": ["INVENTORY_MANIFEST", "PRESENTATION_SUMMARY"]
}
```

Batch size is bounded. Results preserve request order and contain per-entry errors.

#### `POST /internal/v1/items:resolveRecommended`

Authoring-only resolution:

```json
{
  "references": [
    {
      "catalogScope": "platform",
      "itemDefinitionKey": "cosmetic.training_sash",
      "audienceKey": "DEFAULT",
      "releaseChannel": "PRODUCTION"
    }
  ]
}
```

The response includes exact pinned version IDs and warnings. Consumers persist the pinned IDs.

#### `POST /internal/v1/items:validateAcquisitionReferences`

Input:

```json
{
  "references": [
    {
      "itemDefinitionVersionId": "uuid",
      "quantity": 1,
      "acquisitionContext": "REWARD_FULFILLMENT",
      "commitOccurredAt": "2026-07-18T17:50:00Z"
    }
  ]
}
```

Output contains catalog validity and Inventory manifest, not Character-specific uniqueness decisions.

### Authoring API

#### `POST /admin/v1/item-definitions`

Creates a Definition and initial draft.

Headers:

```text
Idempotency-Key: required
X-Correlation-Id: required
```

Body:

```json
{
  "catalogScope": "platform",
  "itemDefinitionKey": "cosmetic.training_sash",
  "initialDraft": {
    "itemTypeKey": "COSMETIC",
    "source": {}
  }
}
```

#### `POST /admin/v1/item-definitions/{id}/drafts`

Creates another draft version.

#### `GET /admin/v1/item-definitions/{id}/drafts/{draftId}`

Returns draft, validation, review, diff, and ETag.

#### `PATCH /admin/v1/item-definitions/{id}/drafts/{draftId}`

Requires:

```text
If-Match: "source-revision-19"
Idempotency-Key: required
```

Body is a bounded merge patch. Unknown fields fail.

#### `POST /admin/v1/item-definitions/{id}/drafts/{draftId}:validate`

Returns `202 Accepted` and validation job ID or an existing idempotent result.

#### `GET /admin/v1/item-validation-runs/{runId}`

Returns status and findings.

#### `POST /admin/v1/item-definitions/{id}/drafts/{draftId}:submitReview`

Freezes the review package.

#### `POST /admin/v1/item-review-packages/{packageId}:approve`

Body:

```json
{
  "expectedFullFingerprint": "sha256:...",
  "reviewerRole": "ITEM_MECHANICS_REVIEWER",
  "decisionNote": "Validated Inventory semantics and compatibility."
}
```

#### `POST /admin/v1/item-review-packages/{packageId}:reject`

Requires reason code.

#### `POST /admin/v1/item-definitions/{id}/drafts/{draftId}:publish`

Body:

```json
{
  "reviewPackageId": "uuid",
  "expectedSourceRevision": 19,
  "expectedFullFingerprint": "sha256:...",
  "markRecommended": true,
  "audienceKey": "DEFAULT",
  "releaseChannel": "PRODUCTION",
  "effectiveFrom": "2026-07-18T18:45:00Z"
}
```

Success returns `201 Created` with immutable version ID and publication sequence.

#### `POST /admin/v1/item-definitions/{id}/drafts/{draftId}:schedulePublication`

Returns schedule ID.

#### `DELETE /admin/v1/item-publication-schedules/{scheduleId}`

Cancels only if not committed.

### Lifecycle APIs

#### `POST /admin/v1/item-versions/{versionId}:deprecate`

#### `POST /admin/v1/item-versions/{versionId}:retire`

#### `POST /admin/v1/item-versions/{versionId}:quarantine`

#### `POST /admin/v1/item-versions/{versionId}:recover`

#### `POST /admin/v1/item-definitions/{id}:declareReplacement`

#### `POST /admin/v1/item-versions/{versionId}:applyPresentationErratum`

All require dry-run support, explicit reason codes, impact summaries, and elevated authorization.

### Registry APIs

#### `GET /admin/v1/item-registry`

Returns active Item Types, schemas, capabilities, tags, rarity keys, units, and compatibility metadata.

#### `POST /admin/v1/item-registry/types`

#### `POST /admin/v1/item-registry/property-schemas`

#### `POST /admin/v1/item-registry/capabilities`

Registry writes are Platform Admin APIs and require architecture governance.

### Edition APIs

#### `POST /admin/v1/item-editions`

#### `PATCH /admin/v1/item-editions/{editionId}`

#### `POST /admin/v1/item-editions/{editionId}:approve`

#### `POST /admin/v1/item-editions/{editionId}:activate`

#### `GET /platform/v1/item-editions/{editionKey}`

Edition activation never publishes or mutates Item versions.

### Impact and operations APIs

#### `POST /admin/v1/item-impact-analysis`

Input identifies a version, schema, asset, capability, tag, or consumer contract. Output is a job because reverse graphs may be large.

#### `POST /admin/v1/item-reconciliation-jobs`

Modes:

- `REPORT_ONLY`;
- `REBUILD_PROJECTION`;
- `REDISPATCH_OUTBOX`;
- `REINDEX_SEARCH`;
- `REPAIR_SAFE_METADATA`.

No mode may alter published mechanical content.

#### `GET /admin/v1/item-operations/health`

Returns operational health with role-appropriate detail.

### HTTP status semantics

| Status | Meaning |
|---:|---|
| `200` | Successful query or idempotent existing result. |
| `201` | Resource or immutable version created. |
| `202` | Asynchronous job accepted. |
| `204` | Successful command with no response body. |
| `304` | Exact manifest unchanged for ETag. |
| `400` | Malformed request. |
| `401` | Authentication required or invalid. |
| `403` | Authenticated but unauthorized. |
| `404` | Not found or intentionally concealed. |
| `409` | Revision, state, stable-key, or idempotency conflict. |
| `412` | ETag or expected fingerprint mismatch. |
| `422` | Semantically invalid content or command. |
| `423` | Resource quarantined or locked by governance workflow. |
| `429` | Rate limited. |
| `503` | Required dependency unavailable; retryability stated. |

### API limits

Recommended defaults:

- list page: 50, maximum 200;
- exact batch lookup: maximum 500 IDs;
- draft source: maximum 512 KiB normalized JSON in v1;
- localization per locale: maximum 64 KiB;
- capability payload: registry-specific, hard platform maximum 32 KiB;
- tags per Item: maximum 64;
- capabilities per version: maximum 64;
- dependencies per version: maximum 256;
- bulk import package: asynchronous and size-limited by deployment policy.

### SDK requirements

Generated SDKs SHOULD expose:

- immutable manifest types;
- stable error enums;
- registry schema types;
- ETag and idempotency helpers;
- cursor pagination;
- locale fallback metadata;
- Event contract types;
- no methods that imply ownership mutation in Item Engine.

---

## Admin Features

### Item authoring studio

The administration surface must support:

- stable-key reservation;
- template-based draft creation;
- structured Item Type selection;
- typed property editors generated from schemas;
- capability editors generated from registered contracts;
- Inventory semantics editor;
- category, rarity, tag, variant-family, Collection, Season, and Edition references;
- localization editor with coverage status;
- asset picker showing immutable version, moderation, rights, and fallback status;
- disclosure and spoiler controls;
- preview for public, owner, hidden, and safe-placeholder audiences;
- diff from any published version;
- validation and simulation;
- review and approval workflow;
- scheduling and publication;
- deprecation, retirement, quarantine, replacement, and errata.

### Structured editing

Free-form JSON MAY be available to expert administrators, but the default interface must be schema-driven and validate continuously. The UI must not silently drop unknown fields.

### Mechanical diff

Before review and publication, the UI must highlight:

- type changes;
- stack mode changes;
- instance requirement changes;
- max stack changes;
- uniqueness and duplicate policy changes;
- binding and transfer changes;
- capability additions, removals, and payload changes;
- dependency changes;
- property unit or precision changes;
- consumer compatibility changes;
- mechanical fingerprint change.

Mechanical diff is visually separate from presentation diff.

### Inventory compatibility simulator

Given a draft manifest, the simulator should evaluate representative scenarios without reading real Character data:

- first acquisition;
- duplicate unique acquisition;
- large stack grant;
- stack overflow;
- bound and unbound merge;
- retired-version historical fulfillment;
- unsupported capability;
- transfer attempt declaration;
- expiration compatibility;
- instance requirement.

The simulator returns expected owner decisions according to registered Inventory contract examples, not a guarantee about live Character state.

### Consumer impact view

Before high-risk changes, administrators see:

- dependent Reward Definitions;
- dependent Quest and Achievement content;
- Talent references;
- Edition and Season membership;
- Collection membership;
- approximate owned-copy aggregates if supplied by Inventory;
- affected clients or contract versions;
- whether a replacement exists;
- whether a safe placeholder exists.

### Approval policy

Risk-based approval examples:

| Change | Minimum approval |
|---|---|
| Text-only draft before first publication | content reviewer |
| New cosmetic with existing capabilities | content + asset review |
| New stack or uniqueness semantics | Inventory owner + platform publisher |
| New consumable outcome contract | Inventory + Reward owner + security review |
| Hidden/secret Item | content + security/privacy review |
| Rights-sensitive asset | rights approver + publisher |
| New capability type | architecture ADR + consumer owner + security |
| Retirement with owned copies | platform publisher + affected owner review |
| Emergency quarantine | security or platform incident authority |

### Separation of duties

High-risk publication must not be author-approved by a single person. The system enforces role and actor separation where policy requires it.

### Scheduling console

Displays:

- due time in server and operator timezone;
- release channel and audience;
- approval freshness;
- dependency health;
- conflict with other scheduled recommended-pointer changes;
- scheduler claim and retry status;
- cancellation availability.

### Registry management

Platform administrators can:

- inspect schemas and compatibility;
- generate documentation;
- submit new registry entries;
- review consumers;
- deprecate entries;
- see every published Item using an entry;
- block retirement while references remain.

Registry editing is not available to ordinary content authors.

### Quarantine console

Emergency tooling must allow:

- selection of exact restrictions;
- incident linkage;
- safe placeholder selection;
- impact preview;
- one-command quarantine with mandatory audit;
- consumer acknowledgment tracking;
- recovery checklist;
- post-incident report export.

### Reconciliation console

Operators can run and inspect:

- published-manifest fingerprint verification;
- dependency resolution verification;
- lifecycle-state consistency;
- missing outbox Events;
- projector checkpoint gaps;
- search index comparison;
- cache invalidation comparison;
- asset status drift;
- consumer compatibility drift;
- replacement-cycle detection.

### Support tooling

Support can search by:

- Definition ID;
- version ID;
- stable key;
- public Item ID;
- Reward or Inventory reference ID if supplied by another Engine;
- publication actor;
- incident ID;
- asset ID.

Support sees redacted audit and cannot modify content.

### Import/export

Admin tooling may export a signed content package containing drafts or published manifests. Exported hidden content requires explicit authorization and watermarking. Import never bypasses validation and review.

### Operational safeguards

- destructive-looking actions require typed confirmation and reason code;
- retirement and quarantine show affected dependencies;
- bulk actions default to dry run;
- bulk jobs are resumable and per-entry auditable;
- direct SQL instructions are never presented as a normal repair path;
- all timestamps show UTC plus operator-local display;
- every status links to the authoritative lifecycle timeline.

---

## UX Requirements

### Narrative-first presentation

Items should communicate meaning and history, not only numerical attributes. Product surfaces SHOULD prioritize:

- recognizable name and icon;
- why the Item matters;
- how it was or can be obtained when disclosure permits;
- what it can be used for in plain language;
- collection, season, campaign, or story context;
- ownership and binding explanation;
- accessibility and safe imagery.

### Mechanical clarity

When mechanics are disclosed, clients must clearly explain:

- whether copies stack;
- maximum stack behavior;
- whether the Item is unique;
- duplicate-grant outcome;
- whether it becomes bound;
- whether it can be transferred or destroyed;
- whether it expires;
- whether it can be consumed;
- whether it must be equipped;
- whether a use action has prerequisites or cooldowns owned elsewhere.

Text must be generated from typed semantics where possible, not manually duplicated prose that may drift.

### Ownership distinction

Clients must distinguish:

- catalog Item Definition;
- owned Item Stack;
- owned Item Instance;
- equipped state;
- pending Reward fulfillment;
- unavailable or retired catalog status.

A catalog card must not imply ownership.

### Reward state distinction

When an Item is awarded, the UI should distinguish:

- Reward earned;
- Item fulfillment pending;
- Item added to Inventory;
- duplicate unique accepted as no-op;
- converted by Inventory policy;
- fulfillment failed and retrying.

Item Engine does not supply those states but its metadata must support clear presentation.

### Version transparency

Normal users do not need technical version IDs. Support and advanced details may show:

- release label;
- acquired version date;
- retired or legacy badge;
- replacement suggestion;
- safe explanation of differences.

The UI must not silently present a new version as if it were the exact historical version owned by the Character.

### Hidden Items

For hidden or secret Items:

- undisclosed names use a safe placeholder;
- image URLs must not reveal the secret;
- DOM, network payload, source maps, client bundles, analytics, and accessibility text must not contain hidden content;
- unauthorized detail requests return concealed behavior;
- acquisition may reveal the owner-safe version according to policy.

### Quarantined Items

Clients must use server-provided safe presentation policy:

- hide completely;
- show generic unavailable placeholder;
- show owned legacy placeholder;
- disable interaction;
- provide a neutral support message.

Incident details are not exposed publicly.

### Localization

- Locale fallback must be visible to clients.
- Name truncation rules must not corrupt meaning.
- Right-to-left layout is supported.
- Grammar-sensitive quantities are handled by clients or localization templates, not hardcoded English plurals.
- Mechanical values must be separately structured for localization.
- Unsupported locale must not cause hidden-content leakage.

### Accessibility

Every required visual asset must have:

- localized alt text or accessibility label;
- contrast-safe rarity indication not dependent on color alone;
- reduced-motion fallback for animated presentation;
- text equivalents for icons and badges;
- screen-reader ordering;
- no essential mechanics communicated only through image or sound.

### Loading and stale states

Catalog clients must handle:

- skeleton/loading;
- partial image failure with fallback;
- stale projection badge only where operationally relevant;
- exact detail unavailable;
- retired or replaced Item;
- locale fallback;
- ownership overlay lag.

### Sorting and filtering

Server supports stable sort modes such as:

- curated order;
- name;
- rarity presentation order;
- publication date;
- collection order.

Clients must not infer mechanical power from rarity or sort order unless explicitly declared.

### Error copy

User-facing errors should be safe and actionable:

- “This item is not currently available.”
- “Item details could not be loaded.”
- “This legacy item is still in your collection, but it can no longer be obtained.”

Do not expose internal lifecycle codes, schema names, incident IDs, or hidden Definition keys.

### Authoring UX

Authoring interfaces must:

- show source revision and unsaved changes;
- prevent accidental loss on conflict;
- render validation findings at exact fields;
- distinguish warnings from blockers;
- show mechanical and presentation fingerprints;
- make review package immutability obvious;
- explain why approval became stale;
- support accessible keyboard navigation;
- never mask a failed publication as success.

---

## Security

### Threat model

The Engine must defend against:

- unauthorized draft or publication changes;
- privilege escalation between author, reviewer, and publisher;
- stable-key squatting or Unicode confusion;
- hidden-content enumeration;
- malicious property or capability payloads;
- schema bypass;
- asset URL injection;
- arbitrary code or callback execution;
- dependency cycles and resource exhaustion;
- replayed commands and Events;
- idempotency-key collision attacks;
- cache poisoning;
- search index leakage;
- SSRF through asset or dependency references;
- XSS through localized content;
- SQL/NoSQL injection;
- oversized payload denial of service;
- audit tampering;
- insider direct database mutation;
- supply-chain compromise of imported content packages;
- compromised asset or rights metadata;
- cross-scope catalog access.

### Authentication

All write and internal exact-lookup APIs require strong authenticated identities. Service-to-service calls use workload identity and mutual authentication appropriate to platform standards.

### Authorization

Authorization considers:

- actor role;
- catalog scope;
- command type;
- risk level;
- Definition disclosure;
- lifecycle state;
- separation-of-duties policy;
- incident authority;
- consumer registration.

Authorization is evaluated server-side on every command and sensitive query.

### Least privilege

Roles are narrowly scoped:

- `ITEM_AUTHOR`;
- `ITEM_LOCALIZATION_EDITOR`;
- `ITEM_ASSET_EDITOR`;
- `ITEM_REVIEWER`;
- `ITEM_MECHANICS_REVIEWER`;
- `ITEM_PUBLISHER`;
- `ITEM_SECURITY_ADMIN`;
- `ITEM_SUPPORT_READ`;
- `ITEM_PLATFORM_ADMIN`;
- service-specific internal readers.

### Input validation

- Reject unknown JSON fields for commands.
- Apply maximum depth, array length, string length, and payload size.
- Normalize Unicode and stable keys.
- Validate URLs as registry references, never arbitrary fetch targets.
- Sanitize or render localized rich text through a restricted format.
- Forbid scripts, event handlers, embedded frames, and unsafe protocols.
- Validate every capability payload against exact schema.
- Validate numeric bounds and declared units.
- Reject non-finite or floating-point authoritative values.
- Detect dependency and replacement cycles.

### Hidden-content security

Hidden content must be absent from unauthorized:

- API responses;
- search documents;
- caches;
- logs;
- metrics labels;
- traces;
- Events;
- asset URLs;
- client bundles;
- error details;
- analytics payloads.

Security tests must attempt enumeration by ID, stable key, search term, locale fallback, asset ID, timing, and ETag behavior.

### Asset security

The Engine stores immutable asset references only. It must not fetch arbitrary author-provided URLs. Asset service responses are validated for:

- expected asset ID;
- content hash;
- moderation status;
- rights state;
- audience policy;
- safe content type.

Signed delivery URLs have short lifetime and audience binding where needed.

### Capability security

A capability registry entry defines:

- allowed producer;
- allowed consumer;
- schema;
- maximum payload;
- sensitivity;
- whether values may be public;
- deterministic limits;
- forbidden references;
- abuse cases;
- compatibility tests.

No generic `CUSTOM_SCRIPT`, `WEBHOOK`, `SQL`, or `EXPRESSION` capability is permitted.

### Idempotency security

Idempotency scope includes authenticated principal or service, route, and catalog scope. Response replay must not expose a result to a different principal. Keys are rate-limited and retained according to command risk.

### Database security

- Published content tables are immutable under application roles.
- No analyst or support role has write access.
- Break-glass database access is monitored, time-limited, and followed by integrity verification.
- Row-level or service-level scope controls prevent cross-scope authoring.
- Backups are encrypted and access audited.

### Audit integrity

Audit records should be append-only and forwarded to a tamper-evident security log. High-risk actions trigger alerts and require reason codes.

### Secrets

Secrets, credentials, tokens, private keys, signed URL secrets, and personal access tokens MUST NOT be stored in Item source, properties, capabilities, localizations, Events, or logs.

### Rate limiting

Apply separate limits for:

- public search;
- internal batch lookup;
- draft mutation;
- validation;
- publication;
- impact analysis;
- bulk import;
- reconciliation.

Expensive operations use queues and quotas.

### Supply-chain security

Imported packages require:

- approved schema version;
- provenance;
- cryptographic signature where applicable;
- content hash verification;
- malware-safe asset references;
- no direct publication;
- validation and review after import.

### Incident response

Security incidents may trigger:

- version quarantine;
- asset revocation;
- cache purge;
- search removal;
- acquisition blocking;
- interaction blocking;
- consumer alert;
- audit export;
- recovery validation.

All emergency actions remain reversible only through audited recovery commands.

---

## Privacy

### Data minimization

Item Definitions should contain no Character or User personal data. Content authors must not embed names, emails, student identifiers, private notes, or personal histories in published Item metadata unless a separately approved content process exists.

### Personal data processed

Operationally, the Engine may process:

- author, reviewer, publisher, support, and administrator IDs;
- authentication and authorization context;
- audit IP or device metadata if platform policy requires it;
- optional review notes;
- correlation and trace identifiers.

It does not require Character ownership data.

### Purpose limitation

Operational identities are used for:

- authorization;
- audit;
- incident response;
- change accountability;
- support and compliance.

They must not be repurposed for unrelated profiling.

### Public attribution

Author identities are not public by default. Creator credit, artist attribution, or licensed rights notices are separate explicit presentation fields and require consent or contractual basis.

### Review notes

Review notes may contain operational context and should be encrypted or access-restricted. Authors are instructed not to include unnecessary personal data.

### Data subject requests

If an operator identity is subject to access or deletion requests:

- immutable audit may retain pseudonymous actor identifiers under legitimate-interest or compliance policy;
- directly identifying profile data is resolved through Identity systems;
- Item historical integrity is preserved;
- published content is not deleted solely because an author account closes.

### Ownership privacy boundary

Item Engine MUST NOT expose who owns an Item. Catalog APIs may receive an audience class or owner-discovered token, but Character-level ownership comes from Inventory and must not be logged as catalog analytics unless explicitly approved.

### Hidden and sensitive content

Secret Items, moderation-sensitive assets, minors-oriented content, and embargoed releases are treated as confidential content even when they are not personal data.

### Retention

Recommended retention:

- published Definition versions and fingerprints: indefinite while referenced;
- lifecycle and high-risk audit: platform compliance period, typically long-lived;
- draft revisions: configurable, with longer retention after review or incident;
- validation findings: retained with the relevant review package;
- idempotency responses: risk-based limited retention;
- raw request logs: minimized and short-lived;
- encrypted review notes: policy-defined.

### Data location

Catalog content may be globally replicated. Operational identity and audit replication follows platform data-residency policy. Hidden content must not be replicated to regions or systems without a valid need.

### Analytics

Analytics Events use Definition and version IDs, not personal data. Author productivity analytics require separate governance and should not be derived from security logs by default.

### Privacy acceptance posture

A compliant implementation can operate Item Engine with no Character-level personal data and no synchronous ownership lookup.

---

## Performance

### Workload profile

The Engine is read-heavy:

- public catalog discovery;
- immutable exact manifest lookup;
- localized card lookup;
- authoring reads;
- comparatively low-volume draft writes and publication.

### Service-level objectives

Recommended initial production objectives under normal load:

| Operation | Target |
|---|---:|
| Cached exact manifest p95 | <= 20 ms service time |
| Authoritative exact manifest p95 | <= 100 ms |
| Public catalog search p95 | <= 250 ms excluding client network |
| Catalog detail p95 | <= 150 ms |
| Draft read p95 | <= 250 ms |
| Draft patch p95 | <= 300 ms |
| Synchronous command acknowledgment p95 | <= 500 ms excluding async validation |
| Publication transaction p95 | <= 1 s for bounded Definition size |
| Outbox publication p99 | <= 10 s |
| Exact cache propagation p99 | <= 30 s |
| Search projection propagation p99 | <= 120 s |
| Scheduled publication start lag p99 | <= 60 s |

These are targets, not correctness guarantees. Deployments may tighten them.

### Availability objectives

- Exact published lookup: 99.95% monthly target.
- Public catalog discovery: 99.9%.
- Authoring and publication: 99.9%, with correctness prioritized.
- Registry and high-risk admin writes may have lower availability but strict integrity.

### Caching

Published manifests are immutable and may use long TTL keyed by fingerprint. Recommended-pointer caches use short TTL plus Event invalidation. Presentation caches include overlay revision and audience.

### Cache stampede protection

Use:

- request coalescing;
- jittered TTL;
- stale-while-revalidate for non-authoritative presentation;
- bounded negative caching;
- circuit breakers around authoritative fallback.

### Database scaling

- Read replicas may serve immutable historical versions after replication safety checks.
- Primary handles drafts, publication, lifecycle, inbox, outbox, and exact latest state.
- Large JSON manifests should remain bounded and may be compressed at storage or cache layers.
- Child tables support selective queries and reverse dependencies.
- Partition audit/outbox by time if volume requires it.

### Search scaling

Search documents are denormalized by locale and audience class. Avoid one index document containing all secret and public fields. Reindex is resumable and versioned.

### Compilation performance

Validation and compilation are asynchronous when dependency count or localization volume exceeds synchronous limits. Compiled plans and registry snapshots are cacheable by source fingerprint.

### Bounded complexity

Publication validation enforces:

- maximum properties;
- maximum capabilities;
- maximum dependency depth;
- maximum dependency count;
- maximum localization size;
- maximum asset references;
- maximum replacement path length;
- maximum schema nesting;
- no prohibited cycles.

### Event throughput

Lifecycle Event volume is low, but projectors must tolerate bulk import or migration. Outbox dispatch is horizontally scalable using `SKIP LOCKED` or equivalent leases.

### Backpressure

Priority order:

1. exact runtime lookup;
2. lifecycle and quarantine propagation;
3. scheduled publication;
4. interactive authoring;
5. normal projection updates;
6. bulk validation/import;
7. reconciliation and reindex.

Low-priority jobs pause under pressure.

### Degraded modes

- Search unavailable: exact lookup continues; discovery returns explicit unavailable state or bounded database fallback.
- Cache unavailable: authoritative read-through with rate protection.
- Asset service unavailable: cached approved metadata serves existing content; publication blocks.
- Schema registry unavailable: compiled published content serves; new validation blocks.
- Event bus unavailable: outbox accumulates; publication remains committed and status warns of propagation lag.

### Capacity metrics

Track:

- total Definitions and published versions;
- versions per Definition;
- manifest size distribution;
- properties/capabilities/dependencies per version;
- QPS by query type;
- cache hit ratio;
- database read/write latency;
- search latency and error rate;
- outbox and projector lag;
- validation queue depth;
- schedule queue depth;
- bulk and reconciliation throughput.

### Performance testing

Release testing includes:

- exact lookup hot and cold cache;
- catalog search across locales;
- publication under projector lag;
- large but valid manifest;
- reverse dependency impact analysis;
- cache purge storm;
- bulk import and live-read isolation;
- quarantine propagation;
- search reindex while serving reads.

---
## Audit

### Audit objectives

The Engine must prove:

- who created or changed draft content;
- which exact source revision was validated;
- which registry and dependency snapshots were used;
- what reviewers saw and approved;
- who published, deprecated, retired, quarantined, recovered, or corrected content;
- which immutable fingerprints were committed;
- which Events were emitted;
- whether projectors and consumers observed the change;
- whether any repair or break-glass action occurred.

### Audited actions

At minimum:

- stable-key reservation and conflict;
- Definition creation;
- draft creation, update, import, clone, and logical deletion;
- validation start and result;
- review submission and invalidation;
- reviewer decision;
- publication schedule, cancellation, attempt, success, and failure;
- recommended-pointer change;
- deprecation and retirement;
- quarantine and recovery;
- replacement declaration;
- erratum application;
- registry creation, activation, deprecation, and retirement;
- bulk job creation and cancellation;
- reconciliation and repair;
- support access to hidden or quarantined content;
- export of confidential content;
- break-glass database or operational access.

### Audit record requirements

Each record includes:

- globally unique audit ID;
- action type;
- resource type and ID;
- actor type and ID;
- effective roles and catalog scope;
- authorization decision context;
- command and idempotency identifiers;
- correlation and trace identifiers;
- before and after fingerprints where applicable;
- reason code;
- timestamp from trusted server clock;
- source channel and client identifier;
- redacted metadata;
- outcome.

### Audit immutability

Audit records are append-only. Corrections add a new record referencing the earlier record. High-risk records are forwarded to tamper-evident security storage.

### Content diff retention

The review package retains normalized semantic diffs. Raw draft diffs may be retained according to policy. Secrets and personal data must be redacted or prohibited at source.

### Event-to-audit linkage

Every produced lifecycle Event carries or is resolvable to:

- command ID;
- correlation ID;
- aggregate sequence;
- publication sequence;
- audit record ID.

### Observability

#### Metrics

Core metrics include:

- `item_definition_created_total`;
- `item_draft_updated_total`;
- `item_validation_runs_total{status}`;
- `item_validation_duration_seconds`;
- `item_review_packages_total{status}`;
- `item_publications_total{status}`;
- `item_publication_duration_seconds`;
- `item_scheduled_publication_lag_seconds`;
- `item_versions_total{status,type}` with bounded labels;
- `item_outbox_lag_seconds`;
- `item_inbox_lag_seconds`;
- `item_projector_lag_sequences`;
- `item_search_projection_lag_seconds`;
- `item_cache_hit_ratio`;
- `item_exact_lookup_duration_seconds`;
- `item_catalog_search_duration_seconds`;
- `item_dependency_breaks_total`;
- `item_consumer_compatibility_violations_total`;
- `item_quarantined_versions`;
- `item_errata_total`;
- `item_reconciliation_findings_total{type,severity}`.

Definition IDs, stable keys, author IDs, Character IDs, and hidden-content names MUST NOT be unbounded metric labels.

#### Logs

Structured logs include:

- operation name;
- command or Event ID;
- correlation and trace IDs;
- resource ID when classification permits;
- lifecycle state;
- outcome and stable error code;
- duration;
- retry count;
- no full hidden payloads or localized descriptions.

#### Traces

Trace spans cover:

- API authorization;
- idempotency lookup;
- aggregate load;
- validation phases;
- dependency resolution;
- compilation;
- publication transaction;
- outbox dispatch;
- projector application;
- cache and search operations.

### Alerts

Alert on:

- scheduled publication overdue beyond SLO;
- outbox lag beyond threshold;
- projector sequence gap;
- exact lookup error-rate increase;
- search leakage test failure;
- broken asset or dependency affecting published Items;
- incompatible consumer for an active capability;
- unexpected published-row mutation attempt;
- quarantine spike;
- reconciliation finding of fingerprint mismatch;
- audit forwarding failure;
- stable-key collision anomaly;
- repeated unauthorized hidden-content access.

### Reconciliation

Required recurring jobs:

1. recompute and compare published fingerprints;
2. verify immutable row and child-row consistency;
3. verify recommended pointer resolves to compatible lifecycle state;
4. verify reverse dependency index;
5. verify asset approval and rights status;
6. verify schema and capability registry references;
7. verify no replacement cycles;
8. verify outbox lifecycle Events exist;
9. verify projector checkpoints and catalog counts;
10. sample compare search documents with authoritative disclosure;
11. verify erratum overlays preserve mechanical fingerprint;
12. verify quarantine restrictions propagated.

### Repair policy

Automatic repair may:

- rebuild projections;
- reindex search;
- repopulate caches;
- redispatch existing outbox Events;
- fix missing derived reverse-dependency rows from immutable source;
- resume stuck jobs.

Automatic repair may not:

- alter published mechanical content;
- invent missing approval;
- change lifecycle without a command;
- replace a stable key;
- mutate Inventory;
- delete audit.

### Operational dashboards

Dashboards provide:

- publication pipeline funnel;
- queue and scheduler health;
- exact lookup and catalog SLOs;
- cache and search freshness;
- registry compatibility;
- dependency health;
- quarantines and incidents;
- reconciliation trend;
- top validation finding categories without content leakage.

---

## Edge Cases

### Duplicate key reservation

Two actors reserve the same normalized stable key concurrently. The unique constraint selects one winner. The loser receives `ITEM_STABLE_KEY_CONFLICT`. Case and Unicode confusables normalize before comparison.

### Key reservation expires while draft exists

If policy permits expiring unpublished reservations, a created Definition converts the reservation to `ACTIVE`; it no longer expires. A reservation without a Definition may expire and be re-reserved only if no publication or retained protected draft exists.

### Draft update races with review submission

Both commands require expected source revision. Exactly one commits. If review wins, later update returns conflict and must create a new revision, making the review stale.

### Registry changes after validation

A validation result pins a registry snapshot. If an entry is quarantined or a breaking compatibility status changes before publication, publication recheck fails and requires revalidation.

### Dependency is retired after approval

Publication rechecks critical dependencies. The command fails with `ITEM_DEPENDENCY_UNRESOLVED` or an approved historical-reference exception. Approval may remain but is marked blocked.

### Scheduled publication and emergency quarantine

If the draft's required asset or dependency is quarantined before due time, the scheduler does not publish. It marks the schedule blocked and emits an operational finding.

### Publication response lost after commit

The client retries with the same idempotency key. The service returns the committed immutable version and does not allocate another version number.

### Outbox unavailable after publication commit

The outbox row is in the same transaction, so it exists. Dispatcher retries until published. Authoritative exact lookup succeeds while consumers may lag.

### Search indexes a hidden Item publicly

Disclosure reconciliation detects mismatch, purges the document, alerts security, and opens an incident. Hidden payload exposure is treated as a security event.

### Exact public lookup guesses hidden version ID

The endpoint returns concealed `404` behavior with no timing or ETag distinction. Internal service lookup requires service authorization.

### Missing locale

The server applies policy-defined fallback only if the fallback content is authorized for the audience. Otherwise it returns a safe placeholder or omits the Item.

### Rights expire for an asset

A rights Event triggers impact analysis. Policy may apply a safe asset erratum or quarantine presentation. Mechanical semantics remain unchanged.

### Asset bytes change under same asset ID

This violates the asset contract. Content-hash mismatch causes quarantine or serving rejection and a security alert. Immutable asset versions cannot change bytes.

### New version changes stack mode

Allowed only as a new Item Definition Version. Existing Inventory remains pinned to old semantics. Inventory may reject merge across versions. Migration requires an Inventory-owned job.

### New version changes uniqueness scope

Allowed only with high-risk review. Existing ownership is not retroactively collapsed or duplicated. Migration policy is explicit and outside Item Engine execution.

### Stack quantity exceeds new max

Existing old-version stacks remain valid under old semantics. New grants pinned to the new version follow new max. No silent split or truncation occurs in Item Engine.

### Reward references recommended key instead of version

Reward publication validation resolves and pins the exact Item version. Runtime moving references are rejected.

### Reward committed before Item retirement but fulfilled after

Item validation applies `historical_fulfillment_policy`. If allowed and the commit time is trustworthy, Inventory may fulfill the pinned version. Otherwise Reward receives a stable failure.

### Reward requested after retirement

Ordinary acquisition is rejected according to lifecycle policy. Item Engine does not create a replacement grant automatically.

### Duplicate unique acquisition

Item Engine returns uniqueness and duplicate policy. Inventory inspects ownership and decides accepted no-op, rejection, or registered conversion. Item Engine cannot decide without ownership state.

### Consumable references retired Reward Definition

Publication or reconciliation identifies dependency status. New Item publication fails. Existing consumable interaction follows the registered consumer policy; Item Engine does not mutate owned copies.

### Capability consumer is downgraded

Compatibility matrix marks active Items at risk. New publication requiring the unsupported contract blocks. Existing content may trigger interaction disablement or quarantine according to policy.

### Unknown capability in imported package

Import creates a draft with blocking validation finding. No runtime content or Event is produced.

### Arbitrary callback URL in capability payload

Schema rejects it unless the capability explicitly supports a registry-managed endpoint reference. Raw URLs are prohibited.

### Replacement cycle

`A -> B`, `B -> C`, then `C -> A` is rejected by cycle validation.

### Replacement target retired

The relation remains historical but recommendation becomes invalid. Reconciliation raises a finding; a new replacement command is required.

### Definition has multiple variants

Each variant remains an independent Definition. Family membership aids display and compatibility but does not merge ownership.

### Edition ends

The Item disappears from that Edition's active discovery view, but Item versions remain published and owned copies remain intact.

### Season ends while Item remains generally available

Season association ends; catalog availability follows its own lifecycle and distribution policy.

### Definition quarantined while equipped

Item Engine emits restrictions. Inventory/Equipment or Character presentation owner decides how to suppress use or display. The owned instance is not deleted.

### Quarantine recovery with stale caches

Recovery and quarantine Events use publication sequence and lifecycle revision. Consumers apply only newer revisions. Cache keys include lifecycle revision or are purged.

### Erratum attempts mechanical change

Mechanical fingerprint verification fails; command is rejected and a new version is required.

### Two errata race

Overlay revision uses optimistic concurrency. One commits; the other retries against the new effective presentation.

### Public name collides with another Item

Allowed unless product policy forbids it. Stable identity remains key and version ID. Authoring may warn about confusion.

### Stable key typo after publication

The key cannot be renamed. A new Definition plus replacement relation may be created. Aliases, if introduced, require an ADR and cannot hide identity changes.

### Definition cloned across scopes

The clone receives a new Definition ID and stable key in the target scope. It records provenance but does not share lifecycle or ownership identity.

### Module scope retired

Published versions remain resolvable for history. New authoring and ordinary acquisition may be blocked. Platform-owned Character Items are not deleted.

### Character closes or anonymizes

Item Engine has no ownership state to mutate. Inventory and Character lifecycle owners handle Character-scoped data.

### Database read replica lags publication

Exact lookup for a newly published version routes to primary or waits for a safe replication watermark. It must not return not found from a known-stale replica.

### Cache contains retired acquisition policy

Lifecycle cache invalidation uses revisioned Events. Acquisition validation may bypass cache for high-risk lifecycle checks or include maximum staleness. A stale allow must not override authoritative retirement.

### Search unavailable during publication

Publication commits and outbox dispatches. Search projector retries. Authoring UI shows published with discovery lag, not failure.

### Validation worker crashes

The job lease expires. Another worker resumes or reruns from the immutable source and registry snapshot. Duplicate results coalesce by unique key.

### Publication scheduler crashes after claim

Lease expires. Another worker checks idempotency and lifecycle before publishing. At most one version is created.

### Bulk publication partially fails

Each Definition has an independent outcome. Successful publications remain committed. The job summary reports partial success; there is no unsafe global rollback.

### Reconciliation finds fingerprint mismatch

The version is quarantined from new acquisition, security and platform operators are alerted, and forensic comparison starts. Repair cannot overwrite the authoritative published row.

### Database administrator changes published row

Immutability triggers and monitoring should block or alert. If a break-glass mutation occurs, fingerprint reconciliation detects it and incident procedure restores from trusted backup or immutable evidence.

### Very large localization bundle

Publication rejects content beyond bounds or requires an approved external localization reference. Runtime payload remains bounded.

### Rich text contains script

Sanitization and schema validation reject unsafe nodes. Stored source is not rendered as raw HTML.

### Search query probes secret term timing

Secret Items are absent from the public index, so query timing and counts do not depend on secret matches.

### Item Type registry entry retired

Existing versions remain interpretable. New drafts using it are blocked or warned according to policy. Physical schema deletion is prohibited.

### Consumer requests unknown include field

Internal API rejects the request rather than silently omitting security-sensitive data.

### Batch exact lookup contains duplicate IDs

The service may deduplicate internally but returns one result per requested position and applies bounded cost.

### Batch exact lookup mixes authorized and unauthorized scopes

Each entry is authorized independently. The response avoids leaking concealed resources and does not fail open because another entry is valid.

### Client sends floating-point quantity

Acquisition reference validation rejects it. Quantities are integers.

### Client sends display name as Item reference

Rejected. Only stable key for authoring resolution or immutable version ID for runtime is accepted.

### Time boundary at scheduled publication

Server time and half-open interval semantics apply. A single scheduler claim commits once. Client timezone does not affect the decision.

### Clock skew between services

Lifecycle Events carry authoritative occurred time and sequence. Consumers order by sequence, not local arrival timestamp.

### Event delivered out of order

Projectors compare aggregate/lifecycle revision and publication sequence. Older Events cannot overwrite newer state.

### Event replay after projection rebuild

Projector inbox and sequence checks produce the same projection without duplicate effects.

### Unknown Event version

Consumer quarantines the message or routes to dead letter according to compatibility policy. It does not guess payload semantics.

### Item manifest references itself mechanically

Rejected unless the capability registry explicitly allows a non-recursive self marker. General dependency self-reference is prohibited.

### Cross-Item dependency depth exceeds limit

Validation fails with a path and limit finding to prevent resource exhaustion.

### Tag registry deprecates a tag

Existing versions retain it. New content is warned or blocked. Search can map deprecated tags but does not rewrite immutable manifests.

### Rarity presentation changes globally

If rarity key presentation is registry-owned and not mechanical, clients may update presentation. The Item version still stores the key. Mechanical behavior must not derive implicitly from display color.

### Safe placeholder unavailable during quarantine

The Item is hidden rather than serving the unsafe original asset. Fail closed.

### Owner-visible capability is requested publicly

The public projection omits it. Internal and owner endpoints evaluate authorization separately.

### Audit storage unavailable

High-risk write commands fail closed unless audit is transactionally persisted locally and forwarded later. Publication cannot proceed without durable local audit.

### Analytics unavailable

No command or query correctness depends on analytics.

### Import package signature invalid

The package is rejected before draft creation, and the attempt is audited.

### Old SDK sends deprecated field

API compatibility policy either accepts and normalizes it during a documented window or rejects with a stable error. It never maps ambiguously.

### Definition version effective window ends

Exact lookup remains available. New acquisition policy follows lifecycle/effective rules. Existing ownership remains.

### Published Item has no icon

Allowed only if Item Type and presentation policy permit a default approved placeholder. Required asset rules otherwise block publication.

### Item declares transferable and character-bound-on-acquire

Registry cross-field validation rejects the contradictory combination unless a supported unbind contract exists.

### Non-stackable Item declares max stack

Validation rejects the meaningless field.

### Virtual unique Item declares quantity 500 in Reward

Item Engine validates Definition semantics; Inventory applies duplicate/no-op policy. Reward authoring should warn that quantity greater than one is semantically redundant or invalid according to the registered contract.

### Item version used by active Quest is retired

Impact analysis warns and retirement governance decides new-reference and historical behavior. Quest state is not mutated by Item Engine.

### Item Definition is deleted from search but exact owned presentation is needed

Owner or internal exact lookup can still resolve the immutable version under retirement/quarantine presentation policy.

### Region partition

Read-only replicas serve cached immutable versions. Publication remains in authoritative region. No split-brain version allocation occurs.

---

## Acceptance Tests

The following tests are normative release criteria. IDs are stable and should map to automated test suites, contract tests, migration tests, security tests, and operational drills.

### Definition identity and keys

1. Creating a Definition with a new normalized key succeeds.
2. Creating a second Definition with the same key and scope fails.
3. Key comparison is case-insensitive according to normalization policy.
4. Unicode confusable key collision is rejected.
5. A published key cannot be renamed.
6. A retired key cannot be reused.
7. Display-name duplication does not change identity.
8. A key in a different authorized scope may coexist if policy permits.
9. Unauthorized scope key reservation is rejected.
10. Concurrent key reservation produces exactly one winner.
11. Definition ID remains immutable across every version.
12. Version IDs are globally unique.

### Draft concurrency and idempotency

13. Draft creation with the same idempotency key returns the same draft.
14. Reusing the idempotency key with a different request returns conflict.
15. Draft patch with the correct expected revision succeeds.
16. Draft patch with a stale revision fails with no partial mutation.
17. Concurrent patches increment revision exactly once for the winner.
18. Unknown draft fields are rejected.
19. Editing a reviewed source marks the review stale.
20. Validation result is tied to exact source revision.
21. Duplicate validation command coalesces to one logical run.
22. Lost command response is recovered through idempotency lookup.
23. Draft source size limit is enforced.
24. Draft logical deletion cannot delete a published descendant.

### Type and property validation

25. Active registered Item Type is accepted.
26. Unknown Item Type is rejected.
27. Retired Item Type is blocked for new publication.
28. Required property schema is enforced.
29. Unknown property key is rejected.
30. Wrong property primitive type is rejected.
31. Numeric lower bound is enforced.
32. Numeric upper bound is enforced.
33. Unit declaration is enforced.
34. Precision declaration is enforced.
35. Floating-point authoritative value is rejected.
36. Non-finite numeric value is rejected.
37. Enum value outside registry is rejected.
38. Cross-field property invariant is enforced.
39. Property default normalization is deterministic.
40. Same normalized source produces same mechanical fingerprint.
41. Property order does not change fingerprint.
42. Irrelevant JSON whitespace does not change fingerprint.

### Inventory semantics

43. `NON_STACKABLE` requires instance ownership.
44. `NON_STACKABLE` with max stack is rejected.
45. `STACKABLE` requires positive max stack.
46. `STACKABLE` max stack zero is rejected.
47. `STACKABLE` merge fields must be registered.
48. `VIRTUAL_UNIQUE` requires uniqueness scope.
49. `VIRTUAL_UNIQUE` requires duplicate acquisition policy.
50. Unsupported uniqueness scope is rejected.
51. Unsupported duplicate policy is rejected.
52. Binding and transfer contradiction is rejected.
53. Destruction policy is required when applicable.
54. Expiration capability validates against Inventory contract.
55. Durability capability validates against Inventory contract.
56. Inventory manifest fingerprint is stable.
57. Item Engine acquisition validation does not query Character ownership.
58. Item Engine does not create Inventory rows.
59. Item Engine does not decide duplicate unique ownership result.
60. Runtime quantity must be an integer.

### Capability registry and payloads

61. Active registered capability with valid payload publishes.
62. Unknown capability type is rejected.
63. Wrong capability schema version is rejected.
64. Capability payload above limit is rejected.
65. Required capability for Item Type is enforced.
66. Forbidden capability for Item Type is rejected.
67. Capability consumer owner is included in manifest.
68. Capability execution owner is included in manifest.
69. Arbitrary callback URL is rejected.
70. Script field is rejected.
71. SQL field is rejected.
72. Unrestricted expression field is rejected.
73. Capability dependency is snapshotted.
74. Capability mechanical payload contributes to fingerprint.
75. Presentation-only capability hint does not alter mechanical fingerprint when registry says non-mechanical.
76. Consumer incompatibility blocks publication when severity is blocking.
77. Compatibility warning is visible in review package.
78. Existing published version remains readable after capability schema retirement.

### Assets and localization

79. Required approved icon permits publication.
80. Unapproved required asset blocks publication.
81. Quarantined asset blocks new publication.
82. Asset content hash is persisted.
83. Asset role uniqueness is enforced.
84. Missing optional asset uses approved fallback.
85. Missing required locale blocks publication under strict policy.
86. Optional locale omission follows fallback policy.
87. Unauthorized fallback content is not returned.
88. Unsafe rich text is rejected.
89. Script markup is rejected.
90. Accessibility label requirement is enforced.
91. Presentation fingerprint changes when localized text changes.
92. Mechanical fingerprint does not change for permitted presentation-only change.
93. Rights expiry is captured in dependency impact view.
94. Hidden Item asset is absent from public projection.
95. Secret name is absent from public search index.
96. Safe placeholder contains no secret metadata.

### Dependency graph

97. Pinned existing dependency resolves.
98. Missing required dependency blocks publication.
99. Optional missing dependency produces configured warning.
100. Mutable latest reference is rejected for mechanical semantics.
101. Recommended-at-publication reference resolves and pins.
102. Direct self-dependency is rejected.
103. Prohibited multi-node dependency cycle is rejected.
104. Dependency depth limit is enforced.
105. Dependency count limit is enforced.
106. Reverse dependency view contains the published reference.
107. Retired dependency blocks publication according to policy.
108. Quarantined dependency blocks publication.
109. Presentation-only tag query is excluded from mechanical fingerprint.
110. Dependency fingerprint is persisted where required.

### Review and approval

111. Valid draft can be submitted for review.
112. Invalid draft cannot be submitted.
113. Review package is immutable.
114. Review package contains exact source revision.
115. Review package contains mechanical diff.
116. Review package contains presentation diff.
117. Required reviewer can approve.
118. Unauthorized reviewer is rejected.
119. Separation-of-duties rule prevents sole self-approval.
120. Rejection requires reason code.
121. Editing after approval invalidates approval.
122. Registry invalidation can stale approval.
123. Approval references exact full fingerprint.
124. Publication with mismatched fingerprint is rejected.

### Publication

125. Approved valid draft publishes successfully.
126. Publication creates immutable version ID.
127. Publication increments version number once.
128. Publication allocates unique publication sequence.
129. Manifest, lifecycle, audit, and outbox commit atomically.
130. Duplicate publication retry returns the original version.
131. Duplicate retry does not increment version number.
132. Publication with stale source revision fails.
133. Publication with incomplete approvals fails.
134. Publication with unresolved dependency fails.
135. Published content is exact-lookup readable immediately in authoritative region.
136. Published version rows reject update.
137. Published version rows reject delete.
138. Child mechanical rows cannot be silently mutated by application role.
139. Recommended pointer may be set during publication.
140. Changing recommended pointer does not modify version content.
141. Older pinned references remain valid after recommendation changes.
142. Outbox retry preserves Event ID.
143. Event bus outage leaves durable outbox entry.
144. Search failure does not roll back publication.

### Scheduled publication

145. Approved draft can be scheduled for a future time.
146. Past schedule time is rejected or normalized according to policy.
147. Client timezone does not control publication.
148. Due schedule publishes once.
149. Two workers claiming the same schedule produce one publication.
150. Scheduler crash after claim is recoverable.
151. Cancelled schedule does not publish.
152. Schedule cannot be cancelled after commit.
153. Dependency quarantine before due time blocks publication.
154. Stale approval before due time blocks publication.
155. Schedule status exposes retryable failure.
156. Publication start lag metric is emitted.

### Events and projections

157. `item.definition.published.v1` uses canonical envelope.
158. Published Event contains immutable version ID.
159. Published Event contains fingerprints.
160. Published Event excludes hidden localization body.
161. Duplicate Event produces one projector effect.
162. Out-of-order older lifecycle Event cannot overwrite newer state.
163. Projection rebuild is deterministic.
164. Projector checkpoint advances atomically with projection write.
165. Projector crash after write before acknowledgment is replay-safe.
166. Search projection includes only authorized fields.
167. Cache key includes fingerprint or revision.
168. Retirement Event invalidates acquisition-policy cache.
169. Quarantine Event propagates restrictions.
170. Unknown Event version is not guessed.
171. Dead-letter state is observable.
172. Catalog response includes freshness metadata.

### Exact lookup and API

173. Exact lookup by published version succeeds.
174. Exact lookup by unknown version returns stable not-found error.
175. Public lookup of secret version is concealed.
176. Internal exact lookup requires service authorization.
177. ETag returns `304` when fingerprint matches.
178. Batch exact lookup preserves request positions.
179. Batch size limit is enforced.
180. Duplicate IDs in batch do not duplicate backend work unboundedly.
181. Recommended resolution returns exact pinned version.
182. Runtime API rejects display name as reference.
183. Runtime API rejects draft version.
184. Acquisition validation returns catalog semantics only.
185. Acquisition validation does not expose private author data.
186. Deprecated version returns warning or policy result.
187. Retired version applies historical fulfillment policy.
188. Quarantined version fails closed.
189. Unknown include field is rejected.
190. Cursor is opaque and tamper-resistant.

### Deprecation, retirement, and replacement

191. Published version may be deprecated with authorization.
192. Deprecation preserves exact lookup.
193. Deprecation does not mutate Inventory.
194. Retirement requires impact report.
195. Retirement preserves historical manifest.
196. Retirement blocks ordinary new acquisition when configured.
197. Retirement does not delete owned copies.
198. Historical committed Reward may be allowed by explicit policy.
199. Post-retirement Reward reference is rejected under block policy.
200. Replacement relation cannot target the same Definition.
201. Replacement cycle is rejected.
202. Replacement does not migrate Inventory.
203. Replacement target must exist.
204. Retired replacement target raises reconciliation finding.
205. Recommended routing may prefer replacement without changing old references.
206. Existing owned presentation resolves under retirement policy.

### Quarantine and errata

207. Authorized emergency quarantine succeeds.
208. Unauthorized quarantine is rejected.
209. Quarantine records incident ID and restrictions.
210. Quarantine does not delete Definition or Inventory.
211. Public discovery obeys quarantine restriction.
212. New acquisition obeys quarantine restriction.
213. Interaction restriction is emitted for consumer enforcement.
214. Recovery requires revalidation and approval.
215. Older recovery Event cannot override later quarantine revision.
216. Presentation erratum with unchanged mechanics succeeds.
217. Erratum changing mechanical field is rejected.
218. Erratum revision is monotonic.
219. Erratum history remains auditable.
220. Erratum invalidates presentation cache.
221. Erratum leaves mechanical fingerprint unchanged.
222. Missing safe placeholder causes hide behavior, not unsafe fallback.

### Editions and classification

223. Edition pins exact Item version IDs.
224. Edition cannot include drafts.
225. Edition activation does not mutate Item versions.
226. Edition end does not retire Items.
227. Tag assignment validates against registry.
228. Deprecated tag remains on historical version.
229. Unknown rarity key is rejected.
230. Rarity presentation does not implicitly alter mechanics.
231. Variant family does not merge Definition identity.
232. Collection membership is declarative only.
233. Item Engine does not calculate collection completion.
234. Seasonal association does not create ownership.

### Security

235. Unauthenticated authoring request is rejected.
236. Unauthorized scope write is rejected.
237. Support role cannot mutate draft.
238. Author cannot publish without publisher role.
239. Hidden content is absent from unauthorized response body.
240. Hidden content is absent from public search document.
241. Hidden content is absent from logs.
242. Hidden content is absent from metric labels.
243. Secret asset URL is not exposed publicly.
244. SSRF-style asset URL input is rejected.
245. Oversized capability payload is rejected.
246. Excessive schema nesting is rejected.
247. Idempotency replay is scoped to principal.
248. Different principal cannot retrieve another principal's idempotent response.
249. SQL injection payload is treated as data and rejected where invalid.
250. XSS payload is sanitized or rejected.
251. Audit record is produced for publication.
252. Audit record is produced for hidden-content support access.
253. Break-glass access triggers alert.
254. Published-row mutation attempt triggers alert.
255. Invalid import signature is rejected.
256. Imported package never publishes directly.

### Privacy

257. Item manifest contains no Character ownership data.
258. Public API contains no author identity by default.
259. Operational audit identity is access-restricted.
260. Review note encryption or restriction is enforced.
261. Catalog analytics can operate without Character IDs.
262. Owner overlay is not persisted by Item Engine.
263. Data export of hidden content requires elevated authorization.
264. Account closure of an author does not destroy published history.

### Performance and resilience

265. Cached exact lookup meets configured load target.
266. Cold exact lookup remains bounded.
267. Cache outage falls back safely with rate protection.
268. Search outage does not affect exact lookup.
269. Asset registry outage blocks new publication but not cached published reads.
270. Schema registry outage blocks new validation but not compiled reads.
271. Event bus outage accumulates outbox safely.
272. Read replica lag does not produce false not-found after publication.
273. Cache stampede is bounded.
274. Large valid manifest remains within publication SLO or is processed asynchronously.
275. Validation jobs resume after worker crash.
276. Bulk jobs do not starve exact lookup.
277. Quarantine propagation is prioritized over bulk reindex.
278. Search reindex can run while catalog remains available.
279. Projection lag is observable.
280. Service rejects payloads over maximum before expensive processing.

### Audit and reconciliation

281. Reconciliation recomputes identical published fingerprint.
282. Fingerprint mismatch creates critical finding.
283. Reconciliation cannot overwrite published mechanics.
284. Missing search document can be rebuilt.
285. Unauthorized public search field is removed and alerts security.
286. Missing cache entry can be repopulated.
287. Missing outbox dispatch can be retried with same Event ID.
288. Reverse dependency projection can be rebuilt.
289. Replacement cycles are detected in reconciliation.
290. Asset rights drift is detected.
291. Consumer compatibility drift is detected.
292. Erratum mechanical-fingerprint preservation is verified.
293. Lifecycle impossible state is detected.
294. Repair action is independently audited.
295. Report-only reconciliation changes no state.
296. Bulk repair reports per-entry outcomes.

### Ownership boundaries

297. Item Engine has no API to grant an Item to a Character.
298. Item Engine has no API to equip an Item.
299. Item Engine has no API to consume an Item.
300. Item Engine has no API to transfer an Item.
301. Item Engine has no API to set Inventory quantity.
302. Reward Engine references exact Item version but does not write Item catalog.
303. Inventory Engine consumes manifest but remains the sole ownership writer.
304. Character Engine consumes presentation metadata but remains profile-state owner.
305. Quest Engine may pin Item version but cannot mutate catalog.
306. Talent Engine may pin Item metadata but cannot mutate catalog.
307. Season Engine association does not mutate Item version.
308. Marketplace or commerce state is absent from Item aggregate.
309. Analytics cannot act as write source.
310. Direct foreign-engine database writes are denied.

### End-to-end scenarios

311. Author creates, validates, reviews, publishes, and discovers a cosmetic Item.
312. Reward pins the published cosmetic version and Inventory grants a unique ownership no-op safely on retry.
313. Author publishes a stackable consumable with a registered use contract and Inventory enforces stack semantics.
314. New Item version changes presentation while old owned copies remain historically resolvable.
315. New Item version changes stack semantics and old Inventory remains pinned to old version.
316. Item is deprecated, replacement declared, and new authoring resolves to replacement without mutating existing references.
317. Item is retired after impact review and historical committed Reward follows declared policy.
318. Compromised asset triggers quarantine, safe placeholder, cache purge, consumer restriction, and audited recovery.
319. Hidden seasonal Item activates without leaking before embargo and becomes discoverable at authoritative time.
320. Bulk publication partially fails and successful Items remain committed with complete per-entry audit.
321. Search index is rebuilt from immutable manifests with identical audience filtering.
322. Database recovery restores published fingerprints and publication sequence integrity.
323. Consumer contract downgrade blocks new incompatible publication and raises operations alert.
324. Item Definition replacement cycle attempt is rejected before commit.
325. Full system replay of Item lifecycle Events produces the same catalog projections without duplicate logical effects.

---

## Future Extensions

Future capabilities require explicit ownership analysis and often separate RFCs.

### Procedural Item instances

Support deterministic generated affixes, seeds, provenance, and instance schemas. Item Engine may own generator Definitions, while Inventory owns generated instance results. This requires replay, fairness, disclosure, and migration rules.

### Equipment Engine

A dedicated Equipment Engine may own slot state, loadouts, compatibility evaluation, and equipped effects. Item Engine would continue to define equipment capabilities and immutable metadata.

### Crafting definitions

A Recipe Engine may define inputs, outputs, substitutions, stations, durations, and success policy using pinned Item versions. Inventory would reserve and mutate ownership.

### Loot tables

A Loot Engine may own deterministic or random selection Definitions, probability governance, pity systems, audit, and regulation compliance. Item Engine only supplies referenced Item content.

### Item transformation

Versioned transformation contracts could convert one owned Item to another through Inventory-owned atomic operations and a dedicated orchestration owner.

### Instance customization

Dyes, names, engravings, skins, and mutable instance attributes require an Inventory-owned customization model with content moderation and versioned schemas.

### Durability and repair

If needed, Inventory or Equipment may own per-instance durability and repair operations, consuming Item capability contracts.

### Expiration and decay

Inventory may add exact per-stack or per-instance expiry, decay, and grace behavior. Item Engine declares capability, not timers.

### Trading and marketplace

A marketplace may consume transferability and binding facts but owns listings, escrow, fraud, pricing, settlement, and policy.

### Physical-digital twins

Physical serial numbers, NFC, certificates, and custody require dedicated provenance and logistics capabilities.

### Cryptographic provenance

Signed Item manifests, transparency logs, and independently verifiable ownership receipts may be added for high-trust use cases.

### Regional presentation

Region-specific rights, age ratings, assets, and text may use explicit audience routes while retaining one mechanical version where semantics truly remain identical.

### Dynamic availability rules

A dedicated LiveOps Engine may control discovery and acquisition windows. It must reference immutable Item versions and not alter them.

### Alias registry

Stable-key aliases for legacy integrations may be introduced only through an ADR because aliases can create ambiguity and security risks.

### Schema evolution tooling

Automated draft migrations and compatibility proof generation may reduce authoring cost while preserving explicit publication.

### Catalog federation

Multiple catalog scopes may federate immutable manifests under platform governance. Cross-scope trust, key collision, contract compatibility, and publication authority require an ADR.

### Rights automation

Rights expiry and territory policy may integrate with a rights service to schedule safe presentation changes or quarantine.

### Content experimentation

Presentation experiments may route different presentation bundles without changing mechanical identity. Experiment assignment remains outside Item Engine and must not leak hidden content.

### Advanced collection semantics

Collection Engine may support version families, legacy completion, substitutions, and edition-specific sets using Item membership declarations.

### Item knowledge graph

A read-only graph may support discovery, narrative links, provenance, and recommendations. It must not become the mechanical source of truth.

---

## ADR References

The following ADRs exist or should be created. Numbers are placeholders until the repository ADR index assigns canonical identifiers.

| ADR | Decision |
|---|---|
| ADR-001 | Platform First: Item Engine remains domain-agnostic. |
| ADR-002 | Event-Driven Engine communication with transactional outbox. |
| ADR-003 | Platform-owned Character identity. |
| ADR-ITEM-001 | Separate Item Definition ownership from Inventory ownership. |
| ADR-ITEM-002 | Immutable published Item Definition Versions. |
| ADR-ITEM-003 | Stable keys are permanently reserved and never reused. |
| ADR-ITEM-004 | Runtime references pin immutable version IDs. |
| ADR-ITEM-005 | Registered typed capability contracts; no arbitrary code. |
| ADR-ITEM-006 | Inventory Engine owns stacks, instances, quantity, equipment, transfer, and consumption. |
| ADR-ITEM-007 | Reward Engine owns grant decision; Inventory owns Item fulfillment. |
| ADR-ITEM-008 | Search and catalog cards are non-authoritative projections. |
| ADR-ITEM-009 | Mechanical and presentation fingerprints are separated. |
| ADR-ITEM-010 | Presentation errata cannot change mechanical semantics. |
| ADR-ITEM-011 | Retirement and quarantine never delete owned Inventory. |
| ADR-ITEM-012 | Replacement metadata is advisory; migration is owner-executed. |
| ADR-ITEM-013 | Hidden content is excluded server-side from unauthorized projections. |
| ADR-ITEM-014 | Single authoritative write region for catalog publication in v1. |
| ADR-ITEM-015 | Exact lookup remains available independently of search. |
| ADR-ITEM-016 | Registry changes are versioned and referenced immutably. |
| ADR-ITEM-017 | Asset versions are immutable external references with hashes and rights state. |
| ADR-ITEM-018 | Bulk content operations coordinate independent idempotent aggregate commands. |
| ADR-ITEM-019 | Published data is protected by database-level immutability controls. |
| ADR-ITEM-020 | Consumer compatibility is a publication gate. |

### ADR trigger conditions

A new ADR is required before introducing:

- executable Item scripts;
- procedural generation;
- mutable mechanical overlays;
- active-active multi-region publication;
- stable-key aliases;
- direct Item Engine ownership of instances;
- cross-Engine distributed transactions;
- arbitrary webhook capabilities;
- automatic Inventory migration on replacement;
- Item-level pricing or commerce ownership;
- a generic expression language;
- probabilistic loot or crafting outcomes;
- blockchain or external ownership authority;
- shared Definition mutation by Modules.

---

## Appendix

### Appendix A. Canonical ownership matrix

| Concern | Authoritative owner |
|---|---|
| Stable Item identity | Item Engine |
| Item Definition versions | Item Engine |
| Item Type and property schemas | Item Engine |
| Item presentation metadata | Item Engine |
| Item capability declarations | Item Engine |
| Character-owned Item instance | Inventory Engine |
| Character-owned stack and quantity | Inventory Engine |
| Equip state | Inventory or Equipment owner |
| Item consumption | Inventory Engine orchestration |
| Reward decision and saga | Reward Engine |
| Item Reward fulfillment side effect | Inventory Engine |
| Character profile cosmetic selection | Character Engine |
| XP and Level | Progression Engine |
| Quest progress | Quest Engine |
| Achievement unlock | Achievement Engine |
| Talent state | Talent Engine |
| Season lifecycle | Season Engine |
| Price, purchase, listing, trade | Commerce or Marketplace owner |
| Currency balance | Currency owner |
| Notification | Notification Engine |

### Appendix B. Recommended core Item Types

These types are initial registry entries, not hardcoded branching logic.

| Type | Intended semantics |
|---|---|
| `GENERIC` | Minimal inventory-addressable content with no specialized capability. |
| `COSMETIC` | Presentation entitlement or equipable visual content. |
| `COLLECTIBLE` | Collection-oriented durable Item. |
| `CONSUMABLE` | Owned quantity may be consumed through a registered interaction. |
| `TROPHY` | Durable milestone artifact, generally non-transferable. |
| `QUEST_ITEM` | Item used by Quest or campaign contracts; ownership remains Inventory. |
| `MATERIAL` | Stackable input reference for future crafting or exchange contracts. |
| `ACCESS_TOKEN` | Inventory-addressable entitlement consumed or checked by a registered owner. |

A type must not imply behavior that is absent from capabilities.

### Appendix C. Core Inventory semantics enums

#### Stack mode

- `NON_STACKABLE`
- `STACKABLE`
- `VIRTUAL_UNIQUE`

#### Binding policy

- `UNBOUND`
- `CHARACTER_BOUND_ON_ACQUIRE`
- `USER_BOUND_ON_ACQUIRE`
- `BOUND_ON_FIRST_USE`
- `BOUND_ON_EQUIP`

Only policies implemented by Inventory may be active.

#### Transferability

- `NOT_TRANSFERABLE`
- `TRANSFERABLE_IF_UNBOUND`
- `TRANSFERABLE_BY_REGISTERED_CONTRACT`

#### Destruction policy

- `OWNER_ALLOWED`
- `OWNER_DISALLOWED`
- `ADMIN_ONLY`
- `CONSUMPTION_ONLY`

#### Duplicate acquisition policy

- `INCREMENT_QUANTITY`
- `CREATE_NEW_INSTANCE`
- `ACCEPT_NO_OP`
- `REJECT`
- `CONVERT_VIA_OWNER_CONTRACT`
- `INCREMENT_AUXILIARY_COUNTER`

### Appendix D. Validation phases

1. Parse and size validation.
2. Canonical normalization.
3. Stable-key and identity validation.
4. Item Type registry resolution.
5. Property schema validation.
6. Inventory semantics validation.
7. Capability schema validation.
8. Cross-field invariants.
9. Dependency resolution.
10. Cycle and complexity analysis.
11. Asset moderation, hash, rights, and audience validation.
12. Localization completeness and safety validation.
13. Disclosure and hidden-content validation.
14. Consumer compatibility validation.
15. Mechanical manifest compilation.
16. Presentation manifest compilation.
17. Fingerprint calculation.
18. Risk classification.
19. Review-policy derivation.
20. Simulation and warnings.

### Appendix E. Mechanical fingerprint canonicalization

Canonicalization MUST define:

- UTF-8 normalization;
- stable object-key ordering;
- stable array ordering where semantics are unordered;
- explicit preservation where order is semantic;
- integer and decimal canonical representation;
- no insignificant whitespace;
- normalized enum casing;
- exact schema and registry version IDs;
- exact immutable dependency IDs;
- exclusion of author notes and operational timestamps;
- inclusion of all mechanically significant tags and capabilities.

The hash algorithm SHOULD be SHA-256 or a platform-approved successor. Algorithm identifier is stored with the fingerprint.

### Appendix F. Presentation erratum allowlist

Allowed paths may include:

- localized name when correcting legal or severe editorial issue;
- short and long description;
- lore;
- accessibility label;
- icon, card art, and other presentation asset references;
- attribution and rights notice;
- safe placeholder.

Forbidden paths include:

- Item Type;
- properties;
- Inventory semantics;
- capabilities;
- dependencies;
- uniqueness;
- binding;
- transferability;
- acquisition policy;
- mechanically significant classification;
- version identity.

### Appendix G. Example Reward Item component

Reward Definition references an immutable Item version:

```json
{
  "componentType": "ITEM",
  "componentKey": "training_sash",
  "payload": {
    "itemDefinitionVersionId": "uuid",
    "quantity": 1
  }
}
```

Reward Engine owns the Grant and component lifecycle. Inventory Engine owns fulfillment. Item Engine validates and serves the manifest.

### Appendix H. Example Inventory fulfillment interaction

```text
1. Reward Engine publishes reward.fulfillment.requested.v1.
2. Inventory Engine deduplicates by fulfillment_id.
3. Inventory Engine resolves the exact Item manifest locally or through Item Engine.
4. Inventory Engine validates Character lifecycle and Inventory policy.
5. Inventory Engine applies stack/instance/unique semantics atomically.
6. Inventory Engine writes receipt and outbox.
7. Inventory Engine publishes reward.fulfillment.succeeded.v1 or failed.v1.
8. Reward Engine advances its saga.
```

Item Engine performs no Character write in this flow.

### Appendix I. Example Item Definition source

```yaml
catalogScope: platform
itemDefinitionKey: cosmetic.training_sash
itemType:
  key: COSMETIC
  registryVersion: 2
inventorySemantics:
  stackMode: VIRTUAL_UNIQUE
  instanceRequired: false
  uniquenessScope: CHARACTER
  duplicateAcquisitionPolicy: ACCEPT_NO_OP
  bindingPolicy: CHARACTER_BOUND_ON_ACQUIRE
  transferability: NOT_TRANSFERABLE
  destructionPolicy: OWNER_DISALLOWED
properties:
  cosmetic.slot: WAIST
  cosmetic.layer: 20
capabilities:
  - type: character.cosmetic.v1
    schemaVersion: 1
    payload:
      slot: WAIST
      assetVariantKey: training_sash_red
classification:
  categoryKey: COSMETIC
  rarityKey: UNCOMMON
  tags:
    - cosmetic
    - school_identity
disclosure:
  policy: PUBLIC
localizations:
  en-US:
    name: Training Sash
    shortDescription: A visible mark of dedicated practice.
assets:
  ICON:
    assetVersionId: 00000000-0000-0000-0000-000000000001
```

### Appendix J. Error-code grouping

| Prefix | Meaning |
|---|---|
| `ITEM_DEFINITION_*` | Identity, version, lifecycle, and lookup errors. |
| `ITEM_DRAFT_*` | Draft state and concurrency errors. |
| `ITEM_SCHEMA_*` | Type, property, and schema errors. |
| `ITEM_CAPABILITY_*` | Capability registry and payload errors. |
| `ITEM_DEPENDENCY_*` | Dependency resolution and cycle errors. |
| `ITEM_ASSET_*` | Asset validation and rights errors. |
| `ITEM_LOCALIZATION_*` | Localization and fallback errors. |
| `ITEM_REVIEW_*` | Review and approval errors. |
| `ITEM_PUBLICATION_*` | Publication and schedule errors. |
| `ITEM_DISCLOSURE_*` | Audience and hidden-content errors. |
| `ITEM_IDEMPOTENCY_*` | Command replay conflicts. |
| `ITEM_INTERNAL_*` | Unexpected internal failures; no sensitive detail exposed. |

### Appendix K. Implementation checklist

#### Ownership

- [ ] Item Engine owns Definitions and immutable versions only.
- [ ] Inventory Engine is sole ownership writer.
- [ ] Reward Engine owns Reward saga.
- [ ] No Character ownership tables exist in Item Engine.

#### Persistence

- [ ] Stable keys are unique and never reused.
- [ ] Published versions are immutable.
- [ ] Mechanical and presentation fingerprints are stored.
- [ ] Inbox, outbox, idempotency, audit, and lifecycle history exist.
- [ ] Reverse dependencies are queryable.

#### Contracts

- [ ] Item Type registry is versioned.
- [ ] Property schemas are versioned.
- [ ] Capability registry names consumer and execution owners.
- [ ] Runtime references pin immutable version IDs.
- [ ] Event versions are registered.

#### Publication

- [ ] Validation snapshots source and registries.
- [ ] Review package is immutable.
- [ ] Separation of duties is enforced.
- [ ] Publication commits data and outbox atomically.
- [ ] Scheduled publication is idempotent.

#### Security and privacy

- [ ] Hidden content is excluded server-side.
- [ ] Asset references are immutable and hash-validated.
- [ ] No arbitrary scripts, callbacks, or SQL are accepted.
- [ ] Audit is append-only and access-controlled.
- [ ] Character ownership data is not stored.

#### Operations

- [ ] Exact lookup works without search.
- [ ] Projection lag is observable.
- [ ] Reconciliation verifies fingerprints and disclosure.
- [ ] Quarantine and recovery are tested.
- [ ] Backup recovery verifies publication sequence.

### Appendix L. Definition of done

Item Engine version 1 is production-ready only when:

1. all normative acceptance tests pass;
2. Inventory and Reward contract tests pass against immutable Item references;
3. hidden-content penetration tests pass;
4. publication, retry, unknown-commit, and outbox failure tests pass;
5. database immutability controls are verified;
6. search and cache rebuild drills pass;
7. quarantine propagation and recovery drill passes;
8. backup restore preserves fingerprints and sequence;
9. dashboards and alerts are operational;
10. runbooks exist for publication failure, asset compromise, broken dependency, search leakage, and fingerprint mismatch;
11. platform architecture review confirms no ownership leakage into Item Engine;
12. documentation and SDK contract artifacts are generated from the active registries.

---

> An Item Definition describes what an Item is. Inventory proves who owns it.
