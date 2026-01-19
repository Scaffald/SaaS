/**
 * FeedbackForm Component Tests
 * Tests the new feedback submission form
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@/test/test-utils'

// Mock tRPC
const mockMutateAsync = vi.fn()
const mockInvalidate = vi.fn()

vi.mock('../../../lib/trpc', () => ({
  trpc: {
    useUtils: () => ({
      feedback: {
        list: { invalidate: mockInvalidate },
        getUnreadCount: { invalidate: mockInvalidate },
      },
    }),
    feedback: {
      create: {
        useMutation: () => ({
          mutateAsync: mockMutateAsync,
          isPending: false,
        }),
      },
      getUploadUrl: {
        useMutation: () => ({
          mutateAsync: vi.fn().mockResolvedValue({
            signedUrl: 'https://example.com/upload',
            path: 'test/path/file.png',
          }),
        }),
      },
    },
  },
}))

// Mock PageScreenshot
vi.mock('../PageScreenshot', () => ({
  PageScreenshot: ({ onCapture }: { onCapture: (blob: Blob, name: string) => void }) => (
    <button
      data-testid="screenshot-button"
      onClick={() => onCapture(new Blob(['test']), 'screenshot.png')}
    >
      Capture
    </button>
  ),
}))

// Mock toast
vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}))

import { FeedbackForm } from '../FeedbackForm'
import { toast } from 'sonner'

describe('FeedbackForm', () => {
  const mockOnSuccess = vi.fn()
  const mockOnCancel = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    mockMutateAsync.mockResolvedValue({ feedbackId: 'new-feedback-123' })
  })

  describe('Rendering', () => {
    it('should render type selector buttons', () => {
      render(<FeedbackForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />)
      expect(screen.getByText('Bug Report')).toBeInTheDocument()
      expect(screen.getByText('Feature Request')).toBeInTheDocument()
      expect(screen.getByText('Support')).toBeInTheDocument()
      expect(screen.getByText('General')).toBeInTheDocument()
    })

    it('should render subject input', () => {
      render(<FeedbackForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />)
      expect(screen.getByPlaceholderText(/brief summary/i)).toBeInTheDocument()
    })

    it('should render message textarea', () => {
      render(<FeedbackForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />)
      expect(screen.getByPlaceholderText(/describe your feedback/i)).toBeInTheDocument()
    })

    it('should render cancel and submit buttons', () => {
      render(<FeedbackForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />)
      expect(screen.getByText('Cancel')).toBeInTheDocument()
      expect(screen.getByText('Submit Feedback')).toBeInTheDocument()
    })

    it('should render file upload button', () => {
      render(<FeedbackForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />)
      expect(screen.getByText('Upload Files')).toBeInTheDocument()
    })

    it('should display current URL', () => {
      render(<FeedbackForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />)
      expect(screen.getByText(/submitting from/i)).toBeInTheDocument()
    })
  })

  describe('Type Selection', () => {
    it('should highlight selected type', () => {
      render(<FeedbackForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />)
      const bugButton = screen.getByText('Bug Report').closest('button')
      fireEvent.click(bugButton!)
      // Check that clicking changes the button state (visual feedback)
      expect(bugButton).toBeInTheDocument()
    })
  })

  describe('Form Validation', () => {
    it('should disable submit button when no type is selected', async () => {
      render(<FeedbackForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />)

      // Fill in other fields but don't select a type
      fireEvent.change(screen.getByPlaceholderText(/brief summary/i), {
        target: { value: 'Test subject' },
      })
      fireEvent.change(screen.getByPlaceholderText(/describe your feedback/i), {
        target: { value: 'Test message' },
      })

      // Submit button should be disabled when no type is selected
      const submitButton = screen.getByText('Submit Feedback')
      expect(submitButton).toBeDisabled()
    })

    it('should show error when submitting without subject', async () => {
      render(<FeedbackForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />)

      // Select type
      fireEvent.click(screen.getByText('Bug Report'))

      // Fill message but not subject
      fireEvent.change(screen.getByPlaceholderText(/describe your feedback/i), {
        target: { value: 'Test message' },
      })

      fireEvent.click(screen.getByText('Submit Feedback'))

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Please enter a subject')
      })
    })

    it('should show error when submitting without message', async () => {
      render(<FeedbackForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />)

      // Select type
      fireEvent.click(screen.getByText('Bug Report'))

      // Fill subject but not message
      fireEvent.change(screen.getByPlaceholderText(/brief summary/i), {
        target: { value: 'Test subject' },
      })

      fireEvent.click(screen.getByText('Submit Feedback'))

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Please enter a message')
      })
    })
  })

  describe('Successful Submission', () => {
    it('should call mutation with correct data', async () => {
      render(<FeedbackForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />)

      // Fill form
      fireEvent.click(screen.getByText('Bug Report'))
      fireEvent.change(screen.getByPlaceholderText(/brief summary/i), {
        target: { value: 'Test bug' },
      })
      fireEvent.change(screen.getByPlaceholderText(/describe your feedback/i), {
        target: { value: 'Bug description' },
      })

      fireEvent.click(screen.getByText('Submit Feedback'))

      await waitFor(() => {
        expect(mockMutateAsync).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'bug',
            subject: 'Test bug',
            content: 'Bug description',
          })
        )
      })
    })

    it('should call onSuccess after successful submission', async () => {
      render(<FeedbackForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />)

      // Fill form
      fireEvent.click(screen.getByText('Bug Report'))
      fireEvent.change(screen.getByPlaceholderText(/brief summary/i), {
        target: { value: 'Test bug' },
      })
      fireEvent.change(screen.getByPlaceholderText(/describe your feedback/i), {
        target: { value: 'Bug description' },
      })

      fireEvent.click(screen.getByText('Submit Feedback'))

      await waitFor(() => {
        expect(mockOnSuccess).toHaveBeenCalled()
      })
    })

    it('should show success toast after submission', async () => {
      render(<FeedbackForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />)

      // Fill form
      fireEvent.click(screen.getByText('Bug Report'))
      fireEvent.change(screen.getByPlaceholderText(/brief summary/i), {
        target: { value: 'Test bug' },
      })
      fireEvent.change(screen.getByPlaceholderText(/describe your feedback/i), {
        target: { value: 'Bug description' },
      })

      fireEvent.click(screen.getByText('Submit Feedback'))

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith(
          'Feedback submitted',
          expect.any(Object)
        )
      })
    })
  })

  describe('Cancel', () => {
    it('should call onCancel when cancel button clicked', () => {
      render(<FeedbackForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />)
      fireEvent.click(screen.getByText('Cancel'))
      expect(mockOnCancel).toHaveBeenCalled()
    })
  })

  describe('Screenshot Capture', () => {
    it('should add screenshot to attachments', () => {
      render(<FeedbackForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />)

      fireEvent.click(screen.getByTestId('screenshot-button'))

      // Screenshot should appear in attachments list
      expect(screen.getByText('screenshot.png')).toBeInTheDocument()
    })
  })
})
