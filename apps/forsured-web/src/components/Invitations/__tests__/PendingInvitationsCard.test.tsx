/**
 * PendingInvitationsCard Component Tests
 * Flexible Invitation System - Task 8
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@/test/test-utils'

// Mock tRPC
const mockGetPending = vi.fn()
const mockAccept = vi.fn()
const mockDecline = vi.fn()
const mockRefetch = vi.fn()

vi.mock('../../../lib/trpc', () => ({
  trpc: {
    genericInvitations: {
      getPending: {
        useQuery: () => mockGetPending(),
      },
      accept: {
        useMutation: (options: { onSuccess?: () => void; onSettled?: () => void }) => ({
          mutate: (data: { invitationId: string }) => {
            mockAccept(data)
            options.onSuccess?.()
            options.onSettled?.()
          },
          isPending: false,
        }),
      },
      decline: {
        useMutation: (options: { onSuccess?: () => void; onSettled?: () => void }) => ({
          mutate: (data: { invitationId: string; reason?: string }) => {
            mockDecline(data)
            options.onSuccess?.()
            options.onSettled?.()
          },
          isPending: false,
        }),
      },
    },
  },
}))

// Mock navigate
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

import { PendingInvitationsCard } from '../PendingInvitationsCard'

describe('PendingInvitationsCard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockRefetch.mockClear()
  })

  describe('Empty State', () => {
    it('should not render when there are no pending invitations', () => {
      mockGetPending.mockReturnValue({
        data: [],
        isLoading: false,
        refetch: mockRefetch,
      })

      const { container } = render(<PendingInvitationsCard />)
      expect(container.firstChild).toBeNull()
    })

    it('should not render when data is undefined and not loading', () => {
      mockGetPending.mockReturnValue({
        data: undefined,
        isLoading: false,
        refetch: mockRefetch,
      })

      const { container } = render(<PendingInvitationsCard />)
      expect(container.firstChild).toBeNull()
    })
  })

  describe('Loading State', () => {
    it('should show loading spinner when fetching', () => {
      mockGetPending.mockReturnValue({
        data: undefined,
        isLoading: true,
        refetch: mockRefetch,
      })

      render(<PendingInvitationsCard />)
      // Loading state should render the card with spinner
      expect(screen.getByText('Pending Invitations')).toBeInTheDocument()
    })
  })

  describe('With Invitations', () => {
    const mockInvitations = [
      {
        id: 'inv-1',
        inviter: { full_name: 'John Doe' },
        rule: { name: 'Invite as Subcontractor' },
        personal_message: 'Looking forward to working with you!',
        constraint_blocked: false,
      },
      {
        id: 'inv-2',
        inviter: { full_name: 'Jane Smith' },
        rule: { name: 'Invite as Client' },
        personal_message: null,
        constraint_blocked: true,
        constraint_reason: 'You already have a broker relationship',
      },
    ]

    beforeEach(() => {
      mockGetPending.mockReturnValue({
        data: mockInvitations,
        isLoading: false,
        refetch: mockRefetch,
      })
    })

    it('should display the card title', () => {
      render(<PendingInvitationsCard />)
      expect(screen.getByText('Pending Invitations')).toBeInTheDocument()
    })

    it('should display pending count', () => {
      render(<PendingInvitationsCard />)
      expect(screen.getByText('2 pending')).toBeInTheDocument()
    })

    it('should display inviter names', () => {
      render(<PendingInvitationsCard />)
      expect(screen.getByText('From John Doe')).toBeInTheDocument()
      expect(screen.getByText('From Jane Smith')).toBeInTheDocument()
    })

    it('should display rule names', () => {
      render(<PendingInvitationsCard />)
      expect(screen.getByText('Invite as Subcontractor')).toBeInTheDocument()
      expect(screen.getByText('Invite as Client')).toBeInTheDocument()
    })

    it('should display personal message when present', () => {
      render(<PendingInvitationsCard />)
      expect(screen.getByText('"Looking forward to working with you!"')).toBeInTheDocument()
    })

    it('should display constraint warning when blocked', () => {
      render(<PendingInvitationsCard />)
      expect(screen.getByText('You already have a broker relationship')).toBeInTheDocument()
    })

    it('should have accept and decline buttons for each invitation', () => {
      render(<PendingInvitationsCard />)
      const acceptButtons = screen.getAllByText('Accept')
      const declineButtons = screen.getAllByText('Decline')
      expect(acceptButtons).toHaveLength(2)
      expect(declineButtons).toHaveLength(2)
    })
  })

  describe('Accept Action', () => {
    beforeEach(() => {
      mockGetPending.mockReturnValue({
        data: [
          {
            id: 'inv-1',
            inviter: { full_name: 'John Doe' },
            rule: { name: 'Invite' },
            constraint_blocked: false,
          },
        ],
        isLoading: false,
        refetch: mockRefetch,
      })
    })

    it('should call accept mutation when Accept is clicked', async () => {
      render(<PendingInvitationsCard />)

      const acceptButton = screen.getByText('Accept')
      fireEvent.click(acceptButton)

      expect(mockAccept).toHaveBeenCalledWith({ invitationId: 'inv-1' })
    })
  })

  describe('Decline Action', () => {
    beforeEach(() => {
      mockGetPending.mockReturnValue({
        data: [
          {
            id: 'inv-1',
            inviter: { full_name: 'John Doe' },
            rule: { name: 'Invite' },
            constraint_blocked: false,
          },
        ],
        isLoading: false,
        refetch: mockRefetch,
      })
    })

    it('should call decline mutation when Decline is clicked', async () => {
      render(<PendingInvitationsCard />)

      const declineButton = screen.getByText('Decline')
      fireEvent.click(declineButton)

      expect(mockDecline).toHaveBeenCalledWith({ invitationId: 'inv-1' })
    })
  })

  describe('Custom Title', () => {
    it('should allow custom title prop', () => {
      mockGetPending.mockReturnValue({
        data: [{ id: 'inv-1', inviter: { full_name: 'John' }, rule: { name: 'Test' } }],
        isLoading: false,
        refetch: mockRefetch,
      })

      render(<PendingInvitationsCard title="My Custom Title" />)
      expect(screen.getByText('My Custom Title')).toBeInTheDocument()
    })
  })

  describe('Max Visible', () => {
    it('should limit visible invitations based on maxVisible prop', () => {
      const manyInvitations = Array.from({ length: 5 }, (_, i) => ({
        id: `inv-${i}`,
        inviter: { full_name: `User ${i}` },
        rule: { name: 'Invite' },
        constraint_blocked: false,
      }))

      mockGetPending.mockReturnValue({
        data: manyInvitations,
        isLoading: false,
        refetch: mockRefetch,
      })

      render(<PendingInvitationsCard maxVisible={2} />)

      // Should show View All button when there are more items
      expect(screen.getByText('View All')).toBeInTheDocument()

      // Should only show 2 invitations
      const acceptButtons = screen.getAllByText('Accept')
      expect(acceptButtons).toHaveLength(2)
    })
  })
})
