import { JSDOM } from 'jsdom';
import { beforeEach, vi } from 'vitest';
import '@testing-library/jest-dom';

const dom = new JSDOM();
global.document = dom.window.document;
global.window = dom.window as any;

// Define __DEV__ as a global variable
global.__DEV__ = true;

// Mock window.matchMedia (common JSDOM issue)
if (!global.window.matchMedia) {
  global.window.matchMedia = vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
}

// Mock window.confirm (JSDOM doesn't implement it)
if (!global.window.confirm) {
  global.window.confirm = vi.fn(() => true);
}

// Clear localStorage before each test to prevent quota issues
beforeEach(() => {
  if (global.localStorage) {
    global.localStorage.clear();
  }
});

// Suppress known Tamagui and React DOM prop warnings in tests
// These are custom component props that don't belong in DOM but are safe to suppress
const originalWarn = console.warn;
const originalError = console.error;

const TAMAGUI_PROPS = [
  'flexWrap',
  'pressStyle',
  'borderColor',
  'hoverStyle',
  'borderBottomWidth',
  'numberOfLines',
  'minW',
  'minH',
  'themeInverse',
  'chromeless',
  'padded',
  'bordered',
  'iconAfter',
  'onValueChange',
  'testID',
  'borderWidth',
  'borderRadius',
  'zIndex',
  'icon',
];

console.warn = (...args) => {
  const message = args[0]?.toString?.() ?? '';

  // Suppress Tamagui prop warnings
  if (message.includes('React does not recognize the')) {
    if (TAMAGUI_PROPS.some((prop) => message.includes(`\`${prop}\``))) {
      return; // suppress
    }
  }

  // Suppress non-boolean attribute warnings
  if (
    message.includes('Received `true` for a non-boolean attribute') &&
    TAMAGUI_PROPS.some((prop) => message.includes(prop))
  ) {
    return; // suppress
  }

  // Suppress invalid value for prop warnings (icon, etc.)
  if (
    message.includes('Invalid value for prop') &&
    TAMAGUI_PROPS.some((prop) => message.includes(prop))
  ) {
    return; // suppress
  }

  // Pass through other warnings
  originalWarn(...args);
};

console.error = (...args) => {
  const message = args[0]?.toString?.() ?? '';

  // Suppress nested button hydration errors (component structure issue, not test issue)
  if (message.includes('<button> cannot contain a nested <button>')) {
    return; // suppress
  }

  // Suppress hydration errors from Tamagui prop mismatches
  if (
    message.includes('In HTML') &&
    message.includes('This will cause a hydration error')
  ) {
    return; // suppress
  }

  // Pass through other errors
  originalError(...args);
};