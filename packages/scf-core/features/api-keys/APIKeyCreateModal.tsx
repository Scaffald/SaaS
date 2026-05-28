/**
 * API Key Creation Modal
 * Modal for creating new API keys with scope selection and expiration
 */

import { useState } from 'react'
import {
  Button,
  Card,
  Modal,
  ModalHeader,
  ModalContent,
  ModalActions,
  H3,
  Input,
  Label,
  Paragraph,
  Separator,
  Row,
  Stack,
  Checkbox,
  useThemeContext,
} from '@scaffald/ui'
import { colors } from '@scaffald/ui/tokens'
import { copyToClipboard as copyText } from '@scf/core/utils/clipboard'
import { AlertCircle, CheckCircle, Copy } from 'lucide-react-native'
import { format, addMonths } from 'date-fns'

export interface APIKeyCreateModalProps {
  isOpen: boolean
  onClose: () => void
  onCreate: (params: CreateKeyParams) => Promise<CreateKeyResponse>
}

export interface CreateKeyParams {
  name: string
  scopes: string[]
  expiresAt?: string
}

export interface CreateKeyResponse {
  id: string
  key: string
  name: string
  scopes: string[]
  created_at: string
  expires_at?: string
}

interface ScopeOption {
  id: string
  label: string
  description: string
  category: 'read' | 'write'
}

const AVAILABLE_SCOPES: ScopeOption[] = [
  {
    id: 'read:jobs',
    label: 'Read Jobs',
    description: 'View published job listings',
    category: 'read',
  },
  {
    id: 'write:jobs',
    label: 'Write Jobs',
    description: 'Create and manage job postings (requires employer account)',
    category: 'write',
  },
  {
    id: 'read:applications',
    label: 'Read Applications',
    description: 'View application submissions',
    category: 'read',
  },
  {
    id: 'write:applications',
    label: 'Write Applications',
    description: 'Submit and manage job applications',
    category: 'write',
  },
  {
    id: 'read:profile',
    label: 'Read Profile',
    description: 'View user profile information',
    category: 'read',
  },
  {
    id: 'write:profile',
    label: 'Write Profile',
    description: 'Update user profile information',
    category: 'write',
  },
  {
    id: 'read:organizations',
    label: 'Read Organizations',
    description: 'View organization information',
    category: 'read',
  },
  {
    id: 'write:organizations',
    label: 'Write Organizations',
    description: 'Manage organization settings (requires admin)',
    category: 'write',
  },
]

const EXPIRATION_OPTIONS = [
  { label: 'Never', value: null },
  { label: '30 days', value: 30 },
  { label: '60 days', value: 60 },
  { label: '90 days', value: 90 },
  { label: '180 days', value: 180 },
  { label: '1 year', value: 365 },
]

