/**
 * SettingsFormField Storybook stories
 */

import type { Meta, StoryObj } from '@storybook/react'
import { SettingsFormField } from '../../../components/SettingsFormField'
import { Stack } from '../../../components/Layout'
import { useState } from 'react'

const meta: Meta<typeof SettingsFormField> = {
  title: 'Components/SettingsFormField',
  component: SettingsFormField,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof SettingsFormField>

export const Default: Story = {
  render: () => {
    const [value, setValue] = useState('')
    return (
      <Stack style={{ gap: 16, width: 360 }}>
        <SettingsFormField
          label="Label"
          placeholder="Placeholder"
          value={value}
          onChangeText={setValue}
        />
      </Stack>
    )
  },
}

export const WithExternalAddon: Story = {
  render: () => {
    const [value, setValue] = useState('')
    return (
      <Stack style={{ gap: 16, width: 360 }}>
        <SettingsFormField
          label="Label"
          placeholder="Placeholder"
          value={value}
          onChangeText={setValue}
          externalAddon="saasworkspace/"
        />
      </Stack>
    )
  },
}

export const WithError: Story = {
  render: () => {
    const [value, setValue] = useState('')
    return (
      <Stack style={{ gap: 16, width: 360 }}>
        <SettingsFormField
          label="Label"
          placeholder="Placeholder"
          value={value}
          onChangeText={setValue}
          error="This field is required"
        />
      </Stack>
    )
  },
}

export const Required: Story = {
  render: () => {
    const [value, setValue] = useState('')
    return (
      <Stack style={{ gap: 16, width: 360 }}>
        <SettingsFormField
          label="Label"
          placeholder="Placeholder"
          value={value}
          onChangeText={setValue}
          required
        />
      </Stack>
    )
  },
}

export const MultipleFields: Story = {
  render: () => {
    const [value1, setValue1] = useState('')
    const [value2, setValue2] = useState('')
    const [value3, setValue3] = useState('')
    return (
      <Stack style={{ gap: 20, width: 360 }}>
        <SettingsFormField
          label="Label"
          placeholder="Placeholder"
          value={value1}
          onChangeText={setValue1}
        />
        <SettingsFormField
          label="Label"
          placeholder="Placeholder"
          value={value2}
          onChangeText={setValue2}
        />
        <SettingsFormField
          label="Label"
          placeholder="Placeholder"
          value={value3}
          onChangeText={setValue3}
          externalAddon="saasworkspace/"
        />
      </Stack>
    )
  },
}
