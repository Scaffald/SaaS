/**
 * Shadow tokens for elevation and depth
 *
 * Mapped from Figma Forsured Design System Drop Shadow effects.
 * All shadows use gray[900] (#141c25) as the base color with varying opacity.
 * Compatible with both web (boxShadow) and React Native (shadowOffset, shadowOpacity, etc.)
 */

/**
 * Shadow color from Figma
 * gray[900] (#16110d) warm near-black with varying opacity
 */
const shadowColor = '#16110d'

/**
 * Shadow definitions mapped from Figma Forsured Design System
 * Each shadow matches the exact specifications from Figma variable definitions
 */
export const shadows = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0, // Android elevation
  },

  // Extra small shadow - shadow-xs
  // Color: #141c250d (5% opacity), Offset: (0, 1), Radius: 2, Spread: 0
  xs: {
    shadowColor,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 13 / 255, // #141c250d = 13/255 ≈ 0.051 (5% opacity)
    shadowRadius: 2,
    elevation: 1,
  },

  // Small shadow - shadow-s
  // Color: #141c2514 (8% opacity), Offset: (0, 1), Radius: 3, Spread: 0
  s: {
    shadowColor,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 20 / 255, // #141c2514 = 20/255 ≈ 0.078 (8% opacity)
    shadowRadius: 3,
    elevation: 2,
  },

  // Medium shadow - shadow-m
  // Color: #141c2514 (8% opacity), Offset: (0, 4), Radius: 6, Spread: -1
  m: {
    shadowColor,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 20 / 255, // #141c2514 = 20/255 ≈ 0.078 (8% opacity)
    shadowRadius: 6,
    elevation: 4,
  },

  // Large shadow - shadow-l
  // Color: #141c2514 (8% opacity), Offset: (0, 10), Radius: 15, Spread: -3
  l: {
    shadowColor,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 20 / 255, // #141c2514 = 20/255 ≈ 0.078 (8% opacity)
    shadowRadius: 15,
    elevation: 8,
  },

  // Extra large shadow - shadow-xl
  // Color: #141c251a (10% opacity), Offset: (0, 20), Radius: 25, Spread: -5
  xl: {
    shadowColor,
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 26 / 255, // #141c251a = 26/255 ≈ 0.102 (10% opacity)
    shadowRadius: 25,
    elevation: 12,
  },

  // Extra extra large shadow - shadow-xxl
  // Color: #141c2540 (25% opacity), Offset: (0, 25), Radius: 50, Spread: -12
  xxl: {
    shadowColor,
    shadowOffset: { width: 0, height: 25 },
    shadowOpacity: 64 / 255, // #141c2540 = 64/255 ≈ 0.251 (25% opacity)
    shadowRadius: 50,
    elevation: 16,
  },

  // Button shadow - button-shadow
  // Color: #141c250a (4% opacity), Offset: (0, 1), Radius: 2, Spread: 0
  button: {
    shadowColor,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 10 / 255, // #141c250a = 10/255 ≈ 0.039 (4% opacity)
    shadowRadius: 2,
    elevation: 1,
  },

  // Tabs shadow - tabs-shadow
  // Color: #141c250d (5% opacity), Offset: (0, 1), Radius: 3, Spread: 0
  tabs: {
    shadowColor,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 13 / 255, // #141c250d = 13/255 ≈ 0.051 (5% opacity)
    shadowRadius: 3,
    elevation: 2,
  },

  // Focus state shadows - Base
  // Double shadow: Outer ring (icon-300 #ced2da, spread: 4) + Inner ring (white, spread: 2)
  // Offset: (0, 0), Radius: 0 for both (pure outline effect)
  focusBase: {
    shadowColor: '#ced2da', // icon-300 - outer ring
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 0, // Pure spread, no blur
    elevation: 0,
    // Note: React Native doesn't support spread radius well.
    // For web, use boxShadows.focusBase which includes both shadows.
    // For React Native, consider using border-based focus indicators.
  },

  // Focus state shadows - Primary (Brand)
  // Double shadow: Outer ring (primary[200] teal #91d8e2, spread: 4) + Inner ring (white, spread: 2)
  focusPrimary: {
    shadowColor: '#7fd1de', // primary[200] teal - outer ring
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 0, // Pure spread, no blur
    elevation: 0,
    // Note: React Native doesn't support spread radius well.
    // For web, use boxShadows.focusPrimary which includes both shadows.
    // For React Native, consider using border-based focus indicators.
  },

  // Focus state shadows - Error
  // Double shadow: Outer ring (error[300] terracotta #e58e80, spread: 4) + Inner ring (white, spread: 2)
  focusError: {
    shadowColor: '#e58e80', // error[300] terracotta - outer ring
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 0, // Pure spread, no blur
    elevation: 0,
    // Note: React Native doesn't support spread radius well.
    // For web, use boxShadows.focusError which includes both shadows.
    // For React Native, consider using border-based focus indicators.
  },

  // Soft wide-diffused shadow - matches comp's "0 4px 20px -2px rgba(0,0,0,0.05)"
  // Lighter and more airy than shadow-m; ideal for profile/dashboard cards
  soft: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },

  // Legacy aliases for backward compatibility
  sm: {
    shadowColor,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 20 / 255, // Matches shadow-s
    shadowRadius: 3,
    elevation: 2,
  },
  md: {
    shadowColor,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 20 / 255, // Matches shadow-m
    shadowRadius: 6,
    elevation: 4,
  },
  lg: {
    shadowColor,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 20 / 255, // Matches shadow-l
    shadowRadius: 15,
    elevation: 8,
  },
  '2xl': {
    shadowColor,
    shadowOffset: { width: 0, height: 25 },
    shadowOpacity: 64 / 255, // Matches shadow-xxl
    shadowRadius: 50,
    elevation: 16,
  },
} as const

