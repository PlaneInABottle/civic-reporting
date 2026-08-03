# Civic Reporting Pilot MVP Product, Design, and Architecture Plan

> **Planning artifact only.** Do not scaffold or implement this product until
> implementation is explicitly approved. Review, implementation, commit, and
> push remain separate authorization stages.

**Status:** Revised v0.2 after DeepSeek V4 Flash and Luna xhigh reviews  
**Updated:** 2026-08-03 14:28:52 +0300  
**Working name:** Civic Reporting  
**Goal:** Deliver a trustworthy, accessible, web-first pilot that lets people
report and track non-emergency public-space problems and gives one responsible
organization a safe triage and moderation workspace.  
**Architecture:** One Next.js web application backed by Supabase. Domain rules
and data contracts remain client-independent so an Expo mobile application can
be added later without duplicating backend behavior.  
**Stack direction:** Next.js App Router, TypeScript, Tailwind CSS 4, local
shadcn/Radix primitives, MapLibre GL JS, Supabase Auth/Postgres/PostGIS/Storage/
RLS/Edge Functions, Zod, React Hook Form, Playwright, Vitest, axe, and pgTAP.

---

## 1. Final architectural recommendation

1. Build a responsive **Next.js web application first**.
2. Use one Supabase product backend and separate local, staging, and production
   environments.
3. Keep a pnpm workspace, but create only `apps/web` during the first approved
   implementation phase.
4. Add `apps/mobile` with Expo Router only after pilot evidence shows that native
   camera, offline, push, or field-worker capabilities justify the cost.
5. Share contracts, database types, pure domain rules, and design tokens. Do not
   force map components, page layouts, navigation, or upload UI to be universal.
6. Pilot **one jurisdiction, one responsible organization, one operator queue,
   and one delivery channel**.
7. Treat the FixMyStreet clone as an AGPL research reference only. Copy no code,
   template, visual asset, or brand element.

```text
Next.js web now ─┐
                 ├─ contracts/domain/data packages ─ Supabase
Expo later ──────┘
```

### Why not one Expo UI for web and mobile?

The public web needs indexable report pages, precise metadata, desktop map/list
layouts, staff tables, semantic HTML, and mature browser accessibility. The
future native client will need different maps, camera handling, session storage,
navigation, offline behavior, and push notifications. A universal Expo UI would
produce extensive `.web` and `.native` branching. Shared business behavior is
valuable; forced shared page UI is not.

---

## 2. Pilot definition

### 2.1 In-scope pilot

- One explicitly named jurisdiction and responsible organization.
- One versioned service boundary dataset.
- One reviewed category taxonomy and emergency exclusion list.
- Address/place search, current location, and a non-map alternative.
- Nearby duplicate suggestions before submission.
- Text-first report creation with verified email.
- At most **one optional photo**, enabled only after all media safety gates pass.
- Private exact location and policy-derived public location.
- Public report page with truthful status and organization-authored timeline.
- Private follow/support action with optional notifications.
- Citizen account view for reports, drafts, and following.
- Separate operator, moderator, organization administrator, and platform
  administrator permission presets.
- One organization delivery mechanism.
- Email confirmation and meaningful status notifications.
- RLS, audit, rate limits, moderation, accessibility, and real-surface staging
  acceptance.

### 2.2 Explicitly deferred

- Native iOS/Android clients.
- Nationwide or multi-organization routing.
- Public citizen comments or general discussion threads.
- More than one image per report.
- Automatic image crop/blur editing.
- Model-assisted title generation or model-only duplicate decisions.
- Open311 or inbound organization webhooks unless the pilot requires them.
- Organization and area SEO landing pages.
- Local-area digest notifications.
- Self-service account export/deletion UI; support the legal process manually
  during the pilot and automate only after demand is proven.
- Full appeals case-management UI; provide a documented manual review request.
- Dynamic capability-builder UI and capability-matrix database tables.
- Cross-organization platform browsing, feature flags, break-glass dashboards,
  and broad policy editors.
- Realtime updates, web push, and offline submission.
- Gamification, points, badges, leaderboards, payments, or SLA prediction.

### 2.3 Pilot exit promise

A citizen can create a safe non-emergency report, verify their email, receive a
stable reference, and track truthful organization-authored status changes. One
scoped operator can triage it without accessing unrelated or unnecessarily
sensitive data. Unsafe content cannot become public.

---

## 3. Product principles

1. **Minimize effort without rushing people.** Measure median text-only form time
   but do not market a guaranteed three-minute completion promise.
2. **Explain verification early.** Say before the flow starts that email
   verification is required before routing.
3. **Prevent duplicates before creating new work.** Nearby candidates are a
   normal step, not a hidden warning after submission.
4. **Never fake progress.** `Accepted by this platform`, `Delivered`,
   `Acknowledged`, and `Marked resolved by the organization` are different facts.
5. **Exact location is private by default.** Every public surface uses an
   explicit publication policy rather than raw coordinates or raw addresses.
6. **No public content before its visibility gate passes.** This includes text,
   generated titles, image derivatives, OCR, filenames, notification previews,
   search indexes, and social metadata.
7. **Safety is operational, not aspirational.** Providers, staff ownership,
   review hours, legal procedure, and failure behavior are launch gates.
8. **The map is an enhancement.** The semantic source of truth is a structured
   location and synchronized text list.
9. **Mobile web is first-class.** The flow must survive bright sunlight, narrow
   screens, temporary disconnection, refresh, and upload retry.
10. **Color never carries meaning alone.** Status always includes text and icon.
11. **One primary action per view.** Labels describe outcomes rather than generic
    `Continue` or `Save` wording.
12. **Measure before expanding.** Native mobile, multiple organizations, citizen
    updates, and advanced integrations require pilot evidence.

---

## 4. Roles, presets, and field visibility

Role names are convenience presets. Authorization is enforced by RLS and narrow
RPCs. The MVP does not ship a dynamic capability-builder UI or capability tables.
A person may hold more than one preset, but the scopes remain separate.

### 4.1 Visitor

- Browse reports that passed public visibility policy.
- Search location and start a local text draft.
- View a non-map list equivalent to the map.
- Cannot see reporter identity, exact location, original media, moderation
  signals, internal notes, or delivery secrets.

### 4.2 Citizen

