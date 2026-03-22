/**
 * useDynamicType hook
 *
 * Returns scaled typography values based on the user's Dynamic Type preference.
 * On iOS, reads the system font scale via PixelRatio.
 * On web, defaults to 'large' (can be overridden via preference prop).
 */

import { useMemo } from 'react'
import { Platform, PixelRatio } from 'react-native'
import {
  type DynamicTypeSize,
  type TypographyStyleName,
  fontScaleToCategory,
  getScaledFontSize,
  getScaledLineHeight,
} from '../tokens/dynamicType'

interface DynamicTypeResult {
  /** Current Dynamic Type category */
  category: DynamicTypeSize
  /** Get scaled font size for a typography style */
  getFontSize: (style: TypographyStyleName) => number
  /** Get scaled line height for a typography style */
  getLineHeight: (style: TypographyStyleName) => number
  /** Whether the current size is an accessibility size (AX1-AX5) */
  isAccessibilitySize: boolean
}

/**
 * Hook that provides Dynamic Type-aware typography values.
 *
 * @param preference - Override the detected Dynamic Type category
 * @returns Scaled typography values for the current Dynamic Type setting
 *
 * @example
 * const { getFontSize, getLineHeight, isAccessibilitySize } = useDynamicType()
 *
 * const style = {
 *   fontSize: getFontSize('paragraphM'),
 *   lineHeight: getLineHeight('paragraphM'),
 * }
 */
export function useDynamicType(preference?: DynamicTypeSize): DynamicTypeResult {
  const category = useMemo<DynamicTypeSize>(() => {
    if (preference) return preference

    if (Platform.OS === 'ios' || Platform.OS === 'android') {
      const scale = PixelRatio.getFontScale()
      return fontScaleToCategory(scale)
    }

    // Web defaults to 'large' (the standard/default size)
    return 'large'
  }, [preference])

  const isAccessibilitySize = useMemo(() => {
    return category.startsWith('ax')
  }, [category])

  const getFontSize = useMemo(() => {
    return (style: TypographyStyleName) => getScaledFontSize(style, category)
  }, [category])

  const getLineHeight = useMemo(() => {
    return (style: TypographyStyleName) => getScaledLineHeight(style, category)
  }, [category])

  return {
    category,
    getFontSize,
    getLineHeight,
    isAccessibilitySize,
  }
}
