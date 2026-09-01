import { describe, expect, it } from 'vitest'

import { formatMoney, parseMoneyInput } from './money'

describe('wallet monetary boundary', () => {
  it('accepts positive, zero, and negative whole amounts', () => {
    expect(parseMoneyInput('2000000')).toMatchObject({
      databaseValue: 2000000,
      exactValue: '2000000',
      valid: true,
    })
    expect(parseMoneyInput('0')).toMatchObject({
      databaseValue: 0,
      exactValue: '0',
      valid: true,
    })
    expect(parseMoneyInput('-50000')).toMatchObject({
      databaseValue: -50000,
      exactValue: '-50000',
      valid: true,
    })
  })

  it('rejects fractions and exponent notation', () => {
    expect(parseMoneyInput('1.5').valid).toBe(false)
    expect(parseMoneyInput('1e6').valid).toBe(false)
  })

  it('rejects values beyond the JavaScript safe-integer boundary', () => {
    expect(parseMoneyInput('9007199254740992').valid).toBe(false)
    expect(parseMoneyInput('-9007199254740992').valid).toBe(false)
  })

  it('formats an exact database integer string without Number coercion', () => {
    expect(formatMoney('9007199254740993')).toContain('9')
  })
})
