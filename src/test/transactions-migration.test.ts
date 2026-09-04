import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { describe, expect, it } from 'vitest'

const migration = readFileSync(
  resolve(
    process.cwd(),
    'supabase/migrations/20260902000000_add_income_expense_transactions.sql',
  ),
  'utf8',
)

describe('Phase 4 income and expense migration', () => {
  it('adds only the approved transaction metadata and precision-safe view', () => {
    expect(migration).toMatch(/add column description text/i)
    expect(migration).toMatch(/add column notes text/i)
    expect(migration).toMatch(
      /create view public\.income_expense_transactions/i,
    )
    expect(migration).toMatch(/with \(security_invoker = true\)/i)
    expect(migration).toMatch(
      /abs\(movement\.amount::numeric\)::text as amount/i,
    )
    expect(migration).not.toMatch(
      /category_id|create table public\.categories/i,
    )
    expect(migration).not.toMatch(/create function public\..*transfer/i)
  })

  it('enforces exact-one signed income and expense movements', () => {
    expect(migration).toMatch(
      /wallet_movements_one_income_expense_per_transaction/i,
    )
    expect(migration).toMatch(/deferrable initially deferred/gi)
    expect(migration).toMatch(/movement_count <> 1/i)
    expect(migration).toMatch(/transaction_kind = 'income' and amount > 0/i)
    expect(migration).toMatch(/transaction_kind = 'expense' and amount < 0/i)
  })

  it('uses hardened atomic RPC boundaries without trusting a user id', () => {
    expect(migration).toMatch(
      /create function public\.create_income_expense_transaction/i,
    )
    expect(migration).toMatch(
      /create function public\.update_income_expense_transaction/i,
    )
    expect(migration).toMatch(
      /create function public\.soft_delete_income_expense_transaction/i,
    )
    expect(migration).toMatch(
      /create function public\.restore_income_expense_transaction/i,
    )
    expect(
      migration.match(/security definer/gi)?.length,
    ).toBeGreaterThanOrEqual(6)
    expect(
      migration.match(/set search_path = ''/gi)?.length,
    ).toBeGreaterThanOrEqual(6)
    expect(migration).not.toMatch(/p_user_id/i)
    expect(migration).not.toMatch(
      /grant (insert|update|delete).*public\.(transactions|wallet_movements).*authenticated/i,
    )
  })

  it('preserves movement rows during delete and restore', () => {
    const restoreBody = migration.match(
      /create function public\.restore_income_expense_transaction[\s\S]*?as \$\$([\s\S]*?)\$\$;/i,
    )?.[1]

    expect(migration).toMatch(/set deleted_at = now\(\)/i)
    expect(migration).toMatch(/set deleted_at = null/i)
    expect(migration).not.toMatch(/delete from public\.wallet_movements/i)
    expect(restoreBody).toBeDefined()
    expect(restoreBody).not.toMatch(/insert into public\.wallet_movements/i)
  })

  it('rejects future events and archived creation targets at the database boundary', () => {
    expect(migration).toMatch(/p_occurred_at > now\(\)/i)
    expect(migration).toMatch(/archived_at is null/i)
    expect(migration).toMatch(/p_amount <= 0/i)
  })
})
