/**
 * FeedbackModal Component Tests
 * Tests the main feedback modal with view states
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@/test/test-utils'

// Mock child components
vi.mock('../FeedbackList', () => ({
  FeedbackList: ({ onSelect, onNewFeedback }: { onSelect: (id: string) => void; onNewFeedback: () => void }) => (
    <div data-testid="feedback-list">
      <button onClick={() => onSelect('feedback-123')}>Select Item</button>
      <button onClick={onNewFeedback}>New Feedback</button>
    </div>
  ),
}))

vi.mock('../FeedbackForm', () => ({
  FeedbackForm: ({ onSuccess, onCancel }: { onSuccess: () => void; onCancel: () => void }) => (
    <div data-testid="feedback-form">
      <button onClick={onSuccess}>Submit</button>
      <button onClick={onCancel}>Cancel</button>
    </div>
  ),
}))

vi.mock('../FeedbackConversation', () => ({
  FeedbackConversation: ({ feedbackId, onBack }: { feedbackId: string; onBack: () => void }) => (
    <div data-testid="feedback-conversation">
      <span>Conversation: {feedbackId}</span>
      <button onClick={onBack}>Back</button>
    </div>
  ),
}))

import { FeedbackModal } from '../FeedbackModal'

describe('FeedbackModal', () => {
  const mockOnClose = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Closed State', () => {
    it('should not render when closed', () => {
      render(<FeedbackModal isOpen={false} onClose={mockOnClose} />)
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })
  })

  describe('Open State', () => {
    it('should render dialog when open', () => {
      render(<FeedbackModal isOpen={true} onClose={mockOnClose} />)
      expect(screen.getByRole('dialog')).toBeInTheDocument()
    })

    it('should have aria-modal attribute', () => {
      render(<FeedbackModal isOpen={true} onClose={mockOnClose} />)
      expect(screen.getByRole('dialog')).toHaveAttribute('aria-modal', 'true')
    })

    it('should render list view by default', () => {
      render(<FeedbackModal isOpen={true} onClose={mockOnClose} />)
      expect(screen.getByTestId('feedback-list')).toBeInTheDocument()
    })
  })

  describe('View Navigation', () => {
    it('should switch to new feedback view when button clicked', () => {
      render(<FeedbackModal isOpen={true} onClose={mockOnClose} />)
      fireEvent.click(screen.getByText('New Feedback'))
      expect(screen.getByTestId('feedback-form')).toBeInTheDocument()
    })

    it('should switch to conversation view when item selected', () => {
      render(<FeedbackModal isOpen={true} onClose={mockOnClose} />)
      fireEvent.click(screen.getByText('Select Item'))
      expect(screen.getByTestId('feedback-conversation')).toBeInTheDocument()
      expect(screen.getByText('Conversation: feedback-123')).toBeInTheDocument()
    })

    it('should return to list view from form on cancel', () => {
      render(<FeedbackModal isOpen={true} onClose={mockOnClose} />)
      fireEvent.click(screen.getByText('New Feedback'))
      fireEvent.click(screen.getByText('Cancel'))
      expect(screen.getByTestId('feedback-list')).toBeInTheDocument()
    })

    it('should return to list view from form on success', () => {
      render(<FeedbackModal isOpen={true} onClose={mockOnClose} />)
      fireEvent.click(screen.getByText('New Feedback'))
      fireEvent.click(screen.getByText('Submit'))
      expect(screen.getByTestId('feedback-list')).toBeInTheDocument()
    })

    it('should return to list view from conversation on back', () => {
      render(<FeedbackModal isOpen={true} onClose={mockOnClose} />)
      fireEvent.click(screen.getByText('Select Item'))
      fireEvent.click(screen.getByText('Back'))
      expect(screen.getByTestId('feedback-list')).toBeInTheDocument()
    })
  })

  describe('Close Behavior', () => {
    it('should close on backdrop click', () => {
      render(<FeedbackModal isOpen={true} onClose={mockOnClose} />)
      const backdrop = screen.getByRole('dialog')
      fireEvent.click(backdrop)
      expect(mockOnClose).toHaveBeenCalledTimes(1)
    })

    it('should not close when clicking modal content', () => {
      render(<FeedbackModal isOpen={true} onClose={mockOnClose} />)
      const list = screen.getByTestId('feedback-list')
      fireEvent.click(list)
      expect(mockOnClose).not.toHaveBeenCalled()
    })

    it('should close on escape key', () => {
      render(<FeedbackModal isOpen={true} onClose={mockOnClose} />)
      fireEvent.keyDown(document, { key: 'Escape' })
      expect(mockOnClose).toHaveBeenCalledTimes(1)
    })
  })

  describe('Deep Linking', () => {
    it('should open conversation view when initialFeedbackId is provided', () => {
      render(
        <FeedbackModal
          isOpen={true}
          onClose={mockOnClose}
          initialFeedbackId="deep-link-123"
        />
      )
      expect(screen.getByTestId('feedback-conversation')).toBeInTheDocument()
      expect(screen.getByText('Conversation: deep-link-123')).toBeInTheDocument()
    })
  })
})
