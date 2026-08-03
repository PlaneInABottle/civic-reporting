begin;

set local search_path = public, extensions;
select plan(10);

select is(
  (select count(*)::integer from public.organizations where is_pilot),
  1,
  'exactly one synthetic pilot organization is seeded'
);

select ok(
  exists (
    select 1 from public.organizations
    where is_pilot
      and name ilike '%fictional%'
      and synthetic_notice ilike '%not a real government service%'
  ),
  'the pilot fixture cannot be mistaken for a real government service'
);

select is(
  (select count(*)::integer from public.jurisdictions where is_synthetic),
  1,
  'one synthetic jurisdiction is seeded'
);

select is(
  (select count(*)::integer from public.categories where is_active),
  4,
  'four fixed pilot categories are seeded'
);

select ok(
  exists (
    select 1 from public.integration_endpoints
    where destination_kind = 'local_fake'
      and configuration_state = 'disabled'
      and not is_active
  ),
  'delivery fixture is explicitly fake and disabled'
);

select is(
  (select count(*)::integer from public.public_reports),
  1,
  'only the approved synthetic report is public'
);

select is(
  (select count(*)::integer from public.public_report_events where public_id = 'HBR-SYNTHETIC-1' and public_label = 'Received by the synthetic pilot fixture'),
  1,
  'the seeded public timeline exposes only the public-safe event row'
);

select ok(
  exists (
    select 1
    from public.report_exact_locations exact_location
    join public.report_public_locations public_location using (report_id)
    where extensions.st_x(exact_location.exact_location::extensions.geometry)
      <> extensions.st_x(public_location.public_location::extensions.geometry)
  ),
  'exact and public coordinates are intentionally different'
);

select is(
  (
    select count(*)::integer
    from information_schema.columns
    where table_schema = 'public'
      and table_name in ('public_reports', 'public_report_events')
      and column_name in (
        'reporter_user_id', 'contact_email', 'exact_location', 'exact_address',
        'private_reason', 'actor_id', 'signal_code', 'last_error_code'
      )
  ),
  0,
  'public views contain no restricted identity, location, moderation, or delivery columns'
);

select ok(
  exists (
    select 1 from public.moderation_signals
    where signal_kind = 'synthetic_fixture'
      and signal_code = 'safe_test_only'
  ),
  'moderation fixture is safe and unmistakably synthetic'
);

select * from finish();
rollback;
