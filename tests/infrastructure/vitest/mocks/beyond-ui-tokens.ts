export const borderRadius = {
  none: 0,
  xxxs: 2,
  xxs: 4,
  xs: 6,
  s: 8,
  m: 10,
  l: 12,
  xl: 16,
  xxl: 20,
  xxxl: 32,
  xxxxl: 48,
  max: 999,
}

export const spacing = {
  0: 0, 2: 2, 4: 4, 6: 6, 8: 8, 10: 10, 12: 12, 16: 16, 20: 20, 24: 24,
  28: 28, 32: 32, 40: 40, 48: 48, 64: 64, 80: 80, 96: 96, 128: 128,
}

export const fontSize = {
  xs: 12, sm: 14, base: 16, md: 16, lg: 18, xl: 20, '2xl': 24, '3xl': 30, '4xl': 36, '5xl': 48,
}

export const lineHeight = {
  xs: 16, sm: 20, base: 24, md: 24, lg: 28, xl: 32, '2xl': 36, '3xl': 40, '4xl': 48, '5xl': 56,
}

export const fontWeight = {
  thin: '100', light: '300', normal: '400', medium: '500', semibold: '600', bold: '700', extrabold: '800',
}

export const namedSpacing = {
  none: 0,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 40,
  '5xl': 48,
}

export const gap = {
  none: 0, xs: 4, sm: 8, md: 12, lg: 16, xl: 20, '2xl': 24, '3xl': 32,
  '4xl': 40, '5xl': 48, '6xl': 64, '7xl': 80, '8xl': 96, '9xl': 128,
}

// Glassmorphic / vibrant accent palette referenced by some surfaces.
// Same shape as `colors` (semantic.theme.variant) for consumer parity.
const glassPalette = {
  separator: '#e4e7ec',
  primaryFill: 'rgba(255,255,255,0.7)',
  secondaryFill: 'rgba(255,255,255,0.5)',
  tertiaryFill: 'rgba(255,255,255,0.35)',
  primaryText: '#141c25',
  secondaryText: '#344051',
  tertiaryText: '#637083',
  accent: '#1d7282',
  pillBg: 'rgba(29,114,130,0.15)',
  pillText: '#1d7282',
}
export const glassVibrantColors = {
  light: glassPalette,
  dark: { ...glassPalette, separator: '#344051', primaryText: '#ffffff', secondaryText: '#e4e7ec', tertiaryText: '#97a1af' },
}

