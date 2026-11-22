import { useContext } from 'react'

import {
  BalancePrivacyContext,
  type BalancePrivacyContextValue,
} from './balance-privacy-context'

export function useBalancePrivacy(): BalancePrivacyContextValue {
  const context = useContext(BalancePrivacyContext)

  if (!context) {
    return {
      isHidden: false,
      setHidden: () => {},
      toggleHidden: () => {},
    }
  }

  return context
}
