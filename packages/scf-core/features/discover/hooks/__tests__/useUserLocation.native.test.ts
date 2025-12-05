import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const requestForegroundPermissionsAsync = vi.fn()
const getCurrentPositionAsync = vi.fn()
const getForegroundPermissionsAsync = vi.fn()

vi.mock('expo-location', () => ({
  requestForegroundPermissionsAsync,
  getCurrentPositionAsync,
  getForegroundPermissionsAsync,
}))

const { useUserLocation } = await import('../useUserLocation.native')

describe('useUserLocation (native)', () => {
  beforeEach(() => {
    requestForegroundPermissionsAsync.mockReset()
    getCurrentPositionAsync.mockReset()
    getForegroundPermissionsAsync.mockReset()
  })

  it('requests permission and resolves with the current location when granted', async () => {
    requestForegroundPermissionsAsync.mockResolvedValue({ status: 'granted' })
    getForegroundPermissionsAsync.mockResolvedValue({ status: 'granted' })
    getCurrentPositionAsync.mockResolvedValue({
      coords: { latitude: 33.75, longitude: -84.39, accuracy: 5 },
    })

    const { result } = renderHook(() => useUserLocation())

    await waitFor(() => expect(result.current.permissionStatus).toBe('granted'))

    await act(async () => {
      const location = await result.current.requestLocation()
      expect(location).toEqual({
        latitude: 33.75,
        longitude: -84.39,
        accuracy: 5,
      })
    })

    expect(result.current.error).toBeNull()
    expect(getCurrentPositionAsync).toHaveBeenCalledWith({
      accuracy: 6,
      timeInterval: 10000,
      distanceInterval: 10,
    })
  })

  it('throws and updates state when permission is denied', async () => {
    requestForegroundPermissionsAsync.mockResolvedValue({ status: 'denied' })
    getForegroundPermissionsAsync.mockResolvedValue({ status: 'denied' })

    const { result } = renderHook(() => useUserLocation())

    await waitFor(() => expect(result.current.permissionStatus).toBe('denied'))

    let thrown: unknown
    await act(async () => {
      try {
        await result.current.requestLocation()
      } catch (error) {
        thrown = error
      }
    })

    expect(thrown).toBeInstanceOf(Error)
    expect((thrown as Error).message).toBe('Location permission denied')
    expect(result.current.error).toBe('Location permission denied')
    expect(result.current.isLoading).toBe(false)
  })

  it('marks permission status as unknown when checking permissions fails', async () => {
    getForegroundPermissionsAsync.mockRejectedValue(new Error('unavailable'))
    requestForegroundPermissionsAsync.mockResolvedValue({ status: 'granted' })
    getCurrentPositionAsync.mockResolvedValue({
      coords: { latitude: 0, longitude: 0 },
    })

    const { result } = renderHook(() => useUserLocation())

    await waitFor(() => expect(result.current.permissionStatus).toBe('unknown'))
  })
})


