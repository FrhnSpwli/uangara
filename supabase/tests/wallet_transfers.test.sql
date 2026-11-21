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

grant insert, select on table tap_results to anon, authenticated;
grant usage, select on sequence tap_results_sequence_seq to anon, authenticated;
grant insert, select, update on table test_ids to authenticated;

insert into tap_results (result) select no_plan();

insert into auth.users (id, email)
values
  ('11111111-1111-1111-1111-111111111111', 'phase5-owner@example.com'),
  ('22222222-2222-2222-2222-222222222222', 'phase5-other@example.com');

insert into tap_results (result)
select has_view('public', 'transaction_feed', 'unified transaction feed exists');

insert into tap_results (result)
select col_type_is(
  'public',
  'transactions',
  'idempotency_key',
  'uuid',
  'transfer idempotency key uses UUID'
);

insert into tap_results (result)
select ok(
  coalesce(
    (
      select 'security_invoker=true' = any (reloptions)
      from pg_class
      where oid = 'public.transaction_feed'::regclass
    ),
    false
  ),
  'transaction feed uses caller RLS'
);

insert into tap_results (result)
select ok(
  (
    select count(*) = 3
    from pg_indexes
    where schemaname = 'public'
      and indexname in (
        'wallet_movements_one_transfer_source_per_transaction',
        'wallet_movements_one_transfer_destination_per_transaction',
        'wallet_movements_one_transfer_fee_per_transaction'
      )
  ),
  'each transfer movement role has a unique-per-transaction index'
);

insert into tap_results (result)
select ok(
  has_function_privilege(
    'authenticated',
    'public.create_transfer(uuid,uuid,bigint,bigint,timestamptz,text,text,uuid)',
    'execute'
  )
  and has_function_privilege(
    'authenticated',
    'public.update_transfer(uuid,uuid,uuid,bigint,bigint,timestamptz,text,text)',
    'execute'
  )
  and has_function_privilege(
    'authenticated',
    'public.soft_delete_transfer(uuid)',
    'execute'
  )
  and has_function_privilege(
    'authenticated',
    'public.restore_transfer(uuid)',
    'execute'
  ),
  'authenticated role receives only the transfer RPC boundary'
);

insert into tap_results (result)
select ok(
  not has_function_privilege(
    'anon',
    'public.create_transfer(uuid,uuid,bigint,bigint,timestamptz,text,text,uuid)',
    'execute'
  ),
  'anonymous role cannot create transfers'
);

insert into tap_results (result)
select ok(
  has_table_privilege('authenticated', 'public.wallet_movements', 'select')
  and not has_table_privilege(
    'authenticated',
    'public.wallet_movements',
    'insert,update,delete'
  ),
  'ledger movements remain client read-only'
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
  'transfers add no mutable wallet balance'
);

set local role authenticated;
set local request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';

insert into test_ids (label, id)
values
  ('wallet-a', public.create_wallet('Mandiri', 'bank', 'Bank Mandiri', 1000)),
  ('wallet-b', public.create_wallet('GoPay', 'e_wallet', 'GoPay', 0)),
  ('wallet-c', public.create_wallet('Jago', 'bank', 'Bank Jago', 0));

set local request.jwt.claim.sub = '22222222-2222-2222-2222-222222222222';

insert into test_ids (label, id)
values
  ('wallet-other-a', public.create_wallet('Other A', 'cash', null, 0)),
  ('wallet-other-b', public.create_wallet('Other B', 'cash', null, 0));

set local request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';

insert into test_ids (label, id)
select
  'transfer',
  public.create_transfer(
    (select id from test_ids where label = 'wallet-a'),
    (select id from test_ids where label = 'wallet-b'),
    1500,
    100,
    now() - interval '1 day',
    'Mandiri to GoPay',
    'Admin fee included',
    'aaaaaaaa-0000-0000-0000-000000000001'
  );

insert into tap_results (result)
select results_eq(
  $$select kind from public.transactions
    where id = (select id from test_ids where label = 'transfer')$$,
  array['transfer'],
  'create produces one first-class transfer transaction'
);

insert into tap_results (result)
select results_eq(
  $$select movement_role || ':' || amount::text
    from public.wallet_movements
    where transaction_id = (select id from test_ids where label = 'transfer')
    order by movement_role$$,
  array[
    'transfer_destination:1500',
    'transfer_fee:-100',
    'transfer_source:-1500'
  ],
  'transfer has the exact signed principal pair and fee shape'
);

