/**
 * Smoke Tests - App Pages
 * Test Type: Smoke Testing
 * Coverage: Basic rendering of main pages
 *
 * Smoke tests verify that components render without crashing.
 * These are NOT full integration tests - just crash detection.
 */

import '@testing-library/jest-dom'
import { render } from '@testing-library/react'
import NotFound from '../not-found'
import HomePage from '../page'

// Mock next/link
jest.mock('next/link', () => {
  return ({ children, href }: any) => {
    return <a href={href}>{children}</a>
  }
})

// Mock i18n
jest.mock('@/lib/i18n', () => ({
  useI18n: () => ({
    t: (key: string) => key,
    locale: 'en',
    setLocale: jest.fn(),
  }),
}))

// Mock theme toggle
jest.mock('@/components/theme-toggle', () => ({
  ThemeToggle: () => <div data-testid="theme-toggle">Theme Toggle</div>,
}))

// Mock language switcher
jest.mock('@/components/language-switcher', () => ({
  LanguageSwitcher: () => <div data-testid="language-switcher">Language Switcher</div>,
}))

describe('App Pages - Smoke Tests', () => {
  describe('NotFound Page', () => {
    it('should render without crashing', () => {
      const { container } = render(<NotFound />)
      expect(container).toBeInTheDocument()
    })

    it('should contain "Page not found" text', () => {
      const { getByText } = render(<NotFound />)
      expect(getByText('Page not found')).toBeInTheDocument()
    })

    it('should have navigation buttons', () => {
      const { getByText } = render(<NotFound />)
      expect(getByText('Back home')).toBeInTheDocument()
      expect(getByText('Browse events')).toBeInTheDocument()
      expect(getByText('Explore clubs')).toBeInTheDocument()
    })
  })

  describe('Home Page', () => {
    it('should render without crashing', () => {
      const { container } = render(<HomePage />)
      expect(container).toBeInTheDocument()
    })

    it('should contain EtkinLink branding', () => {
      const { getByText } = render(<HomePage />)
      expect(getByText('EtkinLink')).toBeInTheDocument()
    })

    it('should have header navigation', () => {
      const { getByText } = render(<HomePage />)
      expect(getByText('nav.signIn')).toBeInTheDocument()
      expect(getByText('nav.getStarted')).toBeInTheDocument()
    })

    it('should display hero section', () => {
      const { getByText } = render(<HomePage />)
      expect(getByText('landing.badge')).toBeInTheDocument()
      expect(getByText('landing.heroTitle')).toBeInTheDocument()
    })

    it('should have CTA buttons', () => {
      const { getByText } = render(<HomePage />)
      expect(getByText('landing.primaryCta')).toBeInTheDocument()
      expect(getByText('landing.secondaryCta')).toBeInTheDocument()
    })

    it('should display feature cards', () => {
      const { getByText } = render(<HomePage />)
      expect(getByText('landing.feature.discover.title')).toBeInTheDocument()
      expect(getByText('landing.feature.communities.title')).toBeInTheDocument()
      expect(getByText('landing.feature.organize.title')).toBeInTheDocument()
    })

    it('should have footer', () => {
      const { getByText } = render(<HomePage />)
      expect(getByText('landing.footer')).toBeInTheDocument()
    })
  })
})
