---
document: school-fencing-functional-capabilities
title: Fencing School Functional Capabilities
owner: School Product Team
status: Proposed
version: 1.0.1
last_updated: 2026-07-18
depends_on:
  - school-fencing-module-architecture
  - 014-partner-content-studio
---

# Functional Capabilities

## Scope Principle

The functional site specification becomes the operational surface of the
Context Module. Game mechanics are added through platform bindings and content,
not embedded as ad-hoc columns in CRM or booking tables.

------------------------------------------------------------------------

# Roles

| Role | Primary permissions |
|---|---|
| Guest | public catalog, schedule, trial request, rental/event request and allowed payment flows |
| Student | own groups, schedule, memberships, payments, Character, progression, mastery and content |
| Guardian or family manager | authorized dependant profiles, consent, schedule and payments; no unrestricted private diary access |
| Coach | assigned schedule, roster, attendance, training records and own compensation projection |
| Renter | own bookings, recurring requests, payments, documents and access instructions |
| Administrator | CRM, schedule, booking, commerce operations, communications, content and approved corrections |
| Content designer | versioned platform content drafts without access to CRM or payments |
| Owner | tenant configuration, roles, finance and payroll reports, release approval and audit |
| Service actor | provider webhook, timer, import, reconciliation or platform consumer with least privilege |

The Guardian role is a required addition because the school offers children's
programs and family payments.

------------------------------------------------------------------------

# Capability Matrix

