import { describe, expect, it } from 'vitest'

import { getAuthCallbackError } from './auth-callback'

describe('auth callback errors', () => {
  it('returns a safe expired-link message without exposing provider details', () => {
    const result = getAuthCallbackError(
      '#error=access_denied&error_code=otp_expired&error_description=provider-detail',
    )

    expect(result).toEqual({
      code: 'otp_expired',
      message:
        'This email confirmation link is invalid or has expired. Return to sign up to request a new confirmation email.',
    })
    expect(result?.message).not.toContain('provider-detail')
  })

  it('returns a generic safe message for other callback failures', () => {
    expect(
      getAuthCallbackError(
        '#error=access_denied&error_code=unknown&error_description=sensitive-provider-detail',
      ),
    ).toEqual({
      code: 'unknown',
      message:
        'Uangara could not confirm this email address. Request a new confirmation email and try again.',
    })
  })

  it('ignores hashes that do not contain an auth error', () => {
    expect(getAuthCallbackError('')).toBeNull()
    expect(getAuthCallbackError('#access_token=not-used-here')).toBeNull()
  })
})
