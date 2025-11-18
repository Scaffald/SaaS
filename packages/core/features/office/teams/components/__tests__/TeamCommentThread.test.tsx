import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi, beforeEach } from 'vitest'

const mockUseQuery = vi.fn()
const mockUseMutation = vi.fn()
const mockShow = vi.fn()

vi.mock('@app/core/utils/api', () => ({
  api: {
    teams: {
      analytics: {
        comments: { useQuery: mockUseQuery },
        postComment: { useMutation: mockUseMutation },
      },
    },
  },
}))

vi.mock('@tamagui/toast', () => ({
  useToastController: () => ({ show: mockShow }),
}))

const { TeamCommentThread } = await import('../TeamCommentThread')

describe('TeamCommentThread', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseQuery.mockReturnValue({
      data: {
        comments: [
          {
            id: 'comment-1',
            body: 'Test comment',
            actorUserId: 'user-1',
            occurredAt: new Date().toISOString(),
          },
        ],
        nextCursor: null,
      },
      isLoading: false,
    })
    mockUseMutation.mockReturnValue({
      mutateAsync: vi.fn().mockResolvedValue({}),
      isPending: false,
    })
  })

  it('renders comments', () => {
    render(<TeamCommentThread teamId="team-1" />)

    expect(screen.getByText('Test comment')).toBeInTheDocument()
  })

  it('allows posting new comments', async () => {
    const user = userEvent.setup()
    render(<TeamCommentThread teamId="team-1" />)

    const commentInput = screen.getByPlaceholderText(/comment/i)
    await user.type(commentInput, 'New comment')
    
    const submitButton = screen.getByRole('button', { name: /post|submit/i })
    await user.click(submitButton)

    await waitFor(() => {
      expect(mockUseMutation).toHaveBeenCalled()
    })
  })

  it('shows loading state', () => {
    mockUseQuery.mockReturnValue({
      data: undefined,
      isLoading: true,
    })

    render(<TeamCommentThread teamId="team-1" />)

    expect(screen.getByText(/Loading/i)).toBeInTheDocument()
  })
})

