begin;

set local search_path = public, extensions, pg_temp;
\ir helpers/role-fixtures.inc

select plan(62);

set local role anon;
select is((select count(*)::integer from public.public_reports), 1, 'anonymous users see only the public-safe report');
select ok(pg_temp.command_is_denied('select * from public.reports'), 'anonymous users cannot query base reports');
select ok(pg_temp.command_is_denied('select * from public.report_exact_locations'), 'anonymous users cannot query exact locations');
select ok(pg_temp.command_is_denied('select * from public.reporter_identities'), 'anonymous users cannot query reporter identities');
reset role;

select set_config('request.jwt.claims', pg_temp.jwt_claims('c0000000-0000-4000-8000-000000000001', 'citizen.one@synthetic.invalid'), true);
set local role authenticated;
select is((select count(*)::integer from public.reports), 2, 'citizen sees both reports they own');
select is((select count(*)::integer from public.reporter_identities), 2, 'citizen sees only their private identities');
select is((select count(*)::integer from public.report_exact_locations), 2, 'citizen sees only their exact locations');
select is((select count(*)::integer from public.report_public_locations), 2, 'citizen sees their public-location representations');
select is((select count(*)::integer from public.report_status_events), 1, 'citizen sees public or reporter-visible events for owned reports');
select is((select count(*)::integer from public.moderation_cases), 0, 'citizen cannot see moderation cases');
select is((select count(*)::integer from public.moderation_signals), 0, 'citizen cannot see moderation signals');
select is((select count(*)::integer from public.report_internal_notes), 0, 'citizen cannot see internal notes');
select is((select count(*)::integer from public.audit_events), 0, 'citizen cannot see audit records');
select ok(pg_temp.command_is_denied('select * from public.idempotency_keys'), 'citizen cannot read idempotency records');
select ok(pg_temp.command_is_denied($command$insert into public.report_drafts (user_id, organization_id, jurisdiction_id, description, exact_location, public_label, public_location_precision, publication_policy_version) values ('c0000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000002', 'Synthetic direct insert must fail.', extensions.st_setsrid(extensions.st_makepoint(0, 0), 4326)::extensions.geography, 'Synthetic', 'withheld', 1)$command$), 'citizen cannot directly insert server drafts');
select ok(pg_temp.command_is_denied($command$update public.reports set status = 'resolved' where id = '40000000-0000-4000-8000-000000000001'$command$), 'citizen cannot directly update report status');
select ok(pg_temp.command_is_denied($command$update public.report_exact_locations set exact_address = 'exposed' where report_id = '40000000-0000-4000-8000-000000000001'$command$), 'citizen cannot directly update exact location');
select ok(pg_temp.command_is_denied($command$insert into public.audit_events (actor_type, action, entity_type, summary, correlation_id) values ('citizen', 'fake', 'report', 'fake', extensions.gen_random_uuid())$command$), 'citizen cannot write audit events');
reset role;

select set_config('request.jwt.claims', pg_temp.jwt_claims('c0000000-0000-4000-8000-000000000002', 'citizen.two@synthetic.invalid'), true);
set local role authenticated;
select is((select count(*)::integer from public.reports), 0, 'another citizen sees no owned private reports');
select is((select count(*)::integer from public.reporter_identities), 0, 'another citizen sees no reporter identity');
select is((select count(*)::integer from public.report_exact_locations), 0, 'another citizen sees no exact location');
select is((select count(*)::integer from public.report_status_events), 0, 'another citizen sees no private reporter timeline');
select is((select count(*)::integer from public.public_reports), 1, 'another citizen still sees the public-safe view');
reset role;

select set_config('request.jwt.claims', pg_temp.jwt_claims('c0000000-0000-4000-8000-000000000003', 'operator@synthetic.invalid'), true);
set local role authenticated;
select is((select count(*)::integer from public.reports), 2, 'operator sees reports in their organization');
select is((select count(*)::integer from public.reports where id = '90000000-0000-4000-8000-000000000005'), 0, 'operator cannot see a cross-organization report');
select is((select count(*)::integer from public.reporter_identities), 2, 'operator sees scoped reporter identity when needed');
select is((select count(*)::integer from public.report_exact_locations), 2, 'operator sees scoped exact locations');
select is((select count(*)::integer from public.moderation_cases), 0, 'operator cannot see moderation cases');
select is((select count(*)::integer from public.moderation_signals), 0, 'operator cannot see moderation signals');
select is((select count(*)::integer from public.report_internal_notes), 1, 'operator sees scoped internal notes');
select is((select count(*)::integer from public.integration_endpoints), 1, 'operator sees the redacted scoped destination record');
select is((select count(*)::integer from public.audit_events), 0, 'operator cannot browse organization audit');
select ok(pg_temp.command_is_denied($command$update public.moderation_cases set state = 'approved'$command$), 'operator cannot directly update moderation state');
select ok(pg_temp.command_is_denied($command$update public.integration_deliveries set state = 'delivered'$command$), 'operator cannot directly update delivery state');
reset role;

