import { Navigate, Outlet, useLocation } from 'react-router'

import { useAuth } from '../context/useAuth'

interface ReturnLocationState {
  from?: string
}

function getSafeReturnPath(state: unknown) {
  const returnState = state as ReturnLocationState | null
  return returnState?.from?.startsWith('/app') ? returnState.from : '/app'
}

function SessionLoadingScreen() {
  return (
    <main className="grid min-h-screen place-items-center bg-slate-50 px-4">
      <div className="text-center" role="status">
        <span
          aria-hidden="true"
          className="border-brand-700 mx-auto block size-8 animate-spin rounded-full border-4 border-t-transparent"
        />
        <p className="mt-4 text-sm font-medium text-slate-600">
          Restoring your session…
        </p>
      </div>
    </main>
  )
}

function SessionErrorScreen({
  message,
  retry,
}: {
  message: string
  retry: () => void
}) {
  return (
    <main className="grid min-h-screen place-items-center bg-slate-50 px-4">
      <section className="w-full max-w-md rounded-3xl border border-rose-200 bg-white p-6 shadow-sm">
        <h1 className="text-xl font-semibold text-slate-950">
          Session unavailable
        </h1>
        <p className="mt-3 leading-7 text-slate-600" role="alert">
          {message}
        </p>
        <button
          className="bg-brand-700 hover:bg-brand-800 mt-6 rounded-xl px-4 py-2.5 text-sm font-semibold text-white"
          onClick={retry}
          type="button"
        >
          Try again
        </button>
      </section>
    </main>
  )
}

export function ProtectedRoute() {
  const { error, retrySessionRestore, status } = useAuth()
  const location = useLocation()

  if (status === 'loading') {
    return <SessionLoadingScreen />
  }

  if (error) {
    return <SessionErrorScreen message={error} retry={retrySessionRestore} />
  }

  if (status === 'unauthenticated') {
    return (
      <Navigate
        replace
        state={{ from: `${location.pathname}${location.search}` }}
        to="/auth/sign-in"
      />
    )
  }

  return <Outlet />
}

export function GuestOnlyRoute() {
  const { error, retrySessionRestore, status } = useAuth()
  const location = useLocation()

  if (status === 'loading') {
    return <SessionLoadingScreen />
  }

  if (error) {
    return <SessionErrorScreen message={error} retry={retrySessionRestore} />
  }

  if (status === 'authenticated') {
    return <Navigate replace to={getSafeReturnPath(location.state)} />
  }

  return <Outlet />
}
