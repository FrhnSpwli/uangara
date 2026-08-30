import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { describe, expect, it } from 'vitest'

const migrationPath = resolve(
  process.cwd(),
  'supabase/migrations/20260830000000_create_profiles.sql',
)
const migration = readFileSync(migrationPath, 'utf8')

describe('profiles migration security contract', () => {
  it('creates only the minimal auth-owned profile table', () => {
    expect(migration).toMatch(/create table public\.profiles/i)
    expect(migration).toMatch(
      /references auth\.users \(id\) on delete cascade/i,
    )
    expect(migration).toMatch(/display_name text/i)
    expect(migration).not.toMatch(
      /create table public\.(wallets|transactions|wallet_movements|categories)/i,
    )
  })

  it('enables RLS and removes anonymous table privileges', () => {
    expect(migration).toMatch(
      /alter table public\.profiles enable row level security/i,
    )
    expect(migration).toMatch(
      /revoke all on table public\.profiles from anon, authenticated/i,
    )
  })

  it('defines explicit owner-scoped policies for select, insert, and update', () => {
    expect(migration).toMatch(
      /for select\s+to authenticated\s+using[\s\S]*auth\.uid\(\)/i,
    )
    expect(migration).toMatch(
      /for insert\s+to authenticated\s+with check[\s\S]*auth\.uid\(\)/i,
    )
    expect(migration).toMatch(
      /for update\s+to authenticated\s+using[\s\S]*auth\.uid\(\)[\s\S]*with check[\s\S]*auth\.uid\(\)/i,
    )
    expect(migration).not.toMatch(/using\s*\(\s*true\s*\)/i)
  })

  it('creates profiles through a constrained auth trigger', () => {
    expect(migration).toMatch(/security definer\s+set search_path = ''/i)
    expect(migration).toMatch(/after insert on auth\.users/i)
    expect(migration).toMatch(
      /revoke all on function public\.handle_new_user\(\) from public, anon, authenticated/i,
    )
  })
})
