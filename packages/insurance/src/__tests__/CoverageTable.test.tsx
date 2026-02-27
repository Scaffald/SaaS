/**
 * CoverageTable Component Tests
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

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
    Check: () => React.createElement('svg', { 'data-testid': 'icon-check' }),
    X: () => React.createElement('svg', { 'data-testid': 'icon-x' }),
    AlertCircle: () => React.createElement('svg', { 'data-testid': 'icon-alert' }),
  }
})

import { CoverageTable, type Coverage } from '../CoverageTable'

const mockCoverages: Coverage[] = [
  {
    id: '1',
    name: 'Bodily Injury',
    description: 'Coverage for bodily injury claims',
    limit: 1000000,
    deductible: 5000,
    included: true,
  },
  {
    id: '2',
    name: 'Property Damage',
    limit: 500000,
    deductible: 2500,
    included: true,
  },
  {
    id: '3',
    name: 'Medical Payments',
    limit: 10000,
    included: false,
    notes: 'Optional coverage',
  },
]

describe('CoverageTable Component', () => {
  describe('Basic Rendering', () => {
    it('should render coverage names', () => {
      render(<CoverageTable coverages={mockCoverages} />)

      expect(screen.getByText('Bodily Injury')).toBeInTheDocument()
      expect(screen.getByText('Property Damage')).toBeInTheDocument()
      expect(screen.getByText('Medical Payments')).toBeInTheDocument()
    })

    it('should render table headers', () => {
      render(<CoverageTable coverages={mockCoverages} />)

      expect(screen.getByText('Coverage')).toBeInTheDocument()
      expect(screen.getByText('Limit')).toBeInTheDocument()
      expect(screen.getByText('Status')).toBeInTheDocument()
    })

    it('should render title when provided', () => {
      render(<CoverageTable coverages={mockCoverages} title="Coverage Details" />)

      expect(screen.getByText('Coverage Details')).toBeInTheDocument()
    })

    it('should not render title when not provided', () => {
      render(<CoverageTable coverages={mockCoverages} />)

      expect(screen.queryByText('Coverage Details')).not.toBeInTheDocument()
    })
  })

  describe('Coverage Values', () => {
    it('should display formatted limit values', () => {
      render(<CoverageTable coverages={mockCoverages} />)

      expect(screen.getByText('$1,000,000')).toBeInTheDocument()
      expect(screen.getByText('$500,000')).toBeInTheDocument()
      expect(screen.getByText('$10,000')).toBeInTheDocument()
    })

    it('should display formatted deductible values', () => {
      render(<CoverageTable coverages={mockCoverages} showDeductible={true} />)

      expect(screen.getByText('$5,000')).toBeInTheDocument()
      expect(screen.getByText('$2,500')).toBeInTheDocument()
    })

    it('should display string limits as-is', () => {
      const coveragesWithString: Coverage[] = [
        {
          id: '1',
          name: 'Liability Coverage',
          limit: 'Per Occurrence',
          included: true,
        },
      ]
      render(<CoverageTable coverages={coveragesWithString} />)

      expect(screen.getByText('Per Occurrence')).toBeInTheDocument()
    })
  })

  describe('Deductible Column', () => {
    it('should show deductible column by default', () => {
      render(<CoverageTable coverages={mockCoverages} />)

      expect(screen.getByText('Deductible')).toBeInTheDocument()
    })

    it('should hide deductible column when showDeductible is false', () => {
      render(<CoverageTable coverages={mockCoverages} showDeductible={false} />)

      expect(screen.queryByText('Deductible')).not.toBeInTheDocument()
    })
  })

  describe('Premium Column', () => {
    it('should not show premium column by default', () => {
      render(<CoverageTable coverages={mockCoverages} />)

      expect(screen.queryByText('Premium')).not.toBeInTheDocument()
    })

    it('should show premium column when showPremium is true', () => {
      render(<CoverageTable coverages={mockCoverages} showPremium={true} />)

      expect(screen.getByText('Premium')).toBeInTheDocument()
    })

    it('should display premium values when available', () => {
      const coveragesWithPremium: Coverage[] = [
        {
          id: '1',
          name: 'Coverage A',
          limit: 100000,
          premium: 1500,
          included: true,
        },
      ]
      render(<CoverageTable coverages={coveragesWithPremium} showPremium={true} />)

      expect(screen.getByText('$1,500')).toBeInTheDocument()
    })
  })

  describe('Description', () => {
    it('should display description when provided', () => {
      render(<CoverageTable coverages={mockCoverages} />)

      expect(screen.getByText('Coverage for bodily injury claims')).toBeInTheDocument()
    })
  })

  describe('Notes', () => {
    it('should display notes when provided', () => {
      render(<CoverageTable coverages={mockCoverages} />)

      expect(screen.getByText('Optional coverage')).toBeInTheDocument()
    })

    it('should show alert icon with notes', () => {
      render(<CoverageTable coverages={mockCoverages} />)

      expect(screen.getByTestId('icon-alert')).toBeInTheDocument()
    })
  })

  describe('Included Status', () => {
    it('should show check icon for included coverages', () => {
      render(<CoverageTable coverages={mockCoverages} />)

      // Two included coverages
      const checkIcons = screen.getAllByTestId('icon-check')
      expect(checkIcons.length).toBeGreaterThanOrEqual(2)
    })

    it('should show x icon for excluded coverages', () => {
      render(<CoverageTable coverages={mockCoverages} />)

      expect(screen.getByTestId('icon-x')).toBeInTheDocument()
    })
  })

  describe('Empty State', () => {
    it('should render empty table without crashing', () => {
      render(<CoverageTable coverages={[]} />)

      expect(screen.getByText('Coverage')).toBeInTheDocument()
    })
  })

  describe('Single Coverage', () => {
    it('should render single coverage correctly', () => {
      const singleCoverage: Coverage[] = [
        {
          id: '1',
          name: 'Single Coverage',
          limit: 250000,
          included: true,
        },
      ]
      render(<CoverageTable coverages={singleCoverage} />)

      expect(screen.getByText('Single Coverage')).toBeInTheDocument()
      expect(screen.getByText('$250,000')).toBeInTheDocument()
    })
  })
})
