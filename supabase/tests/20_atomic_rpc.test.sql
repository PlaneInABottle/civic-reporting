begin;

set local search_path = public, extensions, pg_temp;
\ir helpers/role-fixtures.inc

select plan(42);

set local role anon;
select is(
  pg_temp.command_error($command$select * from public.create_verified_draft('30000000-0000-4000-8000-000000000001', 'Synthetic citizen draft created only through the verified RPC.', 0.0042, 0.0031, 'Synthetic exact address', 0, 0, 'Harborfield North (Synthetic)', 'neighborhood', 1, 'a1000000-0000-4000-8000-000000000001', 'a1000000-0000-4000-8000-000000000002')$command$),
  'permission denied for function create_verified_draft',
  'anonymous callers cannot execute verified draft creation'
);
reset role;

select set_config('request.jwt.claims', pg_temp.jwt_claims('c0000000-0000-4000-8000-000000000001', 'citizen.one@synthetic.invalid'), true);
set local role authenticated;
select draft_id, version as draft_version
from public.create_verified_draft(
  '30000000-0000-4000-8000-000000000001',
  'Synthetic citizen draft created only through the verified RPC.',
  0.0042, 0.0031, 'Synthetic exact address',
  0, 0, 'Harborfield North (Synthetic)', 'neighborhood', 1,
  'a1000000-0000-4000-8000-000000000001',
  'a1000000-0000-4000-8000-000000000002'
) \gset created_

select ok(
  exists(select 1 from public.report_drafts where id = :'created_draft_id'::uuid),
  'verified citizen creates an owned server draft atomically'
);
select ok(
  exists(
    select 1 from public.report_drafts
    where id = :'created_draft_id'::uuid
      and extensions.st_x(exact_location::extensions.geometry)
        <> extensions.st_x(public_location::extensions.geometry)
  ),
  'draft stores exact and public coordinates separately'
);
select is(
  pg_temp.audit_count('report_draft_created', 'a1000000-0000-4000-8000-000000000002'),
  1,
  'draft creation appends one audit event'
);
select is(
  (
    select draft_id from public.create_verified_draft(
      '30000000-0000-4000-8000-000000000001',
      'Synthetic citizen draft created only through the verified RPC.',
      0.0042, 0.0031, 'Synthetic exact address',
      0, 0, 'Harborfield North (Synthetic)', 'neighborhood', 1,
      'a1000000-0000-4000-8000-000000000001',
      'a1000000-0000-4000-8000-000000000002'
    )
  ),
  :'created_draft_id'::uuid,
  'same draft idempotency key returns the original result'
);
select is((select count(*)::integer from public.report_drafts), 1, 'idempotent replay creates no duplicate draft');
select is(
  pg_temp.command_error($command$select * from public.create_verified_draft('30000000-0000-4000-8000-000000000001', 'Changed synthetic payload must conflict with the original key.', 0.0042, 0.0031, 'Synthetic exact address', 0, 0, 'Harborfield North (Synthetic)', 'neighborhood', 1, 'a1000000-0000-4000-8000-000000000001', 'a1000000-0000-4000-8000-000000000002')$command$),
  'idempotency_conflict',
  'same key with changed request is rejected'
);

select draft_id
from public.create_verified_draft(
  '30000000-0000-4000-8000-000000000001',
  'Second synthetic draft exists only to prove withdrawal.',
  0.005, 0.004, 'Synthetic disposable address',
  0, 0, 'Harborfield North (Synthetic)', 'neighborhood', 1,
  'a1000000-0000-4000-8000-000000000003',
  'a1000000-0000-4000-8000-000000000004'
) \gset withdrawn_

select is(
  public.withdraw_verified_draft(
    :'withdrawn_draft_id'::uuid,
    1,
    'a1000000-0000-4000-8000-000000000005',
    'a1000000-0000-4000-8000-000000000006'
  ),
  :'withdrawn_draft_id'::uuid,
  'citizen withdraws their verified draft before routing'
);
select is((select count(*)::integer from public.report_drafts where id = :'withdrawn_draft_id'::uuid), 0, 'withdrawal removes only the selected draft');
select is(pg_temp.audit_count('report_draft_withdrawn', null, :'withdrawn_draft_id'::uuid), 1, 'withdrawal appends one audit event');
select is(
  public.withdraw_verified_draft(
    :'withdrawn_draft_id'::uuid,
    1,
    'a1000000-0000-4000-8000-000000000005',
    'a1000000-0000-4000-8000-000000000006'
  ),
  :'withdrawn_draft_id'::uuid,
  'withdrawal replay returns the original result'
);
reset role;

