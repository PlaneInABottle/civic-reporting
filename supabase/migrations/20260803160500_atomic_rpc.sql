alter table public.idempotency_keys
  add column result_payload jsonb not null default '{}'::jsonb;

create function public.request_fingerprint(parts text[])
returns text
language sql
immutable
set search_path = ''
as $$
  select encode(
    extensions.digest(convert_to(array_to_string(parts, chr(31), '<null>'), 'utf8'), 'sha256'),
    'hex'
  );
$$;

create function public.create_verified_draft(
  target_organization_category_id uuid,
  draft_description text,
  exact_longitude double precision,
  exact_latitude double precision,
  exact_address text,
  public_longitude double precision,
  public_latitude double precision,
  public_label text,
  requested_precision public.location_precision,
  publication_policy_version integer,
  request_idempotency_key uuid,
  request_correlation_id uuid
)
returns table (draft_id uuid, version integer, expires_at timestamptz)
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller_id uuid := auth.uid();
  category record;
  exact_point extensions.geography(Point, 4326);
  public_point extensions.geography(Point, 4326);
  request_hash text;
  existing_key public.idempotency_keys%rowtype;
  created_draft public.report_drafts%rowtype;
begin
  if not public.is_verified_user() then
    raise exception using errcode = '42501', message = 'verified_identity_required';
  end if;

  if request_idempotency_key is null or request_correlation_id is null then
    raise exception using errcode = '22023', message = 'request_identifiers_required';
  end if;

  if draft_description is null or char_length(btrim(draft_description)) not between 10 and 4000 then
    raise exception using errcode = '22023', message = 'invalid_description';
  end if;

  if exact_longitude not between -180 and 180 or exact_latitude not between -90 and 90 then
    raise exception using errcode = '22023', message = 'invalid_exact_location';
  end if;

  if requested_precision = 'withheld' then
    if public_longitude is not null or public_latitude is not null then
      raise exception using errcode = '22023', message = 'public_location_must_be_withheld';
    end if;
    public_point := null;
  else
    if public_longitude is null or public_latitude is null
      or public_longitude not between -180 and 180
      or public_latitude not between -90 and 90 then
      raise exception using errcode = '22023', message = 'invalid_public_location';
    end if;
    public_point := extensions.st_setsrid(
      extensions.st_makepoint(public_longitude, public_latitude),
      4326
    )::extensions.geography;
  end if;

  exact_point := extensions.st_setsrid(
    extensions.st_makepoint(exact_longitude, exact_latitude),
    4326
  )::extensions.geography;

  select
    configured.id,
    configured.organization_id,
    configured.jurisdiction_id,
    configured.public_location_precision,
    jurisdiction_version.version as active_policy_version,
    jurisdiction_version.boundary
  into category
  from public.organization_categories configured
  join public.organizations organization on organization.id = configured.organization_id
  join lateral (
    select version.version, version.boundary
    from public.jurisdiction_versions version
    where version.jurisdiction_id = configured.jurisdiction_id
      and version.active_from <= statement_timestamp()
      and (version.retired_at is null or version.retired_at > statement_timestamp())
    order by version.version desc
    limit 1
  ) jurisdiction_version on true
  where configured.id = target_organization_category_id
    and configured.is_active
    and organization.is_pilot
    and not organization.is_test_fixture;

  if not found then
    raise exception using errcode = 'P0001', message = 'pilot_route_not_found';
  end if;

  if category.public_location_precision <> requested_precision
    or category.active_policy_version <> publication_policy_version then
    raise exception using errcode = 'P0001', message = 'stale_publication_policy';
  end if;

  if category.boundary is not null
    and not extensions.st_covers(category.boundary, exact_point) then
    raise exception using errcode = '22023', message = 'outside_pilot_jurisdiction';
  end if;

  request_hash := public.request_fingerprint(array[
    target_organization_category_id::text,
    btrim(draft_description),
    exact_longitude::text,
    exact_latitude::text,
    exact_address,
    public_longitude::text,
    public_latitude::text,
    public_label,
    requested_precision::text,
    publication_policy_version::text
  ]);

  select * into existing_key
  from public.idempotency_keys key
  where key.actor_id = caller_id
    and key.organization_id = category.organization_id
    and key.operation = 'create_verified_draft'
    and key.idempotency_key = request_idempotency_key;

  if found then
    if existing_key.request_hash <> request_hash then
      raise exception using errcode = 'P0001', message = 'idempotency_conflict';
    end if;
    return query select
      existing_key.result_entity_id,
      (existing_key.result_payload ->> 'version')::integer,
      (existing_key.result_payload ->> 'expires_at')::timestamptz;
    return;
  end if;

  insert into public.report_drafts (
    user_id, organization_id, jurisdiction_id, organization_category_id,
    description, exact_location, exact_address, public_location, public_label,
    public_location_precision, publication_policy_version
  ) values (
    caller_id, category.organization_id, category.jurisdiction_id,
    target_organization_category_id, btrim(draft_description), exact_point,
    nullif(btrim(exact_address), ''), public_point, btrim(public_label),
    requested_precision, publication_policy_version
  ) returning * into created_draft;

  insert into public.idempotency_keys (
    actor_id, organization_id, operation, idempotency_key, request_hash,
    result_entity_id, result_payload
  ) values (
    caller_id, category.organization_id, 'create_verified_draft',
    request_idempotency_key, request_hash, created_draft.id,
    jsonb_build_object(
      'version', created_draft.version,
      'expires_at', created_draft.expires_at
    )
  );

  insert into public.audit_events (
    organization_id, actor_type, actor_id, action, entity_type, entity_id,
    summary, correlation_id
  ) values (
    category.organization_id, 'citizen', caller_id, 'report_draft_created',
    'report_draft', created_draft.id,
    'Verified citizen draft created through the atomic boundary.',
    request_correlation_id
  );

  return query select created_draft.id, created_draft.version, created_draft.expires_at;
