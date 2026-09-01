import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { describe, expect, it } from 'vitest'

const migrationPath = resolve(
  process.cwd(),
  'supabase/migrations/20260901000000_create_wallet_ledger.sql',
)
const migration = readFileSync(migrationPath, 'utf8')
const taxonomyMigration = readFileSync(
  resolve(
    process.cwd(),
    'supabase/migrations/20260901010000_add_e_money_wallet_type.sql',
  ),
  'utf8',
)

describe('Phase 3 wallet ledger migration', () => {
  it('creates the ledger tables without a mutable wallet balance', () => {
    expect(migration).toMatch(/create table public\.wallets/i)
    expect(migration).toMatch(/create table public\.transactions/i)
    expect(migration).toMatch(/create table public\.wallet_movements/i)
    expect(migration).toMatch(/amount bigint not null/i)
    expect(migration).not.toMatch(
      /create table public\.wallets[\s\S]*?\bbalance\s+(bigint|integer|numeric)/i,
    )
  })

  it('locks the narrow zero opening-balance exception', () => {
    expect(migration).toMatch(
      /amount <> 0 or movement_role = 'opening_balance'/i,
    )
    expect(migration).toMatch(/wallet_movements_one_opening_per_wallet/i)
    expect(migration).toMatch(/wallet_movements_one_opening_per_transaction/i)
    expect(migration).toMatch(/deferrable initially deferred/gi)
  })

  it('uses owner-qualified relationships and RLS on every financial table', () => {
    expect(migration).toMatch(
      /foreign key \(transaction_id, user_id\)[\s\S]*?references public\.transactions \(id, user_id\)/i,
    )
    expect(migration).toMatch(
      /foreign key \(wallet_id, user_id\)[\s\S]*?references public\.wallets \(id, user_id\)/i,
    )
    expect(migration.match(/enable row level security/gi)).toHaveLength(3)
    expect(migration).not.toMatch(/using\s*\(\s*true\s*\)/i)
  })

  it('keeps ledger writes behind pinned security-definer functions', () => {
    expect(migration).toMatch(/create function public\.create_wallet/i)
    expect(migration).toMatch(
      /create function public\.update_wallet_opening_balance/i,
    )
    expect(migration).toMatch(/create function public\.archive_wallet/i)
    expect(migration).toMatch(/create function public\.restore_wallet/i)
    expect(
      migration.match(/security definer/gi)?.length,
    ).toBeGreaterThanOrEqual(7)
    expect(
      migration.match(/set search_path = ''/gi)?.length,
    ).toBeGreaterThanOrEqual(8)
    expect(migration).not.toMatch(
      /grant (insert|update|delete).*public\.(transactions|wallet_movements).*authenticated/i,
    )
  })

  it('derives exact balances through security-invoker views', () => {
    expect(migration).toMatch(/create view public\.wallet_balances/i)
    expect(migration).toMatch(/with \(security_invoker = true\)/i)
    expect(migration).toMatch(/transaction\.deleted_at is null/i)
    expect(migration).toMatch(/sum\(movement\.amount\)/i)
    expect(migration).toMatch(/movement\.amount::text as opening_balance/i)
  })

  it('adds e-money through a forward-compatible constraint and RPC update', () => {
    expect(taxonomyMigration).toMatch(/drop constraint wallets_type_check/i)
    expect(taxonomyMigration).toMatch(
      /type in \('bank', 'e_wallet', 'e_money', 'cash', 'other'\)/i,
    )
    expect(taxonomyMigration).toMatch(
      /create or replace function public\.create_wallet/i,
    )
    expect(taxonomyMigration).toMatch(
      /p_wallet_type not in \('bank', 'e_wallet', 'e_money', 'cash', 'other'\)/i,
    )
    expect(taxonomyMigration).not.toMatch(/institution\s+in\s*\(/i)
  })
})
