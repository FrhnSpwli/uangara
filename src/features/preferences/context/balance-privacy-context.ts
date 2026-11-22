import { createContext } from 'react'

export interface BalancePrivacyContextValue {
  isHidden: boolean
  setHidden: (hidden: boolean) => void
  toggleHidden: () => void
}

export const BalancePrivacyContext =
  createContext<BalancePrivacyContextValue | null>(null)
