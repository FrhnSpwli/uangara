alter table public.transactions
add column idempotency_key uuid;

alter table public.transactions
drop constraint transactions_income_expense_description_check,
add constraint transactions_financial_description_check check (
  kind not in ('income', 'expense', 'transfer')
  or (
    description is not null
    and description = btrim(description)
    and char_length(description) between 1 and 120
  )
),
add constraint transactions_idempotency_kind_check check (
  idempotency_key is null or kind = 'transfer'
);

create unique index transactions_transfer_idempotency_key_idx
on public.transactions (user_id, idempotency_key)
where kind = 'transfer'
  and idempotency_key is not null;

create unique index wallet_movements_one_transfer_source_per_transaction
on public.wallet_movements (transaction_id)
where movement_role = 'transfer_source';

create unique index wallet_movements_one_transfer_destination_per_transaction
on public.wallet_movements (transaction_id)
where movement_role = 'transfer_destination';

create unique index wallet_movements_one_transfer_fee_per_transaction
on public.wallet_movements (transaction_id)
where movement_role = 'transfer_fee';

create index transactions_financial_feed_active_order_idx
on public.transactions (
  user_id,
  occurred_at desc,
  created_at desc,
  id desc
)
where deleted_at is null
  and kind in ('income', 'expense', 'transfer');

create index transactions_financial_feed_deleted_order_idx
on public.transactions (
  user_id,
  occurred_at desc,
  created_at desc,
  id desc
)
where deleted_at is not null
  and kind in ('income', 'expense', 'transfer');

comment on column public.transactions.idempotency_key is
  'Client operation UUID used only to make transfer creation retries safe per owner.';

