import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest'

const STORAGE_KEY = '@map_state'

const setupModule = async () => {
  vi.resetModules()

  const react = await import('react')

  vi.doMock('tamagui', () => ({
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
      JSON.stringify({ version: 1, timestamp: Date.now(), data: persistedState }),
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
        </MapStateProvider>,
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
        expect.stringContaining('"showJobs":true'),
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
      }),
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
      </MapStateProvider>,
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
      }),
    )

    const { MapStateProvider, useMapState } = await setupModule()

    const Consumer = () => {
      const { state } = useMapState()
      return <span data-testid="jobs">{String(state.activeFilters.showJobs)}</span>
    }

    render(
      <MapStateProvider>
        <Consumer />
      </MapStateProvider>,
    )

    await waitFor(() => {
      expect(screen.getByTestId('jobs').textContent).toBe('true')
    })
  })
})
