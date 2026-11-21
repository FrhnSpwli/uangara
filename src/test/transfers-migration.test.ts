import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { describe, expect, it } from 'vitest'

const migration = readFileSync(
  resolve(
    process.cwd(),
    'supabase/migrations/20260904000000_add_wallet_transfers.sql',
  ),
  'utf8',
)

describe('Phase 5 transfer migration', () => {
  it('adds the three explicit movement roles and exact-shape enforcement', () => {
    expect(migration).toMatch(/'transfer_source'/i)
    expect(migration).toMatch(/'transfer_destination'/i)
    expect(migration).toMatch(/'transfer_fee'/i)
    expect(migration).toMatch(/movement_count <> 2 \+ fee_count/i)
    expect(migration).toMatch(/deferrable initially deferred/gi)
  })

  it('keeps principal equal, opposite, and on distinct wallets', () => {
    expect(migration).toMatch(/source_wallet_id = destination_wallet_id/i)
    expect(migration).toMatch(/source_amount >= 0/i)
    expect(migration).toMatch(/destination_amount <= 0/i)
    expect(migration).toMatch(
      /abs\(source_amount::numeric\) <> destination_amount::numeric/i,
    )
  })

  it('uses a source-paid optional fee and omits a zero fee row', () => {
    expect(migration).toMatch(/fee_wallet_id <> source_wallet_id/i)
    expect(migration).toMatch(/if p_fee > 0 then/i)
    expect(migration).toMatch(/elsif fee_movement_id is not null then/i)
  })

  it('implements scoped idempotency and deterministic locking', () => {
    expect(migration).toMatch(/\(user_id, idempotency_key\)/i)
    expect(migration).toMatch(/pg_advisory_xact_lock/i)
    expect(migration).toMatch(/order by id\s+for update/i)
    expect(migration).toMatch(/already used with a different transfer/i)
  })

  it('hardens all transfer RPCs and trusts no client owner', () => {
    for (const name of [
      'create_transfer',
      'update_transfer',
      'soft_delete_transfer',
      'restore_transfer',
    ]) {
      expect(migration).toMatch(
        new RegExp(`create function public\\.${name}`, 'i'),
      )
    }

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

  it('adds a security-invoker feed and no later-phase schema', () => {
    expect(migration).toMatch(/create view public\.transaction_feed/i)
    expect(migration).toMatch(/with \(security_invoker = true\)/i)
    expect(migration).not.toMatch(
      /create table public\.(categories|transfers)/i,
    )
    expect(migration).not.toMatch(/wallet\.balance/i)
  })
})
