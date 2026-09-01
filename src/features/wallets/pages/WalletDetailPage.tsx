import { type FormEvent, useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router'

import { WalletMetadataFields } from '../components/WalletMetadataFields'
import { useWalletService } from '../context/useWalletService'
import { getWalletErrorMessage } from '../services/wallet-errors'
import type { WalletDetail } from '../types'
import { formatMoney, parseMoneyInput } from '../utils/money'
import {
  getWalletTypeLabel,
  type WalletFormErrors,
  validateWalletMetadata,
} from '../utils/validation'

type PendingAction = 'archive' | 'metadata' | 'opening' | 'restore' | null

const occurredAtFormatter = new Intl.DateTimeFormat('id-ID', {
  dateStyle: 'medium',
  timeStyle: 'short',
})

export function WalletDetailPage() {
  const { walletId } = useParams()
  const service = useWalletService()
  const [wallet, setWallet] = useState<WalletDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [requestError, setRequestError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [notFound, setNotFound] = useState(false)
  const [pendingAction, setPendingAction] = useState<PendingAction>(null)
  const [confirmArchive, setConfirmArchive] = useState(false)
  const [name, setName] = useState('')
  const [type, setType] = useState('bank')
  const [institution, setInstitution] = useState('')
  const [metadataErrors, setMetadataErrors] = useState<WalletFormErrors>({})
  const [openingBalance, setOpeningBalance] = useState('0')
  const [openingError, setOpeningError] = useState<string | null>(null)

  const loadWallet = useCallback(async () => {
    await Promise.resolve()

    if (!walletId) {
      setNotFound(true)
      setLoading(false)
      return
    }

    setLoading(true)
    setLoadError(null)

    try {
      const result = await service.getWallet(walletId)

      if (!result) {
        setNotFound(true)
        setWallet(null)
      } else {
        setNotFound(false)
        setWallet(result)
        setName(result.name)
        setType(result.type)
        setInstitution(result.institution ?? '')
        setOpeningBalance(result.openingBalance)
      }
    } catch (error) {
      setLoadError(getWalletErrorMessage(error))
    } finally {
      setLoading(false)
    }
  }, [service, walletId])

  useEffect(() => {
    let active = true
    const request = walletId
      ? service.getWallet(walletId)
      : Promise.resolve(null)

    void request
      .then((result) => {
        if (!active) {
          return
        }

        if (!result) {
          setNotFound(true)
          setWallet(null)
        } else {
          setNotFound(false)
          setWallet(result)
          setName(result.name)
          setType(result.type)
          setInstitution(result.institution ?? '')
          setOpeningBalance(result.openingBalance)
        }
      })
      .catch((error: unknown) => {
        if (active) {
          setLoadError(getWalletErrorMessage(error))
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
  }, [service, walletId])

  function beginRequest(action: Exclude<PendingAction, null>) {
    setPendingAction(action)
    setRequestError(null)
    setSuccess(null)
  }

  async function handleMetadataSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!walletId || !wallet || wallet.archivedAt) {
      return
    }

    const metadata = validateWalletMetadata({ institution, name, type })
    setMetadataErrors(metadata.valid ? {} : metadata.errors)

    if (!metadata.valid) {
      return
    }

    beginRequest('metadata')

    try {
      await service.updateMetadata(walletId, metadata.input)
      await loadWallet()
      setSuccess('Wallet details updated.')
    } catch (error) {
      setRequestError(getWalletErrorMessage(error))
    } finally {
      setPendingAction(null)
    }
  }

  async function handleOpeningSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!walletId || !wallet || wallet.archivedAt) {
      return
    }

    const money = parseMoneyInput(openingBalance)
    setOpeningError(money.valid ? null : money.message)

    if (!money.valid) {
      return
    }

    beginRequest('opening')

    try {
      await service.updateOpeningBalance(walletId, money.databaseValue)
      await loadWallet()
      setSuccess('Opening balance updated.')
    } catch (error) {
      setRequestError(getWalletErrorMessage(error))
    } finally {
      setPendingAction(null)
    }
  }

  async function handleArchive() {
    if (!walletId || !wallet || wallet.archivedAt) {
      return
    }

    beginRequest('archive')

    try {
      await service.archiveWallet(walletId)
      setConfirmArchive(false)
      await loadWallet()
      setSuccess('Wallet archived. Its ledger and balance are preserved.')
    } catch (error) {
      setRequestError(getWalletErrorMessage(error))
    } finally {
      setPendingAction(null)
    }
  }

  async function handleRestore() {
    if (!walletId || !wallet?.archivedAt) {
      return
    }

    beginRequest('restore')

    try {
      await service.restoreWallet(walletId)
      await loadWallet()
      setSuccess('Wallet restored to the active list.')
    } catch (error) {
      setRequestError(getWalletErrorMessage(error))
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
        Loading wallet…
      </div>
    )
  }

  if (loadError) {
    return (
      <section className="mx-auto w-full max-w-3xl px-4 py-12 sm:px-6">
        <h1 className="text-2xl font-bold text-slate-950">
          Wallet unavailable
        </h1>
        <p className="mt-3 text-rose-700" role="alert">
          {loadError}
        </p>
        <button
          className="mt-5 rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold"
          onClick={() => void loadWallet()}
          type="button"
        >
          Try again
        </button>
      </section>
    )
  }

  if (notFound || !wallet) {
    return (
      <section className="mx-auto w-full max-w-3xl px-4 py-12 sm:px-6">
        <h1 className="text-2xl font-bold text-slate-950">
          Wallet unavailable
        </h1>
        <p className="mt-3 leading-7 text-slate-600">
          This wallet does not exist or is not available to your account.
        </p>
        <Link
          className="text-brand-700 mt-6 inline-block font-semibold"
          to="/app/wallets"
        >
          Return to wallets
        </Link>
      </section>
    )
  }

  const archived = Boolean(wallet.archivedAt)
  const pending = pendingAction !== null

  return (
    <section className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
      <Link className="text-brand-700 text-sm font-semibold" to="/app/wallets">
        ← Back to wallets
      </Link>

      <div className="mt-5 flex flex-col gap-5 rounded-3xl bg-slate-950 p-6 text-white sm:flex-row sm:items-end sm:justify-between sm:p-8">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-sm font-semibold text-teal-300">
              {getWalletTypeLabel(wallet.type)}
            </p>
            {archived ? (
              <span className="rounded-full bg-white/10 px-2.5 py-1 text-xs font-semibold">
                Archived
              </span>
            ) : null}
          </div>
          <h1 className="mt-2 text-3xl font-bold tracking-tight">
            {wallet.name}
          </h1>
          {wallet.institution ? (
            <p className="mt-2 text-sm text-slate-300">{wallet.institution}</p>
          ) : null}
        </div>
        <div className="sm:text-right">
          <p className="text-xs font-semibold tracking-wide text-slate-400 uppercase">
            Calculated balance
          </p>
          <p className="mt-2 text-2xl font-bold">
            {formatMoney(wallet.balance)}
          </p>
        </div>
      </div>

      {archived ? (
        <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm leading-6 text-amber-900">
          Restore this wallet before editing its details or opening balance. Its
          ledger remains intact while archived.
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

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <form
          className="space-y-5 rounded-2xl border border-slate-200 bg-white p-6"
          noValidate
          onSubmit={(event) => void handleMetadataSubmit(event)}
        >
          <h2 className="text-lg font-semibold text-slate-950">
            Wallet details
          </h2>
          <WalletMetadataFields
            disabled={archived || pending}
            errors={metadataErrors}
            institution={institution}
            name={name}
            onInstitutionChange={setInstitution}
            onNameChange={setName}
            onTypeChange={setType}
            prefix="edit-wallet"
            type={type}
          />
          <button
            className="bg-brand-700 hover:bg-brand-800 min-h-11 w-full rounded-xl px-4 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
            disabled={archived || pending}
            type="submit"
          >
            {pendingAction === 'metadata' ? 'Saving details…' : 'Save details'}
          </button>
        </form>

        <form
          className="rounded-2xl border border-slate-200 bg-white p-6"
          noValidate
          onSubmit={(event) => void handleOpeningSubmit(event)}
        >
          <h2 className="text-lg font-semibold text-slate-950">
            Opening balance
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Established{' '}
            {occurredAtFormatter.format(new Date(wallet.openingOccurredAt))}
          </p>
          <label
            className="mt-5 block text-sm font-semibold text-slate-800"
            htmlFor="edit-opening-balance"
          >
            Whole Rupiah amount
          </label>
          <input
            aria-describedby={openingError ? 'edit-opening-error' : undefined}
            aria-invalid={Boolean(openingError)}
            className="mt-2 w-full rounded-xl border border-slate-300 px-3.5 py-3 text-slate-950 shadow-sm disabled:bg-slate-100"
            disabled={archived || pending}
            id="edit-opening-balance"
            inputMode="numeric"
            onChange={(event) => setOpeningBalance(event.target.value)}
            value={openingBalance}
          />
          {openingError ? (
            <p className="mt-2 text-sm text-rose-700" id="edit-opening-error">
              {openingError}
            </p>
          ) : null}
          <button
            className="mt-5 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={archived || pending}
            type="submit"
          >
            {pendingAction === 'opening'
              ? 'Updating balance…'
              : 'Update opening balance'}
          </button>
        </form>
      </div>

      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-slate-950">
          Wallet lifecycle
        </h2>
        {archived ? (
          <button
            className="bg-brand-700 hover:bg-brand-800 mt-4 min-h-11 rounded-xl px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
            disabled={pending}
            onClick={() => void handleRestore()}
            type="button"
          >
            {pendingAction === 'restore'
              ? 'Restoring wallet…'
              : 'Restore wallet'}
          </button>
        ) : confirmArchive ? (
          <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4">
            <p className="text-sm font-semibold text-amber-950">
              Archive this wallet?
            </p>
            <p className="mt-1 text-sm leading-6 text-amber-900">
              It will leave the active list, but its balance and ledger will be
              preserved.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <button
                className="rounded-xl bg-amber-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                disabled={pending}
                onClick={() => void handleArchive()}
                type="button"
              >
                {pendingAction === 'archive' ? 'Archiving…' : 'Confirm archive'}
              </button>
              <button
                className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold"
                disabled={pending}
                onClick={() => setConfirmArchive(false)}
                type="button"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            className="mt-4 min-h-11 rounded-xl border border-amber-300 px-4 py-2.5 text-sm font-semibold text-amber-800 hover:bg-amber-50"
            onClick={() => setConfirmArchive(true)}
            type="button"
          >
            Archive wallet
          </button>
        )}
      </div>
    </section>
  )
}
