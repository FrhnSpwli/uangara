import { useEffect, useState } from 'react'
import { Link } from 'react-router'

import { useWalletService } from '../context/useWalletService'
import { getWalletErrorMessage } from '../services/wallet-errors'
import type { WalletListMode, WalletSummary } from '../types'
import { formatMoney } from '../utils/money'
import { getWalletTypeLabel } from '../utils/validation'

export function WalletListPage() {
  const service = useWalletService()
  const [mode, setMode] = useState<WalletListMode>('active')
  const [wallets, setWallets] = useState<WalletSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    let active = true

    void service
      .listWallets(mode)
      .then((result) => {
        if (active) {
          setWallets(result)
        }
      })
      .catch((loadError: unknown) => {
        if (active) {
          setError(getWalletErrorMessage(loadError))
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false)
        }
      })

    return () => {
      active = false
    }
  }, [mode, reloadKey, service])

  function changeMode(value: WalletListMode) {
    setLoading(true)
    setError(null)
    setMode(value)
  }

  function retry() {
    setLoading(true)
    setError(null)
    setReloadKey((key) => key + 1)
  }

  return (
    <section className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 sm:py-12">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-brand-700 text-sm font-semibold tracking-wide uppercase">
            Money locations
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
            Wallets
          </h1>
          <p className="mt-2 max-w-2xl leading-7 text-slate-600">
            Each balance is calculated from its active ledger movements.
          </p>
        </div>
        <Link
          className="bg-brand-700 hover:bg-brand-800 inline-flex min-h-11 items-center justify-center rounded-xl px-4 py-2.5 text-sm font-semibold text-white"
          to="/app/wallets/new"
        >
          Add wallet
        </Link>
      </div>

      <div
        aria-label="Wallet status"
        className="mt-8 inline-flex rounded-xl bg-slate-200 p-1"
        role="group"
      >
        {(['active', 'archived'] as const).map((value) => (
          <button
            aria-pressed={mode === value}
            className={`rounded-lg px-4 py-2 text-sm font-semibold capitalize ${
              mode === value
                ? 'bg-white text-slate-950 shadow-sm'
                : 'text-slate-600 hover:text-slate-950'
            }`}
            key={value}
            onClick={() => changeMode(value)}
            type="button"
          >
            {value}
          </button>
        ))}
      </div>

      {loading ? (
        <div
          className="mt-8 rounded-2xl border border-slate-200 bg-white p-6"
          role="status"
        >
          Loading {mode} wallets…
        </div>
      ) : null}

      {!loading && error ? (
        <div className="mt-8 rounded-2xl border border-rose-200 bg-white p-6">
          <p className="text-sm text-rose-700" role="alert">
            {error}
          </p>
          <button
            className="mt-4 rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold"
            onClick={retry}
            type="button"
          >
            Try again
          </button>
        </div>
      ) : null}

      {!loading && !error && wallets.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
          <h2 className="text-lg font-semibold text-slate-950">
            No {mode} wallets
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            {mode === 'active'
              ? 'Add the first place where your money is held.'
              : 'Archived wallets remain recoverable and will appear here.'}
          </p>
        </div>
      ) : null}

      {!loading && !error && wallets.length > 0 ? (
        <ul className="mt-8 grid gap-4 sm:grid-cols-2">
          {wallets.map((wallet) => (
            <li key={wallet.id}>
              <Link
                className="block h-full rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-teal-300 hover:shadow-md"
                to={`/app/wallets/${wallet.id}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="font-semibold text-slate-950">
                      {wallet.name}
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">
                      {getWalletTypeLabel(wallet.type)}
                      {wallet.institution ? ` · ${wallet.institution}` : ''}
                    </p>
                  </div>
                  {wallet.archivedAt ? (
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                      Archived
                    </span>
                  ) : null}
                </div>
                <p className="mt-6 text-xl font-bold tracking-tight text-slate-950">
                  {formatMoney(wallet.balance)}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  )
}
