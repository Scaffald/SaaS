/**
 * ComplianceChecklist Component Tests
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'

vi.mock('@scaffald/ui', () => {
  const React = require('react')
  const createEl = (tag: string) => ({ children, ...rest }: Record<string, unknown>) => React.createElement(tag, rest, children)
  return {
    Stack: createEl('div'),
    Row: createEl('div'),
    Text: createEl('span'),
    Box: createEl('div'),
    ThemeProvider: ({ children }: { children?: React.ReactNode }) => React.createElement(React.Fragment, null, children),
    useThemeContext: () => ({ theme: 'light' }),
    VisuallyHidden: createEl('span'),
    Spinner: () => React.createElement('div', { 'data-testid': 'spinner' }),
    useToast: () => ({ show: () => {}, dismiss: () => {}, success: () => {}, error: () => {} }),
  }
})

// Mock lucide icons
vi.mock('lucide-react-native', async () => {
  const React = await import('react')
  return {
    CheckCircle: () => React.createElement('svg', { 'data-testid': 'icon-check-circle' }),
    Circle: () => React.createElement('svg', { 'data-testid': 'icon-circle' }),
    Clock: () => React.createElement('svg', { 'data-testid': 'icon-clock' }),
    AlertTriangle: () => React.createElement('svg', { 'data-testid': 'icon-alert' }),
    ChevronDown: () => React.createElement('svg', { 'data-testid': 'icon-chevron-down' }),
    ChevronRight: () => React.createElement('svg', { 'data-testid': 'icon-chevron-right' }),
    FileText: () => React.createElement('svg', { 'data-testid': 'icon-file' }),
  }
})

import { ComplianceChecklist, type ChecklistItem } from '../ComplianceChecklist'

const mockItems: ChecklistItem[] = [
  {
    id: '1',
    title: 'Submit Annual Report',
    description: 'Upload the annual compliance report',
    status: 'completed',
    completedDate: '2024-01-15',
    required: true,
  },
  {
    id: '2',
    title: 'Update Privacy Policy',
    description: 'Review and update privacy policy',
    status: 'pending',
    dueDate: '2024-12-31',
    assignee: 'John Doe',
    required: true,
  },
  {
    id: '3',
    title: 'Employee Training',
    status: 'in-progress',
    dueDate: '2024-06-30',
    category: 'Training',
  },
  {
    id: '4',
    title: 'Document Review',
    status: 'overdue',
    dueDate: '2024-01-01',
    documentUrl: 'https://example.com/doc',
  },
]

describe('ComplianceChecklist Component', () => {
  describe('Basic Rendering', () => {
    it('should render checklist title', () => {
      render(<ComplianceChecklist items={mockItems} />)

      expect(screen.getByText('Compliance Checklist')).toBeInTheDocument()
    })

    it('should render custom title', () => {
      render(<ComplianceChecklist items={mockItems} title="Annual Compliance" />)

      expect(screen.getByText('Annual Compliance')).toBeInTheDocument()
    })

    it('should render all item titles', () => {
      render(<ComplianceChecklist items={mockItems} />)

      expect(screen.getByText('Submit Annual Report')).toBeInTheDocument()
      expect(screen.getByText('Update Privacy Policy')).toBeInTheDocument()
      expect(screen.getByText('Employee Training')).toBeInTheDocument()
      expect(screen.getByText('Document Review')).toBeInTheDocument()
    })

    it('should render item descriptions', () => {
      render(<ComplianceChecklist items={mockItems} />)

      expect(screen.getByText('Upload the annual compliance report')).toBeInTheDocument()
      expect(screen.getByText('Review and update privacy policy')).toBeInTheDocument()
    })
  })

  describe('Progress Display', () => {
    it('should display progress count', () => {
      render(<ComplianceChecklist items={mockItems} />)

      // 1 completed out of 4 (2 required + 2 not explicitly required)
      expect(screen.getByText(/completed/)).toBeInTheDocument()
    })
  })

  describe('Status Indicators', () => {
    it('should show check icon for completed items', () => {
      render(<ComplianceChecklist items={mockItems} />)

      const checkIcons = screen.getAllByTestId('icon-check-circle')
      expect(checkIcons.length).toBeGreaterThan(0)
    })

    it('should show circle icon for pending items', () => {
      render(<ComplianceChecklist items={mockItems} />)

      const circleIcons = screen.getAllByTestId('icon-circle')
      expect(circleIcons.length).toBeGreaterThan(0)
    })

    it('should show clock icon for in-progress items', () => {
      render(<ComplianceChecklist items={mockItems} />)

      const clockIcons = screen.getAllByTestId('icon-clock')
      expect(clockIcons.length).toBeGreaterThan(0)
    })

    it('should show alert icon for overdue items', () => {
      render(<ComplianceChecklist items={mockItems} />)

      const alertIcons = screen.getAllByTestId('icon-alert')
      expect(alertIcons.length).toBeGreaterThan(0)
    })
  })

  describe('Required Badge', () => {
    it('should show Required badge for required items', () => {
      render(<ComplianceChecklist items={mockItems} />)

      const requiredBadges = screen.getAllByText('Required')
      expect(requiredBadges.length).toBe(2)
    })
  })

  describe('Assignee Display', () => {
    it('should show assignee when provided', () => {
      render(<ComplianceChecklist items={mockItems} />)

      expect(screen.getByText(/Assignee: John Doe/)).toBeInTheDocument()
    })
  })

  describe('Document Link', () => {
    it('should show document link when provided', () => {
      render(<ComplianceChecklist items={mockItems} />)

      expect(screen.getByText('View Document')).toBeInTheDocument()
    })

    it('should show file icon with document link', () => {
      render(<ComplianceChecklist items={mockItems} />)

      expect(screen.getByTestId('icon-file')).toBeInTheDocument()
    })
  })

  describe('Status Change Callback', () => {
    it('should call onStatusChange when status is toggled', () => {
      const onStatusChange = vi.fn()
      render(<ComplianceChecklist items={mockItems} onStatusChange={onStatusChange} />)

      // Click on a status indicator (circle icon)
      const circleIcons = screen.getAllByTestId('icon-circle')
      fireEvent.click(circleIcons[0])

      expect(onStatusChange).toHaveBeenCalled()
    })
  })

  describe('Item Press Callback', () => {
    it('should call onItemPress when item content is clicked', () => {
      const onItemPress = vi.fn()
      render(<ComplianceChecklist items={mockItems} onItemPress={onItemPress} />)

      fireEvent.click(screen.getByText('Submit Annual Report'))

      expect(onItemPress).toHaveBeenCalled()
    })
  })

  describe('Empty State', () => {
    it('should render empty state when no items', () => {
      render(<ComplianceChecklist items={[]} />)

      expect(screen.getByText('No checklist items')).toBeInTheDocument()
    })
  })

  describe('Group by Category', () => {
    it('should group items by category when enabled', () => {
      const categorizedItems: ChecklistItem[] = [
        { id: '1', title: 'Item 1', status: 'pending', category: 'Documents' },
        { id: '2', title: 'Item 2', status: 'pending', category: 'Documents' },
        { id: '3', title: 'Item 3', status: 'pending', category: 'Training' },
      ]
      render(<ComplianceChecklist items={categorizedItems} groupByCategory={true} />)

      expect(screen.getByText('Documents')).toBeInTheDocument()
      expect(screen.getByText('Training')).toBeInTheDocument()
    })

    it('should show category progress', () => {
      const categorizedItems: ChecklistItem[] = [
        { id: '1', title: 'Item 1', status: 'completed', category: 'Documents' },
        { id: '2', title: 'Item 2', status: 'pending', category: 'Documents' },
      ]
      render(<ComplianceChecklist items={categorizedItems} groupByCategory={true} />)

      expect(screen.getByText('1/2')).toBeInTheDocument()
    })
  })

  describe('Single Item', () => {
    it('should render single item correctly', () => {
      const singleItem: ChecklistItem[] = [
        { id: '1', title: 'Only Item', status: 'pending' },
      ]
      render(<ComplianceChecklist items={singleItem} />)

      expect(screen.getByText('Only Item')).toBeInTheDocument()
    })
  })
})
