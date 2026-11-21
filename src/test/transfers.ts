import { vi } from 'vitest'

import type {
  TransferDetail,
  TransferService,
} from '../features/transfers/types'

export function createTransferDetail(
  overrides: Partial<TransferDetail> = {},
): TransferDetail {
  return {
    amount: '500000',
    createdAt: '2026-09-04T00:00:00.000Z',
    deletedAt: null,
    description: 'Top up GoPay',
    destinationWalletArchivedAt: null,
    destinationWalletId: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    destinationWalletName: 'GoPay',
    feeAmount: '1000',
    id: 'dddddddd-dddd-dddd-dddd-dddddddddddd',
    notes: null,
    occurredAt: '2026-09-03T12:00:00.000Z',
    sourceWalletArchivedAt: null,
    sourceWalletId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    sourceWalletName: 'Mandiri',
    updatedAt: '2026-09-04T00:00:00.000Z',
    ...overrides,
  }
}

export function createTransferServiceStub() {
  const detail = createTransferDetail()

  return {
    createTransfer: vi.fn<TransferService['createTransfer']>(() =>
      Promise.resolve(detail.id),
    ),
    getTransfer: vi.fn<TransferService['getTransfer']>(() =>
      Promise.resolve<TransferDetail | null>(detail),
    ),
    restoreTransfer: vi.fn<TransferService['restoreTransfer']>(() =>
      Promise.resolve(),
    ),
    softDeleteTransfer: vi.fn<TransferService['softDeleteTransfer']>(() =>
      Promise.resolve(),
    ),
    updateTransfer: vi.fn<TransferService['updateTransfer']>(() =>
      Promise.resolve(),
    ),
  } satisfies TransferService
}
