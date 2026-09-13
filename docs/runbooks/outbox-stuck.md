# Runbook: Outbox stuck

## Symptoms
- `outboxLag` metric above threshold (module ops target: see fencing-school `module-manifest.yaml` → `operations.outboxLagAlertSeconds`)
- Rewards/Level not updating in cabinets

## Steps
1. Check platform-worker health and logs.
2. Inspect `outbox.events` where `published_at IS NULL`.
3. Verify broker connectivity (NATS).
4. Replay unpublished batch after poison message quarantine.
5. Confirm consumer inbox dedup keys prevent double grants.

## Agent notes
- Do not “fix” by mutating historical event payloads; publish corrections as new events.
- Invariants and gates: root `AGENTS.md` §§4–6. Normative contract: `Architecture/002a-platform-contract-standard.md`.
