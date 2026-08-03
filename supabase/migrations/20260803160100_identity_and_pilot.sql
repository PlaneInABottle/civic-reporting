create table public.organizations (
  id uuid primary key default extensions.gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  name text not null check (char_length(name) between 3 and 120),
  synthetic_notice text not null,
  is_pilot boolean not null default false,
  is_test_fixture boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index organizations_one_pilot_idx
  on public.organizations (is_pilot)
  where is_pilot;

create trigger organizations_set_updated_at
before update on public.organizations
for each row execute function public.set_updated_at();

create table public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  public_alias text check (public_alias is null or char_length(public_alias) between 2 and 60),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create function public.create_profile_for_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (user_id) values (new.id)
  on conflict (user_id) do nothing;
  return new;
end;
$$;

create trigger auth_user_created_profile
after insert on auth.users
for each row execute function public.create_profile_for_auth_user();

revoke all on function public.create_profile_for_auth_user() from public, anon, authenticated;

create table public.jurisdictions (
  id uuid primary key default extensions.gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  slug text not null,
  name text not null,
  is_synthetic boolean not null default true,
  created_at timestamptz not null default now(),
  unique (organization_id, slug)
);

create table public.jurisdiction_versions (
  id uuid primary key default extensions.gen_random_uuid(),
  jurisdiction_id uuid not null references public.jurisdictions(id) on delete restrict,
  version integer not null check (version > 0),
  boundary extensions.geography(MultiPolygon, 4326),
  policy_label text not null,
  active_from timestamptz not null,
  retired_at timestamptz,
  created_at timestamptz not null default now(),
  unique (jurisdiction_id, version),
  check (retired_at is null or retired_at > active_from)
);

create index jurisdiction_versions_boundary_idx
  on public.jurisdiction_versions using gist (boundary);

create table public.categories (
  id uuid primary key default extensions.gen_random_uuid(),
  key text not null unique check (key ~ '^[a-z0-9_]+$'),
  name text not null,
  emergency_exclusion text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.organization_categories (
  id uuid primary key default extensions.gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  jurisdiction_id uuid not null references public.jurisdictions(id) on delete restrict,
  category_id uuid not null references public.categories(id) on delete restrict,
  version integer not null default 1 check (version > 0),
  routing_label text not null,
  public_location_precision public.location_precision not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (organization_id, jurisdiction_id, category_id, version)
);

create table public.organization_memberships (
  id uuid primary key default extensions.gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  preset public.membership_preset not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, user_id, preset)
);

create index organization_memberships_user_idx
  on public.organization_memberships (user_id, organization_id)
  where is_active;

create trigger organization_memberships_set_updated_at
before update on public.organization_memberships
for each row execute function public.set_updated_at();

create table public.platform_memberships (
  id uuid primary key default extensions.gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  preset public.platform_preset not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  expires_at timestamptz,
  unique (user_id, preset),
  check (expires_at is null or expires_at > created_at)
);
