/**
 * Color tokens mapped from Figma Forsured Design System
 *
 * This file provides two complementary approaches to color tokens:
 *
 * 1. **Color Families**: Direct access to color scales (primary, neutral, gray, semantic colors, etc.)
 *    - Useful for flexible color usage and custom theming
 *    - Each family follows a 10-shade scale (50-900) for consistent theming
 *
 * 2. **Semantic Tokens**: Context-aware color tokens organized by usage (text, bg, border, fg, icon)
 *    - Organized by usage context matching Figma Design System documentation
 *    - Each semantic category supports both light and dark mode values
 *    - Provides consistent, design-system-compliant color usage
 *
 * Base Color Scale:
 * The `gray` color family uses warm stone tones aligned with earth tones theme:
 * - Base/0 White = white (#ffffff)
 * - Base/50 = gray[50] (#f9f8f6)
 * - Base/100 = gray[100] (#f1efeb)
 * - Base/200 = gray[200] (#e3dfd9)
 * - Base/300 = gray[300] (#cdc8c0)
 * - Base/400 = gray[400] (#9e9790)
 * - Base/500 = gray[500] (#6e6760)
 * - Base/600 = gray[600] (#504940)
 * - Base/700 = gray[700] (#3c352c)
 * - Base/750 = gray[750] (#2f2820)
 * - Base/800 = gray[800] (#1e1914)
 * - Base/900 = gray[900] (#16110d)
 *
 * Usage Examples:
 *
 * ```typescript
 * // Using color families (flexible approach)
 * const primaryColor = colors.primary[500]
 * const grayBg = colors.gray[100]
 *
 * // Using semantic tokens with theme mode
 * const textColor = colors.text.light.primary        // Light mode
 * const textColorDark = colors.text.dark.primary     // Dark mode
 * const bgColor = colors.bg.light.default
 * const borderColor = colors.border.light.default
 *
 * // Backward compatibility (simple aliases reference light mode)
 * const simpleText = colors.text.primary             // Same as colors.text.light.primary
 * const simpleBg = colors.bg.primary                 // Same as colors.bg.light.default
 * ```
 *
 * Values extracted from Figma variable definitions.
 */

