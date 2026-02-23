/**
 * StoragePreferencesWidget
 * Document Storage Preferences UI.
 *
 * Allows users to select their preferred document storage backend:
 * - Local (Supabase) - Default, built-in storage
 * - Dropbox - Cloud storage via OAuth
 * - Google Drive - Cloud storage via OAuth
 */

import { Cloud, Database, HardDrive } from 'lucide-react-native'
import { Button, DashboardWidget, Heading, LoadingState, spacing } from '@scaffald/ui'
import type { ComponentType } from 'react'
import { useState, useEffect } from 'react'
import { Text, Row, Stack } from '@scaffald/ui'
import { useQueryClient } from '@tanstack/react-query'
import {
  useStoragePreference,
  useSetStoragePreferenceMutation,
  STORAGE_PREFERENCE_QUERY_KEY,
} from '@scf/core/utils/documents-storage-sdk-hooks'

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

  const { data, isLoading, error } = useStoragePreference()
  const queryClient = useQueryClient()

  const mutation = useSetStoragePreferenceMutation({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: STORAGE_PREFERENCE_QUERY_KEY })
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
          <Text style={{ color: '#ef4444' }}>Failed to load storage preferences</Text>
          <Text style={{ color: '#414e62' }}>{error.message}</Text>
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
            <Text style={{ color: '#414e62' }}>Choose where your documents are stored</Text>
          </Stack>
          {hasChanges && (
            <Button variant="filled" color="primary" size="sm" disabled={mutation.isPending} onPress={handleSave}>
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
                onPress={() => option.available && handleSelect(option.value)}
                gap={12}
                align="center"
                style={{
                  borderWidth: 2,
                  borderColor: isSelected ? '#60a5fa' : '#e2e8f0',
                  backgroundColor: isSelected ? '#eff6ff' : '#ffffff',
                  opacity: option.available ? 1 : 0.5,
                }}
              >
                <Row
                  width={48}
                  height={48}
                  borderRadius={12}
                  align="center"
                  justify="center"
                  style={{ backgroundColor: isSelected ? '#bfdbfe' : '#f1f5f9' }}
                >
                  <IconComponent size={24} color={isSelected ? '#2563eb' : '#64748b'} />
                </Row>

                <Stack flex={1} gap={4}>
                  <Row align="center" gap={8}>
                    <Text style={{ color: '#414e62' }}>{option.label}</Text>
                    {!option.available && (
                      <Row
                        paddingHorizontal={8}
                        paddingVertical={4}
                        borderRadius={8}
                        style={{ backgroundColor: '#fef9c3' }}
                      >
                        <Text style={{ color: '#854d0e' }}>COMING SOON</Text>
                      </Row>
                    )}
                    {isSelected && option.available && (
                      <Row
                        paddingHorizontal={8}
                        paddingVertical={4}
                        borderRadius={8}
                        style={{ backgroundColor: '#dcfce7' }}
                      >
                        <Text style={{ color: '#166534' }}>ACTIVE</Text>
                      </Row>
                    )}
                  </Row>
                  <Text style={{ color: '#414e62' }}>{option.description}</Text>
                </Stack>
              </Row>
            )
          })}
        </Stack>

        {/* Status Messages */}
        {mutation.isSuccess && <Text style={{ color: '#16a34a' }}>Storage preference saved successfully.</Text>}
        {mutation.isError && (
          <Text style={{ color: '#ef4444' }}>Failed to save storage preference: {mutation.error.message}</Text>
        )}

        {/* Info Note */}
        <Stack
          padding="sm"
          borderRadius={12}
          style={{ backgroundColor: '#eff6ff', borderWidth: 1, borderColor: '#93c5fd' }}
        >
          <Text style={{ color: '#1d4ed8' }}>
            Note: Existing documents will remain in their current storage location. Only new
            documents will use your selected preference.
          </Text>
        </Stack>
      </Stack>
    </DashboardWidget>
  )
}
