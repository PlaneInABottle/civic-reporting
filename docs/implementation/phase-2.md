# Phase 2 implementation record

Phase 2 establishes the local Supabase schema, Auth, RLS, atomic transitions,
and shared contracts for the fictional Harborfield pilot. It does not implement
Phase 3 reporting UI, geocoding/maps, media, a real delivery adapter, or a real
government service.

## Local topology

- Web: Next.js on `http://127.0.0.1:3010`
- Supabase API/Auth: `http://127.0.0.1:54321`
- PostgreSQL: port `54322` in the task-owned Supabase container
- Studio: `http://127.0.0.1:54323`
- Mailpit: `http://127.0.0.1:54324`
- Storage and Realtime: disabled

Use only the project-local CLI. Never add `--linked`, run `db push`, or deploy
from these commands.

```sh
pnpm install --frozen-lockfile
pnpm db:start
pnpm db:reset:local
pnpm test:sql
pnpm types:generate
pnpm types:check
```

Copy `.env.example` to `apps/web/.env.local` and replace the placeholder with
the publishable key printed by the local CLI. Do not place privileged server
credentials in the web environment. Build and start the web runtime with:

```sh
pnpm build
pnpm qa:start
```

Stop only the task-owned processes:

```sh
pnpm qa:stop
pnpm db:stop
```

## Ordered schema

1. `20260803160000_extensions_and_types.sql` — PostGIS, pgcrypto, enums, deny-by-default privileges.
2. `20260803160100_identity_and_pilot.sql` — profiles, the synthetic pilot organization, jurisdiction/version, categories, and fixed presets.
3. `20260803160200_reporting_boundaries.sql` — verified drafts, reports, separate identity/exact/public location records, events, follows, assignments, notes, information requests, and duplicate links.
4. `20260803160300_operations_and_audit.sql` — moderation, delivery, audit, idempotency, and restricted legal grants.
5. `20260803160400_rls_and_public_views.sql` — all-table RLS, role policies, and explicit public-safe report/event views.
6. `20260803160500_atomic_rpc.sql` — verified draft create/withdraw and versioned report, moderation, and delivery transitions.
7. `20260803160600_actor_context.sql` — the caller-bound, redacted actor context used by server route guards.

The seed contains only unmistakably synthetic Harborfield data, a safe text
moderation signal, and a disabled fake destination. It contains no real person,
recipient, provider, government, unsafe content, or Auth user.

## Visibility and transition proof

The SQL suite exercises anonymous, citizen owner/non-owner, operator,
moderator, organization administrator at AAL1/AAL2, platform administrator, and
restricted legal-escalator contexts. Transaction-only fixtures create a second
organization solely to prove cross-organization denial and are rolled back.

- Citizens: own verified drafts, own identity/exact location, and owned reports.
- Operators: scoped report/contact/exact location and operational data; no
  moderation signals or platform/legal browsing.
- Moderators: scoped report/public location and moderation data; no reporter
  identity, exact location, internal operational notes, routing configuration,
  or institutional status RPC.
- Organization administrators: AAL2 membership/config/audit boundary; no
  inherited contact, exact location, or moderation reveal.
- Platform administrators: own preset and redacted platform surface only; no
  base report, identity, exact location, moderation, or organization audit
  browsing.
- Legal escalators: no general navigation or table browsing. A case-scoped grant
  exists as a future restricted boundary, not a completed legal workflow.
- Anonymous/public: only active synthetic configuration and explicit safe report
  views. Sensitive base-table API requests are denied.

Atomic tests prove allowed transitions, wrong-role denial, stale-version denial,
idempotent replay, changed-payload conflicts, separate exact/public coordinates,
and one append-only event/audit record per successful change.

## RED → GREEN record

The phase was implemented as vertical slices. Representative evidence:

| Slice                 | RED                                                                                             | GREEN                                                                                 |
| --------------------- | ----------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| Local tooling         | `phase2-tooling-boundaries.test.ts` failed 2/3 before the pinned CLI/config existed             | 3/3 passed                                                                            |
| Schema                | `00_schema_contract.test.sql` failed 35/35 before migrations                                    | schema contract passed after ordered migrations                                       |
| Synthetic seed        | seed suite failed 8/9 against the empty schema                                                  | 10/10 passed after the local-only seed and public-event assertion                     |
| RLS                   | role matrix initially failed before policies/fixtures were complete                             | 62/62 role/field/organization/event-visibility assertions passed                      |
| Atomic RPC            | suite failed because all five RPCs were absent                                                  | 42/42 transition/idempotency/audit/identifier assertions passed                       |
| Actor context         | suite failed because the actor RPC was absent                                                   | 12/12 caller/preset/AAL assertions passed                                             |
| Contracts/domain      | Vitest failed to resolve the new packages                                                       | 6 contract and 9 domain tests passed                                                  |
| Type drift            | `pnpm types:check` rejected the placeholder                                                     | actual local generation and drift check passed                                        |
| OTP/session           | auth component/source tests failed before routes and adapters existed                           | paste, invalid/expired recovery state, claim, redirect, and route-source tests passed |
| MFA                   | component/source tests failed before enrollment existed                                         | enrollment/challenge and recoverable failure tests passed                             |
| Browser OTP           | first focused Playwright run exposed ambiguous Next alert selection and a Mailpit indexing race | both viewports passed after test-only locator/poll fixes                              |
| Draft storage failure | new component test hung on a rejected IndexedDB claim                                           | catch/recovery behavior passed without discarding the draft                           |

Agent Browser used the dedicated `civic-reporting-codex-qa` session to verify a
real local citizen OTP/draft claim, operator-to-moderator denial in both
directions, AAL1 administrator denial, TOTP enrollment and AAL2 challenge,
redacted platform access, organization-administrator access without sensitive
reveal, mobile reflow, keyboard focus order, and clean console/error output.
Phase 5 still owns durable automated staff workspace journeys.

The final command counts and independent Flash review disposition are recorded
in the Phase 2 handoff and `.hermes/reviews/`.

## Honest blockers

This is a local/staging technical pilot foundation, not production launch
approval. Legal basis, privacy review, retention/deletion operations,
real-jurisdiction authority, production email and DNS, MFA recovery, support
staffing, moderation staffing/provider DPA, real delivery, monitoring,
backup/restore, incident response, accessibility audit with users, and security
assessment remain blockers. Public media is disabled.
