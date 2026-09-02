begin;

create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;

create temporary table tap_results (
  sequence bigint generated always as identity,
  result text not null
);

create temporary table test_ids (
  label text primary key,
  id uuid not null
);

create temporary table opening_before_update (
  wallet_id uuid primary key,
  transaction_id uuid not null,
  movement_id uuid not null,
  occurred_at timestamptz not null
);

grant insert, select on table tap_results to anon, authenticated;
grant usage, select on sequence tap_results_sequence_seq to anon, authenticated;
grant insert, select, update on table test_ids to authenticated;
grant insert, select on table opening_before_update to authenticated;

insert into tap_results (result)
select plan(75);

insert into auth.users (id, email)
values
  ('11111111-1111-1111-1111-111111111111', 'wallet-owner@example.com'),
  ('22222222-2222-2222-2222-222222222222', 'wallet-other@example.com');

insert into tap_results (result)
select has_table('public', 'wallets', 'wallets table exists');

insert into tap_results (result)
select has_table('public', 'transactions', 'transactions table exists');

insert into tap_results (result)
select has_table('public', 'wallet_movements', 'wallet movements table exists');

insert into tap_results (result)
select has_view('public', 'wallet_balances', 'wallet balances view exists');

insert into tap_results (result)
select has_view(
  'public',
  'wallet_opening_balances',
  'wallet opening balances view exists'
);

insert into tap_results (result)
select ok(
  (select relrowsecurity from pg_class where oid = 'public.wallets'::regclass),
  'RLS is enabled on wallets'
);

insert into tap_results (result)
select ok(
  (select relrowsecurity from pg_class where oid = 'public.transactions'::regclass),
  'RLS is enabled on transactions'
);

insert into tap_results (result)
select ok(
  (
    select relrowsecurity
    from pg_class
    where oid = 'public.wallet_movements'::regclass
  ),
  'RLS is enabled on wallet movements'
);

insert into tap_results (result)
select ok(
  not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'wallets'
      and column_name = 'balance'
  ),
  'wallets has no mutable balance column'
);

insert into tap_results (result)
select col_type_is(
  'public',
  'wallet_movements',
  'amount',
  'bigint',
  'movement amounts use BIGINT'
);

insert into tap_results (result)
select ok(
  coalesce(
    (
      select 'security_invoker=true' = any (reloptions)
      from pg_class
      where oid = 'public.wallet_balances'::regclass
    ),
    false
  ),
  'wallet balances is a security-invoker view'
);

insert into tap_results (result)
select ok(
  coalesce(
    (
      select 'security_invoker=true' = any (reloptions)
      from pg_class
      where oid = 'public.wallet_opening_balances'::regclass
    ),
    false
  ),
  'wallet opening balances is a security-invoker view'
);

insert into tap_results (result)
select is(
  (
    select count(*)::integer
    from pg_constraint
    where conname in (
      'wallet_movements_transaction_owner_fkey',
      'wallet_movements_wallet_owner_fkey'
    )
      and contype = 'f'
  ),
  2,
  'both owner-qualified movement foreign keys exist'
);

insert into tap_results (result)
select ok(
  to_regclass('public.wallet_movements_one_opening_per_wallet') is not null,
  'the one-opening-per-wallet index exists'
);

insert into tap_results (result)
select ok(
  to_regclass('public.wallet_movements_one_opening_per_transaction') is not null,
  'the one-opening-per-transaction index exists'
);

insert into tap_results (result)
select ok(
  not has_table_privilege(
    'anon',
    'public.wallets',
    'select,insert,update,delete'
  ),
  'anon has no wallet table privileges'
);

insert into tap_results (result)
select ok(
  not has_table_privilege(
    'anon',
    'public.transactions',
    'select,insert,update,delete'
  ),
  'anon has no transaction table privileges'
);

insert into tap_results (result)
select ok(
  not has_table_privilege(
    'anon',
    'public.wallet_movements',
    'select,insert,update,delete'
  ),
  'anon has no wallet movement table privileges'
);

insert into tap_results (result)
select ok(
  has_table_privilege('authenticated', 'public.wallets', 'select'),
  'authenticated users can select wallets subject to RLS'
);

