import { useId, useMemo, useState } from 'react'

import type { WalletType } from '../types'
import { formatMoney } from '../utils/money'
import { WalletBrandLogo } from './WalletBrandLogo'
import { WalletTypeIcon } from './WalletTypeIcon'

export interface WalletCardSelectorOption {
  archivedAt?: string | null
  balance?: string
  id: string
  institution?: string | null
  name: string
  type?: WalletType
}

interface WalletCardSelectorProps {
  disabled?: boolean
  error?: string
  id?: string
  label: string
  maxVisible?: number
  onChange: (walletId: string) => void
  placeholder?: string
  value: string
  wallets: readonly WalletCardSelectorOption[]
}

export function WalletCardSelector({
  disabled = false,
  error,
  id: providedId,
  label,
  maxVisible = 5,
  onChange,
  placeholder = 'Choose a wallet',
  value,
  wallets,
}: WalletCardSelectorProps) {
  const generatedId = useId()
  const selectId = providedId || generatedId
  const [expanded, setExpanded] = useState(false)
  const [search, setSearch] = useState('')

  // Determine visible wallets when collapsed
  const visibleWallets = useMemo(() => {
    if (expanded || wallets.length <= maxVisible) {
      if (!search.trim()) {
        return wallets
      }
      const q = search.toLowerCase()
      return wallets.filter(
        (w) =>
          w.name.toLowerCase().includes(q) ||
          (w.institution ?? '').toLowerCase().includes(q),
      )
    }

    // When collapsed (> maxVisible):
    // Show (maxVisible - 1) cards, reserving 1 slot for "Lainnya" toggle card
    const limit = maxVisible - 1
    const selectedIndex = wallets.findIndex((w) => w.id === value)

    if (selectedIndex === -1 || selectedIndex < limit) {
      return wallets.slice(0, limit)
    }

    // If selected wallet is past the limit, keep first (limit - 1) + selected wallet
    return [...wallets.slice(0, limit - 1), wallets[selectedIndex]]
  }, [wallets, maxVisible, expanded, value, search])

  const hasMore = wallets.length > maxVisible && !expanded
  const hiddenCount = wallets.length - (maxVisible - 1)

  return (
    <div>
      <div className="flex items-center justify-between">
        <label
          className="text-sm font-semibold text-slate-800"
          htmlFor={selectId}
        >
          {label}
        </label>
        {wallets.length > 0 ? (
          <span className="text-xs text-slate-500">
            {wallets.length} dompet tersedia
          </span>
        ) : null}
      </div>

      {/* Hidden select kept strictly for accessibility, form autofill, and test queries */}
      <select
        aria-describedby={error ? `${selectId}-error` : undefined}
        aria-invalid={Boolean(error)}
        className="sr-only"
        disabled={disabled}
        id={selectId}
        onChange={(e) => onChange(e.target.value)}
        tabIndex={-1}
        value={value}
      >
        <option value="">{placeholder}</option>
        {wallets.map((w) => (
          <option key={w.id} value={w.id}>
            {w.name}
            {w.archivedAt ? ' (archived)' : ''}
          </option>
        ))}
      </select>

      {/* Search filter when expanded and more than 6 wallets */}
      {expanded && wallets.length > 6 ? (
        <div className="mt-2">
          <input
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:border-brand-600 focus:bg-white focus:outline-none"
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama dompet, bank, atau no rekening…"
            type="search"
            value={search}
          />
        </div>
      ) : null}

      {/* Visual Cards Grid */}
      {wallets.length === 0 ? (
        <div className="mt-2 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-center text-xs text-slate-500">
          Tidak ada dompet yang tersedia.
        </div>
      ) : (
        <div className="mt-2.5 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          {visibleWallets.map((wallet) => {
            const isSelected = wallet.id === value
            const walletType = wallet.type ?? 'other'

            return (
              <button
                aria-checked={isSelected}
                className={`relative flex items-center gap-3 rounded-2xl border p-3 text-left transition-all ${
                  isSelected
                    ? 'border-brand-700 bg-brand-50/70 shadow-sm ring-2 ring-brand-700/20'
                    : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                } ${disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
                disabled={disabled}
                key={wallet.id}
                onClick={() => onChange(wallet.id)}
                role="radio"
                type="button"
              >
                <WalletBrandLogo
                  className="size-10 shrink-0"
                  institution={wallet.institution ?? null}
                  name={wallet.name}
                  type={walletType}
                />

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <p className="truncate text-xs font-bold text-slate-900 sm:text-sm">
                      {wallet.institution || wallet.name}
                    </p>
                    <span className="text-slate-400">
                      <WalletTypeIcon className="size-3.5" type={walletType} />
                    </span>
                  </div>

                  <p className="truncate font-mono text-[11px] font-medium text-slate-600">
                    {wallet.type === 'bank' ? 'Rek. ' : ''}
                    {wallet.name}
                  </p>

                  {wallet.balance !== undefined ? (
                    <p className="mt-0.5 text-xs font-bold text-slate-900">
                      {formatMoney(wallet.balance)}
                    </p>
                  ) : null}
                </div>

                {isSelected ? (
                  <span
                    aria-hidden="true"
                    className="flex size-4 shrink-0 items-center justify-center rounded-full bg-brand-700 text-[10px] text-white"
                  >
                    ✓
                  </span>
                ) : null}
              </button>
            )
          })}

          {/* "Lainnya" Toggle Card when collapsed */}
          {hasMore ? (
            <button
              aria-expanded={expanded}
              className="flex items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-300 bg-slate-50/70 p-3 text-center text-xs font-semibold text-slate-700 transition hover:border-brand-400 hover:bg-brand-50/50 hover:text-brand-900"
              onClick={() => setExpanded(true)}
              type="button"
            >
              <span className="flex size-7 items-center justify-center rounded-full bg-slate-200 text-xs font-bold">
                +{hiddenCount}
              </span>
              <span>Lainnya (Lihat Semua)</span>
            </button>
          ) : null}
        </div>
      )}

      {/* Collapse button when expanded */}
      {expanded && wallets.length > maxVisible ? (
        <div className="mt-2 text-right">
          <button
            className="text-xs font-semibold text-brand-700 hover:underline"
            onClick={() => {
              setExpanded(false)
              setSearch('')
            }}
            type="button"
          >
            ↑ Tampilkan lebih sedikit
          </button>
        </div>
      ) : null}

      {error ? (
        <p className="mt-2 text-sm text-rose-700" id={`${selectId}-error`}>
          {error}
        </p>
      ) : null}
    </div>
  )
}
