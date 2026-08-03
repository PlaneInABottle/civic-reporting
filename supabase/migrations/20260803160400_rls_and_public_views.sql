create function public.has_org_preset(
  target_organization_id uuid,
  required_preset public.membership_preset
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.organization_memberships membership
    where membership.organization_id = target_organization_id
      and membership.user_id = auth.uid()
      and membership.preset = required_preset
      and membership.is_active
  );
$$;

create function public.has_platform_preset(required_preset public.platform_preset)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.platform_memberships membership
    where membership.user_id = auth.uid()
      and membership.preset = required_preset
      and membership.is_active
      and (membership.expires_at is null or membership.expires_at > statement_timestamp())
  );
$$;

create function public.current_aal()
returns text
language sql
stable
set search_path = ''
as $$
  select coalesce(auth.jwt() ->> 'aal', 'aal1');
$$;

create function public.is_verified_user()
returns boolean
language sql
stable
set search_path = ''
as $$
  select auth.uid() is not null
    and coalesce((auth.jwt() ->> 'is_anonymous')::boolean, false) = false
    and nullif(auth.jwt() ->> 'email', '') is not null;
$$;

create function public.is_report_owner(target_report_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.reporter_identities identity
    where identity.report_id = target_report_id
      and identity.reporter_user_id = auth.uid()
  );
$$;

revoke all on function public.has_org_preset(uuid, public.membership_preset) from public, anon;
revoke all on function public.has_platform_preset(public.platform_preset) from public, anon;
revoke all on function public.current_aal() from public, anon;
revoke all on function public.is_verified_user() from public, anon;
revoke all on function public.is_report_owner(uuid) from public, anon;
grant execute on function public.has_org_preset(uuid, public.membership_preset) to authenticated;
grant execute on function public.has_platform_preset(public.platform_preset) to authenticated;
grant execute on function public.current_aal() to authenticated;
grant execute on function public.is_verified_user() to authenticated;
grant execute on function public.is_report_owner(uuid) to authenticated;

alter table public.organizations enable row level security;
alter table public.jurisdictions enable row level security;
alter table public.jurisdiction_versions enable row level security;
alter table public.categories enable row level security;
alter table public.organization_categories enable row level security;
alter table public.profiles enable row level security;
alter table public.organization_memberships enable row level security;
alter table public.platform_memberships enable row level security;
alter table public.report_drafts enable row level security;
alter table public.reports enable row level security;
alter table public.reporter_identities enable row level security;
alter table public.report_exact_locations enable row level security;
alter table public.report_public_locations enable row level security;
alter table public.report_status_events enable row level security;
alter table public.report_relationships enable row level security;
alter table public.report_assignments enable row level security;
alter table public.report_internal_notes enable row level security;
alter table public.report_information_requests enable row level security;
alter table public.report_duplicate_links enable row level security;
alter table public.moderation_cases enable row level security;
alter table public.moderation_signals enable row level security;
alter table public.moderation_actions enable row level security;
alter table public.integration_endpoints enable row level security;
alter table public.integration_deliveries enable row level security;
alter table public.audit_events enable row level security;
alter table public.idempotency_keys enable row level security;
alter table public.legal_access_grants enable row level security;

grant select on public.organizations, public.jurisdictions, public.jurisdiction_versions,
  public.categories, public.organization_categories to anon, authenticated;
grant select on public.profiles, public.organization_memberships, public.platform_memberships,
  public.report_drafts, public.reports, public.reporter_identities,
  public.report_exact_locations, public.report_public_locations,
  public.report_status_events, public.report_relationships, public.report_assignments,
  public.report_internal_notes, public.report_information_requests,
  public.report_duplicate_links, public.moderation_cases, public.moderation_signals,
  public.moderation_actions, public.integration_endpoints,
  public.integration_deliveries, public.audit_events to authenticated;

create policy organizations_public_pilot_read
on public.organizations for select to anon, authenticated
using (is_pilot and not is_test_fixture);

create policy jurisdictions_public_pilot_read
on public.jurisdictions for select to anon, authenticated
using (
  is_synthetic
  and exists (
    select 1 from public.organizations organization
    where organization.id = jurisdictions.organization_id
      and organization.is_pilot
      and not organization.is_test_fixture
  )
);

create policy jurisdiction_versions_public_active_read
on public.jurisdiction_versions for select to anon, authenticated
using (
  active_from <= statement_timestamp()
  and (retired_at is null or retired_at > statement_timestamp())
  and exists (
    select 1
    from public.jurisdictions jurisdiction
    join public.organizations organization on organization.id = jurisdiction.organization_id
    where jurisdiction.id = jurisdiction_versions.jurisdiction_id
      and jurisdiction.is_synthetic
      and organization.is_pilot
      and not organization.is_test_fixture
  )
);

create policy categories_active_read
on public.categories for select to anon, authenticated
using (is_active);

create policy organization_categories_public_pilot_read
on public.organization_categories for select to anon, authenticated
using (
  is_active
  and exists (
    select 1 from public.organizations organization
    where organization.id = organization_categories.organization_id
      and organization.is_pilot
      and not organization.is_test_fixture
  )
);

create policy profiles_self_read
on public.profiles for select to authenticated
using (user_id = (select auth.uid()));

create policy organization_memberships_self_or_admin_read
on public.organization_memberships for select to authenticated
using (
  user_id = (select auth.uid())
  or (
    public.has_org_preset(organization_id, 'organization_admin')
    and public.current_aal() = 'aal2'
  )
);

