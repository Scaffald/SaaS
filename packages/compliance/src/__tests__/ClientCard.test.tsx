/**
 * ClientCard Component Tests
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
  }
})

// Mock lucide icons
vi.mock('@tamagui/lucide-icons', () => ({
  Building: () => null,
  User: () => null,
  Mail: () => null,
  Phone: () => null,
  Shield: () => null,
  AlertTriangle: () => null,
  ChevronRight: () => null,
}))

import { ClientCard, type ClientType, type RiskLevel, type ClientStatus } from '../ClientCard'

describe('ClientCard Component', () => {
  const defaultProps = {
    id: 'client-1',
    name: 'Test Company',
    type: 'general_contractor' as ClientType,
  }

  describe('Basic Rendering', () => {
    it('should render the client name', () => {
      render(<ClientCard {...defaultProps} />)

      expect(screen.getByText('Test Company')).toBeInTheDocument()
    })

    it('should render the client type badge', () => {
      render(<ClientCard {...defaultProps} />)

      expect(screen.getByText('General Contractor')).toBeInTheDocument()
    })

    it('should render status indicator', () => {
      render(<ClientCard {...defaultProps} status="active" />)

      expect(screen.getByText('Active')).toBeInTheDocument()
    })
  })

  describe('Client Types', () => {
    const clientTypes: { type: ClientType; label: string }[] = [
      { type: 'general_contractor', label: 'General Contractor' },
      { type: 'subcontractor', label: 'Subcontractor' },
      { type: 'owner', label: 'Owner' },
      { type: 'vendor', label: 'Vendor' },
    ]

    clientTypes.forEach(({ type, label }) => {
      it(`should render "${type}" client type correctly`, () => {
        render(<ClientCard {...defaultProps} type={type} />)

        expect(screen.getByText(label)).toBeInTheDocument()
      })
    })
  })

  describe('Status Display', () => {
    const statuses: { status: ClientStatus; label: string }[] = [
      { status: 'active', label: 'Active' },
      { status: 'inactive', label: 'Inactive' },
      { status: 'pending', label: 'Pending' },
      { status: 'suspended', label: 'Suspended' },
    ]

    statuses.forEach(({ status, label }) => {
      it(`should render "${status}" status correctly`, () => {
        render(<ClientCard {...defaultProps} status={status} />)

        expect(screen.getByText(label)).toBeInTheDocument()
      })
    })

    it('should default to active status', () => {
      render(<ClientCard {...defaultProps} />)

      expect(screen.getByText('Active')).toBeInTheDocument()
    })
  })

  describe('Risk Level Display', () => {
    const riskLevels: { level: RiskLevel; label: string }[] = [
      { level: 'low', label: 'Low Risk' },
      { level: 'medium', label: 'Medium Risk' },
      { level: 'high', label: 'High Risk' },
      { level: 'critical', label: 'Critical Risk' },
    ]

    riskLevels.forEach(({ level, label }) => {
      it(`should render "${level}" risk level correctly`, () => {
        render(<ClientCard {...defaultProps} riskLevel={level} />)

        expect(screen.getByText(label)).toBeInTheDocument()
      })
    })

    it('should not render risk badge when riskLevel is not provided', () => {
      render(<ClientCard {...defaultProps} />)

      expect(screen.queryByText(/Risk$/)).not.toBeInTheDocument()
    })
  })

  describe('Compliance Score', () => {
    it('should render compliance score when provided', () => {
      render(<ClientCard {...defaultProps} complianceScore={85} />)

      expect(screen.getByText('85%')).toBeInTheDocument()
      expect(screen.getByText('Compliance')).toBeInTheDocument()
    })

    it('should not render compliance score section when not provided', () => {
      render(<ClientCard {...defaultProps} />)

      expect(screen.queryByText('Compliance')).not.toBeInTheDocument()
    })

    it('should render low compliance score', () => {
      render(<ClientCard {...defaultProps} complianceScore={45} />)

      expect(screen.getByText('45%')).toBeInTheDocument()
    })

    it('should render medium compliance score', () => {
      render(<ClientCard {...defaultProps} complianceScore={65} />)

      expect(screen.getByText('65%')).toBeInTheDocument()
    })

    it('should render high compliance score', () => {
      render(<ClientCard {...defaultProps} complianceScore={95} />)

      expect(screen.getByText('95%')).toBeInTheDocument()
    })
  })

  describe('Contact Information', () => {
    it('should render email when provided', () => {
      render(<ClientCard {...defaultProps} email="test@example.com" />)

      expect(screen.getByText('test@example.com')).toBeInTheDocument()
    })

    it('should render phone when provided', () => {
      render(<ClientCard {...defaultProps} phone="555-1234" />)

      expect(screen.getByText('555-1234')).toBeInTheDocument()
    })

    it('should render primary contact when provided', () => {
      render(<ClientCard {...defaultProps} primaryContact="John Smith" />)

      expect(screen.getByText('John Smith')).toBeInTheDocument()
    })

    it('should render all contact info together', () => {
      render(
        <ClientCard
          {...defaultProps}
          email="test@example.com"
          phone="555-1234"
          primaryContact="John Smith"
        />
      )

      expect(screen.getByText('test@example.com')).toBeInTheDocument()
      expect(screen.getByText('555-1234')).toBeInTheDocument()
      expect(screen.getByText('John Smith')).toBeInTheDocument()
    })

    it('should not render contact section when no contact info provided', () => {
      render(<ClientCard {...defaultProps} />)

      expect(screen.queryByText(/555-/)).not.toBeInTheDocument()
      expect(screen.queryByText(/@example/)).not.toBeInTheDocument()
    })
  })

  describe('Active Projects', () => {
    it('should render active projects count when provided', () => {
      render(<ClientCard {...defaultProps} activeProjects={5} />)

      expect(screen.getByText('5')).toBeInTheDocument()
      expect(screen.getByText('Active Projects')).toBeInTheDocument()
    })

    it('should render zero active projects', () => {
      render(<ClientCard {...defaultProps} activeProjects={0} />)

      expect(screen.getByText('0')).toBeInTheDocument()
      expect(screen.getByText('Active Projects')).toBeInTheDocument()
    })

    it('should not render active projects when not provided', () => {
      render(<ClientCard {...defaultProps} />)

      expect(screen.queryByText('Active Projects')).not.toBeInTheDocument()
    })
  })

  describe('Click Handler', () => {
    it('should call onPress when card is clicked', () => {
      const onPress = vi.fn()
      render(<ClientCard {...defaultProps} onPress={onPress} />)

      fireEvent.click(screen.getByText('Test Company'))

      expect(onPress).toHaveBeenCalled()
    })

    it('should not crash when onPress is not provided', () => {
      render(<ClientCard {...defaultProps} />)

      expect(() => fireEvent.click(screen.getByText('Test Company'))).not.toThrow()
    })
  })

  describe('Variant Styles', () => {
    it('should render default variant', () => {
      render(<ClientCard {...defaultProps} variant="default" />)

      expect(screen.getByText('Test Company')).toBeInTheDocument()
    })

    it('should render compact variant', () => {
      render(<ClientCard {...defaultProps} variant="compact" />)

      expect(screen.getByText('Test Company')).toBeInTheDocument()
    })

    it('should hide additional details in compact variant', () => {
      render(
        <ClientCard
          {...defaultProps}
          variant="compact"
          complianceScore={85}
          activeProjects={5}
          email="test@example.com"
        />
      )

      // In compact variant, these details should not be shown
      expect(screen.queryByText('85%')).not.toBeInTheDocument()
      expect(screen.queryByText('Active Projects')).not.toBeInTheDocument()
      expect(screen.queryByText('test@example.com')).not.toBeInTheDocument()
    })
  })

  describe('Combined Props', () => {
    it('should render all props together', () => {
      render(
        <ClientCard
          id="client-1"
          name="Full Test Company"
          type="subcontractor"
          status="active"
          riskLevel="medium"
          complianceScore={75}
          email="contact@test.com"
          phone="555-9876"
          primaryContact="Jane Doe"
          activeProjects={12}
        />
      )

      expect(screen.getByText('Full Test Company')).toBeInTheDocument()
      expect(screen.getByText('Subcontractor')).toBeInTheDocument()
      expect(screen.getByText('Active')).toBeInTheDocument()
      expect(screen.getByText('Medium Risk')).toBeInTheDocument()
      expect(screen.getByText('75%')).toBeInTheDocument()
      expect(screen.getByText('contact@test.com')).toBeInTheDocument()
      expect(screen.getByText('555-9876')).toBeInTheDocument()
      expect(screen.getByText('Jane Doe')).toBeInTheDocument()
      expect(screen.getByText('12')).toBeInTheDocument()
    })
  })
})
