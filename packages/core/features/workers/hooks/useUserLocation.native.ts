import { useState, useEffect, useCallback } from 'react'
import {
  requestForegroundPermissionsAsync,
  getCurrentPositionAsync,
  getForegroundPermissionsAsync,
} from 'expo-location'

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
    setState((prev) => ({ ...prev, isLoading: true, error: null }))

    try {
      // Request permission first
      const { status } = await requestForegroundPermissionsAsync()

      if (status !== 'granted') {
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: 'Location permission denied',
          permissionStatus: 'denied',
        }))
        throw new Error('Location permission denied')
      }

      const position = await getCurrentPositionAsync({
        accuracy: 6, // High accuracy
        timeInterval: 10000,
        distanceInterval: 10,
      })

      const location: UserLocation = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy || undefined,
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

      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
        permissionStatus: errorMessage.includes('permission') ? 'denied' : 'unknown',
      }))

      throw error
    }
  }, [])

  const checkPermissionStatus = useCallback(async () => {
    try {
      const { status } = await getForegroundPermissionsAsync()

      setState((prev) => ({
        ...prev,
        permissionStatus: status === 'granted' ? 'granted' : 'denied',
      }))
    } catch (_error) {
      setState((prev) => ({ ...prev, permissionStatus: 'unknown' }))
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
