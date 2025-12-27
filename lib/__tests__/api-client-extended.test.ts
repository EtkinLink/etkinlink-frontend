/**
 * Extended API Client Tests
 * Test Type: Comprehensive Coverage
 * Goal: %80+ code coverage
 */

import {
  getToken,
  setToken,
  isTokenExpired,
  APIError,
  api,
  setUnauthorizedHandler
} from '../api-client'

describe('API Client - Extended Coverage', () => {
  beforeEach(() => {
    localStorage.clear()
    jest.clearAllMocks()
    global.fetch = jest.fn()
    setUnauthorizedHandler(null)
  })

  describe('Unauthorized Handler', () => {
    it('should set unauthorized handler', () => {
      const handler = jest.fn()
      setUnauthorizedHandler(handler)

      // Trigger 401
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ error: { message: 'Unauthorized' } })
      })

      const validToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImV4cCI6OTk5OTk5OTk5OX0.sig'
      localStorage.setItem('access_token', validToken)

      return api.getProfile().catch(() => {
        expect(handler).toHaveBeenCalled()
      })
    })

    it('should handle unauthorized handler error gracefully', async () => {
      const handler = jest.fn(() => {
        throw new Error('Handler error')
      })
      setUnauthorizedHandler(handler)

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ error: { message: 'Unauthorized' } })
      })

      const validToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImV4cCI6OTk5OTk5OTk5OX0.sig'
      localStorage.setItem('access_token', validToken)

      await expect(api.getProfile()).rejects.toThrow()
    })

    it('should clear handler when set to null', () => {
      const handler = jest.fn()
      setUnauthorizedHandler(handler)
      setUnauthorizedHandler(null)

      // Handler should not be called
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ error: { message: 'Unauthorized' } })
      })

      const validToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImV4cCI6OTk5OTk5OTk5OX0.sig'
      localStorage.setItem('access_token', validToken)

      return api.getProfile().catch(() => {
        // Handler should not have been called
        expect(handler).not.toHaveBeenCalled()
      })
    })
  })

  describe('Authentication API', () => {
    it('should handle signup successfully', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => ({ message: 'User created' })
      })

      const result = await api.signup({
        email: 'new@test.com',
        password: 'password123',
        name: 'Test User',
        gender: 'MALE'
      })

      expect(result.message).toBe('User created')
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/auth/register',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('new@test.com')
        })
      )
    })

    it('should handle forgot password', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ message: 'Reset email sent' })
      })

      await api.forgotPassword('test@test.com')

      expect(global.fetch).toHaveBeenCalledWith(
        '/api/auth/forgot-password',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('test@test.com')
        })
      )
    })

    it('should handle reset password', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ message: 'Password reset' })
      })

      await api.resetPassword({
        token: 'reset-token',
        new_password: 'newpass123'
      })

      expect(global.fetch).toHaveBeenCalledWith(
        '/api/auth/reset-password',
        expect.objectContaining({
          method: 'POST'
        })
      )
    })
  })

  describe('User Profile API', () => {
    beforeEach(() => {
      const validToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEyMzQ1LCJleHAiOjk5OTk5OTk5OTl9.sig'
      localStorage.setItem('access_token', validToken)
    })

    it('should get profile with userId from token', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          name: 'Test User',
          email: 'test@test.com',
          attendance_rate: 85
        })
      })

      const profile = await api.getProfile()

      expect(profile.id).toBe(12345)
      expect(profile.attendance_rate).toBe(85)
      expect(profile.name).toBe('Test User')
    })

    it('should handle profile without attendance_rate', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          name: 'Test User',
          email: 'test@test.com'
        })
      })

      const profile = await api.getProfile()

      expect(profile.attendance_rate).toBe(-1)
    })

    it('should update profile with username', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ message: 'Updated' })
      })

      await api.updateProfile({
        username: 'newusername',
        name: 'New Name',
        university_id: 5
      })

      const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body)
      expect(body.username).toBe('newusername')
      expect(body.name).toBe('New Name')
      expect(body.university_id).toBe(5)
    })

    it('should update profile with partial data', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ message: 'Updated' })
      })

      await api.updateProfile({ name: 'Only Name' })

      const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body)
      expect(body.name).toBe('Only Name')
      expect(body.username).toBeUndefined()
    })

    it('should get user events', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          data: [
            { event_id: 1, event_title: 'Event 1', status: 'JOINED' },
            { id: 2, title: 'Event 2', participation_status: 'OWNER' }
          ]
        })
      })

      const events = await api.getUserEvents(12345)

      expect(events).toHaveLength(2)
      expect(events[0].id).toBe(1)
      expect(events[0].participation_status).toBe('JOINED')
      expect(events[1].id).toBe(2)
    })
  })

  describe('Events API - Comprehensive', () => {
    beforeEach(() => {
      const validToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsInVzZXJuYW1lIjoidGVzdHVzZXIiLCJleHAiOjk5OTk5OTk5OTl9.sig'
      localStorage.setItem('access_token', validToken)
    })

    it('should get single event', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          id: 1,
          title: 'Test Event',
          status: 'ACTIVE'
        })
      })

      const event = await api.getEvent(1)

      expect(event.id).toBe(1)
      expect(event.title).toBe('Test Event')
    })

    it('should get my events', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          data: [
            { event_id: 1, event_title: 'My Event', status: 'JOINED' }
          ]
        })
      })

      const events = await api.getMyEvents()

      expect(events[0].id).toBe(1)
      expect(events[0].title).toBe('My Event')
    })

    it('should get my events with custom perPage', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ data: [] })
      })

      await api.getMyEvents({ perPage: 100 })

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('per_page=100'),
        expect.anything()
      )
    })

    it('should get my owned events', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          data: [
            { event_id: 1, title: 'Owned Event', participation_status: 'OWNER' },
            { event_id: 2, title: 'Joined Event', participation_status: 'JOINED' }
          ]
        })
      })

      const events = await api.getMyOwnedEvents()

      expect(events).toHaveLength(1)
      expect(events[0].id).toBe(1)
      expect(events[0].participation_status).toBe('OWNER')
    })

    it('should create event with all fields', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => ({ id: 1 })
      })

      await api.createEvent({
        title: 'New Event',
        explanation: 'Description',
        type_id: 1,
        owner_type: 'ORGANIZATION',
        organization_id: 5,
        price: 50,
        starts_at: '2025-01-01T10:00:00Z',
        ends_at: '2025-01-01T12:00:00Z',
        location_name: 'Location',
        photo_url: 'https://example.com/photo.jpg',
        latitude: 41.0082,
        longitude: 28.9784,
        has_register: true,
        user_limit: 100,
        is_participants_private: true,
        only_girls: false
      })

      const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body)
      expect(body.title).toBe('New Event')
      expect(body.organization_id).toBe(5)
      expect(body.starts_at).toBe('2025-01-01 10:00:00')
      expect(body.latitude).toBe(41.0082)
    })

    it('should update event with partial data', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ message: 'Updated' })
      })

      await api.updateEvent(1, {
        title: 'Updated Title',
        price: 100
      })

      const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body)
      expect(body.title).toBe('Updated Title')
      expect(body.price).toBe(100)
      expect(body.explanation).toBeUndefined()
    })

    it('should delete event', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 204
      })

      const result = await api.deleteEvent(1)

      expect(result).toBeUndefined()
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/events/1',
        expect.objectContaining({ method: 'DELETE' })
      )
    })

    it('should filter events', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ data: [] })
      })

      await api.filterEvents({ type_id: 1, status: 'ACTIVE' })

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/events/filter?'),
        expect.anything()
      )
    })

    it('should get nearby events', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ data: [] })
      })

      await api.getNearbyEvents(41.0082, 28.9784, 10)

      expect(global.fetch).toHaveBeenCalled()
    })
  })

  describe('Participation API', () => {
    beforeEach(() => {
      const validToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImV4cCI6OTk5OTk5OTk5OX0.sig'
      localStorage.setItem('access_token', validToken)
    })

    it('should join event without registration', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ message: 'Joined' })
      })

      await api.joinEvent(1, false)

      expect(global.fetch).toHaveBeenCalledWith(
        '/api/events/1/register',
        expect.objectContaining({ method: 'POST' })
      )
    })

    it('should join event with registration (apply)', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ message: 'Applied' })
      })

      await api.joinEvent(1, true)

      expect(global.fetch).toHaveBeenCalledWith(
        '/api/events/1/apply',
        expect.objectContaining({ method: 'POST' })
      )
    })

    it('should leave event', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 204
      })

      await api.leaveEvent(1)

      expect(global.fetch).toHaveBeenCalledWith(
        '/api/events/1/participants/1',
        expect.objectContaining({ method: 'DELETE' })
      )
    })

    it('should throw error on leave event without userId', async () => {
      localStorage.clear()

      await expect(api.leaveEvent(1)).rejects.toThrow(APIError)
    })
  })

  describe('Attendance API', () => {
    beforeEach(() => {
      const validToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImV4cCI6OTk5OTk5OTk5OX0.sig'
      localStorage.setItem('access_token', validToken)
    })

    it('should get attendance list', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          participants: [
            { id: 1, name: 'User 1', status: 'ATTENDED' },
            { id: 2, name: 'User 2', status: 'NO_SHOW' }
          ]
        })
      })

      const attendance = await api.getAttendance(1)

      expect(attendance).toHaveLength(2)
      expect(attendance[0].status).toBe('ATTENDED')
    })

    it('should set attendance status', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ message: 'Updated' })
      })

      await api.setAttendance(1, 2, 'ATTENDED')

      const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body)
      expect(body.status).toBe('ATTENDED')
    })

    it('should check in with ticket code', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ message: 'Checked in' })
      })

      await api.checkInEvent(1, 'TICKET123')

      const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body)
      expect(body.ticket_code).toBe('TICKET123')
    })

    it('should manual check in', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ message: 'Checked in' })
      })

      await api.manualCheckIn(1, 2)

      const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body)
      expect(body.participant_id).toBe(2)
    })
  })

  describe('Applications API', () => {
    beforeEach(() => {
      const validToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImV4cCI6OTk5OTk5OTk5OX0.sig'
      localStorage.setItem('access_token', validToken)
    })

    it('should create application', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => ({ id: 1 })
      })

      await api.createApplication(1, 'I want to join')

      const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body)
      expect(body.why_me).toBe('I want to join')
    })

    it('should get applications', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          data: [
            { id: 1, user_id: 2, status: 'PENDING' }
          ]
        })
      })

      const apps = await api.getApplications(1)

      expect(apps).toHaveLength(1)
      expect(apps[0].status).toBe('PENDING')
    })

    it('should approve application', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ message: 'Approved' })
      })

      await api.patchApplication(1, 'APPROVED')

      const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body)
      expect(body.status).toBe('APPROVED')
    })

    it('should reject application', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ message: 'Rejected' })
      })

      await api.patchApplication(1, 'REJECTED')

      const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body)
      expect(body.status).toBe('REJECTED')
    })
  })

  describe('Ratings API', () => {
    beforeEach(() => {
      const validToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImV4cCI6OTk5OTk5OTk5OX0.sig'
      localStorage.setItem('access_token', validToken)
    })

    it('should get ratings', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ([
          { id: 1, rating: 5, comment: 'Great!' }
        ])
      })

      const ratings = await api.getRatings(1)

      expect(ratings[0].rating).toBe(5)
    })

    it('should create rating with comment', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => ({ id: 1 })
      })

      await api.createRating(1, 5, 'Excellent event!')

      const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body)
      expect(body.rating).toBe(5)
      expect(body.comment).toBe('Excellent event!')
    })

    it('should create rating without comment', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => ({ id: 1 })
      })

      await api.createRating(1, 4)

      const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body)
      expect(body.rating).toBe(4)
      expect(body.comment).toBeUndefined()
    })
  })

  describe('Clubs/Organizations API', () => {
    beforeEach(() => {
      const validToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsInVzZXJuYW1lIjoidGVzdHVzZXIiLCJleHAiOjk5OTk5OTk5OTl9.sig'
      localStorage.setItem('access_token', validToken)
    })

    it('should get clubs without filters', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          data: [
            { id: 1, name: 'Club 1', member_count: 10 }
          ]
        })
      })

      const clubs = await api.getClubs()

      expect(clubs[0].id).toBe(1)
      expect(clubs[0].member_count).toBe(10)
    })

    it('should get clubs with search query', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ data: [] })
      })

      await api.getClubs({ q: 'test', university_id: 1 })

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/organizations/filter?'),
        expect.anything()
      )
    })

    it('should handle non-array response', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => null
      })

      const clubs = await api.getClubs()

      expect(clubs).toEqual([])
    })

    it('should get single club', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          id: 1,
          name: 'Test Club',
          owner_username: 'testuser',
          members: [{ id: 1, username: 'user1', role: 'MEMBER' }],
          events: [{ id: 1, title: 'Event 1' }]
        })
      })

      const club = await api.getClub(1)

      expect(club.id).toBe(1)
      expect(club.member_count).toBe(1)
      expect(club.members).toHaveLength(1)
      expect(club.events).toHaveLength(1)
    })

    it('should create club', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => ({ id: 1 })
      })

      await api.createClub({
        name: 'New Club',
        description: 'Description',
        join_method: 'OPEN'
      })

      const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body)
      expect(body.name).toBe('New Club')
      expect(body.join_method).toBe('OPEN')
    })

    it('should join club', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ message: 'Applied' })
      })

      await api.joinClub(1)

      const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body)
      expect(body.motivation).toBe('')
    })

    it('should leave club', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 204
      })

      await api.leaveClub(1)

      expect(global.fetch).toHaveBeenCalledWith(
        '/api/organizations/1/members/1',
        expect.objectContaining({ method: 'DELETE' })
      )
    })

    it('should get my clubs', async () => {
      ;(global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({
            data: [
              { id: 1, name: 'Club 1', owner_username: 'testuser' }
            ]
          })
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({
            data: [
              { id: 2, name: 'Club 2', role: 'MEMBER' }
            ]
          })
        })

      const clubs = await api.getMyClubs()

      expect(clubs.length).toBeGreaterThan(0)
    })

    it('should get my club application status - MEMBER', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          members: [{ id: 1, role: 'MEMBER' }]
        })
      })

      const status = await api.getMyClubApplicationStatus(1)

      expect(status.status).toBe('MEMBER')
    })

    it('should get my club application status - ADMIN', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          members: [{ id: 1, role: 'ADMIN' }]
        })
      })

      const status = await api.getMyClubApplicationStatus(1)

      expect(status.status).toBe('ADMIN')
    })

    it('should get my club application status - PENDING', async () => {
      ;(global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({ members: [] })
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({
            data: [{ id: 1, relation: 'APPLIED' }]
          })
        })

      const status = await api.getMyClubApplicationStatus(1)

      expect(status.status).toBe('PENDING')
    })

    it('should create club application', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => ({ id: 1 })
      })

      await api.createClubApplication(1, 'I want to join')

      const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body)
      expect(body.motivation).toBe('I want to join')
    })

    it('should get club applications', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          data: [
            { id: 1, motivation: 'test', why_me: null }
          ]
        })
      })

      const apps = await api.getClubApplications(1)

      expect(apps[0].why_me).toBe('test')
    })

    it('should approve club application', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ message: 'Approved' })
      })

      await api.patchClubApplication(1, 2, 'APPROVED')

      expect(global.fetch).toHaveBeenCalledWith(
        '/api/organizations/1/applications/2/approve',
        expect.objectContaining({ method: 'POST' })
      )
    })

    it('should reject club application', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ message: 'Rejected' })
      })

      await api.patchClubApplication(1, 2, 'REJECTED')

      expect(global.fetch).toHaveBeenCalledWith(
        '/api/organizations/1/applications/2/reject',
        expect.objectContaining({ method: 'POST' })
      )
    })

    it('should get club members', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          members: [{ id: 1, name: 'User 1' }]
        })
      })

      const members = await api.getClubMembers(1)

      expect(members).toHaveLength(1)
    })

    it('should update club', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ message: 'Updated' })
      })

      await api.updateClub(1, {
        description: 'New desc',
        photo_url: 'https://example.com/photo.jpg',
        status: 'ACTIVE'
      })

      const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body)
      expect(body.description).toBe('New desc')
    })

    it('should delete club', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 204
      })

      await api.deleteClub(1)

      expect(global.fetch).toHaveBeenCalledWith(
        '/api/organizations/1',
        expect.objectContaining({ method: 'DELETE' })
      )
    })
  })

  describe('Dictionaries API', () => {
    it('should get universities', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ([
          { id: 1, name: 'University 1' }
        ])
      })

      const universities = await api.getUniversities()

      expect(universities[0].name).toBe('University 1')
    })

    it('should get event types as array', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ([
          { id: 1, name: 'Type 1' }
        ])
      })

      const types = await api.getEventTypes()

      expect(types[0].name).toBe('Type 1')
    })

    it('should get event types from data field', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          data: [{ id: 1, name: 'Type 1' }]
        })
      })

      const types = await api.getEventTypes()

      expect(types[0].name).toBe('Type 1')
    })

    it('should get event types from event_types field', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          event_types: [{ id: 1, name: 'Type 1' }]
        })
      })

      const types = await api.getEventTypes()

      expect(types[0].name).toBe('Type 1')
    })
  })

  describe('Reports API', () => {
    beforeEach(() => {
      const validToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImV4cCI6OTk5OTk5OTk5OX0.sig'
      localStorage.setItem('access_token', validToken)
    })

    it('should report event', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => ({ message: 'Reported' })
      })

      await api.reportEvent(1, 'Inappropriate content')

      const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body)
      expect(body.reason).toBe('Inappropriate content')
    })

    it('should report club', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => ({ message: 'Reported' })
      })

      await api.reportClub(1, 'Spam')

      const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body)
      expect(body.reason).toBe('Spam')
    })

    it('should get my reports', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          data: [{ id: 1, reason: 'Test' }]
        })
      })

      const reports = await api.getMyReports()

      expect(reports).toHaveLength(1)
    })
  })

  describe('Other APIs', () => {
    beforeEach(() => {
      const validToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImV4cCI6OTk5OTk5OTk5OX0.sig'
      localStorage.setItem('access_token', validToken)
    })

    it('should get my badges (placeholder)', async () => {
      const badges = await api.getMyBadges()
      expect(badges).toEqual([])
    })

    it('should get all badges (placeholder)', async () => {
      const badges = await api.getAllBadges()
      expect(badges).toEqual([])
    })

    it('should get notifications (placeholder)', async () => {
      const notifications = await api.getNotifications()
      expect(notifications).toEqual([])
    })

    it('should mark notifications read (placeholder)', async () => {
      const result = await api.markNotificationsRead()
      expect(result.message).toBe('Not supported')
    })

    it('should set event attendance status', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ message: 'Updated' })
      })

      await api.setEventAttendanceStatus(1, 2, 'ATTENDED')

      const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body)
      expect(body.status).toBe('ATTENDED')
    })

    it('should get all applications', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ data: [] })
      })

      const apps = await api.getAllApplications()

      expect(apps).toEqual([])
    })

    it('should get all participants', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ data: [] })
      })

      const participants = await api.getAllParticipants()

      expect(participants).toEqual([])
    })
  })
})
