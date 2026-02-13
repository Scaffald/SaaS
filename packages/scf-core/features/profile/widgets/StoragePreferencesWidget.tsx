/**
 * StoragePreferencesWidget
 * Document Storage Preferences UI.
 *
 * Allows users to select their preferred document storage backend:
 * - Local (Supabase) - Default, built-in storage
 * - Dropbox - Cloud storage via OAuth
 * - Google Drive - Cloud storage via OAuth
 */

import { api } from '@scf/core/utils/api'
import { Cloud, Database, HardDrive } from 'lucide-react-native'
import { Button, DashboardWidget, Heading, LoadingState, spacing } from '@scaffald/ui'
import type { ComponentType } from 'react'
import { useState, useEffect } from 'react'
import { Text, Row, Stack } from '@scaffald/ui'
import { useQueryClient } from '@tanstack/react-query'

type StorageBackend = 'supabase' | 'dropbox' | 'google_drive'

interface StorageOption {
  value: StorageBackend
  label: string
  description: string
  icon: ComponentType<{ size?: number; color?: string }>
  available: boolean
}

const STORAGE_OPTIONS: StorageOption[] = [
  {
    value: 'supabase',
    label: 'Local Storage',
    description: 'Store documents on Scaffald servers. Secure, fast, always available.',
    icon: Database,
    available: true,
  },
  {
    value: 'dropbox',
    label: 'Dropbox',
    description: 'Sync documents with your Dropbox account. Requires OAuth connection.',
    icon: Cloud,
    available: false, // Will be enabled later
  },
  {
    value: 'google_drive',
    label: 'Google Drive',
    description: 'Sync documents with Google Drive. Requires OAuth connection.',
    icon: HardDrive,
    available: false, // Will be enabled later
  },
]

export function StoragePreferencesWidget() {
  const [selectedPreference, setSelectedPreference] = useState<StorageBackend>('supabase')
  const [hasChanges, setHasChanges] = useState(false)

  const { data, isLoading, error } = api.documents.getStoragePreference.useQuery()
  const queryClient = useQueryClient()

  const mutation = api.documents.setStoragePreference.useMutation({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [['documents', 'getStoragePreference']] })
      setHasChanges(false)
    },
  })

  useEffect(() => {
    if (data?.storagePreference) {
      setSelectedPreference(data.storagePreference as StorageBackend)
    }
  }, [data?.storagePreference])

  const handleSelect = (value: StorageBackend) => {
    setSelectedPreference(value)
    setHasChanges(value !== data?.storagePreference)
  }

  const handleSave = () => {
    mutation.mutate({ storagePreference: selectedPreference })
  }

  if (isLoading) {
    return (
      <DashboardWidget>
        <LoadingState message="Loading storage preferences..." />
      </DashboardWidget>
    )
  }

  if (error) {
    return (
      <DashboardWidget>
        <Stack gap={16} align="center" paddingVertical={32}>
          <Text color="$red10">Failed to load storage preferences</Text>
          <Text color="$gray11">{error.message}</Text>
        </Stack>
      </DashboardWidget>
    )
  }

  return (
    <DashboardWidget>
      <Stack gap={spacing.md}>
        {/* Header */}
        <Row justify="space-between" align="center">
          <Stack gap={4}>
            <Heading variant="h4">Document Storage</Heading>
            <Text color="$gray11">Choose where your documents are stored</Text>
          </Stack>
          {hasChanges && (
            <Button variant="primary" size="xs" disabled={mutation.isPending} onPress={handleSave}>
              {mutation.isPending ? 'Saving...' : 'Save'}
            </Button>
          )}
        </Row>

        {/* Storage Options */}
        <Stack gap={12}>
          {STORAGE_OPTIONS.map((option) => {
            const isSelected = selectedPreference === option.value
            const IconComponent = option.icon

            return (
              <Row
                key={option.value}
                padding="md"
                borderRadius={16}
                borderWidth={2}
                borderColor={isSelected ? '$blue8' : '$borderColor'}
                backgroundColor={isSelected ? '$blue2' : '$color1'}
                opacity={option.available ? 1 : 0.5}
                pressStyle={option.available ? { scale: 0.98 } : undefined}
                onPress={() => option.available && handleSelect(option.value)}
                cursor={option.available ? 'pointer' : 'not-allowed'}
                gap={12}
                align="center"
              >
                <Row
                  width={48}
                  height={48}
                  borderRadius={12}
                  backgroundColor={isSelected ? '$blue4' : '$color3'}
                  align="center"
                  justify="center"
                >
                  <IconComponent size={24} color={isSelected ? '$blue10' : '$color11'} />
                </Row>

                <Stack flex={1} gap={4}>
                  <Row align="center" gap={8}>
                    <Text color="$gray11">{option.label}</Text>
                    {!option.available && (
                      <Row
                        backgroundColor="$yellow4"
                        paddingHorizontal={8}
                        paddingVertical={4}
                        borderRadius={8}
                      >
                        <Text color="$yellow11">COMING SOON</Text>
                      </Row>
                    )}
                    {isSelected && option.available && (
                      <Row
                        backgroundColor="$green4"
                        paddingHorizontal={8}
                        paddingVertical={4}
                        borderRadius={8}
                      >
                        <Text color="$green11">ACTIVE</Text>
                      </Row>
                    )}
                  </Row>
                  <Text color="$gray11">{option.description}</Text>
                </Stack>
              </Row>
            )
          })}
        </Stack>

        {/* Status Messages */}
        {mutation.isSuccess && <Text color="$green10">Storage preference saved successfully.</Text>}
        {mutation.isError && (
          <Text color="$red10">Failed to save storage preference: {mutation.error.message}</Text>
        )}

        {/* Info Note */}
        <Stack
          backgroundColor="$blue2"
          padding="sm"
          borderRadius={12}
          borderWidth={1}
          borderColor="$blue6"
        >
          <Text color="$blue11">
            Note: Existing documents will remain in their current storage location. Only new
            documents will use your selected preference.
          </Text>
        </Stack>
      </Stack>
    </DashboardWidget>
  )
}
