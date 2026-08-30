import type { Session } from '@supabase/supabase-js'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { describe, expect, it } from 'vitest'

import { AppRoutes } from '../../app/router/AppRouter'
import { createAuthServiceStub, createTestSession } from '../../test/auth'
import { AuthProvider } from './context/AuthProvider'
import { SafeAuthError } from './services/auth-errors'
import type { AuthService } from './services/auth-service'

function renderAt(path: string, service: AuthService) {
  return render(
    <AuthProvider service={service}>
      <MemoryRouter initialEntries={[path]}>
        <AppRoutes />
      </MemoryRouter>
    </AuthProvider>,
  )
}

describe('authentication flow', () => {
  it('keeps protected content hidden while the session is loading', () => {
    const { service } = createAuthServiceStub()
    service.getSession.mockImplementation(
      () => new Promise<Session | null>(() => {}),
    )

    renderAt('/app', service)

    expect(screen.getByRole('status')).toHaveTextContent(
      'Restoring your session',
    )
    expect(
      screen.queryByText('Authentication is ready.'),
    ).not.toBeInTheDocument()
  })

  it('redirects an unauthenticated protected route to sign in', async () => {
    const { service } = createAuthServiceStub(null)

    renderAt('/app', service)

    expect(
      await screen.findByRole('heading', { name: 'Sign in' }),
    ).toBeInTheDocument()
  })

  it('allows an authenticated user into the protected application', async () => {
    const { service } = createAuthServiceStub(createTestSession())

    renderAt('/app', service)

    expect(
      await screen.findByRole('heading', { name: 'Authentication is ready.' }),
    ).toBeInTheDocument()
  })

  it('submits sign-in credentials and enters the protected route', async () => {
    const { service } = createAuthServiceStub(null)
    const session = createTestSession('signed-in@example.test')
    service.signIn.mockResolvedValue(session)

    renderAt('/auth/sign-in', service)

    fireEvent.change(await screen.findByLabelText('Email address'), {
      target: { value: ' signed-in@example.test ' },
    })
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'safe-test-password' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }))

    await waitFor(() => {
      expect(service.signIn).toHaveBeenCalledWith({
        email: 'signed-in@example.test',
        password: 'safe-test-password',
      })
    })
    expect(
      await screen.findByRole('heading', { name: 'Authentication is ready.' }),
    ).toBeInTheDocument()
  })

  it('presents email confirmation as a successful sign-up outcome', async () => {
    const { service } = createAuthServiceStub(null)

    renderAt('/auth/sign-up', service)

    fireEvent.change(await screen.findByLabelText('Email address'), {
      target: { value: 'new@example.test' },
    })
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'safe-test-password' },
    })
    fireEvent.change(screen.getByLabelText('Confirm password'), {
      target: { value: 'safe-test-password' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Create account' }))

    expect(
      await screen.findByRole('heading', { name: 'Check your inbox' }),
    ).toBeInTheDocument()
    expect(service.signUp).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'new@example.test',
        password: 'safe-test-password',
      }),
    )
  })

  it('signs out and returns to the guest authentication area', async () => {
    const { service } = createAuthServiceStub(createTestSession())

    renderAt('/app', service)

    fireEvent.click(await screen.findByRole('button', { name: 'Sign out' }))

    await waitFor(() => {
      expect(service.signOut).toHaveBeenCalledOnce()
    })
    expect(
      await screen.findByRole('heading', { name: 'Sign in' }),
    ).toBeInTheDocument()
  })

  it('shows a safe restoration error and retry action', async () => {
    const { service } = createAuthServiceStub()
    service.getSession.mockRejectedValue(
      new SafeAuthError('Your session could not be restored safely.'),
    )

    renderAt('/app', service)

    expect(
      await screen.findByRole('heading', { name: 'Session unavailable' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Your session could not be restored safely.',
    )
    expect(
      screen.getByRole('button', { name: 'Try again' }),
    ).toBeInTheDocument()
  })

  it('unsubscribes from auth changes when the provider unmounts', () => {
    const { service, unsubscribe } = createAuthServiceStub()
    const view = renderAt('/', service)

    view.unmount()

    expect(unsubscribe).toHaveBeenCalledOnce()
  })

  it('redirects an authenticated user away from guest-only routes', async () => {
    const { service } = createAuthServiceStub(createTestSession())

    renderAt('/auth/sign-in', service)

    expect(
      await screen.findByRole('heading', { name: 'Authentication is ready.' }),
    ).toBeInTheDocument()
  })
})
