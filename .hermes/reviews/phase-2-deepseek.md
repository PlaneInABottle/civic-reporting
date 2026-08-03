# Phase 2 DeepSeek V4 Flash implementation review

- Session: `ses_038a6b154ffePBnzAJYnvPa5gN`
- Agent: `plan`
- Model: `opencode-go/deepseek-v4-flash`
- Mode: read-only

Reviewed the full Phase 2 diff and task-owned files (read-only; gates documented
in `docs/implementation/phase-2.md` not re-run).

## Scope coverage vs plan §16 Phase 2 + entry gates (M5/M6)

| Deliverable                                                                                                                                                 | Status                    |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------- |
| `supabase/config.toml` (isolated local project, PostGIS, Auth OTP, Mailpit, Storage/Realtime off)                                                           | ✅                        |
| 7 ordered migrations: types/extensions → identity/pilot → reporting → operations/audit → RLS+views → atomic RPC → actor context                             | ✅                        |
| pgTAP suites (schema 36, seed 9, RLS 60, atomic 38, actor 12) + role fixtures                                                                               | ✅                        |
| `packages/contracts`, `packages/domain`, `packages/database-types` (+ scripts + type-drift check)                                                           | ✅                        |
| Web: `@supabase/ssr`, server/browser clients, `proxy.ts`, server route guards, OTP sign-in, MFA enrollment, account/admin/platform surfaces, `.env.example` | ✅                        |
| **M5 security headers** (CSP/nosniff/Referrer-Policy/Permissions-Policy) + **M6 server-side session enforcement on every staff/platform/account route**     | ✅ implemented and tested |
| Exit condition: role + org isolation proven by DB tests before public forms can write                                                                       | ✅ proven                 |

The implementation is faithful, deny-by-default, and unusually well-tested for
this phase. No Critical or High findings. **Verdict: PASS with conditions** — 4
Medium, 6 Low below.

---

## Severity-ranked findings

### Medium

**M1 — Operator status transitions can never reach the public timeline;
reporters cannot read their own status events.**
`supabase/migrations/20260803160500_atomic_rpc.sql:342` hardcodes `visibility =
'staff'` for every `transition_report_status` event; the RPC has no visibility
parameter. The public view filters `visibility = 'public'`
(`20260803160400_rls_and_public_views.sql:358`), and the only RLS policy on
`report_status_events` is operator-only (`:237-239`) — there is **no owner-read
policy** for reporters despite the `event_visibility` `'reporter'`/`'public'`
enum values.

_Impact:_ when Phase 3 builds the plan-mandated public/reporter timeline (§9.1,
§6.2), every institutional status change produced by this RPC is invisible to
citizens, and the reporter cannot read even their own events at the data layer.
Forward-compatibility defect in the phase's central transition boundary.

_Fix:_ add a `visibility` parameter to `transition_report_status` (default
`'public'` for institutional moves, `'staff'` for internal-only), and add an
owner-read RLS policy on `report_status_events` scoped to `visibility IN
('public','reporter')` with a pgTAP case (owner sees own events, non-owner
denied).

**M2 — Browser draft-claim breaks the `withheld` precision path.**
`apps/web/lib/auth/browser-adapters.ts:49-50` coerces
`publicLocation?.latitude ?? 0` / `?? 0`. For a `withheld`-precision draft the
contract requires `publicLocation: null` (`packages/contracts/src/index.ts:63-74`),
so the adapter sends `0,0` and the RPC rejects with
`public_location_must_be_withheld` (`20260803160500_atomic_rpc.sql:60-63`).

_Impact:_ a withheld-location draft (explicitly supported by contract and RPC,
and required for sensitive categories per plan §8.6) can never be claimed from
the browser. Latent because the seeded pilot categories are
`neighborhood`/`block` only.

_Fix:_ pass `null` (not `0`) when precision is `withheld`, and add a
contract+adapter test for the withheld round-trip.

**M3 — CSP ships `script-src 'self' 'unsafe-inline'` (and `style-src
'unsafe-inline'`).** `apps/web/next.config.ts:22-23`. The other directives are
strict (`default-src 'self'`, `object-src 'none'`, `frame-ancestors 'none'`,
`media-src 'none'`, `base-uri`/`form-action 'self'`, per-origin `connect-src`),
and this is a documented Next.js inline-script tradeoff, so it satisfies the M5
"environment-appropriate" gate for a no-UGC phase. But inline scripts defeat the
strongest XSS mitigation.

_Impact:_ the plan treats CSP as a launch requirement (§14); this must move to a
nonce-based strict CSP **before any user-generated content or untrusted data
renders** (Phase 3/4), and that obligation should be recorded, not assumed.

_Fix:_ record as a tracked Phase 3/4 hardening gate (nonce-based `script-src`),
and keep the current CSP + tests meanwhile.

