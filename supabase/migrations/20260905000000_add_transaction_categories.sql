-- Phase 6/Stage 2: Transaction Categorization
-- Adds categories catalog, seeds system defaults, associates categories with transactions,
-- and updates atomic RPCs and views.

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  name text not null,
  type text not null,
  icon text not null default 'folder',
  color text not null default '#64748b',
  is_system boolean not null default false,
  archived_at timestamptz default null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint categories_name_check check (
    name = btrim(name)
    and char_length(name) between 1 and 50
  ),
  constraint categories_type_check check (
    type in ('income', 'expense', 'transfer')
  ),
  constraint categories_system_user_check check (
    (is_system = true and user_id is null)
    or (is_system = false and user_id is not null)
  )
);

create unique index categories_user_type_name_idx
on public.categories (
  coalesce(user_id, '00000000-0000-0000-0000-000000000000'::uuid),
  type,
  name
);

create index categories_user_type_idx
on public.categories (user_id, type)
where archived_at is null;

create index categories_system_type_idx
on public.categories (type)
where is_system = true and archived_at is null;

alter table public.categories enable row level security;

create policy categories_select
on public.categories
for select
to authenticated
using (
  user_id = auth.uid() or is_system = true
);

create policy categories_insert
on public.categories
for insert
to authenticated
with check (
  user_id = auth.uid() and not is_system
);

create policy categories_update
on public.categories
for update
to authenticated
using (
  user_id = auth.uid() and not is_system
)
with check (
  user_id = auth.uid() and not is_system
);

create policy categories_delete
on public.categories
for delete
to authenticated
using (
  user_id = auth.uid() and not is_system
);

revoke all on table public.categories from public, anon, authenticated;
grant select, insert, update, delete on table public.categories to authenticated;

-- Seed default system categories
insert into public.categories (name, type, icon, color, is_system)
values
  -- Expense
  ('Makanan & Minuman', 'expense', 'utensils', '#f97316', true),
  ('Transportasi', 'expense', 'car', '#0ea5e9', true),
  ('Belanja', 'expense', 'shopping-bag', '#8b5cf6', true),
  ('Tagihan & Utilitas', 'expense', 'receipt', '#eab308', true),
  ('Hiburan & Liburan', 'expense', 'film', '#ec4899', true),
  ('Kesehatan', 'expense', 'heart-pulse', '#ef4444', true),
  ('Pendidikan', 'expense', 'graduation-cap', '#3b82f6', true),
  ('Lainnya', 'expense', 'shapes', '#64748b', true),
  -- Income
  ('Gaji & Upah', 'income', 'briefcase', '#10b981', true),
  ('Bisnis & Penjualan', 'income', 'store', '#06b6d4', true),
  ('Bonus & Tunjangan', 'income', 'gift', '#f59e0b', true),
  ('Investasi & Dividen', 'income', 'trending-up', '#14b8a6', true),
  ('Hadiah & Hibah', 'income', 'sparkles', '#a855f7', true),
  ('Lainnya', 'income', 'wallet', '#64748b', true),
  -- Transfer
  ('Top Up E-Wallet', 'transfer', 'smartphone', '#0284c7', true),
  ('Pindah Rekening Pribadi', 'transfer', 'building-columns', '#0f766e', true),
  ('Nabung / Investasi', 'transfer', 'piggy-bank', '#059669', true),
  ('Bayar Kartu Kredit / Cicilan', 'transfer', 'credit-card', '#dc2626', true),
  ('Kirim ke Keluarga', 'transfer', 'users', '#7c3aed', true);

-- Add category_id to transactions table
alter table public.transactions
add column category_id uuid references public.categories(id) on delete set null;

create index transactions_category_id_idx
on public.transactions (category_id)
where category_id is not null;

-- Recreate views to expose category fields
drop view if exists public.income_expense_transactions;

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
  transaction.category_id,
  category.name as category_name,
  category.icon as category_icon,
  category.color as category_color,
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
left join public.categories as category
  on category.id = transaction.category_id;

revoke all on table public.income_expense_transactions from public, anon, authenticated;
grant select on table public.income_expense_transactions to authenticated;

drop view if exists public.transaction_feed;

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
  transaction.category_id,
  category.name as category_name,
  category.icon as category_icon,
  category.color as category_color,
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
left join public.categories as category
  on category.id = transaction.category_id
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
  transaction.category_id,
  category.name as category_name,
  category.icon as category_icon,
  category.color as category_color,
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
left join public.categories as category
  on category.id = transaction.category_id
where transaction.kind = 'transfer';

revoke all on table public.transaction_feed from public, anon, authenticated;
grant select on table public.transaction_feed to authenticated;

-- Update create_income_expense_transaction RPC
drop function if exists public.create_income_expense_transaction(text, uuid, bigint, timestamptz, text, text);