insert into tap_results (result)
select ok(
  has_column_privilege('authenticated', 'public.wallets', 'name', 'update')
  and has_column_privilege('authenticated', 'public.wallets', 'type', 'update')
  and has_column_privilege(
    'authenticated',
    'public.wallets',
    'institution',
    'update'
  ),
  'authenticated users can update only wallet metadata columns'
);

insert into tap_results (result)
select ok(
  not has_column_privilege(
    'authenticated',
    'public.wallets',
    'user_id',
    'update'
  )
  and not has_column_privilege(
    'authenticated',
    'public.wallets',
    'archived_at',
    'update'
  )
  and not has_column_privilege(
    'authenticated',
    'public.wallets',
    'updated_at',
    'update'
  ),
  'wallet ownership, archive state, and timestamps are not directly writable'
);

insert into tap_results (result)
select ok(
  not has_table_privilege('authenticated', 'public.wallets', 'insert,delete'),
  'authenticated users cannot directly insert or delete wallets'
);

insert into tap_results (result)
select ok(
  has_table_privilege('authenticated', 'public.transactions', 'select')
  and not has_table_privilege(
    'authenticated',
    'public.transactions',
    'insert,update,delete'
  ),
  'transactions are owner-readable but not directly writable'
);

insert into tap_results (result)
select ok(
  has_table_privilege('authenticated', 'public.wallet_movements', 'select')
  and not has_table_privilege(
    'authenticated',
    'public.wallet_movements',
    'insert,update,delete'
  ),
  'wallet movements are owner-readable but not directly writable'
);

insert into tap_results (result)
select ok(
  has_function_privilege(
    'authenticated',
    'public.create_wallet(text,text,text,bigint)',
    'execute'
  )
  and has_function_privilege(
    'authenticated',
    'public.update_wallet_opening_balance(uuid,bigint)',
    'execute'
  )
  and has_function_privilege(
    'authenticated',
    'public.archive_wallet(uuid)',
    'execute'
  )
  and has_function_privilege(
    'authenticated',
    'public.restore_wallet(uuid)',
    'execute'
  ),
  'authenticated users can execute the approved wallet functions'
);

insert into tap_results (result)
select ok(
  not has_function_privilege(
    'anon',
    'public.create_wallet(text,text,text,bigint)',
    'execute'
  )
  and not has_function_privilege(
    'anon',
    'public.update_wallet_opening_balance(uuid,bigint)',
    'execute'
  )
  and not has_function_privilege(
    'anon',
    'public.archive_wallet(uuid)',
    'execute'
  )
  and not has_function_privilege(
    'anon',
    'public.restore_wallet(uuid)',
    'execute'
  ),
  'anon cannot execute wallet functions'
);

set local role authenticated;
set local request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';

insert into tap_results (result)
select lives_ok(
  $$insert into test_ids (label, id)
    select 'positive', public.create_wallet('Everyday', 'bank', 'My bank', 2000000)$$,
  'owner creates a wallet with a positive opening balance'
);

insert into tap_results (result)
select lives_ok(
  $$insert into test_ids (label, id)
    select 'zero', public.create_wallet('Cash', 'cash', null, 0)$$,
  'owner creates a wallet with a zero opening balance'
);

insert into tap_results (result)
select lives_ok(
  $$insert into test_ids (label, id)
    select 'negative', public.create_wallet('Other', 'other', null, -50000)$$,
  'owner creates a wallet with a negative opening balance'
);

set local request.jwt.claim.sub = '22222222-2222-2222-2222-222222222222';

insert into tap_results (result)
select lives_ok(
  $$insert into test_ids (label, id)
    select 'other', public.create_wallet('Other user cash', 'cash', null, 75000)$$,
  'another user creates their own wallet'
);

reset role;

insert into tap_results (result)
select lives_ok(
  $$set constraints all immediate; set constraints all deferred$$,
  'atomic wallet creation satisfies deferred opening invariants'
);

set local role authenticated;
set local request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';

insert into tap_results (result)
select results_eq(
  $$select count(*)::integer
    from public.transactions as transaction
    join public.wallet_movements as movement
      on movement.transaction_id = transaction.id
      and movement.user_id = transaction.user_id
    where movement.wallet_id = (select id from test_ids where label = 'positive')
      and transaction.kind = 'opening_balance'
      and transaction.deleted_at is null$$,
  array[1],
  'positive wallet has exactly one active opening transaction'
);

