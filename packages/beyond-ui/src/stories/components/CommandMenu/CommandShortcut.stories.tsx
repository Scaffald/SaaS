/**
 * CommandShortcut stories
 * Examples showing different keyboard shortcut formats
 */

import type { Meta, StoryObj } from '@storybook/react'
import { View } from 'react-native'
import { CommandShortcut } from '../../../components/CommandMenu'

const meta = {
  title: 'CommandMenu/CommandShortcut',
  component: CommandShortcut,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof CommandShortcut>

export default meta
type Story = StoryObj<typeof meta>

const Container = ({ children }: { children: React.ReactNode }) => (
  <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
    {children}
  </View>
)

export const Single: Story = {
  render: () => (
    <Container>
      <CommandShortcut variant="Single" keys={['Esc']} />
      <CommandShortcut variant="Single" keys={['K']} />
      <CommandShortcut variant="Single" keys={['Enter']} />
      <CommandShortcut variant="Single" keys={['Tab']} />
    </Container>
  ),
}

export const Double: Story = {
  render: () => (
    <Container>
      <CommandShortcut variant="Double" keys={['⌘', 'K']} />
      <CommandShortcut variant="Double" keys={['⌘', 'P']} />
      <CommandShortcut variant="Double" keys={['Ctrl', 'C']} />
      <CommandShortcut variant="Double" keys={['⌘', 'S']} />
    </Container>
  ),
}

export const Arrow: Story = {
  render: () => (
    <Container>
      <CommandShortcut variant="Arrow" keys={['↑']} />
      <CommandShortcut variant="Arrow" keys={['↓']} />
      <CommandShortcut variant="Arrow" keys={['←']} />
      <CommandShortcut variant="Arrow" keys={['→']} />
      <CommandShortcut variant="Arrow" keys={['ArrowUp']} />
      <CommandShortcut variant="Arrow" keys={['ArrowDown']} />
    </Container>
  ),
}

export const AllVariants: Story = {
  render: () => (
    <View style={{ gap: 16, alignItems: 'flex-start' }}>
      <View style={{ gap: 8 }}>
        <CommandShortcut variant="Single" keys={['Esc']} />
        <CommandShortcut variant="Single" keys={['Enter']} />
      </View>
      <View style={{ gap: 8 }}>
        <CommandShortcut variant="Double" keys={['⌘', 'K']} />
        <CommandShortcut variant="Double" keys={['Ctrl', 'C']} />
        <CommandShortcut variant="Double" keys={['⌘', 'S']} />
      </View>
      <View style={{ gap: 8, flexDirection: 'row' }}>
        <CommandShortcut variant="Arrow" keys={['↑']} />
        <CommandShortcut variant="Arrow" keys={['↓']} />
      </View>
    </View>
  ),
}

export const CommonShortcuts: Story = {
  render: () => (
    <View style={{ gap: 12, alignItems: 'flex-start' }}>
      <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
        <CommandShortcut variant="Double" keys={['⌘', 'K']} />
        <CommandShortcut variant="Single" keys={['Esc']} />
        <CommandShortcut variant="Double" keys={['⌘', 'P']} />
      </View>
      <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
        <CommandShortcut variant="Double" keys={['⌘', 'S']} />
        <CommandShortcut variant="Double" keys={['Ctrl', 'C']} />
        <CommandShortcut variant="Double" keys={['Ctrl', 'V']} />
      </View>
      <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
        <CommandShortcut variant="Arrow" keys={['↑']} />
        <CommandShortcut variant="Arrow" keys={['↓']} />
        <CommandShortcut variant="Single" keys={['Enter']} />
      </View>
    </View>
  ),
}
