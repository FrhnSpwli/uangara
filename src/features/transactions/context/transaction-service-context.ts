import { createContext } from 'react'

import type { TransactionService } from '../types'

export const TransactionServiceContext =
  createContext<TransactionService | null>(null)
