/**
 * PolicyCard Component Tests
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
    Text: ({ children, ...props }: Record<string, unknown>) => React.createElement('span', props, children as React.ReactNode),
  }
})

// Mock lucide icons
vi.mock('lucide-react-native', async () => {
  const React = await import('react')
  return {
    Calendar: () => React.createElement('svg', { 'data-testid': 'calendar-icon' }),
    DollarSign: () => React.createElement('svg', { 'data-testid': 'dollar-icon' }),
    Shield: () => React.createElement('svg', { 'data-testid': 'shield-icon' }),
  }
})

import { PolicyCard } from '../PolicyCard'

const defaultProps = {
  policyNumber: 'POL-12345',
  insuredName: 'Acme Corporation',
  policyType: 'General Liability',
  status: 'active' as const,
  effectiveDate: '2024-01-01',
  expirationDate: '2025-01-01',
}

describe('PolicyCard Component', () => {
  describe('Basic Rendering', () => {
    it('should render policy number', () => {
      render(<PolicyCard {...defaultProps} />)

      expect(screen.getByText('POL-12345')).toBeInTheDocument()
    })

    it('should render insured name', () => {
      render(<PolicyCard {...defaultProps} />)

      expect(screen.getByText('Acme Corporation')).toBeInTheDocument()
    })

    it('should render policy type', () => {
      render(<PolicyCard {...defaultProps} />)

      expect(screen.getByText('General Liability')).toBeInTheDocument()
    })

    it('should render formatted dates', () => {
      render(<PolicyCard {...defaultProps} />)

      // Dates are formatted using toLocaleDateString which may vary by timezone
      // Default props use 2024-01-01 which may render as Dec 31 or Jan 1
      expect(screen.getByText(/(Dec.*3[01].*2023|Jan.*[01].*2024)/)).toBeInTheDocument()
      expect(screen.getByText(/(Dec.*3[01].*2024|Jan.*[01].*2025)/)).toBeInTheDocument()
    })
  })

  describe('Status Display', () => {
    it('should display Active status', () => {
      render(<PolicyCard {...defaultProps} status="active" />)

      expect(screen.getByText('Active')).toBeInTheDocument()
    })

    it('should display Pending status', () => {
      render(<PolicyCard {...defaultProps} status="pending" />)

      expect(screen.getByText('Pending')).toBeInTheDocument()
    })

    it('should display Expired status', () => {
      render(<PolicyCard {...defaultProps} status="expired" />)

      expect(screen.getByText('Expired')).toBeInTheDocument()
    })

    it('should display Cancelled status', () => {
      render(<PolicyCard {...defaultProps} status="cancelled" />)

      expect(screen.getByText('Cancelled')).toBeInTheDocument()
    })
  })

  describe('Optional Fields', () => {
    it('should display premium when provided', () => {
      render(<PolicyCard {...defaultProps} premium={5000} />)

      expect(screen.getByText('$5,000')).toBeInTheDocument()
    })

    it('should display coverage limit when provided', () => {
      render(<PolicyCard {...defaultProps} coverageLimit={1000000} />)

      expect(screen.getByText('$1,000,000')).toBeInTheDocument()
    })

    it('should not display premium when not provided', () => {
      render(<PolicyCard {...defaultProps} />)

      expect(screen.queryByText('Premium:')).not.toBeInTheDocument()
    })
  })

  describe('Click Handler', () => {
    it('should call onPress when card is clicked', () => {
      const onPress = vi.fn()
      render(<PolicyCard {...defaultProps} onPress={onPress} />)

      fireEvent.click(screen.getByText('Acme Corporation'))

      expect(onPress).toHaveBeenCalled()
    })

    it('should not crash when onPress is not provided', () => {
      render(<PolicyCard {...defaultProps} />)

      expect(() => fireEvent.click(screen.getByText('Acme Corporation'))).not.toThrow()
    })
  })

  describe('Date Formatting', () => {
    it('should format dates correctly', () => {
      render(
        <PolicyCard
          {...defaultProps}
          effectiveDate="2024-06-15T12:00:00"
          expirationDate="2025-06-15T12:00:00"
        />
      )

      // Dates are formatted using toLocaleDateString which may vary by timezone
      // Use flexible regex to match Jun with any day around 15
      expect(screen.getByText(/Jun.*1[45].*2024/)).toBeInTheDocument()
      expect(screen.getByText(/Jun.*1[45].*2025/)).toBeInTheDocument()
    })
  })

  describe('Currency Formatting', () => {
    it('should format small amounts', () => {
      render(<PolicyCard {...defaultProps} premium={500} />)

      expect(screen.getByText('$500')).toBeInTheDocument()
    })

    it('should format large amounts', () => {
      render(<PolicyCard {...defaultProps} coverageLimit={2500000} />)

      expect(screen.getByText('$2,500,000')).toBeInTheDocument()
    })
  })

  describe('Combined Props', () => {
    it('should render with all optional props', () => {
      render(
        <PolicyCard
          {...defaultProps}
          premium={12000}
          coverageLimit={5000000}
        />
      )

      expect(screen.getByText('POL-12345')).toBeInTheDocument()
      expect(screen.getByText('$12,000')).toBeInTheDocument()
      expect(screen.getByText('$5,000,000')).toBeInTheDocument()
    })
  })
})
