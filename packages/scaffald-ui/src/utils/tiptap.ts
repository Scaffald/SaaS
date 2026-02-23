/**
 * TipTap JSON content utilities
 * Extracts plain text and converts to TipTap JSON format
 */

/** Minimal TipTap JSONContent shape (from @tiptap/core) */
export interface JSONContent {
  type?: string
  content?: JSONContent[]
  text?: string
  attrs?: Record<string, unknown>
  marks?: Array<{ type: string; attrs?: Record<string, unknown> }>
  [key: string]: unknown
}

/**
 * Extracts plain text from TipTap JSONContent.
 * Handles both string input and JSON structure.
 */
export function extractPlainText(content: JSONContent | string | null | undefined): string {
  if (content == null) return ''
  if (typeof content === 'string') return content
  if (content.text) return content.text
  if (content.content && Array.isArray(content.content)) {
    return content.content.map((node: JSONContent) => extractPlainText(node)).join(' ')
  }
  return ''
}

/**
 * Converts plain text string to minimal TipTap JSON format
 * for use with RichTextEditor and compatible editors.
 */
export function plainTextToTipTap(text: string): JSONContent {
  if (!text || !text.trim()) {
    return { type: 'doc', content: [{ type: 'paragraph' }] }
  }
  const lines = text.split('\n')
  const content = lines.map((line) =>
    line.trim()
      ? { type: 'paragraph' as const, content: [{ type: 'text' as const, text: line }] }
      : { type: 'paragraph' as const }
  )
  return { type: 'doc', content }
}
