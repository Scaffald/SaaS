/**
 * AdminFeedbackHeader Component Tests
 * Tests the admin header icon with badge
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, renderWithoutRouter } from '@/test/test-utils'
import { MemoryRouter } from 'react-router-dom'

// Mock react-router-dom
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

// Mock tRPC
vi.mock('../../../lib/trpc', () => ({
  trpc: {
    feedback: {
      admin: {
        getStats: {
          useQuery: vi.fn(() => ({
            data: { totalBadge: 0 },
            isLoading: false,
          })),
        },
      },
    },
  },
}))

import { AdminFeedbackHeader } from '../AdminFeedbackHeader'
import { trpc } from '../../../lib/trpc'

const renderComponent = (component: React.ReactNode) => {
  return renderWithoutRouter(<MemoryRouter>{component}</MemoryRouter>)
}

describe('AdminFeedbackHeader', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Rendering', () => {
    it('should render the button', () => {
      renderComponent(<AdminFeedbackHeader />)
      expect(screen.getByRole('button')).toBeInTheDocument()
    })

    it('should have accessible label', () => {
      renderComponent(<AdminFeedbackHeader />)
      const button = screen.getByRole('button')
      expect(button).toHaveAttribute('aria-label')
    })
  })

  describe('Navigation', () => {
    it('should navigate to /admin/feedback on click', () => {
      renderComponent(<AdminFeedbackHeader />)
      fireEvent.click(screen.getByRole('button'))
      expect(mockNavigate).toHaveBeenCalledWith('/admin/feedback')
    })
  })

  describe('Badge Display', () => {
    it('should not show badge when count is 0', () => {
      vi.mocked(trpc.feedback.admin.getStats.useQuery).mockReturnValue({
        data: { totalBadge: 0 },
        isLoading: false,
      } as ReturnType<typeof trpc.feedback.admin.getStats.useQuery>)

      renderComponent(<AdminFeedbackHeader />)
      expect(screen.queryByText('1')).not.toBeInTheDocument()
    })

    it('should show badge when count is greater than 0', () => {
      vi.mocked(trpc.feedback.admin.getStats.useQuery).mockReturnValue({
        data: { totalBadge: 5 },
        isLoading: false,
      } as ReturnType<typeof trpc.feedback.admin.getStats.useQuery>)

      renderComponent(<AdminFeedbackHeader />)
      expect(screen.getByText('5')).toBeInTheDocument()
    })

    it('should show 99+ when count exceeds 99', () => {
      vi.mocked(trpc.feedback.admin.getStats.useQuery).mockReturnValue({
        data: { totalBadge: 120 },
        isLoading: false,
      } as ReturnType<typeof trpc.feedback.admin.getStats.useQuery>)

      renderComponent(<AdminFeedbackHeader />)
      expect(screen.getByText('99+')).toBeInTheDocument()
    })

    it('should update aria-label based on count', () => {
      vi.mocked(trpc.feedback.admin.getStats.useQuery).mockReturnValue({
        data: { totalBadge: 7 },
        isLoading: false,
      } as ReturnType<typeof trpc.feedback.admin.getStats.useQuery>)

      renderComponent(<AdminFeedbackHeader />)
      const button = screen.getByRole('button')
      expect(button.getAttribute('aria-label')).toContain('7')
    })
  })
})