- Create and withdraw their own draft before routing.
- View their reports, public references, delivery status, and staff updates.
- Privately answer an organization `Needs information` request.
- Follow/support an existing report; identity remains private.
- Choose whether to receive status notifications. Notifications default off for
  a simple support action.
- Request privacy correction, content review, account export, or deletion through
  a documented support process.
- Cannot set institutional status or post unrestricted public comments.

### 4.3 Operator

Scoped to the pilot organization.

- Triage, category-correct, assign, route, mark duplicate, and change permitted
  operational statuses.
- Post public organization updates and private notes.
- View exact location and verified reporter contact only when needed to process
  the report.
- Cannot reveal unsafe media, manage members, edit organization policy, or access
  legal escalation cases.

### 4.4 Moderator/reviewer

- Review text/media safety signals and publication eligibility.
- Approve, reject, request replacement, or escalate content.
- See safe metadata by default, not raw/original media.
- Reveal ambiguous media only through staged, reasoned, time-limited access.
- Cannot manage memberships, routing, organization configuration, or public
  operational status unless also assigned the operator preset.

### 4.5 Organization administrator

- Manage pilot members and assign fixed presets.
- Manage category and boundary drafts, routing destination, and notification
  templates through previewed/audited changes.
- Read organization audit records and delivery test results.
- Does **not** inherit sensitive-media reveal. That requires the moderator preset.

### 4.6 Platform administrator

The pilot surface is a narrow operational backstop, not a global data explorer.

- Manage the one pilot organization, platform health, audit metadata, and global
  provider configuration status.
- Default to metadata and redacted views.
- No routine raw media, reporter identity, or exact location access.
- Sensitive access requires MFA re-authentication, case ID, reason, scope,
  expiration, and audit record.

### 4.7 Legal/safety escalator

This is a restricted just-in-time capability, not a routine navigation role.

- Receives only severe/legal cases through the approved jurisdictional runbook.
- Routine moderators and platform administrators do not automatically receive it.
- Access requires reason, case scope, expiry, and a second approver when policy
  requires it.

### 4.8 Field-level visibility matrix

Before schema implementation, define and test visibility for:

| Data | Citizen owner | Operator | Moderator | Org admin | Platform admin | Public |
|---|---|---|---|---|---|---|
| Verified contact | Own | Need-to-know | No | No by default | No | No |
| Exact coordinates | Own | Yes in scope | Context only | No by default | Redacted | No |
| Public location | Yes | Yes | Yes | Yes | Yes | Yes if publishable |
| Original media | Own pre-submit | No | Staged only | No | No | No |
| Processed safe media | Yes | Yes | Yes | Yes | Metadata | Yes |
| Moderation signals | Own decision summary | No | Yes | Aggregate | Metadata | No |
| Internal notes | No | Yes | No unless case-linked | Audit only | Metadata | No |
| Legal case | No | No | No routine access | No | Metadata | No |

This table is a starting contract; a schema/RLS plan must turn every cell into a
positive or negative test.

---

## 5. Information architecture

### 5.1 Public routes

```text
/                              Home
/map                           Browse list/map
/reports                       Searchable public list
/reports/[publicId]            Public detail and timeline
/reports/[publicId]/concern    Privacy/abuse concern form
/report/new                    Reporting journey
/how-it-works                  Routing, privacy, and expectations
/sign-in                       Email OTP authentication
/accessibility                 Accessibility and non-map guidance
/privacy                       Plain-language privacy policy
/community-guidelines          Text/photo policy
/contact                       Verification, pending, and privacy support
```

Organization/area SEO pages are deferred until location and indexing policy is
proven.

### 5.2 Citizen routes

```text
/account
/account/reports
/account/following
/account/drafts
/account/notifications
/account/privacy
```

### 5.3 Staff routes

```text
/admin                         Triage queue
/admin/reports/[id]            Report workspace
/admin/moderation              Moderation queue
/admin/assignments             Assigned-to-me view
/admin/categories              Org admin only
/admin/areas                   Org admin only
/admin/members                 Org admin only
/admin/delivery                Outbox/retry list
/admin/audit                   Org admin only
```

### 5.4 Platform routes

```text
/platform                      Health and pending incidents
/platform/organization         Pilot organization metadata/config status
/platform/audit                Redacted audit search
```

Every non-public, draft, pending-sensitive, admin, and platform route is
`noindex`. Social previews are generated only from public-safe views.

---

## 6. Reporting journey

### 6.1 Flow order

```text
1. Location
2. Similar reports
3. Problem details
4. Email verification
5. Optional photo and privacy
6. Review and submit
7. Accepted/pending result
```

The home and Step 1 state clearly: this is a non-emergency service, coverage is
limited to the pilot area, and email verification is required before routing.

### 6.2 Draft and verification contract

- Text/location/category draft lives in IndexedDB for a short documented TTL.
- The browser shows `Draft saved on this device`, `Clear draft`, and a shared-
  device warning.
- Do not create anonymous server-readable draft rows.
- Use a pasteable email OTP in the same browser so the local draft remains in
  place. A magic-link is an optional convenience, not the only recovery path.
- Support resend with bounded attempts, change email, expired code, wrong code,
  provider delay, and `email not received` support.
- Once verified, create the authenticated draft/report intent atomically with an
  idempotency key.
- Server drafts are only for verified/authenticated users and have TTL cleanup.
- Photo selection occurs after verification. Unsubmitted photo blobs are not
  retained indefinitely on a shared device.
- Offline submission is **not** promised. Local drafting and retry are supported.

### 6.3 Step 1 — Location

#### Desktop

- Visible address/place label and autocomplete above a wide map.
- `Use my location` is explicit; never request permission on page load.
- Selected place/address appears as text beside the map.
- Primary action: `Use this location`.

#### Mobile

- Compact search at top, map below, center crosshair, and bottom action above the
  safe area.
- The bottom action disappears or moves when it would cover the keyboard, errors,
  consent, or essential content.

#### Non-map baseline

- Structured place/street/area fields.
- Selectable geocoder results rendered as a normal list.
- Text summary of the selected location and public precision.
- Manual correction path.
- Full reporting flow remains possible without canvas interaction.

#### Required states

- Permission denied.
- Permission timeout.
- GPS inaccurate.
- Address not found.
- Geocoder unavailable.
- Map tiles unavailable.
- Outside pilot area.
- Offline/stale result.
- Selected place changed.

No state destroys the draft. Every failure has a retry and non-map alternative.

