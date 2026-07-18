---
depends_on:
  - 000-product-philosophy
  - 001-domain-definition
  - 002-platform-architecture
document: 002a-platform-contract-standard
owner: Platform Team
status: Proposed
title: Platform Contract Standard
version: 1.0.0
last_updated: 2026-07-18
---

# Platform Contract Standard

## Purpose

This document defines the mandatory wire, identity, causality, command, and
compatibility rules used by every Progression Platform Module and Engine.

It is normative for cross-component integration. Engine RFCs remain
authoritative for their own aggregates and state transitions, but they MUST
conform to this document at every platform boundary.

------------------------------------------------------------------------

## Normative Language

The key words **MUST**, **MUST NOT**, **REQUIRED**, **SHOULD**, **SHOULD NOT**,
and **MAY** are normative requirement levels.

When an older example conflicts with this standard, this standard takes
precedence. A conflict MUST be corrected in the source RFC and MUST NOT be
resolved by an undocumented runtime adapter.

------------------------------------------------------------------------

# Architectural Contract

## Causes and Facts

Every authoritative state transition MUST have exactly one durable cause:

- an authenticated command;
- an immutable consumed Event;
- a persisted server timer;
- an approved migration, repair, or privacy operation.

Every accepted authoritative transition MUST atomically persist its state,
operation record, audit reference, and transactional outbox Event.

The platform does not require an Event to exist before every command. It
requires every committed transition to be traceable to a durable cause and to
produce immutable facts.

## Single Writer

Only the owning Engine may mutate its aggregate class. Other components MAY:

- publish a typed request Event;
- issue an authenticated command through an owner-defined API;
- consume owner Events;
- maintain a local projection;
- perform an exact immutable lookup through an approved read contract.

Cross-database writes, shared mutable ownership tables, and synchronous
distributed transactions are prohibited.

## Cross-Engine Calls

Cross-Engine mutation is asynchronous by default.

Synchronous calls are permitted only for:

- exact immutable Definition or Manifest lookup;
- bounded read-only validation during authoring or publication;
- support or reconciliation queries outside another Engine's transaction;
- explicitly registered strongly consistent ownership checks when no safe
  Event projection can represent the requirement.

A synchronous read MUST NOT create a distributed transaction and MUST have a
fail-closed or retryable degradation policy.

------------------------------------------------------------------------

# Identifier Standard

## Platform Identifiers

Platform-created identifiers MUST use UUIDv7 serialized as lowercase canonical
UUID text.

This applies to:

- Event IDs;
- Character IDs;
- aggregate IDs;
- operation and command IDs;
- Reward Grant, Component, Fulfillment, and Reversal IDs;
- ledger and transition IDs;
- Definition Version and Edition IDs;
- timer, job, and reconciliation IDs.

PostgreSQL implementations SHOULD store these values as `UUID`.

External business identifiers remain opaque strings in explicitly named
fields. They MUST NOT be parsed as platform UUIDs and MUST NOT be reused as
platform aggregate identifiers.

## Stable Keys

Human-readable stable keys use lowercase segments separated by dots. Hyphens
and underscores MAY appear inside a content-key segment only when the owning
schema permits them.

Stable keys are not mutable display names and are never ownership evidence.

------------------------------------------------------------------------

# Canonical Event Envelope v1

Every platform Event MUST serialize the following envelope using the exact
camelCase field names shown below.

