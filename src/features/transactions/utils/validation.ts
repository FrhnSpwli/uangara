import { parseMoneyInput, parsePositiveMoneyInput } from '../../../utils/money'
import type { TransferInput } from '../../transfers/types'
import {
  transactionKinds,
  type IncomeExpenseTransactionInput,
  type TransactionKind,
} from '../types'

export interface TransactionFormValues {
  amount: string
  description: string
  destinationWalletId?: string
  fee?: string
  kind: string
  notes: string
  occurredAt: string
  sourceWalletId?: string
  walletId: string
}

export type TransactionFormErrors = Partial<
  Record<
    | 'amount'
    | 'description'
    | 'destinationWalletId'
    | 'fee'
    | 'kind'
    | 'notes'
    | 'occurredAt'
    | 'sourceWalletId'
    | 'walletId',
    string
  >
>

export type TransactionValidationResult =
  | { errors: TransactionFormErrors; valid: false }
  | {
      input: IncomeExpenseTransactionInput
      kind: 'income' | 'expense'
      valid: true
    }
  | {
      input: TransferInput
      kind: 'transfer'
      valid: true
    }

export function toLocalDateTimeValue(value: Date | string) {
  const date = typeof value === 'string' ? new Date(value) : value

  if (Number.isNaN(date.getTime())) {
    return ''
  }

  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000)
  return local.toISOString().slice(0, 16)
}

export function validateTransactionForm(
  values: TransactionFormValues,
  now = new Date(),
  options?: { allowTransfer?: boolean },
): TransactionValidationResult {
  const errors: TransactionFormErrors = {}
  const amount = parsePositiveMoneyInput(values.amount)
  const description = values.description.trim()
  const notes = values.notes.trim()
  const occurredAt = new Date(values.occurredAt)
  const allowTransfer = options?.allowTransfer ?? true

  if (values.kind === 'transfer') {
    if (!allowTransfer) {
      errors.kind = 'Choose income or expense.'
    } else {
      const sourceWalletId = values.sourceWalletId || values.walletId
      const destinationWalletId = values.destinationWalletId || ''
      const fee = parseMoneyInput(values.fee || '0')

      if (!sourceWalletId) {
        errors.sourceWalletId = 'Choose an active source wallet.'
      }

      if (!destinationWalletId) {
        errors.destinationWalletId = 'Choose an active destination wallet.'
      } else if (destinationWalletId === sourceWalletId) {
        errors.destinationWalletId = 'Source and destination must be different.'
      }

      if (!amount.valid) {
        errors.amount = amount.message
      }

      if (!fee.valid) {
        errors.fee = fee.message
      } else if (fee.databaseValue < 0) {
        errors.fee = 'Transfer fee cannot be negative.'
      }

      if (description.length < 1 || description.length > 120) {
        errors.description =
          'Description must contain between 1 and 120 characters.'
      }

      if (notes.length > 1000) {
        errors.notes = 'Notes must contain at most 1000 characters.'
      }

      if (!values.occurredAt || Number.isNaN(occurredAt.getTime())) {
        errors.occurredAt = 'Enter a valid transfer date and time.'
      } else if (occurredAt.getTime() > now.getTime()) {
        errors.occurredAt = 'Transfer time cannot be in the future.'
      }

      if (Object.keys(errors).length > 0 || !amount.valid || !fee.valid) {
        return { errors, valid: false }
      }

      return {
        input: {
          amount: amount.databaseValue,
          description,
          destinationWalletId,
          fee: fee.databaseValue,
          notes: notes || null,
          occurredAt: occurredAt.toISOString(),
          sourceWalletId,
        },
        kind: 'transfer',
        valid: true,
      }
    }
  }

  const isIncomeOrExpense = transactionKinds.includes(
    values.kind as TransactionKind,
  )

  if (!isIncomeOrExpense) {
    errors.kind = allowTransfer
      ? 'Choose income, expense, or transfer.'
      : 'Choose income or expense.'
  }

  if (!values.walletId) {
    errors.walletId = 'Choose an active wallet.'
  }

  if (!amount.valid) {
    errors.amount = amount.message
  }

  if (description.length < 1 || description.length > 120) {
    errors.description =
      'Description must contain between 1 and 120 characters.'
  }

  if (notes.length > 1000) {
    errors.notes = 'Notes must contain at most 1000 characters.'
  }

  if (!values.occurredAt || Number.isNaN(occurredAt.getTime())) {
    errors.occurredAt = 'Enter a valid transaction date and time.'
  } else if (occurredAt.getTime() > now.getTime()) {
    errors.occurredAt = 'Transaction time cannot be in the future.'
  }

  if (Object.keys(errors).length > 0 || !amount.valid || !isIncomeOrExpense) {
    return { errors, valid: false }
  }

  return {
    input: {
      amount: amount.databaseValue,
      description,
      kind: values.kind as TransactionKind,
      notes: notes || null,
      occurredAt: occurredAt.toISOString(),
      walletId: values.walletId,
    },
    kind: values.kind as TransactionKind,
    valid: true,
  }
}
