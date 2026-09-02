import type { SupabaseClient } from '@supabase/supabase-js'

import { getSupabaseClient } from '../../../lib/supabase/client'
import type { Database } from '../../../types/database'
import {
  transactionKinds,
  type IncomeExpenseTransactionInput,
  type TransactionDetail,
  type TransactionListMode,
  type TransactionService,
  type TransactionSummary,
  type TransactionKind,
} from '../types'
import { SafeTransactionError } from './transaction-errors'

type TransactionRow =
  Database['public']['Views']['income_expense_transactions']['Row']

function isTransactionKind(value: string): value is TransactionKind {
  return transactionKinds.some((kind) => kind === value)
}

function toTransactionSummary(row: TransactionRow): TransactionSummary {
  if (!isTransactionKind(row.kind) || !row.description) {
    throw new SafeTransactionError(
      'This transaction contains an unsupported ledger shape.',
    )
  }

  return {
    amount: row.amount,
    createdAt: row.created_at,
    deletedAt: row.deleted_at,
    description: row.description,
    id: row.transaction_id,
    kind: row.kind,
    notes: row.notes,
    occurredAt: row.occurred_at,
    updatedAt: row.updated_at,
    walletArchivedAt: row.wallet_archived_at,
    walletId: row.wallet_id,
    walletName: row.wallet_name,
  }
}

function assertSafePositiveMoney(value: number) {
  if (!Number.isSafeInteger(value) || value <= 0) {
    throw new SafeTransactionError(
      'The transaction amount must be a positive whole number in the supported range.',
    )
  }
}

function requestError(operation: string) {
  return new SafeTransactionError(
    `Uangara could not ${operation}. Check your connection and try again.`,
  )
}

function rpcInput(input: IncomeExpenseTransactionInput) {
  assertSafePositiveMoney(input.amount)

  return {
    p_amount: input.amount,
    p_description: input.description,
    p_kind: input.kind,
    p_notes: input.notes,
    p_occurred_at: input.occurredAt,
    p_wallet_id: input.walletId,
  }
}

export function createSupabaseTransactionService(
  client: SupabaseClient<Database>,
): TransactionService {
  return {
    async listTransactions(mode: TransactionListMode) {
      let query = client
        .from('income_expense_transactions')
        .select(
          'transaction_id,user_id,kind,wallet_id,wallet_name,wallet_archived_at,description,notes,amount,occurred_at,deleted_at,created_at,updated_at',
        )
        .order('occurred_at', { ascending: false })
        .order('created_at', { ascending: false })
        .order('transaction_id', { ascending: false })
        .limit(25)

      query =
        mode === 'active'
          ? query.is('deleted_at', null)
          : query.not('deleted_at', 'is', null)

      const { data, error } = await query

      if (error) {
        throw requestError('load your transactions')
      }

      return data.map(toTransactionSummary)
    },

    async getTransaction(transactionId: string) {
      const { data, error } = await client
        .from('income_expense_transactions')
        .select(
          'transaction_id,user_id,kind,wallet_id,wallet_name,wallet_archived_at,description,notes,amount,occurred_at,deleted_at,created_at,updated_at',
        )
        .eq('transaction_id', transactionId)
        .maybeSingle()

      if (error) {
        throw requestError('load this transaction')
      }

      return data
        ? (toTransactionSummary(data) satisfies TransactionDetail)
        : null
    },

    async createTransaction(input: IncomeExpenseTransactionInput) {
      const { data, error } = await client.rpc(
        'create_income_expense_transaction',
        rpcInput(input),
      )

      if (error || !data) {
        throw requestError('create the transaction')
      }

      return data
    },

    async updateTransaction(
      transactionId: string,
      input: IncomeExpenseTransactionInput,
    ) {
      const { error } = await client.rpc('update_income_expense_transaction', {
        ...rpcInput(input),
        p_transaction_id: transactionId,
      })

      if (error) {
        throw requestError('update the transaction')
      }
    },

    async softDeleteTransaction(transactionId: string) {
      const { error } = await client.rpc(
        'soft_delete_income_expense_transaction',
        { p_transaction_id: transactionId },
      )

      if (error) {
        throw requestError('delete the transaction')
      }
    },

    async restoreTransaction(transactionId: string) {
      const { error } = await client.rpc('restore_income_expense_transaction', {
        p_transaction_id: transactionId,
      })

      if (error) {
        throw requestError('restore the transaction')
      }
    },
  }
}

let defaultTransactionService: TransactionService | undefined

export function getDefaultTransactionService() {
  defaultTransactionService ??=
    createSupabaseTransactionService(getSupabaseClient())
  return defaultTransactionService
}
