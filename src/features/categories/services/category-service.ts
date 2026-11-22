import type { SupabaseClient } from '@supabase/supabase-js'

import { getSupabaseClient } from '../../../lib/supabase/client'
import type { Database } from '../../../types/database'
import type { Category, CategoryService, CategoryType } from '../types'

type CategoryRow = Database['public']['Tables']['categories']['Row']

function toCategory(row: CategoryRow): Category {
  return {
    archivedAt: row.archived_at,
    color: row.color,
    createdAt: row.created_at,
    icon: row.icon,
    id: row.id,
    isSystem: row.is_system,
    name: row.name,
    type: row.type as CategoryType,
    updatedAt: row.updated_at,
    userId: row.user_id,
  }
}

export function createSupabaseCategoryService(
  client: SupabaseClient<Database> = getSupabaseClient(),
): CategoryService {
  return {
    async listCategories(type?: CategoryType): Promise<Category[]> {
      let query = client
        .from('categories')
        .select('*')
        .is('archived_at', null)
        .order('is_system', { ascending: false })
        .order('name', { ascending: true })

      if (type) {
        query = query.eq('type', type)
      }

      const { data, error } = await query

      if (error) {
        throw new Error(
          'Failed to load categories. Please check your connection and try again.',
        )
      }

      return (data ?? []).map(toCategory)
    },
  }
}