create or replace function public.create_income_expense_transaction(
  p_kind text,
  p_wallet_id uuid,
  p_amount bigint,
  p_occurred_at timestamptz,
  p_description text,
  p_notes text default null,
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

  if p_category_id is not null then
    perform 1
    from public.categories
    where id = p_category_id
      and (user_id = caller_id or is_system = true)
      and type = p_kind
      and archived_at is null;

    if not found then
      raise exception 'Selected category is not valid for this transaction.'
        using errcode = '22023';
    end if;
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
    notes,
    category_id
  )
  values (
    caller_id,
    p_kind,
    p_occurred_at,
    normalized_description,
    normalized_notes,
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

revoke all on function public.create_income_expense_transaction(text, uuid, bigint, timestamptz, text, text, uuid)
  from public, anon, authenticated;
grant execute on function public.create_income_expense_transaction(text, uuid, bigint, timestamptz, text, text, uuid)
  to authenticated;

-- Update update_income_expense_transaction RPC
drop function if exists public.update_income_expense_transaction(uuid, text, uuid, bigint, timestamptz, text, text);

create or replace function public.update_income_expense_transaction(
  p_transaction_id uuid,
  p_kind text,
  p_wallet_id uuid,
  p_amount bigint,
  p_occurred_at timestamptz,
  p_description text,
  p_notes text default null,
  p_category_id uuid default null
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

  if p_category_id is not null then
    perform 1
    from public.categories
    where id = p_category_id
      and (user_id = caller_id or is_system = true)
      and type = p_kind
      and archived_at is null;

    if not found then
      raise exception 'Selected category is not valid for this transaction.'
        using errcode = '22023';
    end if;
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

  intended_amount := case when p_kind = 'income' then p_amount else -p_amount end;

  update public.transactions
  set
    kind = p_kind,
    occurred_at = p_occurred_at,
    description = normalized_description,
    notes = normalized_notes,
    category_id = p_category_id,
    updated_at = timezone('utc', now())
  where id = p_transaction_id
    and user_id = caller_id;

  update public.wallet_movements
  set
    wallet_id = p_wallet_id,
    amount = intended_amount,
    movement_role = p_kind,
    updated_at = timezone('utc', now())
  where id = movement_id
    and transaction_id = p_transaction_id
    and user_id = caller_id;
end;
$$;

revoke all on function public.update_income_expense_transaction(uuid, text, uuid, bigint, timestamptz, text, text, uuid)
  from public, anon, authenticated;
grant execute on function public.update_income_expense_transaction(uuid, text, uuid, bigint, timestamptz, text, text, uuid)
  to authenticated;

-- Update create_transfer RPC
drop function if exists public.create_transfer(uuid, uuid, bigint, bigint, timestamptz, text, text, uuid);

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
    where transaction_id = existing_transaction.id
      and user_id = caller_id
      and movement_role = 'transfer_source';

    select wallet_id
    into existing_destination_wallet_id
    from public.wallet_movements
    where transaction_id = existing_transaction.id
      and user_id = caller_id
      and movement_role = 'transfer_destination';

    select coalesce(abs(amount::numeric), 0)
    into existing_fee
    from public.wallet_movements
    where transaction_id = existing_transaction.id
      and user_id = caller_id
      and movement_role = 'transfer_fee';

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

-- Update update_transfer RPC
drop function if exists public.update_transfer(uuid, uuid, uuid, bigint, bigint, timestamptz, text, text);

create or replace function public.update_transfer(
  p_transaction_id uuid,
  p_source_wallet_id uuid,
  p_destination_wallet_id uuid,
  p_amount bigint,
  p_fee bigint,
  p_occurred_at timestamptz,
  p_description text,
  p_notes text default null,
  p_category_id uuid default null
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
  locked_wallet record;
  wallets_to_lock uuid[];
  expected_lock_count integer;
  actual_lock_count integer := 0;
begin
  if caller_id is null then
    raise exception 'Authentication is required.' using errcode = '42501';
  end if;

  if p_transaction_id is null then
    raise exception 'Transaction is required.' using errcode = '22023';
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

  select array_agg(distinct wallet_id order by wallet_id)
  into wallets_to_lock
  from (
    values
      (p_source_wallet_id),
      (p_destination_wallet_id),
      (current_source_wallet_id),
      (current_destination_wallet_id)
  ) as target_wallets(wallet_id);

  expected_lock_count := cardinality(wallets_to_lock);

  for locked_wallet in
    select id
    from public.wallets
    where id = any(wallets_to_lock)
      and user_id = caller_id
      and (
        archived_at is null
        or id in (current_source_wallet_id, current_destination_wallet_id)
      )
    order by id
    for update
  loop
    actual_lock_count := actual_lock_count + 1;
  end loop;

  if actual_lock_count <> expected_lock_count then
    raise exception 'One or more transfer wallets are unavailable.'
      using errcode = 'P0002';
  end if;

  perform 1
  from public.wallets
  where id in (p_source_wallet_id, p_destination_wallet_id)
    and user_id = caller_id
    and archived_at is not null;

  if found then
    raise exception 'Cannot transfer using an archived wallet.'
      using errcode = 'P0002';
  end if;

  update public.transactions
  set
    occurred_at = p_occurred_at,
    description = normalized_description,
    notes = normalized_notes,
    category_id = p_category_id,
    updated_at = timezone('utc', now())
  where id = p_transaction_id
    and user_id = caller_id;

  update public.wallet_movements
  set
    wallet_id = p_source_wallet_id,
    amount = -p_amount,
    updated_at = timezone('utc', now())
  where id = source_movement_id;

  update public.wallet_movements
  set
    wallet_id = p_destination_wallet_id,
    amount = p_amount,
    updated_at = timezone('utc', now())
  where id = destination_movement_id;

  if p_fee > 0 then
    if fee_movement_id is not null then
      update public.wallet_movements
      set
        wallet_id = p_source_wallet_id,
        amount = -p_fee,
        updated_at = timezone('utc', now())
      where id = fee_movement_id;
    else
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
    end if;
  elsif fee_movement_id is not null then
    delete from public.wallet_movements
    where id = fee_movement_id;
  end if;
end;
$$;

revoke all on function public.update_transfer(uuid, uuid, uuid, bigint, bigint, timestamptz, text, text, uuid)
  from public, anon, authenticated;
grant execute on function public.update_transfer(uuid, uuid, uuid, bigint, bigint, timestamptz, text, text, uuid)
  to authenticated;
