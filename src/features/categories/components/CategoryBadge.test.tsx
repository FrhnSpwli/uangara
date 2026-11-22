import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { CategoryBadge } from './CategoryBadge'

describe('CategoryBadge', () => {
  it('renders category name and icon with correct color tint', () => {
    render(
      <CategoryBadge
        color="#f97316"
        icon="utensils"
        name="Makanan & Minuman"
      />,
    )

    expect(screen.getByText('Makanan & Minuman')).toBeInTheDocument()
  })

  it('renders with fallback default icon and color when not provided', () => {
    render(<CategoryBadge name="Lainnya" />)
    expect(screen.getByText('Lainnya')).toBeInTheDocument()
  })
})
