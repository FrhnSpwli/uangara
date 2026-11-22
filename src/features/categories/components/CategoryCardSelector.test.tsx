import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { createCategory } from '../../../test/categories'
import { CategoryCardSelector } from './CategoryCardSelector'

describe('CategoryCardSelector', () => {
  const sampleCategories = [
    createCategory({ id: 'cat-1', name: 'Makanan & Minuman', type: 'expense' }),
    createCategory({ id: 'cat-2', name: 'Transportasi', type: 'expense' }),
    createCategory({ id: 'cat-3', name: 'Gaji & Upah', type: 'income' }),
    createCategory({ id: 'cat-4', name: 'Top Up E-Wallet', type: 'transfer' }),
  ]

  it('filters and displays only categories matching the active type', () => {
    const onChange = vi.fn()

    render(
      <CategoryCardSelector
        categories={sampleCategories}
        onChange={onChange}
        type="expense"
        value={null}
      />,
    )

    expect(
      screen.getByRole('radio', { name: /makanan & minuman/i }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('radio', { name: /transportasi/i }),
    ).toBeInTheDocument()
    expect(screen.queryByText('Gaji & Upah')).not.toBeInTheDocument()
    expect(screen.queryByText('Top Up E-Wallet')).not.toBeInTheDocument()
  })

  it('calls onChange with category id when clicked, and allows unselecting', () => {
    const onChange = vi.fn()

    const { rerender } = render(
      <CategoryCardSelector
        categories={sampleCategories}
        onChange={onChange}
        type="expense"
        value={null}
      />,
    )

    const foodTile = screen.getByRole('radio', { name: /makanan & minuman/i })
    fireEvent.click(foodTile)
    expect(onChange).toHaveBeenCalledWith('cat-1')

    // When value is already selected, clicking again toggles to null
    rerender(
      <CategoryCardSelector
        categories={sampleCategories}
        onChange={onChange}
        type="expense"
        value="cat-1"
      />,
    )

    fireEvent.click(foodTile)
    expect(onChange).toHaveBeenCalledWith(null)
  })

  it('renders "Hapus pilihan" clear button when a category is selected', () => {
    const onChange = vi.fn()

    render(
      <CategoryCardSelector
        categories={sampleCategories}
        onChange={onChange}
        type="expense"
        value="cat-1"
      />,
    )

    const clearButton = screen.getByRole('button', { name: /hapus pilihan/i })
    expect(clearButton).toBeInTheDocument()

    fireEvent.click(clearButton)
    expect(onChange).toHaveBeenCalledWith(null)
  })

  it('shows "Tujuan Transfer / Kategori" as label for transfers', () => {
    const onChange = vi.fn()

    render(
      <CategoryCardSelector
        categories={sampleCategories}
        onChange={onChange}
        type="transfer"
        value={null}
      />,
    )

    expect(screen.getByText('Tujuan Transfer / Kategori')).toBeInTheDocument()
    expect(
      screen.getByRole('radio', { name: /top up e-wallet/i }),
    ).toBeInTheDocument()
  })
})
