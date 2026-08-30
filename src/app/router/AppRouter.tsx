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
