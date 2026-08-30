import type { AuthError, Session, SupabaseClient } from '@supabase/supabase-js'

import { getSupabaseClient } from '../../../lib/supabase/client'
import type { Database } from '../../../types/database'
import { SafeAuthError } from './auth-errors'

export interface AuthCredentials {
  email: string
  password: string
}

export interface SignUpCredentials extends AuthCredentials {
  emailRedirectTo: string
}

export interface SignUpResult {
  confirmationRequired: boolean
  session: Session | null
}

export type AuthSessionListener = (session: Session | null) => void

export interface AuthService {
  getSession: () => Promise<Session | null>
  subscribe: (listener: AuthSessionListener) => () => void
  signIn: (credentials: AuthCredentials) => Promise<Session>
  signUp: (credentials: SignUpCredentials) => Promise<SignUpResult>
  signOut: () => Promise<void>
}

function getSafeAuthMessage(
  operation: 'restore' | 'signIn' | 'signUp' | 'signOut',
  error: AuthError,
) {
  if (error.code === 'email_not_confirmed') {
    return 'Confirm your email address before signing in.'
  }

  if (error.code === 'invalid_credentials') {
    return 'The email or password is incorrect.'
  }

  if (error.code === 'weak_password') {
    return 'Choose a stronger password and try again.'
  }

  if (error.code === 'over_email_send_rate_limit') {
    return 'Too many email requests were made. Wait a moment and try again.'
  }

  const fallbackMessages = {
    restore:
      'Your session could not be restored. Check your connection and try again.',
    signIn: 'Uangara could not sign you in. Check your details and try again.',
    signUp:
      'Uangara could not create the account. Check your details and try again.',
    signOut: 'Uangara could not sign you out. Please try again.',
  }

  return fallbackMessages[operation]
}

function toSafeAuthError(
  operation: 'restore' | 'signIn' | 'signUp' | 'signOut',
  error: AuthError,
) {
  return new SafeAuthError(getSafeAuthMessage(operation, error))
}

export function createSupabaseAuthService(
  client: SupabaseClient<Database>,
): AuthService {
  return {
    async getSession() {
      const { data, error } = await client.auth.getSession()

      if (error) {
        throw toSafeAuthError('restore', error)
      }

      return data.session
    },

    subscribe(listener) {
      const { data } = client.auth.onAuthStateChange((_event, session) => {
        listener(session)
      })

      return () => {
        data.subscription.unsubscribe()
      }
    },

    async signIn({ email, password }) {
      const { data, error } = await client.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        throw toSafeAuthError('signIn', error)
      }

      return data.session
    },

    async signUp({ email, emailRedirectTo, password }) {
      const { data, error } = await client.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo,
        },
      })

      if (error) {
        throw toSafeAuthError('signUp', error)
      }

      return {
        confirmationRequired: data.session === null,
        session: data.session,
      }
    },

    async signOut() {
      const { error } = await client.auth.signOut({ scope: 'local' })

      if (error) {
        throw toSafeAuthError('signOut', error)
      }
    },
  }
}

let defaultAuthService: AuthService | undefined

export function getDefaultAuthService() {
  defaultAuthService ??= createSupabaseAuthService(getSupabaseClient())
  return defaultAuthService
}
