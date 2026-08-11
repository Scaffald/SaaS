/**
 * Calendar & Interview Scheduling Screen
 *
 * Allows employers to manage calendar connections, set availability,
 * propose interview times, and create self-scheduling links.
 *
 * @see Issue #87 - Calendar Integration (Phase 1)
 * @see Issue #88 - Candidate Self-Scheduling
 */

import { useCallback, useMemo, useState } from 'react'
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
import { Platform, Pressable, ScrollView } from 'react-native'
import { StatusBadge } from '@scf/core/components/ui'
import { SampleDataNotice } from '@scf/core/features/office/components/SampleDataNotice'
import {
  useCreateInterviewSlotMutation,
  useCreateSchedulingLinkMutation,
  useEmployerInterviewSlots,
  useEmployerSchedulingLinks,
} from '@scf/core/utils/scheduling-sdk-hooks'
import { useEmployerApplications } from '@scf/core/utils/applications-sdk-hooks'

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

/**
 * Calendar connections and availability windows are still sample data.
 *
 * Interview slots and self-scheduling links are now real: they read and write
 * `/v1/employer/scheduling`, added in Scaffald/SaaS#561. The flag narrowed
 * rather than disappeared, because the two remaining panels are not a missing
 * CRUD endpoint — `core.calendar_connections` stores
 * `access_token_encrypted` / `refresh_token_encrypted` /
 * `provider_account_id` for Google and Outlook, which is an OAuth integration.
 * Availability windows feed slot *generation*, which does not exist yet
 * either.
 *
 * So the notice moved onto the Calendar Connections tab instead of the whole
 * screen, and those two write paths stay disabled rather than silently
 * discarding input. Deleting this constant is the last step of the calendar
 * integration, not of #540.
 */
const CALENDAR_USES_SAMPLE_DATA: boolean = true

const MOCK_CONNECTIONS: CalendarConnection[] = [
  {
    id: '1',
    provider: 'google',
    is_active: true,
    sync_enabled: true,
    last_synced_at: '2026-03-10T12:00:00Z',
  },
]

const MOCK_AVAILABILITY: AvailabilityWindow[] = [
  {
    id: '1',
    day_of_week: 1,
    start_time: '09:00',
    end_time: '12:00',
    timezone: 'America/New_York',
    is_active: true,
  },
  {
    id: '2',
    day_of_week: 1,
    start_time: '13:00',
    end_time: '17:00',
    timezone: 'America/New_York',
    is_active: true,
  },
  {
    id: '3',
    day_of_week: 2,
    start_time: '09:00',
    end_time: '17:00',
    timezone: 'America/New_York',
    is_active: true,
  },
  {
    id: '4',
    day_of_week: 3,
    start_time: '09:00',
    end_time: '17:00',
    timezone: 'America/New_York',
    is_active: true,
  },
  {
    id: '5',
    day_of_week: 4,
    start_time: '09:00',
    end_time: '12:00',
    timezone: 'America/New_York',
    is_active: true,
  },
]

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

/**
 * Public URL a candidate uses to redeem a scheduling link.
 *
 * The mock rendered `schedule.scaffald.com/<token>`, which is not a host that
 * exists — a recruiter who copied it would have sent a dead link. The real
 * route is `/schedule/[token]` (apps/scaffald/app/(protected)/schedule).
 */
function schedulingUrl(token: string): string {
  const origin =
    Platform.OS === 'web' && typeof window !== 'undefined'
      ? window.location.origin
      : 'https://scaffald.com'
  return `${origin}/schedule/${token}`
}

// ============================================================================
// Sub-Components
// ============================================================================

