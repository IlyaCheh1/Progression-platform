---
depends_on:
  - 000-product-philosophy
  - 001-domain-definition
  - 002-platform-architecture
  - 002a-platform-contract-standard
document: 002b-cross-engine-integration
owner: Platform Team
status: Proposed
title: Cross-Engine Integration
version: 1.0.0
last_updated: 2026-07-18
related_documents:
  - 003-character-engine
  - 004-progression-engine
  - 005-reward-engine
  - 006-achievement-engine
  - 007-quest-engine
  - 008-talent-engine
  - 009-item-engine
  - 010-inventory-engine
  - 011-season-engine
---

# Cross-Engine Integration

## Purpose

This document defines the canonical integration graph, cross-Engine protocols,
producer-consumer catalog, and global configuration safeguards for Progression
Platform.

It does not transfer aggregate ownership. Each Engine RFC remains authoritative
for its own state. This document is authoritative for the boundary between
Engines.

------------------------------------------------------------------------

# Canonical Runtime Flow

```text
Business Module
    │ immutable business fact
    ▼
Event Bus and Contract Registry
    ├────────────► Quest Engine
    ├────────────► Achievement Engine
    └────────────► Reward Engine
                         │ typed fulfillment request
                         ├────────► Progression Engine
                         ├────────► Inventory Engine
                         ├────────► Talent Engine
                         └────────► registered Entitlement owner

Quest, Achievement, Season, Progression, Inventory, and Talent facts may
return to the Event Bus as new facts. Publication-time dependency validation
and runtime lineage guards prevent recursive rule chains.

Every Engine builds its own projections. A presentation composition layer
combines privacy-filtered projections for clients without owning domain state.
```

Business facts fan out. Engines are not arranged as a fixed processing
pipeline.

------------------------------------------------------------------------

# Platform Control Plane

The platform control plane owns no Character progression state. It provides:

- Event Schema Registry;
- producer and consumer allowlists;
- Reward Component Type Registry;
- Talent Effect Contract Registry;
- immutable Definition dependency metadata;
- global Event and configuration dependency graph;
- release bundle validation;
- compatibility and deprecation status;
- LiveOps activation orchestration;
- trusted time, authorization policy, and operational audit integration.

An Engine remains authoritative for its Definition contents and activation
records. The control plane validates and coordinates; it does not mutate
published Engine Definitions.

------------------------------------------------------------------------

# Canonical Ownership Matrix

| State or decision | Authoritative owner |
|---|---|
| Character identity, lifecycle, profile, presentation selection | Character Engine |
| Experience, Level, Prestige, Progression Track position | Progression Engine |
| Reward policy, Grant, Claim, fulfillment saga, revocation saga | Reward Engine |
| Achievement Definition, progress, unlock, recognition integrity | Achievement Engine |
| Quest Definition, Instance, Objective, branch, terminal outcome | Quest Engine |
| Talent, Skill, Talent resource, loadout, cooldown, effect set | Talent Engine |
| Item Definition, immutable Item semantics, catalog lifecycle | Item Engine |
| Item ownership, Holding, Instance, quantity, reservation, equipment | Inventory Engine |
| Season Definition, Edition, schedule, participation, temporal context | Season Engine |
| Spendable Currency balance | Currency Engine or disabled provider |
| Reputation track and balance | Reputation Engine or disabled provider |
| Title, cosmetic, and feature entitlement ownership | Registered Entitlement owner |
| Cross-Engine read composition | Presentation Composition Layer |

Until Currency, Reputation, or Entitlement ownership is implemented and
registered, the corresponding Reward Component Types MUST be disabled in
production. Character presentation selection is not entitlement ownership.

------------------------------------------------------------------------

# Character Lifecycle Protocol

## Canonical Events

- `character.created.v1`;
- `character.activated.v1`;
- `character.suspended.v1`;
- `character.reactivated.v1`;
- `character.closed.v1`;
- `character.restored.v1`;
- `character.anonymization.started.v1`;
- `character.anonymized.v1`;
- `character.visibility.changed.v1`.

`character.lifecycle.changed.v1` is not a canonical v1 Event. Consumers MUST
subscribe to the specific lifecycle facts they need.

Every lifecycle payload includes:

- `characterId`;
- `previousState` where applicable;
- `state`;
- `effectiveAt`;
- `aggregateVersion`;
- a bounded `reasonCode` where disclosure is permitted.

Consumers maintain a monotonic local projection by `aggregateVersion` and fail
closed when required lifecycle state is unknown or stale beyond policy.

------------------------------------------------------------------------

# Reward Fulfillment Protocol v1

## Request

