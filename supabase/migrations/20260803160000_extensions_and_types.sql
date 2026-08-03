create schema if not exists extensions;

create extension if not exists pgcrypto with schema extensions;
create extension if not exists postgis with schema extensions;

create type public.membership_preset as enum (
  'operator',
  'moderator',
  'organization_admin'
);

create type public.platform_preset as enum (
  'platform_admin',
  'legal_escalator'
);

create type public.report_status as enum (
  'draft',
  'pending_verification',
  'pending_moderation',
  'submitted',
  'received',
  'needs_information',
  'in_progress',
  'resolved',
  'closed'
);

create type public.report_close_reason as enum (
  'duplicate',
  'out_of_service_area',
  'no_action_planned',
  'content_policy',
  'withdrawn'
);

create type public.publication_state as enum (
  'private',
  'pending',
  'approved',
  'published',
  'rejected'
);

create type public.actor_type as enum (
  'citizen',
  'operator',
  'moderator',
  'organization_admin',
  'platform_admin',
  'legal_escalator',
  'integration',
  'system'
);

create type public.event_visibility as enum (
  'public',
  'reporter',
  'staff',
  'organization_admin',
  'platform_metadata',
  'private'
);

create type public.relationship_kind as enum ('support', 'follow');
create type public.notification_level as enum ('none', 'status_only', 'all_updates');
create type public.location_precision as enum ('exact', 'block', 'neighborhood', 'withheld');
create type public.moderation_state as enum ('pending', 'approved', 'rejected', 'escalated');
create type public.delivery_state as enum (
  'queued',
  'attempting',
  'delivered',
  'acknowledged',
  'retry_scheduled',
  'failed',
  'cancelled'
);

create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = statement_timestamp();
  return new;
end;
$$;

create function public.generate_public_report_id()
returns text
language sql
volatile
set search_path = ''
as $$
  select 'HBR-' || upper(substr(encode(extensions.gen_random_bytes(8), 'hex'), 1, 12));
$$;

alter default privileges for role postgres in schema public revoke all on tables from anon, authenticated;
alter default privileges for role postgres in schema public revoke execute on functions from public, anon, authenticated;

revoke all on function public.set_updated_at() from public, anon, authenticated;
revoke all on function public.generate_public_report_id() from public, anon, authenticated;
