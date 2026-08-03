# Phase 3 DeepSeek V4 Flash implementation review

- Session: `ses_038a6b154ffePBnzAJYnvPa5gN`
- Agent: `plan`
- Model: `opencode-go/deepseek-v4-flash`
- Mode: read-only

Reviewed the Phase 3 diff and task-owned files against the plan (read-only;
gates in `docs/implementation/phase-3.md` not re-run).

# Phase 3 Implementation Review — Civic Reporting

## Scope coverage vs plan §16 Phase 3 + the Phase 3/4 nonce-CSP gate

| Plan item                                                     | Status                                                                                                                               |
| ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| Address/geolocation discovery + complete non-map alternative  | ✅ synthetic fixture provider, local-only gated; `useCurrentLocation` + structured search                                            |
| Map/list browsing with list-first and clustering              | ✅ tile-free schematic map, list is source of truth, offline/stale/error/loading/empty states                                        |
| Duplicate candidates + support/follow                         | ✅ `find_duplicate_candidates` (PostGIS, public-point), private support with undo, explicit follow opt-in, default-off notifications |
| Resilient local drafts + email verification + atomic transfer | ✅ expiring IndexedDB drafts, real Mailpit OTP, intent-aware claim (new-report vs support), refresh/lost-key idempotency             |
| Atomic submission                                             | ✅ `submit_verified_report` + same-transaction report/identity/location/moderation-case/audit/idempotency                            |
| Semantic text-publication gate                                | ✅ Edge Function + fail-closed local-only fake adapter; service-role-only finalize                                                   |
| Public report detail + timeline                               | ✅ actor-qualified statuses and events; no delivery claim                                                                            |
| Nonce-based strict CSP before UGC                             | ✅ request-scoped nonce, `strict-dynamic`, no `unsafe-inline`/`unsafe-eval` in production; `verify_jwt` on the function              |

**Verdict: PASS with conditions.** No Critical or High findings; 3 Medium
(one privacy gap, one anti-abuse gap, one architecture note). The submission
boundary and truthfulness discipline are the strongest part of the phase;
launch stays correctly BLOCKED and public media remains disabled.

---

## Severity-ranked findings

### Critical — none

### High — none

### Medium

**M1 — Approved text is published verbatim with no redaction and only a generic
privacy-recall link.** `20260803160700_public_reporting_slice.sql:457-460` sets
`public_description = target.description` (the full user text) on approval; the
(fake) semantic gate classifies but never scrubs. A description containing a
phone number, plate, or personal detail becomes public as-is. The only recourse
is the generic `/contact` link
(`apps/web/components/reports/public-report-detail.tsx:194`); there is no
structured "report exposed personal information" flow and the plan's
`privacy_redactions` surface (§13, §8.6) is not started. _Fix:_ before any real
provider is wired, add a PII-scan/redaction hook in the worker (or hold
publication when redaction is pending) and add a minimal structured
privacy-concern submission; record as a tracked Phase 4 obligation.

**M2 — `set_report_relationship` has no anti-abuse controls while
`support_count` is publicly observable.**
`20260803160700_public_reporting_slice.sql:503-618` is callable by any verified
user with no rate limit, burst detection, or per-account cap (plan §8.7), and
`public_reports` exposes `support_count` (`:676-681`). Scripted accounts can
inflate support aggregates or poll for timing side-channels. Pilot-scale risk
is low; the plan's anti-abuse hardening is later-phase. _Fix:_ record as a
tracked Phase 7 anti-abuse obligation; at minimum cap relationship RPC calls per
account/period.

**M3 — The moderation worker runs synchronously inside the submit request.**
`supabase/functions/submit-report/index.ts` performs attempt-record + provider
call + finalize inline in the HTTP request (`[edge_runtime] policy = "oneshot"`).
Nil latency with the fake adapter; a real provider would block the submit
response, and the plan's durable outbox/worker (§12.5, Phase 6) is the intended
home. _Fix:_ acceptable for text-only Phase 3; record that a real provider must
move behind the Phase 6 outbox/worker while preserving the retry contract.

