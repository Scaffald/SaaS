/**
 * API Keys List Component
 * Displays all API keys for an organization with management options
 */

import { useState } from 'react'
import {
  Button,
  Card,
  H2,
  H4,
  Paragraph,
  Separator,
  Spinner,
  Row,
  Stack,
} from '@scaffald/ui'
import { Copy, Key, MoreVertical, Plus, Trash2 } from 'lucide-react-native'
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
  onManageScopes?: (keyId: string) => void
}

export function APIKeysList({
  keys,
  isLoading = false,
  onCreateKey,
  onRevokeKey,
  onViewUsage,
  onManageScopes,
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
      <Stack f={1} jc="center" ai="center" padding="xl">
        <Spinner size="lg" color="$blue10" />
        <Paragraph mt={16} color="$gray11">
          Loading API keys...
        </Paragraph>
      </Stack>
    )
  }

  return (
    <Stack f={1} gap={16}>
      {/* Header */}
      <Row jc="space-between" ai="center">
        <Stack gap={8}>
          <H2>API Keys</H2>
          <Paragraph color="$gray11">
            Manage API keys for third-party integrations and SDK access
          </Paragraph>
        </Stack>
        <Button iconStart={Plus} onPress={onCreateKey} color="primary">
          Create API Key
        </Button>
      </Row>

      <Separator />

      {/* Keys List */}
      {keys.length === 0 ? (
        <Card padded bordered>
          <Stack ai="center" gap={16} padding="xl">
            <Key size={48} color="$gray9" />
            <Stack ai="center" gap={8}>
              <H4>No API Keys</H4>
              <Paragraph color="$gray11" textAlign="center">
                Create your first API key to start using the Scaffald SDK
              </Paragraph>
            </Stack>
            <Button iconStart={Plus} onPress={onCreateKey} color="primary">
              Create Your First API Key
            </Button>
          </Stack>
        </Card>
      ) : (
        <Stack gap={12}>
          {keys.map((key) => (
            <Card key={key.id} padded bordered hoverStyle={{ borderColor: '$blue8' }}>
              <Stack gap={16}>
                {/* Key Header */}
                <Row jc="space-between" ai="flex-start">
                  <Stack gap={8} f={1}>
                    <Row ai="center" gap={8}>
                      <H4>{key.name}</H4>
                      {!key.is_active && (
                        <Card
                          backgroundColor="$red3"
                          paddingHorizontal={8}
                          paddingVertical={4}
                          borderRadius={8}
                        >
                          <Paragraph size="sm" color="$red11">
                            REVOKED
                          </Paragraph>
                        </Card>
                      )}
                    </Row>

                    {/* Key Prefix */}
                    <Row ai="center" gap={8}>
                      <Card
                        backgroundColor="$gray3"
                        paddingHorizontal={12}
                        paddingVertical={8}
                        borderRadius={12}
                      >
                        <Paragraph fontFamily="$mono" size="sm">
                          {key.key_prefix}
                        </Paragraph>
                      </Card>
                      <Button
                        size="sm"
                        chromeless
                        iconStart={Copy}
                        onPress={() => copyToClipboard(key.key_prefix, key.id)}
                      >
                        {copiedKeyId === key.id ? 'Copied!' : ''}
                      </Button>
                    </Row>
                  </Stack>

                  {/* Actions Menu */}
                  <Button size="sm" chromeless iconStart={MoreVertical} />
                </Row>

                {/* Key Metadata */}
                <Row gap={16} flexWrap="wrap">
                  {/* Rate Limit Tier */}
                  <Stack gap={4}>
                    <Paragraph size="sm" color="$gray11">
                      Rate Limit
                    </Paragraph>
                    <Card
                      backgroundColor={getRateLimitBadgeColor(key.rate_limit_tier)}
                      paddingHorizontal={8}
                      paddingVertical={4}
                      borderRadius={8}
                    >
                      <Paragraph size="sm" color="$gray12">
                        {key.rate_limit_tier.toUpperCase()} -{' '}
                        {getRateLimitDescription(key.rate_limit_tier)}
                      </Paragraph>
                    </Card>
                  </Stack>

                  {/* Scopes */}
                  <Stack gap={4} f={1}>
                    <Paragraph size="sm" color="$gray11">
                      Scopes
                    </Paragraph>
                    <Row gap={8} flexWrap="wrap">
                      {key.scopes.map((scope) => (
                        <Card
                          key={scope}
                          backgroundColor="$blue3"
                          paddingHorizontal={8}
                          paddingVertical={4}
                          borderRadius={8}
                        >
                          <Paragraph size="sm" color="$blue11">
                            {scope}
                          </Paragraph>
                        </Card>
                      ))}
                    </Row>
                  </Stack>

                  {/* Last Used */}
                  <Stack gap={4}>
                    <Paragraph size="sm" color="$gray11">
                      Last Used
                    </Paragraph>
                    <Paragraph size="sm">
                      {key.last_used_at
                        ? format(new Date(key.last_used_at), 'MMM d, yyyy HH:mm')
                        : 'Never'}
                    </Paragraph>
                  </Stack>

                  {/* Created */}
                  <Stack gap={4}>
                    <Paragraph size="sm" color="$gray11">
                      Created
                    </Paragraph>
                    <Paragraph size="sm">
                      {format(new Date(key.created_at), 'MMM d, yyyy')}
                    </Paragraph>
                  </Stack>

                  {/* Expires */}
                  {key.expires_at && (
                    <Stack gap={4}>
                      <Paragraph size="sm" color="$gray11">
                        Expires
                      </Paragraph>
                      <Paragraph size="sm" color="$orange11">
                        {format(new Date(key.expires_at), 'MMM d, yyyy')}
                      </Paragraph>
                    </Stack>
                  )}
                </Row>

                {/* Actions */}
                <Row gap={8}>
                  <Button size="sm" variant="outline" onPress={() => onViewUsage(key.id)}>
                    View Usage
                  </Button>
                  {onManageScopes && key.is_active && (
                    <Button size="sm" variant="outline" onPress={() => onManageScopes(key.id)}>
                      Manage Scopes
                    </Button>
                  )}
                  {key.is_active && (
                    <Button
                      size="sm"
                      variant="outline"
                      color="error"
                      iconStart={Trash2}
                      onPress={() => onRevokeKey(key.id)}
                    >
                      Revoke
                    </Button>
                  )}
                </Row>
              </Stack>
            </Card>
          ))}
        </Stack>
      )}
    </Stack>
  )
}
