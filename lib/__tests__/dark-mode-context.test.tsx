/**
 * Context Tests - ThemeContext (Dark Mode)
 * Test Type: Integration & Unit Testing
 * Coverage: Theme switching, localStorage persistence, system preference
 */

import '@testing-library/jest-dom'
import { renderHook, act } from '@testing-library/react'
import { ThemeProvider, useTheme } from '../dark-mode-context'

describe('ThemeContext', () => {
  let matchMediaMock: jest.SpyInstance

  beforeEach(() => {
    jest.clearAllMocks()
    localStorage.clear()
    document.documentElement.className = ''

    // Mock window.matchMedia - default to light mode
    matchMediaMock = jest.spyOn(window, 'matchMedia').mockImplementation((query) => ({
      matches: false, // Default to light mode
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    }))
  })

  afterEach(() => {
    matchMediaMock.mockRestore()
  })

  describe('useTheme Hook', () => {
    it('should throw error when used outside ThemeProvider', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()

      expect(() => {
        renderHook(() => useTheme())
      }).toThrow('useTheme must be used within ThemeProvider')

      consoleSpy.mockRestore()
    })

    it('should provide theme context when used inside ThemeProvider', () => {
      const { result } = renderHook(() => useTheme(), {
        wrapper: ThemeProvider,
      })

      expect(result.current).toBeDefined()
      expect(result.current.theme).toBeDefined()
      expect(typeof result.current.toggleTheme).toBe('function')
      expect(typeof result.current.setTheme).toBe('function')
    })
  })

  describe('Initial Theme', () => {
    it('should default to light theme', () => {
      matchMediaMock.mockImplementation((query) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      }))

      const { result } = renderHook(() => useTheme(), {
        wrapper: ThemeProvider,
      })

      expect(result.current.theme).toBe('light')
    })

    it('should load theme from localStorage', () => {
      localStorage.setItem('etkinlink-theme', 'dark')

      const { result } = renderHook(() => useTheme(), {
        wrapper: ThemeProvider,
      })

      expect(result.current.theme).toBe('dark')
    })

    it('should use system preference if no stored theme', () => {
      matchMediaMock.mockImplementation((query) => ({
        matches: query === '(prefers-color-scheme: dark)',
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      }))

      const { result } = renderHook(() => useTheme(), {
        wrapper: ThemeProvider,
      })

      expect(result.current.theme).toBe('dark')
    })

    it('should ignore invalid stored theme values', () => {
      localStorage.setItem('etkinlink-theme', 'invalid')

      const { result } = renderHook(() => useTheme(), {
        wrapper: ThemeProvider,
      })

      expect(result.current.theme).toBe('light')
    })
  })

  describe('Theme Switching', () => {
    it('should toggle between light and dark', () => {
      const { result } = renderHook(() => useTheme(), {
        wrapper: ThemeProvider,
      })

      expect(result.current.theme).toBe('light')

      act(() => {
        result.current.toggleTheme()
      })

      expect(result.current.theme).toBe('dark')
      expect(localStorage.getItem('etkinlink-theme')).toBe('dark')

      act(() => {
        result.current.toggleTheme()
      })

      expect(result.current.theme).toBe('light')
      expect(localStorage.getItem('etkinlink-theme')).toBe('light')
    })

    it('should set specific theme', () => {
      const { result } = renderHook(() => useTheme(), {
        wrapper: ThemeProvider,
      })

      act(() => {
        result.current.setTheme('dark')
      })

      expect(result.current.theme).toBe('dark')
      expect(localStorage.getItem('etkinlink-theme')).toBe('dark')

      act(() => {
        result.current.setTheme('light')
      })

      expect(result.current.theme).toBe('light')
      expect(localStorage.getItem('etkinlink-theme')).toBe('light')
    })
  })

  describe('DOM Updates', () => {
    it('should add dark class to html element when dark theme is active', () => {
      const { result } = renderHook(() => useTheme(), {
        wrapper: ThemeProvider,
      })

      act(() => {
        result.current.setTheme('dark')
      })

      expect(document.documentElement.classList.contains('dark')).toBe(true)
    })

    it('should remove dark class when light theme is active', () => {
      const { result } = renderHook(() => useTheme(), {
        wrapper: ThemeProvider,
      })

      // First set to dark
      act(() => {
        result.current.setTheme('dark')
      })
      expect(document.documentElement.classList.contains('dark')).toBe(true)

      // Then switch to light
      act(() => {
        result.current.setTheme('light')
      })
      expect(document.documentElement.classList.contains('dark')).toBe(false)
    })
  })

  describe('LocalStorage Persistence', () => {
    it('should persist theme changes to localStorage', () => {
      const { result } = renderHook(() => useTheme(), {
        wrapper: ThemeProvider,
      })

      act(() => {
        result.current.setTheme('dark')
      })

      expect(localStorage.getItem('etkinlink-theme')).toBe('dark')

      act(() => {
        result.current.setTheme('light')
      })

      expect(localStorage.getItem('etkinlink-theme')).toBe('light')
    })

    it('should restore theme from localStorage on subsequent renders', () => {
      localStorage.setItem('etkinlink-theme', 'dark')

      const { result } = renderHook(() => useTheme(), {
        wrapper: ThemeProvider,
      })

      expect(result.current.theme).toBe('dark')
      expect(document.documentElement.classList.contains('dark')).toBe(true)
    })
  })

  describe('Edge Cases', () => {
    it('should handle multiple rapid theme toggles', () => {
      const { result } = renderHook(() => useTheme(), {
        wrapper: ThemeProvider,
      })

      act(() => {
        result.current.toggleTheme()
        result.current.toggleTheme()
        result.current.toggleTheme()
      })

      expect(result.current.theme).toBe('dark')
    })

    it('should handle setting same theme multiple times', () => {
      const { result } = renderHook(() => useTheme(), {
        wrapper: ThemeProvider,
      })

      act(() => {
        result.current.setTheme('dark')
        result.current.setTheme('dark')
        result.current.setTheme('dark')
      })

      expect(result.current.theme).toBe('dark')
      expect(localStorage.getItem('etkinlink-theme')).toBe('dark')
    })
  })
})