export function APIKeyCreateModal({ isOpen, onClose, onCreate }: APIKeyCreateModalProps) {
  const { theme } = useThemeContext()
  // Form state
  const [step, setStep] = useState<'configure' | 'created'>('configure')
  const [keyName, setKeyName] = useState('')
  const [selectedScopes, setSelectedScopes] = useState<string[]>([])
  const [expirationDays, setExpirationDays] = useState<number | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Created key state
  const [createdKey, setCreatedKey] = useState<CreateKeyResponse | null>(null)
  const [keyCopied, setKeyCopied] = useState(false)

  const handleClose = () => {
    // Reset state
    setStep('configure')
    setKeyName('')
    setSelectedScopes([])
    setExpirationDays(null)
    setError(null)
    setCreatedKey(null)
    setKeyCopied(false)
    onClose()
  }

  const toggleScope = (scopeId: string) => {
    setSelectedScopes((prev) =>
      prev.includes(scopeId) ? prev.filter((s) => s !== scopeId) : [...prev, scopeId]
    )
  }

  const handleCreate = async () => {
    // Validation
    if (!keyName.trim()) {
      setError('Please enter a name for your API key')
      return
    }

    if (selectedScopes.length === 0) {
      setError('Please select at least one permission scope')
      return
    }

    setError(null)
    setIsCreating(true)

    try {
      const expiresAt = expirationDays
        ? addMonths(new Date(), expirationDays / 30).toISOString()
        : undefined

      const result = await onCreate({
        name: keyName.trim(),
        scopes: selectedScopes,
        expiresAt,
      })

      setCreatedKey(result)
      setStep('created')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create API key')
    } finally {
      setIsCreating(false)
    }
  }

  const copyToClipboard = () => {
    if (createdKey) {
      void copyText(createdKey.key)
      setKeyCopied(true)
    }
  }

  return (
    <Modal visible={isOpen} onClose={handleClose} width={600}>
      <ModalHeader title={step === 'configure' ? 'Create API Key' : 'API Key Created!'} />
      <ModalContent>
        {step === 'configure' ? (
          <Stack gap={16}>
            <Paragraph color={colors.text[theme].tertiary}>
              Create a new API key to access the Scaffald API programmatically
            </Paragraph>

            <Separator />

            {/* Form */}
            <Stack gap={16}>
              {/* Key Name */}
              <Stack gap={8}>
                <Label htmlFor="key-name">Key Name</Label>
                <Input
                  id="key-name"
                  placeholder="Production API Key"
                  value={keyName}
                  onChangeText={setKeyName}
                  disabled={isCreating}
                />
                <Paragraph size="sm" color={colors.text[theme].tertiary}>
                  A descriptive name to identify this key
                </Paragraph>
              </Stack>

              {/* Scopes Selection */}
              <Stack gap={12}>
                <Label>Permissions</Label>

                {/* Read Permissions */}
                <Stack gap={8}>
                  <Paragraph size="sm" color={colors.text[theme].primary}>
                    Read Permissions
                  </Paragraph>
                  {AVAILABLE_SCOPES.filter((s) => s.category === 'read').map((scope) => (
                    <Card
                      key={scope.id}
                      pressable
                      padding="sm"
                      onPress={() => toggleScope(scope.id)}
                      style={{
                        backgroundColor: selectedScopes.includes(scope.id)
                          ? colors.blue[100]
                          : colors.bg[theme].muted,
                        borderColor: selectedScopes.includes(scope.id)
                          ? colors.blue[600]
                          : colors.border[theme].default,
                        borderWidth: 1,
                      }}
                    >
                      <Row align="center" gap={12}>
                        <Checkbox
                          checked={selectedScopes.includes(scope.id)}
                          onChange={() => toggleScope(scope.id)}
                        />
                        <Stack flex={1} gap={4}>
                          <Paragraph>{scope.label}</Paragraph>
                          <Paragraph size="sm" color={colors.text[theme].tertiary}>
                            {scope.description}
                          </Paragraph>
                        </Stack>
                      </Row>
                    </Card>
                  ))}
                </Stack>

                {/* Write Permissions */}
                <Stack gap={8}>
                  <Paragraph size="sm" color={colors.text[theme].primary}>
                    Write Permissions
                  </Paragraph>
                  {AVAILABLE_SCOPES.filter((s) => s.category === 'write').map((scope) => (
                    <Card
                      key={scope.id}
                      pressable
                      padding="sm"
                      onPress={() => toggleScope(scope.id)}
                      style={{
                        backgroundColor: selectedScopes.includes(scope.id)
                          ? colors.blue[100]
                          : colors.bg[theme].muted,
                        borderColor: selectedScopes.includes(scope.id)
                          ? colors.blue[600]
                          : colors.border[theme].default,
                        borderWidth: 1,
                      }}
                    >
                      <Row align="center" gap={12}>
                        <Checkbox
                          checked={selectedScopes.includes(scope.id)}
                          onChange={() => toggleScope(scope.id)}
                        />
                        <Stack flex={1} gap={4}>
                          <Paragraph>{scope.label}</Paragraph>
                          <Paragraph size="sm" color={colors.text[theme].tertiary}>
                            {scope.description}
                          </Paragraph>
                        </Stack>
                      </Row>
                    </Card>
                  ))}
                </Stack>

                <Paragraph size="sm" color={colors.text[theme].tertiary}>
                  Selected: {selectedScopes.length} permission
                  {selectedScopes.length !== 1 ? 's' : ''}
                </Paragraph>
              </Stack>

              {/* Expiration */}
              <Stack gap={8}>
                <Label>Expiration</Label>
                <Row gap={8} wrap>
                  {EXPIRATION_OPTIONS.map((option) => (
                    <Button
                      key={option.label}
                      size="sm"
                      variant="outline"
                      color={expirationDays === option.value ? 'primary' : 'gray'}
                      onPress={() => setExpirationDays(option.value)}
                      disabled={isCreating}
                    >
                      {option.label}
                    </Button>
                  ))}
                </Row>
                <Paragraph size="sm" color={colors.text[theme].tertiary}>
                  {expirationDays
                    ? `Key will expire on ${format(addMonths(new Date(), expirationDays / 30), 'MMM d, yyyy')}`
                    : 'Key will never expire (not recommended for production)'}
                </Paragraph>
              </Stack>

              {/* Error Message */}
              {error && (
                <Card
                  padding="sm"
                  style={{
                    backgroundColor: colors.error[50],
                    borderColor: colors.border[theme].error,
                    borderWidth: 1,
                  }}
                >
                  <Row align="center" gap={8}>
                    <AlertCircle size={24} color={colors.fg[theme].error} />
                    <Paragraph color={colors.fg[theme].error}>{error}</Paragraph>
                  </Row>
                </Card>
              )}
            </Stack>
          </Stack>
        ) : (
          <Stack gap={16}>
            {/* Success Header */}
            <Stack align="center" gap={12}>
              <Card variant="glass" padding="md" style={{ backgroundColor: colors.success[100], borderRadius: 8 }}>
                <CheckCircle size={48} color={colors.fg[theme].success} />
              </Card>
              <H3>API Key Created!</H3>
              <Paragraph color={colors.text[theme].tertiary} style={{ textAlign: 'center' }}>
                Your API key has been created successfully
              </Paragraph>
            </Stack>

            <Separator />

            {/* Warning */}
            <Card
              padding="md"
              style={{
                backgroundColor: colors.orange[100],
                borderColor: colors.border[theme].warning,
                borderWidth: 1,
              }}
            >
              <Row align="flex-start" gap={12}>
                <AlertCircle size={20} color={colors.fg[theme].warning} />
                <Stack flex={1} gap={8}>
                  <Paragraph color={colors.fg[theme].warning}>Save Your API Key Now</Paragraph>
                  <Paragraph size="sm" color={colors.fg[theme].warning}>
                    This is the only time you'll see the full key. Make sure to copy it and store it
                    securely. If you lose it, you'll need to create a new one.
                  </Paragraph>
                </Stack>
              </Row>
            </Card>

            {/* API Key Display */}
            <Stack gap={12}>
              <Label>API Key</Label>
              <Card variant="glass" padding="md" style={{ backgroundColor: colors.bg[theme].muted, borderRadius: 16 }}>
                <Stack gap={12}>
                  <Paragraph color={colors.text[theme].primary} style={{ fontFamily: 'monospace' as const }}>
                    {createdKey?.key}
                  </Paragraph>
                  <Button
                    iconStart={Copy}
                    onPress={copyToClipboard}
                    color={keyCopied ? 'success' : 'primary'}
                    disabled={keyCopied}
                  >
                    {keyCopied ? 'Copied!' : 'Copy to Clipboard'}
                  </Button>
                </Stack>
              </Card>
            </Stack>

            {/* Key Details */}
            <Stack gap={8}>
              <Paragraph size="sm" color={colors.text[theme].tertiary}>
                Name
              </Paragraph>
              <Paragraph>{createdKey?.name}</Paragraph>
            </Stack>

            <Stack gap={8}>
              <Paragraph size="sm" color={colors.text[theme].tertiary}>
                Permissions
              </Paragraph>
              <Row gap={8} wrap>
                {createdKey?.scopes.map((scope) => (
                  <Card
                    key={scope}
                    padding="sm"
                    style={{
                      backgroundColor: colors.blue[200],
                      borderRadius: 8,
                    }}
                  >
                    <Paragraph size="sm" color={colors.blue[700]}>
                      {scope}
                    </Paragraph>
                  </Card>
                ))}
              </Row>
            </Stack>

            {createdKey?.expires_at && (
              <Stack gap={8}>
                <Paragraph size="sm" color={colors.text[theme].tertiary}>
                  Expires
                </Paragraph>
                <Paragraph color={colors.fg[theme].warning}>
                  {format(new Date(createdKey.expires_at), 'MMM d, yyyy')}
                </Paragraph>
              </Stack>
            )}

            {/* Documentation Link */}
            <Card
              padding="md"
              style={{
                backgroundColor: colors.blue[100],
                borderColor: colors.blue[600],
                borderWidth: 1,
              }}
            >
              <Stack gap={8}>
                <Paragraph color={colors.blue[700]}>Next Steps</Paragraph>
                <Paragraph size="sm" color={colors.blue[700]}>
                  Check out our SDK documentation to learn how to use your API key:
                </Paragraph>
                <Paragraph size="sm" color={colors.blue[700]} style={{ fontFamily: 'monospace' }}>
                  packages/scaffald-sdk/docs/getting-started.md
                </Paragraph>
              </Stack>
            </Card>
          </Stack>
        )}
      </ModalContent>
      <ModalActions
        orientation="right"
        primaryAction={
          step === 'configure'
            ? {
                label: isCreating ? 'Creating...' : 'Create API Key',
                onPress: handleCreate,
                disabled: isCreating,
                loading: isCreating,
              }
            : { label: 'Done', onPress: handleClose }
        }
        secondaryAction={
          step === 'configure' ? { label: 'Cancel', onPress: handleClose } : undefined
        }
      />
    </Modal>
  )
}
