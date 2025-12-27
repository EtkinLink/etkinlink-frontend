/**
 * Component Tests - DropdownMenu
 * Test Type: Unit Testing
 * Coverage: Dropdown menu component rendering
 */

import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  DropdownMenuGroup,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from '../dropdown-menu'

// Mock Radix UI DropdownMenu
jest.mock('@radix-ui/react-dropdown-menu', () => ({
  Root: ({ children }: any) => <div data-testid="dropdown-root">{children}</div>,
  Trigger: ({ children }: any) => <button data-testid="dropdown-trigger">{children}</button>,
  Portal: ({ children }: any) => <div data-testid="dropdown-portal">{children}</div>,
  Content: ({ children }: any) => <div data-testid="dropdown-content">{children}</div>,
  Item: ({ children }: any) => <div data-testid="dropdown-item">{children}</div>,
  Separator: () => <hr data-testid="dropdown-separator" />,
  Label: ({ children }: any) => <div data-testid="dropdown-label">{children}</div>,
  Group: ({ children }: any) => <div data-testid="dropdown-group">{children}</div>,
  Sub: ({ children }: any) => <div data-testid="dropdown-sub">{children}</div>,
  SubTrigger: ({ children }: any) => <button data-testid="dropdown-subtrigger">{children}</button>,
  SubContent: ({ children }: any) => <div data-testid="dropdown-subcontent">{children}</div>,
  CheckboxItem: ({ children, checked }: any) => (
    <div data-testid="dropdown-checkbox" data-checked={checked}>
      {children}
    </div>
  ),
  ItemIndicator: ({ children }: any) => <span>{children}</span>,
  RadioGroup: ({ children }: any) => <div data-testid="dropdown-radiogroup">{children}</div>,
  RadioItem: ({ children, value }: any) => (
    <div data-testid={`dropdown-radio-${value}`}>{children}</div>
  ),
}))

describe('DropdownMenu Components', () => {
  describe('DropdownMenu', () => {
    it('should render dropdown menu', () => {
      render(<DropdownMenu><div>Content</div></DropdownMenu>)
      expect(screen.getByTestId('dropdown-root')).toBeInTheDocument()
    })
  })

  describe('DropdownMenuTrigger', () => {
    it('should render trigger', () => {
      render(<DropdownMenuTrigger>Open Menu</DropdownMenuTrigger>)
      expect(screen.getByTestId('dropdown-trigger')).toBeInTheDocument()
      expect(screen.getByText('Open Menu')).toBeInTheDocument()
    })
  })

  describe('DropdownMenuContent', () => {
    it('should render content', () => {
      render(<DropdownMenuContent>Menu items</DropdownMenuContent>)
      expect(screen.getByTestId('dropdown-portal')).toBeInTheDocument()
      expect(screen.getByTestId('dropdown-content')).toBeInTheDocument()
    })

    it('should apply custom className', () => {
      render(<DropdownMenuContent className="custom">Content</DropdownMenuContent>)
      expect(screen.getByTestId('dropdown-content')).toBeInTheDocument()
    })
  })

  describe('DropdownMenuItem', () => {
    it('should render menu item', () => {
      render(<DropdownMenuItem>Menu Item</DropdownMenuItem>)
      expect(screen.getByTestId('dropdown-item')).toBeInTheDocument()
      expect(screen.getByText('Menu Item')).toBeInTheDocument()
    })
  })

  describe('DropdownMenuSeparator', () => {
    it('should render separator', () => {
      render(<DropdownMenuSeparator />)
      expect(screen.getByTestId('dropdown-separator')).toBeInTheDocument()
    })
  })

  describe('DropdownMenuLabel', () => {
    it('should render label', () => {
      render(<DropdownMenuLabel>Actions</DropdownMenuLabel>)
      expect(screen.getByTestId('dropdown-label')).toBeInTheDocument()
      expect(screen.getByText('Actions')).toBeInTheDocument()
    })
  })

  describe('DropdownMenuGroup', () => {
    it('should render group', () => {
      render(<DropdownMenuGroup>Group content</DropdownMenuGroup>)
      expect(screen.getByTestId('dropdown-group')).toBeInTheDocument()
    })
  })

  describe('DropdownMenuCheckboxItem', () => {
    it('should render checkbox item', () => {
      render(<DropdownMenuCheckboxItem>Show Toolbar</DropdownMenuCheckboxItem>)
      expect(screen.getByTestId('dropdown-checkbox')).toBeInTheDocument()
      expect(screen.getByText('Show Toolbar')).toBeInTheDocument()
    })

    it('should handle checked state', () => {
      render(<DropdownMenuCheckboxItem checked>Enabled</DropdownMenuCheckboxItem>)
      expect(screen.getByTestId('dropdown-checkbox')).toHaveAttribute('data-checked', 'true')
    })
  })

  describe('DropdownMenuRadioGroup', () => {
    it('should render radio group', () => {
      render(<DropdownMenuRadioGroup>Radio options</DropdownMenuRadioGroup>)
      expect(screen.getByTestId('dropdown-radiogroup')).toBeInTheDocument()
    })
  })

  describe('DropdownMenuRadioItem', () => {
    it('should render radio item', () => {
      render(<DropdownMenuRadioItem value="option1">Option 1</DropdownMenuRadioItem>)
      expect(screen.getByTestId('dropdown-radio-option1')).toBeInTheDocument()
      expect(screen.getByText('Option 1')).toBeInTheDocument()
    })
  })

  describe('Complete DropdownMenu', () => {
    it('should render complete dropdown menu', () => {
      render(
        <DropdownMenu>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem>Profile</DropdownMenuItem>
              <DropdownMenuItem>Settings</DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Logout</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )

      expect(screen.getByText('Open')).toBeInTheDocument()
      expect(screen.getByText('My Account')).toBeInTheDocument()
      expect(screen.getByText('Profile')).toBeInTheDocument()
      expect(screen.getByText('Settings')).toBeInTheDocument()
      expect(screen.getByText('Logout')).toBeInTheDocument()
    })
  })
})
