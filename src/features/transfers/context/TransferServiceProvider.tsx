import type { PropsWithChildren } from 'react'

import type { TransferService } from '../types'
import { TransferServiceContext } from './transfer-service-context'

interface TransferServiceProviderProps extends PropsWithChildren {
  service: TransferService
}

export function TransferServiceProvider({
  children,
  service,
}: TransferServiceProviderProps) {
  return (
    <TransferServiceContext.Provider value={service}>
      {children}
    </TransferServiceContext.Provider>
  )
}
