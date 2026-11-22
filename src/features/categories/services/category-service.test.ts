import type { SupabaseClient } from '@supabase/supabase-js'
import { describe, expect, it, vi } from 'vitest'

import type { Database } from '../../../types/database'
import { createSupabaseCategoryService } from './category-service'

describe('categoryService', () => {
  it('lists active categories mapped correctly', async () => {
    const mockOrder = vi.fn().mockReturnValue({
      order: vi.fn().mockResolvedValue({
        data: [
          {
            archived_at: null,
            color: '#f97316',
            created_at: '2026-11-22T00:00:00.000Z',
            icon: 'utensils',
            id: 'cat-1',
            is_system: true,
            name: 'Makanan & Minuman',
            type: 'expense',
            updated_at: '2026-11-22T00:00:00.000Z',
            user_id: null,
          },
        ],
        error: null,
      }),
    })

    const mockIs = vi.fn().mockReturnValue({
      order: mockOrder,
    })

    const mockSelect = vi.fn().mockReturnValue({
      is: mockIs,
    })

    const mockFrom = vi.fn().mockReturnValue({
      select: mockSelect,
    })

    const client = { from: mockFrom } as unknown as SupabaseClient<Database>
    const service = createSupabaseCategoryService(client)

    const categories = await service.listCategories()
    expect(categories).toHaveLength(1)
    expect(categories[0].name).toBe('Makanan & Minuman')
    expect(categories[0].type).toBe('expense')
    expect(categories[0].isSystem).toBe(true)
  })

  it('filters by category type when provided', async () => {
    const mockEq = vi.fn().mockResolvedValue({
      data: [],
      error: null,
    })

    const mockOrder2 = vi.fn().mockReturnValue({
      eq: mockEq,
    })

    const mockOrder1 = vi.fn().mockReturnValue({
      order: mockOrder2,
    })

    const mockIs = vi.fn().mockReturnValue({
      order: mockOrder1,
    })

    const mockSelect = vi.fn().mockReturnValue({
      is: mockIs,
    })

    const mockFrom = vi.fn().mockReturnValue({
      select: mockSelect,
    })

    const client = { from: mockFrom } as unknown as SupabaseClient<Database>
    const service = createSupabaseCategoryService(client)

    await service.listCategories('income')
    expect(mockEq).toHaveBeenCalledWith('type', 'income')
  })

  it('throws error when database returns an error', async () => {
    const mockOrder = vi.fn().mockReturnValue({
      order: vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
      }),
    })

    const mockIs = vi.fn().mockReturnValue({
      order: mockOrder,
    })

    const mockSelect = vi.fn().mockReturnValue({
      is: mockIs,
    })

    const mockFrom = vi.fn().mockReturnValue({
      select: mockSelect,
    })

    const client = { from: mockFrom } as unknown as SupabaseClient<Database>
    const service = createSupabaseCategoryService(client)

    await expect(service.listCategories()).rejects.toThrow(
      /Failed to load categories/i,
    )
  })
})
