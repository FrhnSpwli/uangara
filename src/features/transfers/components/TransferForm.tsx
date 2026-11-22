import { useContext, useEffect, useState, type FormEvent } from 'react'

import { CategoryCardSelector } from '../../categories/components/CategoryCardSelector'
import { CategoryServiceContext } from '../../categories/context/category-service-context'
import type { Category } from '../../categories/types'
import { WalletCardSelector } from '../../wallets/components/WalletCardSelector'
import type { TransferWalletOption } from '../types'
import type {
  TransferFormErrors,
  TransferFormValues,
} from '../utils/validation'

interface TransferFormProps {
  categories?: Category[]
  errors: TransferFormErrors
  onChange: (values: TransferFormValues) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  pending: boolean
  submitLabel: string
  values: TransferFormValues
  wallets: TransferWalletOption[]
}

export function TransferForm({
  categories: categoriesProp,
  errors,
  onChange,
  onSubmit,
  pending,
  submitLabel,
  values,
  wallets,
}: TransferFormProps) {
  const categoryService = useContext(CategoryServiceContext)
  const [loadedCategories, setLoadedCategories] = useState<Category[]>([])

  useEffect(() => {
    let active = true
    if (categoriesProp && categoriesProp.length > 0) return
    if (categoryService) {
      void categoryService
        .listCategories('transfer')
        .then((cats) => {
          if (active) setLoadedCategories(cats)
        })
        .catch(() => {})
    }
    return () => {
      active = false
    }
  }, [categoryService, categoriesProp])

  const categories = categoriesProp ?? loadedCategories

  function update<Key extends keyof TransferFormValues>(
    key: Key,
    value: TransferFormValues[Key],
  ) {
    onChange({ ...values, [key]: value })
  }

  return (
    <form className="space-y-6" noValidate onSubmit={onSubmit}>
      {categories.length > 0 ? (
        <CategoryCardSelector
          categories={categories}
          disabled={pending}
          onChange={(catId) => update('categoryId', catId)}
          type="transfer"
          value={values.categoryId ?? null}
        />
      ) : null}
      <WalletCardSelector
        disabled={pending}
        disabledWalletIds={
          values.destinationWalletId ? [values.destinationWalletId] : []
        }
        error={errors.sourceWalletId}
        id="transfer-source"
        label="Source wallet"
        onChange={(sourceId) => update('sourceWalletId', sourceId)}
        placeholder="Choose source wallet"
        value={values.sourceWalletId}
        wallets={wallets}
      />

      <WalletCardSelector
        disabled={pending}
        disabledWalletIds={values.sourceWalletId ? [values.sourceWalletId] : []}
        error={errors.destinationWalletId}
        id="transfer-destination"
        label="Destination wallet"
        onChange={(destId) => update('destinationWalletId', destId)}
        placeholder="Choose destination wallet"
        value={values.destinationWalletId}
        wallets={wallets}
      />

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
          className="mt-2 w-full rounded-xl border border-slate-300 px-3.5 py-3 text-slate-950 shadow-sm disabled:bg-slate-100"
          disabled={pending}
          id="transfer-amount"
          inputMode="numeric"
          onChange={(event) => update('amount', event.target.value)}
          value={values.amount}
        />
        <p className="mt-2 text-sm text-slate-500" id="transfer-amount-help">
          Enter a positive whole Rupiah amount to move between wallets.
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
          <span className="font-normal text-slate-500">(optional)</span>
        </label>
        <input
          aria-describedby={
            errors.fee ? 'transfer-fee-error' : 'transfer-fee-help'
          }
          aria-invalid={Boolean(errors.fee)}
          className="mt-2 w-full rounded-xl border border-slate-300 px-3.5 py-3 text-slate-950 shadow-sm disabled:bg-slate-100"
          disabled={pending}
          id="transfer-fee"
          inputMode="numeric"
          onChange={(event) => update('fee', event.target.value)}
          value={values.fee}
        />
        <p className="mt-2 text-sm text-slate-500" id="transfer-fee-help">
          Transfer fee counts as a wealth-decreasing expense. Zero fee is valid.
        </p>
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
          className="mt-2 w-full rounded-xl border border-slate-300 px-3.5 py-3 text-slate-950 shadow-sm disabled:bg-slate-100"
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
          className="mt-2 w-full rounded-xl border border-slate-300 px-3.5 py-3 text-slate-950 shadow-sm disabled:bg-slate-100"
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
          className="mt-2 min-h-28 w-full rounded-xl border border-slate-300 px-3.5 py-3 text-slate-950 shadow-sm disabled:bg-slate-100"
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
        {pending ? 'Recording transfer…' : submitLabel}
      </button>
    </form>
  )
}
