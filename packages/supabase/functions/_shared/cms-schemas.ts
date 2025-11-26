// @ts-nocheck
import { z } from 'zod'

/**
 * Lucide icon names commonly used in the app
 */
export const LUCIDE_ICON_NAMES = [
  'UserSearch',
  'Share2',
  'Sprout',
  'Home',
  'User',
  'Users',
  'Building2',
  'Briefcase',
  'Map',
  'Star',
  'Heart',
  'MessageCircle',
  'Bell',
  'Settings',
  'Search',
  'Filter',
  'Calendar',
  'Clock',
  'Mail',
  'Phone',
  'MapPin',
  'Globe',
  'FileText',
  'Image',
  'Video',
  'Music',
  'Download',
  'Upload',
  'Eye',
  'EyeOff',
  'ThumbsUp',
  'ThumbsDown',
  'Share',
  'Send',
  'Edit',
  'Trash2',
  'Plus',
  'Minus',
  'Check',
  'X',
  'ChevronRight',
  'ChevronLeft',
  'ChevronUp',
  'ChevronDown',
  'ArrowRight',
  'ArrowLeft',
  'ArrowUp',
  'ArrowDown',
  'MoreHorizontal',
  'MoreVertical',
] as const

export type LucideIconName = (typeof LUCIDE_ICON_NAMES)[number]

/**
 * Welcome slide from database
 */
export const welcomeSlideSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  icon_name: z.enum(LUCIDE_ICON_NAMES as unknown as [string, ...string[]], {
    errorMap: () => ({ message: 'Invalid icon name' }),
  }),
  background_image_url: z.string().url('Must be a valid URL'),
  display_order: z.number().int().positive(),
  is_active: z.boolean(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
})

/**
 * Create welcome slide input
 */
export const welcomeSlideCreateSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100, 'Title too long'),
  description: z.string().min(1, 'Description is required').max(500, 'Description too long'),
  icon_name: z.enum(LUCIDE_ICON_NAMES as unknown as [string, ...string[]], {
    errorMap: () => ({ message: 'Please select a valid icon' }),
  }),
  background_image_url: z.string().url('Must be a valid URL').or(z.literal('')),
  display_order: z.number().int().positive('Display order must be positive'),
  is_active: z.boolean().default(true),
})

/**
 * Update welcome slide input
 */
export const welcomeSlideUpdateSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1, 'Title is required').max(100, 'Title too long'),
  description: z.string().min(1, 'Description is required').max(500, 'Description too long'),
  icon_name: z.enum(LUCIDE_ICON_NAMES as unknown as [string, ...string[]], {
    errorMap: () => ({ message: 'Please select a valid icon' }),
  }),
  background_image_url: z.string().url('Must be a valid URL').or(z.literal('')),
  display_order: z.number().int().positive('Display order must be positive'),
  is_active: z.boolean(),
})

/**
 * Reorder welcome slides input
 */
export const welcomeSlideReorderSchema = z.object({
  slides: z.array(
    z.object({
      id: z.string().uuid(),
      display_order: z.number().int().positive(),
    })
  ),
})

/**
 * List welcome slides query params
 */
export const welcomeSlideListSchema = z.object({
  include_inactive: z.boolean().default(false),
})

/**
 * Type exports
 */
export type WelcomeSlide = z.infer<typeof welcomeSlideSchema>
export type WelcomeSlideCreate = z.infer<typeof welcomeSlideCreateSchema>
export type WelcomeSlideUpdate = z.infer<typeof welcomeSlideUpdateSchema>
export type WelcomeSlideReorder = z.infer<typeof welcomeSlideReorderSchema>
export type WelcomeSlideList = z.infer<typeof welcomeSlideListSchema>
