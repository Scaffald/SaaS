/**
 * FeedbackButton Component Tests
 * Tests the floating feedback button with unread badge
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@/test/test-utils'

// Mock tRPC
vi.mock('../../../lib/trpc', () => ({
  trpc: {
    feedback: {
      getUnreadCount: {
        useQuery: vi.fn(() => ({
          data: { count: 0 },
          isLoading: false,
        })),
      },
    },
  },
}))

import { FeedbackButton } from '../FeedbackButton'
import { trpc } from '../../../lib/trpc'

describe('FeedbackButton', () => {
  const mockOnClick = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Rendering', () => {
    it('should render the button', () => {
      render(<FeedbackButton onClick={mockOnClick} />)
      expect(screen.getByRole('button')).toBeInTheDocument()
    })

    it('should be a clickable button element', () => {
      render(<FeedbackButton onClick={mockOnClick} />)
      const button = screen.getByRole('button')
      expect(button).toBeEnabled()
    })

    it('should have accessible label', () => {
      render(<FeedbackButton onClick={mockOnClick} />)
      const button = screen.getByRole('button')
      expect(button).toHaveAttribute('aria-label')
    })
  })

  describe('Click Handler', () => {
    it('should call onClick when clicked', () => {
      render(<FeedbackButton onClick={mockOnClick} />)
      fireEvent.click(screen.getByRole('button'))
      expect(mockOnClick).toHaveBeenCalledTimes(1)
    })
  })

  describe('Badge Display', () => {
    it('should not show badge when count is 0', () => {
      vi.mocked(trpc.feedback.getUnreadCount.useQuery).mockReturnValue({
        data: { count: 0 },
        isLoading: false,
      } as ReturnType<typeof trpc.feedback.getUnreadCount.useQuery>)

      render(<FeedbackButton onClick={mockOnClick} />)
      // Badge should not be visible
      expect(screen.queryByText('1')).not.toBeInTheDocument()
    })

    it('should show badge when count is greater than 0', () => {
      vi.mocked(trpc.feedback.getUnreadCount.useQuery).mockReturnValue({
        data: { count: 3 },
        isLoading: false,
      } as ReturnType<typeof trpc.feedback.getUnreadCount.useQuery>)

      render(<FeedbackButton onClick={mockOnClick} />)
      expect(screen.getByText('3')).toBeInTheDocument()
    })

    it('should show 99+ when count exceeds 99', () => {
      vi.mocked(trpc.feedback.getUnreadCount.useQuery).mockReturnValue({
        data: { count: 150 },
        isLoading: false,
      } as ReturnType<typeof trpc.feedback.getUnreadCount.useQuery>)

      render(<FeedbackButton onClick={mockOnClick} />)
      expect(screen.getByText('99+')).toBeInTheDocument()
    })

    it('should update aria-label based on count', () => {
      vi.mocked(trpc.feedback.getUnreadCount.useQuery).mockReturnValue({
        data: { count: 5 },
        isLoading: false,
      } as ReturnType<typeof trpc.feedback.getUnreadCount.useQuery>)

      render(<FeedbackButton onClick={mockOnClick} />)
      const button = screen.getByRole('button')
      expect(button.getAttribute('aria-label')).toContain('5')
    })
  })
})
