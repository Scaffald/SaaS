/**
 * Chart component tests
 */

import React from 'react'
import { render } from '@testing-library/react-native'
import { describe, it, expect } from 'vitest'
import { ThemeProvider } from '../../playground/ThemeProvider'
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
})
