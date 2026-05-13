/**
 * App Tracking Transparency (ATT) authorization manager.
 *
 * Apple requires the ATT prompt before any "tracking" as defined by
 * App Store Review Guideline 5.1.2(i). For Scaffald this gates whether we
 * link analytics events to a stable user identifier (PostHog identify, Sentry
 * setUser with PII).
 *
 * Web/Android consumers can import safely — the cross-platform default lives
 * in this file and returns `unavailable`. The native iOS implementation lives
 * in `./tracking-authorization.native.ts` and Metro picks the right one.
 */

import type { TrackingAuthorizationStatus } from './types'

let cachedStatus: TrackingAuthorizationStatus = 'unavailable'

export function getTrackingAuthorizationStatus(): TrackingAuthorizationStatus {
  return cachedStatus
}

export async function refreshTrackingAuthorizationStatus(): Promise<TrackingAuthorizationStatus> {
  return cachedStatus
}

export async function requestTrackingAuthorization(): Promise<TrackingAuthorizationStatus> {
  return cachedStatus
}

export const __testing = {
  setCachedStatus: (status: TrackingAuthorizationStatus) => {
    cachedStatus = status
  },
}
