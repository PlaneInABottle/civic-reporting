# Civic Reporting Phase 3 — Visual UI/UX Review

Read-only review of the rendered product from the eight attached screenshots (desktop + mobile) cross-referenced against the Phase 3 repository code. No files were edited and no fixes were implemented. Findings are ranked Critical / High / Medium / Low, with the exact screenshot(s), route/component/file, user impact, and the smallest concrete design correction. Intentional text-first/list-first, non-map, and accessibility choices are preserved.

---

## What the screenshots actually show

- `01-home-desktop.png`, `05-home-mobile.png` — home hero, "How it works" aside, and the six recovery-state cards.
- `02-reports-desktop.png`, `06-reports-mobile.png` — `/reports` stuck in the **loading** state ("Loading public reports…" + empty skeleton card).
- `03-report-detail-desktop.png`, `07-report-detail-mobile.png` — `/reports/[publicId]` also stuck in the **loading** state.
- `04-report-new-desktop.png`, `08-report-new-mobile.png` — `/report/new` Step 1 (Location), with the disabled "Use this location" action visible before a location is chosen.

Two of the four distinct rendered surfaces captured (reports list and report detail) are only visible in their **loading** state in these screenshots; the report-flow location step and the home page are fully rendered. I evaluate what is actually rendered, and flag what cannot be concluded.

---

## Critical

**C1 — The public reports list and report detail are only ever seen in the loading state; their real content/scanability cannot be confirmed from these screenshots, and the loading state itself never resolves in the capture.**
Screenshots: `02-reports-desktop.png`, `03-report-detail-desktop.png`, `06-reports-mobile.png`, `07-report-detail-mobile.png`.
Route/files: `apps/web/app/reports/loading.tsx`, `apps/web/app/reports/[publicId]/page.tsx`, `apps/web/components/reports/browse-reports.tsx`, `apps/web/components/reports/public-report-detail.tsx`.

- `02`/`06` show `/reports` in `loading.tsx` ("Loading public reports…" + a large `min-h-64` white skeleton). `03`/`07` show `/reports/[publicId]` in the **same** loading template (the `[publicId]` page has no dedicated `loading.tsx`, so it inherits `/reports/loading.tsx`), so the skeleton for a detail page reads "Loading public **reports**…" — a mismatch between the loading copy and the route being loaded.
- From these screenshots alone it is **not possible to verify** the rendered public report list or detail: whether the list-first layout, support counts, actor-qualified status, timeline, or privacy note render correctly. The e2e tests assert these, but they are not present in the visual evidence provided.

_User impact:_ the two most important public surfaces (what users see when browsing and when following a reference) are unverifiable here, and the loading state is generic and unlabeled for the detail route. If a real slow render occurred, the user would see an unlabeled blank card with no sense of what is coming.

_Smallest correction:_ give the report-detail route its own `loading.tsx` (or parameterize copy) so the skeleton reads "Loading public report…" and matches the route; add a short labeled text line inside the skeleton (e.g. "Loading the public report reference") instead of a bare white block. Capture the _resolved_ list and detail states in the visual baseline before any design sign-off.

---

## High

**H1 — The primary "Use this location" action renders enabled-looking-but-disabled before any location is selected, and the form's main actions are left-aligned full-width with no clear primary/secondary hierarchy on desktop.**
Screenshots: `04-report-new-desktop.png`, `08-report-new-mobile.png`.
Route/file: `apps/web/app/report/new/page.tsx`, `apps/web/components/report-flow/report-flow.tsx`, `apps/web/app/globals.css:68-96`.

- On desktop (`04`), three buttons ("Use my location", "Enter address without a map", "Use this location") are laid out 2-up then full-width. "Use this location" is `disabled` (`disabled={!location || busy}`) and visually de-emphasized (muted teal via `:disabled { opacity: .6 }`), yet it is the largest, full-width element — the eye is drawn to a disabled control before the two actually-actionable choices. The disabled-primary-before-data pattern inverts the intended hierarchy.
- The two real choices ("Use my location" teal-primary, "Enter address without a map" outline) are equal-width, so neither reads as the default next action.

_User impact:_ at the very first decision point, the most prominent control is inert, and the two viable paths are visually undifferentiated — a mild but real discoverability/confidence hit at the top of the funnel.

_Smallest correction:_ keep the disabled-primary pattern but either (a) hide "Use this location" entirely until a location is selected, or (b) make it visibly inert (outline, not filled) when disabled. Optionally give "Use my location" and the non-map path a shared row and reserve the full-width filled style for the post-selection continuation only.

**H2 — The recovery-state cards occupy roughly half of the home page's vertical space above the footer and compete with the primary task before any evidence the service has data.**
Screenshots: `01-home-desktop.png`, `05-home-mobile.png`.
Route/file: `apps/web/app/page.tsx`, `apps/web/components/screen-state-gallery.tsx`.

