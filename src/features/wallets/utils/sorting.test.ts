import { describe, expect, it } from 'vitest'

import {
  compareWalletsByType,
  sortWalletsByType,
  WALLET_TYPE_PRIORITY,
} from './sorting'

describe('wallet sorting utils', () => {
  it('defines the required priority order: bank, e_wallet, e_money, cash, other', () => {
    expect(WALLET_TYPE_PRIORITY.bank).toBeLessThan(
      WALLET_TYPE_PRIORITY.e_wallet,
    )
    expect(WALLET_TYPE_PRIORITY.e_wallet).toBeLessThan(
      WALLET_TYPE_PRIORITY.e_money,
    )
    expect(WALLET_TYPE_PRIORITY.e_money).toBeLessThan(WALLET_TYPE_PRIORITY.cash)
    expect(WALLET_TYPE_PRIORITY.cash).toBeLessThan(WALLET_TYPE_PRIORITY.other)
  })

  it('sorts wallets prioritizing Bank, E-Wallet, E-Money, then Cash, then Other', () => {
    const input = [
      { name: 'Uang Tunai', type: 'cash' },
      { name: 'GoPay', type: 'e_wallet' },
      { name: 'Flazz', type: 'e_money' },
      { name: 'BCA', type: 'bank' },
      { name: 'Kupon Belanja', type: 'other' },
      { name: 'Mandiri', type: 'bank' },
    ]

    const result = sortWalletsByType(input)

    expect(result.map((w) => w.name)).toEqual([
      'BCA',
      'Mandiri',
      'GoPay',
      'Flazz',
      'Uang Tunai',
      'Kupon Belanja',
    ])
  })

  it('orders by newest createdAt within the same wallet type', () => {
    const input = [
      {
        createdAt: '2026-01-01T10:00:00.000Z',
        name: 'Bank Jago',
        type: 'bank',
      },
      {
        createdAt: '2026-03-01T10:00:00.000Z',
        name: 'Bank Mandiri',
        type: 'bank',
      },
      {
        createdAt: '2026-02-01T10:00:00.000Z',
        name: 'BCA',
        type: 'bank',
      },
    ]

    const result = sortWalletsByType(input)

    expect(result.map((w) => w.name)).toEqual([
      'Bank Mandiri',
      'BCA',
      'Bank Jago',
    ])
  })

  it('falls back to alphabetical name when createdAt is equal or missing', () => {
    const input = [
      { name: 'ShopeePay', type: 'e_wallet' },
      { name: 'DANA', type: 'e_wallet' },
      { name: 'GoPay', type: 'e_wallet' },
    ]

    const result = sortWalletsByType(input)

    expect(result.map((w) => w.name)).toEqual(['DANA', 'GoPay', 'ShopeePay'])
  })

  it('places unknown or null types after standard wallet types', () => {
    const input = [
      { name: 'Unknown Wallet', type: null },
      { name: 'Bank BCA', type: 'bank' },
      { name: 'Dompet Lain', type: 'other' },
    ]

    const result = sortWalletsByType(input)

    expect(result.map((w) => w.name)).toEqual([
      'Bank BCA',
      'Dompet Lain',
      'Unknown Wallet',
    ])
  })

  it('returns 0 when two wallets are completely equal in compareWalletsByType', () => {
    const a = {
      createdAt: '2026-01-01T00:00:00.000Z',
      name: 'BCA',
      type: 'bank',
    }
    const b = {
      createdAt: '2026-01-01T00:00:00.000Z',
      name: 'BCA',
      type: 'bank',
    }

    expect(compareWalletsByType(a, b)).toBe(0)
  })

  it('returns a new array without mutating the input', () => {
    const input = [
      { name: 'Cash', type: 'cash' },
      { name: 'Bank', type: 'bank' },
    ]

    const result = sortWalletsByType(input)

    expect(result).not.toBe(input)
    expect(input[0].name).toBe('Cash')
  })
})