insert into tap_results (result)
select results_eq(
  $$select count(*)::integer
    from public.wallet_movements
    where wallet_id = (select id from test_ids where label = 'positive')
      and movement_role = 'opening_balance'$$,
  array[1],
  'positive wallet has exactly one opening movement'
);

insert into tap_results (result)
select results_eq(
  $$select opening_balance
    from public.wallet_opening_balances
    where wallet_id = (select id from test_ids where label = 'zero')$$,
  array['0'],
  'the zero opening movement is preserved as an exact integer string'
);

insert into tap_results (result)
select results_eq(
  $$select balance
    from public.wallet_balances
    where wallet_id = (select id from test_ids where label = 'positive')$$,
  array['2000000'],
  'positive balance is derived from the opening movement'
);

insert into tap_results (result)
select results_eq(
  $$select balance
    from public.wallet_balances
    where wallet_id = (select id from test_ids where label = 'negative')$$,
  array['-50000'],
  'negative balance is allowed and derived exactly'
);

insert into tap_results (result)
select results_eq(
  $$select count(*)::integer from public.wallets$$,
  array[3],
  'owner sees only their three wallets'
);

set local request.jwt.claim.sub = '22222222-2222-2222-2222-222222222222';

insert into tap_results (result)
select results_eq(
  $$select count(*)::integer from public.wallet_balances$$,
  array[1],
  'another user sees only their wallet balance'
);

set local role anon;

insert into tap_results (result)
select throws_ok(
  $$select * from public.wallets$$,
  '42501',
  null,
  'anonymous wallet reads are denied'
);

insert into tap_results (result)
select throws_ok(
  $$select public.create_wallet('Anon', 'cash', null, 0)$$,
  '42501',
  null,
  'anonymous wallet creation is denied'
);

reset role;

insert into tap_results (result)
select throws_ok(
  $$insert into public.wallet_movements (
      user_id,
      transaction_id,
      wallet_id,
      amount,
      movement_role
    )
    select
      movement.user_id,
      movement.transaction_id,
      movement.wallet_id,
      1,
      'opening_balance'
    from public.wallet_movements as movement
    where movement.wallet_id = (select id from test_ids where label = 'positive')$$,
  '23505',
  null,
  'a duplicate opening movement is rejected'
);

insert into tap_results (result)
select throws_ok(
  $$insert into public.wallets (id, user_id, name, type)
    values (
      'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      '11111111-1111-1111-1111-111111111111',
      'Invalid wallet',
      'cash'
    );
    set constraints all immediate$$,
  '23514',
  null,
  'a wallet without an opening pair is rejected at the database boundary'
);

insert into tap_results (result)
select throws_ok(
  $$insert into public.transactions (id, user_id, kind, occurred_at)
    values (
      'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
      '11111111-1111-1111-1111-111111111111',
      'opening_balance',
      now()
    );
    set constraints all immediate$$,
  '23514',
  null,
  'an opening transaction without its movement is rejected'
);

insert into public.transactions (
  id,
  user_id,
  kind,
  occurred_at,
  description
)
values (
  'cccccccc-cccc-cccc-cccc-cccccccccccc',
  '11111111-1111-1111-1111-111111111111',
  'income',
  now(),
  'Constraint fixture'
);

insert into tap_results (result)
select throws_ok(
  $$insert into public.wallet_movements (
      user_id,
      transaction_id,
      wallet_id,
      amount,
      movement_role
    )
    values (
      '11111111-1111-1111-1111-111111111111',
      'cccccccc-cccc-cccc-cccc-cccccccccccc',
      (select id from test_ids where label = 'other'),
      1,
      'income'
    )$$,
  '23503',
  null,
  'owner-qualified foreign keys reject a cross-user wallet link'
);

insert into tap_results (result)
select throws_ok(
  $$insert into public.wallet_movements (
      user_id,
      transaction_id,
      wallet_id,
      amount,
      movement_role
    )
    values (
      '11111111-1111-1111-1111-111111111111',
      'cccccccc-cccc-cccc-cccc-cccccccccccc',
      (select id from test_ids where label = 'positive'),
      0,
      'income'
    )$$,
  '23514',
  null,
  'zero ordinary movements are rejected'
);

delete from public.transactions
where id = 'cccccccc-cccc-cccc-cccc-cccccccccccc';

