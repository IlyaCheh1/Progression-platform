---
document: school-fencing-integrations-data
title: Fencing School Integrations and Data Architecture
owner: School Platform Team
status: Proposed
version: 1.0.0
last_updated: 2026-07-18
depends_on:
  - school-fencing-domain-model-events
  - school-fencing-functional-capabilities
---

# Integrations and Data Architecture

## Integration Principle

External systems are untrusted, retrying, partially available adapters. The
school commits normalized business state before producing platform facts.

Provider payloads are retained only as encrypted, access-restricted evidence
for the minimum approved period. They are never copied into general Events.

------------------------------------------------------------------------

# Integration Matrix

| Integration | Phase | Adapter owner | Source of truth | Failure behavior |
|---|---:|---|---|---|
| ЮKassa or CloudPayments + SBP | MVP | Commerce | school Payment aggregate plus reconciled provider status | retry webhook, poll reconciliation, no duplicate settlement |
| fiscal receipt provider | MVP | Commerce | Fiscal Receipt aggregate | payment may be settled while receipt is pending; alert and retry |
| Telegram bot | MVP notifications; Phase 2 booking | Communications | school command result | queue and fallback according to consent |
| SMS gateway | MVP | Communications | dispatch record | bounded retry, delivery status and alternate channel |
| e-mail | MVP | Communications | dispatch record | asynchronous; never blocks booking commit |
| Yandex Maps and reviews | MVP | Content | public provider data/cache | stale-safe public fallback |
| VK Ads / Yandex Direct audiences | Phase 2 | Marketing | consented CRM segment export | suppress unauthorised contacts, audit export |
| call tracking | Phase 3 | CRM | normalized call attribution | no call recording in platform Event |
| Google Calendar / iCal | Phase 2 | Scheduling | school schedule projection | signed or revocable feeds |
| access-control system | Phase 3 | Booking | active reservation entitlement | fail closed, short-lived access and revocation |
| Progression Platform | MVP | Platform Adapter | owning Engine per state class | inbox/outbox retry and reconciliation |

Provider selection remains a deployment decision. Contracts depend on
capabilities, not provider-specific field names.

------------------------------------------------------------------------

# Payment Adapter Contract

## Inbound

- validate provider signature and source;
- preserve provider Event ID and body hash;
- reject tenant or merchant mismatch;
- map money into integer minor units and currency;
- accept out-of-order webhook delivery;
- deduplicate by provider, merchant, Event ID and operation;
- reconcile by provider API when state is ambiguous.

## Outbound

- use one school Payment Attempt ID as idempotency identity;
- send amount, currency, order reference and fiscalization inputs;
- never send Character game state;
- store provider token references, not card data;
- separate authorization, capture, settlement, refund and chargeback.

## Platform Effects

`school.payment.completed.v1` is an Analytics and school-operations fact by
default. It is not a generic Experience trigger. Referral or campaign Rewards
consume separately qualified business facts.

------------------------------------------------------------------------

# Communications

A communication is created from a committed trigger and immutable template
version.

Required fields:

- recipient Person ID;
- purpose and consent basis;
- channel preference and fallback order;
- template key and version;
- bounded template parameters;
- scheduled time;
- dispatch attempt and provider reference;
- delivery, failure or suppression status;
- originating aggregate and correlation ID.

The Platform may produce a user-facing notification fact, but CRM contact data
stays in the school Communications capability.

Operational triggers include:

- trial confirmation and 24h/2h reminders;
- membership expiry and payment failure;
- session move or cancellation;
- waitlist offer;
- booking confirmation and cancellation;
- school campaign;
- Level, Quest, Achievement, Item and Mastery celebration.

Game celebrations use in-app composition first. SMS is not a default channel
for every game receipt.

------------------------------------------------------------------------

# Data Classification

| Data | Classification | Storage and audience |
|---|---|---|
| public pages, public schedule and prices | PUBLIC | CDN/CMS |
| Character safe presentation and elected cosmetics | PUBLIC or INTERNAL by visibility | Engine projections |
| student identity and contacts | RESTRICTED | School Identity |
| guardian relationship and consent | RESTRICTED | School Identity |
| CRM notes and communications | RESTRICTED | CRM |
| attendance | INTERNAL | student/guardian policy, assigned coach, admin |
| raw exercise and equipment load | RESTRICTED | student/guardian policy, assigned coach, authorized admin |
| Mastery Rank | INTERNAL by default | public only by explicit Character selection |
| payment, refund and receipt | RESTRICTED | Commerce and authorized student/payer/admin |
| coach payroll | HIGHLY_RESTRICTED | coach self view and owner |
| medical evidence | HIGHLY_RESTRICTED | dedicated evidence store; reference only |
| door access code | SECRET | short-lived access service; never analytics or Event bus |
| UTM attribution | INTERNAL | CRM/Analytics with retention |
| provider raw payload | RESTRICTED | encrypted adapter evidence |

