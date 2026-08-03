create table public.report_drafts (
  id uuid primary key default extensions.gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete restrict,
  jurisdiction_id uuid not null references public.jurisdictions(id) on delete restrict,
  organization_category_id uuid references public.organization_categories(id) on delete restrict,
  description text not null check (char_length(description) between 10 and 4000),
  exact_location extensions.geography(Point, 4326) not null,
  exact_address text,
  public_location extensions.geography(Point, 4326),
  public_label text not null check (char_length(public_label) between 2 and 160),
  public_location_precision public.location_precision not null,
  publication_policy_version integer not null check (publication_policy_version > 0),
  version integer not null default 1 check (version > 0),
  expires_at timestamptz not null default (now() + interval '30 days'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (expires_at > created_at)
);

create index report_drafts_user_idx on public.report_drafts (user_id, updated_at desc);
create index report_drafts_exact_location_idx on public.report_drafts using gist (exact_location);

create trigger report_drafts_set_updated_at
before update on public.report_drafts
for each row execute function public.set_updated_at();

create table public.reports (
  id uuid primary key default extensions.gen_random_uuid(),
  public_id text not null unique default public.generate_public_report_id(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  jurisdiction_id uuid not null references public.jurisdictions(id) on delete restrict,
  jurisdiction_version_id uuid not null references public.jurisdiction_versions(id) on delete restrict,
  organization_category_id uuid not null references public.organization_categories(id) on delete restrict,
  source_draft_id uuid unique references public.report_drafts(id) on delete set null,
  description text not null check (char_length(description) between 10 and 4000),
  public_title text,
  public_description text,
  status public.report_status not null default 'submitted',
  close_reason public.report_close_reason,
  publication_state public.publication_state not null default 'pending',
  status_version integer not null default 1 check (status_version > 0),
  accepted_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((status = 'closed' and close_reason is not null) or (status <> 'closed' and close_reason is null)),
  check (
    publication_state <> 'published'
    or (public_title is not null and public_description is not null)
  )
);

create index reports_organization_status_idx on public.reports (organization_id, status, accepted_at desc);
create index reports_publication_idx on public.reports (publication_state, accepted_at desc);

create trigger reports_set_updated_at
before update on public.reports
for each row execute function public.set_updated_at();

create table public.reporter_identities (
  report_id uuid primary key references public.reports(id) on delete cascade,
  reporter_user_id uuid not null references auth.users(id) on delete restrict,
  contact_email text not null,
  verified_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index reporter_identities_user_idx on public.reporter_identities (reporter_user_id);

create table public.report_exact_locations (
  report_id uuid primary key references public.reports(id) on delete cascade,
  exact_location extensions.geography(Point, 4326) not null,
  exact_address text,
  captured_at timestamptz not null default now()
);

create index report_exact_locations_point_idx
  on public.report_exact_locations using gist (exact_location);

create table public.report_public_locations (
  report_id uuid primary key references public.reports(id) on delete cascade,
  public_location extensions.geography(Point, 4326),
  public_label text not null,
  precision public.location_precision not null,
  policy_version integer not null check (policy_version > 0),
  created_at timestamptz not null default now(),
  check ((precision = 'withheld' and public_location is null) or precision <> 'withheld')
);

create index report_public_locations_point_idx
  on public.report_public_locations using gist (public_location);

create table public.report_status_events (
  id uuid primary key default extensions.gen_random_uuid(),
  report_id uuid not null references public.reports(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete restrict,
  actor_type public.actor_type not null,
  actor_id uuid,
  source text not null check (source in ('web', 'staff', 'integration', 'system')),
  previous_status public.report_status,
  new_status public.report_status not null,
  public_label text not null,
  private_reason text,
  visibility public.event_visibility not null,
  correlation_id uuid not null,
  created_at timestamptz not null default now()
);

create index report_status_events_report_idx on public.report_status_events (report_id, created_at);

create table public.report_relationships (
  id uuid primary key default extensions.gen_random_uuid(),
  report_id uuid not null references public.reports(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  kind public.relationship_kind not null,
  notification_level public.notification_level not null default 'none',
  created_at timestamptz not null default now(),
  unique (report_id, user_id, kind)
);

create table public.report_assignments (
  id uuid primary key default extensions.gen_random_uuid(),
  report_id uuid not null references public.reports(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  assignee_user_id uuid not null references auth.users(id) on delete restrict,
  assigned_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  ended_at timestamptz,
  check (ended_at is null or ended_at >= created_at)
);

create table public.report_internal_notes (
  id uuid primary key default extensions.gen_random_uuid(),
  report_id uuid not null references public.reports(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  author_user_id uuid not null references auth.users(id) on delete restrict,
  body text not null check (char_length(body) between 1 and 4000),
  created_at timestamptz not null default now()
);

create table public.report_information_requests (
  id uuid primary key default extensions.gen_random_uuid(),
  report_id uuid not null references public.reports(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  requested_by uuid not null references auth.users(id) on delete restrict,
  private_prompt text not null,
  private_response text,
  responded_at timestamptz,
  created_at timestamptz not null default now(),
  check ((private_response is null and responded_at is null) or (private_response is not null and responded_at is not null))
);

create table public.report_duplicate_links (
  id uuid primary key default extensions.gen_random_uuid(),
  report_id uuid not null references public.reports(id) on delete cascade,
  canonical_report_id uuid not null references public.reports(id) on delete restrict,
  linked_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  unique (report_id, canonical_report_id),
  check (report_id <> canonical_report_id)
);
