import { describe, expect, it } from 'vitest'

import { resolveSupabaseConfig } from './env'

describe('Supabase public configuration', () => {
  it('returns trimmed browser-safe configuration', () => {
    expect(
      resolveSupabaseConfig({
        VITE_SUPABASE_URL: ' https://example.supabase.co ',
        VITE_SUPABASE_PUBLISHABLE_KEY: ' sb_publishable_example ',
      }),
    ).toEqual({
      url: 'https://example.supabase.co',
      publishableKey: 'sb_publishable_example',
    })
  })

  it('reports a missing project URL clearly', () => {
    expect(() =>
      resolveSupabaseConfig({
        VITE_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_example',
      }),
    ).toThrow('VITE_SUPABASE_URL is required')
  })

  it('reports a missing publishable key clearly', () => {
    expect(() =>
      resolveSupabaseConfig({
        VITE_SUPABASE_URL: 'https://example.supabase.co',
      }),
    ).toThrow('VITE_SUPABASE_PUBLISHABLE_KEY is required')
  })
})
