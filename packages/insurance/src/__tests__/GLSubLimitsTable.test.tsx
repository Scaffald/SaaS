/**
 * GLSubLimitsTable Component Tests - @frs/insurance
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { GLSubLimitsTable, type GLSubLimitItem } from '../GLSubLimitsTable'

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

// Mock Lucide icons
vi.mock('lucide-react-native', () => ({
  Check: () => <span data-testid="icon-check">✓</span>,
  X: () => <span data-testid="icon-x">✗</span>,
  AlertCircle: () => <span data-testid="icon-alert-circle">⚠</span>,
  AlertTriangle: () => <span data-testid="icon-alert-triangle">△</span>,
}))

// Test data
const validItems: GLSubLimitItem[] = [
  {
    id: '1',
    name: 'Per Occurrence',
    provision_type: 'per_occurrence',
    requirement: 'Min $1,000,000',
    current_value: 1000000,
    formatted_value: '$1,000,000',
    is_valid: true,
    severity: 'success',
  },
  {
    id: '2',
    name: 'General Aggregate',
    provision_type: 'general_aggregate',
    requirement: 'Min $2,000,000',
    current_value: 2000000,
    formatted_value: '$2,000,000',
    is_valid: true,
    severity: 'success',
  },
]

const itemsWithErrors: GLSubLimitItem[] = [
  {
    id: '1',
    name: 'Per Occurrence',
    provision_type: 'per_occurrence',
    requirement: 'Min $1,000,000',
    current_value: 500000,
    formatted_value: '$500,000',
    is_valid: false,
    severity: 'error',
    message: 'Limit $500,000 is below required minimum of $1,000,000',
  },
  {
    id: '2',
    name: 'General Aggregate',
    provision_type: 'general_aggregate',
    requirement: 'Min $2,000,000',
    current_value: 2000000,
    formatted_value: '$2,000,000',
    is_valid: true,
    severity: 'success',
  },
]

describe('GLSubLimitsTable Component', () => {
  describe('Basic Rendering', () => {
    it('should render table with title', () => {
      render(<GLSubLimitsTable items={validItems} title="GL Coverage Details" />)

      expect(screen.getByText('GL Coverage Details')).toBeInTheDocument()
    })

    it('should render all provision items', () => {
      render(<GLSubLimitsTable items={validItems} />)

      expect(screen.getByText('Per Occurrence')).toBeInTheDocument()
      expect(screen.getByText('General Aggregate')).toBeInTheDocument()
    })

    it('should display requirement values', () => {
      render(<GLSubLimitsTable items={validItems} />)

      expect(screen.getByText('Min $1,000,000')).toBeInTheDocument()
      expect(screen.getByText('Min $2,000,000')).toBeInTheDocument()
    })

    it('should display formatted current values', () => {
      render(<GLSubLimitsTable items={validItems} />)

      expect(screen.getAllByText('$1,000,000')).toHaveLength(1)
      expect(screen.getAllByText('$2,000,000')).toHaveLength(1)
    })
  })

  describe('Validation Status Display', () => {
    it('should show OK status for valid provisions', () => {
      render(<GLSubLimitsTable items={validItems} />)

      const okBadges = screen.getAllByText('OK')
      expect(okBadges).toHaveLength(2)
    })

    it('should show Failed status for invalid provisions', () => {
      render(<GLSubLimitsTable items={itemsWithErrors} />)

      expect(screen.getByText('Failed')).toBeInTheDocument()
    })

    it('should display error message for failed provisions', () => {
      render(<GLSubLimitsTable items={itemsWithErrors} />)

      expect(
        screen.getByText('Limit $500,000 is below required minimum of $1,000,000')
      ).toBeInTheDocument()
    })
  })

  describe('Red Flag Banner', () => {
    it('should show red flag banner when errors exist', () => {
      render(<GLSubLimitsTable items={itemsWithErrors} />)

      expect(screen.getByText(/1 provision does not meet minimum requirements/)).toBeInTheDocument()
    })

    it('should show issue count badge in header when errors exist', () => {
      render(<GLSubLimitsTable items={itemsWithErrors} title="GL Coverage" />)

      expect(screen.getByText('1 Issue')).toBeInTheDocument()
    })

    it('should not show red flag banner when all valid', () => {
      render(<GLSubLimitsTable items={validItems} />)

      expect(screen.queryByText(/does not meet minimum requirements/)).not.toBeInTheDocument()
    })
  })

  describe('Loading State', () => {
    it('should display loading spinner when isLoading is true', () => {
      render(<GLSubLimitsTable items={[]} isLoading={true} />)

      expect(screen.getByTestId('spinner')).toBeInTheDocument()
      expect(screen.getByText('Loading coverage details...')).toBeInTheDocument()
    })

    it('should not render items while loading', () => {
      render(<GLSubLimitsTable items={validItems} isLoading={true} />)

      expect(screen.queryByText('Per Occurrence')).not.toBeInTheDocument()
    })
  })

  describe('Error State', () => {
    it('should display error message when error prop is set', () => {
      render(
        <GLSubLimitsTable items={[]} error="Failed to load coverage details. Please try again." />
      )

      expect(screen.getByText('Failed to load coverage details')).toBeInTheDocument()
      expect(
        screen.getByText('Failed to load coverage details. Please try again.')
      ).toBeInTheDocument()
    })

    it('should not render items when error exists', () => {
      render(<GLSubLimitsTable items={validItems} error="Error occurred" />)

      expect(screen.queryByText('Per Occurrence')).not.toBeInTheDocument()
    })
  })

  describe('Empty State', () => {
    it('should display empty message when no items', () => {
      render(<GLSubLimitsTable items={[]} />)

      expect(screen.getByText('No coverage provisions found')).toBeInTheDocument()
    })
  })

  describe('Interactivity', () => {
    it('should call onItemPress when row is clicked', () => {
      const handlePress = vi.fn()

      render(<GLSubLimitsTable items={validItems} onItemPress={handlePress} />)

      // Find and click on the first provision row
      const perOccurrenceText = screen.getByText('Per Occurrence')
      const row = perOccurrenceText.closest('[data-name="GLSubLimitsTableRow"]')
      if (row) {
        fireEvent.click(row)
        expect(handlePress).toHaveBeenCalledTimes(1)
        expect(handlePress).toHaveBeenCalledWith(
          expect.objectContaining({
            id: '1',
            name: 'Per Occurrence',
          })
        )
      }
    })
  })

  describe('Multiple Errors', () => {
    it('should show correct plural form for multiple issues', () => {
      const multipleErrors: GLSubLimitItem[] = [
        ...itemsWithErrors,
        {
          id: '3',
          name: 'Auto Symbol',
          provision_type: 'auto_symbol',
          requirement: '1 or 7,8,9',
          current_value: '5',
          formatted_value: '5',
          is_valid: false,
          severity: 'error',
          message: 'Invalid value',
        },
      ]

      render(<GLSubLimitsTable items={multipleErrors} title="GL Coverage" />)

      expect(screen.getByText('2 Issues')).toBeInTheDocument()
      expect(
        screen.getByText(/2 provisions do not meet minimum requirements/)
      ).toBeInTheDocument()
    })
  })
})
