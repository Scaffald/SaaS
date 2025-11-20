/**
 * Rich Text Editor Components
 * Cross-platform rich text editing with TipTap (web) and TenTap (native)
 */

export { RichTextEditor } from './RichTextEditor'
export type { RichTextDisplayProps, RichTextEditorProps } from './types'
export type {
  AllowedMark,
  AllowedNode,
  RichTextField,
} from './utils/constants'
export {
  ALLOWED_MARKS,
  ALLOWED_NODES,
  RICH_TEXT_LIMITS,
  RICH_TEXT_PLACEHOLDERS,
} from './utils/constants'
export {
  createEmptyDocument,
  extractPlainText,
  isContentEmpty,
  plainTextToTipTap,
  sanitizeTipTapJSON,
  validateCharacterLimit,
} from './utils/sanitize'
