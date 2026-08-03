# DeepSeek V4 Flash — Phase 1 review

Review complete. Static read-only review of the worktree against plan `16 Phase 1
(docs/implementation/phase-1.md documents the gates; I verified artifacts and
computed contrast rather than re-running mutations, per plan mode). All findings
reference current file:line.

---

# Phase 1 Implementation Review — Civic Reporting

## Phase 1 scope verification (vs plan `16 Phase 1)

| Plan deliverable                                                                               | Status                                                        |
| ---------------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| pnpm workspace + `apps/web` only                                                               | ✅ present; no `apps/mobile` (ADR 0001 honored)               |
| `packages/design-tokens`                                                                       | ✅ theme.css with full palette + spacing/radius/shadow tokens |
| ADR `0001-web-mobile-separation`                                                               | ✅                                                            |
| `docs/design/foundations.md`, `docs/product/content-policy.md`                                 | ✅ (plus pilot-scope, phase-1, launch-gates)                  |
| Public/staff/platform shells + accessible primitives                                           | ✅ 9 routes, skip links, landmarks, 44px targets              |
| lint / typecheck / unit / component / Playwright / a11y configured                             | ✅ scripts + configs present; gates documented as passing     |
| Exit condition: static screens render mobile/desktop + initial keyboard/axe review, no backend | ✅ met as documented; build artifacts present (10 routes)     |

## Verdict

**Phase 1: PASS with conditions — faithful to plan, launch-safe, not launchable
(correctly).** No Critical or High findings. The foundation is honest:
synthetic-pilot and blocked-launch boundaries are preserved rigorously, no
Supabase/database/provider surface was created, and the truthfulness principles
are carried into copy. Conditional approval is blocked on the Medium items below
(M1 focus contrast is a real WCAG 2.2 AA failure in shipped UI; M2 axe coverage;
M3/M4 foundation forwards-claims) before Phase 1 is finalized and Phase 2
begins. I did not re-run lint/typecheck/build/tests (plan-mode read-only);
evidence is the documented RED/GREEN record plus present `.next`,
`test-results`, and `tsconfig.tsbuildinfo` artifacts. Note: the repo has
**zero commits** — everything is untracked, so there is no diff baseline.

---

## Severity-ranked findings

### High — none

### Medium

**M1 — Focus-indicator contrast fails WCAG 2.2 AA (1.4.11 Non-text Contrast) on
dark surfaces.**
`apps/web/app/globals.css:45-48` sets one global `:focus-visible` outline of
`--color-link` (`#0B5CAD`). On `bg-ink` surfaces this ring is **2.26:1**
against the adjacent ink (`#102A2D`) — below the required 3:1. Affected
focusables: skip links (`components/public-shell.tsx:7-12`,
`components/staff-shell.tsx:18-23`) and all staff-header nav links
(`components/staff-shell.tsx:24-50`). The platform page header is
`bg-surface`, so it passes (~6.2:1).

_Impact:_ a real AA failure in the exact surfaces (staff shell) the plan treats
as launch-critical; axe does not flag focus-indicator contrast, so all gates
passed it.

_Fix:_ surface-scoped focus colors — e.g. `outline-color: #fff` (or safety
yellow) for elements on `bg-ink`, keep link-blue on light surfaces; add a
keyboard-tab Playwright assertion that the focused ring has ≥3:1 on dark shells.

**M2 — Automated axe coverage is narrower than the exit condition implies.**
Unit axe disables `color-contrast` and `region`
(`tests/phase1-accessibility.test.tsx:12-16`), and the real-browser AxeBuilder
runs full rules only on `/` and `/platform`
(`e2e/phase1-foundation.spec.ts:33,76`). `/report/new`, `/reports`,
`/admin`, `/admin/moderation`, `/accessibility`, `/privacy`, `/contact`
never receive a full-rule real-browser scan (region/contrast gaps are exactly
what the phase-1.md RED records show were once caught by browser axe).

_Impact:_ the "pass initial axe review" claim is only proven for 2 of 9 routes.

_Fix:_ run AxeBuilder with default rules across all 9 routes × both projects;
keep the jsdom rule-disables but document why.

