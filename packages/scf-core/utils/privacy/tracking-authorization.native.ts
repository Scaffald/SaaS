/**
 * Native (iOS/Android) ATT implementation.
 *
 * Android: the underlying expo module reports `unavailable`, which is the
 * correct answer — Google Play has its own ad-id consent system but it isn't
 * App Tracking Transparency.
 *
 * iOS: wraps `expo-tracking-transparency` and persists the resolved status to
 * AsyncStorage so we can render the Privacy & Data screen synchronously on
 * subsequent launches without re-prompting. The actual permission state is
 * always re-fetched from the OS in `refresh…` since the user can change it
 * from iOS Settings at any time.
 */

import AsyncStorage from '@react-native-async-storage/async-storage'
import * as TrackingTransparency from 'expo-tracking-transparency'
import { Platform } from 'react-native'

import type { TrackingAuthorizationStatus } from './types'

const STORAGE_KEY = 'scf:tracking-authorization'

let cachedStatus: TrackingAuthorizationStatus = 'not-determined'
let hasHydrated = false

const isApplicable = () => Platform.OS === 'ios'

function normalize(
  raw: TrackingTransparency.PermissionStatus | string | undefined | null
): TrackingAuthorizationStatus {
  if (!isApplicable()) return 'unavailable'
  switch (raw) {
    case 'granted':
      return 'granted'
    case 'denied':
      return 'denied'
    case 'restricted':
      return 'restricted'
    case 'undetermined':
    case 'not-determined':
      return 'not-determined'
    default:
      return 'not-determined'
  }
}

async function persist(status: TrackingAuthorizationStatus) {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, status)
  } catch (error) {
    console.warn('[privacy] failed to persist tracking authorization', error)
  }
}

async function hydrateFromStorage() {
  if (hasHydrated) return
  hasHydrated = true
  if (!isApplicable()) {
    cachedStatus = 'unavailable'
    return
  }
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY)
    if (stored) cachedStatus = normalize(stored)
  } catch (error) {
    console.warn('[privacy] failed to hydrate tracking authorization', error)
  }
}

export function getTrackingAuthorizationStatus(): TrackingAuthorizationStatus {
  return cachedStatus
}

/**
 * Re-read the OS-level permission and update the cache. Safe to call on
 * every app foreground — the user can flip the toggle in iOS Settings while
 * the app is backgrounded and we want to honor it on the next event.
 */
export async function refreshTrackingAuthorizationStatus(): Promise<TrackingAuthorizationStatus> {
  await hydrateFromStorage()
  if (!isApplicable()) {
    cachedStatus = 'unavailable'
    return cachedStatus
  }
  try {
    const { status } = await TrackingTransparency.getTrackingPermissionsAsync()
    const normalized = normalize(status)
    if (normalized !== cachedStatus) {
      cachedStatus = normalized
      await persist(normalized)
    }
    return cachedStatus
  } catch (error) {
    console.warn('[privacy] getTrackingPermissionsAsync failed', error)
    return cachedStatus
  }
}

/**
 * Show the system ATT prompt if the user hasn't been asked yet. Returns the
 * resolved status. Idempotent — calling again after a decision just re-reads
 * the cached/OS value.
 */
export async function requestTrackingAuthorization(): Promise<TrackingAuthorizationStatus> {
  await hydrateFromStorage()
  if (!isApplicable()) {
    cachedStatus = 'unavailable'
    return cachedStatus
  }
  try {
    const current = await TrackingTransparency.getTrackingPermissionsAsync()
    if (current.status !== 'undetermined') {
      const normalized = normalize(current.status)
      cachedStatus = normalized
      await persist(normalized)
      return normalized
    }
    const result = await TrackingTransparency.requestTrackingPermissionsAsync()
    const normalized = normalize(result.status)
    cachedStatus = normalized
    await persist(normalized)
    return normalized
  } catch (error) {
    console.warn('[privacy] requestTrackingPermissionsAsync failed', error)
    return cachedStatus
  }
}

export const __testing = {
  setCachedStatus: (status: TrackingAuthorizationStatus) => {
    cachedStatus = status
    hasHydrated = true
  },
}
