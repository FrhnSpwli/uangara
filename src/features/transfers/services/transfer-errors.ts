export class SafeTransferError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'SafeTransferError'
  }
}

export function getTransferErrorMessage(error: unknown) {
  return error instanceof SafeTransferError
    ? error.message
    : 'Uangara could not complete that transfer request. Please try again.'
}
