import { useId, useMemo } from 'react'

import type { Category, CategoryType } from '../types'
import { CategoryIcon } from './CategoryIcon'

interface CategoryCardSelectorProps {
  categories: readonly Category[]
  disabled?: boolean
  error?: string
  id?: string
  label?: string
  onChange: (categoryId: string | null) => void
  type: CategoryType
  value: string | null
}

export function CategoryCardSelector({
  categories,
  disabled = false,
  error,
  id: providedId,
  label = 'Kategori',
  onChange,
  type,
  value,
}: CategoryCardSelectorProps) {
  const generatedId = useId()
  const selectId = providedId || generatedId

  const filteredCategories = useMemo(
    () => categories.filter((c) => c.type === type),
    [categories, type],
  )

  const groupLabel = type === 'transfer' ? 'Tujuan Transfer / Kategori' : label

  return (
    <div>
      <div className="flex items-center justify-between">
        <label
          className="text-sm font-semibold text-slate-800"
          htmlFor={selectId}
          id={`${selectId}-label`}
        >
          {groupLabel}
        </label>
        {value ? (
          <button
            className="text-xs font-medium text-slate-500 hover:text-rose-600 disabled:opacity-50"
            disabled={disabled}
            onClick={() => onChange(null)}
            type="button"
          >
            Hapus pilihan
          </button>
        ) : (
          <span className="text-xs text-slate-400">Opsional</span>
        )}
      </div>

      {/* Hidden select for accessibility & form automation */}
      <select
        aria-describedby={error ? `${selectId}-error` : undefined}
        aria-invalid={Boolean(error)}
        className="sr-only"
        disabled={disabled}
        id={selectId}
        onChange={(e) => onChange(e.target.value || null)}
        tabIndex={-1}
        value={value ?? ''}
      >
        <option value="">Tanpa Kategori</option>
        {filteredCategories.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>

      {/* Grid of category tiles */}
      <div
        aria-labelledby={`${selectId}-label`}
        className="mt-2.5 grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4"
        role="radiogroup"
      >
        {filteredCategories.map((cat) => {
          const isSelected = value === cat.id
          const activeColor = cat.color || '#0f766e'

          return (
            <button
              aria-checked={isSelected}
              className={`flex items-center gap-2.5 rounded-xl border p-2.5 text-left transition-all ${
                isSelected
                  ? 'border-brand-700 bg-brand-50/80 shadow-sm ring-2 ring-brand-700/20'
                  : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
              } ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
              disabled={disabled}
              key={cat.id}
              onClick={() => {
                if (!disabled) {
                  onChange(isSelected ? null : cat.id)
                }
              }}
              role="radio"
              type="button"
            >
              <span
                className="flex size-7 shrink-0 items-center justify-center rounded-lg"
                style={{
                  backgroundColor: `${activeColor}18`,
                  color: activeColor,
                }}
              >
                <CategoryIcon className="size-4" name={cat.icon} />
              </span>

              <span className="min-w-0 flex-1 truncate text-xs font-semibold text-slate-800">
                {cat.name}
              </span>

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
      </div>

      {error ? (
        <p className="mt-2 text-sm text-rose-700" id={`${selectId}-error`}>
          {error}
        </p>
      ) : null}
    </div>
  )
}
