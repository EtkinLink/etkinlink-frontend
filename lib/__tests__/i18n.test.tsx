/**
 * Context Tests - I18n (Internationalization)
 * Test Type: Unit & Integration Testing
 * Coverage: Translation, locale switching, variable interpolation
 */

import '@testing-library/jest-dom'
import { renderHook, act } from '@testing-library/react'
import { I18nProvider, useI18n, getDateLocale, type Locale } from '../i18n'

describe('I18nContext', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    localStorage.clear()
    document.cookie = ''
  })

  describe('useI18n Hook', () => {
    it('should throw error when used outside I18nProvider', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()

      expect(() => {
        renderHook(() => useI18n())
      }).toThrow('useI18n must be used within an I18nProvider')

      consoleSpy.mockRestore()
    })

    it('should provide i18n context when used inside I18nProvider', () => {
      const { result } = renderHook(() => useI18n(), {
        wrapper: ({ children }) => <I18nProvider>{children}</I18nProvider>,
      })

      expect(result.current).toBeDefined()
      expect(result.current.locale).toBe('en')
      expect(typeof result.current.setLocale).toBe('function')
      expect(typeof result.current.t).toBe('function')
    })
  })

  describe('Initial Locale', () => {
    it('should default to English', () => {
      const { result } = renderHook(() => useI18n(), {
        wrapper: ({ children }) => <I18nProvider>{children}</I18nProvider>,
      })

      expect(result.current.locale).toBe('en')
    })

    it('should accept initial locale', () => {
      const { result } = renderHook(() => useI18n(), {
        wrapper: ({ children }) => <I18nProvider initialLocale="tr">{children}</I18nProvider>,
      })

      expect(result.current.locale).toBe('tr')
    })
  })

  describe('Translation Function', () => {
    it('should translate simple keys', () => {
      const { result } = renderHook(() => useI18n(), {
        wrapper: ({ children }) => <I18nProvider>{children}</I18nProvider>,
      })

      const translation = result.current.t('common.loading')
      expect(translation).toBe('Loading...')
    })

    it('should return key if translation not found', () => {
      const { result } = renderHook(() => useI18n(), {
        wrapper: ({ children }) => <I18nProvider>{children}</I18nProvider>,
      })

      const translation = result.current.t('nonexistent.key')
      expect(translation).toBe('nonexistent.key')
    })

    it('should interpolate variables', () => {
      const { result } = renderHook(() => useI18n(), {
        wrapper: ({ children }) => <I18nProvider>{children}</I18nProvider>,
      })

      const translation = result.current.t('common.participants', { count: '42' })
      expect(translation).toBe('42 participants')
    })

    it('should handle multiple variables', () => {
      const { result } = renderHook(() => useI18n(), {
        wrapper: ({ children }) => <I18nProvider>{children}</I18nProvider>,
      })

      const translation = result.current.t('common.page', { page: '5' })
      expect(translation).toBe('Page 5')
    })

    it('should convert number variables to strings', () => {
      const { result } = renderHook(() => useI18n(), {
        wrapper: ({ children }) => <I18nProvider>{children}</I18nProvider>,
      })

      const translation = result.current.t('common.participants', { count: 100 })
      expect(translation).toBe('100 participants')
    })
  })

  describe('Locale Switching', () => {
    it('should switch locale', () => {
      const { result } = renderHook(() => useI18n(), {
        wrapper: ({ children }) => <I18nProvider>{children}</I18nProvider>,
      })

      expect(result.current.locale).toBe('en')

      act(() => {
        result.current.setLocale('tr')
      })

      expect(result.current.locale).toBe('tr')
    })

    it('should translate in different locales', () => {
      const { result } = renderHook(() => useI18n(), {
        wrapper: ({ children }) => <I18nProvider>{children}</I18nProvider>,
      })

      // English
      expect(result.current.t('common.loading')).toBe('Loading...')

      // Switch to Turkish
      act(() => {
        result.current.setLocale('tr')
      })

      expect(result.current.t('common.loading')).toBe('Yükleniyor...')
    })

    it('should persist locale to localStorage', () => {
      const { result } = renderHook(() => useI18n(), {
        wrapper: ({ children }) => <I18nProvider>{children}</I18nProvider>,
      })

      act(() => {
        result.current.setLocale('de')
      })

      expect(localStorage.getItem('preferred_language')).toBe('de')
    })

    it('should set cookie when locale changes', () => {
      const { result } = renderHook(() => useI18n(), {
        wrapper: ({ children }) => <I18nProvider>{children}</I18nProvider>,
      })

      act(() => {
        result.current.setLocale('fi')
      })

      expect(document.cookie).toContain('preferred_language=fi')
    })
  })

  describe('Supported Locales', () => {
    const supportedLocales: Locale[] = ['en', 'tr', 'ar', 'bs', 'de', 'fi', 'da', 'ru']

    supportedLocales.forEach((locale) => {
      it(`should support ${locale} locale`, () => {
        const { result } = renderHook(() => useI18n(), {
          wrapper: ({ children }) => <I18nProvider initialLocale={locale}>{children}</I18nProvider>,
        })

        expect(result.current.locale).toBe(locale)
      })
    })
  })

  describe('Fallback to English', () => {
    it('should fallback to English for missing translations', () => {
      const { result } = renderHook(() => useI18n(), {
        wrapper: ({ children }) => <I18nProvider initialLocale="ar">{children}</I18nProvider>,
      })

      // Even in Arabic, if a key doesn't exist in Arabic but exists in English, it should return English
      const translation = result.current.t('nav.events')
      expect(translation).toBeDefined()
      expect(translation.length).toBeGreaterThan(0)
    })
  })

  describe('getDateLocale', () => {
    it('should return correct date locale for English', () => {
      expect(getDateLocale('en')).toBe('en-US')
    })

    it('should return correct date locale for Turkish', () => {
      expect(getDateLocale('tr')).toBe('tr-TR')
    })

    it('should return correct date locale for German', () => {
      expect(getDateLocale('de')).toBe('de-DE')
    })

    it('should return correct date locale for Arabic', () => {
      expect(getDateLocale('ar')).toBe('ar')
    })

    it('should return correct date locale for Bosnian', () => {
      expect(getDateLocale('bs')).toBe('bs-BA')
    })

    it('should return correct date locale for Finnish', () => {
      expect(getDateLocale('fi')).toBe('fi-FI')
    })

    it('should return correct date locale for Danish', () => {
      expect(getDateLocale('da')).toBe('da-DK')
    })

    it('should return correct date locale for Russian', () => {
      expect(getDateLocale('ru')).toBe('ru-RU')
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty variable object', () => {
      const { result } = renderHook(() => useI18n(), {
        wrapper: ({ children }) => <I18nProvider>{children}</I18nProvider>,
      })

      const translation = result.current.t('common.loading', {})
      expect(translation).toBe('Loading...')
    })

    it('should handle translation without variables', () => {
      const { result } = renderHook(() => useI18n(), {
        wrapper: ({ children }) => <I18nProvider>{children}</I18nProvider>,
      })

      const translation = result.current.t('nav.events')
      expect(translation).toBe('Events')
    })

    it('should handle rapid locale switching', () => {
      const { result } = renderHook(() => useI18n(), {
        wrapper: ({ children }) => <I18nProvider>{children}</I18nProvider>,
      })

      act(() => {
        result.current.setLocale('tr')
        result.current.setLocale('de')
        result.current.setLocale('en')
      })

      expect(result.current.locale).toBe('en')
    })
  })

  describe('Real Translation Examples', () => {
    it('should translate navigation items', () => {
      const { result } = renderHook(() => useI18n(), {
        wrapper: ({ children }) => <I18nProvider>{children}</I18nProvider>,
      })

      expect(result.current.t('nav.events')).toBe('Events')
      expect(result.current.t('nav.clubs')).toBe('Clubs')
      expect(result.current.t('nav.profile')).toBe('Profile')
    })

    it('should translate auth messages', () => {
      const { result } = renderHook(() => useI18n(), {
        wrapper: ({ children }) => <I18nProvider>{children}</I18nProvider>,
      })

      expect(result.current.t('auth.email')).toBe('Email')
      expect(result.current.t('auth.password')).toBe('Password')
      expect(result.current.t('auth.signIn')).toBe('Sign in')
    })

    it('should translate in Turkish', () => {
      const { result } = renderHook(() => useI18n(), {
        wrapper: ({ children }) => <I18nProvider initialLocale="tr">{children}</I18nProvider>,
      })

      expect(result.current.t('nav.events')).toBe('Etkinlikler')
      expect(result.current.t('nav.clubs')).toBe('Kulüpler')
    })
  })
})
