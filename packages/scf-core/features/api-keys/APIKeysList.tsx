/**
 * API Keys List Component
 * Displays all API keys for an organization with management options
 *
 * A ruled table since #1207, the prototype's admin records form. Each key
 * was a ~300px card — serif name, a dark-brown tier chip, a light-blue scope
 * chip, View Usage / Manage Scopes / Revoke buttons and a ⋮ that did nothing
 * — so three keys filled a 1440 screen, revoked keys sat between live ones
 * at the same weight, and the fixed blue / error[100] / tier ramps stayed
 * light boxes in dark mode. Now: Name, Key, Tier, Scopes, Last used,
 * Created, Status, with the actions in one ⋯ menu; revoked keys behind the
 * toolbar's Revoked tab; chips are themed StatusBadges. Below the Table's
 * stacking width (and always on native) each key becomes a stacked
 * label/value card, which keeps #1126's phone layout.
 */

import { useMemo, useState } from 'react'
import { Pressable, StyleSheet, View } from 'react-native'
import {
  Button,
  EmptyState,
  ListToolbar,
  Popover,
  PopoverContent,
  Row,
  ScreenHeader,
  Spinner,
  Stack,
  Table,
  Text,
  useThemeContext,
  type TableColumn,
  type TableRowData,
} from '@scaffald/ui'
import { colors, fontSize, radius, spacing } from '@scaffald/ui/tokens'
import { Check, Copy, Key, MoreHorizontal, Plus } from 'lucide-react-native'
import { format } from 'date-fns'
import { copyToClipboard as copyText } from '@scf/core/utils/clipboard'
import { StatusBadge } from '@scf/core/components/ui/StatusBadge'
import {
  type ApiKeyStatus,
  type ApiKeyTab,
  apiKeyStatus,
  apiKeyTierLabel,
  maskApiKey,
  matchesApiKeySearch,
  partitionApiKeys,
  visibleScopes,
} from './api-key-rows'

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

const STATUS_TAG: Record<
  ApiKeyStatus,
  { label: string; variant: 'success' | 'warning' | 'error' }
> = {
  active: { label: 'Active', variant: 'success' },
  expired: { label: 'Expired', variant: 'warning' },
  revoked: { label: 'Revoked', variant: 'error' },
}

const formatDate = (value: string | null, pattern = 'MMM d, yyyy') => {
  if (!value) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : format(date, pattern)
}

interface KeyAction {
  label: string
  onPress: () => void
  destructive?: boolean
}

/**
 * The row's ⋯ menu. Built on Popover, like the pipeline's Move menu, because
 * @scaffald/ui's Dropdown has no key handling (see MoveMenu.tsx); every item
 * is a real Pressable with a menuitem role so it is in the tab order.
 */
