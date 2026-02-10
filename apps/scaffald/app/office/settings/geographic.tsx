import { supabase } from '@scf/core/utils/supabase/client'
import { useToastController } from '@tamagui/toast'
import { useEffect, useState } from 'react'
import { Button, Card, Input, Spinner, Text, Row, Stack } from '@unicornlove/beyond-ui'

export default function GeographicSettingsPage() {
  const toast = useToastController()
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
        toast.show('Error', { message: 'Failed to load current threshold setting' })
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
      toast.show('Error', {
        message: 'Threshold must be between 0.1% and 10%',
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

      toast.show('Success', {
        message: 'Overlap threshold updated successfully',
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to save threshold'
      toast.show('Error', { message })
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <Stack flex={1} padding="$4" gap="$4" alignItems="center" justifyContent="center">
        <Text fontSize="$8" fontWeight="600">
          Geographic Settings
        </Text>
        <Spinner />
      </Stack>
    )
  }

  return (
    <Stack flex={1} padding="$4" gap="$4">
      <Stack gap="$2">
        <Text fontSize="$8" fontWeight="600">
          Geographic Settings
        </Text>
        <Text fontSize="$4" color="$gray11">
          Configure geographic validation settings for site boundaries
        </Text>
      </Stack>
      <Stack gap="$4" style={{ maxWidth: 600 }}>
        <Card padding="$4">
          <Stack gap="$4">
            <Stack gap="$2">
              <Text fontSize="$6" fontWeight="600">
                Site Overlap Threshold
              </Text>
              <Text fontSize="$3" color="$gray11">
                When site boundaries overlap by more than this percentage, admins will receive
                notifications. This helps identify potential data quality issues or survey
                discrepancies.
              </Text>
            </Stack>

            <Stack gap="$2">
              <Text fontWeight="600">Threshold Percentage</Text>
              <Row gap="$2" alignItems="center">
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
              <Text fontSize="$2" color="$gray10">
                Range: 0.1% - 10% (Default: 2.0%)
              </Text>
            </Stack>

            <Card padding="$3" backgroundColor="$blue2" borderColor="$blue8" borderWidth={1}>
              <Stack gap="$2">
                <Text fontWeight="600" fontSize="$3">
                  Current Setting
                </Text>
                <Text fontSize="$5" fontWeight="600" color="$blue11">
                  {threshold}%
                </Text>
                <Text fontSize="$2" color="$gray11">
                  Site overlaps exceeding {threshold}% will trigger admin notifications.
                </Text>
              </Stack>
            </Card>

            <Row justifyContent="flex-end" gap="$2">
              <Button
                variant="outlined"
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
            <Text fontWeight="600" fontSize="$3">
              About Site Overlaps
            </Text>
            <Text fontSize="$2" color="$gray11">
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
