/**
 * Calendar & Interview Scheduling Screen
 *
 * Allows employers to manage calendar connections, set availability,
 * propose interview times, and create self-scheduling links.
 *
 * @see Issue #87 - Calendar Integration (Phase 1)
 * @see Issue #88 - Candidate Self-Scheduling
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
import {
  Calendar,
  Clock,
  Link2,
  Plus,
  RefreshCw,
  Video,
  Phone,
  MapPin,
  Copy,
} from 'lucide-react-native'
import { ScrollView } from 'react-native'
import { StatusBadge } from '@scf/core/components/ui'

// ============================================================================
// Types
// ============================================================================

interface CalendarConnection {
  id: string
  provider: 'google' | 'outlook' | 'apple'
  is_active: boolean
  sync_enabled: boolean
  last_synced_at: string | null
}

interface AvailabilityWindow {
  id: string
  day_of_week: number
  start_time: string
  end_time: string
  timezone: string
  is_active: boolean
}

interface InterviewSlot {
  id: string
  application_id: string
  slot_start: string
  slot_end: string
  location_type: 'video' | 'phone' | 'in_person'
  status: 'proposed' | 'booked' | 'confirmed' | 'cancelled' | 'completed'
  candidate_name?: string
}

interface SchedulingLink {
  id: string
  token: string
  application_id: string
  expires_at: string
  is_active: boolean
  current_bookings: number
  max_bookings: number
}

// ============================================================================
// Mock Data
// ============================================================================

const MOCK_CONNECTIONS: CalendarConnection[] = [
  { id: '1', provider: 'google', is_active: true, sync_enabled: true, last_synced_at: '2026-03-10T12:00:00Z' },
]

const MOCK_AVAILABILITY: AvailabilityWindow[] = [
  { id: '1', day_of_week: 1, start_time: '09:00', end_time: '12:00', timezone: 'America/New_York', is_active: true },
  { id: '2', day_of_week: 1, start_time: '13:00', end_time: '17:00', timezone: 'America/New_York', is_active: true },
  { id: '3', day_of_week: 2, start_time: '09:00', end_time: '17:00', timezone: 'America/New_York', is_active: true },
  { id: '4', day_of_week: 3, start_time: '09:00', end_time: '17:00', timezone: 'America/New_York', is_active: true },
  { id: '5', day_of_week: 4, start_time: '09:00', end_time: '12:00', timezone: 'America/New_York', is_active: true },
]

const MOCK_SLOTS: InterviewSlot[] = [
  { id: '1', application_id: 'app-1', slot_start: '2026-03-12T10:00:00Z', slot_end: '2026-03-12T10:30:00Z', location_type: 'video', status: 'proposed', candidate_name: 'John D.' },
  { id: '2', application_id: 'app-2', slot_start: '2026-03-12T14:00:00Z', slot_end: '2026-03-12T14:45:00Z', location_type: 'phone', status: 'confirmed', candidate_name: 'Sarah M.' },
  { id: '3', application_id: 'app-3', slot_start: '2026-03-13T09:00:00Z', slot_end: '2026-03-13T10:00:00Z', location_type: 'in_person', status: 'booked', candidate_name: 'Mike R.' },
]

const MOCK_LINKS: SchedulingLink[] = [
  { id: '1', token: 'abc123def456', application_id: 'app-1', expires_at: '2026-03-20T00:00:00Z', is_active: true, current_bookings: 0, max_bookings: 1 },
]

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

// ============================================================================
// Sub-Components
// ============================================================================

function ProviderLogo({ provider: _provider }: { provider: string }) {
  const { theme } = useThemeContext()
  return (
    <Stack style={{ width: 36, height: 36, borderRadius: 8, backgroundColor: colors.bg[theme].subtle, alignItems: 'center', justifyContent: 'center' }}>
      <Calendar size={18} color={colors.icon[theme].default} />
    </Stack>
  )
}

function ConnectionCard({ connection }: { connection: CalendarConnection }) {
  const { theme } = useThemeContext()
  const providerNames: Record<string, string> = { google: 'Google Calendar', outlook: 'Outlook', apple: 'Apple Calendar' }

  return (
    <Row gap={12} align="center" padding="md" style={{ backgroundColor: colors.bg[theme].subtle, borderRadius: 10 }}>
      <ProviderLogo provider={connection.provider} />
      <Stack style={{ flex: 1 }} gap={2}>
        <Text style={{ color: colors.text[theme].primary, fontWeight: '600' }}>
          {providerNames[connection.provider]}
        </Text>
        <Text style={{ color: colors.text[theme].tertiary, fontSize: 12 }}>
          {connection.last_synced_at ? `Last synced ${new Date(connection.last_synced_at).toLocaleString()}` : 'Not synced'}
        </Text>
      </Stack>
      <StatusBadge variant={connection.is_active ? 'success' : 'default'}>
        {connection.is_active ? 'Connected' : 'Disconnected'}
      </StatusBadge>
      <Button size="sm" variant="outline" iconStart={RefreshCw} onPress={() => {}}>
        Sync
      </Button>
    </Row>
  )
}

function AvailabilityRow({ window: avail }: { window: AvailabilityWindow }) {
  const { theme } = useThemeContext()

  return (
    <Row gap={12} align="center" padding="sm" style={{ backgroundColor: colors.bg[theme].subtle, borderRadius: 8 }}>
      <Stack style={{ width: 40, alignItems: 'center' }}>
        <Text style={{ color: colors.text[theme].primary, fontWeight: '600', fontSize: 13 }}>
          {DAY_NAMES[avail.day_of_week]}
        </Text>
      </Stack>
      <Row gap={4} align="center" style={{ flex: 1 }}>
        <Clock size={14} color={colors.icon[theme].subtle} />
        <Text style={{ color: colors.text[theme].secondary, fontSize: 13 }}>
          {avail.start_time} – {avail.end_time}
        </Text>
      </Row>
      <Text style={{ color: colors.text[theme].tertiary, fontSize: 11 }}>
        {avail.timezone.replace('America/', '')}
      </Text>
      <Toggle checked={avail.is_active} onChange={() => {}} />
    </Row>
  )
}

function SlotStatusBadge({ status }: { status: InterviewSlot['status'] }) {
  const variantMap: Record<string, 'default' | 'success' | 'warning' | 'error'> = {
    proposed: 'warning',
    booked: 'default',
    confirmed: 'success',
    cancelled: 'error',
    completed: 'success',
  }
  return <StatusBadge variant={variantMap[status] ?? 'default'}>{status}</StatusBadge>
}

function LocationIcon({ type }: { type: InterviewSlot['location_type'] }) {
  const { theme } = useThemeContext()
  const iconColor = colors.icon[theme].subtle
  switch (type) {
    case 'video': return <Video size={14} color={iconColor} />
    case 'phone': return <Phone size={14} color={iconColor} />
    case 'in_person': return <MapPin size={14} color={iconColor} />
  }
}

function InterviewSlotCard({ slot }: { slot: InterviewSlot }) {
  const { theme } = useThemeContext()
  const start = new Date(slot.slot_start)

  return (
    <Row gap={12} align="center" padding="sm" style={{ backgroundColor: colors.bg[theme].subtle, borderRadius: 8 }}>
      <Stack style={{ width: 50, alignItems: 'center' }}>
        <Text style={{ color: colors.text[theme].tertiary, fontSize: 11 }}>{start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</Text>
        <Text style={{ color: colors.text[theme].primary, fontWeight: '600', fontSize: 13 }}>{start.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}</Text>
      </Stack>
      <Separator orientation="vertical" />
      <Stack style={{ flex: 1 }} gap={2}>
        <Text style={{ color: colors.text[theme].primary, fontSize: 14 }}>{slot.candidate_name ?? 'Unassigned'}</Text>
        <Row gap={4} align="center">
          <LocationIcon type={slot.location_type} />
          <Text style={{ color: colors.text[theme].tertiary, fontSize: 12 }}>{slot.location_type}</Text>
        </Row>
      </Stack>
      <SlotStatusBadge status={slot.status} />
    </Row>
  )
}

// ============================================================================
// Main Component
// ============================================================================

export function CalendarSchedulingScreen() {
  const { theme } = useThemeContext()
  const [activeTab, setActiveTab] = useState('connections')
  const [showAddSlotModal, setShowAddSlotModal] = useState(false)
  const [showCreateLinkModal, setShowCreateLinkModal] = useState(false)

  return (
    <ScrollView showsVerticalScrollIndicator={false}>
      <Stack gap={16}>
        {/* Header */}
        <Row justify="space-between" align="center">
          <Stack gap={2}>
            <Text style={{ color: colors.text[theme].primary, fontSize: 20, fontWeight: '700' }}>
              Interview Scheduling
            </Text>
            <Text style={{ color: colors.text[theme].tertiary, fontSize: 14 }}>
              Manage calendars, availability, and interview scheduling
            </Text>
          </Stack>
          <Button size="sm" variant="filled" iconStart={Plus} onPress={() => setShowAddSlotModal(true)}>
            Propose Time
          </Button>
        </Row>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} type="line">
          <Tabs.Item value="connections">
            <Tabs.Trigger>Calendar Connections</Tabs.Trigger>
            <Tabs.Content>
              <Stack gap={16} style={{ paddingTop: 16 }}>
                {/* Connected Calendars */}
                <DashboardWidget>
                  <DashboardWidgetHeader title="Connected Calendars" />
                  <Stack gap={8}>
                    {MOCK_CONNECTIONS.map((conn) => (
                      <ConnectionCard key={conn.id} connection={conn} />
                    ))}
                  </Stack>
                  <Separator />
                  <Row gap={8}>
                    <Button size="sm" variant="outline" iconStart={Plus} onPress={() => {}}>
                      Connect Google
                    </Button>
                    <Button size="sm" variant="outline" iconStart={Plus} onPress={() => {}}>
                      Connect Outlook
                    </Button>
                  </Row>
                </DashboardWidget>

                {/* Availability */}
                <DashboardWidget>
                  <DashboardWidgetHeader title="Availability Windows" />
                  <Text style={{ color: colors.text[theme].tertiary, fontSize: 13, marginBottom: 8 }}>
                    Define when you're available for interviews
                  </Text>
                  <Stack gap={6}>
                    {MOCK_AVAILABILITY.map((avail) => (
                      <AvailabilityRow key={avail.id} window={avail} />
                    ))}
                  </Stack>
                  <Separator />
                  <Button size="sm" variant="outline" iconStart={Plus} onPress={() => {}}>
                    Add Availability
                  </Button>
                </DashboardWidget>
              </Stack>
            </Tabs.Content>
          </Tabs.Item>

          <Tabs.Item value="interviews">
            <Tabs.Trigger>Interview Slots</Tabs.Trigger>
            <Tabs.Content>
              <Stack gap={16} style={{ paddingTop: 16 }}>
                <DashboardWidget>
                  <DashboardWidgetHeader
                    title="Upcoming Interviews"
                    action={
                      <Button size="sm" variant="outline" iconStart={Plus} onPress={() => setShowAddSlotModal(true)}>
                        Propose Time
                      </Button>
                    }
                  />
                  <Stack gap={6}>
                    {MOCK_SLOTS.map((slot) => (
                      <InterviewSlotCard key={slot.id} slot={slot} />
                    ))}
                  </Stack>
                </DashboardWidget>

                {/* Stats */}
                <Row gap={12}>
                  <Card style={{ flex: 1 }} padding="md">
                    <Stack align="center" gap={4}>
                      <Text style={{ color: colors.text[theme].primary, fontSize: 24, fontWeight: '700' }}>3</Text>
                      <Text style={{ color: colors.text[theme].tertiary, fontSize: 12 }}>Upcoming</Text>
                    </Stack>
                  </Card>
                  <Card style={{ flex: 1 }} padding="md">
                    <Stack align="center" gap={4}>
                      <Text style={{ color: colors.text[theme].primary, fontSize: 24, fontWeight: '700' }}>1</Text>
                      <Text style={{ color: colors.text[theme].tertiary, fontSize: 12 }}>Confirmed</Text>
                    </Stack>
                  </Card>
                  <Card style={{ flex: 1 }} padding="md">
                    <Stack align="center" gap={4}>
                      <Text style={{ color: colors.text[theme].primary, fontSize: 24, fontWeight: '700' }}>12</Text>
                      <Text style={{ color: colors.text[theme].tertiary, fontSize: 12 }}>Completed</Text>
                    </Stack>
                  </Card>
                </Row>
              </Stack>
            </Tabs.Content>
          </Tabs.Item>

          <Tabs.Item value="scheduling">
            <Tabs.Trigger>Self-Scheduling Links</Tabs.Trigger>
            <Tabs.Content>
              <Stack gap={16} style={{ paddingTop: 16 }}>
                <DashboardWidget>
                  <DashboardWidgetHeader
                    title="Active Scheduling Links"
                    action={
                      <Button size="sm" variant="outline" iconStart={Link2} onPress={() => setShowCreateLinkModal(true)}>
                        Create Link
                      </Button>
                    }
                  />
                  <Text style={{ color: colors.text[theme].tertiary, fontSize: 13, marginBottom: 8 }}>
                    Send candidates a link to choose their preferred interview time
                  </Text>
                  <Stack gap={8}>
                    {MOCK_LINKS.map((link) => (
                      <Row
                        key={link.id}
                        gap={12}
                        align="center"
                        padding="md"
                        style={{ backgroundColor: colors.bg[theme].subtle, borderRadius: 10 }}
                      >
                        <Link2 size={18} color={colors.icon[theme].default} />
                        <Stack style={{ flex: 1 }} gap={2}>
                          <Text style={{ color: colors.text[theme].primary, fontSize: 13, fontFamily: 'monospace' }}>
                            schedule.scaffald.com/{link.token.slice(0, 8)}...
                          </Text>
                          <Text style={{ color: colors.text[theme].tertiary, fontSize: 11 }}>
                            Expires {new Date(link.expires_at).toLocaleDateString()} · {link.current_bookings}/{link.max_bookings} booked
                          </Text>
                        </Stack>
                        <StatusBadge variant={link.is_active ? 'success' : 'default'}>
                          {link.is_active ? 'Active' : 'Expired'}
                        </StatusBadge>
                        <Button size="sm" variant="outline" iconStart={Copy} onPress={() => {}}>
                          Copy
                        </Button>
                      </Row>
                    ))}
                  </Stack>
                </DashboardWidget>

                {/* How it works */}
                <Card padding="lg">
                  <Stack gap={12}>
                    <Text style={{ color: colors.text[theme].primary, fontWeight: '600', fontSize: 16 }}>
                      How Self-Scheduling Works
                    </Text>
                    <Stack gap={8}>
                      {[
                        { step: '1', text: 'Create a scheduling link for a candidate' },
                        { step: '2', text: 'Candidate receives the link via email' },
                        { step: '3', text: 'They pick from your available time slots' },
                        { step: '4', text: 'Both parties receive a calendar invite' },
                      ].map((item) => (
                        <Row key={item.step} gap={10} align="center">
                          <Stack style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: colors.bg[theme].selected, alignItems: 'center', justifyContent: 'center' }}>
                            <Text style={{ color: colors.fg[theme].active, fontSize: 12, fontWeight: '700' }}>{item.step}</Text>
                          </Stack>
                          <Text style={{ color: colors.text[theme].secondary, fontSize: 14 }}>{item.text}</Text>
                        </Row>
                      ))}
                    </Stack>
                  </Stack>
                </Card>
              </Stack>
            </Tabs.Content>
          </Tabs.Item>
        </Tabs>

        {/* Add Slot Modal */}
        <Modal visible={showAddSlotModal} onClose={() => setShowAddSlotModal(false)} width={480}>
          <ModalHeader title="Propose Interview Time" />
          <ModalContent>
            <Stack gap={16}>
              <Stack gap={4}>
                <Text style={{ color: colors.text[theme].primary, fontSize: 14, fontWeight: '500' }}>Date & Time</Text>
                <Input placeholder="Select date and time" onChangeText={() => {}} />
              </Stack>
              <Stack gap={4}>
                <Text style={{ color: colors.text[theme].primary, fontSize: 14, fontWeight: '500' }}>Duration (minutes)</Text>
                <Input placeholder="30" keyboardType="numeric" onChangeText={() => {}} />
              </Stack>
              <Stack gap={4}>
                <Text style={{ color: colors.text[theme].primary, fontSize: 14, fontWeight: '500' }}>Location Type</Text>
                <Row gap={8}>
                  <Button size="sm" variant="outline" iconStart={Video} onPress={() => {}}>Video</Button>
                  <Button size="sm" variant="outline" iconStart={Phone} onPress={() => {}}>Phone</Button>
                  <Button size="sm" variant="outline" iconStart={MapPin} onPress={() => {}}>In Person</Button>
                </Row>
              </Stack>
              <Stack gap={4}>
                <Text style={{ color: colors.text[theme].primary, fontSize: 14, fontWeight: '500' }}>Meeting Link</Text>
                <Input placeholder="https://meet.google.com/..." onChangeText={() => {}} />
              </Stack>
              <Stack gap={4}>
                <Text style={{ color: colors.text[theme].primary, fontSize: 14, fontWeight: '500' }}>Notes</Text>
                <Input placeholder="Optional notes for the candidate" multiline numberOfLines={3} onChangeText={() => {}} />
              </Stack>
            </Stack>
          </ModalContent>
          <ModalActions
            primaryAction={{ label: 'Propose Time', onPress: () => setShowAddSlotModal(false) }}
            secondaryAction={{ label: 'Cancel', onPress: () => setShowAddSlotModal(false) }}
          />
        </Modal>

        {/* Create Link Modal */}
        <Modal visible={showCreateLinkModal} onClose={() => setShowCreateLinkModal(false)} width={480}>
          <ModalHeader title="Create Scheduling Link" />
          <ModalContent>
            <Stack gap={16}>
              <Stack gap={4}>
                <Text style={{ color: colors.text[theme].primary, fontSize: 14, fontWeight: '500' }}>Application</Text>
                <Input placeholder="Search for an application..." onChangeText={() => {}} />
              </Stack>
              <Stack gap={4}>
                <Text style={{ color: colors.text[theme].primary, fontSize: 14, fontWeight: '500' }}>Link Expiration</Text>
                <Input placeholder="7 days" onChangeText={() => {}} />
              </Stack>
              <Stack gap={4}>
                <Text style={{ color: colors.text[theme].primary, fontSize: 14, fontWeight: '500' }}>Max Bookings</Text>
                <Input placeholder="1" keyboardType="numeric" onChangeText={() => {}} />
              </Stack>
            </Stack>
          </ModalContent>
          <ModalActions
            primaryAction={{ label: 'Create Link', onPress: () => setShowCreateLinkModal(false) }}
            secondaryAction={{ label: 'Cancel', onPress: () => setShowCreateLinkModal(false) }}
          />
        </Modal>
      </Stack>
    </ScrollView>
  )
}
