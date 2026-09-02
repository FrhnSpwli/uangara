import type { SupabaseClient } from '@supabase/supabase-js'
import { describe, expect, it, vi } from 'vitest'

import type { Database } from '../../../types/database'
import { createSupabaseTransactionService } from './transaction-service'

describe('transaction service boundary', () => {
  it('passes only the approved magnitude and event fields to the create RPC', async () => {
    const rpc = vi.fn((name: string, args: Record<string, unknown>) => {
      void name
      void args
      return Promise.resolve({
        data: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
        error: null,
      })
    })
    const client = { rpc } as unknown as SupabaseClient<Database>
    const service = createSupabaseTransactionService(client)

    await service.createTransaction({
      amount: 500000,
      description: 'Salary',
      kind: 'income',
      notes: null,
      occurredAt: '2026-09-02T10:00:00.000Z',
      walletId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    })

    expect(rpc).toHaveBeenCalledWith('create_income_expense_transaction', {
      p_amount: 500000,
      p_description: 'Salary',
      p_kind: 'income',
      p_notes: null,
      p_occurred_at: '2026-09-02T10:00:00.000Z',
      p_wallet_id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    })
    expect(rpc.mock.calls[0]?.[1]).not.toHaveProperty('user_id')
    expect(rpc.mock.calls[0]?.[1]).not.toHaveProperty('movement_role')
  })

  it('rejects unsafe or non-positive amounts before an RPC call', async () => {
    const rpc = vi.fn((name: string, args: Record<string, unknown>) => {
      void name
      void args
      return Promise.resolve({ data: null, error: null })
    })
    const client = { rpc } as unknown as SupabaseClient<Database>
    const service = createSupabaseTransactionService(client)

    await expect(
      service.createTransaction({
        amount: -1,
        description: 'Invalid',
        kind: 'expense',
        notes: null,
        occurredAt: '2026-09-02T10:00:00.000Z',
        walletId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      }),
    ).rejects.toThrow(/positive whole number/i)
    expect(rpc).not.toHaveBeenCalled()
  })
})
