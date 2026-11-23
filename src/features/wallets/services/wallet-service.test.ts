import type { SupabaseClient } from '@supabase/supabase-js'
import { describe, expect, it, vi } from 'vitest'

import type { Database } from '../../../types/database'
import { createSupabaseWalletService } from './wallet-service'

describe('wallet service boundary', () => {
  it('returns active wallets sorted by priority: bank, e_wallet, e_money, cash, other', async () => {
    const mockRows = [
      {
        archived_at: null,
        balance: '50000',
        created_at: '2026-09-01T04:00:00.000Z',
        institution: null,
        name: 'Uang Dompet',
        type: 'cash',
        updated_at: '2026-09-01T04:00:00.000Z',
        user_id: 'user-1',
        wallet_id: 'wallet-cash',
      },
      {
        archived_at: null,
        balance: '150000',
        created_at: '2026-09-01T02:00:00.000Z',
        institution: 'GoPay',
        name: '08123456789',
        type: 'e_wallet',
        updated_at: '2026-09-01T02:00:00.000Z',
        user_id: 'user-1',
        wallet_id: 'wallet-gopay',
      },
      {
        archived_at: null,
        balance: '2500000',
        created_at: '2026-09-01T01:00:00.000Z',
        institution: 'BCA',
        name: '1234567890',
        type: 'bank',
        updated_at: '2026-09-01T01:00:00.000Z',
        user_id: 'user-1',
        wallet_id: 'wallet-bca',
      },
      {
        archived_at: null,
        balance: '100000',
        created_at: '2026-09-01T03:00:00.000Z',
        institution: 'Flazz',
        name: '987654',
        type: 'e_money',
        updated_at: '2026-09-01T03:00:00.000Z',
        user_id: 'user-1',
        wallet_id: 'wallet-flazz',
      },
    ]

    const queryBuilder = {
      is: vi.fn().mockResolvedValue({ data: mockRows, error: null }),
      not: vi.fn().mockResolvedValue({ data: mockRows, error: null }),
      order: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
    }

    const client = {
      from: vi.fn().mockReturnValue(queryBuilder),
    } as unknown as SupabaseClient<Database>

    const service = createSupabaseWalletService(client)
    const result = await service.listWallets('active')

    expect(result.map((w) => w.type)).toEqual([
      'bank',
      'e_wallet',
      'e_money',
      'cash',
    ])
    expect(result.map((w) => w.id)).toEqual([
      'wallet-bca',
      'wallet-gopay',
      'wallet-flazz',
      'wallet-cash',
    ])
  })

  it('throws SafeWalletError when query returns an error', async () => {
    const queryBuilder = {
      is: vi
        .fn()
        .mockResolvedValue({ data: null, error: { message: 'db error' } }),
      not: vi
        .fn()
        .mockResolvedValue({ data: null, error: { message: 'db error' } }),
      order: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
    }

    const client = {
      from: vi.fn().mockReturnValue(queryBuilder),
    } as unknown as SupabaseClient<Database>

    const service = createSupabaseWalletService(client)

    await expect(service.listWallets('active')).rejects.toThrow(
      /load your wallets/i,
    )
  })
})
