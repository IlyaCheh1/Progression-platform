# Runbook: Outbox stuck

## Symptoms
- `outboxLag` metric above threshold
- Rewards/Level not updating in cabinets

## Steps
1. Check platform-worker health and logs.
2. Inspect `outbox.events` where `published_at IS NULL`.
3. Verify broker connectivity (NATS).
4. Replay unpublished batch after poison message quarantine.
5. Confirm consumer inbox dedup keys prevent double grants.