Reward Engine publishes `reward.fulfillment.requested.v1`.

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
  "requestedAt": "2026-07-18T12:00:00Z",
  "timeoutAt": "2026-07-18T12:05:00Z"
}
```

The outer Event uses the canonical platform envelope. The JSON above is its
payload.

`fulfillmentId` is the logical idempotency identity and remains stable across
attempts. `attemptId` changes for each physical dispatch.

## Success

The owner publishes `reward.fulfillment.succeeded.v1`:

```json
{
  "rewardGrantId": "uuid",
  "componentId": "uuid",
  "fulfillmentId": "uuid",
  "characterId": "uuid",
  "requestFingerprint": "sha256:...",
  "componentType": "EXPERIENCE",
  "ownerEngine": "progression",
  "ownerOperationId": "uuid",
  "ownerAggregate": {
    "type": "CHARACTER_PROGRESSION",
    "id": "uuid",
    "version": 44
  },
  "outcome": {
    "status": "APPLIED",
    "acceptedNoop": false
  },
  "fulfilledAt": "2026-07-18T12:00:00Z"
}
```

## Failure

The owner publishes `reward.fulfillment.failed.v1`:

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
    "details": {}
  },
  "failedAt": "2026-07-18T12:00:02Z"
}
```

Failure class is one of `RETRYABLE`, `TERMINAL`, or `QUARANTINED`.

## Owner Requirements

Every registered owner MUST:

1. validate `ownerEngine` and `componentType` against the registry;
2. deduplicate by `fulfillmentId`;
3. compare `requestFingerprint` on every retry;
4. apply only its own state;
5. atomically persist the owner operation and result outbox Event;
6. echo the request fingerprint;
7. return the original result for an equivalent duplicate;
8. quarantine a conflicting duplicate;
9. sanitize failure details.

Owner-specific Events such as `progression.experience.applied.v1` or
`inventory.item.acquired.v1` MAY be emitted in the same owner transaction, but
they do not replace the generic Reward result.

------------------------------------------------------------------------

# Reward Reversal Protocol v1

Reward Engine publishes `reward.reversal.requested.v1` with:

- `rewardGrantId`;
- `componentId`;
- `fulfillmentId`;
- `reversalId`;
- `characterId`;
- `componentType`;
- `ownerEngine`;
- `originalOwnerOperationId`;
- `requestFingerprint`;
- `reasonCode`;
- `requestedScope`;
- `requestedAt`.

Owners publish exactly one logical terminal result:

- `reward.reversal.succeeded.v1`; or
- `reward.reversal.failed.v1`.

`reversalId` is the logical idempotency identity. Reversal is always a new
compensating workflow and never deletes the original owner operation.

Component Type registration declares one of:

- `FULLY_REVERSIBLE`;
- `CONDITIONALLY_REVERSIBLE`;
- `COMPENSATABLE`;
- `IRREVERSIBLE`.

An irreversible component produces a terminal, non-retryable reversal failure;
it MUST NOT silently report success.

------------------------------------------------------------------------

# Canonical Producer-Consumer Catalog

## Progression Facts

Consumers use:

- `progression.experience.applied.v1`;
- `progression.level.changed.v1`;
- `progression.prestige.available.v1`;
- `progression.prestige.completed.v1`;
- `progression.prestige.revoked.v1`.

`progression.prestige.changed.v1` is not a canonical v1 Event.

## Achievement Facts

Consumers use:

- `achievement.unlocked.v1`;
- `achievement.unlock.contested.v1`;
- `achievement.invalidated.v1`;
- `achievement.recognition.restored.v1`.

`achievement.integrity.changed.v1` is not a canonical v1 Event.

## Quest Facts

Consumers use:

- `quest.offered.v1`;
- `quest.accepted.v1`;
- `quest.activated.v1`;
- `quest.objective.progressed.v1`;
- `quest.objective.completed.v1`;
- `quest.completed.v1`;
- `quest.failed.v1`;
- `quest.expired.v1`;
- `quest.progress.corrected.v1`;
- `quest.integrity.invalidated.v1`.

`quest.integrity.changed.v1` is not a canonical v1 Event.

## Inventory Facts

Consumers use the exact fact required by their rule:

- `inventory.item.acquired.v1`;
- `inventory.item.consumed.v1`;
- `inventory.item.destroyed.v1`;
- `inventory.item.expired.v1`;
- `inventory.transfer.completed.v1`;
- `inventory.correction.applied.v1`.

Generic `inventory.item.granted.v1` and `inventory.item.removed.v1` Events are
not canonical because they hide materially different ownership transitions.

## Season Facts

The canonical lifecycle namespace is `season.edition.*`:

- `season.edition.activated.v1`;
- `season.edition.paused.v1`;
- `season.edition.resumed.v1`;
- `season.edition.closed.v1`;
- `season.edition.finalized.v1`;
- `season.schedule.revised.v1`;
- `season.content.binding.activated.v1`;
- `season.content.binding.deactivated.v1`;
- `season.participation.enrolled.v1`;
- `season.participation.completed.v1`.

Deprecated aliases such as `season.activated.v1`, `season.closed.v1`,
`season.ended.v1`, and `season.occurrence.changed.v1` MUST NOT be used by new
or updated consumers.

