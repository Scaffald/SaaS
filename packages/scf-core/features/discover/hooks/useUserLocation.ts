/**
 * useUserLocation hook
 *
 * Web: uses `navigator.geolocation` and the Permissions API.
 * Native: uses `expo-location` with prompt-based permission flow.
 *
 * Metro resolves `.web.ts` / `.native.ts` at build time. This file defines
 * only the shared shape — it is never bundled (TypeScript uses it only for
 * `import` resolution).
 */

export interface UserLocation {
  latitude: number
  longitude: number
  accuracy?: number
}

export interface LocationState {
  location: UserLocation | null
  isLoading: boolean
  error: string | null
  permissionStatus: 'granted' | 'denied' | 'prompt' | 'unknown'
}

export interface UseUserLocationReturn extends LocationState {
  requestLocation: () => Promise<UserLocation | null>
  checkPermissionStatus: () => Promise<void>
}

export type UseUserLocation = () => UseUserLocationReturn

export const useUserLocation: UseUserLocation = () => {
  throw new Error(
    '[useUserLocation] platform-specific module was not resolved; check Metro config'
  )
}
