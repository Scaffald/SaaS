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

vi.mock('react-native', () => ({
  __esModule: true as const,
  View: createComponent('div'),
  Text: createComponent('span'),
  TouchableOpacity: createComponent('button'),
  TextInput: createComponent('input'),
  ScrollView: createComponent('div'),
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
}))

afterEach(() => {
  cleanupReact()
  cleanupReactNative()
  vi.clearAllMocks()
  vi.restoreAllMocks()
})

// Expo modules expect __DEV__ to be defined
;(globalThis as Record<string, unknown>).__DEV__ ??= false

