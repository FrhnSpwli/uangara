-- Disambiguate transaction_id in create_transfer for clean plpgsql compilation

create or replace function public.create_transfer(
  p_source_wallet_id uuid,
  p_destination_wallet_id uuid,
  p_amount bigint,
  p_fee bigint,
  p_occurred_at timestamptz,
  p_description text,
  p_notes text,
  p_idempotency_key uuid,
  p_category_id uuid default null
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

  if p_category_id is not null then
    perform 1
    from public.categories
    where id = p_category_id
      and (user_id = caller_id or is_system = true)
      and type = 'transfer'
      and archived_at is null;

    if not found then
      raise exception 'Selected category is not valid for this transfer.'
        using errcode = '22023';
    end if;
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
    and idempotency_key = p_idempotency_key;

  if existing_transaction.idempotency_key is not null then
    select wallet_id, abs(amount::numeric)
    into existing_source_wallet_id, existing_amount
    from public.wallet_movements
    where wallet_movements.transaction_id = existing_transaction.id
      and wallet_movements.user_id = caller_id
      and wallet_movements.movement_role = 'transfer_source';

    select wallet_id
    into existing_destination_wallet_id
    from public.wallet_movements
    where wallet_movements.transaction_id = existing_transaction.id
      and wallet_movements.user_id = caller_id
      and wallet_movements.movement_role = 'transfer_destination';

    select coalesce(abs(amount::numeric), 0)
    into existing_fee
    from public.wallet_movements
    where wallet_movements.transaction_id = existing_transaction.id
      and wallet_movements.user_id = caller_id
      and wallet_movements.movement_role = 'transfer_fee';

    existing_fee := coalesce(existing_fee, 0);

    if existing_transaction.occurred_at <> p_occurred_at
      or existing_transaction.description <> normalized_description
      or existing_transaction.notes is distinct from normalized_notes
      or existing_transaction.category_id is distinct from p_category_id
      or existing_source_wallet_id <> p_source_wallet_id
      or existing_destination_wallet_id <> p_destination_wallet_id
      or existing_amount <> p_amount
      or existing_fee <> p_fee then
      raise exception
        'Idempotency key has already been used for a different transfer payload.'
        using errcode = '23505';
    end if;

    return existing_transaction.id;
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
    raise exception 'One or more transfer wallets are unavailable.'
      using errcode = 'P0002';
  end if;

  insert into public.transactions (
    user_id,
    kind,
    occurred_at,
    description,
    notes,
    idempotency_key,
    category_id
  )
  values (
    caller_id,
    'transfer',
    p_occurred_at,
    normalized_description,
    normalized_notes,
    p_idempotency_key,
    p_category_id
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

revoke all on function public.create_transfer(uuid, uuid, bigint, bigint, timestamptz, text, text, uuid, uuid)
  from public, anon, authenticated;
grant execute on function public.create_transfer(uuid, uuid, bigint, bigint, timestamptz, text, text, uuid, uuid)
  to authenticated;
