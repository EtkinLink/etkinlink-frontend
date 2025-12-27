/**
 * Component Tests - Tabs
 * Test Type: Unit Testing
 * Coverage: Tabs component basic rendering
 */

import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../tabs'

// Mock Radix UI Tabs
jest.mock('@radix-ui/react-tabs', () => ({
  Root: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  List: ({ children, ...props }: any) => <div role="tablist" {...props}>{children}</div>,
  Trigger: ({ children, value, ...props }: any) => (
    <button role="tab" data-value={value} {...props}>{children}</button>
  ),
  Content: ({ children, value, ...props }: any) => (
    <div role="tabpanel" data-value={value} {...props}>{children}</div>
  ),
}))

describe('Tabs Components', () => {
  describe('Tabs', () => {
    it('should render tabs container', () => {
      render(<Tabs data-testid="tabs"><div>Content</div></Tabs>)

      expect(screen.getByTestId('tabs')).toBeInTheDocument()
    })
  })

  describe('TabsList', () => {
    it('should render tabs list', () => {
      render(<TabsList data-testid="tabs-list"><div>Tabs</div></TabsList>)

      const list = screen.getByTestId('tabs-list')
      expect(list).toBeInTheDocument()
      expect(list).toHaveAttribute('role', 'tablist')
    })

    it('should apply custom className', () => {
      render(<TabsList className="custom-list" data-testid="tabs-list" />)

      expect(screen.getByTestId('tabs-list')).toHaveClass('custom-list')
    })
  })

  describe('TabsTrigger', () => {
    it('should render tab trigger', () => {
      render(<TabsTrigger value="tab1">Tab 1</TabsTrigger>)

      const trigger = screen.getByRole('tab')
      expect(trigger).toBeInTheDocument()
      expect(trigger).toHaveTextContent('Tab 1')
    })

    it('should have value attribute', () => {
      render(<TabsTrigger value="tab1" data-testid="trigger">Tab</TabsTrigger>)

      expect(screen.getByTestId('trigger')).toHaveAttribute('data-value', 'tab1')
    })

    it('should apply custom className', () => {
      render(<TabsTrigger value="tab1" className="custom-trigger" data-testid="trigger">Tab</TabsTrigger>)

      expect(screen.getByTestId('trigger')).toHaveClass('custom-trigger')
    })
  })

  describe('TabsContent', () => {
    it('should render tab content', () => {
      render(<TabsContent value="tab1">Content 1</TabsContent>)

      const content = screen.getByRole('tabpanel')
      expect(content).toBeInTheDocument()
      expect(content).toHaveTextContent('Content 1')
    })

    it('should have value attribute', () => {
      render(<TabsContent value="tab1" data-testid="content">Content</TabsContent>)

      expect(screen.getByTestId('content')).toHaveAttribute('data-value', 'tab1')
    })

    it('should apply custom className', () => {
      render(<TabsContent value="tab1" className="custom-content" data-testid="content">Content</TabsContent>)

      expect(screen.getByTestId('content')).toHaveClass('custom-content')
    })
  })

  describe('Complete Tabs', () => {
    it('should render complete tabs structure', () => {
      render(
        <Tabs defaultValue="tab1">
          <TabsList>
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
            <TabsTrigger value="tab2">Tab 2</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">Content 1</TabsContent>
          <TabsContent value="tab2">Content 2</TabsContent>
        </Tabs>
      )

      expect(screen.getByText('Tab 1')).toBeInTheDocument()
      expect(screen.getByText('Tab 2')).toBeInTheDocument()
      expect(screen.getByText('Content 1')).toBeInTheDocument()
      expect(screen.getByText('Content 2')).toBeInTheDocument()
    })
  })
})
