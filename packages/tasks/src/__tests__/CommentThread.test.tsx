/**
 * CommentThread Component Tests
 * REQ-288: Tamagui UI Component Library
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'

// Mock Tamagui before importing component
vi.mock('tamagui', async () => {
  const React = await import('react')
  return {
    styled: (_component: unknown, config: Record<string, unknown>) => {
      const StyledComponent = React.forwardRef<HTMLElement, Record<string, unknown>>(
        ({ children, onPress, ...props }, ref) => {
          const handleClick = (e: React.MouseEvent) => {
            if (onPress) (onPress as (e: unknown) => void)(e)
          }
          return React.createElement('div', { ref, onClick: handleClick, 'data-name': config.name, ...props }, children)
        }
      )
      StyledComponent.displayName = (config.name as string) || 'StyledComponent'
      return StyledComponent
    },
    YStack: ({ children, ...props }: Record<string, unknown>) => React.createElement('div', { 'data-testid': 'ystack', ...props }, children as React.ReactNode),
    XStack: ({ children, ...props }: Record<string, unknown>) => React.createElement('div', { 'data-testid': 'xstack', ...props }, children as React.ReactNode),
    View: ({ children, ...props }: Record<string, unknown>) => React.createElement('div', props, children as React.ReactNode),
    Text: ({ children, ...props }: Record<string, unknown>) => React.createElement('span', props, children as React.ReactNode),
    TextArea: React.forwardRef<HTMLTextAreaElement, { placeholder?: string; value?: string; onChangeText?: (text: string) => void }>(
      ({ placeholder, value, onChangeText, ...props }, ref) =>
        React.createElement('textarea', {
          ref,
          placeholder,
          value,
          onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => onChangeText?.(e.target.value),
          ...props,
        })
    ),
  }
})

// Mock lucide icons
vi.mock('@tamagui/lucide-icons', async () => {
  const React = await import('react')
  return {
    Send: () => React.createElement('svg', { 'data-testid': 'icon-send' }),
    MoreHorizontal: () => React.createElement('svg', { 'data-testid': 'icon-more' }),
    Reply: () => React.createElement('svg', { 'data-testid': 'icon-reply' }),
    Heart: () => React.createElement('svg', { 'data-testid': 'icon-heart' }),
  }
})

import { CommentThread, type Comment } from '../CommentThread'

const mockComments: Comment[] = [
  {
    id: '1',
    author: 'John Doe',
    content: 'This is a great feature!',
    createdAt: new Date().toISOString(),
    likes: 5,
    liked: false,
  },
  {
    id: '2',
    author: 'Jane Smith',
    content: 'I agree, very helpful.',
    createdAt: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
    likes: 2,
    liked: true,
    edited: true,
    replies: [
      {
        id: '3',
        author: 'Bob Wilson',
        content: 'Thanks for the feedback!',
        createdAt: new Date(Date.now() - 1800000).toISOString(), // 30 min ago
        likes: 1,
      },
    ],
  },
]

describe('CommentThread Component', () => {
  describe('Basic Rendering', () => {
    it('should render thread title', () => {
      render(<CommentThread comments={mockComments} />)

      expect(screen.getByText('Comments')).toBeInTheDocument()
    })

    it('should render custom title', () => {
      render(<CommentThread comments={mockComments} title="Discussion" />)

      expect(screen.getByText('Discussion')).toBeInTheDocument()
    })

    it('should render comment count', () => {
      render(<CommentThread comments={mockComments} />)

      // 2 top-level + 1 reply = 3 total
      expect(screen.getByText('3')).toBeInTheDocument()
    })

    it('should render all comments', () => {
      render(<CommentThread comments={mockComments} />)

      expect(screen.getByText('This is a great feature!')).toBeInTheDocument()
      expect(screen.getByText('I agree, very helpful.')).toBeInTheDocument()
    })
  })

  describe('Author Display', () => {
    it('should render author names', () => {
      render(<CommentThread comments={mockComments} />)

      expect(screen.getByText('John Doe')).toBeInTheDocument()
      expect(screen.getByText('Jane Smith')).toBeInTheDocument()
    })

    it('should render author initials as fallback avatar', () => {
      render(<CommentThread comments={mockComments} />)

      expect(screen.getByText('JD')).toBeInTheDocument() // John Doe
      expect(screen.getByText('JS')).toBeInTheDocument() // Jane Smith
    })
  })

  describe('Edited Badge', () => {
    it('should show edited badge for edited comments', () => {
      render(<CommentThread comments={mockComments} />)

      expect(screen.getByText('(edited)')).toBeInTheDocument()
    })
  })

  describe('Likes', () => {
    it('should display like count', () => {
      render(<CommentThread comments={mockComments} />)

      expect(screen.getByText('5 likes')).toBeInTheDocument()
      expect(screen.getByText('2 likes')).toBeInTheDocument()
    })

    it('should display singular like for 1 like', () => {
      render(<CommentThread comments={mockComments} />)

      expect(screen.getByText('1 like')).toBeInTheDocument()
    })

    it('should call onLike when like button is clicked', () => {
      const onLike = vi.fn()
      render(<CommentThread comments={mockComments} onLike={onLike} />)

      const heartIcons = screen.getAllByTestId('icon-heart')
      fireEvent.click(heartIcons[0])

      expect(onLike).toHaveBeenCalled()
    })
  })

  describe('Replies', () => {
    it('should render nested replies', () => {
      render(<CommentThread comments={mockComments} />)

      expect(screen.getByText('Thanks for the feedback!')).toBeInTheDocument()
      expect(screen.getByText('Bob Wilson')).toBeInTheDocument()
    })

    it('should show reply buttons', () => {
      render(<CommentThread comments={mockComments} />)

      const replyButtons = screen.getAllByText('Reply')
      expect(replyButtons.length).toBeGreaterThan(0)
    })
  })

  describe('Input Field', () => {
    it('should show input field by default', () => {
      render(<CommentThread comments={mockComments} />)

      expect(screen.getByPlaceholderText('Write a comment...')).toBeInTheDocument()
    })

    it('should hide input when showInput is false', () => {
      render(<CommentThread comments={mockComments} showInput={false} />)

      expect(screen.queryByPlaceholderText('Write a comment...')).not.toBeInTheDocument()
    })

    it('should show custom placeholder', () => {
      render(<CommentThread comments={mockComments} placeholder="Add your thoughts..." />)

      expect(screen.getByPlaceholderText('Add your thoughts...')).toBeInTheDocument()
    })

    it('should show send icon', () => {
      render(<CommentThread comments={mockComments} />)

      expect(screen.getByTestId('icon-send')).toBeInTheDocument()
    })
  })

  describe('Current User', () => {
    it('should show current user initials in input', () => {
      render(<CommentThread comments={mockComments} currentUser="Alice Brown" />)

      expect(screen.getByText('AB')).toBeInTheDocument()
    })

    it('should show default user initials', () => {
      render(<CommentThread comments={mockComments} />)

      expect(screen.getByText('Y')).toBeInTheDocument() // "You"
    })
  })

  describe('Empty State', () => {
    it('should show empty state when no comments', () => {
      render(<CommentThread comments={[]} />)

      expect(screen.getByText('No comments yet. Be the first to comment!')).toBeInTheDocument()
    })

    it('should still show input in empty state', () => {
      render(<CommentThread comments={[]} />)

      expect(screen.getByPlaceholderText('Write a comment...')).toBeInTheDocument()
    })
  })

  describe('Actions', () => {
    it('should show more options icon', () => {
      render(<CommentThread comments={mockComments} />)

      const moreIcons = screen.getAllByTestId('icon-more')
      expect(moreIcons.length).toBeGreaterThan(0)
    })

    it('should show reply icon', () => {
      render(<CommentThread comments={mockComments} />)

      const replyIcons = screen.getAllByTestId('icon-reply')
      expect(replyIcons.length).toBeGreaterThan(0)
    })
  })

  describe('Single Comment', () => {
    it('should render single comment correctly', () => {
      const singleComment: Comment[] = [
        {
          id: '1',
          author: 'Single User',
          content: 'Only comment here',
          createdAt: new Date().toISOString(),
        },
      ]
      render(<CommentThread comments={singleComment} />)

      expect(screen.getByText('Single User')).toBeInTheDocument()
      expect(screen.getByText('Only comment here')).toBeInTheDocument()
      expect(screen.getByText('1')).toBeInTheDocument() // count
    })
  })
})
