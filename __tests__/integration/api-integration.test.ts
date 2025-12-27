/**
 * Integration Tests - API Client
 * Test Type: Module Integration Testing
 * Coverage: API interactions, error handling, data flow
 */

import { api, setToken, getToken, APIError } from '@/lib/api-client'

describe('API Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    localStorage.clear()
    global.fetch = jest.fn()
  })

  describe('Authentication Flow', () => {
    it('should complete login flow and store token', async () => {
      const mockToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImV4cCI6OTk5OTk5OTk5OX0.signature'

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ access_token: mockToken })
      })

      const result = await api.loginWithPassword('test@test.com', 'password123')

      // Verify fetch was called correctly
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/auth/login',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            email: 'test@test.com',
            password: 'password123'
          })
        })
      )

      // Verify token was stored
      expect(localStorage.setItem).toHaveBeenCalledWith('access_token', mockToken)
      expect(result.access_token).toBe(mockToken)
    })

    it('should handle login failure', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({
          error: { message: 'Invalid credentials' }
        })
      })

      await expect(
        api.loginWithPassword('test@test.com', 'wrongpassword')
      ).rejects.toThrow(APIError)

      // Token should not be stored on failure
      expect(localStorage.setItem).not.toHaveBeenCalled()
    })

    it('should clear token on logout', () => {
      setToken('test-token')
      api.logout()

      expect(localStorage.removeItem).toHaveBeenCalledWith('access_token')
    })
  })

  describe('Authenticated Requests', () => {
    beforeEach(() => {
      const validToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImV4cCI6OTk5OTk5OTk5OX0.sig'
      localStorage.setItem('access_token', validToken)
    })

    it('should include Authorization header in authenticated requests', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ id: 1, name: 'Test User' })
      })

      await api.getProfile()

      const fetchCall = (global.fetch as jest.Mock).mock.calls[0]
      const headers = fetchCall[1].headers

      expect(headers.Authorization).toBeDefined()
      expect(headers.Authorization).toContain('Bearer')
    })

    it('should handle 401 unauthorized response', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ error: { message: 'Unauthorized' } })
      })

      await expect(api.getProfile()).rejects.toThrow(APIError)
    })
  })

  describe('Event Operations', () => {
    beforeEach(() => {
      const validToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImV4cCI6OTk5OTk5OTk5OX0.sig'
      localStorage.setItem('access_token', validToken)
    })

    it('should fetch events list', async () => {
      const mockEvents = {
        data: [
          { id: 1, title: 'Event 1' },
          { id: 2, title: 'Event 2' }
        ],
        pagination: { page: 1, total: 2 }
      }

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockEvents
      })

      const result = await api.getEvents()

      expect(result.items).toHaveLength(2)
      expect(result.items[0].title).toBe('Event 1')
    })

    it('should create event with correct payload', async () => {
      const eventData = {
        title: 'New Event',
        explanation: 'Event description',
        type_id: 1,
        price: 0,
        starts_at: '2025-01-01T10:00:00Z',
        ends_at: '2025-01-01T12:00:00Z',
        location_name: 'Test Location',
        has_register: false
      }

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => ({ id: 1, ...eventData })
      })

      await api.createEvent(eventData)

      const fetchCall = (global.fetch as jest.Mock).mock.calls[0]
      const body = JSON.parse(fetchCall[1].body)

      expect(body.title).toBe('New Event')
      expect(body.explanation).toBe('Event description')
      expect(body.type_id).toBe(1)
    })

    it('should join event', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ message: 'Joined successfully' })
      })

      await api.joinEvent(1, false)

      expect(global.fetch).toHaveBeenCalledWith(
        '/api/events/1/register',
        expect.objectContaining({
          method: 'POST'
        })
      )
    })

    it('should use apply endpoint when event requires registration', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ message: 'Application submitted' })
      })

      await api.joinEvent(1, true)

      expect(global.fetch).toHaveBeenCalledWith(
        '/api/events/1/apply',
        expect.objectContaining({
          method: 'POST'
        })
      )
    })
  })

  describe('Error Handling & Response Mapping', () => {
    it('should handle different error message formats', async () => {
      const errorFormats = [
        { error: { message: 'Error message 1' } },
        { error: 'Error string' },
        { message: 'Direct message' },
        { errors: ['Error 1', 'Error 2'] }
      ]

      for (const errorFormat of errorFormats) {
        ;(global.fetch as jest.Mock).mockResolvedValueOnce({
          ok: false,
          status: 400,
          json: async () => errorFormat
        })

        await expect(api.getEvents()).rejects.toThrow(APIError)
      }
    })

    it('should handle 204 No Content response', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 204
      })

      const result = await api.deleteEvent(1)
      expect(result).toBeUndefined()
    })

    it('should map paginated responses correctly', async () => {
      const paginatedResponse = {
        data: [{ id: 1 }, { id: 2 }, { id: 3 }],
        pagination: { page: 1, per_page: 10, total: 3 }
      }

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => paginatedResponse
      })

      const result = await api.getEvents()

      expect(result.items).toHaveLength(3)
      expect(result.pagination).toBeDefined()
      expect(result.pagination.page).toBe(1)
    })

    it('should handle non-paginated array responses', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => [{ id: 1 }, { id: 2 }]
      })

      const result = await api.getEvents()

      expect(result.items).toHaveLength(2)
      expect(result.pagination).toBeNull()
    })
  })

  describe('Date Formatting', () => {
    beforeEach(() => {
      const validToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImV4cCI6OTk5OTk5OTk5OX0.sig'
      localStorage.setItem('access_token', validToken)
    })

    it('should format ISO dates to database format', async () => {
      const eventData = {
        title: 'Event',
        explanation: 'Description',
        type_id: 1,
        starts_at: '2025-01-01T10:00:00Z',
        ends_at: '2025-01-01T12:00:00Z'
      }

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => ({ id: 1 })
      })

      await api.createEvent(eventData)

      const fetchCall = (global.fetch as jest.Mock).mock.calls[0]
      const body = JSON.parse(fetchCall[1].body)

      // Should convert 'T' to space and remove 'Z'
      expect(body.starts_at).toBe('2025-01-01 10:00:00')
      expect(body.ends_at).toBe('2025-01-01 12:00:00')
    })
  })

  describe('Query Parameter Handling', () => {
    it('should build query strings correctly', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ data: [], pagination: null })
      })

      await api.getEvents({ page: 2, per_page: 20 })

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('page=2'),
        expect.anything()
      )
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('per_page=20'),
        expect.anything()
      )
    })

    it('should handle special characters in query params', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ data: [], pagination: null })
      })

      await api.getClubs({ q: 'Test & Special' })

      const fetchCall = (global.fetch as jest.Mock).mock.calls[0]
      const url = fetchCall[0]

      // Special characters should be URL encoded
      expect(url).toContain('q=')
      // + in URL means space, so we need to replace it before decoding
      const decodedUrl = decodeURIComponent(url.replace(/\+/g, ' '))
      expect(decodedUrl).toContain('Test & Special')
    })
  })

  describe('Performance - Response Time', () => {
    it('should handle fast responses', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ data: [] })
      })

      const start = Date.now()
      await api.getEvents()
      const duration = Date.now() - start

      // Should complete very quickly (mocked)
      expect(duration).toBeLessThan(100)
    })

    it('should handle timeout scenarios', async () => {
      ;(global.fetch as jest.Mock).mockImplementationOnce(
        () => new Promise((resolve) => {
          setTimeout(() => {
            resolve({
              ok: false,
              status: 408,
              json: async () => ({ error: { message: 'Request timeout' } })
            })
          }, 100)
        })
      )

      await expect(api.getEvents()).rejects.toThrow()
    })
  })
})
