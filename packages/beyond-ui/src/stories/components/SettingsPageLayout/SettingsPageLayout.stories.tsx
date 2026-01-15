/**
 * SettingsPageLayout Storybook stories
 */

import type { Meta, StoryObj } from '@storybook/react'
import { SettingsPageLayout } from '../../../components/SettingsPageLayout'
import { Stack } from '../../../components/Layout'
import { User, Palette, Bell, Users, Plug } from 'lucide-react-native'
import { useState } from 'react'
import { Text } from 'react-native'

const meta: Meta<typeof SettingsPageLayout> = {
  title: 'Components/SettingsPageLayout',
  component: SettingsPageLayout,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof SettingsPageLayout>

const tabs = [
  { id: 'basic', label: 'Basic Info', icon: User },
  { id: 'appearance', label: 'Appearance', icon: Palette },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'team', label: 'Team', icon: Users },
  { id: 'integrations', label: 'Integrations', icon: Plug },
]

export const Default: Story = {
  render: () => {
    const [activeTab, setActiveTab] = useState('basic')

    return (
      <div style={{ height: '600px', width: '100%' }}>
        <SettingsPageLayout
          tabs={tabs}
          activeTabId={activeTab}
          onTabChange={setActiveTab}
        >
          <Stack style={{ gap: 24 }}>
            <Text style={{ fontSize: 24, fontWeight: 'bold' }}>
              {tabs.find((t) => t.id === activeTab)?.label} Settings
            </Text>
            <Text>Content for {tabs.find((t) => t.id === activeTab)?.label} tab</Text>
          </Stack>
        </SettingsPageLayout>
      </div>
    )
  },
}

export const WithoutIcons: Story = {
  render: () => {
    const [activeTab, setActiveTab] = useState('basic')

    return (
      <div style={{ height: '600px', width: '100%' }}>
        <SettingsPageLayout
          tabs={tabs.map(({ icon, ...tab }) => tab)}
          activeTabId={activeTab}
          onTabChange={setActiveTab}
        >
          <Stack style={{ gap: 24 }}>
            <Text style={{ fontSize: 24, fontWeight: 'bold' }}>
              {tabs.find((t) => t.id === activeTab)?.label} Settings
            </Text>
            <Text>Content for {tabs.find((t) => t.id === activeTab)?.label} tab</Text>
          </Stack>
        </SettingsPageLayout>
      </div>
    )
  },
}
