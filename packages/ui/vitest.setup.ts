import '@testing-library/jest-dom/vitest'
import { afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'

process.env.TAMAGUI_TARGET = process.env.TAMAGUI_TARGET ?? 'web'
process.env.TAMAGUI_IS_SERVER = process.env.TAMAGUI_IS_SERVER ?? '1'

const createMatchMedia = () =>
  ((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia

if (typeof window.matchMedia !== 'function') {
  window.matchMedia = createMatchMedia()
}

if (typeof globalThis.matchMedia !== 'function') {
  // @ts-expect-error - jsdom does not define matchMedia on globalThis
  globalThis.matchMedia = createMatchMedia()
}

if (!('ResizeObserver' in window)) {
  class ResizeObserverMock implements ResizeObserver {
    observe(): void {}
    unobserve(): void {}
    disconnect(): void {}
  }

  // @ts-expect-error - define global for testing environment
  window.ResizeObserver = ResizeObserverMock
}

globalThis.IS_REACT_ACT_ENVIRONMENT = true

afterEach(() => {
  cleanup()
})
