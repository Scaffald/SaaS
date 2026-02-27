/**
 * GenericInviteModal Component Tests
 * Flexible Invitation System - Task 6
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@/test/test-utils'

// Mock tRPC with simpler structure
vi.mock('../../../lib/trpc', () => ({
  trpc: {
    genericInvitations: {
      getRules: {
        useQuery: () => ({
          data: [
            {
              id: 'rule-1',
              name: 'Invite Subcontractor',
              description: 'Invite a subcontractor to your project',
              source_role: 'manager',
              target_role: 'subcontractor',
              requires_project: false,
            },
          ],
        }),
      },
      checkConstraint: {
        useQuery: () => ({
          data: { allowed: true },
          isLoading: false,
        }),
      },
      create: {
        useMutation: () => ({
          mutate: vi.fn(),
          isPending: false,
        }),
      },
    },
  },
}))

import { GenericInviteModal } from '../GenericInviteModal'

describe('GenericInviteModal', () => {
  const mockOnClose = vi.fn()
  const mockOnSuccess = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Closed State', () => {
    it('should not render content when closed', () => {
      render(<GenericInviteModal isOpen={false} onClose={mockOnClose} />)
      expect(screen.queryByText('Send Invitation')).not.toBeInTheDocument()
    })
  })

  describe('Open State', () => {
    it('should render modal title when open', () => {
      render(<GenericInviteModal isOpen={true} onClose={mockOnClose} />)
      // Title and button both contain "Send Invitation", so check for multiple
      const elements = screen.getAllByText('Send Invitation')
      expect(elements.length).toBeGreaterThanOrEqual(1)
    })

    it('should render email input', () => {
      render(<GenericInviteModal isOpen={true} onClose={mockOnClose} />)
      expect(screen.getByPlaceholderText('user@example.com')).toBeInTheDocument()
    })

    it('should render name input', () => {
      render(<GenericInviteModal isOpen={true} onClose={mockOnClose} />)
      expect(screen.getByPlaceholderText('John Doe')).toBeInTheDocument()
    })

    it('should render personal message textarea', () => {
      render(<GenericInviteModal isOpen={true} onClose={mockOnClose} />)
      expect(
        screen.getByPlaceholderText('Add a personal note to your invitation...')
      ).toBeInTheDocument()
    })

    it('should render Cancel button', () => {
      render(<GenericInviteModal isOpen={true} onClose={mockOnClose} />)
      expect(screen.getByText('Cancel')).toBeInTheDocument()
    })
  })

  describe('Form Inputs', () => {
    it('should have email input field', () => {
      render(<GenericInviteModal isOpen={true} onClose={mockOnClose} />)

      const emailInput = screen.getByPlaceholderText('user@example.com')
      expect(emailInput).toBeInTheDocument()
    })

    it('should have name input field', () => {
      render(<GenericInviteModal isOpen={true} onClose={mockOnClose} />)

      const nameInput = screen.getByPlaceholderText('John Doe')
      expect(nameInput).toBeInTheDocument()
    })

    it('should have personal message field', () => {
      render(<GenericInviteModal isOpen={true} onClose={mockOnClose} />)

      const messageInput = screen.getByPlaceholderText(
        'Add a personal note to your invitation...'
      )
      expect(messageInput).toBeInTheDocument()
    })
  })

  describe('Close Behavior', () => {
    it('should call onClose when Cancel is clicked', () => {
      render(<GenericInviteModal isOpen={true} onClose={mockOnClose} />)

      const cancelButton = screen.getByText('Cancel')
      fireEvent.click(cancelButton)

      expect(mockOnClose).toHaveBeenCalled()
    })
  })

  describe('Project Context', () => {
    it('should display project name when provided', () => {
      render(
        <GenericInviteModal
          isOpen={true}
          onClose={mockOnClose}
          ruleId="rule-1"
          projectId="proj-123"
          projectName="Downtown Construction"
        />
      )

      expect(screen.getByText('Downtown Construction')).toBeInTheDocument()
    })
  })

  describe('Rule Display', () => {
    it('should show rule info when preselected', () => {
      render(
        <GenericInviteModal isOpen={true} onClose={mockOnClose} ruleId="rule-1" />
      )
      expect(screen.getByText('Invite Subcontractor')).toBeInTheDocument()
    })
  })

  describe('Info Box', () => {
    it('should display invitation info text', () => {
      render(<GenericInviteModal isOpen={true} onClose={mockOnClose} />)
      expect(
        screen.getByText(/An invitation email will be sent with a unique link/)
      ).toBeInTheDocument()
    })
  })
})
