export interface AuthCallbackError {
  code: string | null
  message: string
}

export function getAuthCallbackError(hash: string): AuthCallbackError | null {
  if (!hash.startsWith('#')) {
    return null
  }

  const params = new URLSearchParams(hash.slice(1))

  if (!params.get('error')) {
    return null
  }

  const code = params.get('error_code')

  if (code === 'otp_expired') {
    return {
      code,
      message:
        'This email confirmation link is invalid or has expired. Return to sign up to request a new confirmation email.',
    }
  }

  return {
    code,
    message:
      'Uangara could not confirm this email address. Request a new confirmation email and try again.',
  }
}
