/**
 * Component Tests - Select
 * Test Type: Unit Testing
 * Coverage: Select component rendering
 */

import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  SelectGroup,
  SelectLabel,
} from '../select'

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  ChevronDownIcon: () => <span>▼</span>,
  ChevronUpIcon: () => <span>▲</span>,
  Check: () => <span>✓</span>,
}))

// Mock Radix UI Select
jest.mock('@radix-ui/react-select', () => ({
  Root: ({ children }: any) => <div data-testid="select-root">{children}</div>,
  Trigger: ({ children }: any) => <button data-testid="select-trigger">{children}</button>,
  Value: ({ children, placeholder }: any) => (
    <span data-testid="select-value">{children || placeholder}</span>
  ),
  Portal: ({ children }: any) => <div data-testid="select-portal">{children}</div>,
  Content: ({ children }: any) => <div data-testid="select-content">{children}</div>,
  Viewport: ({ children }: any) => <div data-testid="select-viewport">{children}</div>,
  Item: ({ children, value }: any) => (
    <div data-testid={`select-item-${value}`} data-value={value}>
      {children}
    </div>
  ),
  ItemText: ({ children }: any) => <span>{children}</span>,
  ItemIndicator: ({ children }: any) => <span>{children}</span>,
  Group: ({ children }: any) => <div data-testid="select-group">{children}</div>,
  Label: ({ children }: any) => <div data-testid="select-label">{children}</div>,
  ScrollUpButton: ({ children }: any) => <button data-testid="scroll-up">{children}</button>,
  ScrollDownButton: ({ children }: any) => <button data-testid="scroll-down">{children}</button>,
  Icon: ({ children }: any) => <span>{children}</span>,
  Separator: () => <hr data-testid="select-separator" />,
}))

describe('Select Components', () => {
  describe('Select', () => {
    it('should render select', () => {
      render(<Select><div>Content</div></Select>)
      expect(screen.getByTestId('select-root')).toBeInTheDocument()
    })
  })

  describe('SelectTrigger', () => {
    it('should render trigger', () => {
      render(<SelectTrigger>Select...</SelectTrigger>)
      expect(screen.getByTestId('select-trigger')).toBeInTheDocument()
    })

    it('should apply custom className', () => {
      render(<SelectTrigger className="custom-trigger">Select</SelectTrigger>)
      expect(screen.getByTestId('select-trigger')).toBeInTheDocument()
    })
  })

  describe('SelectValue', () => {
    it('should render value', () => {
      render(<SelectValue />)
      expect(screen.getByTestId('select-value')).toBeInTheDocument()
    })

    it('should render placeholder', () => {
      render(<SelectValue placeholder="Choose an option" />)
      expect(screen.getByText('Choose an option')).toBeInTheDocument()
    })
  })

  describe('SelectContent', () => {
    it('should render content', () => {
      render(<SelectContent>Options</SelectContent>)
      expect(screen.getByTestId('select-portal')).toBeInTheDocument()
      expect(screen.getByTestId('select-content')).toBeInTheDocument()
      expect(screen.getByTestId('select-viewport')).toBeInTheDocument()
    })

    it('should render scroll buttons', () => {
      render(<SelectContent>Options</SelectContent>)
      expect(screen.getByTestId('scroll-up')).toBeInTheDocument()
      expect(screen.getByTestId('scroll-down')).toBeInTheDocument()
    })
  })

  describe('SelectItem', () => {
    it('should render item', () => {
      render(<SelectItem value="option1">Option 1</SelectItem>)
      expect(screen.getByTestId('select-item-option1')).toBeInTheDocument()
      expect(screen.getByText('Option 1')).toBeInTheDocument()
    })

    it('should have value attribute', () => {
      render(<SelectItem value="test">Test</SelectItem>)
      expect(screen.getByTestId('select-item-test')).toHaveAttribute('data-value', 'test')
    })

    it('should apply custom className', () => {
      render(<SelectItem value="opt" className="custom-item">Option</SelectItem>)
      expect(screen.getByTestId('select-item-opt')).toBeInTheDocument()
    })
  })

  describe('SelectGroup', () => {
    it('should render group', () => {
      render(<SelectGroup>Group content</SelectGroup>)
      expect(screen.getByTestId('select-group')).toBeInTheDocument()
    })
  })

  describe('SelectLabel', () => {
    it('should render label', () => {
      render(<SelectLabel>Group Label</SelectLabel>)
      expect(screen.getByTestId('select-label')).toBeInTheDocument()
      expect(screen.getByText('Group Label')).toBeInTheDocument()
    })
  })

  describe('Complete Select', () => {
    it('should render complete select with groups', () => {
      render(
        <Select>
          <SelectTrigger>
            <SelectValue placeholder="Select a fruit" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>Fruits</SelectLabel>
              <SelectItem value="apple">Apple</SelectItem>
              <SelectItem value="banana">Banana</SelectItem>
            </SelectGroup>
            <SelectGroup>
              <SelectLabel>Vegetables</SelectLabel>
              <SelectItem value="carrot">Carrot</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      )

      expect(screen.getByText('Select a fruit')).toBeInTheDocument()
      expect(screen.getByText('Fruits')).toBeInTheDocument()
      expect(screen.getByText('Apple')).toBeInTheDocument()
      expect(screen.getByText('Banana')).toBeInTheDocument()
      expect(screen.getByText('Vegetables')).toBeInTheDocument()
      expect(screen.getByText('Carrot')).toBeInTheDocument()
    })
  })
})
