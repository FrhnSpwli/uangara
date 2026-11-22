import { describe, expect, it } from 'vitest'

import { validateTransactionForm } from './validation'

const now = new Date('2026-09-02T12:00:00.000Z')

function values(overrides: Record<string, string> = {}) {
  return {
    amount: '35000',
    description: 'Lunch',
    kind: 'expense',
    notes: '',
    occurredAt: '2026-09-02T10:00:00.000Z',
    walletId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    ...overrides,
  }
}

describe('transaction form validation', () => {
  it('normalizes a valid backdated transaction without changing its magnitude', () => {
    expect(validateTransactionForm(values(), now)).toEqual({
      input: {
        amount: 35000,
        categoryId: null,
        description: 'Lunch',
        kind: 'expense',
        notes: null,
        occurredAt: '2026-09-02T10:00:00.000Z',
        walletId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      },
      kind: 'expense',
      valid: true,
    })
  })

  it.each(['0', '-1', '1.5', '9007199254740992'])(
    'rejects the ordinary amount %s',
    (amount) => {
      const result = validateTransactionForm(values({ amount }), now)
      expect(result.valid).toBe(false)
    },
  )

  it('rejects a future occurrence time', () => {
    const result = validateTransactionForm(
      values({ occurredAt: '2026-09-02T12:00:01.000Z' }),
      now,
    )

    expect(result).toMatchObject({
      errors: { occurredAt: 'Transaction time cannot be in the future.' },
      valid: false,
    })
  })

  it('trims description and notes and rejects unsupported kinds', () => {
    expect(
      validateTransactionForm(
        values({ description: '  Salary  ', kind: 'income', notes: '  Net  ' }),
        now,
      ),
    ).toMatchObject({
      input: { description: 'Salary', kind: 'income', notes: 'Net' },
      kind: 'income',
      valid: true,
    })

    expect(
      validateTransactionForm(values({ kind: 'other' }), now),
    ).toMatchObject({
      errors: { kind: 'Choose income, expense, or transfer.' },
      valid: false,
    })

    expect(
      validateTransactionForm(values({ kind: 'transfer' }), now, {
        allowTransfer: false,
      }),
    ).toMatchObject({
      errors: { kind: 'Choose income or expense.' },
      valid: false,
    })
  })

  it('validates transfer form when kind is transfer', () => {
    const transferValues = {
      amount: '50000',
      description: 'Transfer to savings',
      destinationWalletId: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
      fee: '2500',
      kind: 'transfer',
      notes: 'Monthly saving',
      occurredAt: '2026-09-02T10:00:00.000Z',
      sourceWalletId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      walletId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    }

    expect(validateTransactionForm(transferValues, now)).toEqual({
      input: {
        amount: 50000,
        categoryId: null,
        description: 'Transfer to savings',
        destinationWalletId: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
        fee: 2500,
        notes: 'Monthly saving',
        occurredAt: '2026-09-02T10:00:00.000Z',
        sourceWalletId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      },
      kind: 'transfer',
      valid: true,
    })
  })

  it('rejects transfer when source and destination are the same', () => {
    const transferValues = {
      amount: '50000',
      description: 'Self transfer',
      destinationWalletId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      kind: 'transfer',
      notes: '',
      occurredAt: '2026-09-02T10:00:00.000Z',
      sourceWalletId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      walletId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    }

    expect(validateTransactionForm(transferValues, now)).toMatchObject({
      errors: {
        destinationWalletId: 'Source and destination must be different.',
      },
      valid: false,
    })
  })
})
