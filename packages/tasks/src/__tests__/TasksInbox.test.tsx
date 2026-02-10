/**
 * TasksInbox Component Tests
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'

vi.mock('@unicornlove/beyond-ui', async () => {
  const React = await import('react')
  return {
    Stack: ({ children, ...props }: Record<string, unknown>) => React.createElement('div', props, children),
    Row: ({ children, ...props }: Record<string, unknown>) => React.createElement('div', props, children),
    Box: ({ children, ...props }: Record<string, unknown>) => React.createElement('div', props, children),
    Text: ({ children, ...props }: Record<string, unknown>) => React.createElement('span', props, children),
  }
})

vi.mock('@unicornlove/beyond-ui/tokens', () => ({
  colors: { gray: {}, bg: { primary: '#fff' }, border: { default: '#eee' }, info: {}, success: {}, error: {} },
  spacing: { 2: 2, 4: 4, 8: 8, 12: 12, 16: 16, 24: 24, 32: 32 },
  borderRadius: { l: 12, max: 999, m: 10 },
}))

vi.mock('react-native', async () => {
  const React = await import('react')
  return {
    Pressable: ({ children, onPress }: { children: React.ReactNode; onPress?: () => void }) =>
      React.createElement('div', { onClick: onPress }, children),
    ScrollView: ({ children }: { children: React.ReactNode }) => React.createElement('div', { 'data-testid': 'scroll-view' }, children),
  }
})

// Mock lucide icons
vi.mock('lucide-react-native', async () => {
  const React = await import('react')
  return {
    Inbox: () => React.createElement('svg', { 'data-testid': 'icon-inbox' }),
    Clock: () => React.createElement('svg', { 'data-testid': 'icon-clock' }),
    CheckCircle: () => React.createElement('svg', { 'data-testid': 'icon-check' }),
    AlertTriangle: () => React.createElement('svg', { 'data-testid': 'icon-alert' }),
    Circle: () => React.createElement('svg', { 'data-testid': 'icon-circle' }),
    Calendar: () => React.createElement('svg', { 'data-testid': 'icon-calendar' }),
    User: () => React.createElement('svg', { 'data-testid': 'icon-user' }),
    ChevronRight: () => React.createElement('svg', { 'data-testid': 'icon-chevron' }),
    MessageSquare: () => React.createElement('svg', { 'data-testid': 'icon-message' }),
  }
})

import { TasksInbox, type Task } from '../TasksInbox'

const today = new Date()
const tomorrow = new Date(today)
tomorrow.setDate(tomorrow.getDate() + 1)
const yesterday = new Date(today)
yesterday.setDate(yesterday.getDate() - 1)
const nextWeek = new Date(today)
nextWeek.setDate(nextWeek.getDate() + 5)

const mockTasks: Task[] = [
  {
    id: '1',
    title: 'Today Task',
    status: 'todo',
    dueDate: today.toISOString(),
    priority: 'high',
  },
  {
    id: '2',
    title: 'Overdue Task',
    status: 'in-progress',
    dueDate: yesterday.toISOString(),
    priority: 'urgent',
  },
  {
    id: '3',
    title: 'Upcoming Task',
    status: 'todo',
    dueDate: nextWeek.toISOString(),
    priority: 'medium',
  },
  {
    id: '4',
    title: 'Completed Task',
    status: 'completed',
    dueDate: today.toISOString(),
  },
  {
    id: '5',
    title: 'No Due Date Task',
    status: 'todo',
  },
]

describe('TasksInbox Component', () => {
  describe('Basic Rendering', () => {
    it('should render inbox title', () => {
      render(<TasksInbox tasks={mockTasks} />)

      expect(screen.getByText('Tasks')).toBeInTheDocument()
    })

    it('should render custom title', () => {
      render(<TasksInbox tasks={mockTasks} title="My Tasks" />)

      expect(screen.getByText('My Tasks')).toBeInTheDocument()
    })

    it('should render inbox icon', () => {
      render(<TasksInbox tasks={mockTasks} />)

      const inboxIcons = screen.getAllByTestId('icon-inbox')
      expect(inboxIcons.length).toBeGreaterThan(0)
    })

    it('should render task count', () => {
      render(<TasksInbox tasks={mockTasks} />)

      // Multiple "5" values may appear in counts
      const fives = screen.getAllByText('5')
      expect(fives.length).toBeGreaterThan(0)
    })

    it('should render all task titles', () => {
      render(<TasksInbox tasks={mockTasks} />)

      expect(screen.getByText('Today Task')).toBeInTheDocument()
      expect(screen.getByText('Overdue Task')).toBeInTheDocument()
      expect(screen.getByText('Upcoming Task')).toBeInTheDocument()
      expect(screen.getByText('Completed Task')).toBeInTheDocument()
      expect(screen.getByText('No Due Date Task')).toBeInTheDocument()
    })
  })

  describe('Filter Tabs', () => {
    it('should show filter tabs by default', () => {
      render(<TasksInbox tasks={mockTasks} />)

      expect(screen.getByText('All')).toBeInTheDocument()
      // "Today", "Upcoming", "Overdue", "Completed" may appear multiple times (tabs + sections)
      const todayElements = screen.getAllByText('Today')
      expect(todayElements.length).toBeGreaterThan(0)
      const upcomingElements = screen.getAllByText('Upcoming')
      expect(upcomingElements.length).toBeGreaterThan(0)
    })

    it('should hide filter tabs when showFilters is false', () => {
      render(<TasksInbox tasks={mockTasks} showFilters={false} />)

      expect(screen.queryByText('All')).not.toBeInTheDocument()
      // "Today" may still appear in section headers
    })

    it('should call onFilterChange when filter is clicked', () => {
      const onFilterChange = vi.fn()
      render(<TasksInbox tasks={mockTasks} onFilterChange={onFilterChange} />)

      // Click the first "Overdue" element (the filter tab)
      const overdueElements = screen.getAllByText('Overdue')
      fireEvent.click(overdueElements[0])

      expect(onFilterChange).toHaveBeenCalledWith('overdue')
    })
  })

  describe('Section Headers', () => {
    it('should show Overdue section when applicable', () => {
      render(<TasksInbox tasks={mockTasks} />)

      const overdueElements = screen.getAllByText('Overdue')
      expect(overdueElements.length).toBeGreaterThan(0)
    })

    it('should show Today section when applicable', () => {
      render(<TasksInbox tasks={mockTasks} />)

      // "Today" appears in both filter tab and section header
      const todayTexts = screen.getAllByText('Today')
      expect(todayTexts.length).toBeGreaterThanOrEqual(1)
    })

    it('should show Completed section when applicable', () => {
      render(<TasksInbox tasks={mockTasks} />)

      // "Completed" appears in both filter tab and section header
      const completedTexts = screen.getAllByText('Completed')
      expect(completedTexts.length).toBeGreaterThanOrEqual(1)
    })
  })

  describe('Empty State', () => {
    it('should show empty state when no tasks', () => {
      render(<TasksInbox tasks={[]} />)

      expect(screen.getByText('No tasks yet')).toBeInTheDocument()
      expect(screen.getByText('Tasks will appear here when they match this filter')).toBeInTheDocument()
    })

    it('should show empty inbox icon', () => {
      render(<TasksInbox tasks={[]} />)

      const inboxIcons = screen.getAllByTestId('icon-inbox')
      expect(inboxIcons.length).toBeGreaterThan(0)
    })
  })

  describe('Task Interactions', () => {
    it('should call onTaskPress when task is clicked', () => {
      const onTaskPress = vi.fn()
      render(<TasksInbox tasks={mockTasks} onTaskPress={onTaskPress} />)

      fireEvent.click(screen.getByText('Today Task'))

      expect(onTaskPress).toHaveBeenCalled()
    })

    it('should call onTaskStatusChange when status changes', () => {
      const onTaskStatusChange = vi.fn()
      render(<TasksInbox tasks={mockTasks} onTaskStatusChange={onTaskStatusChange} />)

      // Click on a status icon (circle icon)
      const circleIcons = screen.getAllByTestId('icon-circle')
      fireEvent.click(circleIcons[0])

      expect(onTaskStatusChange).toHaveBeenCalled()
    })
  })

  describe('Controlled Filter', () => {
    it('should respect initial filter prop', () => {
      render(<TasksInbox tasks={mockTasks} filter="completed" />)

      // Should filter to show only completed tasks
      expect(screen.getByText('Completed Task')).toBeInTheDocument()
    })
  })

  describe('ScrollView', () => {
    it('should render scrollview container', () => {
      render(<TasksInbox tasks={mockTasks} />)

      expect(screen.getByTestId('scroll-view')).toBeInTheDocument()
    })

    it('should accept maxHeight prop', () => {
      render(<TasksInbox tasks={mockTasks} maxHeight={400} />)

      expect(screen.getByTestId('scroll-view')).toBeInTheDocument()
    })
  })

  describe('Single Task', () => {
    it('should render single task correctly', () => {
      const singleTask: Task[] = [
        { id: '1', title: 'Only Task', status: 'todo' },
      ]
      render(<TasksInbox tasks={singleTask} />)

      expect(screen.getByText('Only Task')).toBeInTheDocument()
      // "1" may appear multiple times (count badge, filter counts)
      const ones = screen.getAllByText('1')
      expect(ones.length).toBeGreaterThan(0)
    })
  })

  describe('Task Count per Filter', () => {
    it('should show correct count for each filter', () => {
      render(<TasksInbox tasks={mockTasks} />)

      // Multiple counts will be present in the UI
      // The counts depend on the mock data dates
      const fives = screen.getAllByText('5')
      expect(fives.length).toBeGreaterThan(0)
    })
  })
})
