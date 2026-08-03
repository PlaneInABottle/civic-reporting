# Phase 1 DeepSeek finding dispositions

Review sources:

- .hermes/reviews/phase-1-deepseek.md
- .hermes/reviews/phase-1-deepseek-confirmation.md
- .hermes/reviews/phase-1-deepseek-final-confirmation.md
- .hermes/reviews/phase-1-deepseek-closure.md
- .hermes/reviews/phase-1-deepseek-dependency-confirmation.md

## Medium findings

| Finding                                 | Disposition | Reason and action                                                                                                                                                                                                                                                                 |
| --------------------------------------- | ----------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| M1 dark-surface focus contrast          | Accepted    | Added a safety-yellow focus ring for controls on Ink surfaces and a real-browser keyboard/CSS assertion for the skip and staff-brand links.                                                                                                                                       |
| M2 incomplete real-browser axe coverage | Accepted    | Added default-rule AxeBuilder scans for every one of the nine Phase 1 routes. The two Playwright projects execute the matrix at mobile and desktop sizes. jsdom continues to disable color contrast and region because it lacks a layout engine; real Chromium owns those checks. |
| M3 nonexistent future packages/scripts  | Accepted    | Removed Phase 2 database scripts, nonexistent transpile-package entries, and the premature generated-types Prettier ignore. The only transpiled workspace package is design-tokens.                                                                                               |
| M4 unused future dependencies           | Accepted    | Removed Supabase, MapLibre, IndexedDB, form, validation, and Radix packages from Phase 1 and regenerated the lockfile. Only imports used by Phase 1 remain.                                                                                                                       |
| M5 security headers                     | Blocked     | This is an explicit Phase 2 entry gate. Phase 1 has no user content, authentication, cookies, or data API. Adding the Phase 2 header contract now would cross the user’s stop boundary. It is recorded in launch-gates.md and must precede user-generated content or Auth.        |
| M6 staff/platform session gate          | Blocked     | This is an explicit Phase 2 entry gate. The current routes contain only synthetic static placeholders and no protected data. Server session enforcement plus RLS-scoped reads must land before any row is returned.                                                               |
| M7 hardcoded design colors              | Accepted    | Added warning, error, safety-hover, and empty-map tokens and replaced the cited literals.                                                                                                                                                                                         |
| M8 design deviations                    | Modified    | Made both Report an issue CTAs safety yellow, constrained the report shell to 40rem, and removed shadows from static cards. This retains teal for form actions in later phases while reserving yellow for reporting entry.                                                        |

## Low findings

| Finding                        | Disposition | Reason and action                                                                                                                                                                                                                               |
| ------------------------------ | ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| L1 report progress nav misuse  | Accepted    | Replaced the non-navigational nav landmark with a paragraph.                                                                                                                                                                                    |
| L2 tsbuildinfo not ignored     | Accepted    | Added the exact generated artifact pattern to .gitignore; the local file remains an ignored transient artifact and will not be staged.                                                                                                          |
| L3 hardcoded English language  | Blocked     | English is the only selected language for the fictional Phase 1 fixture. Locale-driven document language requires the still-blocked real pilot language decision and is documented as later work.                                               |
| L4 redundant StateNotice label | Accepted    | Replaced aria-label with aria-labelledby pointing to the visible heading.                                                                                                                                                                       |
| L5 static live region          | Accepted    | Removed aria-live from the static gallery. Real dynamic status announcements belong with the Phase 3 state changes.                                                                                                                             |
| L6 no Playwright webServer     | Modified    | The project intentionally uses a named project-local PM2 process under the governing runtime instructions. README now states that CI must provide the same built server boundary or an explicitly managed equivalent before running Playwright. |
| L7 no baseline commit          | Accepted    | The user explicitly requested the initial Phase 1 commit after review and verification.                                                                                                                                                         |

## Confirmation findings

| Finding                                 | Disposition | Reason and action                                                                                                                                                                                                                      |
| --------------------------------------- | ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| R1 dark-surface focus residual          | Accepted    | Replaced the single-color treatment with token-driven surface and Ink bands. The Playwright assertion samples the actual rendered backdrop and covers staff skip/brand links over Ink and the platform skip link over a light surface. |
| L8 hardcoded focus-test color           | Accepted    | Replaced the literal with runtime token resolution and relative-luminance contrast calculation.                                                                                                                                        |
| L9 stale implementation evidence        | Accepted    | Updated the Phase 1 evidence to describe the final two-color focus remediation, actual-backdrop test, and final gate counts.                                                                                                           |
| L10 optional additional focus selectors | Rejected    | The universal focus selector and both system backdrop extremes are already exercised. Adding duplicate public selectors would not cover a new behavior or surface, so the bounded Phase 1 matrix remains unchanged.                    |

## Dependency-audit confirmation findings

| Finding                                | Disposition | Reason and action                                                                                                                                                                                |
| -------------------------------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| M9 PostCSS manifest/override mismatch  | Accepted    | Added a failing repository-boundary assertion, aligned the manifest at 8.5.25, then passed the focused test, frozen-lockfile install, full component suite, production build, and browser suite. |
| L11 production-only audit scope        | Accepted    | Ran the full dependency audit, including development dependencies; it returned no known vulnerabilities.                                                                                         |
| L12 unused Phase 1 Sharp optional path | Accepted    | No code change. Sharp remains Next's optional dependency and is pinned only to prevent the audited vulnerable transitive version; Phase 1 introduces no image behavior.                          |
| L13 missing audit disposition row      | Accepted    | Added this section so the review ledger contains every dependency-confirmation finding.                                                                                                          |

## Review verdict after disposition

All warranted Phase 1 findings identified by the reviewer were accepted or
modified and have test coverage. The same-session closure review returned
READY with no Critical, High, or Medium findings. M5, M6, and L3 are honest
forward blockers that cannot be implemented without crossing the explicit
Phase 1 stop boundary.
