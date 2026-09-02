import { type FormEvent, useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router'

import { formatMoney } from '../../../utils/money'
import { useWalletService } from '../../wallets/context/useWalletService'
import { TransactionForm } from '../components/TransactionForm'
import { useTransactionService } from '../context/useTransactionService'
import { getTransactionErrorMessage } from '../services/transaction-errors'
import type { TransactionDetail, TransactionWalletOption } from '../types'
import {
  toLocalDateTimeValue,
  type TransactionFormErrors,
  type TransactionFormValues,
  validateTransactionForm,
} from '../utils/validation'

type PendingAction = 'delete' | 'restore' | 'update' | null

const occurredAtFormatter = new Intl.DateTimeFormat('id-ID', {
  dateStyle: 'medium',
  timeStyle: 'short',
})

function valuesFromTransaction(
  transaction: TransactionDetail,
): TransactionFormValues {
  return {
    amount: transaction.amount,
    description: transaction.description,
    kind: transaction.kind,
    notes: transaction.notes ?? '',
    occurredAt: toLocalDateTimeValue(transaction.occurredAt),
    walletId: transaction.walletId,
  }
}

export function TransactionDetailPage() {
  const { transactionId } = useParams()
  const transactionService = useTransactionService()
  const walletService = useWalletService()
  const [transaction, setTransaction] = useState<TransactionDetail | null>(null)
  const [wallets, setWallets] = useState<TransactionWalletOption[]>([])
  const [values, setValues] = useState<TransactionFormValues | null>(null)
  const [errors, setErrors] = useState<TransactionFormErrors>({})
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [requestError, setRequestError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [pendingAction, setPendingAction] = useState<PendingAction>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const loadTransaction = useCallback(async () => {
    await Promise.resolve()

    if (!transactionId) {
      setNotFound(true)
      setLoading(false)
      return
    }

    setLoading(true)
    setLoadError(null)

    try {
      const [loadedTransaction, activeWallets] = await Promise.all([
        transactionService.getTransaction(transactionId),
        walletService.listWallets('active'),
      ])

      if (!loadedTransaction) {
        setNotFound(true)
        setTransaction(null)
        setValues(null)
        return
      }

      const options = activeWallets.map((wallet) => ({
        archivedAt: wallet.archivedAt,
        id: wallet.id,
        name: wallet.name,
      }))

      if (!options.some((wallet) => wallet.id === loadedTransaction.walletId)) {
        options.push({
          archivedAt: loadedTransaction.walletArchivedAt,
          id: loadedTransaction.walletId,
          name: loadedTransaction.walletName,
        })
      }

      setNotFound(false)
      setTransaction(loadedTransaction)
      setValues(valuesFromTransaction(loadedTransaction))
      setWallets(options)
    } catch (error) {
      setLoadError(getTransactionErrorMessage(error))
    } finally {
      setLoading(false)
    }
  }, [transactionId, transactionService, walletService])

  useEffect(() => {
    const loadTimer = window.setTimeout(() => {
      void loadTransaction()
    }, 0)

    return () => window.clearTimeout(loadTimer)
  }, [loadTransaction])

  function beginRequest(action: Exclude<PendingAction, null>) {
    setPendingAction(action)
    setRequestError(null)
    setSuccess(null)
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!transactionId || !transaction || !values || transaction.deletedAt) {
      return
    }

    const result = validateTransactionForm(values)
    setErrors(result.valid ? {} : result.errors)

    if (!result.valid) {
      return
    }

    beginRequest('update')

    try {
      await transactionService.updateTransaction(transactionId, result.input)
      await loadTransaction()
      setSuccess('Transaction updated.')
    } catch (error) {
      setRequestError(getTransactionErrorMessage(error))
    } finally {
      setPendingAction(null)
    }
  }

  async function handleDelete() {
    if (!transactionId || !transaction || transaction.deletedAt) {
      return
    }

    beginRequest('delete')

    try {
      await transactionService.softDeleteTransaction(transactionId)
      setConfirmDelete(false)
      await loadTransaction()
      setSuccess('Transaction deleted. Its ledger record remains recoverable.')
    } catch (error) {
      setRequestError(getTransactionErrorMessage(error))
    } finally {
      setPendingAction(null)
    }
  }

  async function handleRestore() {
    if (!transactionId || !transaction?.deletedAt) {
      return
    }

    beginRequest('restore')

    try {
      await transactionService.restoreTransaction(transactionId)
      await loadTransaction()
      setSuccess('Transaction restored and its balance effect is active again.')
    } catch (error) {
      setRequestError(getTransactionErrorMessage(error))
    } finally {
      setPendingAction(null)
    }
  }

  if (loading) {
    return (
      <div
        className="mx-auto w-full max-w-3xl px-4 py-12 sm:px-6"
        role="status"
      >
        Loading transaction…
      </div>
    )
  }

  if (loadError) {
    return (
      <section className="mx-auto w-full max-w-3xl px-4 py-12 sm:px-6">
        <h1 className="text-2xl font-bold text-slate-950">
          Transaction unavailable
        </h1>
        <p className="mt-3 text-rose-700" role="alert">
          {loadError}
        </p>
        <button
          className="mt-5 rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold"
          onClick={() => void loadTransaction()}
          type="button"
        >
          Try again
        </button>
      </section>
    )
  }

  if (notFound || !transaction || !values) {
    return (
      <section className="mx-auto w-full max-w-3xl px-4 py-12 sm:px-6">
        <h1 className="text-2xl font-bold text-slate-950">
          Transaction unavailable
        </h1>
        <p className="mt-3 leading-7 text-slate-600">
          This transaction does not exist or is not available to your account.
        </p>
        <Link
          className="text-brand-700 mt-6 inline-block font-semibold"
          to="/app/transactions"
        >
          Return to transactions
        </Link>
      </section>
    )
  }

  const deleted = Boolean(transaction.deletedAt)
  const pending = pendingAction !== null

  return (
    <section className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
      <Link
        className="text-brand-700 text-sm font-semibold"
        to="/app/transactions"
      >
        ← Back to transactions
      </Link>

      <div className="mt-5 rounded-3xl bg-slate-950 p-6 text-white sm:p-8">
        <div className="flex flex-wrap items-center gap-3">
          <p className="text-sm font-semibold text-teal-300 capitalize">
            {transaction.kind}
          </p>
          {deleted ? (
            <span className="rounded-full bg-white/10 px-2.5 py-1 text-xs font-semibold">
              Deleted
            </span>
          ) : null}
          {transaction.walletArchivedAt ? (
            <span className="rounded-full bg-amber-400/20 px-2.5 py-1 text-xs font-semibold text-amber-100">
              Archived wallet
            </span>
          ) : null}
        </div>
        <h1 className="mt-3 text-3xl font-bold tracking-tight">
          {transaction.description}
        </h1>
        <div className="mt-5 flex flex-col gap-2 text-sm text-slate-300 sm:flex-row sm:justify-between">
          <span>{transaction.walletName}</span>
          <span>
            {occurredAtFormatter.format(new Date(transaction.occurredAt))}
          </span>
        </div>
        <p
          className={`mt-5 text-2xl font-bold ${
            transaction.kind === 'income' ? 'text-teal-300' : 'text-rose-300'
          }`}
        >
          {transaction.kind === 'income' ? '+' : '−'}
          {formatMoney(transaction.amount)}
        </p>
      </div>

      {deleted ? (
        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 text-sm leading-6 text-slate-600">
          This transaction remains stored but does not affect the active wallet
          balance. Restore it to reactivate the same ledger movement.
        </div>
      ) : null}

      {requestError ? (
        <p
          className="mt-6 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700"
          role="alert"
        >
          {requestError}
        </p>
      ) : null}
      {success ? (
        <p
          className="mt-6 rounded-xl border border-teal-200 bg-teal-50 p-4 text-sm text-teal-800"
          role="status"
        >
          {success}
        </p>
      ) : null}

      {!deleted ? (
        <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-5 text-lg font-semibold text-slate-950">
            Edit transaction
          </h2>
          <TransactionForm
            errors={errors}
            kindChanged={values.kind !== transaction.kind}
            onChange={(nextValues) => {
              setValues(nextValues)
              setErrors({})
            }}
            onSubmit={(event) => void handleSubmit(event)}
            pending={pending}
            submitLabel="Save transaction"
            values={values}
            wallets={wallets}
          />
        </div>
      ) : null}

      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-slate-950">
          Transaction lifecycle
        </h2>
        {deleted ? (
          <button
            className="bg-brand-700 hover:bg-brand-800 mt-4 min-h-11 rounded-xl px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
            disabled={pending}
            onClick={() => void handleRestore()}
            type="button"
          >
            {pendingAction === 'restore'
              ? 'Restoring transaction…'
              : 'Restore transaction'}
          </button>
        ) : confirmDelete ? (
          <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4">
            <p className="text-sm font-semibold text-amber-950">
              Delete this transaction?
            </p>
            <p className="mt-1 text-sm leading-6 text-amber-900">
              Its records remain stored, but its movement stops affecting the
              active balance until restored.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <button
                className="rounded-xl bg-amber-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                disabled={pending}
                onClick={() => void handleDelete()}
                type="button"
              >
                {pendingAction === 'delete'
                  ? 'Deleting transaction…'
                  : 'Confirm delete'}
              </button>
              <button
                className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold"
                disabled={pending}
                onClick={() => setConfirmDelete(false)}
                type="button"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            className="mt-4 min-h-11 rounded-xl border border-amber-300 px-4 py-2.5 text-sm font-semibold text-amber-800 hover:bg-amber-50"
            onClick={() => setConfirmDelete(true)}
            type="button"
          >
            Delete transaction
          </button>
        )}
      </div>
    </section>
  )
}
