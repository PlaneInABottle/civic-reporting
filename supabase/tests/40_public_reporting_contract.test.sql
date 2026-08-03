begin;

set local search_path = public, extensions, pg_temp;

select plan(14);

select has_function(
  'public',
  'find_duplicate_candidates',
  array['double precision', 'double precision', 'uuid', 'integer'],
  'duplicate lookup is exposed through a narrow public-safe RPC'
);
select has_function(
  'public',
  'submit_verified_report',
  array['uuid', 'integer', 'uuid', 'uuid'],
  'verified draft submission is an atomic RPC'
);
select has_function(
  'public',
  'record_text_moderation_attempt',
  array['uuid', 'uuid'],
  'the protected moderation worker records bounded attempts'
);
select has_function(
  'public',
  'finalize_text_moderation',
  array['uuid', 'text', 'text', 'uuid', 'uuid'],
  'the protected moderation worker owns publication decisions'
);
select has_function(
  'public',
  'set_report_relationship',
  array['text', 'relationship_kind', 'boolean', 'notification_level', 'uuid', 'uuid'],
  'private support and follow changes use one atomic RPC'
);
select has_function(
  'public',
  'get_my_report_relationship',
  array['text', 'relationship_kind'],
  'a citizen can read only their relationship state through a narrow RPC'
);

select has_column(
  'public',
  'moderation_cases',
  'provider_attempt_count',
  'moderation attempts are tracked without exposing provider details publicly'
);
select has_column(
  'public',
  'moderation_cases',
  'last_provider_code',
  'the private moderation case records the last provider outcome code'
);
select has_column(
  'public',
  'public_reports',
  'category_name',
  'public list rows include a safe category label'
);
select has_column(
  'public',
  'public_reports',
  'support_count',
  'public list rows expose only an aggregate support count'
);
select has_column(
  'public',
  'public_report_events',
  'actor_type',
  'public timeline rows preserve the qualified actor type'
);
select has_column(
  'public',
  'public_report_events',
  'source',
  'public timeline rows preserve the evidence source'
);

select function_privs_are(
  'public',
  'finalize_text_moderation',
  array['uuid', 'text', 'text', 'uuid', 'uuid'],
  'authenticated',
  array[]::text[],
  'citizen clients cannot finalize moderation or publication'
);
select function_privs_are(
  'public',
  'record_text_moderation_attempt',
  array['uuid', 'uuid'],
  'authenticated',
  array[]::text[],
  'citizen clients cannot forge provider attempts'
);

select * from finish();
rollback;
