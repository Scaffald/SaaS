import { supabase } from '@scf/core/utils/supabase/client'
import { useEffect, useState } from 'react'
import { Button, Card, Input, Spinner, Text, Row, Stack, useToast } from '@unicornlove/beyond-ui'

export default function GeographicSettingsPage() {
  const toast = useToast()
  const [threshold, setThreshold] = useState<string>('2.0')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  // Load current threshold
  useEffect(() => {
    const loadThreshold = async () => {
      try {
        const { data, error } = await supabase
          .schema('core')
          .from('system_config')
          .select('value')
          .eq('key', 'site_overlap_threshold_percent')
          .single()

        if (error && error.code !== 'PGRST116') {
          throw error
        }

        if (data?.value) {
          const value =
            typeof data.value === 'string' ? Number.parseFloat(data.value) : (data.value as number)
          setThreshold(value.toString())
        }
      } catch (error) {
        console.error('Failed to load threshold:', error)
        toast.show({
          title: 'Error',
          message: 'Failed to load current threshold setting',
          variant: 'error',
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadThreshold()
  }, [toast])

  const handleSave = async () => {
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

    setIsSaving(true)
    try {
      const { error } = await supabase.schema('core').from('system_config').upsert({
        description: 'Percentage threshold for site overlap notifications',
        key: 'site_overlap_threshold_percent',
        value: numValue.toString(),
      })

      if (error) throw error

      toast.show({
        title: 'Success',
        message: 'Overlap threshold updated successfully',
        variant: 'success',
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to save threshold'
      toast.show({
        title: 'Error',
        message,
        variant: 'error',
      })
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <Stack flex={1} padding="$4" gap="$4" align="center" justify="center">
        <Text>
          Geographic Settings
        </Text>
        <Spinner />
      </Stack>
    )
  }

  return (
    <Stack flex={1} padding="$4" gap="$4">
      <Stack gap="$2">
        <Text>
          Geographic Settings
        </Text>
        <Text color="$gray11">
          Configure geographic validation settings for site boundaries
        </Text>
      </Stack>
      <Stack gap="$4" style={{ maxWidth: 600 }}>
        <Card padding="$4">
          <Stack gap="$4">
            <Stack gap="$2">
              <Text>
                Site Overlap Threshold
              </Text>
              <Text color="$gray11">
                When site boundaries overlap by more than this percentage, admins will receive
                notifications. This helps identify potential data quality issues or survey
                discrepancies.
              </Text>
            </Stack>

            <Stack gap="$2">
              <Text>Threshold Percentage</Text>
              <Row gap="$2" align="center">
                <Input
                  value={threshold}
                  onChangeText={setThreshold}
                  placeholder="2.0"
                  keyboardType="numeric"
                  flex={1}
                  maxLength={5}
                />
                <Text>%</Text>
              </Row>
              <Text color="$gray10">
                Range: 0.1% - 10% (Default: 2.0%)
              </Text>
            </Stack>

            <Card padding="$3" backgroundColor="$blue2" borderColor="$blue8" borderWidth={1}>
              <Stack gap="$2">
                <Text>
                  Current Setting
                </Text>
                <Text color="$blue11">
                  {threshold}%
                </Text>
                <Text color="$gray11">
                  Site overlaps exceeding {threshold}% will trigger admin notifications.
                </Text>
              </Stack>
            </Card>

            <Row justify="flex-end" gap="$2">
              <Button
                variant="outline"
                onPress={() => {
                  // Reset to default
                  setThreshold('2.0')
                }}
                disabled={isSaving}
              >Reset to Default</Button>
              <Button
                theme="blue"
                onPress={handleSave}
                disabled={
                  isSaving ||
                  Number.parseFloat(threshold) < 0.1 ||
                  Number.parseFloat(threshold) > 10
                }
              >{isSaving ? <Spinner /> : 'Save Threshold'}</Button>
            </Row>
          </Stack>
        </Card>

        <Card padding="$4" backgroundColor="$yellow2" borderColor="$yellow8" borderWidth={1}>
          <Stack gap="$2">
            <Text>
              About Site Overlaps
            </Text>
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
