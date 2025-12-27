/**
 * Component Tests - Toast
 * Test Type: Unit Testing
 * Coverage: Toast component rendering
 */

import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'
import {
  ToastProvider,
  ToastViewport,
  Toast,
  ToastTitle,
  ToastDescription,
  ToastClose,
  ToastAction,
} from '../toast'

// Mock Radix UI Toast
jest.mock('@radix-ui/react-toast', () => ({
  Provider: ({ children }: any) => <div data-testid="toast-provider">{children}</div>,
  Viewport: ({ children }: any) => <div data-testid="toast-viewport">{children}</div>,
  Root: ({ children, variant }: any) => (
    <div data-testid="toast-root" data-variant={variant}>
      {children}
    </div>
  ),
  Title: ({ children }: any) => <div data-testid="toast-title">{children}</div>,
  Description: ({ children }: any) => <div data-testid="toast-description">{children}</div>,
  Close: ({ children }: any) => <button data-testid="toast-close">{children}</button>,
  Action: ({ children }: any) => <button data-testid="toast-action">{children}</button>,
}))

describe('Toast Components', () => {
  describe('ToastProvider', () => {
    it('should render toast provider', () => {
      render(<ToastProvider><div>Content</div></ToastProvider>)
      expect(screen.getByTestId('toast-provider')).toBeInTheDocument()
    })
  })

  describe('ToastViewport', () => {
    it('should render viewport', () => {
      render(<ToastViewport />)
      expect(screen.getByTestId('toast-viewport')).toBeInTheDocument()
    })

    it('should apply custom className', () => {
      const { container } = render(<ToastViewport className="custom" />)
      expect(screen.getByTestId('toast-viewport')).toBeInTheDocument()
    })
  })

  describe('Toast', () => {
    it('should render toast', () => {
      render(<Toast>Toast message</Toast>)
      expect(screen.getByTestId('toast-root')).toBeInTheDocument()
      expect(screen.getByText('Toast message')).toBeInTheDocument()
    })

    it('should render default variant', () => {
      render(<Toast>Default toast</Toast>)
      expect(screen.getByTestId('toast-root')).toBeInTheDocument()
    })

    it('should render destructive variant', () => {
      render(<Toast variant="destructive">Error toast</Toast>)
      expect(screen.getByTestId('toast-root')).toBeInTheDocument()
    })

    it('should render success variant', () => {
      render(<Toast variant="success">Success toast</Toast>)
      expect(screen.getByTestId('toast-root')).toBeInTheDocument()
    })
  })

  describe('ToastTitle', () => {
    it('should render toast title', () => {
      render(<ToastTitle>Toast Title</ToastTitle>)
      expect(screen.getByTestId('toast-title')).toBeInTheDocument()
      expect(screen.getByText('Toast Title')).toBeInTheDocument()
    })

    it('should apply custom className', () => {
      render(<ToastTitle className="custom-title">Title</ToastTitle>)
      expect(screen.getByTestId('toast-title')).toBeInTheDocument()
    })
  })

  describe('ToastDescription', () => {
    it('should render toast description', () => {
      render(<ToastDescription>Toast description text</ToastDescription>)
      expect(screen.getByTestId('toast-description')).toBeInTheDocument()
      expect(screen.getByText('Toast description text')).toBeInTheDocument()
    })

    it('should apply custom className', () => {
      render(<ToastDescription className="custom-desc">Description</ToastDescription>)
      expect(screen.getByTestId('toast-description')).toBeInTheDocument()
    })
  })

  describe('ToastClose', () => {
    it('should render close button', () => {
      render(<ToastClose />)
      expect(screen.getByTestId('toast-close')).toBeInTheDocument()
    })

    it('should apply custom className', () => {
      render(<ToastClose className="custom-close" />)
      expect(screen.getByTestId('toast-close')).toBeInTheDocument()
    })
  })

  describe('ToastAction', () => {
    it('should render action button', () => {
      render(<ToastAction altText="Undo">Undo</ToastAction>)
      expect(screen.getByTestId('toast-action')).toBeInTheDocument()
      expect(screen.getByText('Undo')).toBeInTheDocument()
    })

    it('should apply custom className', () => {
      render(<ToastAction altText="Action" className="custom-action">Action</ToastAction>)
      expect(screen.getByTestId('toast-action')).toBeInTheDocument()
    })
  })

  describe('Complete Toast', () => {
    it('should render complete toast with all parts', () => {
      render(
        <ToastProvider>
          <Toast>
            <ToastTitle>Success</ToastTitle>
            <ToastDescription>Your changes have been saved.</ToastDescription>
            <ToastAction altText="Undo">Undo</ToastAction>
            <ToastClose />
          </Toast>
          <ToastViewport />
        </ToastProvider>
      )

      expect(screen.getByText('Success')).toBeInTheDocument()
      expect(screen.getByText('Your changes have been saved.')).toBeInTheDocument()
      expect(screen.getByText('Undo')).toBeInTheDocument()
      expect(screen.getByTestId('toast-close')).toBeInTheDocument()
    })

    it('should render destructive toast', () => {
      render(
        <Toast variant="destructive">
          <ToastTitle>Error</ToastTitle>
          <ToastDescription>Something went wrong.</ToastDescription>
        </Toast>
      )

      expect(screen.getByText('Error')).toBeInTheDocument()
      expect(screen.getByText('Something went wrong.')).toBeInTheDocument()
    })
  })
})
