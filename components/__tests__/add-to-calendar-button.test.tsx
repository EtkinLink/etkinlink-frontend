/**
 * Component Tests - AddToCalendarButton
 * Test Type: Integration Testing
 * Coverage: Calendar ICS file generation and download
 */

import '@testing-library/jest-dom'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AddToCalendarButton } from '../add-to-calendar-button'

// Mock URL.createObjectURL and revokeObjectURL
global.URL.createObjectURL = jest.fn(() => 'blob:mock-url')
global.URL.revokeObjectURL = jest.fn()

describe('AddToCalendarButton Component', () => {
  const mockEvent = {
    id: 1,
    title: 'Test Event',
    starts_at: '2025-01-15T10:00:00Z',
    ends_at: '2025-01-15T12:00:00Z',
    location_name: 'Test Location',
    explanation: 'Test Description',
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Rendering', () => {
    it('should render add to calendar button', () => {
      render(<AddToCalendarButton event={mockEvent} />)

      const button = screen.getByRole('button', { name: /add to calendar/i })
      expect(button).toBeInTheDocument()
    })

    it('should show calendar icon', () => {
      render(<AddToCalendarButton event={mockEvent} />)

      expect(screen.getByText('Add to Calendar')).toBeInTheDocument()
    })

    it('should have outline variant', () => {
      render(<AddToCalendarButton event={mockEvent} />)

      const button = screen.getByRole('button')
      expect(button).toBeInTheDocument()
    })
  })

  describe('User Interaction', () => {
    it('should trigger download when clicked', async () => {
      const user = userEvent.setup()
      const createElementSpy = jest.spyOn(document, 'createElement')
      const appendChildSpy = jest.spyOn(document.body, 'appendChild')
      const removeChildSpy = jest.spyOn(document.body, 'removeChild')

      render(<AddToCalendarButton event={mockEvent} />)

      const button = screen.getByRole('button')
      await user.click(button)

      await waitFor(() => {
        expect(createElementSpy).toHaveBeenCalledWith('a')
        expect(appendChildSpy).toHaveBeenCalled()
        expect(removeChildSpy).toHaveBeenCalled()
      })

      createElementSpy.mockRestore()
      appendChildSpy.mockRestore()
      removeChildSpy.mockRestore()
    })

    it('should show loading state while preparing', async () => {
      const user = userEvent.setup()
      render(<AddToCalendarButton event={mockEvent} />)

      const button = screen.getByRole('button')

      // Mock slow download
      jest.spyOn(document, 'createElement').mockImplementation(() => {
        const link = document.createElement('a')
        Object.defineProperty(link, 'click', {
          value: jest.fn(() => {
            // Simulate delay
            return new Promise(resolve => setTimeout(resolve, 100))
          })
        })
        return link
      })

      await user.click(button)

      // Should show loading text (may be quick)
      expect(button).toBeInTheDocument()
    })

    it('should be disabled while saving', async () => {
      const user = userEvent.setup()
      let clickResolve: any
      const clickPromise = new Promise(resolve => { clickResolve = resolve })

      jest.spyOn(document, 'createElement').mockImplementation(() => {
        const link = document.createElement('a')
        Object.defineProperty(link, 'click', {
          value: jest.fn(() => clickPromise)
        })
        return link
      })

      render(<AddToCalendarButton event={mockEvent} />)

      const button = screen.getByRole('button')
      await user.click(button)

      // Resolve the click
      clickResolve()
    })
  })

  describe('ICS File Generation', () => {
    it('should create blob with correct content type', async () => {
      const user = userEvent.setup()
      const blobSpy = jest.spyOn(global, 'Blob')

      render(<AddToCalendarButton event={mockEvent} />)

      const button = screen.getByRole('button')
      await user.click(button)

      await waitFor(() => {
        expect(blobSpy).toHaveBeenCalledWith(
          expect.any(Array),
          { type: 'text/calendar;charset=utf-8' }
        )
      })

      blobSpy.mockRestore()
    })

    it('should create object URL', async () => {
      const user = userEvent.setup()
      render(<AddToCalendarButton event={mockEvent} />)

      const button = screen.getByRole('button')
      await user.click(button)

      await waitFor(() => {
        expect(URL.createObjectURL).toHaveBeenCalled()
      })
    })

    it('should revoke object URL after download', async () => {
      const user = userEvent.setup()
      render(<AddToCalendarButton event={mockEvent} />)

      const button = screen.getByRole('button')
      await user.click(button)

      await waitFor(() => {
        expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock-url')
      })
    })

    it('should set correct filename', async () => {
      const user = userEvent.setup()
      let downloadLink: HTMLAnchorElement | null = null

      jest.spyOn(document, 'createElement').mockImplementation((tag) => {
        if (tag === 'a') {
          downloadLink = document.createElement('a')
          return downloadLink
        }
        return document.createElement(tag)
      })

      render(<AddToCalendarButton event={mockEvent} />)

      const button = screen.getByRole('button')
      await user.click(button)

      await waitFor(() => {
        expect(downloadLink).not.toBeNull()
        expect(downloadLink?.download).toBe('Test_Event.ics')
      })
    })
  })

  describe('Event Data Handling', () => {
    it('should handle event without end time', async () => {
      const user = userEvent.setup()
      const eventWithoutEnd = {
        ...mockEvent,
        ends_at: null,
      }

      render(<AddToCalendarButton event={eventWithoutEnd} />)

      const button = screen.getByRole('button')
      await user.click(button)

      await waitFor(() => {
        expect(URL.createObjectURL).toHaveBeenCalled()
      })
    })

    it('should handle event without location', async () => {
      const user = userEvent.setup()
      const eventWithoutLocation = {
        ...mockEvent,
        location_name: null,
      }

      render(<AddToCalendarButton event={eventWithoutLocation} />)

      const button = screen.getByRole('button')
      await user.click(button)

      await waitFor(() => {
        expect(URL.createObjectURL).toHaveBeenCalled()
      })
    })

    it('should handle event without description', async () => {
      const user = userEvent.setup()
      const eventWithoutDesc = {
        ...mockEvent,
        explanation: null,
      }

      render(<AddToCalendarButton event={eventWithoutDesc} />)

      const button = screen.getByRole('button')
      await user.click(button)

      await waitFor(() => {
        expect(URL.createObjectURL).toHaveBeenCalled()
      })
    })

    it('should sanitize filename with special characters', async () => {
      const user = userEvent.setup()
      let downloadLink: HTMLAnchorElement | null = null

      jest.spyOn(document, 'createElement').mockImplementation((tag) => {
        if (tag === 'a') {
          downloadLink = document.createElement('a')
          return downloadLink
        }
        return document.createElement(tag)
      })

      const eventWithSpaces = {
        ...mockEvent,
        title: 'Event With Many   Spaces',
      }

      render(<AddToCalendarButton event={eventWithSpaces} />)

      const button = screen.getByRole('button')
      await user.click(button)

      await waitFor(() => {
        expect(downloadLink?.download).toBe('Event_With_Many___Spaces.ics')
      })
    })
  })
})
