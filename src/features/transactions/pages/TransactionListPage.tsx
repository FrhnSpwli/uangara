import { useEffect, useState } from 'react'
import { Link } from 'react-router'

import { formatMoney } from '../../../utils/money'
import { useTransactionService } from '../context/useTransactionService'
import { getTransactionErrorMessage } from '../services/transaction-errors'
import type { TransactionListMode, TransactionSummary } from '../types'

const occurredAtFormatter = new Intl.DateTimeFormat('id-ID', {
  dateStyle: 'medium',
  timeStyle: 'short',
})

function signedAmount(transaction: TransactionSummary) {
  const prefix = transaction.kind === 'income' ? '+' : '−'
  return `${prefix}${formatMoney(transaction.amount)}`
}

export function TransactionListPage() {
  const service = useTransactionService()
  const [mode, setMode] = useState<TransactionListMode>('active')
  const [transactions, setTransactions] = useState<TransactionSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    let active = true

    void service
      .listTransactions(mode)
      .then((result) => {
        if (active) {
          setTransactions(result)
        }
      })
      .catch((loadError: unknown) => {
        if (active) {
          setError(getTransactionErrorMessage(loadError))
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

  function changeMode(value: TransactionListMode) {
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
            Wealth changes
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
            Transactions
          </h1>
          <p className="mt-2 max-w-2xl leading-7 text-slate-600">
            Recent income and expenses. Full history and search arrive in a
            later phase.
          </p>
        </div>
        <Link
          className="bg-brand-700 hover:bg-brand-800 inline-flex min-h-11 items-center justify-center rounded-xl px-4 py-2.5 text-sm font-semibold text-white"
          to="/app/transactions/new"
        >
          Add transaction
        </Link>
      </div>

      <div
        aria-label="Transaction status"
        className="mt-8 inline-flex rounded-xl bg-slate-200 p-1"
        role="group"
      >
        {(['active', 'deleted'] as const).map((value) => (
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
          Loading {mode} transactions…
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

      {!loading && !error && transactions.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
          <h2 className="text-lg font-semibold text-slate-950">
            No {mode} transactions
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            {mode === 'active'
              ? 'Record an income or expense to see it here.'
              : 'Soft-deleted transactions remain recoverable and appear here.'}
          </p>
        </div>
      ) : null}

      {!loading && !error && transactions.length > 0 ? (
        <ul className="mt-8 space-y-3">
          {transactions.map((transaction) => (
            <li key={transaction.id}>
              <Link
                className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-teal-300 hover:shadow-md sm:flex-row sm:items-center sm:justify-between"
                to={`/app/transactions/${transaction.id}`}
              >
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-semibold text-slate-950">
                      {transaction.description}
                    </h2>
                    {transaction.deletedAt ? (
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                        Deleted
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-1 text-sm text-slate-500">
                    {transaction.walletName} ·{' '}
                    {occurredAtFormatter.format(
                      new Date(transaction.occurredAt),
                    )}
                  </p>
                </div>
                <p
                  className={`text-lg font-bold ${
                    transaction.kind === 'income'
                      ? 'text-teal-700'
                      : 'text-rose-700'
                  }`}
                >
                  {signedAmount(transaction)}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  )
}
