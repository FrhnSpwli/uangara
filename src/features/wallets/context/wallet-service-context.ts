import { createContext } from 'react'

import type { WalletService } from '../types'

export const WalletServiceContext = createContext<WalletService | null>(null)