create policy platform_memberships_self_read
on public.platform_memberships for select to authenticated
using (user_id = (select auth.uid()));

create policy report_drafts_owner_read
on public.report_drafts for select to authenticated
using (user_id = (select auth.uid()) and expires_at > statement_timestamp());

create policy reports_owner_or_scoped_staff_read
on public.reports for select to authenticated
using (
  public.is_report_owner(id)
  or public.has_org_preset(organization_id, 'operator')
  or public.has_org_preset(organization_id, 'moderator')
);

create policy reporter_identities_owner_or_operator_read
on public.reporter_identities for select to authenticated
using (
  reporter_user_id = (select auth.uid())
  or exists (
    select 1 from public.reports report
    where report.id = reporter_identities.report_id
      and public.has_org_preset(report.organization_id, 'operator')
  )
);

create policy report_exact_locations_owner_or_operator_read
on public.report_exact_locations for select to authenticated
using (
  public.is_report_owner(report_id)
  or exists (
    select 1 from public.reports report
    where report.id = report_exact_locations.report_id
      and public.has_org_preset(report.organization_id, 'operator')
  )
);

create policy report_public_locations_owner_or_scoped_staff_read
on public.report_public_locations for select to authenticated
using (
  public.is_report_owner(report_id)
  or exists (
    select 1 from public.reports report
    where report.id = report_public_locations.report_id
      and (
        public.has_org_preset(report.organization_id, 'operator')
        or public.has_org_preset(report.organization_id, 'moderator')
      )
  )
);

create policy report_status_events_operator_read
on public.report_status_events for select to authenticated
using (public.has_org_preset(organization_id, 'operator'));

create policy report_status_events_owner_safe_read
on public.report_status_events for select to authenticated
using (
  visibility in ('public', 'reporter')
  and public.is_report_owner(report_id)
);

create policy report_relationships_owner_read
on public.report_relationships for select to authenticated
using (user_id = (select auth.uid()));

create policy report_assignments_operator_read
on public.report_assignments for select to authenticated
using (public.has_org_preset(organization_id, 'operator'));

create policy report_internal_notes_operator_read
on public.report_internal_notes for select to authenticated
using (public.has_org_preset(organization_id, 'operator'));

create policy report_information_requests_owner_or_operator_read
on public.report_information_requests for select to authenticated
using (
  public.is_report_owner(report_id)
  or public.has_org_preset(organization_id, 'operator')
);

create policy report_duplicate_links_owner_or_operator_read
on public.report_duplicate_links for select to authenticated
using (
  public.is_report_owner(report_id)
  or exists (
    select 1 from public.reports report
    where report.id = report_duplicate_links.report_id
      and public.has_org_preset(report.organization_id, 'operator')
  )
);

create policy moderation_cases_moderator_read
on public.moderation_cases for select to authenticated
using (public.has_org_preset(organization_id, 'moderator'));

create policy moderation_signals_moderator_read
on public.moderation_signals for select to authenticated
using (
  exists (
    select 1 from public.moderation_cases moderation_case
    where moderation_case.id = moderation_signals.moderation_case_id
      and public.has_org_preset(moderation_case.organization_id, 'moderator')
  )
);

create policy moderation_actions_moderator_read
on public.moderation_actions for select to authenticated
using (
  exists (
    select 1 from public.moderation_cases moderation_case
    where moderation_case.id = moderation_actions.moderation_case_id
      and public.has_org_preset(moderation_case.organization_id, 'moderator')
  )
);

create policy integration_endpoints_operator_or_admin_read
on public.integration_endpoints for select to authenticated
using (
  public.has_org_preset(organization_id, 'operator')
  or (
    public.has_org_preset(organization_id, 'organization_admin')
    and public.current_aal() = 'aal2'
  )
);

create policy integration_deliveries_operator_or_admin_read
on public.integration_deliveries for select to authenticated
using (
  public.has_org_preset(organization_id, 'operator')
  or (
    public.has_org_preset(organization_id, 'organization_admin')
    and public.current_aal() = 'aal2'
  )
);

create policy audit_events_organization_admin_read
on public.audit_events for select to authenticated
using (
  public.has_org_preset(organization_id, 'organization_admin')
  and public.current_aal() = 'aal2'
);

create view public.public_reports
with (security_barrier = true)
as
select
  report.public_id,
  report.public_title as title,
  report.public_description as description,
  report.status,
  report.close_reason,
  location.public_label,
  location.precision as public_location_precision,
  case
    when location.public_location is null then null
    else extensions.st_y(location.public_location::extensions.geometry)
  end as public_latitude,
  case
    when location.public_location is null then null
    else extensions.st_x(location.public_location::extensions.geometry)
  end as public_longitude,
  report.accepted_at,
  report.updated_at
from public.reports report
join public.report_public_locations location on location.report_id = report.id
where report.publication_state = 'published';

create view public.public_report_events
with (security_barrier = true)
as
select
  report.public_id,
  event.public_label,
  event.new_status,
  event.created_at
from public.report_status_events event
join public.reports report on report.id = event.report_id
where report.publication_state = 'published'
  and event.visibility = 'public';

revoke all on public.public_reports, public.public_report_events from public;
grant select on public.public_reports, public.public_report_events to anon, authenticated;
