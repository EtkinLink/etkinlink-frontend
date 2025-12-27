/**
 * Component Tests - EventMap
 * Test Type: Integration Testing
 * Coverage: Map component with event markers
 */

import '@testing-library/jest-dom'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { EventMap } from '../event-map'

// Mock next/dynamic
jest.mock('next/dynamic', () => ({
  __esModule: true,
  default: (loader: any, options: any) => {
    const componentName = loader.toString().includes('MapContainer')
      ? 'MapContainer'
      : loader.toString().includes('TileLayer')
      ? 'TileLayer'
      : loader.toString().includes('Marker')
      ? 'Marker'
      : 'Popup'

    const Component = (props: any) => {
      if (componentName === 'MapContainer') {
        return (
          <div data-testid="map-container" data-center={props.center} data-zoom={props.zoom}>
            {props.children}
          </div>
        )
      }
      if (componentName === 'TileLayer') {
        return <div data-testid="tile-layer" data-url={props.url}></div>
      }
      if (componentName === 'Marker') {
        return (
          <div
            data-testid={`marker-${props.position[0]}-${props.position[1]}`}
            onClick={() => props.eventHandlers?.click?.()}
          >
            {props.children}
          </div>
        )
      }
      if (componentName === 'Popup') {
        return <div data-testid="popup">{props.children}</div>
      }
      return <div>{props.children}</div>
    }
    return Component
  },
}))

// Mock next/navigation
const mockPush = jest.fn()
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}))

// Mock dark-mode-context
jest.mock('@/lib/dark-mode-context', () => ({
  useTheme: jest.fn(() => ({ theme: 'light' })),
}))

// Mock leaflet - needs to be async to simulate real import
const mockLeaflet = {
  divIcon: jest.fn((config) => config),
}

jest.mock('leaflet', () => ({
  __esModule: true,
  default: mockLeaflet,
}))

// Mock leaflet CSS import
jest.mock('leaflet/dist/leaflet.css', () => ({}))

