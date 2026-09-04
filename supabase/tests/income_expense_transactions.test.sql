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

insert into tap_results (result)
select plan(95);

insert into auth.users (id, email)
values
  ('11111111-1111-1111-1111-111111111111', 'phase4-owner@example.com'),
  ('22222222-2222-2222-2222-222222222222', 'phase4-other@example.com');

insert into tap_results (result)
select has_view(
  'public',
  'income_expense_transactions',
  'income and expense read view exists'
);

insert into tap_results (result)
select col_type_is(
  'public',
  'transactions',
  'description',
  'text',
  'transaction description uses text'
);

insert into tap_results (result)
select col_type_is(
  'public',
  'transactions',
  'notes',
  'text',
  'transaction notes use text'
);

insert into tap_results (result)
select ok(
  coalesce(
    (
      select 'security_invoker=true' = any (reloptions)
      from pg_class
      where oid = 'public.income_expense_transactions'::regclass
    ),
    false
  ),
  'income and expense view uses caller RLS'
);

insert into tap_results (result)
select ok(
  to_regclass(
    'public.wallet_movements_one_income_expense_per_transaction'
  ) is not null,
  'ordinary transactions have a unique movement index'
);

insert into tap_results (result)
select ok(
  to_regclass('public.transactions_income_expense_active_order_idx') is not null,
  'active transaction ordering index exists'
);

insert into tap_results (result)
select ok(
  to_regclass('public.transactions_income_expense_deleted_order_idx') is not null,
  'deleted transaction ordering index exists'
);

insert into tap_results (result)
select ok(
  (select relrowsecurity from pg_class where oid = 'public.transactions'::regclass)
  and (
    select relrowsecurity
    from pg_class
    where oid = 'public.wallet_movements'::regclass
  ),
  'RLS remains enabled on transaction and movement tables'
);

insert into tap_results (result)
select ok(
  has_table_privilege('authenticated', 'public.transactions', 'select')
  and not has_table_privilege(
    'authenticated',
    'public.transactions',
    'insert,update,delete'
  ),
  'transactions remain owner-readable but not directly writable'
);

insert into tap_results (result)
select ok(
  has_table_privilege('authenticated', 'public.wallet_movements', 'select')
  and not has_table_privilege(
    'authenticated',
    'public.wallet_movements',
    'insert,update,delete'
  ),
  'movements remain owner-readable but not directly writable'
);

insert into tap_results (result)
select ok(
  has_function_privilege(
    'authenticated',
    'public.create_income_expense_transaction(text,uuid,bigint,timestamptz,text,text)',
    'execute'
  )
  and has_function_privilege(
    'authenticated',
    'public.update_income_expense_transaction(uuid,text,uuid,bigint,timestamptz,text,text)',
    'execute'
  )
  and has_function_privilege(
    'authenticated',
    'public.soft_delete_income_expense_transaction(uuid)',
    'execute'
  )
  and has_function_privilege(
    'authenticated',
    'public.restore_income_expense_transaction(uuid)',
    'execute'
  ),
  'authenticated users receive only the approved financial RPCs'
);

insert into tap_results (result)
select ok(
  not has_function_privilege(
    'anon',
    'public.create_income_expense_transaction(text,uuid,bigint,timestamptz,text,text)',
    'execute'
  )
  and not has_function_privilege(
    'anon',
    'public.update_income_expense_transaction(uuid,text,uuid,bigint,timestamptz,text,text)',
    'execute'
  )
  and not has_function_privilege(
    'anon',
    'public.soft_delete_income_expense_transaction(uuid)',
    'execute'
  )
  and not has_function_privilege(
    'anon',
    'public.restore_income_expense_transaction(uuid)',
    'execute'
  ),
  'anonymous users cannot execute financial RPCs'
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
  'Phase 4 does not add a mutable wallet balance'
);

insert into tap_results (result)
select ok(
  to_regclass('public.categories') is null,
  'Phase 4 does not create categories'
);

set local role authenticated;
set local request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';

insert into tap_results (result)
select lives_ok(
  $$insert into test_ids (label, id)
    select 'wallet-a', public.create_wallet('Primary', 'bank', 'Test bank', 100000)$$,
  'owner creates the first wallet fixture'
);

