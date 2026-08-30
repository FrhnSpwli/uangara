import { AuthProvider } from '../features/auth/context/AuthProvider'
import type { AuthService } from '../features/auth/services/auth-service'
import { AppRouter } from './router/AppRouter'

interface AppProps {
  authService: AuthService
}

export function App({ authService }: AppProps) {
  return (
    <AuthProvider service={authService}>
      <AppRouter />
    </AuthProvider>
  )
}
