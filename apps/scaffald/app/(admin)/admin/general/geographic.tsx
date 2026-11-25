import { useEffect, useState } from 'react'
import {
  Button,
  Card,
  Input,
  ScreenHeader,
  Spinner,
  Text,
  Row,
  Stack,
  useToast,
} from '@scaffald/ui'
import type React from 'react'
import { OfficeLayout } from '@scf/core/components/layouts/OfficeLayout'
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

  // OfficeLayout + ScreenHeader, like the rest of the office (#1098): the page
  // had a bare padded Stack and a small sans title, with a card nested in a
  // card and the % suffix pushed out of the row.
  const header = (
    <ScreenHeader
      kicker="Settings"
      title="Geographic settings"
      tip="Geographic validation for site boundaries."
    />
  )

  let content: React.ReactNode
  if (isLoading) {
    content = (
      <Row gap={8} align="center">
        <Spinner size="sm" />
        <Text color="secondary">Loading the current threshold…</Text>
      </Row>
    )
  } else if (isError) {
    // A failed read is shown once, with a way out. It used to raise a toast
    // from inside the effect that fetched, which re-ran the fetch.
    content = (
      <Stack gap={12} align="flex-start">
        <Text color="secondary">
          {error instanceof Error ? error.message : 'Failed to load the current threshold.'}
        </Text>
        <Button variant="outline" size="sm" onPress={() => refetch()}>
          Try again
        </Button>
      </Stack>
    )
  } else {
    const parsed = Number.parseFloat(threshold)
    const outOfRange = Number.isNaN(parsed) || parsed < 0.1 || parsed > 10
    content = (
      <Stack gap={16} style={{ maxWidth: 640 }}>
        <Card padding="md">
          <Stack gap={16}>
            <Stack gap={6}>
              <Text weight="semibold">Site overlap threshold</Text>
              <Text color="secondary">
                When site boundaries overlap by more than this percentage, admins are notified. It
                helps catch data-quality problems and survey discrepancies.
              </Text>
            </Stack>

            <Stack gap={6}>
              <Text>Threshold</Text>
              {/* A fixed-width field with its unit beside it. Input fills its
                  parent, so in a Row it took the card and pushed "%" out. */}
              <Row gap={8} align="center">
                <Stack style={{ width: 120 }}>
                  <Input
                    value={threshold}
                    onChangeText={setThreshold}
                    placeholder="2.0"
                    keyboardType="numeric"
                    maxLength={5}
                    accessibilityLabel="Threshold percentage"
                  />
                </Stack>
                <Text>%</Text>
              </Row>
              <Text color="tertiary">
                {outOfRange
                  ? 'Enter a value from 0.1 to 10.'
                  : `Overlaps above ${threshold}% notify admins. Range 0.1–10%, default 2.0%.`}
              </Text>
            </Stack>

            <Row justify="flex-end" gap={8} wrap>
              <Button variant="outline" onPress={() => setThreshold('2.0')} disabled={isSaving}>
                Reset to default
              </Button>
              <Button
                variant="filled"
                color="primary"
                onPress={handleSave}
                disabled={isSaving || outOfRange}
              >
                {isSaving ? 'Saving…' : 'Save threshold'}
              </Button>
            </Row>
          </Stack>
        </Card>

        <Card padding="md">
          <Stack gap={8}>
            <Text weight="semibold">About site overlaps</Text>
            <Text color="secondary">
              Overlaps happen when projects are assigned to adjacent or overlapping areas, when
              survey data is inaccurate, or when boundaries need adjusting. When one is detected,
              admins can ask the project owner to verify the survey, adjust the boundaries, or
              dismiss it as expected.
            </Text>
          </Stack>
        </Card>
      </Stack>
    )
  }

  return (
    <OfficeLayout
      leftContent={
        <Stack gap={16}>
          {header}
          {content}
        </Stack>
      }
      leftContainerProps={{ minWidth: '100%' }}
    />
  )
}
