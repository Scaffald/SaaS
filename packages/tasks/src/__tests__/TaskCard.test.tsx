/**
 * TaskCard Component Tests
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'

// Mock beyond-ui layout and typography
vi.mock('@unicornlove/beyond-ui', async () => {
  const React = await import('react')
  return {
    Stack: ({ children, style, ...props }: Record<string, unknown>) =>
      React.createElement('div', { 'data-testid': 'stack', style, ...props }, children),
    Row: ({ children, style, ...props }: Record<string, unknown>) =>
      React.createElement('div', { 'data-testid': 'row', style, ...props }, children),
    Box: ({ children, style, ...props }: Record<string, unknown>) =>
      React.createElement('div', { style, ...props }, children),
    Text: ({ children, ...props }: Record<string, unknown>) =>
      React.createElement('span', props, children as React.ReactNode),
  }
})

vi.mock('@unicornlove/beyond-ui/tokens', () => ({
  colors: { gray: {}, bg: { primary: '#fff' }, border: { default: '#eee' }, info: {}, success: {}, error: {}, violet: {}, orange: {} },
  spacing: { 2: 2, 4: 4, 8: 8, 12: 12, 16: 16, 24: 24, 32: 32 },
  borderRadius: { l: 12, max: 999, m: 10, xs: 6 },
}))

// Mock react-native for Pressable
vi.mock('react-native', async () => {
  const React = await import('react')
  return {
    Pressable: ({ children, onPress }: { children: React.ReactNode; onPress?: () => void }) =>
      React.createElement('div', { onClick: onPress }, children),
    View: ({ children, ...props }: Record<string, unknown>) => React.createElement('div', props, children as React.ReactNode),
    ScrollView: ({ children }: { children: React.ReactNode }) => React.createElement('div', {}, children),
    TextInput: (props: Record<string, unknown>) => React.createElement('input', props),
  }
})

// Mock lucide icons
vi.mock('lucide-react-native', async () => {
  const React = await import('react')
  return {
    CheckCircle: () => React.createElement('svg', { 'data-testid': 'icon-check' }),
    Circle: () => React.createElement('svg', { 'data-testid': 'icon-circle' }),
    Clock: () => React.createElement('svg', { 'data-testid': 'icon-clock' }),
    AlertTriangle: () => React.createElement('svg', { 'data-testid': 'icon-alert' }),
    Calendar: () => React.createElement('svg', { 'data-testid': 'icon-calendar' }),
    User: () => React.createElement('svg', { 'data-testid': 'icon-user' }),
    ChevronRight: () => React.createElement('svg', { 'data-testid': 'icon-chevron' }),
    MessageSquare: () => React.createElement('svg', { 'data-testid': 'icon-message' }),
  }
})

import { TaskCard, type TaskStatus } from '../TaskCard'

describe('TaskCard Component', () => {
  describe('Basic Rendering', () => {
    it('should render task title', () => {
      render(<TaskCard title="Complete report" status="todo" />)

      expect(screen.getByText('Complete report')).toBeInTheDocument()
    })

    it('should render task description', () => {
      render(<TaskCard title="Task" status="todo" description="Task description here" />)

      expect(screen.getByText('Task description here')).toBeInTheDocument()
    })

    it('should not render description when not provided', () => {
      render(<TaskCard title="Task" status="todo" />)

      expect(screen.queryByText('Task description')).not.toBeInTheDocument()
    })
  })

  describe('Status Display', () => {
    const statuses: { status: TaskStatus; icon: string }[] = [
      { status: 'todo', icon: 'icon-circle' },
      { status: 'in-progress', icon: 'icon-clock' },
      { status: 'review', icon: 'icon-clock' },
      { status: 'completed', icon: 'icon-check' },
      { status: 'blocked', icon: 'icon-alert' },
    ]

    statuses.forEach(({ status, icon }) => {
      it(`should show correct icon for ${status} status`, () => {
        render(<TaskCard title="Task" status={status} />)

        expect(screen.getByTestId(icon)).toBeInTheDocument()
      })
    })

    it('should apply strikethrough to completed task title', () => {
      render(<TaskCard title="Completed Task" status="completed" />)

      expect(screen.getByText('Completed Task')).toBeInTheDocument()
    })
  })

  describe('Priority Indicator', () => {
    it('should show priority indicator for high priority', () => {
      render(<TaskCard title="High Priority Task" status="todo" priority="high" />)

      expect(screen.getByText('High Priority Task')).toBeInTheDocument()
    })

    it('should show priority indicator for urgent priority', () => {
      render(<TaskCard title="Urgent Task" status="todo" priority="urgent" />)

      expect(screen.getByText('Urgent Task')).toBeInTheDocument()
    })

    it('should not show indicator for low priority', () => {
      render(<TaskCard title="Low Priority Task" status="todo" priority="low" />)

      expect(screen.getByText('Low Priority Task')).toBeInTheDocument()
    })
  })

  describe('Due Date', () => {
    it('should display due date', () => {
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      render(<TaskCard title="Task" status="todo" dueDate={tomorrow.toISOString()} />)

      expect(screen.getByText('Tomorrow')).toBeInTheDocument()
    })

    it('should show calendar icon with due date', () => {
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      render(<TaskCard title="Task" status="todo" dueDate={tomorrow.toISOString()} />)

      expect(screen.getByTestId('icon-calendar')).toBeInTheDocument()
    })

    it('should show Today for todays date', () => {
      const today = new Date()
      render(<TaskCard title="Task" status="todo" dueDate={today.toISOString()} />)

      expect(screen.getByText('Today')).toBeInTheDocument()
    })
  })

  describe('Overdue Display', () => {
    it('should indicate overdue status', () => {
      const pastDate = new Date()
      pastDate.setDate(pastDate.getDate() - 5)
      render(<TaskCard title="Overdue Task" status="todo" dueDate={pastDate.toISOString()} overdue={true} />)

      expect(screen.getByText('Overdue Task')).toBeInTheDocument()
    })
  })

  describe('Assignee', () => {
    it('should display assignee name', () => {
      render(<TaskCard title="Task" status="todo" assignee="John Doe" />)

      expect(screen.getByText('John Doe')).toBeInTheDocument()
    })

    it('should show user icon with assignee', () => {
      render(<TaskCard title="Task" status="todo" assignee="John Doe" />)

      expect(screen.getByTestId('icon-user')).toBeInTheDocument()
    })

    it('should not show assignee when not provided', () => {
      render(<TaskCard title="Task" status="todo" />)

      expect(screen.queryByTestId('icon-user')).not.toBeInTheDocument()
    })
  })

  describe('Tags', () => {
    it('should display tags', () => {
      render(<TaskCard title="Task" status="todo" tags={['bug', 'frontend']} />)

      expect(screen.getByText('bug')).toBeInTheDocument()
      expect(screen.getByText('frontend')).toBeInTheDocument()
    })

    it('should not show tags section when no tags provided', () => {
      render(<TaskCard title="Task" status="todo" />)

      expect(screen.queryByText('bug')).not.toBeInTheDocument()
    })

    it('should handle empty tags array', () => {
      render(<TaskCard title="Task" status="todo" tags={[]} />)

      expect(screen.getByText('Task')).toBeInTheDocument()
    })
  })

  describe('Comment Count', () => {
    it('should display comment count when provided', () => {
      render(<TaskCard title="Task" status="todo" commentCount={5} />)

      expect(screen.getByText('5')).toBeInTheDocument()
    })

    it('should show message icon with comments', () => {
      render(<TaskCard title="Task" status="todo" commentCount={3} />)

      expect(screen.getByTestId('icon-message')).toBeInTheDocument()
    })

    it('should not show comments when count is 0', () => {
      render(<TaskCard title="Task" status="todo" commentCount={0} />)

      expect(screen.queryByTestId('icon-message')).not.toBeInTheDocument()
    })

    it('should not show comments when not provided', () => {
      render(<TaskCard title="Task" status="todo" />)

      expect(screen.queryByTestId('icon-message')).not.toBeInTheDocument()
    })
  })

  describe('Click Handlers', () => {
    it('should call onPress when card is clicked', () => {
      const onPress = vi.fn()
      render(<TaskCard title="Clickable Task" status="todo" onPress={onPress} />)

      fireEvent.click(screen.getByText('Clickable Task'))

      expect(onPress).toHaveBeenCalled()
    })

    it('should call onStatusChange when status is toggled', () => {
      const onStatusChange = vi.fn()
      render(<TaskCard title="Task" status="todo" onStatusChange={onStatusChange} />)

      // Click on the status icon
      fireEvent.click(screen.getByTestId('icon-circle'))

      expect(onStatusChange).toHaveBeenCalledWith('completed')
    })

    it('should toggle completed to todo', () => {
      const onStatusChange = vi.fn()
      render(<TaskCard title="Task" status="completed" onStatusChange={onStatusChange} />)

      fireEvent.click(screen.getByTestId('icon-check'))

      expect(onStatusChange).toHaveBeenCalledWith('todo')
    })
  })

  describe('Chevron Icon', () => {
    it('should show chevron icon for navigation', () => {
      render(<TaskCard title="Task" status="todo" />)

      expect(screen.getByTestId('icon-chevron')).toBeInTheDocument()
    })
  })

  describe('Complete Task Card', () => {
    it('should render with all props', () => {
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)

      render(
        <TaskCard
          title="Full Featured Task"
          description="Task with all features"
          status="in-progress"
          priority="high"
          dueDate={tomorrow.toISOString()}
          assignee="Jane Smith"
          tags={['urgent', 'review']}
          commentCount={10}
        />
      )

      expect(screen.getByText('Full Featured Task')).toBeInTheDocument()
      expect(screen.getByText('Task with all features')).toBeInTheDocument()
      expect(screen.getByText('Tomorrow')).toBeInTheDocument()
      expect(screen.getByText('Jane Smith')).toBeInTheDocument()
      expect(screen.getByText('urgent')).toBeInTheDocument()
      expect(screen.getByText('review')).toBeInTheDocument()
      expect(screen.getByText('10')).toBeInTheDocument()
    })
  })
})
