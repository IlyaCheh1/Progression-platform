---
depends_on:
- 000-product-philosophy
document: 001-domain-definition
owner: Product Team
status: Proposed
title: Domain Definition
version: 1.1.0
last_updated: 2026-07-18
---

# Domain Definition

## Purpose

This document defines the canonical domain language of Progression
Platform.

Every engine, API, database schema and module MUST use these terms
consistently.

------------------------------------------------------------------------

# Core Rules

-   One term = one meaning.
-   Synonyms are prohibited inside technical documentation.
-   Business modules may introduce their own vocabulary, but it must map
    to these canonical entities.
-   Product association and authoritative state ownership are different
    concepts.
-   A Character is the subject of progression state; the owning Engine is the
    only component permitted to mutate that state.
-   Runtime references use stable IDs and immutable version IDs, never display
    names or mutable recommended versions.

------------------------------------------------------------------------

# Canonical Entities

## User

The authenticated account that owns one or more Characters.

A User is **not** progression.

------------------------------------------------------------------------

## Character

A persistent digital identity that can earn progression.

Character owns:

-   progression
-   inventory
-   talents
-   achievements
-   reputation
-   collections
-   statistics

A Character never belongs to a business module.

In this product statement, “owns” means that the state contributes to the
Character's durable identity and experience. It does not mean that the
Character Engine stores or mutates that state. Each listed state class remains
authoritatively owned by its corresponding Engine.

------------------------------------------------------------------------

## Profile

The public representation of a Character.

Contains visual and social information only.

------------------------------------------------------------------------

## Context Module

A replaceable business-domain integration that converts real operational
activity into registered immutable Events and composes platform capabilities
for one context, such as a school, fitness product, community, or marketplace.

A Context Module owns its business aggregates and business rules. It never
owns Character progression, Rewards, Quests, Achievements, Items, Inventory,
Talents, or Seasons.

------------------------------------------------------------------------

## Context Module Manifest

The immutable, versioned declaration of a Context Module's identity,
capabilities, producer allowlist, Event schemas, data classifications,
Progression bindings, content release bundle, dependencies, and operational
owners.

The Manifest is validated by the platform control plane before activation.

------------------------------------------------------------------------

## Module Association

A business-owned relationship between a Character and a Context Module
subject, such as a student, member, employee, or customer profile.

A Module Association allows Events to reference a canonical Character without
making the Character belong to the Module. Character Engine owns the generic
association lifecycle. The Module owns its external subject, eligibility,
enrollment, membership, and other business relationships.

------------------------------------------------------------------------

## Business Aggregate

An authoritative aggregate owned by a Context Module, such as a booking,
training session, attendance record, membership, payment, or lead.

Business Aggregates may produce platform-consumable Events but are never
stored in Engine databases.

------------------------------------------------------------------------

## Event

An immutable record describing something that has happened.

Examples:

-   lesson.completed
-   payment.completed
-   purchase.completed
-   quest.completed

Events are the primary cross-component integration entry point of every
Engine.

An Event is a fact or a typed asynchronous request. Interactive user and
administrative intent may enter an owning Engine as an authenticated Command.
Every accepted mutation emits immutable Events.

All platform Events use the canonical contract defined in
`002a-platform-contract-standard`.

------------------------------------------------------------------------

## Command

An authenticated request to the Engine that owns the target state.

A Command has a stable idempotency identity, actor, subject, expected version
where required, and a bounded typed payload. A Command is not an Event until an
authoritative outcome has occurred.

------------------------------------------------------------------------

## Engine

An independent processing component reacting to Events.

An Engine is the single authoritative writer for one bounded class of state.
It may also process Commands, persisted timers, and approved operational
workflows.

Examples:

-   Progression Engine
-   Reward Engine
-   Quest Engine

------------------------------------------------------------------------

## Progression

The measurable long-term growth of a Character.

Includes platform growth concepts such as:

-   experience
-   levels
-   prestige
-   reputation

Experience, Level, and Prestige are owned by Progression Engine. Reputation is
a separate progression concept owned by Reputation Engine.

------------------------------------------------------------------------

## Reward

A versioned platform decision that one or more positive Character-associated
effects should be fulfilled.

Examples:

-   XP
-   Item
-   Currency
-   Title
-   Reputation
-   Cosmetic
-   Unlock

Reward Engine owns the decision, Grant, Claim, fulfillment saga, repeatability,
and revocation saga. It never directly writes Experience, Inventory, Talent,
Currency, Reputation, entitlement, or other foreign state.

------------------------------------------------------------------------

## Reward Definition

Immutable versioned configuration describing Reward Components and policy.

------------------------------------------------------------------------

## Reward Grant

One durable Reward decision for a Character and source identity.

------------------------------------------------------------------------

## Reward Component

One typed effect within a Reward Grant, fulfilled by the Engine that owns the
target state.

