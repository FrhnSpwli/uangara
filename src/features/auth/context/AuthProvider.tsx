import type { Session } from '@supabase/supabase-js'
import {
  type PropsWithChildren,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react'

import { getAuthErrorMessage } from '../services/auth-errors'
import type {
  AuthCredentials,
  AuthService,
  SignUpCredentials,
} from '../services/auth-service'
import {
  AuthContext,
  type AuthContextValue,
  type AuthState,
} from './auth-context'

interface AuthProviderProps extends PropsWithChildren {
  service: AuthService
}

const initialState: AuthState = {
  error: null,
  session: null,
  status: 'loading',
}

function stateFromSession(session: Session | null): AuthState {
  return {
    error: null,
    session,
    status: session ? 'authenticated' : 'unauthenticated',
  }
}

export function AuthProvider({ children, service }: AuthProviderProps) {
  const [state, setState] = useState<AuthState>(initialState)
  const [restoreAttempt, setRestoreAttempt] = useState(0)

  useEffect(() => {
    let active = true
    let listenerReceivedSession = false

    const unsubscribe = service.subscribe((session) => {
      listenerReceivedSession = true

      if (active) {
        setState(stateFromSession(session))
      }
    })

    void service
      .getSession()
      .then((session) => {
        if (active && !listenerReceivedSession) {
          setState(stateFromSession(session))
        }
      })
      .catch((error: unknown) => {
        if (active && !listenerReceivedSession) {
          setState({
            error: getAuthErrorMessage(error),
            session: null,
            status: 'unauthenticated',
          })
        }
      })

    return () => {
      active = false
      unsubscribe()
    }
  }, [restoreAttempt, service])

  const retrySessionRestore = useCallback(() => {
    setState(initialState)
    setRestoreAttempt((attempt) => attempt + 1)
  }, [])

  const signIn = useCallback(
    async (credentials: AuthCredentials) => {
      const session = await service.signIn(credentials)
      setState(stateFromSession(session))
    },
    [service],
  )

  const signUp = useCallback(
    async (credentials: SignUpCredentials) => {
      const result = await service.signUp(credentials)

      if (result.session) {
        setState(stateFromSession(result.session))
      }

      return result
    },
    [service],
  )

  const signOut = useCallback(async () => {
    await service.signOut()
    setState(stateFromSession(null))
  }, [service])

  const value = useMemo<AuthContextValue>(
    () => ({
      ...state,
      retrySessionRestore,
      signIn,
      signOut,
      signUp,
    }),
    [retrySessionRestore, signIn, signOut, signUp, state],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
