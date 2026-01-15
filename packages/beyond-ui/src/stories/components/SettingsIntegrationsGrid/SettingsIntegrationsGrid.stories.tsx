/**
 * SettingsIntegrationsGrid Storybook stories
 */

import type { Meta, StoryObj } from '@storybook/react'
import { SettingsIntegrationsGrid } from '../../../components/SettingsIntegrationsGrid'
import type { Integration } from '../../../components/SettingsIntegrationsGrid'
import { Figma, Github, Notion, Slack, Mail, Zap } from 'lucide-react-native'
import { useState } from 'react'

const meta: Meta<typeof SettingsIntegrationsGrid> = {
  title: 'Components/SettingsIntegrationsGrid',
  component: SettingsIntegrationsGrid,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof SettingsIntegrationsGrid>

const sampleIntegrations: Integration[] = [
  {
    id: '1',
    icon: Figma,
    title: 'Figma',
    description: 'Preview your Figma files easy',
    enabled: false,
  },
  {
    id: '2',
    icon: Github,
    title: 'GitHub',
    description: 'Streamline code collaboration.',
    enabled: true,
  },
  {
    id: '3',
    icon: Notion,
    title: 'Notion',
    description: 'Centralize workspace tasks',
    enabled: false,
  },
  {
    id: '4',
    icon: Slack,
    title: 'Slack',
    description: 'Real-time team communication',
    enabled: true,
  },
  {
    id: '5',
    icon: Mail,
    title: 'Gmail',
    description: 'Simplify email management',
    enabled: true,
  },
  {
    id: '6',
    icon: Zap,
    title: 'Zapier',
    description: 'Automate workflows',
    enabled: false,
  },
]

export const Default: Story = {
  render: () => {
    const [integrations, setIntegrations] = useState<Integration[]>(sampleIntegrations)

    const handleIntegrationChange = (id: string, enabled: boolean) => {
      setIntegrations((prev) =>
        prev.map((integration) => (integration.id === id ? { ...integration, enabled } : integration))
      )
    }

    return (
      <SettingsIntegrationsGrid
        integrations={integrations}
        onIntegrationChange={handleIntegrationChange}
      />
    )
  },
}

export const Empty: Story = {
  render: () => <SettingsIntegrationsGrid integrations={[]} />,
}
