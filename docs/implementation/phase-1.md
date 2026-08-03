# Phase 1 implementation evidence

Date: 2026-08-03

## Scope

Repository/tooling foundation, design tokens, public/staff/platform shells,
representative state UI, public information routes, component/accessibility
tests, Playwright configuration, and durable launch-blocker documentation.

Phase 2 schema, Supabase, Auth, RLS, and persisted behavior were not started.

## RED/GREEN record

| Slice                            | RED evidence                                                                                          | GREEN evidence                                        |
| -------------------------------- | ----------------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| Public shell and recovery states | Focused Vitest failed to resolve app/page and screen-state-gallery; 1 failed suite, 0 tests collected | Focused Vitest: 1 file, 2 tests passed                |
| Representative route shells      | Focused Vitest failed to resolve app/reports/page; 1 failed suite                                     | Focused Vitest: 1 file, 4 tests passed                |
| Accessibility and persistent CTA | Focused Vitest: 1 of 7 failed because the header lacked sticky and top-0                              | Focused Vitest: 1 file, 7 tests passed                |
| Information routes               | Focused Vitest failed to resolve app/accessibility/page; 1 failed suite                               | Focused Vitest: 1 file, 3 tests passed                |
| Dependency security              | pnpm production audit: 4 findings (1 moderate, 3 high) in Next transitive Sharp/PostCSS versions      | Patched workspace overrides: no known vulnerabilities |

The first real-browser axe run also produced an acceptance RED: CTA text inherited
the global link blue inside teal/yellow controls, and the pilot trust strip was
outside a landmark. Scoping the default anchor rule and adding a labeled aside
made the unchanged Playwright assertions GREEN.

## Final quality evidence

- pnpm format: pass, all matched files.
- pnpm lint: pass, zero warnings.
- pnpm typecheck: pass.
- pnpm test:component: 5 files, 20 tests passed.
- pnpm build: pass; 10 static routes, including the not-found route, were
  generated from 11 static pages.
- Focused reviewer regression: 2 tests passed across Chromium mobile and
  desktop.
- pnpm test:e2e: 24 tests passed across Chromium mobile and desktop.
- pnpm audit --prod --audit-level high: pass, no known vulnerabilities;
  PostCSS 8.5.25 and Sharp 0.35.3 are pinned as patched workspace overrides.
- pnpm audit --audit-level high: pass, no known vulnerabilities across the
  complete dependency graph.

Earlier acceptance evidence:

- First Playwright attempt: 4 environment failures because the pinned Chromium
  artifact was absent.
- Second behavioral Playwright attempt: 2 passed and 2 failed on real CTA
  contrast and landmark findings.
- Initial foundation journey rerun: 4 passed across Chromium mobile and
  desktop before the full route/accessibility matrix was added.

## Agent Browser evidence

Dedicated session: civic-reporting-codex-qa.

- Mobile home snapshot exposed the persistent Report an issue action and all six
  recovery states.
- Report an issue navigation reached the location route with both geolocation
  and non-map buttons.
- Wide operator navigation reached the separate moderation shell; no original
  media was exposed.
- Platform health exposed redacted defaults and explicit launch blockers.
- Console and page-error checks produced no output after material navigations.
- At a 320 by 844 viewport, keyboard Tab focused Skip to main content first and
  document scroll width equaled the 320px viewport width.
- Computed keyboard focus evidence showed a 3px surface inner outline and 5px
  Ink outer band on both the public and staff shells.
- Representative screenshots were stored only under /tmp and are intentionally
  excluded from the repository and commit.

## Boundaries

- All names and content are synthetic.
- Public media is disabled and not implemented.
- No Supabase project was initialized, linked, reset, migrated, seeded, or
  deployed.
- No real external provider or recipient was contacted.
- Launch gates remain blocked in docs/operations/launch-gates.md.

## Review

The complete mandatory review and all same-session confirmation passes are
stored at .hermes/reviews/phase-1-deepseek.md,
.hermes/reviews/phase-1-deepseek-confirmation.md,
.hermes/reviews/phase-1-deepseek-final-confirmation.md,
.hermes/reviews/phase-1-deepseek-closure.md, and
.hermes/reviews/phase-1-deepseek-dependency-confirmation.md. The reviewers
returned READY with no unresolved Critical, High, or Medium findings. The
complete accepted, modified, rejected, and blocked classification is stored at
.hermes/reviews/phase-1-disposition.md.

Reviewer-remediation RED:

- Repository-boundary Vitest: 3 of 3 failed before dependency/config, token,
  layout, semantics, and artifact-ignore remediation.
- Initial focus-ring Playwright: 1 of 1 failed because the dark-surface outline
  was link blue.
- Residual focus-ring Playwright: 1 of 1 failed after exposing that a
  single-color yellow ring lacked contrast on the public light canvas.
- Actual-backdrop Playwright: 2 of 2 failed across the two browser projects
  because the prior ring and backdrop assumption did not cover both surface
  extremes.
- Dependency-alignment Vitest: 1 of 20 failed because the web manifest retained
  PostCSS 8.5.6 while the patched workspace override and lockfile resolved
  8.5.25.

Reviewer-remediation GREEN:

- Repository-boundary Vitest: 1 file, 3 tests passed.
- Token-driven, actual-backdrop focus regression: 2 tests passed across
  Chromium mobile and desktop.
- Full rebuilt-runtime Playwright suite: 24 tests passed, including the
  nine-route full-rule axe matrix in both browser projects.
- Dependency-alignment Vitest: 1 file, 4 tests passed; full component suite:
  5 files, 20 tests passed; frozen-lockfile install: pass.