**M3 — Foundation forwards-claims packages and directories that do not exist.**
`apps/web/next.config.ts:5-10` lists
`@civic-reporting/contracts|domain|data-access|database-types` in
`transpilePackages`; root `package.json:20,24` expose `test:sql`/`db:types`
targeting a missing `supabase/` and `packages/database-types/`. Build tolerates
it today, but any of these scripts invoked pre-Phase 2 fails, and
`.prettierignore:6` already references the not-yet-existing generated types
file.

_Impact:_ implies Phase 2 scope; invites premature Supabase init; no functional
harm now.

_Fix:_ trim `transpilePackages` to the one real package, move db scripts to
Phase 2, and re-add the ignore line when the package lands.

**M4 — Future-phase dependencies installed now, unused and with pinned
release-age exclusions.**
`apps/web/package.json:17-28` ships `@supabase/ssr`,
`@supabase/supabase-js`, `maplibre-gl`, `react-hook-form`,
`@hookform/resolvers`, `zod`, `idb-keyval`,
`@radix-ui/react-dialog` — none imported anywhere in Phase 1 (only
`lucide-react` + React are used). `pnpm-workspace.yaml:13-19` then exempts the
whole `@supabase/*@2.112.0` family from the release-age check.

_Impact:_ bloated lockfile, stale pin risks drifting from the Phase 2 plan, and
an implicit promise these are the chosen versions.

_Fix:_ keep only what Phase 1 imports; add providers in their phase; drop the
release-age exclusions if the deps are removed.

