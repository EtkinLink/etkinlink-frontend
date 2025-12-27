/**
 * Context Tests - AuthContext
 * Test Type: Integration & Unit Testing
 * Coverage: Authentication state management, user profile, logout
 */

import '@testing-library/jest-dom'
import { renderHook, act, waitFor } from '@testing-library/react'
import { AuthProvider, useAuth } from '../auth-context'
import { api, setToken, getToken } from '../api-client'
import * as apiClient from '../api-client'

// Mock toast
jest.mock('@/hooks/use-toast', () => ({
  toast: jest.fn(),
}))

// Mock API client
jest.mock('../api-client', () => ({
  ...jest.requireActual('../api-client'),
  api: {
    getProfile: jest.fn(),
  },
  setUnauthorizedHandler: jest.fn(),
}))

describe('AuthContext', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    localStorage.clear()
  })

  describe('useAuth Hook', () => {
    it('should throw error when used outside AuthProvider', () => {
      // Suppress console.error for this test
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()

      expect(() => {
        renderHook(() => useAuth())
      }).toThrow('useAuth must be used within an AuthProvider')

      consoleSpy.mockRestore()
    })

    it('should provide auth context when used inside AuthProvider', () => {
      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      })

      expect(result.current).toBeDefined()
      expect(result.current.user).toBeNull()
      expect(result.current.token).toBeNull()
      expect(typeof result.current.logout).toBe('function')
      expect(typeof result.current.refreshUser).toBe('function')
    })
  })

  describe('Initial State', () => {
    it('should start with null user and token', async () => {
      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.user).toBeNull()
      expect(result.current.token).toBeNull()
    })

    it('should load token from localStorage on mount', async () => {
      const mockToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImV4cCI6OTk5OTk5OTk5OX0.sig'
      const mockUser = {
        id: 1,
        username: 'testuser',
        name: 'Test User',
        email: 'test@example.com',
        attendance_rate: 0.95,
      }

      localStorage.setItem('access_token', mockToken)
      ;(api.getProfile as jest.Mock).mockResolvedValue(mockUser)

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.token).toBe(mockToken)
      expect(result.current.user).toEqual(mockUser)
    })
  })

  describe('Logout', () => {
    it('should clear user and token on logout', async () => {
      const mockToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImV4cCI6OTk5OTk5OTk5OX0.sig'
      const mockUser = {
        id: 1,
        username: 'testuser',
        name: 'Test User',
        email: 'test@example.com',
        attendance_rate: 0.95,
      }

      localStorage.setItem('access_token', mockToken)
      ;(api.getProfile as jest.Mock).mockResolvedValue(mockUser)

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      })

      await waitFor(() => {
        expect(result.current.user).toEqual(mockUser)
      })

      act(() => {
        result.current.logout()
      })

      expect(result.current.user).toBeNull()
      expect(result.current.token).toBeNull()
      expect(localStorage.getItem('access_token')).toBeNull()
    })
  })

  describe('Profile Fetching', () => {
    it('should fetch user profile on mount with valid token', async () => {
      const mockToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImV4cCI6OTk5OTk5OTk5OX0.sig'
      const mockUser = {
        id: 1,
        username: 'testuser',
        name: 'Test User',
        email: 'test@example.com',
        attendance_rate: 0.85,
        university_id: 1,
        university_name: 'Test University',
        bio: 'Test bio',
      }

      localStorage.setItem('access_token', mockToken)
      ;(api.getProfile as jest.Mock).mockResolvedValue(mockUser)

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(api.getProfile).toHaveBeenCalled()
      expect(result.current.user).toEqual(mockUser)
    })

    it('should logout if profile fetch fails', async () => {
      const mockToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImV4cCI6OTk5OTk5OTk5OX0.sig'
      localStorage.setItem('access_token', mockToken)
      ;(api.getProfile as jest.Mock).mockRejectedValue(new Error('Unauthorized'))

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.user).toBeNull()
      expect(result.current.token).toBeNull()

      consoleSpy.mockRestore()
    })
  })

  describe('Refresh User', () => {
    it('should refresh user profile', async () => {
      const mockToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImV4cCI6OTk5OTk5OTk5OX0.sig'
      const mockUser = {
        id: 1,
        username: 'testuser',
        name: 'Test User',
        email: 'test@example.com',
        attendance_rate: 0.95,
      }
      const updatedUser = {
        ...mockUser,
        name: 'Updated Name',
      }

      localStorage.setItem('access_token', mockToken)
      ;(api.getProfile as jest.Mock).mockResolvedValueOnce(mockUser)

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      })

      await waitFor(() => {
        expect(result.current.user).toEqual(mockUser)
      })

      ;(api.getProfile as jest.Mock).mockResolvedValueOnce(updatedUser)

      await act(async () => {
        await result.current.refreshUser()
      })

      expect(result.current.user).toEqual(updatedUser)
    })
  })

  describe('Token Expiration', () => {
    it('should logout if token is expired on mount', async () => {
      // Create an expired token (exp in the past)
      const expiredToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImV4cCI6MTAwMDAwMH0.sig'
      localStorage.setItem('access_token', expiredToken)

      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation()

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.user).toBeNull()
      expect(result.current.token).toBeNull()
      expect(localStorage.getItem('access_token')).toBeNull()

      consoleSpy.mockRestore()
    })
  })

  describe('Unauthorized Handler', () => {
    it('should set unauthorized handler on mount', () => {
      renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      })

      expect(apiClient.setUnauthorizedHandler).toHaveBeenCalled()
    })
  })
})
