import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { describe, expect, it } from 'vitest'

import { createWalletSummary } from '../../../test/wallets'
import { WalletCard } from './WalletCard'

describe('WalletCard', () => {
  it('renders a bank wallet card with bank logo, account number, and balance', () => {
    const wallet = createWalletSummary({
      balance: '15000000',
      institution: 'BCA',
      name: '1234567890',
      type: 'bank',
    })

    render(
      <MemoryRouter>
        <WalletCard wallet={wallet} />
      </MemoryRouter>,
    )

    expect(screen.getByRole('heading', { name: 'BCA' })).toBeInTheDocument()
    expect(screen.getByText('No. Rekening')).toBeInTheDocument()
    expect(screen.getByText('1234567890')).toBeInTheDocument()
    expect(screen.getByText(/15\.000\.000/)).toBeInTheDocument()
    expect(screen.getByLabelText('BCA Logo')).toBeInTheDocument()
  })

  it('renders an e-wallet card with e-wallet logo, phone/account number, and balance', () => {
    const wallet = createWalletSummary({
      balance: '750000',
      institution: 'GoPay',
      name: '08123456789',
      type: 'e_wallet',
    })

    render(
      <MemoryRouter>
        <WalletCard wallet={wallet} />
      </MemoryRouter>,
    )

    expect(screen.getByText('GoPay')).toBeInTheDocument()
    expect(screen.getByText('No. Akun / HP')).toBeInTheDocument()
    expect(screen.getByText('08123456789')).toBeInTheDocument()
    expect(screen.getByText(/750\.000/)).toBeInTheDocument()
    expect(screen.getByLabelText('GoPay Logo')).toBeInTheDocument()
  })

  it('renders a cash wallet card with cash type icon and wallet name', () => {
    const wallet = createWalletSummary({
      balance: '350000',
      institution: null,
      name: 'Dompet Fisik',
      type: 'cash',
    })

    render(
      <MemoryRouter>
        <WalletCard wallet={wallet} />
      </MemoryRouter>,
    )

    expect(
      screen.getByRole('heading', { name: 'Dompet Fisik' }),
    ).toBeInTheDocument()
    expect(screen.getByText('Nama Dompet')).toBeInTheDocument()
    expect(screen.getByText(/350\.000/)).toBeInTheDocument()
  })

  it('shows the Archived badge when a wallet is archived', () => {
    const wallet = createWalletSummary({
      archivedAt: '2026-11-01T00:00:00.000Z',
      balance: '100000',
      name: 'Old Account',
      type: 'bank',
    })

    render(
      <MemoryRouter>
        <WalletCard wallet={wallet} />
      </MemoryRouter>,
    )

    expect(screen.getByText('Archived')).toBeInTheDocument()
  })
})
