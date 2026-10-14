/**
 * API Keys List Component
 * Displays all API keys for an organization with management options
 */

import { useState, type ReactNode } from 'react'
import {
  ScreenHeader,
  Button,
  Card,
  H4,
  Paragraph,
  Separator,
  Spinner,
  Row,
  Stack,
  useResponsive,
  useThemeContext,
} from '@scaffald/ui'
import { colors } from '@scaffald/ui/tokens'
import { copyToClipboard as copyText } from '@scf/core/utils/clipboard'
import { Copy, Key, MoreVertical, Plus, Trash2 } from 'lucide-react-native'
import { format } from 'date-fns'

/** One metadata field: label over value on desktop, label beside value on a phone. */
function KeyMeta({
  label,
  stacked,
  grow,
  children,
}: {
  label: string
  stacked: boolean
  grow?: boolean
  children: ReactNode
}) {
  const { theme } = useThemeContext()
  const caption = (
    <Paragraph size="sm" color={colors.text[theme].tertiary}>
      {label}
    </Paragraph>
  )
  if (stacked) {
    return (
      <Row gap={12} justify="space-between" align="flex-start">
        {caption}
        <Stack flex={1} align="flex-end">
          {children}
        </Stack>
      </Row>
    )
  }
  return (
    <Stack gap={4} style={grow ? { flex: 1, minWidth: 160 } : undefined}>
      {caption}
      {children}
    </Stack>
  )
}

export interface APIKey {
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

export interface APIKeysListProps {
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
  const { theme } = useThemeContext()
  const { isMobile } = useResponsive()
  const [copiedKeyId, setCopiedKeyId] = useState<string | null>(null)

  const copyToClipboard = (text: string, keyId: string) => {
    void copyText(text)
    setCopiedKeyId(keyId)
    setTimeout(() => setCopiedKeyId(null), 2000)
  }

  const getRateLimitBadgeColor = (tier: string) => {
    switch (tier) {
      case 'free':
        return colors.gray[500]
      case 'pro':
        return colors.blue[500]
      case 'enterprise':
        return colors.purple[500]
      default:
        return colors.gray[500]
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
      <Stack flex={1} justify="center" align="center" padding="xl">
        <Spinner variant="ios" size="lg" color="primary" />
        <Paragraph style={{ marginTop: 16 }} color={colors.text[theme].tertiary}>
          Loading API keys...
        </Paragraph>
      </Stack>
    )
  }

  return (
    <Stack flex={1} gap={16}>
      {/* At 390 the hand-rolled row pushed Create API Key off-screen (#1022). */}
      <ScreenHeader
        kicker="Integrations"
        title="API keys"
        tip="Keys for third-party integrations and SDK access."
        actions={
          <Button iconStart={Plus} onPress={onCreateKey} color="primary">
            Create API Key
          </Button>
        }
      />

      <Separator />

      {/* Keys List */}
      {keys.length === 0 ? (
        <Card padding="lg" variant="outlined">
          <Stack align="center" gap={16} padding="xl">
            <Key size={48} color={colors.icon[theme].muted} />
            <Stack align="center" gap={8}>
              <H4>No API Keys</H4>
              <Paragraph color={colors.text[theme].tertiary} align="center">
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
            <Card key={key.id} padding="lg" variant="outlined">
              <Stack gap={16}>
                {/* Key Header */}
                <Row justify="space-between" align="flex-start">
                  <Stack gap={8} flex={1}>
                    <Row align="center" gap={8}>
                      <H4>{key.name}</H4>
                      {!key.is_active && (
                        <Card
                          style={{
                            backgroundColor: colors.error[100],
                            paddingHorizontal: 8,
                            paddingVertical: 4,
                            borderRadius: 7,
                          }}
                        >
                          <Paragraph size="sm" color={colors.fg[theme].error}>
                            REVOKED
                          </Paragraph>
                        </Card>
                      )}
                    </Row>

                    {/* Key Prefix */}
                    <Row align="center" gap={8}>
                      <Card
                        style={{
                          backgroundColor: colors.bg[theme].muted,
                          paddingHorizontal: 12,
                          paddingVertical: 8,
                          borderRadius: 7,
                        }}
                      >
                        <Paragraph size="sm" style={{ fontFamily: 'monospace' }}>
                          {key.key_prefix}
                        </Paragraph>
                      </Card>
                      <Button
                        size="sm"
                        variant="text"
                        iconStart={Copy}
                        onPress={() => copyToClipboard(key.key_prefix, key.id)}
                      >
                        {copiedKeyId === key.id ? 'Copied!' : ''}
                      </Button>
                    </Row>
                  </Stack>

                  {/* Actions Menu */}
                  <Button size="sm" variant="text" iconStart={MoreVertical} />
                </Row>

                {/* Key Metadata. On a phone the five fields shared one
                    wrapping row and "Scopes" was squeezed to "Scop / es"
                    (#1126); there they stack as label/value lines. */}
                <Stack
                  gap={isMobile ? 10 : 16}
                  style={isMobile ? undefined : { flexDirection: 'row', flexWrap: 'wrap' }}
                >
                  <KeyMeta label="Rate Limit" stacked={isMobile}>
                    <Card
                      style={{
                        backgroundColor: getRateLimitBadgeColor(key.rate_limit_tier),
                        paddingHorizontal: 8,
                        paddingVertical: 4,
                        borderRadius: 7,
                      }}
                    >
                      <Paragraph size="sm" color={colors.text[theme].primary}>
                        {key.rate_limit_tier.toUpperCase()} -{' '}
                        {getRateLimitDescription(key.rate_limit_tier)}
                      </Paragraph>
                    </Card>
                  </KeyMeta>

                  <KeyMeta label="Scopes" stacked={isMobile} grow>
                    <Row gap={8} wrap style={isMobile ? { justifyContent: 'flex-end' } : undefined}>
                      {key.scopes.map((scope) => (
                        <Card
                          key={scope}
                          style={{
                            backgroundColor: colors.blue[200],
                            paddingHorizontal: 8,
                            paddingVertical: 4,
                            borderRadius: 7,
                          }}
                        >
                          <Paragraph size="sm" color={colors.blue[700]}>
                            {scope}
                          </Paragraph>
                        </Card>
                      ))}
                    </Row>
                  </KeyMeta>

                  <KeyMeta label="Last Used" stacked={isMobile}>
                    <Paragraph size="sm">
                      {key.last_used_at
                        ? format(new Date(key.last_used_at), 'MMM d, yyyy HH:mm')
                        : 'Never'}
                    </Paragraph>
                  </KeyMeta>

                  <KeyMeta label="Created" stacked={isMobile}>
                    <Paragraph size="sm">
                      {format(new Date(key.created_at), 'MMM d, yyyy')}
                    </Paragraph>
                  </KeyMeta>

                  {key.expires_at && (
                    <KeyMeta label="Expires" stacked={isMobile}>
                      <Paragraph size="sm" color={colors.fg[theme].warning}>
                        {format(new Date(key.expires_at), 'MMM d, yyyy')}
                      </Paragraph>
                    </KeyMeta>
                  )}
                </Stack>

                {/* Actions — wrap, so Revoke never runs into the card edge */}
                <Row gap={8} wrap>
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
