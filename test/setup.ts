import '@testing-library/jest-dom/vitest'

import React from 'react'
import { afterEach, vi } from 'vitest'

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
}))

afterEach(() => {})

