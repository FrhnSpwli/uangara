import { Link, Outlet } from 'react-router'

export function AuthLayout() {
  return (
    <div className="grid min-h-screen bg-slate-50 lg:grid-cols-[0.85fr_1.15fr]">
      <aside className="bg-brand-800 hidden p-10 text-white lg:flex lg:flex-col lg:justify-between">
        <Link className="flex items-center gap-3 rounded-md" to="/">
          <span
            aria-hidden="true"
            className="grid size-10 place-items-center rounded-xl bg-white/15 font-bold"
          >
            U
          </span>
          <span className="text-xl font-semibold">Uangara</span>
        </Link>
        <div className="max-w-md">
          <p className="text-sm font-semibold tracking-wide text-teal-100 uppercase">
            Private by design
          </p>
          <p className="mt-4 text-3xl leading-tight font-semibold text-balance">
            Your account is the boundary around your financial data.
          </p>
          <p className="mt-4 leading-7 text-teal-50/80">
            Route protection improves the experience. Supabase Row Level
            Security remains the database authorization boundary.
          </p>
        </div>
      </aside>

      <main className="flex min-h-screen flex-col">
        <header className="flex items-center justify-between px-4 py-5 sm:px-8 lg:justify-end">
          <Link
            aria-label="Uangara home"
            className="flex items-center gap-3 rounded-md lg:hidden"
            to="/"
          >
            <span
              aria-hidden="true"
              className="bg-brand-700 grid size-9 place-items-center rounded-xl text-sm font-bold text-white"
            >
              U
            </span>
            <span className="font-semibold text-slate-950">Uangara</span>
          </Link>
          <Link
            className="text-sm font-medium text-slate-600 hover:text-slate-950"
            to="/"
          >
            Back home
          </Link>
        </header>
        <div className="flex flex-1 items-center justify-center px-4 pb-12 sm:px-8">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
