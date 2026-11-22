import { useContext } from 'react'

import type { CategoryService } from '../types'
import { CategoryServiceContext } from './category-service-context'

export function useCategoryService(): CategoryService {
  const service = useContext(CategoryServiceContext)

  if (!service) {
    throw new Error(
      'useCategoryService must be used within a CategoryServiceProvider.',
    )
  }

  return service
}