insert into tap_results (result)
select results_eq(
  $$select sum(amount)::text
    from public.wallet_movements
    where transaction_id = (select id from test_ids where label = 'transfer')
      and movement_role in ('transfer_source', 'transfer_destination')$$,
  array['0'],
  'transfer principal is wealth-neutral'
);

insert into tap_results (result)
select results_eq(
  $$select sum(amount)::text
    from public.wallet_movements
    where transaction_id = (select id from test_ids where label = 'transfer')$$,
  array['-100'],
  'only the fee decreases total wealth'
);

insert into tap_results (result)
select results_eq(
  $$select name || ':' || balance
    from public.wallet_balances
    where wallet_id in (
      (select id from test_ids where label = 'wallet-a'),
      (select id from test_ids where label = 'wallet-b')
    ) order by name$$,
  array['GoPay:1500', 'Mandiri:-600'],
  'transfer and fee update ledger-derived balances and allow negative source'
);

insert into tap_results (result)
select results_eq(
  $$select public.create_transfer(
      (select id from test_ids where label = 'wallet-a'),
      (select id from test_ids where label = 'wallet-b'),
      1500,
      100,
      (select occurred_at from public.transactions
       where id = (select id from test_ids where label = 'transfer')),
      'Mandiri to GoPay',
      'Admin fee included',
      'aaaaaaaa-0000-0000-0000-000000000001'
    )$$,
  $$select id from test_ids where label = 'transfer'$$,
  'identical idempotent retry returns the original transfer'
);

insert into tap_results (result)
select results_eq(
  $$select count(*)::integer from public.wallet_movements
    where transaction_id = (select id from test_ids where label = 'transfer')$$,
  array[3],
  'idempotent retry creates no duplicate movements'
);

insert into tap_results (result)
select throws_ok(
  $$select public.create_transfer(
      (select id from test_ids where label = 'wallet-a'),
      (select id from test_ids where label = 'wallet-b'),
      1501,
      100,
      now() - interval '1 day',
      'Changed payload',
      null,
      'aaaaaaaa-0000-0000-0000-000000000001'
    )$$,
  '22023',
  null,
  'same idempotency key with different payload is rejected'
);

insert into test_ids (label, id)
select
  'transfer-no-fee',
  public.create_transfer(
    (select id from test_ids where label = 'wallet-b'),
    (select id from test_ids where label = 'wallet-c'),
    50,
    0,
    now() - interval '2 hours',
    'No fee transfer',
    null,
    'aaaaaaaa-0000-0000-0000-000000000002'
  );

insert into tap_results (result)
select results_eq(
  $$select count(*)::integer from public.wallet_movements
    where transaction_id = (select id from test_ids where label = 'transfer-no-fee')$$,
  array[2],
  'zero fee creates no fee movement'
);

insert into tap_results (result)
select results_eq(
  $$select count(*)::integer from public.wallet_movements
    where transaction_id = (select id from test_ids where label = 'transfer-no-fee')
      and movement_role = 'transfer_fee'$$,
  array[0],
  'ordinary zero-valued fee movement is absent'
);

insert into tap_results (result)
select throws_ok(
  $$select public.create_transfer(
      (select id from test_ids where label = 'wallet-a'),
      (select id from test_ids where label = 'wallet-b'),
      0, 0, now() - interval '1 hour', 'Zero', null,
      'aaaaaaaa-0000-0000-0000-000000000003'
    )$$,
  '22023', null, 'zero principal is rejected'
);

insert into tap_results (result)
select throws_ok(
  $$select public.create_transfer(
      (select id from test_ids where label = 'wallet-a'),
      (select id from test_ids where label = 'wallet-b'),
      -1, 0, now() - interval '1 hour', 'Negative', null,
      'aaaaaaaa-0000-0000-0000-000000000004'
    )$$,
  '22023', null, 'negative principal magnitude is rejected'
);

insert into tap_results (result)
select throws_ok(
  $$select public.create_transfer(
      (select id from test_ids where label = 'wallet-a'),
      (select id from test_ids where label = 'wallet-b'),
      1, -1, now() - interval '1 hour', 'Negative fee', null,
      'aaaaaaaa-0000-0000-0000-000000000005'
    )$$,
  '22023', null, 'negative fee is rejected'
);

