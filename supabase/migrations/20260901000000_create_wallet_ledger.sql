create table public.wallets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  type text not null,
  institution text,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint wallets_id_user_id_key unique (id, user_id),
  constraint wallets_name_check check (
    name = btrim(name)
    and char_length(name) between 1 and 100
  ),
  constraint wallets_type_check check (
    type in ('bank', 'e_wallet', 'cash', 'other')
  ),
  constraint wallets_institution_check check (
    institution is null
    or (
      institution = btrim(institution)
      and char_length(institution) between 1 and 100
    )
  )
);

create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  kind text not null,
  occurred_at timestamptz not null,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint transactions_id_user_id_key unique (id, user_id),
  constraint transactions_kind_check check (
    kind in ('opening_balance', 'income', 'expense', 'transfer')
  ),
  constraint transactions_opening_balance_active_check check (
    kind <> 'opening_balance' or deleted_at is null
  )
);

create table public.wallet_movements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  transaction_id uuid not null,
  wallet_id uuid not null,
  amount bigint not null,
  movement_role text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint wallet_movements_id_user_id_key unique (id, user_id),
  constraint wallet_movements_transaction_owner_fkey
    foreign key (transaction_id, user_id)
    references public.transactions (id, user_id)
    on delete cascade,
  constraint wallet_movements_wallet_owner_fkey
    foreign key (wallet_id, user_id)
    references public.wallets (id, user_id)
    on delete cascade,
  constraint wallet_movements_role_check check (
    movement_role = btrim(movement_role)
    and char_length(movement_role) between 1 and 40
  ),
  constraint wallet_movements_amount_check check (
    amount <> 0 or movement_role = 'opening_balance'
  )
);

create unique index wallet_movements_one_opening_per_wallet
on public.wallet_movements (wallet_id)
where movement_role = 'opening_balance';

create unique index wallet_movements_one_opening_per_transaction
on public.wallet_movements (transaction_id)
where movement_role = 'opening_balance';

create index wallets_user_archived_created_idx
on public.wallets (user_id, archived_at, created_at);

create index transactions_user_occurred_idx
on public.transactions (user_id, occurred_at, id);

create index wallet_movements_wallet_idx
on public.wallet_movements (wallet_id, transaction_id);

comment on table public.wallets is
  'User-owned locations where money exists. Balance is derived from ledger movements.';

comment on table public.transactions is
  'Ledger event metadata. Phase 3 exposes only opening_balance behavior.';

comment on table public.wallet_movements is
  'Signed BIGINT effects of transactions on owner-qualified wallets.';

comment on column public.wallet_movements.amount is
  'Whole monetary units. Zero is allowed only for the single opening_balance movement.';

create function public.set_financial_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

revoke all on function public.set_financial_updated_at() from public, anon, authenticated;

create trigger set_wallet_updated_at
before update on public.wallets
for each row execute function public.set_financial_updated_at();

create trigger set_transaction_updated_at
before update on public.transactions
for each row execute function public.set_financial_updated_at();

create trigger set_wallet_movement_updated_at
before update on public.wallet_movements
for each row execute function public.set_financial_updated_at();

