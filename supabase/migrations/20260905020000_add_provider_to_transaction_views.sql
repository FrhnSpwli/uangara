-- Add wallet institution and wallet type to transaction views so UI cards can display provider and account number

drop view if exists public.transaction_feed;
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
  wallet.institution as wallet_institution,
  wallet.type as wallet_type,
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

create view public.transaction_feed
with (security_invoker = true)
as
select
  transaction.id as transaction_id,
  transaction.user_id,
  transaction.kind,
  movement.wallet_id,
  wallet.name as wallet_name,
  wallet.institution as wallet_institution,
  wallet.type as wallet_type,
  wallet.archived_at as wallet_archived_at,
  null::uuid as source_wallet_id,
  null::text as source_wallet_name,
  null::text as source_wallet_institution,
  null::text as source_wallet_type,
  null::timestamptz as source_wallet_archived_at,
  null::uuid as destination_wallet_id,
  null::text as destination_wallet_name,
  null::text as destination_wallet_institution,
  null::text as destination_wallet_type,
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
  null::text as wallet_institution,
  null::text as wallet_type,
  null::timestamptz as wallet_archived_at,
  source.wallet_id as source_wallet_id,
  source_wallet.name as source_wallet_name,
  source_wallet.institution as source_wallet_institution,
  source_wallet.type as source_wallet_type,
  source_wallet.archived_at as source_wallet_archived_at,
  destination.wallet_id as destination_wallet_id,
  destination_wallet.name as destination_wallet_name,
  destination_wallet.institution as destination_wallet_institution,
  destination_wallet.type as destination_wallet_type,
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
