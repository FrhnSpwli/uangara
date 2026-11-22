import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { CategoryDonutChart } from './CategoryDonutChart'

describe('CategoryDonutChart', () => {
  it('renders empty state when items are empty or total is 0', () => {
    render(
      <CategoryDonutChart
        items={[]}
        kind="expense"
        totalAmount="0"
        totalCount={0}
      />,
    )

    expect(
      screen.getByText(/Belum ada pengeluaran pada periode ini/i),
    ).toBeInTheDocument()
    expect(screen.getByText('0 Transaksi')).toBeInTheDocument()
  })

  it('renders donut segments and category breakdown items for expense', () => {
    const items = [
      {
        amount: '68000',
        color: '#f97316',
        count: 1,
        icon: 'utensils',
        id: 'cat-1',
        name: 'Makanan & Minuman',
        percentage: 100,
      },
    ]

    render(
      <CategoryDonutChart
        items={items}
        kind="expense"
        totalAmount="68000"
        totalCount={1}
      />,
    )

    expect(screen.getByText('Makanan & Minuman')).toBeInTheDocument()
    expect(screen.getByText('100%')).toBeInTheDocument()
    expect(screen.getByText('1 transaksi')).toBeInTheDocument()
    expect(screen.getByText('1 Transaksi')).toBeInTheDocument()
    expect(screen.getByText('Total Pengeluaran')).toBeInTheDocument()
  })

  it('renders income donut chart with positive total and income labels', () => {
    const items = [
      {
        amount: '5000000',
        color: '#10b981',
        count: 1,
        icon: 'briefcase',
        id: 'cat-2',
        name: 'Gaji & Upah',
        percentage: 100,
      },
    ]

    render(
      <CategoryDonutChart
        items={items}
        kind="income"
        totalAmount="5000000"
        totalCount={1}
      />,
    )

    expect(screen.getByText('Gaji & Upah')).toBeInTheDocument()
    expect(screen.getByText('Total Pemasukan')).toBeInTheDocument()
  })
})
