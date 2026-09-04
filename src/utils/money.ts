const maximumSafeMoney = BigInt(Number.MAX_SAFE_INTEGER)
const minimumSafeMoney = BigInt(Number.MIN_SAFE_INTEGER)
const wholeNumberPattern = /^-?(0|[1-9]\d*)$/

export type MoneyInputResult =
  | { databaseValue: number; exactValue: string; valid: true }
  | { message: string; valid: false }

export function parseMoneyInput(input: string): MoneyInputResult {
  const value = input.trim()

  if (!wholeNumberPattern.test(value)) {
    return {
      message: 'Enter a whole Rupiah amount without decimals.',
      valid: false,
    }
  }

  const exactValue = BigInt(value)

  if (exactValue < minimumSafeMoney || exactValue > maximumSafeMoney) {
    return {
      message: 'Enter an amount within the supported safe-integer range.',
      valid: false,
    }
  }

  return {
    databaseValue: Number(exactValue),
    exactValue: exactValue.toString(),
    valid: true,
  }
}

export function parsePositiveMoneyInput(input: string): MoneyInputResult {
  const parsed = parseMoneyInput(input)

  if (!parsed.valid) {
    return parsed
  }

  if (parsed.databaseValue <= 0) {
    return {
      message: 'Enter an amount greater than zero.',
      valid: false,
    }
  }

  return parsed
}

const idrFormatter = new Intl.NumberFormat('id-ID', {
  currency: 'IDR',
  maximumFractionDigits: 0,
  minimumFractionDigits: 0,
  style: 'currency',
})

export function formatMoney(value: string) {
  try {
    return idrFormatter.format(BigInt(value))
  } catch {
    return value
  }
}
