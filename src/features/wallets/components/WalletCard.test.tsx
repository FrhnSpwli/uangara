import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { createWalletSummary } from '../../../test/wallets'
import { BalancePrivacyProvider } from '../../preferences/context/BalancePrivacyProvider'
import { WalletCard } from './WalletCard'

describe('WalletCard', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })
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

  it('masks balance when privacy mode is enabled', () => {
    localStorage.setItem('uangara:hide_balance', 'true')
    const wallet = createWalletSummary({
      balance: '15000000',
      institution: 'BCA',
      name: '1234567890',
      type: 'bank',
    })

    render(
      <MemoryRouter>
        <BalancePrivacyProvider>
          <WalletCard wallet={wallet} />
        </BalancePrivacyProvider>
      </MemoryRouter>,
    )

    expect(screen.getByText('Rp ••••••')).toBeInTheDocument()
    expect(screen.queryByText(/15\.000\.000/)).not.toBeInTheDocument()
  })

  it('copies account number and provider to clipboard on copy click', () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.assign(navigator, {
      clipboard: { writeText },
    })

    const wallet = createWalletSummary({
      institution: 'Bank Jago',
      name: '109254920681',
      type: 'bank',
    })

    render(
      <MemoryRouter>
        <WalletCard wallet={wallet} />
      </MemoryRouter>,
    )

    const copyBtn = screen.getByRole('button', {
      name: /salin nomor Bank Jago/i,
    })
    expect(copyBtn).toBeInTheDocument()

    fireEvent.click(copyBtn)

    expect(writeText).toHaveBeenCalledWith(
      '🏦 Bank Jago\nNo. Rekening: 109254920681',
    )
  })
})
