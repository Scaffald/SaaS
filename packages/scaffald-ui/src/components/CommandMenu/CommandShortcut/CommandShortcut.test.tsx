/**
 * CommandShortcut component tests
 */

import { render } from '@testing-library/react-native'
import { CommandShortcut } from './CommandShortcut'

describe('CommandShortcut', () => {
  it('renders single key shortcut', () => {
    const { getByText } = render(<CommandShortcut variant="Single" keys={['Esc']} />)
    expect(getByText('Esc')).toBeTruthy()
  })

  it('renders double key shortcut', () => {
    const { getByText } = render(<CommandShortcut variant="Double" keys={['⌘', 'K']} />)
    // On web platform, '⌘' is mapped to 'Ctrl' by the component
    expect(getByText('Ctrl')).toBeTruthy()
    expect(getByText('K')).toBeTruthy()
  })

  it('renders arrow shortcut', () => {
    const { getByText } = render(<CommandShortcut variant="Arrow" keys={['↑']} />)
    expect(getByText('↑')).toBeTruthy()
  })

  it('handles empty keys array', () => {
    const { container } = render(<CommandShortcut variant="Single" keys={[]} />)
    expect(container.children.length).toBe(0)
  })
})
