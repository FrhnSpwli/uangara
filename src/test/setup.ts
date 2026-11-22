import '@testing-library/jest-dom/vitest'

import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

if (typeof window !== 'undefined') {
  const store = new Map<string, string>()
  const mockStorage: Storage = {
    clear: () => store.clear(),
    getItem: (key: string) => store.get(key) ?? null,
    key: (index: number) => Array.from(store.keys())[index] ?? null,
    get length() {
      return store.size
    },
    removeItem: (key: string) => store.delete(key),
    setItem: (key: string, val: string) => store.set(key, String(val)),
  }
  Object.defineProperty(window, 'localStorage', {
    configurable: true,
    value: mockStorage,
    writable: true,
  })
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: mockStorage,
    writable: true,
  })
}

afterEach(() => {
  cleanup()
  window.localStorage?.clear()
})
