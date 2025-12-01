import '@testing-library/jest-dom/vitest'
import { beforeAll, vi } from 'vitest'

// Mock Tamagui components for testing
beforeAll(() => {
  vi.mock('tamagui', () => ({
    Button: 'Button',
    Card: 'Card',
    Input: 'Input',
    Text: 'Text',
    XStack: 'XStack',
    YStack: 'YStack',
    useThemeName: vi.fn(() => 'light'),
  }))
})

