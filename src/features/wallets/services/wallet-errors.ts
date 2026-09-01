export class SafeWalletError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'SafeWalletError'
  }
}

export function getWalletErrorMessage(error: unknown) {
  if (error instanceof SafeWalletError) {
    return error.message
  }

  return 'Uangara could not complete the wallet request. Please try again.'
}
