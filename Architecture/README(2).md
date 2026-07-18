# Progression Platform

> **Build digital identity. Reward real actions. Create lifelong
> progression.**

------------------------------------------------------------------------

## What is Progression Platform?

**Progression Platform** is an event-driven character progression
platform that transforms real user actions into meaningful RPG
progression.

Instead of traditional loyalty systems, points or badges, users develop
a persistent digital character that grows together with them across
products and communities.

Every meaningful action becomes part of the player's journey.

### Examples of user actions

-   Attend a lesson
-   Complete a course
-   Participate in an event
-   Invite a friend
-   Purchase a subscription
-   Publish content
-   Complete a challenge

Each action may produce:

-   Experience
-   Achievement progress
-   Quest progress
-   Talent unlocks
-   Reputation
-   Story progression
-   Cosmetic rewards

------------------------------------------------------------------------

# Vision

Create the world's most flexible Character Progression Platform.

One platform. Multiple domains.

-   Education
-   Sports
-   Communities
-   Gaming
-   Fitness
-   Corporate learning

------------------------------------------------------------------------

# Core Principles

## Platform First

The platform is designed before individual products.

## Event Driven

Meaningful business integration starts with an immutable Event. Interactive
state changes may begin as authenticated Commands to the owning Engine; every
accepted mutation produces immutable Events.

Examples:

-   lesson.completed
-   payment.completed
-   purchase.completed
-   quest.completed

## Data Driven

Game mechanics are configuration, not source code.

## Modular

Every engine has exactly one responsibility.

-   Character Engine
-   Progression Engine
-   Reward Engine
-   Quest Engine
-   Achievement Engine
-   Talent Engine
-   Item Engine
-   Inventory Engine
-   Season Engine

Cross-Engine contracts are defined by:

-   Platform Contract Standard
-   Cross-Engine Integration Catalog

Each Engine is the single writer of its own state. Reward Engine coordinates
typed fulfillment but never writes Progression, Inventory, Talent, Currency,
Reputation, or entitlement state directly.

## Narrative First

People remember stories, not numbers.

## Evolution over Prediction

We build an architecture that evolves safely instead of trying to
predict every future requirement.

------------------------------------------------------------------------

# Repository

    docs/
    engines/
    modules/
    schemas/
    examples/
    adr/
    assets/

Normative documentation order:

1.  Product Philosophy
2.  Domain Definition
3.  Platform Architecture
4.  Platform Contract Standard
5.  Cross-Engine Integration
6.  Engine RFCs
7.  Standard Level Profile
8.  Context Module Framework
9.  Context Module Integration Specification Template
10. Partner Content Studio

Partner Content Studio is the tenant-scoped authoring and release surface for
module content. It composes Engine-owned Definitions without becoming a new
runtime owner of Quests, Achievements, Rewards, Items, progression or Seasons.

------------------------------------------------------------------------

# First Production Module

The first production implementation of the platform is the **School
Module**.

It validates the platform while keeping the core domain independent.

Its first Context Module is `school.fencing`, documented under
`modules/fencing-school/`. The Module owns CRM, scheduling, attendance,
commerce, training records and fencing mastery. Platform Engines continue to
own Character progression and all reusable RPG mechanics.

------------------------------------------------------------------------

# Guiding Principle

> **Real actions create meaningful progression.**
