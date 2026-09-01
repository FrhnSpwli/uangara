import { AuthProvider } from '../features/auth/context/AuthProvider'
import type { AuthService } from '../features/auth/services/auth-service'
import { WalletServiceProvider } from '../features/wallets/context/WalletServiceProvider'
import type { WalletService } from '../features/wallets/types'
import { AppRouter } from './router/AppRouter'

interface AppProps {
  authService: AuthService
  walletService: WalletService
}

export function App({ authService, walletService }: AppProps) {
  return (
    <AuthProvider service={authService}>
      <WalletServiceProvider service={walletService}>
        <AppRouter />
      </WalletServiceProvider>
    </AuthProvider>
  )
}
