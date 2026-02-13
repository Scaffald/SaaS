import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'

const STORAGE_KEY = '@map_state'

const setupModule = async () => {
  vi.resetModules()

  const react = await import('react')

  vi.doMock('@scaffald/ui', () => ({
    useIsomorphicLayoutEffect: react.useLayoutEffect,
  }))

  vi.doMock('react-native', () => ({
    Platform: { OS: 'web' },
  }))

  const asyncStorageMock = {
    getItem: vi.fn().mockResolvedValue(null),
    setItem: vi.fn().mockResolvedValue(undefined),
    removeItem: vi.fn().mockResolvedValue(undefined),
  }
  vi.doMock('@react-native-async-storage/async-storage', () => asyncStorageMock)

  const module = await import('../MapStateProvider')
  return { ...module, asyncStorageMock }
}

describe('MapStateProvider', () => {
  afterEach(() => {
    vi.clearAllMocks()
    vi.resetModules()
    localStorage.clear()
  })

  it('restores persisted state and persists updates to storage', async () => {
    const user = userEvent.setup()
    const persistedState = {
      lastSearchLocation: {
        coordinates: [-80, 35],
        label: 'Charlotte, NC',
        zoomLevel: 10,
        timestamp: Date.now(),
      },
      activeFilters: {
        showWorkers: false,
        showOrganizations: true,
        showJobs: false,
      },
      resultsRailVisible: false,
      viewport: null,
    }

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ version: 1, timestamp: Date.now(), data: persistedState })
    )

    const { MapStateProvider, useMapState } = await setupModule()

    const Consumer = () => {
      const { state, updateFilters, updateResultsRailVisible } = useMapState()
      return (
        <div>
          <span data-testid="show-jobs">{String(state.activeFilters.showJobs)}</span>
          <span data-testid="rail-visible">{String(state.resultsRailVisible)}</span>
          <button type="button" onClick={() => updateFilters({ showJobs: true })}>
            enable-jobs
          </button>
          <button type="button" onClick={() => updateResultsRailVisible(true)}>
            show-rail
          </button>
        </div>
      )
    }

    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem')

    try {
      render(
        <MapStateProvider>
          <Consumer />
        </MapStateProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('show-jobs').textContent).toBe('false')
        expect(screen.getByTestId('rail-visible').textContent).toBe('false')
      })

      await user.click(screen.getByText('enable-jobs'))
      await user.click(screen.getByText('show-rail'))

      expect(screen.getByTestId('show-jobs').textContent).toBe('true')
      expect(screen.getByTestId('rail-visible').textContent).toBe('true')

      expect(setItemSpy).toHaveBeenCalledWith(
        STORAGE_KEY,
        expect.stringContaining('"showJobs":true')
      )
    } finally {
      setItemSpy.mockRestore()
    }
  })

  it('clears state and removes persisted storage', async () => {
    const user = userEvent.setup()
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        version: 1,
        timestamp: Date.now(),
        data: {
          lastSearchLocation: null,
          activeFilters: {
            showWorkers: false,
            showOrganizations: false,
            showJobs: false,
          },
          resultsRailVisible: false,
          viewport: null,
        },
      })
    )

    const { MapStateProvider, useMapState } = await setupModule()

    const Consumer = () => {
      const { state, clearState } = useMapState()
      return (
        <div>
          <span data-testid="workers">{String(state.activeFilters.showWorkers)}</span>
          <button type="button" onClick={clearState}>
            clear
          </button>
        </div>
      )
    }

    render(
      <MapStateProvider>
        <Consumer />
      </MapStateProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('workers').textContent).toBe('false')
    })

    await user.click(screen.getByText('clear'))

    expect(screen.getByTestId('workers').textContent).toBe('true')

    const persisted = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}')
    expect(persisted.data?.activeFilters?.showWorkers).toBe(true)
  })

  it('ignores expired persisted state', async () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        version: 1,
        timestamp: Date.now() - 48 * 60 * 60 * 1000,
        data: {
          lastSearchLocation: null,
          activeFilters: {
            showWorkers: false,
            showOrganizations: false,
            showJobs: false,
          },
          resultsRailVisible: false,
          viewport: null,
        },
      })
    )

    const { MapStateProvider, useMapState } = await setupModule()

    const Consumer = () => {
      const { state } = useMapState()
      return <span data-testid="jobs">{String(state.activeFilters.showJobs)}</span>
    }

    render(
      <MapStateProvider>
        <Consumer />
      </MapStateProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('jobs').textContent).toBe('true')
    })
  })

  it('updates search location', async () => {
    const user = userEvent.setup()
    const { MapStateProvider, useMapState } = await setupModule()

    const Consumer = () => {
      const { state, updateSearchLocation } = useMapState()
      return (
        <div>
          <span data-testid="location-label">{state.lastSearchLocation?.label || 'null'}</span>
          <button
            type="button"
            onClick={() =>
              updateSearchLocation({
                coordinates: [-71.0589, 42.3601],
                label: 'Boston, MA',
                zoomLevel: 12,
                timestamp: Date.now(),
              })
            }
          >
            set-boston
          </button>
        </div>
      )
    }

    render(
      <MapStateProvider>
        <Consumer />
      </MapStateProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('location-label').textContent).toBe('null')
    })

    await user.click(screen.getByText('set-boston'))

    await waitFor(() => {
      expect(screen.getByTestId('location-label').textContent).toBe('Boston, MA')
    })

    // Verify persistence
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}')
    expect(stored.data?.lastSearchLocation?.label).toBe('Boston, MA')
  })

  it('updates viewport', async () => {
    const user = userEvent.setup()
    const { MapStateProvider, useMapState } = await setupModule()

    const Consumer = () => {
      const { state, updateViewport } = useMapState()
      return (
        <div>
          <span data-testid="viewport-zoom">{state.viewport?.zoom?.toString() || 'null'}</span>
          <button
            type="button"
            onClick={() =>
              updateViewport({
                center: [-71.0589, 42.3601],
                zoom: 12,
                bounds: {
                  north: 42.3736,
                  south: 42.3389,
                  east: -71.0328,
                  west: -71.0958,
                },
              })
            }
          >
            set-viewport
          </button>
        </div>
      )
    }

    render(
      <MapStateProvider>
        <Consumer />
      </MapStateProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('viewport-zoom').textContent).toBe('null')
    })

    await user.click(screen.getByText('set-viewport'))

    await waitFor(() => {
      expect(screen.getByTestId('viewport-zoom').textContent).toBe('12')
    })

    // Verify persistence
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}')
    expect(stored.data?.viewport?.zoom).toBe(12)
  })

  it('handles invalid JSON in storage', async () => {
    localStorage.setItem(STORAGE_KEY, 'invalid json')

    const { MapStateProvider, useMapState } = await setupModule()

    const Consumer = () => {
      const { state } = useMapState()
      return <span data-testid="workers">{String(state.activeFilters.showWorkers)}</span>
    }

    render(
      <MapStateProvider>
        <Consumer />
      </MapStateProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('workers').textContent).toBe('true')
    })
  })

  it('handles missing version in stored state', async () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        timestamp: Date.now(),
        data: {
          lastSearchLocation: null,
          activeFilters: {
            showWorkers: false,
            showOrganizations: false,
            showJobs: false,
          },
          resultsRailVisible: false,
          viewport: null,
        },
      })
    )

    const { MapStateProvider, useMapState } = await setupModule()

    const Consumer = () => {
      const { state } = useMapState()
      return <span data-testid="workers">{String(state.activeFilters.showWorkers)}</span>
    }

    render(
      <MapStateProvider>
        <Consumer />
      </MapStateProvider>
    )

    // The code doesn't validate version, so it will use the stored state
    await waitFor(() => {
      expect(screen.getByTestId('workers').textContent).toBe('false')
    })
  })

  it('handles storage errors gracefully', async () => {
    const user = userEvent.setup()
    const { MapStateProvider, useMapState } = await setupModule()

    // Mock localStorage.setItem to throw
    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('Storage quota exceeded')
    })

    const Consumer = () => {
      const { state, updateFilters } = useMapState()
      return (
        <div>
          <span data-testid="jobs">{String(state.activeFilters.showJobs)}</span>
          <button type="button" onClick={() => updateFilters({ showJobs: false })}>
            disable-jobs
          </button>
        </div>
      )
    }

    try {
      render(
        <MapStateProvider>
          <Consumer />
        </MapStateProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('jobs').textContent).toBe('true')
      })

      // Should still update state even if storage fails
      await user.click(screen.getByText('disable-jobs'))

      await waitFor(() => {
        expect(screen.getByTestId('jobs').textContent).toBe('false')
      })
    } finally {
      setItemSpy.mockRestore()
    }
  })

  it('handles state exactly at expiry boundary', async () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        version: 1,
        timestamp: Date.now() - 24 * 60 * 60 * 1000, // Exactly 24 hours ago
        data: {
          lastSearchLocation: {
            coordinates: [-80, 35],
            label: 'Charlotte, NC',
            zoomLevel: 10,
            timestamp: Date.now(),
          },
          activeFilters: {
            showWorkers: false,
            showOrganizations: false,
            showJobs: false,
          },
          resultsRailVisible: false,
          viewport: null,
        },
      })
    )

    const { MapStateProvider, useMapState } = await setupModule()

    const Consumer = () => {
      const { state } = useMapState()
      return (
        <div>
          <span data-testid="location">{state.lastSearchLocation?.label || 'null'}</span>
        </div>
      )
    }

    render(
      <MapStateProvider>
        <Consumer />
      </MapStateProvider>
    )

    // Should ignore state at exactly 24 hours (expired)
    await waitFor(() => {
      expect(screen.getByTestId('location').textContent).toBe('null')
    })
  })

  it('handles partial filter updates', async () => {
    const user = userEvent.setup()
    const { MapStateProvider, useMapState } = await setupModule()

    const Consumer = () => {
      const { state, updateFilters } = useMapState()
      return (
        <div>
          <span data-testid="workers">{String(state.activeFilters.showWorkers)}</span>
          <span data-testid="organizations">{String(state.activeFilters.showOrganizations)}</span>
          <span data-testid="jobs">{String(state.activeFilters.showJobs)}</span>
          <button type="button" onClick={() => updateFilters({ showWorkers: false })}>
            toggle-workers
          </button>
        </div>
      )
    }

    render(
      <MapStateProvider>
        <Consumer />
      </MapStateProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('workers').textContent).toBe('true')
      expect(screen.getByTestId('organizations').textContent).toBe('true')
      expect(screen.getByTestId('jobs').textContent).toBe('true')
    })

    await user.click(screen.getByText('toggle-workers'))

    await waitFor(() => {
      expect(screen.getByTestId('workers').textContent).toBe('false')
      expect(screen.getByTestId('organizations').textContent).toBe('true')
      expect(screen.getByTestId('jobs').textContent).toBe('true')
    })
  })

  it('clears viewport when set to null', async () => {
    const user = userEvent.setup()
    const { MapStateProvider, useMapState } = await setupModule()

    const Consumer = () => {
      const { state, updateViewport } = useMapState()
      return (
        <div>
          <span data-testid="viewport">{state.viewport ? 'set' : 'null'}</span>
          <button type="button" onClick={() => updateViewport(null)}>
            clear-viewport
          </button>
          <button
            type="button"
            onClick={() =>
              updateViewport({
                center: [-71.0589, 42.3601],
                zoom: 12,
              })
            }
          >
            set-viewport
          </button>
        </div>
      )
    }

    render(
      <MapStateProvider>
        <Consumer />
      </MapStateProvider>
    )

    // Wait for component to be ready
    await waitFor(() => {
      expect(screen.getByTestId('viewport')).toBeInTheDocument()
    })

    // Set viewport first
    await user.click(screen.getByText('set-viewport'))
    await waitFor(() => {
      expect(screen.getByTestId('viewport').textContent).toBe('set')
    })

    // Clear viewport
    await user.click(screen.getByText('clear-viewport'))
    await waitFor(() => {
      expect(screen.getByTestId('viewport').textContent).toBe('null')
    })
  })
})
