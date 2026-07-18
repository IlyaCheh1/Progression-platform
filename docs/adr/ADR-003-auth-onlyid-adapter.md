# ADR-003: Auth OnlyID Adapter

Status: Accepted  
Date: 2026-07-19

## Decision

Authentication uses an OnlyID / og-sso compatible boundary:

- OIDC authorize + BFF cookie exchange
- HttpOnly Secure cookies: `access_token`, `refresh_token`, optional `sso_session_id`
- Refresh rotation and session revocation audited
- MFA required for privileged roles (admin, publishing)
- Deny by default RBAC, tenant-scoped

## Identity invariants

- User ≠ Character
- Character does not belong to Module
- Student / Guardian are school business identities
- Staff roles are tenant-scoped
- Service actors have separate principals
- Cross-tenant identity leakage is forbidden

Local/dev may use `auth-adapter` with deterministic demo users when OnlyID sandbox is unavailable; production credentials require user approval (TZ §40).
