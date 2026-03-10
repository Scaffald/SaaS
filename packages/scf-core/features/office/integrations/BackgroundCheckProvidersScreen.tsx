/**
 * Background Check Provider Management Screen
 *
 * Configure and manage background check provider integrations
 * (Checkr, Sterling, Accurate, HireRight) with webhook management.
 *
 * @see Issue #97 - Background Check API Integration
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
  Toggle,
  Row,
  Stack,
  Tabs,
  useThemeContext,
} from '@scaffald/ui'
import { colors } from '@scaffald/ui/tokens'
import { StatusBadge } from '@scf/core/components/ui'
import {
  Check,
  Clock,
  Copy,
  Link2,
  Settings,
  ShieldCheck,
  Webhook,
} from 'lucide-react-native'
import { ScrollView } from 'react-native'

// ============================================================================
// Types
// ============================================================================

interface BGCheckProvider {
  id: string
  provider: 'checkr' | 'sterling' | 'accurate' | 'hireright'
  display_name: string
  description: string
  is_connected: boolean
  is_active: boolean
  is_default: boolean
  supported_packages: string[]
  default_package: string | null
  webhook_url: string | null
}

interface WebhookEvent {
  id: string
  event_type: string
  processed: boolean
  received_at: string
  check_status?: string
}

interface CheckPackage {
  id: string
  name: string
  description: string
  checks_included: string[]
  avg_turnaround: string
  price_range: string
}

// ============================================================================
// Mock Data
// ============================================================================

const PROVIDERS: BGCheckProvider[] = [
  {
    id: '1', provider: 'checkr', display_name: 'Checkr', description: 'Fast, compliant background checks with modern API',
    is_connected: true, is_active: true, is_default: true,
    supported_packages: ['basic', 'standard', 'professional', 'comprehensive'],
    default_package: 'standard',
    webhook_url: 'https://api.scaffald.com/webhooks/checkr/abc123',
  },
  {
    id: '2', provider: 'sterling', display_name: 'Sterling', description: 'Enterprise background screening and identity verification',
    is_connected: false, is_active: false, is_default: false,
    supported_packages: ['essential', 'professional', 'executive'],
    default_package: null,
    webhook_url: null,
  },
  {
    id: '3', provider: 'accurate', display_name: 'Accurate Background', description: 'Comprehensive screening for all business sizes',
    is_connected: false, is_active: false, is_default: false,
    supported_packages: ['basic', 'enhanced', 'premium'],
    default_package: null,
    webhook_url: null,
  },
  {
    id: '4', provider: 'hireright', display_name: 'HireRight', description: 'Global background screening and workforce solutions',
    is_connected: false, is_active: false, is_default: false,
    supported_packages: ['standard', 'enhanced', 'global'],
    default_package: null,
    webhook_url: null,
  },
]

const MOCK_EVENTS: WebhookEvent[] = [
  { id: '1', event_type: 'report.completed', processed: true, received_at: '2026-03-10T14:30:00Z', check_status: 'clear' },
  { id: '2', event_type: 'report.created', processed: true, received_at: '2026-03-10T10:15:00Z' },
  { id: '3', event_type: 'report.updated', processed: true, received_at: '2026-03-09T16:45:00Z', check_status: 'pending' },
  { id: '4', event_type: 'report.completed', processed: true, received_at: '2026-03-09T11:20:00Z', check_status: 'consider' },
  { id: '5', event_type: 'report.suspended', processed: false, received_at: '2026-03-08T09:00:00Z' },
]

const CHECK_PACKAGES: CheckPackage[] = [
  { id: '1', name: 'Basic', description: 'Identity verification and SSN trace', checks_included: ['SSN Trace', 'National Criminal Search', 'Sex Offender Registry'], avg_turnaround: '1-2 days', price_range: '$25-35' },
  { id: '2', name: 'Standard', description: 'Recommended for most positions', checks_included: ['SSN Trace', 'National Criminal Search', 'County Criminal Search', 'Sex Offender Registry', 'Drug Screening'], avg_turnaround: '2-5 days', price_range: '$50-75' },
  { id: '3', name: 'Professional', description: 'For senior and licensed roles', checks_included: ['SSN Trace', 'National Criminal Search', 'County Criminal Search', 'Federal Criminal Search', 'Employment Verification', 'Education Verification', 'Professional License'], avg_turnaround: '5-7 days', price_range: '$100-150' },
  { id: '4', name: 'Comprehensive', description: 'Full background screening', checks_included: ['SSN Trace', 'National Criminal Search', 'County Criminal Search', 'Federal Criminal Search', 'Employment Verification', 'Education Verification', 'Professional License', 'Credit Check', 'Drug Screening', 'MVR'], avg_turnaround: '7-10 days', price_range: '$150-250' },
]

// ============================================================================
// Sub-Components
// ============================================================================

function ProviderCard({ provider, onConfigure }: { provider: BGCheckProvider; onConfigure: () => void }) {
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
        <ShieldCheck size={20} color={provider.is_connected ? colors.fg[theme].active : colors.icon[theme].subtle} />
      </Stack>
      <Stack style={{ flex: 1 }} gap={2}>
        <Row gap={8} align="center">
          <Text style={{ color: colors.text[theme].primary, fontWeight: '600' }}>{provider.display_name}</Text>
          {provider.is_default && <StatusBadge variant="success">Default</StatusBadge>}
          {provider.is_connected && !provider.is_default && <StatusBadge variant="default">Connected</StatusBadge>}
        </Row>
        <Text style={{ color: colors.text[theme].tertiary, fontSize: 12 }}>{provider.description}</Text>
        {provider.is_connected && (
          <Text style={{ color: colors.text[theme].tertiary, fontSize: 11 }}>
            {provider.supported_packages.length} packages available · Default: {provider.default_package ?? 'none'}
          </Text>
        )}
      </Stack>
      {provider.is_connected ? (
        <Row gap={8}>
          <Button size="sm" variant="outline" iconStart={Settings} onPress={onConfigure}>Configure</Button>
        </Row>
      ) : (
        <Button size="sm" variant="filled" iconStart={Link2} onPress={onConfigure}>Connect</Button>
      )}
    </Row>
  )
}

function WebhookEventRow({ event }: { event: WebhookEvent }) {
  const { theme } = useThemeContext()
  const date = new Date(event.received_at)

  return (
    <Row gap={12} align="center" padding="sm" style={{ backgroundColor: colors.bg[theme].subtle, borderRadius: 8 }}>
      <Stack style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: event.processed ? `${colors.success[500]}20` : `${colors.warning[500]}20`, alignItems: 'center', justifyContent: 'center' }}>
        {event.processed ? <Check size={12} color={colors.success[500]} /> : <Clock size={12} color={colors.warning[500]} />}
      </Stack>
      <Stack style={{ flex: 1 }} gap={2}>
        <Text style={{ color: colors.text[theme].primary, fontSize: 13, fontFamily: 'monospace' }}>{event.event_type}</Text>
        <Text style={{ color: colors.text[theme].tertiary, fontSize: 11 }}>{date.toLocaleString()}</Text>
      </Stack>
      {event.check_status && (
        <StatusBadge variant={event.check_status === 'clear' ? 'success' : event.check_status === 'consider' ? 'warning' : 'default'}>
          {event.check_status}
        </StatusBadge>
      )}
      <StatusBadge variant={event.processed ? 'success' : 'warning'}>
        {event.processed ? 'Processed' : 'Pending'}
      </StatusBadge>
    </Row>
  )
}

function PackageCard({ pkg }: { pkg: CheckPackage }) {
  const { theme } = useThemeContext()

  return (
    <Card padding="md" style={{ borderWidth: 1, borderColor: colors.border[theme].default }}>
      <Stack gap={10}>
        <Row justify="space-between" align="center">
          <Text style={{ color: colors.text[theme].primary, fontWeight: '600', fontSize: 15 }}>{pkg.name}</Text>
          <Text style={{ color: colors.fg[theme].active, fontWeight: '700', fontSize: 14 }}>{pkg.price_range}</Text>
        </Row>
        <Text style={{ color: colors.text[theme].tertiary, fontSize: 13 }}>{pkg.description}</Text>
        <Separator />
        <Stack gap={4}>
          {pkg.checks_included.map((check) => (
            <Row key={check} gap={6} align="center">
              <Check size={12} color={colors.fg[theme].success} />
              <Text style={{ color: colors.text[theme].secondary, fontSize: 12 }}>{check}</Text>
            </Row>
          ))}
        </Stack>
        <Row justify="space-between" align="center" style={{ paddingTop: 4 }}>
          <Row gap={4} align="center">
            <Clock size={12} color={colors.icon[theme].subtle} />
            <Text style={{ color: colors.text[theme].tertiary, fontSize: 11 }}>{pkg.avg_turnaround}</Text>
          </Row>
          <Button size="sm" variant="outline" onPress={() => {}}>Set as Default</Button>
        </Row>
      </Stack>
    </Card>
  )
}

// ============================================================================
// Main Component
// ============================================================================

export function BackgroundCheckProvidersScreen() {
  const { theme } = useThemeContext()
  const [activeTab, setActiveTab] = useState('providers')
  const [showConfigModal, setShowConfigModal] = useState(false)
  const [selectedProvider, setSelectedProvider] = useState<BGCheckProvider | null>(null)

  const connectedCount = PROVIDERS.filter((p) => p.is_connected).length

  return (
    <ScrollView showsVerticalScrollIndicator={false}>
      <Stack gap={16}>
        {/* Header */}
        <Row justify="space-between" align="center">
          <Stack gap={2}>
            <Text style={{ color: colors.text[theme].primary, fontSize: 20, fontWeight: '700' }}>
              Background Check Providers
            </Text>
            <Text style={{ color: colors.text[theme].tertiary, fontSize: 14 }}>
              Manage provider integrations and check configurations
            </Text>
          </Stack>
          <StatusBadge variant={connectedCount > 0 ? 'success' : 'default'}>
            {connectedCount} connected
          </StatusBadge>
        </Row>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} type="line">
          <Tabs.Item value="providers">
            <Tabs.Trigger>Providers</Tabs.Trigger>
            <Tabs.Content>
              <Stack gap={16} style={{ paddingTop: 16 }}>
                <DashboardWidget>
                  <DashboardWidgetHeader title="Available Providers" />
                  <Stack gap={8}>
                    {PROVIDERS.map((provider) => (
                      <ProviderCard
                        key={provider.id}
                        provider={provider}
                        onConfigure={() => {
                          setSelectedProvider(provider)
                          setShowConfigModal(true)
                        }}
                      />
                    ))}
                  </Stack>
                </DashboardWidget>
              </Stack>
            </Tabs.Content>
          </Tabs.Item>

          <Tabs.Item value="packages">
            <Tabs.Trigger>Check Packages</Tabs.Trigger>
            <Tabs.Content>
              <Stack gap={16} style={{ paddingTop: 16 }}>
                <DashboardWidget>
                  <DashboardWidgetHeader title="Background Check Packages" />
                  <Text style={{ color: colors.text[theme].tertiary, fontSize: 13, marginBottom: 8 }}>
                    Available screening packages from your connected provider
                  </Text>
                  <Stack gap={12}>
                    {CHECK_PACKAGES.map((pkg) => (
                      <PackageCard key={pkg.id} pkg={pkg} />
                    ))}
                  </Stack>
                </DashboardWidget>
              </Stack>
            </Tabs.Content>
          </Tabs.Item>

          <Tabs.Item value="webhooks">
            <Tabs.Trigger>Webhook Events</Tabs.Trigger>
            <Tabs.Content>
              <Stack gap={16} style={{ paddingTop: 16 }}>
                {/* Webhook URL */}
                <DashboardWidget>
                  <DashboardWidgetHeader title="Webhook Configuration" />
                  <Row gap={8} align="center" padding="sm" style={{ backgroundColor: colors.bg[theme].subtle, borderRadius: 8 }}>
                    <Webhook size={16} color={colors.icon[theme].default} />
                    <Text style={{ flex: 1, color: colors.text[theme].primary, fontSize: 12, fontFamily: 'monospace' }}>
                      https://api.scaffald.com/webhooks/checkr/abc123
                    </Text>
                    <Button size="sm" variant="outline" iconStart={Copy} onPress={() => {}}>Copy</Button>
                  </Row>
                </DashboardWidget>

                {/* Recent Events */}
                <DashboardWidget>
                  <DashboardWidgetHeader title="Recent Events" />
                  <Stack gap={6}>
                    {MOCK_EVENTS.map((event) => (
                      <WebhookEventRow key={event.id} event={event} />
                    ))}
                  </Stack>
                </DashboardWidget>
              </Stack>
            </Tabs.Content>
          </Tabs.Item>
        </Tabs>

        {/* Configure Provider Modal */}
        <Modal visible={showConfigModal} onClose={() => setShowConfigModal(false)} width={480}>
          <ModalHeader title={selectedProvider?.is_connected ? `Configure ${selectedProvider?.display_name}` : `Connect ${selectedProvider?.display_name}`} />
          <ModalContent>
            <Stack gap={16}>
              {!selectedProvider?.is_connected && (
                <Text style={{ color: colors.text[theme].secondary, fontSize: 14 }}>
                  Enter your API credentials to integrate {selectedProvider?.display_name}.
                </Text>
              )}
              <Stack gap={4}>
                <Text style={{ color: colors.text[theme].primary, fontSize: 14, fontWeight: '500' }}>API Key</Text>
                <Input placeholder="Enter API key" secureTextEntry onChangeText={() => {}} />
              </Stack>
              <Stack gap={4}>
                <Text style={{ color: colors.text[theme].primary, fontSize: 14, fontWeight: '500' }}>Webhook Secret</Text>
                <Input placeholder="Enter webhook secret" secureTextEntry onChangeText={() => {}} />
              </Stack>
              {selectedProvider?.is_connected && (
                <>
                  <Separator />
                  <Row justify="space-between" align="center">
                    <Text style={{ color: colors.text[theme].primary, fontSize: 14 }}>Set as Default Provider</Text>
                    <Toggle checked={selectedProvider.is_default} onChange={() => {}} />
                  </Row>
                  <Row justify="space-between" align="center">
                    <Text style={{ color: colors.text[theme].primary, fontSize: 14 }}>Active</Text>
                    <Toggle checked={selectedProvider.is_active} onChange={() => {}} />
                  </Row>
                </>
              )}
            </Stack>
          </ModalContent>
          <ModalActions
            primaryAction={{ label: selectedProvider?.is_connected ? 'Save' : 'Connect', onPress: () => setShowConfigModal(false) }}
            secondaryAction={{ label: 'Cancel', onPress: () => setShowConfigModal(false) }}
          />
        </Modal>
      </Stack>
    </ScrollView>
  )
}