```json
{
  "eventId": "018f2f1e-8f0a-7c91-a3d1-0242ac120010",
  "eventType": "progression.level.changed.v1",
  "schemaVersion": 1,
  "producer": "progression-engine",
  "producerInstance": "progression-engine-eu-3",
  "occurredAt": "2026-07-18T12:34:56.123Z",
  "recordedAt": "2026-07-18T12:34:56.456Z",
  "subject": {
    "type": "CHARACTER",
    "id": "018f2f1e-8f0a-7c91-a3d1-0242ac120002"
  },
  "aggregate": {
    "type": "CHARACTER_PROGRESSION",
    "id": "018f2f1e-8f0a-7c91-a3d1-0242ac120020",
    "version": 92
  },
  "actor": {
    "type": "SERVICE",
    "id": "reward-engine"
  },
  "realmKey": "global",
  "tenantId": null,
  "partitionKey": "018f2f1e-8f0a-7c91-a3d1-0242ac120002",
  "correlationId": "018f2f1e-8f0a-7c91-a3d1-0242ac120030",
  "causationId": "018f2f1e-8f0a-7c91-a3d1-0242ac120031",
  "lineage": {
    "rootEventId": "018f2f1e-8f0a-7c91-a3d1-0242ac120031",
    "depth": 1,
    "cycleGuard": []
  },
  "traceId": "00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01",
  "replay": {
    "isReplay": false,
    "replayId": null,
    "originalRecordedAt": null
  },
  "dataClassification": "INTERNAL",
  "payload": {},
  "metadata": {
    "contract": "platform-event-envelope.v1"
  }
}
```

## Required Fields

The following fields are always required:

- `eventId`;
- `eventType`;
- `schemaVersion`;
- `producer`;
- `occurredAt`;
- `recordedAt`;
- `subject`;
- `actor`;
- `realmKey`;
- `partitionKey`;
- `correlationId`;
- `lineage`;
- `replay`;
- `dataClassification`;
- `payload`;
- `metadata.contract`.

`producerInstance`, `aggregate`, `tenantId`, `causationId`, and `traceId` are
optional only when the registered Event contract declares why they cannot be
supplied.

## Time Semantics

- `occurredAt` is the domain-effective instant defined by the producer
  contract.
- `recordedAt` is the authoritative commit instant in the producer store.
- Broker publish and receive timestamps are transport metadata and MUST NOT be
  written into the immutable domain envelope after commit.
- Client time is never authoritative unless a registered producer contract
  validates and promotes it.
- All persisted instants use UTC with explicit offsets.

## Event Type Naming

Event types use:

`<domain>.<entity-or-capability>.<past-tense-fact-or-request>.v<major>`

Requirements:

- lowercase ASCII;
- dot-separated semantic segments;
- no underscores in Event type names;
- a mandatory `.vN` suffix;
- `schemaVersion` equal to the suffix major version;
- facts use past tense;
- requests use `.requested.vN`;
- changing authoritative meaning requires a new major version.

Examples:

- `character.lifecycle.changed.v1` is not used as a substitute for specific
  lifecycle facts;
- `character.suspended.v1` and `character.reactivated.v1` are canonical;
- `talent.rank.acquired.v1` is canonical;
- `talent.rank_acquired.v1` is invalid.

## Subject and Aggregate

`subject` identifies the entity principally affected by the Event. A
Character-scoped Event uses `type=CHARACTER` and the canonical Character ID.

`aggregate` identifies the authoritative producer aggregate and resulting
version. It is required for state-transition facts and optional for root
business facts that do not expose a platform aggregate.

## Actor and Producer

`producer` is the authenticated service identity. Transport credentials MUST
match it.

`actor` identifies the user, service, timer, migration, or administrator whose
authorized intent caused the operation. Client-provided actor identity is not
trusted.

## Causality and Cycle Guard

- A root Event sets `lineage.rootEventId` to its own `eventId`, `depth=0`, and
  an empty `cycleGuard`.
- A derived Event preserves `rootEventId`, increments `depth`, and sets
  `causationId` to the direct cause.
- Platform policy defines a maximum lineage depth.
- A Reward binding, Quest dependency, Achievement dependency, Talent automatic
  acquisition, or similar reactive rule appends its immutable activation token
  to `cycleGuard` before producing further reactive work.
- Re-entry of the same token is rejected or quarantined as a cycle.

Runtime cycle guards complement publication-time graph validation; they do not
replace it.

## Partitioning

- Character-owned aggregate Events use `characterId` when per-Character order
  is required.
- Reward Grant lifecycle Events use `rewardGrantId`.
- `reward.fulfillment.requested.v1` uses `characterId` so the target owner can
  serialize Character state.
- Reward fulfillment and reversal result Events use `rewardGrantId` so the
  saga can serialize Grant state.
