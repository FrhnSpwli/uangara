import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { describe, expect, it } from 'vitest'

import { AppRoutes } from '../../app/router/AppRouter'
import { createAuthServiceStub, createTestSession } from '../../test/auth'
import {
  createTransactionDetail,
  createTransactionServiceStub,
  createTransactionSummary,
  createTransferSummary,
} from '../../test/transactions'
import {
  createWalletServiceStub,
  createWalletSummary,
} from '../../test/wallets'
import { AuthProvider } from '../auth/context/AuthProvider'
import { WalletServiceProvider } from '../wallets/context/WalletServiceProvider'
import type { WalletService } from '../wallets/types'
import { TransactionServiceProvider } from './context/TransactionServiceProvider'
import { SafeTransactionError } from './services/transaction-errors'
import type { TransactionService } from './types'

function renderAt(
  path: string,
  transactionService: TransactionService,
  walletService: WalletService,
) {
  const { service: authService } = createAuthServiceStub(createTestSession())

  return render(
    <AuthProvider service={authService}>
      <WalletServiceProvider service={walletService}>
        <TransactionServiceProvider service={transactionService}>
          <MemoryRouter initialEntries={[path]}>
            <AppRoutes />
          </MemoryRouter>
        </TransactionServiceProvider>
      </WalletServiceProvider>
    </AuthProvider>,
  )
}

