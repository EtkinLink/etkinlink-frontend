import '@testing-library/jest-dom'

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  warn: jest.fn(),
  error: jest.fn(),
  log: jest.fn(),
}

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
})

// Mock navigator.clipboard (FIX: use Object.defineProperty for read-only)
Object.defineProperty(navigator, 'clipboard', {
  writable: true,
  configurable: true,
  value: {
    writeText: jest.fn(() => Promise.resolve()),
    readText: jest.fn(() => Promise.resolve('')),
  },
})

// Mock window.open
global.window.open = jest.fn(() => null)

// Mock localStorage with proper jest mocks
const localStorageMock = (() => {
  let store = {}

  return {
    getItem: jest.fn((key) => store[key] || null),
    setItem: jest.fn((key, value) => {
      store[key] = String(value)
    }),
    removeItem: jest.fn((key) => {
      delete store[key]
    }),
    clear: jest.fn(() => {
      store = {}
    }),
    get length() {
      return Object.keys(store).length
    },
    key: jest.fn((index) => {
      const keys = Object.keys(store)
      return keys[index] || null
    }),
  }
})()

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true,
  configurable: true,
})

// Mock fetch globally
global.fetch = jest.fn()

// Reset all mocks before each test
beforeEach(() => {
  jest.clearAllMocks()

  // Clear localStorage store
  const store = {}
  localStorageMock.getItem.mockImplementation((key) => store[key] || null)
  localStorageMock.setItem.mockImplementation((key, value) => {
    store[key] = String(value)
  })
  localStorageMock.removeItem.mockImplementation((key) => {
    delete store[key]
  })
  localStorageMock.clear.mockImplementation(() => {
    Object.keys(store).forEach(key => delete store[key])
  })

  // Reset window.open mock
  if (window.open && typeof window.open.mockClear === 'function') {
    window.open.mockClear()
  }

  // Reset clipboard mocks
  if (navigator.clipboard?.writeText?.mockClear) {
    navigator.clipboard.writeText.mockClear()
  }
})
