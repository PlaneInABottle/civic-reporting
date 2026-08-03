# Design foundations

## Character

The interface is civic, calm, legible, and operational. Hierarchy comes from
spacing, typography, and contrast before color or decoration. It must not look
like a social feed, a corporate analytics dashboard, or a real government brand.

## System

- Canvas: warm #F6F7F2.
- Ink: #102A2D.
- Primary civic teal: #0F766E with #115E59 hover.
- Persistent report action: safety yellow #F6C445 with Ink.
- Public links: #0B5CAD.
- Review violet stays internal.
- Public Sans is preferred with a humanist system sans fallback.
- Spacing follows a 4px base and the 4, 8, 12, 16, 24, 32, 48, 64 rhythm.
- Controls use a 10px radius; panels use 14px.
- Shadows are reserved for sticky or floating surfaces.

The canonical CSS variables live in packages/design-tokens/src/theme.css.

## Responsive and accessible behavior

Mobile is the baseline. Primary controls target 44 by 44 CSS pixels. Public
pages keep Report an issue visible in the sticky header. Text reflows at a
320px viewport, reading copy stays near 65 characters wide, and all focusable
controls retain a visible high-contrast focus outline.

The list is available before an optional map. Reporting always offers a complete
structured non-map path. Statuses pair words with symbols or context and never
depend on color alone. Reduced-motion and forced-colors preferences are honored.

Automated axe scans are supplemental. Manual keyboard, screen-reader, zoom,
forced-colors, and disabled-user acceptance remain required launch work.

The Phase 1 synthetic fixture is English. The document language must become
locale-driven only after the real pilot language set and translation ownership
are selected; that decision remains a launch blocker.
