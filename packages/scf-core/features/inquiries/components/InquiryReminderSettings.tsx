import { api } from '@scf/core/utils/api'
import { useToast } from '@unicornlove/beyond-ui'
import { useState } from 'react'
import {
  Button,
  Card,
  H4,
  Input,
  Separator,
  Spinner,
  Switch,
  Text,
  Row,
  Stack,
} from '@unicornlove/beyond-ui'

type InquiryReminderSettingsProps = {
  organizationId: string
}

export function InquiryReminderSettings({ organizationId }: InquiryReminderSettingsProps) {
  const toast = useToast()
  const { data: settings, isLoading } = api.organizations.getReminderSettings.useQuery(
    { organizationId },
    { enabled: !!organizationId }
  )
  const updateMutation = api.organizations.updateReminderSettings.useMutation({
    onSuccess: () => {
      toast.show({
          title: 'Settings saved',
          message: 'Inquiry reminder settings updated successfully',
          variant: 'success',
        })
    },
    onError: (error: unknown) => {
      const _message = error instanceof Error ? error.message : 'Failed to save settings'
      toast.show({
          title: 'Failed to save settings',
          variant: 'error',
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
        <Stack gap="$4">
          <Row alignItems="center" justifyContent="space-between" gap="$3">
            <Stack flex={1} gap="$1">
              <Text fontSize="$4" fontWeight="600">
                Send automatic reminders
              </Text>
              <Text fontSize="$3" color="$color11">
                Automatically remind candidates to respond to pending inquiries
              </Text>
            </Stack>
            <Switch
              checked={reminderEnabled}
              onCheckedChange={setReminderEnabled}
              disabled={updateMutation.isPending}
            />
          </Row>

          {reminderEnabled && (
            <Stack gap="$2">
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
            </Stack>
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
        </Stack>
      )}
    </Card>
  )
}