**M4 — Automated axe coverage was not extended to the new Phase 2 surfaces.**
The 9-route full-rule axe matrix
(`apps/web/e2e/phase1-foundation.spec.ts:4-14,162-168`) predates Phase 2;
`/sign-in`, `/access-denied`, `/account/*`, `/admin/organization` are not
axe-scanned, and the new OTP/MFA forms are interactive surfaces (Phase 2 e2e
covers behavior, not axe).

_Impact:_ accessibility is a stated launch requirement; new interactive routes
ship outside the automated a11y gate.

_Fix:_ add the Phase 2 routes to the axe matrix (or a Phase 2 matrix) with the
two-color focus ring + contrast checks reused.

### Low

**L1 — Transition RPCs don't validate non-null idempotency/correlation keys.**
`create_verified_draft` rejects null keys (`atomic_rpc.sql:48-50`), but
`transition_report_status`/`transition_moderation_case`/`transition_delivery`
don't; a null-key call makes a second identical call hit the `unique nulls not
distinct` constraint and return `idempotency_conflict` instead of the original
result. Not a security hole; a robustness/contract gap. _Fix:_ mirror the
`create_verified_draft` null-key check.

**L2 — `docs/operations/launch-gates.md:30-42` "Phase 2 entry gates" is
stale.** Both gates (CSP + server session enforcement) were implemented in Phase
2, but the section still reads "recorded obligations only… not implemented in
Phase 1." Update to record that M5/M6 were satisfied in Phase 2 and re-point
remaining gates.

**L3 — `pnpm-workspace.yaml` allowBuilds dropped `supabase`/`workerd` while the
Supabase CLI became a root devDependency.** Verify `pnpm install
--frozen-lockfile` completes cleanly at commit (phase-2.md claims it does); the
local stack needs the CLI resolvable.

**L4 — MFA-required redirect UX dead-ends.** An aal1 org-admin hitting
`/admin/organization` lands on `/access-denied?reason=mfa_required`
(`lib/auth/require-route.ts:16-23`) with no link to `/account/security`
enrollment. Functional for the pilot; add the enrollment link.

**L5 — `public_report_events` row content is untested.**
`01_synthetic_seed.test.sql` checks the view's column absence and
`public_reports` count, but never asserts a public event row. _Fix:_ one pgTAP
assertion on the seeded public event.

**L6 — No authenticated-staff e2e journey.** Roles are proven at the SQL and
domain layers (RLS matrix 60/60, atomic 38/38, actor 12/12, `authorizeRoute` unit
tests) but no browser-level operator/moderator/admin sign-in exists. Acceptable
and documented for Phase 2 (the DB is the source of truth), but note it as the
intended Phase 5 e2e addition.

---

## Security / RLS / privacy / accessibility / test gaps

- **Security/RLS:** Strong. RLS on all 27 tables; zero permissive write policies
  (all writes via security-definer RPCs with empty search path, caller/preset
  checks, version checks, idempotency fingerprints, same-transaction audit);
  append-only triggers on events/actions/audit enforced even for direct
  maintenance; service-role usage bounded to `transition_delivery`;
  `legal_access_grants` unreadable by clients; no service key in web source
  (grep-tested); open-redirect guard on the `next` param (e2e-tested); per-org
  isolation tested with a transaction-only fixture org. Residuals: M1 (event
  visibility/reporter access) and M3 (CSP inline scripts).
- **Privacy:** Intact. Synthetic fixtures only;
  `*.invalid`/`@synthetic.invalid`/`example.test`; exact location separated from
  public location (tested non-equal); `.env.local` holds only the publishable
  key; drafts stay in IndexedDB until verification; MFA secret shown but
  documented as pilot-only with recovery explicitly not claimed.
- **Accessibility:** OTP/MFA forms are properly labeled, use `role="alert"` with
  error focus, `inputMode="numeric"`, `autocomplete="one-time-code"`, 44px
  targets; focus-ring contrast regression retained. Gap: M4 (axe matrix not
  extended to new routes).
- **Tests:** Exceptionally thorough for the layer — 60/60 RLS, 38/38 atomic
  (allowed transitions, wrong-role, stale-version, idempotent replay,
  changed-payload conflict, separate coordinates, single append per change),
  12/12 actor, 9/9 seed, 36/36 schema, real Mailpit OTP in e2e, open-redirect
  test. Residuals: L5/L6 and the M1 test gap.

## Phase 2 verdict

**PASS with conditions — commit-suitable once the four Mediums are either fixed
or explicitly recorded as tracked gaps.** The local Auth/RLS foundation is real,
deny-by-default, and proven by database tests; M5 and M6 entry gates are
genuinely closed; synthetic-pilot and blocked-launch boundaries are preserved
(launch remains BLOCKED per `launch-gates.md`, with only the stale section at L2
needing a refresh). Recommend fixing M1 (one RPC param + one RLS policy + pgTAP),
M2 (adapter null pass-through), adding M3 and M4 to the tracked obligations, then
committing Phase 2. Phase 3 is out of scope for this review.
