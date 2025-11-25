import { act, renderHook, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useUserLocation } from '../useUserLocation'

const originalNavigator = globalThis.navigator

type GeolocationArgs = Parameters<Geolocation['getCurrentPosition']>
type GeolocationReturn = ReturnType<Geolocation['getCurrentPosition']>
type PositionSuccessCallback = (position: GeolocationPosition) => void
type PositionErrorCallback = (error: GeolocationPositionError) => void

const getCurrentPositionMock = vi.fn()
const watchPositionMock = vi.fn(() => 1)
const clearWatchMock = vi.fn()

describe('useUserLocation (web)', () => {
  const geolocationMock: Geolocation = {
    getCurrentPosition: getCurrentPositionMock as unknown as Geolocation['getCurrentPosition'],
    watchPosition: watchPositionMock as unknown as Geolocation['watchPosition'],
    clearWatch: clearWatchMock as unknown as Geolocation['clearWatch'],
  }

  beforeEach(() => {
    Object.defineProperty(globalThis, 'navigator', {
      configurable: true,
      value: {
        geolocation: geolocationMock,
      },
    })
    getCurrentPositionMock.mockReset()
    watchPositionMock.mockReset()
    clearWatchMock.mockReset()
  })

  afterEach(() => {
    Object.defineProperty(globalThis, 'navigator', {
      configurable: true,
      value: originalNavigator,
    })
  })

  it('requests the current position and updates state on success', async () => {
    const samplePosition = {
      coords: {
        latitude: 35.23,
        longitude: -80.84,
        accuracy: 12,
      },
    } as unknown as GeolocationPosition

    const invokeSuccess =
      (position: GeolocationPosition) =>
        (
          successCallback: PositionSuccessCallback,
          _errorCallback?: PositionErrorCallback | null,
          _options?: PositionOptions,
        ) => {
          successCallback(position)
        }

    getCurrentPositionMock
      .mockImplementationOnce(invokeSuccess(samplePosition)) // permission check
      .mockImplementationOnce(invokeSuccess(samplePosition)) // requestLocation

    const { result } = renderHook(() => useUserLocation())

    await waitFor(() => expect(result.current.permissionStatus).toBe('granted'))

    await act(async () => {
      const location = await result.current.requestLocation()
      expect(location).toEqual({
        latitude: 35.23,
        longitude: -80.84,
        accuracy: 12,
      })
    })

    expect(result.current.isLoading).toBe(false)
    expect(result.current.error).toBeNull()
    expect(result.current.permissionStatus).toBe('granted')
  })

  it('surfaces errors when geolocation is unavailable', async () => {
    Object.defineProperty(globalThis, 'navigator', {
      configurable: true,
      value: {},
    })

    const { result } = renderHook(() => useUserLocation())

    let thrown: unknown
    await act(async () => {
      try {
        await result.current.requestLocation()
      } catch (error) {
        thrown = error
      }
    })

    expect(thrown).toBeInstanceOf(Error)
    expect((thrown as Error).message).toBe('Geolocation is not supported by this browser')
    expect(result.current.error).toBe('Geolocation is not supported by this browser')
    expect(result.current.permissionStatus).toBe('denied')
  })

  it('sets permission status to denied when the permission check fails', async () => {
    const invokeError =
      (message: string) =>
        (
          _successCallback: PositionSuccessCallback,
          errorCallback?: PositionErrorCallback | null,
          _options?: PositionOptions,
        ) => {
          const positionError = {
            code: 1,
            message,
            PERMISSION_DENIED: 1,
            POSITION_UNAVAILABLE: 2,
            TIMEOUT: 3,
          } as GeolocationPositionError
          errorCallback?.(positionError)
        }

    getCurrentPositionMock
      .mockImplementationOnce(invokeError('permission denied'))
      .mockImplementation(invokeError('permission denied'))

    const { result } = renderHook(() => useUserLocation())

    await waitFor(() => expect(result.current.permissionStatus).toBe('denied'))

    await act(async () => {
      await expect(result.current.checkPermissionStatus()).resolves.toBeUndefined()
    })

    expect(result.current.permissionStatus).toBe('denied')
    expect(result.current.error).toBeNull()
  })
})


