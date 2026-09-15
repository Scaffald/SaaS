type ThemeMode = 'light' | 'dark'

// Web (mapbox-gl JS v3) renders Mapbox Standard and the Standard-derived
// Scaffald dark style. The native SDK the app ships — MapboxMaps 10.19.5 via
// @rnmapbox/maps 10.1.x — cannot: Standard and every style that `imports` it
// need Maps SDK v11. On v10 the style request answers 200 and the map then
// paints nothing, so iOS showed a black map with markers floating on it on
// every device, in every release since fe152b16f (#373). Native gets the
// classic styles until rnmapbox is moved to the v11 SDK.
export const MAP_STYLE_CONFIG = {
  light: 'mapbox://styles/mapbox/standard',
  dark: 'mapbox://styles/scaffald/cmhzad6vd001b01rs4rbn93p9',
} as const

export const NATIVE_MAP_STYLE_CONFIG = {
  light: 'mapbox://styles/mapbox/streets-v12',
  dark: 'mapbox://styles/mapbox/dark-v11',
} as const

export function getMapStyleUrl(theme: ThemeMode) {
  return MAP_STYLE_CONFIG[theme]
}

/** The style the native SDK can actually draw. See MAP_STYLE_CONFIG. */
export function getNativeMapStyleUrl(theme: ThemeMode) {
  return NATIVE_MAP_STYLE_CONFIG[theme]
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
