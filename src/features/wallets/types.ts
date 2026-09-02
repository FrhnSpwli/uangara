export const walletTypes = [
  'bank',
  'e_wallet',
  'e_money',
  'cash',
  'other',
] as const

export type WalletType = (typeof walletTypes)[number]
export type WalletListMode = 'active' | 'archived'

export interface WalletSummary {
  archivedAt: string | null
  balance: string
  createdAt: string
  id: string
  institution: string | null
  name: string
  type: WalletType
  updatedAt: string
}

export interface WalletDetail extends WalletSummary {
  openingBalance: string
  openingOccurredAt: string
}

export interface WalletMetadataInput {
  institution: string | null
  name: string
  type: WalletType
}

export interface CreateWalletInput extends WalletMetadataInput {
  openingBalance: number
}

export interface WalletService {
  archiveWallet: (walletId: string) => Promise<void>
  createWallet: (input: CreateWalletInput) => Promise<string>
  getWallet: (walletId: string) => Promise<WalletDetail | null>
  listWallets: (mode: WalletListMode) => Promise<WalletSummary[]>
  restoreWallet: (walletId: string) => Promise<void>
  updateMetadata: (
    walletId: string,
    input: WalletMetadataInput,
  ) => Promise<void>
  updateOpeningBalance: (
    walletId: string,
    openingBalance: number,
  ) => Promise<void>
}
