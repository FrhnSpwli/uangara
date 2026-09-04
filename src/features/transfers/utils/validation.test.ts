import { describe, expect, it } from 'vitest'

import { validateTransferForm, type TransferFormValues } from './validation'

const validValues: TransferFormValues = {
  amount: '500000',
  description: 'Mandiri to GoPay',
  destinationWalletId: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
  fee: '1000',
  notes: '',
  occurredAt: '2026-09-04T10:00',
  sourceWalletId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
}

describe('transfer validation', () => {
  it('returns safe positive principal and non-negative fee inputs', () => {
    expect(
      validateTransferForm(validValues, new Date('2026-09-04T12:00:00Z')),
    ).toEqual({
      input: {
        amount: 500000,
        description: 'Mandiri to GoPay',
        destinationWalletId: validValues.destinationWalletId,
        fee: 1000,
        notes: null,
        occurredAt: new Date('2026-09-04T10:00').toISOString(),
        sourceWalletId: validValues.sourceWalletId,
      },
      valid: true,
    })
  })

  it('accepts a zero fee and does not check available balance', () => {
    const result = validateTransferForm(
      { ...validValues, amount: '9007199254740991', fee: '0' },
      new Date('2026-09-04T12:00:00Z'),
    )
    expect(result.valid).toBe(true)
  })

  it.each(['0', '-1', '1.5', '9007199254740992'])(
    'rejects invalid principal %s',
    (amount) => {
      expect(
        validateTransferForm(
          { ...validValues, amount },
          new Date('2026-09-04T12:00:00Z'),
        ).valid,
      ).toBe(false)
    },
  )

  it('rejects negative fee and same-wallet endpoints', () => {
    const result = validateTransferForm(
      {
        ...validValues,
        destinationWalletId: validValues.sourceWalletId,
        fee: '-1',
      },
      new Date('2026-09-04T12:00:00Z'),
    )
    expect(result.valid).toBe(false)
    if (result.valid) return
    expect(result.errors.destinationWalletId).toMatch(/different/i)
    expect(result.errors.fee).toMatch(/negative/i)
  })

  it('rejects future occurrence time and invalid text', () => {
    const result = validateTransferForm(
      { ...validValues, description: ' ', occurredAt: '2026-09-05T10:00' },
      new Date('2026-09-04T12:00:00Z'),
    )
    expect(result.valid).toBe(false)
    if (result.valid) return
    expect(result.errors.description).toBeTruthy()
    expect(result.errors.occurredAt).toMatch(/future/i)
  })
})
