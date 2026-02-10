/**
 * ParticipantsTable Component Tests
 * REQ-288: Beyond UI Component Library
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
  }
})

// Mock lucide icons
vi.mock('lucide-react-native', async () => {
  const React = await import('react')
  return {
    User: () => React.createElement('svg', { 'data-testid': 'icon-user' }),
    Building: () => React.createElement('svg', { 'data-testid': 'icon-building' }),
    CheckCircle: () => React.createElement('svg', { 'data-testid': 'icon-check' }),
    Clock: () => React.createElement('svg', { 'data-testid': 'icon-clock' }),
    AlertTriangle: () => React.createElement('svg', { 'data-testid': 'icon-alert' }),
    XCircle: () => React.createElement('svg', { 'data-testid': 'icon-x' }),
    ChevronRight: () => React.createElement('svg', { 'data-testid': 'icon-chevron' }),
    Mail: () => React.createElement('svg', { 'data-testid': 'icon-mail' }),
    Phone: () => React.createElement('svg', { 'data-testid': 'icon-phone' }),
  }
})

import { ParticipantsTable, type Participant } from '../ParticipantsTable'

const mockParticipants: Participant[] = [
  {
    id: '1',
    name: 'John Doe',
    type: 'individual',
    email: 'john@example.com',
    phone: '555-1234',
    role: 'Manager',
    status: 'compliant',
    score: 95,
    pendingItems: 0,
  },
  {
    id: '2',
    name: 'Acme Corp',
    type: 'organization',
    email: 'contact@acme.com',
    status: 'pending',
    score: 60,
    pendingItems: 3,
  },
  {
    id: '3',
    name: 'Jane Smith',
    type: 'individual',
    status: 'at-risk',
    score: 45,
    pendingItems: 5,
  },
  {
    id: '4',
    name: 'Beta LLC',
    type: 'organization',
    status: 'non-compliant',
    score: 20,
  },
]

describe('ParticipantsTable Component', () => {
  describe('Basic Rendering', () => {
    it('should render table title', () => {
      render(<ParticipantsTable participants={mockParticipants} />)

      expect(screen.getByText('Participants')).toBeInTheDocument()
    })

    it('should render custom title', () => {
      render(<ParticipantsTable participants={mockParticipants} title="Team Members" />)

      expect(screen.getByText('Team Members')).toBeInTheDocument()
    })

    it('should render participant count', () => {
      render(<ParticipantsTable participants={mockParticipants} />)

      expect(screen.getByText('4')).toBeInTheDocument()
    })

    it('should render all participant names', () => {
      render(<ParticipantsTable participants={mockParticipants} />)

      expect(screen.getByText('John Doe')).toBeInTheDocument()
      expect(screen.getByText('Acme Corp')).toBeInTheDocument()
      expect(screen.getByText('Jane Smith')).toBeInTheDocument()
      expect(screen.getByText('Beta LLC')).toBeInTheDocument()
    })
  })

  describe('Header Row', () => {
    it('should render column headers', () => {
      render(<ParticipantsTable participants={mockParticipants} />)

      expect(screen.getByText('Participant')).toBeInTheDocument()
      expect(screen.getByText('Score')).toBeInTheDocument()
      expect(screen.getByText('Status')).toBeInTheDocument()
    })

    it('should hide score header when showScores is false', () => {
      render(<ParticipantsTable participants={mockParticipants} showScores={false} />)

      expect(screen.queryByText('Score')).not.toBeInTheDocument()
    })
  })

  describe('Participant Types', () => {
    it('should show user icon for individuals', () => {
      render(<ParticipantsTable participants={mockParticipants} />)

      const userIcons = screen.getAllByTestId('icon-user')
      expect(userIcons.length).toBeGreaterThanOrEqual(2) // John Doe and Jane Smith
    })

    it('should show building icon for organizations', () => {
      render(<ParticipantsTable participants={mockParticipants} />)

      const buildingIcons = screen.getAllByTestId('icon-building')
      expect(buildingIcons.length).toBe(2) // Acme Corp and Beta LLC
    })
  })

  describe('Role Display', () => {
    it('should show role when provided', () => {
      render(<ParticipantsTable participants={mockParticipants} />)

      expect(screen.getByText('Manager')).toBeInTheDocument()
    })
  })

  describe('Contact Info', () => {
    it('should not show contact info by default', () => {
      render(<ParticipantsTable participants={mockParticipants} />)

      expect(screen.queryByText('john@example.com')).not.toBeInTheDocument()
    })

    it('should show email when showContactInfo is true', () => {
      render(<ParticipantsTable participants={mockParticipants} showContactInfo={true} />)

      expect(screen.getByText('john@example.com')).toBeInTheDocument()
      expect(screen.getByText('contact@acme.com')).toBeInTheDocument()
    })

    it('should show phone when showContactInfo is true', () => {
      render(<ParticipantsTable participants={mockParticipants} showContactInfo={true} />)

      expect(screen.getByText('555-1234')).toBeInTheDocument()
    })

    it('should show mail icon with email', () => {
      render(<ParticipantsTable participants={mockParticipants} showContactInfo={true} />)

      expect(screen.getAllByTestId('icon-mail').length).toBeGreaterThan(0)
    })

    it('should show phone icon with phone number', () => {
      render(<ParticipantsTable participants={mockParticipants} showContactInfo={true} />)

      expect(screen.getByTestId('icon-phone')).toBeInTheDocument()
    })
  })

  describe('Score Display', () => {
    it('should show scores by default', () => {
      render(<ParticipantsTable participants={mockParticipants} />)

      expect(screen.getByText('95%')).toBeInTheDocument()
      expect(screen.getByText('60%')).toBeInTheDocument()
      expect(screen.getByText('45%')).toBeInTheDocument()
      expect(screen.getByText('20%')).toBeInTheDocument()
    })

    it('should hide scores when showScores is false', () => {
      render(<ParticipantsTable participants={mockParticipants} showScores={false} />)

      expect(screen.queryByText('95%')).not.toBeInTheDocument()
    })

    it('should show dash for missing scores', () => {
      const participantNoScore: Participant[] = [
        { id: '1', name: 'No Score', type: 'individual', status: 'pending' },
      ]
      render(<ParticipantsTable participants={participantNoScore} />)

      expect(screen.getByText('-')).toBeInTheDocument()
    })
  })

  describe('Status Display', () => {
    it('should show Compliant status', () => {
      render(<ParticipantsTable participants={mockParticipants} />)

      expect(screen.getByText('Compliant')).toBeInTheDocument()
    })

    it('should show Pending status', () => {
      render(<ParticipantsTable participants={mockParticipants} />)

      expect(screen.getByText('Pending')).toBeInTheDocument()
    })

    it('should show At Risk status', () => {
      render(<ParticipantsTable participants={mockParticipants} />)

      expect(screen.getByText('At Risk')).toBeInTheDocument()
    })

    it('should show Non-Compliant status', () => {
      render(<ParticipantsTable participants={mockParticipants} />)

      expect(screen.getByText('Non-Compliant')).toBeInTheDocument()
    })

    it('should show appropriate status icons', () => {
      render(<ParticipantsTable participants={mockParticipants} />)

      expect(screen.getByTestId('icon-check')).toBeInTheDocument()
      expect(screen.getByTestId('icon-clock')).toBeInTheDocument()
      expect(screen.getByTestId('icon-alert')).toBeInTheDocument()
      expect(screen.getByTestId('icon-x')).toBeInTheDocument()
    })
  })

  describe('Pending Items', () => {
    it('should show pending items badge', () => {
      render(<ParticipantsTable participants={mockParticipants} />)

      expect(screen.getByText('3 pending')).toBeInTheDocument()
      expect(screen.getByText('5 pending')).toBeInTheDocument()
    })

    it('should not show pending badge when count is 0', () => {
      render(<ParticipantsTable participants={mockParticipants} />)

      expect(screen.queryByText('0 pending')).not.toBeInTheDocument()
    })
  })

  describe('Click Handler', () => {
    it('should call onParticipantPress when row is clicked', () => {
      const onParticipantPress = vi.fn()
      render(<ParticipantsTable participants={mockParticipants} onParticipantPress={onParticipantPress} />)

      fireEvent.click(screen.getByText('John Doe'))

      expect(onParticipantPress).toHaveBeenCalled()
    })
  })

  describe('Empty State', () => {
    it('should show empty state when no participants', () => {
      render(<ParticipantsTable participants={[]} />)

      expect(screen.getByText('No participants')).toBeInTheDocument()
    })

    it('should show user icon in empty state', () => {
      render(<ParticipantsTable participants={[]} />)

      expect(screen.getByTestId('icon-user')).toBeInTheDocument()
    })
  })

  describe('Chevron Icons', () => {
    it('should show chevron icons for navigation', () => {
      render(<ParticipantsTable participants={mockParticipants} />)

      const chevrons = screen.getAllByTestId('icon-chevron')
      expect(chevrons.length).toBe(4)
    })
  })

  describe('Single Participant', () => {
    it('should render single participant correctly', () => {
      const singleParticipant: Participant[] = [
        { id: '1', name: 'Solo User', type: 'individual', status: 'compliant', score: 100 },
      ]
      render(<ParticipantsTable participants={singleParticipant} />)

      expect(screen.getByText('Solo User')).toBeInTheDocument()
      expect(screen.getByText('100%')).toBeInTheDocument()
      expect(screen.getByText('1')).toBeInTheDocument()
    })
  })
})
