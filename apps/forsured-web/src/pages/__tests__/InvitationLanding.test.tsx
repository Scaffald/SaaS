/**
 * InvitationLanding Page Tests
 * Invitation landing page tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderWithoutRouter, screen } from '@/test/test-utils'
import { MemoryRouter, Routes, Route } from 'react-router-dom'

// Mock auth state variable
let mockAuthState = { user: null as { id: string; email: string } | null, profile: null as { user_type: string; email: string } | null, isLoading: false }

// Mock invitation data variable
let mockInvitationData: unknown = null
let mockIsLoading = false
let mockError: Error | null = null

// Mock tRPC
vi.mock('../../lib/trpc', () => ({
  trpc: {
    genericInvitations: {
      getByCode: {
        useQuery: () => ({
          data: mockInvitationData,
          isLoading: mockIsLoading,
          error: mockError,
          refetch: vi.fn(),
        }),
      },
      accept: {
        useMutation: () => ({
          mutate: vi.fn(),
          isPending: false,
        }),
      },
      decline: {
        useMutation: () => ({
          mutate: vi.fn(),
          isPending: false,
        }),
      },
    },
  },
}))

// Mock Auth Context
vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => mockAuthState,
}))

// Mock navigate
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => vi.fn(),
  }
})

import InvitationLandingPage from '../InvitationLanding'

// Helper to render with route params
function renderWithRoute(code: string) {
  return renderWithoutRouter(
    <MemoryRouter initialEntries={[`/invite/${code}`]}>
      <Routes>
        <Route path="/invite/:code" element={<InvitationLandingPage />} />
      </Routes>
    </MemoryRouter>
  )
}

describe('InvitationLandingPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockAuthState = { user: null, profile: null, isLoading: false }
    mockInvitationData = null
    mockIsLoading = false
    mockError = null
  })

  describe('Loading State', () => {
    it('should show loading spinner while fetching invitation', () => {
      mockIsLoading = true

      renderWithRoute('ABC123')
      expect(screen.getByText('Loading invitation...')).toBeInTheDocument()
    })

    it('should show loading spinner while auth is loading', () => {
      mockAuthState = { user: null, profile: null, isLoading: true }
      mockInvitationData = { id: 'inv-1', status: 'pending' }

      renderWithRoute('ABC123')
      expect(screen.getByText('Loading invitation...')).toBeInTheDocument()
    })
  })

  describe('Not Found State', () => {
    it('should show not found message when invitation does not exist', () => {
      mockError = new Error('Not found')

      renderWithRoute('INVALID')
      expect(screen.getByText('Invitation Not Found')).toBeInTheDocument()
    })

    it('should show explanation text', () => {
      mockError = new Error('Not found')

      renderWithRoute('INVALID')
      expect(screen.getByText(/may have expired/)).toBeInTheDocument()
    })

    it('should show Go to Home button', () => {
      mockError = new Error('Not found')

      renderWithRoute('INVALID')
      expect(screen.getByText('Go to Home')).toBeInTheDocument()
    })
  })

  describe('Already Processed Invitation', () => {
    it('should show accepted message for accepted invitations', () => {
      mockInvitationData = { id: 'inv-1', status: 'accepted' }

      renderWithRoute('ABC123')
      expect(screen.getByText('Invitation accepted')).toBeInTheDocument()
    })

    it('should show declined message for declined invitations', () => {
      mockInvitationData = { id: 'inv-1', status: 'declined' }

      renderWithRoute('ABC123')
      expect(screen.getByText('Invitation declined')).toBeInTheDocument()
    })

    it('should show expired message for expired invitations', () => {
      mockInvitationData = { id: 'inv-1', status: 'expired' }

      renderWithRoute('ABC123')
      expect(screen.getByText('Invitation expired')).toBeInTheDocument()
    })
  })

  describe('Anonymous User View', () => {
    beforeEach(() => {
      mockAuthState = { user: null, profile: null, isLoading: false }
      mockInvitationData = {
        id: 'inv-1',
        status: 'pending',
        inviter: { full_name: 'John Doe' },
        rule: { name: 'Invite as Subcontractor', target_role: 'subcontractor' },
        personal_message: 'Looking forward to working with you!',
      }
    })

    it('should show "You\'ve Been Invited!" heading', () => {
      renderWithRoute('ABC123')
      expect(screen.getByText("You've Been Invited!")).toBeInTheDocument()
    })

    it('should display inviter name', () => {
      renderWithRoute('ABC123')
      expect(screen.getByText('John Doe')).toBeInTheDocument()
    })

    it('should display target role', () => {
      renderWithRoute('ABC123')
      expect(screen.getByText('subcontractor')).toBeInTheDocument()
    })

    it('should display personal message', () => {
      renderWithRoute('ABC123')
      expect(
        screen.getByText('"Looking forward to working with you!"')
      ).toBeInTheDocument()
    })

    it('should show Create Account button', () => {
      renderWithRoute('ABC123')
      expect(screen.getByText('Create Account')).toBeInTheDocument()
    })

    it('should show I Already Have an Account button', () => {
      renderWithRoute('ABC123')
      expect(screen.getByText('I Already Have an Account')).toBeInTheDocument()
    })
  })

  describe('Authenticated User View', () => {
    beforeEach(() => {
      mockAuthState = {
        user: { id: 'user-123', email: 'test@example.com' },
        profile: { user_type: 'contractor', email: 'test@example.com' },
        isLoading: false,
      }
      mockInvitationData = {
        id: 'inv-1',
        status: 'pending',
        inviter: { full_name: 'John Doe' },
        rule: { name: 'Project Invitation' },
        personal_message: 'Join our project!',
        constraint_blocked: false,
      }
    })

    it('should display rule name as heading', () => {
      renderWithRoute('ABC123')
      expect(screen.getByText('Project Invitation')).toBeInTheDocument()
    })

    it('should display inviter info', () => {
      renderWithRoute('ABC123')
      expect(screen.getByText('John Doe')).toBeInTheDocument()
    })

    it('should display personal message', () => {
      renderWithRoute('ABC123')
      expect(screen.getByText('"Join our project!"')).toBeInTheDocument()
    })

    it('should show Accept button', () => {
      renderWithRoute('ABC123')
      expect(screen.getByText('Accept')).toBeInTheDocument()
    })

    it('should show Decline button', () => {
      renderWithRoute('ABC123')
      expect(screen.getByText('Decline')).toBeInTheDocument()
    })

    it('should show logged in user email', () => {
      renderWithRoute('ABC123')
      expect(screen.getByText(/Logged in as test@example.com/)).toBeInTheDocument()
    })
  })

  describe('Constraint Warning', () => {
    it('should display constraint warning when blocked', () => {
      mockAuthState = {
        user: { id: 'user-123', email: 'test@example.com' },
        profile: { user_type: 'contractor', email: 'test@example.com' },
        isLoading: false,
      }
      mockInvitationData = {
        id: 'inv-1',
        status: 'pending',
        inviter: { full_name: 'John Doe' },
        rule: { name: 'Invitation' },
        constraint_blocked: true,
        constraint_reason: 'You already have a broker',
      }

      renderWithRoute('ABC123')
      expect(screen.getByText('Relationship Constraint')).toBeInTheDocument()
      expect(screen.getByText('You already have a broker')).toBeInTheDocument()
    })
  })
})
