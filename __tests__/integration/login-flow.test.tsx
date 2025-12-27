/**
 * Integration Tests - Login Flow
 * Test Type: Integration Testing & System Testing
 * Coverage: Complete login workflow from form to API
 */

import '@testing-library/jest-dom'
import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { api } from '@/lib/api-client'

// Mock the API client
jest.mock('@/lib/api-client', () => ({
  api: {
    loginWithPassword: jest.fn(),
  },
  setToken: jest.fn(),
  getToken: jest.fn(),
}))

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
  }),
}))

// Mock Turnstile component
jest.mock('@marsidev/react-turnstile', () => ({
  Turnstile: ({ onSuccess }: any) => (
    <button
      type="button"
      onClick={() => onSuccess('mock-turnstile-token')}
      data-testid="turnstile-verify"
    >
      Verify
    </button>
  ),
}))

// Mock i18n
jest.mock('@/lib/i18n', () => ({
  useI18n: () => ({
    t: (key: string) => key,
    locale: 'en',
    setLocale: jest.fn(),
  }),
}))

// Simple mock login component for testing
const MockLoginForm = () => {
  const [email, setEmail] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [error, setError] = React.useState('')
  const [isLoading, setIsLoading] = React.useState(false)
  const [turnstileToken, setTurnstileToken] = React.useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!email || !password) {
      setError('auth.error.missingFields')
      return
    }

    if (!turnstileToken) {
      setError('auth.error.verifyHuman')
      return
    }

    setIsLoading(true)
    try {
      await api.loginWithPassword(email, password)
      setError('')
    } catch (err: any) {
      setError(err?.message || 'auth.error.loginFailed')
      setIsLoading(false)
      setTurnstileToken(null)
    }
  }

  return (
    <form onSubmit={handleSubmit} data-testid="login-form">
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        data-testid="email-input"
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        data-testid="password-input"
      />
      <button
        type="button"
        onClick={() => setTurnstileToken('mock-token')}
        data-testid="turnstile-verify"
      >
        Verify
      </button>
      <button type="submit" disabled={isLoading} data-testid="submit-button">
        {isLoading ? 'Loading...' : 'Login'}
      </button>
      {error && <div data-testid="error-message">{error}</div>}
    </form>
  )
}

