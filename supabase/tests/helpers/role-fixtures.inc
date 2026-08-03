insert into auth.users ( id, aud, role, email, email_confirmed_at,
raw_app_meta_data, raw_user_meta_data, created_at, updated_at ) values
('c0000000-0000-4000-8000-000000000001', 'authenticated', 'authenticated',
'citizen.one@synthetic.invalid', now(),
'{"provider":"email","providers":["email"]}', '{}', now(), now()),
('c0000000-0000-4000-8000-000000000002', 'authenticated', 'authenticated',
'citizen.two@synthetic.invalid', now(),
'{"provider":"email","providers":["email"]}', '{}', now(), now()),
('c0000000-0000-4000-8000-000000000003', 'authenticated', 'authenticated',
'operator@synthetic.invalid', now(),
'{"provider":"email","providers":["email"]}', '{}', now(), now()),
('c0000000-0000-4000-8000-000000000004', 'authenticated', 'authenticated',
'moderator@synthetic.invalid', now(),
'{"provider":"email","providers":["email"]}', '{}', now(), now()),
('c0000000-0000-4000-8000-000000000005', 'authenticated', 'authenticated',
'org.admin@synthetic.invalid', now(),
'{"provider":"email","providers":["email"]}', '{}', now(), now()),
('c0000000-0000-4000-8000-000000000006', 'authenticated', 'authenticated',
'platform.admin@synthetic.invalid', now(),
'{"provider":"email","providers":["email"]}', '{}', now(), now()),
('c0000000-0000-4000-8000-000000000007', 'authenticated', 'authenticated',
'legal.escalator@synthetic.invalid', now(),
'{"provider":"email","providers":["email"]}', '{}', now(), now()); insert into
public.organization_memberships ( organization_id, user_id, preset ) values
('10000000-0000-4000-8000-000000000001', 'c0000000-0000-4000-8000-000000000003',
'operator'), ('10000000-0000-4000-8000-000000000001',
'c0000000-0000-4000-8000-000000000004', 'moderator'),
('10000000-0000-4000-8000-000000000001', 'c0000000-0000-4000-8000-000000000005',
'organization_admin'); insert into public.platform_memberships (user_id, preset)
values ('c0000000-0000-4000-8000-000000000006', 'platform_admin'),
('c0000000-0000-4000-8000-000000000007', 'legal_escalator'); insert into
public.reporter_identities ( report_id, reporter_user_id, contact_email,
verified_at ) values ('40000000-0000-4000-8000-000000000001',
'c0000000-0000-4000-8000-000000000001', 'citizen.one@synthetic.invalid', now()),
('40000000-0000-4000-8000-000000000002', 'c0000000-0000-4000-8000-000000000001',
'citizen.one@synthetic.invalid', now()); insert into
public.report_internal_notes ( id, report_id, organization_id, author_user_id,
body ) values ( 'd0000000-0000-4000-8000-000000000001',
'40000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000001',
'c0000000-0000-4000-8000-000000000003', 'Synthetic internal note visible only to
scoped operators.' ); insert into public.organizations ( id, slug, name,
synthetic_notice, is_pilot, is_test_fixture ) values (
'90000000-0000-4000-8000-000000000001', 'isolation-test-only', 'Isolation Test
Organization (Synthetic)', 'Transaction-only cross-organization fixture — not a
real service.', false, true ); insert into public.jurisdictions (id,
organization_id, slug, name, is_synthetic) values (
'90000000-0000-4000-8000-000000000002', '90000000-0000-4000-8000-000000000001',
'isolation-test-area', 'Isolation Test Area (Synthetic)', true ); insert into
public.jurisdiction_versions ( id, jurisdiction_id, version, policy_label,
active_from ) values ( '90000000-0000-4000-8000-000000000003',
'90000000-0000-4000-8000-000000000002', 1, 'Transaction-only test boundary',
now() ); insert into public.organization_categories ( id, organization_id,
jurisdiction_id, category_id, version, routing_label, public_location_precision,
is_active ) values ( '90000000-0000-4000-8000-000000000004',
'90000000-0000-4000-8000-000000000001', '90000000-0000-4000-8000-000000000002',
'20000000-0000-4000-8000-000000000001', 1, 'Transaction-only test route',
'withheld', true ); insert into public.reports ( id, public_id, organization_id,
jurisdiction_id, jurisdiction_version_id, organization_category_id, description,
status, publication_state ) values ( '90000000-0000-4000-8000-000000000005',
'HBR-CROSS-ORG-TEST', '90000000-0000-4000-8000-000000000001',
'90000000-0000-4000-8000-000000000002', '90000000-0000-4000-8000-000000000003',
'90000000-0000-4000-8000-000000000004', 'Synthetic transaction-only
cross-organization report.', 'submitted', 'private' ); insert into
public.audit_events ( organization_id, actor_type, action, entity_type,
entity_id, summary, correlation_id ) values (
'90000000-0000-4000-8000-000000000001', 'system', 'cross_org_fixture', 'report',
'90000000-0000-4000-8000-000000000005', 'Transaction-only cross-organization
audit fixture.', '90000000-0000-4000-8000-000000000006' ); insert into
public.legal_access_grants ( moderation_case_id, grantee_user_id,
approved_by_user_id, reason, expires_at ) values (
'60000000-0000-4000-8000-000000000001', 'c0000000-0000-4000-8000-000000000007',
'c0000000-0000-4000-8000-000000000006', 'Synthetic transaction-only
authorization-boundary test.', now() + interval '15 minutes' ); create function
pg_temp.jwt_claims( test_user_id uuid, test_email text, test_aal text default
'aal1' ) returns text language sql as $$ select jsonb_build_object( 'sub',
test_user_id, 'role', 'authenticated', 'email', test_email, 'aal', test_aal,
'is_anonymous', false )::text; $$; create function
pg_temp.command_is_denied(command text) returns boolean language plpgsql as $$
begin execute command; return false; exception when insufficient_privilege then
return true; end; $$; create function pg_temp.command_error(command text)
returns text language plpgsql as $$ begin execute command; return null;
exception when others then return sqlerrm; end; $$; create function
pg_temp.audit_count( target_action text, target_correlation_id uuid default
null, target_entity_id uuid default null ) returns integer language sql security
definer set search_path = '' as $$ select count(*)::integer from
public.audit_events event where event.action = target_action and
(target_correlation_id is null or event.correlation_id = target_correlation_id)
and (target_entity_id is null or event.entity_id = target_entity_id); $$; create
function pg_temp.status_event_count(target_correlation_id uuid) returns integer
language sql security definer set search_path = '' as $$ select
count(*)::integer from public.report_status_events event where
event.correlation_id = target_correlation_id; $$; create function
pg_temp.moderation_action_count(target_correlation_id uuid) returns integer
language sql security definer set search_path = '' as $$ select
count(*)::integer from public.moderation_actions action where
action.correlation_id = target_correlation_id; $$;