insert into tap_results (result)
select throws_ok(
  $$select public.create_transfer(
      (select id from test_ids where label = 'wallet-a'),
      (select id from test_ids where label = 'wallet-a'),
      1, 0, now() - interval '1 hour', 'Same wallet', null,
      'aaaaaaaa-0000-0000-0000-000000000006'
    )$$,
  '22023', null, 'same source and destination are rejected'
);

insert into tap_results (result)
select throws_ok(
  $$select public.create_transfer(
      (select id from test_ids where label = 'wallet-a'),
      (select id from test_ids where label = 'wallet-b'),
      1, 0, now() + interval '1 minute', 'Future', null,
      'aaaaaaaa-0000-0000-0000-000000000007'
    )$$,
  '22023', null, 'future transfer occurrence is rejected'
);

insert into tap_results (result)
select throws_ok(
  $$select public.create_transfer(
      (select id from test_ids where label = 'wallet-other-a'),
      (select id from test_ids where label = 'wallet-b'),
      1, 0, now() - interval '1 hour', 'Foreign source', null,
      'aaaaaaaa-0000-0000-0000-000000000008'
    )$$,
  'P0002', null, 'foreign source wallet is rejected'
);

insert into tap_results (result)
select throws_ok(
  $$select public.create_transfer(
      (select id from test_ids where label = 'wallet-a'),
      (select id from test_ids where label = 'wallet-other-b'),
      1, 0, now() - interval '1 hour', 'Foreign destination', null,
      'aaaaaaaa-0000-0000-0000-000000000009'
    )$$,
  'P0002', null, 'foreign destination wallet is rejected'
);

insert into tap_results (result)
select results_eq(
  $$select count(*)::integer from public.transactions
    where idempotency_key in (
      'aaaaaaaa-0000-0000-0000-000000000003',
      'aaaaaaaa-0000-0000-0000-000000000004',
      'aaaaaaaa-0000-0000-0000-000000000005',
      'aaaaaaaa-0000-0000-0000-000000000006',
      'aaaaaaaa-0000-0000-0000-000000000007',
      'aaaaaaaa-0000-0000-0000-000000000008',
      'aaaaaaaa-0000-0000-0000-000000000009'
    )$$,
  array[0],
  'failed creates leave no partial transfer transactions'
);

set local request.jwt.claim.sub = '22222222-2222-2222-2222-222222222222';

insert into test_ids (label, id)
select
  'transfer-other',
  public.create_transfer(
    (select id from test_ids where label = 'wallet-other-a'),
    (select id from test_ids where label = 'wallet-other-b'),
    10, 0, now() - interval '1 hour', 'Other transfer', null,
    'aaaaaaaa-0000-0000-0000-000000000001'
  );

insert into tap_results (result)
select ok(
  (select id from test_ids where label = 'transfer-other') is not null,
  'different users may reuse the same idempotency UUID namespace'
);

insert into tap_results (result)
select results_eq(
  $$select count(*)::integer from public.transaction_feed$$,
  array[1],
  'RLS exposes only the current user transaction feed'
);

insert into tap_results (result)
select throws_ok(
  $$select public.update_transfer(
      (select id from test_ids where label = 'transfer'),
      (select id from test_ids where label = 'wallet-other-a'),
      (select id from test_ids where label = 'wallet-other-b'),
      1, 0, now() - interval '1 hour', 'Foreign update', null
    )$$,
  'P0002', null, 'foreign transfer edit is rejected'
);

insert into tap_results (result)
select throws_ok(
  $$select public.soft_delete_transfer(
      (select id from test_ids where label = 'transfer')
    )$$,
  'P0002', null, 'foreign transfer delete is rejected'
);

set local request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';

insert into test_ids (label, id)
select 'source-movement', id from public.wallet_movements
where transaction_id = (select id from test_ids where label = 'transfer')
  and movement_role = 'transfer_source';

insert into test_ids (label, id)
select 'destination-movement', id from public.wallet_movements
where transaction_id = (select id from test_ids where label = 'transfer')
  and movement_role = 'transfer_destination';

insert into test_ids (label, id)
select 'fee-movement', id from public.wallet_movements
where transaction_id = (select id from test_ids where label = 'transfer')
  and movement_role = 'transfer_fee';