create function public.assert_transfer_transaction(p_transaction_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  transaction_kind text;
  movement_count integer;
  source_count integer;
  destination_count integer;
  fee_count integer;
  source_wallet_id uuid;
  destination_wallet_id uuid;
  fee_wallet_id uuid;
  source_amount bigint;
  destination_amount bigint;
  fee_amount bigint;
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
    count(*) filter (where movement_role = 'transfer_source')::integer,
    count(*) filter (where movement_role = 'transfer_destination')::integer,
    count(*) filter (where movement_role = 'transfer_fee')::integer
  into movement_count, source_count, destination_count, fee_count
  from public.wallet_movements
  where transaction_id = p_transaction_id;

  if transaction_kind = 'transfer' then
    if source_count <> 1
      or destination_count <> 1
      or fee_count not in (0, 1)
      or movement_count <> 2 + fee_count then
      raise exception
        'A transfer must have exactly one source, one destination, and at most one fee movement.'
        using errcode = '23514';
    end if;

    select wallet_id, amount
    into source_wallet_id, source_amount
    from public.wallet_movements
    where transaction_id = p_transaction_id
      and movement_role = 'transfer_source';

    select wallet_id, amount
    into destination_wallet_id, destination_amount
    from public.wallet_movements
    where transaction_id = p_transaction_id
      and movement_role = 'transfer_destination';

    if source_wallet_id = destination_wallet_id
      or source_amount >= 0
      or destination_amount <= 0
      or abs(source_amount::numeric) <> destination_amount::numeric then
      raise exception
        'Transfer principal movements must use different wallets with equal opposite magnitudes.'
        using errcode = '23514';
    end if;

    if fee_count = 1 then
      select wallet_id, amount
      into fee_wallet_id, fee_amount
      from public.wallet_movements
      where transaction_id = p_transaction_id
        and movement_role = 'transfer_fee';

      if fee_wallet_id <> source_wallet_id or fee_amount >= 0 then
        raise exception
          'A transfer fee must be a negative movement on the source wallet.'
          using errcode = '23514';
      end if;
    end if;
  elsif exists (
    select 1
    from public.wallet_movements
    where transaction_id = p_transaction_id
      and movement_role in (
        'transfer_source',
        'transfer_destination',
        'transfer_fee'
      )
  ) then
    raise exception
      'Transfer movements require a transfer transaction.'
      using errcode = '23514';
  end if;
end;
$$;

revoke all on function public.assert_transfer_transaction(uuid)
  from public, anon, authenticated;

create function public.enforce_transfer_invariants()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_table_name = 'transactions' then
    if tg_op <> 'DELETE' then
      perform public.assert_transfer_transaction(new.id);
    end if;

    if tg_op <> 'INSERT'
      and (tg_op = 'DELETE' or old.id is distinct from new.id) then
      perform public.assert_transfer_transaction(old.id);
    end if;
  elsif tg_table_name = 'wallet_movements' then
    if tg_op <> 'DELETE' then
      perform public.assert_transfer_transaction(new.transaction_id);
    end if;

    if tg_op <> 'INSERT'
      and (
        tg_op = 'DELETE'
        or old.transaction_id is distinct from new.transaction_id
      ) then
      perform public.assert_transfer_transaction(old.transaction_id);
    end if;
  end if;

  return null;
end;
$$;

revoke all on function public.enforce_transfer_invariants()
  from public, anon, authenticated;

create constraint trigger enforce_transaction_transfer
after insert or update or delete on public.transactions
deferrable initially deferred
for each row execute function public.enforce_transfer_invariants();

create constraint trigger enforce_movement_transfer
after insert or update or delete on public.wallet_movements
deferrable initially deferred
for each row execute function public.enforce_transfer_invariants();

create view public.transaction_feed
with (security_invoker = true)
as
select
  transaction.id as transaction_id,
  transaction.user_id,
  transaction.kind,
  movement.wallet_id,
  wallet.name as wallet_name,
  wallet.archived_at as wallet_archived_at,
  null::uuid as source_wallet_id,
  null::text as source_wallet_name,
  null::timestamptz as source_wallet_archived_at,
  null::uuid as destination_wallet_id,
  null::text as destination_wallet_name,
  null::timestamptz as destination_wallet_archived_at,
  transaction.description,
  transaction.notes,
  abs(movement.amount::numeric)::text as amount,
  '0'::text as fee_amount,
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
where transaction.kind in ('income', 'expense')

union all

select
  transaction.id as transaction_id,
  transaction.user_id,
  transaction.kind,
  null::uuid as wallet_id,
  null::text as wallet_name,
  null::timestamptz as wallet_archived_at,
  source.wallet_id as source_wallet_id,
  source_wallet.name as source_wallet_name,
  source_wallet.archived_at as source_wallet_archived_at,
  destination.wallet_id as destination_wallet_id,
  destination_wallet.name as destination_wallet_name,
  destination_wallet.archived_at as destination_wallet_archived_at,
  transaction.description,
  transaction.notes,
  abs(source.amount::numeric)::text as amount,
  coalesce(abs(fee.amount::numeric), 0)::text as fee_amount,
  transaction.occurred_at,
  transaction.deleted_at,
  transaction.created_at,
  transaction.updated_at
from public.transactions as transaction
join public.wallet_movements as source
  on source.transaction_id = transaction.id
  and source.user_id = transaction.user_id
  and source.movement_role = 'transfer_source'
join public.wallets as source_wallet
  on source_wallet.id = source.wallet_id
  and source_wallet.user_id = source.user_id
join public.wallet_movements as destination
  on destination.transaction_id = transaction.id
  and destination.user_id = transaction.user_id
  and destination.movement_role = 'transfer_destination'
join public.wallets as destination_wallet
  on destination_wallet.id = destination.wallet_id
  and destination_wallet.user_id = destination.user_id
left join public.wallet_movements as fee
  on fee.transaction_id = transaction.id
  and fee.user_id = transaction.user_id
  and fee.movement_role = 'transfer_fee'
where transaction.kind = 'transfer';

revoke all on table public.transaction_feed from public, anon, authenticated;
grant select on table public.transaction_feed to authenticated;

create function public.create_transfer(
  p_source_wallet_id uuid,
  p_destination_wallet_id uuid,
  p_amount bigint,
  p_fee bigint,
  p_occurred_at timestamptz,
  p_description text,
  p_notes text,
  p_idempotency_key uuid
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
  existing_transaction public.transactions%rowtype;
  existing_source_wallet_id uuid;
  existing_destination_wallet_id uuid;
  existing_amount numeric;
  existing_fee numeric;
  locked_wallet record;
  locked_wallet_count integer := 0;
begin
  if caller_id is null then
    raise exception 'Authentication is required.' using errcode = '42501';
  end if;

  if p_idempotency_key is null then
    raise exception 'Idempotency key is required.' using errcode = '22023';
  end if;

  if p_source_wallet_id is null
    or p_destination_wallet_id is null
    or p_source_wallet_id = p_destination_wallet_id then
    raise exception 'Source and destination wallets must be different.'
      using errcode = '22023';
  end if;

  if p_amount is null or p_amount <= 0 then
    raise exception 'Transfer amount must be greater than zero.'
      using errcode = '22023';
  end if;

  if p_fee is null or p_fee < 0 then
    raise exception 'Transfer fee cannot be negative.' using errcode = '22023';
  end if;

  if p_occurred_at is null or p_occurred_at > now() then
    raise exception 'Transfer time cannot be in the future.'
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

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(
      caller_id::text || ':' || p_idempotency_key::text,
      0
    )
  );

  select *
  into existing_transaction
  from public.transactions
  where user_id = caller_id
    and kind = 'transfer'
    and idempotency_key = p_idempotency_key;

  if found then
    perform public.assert_transfer_transaction(existing_transaction.id);

    select
      source.wallet_id,
      destination.wallet_id,
      abs(source.amount::numeric),
      coalesce(abs(fee.amount::numeric), 0)
    into
      existing_source_wallet_id,
      existing_destination_wallet_id,
      existing_amount,
      existing_fee
    from public.wallet_movements as source
    join public.wallet_movements as destination
      on destination.transaction_id = source.transaction_id
      and destination.user_id = source.user_id
      and destination.movement_role = 'transfer_destination'
    left join public.wallet_movements as fee
      on fee.transaction_id = source.transaction_id
      and fee.user_id = source.user_id
      and fee.movement_role = 'transfer_fee'
    where source.transaction_id = existing_transaction.id
      and source.user_id = caller_id
      and source.movement_role = 'transfer_source';

    if existing_source_wallet_id is not distinct from p_source_wallet_id
      and existing_destination_wallet_id is not distinct from p_destination_wallet_id
      and existing_amount = p_amount::numeric
      and existing_fee = p_fee::numeric
      and existing_transaction.occurred_at is not distinct from p_occurred_at
      and existing_transaction.description is not distinct from normalized_description
      and existing_transaction.notes is not distinct from normalized_notes then
      return existing_transaction.id;
    end if;

    raise exception 'Idempotency key was already used with a different transfer.'
      using errcode = '22023';
  end if;

  for locked_wallet in
    select id
    from public.wallets
    where id in (p_source_wallet_id, p_destination_wallet_id)
      and user_id = caller_id
      and archived_at is null
    order by id
    for update
  loop
    locked_wallet_count := locked_wallet_count + 1;
  end loop;

  if locked_wallet_count <> 2 then
    raise exception 'Both wallets must be active and owned by the caller.'
      using errcode = 'P0002';
  end if;

  insert into public.transactions (
    user_id,
    kind,
    occurred_at,
    description,
    notes,
    idempotency_key
  )
  values (
    caller_id,
    'transfer',
    p_occurred_at,
    normalized_description,
    normalized_notes,
    p_idempotency_key
  )
  returning id into transaction_id;

  insert into public.wallet_movements (
    user_id,
    transaction_id,
    wallet_id,
    amount,
    movement_role
  )
  values
    (
      caller_id,
      transaction_id,
      p_source_wallet_id,
      -p_amount,
      'transfer_source'
    ),
    (
      caller_id,
      transaction_id,
      p_destination_wallet_id,
      p_amount,
      'transfer_destination'
    );

  if p_fee > 0 then
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
      p_source_wallet_id,
      -p_fee,
      'transfer_fee'
    );
  end if;

  return transaction_id;