### 6.4 Step 2 — Similar reports

- PostGIS candidate set uses public-safe location, category hints, status, and
  recency. No model is the sole duplicate gate.
- Display three to five public-safe candidates with category, approximate
  distance, age, status, thumbnail only if safe, and why it was suggested.
- `This is the same issue` and `None of these` have equal visual prominence.
- Explain before action: supporting is private by default, supporter identities
  are never public, notification is optional, and the action can be undone.
- Selecting the same issue creates or updates one private relationship with
  `supports=true` and an optional notification level; it does not create a new
  report.
- Avoid showing sensitive nearby addresses or descriptions.
- `View all nearby` uses paginated list results.

### 6.5 Step 3 — Problem details

- Searchable, grouped category combobox with keyboard support.
- Category-specific helper copy is guidance, not a rigid keyword gate.
- Description label: `What happened, and what should the responsible team know?`
- Character limits and remaining count are visible before the limit.
- Use a deterministic editable title template after text moderation, such as
  `[Category] near [public area]`; no MVP LLM dependency.
- Emergency categories display the correct emergency channel and do not pretend
  to route urgent danger through this product.
- Autosave and refresh recovery are visible.

### 6.6 Step 4 — Email verification

- Explain why verification is required and what remains private.
- OTP fields support paste and browser autofill.
- Show resend timer, change-email action, delivery-delay copy, and support link.
- Returning from a magic link or refresh restores the same draft.
- Verification never causes location, text, or category loss.

### 6.7 Step 5 — Optional photo and privacy

Photo upload is disabled until Section 10 launch gates pass. When enabled:

- Maximum one image.
- Accept only formats proven end to end. JPEG/PNG/WebP are baseline. HEIC/HEIF is
  enabled only after browser, decoder, re-encoding, metadata, and failure paths
  pass on supported iPhone/Safari versions.
- Explain that upload is optional and may delay publication.
- Warn before selection: avoid faces, children, plates, private interiors,
  documents, and graphic/sexual content.
- Compress/resize before upload where safe for weak connections; server still
  validates and re-encodes.
- Show progress, interrupted upload, retry, remove, replacement, and provider
  outage states.
- Upload directly to private quarantine using one short-lived, single-purpose
  signed URL.
- Public preview shows only the processed derivative after approval.

### 6.8 Step 6 — Review and submit

Show a plain-language publication/routing card:

- Exact location visible to the organization.
- The precise public representation: exact public-infrastructure point,
  approximate point/area, or private-only.
- Category and text.
- Photo state if enabled.
- `Likely responsible organization` until route ownership is confirmed.
- Public display name or pseudonym choice, separate from verified identity.
- Notification choice.
- Content-policy and privacy summary with no pre-checked optional consent.

Primary: `Submit report`. Secondary: `Save verified draft`.

### 6.9 Step 7 — Result

Use state-specific copy:

- `Accepted by this platform — safety checks in progress`.
- `Accepted — waiting to be delivered`.
- `Delivered to [organization]` only with delivery evidence.
- `Acknowledged by [organization]` only with acknowledgment evidence.
- `Photo held — text report submitted` when policy permits.
- `Submission interrupted — check status before retrying` after uncertainty.

Always show a stable public or private reference, status polling/reload, and
support path. Idempotent retry cannot create another report.

---

## 7. Public report detail

### 7.1 Layout

1. Operated-by/coverage trust strip without falsely claiming government ownership.
2. Header with persistent `Report an issue` CTA.
3. Breadcrumb/back to list.
4. Status banner with actor-qualified wording, owner certainty, and last update.
5. Main content:
   - Title and moderated description.
   - Approved media only.
   - Public organization-authored timeline.
   - Sidebar/stacked panel with approximate location, map, category, reference,
     and private follow/support controls.
6. `Report a privacy or content concern` link.
7. Nearby public-safe reports.

### 7.2 Status copy

Examples:

- `Accepted by the platform`.
- `Delivered to the organization`.
- `Acknowledged by the organization`.
- `The organization needs more information`.
- `Work marked in progress by the organization`.
- `Marked resolved by the organization`.
- `Closed — duplicate of [reference]`.
- `Closed — outside this service area`.
- `Closed — no action planned`.

Never render an unqualified `Resolved` if only the organization marked it. A
citizen may privately report `This is not resolved`; that creates an operator
review, not an automatic public status reversal.

### 7.3 Public/private event contract

Default visibility is private unless explicitly listed.

| Event | Actor/evidence | Public copy | Visibility |
|---|---|---|---|
| Platform accepted | Atomic submission | Accepted by platform | Public after content gate |
| Moderation pending | Processing state | Optional generic pending copy | Reporter only by default |
| Delivery succeeded | Provider receipt | Delivered to org | Public |
| Delivery failed | Attempt terminal state | Delivery delayed | Reporter + staff; public policy decision |
| Org acknowledged | Manual/API evidence | Acknowledged by org | Public |
| Needs info | Authorized operator | Org needs information | Public summary + private question |
| In progress | Authorized operator/API | Marked in progress by org | Public |
| Resolved | Authorized operator/API | Marked resolved by org | Public |
| Closed reason | Authorized actor + reason | Qualified closed label | Public if safe |
| Media rejected | Moderation decision | Photo unavailable | Reporter; public page omits media |
| Internal note/assignment | Staff | None | Staff only |
| Legal/safety event | Restricted case | None | Restricted only |

The schema plan must add allowed actor, transition evidence, public label,
private reason, reopening behavior, organization transfer, and notification for
each status.

---

## 8. Staff and administration UX

### 8.1 Operator queue contract

Default view is work, not analytics.

- URL-persisted filters and sort.
- Visible result count, last refresh time, `Assigned to me`, `Unassigned`, and
  aging views.
- Cursor pagination or virtualization after measured need; never render an
  unbounded table.
- Rows show public ID, category, public-safe thumbnail state, area, age, status,
  assignee, moderation state, and delivery state.
- Right preview drawer preserves queue position and restores focus on close.
- `Next item` supports repetitive work without keyboard traps.
- Every action rechecks authorization and current row version.
- Concurrent/stale changes show conflict copy and refresh, not silent overwrite.
- Batch actions are limited to low-risk operations and require confirmation;
  status/routing/media/legal actions remain individual in the pilot.
- Explicit loading, empty, permission-denied, stale, network-error, and retry
  states.

### 8.2 Report workspace

