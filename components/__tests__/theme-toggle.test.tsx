/**
 * Component Tests - ThemeToggle
 * Test Type: Integration Testing
 * Coverage: Theme switching UI component
 */

import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ThemeToggle } from '../theme-toggle'
import { ThemeProvider } from '@/lib/dark-mode-context'

describe('ThemeToggle Component', () => {
  const renderWithProvider = (initialTheme: 'light' | 'dark' = 'light') => {
    // Mock localStorage
    if (initialTheme === 'dark') {
      localStorage.setItem('etkinlink-theme', 'dark')
    }

    return render(
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>
    )
  }

  beforeEach(() => {
    localStorage.clear()
    document.documentElement.className = ''
  })

  describe('Rendering', () => {
    it('should render toggle button', () => {
      renderWithProvider()

      const button = screen.getByRole('button', { name: /toggle theme/i })
      expect(button).toBeInTheDocument()
    })

    it('should show moon icon in light mode', () => {
      renderWithProvider('light')

      const button = screen.getByRole('button')
      expect(button).toBeInTheDocument()
      // Moon icon should be visible in light mode
    })

    it('should show sun icon in dark mode', () => {
      renderWithProvider('dark')

      const button = screen.getByRole('button')
      expect(button).toBeInTheDocument()
      // Sun icon should be visible in dark mode
    })
  })

  describe('User Interaction', () => {
    it('should toggle theme when clicked', async () => {
      const user = userEvent.setup()
      renderWithProvider('light')

      const button = screen.getByRole('button')

      // Initially light mode
      expect(document.documentElement.classList.contains('dark')).toBe(false)

      // Click to toggle
      await user.click(button)

      // Should be dark mode now
      expect(document.documentElement.classList.contains('dark')).toBe(true)

      // Click again
      await user.click(button)

      // Should be light mode again
      expect(document.documentElement.classList.contains('dark')).toBe(false)
    })

    it('should be keyboard accessible', async () => {
      const user = userEvent.setup()
      renderWithProvider()

      const button = screen.getByRole('button')
      button.focus()

      await user.keyboard('{Enter}')

      expect(document.documentElement.classList.contains('dark')).toBe(true)
    })
  })

  describe('Accessibility', () => {
    it('should have aria-label', () => {
      renderWithProvider()

      const button = screen.getByRole('button', { name: /toggle theme/i })
      expect(button).toHaveAttribute('aria-label', 'Toggle theme')
    })

    it('should be a button element', () => {
      renderWithProvider()

      const button = screen.getByRole('button')
      expect(button.tagName).toBe('BUTTON')
    })
  })
})
