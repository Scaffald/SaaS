/**
 * API Keys List Component
 * Displays all API keys for an organization with management options
 */

import { useState } from 'react'
import { Button, Card, H2, H4, Paragraph, Separator, Spinner, XStack, YStack } from '@unicornlove/ui'
import { Copy, Key, MoreVertical, Plus, Trash2 } from '@tamagui/lucide-icons'
import { format } from 'date-fns'

interface APIKey {
  id: string
  name: string
  key_prefix: string
  scopes: string[]
  rate_limit_tier: 'free' | 'pro' | 'enterprise'
  is_active: boolean
  last_used_at: string | null
  created_at: string
  expires_at: string | null
}

interface APIKeysListProps {
  keys: APIKey[]
  isLoading?: boolean
  onCreateKey: () => void
  onRevokeKey: (keyId: string) => void
  onViewUsage: (keyId: string) => void
}

export function APIKeysList({
  keys,
  isLoading = false,
  onCreateKey,
  onRevokeKey,
  onViewUsage,
}: APIKeysListProps) {
  const [copiedKeyId, setCopiedKeyId] = useState<string | null>(null)

  const copyToClipboard = (text: string, keyId: string) => {
    navigator.clipboard.writeText(text)
    setCopiedKeyId(keyId)
    setTimeout(() => setCopiedKeyId(null), 2000)
  }

  const getRateLimitBadgeColor = (tier: string) => {
    switch (tier) {
      case 'free':
        return '$gray10'
      case 'pro':
        return '$blue10'
      case 'enterprise':
        return '$purple10'
      default:
        return '$gray10'
    }
  }

  const getRateLimitDescription = (tier: string) => {
    switch (tier) {
      case 'free':
        return '100 req/min'
      case 'pro':
        return '1,000 req/min'
      case 'enterprise':
        return '10,000 req/min'
      default:
        return 'Unknown'
    }
  }

  if (isLoading) {
    return (
      <YStack f={1} jc="center" ai="center" padding="$6">
        <Spinner size="large" color="$blue10" />
        <Paragraph mt="$4" color="$gray11">Loading API keys...</Paragraph>
      </YStack>
    )
  }

  return (
    <YStack f={1} gap="$4">
      {/* Header */}
      <XStack jc="space-between" ai="center">
        <YStack gap="$2">
          <H2>API Keys</H2>
          <Paragraph color="$gray11">
            Manage API keys for third-party integrations and SDK access
          </Paragraph>
        </YStack>
        <Button
          icon={Plus}
          onPress={onCreateKey}
          theme="blue"
        >
          Create API Key
        </Button>
      </XStack>

      <Separator />

      {/* Keys List */}
      {keys.length === 0 ? (
        <Card padded bordered>
          <YStack ai="center" gap="$4" padding="$6">
            <Key size={48} color="$gray9" />
            <YStack ai="center" gap="$2">
              <H4>No API Keys</H4>
              <Paragraph color="$gray11" textAlign="center">
                Create your first API key to start using the Scaffald SDK
              </Paragraph>
            </YStack>
            <Button
              icon={Plus}
              onPress={onCreateKey}
              theme="blue"
            >
              Create Your First API Key
            </Button>
          </YStack>
        </Card>
      ) : (
        <YStack gap="$3">
          {keys.map((key) => (
            <Card key={key.id} padded bordered hoverStyle={{ borderColor: '$blue8' }}>
              <YStack gap="$4">
                {/* Key Header */}
                <XStack jc="space-between" ai="flex-start">
                  <YStack gap="$2" f={1}>
                    <XStack ai="center" gap="$2">
                      <H4>{key.name}</H4>
                      {!key.is_active && (
                        <Card
                          backgroundColor="$red3"
                          paddingHorizontal="$2"
                          paddingVertical="$1"
                          borderRadius="$2"
                        >
                          <Paragraph size="$2" color="$red11" fontWeight="600">
                            REVOKED
                          </Paragraph>
                        </Card>
                      )}
                    </XStack>

                    {/* Key Prefix */}
                    <XStack ai="center" gap="$2">
                      <Card
                        backgroundColor="$gray3"
                        paddingHorizontal="$3"
                        paddingVertical="$2"
                        borderRadius="$3"
                      >
                        <Paragraph fontFamily="$mono" size="$3">
                          {key.key_prefix}
                        </Paragraph>
                      </Card>
                      <Button
                        size="$2"
                        chromeless
                        icon={Copy}
                        onPress={() => copyToClipboard(key.key_prefix, key.id)}
                      >
                        {copiedKeyId === key.id ? 'Copied!' : ''}
                      </Button>
                    </XStack>
                  </YStack>

                  {/* Actions Menu */}
                  <Button
                    size="$3"
                    chromeless
                    circular
                    icon={MoreVertical}
                  />
                </XStack>

                {/* Key Metadata */}
                <XStack gap="$4" flexWrap="wrap">
                  {/* Rate Limit Tier */}
                  <YStack gap="$1">
                    <Paragraph size="$2" color="$gray11">
                      Rate Limit
                    </Paragraph>
                    <Card
                      backgroundColor={getRateLimitBadgeColor(key.rate_limit_tier)}
                      paddingHorizontal="$2"
                      paddingVertical="$1"
                      borderRadius="$2"
                    >
                      <Paragraph size="$2" color="$gray12" fontWeight="600">
                        {key.rate_limit_tier.toUpperCase()} - {getRateLimitDescription(key.rate_limit_tier)}
                      </Paragraph>
                    </Card>
                  </YStack>

                  {/* Scopes */}
                  <YStack gap="$1" f={1}>
                    <Paragraph size="$2" color="$gray11">
                      Scopes
                    </Paragraph>
                    <XStack gap="$2" flexWrap="wrap">
                      {key.scopes.map((scope) => (
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
                      ))}
                    </XStack>
                  </YStack>

                  {/* Last Used */}
                  <YStack gap="$1">
                    <Paragraph size="$2" color="$gray11">
                      Last Used
                    </Paragraph>
                    <Paragraph size="$3">
                      {key.last_used_at
                        ? format(new Date(key.last_used_at), 'MMM d, yyyy HH:mm')
                        : 'Never'}
                    </Paragraph>
                  </YStack>

                  {/* Created */}
                  <YStack gap="$1">
                    <Paragraph size="$2" color="$gray11">
                      Created
                    </Paragraph>
                    <Paragraph size="$3">
                      {format(new Date(key.created_at), 'MMM d, yyyy')}
                    </Paragraph>
                  </YStack>

                  {/* Expires */}
                  {key.expires_at && (
                    <YStack gap="$1">
                      <Paragraph size="$2" color="$gray11">
                        Expires
                      </Paragraph>
                      <Paragraph size="$3" color="$orange11">
                        {format(new Date(key.expires_at), 'MMM d, yyyy')}
                      </Paragraph>
                    </YStack>
                  )}
                </XStack>

                {/* Actions */}
                <XStack gap="$2">
                  <Button
                    size="$3"
                    variant="outlined"
                    onPress={() => onViewUsage(key.id)}
                  >
                    View Usage
                  </Button>
                  {key.is_active && (
                    <Button
                      size="$3"
                      variant="outlined"
                      theme="red"
                      icon={Trash2}
                      onPress={() => onRevokeKey(key.id)}
                    >
                      Revoke
                    </Button>
                  )}
                </XStack>
              </YStack>
            </Card>
          ))}
        </YStack>
      )}
    </YStack>
  )
}
