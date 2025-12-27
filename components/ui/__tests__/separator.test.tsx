/**
 * Component Tests - Separator
 * Test Type: Unit Testing
 * Coverage: Separator component with orientations
 */

import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'
import { Separator } from '../separator'

// Mock Radix UI Separator
jest.mock('@radix-ui/react-separator', () => ({
  Root: ({ children, orientation, decorative, ...props }: any) => (
    <hr
      data-orientation={orientation}
      aria-orientation={orientation}
      role={decorative ? 'none' : 'separator'}
      {...props}
    >
      {children}
    </hr>
  ),
}))

describe('Separator Component', () => {
  describe('Rendering', () => {
    it('should render separator', () => {
      render(<Separator data-testid="separator" />)

      const separator = screen.getByTestId('separator')
      expect(separator).toBeInTheDocument()
    })

    it('should have data-slot attribute', () => {
      render(<Separator data-testid="separator" />)

      const separator = screen.getByTestId('separator')
      expect(separator).toHaveAttribute('data-slot', 'separator')
    })

    it('should apply custom className', () => {
      render(<Separator className="custom-class" data-testid="separator" />)

      const separator = screen.getByTestId('separator')
      expect(separator).toHaveClass('custom-class')
    })
  })

  describe('Orientation', () => {
    it('should default to horizontal orientation', () => {
      render(<Separator data-testid="separator" />)

      const separator = screen.getByTestId('separator')
      expect(separator).toHaveAttribute('data-orientation', 'horizontal')
    })

    it('should support vertical orientation', () => {
      render(<Separator orientation="vertical" data-testid="separator" />)

      const separator = screen.getByTestId('separator')
      expect(separator).toHaveAttribute('data-orientation', 'vertical')
    })

    it('should support horizontal orientation explicitly', () => {
      render(<Separator orientation="horizontal" data-testid="separator" />)

      const separator = screen.getByTestId('separator')
      expect(separator).toHaveAttribute('data-orientation', 'horizontal')
    })
  })

  describe('Decorative', () => {
    it('should be decorative by default', () => {
      render(<Separator data-testid="separator" />)

      const separator = screen.getByTestId('separator')
      expect(separator).toHaveAttribute('role', 'none')
    })

    it('should support non-decorative mode', () => {
      render(<Separator decorative={false} data-testid="separator" />)

      const separator = screen.getByTestId('separator')
      expect(separator).toHaveAttribute('role', 'separator')
    })

    it('should be decorative when explicitly set', () => {
      render(<Separator decorative={true} data-testid="separator" />)

      const separator = screen.getByTestId('separator')
      expect(separator).toHaveAttribute('role', 'none')
    })
  })

  describe('Accessibility', () => {
    it('should have correct aria-orientation for horizontal', () => {
      render(<Separator orientation="horizontal" data-testid="separator" />)

      const separator = screen.getByTestId('separator')
      expect(separator).toHaveAttribute('aria-orientation', 'horizontal')
    })

    it('should have correct aria-orientation for vertical', () => {
      render(<Separator orientation="vertical" data-testid="separator" />)

      const separator = screen.getByTestId('separator')
      expect(separator).toHaveAttribute('aria-orientation', 'vertical')
    })
  })

  describe('Edge Cases', () => {
    it('should render without crashing when no props provided', () => {
      const { container } = render(<Separator />)
      expect(container).toBeInTheDocument()
    })

    it('should handle multiple separators', () => {
      render(
        <div>
          <Separator data-testid="sep1" />
          <Separator data-testid="sep2" />
          <Separator data-testid="sep3" />
        </div>
      )

      expect(screen.getByTestId('sep1')).toBeInTheDocument()
      expect(screen.getByTestId('sep2')).toBeInTheDocument()
      expect(screen.getByTestId('sep3')).toBeInTheDocument()
    })
  })
})
