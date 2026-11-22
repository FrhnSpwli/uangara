import { vi } from 'vitest'

import type { Category, CategoryService } from '../features/categories/types'

export function createCategory(overrides: Partial<Category> = {}): Category {
  return {
    archivedAt: null,
    color: '#f97316',
    createdAt: '2026-11-22T00:00:00.000Z',
    icon: 'utensils',
    id: 'category-1',
    isSystem: true,
    name: 'Makanan & Minuman',
    type: 'expense',
    updatedAt: '2026-11-22T00:00:00.000Z',
    userId: null,
    ...overrides,
  }
}

export function createCategoryServiceStub(): CategoryService & {
  listCategories: ReturnType<typeof vi.fn>
} {
  return {
    listCategories: vi
      .fn()
      .mockResolvedValue([
        createCategory({
          id: 'c-1',
          name: 'Makanan & Minuman',
          type: 'expense',
        }),
        createCategory({
          id: 'c-2',
          name: 'Transportasi',
          type: 'expense',
          icon: 'car',
          color: '#0ea5e9',
        }),
        createCategory({
          id: 'c-3',
          name: 'Gaji & Upah',
          type: 'income',
          icon: 'briefcase',
          color: '#10b981',
        }),
        createCategory({
          id: 'c-4',
          name: 'Top Up E-Wallet',
          type: 'transfer',
          icon: 'smartphone',
          color: '#0284c7',
        }),
      ]),
  }
}
