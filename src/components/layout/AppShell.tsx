import { NavLink, Outlet } from 'react-router'

const navigationLinkClassName = ({ isActive }: { isActive: boolean }) =>
  [
    'rounded-full px-3 py-2 text-sm font-medium transition-colors',
    isActive
      ? 'bg-brand-100 text-brand-800'
      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950',
  ].join(' ')

export function AppShell() {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <a
        className="sr-only z-50 rounded-md bg-white px-4 py-2 focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
        href="#main-content"
      >
        Skip to content
      </a>

      <header className="border-b border-slate-200 bg-white/95">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <NavLink
            aria-label="Uangara home"
            className="flex items-center gap-3 rounded-md"
            to="/"
          >
            <span
              aria-hidden="true"
              className="bg-brand-700 grid size-9 place-items-center rounded-xl text-sm font-bold text-white"
            >
              U
            </span>
            <span className="text-lg font-semibold tracking-tight text-slate-950">
              Uangara
            </span>
          </NavLink>

          <nav aria-label="Primary navigation">
            <NavLink className={navigationLinkClassName} end to="/">
              Home
            </NavLink>
          </nav>
        </div>
      </header>

      <main className="flex-1" id="main-content">
        <Outlet />
      </main>

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto w-full max-w-5xl px-4 py-5 text-sm text-slate-500 sm:px-6">
          Phase 1 foundation · Financial features are intentionally not
          implemented yet.
        </div>
      </footer>
    </div>
  )
}
