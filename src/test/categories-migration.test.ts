import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { describe, expect, it } from 'vitest'

const migration = readFileSync(
  resolve(
    process.cwd(),
    'supabase/migrations/20260905000000_add_transaction_categories.sql',
  ),
  'utf8',
)

describe('Stage 2 transaction categories migration', () => {
  it('creates categories table with RLS and owner isolation', () => {
    expect(migration).toMatch(/create table public\.categories/i)
    expect(migration).toMatch(/enable row level security/i)
    expect(migration).toMatch(/user_id = auth\.uid\(\) or is_system = true/i)
    expect(migration).toMatch(/user_id = auth\.uid\(\) and not is_system/i)
  })

  it('seeds default categories for expense, income, and transfer', () => {
    expect(migration).toMatch(/'Makanan & Minuman', 'expense'/i)
    expect(migration).toMatch(/'Gaji & Upah', 'income'/i)
    expect(migration).toMatch(/'Top Up E-Wallet', 'transfer'/i)
  })

  it('adds category_id to transactions table and indexes it', () => {
    expect(migration).toMatch(
      /alter table public\.transactions[\s\S]*?add column category_id uuid references public\.categories\(id\)/i,
    )
    expect(migration).toMatch(/create index transactions_category_id_idx/i)
  })

  it('recreates income_expense_transactions and transaction_feed views with category metadata', () => {
    expect(migration).toMatch(/transaction\.category_id/i)
    expect(migration).toMatch(/category\.name as category_name/i)
    expect(migration).toMatch(/category\.icon as category_icon/i)
    expect(migration).toMatch(/category\.color as category_color/i)
  })

  it('updates RPCs to accept and validate p_category_id', () => {
    expect(migration).toMatch(
      /create or replace function public\.create_income_expense_transaction[\s\S]*?p_category_id uuid default null/i,
    )
    expect(migration).toMatch(
      /create or replace function public\.update_income_expense_transaction[\s\S]*?p_category_id uuid default null/i,
    )
    expect(migration).toMatch(
      /create or replace function public\.create_transfer[\s\S]*?p_category_id uuid default null/i,
    )
    expect(migration).toMatch(
      /create or replace function public\.update_transfer[\s\S]*?p_category_id uuid default null/i,
    )
    expect(migration).toMatch(
      /Selected category is not valid for this transaction/i,
    )
    expect(migration).toMatch(
      /Selected category is not valid for this transfer/i,
    )
  })
})
