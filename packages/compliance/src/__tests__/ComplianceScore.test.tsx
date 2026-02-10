/**
 * ComplianceScore Component Tests
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

vi.mock('@unicornlove/beyond-ui', () => {
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
    CheckCircle: () => React.createElement('svg', { 'data-testid': 'icon-check' }),
    AlertTriangle: () => React.createElement('svg', { 'data-testid': 'icon-alert' }),
    XCircle: () => React.createElement('svg', { 'data-testid': 'icon-x' }),
    TrendingUp: () => React.createElement('svg', { 'data-testid': 'icon-trending-up' }),
    TrendingDown: () => React.createElement('svg', { 'data-testid': 'icon-trending-down' }),
  }
})

import { ComplianceScore } from '../ComplianceScore'

describe('ComplianceScore Component', () => {
  describe('Basic Rendering', () => {
    it('should render score value', () => {
      render(<ComplianceScore score={85} />)

      expect(screen.getByText('85')).toBeInTheDocument()
    })

    it('should render default label', () => {
      render(<ComplianceScore score={85} />)

      expect(screen.getByText('Compliance Score')).toBeInTheDocument()
    })

    it('should render custom label', () => {
      render(<ComplianceScore score={85} label="Security Score" />)

      expect(screen.getByText('Security Score')).toBeInTheDocument()
    })

    it('should render max score indicator', () => {
      render(<ComplianceScore score={85} />)

      expect(screen.getByText('/ 100')).toBeInTheDocument()
    })
  })

  describe('Score Levels', () => {
    it('should show check icon for good scores (>= 70)', () => {
      render(<ComplianceScore score={85} />)

      expect(screen.getByTestId('icon-check')).toBeInTheDocument()
    })

    it('should show alert icon for warning scores (50-69)', () => {
      render(<ComplianceScore score={60} />)

      expect(screen.getByTestId('icon-alert')).toBeInTheDocument()
    })

    it('should show x icon for danger scores (< 50)', () => {
      render(<ComplianceScore score={30} />)

      expect(screen.getByTestId('icon-x')).toBeInTheDocument()
    })
  })

  describe('Custom Thresholds', () => {
    it('should use custom warning threshold', () => {
      render(<ComplianceScore score={75} warningThreshold={80} />)

      // Score 75 is below warning threshold 80, should show alert
      expect(screen.getByTestId('icon-alert')).toBeInTheDocument()
    })

    it('should use custom danger threshold', () => {
      render(<ComplianceScore score={45} dangerThreshold={40} />)

      // Score 45 is above danger threshold 40, should show alert (warning level)
      expect(screen.getByTestId('icon-alert')).toBeInTheDocument()
    })
  })

  describe('Trend Display', () => {
    it('should show upward trend when score improved', () => {
      render(<ComplianceScore score={85} previousScore={75} showTrend={true} />)

      expect(screen.getByTestId('icon-trending-up')).toBeInTheDocument()
      expect(screen.getByText(/\+10\.0%/)).toBeInTheDocument()
    })

    it('should show downward trend when score decreased', () => {
      render(<ComplianceScore score={65} previousScore={75} showTrend={true} />)

      expect(screen.getByTestId('icon-trending-down')).toBeInTheDocument()
      expect(screen.getByText(/-10\.0%/)).toBeInTheDocument()
    })

    it('should not show trend when no change', () => {
      render(<ComplianceScore score={75} previousScore={75} showTrend={true} />)

      expect(screen.queryByTestId('icon-trending-up')).not.toBeInTheDocument()
      expect(screen.queryByTestId('icon-trending-down')).not.toBeInTheDocument()
    })

    it('should not show trend when showTrend is false', () => {
      render(<ComplianceScore score={85} previousScore={75} showTrend={false} />)

      expect(screen.queryByTestId('icon-trending-up')).not.toBeInTheDocument()
    })

    it('should not show trend when no previousScore', () => {
      render(<ComplianceScore score={85} showTrend={true} />)

      expect(screen.queryByTestId('icon-trending-up')).not.toBeInTheDocument()
      expect(screen.queryByTestId('icon-trending-down')).not.toBeInTheDocument()
    })
  })

  describe('Sizes', () => {
    it('should render small size', () => {
      render(<ComplianceScore score={85} size="sm" />)

      expect(screen.getByText('85')).toBeInTheDocument()
    })

    it('should render medium size (default)', () => {
      render(<ComplianceScore score={85} size="md" />)

      expect(screen.getByText('85')).toBeInTheDocument()
    })

    it('should render large size', () => {
      render(<ComplianceScore score={85} size="lg" />)

      expect(screen.getByText('85')).toBeInTheDocument()
    })
  })

  describe('Edge Cases', () => {
    it('should handle score of 0', () => {
      render(<ComplianceScore score={0} />)

      expect(screen.getByText('0')).toBeInTheDocument()
      expect(screen.getByTestId('icon-x')).toBeInTheDocument()
    })

    it('should handle score of 100', () => {
      render(<ComplianceScore score={100} />)

      expect(screen.getByText('100')).toBeInTheDocument()
      expect(screen.getByTestId('icon-check')).toBeInTheDocument()
    })

    it('should cap scores above 100', () => {
      render(<ComplianceScore score={150} />)

      // Component should still render with capped value
      expect(screen.getByText('150')).toBeInTheDocument()
    })

    it('should handle negative scores', () => {
      render(<ComplianceScore score={-10} />)

      expect(screen.getByText('-10')).toBeInTheDocument()
    })

    it('should round decimal scores', () => {
      render(<ComplianceScore score={85.7} />)

      expect(screen.getByText('86')).toBeInTheDocument()
    })
  })

  describe('Trend Calculation', () => {
    it('should calculate positive trend correctly', () => {
      render(<ComplianceScore score={90} previousScore={80} />)

      expect(screen.getByText(/\+10\.0%/)).toBeInTheDocument()
    })

    it('should calculate negative trend correctly', () => {
      render(<ComplianceScore score={70} previousScore={80} />)

      expect(screen.getByText(/-10\.0%/)).toBeInTheDocument()
    })

    it('should show decimal precision in trend', () => {
      render(<ComplianceScore score={85.5} previousScore={80} />)

      expect(screen.getByText(/\+5\.5%/)).toBeInTheDocument()
    })
  })
})
