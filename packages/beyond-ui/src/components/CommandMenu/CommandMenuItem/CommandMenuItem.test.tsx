/**
 * CommandMenuItem component tests
 */

import { render } from '@testing-library/react-native'
import { CommandMenuItem } from './CommandMenuItem'

describe('CommandMenuItem', () => {
  it('renders with title', () => {
    const { getByText } = render(<CommandMenuItem title="Test Item" />)
    expect(getByText('Test Item')).toBeTruthy()
  })

  it('renders with subtitle', () => {
    const { getByText } = render(
      <CommandMenuItem title="Test Item" subtitle="Test Subtitle" />
    )
    expect(getByText('Test Item')).toBeTruthy()
    expect(getByText('Test Subtitle')).toBeTruthy()
  })

  it('renders with shortcut', () => {
    const { getByText } = render(
      <CommandMenuItem title="Test Item" shortcut={['⌘', 'K']} />
    )
    expect(getByText('Test Item')).toBeTruthy()
  })
})
