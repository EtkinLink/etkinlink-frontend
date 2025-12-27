/**
 * Component Tests - Textarea
 * Test Type: Unit Testing & User Interaction
 * Coverage: Textarea props, states, and user input
 */

import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Textarea } from '../textarea'

describe('Textarea Component', () => {
  describe('Rendering', () => {
    it('should render textarea element', () => {
      render(<Textarea data-testid="textarea" />)

      const textarea = screen.getByTestId('textarea')
      expect(textarea).toBeInTheDocument()
      expect(textarea.tagName).toBe('TEXTAREA')
    })

    it('should render with placeholder', () => {
      render(<Textarea placeholder="Enter description" />)

      expect(screen.getByPlaceholderText('Enter description')).toBeInTheDocument()
    })

    it('should apply custom className', () => {
      render(<Textarea className="custom-class" data-testid="textarea" />)

      const textarea = screen.getByTestId('textarea')
      expect(textarea).toHaveClass('custom-class')
    })
  })

  describe('User Interactions', () => {
    it('should accept user input', async () => {
      const user = userEvent.setup()
      render(<Textarea data-testid="textarea" />)

      const textarea = screen.getByTestId('textarea') as HTMLTextAreaElement
      await user.type(textarea, 'Hello World')

      expect(textarea.value).toBe('Hello World')
    })

    it('should accept multiline input', async () => {
      const user = userEvent.setup()
      render(<Textarea data-testid="textarea" />)

      const textarea = screen.getByTestId('textarea') as HTMLTextAreaElement
      await user.type(textarea, 'Line 1{Enter}Line 2{Enter}Line 3')

      expect(textarea.value).toContain('Line 1')
      expect(textarea.value).toContain('Line 2')
      expect(textarea.value).toContain('Line 3')
    })

    it('should call onChange handler', async () => {
      const user = userEvent.setup()
      const handleChange = jest.fn()
      render(<Textarea onChange={handleChange} data-testid="textarea" />)

      const textarea = screen.getByTestId('textarea')
      await user.type(textarea, 'a')

      expect(handleChange).toHaveBeenCalled()
    })

    it('should not accept input when disabled', async () => {
      const user = userEvent.setup()
      render(<Textarea disabled data-testid="textarea" />)

      const textarea = screen.getByTestId('textarea') as HTMLTextAreaElement
      await user.type(textarea, 'test')

      expect(textarea.value).toBe('')
    })
  })

  describe('States', () => {
    it('should be disabled when disabled prop is true', () => {
      render(<Textarea disabled data-testid="textarea" />)

      const textarea = screen.getByTestId('textarea')
      expect(textarea).toBeDisabled()
    })

    it('should be read-only when readOnly prop is true', () => {
      render(<Textarea readOnly data-testid="textarea" />)

      const textarea = screen.getByTestId('textarea')
      expect(textarea).toHaveAttribute('readOnly')
    })

    it('should be required when required prop is true', () => {
      render(<Textarea required data-testid="textarea" />)

      const textarea = screen.getByTestId('textarea')
      expect(textarea).toBeRequired()
    })
  })

  describe('Value Handling', () => {
    it('should render with default value', () => {
      render(<Textarea defaultValue="default text" data-testid="textarea" />)

      const textarea = screen.getByTestId('textarea') as HTMLTextAreaElement
      expect(textarea.value).toBe('default text')
    })

    it('should render with controlled value', () => {
      render(<Textarea value="controlled" onChange={() => {}} data-testid="textarea" />)

      const textarea = screen.getByTestId('textarea') as HTMLTextAreaElement
      expect(textarea.value).toBe('controlled')
    })

    it('should handle empty string value', () => {
      render(<Textarea value="" onChange={() => {}} data-testid="textarea" />)

      const textarea = screen.getByTestId('textarea') as HTMLTextAreaElement
      expect(textarea.value).toBe('')
    })
  })

  describe('Size Attributes', () => {
    it('should accept rows attribute', () => {
      render(<Textarea rows={5} data-testid="textarea" />)

      const textarea = screen.getByTestId('textarea')
      expect(textarea).toHaveAttribute('rows', '5')
    })

    it('should accept cols attribute', () => {
      render(<Textarea cols={50} data-testid="textarea" />)

      const textarea = screen.getByTestId('textarea')
      expect(textarea).toHaveAttribute('cols', '50')
    })

    it('should accept maxLength attribute', () => {
      render(<Textarea maxLength={100} data-testid="textarea" />)

      const textarea = screen.getByTestId('textarea')
      expect(textarea).toHaveAttribute('maxLength', '100')
    })
  })

  describe('Accessibility', () => {
    it('should accept aria-label', () => {
      render(<Textarea aria-label="Description" data-testid="textarea" />)

      expect(screen.getByTestId('textarea')).toHaveAttribute('aria-label', 'Description')
    })

    it('should accept aria-invalid attribute', () => {
      render(<Textarea aria-invalid="true" data-testid="textarea" />)

      const textarea = screen.getByTestId('textarea')
      expect(textarea).toHaveAttribute('aria-invalid', 'true')
    })
  })

  describe('Edge Cases', () => {
    it('should handle very long text', async () => {
      const user = userEvent.setup()
      const longText = 'a'.repeat(1000)
      render(<Textarea data-testid="textarea" />)

      const textarea = screen.getByTestId('textarea') as HTMLTextAreaElement
      await user.type(textarea, longText)

      expect(textarea.value).toBe(longText)
    })

    it('should handle special characters', async () => {
      const user = userEvent.setup()
      render(<Textarea data-testid="textarea" />)

      const textarea = screen.getByTestId('textarea') as HTMLTextAreaElement
      await user.type(textarea, '!@#$%^&*()')

      expect(textarea.value).toBe('!@#$%^&*()')
    })
  })
})
