export function ConfigurationErrorPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-slate-50 px-4 py-12">
      <section className="w-full max-w-lg rounded-3xl border border-amber-200 bg-white p-6 shadow-sm sm:p-8">
        <p className="text-sm font-semibold text-amber-700">
          Configuration required
        </p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-950">
          Uangara could not start
        </h1>
        <p className="mt-4 leading-7 text-slate-600">
          Add the browser-safe Supabase URL and publishable key described in{' '}
          <code className="rounded bg-slate-100 px-1.5 py-1 text-sm">
            .env.example
          </code>
          , then restart the development server.
        </p>
      </section>
    </main>
  )
}
