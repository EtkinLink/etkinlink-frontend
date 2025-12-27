/**
 * Component Tests - AlertDialog
 * Test Type: Unit Testing
 * Coverage: Alert dialog component rendering
 */

import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from '../alert-dialog'

// Mock Radix UI AlertDialog
jest.mock('@radix-ui/react-alert-dialog', () => ({
  Root: ({ children }: any) => <div data-testid="alert-dialog-root">{children}</div>,
  Trigger: ({ children }: any) => <button data-testid="alert-trigger">{children}</button>,
  Portal: ({ children }: any) => <div data-testid="alert-portal">{children}</div>,
  Overlay: ({ children }: any) => <div data-testid="alert-overlay">{children}</div>,
  Content: ({ children }: any) => <div data-testid="alert-content">{children}</div>,
  Title: ({ children }: any) => <h2 data-testid="alert-title">{children}</h2>,
  Description: ({ children }: any) => <p data-testid="alert-description">{children}</p>,
  Action: ({ children }: any) => <button data-testid="alert-action">{children}</button>,
  Cancel: ({ children }: any) => <button data-testid="alert-cancel">{children}</button>,
}))

describe('AlertDialog Components', () => {
  describe('AlertDialog', () => {
    it('should render alert dialog', () => {
      render(<AlertDialog><div>Content</div></AlertDialog>)
      expect(screen.getByTestId('alert-dialog-root')).toBeInTheDocument()
    })
  })

  describe('AlertDialogTrigger', () => {
    it('should render trigger button', () => {
      render(<AlertDialogTrigger>Open</AlertDialogTrigger>)
      expect(screen.getByTestId('alert-trigger')).toBeInTheDocument()
      expect(screen.getByText('Open')).toBeInTheDocument()
    })
  })

  describe('AlertDialogContent', () => {
    it('should render content with overlay', () => {
      render(<AlertDialogContent>Dialog content</AlertDialogContent>)
      expect(screen.getByTestId('alert-portal')).toBeInTheDocument()
      expect(screen.getByTestId('alert-overlay')).toBeInTheDocument()
      expect(screen.getByTestId('alert-content')).toBeInTheDocument()
    })

    it('should apply custom className', () => {
      render(<AlertDialogContent className="custom">Content</AlertDialogContent>)
      expect(screen.getByTestId('alert-content')).toBeInTheDocument()
    })
  })

  describe('AlertDialogHeader', () => {
    it('should render header', () => {
      render(<AlertDialogHeader>Header</AlertDialogHeader>)
      expect(screen.getByText('Header')).toBeInTheDocument()
    })
  })

  describe('AlertDialogTitle', () => {
    it('should render title', () => {
      render(<AlertDialogTitle>Delete Item</AlertDialogTitle>)
      expect(screen.getByTestId('alert-title')).toBeInTheDocument()
      expect(screen.getByText('Delete Item')).toBeInTheDocument()
    })
  })

  describe('AlertDialogDescription', () => {
    it('should render description', () => {
      render(<AlertDialogDescription>Are you sure?</AlertDialogDescription>)
      expect(screen.getByTestId('alert-description')).toBeInTheDocument()
      expect(screen.getByText('Are you sure?')).toBeInTheDocument()
    })
  })

  describe('AlertDialogFooter', () => {
    it('should render footer', () => {
      render(<AlertDialogFooter>Footer content</AlertDialogFooter>)
      expect(screen.getByText('Footer content')).toBeInTheDocument()
    })
  })

  describe('AlertDialogAction', () => {
    it('should render action button', () => {
      render(<AlertDialogAction>Confirm</AlertDialogAction>)
      expect(screen.getByTestId('alert-action')).toBeInTheDocument()
      expect(screen.getByText('Confirm')).toBeInTheDocument()
    })
  })

  describe('AlertDialogCancel', () => {
    it('should render cancel button', () => {
      render(<AlertDialogCancel>Cancel</AlertDialogCancel>)
      expect(screen.getByTestId('alert-cancel')).toBeInTheDocument()
      expect(screen.getByText('Cancel')).toBeInTheDocument()
    })
  })

  describe('Complete AlertDialog', () => {
    it('should render complete alert dialog', () => {
      render(
        <AlertDialog>
          <AlertDialogTrigger>Delete</AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction>Continue</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )

      expect(screen.getByText('Delete')).toBeInTheDocument()
      expect(screen.getByText('Are you sure?')).toBeInTheDocument()
      expect(screen.getByText('This action cannot be undone.')).toBeInTheDocument()
      expect(screen.getByText('Cancel')).toBeInTheDocument()
      expect(screen.getByText('Continue')).toBeInTheDocument()
    })
  })
})
