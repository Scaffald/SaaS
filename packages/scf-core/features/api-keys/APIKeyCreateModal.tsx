/**
 * API Key Creation Modal
 * Modal for creating new API keys with scope selection and expiration
 */

import { useState } from 'react'
import {
  Button,
  Card,
  Dialog,
  H3,
  Input,
  Label,
  Paragraph,
  Separator,
  Row,
  Stack,
  Checkbox,
  Spinner,
} from '@unicornlove/beyond-ui'
import { AlertCircle, CheckCircle, Copy } from 'lucide-react-native'
import { format, addMonths } from 'date-fns'

interface APIKeyCreateModalProps {
  isOpen: boolean
  onClose: () => void
  onCreate: (params: CreateKeyParams) => Promise<CreateKeyResponse>
}

interface CreateKeyParams {
  name: string
  scopes: string[]
  expiresAt?: string
}

interface CreateKeyResponse {
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
      navigator.clipboard.writeText(createdKey.key)
      setKeyCopied(true)
    }
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
          gap={16}
          width="90%"
          maxWidth={600}
        >
          {step === 'configure' ? (
            <Stack gap={16}>
              {/* Header */}
              <Dialog.Title>
                <H3>Create API Key</H3>
              </Dialog.Title>
              <Dialog.Description>
                <Paragraph color="$gray11">
                  Create a new API key to access the Scaffald API programmatically
                </Paragraph>
              </Dialog.Description>

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
                  <Paragraph size="xs" color="$gray11">
                    A descriptive name to identify this key
                  </Paragraph>
                </Stack>

                {/* Scopes Selection */}
                <Stack gap={12}>
                  <Label>Permissions</Label>

                  {/* Read Permissions */}
                  <Stack gap={8}>
                    <Paragraph size="sm" color="$gray12">
                      Read Permissions
                    </Paragraph>
                    {AVAILABLE_SCOPES.filter((s) => s.category === 'read').map((scope) => (
                      <Card
                        key={scope.id}
                        padding="sm"
                        backgroundColor={selectedScopes.includes(scope.id) ? '$blue2' : '$gray2'}
                        borderColor={selectedScopes.includes(scope.id) ? '$blue6' : '$gray6'}
                        borderWidth={1}
                        pressStyle={{ scale: 0.98 }}
                        onPress={() => toggleScope(scope.id)}
                        cursor="pointer"
                      >
                        <Row ai="center" gap={12}>
                          <Checkbox
                            checked={selectedScopes.includes(scope.id)}
                            onChange={() => toggleScope(scope.id)}
                          />
                          <Stack f={1} gap={4}>
                            <Paragraph>{scope.label}</Paragraph>
                            <Paragraph size="xs" color="$gray11">
                              {scope.description}
                            </Paragraph>
                          </Stack>
                        </Row>
                      </Card>
                    ))}
                  </Stack>

                  {/* Write Permissions */}
                  <Stack gap={8}>
                    <Paragraph size="sm" color="$gray12">
                      Write Permissions
                    </Paragraph>
                    {AVAILABLE_SCOPES.filter((s) => s.category === 'write').map((scope) => (
                      <Card
                        key={scope.id}
                        padding="sm"
                        backgroundColor={selectedScopes.includes(scope.id) ? '$blue2' : '$gray2'}
                        borderColor={selectedScopes.includes(scope.id) ? '$blue6' : '$gray6'}
                        borderWidth={1}
                        pressStyle={{ scale: 0.98 }}
                        onPress={() => toggleScope(scope.id)}
                        cursor="pointer"
                      >
                        <Row ai="center" gap={12}>
                          <Checkbox
                            checked={selectedScopes.includes(scope.id)}
                            onChange={() => toggleScope(scope.id)}
                          />
                          <Stack f={1} gap={4}>
                            <Paragraph>{scope.label}</Paragraph>
                            <Paragraph size="xs" color="$gray11">
                              {scope.description}
                            </Paragraph>
                          </Stack>
                        </Row>
                      </Card>
                    ))}
                  </Stack>

                  <Paragraph size="xs" color="$gray11">
                    Selected: {selectedScopes.length} permission
                    {selectedScopes.length !== 1 ? 's' : ''}
                  </Paragraph>
                </Stack>

                {/* Expiration */}
                <Stack gap={8}>
                  <Label>Expiration</Label>
                  <Row gap={8} flexWrap="wrap">
                    {EXPIRATION_OPTIONS.map((option) => (
                      <Button
                        key={option.label}
                        size="sm"
                        variant={expirationDays === option.value ? 'outlined' : 'outlined'}
                        theme={expirationDays === option.value ? 'blue' : undefined}
                        onPress={() => setExpirationDays(option.value)}
                        disabled={isCreating}
                      >
                        {option.label}
                      </Button>
                    ))}
                  </Row>
                  <Paragraph size="xs" color="$gray11">
                    {expirationDays
                      ? `Key will expire on ${format(addMonths(new Date(), expirationDays / 30), 'MMM d, yyyy')}`
                      : 'Key will never expire (not recommended for production)'}
                  </Paragraph>
                </Stack>

                {/* Error Message */}
                {error && (
                  <Card backgroundColor="$red2" borderColor="$red6" borderWidth={1} padding="sm">
                    <Row ai="center" gap={8}>
                      <AlertCircle size="lg" color="$red11" />
                      <Paragraph color="$red11">{error}</Paragraph>
                    </Row>
                  </Card>
                )}
              </Stack>

              {/* Actions */}
              <Row gap={12} jc="flex-end">
                <Dialog.Close asChild>
                  <Button variant="outline" disabled={isCreating}>
                    Cancel
                  </Button>
                </Dialog.Close>
                <Button
                  color="primary"
                  onPress={handleCreate}
                  disabled={isCreating}
                  iconStart={isCreating ? <Spinner /> : undefined}
                >
                  {isCreating ? 'Creating...' : 'Create API Key'}
                </Button>
              </Row>
            </Stack>
          ) : (
            <Stack gap={16}>
              {/* Success Header */}
              <Stack ai="center" gap={12}>
                <Card backgroundColor="$green3" padding="md" borderRadius="$10">
                  <CheckCircle size={48} color="$green11" />
                </Card>
                <H3>API Key Created!</H3>
                <Paragraph color="$gray11" textAlign="center">
                  Your API key has been created successfully
                </Paragraph>
              </Stack>

              <Separator />

              {/* Warning */}
              <Card backgroundColor="$orange2" borderColor="$orange6" borderWidth={1} padding="md">
                <Row ai="flex-start" gap={12}>
                  <AlertCircle size="lg" color="$orange11" mt={2} />
                  <Stack f={1} gap={8}>
                    <Paragraph color="$orange11">Save Your API Key Now</Paragraph>
                    <Paragraph size="sm" color="$orange11">
                      This is the only time you'll see the full key. Make sure to copy it and store
                      it securely. If you lose it, you'll need to create a new one.
                    </Paragraph>
                  </Stack>
                </Row>
              </Card>

              {/* API Key Display */}
              <Stack gap={12}>
                <Label>API Key</Label>
                <Card backgroundColor="$gray3" padding="md" borderRadius={16}>
                  <Stack gap={12}>
                    <Paragraph fontFamily="$mono" color="$gray12" wordWrap="break-word">
                      {createdKey?.key}
                    </Paragraph>
                    <Button
                      iconStart={Copy}
                      onPress={copyToClipboard}
                      theme={keyCopied ? 'green' : 'blue'}
                      disabled={keyCopied}
                    >
                      {keyCopied ? 'Copied!' : 'Copy to Clipboard'}
                    </Button>
                  </Stack>
                </Card>
              </Stack>

              {/* Key Details */}
              <Stack gap={8}>
                <Paragraph size="xs" color="$gray11">
                  Name
                </Paragraph>
                <Paragraph>{createdKey?.name}</Paragraph>
              </Stack>

              <Stack gap={8}>
                <Paragraph size="xs" color="$gray11">
                  Permissions
                </Paragraph>
                <Row gap={8} flexWrap="wrap">
                  {createdKey?.scopes.map((scope) => (
                    <Card
                      key={scope}
                      backgroundColor="$blue3"
                      paddingHorizontal={8}
                      paddingVertical={4}
                      borderRadius={8}
                    >
                      <Paragraph size="xs" color="$blue11">
                        {scope}
                      </Paragraph>
                    </Card>
                  ))}
                </Row>
              </Stack>

              {createdKey?.expires_at && (
                <Stack gap={8}>
                  <Paragraph size="xs" color="$gray11">
                    Expires
                  </Paragraph>
                  <Paragraph color="$orange11">
                    {format(new Date(createdKey.expires_at), 'MMM d, yyyy')}
                  </Paragraph>
                </Stack>
              )}

              {/* Documentation Link */}
              <Card backgroundColor="$blue2" borderColor="$blue6" borderWidth={1} padding="md">
                <Stack gap={8}>
                  <Paragraph color="$blue11">Next Steps</Paragraph>
                  <Paragraph size="sm" color="$blue11">
                    Check out our SDK documentation to learn how to use your API key:
                  </Paragraph>
                  <Paragraph size="sm" color="$blue11" fontFamily="$mono">
                    packages/scaffald-sdk/docs/getting-started.md
                  </Paragraph>
                </Stack>
              </Card>

              {/* Close Button */}
              <Button color="primary" onPress={handleClose}>
                Done
              </Button>
            </Stack>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog>
  )
}