async function fillCreateForm(
  kind: 'income' | 'expense',
  amount: string,
  description: string,
) {
  fireEvent.change(await screen.findByLabelText('Transaction type'), {
    target: { value: kind },
  })
  fireEvent.change(screen.getByLabelText('Wallet'), {
    target: { value: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' },
  })
  fireEvent.change(screen.getByLabelText('Amount'), {
    target: { value: amount },
  })
  fireEvent.change(screen.getByLabelText('Description'), {
    target: { value: description },
  })
}

describe('income and expense transaction flow', () => {
  it('shows transfers in the minimal feed without labeling principal as income or expense', async () => {
    const transactionService = createTransactionServiceStub()
    const walletService = createWalletServiceStub()
    transactionService.listTransactions.mockResolvedValue([
      createTransferSummary(),
    ])

    renderAt('/app/transactions', transactionService, walletService)

    const transfer = await screen.findByRole('link', {
      name: /Mandiri to GoPay/i,
    })
    expect(transfer).toHaveAttribute(
      'href',
      '/app/transfers/dddddddd-dddd-dddd-dddd-dddddddddddd',
    )
    expect(transfer).toHaveTextContent(/fee/i)
  })

  it('shows loading and empty states for recent transactions', async () => {
    const transactionService = createTransactionServiceStub()
    const walletService = createWalletServiceStub()
    transactionService.listTransactions.mockImplementation(
      () => new Promise(() => {}),
    )

    const view = renderAt(
      '/app/transactions',
      transactionService,
      walletService,
    )

    expect(
      await screen.findByText('Loading active transactions…'),
    ).toHaveAttribute('role', 'status')

    view.unmount()
    transactionService.listTransactions.mockResolvedValue([])
    renderAt('/app/transactions', transactionService, walletService)

    expect(
      await screen.findByRole('heading', { name: 'No active transactions' }),
    ).toBeInTheDocument()
  })

  it('keeps active and deleted transaction visibility distinct', async () => {
    const transactionService = createTransactionServiceStub()
    const walletService = createWalletServiceStub()
    const active = createTransactionSummary({ description: 'Salary' })
    const deleted = createTransactionSummary({
      deletedAt: '2026-09-02T02:00:00.000Z',
      description: 'Deleted lunch',
      id: 'dddddddd-dddd-dddd-dddd-dddddddddddd',
    })
    transactionService.listTransactions.mockImplementation((mode) =>
      Promise.resolve(mode === 'active' ? [active] : [deleted]),
    )

    renderAt('/app/transactions', transactionService, walletService)

    expect(await screen.findByText('Salary')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'deleted' }))

    expect(await screen.findByText('Deleted lunch')).toBeInTheDocument()
    expect(transactionService.listTransactions).toHaveBeenCalledWith('deleted')
  })

  it('shows a safe list error and retries the same mode', async () => {
    const transactionService = createTransactionServiceStub()
    const walletService = createWalletServiceStub()
    transactionService.listTransactions
      .mockRejectedValueOnce(new SafeTransactionError('Temporary list error.'))
      .mockResolvedValueOnce([])

    renderAt('/app/transactions', transactionService, walletService)

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Temporary list error.',
    )
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }))

    expect(
      await screen.findByRole('heading', { name: 'No active transactions' }),
    ).toBeInTheDocument()
    expect(transactionService.listTransactions).toHaveBeenLastCalledWith(
      'active',
    )
  })

  it.each([
    ['income', '500000', 'Salary'],
    ['expense', '35000', 'Groceries'],
  ] as const)(
    'creates an %s with a positive magnitude',
    async (kind, amount, description) => {
      const transactionService = createTransactionServiceStub()
      const walletService = createWalletServiceStub()
      walletService.listWallets.mockResolvedValue([createWalletSummary()])

      renderAt('/app/transactions/new', transactionService, walletService)

      await fillCreateForm(kind, amount, description)
      fireEvent.click(
        screen.getByRole('button', { name: 'Create transaction' }),
      )

      await waitFor(() => {
        expect(transactionService.createTransaction).toHaveBeenCalledWith(
          expect.objectContaining({
            amount: Number(amount),
            description,
            kind,
            walletId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
          }),
        )
      })
    },
  )

  it.each(['0', '-35000'])(
    'rejects the non-positive user amount %s',
    async (amount) => {
      const transactionService = createTransactionServiceStub()
      const walletService = createWalletServiceStub()
      walletService.listWallets.mockResolvedValue([createWalletSummary()])

      renderAt('/app/transactions/new', transactionService, walletService)

      await fillCreateForm('expense', amount, 'Invalid expense')
      fireEvent.click(
        screen.getByRole('button', { name: 'Create transaction' }),
      )

      expect(
        await screen.findByText('Enter an amount greater than zero.'),
      ).toBeInTheDocument()
      expect(transactionService.createTransaction).not.toHaveBeenCalled()
    },
  )

  it('accepts an expense larger than the displayed wallet balance', async () => {
    const transactionService = createTransactionServiceStub()
    const walletService = createWalletServiceStub()
    walletService.listWallets.mockResolvedValue([
      createWalletSummary({ balance: '20000' }),
    ])

    renderAt('/app/transactions/new', transactionService, walletService)

    await fillCreateForm('expense', '35000', 'Large expense')
    fireEvent.click(screen.getByRole('button', { name: 'Create transaction' }))

    await waitFor(() => {
      expect(transactionService.createTransaction).toHaveBeenCalledWith(
        expect.objectContaining({ amount: 35000, kind: 'expense' }),
      )
    })
  })

  it('rejects a future occurrence time before the service call', async () => {
    const transactionService = createTransactionServiceStub()
    const walletService = createWalletServiceStub()
    walletService.listWallets.mockResolvedValue([createWalletSummary()])

    renderAt('/app/transactions/new', transactionService, walletService)

    await fillCreateForm('income', '1000', 'Future income')
    fireEvent.change(screen.getByLabelText('Transaction date and time'), {
      target: { value: '2999-01-01T12:00' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Create transaction' }))

    expect(
      await screen.findByText('Transaction time cannot be in the future.'),
    ).toBeInTheDocument()
    expect(transactionService.createTransaction).not.toHaveBeenCalled()
  })

  it('requires an active wallet before creation', async () => {
    const transactionService = createTransactionServiceStub()
    const walletService = createWalletServiceStub()

    renderAt('/app/transactions/new', transactionService, walletService)

    expect(
      await screen.findByRole('heading', {
        name: 'An active wallet is required',
      }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: 'Manage wallets' }),
    ).toHaveAttribute('href', '/app/wallets')
  })

  it('edits amount, wallet, description, notes, and type atomically', async () => {
    const transactionService = createTransactionServiceStub()
    const walletService = createWalletServiceStub()
    walletService.listWallets.mockResolvedValue([
      createWalletSummary(),
      createWalletSummary({
        id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
        name: 'Second wallet',
      }),
    ])

    renderAt(
      '/app/transactions/cccccccc-cccc-cccc-cccc-cccccccccccc',
      transactionService,
      walletService,
    )

    expect(
      await screen.findByRole('heading', { name: 'Lunch' }),
    ).toBeInTheDocument()
    fireEvent.change(screen.getByLabelText('Transaction type'), {
      target: { value: 'income' },
    })
    expect(screen.getByText(/reverses the direction/i)).toBeInTheDocument()
    fireEvent.change(screen.getByLabelText('Wallet'), {
      target: { value: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb' },
    })
    fireEvent.change(screen.getByLabelText('Amount'), {
      target: { value: '50000' },
    })
    fireEvent.change(screen.getByLabelText('Description'), {
      target: { value: 'Refund' },
    })
    fireEvent.change(screen.getByLabelText(/Notes/), {
      target: { value: 'Corrected entry' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Save transaction' }))

    await waitFor(() => {
      expect(transactionService.updateTransaction).toHaveBeenCalledWith(
        'cccccccc-cccc-cccc-cccc-cccccccccccc',
        expect.objectContaining({
          amount: 50000,
          description: 'Refund',
          kind: 'income',
          notes: 'Corrected entry',
          walletId: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
        }),
      )
    })
  })

  it('keeps an existing archived wallet available for historical correction', async () => {
    const transactionService = createTransactionServiceStub()
    const walletService = createWalletServiceStub()
    transactionService.getTransaction.mockResolvedValue(
      createTransactionDetail({
        walletArchivedAt: '2026-09-02T03:00:00.000Z',
      }),
    )

    renderAt(
      '/app/transactions/cccccccc-cccc-cccc-cccc-cccccccccccc',
      transactionService,
      walletService,
    )

    expect(await screen.findByText('Archived wallet')).toBeInTheDocument()
    expect(
      screen.getByRole('option', { name: /Everyday wallet.*archived/i }),
    ).toBeInTheDocument()
    fireEvent.change(screen.getByLabelText('Description'), {
      target: { value: 'Corrected lunch' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Save transaction' }))

    await waitFor(() => {
      expect(transactionService.updateTransaction).toHaveBeenCalledWith(
        'cccccccc-cccc-cccc-cccc-cccccccccccc',
        expect.objectContaining({
          description: 'Corrected lunch',
          walletId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        }),
      )
    })
  })

  it('soft-deletes through confirmation without describing physical removal', async () => {
    const transactionService = createTransactionServiceStub()
    const walletService = createWalletServiceStub()
    transactionService.getTransaction
      .mockResolvedValueOnce(createTransactionDetail())
      .mockResolvedValue(
        createTransactionDetail({
          deletedAt: '2026-09-02T04:00:00.000Z',
        }),
      )

    renderAt(
      '/app/transactions/cccccccc-cccc-cccc-cccc-cccccccccccc',
      transactionService,
      walletService,
    )

    fireEvent.click(
      await screen.findByRole('button', { name: 'Delete transaction' }),
    )
    expect(screen.getByText('Delete this transaction?')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Confirm delete' }))

    await waitFor(() => {
      expect(transactionService.softDeleteTransaction).toHaveBeenCalledWith(
        'cccccccc-cccc-cccc-cccc-cccccccccccc',
      )
    })
    expect(
      await screen.findByRole('button', { name: 'Restore transaction' }),
    ).toBeInTheDocument()
    expect(screen.getByText(/remains stored/i)).toBeInTheDocument()
  })

  it('restores a deleted transaction using the recovery action', async () => {
    const transactionService = createTransactionServiceStub()
    const walletService = createWalletServiceStub()
    transactionService.getTransaction.mockResolvedValue(
      createTransactionDetail({
        deletedAt: '2026-09-02T04:00:00.000Z',
        walletArchivedAt: '2026-09-02T03:00:00.000Z',
      }),
    )

    renderAt(
      '/app/transactions/cccccccc-cccc-cccc-cccc-cccccccccccc',
      transactionService,
      walletService,
    )

    fireEvent.click(
      await screen.findByRole('button', { name: 'Restore transaction' }),
    )

    await waitFor(() => {
      expect(transactionService.restoreTransaction).toHaveBeenCalledWith(
        'cccccccc-cccc-cccc-cccc-cccccccccccc',
      )
    })
  })

  it('uses one unavailable state for missing or non-owned transactions', async () => {
    const transactionService = createTransactionServiceStub()
    const walletService = createWalletServiceStub()
    transactionService.getTransaction.mockResolvedValue(null)

    renderAt('/app/transactions/not-owned', transactionService, walletService)

    expect(
      await screen.findByRole('heading', { name: 'Transaction unavailable' }),
    ).toBeInTheDocument()
    expect(
      screen.getByText(/does not exist or is not available/i),
    ).toBeInTheDocument()
  })
})
