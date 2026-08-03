begin;

create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;

select plan(36);

select ok(
  exists(select 1 from pg_extension where extname = 'postgis'),
  'PostGIS is enabled'
);

select ok(to_regtype('public.membership_preset') is not null, 'membership preset enum exists');
select ok(to_regtype('public.report_status') is not null, 'report status enum exists');
select ok(to_regtype('public.report_close_reason') is not null, 'close reason enum exists');
select ok(to_regtype('public.moderation_state') is not null, 'moderation state enum exists');
select ok(to_regtype('public.delivery_state') is not null, 'delivery state enum exists');

select ok(to_regclass('public.organizations') is not null, 'organizations exists');
select ok(to_regclass('public.jurisdictions') is not null, 'jurisdictions exists');
select ok(to_regclass('public.jurisdiction_versions') is not null, 'jurisdiction versions exists');
select ok(to_regclass('public.categories') is not null, 'categories exists');
select ok(to_regclass('public.organization_categories') is not null, 'organization categories exists');
select ok(to_regclass('public.profiles') is not null, 'profiles exists');
select ok(to_regclass('public.organization_memberships') is not null, 'organization memberships exists');
select ok(to_regclass('public.platform_memberships') is not null, 'platform memberships exists');
select ok(to_regclass('public.report_drafts') is not null, 'verified report drafts exists');
select ok(to_regclass('public.reports') is not null, 'reports exists');
select ok(to_regclass('public.reporter_identities') is not null, 'private reporter identities exists');
select ok(to_regclass('public.report_exact_locations') is not null, 'exact locations exist separately');
select ok(to_regclass('public.report_public_locations') is not null, 'public locations exist separately');
select ok(to_regclass('public.report_status_events') is not null, 'status events exist');
select ok(to_regclass('public.report_relationships') is not null, 'follow/support relationships exist');
select ok(to_regclass('public.report_assignments') is not null, 'assignments exist');
select ok(to_regclass('public.report_internal_notes') is not null, 'internal notes exist');
select ok(to_regclass('public.report_information_requests') is not null, 'information requests exist');
select ok(to_regclass('public.report_duplicate_links') is not null, 'duplicate links exist');
select ok(to_regclass('public.moderation_cases') is not null, 'moderation cases exist');
select ok(to_regclass('public.moderation_signals') is not null, 'moderation signals exist');
select ok(to_regclass('public.moderation_actions') is not null, 'moderation actions exist');
select ok(to_regclass('public.integration_endpoints') is not null, 'single pilot destination exists');
select ok(to_regclass('public.integration_deliveries') is not null, 'delivery state exists');
select ok(to_regclass('public.audit_events') is not null, 'append-only audit exists');
select ok(to_regclass('public.idempotency_keys') is not null, 'idempotency records exist');
select ok(to_regclass('public.legal_access_grants') is not null, 'restricted legal grants exist');

select ok(to_regclass('public.public_reports') is not null, 'public-safe report view exists');
select ok(to_regclass('public.public_report_events') is not null, 'public-safe event view exists');

select ok(
  (
    select count(*) = 27
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relname in (
        'organizations', 'jurisdictions', 'jurisdiction_versions', 'categories',
        'organization_categories', 'profiles', 'organization_memberships',
        'platform_memberships', 'report_drafts', 'reports', 'reporter_identities',
        'report_exact_locations', 'report_public_locations', 'report_status_events',
        'report_relationships', 'report_assignments', 'report_internal_notes',
        'report_information_requests', 'report_duplicate_links', 'moderation_cases',
        'moderation_signals', 'moderation_actions', 'integration_endpoints',
        'integration_deliveries', 'audit_events', 'idempotency_keys',
        'legal_access_grants'
      )
      and c.relrowsecurity
  ),
  'RLS is enabled on every Phase 2 client-facing table'
);

select * from finish();
rollback;
