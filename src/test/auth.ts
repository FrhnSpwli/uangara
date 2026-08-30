import type { Session } from '@supabase/supabase-js'
import { vi } from 'vitest'

import type { AuthService } from '../features/auth/services/auth-service'

export function createTestSession(
  email = 'person@example.test',
  id = '11111111-1111-1111-1111-111111111111',
): Session {
  return {
    access_token: `test-access-${id}`,
    expires_in: 3600,
    refresh_token: `test-refresh-${id}`,
    token_type: 'bearer',
    user: {
      app_metadata: {},
      aud: 'authenticated',
      created_at: '2026-08-30T00:00:00.000Z',
      email,
      id,
      user_metadata: {},
    },
  }
}

export function createAuthServiceStub(session: Session | null = null) {
  const unsubscribe = vi.fn()
  const authenticatedSession = session ?? createTestSession()

  const service = {
    getSession: vi.fn(() => Promise.resolve(session)),
    signIn: vi.fn(() => Promise.resolve(authenticatedSession)),
    signOut: vi.fn(() => Promise.resolve()),
    signUp: vi.fn(() =>
      Promise.resolve({
        confirmationRequired: true,
        session: null,
      }),
    ),
    subscribe: vi.fn(() => unsubscribe),
  } satisfies AuthService

  return { service, unsubscribe }
}