insert into tap_results (result)
select throws_ok(
  $$update public.transactions
    set deleted_at = now()
    where id = (
      select transaction_id
      from public.wallet_opening_balances
      where wallet_id = (select id from test_ids where label = 'positive')
    )$$,
  '23514',
  null,
  'an opening transaction cannot be soft-deleted even by a privileged write'
);

set local role authenticated;
set local request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';

insert into tap_results (result)
select throws_ok(
  $$insert into public.transactions (user_id, kind, occurred_at)
    values (
      '11111111-1111-1111-1111-111111111111',
      'income',
      now()
    )$$,
  '42501',
  null,
  'clients cannot directly insert transactions'
);

insert into tap_results (result)
select throws_ok(
  $$update public.wallet_movements set amount = 1$$,
  '42501',
  null,
  'clients cannot directly update wallet movements'
);

insert into tap_results (result)
select throws_ok(
  $$update public.transactions set deleted_at = now()$$,
  '42501',
  null,
  'clients cannot directly soft-delete opening transactions'
);

insert into tap_results (result)
select results_eq(
  $$update public.wallets
    set name = 'Daily account', institution = 'My updated bank'
    where id = (select id from test_ids where label = 'positive')
    returning name$$,
  array['Daily account'],
  'owner updates active wallet metadata'
);

set local request.jwt.claim.sub = '22222222-2222-2222-2222-222222222222';

insert into tap_results (result)
select is_empty(
  $$update public.wallets
    set name = 'Stolen'
    where id = (select id from test_ids where label = 'positive')
    returning id$$,
  'another user cannot update wallet metadata'
);

set local request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';

insert into tap_results (result)
select throws_ok(
  $$update public.wallets
    set user_id = '22222222-2222-2222-2222-222222222222'
    where id = (select id from test_ids where label = 'positive')$$,
  '42501',
  null,
  'wallet ownership cannot be reassigned by the client'
);

insert into opening_before_update (
  wallet_id,
  transaction_id,
  movement_id,
  occurred_at
)
select wallet_id, transaction_id, movement_id, occurred_at
from public.wallet_opening_balances
where wallet_id = (select id from test_ids where label = 'positive');

insert into tap_results (result)
select lives_ok(
  $$select public.update_wallet_opening_balance(
      (select id from test_ids where label = 'positive'),
      3500000
    )$$,
  'owner atomically updates the opening balance'
);

insert into tap_results (result)
select results_eq(
  $$select transaction_id, movement_id
    from public.wallet_opening_balances
    where wallet_id = (select id from test_ids where label = 'positive')$$,
  $$select transaction_id, movement_id
    from opening_before_update
    where wallet_id = (select id from test_ids where label = 'positive')$$,
  'opening update preserves the existing transaction and movement identities'
);

insert into tap_results (result)
select results_eq(
  $$select occurred_at
    from public.wallet_opening_balances
    where wallet_id = (select id from test_ids where label = 'positive')$$,
  $$select occurred_at
    from opening_before_update
    where wallet_id = (select id from test_ids where label = 'positive')$$,
  'opening update preserves occurred_at'
);

insert into tap_results (result)
select results_eq(
  $$select opening_balance
    from public.wallet_opening_balances
    where wallet_id = (select id from test_ids where label = 'positive')$$,
  array['3500000'],
  'opening update stores the new exact amount'
);

insert into tap_results (result)
select results_eq(
  $$select count(*)::integer
    from public.wallet_opening_balances
    where wallet_id = (select id from test_ids where label = 'positive')$$,
  array[1],
  'opening update does not duplicate the opening pair'
);

set local request.jwt.claim.sub = '22222222-2222-2222-2222-222222222222';

insert into tap_results (result)
select throws_ok(
  $$select public.update_wallet_opening_balance(
      (select id from test_ids where label = 'positive'),
      1
    )$$,
  'P0002',
  null,
  'another user cannot update the opening balance'
);

set local request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';

insert into tap_results (result)
select lives_ok(
  $$select public.archive_wallet(
      (select id from test_ids where label = 'positive')
    )$$,
  'owner archives an active wallet'
);

insert into tap_results (result)
select results_eq(
  $$select (archived_at is not null)::text
    from public.wallets
    where id = (select id from test_ids where label = 'positive')$$,
  array['true'],
  'archiving records wallet lifecycle state'
);

insert into tap_results (result)
select results_eq(
  $$select balance
    from public.wallet_balances
    where wallet_id = (select id from test_ids where label = 'positive')$$,
  array['3500000'],
  'archiving preserves the calculated balance'
);

