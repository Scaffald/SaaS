type ThemeMode = 'light' | 'dark'

const STANDARD_STYLE_URL = 'mapbox://styles/mapbox/standard'

const getStyleFallback = () => process.env.EXPO_PUBLIC_MAPBOX_STYLE_URL ?? STANDARD_STYLE_URL

export function getMapStyleUrl(theme: ThemeMode) {
  const light = process.env.EXPO_PUBLIC_MAPBOX_STYLE_LIGHT ?? getStyleFallback()
  const dark = process.env.EXPO_PUBLIC_MAPBOX_STYLE_DARK ?? light

  return theme === 'dark' ? dark : light
}

export function shouldApplyStandardConfig(styleUrl?: string) {
  if (!styleUrl) {
    return true
  }
  return styleUrl.startsWith(STANDARD_STYLE_URL)
}

export function getStandardStyleConfig(theme: ThemeMode) {
  return {
    basemap: {
      colorScheme: 'faded',
      lightPreset: theme === 'dark' ? 'dusk' : 'dawn',
    },
  }
}

export function getStandardStyleConfigIfNeeded(theme: ThemeMode, styleUrl?: string) {
  if (!shouldApplyStandardConfig(styleUrl)) {
    return undefined
  }

  return getStandardStyleConfig(theme)
}
