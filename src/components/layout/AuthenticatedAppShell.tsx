import { useState } from 'react'
import { Link, Outlet } from 'react-router'

import { useAuth } from '../../features/auth/context/useAuth'
import { getAuthErrorMessage } from '../../features/auth/services/auth-errors'

export function AuthenticatedAppShell() {
  const { signOut } = useAuth()
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSignOut() {
    setError(null)
    setPending(true)

    try {
      await signOut()
    } catch (signOutError) {
      setError(getAuthErrorMessage(signOutError))
      setPending(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <a
        className="sr-only z-50 rounded-md bg-white px-4 py-2 focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
        href="#app-content"
      >
        Skip to content
      </a>
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <Link
            aria-label="Uangara application home"
            className="flex items-center gap-3"
            to="/app"
          >
            <span
              aria-hidden="true"
              className="bg-brand-700 grid size-9 place-items-center rounded-xl text-sm font-bold text-white"
            >
              U
            </span>
            <span className="font-semibold text-slate-950">Uangara</span>
          </Link>
          <button
            className="rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={pending}
            onClick={() => {
              void handleSignOut()
            }}
            type="button"
          >
            {pending ? 'Signing out…' : 'Sign out'}
          </button>
        </div>
        {error ? (
          <p
            className="mx-auto w-full max-w-5xl px-4 pb-4 text-sm text-rose-700 sm:px-6"
            role="alert"
          >
            {error}
          </p>
        ) : null}
      </header>
      <main className="flex-1" id="app-content">
        <Outlet />
      </main>
    </div>
  )
}