Wide layout separates:

1. Public evidence and timeline.
2. Operational controls: status, assignee, category, route, duplicate link.
3. Private activity: notes, moderation summary, delivery attempts, audit.

Public and private sections use labels/backgrounds, not color alone. Routing
override, sensitive field reveal, status close/resolution, delete/hide, and legal
hold require explicit reason and confirmation.

### 8.3 Moderation queue

- Default card shows safe metadata, risk class, confidence band, queue age, and a
  neutral placeholder—not the original and not automatically a blurred image.
- Staged reveal requires warning, reason, permission, and time-limited access.
- No reveal on focus, hover, row selection, or keyboard navigation.
- Provide skip/reassign and do not penalize reviewers for avoiding a class.
- Review responses use no-store/private caching where practical and never place
  originals in public URLs, preload tags, analytics, email, logs, or default lists.
- Routine reviewers never see suspected illegal content.
- Severe/legal escalation uses the restricted runbook and, where required,
  two-person approval.
- Training, rotation, exposure limits, decompression/wellness support, queue SLA,
  and incident reporting are operational launch requirements.

### 8.4 Organization administration

Pilot-only controls:

- Members and fixed presets.
- Category and boundary draft/preview/activation.
- One delivery destination and test delivery.
- Notification template preview.
- Organization audit history.

Show affected future reports before category/boundary changes. Changes are
versioned, scheduled or confirmed, auditable, and reversible where safe.

### 8.5 Platform administration

Pilot-only controls:

- Provider/system health.
- Pilot organization metadata.
- Redacted audit and active incident metadata.
- Scoped just-in-time escalation request.

No global report/media browsing and no broad multi-organization UI.

---

## 9. Location publication and privacy matrix

Exact coordinates and raw addresses are restricted. Public representation is
chosen by category and settlement context and is previewed before submission.

| Context | Organization sees | Public sees |
|---|---|---|
| Public road/streetlight asset | Exact point/address as needed | Point snapped to public asset/segment or approved precision |
| General public-space issue | Exact point | Approximate point/area |
| Near home/private property | Exact point only if necessary | Neighborhood/area or no point |
| Sensitive category/person risk | Exact point with restricted staff visibility | No public point by default |
| Private report option | Exact point to organization | No public report/location |

### 9.1 Surface inventory

The policy covers:

- Report title and description.
- Map pins, lists, clusters, and nearby suggestions.
- Address labels and reverse-geocoder output.
- Photo EXIF and normalized filenames.
- Email subjects/previews and lock-screen notifications.
- Search indexes and analytics.
- Open Graph/social metadata.
- Export/support responses.
- Admin thumbnails and audit logs.

No raw address is automatically inserted into a public title or notification.
Public pages use generic notification subjects and authenticated links when the
content is sensitive.

### 9.2 Tests

- Dense and rural home re-identification scenarios.
- Category policy on every public view/API.
- Exact coordinate inaccessible to visitor/citizen other than report owner.
- Public point/address absent from metadata and notifications when restricted.
- Reporter preview matches the final public representation.

---

## 10. Moderation, unsafe images, and legal safety

### 10.1 Launch safety gates

Public photo upload remains disabled until all are complete:

- Pilot jurisdiction and named legal/privacy owner.
- Approved content, retention, preservation, takedown, and reporting obligations.
- Named moderation provider with DPA, storage region, subprocessors, retention,
  deletion, and no-training terms.
- Measured per-image cost, p95 latency, error behavior, and monthly budget ceiling.
- Named human moderation owner, staffing hours, training, queue SLA, and fallback.
- Restricted legal/safety role, reviewer exposure controls, and incident process.
- Safe synthetic test fixtures; no illegal material in tests.
- End-to-end JPEG/PNG/WebP and conditional HEIC behavior proven.
- Provider-outage behavior proven: media fails closed and report can continue
  text-only when policy permits.
- The restricted severe/legal path is implemented and approved by jurisdictional
  legal counsel before launch.

Do not add a second moderation provider by default. A provider outage fails
closed for media and uses the documented human/text-only path.

### 10.2 Visibility pipeline

```text
Verified user selects one image
  → short-lived upload to private quarantine
  → actual MIME/decoder, size, dimensions, and file-count validation
  → malware scan where supported
  → normalize filename, strip metadata, re-encode derivative
  → moderation provider classification
  → safe: approved derivative may publish with safe text
  → uncertain: metadata-only human queue; no public media
  → disallowed: reject media; offer replace/remove/text-only continuation
  → severe/legal signal: restricted escalation; no routine preview
```

A single publication gate controls text, title, image, OCR/derived data,
notification preview, search/index data, and social metadata.

### 10.3 Nude/sexual/graphic image behavior

- Original remains private and never appears on public/report/map/email/social
  surfaces.
- High-confidence disallowed media is rejected under the published policy.
- Ambiguous content enters trained human review.
- Routine queue shows safe metadata/placeholder, not an auto-revealed thumbnail.
- Reveal is staged, reasoned, time-limited, auditable, non-download by default,
  and can be skipped/reassigned.
- User receives neutral copy and can remove/replace or continue text-only.
- Full appeals UI is deferred; a manual review request remains available.

### 10.4 Suspected illegal content

- Vendor signal does not establish illegality.
- Ordinary moderators do not open or download it.
- Restricted legal/safety workflow follows the approved jurisdiction runbook.
- Access, preservation, reporting, retention, and deletion follow counsel-approved
  procedures.
- No routine product launch until this gate is explicitly signed.

### 10.5 Text and derived-content moderation

Use a reputable moderation model/provider and human escalation for semantic
judgment. Do not replace judgment with fixed customer-specific word lists or
regexes. Deterministic technical rules may still validate payload structure,
markup, URLs, MIME, size, and control characters.

Moderate before public generation/publication:

- Description and deterministic title inputs.
- Filenames and OCR/derived text if processed.
- Staff public updates.
- Notification previews.
- Search/index snippets and social metadata.

---

## 11. Report and delivery state model

Avoid an explosion of public statuses. Use a small lifecycle plus explicit close
reasons and a separate delivery state.

### 11.1 Report state

```text
draft
pending_verification
pending_moderation
submitted
received
needs_information
in_progress
resolved
closed
```

### 11.2 Close reason

```text
duplicate
out_of_service_area
no_action_planned
content_policy
withdrawn
```

### 11.3 Media state