end;
$$;

create function public.update_transfer(
  p_transaction_id uuid,
  p_source_wallet_id uuid,
  p_destination_wallet_id uuid,
  p_amount bigint,
  p_fee bigint,
  p_occurred_at timestamptz,
  p_description text,
  p_notes text
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
  source_movement_id uuid;
  destination_movement_id uuid;
  fee_movement_id uuid;
  current_source_wallet_id uuid;
  current_destination_wallet_id uuid;
  target_wallet record;
  target_wallet_count integer := 0;
begin
  if caller_id is null then
    raise exception 'Authentication is required.' using errcode = '42501';
  end if;

  if p_transaction_id is null then
    raise exception 'Transfer is required.' using errcode = '22023';
  end if;

  if p_source_wallet_id is null
    or p_destination_wallet_id is null
    or p_source_wallet_id = p_destination_wallet_id then
    raise exception 'Source and destination wallets must be different.'
      using errcode = '22023';
  end if;

  if p_amount is null or p_amount <= 0 then
    raise exception 'Transfer amount must be greater than zero.'
      using errcode = '22023';
  end if;

  if p_fee is null or p_fee < 0 then
    raise exception 'Transfer fee cannot be negative.' using errcode = '22023';
  end if;

  if p_occurred_at is null or p_occurred_at > now() then
    raise exception 'Transfer time cannot be in the future.'
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
  from public.transactions
  where id = p_transaction_id
    and user_id = caller_id
    and kind = 'transfer'
    and deleted_at is null
  for update;

  if not found then
    raise exception 'Transfer is not available for editing.'
      using errcode = 'P0002';
  end if;

  perform public.assert_transfer_transaction(p_transaction_id);

  select id, wallet_id
  into strict source_movement_id, current_source_wallet_id
  from public.wallet_movements
  where transaction_id = p_transaction_id
    and user_id = caller_id
    and movement_role = 'transfer_source'
  for update;

  select id, wallet_id
  into strict destination_movement_id, current_destination_wallet_id
  from public.wallet_movements
  where transaction_id = p_transaction_id
    and user_id = caller_id
    and movement_role = 'transfer_destination'
  for update;

  select id
  into fee_movement_id
  from public.wallet_movements
  where transaction_id = p_transaction_id
    and user_id = caller_id
    and movement_role = 'transfer_fee'
  for update;

  for target_wallet in
    select id, archived_at
    from public.wallets
    where id in (p_source_wallet_id, p_destination_wallet_id)
      and user_id = caller_id
    order by id
    for update
  loop
    target_wallet_count := target_wallet_count + 1;

    if target_wallet.archived_at is not null
      and (
        (target_wallet.id = p_source_wallet_id
          and p_source_wallet_id is distinct from current_source_wallet_id)
        or
        (target_wallet.id = p_destination_wallet_id
          and p_destination_wallet_id is distinct from current_destination_wallet_id)
      ) then
      raise exception 'A transfer cannot be retargeted to an archived wallet.'
        using errcode = 'P0002';
    end if;
  end loop;

  if target_wallet_count <> 2 then
    raise exception 'Both wallets must be owned by the caller.'
      using errcode = 'P0002';
  end if;

  update public.transactions
  set
    occurred_at = p_occurred_at,
    description = normalized_description,
    notes = normalized_notes
  where id = p_transaction_id
    and user_id = caller_id;

  update public.wallet_movements
  set
    wallet_id = p_source_wallet_id,
    amount = -p_amount
  where id = source_movement_id
    and user_id = caller_id;

  update public.wallet_movements
  set
    wallet_id = p_destination_wallet_id,
    amount = p_amount
  where id = destination_movement_id
    and user_id = caller_id;

  if p_fee > 0 and fee_movement_id is null then
    insert into public.wallet_movements (
      user_id,
      transaction_id,
      wallet_id,
      amount,
      movement_role
    )
    values (
      caller_id,
      p_transaction_id,
      p_source_wallet_id,
      -p_fee,
      'transfer_fee'
    );
  elsif p_fee > 0 then
    update public.wallet_movements
    set
      wallet_id = p_source_wallet_id,
      amount = -p_fee
    where id = fee_movement_id
      and user_id = caller_id;
  elsif fee_movement_id is not null then
    delete from public.wallet_movements
    where id = fee_movement_id
      and user_id = caller_id;
  end if;
end;
$$;

create function public.soft_delete_transfer(p_transaction_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller_id uuid := auth.uid();
  locked_movement record;
begin
  if caller_id is null then
    raise exception 'Authentication is required.' using errcode = '42501';
  end if;

  perform 1
  from public.transactions
  where id = p_transaction_id
    and user_id = caller_id
    and kind = 'transfer'
    and deleted_at is null
  for update;

  if not found then
    raise exception 'Transfer is not available for deletion.'
      using errcode = 'P0002';
  end if;

  perform public.assert_transfer_transaction(p_transaction_id);

  for locked_movement in
    select id
    from public.wallet_movements
    where transaction_id = p_transaction_id
      and user_id = caller_id
    order by id
    for update
  loop
  end loop;

  update public.transactions
  set deleted_at = now()
  where id = p_transaction_id
    and user_id = caller_id;
end;
$$;

create function public.restore_transfer(p_transaction_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller_id uuid := auth.uid();
  locked_movement record;
begin
  if caller_id is null then
    raise exception 'Authentication is required.' using errcode = '42501';
  end if;

  perform 1
  from public.transactions
  where id = p_transaction_id
    and user_id = caller_id
    and kind = 'transfer'
    and deleted_at is not null
  for update;

  if not found then
    raise exception 'Transfer is not available for restoration.'
      using errcode = 'P0002';
  end if;

  perform public.assert_transfer_transaction(p_transaction_id);

  for locked_movement in
    select id
    from public.wallet_movements
    where transaction_id = p_transaction_id
      and user_id = caller_id
    order by id
    for update
  loop
  end loop;

  update public.transactions
  set deleted_at = null
  where id = p_transaction_id
    and user_id = caller_id;
end;
$$;

revoke all on function public.create_transfer(
  uuid,
  uuid,
  bigint,
  bigint,
  timestamptz,
  text,
  text,
  uuid
) from public, anon, authenticated;

revoke all on function public.update_transfer(
  uuid,
  uuid,
  uuid,
  bigint,
  bigint,
  timestamptz,
  text,
  text
) from public, anon, authenticated;

revoke all on function public.soft_delete_transfer(uuid)
  from public, anon, authenticated;

revoke all on function public.restore_transfer(uuid)
  from public, anon, authenticated;

grant execute on function public.create_transfer(
  uuid,
  uuid,
  bigint,
  bigint,
  timestamptz,
  text,
  text,
  uuid
) to authenticated;

grant execute on function public.update_transfer(
  uuid,
  uuid,
  uuid,
  bigint,
  bigint,
  timestamptz,
  text,
  text
) to authenticated;

grant execute on function public.soft_delete_transfer(uuid)
  to authenticated;

grant execute on function public.restore_transfer(uuid)
  to authenticated;

comment on function public.create_transfer(
  uuid,
  uuid,
  bigint,
  bigint,
  timestamptz,
  text,
  text,
  uuid
) is 'Atomically creates an idempotent owned transfer with balanced principal and an optional source fee.';

comment on function public.update_transfer(
  uuid,
  uuid,
  uuid,
  bigint,
  bigint,
  timestamptz,
  text,
  text
) is 'Atomically updates an active owned transfer and its existing principal/optional fee shape.';

comment on function public.soft_delete_transfer(uuid) is
  'Soft-deletes an active owned transfer while retaining all movement rows.';

comment on function public.restore_transfer(uuid) is
  'Restores a deleted owned transfer using its existing movement rows.';
