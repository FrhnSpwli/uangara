import { vi } from 'vitest'

import type {
  WalletDetail,
  WalletService,
  WalletSummary,
} from '../features/wallets/types'

export function createWalletSummary(
  overrides: Partial<WalletSummary> = {},
): WalletSummary {
  return {
    archivedAt: null,
    balance: '2000000',
    createdAt: '2026-09-01T00:00:00.000Z',
    id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    institution: 'Test bank',
    name: 'Everyday wallet',
    type: 'bank',
    updatedAt: '2026-09-01T00:00:00.000Z',
    ...overrides,
  }
}

export function createWalletDetail(
  overrides: Partial<WalletDetail> = {},
): WalletDetail {
  return {
    ...createWalletSummary(),
    openingBalance: '2000000',
    openingOccurredAt: '2026-09-01T00:00:00.000Z',
    ...overrides,
  }
}

export function createWalletServiceStub() {
  const detail = createWalletDetail()

  return {
    archiveWallet: vi.fn(() => Promise.resolve()),
    createWallet: vi.fn(() => Promise.resolve(detail.id)),
    getWallet: vi.fn(() => Promise.resolve<WalletDetail | null>(detail)),
    listWallets: vi.fn<WalletService['listWallets']>(() =>
      Promise.resolve<WalletSummary[]>([]),
    ),
    restoreWallet: vi.fn(() => Promise.resolve()),
    updateMetadata: vi.fn(() => Promise.resolve()),
    updateOpeningBalance: vi.fn(() => Promise.resolve()),
  } satisfies WalletService
}
