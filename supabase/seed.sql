-- Local-only, unmistakably synthetic fixtures. None represent a real place,
-- government service, recipient, provider, or person.

insert into public.organizations (
  id, slug, name, synthetic_notice, is_pilot, is_test_fixture
)
values (
  '10000000-0000-4000-8000-000000000001',
  'harborfield-fictional-pilot',
  'Harborfield Civic Works Lab (Fictional)',
  'Synthetic local pilot only — not a real government service.',
  true,
  false
)
on conflict (id) do nothing;

insert into public.jurisdictions (
  id, organization_id, slug, name, is_synthetic
)
values (
  '10000000-0000-4000-8000-000000000002',
  '10000000-0000-4000-8000-000000000001',
  'harborfield-pilot-district',
  'Harborfield Pilot District (Synthetic)',
  true
)
on conflict (id) do nothing;

insert into public.jurisdiction_versions (
  id, jurisdiction_id, version, boundary, policy_label, active_from
)
values (
  '10000000-0000-4000-8000-000000000003',
  '10000000-0000-4000-8000-000000000002',
  1,
  extensions.st_geogfromtext(
    'SRID=4326;MULTIPOLYGON(((-0.05 -0.05,0.05 -0.05,0.05 0.05,-0.05 0.05,-0.05 -0.05)))'
  ),
  'Synthetic boundary v1 — not for real routing',
  '2026-08-03T00:00:00Z'
)
on conflict (id) do nothing;

insert into public.categories (id, key, name, emergency_exclusion)
values
  (
    '20000000-0000-4000-8000-000000000001',
    'street_or_footpath',
    'Street or footpath',
    'Not for emergencies, active hazards, or requests needing immediate response.'
  ),
  (
    '20000000-0000-4000-8000-000000000002',
    'street_lighting',
    'Street lighting',
    'Not for exposed live wiring or immediate danger.'
  ),
  (
    '20000000-0000-4000-8000-000000000003',
    'drainage',
    'Drainage',
    'Not for active flooding or immediate danger.'
  ),
  (
    '20000000-0000-4000-8000-000000000004',
    'waste',
    'Waste',
    'Not for hazardous materials or immediate danger.'
  )
on conflict (id) do nothing;

insert into public.organization_categories (
  id, organization_id, jurisdiction_id, category_id, version,
  routing_label, public_location_precision, is_active
)
values
  (
    '30000000-0000-4000-8000-000000000001',
    '10000000-0000-4000-8000-000000000001',
    '10000000-0000-4000-8000-000000000002',
    '20000000-0000-4000-8000-000000000001',
    1,
    'Synthetic streets queue',
    'neighborhood',
    true
  ),
  (
    '30000000-0000-4000-8000-000000000002',
    '10000000-0000-4000-8000-000000000001',
    '10000000-0000-4000-8000-000000000002',
    '20000000-0000-4000-8000-000000000002',
    1,
    'Synthetic lighting queue',
    'block',
    true
  ),
  (
    '30000000-0000-4000-8000-000000000003',
    '10000000-0000-4000-8000-000000000001',
    '10000000-0000-4000-8000-000000000002',
    '20000000-0000-4000-8000-000000000003',
    1,
    'Synthetic drainage queue',
    'neighborhood',
    true
  ),
  (
    '30000000-0000-4000-8000-000000000004',
    '10000000-0000-4000-8000-000000000001',
    '10000000-0000-4000-8000-000000000002',
    '20000000-0000-4000-8000-000000000004',
    1,
    'Synthetic waste queue',
    'neighborhood',
    true
  )
on conflict (id) do nothing;