create function public.assert_wallet_opening_balance(p_wallet_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  opening_count integer;
begin
  if not exists (
    select 1
    from public.wallets
    where id = p_wallet_id
  ) then
    return;
  end if;

  select count(*)::integer
  into opening_count
  from public.wallet_movements as movement
  join public.transactions as transaction
    on transaction.id = movement.transaction_id
    and transaction.user_id = movement.user_id
  where movement.wallet_id = p_wallet_id
    and movement.movement_role = 'opening_balance'
    and transaction.kind = 'opening_balance'
    and transaction.deleted_at is null;

  if opening_count <> 1 then
    raise exception 'A wallet must have exactly one active opening balance.'
      using errcode = '23514';
  end if;
end;
$$;

create function public.assert_transaction_opening_balance(p_transaction_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  transaction_kind text;
  opening_count integer;
begin
  select kind
  into transaction_kind
  from public.transactions
  where id = p_transaction_id;

  if not found then
    return;
  end if;

  select count(*)::integer
  into opening_count
  from public.wallet_movements
  where transaction_id = p_transaction_id
    and movement_role = 'opening_balance';

  if transaction_kind = 'opening_balance' and opening_count <> 1 then
    raise exception 'An opening balance transaction must have exactly one opening movement.'
      using errcode = '23514';
  end if;

  if transaction_kind <> 'opening_balance' and opening_count <> 0 then
    raise exception 'Only an opening balance transaction may own an opening movement.'
      using errcode = '23514';
  end if;
end;
$$;

revoke all on function public.assert_wallet_opening_balance(uuid)
  from public, anon, authenticated;
revoke all on function public.assert_transaction_opening_balance(uuid)
  from public, anon, authenticated;

create function public.enforce_opening_balance_invariants()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_table_name = 'wallets' then
    if tg_op <> 'DELETE' then
      perform public.assert_wallet_opening_balance(new.id);
    end if;

    if tg_op = 'UPDATE' and old.id is distinct from new.id then
      perform public.assert_wallet_opening_balance(old.id);
    end if;
  elsif tg_table_name = 'wallet_movements' then
    if tg_op <> 'DELETE' then
      perform public.assert_wallet_opening_balance(new.wallet_id);
      perform public.assert_transaction_opening_balance(new.transaction_id);
    end if;

    if tg_op <> 'INSERT' then
      if tg_op = 'DELETE' or old.wallet_id is distinct from new.wallet_id then
        perform public.assert_wallet_opening_balance(old.wallet_id);
      end if;

      if tg_op = 'DELETE' or old.transaction_id is distinct from new.transaction_id then
        perform public.assert_transaction_opening_balance(old.transaction_id);
      end if;
    end if;
  elsif tg_table_name = 'transactions' then
    if tg_op <> 'DELETE' then
      perform public.assert_transaction_opening_balance(new.id);
    end if;

    if tg_op = 'UPDATE' and old.id is distinct from new.id then
      perform public.assert_transaction_opening_balance(old.id);
    end if;
  end if;

  return null;
end;
$$;

revoke all on function public.enforce_opening_balance_invariants()
  from public, anon, authenticated;

create constraint trigger enforce_wallet_opening_balance
after insert or update or delete on public.wallets
deferrable initially deferred
for each row execute function public.enforce_opening_balance_invariants();

create constraint trigger enforce_movement_opening_balance
after insert or update or delete on public.wallet_movements
deferrable initially deferred
for each row execute function public.enforce_opening_balance_invariants();

create constraint trigger enforce_transaction_opening_balance
after insert or update or delete on public.transactions
deferrable initially deferred
for each row execute function public.enforce_opening_balance_invariants();

alter table public.wallets enable row level security;
alter table public.transactions enable row level security;
alter table public.wallet_movements enable row level security;

revoke all on table public.wallets from anon, authenticated;
revoke all on table public.transactions from anon, authenticated;
revoke all on table public.wallet_movements from anon, authenticated;

grant select on table public.wallets to authenticated;
grant update (name, type, institution) on table public.wallets to authenticated;
grant select on table public.transactions to authenticated;
grant select on table public.wallet_movements to authenticated;

create policy wallets_select_own
on public.wallets
for select
to authenticated
using ((select auth.uid()) is not null and (select auth.uid()) = user_id);

create policy wallets_update_active_own
on public.wallets
for update
to authenticated
using (
  (select auth.uid()) is not null
  and (select auth.uid()) = user_id
  and archived_at is null
)
with check (
  (select auth.uid()) is not null
  and (select auth.uid()) = user_id
  and archived_at is null
);

create policy transactions_select_own
on public.transactions
for select
to authenticated
using ((select auth.uid()) is not null and (select auth.uid()) = user_id);

create policy wallet_movements_select_own
on public.wallet_movements
for select
to authenticated
using ((select auth.uid()) is not null and (select auth.uid()) = user_id);

create view public.wallet_balances
with (security_invoker = true)
as
select
  wallet.id as wallet_id,
  wallet.user_id,
  wallet.name,
  wallet.type,
  wallet.institution,
  wallet.archived_at,
  wallet.created_at,
  wallet.updated_at,
  coalesce(
    sum(movement.amount) filter (where transaction.id is not null),
    0
  )::text as balance
from public.wallets as wallet
left join public.wallet_movements as movement
  on movement.wallet_id = wallet.id
  and movement.user_id = wallet.user_id
left join public.transactions as transaction
  on transaction.id = movement.transaction_id
  and transaction.user_id = movement.user_id
  and transaction.deleted_at is null
group by wallet.id;

create view public.wallet_opening_balances
with (security_invoker = true)
as
select
  wallet.id as wallet_id,
  wallet.user_id,
  transaction.id as transaction_id,
  movement.id as movement_id,
  movement.amount::text as opening_balance,
  transaction.occurred_at
from public.wallets as wallet
join public.wallet_movements as movement
  on movement.wallet_id = wallet.id
  and movement.user_id = wallet.user_id
  and movement.movement_role = 'opening_balance'
join public.transactions as transaction
  on transaction.id = movement.transaction_id
  and transaction.user_id = movement.user_id
  and transaction.kind = 'opening_balance'
  and transaction.deleted_at is null;

revoke all on table public.wallet_balances from public, anon, authenticated;
revoke all on table public.wallet_opening_balances from public, anon, authenticated;
grant select on table public.wallet_balances to authenticated;
grant select on table public.wallet_opening_balances to authenticated;

create function public.create_wallet(
  p_name text,
  p_wallet_type text,
  p_institution text default null,
  p_opening_balance bigint default 0
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller_id uuid := auth.uid();
  normalized_name text := btrim(p_name);
  normalized_institution text := nullif(btrim(p_institution), '');
  wallet_id uuid;
  transaction_id uuid;
begin
  if caller_id is null then
    raise exception 'Authentication is required.' using errcode = '42501';
  end if;

  if p_name is null or char_length(normalized_name) not between 1 and 100 then
    raise exception 'Wallet name must contain between 1 and 100 characters.'
      using errcode = '22023';
  end if;

  if p_wallet_type is null
    or p_wallet_type not in ('bank', 'e_wallet', 'cash', 'other') then
    raise exception 'Wallet type is invalid.' using errcode = '22023';
  end if;

  if normalized_institution is not null
    and char_length(normalized_institution) > 100 then
    raise exception 'Institution must contain at most 100 characters.'
      using errcode = '22023';
  end if;

  if p_opening_balance is null then
    raise exception 'Opening balance is required.' using errcode = '22023';
  end if;

  insert into public.wallets (user_id, name, type, institution)
  values (caller_id, normalized_name, p_wallet_type, normalized_institution)
  returning id into wallet_id;

  insert into public.transactions (user_id, kind, occurred_at)
  values (caller_id, 'opening_balance', now())
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
    wallet_id,
    p_opening_balance,
    'opening_balance'
  );

  return wallet_id;
end;
$$;

create function public.update_wallet_opening_balance(
  p_wallet_id uuid,
  p_opening_balance bigint
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller_id uuid := auth.uid();
  opening_transaction_id uuid;
  opening_movement_id uuid;
begin
  if caller_id is null then
    raise exception 'Authentication is required.' using errcode = '42501';
  end if;

  if p_wallet_id is null or p_opening_balance is null then
    raise exception 'Wallet and opening balance are required.' using errcode = '22023';
  end if;

  perform 1
  from public.wallets
  where id = p_wallet_id
    and user_id = caller_id
    and archived_at is null
  for update;

  if not found then
    raise exception 'Wallet is not available for editing.' using errcode = 'P0002';
  end if;

  select transaction.id, movement.id
  into strict opening_transaction_id, opening_movement_id
  from public.transactions as transaction
  join public.wallet_movements as movement
    on movement.transaction_id = transaction.id
    and movement.user_id = transaction.user_id
  where transaction.user_id = caller_id
    and transaction.kind = 'opening_balance'
    and transaction.deleted_at is null
    and movement.wallet_id = p_wallet_id
    and movement.movement_role = 'opening_balance';

  update public.wallet_movements
  set amount = p_opening_balance
  where id = opening_movement_id
    and user_id = caller_id;

  update public.transactions
  set updated_at = now()
  where id = opening_transaction_id
    and user_id = caller_id;
end;
$$;

create function public.archive_wallet(p_wallet_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller_id uuid := auth.uid();
begin
  if caller_id is null then
    raise exception 'Authentication is required.' using errcode = '42501';
  end if;

  update public.wallets
  set archived_at = now()
  where id = p_wallet_id
    and user_id = caller_id
    and archived_at is null;

  if not found then
    raise exception 'Wallet is not available for archiving.' using errcode = 'P0002';
  end if;
end;
$$;

create function public.restore_wallet(p_wallet_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller_id uuid := auth.uid();
begin
  if caller_id is null then
    raise exception 'Authentication is required.' using errcode = '42501';
  end if;

  update public.wallets
  set archived_at = null
  where id = p_wallet_id
    and user_id = caller_id
    and archived_at is not null;

  if not found then
    raise exception 'Wallet is not available for restoration.' using errcode = 'P0002';
  end if;
end;
$$;

revoke all on function public.create_wallet(text, text, text, bigint)
  from public, anon, authenticated;
revoke all on function public.update_wallet_opening_balance(uuid, bigint)
  from public, anon, authenticated;
revoke all on function public.archive_wallet(uuid)
  from public, anon, authenticated;
revoke all on function public.restore_wallet(uuid)
  from public, anon, authenticated;

grant execute on function public.create_wallet(text, text, text, bigint)
  to authenticated;
grant execute on function public.update_wallet_opening_balance(uuid, bigint)
  to authenticated;
grant execute on function public.archive_wallet(uuid)
  to authenticated;
grant execute on function public.restore_wallet(uuid)
  to authenticated;

comment on function public.create_wallet(text, text, text, bigint) is
  'Atomically creates an owned wallet and its single opening balance ledger pair.';

comment on function public.update_wallet_opening_balance(uuid, bigint) is
  'Atomically updates the existing opening movement for an active owned wallet.';

comment on function public.archive_wallet(uuid) is
  'Archives an owned active wallet without changing its ledger.';

comment on function public.restore_wallet(uuid) is
  'Restores an owned archived wallet without changing its ledger.';