insert into tap_results (result)
select lives_ok(
  $$select public.update_transfer(
      (select id from test_ids where label = 'transfer'),
      (select id from test_ids where label = 'wallet-c'),
      (select id from test_ids where label = 'wallet-b'),
      300, 25, now() - interval '3 days', 'Updated transfer', 'Updated note'
    )$$,
  'owner atomically edits endpoints, amount, fee, time, and metadata'
);

insert into tap_results (result)
select results_eq(
  $$select id from public.wallet_movements
    where transaction_id = (select id from test_ids where label = 'transfer')
      and movement_role = 'transfer_source'$$,
  $$select id from test_ids where label = 'source-movement'$$,
  'edit reuses the source movement'
);

insert into tap_results (result)
select results_eq(
  $$select id from public.wallet_movements
    where transaction_id = (select id from test_ids where label = 'transfer')
      and movement_role = 'transfer_destination'$$,
  $$select id from test_ids where label = 'destination-movement'$$,
  'edit reuses the destination movement'
);

insert into tap_results (result)
select results_eq(
  $$select movement_role || ':' || amount::text || ':' || wallet_id::text
    from public.wallet_movements
    where transaction_id = (select id from test_ids where label = 'transfer')
    order by movement_role$$,
  $$select * from (values
      ('transfer_destination:300:' || (select id::text from test_ids where label = 'wallet-b')),
      ('transfer_fee:-25:' || (select id::text from test_ids where label = 'wallet-c')),
      ('transfer_source:-300:' || (select id::text from test_ids where label = 'wallet-c'))
    ) as expected(value) order by value$$,
  'edit leaves no stale wallet, amount, sign, or fee impact'
);

insert into tap_results (result)
select lives_ok(
  $$select public.update_transfer(
      (select id from test_ids where label = 'transfer'),
      (select id from test_ids where label = 'wallet-c'),
      (select id from test_ids where label = 'wallet-b'),
      300, 0, now() - interval '3 days', 'Removed fee', null
    )$$,
  'fee can be removed atomically'
);

insert into tap_results (result)
select results_eq(
  $$select count(*)::integer from public.wallet_movements
    where transaction_id = (select id from test_ids where label = 'transfer')
      and movement_role = 'transfer_fee'$$,
  array[0],
  'fee removal leaves no active or stale fee row'
);

insert into tap_results (result)
select lives_ok(
  $$select public.update_transfer(
      (select id from test_ids where label = 'transfer'),
      (select id from test_ids where label = 'wallet-c'),
      (select id from test_ids where label = 'wallet-b'),
      300, 40, now() - interval '3 days', 'Added fee', null
    )$$,
  'fee can be added atomically'
);

insert into tap_results (result)
select results_eq(
  $$select amount::text from public.wallet_movements
    where transaction_id = (select id from test_ids where label = 'transfer')
      and movement_role = 'transfer_fee'$$,
  array['-40'],
  'added fee is one negative source movement'
);

insert into tap_results (result)
select lives_ok(
  $$select public.archive_wallet((select id from test_ids where label = 'wallet-c'))$$,
  'source wallet can be archived after historical transfer'
);

insert into tap_results (result)
select lives_ok(
  $$select public.update_transfer(
      (select id from test_ids where label = 'transfer'),
      (select id from test_ids where label = 'wallet-c'),
      (select id from test_ids where label = 'wallet-b'),
      350, 40, now() - interval '3 days', 'Archived correction', null
    )$$,
  'historical edit may retain its existing archived endpoint'
);

insert into tap_results (result)
select lives_ok(
  $$select public.archive_wallet((select id from test_ids where label = 'wallet-a'))$$,
  'another wallet is archived for rejection tests'
);

insert into tap_results (result)
select throws_ok(
  $$select public.create_transfer(
      (select id from test_ids where label = 'wallet-a'),
      (select id from test_ids where label = 'wallet-b'),
      1, 0, now() - interval '1 hour', 'Archived source', null,
      'aaaaaaaa-0000-0000-0000-000000000010'
    )$$,
  'P0002', null, 'new archived source is rejected'
);

insert into tap_results (result)
select throws_ok(
  $$select public.create_transfer(
      (select id from test_ids where label = 'wallet-b'),
      (select id from test_ids where label = 'wallet-a'),
      1, 0, now() - interval '1 hour', 'Archived destination', null,
      'aaaaaaaa-0000-0000-0000-000000000011'
    )$$,
  'P0002', null, 'new archived destination is rejected'
);