function ProviderLogo({ provider: _provider }: { provider: string }) {
  const { theme } = useThemeContext()
  return (
    <Stack
      style={{
        width: 36,
        height: 36,
        borderRadius: 8,
        backgroundColor: colors.bg[theme].subtle,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Calendar size={18} color={colors.icon[theme].default} />
    </Stack>
  )
}

function ConnectionCard({ connection }: { connection: CalendarConnection }) {
  const { theme } = useThemeContext()
  const providerNames: Record<string, string> = {
    google: 'Google Calendar',
    outlook: 'Outlook',
    apple: 'Apple Calendar',
  }

  return (
    <Row
      gap={12}
      align="center"
      padding="md"
      style={{ backgroundColor: colors.bg[theme].subtle, borderRadius: 10 }}
    >
      <ProviderLogo provider={connection.provider} />
      <Stack style={{ flex: 1 }} gap={2}>
        <Text style={{ color: colors.text[theme].primary, fontWeight: '600' }}>
          {providerNames[connection.provider]}
        </Text>
        <Text style={{ color: colors.text[theme].tertiary, fontSize: 12 }}>
          {connection.last_synced_at
            ? `Last synced ${new Date(connection.last_synced_at).toLocaleString()}`
            : 'Not synced'}
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
    <Row
      gap={12}
      align="center"
      padding="sm"
      style={{ backgroundColor: colors.bg[theme].subtle, borderRadius: 8 }}
    >
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
    case 'video':
      return <Video size={14} color={iconColor} />
    case 'phone':
      return <Phone size={14} color={iconColor} />
    case 'in_person':
      return <MapPin size={14} color={iconColor} />
  }
}

function InterviewSlotCard({ slot }: { slot: InterviewSlot }) {
  const { theme } = useThemeContext()
  const start = new Date(slot.slot_start)

  return (
    <Row
      gap={12}
      align="center"
      padding="sm"
      style={{ backgroundColor: colors.bg[theme].subtle, borderRadius: 8 }}
    >
      <Stack style={{ width: 50, alignItems: 'center' }}>
        <Text style={{ color: colors.text[theme].tertiary, fontSize: 11 }}>
          {start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
        </Text>
        <Text style={{ color: colors.text[theme].primary, fontWeight: '600', fontSize: 13 }}>
          {start.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
        </Text>
      </Stack>
      <Separator orientation="vertical" />
      <Stack style={{ flex: 1 }} gap={2}>
        <Text style={{ color: colors.text[theme].primary, fontSize: 14 }}>
          {slot.candidate_name ?? 'Unassigned'}
        </Text>
        <Row gap={4} align="center">
          <LocationIcon type={slot.location_type} />
          <Text style={{ color: colors.text[theme].tertiary, fontSize: 12 }}>
            {slot.location_type}
          </Text>
        </Row>
      </Stack>
      <SlotStatusBadge status={slot.status} />
    </Row>
  )
}

/**
 * Pick the application a slot or link attaches to.
 *
 * A plain filtered list rather than a Dropdown: this renders inside a Modal,
 * where an absolutely-positioned menu is unreliable on React Native, and the
 * set is small enough to scroll.
 */
function ApplicationPicker({
  applications,
  selectedId,
  onSelect,
  isLoading,
}: {
  applications: Array<{ id: string; label: string; sublabel: string }>
  selectedId: string | null
  onSelect: (id: string) => void
  isLoading: boolean
}) {
  const { theme } = useThemeContext()
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return applications
    return applications.filter(
      (a) => a.label.toLowerCase().includes(q) || a.sublabel.toLowerCase().includes(q)
    )
  }, [applications, search])

  return (
    <Stack gap={8}>
      <Input placeholder="Search for an application..." value={search} onChangeText={setSearch} />
      <ScrollView style={{ maxHeight: 160 }} nestedScrollEnabled>
        <Stack gap={4}>
          {isLoading && (
            <Text style={{ color: colors.text[theme].tertiary, fontSize: 13 }}>
              Loading applications…
            </Text>
          )}
          {!isLoading && filtered.length === 0 && (
            <Text style={{ color: colors.text[theme].tertiary, fontSize: 13 }}>
              {applications.length === 0
                ? 'No applications yet — there is nobody to schedule with.'
                : 'No applications match that search.'}
            </Text>
          )}
          {filtered.map((app) => (
            <Pressable key={app.id} onPress={() => onSelect(app.id)}>
              <Row
                gap={8}
                align="center"
                padding="sm"
                style={{
                  borderRadius: 8,
                  backgroundColor:
                    selectedId === app.id ? colors.bg[theme].selected : colors.bg[theme].subtle,
                }}
              >
                <Stack style={{ flex: 1 }} gap={2}>
                  <Text style={{ color: colors.text[theme].primary, fontSize: 13 }}>
                    {app.label}
                  </Text>
                  <Text style={{ color: colors.text[theme].tertiary, fontSize: 11 }}>
                    {app.sublabel}
                  </Text>
                </Stack>
              </Row>
            </Pressable>
          ))}
        </Stack>
      </ScrollView>
    </Stack>
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
  const [copiedLinkId, setCopiedLinkId] = useState<string | null>(null)

  // Organisation-wide: no application_id. See useEmployerInterviewSlots.
  const slotsQuery = useEmployerInterviewSlots()
  const linksQuery = useEmployerSchedulingLinks()

  /**
   * Applications, for two reasons: the modals need something to attach a slot
   * or link to, and the slot rows need a candidate name. The scheduling rows
   * carry `application_id` and nothing else about the person — the name lives
   * on the application — so it is resolved here rather than denormalised into
   * the scheduling tables.
   */
  const applicationsQuery = useEmployerApplications({ limit: 100 })
  const applications = applicationsQuery.data?.data ?? []

  const candidateNameByApplication = useMemo(() => {
    const map = new Map<string, string>()
    for (const app of applications) {
      const candidate = app.candidate as { first_name?: string; last_name?: string } | undefined
      const name = [candidate?.first_name, candidate?.last_name].filter(Boolean).join(' ').trim()
      if (name) map.set(app.id, name)
    }
    return map
  }, [applications])

  const slots: InterviewSlot[] = useMemo(
    () =>
      (slotsQuery.data ?? []).map((slot) => ({
        id: slot.id,
        application_id: slot.application_id,
        slot_start: slot.slot_start,
        slot_end: slot.slot_end,
        location_type: slot.location_type,
        // `no_show` exists in the database but not in this screen's union. It
        // reads as a finished interview here rather than an upcoming one.
        status: slot.status === 'no_show' ? 'completed' : slot.status,
        candidate_name: candidateNameByApplication.get(slot.application_id),
      })),
    [slotsQuery.data, candidateNameByApplication]
  )

  const links: SchedulingLink[] = useMemo(
    () =>
      (linksQuery.data ?? []).map((link) => ({
        id: link.id,
        token: link.token,
        application_id: link.application_id,
        expires_at: link.expires_at,
        is_active: link.is_active,
        current_bookings: link.current_bookings ?? 0,
        max_bookings: link.max_bookings ?? 1,
      })),
    [linksQuery.data]
  )

  const slotCounts = useMemo(
    () => ({
      upcoming: slots.filter((slot) => slot.status !== 'cancelled' && slot.status !== 'completed')
        .length,
      confirmed: slots.filter((slot) => slot.status === 'confirmed').length,
      completed: slots.filter((slot) => slot.status === 'completed').length,
    }),
    [slots]
  )

  const createSlot = useCreateInterviewSlotMutation()
  const createLink = useCreateSchedulingLinkMutation()

  const applicationOptions = useMemo(
    () =>
      applications.map((app) => {
        const job = app.job as { title?: string } | undefined
        return {
          id: app.id,
          label: candidateNameByApplication.get(app.id) ?? 'Candidate',
          sublabel: job?.title ?? 'Application',
        }
      }),
    [applications, candidateNameByApplication]
  )

  // ── Propose Time form ────────────────────────────────────────────────────
  const [slotApplicationId, setSlotApplicationId] = useState<string | null>(null)
  const [slotStart, setSlotStart] = useState('')
  const [slotDuration, setSlotDuration] = useState('30')
  const [slotLocationType, setSlotLocationType] = useState<'video' | 'phone' | 'in_person'>('video')
  const [slotMeetingLink, setSlotMeetingLink] = useState('')
  const [slotNotes, setSlotNotes] = useState('')
  const [slotError, setSlotError] = useState<string | null>(null)

  const resetSlotForm = useCallback(() => {
    setSlotApplicationId(null)
    setSlotStart('')
    setSlotDuration('30')
    setSlotLocationType('video')
    setSlotMeetingLink('')
    setSlotNotes('')
    setSlotError(null)
  }, [])

  const submitSlot = useCallback(() => {
    setSlotError(null)

    if (!slotApplicationId) {
      setSlotError('Choose an application first.')
      return
    }

    const startMs = Date.parse(slotStart)
    if (Number.isNaN(startMs)) {
      setSlotError('Enter a start time, e.g. 2026-09-01 10:00.')
      return
    }

    const minutes = Number.parseInt(slotDuration, 10)
    if (!Number.isFinite(minutes) || minutes <= 0) {
      setSlotError('Duration must be a positive number of minutes.')
      return
    }

    createSlot.mutate(
      {
        application_id: slotApplicationId,
        slot_start: new Date(startMs).toISOString(),
        slot_end: new Date(startMs + minutes * 60_000).toISOString(),
        // The employer's own zone, which is what they typed the time in.
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
        location_type: slotLocationType,
        ...(slotMeetingLink.trim() ? { meeting_link: slotMeetingLink.trim() } : {}),
        ...(slotNotes.trim() ? { notes: slotNotes.trim() } : {}),
      },
      {
        onSuccess: () => {
          setShowAddSlotModal(false)
          resetSlotForm()
        },
        onError: (error) => setSlotError(error.message),
      }
    )
  }, [
    createSlot,
    slotApplicationId,
    slotStart,
    slotDuration,
    slotLocationType,
    slotMeetingLink,
    slotNotes,
    resetSlotForm,
  ])

  // ── Create Link form ─────────────────────────────────────────────────────
  const [linkApplicationId, setLinkApplicationId] = useState<string | null>(null)
  const [linkExpiryDays, setLinkExpiryDays] = useState('7')
  const [linkMaxBookings, setLinkMaxBookings] = useState('1')
  const [linkError, setLinkError] = useState<string | null>(null)

  const resetLinkForm = useCallback(() => {
    setLinkApplicationId(null)
    setLinkExpiryDays('7')
    setLinkMaxBookings('1')
    setLinkError(null)
  }, [])

  const submitLink = useCallback(() => {
    setLinkError(null)

    if (!linkApplicationId) {
      setLinkError('Choose an application first.')
      return
    }

    const days = Number.parseInt(linkExpiryDays, 10)
    if (!Number.isFinite(days) || days <= 0) {
      setLinkError('Expiration must be a positive number of days.')
      return
    }

    const max = Number.parseInt(linkMaxBookings, 10)
    if (!Number.isFinite(max) || max <= 0) {
      setLinkError('Max bookings must be at least 1.')
      return
    }

    createLink.mutate(
      {
        application_id: linkApplicationId,
        expires_at: new Date(Date.now() + days * 86_400_000).toISOString(),
        max_bookings: max,
      },
      {
        onSuccess: () => {
          setShowCreateLinkModal(false)
          resetLinkForm()
        },
        onError: (error) => setLinkError(error.message),
      }
    )
  }, [createLink, linkApplicationId, linkExpiryDays, linkMaxBookings, resetLinkForm])

  const copyLink = useCallback((link: SchedulingLink) => {
    const url = schedulingUrl(link.token)
    // Clipboard is web-only here. React Native's Clipboard module is a separate
    // dependency this package does not carry, so rather than pretend, the
    // button is only offered where it works.
    if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.clipboard) {
      void navigator.clipboard.writeText(url)
      setCopiedLinkId(link.id)
    }
  }, [])

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
          <Button
            size="sm"
            variant="filled"
            iconStart={Plus}
            onPress={() => setShowAddSlotModal(true)}
          >
            Propose Time
          </Button>
        </Row>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} type="line">
          <Tabs.Item value="connections">
            <Tabs.Trigger>Calendar Connections</Tabs.Trigger>
            <Tabs.Content>
              <Stack gap={16} style={{ paddingTop: 16 }}>
                {CALENDAR_USES_SAMPLE_DATA && (
                  <SampleDataNotice
                    title="Sample data — no calendar is connected"
                    description="These calendars and availability windows are placeholders. Connecting Google or Outlook needs an OAuth integration that does not exist yet, so nothing here is saved. Interview slots and scheduling links, on the other tabs, are real."
                  />
                )}

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
                    <Button
                      size="sm"
                      variant="outline"
                      iconStart={Plus}
                      disabled={CALENDAR_USES_SAMPLE_DATA}
                      onPress={() => {}}
                    >
                      Connect Google
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      iconStart={Plus}
                      disabled={CALENDAR_USES_SAMPLE_DATA}
                      onPress={() => {}}
                    >
                      Connect Outlook
                    </Button>
                  </Row>
                </DashboardWidget>

                {/* Availability */}
                <DashboardWidget>
                  <DashboardWidgetHeader title="Availability Windows" />
                  <Text
                    style={{ color: colors.text[theme].tertiary, fontSize: 13, marginBottom: 8 }}
                  >
                    Define when you're available for interviews
                  </Text>
                  <Stack gap={6}>
                    {MOCK_AVAILABILITY.map((avail) => (
                      <AvailabilityRow key={avail.id} window={avail} />
                    ))}
                  </Stack>
                  <Separator />
                  <Button
                    size="sm"
                    variant="outline"
                    iconStart={Plus}
                    disabled={CALENDAR_USES_SAMPLE_DATA}
                    onPress={() => {}}
                  >
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
                      <Button
                        size="sm"
                        variant="outline"
                        iconStart={Plus}
                        onPress={() => setShowAddSlotModal(true)}
                      >
                        Propose Time
                      </Button>
                    }
                  />
                  <Stack gap={6}>
                    {slotsQuery.isLoading && (
                      <Text style={{ color: colors.text[theme].tertiary, fontSize: 13 }}>
                        Loading interviews…
                      </Text>
                    )}
                    {slotsQuery.isError && (
                      <Text style={{ color: colors.fg[theme].error, fontSize: 13 }}>
                        Could not load interviews. {(slotsQuery.error as Error)?.message ?? ''}
                      </Text>
                    )}
                    {!slotsQuery.isLoading && !slotsQuery.isError && slots.length === 0 && (
                      <Text style={{ color: colors.text[theme].tertiary, fontSize: 13 }}>
                        No interviews proposed yet. Use Propose Time to offer a candidate a slot.
                      </Text>
                    )}
                    {slots.map((slot) => (
                      <InterviewSlotCard key={slot.id} slot={slot} />
                    ))}
                  </Stack>
                </DashboardWidget>

                {/* Stats. Previously hardcoded "3" / "1" / "12" — the first two
                    happened to match the mock slots, and "12 completed" was
                    invented outright. Now derived from the real ones. */}
                <Row gap={12}>
                  <Card variant="glass" style={{ flex: 1 }} padding="md">
                    <Stack align="center" gap={4}>
                      <Text
                        style={{
                          color: colors.text[theme].primary,
                          fontSize: 24,
                          fontWeight: '700',
                        }}
                      >
                        {slotCounts.upcoming}
                      </Text>
                      <Text style={{ color: colors.text[theme].tertiary, fontSize: 12 }}>
                        Upcoming
                      </Text>
                    </Stack>
                  </Card>
                  <Card variant="glass" style={{ flex: 1 }} padding="md">
                    <Stack align="center" gap={4}>
                      <Text
                        style={{
                          color: colors.text[theme].primary,
                          fontSize: 24,
                          fontWeight: '700',
                        }}
                      >
                        {slotCounts.confirmed}
                      </Text>
                      <Text style={{ color: colors.text[theme].tertiary, fontSize: 12 }}>
                        Confirmed
                      </Text>
                    </Stack>
                  </Card>
                  <Card variant="glass" style={{ flex: 1 }} padding="md">
                    <Stack align="center" gap={4}>
                      <Text
                        style={{
                          color: colors.text[theme].primary,
                          fontSize: 24,
                          fontWeight: '700',
                        }}
                      >
                        {slotCounts.completed}
                      </Text>
                      <Text style={{ color: colors.text[theme].tertiary, fontSize: 12 }}>
                        Completed
                      </Text>
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
                      <Button
                        size="sm"
                        variant="outline"
                        iconStart={Link2}
                        onPress={() => setShowCreateLinkModal(true)}
                      >
                        Create Link
                      </Button>
                    }
                  />
                  <Text
                    style={{ color: colors.text[theme].tertiary, fontSize: 13, marginBottom: 8 }}
                  >
                    Send candidates a link to choose their preferred interview time
                  </Text>
                  <Stack gap={8}>
                    {linksQuery.isLoading && (
                      <Text style={{ color: colors.text[theme].tertiary, fontSize: 13 }}>
                        Loading links…
                      </Text>
                    )}
                    {linksQuery.isError && (
                      <Text style={{ color: colors.fg[theme].error, fontSize: 13 }}>
                        Could not load links. {(linksQuery.error as Error)?.message ?? ''}
                      </Text>
                    )}
                    {!linksQuery.isLoading && !linksQuery.isError && links.length === 0 && (
                      <Text style={{ color: colors.text[theme].tertiary, fontSize: 13 }}>
                        No scheduling links yet. Create one to let a candidate pick their own time.
                      </Text>
                    )}
                    {links.map((link) => {
                      // An expired link is still `is_active` in the database —
                      // the flag is the employer's kill switch, not the clock.
                      // Showing "Active" past the expiry misrepresents a link
                      // the candidate can no longer redeem.
                      const expired = Date.parse(link.expires_at) < Date.now()
                      const usable = link.is_active && !expired
                      return (
                        <Row
                          key={link.id}
                          gap={12}
                          align="center"
                          padding="md"
                          style={{ backgroundColor: colors.bg[theme].subtle, borderRadius: 10 }}
                        >
                          <Link2 size={18} color={colors.icon[theme].default} />
                          <Stack style={{ flex: 1 }} gap={2}>
                            <Text
                              style={{
                                color: colors.text[theme].primary,
                                fontSize: 13,
                                fontFamily: 'monospace',
                              }}
                            >
                              {schedulingUrl(link.token)}
                            </Text>
                            <Text style={{ color: colors.text[theme].tertiary, fontSize: 11 }}>
                              {candidateNameByApplication.get(link.application_id) ?? 'Candidate'} ·{' '}
                              {expired ? 'Expired' : 'Expires'}{' '}
                              {new Date(link.expires_at).toLocaleDateString()} ·{' '}
                              {link.current_bookings}/{link.max_bookings} booked
                            </Text>
                          </Stack>
                          <StatusBadge variant={usable ? 'success' : 'default'}>
                            {usable ? 'Active' : expired ? 'Expired' : 'Disabled'}
                          </StatusBadge>
                          {Platform.OS === 'web' && (
                            <Button
                              size="sm"
                              variant="outline"
                              iconStart={Copy}
                              onPress={() => copyLink(link)}
                            >
                              {copiedLinkId === link.id ? 'Copied' : 'Copy'}
                            </Button>
                          )}
                        </Row>
                      )
                    })}
                  </Stack>
                </DashboardWidget>

                {/* How it works */}
                <Card variant="glass" padding="lg">
                  <Stack gap={12}>
                    <Text
                      style={{ color: colors.text[theme].primary, fontWeight: '600', fontSize: 16 }}
                    >
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
                          <Stack
                            style={{
                              width: 24,
                              height: 24,
                              borderRadius: 12,
                              backgroundColor: colors.bg[theme].selected,
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <Text
                              style={{
                                color: colors.fg[theme].active,
                                fontSize: 12,
                                fontWeight: '700',
                              }}
                            >
                              {item.step}
                            </Text>
                          </Stack>
                          <Text style={{ color: colors.text[theme].secondary, fontSize: 14 }}>
                            {item.text}
                          </Text>
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
        <Modal
          visible={showAddSlotModal}
          onClose={() => {
            setShowAddSlotModal(false)
            resetSlotForm()
          }}
          width={480}
        >
          <ModalHeader title="Propose Interview Time" />
          <ModalContent>
            <Stack gap={16}>
              <Stack gap={4}>
                <Text
                  style={{ color: colors.text[theme].primary, fontSize: 14, fontWeight: '500' }}
                >
                  Candidate
                </Text>
                <ApplicationPicker
                  applications={applicationOptions}
                  selectedId={slotApplicationId}
                  onSelect={setSlotApplicationId}
                  isLoading={applicationsQuery.isLoading}
                />
              </Stack>
              <Stack gap={4}>
                <Text
                  style={{ color: colors.text[theme].primary, fontSize: 14, fontWeight: '500' }}
                >
                  Date & Time
                </Text>
                <Input
                  placeholder="2026-09-01 10:00"
                  value={slotStart}
                  onChangeText={setSlotStart}
                />
              </Stack>
              <Stack gap={4}>
                <Text
                  style={{ color: colors.text[theme].primary, fontSize: 14, fontWeight: '500' }}
                >
                  Duration (minutes)
                </Text>
                <Input
                  placeholder="30"
                  keyboardType="numeric"
                  value={slotDuration}
                  onChangeText={setSlotDuration}
                />
              </Stack>
              <Stack gap={4}>
                <Text
                  style={{ color: colors.text[theme].primary, fontSize: 14, fontWeight: '500' }}
                >
                  Location Type
                </Text>
                <Row gap={8}>
                  <Button
                    size="sm"
                    variant={slotLocationType === 'video' ? 'filled' : 'outline'}
                    iconStart={Video}
                    onPress={() => setSlotLocationType('video')}
                  >
                    Video
                  </Button>
                  <Button
                    size="sm"
                    variant={slotLocationType === 'phone' ? 'filled' : 'outline'}
                    iconStart={Phone}
                    onPress={() => setSlotLocationType('phone')}
                  >
                    Phone
                  </Button>
                  <Button
                    size="sm"
                    variant={slotLocationType === 'in_person' ? 'filled' : 'outline'}
                    iconStart={MapPin}
                    onPress={() => setSlotLocationType('in_person')}
                  >
                    In Person
                  </Button>
                </Row>
              </Stack>
              <Stack gap={4}>
                <Text
                  style={{ color: colors.text[theme].primary, fontSize: 14, fontWeight: '500' }}
                >
                  Meeting Link
                </Text>
                <Input
                  placeholder="https://meet.google.com/..."
                  value={slotMeetingLink}
                  onChangeText={setSlotMeetingLink}
                />
              </Stack>
              <Stack gap={4}>
                <Text
                  style={{ color: colors.text[theme].primary, fontSize: 14, fontWeight: '500' }}
                >
                  Notes
                </Text>
                <Input
                  placeholder="Optional notes for the candidate"
                  multiline
                  numberOfLines={3}
                  value={slotNotes}
                  onChangeText={setSlotNotes}
                />
              </Stack>
              {slotError && (
                <Text style={{ color: colors.fg[theme].error, fontSize: 13 }}>{slotError}</Text>
              )}
            </Stack>
          </ModalContent>
          <ModalActions
            primaryAction={{
              label: createSlot.isPending ? 'Proposing…' : 'Propose Time',
              onPress: submitSlot,
            }}
            secondaryAction={{
              label: 'Cancel',
              onPress: () => {
                setShowAddSlotModal(false)
                resetSlotForm()
              },
            }}
          />
        </Modal>

        {/* Create Link Modal */}
        <Modal
          visible={showCreateLinkModal}
          onClose={() => {
            setShowCreateLinkModal(false)
            resetLinkForm()
          }}
          width={480}
        >
          <ModalHeader title="Create Scheduling Link" />
          <ModalContent>
            <Stack gap={16}>
              <Stack gap={4}>
                <Text
                  style={{ color: colors.text[theme].primary, fontSize: 14, fontWeight: '500' }}
                >
                  Application
                </Text>
                <ApplicationPicker
                  applications={applicationOptions}
                  selectedId={linkApplicationId}
                  onSelect={setLinkApplicationId}
                  isLoading={applicationsQuery.isLoading}
                />
              </Stack>
              <Stack gap={4}>
                <Text
                  style={{ color: colors.text[theme].primary, fontSize: 14, fontWeight: '500' }}
                >
                  Link Expiration (days)
                </Text>
                <Input
                  placeholder="7"
                  keyboardType="numeric"
                  value={linkExpiryDays}
                  onChangeText={setLinkExpiryDays}
                />
              </Stack>
              <Stack gap={4}>
                <Text
                  style={{ color: colors.text[theme].primary, fontSize: 14, fontWeight: '500' }}
                >
                  Max Bookings
                </Text>
                <Input
                  placeholder="1"
                  keyboardType="numeric"
                  value={linkMaxBookings}
                  onChangeText={setLinkMaxBookings}
                />
              </Stack>
              {linkError && (
                <Text style={{ color: colors.fg[theme].error, fontSize: 13 }}>{linkError}</Text>
              )}
            </Stack>
          </ModalContent>
          <ModalActions
            primaryAction={{
              label: createLink.isPending ? 'Creating…' : 'Create Link',
              onPress: submitLink,
            }}
            secondaryAction={{
              label: 'Cancel',
              onPress: () => {
                setShowCreateLinkModal(false)
                resetLinkForm()
              },
            }}
          />
        </Modal>
      </Stack>
    </ScrollView>
  )
}
