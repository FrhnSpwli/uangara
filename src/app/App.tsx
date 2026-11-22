import { AuthProvider } from '../features/auth/context/AuthProvider'
import type { AuthService } from '../features/auth/services/auth-service'
import { CategoryServiceProvider } from '../features/categories/context/CategoryServiceProvider'
import { createSupabaseCategoryService } from '../features/categories/services/category-service'
import type { CategoryService } from '../features/categories/types'
import { BalancePrivacyProvider } from '../features/preferences/context/BalancePrivacyProvider'
import { TransactionServiceProvider } from '../features/transactions/context/TransactionServiceProvider'
import type { TransactionService } from '../features/transactions/types'
import { TransferServiceProvider } from '../features/transfers/context/TransferServiceProvider'
import type { TransferService } from '../features/transfers/types'
import { WalletServiceProvider } from '../features/wallets/context/WalletServiceProvider'
import type { WalletService } from '../features/wallets/types'
import { AppRouter } from './router/AppRouter'

interface AppProps {
  authService: AuthService
  categoryService?: CategoryService
  transactionService: TransactionService
  transferService: TransferService
  walletService: WalletService
}

export function App({
  authService,
  categoryService = createSupabaseCategoryService(),
  transactionService,
  transferService,
  walletService,
}: AppProps) {
  return (
    <AuthProvider service={authService}>
      <WalletServiceProvider service={walletService}>
        <TransactionServiceProvider service={transactionService}>
          <TransferServiceProvider service={transferService}>
            <CategoryServiceProvider service={categoryService}>
              <BalancePrivacyProvider>
                <AppRouter />
              </BalancePrivacyProvider>
            </CategoryServiceProvider>
          </TransferServiceProvider>
        </TransactionServiceProvider>
      </WalletServiceProvider>
    </AuthProvider>
  )
}
