alter table public.transactions
add column description text,
add column notes text;

alter table public.transactions
add constraint transactions_income_expense_description_check check (
  kind not in ('income', 'expense')
  or (
    description is not null
    and description = btrim(description)
    and char_length(description) between 1 and 120
  )
),
add constraint transactions_notes_check check (
  notes is null
  or (
    notes = btrim(notes)
    and char_length(notes) between 1 and 1000
  )
);

create unique index wallet_movements_one_income_expense_per_transaction
on public.wallet_movements (transaction_id)
where movement_role in ('income', 'expense');

create index transactions_income_expense_active_order_idx
on public.transactions (
  user_id,
  occurred_at desc,
  created_at desc,
  id desc
)
where deleted_at is null
  and kind in ('income', 'expense');

create index transactions_income_expense_deleted_order_idx
on public.transactions (
  user_id,
  occurred_at desc,
  created_at desc,
  id desc
)
where deleted_at is not null
  and kind in ('income', 'expense');

comment on column public.transactions.description is
  'Required trimmed description for Phase 4 income and expense events.';

comment on column public.transactions.notes is
  'Optional trimmed notes for a financial event.';

create function public.assert_income_expense_transaction(
  p_transaction_id uuid
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  transaction_kind text;
  movement_count integer;
  valid_movement_count integer;
begin
  select kind
  into transaction_kind
  from public.transactions
  where id = p_transaction_id;

  if not found then
    return;
  end if;

  select
    count(*)::integer,
    count(*) filter (
      where movement_role = transaction_kind
        and (
          (transaction_kind = 'income' and amount > 0)
          or (transaction_kind = 'expense' and amount < 0)
        )
    )::integer
  into movement_count, valid_movement_count
  from public.wallet_movements
  where transaction_id = p_transaction_id;

  if transaction_kind in ('income', 'expense') then
    if movement_count <> 1 or valid_movement_count <> 1 then
      raise exception
        'An income or expense transaction must have exactly one correctly signed movement.'
        using errcode = '23514';
    end if;
  elsif exists (
    select 1
    from public.wallet_movements
    where transaction_id = p_transaction_id
      and movement_role in ('income', 'expense')
  ) then
    raise exception
      'Income and expense movements require a matching transaction kind.'
      using errcode = '23514';
  end if;
end;
$$;

revoke all on function public.assert_income_expense_transaction(uuid)
  from public, anon, authenticated;

create function public.enforce_income_expense_invariants()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_table_name = 'transactions' then
    if tg_op <> 'DELETE' then
      perform public.assert_income_expense_transaction(new.id);
    end if;

    if tg_op <> 'INSERT'
      and (tg_op = 'DELETE' or old.id is distinct from new.id) then
      perform public.assert_income_expense_transaction(old.id);
    end if;
  elsif tg_table_name = 'wallet_movements' then
    if tg_op <> 'DELETE' then
      perform public.assert_income_expense_transaction(new.transaction_id);
    end if;

    if tg_op <> 'INSERT'
      and (
        tg_op = 'DELETE'
        or old.transaction_id is distinct from new.transaction_id
      ) then
      perform public.assert_income_expense_transaction(old.transaction_id);
    end if;
  end if;

  return null;
end;
$$;

revoke all on function public.enforce_income_expense_invariants()
  from public, anon, authenticated;

create constraint trigger enforce_transaction_income_expense
after insert or update or delete on public.transactions
deferrable initially deferred
for each row execute function public.enforce_income_expense_invariants();

create constraint trigger enforce_movement_income_expense
after insert or update or delete on public.wallet_movements
deferrable initially deferred
for each row execute function public.enforce_income_expense_invariants();

create view public.income_expense_transactions
with (security_invoker = true)
as
select
  transaction.id as transaction_id,
  transaction.user_id,
  transaction.kind,
  movement.wallet_id,
  wallet.name as wallet_name,
  wallet.archived_at as wallet_archived_at,
  transaction.description,
  transaction.notes,
  abs(movement.amount::numeric)::text as amount,
  transaction.occurred_at,
  transaction.deleted_at,
  transaction.created_at,
  transaction.updated_at
from public.transactions as transaction
join public.wallet_movements as movement
  on movement.transaction_id = transaction.id
  and movement.user_id = transaction.user_id
  and movement.movement_role = transaction.kind
join public.wallets as wallet
  on wallet.id = movement.wallet_id
  and wallet.user_id = movement.user_id
where transaction.kind in ('income', 'expense');

revoke all on table public.income_expense_transactions
  from public, anon, authenticated;
grant select on table public.income_expense_transactions to authenticated;

create function public.create_income_expense_transaction(
  p_kind text,
  p_wallet_id uuid,
  p_amount bigint,
  p_occurred_at timestamptz,
  p_description text,
  p_notes text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller_id uuid := auth.uid();
  normalized_description text := btrim(p_description);
  normalized_notes text := nullif(btrim(p_notes), '');
  transaction_id uuid;
begin
  if caller_id is null then
    raise exception 'Authentication is required.' using errcode = '42501';
  end if;

  if p_kind is null or p_kind not in ('income', 'expense') then
    raise exception 'Transaction type is invalid.' using errcode = '22023';
  end if;

  if p_amount is null or p_amount <= 0 then
    raise exception 'Amount must be greater than zero.' using errcode = '22023';
  end if;

  if p_occurred_at is null or p_occurred_at > now() then
    raise exception 'Transaction time cannot be in the future.'
      using errcode = '22023';
  end if;

  if p_description is null
    or char_length(normalized_description) not between 1 and 120 then
    raise exception 'Description must contain between 1 and 120 characters.'
      using errcode = '22023';
  end if;

  if normalized_notes is not null
    and char_length(normalized_notes) > 1000 then
    raise exception 'Notes must contain at most 1000 characters.'
      using errcode = '22023';
  end if;

  perform 1
  from public.wallets
  where id = p_wallet_id
    and user_id = caller_id
    and archived_at is null
  for update;

  if not found then
    raise exception 'Wallet is not available for transactions.'
      using errcode = 'P0002';
  end if;

  insert into public.transactions (
    user_id,
    kind,
    occurred_at,
    description,
    notes
  )
  values (
    caller_id,
    p_kind,
    p_occurred_at,
    normalized_description,
    normalized_notes
  )
  returning id into transaction_id;

  insert into public.wallet_movements (
    user_id,
    transaction_id,
    wallet_id,
    amount,
    movement_role
  )
  values (
    caller_id,
    transaction_id,
    p_wallet_id,
    case when p_kind = 'income' then p_amount else -p_amount end,
    p_kind
  );

  return transaction_id;
end;
$$;

create function public.update_income_expense_transaction(
  p_transaction_id uuid,
  p_kind text,
  p_wallet_id uuid,
  p_amount bigint,
  p_occurred_at timestamptz,
  p_description text,
  p_notes text default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller_id uuid := auth.uid();
  normalized_description text := btrim(p_description);
  normalized_notes text := nullif(btrim(p_notes), '');
  movement_id uuid;
  current_wallet_id uuid;
  intended_amount bigint;
begin
  if caller_id is null then
    raise exception 'Authentication is required.' using errcode = '42501';
  end if;

  if p_transaction_id is null then
    raise exception 'Transaction is required.' using errcode = '22023';
  end if;

  if p_kind is null or p_kind not in ('income', 'expense') then
    raise exception 'Transaction type is invalid.' using errcode = '22023';
  end if;

  if p_amount is null or p_amount <= 0 then
    raise exception 'Amount must be greater than zero.' using errcode = '22023';
  end if;

  if p_occurred_at is null or p_occurred_at > now() then
    raise exception 'Transaction time cannot be in the future.'
      using errcode = '22023';
  end if;

  if p_description is null
    or char_length(normalized_description) not between 1 and 120 then
    raise exception 'Description must contain between 1 and 120 characters.'
      using errcode = '22023';
  end if;

  if normalized_notes is not null
    and char_length(normalized_notes) > 1000 then
    raise exception 'Notes must contain at most 1000 characters.'
      using errcode = '22023';
  end if;

  begin
    select movement.id, movement.wallet_id
    into strict movement_id, current_wallet_id
    from public.transactions as transaction
    join public.wallet_movements as movement
      on movement.transaction_id = transaction.id
      and movement.user_id = transaction.user_id
    where transaction.id = p_transaction_id
      and transaction.user_id = caller_id
      and transaction.kind in ('income', 'expense')
      and transaction.deleted_at is null
    for update of transaction, movement;
  exception
    when no_data_found then
      raise exception 'Transaction is not available for editing.'
        using errcode = 'P0002';
    when too_many_rows then
      raise exception 'Transaction ledger shape is invalid.'
        using errcode = '23514';
  end;

  perform public.assert_income_expense_transaction(p_transaction_id);

  if p_wallet_id is distinct from current_wallet_id then
    perform 1
    from public.wallets
    where id = p_wallet_id
      and user_id = caller_id
      and archived_at is null
    for update;

    if not found then
      raise exception 'Wallet is not available for transactions.'
        using errcode = 'P0002';
    end if;
  end if;

  intended_amount := case
    when p_kind = 'income' then p_amount
    else -p_amount
  end;

  update public.transactions
  set
    kind = p_kind,
    occurred_at = p_occurred_at,
    description = normalized_description,
    notes = normalized_notes
  where id = p_transaction_id
    and user_id = caller_id;

  update public.wallet_movements
  set
    wallet_id = p_wallet_id,
    amount = intended_amount,
    movement_role = p_kind
  where id = movement_id
    and user_id = caller_id
    and (
      wallet_id is distinct from p_wallet_id
      or amount is distinct from intended_amount
      or movement_role is distinct from p_kind
    );
end;
$$;

create function public.soft_delete_income_expense_transaction(
  p_transaction_id uuid
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller_id uuid := auth.uid();
  movement_id uuid;
begin
  if caller_id is null then
    raise exception 'Authentication is required.' using errcode = '42501';
  end if;

  begin
    select movement.id
    into strict movement_id
    from public.transactions as transaction
    join public.wallet_movements as movement
      on movement.transaction_id = transaction.id
      and movement.user_id = transaction.user_id
    where transaction.id = p_transaction_id
      and transaction.user_id = caller_id
      and transaction.kind in ('income', 'expense')
      and transaction.deleted_at is null
    for update of transaction, movement;
  exception
    when no_data_found then
      raise exception 'Transaction is not available for deletion.'
        using errcode = 'P0002';
    when too_many_rows then
      raise exception 'Transaction ledger shape is invalid.'
        using errcode = '23514';
  end;

  perform public.assert_income_expense_transaction(p_transaction_id);

  update public.transactions
  set deleted_at = now()
  where id = p_transaction_id
    and user_id = caller_id;
end;
$$;

create function public.restore_income_expense_transaction(
  p_transaction_id uuid
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller_id uuid := auth.uid();
  movement_id uuid;
begin
  if caller_id is null then
    raise exception 'Authentication is required.' using errcode = '42501';
  end if;

  begin
    select movement.id
    into strict movement_id
    from public.transactions as transaction
    join public.wallet_movements as movement
      on movement.transaction_id = transaction.id
      and movement.user_id = transaction.user_id
    where transaction.id = p_transaction_id
      and transaction.user_id = caller_id
      and transaction.kind in ('income', 'expense')
      and transaction.deleted_at is not null
    for update of transaction, movement;
  exception
    when no_data_found then
      raise exception 'Transaction is not available for restoration.'
        using errcode = 'P0002';
    when too_many_rows then
      raise exception 'Transaction ledger shape is invalid.'
        using errcode = '23514';
  end;

  perform public.assert_income_expense_transaction(p_transaction_id);

  update public.transactions
  set deleted_at = null
  where id = p_transaction_id
    and user_id = caller_id;
end;
$$;

revoke all on function public.create_income_expense_transaction(
  text,
  uuid,
  bigint,
  timestamptz,
  text,
  text
) from public, anon, authenticated;

revoke all on function public.update_income_expense_transaction(
  uuid,
  text,
  uuid,
  bigint,
  timestamptz,
  text,
  text
) from public, anon, authenticated;

revoke all on function public.soft_delete_income_expense_transaction(uuid)
  from public, anon, authenticated;

revoke all on function public.restore_income_expense_transaction(uuid)
  from public, anon, authenticated;

grant execute on function public.create_income_expense_transaction(
  text,
  uuid,
  bigint,
  timestamptz,
  text,
  text
) to authenticated;

grant execute on function public.update_income_expense_transaction(
  uuid,
  text,
  uuid,
  bigint,
  timestamptz,
  text,
  text
) to authenticated;

grant execute on function public.soft_delete_income_expense_transaction(uuid)
  to authenticated;

grant execute on function public.restore_income_expense_transaction(uuid)
  to authenticated;

comment on function public.create_income_expense_transaction(
  text,
  uuid,
  bigint,
  timestamptz,
  text,
  text
) is 'Atomically creates one owned income or expense transaction and its signed movement.';

comment on function public.update_income_expense_transaction(
  uuid,
  text,
  uuid,
  bigint,
  timestamptz,
  text,
  text
) is 'Atomically updates an active owned income or expense and its existing movement.';

comment on function public.soft_delete_income_expense_transaction(uuid) is
  'Soft-deletes an active owned income or expense while retaining its movement.';

comment on function public.restore_income_expense_transaction(uuid) is
  'Restores a deleted owned income or expense using its existing movement.';
