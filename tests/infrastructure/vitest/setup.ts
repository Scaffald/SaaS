import '@testing-library/jest-dom/vitest'

import React from 'react'
import { afterEach, it, test, vi } from 'vitest'
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

const useMediaMock = () => ({
  // Desktop defaults
  gtMd: true,
  gtSm: true,
  md: true,
  sm: false,
  xs: false,
  short: false,
  long: true,
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
  createTamagui: vi.fn(() => ({})),
  useMedia: useMediaMock,
}))

vi.mock('@tamagui/lucide-icons', () => {
  const IconMock =
    (name: string) =>
    ({ ...props }: Record<string, unknown>) =>
      React.createElement('span', { 'data-icon': name, ...props })

  return new Proxy(
    {},
    {
      get: (_target, prop) => {
        if (prop === '__esModule') return true
        if (typeof prop === 'string') {
          return IconMock(prop)
        }
        return IconMock('icon')
      },
    },
  )
})

vi.mock('react-native', () => ({
  __esModule: true as const,
  View: createComponent('div'),
  Text: createComponent('span'),
  TouchableOpacity: createComponent('button'),
  TextInput: createComponent('input'),
  ScrollView: createComponent('div'),
  FlatList: createComponent('div'),
  Image: createComponent('img'),
  StyleSheet: {
    create: (styles: Record<string, unknown>) => styles,
    flatten: (styles: unknown) => styles,
  },
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

const issueLinkPattern = /(https?:\/\/|#\d+)/
const wrapSkipWithIssueCheck = (skipFn: typeof it.skip): typeof it.skip =>
  ((...args: Parameters<typeof it.skip>) => {
    const [title] = args
    const label = typeof title === 'string' ? title : ''
    if (!issueLinkPattern.test(label)) {
      throw new Error('Skipped tests must include an issue link (e.g., #123 or https://...).')
    }

    return skipFn(...args)
  }) as typeof it.skip

const patchedIt = Object.assign(
  ((...args: Parameters<typeof it>) => it(...args)) as typeof it,
  it,
  { skip: wrapSkipWithIssueCheck(it.skip) },
)

const patchedTest = Object.assign(
  ((...args: Parameters<typeof test>) => test(...args)) as typeof test,
  test,
  { skip: wrapSkipWithIssueCheck(test.skip) },
)

;(globalThis as { it: typeof it }).it = patchedIt
;(globalThis as { test: typeof test }).test = patchedTest

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
