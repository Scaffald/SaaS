/**
 * Scaffald Brand Colors
 *
 * Official brand color palette for consistent usage across the application
 */

export const BRAND_COLORS = {
  // Primary Colors
  primary: '#034550',
  secondary: '#2A7F8E',

  // Gradient Colors
  gradientStart: '#76EAFF',
  gradientEnd: '#239CB2',

  // Alternative Gradients
  gradientAlt: {
    start: '#4FD1C7',
    end: '#2D3748',
  },

  // Semantic Colors
  success: '#38A169',
  warning: '#D69E2E',
  error: '#E53E3E',
  info: '#3182CE',

  // Neutral Colors
  gray: {
    50: '#F7FAFC',
    100: '#EDF2F7',
    200: '#E2E8F0',
    300: '#CBD5E0',
    400: '#A0AEC0',
    500: '#718096',
    600: '#4A5568',
    700: '#2D3748',
    800: '#1A202C',
    900: '#171923',
  },
} as const

export type BrandColors = typeof BRAND_COLORS
