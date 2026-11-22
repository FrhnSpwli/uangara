import { CategoryIcon } from './CategoryIcon'

interface CategoryBadgeProps {
  className?: string
  color?: string | null
  icon?: string | null
  name: string
}

export function CategoryBadge({
  className = '',
  color = '#64748b',
  icon = 'folder',
  name,
}: CategoryBadgeProps) {
  const activeColor = color || '#64748b'
  const activeIcon = icon || 'folder'

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-lg px-2 py-0.5 text-xs font-medium ${className}`}
      style={{
        backgroundColor: `${activeColor}15`,
        color: activeColor,
      }}
    >
      <CategoryIcon className="size-3.5 shrink-0" name={activeIcon} />
      <span className="truncate">{name}</span>
    </span>
  )
}
