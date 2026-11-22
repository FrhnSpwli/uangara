import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import {
  createTransactionServiceStub,
  createTransactionSummary,
} from '../../../test/transactions'
import {
  createWalletServiceStub,
  createWalletSummary,
} from '../../../test/wallets'
import { TransactionServiceContext } from '../../transactions/context/transaction-service-context'
import { WalletServiceContext } from '../context/wallet-service-context'
import { AccumulatedBalanceCard } from './AccumulatedBalanceCard'

describe('AccumulatedBalanceCard', () => {
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
})