- On desktop (`01`), the six recovery cards ("Loading nearby reports", "No reports found", "Location permission denied", "You are offline", "Results may be stale", "Something went wrong") dominate the lower half of the page, each with a large bordered white card and a full-width action button. On mobile (`05`) they stack into a very long scroll below the hero.
- These are illustrative _state fixtures_, not live states, so the home page reads as "about failure" before the user has done anything.

_User impact:_ the hero's clear "Tell the right team what needs attention" message and the report CTA are visually outweighed by a wall of error/loading demos, diluting the primary action and adding cognitive load before the user has committed to the flow. This also makes the page feel like a component gallery rather than a service.

_Smallest correction:_ keep the gallery (it is useful as living documentation of honest recovery states) but collapse it behind a compact disclosure (e.g. "How the pilot handles weak connections and errors — show examples") or reduce it to a single representative row on the home page, moving the full gallery to `/how-it-works`. Do not delete the states; just stop leading with them.

---

## Medium

**M1 — "Report an issue" appears three times in the same viewport (header + hero primary + mobile header) with two different visual treatments for the same action.**
Screenshots: `01-home-desktop.png`, `05-home-mobile.png`.
Route/file: `apps/web/components/public-shell.tsx:35-40`, `apps/web/app/page.tsx:23-28`.

- Desktop header has a safety-yellow "Report an issue" button; the hero has a second, larger safety-yellow "Report an issue" directly below it. On mobile (`05`), the header button and the hero button both render, one above the other. Two identical-label CTAs with different sizes/placement for the identical destination (`/report/new`).

_User impact:_ mild duplication; the reserved-safety-yellow principle (one unmistakable report action) is slightly diluted, and on mobile the two yellow buttons stack within a screen or two of each other.

_Smallest correction:_ keep the persistent header CTA as the single yellow action, and on the home hero use a distinct label or style for the in-body CTA (e.g. the same yellow but the header can drop to icon+text on very small screens, or the hero CTA can read "Start a report"). This preserves the reserved color while removing the duplicate-same-label effect.

**M2 — The loading skeleton is a featureless white card with no labeled content area, so it communicates neither progress nor what is being loaded.**
Screenshots: `02-reports-desktop.png`, `03-report-detail-desktop.png`, `06-reports-mobile.png`, `07-report-detail-mobile.png`.
Route/file: `apps/web/app/reports/loading.tsx:4-9`.

- The skeleton is a single `animate-pulse` white panel with `aria-hidden="true"`. The only text is the eyebrow "Loading public reports…" above it. On mobile it fills most of the first viewport.

_User impact:_ during a real slow load, users (especially on a weak connection, which this product explicitly targets) get almost no signal about progress or expected content; a large pulsing blank can read as "stuck" rather than "loading".

_Smallest correction:_ add a small labeled placeholder row inside the skeleton (e.g. a muted "Fetching the latest public list…" or a few grayed text-line placeholders) so the loading state is self-explanatory, and keep the aria-live/announcement behavior consistent with the accessibility contract.

**M3 — Status communication copy is consistent, but the public status is not yet visible in any captured rendered state, so its visual prominence cannot be confirmed.**
Screenshots: none of the captured states show a rendered status banner (the detail is only in loading state).
Route/file: `apps/web/components/reports/public-report-detail.tsx:112-117`, `packages/domain/src/index.ts:175-202` (`actorQualifiedStatus`).

- Code shows a `border-info` status card with `actorQualifiedStatus` ("Accepted by the platform", "Acknowledged by the fictional organization", etc.), which is good, truthful, actor-qualified copy. But no screenshot shows it rendered.

