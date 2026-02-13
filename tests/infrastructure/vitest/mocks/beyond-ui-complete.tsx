import type { ReactNode } from 'react'
import { vi } from 'vitest'

/**
 * Beyond UI–style mock for tests that need a full set of layout/form primitives.
 * Prefer theme-setup and real Beyond UI when possible.
 */
export function createBeyondUICompleteMock() {
  const createComponent =
    (tag = 'div') =>
    (
      {
        children,
        onPress,
        testID,
        ...rest
      }: {
        children?: ReactNode
        onPress?: () => void
        testID?: string
        [key: string]: unknown
      }
    ) => {
      const React = require('react') as typeof import('react')
      const props = {
        ...rest,
        'data-testid': testID,
        onClick: onPress,
        role: onPress ? 'button' : undefined,
      }
      return React.createElement(tag, props, children)
    }

  const React = require('react') as typeof import('react')

  const Input = ({
    value,
    onChangeText,
    placeholder,
    ...rest
  }: {
    value?: string
    onChangeText?: (text: string) => void
    placeholder?: string
    [key: string]: unknown
  }) =>
    React.createElement('input', {
      value: value ?? '',
      onChange: (e: React.ChangeEvent<HTMLInputElement>) => onChangeText?.(e.target.value),
      placeholder,
      ...rest,
    })

  const TextArea = ({
    value,
    onChangeText,
    ...rest
  }: {
    value?: string
    onChangeText?: (text: string) => void
    [key: string]: unknown
  }) =>
    React.createElement('textarea', {
      value: value ?? '',
      onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) =>
        onChangeText?.(e.target.value),
      ...rest,
    })

  const Text = ({ children, ...rest }: { children?: ReactNode; [key: string]: unknown }) =>
    React.createElement('span', rest, children)

  const Image = ({
    source,
    alt,
    ...rest
  }: {
    source?: { uri?: string }
    alt?: string
    [key: string]: unknown
  }) =>
    React.createElement('img', {
      src: source?.uri,
      alt: alt ?? '',
      ...rest,
    })

  const View = createComponent('div')

  const Button = ({
    children,
    onPress,
    disabled,
    ...rest
  }: {
    children?: ReactNode
    onPress?: () => void
    disabled?: boolean
    [key: string]: unknown
  }) =>
    React.createElement(
      'button',
      { type: 'button', disabled, onClick: onPress, ...rest },
      children
    )

  const ScrollView = ({
    children,
    ...rest
  }: { children?: ReactNode; [key: string]: unknown }) =>
    React.createElement('div', { 'data-testid': 'scroll-view', ...rest }, children)

  return {
    Stack: createComponent('div'),
    Row: createComponent('div'),
    Box: createComponent('div'),
    View,
    Text,
    Input,
    TextArea,
    Button,
    Image,
    ScrollView,
    Card: createComponent('div'),
    ThemeProvider: ({ children }: { children?: ReactNode }) =>
      React.createElement(React.Fragment, null, children),
    useThemeContext: () => ({ theme: 'light' as const }),
    VisuallyHidden: createComponent('span'),
    Spinner: () => React.createElement('div', { 'data-testid': 'spinner' }),
    useToast: () => ({ show: () => {}, dismiss: () => {}, success: () => {}, error: () => {} }),
    H1: createComponent('h1'),
    H2: createComponent('h2'),
    H3: createComponent('h3'),
    H4: createComponent('h4'),
    H5: createComponent('h5'),
    H6: createComponent('h6'),
    Paragraph: createComponent('p'),
    styled: (Component: React.ComponentType<Record<string, unknown>>) => Component,
    useWindowDimensions: () => ({ width: 1024, height: 768 }),
  }
}

/**
 * Setup Beyond UI mocks globally. Call from test setup when needed.
 */
export function setupBeyondUIMocks() {
  vi.mock('@scaffald/ui', () => createBeyondUICompleteMock())
}
