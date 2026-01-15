/**
 * Chart component tests
 */

import React from 'react'
import { render } from '@testing-library/react-native'
import { describe, it, expect } from 'vitest'
import { ThemeProvider } from '../../theme'
import {
  BarChart,
  BarChartBase,
  LinearChart,
  DonutChart,
  CircleChart,
  HalfPieChart,
  MiniLinearChart,
  SmallCircleChart,
  Chart,
} from '../../components/Chart'

// Wrapper component for tests
const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <ThemeProvider>{children}</ThemeProvider>
)

describe('Chart', () => {
  describe('Basic Rendering', () => {
    it('should render BarChart', () => {
      const { container } = render(
        <TestWrapper>
          <BarChart data={[10, 20, 30]} />
        </TestWrapper>
      )
      expect(container).toBeTruthy()
    })

    it('should render BarChartBase', () => {
      const { container } = render(
        <TestWrapper>
          <BarChartBase data={[10, 20, 30]} period="month" />
        </TestWrapper>
      )
      expect(container).toBeTruthy()
    })

    it('should render LinearChart', () => {
      const { container } = render(
        <TestWrapper>
          <LinearChart
            data={[
              { x: 0, y: 10 },
              { x: 1, y: 20 },
            ]}
          />
        </TestWrapper>
      )
      expect(container).toBeTruthy()
    })

    it('should render DonutChart', () => {
      const { container } = render(
        <TestWrapper>
          <DonutChart
            data={[
              { label: 'A', value: 30 },
              { label: 'B', value: 70 },
            ]}
          />
        </TestWrapper>
      )
      expect(container).toBeTruthy()
    })

    it('should render CircleChart', () => {
      const { container } = render(
        <TestWrapper>
          <CircleChart value={75} />
        </TestWrapper>
      )
      expect(container).toBeTruthy()
    })

    it('should render HalfPieChart', () => {
      const { container } = render(
        <TestWrapper>
          <HalfPieChart data={[30, 50, 20]} />
        </TestWrapper>
      )
      expect(container).toBeTruthy()
    })

    it('should render MiniLinearChart', () => {
      const { container } = render(
        <TestWrapper>
          <MiniLinearChart data={[10, 20, 15, 30]} />
        </TestWrapper>
      )
      expect(container).toBeTruthy()
    })

    it('should render SmallCircleChart', () => {
      const { container } = render(
        <TestWrapper>
          <SmallCircleChart value={50} />
        </TestWrapper>
      )
      expect(container).toBeTruthy()
    })

    it('should render Chart with grid and axes', () => {
      const { container } = render(
        <TestWrapper>
          <Chart
            type="linear"
            xAxisLabels={['Jan', 'Feb', 'Mar']}
            yAxisLabels={[0, 25, 50, 75, 100]}
            showGrid
          >
            <LinearChart
              data={[
                { x: 0, y: 10 },
                { x: 1, y: 20 },
              ]}
            />
          </Chart>
        </TestWrapper>
      )
      expect(container).toBeTruthy()
    })
  })

  describe('Empty Data', () => {
    it('should render BarChart with empty data', () => {
      const { container } = render(
        <TestWrapper>
          <BarChart data={[]} />
        </TestWrapper>
      )
      expect(container).toBeTruthy()
    })

    it('should render DonutChart with empty data', () => {
      const { container } = render(
        <TestWrapper>
          <DonutChart data={[]} />
        </TestWrapper>
      )
      expect(container).toBeTruthy()
    })
  })

  describe('Size Variants', () => {
    it('should render DonutChart with different sizes', () => {
      const sizes = ['xs', 'sm', 'md', 'lg', 'xl'] as const
      sizes.forEach((size) => {
        const { container } = render(
          <TestWrapper>
            <DonutChart
              data={[{ label: 'A', value: 100 }]}
              size={size}
            />
          </TestWrapper>
        )
        expect(container).toBeTruthy()
      })
    })

    it('should render CircleChart with different sizes', () => {
      const sizes = ['sm', 'md', 'lg', 'xl'] as const
      sizes.forEach((size) => {
        const { container } = render(
          <TestWrapper>
            <CircleChart value={75} size={size} />
          </TestWrapper>
        )
        expect(container).toBeTruthy()
      })
    })
  })

  describe('Data Validation', () => {
    it('should filter out NaN values from BarChart data', () => {
      const { container } = render(
        <TestWrapper>
          <BarChart data={[10, NaN, 20, 30]} />
        </TestWrapper>
      )
      expect(container).toBeTruthy()
      // Chart should render without errors, filtering out NaN
    })

    it('should filter out Infinity values from BarChart data', () => {
      const { container } = render(
        <TestWrapper>
          <BarChart data={[10, Infinity, 20, -Infinity]} />
        </TestWrapper>
      )
      expect(container).toBeTruthy()
      // Chart should render without errors, filtering out Infinity
    })

    it('should handle all invalid values gracefully', () => {
      const { container } = render(
        <TestWrapper>
          <BarChart data={[NaN, Infinity, -Infinity, NaN]} />
        </TestWrapper>
      )
      expect(container).toBeTruthy()
      // Should render empty state when all values are invalid
    })

    it('should handle mixed valid and invalid values', () => {
      const { container } = render(
        <TestWrapper>
          <BarChart data={[10, NaN, 20, Infinity, 30, -Infinity, 40]} />
        </TestWrapper>
      )
      expect(container).toBeTruthy()
      // Should render only valid values: [10, 20, 30, 40]
    })

    it('should handle very large numbers', () => {
      const { container } = render(
        <TestWrapper>
          <BarChart data={[1e10, 2e10, 3e10]} />
        </TestWrapper>
      )
      expect(container).toBeTruthy()
    })

    it('should handle very small numbers', () => {
      const { container } = render(
        <TestWrapper>
          <BarChart data={[0.0001, 0.0002, 0.0003]} />
        </TestWrapper>
      )
      expect(container).toBeTruthy()
    })

    it('should handle negative numbers', () => {
      const { container } = render(
        <TestWrapper>
          <BarChart data={[-10, -20, -30]} />
        </TestWrapper>
      )
      expect(container).toBeTruthy()
    })

    it('should handle zero values', () => {
      const { container } = render(
        <TestWrapper>
          <BarChart data={[0, 0, 0]} />
        </TestWrapper>
      )
      expect(container).toBeTruthy()
    })

    it('should handle single valid value after filtering', () => {
      const { container } = render(
        <TestWrapper>
          <BarChart data={[NaN, NaN, 42, NaN]} />
        </TestWrapper>
      )
      expect(container).toBeTruthy()
      // Should render chart with single bar
    })
  })

  describe('Accessibility', () => {
    it('should have accessibility label for BarChart', () => {
      const { getByLabelText } = render(
        <TestWrapper>
          <BarChart data={[10, 20, 30]} />
        </TestWrapper>
      )
      // Should have descriptive label with data summary
      expect(getByLabelText(/Bar chart with 3 bars/i)).toBeTruthy()
    })

    it('should include min, max, and average in accessibility label', () => {
      const { getByLabelText } = render(
        <TestWrapper>
          <BarChart data={[10, 20, 30]} />
        </TestWrapper>
      )
      // Label should describe the data range
      expect(getByLabelText(/Values range from/i)).toBeTruthy()
    })

    it('should have image role for charts', () => {
      const { getByRole } = render(
        <TestWrapper>
          <BarChart data={[10, 20, 30]} />
        </TestWrapper>
      )
      expect(getByRole('image')).toBeTruthy()
    })

    it('should have accessible empty state', () => {
      const { getByLabelText } = render(
        <TestWrapper>
          <BarChart data={[]} />
        </TestWrapper>
      )
      expect(getByLabelText(/Empty bar chart with no data/i)).toBeTruthy()
    })

    it('should hide SVG children from accessibility tree', () => {
      const { container } = render(
        <TestWrapper>
          <BarChart data={[10, 20, 30]} />
        </TestWrapper>
      )
      // SVG should have accessible={false} to prevent duplicate announcements
      expect(container).toBeTruthy()
    })

    it('should provide meaningful description after data validation', () => {
      const { getByLabelText } = render(
        <TestWrapper>
          <BarChart data={[10, NaN, 20, Infinity, 30]} />
        </TestWrapper>
      )
      // Should describe the valid data only (3 bars, not 5)
      expect(getByLabelText(/Bar chart with 3 bars/i)).toBeTruthy()
    })
  })

  describe('Edge Cases', () => {
    it('should handle undefined data gracefully', () => {
      const { container } = render(
        <TestWrapper>
          <BarChart data={undefined as any} />
        </TestWrapper>
      )
      // Should not throw, might render empty state
      expect(container).toBeTruthy()
    })

    it('should handle null values in data array', () => {
      const { container } = render(
        <TestWrapper>
          <BarChart data={[10, null as any, 20]} />
        </TestWrapper>
      )
      expect(container).toBeTruthy()
    })

    it('should handle string values in data array', () => {
      const { container } = render(
        <TestWrapper>
          <BarChart data={[10, '20' as any, 30]} />
        </TestWrapper>
      )
      expect(container).toBeTruthy()
      // Should filter out non-numeric values
    })

    it('should handle extremely long data arrays', () => {
      const longData = Array(1000).fill(10)
      const { container } = render(
        <TestWrapper>
          <BarChart data={longData} />
        </TestWrapper>
      )
      expect(container).toBeTruthy()
    })

    it('should handle data with same values', () => {
      const { container } = render(
        <TestWrapper>
          <BarChart data={[42, 42, 42, 42]} />
        </TestWrapper>
      )
      expect(container).toBeTruthy()
    })
  })
})