insert into tap_results (result)
select throws_ok(
  $$select public.update_transfer(
      (select id from test_ids where label = 'transfer'),
      (select id from test_ids where label = 'wallet-c'),
      (select id from test_ids where label = 'wallet-a'),
      350, 40, now() - interval '3 days', 'Archived retarget', null
    )$$,
  'P0002', null, 'retargeting to a different archived wallet is rejected'
);

insert into tap_results (result)
select results_eq(
  $$select destination.wallet_id
    from public.wallet_movements as destination
    where destination.transaction_id = (select id from test_ids where label = 'transfer')
      and destination.movement_role = 'transfer_destination'$$,
  $$select id from test_ids where label = 'wallet-b'$$,
  'failed archived retarget preserves prior ledger state'
);

insert into test_ids (label, id)
select 'current-fee-movement', id from public.wallet_movements
where transaction_id = (select id from test_ids where label = 'transfer')
  and movement_role = 'transfer_fee';

insert into tap_results (result)
select lives_ok(
  $$select public.soft_delete_transfer((select id from test_ids where label = 'transfer'))$$,
  'owner soft-deletes complete transfer'
);

insert into tap_results (result)
select ok(
  (select deleted_at is not null from public.transactions
   where id = (select id from test_ids where label = 'transfer')),
  'soft delete stores deleted_at'
);

insert into tap_results (result)
select results_eq(
  $$select count(*)::integer from public.wallet_movements
    where transaction_id = (select id from test_ids where label = 'transfer')$$,
  array[3],
  'soft delete preserves source, destination, and fee rows'
);

insert into tap_results (result)
select results_eq(
  $$select balance from public.wallet_balances
    where wallet_id = (select id from test_ids where label = 'wallet-c')$$,
  array['50'],
  'soft delete removes transfer and fee effects from archived source balance'
);

insert into tap_results (result)
select throws_ok(
  $$select public.soft_delete_transfer((select id from test_ids where label = 'transfer'))$$,
  'P0002', null, 'repeated delete is rejected without financial side effects'
);

set local request.jwt.claim.sub = '22222222-2222-2222-2222-222222222222';

insert into tap_results (result)
select throws_ok(
  $$select public.restore_transfer((select id from test_ids where label = 'transfer'))$$,
  'P0002', null, 'foreign transfer restore is rejected'
);

set local request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';

insert into tap_results (result)
select lives_ok(
  $$select public.restore_transfer((select id from test_ids where label = 'transfer'))$$,
  'owner restores transfer with archived historical source'
);

insert into tap_results (result)
select results_eq(
  $$select id from public.wallet_movements
    where transaction_id = (select id from test_ids where label = 'transfer')
      and movement_role = 'transfer_fee'$$,
  $$select id from test_ids where label = 'current-fee-movement'$$,
  'restore reuses the same fee movement'
);

insert into tap_results (result)
select results_eq(
  $$select balance from public.wallet_balances
    where wallet_id = (select id from test_ids where label = 'wallet-c')$$,
  array['-340'],
  'restore reactivates source principal and fee exactly once'
);

insert into tap_results (result)
select throws_ok(
  $$select public.restore_transfer((select id from test_ids where label = 'transfer'))$$,
  'P0002', null, 'repeated restore is rejected without double counting'
);

insert into tap_results (result)
select results_eq(
  $$select balance from public.wallet_balances
    where wallet_id = (select id from test_ids where label = 'wallet-c')$$,
  array['-340'],
  'failed repeated restore leaves balance unchanged'
);

insert into tap_results (result)
select results_eq(
  $$select kind || ':' || source_wallet_name || ':' || destination_wallet_name || ':' || amount || ':' || fee_amount
    from public.transaction_feed
    where transaction_id = (select id from test_ids where label = 'transfer')$$,
  array['transfer:Jago:GoPay:350:40'],
  'feed exposes transfer direction, principal, and expense-like fee'
);

insert into tap_results (result)
select results_eq(
  $$select count(*)::integer from public.income_expense_transactions
    where transaction_id = (select id from test_ids where label = 'transfer')$$,
  array[0],
  'transfer principal is not classified as income or expense'
);

insert into tap_results (result)
select results_eq(
  $$select count(*)::integer from public.wallet_movements
    where transaction_id = (select id from test_ids where label = 'transfer')
      and movement_role = 'transfer_fee'
      and amount < 0$$,
  array[1],
  'fee remains explicitly identifiable as one negative expense-like effect'
);

