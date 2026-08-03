create table public.moderation_cases (
  id uuid primary key default extensions.gen_random_uuid(),
  report_id uuid not null unique references public.reports(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete restrict,
  state public.moderation_state not null default 'pending',
  version integer not null default 1 check (version > 0),
  assigned_moderator_id uuid references auth.users(id) on delete set null,
  decision_summary text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index moderation_cases_queue_idx on public.moderation_cases (organization_id, state, created_at);

create trigger moderation_cases_set_updated_at
before update on public.moderation_cases
for each row execute function public.set_updated_at();

create table public.moderation_signals (
  id uuid primary key default extensions.gen_random_uuid(),
  moderation_case_id uuid not null references public.moderation_cases(id) on delete cascade,
  signal_kind text not null,
  signal_code text not null,
  confidence numeric(5,4) check (confidence is null or confidence between 0 and 1),
  created_at timestamptz not null default now()
);

create table public.moderation_actions (
  id uuid primary key default extensions.gen_random_uuid(),
  moderation_case_id uuid not null references public.moderation_cases(id) on delete cascade,
  actor_id uuid not null references auth.users(id) on delete restrict,
  previous_state public.moderation_state not null,
  new_state public.moderation_state not null,
  reason text not null,
  correlation_id uuid not null,
  created_at timestamptz not null default now()
);

create table public.integration_endpoints (
  id uuid primary key default extensions.gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  destination_kind text not null check (destination_kind in ('local_fake', 'email', 'api')),
  redacted_destination_label text not null,
  configuration_state text not null check (configuration_state in ('disabled', 'test_only', 'configured')),
  is_active boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index integration_endpoints_one_active_idx
  on public.integration_endpoints (organization_id)
  where is_active;

create trigger integration_endpoints_set_updated_at
before update on public.integration_endpoints
for each row execute function public.set_updated_at();

create table public.integration_deliveries (
  id uuid primary key default extensions.gen_random_uuid(),
  report_id uuid not null references public.reports(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete restrict,
  endpoint_id uuid not null references public.integration_endpoints(id) on delete restrict,
  state public.delivery_state not null default 'queued',
  version integer not null default 1 check (version > 0),
  attempt_count integer not null default 0 check (attempt_count >= 0),
  last_error_code text,
  next_attempt_at timestamptz,
  correlation_id uuid not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index integration_deliveries_queue_idx
  on public.integration_deliveries (organization_id, state, next_attempt_at);

create trigger integration_deliveries_set_updated_at
before update on public.integration_deliveries
for each row execute function public.set_updated_at();

create table public.audit_events (
  id uuid primary key default extensions.gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete restrict,
  actor_type public.actor_type not null,
  actor_id uuid,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  summary text not null,
  correlation_id uuid not null,
  created_at timestamptz not null default now()
);

create index audit_events_organization_idx on public.audit_events (organization_id, created_at desc);
create index audit_events_correlation_idx on public.audit_events (correlation_id);

create table public.idempotency_keys (
  id uuid primary key default extensions.gen_random_uuid(),
  actor_id uuid,
  organization_id uuid references public.organizations(id) on delete cascade,
  operation text not null,
  idempotency_key uuid not null,
  request_hash text not null,
  result_entity_id uuid,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '24 hours'),
  unique nulls not distinct (actor_id, organization_id, operation, idempotency_key),
  check (expires_at > created_at)
);

create table public.legal_access_grants (
  id uuid primary key default extensions.gen_random_uuid(),
  moderation_case_id uuid not null references public.moderation_cases(id) on delete cascade,
  grantee_user_id uuid not null references auth.users(id) on delete cascade,
  approved_by_user_id uuid not null references auth.users(id) on delete restrict,
  reason text not null,
  expires_at timestamptz not null,
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  check (expires_at > created_at),
  check (revoked_at is null or revoked_at >= created_at)
);

create function public.reject_append_only_change()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  raise exception using errcode = '42501', message = tg_table_name || ' is append-only';
end;
$$;

create trigger report_status_events_append_only
before update or delete on public.report_status_events
for each row execute function public.reject_append_only_change();

create trigger moderation_actions_append_only
before update or delete on public.moderation_actions
for each row execute function public.reject_append_only_change();

create trigger audit_events_append_only
before update or delete on public.audit_events
for each row execute function public.reject_append_only_change();

revoke all on function public.reject_append_only_change() from public, anon, authenticated;
