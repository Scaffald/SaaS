import { describe, expect, it, vi } from 'vitest'

const employerListMock = vi.hoisted(() => ({ useQuery: vi.fn() }))

vi.mock('@scf/core/utils/applications-sdk-hooks', () => ({
  useEmployerApplications: employerListMock.useQuery,
  useApplication: vi.fn(),
  useUpdateApplicationMutation: vi.fn(),
  useWithdrawApplicationMutation: vi.fn(),
  useGetUploadUrlMutation: vi.fn(),
  useConfirmUploadMutation: vi.fn(),
}))

vi.mock('@tanstack/react-query', () => ({
  useQueryClient: () => ({ invalidateQueries: vi.fn() }),
}))

const { useApplications } = await import('../useApplications')

/**
 * `useApplications` returned a hardcoded `[]` with its filter argument
 * discarded, which is why every office ATS screen rendered zero rows (#528).
 *
 * The empty-array case is the regression: it must come from the query, not
 * from the hook itself, so that a real response reaches the board.
 */
describe('useApplications', () => {
  it('returns rows from the employer query rather than a constant', () => {
    employerListMock.useQuery.mockReturnValue({
      data: {
        data: [{ id: 'app_1' }, { id: 'app_2' }],
        total: 2,
      },
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    })

    const result = useApplications()

    expect(result.applications).toHaveLength(2)
    expect(result.total).toBe(2)
  })

  it('passes its filters through instead of discarding them', () => {
    employerListMock.useQuery.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      error: null,
      refetch: vi.fn(),
    })

    const filters = {
      status: 'interview' as const,
      job_id: 'job_1',
      min_score: 40,
      organization_id: 'org_1',
    }

    useApplications(filters)

    expect(employerListMock.useQuery).toHaveBeenCalledWith(filters)
  })

  it('surfaces loading and error state from the query', () => {
    const boom = new Error('nope')
    employerListMock.useQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      error: boom,
      refetch: vi.fn(),
    })

    const result = useApplications()

    expect(result.isError).toBe(true)
    expect(result.error).toBe(boom)
    // An error must not look like "no applications" — the board renders an
    // error state off this, and a silent empty list is what the stub did.
    expect(result.applications).toEqual([])
  })
})