```text
quarantined
processing
approved
held_for_review
rejected
removed
legal_hold
```

### 11.4 Delivery state

```text
queued
attempting
delivered
acknowledged
retry_scheduled
failed
cancelled
```

### 11.5 Transition rules

Every transition records actor type/ID, source, previous/new state, evidence,
public label, private reason, visibility, timestamp, and correlation ID.

- Only an authorized organization actor/integration can set `received`,
  `needs_information`, `in_progress`, or organization-qualified `resolved`.
- `submitted` never means delivered.
- The pilot defines one acknowledgment mechanism. For email-only delivery,
  acknowledgment is a manual operator event; public copy explains when no
  acknowledgment has arrived.
- Reopening is an authorized organization action; a citizen dispute creates a
  private review request.
- Organization transfer is versioned/audited and public only after confirmed.
- Media/legal/internal events remain private unless explicitly mapped.

---

## 12. Visual design system

The product should feel civic, calm, legible, and operational—not a corporate
SaaS dashboard, social feed, or FixMyStreet clone.

### 12.1 Provisional palette

Hierarchy is designed in grayscale first. Contrast values were independently
recalculated by Luna and are materially correct.

| Token | Hex | Purpose | Contrast |
|---|---:|---|---:|
| Ink | `#102A2D` | Main text/header | 14.02:1 on canvas |
| Canvas | `#F6F7F2` | Warm background | — |
| Surface | `#FFFFFF` | Cards/dialogs | — |
| Civic teal | `#0F766E` | Primary action/brand | 5.47:1 with white |
| Teal hover | `#115E59` | Hover/pressed | 7.58:1 with white |
| Safety yellow | `#F6C445` | `Report an issue` CTA only | 9.27:1 with Ink |
| Link blue | `#0B5CAD` | Links/map selection | 6.19:1 on canvas |
| Info blue | `#2563EB` | Accepted/information | 5.17:1 with white |
| Attention ochre | `#B45309` | Needs info/in progress | 5.02:1 with white |
| Resolved green | `#15803D` | Org-marked resolved | 5.02:1 with white |
| Failure red | `#B91C1C` | Error/destructive | 6.47:1 with white |
| Neutral slate | `#475569` | Closed/secondary | 7.58:1 with white |
| Review violet | `#7C3AED` | Internal moderation only | 5.70:1 with white |

Public pages use a restrained four-state semantic set. Violet remains an internal
moderation token; do not show all accent colors in dense tables. Test text and
non-text contrast, focus, disabled states, forced colors/high contrast, and
color-vision simulations.

### 12.2 Typography

- Public Sans or another verified humanist sans with Turkish/Latin coverage.
- Use `rem` and responsive `clamp()` where appropriate.
- Body: 1rem with 1.55–1.7 line height.
- Mobile heading caps prevent long Turkish copy from dominating the viewport.
- Reading width around 65ch; form width 35–40rem.
- Validate fallback fonts, Turkish `İ/ı/ğ/ş/ç/ö/ü`, 200% text resize, and WCAG
  reflow at a 320px CSS viewport.

Suggested scale:

```text
0.875rem, 1rem, 1.125rem, 1.25rem,
1.5rem, 2rem, 2.5rem, 3.25rem
```

### 12.3 Spacing and shape

- 4px base; rhythm: 4, 8, 12, 16, 24, 32, 48, 64.
- Public max width 75–80rem.
- 10px controls/cards, 14px drawers/dialogs; avoid excessive pills.
- Shadows only for floating map controls, drawers, dialogs, and sticky bars.
- Content grouping relies on whitespace and hierarchy before borders/cards.

### 12.4 Buttons and placement

- Desktop header ends with yellow `Report an issue`.
- Mobile header uses the full label unless tested space constraints require an
  accessible shorter visual label; never hide it only in the menu.
- Form primary uses teal and outcome copy: `Use this location`, `Verify email`,
  `Submit report`, `Approve photo`.
- Secondary is surface/Ink border. Tertiary is text/link. Red appears only in
  destructive confirmation.
- Minimum WCAG 2.2 target is 24×24 with exceptions; product target is 44×44 for
  primary/mobile controls.
- Sticky mobile actions respect safe-area insets and keyboard. They never cover
  errors, consent, timeline content, or the final focus target.
- Async controls retain width, show text plus progress, and reject duplicate
  activation with idempotency rather than spinner-only ambiguity.

### 12.5 Home page

1. Honest operated-by/coverage trust strip; do not fake official ownership.
2. Header and persistent report CTA.
3. Left-aligned hero: non-emergency purpose, coverage, address/place search, and
   `Use my location`.
4. Small real local map/list preview only after location/search, not stock art.
5. Locate → Describe → Track explanation.
6. Privacy/routing/moderation trust section.
7. Alternative contact/channel and `Track a report` link when real.
8. Recent local reports only with public-safe location context.
9. Footer: accessibility, privacy, guidelines, contact, vulnerability reporting.

Do not request geolocation automatically or display vanity totals without real
meaning.

### 12.6 Map/list design

- MapLibre GL JS with a low-noise basemap.
- List is the baseline on mobile, weak connection, map failure, and assistive
  technology. Map is an optional synchronized view.
- Desktop browse is list/map split; report creation may use a larger map.
- Selected list row, marker, focus, and accessible announcement remain in sync.
- Cluster at low zoom; expanding a cluster preserves list context.
- URL persists filters/sort; show count and last refresh.
- Define loading, no results, permission denied, geocoder failure, stale/offline,
  map unavailable, and retry states.
- Map controls, results, and location summary are keyboard-operable; canvas is
  never the semantic source of truth.

### 12.7 Motion

- 120–200ms controls, 200–300ms drawers.
- Respect reduced motion.
- No bouncing markers, confetti, gamified completion, or animation suggesting
  institutional progress.

---

## 13. Cross-cutting screen-state inventory

Every public, citizen, staff, moderation, and platform screen specifies:

- Initial/loading state.
- Empty/no-results state with useful next action.
- Permission denied.
- Authentication/verification expired.
- Validation error summary and field errors.
- Offline/stale data state.
- Provider or network outage.
- Retry behavior and idempotency.
- Concurrent/stale mutation.
- Rate-limited/false-block support path.
- Not found/withdrawn/private content.
- Maintenance state.
- Success state and next expected action.
- Focus placement/restoration and screen-reader announcement.

