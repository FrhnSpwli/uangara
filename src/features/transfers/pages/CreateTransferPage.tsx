import { type FormEvent, useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router'

import { toLocalDateTimeValue } from '../../transactions/utils/validation'
import { useWalletService } from '../../wallets/context/useWalletService'
import { TransferForm } from '../components/TransferForm'
import { useTransferService } from '../context/useTransferService'
import { getTransferErrorMessage } from '../services/transfer-errors'
import type { TransferInput, TransferWalletOption } from '../types'
import {
  type TransferFormErrors,
  type TransferFormValues,
  validateTransferForm,
} from '../utils/validation'

const initialValues: TransferFormValues = {
  amount: '',
  description: '',
  destinationWalletId: '',
  fee: '0',
  notes: '',
  occurredAt: toLocalDateTimeValue(new Date()),
  sourceWalletId: '',
}

interface SubmissionAttempt {
  fingerprint: string
  key: string
}

function fingerprint(input: TransferInput) {
  return JSON.stringify(input)
}

export function CreateTransferPage() {
  const navigate = useNavigate()
  const transferService = useTransferService()
  const walletService = useWalletService()
  const [values, setValues] = useState(initialValues)
  const [wallets, setWallets] = useState<TransferWalletOption[]>([])
  const [errors, setErrors] = useState<TransferFormErrors>({})
  const [loading, setLoading] = useState(true)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
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
              id: wallet.id,
              name: wallet.name,
            })),
          )
        }
      })
      .catch(() => {
        if (active) {
          setError('Uangara could not load your active wallets.')
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
  }, [walletService])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (pending) {
      return
    }

    const result = validateTransferForm(values)
    setErrors(result.valid ? {} : result.errors)

    if (!result.valid) {
      return
    }

    const payloadFingerprint = fingerprint(result.input)
    if (
      !attempt.current ||
      attempt.current.fingerprint !== payloadFingerprint
    ) {
      attempt.current = {
        fingerprint: payloadFingerprint,
        key: crypto.randomUUID(),
      }
    }

    setPending(true)
    setError(null)

    try {
      const transferId = await transferService.createTransfer(
        result.input,
        attempt.current.key,
      )
      await navigate('/app/transfers/' + transferId)
    } catch (requestError) {
      setError(getTransferErrorMessage(requestError))
    } finally {
      setPending(false)
    }
  }

  if (loading) {
    return (
      <p className="mx-auto max-w-3xl px-4 py-10" role="status">
        Loading wallets...
      </p>
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
      <p className="text-brand-700 mt-6 text-sm font-semibold tracking-wide uppercase">
        Wallet to wallet
      </p>
      <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
        Transfer money
      </h1>
      <p className="mt-2 leading-7 text-slate-600">
        Move money between your wallets. The principal is neither income nor
        expense; an admin fee reduces wealth separately.
      </p>

      {error ? (
        <p
          className="mt-6 rounded-xl bg-rose-50 p-4 text-sm text-rose-700"
          role="alert"
        >
          {error}
        </p>
      ) : null}

      {wallets.length < 2 ? (
        <div className="mt-8 rounded-2xl border border-amber-200 bg-white p-6">
          <h2 className="font-semibold text-slate-950">
            Two active wallets are required
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Create or restore another wallet before recording a transfer.
          </p>
          <Link
            className="mt-4 inline-flex font-semibold text-teal-700"
            to="/app/wallets"
          >
            Manage wallets
          </Link>
        </div>
      ) : (
        <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
          <TransferForm
            errors={errors}
            onChange={setValues}
            onSubmit={(event) => void handleSubmit(event)}
            pending={pending}
            submitLabel="Create transfer"
            values={values}
            wallets={wallets}
          />
        </div>
      )}
    </section>
  )
}
