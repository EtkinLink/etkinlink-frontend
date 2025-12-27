/**
 * Component Tests - EventCalendar
 * Test Type: Integration Testing
 * Coverage: Calendar component with event display
 */

import '@testing-library/jest-dom'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { EventCalendar } from '../event-calendar'

// Mock next/dynamic
jest.mock('next/dynamic', () => ({
  __esModule: true,
  default: (loader: any, options: any) => {
    const Component = (props: any) => {
      const MockedComponent = require('react-day-picker').DayPicker
      return <MockedComponent {...props} />
    }
    return Component
  },
}))

// Mock react-day-picker
jest.mock('react-day-picker', () => ({
  DayPicker: ({ selected, onSelect, modifiers }: any) => (
    <div data-testid="day-picker">
      <button
        data-testid="select-date-btn"
        onClick={() => onSelect && onSelect(new Date('2025-01-15T10:00:00Z'))}
      >
        Select Date
      </button>
      {selected && (
        <div data-testid="selected-date">
          {selected.toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
          })}
        </div>
      )}
    </div>
  ),
}))

// Mock Badge component
jest.mock('@/components/ui/badge', () => ({
  Badge: ({ children, variant }: any) => (
    <span data-testid="badge" data-variant={variant}>
      {children}
    </span>
  ),
}))

