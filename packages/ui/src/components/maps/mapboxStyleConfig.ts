type ThemeMode = 'light' | 'dark'

export const MAP_STYLE_CONFIG = {
  light: 'mapbox://styles/mapbox/standard',
  dark: 'mapbox://styles/scaffald/cmhzad6vd001b01rs4rbn93p9',
} as const

export const MAPBOX_API_BASE_URL = 'https://api.mapbox.com' as const

export function getMapStyleUrl(theme: ThemeMode) {
  return MAP_STYLE_CONFIG[theme]
}

export function shouldApplyStandardConfig(styleUrl?: string) {
  if (!styleUrl) {
    return false
  }
  return styleUrl.startsWith(MAP_STYLE_CONFIG.light)
}

export function getStandardStyleConfig(theme: ThemeMode) {
  if (theme === 'dark') {
    return undefined
  }
  return {
    basemap: {
      colorScheme: 'faded',
      lightPreset: 'dawn',
    },
  }
}

export function getStandardStyleConfigIfNeeded(theme: ThemeMode, styleUrl?: string) {
  if (!shouldApplyStandardConfig(styleUrl)) {
    return undefined
  }

  return getStandardStyleConfig(theme)
}
