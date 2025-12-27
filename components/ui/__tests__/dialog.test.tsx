/**
 * Component Tests - Dialog
 * Test Type: Unit Testing
 * Coverage: Dialog component rendering
 */

import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../dialog'

// Mock Radix UI Dialog
jest.mock('@radix-ui/react-dialog', () => ({
  Root: ({ children }: any) => <div data-testid="dialog-root">{children}</div>,
  Trigger: ({ children }: any) => <button data-testid="dialog-trigger">{children}</button>,
  Portal: ({ children }: any) => <div data-testid="dialog-portal">{children}</div>,
  Overlay: ({ children }: any) => <div data-testid="dialog-overlay">{children}</div>,
  Content: ({ children }: any) => <div data-testid="dialog-content">{children}</div>,
  Title: ({ children }: any) => <h2 data-testid="dialog-title">{children}</h2>,
  Description: ({ children }: any) => <p data-testid="dialog-description">{children}</p>,
  Close: ({ children }: any) => <button data-testid="dialog-close">{children}</button>,
}))

describe('Dialog Components', () => {
  describe('Dialog', () => {
    it('should render dialog', () => {
      render(<Dialog><div>Content</div></Dialog>)
      expect(screen.getByTestId('dialog-root')).toBeInTheDocument()
    })
  })

  describe('DialogTrigger', () => {
    it('should render trigger button', () => {
      render(<DialogTrigger>Open Dialog</DialogTrigger>)
      expect(screen.getByTestId('dialog-trigger')).toBeInTheDocument()
      expect(screen.getByText('Open Dialog')).toBeInTheDocument()
    })
  })

  describe('DialogContent', () => {
    it('should render content with overlay', () => {
      render(<DialogContent>Dialog content</DialogContent>)
      expect(screen.getByTestId('dialog-portal')).toBeInTheDocument()
      expect(screen.getByTestId('dialog-overlay')).toBeInTheDocument()
      expect(screen.getByTestId('dialog-content')).toBeInTheDocument()
    })

    it('should render close button', () => {
      render(<DialogContent>Content</DialogContent>)
      expect(screen.getByTestId('dialog-close')).toBeInTheDocument()
    })

    it('should apply custom className', () => {
      render(<DialogContent className="custom">Content</DialogContent>)
      expect(screen.getByTestId('dialog-content')).toBeInTheDocument()
    })
  })

  describe('DialogHeader', () => {
    it('should render header', () => {
      render(<DialogHeader>Header</DialogHeader>)
      expect(screen.getByText('Header')).toBeInTheDocument()
    })

    it('should apply custom className', () => {
      const { container } = render(<DialogHeader className="custom-header">Header</DialogHeader>)
      expect(container.firstChild).toHaveClass('custom-header')
    })
  })

  describe('DialogTitle', () => {
    it('should render title', () => {
      render(<DialogTitle>Dialog Title</DialogTitle>)
      expect(screen.getByTestId('dialog-title')).toBeInTheDocument()
      expect(screen.getByText('Dialog Title')).toBeInTheDocument()
    })
  })

  describe('DialogDescription', () => {
    it('should render description', () => {
      render(<DialogDescription>Dialog description text</DialogDescription>)
      expect(screen.getByTestId('dialog-description')).toBeInTheDocument()
      expect(screen.getByText('Dialog description text')).toBeInTheDocument()
    })
  })

  describe('DialogFooter', () => {
    it('should render footer', () => {
      render(<DialogFooter>Footer content</DialogFooter>)
      expect(screen.getByText('Footer content')).toBeInTheDocument()
    })

    it('should apply custom className', () => {
      const { container } = render(<DialogFooter className="custom-footer">Footer</DialogFooter>)
      expect(container.firstChild).toHaveClass('custom-footer')
    })
  })

  describe('Complete Dialog', () => {
    it('should render complete dialog', () => {
      render(
        <Dialog>
          <DialogTrigger>Open</DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Profile</DialogTitle>
              <DialogDescription>
                Make changes to your profile here.
              </DialogDescription>
            </DialogHeader>
            <div>Form fields</div>
            <DialogFooter>
              <button>Save</button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )

      expect(screen.getByText('Open')).toBeInTheDocument()
      expect(screen.getByText('Edit Profile')).toBeInTheDocument()
      expect(screen.getByText('Make changes to your profile here.')).toBeInTheDocument()
      expect(screen.getByText('Form fields')).toBeInTheDocument()
      expect(screen.getByText('Save')).toBeInTheDocument()
    })
  })
})
