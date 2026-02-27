/**
 * SettingsSectionHeader Storybook stories
 */

import type { Meta, StoryObj } from '@storybook/react'
import { SettingsSectionHeader } from '../../../components/SettingsSectionHeader'
import { User, Shield, Bell, Users, Plug } from 'lucide-react-native'

const meta: Meta<typeof SettingsSectionHeader> = {
  title: 'Components/SettingsSectionHeader',
  component: SettingsSectionHeader,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof SettingsSectionHeader>

export const Default: Story = {
  args: {
    icon: User,
    title: 'Basic Info',
    description: 'Basic workspace info details',
  },
}

export const WithoutDescription: Story = {
  args: {
    icon: User,
    title: 'Basic Info',
  },
}

export const WithoutIcon: Story = {
  args: {
    title: 'Basic Info',
    description: 'Basic workspace info details',
  },
}

export const Security: Story = {
  args: {
    icon: Shield,
    title: 'Two-factor authentication (2FA)',
    description: 'Keep your account secure by enabling 2FA via SMS or using OTP form authenticator app',
  },
}

export const Notifications: Story = {
  args: {
    icon: Bell,
    title: 'Notifications',
    description: 'Manage your notification preferences',
  },
}

export const Team: Story = {
  args: {
    icon: Users,
    title: 'Team',
    description: 'Manage your team members here',
  },
}

export const Integrations: Story = {
  args: {
    icon: Plug,
    title: 'Integrations',
    description: 'Connect and manage external services',
  },
}
