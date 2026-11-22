import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { BalancePrivacyProvider } from '../context/BalancePrivacyProvider'
import { BalancePrivacyToggle } from './BalancePrivacyToggle'

describe('BalancePrivacyToggle', () => {
  it('renders button with accessible label and aria-pressed attributes', () => {
    render(
      <BalancePrivacyProvider>
        <BalancePrivacyToggle />
      </BalancePrivacyProvider>,
    )

    const button = screen.getByRole('button', { name: /sembunyikan saldo/i })
    expect(button).toHaveAttribute('aria-pressed', 'false')

    fireEvent.click(button)

    expect(
      screen.getByRole('button', { name: /tampilkan saldo/i }),
    ).toHaveAttribute('aria-pressed', 'true')
  })

  it('renders label text when showLabel is true', () => {
    render(
      <BalancePrivacyProvider>
        <BalancePrivacyToggle showLabel />
      </BalancePrivacyProvider>,
    )

    expect(screen.getByText('Sembunyikan saldo')).toBeInTheDocument()
  })

  it('renders dark variant styling correctly', () => {
    render(
      <BalancePrivacyProvider>
        <BalancePrivacyToggle variant="dark" />
      </BalancePrivacyProvider>,
    )

    const button = screen.getByRole('button', { name: /sembunyikan saldo/i })
    expect(button.className).toContain('border-white/20')
  })
})
