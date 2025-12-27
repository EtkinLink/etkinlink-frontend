/**
 * Component Tests - Input
 * Test Type: Unit Testing & Accessibility
 * Coverage: Props, states, user interactions
 */

import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Input } from '../input'

describe('Input Component', () => {
  describe('Rendering', () => {
    it('should render input element', () => {
      render(<Input />)

      const input = screen.getByRole('textbox')
      expect(input).toBeInTheDocument()
    })

    it('should render with placeholder', () => {
      render(<Input placeholder="Enter text" />)

      expect(screen.getByPlaceholderText('Enter text')).toBeInTheDocument()
    })

    it('should apply custom className', () => {
      render(<Input className="custom-class" data-testid="input" />)

      const input = screen.getByTestId('input')
      expect(input).toHaveClass('custom-class')
    })
  })

  describe('Input Types', () => {
    const types = ['text', 'email', 'password', 'number', 'tel', 'url'] as const

    types.forEach(type => {
      it(`should render with type="${type}"`, () => {
        render(<Input type={type} data-testid="input" />)

        const input = screen.getByTestId('input')
        expect(input).toHaveAttribute('type', type)
      })
    })
  })

  describe('User Interactions', () => {
    it('should accept user input', async () => {
      const user = userEvent.setup()
      render(<Input data-testid="input" />)

      const input = screen.getByTestId('input') as HTMLInputElement
      await user.type(input, 'Hello World')

      expect(input.value).toBe('Hello World')
    })

    it('should call onChange handler', async () => {
      const user = userEvent.setup()
      const handleChange = jest.fn()
      render(<Input onChange={handleChange} data-testid="input" />)

      const input = screen.getByTestId('input')
      await user.type(input, 'a')

      expect(handleChange).toHaveBeenCalled()
    })

    it('should not accept input when disabled', async () => {
      const user = userEvent.setup()
      render(<Input disabled data-testid="input" />)

      const input = screen.getByTestId('input') as HTMLInputElement
      await user.type(input, 'test')

      expect(input.value).toBe('')
    })
  })

  describe('States', () => {
    it('should be disabled when disabled prop is true', () => {
      render(<Input disabled data-testid="input" />)

      const input = screen.getByTestId('input')
      expect(input).toBeDisabled()
    })

    it('should be read-only when readOnly prop is true', () => {
      render(<Input readOnly data-testid="input" />)

      const input = screen.getByTestId('input')
      expect(input).toHaveAttribute('readOnly')
    })

    it('should be required when required prop is true', () => {
      render(<Input required data-testid="input" />)

      const input = screen.getByTestId('input')
      expect(input).toBeRequired()
    })
  })

  describe('Accessibility', () => {
    it('should have data-slot attribute', () => {
      render(<Input data-testid="input" />)

      const input = screen.getByTestId('input')
      expect(input).toHaveAttribute('data-slot', 'input')
    })

    it('should accept aria-label', () => {
      render(<Input aria-label="Username" />)

      expect(screen.getByLabelText('Username')).toBeInTheDocument()
    })

    it('should accept aria-invalid attribute', () => {
      render(<Input aria-invalid="true" data-testid="input" />)

      const input = screen.getByTestId('input')
      expect(input).toHaveAttribute('aria-invalid', 'true')
    })
  })

  describe('Value Handling', () => {
    it('should render with default value', () => {
      render(<Input defaultValue="default" data-testid="input" />)

      const input = screen.getByTestId('input') as HTMLInputElement
      expect(input.value).toBe('default')
    })

    it('should render with controlled value', () => {
      render(<Input value="controlled" onChange={() => {}} data-testid="input" />)

      const input = screen.getByTestId('input') as HTMLInputElement
      expect(input.value).toBe('controlled')
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty string value', () => {
      render(<Input value="" onChange={() => {}} data-testid="input" />)

      const input = screen.getByTestId('input') as HTMLInputElement
      expect(input.value).toBe('')
    })

    it('should handle special characters', async () => {
      const user = userEvent.setup()
      render(<Input data-testid="input" />)

      const input = screen.getByTestId('input') as HTMLInputElement
      await user.type(input, '!@#$%^&*()')

      expect(input.value).toBe('!@#$%^&*()')
    })
  })
})
