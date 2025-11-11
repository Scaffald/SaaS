import { describe, expect, it, vi } from 'vitest'

const useQueryMock = vi.fn()

vi.mock('../api', () => ({
  api: {
    office: {
      getOrganizations: {
        useQuery: useQueryMock,
      },
    },
  },
}))

describe('useAllOrganizations', () => {
  it('delegates to the office getOrganizations query', async () => {
    const expected = { data: [], isPending: false }
    useQueryMock.mockReturnValue(expected)
    const { useAllOrganizations } = await import('../useAllOrganizations')

    const result = useAllOrganizations()

    expect(result).toBe(expected)
    expect(useQueryMock).toHaveBeenCalledTimes(1)
    expect(useQueryMock).toHaveBeenCalledWith()
  })
})


