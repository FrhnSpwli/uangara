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
        description: 'Gaji Proyek',
        id: 'tx-1',
        kind: 'income',
      }),
      createTransactionSummary({
        amount: '350000',
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
    expect(screen.getByText(/-.*352\.500/)).toBeInTheDocument()
    expect(screen.getByText('Gaji Proyek')).toBeInTheDocument()

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