insert into tap_results (result)
select lives_ok(
  $$insert into test_ids (label, id)
    select 'wallet-b', public.create_wallet('Secondary', 'cash', null, 0)$$,
  'owner creates a zero-opening wallet fixture'
);

set local request.jwt.claim.sub = '22222222-2222-2222-2222-222222222222';

insert into tap_results (result)
select lives_ok(
  $$insert into test_ids (label, id)
    select 'wallet-other', public.create_wallet('Other owner', 'cash', null, 500000)$$,
  'second user creates an owned wallet fixture'
);

set local request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';

insert into tap_results (result)
select lives_ok(
  $$insert into test_ids (label, id)
    select 'income', public.create_income_expense_transaction(
      'income',
      (select id from test_ids where label = 'wallet-a'),
      500000,
      now() - interval '2 days',
      ' Salary ',
      ' September payroll '
    )$$,
  'income creation is atomic'
);

insert into tap_results (result)
select lives_ok(
  $$insert into test_ids (label, id)
    select 'expense', public.create_income_expense_transaction(
      'expense',
      (select id from test_ids where label = 'wallet-a'),
      700000,
      now() - interval '1 day',
      'Rent',
      null
    )$$,
  'expense creation is atomic'
);

insert into tap_results (result)
select results_eq(
  $$select kind || ':' || description || ':' || notes
    from public.transactions
    where id = (select id from test_ids where label = 'income')$$,
  array['income:Salary:September payroll'],
  'income metadata is normalized and stored'
);

insert into tap_results (result)
select results_eq(
  $$select count(*)::integer
    from public.wallet_movements
    where transaction_id = (select id from test_ids where label = 'income')$$,
  array[1],
  'income has exactly one movement'
);

insert into tap_results (result)
select results_eq(
  $$select amount
    from public.wallet_movements
    where transaction_id = (select id from test_ids where label = 'income')
      and movement_role = 'income'$$,
  array[500000::bigint],
  'income movement is positive'
);

insert into tap_results (result)
select results_eq(
  $$select count(*)::integer
    from public.wallet_movements
    where transaction_id = (select id from test_ids where label = 'expense')$$,
  array[1],
  'expense has exactly one movement'
);

insert into tap_results (result)
select results_eq(
  $$select amount
    from public.wallet_movements
    where transaction_id = (select id from test_ids where label = 'expense')
      and movement_role = 'expense'$$,
  array[-700000::bigint],
  'expense movement is negative'
);

insert into tap_results (result)
select results_eq(
  $$select balance
    from public.wallet_balances
    where wallet_id = (select id from test_ids where label = 'wallet-a')$$,
  array['-100000'],
  'an expense may drive the calculated wallet balance negative'
);

insert into tap_results (result)
select results_eq(
  $$select kind || ':' || amount
    from public.income_expense_transactions
    order by occurred_at desc, created_at desc, transaction_id desc$$,
  array['expense:700000', 'income:500000'],
  'the read model exposes positive magnitudes in occurrence order'
);

insert into tap_results (result)
select throws_ok(
  $$select public.create_income_expense_transaction(
      'income',
      (select id from test_ids where label = 'wallet-a'),
      0,
      now() - interval '1 hour',
      'Zero',
      null
    )$$,
  '22023',
  null,
  'zero ordinary amount is rejected'
);

insert into tap_results (result)
select throws_ok(
  $$select public.create_income_expense_transaction(
      'expense',
      (select id from test_ids where label = 'wallet-a'),
      -1,
      now() - interval '1 hour',
      'Negative input',
      null
    )$$,
  '22023',
  null,
  'negative user magnitude is rejected'
);

insert into tap_results (result)
select throws_ok(
  $$select public.create_income_expense_transaction(
      'transfer',
      (select id from test_ids where label = 'wallet-a'),
      1,
      now() - interval '1 hour',
      'Transfer',
      null
    )$$,
  '22023',
  null,
  'Phase 5 transaction kind is rejected'
);

