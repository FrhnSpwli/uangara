import type { FormEvent } from 'react'

import type { TransactionWalletOption } from '../types'
import type {
  TransactionFormErrors,
  TransactionFormValues,
} from '../utils/validation'

interface TransactionFormProps {
  errors: TransactionFormErrors
  kindChanged?: boolean
  onChange: (values: TransactionFormValues) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  pending: boolean
  submitLabel: string
  values: TransactionFormValues
  wallets: TransactionWalletOption[]
}

export function TransactionForm({
  errors,
  kindChanged = false,
  onChange,
  onSubmit,
  pending,
  submitLabel,
  values,
  wallets,
}: TransactionFormProps) {
  function update<Key extends keyof TransactionFormValues>(
    key: Key,
    value: TransactionFormValues[Key],
  ) {
    onChange({ ...values, [key]: value })
  }

  return (
    <form className="space-y-5" noValidate onSubmit={onSubmit}>
      <div>
        <label
          className="text-sm font-semibold text-slate-800"
          htmlFor="transaction-kind"
        >
          Transaction type
        </label>
        <select
          aria-describedby={
            errors.kind
              ? 'transaction-kind-error'
              : kindChanged
                ? 'transaction-kind-change'
                : undefined
          }
          aria-invalid={Boolean(errors.kind)}
          className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-3 text-slate-950 shadow-sm disabled:bg-slate-100"
          disabled={pending}
          id="transaction-kind"
          onChange={(event) => update('kind', event.target.value)}
          value={values.kind}
        >
          <option value="income">Income</option>
          <option value="expense">Expense</option>
        </select>
        {kindChanged ? (
          <p
            className="mt-2 text-sm text-amber-700"
            id="transaction-kind-change"
          >
            Changing type reverses the direction of this wallet movement.
          </p>
        ) : null}
        {errors.kind ? (
          <p className="mt-2 text-sm text-rose-700" id="transaction-kind-error">
            {errors.kind}
          </p>
        ) : null}
      </div>

      <div>
        <label
          className="text-sm font-semibold text-slate-800"
          htmlFor="transaction-wallet"
        >
          Wallet
        </label>
        <select
          aria-describedby={
            errors.walletId ? 'transaction-wallet-error' : undefined
          }
          aria-invalid={Boolean(errors.walletId)}
          className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-3 text-slate-950 shadow-sm disabled:bg-slate-100"
          disabled={pending}
          id="transaction-wallet"
          onChange={(event) => update('walletId', event.target.value)}
          value={values.walletId}
        >
          <option value="">Choose a wallet</option>
          {wallets.map((wallet) => (
            <option key={wallet.id} value={wallet.id}>
              {wallet.name}
              {wallet.archivedAt ? ' (archived)' : ''}
            </option>
          ))}
        </select>
        {errors.walletId ? (
          <p
            className="mt-2 text-sm text-rose-700"
            id="transaction-wallet-error"
          >
            {errors.walletId}
          </p>
        ) : null}
      </div>

      <div>
        <label
          className="text-sm font-semibold text-slate-800"
          htmlFor="transaction-amount"
        >
          Amount
        </label>
        <input
          aria-describedby={
            errors.amount
              ? 'transaction-amount-error'
              : 'transaction-amount-help'
          }
          aria-invalid={Boolean(errors.amount)}
          className="mt-2 w-full rounded-xl border border-slate-300 px-3.5 py-3 text-slate-950 shadow-sm disabled:bg-slate-100"
          disabled={pending}
          id="transaction-amount"
          inputMode="numeric"
          onChange={(event) => update('amount', event.target.value)}
          value={values.amount}
        />
        <p className="mt-2 text-sm text-slate-500" id="transaction-amount-help">
          Enter a positive whole Rupiah amount. Uangara derives the ledger
          direction from the transaction type.
        </p>
        {errors.amount ? (
          <p
            className="mt-2 text-sm text-rose-700"
            id="transaction-amount-error"
          >
            {errors.amount}
          </p>
        ) : null}
      </div>

      <div>
        <label
          className="text-sm font-semibold text-slate-800"
          htmlFor="transaction-occurred-at"
        >
          Transaction date and time
        </label>
        <input
          aria-describedby={
            errors.occurredAt ? 'transaction-occurred-error' : undefined
          }
          aria-invalid={Boolean(errors.occurredAt)}
          className="mt-2 w-full rounded-xl border border-slate-300 px-3.5 py-3 text-slate-950 shadow-sm disabled:bg-slate-100"
          disabled={pending}
          id="transaction-occurred-at"
          onChange={(event) => update('occurredAt', event.target.value)}
          type="datetime-local"
          value={values.occurredAt}
        />
        {errors.occurredAt ? (
          <p
            className="mt-2 text-sm text-rose-700"
            id="transaction-occurred-error"
          >
            {errors.occurredAt}
          </p>
        ) : null}
      </div>

      <div>
        <label
          className="text-sm font-semibold text-slate-800"
          htmlFor="transaction-description"
        >
          Description
        </label>
        <input
          aria-describedby={
            errors.description ? 'transaction-description-error' : undefined
          }
          aria-invalid={Boolean(errors.description)}
          autoComplete="off"
          className="mt-2 w-full rounded-xl border border-slate-300 px-3.5 py-3 text-slate-950 shadow-sm disabled:bg-slate-100"
          disabled={pending}
          id="transaction-description"
          maxLength={120}
          onChange={(event) => update('description', event.target.value)}
          value={values.description}
        />
        {errors.description ? (
          <p
            className="mt-2 text-sm text-rose-700"
            id="transaction-description-error"
          >
            {errors.description}
          </p>
        ) : null}
      </div>

      <div>
        <label
          className="text-sm font-semibold text-slate-800"
          htmlFor="transaction-notes"
        >
          Notes <span className="font-normal text-slate-500">(optional)</span>
        </label>
        <textarea
          aria-describedby={
            errors.notes ? 'transaction-notes-error' : undefined
          }
          aria-invalid={Boolean(errors.notes)}
          className="mt-2 min-h-28 w-full rounded-xl border border-slate-300 px-3.5 py-3 text-slate-950 shadow-sm disabled:bg-slate-100"
          disabled={pending}
          id="transaction-notes"
          maxLength={1000}
          onChange={(event) => update('notes', event.target.value)}
          value={values.notes}
        />
        {errors.notes ? (
          <p
            className="mt-2 text-sm text-rose-700"
            id="transaction-notes-error"
          >
            {errors.notes}
          </p>
        ) : null}
      </div>

      <button
        className="bg-brand-700 hover:bg-brand-800 min-h-11 w-full rounded-xl px-4 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
        disabled={pending}
        type="submit"
      >
        {pending ? 'Saving transaction…' : submitLabel}
      </button>
    </form>
  )
}
