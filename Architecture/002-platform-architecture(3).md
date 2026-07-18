---
depends_on:
- 000-product-philosophy
- 001-domain-definition
document: 002-platform-architecture
owner: Platform Team
status: Proposed
title: Platform Architecture
version: 1.1.0
last_updated: 2026-07-18
normative_contracts:
- 002a-platform-contract-standard
- 002b-cross-engine-integration
---

# Platform Architecture

## Purpose

Describe the high-level architecture of Progression Platform.

This document intentionally avoids implementation details and specific
technologies.

------------------------------------------------------------------------

# Architectural Style

Progression Platform follows an **Event-Driven**, **Data-Driven** and
**Modular** architecture.

Business systems produce immutable facts.

Platform Engines consume facts, authenticated Commands, and persisted timers.

No engine owns business logic outside its responsibility.

Every aggregate class has one authoritative writer. Cross-Engine mutation uses
typed asynchronous protocols; exact immutable lookups and bounded read-only
validation may use registered synchronous read contracts.

------------------------------------------------------------------------

# High-Level Flow

``` text
User Action
    │
Business Module
    │ immutable business fact
    ▼
Event Bus and Contract Registry
    ├──────────────► Quest Engine
    ├──────────────► Achievement Engine
    └──────────────► Reward Engine
                           │ typed fulfillment saga
                           ├────────► Progression Engine
                           ├────────► Inventory Engine
                           ├────────► Talent Engine
                           └────────► Registered Entitlement owner

All Engines
    │ immutable outcome Events
    ▼
Engine-owned Projections
    │ privacy-filtered composition
    ▼
Presentation Composition Layer
    ├────────► Client Applications
    └────────► Notification Engine
```

Season Engine publishes shared temporal context and content-binding facts.
Item Engine publishes immutable Item semantics consumed by Inventory and
authoring workflows. Talent Engine publishes complete effect-set projections;
Reward Engine consumes the `reward-calculation` scope before finalizing XP.

The runtime is a fan-out graph, not a fixed linear pipeline.

------------------------------------------------------------------------

# Core Layers

## Business Modules

Responsible for domain-specific actions.

Examples:

-   School
-   Fitness
-   Community
-   Marketplace

Modules never calculate progression directly.

Every production Module publishes an immutable Context Module Manifest that
declares:

- module identity, version, realm and tenancy model;
- authoritative business capabilities and aggregate owners;
- produced and consumed Event contracts;
- Character association rules;
- data classification, retention and privacy requirements;
- Progression, Reward, Quest, Achievement, Item, Inventory, Talent and Season
  bindings;
- content bundle identities and dependency edges;
- operational ownership, SLOs and release gates.

A Module may start as a modular monolith. Logical ownership boundaries,
separate schemas, transactional outboxes and contracts are required; network
microservices are not.

The normative onboarding and lifecycle contract is defined in
`012-context-module-framework`.

------------------------------------------------------------------------

## Contract and Event Layer

The versioned contract between Modules, Engines, and platform infrastructure.

Events are immutable.

Every Event uses `002a-platform-contract-standard` and includes:

-   `eventId`
-   versioned `eventType`
-   `schemaVersion`
-   `producer`
-   `occurredAt` and `recordedAt`
-   subject, aggregate and actor identities
-   partition, correlation, causation and lineage
-   payload
-   replay and data-classification metadata

The Contract Registry records schema ownership, producer allowlists, consumer
inventory, compatibility, replay, correction, privacy, and deprecation policy.

------------------------------------------------------------------------

## Engine Layer

Independent processing engines.

Each engine:

-   subscribes to events
-   evaluates rules
-   produces outputs
-   publishes new events when appropriate
-   owns exactly one bounded class of authoritative state
-   commits state, ledger, inbox and outbox atomically where applicable
-   maintains local projections of foreign facts required on its write path

Engines never write another Engine's database and never form a synchronous
distributed transaction.

Synchronous cross-Engine reads are restricted to registered exact immutable
lookups, authoring validation, and reconciliation. They must fail closed or
retry without guessing.

------------------------------------------------------------------------

## Control Plane

The platform control plane provides:

-   Event Schema Registry
-   Reward Component Type Registry
-   Talent Effect Contract Registry
-   global dependency and cycle validation
-   content compatibility and release-bundle validation
-   LiveOps activation orchestration
-   trusted time, authorization policy, audit and observability integration

