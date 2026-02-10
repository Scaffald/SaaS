/**
 * GCProfileHeader Component Tests
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'

// Legacy UI mock (tamagui) before importing component
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
vi.mock('lucide-react-native', () => ({
  Building: () => null,
  MapPin: () => null,
  Phone: () => null,
  Mail: () => null,
  Globe: () => null,
  Shield: () => null,
  Users: () => null,
  FileText: () => null,
  Calendar: () => null,
  ChevronLeft: () => null,
}))

import { GCProfileHeader, type ComplianceLevel } from '../GCProfileHeader'

describe('GCProfileHeader Component', () => {
  const defaultProps = {
    name: 'Test Construction Company',
  }

  describe('Basic Rendering', () => {
    it('should render the company name', () => {
      render(<GCProfileHeader {...defaultProps} />)

      expect(screen.getByText('Test Construction Company')).toBeInTheDocument()
    })

    it('should render default compliance badge', () => {
      render(<GCProfileHeader {...defaultProps} />)

      expect(screen.getByText('Unknown')).toBeInTheDocument()
    })
  })

  describe('Compliance Levels', () => {
    const complianceLevels: { level: ComplianceLevel; label: string }[] = [
      { level: 'compliant', label: 'Compliant' },
      { level: 'warning', label: 'Warning' },
      { level: 'critical', label: 'Critical' },
      { level: 'unknown', label: 'Unknown' },
    ]

    complianceLevels.forEach(({ level, label }) => {
      it(`should render "${level}" compliance level correctly`, () => {
        render(<GCProfileHeader {...defaultProps} complianceLevel={level} />)

        expect(screen.getByText(label)).toBeInTheDocument()
      })
    })

    it('should show compliance score instead of label when provided', () => {
      render(
        <GCProfileHeader
          {...defaultProps}
          complianceLevel="compliant"
          complianceScore={92}
        />
      )

      expect(screen.getByText('92%')).toBeInTheDocument()
      expect(screen.queryByText('Compliant')).not.toBeInTheDocument()
    })
  })

  describe('Contact Information', () => {
    it('should render address when provided', () => {
      render(<GCProfileHeader {...defaultProps} address="123 Main St, City, ST" />)

      expect(screen.getByText('123 Main St, City, ST')).toBeInTheDocument()
    })

    it('should render phone when provided', () => {
      render(<GCProfileHeader {...defaultProps} phone="555-123-4567" />)

      expect(screen.getByText('555-123-4567')).toBeInTheDocument()
    })

    it('should render email when provided', () => {
      render(<GCProfileHeader {...defaultProps} email="contact@company.com" />)

      expect(screen.getByText('contact@company.com')).toBeInTheDocument()
    })

    it('should render website when provided', () => {
      render(<GCProfileHeader {...defaultProps} website="www.company.com" />)

      expect(screen.getByText('www.company.com')).toBeInTheDocument()
    })

    it('should render all contact info together', () => {
      render(
        <GCProfileHeader
          {...defaultProps}
          address="456 Oak Ave"
          phone="555-987-6543"
          email="info@test.com"
          website="test.com"
        />
      )

      expect(screen.getByText('456 Oak Ave')).toBeInTheDocument()
      expect(screen.getByText('555-987-6543')).toBeInTheDocument()
      expect(screen.getByText('info@test.com')).toBeInTheDocument()
      expect(screen.getByText('test.com')).toBeInTheDocument()
    })
  })

  describe('Statistics', () => {
    it('should render active subcontractors count', () => {
      render(<GCProfileHeader {...defaultProps} activeSubcontractors={25} />)

      expect(screen.getByText('25')).toBeInTheDocument()
      expect(screen.getByText('Active Subcontractors')).toBeInTheDocument()
    })

    it('should render active projects count', () => {
      render(<GCProfileHeader {...defaultProps} activeProjects={8} />)

      expect(screen.getByText('8')).toBeInTheDocument()
      expect(screen.getByText('Active Projects')).toBeInTheDocument()
    })

    it('should render active policies count', () => {
      render(<GCProfileHeader {...defaultProps} activePolicies={12} />)

      expect(screen.getByText('12')).toBeInTheDocument()
      expect(screen.getByText('Active Policies')).toBeInTheDocument()
    })

    it('should render all statistics together', () => {
      render(
        <GCProfileHeader
          {...defaultProps}
          activeSubcontractors={30}
          activeProjects={15}
          activePolicies={20}
        />
      )

      expect(screen.getByText('30')).toBeInTheDocument()
      expect(screen.getByText('15')).toBeInTheDocument()
      expect(screen.getByText('20')).toBeInTheDocument()
    })

    it('should render zero values', () => {
      render(
        <GCProfileHeader
          {...defaultProps}
          activeSubcontractors={0}
          activeProjects={0}
          activePolicies={0}
        />
      )

      expect(screen.getAllByText('0')).toHaveLength(3)
    })

    it('should not render stats when not provided', () => {
      render(<GCProfileHeader {...defaultProps} />)

      expect(screen.queryByText('Active Subcontractors')).not.toBeInTheDocument()
      expect(screen.queryByText('Active Projects')).not.toBeInTheDocument()
      expect(screen.queryByText('Active Policies')).not.toBeInTheDocument()
    })
  })

  describe('Member Since', () => {
    it('should render member since date', () => {
      render(<GCProfileHeader {...defaultProps} memberSince="January 2020" />)

      expect(screen.getByText('Member since January 2020')).toBeInTheDocument()
    })

    it('should not render member since when not provided', () => {
      render(<GCProfileHeader {...defaultProps} />)

      expect(screen.queryByText(/Member since/)).not.toBeInTheDocument()
    })
  })

  describe('Back Button', () => {
    it('should render back button when onBack is provided', () => {
      const onBack = vi.fn()
      render(<GCProfileHeader {...defaultProps} onBack={onBack} />)

      expect(screen.getByText('Back')).toBeInTheDocument()
    })

    it('should call onBack when back button is clicked', () => {
      const onBack = vi.fn()
      render(<GCProfileHeader {...defaultProps} onBack={onBack} />)

      fireEvent.click(screen.getByText('Back'))

      expect(onBack).toHaveBeenCalled()
    })

    it('should not render back button when onBack is not provided', () => {
      render(<GCProfileHeader {...defaultProps} />)

      expect(screen.queryByText('Back')).not.toBeInTheDocument()
    })
  })

  describe('Logo', () => {
    it('should render default building icon when no logo URL provided', () => {
      const { container } = render(<GCProfileHeader {...defaultProps} />)

      // The component should render without crashing
      expect(container.firstChild).toBeInTheDocument()
    })

    it('should handle logo URL prop', () => {
      render(<GCProfileHeader {...defaultProps} logoUrl="https://example.com/logo.png" />)

      // Should render without crashing
      expect(screen.getByText('Test Construction Company')).toBeInTheDocument()
    })
  })

  describe('Combined Props', () => {
    it('should render with all props', () => {
      const onBack = vi.fn()
      const onEdit = vi.fn()

      render(
        <GCProfileHeader
          name="Full Test GC"
          logoUrl="https://example.com/logo.png"
          address="100 Construction Blvd"
          phone="800-555-1234"
          email="gc@construction.com"
          website="gc-construction.com"
          complianceLevel="compliant"
          complianceScore={95}
          activeSubcontractors={50}
          activeProjects={25}
          activePolicies={35}
          memberSince="March 2019"
          onBack={onBack}
          onEdit={onEdit}
        />
      )

      expect(screen.getByText('Full Test GC')).toBeInTheDocument()
      expect(screen.getByText('95%')).toBeInTheDocument()
      expect(screen.getByText('100 Construction Blvd')).toBeInTheDocument()
      expect(screen.getByText('800-555-1234')).toBeInTheDocument()
      expect(screen.getByText('gc@construction.com')).toBeInTheDocument()
      expect(screen.getByText('gc-construction.com')).toBeInTheDocument()
      expect(screen.getByText('50')).toBeInTheDocument()
      expect(screen.getByText('25')).toBeInTheDocument()
      expect(screen.getByText('35')).toBeInTheDocument()
      expect(screen.getByText('Member since March 2019')).toBeInTheDocument()
      expect(screen.getByText('Back')).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('should have proper structure for navigation', () => {
      const onBack = vi.fn()
      render(<GCProfileHeader {...defaultProps} onBack={onBack} />)

      const backButton = screen.getByText('Back')
      expect(backButton).toBeInTheDocument()
    })
  })
})
