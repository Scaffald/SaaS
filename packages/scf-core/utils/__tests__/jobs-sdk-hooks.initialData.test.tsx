import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const list = vi.fn()
const listExternal = vi.fn()
vi.mock('../jobs-sdk-context', () => ({
  useScaffaldJobsClient: () => ({ jobs: { list, listExternal } }),
}))

import { useExternalJobs, usePublishedJobs } from '../jobs-sdk-hooks'

const page = { data: [{ id: 'j1', title: 'Pipe Welder' }], total: 1, limit: 50, offset: 0 }
const external = [{ id: 'e1', title: 'Scaffold Foreman' }]

const wrapper = () => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  )
}

describe('jobs hooks seeded from a route loader (#774)', () => {
  beforeEach(() => {
    list.mockReset()
    listExternal.mockReset()
  })

  it('renders the loader rows on the first render and does not fetch them again while fresh', async () => {
    const { result } = renderHook(
      () => usePublishedJobs({ search: '' }, { initialData: page as never }),
      { wrapper: wrapper() }
    )
    expect(result.current.isLoading).toBe(false)
    expect(result.current.data).toEqual(page)
    await waitFor(() => expect(result.current.isFetching).toBe(false))
    expect(list).not.toHaveBeenCalled()
  })

  it('seeds the external feed the same way', async () => {
    const { result } = renderHook(
      () => useExternalJobs({ initialData: external as never }),
      { wrapper: wrapper() }
    )
    expect(result.current.isLoading).toBe(false)
    expect(result.current.data).toEqual(external)
    await waitFor(() => expect(result.current.isFetching).toBe(false))
    expect(listExternal).not.toHaveBeenCalled()
  })

  it('still fetches when nothing seeds it', async () => {
    list.mockResolvedValue(page)
    const { result } = renderHook(() => usePublishedJobs({ search: 'weld' }), { wrapper: wrapper() })
    expect(result.current.isLoading).toBe(true)
    await waitFor(() => expect(result.current.data).toEqual(page))
    expect(list).toHaveBeenCalledWith({ status: 'published', search: 'weld' })
  })
})
