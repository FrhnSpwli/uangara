export const transactionKinds = ['income', 'expense'] as const

export type TransactionKind = (typeof transactionKinds)[number]
export type TransactionListMode = 'active' | 'deleted'

export interface TransactionSummary {
  amount: string
  createdAt: string
  deletedAt: string | null
  description: string
  id: string
  kind: TransactionKind
  notes: string | null
  occurredAt: string
  updatedAt: string
  walletArchivedAt: string | null
  walletId: string
  walletName: string
}

export type TransactionDetail = TransactionSummary

export interface IncomeExpenseTransactionInput {
  amount: number
  description: string
  kind: TransactionKind
  notes: string | null
  occurredAt: string
  walletId: string
}

export interface TransactionWalletOption {
  archivedAt: string | null
  id: string
  name: string
}

export interface TransactionService {
  createTransaction: (input: IncomeExpenseTransactionInput) => Promise<string>
  getTransaction: (transactionId: string) => Promise<TransactionDetail | null>
  listTransactions: (mode: TransactionListMode) => Promise<TransactionSummary[]>
  restoreTransaction: (transactionId: string) => Promise<void>
  softDeleteTransaction: (transactionId: string) => Promise<void>
  updateTransaction: (
    transactionId: string,
    input: IncomeExpenseTransactionInput,
  ) => Promise<void>
}