export const colors = {
  // Brand Colors
  primary: {
    50: '#e8f6f9',
    100: '#bde9f0',
    200: '#7fd1de',
    300: '#3fb5c7',
    400: '#1e96a8',
    500: '#1d7282', // Default primary - rich deep logo teal
    600: '#125b69',
    700: '#034550', // Logo dark forest teal
    800: '#022d38',
    900: '#011d24',
  },

  neutral: {
    50: '#fbf8f3',
    100: '#f7f2eb',
    200: '#f1e9df',
    300: '#e8dccb',
    400: '#d9c9b6',
    500: '#c8b6a1',
    600: '#9a8b7a',
    700: '#6b6055',
    800: '#3a342f',
    900: '#2a2623',
  },

  // Base/Gray Scale — Warm Stone
  gray: {
    50: '#f9f8f6',
    100: '#f1efeb',
    200: '#e3dfd9',
    300: '#cdc8c0',
    400: '#9e9790',
    500: '#6e6760',
    600: '#504940',
    700: '#3c352c',
    750: '#2f2820', // Extra shade for fine control
    800: '#1e1914',
    900: '#16110d',
  },

  // Semantic Colors
  info: {
    50: '#f0f6fb',
    100: '#daeaf5',
    200: '#b0d0e9',
    300: '#7cb0d5',
    400: '#4e90be',
    500: '#2e72a0',
    600: '#235880',
    700: '#1a4464',
    800: '#12314a',
    900: '#0c2234',
  },

  success: {
    50: '#eef5f0',
    100: '#d4e8d8',
    200: '#a8d0b0',
    300: '#74b480',
    400: '#4e9a5e',
    500: '#3a7d4c',
    600: '#2e6339',
    700: '#22502a',
    800: '#174021',
    900: '#0f3018',
  },

  warning: {
    50: '#fdf5e6',
    100: '#f9e6c0',
    200: '#f2cc84',
    300: '#e8ae4a',
    400: '#d4942a',
    500: '#9a6614',
    600: '#9a6614',
    700: '#7a4f0e',
    800: '#5c3a08',
    900: '#402807',
  },

  error: {
    50: '#fdf0ee',
    100: '#faddd8',
    200: '#f2b8ae',
    300: '#e58e80',
    400: '#d06b59',
    500: '#b84f3b',
    600: '#963c2a',
    700: '#762d1d',
    800: '#561f12',
    900: '#3c130b',
  },

  // Extended Color Palette
  zinc: {
    50: '#fafafa',
    100: '#f4f4f5',
    200: '#e4e4e7',
    300: '#d4d4d8',
    400: '#a1a1aa',
    500: '#71717a',
    600: '#52525b',
    700: '#3f3f46',
    800: '#27272a',
    900: '#18181b',
  },

  stone: {
    50: '#fafaf9',
    100: '#f5f5f4',
    200: '#e7e5e4',
    300: '#d6d3d1',
    400: '#a8a29e',
    500: '#78716c',
    600: '#57534e',
    700: '#44403c',
    800: '#292524',
    900: '#1c1917',
  },

  orange: {
    50: '#fff7ed',
    100: '#ffedd5',
    200: '#fed7aa',
    300: '#fdba74',
    400: '#fb923c',
    500: '#f97316',
    600: '#ea580c',
    700: '#c2410c',
    800: '#9a3412',
    900: '#7c2d12',
  },

  amber: {
    50: '#fffbeb',
    100: '#fef3c7',
    200: '#fde68a',
    300: '#fcd34d',
    400: '#fbbf24',
    500: '#f59e0b',
    600: '#d97706',
    700: '#b45309',
    800: '#92400e',
    900: '#78350f',
  },

  yellow: {
    50: '#fefce8',
    100: '#fef9c3',
    200: '#fef08a',
    300: '#fde047',
    400: '#facc15',
    500: '#eab308',
    600: '#ca8a04',
    700: '#a16207',
    800: '#854d0e',
    900: '#713f12',
  },

  lime: {
    50: '#f7fee7',
    100: '#ecfccb',
    200: '#d9f99d',
    300: '#bef264',
    400: '#afe556',
    500: '#84cc16',
    600: '#65a30d',
    700: '#4d7c0f',
    800: '#3f6212',
    900: '#365314',
  },

  green: {
    50: '#f0fdf4',
    100: '#dcfce7',
    200: '#bbf7d0',
    300: '#86efac',
    400: '#4ade80',
    500: '#22c55e',
    600: '#16a34a',
    700: '#15803d',
    800: '#166534',
    900: '#14532d',
  },

  emerald: {
    50: '#ecfdf5',
    100: '#d1fae5',
    200: '#a7f3d0',
    300: '#6ee7b7',
    400: '#34d399',
    500: '#10b981',
    600: '#059669',
    700: '#047857',
    800: '#065f46',
    900: '#064e3b',
  },

  teal: {
    50: '#f0fdfa',
    100: '#ccfbf1',
    200: '#99f6e4',
    300: '#5eead4',
    400: '#2dd4bf',
    500: '#14b8a6',
    600: '#0d9488',
    700: '#0f766e',
    800: '#115e59',
    900: '#134e4a',
  },

  cyan: {
    50: '#ecfeff',
    100: '#cffafe',
    200: '#a5f3fc',
    300: '#67e8f9',
    400: '#22d3ee',
    500: '#06b6d4',
    600: '#0891b2',
    700: '#0e7490',
    800: '#155e75',
    900: '#164e63',
  },

  sky: {
    50: '#f0f9ff',
    100: '#e0f2fe',
    200: '#bae6fd',
    300: '#7dd3fc',
    400: '#38bdf8',
    500: '#0ea5e9',
    600: '#0284c7',
    700: '#0369a1',
    800: '#075985',
    900: '#0c4a6e',
  },

  blue: {
    50: '#eff6ff',
    100: '#dbeafe',
    200: '#bfdbfe',
    300: '#93c5fd',
    400: '#60a5fa',
    500: '#3b82f6',
    600: '#2563eb',
    700: '#1d4ed8',
    800: '#1e40af',
    900: '#1e3a8a',
  },

  indigo: {
    50: '#eef2ff',
    100: '#e0e7ff',
    200: '#c7d2fe',
    300: '#a5b4fc',
    400: '#818cf8',
    500: '#6366f1',
    600: '#4f46e5',
    700: '#4338ca',
    800: '#3730a3',
    900: '#312e81',
  },

  violet: {
    50: '#f5f3ff',
    100: '#ede9fe',
    200: '#ddd6fe',
    300: '#c4b5fd',
    400: '#a78bfa',
    500: '#8b5cf6',
    600: '#7c3aed',
    700: '#6d28d9',
    800: '#5b21b6',
    900: '#4c1d95',
  },

  purple: {
    50: '#faf5ff',
    100: '#f3e8ff',
    200: '#e9d5ff',
    300: '#d8b4fe',
    400: '#c084fc',
    500: '#a855f7',
    600: '#9333ea',
    700: '#7e22ce',
    800: '#6b21a8',
    900: '#581c87',
  },

  fuchsia: {
    50: '#fdf4ff',
    100: '#fae8ff',
    200: '#f5d0fe',
    300: '#f0abfc',
    400: '#e879f9',
    500: '#d946ef',
    600: '#c026d3',
    700: '#a21caf',
    800: '#86198f',
    900: '#701a75',
  },

  pink: {
    50: '#fdf2f8',
    100: '#fce7f3',
    200: '#fbcfe8',
    300: '#f9a8d4',
    400: '#f472b6',
    500: '#ec4899',
    600: '#db2777',
    700: '#be185d',
    800: '#9d174d',
    900: '#831843',
  },

  rose: {
    50: '#fff1f2',
    100: '#ffe4e6',
    200: '#fecdd3',
    300: '#fda4af',
    400: '#fb7185',
    500: '#f43f5e',
    600: '#e11d48',
    700: '#be123c',
    800: '#9f1239',
    900: '#881337',
  },

  // Utility Colors
  white: '#ffffff',
  black: '#000000',

  // Typography Color Tokens (Text Colors)
  // Semantic tokens organized by usage context with light/dark mode support
  text: {
    light: {
      primary: '#16110d', // gray[900] warm - Reserved for title text
      secondary: '#3c352c', // gray[700] warm - Reserved for body paragraphs
      tertiary: '#6e6760', // gray[500] warm - Reserved for secondary text
      disabled: '#cdc8c0', // gray[300] warm - Context for operational disabilities
      quaternary: '#ffffff', // Base/0 White - Contrast for optimal readability (inverse text)
    },
    dark: {
      primary: '#ffffff', // Base/0 White - Reserved for title text
      secondary: '#e3dfd9', // gray[200] warm - Reserved for body paragraphs
      tertiary: '#9e9790', // gray[400] warm - Reserved for secondary text
      disabled: '#504940', // gray[600] warm - Context for operational disabilities
      quaternary: '#16110d', // gray[900] warm - Contrast for optimal readability (inverse text)
    },
    // Backward compatibility aliases (reference light mode)
    primary: '#16110d', // Alias for text.light.primary
    secondary: '#3c352c', // Alias for text.light.secondary
    tertiary: '#6e6760', // Alias for text.light.tertiary
    disabled: '#9e9790', // Alias for text.light.disabled (note: uses gray[400] warm for backward compat)
    inverse: '#ffffff', // Alias for text.light.quaternary
  },

  // Background Color Tokens
  // Semantic tokens for different background contexts with light/dark mode support
  bg: {
    light: {
      default: '#ffffff', // Base/0 White - For general background color of the entire UI
      subtle: '#f9f8f6', // gray[50] warm - For secondary background elements (cards, panels, sections)
      muted: '#f1efeb', // gray[100] warm - For tertiary background elements (tooltips, badges)
      emphasis: '#e3dfd9', // gray[200] warm - Used for background elements requiring more visual emphasis
      active: '#cdc8c0', // gray[300] warm - Used for background elements currently active or hovered over
      selected: '#e8f6f9', // primary[50] teal - Used for background elements currently selected
      /** Glass card background — semi-transparent white for backdrop-filter blur effect (web) */
      glass: 'rgba(255, 255, 255, 0.7)',
      /** Glass card fallback — higher opacity for native platforms without backdrop-filter */
      glassFallback: 'rgba(249, 248, 246, 0.88)', // gray[50] warm @ 88%
      /** Radial gradient background for dashboard surfaces (web CSS string) */
      gradient: 'radial-gradient(circle at top right, #f1efeb, #e3dfd9)', // gray[100] → gray[200]
      /** Drawer/sidebar nav active item background (comp blue-grey). Use with white text and icon. */
      drawerNavActive: '#5a778a',
      overlay: 'rgba(0, 0, 0, 0.5)', // Black 50 opacity - Used for overlay elements (modals, dialogs)
      disabled: '#f1efeb', // gray[100] warm - Used for background elements currently disabled
    },
    dark: {
      default: '#16110d', // gray[900] warm - For general background color of the entire UI
      subtle: '#1e1914', // gray[800] warm - For secondary background elements
      muted: '#2f2820', // gray[750] warm - For tertiary background elements
      emphasis: '#3c352c', // gray[700] warm - Used for background elements requiring more visual emphasis
      active: '#504940', // gray[600] warm - Used for background elements currently active or hovered over
      selected: '#0a3540', // dark teal tint - Used for background elements currently selected
      /** Glass card background — semi-transparent dark for backdrop-filter blur effect (web) */
      glass: 'rgba(30, 25, 20, 0.7)', // gray[800] warm @ 70%
      /** Glass card fallback — higher opacity for native platforms without backdrop-filter */
      glassFallback: 'rgba(30, 25, 20, 0.88)', // gray[800] warm @ 88%
      /** Radial gradient background for dashboard surfaces (web CSS string) */
      gradient: 'radial-gradient(circle at top right, #2f2820, #16110d)', // gray[750] → gray[900]
      /** Drawer/sidebar nav active item background. Use with white text and icon. */
      drawerNavActive: '#5a778a',
      overlay: 'rgba(0, 0, 0, 0.5)', // Black 50 opacity - Used for overlay elements
      disabled: '#16110d', // gray[900] warm - Used for background elements currently disabled (darker than normal, suppressed)
    },
    // Backward compatibility aliases (reference light mode)
    primary: '#ffffff', // Alias for bg.light.default
    secondary: '#f9f8f6', // Alias for bg.light.subtle
    tertiary: '#f1efeb', // Alias for bg.light.muted
    hover: '#f9f8f6', // Alias for bg.light.subtle
    disabled: '#e3dfd9', // Alias for bg.light.emphasis (note: uses gray[200] warm for backward compat)
  },

  // Border Color Tokens
  // Semantic tokens for borders with comprehensive states and light/dark mode support
  border: {
    light: {
      default: '#e3dfd9', // gray[200] warm - Primary border color for all general UI elements
      subtle: '#f1efeb', // gray[100] warm - Used for subtle borders providing delicate visual separation
      muted: '#cdc8c0', // gray[300] warm - Used for muted borders providing subtle visual separation
      emphasis: '#9e9790', // gray[400] warm - Used for borders requiring more visual emphasis
      active: '#1d7282', // primary[500] teal - Used for borders currently active or hovered over
      selected: '#1d7282', // primary[500] teal - Used for borders currently selected
      disabled: '#e3dfd9', // gray[200] warm - Used for borders currently disabled
      focus: '#1d7282', // primary[500] teal - Used for borders currently focused (input fields, buttons)
      error: '#b84f3b', // error[500] terracotta - Used for borders indicating an error state
      warning: '#9a6614', // warning[500] ochre - Used for borders indicating a warning state
      success: '#3a7d4c', // success[500] moss - Used for borders indicating a success state
      info: '#2e72a0', // info[500] slate - Used for borders indicating an informational state
      /** Ghost border — barely visible outline for glass cards and subtle separation */
      ghost: 'rgba(176, 179, 173, 0.2)', // comp ghost border (outline-variant @ 20%)
    },
    dark: {
      default: '#6e6760', // gray[500] warm - Primary border color for all general UI elements (3.36:1)
      subtle: '#3c352c', // gray[700] warm - Used for subtle borders
      muted: '#504940', // gray[600] warm - Used for muted borders
      emphasis: '#9e9790', // gray[400] warm - Used for borders requiring more visual emphasis
      active: '#1d7282', // primary[500] teal - Used for borders currently active
      selected: '#1d7282', // primary[500] teal - Used for borders currently selected
      disabled: '#3c352c', // gray[700] warm - Used for borders currently disabled
      focus: '#1d7282', // primary[500] teal - Used for borders currently focused
      error: '#b84f3b', // error[500] terracotta - Used for borders indicating an error state
      warning: '#9a6614', // warning[500] ochre - Used for borders indicating a warning state
      success: '#3a7d4c', // success[500] moss - Used for borders indicating a success state
      info: '#2e72a0', // info[500] slate - Used for borders indicating an informational state
      /** Ghost border — barely visible outline for glass cards and subtle separation */
      ghost: 'rgba(110, 103, 96, 0.2)', // gray[500] warm @ 20%
    },
    // Backward compatibility aliases (reference light mode)
    // Note: 'light' alias removed - use border.light.subtle instead (conflicts with border.light object)
    default: '#e3dfd9', // Alias for border.light.default
    focus: '#125b69', // Alias for border.light.focus (primary[600] teal for backward compat)
    error: '#963c2a', // Alias for border.light.error (error[600] terracotta for backward compat)
  },

  // Foreground Color Tokens
  // Semantic tokens for non-text foreground elements with light/dark mode support
  fg: {
    light: {
      default: '#16110d', // gray[900] warm - Primary foreground color for all general UI elements
      subtle: '#3c352c', // gray[700] warm - Used for subtle foreground elements
      muted: '#6e6760', // gray[500] warm - Used for muted foreground elements
      emphasis: '#9e9790', // gray[400] warm - Used for foreground elements requiring more visual emphasis
      active: '#1d7282', // primary[500] teal - Used for foreground elements currently active or hovered over
      selected: '#1d7282', // primary[500] teal - Used for foreground elements currently selected
      disabled: '#cdc8c0', // gray[300] warm - Used for foreground elements currently disabled
      error: '#b84f3b', // error[500] terracotta - Used for foreground elements indicating an error state
      warning: '#9a6614', // warning[500] ochre - Used for foreground elements indicating a warning state
      success: '#3a7d4c', // success[500] moss - Used for foreground elements indicating a success state
      info: '#2e72a0', // info[500] slate - Used for foreground elements indicating an informational state
    },
    dark: {
      default: '#ffffff', // Base/0 White - Primary foreground color for all general UI elements
      subtle: '#e3dfd9', // gray[200] warm - Used for subtle foreground elements
      muted: '#9e9790', // gray[400] warm - Used for muted foreground elements
      emphasis: '#6e6760', // gray[500] warm - Used for foreground elements requiring more visual emphasis
      active: '#1d7282', // primary[500] teal - Used for foreground elements currently active
      selected: '#1d7282', // primary[500] teal - Used for foreground elements currently selected
      disabled: '#504940', // gray[600] warm - Used for foreground elements currently disabled
      error: '#b84f3b', // error[500] terracotta - Used for foreground elements indicating an error state
      warning: '#9a6614', // warning[500] ochre - Used for foreground elements indicating a warning state
      success: '#3a7d4c', // success[500] moss - Used for foreground elements indicating a success state
      info: '#2e72a0', // info[500] slate - Used for foreground elements indicating an informational state
    },
  },

  // Icon Color Tokens
  // Semantic tokens specifically for icons with light/dark mode support
  icon: {
    light: {
      default: '#16110d', // gray[900] warm - Primary icon color for all general UI elements
      subtle: '#3c352c', // gray[700] warm - Used for subtle icons
      muted: '#6e6760', // gray[500] warm - Used for muted icons
      emphasis: '#9e9790', // gray[400] warm - Used for icons requiring more visual emphasis
      active: '#1d7282', // primary[500] teal - Used for icons currently active or hovered over
      selected: '#1d7282', // primary[500] teal - Used for icons currently selected
      disabled: '#cdc8c0', // gray[300] warm - Used for icons currently disabled
      error: '#b84f3b', // error[500] terracotta - Used for icons indicating an error state
      warning: '#9a6614', // warning[500] ochre - Used for icons indicating a warning state
      success: '#3a7d4c', // success[500] moss - Used for icons indicating a success state
      info: '#2e72a0', // info[500] slate - Used for icons indicating an informational state
    },
    dark: {
      default: '#ffffff', // Base/0 White - Primary icon color for all general UI elements
      subtle: '#e3dfd9', // gray[200] warm - Used for subtle icons
      muted: '#9e9790', // gray[400] warm - Used for muted icons
      emphasis: '#6e6760', // gray[500] warm - Used for icons requiring more visual emphasis
      active: '#1d7282', // primary[500] teal - Used for icons currently active
      selected: '#1d7282', // primary[500] teal - Used for icons currently selected
      disabled: '#504940', // gray[600] warm - Used for icons currently disabled
      error: '#b84f3b', // error[500] terracotta - Used for icons indicating an error state
      warning: '#9a6614', // warning[500] ochre - Used for icons indicating a warning state
      success: '#3a7d4c', // success[500] moss - Used for icons indicating a success state
      info: '#2e72a0', // info[500] slate - Used for icons indicating an informational state
    },
  },
} as const

export type ColorToken = typeof colors
export type ColorShade = 50 | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 750 | 800 | 900

// Semantic token type definitions
export type TextColorToken = keyof typeof colors.text.light
export type BackgroundColorToken = keyof typeof colors.bg.light
export type BorderColorToken = keyof typeof colors.border.light
export type ForegroundColorToken = keyof typeof colors.fg.light
export type IconColorToken = keyof typeof colors.icon.light

/** Union of color token key types (e.g. "$gray11") - use for component color props */
export type ColorTokens =
  | TextColorToken
  | BackgroundColorToken
  | BorderColorToken
  | ForegroundColorToken
  | IconColorToken

// Theme mode type - 'system' follows OS preference
export type ThemeMode = 'light' | 'dark' | 'system'

/** Resolved theme for actual color lookup (no 'system') */
export type ResolvedThemeMode = 'light' | 'dark'
