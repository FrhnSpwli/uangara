import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import {
  WalletCardSelector,
  type WalletCardSelectorOption,
} from './WalletCardSelector'

const mockWallets: WalletCardSelectorOption[] = [
  {
    balance: '5000000',
    id: 'wallet-1',
    institution: 'Bank BCA',
    name: '1234567890',
    type: 'bank',
  },
  {
    balance: '1500000',
    id: 'wallet-2',
    institution: 'Bank Mandiri',
    name: '9876543210',
    type: 'bank',
  },
  {
    balance: '250000',
    id: 'wallet-3',
    institution: 'GoPay',
    name: '08123456789',
    type: 'e_wallet',
  },
  {
    balance: '100000',
    id: 'wallet-4',
    institution: 'OVO',
    name: '08123456789',
    type: 'e_wallet',
  },
  {
    balance: '50000',
    id: 'wallet-5',
    institution: 'Flazz',
    name: '54321',
    type: 'e_money',
  },
  {
    balance: '2000000',
    id: 'wallet-6',
    institution: 'Bank BRI',
    name: '1122334455',
    type: 'bank',
  },
  {
    balance: '300000',
    id: 'wallet-7',
    institution: 'DANA',
    name: '08198765432',
    type: 'e_wallet',
  },
]

describe('WalletCardSelector', () => {
  it('renders wallet cards and handles selection', () => {
    const handleChange = vi.fn()
    render(
      <WalletCardSelector
        id="test-wallet"
        label="Select wallet"
        onChange={handleChange}
        value="wallet-1"
        wallets={mockWallets.slice(0, 3)}
      />,
    )

    expect(screen.getByText('Bank BCA')).toBeInTheDocument()
    expect(screen.getByText('Bank Mandiri')).toBeInTheDocument()
    expect(screen.getByText('GoPay')).toBeInTheDocument()

    // Click on Bank Mandiri card
    fireEvent.click(screen.getByRole('radio', { name: /Bank Mandiri/i }))
    expect(handleChange).toHaveBeenCalledWith('wallet-2')
  })

  it('limits to 5 cards when wallets > 5, showing 4 cards + 1 "Lainnya" toggle card', () => {
    const handleChange = vi.fn()
    render(
      <WalletCardSelector
        id="test-wallet"
        label="Select wallet"
        onChange={handleChange}
        value="wallet-1"
        wallets={mockWallets}
      />,
    )

    // First 4 wallets should be visible
    expect(screen.getByText('Bank BCA')).toBeInTheDocument()
    expect(screen.getByText('Bank Mandiri')).toBeInTheDocument()
    expect(screen.getByText('GoPay')).toBeInTheDocument()
    expect(screen.getByText('OVO')).toBeInTheDocument()

    // 5th and 6th wallets should NOT be visible initially
    expect(screen.queryByText('Bank BRI')).not.toBeInTheDocument()
    expect(
      screen.queryByRole('radio', { name: /DANA/i }),
    ).not.toBeInTheDocument()

    // Toggle card "Lainnya" should exist showing remaining count
    const moreButton = screen.getByRole('button', {
      name: /Lainnya \(Lihat Semua\)/i,
    })
    expect(moreButton).toBeInTheDocument()
    expect(screen.getByText('+3')).toBeInTheDocument()

    // Expanding should reveal all wallets
    fireEvent.click(moreButton)
    expect(screen.getByText('Bank BRI')).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: /DANA/i })).toBeInTheDocument()

    // Should show search input and collapse button when expanded
    const searchInput = screen.getByPlaceholderText(
      /Cari nama dompet, bank, atau no rekening/i,
    )
    expect(searchInput).toBeInTheDocument()

    // Filter by search
    fireEvent.change(searchInput, { target: { value: 'BRI' } })
    expect(screen.getByText('Bank BRI')).toBeInTheDocument()
    expect(screen.queryByText('GoPay')).not.toBeInTheDocument()

    // Collapse again
    const collapseButton = screen.getByRole('button', {
      name: /Tampilkan lebih sedikit/i,
    })
    fireEvent.click(collapseButton)
    expect(screen.queryByText('Bank BRI')).not.toBeInTheDocument()
  })

  it('displays empty state when no wallets are provided', () => {
    render(
      <WalletCardSelector
        label="Select wallet"
        onChange={vi.fn()}
        value=""
        wallets={[]}
      />,
    )

    expect(
      screen.getByText('Tidak ada dompet yang tersedia.'),
    ).toBeInTheDocument()
  })

  it('displays error message when provided', () => {
    render(
      <WalletCardSelector
        error="Choose an active wallet."
        label="Select wallet"
        onChange={vi.fn()}
        value=""
        wallets={mockWallets.slice(0, 2)}
      />,
    )

    expect(screen.getByText('Choose an active wallet.')).toBeInTheDocument()
  })
})
