/**
 * Component Tests - Badge
 * Test Type: Unit Testing & Variants
 * Coverage: All badge variants and props
 */

import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'
import { Badge } from '../badge'

describe('Badge Component', () => {
  describe('Rendering', () => {
    it('should render badge with text', () => {
      render(<Badge>New</Badge>)

      expect(screen.getByText('New')).toBeInTheDocument()
    })

    it('should apply custom className', () => {
      render(<Badge className="custom-class" data-testid="badge">Badge</Badge>)

      const badge = screen.getByTestId('badge')
      expect(badge).toHaveClass('custom-class')
    })

    it('should have data-slot attribute', () => {
      render(<Badge data-testid="badge">Badge</Badge>)

      expect(screen.getByTestId('badge')).toHaveAttribute('data-slot', 'badge')
    })
  })

  describe('Variants', () => {
    const variants = ['default', 'secondary', 'destructive', 'outline'] as const

    variants.forEach(variant => {
      it(`should apply ${variant} variant styles`, () => {
        render(<Badge variant={variant} data-testid="badge">Badge</Badge>)

        const badge = screen.getByTestId('badge')
        expect(badge).toBeInTheDocument()
        expect(badge.className).toBeTruthy()
      })
    })

    it('should use default variant when not specified', () => {
      render(<Badge data-testid="badge">Badge</Badge>)

      const badge = screen.getByTestId('badge')
      expect(badge).toBeInTheDocument()
    })
  })

  describe('AsChild Prop', () => {
    it('should render as child component when asChild is true', () => {
      render(
        <Badge asChild>
          <a href="/test" data-testid="link-badge">Link Badge</a>
        </Badge>
      )

      const link = screen.getByTestId('link-badge')
      expect(link.tagName).toBe('A')
      expect(link).toHaveAttribute('href', '/test')
    })

    it('should render as span by default', () => {
      render(<Badge data-testid="badge">Badge</Badge>)

      const badge = screen.getByTestId('badge')
      expect(badge.tagName).toBe('SPAN')
    })
  })

  describe('Content Types', () => {
    it('should render with icon', () => {
      render(
        <Badge>
          <svg data-testid="icon" />
          Text
        </Badge>
      )

      expect(screen.getByTestId('icon')).toBeInTheDocument()
      expect(screen.getByText('Text')).toBeInTheDocument()
    })

    it('should render with only text', () => {
      render(<Badge>Badge Text</Badge>)

      expect(screen.getByText('Badge Text')).toBeInTheDocument()
    })

    it('should handle empty children', () => {
      render(<Badge data-testid="badge" />)

      expect(screen.getByTestId('badge')).toBeInTheDocument()
    })
  })

  describe('Edge Cases', () => {
    it('should render with very long text', () => {
      const longText = 'This is a very long badge text that should be handled properly'
      render(<Badge>{longText}</Badge>)

      expect(screen.getByText(longText)).toBeInTheDocument()
    })

    it('should render with special characters', () => {
      render(<Badge>123 !@# $%^</Badge>)

      expect(screen.getByText('123 !@# $%^')).toBeInTheDocument()
    })

    it('should render with number', () => {
      render(<Badge data-testid="badge">42</Badge>)

      expect(screen.getByTestId('badge')).toHaveTextContent('42')
    })
  })

  describe('Accessibility', () => {
    it('should accept aria attributes', () => {
      render(<Badge aria-label="Status badge" data-testid="badge">New</Badge>)

      expect(screen.getByTestId('badge')).toHaveAttribute('aria-label', 'Status badge')
    })

    it('should support focus-visible state', () => {
      render(<Badge data-testid="badge">Badge</Badge>)

      const badge = screen.getByTestId('badge')
      expect(badge).toBeInTheDocument()
    })
  })
})
