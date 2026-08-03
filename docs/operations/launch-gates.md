# Launch gates and blocked external work

Status: BLOCKED for any real pilot or production launch.

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

Public media remains disabled. Phase 1 contains no technical upload path.
No document in this repository should be interpreted as legal advice, policy
approval, vendor approval, staffing approval, or production authorization.

## Phase 2 entry gates

Before any user-generated content, Auth cookie, database row, or staff query is
introduced:

1. Add and test an environment-appropriate Content Security Policy,
   X-Content-Type-Options, Referrer-Policy, and production-only transport
   security policy.
2. Add server-side session enforcement to every staff and platform route and
   prove role-scoped, organization-scoped denial with RLS before returning any
   data.

These are recorded obligations only. They were not implemented in Phase 1.