/**
 * Web-specific box-shadow CSS strings
 * Use these for web-only components or when React Native Web doesn't support shadow props
 * Values match Figma Forsured Design System shadow specifications exactly
 * Format: offsetX offsetY blurRadius spreadRadius color
 */
export const boxShadows = {
  none: 'none',

  // Extra small shadow - shadow-xs
  xs: '0 1px 2px 0 rgba(22, 17, 13, 0.051)', // #16110d0d

  // Small shadow - shadow-s
  s: '0 1px 3px 0 rgba(22, 17, 13, 0.078)', // #16110d14

  // Medium shadow - shadow-m
  m: '0 4px 6px -1px rgba(22, 17, 13, 0.078)', // #16110d14, spread: -1

  // Large shadow - shadow-l
  l: '0 10px 15px -3px rgba(22, 17, 13, 0.078)', // #16110d14, spread: -3

  // Extra large shadow - shadow-xl
  xl: '0 20px 25px -5px rgba(22, 17, 13, 0.102)', // #16110d1a, spread: -5

  // Extra extra large shadow - shadow-xxl
  xxl: '0 25px 50px -12px rgba(22, 17, 13, 0.251)', // #16110d40, spread: -12

  // Button shadow - button-shadow
  button: '0 1px 2px 0 rgba(22, 17, 13, 0.039)', // #16110d0a

  // Tabs shadow - tabs-shadow
  tabs: '0 1px 3px 0 rgba(22, 17, 13, 0.051)', // #16110d0d

  // Focus state shadows - Base
  // Double shadow creates an outline ring: Outer gray ring (4px spread) + Inner white ring (2px spread)
  // Format: "outerShadow, innerShadow"
  focusBase: '0 0 0 4px rgba(206, 210, 218, 1), 0 0 0 2px rgba(255, 255, 255, 1)', // icon-300 outer, white inner

  // Focus state shadows - Primary (Brand)
  // Double shadow creates an outline ring: Outer primary ring (4px spread) + Inner white ring (2px spread)
  focusPrimary: '0 0 0 4px rgba(127, 209, 222, 1), 0 0 0 2px rgba(255, 255, 255, 1)', // primary[200] teal outer, white inner

  // Focus state shadows - Error
  // Double shadow creates an outline ring: Outer error ring (4px spread) + Inner white ring (2px spread)
  focusError: '0 0 0 4px rgba(229, 142, 128, 1), 0 0 0 2px rgba(255, 255, 255, 1)', // error[300] terracotta outer, white inner

  // Soft wide-diffused shadow - matches comp's card shadow
  soft: '0 4px 20px -2px rgba(0, 0, 0, 0.05)',

  // Legacy aliases for backward compatibility
  sm: '0 1px 3px 0 rgba(22, 17, 13, 0.078)', // Matches shadow-s
  md: '0 4px 6px -1px rgba(22, 17, 13, 0.078)', // Matches shadow-m
  lg: '0 10px 15px -3px rgba(22, 17, 13, 0.078)', // Matches shadow-l
  '2xl': '0 25px 50px -12px rgba(22, 17, 13, 0.251)', // Matches shadow-xxl
} as const

/**
 * Elevation levels for semantic naming
 * Maps semantic names to shadow tokens for consistent usage
 */
export const elevation = {
  flat: shadows.none, // No shadow
  raised: shadows.xs, // Slightly elevated (subtle elevation)
  floating: shadows.s, // Floating above (cards, chips)
  modal: shadows.m, // Modal dialogs, dropdowns
  drawer: shadows.l, // Side sheets, drawers
  overlay: shadows.xl, // Large overlays
  topLevel: shadows.xxl, // Top-level overlays, maximum elevation

  // Legacy aliases for backward compatibility
  sm: shadows.s,
  md: shadows.m,
  lg: shadows.l,
  '2xl': shadows.xxl,
} as const

export type ShadowToken = keyof typeof shadows
export type BoxShadowToken = keyof typeof boxShadows
export type ElevationToken = keyof typeof elevation
