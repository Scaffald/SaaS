import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import type { ReactNode } from 'react'

const mockUseQuery = vi.fn()
const mockUseMutation = vi.fn()
const mockShow = vi.fn()
const mockPush = vi.fn()

vi.mock('@app/core/utils/api', () => ({
  api: {
    teams: {
      members: {
        list: { useQuery: mockUseQuery },
        remove: { useMutation: mockUseMutation },
        selfRemove: { useMutation: mockUseMutation },
      },
      analytics: {
        workload: { useQuery: mockUseQuery },
      },
    },
  },
}))

vi.mock('@tamagui/toast', () => ({
  useToastController: () => ({ show: mockShow }),
}))

vi.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush }),
}))

vi.mock('@app/core/utils/useUser', () => ({
  useUser: () => ({ user: { id: 'current-user-id' } }),
}))

vi.mock('tamagui', async () => {
  const actual = await vi.importActual<typeof import('tamagui')>('tamagui')
  return {
    ...actual,
    useMedia: () => ({ sm: false }),
  }
})

vi.mock('@tamagui/lucide-icons', () => ({
  Crown: () => <span data-testid="crown-icon">Crown</span>,
  LogOut: () => <span data-testid="log-out-icon">LogOut</span>,
  Plus: () => <span data-testid="plus-icon">Plus</span>,
  UserMinus: () => <span data-testid="user-minus-icon">UserMinus</span>,
}))

const { TeamMembersList } = await import('../TeamMembersList')

describe('TeamMembersList', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseQuery.mockReturnValue({
      data: {
        members: [
          {
            id: 'member-1',
            userId: 'user-1',
            status: 'active',
            role: { id: 'role-1', key: 'member', name: 'Member' },
            user: { id: 'user-1', displayName: 'Test User', username: 'testuser' },
          },
        ],
      },
      isLoading: false,
    })
  })

  it('renders member list with roles', () => {
    render(<TeamMembersList teamId="team-1" organizationId="org-1" />)

    expect(screen.getByText('Test User')).toBeInTheDocument()
  })

  it('displays member roles correctly', () => {
    render(<TeamMembersList teamId="team-1" organizationId="org-1" />)

    expect(screen.getByText(/Member/i)).toBeInTheDocument()
  })

  it('shows loading state', () => {
    mockUseQuery.mockReturnValue({
      data: undefined,
      isLoading: true,
    })

    render(<TeamMembersList teamId="team-1" organizationId="org-1" />)

    expect(screen.getByText(/Loading/i)).toBeInTheDocument()
  })
})