select set_config('request.jwt.claims', pg_temp.jwt_claims('c0000000-0000-4000-8000-000000000002', 'citizen.two@synthetic.invalid'), true);
set local role authenticated;
select is(
  pg_temp.command_error(format($command$select public.withdraw_verified_draft('%s', 1, 'a1000000-0000-4000-8000-000000000007', 'a1000000-0000-4000-8000-000000000008')$command$, :'created_draft_id')),
  'draft_not_found',
  'another citizen cannot withdraw the owner draft'
);
reset role;

select set_config('request.jwt.claims', pg_temp.jwt_claims('c0000000-0000-4000-8000-000000000003', 'operator@synthetic.invalid'), true);
set local role authenticated;
select is(
  pg_temp.command_error($command$select * from public.transition_report_status('40000000-0000-4000-8000-000000000001', 2, 'in_progress', null, 'Work started', 'missing key', 'public', null, 'a2000000-0000-4000-8000-000000000099')$command$),
  'request_identifiers_required',
  'report transitions require idempotency and correlation identifiers'
);
select new_status, new_version
from public.transition_report_status(
  '40000000-0000-4000-8000-000000000001', 2, 'in_progress', null,
  'Work started in the synthetic pilot', 'Synthetic transition test',
  'public',
  'a2000000-0000-4000-8000-000000000001',
  'a2000000-0000-4000-8000-000000000002'
) \gset report_
select is(:'report_new_status'::text, 'in_progress'::text, 'operator performs an allowed report transition');
select is(:'report_new_version'::integer, 3, 'report transition increments the state version');
select is(pg_temp.status_event_count('a2000000-0000-4000-8000-000000000002'), 1, 'report transition appends one status event');
select is((select visibility::text from public.report_status_events where correlation_id = 'a2000000-0000-4000-8000-000000000002'), 'public'::text, 'operator explicitly creates a public-safe status event');
select is(pg_temp.audit_count('report_status_transitioned', 'a2000000-0000-4000-8000-000000000002'), 1, 'report transition appends one audit event');
select is(
  (select new_version from public.transition_report_status('40000000-0000-4000-8000-000000000001', 2, 'in_progress', null, 'Work started in the synthetic pilot', 'Synthetic transition test', 'public', 'a2000000-0000-4000-8000-000000000001', 'a2000000-0000-4000-8000-000000000002')),
  3,
  'report transition replay returns the original version'
);
select is(pg_temp.status_event_count('a2000000-0000-4000-8000-000000000002'), 1, 'report replay creates no duplicate event');
select is(
  pg_temp.command_error($command$select * from public.transition_report_status('40000000-0000-4000-8000-000000000001', 2, 'resolved', null, 'Resolved', 'stale test', 'public', 'a2000000-0000-4000-8000-000000000003', 'a2000000-0000-4000-8000-000000000004')$command$),
  'stale_state',
  'stale report version is rejected'
);
select is(
  pg_temp.command_error($command$select * from public.transition_report_status('40000000-0000-4000-8000-000000000001', 3, 'submitted', null, 'Submitted again', 'invalid transition', 'public', 'a2000000-0000-4000-8000-000000000005', 'a2000000-0000-4000-8000-000000000006')$command$),
  'invalid_transition',
  'invalid report transition is rejected'
);
select ok(pg_temp.command_is_denied($command$update public.report_status_events set public_label = 'tampered'$command$), 'status events remain append-only to clients');
reset role;

select set_config('request.jwt.claims', pg_temp.jwt_claims('c0000000-0000-4000-8000-000000000004', 'moderator@synthetic.invalid'), true);
set local role authenticated;
select is(
  pg_temp.command_error($command$select * from public.transition_report_status('40000000-0000-4000-8000-000000000001', 3, 'resolved', null, 'Resolved', 'wrong role', 'public', 'a2000000-0000-4000-8000-000000000007', 'a2000000-0000-4000-8000-000000000008')$command$),
  'role_not_allowed',
  'moderator cannot perform operator status transitions'
);
select is(
  pg_temp.command_error($command$select * from public.transition_moderation_case('60000000-0000-4000-8000-000000000001', 1, 'approved', 'missing key test', null, 'a3000000-0000-4000-8000-000000000099')$command$),
  'request_identifiers_required',
  'moderation transitions require idempotency and correlation identifiers'
);
select new_state, new_version
from public.transition_moderation_case(
  '60000000-0000-4000-8000-000000000001', 1, 'approved',
  'Safe synthetic text fixture approved',
  'a3000000-0000-4000-8000-000000000001',
  'a3000000-0000-4000-8000-000000000002'
) \gset moderation_
select is(:'moderation_new_state'::text, 'approved'::text, 'moderator performs an allowed case transition');
select is(:'moderation_new_version'::integer, 2, 'moderation transition increments the version');
select is(pg_temp.moderation_action_count('a3000000-0000-4000-8000-000000000002'), 1, 'moderation transition appends one action');
select is(pg_temp.audit_count('moderation_case_transitioned', 'a3000000-0000-4000-8000-000000000002'), 1, 'moderation transition appends one audit event');
select is(
  (select new_version from public.transition_moderation_case('60000000-0000-4000-8000-000000000001', 1, 'approved', 'Safe synthetic text fixture approved', 'a3000000-0000-4000-8000-000000000001', 'a3000000-0000-4000-8000-000000000002')),
  2,
  'moderation replay returns the original version'
);
select is(pg_temp.moderation_action_count('a3000000-0000-4000-8000-000000000002'), 1, 'moderation replay creates no duplicate action');
select is(
  pg_temp.command_error($command$select * from public.transition_moderation_case('60000000-0000-4000-8000-000000000001', 1, 'rejected', 'stale', 'a3000000-0000-4000-8000-000000000003', 'a3000000-0000-4000-8000-000000000004')$command$),
  'stale_state',
  'stale moderation version is rejected'
);
reset role;