insert into tap_results (result)
select throws_ok(
  $$insert into public.wallet_movements (
      user_id, transaction_id, wallet_id, amount, movement_role
    ) values (
      '11111111-1111-1111-1111-111111111111',
      (select id from test_ids where label = 'transfer'),
      (select id from test_ids where label = 'wallet-other-a'),
      1,
      'transfer_destination'
    )$$,
  '42501', null, 'authenticated clients cannot inject mixed-owner movements'
);

reset role;

insert into tap_results (result)
select throws_ok(
  $$insert into public.transactions (
      id, user_id, kind, occurred_at, description
    ) values (
      '60000000-0000-0000-0000-000000000001',
      '11111111-1111-1111-1111-111111111111',
      'transfer', now() - interval '1 hour', 'One-sided transfer'
    );
    insert into public.wallet_movements (
      user_id, transaction_id, wallet_id, amount, movement_role
    ) values (
      '11111111-1111-1111-1111-111111111111',
      '60000000-0000-0000-0000-000000000001',
      (select id from test_ids where label = 'wallet-b'),
      -1, 'transfer_source'
    );
    set constraints all immediate$$,
  '23514', null, 'database rejects one-sided transfer shape atomically'
);

insert into tap_results (result)
select throws_ok(
  $$insert into public.transactions (
      id, user_id, kind, occurred_at, description
    ) values (
      '60000000-0000-0000-0000-000000000002',
      '11111111-1111-1111-1111-111111111111',
      'transfer', now() - interval '1 hour', 'Unequal transfer'
    );
    insert into public.wallet_movements (
      user_id, transaction_id, wallet_id, amount, movement_role
    ) values
      ('11111111-1111-1111-1111-111111111111', '60000000-0000-0000-0000-000000000002',
       (select id from test_ids where label = 'wallet-b'), -2, 'transfer_source'),
      ('11111111-1111-1111-1111-111111111111', '60000000-0000-0000-0000-000000000002',
       (select id from test_ids where label = 'wallet-c'), 1, 'transfer_destination');
    set constraints all immediate$$,
  '23514', null, 'database rejects unequal transfer principal atomically'
);

insert into tap_results (result)
select throws_ok(
  $$insert into public.transactions (
      id, user_id, kind, occurred_at, description
    ) values (
      '60000000-0000-0000-0000-000000000003',
      '11111111-1111-1111-1111-111111111111',
      'transfer', now() - interval '1 hour', 'Wrong fee wallet'
    );
    insert into public.wallet_movements (
      user_id, transaction_id, wallet_id, amount, movement_role
    ) values
      ('11111111-1111-1111-1111-111111111111', '60000000-0000-0000-0000-000000000003',
       (select id from test_ids where label = 'wallet-b'), -1, 'transfer_source'),
      ('11111111-1111-1111-1111-111111111111', '60000000-0000-0000-0000-000000000003',
       (select id from test_ids where label = 'wallet-c'), 1, 'transfer_destination'),
      ('11111111-1111-1111-1111-111111111111', '60000000-0000-0000-0000-000000000003',
       (select id from test_ids where label = 'wallet-c'), -1, 'transfer_fee');
    set constraints all immediate$$,
  '23514', null, 'database rejects a fee outside the source wallet'
);

insert into tap_results (result)
select results_eq(
  $$select count(*)::integer from public.transactions
    where id in (
      '60000000-0000-0000-0000-000000000001',
      '60000000-0000-0000-0000-000000000002',
      '60000000-0000-0000-0000-000000000003'
    )$$,
  array[0],
  'failed invariant probes leave no partial transaction rows'
);

insert into tap_results (result)
select results_eq(
  $$select count(*)::integer from public.wallet_opening_balances
    where wallet_id in (
      (select id from test_ids where label = 'wallet-a'),
      (select id from test_ids where label = 'wallet-b'),
      (select id from test_ids where label = 'wallet-c')
    )$$,
  array[3],
  'all opening-balance exact-one invariants remain valid'
);

insert into tap_results (result)
select lives_ok(
  $$set constraints all immediate; set constraints all deferred$$,
  'all opening, income/expense, and transfer invariants remain valid'
);

insert into tap_results (result) select * from finish();

select result from tap_results order by sequence;

rollback;