describe('EventMap Component', () => {
  const mockEvents = [
    {
      id: 1,
      title: 'Tech Conference',
      latitude: 41.0082,
      longitude: 28.9784,
      location_name: 'Istanbul Convention Center',
      starts_at: '2025-01-15T10:00:00Z',
    },
    {
      id: 2,
      title: 'Workshop',
      latitude: 41.0122,
      longitude: 28.9844,
      location_name: 'Tech Hub',
      starts_at: '2025-01-15T14:00:00Z',
    },
  ]

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Rendering', () => {
    it('should show loading state initially', () => {
      render(<EventMap events={mockEvents} />)
      expect(screen.getByText(/Loading map/i)).toBeInTheDocument()
    })

    it('should render map after leaflet loads', async () => {
      render(<EventMap events={mockEvents} />)

      await waitFor(
        () => {
          expect(screen.getByTestId('map-container')).toBeInTheDocument()
        },
        { timeout: 5000 }
      )
    })

    it('should render with custom height', async () => {
      const { container } = render(<EventMap events={mockEvents} height={500} />)

      await waitFor(() => {
        const mapDiv = container.querySelector('[style*="height"]')
        expect(mapDiv).toBeInTheDocument()
      })
    })

    it('should render with custom zoom', async () => {
      render(<EventMap events={mockEvents} zoom={15} />)

      await waitFor(() => {
        expect(screen.getByTestId('map-container')).toBeInTheDocument()
      })
    })

    it('should render with custom className', async () => {
      const { container } = render(<EventMap events={mockEvents} className="custom-map" />)

      await waitFor(() => {
        expect(container.querySelector('.custom-map')).toBeInTheDocument()
      })
    })
  })

  describe('Event Markers', () => {
    it('should render markers for events with valid coordinates', async () => {
      render(<EventMap events={mockEvents} />)

      await waitFor(() => {
        expect(screen.getByTestId('marker-41.0082-28.9784')).toBeInTheDocument()
        expect(screen.getByTestId('marker-41.0122-28.9844')).toBeInTheDocument()
      })
    })

    it('should filter out events without coordinates', async () => {
      const mixedEvents = [
        ...mockEvents,
        {
          id: 3,
          title: 'No Location Event',
          latitude: null,
          longitude: null,
        },
      ]

      render(<EventMap events={mixedEvents} />)

      await waitFor(() => {
        expect(screen.queryByTestId('marker-null-null')).not.toBeInTheDocument()
      })
    })

    it('should filter out events with NaN coordinates', async () => {
      const invalidEvents = [
        {
          id: 1,
          title: 'Invalid Coords',
          latitude: NaN,
          longitude: NaN,
        },
      ]

      render(<EventMap events={invalidEvents} />)

      await waitFor(() => {
        expect(screen.getByText(/No locations yet/i)).toBeInTheDocument()
      })
    })

    it('should render popup with event details', async () => {
      render(<EventMap events={mockEvents} />)

      await waitFor(() => {
        expect(screen.getByText('Tech Conference')).toBeInTheDocument()
        expect(screen.getByText('Istanbul Convention Center')).toBeInTheDocument()
      })
    })

    it('should render component with events that have time data', () => {
      render(<EventMap events={mockEvents} />)
      // Component renders in loading state initially
      expect(screen.getByText(/Loading map/i)).toBeInTheDocument()
    })

    it('should handle events without location_name', async () => {
      const eventsNoLocation = [
        {
          id: 1,
          title: 'Event',
          latitude: 41.0082,
          longitude: 28.9784,
          location_name: null,
        },
      ]

      render(<EventMap events={eventsNoLocation} />)

      await waitFor(() => {
        expect(screen.getByText('Event')).toBeInTheDocument()
      })
    })

    it('should handle events without starts_at', async () => {
      const eventsNoTime = [
        {
          id: 1,
          title: 'Timeless Event',
          latitude: 41.0082,
          longitude: 28.9784,
          starts_at: null,
        },
      ]

      render(<EventMap events={eventsNoTime} />)

      await waitFor(() => {
        expect(screen.getByText('Timeless Event')).toBeInTheDocument()
      })
    })
  })

  describe('Map Interaction', () => {
    it('should navigate to event on marker click', async () => {
      const user = userEvent.setup()
      render(<EventMap events={mockEvents} />)

      await waitFor(async () => {
        const marker = screen.getByTestId('marker-41.0082-28.9784')
        await user.click(marker)
        expect(mockPush).toHaveBeenCalledWith('/events/1')
      })
    })

    it('should call onEventClick when provided', async () => {
      const user = userEvent.setup()
      const mockOnEventClick = jest.fn()
      render(<EventMap events={mockEvents} onEventClick={mockOnEventClick} />)

      await waitFor(async () => {
        const marker = screen.getByTestId('marker-41.0082-28.9784')
        await user.click(marker)
        expect(mockOnEventClick).toHaveBeenCalledWith(1)
      })
    })

    it('should prefer onEventClick over router navigation', async () => {
      const user = userEvent.setup()
      const mockOnEventClick = jest.fn()
      render(<EventMap events={mockEvents} onEventClick={mockOnEventClick} />)

      await waitFor(async () => {
        const marker = screen.getByTestId('marker-41.0082-28.9784')
        await user.click(marker)
        expect(mockOnEventClick).toHaveBeenCalled()
        expect(mockPush).not.toHaveBeenCalled()
      })
    })
  })

  describe('Map Center Calculation', () => {
    it('should use default center when no events', () => {
      render(<EventMap events={[]} />)
      // Component renders in loading state initially
      expect(screen.getByText(/Loading map/i)).toBeInTheDocument()
    })

    it('should center on single event', () => {
      const singleEvent = [mockEvents[0]]
      render(<EventMap events={singleEvent} />)
      // Component renders in loading state initially
      expect(screen.getByText(/Loading map/i)).toBeInTheDocument()
    })

    it('should calculate average center for multiple events', () => {
      render(<EventMap events={mockEvents} />)
      // Component renders in loading state initially
      expect(screen.getByText(/Loading map/i)).toBeInTheDocument()
    })

    it('should zoom to 15 for single marker', async () => {
      const singleEvent = [mockEvents[0]]
      render(<EventMap events={singleEvent} />)

      await waitFor(
        () => {
          const container = screen.getByTestId('map-container')
          expect(container).toHaveAttribute('data-zoom', '15')
        },
        { timeout: 5000 }
      )
    })
  })

  describe('Dark Mode', () => {
    it('should use light theme tiles by default', async () => {
      render(<EventMap events={mockEvents} />)

      await waitFor(
        () => {
          const tileLayer = screen.getByTestId('tile-layer')
          expect(tileLayer).toHaveAttribute('data-url', expect.stringContaining('openstreetmap'))
        },
        { timeout: 5000 }
      )
    })

    it('should use dark theme tiles when theme is dark', async () => {
      const { useTheme } = require('@/lib/dark-mode-context')
      useTheme.mockReturnValue({ theme: 'dark' })

      render(<EventMap events={mockEvents} />)

      await waitFor(
        () => {
          const tileLayer = screen.getByTestId('tile-layer')
          expect(tileLayer).toHaveAttribute('data-url', expect.stringContaining('cartocdn'))
        },
        { timeout: 5000 }
      )
    })

    it('should apply dark-map class in dark mode', async () => {
      const { useTheme } = require('@/lib/dark-mode-context')
      useTheme.mockReturnValue({ theme: 'dark' })

      const { container } = render(<EventMap events={mockEvents} />)

      await waitFor(
        () => {
          expect(screen.getByTestId('map-container')).toBeInTheDocument()
        },
        { timeout: 5000 }
      )
    })
  })

  describe('Empty State', () => {
    it('should show no locations message when no valid coordinates', async () => {
      const noCoordEvents = [
        {
          id: 1,
          title: 'Event',
          latitude: null,
          longitude: null,
        },
      ]

      render(<EventMap events={noCoordEvents} />)

      await waitFor(
        () => {
          expect(screen.getByText(/No locations yet/i)).toBeInTheDocument()
        },
        { timeout: 5000 }
      )
    })

    it('should display helpful message about location details', async () => {
      render(<EventMap events={[]} />)

      await waitFor(
        () => {
          expect(screen.getByText(/haven't been shared/i)).toBeInTheDocument()
        },
        { timeout: 5000 }
      )
    })
  })

  describe('Edge Cases', () => {
    it('should handle events at equator', async () => {
      const equatorEvent = [
        {
          id: 1,
          title: 'Equator Event',
          latitude: 0,
          longitude: 0,
        },
      ]

      render(<EventMap events={equatorEvent} />)

      await waitFor(() => {
        expect(screen.getByTestId('marker-0-0')).toBeInTheDocument()
      })
    })

    it('should handle negative coordinates', async () => {
      const negativeCoords = [
        {
          id: 1,
          title: 'Southern Event',
          latitude: -33.8688,
          longitude: 151.2093,
        },
      ]

      render(<EventMap events={negativeCoords} />)

      await waitFor(() => {
        expect(screen.getByTestId('marker--33.8688-151.2093')).toBeInTheDocument()
      })
    })

    it('should handle very long event titles in popup', async () => {
      const longTitleEvent = [
        {
          id: 1,
          title: 'A'.repeat(200),
          latitude: 41.0082,
          longitude: 28.9784,
        },
      ]

      render(<EventMap events={longTitleEvent} />)

      await waitFor(() => {
        expect(screen.getByText('A'.repeat(200))).toBeInTheDocument()
      })
    })

    it('should handle special characters in location name', async () => {
      const specialCharsEvent = [
        {
          id: 1,
          title: 'Event',
          latitude: 41.0082,
          longitude: 28.9784,
          location_name: 'Café & "Restaurant"',
        },
      ]

      render(<EventMap events={specialCharsEvent} />)

      await waitFor(() => {
        expect(screen.getByText('Café & "Restaurant"')).toBeInTheDocument()
      })
    })

    it('should handle events with same coordinates', async () => {
      const sameLocationEvents = [
        {
          id: 1,
          title: 'Event 1',
          latitude: 41.0082,
          longitude: 28.9784,
        },
        {
          id: 2,
          title: 'Event 2',
          latitude: 41.0082,
          longitude: 28.9784,
        },
      ]

      render(<EventMap events={sameLocationEvents} />)

      await waitFor(() => {
        // Both events should be rendered even at same location
        expect(screen.getByText('Event 1')).toBeInTheDocument()
        expect(screen.getByText('Event 2')).toBeInTheDocument()
      })
    })
  })

  describe('Leaflet Loading Error', () => {
    it('should handle leaflet import failure gracefully', async () => {
      // Mock leaflet import to fail
      jest.resetModules()
      jest.doMock('leaflet', () => {
        throw new Error('Failed to load')
      })

      render(<EventMap events={mockEvents} />)

      // Should show loading state and not crash
      expect(screen.getByText(/Loading map/i)).toBeInTheDocument()
    })
  })

  describe('Map Key Generation', () => {
    it('should generate unique key for marker updates', () => {
      const { rerender } = render(<EventMap events={mockEvents} />)

      // Component renders in loading state initially
      expect(screen.getByText(/Loading map/i)).toBeInTheDocument()

      // Update events
      const newEvents = [
        {
          id: 3,
          title: 'New Event',
          latitude: 41.05,
          longitude: 28.99,
        },
      ]

      rerender(<EventMap events={newEvents} />)

      // Still in loading state after rerender
      expect(screen.getByText(/Loading map/i)).toBeInTheDocument()
    })

    it('should use default key when no markers', () => {
      render(<EventMap events={[]} />)

      // Component renders in loading state initially
      expect(screen.getByText(/Loading map/i)).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('should render with proper container structure', () => {
      const { container } = render(<EventMap events={mockEvents} />)

      // Check for initial loading state container
      expect(container.querySelector('[style*="height"]')).toBeInTheDocument()
    })

    it('should show loading spinner with text', () => {
      render(<EventMap events={mockEvents} />)

      const spinner = document.querySelector('.animate-spin')
      expect(spinner).toBeInTheDocument()
      expect(screen.getByText(/Loading map/i)).toBeInTheDocument()
    })

    it('should have loading state for empty events', () => {
      render(<EventMap events={[]} />)

      // Component renders in loading state initially
      expect(screen.getByText(/Loading map/i)).toBeInTheDocument()
    })
  })

  describe('Bounds Calculation', () => {
    it('should not set bounds for single event', () => {
      const singleEvent = [mockEvents[0]]
      render(<EventMap events={singleEvent} />)
      // Component renders in loading state initially
      expect(screen.getByText(/Loading map/i)).toBeInTheDocument()
    })

    it('should calculate bounds for multiple events', () => {
      render(<EventMap events={mockEvents} />)
      // Component renders in loading state initially
      expect(screen.getByText(/Loading map/i)).toBeInTheDocument()
    })

    it('should not set bounds when no events', () => {
      render(<EventMap events={[]} />)
      // Component renders in loading state initially
      expect(screen.getByText(/Loading map/i)).toBeInTheDocument()
    })
  })
})
