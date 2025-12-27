/**
 * Unit Tests - Utils
 * Test Type: White-Box Testing
 * Coverage: Testing all code branches and paths
 */

import { cn } from '../utils'

describe('Utils - cn() function', () => {
  describe('Basic functionality', () => {
    it('should merge class names correctly', () => {
      const result = cn('class1', 'class2')
      expect(result).toBe('class1 class2')
    })

    it('should handle empty inputs', () => {
      const result = cn()
      expect(result).toBe('')
    })

    it('should handle undefined and null values', () => {
      const result = cn('class1', undefined, null, 'class2')
      expect(result).toBe('class1 class2')
    })

    it('should handle conditional classes', () => {
      const isActive = true
      const result = cn('base', isActive && 'active')
      expect(result).toBe('base active')
    })

    it('should handle conditional classes with false', () => {
      const isActive = false
      const result = cn('base', isActive && 'active')
      expect(result).toBe('base')
    })
  })

  describe('Tailwind merge functionality', () => {
    it('should merge conflicting tailwind classes', () => {
      const result = cn('px-2', 'px-4')
      expect(result).toBe('px-4')
    })

    it('should handle multiple conflicting classes', () => {
      const result = cn('text-sm text-lg', 'text-xl')
      expect(result).toBe('text-xl')
    })
  })

  describe('Edge cases', () => {
    it('should handle array inputs', () => {
      const result = cn(['class1', 'class2'])
      expect(result).toBe('class1 class2')
    })

    it('should handle object inputs', () => {
      const result = cn({ class1: true, class2: false, class3: true })
      expect(result).toBe('class1 class3')
    })

    it('should handle mixed inputs', () => {
      const result = cn('base', ['extra1', 'extra2'], { conditional: true })
      expect(result).toContain('base')
      expect(result).toContain('extra1')
      expect(result).toContain('extra2')
      expect(result).toContain('conditional')
    })
  })
})
