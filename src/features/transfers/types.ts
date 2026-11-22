import type { WalletType } from '../wallets/types'

export interface TransferInput {
  amount: number
  description: string
  destinationWalletId: string
  fee: number
  notes: string | null
  occurredAt: string
  sourceWalletId: string
}

export interface TransferDetail {
  amount: string
  createdAt: string
  deletedAt: string | null
  description: string
  destinationWalletArchivedAt: string | null
  destinationWalletId: string
  destinationWalletName: string
  feeAmount: string
  id: string
  notes: string | null
  occurredAt: string
  sourceWalletArchivedAt: string | null
  sourceWalletId: string
  sourceWalletName: string
  updatedAt: string
}

export interface TransferWalletOption {
  archivedAt: string | null
  balance?: string
  id: string
  institution?: string | null
  name: string
  type?: WalletType
}

export interface TransferService {
  createTransfer: (
    input: TransferInput,
    idempotencyKey: string,
  ) => Promise<string>
  getTransfer: (transferId: string) => Promise<TransferDetail | null>
  restoreTransfer: (transferId: string) => Promise<void>
  softDeleteTransfer: (transferId: string) => Promise<void>
  updateTransfer: (transferId: string, input: TransferInput) => Promise<void>
}
