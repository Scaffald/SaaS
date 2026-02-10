/**
 * StoragePreferencesWidget
 * REQ-1: Document Storage Preferences UI
 *
 * Allows users to select their preferred document storage backend:
 * - Local (Supabase) - Default, built-in storage
 * - Dropbox - Cloud storage via OAuth
 * - Google Drive - Cloud storage via OAuth
 */

import { api } from '@scf/core/utils/api'
import { Cloud, Database, HardDrive } from '@tamagui/lucide-icons'
import { Button, DashboardWidget, Heading, LoadingState, spacing } from '@unicornlove/beyond-ui'
import type { ComponentType } from 'react'
import { useState, useEffect } from 'react'
import { Text, Row, Stack } from '@unicornlove/beyond-ui'

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
    available: false, // Will be enabled in TASK-10
  },
  {
    value: 'google_drive',
    label: 'Google Drive',
    description: 'Sync documents with Google Drive. Requires OAuth connection.',
    icon: HardDrive,
    available: false, // Will be enabled in TASK-11
  },
]

export function StoragePreferencesWidget() {
  const [selectedPreference, setSelectedPreference] = useState<StorageBackend>('supabase')
  const [hasChanges, setHasChanges] = useState(false)

  const { data, isLoading, error } = api.documents.getStoragePreference.useQuery()
  const utils = api.useUtils()

  const mutation = api.documents.setStoragePreference.useMutation({
    onSuccess: () => {
      utils.documents.getStoragePreference.invalidate()
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
        <Stack gap="$4" alignItems="center" paddingVertical="$8">
          <Text color="$red10">Failed to load storage preferences</Text>
          <Text color="$color11" fontSize="$2">
            {error.message}
          </Text>
        </Stack>
      </DashboardWidget>
    )
  }

  return (
    <DashboardWidget>
      <Stack gap={spacing.md}>
        {/* Header */}
        <Row justifyContent="space-between" alignItems="center">
          <Stack gap="$1">
            <Heading variant="h4">Document Storage</Heading>
            <Text fontSize="$2" color="$color10">
              Choose where your documents are stored
            </Text>
          </Stack>
          {hasChanges && (
            <Button
              variant="primary"
              size="$2"
              disabled={mutation.isPending}
              onPress={handleSave}
            >
              {mutation.isPending ? 'Saving...' : 'Save'}
            </Button>
          )}
        </Row>

        {/* Storage Options */}
        <Stack gap="$3">
          {STORAGE_OPTIONS.map((option) => {
            const isSelected = selectedPreference === option.value
            const IconComponent = option.icon

            return (
              <Row
                key={option.value}
                padding="$4"
                borderRadius="$4"
                borderWidth={2}
                borderColor={isSelected ? '$blue8' : '$borderColor'}
                backgroundColor={isSelected ? '$blue2' : '$color1'}
                opacity={option.available ? 1 : 0.5}
                pressStyle={option.available ? { scale: 0.98 } : undefined}
                onPress={() => option.available && handleSelect(option.value)}
                cursor={option.available ? 'pointer' : 'not-allowed'}
                gap="$3"
                alignItems="center"
              >
                <Row
                  width={48}
                  height={48}
                  borderRadius="$3"
                  backgroundColor={isSelected ? '$blue4' : '$color3'}
                  alignItems="center"
                  justifyContent="center"
                >
                  <IconComponent
                    size={24}
                    color={isSelected ? '$blue10' : '$color11'}
                  />
                </Row>

                <Stack flex={1} gap="$1">
                  <Row alignItems="center" gap="$2">
                    <Text fontSize="$4" fontWeight="600" color="$color12">
                      {option.label}
                    </Text>
                    {!option.available && (
                      <Row
                        backgroundColor="$yellow4"
                        paddingHorizontal="$2"
                        paddingVertical="$1"
                        borderRadius="$2"
                      >
                        <Text fontSize="$1" color="$yellow11" fontWeight="600">
                          COMING SOON
                        </Text>
                      </Row>
                    )}
                    {isSelected && option.available && (
                      <Row
                        backgroundColor="$green4"
                        paddingHorizontal="$2"
                        paddingVertical="$1"
                        borderRadius="$2"
                      >
                        <Text fontSize="$1" color="$green11" fontWeight="600">
                          ACTIVE
                        </Text>
                      </Row>
                    )}
                  </Row>
                  <Text fontSize="$2" color="$color10">
                    {option.description}
                  </Text>
                </Stack>
              </Row>
            )
          })}
        </Stack>

        {/* Status Messages */}
        {mutation.isSuccess && (
          <Text fontSize="$2" color="$green10">
            Storage preference saved successfully.
          </Text>
        )}
        {mutation.isError && (
          <Text fontSize="$2" color="$red10">
            Failed to save storage preference: {mutation.error.message}
          </Text>
        )}

        {/* Info Note */}
        <Stack
          backgroundColor="$blue2"
          padding="$3"
          borderRadius="$3"
          borderWidth={1}
          borderColor="$blue6"
        >
          <Text fontSize="$2" color="$blue11">
            Note: Existing documents will remain in their current storage location.
            Only new documents will use your selected preference.
          </Text>
        </Stack>
      </Stack>
    </DashboardWidget>
  )
}
