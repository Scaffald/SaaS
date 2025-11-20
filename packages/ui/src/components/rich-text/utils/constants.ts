/**
 * Rich Text Editor Constants
 * Configuration for allowed marks, nodes, and character limits
 */

/**
 * Allowed text formatting marks (no links, headers, or custom styles)
 */
export const ALLOWED_MARKS = ['bold', 'italic', 'underline'] as const

export type AllowedMark = (typeof ALLOWED_MARKS)[number]

/**
 * Allowed document structure nodes
 */
export const ALLOWED_NODES = [
  'doc',
  'paragraph',
  'text',
  'bulletList',
  'orderedList',
  'listItem',
] as const

export type AllowedNode = (typeof ALLOWED_NODES)[number]

/**
 * Character limits for different fields
 * Database enforces 5000 char limit, but UI can be more restrictive
 */
export const RICH_TEXT_LIMITS = {
  PROFILE_ABOUT: 1500,
  EXPERIENCE_DESCRIPTION: 1000,
  EDUCATION_DESCRIPTION: 500,
  JOB_DESCRIPTION: 3000,
  ORGANIZATION_DESCRIPTION: 1000,
  CERTIFICATION_DESCRIPTION: 500,
  DATABASE_MAX: 5000,
} as const

export type RichTextField = keyof typeof RICH_TEXT_LIMITS

/**
 * Placeholder text for different fields
 */
export const RICH_TEXT_PLACEHOLDERS = {
  PROFILE_ABOUT: 'Tell us about yourself...',
  EXPERIENCE_DESCRIPTION: 'Describe your role and accomplishments...',
  EDUCATION_DESCRIPTION: 'Add details about your education...',
  JOB_DESCRIPTION: 'Describe the role, responsibilities, and requirements...',
  ORGANIZATION_DESCRIPTION: 'Tell candidates about your organization...',
  CERTIFICATION_DESCRIPTION: 'Add notes about this certification...',
} as const

/**
 * TipTap editor configuration
 */
export const EDITOR_CONFIG = {
  enableBold: true,
  enableItalic: true,
  enableUnderline: true,
  enableBulletList: true,
  enableOrderedList: true,
  enableLinks: false,
  enableHeadings: false,
  enableCodeBlocks: false,
  enableBlockquotes: false,
  enableImages: false,
  enableTables: false,
} as const
