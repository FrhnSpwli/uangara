import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import {
  createTransactionServiceStub,
  createTransactionSummary,
  createTransferSummary,
} from '../../../test/transactions'
import { TransactionServiceContext } from '../context/transaction-service-context'
import { FinancialRecapSection } from './FinancialRecapSection'

describe('FinancialRecapSection', () => {
  it('renders periodic recap and switches tabs', async () => {
    const service = createTransactionServiceStub()
    service.listTransactionsByDateRange.mockResolvedValue([
      createTransactionSummary({
        amount: '2500000',
        categoryColor: '#10b981',
        categoryIcon: 'briefcase',
        categoryId: 'cat-inc',
        categoryName: 'Gaji Proyek',
        description: 'Gaji Proyek',
        id: 'tx-1',
        kind: 'income',
      }),
      createTransactionSummary({
        amount: '350000',
        categoryColor: '#f97316',
        categoryIcon: 'shopping-cart',
        categoryId: 'cat-exp',
        categoryName: 'Belanja Mingguan',
        description: 'Belanja Mingguan',
        id: 'tx-2',
        kind: 'expense',
      }),
      createTransferSummary({
        amount: '1000000',
        feeAmount: '2500',
        id: 'tx-3',
      }),
    ])

    render(
      <TransactionServiceContext.Provider value={service}>
        <FinancialRecapSection />
      </TransactionServiceContext.Provider>,
    )

    // Income +2.500.000, Expense -352.500
    expect(
      (await screen.findAllByText(/\+.*2\.500\.000/)).length,
    ).toBeGreaterThanOrEqual(1)
    expect(
      (await screen.findAllByText(/-.*352\.500/)).length,
    ).toBeGreaterThanOrEqual(1)

    // Default chart tab is Pengeluaran, showing Belanja Mingguan and Biaya Transfer
    expect(screen.getByText('Distribusi Kategori')).toBeInTheDocument()
    expect(screen.getByText('Belanja Mingguan')).toBeInTheDocument()
    expect(screen.getByText('Biaya Transfer')).toBeInTheDocument()

    // Switch to Pemasukan tab
    fireEvent.click(screen.getByRole('tab', { name: 'Pemasukan' }))
    expect(await screen.findByText('Gaji Proyek')).toBeInTheDocument()

    // Period switcher buttons exist
    expect(screen.getByRole('button', { name: 'Hari Ini' })).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Minggu Ini' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Bulan Ini' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Kustom' })).toBeInTheDocument()

    // Switching to Kustom displays date inputs
    fireEvent.click(screen.getByRole('button', { name: 'Kustom' }))
    expect(screen.getByLabelText('Dari:')).toBeInTheDocument()
    expect(screen.getByLabelText('Sampai:')).toBeInTheDocument()
  })
})
