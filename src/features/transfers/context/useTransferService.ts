import { useContext } from 'react'

import { TransferServiceContext } from './transfer-service-context'

export function useTransferService() {
  const service = useContext(TransferServiceContext)

  if (!service) {
    throw new Error(
      'useTransferService must be used within TransferServiceProvider.',
    )
  }

  return service
}
