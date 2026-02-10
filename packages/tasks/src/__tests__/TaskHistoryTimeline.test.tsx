/**
 * TaskHistoryTimeline Component Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
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
  colors: { gray: {}, border: { default: '#eee' }, info: {}, success: {}, error: {}, warning: {}, violet: {}, orange: {} },
  spacing: { 4: 4, 8: 8, 12: 12, 16: 16 },
  borderRadius: { max: 999, xs: 6 },
}))

vi.mock('react-native', async () => {
  const React = await import('react')
  return {
    Pressable: ({ children, onPress }: { children: React.ReactNode; onPress?: () => void }) =>
      React.createElement('div', { onClick: onPress }, children),
    View: ({ children, ...props }: Record<string, unknown>) => React.createElement('div', props, children),
  }
})

// Mock lucide icons
vi.mock('lucide-react-native', () => ({
  CheckCircle: () => null,
  Circle: () => null,
  Clock: () => null,
  MessageSquare: () => null,
  FileText: () => null,
  User: () => null,
  Edit3: () => null,
  ArrowRight: () => null,
}))

import { TaskHistoryTimeline, type HistoryEvent, type HistoryEventType } from '../TaskHistoryTimeline'

describe('TaskHistoryTimeline Component', () => {
  const mockEvents: HistoryEvent[] = [
    {
      id: '1',
      type: 'created',
      timestamp: new Date().toISOString(),
      user: { name: 'John Doe' },
      description: 'Created the task',
    },
    {
      id: '2',
      type: 'status_change',
      timestamp: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
      user: { name: 'Jane Smith' },
      description: 'Changed status',
      metadata: { oldValue: 'To Do', newValue: 'In Progress' },
    },
    {
      id: '3',
      type: 'comment',
      timestamp: new Date(Date.now() - 7200000).toISOString(), // 2 hours ago
      user: { name: 'Bob Wilson' },
      description: 'Added a comment',
    },
  ]

  describe('Basic Rendering', () => {
    it('should render all events', () => {
      render(<TaskHistoryTimeline events={mockEvents} />)

      expect(screen.getByText('John Doe')).toBeInTheDocument()
      expect(screen.getByText('Jane Smith')).toBeInTheDocument()
      expect(screen.getByText('Bob Wilson')).toBeInTheDocument()
    })

    it('should render event descriptions', () => {
      render(<TaskHistoryTimeline events={mockEvents} />)

      expect(screen.getByText('Created the task')).toBeInTheDocument()
      expect(screen.getByText('Changed status')).toBeInTheDocument()
      expect(screen.getByText('Added a comment')).toBeInTheDocument()
    })

    it('should render empty when no events provided', () => {
      const { container } = render(<TaskHistoryTimeline events={[]} />)

      // Should render the container but with no event items
      expect(container.firstChild).toBeInTheDocument()
    })
  })

  describe('Event Types', () => {
    const eventTypes: HistoryEventType[] = [
      'created',
      'status_change',
      'assigned',
      'comment',
      'attachment',
      'edited',
      'due_date_change',
    ]

    eventTypes.forEach((type) => {
      it(`should render "${type}" event type correctly`, () => {
        const event: HistoryEvent = {
          id: '1',
          type,
          timestamp: new Date().toISOString(),
          user: { name: 'Test User' },
          description: `${type} event`,
        }

        render(<TaskHistoryTimeline events={[event]} />)

        expect(screen.getByText('Test User')).toBeInTheDocument()
        expect(screen.getByText(`${type} event`)).toBeInTheDocument()
      })
    })
  })

  describe('Metadata Display', () => {
    it('should render old and new values for status changes', () => {
      const events: HistoryEvent[] = [
        {
          id: '1',
          type: 'status_change',
          timestamp: new Date().toISOString(),
          user: { name: 'User' },
          description: 'Status changed',
          metadata: { oldValue: 'Open', newValue: 'Closed' },
        },
      ]

      render(<TaskHistoryTimeline events={events} />)

      expect(screen.getByText('Open')).toBeInTheDocument()
      expect(screen.getByText('Closed')).toBeInTheDocument()
    })

    it('should render only new value when old value is not provided', () => {
      const events: HistoryEvent[] = [
        {
          id: '1',
          type: 'edited',
          timestamp: new Date().toISOString(),
          user: { name: 'User' },
          description: 'Field updated',
          metadata: { newValue: 'New Value' },
        },
      ]

      render(<TaskHistoryTimeline events={events} />)

      expect(screen.getByText('New Value')).toBeInTheDocument()
    })

    it('should not render metadata section when no metadata provided', () => {
      const events: HistoryEvent[] = [
        {
          id: '1',
          type: 'comment',
          timestamp: new Date().toISOString(),
          user: { name: 'User' },
          description: 'Just a comment',
        },
      ]

      render(<TaskHistoryTimeline events={events} />)

      // The description should be there but no metadata values
      expect(screen.getByText('Just a comment')).toBeInTheDocument()
    })
  })

  describe('Max Visible Events', () => {
    const manyEvents: HistoryEvent[] = Array.from({ length: 10 }, (_, i) => ({
      id: String(i + 1),
      type: 'comment' as HistoryEventType,
      timestamp: new Date(Date.now() - i * 3600000).toISOString(),
      user: { name: `User ${i + 1}` },
      description: `Event ${i + 1}`,
    }))

    it('should only show maxVisible events by default', () => {
      render(<TaskHistoryTimeline events={manyEvents} maxVisible={3} />)

      expect(screen.getByText('User 1')).toBeInTheDocument()
      expect(screen.getByText('User 2')).toBeInTheDocument()
      expect(screen.getByText('User 3')).toBeInTheDocument()
      expect(screen.queryByText('User 4')).not.toBeInTheDocument()
    })

    it('should show "Show more" button when there are hidden events', () => {
      render(<TaskHistoryTimeline events={manyEvents} maxVisible={3} />)

      expect(screen.getByText('Show 7 more events')).toBeInTheDocument()
    })

    it('should show all events when "Show more" is clicked', () => {
      render(<TaskHistoryTimeline events={manyEvents} maxVisible={3} />)

      fireEvent.click(screen.getByText('Show 7 more events'))

      expect(screen.getByText('User 10')).toBeInTheDocument()
    })

    it('should not show "Show more" button when all events are visible', () => {
      render(<TaskHistoryTimeline events={manyEvents.slice(0, 3)} maxVisible={5} />)

      expect(screen.queryByText(/Show \d+ more events/)).not.toBeInTheDocument()
    })

    it('should use default maxVisible of 5', () => {
      render(<TaskHistoryTimeline events={manyEvents} />)

      expect(screen.getByText('User 5')).toBeInTheDocument()
      expect(screen.queryByText('User 6')).not.toBeInTheDocument()
      expect(screen.getByText('Show 5 more events')).toBeInTheDocument()
    })
  })

  describe('Time Formatting', () => {
    beforeEach(() => {
      vi.useFakeTimers()
      vi.setSystemTime(new Date('2024-01-15T12:00:00Z'))
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it('should show relative time by default', () => {
      const events: HistoryEvent[] = [
        {
          id: '1',
          type: 'created',
          timestamp: new Date('2024-01-15T11:30:00Z').toISOString(), // 30 min ago
          user: { name: 'User' },
          description: 'Created',
        },
      ]

      render(<TaskHistoryTimeline events={events} relativeTime={true} />)

      // Should show relative time like "30m ago"
      expect(screen.getByText('30m ago')).toBeInTheDocument()
    })

    it('should show "Just now" for very recent events', () => {
      const events: HistoryEvent[] = [
        {
          id: '1',
          type: 'created',
          timestamp: new Date('2024-01-15T12:00:00Z').toISOString(), // now
          user: { name: 'User' },
          description: 'Created',
        },
      ]

      render(<TaskHistoryTimeline events={events} relativeTime={true} />)

      expect(screen.getByText('Just now')).toBeInTheDocument()
    })

    it('should show hours for events within 24 hours', () => {
      const events: HistoryEvent[] = [
        {
          id: '1',
          type: 'created',
          timestamp: new Date('2024-01-15T09:00:00Z').toISOString(), // 3 hours ago
          user: { name: 'User' },
          description: 'Created',
        },
      ]

      render(<TaskHistoryTimeline events={events} relativeTime={true} />)

      expect(screen.getByText('3h ago')).toBeInTheDocument()
    })
  })

  describe('Event Press Handler', () => {
    it('should call onEventPress when event is clicked', () => {
      const onEventPress = vi.fn()
      const events: HistoryEvent[] = [
        {
          id: '1',
          type: 'comment',
          timestamp: new Date().toISOString(),
          user: { name: 'User' },
          description: 'Click me',
        },
      ]

      render(<TaskHistoryTimeline events={events} onEventPress={onEventPress} />)

      fireEvent.click(screen.getByText('Click me'))

      expect(onEventPress).toHaveBeenCalledWith(events[0])
    })

    it('should not crash when onEventPress is not provided', () => {
      const events: HistoryEvent[] = [
        {
          id: '1',
          type: 'comment',
          timestamp: new Date().toISOString(),
          user: { name: 'User' },
          description: 'Safe click',
        },
      ]

      render(<TaskHistoryTimeline events={events} />)

      // Should not throw
      expect(() => fireEvent.click(screen.getByText('Safe click'))).not.toThrow()
    })
  })

  describe('Absolute Time Format', () => {
    it('should show absolute time when relativeTime is false', () => {
      const events: HistoryEvent[] = [
        {
          id: '1',
          type: 'created',
          timestamp: '2024-01-15T14:30:00Z',
          user: { name: 'User' },
          description: 'Created',
        },
      ]

      render(<TaskHistoryTimeline events={events} relativeTime={false} />)

      // Should contain date formatting - the exact format depends on locale
      // Check for the presence of elements that indicate absolute time
      const timeElement = screen.getByText(/Jan|14|15/)
      expect(timeElement).toBeInTheDocument()
    })
  })
})