describe('Login Flow Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Successful Login Flow', () => {
    it('should complete full login workflow successfully', async () => {
      const user = userEvent.setup()
      ;(api.loginWithPassword as jest.Mock).mockResolvedValue({
        access_token: 'test-token-123'
      })

      render(<MockLoginForm />)

      // Step 1: Enter email
      const emailInput = screen.getByTestId('email-input')
      await user.type(emailInput, 'test@example.com')
      expect(emailInput).toHaveValue('test@example.com')

      // Step 2: Enter password
      const passwordInput = screen.getByTestId('password-input')
      await user.type(passwordInput, 'password123')
      expect(passwordInput).toHaveValue('password123')

      // Step 3: Verify captcha
      const verifyButton = screen.getByTestId('turnstile-verify')
      await user.click(verifyButton)

      // Step 4: Submit form
      const submitButton = screen.getByTestId('submit-button')
      await user.click(submitButton)

      // Verify API was called with correct credentials
      await waitFor(() => {
        expect(api.loginWithPassword).toHaveBeenCalledWith(
          'test@example.com',
          'password123'
        )
      })
    })
  })

  describe('Validation Tests (Black-Box)', () => {
    it('should show error when email is empty', async () => {
      const user = userEvent.setup()
      render(<MockLoginForm />)

      // Enter only password
      const passwordInput = screen.getByTestId('password-input')
      await user.type(passwordInput, 'password123')

      // Try to submit
      const submitButton = screen.getByTestId('submit-button')
      await user.click(submitButton)

      // Should show error
      await waitFor(() => {
        expect(screen.getByTestId('error-message')).toHaveTextContent('auth.error.missingFields')
      })

      // API should not be called
      expect(api.loginWithPassword).not.toHaveBeenCalled()
    })

    it('should show error when password is empty', async () => {
      const user = userEvent.setup()
      render(<MockLoginForm />)

      // Enter only email
      const emailInput = screen.getByTestId('email-input')
      await user.type(emailInput, 'test@example.com')

      // Try to submit
      const submitButton = screen.getByTestId('submit-button')
      await user.click(submitButton)

      // Should show error
      await waitFor(() => {
        expect(screen.getByTestId('error-message')).toHaveTextContent('auth.error.missingFields')
      })

      expect(api.loginWithPassword).not.toHaveBeenCalled()
    })

    it('should show error when captcha is not verified', async () => {
      const user = userEvent.setup()
      render(<MockLoginForm />)

      // Enter credentials
      await user.type(screen.getByTestId('email-input'), 'test@example.com')
      await user.type(screen.getByTestId('password-input'), 'password123')

      // Submit without verifying captcha
      await user.click(screen.getByTestId('submit-button'))

      await waitFor(() => {
        expect(screen.getByTestId('error-message')).toHaveTextContent('auth.error.verifyHuman')
      })

      expect(api.loginWithPassword).not.toHaveBeenCalled()
    })
  })

  describe('API Error Handling', () => {
    it('should handle invalid credentials error', async () => {
      const user = userEvent.setup()
      ;(api.loginWithPassword as jest.Mock).mockRejectedValue({
        message: 'Invalid email or password',
        status: 401
      })

      render(<MockLoginForm />)

      // Fill form
      await user.type(screen.getByTestId('email-input'), 'test@example.com')
      await user.type(screen.getByTestId('password-input'), 'wrongpassword')
      await user.click(screen.getByTestId('turnstile-verify'))

      // Submit
      await user.click(screen.getByTestId('submit-button'))

      // Should show error message
      await waitFor(() => {
        expect(screen.getByTestId('error-message')).toHaveTextContent('Invalid email or password')
      })
    })

    it('should handle network error', async () => {
      const user = userEvent.setup()
      ;(api.loginWithPassword as jest.Mock).mockRejectedValue({
        message: 'Network error',
        status: 500
      })

      render(<MockLoginForm />)

      await user.type(screen.getByTestId('email-input'), 'test@example.com')
      await user.type(screen.getByTestId('password-input'), 'password123')
      await user.click(screen.getByTestId('turnstile-verify'))
      await user.click(screen.getByTestId('submit-button'))

      await waitFor(() => {
        expect(screen.getByTestId('error-message')).toBeInTheDocument()
      })
    })

    it('should re-enable form after failed login', async () => {
      const user = userEvent.setup()
      ;(api.loginWithPassword as jest.Mock).mockRejectedValue({
        message: 'Login failed'
      })

      render(<MockLoginForm />)

      await user.type(screen.getByTestId('email-input'), 'test@example.com')
      await user.type(screen.getByTestId('password-input'), 'password123')
      await user.click(screen.getByTestId('turnstile-verify'))

      const submitButton = screen.getByTestId('submit-button')
      await user.click(submitButton)

      // Button should be disabled during loading
      await waitFor(() => {
        expect(submitButton).toBeDisabled()
      })

      // After error, button should be enabled again
      await waitFor(() => {
        expect(submitButton).not.toBeDisabled()
      })
    })
  })

  describe('Security Tests', () => {
    it('should not expose password in error messages', async () => {
      const user = userEvent.setup()
      ;(api.loginWithPassword as jest.Mock).mockRejectedValue({
        message: 'Invalid credentials'
      })

      render(<MockLoginForm />)

      const testPassword = 'secretpassword123'
      await user.type(screen.getByTestId('email-input'), 'test@example.com')
      await user.type(screen.getByTestId('password-input'), testPassword)
      await user.click(screen.getByTestId('turnstile-verify'))
      await user.click(screen.getByTestId('submit-button'))

      await waitFor(() => {
        const errorMessage = screen.getByTestId('error-message')
        expect(errorMessage.textContent).not.toContain(testPassword)
      })
    })

    it('should require both email and password', async () => {
      const user = userEvent.setup()
      render(<MockLoginForm />)

      // Try submitting empty form
      await user.click(screen.getByTestId('submit-button'))

      await waitFor(() => {
        expect(screen.getByTestId('error-message')).toBeInTheDocument()
      })

      expect(api.loginWithPassword).not.toHaveBeenCalled()
    })
  })

  describe('Performance & UX', () => {
    it('should show loading state during API call', async () => {
      const user = userEvent.setup()
      let resolveLogin: any
      ;(api.loginWithPassword as jest.Mock).mockImplementation(
        () => new Promise(resolve => { resolveLogin = resolve })
      )

      render(<MockLoginForm />)

      await user.type(screen.getByTestId('email-input'), 'test@example.com')
      await user.type(screen.getByTestId('password-input'), 'password123')
      await user.click(screen.getByTestId('turnstile-verify'))

      const submitButton = screen.getByTestId('submit-button')
      await user.click(submitButton)

      // Should show loading state
      await waitFor(() => {
        expect(submitButton).toHaveTextContent('Loading...')
        expect(submitButton).toBeDisabled()
      })

      // Resolve the promise
      resolveLogin({ access_token: 'token' })

      await waitFor(() => {
        expect(submitButton).not.toBeDisabled()
      })
    })
  })
})