No implementation task is complete with only a happy-path mockup.

---

## 14. Accessibility contract

Target WCAG 2.2 AA, including 1.4.10 Reflow at a 320px CSS viewport and
2.5.8 Target Size Minimum. The product target is 44×44 for primary/mobile
controls.

- Semantic landmarks, unique page title, and heading order.
- Skip links for public/admin shells.
- Non-map structured location workflow.
- Synchronized map result list.
- Visible focus with at least 3:1 non-text contrast.
- Keyboard flows for autocomplete, duplicate list, drawers, queues, and dialogs.
- Modal/drawer focus trap, Escape, and focus restoration.
- Error summary linked to invalid fields.
- Status text/icon beyond color.
- Polite live regions that do not announce every map movement.
- Reduced motion, forced-colors/high-contrast, 200% text, and reflow acceptance.
- Turkish and other pilot language wrapping.
- Captions/transcripts for instructional media.
- Manual NVDA/VoiceOver and keyboard acceptance; axe is supplemental.

---

## 15. Technical architecture

### 15.1 Workspace

```text
civic-reporting/
├── apps/
│   └── web/
├── packages/
│   ├── contracts/
│   ├── domain/
│   ├── data-access/
│   ├── database-types/
│   └── design-tokens/
├── supabase/
│   ├── migrations/
│   ├── seed.sql
│   ├── functions/
│   └── tests/
├── docs/
│   ├── decisions/
│   ├── product/
│   ├── design/
│   └── operations/
└── .hermes/plans/
```

Do not create `apps/mobile`, universal UI packages, generic repositories, or
mobile branches during the pilot.

### 15.2 Next.js responsibilities

- Server-render public-safe pages and metadata.
- Render authenticated citizen/staff shells.
- Use `@supabase/ssr` cookie sessions.
- Use client components only where interaction requires them: map, upload,
  autocomplete, rich filters.
- Route handlers handle auth callbacks, scoped upload intent, and web-specific
  rate limiting only.
- User-initiated data writes execute as narrow RPC under the caller JWT/RLS.
- Next.js does not hold a general service-role client.
- Core state transitions never exist only in server actions.

### 15.3 Supabase responsibilities

- Auth and identity.
- Postgres/PostGIS source of truth.
- RLS authorization.
- Private quarantine and processed-media Storage buckets.
- Atomic SQL/RPC transitions, idempotency, and audit.
- Edge Functions/worker boundaries for moderation, processing, email, and
  organization delivery.
- Service role exists only inside protected functions/workers and never in
  browser/mobile bundles or a generic Next.js request client.
- Generated database types are updated with migrations.

### 15.4 Data access

- Public reads use public-safe views/RLS.
- Sensitive writes verify actor preset, organization, current version/state,
  idempotency key, and audit atomically.
- Staff RPCs fail without matching scoped claims.
- No generic all-powerful API proxy.
- No inbound webhook in the pilot unless the selected delivery channel requires
  it. If required, specify signature verification, replay protection, secret
  storage, rate limits, and idempotency before implementation.

### 15.5 Background work

A durable outbox tracks email, moderation, media processing, and organization
delivery. Each logical job has an idempotency key, bounded retries, next attempt,
correlation ID, terminal state, and staff-visible simple retry/dead-letter list.
Do not build a broad integration dashboard or separate queue platform by default.

### 15.6 Environments and observability

- Separate local, staging, and production Supabase projects/configuration.
- Structured logs without raw content/secrets by default.
- Correlation IDs across submit, media, moderation, and delivery.
- Error monitoring for browser, server, and functions.
- Queue age, moderation age, email delivery, and organization delivery health.
- Append-only privileged audit.
- Tested backup/restore.

---

## 16. Pilot data model

Use internal UUIDs and non-sequential public IDs.

### 16.1 Identity and pilot organization

```text
profiles
organizations
organization_memberships          # fixed preset, one pilot org
jurisdictions
jurisdiction_versions
categories
organization_categories
```

No dynamic capability table or multi-route rules table in the pilot.

### 16.2 Reports

```text
reports
report_locations
report_media
report_status_events
report_relationships              # support/follow + notification level
report_assignments
report_internal_notes
report_duplicate_links
report_drafts                     # verified users only, TTL
report_information_requests
```

### 16.3 Moderation/safety

```text
moderation_cases
moderation_signals
moderation_actions
privacy_redactions
manual_review_requests
```

`manual_review_requests` is a minimal support workflow, not a full appeals system.

### 16.4 Delivery/operations

```text
integration_endpoints             # one active pilot destination
integration_deliveries
action_outbox
notification_preferences
audit_events
idempotency_keys
```

### 16.5 Important constraints

- Exact `geography(Point,4326)` plus GIST index.
- Separately stored public representation and policy/version used.
- Append-only report events; current state cached and transition-guarded.
- Media and report state remain separate.
- Boundary/routing/category version used at submission is retained.
- Public views exclude contact, exact restricted location, raw storage paths,
  signals, internal notes, and unsafe media.
- Retention/deletion defines anonymization and masking where append-only audit or
  legal hold prevents physical deletion.
- Store policy/consent version, publication scope, actor type, public message,
  private reason, and content publication state.

---

## 17. Security and privacy baseline

- RLS on every user/organization/report/media table before feature completion.
- Deny-by-default; pgTAP asserts forbidden and allowed access.
- Admin/platform session validation server-side; UI hiding is secondary.
- MFA required for org/platform administrators; re-auth for sensitive access.
- Signed uploads short-lived, one file, one verified draft/report, size/type bound.
- Service-role credential only in protected function/worker environments.
- Strict content security policy and media origins.
- Rate limits combine session/email/idempotency with calibrated IP signals;
  shared carrier/NAT users must not be unfairly blocked.
- Bot challenge is last resort, accessible, and has a false-block support path.
- Generic notification subjects avoid lock-screen/shared-inbox leaks.
- Functional auth cookies are disclosed; non-essential analytics/consent follows
  pilot-jurisdiction law.
- No training on submissions without explicit lawful policy and consent.
- Threat model covers object access, privilege escalation, malicious files,
  stored XSS, SSRF, location privacy, reviewer exposure, delivery spoofing, and
  notification abuse.

---

## 18. Testing and real-surface verification

### 18.1 Unit/domain

- Status and close-reason transitions.
- Actor/preset authorization.
- Public-location policy.
- Duplicate candidate inputs.
- Deterministic title.
- Idempotency/retry decisions.