insert into tap_results (result)
select throws_ok(
  $$select public.create_income_expense_transaction(
      'income',
      (select id from test_ids where label = 'wallet-a'),
      1,
      now() + interval '1 minute',
      'Future',
      null
    )$$,
  '22023',
  null,
  'future occurrence time is rejected by the database'
);

insert into tap_results (result)
select throws_ok(
  $$select public.create_income_expense_transaction(
      'income',
      (select id from test_ids where label = 'wallet-a'),
      1,
      now() - interval '1 hour',
      '   ',
      null
    )$$,
  '22023',
  null,
  'blank description is rejected'
);

insert into tap_results (result)
select throws_ok(
  $$select public.create_income_expense_transaction(
      'income',
      (select id from test_ids where label = 'wallet-a'),
      1,
      now() - interval '1 hour',
      'Too many notes',
      repeat('x', 1001)
    )$$,
  '22023',
  null,
  'overlong notes are rejected'
);

insert into tap_results (result)
select throws_ok(
  $$select public.create_income_expense_transaction(
      'income',
      (select id from test_ids where label = 'wallet-other'),
      1,
      now() - interval '1 hour',
      'IDOR',
      null
    )$$,
  'P0002',
  null,
  'a valid foreign wallet UUID is rejected'
);

insert into tap_results (result)
select results_eq(
  $$select count(*)::integer
    from public.transactions
    where kind in ('income', 'expense')$$,
  array[2],
  'failed creates leave no partial transactions'
);

set local request.jwt.claim.sub = '22222222-2222-2222-2222-222222222222';

insert into tap_results (result)
select is_empty(
  $$select transaction_id from public.income_expense_transactions$$,
  'another user cannot read owner transaction view rows'
);

set local role anon;

insert into tap_results (result)
select throws_ok(
  $$select * from public.income_expense_transactions$$,
  '42501',
  null,
  'anonymous transaction reads are denied'
);

insert into tap_results (result)
select throws_ok(
  $$select public.create_income_expense_transaction(
      'income',
      'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      1,
      now() - interval '1 hour',
      'Anonymous',
      null
    )$$,
  '42501',
  null,
  'anonymous financial RPC execution is denied'
);

set local role authenticated;
set local request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';

