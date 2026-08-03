begin;

set local search_path = public, extensions, pg_temp;
\ir helpers/role-fixtures.inc

select plan(51);

set local role anon;
select is(
  pg_temp.command_error($command$select * from public.submit_verified_report('00000000-0000-4000-8000-000000000000', 1, extensions.gen_random_uuid(), extensions.gen_random_uuid())$command$),
  'permission denied for function submit_verified_report',
  'anonymous callers cannot submit verified drafts'
);
reset role;

select set_config('request.jwt.claims', pg_temp.jwt_claims('c0000000-0000-4000-8000-000000000001', 'citizen.one@synthetic.invalid'), true);
set local role authenticated;
select draft_id
from public.create_verified_draft(
  '30000000-0000-4000-8000-000000000001',
  'A safe synthetic loose paving description for Phase 3 publication.',
  0.0042, 0.0031, 'Private Fixture Lane 77',
  0, 0, 'Harborfield North (Synthetic)', 'neighborhood', 1,
  'b1000000-0000-4000-8000-000000000001',
  'b1000000-0000-4000-8000-000000000002'
) \gset draft_
select ok(:'draft_draft_id'::uuid is not null, 'a verified citizen has a draft to submit');

select report_id, public_id, report_status, publication_state, moderation_case_id,
  moderation_text
from public.submit_verified_report(
  :'draft_draft_id'::uuid,
  1,
  'b2000000-0000-4000-8000-000000000001',
  'b2000000-0000-4000-8000-000000000002'
) \gset submitted_

select is(:'submitted_report_status'::text, 'pending_moderation', 'submission truthfully starts pending moderation');
select is(:'submitted_publication_state'::text, 'pending', 'submission is not public before its content gate');
select is(:'submitted_moderation_text'::text, 'A safe synthetic loose paving description for Phase 3 publication.', 'the owner-scoped submission result gives the protected worker text to moderate');
select is((select count(*)::integer from public.reports where source_draft_id = :'draft_draft_id'::uuid), 1, 'one report is created from the draft');
select is((select count(*)::integer from public.reporter_identities where report_id = :'submitted_report_id'::uuid and reporter_user_id = auth.uid()), 1, 'verified identity is copied privately');
select is((select exact_address from public.report_exact_locations where report_id = :'submitted_report_id'::uuid), 'Private Fixture Lane 77', 'exact address is copied only to the private location table');
select is((select public_label from public.report_public_locations where report_id = :'submitted_report_id'::uuid), 'Harborfield North (Synthetic)', 'public location representation is copied separately');
select is((select count(*)::integer from public.moderation_cases where id = :'submitted_moderation_case_id'::uuid), 0, 'the citizen cannot read the private moderation case');
select is(pg_temp.audit_count('report_submitted_for_text_moderation', 'b2000000-0000-4000-8000-000000000002'), 1, 'submission appends one audit event');
select is((select count(*)::integer from public.report_status_events where report_id = :'submitted_report_id'::uuid and visibility = 'reporter'), 1, 'pending moderation is reported privately to the owner');
select is(
  (select report_id from public.submit_verified_report(:'draft_draft_id'::uuid, 1, 'b2000000-0000-4000-8000-000000000001', 'b2000000-0000-4000-8000-000000000002')),
  :'submitted_report_id'::uuid,
  'submission replay returns the original report'
);
select is((select count(*)::integer from public.reports where source_draft_id = :'draft_draft_id'::uuid), 1, 'submission replay cannot create a duplicate report');
select is(
  (select report_id from public.submit_verified_report(:'draft_draft_id'::uuid, 99, 'b2000000-0000-4000-8000-000000000003', 'b2000000-0000-4000-8000-000000000004')),
  :'submitted_report_id'::uuid,
  'a refresh with a lost idempotency key still returns the existing report'
);
select ok(pg_temp.command_is_denied(format($command$update public.reports set publication_state = 'published' where id = '%s'$command$, :'submitted_report_id')), 'citizens cannot directly publish their report');
select ok(pg_temp.command_is_denied(format($command$select * from public.finalize_text_moderation('%s', 'approved', 'forged', 'b2000000-0000-4000-8000-000000000005', 'b2000000-0000-4000-8000-000000000006')$command$, :'submitted_report_id')), 'citizens cannot forge a moderation result');
reset role;

