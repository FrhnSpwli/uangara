import { useContext } from 'react'

import { WalletServiceContext } from './wallet-service-context'

export function useWalletService() {
  const service = useContext(WalletServiceContext)

  if (!service) {
    throw new Error(
      'useWalletService must be used within WalletServiceProvider.',
    )
  }

  return service
}
