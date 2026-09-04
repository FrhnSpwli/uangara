import type { SupabaseClient } from '@supabase/supabase-js'
import { describe, expect, it, vi } from 'vitest'

import type { Database } from '../../../types/database'
import { createSupabaseTransferService } from './transfer-service'

const input = {
  amount: 500000,
  description: 'Mandiri to GoPay',
  destinationWalletId: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
  fee: 1000,
  notes: null,
  occurredAt: '2026-09-04T10:00:00.000Z',
  sourceWalletId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
}

describe('transfer service boundary', () => {
  it('passes a stable idempotency key and no owner or movement signs', async () => {
    const rpc = vi.fn((name: string, args: Record<string, unknown>) => {
      void name
      void args
      return Promise.resolve({
        data: 'dddddddd-dddd-dddd-dddd-dddddddddddd',
        error: null,
      })
    })
    const service = createSupabaseTransferService({
      rpc,
    } as unknown as SupabaseClient<Database>)

    await service.createTransfer(input, 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee')

    expect(rpc).toHaveBeenCalledWith('create_transfer', {
      p_amount: 500000,
      p_description: 'Mandiri to GoPay',
      p_destination_wallet_id: input.destinationWalletId,
      p_fee: 1000,
      p_idempotency_key: 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
      p_notes: null,
      p_occurred_at: input.occurredAt,
      p_source_wallet_id: input.sourceWalletId,
    })
    expect(rpc.mock.calls[0]?.[1]).not.toHaveProperty('user_id')
    expect(rpc.mock.calls[0]?.[1]).not.toHaveProperty('movement_role')
  })

  it('reuses exactly the caller-provided key for a retry', async () => {
    const rpc = vi.fn((name: string, args: Record<string, unknown>) => {
      void name
      void args
      return Promise.resolve({
        data: 'dddddddd-dddd-dddd-dddd-dddddddddddd',
        error: null,
      })
    })
    const service = createSupabaseTransferService({
      rpc,
    } as unknown as SupabaseClient<Database>)
    const key = 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee'

    await service.createTransfer(input, key)
    await service.createTransfer(input, key)

    expect(rpc).toHaveBeenCalledTimes(2)
    expect(rpc.mock.calls[0]?.[1]).toEqual(rpc.mock.calls[1]?.[1])
  })

  it.each([
    { amount: 0, fee: 0 },
    { amount: -1, fee: 0 },
    { amount: 1, fee: -1 },
    { amount: Number.MAX_SAFE_INTEGER + 1, fee: 0 },
  ])('rejects unsafe transfer money before RPC: %o', async (money) => {
    const rpc = vi.fn((name: string, args: Record<string, unknown>) => {
      void name
      void args
      return Promise.resolve({ data: null, error: null })
    })
    const service = createSupabaseTransferService({
      rpc,
    } as unknown as SupabaseClient<Database>)

    await expect(
      service.createTransfer(
        { ...input, ...money },
        'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
      ),
    ).rejects.toThrow(/whole number/i)
    expect(rpc).not.toHaveBeenCalled()
  })

  it('uses narrow lifecycle RPCs', async () => {
    const rpc = vi.fn((name: string, args: Record<string, unknown>) => {
      void name
      void args
      return Promise.resolve({ data: null, error: null })
    })
    const service = createSupabaseTransferService({
      rpc,
    } as unknown as SupabaseClient<Database>)
    const transferId = 'dddddddd-dddd-dddd-dddd-dddddddddddd'

    await service.updateTransfer(transferId, input)
    await service.softDeleteTransfer(transferId)
    await service.restoreTransfer(transferId)

    expect(rpc).toHaveBeenNthCalledWith(1, 'update_transfer', {
      p_amount: 500000,
      p_description: input.description,
      p_destination_wallet_id: input.destinationWalletId,
      p_fee: 1000,
      p_notes: null,
      p_occurred_at: input.occurredAt,
      p_source_wallet_id: input.sourceWalletId,
      p_transaction_id: transferId,
    })
    expect(rpc).toHaveBeenNthCalledWith(2, 'soft_delete_transfer', {
      p_transaction_id: transferId,
    })
    expect(rpc).toHaveBeenNthCalledWith(3, 'restore_transfer', {
      p_transaction_id: transferId,
    })
  })
})
