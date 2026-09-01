import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { describe, expect, it } from 'vitest'

import { AppRoutes } from '../../app/router/AppRouter'
import { createAuthServiceStub, createTestSession } from '../../test/auth'
import {
  createWalletDetail,
  createWalletServiceStub,
  createWalletSummary,
} from '../../test/wallets'
import { AuthProvider } from '../auth/context/AuthProvider'
import { WalletServiceProvider } from './context/WalletServiceProvider'
import type { WalletService } from './types'

function renderAt(path: string, walletService: WalletService) {
  const { service: authService } = createAuthServiceStub(createTestSession())

  return render(
    <AuthProvider service={authService}>
      <WalletServiceProvider service={walletService}>
        <MemoryRouter initialEntries={[path]}>
          <AppRoutes />
        </MemoryRouter>
      </WalletServiceProvider>
    </AuthProvider>,
  )
}

describe('wallet management flow', () => {
  it('shows a loading state while active wallets are requested', async () => {
    const service = createWalletServiceStub()
    service.listWallets.mockImplementation(() => new Promise(() => {}))

    renderAt('/app/wallets', service)

    expect(await screen.findByText('Loading active wallets…')).toHaveAttribute(
      'role',
      'status',
    )
  })

  it('shows a meaningful empty active-wallet state', async () => {
    const service = createWalletServiceStub()

    renderAt('/app/wallets', service)

    expect(
      await screen.findByRole('heading', { name: 'No active wallets' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Add wallet' })).toHaveAttribute(
      'href',
      '/app/wallets/new',
    )
  })

  it('keeps active and archived wallet presentation distinct', async () => {
    const service = createWalletServiceStub()
    const active = createWalletSummary({ name: 'Active cash' })
    const archived = createWalletSummary({
      archivedAt: '2026-09-01T01:00:00.000Z',
      id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
      name: 'Archived cash',
    })
    service.listWallets.mockImplementation((mode) =>
      Promise.resolve(mode === 'active' ? [active] : [archived]),
    )

    renderAt('/app/wallets', service)

    expect(await screen.findByText('Active cash')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /archived/i }))

    expect(await screen.findByText('Archived cash')).toBeInTheDocument()
    expect(
      screen.getByText('Archived', { selector: 'span' }),
    ).toBeInTheDocument()
    expect(service.listWallets).toHaveBeenCalledWith('archived')
  })

  it('creates a wallet with the default zero opening balance', async () => {
    const service = createWalletServiceStub()

    renderAt('/app/wallets/new', service)

    fireEvent.change(await screen.findByLabelText('Wallet name'), {
      target: { value: 'Cash wallet' },
    })
    fireEvent.change(screen.getByLabelText('Wallet type'), {
      target: { value: 'cash' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Create wallet' }))

    await waitFor(() => {
      expect(service.createWallet).toHaveBeenCalledWith({
        institution: null,
        name: 'Cash wallet',
        openingBalance: 0,
        type: 'cash',
      })
    })
  })

  it('accepts a negative opening balance without floating-point coercion', async () => {
    const service = createWalletServiceStub()

    renderAt('/app/wallets/new', service)

    fireEvent.change(await screen.findByLabelText('Wallet name'), {
      target: { value: 'Adjustment wallet' },
    })
    fireEvent.change(screen.getByLabelText('Opening balance'), {
      target: { value: '-50000' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Create wallet' }))

    await waitFor(() => {
      expect(service.createWallet).toHaveBeenCalledWith(
        expect.objectContaining({ openingBalance: -50000 }),
      )
    })
  })

  it('rejects a fractional opening amount before the service call', async () => {
    const service = createWalletServiceStub()

    renderAt('/app/wallets/new', service)

    fireEvent.change(await screen.findByLabelText('Wallet name'), {
      target: { value: 'Invalid wallet' },
    })
    fireEvent.change(screen.getByLabelText('Opening balance'), {
      target: { value: '10.5' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Create wallet' }))

    expect(
      await screen.findByText('Enter a whole Rupiah amount without decimals.'),
    ).toBeInTheDocument()
    expect(service.createWallet).not.toHaveBeenCalled()
  })

  it('renders wallet detail and updates approved metadata', async () => {
    const service = createWalletServiceStub()

    renderAt('/app/wallets/aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', service)

    expect(
      await screen.findByRole('heading', { name: 'Everyday wallet' }),
    ).toBeInTheDocument()
    expect(screen.getByText(/calculated balance/i)).toBeInTheDocument()

    fireEvent.change(screen.getByLabelText('Wallet name'), {
      target: { value: 'Updated wallet' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Save details' }))

    await waitFor(() => {
      expect(service.updateMetadata).toHaveBeenCalledWith(
        'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        expect.objectContaining({ name: 'Updated wallet' }),
      )
    })
  })

  it('updates the opening balance through the dedicated boundary', async () => {
    const service = createWalletServiceStub()

    renderAt('/app/wallets/aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', service)

    fireEvent.change(await screen.findByLabelText('Whole Rupiah amount'), {
      target: { value: '0' },
    })
    fireEvent.click(
      screen.getByRole('button', { name: 'Update opening balance' }),
    )

    await waitFor(() => {
      expect(service.updateOpeningBalance).toHaveBeenCalledWith(
        'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        0,
      )
    })
  })

  it('requires confirmation and archives without deleting the wallet', async () => {
    const service = createWalletServiceStub()
    service.getWallet
      .mockResolvedValueOnce(createWalletDetail())
      .mockResolvedValue(
        createWalletDetail({ archivedAt: '2026-09-01T01:00:00.000Z' }),
      )

    renderAt('/app/wallets/aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', service)

    fireEvent.click(
      await screen.findByRole('button', { name: 'Archive wallet' }),
    )
    expect(screen.getByText('Archive this wallet?')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Confirm archive' }))

    await waitFor(() => {
      expect(service.archiveWallet).toHaveBeenCalledWith(
        'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      )
    })
    expect(
      await screen.findByRole('button', { name: 'Restore wallet' }),
    ).toBeInTheDocument()
  })

  it('restores an archived wallet', async () => {
    const service = createWalletServiceStub()
    service.getWallet.mockResolvedValue(
      createWalletDetail({ archivedAt: '2026-09-01T01:00:00.000Z' }),
    )

    renderAt('/app/wallets/aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', service)

    fireEvent.click(
      await screen.findByRole('button', { name: 'Restore wallet' }),
    )

    await waitFor(() => {
      expect(service.restoreWallet).toHaveBeenCalledWith(
        'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      )
    })
  })

  it('uses one safe unavailable state for missing or non-owned wallets', async () => {
    const service = createWalletServiceStub()
    service.getWallet.mockResolvedValue(null)

    renderAt('/app/wallets/not-owned', service)

    expect(
      await screen.findByRole('heading', { name: 'Wallet unavailable' }),
    ).toBeInTheDocument()
    expect(
      screen.getByText(/does not exist or is not available/i),
    ).toBeInTheDocument()
  })
})
