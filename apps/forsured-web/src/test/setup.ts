/**
 * Vitest setup file
 * Configures testing environment and matchers
 */

import '@testing-library/jest-dom';

/**
 * Mock window.matchMedia for jsdom
 * Required for Tamagui components that use media queries
 */
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
});

/**
 * Mock ResizeObserver for jsdom
 * Required for some Tamagui components
 */
class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}
window.ResizeObserver = ResizeObserverMock;
