import { type FormEvent, useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router'

import { formatMoney } from '../../../utils/money'
import { toLocalDateTimeValue } from '../../transactions/utils/validation'
import { useWalletService } from '../../wallets/context/useWalletService'
import { TransferForm } from '../components/TransferForm'
import { useTransferService } from '../context/useTransferService'
import { getTransferErrorMessage } from '../services/transfer-errors'
import type { TransferDetail, TransferWalletOption } from '../types'
import {
  type TransferFormErrors,
  type TransferFormValues,
  validateTransferForm,
} from '../utils/validation'

type PendingAction = 'delete' | 'restore' | 'update' | null

function valuesFromTransfer(transfer: TransferDetail): TransferFormValues {
  return {
    amount: transfer.amount,
    description: transfer.description,
    destinationWalletId: transfer.destinationWalletId,
    fee: transfer.feeAmount,
    notes: transfer.notes ?? '',
    occurredAt: toLocalDateTimeValue(transfer.occurredAt),
    sourceWalletId: transfer.sourceWalletId,
  }
}

export function TransferDetailPage() {
  const { transferId } = useParams()
  const transferService = useTransferService()
  const walletService = useWalletService()
  const [transfer, setTransfer] = useState<TransferDetail | null>(null)
  const [wallets, setWallets] = useState<TransferWalletOption[]>([])
  const [values, setValues] = useState<TransferFormValues | null>(null)
  const [errors, setErrors] = useState<TransferFormErrors>({})
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [requestError, setRequestError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [pendingAction, setPendingAction] = useState<PendingAction>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const loadTransfer = useCallback(async () => {
    if (!transferId) {
      setNotFound(true)
      setLoading(false)
      return
    }

    setLoading(true)
    setRequestError(null)

    try {
      const [loadedTransfer, activeWallets] = await Promise.all([
        transferService.getTransfer(transferId),
        walletService.listWallets('active'),
      ])

      if (!loadedTransfer) {
        setNotFound(true)
        return
      }

      const options: TransferWalletOption[] = activeWallets.map((wallet) => ({
        archivedAt: wallet.archivedAt,
        id: wallet.id,
        name: wallet.name,
      }))

      for (const historical of [
        {
          archivedAt: loadedTransfer.sourceWalletArchivedAt,
          id: loadedTransfer.sourceWalletId,
          name: loadedTransfer.sourceWalletName,
        },
        {
          archivedAt: loadedTransfer.destinationWalletArchivedAt,
          id: loadedTransfer.destinationWalletId,
          name: loadedTransfer.destinationWalletName,
        },
      ]) {
        if (!options.some((wallet) => wallet.id === historical.id)) {
          options.push(historical)
        }
      }

      setNotFound(false)
      setTransfer(loadedTransfer)
      setValues(valuesFromTransfer(loadedTransfer))
      setWallets(options)
    } catch (error) {
      setRequestError(getTransferErrorMessage(error))
    } finally {
      setLoading(false)
    }
  }, [transferId, transferService, walletService])

  useEffect(() => {
    const loadTimer = window.setTimeout(() => {
      void loadTransfer()
    }, 0)

    return () => window.clearTimeout(loadTimer)
  }, [loadTransfer])

  function beginRequest(action: Exclude<PendingAction, null>) {
    setPendingAction(action)
    setRequestError(null)
    setSuccess(null)
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!transferId || !transfer || !values || transfer.deletedAt) return

    const result = validateTransferForm(values)
    setErrors(result.valid ? {} : result.errors)
    if (!result.valid) return

    beginRequest('update')
    try {
      await transferService.updateTransfer(transferId, result.input)
      await loadTransfer()
      setSuccess('Transfer updated.')
    } catch (error) {
      setRequestError(getTransferErrorMessage(error))
    } finally {
      setPendingAction(null)
    }
  }

  async function handleDelete() {
    if (!transferId || !transfer || transfer.deletedAt) return
    beginRequest('delete')
    try {
      await transferService.softDeleteTransfer(transferId)
      setConfirmDelete(false)
      await loadTransfer()
      setSuccess('Transfer deleted. Its ledger records remain recoverable.')
    } catch (error) {
      setRequestError(getTransferErrorMessage(error))
    } finally {
      setPendingAction(null)
    }
  }

  async function handleRestore() {
    if (!transferId || !transfer?.deletedAt) return
    beginRequest('restore')
    try {
      await transferService.restoreTransfer(transferId)
      await loadTransfer()
      setSuccess('Transfer restored and its balance effects are active again.')
    } catch (error) {
      setRequestError(getTransferErrorMessage(error))
    } finally {
      setPendingAction(null)
    }
  }

  if (loading)
    return (
      <p className="mx-auto max-w-3xl px-4 py-10" role="status">
        Loading transfer...
      </p>
    )

  if (notFound || !transfer || !values) {
    return (
      <section className="mx-auto max-w-3xl px-4 py-12">
        <h1 className="text-2xl font-bold text-slate-950">
          Transfer unavailable
        </h1>
        <p className="mt-2 text-slate-600">
          It may not exist or may belong to another user.
        </p>
        <Link
          className="mt-5 inline-flex font-semibold text-teal-700"
          to="/app/transactions"
        >
          Back to transactions
        </Link>
      </section>
    )
  }

  return (
    <section className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
      <Link
        className="text-sm font-semibold text-teal-700"
        to="/app/transactions"
      >
        Back to transactions
      </Link>
      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-brand-700 text-sm font-semibold uppercase">
              Wallet transfer
            </p>
            <h1 className="mt-2 text-3xl font-bold text-slate-950">
              {transfer.description}
            </h1>
            <p className="mt-2 text-slate-600">
              {transfer.sourceWalletName} &rarr;{' '}
              {transfer.destinationWalletName}
            </p>
          </div>
          {transfer.deletedAt ? (
            <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-600">
              Deleted
            </span>
          ) : null}
        </div>

        <dl className="mt-6 grid gap-4 rounded-xl bg-slate-50 p-4 sm:grid-cols-3">
          <div>
            <dt className="text-sm text-slate-500">Principal</dt>
            <dd className="mt-1 font-semibold">
              {formatMoney(transfer.amount)}
            </dd>
          </div>
          <div>
            <dt className="text-sm text-slate-500">Admin fee</dt>
            <dd className="mt-1 font-semibold">
              {formatMoney(transfer.feeAmount)}
            </dd>
          </div>
          <div>
            <dt className="text-sm text-slate-500">Source impact</dt>
            <dd className="mt-1 font-semibold text-rose-700">
              -
              {formatMoney(
                (
                  BigInt(transfer.amount) + BigInt(transfer.feeAmount)
                ).toString(),
              )}
            </dd>
          </div>
        </dl>

        {success ? (
          <p
            className="mt-5 rounded-xl bg-teal-50 p-4 text-sm text-teal-800"
            role="status"
          >
            {success}
          </p>
        ) : null}
        {requestError ? (
          <p
            className="mt-5 rounded-xl bg-rose-50 p-4 text-sm text-rose-700"
            role="alert"
          >
            {requestError}
          </p>
        ) : null}

        {transfer.deletedAt ? (
          <button
            className="bg-brand-700 mt-6 min-h-11 rounded-xl px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
            disabled={pendingAction !== null}
            onClick={() => void handleRestore()}
            type="button"
          >
            {pendingAction === 'restore' ? 'Restoring...' : 'Restore transfer'}
          </button>
        ) : (
          <>
            <div className="mt-8 border-t border-slate-200 pt-7">
              <h2 className="text-xl font-semibold text-slate-950">
                Edit transfer
              </h2>
              <div className="mt-5">
                <TransferForm
                  errors={errors}
                  onChange={setValues}
                  onSubmit={(event) => void handleSubmit(event)}
                  pending={pendingAction !== null}
                  submitLabel="Save changes"
                  values={values}
                  wallets={wallets}
                />
              </div>
            </div>
            <div className="mt-8 border-t border-slate-200 pt-7">
              {!confirmDelete ? (
                <button
                  className="min-h-11 rounded-xl border border-rose-300 px-4 py-2.5 text-sm font-semibold text-rose-700"
                  onClick={() => setConfirmDelete(true)}
                  type="button"
                >
                  Delete transfer
                </button>
              ) : (
                <div className="rounded-xl border border-rose-200 bg-rose-50 p-4">
                  <p className="text-sm text-rose-800">
                    This removes every balance effect while retaining ledger
                    history.
                  </p>
                  <div className="mt-4 flex gap-3">
                    <button
                      className="rounded-lg bg-rose-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                      disabled={pendingAction !== null}
                      onClick={() => void handleDelete()}
                      type="button"
                    >
                      {pendingAction === 'delete'
                        ? 'Deleting...'
                        : 'Confirm delete'}
                    </button>
                    <button
                      className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-700"
                      onClick={() => setConfirmDelete(false)}
                      type="button"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </section>
  )
}
