---
document: 000-product-philosophy
owner: Product Team
status: Proposed
title: Product Philosophy
version: 1.0.0
last_updated: 2026-07-18
---

# Product Philosophy

## Purpose

This document defines the philosophy and non-negotiable principles of
Progression Platform. It is the constitutional document of the platform
and is intentionally technology-agnostic.

------------------------------------------------------------------------

# Mission

Build a platform where **real actions create meaningful progression**.

Progression must represent personal growth rather than arbitrary point
collection.

------------------------------------------------------------------------

# Vision

A persistent digital character should accompany a person across
products, communities and years.

The platform should become reusable across multiple domains while
remaining validated by real production use.

The first production module is **School Module**.

------------------------------------------------------------------------

# Core Values

## Meaning before Mechanics

Every mechanic must reinforce meaningful behaviour.

Artificial engagement is not a product goal.

## Player Respect

Never manipulate users through dark patterns.

Progress should reward commitment, learning and contribution.

## Platform First

The core platform never contains business rules for a specific industry.

Business logic belongs to modules.

## Evolution over Prediction

Design extensible foundations.

Avoid speculative complexity.

## Event Driven

Meaningful business facts enter the platform as immutable domain Events.

Authoritative state changes have one durable cause: an authenticated command,
an immutable Event, a persisted timer, or an approved operational workflow.
Every accepted change produces immutable facts through a transactional outbox.

Event-driven does not mean that every user command must first be converted into
an Event. It means that cross-component facts are immutable, causality is
preserved, and no state change is hidden from audit and integration.

## Data Driven

Rules, quests, achievements, talents and rewards are configuration, not
hardcoded logic.

------------------------------------------------------------------------

# Product Principles

Every feature must answer:

1.  What value does it create for the user?
2.  What value does it create for the business?
3.  Can it be implemented without violating platform architecture?

If one answer is missing, the feature should be redesigned.

------------------------------------------------------------------------

# Architectural Axioms

## ADR-001 --- Platform First

The platform is developed independently from business modules.

## ADR-002 --- Engine Driven

Business events are processed by independent engines.

## ADR-003 --- Character Ownership

Characters belong to the platform rather than individual modules.

Character ownership describes persistent product identity. Authoritative data
ownership remains distributed: each Engine is the single writer of its own
aggregate class.

## ADR-004 --- Contract First

Cross-Engine behavior is governed by versioned schemas, registered producers,
consumer-driven compatibility tests, and one canonical Event envelope.

Undocumented adapters are not architecture.

## ADR-005 --- Explicit Distributed Outcomes

Multi-Engine effects use durable sagas with visible partial, failed, retried,
and compensated states. The platform never presents eventual work as an atomic
distributed success.

------------------------------------------------------------------------

# Scope

The platform provides progression capabilities.

It is not:

-   CRM
-   LMS
-   CMS
-   ERP
-   Game Engine

Those systems provide events.

Progression Platform transforms events into progression.

------------------------------------------------------------------------

# Success Criteria

The platform is successful when:

-   users return because they value their progression;
-   businesses can configure progression without code changes;
-   new domains can be added as modules;
-   engines remain reusable.

------------------------------------------------------------------------

# Guiding Principle

> Build engines once. Build experiences forever.
