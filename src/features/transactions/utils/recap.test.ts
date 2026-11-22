import { describe, expect, it } from 'vitest'

import {
  createTransactionSummary,
  createTransferSummary,
} from '../../../test/transactions'
import {
  calculateAccumulatedBalance,
  calculateRecap,
  formatDateToInput,
  getCustomRange,
  getMonthRange,
  getMtdRange,
  getTodayRange,
  getWeekRange,
} from './recap'

describe('recap utilities', () => {
  it('calculates accumulated balance across multiple wallets safely', () => {
    const wallets = [
      { balance: '1500000' },
      { balance: '250000' },
      { balance: '-50000' }, // Overdrawn or negative balance valid per domain rules
    ]
    expect(calculateAccumulatedBalance(wallets)).toBe('1700000')
    expect(calculateAccumulatedBalance([])).toBe('0')
  })

  it('calculates recap categorizing income, expense, and transfer fees properly', () => {
    const transactions = [
      createTransactionSummary({
        amount: '10000000',
        id: '1',
        kind: 'income',
      }),
      createTransactionSummary({
        amount: '200000',
        id: '2',
        kind: 'expense',
      }),
      createTransactionSummary({
        amount: '150000',
        id: '3',
        kind: 'expense',
      }),
      createTransferSummary({
        amount: '3000000', // Transfer principal must NOT count as expense or income
        feeAmount: '2500', // Transfer fee counts as expense
        id: '4',
      }),
      createTransferSummary({
        amount: '500000',
        feeAmount: '0', // Zero fee transfer
        id: '5',
      }),
      createTransactionSummary({
        amount: '9999999',
        deletedAt: '2026-09-02T00:00:00.000Z', // Deleted transaction must be ignored
        id: '6',
        kind: 'expense',
      }),
    ]

    const recap = calculateRecap(transactions)

    expect(recap.incomeTotal).toBe('10000000')
    expect(recap.incomeCount).toBe(1)
    expect(recap.expenseTotal).toBe('352500') // 200000 + 150000 + 2500 fee
    expect(recap.expenseCount).toBe(2)
    expect(recap.transferCount).toBe(2)
    expect(recap.netDifference).toBe('9647500')
    expect(recap.transactionCount).toBe(6)
  })

  it('formats dates to input format YYYY-MM-DD', () => {
    const date = new Date(2026, 10, 22) // November 22, 2026
    expect(formatDateToInput(date)).toBe('2026-11-22')
  })

  it('builds date ranges for today, week, month, and custom', () => {
    const testDate = new Date(2026, 10, 22, 14, 30, 0) // Sunday Nov 22, 2026
    const today = getTodayRange(testDate)
    expect(today.startDate).toBe(
      new Date(2026, 10, 22, 0, 0, 0, 0).toISOString(),
    )
    expect(today.endDate).toBe(
      new Date(2026, 10, 22, 23, 59, 59, 999).toISOString(),
    )

    const week = getWeekRange(testDate)
    // Sunday Nov 22: diffToMonday is -6 -> Monday Nov 16
    expect(week.startDate).toBe(
      new Date(2026, 10, 16, 0, 0, 0, 0).toISOString(),
    )
    expect(week.endDate).toBe(
      new Date(2026, 10, 22, 23, 59, 59, 999).toISOString(),
    )

    const month = getMonthRange(testDate)
    expect(month.startDate).toBe(
      new Date(2026, 10, 1, 0, 0, 0, 0).toISOString(),
    )
    expect(month.endDate).toBe(
      new Date(2026, 10, 30, 23, 59, 59, 999).toISOString(),
    )

    const mtd = getMtdRange(testDate)
    expect(mtd.startDate).toBe(new Date(2026, 10, 1, 0, 0, 0, 0).toISOString())
    expect(mtd.endDate).toBe(testDate.toISOString())

    const custom = getCustomRange('2026-11-05', '2026-11-15')
    expect(custom.startDate).toBe(
      new Date(2026, 10, 5, 0, 0, 0, 0).toISOString(),
    )
    expect(custom.endDate).toBe(
      new Date(2026, 10, 15, 23, 59, 59, 999).toISOString(),
    )
  })
})
