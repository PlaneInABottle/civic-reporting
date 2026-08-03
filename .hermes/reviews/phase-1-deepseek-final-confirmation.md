# DeepSeek V4 Flash — Phase 1 final confirmation

Verified against current worktree (read-only).

# Phase 1 Final Confirmation

## L8 — RESOLVED

The focus test is now token-driven, not hex-hardcoded.
`e2e/phase1-foundation.spec.ts:16-40` adds a real relative-luminance
`contrastRatio()` function; `:126-176` samples `var(--color-link)`,
`var(--color-canvas)`, `var(--color-safety)`, `var(--color-ink)` via a
runtime probe and asserts ring color _equals_ the token value and
ring-vs-backdrop contrast ≥ 3:1. No `rgb(246,196,69)` remains. Token values
resolve at runtime because Tailwind v4 emits all `@theme` variables to `:root`.

## R1 — PARTIALLY RESOLVED (residual on staff pages)

**What the CSS fix achieved** (`globals.css:50-52` — removed the self-matching
`.bg-ink:focus-visible`):

- Skip links (`public-shell.tsx:7-12`, `platform/page.tsx:6-11`) now use the
  default link-blue ring over the **light** canvas/sticky header → **6.67:1** ✓
- Staff header brand/nav links (descendants of `header.bg-ink`,
  `staff-shell.tsx:24`) keep the safety-yellow ring on ink → **9.27:1** ✓

**What still fails:** the **staff-page skip link**. On `/admin` and
`/admin/moderation` the skip link is `position: fixed; top-4`
(`staff-shell.tsx:18-23`), so it renders _over the opaque ink staff header_ —
its backdrop is **ink, not canvas**. The link-blue ring against that ink
backdrop is **2.26:1 < 3:1** (computed), i.e. the same 1.4.11 failure class as
the original M1/R1, now confined to the staff skip link.

**The new test has a backdrop-sampling flaw that masks this:**
`phase1-foundation.spec.ts:134-152` asserts the skip ring against
`tokenColor('--color-canvas')`, but on `/admin` the real backdrop behind the
fixed skip link is the ink header. The assertion passes (6.67:1 vs canvas)
while the rendered contrast fails (2.26:1 vs ink) — a false GREEN. The test
also hardcodes the backdrop choice instead of sampling the actual pixels behind
the focused element.

## Remaining Phase 1 findings

- **R1-residual — Medium:** Staff-shell skip-link focus ring fails WCAG 1.4.11
  (2.26:1) because its fixed-position ring sits over the ink header. _Fix:_
  give the floating skip links a ring that contrasts against both backdrops
  (e.g., safety-yellow ring with an ink `box-shadow` band so the yellow is
  always adjacent to dark, or a surface-aware color) — public/platform skip
  links are already correct on light.
- **R1-test — Low:** The skip-link assertion samples the wrong backdrop on staff
  routes. _Fix:_ sample the computed color under the outline (or the element's
  actual offsetParent backdrop) rather than assuming `--color-canvas`; keep it
  token-driven.

All other Phase 1 findings (M1–M8 core, L1–L7) remain verified as resolved;
M5, M6, L3 remain honest Phase 2/launch blockers; synthetic-pilot and
blocked-launch boundaries are intact.

## Final verdict — commit suitability

**Not yet commit-ready.** One Medium accessibility residual (staff skip-link
focus ring, 2.26:1) plus a test that would not catch it. This is the exact
accessibility class the project treats as launch-critical, and the fix is a
single CSS rule + one test correction. Recommend: apply the ring fix and
correct the backdrop sampling, re-run the full gate suite, then take the
baseline commit. If a baseline commit must happen now, it should record the
residual as a known, tracked Phase 1 gap in `docs/implementation/phase-1.md` and
gate the subsequent fix — but the cleaner path is the small fix first.