Use Vitest for pure TypeScript logic.

### 18.2 Database/RLS

Use local Supabase and pgTAP for:

- Public/citizen boundaries.
- Cross-organization denial even though pilot has one org.
- Operator versus moderator versus org admin fields/actions.
- Exact/public location.
- Original/processed media.
- Staff RPC claim/state/version checks.
- Atomic submission/status/moderation/delivery transitions.

### 18.3 Component/accessibility

- Labels/errors/error summaries.
- Autocomplete and OTP keyboard behavior.
- Drawer/dialog focus.
- Status icon/text.
- 44px product targets and loading semantics.
- Forced colors, reduced motion, reflow, Turkish wrapping.
- axe plus manual review.

### 18.4 Stateful Playwright journeys

1. Text-only report: location → duplicates → details → OTP → review → submit.
2. OTP expired/resend/change-email/provider delay without lost draft.
3. Permission denied/geocoder failure/non-map completion.
4. Temporary network loss, refresh, and idempotent retry without duplicate.
5. Duplicate support is private, reversible, and notification choice respected.
6. Safe one-image path publishes only processed derivative.
7. Disallowed fixture never appears in public HTML, map, email, social metadata,
   default admin list, or cacheable URL.
8. Ambiguous media uses staged review; routine user cannot reveal it.
9. Operator triage and stale concurrent update.
10. Moderator and org administrator cannot cross each other's sensitive fields.
11. Platform administrator sees redacted defaults.
12. `Needs information` private citizen response and org status update.
13. Home/private-location policy across page/API/map/index/notification.
14. Keyboard/screen-reader non-map reporting.
15. Moderation/email/delivery provider outage recovery.

Use synthetic/non-graphic fixtures only.

### 18.5 Visual and performance

Capture home, list/map, each report step, public detail, citizen dashboard, triage,
moderation, org admin, and platform health at narrow/wide viewports.

Define and measure:

- Mobile JS and map-load budgets.
- First usable list before optional map.
- Image compression/upload behavior on throttled network.
- No layout-shifting button/error states.
- Supported browser/device matrix including Safari camera/HEIC decision.

### 18.6 Staging acceptance

Verify with staging Supabase, real map/geocoder, real email sandbox plus production
deliverability checks, moderation test mode, private Storage, one pilot delivery
channel, and every role. Unit tests alone are not comprehensive verification.

---

## 19. Delivery phases and hard gates

Implementation remains unapproved.

### Phase 0 — Pilot, provider, staffing, and legal decisions

**Deliverables**

- Pilot jurisdiction, organization, owner inbox, boundary data, and categories.
- Emergency exclusions and correct alternate channels.
- One delivery and acknowledgment mechanism.
- Geocoder/map provider with real pilot address-quality acceptance.
- Email provider, SPF/DKIM/DMARC, bounce/delivery monitoring, OTP recovery.
- Moderation provider DPA/region/retention/no-training/cost/latency.
- Human reviewer owner, hours, training, wellness, queue SLA, fallback.
- Legal/privacy owner and approved content, retention, illegal-content runbook.
- Location-publication matrix for every category/surface.
- Monthly cost ceiling and pessimistic per-report cost.
- Supported browsers/languages and cookie/consent approach.

**Hard exit gate**

One text report can be described from citizen entry to truthful organization
response. Public media remains disabled unless the full Section 10 gate is
signed by product, safety, privacy, operations, and jurisdiction legal owner.

### Phase 1 — Repository and design foundation

**Likely files**

```text
package.json
pnpm-workspace.yaml
apps/web/*
packages/design-tokens/*
docs/decisions/0001-web-mobile-separation.md
docs/product/pilot-scope.md
docs/product/content-policy.md
docs/design/foundations.md
```

**Work**

- Scaffold Next.js only after approval.
- Build grayscale hierarchy, then approved tokens.
- Create public/staff/platform shells and representative states.
- Configure lint/type/unit/component/Playwright/accessibility checks.
- Record architecture and visibility decisions.

**Exit:** representative mobile/desktop screens include loading, empty, error,
permission, offline/stale, and recovery states and pass first keyboard/axe review.

### Phase 2 — Supabase schema, Auth, RLS, and contracts

**Likely files**

```text
supabase/config.toml
supabase/migrations/*.sql
supabase/tests/*.sql
packages/contracts/src/*
packages/domain/src/*
packages/database-types/src/database.ts
```

**Work**

- PostGIS and pilot schema.
- Email OTP web auth.
- Deny-by-default RLS and atomic RPC transitions.
- Exact/public location and visibility policy.
- Generated database types.

**Exit:** role/field/organization isolation and OTP/draft contract proven locally.

### Phase 3 — Text-first public reporting

**Likely files**

```text
apps/web/app/(public)/*
apps/web/app/report/new/*
apps/web/components/location/*
apps/web/components/map/*
apps/web/components/report-flow/*
packages/data-access/src/reports/*
```

**Work**

- Address/location and non-map path.
- Low-bandwidth list/map browse.
- Duplicate support/follow.
- Local drafts and OTP recovery.
- Text moderation/publication gate.
- Atomic submit, public detail, truthful timeline.

**Exit:** text-only stateful journey works on mobile/desktop/keyboard/screen reader
and under retry/refresh/provider failure without duplicate or privacy leak.

### Phase 4 — Optional single-image safety

**Likely files**

```text
supabase/functions/process-media/*
supabase/functions/moderate-content/*
apps/web/app/(staff)/admin/moderation/*
packages/contracts/src/moderation.ts
packages/domain/src/moderation.ts
```

**Work**

- Quarantine, technical validation, metadata stripping, re-encoding.
- Provider moderation and one-image cost/latency monitoring.
- Metadata-first reviewer queue, staged reveal, restricted escalation.
- Replacement/text-only continuation.

**Exit:** Section 10 gates signed; unsafe fixture never public; safe derivative
only; ambiguous/legal/reviewer safety paths tested. Otherwise media stays off.

### Phase 5 — Operator, moderator, and org administration

**Likely files**

```text
apps/web/app/(staff)/admin/*
packages/domain/src/report-transitions.ts
packages/data-access/src/admin/*
```

**Work**

- Queue contract, report workspace, assignments, duplicate/status/info flow.
- Separate moderation and org-admin access.
- Fixed staff presets, category/boundary preview, one destination, audit.

