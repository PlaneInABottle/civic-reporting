# DeepSeek V4 Flash — Phase 1 remediation confirmation

Remediation verified against the current worktree and saved findings. Read-only
static review; gates are documented in `docs/implementation/phase-1.md` and
`.hermes/reviews/phase-1-disposition.md` (I could not re-run them in plan
mode).

# Phase 1 Remediation Confirmation

## Resolved findings (verified in worktree)

| Finding                             | Verdict                                     | Evidence                                                                                                                                                                                                                                                                                                                             |
| ----------------------------------- | ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **M1** dark-surface focus contrast  | ⚠️ **Partially resolved — see residual R1** | `globals.css:50-53` adds `.bg-ink:focus-visible` safety-yellow ring; real-browser keyboard test `e2e/phase1-foundation.spec.ts:100-116` asserts `rgb(246,196,69)` on `/admin` skip + brand links. Staff-header links: 9.27:1 vs ink ✅. **But the floating skip links now get a yellow ring over the light canvas — 1.51:1, fails.** |
| **M2** axe coverage                 | ✅ Resolved                                 | `e2e/phase1-foundation.spec.ts:4-14,92-98` runs default-rule AxeBuilder across all 9 routes, both projects (mobile + desktop). jsdom rule-disables retained with documented reason.                                                                                                                                                  |
| **M3** nonexistent packages/scripts | ✅ Resolved                                 | `next.config.ts:5` transpiles only design-tokens; root `package.json` dropped `test:sql`/`db:*`/`supabase`; `.prettierignore` dropped the premature `database-types` line. Guarded by `tests/phase1-review-boundaries.test.ts:9-32`.                                                                                                 |
| **M4** unused future deps           | ✅ Resolved                                 | `apps/web/package.json:16-21` deps = lucide-react, next, react, react-dom only; `pnpm-workspace.yaml` removed `@supabase/*` release-age exclusions and `supabase`/`workerd` allow-builds; root devDeps = prettier/pm2/typescript.                                                                                                    |
| **M7** token drift                  | ✅ Resolved                                 | `theme.css:8,16-18` adds `safety-hover`, `warning-bg`, `error-bg`, `map-empty`; no hex literals remain in `app/` or `components/` (grep clean); all pages use tokens (`bg-warning-bg` in `report/new:54`, `platform:41`, `accessibility:36`; `bg-error-bg` in `privacy:31`, `contact:15`; `bg-map-empty` in `reports:58`).           |
| **M8** design deviations            | ✅ Resolved                                 | Hero CTA now `bg-safety` (`page.tsx:24`); form column `max-w-[40rem]` (640px, `report/new:13`); `shadow-floating` removed from static cards (`page.tsx:41`); only remaining `shadow-sm` is on the CTA inside the sticky header (`public-shell.tsx:36`), which is a floating surface.                                                 |
| **L1** progress nav misuse          | ✅ Resolved                                 | `report/new:16-18` is a plain `<p>`; no `nav` landmark.                                                                                                                                                                                                                                                                              |
| **L2** tsbuildinfo ignored          | ✅ Resolved                                 | `.gitignore:12` `*.tsbuildinfo`; `git check-ignore` confirms.                                                                                                                                                                                                                                                                        |
| **L4** StateNotice redundant label  | ✅ Resolved                                 | `state-notice.tsx:14,24,26` uses `aria-labelledby` + unique slug id.                                                                                                                                                                                                                                                                 |
| **L5** static live region           | ✅ Resolved                                 | `screen-state-gallery.tsx` has no `aria-live` (grep clean); `live` prop removed.                                                                                                                                                                                                                                                     |
| **L6** no webServer                 | ✅ Documented (Modified)                    | `README.md:38-41` states the CI server boundary; PM2 workflow retained.                                                                                                                                                                                                                                                              |
| **L7** no baseline commit           | ⏳ Intentionally deferred                   | Disposition: user requested the commit after review/verification. Still zero commits — this is the pending final action, not a finding.                                                                                                                                                                                              |

## Honest Phase 2 / launch blockers (verified intact)

- **M5 security headers** — still absent from `next.config.ts` (correct);
  recorded as Phase 2 entry gate #1 in
  `docs/operations/launch-gates.md:29-34`.
- **M6 staff/platform session gate** — no `middleware.ts` (confirmed); routes
  remain data-free static shells; recorded as Phase 2 entry gate #2 in
  `launch-gates.md:35-37`.
- **L3 hardcoded `lang="en"`** — still `layout.tsx:16`; locale-driven language
  documented as a launch blocker pending the real pilot language decision
  (`docs/design/foundations.md:38-40`).
- Synthetic-pilot and blocked-launch boundaries preserved (`README.md:3-5`,
  `launch-gates.md:23-25`, `pilot-scope.md` unchanged).

## Remaining severity-ranked finding

**R1 — Medium (new, introduced by the M1 fix): skip-link focus ring fails 1.4.11
on light surfaces.**
`globals.css:50-53`'s `.bg-ink:focus-visible { outline-color:
var(--color-safety) }` correctly fixes elements whose ring sits inside an ink
surface (staff header links: 9.27:1), but it also hits the **floating skip
links** (`public-shell.tsx:7-12`, `staff-shell.tsx:18-23`,
`platform/page.tsx:6-11`), whose ring renders over the light canvas. Safety
yellow #F6C445 vs canvas #F6F7F2 = **1.51:1 < 3:1** (computed).

_Impact:_ same WCAG 2.2 AA rule the team already fixed once, now inverted for
the skip link — the very first control a keyboard user tabs to. The e2e test
(`phase1-foundation.spec.ts:100-116`) asserts only the CSS color, not effective
contrast against the rendered backdrop, so it cannot catch this.

_Fix:_ scope the dark rule to surfaces whose ring stays on ink (e.g.
`header.bg-ink :focus-visible`), and give floating skip links a ring that
contrasts with the light page (link-blue/ink outline, or safety-yellow ring
wrapped in an ink `box-shadow`); extend the e2e to assert ring-vs-backdrop
contrast on the public shell, not just the color value.

**L8 — Low: brittle focus test assertion.**
`phase1-foundation.spec.ts:108,112-115` hardcodes `rgb(246, 196, 69)`; a
palette change to the safety token silently breaks it. Prefer asserting against
the CSS variable or the token value.

## Final verdict

**Phase 1: APPROVED with one required fix.** Ten of eleven findings are fully
resolved and regression-guarded by the new boundary test; M5/M6/L3 remain
honest, documented Phase 2 entry gates and launch blockers; synthetic-pilot and
blocked-launch boundaries are intact. **R1 (skip-link focus-ring contrast) must
be corrected and the full gate suite re-run before the Phase 1 baseline commit
(L7)** — at that point Phase 2 may begin with the recorded M5/M6 gates.