set local role anon;
select is((select count(*)::integer from public.public_reports where public_id = :'submitted_public_id'), 0, 'pending text never appears in the public view');
select is((select count(*)::integer from public.find_duplicate_candidates(0, 0, '30000000-0000-4000-8000-000000000001', 5) where public_id = :'submitted_public_id'), 0, 'pending text never appears in duplicate suggestions');
reset role;

select set_config('request.jwt.claims', '{"role":"service_role","aal":"aal2"}', true);
set local role service_role;
select is(public.record_text_moderation_attempt(:'submitted_report_id'::uuid, 'b3000000-0000-4000-8000-000000000001'), 1, 'protected worker records the first provider attempt');
select is(public.record_text_moderation_attempt(:'submitted_report_id'::uuid, 'b3000000-0000-4000-8000-000000000002'), 2, 'protected worker records a retry without changing publication');
reset role;
select is((select publication_state::text from public.reports where id = :'submitted_report_id'::uuid), 'pending', 'provider attempts alone do not publish content');

select set_config('request.jwt.claims', '{"role":"service_role","aal":"aal2"}', true);
set local role service_role;
select report_status, publication_state
from public.finalize_text_moderation(
  :'submitted_report_id'::uuid,
  'approved',
  'local_safe_fixture',
  'b3000000-0000-4000-8000-000000000003',
  'b3000000-0000-4000-8000-000000000004'
) \gset moderated_
reset role;
select is(:'moderated_report_status'::text, 'submitted', 'an approved text decision advances only to submitted');
select is(:'moderated_publication_state'::text, 'published', 'an approved text decision opens the public gate');
select is((select state::text from public.moderation_cases where id = :'submitted_moderation_case_id'::uuid), 'approved', 'the moderation case records the approved state');
select is((select last_provider_code from public.moderation_cases where id = :'submitted_moderation_case_id'::uuid), 'local_safe_fixture', 'the private case records the provider result code');

select set_config('request.jwt.claims', '{"role":"service_role","aal":"aal2"}', true);
set local role service_role;
select is(
  (select publication_state::text from public.finalize_text_moderation(:'submitted_report_id'::uuid, 'approved', 'local_safe_fixture', 'b3000000-0000-4000-8000-000000000003', 'b3000000-0000-4000-8000-000000000004')),
  'published',
  'moderation finalization replay returns the original state'
);
reset role;
select is(pg_temp.audit_count('text_moderation_finalized', 'b3000000-0000-4000-8000-000000000004'), 1, 'moderation replay creates no duplicate audit event');

select set_config('request.jwt.claims', pg_temp.jwt_claims('c0000000-0000-4000-8000-000000000001', 'citizen.one@synthetic.invalid'), true);
set local role authenticated;
select is(
  (select publication_state::text from public.submit_verified_report(:'draft_draft_id'::uuid, 1, 'b2000000-0000-4000-8000-000000000001', 'b2000000-0000-4000-8000-000000000002')),
  'published',
  'a refresh retry with the original key returns the current published state'
);
select is(
  (select publication_state::text from public.submit_verified_report(:'draft_draft_id'::uuid, 99, 'b2000000-0000-4000-8000-000000000007', 'b2000000-0000-4000-8000-000000000008')),
  'published',
  'a lost-key retry returns the existing current published state'
);
reset role;

