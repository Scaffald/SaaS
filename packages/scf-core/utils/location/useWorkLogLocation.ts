import { useCallback, useState } from 'react'

import type { LocationPermissionStatus, WorkLogLocation, WorkLogLocationState } from '@scf/schemas'

interface WorkLogLocationHook extends WorkLogLocationState {
  requestLocation: () => Promise<WorkLogLocation | null>
  checkPermissionStatus: () => Promise<LocationPermissionStatus>
}

const createWorkLogLocation = (
  latitude: number,
  longitude: number,
  accuracy: number | null,
  permissionStatus: LocationPermissionStatus
): WorkLogLocation => ({
  latitude,
  longitude,
  accuracyMeters: accuracy,
  capturedAt: new Date().toISOString(),
  deviceType: 'web',
  permissionStatus,
})

export const useWorkLogLocation = (): WorkLogLocationHook => {
  const [state, setState] = useState<WorkLogLocationState>({
    location: null,
    permissionStatus: null,
    isLoading: false,
    error: null,
  })

  const checkPermissionStatus = useCallback(async (): Promise<LocationPermissionStatus> => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setState((prev) => ({ ...prev, permissionStatus: 'denied' }))
      return 'denied'
    }
    try {
      await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 1 })
      })
      setState((prev) => ({ ...prev, permissionStatus: 'granted' }))
      return 'granted'
    } catch {
      setState((prev) => ({ ...prev, permissionStatus: 'denied' }))
      return 'denied'
    }
  }, [])

  const requestLocation = useCallback(async (): Promise<WorkLogLocation | null> => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }))

    try {
      if (typeof navigator === 'undefined' || !navigator.geolocation) {
        throw new Error('Geolocation is not supported by this browser')
      }

      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000,
        })
      })

      const accuracy =
        typeof position.coords.accuracy === 'number' && Number.isFinite(position.coords.accuracy)
          ? position.coords.accuracy
          : null

      const location = createWorkLogLocation(
        position.coords.latitude,
        position.coords.longitude,
        accuracy,
        'granted'
      )

      setState({
        location,
        permissionStatus: 'granted',
        isLoading: false,
        error: null,
      })

      return location
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to capture location.'
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: message,
        permissionStatus: message.toLowerCase().includes('permission') ? 'denied' : null,
      }))
      return null
    }
  }, [])

  return {
    ...state,
    requestLocation,
    checkPermissionStatus,
  }
}
