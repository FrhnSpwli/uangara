import { type FormEvent, useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router'

import { useTransferService } from '../../transfers/context/useTransferService'
import { getTransferErrorMessage } from '../../transfers/services/transfer-errors'
import { useWalletService } from '../../wallets/context/useWalletService'
import { getWalletErrorMessage } from '../../wallets/services/wallet-errors'
import { TransactionForm } from '../components/TransactionForm'
import { useTransactionService } from '../context/useTransactionService'
import { getTransactionErrorMessage } from '../services/transaction-errors'
import type { TransactionWalletOption } from '../types'
import {
  toLocalDateTimeValue,
  type TransactionFormErrors,
  type TransactionFormValues,
  validateTransactionForm,
} from '../utils/validation'

interface SubmissionAttempt {
  fingerprint: string
  key: string
}

function initialValues(kind = 'expense'): TransactionFormValues {
  return {
    amount: '',
    description: '',
    destinationWalletId: '',
    fee: '0',
    kind,
    notes: '',
    occurredAt: toLocalDateTimeValue(new Date()),
    sourceWalletId: '',
    walletId: '',
  }
}

export function CreateTransactionPage() {
  const [searchParams] = useSearchParams()
  const initialKind =
    searchParams.get('type') === 'transfer' ? 'transfer' : 'expense'

  const transactionService = useTransactionService()
  const transferService = useTransferService()
  const walletService = useWalletService()
  const navigate = useNavigate()

  const [values, setValues] = useState<TransactionFormValues>(() =>
    initialValues(initialKind),
  )
  const [wallets, setWallets] = useState<TransactionWalletOption[]>([])
  const [walletsLoading, setWalletsLoading] = useState(true)
  const [walletsError, setWalletsError] = useState<string | null>(null)
  const [errors, setErrors] = useState<TransactionFormErrors>({})
  const [requestError, setRequestError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)
  const attempt = useRef<SubmissionAttempt | null>(null)

  useEffect(() => {
    let active = true

    void walletService
      .listWallets('active')
      .then((result) => {
        if (active) {
          setWallets(
            result.map((wallet) => ({
              archivedAt: wallet.archivedAt,
              balance: wallet.balance,
              id: wallet.id,
              institution: wallet.institution,
              name: wallet.name,
              type: wallet.type,
            })),
          )
        }
      })
      .catch((error: unknown) => {
        if (active) {
          setWalletsError(getWalletErrorMessage(error))
        }
      })
      .finally(() => {
        if (active) {
          setWalletsLoading(false)
        }
      })

    return () => {
      active = false
    }
  }, [walletService])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setRequestError(null)

    const result = validateTransactionForm(values)
    setErrors(result.valid ? {} : result.errors)

    if (!result.valid) {
      return
    }

    setPending(true)

    try {
      if (result.kind === 'transfer') {
        const payloadFingerprint = JSON.stringify(result.input)
        if (
          !attempt.current ||
          attempt.current.fingerprint !== payloadFingerprint
        ) {
          attempt.current = {
            fingerprint: payloadFingerprint,
            key: crypto.randomUUID(),
          }
        }
        const transferId = await transferService.createTransfer(
          result.input,
          attempt.current.key,
        )
        await navigate(`/app/transfers/${transferId}`, { replace: true })
      } else {
        const transactionId = await transactionService.createTransaction(
          result.input,
        )
        await navigate(`/app/transactions/${transactionId}`, { replace: true })
      }
    } catch (error) {
      setRequestError(
        result.kind === 'transfer'
          ? getTransferErrorMessage(error)
          : getTransactionErrorMessage(error),
      )
      setPending(false)
    }
  }

  return (
    <section className="mx-auto w-full max-w-xl px-4 py-8 sm:px-6 sm:py-12">
      <Link
        className="text-brand-700 text-sm font-semibold"
        to="/app/transactions"
      >
        ← Back to transactions
      </Link>
      <h1 className="mt-5 text-3xl font-bold tracking-tight text-slate-950">
        {values.kind === 'transfer' ? 'Add transfer' : 'Add transaction'}
      </h1>
      <p className="mt-3 leading-7 text-slate-600">
        {values.kind === 'transfer'
          ? 'Move money between two active wallets.'
          : 'Record one income or expense against an active wallet.'}
      </p>

      {walletsLoading ? (
        <div
          className="mt-8 rounded-2xl border border-slate-200 bg-white p-6"
          role="status"
        >
          Loading active wallets…
        </div>
      ) : null}

      {!walletsLoading && walletsError ? (
        <p
          className="mt-8 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700"
          role="alert"
        >
          {walletsError}
        </p>
      ) : null}

      {!walletsLoading && !walletsError && wallets.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-white p-6">
          <h2 className="font-semibold text-slate-950">
            An active wallet is required
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Create a wallet or restore an archived wallet before recording a
            transaction.
          </p>
          <Link
            className="text-brand-700 mt-4 inline-block font-semibold"
            to="/app/wallets"
          >
            Manage wallets
          </Link>
        </div>
      ) : null}

      {!walletsLoading && !walletsError && wallets.length > 0 ? (
        <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <TransactionForm
            errors={errors}
            onChange={(nextValues) => {
              setValues(nextValues)
              setErrors({})
            }}
            onSubmit={(event) => void handleSubmit(event)}
            pending={pending}
            submitLabel="Create transaction"
            values={values}
            wallets={wallets}
          />
          {requestError ? (
            <p className="mt-5 text-sm text-rose-700" role="alert">
              {requestError}
            </p>
          ) : null}
        </div>
      ) : null}
    </section>
  )
}
