/**
 * Icon utilities
 * Helper functions for icon sizing and color management
 */

import { colors } from '../tokens/colors'

export type IconSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl'

/**
 * Icon size mappings
 * Maps semantic size names to pixel values
 */
const ICON_SIZES: Record<IconSize, number> = {
  xs: 12,
  sm: 16,
  md: 20,
  lg: 24,
  xl: 32,
}

/**
 * Get icon size in pixels
 * @param size - Semantic size name or pixel value
 * @returns Icon size in pixels
 *
 * @example
 * ```tsx
 * const size = getIconSize('md') // 20
 * const size = getIconSize(18) // 18
 * ```
 */
export function getIconSize(size: IconSize | number): number {
  if (typeof size === 'number') {
    return size
  }
  return ICON_SIZES[size]
}

/**
 * Get icon color based on theme and context
 * @param theme - Theme mode ('light' | 'dark')
 * @param variant - Icon color variant
 * @returns Icon color hex string
 *
 * @example
 * ```tsx
 * const color = getIconColor('light', 'default') // '#637083'
 * const color = getIconColor('dark', 'muted') // '#97a1af'
 * ```
 */
export function getIconColor(
  theme: 'light' | 'dark' = 'light',
  variant: 'default' | 'muted' | 'disabled' = 'default',
): string {
  if (variant === 'disabled') {
    return theme === 'light' ? colors.text.light.disabled : colors.text.dark.disabled
  }

  if (variant === 'muted') {
    return theme === 'light' ? colors.icon.light.muted : colors.icon.dark.muted
  }

  return theme === 'light' ? colors.icon.light.default : colors.icon.dark.default
}

/**
 * Calculate icon size based on component size
 * Used for responsive icon sizing within components
 * @param componentSize - Component size ('sm' | 'md' | 'lg')
 * @returns Recommended icon size in pixels
 *
 * @example
 * ```tsx
 * const iconSize = getIconSizeForComponent('sm') // 16
 * const iconSize = getIconSizeForComponent('md') // 20
 * const iconSize = getIconSizeForComponent('lg') // 24
 * ```
 */
export function getIconSizeForComponent(componentSize: 'sm' | 'md' | 'lg'): number {
  const sizeMap: Record<'sm' | 'md' | 'lg', number> = {
    sm: 16,
    md: 20,
    lg: 24,
  }
  return sizeMap[componentSize]
}

