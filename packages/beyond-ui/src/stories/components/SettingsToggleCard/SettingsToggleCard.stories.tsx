/**
 * SettingsToggleCard Storybook stories
 */

import type { Meta, StoryObj } from '@storybook/react'
import { SettingsToggleCard } from '../../../components/SettingsToggleCard'
import { Stack } from '../../../components/Layout'
import { MessageSquare, Shield, Figma, Github, Notion, Slack, Mail } from 'lucide-react-native'
import { useState } from 'react'

const meta: Meta<typeof SettingsToggleCard> = {
  title: 'Components/SettingsToggleCard',
  component: SettingsToggleCard,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof SettingsToggleCard>

export const Default: Story = {
  render: () => {
    const [enabled, setEnabled] = useState(false)
    return (
      <SettingsToggleCard
        icon={MessageSquare}
        title="Text message SMS"
        description="Receive a one-time passcode via SMS each time you log in."
        enabled={enabled}
        onToggleChange={setEnabled}
      />
    )
  },
}

export const Enabled: Story = {
  render: () => {
    const [enabled, setEnabled] = useState(true)
    return (
      <SettingsToggleCard
        icon={MessageSquare}
        title="Text message SMS"
        description="Receive a one-time passcode via SMS each time you log in."
        enabled={enabled}
        onToggleChange={setEnabled}
      />
    )
  },
}

export const TwoFactorAuth: Story = {
  render: () => {
    const [smsEnabled, setSmsEnabled] = useState(true)
    const [totpEnabled, setTotpEnabled] = useState(false)
    return (
      <Stack style={{ gap: 20, width: '100%' }}>
        <SettingsToggleCard
          icon={MessageSquare}
          title="Text message SMS"
          description="Receive a one-time passcode via SMS each time you log in."
          enabled={smsEnabled}
          onToggleChange={setSmsEnabled}
        />
        <SettingsToggleCard
          icon={Shield}
          title="Authenticator app (TOTP)"
          description="Use an app to receive a temporary one time passcode each time you log in."
          enabled={totpEnabled}
          onToggleChange={setTotpEnabled}
        />
      </Stack>
    )
  },
}

export const Integrations: Story = {
  render: () => {
    const [figma, setFigma] = useState(false)
    const [github, setGithub] = useState(true)
    const [notion, setNotion] = useState(false)
    const [slack, setSlack] = useState(true)
    const [gmail, setGmail] = useState(true)
    return (
      <Stack style={{ gap: 24, width: '100%' }}>
        <SettingsToggleCard
          icon={Figma}
          title="Figma"
          description="Preview your Figma files easy"
          enabled={figma}
          onToggleChange={setFigma}
        />
        <SettingsToggleCard
          icon={Github}
          title="GitHub"
          description="Streamline code collaboratio."
          enabled={github}
          onToggleChange={setGithub}
        />
        <SettingsToggleCard
          icon={Notion}
          title="Notion"
          description="Centralize workspace tasks"
          enabled={notion}
          onToggleChange={setNotion}
        />
        <SettingsToggleCard
          icon={Slack}
          title="Slack"
          description="Real-time team communication"
          enabled={slack}
          onToggleChange={setSlack}
        />
        <SettingsToggleCard
          icon={Mail}
          title="Gmail"
          description="Simplify email management"
          enabled={gmail}
          onToggleChange={setGmail}
        />
      </Stack>
    )
  },
}

export const Disabled: Story = {
  render: () => (
    <SettingsToggleCard
      icon={MessageSquare}
      title="Text message SMS"
      description="Receive a one-time passcode via SMS each time you log in."
      enabled={false}
      disabled
    />
  ),
}