The control plane validates and coordinates. Engine-owned Definition content
and activation records remain authoritative in their owning Engine.

------------------------------------------------------------------------

## Projection and Composition Layer

Every Engine creates optimized read models for its own state. A stateless or
derived Presentation Composition Layer combines privacy-filtered projections
for client use without becoming another domain writer.

Examples:

-   Character Profile
-   Leaderboards
-   Quest Progress
-   Inventory
-   Reputation

Composed responses expose source freshness. Missing or stale facts are labeled
or omitted, never inferred as authoritative truth.

------------------------------------------------------------------------

## Presentation Layer

Web, mobile and future clients consume privacy-filtered projections and
composed views rather than raw Engine tables or broad Event streams.

------------------------------------------------------------------------

# Engine Responsibilities

| Engine or capability | Responsibility |
|---|---|
| Character Engine | Character identity, lifecycle, profile and presentation selection |
| Progression Engine | Experience, Level, Prestige and Progression Tracks |
| Reward Engine | Reward decision, Grant, Claim, fulfillment and revocation sagas |
| Quest Engine | Quest Definitions, Instances, Objectives and outcomes |
| Achievement Engine | milestone progress, unlock and recognition integrity |
| Talent Engine | Talents, Skills, resources, loadouts, cooldowns and effect sets |
| Item Engine | immutable Item Definitions, semantics and catalog lifecycle |
| Inventory Engine | Item ownership, Holdings, Instances, reservations and equipment |
| Season Engine | temporal context, schedule, bindings and participation |
| Reputation Engine | Reputation progression; disabled until implemented |
| Currency Engine | spendable balance ledger; disabled until implemented |
| Entitlement owner | Title, cosmetic and feature entitlement ownership |
| Notification Engine | player communication from committed facts |
| LiveOps capability | validated activation orchestration, not Definition ownership |

------------------------------------------------------------------------

# Design Constraints

-   Engines are independent.
-   Every aggregate class has one authoritative writer.
-   Cross-Engine mutation is Event-based and typed.
-   Commands, Events, timers and operational workflows are durable causes.
-   Every accepted mutation produces an immutable Event through an outbox.
-   Business modules are replaceable.
-   Rules are configuration-driven.
-   Platform remains domain agnostic.
-   Published configuration is immutable and version-addressable.
-   Global configuration dependencies must be acyclic.
-   At-least-once delivery is converted into exactly-once logical effects.
-   Partial distributed outcomes are explicit and auditable.
-   Unsupported Component Types fail publication; they never fall back to an
    unowned generic mutation.
-   Version 1 uses one authoritative home region per aggregate and fenced
    failover. Cross-region active-active multi-writer state is disabled until
    an Engine-specific ADR proves conflict prevention.

------------------------------------------------------------------------

# Extensibility

Adding a new Module using existing registered Event facts, Conditions,
Components, and effects must not require changes to Engine core code.

A genuinely new semantic primitive requires a versioned contract, an
authoritative owner, compatibility tests, cycle analysis, and an ADR. This is
platform evolution, not ordinary Module onboarding.

Typical onboarding:

1.  Publish and validate the Context Module Manifest.
2.  Register producer identity and Event schemas.
3.  Establish Character associations without moving business membership into
    Character Engine.
4.  Publish immutable business facts through an outbox.
5.  Configure Progression bindings, Rewards, Quests, Achievements, Items,
    Inventory interactions, Talents and Seasons.
6.  Validate the global dependency graph and release bundle.
7.  Pass consumer-driven, privacy and end-to-end contract tests.
8.  Activate through the control plane.

------------------------------------------------------------------------

# Acceptance Criteria

-   No engine depends on business modules.
-   Every state change has one durable cause and emits immutable outcome facts.
-   Platform terminology follows Domain Definition.
-   All cross-Engine Events validate against one canonical envelope.
-   Producer and consumer Event catalogs contain no unresolved names or aliases.
-   Reward fulfillment and reversal use one owner protocol.
-   Global configuration activation rejects reactive cycles.
-   New Modules using registered primitives integrate without Engine changes.
-   Every active Module resolves to exactly one validated Manifest version.
-   Cross-Engine duplicate, retry, replay, late-arrival, correction, partial
    failure, and privacy scenarios pass end-to-end tests.

------------------------------------------------------------------------

> Build engines once. Connect unlimited domains.
