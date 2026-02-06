/**
 * RichTextEditor types – minimal surface; no TipTap dependency.
 * For full rich text (bold, lists, etc.), plug in TipTap as children or use a peer adapter.
 */

import type { ReactNode } from 'react'
import type { ViewStyle } from 'react-native'

export interface RichTextEditorProps {
  /** Plain text or HTML; interpretation is up to the implementation (default: plain text) */
  value?: string
  /** Called when content changes */
  onChange?: (value: string) => void
  placeholder?: string
  disabled?: boolean
  readOnly?: boolean
  minHeight?: number
  error?: string | boolean
  errorMessage?: string
  /** If true, show a character count (requires maxLength) */
  showCharacterCount?: boolean
  maxLength?: number
  style?: ViewStyle
  /** Optional: render a custom editor (e.g. TipTap); overrides default text area */
  children?: ReactNode
}
