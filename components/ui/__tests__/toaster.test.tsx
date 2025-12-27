/**
 * Component Tests - Toaster
 * Test Type: Integration Testing
 * Coverage: Toaster component with useToast hook
 */

import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'
import { Toaster } from '../toaster'

// Mock useToast hook
jest.mock('@/hooks/use-toast', () => ({
  useToast: jest.fn(() => ({
    toasts: [],
  })),
}))

// Mock Toast components
jest.mock('../toast', () => ({
  ToastProvider: ({ children }: any) => <div data-testid="toast-provider">{children}</div>,
  ToastViewport: () => <div data-testid="toast-viewport" />,
  Toast: ({ children }: any) => <div data-testid="toast">{children}</div>,
  ToastTitle: ({ children }: any) => <div data-testid="toast-title">{children}</div>,
  ToastDescription: ({ children }: any) => <div data-testid="toast-description">{children}</div>,
  ToastClose: () => <button data-testid="toast-close">Close</button>,
}))

describe('Toaster Component', () => {
  const { useToast } = require('@/hooks/use-toast')

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Rendering', () => {
    it('should render toaster with provider and viewport', () => {
      useToast.mockReturnValue({ toasts: [] })

      render(<Toaster />)

      expect(screen.getByTestId('toast-provider')).toBeInTheDocument()
      expect(screen.getByTestId('toast-viewport')).toBeInTheDocument()
    })

    it('should render without toasts when array is empty', () => {
      useToast.mockReturnValue({ toasts: [] })

      render(<Toaster />)

      expect(screen.queryByTestId('toast')).not.toBeInTheDocument()
    })
  })

  describe('Toast Rendering', () => {
    it('should render single toast', () => {
      useToast.mockReturnValue({
        toasts: [
          {
            id: '1',
            title: 'Success',
            description: 'Operation completed',
          },
        ],
      })

      render(<Toaster />)

      expect(screen.getByTestId('toast')).toBeInTheDocument()
      expect(screen.getByText('Success')).toBeInTheDocument()
      expect(screen.getByText('Operation completed')).toBeInTheDocument()
    })

    it('should render multiple toasts', () => {
      useToast.mockReturnValue({
        toasts: [
          {
            id: '1',
            title: 'Toast 1',
          },
          {
            id: '2',
            title: 'Toast 2',
          },
          {
            id: '3',
            title: 'Toast 3',
          },
        ],
      })

      render(<Toaster />)

      const toasts = screen.getAllByTestId('toast')
      expect(toasts).toHaveLength(3)
      expect(screen.getByText('Toast 1')).toBeInTheDocument()
      expect(screen.getByText('Toast 2')).toBeInTheDocument()
      expect(screen.getByText('Toast 3')).toBeInTheDocument()
    })

    it('should render toast with only title', () => {
      useToast.mockReturnValue({
        toasts: [
          {
            id: '1',
            title: 'Just a title',
          },
        ],
      })

      render(<Toaster />)

      expect(screen.getByText('Just a title')).toBeInTheDocument()
      expect(screen.queryByTestId('toast-description')).not.toBeInTheDocument()
    })

    it('should render toast with only description', () => {
      useToast.mockReturnValue({
        toasts: [
          {
            id: '1',
            description: 'Just a description',
          },
        ],
      })

      render(<Toaster />)

      expect(screen.getByText('Just a description')).toBeInTheDocument()
      expect(screen.queryByTestId('toast-title')).not.toBeInTheDocument()
    })

    it('should render toast with action', () => {
      useToast.mockReturnValue({
        toasts: [
          {
            id: '1',
            title: 'Action Toast',
            action: <button data-testid="custom-action">Undo</button>,
          },
        ],
      })

      render(<Toaster />)

      expect(screen.getByTestId('custom-action')).toBeInTheDocument()
    })

    it('should always render close button', () => {
      useToast.mockReturnValue({
        toasts: [
          {
            id: '1',
            title: 'Closeable',
          },
        ],
      })

      render(<Toaster />)

      expect(screen.getByTestId('toast-close')).toBeInTheDocument()
    })
  })

  describe('Toast Variants', () => {
    it('should render toast with variant', () => {
      useToast.mockReturnValue({
        toasts: [
          {
            id: '1',
            title: 'Error',
            variant: 'destructive',
          },
        ],
      })

      render(<Toaster />)

      expect(screen.getByTestId('toast')).toBeInTheDocument()
      expect(screen.getByText('Error')).toBeInTheDocument()
    })
  })

  describe('Edge Cases', () => {
    it('should render without crashing when toasts is empty', () => {
      useToast.mockReturnValue({ toasts: [] })

      const { container } = render(<Toaster />)
      expect(container).toBeInTheDocument()
      expect(screen.queryByTestId('toast')).not.toBeInTheDocument()
    })

    it('should handle null values in toast', () => {
      useToast.mockReturnValue({
        toasts: [
          {
            id: '1',
            title: null,
            description: null,
          },
        ],
      })

      render(<Toaster />)

      expect(screen.getByTestId('toast')).toBeInTheDocument()
    })
  })
})
