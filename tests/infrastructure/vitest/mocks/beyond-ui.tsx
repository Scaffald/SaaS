/**
 * Minimal Beyond UI mock for unit tests.
 */
import type { ReactNode } from 'react'
import React, { createElement } from 'react'

const createEl =
  (tag: string) =>
  ({ children, ...rest }: { children?: ReactNode; [key: string]: unknown }) =>
    createElement(tag, rest, children)

export function createBeyondUIMock() {
  return {
    Stack: createEl('div'),
    Row: createEl('div'),
    Text: createEl('span'),
    Box: createEl('div'),
    ThemeProvider: ({ children }: { children?: ReactNode }) => createElement(React.Fragment, null, children),
    useThemeContext: () => ({ theme: 'light' as const }),
    VisuallyHidden: createEl('span'),
    Spinner: () => createElement('div', { 'data-testid': 'spinner' }),
    useToast: () => ({ show: () => {}, dismiss: () => {}, success: () => {}, error: () => {} }),
  }
}
