import type { FormEvent } from 'react'

import { WalletCardSelector } from '../../wallets/components/WalletCardSelector'
import type { TransactionWalletOption } from '../types'
import type {
  TransactionFormErrors,
  TransactionFormValues,
} from '../utils/validation'

interface TransactionFormProps {
  allowTransfer?: boolean
  errors: TransactionFormErrors
  kindChanged?: boolean
  onChange: (values: TransactionFormValues) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  pending: boolean
  submitLabel: string
  values: TransactionFormValues
  wallets: TransactionWalletOption[]
}

const transactionTypeCards = [
  {
    activeBorder: 'border-rose-600 bg-rose-50/80 ring-2 ring-rose-600/20',
    activeIconBg: 'bg-rose-600 text-white',
    description: 'Expense',
    icon: (
      <svg
        aria-hidden="true"
        className="size-5"
        fill="none"
        stroke="currentColor"
        strokeWidth={2.5}
        viewBox="0 0 24 24"
      >
        <path
          d="M4.5 4.5l15 15m0 0V8.25m0 11.25H8.25"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
    id: 'expense',
    inactiveIconBg: 'bg-rose-100 text-rose-700',
    title: 'Pengeluaran',
  },
  {
    activeBorder:
      'border-emerald-600 bg-emerald-50/80 ring-2 ring-emerald-600/20',
    activeIconBg: 'bg-emerald-600 text-white',
    description: 'Income',
    icon: (
      <svg
        aria-hidden="true"
        className="size-5"
        fill="none"
        stroke="currentColor"
        strokeWidth={2.5}
        viewBox="0 0 24 24"
      >
        <path
          d="M19.5 19.5l-15-15m0 0v11.25m0-11.25h11.25"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
    id: 'income',
    inactiveIconBg: 'bg-emerald-100 text-emerald-700',
    title: 'Pemasukan',
  },
  {
    activeBorder: 'border-blue-600 bg-blue-50/80 ring-2 ring-blue-600/20',
    activeIconBg: 'bg-blue-600 text-white',
    description: 'Transfer',
    icon: (
      <svg
        aria-hidden="true"
        className="size-5"
        fill="none"
        stroke="currentColor"
        strokeWidth={2.2}
        viewBox="0 0 24 24"
      >
        <path
          d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
    id: 'transfer',
    inactiveIconBg: 'bg-blue-100 text-blue-700',
    title: 'Transfer',
  },
] as const

export function TransactionForm({
  allowTransfer = true,
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

  function handleKindChange(nextKind: string) {
    const updated: TransactionFormValues = { ...values, kind: nextKind }
    if (nextKind === 'transfer') {
      if (!updated.sourceWalletId && updated.walletId) {
        updated.sourceWalletId = updated.walletId
      }
      if (
        updated.destinationWalletId &&
        updated.destinationWalletId ===
          (updated.sourceWalletId || updated.walletId)
      ) {
        updated.destinationWalletId = ''
      }
    } else {
      if (!updated.walletId && updated.sourceWalletId) {
        updated.walletId = updated.sourceWalletId
      }
    }
    onChange(updated)
  }

  const visibleKinds = allowTransfer
    ? transactionTypeCards
    : transactionTypeCards.filter((card) => card.id !== 'transfer')

  const isTransfer = values.kind === 'transfer'

  return (
    <form className="space-y-6" noValidate onSubmit={onSubmit}>
      {/* Transaction Type Card Selector */}
      <div>
        <label
          className="text-sm font-semibold text-slate-800"
          htmlFor="transaction-kind"
        >
          Transaction type
        </label>

        {/* Hidden select for accessibility & test automation */}
        <select
          aria-describedby={
            errors.kind
              ? 'transaction-kind-error'
              : kindChanged
                ? 'transaction-kind-change'
                : undefined
          }
          aria-invalid={Boolean(errors.kind)}
          className="sr-only"
          disabled={pending}
          id="transaction-kind"
          onChange={(event) => handleKindChange(event.target.value)}
          tabIndex={-1}
          value={values.kind}
        >
          <option value="expense">Expense</option>
          <option value="income">Income</option>
          {allowTransfer ? <option value="transfer">Transfer</option> : null}
        </select>

        <div
          className={`mt-2 grid grid-cols-${visibleKinds.length} gap-2.5 sm:gap-3`}
        >
          {visibleKinds.map((card) => {
            const isSelected = values.kind === card.id
            return (
              <button
                aria-checked={isSelected}
                className={`relative flex flex-col items-center justify-center rounded-2xl border p-3.5 text-center transition-all sm:flex-row sm:items-center sm:justify-start sm:gap-3 sm:p-4 ${
                  isSelected
                    ? `${card.activeBorder} shadow-sm`
                    : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                } ${pending ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
                disabled={pending}
                key={card.id}
                onClick={() => handleKindChange(card.id)}
                role="radio"
                type="button"
              >
                <div
                  className={`flex size-10 shrink-0 items-center justify-center rounded-xl transition ${
                    isSelected ? card.activeIconBg : card.inactiveIconBg
                  }`}
                >
                  {card.icon}
                </div>
                <div className="mt-2 text-center sm:mt-0 sm:text-left">
                  <p className="text-xs font-bold text-slate-900 sm:text-sm">
                    {card.title}
                  </p>
                  <p className="text-[11px] font-medium text-slate-500">
                    {card.description}
                  </p>
                </div>
                {isSelected ? (
                  <span
                    aria-hidden="true"
                    className="absolute top-2 right-2 flex size-4 items-center justify-center rounded-full bg-slate-900 text-[10px] text-white sm:static sm:ml-auto"
                  >
                    ✓
                  </span>
                ) : null}
              </button>
            )
          })}
        </div>

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

      {/* Wallet Card Selector */}
      {isTransfer ? (
        <div className="space-y-4">
          <WalletCardSelector
            disabled={pending}
            disabledWalletIds={
              values.destinationWalletId ? [values.destinationWalletId] : []
            }
            error={errors.sourceWalletId}
            id="transfer-source"
            label="Source wallet"
            onChange={(sourceId) => {
              onChange({
                ...values,
                sourceWalletId: sourceId,
                walletId: sourceId,
              })
            }}
            placeholder="Choose source wallet"
            value={values.sourceWalletId || values.walletId}
            wallets={wallets}
          />

          <WalletCardSelector
            disabled={pending}
            disabledWalletIds={
              values.sourceWalletId || values.walletId
                ? [values.sourceWalletId || values.walletId]
                : []
            }
            error={errors.destinationWalletId}
            id="transfer-destination"
            label="Destination wallet"
            onChange={(destId) => update('destinationWalletId', destId)}
            placeholder="Choose destination wallet"
            value={values.destinationWalletId ?? ''}
            wallets={wallets}
          />

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
              placeholder="0"
              value={values.fee ?? '0'}
            />
            <p className="mt-2 text-sm text-slate-500" id="transfer-fee-help">
              Transfer fee counts as a wealth-decreasing expense. Zero fee is
              valid.
            </p>
            {errors.fee ? (
              <p className="mt-2 text-sm text-rose-700" id="transfer-fee-error">
                {errors.fee}
              </p>
            ) : null}
          </div>
        </div>
      ) : (
        <WalletCardSelector
          disabled={pending}
          error={errors.walletId}
          id="transaction-wallet"
          label="Wallet"
          onChange={(walletId) => {
            onChange({
              ...values,
              sourceWalletId: walletId,
              walletId,
            })
          }}
          placeholder="Choose a wallet"
          value={values.walletId}
          wallets={wallets}
        />
      )}

      {/* Amount Input */}
      <div>
        <label
          className="text-sm font-semibold text-slate-800"
          htmlFor="transaction-amount"
        >
          {isTransfer ? 'Transfer amount' : 'Amount'}
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
          placeholder="0"
          value={values.amount}
        />
        <p className="mt-2 text-sm text-slate-500" id="transaction-amount-help">
          {isTransfer
            ? 'Enter a positive whole Rupiah amount to move between wallets.'
            : values.kind === 'income'
              ? 'Enter a positive whole Rupiah amount. This increases your wallet balance.'
              : 'Enter a positive whole Rupiah amount. Uangara derives the ledger direction from the transaction type.'}
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

      {/* Occurrence Date/Time */}
      <div>
        <label
          className="text-sm font-semibold text-slate-800"
          htmlFor="transaction-occurred-at"
        >
          {isTransfer ? 'Transfer date and time' : 'Transaction date and time'}
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

      {/* Description */}
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
          placeholder={
            isTransfer
              ? 'e.g. Top up GoPay, transfer ke tabungan'
              : values.kind === 'income'
                ? 'e.g. Gaji bulanan, bonus'
                : 'e.g. Belanja bulanan, makan siang'
          }
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

      {/* Notes */}
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
          placeholder="Catatan tambahan bila diperlukan…"
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
        {pending
          ? isTransfer
            ? 'Creating transfer…'
            : 'Saving transaction…'
          : isTransfer
            ? 'Create transfer'
            : submitLabel}
      </button>
    </form>
  )
}
