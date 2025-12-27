/**
 * Component Tests - Alert
 * Test Type: Unit Testing
 * Coverage: Alert component with variants
 */

import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'
import { Alert, AlertTitle, AlertDescription } from '../alert'

describe('Alert Components', () => {
  describe('Alert', () => {
    it('should render alert', () => {
      render(<Alert data-testid="alert">Alert message</Alert>)

      const alert = screen.getByTestId('alert')
      expect(alert).toBeInTheDocument()
    })

    it('should have alert role', () => {
      render(<Alert data-testid="alert">Alert</Alert>)

      const alert = screen.getByRole('alert')
      expect(alert).toBeInTheDocument()
    })

    it('should have data-slot attribute', () => {
      render(<Alert data-testid="alert">Alert</Alert>)

      const alert = screen.getByTestId('alert')
      expect(alert).toHaveAttribute('data-slot', 'alert')
    })

    it('should apply custom className', () => {
      render(<Alert className="custom-alert" data-testid="alert">Alert</Alert>)

      const alert = screen.getByTestId('alert')
      expect(alert).toHaveClass('custom-alert')
    })
  })

  describe('Alert Variants', () => {
    it('should render default variant', () => {
      render(<Alert data-testid="alert">Default alert</Alert>)

      const alert = screen.getByTestId('alert')
      expect(alert).toBeInTheDocument()
    })

    it('should render destructive variant', () => {
      render(<Alert variant="destructive" data-testid="alert">Error alert</Alert>)

      const alert = screen.getByTestId('alert')
      expect(alert).toBeInTheDocument()
    })
  })

  describe('AlertTitle', () => {
    it('should render alert title', () => {
      render(
        <Alert>
          <AlertTitle>Alert Title</AlertTitle>
        </Alert>
      )

      expect(screen.getByText('Alert Title')).toBeInTheDocument()
    })

    it('should have data-slot attribute', () => {
      render(
        <Alert>
          <AlertTitle data-testid="alert-title">Title</AlertTitle>
        </Alert>
      )

      const title = screen.getByTestId('alert-title')
      expect(title).toHaveAttribute('data-slot', 'alert-title')
    })

    it('should apply custom className', () => {
      render(
        <Alert>
          <AlertTitle className="custom-title" data-testid="alert-title">
            Title
          </AlertTitle>
        </Alert>
      )

      const title = screen.getByTestId('alert-title')
      expect(title).toHaveClass('custom-title')
    })
  })

  describe('AlertDescription', () => {
    it('should render alert description', () => {
      render(
        <Alert>
          <AlertDescription>This is an alert description</AlertDescription>
        </Alert>
      )

      expect(screen.getByText('This is an alert description')).toBeInTheDocument()
    })

    it('should have data-slot attribute', () => {
      render(
        <Alert>
          <AlertDescription data-testid="alert-desc">Description</AlertDescription>
        </Alert>
      )

      const desc = screen.getByTestId('alert-desc')
      expect(desc).toHaveAttribute('data-slot', 'alert-description')
    })

    it('should apply custom className', () => {
      render(
        <Alert>
          <AlertDescription className="custom-desc" data-testid="alert-desc">
            Description
          </AlertDescription>
        </Alert>
      )

      const desc = screen.getByTestId('alert-desc')
      expect(desc).toHaveClass('custom-desc')
    })
  })

  describe('Complete Alert', () => {
    it('should render complete alert with title and description', () => {
      render(
        <Alert>
          <AlertTitle>Success</AlertTitle>
          <AlertDescription>Your changes have been saved.</AlertDescription>
        </Alert>
      )

      expect(screen.getByText('Success')).toBeInTheDocument()
      expect(screen.getByText('Your changes have been saved.')).toBeInTheDocument()
    })

    it('should render alert with icon', () => {
      render(
        <Alert>
          <svg data-testid="alert-icon" />
          <AlertTitle>Warning</AlertTitle>
          <AlertDescription>Please review your input.</AlertDescription>
        </Alert>
      )

      expect(screen.getByTestId('alert-icon')).toBeInTheDocument()
      expect(screen.getByText('Warning')).toBeInTheDocument()
    })

    it('should render destructive alert with content', () => {
      render(
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>Something went wrong.</AlertDescription>
        </Alert>
      )

      expect(screen.getByText('Error')).toBeInTheDocument()
      expect(screen.getByText('Something went wrong.')).toBeInTheDocument()
    })
  })
})
