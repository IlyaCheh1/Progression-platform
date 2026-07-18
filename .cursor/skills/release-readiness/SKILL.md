---
name: release-readiness
description: Assess whether a change is safe to release, including rollout, rollback, observability, migrations, compatibility, and operational risk.
disable-model-invocation: true
---
# Release readiness

Review the change and produce a release checklist covering:

- user-visible behavior and acceptance criteria;
- feature flags and staged rollout;
- backwards/forwards compatibility;
- database migrations and backfills;
- environment variables and secrets;
- monitoring, logs, metrics, alerts, and Sentry coverage;
- failure modes, retry/idempotency behavior, and capacity impact;
- security and privacy risks;
- rollback or forward-fix procedure;
- documentation and support notes;
- exact verification completed.

Mark blockers explicitly. Do not declare ready when critical checks are missing.
