begin;

set local search_path = public, extensions, pg_temp;
\ir helpers/role-fixtures.inc

select plan(12);

set local role anon;
select is(
  pg_temp.command_error($command$select public.current_actor_context()$command$),
  'permission denied for function current_actor_context',
  'anonymous callers cannot request an actor context'
);
reset role;

select set_config('request.jwt.claims', pg_temp.jwt_claims('c0000000-0000-4000-8000-000000000001', 'citizen.one@synthetic.invalid'), true);
set local role authenticated;
select is(public.current_actor_context() ->> 'userId', 'c0000000-0000-4000-8000-000000000001', 'context is bound to the caller identity');
select is(public.current_actor_context() ->> 'email', 'citizen.one@synthetic.invalid', 'context uses the verified JWT email');
select is(public.current_actor_context() ->> 'aal', 'aal1', 'context exposes the current assurance level');
select is(jsonb_array_length(public.current_actor_context() -> 'organizationRoles'), 0, 'citizen receives no staff preset');
select is(jsonb_array_length(public.current_actor_context() -> 'platformRoles'), 0, 'citizen receives no platform preset');
reset role;

select set_config('request.jwt.claims', pg_temp.jwt_claims('c0000000-0000-4000-8000-000000000003', 'operator@synthetic.invalid'), true);
set local role authenticated;
select is(public.current_actor_context() #>> '{organizationRoles,0,preset}', 'operator', 'operator receives only the scoped preset');
select is(public.current_actor_context() #>> '{organizationRoles,0,organizationId}', '10000000-0000-4000-8000-000000000001', 'operator context carries the organization scope');
select is(jsonb_array_length(public.current_actor_context() -> 'platformRoles'), 0, 'operator does not inherit platform access');
reset role;

select set_config('request.jwt.claims', pg_temp.jwt_claims('c0000000-0000-4000-8000-000000000006', 'platform.admin@synthetic.invalid', 'aal2'), true);
set local role authenticated;
select is(public.current_actor_context() #>> '{platformRoles,0}', 'platform_admin', 'platform preset is explicit');
select is(jsonb_array_length(public.current_actor_context() -> 'organizationRoles'), 0, 'platform admin does not become an organization data browser');
select is(public.current_actor_context() ->> 'aal', 'aal2', 'platform context preserves MFA assurance');
reset role;

select * from finish();
rollback;
