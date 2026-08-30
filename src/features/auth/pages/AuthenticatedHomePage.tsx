import { useAuth } from '../context/useAuth'

export function AuthenticatedHomePage() {
  const { session } = useAuth()

  return (
    <section className="mx-auto w-full max-w-4xl px-4 py-12 sm:px-6 sm:py-20">
      <p className="text-brand-700 text-sm font-semibold tracking-wide uppercase">
        Private application area
      </p>
      <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
        Authentication is ready.
      </h1>
      <p className="mt-4 max-w-2xl leading-7 text-slate-600">
        Your session has been restored and this route is protected. Wallet and
        transaction functionality has not been implemented.
      </p>
      {session?.user.email ? (
        <p className="mt-8 rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-600">
          Signed in as{' '}
          <span className="font-medium text-slate-900">
            {session.user.email}
          </span>
        </p>
      ) : null}
    </section>
  )
}