| ID | Capability | Phase | Owner | Required behavior |
|---|---|---:|---|---|
| FS-WEB-01 | Public home and directions | MVP | Content | positioning, directions, trainers, halls, reviews and CTA |
| FS-WEB-02 | Direction landing pages | MVP | Content | Witcher, Wushu, Rapier, children and configurable future directions |
| FS-WEB-03 | Public group schedule | MVP | Scheduling | filters, live capacity and no private rental details |
| FS-WEB-04 | Prices and offers | MVP | Commerce | memberships, trial, one-off, student, morning, family and multi-group offers |
| FS-WEB-05 | Rental and event pages | MVP | Content/Booking | hall assets, packages, request form; live self-booking in Phase 2 |
| FS-WEB-06 | Blog and campaign pages | MVP | Content | CMS, SEO, UTM persistence, campaign templates |
| FS-IAM-01 | Account and Character onboarding | MVP | Identity adapter | explicit User, student and Character association |
| FS-IAM-02 | Guardian and dependant management | MVP | School Identity | scoped authority, consent evidence and expiry |
| FS-IAM-03 | Role-based access | MVP | School Identity | tenant roles, assignment scope and audit |
| FS-CRM-01 | Lead card and source | MVP | CRM | UTM, direction, contact, communication and task history |
| FS-CRM-02 | Funnel | MVP | CRM | inquiry → contacted → trial booked → attended → purchased → active → at risk → left |
| FS-CRM-03 | Tasks and deadlines | MVP | CRM | contact SLA, no-show, expiry and follow-up |
| FS-CRM-04 | Segments and campaigns | Phase 2 | CRM/Communications | direction, hall, lifecycle, recency, value and multi-group |
| FS-CRM-05 | Churn automation | Phase 2 | CRM | no attendance for two weeks, failed renewal and coach-change cohort |
| FS-SCH-01 | Unified hall calendar | MVP | Scheduling | groups, trials, rental, events, maintenance and blocks |
| FS-SCH-02 | Conflict prevention | MVP | Scheduling | transactional exclusion by hall and interval |
| FS-SCH-03 | Recurrence and semester generation | MVP | Scheduling | revisioned recurring templates and exception dates |
| FS-SCH-04 | Bulk move or cancellation | MVP | Scheduling | impact preview, confirmation, notifications and freed capacity |
| FS-SCH-05 | iCal and Google export | Phase 2 | Scheduling | privacy-filtered student and coach feeds |
| FS-BKG-01 | Trial booking | MVP | Booking | direction, group/slot, contact, consent, configurable payment |
| FS-BKG-02 | Group enrollment | MVP | Booking | capacity, membership eligibility and effective start |
| FS-BKG-03 | Waitlist | Phase 3 | Booking | ordered offers, expiry and atomic capacity claim |
| FS-BKG-04 | Public hall booking | Phase 2 | Booking | 30-minute slots, tariffs, minimum duration and payment |
| FS-BKG-05 | Recurring rental | Phase 3 | Booking | series, exceptions, B2B documents and approval |
| FS-BKG-06 | Events and tickets | Phase 2 | Booking | package quote, payment link, registration and QR |
| FS-COM-01 | Product and tariff catalog | MVP | Commerce | versioned prices, discounts and applicability |
| FS-COM-02 | Membership lifecycle | MVP | Commerce | activate, renew, expire, freeze and remaining sessions/days |
| FS-COM-03 | Proration and recalculation | MVP | Commerce | mid-month start, illness/freeze evidence reference and audit |
| FS-COM-04 | Payment registry | MVP | Commerce | online, cash and manual transfer in one ledger |
| FS-COM-05 | Fiscal receipts | MVP | Commerce | provider status, e-mail/SMS delivery reference and reconciliation |
| FS-COM-06 | Refunds | MVP | Commerce | full/partial, reason category, approval and provider reconciliation |
| FS-COM-07 | Recurring payment | Phase 2 | Commerce | notice before charge, one-click opt-out and failed-charge state |
| FS-COM-08 | Family allocation | MVP | Commerce | one payer, multiple students and explicit line allocation |
| FS-COM-09 | Certificates and promo codes | Phase 2 | Commerce | issue, code, redemption, UTM attribution and liability report |
| FS-TRN-01 | Mobile attendance | MVP | Training | assigned coach, two-step confirmation and revision |
| FS-TRN-02 | Training record | MVP | Training | curriculum exercise, sets/sides/actions, equipment and coach evidence |
| FS-TRN-03 | Correction and void | MVP | Training | immutable revision, reason, actor and compensating Events |
| FS-TRN-04 | Exercise catalog | MVP | Training | stable codes, localized names, allowed weapons and safety limits |
| FS-TRN-05 | Equipment catalog | MVP | Training | measured grams, classification, verification and effective dates |
| FS-MAS-01 | Eight weapon tracks | MVP | Mastery | exact taxonomy and independent ledgers |
| FS-MAS-02 | Mastery calculation | MVP | Mastery | integer load units, 75/25 allocation and monthly bonus |
| FS-MAS-03 | Daily decay | MVP | Mastery | persisted timer, local day, active track and earned-rank floor |
| FS-MAS-04 | Rank transition | MVP | Mastery | ranks 0-10 and immutable transition facts |
| FS-MAS-05 | Mastery history | MVP | Mastery | private explanation and coach-visible evidence |
| FS-RPG-01 | Primary Level 1-100 | MVP | Progression binding | standard platform profile only |
| FS-RPG-02 | Starter Rewards and quests | MVP | Platform content | onboarding, attendance, consistency and learning |
| FS-RPG-03 | Achievements and Items | MVP | Platform content | starter set, weapon recognition and cosmetics |
| FS-RPG-04 | Talents and Season | Phase 2 | Platform content | non-pay-to-win utility trees (Путь клинка, Братство Волка, Кодекс) and academic Season |
| FS-RPG-05 | Content administration | MVP | Control plane | draft, preview, dependency validation, approval and rollback |
| FS-MSG-01 | Transactional notifications | MVP | Communications | Telegram preferred, SMS fallback, e-mail where appropriate |
| FS-MSG-02 | Reminder schedule | MVP | Communications | trial 24h/2h and membership expiry 3 days |
| FS-MSG-03 | Campaign planner | Phase 2 | Communications | segment, template, schedule, consent and delivery report |
| FS-REP-01 | Active students and revenue | MVP | Analytics | monthly, direction, hall and revenue type |
| FS-REP-02 | Conversion and attribution | MVP | Analytics | UTM → lead → trial → purchase → revenue |
| FS-REP-03 | Churn and cohorts | Phase 3 | Analytics | renewal, reason, cohort and attendance risk |
| FS-REP-04 | Hall utilization | Phase 3 | Analytics | hourly heat map and non-prime revenue |
| FS-REP-05 | Coach compensation | MVP | Analytics | transparent model projection, owner-restricted |
| FS-REP-06 | Game health | MVP | Analytics | reward rate, quest completion, mastery corrections and suspicious volume |
| FS-INT-01 | Payment and fiscal provider | MVP | Commerce adapter | idempotent webhooks, tokens and reconciliation |
| FS-INT-02 | Telegram and SMS | MVP | Communications adapter | consent, delivery receipt and fallback |
| FS-INT-03 | Maps and reviews | MVP | Content adapter | public-only data |
| FS-INT-04 | Advertising audiences | Phase 2 | Marketing adapter | consented export, suppression and audit |
| FS-INT-05 | Call tracking | Phase 3 | CRM adapter | attribution without leaking call content to platform |
| FS-INT-06 | Access control system | Phase 3 | Booking adapter | time-bound access and revocation |
| FS-NFR-01 | Mobile and accessibility | MVP | Web | 360px+, keyboard, contrast, reduced motion and screen-reader labels |
| FS-NFR-02 | Performance | MVP | Platform | mobile LCP under 2.5s and booking API p95 under 300ms under declared load |
| FS-NFR-03 | Availability and backup | MVP | Operations | 99.5% target, daily backup and 30-day retention |
| FS-NFR-04 | Privacy and law configuration | MVP | Security/Product | consent, localization, retention and counsel-approved policies |
| FS-NFR-05 | Audit and observability | MVP | Operations | actor, reason, correlation, metrics and alerts |

