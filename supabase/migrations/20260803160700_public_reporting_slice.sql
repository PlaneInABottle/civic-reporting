alter table public.moderation_cases
  add column provider_attempt_count integer not null default 0
    check (provider_attempt_count >= 0),
  add column last_provider_code text,
  add column last_provider_at timestamptz;

create function public.find_duplicate_candidates(
  public_longitude double precision,
  public_latitude double precision,
  target_organization_category_id uuid,
  result_limit integer default 5
)
returns table (
  public_id text,
  title text,
  public_label text,
  category_name text,
  approximate_distance_meters integer,
  status public.report_status,
  accepted_at timestamptz,
  why_suggested text
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  search_point extensions.geography(Point, 4326);
begin
  if public_longitude not between -180 and 180
    or public_latitude not between -90 and 90 then
    raise exception using errcode = '22023', message = 'invalid_public_location';
  end if;
  if result_limit not between 1 and 20 then
    raise exception using errcode = '22023', message = 'invalid_result_limit';
  end if;

  search_point := extensions.st_setsrid(
    extensions.st_makepoint(public_longitude, public_latitude),
    4326
  )::extensions.geography;

  return query
  select
    report.public_id,
    report.public_title,
    location.public_label,
    category.name,
    round(extensions.st_distance(location.public_location, search_point))::integer,
    report.status,
    report.accepted_at,
    case
      when report.organization_category_id = target_organization_category_id
        then 'Nearby public report in the same category.'
      else 'Nearby public report with a similar location.'
    end
  from public.reports report
  join public.report_public_locations location on location.report_id = report.id
  join public.organization_categories configured
    on configured.id = report.organization_category_id
  join public.categories category on category.id = configured.category_id
  where report.publication_state = 'published'
    and location.public_location is not null
    and report.status not in ('resolved', 'closed')
    and extensions.st_dwithin(location.public_location, search_point, 5000)
  order by
    (report.organization_category_id = target_organization_category_id) desc,
    extensions.st_distance(location.public_location, search_point),
    report.accepted_at desc
  limit result_limit;
end;
$$;

create function public.submit_verified_report(
  target_draft_id uuid,
  expected_version integer,
  request_idempotency_key uuid,
  request_correlation_id uuid
)
returns table (
  report_id uuid,
  public_id text,
  report_status public.report_status,
  publication_state public.publication_state,
  moderation_case_id uuid,
  moderation_text text
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller_id uuid := auth.uid();
  caller_email text := nullif(lower(btrim(auth.jwt() ->> 'email')), '');
  target_draft public.report_drafts%rowtype;
  active_version_id uuid;
  existing_key public.idempotency_keys%rowtype;
  existing_report record;
  created_report public.reports%rowtype;
  created_case public.moderation_cases%rowtype;
  request_hash text;
begin
  if not public.is_verified_user() or caller_email is null then
    raise exception using errcode = '42501', message = 'verified_identity_required';
  end if;
  if target_draft_id is null or request_idempotency_key is null
    or request_correlation_id is null then
    raise exception using errcode = '22023', message = 'request_identifiers_required';
  end if;

  select * into target_draft
  from public.report_drafts draft
  where draft.id = target_draft_id
    and draft.user_id = caller_id
    and draft.expires_at > statement_timestamp()
  for update;
  if not found then
    raise exception using errcode = 'P0001', message = 'draft_not_found';
  end if;

  request_hash := public.request_fingerprint(array[
    target_draft_id::text,
    expected_version::text
  ]);
  select * into existing_key
  from public.idempotency_keys key
  where key.actor_id = caller_id
    and key.organization_id = target_draft.organization_id
    and key.operation = 'submit_verified_report'
    and key.idempotency_key = request_idempotency_key;
  if found then
    if existing_key.request_hash <> request_hash then
      raise exception using errcode = 'P0001', message = 'idempotency_conflict';
    end if;
    select
      report.id,
      report.public_id,
      report.status,
      report.publication_state,
      moderation_case.id as moderation_case_id,
      report.description as moderation_text
    into existing_report
    from public.reports report
    join public.moderation_cases moderation_case
      on moderation_case.report_id = report.id
    where report.id = existing_key.result_entity_id;
    if not found then
      raise exception using errcode = 'P0001', message = 'idempotency_result_missing';
    end if;
    return query select
      existing_report.id,
      existing_report.public_id,
      existing_report.status,
      existing_report.publication_state,
      existing_report.moderation_case_id,
      existing_report.moderation_text;
    return;
  end if;

  select
    report.id,
    report.public_id,
    report.status,
    report.publication_state,
    moderation_case.id as moderation_case_id,
    report.description as moderation_text
  into existing_report
  from public.reports report
  join public.reporter_identities identity on identity.report_id = report.id
  join public.moderation_cases moderation_case on moderation_case.report_id = report.id
  where report.source_draft_id = target_draft.id
    and identity.reporter_user_id = caller_id;
  if found then
    insert into public.idempotency_keys (
      actor_id, organization_id, operation, idempotency_key, request_hash,
      result_entity_id, result_payload
    ) values (
      caller_id, target_draft.organization_id, 'submit_verified_report',
      request_idempotency_key, request_hash, existing_report.id,
      jsonb_build_object(
        'public_id', existing_report.public_id,
        'report_status', existing_report.status,
        'publication_state', existing_report.publication_state,
        'moderation_case_id', existing_report.moderation_case_id,
        'moderation_text', existing_report.moderation_text
      )
    );
    return query select
      existing_report.id,
      existing_report.public_id,
      existing_report.status,
      existing_report.publication_state,
      existing_report.moderation_case_id,
      existing_report.moderation_text;
    return;
  end if;

  if target_draft.version <> expected_version then
    raise exception using errcode = 'P0001', message = 'stale_state';
  end if;

  select version.id into active_version_id
  from public.jurisdiction_versions version
  where version.jurisdiction_id = target_draft.jurisdiction_id
    and version.version = target_draft.publication_policy_version
    and version.active_from <= statement_timestamp()
    and (version.retired_at is null or version.retired_at > statement_timestamp());
  if not found then
    raise exception using errcode = 'P0001', message = 'stale_publication_policy';
  end if;

  insert into public.reports (
    organization_id, jurisdiction_id, jurisdiction_version_id,
    organization_category_id, source_draft_id, description, status,
    publication_state
  ) values (
    target_draft.organization_id, target_draft.jurisdiction_id,
    active_version_id, target_draft.organization_category_id,
    target_draft.id, target_draft.description, 'pending_moderation', 'pending'
  ) returning * into created_report;

  insert into public.reporter_identities (
    report_id, reporter_user_id, contact_email, verified_at
  ) values (
    created_report.id, caller_id, caller_email, statement_timestamp()
  );
  insert into public.report_exact_locations (
    report_id, exact_location, exact_address
  ) values (
    created_report.id, target_draft.exact_location, target_draft.exact_address
  );
  insert into public.report_public_locations (
    report_id, public_location, public_label, precision, policy_version
  ) values (
    created_report.id, target_draft.public_location, target_draft.public_label,
    target_draft.public_location_precision, target_draft.publication_policy_version
  );
  insert into public.moderation_cases (report_id, organization_id)
  values (created_report.id, created_report.organization_id)
  returning * into created_case;
  insert into public.report_status_events (
    report_id, organization_id, actor_type, actor_id, source,
    previous_status, new_status, public_label, private_reason, visibility,
    correlation_id
  ) values (
    created_report.id, created_report.organization_id, 'citizen', caller_id,
    'web', 'draft', 'pending_moderation',
    'Accepted by the platform — safety checks in progress',
    'Awaiting the configured semantic text-moderation gate.', 'reporter',
    request_correlation_id
  );
  insert into public.audit_events (
    organization_id, actor_type, actor_id, action, entity_type, entity_id,
    summary, correlation_id
  ) values (
    created_report.organization_id, 'citizen', caller_id,
    'report_submitted_for_text_moderation', 'report', created_report.id,
    'Verified report accepted into the private text-moderation gate.',
    request_correlation_id
  );
  insert into public.idempotency_keys (
    actor_id, organization_id, operation, idempotency_key, request_hash,
    result_entity_id, result_payload
  ) values (
    caller_id, created_report.organization_id, 'submit_verified_report',
    request_idempotency_key, request_hash, created_report.id,
    jsonb_build_object(
      'public_id', created_report.public_id,
      'report_status', created_report.status,
      'publication_state', created_report.publication_state,
      'moderation_case_id', created_case.id,
      'moderation_text', target_draft.description
    )
  );

  return query select
    created_report.id, created_report.public_id, created_report.status,
    created_report.publication_state, created_case.id, target_draft.description;
end;
$$;

create function public.record_text_moderation_attempt(
  target_report_id uuid,
  request_correlation_id uuid
)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_case public.moderation_cases%rowtype;
  attempt_count integer;
begin
  if auth.role() <> 'service_role' then
    raise exception using errcode = '42501', message = 'protected_worker_required';
  end if;
  if target_report_id is null or request_correlation_id is null then
    raise exception using errcode = '22023', message = 'request_identifiers_required';
  end if;

  update public.moderation_cases moderation_case
  set provider_attempt_count = provider_attempt_count + 1,
      last_provider_at = statement_timestamp()
  where moderation_case.report_id = target_report_id
    and moderation_case.state in ('pending', 'escalated')
  returning * into target_case;
  if not found then
    raise exception using errcode = 'P0001', message = 'moderation_case_not_retryable';
  end if;
  attempt_count := target_case.provider_attempt_count;

  insert into public.audit_events (
    organization_id, actor_type, action, entity_type, entity_id,
    summary, correlation_id
  ) values (
    target_case.organization_id, 'integration', 'text_moderation_attempted',
    'report', target_report_id,
    'Protected text-moderation worker recorded a provider attempt.',
    request_correlation_id
  );
  return attempt_count;
end;
$$;

create function public.finalize_text_moderation(
  target_report_id uuid,
  requested_decision text,
  provider_code text,
  request_idempotency_key uuid,
  request_correlation_id uuid
)
returns table (
  report_status public.report_status,
  publication_state public.publication_state
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  target record;
  existing_key public.idempotency_keys%rowtype;
  request_hash text;
  next_case_state public.moderation_state;
  next_status public.report_status;
  next_publication public.publication_state;
  event_label text;
  event_visibility public.event_visibility;
begin
  if auth.role() <> 'service_role' then
    raise exception using errcode = '42501', message = 'protected_worker_required';
  end if;
  if target_report_id is null or request_idempotency_key is null
    or request_correlation_id is null then
    raise exception using errcode = '22023', message = 'request_identifiers_required';
  end if;
  if requested_decision not in ('approved', 'escalated', 'rejected')
    or nullif(btrim(provider_code), '') is null then
    raise exception using errcode = '22023', message = 'invalid_moderation_result';
  end if;

  select
    report.*,
    moderation_case.id as case_id,
    moderation_case.state as case_state,
    category.name as category_name,
    location.public_label as safe_public_label
  into target
  from public.reports report
  join public.moderation_cases moderation_case on moderation_case.report_id = report.id
  join public.organization_categories configured
    on configured.id = report.organization_category_id
  join public.categories category on category.id = configured.category_id
  join public.report_public_locations location on location.report_id = report.id
  where report.id = target_report_id
  for update of report, moderation_case;
  if not found then
    raise exception using errcode = 'P0001', message = 'report_not_found';
  end if;

  request_hash := public.request_fingerprint(array[
    target_report_id::text,
    requested_decision,
    btrim(provider_code)
  ]);
  select * into existing_key
  from public.idempotency_keys key
  where key.actor_id is null
    and key.organization_id = target.organization_id
    and key.operation = 'finalize_text_moderation'
    and key.idempotency_key = request_idempotency_key;
  if found then
    if existing_key.request_hash <> request_hash then
      raise exception using errcode = 'P0001', message = 'idempotency_conflict';
    end if;
    return query select
      (existing_key.result_payload ->> 'report_status')::public.report_status,
      (existing_key.result_payload ->> 'publication_state')::public.publication_state;
    return;
  end if;

  next_case_state := requested_decision::public.moderation_state;
  if target.case_state in ('approved', 'rejected') then
    if target.case_state <> next_case_state then
      raise exception using errcode = 'P0001', message = 'moderation_already_final';
    end if;
    return query select target.status, target.publication_state;
    return;
  end if;
  if target.case_state = 'escalated' and next_case_state = 'escalated' then
    return query select target.status, target.publication_state;
    return;
  end if;

  if requested_decision = 'approved' then
    next_status := 'submitted';
    next_publication := 'published';
    event_label := 'Accepted by the platform';
    event_visibility := 'public';
  elsif requested_decision = 'escalated' then
    next_status := 'pending_moderation';
    next_publication := 'pending';
    event_label := 'Text held for human safety review';
    event_visibility := 'reporter';
  else
    next_status := 'closed';
    next_publication := 'rejected';
    event_label := 'Report text was not published under the content policy';
    event_visibility := 'reporter';
  end if;

  update public.moderation_cases
  set state = next_case_state,
      version = version + 1,
      last_provider_code = btrim(provider_code),
      last_provider_at = statement_timestamp(),
      decision_summary = case requested_decision
        when 'approved' then 'Semantic text gate approved publication.'
        when 'escalated' then 'Semantic text gate requested trained human review.'
        else 'Semantic text gate rejected publication.'
      end
  where id = target.case_id;

  update public.reports
  set status = next_status,
      close_reason = case when requested_decision = 'rejected'
        then 'content_policy'::public.report_close_reason
        else null
      end,
      publication_state = next_publication,
      public_title = case when requested_decision = 'approved'
        then target.category_name || ' near ' || target.safe_public_label
        else null
      end,
      public_description = case when requested_decision = 'approved'
        then target.description
        else null
      end,
      status_version = status_version + 1
  where id = target.id;

  insert into public.moderation_signals (
    moderation_case_id, signal_kind, signal_code
  ) values (
    target.case_id, 'text_provider', btrim(provider_code)
  );
  insert into public.report_status_events (
    report_id, organization_id, actor_type, source, previous_status,
    new_status, public_label, private_reason, visibility, correlation_id
  ) values (
    target.id, target.organization_id, 'system', 'system', target.status,
    next_status, event_label,
    'Semantic text provider result recorded by the protected worker.',
    event_visibility, request_correlation_id
  );
  insert into public.audit_events (
    organization_id, actor_type, action, entity_type, entity_id,
    summary, correlation_id
  ) values (
    target.organization_id, 'integration', 'text_moderation_finalized',
    'report', target.id,
    'Protected worker finalized the semantic text publication gate.',
    request_correlation_id
  );
  insert into public.idempotency_keys (
    actor_id, organization_id, operation, idempotency_key, request_hash,
    result_entity_id, result_payload
  ) values (
    null, target.organization_id, 'finalize_text_moderation',
    request_idempotency_key, request_hash, target.id,
    jsonb_build_object(
      'report_status', next_status,
      'publication_state', next_publication
    )
  );

  return query select next_status, next_publication;
end;
$$;

create function public.set_report_relationship(
  target_public_id text,
  requested_kind public.relationship_kind,
  requested_enabled boolean,
  requested_notification_level public.notification_level,
  request_idempotency_key uuid,
  request_correlation_id uuid
)
returns table (
  enabled boolean,
  notification_level public.notification_level,
  support_count bigint
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller_id uuid := auth.uid();
  target_report public.reports%rowtype;
  existing_key public.idempotency_keys%rowtype;
  request_hash text;
  resulting_level public.notification_level;
  resulting_count bigint;
begin
  if not public.is_verified_user() then
    raise exception using errcode = '42501', message = 'verified_identity_required';
  end if;
  if nullif(btrim(target_public_id), '') is null
    or requested_kind is null or requested_enabled is null
    or requested_notification_level is null
    or request_idempotency_key is null or request_correlation_id is null then
    raise exception using errcode = '22023', message = 'request_identifiers_required';
  end if;

  select * into target_report
  from public.reports report
  where report.public_id = target_public_id
    and report.publication_state = 'published';
  if not found then
    raise exception using errcode = 'P0001', message = 'public_report_not_found';
  end if;

  request_hash := public.request_fingerprint(array[
    target_public_id,
    requested_kind::text,
    requested_enabled::text,
    requested_notification_level::text
  ]);
  select * into existing_key
  from public.idempotency_keys key
  where key.actor_id = caller_id
    and key.organization_id = target_report.organization_id
    and key.operation = 'set_report_relationship'
    and key.idempotency_key = request_idempotency_key;
  if found then
    if existing_key.request_hash <> request_hash then
      raise exception using errcode = 'P0001', message = 'idempotency_conflict';
    end if;
    return query select
      (existing_key.result_payload ->> 'enabled')::boolean,
      (existing_key.result_payload ->> 'notification_level')::public.notification_level,
      (existing_key.result_payload ->> 'support_count')::bigint;
    return;
  end if;

  if requested_enabled then
    insert into public.report_relationships (
      report_id, user_id, kind, notification_level
    ) values (
      target_report.id, caller_id, requested_kind,
      requested_notification_level
    )
    on conflict (report_id, user_id, kind) do update
    set notification_level = excluded.notification_level;
    resulting_level := requested_notification_level;
  else
    delete from public.report_relationships relationship
    where relationship.report_id = target_report.id
      and relationship.user_id = caller_id
      and relationship.kind = requested_kind;
    resulting_level := 'none';
  end if;

  select count(*) into resulting_count
  from public.report_relationships relationship
  where relationship.report_id = target_report.id
    and relationship.kind = 'support';

  insert into public.audit_events (
    organization_id, actor_type, actor_id, action, entity_type, entity_id,
    summary, correlation_id
  ) values (
    target_report.organization_id, 'citizen', caller_id,
    case when requested_enabled then 'report_relationship_enabled'
      else 'report_relationship_disabled' end,
    'report', target_report.id,
    'Citizen changed a private support or follow relationship.',
    request_correlation_id
  );
  insert into public.idempotency_keys (
    actor_id, organization_id, operation, idempotency_key, request_hash,
    result_entity_id, result_payload
  ) values (
    caller_id, target_report.organization_id, 'set_report_relationship',
    request_idempotency_key, request_hash, target_report.id,
    jsonb_build_object(
      'enabled', requested_enabled,
      'notification_level', resulting_level,
      'support_count', resulting_count
    )
  );

  return query select requested_enabled, resulting_level, resulting_count;
end;
$$;

create function public.get_my_report_relationship(
  target_public_id text,
  requested_kind public.relationship_kind
)
returns table (
  enabled boolean,
  notification_level public.notification_level
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  caller_id uuid := auth.uid();
begin
  if not public.is_verified_user() then
    raise exception using errcode = '42501', message = 'verified_identity_required';
  end if;
  return query
  select
    relationship.id is not null,
    coalesce(relationship.notification_level, 'none'::public.notification_level)
  from (select 1) singleton
  left join public.reports report
    on report.public_id = target_public_id
    and report.publication_state = 'published'
  left join public.report_relationships relationship
    on relationship.report_id = report.id
    and relationship.user_id = caller_id
    and relationship.kind = requested_kind;
end;
$$;

create or replace view public.public_reports
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
  report.updated_at,
  category.name as category_name,
  (
    select count(*)
    from public.report_relationships relationship
    where relationship.report_id = report.id
      and relationship.kind = 'support'
  ) as support_count
from public.reports report
join public.report_public_locations location on location.report_id = report.id
join public.organization_categories configured
  on configured.id = report.organization_category_id
join public.categories category on category.id = configured.category_id
where report.publication_state = 'published';

create or replace view public.public_report_events
with (security_barrier = true)
as
select
  report.public_id,
  event.public_label,
  event.new_status,
  event.created_at,
  event.actor_type,
  event.source
from public.report_status_events event
join public.reports report on report.id = event.report_id
where report.publication_state = 'published'
  and event.visibility = 'public';

revoke all on function public.find_duplicate_candidates(double precision, double precision, uuid, integer) from public;
revoke all on function public.submit_verified_report(uuid, integer, uuid, uuid) from public;
revoke all on function public.record_text_moderation_attempt(uuid, uuid) from public;
revoke all on function public.finalize_text_moderation(uuid, text, text, uuid, uuid) from public;
revoke all on function public.set_report_relationship(text, public.relationship_kind, boolean, public.notification_level, uuid, uuid) from public;
revoke all on function public.get_my_report_relationship(text, public.relationship_kind) from public;

grant execute on function public.find_duplicate_candidates(double precision, double precision, uuid, integer) to anon, authenticated;
grant execute on function public.submit_verified_report(uuid, integer, uuid, uuid) to authenticated;
grant execute on function public.record_text_moderation_attempt(uuid, uuid) to service_role;
grant execute on function public.finalize_text_moderation(uuid, text, text, uuid, uuid) to service_role;
grant execute on function public.set_report_relationship(text, public.relationship_kind, boolean, public.notification_level, uuid, uuid) to authenticated;
grant execute on function public.get_my_report_relationship(text, public.relationship_kind) to authenticated;

revoke all on public.public_reports, public.public_report_events from public;
grant select on public.public_reports, public.public_report_events to anon, authenticated;
