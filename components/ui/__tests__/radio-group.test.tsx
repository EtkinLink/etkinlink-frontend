/**
 * Component Tests - RadioGroup
 * Test Type: Unit Testing
 * Coverage: Radio group component rendering
 */

import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'
import { RadioGroup, RadioGroupItem } from '../radio-group'

// Mock Radix UI RadioGroup
jest.mock('@radix-ui/react-radio-group', () => ({
  Root: ({ children, ...props }: any) => <div role="radiogroup" {...props}>{children}</div>,
  Item: ({ children, value, ...props }: any) => (
    <button role="radio" data-value={value} {...props}>{children}</button>
  ),
  Indicator: ({ children, ...props }: any) => <span {...props}>{children}</span>,
}))

describe('RadioGroup Components', () => {
  describe('RadioGroup', () => {
    it('should render radio group', () => {
      render(<RadioGroup data-testid="radio-group"><div>Options</div></RadioGroup>)

      const group = screen.getByTestId('radio-group')
      expect(group).toBeInTheDocument()
      expect(group).toHaveAttribute('role', 'radiogroup')
    })

    it('should apply custom className', () => {
      render(<RadioGroup className="custom-group" data-testid="radio-group" />)

      expect(screen.getByTestId('radio-group')).toHaveClass('custom-group')
    })
  })

  describe('RadioGroupItem', () => {
    it('should render radio item', () => {
      render(<RadioGroupItem value="option1" data-testid="radio-item" />)

      const item = screen.getByTestId('radio-item')
      expect(item).toBeInTheDocument()
      expect(item).toHaveAttribute('role', 'radio')
    })

    it('should have value attribute', () => {
      render(<RadioGroupItem value="option1" data-testid="radio-item" />)

      expect(screen.getByTestId('radio-item')).toHaveAttribute('data-value', 'option1')
    })

    it('should apply custom className', () => {
      render(<RadioGroupItem value="option1" className="custom-item" data-testid="radio-item" />)

      expect(screen.getByTestId('radio-item')).toHaveClass('custom-item')
    })
  })

  describe('Complete RadioGroup', () => {
    it('should render complete radio group with multiple options', () => {
      render(
        <RadioGroup>
          <RadioGroupItem value="option1" data-testid="option1" />
          <RadioGroupItem value="option2" data-testid="option2" />
          <RadioGroupItem value="option3" data-testid="option3" />
        </RadioGroup>
      )

      expect(screen.getByTestId('option1')).toBeInTheDocument()
      expect(screen.getByTestId('option2')).toBeInTheDocument()
      expect(screen.getByTestId('option3')).toBeInTheDocument()
    })

    it('should render radio group with labels', () => {
      render(
        <RadioGroup>
          <div>
            <RadioGroupItem value="yes" id="yes" />
            <label htmlFor="yes">Yes</label>
          </div>
          <div>
            <RadioGroupItem value="no" id="no" />
            <label htmlFor="no">No</label>
          </div>
        </RadioGroup>
      )

      expect(screen.getByText('Yes')).toBeInTheDocument()
      expect(screen.getByText('No')).toBeInTheDocument()
    })
  })
})
