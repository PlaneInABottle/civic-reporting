# 0002: Supabase security boundaries for the synthetic pilot

Status: accepted for the local/staging pilot foundation

## Decision

Use one Supabase project per environment and one deliberately fictional pilot
organization. PostgreSQL, PostGIS, Auth, RLS, and narrow SQL functions are the
authorization source of truth. Next.js validates sessions on the server but is
not an all-powerful data proxy.

The schema separates reporter identity, exact location, public location,
moderation state, delivery state, and append-only audit data. Public reads use
views that select only public-safe columns. Fixed organization and platform
presets are scoped independently; holding one preset never implies another.

User writes that cross protected state use `security definer` RPCs with an empty
search path, explicit caller and preset checks, expected state versions,
idempotency fingerprints, and an audit append in the same transaction. Direct
client DML on protected tables is not granted. Future protected workers may use
the Supabase privileged server role, but the web application has no credential
or generic client for it.

Email verification uses a pasteable six-digit local OTP so an IndexedDB draft
can stay in the same browser. Verified drafts are copied through the caller JWT
and the atomic draft RPC. Organization and platform administrator routes require
an AAL2 TOTP session. Proxy session refresh is defense in depth; every protected
page also performs server-side authorization and the database still enforces
RLS.

## Consequences

- Cross-role and cross-organization denial can be tested with real database
  roles even though the product ships one pilot organization.
- Platform access remains a redacted operational backstop, not a global report
  or identity browser.
- Public media remains disabled; no Storage or Realtime service is started in
  Phase 2.
- Phase 3 must call the existing draft/report RPC boundaries instead of adding
  Next.js-only state transitions.
- Production email, MFA recovery, legal/privacy approval, trained staffing,
  vendor agreements, monitoring, backup/restore, and real-jurisdiction launch
  remain unresolved gates.
