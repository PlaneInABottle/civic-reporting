create function public.current_actor_context()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  caller_id uuid := auth.uid();
  organization_roles jsonb;
  platform_roles jsonb;
begin
  if not public.is_verified_user() then
    raise exception using errcode = '42501', message = 'verified_identity_required';
  end if;

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'organizationId', membership.organization_id,
        'preset', membership.preset
      ) order by membership.organization_id, membership.preset
    ),
    '[]'::jsonb
  ) into organization_roles
  from public.organization_memberships membership
  where membership.user_id = caller_id and membership.is_active;

  select coalesce(
    jsonb_agg(to_jsonb(membership.preset) order by membership.preset),
    '[]'::jsonb
  ) into platform_roles
  from public.platform_memberships membership
  where membership.user_id = caller_id
    and membership.is_active
    and (membership.expires_at is null or membership.expires_at > statement_timestamp());

  return jsonb_build_object(
    'userId', caller_id,
    'email', auth.jwt() ->> 'email',
    'aal', public.current_aal(),
    'organizationRoles', organization_roles,
    'platformRoles', platform_roles
  );
end;
$$;

revoke all on function public.current_actor_context() from public, anon;
grant execute on function public.current_actor_context() to authenticated;
