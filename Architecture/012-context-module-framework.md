---
document: 012-context-module-framework
title: Context Module Framework
owner: Platform Team
status: Proposed
version: 1.0.0
last_updated: 2026-07-18
depends_on:
  - 001-domain-definition
  - 002-platform-architecture
  - 002a-platform-contract-standard
  - 002b-cross-engine-integration
  - 004a-standard-level-profile
---

# Context Module Framework

## Purpose

Define how a business domain is integrated with Progression Platform without
moving domain logic into reusable Engines.

A Context Module is an anti-corruption and composition boundary. It owns real
business operations, publishes trustworthy facts, associates domain subjects
with Characters, and supplies versioned RPG content. Platform Engines remain
domain agnostic and authoritative for their own state.

------------------------------------------------------------------------

# Non-negotiable Boundaries

1. A Module owns business aggregates; an Engine owns reusable game state.
2. A Character never belongs to a Module.
3. A Module Association links a business subject to a Character.
4. CRM, billing, scheduling, attendance, medical, employment, and operational
   state are not Character profile fields.
5. A Module publishes facts. It never writes Engine tables or grants state
   directly.
6. Reward Engine decides configured rewards; owning Engines fulfill them.
7. A Module-specific rule is content or Module policy, not Engine source code.
8. A new semantic primitive requires an owner, registry entry, contracts, cycle
   analysis, tests, and an ADR.
9. Real-money payment and game currency are separate ledgers.
10. Sensitive business data is minimized before it enters platform Events.

------------------------------------------------------------------------

# Logical Structure

A production Module contains these layers:

| Layer | Responsibility |
|---|---|
| Experience surfaces | public site, personal cabinets, staff tools, bots and partner APIs |
| Business capabilities | CRM, scheduling, booking, billing, attendance and other domain operations |
| Module policy | validation, eligibility, corrections, timers and business automation |
| Integration adapter | identity mapping, canonical Events, inbox/outbox and schema translation |
| Platform content | Reward, Quest, Achievement, Item, Talent and Season Definitions |
| Projections | module dashboards plus presentation-safe composed views |
| Control metadata | Manifest, dependencies, privacy, SLOs, rollout and ownership |

A Module MAY deploy as one modular monolith. Each capability still has one
logical writer, separate schema ownership, explicit commands, and an outbox.

------------------------------------------------------------------------

# Repository Template

```text
modules/<module-key>/
├── README.md
├── module-manifest.yaml
├── architecture/
│   ├── capabilities.md
│   ├── domain-model.md
│   └── decisions/
├── schemas/
│   ├── events/
│   ├── commands/
│   └── projections/
├── content/
│   ├── rewards/
│   ├── quests/
│   ├── achievements/
│   ├── items/
│   ├── talents/
│   └── seasons/
├── migrations/
├── operations/
└── tests/
    ├── contracts/
    ├── replay/
    ├── privacy/
    └── end-to-end/
```

Documentation may combine these directories initially, but ownership and
release artifacts MUST remain identifiable.

------------------------------------------------------------------------

# Context Module Manifest

The Manifest is immutable after publication and uses semantic versioning.

Minimum fields:

```yaml
moduleKey: school.example
moduleVersion: 1.0.0
producer: example-school-module
realmKey: school.example
tenantMode: MULTI_TENANT
businessOwners:
  - capability: scheduling
    owner: school-scheduling
characterAssociation:
  subjectType: STUDENT
  cardinality: ONE_CHARACTER_PER_SUBJECT
progression:
  primaryTrackKey: platform.standard.100
produces:
  - eventType: school.training.attendance.recorded.v1
    schemaRef: schemas/events/training-attendance-recorded-v1.json
consumes:
  - eventType: progression.level.changed.v1
contentBundle:
  bundleId: <uuidv7>
  version: 1
privacy:
  defaultClassification: INTERNAL
  minorsMode: RESTRICTED
operations:
  sloProfile: standard-module-v1
  supportOwner: school-operations
```

The real Manifest MUST also declare:

- tenant and realm partitioning;
- aggregate types and authoritative writers;
- producer and consumer allowlists;
- schema, compatibility, replay, correction and deprecation policy;
- data classification, purpose, retention and regional constraints;
- content versions and global dependency edges;
- timer ownership and trusted time zone;
- required platform capabilities and disabled fallbacks;
- migration sources and reconciliation strategy;
- feature flags, rollout cohorts and rollback behavior;
- dashboards, alerts, runbooks and support ownership.

Activation fails closed when a required registry entry, owner, schema, content
version, privacy declaration, or dependency is unresolved.

------------------------------------------------------------------------

