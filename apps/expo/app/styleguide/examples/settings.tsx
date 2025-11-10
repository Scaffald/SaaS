// @ts-nocheck
import React, { useState } from 'react'
import { Button, Input, Paragraph, Switch, Text, XStack, YStack } from '@app/ui'
import { StyleguidePage } from '@app/styleguide'
import { AnchorHeading } from '@app/styleguide'

export default function SettingsExamplePage() {
  const [name, setName] = useState('Scaffald HQ')
  const [notifications, setNotifications] = useState(true)

  return (
    <StyleguidePage
      title="Settings"
      description="Two-column settings page combining forms and toggles."
    >
      <YStack gap="$6">
        <AnchorHeading
          id="settings-profile"
          title="Organization profile"
          description="Basic info with inline validation."
        />
        <XStack gap="$6" flexWrap="wrap">
          <YStack flex={1} minWidth={280} gap="$3">
            <Text fontSize={14} fontWeight="600" color="$color11">
              Organization name
            </Text>
            <Input value={name} onChangeText={setName} />
            <Paragraph fontSize={12} color="$color10">
              Shown on invoices and compliance exports.
            </Paragraph>
          </YStack>
          <YStack flex={1} minWidth={220} gap="$3">
            <Text fontSize={14} fontWeight="600" color="$color11">
              Notifications
            </Text>
            <XStack alignItems="center" gap="$2">
              <Switch checked={notifications} onCheckedChange={setNotifications} />
              <Text fontSize={12} color="$color10">
                Send weekly digest
              </Text>
            </XStack>
          </YStack>
        </XStack>
        <Button maxWidth={160}>Save changes</Button>
      </YStack>
    </StyleguidePage>
  )
}
