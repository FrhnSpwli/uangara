import {
  customProviderSelection,
  getProviderPreset,
  providerLabels,
  walletProviderPresets,
} from '../config/wallet-presets'
import { walletTypes, type WalletType } from '../types'
import { getWalletTypeLabel, type WalletFormErrors } from '../utils/validation'

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

  return (
    <>
      <div>
        <label
          className="text-sm font-semibold text-slate-800"
          htmlFor={`${prefix}-type`}
        >
          Wallet type
        </label>
        <select
          aria-describedby={errors.type ? `${prefix}-type-error` : undefined}
          aria-invalid={Boolean(errors.type)}
          className={inputClassName}
          disabled={disabled}
          id={`${prefix}-type`}
          onChange={(event) => changeType(event.target.value)}
          value={type}
        >
          {walletTypes.map((walletType) => (
            <option key={walletType} value={walletType}>
              {getWalletTypeLabel(walletType)}
            </option>
          ))}
        </select>
        {errors.type ? (
          <p className="mt-2 text-sm text-rose-700" id={`${prefix}-type-error`}>
            {errors.type}
          </p>
        ) : null}
      </div>

      {presets && labels ? (
        <div>
          <label
            className="text-sm font-semibold text-slate-800"
            htmlFor={`${prefix}-provider`}
          >
            {labels.select}
          </label>
          <select
            aria-describedby={
              errors.institution ? `${prefix}-institution-error` : undefined
            }
            aria-invalid={Boolean(errors.institution)}
            className={inputClassName}
            disabled={disabled}
            id={`${prefix}-provider`}
            onChange={(event) => changeProvider(event.target.value)}
            required
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

          {providerSelection === customProviderSelection ? (
            <div className="mt-4">
              <label
                className="text-sm font-semibold text-slate-800"
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
                required
                value={institution}
              />
            </div>
          ) : null}

          {type === 'e_money' && selectedPreset ? (
            <p className="mt-2 text-sm text-slate-500">
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
          Wallet name
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
          required
          value={name}
        />
        <p className="mt-2 text-sm leading-6 text-slate-500">
          Editable so you can distinguish multiple wallets from one provider.
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
