/**
 * Developer Portal — one organization's API keys.
 *
 * Keys belong to an organization, so the portal is always for one: the
 * organization's Developers tab passes its id, and every call names it, which
 * is also what keeps a member of several organizations from the api's "pass
 * organization_id" refusal (#1440). It used to live at /office/api-keys,
 * which only platform staff could open.
 *
 * Creating, re-scoping and revoking are for the organization's admins; the api
 * refuses anyone else, and `canManage` keeps the controls from being offered.
 */

import { useState } from 'react'
import { ErrorState, Stack } from '@scaffald/ui'
import { useToast } from '@scaffald/ui'
import { confirmDialog } from '@scf/core/utils/platform'
import { APIKeysList } from './APIKeysList'
import { APIKeyCreateModal } from './APIKeyCreateModal'
import { APIKeyScopesManager } from './APIKeyScopesManager'
import { APIKeyUsageChart } from './APIKeyUsageChart'
import { useAPIKeys, useCreateAPIKey, useUpdateAPIKey, useRevokeAPIKey } from './hooks'
import type { ApiKeyScope } from '@scaffald/sdk'
import type { CreateKeyParams } from './APIKeyCreateModal'

export interface DeveloperPortalProps {
  organizationId: string
  /** Whether the viewer is an admin of the organization. */
  canManage: boolean
}

export function DeveloperPortal({ organizationId, canManage }: DeveloperPortalProps) {
  const toast = useToast()

  // Fetch API keys
  const { data: keys = [], isLoading, isError, error, refetch } = useAPIKeys(organizationId)

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
        organization_id: organizationId,
        name: params.name,
        scopes: params.scopes as ApiKeyScope[],
        expires_at: params.expiresAt,
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
        expires_at: result.expires_at ?? undefined,
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
        params: { scopes: scopes as ApiKeyScope[] },
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
    const ok = await confirmDialog({
      title: 'Revoke API key?',
      message: 'Are you sure you want to revoke this API key? This action cannot be undone.',
      confirmLabel: 'Revoke',
      destructive: true,
    })
    if (!ok) return

    try {
      await revokeKey.mutateAsync(keyId)

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

  if (isError) {
    // A failed load is not "no keys" (#1021).
    return (
      <ErrorState
        title="Couldn’t load API keys"
        description="This organization’s API keys did not load. Nothing here does not mean it has none."
        error={error as Error}
        retry={() => refetch()}
      />
    )
  }

  return (
    <Stack flex={1} gap={16}>
      {/* Main List */}
      <APIKeysList
        keys={keys}
        isLoading={isLoading}
        onCreateKey={canManage ? () => setIsCreateModalOpen(true) : undefined}
        onRevokeKey={canManage ? handleRevokeKey : undefined}
        onViewUsage={handleViewUsage}
        onManageScopes={canManage ? handleManageScopes : undefined}
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
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: '#ffffff',
            zIndex: 100,
          }}
          padding="md"
        >
          <APIKeyUsageChart apiKeyId={usageKeyId} onClose={() => setUsageKeyId(null)} />
        </Stack>
      )}
    </Stack>
  )
}
