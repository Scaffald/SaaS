import { api } from '@app/core/utils/api'
import { useToastController } from '@tamagui/toast'
import { useState } from 'react'
import { Button, Card, H4, Input, Separator, Spinner, Switch, Text, XStack, YStack } from 'tamagui'

type InquiryReminderSettingsProps = {
  organizationId: string
}

export function InquiryReminderSettings({ organizationId }: InquiryReminderSettingsProps) {
  const toast = useToastController()
  const { data: settings, isLoading } = api.organizations.getReminderSettings.useQuery(
    { organizationId },
    { enabled: !!organizationId }
  )
  const updateMutation = api.organizations.updateReminderSettings.useMutation({
    onSuccess: () => {
      toast.show('Settings saved', {
        message: 'Inquiry reminder settings updated successfully',
      })
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : 'Failed to save settings'
      toast.show('Failed to save settings', {
        message,
      })
    },
  })

  const [reminderEnabled, setReminderEnabled] = useState(settings?.reminderEnabled ?? true)
  const [reminderDays, setReminderDays] = useState(settings?.reminderDays ?? 3)

  // Update local state when settings load
  if (
    settings &&
    (reminderEnabled !== settings.reminderEnabled || reminderDays !== settings.reminderDays)
  ) {
    setReminderEnabled(settings.reminderEnabled)
    setReminderDays(settings.reminderDays)
  }

  const handleSave = async () => {
    await updateMutation.mutateAsync({
      organizationId,
      reminderEnabled,
      reminderDays,
    })
  }

  return (
    <Card bordered padding="$4" gap="$3">
      <H4>Inquiry Reminders</H4>
      <Separator />
      {isLoading ? (
        <Spinner />
      ) : (
        <YStack gap="$4">
          <XStack items="center" justify="space-between" gap="$3">
            <YStack flex={1} gap="$1">
              <Text fontSize="$4" fontWeight="600">
                Send automatic reminders
              </Text>
              <Text fontSize="$3" color="$color11">
                Automatically remind candidates to respond to pending inquiries
              </Text>
            </YStack>
            <Switch
              checked={reminderEnabled}
              onCheckedChange={setReminderEnabled}
              disabled={updateMutation.isPending}
            />
          </XStack>

          {reminderEnabled && (
            <YStack gap="$2">
              <Text fontSize="$4" fontWeight="600">
                Remind after (days)
              </Text>
              <Input
                keyboardType="numeric"
                value={String(reminderDays)}
                onChangeText={(value) => {
                  const num = Number.parseInt(value, 10)
                  if (!Number.isNaN(num) && num >= 1 && num <= 14) {
                    setReminderDays(num)
                  }
                }}
                placeholder="3"
                maxLength={2}
              />
              <Text fontSize="$2" color="$color11">
                Candidates will receive a reminder {reminderDays} day{reminderDays !== 1 ? 's' : ''}{' '}
                after an inquiry is sent if they haven't responded. Reminders are limited to once
                every 3 days.
              </Text>
            </YStack>
          )}

          <Button
            onPress={handleSave}
            disabled={
              updateMutation.isPending || !reminderEnabled || reminderDays < 1 || reminderDays > 14
            }
            theme="blue"
          >
            {updateMutation.isPending ? 'Saving…' : 'Save Settings'}
          </Button>
        </YStack>
      )}
    </Card>
  )
}
