import { useEffect, useState } from 'react'
import { Button, Card, Input, Spinner, Text, Row, Stack, useToast } from '@scaffald/ui'
import {
  useGeographicSettings,
  useUpdateGeographicSettings,
} from '@scf/core/utils/office-settings-sdk-hooks'

export default function GeographicSettingsPage() {
  const toast = useToast()
  const [threshold, setThreshold] = useState<string>('2.0')

  // Read through the office API rather than PostgREST. `core.system_config`
  // is service-role only by design, so the previous direct
  // `supabase.schema('core')` read answered 42501 on every load (#856).
  const { data, isLoading, isError, error, refetch } = useGeographicSettings()

  // Seed the field once the real value arrives. The effect depends on the
  // value, not on the toast hook: ToastContext memoises on the live `toasts`
  // array, so an effect that both shows a toast and depends on `toast` never
  // settles (#852).
  useEffect(() => {
    if (data) setThreshold(String(data.siteOverlapThresholdPercent))
  }, [data])

  const updateMutation = useUpdateGeographicSettings({
    onSuccess: () => {
      toast.show({
        title: 'Success',
        message: 'Overlap threshold updated successfully',
        variant: 'success',
      })
    },
    onError: (mutationError) => {
      toast.show({
        title: 'Error',
        message: mutationError.message || 'Failed to save threshold',
        variant: 'error',
      })
    },
  })
  const isSaving = updateMutation.isPending

  const handleSave = () => {
    const numValue = Number.parseFloat(threshold)

    // Validate range
    if (Number.isNaN(numValue) || numValue < 0.1 || numValue > 10) {
      toast.show({
        title: 'Error',
        message: 'Threshold must be between 0.1% and 10%',
        variant: 'error',
      })
      return
    }

    updateMutation.mutate({ siteOverlapThresholdPercent: numValue })
  }

  if (isLoading) {
    return (
      <Stack padding={16} gap={16} align="center" justify="center">
        <Text>Geographic Settings</Text>
        <Spinner />
      </Stack>
    )
  }

  // A failed read is shown once, with a way out. It used to raise a toast
  // from inside the effect that fetched, which re-ran the fetch.
  if (isError) {
    return (
      <Stack padding={16} gap={16}>
        <Text>Geographic Settings</Text>
        <Text>
          {error instanceof Error ? error.message : 'Failed to load the current threshold.'}
        </Text>
        <Row>
          <Button variant="outline" onPress={() => refetch()}>
            Try again
          </Button>
        </Row>
      </Stack>
    )
  }

  return (
    <Stack padding={16} gap={16}>
      <Stack gap={8}>
        <Text>Geographic Settings</Text>
        <Text color="$gray11">Configure geographic validation settings for site boundaries</Text>
      </Stack>
      <Stack gap={16} style={{ maxWidth: 600 }}>
        <Card padding="md">
          <Stack gap={16}>
            <Stack gap={8}>
              <Text>Site Overlap Threshold</Text>
              <Text color="$gray11">
                When site boundaries overlap by more than this percentage, admins will receive
                notifications. This helps identify potential data quality issues or survey
                discrepancies.
              </Text>
            </Stack>

            <Stack gap={8}>
              <Text>Threshold Percentage</Text>
              <Row gap={8} align="center">
                <Input
                  value={threshold}
                  onChangeText={setThreshold}
                  placeholder="2.0"
                  keyboardType="numeric"
                  maxLength={5}
                />
                <Text>%</Text>
              </Row>
              <Text color="$gray10">Range: 0.1% - 10% (Default: 2.0%)</Text>
            </Stack>

            <Card padding="md">
              <Stack gap={8}>
                <Text>Current Setting</Text>
                <Text color="$blue11">{threshold}%</Text>
                <Text color="$gray11">
                  Site overlaps exceeding {threshold}% will trigger admin notifications.
                </Text>
              </Stack>
            </Card>

            <Row justify="flex-end" gap={8}>
              <Button
                variant="outline"
                onPress={() => {
                  // Reset to default
                  setThreshold('2.0')
                }}
                disabled={isSaving}
              >
                Reset to Default
              </Button>
              <Button
                color="primary"
                onPress={handleSave}
                disabled={
                  isSaving ||
                  Number.parseFloat(threshold) < 0.1 ||
                  Number.parseFloat(threshold) > 10
                }
              >
                {isSaving ? <Spinner /> : 'Save Threshold'}
              </Button>
            </Row>
          </Stack>
        </Card>

        <Card padding="md">
          <Stack gap={8}>
            <Text>About Site Overlaps</Text>
            <Text color="$gray11">
              Site overlaps can occur when:
              {'\n'}• Multiple projects are assigned to adjacent or overlapping geographic areas
              {'\n'}• Survey data contains inaccuracies
              {'\n'}• Site boundaries need adjustment based on new information
              {'\n\n'}
              When an overlap is detected, admins receive notifications with options to:
              {'\n'}• Request survey data verification from project owners
              {'\n'}• Adjust site boundaries
              {'\n'}• Dismiss if the overlap is expected/acceptable
            </Text>
          </Stack>
        </Card>
      </Stack>
    </Stack>
  )
}
