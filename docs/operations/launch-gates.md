# Launch gates and blocked external work

Status: BLOCKED for any real pilot or production launch.

Phase 2 proves only the local technical Auth/RLS foundation. It does not close
any legal, privacy, staffing, vendor, real-city, or production-launch gate.

The local Phase 1 foundation is executable, but none of the following is
approved or complete:

- real jurisdiction, organization, boundary, categories, emergency channels,
  public-location policy, languages, and service ownership;
- legal and privacy owners, content policy, retention, preservation, takedown,
  export/deletion, illegal-content, and incident procedures;
- email and delivery vendors, DPAs, real recipients, authentication
  deliverability, SPF/DKIM/DMARC, bounce handling, and acknowledgment evidence;
- map/geocoder provider, terms, cost, and real address-quality acceptance;
- moderation provider DPA, region, subprocessors, retention, no-training terms,
  measured cost/latency, and outage behavior;
- trained moderation staff, hours, queue SLA, exposure limits, wellness support,
  fallback, and restricted legal escalation with required approvers;
- staging/production Supabase projects, production secrets, monitoring,
  backups/restores, security review, accessibility user acceptance, and named
  launch sign-off.

Public media remains disabled. Phase 2 contains no technical upload path.
No document in this repository should be interpreted as legal advice, policy
approval, vendor approval, staffing approval, or production authorization.

## Phase 2 technical gates

Before any user-generated content, Auth cookie, database row, or staff query is
introduced:

1. Add and test an environment-appropriate Content Security Policy,
   X-Content-Type-Options, Referrer-Policy, and production-only transport
   security policy.
2. Add server-side session enforcement to every staff and platform route and
   prove role-scoped, organization-scoped denial with RLS before returning any
   data.

Both technical gates were implemented and tested locally in Phase 2. This does
not close the external launch blockers above.

## Phase 3/4 security gate

The Phase 2 CSP permits framework inline scripts and styles so the current
Next.js surface can hydrate. Before Phase 3 renders user-generated content or
Phase 4 enables any media path, replace the inline-script allowance with a
tested nonce-based strict CSP. This is a launch blocker, not a completed claim.
