import { createInterFont } from '@tamagui/font-inter'

/**
 * Named size token mappings for convenience
 * These map common size names to pixel values that align with the default numeric scale
 *
 * Size scale reference:
 * - xs: 12px (matches token 1)
 * - sm: 14px (matches token 3)
 * - md: 16px (matches token 5)
 * - lg: 20px (matches token 7)
 * - xl: 30px (matches token 9)
 * - 2xl: 55px (matches token 11)
 */
const namedSizeMapping = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 20,
  xl: 30,
  '2xl': 55,
}

export const headingFont = createInterFont(
  {
    size: {
      // Numeric tokens (default from createInterFont)
      6: 15,
      // Named size tokens for convenience
      ...namedSizeMapping,
    },
    transform: {
      6: 'uppercase',
      7: 'none',
    },
    weight: {
      3: '500',
      4: '700',
    },
    face: {
      700: { normal: 'InterBold' },
    },
  },
  {
    sizeSize: (size) => size,
    sizeLineHeight: (fontSize) => fontSize + 4,
  }
)

export const bodyFont = createInterFont(
  {
    // Named size tokens for convenience
    size: namedSizeMapping,
    face: {
      700: { normal: 'InterBold' },
    },
  },
  {
    sizeSize: (size) => Math.round(size * 1.1),
    sizeLineHeight: (size) => size + 5,
  }
)
