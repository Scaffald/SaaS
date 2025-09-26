import { useState, useEffect, useCallback } from 'react'

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

export const useUserLocation = () => {
  const [state, setState] = useState<LocationState>({
    location: null,
    isLoading: false,
    error: null,
    permissionStatus: 'unknown',
  })

  const requestLocation = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }))
    try {
      if (!navigator.geolocation) {
        throw new Error('Geolocation is not supported by this browser')
      }

      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          resolve,
          reject,
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 300000, // 5 minutes
          }
        )
      })

      const location: UserLocation = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
      }

      setState({
        location,
        isLoading: false,
        error: null,
        permissionStatus: 'granted',
      })

      return location
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to get location'
      
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
        permissionStatus: errorMessage.includes('permission') ? 'denied' : 'unknown',
      }))

      throw error
    }
  }, [])

  const checkPermissionStatus = useCallback(async () => {
    // Web doesn't have a direct way to check permission status
    // We'll try to get the position with a very short timeout to check
    try {
      await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          resolve,
          reject,
          { timeout: 1 }
        )
      })
      setState(prev => ({ ...prev, permissionStatus: 'granted' }))
    } catch (_error) {
      setState(prev => ({ ...prev, permissionStatus: 'denied' }))
    }
  }, [])

  // Check permission status on mount
  useEffect(() => {
    checkPermissionStatus()
  }, [checkPermissionStatus])

  return {
    ...state,
    requestLocation,
    checkPermissionStatus,
  }
}