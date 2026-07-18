# ADR-002: Deployment Topology

Status: Accepted  
Date: 2026-07-19

## Decision

First production release uses limited deployable units (TZ §7.1):

| Unit | Contents |
|---|---|
| `apps/web` | Public site, cabinets, RPG profile, Studio UI |
| `apps/platform-api` | Engine commands/queries, BFF composition |
| `apps/platform-worker` | inbox/outbox, timers, reward fulfillment, projections |
| `apps/school-api` | identity, CRM, scheduling, booking, commerce, training, mastery |
| `apps/school-worker` | integrations, communications, migration jobs |
| `apps/auth-adapter` | OnlyID/SSO boundary adapter |
| support-chat | Separate unit only if embed requires independent deploy |

Engines remain logical modules with separate schema ownership inside platform units. Extract network services only with measured need + ADR.
