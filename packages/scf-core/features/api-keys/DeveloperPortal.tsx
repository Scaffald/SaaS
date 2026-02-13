/**
 * Developer Portal
 * Complete API keys management interface
 * Connects all UI components with tRPC hooks
 */

import { useState } from 'react'
import { Stack } from '@unicornlove/beyond-ui'
import { useToast } from '@unicornlove/beyond-ui'
import { APIKeysList } from './APIKeysList'
import { APIKeyCreateModal } from './APIKeyCreateModal'
import { APIKeyScopesManager } from './APIKeyScopesManager'
import { APIKeyUsageChart } from './APIKeyUsageChart'
import { useAPIKeys, useCreateAPIKey, useUpdateAPIKey, useRevokeAPIKey } from './hooks'
import type { CreateKeyParams } from './APIKeyCreateModal'

export function DeveloperPortal() {
  const toast = useToast()

  // Fetch API keys
  const { data: keys = [], isLoading } = useAPIKeys()

  // Mutations
  const createKey = useCreateAPIKey()
  const updateKey = useUpdateAPIKey()
  const revokeKey = useRevokeAPIKey()

  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [scopesModalKey, setScopesModalKey] = useState<{
    id: string
    name: string
    scopes: string[]
    is_active: boolean
  } | null>(null)
  const [usageKeyId, setUsageKeyId] = useState<string | null>(null)

  // Handlers
  const handleCreateKey = async (params: CreateKeyParams) => {
    try {
      const result = await createKey.mutateAsync({
        name: params.name,
        scopes: params.scopes,
        expiresAt: params.expiresAt,
        environment: 'live',
        rate_limit_tier: 'free',
      })

      toast.show({
        title: 'API Key Created',
        message: 'Your API key has been created successfully. Save it now!',
      })

      return {
        id: result.id,
        key: result.key,
        name: result.name,
        scopes: result.scopes,
        created_at: result.created_at,
        expires_at: result.expires_at,
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create API key'
      toast.show({
        title: 'Error',
        message,
        variant: 'error',
      })
      throw error
    }
  }

  const handleUpdateScopes = async (keyId: string, scopes: string[]) => {
    try {
      await updateKey.mutateAsync({
        id: keyId,
        scopes,
      })

      toast.show({
        title: 'Scopes Updated',
        message: 'API key permissions have been updated successfully',
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update scopes'
      toast.show({
        title: 'Error',
        message,
        variant: 'error',
      })
      throw error
    }
  }

  const handleRevokeKey = async (keyId: string) => {
    // Confirm before revoking
    if (
      !window.confirm('Are you sure you want to revoke this API key? This action cannot be undone.')
    ) {
      return
    }

    try {
      await revokeKey.mutateAsync({ id: keyId })

      toast.show({
        title: 'API Key Revoked',
        message: 'The API key has been revoked and can no longer be used',
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to revoke API key'
      toast.show({
        title: 'Error',
        message,
        variant: 'error',
      })
    }
  }

  const handleViewUsage = (keyId: string) => {
    setUsageKeyId(keyId)
  }

  const handleManageScopes = (keyId: string) => {
    const key = keys.find((k) => k.id === keyId)
    if (key) {
      setScopesModalKey({
        id: key.id,
        name: key.name,
        scopes: key.scopes,
        is_active: key.is_active,
      })
    }
  }

  return (
    <Stack f={1} gap={16} padding="md">
      {/* Main List */}
      <APIKeysList
        keys={keys}
        isLoading={isLoading}
        onCreateKey={() => setIsCreateModalOpen(true)}
        onRevokeKey={handleRevokeKey}
        onViewUsage={handleViewUsage}
        onManageScopes={handleManageScopes}
      />

      {/* Create Modal */}
      <APIKeyCreateModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreate={handleCreateKey}
      />

      {/* Scopes Manager Modal */}
      {scopesModalKey && (
        <APIKeyScopesManager
          isOpen={!!scopesModalKey}
          onClose={() => setScopesModalKey(null)}
          apiKey={scopesModalKey}
          onUpdateScopes={handleUpdateScopes}
        />
      )}

      {/* Usage Chart (shown as overlay or separate view) */}
      {usageKeyId && (
        <Stack
          position="absolute"
          top={0}
          left={0}
          right={0}
          bottom={0}
          backgroundColor="$background"
          padding="md"
          zi={100}
        >
          <APIKeyUsageChart apiKeyId={usageKeyId} onClose={() => setUsageKeyId(null)} />
        </Stack>
      )}
    </Stack>
  )
}
