import { type FormEvent, useState } from 'react'
import { Link, useNavigate } from 'react-router'

import { WalletMetadataFields } from '../components/WalletMetadataFields'
import { useWalletService } from '../context/useWalletService'
import { getWalletErrorMessage } from '../services/wallet-errors'
import { parseMoneyInput } from '../utils/money'
import {
  type WalletFormErrors,
  validateWalletMetadata,
} from '../utils/validation'

export function CreateWalletPage() {
  const service = useWalletService()
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [type, setType] = useState('bank')
  const [institution, setInstitution] = useState('')
  const [openingBalance, setOpeningBalance] = useState('0')
  const [errors, setErrors] = useState<WalletFormErrors>({})
  const [amountError, setAmountError] = useState<string | null>(null)
  const [requestError, setRequestError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setRequestError(null)

    const metadata = validateWalletMetadata({ institution, name, type })
    const money = parseMoneyInput(openingBalance)

    setErrors(metadata.valid ? {} : metadata.errors)
    setAmountError(money.valid ? null : money.message)

    if (!metadata.valid || !money.valid) {
      return
    }

    setPending(true)

    try {
      const walletId = await service.createWallet({
        ...metadata.input,
        openingBalance: money.databaseValue,
      })
      await navigate(`/app/wallets/${walletId}`, { replace: true })
    } catch (createError) {
      setRequestError(getWalletErrorMessage(createError))
      setPending(false)
    }
  }

  return (
    <section className="mx-auto w-full max-w-xl px-4 py-8 sm:px-6 sm:py-12">
      <Link className="text-brand-700 text-sm font-semibold" to="/app/wallets">
        ← Back to wallets
      </Link>
      <h1 className="mt-5 text-3xl font-bold tracking-tight text-slate-950">
        Add wallet
      </h1>
      <p className="mt-3 leading-7 text-slate-600">
        Create a location for your money and its opening ledger position.
      </p>

      <form
        className="mt-8 space-y-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
        noValidate
        onSubmit={(event) => {
          void handleSubmit(event)
        }}
      >
        <WalletMetadataFields
          disabled={pending}
          errors={errors}
          institution={institution}
          name={name}
          onInstitutionChange={setInstitution}
          onNameChange={setName}
          onTypeChange={setType}
          prefix="create-wallet"
          type={type}
        />

        <div>
          <label
            className="text-sm font-semibold text-slate-800"
            htmlFor="create-wallet-opening"
          >
            Opening balance
          </label>
          <input
            aria-describedby={
              amountError
                ? 'create-wallet-opening-error'
                : 'create-wallet-opening-help'
            }
            aria-invalid={Boolean(amountError)}
            className="mt-2 w-full rounded-xl border border-slate-300 px-3.5 py-3 text-slate-950 shadow-sm disabled:bg-slate-100"
            disabled={pending}
            id="create-wallet-opening"
            inputMode="numeric"
            onChange={(event) => setOpeningBalance(event.target.value)}
            value={openingBalance}
          />
          <p
            className="mt-2 text-sm text-slate-500"
            id="create-wallet-opening-help"
          >
            Whole Rupiah only. Zero and negative opening balances are valid.
          </p>
          {amountError ? (
            <p
              className="mt-2 text-sm text-rose-700"
              id="create-wallet-opening-error"
            >
              {amountError}
            </p>
          ) : null}
        </div>

        {requestError ? (
          <p className="text-sm text-rose-700" role="alert">
            {requestError}
          </p>
        ) : null}

        <button
          className="bg-brand-700 hover:bg-brand-800 min-h-11 w-full rounded-xl px-4 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
          disabled={pending}
          type="submit"
        >
          {pending ? 'Creating wallet…' : 'Create wallet'}
        </button>
      </form>
    </section>
  )
}
