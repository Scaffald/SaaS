/**
 * HRIS/Payroll Integrations Screen
 *
 * Manage connections to HRIS platforms (ADP, Paychex, Gusto, BambooHR, Rippling)
 * and configure automated sync for hired candidates.
 *
 * @see Issue #96 - Payroll/HRIS Integration
 */

import { useState } from 'react'
import {
  Button,
  Card,
  DashboardWidget,
  DashboardWidgetHeader,
  Input,
  Modal,
  ModalHeader,
  ModalContent,
  ModalActions,
  Separator,
  Text,
  Row,
  Stack,
  Tabs,
  useThemeContext,
} from '@scaffald/ui'
import { colors } from '@scaffald/ui/tokens'
import { StatusBadge } from '@scf/core/components/ui'
import {
  Database,
  Link2,
  RefreshCw,
  Settings,
} from 'lucide-react-native'
import { ScrollView } from 'react-native'

// ============================================================================
// Types
// ============================================================================

interface HRISProvider {
  id: string
  provider: 'adp' | 'paychex' | 'gusto' | 'bamboohr' | 'rippling'
  display_name: string
  description: string
  is_connected: boolean
  is_active: boolean
  last_sync_at: string | null
  records_synced: number
  sync_frequency: string
}

interface SyncLog {
  id: string
  provider: string
  sync_type: string
  status: 'completed' | 'failed' | 'partial' | 'running'
  records_synced: number
  records_failed: number
  started_at: string
  completed_at: string | null
}

interface FieldMapping {
  scaffald_field: string
  hris_field: string
  direction: 'push' | 'pull' | 'bidirectional'
}

// ============================================================================
// Mock Data
// ============================================================================

const HRIS_PROVIDERS: HRISProvider[] = [
  { id: '1', provider: 'adp', display_name: 'ADP Workforce Now', description: 'Full-service HR and payroll for mid to large organizations', is_connected: true, is_active: true, last_sync_at: '2026-03-10T08:00:00Z', records_synced: 47, sync_frequency: 'daily' },
  { id: '2', provider: 'gusto', display_name: 'Gusto', description: 'Modern payroll, benefits, and HR for small businesses', is_connected: false, is_active: false, last_sync_at: null, records_synced: 0, sync_frequency: 'daily' },
  { id: '3', provider: 'paychex', display_name: 'Paychex Flex', description: 'Payroll and HR solutions for businesses of all sizes', is_connected: false, is_active: false, last_sync_at: null, records_synced: 0, sync_frequency: 'daily' },
  { id: '4', provider: 'bamboohr', display_name: 'BambooHR', description: 'HR software for small and medium businesses', is_connected: false, is_active: false, last_sync_at: null, records_synced: 0, sync_frequency: 'daily' },
  { id: '5', provider: 'rippling', display_name: 'Rippling', description: 'Unified workforce management platform', is_connected: false, is_active: false, last_sync_at: null, records_synced: 0, sync_frequency: 'daily' },
]

const MOCK_SYNC_LOGS: SyncLog[] = [
  { id: '1', provider: 'ADP', sync_type: 'incremental', status: 'completed', records_synced: 3, records_failed: 0, started_at: '2026-03-10T08:00:00Z', completed_at: '2026-03-10T08:00:12Z' },
  { id: '2', provider: 'ADP', sync_type: 'incremental', status: 'completed', records_synced: 1, records_failed: 0, started_at: '2026-03-09T08:00:00Z', completed_at: '2026-03-09T08:00:08Z' },
  { id: '3', provider: 'ADP', sync_type: 'full', status: 'completed', records_synced: 47, records_failed: 2, started_at: '2026-03-08T02:00:00Z', completed_at: '2026-03-08T02:01:23Z' },
  { id: '4', provider: 'ADP', sync_type: 'incremental', status: 'failed', records_synced: 0, records_failed: 1, started_at: '2026-03-07T08:00:00Z', completed_at: '2026-03-07T08:00:05Z' },
]

