import type { WalletType } from '../types'

export const WALLET_TYPE_PRIORITY: Record<WalletType, number> = {
  bank: 0,
  e_wallet: 1,
  e_money: 2,
  cash: 3,
  other: 4,
}

export function compareWalletsByType<
  T extends {
    createdAt?: string | null
    name?: string
    type?: string | null
  },
>(a: T, b: T): number {
  const rankA =
    a.type && a.type in WALLET_TYPE_PRIORITY
      ? WALLET_TYPE_PRIORITY[a.type as WalletType]
      : 99
  const rankB =
    b.type && b.type in WALLET_TYPE_PRIORITY
      ? WALLET_TYPE_PRIORITY[b.type as WalletType]
      : 99

  if (rankA !== rankB) {
    return rankA - rankB
  }

  // Secondary: newest created_at first if available
  if (a.createdAt && b.createdAt) {
    const timeDiff =
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    if (timeDiff !== 0) {
      return timeDiff
    }
  }

  // Tertiary: alphabetical by name
  if (a.name && b.name) {
    return a.name.localeCompare(b.name)
  }

  return 0
}

export function sortWalletsByType<
  T extends {
    createdAt?: string | null
    name?: string
    type?: string | null
  },
>(wallets: readonly T[]): T[] {
  return [...wallets].sort(compareWalletsByType)
}