set local role anon;
select is((select count(*)::integer from public.public_reports where public_id = :'submitted_public_id'), 1, 'approved text becomes public');
select ok((select title from public.public_reports where public_id = :'submitted_public_id') like 'Street or footpath near %', 'public title is deterministic and location-safe');
select is((select description from public.public_reports where public_id = :'submitted_public_id'), 'A safe synthetic loose paving description for Phase 3 publication.', 'only approved description text is public');
select ok((select title || description from public.public_reports where public_id = :'submitted_public_id') not like '%Private Fixture Lane%', 'exact private address is absent from public text');
select is((select actor_type::text from public.public_report_events where public_id = :'submitted_public_id'), 'system', 'public acceptance is actor-qualified as platform system activity');
select is((select source from public.public_report_events where public_id = :'submitted_public_id'), 'system', 'public acceptance identifies its system evidence source');
select is((select count(*)::integer from public.public_report_events where public_id = :'submitted_public_id'), 1, 'only the explicitly public event appears in the public timeline');
select ok((select count(*) from public.find_duplicate_candidates(0, 0, '30000000-0000-4000-8000-000000000001', 5) where public_id = :'submitted_public_id') = 1, 'approved nearby report appears in PostGIS duplicate suggestions');
reset role;

select set_config('request.jwt.claims', pg_temp.jwt_claims('c0000000-0000-4000-8000-000000000002', 'citizen.two@synthetic.invalid'), true);
set local role authenticated;
select enabled, notification_level, support_count
from public.set_report_relationship(
  :'submitted_public_id', 'support', true, 'none',
  'b4000000-0000-4000-8000-000000000001',
  'b4000000-0000-4000-8000-000000000002'
) \gset support_
select ok(:'support_enabled'::boolean, 'a verified citizen can privately support a public report');
select is(:'support_notification_level'::text, 'none', 'support notifications default to off');
select is((select count(*)::integer from public.report_relationships where user_id = auth.uid() and kind = 'support'), 1, 'one private support row is visible to its owner');
select is((select support_count from public.set_report_relationship(:'submitted_public_id', 'support', true, 'none', 'b4000000-0000-4000-8000-000000000001', 'b4000000-0000-4000-8000-000000000002')), 1::bigint, 'support replay returns the stable aggregate');
select is((select count(*)::integer from public.report_relationships where user_id = auth.uid() and kind = 'support'), 1, 'support replay creates no duplicate relationship');
select ok((select enabled from public.get_my_report_relationship(:'submitted_public_id', 'support')), 'citizen reads their own support state');
select is((select notification_level::text from public.set_report_relationship(:'submitted_public_id', 'follow', true, 'status_only', 'b4000000-0000-4000-8000-000000000003', 'b4000000-0000-4000-8000-000000000004')), 'status_only', 'following records the explicit private notification choice');
reset role;

set local role anon;
select is((select support_count from public.public_reports where public_id = :'submitted_public_id'), 1::bigint, 'public sees only the aggregate support count');
select ok(pg_temp.command_is_denied('select * from public.report_relationships'), 'anonymous users cannot browse supporter identities');
reset role;

select set_config('request.jwt.claims', pg_temp.jwt_claims('c0000000-0000-4000-8000-000000000002', 'citizen.two@synthetic.invalid'), true);
set local role authenticated;
select ok(not (select enabled from public.set_report_relationship(:'submitted_public_id', 'support', false, 'none', 'b4000000-0000-4000-8000-000000000005', 'b4000000-0000-4000-8000-000000000006')), 'support can be undone');
select is((select support_count from public.public_reports where public_id = :'submitted_public_id'), 0::bigint, 'undo removes the report support aggregate');
select ok(not (select enabled from public.get_my_report_relationship(:'submitted_public_id', 'support')), 'relationship read reflects the undo');
reset role;

select set_config('request.jwt.claims', pg_temp.jwt_claims('c0000000-0000-4000-8000-000000000006', 'platform.admin@synthetic.invalid', 'aal2'), true);
set local role authenticated;
select ok(pg_temp.command_is_denied(format($command$select * from public.finalize_text_moderation('%s', 'approved', 'forged', 'b5000000-0000-4000-8000-000000000001', 'b5000000-0000-4000-8000-000000000002')$command$, :'submitted_report_id')), 'platform administrators cannot bypass the protected moderation worker');
reset role;

select * from finish();
rollback;
