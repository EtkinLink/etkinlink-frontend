/**
 * Unit Tests - API Client
 * Test Type: White-Box & Black-Box Testing
 * Coverage: Testing API functions, token management, error handling
 */

import {
  getToken,
  setToken,
  isTokenExpired,
  APIError,
  api
} from '../api-client'

describe('API Client - Token Management', () => {
  beforeEach(() => {
    localStorage.clear()
    jest.clearAllMocks()
  })

  describe('Token Storage', () => {
    it('should store token in localStorage', () => {
      const testToken = 'test-token-123'
      setToken(testToken)

      const storedToken = localStorage.getItem('access_token')
      expect(storedToken).toBe(testToken)
    })

    it('should retrieve token from localStorage', () => {
      const testToken = 'test-token-123'
      localStorage.setItem('access_token', testToken)

      const token = getToken()
      expect(token).toBe(testToken)
    })

    it('should remove token when set to null', () => {
      localStorage.setItem('access_token', 'test-token')
      setToken(null)

      const token = localStorage.getItem('access_token')
      expect(token).toBeNull()
    })

    it('should return null when no token exists', () => {
      const token = getToken()
      expect(token).toBeNull()
    })
  })

  describe('Token Expiration - Boundary Value Analysis', () => {
    it('should return true for expired token', () => {
      // Create a token that expired 1 hour ago
      const expiredTime = Math.floor(Date.now() / 1000) - 3600
      const payload = btoa(JSON.stringify({ exp: expiredTime, userId: 1 }))
      const token = `header.${payload}.signature`

      expect(isTokenExpired(token)).toBe(true)
    })

    it('should return false for valid token', () => {
      // Create a token that expires in 1 hour
      const futureTime = Math.floor(Date.now() / 1000) + 3600
      const payload = btoa(JSON.stringify({ exp: futureTime, userId: 1 }))
      const token = `header.${payload}.signature`

      expect(isTokenExpired(token)).toBe(false)
    })

    it('should return true for token expiring now (boundary)', () => {
      // Token expires exactly now
      const nowTime = Math.floor(Date.now() / 1000)
      const payload = btoa(JSON.stringify({ exp: nowTime, userId: 1 }))
      const token = `header.${payload}.signature`

      expect(isTokenExpired(token)).toBe(true)
    })

    it('should return true for null token', () => {
      expect(isTokenExpired(null)).toBe(true)
    })

    it('should return true for malformed token', () => {
      expect(isTokenExpired('invalid-token')).toBe(true)
    })

    it('should return true for token without exp field', () => {
      const payload = btoa(JSON.stringify({ userId: 1 }))
      const token = `header.${payload}.signature`

      expect(isTokenExpired(token)).toBe(true)
    })
  })
})

describe('API Client - Error Handling', () => {
  it('should create APIError with all properties', () => {
    const error = new APIError('Test error', 400, 'TEST_CODE', { detail: 'info' })

    expect(error.message).toBe('Test error')
    expect(error.status).toBe(400)
    expect(error.code).toBe('TEST_CODE')
    expect(error.details).toEqual({ detail: 'info' })
    expect(error.name).toBe('APIError')
  })

  it('should be instanceof Error', () => {
    const error = new APIError('Test', 500)
    expect(error instanceof Error).toBe(true)
  })
})

describe('API Client - Logout Function', () => {
  beforeEach(() => {
    localStorage.clear()
    jest.clearAllMocks()
  })

  it('should clear token on logout', () => {
    // First set a token
    setToken('test-token')
    expect(localStorage.getItem('access_token')).toBe('test-token')

    // Then logout
    api.logout()

    // Verify token was removed
    expect(localStorage.getItem('access_token')).toBeNull()
  })
})

describe('API Client - Input Validation (Black-Box Testing)', () => {
  describe('Equivalence Partitioning - Email Validation', () => {
    beforeEach(() => {
      global.fetch = jest.fn()
    })

    it('should handle valid email format', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ access_token: 'token' })
      })

      await expect(
        api.loginWithPassword('test@example.com', 'password123')
      ).resolves.toBeDefined()
    })

    it('should handle invalid email format in server response', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ error: { message: 'Invalid email' } })
      })

      await expect(
        api.loginWithPassword('invalid-email', 'password')
      ).rejects.toThrow(APIError)
    })
  })

  describe('Boundary Value Analysis - Password Length', () => {
    beforeEach(() => {
      global.fetch = jest.fn()
    })

    it('should accept minimum valid password', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ access_token: 'token' })
      })

      await expect(
        api.loginWithPassword('test@test.com', '12345678')
      ).resolves.toBeDefined()
    })

    it('should accept long password', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ access_token: 'token' })
      })

      const longPassword = 'a'.repeat(100)
      await expect(
        api.loginWithPassword('test@test.com', longPassword)
      ).resolves.toBeDefined()
    })

    it('should handle empty password', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ error: { message: 'Password required' } })
      })

      await expect(
        api.loginWithPassword('test@test.com', '')
      ).rejects.toThrow()
    })
  })
})
