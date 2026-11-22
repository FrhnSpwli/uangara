import { useCallback, useEffect, useState, type PropsWithChildren } from 'react'

import { BalancePrivacyContext } from './balance-privacy-context'

const STORAGE_KEY = 'uangara:hide_balance'

function getInitialState(): boolean {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage.getItem(STORAGE_KEY) === 'true'
    }
  } catch {
    // LocalStorage might be restricted
  }
  return false
}

export function BalancePrivacyProvider({ children }: PropsWithChildren) {
  const [isHidden, setIsHidden] = useState<boolean>(getInitialState)

  useEffect(() => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(STORAGE_KEY, String(isHidden))
      }
    } catch {
      // LocalStorage might be restricted
    }
  }, [isHidden])

  const toggleHidden = useCallback(() => {
    setIsHidden((prev) => !prev)
  }, [])

  const setHidden = useCallback((hidden: boolean) => {
    setIsHidden(hidden)
  }, [])

  return (
    <BalancePrivacyContext.Provider
      value={{
        isHidden,
        setHidden,
        toggleHidden,
      }}
    >
      {children}
    </BalancePrivacyContext.Provider>
  )
}