### Low

- **L1 — Edge Function echoes DB error messages to the browser.**
  `submit-report/index.ts:105` returns `submissionError.message` (e.g.
  `stale_state`) in the 409 body. Informative, not sensitive today; return a
  stable `code` map and keep raw messages server-side.
- **L2 — Reporter private timeline is stored but never surfaced.**
  `submit_verified_report` writes a `reporter`-visibility event and the Phase 2
  owner-safe RLS policy permits reads, but `/account/reports` renders only
  `reports` rows, not the event timeline. The citizen cannot see "safety checks
  in progress" or moderation-outcome events as a timeline (plan §6.2/§9.1).
  Data is ready; the UI is missing. _Fix:_ render the owner-scoped timeline on
  `/account/reports`, or defer explicitly.
- **L3 — Public error/loading boundaries are sound** (`reports/loading.tsx`,
  `reports/error.tsx` — no private fallback). Verified, no finding.
- **L4 — Middleware now hard-requires Supabase env for all routes.**
  `proxy.ts:8-10` builds the CSP via `getPublicSupabaseConfig()` on every
  request, including public pages; a missing env throws uncaught → site-wide 500. Local-only requirement (`.env.local` present), but a new public-surface
  dependency. _Fix:_ fall back or return a clear failure when env is absent.
- **L5 — Real-browser axe does not cover the dynamic
  `/reports/[publicId]` route** (component axe covers `PublicReportDetail`).
  Minor; acceptable.

## Security / RLS / privacy / accessibility / test gaps

- **Security:** Submission boundary is the strongest part — verified-user-only
  `submit_verified_report`, service-role-only attempt/finalize
  (`function_privs_are` asserted), idempotent replay plus lost-key refresh,
  pending-before-public fail-closed, anon/forged/platform-bypass denial tested,
  deterministic public title derived from category + safe label, exact address
  excluded from public text. CSP is now request-scoped nonce + `strict-dynamic`
  with no `unsafe-inline`/`unsafe-eval` in production and `verify_jwt = true` on
  the function. Residuals: M1, M2, L1.
- **RLS:** No new permissive write policies; new RPCs narrow and well-granted;
  views `security_barrier` with whitelisted columns; `support_count` is
  aggregate-only (supporter identity never exposed — tested); events expose
  `actor_type`/`source` only. `find_duplicate_candidates` (anon, security
  definer) returns only public columns and excludes resolved/closed/withheld —
  by design.
- **Privacy:** Exact coordinates/address/email never reach public HTML (e2e
  asserts); duplicates computed on the public point; support/follow private
  with defaults-off; drafts stay in IndexedDB until verification;
  `supabase/functions/.env` and `apps/web/.env.local` are gitignored and contain
  only local values (verified) — no service-role key in web or committed env.
- **Accessibility:** Complete non-map path, labels/roles, error focus
  restoration, `role="alert"`, 44px targets; component axe (color/region
  disabled in jsdom) plus expanded real-browser matrix; the dynamic detail
  route is component-covered only.
- **Tests:** 14 contract + 51 behavior SQL assertions;
  domain/contracts/data-access unit; component tests (reporting flow, draft
  recovery, moderation adapter, strict CSP); real-browser e2e covering OTP →
  provider outage → retry → published → public-leak probe + offline list +
  per-request CSP nonce inequality.

## Phase 3 verdict

**PASS with conditions — commit-suitable.** No Critical or High. The three
Mediums are either small fixes (M1 privacy-recall path + redaction hook before
any real provider; M2 relationship rate-cap) or honest tracked obligations (M3
outbox migration, Phase 6). The Phase 3/4 nonce-CSP gate from Phase 2 is
genuinely closed. Public media is disabled, synthetic-pilot and blocked-launch
boundaries are preserved, and no Phase 4 scope is implemented or reviewed.
