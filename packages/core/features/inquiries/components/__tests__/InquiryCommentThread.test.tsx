import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { InquiryCommentThread } from '../InquiryCommentThread'

vi.mock('@app/core/utils/api', () => ({
  api: {
    inquiries: {
      addComment: {
        useMutation: () => ({ mutateAsync: vi.fn(), isLoading: false }),
      },
      markCommentRead: {
        useMutation: () => ({ mutateAsync: vi.fn(), isLoading: false }),
      },
    },
  },
}))

vi.mock('@app/core/utils/useUser', () => ({
  useUser: () => ({ user: { id: 'user-1' } }),
}))

describe('InquiryCommentThread', () => {
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
})
