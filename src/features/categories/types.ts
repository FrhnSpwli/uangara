export type CategoryType = 'income' | 'expense' | 'transfer'

export interface Category {
  archivedAt: string | null
  color: string
  createdAt: string
  icon: string
  id: string
  isSystem: boolean
  name: string
  type: CategoryType
  updatedAt: string
  userId: string | null
}

export interface CategoryService {
  listCategories(type?: CategoryType): Promise<Category[]>
}
