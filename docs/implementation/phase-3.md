# Phase 3 implementation record

Phase 3 adds the text-only public reporting journey for the fictional
Harborfield pilot. It is a local/staging technical pilot, not a real government
service or a launch approval. Public media remains disabled.

## Implemented vertical slice

- A mobile-first location step with browser geolocation and a complete address
  search path that does not require a map.
- Private exact address/coordinates and separately rounded public location at
  every database, contract, API, HTML, metadata, and timeline boundary.
- Private duplicate suggestions, support/undo, and an explicit follow opt-in;
  notification delivery is not claimed or implemented.
- Expiring IndexedDB drafts, real local email OTP recovery, and atomic transfer
  to a verified server draft in the same browser.
- An atomic, idempotent report submission boundary with stale/payload conflict
  protection, append-only audit evidence, and a semantic text-publication gate.
- A local-only fake moderation adapter for deterministic tests. Non-local
  configuration fails closed unless an approved adapter is explicitly
  configured. No real provider is contacted.
- Public-safe report browse/detail views and an actor-qualified timeline that
  says only what the platform has evidence for. No delivery claim is made.
- A list-first weak-connection experience with an optional tile-free schematic
  map, explicit offline/stale/error/loading/empty states, and retained list
  content during connectivity loss.
- A request-scoped nonce CSP for dynamic Next.js responses. Production policy
  contains no `unsafe-inline` or `unsafe-eval`; public media remains `none`.

## Local operation

Use only the disposable project whose `supabase/config.toml` project ID is
`civic-reporting-phase2-local`. Never link or deploy it.

```sh
pnpm install --frozen-lockfile
pnpm db:start
pnpm db:reset:local
pnpm test:sql
pnpm types:check
pnpm build
pnpm qa:start
```

The app runs on `http://127.0.0.1:3010`. Mailpit remains local at
`http://127.0.0.1:54324`. The local Edge Function uses the explicit fake text
moderation adapter only when `CIVIC_RUNTIME_ENV=local` and
`TEXT_MODERATION_ADAPTER=fake_local`; its example configuration is disabled.

Stop only task-owned processes:

```sh
pnpm qa:stop
pnpm db:stop
```

## RED -> GREEN evidence

The behavioral changes were introduced as focused failing tests before their
minimum implementations. Representative evidence from this phase:

| Slice                        | Confirmed RED                                                                                                    | GREEN                                                                                       |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| Public SQL contract          | New report/publication/relationship assertions failed against the Phase 2 schema                                 | 14/14 contract assertions passed                                                            |
| Stateful SQL behavior        | Submission, moderation, replay, stale state, audit, support, and visibility assertions initially failed          | 51/51 behavior assertions passed                                                            |
| Shared contracts/domain/data | New schemas and mappings were missing                                                                            | 13 contract, 14 domain, and 5 data-access tests passed                                      |
| Strict CSP                   | 3/4 source-policy assertions failed while the framework policy allowed inline script                             | nonce propagation and production strict-policy assertions passed                            |
| Report flow                  | New location, validation, duplicate, support, and publication component tests failed before the flow existed     | Phase 3 component paths passed, including deterministic focus restoration                   |
| OTP/draft recovery           | Support-intent and storage-recovery tests failed before intent-aware claims                                      | both new-report and private-support intents survived OTP and claimed atomically             |
| Moderation retry             | The helper and retry semantics were absent                                                                       | first local provider failure remained pending; retry published the same report              |
| Refresh idempotency          | Browser retry initially lost the pending server draft, while an earlier implementation reopened finalized drafts | pending drafts remain retryable; published/rejected drafts no longer trap a new journey     |
| Auth regression              | A claimed report draft overrode explicit `next=/account/drafts` in both browser viewports                        | explicit safe account destinations win; reporting recovery destinations remain intent-aware |

The dedicated Agent Browser session `civic-reporting-codex-qa` exercised mobile
keyboard/non-map/error focus paths, draft-to-OTP handoff, the provider failure
and retry journey, private duplicate support/undo and follow behavior, citizen
dashboard state, desktop list/map synchronization, offline list preservation,
and fresh public-detail leakage probes. The automated browser suite repeats the
real local OTP and refresh/retry journey in mobile and desktop projects.

## Final local verification

- `pnpm install --frozen-lockfile`, `pnpm format`, `pnpm lint`, and
  `pnpm typecheck` passed.
- `pnpm test` passed 92 tests: contracts 13, domain 14, data access 5, and web
  unit/component/accessibility 60.
- `pnpm db:reset:local` applied all eight ordered migrations plus the synthetic
  seed from empty state; `pnpm test:sql` passed 227/227 assertions and
  `pnpm types:check` found no generated-type drift.
- `pnpm build` completed the 19-route production build.
- `pnpm test:e2e` passed 46/46 Chromium mobile/desktop tests. The two Phase 3
  retry journeys each produced exactly one published report with two provider
  attempts after a first-attempt fake outage.
- `pnpm audit --prod` and `pnpm audit` reported no known vulnerabilities.
- Request-isolation probes found different nonces across responses, no
  production `unsafe-inline`/`unsafe-eval`, and `media-src 'none'`. Fresh public
  HTML/metadata and browser probes found no restricted address, reporter
  contact, raw media path, moderation signal, platform metadata, or internal
  note.
- DeepSeek V4 Flash returned **PASS with conditions** with no Critical or High
  finding. The full review and all dispositions are in
  `.hermes/reviews/phase-3-deepseek.md` and
  `.hermes/reviews/phase-3-disposition.md`.

## Privacy and truthfulness boundaries

The public query surface is limited to explicit safe views. Fresh public HTML
and browser probes contain no reporter contact, exact address/coordinates, raw
media path, moderation input/provider signal, platform metadata, or internal
note. Timeline entries are actor-qualified and do not turn submission or
publication evidence into a delivery or organization-acknowledgment claim.

## Remaining blockers

All external gates in `docs/operations/launch-gates.md` remain blocked. In
particular, there is no real jurisdiction authority, legal/privacy approval,
retention/takedown operation, approved geocoder or moderation vendor/DPA,
staffing or reviewer-safety program, real recipient/delivery adapter,
production email setup, production Supabase project, independent security or
accessibility acceptance, monitoring, backup/restore, incident response, or
launch sign-off. Before any real provider or pilot, semantic PII
classification/redaction and human escalation must be approved, calibrated
relationship anti-abuse controls must be added, and real moderation must move
behind the Phase 6 durable outbox. Phase 4 has not started and public media is
disabled.
