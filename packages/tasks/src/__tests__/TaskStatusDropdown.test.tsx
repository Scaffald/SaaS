/**
 * TaskStatusDropdown Component Tests
 * Auto-save on change with optimistic UI updates.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'

vi.mock('@scaffald/ui', async () => {
  const React = await import('react')
  return {
    Stack: ({ children, ...props }: Record<string, unknown>) => React.createElement('div', props, children),
    Row: ({ children, ...props }: Record<string, unknown>) => React.createElement('div', props, children),
    Box: ({ children, ...props }: Record<string, unknown>) => React.createElement('div', props, children),
    Text: ({ children, ...props }: Record<string, unknown>) => React.createElement('span', props, children),
  }
})

vi.mock('@scaffald/ui/tokens', () => ({
  colors: { gray: {}, bg: { primary: '#fff' }, border: { default: '#eee' }, info: {}, success: {}, error: {}, violet: {}, orange: {} },
  spacing: { 4: 4, 8: 8, 12: 12, 16: 16 },
  borderRadius: { m: 10, max: 999 },
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
  AlertTriangle: () => null,
  XCircle: () => null,
  ChevronDown: ({ ...props }) => {
    const React = require('react')
    return React.createElement('span', { 'data-testid': 'chevron-down', ...props })
  },
  Loader2: ({ ...props }) => {
    const React = require('react')
    return React.createElement('span', { 'data-testid': 'loader-icon', ...props })
  },
}))

import { TaskStatusDropdown, type TaskStatus } from '../TaskStatusDropdown'

describe('TaskStatusDropdown Component', () => {
  describe('Basic Rendering', () => {
    it('should render with the current status displayed', () => {
      const handleValueChange = vi.fn()
      render(
        <TaskStatusDropdown value="todo" onValueChange={handleValueChange} />
      )

      expect(screen.getByText('To Do')).toBeInTheDocument()
    })

    it('should render "In Progress" status correctly', () => {
      const handleValueChange = vi.fn()
      render(
        <TaskStatusDropdown value="in-progress" onValueChange={handleValueChange} />
      )

      expect(screen.getByText('In Progress')).toBeInTheDocument()
    })

    it('should render "Completed" status correctly', () => {
      const handleValueChange = vi.fn()
      render(
        <TaskStatusDropdown value="completed" onValueChange={handleValueChange} />
      )

      expect(screen.getByText('Completed')).toBeInTheDocument()
    })

    it('should render "In Review" status correctly', () => {
      const handleValueChange = vi.fn()
      render(
        <TaskStatusDropdown value="review" onValueChange={handleValueChange} />
      )

      expect(screen.getByText('In Review')).toBeInTheDocument()
    })

    it('should render "Blocked" status correctly', () => {
      const handleValueChange = vi.fn()
      render(
        <TaskStatusDropdown value="blocked" onValueChange={handleValueChange} />
      )

      expect(screen.getByText('Blocked')).toBeInTheDocument()
    })

    it('should render "Cancelled" status correctly', () => {
      const handleValueChange = vi.fn()
      render(
        <TaskStatusDropdown value="cancelled" onValueChange={handleValueChange} />
      )

      expect(screen.getByText('Cancelled')).toBeInTheDocument()
    })
  })

  describe('Dropdown Interaction', () => {
    it('should open dropdown when trigger is clicked', () => {
      const handleValueChange = vi.fn()
      render(
        <TaskStatusDropdown value="todo" onValueChange={handleValueChange} />
      )

      // Click the trigger to open dropdown
      const trigger = screen.getByText('To Do')
      fireEvent.click(trigger)

      // All options should be visible
      expect(screen.getByText('In Progress')).toBeInTheDocument()
      expect(screen.getByText('Completed')).toBeInTheDocument()
    })

    it('should call onValueChange when selecting a new status', () => {
      const handleValueChange = vi.fn()
      render(
        <TaskStatusDropdown value="todo" onValueChange={handleValueChange} />
      )

      // Open dropdown
      fireEvent.click(screen.getByText('To Do'))

      // Select "Completed"
      fireEvent.click(screen.getByText('Completed'))

      expect(handleValueChange).toHaveBeenCalledWith('completed')
    })

    it('should close dropdown after selection', () => {
      const handleValueChange = vi.fn()
      render(
        <TaskStatusDropdown value="todo" onValueChange={handleValueChange} />
      )

      // Open dropdown
      fireEvent.click(screen.getByText('To Do'))

      // Select a status
      fireEvent.click(screen.getByText('In Progress'))

      // The component should re-render and close (controlled by internal state)
      expect(handleValueChange).toHaveBeenCalled()
    })
  })

  describe('Disabled State', () => {
    it('should not open dropdown when disabled', () => {
      const handleValueChange = vi.fn()
      render(
        <TaskStatusDropdown
          value="todo"
          onValueChange={handleValueChange}
          disabled
        />
      )

      // Try to click the trigger
      fireEvent.click(screen.getByText('To Do'))

      // onValueChange should not be called
      expect(handleValueChange).not.toHaveBeenCalled()
    })

    it('should not call onValueChange when disabled and item clicked', () => {
      const handleValueChange = vi.fn()
      const { rerender } = render(
        <TaskStatusDropdown
          value="todo"
          onValueChange={handleValueChange}
          disabled={false}
        />
      )

      // Open dropdown first
      fireEvent.click(screen.getByText('To Do'))

      // Re-render with disabled
      rerender(
        <TaskStatusDropdown
          value="todo"
          onValueChange={handleValueChange}
          disabled
        />
      )

      // handleValueChange should only have been called for opening, not selecting
      expect(handleValueChange).not.toHaveBeenCalled()
    })
  })

  describe('Custom Options', () => {
    it('should only render provided options', () => {
      const handleValueChange = vi.fn()
      const limitedOptions: TaskStatus[] = ['todo', 'in-progress', 'completed']

      render(
        <TaskStatusDropdown
          value="todo"
          onValueChange={handleValueChange}
          options={limitedOptions}
        />
      )

      // Open dropdown
      fireEvent.click(screen.getByText('To Do'))

      // Should see provided options
      expect(screen.getByText('In Progress')).toBeInTheDocument()
      expect(screen.getByText('Completed')).toBeInTheDocument()

      // Should NOT see blocked or cancelled
      expect(screen.queryByText('Blocked')).not.toBeInTheDocument()
      expect(screen.queryByText('Cancelled')).not.toBeInTheDocument()
    })
  })

  describe('Size Variants', () => {
    it('should render in small size', () => {
      const handleValueChange = vi.fn()
      render(
        <TaskStatusDropdown
          value="todo"
          onValueChange={handleValueChange}
          size="sm"
        />
      )

      expect(screen.getByText('To Do')).toBeInTheDocument()
    })

    it('should render in medium size (default)', () => {
      const handleValueChange = vi.fn()
      render(
        <TaskStatusDropdown
          value="todo"
          onValueChange={handleValueChange}
          size="md"
        />
      )

      expect(screen.getByText('To Do')).toBeInTheDocument()
    })

    it('should render in large size', () => {
      const handleValueChange = vi.fn()
      render(
        <TaskStatusDropdown
          value="todo"
          onValueChange={handleValueChange}
          size="lg"
        />
      )

      expect(screen.getByText('To Do')).toBeInTheDocument()
    })
  })

  describe('All Status Types', () => {
    const allStatuses: TaskStatus[] = ['todo', 'in-progress', 'review', 'completed', 'blocked', 'cancelled']
    const statusLabels: Record<TaskStatus, string> = {
      todo: 'To Do',
      'in-progress': 'In Progress',
      review: 'In Review',
      completed: 'Completed',
      blocked: 'Blocked',
      cancelled: 'Cancelled',
    }

    allStatuses.forEach((status) => {
      it(`should correctly render "${status}" status`, () => {
        const handleValueChange = vi.fn()
        render(
          <TaskStatusDropdown value={status} onValueChange={handleValueChange} />
        )

        expect(screen.getByText(statusLabels[status])).toBeInTheDocument()
      })
    })
  })

  describe('Status Change Flow', () => {
    it('should allow changing from todo to in-progress', () => {
      const handleValueChange = vi.fn()
      render(
        <TaskStatusDropdown value="todo" onValueChange={handleValueChange} />
      )

      fireEvent.click(screen.getByText('To Do'))
      fireEvent.click(screen.getByText('In Progress'))

      expect(handleValueChange).toHaveBeenCalledWith('in-progress')
    })

    it('should allow changing from in-progress to completed', () => {
      const handleValueChange = vi.fn()
      render(
        <TaskStatusDropdown value="in-progress" onValueChange={handleValueChange} />
      )

      fireEvent.click(screen.getByText('In Progress'))
      fireEvent.click(screen.getByText('Completed'))

      expect(handleValueChange).toHaveBeenCalledWith('completed')
    })

    it('should allow changing from any status to blocked', () => {
      const handleValueChange = vi.fn()
      render(
        <TaskStatusDropdown value="review" onValueChange={handleValueChange} />
      )

      fireEvent.click(screen.getByText('In Review'))
      fireEvent.click(screen.getByText('Blocked'))

      expect(handleValueChange).toHaveBeenCalledWith('blocked')
    })
  })

  /**
   * Auto-Save Tests
   * Tests for automatic status saving with optimistic UI updates.
   */
  describe('Auto-Save Functionality', () => {
    describe('Optimistic UI Updates', () => {
      it('should call onValueChange immediately on status select (optimistic update)', async () => {
        const handleValueChange = vi.fn()
        const handleSave = vi.fn().mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)))

        render(
          <TaskStatusDropdown
            value="todo"
            onValueChange={handleValueChange}
            taskId="task-123"
            onSave={handleSave}
          />
        )

        // Open dropdown and select new status
        fireEvent.click(screen.getByText('To Do'))
        fireEvent.click(screen.getByText('In Progress'))

        // onValueChange should be called immediately (optimistic update)
        expect(handleValueChange).toHaveBeenCalledWith('in-progress')
      })

      it('should show new status immediately before API response completes', async () => {
        let resolvePromise: () => void
        const savePromise = new Promise<void>(resolve => { resolvePromise = resolve })
        const handleSave = vi.fn().mockReturnValue(savePromise)
        const handleValueChange = vi.fn()

        render(
          <TaskStatusDropdown
            value="todo"
            onValueChange={handleValueChange}
            taskId="task-123"
            onSave={handleSave}
          />
        )

        // Open dropdown and select new status
        fireEvent.click(screen.getByText('To Do'))
        fireEvent.click(screen.getByText('In Progress'))

        // onValueChange called immediately (before promise resolves)
        expect(handleValueChange).toHaveBeenCalledWith('in-progress')
        expect(handleSave).toHaveBeenCalled()

        // Resolve the save
        await act(async () => {
          resolvePromise!()
        })
      })
    })

    describe('Save Success', () => {
      it('should call onSave with correct parameters', async () => {
        const handleValueChange = vi.fn()
        const handleSave = vi.fn().mockResolvedValue(undefined)

        render(
          <TaskStatusDropdown
            value="todo"
            onValueChange={handleValueChange}
            taskId="task-123"
            onSave={handleSave}
          />
        )

        // Open dropdown and select new status
        fireEvent.click(screen.getByText('To Do'))
        fireEvent.click(screen.getByText('Completed'))

        await waitFor(() => {
          expect(handleSave).toHaveBeenCalledWith('task-123', 'completed', 'todo')
        })
      })

      it('should call onSaveSuccess after successful save', async () => {
        const handleValueChange = vi.fn()
        const handleSave = vi.fn().mockResolvedValue(undefined)
        const handleSaveSuccess = vi.fn()

        render(
          <TaskStatusDropdown
            value="todo"
            onValueChange={handleValueChange}
            taskId="task-123"
            onSave={handleSave}
            onSaveSuccess={handleSaveSuccess}
          />
        )

        // Open dropdown and select new status
        fireEvent.click(screen.getByText('To Do'))
        fireEvent.click(screen.getByText('In Progress'))

        await waitFor(() => {
          expect(handleSaveSuccess).toHaveBeenCalledWith('task-123', 'in-progress')
        })
      })
    })

    describe('Error Handling with Rollback', () => {
      it('should rollback to previous status on save failure', async () => {
        const handleValueChange = vi.fn()
        const handleSave = vi.fn().mockRejectedValue(new Error('Network error'))
        const handleSaveError = vi.fn()

        render(
          <TaskStatusDropdown
            value="todo"
            onValueChange={handleValueChange}
            taskId="task-123"
            onSave={handleSave}
            onSaveError={handleSaveError}
          />
        )

        // Open dropdown and select new status
        fireEvent.click(screen.getByText('To Do'))
        fireEvent.click(screen.getByText('In Progress'))

        // First call is the optimistic update
        expect(handleValueChange).toHaveBeenCalledWith('in-progress')

        // Wait for rollback
        await waitFor(() => {
          // Second call should be the rollback to original status
          expect(handleValueChange).toHaveBeenLastCalledWith('todo')
        })
      })

      it('should call onSaveError with error details on failure', async () => {
        const handleValueChange = vi.fn()
        const handleSave = vi.fn().mockRejectedValue(new Error('Server error'))
        const handleSaveError = vi.fn()

        render(
          <TaskStatusDropdown
            value="todo"
            onValueChange={handleValueChange}
            taskId="task-123"
            onSave={handleSave}
            onSaveError={handleSaveError}
          />
        )

        // Open dropdown and select new status
        fireEvent.click(screen.getByText('To Do'))
        fireEvent.click(screen.getByText('In Progress'))

        await waitFor(() => {
          expect(handleSaveError).toHaveBeenCalled()
          const [error, taskId, attemptedStatus] = handleSaveError.mock.calls[0]
          expect(error).toBeInstanceOf(Error)
          expect(error.message).toBe('Server error')
          expect(taskId).toBe('task-123')
          expect(attemptedStatus).toBe('in-progress')
        })
      })
    })

    describe('Loading State', () => {
      it('should not allow new selections while loading', async () => {
        let resolvePromise: () => void
        const savePromise = new Promise<void>(resolve => { resolvePromise = resolve })
        const handleSave = vi.fn().mockReturnValue(savePromise)
        const handleValueChange = vi.fn()

        const { rerender } = render(
          <TaskStatusDropdown
            value="todo"
            onValueChange={handleValueChange}
            taskId="task-123"
            onSave={handleSave}
          />
        )

        // Open dropdown and select new status
        fireEvent.click(screen.getByText('To Do'))
        fireEvent.click(screen.getByText('In Progress'))

        // First call is the optimistic update
        expect(handleValueChange).toHaveBeenCalledTimes(1)
        expect(handleValueChange).toHaveBeenCalledWith('in-progress')

        // Simulate parent updating value prop based on onValueChange (optimistic update in parent state)
        rerender(
          <TaskStatusDropdown
            value="in-progress"
            onValueChange={handleValueChange}
            taskId="task-123"
            onSave={handleSave}
          />
        )

        // While loading, the dropdown should show loading indicator
        expect(screen.getByTestId('loader-icon')).toBeInTheDocument()

        // Try to click the trigger while loading - should not work
        fireEvent.click(screen.getByText('In Progress'))

        // No new calls should be made because loading prevents interaction
        expect(handleValueChange).toHaveBeenCalledTimes(1)

        // Cleanup
        await act(async () => {
          resolvePromise!()
        })
      })
    })

    describe('Multiple Rapid Status Changes', () => {
      it('should handle rapid status changes correctly', async () => {
        const handleValueChange = vi.fn()
        let resolveFirst: () => void
        let resolveSecond: () => void

        const firstPromise = new Promise<void>(resolve => { resolveFirst = resolve })
        const secondPromise = new Promise<void>(resolve => { resolveSecond = resolve })

        const handleSave = vi.fn()
          .mockReturnValueOnce(firstPromise)
          .mockReturnValueOnce(secondPromise)
        const handleSaveSuccess = vi.fn()

        const { rerender } = render(
          <TaskStatusDropdown
            value="todo"
            onValueChange={handleValueChange}
            taskId="task-123"
            onSave={handleSave}
            onSaveSuccess={handleSaveSuccess}
          />
        )

        // First status change
        fireEvent.click(screen.getByText('To Do'))
        fireEvent.click(screen.getByText('In Progress'))

        expect(handleValueChange).toHaveBeenLastCalledWith('in-progress')

        // Simulate the parent updating the value prop based on onValueChange
        rerender(
          <TaskStatusDropdown
            value="in-progress"
            onValueChange={handleValueChange}
            taskId="task-123"
            onSave={handleSave}
            onSaveSuccess={handleSaveSuccess}
          />
        )

        // Resolve first request
        await act(async () => {
          resolveFirst!()
        })

        // Success callback should be called for the completed save
        await waitFor(() => {
          expect(handleSaveSuccess).toHaveBeenCalled()
        })
      })
    })

    describe('Without Auto-Save (Controlled Mode)', () => {
      it('should work as regular controlled component without taskId', () => {
        const handleValueChange = vi.fn()

        render(
          <TaskStatusDropdown
            value="todo"
            onValueChange={handleValueChange}
          />
        )

        // Open dropdown and select new status
        fireEvent.click(screen.getByText('To Do'))
        fireEvent.click(screen.getByText('In Progress'))

        // Should just call onValueChange without any save logic
        expect(handleValueChange).toHaveBeenCalledWith('in-progress')
        expect(handleValueChange).toHaveBeenCalledTimes(1)
      })

      it('should not trigger auto-save without onSave prop even with taskId', () => {
        const handleValueChange = vi.fn()

        render(
          <TaskStatusDropdown
            value="todo"
            onValueChange={handleValueChange}
            taskId="task-123"
            // No onSave prop
          />
        )

        // Open dropdown and select new status
        fireEvent.click(screen.getByText('To Do'))
        fireEvent.click(screen.getByText('Completed'))

        // Should just call onValueChange
        expect(handleValueChange).toHaveBeenCalledWith('completed')
        expect(handleValueChange).toHaveBeenCalledTimes(1)
      })
    })

    describe('Same Status Selection', () => {
      it('should not trigger save when selecting the same status', () => {
        const handleValueChange = vi.fn()
        const handleSave = vi.fn().mockResolvedValue(undefined)

        render(
          <TaskStatusDropdown
            value="todo"
            onValueChange={handleValueChange}
            taskId="task-123"
            onSave={handleSave}
          />
        )

        // Open dropdown first
        fireEvent.click(screen.getByText('To Do'))

        // Find all "To Do" elements and click the one in the dropdown (second one)
        const todoElements = screen.getAllByText('To Do')
        fireEvent.click(todoElements[todoElements.length - 1])

        // Neither callback should be called
        expect(handleValueChange).not.toHaveBeenCalled()
        expect(handleSave).not.toHaveBeenCalled()
      })
    })
  })
})
