# Phase 2 DeepSeek V4 Flash fix confirmation

- Session: `ses_038a6b154ffePBnzAJYnvPa5gN`
- Agent: `plan`
- Model: `opencode-go/deepseek-v4-flash`
- Mode: read-only

Verified all fixes in the current diff against the saved Phase 2 findings
(read-only; gates documented in `.hermes/reviews/phase-2-disposition.md` and
`docs/implementation/phase-2.md`, not re-run).

## M1–M4 and L1–L6 disposition verification

| Finding                                        | Disposition            | Verified in worktree                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| ---------------------------------------------- | ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **M1** status-event visibility / reporter read | Accepted               | `transition_report_status` now takes a validated `requested_visibility public.event_visibility` (`atomic_rpc.sql:270,295-297`), folds it into the idempotency fingerprint (`:301`), and writes it to the event (`:349`); no `visibility = 'staff'` hardcode remains. Owner-safe RLS policy `report_status_events_owner_safe_read` scoped to `visibility IN ('public','reporter') AND is_report_owner` (`rls_and_public_views.sql:241-246`); grants updated to the new signature (`:573,579`). Tests: operator creates a `public` event (`20_atomic_rpc.test.sql:128`), citizen sees own public event (`10_rls_matrix.test.sql:21`), non-owner sees 0 (`:38`). |
| **M2** withheld draft coords                   | Accepted               | `toDraftRpcArgs` now maps `publicLocation?.latitude ?? null` (`browser-adapters.ts:22-23`); RED-first test asserts null for withheld precision (`phase2-draft-adapter.test.ts:5-21`). Consistent with the RPC's withheld branch.                                                                                                                                                                                                                                                                                                                                                                                                                              |
| **M3** CSP inline scripts                      | Modified (documented)  | CSP retained as judged environment-appropriate for the no-UGC phase; `docs/operations/launch-gates.md` now records a **Phase 3/4 nonce-based strict-CSP launch blocker**. Honest, tracked obligation — no longer an open item.                                                                                                                                                                                                                                                                                                                                                                                                                                |
| **M4** axe coverage                            | Accepted               | Real-browser full-rule matrix expanded to 14 routes including `/sign-in`, `/access-denied`, `/account/drafts`, `/account/security`, `/admin/organization` (`phase1-foundation.spec.ts:4-19`); component-level axe for both OTP states and TOTP enrollment (`phase2-auth-accessibility.test.tsx`).                                                                                                                                                                                                                                                                                                                                                             |
| **L1** null transition identifiers             | Accepted               | All three transition RPCs reject null idempotency/correlation keys with `request_identifiers_required` (`atomic_rpc.sql:292-294,399-401,500-502`); three RED-first pgTAP cases (`20_atomic_rpc.test.sql:112-116,156-160,215-221`).                                                                                                                                                                                                                                                                                                                                                                                                                            |
| **L2** stale launch-gate text                  | Accepted               | `launch-gates.md` re-pointed: "Phase 2 technical gates … implemented and tested locally" + new "Phase 3/4 security gate" section.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| **L3** allowBuilds concern                     | Rejected as non-defect | `allowBuilds` intact (`pnpm-workspace.yaml:9-13`); frozen install + CLI/reset/test flow recorded as clean. Reasonable disposition of a verification request, not a defect.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| **L4** MFA denial dead-end                     | Accepted               | `require-route.ts:22-26` preserves the sanitized `next`; `access-denied/page.tsx:29-36` renders a `safeNextPath`-guarded enrollment link to `/account/security` (sanitized again at the boundary). No open redirect.                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| **L5** public event view untested              | Accepted               | Seed pgTAP now asserts the exact public-safe timeline row (`01_synthetic_seed.test.sql:51-53`).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| **L6** no durable staff browser test           | Modified               | Dedicated Agent Browser session exercised real OTP/draft claim, operator↔moderator denial, AAL1 denial, TOTP AAL2, redacted platform access; durable staff-workspace Playwright journeys explicitly deferred to Phase 5 (`phase-2.md:105-110`). Honest and acceptable; SQL/RPC/domain remain the Phase 2 source of truth.                                                                                                                                                                                                                                                                                                                                     |

Web code references only `create_verified_draft`
(`browser-adapters.ts:13,70`) — no orphaned callers of the changed transition
RPC signatures.

## Remaining findings

**None at Critical, High, or Medium.** Two informational notes, neither a
blocker:

- The expanded browser axe matrix runs against anonymous visitors on the
  protected routes, so those routes effectively scan `/sign-in`/`/access-denied`
  after redirect; the interactive forms carry component-level axe, and the
  authenticated pages are trivial static content. Acceptable Phase 2 coverage.
- M3 remains a **tracked Phase 3/4 launch blocker** by disposition (nonce-based
  strict CSP before any UGC/media renders) — intentional, not a residual defect.

Post-fix evidence recorded in the disposition (162/162 SQL, 51/51 Vitest, 42/42
e2e across both viewports, 17-route build, clean audit) is internally consistent
with the verified diff.

## Final Phase 2 verdict

**APPROVED — commit-ready.** Every Medium (M1–M4) and Low (L1–L6) finding is
resolved or honestly dispositioned, with test coverage for each code change; no
remaining Critical/High/Medium implementation finding. M5/M6 entry gates remain
closed, synthetic-pilot and blocked-launch boundaries are intact, and launch
stays correctly BLOCKED with the Phase 3/4 nonce-CSP gate recorded. Phase 3 is
out of scope.
