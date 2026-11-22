import type { FinancialTransactionSummary } from '../types'

export type RecapPeriod = 'today' | 'weekly' | 'monthly' | 'custom'

export interface DateRange {
  endDate: string
  startDate: string
}

export interface FinancialRecapSummary {
  expenseCount: number
  expenseTotal: string
  incomeCount: number
  incomeTotal: string
  netDifference: string
  transactionCount: number
  transferCount: number
}

function pad(value: number): string {
  return value.toString().padStart(2, '0')
}

export function formatDateToInput(date: Date = new Date()): string {
  const year = date.getFullYear()
  const month = pad(date.getMonth() + 1)
  const day = pad(date.getDate())
  return `${year}-${month}-${day}`
}

export function getTodayRange(now: Date = new Date()): DateRange {
  const start = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    0,
    0,
    0,
    0,
  )
  const end = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    23,
    59,
    59,
    999,
  )
  return {
    endDate: end.toISOString(),
    startDate: start.toISOString(),
  }
}

export function getWeekRange(now: Date = new Date()): DateRange {
  const day = now.getDay()
  // In Indonesia and ISO standard, Monday is day 1, Sunday is day 7.
  const diffToMonday = day === 0 ? -6 : 1 - day
  const start = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() + diffToMonday,
    0,
    0,
    0,
    0,
  )
  const end = new Date(
    start.getFullYear(),
    start.getMonth(),
    start.getDate() + 6,
    23,
    59,
    59,
    999,
  )
  return {
    endDate: end.toISOString(),
    startDate: start.toISOString(),
  }
}

export function getMonthRange(now: Date = new Date()): DateRange {
  const start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0)
  const end = new Date(
    now.getFullYear(),
    now.getMonth() + 1,
    0,
    23,
    59,
    59,
    999,
  )
  return {
    endDate: end.toISOString(),
    startDate: start.toISOString(),
  }
}

export function getMtdRange(now: Date = new Date()): DateRange {
  const start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0)
  return {
    endDate: now.toISOString(),
    startDate: start.toISOString(),
  }
}

export function getCustomRange(
  startDateStr: string,
  endDateStr: string,
): DateRange {
  const [startYear, startMonth, startDay] = startDateStr
    .split('-')
    .map((v) => Number.parseInt(v, 10))
  const [endYear, endMonth, endDay] = endDateStr
    .split('-')
    .map((v) => Number.parseInt(v, 10))

  const start = new Date(
    startYear ?? 1970,
    (startMonth ?? 1) - 1,
    startDay ?? 1,
    0,
    0,
    0,
    0,
  )
  const end = new Date(
    endYear ?? 1970,
    (endMonth ?? 1) - 1,
    endDay ?? 1,
    23,
    59,
    59,
    999,
  )

  return {
    endDate: end.toISOString(),
    startDate: start.toISOString(),
  }
}

export function calculateAccumulatedBalance(
  wallets: readonly { balance: string }[],
): string {
  let total = 0n
  for (const wallet of wallets) {
    try {
      total += BigInt(wallet.balance)
    } catch {
      // Ignore invalid money strings safely
    }
  }
  return total.toString()
}

export function calculateRecap(
  transactions: readonly FinancialTransactionSummary[],
): FinancialRecapSummary {
  let income = 0n
  let expense = 0n
  let incomeCount = 0
  let expenseCount = 0
  let transferCount = 0

  for (const tx of transactions) {
    if (tx.deletedAt) {
      continue
    }

    if (tx.kind === 'income') {
      incomeCount += 1
      try {
        income += BigInt(tx.amount)
      } catch {
        // Safe fallback
      }
    } else if (tx.kind === 'expense') {
      expenseCount += 1
      try {
        expense += BigInt(tx.amount)
      } catch {
        // Safe fallback
      }
    } else if (tx.kind === 'transfer') {
      transferCount += 1
      // Transfer principal does NOT affect total wealth.
      // Transfer fee decreases total wealth and counts as expense behavior.
      try {
        const fee = BigInt(tx.feeAmount)
        if (fee > 0n) {
          expense += fee
        }
      } catch {
        // Safe fallback
      }
    }
  }

  const net = income - expense

  return {
    expenseCount,
    expenseTotal: expense.toString(),
    incomeCount,
    incomeTotal: income.toString(),
    netDifference: net.toString(),
    transactionCount: transactions.length,
    transferCount,
  }
}
