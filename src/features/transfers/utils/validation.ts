import { parseMoneyInput, parsePositiveMoneyInput } from '../../../utils/money'
import type { TransferInput } from '../types'

export interface TransferFormValues {
  amount: string
  description: string
  destinationWalletId: string
  fee: string
  notes: string
  occurredAt: string
  sourceWalletId: string
}

export type TransferFormErrors = Partial<
  Record<
    | 'amount'
    | 'description'
    | 'destinationWalletId'
    | 'fee'
    | 'notes'
    | 'occurredAt'
    | 'sourceWalletId',
    string
  >
>

export type TransferValidationResult =
  | { errors: TransferFormErrors; valid: false }
  | { input: TransferInput; valid: true }

export function validateTransferForm(
  values: TransferFormValues,
  now = new Date(),
): TransferValidationResult {
  const errors: TransferFormErrors = {}
  const amount = parsePositiveMoneyInput(values.amount)
  const fee = parseMoneyInput(values.fee || '0')
  const description = values.description.trim()
  const notes = values.notes.trim()
  const occurredAt = new Date(values.occurredAt)

  if (!values.sourceWalletId) {
    errors.sourceWalletId = 'Choose an active source wallet.'
  }

  if (!values.destinationWalletId) {
    errors.destinationWalletId = 'Choose an active destination wallet.'
  } else if (values.destinationWalletId === values.sourceWalletId) {
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
      destinationWalletId: values.destinationWalletId,
      fee: fee.databaseValue,
      notes: notes || null,
      occurredAt: occurredAt.toISOString(),
      sourceWalletId: values.sourceWalletId,
    },
    valid: true,
  }
}