insert into tap_results (result)
select results_eq(
  $$select count(*)::integer
    from public.wallets
    where archived_at is null
      and id = (select id from test_ids where label = 'positive')$$,
  array[0],
  'archived wallets are excluded from an active-wallet query'
);

insert into tap_results (result)
select results_eq(
  $$select count(*)::integer
    from public.wallet_opening_balances
    where wallet_id = (select id from test_ids where label = 'positive')$$,
  array[1],
  'archiving preserves the opening ledger pair'
);

insert into tap_results (result)
select is_empty(
  $$update public.wallets
    set name = 'Archived edit'
    where id = (select id from test_ids where label = 'positive')
    returning id$$,
  'archived wallet metadata cannot be edited directly'
);

insert into tap_results (result)
select throws_ok(
  $$select public.update_wallet_opening_balance(
      (select id from test_ids where label = 'positive'),
      1
    )$$,
  'P0002',
  null,
  'archived wallet opening balance cannot be edited'
);

set local request.jwt.claim.sub = '22222222-2222-2222-2222-222222222222';

insert into tap_results (result)
select throws_ok(
  $$select public.archive_wallet(
      (select id from test_ids where label = 'positive')
    )$$,
  'P0002',
  null,
  'another user cannot archive the wallet'
);

set local request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';

insert into tap_results (result)
select lives_ok(
  $$select public.restore_wallet(
      (select id from test_ids where label = 'positive')
    )$$,
  'owner restores an archived wallet'
);

insert into tap_results (result)
select results_eq(
  $$select (archived_at is null)::text
    from public.wallets
    where id = (select id from test_ids where label = 'positive')$$,
  array['true'],
  'restoration clears archive state'
);

insert into tap_results (result)
select results_eq(
  $$select balance
    from public.wallet_balances
    where wallet_id = (select id from test_ids where label = 'positive')$$,
  array['3500000'],
  'restoration preserves the same calculated balance'
);

set local request.jwt.claim.sub = '22222222-2222-2222-2222-222222222222';

insert into tap_results (result)
select throws_ok(
  $$select public.restore_wallet(
      (select id from test_ids where label = 'positive')
    )$$,
  'P0002',
  null,
  'another user cannot restore the wallet'
);

reset role;

insert into public.transactions (
  id,
  user_id,
  kind,
  occurred_at,
  description
)
values (
  'dddddddd-dddd-dddd-dddd-dddddddddddd',
  '11111111-1111-1111-1111-111111111111',
  'income',
  now(),
  'Balance aggregation fixture'
);

insert into public.wallet_movements (
  id,
  user_id,
  transaction_id,
  wallet_id,
  amount,
  movement_role
)
values (
  'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
  '11111111-1111-1111-1111-111111111111',
  'dddddddd-dddd-dddd-dddd-dddddddddddd',
  (select id from test_ids where label = 'positive'),
  250,
  'income'
);

set local role authenticated;
set local request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';

insert into tap_results (result)
select results_eq(
  $$select balance
    from public.wallet_balances
    where wallet_id = (select id from test_ids where label = 'positive')$$,
  array['3500250'],
  'active non-opening test movement contributes to balance aggregation'
);

reset role;

update public.transactions
set deleted_at = now()
where id = 'dddddddd-dddd-dddd-dddd-dddddddddddd';

set local role authenticated;
set local request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';

insert into tap_results (result)
select results_eq(
  $$select balance
    from public.wallet_balances
    where wallet_id = (select id from test_ids where label = 'positive')$$,
  array['3500000'],
  'soft-deleted transactions are excluded from active balance aggregation'
);

insert into tap_results (result)
select throws_ok(
  $$select public.create_wallet('Bad', 'unsupported', null, 10)$$,
  '22023',
  null,
  'database validation rejects an unsupported wallet type'
);

insert into tap_results (result)
select results_eq(
  $$select count(*)::integer from public.wallets$$,
  array[3],
  'a rejected wallet creation leaves no partial owner wallet'
);

reset role;

insert into tap_results (result)
select lives_ok(
  $$set constraints all immediate; set constraints all deferred$$,
  'all final wallet and ledger invariants remain valid'
);

insert into tap_results (result)
select * from finish();

select result
from tap_results
order by sequence;

rollback;
