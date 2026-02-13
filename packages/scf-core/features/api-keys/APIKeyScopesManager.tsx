/**
 * API Key Scopes Manager
 * Manage and update permissions/scopes for existing API keys
 */

import { useState } from 'react'
import {
  Card,
  Modal,
  ModalHeader,
  ModalContent,
  ModalActions,
  H3,
  H4,
  Paragraph,
  Separator,
  Row,
  Stack,
  Checkbox,
} from '@scaffald/ui'
import { AlertCircle, CheckCircle, Info, Lock, Shield, XCircle } from 'lucide-react-native'

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
    <Modal visible={isOpen} onClose={handleClose}>
      <ModalHeader title="Manage API Key Permissions" subtitle={apiKey.name} />
      <ModalContent>
        <Stack gap={16}>
            {!apiKey.is_active && (
              <Card
                padding="sm"
                style={{ backgroundColor: '$orange2', borderColor: '$orange6', borderWidth: 1 }}
              >
                <Row align="center" gap={8}>
                  <AlertCircle size="lg" color="$orange11" />
                  <Paragraph color="$orange11">
                    This API key is revoked. Updating scopes will not re-activate it.
                  </Paragraph>
                </Row>
              </Card>
            )}

            <Separator />

            {/* Info Card */}
            <Card
              padding="sm"
              style={{ backgroundColor: '$blue2', borderColor: '$blue6', borderWidth: 1 }}
            >
              <Row align="flex-start" gap={12}>
                <Info size={24} color="$blue11" />
                <Stack flex={1} gap={8}>
                  <Paragraph color="$blue11">Permission Scopes</Paragraph>
                  <Paragraph size="sm" color="$blue11">
                    Scopes control what your API key can access. Grant only the minimum permissions
                    needed for your use case (principle of least privilege).
                  </Paragraph>
                </Stack>
              </Row>
            </Card>

            {/* Scopes Selection - Scrollable */}
            <Stack gap={16} style={{ maxHeight: 400 }}>
                {/* Read Permissions */}
                <Stack gap={12}>
                  <Row align="center" gap={8}>
                    <Shield size="lg" color="$green10" />
                    <H4>Read Permissions</H4>
                  </Row>
                  <Stack gap={8}>
                    {SCOPE_DEFINITIONS.filter((s) => s.category === 'read').map((scope) => (
                      <Card
                        key={scope.id}
                        padding="sm"
                        pressable
                        onPress={() => toggleScope(scope.id)}
                        style={{
                          backgroundColor: selectedScopes.includes(scope.id) ? '$green2' : '$gray2',
                          borderColor: selectedScopes.includes(scope.id) ? '$green6' : '$gray6',
                          borderWidth: 1,
                        }}
                      >
                        <Row align="flex-start" gap={12}>
                          <Checkbox
                            checked={selectedScopes.includes(scope.id)}
                            onChange={() => toggleScope(scope.id)}
                          />
                          <Stack flex={1} gap={8}>
                            <Paragraph>{scope.label}</Paragraph>
                            <Paragraph size="sm" color="$gray11">
                              {scope.description}
                            </Paragraph>
                            {scope.requires && scope.requires.length > 0 && (
                              <Row align="center" gap={8} wrap>
                                <Paragraph size="sm" color="$gray11">
                                  Requires:
                                </Paragraph>
                                {scope.requires.map((req) => (
                                  <Card
                                    key={req}
                                    style={{
                                      backgroundColor: '$gray4',
                                      paddingHorizontal: 8,
                                      paddingVertical: 4,
                                      borderRadius: 8,
                                    }}
                                  >
                                    <Paragraph size="sm" color="$gray11" style={{ fontFamily: '$mono' }}>
                                      {req}
                                    </Paragraph>
                                  </Card>
                                ))}
                              </Row>
                            )}
                          </Stack>
                        </Row>
                      </Card>
                    ))}
                  </Stack>
                </Stack>

                {/* Write Permissions */}
                <Stack gap={12}>
                  <Row align="center" gap={8}>
                    <Lock size="lg" color="$orange10" />
                    <H4>Write Permissions</H4>
                  </Row>
                  <Stack gap={8}>
                    {SCOPE_DEFINITIONS.filter((s) => s.category === 'write').map((scope) => (
                      <Card
                        key={scope.id}
                        padding="sm"
                        pressable
                        onPress={() => toggleScope(scope.id)}
                        style={{
                          backgroundColor: selectedScopes.includes(scope.id) ? '$orange2' : '$gray2',
                          borderColor: selectedScopes.includes(scope.id) ? '$orange6' : '$gray6',
                          borderWidth: 1,
                        }}
                      >
                        <Row align="flex-start" gap={12}>
                          <Checkbox
                            checked={selectedScopes.includes(scope.id)}
                            onChange={() => toggleScope(scope.id)}
                          />
                          <Stack flex={1} gap={8}>
                            <Paragraph>{scope.label}</Paragraph>
                            <Paragraph size="sm" color="$gray11">
                              {scope.description}
                            </Paragraph>
                            {scope.warning && (
                              <Card
                                padding="sm"
                                style={{
                                  backgroundColor: '$orange2',
                                  borderColor: '$orange6',
                                  borderWidth: 1,
                                }}
                              >
                                <Row align="flex-start" gap={8}>
                                  <AlertCircle size={20} color="$orange11" />
                                  <Paragraph size="sm" color="$orange11" style={{ flex: 1 }}>
                                    {scope.warning}
                                  </Paragraph>
                                </Row>
                              </Card>
                            )}
                            {scope.requires && scope.requires.length > 0 && (
                              <Row align="center" gap={8} wrap>
                                <Paragraph size="sm" color="$gray11">
                                  Requires:
                                </Paragraph>
                                {scope.requires.map((req) => (
                                  <Card
                                    key={req}
                                    style={{
                                      backgroundColor: '$gray4',
                                      paddingHorizontal: 8,
                                      paddingVertical: 4,
                                      borderRadius: 8,
                                    }}
                                  >
                                    <Paragraph size="sm" color="$gray11" style={{ fontFamily: '$mono' }}>
                                      {req}
                                    </Paragraph>
                                  </Card>
                                ))}
                              </Row>
                            )}
                          </Stack>
                        </Row>
                      </Card>
                    ))}
                  </Stack>
                </Stack>
              </Stack>

            {/* Summary */}
            <Card padding="sm" style={{ backgroundColor: '$gray3' }}>
              <Stack gap={8}>
                <Paragraph size="sm" color="$gray11">
                  Selected Permissions
                </Paragraph>
                <Row gap={8} wrap>
                  {selectedScopes.length === 0 ? (
                    <Paragraph size="sm" color="$gray11">
                      No permissions selected
                    </Paragraph>
                  ) : (
                    selectedScopes.map((scope) => (
                      <Card
                        key={scope}
                        style={{
                          backgroundColor: '$blue3',
                          paddingHorizontal: 8,
                          paddingVertical: 4,
                          borderRadius: 8,
                        }}
                      >
                        <Paragraph size="sm" color="$blue11">
                          {scope}
                        </Paragraph>
                      </Card>
                    ))
                  )}
                </Row>
              </Stack>
            </Card>

            {/* Changes Summary */}
            {hasChanges() && (
              <Card
                padding="sm"
                style={{
                  backgroundColor: '$yellow2',
                  borderColor: '$yellow6',
                  borderWidth: 1,
                }}
              >
                <Stack gap={8}>
                  <Paragraph color="$yellow11">Pending Changes</Paragraph>
                  {getAddedScopes().length > 0 && (
                    <Row gap={8} align="center">
                      <CheckCircle size="md" color="$green11" />
                      <Paragraph size="sm" color="$gray11">
                        Adding: {getAddedScopes().join(', ')}
                      </Paragraph>
                    </Row>
                  )}
                  {getRemovedScopes().length > 0 && (
                    <Row gap={8} align="center">
                      <XCircle size="md" color="$red11" />
                      <Paragraph size="sm" color="$gray11">
                        Removing: {getRemovedScopes().join(', ')}
                      </Paragraph>
                    </Row>
                  )}
                </Stack>
              </Card>
            )}

            {/* Error Message */}
            {error && (
              <Card
                padding="sm"
                style={{
                  backgroundColor: '$red2',
                  borderColor: '$red6',
                  borderWidth: 1,
                }}
              >
                <Row align="center" gap={8}>
                  <AlertCircle size={24} color="$red11" />
                  <Paragraph color="$red11" style={{ flex: 1 }}>
                    {error}
                  </Paragraph>
                </Row>
              </Card>
            )}

            {/* Success Message */}
            {success && (
              <Card
                padding="sm"
                style={{
                  backgroundColor: '$green2',
                  borderColor: '$green6',
                  borderWidth: 1,
                }}
              >
                <Row align="center" gap={8}>
                  <CheckCircle size="lg" color="$green11" />
                  <Paragraph color="$green11">Scopes updated successfully!</Paragraph>
                </Row>
              </Card>
            )}

        </Stack>
      </ModalContent>
      <ModalActions
        orientation="right"
        primaryAction={{
          label: isUpdating ? 'Updating...' : 'Update Permissions',
          onPress: handleUpdate,
          loading: isUpdating,
          disabled: isUpdating || !hasChanges() || selectedScopes.length === 0 || success,
        }}
        secondaryAction={{
          label: 'Cancel',
          onPress: handleClose,
          disabled: isUpdating || success,
        }}
      />
    </Modal>
  )
}
