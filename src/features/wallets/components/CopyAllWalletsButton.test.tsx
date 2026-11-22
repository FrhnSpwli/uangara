import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { CopyAllWalletsButton } from './CopyAllWalletsButton'

describe('CopyAllWalletsButton', () => {
  it('renders null when wallets array is empty', () => {
    const { container } = render(<CopyAllWalletsButton wallets={[]} />)
    expect(container.firstChild).toBeNull()
  })

  it('renders copy button when wallets exist and copies text on click', () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.assign(navigator, {
      clipboard: { writeText },
    })

    const wallets = [
      {
        institution: 'Bank Jago',
        name: '109254920681',
        type: 'bank' as const,
      },
      {
        institution: 'ShopeePay',
        name: '081241252656',
        type: 'e_wallet' as const,
      },
    ]

    render(<CopyAllWalletsButton wallets={wallets} />)

    const button = screen.getByRole('button', {
      name: /salin semua nomor rekening dan provider/i,
    })
    expect(button).toBeInTheDocument()
    expect(button).toHaveTextContent(/salin semua/i)

    fireEvent.click(button)

    expect(writeText).toHaveBeenCalledTimes(1)
    const copiedText = writeText.mock.calls[0][0] as string
    expect(copiedText).toContain('Bank Jago')
    expect(copiedText).toContain('109254920681')
    expect(copiedText).toContain('ShopeePay')
    expect(copiedText).toContain('081241252656')
  })
})
