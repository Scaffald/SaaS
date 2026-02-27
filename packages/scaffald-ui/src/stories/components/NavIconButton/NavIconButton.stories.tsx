/**
 * NavIconButton Component Stories
 */

import type { Meta, StoryObj } from '@storybook/react'
import { NavIconButton } from '../../../components/NavIconButton'
import { View, StyleSheet } from 'react-native'
import { spacing } from '../../../tokens/spacing'
import { Bell, Search, Settings } from 'lucide-react-native'

const meta: Meta<typeof NavIconButton> = {
  title: 'Components/NavIconButton',
  component: NavIconButton,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Icon-only navigation button with optional badges for notifications and actions.',
      },
    },
  },
  argTypes: {
    badge: {
      control: 'select',
      options: ['dot', 'number', undefined],
      description: 'Badge type',
    },
    state: {
      control: 'select',
      options: ['default', 'hover', 'pressed'],
      description: 'Button state',
    },
    variant: {
      control: 'select',
      options: ['light', 'outline'],
      description: 'Style variant',
    },
    showBadge: {
      control: 'boolean',
      description: 'Whether to show badge',
    },
    disabled: {
      control: 'boolean',
      description: 'Disabled state',
    },
  },
}

export default meta
type Story = StoryObj<typeof NavIconButton>

export const Default: Story = {
  args: {
    icon: Bell,
    variant: 'light',
  },
}

export const WithDotBadge: Story = {
  args: {
    icon: Bell,
    variant: 'light',
    badge: 'dot',
    showBadge: true,
  },
}

export const WithNumberBadge: Story = {
  args: {
    icon: Bell,
    variant: 'light',
    badge: 'number',
    badgeValue: 5,
    showBadge: true,
  },
}

export const OutlineVariant: Story = {
  args: {
    icon: Bell,
    variant: 'outline',
    badge: 'dot',
    showBadge: true,
  },
}

export const AllVariants: Story = {
  render: () => (
    <View style={styles.container}>
      <View style={styles.row}>
        <NavIconButton icon={Bell} variant="light" />
        <NavIconButton icon={Bell} variant="light" badge="dot" showBadge />
        <NavIconButton icon={Bell} variant="light" badge="number" badgeValue={5} showBadge />
      </View>
      <View style={styles.row}>
        <NavIconButton icon={Bell} variant="outline" />
        <NavIconButton icon={Bell} variant="outline" badge="dot" showBadge />
        <NavIconButton icon={Bell} variant="outline" badge="number" badgeValue={99} showBadge />
      </View>
      <View style={styles.row}>
        <NavIconButton icon={Search} variant="light" />
        <NavIconButton icon={Settings} variant="light" badge="number" badgeValue={12} showBadge />
      </View>
    </View>
  ),
}

export const States: Story = {
  render: () => (
    <View style={styles.container}>
      <View style={styles.row}>
        <NavIconButton icon={Bell} variant="light" state="default" badge="dot" showBadge />
        <NavIconButton icon={Bell} variant="light" state="hover" badge="dot" showBadge />
        <NavIconButton icon={Bell} variant="light" state="pressed" badge="dot" showBadge />
      </View>
    </View>
  ),
}

export const Disabled: Story = {
  args: {
    icon: Bell,
    variant: 'light',
    badge: 'number',
    badgeValue: 5,
    showBadge: true,
    disabled: true,
  },
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'column',
    gap: spacing[16],
    padding: spacing[16],
  },
  row: {
    flexDirection: 'row',
    gap: spacing[12],
    alignItems: 'center',
  },
})