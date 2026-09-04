import { useContext } from 'react'

import { TransactionServiceContext } from './transaction-service-context'

export function useTransactionService() {
  const service = useContext(TransactionServiceContext)

  if (!service) {
    throw new Error(
      'useTransactionService must be used within TransactionServiceProvider.',
    )
  }

  return service
}
