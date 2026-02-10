/**
 * PolicyStatusBadge Component Tests
 * REQ-288: Beyond UI Component Library
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

// Mock Tamagui before importing component
vi.mock('tamagui', async () => {
  const React = await import('react')
  return {
    styled: (_component: unknown, config: Record<string, unknown>) => {
      const StyledComponent = React.forwardRef<HTMLElement, Record<string, unknown>>(
        ({ children, ...props }, ref) => {
          return React.createElement('div', { ref, 'data-name': config.name, ...props }, children)
        }
      )
      StyledComponent.displayName = (config.name as string) || 'StyledComponent'
      return StyledComponent
    },
    XStack: ({ children, ...props }: Record<string, unknown>) => React.createElement('div', { 'data-testid': 'xstack', ...props }, children as React.ReactNode),
    Text: ({ children, ...props }: Record<string, unknown>) => React.createElement('span', props, children as React.ReactNode),
  }
})

// Mock lucide icons
vi.mock('lucide-react-native', async () => {
  const React = await import('react')
  return {
    Shield: () => React.createElement('svg', { 'data-testid': 'icon-shield' }),
    Clock: () => React.createElement('svg', { 'data-testid': 'icon-clock' }),
    AlertTriangle: () => React.createElement('svg', { 'data-testid': 'icon-alert' }),
    XCircle: () => React.createElement('svg', { 'data-testid': 'icon-x-circle' }),
    CheckCircle: () => React.createElement('svg', { 'data-testid': 'icon-check-circle' }),
    PauseCircle: () => React.createElement('svg', { 'data-testid': 'icon-pause' }),
    RefreshCw: () => React.createElement('svg', { 'data-testid': 'icon-refresh' }),
  }
})

import { PolicyStatusBadge, type PolicyStatus } from '../PolicyStatusBadge'

describe('PolicyStatusBadge Component', () => {
  describe('Status Labels', () => {
    const statusLabels: { status: PolicyStatus; label: string }[] = [
      { status: 'active', label: 'Active' },
      { status: 'pending', label: 'Pending' },
      { status: 'expired', label: 'Expired' },
      { status: 'cancelled', label: 'Cancelled' },
      { status: 'in-force', label: 'In Force' },
      { status: 'bound', label: 'Bound' },
      { status: 'quoted', label: 'Quoted' },
      { status: 'renewed', label: 'Renewed' },
      { status: 'non-renewed', label: 'Non-Renewed' },
      { status: 'suspended', label: 'Suspended' },
    ]

    statusLabels.forEach(({ status, label }) => {
      it(`should display "${label}" for ${status} status`, () => {
        render(<PolicyStatusBadge status={status} />)

        expect(screen.getByText(label)).toBeInTheDocument()
      })
    })
  })

  describe('Custom Label', () => {
    it('should use custom label when provided', () => {
      render(<PolicyStatusBadge status="active" label="Custom Label" />)

      expect(screen.getByText('Custom Label')).toBeInTheDocument()
      expect(screen.queryByText('Active')).not.toBeInTheDocument()
    })
  })

  describe('Icon Display', () => {
    it('should show icon by default', () => {
      render(<PolicyStatusBadge status="active" />)

      expect(screen.getByTestId('icon-check-circle')).toBeInTheDocument()
    })

    it('should hide icon when showIcon is false', () => {
      render(<PolicyStatusBadge status="active" showIcon={false} />)

      expect(screen.queryByTestId('icon-check-circle')).not.toBeInTheDocument()
    })

    it('should show shield icon for in-force status', () => {
      render(<PolicyStatusBadge status="in-force" />)

      expect(screen.getByTestId('icon-shield')).toBeInTheDocument()
    })

    it('should show clock icon for pending status', () => {
      render(<PolicyStatusBadge status="pending" />)

      expect(screen.getByTestId('icon-clock')).toBeInTheDocument()
    })

    it('should show alert icon for expired status', () => {
      render(<PolicyStatusBadge status="expired" />)

      expect(screen.getByTestId('icon-alert')).toBeInTheDocument()
    })

    it('should show x-circle icon for cancelled status', () => {
      render(<PolicyStatusBadge status="cancelled" />)

      expect(screen.getByTestId('icon-x-circle')).toBeInTheDocument()
    })

    it('should show pause icon for suspended status', () => {
      render(<PolicyStatusBadge status="suspended" />)

      expect(screen.getByTestId('icon-pause')).toBeInTheDocument()
    })

    it('should show refresh icon for renewed status', () => {
      render(<PolicyStatusBadge status="renewed" />)

      expect(screen.getByTestId('icon-refresh')).toBeInTheDocument()
    })
  })

  describe('Sizes', () => {
    it('should render small size', () => {
      render(<PolicyStatusBadge status="active" size="sm" />)

      expect(screen.getByText('Active')).toBeInTheDocument()
    })

    it('should render medium size (default)', () => {
      render(<PolicyStatusBadge status="active" size="md" />)

      expect(screen.getByText('Active')).toBeInTheDocument()
    })

    it('should render large size', () => {
      render(<PolicyStatusBadge status="active" size="lg" />)

      expect(screen.getByText('Active')).toBeInTheDocument()
    })
  })

  describe('Combined Props', () => {
    it('should render with all props', () => {
      render(
        <PolicyStatusBadge
          status="active"
          size="lg"
          showIcon={true}
          label="Currently Active"
        />
      )

      expect(screen.getByText('Currently Active')).toBeInTheDocument()
      expect(screen.getByTestId('icon-check-circle')).toBeInTheDocument()
    })

    it('should render with label and no icon', () => {
      render(
        <PolicyStatusBadge
          status="pending"
          showIcon={false}
          label="Awaiting Approval"
        />
      )

      expect(screen.getByText('Awaiting Approval')).toBeInTheDocument()
      expect(screen.queryByTestId('icon-clock')).not.toBeInTheDocument()
    })
  })
})
