import { parsePositiveMoneyInput } from '../../../utils/money'
import {
  transactionKinds,
  type IncomeExpenseTransactionInput,
  type TransactionKind,
} from '../types'

export interface TransactionFormValues {
  amount: string
  description: string
  kind: string
  notes: string
  occurredAt: string
  walletId: string
}

export type TransactionFormErrors = Partial<
  Record<
    'amount' | 'description' | 'kind' | 'notes' | 'occurredAt' | 'walletId',
    string
  >
>

export type TransactionValidationResult =
  | { errors: TransactionFormErrors; valid: false }
  | { input: IncomeExpenseTransactionInput; valid: true }

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
): TransactionValidationResult {
  const errors: TransactionFormErrors = {}
  const amount = parsePositiveMoneyInput(values.amount)
  const description = values.description.trim()
  const notes = values.notes.trim()
  const occurredAt = new Date(values.occurredAt)
  const supportedKind = transactionKinds.includes(
    values.kind as TransactionKind,
  )

  if (!supportedKind) {
    errors.kind = 'Choose income or expense.'
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

  if (Object.keys(errors).length > 0 || !amount.valid || !supportedKind) {
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
    valid: true,
  }
}
