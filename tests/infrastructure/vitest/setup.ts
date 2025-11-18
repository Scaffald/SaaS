import '@testing-library/jest-dom/vitest'

import React from 'react'
import { afterEach, vi } from 'vitest'
import { cleanup as cleanupReact } from '@testing-library/react'
import { cleanup as cleanupReactNative } from '@testing-library/react-native'

process.env.EXPO_PUBLIC_SUPABASE_URL ??= 'http://127.0.0.1:54321'
process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ??= 'test-anon-key'

const createComponent =
  (tag: string) =>
  ({ children, ...props }: Record<string, unknown>) =>
    React.createElement(tag, props, children)

const createPrimitive = (tag: string) =>
  React.forwardRef((props: Record<string, unknown>, ref: React.Ref<HTMLElement>) =>
    React.createElement(tag, { ref, ...props }, props.children),
  )

const ButtonMock = React.forwardRef(
  (
    { onPress, children, ...props }: Record<string, unknown> & { onPress?: () => void },
    ref: React.Ref<HTMLButtonElement>,
  ) =>
    React.createElement(
      'button',
      {
        ref,
        ...props,
        onClick: typeof onPress === 'function' ? onPress : props.onClick,
      },
      children,
    ),
)

const SelectMock = Object.assign(createPrimitive('select'), {
  Trigger: createPrimitive('button'),
  Value: createPrimitive('span'),
  Content: createPrimitive('div'),
  Viewport: createPrimitive('div'),
  Item: createPrimitive('div'),
  ItemText: createPrimitive('span'),
  ItemIndicator: createPrimitive('span'),
})

const SheetMock = Object.assign(createPrimitive('div'), {
  Frame: createPrimitive('div'),
  ScrollView: createPrimitive('div'),
  Overlay: createPrimitive('div'),
})

const DialogMock = Object.assign(createPrimitive('div'), {
  Portal: ({ children }: { children: React.ReactNode }) => React.createElement(React.Fragment, null, children),
  Overlay: createPrimitive('div'),
  Content: createPrimitive('div'),
  Close: createPrimitive('button'),
})

const ProgressMock = Object.assign(createPrimitive('div'), {
  Indicator: createPrimitive('div'),
})

vi.mock('tamagui', () => ({
  __esModule: true as const,
  Text: createPrimitive('span'),
  Button: ButtonMock,
  YStack: createPrimitive('div'),
  XStack: createPrimitive('div'),
  View: createPrimitive('div'),
  ScrollView: createPrimitive('div'),
  Label: createPrimitive('label'),
  Checkbox: Object.assign(createPrimitive('input'), { displayName: 'Checkbox' }),
  Progress: ProgressMock,
  Adapt: { Contents: createPrimitive('div') },
  Sheet: SheetMock,
  Select: SelectMock,
  Dialog: DialogMock,
}))

vi.mock('react-native', () => ({
  __esModule: true as const,
  View: createComponent('div'),
  Text: createComponent('span'),
  TouchableOpacity: createComponent('button'),
  TextInput: createComponent('input'),
  ScrollView: createComponent('div'),
  Dimensions: {
    get: (_type: 'screen' | 'window') => ({
      width: 1024,
      height: 768,
      scale: 1,
      fontScale: 1,
    }),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  },
  useWindowDimensions: () => ({
    width: 1024,
    height: 768,
    scale: 1,
    fontScale: 1,
  }),
  Platform: {
    OS: 'web',
    select<T>(selections: { ios?: T; android?: T; web?: T; default?: T }) {
      return selections.web ?? selections.default ?? selections.ios ?? selections.android
    },
  },
  NativeModules: {},
  TurboModuleRegistry: {
    getEnforcing: (_name: string) => ({}),
    get: (_name: string) => null,
  },
}))

vi.mock('expo-modules-core', () => ({
  EventEmitter: class {
    addListener() {
      return { remove() {} }
    }
    removeAllListeners() {}
    preventAutoEmitters() {}
  },
  requireNativeModule: () => ({}),
  requireOptionalNativeModule: () => ({}),
  NativeModulesProxy: {},
  Platform: {
    OS: 'web',
    isTV: false,
    select<T>(options: { ios?: T; android?: T; web?: T; default?: T }) {
      return options.web ?? options.default ?? options.ios ?? options.android
    },
  },
}))

if (typeof window !== 'undefined' && !window.matchMedia) {
  const mockMatchMediaResult = {
    matches: false,
    media: '',
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }

  window.matchMedia = vi.fn().mockImplementation(() => mockMatchMediaResult)
}

afterEach(() => {
  cleanupReact()
  cleanupReactNative()
  vi.clearAllMocks()
  vi.restoreAllMocks()
})

// Expo modules expect __DEV__ to be defined
;(globalThis as Record<string, unknown>).__DEV__ ??= false

const reactInvalidPropRegex = /React does not recognize the .* prop on a DOM element/i
const originalConsoleError = console.error
console.error = (...args: unknown[]) => {
  if (typeof args[0] === 'string' && reactInvalidPropRegex.test(args[0])) {
    return
  }
  originalConsoleError(...args)
}