select set_config('request.jwt.claims', pg_temp.jwt_claims('c0000000-0000-4000-8000-000000000004', 'moderator@synthetic.invalid'), true);
set local role authenticated;
select is((select count(*)::integer from public.reports), 2, 'moderator sees scoped report content');
select is((select count(*)::integer from public.moderation_cases), 1, 'moderator sees scoped moderation case');
select is((select count(*)::integer from public.moderation_signals), 1, 'moderator sees scoped moderation signals');
select is((select count(*)::integer from public.reporter_identities), 0, 'moderator cannot see reporter identity');
select is((select count(*)::integer from public.report_exact_locations), 0, 'moderator cannot see exact location');
select is((select count(*)::integer from public.report_internal_notes), 0, 'moderator cannot see operator notes');
select is((select count(*)::integer from public.integration_endpoints), 0, 'moderator cannot see routing destinations');
select is((select count(*)::integer from public.audit_events), 0, 'moderator cannot see organization audit');
reset role;

select set_config('request.jwt.claims', pg_temp.jwt_claims('c0000000-0000-4000-8000-000000000005', 'org.admin@synthetic.invalid', 'aal1'), true);
set local role authenticated;
select is((select count(*)::integer from public.organization_memberships), 1, 'aal1 organization admin sees only their own membership');
select is((select count(*)::integer from public.audit_events), 0, 'aal1 organization admin cannot read audit');
select is((select count(*)::integer from public.integration_endpoints), 0, 'aal1 organization admin cannot read destination state');
reset role;

select set_config('request.jwt.claims', pg_temp.jwt_claims('c0000000-0000-4000-8000-000000000005', 'org.admin@synthetic.invalid', 'aal2'), true);
set local role authenticated;
select is((select count(*)::integer from public.organization_memberships), 3, 'aal2 organization admin sees fixed presets in their organization');
select ok(
  (select count(*) from public.audit_events where action = 'synthetic_seed_loaded') = 1
    and (select count(*) from public.audit_events where action = 'cross_org_fixture') = 0,
  'aal2 organization admin sees their organization audit but not cross-organization audit'
);
select is((select count(*)::integer from public.integration_endpoints), 1, 'aal2 organization admin sees redacted destination state');
select is((select count(*)::integer from public.reporter_identities), 0, 'organization admin cannot see reporter identity');
select is((select count(*)::integer from public.report_exact_locations), 0, 'organization admin cannot see exact location');
select is((select count(*)::integer from public.moderation_signals), 0, 'organization admin cannot see moderation signals');
reset role;

select set_config('request.jwt.claims', pg_temp.jwt_claims('c0000000-0000-4000-8000-000000000006', 'platform.admin@synthetic.invalid', 'aal2'), true);
set local role authenticated;
select is((select count(*)::integer from public.platform_memberships), 1, 'platform admin sees only their membership marker');
select is((select count(*)::integer from public.reports), 0, 'platform admin is not a global report browser');
select is((select count(*)::integer from public.reporter_identities), 0, 'platform admin cannot see reporter identity');
select is((select count(*)::integer from public.report_exact_locations), 0, 'platform admin cannot see exact location');
select is((select count(*)::integer from public.moderation_signals), 0, 'platform admin cannot see moderation signals');
select is((select count(*)::integer from public.audit_events), 0, 'platform admin cannot query raw organization audit');
select is((select count(*)::integer from public.public_reports), 1, 'platform admin receives only normal public report data');
reset role;

select set_config('request.jwt.claims', pg_temp.jwt_claims('c0000000-0000-4000-8000-000000000007', 'legal.escalator@synthetic.invalid', 'aal2'), true);
set local role authenticated;
select is((select count(*)::integer from public.platform_memberships), 1, 'legal escalator sees only their membership marker');
select is((select count(*)::integer from public.report_exact_locations), 0, 'legal preset alone does not reveal exact location');
select is((select count(*)::integer from public.reporter_identities), 0, 'legal preset alone does not reveal reporter identity');
select ok(pg_temp.command_is_denied('select * from public.legal_access_grants'), 'legal grant records are not client-browsable');
reset role;

select * from finish();
rollback;
