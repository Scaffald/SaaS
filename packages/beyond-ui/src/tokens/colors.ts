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
 * The `gray` color family maps directly to the Figma Base scale:
 * - Base/0 White = white (#ffffff)
 * - Base/50 = gray[50] (#f9fafb)
 * - Base/100 = gray[100] (#f2f4f7)
 * - Base/200 = gray[200] (#e4e7ec)
 * - Base/300 = gray[300] (#ced2da)
 * - Base/400 = gray[400] (#97a1af)
 * - Base/500 = gray[500] (#637083)
 * - Base/600 = gray[600] (#414e62)
 * - Base/700 = gray[700] (#344051)
 * - Base/800 = gray[800] (#1a232d)
 * - Base/900 = gray[900] (#141c25)
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
    50: '#fff3ec',
    100: '#ffe3d4',
    200: '#ffc4a8',
    300: '#ff9c78',
    400: '#ff7a4f',
    500: '#fb612a', // Default primary - matches Figma Primary Brand/500
    600: '#d54e21',
    700: '#a63c17',
    800: '#6a260f',
    900: '#45170a',
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

  // Base/Gray Scale
  gray: {
    50: '#f9fafb',
    100: '#f2f4f7',
    200: '#e4e7ec',
    300: '#ced2da',
    400: '#97a1af',
    500: '#637083',
    600: '#414e62',
    700: '#344051',
    750: '#27313f', // Extra shade for fine control
    800: '#1a232d',
    900: '#141c25',
  },

  // Semantic Colors
  info: {
    50: '#f0f9ff',
    100: '#e0f2fe',
    200: '#b9e6fe',
    300: '#7cd4fd',
    400: '#36bffa',
    500: '#0ba5ec',
    600: '#0086c9',
    700: '#026aa2',
    800: '#065986',
    900: '#0b4a6f',
  },

  success: {
    50: '#ecfdf5',
    100: '#d1fae5',
    200: '#a7f3d0',
    300: '#6ee7b7',
    400: '#34d399',
    500: '#10b978',
    600: '#059669',
    700: '#047857',
    800: '#065f46',
    900: '#064e3b',
  },

  warning: {
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

  error: {
    50: '#ffe5e5',
    100: '#ffc2c2',
    200: '#ffa3a3',
    300: '#ff8585',
    400: '#ff6666',
    500: '#ff4d4d',
    600: '#f62c2c',
    700: '#de1212',
    800: '#b01111',
    900: '#790c0c',
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
      primary: '#141c25', // Base/900 - Reserved for title text
      secondary: '#344051', // Base/700 - Reserved for body paragraphs
      tertiary: '#637083', // Base/500 - Reserved for secondary text
      disabled: '#ced2da', // Base/300 - Context for operational disabilities
      quaternary: '#ffffff', // Base/0 White - Contrast for optimal readability (inverse text)
    },
    dark: {
      primary: '#ffffff', // Base/0 White - Reserved for title text
      secondary: '#e4e7ec', // Base/200 - Reserved for body paragraphs
      tertiary: '#97a1af', // Base/400 - Reserved for secondary text
      disabled: '#414e62', // Base/600 - Context for operational disabilities
      quaternary: '#141c25', // Base/900 - Contrast for optimal readability (inverse text)
    },
    // Backward compatibility aliases (reference light mode)
    primary: '#141c25', // Alias for text.light.primary
    secondary: '#344051', // Alias for text.light.secondary
    tertiary: '#637083', // Alias for text.light.tertiary
    disabled: '#97a1af', // Alias for text.light.disabled (note: uses gray[400] for backward compat)
    inverse: '#ffffff', // Alias for text.light.quaternary
  },

  // Background Color Tokens
  // Semantic tokens for different background contexts with light/dark mode support
  bg: {
    light: {
      default: '#ffffff', // Base/0 White - For general background color of the entire UI
      subtle: '#f9fafb', // Base/50 - For secondary background elements (cards, panels, sections)
      muted: '#f2f4f7', // Base/100 - For tertiary background elements (tooltips, badges)
      emphasis: '#e4e7ec', // Base/200 - Used for background elements requiring more visual emphasis (selected states, active tabs)
      active: '#ced2da', // Base/300 - Used for background elements currently active or hovered over
      selected: '#dbeafe', // Blue 50 - Used for background elements currently selected (selected rows, list items)
      overlay: 'rgba(0, 0, 0, 0.5)', // Black 50 opacity - Used for overlay elements (modals, dialogs)
      disabled: '#f2f4f7', // Base/100 - Used for background elements currently disabled
    },
    dark: {
      default: '#141c25', // Base/900 - For general background color of the entire UI
      subtle: '#1a232d', // Base/800 - For secondary background elements
      muted: '#27313f', // Base/750 - For tertiary background elements
      emphasis: '#344051', // Base/700 - Used for background elements requiring more visual emphasis
      active: '#414e62', // Base/600 - Used for background elements currently active or hovered over
      selected: '#1e3a8a', // Blue 900 - Used for background elements currently selected
      overlay: 'rgba(0, 0, 0, 0.5)', // Black 50 opacity - Used for overlay elements
      disabled: '#1a232d', // Base/800 - Used for background elements currently disabled
    },
    // Backward compatibility aliases (reference light mode)
    primary: '#ffffff', // Alias for bg.light.default
    secondary: '#f9fafb', // Alias for bg.light.subtle
    tertiary: '#f2f4f7', // Alias for bg.light.muted
    hover: '#f9fafb', // Alias for bg.light.subtle
    disabled: '#e4e7ec', // Alias for bg.light.emphasis (note: uses gray[200] for backward compat)
  },

  // Border Color Tokens
  // Semantic tokens for borders with comprehensive states and light/dark mode support
  border: {
    light: {
      default: '#e4e7ec', // Base/200 - Primary border color for all general UI elements
      subtle: '#f2f4f7', // Base/100 - Used for subtle borders providing delicate visual separation
      muted: '#ced2da', // Base/300 - Used for muted borders providing subtle visual separation
      emphasis: '#97a1af', // Base/400 - Used for borders requiring more visual emphasis (active tabs, selected items)
      active: '#3b82f6', // Blue 500 - Used for borders currently active or hovered over
      selected: '#3b82f6', // Blue 500 - Used for borders currently selected
      disabled: '#e4e7ec', // Base/200 - Used for borders currently disabled
      focus: '#3b82f6', // Blue 500 - Used for borders currently focused (input fields, buttons)
      error: '#ef4444', // Red 500 - Used for borders indicating an error state
      warning: '#f59e0b', // Yellow 500 - Used for borders indicating a warning state
      success: '#22c55e', // Green 500 - Used for borders indicating a success state
      info: '#3b82f6', // Blue 500 - Used for borders indicating an informational state
    },
    dark: {
      default: '#344051', // Base/700 - Primary border color for all general UI elements
      subtle: '#1a232d', // Base/800 - Used for subtle borders
      muted: '#414e62', // Base/600 - Used for muted borders
      emphasis: '#637083', // Base/500 - Used for borders requiring more visual emphasis
      active: '#3b82f6', // Blue 500 - Used for borders currently active (same as light)
      selected: '#3b82f6', // Blue 500 - Used for borders currently selected (same as light)
      disabled: '#344051', // Base/700 - Used for borders currently disabled
      focus: '#3b82f6', // Blue 500 - Used for borders currently focused (same as light)
      error: '#ef4444', // Red 500 - Used for borders indicating an error state (same as light)
      warning: '#f59e0b', // Yellow 500 - Used for borders indicating a warning state (same as light)
      success: '#22c55e', // Green 500 - Used for borders indicating a success state (same as light)
      info: '#3b82f6', // Blue 500 - Used for borders indicating an informational state (same as light)
    },
    // Backward compatibility aliases (reference light mode)
    // Note: 'light' alias removed - use border.light.subtle instead (conflicts with border.light object)
    default: '#e4e7ec', // Alias for border.light.default
    focus: '#d54e21', // Alias for border.light.focus (note: uses primary[600] for backward compat)
    error: '#f62c2c', // Alias for border.light.error (note: uses error[600] for backward compat)
  },

  // Foreground Color Tokens
  // Semantic tokens for non-text foreground elements with light/dark mode support
  fg: {
    light: {
      default: '#141c25', // Base/900 - Primary foreground color for all general UI elements
      subtle: '#344051', // Base/700 - Used for subtle foreground elements
      muted: '#637083', // Base/500 - Used for muted foreground elements
      emphasis: '#97a1af', // Base/400 - Used for foreground elements requiring more visual emphasis
      active: '#3b82f6', // Blue 500 - Used for foreground elements currently active or hovered over
      selected: '#3b82f6', // Blue 500 - Used for foreground elements currently selected
      disabled: '#ced2da', // Base/300 - Used for foreground elements currently disabled
      error: '#ef4444', // Red 500 - Used for foreground elements indicating an error state
      warning: '#f59e0b', // Yellow 500 - Used for foreground elements indicating a warning state
      success: '#22c55e', // Green 500 - Used for foreground elements indicating a success state
      info: '#3b82f6', // Blue 500 - Used for foreground elements indicating an informational state
    },
    dark: {
      default: '#ffffff', // Base/0 White - Primary foreground color for all general UI elements
      subtle: '#e4e7ec', // Base/200 - Used for subtle foreground elements
      muted: '#97a1af', // Base/400 - Used for muted foreground elements
      emphasis: '#637083', // Base/500 - Used for foreground elements requiring more visual emphasis
      active: '#3b82f6', // Blue 500 - Used for foreground elements currently active (same as light)
      selected: '#3b82f6', // Blue 500 - Used for foreground elements currently selected (same as light)
      disabled: '#414e62', // Base/600 - Used for foreground elements currently disabled
      error: '#ef4444', // Red 500 - Used for foreground elements indicating an error state (same as light)
      warning: '#f59e0b', // Yellow 500 - Used for foreground elements indicating a warning state (same as light)
      success: '#22c55e', // Green 500 - Used for foreground elements indicating a success state (same as light)
      info: '#3b82f6', // Blue 500 - Used for foreground elements indicating an informational state (same as light)
    },
  },

  // Icon Color Tokens
  // Semantic tokens specifically for icons with light/dark mode support
  icon: {
    light: {
      default: '#141c25', // Base/900 - Primary icon color for all general UI elements
      subtle: '#344051', // Base/700 - Used for subtle icons
      muted: '#637083', // Base/500 - Used for muted icons (matches Icons/icon-500 from Figma)
      emphasis: '#97a1af', // Base/400 - Used for icons requiring more visual emphasis
      active: '#3b82f6', // Blue 500 - Used for icons currently active or hovered over
      selected: '#3b82f6', // Blue 500 - Used for icons currently selected
      disabled: '#ced2da', // Base/300 - Used for icons currently disabled
      error: '#ef4444', // Red 500 - Used for icons indicating an error state
      warning: '#f59e0b', // Yellow 500 - Used for icons indicating a warning state
      success: '#22c55e', // Green 500 - Used for icons indicating a success state
      info: '#3b82f6', // Blue 500 - Used for icons indicating an informational state
    },
    dark: {
      default: '#ffffff', // Base/0 White - Primary icon color for all general UI elements
      subtle: '#e4e7ec', // Base/200 - Used for subtle icons
      muted: '#97a1af', // Base/400 - Used for muted icons
      emphasis: '#637083', // Base/500 - Used for icons requiring more visual emphasis
      active: '#3b82f6', // Blue 500 - Used for icons currently active (same as light)
      selected: '#3b82f6', // Blue 500 - Used for icons currently selected (same as light)
      disabled: '#414e62', // Base/600 - Used for icons currently disabled
      error: '#ef4444', // Red 500 - Used for icons indicating an error state (same as light)
      warning: '#f59e0b', // Yellow 500 - Used for icons indicating a warning state (same as light)
      success: '#22c55e', // Green 500 - Used for icons indicating a success state (same as light)
      info: '#3b82f6', // Blue 500 - Used for icons indicating an informational state (same as light)
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

// Theme mode type
export type ThemeMode = 'light' | 'dark'