------------------------------------------------------------------------

## Fulfillment

The idempotent owner-Engine operation that applies one Reward Component and
reports its authoritative outcome to Reward Engine.

------------------------------------------------------------------------

## Quest

A collection of Objectives completed for one or more Rewards.

------------------------------------------------------------------------

## Objective

A single measurable requirement inside a Quest.

------------------------------------------------------------------------

## Achievement

A permanent milestone unlocked when Conditions become true.

Achievements are immutable once unlocked.

The unlock record is permanent. A later integrity workflow may invalidate
recognition without deleting or rewriting the historical unlock.

------------------------------------------------------------------------

## Talent

A permanent modifier affecting progression or gameplay.

May be:

-   Passive
-   Active

Talent acquisition history is permanent. Whether a Talent currently contributes
an effect may depend on loadout, lifecycle restriction, Edition, suppression,
or integrity state.

------------------------------------------------------------------------

## Skill

An active ability with activation rules and cooldown.

------------------------------------------------------------------------

## Cooldown

A period during which a Skill cannot be activated again.

------------------------------------------------------------------------

## Item

A stable catalog concept describing reusable Item content.

Possible categories include:

-   Cosmetic
-   Collectible
-   Consumable
-   Trophy
-   Quest Item

An Item Definition and immutable Item Definition Version are owned by Item
Engine. Character ownership is represented by an Inventory Holding or Item
Instance owned by Inventory Engine.

------------------------------------------------------------------------

## Item Definition

The stable catalog identity and immutable versioned semantics of an Item.

------------------------------------------------------------------------

## Inventory Holding

Authoritative Character-associated ownership of stackable or virtual-unique
Item copies.

------------------------------------------------------------------------

## Item Instance

An individually addressable owned copy of an Item Definition Version.

------------------------------------------------------------------------

## Inventory

The complete collection of Character-owned Items.

------------------------------------------------------------------------

## Collection

A curated group of Items, Achievements or other entities tracked for
completion.

------------------------------------------------------------------------

## Reputation

A long-term measure of trust, mastery or status.

------------------------------------------------------------------------

## Title

A public designation earned by the Character.

------------------------------------------------------------------------

## Campaign

A long-form narrative composed of multiple Quests.

------------------------------------------------------------------------

## Season

A time-limited platform context that binds exact content identities, schedules,
participation policy, and settlement rules.

Season “contains” content by immutable reference. Season Engine does not own or
mutate the bound Quest, Achievement, Progression, Reward, Talent, Item, or
Inventory state.

------------------------------------------------------------------------

## Definition

Stable configuration identity owned by one Engine.

------------------------------------------------------------------------

## Definition Version

Immutable published semantic content for a Definition.

------------------------------------------------------------------------

## Edition

A concrete release or occurrence identity that binds immutable content and
scope. An Edition is never reset or reused for a different release.

------------------------------------------------------------------------

## Manifest

An immutable content-addressed set of exact Definition Version, Edition, and
policy references used for one release context.

------------------------------------------------------------------------

## Projection

A derived read model built from authoritative facts. A Projection may be stale
and never becomes a second writer of domain state.

------------------------------------------------------------------------

## Entitlement

Authoritative ownership of a Title, cosmetic, feature unlock, or presentation
asset. Presentation selection is not entitlement ownership.

------------------------------------------------------------------------

## Module

A business-domain implementation built on top of the platform.

Examples:

-   School
-   Fitness
-   Community
-   Gaming

------------------------------------------------------------------------

# Relationships

User → owns Character(s)

Character → is subject of Progression, Inventory, Reputation, Achievements,
Talents, Quests, Rewards and Season Participation

Event → triggers Engine(s)

Command or Event → causes an owning Engine operation

Reward Engine → coordinates Fulfillments

Fulfillment → is applied only by the Engine owning the target state

Quests → contain Objectives

Campaigns → contain Quests

Seasons → bind exact Campaign, Quest, Reward and other content identities

Definition → has immutable Definition Versions

Engine → produces authoritative Events and local Projections

------------------------------------------------------------------------

# Naming Convention

Use singular names:

-   Character
-   Event
-   Reward
-   Quest

Avoid business-specific names inside platform documentation.

------------------------------------------------------------------------

# Acceptance Criteria

-   Every platform document references only canonical terms.
-   Business modules map their own terminology to these entities.
-   Every active Context Module has one immutable validated Manifest.
-   Module Associations never imply Character ownership or business
    membership inside Character Engine.
-   No engine introduces duplicate terminology.
-   “Owns” always distinguishes product association from authoritative writer.
-   Every cross-Engine entity reference identifies its owning Engine and exact
    immutable version where historical meaning matters.
-   Reward, Item, Season, Achievement, and Talent permanence semantics match
    their detailed Engine RFCs.

------------------------------------------------------------------------

> Shared language is the foundation of a scalable platform.
