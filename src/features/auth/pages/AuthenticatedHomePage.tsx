import { Link } from 'react-router'

import { useAuth } from '../context/useAuth'

export function AuthenticatedHomePage() {
  const { session } = useAuth()

  return (
    <section className="mx-auto w-full max-w-4xl px-4 py-12 sm:px-6 sm:py-20">
      <p className="text-brand-700 text-sm font-semibold tracking-wide uppercase">
        Private application area
      </p>
      <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
        Your money locations start here.
      </h1>
      <p className="mt-4 max-w-2xl leading-7 text-slate-600">
        Create wallets for the bank accounts, e-wallets, cash, and other places
        where you hold money, then record ordinary income and expenses.
        Transfers remain for a later phase.
      </p>
      <div className="mt-7 flex flex-wrap gap-3">
        <Link
          className="bg-brand-700 hover:bg-brand-800 inline-flex min-h-11 items-center rounded-xl px-4 py-2.5 text-sm font-semibold text-white"
          to="/app/wallets"
        >
          View wallets
        </Link>
        <Link
          className="inline-flex min-h-11 items-center rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 hover:bg-slate-100"
          to="/app/transactions"
        >
          View transactions
        </Link>
      </div>
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