------------------------------------------------------------------------

# Talent Effect Integration

Talent Engine publishes `talent.effect.set.changed.v1` as a complete monotonic
snapshot for one Character and effect scope.

Reward Engine is the registered consumer for scope `reward-calculation` and
effect type `REWARD_AMOUNT_MODIFIER`.

Reward Engine MUST:

- maintain a local effect-set projection by Character and monotonic revision;
- pin the effect revision in the Reward evaluation context;
- apply exact integer or basis-point operations in registered order;
- persist the applied effect fingerprint and calculation breakdown;
- fail closed or apply an explicitly configured no-modifier policy when the
  projection is stale;
- finalize the amount before publishing an EXPERIENCE fulfillment request.

Progression Engine never applies Talent modifiers. It applies the finalized
integer amount supplied by Reward Engine.

------------------------------------------------------------------------

# Season Binding Protocol

Season Engine owns time and context; content Engines own content state.

For every mandatory binding:

1. the target Definition identity and fingerprint are validated before Season
   approval;
2. the target Engine publishes or exposes a registered readiness fact;
3. Season activation waits for mandatory readiness or an audited waiver;
4. Season publishes `season.content.binding.activated.v1`;
5. the target Engine idempotently applies its own activation context and may
   publish a binding acknowledgement;
6. Season records acknowledgement when the Manifest requires it;
7. close and finalization use explicit gates rather than assuming synchronous
   completion.

A schedule revision never rewrites an already effective schedule. Consumers
store the governing Season Schedule Revision for time-sensitive decisions.

------------------------------------------------------------------------

# Global Dependency and Cycle Validation

The Contract Registry maintains a directed graph whose nodes are immutable
activated configuration versions and whose edges include:

- Event type → Reward Trigger Binding;
- Event type → Quest Objective plan;
- Event type → Achievement Condition plan;
- Achievement → Achievement prerequisite;
- Quest → Quest or Campaign dependency;
- Reward Component → owner effect;
- Talent acquisition → emitted Event;
- Talent effect → consuming calculation scope;
- Season binding → target content version;
- Item interaction → downstream Event or Reward binding.

Publication or activation MUST fail when the release graph contains an
unapproved cycle. Version 1 permits no reactive cycle, even if every individual
operation is idempotent.

Every activated rule receives an immutable cycle-guard token. Runtime lineage
rejects re-entry and enforces maximum depth and fan-out.

The graph validation result and registry revision are pinned in each release
bundle and decision trace.

------------------------------------------------------------------------

# Projection Composition

The Presentation Composition Layer combines privacy-filtered projections for
clients. It owns no domain state and cannot repair or infer authoritative
facts.

Every composed response includes freshness metadata per source. Public output
uses the strictest applicable privacy and lifecycle policy. Missing or stale
data is labeled or omitted; it is never fabricated from another Engine's
state.

Character Engine remains authoritative for profile visibility and selected
presentation references. Entitlement and ownership facts remain projections
from their owning Engines.

------------------------------------------------------------------------

# Privacy Propagation

Character anonymization starts a durable platform privacy workflow before the
terminal `character.anonymized.v1` Event is published.

Registered Engines consume the minimized terminal Event, apply their own
retention policy, and publish restricted privacy acknowledgements containing no
erased personal data. A Platform Privacy Orchestrator tracks export, erasure,
search deindexing, cache purge, backup tombstone, and acknowledgement status.

Character Engine owns Character profile erasure; it does not claim that all
foreign Engine retention work is synchronously complete.

The restricted protocol uses:

- `character.privacy.propagation.requested.v1`, carrying `privacyWorkflowId`,
  minimized `characterId`, target Engine, required action, policy revision, and
  deadline;
- `privacy.propagation.acknowledged.v1`, carrying the same workflow identity,
  producer Engine, terminal or retryable status, applied policy revision, and
  a non-personal result fingerprint.

Acknowledgements are operational privacy facts, not Character lifecycle
transitions. Missing acknowledgement keeps the privacy workflow visible and
retryable; it never causes erased profile data to be restored.

------------------------------------------------------------------------

# Release Gates

The platform is releasable only when these cross-Engine scenarios pass with
duplicate, reordered, delayed, and replayed Events:

1. business fact → Reward → EXPERIENCE → Progression result;
2. Quest completion → multi-component Reward → partial failure → retry;
3. Achievement unlock → Reward without recursive re-unlock;
4. Talent modifier → Reward calculation → finalized Progression amount;
5. Item Reward → Inventory acquisition → safe reversal;
6. Season activation, schedule revision, close, late Event, and finalization;
7. Character suspension, restoration, closure, and anonymization propagation;
8. request fingerprint conflict and unauthorized producer quarantine;
9. Definition retirement with historical replay;
10. projection rebuild without duplicate authoritative effects.

------------------------------------------------------------------------

> Engines own state. Contracts make the platform whole.
