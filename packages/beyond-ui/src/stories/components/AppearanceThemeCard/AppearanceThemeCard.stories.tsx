/**
 * AppearanceThemeCard Storybook stories
 */

import type { Meta, StoryObj } from '@storybook/react'
import { AppearanceThemeCard } from '../../../components/AppearanceThemeCard'
import { Stack } from '../../../components/Layout'
import { useState } from 'react'

const meta: Meta<typeof AppearanceThemeCard> = {
  title: 'Components/AppearanceThemeCard',
  component: AppearanceThemeCard,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof AppearanceThemeCard>

export const Default: Story = {
  render: () => {
    const [selected, setSelected] = useState<string>('light')
    return (
      <Stack style={{ gap: 16, flexDirection: 'row' }}>
        <AppearanceThemeCard
          variant="light"
          selected={selected === 'light'}
          onPress={() => setSelected('light')}
        />
        <AppearanceThemeCard
          variant="dark"
          selected={selected === 'dark'}
          onPress={() => setSelected('dark')}
        />
        <AppearanceThemeCard
          variant="system"
          selected={selected === 'system'}
          onPress={() => setSelected('system')}
        />
      </Stack>
    )
  },
}

export const Light: Story = {
  render: () => <AppearanceThemeCard variant="light" selected />,
}

export const Dark: Story = {
  render: () => <AppearanceThemeCard variant="dark" selected />,
}

export const System: Story = {
  render: () => <AppearanceThemeCard variant="system" selected />,
}

export const Unselected: Story = {
  render: () => (
    <Stack style={{ gap: 16, flexDirection: 'row' }}>
      <AppearanceThemeCard variant="light" selected={false} />
      <AppearanceThemeCard variant="dark" selected={false} />
      <AppearanceThemeCard variant="system" selected={false} />
    </Stack>
  ),
}

export const Disabled: Story = {
  render: () => (
    <Stack style={{ gap: 16, flexDirection: 'row' }}>
      <AppearanceThemeCard variant="light" selected disabled />
      <AppearanceThemeCard variant="dark" selected={false} disabled />
      <AppearanceThemeCard variant="system" selected={false} disabled />
    </Stack>
  ),
}
