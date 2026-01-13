/**
 * MetricWidget component tests
 */

import { render } from '@testing-library/react-native'
import { MetricWidget } from './MetricWidget'

describe('MetricWidget', () => {
  it('renders metric with title and value', () => {
    const { getByText } = render(<MetricWidget title="Test Metric" value={100} />)

    expect(getByText('Test Metric')).toBeTruthy()
    expect(getByText('100')).toBeTruthy()
  })

  it('renders chart variant with chart data', () => {
    const { getByText } = render(
      <MetricWidget
        type="Chart 01"
        title="Test Metric"
        value={100}
        chartData={[10, 20, 30]}
      />
    )

    expect(getByText('Test Metric')).toBeTruthy()
  })
})
