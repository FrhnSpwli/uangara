import { walletTypes } from '../types'
import { getWalletTypeLabel, type WalletFormErrors } from '../utils/validation'

interface WalletMetadataFieldsProps {
  disabled?: boolean
  errors: WalletFormErrors
  institution: string
  name: string
  onInstitutionChange: (value: string) => void
  onNameChange: (value: string) => void
  onTypeChange: (value: string) => void
  prefix: string
  type: string
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
  onTypeChange,
  prefix,
  type,
}: WalletMetadataFieldsProps) {
  return (
    <>
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
        {errors.name ? (
          <p className="mt-2 text-sm text-rose-700" id={`${prefix}-name-error`}>
            {errors.name}
          </p>
        ) : null}
      </div>

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
          onChange={(event) => onTypeChange(event.target.value)}
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

      <div>
        <label
          className="text-sm font-semibold text-slate-800"
          htmlFor={`${prefix}-institution`}
        >
          Institution{' '}
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
    </>
  )
}
