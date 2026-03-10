import { beforeEach, vi } from 'vitest'
import '@testing-library/jest-dom/vitest'

// No need to mock react-native - vitest.config.ts aliases it to react-native-web
// which provides all the components we need (View, Text, Pressable, etc.)

// Re-apply matchMedia mock before each test because the global setup's
// vi.resetAllMocks() in afterEach clears it between tests.
beforeEach(() => {
  global.window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }))
})
