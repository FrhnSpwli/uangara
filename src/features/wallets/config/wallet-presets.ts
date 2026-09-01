import type { WalletType } from '../types'

export interface WalletProviderPreset {
  id: string
  institution: string
  label: string
  suggestedName: string
}

export const customProviderSelection = '__custom_provider__'

export const walletProviderPresets: Partial<
  Record<WalletType, readonly WalletProviderPreset[]>
> = {
  bank: [
    {
      id: 'bank-mandiri',
      institution: 'Bank Mandiri',
      label: 'Bank Mandiri',
      suggestedName: 'Mandiri',
    },
    { id: 'bni', institution: 'BNI', label: 'BNI', suggestedName: 'BNI' },
    { id: 'bri', institution: 'BRI', label: 'BRI', suggestedName: 'BRI' },
    { id: 'bca', institution: 'BCA', label: 'BCA', suggestedName: 'BCA' },
    {
      id: 'bank-jago',
      institution: 'Bank Jago',
      label: 'Bank Jago',
      suggestedName: 'Jago',
    },
    {
      id: 'seabank',
      institution: 'SeaBank',
      label: 'SeaBank',
      suggestedName: 'SeaBank',
    },
    {
      id: 'cimb-niaga',
      institution: 'CIMB Niaga',
      label: 'CIMB Niaga',
      suggestedName: 'CIMB Niaga',
    },
    { id: 'btn', institution: 'BTN', label: 'BTN', suggestedName: 'BTN' },
    {
      id: 'bank-syariah-indonesia',
      institution: 'Bank Syariah Indonesia',
      label: 'Bank Syariah Indonesia',
      suggestedName: 'BSI',
    },
  ],
  e_wallet: [
    {
      id: 'gopay',
      institution: 'GoPay',
      label: 'GoPay',
      suggestedName: 'GoPay',
    },
    { id: 'dana', institution: 'DANA', label: 'DANA', suggestedName: 'DANA' },
    { id: 'ovo', institution: 'OVO', label: 'OVO', suggestedName: 'OVO' },
    {
      id: 'shopeepay',
      institution: 'ShopeePay',
      label: 'ShopeePay',
      suggestedName: 'ShopeePay',
    },
    {
      id: 'linkaja',
      institution: 'LinkAja',
      label: 'LinkAja',
      suggestedName: 'LinkAja',
    },
  ],
  e_money: [
    {
      id: 'mandiri-e-money',
      institution: 'Bank Mandiri',
      label: 'Mandiri e-Money',
      suggestedName: 'Mandiri e-Money',
    },
    {
      id: 'brizzi',
      institution: 'BRI',
      label: 'BRIZZI',
      suggestedName: 'BRIZZI',
    },
    {
      id: 'tapcash',
      institution: 'BNI',
      label: 'TapCash',
      suggestedName: 'TapCash',
    },
    {
      id: 'flazz',
      institution: 'BCA',
      label: 'Flazz',
      suggestedName: 'Flazz',
    },
  ],
}

export const providerLabels: Partial<
  Record<
    WalletType,
    {
      custom: string
      other: string
      placeholder: string
      select: string
    }
  >
> = {
  bank: {
    custom: 'Custom bank / provider',
    other: 'Other Bank',
    placeholder: 'Select bank / provider',
    select: 'Bank / Provider',
  },
  e_wallet: {
    custom: 'Custom e-wallet / provider',
    other: 'Other E-Wallet',
    placeholder: 'Select e-wallet provider',
    select: 'E-Wallet Provider',
  },
  e_money: {
    custom: 'Custom e-money / provider',
    other: 'Other E-Money',
    placeholder: 'Select e-money',
    select: 'E-Money',
  },
}

export function getProviderPreset(type: WalletType, presetId: string) {
  return walletProviderPresets[type]?.find((preset) => preset.id === presetId)
}

export function getProviderSelection(
  type: WalletType,
  institution: string | null,
  walletName: string,
) {
  if (!walletProviderPresets[type]) {
    return ''
  }

  if (!institution) {
    return ''
  }

  const normalizedName = walletName.trim().toLocaleLowerCase('id-ID')
  const preset = walletProviderPresets[type]?.find((candidate) => {
    if (candidate.institution !== institution) {
      return false
    }

    if (type !== 'e_money') {
      return true
    }

    const suggestedName = candidate.suggestedName.toLocaleLowerCase('id-ID')
    return (
      normalizedName === suggestedName ||
      normalizedName.startsWith(`${suggestedName} `)
    )
  })

  return preset?.id ?? customProviderSelection
}

export function walletTypeUsesProviderPreset(type: WalletType) {
  return Boolean(walletProviderPresets[type])
}
