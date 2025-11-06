/**
 * Rich Text Editor Type Definitions
 */

import type { JSONContent } from '@tiptap/core'
import type { RichTextField } from './utils/constants'

/**
 * Props for the RichTextEditor component
 */
export interface RichTextEditorProps {
  /** Current content as TipTap JSON */
  value?: JSONContent | null

  /** Callback when content changes */
  onChange?: (content: JSONContent) => void

  /** Field type for character limit and placeholder */
  fieldType: RichTextField

  /** Custom placeholder text (overrides default) */
  placeholder?: string

  /** Custom character limit (overrides default) */
  maxLength?: number

  /** Whether the editor is disabled */
  disabled?: boolean

  /** Whether the editor is read-only */
  readOnly?: boolean

  /** Whether to show character count */
  showCharacterCount?: boolean

  /** Whether to autofocus on mount */
  autoFocus?: boolean

  /** Minimum height in pixels */
  minHeight?: number

  /** Error message to display */
  error?: string

  /** Test ID for testing */
  testID?: string
}

/**
 * Props for the RichTextDisplay component (read-only rendering)
 */
export interface RichTextDisplayProps {
  /** Content to display as TipTap JSON */
  content?: JSONContent | null

  /** Test ID for testing */
  testID?: string
}

/**
 * Editor toolbar button configuration
 */
export interface ToolbarButton {
  /** Button action type */
  action: 'bold' | 'italic' | 'underline' | 'bulletList' | 'orderedList'

  /** Button icon name */
  icon: string

  /** Button label for accessibility */
  label: string

  /** Whether button is currently active */
  isActive?: boolean

  /** Whether button is disabled */
  disabled?: boolean
}

/**
 * Character count display props
 */
export interface CharacterCountProps {
  /** Current character count */
  current: number

  /** Maximum character limit */
  max: number

  /** Whether to show warning when approaching limit */
  showWarning?: boolean
}