**Exit:** each preset completes its work and fails cross-scope sensitive access.

### Phase 6 — Delivery, notifications, and minimal platform backstop

**Likely files**

```text
apps/web/app/(platform)/platform/*
supabase/functions/process-outbox/*
supabase/functions/deliver-report/*
packages/domain/src/delivery.ts
```

**Work**

- Durable outbox, one delivery channel, bounded retries, staff retry list.
- OTP/status email deliverability and privacy.
- Redacted platform health/audit/incident metadata.

**Exit:** success, timeout, idempotent retry, no acknowledgment, and permanent
failure never create a false public status.

### Phase 7 — Launch hardening

- Legal/media gate status.
- Threat model/security review.
- RLS regression.
- Manual accessibility and screen-reader audit.
- Moderation/legal/reviewer tabletop exercise.
- Backup/restore rehearsal.
- Provider outage drill.
- Staging E2E across roles and realistic devices.
- Support, privacy, verification, and pending-report runbooks.

**Hard exit:** named owners sign pilot launch with known gaps. No photo feature if
its gate remains incomplete.

---

## 20. Success metrics

Avoid raw content in analytics.

- Median/p90 text-only form time and step drop-off.
- OTP delivery, resend, and verification drop-off.
- Duplicate deflection:
  `avoided new reports / (created reports + avoided new reports)`.
- Routing accuracy without manual reassignment.
- Moderation auto-clear/hold/reject and queue age if photo is enabled.
- Delivery success/retry/failure and time to acknowledgment.
- Median time from acknowledgment to first public organization status event.
- Status-event-to-public-display latency.
- Location/privacy concern rate.
- Appeal/manual-review overturn rate.
- Accessibility usability-test completion.
- Mobile-web versus desktop completion.
- Cost per accepted report and monthly ceiling usage.

Do not optimize for raw report volume.

---

## 21. Decisions still required from the user/pilot

1. Pilot country/city/jurisdiction.
2. Product/brand name.
3. Citizen public service versus organization-paid SaaS direction.
4. Pilot organization and acknowledgment process.
5. Email OTP/account model and public pseudonym policy.
6. Category/location-publication matrix and private-report option.
7. Initial categories and emergency exclusions.
8. Delivery method.
9. Moderation provider, reviewer owner, legal owner, retention, and escalation.
10. Map/geocoder provider and budget.
11. Pilot languages.
12. Whether optional photo launches with the text pilot or remains disabled until
    a later controlled release.

### Current recommendations

- One jurisdiction and one organization.
- Verified private identity, optional pseudonymous public display.
- Email OTP in the same browser; local draft before verification.
- Exact location private; public representation determined by category/context.
- Staff-authored public timeline; citizen public updates deferred.
- One delivery channel and manual acknowledgment if no API exists.
- Single optional photo only after safety gates; otherwise text-first launch.
- Next.js public/citizen/staff/minimal-platform route groups in one deployment.

---

## 22. Independent review reconciliation

### 22.1 DeepSeek V4 Flash / OpenCode round 1

**Session:** `ses_038a6b154ffePBnzAJYnvPa5gN`  
**Model:** `opencode-go/deepseek-v4-flash`  
**Finding:** architecture/safety skeleton strong; launch risk 7/10 because scope
was multi-tenant-platform-sized and moderation/auth/provider operations were
unowned.

### 22.2 Luna xhigh round 1

**Model:** `gpt-5.6-luna`, delegation reasoning `xhigh`  
**Score:** 63/100  
**Finding:** strong product foundations, but illegal-content gate, location
privacy, role contradiction, moderator exposure, status semantics, recovery
states, queue behavior, and screen-level contracts were not implementation-ready.

### 22.3 Accepted changes

- One pilot organization/delivery channel/queue.
- Text-first launch and maximum one gated photo.
- Public citizen updates deferred.
- Fixed role presets rather than dynamic capability tables/UI.
- Operator, moderator, org admin, platform admin, and legal escalation separated.
- Minimal superadmin retained because the product requires an operational
  backstop, but no global data explorer/multi-org platform.
- Email OTP and local draft handshake made concrete.
- Provider, staffing, cost, legal, location, and deliverability decisions promoted
  to hard Phase 0 gates.
- Exact/public location matrix covers every surface.
- Metadata-first staged moderation reveal and reviewer welfare contract.
- Small actor-qualified public status model plus separate close/delivery states.
- Screen loading/error/offline/stale/recovery inventory.
- Map/list and non-map semantic behavior expanded.
- Service role restricted to protected functions/workers.
- Email deliverability, geocoder quality, and monthly cost gates.
- WCAG wording corrected and responsive typography/sticky-safe-area behavior
  specified.

### 22.4 Reconciled rather than copied blindly

- **Superadmin:** not removed entirely. User explicitly wants it; retained as a
  narrow redacted health/audit/incident backstop.
- **Capabilities:** no dynamic matrix table in MVP, but RLS/RPC still enforce
  field/action boundaries derived from fixed presets.
- **Photos:** not permanently removed. Feature stays disabled until the complete
  legal/moderation/operations gate passes; then one-image pilot.
- **Second moderation provider:** not added. Outage fails closed and uses
  text-only/manual fallback to avoid premature vendor redundancy.
- **Sensitive review:** two-person review is a policy requirement only for
  severe/legal cases, not every ambiguous photo.
- **Account privacy rights:** full self-service UI deferred, but lawful manual
  export/deletion/privacy support is not deferred.

---

## 23. Definition of plan-ready

The plan is ready for user product decisions when:

- Scope is one realistic pilot.
- Next.js/Expo/backend boundaries are explicit.
- Roles and sensitive fields are separated.
- Text/photo/derived content cannot publish before its visibility gate.
- Nude/graphic/illegal content and reviewer safety fail closed with named owners.
- Public status cannot overstate institutional progress.
- Exact location has a category/context publication policy on every surface.
- Reporting, OTP, weak connection, map failure, upload failure, and retry recovery
  are concrete.
- Public, citizen, operator, moderator, admin, and platform screen contracts are
  concrete.
- Design specifies palette, hierarchy, typography, spacing, map/list behavior,
  button placement, safe areas, and responsive/accessibility states.
- Database/RLS design supports a future Expo client without Next.js-only rules.
- DeepSeek and Luna findings are reconciled with rationale.
- Implementation has not silently begun.