const DEFAULT_FIELD_MAPPINGS: FieldMapping[] = [
  { scaffald_field: 'Full Name', hris_field: 'employee_name', direction: 'push' },
  { scaffald_field: 'Email', hris_field: 'work_email', direction: 'push' },
  { scaffald_field: 'Phone', hris_field: 'phone_number', direction: 'push' },
  { scaffald_field: 'Start Date', hris_field: 'hire_date', direction: 'push' },
  { scaffald_field: 'Job Title', hris_field: 'job_title', direction: 'push' },
  { scaffald_field: 'Department', hris_field: 'department', direction: 'bidirectional' },
  { scaffald_field: 'Pay Rate', hris_field: 'compensation', direction: 'push' },
  { scaffald_field: 'Status', hris_field: 'employment_status', direction: 'pull' },
]

// ============================================================================
// Sub-Components
// ============================================================================

function SyncStatusBadge({ status }: { status: SyncLog['status'] }) {
  const variantMap: Record<string, 'default' | 'success' | 'warning' | 'error'> = {
    completed: 'success',
    failed: 'error',
    partial: 'warning',
    running: 'default',
  }
  return <StatusBadge variant={variantMap[status] ?? 'default'}>{status}</StatusBadge>
}

function ProviderCard({ provider, onConnect }: { provider: HRISProvider; onConnect: () => void }) {
  const { theme } = useThemeContext()

  return (
    <Row
      gap={12}
      align="center"
      padding="md"
      style={{
        backgroundColor: colors.bg[theme].subtle,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: provider.is_connected ? colors.border[theme].active : colors.border[theme].default,
      }}
    >
      <Stack style={{ width: 40, height: 40, borderRadius: 8, backgroundColor: colors.bg[theme].default, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border[theme].default }}>
        <Database size={20} color={colors.icon[theme].default} />
      </Stack>
      <Stack style={{ flex: 1 }} gap={2}>
        <Row gap={8} align="center">
          <Text style={{ color: colors.text[theme].primary, fontWeight: '600' }}>{provider.display_name}</Text>
          {provider.is_connected && <StatusBadge variant="success">Connected</StatusBadge>}
        </Row>
        <Text style={{ color: colors.text[theme].tertiary, fontSize: 12 }}>{provider.description}</Text>
        {provider.is_connected && provider.last_sync_at && (
          <Text style={{ color: colors.text[theme].tertiary, fontSize: 11 }}>
            Last sync: {new Date(provider.last_sync_at).toLocaleString()} · {provider.records_synced} records
          </Text>
        )}
      </Stack>
      {provider.is_connected ? (
        <Row gap={8}>
          <Button size="sm" variant="outline" iconStart={RefreshCw} onPress={() => {}}>Sync</Button>
          <Button size="sm" variant="outline" iconStart={Settings} onPress={() => {}}>Configure</Button>
        </Row>
      ) : (
        <Button size="sm" variant="filled" iconStart={Link2} onPress={onConnect}>Connect</Button>
      )}
    </Row>
  )
}