exception
  when unique_violation then
    raise exception using errcode = 'P0001', message = 'idempotency_conflict';
end;
$$;

create function public.withdraw_verified_draft(
  target_draft_id uuid,
  expected_version integer,
  request_idempotency_key uuid,
  request_correlation_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller_id uuid := auth.uid();
  existing_key public.idempotency_keys%rowtype;
  target public.report_drafts%rowtype;
  request_hash text;
begin
  if not public.is_verified_user() then
    raise exception using errcode = '42501', message = 'verified_identity_required';
  end if;

  request_hash := public.request_fingerprint(array[target_draft_id::text, expected_version::text]);

  select * into existing_key
  from public.idempotency_keys key
  where key.actor_id = caller_id
    and key.operation = 'withdraw_verified_draft'
    and key.idempotency_key = request_idempotency_key;

  if found then
    if existing_key.request_hash <> request_hash then
      raise exception using errcode = 'P0001', message = 'idempotency_conflict';
    end if;
    return existing_key.result_entity_id;
  end if;

  select * into target
  from public.report_drafts draft
  where draft.id = target_draft_id and draft.user_id = caller_id
  for update;

  if not found then
    raise exception using errcode = 'P0001', message = 'draft_not_found';
  end if;
  if target.version <> expected_version then
    raise exception using errcode = 'P0001', message = 'stale_state';
  end if;

  insert into public.idempotency_keys (
    actor_id, organization_id, operation, idempotency_key, request_hash,
    result_entity_id, result_payload
  ) values (
    caller_id, target.organization_id, 'withdraw_verified_draft',
    request_idempotency_key, request_hash, target.id,
    jsonb_build_object('version', target.version)
  );

  insert into public.audit_events (
    organization_id, actor_type, actor_id, action, entity_type, entity_id,
    summary, correlation_id
  ) values (
    target.organization_id, 'citizen', caller_id, 'report_draft_withdrawn',
    'report_draft', target.id,
    'Verified citizen draft withdrawn before submission.',
    request_correlation_id
  );

  delete from public.report_drafts where id = target.id;
  return target.id;
end;
$$;

create function public.transition_report_status(
  target_report_id uuid,
  expected_version integer,
  requested_status public.report_status,
  requested_close_reason public.report_close_reason,
  public_label text,
  private_reason text,
  requested_visibility public.event_visibility,
  request_idempotency_key uuid,
  request_correlation_id uuid
)
returns table (new_status public.report_status, new_version integer)
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller_id uuid := auth.uid();
  target public.reports%rowtype;
  existing_key public.idempotency_keys%rowtype;
  request_hash text;
begin
  select * into target from public.reports report where report.id = target_report_id for update;
  if not found then
    raise exception using errcode = 'P0001', message = 'report_not_found';
  end if;
  if not public.has_org_preset(target.organization_id, 'operator') then
    raise exception using errcode = '42501', message = 'role_not_allowed';
  end if;
  if request_idempotency_key is null or request_correlation_id is null then
    raise exception using errcode = '22023', message = 'request_identifiers_required';
  end if;
  if requested_visibility not in ('public', 'reporter', 'staff') then
    raise exception using errcode = '22023', message = 'invalid_event_visibility';
  end if;

  request_hash := public.request_fingerprint(array[
    target_report_id::text, expected_version::text, requested_status::text,
    requested_close_reason::text, public_label, private_reason, requested_visibility::text
  ]);
  select * into existing_key from public.idempotency_keys key
  where key.actor_id = caller_id and key.organization_id = target.organization_id
    and key.operation = 'transition_report_status'
    and key.idempotency_key = request_idempotency_key;
  if found then
    if existing_key.request_hash <> request_hash then
      raise exception using errcode = 'P0001', message = 'idempotency_conflict';
    end if;
    return query select
      (existing_key.result_payload ->> 'status')::public.report_status,
      (existing_key.result_payload ->> 'version')::integer;
    return;
  end if;

  if target.status_version <> expected_version then
    raise exception using errcode = 'P0001', message = 'stale_state';
  end if;
  if requested_status = target.status or not (case target.status
    when 'submitted' then requested_status in ('received', 'closed')
    when 'received' then requested_status in ('needs_information', 'in_progress', 'resolved', 'closed')
    when 'needs_information' then requested_status in ('in_progress', 'resolved', 'closed')
    when 'in_progress' then requested_status in ('needs_information', 'resolved', 'closed')
    when 'resolved' then requested_status in ('in_progress', 'closed')
    else false
  end) then
    raise exception using errcode = 'P0001', message = 'invalid_transition';
  end if;
  if (requested_status = 'closed') <> (requested_close_reason is not null) then
    raise exception using errcode = '22023', message = 'invalid_close_reason';
  end if;
  if public_label is null or char_length(btrim(public_label)) not between 2 and 240 then
    raise exception using errcode = '22023', message = 'invalid_public_label';
  end if;

  update public.reports set
    status = requested_status,
    close_reason = requested_close_reason,
    status_version = status_version + 1
  where id = target.id
  returning status, status_version into new_status, new_version;

  insert into public.report_status_events (
    report_id, organization_id, actor_type, actor_id, source, previous_status,
    new_status, public_label, private_reason, visibility, correlation_id
  ) values (
    target.id, target.organization_id, 'operator', caller_id, 'staff', target.status,
    new_status, btrim(public_label), nullif(btrim(private_reason), ''), requested_visibility,
    request_correlation_id
  );
  insert into public.audit_events (
    organization_id, actor_type, actor_id, action, entity_type, entity_id,
    summary, correlation_id
  ) values (
    target.organization_id, 'operator', caller_id, 'report_status_transitioned',
    'report', target.id, 'Report status changed through the atomic staff boundary.',
    request_correlation_id
  );
  insert into public.idempotency_keys (
    actor_id, organization_id, operation, idempotency_key, request_hash,
    result_entity_id, result_payload
  ) values (
    caller_id, target.organization_id, 'transition_report_status',
    request_idempotency_key, request_hash, target.id,
    jsonb_build_object('status', new_status, 'version', new_version)
  );
  return next;
end;
$$;

create function public.transition_moderation_case(
  target_case_id uuid,
  expected_version integer,
  requested_state public.moderation_state,
  reason text,
  request_idempotency_key uuid,
  request_correlation_id uuid
)
returns table (new_state public.moderation_state, new_version integer)
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller_id uuid := auth.uid();
  target public.moderation_cases%rowtype;
  existing_key public.idempotency_keys%rowtype;
  request_hash text;
begin
  select * into target from public.moderation_cases moderation_case
  where moderation_case.id = target_case_id for update;
  if not found then
    raise exception using errcode = 'P0001', message = 'moderation_case_not_found';
  end if;
  if not public.has_org_preset(target.organization_id, 'moderator') then
    raise exception using errcode = '42501', message = 'role_not_allowed';
  end if;
  if request_idempotency_key is null or request_correlation_id is null then
    raise exception using errcode = '22023', message = 'request_identifiers_required';
  end if;

  request_hash := public.request_fingerprint(array[
    target_case_id::text, expected_version::text, requested_state::text, reason
  ]);
  select * into existing_key from public.idempotency_keys key
  where key.actor_id = caller_id and key.organization_id = target.organization_id
    and key.operation = 'transition_moderation_case'
    and key.idempotency_key = request_idempotency_key;
  if found then
    if existing_key.request_hash <> request_hash then
      raise exception using errcode = 'P0001', message = 'idempotency_conflict';
    end if;
    return query select
      (existing_key.result_payload ->> 'state')::public.moderation_state,
      (existing_key.result_payload ->> 'version')::integer;
    return;
  end if;

  if target.version <> expected_version then
    raise exception using errcode = 'P0001', message = 'stale_state';
  end if;
  if requested_state = target.state or not (case target.state
    when 'pending' then requested_state in ('approved', 'rejected', 'escalated')
    when 'escalated' then requested_state in ('approved', 'rejected')
    else false
  end) then
    raise exception using errcode = 'P0001', message = 'invalid_transition';
  end if;
  if reason is null or char_length(btrim(reason)) not between 3 and 1000 then
    raise exception using errcode = '22023', message = 'invalid_reason';
  end if;

  update public.moderation_cases set
    state = requested_state, version = version + 1,
    assigned_moderator_id = caller_id, decision_summary = btrim(reason)
  where id = target.id
  returning state, version into new_state, new_version;

  insert into public.moderation_actions (
    moderation_case_id, actor_id, previous_state, new_state, reason, correlation_id
  ) values (
    target.id, caller_id, target.state, new_state, btrim(reason), request_correlation_id
  );
  insert into public.audit_events (
    organization_id, actor_type, actor_id, action, entity_type, entity_id,
    summary, correlation_id
  ) values (
    target.organization_id, 'moderator', caller_id, 'moderation_case_transitioned',
    'moderation_case', target.id,
    'Moderation state changed through the isolated moderator boundary.',
    request_correlation_id
  );
  insert into public.idempotency_keys (
    actor_id, organization_id, operation, idempotency_key, request_hash,
    result_entity_id, result_payload
  ) values (
    caller_id, target.organization_id, 'transition_moderation_case',
    request_idempotency_key, request_hash, target.id,
    jsonb_build_object('state', new_state, 'version', new_version)
  );
  return next;
end;
$$;

create function public.transition_delivery(
  target_delivery_id uuid,
  expected_version integer,
  requested_state public.delivery_state,
  error_code text,
  request_idempotency_key uuid,
  request_correlation_id uuid
)
returns table (new_state public.delivery_state, new_version integer)
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller_id uuid := auth.uid();
  caller_is_service boolean := auth.role() = 'service_role';
  target public.integration_deliveries%rowtype;
  existing_key public.idempotency_keys%rowtype;
  request_hash text;
  audit_actor public.actor_type;
begin
  select * into target from public.integration_deliveries delivery
  where delivery.id = target_delivery_id for update;
  if not found then
    raise exception using errcode = 'P0001', message = 'delivery_not_found';
  end if;

  if caller_is_service then
    audit_actor := 'integration';
  elsif public.has_org_preset(target.organization_id, 'operator') then
    audit_actor := 'operator';
  else
    raise exception using errcode = '42501', message = 'role_not_allowed';
  end if;
  if request_idempotency_key is null or request_correlation_id is null then
    raise exception using errcode = '22023', message = 'request_identifiers_required';
  end if;

  request_hash := public.request_fingerprint(array[
    target_delivery_id::text, expected_version::text, requested_state::text, error_code
  ]);
  select * into existing_key from public.idempotency_keys key
  where key.actor_id is not distinct from caller_id
    and key.organization_id = target.organization_id
    and key.operation = 'transition_delivery'
    and key.idempotency_key = request_idempotency_key;
  if found then
    if existing_key.request_hash <> request_hash then
      raise exception using errcode = 'P0001', message = 'idempotency_conflict';
    end if;
    return query select
      (existing_key.result_payload ->> 'state')::public.delivery_state,
      (existing_key.result_payload ->> 'version')::integer;
    return;
  end if;

  if target.version <> expected_version then
    raise exception using errcode = 'P0001', message = 'stale_state';
  end if;
  if not caller_is_service
    and not (requested_state = 'acknowledged' and target.state = 'delivered') then
    raise exception using errcode = '42501', message = 'role_not_allowed';
  end if;
  if requested_state = target.state or not (case target.state
    when 'queued' then requested_state in ('attempting', 'cancelled')
    when 'attempting' then requested_state in ('delivered', 'retry_scheduled', 'failed', 'cancelled')
    when 'delivered' then requested_state = 'acknowledged'
    when 'retry_scheduled' then requested_state in ('attempting', 'cancelled')
    when 'failed' then requested_state in ('retry_scheduled', 'cancelled')
    else false
  end) then
    raise exception using errcode = 'P0001', message = 'invalid_transition';
  end if;

  update public.integration_deliveries set
    state = requested_state,
    version = version + 1,
    attempt_count = case when requested_state = 'attempting' then attempt_count + 1 else attempt_count end,
    last_error_code = nullif(btrim(error_code), ''),
    next_attempt_at = case when requested_state = 'retry_scheduled' then statement_timestamp() else null end
  where id = target.id
  returning state, version into new_state, new_version;

  insert into public.audit_events (
    organization_id, actor_type, actor_id, action, entity_type, entity_id,
    summary, correlation_id
  ) values (
    target.organization_id, audit_actor, caller_id, 'delivery_transitioned',
    'integration_delivery', target.id,
    'Delivery state changed through the protected adapter boundary.',
    request_correlation_id
  );
  insert into public.idempotency_keys (
    actor_id, organization_id, operation, idempotency_key, request_hash,
    result_entity_id, result_payload
  ) values (
    caller_id, target.organization_id, 'transition_delivery',
    request_idempotency_key, request_hash, target.id,
    jsonb_build_object('state', new_state, 'version', new_version)
  );
  return next;
end;
$$;

revoke all on function public.request_fingerprint(text[]) from public, anon, authenticated;
revoke all on function public.create_verified_draft(uuid, text, double precision, double precision, text, double precision, double precision, text, public.location_precision, integer, uuid, uuid) from public, anon;
revoke all on function public.withdraw_verified_draft(uuid, integer, uuid, uuid) from public, anon;
revoke all on function public.transition_report_status(uuid, integer, public.report_status, public.report_close_reason, text, text, public.event_visibility, uuid, uuid) from public, anon;
revoke all on function public.transition_moderation_case(uuid, integer, public.moderation_state, text, uuid, uuid) from public, anon;
revoke all on function public.transition_delivery(uuid, integer, public.delivery_state, text, uuid, uuid) from public, anon;

grant execute on function public.create_verified_draft(uuid, text, double precision, double precision, text, double precision, double precision, text, public.location_precision, integer, uuid, uuid) to authenticated;
grant execute on function public.withdraw_verified_draft(uuid, integer, uuid, uuid) to authenticated;
grant execute on function public.transition_report_status(uuid, integer, public.report_status, public.report_close_reason, text, text, public.event_visibility, uuid, uuid) to authenticated;
grant execute on function public.transition_moderation_case(uuid, integer, public.moderation_state, text, uuid, uuid) to authenticated;
grant execute on function public.transition_delivery(uuid, integer, public.delivery_state, text, uuid, uuid) to authenticated, service_role;
