import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { describe, expect, it } from 'vitest'

import { App } from './App'
import { AppRoutes } from './router/AppRouter'

describe('Uangara application foundation', () => {
  it('boots with the application shell', () => {
    window.history.pushState({}, '', '/')
    render(<App />)

    expect(
      screen.getByRole('navigation', { name: 'Primary navigation' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: 'Uangara home' }),
    ).toBeInTheDocument()
  })

  it('renders the foundation home route', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <AppRoutes />
      </MemoryRouter>,
    )

    expect(
      screen.getByRole('heading', {
        name: 'See where your money lives and how it moves.',
      }),
    ).toBeInTheDocument()
    expect(screen.getByText(/not available yet/i)).toBeInTheDocument()
  })

  it('renders the not-found route for an unknown location', () => {
    render(
      <MemoryRouter initialEntries={['/missing']}>
        <AppRoutes />
      </MemoryRouter>,
    )

    expect(
      screen.getByRole('heading', { name: 'Page not found' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Return home' })).toHaveAttribute(
      'href',
      '/',
    )
  })
})
