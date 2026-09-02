import { vi } from 'vitest'

import type {
  TransactionDetail,
  TransactionService,
  TransactionSummary,
} from '../features/transactions/types'

export function createTransactionSummary(
  overrides: Partial<TransactionSummary> = {},
): TransactionSummary {
  return {
    amount: '35000',
    createdAt: '2026-09-02T00:00:00.000Z',
    deletedAt: null,
    description: 'Lunch',
    id: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
    kind: 'expense',
    notes: null,
    occurredAt: '2026-09-01T12:00:00.000Z',
    updatedAt: '2026-09-02T00:00:00.000Z',
    walletArchivedAt: null,
    walletId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    walletName: 'Everyday wallet',
    ...overrides,
  }
}

export function createTransactionDetail(
  overrides: Partial<TransactionDetail> = {},
): TransactionDetail {
  return createTransactionSummary(overrides)
}

export function createTransactionServiceStub() {
  const detail = createTransactionDetail()

  return {
    createTransaction: vi.fn(() => Promise.resolve(detail.id)),
    getTransaction: vi.fn(() =>
      Promise.resolve<TransactionDetail | null>(detail),
    ),
    listTransactions: vi.fn<TransactionService['listTransactions']>(() =>
      Promise.resolve<TransactionSummary[]>([]),
    ),
    restoreTransaction: vi.fn(() => Promise.resolve()),
    softDeleteTransaction: vi.fn(() => Promise.resolve()),
    updateTransaction: vi.fn(() => Promise.resolve()),
  } satisfies TransactionService
}
