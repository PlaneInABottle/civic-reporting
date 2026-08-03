# ADR 0001: web-first product boundary

Status: accepted for the pilot foundation

## Decision

Build one Next.js App Router application. Do not create an Expo application,
mobile directory, or universal UI package in the MVP.

Future client-independent behavior belongs in contracts, domain, data-access,
database-types, and design-token packages. Page layout, navigation, MapLibre,
uploads, browser storage, and platform adapters remain web-specific.

## Why

The public surface needs server-rendered metadata, semantic HTML, a desktop
list/map composition, and browser accessibility. A future native application
would need different navigation, camera, storage, maps, and push behavior.
Sharing business contracts preserves the useful boundary without forcing UI
abstractions before evidence supports them.

## Consequences

- Phase 1 creates only apps/web and the design-token package.
- No mobile-specific dependency or route is permitted.
- Later core mutations must live behind Supabase RLS and narrow RPCs, not only
  in Next.js actions.
- A future native client is a separate product decision.
