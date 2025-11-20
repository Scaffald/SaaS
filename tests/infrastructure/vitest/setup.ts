import '@testing-library/jest-dom/vitest'

import { cleanup as cleanupReact } from '@testing-library/react'
import { cleanup as cleanupReactNative } from '@testing-library/react-native'
import React from 'react'
import { afterEach, vi } from 'vitest'

process.env.EXPO_PUBLIC_SUPABASE_URL ??= 'http://127.0.0.1:54321'
process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ??= 'test-anon-key'

const originalCreateElement = React.createElement

const normalizeTestIdProp = <T extends Record<string, unknown> | null | undefined>(props: T): T => {
  if (!props || typeof props !== 'object') {
    return props
  }

  const maybeTestId = (props as Record<string, unknown>).testID
  const hasDataTestId = 'data-testid' in (props as Record<string, unknown>)

  if (typeof maybeTestId === 'string' && maybeTestId.length > 0) {
    const { testID: _ignored, ...rest } = props as Record<string, unknown>

    return {
      ...rest,
      ...(hasDataTestId ? {} : { 'data-testid': maybeTestId }),
    } as T
  }

  return props
}

React.createElement = ((type, props, ...children) => {
  return originalCreateElement(type, normalizeTestIdProp(props), ...children)
}) as typeof React.createElement

const createComponent =
  (tag: string) =>
  ({ children, ...props }: Record<string, unknown>) =>
    React.createElement(tag, normalizeTestIdProp(props), children)

const createPrimitive = (tag: string) =>
  React.forwardRef((props: Record<string, unknown>, ref: React.Ref<HTMLElement>) =>
    React.createElement(tag, normalizeTestIdProp({ ref, ...props }), props.children)
  )

const ButtonMock = React.forwardRef(
  (
    { onPress, children, ...props }: Record<string, unknown> & { onPress?: () => void },
    ref: React.Ref<HTMLButtonElement>
  ) =>
    React.createElement(
      'button',
      {
        ref,
        ...normalizeTestIdProp(props),
        onClick: typeof onPress === 'function' ? onPress : props.onClick,
      },
      children
    )
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
  Portal: ({ children }: { children: React.ReactNode }) =>
    React.createElement(React.Fragment, null, children),
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
    }
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

// Mock @app/ui components - provide ResponsiveSelect mock
vi.mock('@app/ui', async () => {
  const ResponsiveSelectMock = Object.assign(createPrimitive('select'), {
    Trigger: createPrimitive('button'),
    Value: createPrimitive('span'),
    Content: createPrimitive('div'),
    Viewport: createPrimitive('div'),
    Item: createPrimitive('div'),
    ItemText: createPrimitive('span'),
    ItemIndicator: createPrimitive('span'),
  })

  try {
    const mod = await vi.importActual<typeof import('@app/ui')>('@app/ui')
    return {
      ...mod,
      ResponsiveSelect: ResponsiveSelectMock,
    }
  } catch (error) {
    // If importActual fails, return a minimal mock with ResponsiveSelect
    console.warn('Failed to importActual @app/ui, using minimal mock:', error)
    return {
      __esModule: true as const,
      ResponsiveSelect: ResponsiveSelectMock,
    }
  }
})

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
