# Threat Model (Stage 0 baseline)

Scoped surfaces: auth, tenant boundaries, guardian access, payment webhooks, support chat, uploads, admin publishing, Excel import, reward replay, Higgsfield design-time assets.

## Top risks

| Threat | Control |
|---|---|
| Cross-tenant read | tenantId on rows + deny-by-default RBAC + negative tests |
| Reward amplification / duplicate attendance | idempotency keys + inbox dedup |
| Auth cookie theft | HttpOnly Secure cookies, refresh rotation |
| Minor privacy leak | private by default, no public leaderboards |
| Excel identity mismatch | staging quarantine + reviewer approval |
| Secret leakage | env schema, no secrets in Git |

Production providers remain sandbox until TZ §40 approvals.
