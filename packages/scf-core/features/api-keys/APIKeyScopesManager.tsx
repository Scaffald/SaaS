/**
 * API Key Scopes Manager
 * Manage and update permissions/scopes for existing API keys
 */

import { useState } from 'react'
import {
  Button,
  Card,
  Dialog,
  H3,
  H4,
  Label,
  Paragraph,
  Separator,
  Spinner,
  XStack,
  YStack,
  Checkbox,
  ScrollView,
} from '@unicornlove/ui'
import {
  AlertCircle,
  CheckCircle,
  Info,
  Lock,
  Shield,
  XCircle,
} from '@tamagui/lucide-icons'

interface APIKeyScopesManagerProps {
  isOpen: boolean
  onClose: () => void
  apiKey: {
    id: string
    name: string
    scopes: string[]
    is_active: boolean
  }
  onUpdateScopes: (keyId: string, scopes: string[]) => Promise<void>
}

interface ScopeDefinition {
  id: string
  label: string
  description: string
  category: 'read' | 'write'
  requires?: string[] // Dependencies
  warning?: string // Special warnings for dangerous scopes
}

const SCOPE_DEFINITIONS: ScopeDefinition[] = [
  {
    id: 'read:jobs',
    label: 'Read Jobs',
    description: 'View published job listings and details',
    category: 'read',
  },
  {
    id: 'write:jobs',
    label: 'Write Jobs',
    description: 'Create, update, and manage job postings',
    category: 'write',
    requires: ['read:jobs'],
    warning: 'Requires employer account. Allows creating and modifying job postings.',
  },
  {
    id: 'read:applications',
    label: 'Read Applications',
    description: 'View job application submissions and status',
    category: 'read',
  },
  {
    id: 'write:applications',
    label: 'Write Applications',
    description: 'Submit and manage job applications',
    category: 'write',
    requires: ['read:applications'],
  },
  {
    id: 'read:profile',
    label: 'Read Profile',
    description: 'View user profile information and public data',
    category: 'read',
  },
  {
    id: 'write:profile',
    label: 'Write Profile',
    description: 'Update user profile information and settings',
    category: 'write',
    requires: ['read:profile'],
    warning: 'Allows modifying user profile data including contact information.',
  },
  {
    id: 'read:organizations',
    label: 'Read Organizations',
    description: 'View organization information and settings',
    category: 'read',
  },
  {
    id: 'write:organizations',
    label: 'Write Organizations',
    description: 'Manage organization settings, members, and configuration',
    category: 'write',
    requires: ['read:organizations'],
    warning:
      'Requires organization admin role. Grants full access to organization management including member management and billing.',
  },
]

