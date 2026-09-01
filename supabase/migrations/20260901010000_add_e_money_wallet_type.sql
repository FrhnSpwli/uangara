alter table public.wallets
drop constraint wallets_type_check;

alter table public.wallets
add constraint wallets_type_check check (
  type in ('bank', 'e_wallet', 'e_money', 'cash', 'other')
);

create or replace function public.create_wallet(
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
    or p_wallet_type not in ('bank', 'e_wallet', 'e_money', 'cash', 'other') then
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

revoke all on function public.create_wallet(text, text, text, bigint)
  from public, anon, authenticated;

grant execute on function public.create_wallet(text, text, text, bigint)
  to authenticated;

comment on function public.create_wallet(text, text, text, bigint) is
  'Atomically creates an owned wallet and its single opening balance ledger pair.';
