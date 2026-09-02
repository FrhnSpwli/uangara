begin;

create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;

create temporary table taxonomy_results (
  sequence bigint generated always as identity,
  result text not null
);

create temporary table taxonomy_wallets (
  label text primary key,
  id uuid not null
);

grant insert, select on table taxonomy_results to authenticated;
grant usage, select on sequence taxonomy_results_sequence_seq to authenticated;
grant insert, select on table taxonomy_wallets to authenticated;

insert into taxonomy_results (result)
select plan(9);

insert into auth.users (id, email)
values ('33333333-3333-3333-3333-333333333333', 'wallet-taxonomy@example.com');

set local role authenticated;
set local request.jwt.claim.sub = '33333333-3333-3333-3333-333333333333';

insert into taxonomy_results (result)
select lives_ok(
  $$insert into taxonomy_wallets (label, id)
    select 'bank', public.create_wallet('Regional account', 'bank', 'Regional Bank', 0)$$,
  'bank remains an accepted wallet type with a custom provider'
);

insert into taxonomy_results (result)
select lives_ok(
  $$insert into taxonomy_wallets (label, id)
    select 'e_wallet', public.create_wallet('GoPay', 'e_wallet', 'GoPay', 0)$$,
  'e_wallet remains an accepted wallet type'
);

insert into taxonomy_results (result)
select lives_ok(
  $$insert into taxonomy_wallets (label, id)
    select 'e_money', public.create_wallet('TapCash', 'e_money', 'BNI', 0)$$,
  'e_money is accepted by the wallet creation boundary'
);

insert into taxonomy_results (result)
select lives_ok(
  $$insert into taxonomy_wallets (label, id)
    select 'cash', public.create_wallet('Cash', 'cash', null, 0)$$,
  'cash remains an accepted wallet type'
);

insert into taxonomy_results (result)
select lives_ok(
  $$insert into taxonomy_wallets (label, id)
    select 'other', public.create_wallet('Koperasi', 'other', null, 0)$$,
  'other remains an accepted wallet type'
);

insert into taxonomy_results (result)
select lives_ok(
  $$set constraints all immediate; set constraints all deferred$$,
  'all taxonomy wallets retain a valid opening-balance pair'
);

insert into taxonomy_results (result)
select results_eq(
  $$select type, institution
    from public.wallets
    where id = (select id from taxonomy_wallets where label = 'e_money')$$,
  $$values ('e_money'::text, 'BNI'::text)$$,
  'e_money preserves its provider metadata'
);

insert into taxonomy_results (result)
select results_eq(
  $$select balance
    from public.wallet_balances
    where wallet_id = (select id from taxonomy_wallets where label = 'e_money')$$,
  array['0'],
  'e_money retains the uniform zero opening-balance ledger representation'
);

insert into taxonomy_results (result)
select throws_ok(
  $$select public.create_wallet('Invalid', 'unsupported', null, 0)$$,
  '22023',
  null,
  'unsupported wallet types remain rejected'
);

reset role;

insert into taxonomy_results (result)
select * from finish();

select result
from taxonomy_results
order by sequence;

rollback;
