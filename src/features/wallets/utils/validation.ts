import {
  walletTypes,
  type WalletMetadataInput,
  type WalletType,
} from '../types'

export interface WalletFormValues {
  institution: string
  name: string
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

  if (name.length < 1 || name.length > 100) {
    errors.name = 'Wallet name must contain between 1 and 100 characters.'
  }

  if (!walletTypes.includes(values.type as WalletType)) {
    errors.type = 'Choose a supported wallet type.'
  }

  if (institution.length > 100) {
    errors.institution = 'Institution must contain at most 100 characters.'
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
    e_wallet: 'E-wallet',
    other: 'Other',
  }

  return labels[type]
}