insert into tap_results (result)
select throws_ok(
  $$insert into public.transactions (
      user_id,
      kind,
      occurred_at,
      description
    ) values (
      '11111111-1111-1111-1111-111111111111',
      'income',
      now(),
      'Direct'
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
  'clients cannot directly alter ledger signs'
);

insert into tap_results (result)
select throws_ok(
  $$delete from public.transactions$$,
  '42501',
  null,
  'clients cannot physically delete financial history'
);

insert into test_ids (label, id)
select 'income-movement', id
from public.wallet_movements
where transaction_id = (select id from test_ids where label = 'income');

create temporary table income_before_edit as
select id, created_at, updated_at
from public.transactions
where id = (select id from test_ids where label = 'income');

insert into tap_results (result)
select lives_ok(
  $$select public.update_income_expense_transaction(
      (select id from test_ids where label = 'income'),
      'income',
      (select id from test_ids where label = 'wallet-a'),
      600000,
      now() - interval '3 days',
      'Updated salary',
      ''
    )$$,
  'an owner atomically edits income amount, time, and metadata'
);

insert into tap_results (result)
select results_eq(
  $$select count(*)::integer
    from public.wallet_movements
    where transaction_id = (select id from test_ids where label = 'income')$$,
  array[1],
  'editing retains exactly one movement'
);

insert into tap_results (result)
select results_eq(
  $$select id
    from public.wallet_movements
    where transaction_id = (select id from test_ids where label = 'income')$$,
  $$select id from test_ids where label = 'income-movement'$$,
  'editing reuses the existing movement row'
);

insert into tap_results (result)
select results_eq(
  $$select amount
    from public.wallet_movements
    where transaction_id = (select id from test_ids where label = 'income')$$,
  array[600000::bigint],
  'editing updates the signed income effect'
);

insert into tap_results (result)
select results_eq(
  $$select description || ':' || coalesce(notes, '<null>')
    from public.transactions
    where id = (select id from test_ids where label = 'income')$$,
  array['Updated salary:<null>'],
  'editing normalizes transaction text'
);

insert into tap_results (result)
select ok(
  (
    select transaction.created_at = original.created_at
      and transaction.updated_at >= original.updated_at
    from public.transactions as transaction
    cross join income_before_edit as original
    where transaction.id = (select id from test_ids where label = 'income')
  ),
  'editing preserves created_at and advances the update lifecycle'
);

insert into tap_results (result)
select results_eq(
  $$select balance
    from public.wallet_balances
    where wallet_id = (select id from test_ids where label = 'wallet-a')$$,
  array['0'],
  'edited income amount is reflected once in balance'
);

insert into tap_results (result)
select lives_ok(
  $$insert into test_ids (label, id)
    select 'wallet-c', public.create_wallet('Active target', 'cash', null, 0)$$,
  'owner creates an active edit target'
);

insert into tap_results (result)
select lives_ok(
  $$select public.update_income_expense_transaction(
      (select id from test_ids where label = 'income'),
      'expense',
      (select id from test_ids where label = 'wallet-b'),
      250,
      now() - interval '4 days',
      'Corrected to expense',
      'Moved wallets'
    )$$,
  'income can be corrected to expense and moved atomically'
);

insert into tap_results (result)
select results_eq(
  $$select movement_role || ':' || amount::text || ':' || wallet_id::text
    from public.wallet_movements
    where id = (select id from test_ids where label = 'income-movement')$$,
  $$select 'expense:-250:' || id::text
    from test_ids where label = 'wallet-b'$$,
  'income to expense correction flips role, sign, and wallet on the same movement'
);

insert into tap_results (result)
select results_eq(
  $$select balance
    from public.wallet_balances
    where wallet_id = (select id from test_ids where label = 'wallet-a')$$,
  array['-600000'],
  'moving the transaction removes its prior wallet effect'
);

insert into tap_results (result)
select results_eq(
  $$select balance
    from public.wallet_balances
    where wallet_id = (select id from test_ids where label = 'wallet-b')$$,
  array['-250'],
  'the corrected expense affects its new wallet once'
);

insert into tap_results (result)
select lives_ok(
  $$select public.update_income_expense_transaction(
      (select id from test_ids where label = 'income'),
      'income',
      (select id from test_ids where label = 'wallet-b'),
      300,
      now() - interval '4 days',
      'Corrected back to income',
      null
    )$$,
  'expense can be corrected back to income'
);

insert into tap_results (result)
select results_eq(
  $$select kind || ':' || movement_role || ':' || amount::text
    from public.transactions as transaction
    join public.wallet_movements as movement
      on movement.transaction_id = transaction.id
      and movement.user_id = transaction.user_id
    where transaction.id = (select id from test_ids where label = 'income')$$,
  array['income:income:300'],
  'expense to income correction restores the positive invariant'
);

insert into tap_results (result)
select throws_ok(
  $$select public.update_income_expense_transaction(
      (select id from test_ids where label = 'income'),
      'expense',
      (select id from test_ids where label = 'wallet-a'),
      999,
      now() + interval '1 minute',
      'Invalid future edit',
      null
    )$$,
  '22023',
  null,
  'future-dated edit is rejected'
);

insert into tap_results (result)
select results_eq(
  $$select kind || ':' || amount::text || ':' || wallet_id::text
    from public.transactions as transaction
    join public.wallet_movements as movement
      on movement.transaction_id = transaction.id
      and movement.user_id = transaction.user_id
    where transaction.id = (select id from test_ids where label = 'income')$$,
  $$select 'income:300:' || id::text
    from test_ids where label = 'wallet-b'$$,
  'failed edit preserves the complete prior financial state'
);

set local request.jwt.claim.sub = '22222222-2222-2222-2222-222222222222';

insert into tap_results (result)
select throws_ok(
  $$select public.update_income_expense_transaction(
      (select id from test_ids where label = 'income'),
      'income',
      (select id from test_ids where label = 'wallet-other'),
      1,
      now() - interval '1 hour',
      'Foreign edit',
      null
    )$$,
  'P0002',
  null,
  'another user cannot edit a transaction using valid foreign identifiers'
);

insert into tap_results (result)
select throws_ok(
  $$select public.soft_delete_income_expense_transaction(
      (select id from test_ids where label = 'income')
    )$$,
  'P0002',
  null,
  'another user cannot soft-delete a transaction'
);

set local request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';

insert into tap_results (result)
select lives_ok(
  $$select public.archive_wallet(
      (select id from test_ids where label = 'wallet-b')
    )$$,
  'owner archives a wallet containing historical income'
);

insert into tap_results (result)
select throws_ok(
  $$select public.create_income_expense_transaction(
      'income',
      (select id from test_ids where label = 'wallet-b'),
      1,
      now() - interval '1 hour',
      'Archived create',
      null
    )$$,
  'P0002',
  null,
  'new transactions cannot target an archived wallet'
);

insert into tap_results (result)
select lives_ok(
  $$select public.update_income_expense_transaction(
      (select id from test_ids where label = 'income'),
      'income',
      (select id from test_ids where label = 'wallet-b'),
      350,
      now() - interval '5 days',
      'Archived wallet correction',
      null
    )$$,
  'historical correction may retain its existing archived wallet'
);

insert into tap_results (result)
select lives_ok(
  $$select public.archive_wallet(
      (select id from test_ids where label = 'wallet-a')
    )$$,
  'owner archives a different historical wallet'
);

insert into tap_results (result)
select throws_ok(
  $$select public.update_income_expense_transaction(
      (select id from test_ids where label = 'income'),
      'income',
      (select id from test_ids where label = 'wallet-a'),
      350,
      now() - interval '5 days',
      'Invalid archived retarget',
      null
    )$$,
  'P0002',
  null,
  'an edit cannot retarget to a different archived wallet'
);

insert into tap_results (result)
select lives_ok(
  $$select public.update_income_expense_transaction(
      (select id from test_ids where label = 'income'),
      'income',
      (select id from test_ids where label = 'wallet-c'),
      400,
      now() - interval '5 days',
      'Moved to active wallet',
      null
    )$$,
  'a transaction may move from an archived wallet to an active wallet'
);

insert into tap_results (result)
select results_eq(
  $$select wallet_id
    from public.wallet_movements
    where id = (select id from test_ids where label = 'income-movement')$$,
  $$select id from test_ids where label = 'wallet-c'$$,
  'active retarget uses the existing movement'
);

insert into test_ids (label, id)
select 'expense-movement', id
from public.wallet_movements
where transaction_id = (select id from test_ids where label = 'expense');

insert into tap_results (result)
select results_eq(
  $$select balance
    from public.wallet_balances
    where wallet_id = (select id from test_ids where label = 'wallet-a')$$,
  array['-600000'],
  'archiving preserves the historical expense balance'
);

insert into tap_results (result)
select lives_ok(
  $$select public.soft_delete_income_expense_transaction(
      (select id from test_ids where label = 'expense')
    )$$,
  'owner soft-deletes an active expense'
);

insert into tap_results (result)
select ok(
  (
    select deleted_at is not null
    from public.transactions
    where id = (select id from test_ids where label = 'expense')
  ),
  'soft delete records deleted_at without removing the transaction'
);

insert into tap_results (result)
select results_eq(
  $$select id
    from public.wallet_movements
    where transaction_id = (select id from test_ids where label = 'expense')$$,
  $$select id from test_ids where label = 'expense-movement'$$,
  'soft delete preserves the movement row'
);

insert into tap_results (result)
select results_eq(
  $$select balance
    from public.wallet_balances
    where wallet_id = (select id from test_ids where label = 'wallet-a')$$,
  array['100000'],
  'soft delete removes the stored movement from active balance'
);

insert into tap_results (result)
select results_eq(
  $$select count(*)::integer
    from public.income_expense_transactions
    where transaction_id = (select id from test_ids where label = 'expense')
      and deleted_at is not null$$,
  array[1],
  'deleted records remain available through the recovery read model'
);

insert into tap_results (result)
select throws_ok(
  $$select public.soft_delete_income_expense_transaction(
      (select id from test_ids where label = 'expense')
    )$$,
  'P0002',
  null,
  'repeated soft delete is rejected without another side effect'
);

set local request.jwt.claim.sub = '22222222-2222-2222-2222-222222222222';

insert into tap_results (result)
select throws_ok(
  $$select public.restore_income_expense_transaction(
      (select id from test_ids where label = 'expense')
    )$$,
  'P0002',
  null,
  'another user cannot restore a deleted transaction'
);

set local request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';

insert into tap_results (result)
select lives_ok(
  $$select public.restore_income_expense_transaction(
      (select id from test_ids where label = 'expense')
    )$$,
  'an owner can restore history to its existing archived wallet'
);

insert into tap_results (result)
select results_eq(
  $$select id
    from public.wallet_movements
    where transaction_id = (select id from test_ids where label = 'expense')$$,
  $$select id from test_ids where label = 'expense-movement'$$,
  'restore reuses the same movement rather than inserting a replacement'
);

insert into tap_results (result)
select results_eq(
  $$select balance
    from public.wallet_balances
    where wallet_id = (select id from test_ids where label = 'wallet-a')$$,
  array['-600000'],
  'restore returns the movement effect exactly once'
);

insert into tap_results (result)
select throws_ok(
  $$select public.restore_income_expense_transaction(
      (select id from test_ids where label = 'expense')
    )$$,
  'P0002',
  null,
  'repeated restore is rejected without double-counting'
);

insert into tap_results (result)
select results_eq(
  $$select balance
    from public.wallet_balances
    where wallet_id = (select id from test_ids where label = 'wallet-a')$$,
  array['-600000'],
  'failed repeated restore leaves balance unchanged'
);

insert into test_ids (label, id)
select 'opening-a', transaction_id
from public.wallet_opening_balances
where wallet_id = (select id from test_ids where label = 'wallet-a');

insert into tap_results (result)
select throws_ok(
  $$select public.update_income_expense_transaction(
      (select id from test_ids where label = 'opening-a'),
      'income',
      (select id from test_ids where label = 'wallet-a'),
      1,
      now() - interval '1 hour',
      'Opening mutation',
      null
    )$$,
  'P0002',
  null,
  'ordinary edit cannot convert an opening balance transaction'
);

insert into tap_results (result)
select throws_ok(
  $$select public.soft_delete_income_expense_transaction(
      (select id from test_ids where label = 'opening-a')
    )$$,
  'P0002',
  null,
  'ordinary delete cannot soft-delete an opening balance'
);

insert into tap_results (result)
select throws_ok(
  $$select public.restore_income_expense_transaction(
      (select id from test_ids where label = 'opening-a')
    )$$,
  'P0002',
  null,
  'ordinary restore cannot act on an opening balance'
);

insert into tap_results (result)
select results_eq(
  $$select count(*)::integer
    from public.wallet_opening_balances
    where wallet_id in (
      (select id from test_ids where label = 'wallet-a'),
      (select id from test_ids where label = 'wallet-b'),
      (select id from test_ids where label = 'wallet-c')
    )$$,
  array[3],
  'every owner wallet retains exactly one opening pair'
);

insert into tap_results (result)
select results_eq(
  $$select opening_balance
    from public.wallet_opening_balances
    where wallet_id = (select id from test_ids where label = 'wallet-b')$$,
  array['0'],
  'the sole zero-movement exception remains an opening balance'
);

insert into tap_results (result)
select results_eq(
  $$select count(*)::integer
    from public.wallet_movements
    where amount = 0
      and movement_role <> 'opening_balance'$$,
  array[0],
  'ordinary movements remain non-zero'
);

reset role;

insert into public.transactions (
  id,
  user_id,
  kind,
  occurred_at,
  description,
  created_at,
  updated_at
)
values
  (
    '40000000-0000-0000-0000-000000000001',
    '11111111-1111-1111-1111-111111111111',
    'income',
    '2026-01-01 00:00:00+00',
    'Ordering one',
    '2026-01-02 00:00:00+00',
    '2026-01-02 00:00:00+00'
  ),
  (
    '40000000-0000-0000-0000-000000000002',
    '11111111-1111-1111-1111-111111111111',
    'income',
    '2026-01-01 00:00:00+00',
    'Ordering two',
    '2026-01-02 00:00:00+00',
    '2026-01-02 00:00:00+00'
  );

insert into public.wallet_movements (
  id,
  user_id,
  transaction_id,
  wallet_id,
  amount,
  movement_role
)
values
  (
    '50000000-0000-0000-0000-000000000001',
    '11111111-1111-1111-1111-111111111111',
    '40000000-0000-0000-0000-000000000001',
    (select id from test_ids where label = 'wallet-c'),
    1,
    'income'
  ),
  (
    '50000000-0000-0000-0000-000000000002',
    '11111111-1111-1111-1111-111111111111',
    '40000000-0000-0000-0000-000000000002',
    (select id from test_ids where label = 'wallet-c'),
    2,
    'income'
  );

set local role authenticated;
set local request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';

insert into tap_results (result)
select results_eq(
  $$select description
    from public.income_expense_transactions
    where description like 'Ordering %'
    order by occurred_at desc, created_at desc, transaction_id desc$$,
  array['Ordering two', 'Ordering one'],
  'transaction ordering uses id descending as the deterministic final key'
);

reset role;

insert into tap_results (result)
select throws_ok(
  $$insert into public.transactions (
      id,
      user_id,
      kind,
      occurred_at,
      description
    ) values (
      '60000000-0000-0000-0000-000000000001',
      '11111111-1111-1111-1111-111111111111',
      'income',
      now() - interval '1 hour',
      'Missing movement'
    );
    set constraints all immediate$$,
  '23514',
  null,
  'an ordinary transaction without a movement is rejected atomically'
);

insert into tap_results (result)
select throws_ok(
  $$insert into public.transactions (
      id,
      user_id,
      kind,
      occurred_at,
      description
    ) values (
      '60000000-0000-0000-0000-000000000002',
      '11111111-1111-1111-1111-111111111111',
      'income',
      now() - interval '1 hour',
      'Wrong sign'
    );
    insert into public.wallet_movements (
      id,
      user_id,
      transaction_id,
      wallet_id,
      amount,
      movement_role
    ) values (
      '70000000-0000-0000-0000-000000000002',
      '11111111-1111-1111-1111-111111111111',
      '60000000-0000-0000-0000-000000000002',
      (select id from test_ids where label = 'wallet-c'),
      -1,
      'income'
    );
    set constraints all immediate$$,
  '23514',
  null,
  'income with a negative movement is rejected atomically'
);

insert into tap_results (result)
select throws_ok(
  $$insert into public.transactions (
      id,
      user_id,
      kind,
      occurred_at,
      description
    ) values (
      '60000000-0000-0000-0000-000000000003',
      '11111111-1111-1111-1111-111111111111',
      'expense',
      now() - interval '1 hour',
      'Wrong role'
    );
    insert into public.wallet_movements (
      id,
      user_id,
      transaction_id,
      wallet_id,
      amount,
      movement_role
    ) values (
      '70000000-0000-0000-0000-000000000003',
      '11111111-1111-1111-1111-111111111111',
      '60000000-0000-0000-0000-000000000003',
      (select id from test_ids where label = 'wallet-c'),
      -1,
      'fee'
    );
    set constraints all immediate$$,
  '23514',
  null,
  'expense with a mismatched movement role is rejected atomically'
);

insert into tap_results (result)
select throws_ok(
  $$insert into public.transactions (
      id,
      user_id,
      kind,
      occurred_at,
      description
    ) values (
      '60000000-0000-0000-0000-000000000004',
      '11111111-1111-1111-1111-111111111111',
      'income',
      now() - interval '1 hour',
      'Duplicate movement'
    );
    insert into public.wallet_movements (
      id,
      user_id,
      transaction_id,
      wallet_id,
      amount,
      movement_role
    ) values
      (
        '70000000-0000-0000-0000-000000000004',
        '11111111-1111-1111-1111-111111111111',
        '60000000-0000-0000-0000-000000000004',
        (select id from test_ids where label = 'wallet-c'),
        1,
        'income'
      ),
      (
        '70000000-0000-0000-0000-000000000005',
        '11111111-1111-1111-1111-111111111111',
        '60000000-0000-0000-0000-000000000004',
        (select id from test_ids where label = 'wallet-c'),
        2,
        'income'
      )$$,
  '23505',
  null,
  'duplicate ordinary movements are rejected immediately'
);

insert into tap_results (result)
select throws_ok(
  $$insert into public.transactions (
      id,
      user_id,
      kind,
      occurred_at,
      description
    ) values (
      '60000000-0000-0000-0000-000000000006',
      '11111111-1111-1111-1111-111111111111',
      'expense',
      now() - interval '1 hour',
      'Positive expense'
    );
    insert into public.wallet_movements (
      id,
      user_id,
      transaction_id,
      wallet_id,
      amount,
      movement_role
    ) values (
      '70000000-0000-0000-0000-000000000006',
      '11111111-1111-1111-1111-111111111111',
      '60000000-0000-0000-0000-000000000006',
      (select id from test_ids where label = 'wallet-c'),
      1,
      'expense'
    );
    set constraints all immediate$$,
  '23514',
  null,
  'expense with a positive movement is rejected atomically'
);

insert into tap_results (result)
select throws_ok(
  $$insert into public.transactions (
      id,
      user_id,
      kind,
      occurred_at
    ) values (
      '60000000-0000-0000-0000-000000000007',
      '11111111-1111-1111-1111-111111111111',
      'transfer',
      now() - interval '1 hour'
    );
    insert into public.wallet_movements (
      id,
      user_id,
      transaction_id,
      wallet_id,
      amount,
      movement_role
    ) values (
      '70000000-0000-0000-0000-000000000007',
      '11111111-1111-1111-1111-111111111111',
      '60000000-0000-0000-0000-000000000007',
      (select id from test_ids where label = 'wallet-c'),
      1,
      'income'
    );
    set constraints all immediate$$,
  '23514',
  null,
  'income and expense roles cannot be attached to future transfer rows'
);

insert into tap_results (result)
select throws_ok(
  $$insert into public.transactions (
      id,
      user_id,
      kind,
      occurred_at,
      description
    ) values (
      '60000000-0000-0000-0000-000000000008',
      '11111111-1111-1111-1111-111111111111',
      'income',
      now() - interval '1 hour',
      'Cross owner'
    );
    insert into public.wallet_movements (
      id,
      user_id,
      transaction_id,
      wallet_id,
      amount,
      movement_role
    ) values (
      '70000000-0000-0000-0000-000000000008',
      '11111111-1111-1111-1111-111111111111',
      '60000000-0000-0000-0000-000000000008',
      (select id from test_ids where label = 'wallet-other'),
      1,
      'income'
    )$$,
  '23503',
  null,
  'owner-qualified foreign keys reject cross-user wallet linkage'
);

insert into tap_results (result)
select results_eq(
  $$select count(*)::integer
    from public.transactions
    where id in (
      '60000000-0000-0000-0000-000000000001',
      '60000000-0000-0000-0000-000000000002',
      '60000000-0000-0000-0000-000000000003',
      '60000000-0000-0000-0000-000000000004',
      '60000000-0000-0000-0000-000000000006',
      '60000000-0000-0000-0000-000000000007',
      '60000000-0000-0000-0000-000000000008'
    )$$,
  array[0],
  'failed invariant probes leave no partial transaction rows'
);

insert into tap_results (result)
select results_eq(
  $$select count(*)::integer
    from public.wallet_movements
    where id in (
      '70000000-0000-0000-0000-000000000002',
      '70000000-0000-0000-0000-000000000003',
      '70000000-0000-0000-0000-000000000004',
      '70000000-0000-0000-0000-000000000005',
      '70000000-0000-0000-0000-000000000006',
      '70000000-0000-0000-0000-000000000007',
      '70000000-0000-0000-0000-000000000008'
    )$$,
  array[0],
  'failed invariant probes leave no orphan movement rows'
);

insert into tap_results (result)
select lives_ok(
  $$set constraints all immediate; set constraints all deferred$$,
  'all final opening and ordinary ledger invariants remain valid'
);

insert into tap_results (result)
select * from finish();

select result
from tap_results
order by sequence;

rollback;
