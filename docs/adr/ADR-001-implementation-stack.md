# ADR-001: Implementation Stack

Status: Accepted  
Date: 2026-07-19

## Context

TZ §8 proposes NestJS + Next as fallback when references disagree. Reference repositories under `L:\OG` and related scans consistently use **Go** backends and a mix of Vue/Nuxt and **Next/React** frontends. Public landing and RPG profile references are Next.js.

## Decision

| Layer | Choice |
|---|---|
| Web (landing, cabinets, RPG profile, Studio UI) | Next.js App Router + React 19 + TypeScript + Tailwind |
| Platform API / Workers | Go + PostgreSQL + Redis (cache/locks/queues only) + transactional outbox |
| School API / Workers | Go modular monolith capability packages |
| Auth | OnlyID / og-sso compatible adapter (OIDC + HttpOnly cookies) |
| Support chat | Go service + embeddable widget patterns from tmp-og-chat |
| Monorepo JS tooling | pnpm workspace |
| Local infra | Docker Compose (Postgres, Redis, MinIO, NATS or equivalent, fakes) |
| Contracts | OpenAPI + JSON Schema events; integer XP/mastery; money in minor units |

**Rejected:** NestJS fallback from TZ §8.1 — references already agree on Go.

## Consequences

- Shared contracts live in `schemas/` and `packages/contracts`.
- Engine packages under `platform/*` are Go modules with schema ownership.
- Frontend does not call Engine writes except via versioned APIs.