**M5 — No security headers (CSP, nosniff, referrer-policy) are configured.**
`next.config.ts` sets only `poweredByHeader:false`. Plan `14 lists CSP as
baseline. No user content or auth exists yet, so this is not a Phase 1 blocker —
but it must be an explicit Phase 2 _entry_ gate, before any user-generated
content or auth cookies exist.

_Impact:_ deferred, not harmful today.

_Fix:_ add `headers()` (strict CSP, `X-Content-Type-Options`,
`Referrer-Policy`, HSTS for prod) as the first Phase 2 item, with a test
asserting them on public routes.

**M6 — Staff/platform routes are fully public with no server-side session gate.**
`app/admin/*`, `app/platform/*` render for anonymous visitors (no
`middleware.ts`, no layout check). Benign because there is zero data and routes
are `noindex`, but this is the highest-priority surface to secure first in Phase
2 (plan `14 "admin routes require server-side session validation").

_Fix:_ Phase 2 must add session validation + RLS-scoped queries before any row is
ever returned on these routes.

**M7 — Design-token drift: hardcoded hexes bypass the token system.**
`#f0b92d` (`public-shell.tsx:36`), `#fff8e8`/`#fff6f6` (repeated in
`state-notice.tsx:16-17`, `accessibility/page.tsx:36`,
`privacy/page.tsx:31`, `contact/page.tsx:15`, `report/new/page.tsx:56`,
`platform/page.tsx:41`), `#e8eee9` (`reports/page.tsx:58`). The plan (`10,
foundations.md) centralizes tokens in `theme.css`.

_Impact:_ theme/contrast changes won't propagate; duplicates contrast decisions.

_Fix:_ add `--color-warning-bg`, `--color-error-bg`,
`--color-safety-hover`, `--color-map-empty` tokens and reference them.

**M8 — Small but real design deviations from plan `10.**
(a) Hero `Report an issue` CTA is civic teal while the persistent header CTA is
safety yellow (`app/page.tsx:23-28`vs`public-shell.tsx:36-40`) — two
same-action CTAs in different colors on one viewport dilute the reserved-safety-yellow
rule (`10.1). (b) Report flow column is `max-w-3xl` (768px), exceeding the
plan's 560–640px form column (`report/new/page.tsx:13`). (c) Shadows on
non-floating cards (`page.tsx:41` aside, `report/new/page.tsx:30`) contradict
`10.3` "normal cards use borders/background contrast."

_Fix:_ keep the yellow CTA as the sole report CTA color (hero can stay teal if
it's labeled differently); set form column to ~640px; drop shadows from static
cards.

### Low

**L1 — ARIA misuse:** `<nav aria-label="Report progress">` contains only a
paragraph. `app/report/new/page.tsx:16-19` — a nav landmark with no navigation.
Use `role="status"`/plain `<p>` (or an `<ol>` of real steps when wiring
begins).

**L2 — `apps/web/tsconfig.tsbuildinfo` is not gitignored**
(`.gitignore` lacks `*.tsbuildinfo`); a 225KB build artifact would be
committed. `git check-ignore` confirms it's not ignored.

**L3 — `lang="en"` hardcoded** (`app/layout.tsx:16`) while the pilot targets a
Turkish-context jurisdiction (plan `19(11)); must become locale-driven in Phase
2 — note in foundations.

**L4 — `StateNotice` redundant labeling:** `<section aria-label={title}>`
containing an `<h2>` with identical text
(`components/state-notice.tsx:20-25`). Use `aria-labelledby` or drop the
label.

**L5 — `aria-live="polite"` on a statically rendered card
(`screen-state-gallery.tsx:27-31`) — a live region that never updates; harmless
now, scope it to real updates in Phase 3.

**L6 — No Playwright `webServer` config** (`playwright.config.ts`) — e2e
depends on manual `build` + `qa:start` (documented in README); fine for pm2
workflow, but add a CI note.

**L7 — No baseline commit** — everything untracked; consider committing Phase 1
as the foundation snapshot after approval so Phase 2 has a diff baseline.

---

## Security / RLS / privacy / accessibility / test gaps

**Security & RLS:** No database layer exists (correct — no `supabase/` dir, no
migrations/seeds, no Supabase init per phase-1.md boundaries). No keys, no
service role, no client bundles. The only carry-forward obligations are M5
(CSP/headers) and M6 (auth-gate admin/platform routes) — both must be Phase 2
entry items. There is no `.env.example` yet; add it when Phase 2 introduces
secrets (gitignore already anticipates it).

**Privacy:** Strong. No PII anywhere; `pilot-support@example.invalid` (RFC 2606
reserved); synthetic banner on every public shell; privacy copy explicitly
disclaims legal approval; exact/public location language matches plan `8.6
without overclaiming. No upload path exists, consistent with "public media
disabled."

**Accessibility:** Met the exit condition's mechanical bar (44px targets, skip
link first in tab order, landmark structure, reduced-motion, 320px reflow
verified) — but M1 (focus contrast) is a genuine AA failure, and M2 means
full-rule coverage is unproven on 7 of 9 routes. Manual
NVDA/VoiceOver/200%/forced-colors acceptance is correctly documented as a launch
blocker in `accessibility/page.tsx:36-42`.

**Tests:** Well-designed for the surface (geolocation-must-not-fire stub in
`e2e/phase1-foundation.spec.ts:7-16` is a nice defensive check;
duplicate/persistence/state coverage matches Phase 1 scope). Gaps: M2 axe
coverage, L6 no webServer, and no contrast test that would have caught M1.

---

## Boundary compliance

Both requested boundaries are preserved:

- **Synthetic pilot:** fictional Harborfield identity in README, banner, footer,
  docs; no invented emergency number ("use the verified emergency channel for
  the real place you are in" — `contact/page.tsx:18-20`); all content explicitly
  non-government.
- **Blocked launch:** `docs/operations/launch-gates.md` maintains BLOCKED
  status; `platform/page.tsx` surfaces blockers honestly; no
  provider/vendor/staffing/legal approval is claimed anywhere; phase-1.md
  "Boundaries" section is accurate and matches the worktree.

---

## Required fixes before Phase 1 final / Phase 2 start

1. **M1** — surface-scoped focus-indicator contrast on ink backgrounds + a test.
2. **M2** — full-rule real-browser axe across all 9 routes × both viewports.
3. **M3/M4** — trim nonexistent package references and unused deps (or move them
   to their phases).
4. **M7/M8/L2** — tokenize hardcoded hexes, resolve CTA color duplication,
   gitignore `*.tsbuildinfo`.

Then Phase 2 must begin with **M5 (security headers)** and **M6 (server-side auth

- RLS on admin/platform)** before any data boundary exists.
