/**
 * Rich Text Sanitization Utilities
 * Removes unwanted marks and nodes from TipTap JSON content
 */

import type { JSONContent } from '@tiptap/core'
import { ALLOWED_MARKS, ALLOWED_NODES } from './constants'

/**
 * Sanitize TipTap JSON content to remove unwanted marks and nodes
 * Ensures only bold, italic, underline, and lists are preserved
 */
export function sanitizeTipTapJSON(content: JSONContent): JSONContent {
  if (!content) {
    return content
  }

  // Create sanitized copy
  const sanitized: JSONContent = {
    type: content.type,
  }

  // Only allow permitted node types
  if (content.type && !ALLOWED_NODES.includes(content.type as (typeof ALLOWED_NODES)[number])) {
    // Convert disallowed nodes to paragraphs
    sanitized.type = 'paragraph'
  }

  // Sanitize text content and marks
  if (content.text) {
    sanitized.text = content.text
  }

  // Filter marks to only allowed ones
  if (content.marks && content.marks.length > 0) {
    sanitized.marks = content.marks.filter((mark) =>
      ALLOWED_MARKS.includes(mark.type as (typeof ALLOWED_MARKS)[number])
    )
  }

  // Recursively sanitize children
  if (content.content && Array.isArray(content.content)) {
    sanitized.content = content.content.map((child) => sanitizeTipTapJSON(child)).filter(Boolean) // Remove any nullified nodes
  }

  // Preserve attributes for list items
  if (content.attrs) {
    sanitized.attrs = content.attrs
  }

  return sanitized
}

/**
 * Validate that content doesn't exceed character limit
 * Returns true if valid, false if exceeds limit
 */
export function validateCharacterLimit(
  content: JSONContent | null | undefined,
  limit: number
): boolean {
  if (!content) return true

  const plainText = extractPlainText(content)
  return plainText.length <= limit
}

/**
 * Extract plain text from TipTap JSON for character counting
 * This should match the server-side extraction function
 */
export function extractPlainText(content: JSONContent): string {
  if (!content) return ''

  let text = ''

  // Handle text nodes
  if (content.type === 'text' && content.text) {
    return content.text
  }

  // Handle paragraph breaks
  if (content.type === 'paragraph' && content.content) {
    text += content.content.map((child) => extractPlainText(child)).join('')
    text += '\n'
  }

  // Handle lists
  if ((content.type === 'bulletList' || content.type === 'orderedList') && content.content) {
    text += content.content.map((child) => extractPlainText(child)).join('')
    text += '\n'
  }

  // Handle list items
  if (content.type === 'listItem' && content.content) {
    text += content.content.map((child) => extractPlainText(child)).join('')
  }

  // Handle doc node
  if (content.type === 'doc' && content.content) {
    text = content.content.map((child) => extractPlainText(child)).join('')
  }

  return text.trim()
}

/**
 * Create an empty TipTap document
 */
export function createEmptyDocument(): JSONContent {
  return {
    type: 'doc',
    content: [
      {
        type: 'paragraph',
        content: [],
      },
    ],
  }
}

/**
 * Check if content is empty (no text)
 */
export function isContentEmpty(content: JSONContent | null | undefined): boolean {
  if (!content) return true
  const plainText = extractPlainText(content)
  return plainText.length === 0
}

/**
 * Convert plain text to TipTap JSON
 * Used for migrating existing plain text data
 */
export function plainTextToTipTap(text: string): JSONContent {
  if (!text || text.length === 0) {
    return createEmptyDocument()
  }

  return {
    type: 'doc',
    content: [
      {
        type: 'paragraph',
        content: [
          {
            type: 'text',
            text: text,
          },
        ],
      },
    ],
  }
}
