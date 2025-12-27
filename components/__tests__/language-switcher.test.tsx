/**
 * Component Tests - LanguageSwitcher
 * Test Type: Integration Testing
 * Coverage: Language selection UI component
 */

import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'
import { LanguageSwitcher } from '../language-switcher'
import { I18nProvider } from '@/lib/i18n'

// Mock Select component to avoid Radix UI complexity
jest.mock('@/components/ui/select', () => ({
  Select: ({ children, value, onValueChange }: any) => (
    <div data-testid="select-container" data-value={value}>
      {children}
      <button onClick={() => onValueChange('tr')} data-testid="change-to-tr">
        Change to TR
      </button>
    </div>
  ),
  SelectTrigger: ({ children }: any) => <div data-testid="select-trigger">{children}</div>,
  SelectValue: () => <span>Select Value</span>,
  SelectContent: ({ children }: any) => <div data-testid="select-content">{children}</div>,
  SelectItem: ({ children, value }: any) => (
    <div data-testid={`select-item-${value}`}>{children}</div>
  ),
}))

describe('LanguageSwitcher Component', () => {
  const renderWithProvider = () => {
    return render(
      <I18nProvider>
        <LanguageSwitcher />
      </I18nProvider>
    )
  }

  beforeEach(() => {
    localStorage.clear()
  })

  describe('Rendering', () => {
    it('should render language switcher', () => {
      renderWithProvider()

      const container = screen.getByTestId('select-container')
      expect(container).toBeInTheDocument()
    })

    it('should show current locale', () => {
      renderWithProvider()

      const container = screen.getByTestId('select-container')
      expect(container).toHaveAttribute('data-value', 'en')
    })

    it('should render all language options', () => {
      renderWithProvider()

      expect(screen.getByTestId('select-item-tr')).toBeInTheDocument()
      expect(screen.getByTestId('select-item-en')).toBeInTheDocument()
      expect(screen.getByTestId('select-item-ar')).toBeInTheDocument()
      expect(screen.getByTestId('select-item-bs')).toBeInTheDocument()
      expect(screen.getByTestId('select-item-de')).toBeInTheDocument()
      expect(screen.getByTestId('select-item-fi')).toBeInTheDocument()
      expect(screen.getByTestId('select-item-da')).toBeInTheDocument()
      expect(screen.getByTestId('select-item-ru')).toBeInTheDocument()
    })

    it('should apply custom className', () => {
      const { container } = render(
        <I18nProvider>
          <LanguageSwitcher className="custom-class" />
        </I18nProvider>
      )

      const wrapper = container.querySelector('.custom-class')
      expect(wrapper).toBeInTheDocument()
    })
  })

  describe('Language Labels', () => {
    it('should show Turkish label', () => {
      renderWithProvider()
      expect(screen.getByText('Türkçe')).toBeInTheDocument()
    })

    it('should show English label', () => {
      renderWithProvider()
      expect(screen.getByText('English')).toBeInTheDocument()
    })

    it('should show Arabic label', () => {
      renderWithProvider()
      expect(screen.getByText('العربية')).toBeInTheDocument()
    })

    it('should show Bosnian label', () => {
      renderWithProvider()
      expect(screen.getByText('Bosanski')).toBeInTheDocument()
    })

    it('should show German label', () => {
      renderWithProvider()
      expect(screen.getByText('Deutsch')).toBeInTheDocument()
    })

    it('should show Finnish label', () => {
      renderWithProvider()
      expect(screen.getByText('Suomi')).toBeInTheDocument()
    })

    it('should show Danish label', () => {
      renderWithProvider()
      expect(screen.getByText('Dansk')).toBeInTheDocument()
    })

    it('should show Russian label', () => {
      renderWithProvider()
      expect(screen.getByText('Русский')).toBeInTheDocument()
    })
  })

  describe('Language Flags', () => {
    it('should display flag emojis', () => {
      renderWithProvider()

      expect(screen.getByText('🇹🇷')).toBeInTheDocument()
      expect(screen.getByText('🇺🇸')).toBeInTheDocument()
      expect(screen.getByText('🇸🇦')).toBeInTheDocument()
      expect(screen.getByText('🇧🇦')).toBeInTheDocument()
      expect(screen.getByText('🇩🇪')).toBeInTheDocument()
      expect(screen.getByText('🇫🇮')).toBeInTheDocument()
      expect(screen.getByText('🇩🇰')).toBeInTheDocument()
      expect(screen.getByText('🇷🇺')).toBeInTheDocument()
    })
  })
})
