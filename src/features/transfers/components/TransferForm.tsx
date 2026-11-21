import type { FormEvent } from 'react'

import type { TransferWalletOption } from '../types'
import type {
  TransferFormErrors,
  TransferFormValues,
} from '../utils/validation'

interface TransferFormProps {
  errors: TransferFormErrors
  onChange: (values: TransferFormValues) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  pending: boolean
  submitLabel: string
  values: TransferFormValues
  wallets: TransferWalletOption[]
}

const inputClass =
  'mt-2 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-3 text-slate-950 shadow-sm disabled:bg-slate-100'

export function TransferForm({
  errors,
  onChange,
  onSubmit,
  pending,
  submitLabel,
  values,
  wallets,
}: TransferFormProps) {
  function update<Key extends keyof TransferFormValues>(
    key: Key,
    value: TransferFormValues[Key],
  ) {
    onChange({ ...values, [key]: value })
  }

  function walletOptions() {
    return wallets.map((wallet) => (
      <option key={wallet.id} value={wallet.id}>
        {wallet.name}
        {wallet.archivedAt ? ' (archived)' : ''}
      </option>
    ))
  }

  return (
    <form className="space-y-5" noValidate onSubmit={onSubmit}>
      <div className="grid gap-4 sm:grid-cols-[1fr_auto_1fr] sm:items-end">
        <div>
          <label
            className="text-sm font-semibold text-slate-800"
            htmlFor="transfer-source"
          >
            Source wallet
          </label>
          <select
            aria-describedby={
              errors.sourceWalletId ? 'transfer-source-error' : undefined
            }
            aria-invalid={Boolean(errors.sourceWalletId)}
            className={inputClass}
            disabled={pending}
            id="transfer-source"
            onChange={(event) => update('sourceWalletId', event.target.value)}
            value={values.sourceWalletId}
          >
            <option value="">Choose source</option>
            {walletOptions()}
          </select>
          {errors.sourceWalletId ? (
            <p
              className="mt-2 text-sm text-rose-700"
              id="transfer-source-error"
            >
              {errors.sourceWalletId}
            </p>
          ) : null}
        </div>

        <span
          aria-hidden="true"
          className="hidden pb-3 text-xl text-slate-400 sm:block"
        >
          &rarr;
        </span>

        <div>
          <label
            className="text-sm font-semibold text-slate-800"
            htmlFor="transfer-destination"
          >
            Destination wallet
          </label>
          <select
            aria-describedby={
              errors.destinationWalletId
                ? 'transfer-destination-error'
                : undefined
            }
            aria-invalid={Boolean(errors.destinationWalletId)}
            className={inputClass}
            disabled={pending}
            id="transfer-destination"
            onChange={(event) =>
              update('destinationWalletId', event.target.value)
            }
            value={values.destinationWalletId}
          >
            <option value="">Choose destination</option>
            {walletOptions()}
          </select>
          {errors.destinationWalletId ? (
            <p
              className="mt-2 text-sm text-rose-700"
              id="transfer-destination-error"
            >
              {errors.destinationWalletId}
            </p>
          ) : null}
        </div>
      </div>

      <div>
        <label
          className="text-sm font-semibold text-slate-800"
          htmlFor="transfer-amount"
        >
          Transfer amount
        </label>
        <input
          aria-describedby={
            errors.amount ? 'transfer-amount-error' : 'transfer-amount-help'
          }
          aria-invalid={Boolean(errors.amount)}
          className={inputClass}
          disabled={pending}
          id="transfer-amount"
          inputMode="numeric"
          onChange={(event) => update('amount', event.target.value)}
          value={values.amount}
        />
        <p className="mt-2 text-sm text-slate-500" id="transfer-amount-help">
          Enter a positive whole Rupiah amount. A negative source balance is
          allowed.
        </p>
        {errors.amount ? (
          <p className="mt-2 text-sm text-rose-700" id="transfer-amount-error">
            {errors.amount}
          </p>
        ) : null}
      </div>

      <div>
        <label
          className="text-sm font-semibold text-slate-800"
          htmlFor="transfer-fee"
        >
          Admin fee{' '}
          <span className="font-normal text-slate-500">
            (optional, paid by source)
          </span>
        </label>
        <input
          aria-describedby={errors.fee ? 'transfer-fee-error' : undefined}
          aria-invalid={Boolean(errors.fee)}
          className={inputClass}
          disabled={pending}
          id="transfer-fee"
          inputMode="numeric"
          onChange={(event) => update('fee', event.target.value)}
          value={values.fee}
        />
        {errors.fee ? (
          <p className="mt-2 text-sm text-rose-700" id="transfer-fee-error">
            {errors.fee}
          </p>
        ) : null}
      </div>

      <div>
        <label
          className="text-sm font-semibold text-slate-800"
          htmlFor="transfer-occurred-at"
        >
          Transfer date and time
        </label>
        <input
          aria-describedby={
            errors.occurredAt ? 'transfer-occurred-error' : undefined
          }
          aria-invalid={Boolean(errors.occurredAt)}
          className={inputClass}
          disabled={pending}
          id="transfer-occurred-at"
          onChange={(event) => update('occurredAt', event.target.value)}
          type="datetime-local"
          value={values.occurredAt}
        />
        {errors.occurredAt ? (
          <p
            className="mt-2 text-sm text-rose-700"
            id="transfer-occurred-error"
          >
            {errors.occurredAt}
          </p>
        ) : null}
      </div>

      <div>
        <label
          className="text-sm font-semibold text-slate-800"
          htmlFor="transfer-description"
        >
          Description
        </label>
        <input
          aria-describedby={
            errors.description ? 'transfer-description-error' : undefined
          }
          aria-invalid={Boolean(errors.description)}
          autoComplete="off"
          className={inputClass}
          disabled={pending}
          id="transfer-description"
          maxLength={120}
          onChange={(event) => update('description', event.target.value)}
          value={values.description}
        />
        {errors.description ? (
          <p
            className="mt-2 text-sm text-rose-700"
            id="transfer-description-error"
          >
            {errors.description}
          </p>
        ) : null}
      </div>

      <div>
        <label
          className="text-sm font-semibold text-slate-800"
          htmlFor="transfer-notes"
        >
          Notes <span className="font-normal text-slate-500">(optional)</span>
        </label>
        <textarea
          aria-describedby={errors.notes ? 'transfer-notes-error' : undefined}
          aria-invalid={Boolean(errors.notes)}
          className={inputClass + ' min-h-28'}
          disabled={pending}
          id="transfer-notes"
          maxLength={1000}
          onChange={(event) => update('notes', event.target.value)}
          value={values.notes}
        />
        {errors.notes ? (
          <p className="mt-2 text-sm text-rose-700" id="transfer-notes-error">
            {errors.notes}
          </p>
        ) : null}
      </div>

      <button
        className="bg-brand-700 hover:bg-brand-800 min-h-11 w-full rounded-xl px-4 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
        disabled={pending}
        type="submit"
      >
        {pending ? 'Saving transfer...' : submitLabel}
      </button>
    </form>
  )
}
