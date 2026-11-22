import { act, renderHook } from '@testing-library/react'
import type { PropsWithChildren } from 'react'
import { beforeEach, describe, expect, it } from 'vitest'

import { BalancePrivacyProvider } from './BalancePrivacyProvider'
import { useBalancePrivacy } from './useBalancePrivacy'

describe('BalancePrivacyProvider', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  const wrapper = ({ children }: PropsWithChildren) => (
    <BalancePrivacyProvider>{children}</BalancePrivacyProvider>
  )

  it('defaults to visible (isHidden: false) when localStorage is empty', () => {
    const { result } = renderHook(() => useBalancePrivacy(), { wrapper })
    expect(result.current.isHidden).toBe(false)
  })

  it('initializes from localStorage if stored as true', () => {
    window.localStorage.setItem('uangara:hide_balance', 'true')
    const { result } = renderHook(() => useBalancePrivacy(), { wrapper })
    expect(result.current.isHidden).toBe(true)
  })

  it('toggles isHidden and updates localStorage', () => {
    const { result } = renderHook(() => useBalancePrivacy(), { wrapper })
    expect(result.current.isHidden).toBe(false)

    act(() => {
      result.current.toggleHidden()
    })

    expect(result.current.isHidden).toBe(true)
    expect(window.localStorage.getItem('uangara:hide_balance')).toBe('true')

    act(() => {
      result.current.toggleHidden()
    })

    expect(result.current.isHidden).toBe(false)
    expect(window.localStorage.getItem('uangara:hide_balance')).toBe('false')
  })

  it('allows explicitly setting hidden state', () => {
    const { result } = renderHook(() => useBalancePrivacy(), { wrapper })

    act(() => {
      result.current.setHidden(true)
    })
    expect(result.current.isHidden).toBe(true)
    expect(window.localStorage.getItem('uangara:hide_balance')).toBe('true')

    act(() => {
      result.current.setHidden(false)
    })
    expect(result.current.isHidden).toBe(false)
    expect(window.localStorage.getItem('uangara:hide_balance')).toBe('false')
  })

  it('degrades gracefully without provider', () => {
    const { result } = renderHook(() => useBalancePrivacy())
    expect(result.current.isHidden).toBe(false)
    expect(() => {
      act(() => {
        result.current.toggleHidden()
      })
    }).not.toThrow()
  })
})
