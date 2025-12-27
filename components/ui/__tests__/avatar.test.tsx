/**
 * Component Tests - Avatar
 * Test Type: Unit Testing
 * Coverage: Avatar component rendering with image and fallback
 */

import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'
import { Avatar, AvatarImage, AvatarFallback } from '../avatar'

// Mock Radix UI Avatar
jest.mock('@radix-ui/react-avatar', () => ({
  Root: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  Image: ({ alt, ...props }: any) => <img alt={alt} {...props} />,
  Fallback: ({ children, ...props }: any) => <div {...props}>{children}</div>,
}))

describe('Avatar Components', () => {
  describe('Avatar', () => {
    it('should render avatar container', () => {
      render(<Avatar data-testid="avatar" />)

      const avatar = screen.getByTestId('avatar')
      expect(avatar).toBeInTheDocument()
      expect(avatar).toHaveAttribute('data-slot', 'avatar')
    })

    it('should apply custom className', () => {
      render(<Avatar className="custom-class" data-testid="avatar" />)

      const avatar = screen.getByTestId('avatar')
      expect(avatar).toHaveClass('custom-class')
    })
  })

  describe('AvatarImage', () => {
    it('should render avatar image', () => {
      render(
        <Avatar>
          <AvatarImage src="/avatar.jpg" alt="User avatar" />
        </Avatar>
      )

      const image = screen.getByAltText('User avatar')
      expect(image).toBeInTheDocument()
      expect(image).toHaveAttribute('src', '/avatar.jpg')
    })

    it('should have data-slot attribute', () => {
      render(
        <Avatar>
          <AvatarImage src="/avatar.jpg" alt="User avatar" data-testid="avatar-img" />
        </Avatar>
      )

      const image = screen.getByTestId('avatar-img')
      expect(image).toHaveAttribute('data-slot', 'avatar-image')
    })

    it('should apply custom className', () => {
      render(
        <Avatar>
          <AvatarImage src="/avatar.jpg" alt="User" className="custom-img" data-testid="avatar-img" />
        </Avatar>
      )

      const image = screen.getByTestId('avatar-img')
      expect(image).toHaveClass('custom-img')
    })
  })

  describe('AvatarFallback', () => {
    it('should render fallback text', () => {
      render(
        <Avatar>
          <AvatarFallback>JD</AvatarFallback>
        </Avatar>
      )

      expect(screen.getByText('JD')).toBeInTheDocument()
    })

    it('should have data-slot attribute', () => {
      render(
        <Avatar>
          <AvatarFallback data-testid="fallback">AB</AvatarFallback>
        </Avatar>
      )

      const fallback = screen.getByTestId('fallback')
      expect(fallback).toHaveAttribute('data-slot', 'avatar-fallback')
    })

    it('should apply custom className', () => {
      render(
        <Avatar>
          <AvatarFallback className="custom-fallback" data-testid="fallback">
            CD
          </AvatarFallback>
        </Avatar>
      )

      const fallback = screen.getByTestId('fallback')
      expect(fallback).toHaveClass('custom-fallback')
    })
  })

  describe('Complete Avatar', () => {
    it('should render avatar with image and fallback', () => {
      render(
        <Avatar>
          <AvatarImage src="/user.jpg" alt="John Doe" />
          <AvatarFallback>JD</AvatarFallback>
        </Avatar>
      )

      expect(screen.getByAltText('John Doe')).toBeInTheDocument()
      expect(screen.getByText('JD')).toBeInTheDocument()
    })

    it('should render with icon fallback', () => {
      render(
        <Avatar>
          <AvatarFallback>
            <svg data-testid="user-icon" />
          </AvatarFallback>
        </Avatar>
      )

      expect(screen.getByTestId('user-icon')).toBeInTheDocument()
    })
  })
})
