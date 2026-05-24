import { describe, expect, it, vi } from 'vitest'

// Mock the SDK hook the wrapper delegates to. useAllOrganizations
// used to wrap a tRPC client query; it now wraps the SDK hook
// useOfficeOrganizations. The test just verifies the delegation.
const useOfficeOrganizationsMock = vi.fn()

vi.mock('../office-organizations-sdk-hooks', () => ({
  useOfficeOrganizations: useOfficeOrganizationsMock,
}))

describe('useAllOrganizations', () => {
  it('delegates to useOfficeOrganizations', async () => {
    const expected = { data: [], isPending: false }
    useOfficeOrganizationsMock.mockReturnValue(expected)
    const { useAllOrganizations } = await import('../useAllOrganizations')

    const result = useAllOrganizations()

    expect(result).toBe(expected)
    expect(useOfficeOrganizationsMock).toHaveBeenCalledTimes(1)
    expect(useOfficeOrganizationsMock).toHaveBeenCalledWith()
  })
})