Exact retention periods require approved policy and legal review. Architecture
must support deletion, restriction, export and audit; this document does not
replace legal advice.

------------------------------------------------------------------------

# Analytics Model

Analytics consumes committed facts and builds projections. It never becomes a
transactional source.

## Commercial metrics

- active students by month and direction;
- revenue by direction, hall and type;
- average receipt per student with family allocation;
- multi-group share and lifetime value;
- funnel conversion and channel attribution;
- churn, reason categories and cohorts;
- hall utilization and non-prime revenue;
- coach-compensation model output.

## Learning and game health

- eligible attendance to Experience grant ratio;
- duplicate, rejected and reversed Reward counts;
- Quest completion distribution;
- Achievement unlock distribution;
- Level distribution by cohort, private and aggregated;
- Mastery Rank transitions and correction rate;
- daily decay backfill lag;
- suspicious training-volume review count;
- content bundle and policy version in every metric.

Raw personal training comparisons are not marketing segments.

------------------------------------------------------------------------

# Skew and Time

- business effective time comes from the school aggregate;
- provider time is evidence, not automatically authoritative;
- school schedules are authored in `Europe/Moscow` and persisted as UTC plus
  original zone;
- mastery day is the Module's trusted local date at 03:00;
- Platform Events include both `occurredAt` and `recordedAt`;
- analytics keeps both and labels late-arriving facts;
- client device time never finalizes attendance, booking or mastery.

------------------------------------------------------------------------

# Import Pipeline

Spreadsheet and legacy imports pass through:

```text
Upload → hash → quarantine scan → parse → stage → validate
       → identity match → preview → approval → commit → outbox → reconcile
```

Required controls:

- immutable source file hash;
- worksheet and logical-row provenance;
- canonical weapon alias mapping;
- student identity matching with ambiguity queue;
- integer conversion with displayed-difference report;
- duplicate detection across repeated imports;
- rank-floor and negative-value validation;
- dry-run totals by student, month and weapon;
- operator approval and cut-off;
- compensating import revision, never silent overwrite.

------------------------------------------------------------------------

# Reconciliation

| Reconciliation | Expected equality or relation |
|---|---|
| payment | school settled amount = provider settled amount by operation and currency |
| fiscalization | each fiscalized payment/refund has expected receipt outcome |
| booking calendar | every blocking booking has one active reservation |
| attendance | each active record maps to one session and student |
| training to mastery | confirmed entries = applied or explicitly rejected Mastery operations |
| attendance to Reward | eligible record = one grant, skip or documented rejection |
| Reward to Progression | each XP Component reaches one terminal fulfillment |
| Reward to Inventory | each Item Component reaches one terminal fulfillment |
| Character association | each platform Event subject maps to an active association at the policy time |
| spreadsheet migration | staged totals reconcile to accepted ledger entries plus explained differences |

Reconciliation repairs use owner commands and new Events. They never edit broker
messages or another owner's database.

------------------------------------------------------------------------

# Backup, Restore and Disaster Recovery

- daily database backups retained for at least the specified 30-day target;
- restore tests include schedule exclusion constraints, payment ledger,
  Training and Mastery ledgers, inbox and outbox;
- provider reconciliation runs after restore before reopening financial writes;
- outbox dispatch resumes from durable state;
- duplicate provider and platform delivery remains harmless;
- analytics projections may rebuild from facts;
- access-control entitlements are revoked or regenerated after a security
  restore according to policy.

------------------------------------------------------------------------

# Observability

Required dashboards:

- public and cabinet availability;
- booking conflict and latency;
- provider webhook lag and signature failures;
- payment-to-receipt lag;
- notification queue and delivery rate;
- outbox/inbox lag by Event type;
- Reward fulfillment terminal rate;
- mastery timer lag and replay duration;
- import rejection and ambiguity counts;
- privacy deletion propagation;
- tenant isolation alarms.

Logs use IDs and bounded categories. Names, phone numbers, e-mail, health notes,
payment instruments and access codes are redacted.

