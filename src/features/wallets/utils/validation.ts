import {
  walletTypes,
  type WalletMetadataInput,
  type WalletType,
} from '../types'
import {
  customProviderSelection,
  providerLabels,
  walletTypeUsesProviderPreset,
} from '../config/wallet-presets'

export interface WalletFormValues {
  institution: string
  name: string
  providerSelection: string
  type: string
}

export type WalletFormErrors = Partial<
  Record<'institution' | 'name' | 'type', string>
>

export function validateWalletMetadata(
  values: WalletFormValues,
):
  | { errors: WalletFormErrors; valid: false }
  | { input: WalletMetadataInput; valid: true } {
  const errors: WalletFormErrors = {}
  const name = values.name.trim()
  const institution = values.institution.trim()
  const supportedType = walletTypes.includes(values.type as WalletType)

  if (name.length < 1 || name.length > 100) {
    errors.name = 'Wallet name must contain between 1 and 100 characters.'
  }

  if (!supportedType) {
    errors.type = 'Choose a supported wallet type.'
  }

  if (institution.length > 100) {
    errors.institution = 'Institution must contain at most 100 characters.'
  }

  if (
    supportedType &&
    walletTypeUsesProviderPreset(values.type as WalletType) &&
    institution.length === 0
  ) {
    const labels = providerLabels[values.type as WalletType]
    errors.institution =
      values.providerSelection === customProviderSelection
        ? `Enter a ${labels?.custom.toLocaleLowerCase('en-US') ?? 'custom provider'}.`
        : `Choose a ${labels?.select.toLocaleLowerCase('en-US') ?? 'provider'}.`
  }

  if (Object.keys(errors).length > 0) {
    return { errors, valid: false }
  }

  return {
    input: {
      institution: institution || null,
      name,
      type: values.type as WalletType,
    },
    valid: true,
  }
}

export function getWalletTypeLabel(type: WalletType) {
  const labels: Record<WalletType, string> = {
    bank: 'Bank',
    cash: 'Cash',
    e_money: 'E-money',
    e_wallet: 'E-wallet',
    other: 'Other',
  }

  return labels[type]
}
