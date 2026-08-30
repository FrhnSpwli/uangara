import { BrowserRouter, Route, Routes } from 'react-router'

import { AppShell } from '../../components/layout/AppShell'
import { FoundationPage } from '../../features/foundation/FoundationPage'
import { NotFoundPage } from '../../features/not-found/NotFoundPage'

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<FoundationPage />} />
        <Route path="*" element={<NotFoundPage />} />
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
