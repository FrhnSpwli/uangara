import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import { App } from './app/App'
import { registerServiceWorker } from './app/pwa/register-service-worker'
import { ConfigurationErrorPage } from './features/auth/components/ConfigurationErrorPage'
import { getDefaultAuthService } from './features/auth/services/auth-service'
import { getDefaultTransactionService } from './features/transactions/services/transaction-service'
import { getDefaultWalletService } from './features/wallets/services/wallet-service'
import './styles.css'

const rootElement = document.getElementById('root')

if (!rootElement) {
  throw new Error(
    'Uangara could not start because the root element is missing.',
  )
}

registerServiceWorker()

const root = createRoot(rootElement)

try {
  const authService = getDefaultAuthService()
  const transactionService = getDefaultTransactionService()
  const walletService = getDefaultWalletService()

  root.render(
    <StrictMode>
      <App
        authService={authService}
        transactionService={transactionService}
        walletService={walletService}
      />
    </StrictMode>,
  )
} catch {
  root.render(
    <StrictMode>
      <ConfigurationErrorPage />
    </StrictMode>,
  )
}