function SyncLogRow({ log }: { log: SyncLog }) {
  const { theme } = useThemeContext()
  const startDate = new Date(log.started_at)

  return (
    <Row gap={12} align="center" padding="sm" style={{ backgroundColor: colors.bg[theme].subtle, borderRadius: 8 }}>
      <Stack style={{ width: 80 }}>
        <Text style={{ color: colors.text[theme].primary, fontSize: 13 }}>
          {startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
        </Text>
        <Text style={{ color: colors.text[theme].tertiary, fontSize: 11 }}>
          {startDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
        </Text>
      </Stack>
      <Stack style={{ flex: 1 }} gap={2}>
        <Row gap={8} align="center">
          <Text style={{ color: colors.text[theme].primary, fontSize: 13 }}>{log.provider}</Text>
          <StatusBadge variant="default">{log.sync_type}</StatusBadge>
        </Row>
        <Text style={{ color: colors.text[theme].tertiary, fontSize: 11 }}>
          {log.records_synced} synced{log.records_failed > 0 ? `, ${log.records_failed} failed` : ''}
        </Text>
      </Stack>
      <SyncStatusBadge status={log.status} />
    </Row>
  )
}

function DirectionBadge({ direction }: { direction: FieldMapping['direction'] }) {
  const labelMap = { push: 'Push →', pull: '← Pull', bidirectional: '↔ Sync' }
  return <StatusBadge variant="default">{labelMap[direction]}</StatusBadge>
}

// ============================================================================
// Main Component
// ============================================================================

export function HRISIntegrationsScreen() {
  const { theme } = useThemeContext()
  const [activeTab, setActiveTab] = useState('providers')
  const [showConnectModal, setShowConnectModal] = useState(false)
  const [selectedProvider, setSelectedProvider] = useState<HRISProvider | null>(null)

  const connectedCount = HRIS_PROVIDERS.filter((p) => p.is_connected).length

  return (
    <ScrollView showsVerticalScrollIndicator={false}>
      <Stack gap={16}>
        {/* Header */}
        <Row justify="space-between" align="center">
          <Stack gap={2}>
            <Text style={{ color: colors.text[theme].primary, fontSize: 20, fontWeight: '700' }}>
              HRIS & Payroll
            </Text>
            <Text style={{ color: colors.text[theme].tertiary, fontSize: 14 }}>
              Connect HRIS platforms and sync hired candidates automatically
            </Text>
          </Stack>
          <Row gap={8} align="center">
            <StatusBadge variant={connectedCount > 0 ? 'success' : 'default'}>
              {connectedCount} connected
            </StatusBadge>
          </Row>
        </Row>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} type="line">
          <Tabs.Item value="providers">
            <Tabs.Trigger>Providers</Tabs.Trigger>
            <Tabs.Content>
              <Stack gap={16} style={{ paddingTop: 16 }}>
                <DashboardWidget>
                  <DashboardWidgetHeader title="HRIS Providers" />
                  <Stack gap={8}>
                    {HRIS_PROVIDERS.map((provider) => (
                      <ProviderCard
                        key={provider.id}
                        provider={provider}
                        onConnect={() => {
                          setSelectedProvider(provider)
                          setShowConnectModal(true)
                        }}
                      />
                    ))}
                  </Stack>
                </DashboardWidget>
              </Stack>
            </Tabs.Content>
          </Tabs.Item>

          <Tabs.Item value="sync">
            <Tabs.Trigger>Sync History</Tabs.Trigger>
            <Tabs.Content>
              <Stack gap={16} style={{ paddingTop: 16 }}>
                {/* Summary Cards */}
                <Row gap={12}>
                  <Card style={{ flex: 1 }} padding="md">
                    <Stack align="center" gap={4}>
                      <Text style={{ color: colors.text[theme].primary, fontSize: 24, fontWeight: '700' }}>47</Text>
                      <Text style={{ color: colors.text[theme].tertiary, fontSize: 12 }}>Total Synced</Text>
                    </Stack>
                  </Card>
                  <Card style={{ flex: 1 }} padding="md">
                    <Stack align="center" gap={4}>
                      <Text style={{ color: colors.fg[theme].success, fontSize: 24, fontWeight: '700' }}>98%</Text>
                      <Text style={{ color: colors.text[theme].tertiary, fontSize: 12 }}>Success Rate</Text>
                    </Stack>
                  </Card>
                  <Card style={{ flex: 1 }} padding="md">
                    <Stack align="center" gap={4}>
                      <Text style={{ color: colors.text[theme].primary, fontSize: 24, fontWeight: '700' }}>Daily</Text>
                      <Text style={{ color: colors.text[theme].tertiary, fontSize: 12 }}>Sync Frequency</Text>
                    </Stack>
                  </Card>
                </Row>

                <DashboardWidget>
                  <DashboardWidgetHeader
                    title="Recent Syncs"
                    action={
                      <Button size="sm" variant="outline" iconStart={RefreshCw} onPress={() => {}}>
                        Sync Now
                      </Button>
                    }
                  />
                  <Stack gap={6}>
                    {MOCK_SYNC_LOGS.map((log) => (
                      <SyncLogRow key={log.id} log={log} />
                    ))}
                  </Stack>
                </DashboardWidget>
              </Stack>
            </Tabs.Content>
          </Tabs.Item>

          <Tabs.Item value="mappings">
            <Tabs.Trigger>Field Mappings</Tabs.Trigger>
            <Tabs.Content>
              <Stack gap={16} style={{ paddingTop: 16 }}>
                <DashboardWidget>
                  <DashboardWidgetHeader title="Data Field Mappings" />
                  <Text style={{ color: colors.text[theme].tertiary, fontSize: 13, marginBottom: 8 }}>
                    Configure how Scaffald fields map to your HRIS system
                  </Text>
                  <Stack gap={4}>
                    {/* Header */}
                    <Row gap={12} padding="sm">
                      <Text style={{ flex: 1, color: colors.text[theme].tertiary, fontSize: 12, fontWeight: '600' }}>Scaffald Field</Text>
                      <Text style={{ width: 80, textAlign: 'center', color: colors.text[theme].tertiary, fontSize: 12, fontWeight: '600' }}>Direction</Text>
                      <Text style={{ flex: 1, color: colors.text[theme].tertiary, fontSize: 12, fontWeight: '600' }}>HRIS Field</Text>
                    </Row>
                    <Separator />
                    {DEFAULT_FIELD_MAPPINGS.map((mapping, idx) => (
                      <Row key={idx} gap={12} align="center" padding="sm" style={{ backgroundColor: idx % 2 === 0 ? colors.bg[theme].subtle : 'transparent', borderRadius: 6 }}>
                        <Text style={{ flex: 1, color: colors.text[theme].primary, fontSize: 13 }}>{mapping.scaffald_field}</Text>
                        <Stack style={{ width: 80, alignItems: 'center' }}>
                          <DirectionBadge direction={mapping.direction} />
                        </Stack>
                        <Text style={{ flex: 1, color: colors.text[theme].secondary, fontSize: 13, fontFamily: 'monospace' }}>{mapping.hris_field}</Text>
                      </Row>
                    ))}
                  </Stack>
                </DashboardWidget>
              </Stack>
            </Tabs.Content>
          </Tabs.Item>
        </Tabs>

        {/* Connect Provider Modal */}
        <Modal visible={showConnectModal} onClose={() => setShowConnectModal(false)} width={480}>
          <ModalHeader title={`Connect ${selectedProvider?.display_name ?? 'Provider'}`} />
          <ModalContent>
            <Stack gap={16}>
              <Text style={{ color: colors.text[theme].secondary, fontSize: 14 }}>
                Enter your API credentials to connect {selectedProvider?.display_name}. These will be encrypted and stored securely.
              </Text>
              <Stack gap={4}>
                <Text style={{ color: colors.text[theme].primary, fontSize: 14, fontWeight: '500' }}>API Key</Text>
                <Input placeholder="Enter API key" secureTextEntry onChangeText={() => {}} />
              </Stack>
              <Stack gap={4}>
                <Text style={{ color: colors.text[theme].primary, fontSize: 14, fontWeight: '500' }}>Client ID</Text>
                <Input placeholder="Enter client ID" onChangeText={() => {}} />
              </Stack>
              <Stack gap={4}>
                <Text style={{ color: colors.text[theme].primary, fontSize: 14, fontWeight: '500' }}>Client Secret</Text>
                <Input placeholder="Enter client secret" secureTextEntry onChangeText={() => {}} />
              </Stack>
              <Stack gap={4}>
                <Text style={{ color: colors.text[theme].primary, fontSize: 14, fontWeight: '500' }}>Sync Frequency</Text>
                <Row gap={8}>
                  <Button size="sm" variant="outline" onPress={() => {}}>Realtime</Button>
                  <Button size="sm" variant="filled" onPress={() => {}}>Daily</Button>
                  <Button size="sm" variant="outline" onPress={() => {}}>Weekly</Button>
                  <Button size="sm" variant="outline" onPress={() => {}}>Manual</Button>
                </Row>
              </Stack>
            </Stack>
          </ModalContent>
          <ModalActions
            primaryAction={{ label: 'Connect', onPress: () => setShowConnectModal(false) }}
            secondaryAction={{ label: 'Cancel', onPress: () => setShowConnectModal(false) }}
          />
        </Modal>
      </Stack>
    </ScrollView>
  )
}
