import type { PropsWithChildren } from 'react'

import type { CategoryService } from '../types'
import { CategoryServiceContext } from './category-service-context'

interface CategoryServiceProviderProps extends PropsWithChildren {
  service: CategoryService
}

export function CategoryServiceProvider({
  children,
  service,
}: CategoryServiceProviderProps) {
  return (
    <CategoryServiceContext.Provider value={service}>
      {children}
    </CategoryServiceContext.Provider>
  )
}
