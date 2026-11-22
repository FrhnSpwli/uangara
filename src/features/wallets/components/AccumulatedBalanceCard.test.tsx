import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'

import {
  createTransactionServiceStub,
  createTransactionSummary,
} from '../../../test/transactions'
import {
  createWalletServiceStub,
  createWalletSummary,
} from '../../../test/wallets'
import { BalancePrivacyProvider } from '../../preferences/context/BalancePrivacyProvider'
import { TransactionServiceContext } from '../../transactions/context/transaction-service-context'
import { WalletServiceContext } from '../context/wallet-service-context'
import { AccumulatedBalanceCard } from './AccumulatedBalanceCard'

describe('AccumulatedBalanceCard', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it('renders total accumulated balance and MTD recap', async () => {
    const walletService = createWalletServiceStub()
    walletService.listWallets.mockResolvedValue([
      createWalletSummary({ balance: '5000000' }),
      createWalletSummary({ balance: '2500000', id: '2' }),
    ])

    const transactionService = createTransactionServiceStub()
    transactionService.listTransactionsByDateRange.mockResolvedValue([
      createTransactionSummary({ amount: '1000000', kind: 'income' }),
      createTransactionSummary({ amount: '400000', kind: 'expense' }),
    ])

    render(
      <WalletServiceContext.Provider value={walletService}>
        <TransactionServiceContext.Provider value={transactionService}>
          <AccumulatedBalanceCard />
        </TransactionServiceContext.Provider>
      </WalletServiceContext.Provider>,
    )

    // Total balance 5.000.000 + 2.500.000 = 7.500.000
    expect(await screen.findByText(/7\.500\.000/)).toBeInTheDocument()
    expect(screen.getByText('2 Dompet Aktif')).toBeInTheDocument()

    // MTD Income: 1.000.000, MTD Expense: 400.000
    expect(screen.getByText(/\+.*1\.000\.000/)).toBeInTheDocument()
    expect(screen.getByText(/-.*400\.000/)).toBeInTheDocument()
  })

  it('masks balance and MTD recap when toggle is clicked', async () => {
    const walletService = createWalletServiceStub()
    walletService.listWallets.mockResolvedValue([
      createWalletSummary({ balance: '5000000' }),
    ])

    const transactionService = createTransactionServiceStub()
    transactionService.listTransactionsByDateRange.mockResolvedValue([
      createTransactionSummary({ amount: '1000000', kind: 'income' }),
      createTransactionSummary({ amount: '400000', kind: 'expense' }),
    ])

    render(
      <BalancePrivacyProvider>
        <WalletServiceContext.Provider value={walletService}>
          <TransactionServiceContext.Provider value={transactionService}>
            <AccumulatedBalanceCard />
          </TransactionServiceContext.Provider>
        </WalletServiceContext.Provider>
      </BalancePrivacyProvider>,
    )

    expect(await screen.findByText(/5\.000\.000/)).toBeInTheDocument()

    const toggleButton = screen.getByRole('button', {
      name: /sembunyikan saldo/i,
    })
    fireEvent.click(toggleButton)

    // Now balance should be masked
    expect(
      screen.getByRole('heading', { name: 'Rp ••••••' }),
    ).toBeInTheDocument()
    expect(screen.getAllByText('+Rp ••••••')).toHaveLength(2)
    expect(screen.getByText('-Rp ••••••')).toBeInTheDocument()
  })
})
