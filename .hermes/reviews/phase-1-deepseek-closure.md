# DeepSeek V4 Flash — Phase 1 closure

Verified the current worktree (read-only; gates not re-run).

# Phase 1 Final Read-Only Verification

## R1 — RESOLVED (two-color focus ring + actual-backdrop test)

**CSS** (`apps/web/app/globals.css:45-49`) now uses a single surface-agnostic two-color ring:

```css
outline: 0.1875rem solid var(--color-surface); /* 3px white inner band */
outline-offset: 0.125rem;
box-shadow: 0 0 0 0.3125rem var(--color-ink); /* 5px ink outer band */
```

Because the outer band (ink) and inner band (white) are the two luminance extremes, at least one band always clears 3:1 against any backdrop in the system — including the previously failing staff header case (white band vs ink header ≈ **15:1**). The old surface-scoped `.bg-ink :focus-visible` safety-yellow rule is removed; `@media (forced-colors: active)` (`:62-67`) correctly swaps the ring to `Highlight` and drops the shadow.

**Test** (`e2e/phase1-foundation.spec.ts:42-84,170-190`) resolves the prior R1-test flaw: `focusEvidence` now samples the **actual rendered backdrop** via `elementsFromPoint` at 2px outside the element's border box (the ring zone, which is excluded from hit-testing), then asserts ring-vs-backdrop contrast with the token-resolved colors. `expectContrastingFocusRing` checks inner ring = `--color-surface`, outer ring contains `--color-ink`, and `max(contrast(surface, backdrop), contrast(ink, backdrop)) ≥ 3`. Coverage:

- `/admin` skip link over the **ink** header (the exact previously-missed case) → white band ≈ 15:1 ✓
- `/admin` brand link inside ink header → same ✓
- `/platform` skip link over the **white** header → ink band ≈ 15:1 ✓

## L8 — RESOLVED

Fully token-driven: `contrastRatio()` uses a correct relative-luminance function and all colors come from the `--color-*` tokens via a runtime probe; the previous hardcoded `rgb(246, 196, 69)` and the hardcoded-canvas backdrop are gone.

## Remaining severity-ranked Phase 1 findings

**None at Critical / High / Medium.** Two Low, documentation/coverage only:

- **L9 (Low) — `docs/implementation/phase-1.md:74-85` is stale.** The evidence record still describes the superseded remediation ("the dark-surface outline was link blue instead of the required high-contrast **safety yellow**") and doesn't mention the final surface/ink two-color ring. It should be corrected at the baseline commit so the recorded evidence matches the current diff.
- **L10 (Low) — focus test does not directly sample the public home skip link or the safety-yellow CTA.** The universal two-color ring is surface-agnostic by construction and `/platform` covers the light-backdrop path, so this is optional, not a blocker.

## Security / RLS / privacy / accessibility / test gaps

- **Security/RLS:** No change — no DB, auth, middleware, or secrets exist. M5 (CSP/security headers) and M6 (server-side session gate on staff/platform) remain recorded Phase 2 entry gates in `docs/operations/launch-gates.md:29-37`, unimplemented and honestly blocked. The new ring CSS introduces no attack surface.
- **Privacy:** Intact; synthetic-pilot and blocked-launch boundaries unchanged; no PII or media surface.
- **Accessibility:** R1 is genuinely closed; forced-colors handling is present; reduced-motion unaffected; 44px targets, skip-link order, and 9-route full-rule axe matrix (`phase1-foundation.spec.ts:162-168`) remain.
- **Test:** Token-driven and backdrop-sampled; robust in the pinned Playwright Chromium. The `outerRing.toContain(ink)` assertion depends on Chromium's `rgb()` serialization of the computed `box-shadow`, which is stable in the pinned browser (informational, not a defect).

## Phase 1 commit-suitability verdict

**READY for the baseline commit.** All previously identified Phase 1 findings — M1–M8, L1–L7, the R1 residual, and L8 — are resolved in the current diff. The only outstanding items are two Low notes: update the Phase 1 evidence record (`docs/implementation/phase-1.md`) to describe the final two-color ring, and (optionally) extend the focus test to the public home skip link. M5, M6, and L3 remain honest Phase 2/launch blockers. Commit Phase 1 as the foundation baseline; Phase 2 should begin with the recorded security-header and staff-session entry gates.
