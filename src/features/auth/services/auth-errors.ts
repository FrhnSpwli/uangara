export class SafeAuthError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'SafeAuthError'
  }
}

export function getAuthErrorMessage(error: unknown) {
  if (error instanceof SafeAuthError) {
    return error.message
  }

  return 'An unexpected authentication error occurred. Please try again.'
}
