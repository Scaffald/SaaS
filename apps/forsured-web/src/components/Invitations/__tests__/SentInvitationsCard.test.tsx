/**
 * SentInvitationsCard Component Tests
 * REQ-128: Flexible Invitation System - Task 8
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@/test/test-utils'

// Mock tRPC
const mockGetSent = vi.fn()

vi.mock('../../../lib/trpc', () => ({
  trpc: {
    genericInvitations: {
      getSent: {
        useQuery: () => mockGetSent(),
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

import { SentInvitationsCard } from '../SentInvitationsCard'

describe('SentInvitationsCard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Empty State', () => {
    it('should not render when there are no sent invitations', () => {
      mockGetSent.mockReturnValue({
        data: [],
        isLoading: false,
      })

      const { container } = render(<SentInvitationsCard />)
      expect(container.firstChild).toBeNull()
    })

    it('should not render when data is undefined and not loading', () => {
      mockGetSent.mockReturnValue({
        data: undefined,
        isLoading: false,
      })

      const { container } = render(<SentInvitationsCard />)
      expect(container.firstChild).toBeNull()
    })
  })

  describe('Loading State', () => {
    it('should show loading spinner when fetching', () => {
      mockGetSent.mockReturnValue({
        data: undefined,
        isLoading: true,
      })

      render(<SentInvitationsCard />)
      expect(screen.getByText('Sent Invitations')).toBeInTheDocument()
    })
  })

  describe('With Invitations', () => {
    const mockInvitations = [
      {
        id: 'inv-1',
        invitee_email: 'john@example.com',
        invitee_name: 'John Doe',
        rule: { name: 'Invite as Subcontractor' },
        status: 'pending',
        created_at: new Date().toISOString(),
      },
      {
        id: 'inv-2',
        invitee_email: 'jane@example.com',
        invitee_name: null,
        rule: { name: 'Invite as Client' },
        status: 'accepted',
        created_at: new Date(Date.now() - 86400000).toISOString(), // Yesterday
      },
      {
        id: 'inv-3',
        invitee_email: 'bob@example.com',
        invitee_name: 'Bob Smith',
        rule: { name: 'Invite as Broker' },
        status: 'declined',
        created_at: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
      },
    ]

    beforeEach(() => {
      mockGetSent.mockReturnValue({
        data: mockInvitations,
        isLoading: false,
      })
    })

    it('should display the card title', () => {
      render(<SentInvitationsCard />)
      expect(screen.getByText('Sent Invitations')).toBeInTheDocument()
    })

    it('should display pending count', () => {
      render(<SentInvitationsCard />)
      expect(screen.getByText('1 pending')).toBeInTheDocument()
    })

    it('should display invitee names when available', () => {
      render(<SentInvitationsCard />)
      expect(screen.getByText('John Doe')).toBeInTheDocument()
      expect(screen.getByText('Bob Smith')).toBeInTheDocument()
    })

    it('should fall back to email when name is not available', () => {
      render(<SentInvitationsCard />)
      expect(screen.getByText('jane@example.com')).toBeInTheDocument()
    })

    it('should display rule names', () => {
      render(<SentInvitationsCard />)
      expect(screen.getByText(/Invite as Subcontractor/)).toBeInTheDocument()
      expect(screen.getByText(/Invite as Client/)).toBeInTheDocument()
      expect(screen.getByText(/Invite as Broker/)).toBeInTheDocument()
    })

    it('should display status badges', () => {
      render(<SentInvitationsCard />)
      expect(screen.getByText('pending')).toBeInTheDocument()
      expect(screen.getByText('accepted')).toBeInTheDocument()
      expect(screen.getByText('declined')).toBeInTheDocument()
    })

    it('should display relative dates', () => {
      render(<SentInvitationsCard />)
      expect(screen.getByText(/Today/)).toBeInTheDocument()
      expect(screen.getByText(/Yesterday/)).toBeInTheDocument()
      expect(screen.getByText(/2 days ago/)).toBeInTheDocument()
    })
  })

  describe('Custom Title', () => {
    it('should allow custom title prop', () => {
      mockGetSent.mockReturnValue({
        data: [
          {
            id: 'inv-1',
            invitee_email: 'test@example.com',
            rule: { name: 'Test' },
            status: 'pending',
            created_at: new Date().toISOString(),
          },
        ],
        isLoading: false,
      })

      render(<SentInvitationsCard title="My Sent Invites" />)
      expect(screen.getByText('My Sent Invites')).toBeInTheDocument()
    })
  })

  describe('Max Visible', () => {
    it('should limit visible invitations based on maxVisible prop', () => {
      const manyInvitations = Array.from({ length: 10 }, (_, i) => ({
        id: `inv-${i}`,
        invitee_email: `user${i}@example.com`,
        invitee_name: `User ${i}`,
        rule: { name: 'Invite' },
        status: 'pending',
        created_at: new Date().toISOString(),
      }))

      mockGetSent.mockReturnValue({
        data: manyInvitations,
        isLoading: false,
      })

      render(<SentInvitationsCard maxVisible={3} />)

      // Should show View All button when there are more items
      expect(screen.getByText('View All')).toBeInTheDocument()

      // Should only show 3 invitations (by checking for User names)
      expect(screen.getByText('User 0')).toBeInTheDocument()
      expect(screen.getByText('User 1')).toBeInTheDocument()
      expect(screen.getByText('User 2')).toBeInTheDocument()
      expect(screen.queryByText('User 3')).not.toBeInTheDocument()
    })
  })

  describe('Status Colors', () => {
    it('should show different colors for different statuses', () => {
      mockGetSent.mockReturnValue({
        data: [
          {
            id: 'inv-1',
            invitee_email: 'test@example.com',
            rule: { name: 'Test' },
            status: 'accepted',
            created_at: new Date().toISOString(),
          },
        ],
        isLoading: false,
      })

      render(<SentInvitationsCard />)
      const statusBadge = screen.getByText('accepted')
      expect(statusBadge).toBeInTheDocument()
    })
  })
})
