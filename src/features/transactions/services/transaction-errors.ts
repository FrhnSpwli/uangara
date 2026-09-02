export class SafeTransactionError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'SafeTransactionError'
  }
}

export function getTransactionErrorMessage(error: unknown) {
  if (error instanceof SafeTransactionError) {
    return error.message
  }

  return 'Uangara could not complete the transaction request. Please try again.'
}
