import { BrowserRouter, Route, Routes } from 'react-router'

import { AuthenticatedAppShell } from '../../components/layout/AuthenticatedAppShell'
import { AppShell } from '../../components/layout/AppShell'
import { AuthLayout } from '../../features/auth/components/AuthLayout'
import {
  GuestOnlyRoute,
  ProtectedRoute,
} from '../../features/auth/components/AuthRoutes'
import { AuthenticatedHomePage } from '../../features/auth/pages/AuthenticatedHomePage'
import { SignInPage } from '../../features/auth/pages/SignInPage'
import { SignUpPage } from '../../features/auth/pages/SignUpPage'
import { FoundationPage } from '../../features/foundation/FoundationPage'
import { NotFoundPage } from '../../features/not-found/NotFoundPage'
import { CreateTransactionPage } from '../../features/transactions/pages/CreateTransactionPage'
import { TransactionDetailPage } from '../../features/transactions/pages/TransactionDetailPage'
import { TransactionListPage } from '../../features/transactions/pages/TransactionListPage'
import { CreateTransferPage } from '../../features/transfers/pages/CreateTransferPage'
import { TransferDetailPage } from '../../features/transfers/pages/TransferDetailPage'
import { CreateWalletPage } from '../../features/wallets/pages/CreateWalletPage'
import { WalletDetailPage } from '../../features/wallets/pages/WalletDetailPage'
import { WalletListPage } from '../../features/wallets/pages/WalletListPage'

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<FoundationPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>

      <Route element={<GuestOnlyRoute />}>
        <Route element={<AuthLayout />} path="auth">
          <Route element={<SignInPage />} path="sign-in" />
          <Route element={<SignUpPage />} path="sign-up" />
        </Route>
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route element={<AuthenticatedAppShell />} path="app">
          <Route index element={<AuthenticatedHomePage />} />
          <Route element={<TransactionListPage />} path="transactions" />
          <Route element={<CreateTransactionPage />} path="transactions/new" />
          <Route
            element={<TransactionDetailPage />}
            path="transactions/:transactionId"
          />
          <Route element={<CreateTransferPage />} path="transfers/new" />
          <Route
            element={<TransferDetailPage />}
            path="transfers/:transferId"
          />
          <Route element={<WalletListPage />} path="wallets" />
          <Route element={<CreateWalletPage />} path="wallets/new" />
          <Route element={<WalletDetailPage />} path="wallets/:walletId" />
        </Route>
      </Route>
    </Routes>
  )
}

export function AppRouter() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  )
}
