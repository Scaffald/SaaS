/**
 * CommandMenuItem stories
 * Comprehensive examples showing all variants and states
 */

import type { Meta, StoryObj } from '@storybook/react'
import { View } from 'react-native'
import { CommandMenuItem } from '../../../components/CommandMenu'
import { User, File, Settings, Search, Home, Mail, Calendar } from 'lucide-react-native'

const meta = {
  title: 'CommandMenu/CommandMenuItem',
  component: CommandMenuItem,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof CommandMenuItem>

export default meta
type Story = StoryObj<typeof meta>

const Container = ({ children }: { children: React.ReactNode }) => (
  <View style={{ width: 400, gap: 8 }}>{children}</View>
)

export const AvatarVertical: Story = {
  render: () => (
    <Container>
      <CommandMenuItem
        type="Avatar"
        textOrientation="Vertical"
        title="Anna Taylor"
        subtitle="@annataylor"
        avatar={{ src: 'https://i.pravatar.cc/150?img=1', size: 32 }}
        shortcut={['⌘', 'K']}
      />
    </Container>
  ),
}

export const AvatarHorizontal: Story = {
  render: () => (
    <Container>
      <CommandMenuItem
        type="Avatar"
        textOrientation="Horizontal"
        title="Theresa Webb"
        subtitle="@theresawebb"
        avatar={{ src: 'https://i.pravatar.cc/150?img=2', size: 32 }}
      />
    </Container>
  ),
}

export const IconVertical: Story = {
  render: () => (
    <Container>
      <CommandMenuItem
        type="Icon"
        textOrientation="Vertical"
        title="User Profile"
        subtitle="View your profile settings"
        icon={User}
        shortcut={['⌘', 'P']}
      />
    </Container>
  ),
}

export const IconHorizontal: Story = {
  render: () => (
    <Container>
      <CommandMenuItem
        type="Icon"
        textOrientation="Horizontal"
        title="Files"
        subtitle="Browse your files"
        icon={File}
      />
    </Container>
  ),
}

export const EmptyVertical: Story = {
  render: () => (
    <Container>
      <CommandMenuItem
        type="Empty"
        textOrientation="Vertical"
        title="Empty Item"
        subtitle="No icon or avatar"
      />
    </Container>
  ),
}

export const EmptyHorizontal: Story = {
  render: () => (
    <Container>
      <CommandMenuItem
        type="Empty"
        textOrientation="Horizontal"
        title="Simple Item"
        subtitle="Horizontal layout"
      />
    </Container>
  ),
}

export const States: Story = {
  render: () => (
    <Container>
      <CommandMenuItem
        type="Avatar"
        textOrientation="Horizontal"
        title="Default State"
        subtitle="@user"
        avatar={{ src: 'https://i.pravatar.cc/150?img=3', size: 32 }}
        state="Default"
      />
      <CommandMenuItem
        type="Icon"
        textOrientation="Horizontal"
        title="Hover State"
        subtitle="Hovered item"
        icon={Search}
        state="Hover"
      />
      <CommandMenuItem
        type="Icon"
        textOrientation="Horizontal"
        title="Focused State"
        subtitle="Currently focused"
        icon={Settings}
        state="Focused"
      />
    </Container>
  ),
}

export const WithShortcuts: Story = {
  render: () => (
    <Container>
      <CommandMenuItem
        type="Icon"
        textOrientation="Horizontal"
        title="Home"
        subtitle="Go to home page"
        icon={Home}
        shortcut={['⌘', 'H']}
      />
      <CommandMenuItem
        type="Icon"
        textOrientation="Horizontal"
        title="Search"
        subtitle="Open search"
        icon={Search}
        shortcut={['⌘', 'K']}
      />
      <CommandMenuItem
        type="Icon"
        textOrientation="Horizontal"
        title="Messages"
        subtitle="View messages"
        icon={Mail}
        shortcut={['⌘', 'M']}
      />
      <CommandMenuItem
        type="Icon"
        textOrientation="Horizontal"
        title="Calendar"
        subtitle="Open calendar"
        icon={Calendar}
        shortcut={['⌘', 'C']}
      />
    </Container>
  ),
}

export const WithoutShortcuts: Story = {
  render: () => (
    <Container>
      <CommandMenuItem
        type="Avatar"
        textOrientation="Horizontal"
        title="Anna Taylor"
        subtitle="@annataylor"
        avatar={{ src: 'https://i.pravatar.cc/150?img=1', size: 32 }}
        showShortcut={false}
      />
      <CommandMenuItem
        type="Icon"
        textOrientation="Horizontal"
        title="Settings"
        subtitle="App settings"
        icon={Settings}
        showShortcut={false}
      />
    </Container>
  ),
}

export const Disabled: Story = {
  render: () => (
    <Container>
      <CommandMenuItem
        type="Icon"
        textOrientation="Horizontal"
        title="Disabled Item"
        subtitle="This item is disabled"
        icon={Settings}
        disabled
      />
    </Container>
  ),
}

export const AllVariants: Story = {
  render: () => (
    <Container>
      <CommandMenuItem
        type="Avatar"
        textOrientation="Vertical"
        title="Avatar Vertical"
        subtitle="With shortcut"
        avatar={{ src: 'https://i.pravatar.cc/150?img=4', size: 32 }}
        shortcut={['⌘', '1']}
      />
      <CommandMenuItem
        type="Avatar"
        textOrientation="Horizontal"
        title="Avatar Horizontal"
        subtitle="No shortcut"
        avatar={{ src: 'https://i.pravatar.cc/150?img=5', size: 32 }}
      />
      <CommandMenuItem
        type="Icon"
        textOrientation="Vertical"
        title="Icon Vertical"
        subtitle="With description"
        icon={File}
        shortcut={['⌘', 'F']}
      />
      <CommandMenuItem
        type="Icon"
        textOrientation="Horizontal"
        title="Icon Horizontal"
        subtitle="Compact layout"
        icon={User}
      />
      <CommandMenuItem
        type="Empty"
        textOrientation="Vertical"
        title="Empty Vertical"
        subtitle="No icon or avatar"
      />
      <CommandMenuItem
        type="Empty"
        textOrientation="Horizontal"
        title="Empty Horizontal"
        subtitle="Simple text item"
      />
    </Container>
  ),
}

export const LongText: Story = {
  render: () => (
    <Container>
      <CommandMenuItem
        type="Avatar"
        textOrientation="Horizontal"
        title="Very Long Title That Might Overflow"
        subtitle="This is a very long subtitle that demonstrates how the component handles lengthy text content"
        avatar={{ src: 'https://i.pravatar.cc/150?img=6', size: 32 }}
      />
      <CommandMenuItem
        type="Icon"
        textOrientation="Horizontal"
        title="Another Long Title Example"
        subtitle="Subtitle with lots of text to test truncation"
        icon={Settings}
      />
    </Container>
  ),
}
