import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { describe, expect, it } from 'vitest'

import { AppRoutes } from '../../app/router/AppRouter'
import { createAuthServiceStub, createTestSession } from '../../test/auth'
import { createTransactionServiceStub } from '../../test/transactions'
import {
  createTransferDetail,
  createTransferServiceStub,
} from '../../test/transfers'
import {
  createWalletServiceStub,
  createWalletSummary,
} from '../../test/wallets'
import { AuthProvider } from '../auth/context/AuthProvider'
import { TransactionServiceProvider } from '../transactions/context/TransactionServiceProvider'
import { TransferServiceProvider } from './context/TransferServiceProvider'
import { SafeTransferError } from './services/transfer-errors'
import type { TransferService } from './types'
import { WalletServiceProvider } from '../wallets/context/WalletServiceProvider'
import type { WalletService } from '../wallets/types'

function renderAt(
  path: string,
  transferService: TransferService,
  walletService: WalletService,
) {
  const { service: authService } = createAuthServiceStub(createTestSession())
  const transactionService = createTransactionServiceStub()

  return render(
    <AuthProvider service={authService}>
      <WalletServiceProvider service={walletService}>
        <TransactionServiceProvider service={transactionService}>
          <TransferServiceProvider service={transferService}>
            <MemoryRouter initialEntries={[path]}>
              <AppRoutes />
            </MemoryRouter>
          </TransferServiceProvider>
        </TransactionServiceProvider>
      </WalletServiceProvider>
    </AuthProvider>,
  )
}

function twoWallets() {
  return [
    createWalletSummary({
      id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      name: 'Mandiri',
    }),
    createWalletSummary({
      id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
      name: 'GoPay',
      type: 'e_wallet',
    }),
  ]
}

async function fillTransfer(amount = '500000', fee = '1000') {
  fireEvent.change(await screen.findByLabelText('Source wallet'), {
    target: { value: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' },
  })
  fireEvent.change(screen.getByLabelText('Destination wallet'), {
    target: { value: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb' },
  })
  fireEvent.change(screen.getByLabelText('Transfer amount'), {
    target: { value: amount },
  })
  fireEvent.change(screen.getByLabelText(/Admin fee/), {
    target: { value: fee },
  })
  fireEvent.change(screen.getByLabelText('Description'), {
    target: { value: 'Mandiri to GoPay' },
  })
}

describe('wallet transfer flow', () => {
  it('creates a transfer with source, destination, amount, fee, and stable request key', async () => {
    const transferService = createTransferServiceStub()
    const walletService = createWalletServiceStub()
    walletService.listWallets.mockResolvedValue(twoWallets())
    renderAt('/app/transfers/new', transferService, walletService)

    await fillTransfer()
    fireEvent.click(screen.getByRole('button', { name: 'Create transfer' }))

    await waitFor(() =>
      expect(transferService.createTransfer).toHaveBeenCalledTimes(1),
    )
    expect(transferService.createTransfer.mock.calls[0]?.[0]).toMatchObject({
      amount: 500000,
      destinationWalletId: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
      fee: 1000,
      sourceWalletId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    })
    expect(transferService.createTransfer.mock.calls[0]?.[1]).toMatch(
      /^[0-9a-f-]{36}$/i,
    )
  })

  it('reuses one idempotency key after an uncertain request failure', async () => {
    const transferService = createTransferServiceStub()
    const walletService = createWalletServiceStub()
    walletService.listWallets.mockResolvedValue(twoWallets())
    transferService.createTransfer
      .mockRejectedValueOnce(new SafeTransferError('Connection uncertain.'))
      .mockResolvedValueOnce('dddddddd-dddd-dddd-dddd-dddddddddddd')
    renderAt('/app/transfers/new', transferService, walletService)

    await fillTransfer('500000', '0')
    fireEvent.click(screen.getByRole('button', { name: 'Create transfer' }))
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Connection uncertain.',
    )
    fireEvent.click(screen.getByRole('button', { name: 'Create transfer' }))

    await waitFor(() =>
      expect(transferService.createTransfer).toHaveBeenCalledTimes(2),
    )
    expect(transferService.createTransfer.mock.calls[0]?.[1]).toBe(
      transferService.createTransfer.mock.calls[1]?.[1],
    )
  })

  it('blocks same-wallet and invalid monetary input without calling the service', async () => {
    const transferService = createTransferServiceStub()
    const walletService = createWalletServiceStub()
    walletService.listWallets.mockResolvedValue(twoWallets())
    renderAt('/app/transfers/new', transferService, walletService)

    await fillTransfer('0', '-1')
    fireEvent.change(screen.getByLabelText('Destination wallet'), {
      target: { value: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Create transfer' }))

    expect(
      await screen.findByText(/Source and destination must be different/i),
    ).toBeInTheDocument()
    expect(screen.getByText(/Amount greater than zero/i)).toBeInTheDocument()
    expect(screen.getByText(/Fee cannot be negative/i)).toBeInTheDocument()
    expect(transferService.createTransfer).not.toHaveBeenCalled()
  })

  it('loads and atomically edits every approved transfer field', async () => {
    const transferService = createTransferServiceStub()
    const walletService = createWalletServiceStub()
    walletService.listWallets.mockResolvedValue(twoWallets())
    renderAt(
      '/app/transfers/dddddddd-dddd-dddd-dddd-dddddddddddd',
      transferService,
      walletService,
    )

    expect(
      await screen.findByRole('heading', { name: 'Top up GoPay' }),
    ).toBeInTheDocument()
    fireEvent.change(screen.getByLabelText('Transfer amount'), {
      target: { value: '300000' },
    })
    fireEvent.change(screen.getByLabelText(/Admin fee/), {
      target: { value: '0' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }))

    await waitFor(() =>
      expect(transferService.updateTransfer).toHaveBeenCalledTimes(1),
    )
    expect(transferService.updateTransfer.mock.calls[0]?.[1]).toMatchObject({
      amount: 300000,
      fee: 0,
    })
  })

  it('soft-deletes through an intentional confirmation', async () => {
    const transferService = createTransferServiceStub()
    const walletService = createWalletServiceStub()
    walletService.listWallets.mockResolvedValue(twoWallets())
    renderAt(
      '/app/transfers/dddddddd-dddd-dddd-dddd-dddddddddddd',
      transferService,
      walletService,
    )

    fireEvent.click(
      await screen.findByRole('button', { name: 'Delete transfer' }),
    )
    fireEvent.click(screen.getByRole('button', { name: 'Confirm delete' }))

    await waitFor(() =>
      expect(transferService.softDeleteTransfer).toHaveBeenCalledWith(
        'dddddddd-dddd-dddd-dddd-dddddddddddd',
      ),
    )
  })

  it('restores the same deleted transfer, including archived historical wallets', async () => {
    const transferService = createTransferServiceStub()
    transferService.getTransfer.mockResolvedValue(
      createTransferDetail({
        deletedAt: '2026-09-04T12:00:00.000Z',
        sourceWalletArchivedAt: '2026-09-04T11:00:00.000Z',
      }),
    )
    const walletService = createWalletServiceStub()
    walletService.listWallets.mockResolvedValue([])
    renderAt(
      '/app/transfers/dddddddd-dddd-dddd-dddd-dddddddddddd',
      transferService,
      walletService,
    )

    fireEvent.click(
      await screen.findByRole('button', { name: 'Restore transfer' }),
    )

    await waitFor(() =>
      expect(transferService.restoreTransfer).toHaveBeenCalledWith(
        'dddddddd-dddd-dddd-dddd-dddddddddddd',
      ),
    )
  })
})
