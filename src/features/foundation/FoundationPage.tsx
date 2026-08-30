import { Link } from 'react-router'

const foundationItems = [
  'Responsive React application shell',
  'Email and password authentication',
  'Session-aware protected routing',
  'Installable PWA foundation',
  'Owner-scoped profile security foundation',
]

export function FoundationPage() {
  return (
    <section className="mx-auto grid w-full max-w-5xl gap-10 px-4 py-12 sm:px-6 sm:py-20 lg:grid-cols-[1.25fr_0.75fr] lg:items-center">
      <div>
        <p className="text-brand-700 mb-4 text-sm font-semibold tracking-wide uppercase">
          Authentication foundation
        </p>
        <h1 className="max-w-3xl text-4xl font-bold tracking-tight text-balance text-slate-950 sm:text-5xl">
          See where your money lives and how it moves.
        </h1>
        <p className="mt-5 max-w-2xl text-lg leading-8 text-pretty text-slate-600">
          Uangara is being built around real financial locations—bank accounts,
          e-wallets, cash, and the wallets people define for themselves.
        </p>
        <div className="border-brand-100 bg-brand-50 mt-8 max-w-2xl rounded-2xl border p-5 text-sm leading-6 text-slate-700">
          Authentication is now available. Wallets, transactions, transfers, and
          financial reporting remain intentionally unavailable until later
          phases.
        </div>
        <div className="mt-7 flex flex-wrap gap-3">
          <Link
            className="bg-brand-700 hover:bg-brand-800 rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition-colors"
            to="/auth/sign-in"
          >
            Sign in
          </Link>
          <Link
            className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 transition-colors hover:bg-slate-100"
            to="/auth/sign-up"
          >
            Create account
          </Link>
        </div>
      </div>

      <aside
        aria-labelledby="foundation-heading"
        className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"
      >
        <h2
          className="text-lg font-semibold text-slate-950"
          id="foundation-heading"
        >
          Foundation available today
        </h2>
        <ul className="mt-5 space-y-4">
          {foundationItems.map((item) => (
            <li
              className="flex gap-3 text-sm leading-6 text-slate-600"
              key={item}
            >
              <span
                aria-hidden="true"
                className="bg-brand-600 mt-2 size-2 shrink-0 rounded-full"
              />
              {item}
            </li>
          ))}
        </ul>
      </aside>
    </section>
  )
}
