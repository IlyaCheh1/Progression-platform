# Reference Intake

Status: Stage 0 complete  
Last updated: 2026-07-19

| Role | Path / URL | Pinned SHA | Language | Package manager | Reuse |
|---|---|---|---|---|---|
| Landing / public UI | `L:\OG-landing` | `af53d25559e8a6d4cf35d5dcab7ba9c395476e57` | Next.js 15, React 19, Tailwind 3 | npm | Structure/sections; restyle to Witcher tokens; replace domain copy |
| RPG profile UI | `L:\OG\og-profile-frontend` | `3e1d35e0cf203881795ad663345bff78afdecbd7` | Next.js 16, React 19, Zustand, Tailwind 4 | npm | Shell layout, onboarding, settings, talents/achievements/tasks anatomy |
| Market UI / design system consumer | `L:\OG\og-market-frontend-main` | (no .git locally) | Nuxt 4, Vue 3, pnpm | pnpm | Patterns only; `@og-main/og-main-component-lib` is private — do not vendor blindly |
| Auth SSO | `L:\Playtest\docs\strategy\OG\_repo-scan\og-sso__backend` (+ frontend scan) | scan snapshot | Go Gin/Ent + Nuxt 3 | go / pnpm | Cookie OIDC, refresh rotation, MFA patterns via adapter |
| Support chat | `L:\tmp-og-chat` | (no .git locally) | Go + Vue 3 Vite widget | go / yarn | Transport/UX; no privileged command execution from chat |
| RPG / profile backend | `L:\OG\backend-main` | (no .git locally) | Go gRPC/gateway, sqlc, Postgres, Redis, NATS | go | Presentation patterns only; Engine ownership stays in MoS platform |

## Runtime notes

| Repo | Run | Tests | Security findings |
|---|---|---|---|
| OG-landing | `npm i && npm run dev` (:4028) | lint only | Do not copy OnlyGames legal/branding/secrets |
| og-profile-frontend | `npm i && npm run dev` | limited | Cookie `access_token`; rewrite auth client |
| og-sso scan | `make run` (Go) | present in scan | Adapt; User≠Character invariants |
| tmp-og-chat | `make run` / `yarn dev` | present | Attachment allowlist; retention required |
| backend-main | `.\run-dev.ps1` | present | Do not import OG domain schemas as authority |

## Reuse policy

- **Reuse:** UI composition, auth cookie/BFF patterns, chat embed transport, Next/Go stack choices.
- **Adapt:** Tokens → Witcher palette; Services → Schools; Caps → RPG mechanics; Quests/Achievements content → school pack.
- **Do not transfer:** Tenant branding, production credentials, OG wallet/currency as authoritative Engine, cross-tenant identity assumptions.

## License / dependency inventory

Local references are proprietary OnlyGames code used as implementation reference under project access. MoS production code is authored in-tree; no wholesale directory copy without audit (TZ §4.2).
