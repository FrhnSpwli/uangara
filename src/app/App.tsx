import { AuthProvider } from '../features/auth/context/AuthProvider'
import type { AuthService } from '../features/auth/services/auth-service'
import { TransactionServiceProvider } from '../features/transactions/context/TransactionServiceProvider'
import type { TransactionService } from '../features/transactions/types'
import { WalletServiceProvider } from '../features/wallets/context/WalletServiceProvider'
import type { WalletService } from '../features/wallets/types'
import { AppRouter } from './router/AppRouter'

interface AppProps {
  authService: AuthService
  transactionService: TransactionService
  walletService: WalletService
}

export function App({
  authService,
  transactionService,
  walletService,
}: AppProps) {
  return (
    <AuthProvider service={authService}>
      <WalletServiceProvider service={walletService}>
        <TransactionServiceProvider service={transactionService}>
          <AppRouter />
        </TransactionServiceProvider>
      </WalletServiceProvider>
    </AuthProvider>
  )
}
