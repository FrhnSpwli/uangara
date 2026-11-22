import { createContext } from 'react'

import type { CategoryService } from '../types'

export const CategoryServiceContext = createContext<CategoryService | null>(
  null,
)
