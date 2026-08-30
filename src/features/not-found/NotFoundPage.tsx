import { Link } from 'react-router'

export function NotFoundPage() {
  return (
    <section className="mx-auto flex w-full max-w-3xl flex-col items-start px-4 py-16 sm:px-6 sm:py-24">
      <p className="text-brand-700 text-sm font-semibold">404</p>
      <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-950">
        Page not found
      </h1>
      <p className="mt-4 max-w-xl leading-7 text-slate-600">
        This route is not part of the Uangara foundation.
      </p>
      <Link
        className="bg-brand-700 hover:bg-brand-800 mt-8 rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition-colors"
        to="/"
      >
        Return home
      </Link>
    </section>
  )
}
