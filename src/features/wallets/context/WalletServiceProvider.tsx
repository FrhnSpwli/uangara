import type { PropsWithChildren } from 'react'

import type { WalletService } from '../types'
import { WalletServiceContext } from './wallet-service-context'

interface WalletServiceProviderProps extends PropsWithChildren {
  service: WalletService
}

export function WalletServiceProvider({
  children,
  service,
}: WalletServiceProviderProps) {
  return (
    <WalletServiceContext.Provider value={service}>
      {children}
    </WalletServiceContext.Provider>
  )
}