- Definition lifecycle Events use the stable Definition ID.
- Season Edition lifecycle Events use `seasonEditionId`.

Consumers MUST use aggregate versions and idempotency identities rather than
assuming global broker order.

## Payload and Metadata

Payloads MUST be schema-registered, bounded, deterministic, and data-minimized.
Unknown mutation fields fail closed unless the schema explicitly declares
forward-compatible behavior.

`metadata` is non-authoritative. It MUST NOT contain credentials, unrestricted
free text, personal profile content, or values required to reproduce a domain
decision.

------------------------------------------------------------------------

# Command Contract

Commands are authenticated requests to an owning Engine. They may arrive over
HTTP, RPC, a queue, or an internal scheduler, but share these logical fields:

```json
{
  "commandId": "018f2f1e-8f0a-7c91-a3d1-0242ac120040",
  "idempotencyKey": "producer-scoped-stable-key",
  "commandType": "character.profile.update.v1",
  "subject": {
    "type": "CHARACTER",
    "id": "018f2f1e-8f0a-7c91-a3d1-0242ac120002"
  },
  "actor": {
    "type": "USER",
    "id": "018f2f1e-8f0a-7c91-a3d1-0242ac120003"
  },
  "expectedAggregateVersion": 12,
  "correlationId": "018f2f1e-8f0a-7c91-a3d1-0242ac120030",
  "payload": {}
}
```

The owner MUST persist a canonical command fingerprint. Reuse of an
idempotency identity with the same fingerprint returns the original result;
reuse with a different fingerprint is a conflict and MUST NOT mutate state.

------------------------------------------------------------------------

# Delivery and Storage Contract

## Delivery

The transport provides at-least-once delivery. Exactly-once broker delivery is
not required and MUST NOT be assumed.

Each consumer implements exactly-once logical effect using:

- inbox deduplication by `eventId` and handler version;
- domain idempotency by the operation identity defined by the contract;
- request fingerprint validation;
- aggregate concurrency control;
- atomic state, ledger, inbox, and outbox commit.

## Outbox

The outbox stores the complete immutable canonical envelope before commit.
Retries preserve `eventId`, payload, and envelope hash.

The dispatcher MUST NOT modify `recordedAt` or any domain field when publishing.

## Schema Compatibility

Every Event and cross-Engine command schema has:

- one owner;
- producer allowlist;
- consumer inventory;
- compatibility policy;
- data classification;
- retention and replay policy;
- partition rule;
- correction or reversal behavior;
- deprecation deadline.

Compatible additions are optional fields with safe defaults. Renaming fields,
changing units, changing requiredness, or changing authoritative meaning is a
breaking change.

Aliases MAY exist only in a time-bounded compatibility adapter. New consumers
MUST use canonical names, and aliases MUST include the canonical Event ID.

------------------------------------------------------------------------

# API and Error Contract

Public JSON APIs use camelCase. Database columns and internal SQL use
snake_case. Translation occurs at the Engine boundary.

Errors use a common structure:

```json
{
  "error": {
    "code": "progression.definition.notFound",
    "messageKey": "progression.definition.not_found",
    "retryable": false,
    "correlationId": "018f2f1e-8f0a-7c91-a3d1-0242ac120030",
    "details": {}
  }
}
```

Errors MUST NOT expose stack traces, credentials, hidden content, private
eligibility rules, or the existence of unauthorized resources.

------------------------------------------------------------------------

# Conformance Requirements

An Engine is not releasable until:

1. every produced Event validates against the canonical envelope and its
   registered payload schema;
2. every consumed Event has a registered producer and compatibility test;
3. all documented Event names are canonical or explicitly marked as deprecated
   aliases with a removal deadline;
4. duplicate delivery and fingerprint-conflict tests pass;
5. outbox retry preserves byte-equivalent semantic content;
6. replay, correction, and privacy behavior are declared;
7. consumer-driven contract tests pass against the exact schemas used in
   production.

------------------------------------------------------------------------

> One envelope. One meaning. One authoritative owner.