export function APIKeyScopesManager({
  isOpen,
  onClose,
  apiKey,
  onUpdateScopes,
}: APIKeyScopesManagerProps) {
  const [selectedScopes, setSelectedScopes] = useState<string[]>(apiKey.scopes)
  const [isUpdating, setIsUpdating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleClose = () => {
    setSelectedScopes(apiKey.scopes)
    setError(null)
    setSuccess(false)
    onClose()
  }

  const toggleScope = (scopeId: string) => {
    const scope = SCOPE_DEFINITIONS.find((s) => s.id === scopeId)

    if (!scope) return

    if (selectedScopes.includes(scopeId)) {
      // Removing scope - check if other scopes depend on it
      const dependentScopes = SCOPE_DEFINITIONS.filter(
        (s) => s.requires?.includes(scopeId) && selectedScopes.includes(s.id)
      )

      if (dependentScopes.length > 0) {
        setError(
          `Cannot remove ${scope.label}. The following scopes depend on it: ${dependentScopes.map((s) => s.label).join(', ')}`
        )
        return
      }

      setSelectedScopes((prev) => prev.filter((s) => s !== scopeId))
    } else {
      // Adding scope - check dependencies
      const missingDeps = scope.requires?.filter((req) => !selectedScopes.includes(req)) || []

      if (missingDeps.length > 0) {
        // Auto-add dependencies
        setSelectedScopes((prev) => [...prev, ...missingDeps, scopeId])
      } else {
        setSelectedScopes((prev) => [...prev, scopeId])
      }
    }

    setError(null)
  }

  const handleUpdate = async () => {
    if (selectedScopes.length === 0) {
      setError('API key must have at least one permission scope')
      return
    }

    setError(null)
    setIsUpdating(true)

    try {
      await onUpdateScopes(apiKey.id, selectedScopes)
      setSuccess(true)
      setTimeout(() => {
        handleClose()
      }, 1500)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update scopes')
    } finally {
      setIsUpdating(false)
    }
  }

  const hasChanges = () => {
    if (selectedScopes.length !== apiKey.scopes.length) return true
    return selectedScopes.some((scope) => !apiKey.scopes.includes(scope))
  }

  const getAddedScopes = () => {
    return selectedScopes.filter((scope) => !apiKey.scopes.includes(scope))
  }

  const getRemovedScopes = () => {
    return apiKey.scopes.filter((scope) => !selectedScopes.includes(scope))
  }

  return (
    <Dialog modal open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <Dialog.Portal>
        <Dialog.Overlay
          key="overlay"
          animation="quick"
          opacity={0.5}
          enterStyle={{ opacity: 0 }}
          exitStyle={{ opacity: 0 }}
        />

        <Dialog.Content
          bordered
          elevate
          key="content"
          animateOnly={['transform', 'opacity']}
          animation={[
            'quick',
            {
              opacity: {
                overshootClamping: true,
              },
            },
          ]}
          enterStyle={{ x: 0, y: -20, opacity: 0, scale: 0.9 }}
          exitStyle={{ x: 0, y: 10, opacity: 0, scale: 0.95 }}
          gap="$4"
          width="90%"
          maxWidth={700}
          maxHeight="85vh"
        >
          <YStack gap="$4" f={1}>
            {/* Header */}
            <Dialog.Title>
              <H3>Manage API Key Permissions</H3>
            </Dialog.Title>
            <Dialog.Description>
              <Paragraph color="$gray11">{apiKey.name}</Paragraph>
            </Dialog.Description>

            {!apiKey.is_active && (
              <Card backgroundColor="$orange2" borderColor="$orange6" borderWidth={1} padding="$3">
                <XStack ai="center" gap="$2">
                  <AlertCircle size={20} color="$orange11" />
                  <Paragraph color="$orange11">
                    This API key is revoked. Updating scopes will not re-activate it.
                  </Paragraph>
                </XStack>
              </Card>
            )}

            <Separator />

            {/* Info Card */}
            <Card backgroundColor="$blue2" borderColor="$blue6" borderWidth={1} padding="$3">
              <XStack ai="flex-start" gap="$3">
                <Info size={20} color="$blue11" mt="$0.5" />
                <YStack f={1} gap="$2">
                  <Paragraph fontWeight="600" color="$blue11">
                    Permission Scopes
                  </Paragraph>
                  <Paragraph size="$3" color="$blue11">
                    Scopes control what your API key can access. Grant only the minimum permissions
                    needed for your use case (principle of least privilege).
                  </Paragraph>
                </YStack>
              </XStack>
            </Card>

            {/* Scopes Selection - Scrollable */}
            <ScrollView maxHeight={400}>
              <YStack gap="$4">
                {/* Read Permissions */}
                <YStack gap="$3">
                  <XStack ai="center" gap="$2">
                    <Shield size={20} color="$green10" />
                    <H4>Read Permissions</H4>
                  </XStack>
                  <YStack gap="$2">
                    {SCOPE_DEFINITIONS.filter((s) => s.category === 'read').map((scope) => (
                      <Card
                        key={scope.id}
                        padding="$3"
                        backgroundColor={
                          selectedScopes.includes(scope.id) ? '$green2' : '$gray2'
                        }
                        borderColor={
                          selectedScopes.includes(scope.id) ? '$green6' : '$gray6'
                        }
                        borderWidth={1}
                        pressStyle={{ scale: 0.98 }}
                        onPress={() => toggleScope(scope.id)}
                        cursor="pointer"
                      >
                        <XStack ai="flex-start" gap="$3">
                          <Checkbox
                            checked={selectedScopes.includes(scope.id)}
                            onCheckedChange={() => toggleScope(scope.id)}
                            mt="$0.5"
                          />
                          <YStack f={1} gap="$2">
                            <Paragraph fontWeight="600">{scope.label}</Paragraph>
                            <Paragraph size="$2" color="$gray11">
                              {scope.description}
                            </Paragraph>
                            {scope.requires && scope.requires.length > 0 && (
                              <XStack ai="center" gap="$2" flexWrap="wrap">
                                <Paragraph size="$2" color="$gray11">
                                  Requires:
                                </Paragraph>
                                {scope.requires.map((req) => (
                                  <Card
                                    key={req}
                                    backgroundColor="$gray4"
                                    paddingHorizontal="$2"
                                    paddingVertical="$1"
                                    borderRadius="$2"
                                  >
                                    <Paragraph size="$1" color="$gray11" fontFamily="$mono">
                                      {req}
                                    </Paragraph>
                                  </Card>
                                ))}
                              </XStack>
                            )}
                          </YStack>
                        </XStack>
                      </Card>
                    ))}
                  </YStack>
                </YStack>

                {/* Write Permissions */}
                <YStack gap="$3">
                  <XStack ai="center" gap="$2">
                    <Lock size={20} color="$orange10" />
                    <H4>Write Permissions</H4>
                  </XStack>
                  <YStack gap="$2">
                    {SCOPE_DEFINITIONS.filter((s) => s.category === 'write').map((scope) => (
                      <Card
                        key={scope.id}
                        padding="$3"
                        backgroundColor={
                          selectedScopes.includes(scope.id) ? '$orange2' : '$gray2'
                        }
                        borderColor={
                          selectedScopes.includes(scope.id) ? '$orange6' : '$gray6'
                        }
                        borderWidth={1}
                        pressStyle={{ scale: 0.98 }}
                        onPress={() => toggleScope(scope.id)}
                        cursor="pointer"
                      >
                        <XStack ai="flex-start" gap="$3">
                          <Checkbox
                            checked={selectedScopes.includes(scope.id)}
                            onCheckedChange={() => toggleScope(scope.id)}
                            mt="$0.5"
                          />
                          <YStack f={1} gap="$2">
                            <Paragraph fontWeight="600">{scope.label}</Paragraph>
                            <Paragraph size="$2" color="$gray11">
                              {scope.description}
                            </Paragraph>
                            {scope.warning && (
                              <Card
                                backgroundColor="$orange2"
                                borderColor="$orange6"
                                borderWidth={1}
                                padding="$2"
                              >
                                <XStack ai="flex-start" gap="$2">
                                  <AlertCircle size={14} color="$orange11" mt="$0.5" />
                                  <Paragraph size="$2" color="$orange11" f={1}>
                                    {scope.warning}
                                  </Paragraph>
                                </XStack>
                              </Card>
                            )}
                            {scope.requires && scope.requires.length > 0 && (
                              <XStack ai="center" gap="$2" flexWrap="wrap">
                                <Paragraph size="$2" color="$gray11">
                                  Requires:
                                </Paragraph>
                                {scope.requires.map((req) => (
                                  <Card
                                    key={req}
                                    backgroundColor="$gray4"
                                    paddingHorizontal="$2"
                                    paddingVertical="$1"
                                    borderRadius="$2"
                                  >
                                    <Paragraph size="$1" color="$gray11" fontFamily="$mono">
                                      {req}
                                    </Paragraph>
                                  </Card>
                                ))}
                              </XStack>
                            )}
                          </YStack>
                        </XStack>
                      </Card>
                    ))}
                  </YStack>
                </YStack>
              </YStack>
            </ScrollView>

            {/* Summary */}
            <Card backgroundColor="$gray3" padding="$3">
              <YStack gap="$2">
                <Paragraph size="$2" color="$gray11">
                  Selected Permissions
                </Paragraph>
                <XStack gap="$2" flexWrap="wrap">
                  {selectedScopes.length === 0 ? (
                    <Paragraph size="$3" color="$gray11">
                      No permissions selected
                    </Paragraph>
                  ) : (
                    selectedScopes.map((scope) => (
                      <Card
                        key={scope}
                        backgroundColor="$blue3"
                        paddingHorizontal="$2"
                        paddingVertical="$1"
                        borderRadius="$2"
                      >
                        <Paragraph size="$2" color="$blue11">
                          {scope}
                        </Paragraph>
                      </Card>
                    ))
                  )}
                </XStack>
              </YStack>
            </Card>

            {/* Changes Summary */}
            {hasChanges() && (
              <Card backgroundColor="$yellow2" borderColor="$yellow6" borderWidth={1} padding="$3">
                <YStack gap="$2">
                  <Paragraph fontWeight="600" color="$yellow11">
                    Pending Changes
                  </Paragraph>
                  {getAddedScopes().length > 0 && (
                    <XStack gap="$2" ai="center">
                      <CheckCircle size={16} color="$green11" />
                      <Paragraph size="$3" color="$gray11">
                        Adding: {getAddedScopes().join(', ')}
                      </Paragraph>
                    </XStack>
                  )}
                  {getRemovedScopes().length > 0 && (
                    <XStack gap="$2" ai="center">
                      <XCircle size={16} color="$red11" />
                      <Paragraph size="$3" color="$gray11">
                        Removing: {getRemovedScopes().join(', ')}
                      </Paragraph>
                    </XStack>
                  )}
                </YStack>
              </Card>
            )}

            {/* Error Message */}
            {error && (
              <Card backgroundColor="$red2" borderColor="$red6" borderWidth={1} padding="$3">
                <XStack ai="center" gap="$2">
                  <AlertCircle size={20} color="$red11" />
                  <Paragraph color="$red11" f={1}>
                    {error}
                  </Paragraph>
                </XStack>
              </Card>
            )}

            {/* Success Message */}
            {success && (
              <Card backgroundColor="$green2" borderColor="$green6" borderWidth={1} padding="$3">
                <XStack ai="center" gap="$2">
                  <CheckCircle size={20} color="$green11" />
                  <Paragraph color="$green11">Scopes updated successfully!</Paragraph>
                </XStack>
              </Card>
            )}

            {/* Actions */}
            <XStack gap="$3" jc="flex-end">
              <Dialog.Close asChild>
                <Button variant="outlined" disabled={isUpdating || success}>
                  Cancel
                </Button>
              </Dialog.Close>
              <Button
                theme="blue"
                onPress={handleUpdate}
                disabled={isUpdating || !hasChanges() || selectedScopes.length === 0 || success}
                icon={isUpdating ? <Spinner /> : undefined}
              >
                {isUpdating ? 'Updating...' : 'Update Permissions'}
              </Button>
            </XStack>
          </YStack>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog>
  )
}
