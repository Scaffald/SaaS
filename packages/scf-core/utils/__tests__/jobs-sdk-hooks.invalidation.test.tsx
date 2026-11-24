import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const officeCreateJob = vi.fn()
const officeUpdateJob = vi.fn()
const officeDeleteJob = vi.fn()
const officeDuplicateJob = vi.fn()
vi.mock('../jobs-sdk-context', () => ({
  useScaffaldJobsClient: () => ({
    jobs: { officeCreateJob, officeUpdateJob, officeDeleteJob, officeDuplicateJob },
  }),
}))

import {
  useOfficeCreateJobMutation,
  useOfficeDeleteJobMutation,
  useOfficeDuplicateJobMutation,
  useOfficeUpdateJobMutation,
} from '../jobs-sdk-hooks'

/**
 * #1410: My Listings kept showing the old rows after a create or edit until a
 * reload, because the job mutations invalidated nothing.
 */
function setup() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const invalidate = vi.spyOn(queryClient, 'invalidateQueries')
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
  const keys = () => invalidate.mock.calls.map(([filters]) => filters?.queryKey)
  return { wrapper, keys }
}

describe('job mutations refresh the job lists (#1410)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('create invalidates the lists and the new job, then runs the caller onSuccess', async () => {
    officeCreateJob.mockResolvedValue({ id: 'job-1' })
    const { wrapper, keys } = setup()
    const callerOnSuccess = vi.fn()
    const { result } = renderHook(
      () => useOfficeCreateJobMutation({ onSuccess: callerOnSuccess }),
      { wrapper }
    )
    await act(() =>
      result.current.mutateAsync({ id: 'job-1', organization_id: 'o', title: 'Pipe', description: 'd' })
    )
    expect(officeCreateJob).toHaveBeenCalledWith(expect.objectContaining({ id: 'job-1' }))
    expect(keys()).toEqual(
      expect.arrayContaining([['jobs'], ['office', 'job', 'job-1'], ['job', 'details', 'job-1']])
    )
    expect(callerOnSuccess).toHaveBeenCalledTimes(1)
    expect(callerOnSuccess.mock.calls[0][0]).toEqual({ id: 'job-1' })
  })

  it('update invalidates the lists and that job', async () => {
    officeUpdateJob.mockResolvedValue({ id: 'job-2' })
    const { wrapper, keys } = setup()
    const { result } = renderHook(() => useOfficeUpdateJobMutation(), { wrapper })
    await act(() => result.current.mutateAsync({ id: 'job-2', params: { title: 'New' } }))
    expect(keys()).toEqual(
      expect.arrayContaining([['jobs'], ['office', 'job', 'job-2'], ['job', 'details', 'job-2']])
    )
  })

  it('delete and duplicate invalidate the lists', async () => {
    officeDeleteJob.mockResolvedValue({ success: true })
    officeDuplicateJob.mockResolvedValue({ job: { id: 'copy' } })
    const del = setup()
    const { result: deleted } = renderHook(() => useOfficeDeleteJobMutation(), {
      wrapper: del.wrapper,
    })
    await act(() => deleted.current.mutateAsync('job-3'))
    expect(del.keys()).toEqual(expect.arrayContaining([['jobs'], ['office', 'job', 'job-3']]))

    const dup = setup()
    const onSuccess = vi.fn()
    const { result: duplicated } = renderHook(() => useOfficeDuplicateJobMutation({ onSuccess }), {
      wrapper: dup.wrapper,
    })
    await act(() => duplicated.current.mutateAsync('job-3'))
    expect(dup.keys()).toContainEqual(['jobs'])
    await waitFor(() => expect(onSuccess).toHaveBeenCalledTimes(1))
  })
})