function KeyActionsMenu({ keyName, actions }: { keyName: string; actions: KeyAction[] }) {
  const { theme } = useThemeContext()
  const [open, setOpen] = useState(false)

  return (
    <Popover
      placement="bottom"
      trigger="manual"
      open={open}
      onOpenChange={setOpen}
      offset={4}
      content={
        <PopoverContent>
          <View accessibilityRole="menu" style={styles.menu}>
            {actions.map((action) => (
              <Pressable
                key={action.label}
                onPress={() => {
                  setOpen(false)
                  action.onPress()
                }}
                accessibilityRole="menuitem"
                accessibilityLabel={`${action.label}: ${keyName}`}
                style={styles.menuItem}
              >
                <Text
                  style={{
                    fontSize: fontSize.md,
                    color: action.destructive ? colors.fg[theme].error : colors.text[theme].primary,
                  }}
                >
                  {action.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </PopoverContent>
      }
    >
      <Pressable
        onPress={() => setOpen((v) => !v)}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        accessibilityLabel={`Actions for ${keyName}`}
        aria-haspopup="menu"
        style={[
          styles.menuTrigger,
          {
            borderColor: open ? colors.border[theme].active : 'transparent',
          },
        ]}
      >
        <MoreHorizontal size={18} color={colors.icon[theme].muted} />
      </Pressable>
    </Popover>
  )
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
  const [copiedKeyId, setCopiedKeyId] = useState<string | null>(null)
  const [tab, setTab] = useState<ApiKeyTab>('active')
  const [search, setSearch] = useState('')

  const copyToClipboard = (text: string, keyId: string) => {
    void copyText(text)
    setCopiedKeyId(keyId)
    setTimeout(() => setCopiedKeyId(null), 2000)
  }

  const partitions = useMemo(() => partitionApiKeys(keys), [keys])
  const rows = useMemo(
    () => partitions[tab].filter((key) => matchesApiKeySearch(key, search)),
    [partitions, tab, search]
  )

  const muted = colors.text[theme].tertiary

  const columns: TableColumn[] = [
    {
      id: 'name',
      title: 'Name',
      render: (_value, row) => (
        <Text style={{ color: colors.text[theme].primary, fontWeight: '600' }}>
          {(row as unknown as APIKey).name}
        </Text>
      ),
    },
    {
      id: 'key_prefix',
      title: 'Key',
      width: 210,
      render: (_value, row) => {
        const key = row as unknown as APIKey
        const copied = copiedKeyId === key.id
        return (
          <Row gap={4} align="center">
            <Text
              style={{ color: colors.text[theme].secondary, fontFamily: 'monospace' }}
              numberOfLines={1}
            >
              {maskApiKey(key.key_prefix)}
            </Text>
            <Pressable
              onPress={() => copyToClipboard(key.key_prefix, key.id)}
              accessibilityRole="button"
              accessibilityLabel={copied ? 'Key prefix copied' : `Copy key prefix for ${key.name}`}
              style={styles.iconButton}
            >
              {copied ? (
                <Check size={14} color={colors.icon[theme].success} />
              ) : (
                <Copy size={14} color={colors.icon[theme].muted} />
              )}
            </Pressable>
          </Row>
        )
      },
    },
    {
      id: 'rate_limit_tier',
      title: 'Tier',
      width: 140,
      render: (_value, row) => (
        <StatusBadge>{apiKeyTierLabel((row as unknown as APIKey).rate_limit_tier)}</StatusBadge>
      ),
    },
    {
      id: 'scopes',
      title: 'Scopes',
      render: (_value, row) => {
        const { shown, hidden } = visibleScopes((row as unknown as APIKey).scopes)
        if (shown.length === 0) return <Text style={{ color: muted }}>None</Text>
        return (
          <Row gap={4} wrap align="center">
            {shown.map((scope) => (
              <StatusBadge key={scope}>{scope}</StatusBadge>
            ))}
            {hidden > 0 ? <Text style={{ color: muted, fontSize: fontSize.xs }}>+{hidden}</Text> : null}
          </Row>
        )
      },
    },
    {
      id: 'last_used_at',
      title: 'Last used',
      width: 120,
      render: (_value, row) => formatDate((row as unknown as APIKey).last_used_at) ?? 'Never',
    },
    {
      id: 'created_at',
      title: 'Created',
      width: 120,
      render: (_value, row) => formatDate((row as unknown as APIKey).created_at) ?? '—',
    },
    {
      id: 'status',
      title: 'Status',
      width: 120,
      render: (_value, row) => {
        const key = row as unknown as APIKey
        const tag = STATUS_TAG[apiKeyStatus(key)]
        const expires = key.is_active ? formatDate(key.expires_at) : null
        return (
          <Stack gap={2}>
            <StatusBadge variant={tag.variant}>{tag.label}</StatusBadge>
            {expires && tag.label === 'Active' ? (
              <Text style={{ color: muted, fontSize: fontSize.xs }}>Expires {expires}</Text>
            ) : null}
          </Stack>
        )
      },
    },
    {
      // Titled so the stacked phone card keeps it: the Table drops untitled
      // columns when it stacks, which would leave a phone with no actions.
      id: 'actions',
      title: 'Actions',
      width: 80,
      align: 'right',
      render: (_value, row) => {
        const key = row as unknown as APIKey
        const actions: KeyAction[] = [{ label: 'View usage', onPress: () => onViewUsage(key.id) }]
        if (key.is_active && onManageScopes) {
          actions.push({ label: 'Manage scopes', onPress: () => onManageScopes(key.id) })
        }
        if (key.is_active) {
          actions.push({ label: 'Revoke', onPress: () => onRevokeKey(key.id), destructive: true })
        }
        return <KeyActionsMenu keyName={key.name} actions={actions} />
      },
    },
  ]

  if (isLoading) {
    return (
      <Stack flex={1} justify="center" align="center" padding="xl" gap={16}>
        <Spinner variant="ios" size="lg" color="primary" />
        <Text style={{ color: muted }}>Loading API keys…</Text>
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

      {keys.length === 0 ? (
        <EmptyState
          icon={Key}
          title="No API keys"
          description="Create your first API key to start using the Scaffald SDK."
        />
      ) : (
        <>
          <ListToolbar
            tabs={[
              { key: 'active', label: 'Active', count: partitions.active.length },
              { key: 'revoked', label: 'Revoked', count: partitions.revoked.length },
            ]}
            activeTab={tab}
            onTabChange={(key) => setTab(key as ApiKeyTab)}
            searchValue={search}
            onSearchChange={setSearch}
            searchPlaceholder="Search by name or key prefix…"
            resultCount={rows.length}
            resultNoun="key"
          />
          <Table
            columns={columns}
            data={rows as unknown as TableRowData[]}
            getRowId={(row) => String((row as unknown as APIKey).id)}
            pageSize={50}
            emptyMessage={
              search.trim()
                ? 'No keys match that search.'
                : tab === 'revoked'
                  ? 'No revoked keys.'
                  : 'No active keys. Revoked keys are on the Revoked tab.'
            }
          />
        </>
      )}
    </Stack>
  )
}

const styles = StyleSheet.create({
  menu: {
    minWidth: 160,
  },
  menuItem: {
    paddingVertical: spacing[8],
    paddingHorizontal: spacing[12],
  },
  menuTrigger: {
    padding: spacing[4],
    borderWidth: 1,
    borderRadius: radius.md,
    alignSelf: 'flex-end',
  },
  iconButton: {
    padding: spacing[4],
  },
})
