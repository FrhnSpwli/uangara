import { createContext } from 'react'

import type { TransferService } from '../types'

export const TransferServiceContext = createContext<TransferService | null>(
  null,
)