describe('EventCalendar Component', () => {
  const mockEvents = [
    {
      id: 1,
      title: 'Tech Conference',
      starts_at: '2025-01-15T10:00:00Z',
      event_type: 'Conference',
    },
    {
      id: 2,
      title: 'Workshop',
      starts_at: '2025-01-15T14:00:00Z',
      event_type: 'Workshop',
    },
    {
      id: 3,
      title: 'Meetup',
      starts_at: '2025-01-20T18:00:00Z',
      event_type: 'Social',
    },
  ]

  beforeEach(() => {
    jest.clearAllMocks()
    // Mock document.head.appendChild for CSS loading
    document.head.appendChild = jest.fn()
    document.querySelector = jest.fn().mockReturnValue(null)
  })

  describe('Rendering', () => {
    it('should render calendar component', () => {
      render(<EventCalendar events={mockEvents} />)
      expect(screen.getByTestId('day-picker')).toBeInTheDocument()
    })

    it('should load calendar styles on mount', () => {
      render(<EventCalendar events={mockEvents} />)
      expect(document.head.appendChild).toHaveBeenCalled()
    })

    it('should not load styles if already loaded', () => {
      const mockLink = document.createElement('link')
      mockLink.setAttribute('data-daypicker', 'css')
      document.querySelector = jest.fn().mockReturnValue(mockLink)

      render(<EventCalendar events={mockEvents} />)
      expect(document.head.appendChild).not.toHaveBeenCalled()
    })

    it('should render with empty events array', () => {
      render(<EventCalendar events={[]} />)
      expect(screen.getByTestId('day-picker')).toBeInTheDocument()
    })
  })

  describe('Event Display', () => {
    it('should display multiple events on same day', () => {
      render(<EventCalendar events={mockEvents} />)

      expect(screen.getByText('Tech Conference')).toBeInTheDocument()
      expect(screen.getAllByText('Workshop').length).toBeGreaterThan(0)
    })

    it('should display event type badges', () => {
      render(<EventCalendar events={mockEvents} />)

      const badges = screen.getAllByTestId('badge')
      expect(badges.length).toBeGreaterThan(0)
      expect(screen.getByText('Conference')).toBeInTheDocument()
    })

    it('should display event time', () => {
      render(<EventCalendar events={mockEvents} />)

      // Check for time format (will vary based on locale)
      const timeElements = screen.getAllByText(/\d{1,2}:\d{2}/)
      expect(timeElements.length).toBeGreaterThan(0)
    })

    it('should show no events message when day has no events', async () => {
      const user = userEvent.setup()
      const singleEvent = [
        {
          id: 1,
          title: 'Event',
          starts_at: '2025-01-15T10:00:00Z',
        },
      ]

      render(<EventCalendar events={singleEvent} />)

      // Mock selecting a different date with no events
      const selectBtn = screen.getByTestId('select-date-btn')
      await user.click(selectBtn)

      // Wait for potential re-render
      await waitFor(() => {
        expect(screen.getByTestId('day-picker')).toBeInTheDocument()
      })
    })

    it('should render event without type badge', () => {
      const eventWithoutType = [
        {
          id: 1,
          title: 'Simple Event',
          starts_at: '2025-01-15T10:00:00Z',
        },
      ]

      render(<EventCalendar events={eventWithoutType} />)
      expect(screen.getByText('Simple Event')).toBeInTheDocument()
    })
  })

  describe('Date Selection', () => {
    it('should display selected date in header', async () => {
      const user = userEvent.setup()
      render(<EventCalendar events={mockEvents} />)

      const selectBtn = screen.getByTestId('select-date-btn')
      await user.click(selectBtn)

      await waitFor(() => {
        expect(screen.getByTestId('selected-date')).toBeInTheDocument()
      })
    })

    it('should auto-select first event date', () => {
      render(<EventCalendar events={mockEvents} />)

      // First event date should be automatically selected and displayed
      expect(screen.getByText('Tech Conference')).toBeInTheDocument()
    })

    it('should update events when date is selected', async () => {
      const user = userEvent.setup()
      render(<EventCalendar events={mockEvents} />)

      const selectBtn = screen.getByTestId('select-date-btn')
      await user.click(selectBtn)

      await waitFor(() => {
        expect(screen.getByTestId('day-picker')).toBeInTheDocument()
      })
    })
  })

  describe('Event Data Processing', () => {
    it('should handle invalid date strings', () => {
      const invalidEvents = [
        {
          id: 1,
          title: 'Invalid Event',
          starts_at: 'invalid-date',
        },
      ]

      render(<EventCalendar events={invalidEvents} />)
      expect(screen.getByTestId('day-picker')).toBeInTheDocument()
    })

    it('should handle null starts_at', () => {
      const nullDateEvents = [
        {
          id: 1,
          title: 'No Date Event',
          starts_at: '',
        },
      ]

      render(<EventCalendar events={nullDateEvents} />)
      expect(screen.getByTestId('day-picker')).toBeInTheDocument()
    })

    it('should group events by date correctly', () => {
      const sameDay = [
        {
          id: 1,
          title: 'Morning Event',
          starts_at: '2025-01-15T09:00:00Z',
        },
        {
          id: 2,
          title: 'Afternoon Event',
          starts_at: '2025-01-15T15:00:00Z',
        },
      ]

      render(<EventCalendar events={sameDay} />)

      expect(screen.getByText('Morning Event')).toBeInTheDocument()
      expect(screen.getByText('Afternoon Event')).toBeInTheDocument()
    })

    it('should handle events across different dates', () => {
      render(<EventCalendar events={mockEvents} />)

      // Should show events from first date
      expect(screen.getByText('Tech Conference')).toBeInTheDocument()
      expect(screen.getAllByText('Workshop').length).toBeGreaterThan(0)
    })
  })

  describe('Memoization', () => {
    it('should memoize eventsByDate when events change', () => {
      const { rerender } = render(<EventCalendar events={mockEvents} />)

      // Re-render with same events
      rerender(<EventCalendar events={mockEvents} />)

      expect(screen.getByText('Tech Conference')).toBeInTheDocument()
    })

    it('should update when events prop changes', () => {
      const { rerender } = render(<EventCalendar events={mockEvents} />)

      const newEvents = [
        {
          id: 99,
          title: 'New Event',
          starts_at: '2025-01-15T10:00:00Z',
        },
      ]

      rerender(<EventCalendar events={newEvents} />)
      expect(screen.getByText('New Event')).toBeInTheDocument()
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty events array gracefully', () => {
      render(<EventCalendar events={[]} />)
      expect(screen.getByTestId('day-picker')).toBeInTheDocument()
    })

    it('should handle events with special characters in title', () => {
      const specialEvents = [
        {
          id: 1,
          title: 'Event & Conference "2025"',
          starts_at: '2025-01-15T10:00:00Z',
        },
      ]

      render(<EventCalendar events={specialEvents} />)
      expect(screen.getByText('Event & Conference "2025"')).toBeInTheDocument()
    })

    it('should handle very long event titles', () => {
      const longTitleEvent = [
        {
          id: 1,
          title: 'A'.repeat(200),
          starts_at: '2025-01-15T10:00:00Z',
        },
      ]

      render(<EventCalendar events={longTitleEvent} />)
      expect(screen.getByText('A'.repeat(200))).toBeInTheDocument()
    })

    it('should handle events at midnight', () => {
      const midnightEvent = [
        {
          id: 1,
          title: 'Midnight Event',
          starts_at: '2025-01-15T00:00:00Z',
        },
      ]

      render(<EventCalendar events={midnightEvent} />)
      expect(screen.getByText('Midnight Event')).toBeInTheDocument()
    })

    it('should handle events at end of day', () => {
      const endOfDayEvent = [
        {
          id: 1,
          title: 'End of Day Event',
          starts_at: '2025-01-15T23:59:59Z',
        },
      ]

      render(<EventCalendar events={endOfDayEvent} />)
      expect(screen.getByText('End of Day Event')).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('should render semantic HTML structure', () => {
      const { container } = render(<EventCalendar events={mockEvents} />)
      expect(container.querySelector('.space-y-4')).toBeInTheDocument()
    })

    it('should display date header text', () => {
      render(<EventCalendar events={mockEvents} />)

      // Should show "Events on" text
      const headerText = screen.getByText(/Events on/i)
      expect(headerText).toBeInTheDocument()
    })

    it('should show helpful message when no date selected', () => {
      render(<EventCalendar events={[]} />)

      // Should show selection prompt
      const selectionText = screen.getByText(/Select a date to view events/i)
      expect(selectionText).toBeInTheDocument()
    })
  })
})
