import '@testing-library/jest-dom/vitest'
import { vi } from 'vitest'

interface PlatformSelect {
  web?: unknown
  ios?: unknown
  android?: unknown
  native?: unknown
  default?: unknown
}

// Mock react-native (must be hoisted)
vi.mock('react-native', () => ({
  Platform: {
    OS: 'web',
    select: (obj: PlatformSelect) => obj.web ?? obj.default,
  },
}))

// Mock expo packages (must be hoisted)
vi.mock('expo-document-picker', () => ({
  getDocumentAsync: vi.fn(),
  pick: vi.fn(),
}))

