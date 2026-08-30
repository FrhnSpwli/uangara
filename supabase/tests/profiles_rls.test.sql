begin;

create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;

create temporary table tap_results (
  sequence bigint generated always as identity,
  result text not null
);

grant insert, select on table tap_results to anon, authenticated;
grant usage, select on sequence tap_results_sequence_seq to anon, authenticated;

insert into tap_results (result)
select plan(26);

insert into auth.users (id, email)
values
  ('11111111-1111-1111-1111-111111111111', 'owner@example.com'),
  ('22222222-2222-2222-2222-222222222222', 'other@example.com'),
  ('33333333-3333-3333-3333-333333333333', 'recovery@example.com');

insert into tap_results (result)
select results_eq(
  $$select count(*)::integer from public.profiles$$,
  array[3],
  'the auth trigger creates one profile for every new user'
);

delete from public.profiles
where id = '33333333-3333-3333-3333-333333333333';

insert into tap_results (result)
select ok(
  (select relrowsecurity from pg_class where oid = 'public.profiles'::regclass),
  'RLS is enabled on profiles'
);

insert into tap_results (result)
select ok(
  not has_table_privilege('anon', 'public.profiles', 'select,insert,update,delete'),
  'anon holds no profile table privileges'
);

insert into tap_results (result)
select ok(
  has_table_privilege('authenticated', 'public.profiles', 'select'),
  'authenticated users can select profiles subject to RLS'
);

insert into tap_results (result)
select ok(
  has_column_privilege('authenticated', 'public.profiles', 'id', 'insert'),
  'authenticated users can insert their own profile id'
);

insert into tap_results (result)
select ok(
  has_column_privilege('authenticated', 'public.profiles', 'display_name', 'insert'),
  'authenticated users can insert their own display name'
);

insert into tap_results (result)
select ok(
  has_column_privilege('authenticated', 'public.profiles', 'display_name', 'update'),
  'authenticated users can update display_name'
);

insert into tap_results (result)
select ok(
  not has_column_privilege('authenticated', 'public.profiles', 'id', 'update'),
  'authenticated users cannot update profile ownership'
);

insert into tap_results (result)
select ok(
  not has_column_privilege('authenticated', 'public.profiles', 'created_at', 'update'),
  'authenticated users cannot update created_at'
);

insert into tap_results (result)
select ok(
  not has_column_privilege('authenticated', 'public.profiles', 'updated_at', 'update'),
  'authenticated users cannot update updated_at directly'
);

insert into tap_results (result)
select ok(
  not has_table_privilege('authenticated', 'public.profiles', 'delete'),
  'authenticated users cannot delete profiles'
);

set local role anon;

insert into tap_results (result)
select throws_ok(
  $$select * from public.profiles$$,
  '42501',
  null,
  'anon cannot read profiles'
);

insert into tap_results (result)
select throws_ok(
  $$insert into public.profiles (id) values ('33333333-3333-3333-3333-333333333333')$$,
  '42501',
  null,
  'anon cannot create profiles'
);

insert into tap_results (result)
select throws_ok(
  $$update public.profiles set display_name = 'Anonymous'$$,
  '42501',
  null,
  'anon cannot update profiles'
);

insert into tap_results (result)
select throws_ok(
  $$delete from public.profiles$$,
  '42501',
  null,
  'anon cannot delete profiles'
);

set local role authenticated;
set local request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';

insert into tap_results (result)
select results_eq(
  $$select id::text from public.profiles order by id$$,
  array['11111111-1111-1111-1111-111111111111'],
  'the owner reads only their own profile'
);

insert into tap_results (result)
select results_eq(
  $$update public.profiles
    set display_name = 'Owner'
    where id = '11111111-1111-1111-1111-111111111111'
    returning display_name$$,
  array['Owner'],
  'the owner updates their display name'
);

insert into tap_results (result)
select is_empty(
  $$update public.profiles
    set display_name = 'Stolen'
    where id = '22222222-2222-2222-2222-222222222222'
    returning display_name$$,
  'the owner cannot update another profile'
);

insert into tap_results (result)
select throws_ok(
  $$update public.profiles
    set id = '33333333-3333-3333-3333-333333333333'
    where id = '11111111-1111-1111-1111-111111111111'$$,
  '42501',
  null,
  'the owner cannot reassign their profile id'
);

insert into tap_results (result)
select throws_ok(
  $$update public.profiles
    set created_at = now()
    where id = '11111111-1111-1111-1111-111111111111'$$,
  '42501',
  null,
  'the owner cannot rewrite profile timestamps'
);

set local request.jwt.claim.sub = '22222222-2222-2222-2222-222222222222';

insert into tap_results (result)
select results_eq(
  $$select id::text from public.profiles order by id$$,
  array['22222222-2222-2222-2222-222222222222'],
  'another user reads only their own profile'
);

insert into tap_results (result)
select is_empty(
  $$update public.profiles
    set display_name = 'Stolen'
    where id = '11111111-1111-1111-1111-111111111111'
    returning display_name$$,
  'another user cannot update the owner profile'
);

insert into tap_results (result)
select throws_ok(
  $$insert into public.profiles (id)
    values ('33333333-3333-3333-3333-333333333333')$$,
  '42501',
  null,
  'another user cannot create a profile for someone else'
);

set local request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';

insert into tap_results (result)
select results_eq(
  $$select display_name from public.profiles
    where id = '11111111-1111-1111-1111-111111111111'$$,
  array['Owner'],
  'denied cross-user writes leave the owner profile intact'
);

set local request.jwt.claim.sub = '33333333-3333-3333-3333-333333333333';

insert into tap_results (result)
select results_eq(
  $$insert into public.profiles (id, display_name)
    values ('33333333-3333-3333-3333-333333333333', 'Recovered')
    returning display_name$$,
  array['Recovered'],
  'a user can recover their own missing profile'
);

set local request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';

insert into tap_results (result)
select throws_ok(
  $$delete from public.profiles
    where id = '11111111-1111-1111-1111-111111111111'$$,
  '42501',
  null,
  'clients cannot delete profiles'
);

insert into tap_results (result)
select * from finish();

select result
from tap_results
order by sequence;

rollback;