select set_config('request.jwt.claims', pg_temp.jwt_claims('c0000000-0000-4000-8000-000000000003', 'operator@synthetic.invalid'), true);
set local role authenticated;
select is(
  pg_temp.command_error($command$select * from public.transition_moderation_case('60000000-0000-4000-8000-000000000001', 2, 'rejected', 'wrong role', 'a3000000-0000-4000-8000-000000000005', 'a3000000-0000-4000-8000-000000000006')$command$),
  'role_not_allowed',
  'operator cannot perform moderator transitions'
);
reset role;

insert into public.integration_deliveries (
  id, report_id, organization_id, endpoint_id, state, version, correlation_id
)
values (
  'a4000000-0000-4000-8000-000000000001',
  '40000000-0000-4000-8000-000000000001',
  '10000000-0000-4000-8000-000000000001',
  '70000000-0000-4000-8000-000000000001',
  'queued', 1,
  'a4000000-0000-4000-8000-000000000002'
);

select set_config('request.jwt.claims', pg_temp.jwt_claims('c0000000-0000-4000-8000-000000000003', 'operator@synthetic.invalid'), true);
set local role authenticated;
select is(
  pg_temp.command_error($command$select * from public.transition_delivery('a4000000-0000-4000-8000-000000000001', 1, 'delivered', null, 'a4000000-0000-4000-8000-000000000003', 'a4000000-0000-4000-8000-000000000004')$command$),
  'role_not_allowed',
  'operator cannot claim delivery'
);
reset role;

select set_config('request.jwt.claims', '{"role":"service_role","aal":"aal2"}', true);
set local role service_role;
select is(
  pg_temp.command_error($command$select * from public.transition_delivery('a4000000-0000-4000-8000-000000000001', 1, 'attempting', null, null, 'a4000000-0000-4000-8000-000000000099')$command$),
  'request_identifiers_required',
  'delivery transitions require idempotency and correlation identifiers'
);
select is(
  (select new_version from public.transition_delivery('a4000000-0000-4000-8000-000000000001', 1, 'attempting', null, 'a4000000-0000-4000-8000-000000000005', 'a4000000-0000-4000-8000-000000000006')),
  2,
  'future protected service boundary can begin delivery'
);
select is(
  (select new_version from public.transition_delivery('a4000000-0000-4000-8000-000000000001', 2, 'delivered', null, 'a4000000-0000-4000-8000-000000000007', 'a4000000-0000-4000-8000-000000000008')),
  3,
  'future protected service boundary can record delivery'
);
reset role;

select set_config('request.jwt.claims', pg_temp.jwt_claims('c0000000-0000-4000-8000-000000000003', 'operator@synthetic.invalid'), true);
set local role authenticated;
select is(
  (select new_version from public.transition_delivery('a4000000-0000-4000-8000-000000000001', 3, 'acknowledged', null, 'a4000000-0000-4000-8000-000000000009', 'a4000000-0000-4000-8000-000000000010')),
  4,
  'operator may record the explicit manual acknowledgment'
);
select is(pg_temp.audit_count('delivery_transitioned', null, 'a4000000-0000-4000-8000-000000000001'), 3, 'delivery transitions append one audit event each');
select is(
  pg_temp.command_error($command$select * from public.transition_delivery('a4000000-0000-4000-8000-000000000001', 3, 'cancelled', null, 'a4000000-0000-4000-8000-000000000011', 'a4000000-0000-4000-8000-000000000012')$command$),
  'stale_state',
  'stale delivery version is rejected'
);
reset role;

select ok(pg_temp.command_is_denied($command$update public.audit_events set summary = 'tampered'$command$), 'audit records are append-only even for direct database maintenance');
select ok(pg_temp.command_is_denied($command$update public.report_status_events set public_label = 'tampered'$command$), 'status records are append-only even for direct database maintenance');

select * from finish();
rollback;
