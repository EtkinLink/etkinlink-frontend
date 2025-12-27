/**
 * Component Tests - Label
 * Test Type: Unit Testing & Accessibility
 * Coverage: Label rendering and accessibility
 */

import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'
import { Label } from '../label'

describe('Label Component', () => {
  describe('Rendering', () => {
    it('should render label with text', () => {
      render(<Label>Username</Label>)

      expect(screen.getByText('Username')).toBeInTheDocument()
    })

    it('should apply custom className', () => {
      render(<Label className="custom-label" data-testid="label">Label</Label>)

      const label = screen.getByTestId('label')
      expect(label).toHaveClass('custom-label')
    })

    it('should have data-slot attribute', () => {
      render(<Label data-testid="label">Label</Label>)

      expect(screen.getByTestId('label')).toHaveAttribute('data-slot', 'label')
    })
  })

  describe('Association with Inputs', () => {
    it('should associate with input using htmlFor', () => {
      render(
        <>
          <Label htmlFor="username">Username</Label>
          <input id="username" />
        </>
      )

      const label = screen.getByText('Username')
      expect(label).toHaveAttribute('for', 'username')
    })

    it('should work with nested input', () => {
      render(
        <Label>
          Email
          <input type="email" />
        </Label>
      )

      expect(screen.getByText('Email')).toBeInTheDocument()
      expect(screen.getByRole('textbox')).toBeInTheDocument()
    })
  })

  describe('Content Types', () => {
    it('should render with icon', () => {
      render(
        <Label>
          <svg data-testid="icon" />
          Label Text
        </Label>
      )

      expect(screen.getByTestId('icon')).toBeInTheDocument()
      expect(screen.getByText('Label Text')).toBeInTheDocument()
    })

    it('should handle multiple children', () => {
      render(
        <Label>
          <span>Required</span>
          <span>*</span>
        </Label>
      )

      expect(screen.getByText('Required')).toBeInTheDocument()
      expect(screen.getByText('*')).toBeInTheDocument()
    })
  })

  describe('Edge Cases', () => {
    it('should render with empty children', () => {
      render(<Label data-testid="label" />)

      expect(screen.getByTestId('label')).toBeInTheDocument()
    })

    it('should render with special characters', () => {
      render(<Label>Email Address *</Label>)

      expect(screen.getByText('Email Address *')).toBeInTheDocument()
    })

    it('should handle very long text', () => {
      const longText = 'This is a very long label text that should wrap properly'
      render(<Label>{longText}</Label>)

      expect(screen.getByText(longText)).toBeInTheDocument()
    })
  })
})