_User impact:_ cannot confirm from these screenshots that the status reads as primary, unambiguous, and not-overclaimed (the plan's core transparency requirement) on a real rendered page.

_Smallest correction:_ include a resolved `/reports/[publicId]` desktop + mobile capture in the visual baseline to confirm the status banner hierarchy. (No design change needed to copy; the code is correct.)

**M4 — The home "How it works" aside is visually clean but is a plain static panel that, on desktop, floats with a shadow while the plan reserves shadows for floating surfaces; the panel is not floating.**
Screenshots: `01-home-desktop.png`.
Route/file: `apps/web/app/page.tsx:41-65`, `apps/web/app/globals.css` (`.shadow-floating` usage was removed from static cards in the remediation — verify).

- The "How it works" aside uses a bordered white panel. It reads well. (Earlier reviews flagged shadow-on-static-cards; the current `01` aside appears border-based, which is fine.) This is noted as a watch-item only because the aside is the second-most-prominent element after the hero, and its "Locate / Describe / Track" content duplicates the recovery-gallery's failure framing directly below it.

_User impact:_ low; mostly a composition note that the hero, the "How it works" panel, and the six failure cards all describe process in three different tones within one screenful.

_Smallest correction:_ none required for the aside itself; consolidating the recovery gallery (H2) resolves the tonal clash.

---

## Low

**L1 — Button and form-control visual system is cohesive and tokenized; no color-carrying-meaning violations are visible in the captured states.** All captured buttons use `primary-button`/`secondary-button` with outcome labels ("Use my location", "Enter address without a map", "Use this location", "Report an issue", "Retry connection"). The safety-yellow is reserved for the report CTA. Good.

**L2 — The loading-state eyebrow ("Loading public reports…") uses the teal `text-civic` color on canvas, which reads as a brand accent for a transient state.** Minor; a muted/neutral loading label would be calmer, but not worth changing unless touching the skeleton anyway (see M2/C1).

**L3 — Mobile ergonomics are strong where content renders:** the mobile hero stacks sensibly, the location step's buttons become full-width and tappable, the non-map path is a first-class visible button, and the synthetic/non-government banner is present at the top without obstructing content. The sticky header keeps "Report an issue" reachable.

**L4 — The synthetic/non-government disclosure is communicated clearly and persistently (top banner on every captured page: "Synthetic pilot for Harborfield Pilot District — not a real government service") without cluttering the content below.** On mobile (`05`, `08`) the banner wraps to two lines but remains legible and unobtrusive. Good balance — it does not overwhelm the user.

**L5 — Footer ("Harborfield Civic Works Lab … Accessibility / Privacy / Contact") is present on rendered pages and correctly de-emphasized; the privacy/contact links support the plan's disclosure requirements.**

---

## Accessibility-visible cues (positive)

- Skip link and landmark structure are in code and verified by tests (not visible in screenshots, as expected for skip links).
- The non-map location path is a prominent, keyboard-operable button, not a hidden fallback.
- Form controls (location search, description, OTP) use real `<label>` associations in code; the location-step buttons are large enough (min-height tokens) for touch.
- Focus ring (two-color) is code-verified; it cannot be visually confirmed from static screenshots (no focused element is captured).
- Recovery-state cards pair icons with text (not color-alone), consistent with the "status never color-only" rule.

## What cannot be concluded from static screenshots

- **The rendered public reports list and report detail** (scanability, support counts, status banner, timeline, privacy note) — both captured only in the loading state (C1). Their real visual quality is unverified here.
- **Focus indicator visibility and order** — no focused element is captured.
- **The report-flow steps beyond Step 1** (duplicates, details, review, result) — only Step 1 (Location) is rendered in the screenshots.
- **Map/list balance on the live `/reports` page** — the optional schematic map is only present in code; no screenshot shows the list or the map.
- **True contrast of text/controls on the rendered pages** — screenshots approximate but cannot be used to certify WCAG contrast (code/axe cover this separately).
- **Error/recovery states as they actually appear when triggered live** — the home gallery shows them as fixtures; their in-context appearance is not captured.

---

## Prioritized fix order

1. **C1** — Give `/reports/[publicId]` a dedicated, correctly-labeled loading state; capture resolved list/detail screenshots in the visual baseline. (Unblocks confirmation of the two most important public surfaces.)
2. **H2** — Collapse the home recovery-state gallery behind a disclosure or reduce to a representative row; move the full gallery to `/how-it-works`. (Restores hero/CTA dominance.)
3. **H1** — Make "Use this location" hidden or outline-when-disabled until a location is selected; differentiate the two location choices. (Fixes the top-of-funnel hierarchy.)
4. **M2** — Add labeled placeholder content to the loading skeleton so loading is self-explanatory.
5. **M1** — De-duplicate the three "Report an issue" CTAs (distinct label/style for the in-body hero CTA on small screens).
6. **M3** — Confirm the public status banner hierarchy with a resolved detail capture (copy is already correct).

## Visual verdict

**Strong foundation, one clear verification gap, and two composition issues worth fixing before the next phase.** The rendered surfaces that are visible — home hero, the location step, and the mobile flow — are clean, legible, on-brand, and communicate the synthetic/non-government/privacy claims without overwhelming the user. The recovery-state system is genuinely well thought through but currently _over-weighted_ on the home page (H2). The most important public surfaces (the reports list and the report detail) are only present in a generic, unlabeled loading state (C1), so their visual quality cannot be confirmed from this evidence and the loading skeleton itself needs route-aware labeling. Fix C1, then H2 and H1; nothing here requires a redesign — the corrections are small, targeted, and preserve the deliberate text-first/list-first and accessibility choices.
