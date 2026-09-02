import type { PropsWithChildren } from 'react'

import type { TransactionService } from '../types'
import { TransactionServiceContext } from './transaction-service-context'

interface TransactionServiceProviderProps extends PropsWithChildren {
  service: TransactionService
}

export function TransactionServiceProvider({
  children,
  service,
}: TransactionServiceProviderProps) {
  return (
    <TransactionServiceContext.Provider value={service}>
      {children}
    </TransactionServiceContext.Provider>
  )
}
