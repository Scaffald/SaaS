/**
 * CommandMenuFooter stories
 * Examples showing footer with keyboard shortcuts
 */

import type { Meta, StoryObj } from '@storybook/react'
import { CommandMenuFooter } from '../../../components/CommandMenu'

const meta = {
  title: 'CommandMenu/CommandMenuFooter',
  component: CommandMenuFooter,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof CommandMenuFooter>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {},
}

export const NavigationOnly: Story = {
  args: {
    navigationHint: true,
    closeHint: false,
  },
}

export const CloseOnly: Story = {
  args: {
    navigationHint: false,
    closeHint: true,
  },
}

export const CustomHints: Story = {
  args: {
    navigationHint: true,
    closeHint: true,
    customHints: [
      { keys: ['⌘', 'P'], label: 'Print', variant: 'Double' },
      { keys: ['⌘', 'S'], label: 'Save', variant: 'Double' },
    ],
  },
}

export const ExtendedHints: Story = {
  args: {
    navigationHint: true,
    closeHint: true,
    customHints: [
      { keys: ['⌘', 'P'], label: 'Print' },
      { keys: ['⌘', 'S'], label: 'Save' },
      { keys: ['⌘', 'Z'], label: 'Undo' },
      { keys: ['⌘', 'Y'], label: 'Redo' },
      { keys: ['⌘', 'F'], label: 'Find' },
    ],
  },
}

export const WithoutNavigation: Story = {
  args: {
    navigationHint: false,
    closeHint: true,
    customHints: [
      { keys: ['?'], label: 'Help', variant: 'Single' },
    ],
  },
}
