/**
 * Component Tests - Card
 * Test Type: Unit Testing & Rendering
 * Coverage: All card components and their compositions
 */

import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  CardAction
} from '../card'

describe('Card Components', () => {
  describe('Card', () => {
    it('should render card', () => {
      render(<Card data-testid="card">Content</Card>)

      expect(screen.getByTestId('card')).toBeInTheDocument()
    })

    it('should apply custom className', () => {
      render(<Card className="custom-class" data-testid="card" />)

      expect(screen.getByTestId('card')).toHaveClass('custom-class')
    })

    it('should have data-slot attribute', () => {
      render(<Card data-testid="card" />)

      expect(screen.getByTestId('card')).toHaveAttribute('data-slot', 'card')
    })

    it('should render children', () => {
      render(
        <Card>
          <div>Child content</div>
        </Card>
      )

      expect(screen.getByText('Child content')).toBeInTheDocument()
    })
  })

  describe('CardHeader', () => {
    it('should render card header', () => {
      render(<CardHeader data-testid="header">Header</CardHeader>)

      expect(screen.getByTestId('header')).toBeInTheDocument()
    })

    it('should have data-slot attribute', () => {
      render(<CardHeader data-testid="header" />)

      expect(screen.getByTestId('header')).toHaveAttribute('data-slot', 'card-header')
    })

    it('should apply custom className', () => {
      render(<CardHeader className="custom-header" data-testid="header" />)

      expect(screen.getByTestId('header')).toHaveClass('custom-header')
    })
  })

  describe('CardTitle', () => {
    it('should render card title', () => {
      render(<CardTitle>My Title</CardTitle>)

      expect(screen.getByText('My Title')).toBeInTheDocument()
    })

    it('should have data-slot attribute', () => {
      render(<CardTitle data-testid="title">Title</CardTitle>)

      expect(screen.getByTestId('title')).toHaveAttribute('data-slot', 'card-title')
    })

    it('should apply custom className', () => {
      render(<CardTitle className="custom-title" data-testid="title">Title</CardTitle>)

      expect(screen.getByTestId('title')).toHaveClass('custom-title')
    })
  })

  describe('CardDescription', () => {
    it('should render card description', () => {
      render(<CardDescription>Description text</CardDescription>)

      expect(screen.getByText('Description text')).toBeInTheDocument()
    })

    it('should have data-slot attribute', () => {
      render(<CardDescription data-testid="desc">Desc</CardDescription>)

      expect(screen.getByTestId('desc')).toHaveAttribute('data-slot', 'card-description')
    })

    it('should apply custom className', () => {
      render(<CardDescription className="custom-desc" data-testid="desc">Desc</CardDescription>)

      expect(screen.getByTestId('desc')).toHaveClass('custom-desc')
    })
  })

  describe('CardAction', () => {
    it('should render card action', () => {
      render(<CardAction data-testid="action">Action</CardAction>)

      expect(screen.getByTestId('action')).toBeInTheDocument()
    })

    it('should have data-slot attribute', () => {
      render(<CardAction data-testid="action">Action</CardAction>)

      expect(screen.getByTestId('action')).toHaveAttribute('data-slot', 'card-action')
    })
  })

  describe('CardContent', () => {
    it('should render card content', () => {
      render(<CardContent>Content here</CardContent>)

      expect(screen.getByText('Content here')).toBeInTheDocument()
    })

    it('should have data-slot attribute', () => {
      render(<CardContent data-testid="content">Content</CardContent>)

      expect(screen.getByTestId('content')).toHaveAttribute('data-slot', 'card-content')
    })

    it('should apply custom className', () => {
      render(<CardContent className="custom-content" data-testid="content">Content</CardContent>)

      expect(screen.getByTestId('content')).toHaveClass('custom-content')
    })
  })

  describe('CardFooter', () => {
    it('should render card footer', () => {
      render(<CardFooter>Footer content</CardFooter>)

      expect(screen.getByText('Footer content')).toBeInTheDocument()
    })

    it('should have data-slot attribute', () => {
      render(<CardFooter data-testid="footer">Footer</CardFooter>)

      expect(screen.getByTestId('footer')).toHaveAttribute('data-slot', 'card-footer')
    })

    it('should apply custom className', () => {
      render(<CardFooter className="custom-footer" data-testid="footer">Footer</CardFooter>)

      expect(screen.getByTestId('footer')).toHaveClass('custom-footer')
    })
  })

  describe('Complete Card Composition', () => {
    it('should render complete card with all subcomponents', () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle>Card Title</CardTitle>
            <CardDescription>Card Description</CardDescription>
            <CardAction>Action</CardAction>
          </CardHeader>
          <CardContent>Main content</CardContent>
          <CardFooter>Footer</CardFooter>
        </Card>
      )

      expect(screen.getByText('Card Title')).toBeInTheDocument()
      expect(screen.getByText('Card Description')).toBeInTheDocument()
      expect(screen.getByText('Action')).toBeInTheDocument()
      expect(screen.getByText('Main content')).toBeInTheDocument()
      expect(screen.getByText('Footer')).toBeInTheDocument()
    })
  })
})
