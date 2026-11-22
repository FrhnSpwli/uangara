import {
  customProviderSelection,
  getProviderPreset,
  providerLabels,
  walletProviderPresets,
} from '../config/wallet-presets'
import { walletTypes, type WalletType } from '../types'
import { getWalletTypeLabel, type WalletFormErrors } from '../utils/validation'
import { WalletBrandLogo } from './WalletBrandLogo'
import { WalletTypeIcon } from './WalletTypeIcon'

interface WalletMetadataFieldsProps {
  disabled?: boolean
  errors: WalletFormErrors
  institution: string
  name: string
  onInstitutionChange: (value: string) => void
  onNameChange: (value: string) => void
  onNameSuggestion?: (value: string) => void
  onProviderSelectionChange: (value: string) => void
  onTypeChange: (value: WalletType) => void
  prefix: string
  providerSelection: string
  type: WalletType
}

const inputClassName =
  'mt-2 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-3 text-slate-950 shadow-sm disabled:cursor-not-allowed disabled:bg-slate-100'

export function WalletMetadataFields({
  disabled = false,
  errors,
  institution,
  name,
  onInstitutionChange,
  onNameChange,
  onNameSuggestion,
  onProviderSelectionChange,
  onTypeChange,
  prefix,
  providerSelection,
  type,
}: WalletMetadataFieldsProps) {
  const presets = walletProviderPresets[type]
  const labels = providerLabels[type]
  const selectedPreset = getProviderPreset(type, providerSelection)

  function changeType(value: string) {
    const walletType = value as WalletType
    onTypeChange(walletType)
    onProviderSelectionChange('')
    onInstitutionChange('')
    onNameSuggestion?.('')
  }

  function changeProvider(value: string) {
    onProviderSelectionChange(value)

    if (value === customProviderSelection) {
      onInstitutionChange('')
      onNameSuggestion?.('')
      return
    }

    const preset = getProviderPreset(type, value)
    onInstitutionChange(preset?.institution ?? '')
    onNameSuggestion?.(preset?.suggestedName ?? '')
  }

  const nameConfig = (() => {
    switch (type) {
      case 'bank':
        return {
          help: 'Enter your bank account number.',
          label: 'Account number',
          placeholder: 'e.g. 1234567890',
        }
      case 'e_wallet':
        return {
          help: 'Enter your phone number or account ID for this e-wallet.',
          label: 'Account / Phone number',
          placeholder: 'e.g. 08123456789',
        }
      case 'e_money':
        return {
          help: 'Enter your electronic money card number or card label.',
          label: 'Card number / Label',
          placeholder: 'e.g. 16-digit card number or Flazz Utama',
        }
      case 'cash':
      case 'other':
      default:
        return {
          help: 'Editable so you can distinguish multiple wallets from one provider.',
          label: 'Wallet name',
          placeholder: 'e.g. Everyday cash',
        }
    }
  })()

  return (
    <>
      <div>
        <div className="flex items-center justify-between">
          <label
            className="text-sm font-semibold text-slate-800"
            htmlFor={`${prefix}-type`}
          >
            Wallet type
          </label>
          <span className="text-xs text-slate-500">Pilih tipe</span>
        </div>

        {/* Hidden select preserved for test compatibility & accessible autofill */}
        <select
          aria-describedby={errors.type ? `${prefix}-type-error` : undefined}
          aria-invalid={Boolean(errors.type)}
          className="sr-only"
          disabled={disabled}
          id={`${prefix}-type`}
          onChange={(event) => changeType(event.target.value)}
          tabIndex={-1}
          value={type}
        >
          {walletTypes.map((walletType) => (
            <option key={walletType} value={walletType}>
              {getWalletTypeLabel(walletType)}
            </option>
          ))}
        </select>

        {/* Visual Card Selector for Wallet Types */}
        <div
          aria-label="Pilih jenis dompet"
          className="mt-2.5 grid grid-cols-2 gap-2.5 sm:grid-cols-5"
          role="radiogroup"
        >
          {walletTypes.map((walletType) => {
            const isSelected = type === walletType
            return (
              <button
                aria-checked={isSelected}
                className={`relative flex flex-col items-center justify-center gap-2 rounded-2xl border p-3.5 text-center transition-all ${
                  isSelected
                    ? 'border-brand-700 bg-brand-50/70 text-brand-900 shadow-sm ring-2 ring-brand-700/20'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                } ${disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
                disabled={disabled}
                key={walletType}
                onClick={() => changeType(walletType)}
                role="radio"
                type="button"
              >
                <div
                  className={`flex size-10 items-center justify-center rounded-xl transition ${
                    isSelected
                      ? 'bg-brand-700 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  <WalletTypeIcon className="size-5" type={walletType} />
                </div>
                <span className="text-xs font-semibold">
                  {getWalletTypeLabel(walletType)}
                </span>
                {isSelected ? (
                  <span
                    aria-hidden="true"
                    className="absolute right-2 top-2 flex size-4 items-center justify-center rounded-full bg-brand-700 text-[10px] text-white"
                  >
                    ✓
                  </span>
                ) : null}
              </button>
            )
          })}
        </div>
        {errors.type ? (
          <p className="mt-2 text-sm text-rose-700" id={`${prefix}-type-error`}>
            {errors.type}
          </p>
        ) : null}
      </div>

      {presets && labels ? (
        <div>
          <div className="flex items-center justify-between">
            <label
              className="text-sm font-semibold text-slate-800"
              htmlFor={`${prefix}-provider`}
            >
              {labels.select}
            </label>
            <span className="text-xs text-slate-500">Pilih penyedia</span>
          </div>

          {/* Hidden select preserved for test compatibility & accessible autofill */}
          <select
            aria-describedby={
              errors.institution ? `${prefix}-institution-error` : undefined
            }
            aria-invalid={Boolean(errors.institution)}
            className="sr-only"
            disabled={disabled}
            id={`${prefix}-provider`}
            onChange={(event) => changeProvider(event.target.value)}
            required
            tabIndex={-1}
            value={providerSelection}
          >
            <option value="">{labels.placeholder}</option>
            {presets.map((preset) => (
              <option key={preset.id} value={preset.id}>
                {preset.label}
              </option>
            ))}
            <option value={customProviderSelection}>{labels.other}</option>
          </select>

          {/* Visual Card Grid for Providers */}
          <div
            aria-label={`Pilih ${labels.select}`}
            className="mt-2.5 grid grid-cols-2 gap-2.5 sm:grid-cols-3"
            role="radiogroup"
          >
            {presets.map((preset) => {
              const isSelected = providerSelection === preset.id
              return (
                <button
                  aria-checked={isSelected}
                  className={`relative flex items-center gap-3 rounded-2xl border p-3 text-left transition-all ${
                    isSelected
                      ? 'border-brand-700 bg-brand-50/70 shadow-sm ring-2 ring-brand-700/20'
                      : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                  } ${disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
                  disabled={disabled}
                  key={preset.id}
                  onClick={() => changeProvider(preset.id)}
                  role="radio"
                  type="button"
                >
                  <WalletBrandLogo
                    className="size-10 shrink-0"
                    institution={preset.institution}
                    name={preset.label}
                    type={type}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-bold text-slate-900 sm:text-sm">
                      {preset.label}
                    </p>
                    <p className="truncate text-[11px] text-slate-500">
                      {preset.institution}
                    </p>
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

            {/* Other / Custom Card */}
            <button
              aria-checked={providerSelection === customProviderSelection}
              className={`relative flex items-center gap-3 rounded-2xl border p-3 text-left transition-all ${
                providerSelection === customProviderSelection
                  ? 'border-brand-700 bg-brand-50/70 shadow-sm ring-2 ring-brand-700/20'
                  : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
              } ${disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
              disabled={disabled}
              onClick={() => changeProvider(customProviderSelection)}
              role="radio"
              type="button"
            >
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600 font-bold text-base">
                +
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-bold text-slate-900 sm:text-sm">
                  {labels.other}
                </p>
                <p className="truncate text-[11px] text-slate-500">Kustom</p>
              </div>
              {providerSelection === customProviderSelection ? (
                <span
                  aria-hidden="true"
                  className="flex size-4 shrink-0 items-center justify-center rounded-full bg-brand-700 text-[10px] text-white"
                >
                  ✓
                </span>
              ) : null}
            </button>
          </div>

          {providerSelection === customProviderSelection ? (
            <div className="mt-4 rounded-2xl border border-brand-200 bg-brand-50/40 p-4">
              <label
                className="text-xs font-bold text-slate-800"
                htmlFor={`${prefix}-institution`}
              >
                {labels.custom}
              </label>
              <input
                aria-describedby={
                  errors.institution ? `${prefix}-institution-error` : undefined
                }
                aria-invalid={Boolean(errors.institution)}
                autoComplete="organization"
                className={inputClassName}
                disabled={disabled}
                id={`${prefix}-institution`}
                maxLength={100}
                onChange={(event) => onInstitutionChange(event.target.value)}
                placeholder="Masukkan nama bank/penyedia Anda"
                required
                value={institution}
              />
            </div>
          ) : null}

          {type === 'e_money' && selectedPreset ? (
            <p className="mt-2 text-xs text-slate-500">
              Provider: {selectedPreset.institution}
            </p>
          ) : null}

          {errors.institution ? (
            <p
              className="mt-2 text-sm text-rose-700"
              id={`${prefix}-institution-error`}
            >
              {errors.institution}
            </p>
          ) : null}
        </div>
      ) : null}

      {type === 'cash' ? (
        <div className="rounded-xl bg-slate-50 p-3 text-sm leading-6 text-slate-600">
          <p>Cash wallets do not need a bank or provider.</p>
          {institution ? (
            <div className="mt-3">
              <label
                className="font-semibold text-slate-800"
                htmlFor={`${prefix}-institution`}
              >
                Existing provider{' '}
                <span className="font-normal text-slate-500">(optional)</span>
              </label>
              <input
                aria-describedby={
                  errors.institution ? `${prefix}-institution-error` : undefined
                }
                aria-invalid={Boolean(errors.institution)}
                autoComplete="organization"
                className={inputClassName}
                disabled={disabled}
                id={`${prefix}-institution`}
                maxLength={100}
                onChange={(event) => onInstitutionChange(event.target.value)}
                value={institution}
              />
              {errors.institution ? (
                <p
                  className="mt-2 text-sm text-rose-700"
                  id={`${prefix}-institution-error`}
                >
                  {errors.institution}
                </p>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}

      {type === 'other' ? (
        <div>
          <label
            className="text-sm font-semibold text-slate-800"
            htmlFor={`${prefix}-institution`}
          >
            Provider{' '}
            <span className="font-normal text-slate-500">(optional)</span>
          </label>
          <input
            aria-describedby={
              errors.institution
                ? `${prefix}-institution-error`
                : `${prefix}-other-help`
            }
            aria-invalid={Boolean(errors.institution)}
            autoComplete="organization"
            className={inputClassName}
            disabled={disabled}
            id={`${prefix}-institution`}
            maxLength={100}
            onChange={(event) => onInstitutionChange(event.target.value)}
            value={institution}
          />
          <p
            className="mt-2 text-sm leading-6 text-slate-500"
            id={`${prefix}-other-help`}
          >
            Use Other only for a distinct place where money is held. Saving
            goals or spending purposes are not wallets.
          </p>
          {errors.institution ? (
            <p
              className="mt-2 text-sm text-rose-700"
              id={`${prefix}-institution-error`}
            >
              {errors.institution}
            </p>
          ) : null}
        </div>
      ) : null}

      <div>
        <label
          className="text-sm font-semibold text-slate-800"
          htmlFor={`${prefix}-name`}
        >
          {nameConfig.label}
        </label>
        <input
          aria-describedby={errors.name ? `${prefix}-name-error` : undefined}
          aria-invalid={Boolean(errors.name)}
          autoComplete="off"
          className={inputClassName}
          disabled={disabled}
          id={`${prefix}-name`}
          maxLength={100}
          onChange={(event) => onNameChange(event.target.value)}
          placeholder={nameConfig.placeholder}
          required
          value={name}
        />
        <p className="mt-2 text-sm leading-6 text-slate-500">
          {nameConfig.help}
        </p>
        {errors.name ? (
          <p className="mt-2 text-sm text-rose-700" id={`${prefix}-name-error`}>
            {errors.name}
          </p>
        ) : null}
      </div>
    </>
  )
}
