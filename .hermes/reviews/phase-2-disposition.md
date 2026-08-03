# Phase 2 DeepSeek finding disposition

- Review: `.hermes/reviews/phase-2-deepseek.md`
- Reviewer session/model: `ses_038a6b154ffePBnzAJYnvPa5gN` /
  `opencode-go/deepseek-v4-flash`

The initial verdict was **PASS with conditions**, with no Critical or High
finding. Every Medium and Low finding is classified below.

| Finding                                          | Disposition              | Reason and result                                                                                                                                                                                                                                                                                                           |
| ------------------------------------------------ | ------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| M1 — status event visibility/reporter read       | **Accepted**             | Added explicit `public`/`reporter`/`staff` visibility to the versioned report-status RPC fingerprint and event append. Added an owner-safe RLS policy limited to `public`/`reporter`, plus owner/non-owner and public-event pgTAP assertions.                                                                               |
| M2 — withheld draft coordinates mapped to `0,0`  | **Accepted**             | Extracted and tested the browser RPC mapper; withheld locations now remain SQL `null`. The focused test was RED (`toDraftRpcArgs` absent) before the mapper change and is GREEN.                                                                                                                                            |
| M3 — CSP permits framework inline scripts/styles | **Modified**             | Retained the current tested Phase 2 CSP because the reviewer explicitly judged it environment-appropriate for the no-UGC phase. Added a nonce-based strict-CSP gate before Phase 3 UGC or Phase 4 media. Production launch remains blocked.                                                                                 |
| M4 — Phase 2 axe coverage                        | **Accepted**             | Added `/sign-in`, `/access-denied`, account security/drafts, and organization-admin paths to both Playwright viewport scans. Added component axe checks for both OTP states and the enrolled TOTP form.                                                                                                                     |
| L1 — null transition request identifiers         | **Accepted**             | All three protected transition RPCs now reject a missing idempotency or correlation identifier with `request_identifiers_required`; three RED-first pgTAP cases were added.                                                                                                                                                 |
| L2 — stale launch-gate text                      | **Accepted**             | Updated the entry-gate section to record local Phase 2 completion without implying any external or launch approval.                                                                                                                                                                                                         |
| L3 — CLI install/build allowlist concern         | **Rejected as a defect** | No package build allowlist was removed by Phase 2. Both `pnpm install --frozen-lockfile` and the pinned project-local CLI/reset/test flow completed cleanly. No global install or allowlist widening was needed.                                                                                                            |
| L4 — MFA denial dead-end                         | **Accepted**             | MFA denial now preserves the sanitized requested path and renders a direct account-security enrollment link. The open-redirect allowlist remains applied at both redirects.                                                                                                                                                 |
| L5 — public event view row untested              | **Accepted**             | Added a seed pgTAP assertion for the exact synthetic public-safe timeline row.                                                                                                                                                                                                                                              |
| L6 — no durable authenticated staff browser test | **Modified**             | The required dedicated Agent Browser session exercised real OTP, operator/moderator cross-denial, AAL1 administrator denial, TOTP AAL2, redacted platform access, and organization-admin access. Durable staff-workspace Playwright journeys remain Phase 5 scope; SQL/RPC/domain tests remain the Phase 2 source of truth. |

## Post-fix evidence

- `pnpm db:reset:local` — seven ordered migrations and synthetic seed applied
  from empty local state.
- `pnpm test:sql` — 5 files, **162/162 passed**.
- Public-schema lint — no schema errors.
- `pnpm types:check` — generated types match the actual local schema.
- `pnpm lint`, `pnpm typecheck` — passed.
- `pnpm test` — contracts 6, domain 9, web 36; **51/51 passed**.
- `pnpm audit --prod`, `pnpm audit` — no known vulnerabilities.
- `pnpm build` — 17-route Next.js production build passed.
- `pnpm test:e2e` — **42/42 passed** across Chromium mobile and desktop,
  including real Mailpit OTP, draft claim, offline recovery, protected redirects,
  CSP headers, expanded axe routes, and Phase 1 regressions.

Public media remains disabled. No legal, privacy, staffing, vendor-DPA,
real-jurisdiction, staging/production, or launch gate is represented as complete.

The focused Flash confirmation is saved in
`.hermes/reviews/phase-2-deepseek-confirmation.md`. Final verdict: **APPROVED —
commit-ready**, with no remaining Critical, High, or Medium finding.
