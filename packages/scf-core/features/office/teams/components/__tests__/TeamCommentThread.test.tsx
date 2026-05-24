import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { TestQueryWrapper } from '@test-helpers/test-utils'

const mockUseQuery = vi.fn()
const mockUseMutation = vi.fn()
const mockShow = vi.fn()
const mockUseUtils = vi.fn(() => ({
  teams: {
    analytics: {
      comments: { invalidate: vi.fn() },
    },
  },
}))

// Component now uses teams-sdk-hooks + react-query useQueryClient.
vi.mock('@scf/core/utils/teams-sdk-hooks', () => ({
  useTeamComments: (...args: unknown[]) => mockUseQuery(...args),
  usePostTeamCommentMutation: (...args: unknown[]) => mockUseMutation(...args),
}))

vi.mock('@tanstack/react-query', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@tanstack/react-query')>()
  return {
    ...actual,
    useQueryClient: () => mockUseUtils(),
  }
})

// Single merged @scaffald/ui mock — duplicate vi.mock calls would clobber.
vi.mock('@scaffald/ui', async () => {
  const actual = await vi.importActual('@scaffald/ui')

  const Stack = ({ children }: { children?: ReactNode }) => <div>{children}</div>
  const Text = ({ children }: { children?: ReactNode }) => <span>{children}</span>
  const Button = ({ children, onPress }: { children?: ReactNode; onPress?: () => void }) => (
    <button type="button" onClick={onPress}>
      {children}
    </button>
  )
  const TextArea = ({
    value,
    onChangeText,
    placeholder,
  }: {
    value?: string
    onChangeText?: (text: string) => void
    placeholder?: string
  }) => (
    <textarea
      value={value || ''}
      onChange={(e) => onChangeText?.(e.target.value)}
      placeholder={placeholder}
    />
  )
  const Card = ({ children }: { children?: ReactNode }) => <div>{children}</div>
  const Spinner = () => <span>Loading</span>

  return {
    ...actual,
    Theme: ({ children }: { children: ReactNode }) => <div>{children}</div>,
    Stack: Stack,
    Row: Stack,
    Text,
    Button,
    TextArea,
    Card,
    Spinner,
    useMedia: () => ({ sm: false }),
    useToast: () => ({ show: mockShow }),
  }
})

vi.mock('lucide-react-native', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  MessageCircle: () => <span data-testid="message-circle-icon">MessageCircle</span>,
  Send: () => <span data-testid="send-icon">Send</span>,
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
    render(<TeamCommentThread teamId="team-1" />, { wrapper: TestQueryWrapper })

    expect(screen.getByText('Test comment')).toBeInTheDocument()
  })

  it('allows posting new comments', async () => {
    const user = userEvent.setup()
    render(<TeamCommentThread teamId="team-1" />, { wrapper: TestQueryWrapper })

    const commentInput = screen.getByPlaceholderText(/add a comment/i)
    await user.type(commentInput, 'New comment')

    const submitButton = screen.getByText(/post comment/i)
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

    render(<TeamCommentThread teamId="team-1" />, { wrapper: TestQueryWrapper })

    expect(screen.getByText(/Loading discussion/i)).toBeInTheDocument()
  })
})
