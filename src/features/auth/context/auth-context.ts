import type { Session } from '@supabase/supabase-js'
import { createContext } from 'react'

import type {
  AuthCredentials,
  SignUpCredentials,
  SignUpResult,
} from '../services/auth-service'

export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated'

export interface AuthState {
  error: string | null
  session: Session | null
  status: AuthStatus
}

export interface AuthContextValue extends AuthState {
  retrySessionRestore: () => void
  signIn: (credentials: AuthCredentials) => Promise<void>
  signOut: () => Promise<void>
  signUp: (credentials: SignUpCredentials) => Promise<SignUpResult>
}

export const AuthContext = createContext<AuthContextValue | null>(null)
