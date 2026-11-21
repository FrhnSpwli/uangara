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

export interface TransferSummary {
  amount: string
  createdAt: string
  deletedAt: string | null
  description: string
  destinationWalletArchivedAt: string | null
  destinationWalletId: string
  destinationWalletName: string
  feeAmount: string
  id: string
  kind: 'transfer'
  notes: string | null
  occurredAt: string
  sourceWalletArchivedAt: string | null
  sourceWalletId: string
  sourceWalletName: string
  updatedAt: string
  walletName: string
}

export type FinancialTransactionSummary = TransactionSummary | TransferSummary

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
  listTransactions: (
    mode: TransactionListMode,
  ) => Promise<FinancialTransactionSummary[]>
  restoreTransaction: (transactionId: string) => Promise<void>
  softDeleteTransaction: (transactionId: string) => Promise<void>
  updateTransaction: (
    transactionId: string,
    input: IncomeExpenseTransactionInput,
  ) => Promise<void>
}