# Identity and Tenancy

A Module separates these identities:

| Identity | Owner | Meaning |
|---|---|---|
| User | Identity service | authenticated account |
| Character | Character Engine | durable digital identity |
| Business subject | Context Module | student, member, customer, employee or other domain person |
| Module Association | Character Engine | generic link from external business subject to Character |
| Tenant | Context Module/control plane | organization operating the Module |
| Actor | cause owner | user, staff member, service, timer or migration |

A payer, guardian, student, coach, renter, and Character may be different
entities. A phone number or e-mail address is never used as an aggregate key.

Anonymous leads do not receive Characters automatically. Character creation and
association require the configured account, consent, guardian and age policy.

------------------------------------------------------------------------

# Event Production

A business fact is eligible for platform publication only after the Module has
authoritatively committed it.

Every producer MUST:

1. validate the command and actor;
2. commit aggregate state, operation record, audit reference and outbox
   atomically;
3. publish the canonical envelope from
   `002a-platform-contract-standard`;
4. deduplicate commands and imports;
5. preserve effective and recorded time;
6. support correction, void, replay and reconciliation;
7. omit unnecessary personal, financial, health and free-text data.

Events use stable business references in payload fields and canonical UUIDv7
platform identifiers for platform entities.

------------------------------------------------------------------------

# Character Association

Association is an explicit Character Engine lifecycle requested by an
authorized Module or identity workflow:

```text
UNLINKED → PENDING_CONSENT → ACTIVE → SUSPENDED → CLOSED
```

Rules:

- one active association per declared cardinality;
- Character Engine is the authoritative writer of association state;
- the Module remains authoritative for subject eligibility and membership;
- link and unlink are audited;
- unlink does not delete either the Character or business subject;
- historical Events retain their canonical subject reference;
- reassignment requires elevated review and cannot silently transfer Rewards;
- minors and guardians follow module privacy policy;
- business membership expiry may suspend new Module rewards without closing the
  Character.

------------------------------------------------------------------------

# Platform Content Bundle

A Module release pins exact immutable versions of:

- Event schemas and producer contracts;
- Reward Trigger Bindings and Reward Definitions;
- Quest Definitions and Campaigns;
- Achievement Definitions and prerequisites;
- Item Definitions and Inventory interaction contracts;
- Talent Definitions and effect revisions;
- Season Definitions, Editions and content bindings;
- localization keys and approved assets.

All reactive edges participate in the global cycle validator. Content cannot be
activated independently when doing so would break the bundle.

------------------------------------------------------------------------

# Primary Progression

The default primary Character track is `platform.standard.100` from
`004a-standard-level-profile`.

Modules map business facts to Experience through Reward policy. They MUST NOT:

- calculate or write Level;
- scale primary Experience directly by payment amount;
- expose health or employment details in reward metadata;
- reward unsafe physical volume;
- use routine negative Experience;
- infer missing facts as successful activity.

A Module may own separate mastery or certification state when its semantics
include decay, renewal, assessor judgment, legal validity, or domain-specific
rank floors. It publishes safe outcome facts for Achievements and presentation.

------------------------------------------------------------------------

# Privacy and Safety

Before activation, every Event field and projection has:

- purpose and lawful-basis category;
- data subject and classification;
- audience and authorization rule;
- retention and deletion behavior;
- export behavior;
- correction and replay policy.

Modules serving minors default to private progression, private inventory,
disabled public leaderboards, guardian-aware controls, restricted messaging,
and minimal staff access. Health documents, payment details, payroll data, door
access codes and private CRM notes never enter general platform topics.

------------------------------------------------------------------------

# Operations and Reconciliation

Each Module provides:

- inbox/outbox lag, rejection and quarantine metrics;
- business-to-platform count and amount reconciliation;
- replay from an authoritative cursor;
- dead-letter repair without payload editing;
- correction and reversal runbooks;
- content rollback and kill switches;
- tenant-scoped backup and restore tests;
- privacy deletion propagation;
- consumer freshness and dependency dashboards.

------------------------------------------------------------------------

# Release Gates

A Module is releasable only when:

1. its Manifest validates;
2. every aggregate has one writer;
3. every Event has a registered schema and producer;
4. command retry and fingerprint-conflict tests pass;
5. duplicates, late arrivals, corrections and replays are deterministic;
6. Reward and reversal protocols complete end to end;
7. content dependencies are acyclic;
8. privacy and minors scenarios pass;
9. business totals reconcile with platform effects;
10. the Module can be disabled without corrupting Engine state;
11. no Engine imports Module code or business vocabulary;
12. the primary Level uses the standard profile or an approved ADR exists.
