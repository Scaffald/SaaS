// Mapbox configuration utilities

/**
 * Gets the Mapbox access token from environment variables
 * Works for both web (Next.js) and mobile (Expo) environments
 */
export function getMapboxAccessToken(): string {
  // For web (Next.js)
  if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN) {
    return process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN
  }

  // For mobile (Expo) - using Constants from expo-constants
  if (typeof process !== 'undefined' && process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN) {
    return process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN
  }

  // Fallback for server-side rendering or other environments
  if (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN) {
    return process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN
  }

  throw new Error(
    'Mapbox access token not found. Please set NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN or EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN in your environment variables.'
  )
}

/**
 * Checks if Mapbox is properly configured
 */
export function isMapboxConfigured(): boolean {
  try {
    getMapboxAccessToken()
    return true
  } catch {
    return false
  }
}

/**
 * Default Mapbox configuration using environment variables
 */
export const defaultMapboxConfig = {
  get accessToken() {
    return getMapboxAccessToken()
  },
  get isConfigured() {
    return isMapboxConfigured()
  },
}
