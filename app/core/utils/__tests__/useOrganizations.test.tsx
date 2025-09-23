import type { ReactNode } from 'react'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, renderHook, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { Database } from '@app/supabase/types'
import { createSupabaseClientStub } from '@app/test-utils'

import type { OrganizationMembership } from '../useOrganizations'

vi.mock('../supabase/useSupabase', () => ({
  useSupabase: vi.fn(),
}))

vi.mock('../useUser', () => ({
  useUser: vi.fn(),
}))

import { useSupabase } from '../supabase/useSupabase'
import { useUser } from '../useUser'
import { useOrganizations } from '../useOrganizations'

type WrapperProps = {
  children: ReactNode
}

type RenderOptions = {
  memberships?: OrganizationMembership[]
  error?: { code?: string; status?: number; message?: string }
  retryAttempts?: number | false
}

const createMembership = (
  overrides: Partial<OrganizationMembership> = {}
): OrganizationMembership =>
  ({
    organization_id: 'org-1',
    organization_name: 'Alpha Org',
    organization_logo_url: null,
    organization_slug: null,
    organization_type: null,
    organization_tier: null,
    organization_status: null,
    organization_domain: null,
    organization_created_at: '2024-01-01T00:00:00Z',
    organization_updated_at: '2024-01-01T00:00:00Z',
    user_id: 'user-123',
    role: 'member',
    joined_at: '2024-01-01T00:00:00Z',
    ...overrides,
  } as OrganizationMembership)

const createQueryClient = (retry: number | false = false) =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry,
      },
    },
  })

beforeEach(() => {
  vi.clearAllMocks()
})

afterEach(() => {
  cleanup()
})

const renderUseOrganizations = (options: RenderOptions = {}) => {
  const { memberships = [createMembership()], error = null } = options

  const orderMock = vi.fn().mockResolvedValue({
    data: error ? null : memberships,
    error,
  })

  const fromMock = vi.fn((table: string) => {
    if (table !== 'v_organization_memberships') {
      throw new Error(`Unexpected table: ${table}`)
    }

    return {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: orderMock,
    }
  })

  const { client: supabase } = createSupabaseClientStub<Database>({
    from: fromMock,
  })

  vi.mocked(useSupabase).mockReturnValue(supabase)
  vi.mocked(useUser).mockReturnValue({ user: { id: 'user-123' } })

  const queryClient = createQueryClient(options.retryAttempts)

  const wrapper = ({ children }: WrapperProps) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )

  const rendered = renderHook(() => useOrganizations(), { wrapper })

  return {
    rendered,
    queryClient,
    orderMock,
  }
}

describe('useOrganizations', () => {
  it('returns organization memberships for the current user', async () => {
    const memberships = [
      createMembership({ organization_id: 'org-1', organization_name: 'Alpha Org' }),
      createMembership({ organization_id: 'org-2', organization_name: 'Beta Org' }),
    ]

    const { rendered, queryClient } = renderUseOrganizations({ memberships })

    await waitFor(() => expect(rendered.result.current.isSuccess).toBe(true))

    expect(rendered.result.current.data).toEqual(memberships)

    queryClient.clear()
  })

  it('returns an empty array without retrying when Supabase reports a 404', async () => {
    const { rendered, queryClient, orderMock } = renderUseOrganizations({
      error: { code: 'PGRST404', message: 'not found', status: 404 },
      retryAttempts: 2,
    })

    await waitFor(() => expect(rendered.result.current.isSuccess).toBe(true))

    expect(rendered.result.current.data).toEqual([])
    expect(orderMock).toHaveBeenCalledTimes(1)

    queryClient.clear()
  })
})