------------------------------------------------------------------------

# Functional Additions Required for Integrity

These requirements were not explicit enough in the source specification and
are mandatory for a production Module:

1. guardian and dependant access;
2. generic Character association lifecycle;
3. immutable attendance and training-record revisions;
4. exercise and equipment catalogs with effective versions;
5. game-content authoring, release bundle and kill switches;
6. deterministic mastery recalculation and backfill;
7. reward reversal after corrected attendance;
8. separation of payment, game Reward and voucher ledgers;
9. purpose-limited medical evidence references;
10. minors-safe visibility and messaging;
11. import staging, validation and reconciliation for spreadsheets;
12. accessibility and reduced-motion alternatives for RPG feedback;
13. suspicious training-volume review without automatic punishment;
14. separate freshness indicators in composed cabinets;
15. explicit data deletion and Character unlink workflows.

------------------------------------------------------------------------

# Cabinet Requirements

## Student

The student sees:

- upcoming sessions and changes;
- membership status and payment documents;
- primary Level, current Experience and recent safe reward explanations;
- eight weapon mastery tracks with rank floors and decay forecast;
- active quests, achievements, Items and selected cosmetics;
- privacy, notification and visibility controls.

Raw coach notes, payroll, CRM tags and other students' data are absent.

## Guardian

The guardian sees only dependants and scopes granted by policy. Progression and
mastery visibility can vary by age and consent. A dependant's private social
profile is not automatically exposed.

## Coach

The coach sees assigned sessions, roster, attendance and structured training
entry. The interface validates unusual volume or equipment values before
commit. Financial information is limited to the coach's own compensation view.

## Administrator

The administrator sees queues for leads, bookings, payments, schedule
conflicts, imports, corrections and communication failures. Game-state changes
are requested through registered support workflows rather than database edits.

------------------------------------------------------------------------

# Prohibited Designs

- a single “client” row combining payer, student, User and Character;
- one calendar table per booking type;
- Level stored in CRM;
- XP calculated in the browser;
- positive payment amount converted directly into Experience;
- hard deletion of attendance used by Rewards;
- free-text weapon names in training records;
- public ranking of minors by physical load;
- reusing phone or e-mail as an idempotency key;
- manual spreadsheet totals treated as unquestioned source truth.
