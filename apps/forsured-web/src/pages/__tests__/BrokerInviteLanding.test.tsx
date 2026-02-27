/**
 * BrokerInviteLanding Page Tests
 * REQ-13: Contractor Invitation Email with Insurance Document Upload
 * Task 8: Testing Suite - Component Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderWithoutRouter, screen, fireEvent, waitFor } from '@/test/test-utils'
import { MemoryRouter, Routes, Route } from 'react-router-dom'

// Mock auth state variable
let mockAuthState = {
  user: null as { id: string; email: string } | null,
  profile: null as { user_type: string; email: string; full_name?: string } | null,
  isLoading: false,
}

// Mock Auth Context - needs to be before importing the page
vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => mockAuthState,
}))

// Mock referral data variable
let mockReferralData: {
  contractorId: string
  contractorName: string
  contractorCompany?: string
} | null = null
let mockIsLoading = false
let mockError: Error | null = null
let mockSubmitPending = false

// Mock tRPC
vi.mock('../../lib/trpc', () => ({
  trpc: {
    brokerInvitation: {
      getByReferralCode: {
        useQuery: () => ({
          data: mockReferralData,
          isLoading: mockIsLoading,
          error: mockError,
        }),
      },
      submitDocuments: {
        useMutation: () => ({
          mutate: vi.fn(),
          mutateAsync: vi.fn(),
          isPending: mockSubmitPending,
          isSuccess: false,
          data: null,
        }),
      },
    },
  },
}))

// Mock navigate
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => vi.fn(),
  }
})

import BrokerInviteLandingPage from '../BrokerInviteLanding'

// Helper to render with route params
function renderWithRoute(referralCode: string) {
  return renderWithoutRouter(
    <MemoryRouter initialEntries={[`/broker/invite/${referralCode}`]}>
      <Routes>
        <Route path="/broker/invite/:referralCode" element={<BrokerInviteLandingPage />} />
      </Routes>
    </MemoryRouter>
  )
}

describe('BrokerInviteLandingPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockAuthState = { user: null, profile: null, isLoading: false }
    mockReferralData = null
    mockIsLoading = false
    mockError = null
    mockSubmitPending = false
  })

  describe('Loading State', () => {
    it('should show loading spinner while fetching referral info', () => {
      mockIsLoading = true

      renderWithRoute('test-contractor-id')
      expect(screen.getByText('Loading invitation...')).toBeInTheDocument()
    })

    it('should show loading while auth is loading', () => {
      mockAuthState = { user: null, profile: null, isLoading: true }

      renderWithRoute('test-contractor-id')
      expect(screen.getByText('Loading invitation...')).toBeInTheDocument()
    })
  })

  describe('Error State', () => {
    it('should show Invitation Not Found when referral code is invalid', () => {
      mockError = new Error('Not found')

      renderWithRoute('invalid-code')
      expect(screen.getByText('Invitation Not Found')).toBeInTheDocument()
    })

    it('should show explanation about expired or invalid link', () => {
      mockError = new Error('Not found')

      renderWithRoute('invalid-code')
      expect(screen.getByText(/may have expired/)).toBeInTheDocument()
    })

    it('should show Go to Home button', () => {
      mockError = new Error('Not found')

      renderWithRoute('invalid-code')
      expect(screen.getByText('Go to Home')).toBeInTheDocument()
    })
  })

  describe('Upload Form', () => {
    beforeEach(() => {
      mockReferralData = {
        contractorId: 'test-contractor-id',
        contractorName: 'John Contractor',
        contractorCompany: 'Contractor Inc',
      }
    })

    it('should display contractor name', () => {
      renderWithRoute('test-contractor-id')
      expect(screen.getByText('John Contractor')).toBeInTheDocument()
    })

    it('should display invitation message', () => {
      renderWithRoute('test-contractor-id')
      expect(
        screen.getByText(/has invited you to upload their insurance documents/)
      ).toBeInTheDocument()
    })

    it('should show form title Your Information', () => {
      renderWithRoute('test-contractor-id')
      expect(screen.getByText('Your Information')).toBeInTheDocument()
    })

    it('should show name field with required indicator', () => {
      renderWithRoute('test-contractor-id')
      expect(screen.getByText('Name')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('Your full name')).toBeInTheDocument()
    })

    it('should show email field with required indicator', () => {
      renderWithRoute('test-contractor-id')
      expect(screen.getByText('Email')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('your.email@company.com')).toBeInTheDocument()
    })

    it('should show phone field as optional', () => {
      renderWithRoute('test-contractor-id')
      expect(screen.getByText('Phone (optional)')).toBeInTheDocument()
    })

    it('should show company field as optional', () => {
      renderWithRoute('test-contractor-id')
      expect(screen.getByText('Insurance Agency (optional)')).toBeInTheDocument()
    })

    it('should show file upload area with Browse files', () => {
      renderWithRoute('test-contractor-id')
      expect(screen.getByText('Browse files')).toBeInTheDocument()
    })

    it('should show drag and drop text', () => {
      renderWithRoute('test-contractor-id')
      expect(screen.getByText('or drag and drop here')).toBeInTheDocument()
    })

    it('should show create account checkbox option', () => {
      renderWithRoute('test-contractor-id')
      // The checkbox uses a label prop which renders as a label element
      expect(screen.getByRole('checkbox')).toBeInTheDocument()
      // Also check for the description text below the checkbox
      expect(screen.getByText(/Get access to manage insurance documents/)).toBeInTheDocument()
    })

    it('should disable submit button when no files uploaded', () => {
      renderWithRoute('test-contractor-id')

      // Get the button specifically by role to avoid multiple text matches
      const submitButtons = screen.getAllByRole('button')
      const submitButton = submitButtons.find(
        (btn) => btn.textContent?.includes('Upload Documents') || btn.textContent?.includes('Uploading')
      )
      expect(submitButton).toBeDisabled()
    })

    it('should show accepted file types', () => {
      renderWithRoute('test-contractor-id')
      expect(screen.getByText(/PDF, DOCX, JPEG, PNG, GIF/)).toBeInTheDocument()
    })

    it('should show file size limit', () => {
      renderWithRoute('test-contractor-id')
      expect(screen.getByText(/Max 2MB/)).toBeInTheDocument()
    })
  })

  describe('Form Input', () => {
    beforeEach(() => {
      mockReferralData = {
        contractorId: 'test-contractor-id',
        contractorName: 'John Contractor',
      }
    })

    it('should allow entering name', () => {
      renderWithRoute('test-contractor-id')

      const nameInput = screen.getByPlaceholderText('Your full name')
      fireEvent.change(nameInput, { target: { value: 'Test Broker' } })
      expect(nameInput).toHaveValue('Test Broker')
    })

    it('should allow entering email', () => {
      renderWithRoute('test-contractor-id')

      const emailInput = screen.getByPlaceholderText('your.email@company.com')
      fireEvent.change(emailInput, { target: { value: 'broker@example.com' } })
      expect(emailInput).toHaveValue('broker@example.com')
    })

    it('should allow entering phone', () => {
      renderWithRoute('test-contractor-id')

      const phoneInput = screen.getByPlaceholderText('(555) 123-4567')
      fireEvent.change(phoneInput, { target: { value: '555-123-4567' } })
      expect(phoneInput).toHaveValue('555-123-4567')
    })

    it('should allow entering company', () => {
      renderWithRoute('test-contractor-id')

      const companyInput = screen.getByPlaceholderText('Your agency name')
      fireEvent.change(companyInput, { target: { value: 'Insurance Co' } })
      expect(companyInput).toHaveValue('Insurance Co')
    })
  })

  describe('Submission', () => {
    beforeEach(() => {
      mockReferralData = {
        contractorId: 'test-contractor-id',
        contractorName: 'John Contractor',
      }
    })

    it('should show loading state during submission', () => {
      mockSubmitPending = true

      renderWithRoute('test-contractor-id')

      expect(screen.getByText('Uploading...')).toBeInTheDocument()
    })
  })

  describe('Why ForSured Section', () => {
    beforeEach(() => {
      mockReferralData = {
        contractorId: 'test-contractor-id',
        contractorName: 'John Contractor',
      }
    })

    it('should display Why ForSured section', () => {
      renderWithRoute('test-contractor-id')
      expect(screen.getByText('Why ForSured?')).toBeInTheDocument()
    })

    it('should display secure storage benefit', () => {
      renderWithRoute('test-contractor-id')
      expect(screen.getByText(/Securely store and manage insurance certificates/)).toBeInTheDocument()
    })

    it('should display expiration tracking benefit', () => {
      renderWithRoute('test-contractor-id')
      expect(screen.getByText(/Automatic expiration tracking/)).toBeInTheDocument()
    })
  })

  describe('Sign In Link', () => {
    beforeEach(() => {
      mockReferralData = {
        contractorId: 'test-contractor-id',
        contractorName: 'John Contractor',
      }
    })

    it('should show sign in link for unauthenticated users', () => {
      renderWithRoute('test-contractor-id')
      expect(screen.getByText(/Already have an account\? Sign in/)).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    beforeEach(() => {
      mockReferralData = {
        contractorId: 'test-contractor-id',
        contractorName: 'John Contractor',
      }
    })

    it('should have a main heading', () => {
      renderWithRoute('test-contractor-id')

      const heading = screen.getByRole('heading', { level: 1 })
      expect(heading).toBeInTheDocument()
      expect(heading).toHaveTextContent('Insurance Document Upload')
    })

    it('should have accessible file input', () => {
      renderWithRoute('test-contractor-id')
      expect(screen.getByLabelText('Browse files')).toBeInTheDocument()
    })
  })

  describe('Footer', () => {
    beforeEach(() => {
      mockReferralData = {
        contractorId: 'test-contractor-id',
        contractorName: 'John Contractor',
      }
    })

    it('should show terms and privacy notice', () => {
      renderWithRoute('test-contractor-id')
      expect(
        screen.getByText(/By uploading documents, you agree to our Terms of Service/)
      ).toBeInTheDocument()
    })
  })
})