export const colors = {
  white: '#ffffff',
  primary: { 50: '#e8f6f9', 100: '#bde9f0', 200: '#7fd1de', 300: '#3fb5c7', 400: '#1e96a8', 500: '#1d7282', 600: '#125b69', 700: '#034550', 800: '#022d38', 900: '#011d24' },
  error: { 50: '#fef2f2', 100: '#fee2e2', 200: '#fecaca', 300: '#fca5a5', 400: '#f87171', 500: '#f43f5e', 600: '#ef4444', 700: '#b91c1c', 800: '#991b1b', 900: '#7f1d1d' },
  gray: { 100: '#f2f4f7', 200: '#e4e7ec', 400: '#97a1af', 500: '#667085', 600: '#414e62', 700: '#344051', 800: '#27313f', 900: '#1a232d' },
  success: { 50: '#f0fdf4', 100: '#dcfce7', 300: '#86efac', 400: '#4ade80', 600: '#16a34a', 700: '#15803d', 900: '#14532d' },
  warning: { 50: '#fffbeb', 100: '#fef3c7', 300: '#fcd34d', 400: '#fbbf24', 600: '#d97706', 700: '#b45309', 900: '#78350f' },
  info: { 50: '#eff6ff', 100: '#dbeafe', 300: '#93c5fd', 400: '#60a5fa', 600: '#2563eb', 700: '#1d4ed8', 900: '#1e3a8a' },
  green: { 50: '#f0fdf4', 300: '#86efac', 600: '#16a34a', 700: '#15803d', 900: '#14532d' },
  blue: { 50: '#eff6ff', 300: '#93c5fd', 400: '#60a5fa', 500: '#3b82f6', 600: '#2563eb', 700: '#1d4ed8', 900: '#1e3a8a' },
  purple: { 50: '#faf5ff', 100: '#f3e8ff', 200: '#e9d5ff', 300: '#d8b4fe', 400: '#c084fc', 500: '#a855f7', 600: '#9333ea', 700: '#7e22ce', 800: '#6b21a8', 900: '#581c87' },
  amber: { 50: '#fffbeb', 300: '#fcd34d', 400: '#fbbf24', 500: '#f59e0b', 600: '#d97706', 700: '#b45309' },
  red: { 50: '#fef2f2', 300: '#fca5a5', 400: '#f87171', 500: '#ef4444', 600: '#dc2626', 700: '#b91c1c' },
  yellow: { 50: '#fefce8', 100: '#fef9c3', 200: '#fef08a', 300: '#fde047', 400: '#facc15', 500: '#eab308', 600: '#ca8a04', 700: '#a16207', 800: '#854d0e', 900: '#713f12' },
  orange: { 50: '#fff7ed', 300: '#fdba74', 400: '#fb923c', 500: '#f97316', 600: '#ea580c', 700: '#c2410c' },
  violet: { 50: '#f5f3ff', 100: '#ede9fe', 300: '#c4b5fd', 400: '#a78bfa', 500: '#8b5cf6', 600: '#7c3aed', 700: '#6d28d9', 800: '#5b21b6', 900: '#4c1d95' },
  teal: { 50: '#f0fdfa', 100: '#ccfbf1', 300: '#5eead4', 400: '#2dd4bf', 500: '#14b8a6', 600: '#0d9488', 700: '#0f766e', 800: '#115e59', 900: '#134e4a' },
  slate: { 50: '#f8fafc', 100: '#f1f5f9', 200: '#e2e8f0', 300: '#cbd5e1', 400: '#94a3b8', 500: '#64748b', 600: '#475569', 700: '#334155', 800: '#1e293b', 900: '#0f172a' },
  sky: { 50: '#f0f9ff', 100: '#e0f2fe', 300: '#7dd3fc', 400: '#38bdf8', 500: '#0ea5e9', 600: '#0284c7', 700: '#0369a1', 800: '#075985', 900: '#0c4a6e' },
  emerald: { 50: '#ecfdf5', 100: '#d1fae5', 300: '#6ee7b7', 400: '#34d399', 500: '#10b981', 600: '#059669', 700: '#047857', 800: '#065f46', 900: '#064e3b' },
  pink: { 50: '#fdf2f8', 100: '#fce7f3', 300: '#f9a8d4', 400: '#f472b6', 500: '#ec4899', 600: '#db2777', 700: '#be185d', 800: '#9d174d', 900: '#831843' },
  indigo: { 50: '#eef2ff', 100: '#e0e7ff', 300: '#a5b4fc', 400: '#818cf8', 500: '#6366f1', 600: '#4f46e5', 700: '#4338ca', 800: '#3730a3', 900: '#312e81' },
  cyan: { 50: '#ecfeff', 100: '#cffafe', 300: '#67e8f9', 400: '#22d3ee', 500: '#06b6d4', 600: '#0891b2', 700: '#0e7490', 800: '#155e75', 900: '#164e63' },
  bg: {
    primary: '#ffffff',
    light: {
      default: '#ffffff',
      subtle: '#f9fafb',
      muted: '#f2f4f7',
      emphasis: '#e4e7ec',
      active: '#ced2da',
      selected: '#dbeafe',
      overlay: 'rgba(0, 0, 0, 0.5)',
      disabled: '#f2f4f7',
    },
    dark: {
      default: '#141c25',
      subtle: '#1a232d',
      muted: '#27313f',
      emphasis: '#344051',
      active: '#414e62',
      selected: '#1e3a8a',
      overlay: 'rgba(0, 0, 0, 0.5)',
      disabled: '#1a232d',
    },
  },
  border: {
    light: {
      default: '#e4e7ec',
      subtle: '#f2f4f7',
      muted: '#ced2da',
      emphasis: '#97a1af',
      active: '#3b82f6',
      selected: '#3b82f6',
      disabled: '#e4e7ec',
      focus: '#3b82f6',
      error: '#ef4444',
      warning: '#f59e0b',
      success: '#22c55e',
      info: '#3b82f6',
    },
    dark: {
      default: '#344051',
      subtle: '#1a232d',
      muted: '#414e62',
      emphasis: '#637083',
      active: '#3b82f6',
      selected: '#3b82f6',
      disabled: '#344051',
      focus: '#3b82f6',
      error: '#ef4444',
      warning: '#f59e0b',
      success: '#22c55e',
      info: '#3b82f6',
    },
  },
  text: {
    light: {
      primary: '#141c25',
      secondary: '#344051',
      tertiary: '#637083',
      disabled: '#ced2da',
      quaternary: '#ffffff',
      error: '#ef4444',
      warning: '#f59e0b',
      success: '#22c55e',
      info: '#3b82f6',
    },
    dark: {
      primary: '#ffffff',
      secondary: '#e4e7ec',
      tertiary: '#97a1af',
      disabled: '#414e62',
      quaternary: '#141c25',
      error: '#ef4444',
      warning: '#f59e0b',
      success: '#22c55e',
      info: '#3b82f6',
    },
  },
  fg: {
    light: {
      default: '#141c25',
      subtle: '#344051',
      muted: '#637083',
      emphasis: '#97a1af',
      active: '#3b82f6',
      selected: '#3b82f6',
      disabled: '#ced2da',
      error: '#ef4444',
      warning: '#f59e0b',
      success: '#22c55e',
      info: '#3b82f6',
    },
    dark: {
      default: '#ffffff',
      subtle: '#e4e7ec',
      muted: '#97a1af',
      emphasis: '#637083',
      active: '#3b82f6',
      selected: '#3b82f6',
      disabled: '#414e62',
      error: '#ef4444',
      warning: '#f59e0b',
      success: '#22c55e',
      info: '#3b82f6',
    },
  },
  icon: {
    light: {
      default: '#344051',
      muted: '#637083',
      disabled: '#ced2da',
    },
    dark: {
      default: '#e4e7ec',
      muted: '#97a1af',
      disabled: '#414e62',
    },
  },
}