insert into public.reports (
  id, public_id, organization_id, jurisdiction_id, jurisdiction_version_id,
  organization_category_id, description, public_title, public_description,
  status, publication_state, status_version, accepted_at
)
values
  (
    '40000000-0000-4000-8000-000000000001',
    'HBR-SYNTHETIC-1',
    '10000000-0000-4000-8000-000000000001',
    '10000000-0000-4000-8000-000000000002',
    '10000000-0000-4000-8000-000000000003',
    '30000000-0000-4000-8000-000000000001',
    'Synthetic sample: a small crack in a fictional footpath.',
    'Synthetic footpath sample',
    'A fictional footpath issue used only to test the public-safe view.',
    'received',
    'published',
    2,
    '2026-08-03T00:00:00Z'
  ),
  (
    '40000000-0000-4000-8000-000000000002',
    'HBR-SYNTHETIC-PRIVATE',
    '10000000-0000-4000-8000-000000000001',
    '10000000-0000-4000-8000-000000000002',
    '10000000-0000-4000-8000-000000000003',
    '30000000-0000-4000-8000-000000000002',
    'Synthetic private text awaiting local moderation boundary tests.',
    null,
    null,
    'pending_moderation',
    'pending',
    1,
    '2026-08-03T00:05:00Z'
  )
on conflict (id) do nothing;

insert into public.report_exact_locations (report_id, exact_location, exact_address)
values
  (
    '40000000-0000-4000-8000-000000000001',
    extensions.st_setsrid(extensions.st_makepoint(0.0042, 0.0031), 4326)::extensions.geography,
    'Synthetic Block 7, Fixture Lane'
  ),
  (
    '40000000-0000-4000-8000-000000000002',
    extensions.st_setsrid(extensions.st_makepoint(0.0084, 0.0062), 4326)::extensions.geography,
    'Synthetic Block 9, Fixture Lane'
  )
on conflict (report_id) do nothing;

insert into public.report_public_locations (
  report_id, public_location, public_label, precision, policy_version
)
values
  (
    '40000000-0000-4000-8000-000000000001',
    extensions.st_setsrid(extensions.st_makepoint(0, 0), 4326)::extensions.geography,
    'Harborfield North (Synthetic)',
    'neighborhood',
    1
  ),
  (
    '40000000-0000-4000-8000-000000000002',
    extensions.st_setsrid(extensions.st_makepoint(0.01, 0.01), 4326)::extensions.geography,
    'Harborfield East (Synthetic)',
    'block',
    1
  )
on conflict (report_id) do nothing;

insert into public.report_status_events (
  id, report_id, organization_id, actor_type, source, previous_status,
  new_status, public_label, private_reason, visibility, correlation_id, created_at
)
values (
  '50000000-0000-4000-8000-000000000001',
  '40000000-0000-4000-8000-000000000001',
  '10000000-0000-4000-8000-000000000001',
  'system',
  'system',
  'submitted',
  'received',
  'Received by the synthetic pilot fixture',
  'Synthetic seed transition; never delivered to a recipient.',
  'public',
  '80000000-0000-4000-8000-000000000001',
  '2026-08-03T00:01:00Z'
)
on conflict (id) do nothing;

insert into public.moderation_cases (
  id, report_id, organization_id, state, version
)
values (
  '60000000-0000-4000-8000-000000000001',
  '40000000-0000-4000-8000-000000000002',
  '10000000-0000-4000-8000-000000000001',
  'pending',
  1
)
on conflict (id) do nothing;

insert into public.moderation_signals (
  id, moderation_case_id, signal_kind, signal_code, confidence
)
values (
  '60000000-0000-4000-8000-000000000002',
  '60000000-0000-4000-8000-000000000001',
  'synthetic_fixture',
  'safe_test_only',
  1
)
on conflict (id) do nothing;

insert into public.integration_endpoints (
  id, organization_id, destination_kind, redacted_destination_label,
  configuration_state, is_active
)
values (
  '70000000-0000-4000-8000-000000000001',
  '10000000-0000-4000-8000-000000000001',
  'local_fake',
  'Disabled synthetic recipient',
  'disabled',
  false
)
on conflict (id) do nothing;

insert into public.audit_events (
  id, organization_id, actor_type, action, entity_type, entity_id,
  summary, correlation_id, created_at
)
values (
  '80000000-0000-4000-8000-000000000002',
  '10000000-0000-4000-8000-000000000001',
  'system',
  'synthetic_seed_loaded',
  'organization',
  '10000000-0000-4000-8000-000000000001',
  'Loaded safe local-only Phase 2 fixtures.',
  '80000000-0000-4000-8000-000000000003',
  '2026-08-03T00:00:00Z'
)
on conflict (id) do nothing;
