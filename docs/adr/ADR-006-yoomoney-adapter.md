# ADR-006: ЮMoney (ЮKassa) payment adapter

## Status

Accepted (2026-07-19)

## Context

Operational MVP requires membership checkout, webhook confirmation, refunds, and (Phase 2) recurring payments. CloudPayments is **out of scope**. OnlyID auth remains unchanged (ADR-003 deferred).

## Decision

1. **Provider:** ЮKassa (ЮMoney) only — sandbox adapter in `packages/contracts/integrations/yoomoney`.
2. **Integration shape:** `CreatePayment`, `SimulateWebhook`, `Refund`, `CreateRecurringPayment` behind a small interface; school-api exposes checkout + webhook routes.
3. **Idempotency:** webhook handler keys on provider payment ID + event ID; membership activation is single-writer in `SchoolModule`.
4. **Production path (deferred):** real HTTP client gated by `YOOKASSA_SHOP_ID` + `YOOKASSA_SECRET_KEY`; signature verification on webhooks; reconciliation job reads payment registry.
5. **Fiscal:** receipt payload stub in sandbox; real fiscal provider wired when commerce goes production.

## Consequences

- No CloudPayments code or env vars in repo.
- E2E-16 (provider failure) tested manually via sandbox simulate until HTTP client lands.
- Postgres payment rows exist in migration 002 but runtime still uses in-memory + snapshot blob until repo layer is wired.

## Alternatives considered

- CloudPayments — rejected by product decision.
- Stripe — rejected (RU market / spec).
