import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const addCommentMock = vi.fn()
const markCommentReadMock = vi.fn()

vi.mock('@scf/core/utils/api', () => ({
  api: {
    inquiries: {
      addComment: {
        useMutation: () => ({ mutateAsync: addCommentMock, isLoading: false }),
      },
      markCommentRead: {
        useMutation: () => ({ mutateAsync: markCommentReadMock, isLoading: false }),
      },
    },
  },
}))

vi.mock('@scf/core/utils/useUser', () => ({
  useUser: () => ({ user: { id: 'user-1' } }),
}))

vi.mock('@scaffald/ui', async () => {
  const actual = await vi.importActual('@scaffald/ui')
  return {
    ...actual,
    useToast: () => ({ show: vi.fn() }),
  }
})

vi.mock('react-native-reanimated/src/component/FlatList', () => ({
  default: () => null,
}))

vi.mock('@scf/core/utils/inquiries-sdk-hooks', () => ({
  useAddInquiryCommentMutation: () => ({
    mutateAsync: addCommentMock,
    isPending: false,
  }),
  useMarkCommentReadMutation: () => ({
    mutateAsync: markCommentReadMock,
    isPending: false,
  }),
}))

const { InquiryCommentThread } = await import('../InquiryCommentThread')

describe('InquiryCommentThread', () => {
  beforeEach(() => {
    addCommentMock.mockReset()
    markCommentReadMock.mockReset()
  })

  it('highlights unread comments from other participants', () => {
    render(
      <InquiryCommentThread
        inquiryId="inq-1"
        sectionName="employment"
        comments={[
          {
            id: 'comment-1',
            sender_id: 'user-2',
            content: 'Please confirm the schedule.',
            read_by: [],
            created_at: new Date().toISOString(),
          },
        ]}
      />
    )

    expect(screen.getByText('1 new comment')).toBeInTheDocument()
    expect(screen.getByText('Please confirm the schedule.')).toBeInTheDocument()
  })

  it('labels messages from the current user as "You"', () => {
    render(
      <InquiryCommentThread
        inquiryId="inq-1"
        sectionName="employment"
        comments={[
          {
            id: 'comment-2',
            sender_id: 'user-1',
            content: 'I can start on Monday.',
            read_by: ['user-2'],
            created_at: new Date().toISOString(),
          },
        ]}
      />
    )

    expect(screen.getByText('You')).toBeInTheDocument()
    expect(screen.getByText('I can start on Monday.')).toBeInTheDocument()
  })

  it('submits a new comment', async () => {
    render(<InquiryCommentThread inquiryId="inq-123" sectionName="employment" comments={[]} />)

    fireEvent.change(screen.getByPlaceholderText('Add a comment...'), {
      target: { value: 'Looking forward to it!' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Send' }))

    await waitFor(() => {
      expect(addCommentMock).toHaveBeenCalledWith({
        inquiryId: 'inq-123',
        sectionName: 'employment',
        content: 'Looking forward to it!',
      })
    })
  })

  it('marks comments as read when prompted', async () => {
    render(
      <InquiryCommentThread
        inquiryId="inq-2"
        sectionName="employment"
        comments={[
          {
            id: 'comment-3',
            sender_id: 'user-2',
            content: 'Can you confirm next week?',
            read_by: [],
            created_at: new Date().toISOString(),
          },
        ]}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: 'Mark as read' }))

    await waitFor(() => {
      expect(markCommentReadMock).toHaveBeenCalledWith({ commentId: 'comment-3' })
    })
  })
})
