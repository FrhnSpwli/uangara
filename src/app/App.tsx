import { AuthProvider } from '../features/auth/context/AuthProvider'
import type { AuthService } from '../features/auth/services/auth-service'
import { TransactionServiceProvider } from '../features/transactions/context/TransactionServiceProvider'
import type { TransactionService } from '../features/transactions/types'
import { TransferServiceProvider } from '../features/transfers/context/TransferServiceProvider'
import type { TransferService } from '../features/transfers/types'
import { WalletServiceProvider } from '../features/wallets/context/WalletServiceProvider'
import type { WalletService } from '../features/wallets/types'
import { AppRouter } from './router/AppRouter'

interface AppProps {
  authService: AuthService
  transactionService: TransactionService
  transferService: TransferService
  walletService: WalletService
}

export function App({
  authService,
  transactionService,
  transferService,
  walletService,
}: AppProps) {
  return (
    <AuthProvider service={authService}>
      <WalletServiceProvider service={walletService}>
        <TransactionServiceProvider service={transactionService}>
          <TransferServiceProvider service={transferService}>
            <AppRouter />
          </TransferServiceProvider>
        </TransactionServiceProvider>
      </WalletServiceProvider>
    </AuthProvider>
  )
}
