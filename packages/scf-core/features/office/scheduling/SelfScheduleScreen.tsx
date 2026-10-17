/**
 * Self-Schedule Screen
 *
 * Public-facing view where candidates can select an available interview slot.
 * Accessed via a self-scheduling link token.
 *
 * @see Issue #88 - Candidate Self-Scheduling
 */

import { useState, useMemo } from 'react'
import { useRouter } from 'expo-router'
import { ROUTES } from '@scf/core/constants/routes'
import {
  Button,
  Card,
  EmptyState,
  ScreenHeader,
  Separator,
  Spinner,
  Text,
  Row,
  Stack,
  useThemeContext,
} from '@scaffald/ui'
import { useBookSlotMutation, useSchedulingLink } from '@scf/core/utils/scheduling-sdk-hooks'
import { borderRadius, colors, fontSize } from '@scaffald/ui/tokens'
import { Calendar, Check, Clock, MapPin, Phone, Video } from 'lucide-react-native'
import { ScrollView } from 'react-native'
import { Pressable } from 'react-native'

// ============================================================================
// Types
// ============================================================================

interface AvailableSlot {
  id: string
  slot_start: string
  slot_end: string
  location_type: 'video' | 'phone' | 'in_person'
  location_details?: string
  meeting_link?: string
}

// ============================================================================
// Sub-Components
// ============================================================================

function LocationBadge({ type }: { type: AvailableSlot['location_type'] }) {
  const iconMap = { video: Video, phone: Phone, in_person: MapPin }
  const labelMap = { video: 'Video Call', phone: 'Phone Call', in_person: 'In Person' }
  const Icon = iconMap[type]
  return (
    <Row gap={4} align="center">
      <Icon size={12} color={colors.gray[500]} />
      <Text style={{ color: colors.gray[500], fontSize: fontSize.sm }}>{labelMap[type]}</Text>
    </Row>
  )
}

function SlotCard({
  slot,
  isSelected,
  onSelect,
}: {
  slot: AvailableSlot
  isSelected: boolean
  onSelect: () => void
}) {
  const { theme } = useThemeContext()
  const start = new Date(slot.slot_start)
  const end = new Date(slot.slot_end)
  const durationMin = Math.round((end.getTime() - start.getTime()) / 60000)

  return (
    <Pressable onPress={onSelect}>
      <Row
        gap={12}
        align="center"
        padding="md"
        style={{
          backgroundColor: isSelected ? colors.bg[theme].selected : colors.bg[theme].subtle,
          borderRadius: borderRadius.l,
          borderWidth: isSelected ? 2 : 1,
          borderColor: isSelected ? colors.border[theme].active : colors.border[theme].default,
        }}
      >
        <Stack style={{ width: 56, alignItems: 'center' }}>
          <Text style={{ color: colors.text[theme].tertiary, fontSize: fontSize.xxs }}>
            {start.toLocaleDateString('en-US', { weekday: 'short' })}
          </Text>
          <Text
            style={{ color: colors.text[theme].primary, fontWeight: '700', fontSize: fontSize.md }}
          >
            {start.getDate()}
          </Text>
          <Text style={{ color: colors.text[theme].tertiary, fontSize: fontSize.xxs }}>
            {start.toLocaleDateString('en-US', { month: 'short' })}
          </Text>
        </Stack>
        <Separator orientation="vertical" />
        <Stack style={{ flex: 1 }} gap={4}>
          <Text
            style={{ color: colors.text[theme].primary, fontWeight: '600', fontSize: fontSize.md }}
          >
            {start.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })} –{' '}
            {end.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
          </Text>
          <Row gap={8} align="center">
            <Row gap={4} align="center">
              <Clock size={12} color={colors.text[theme].tertiary} />
              <Text style={{ color: colors.text[theme].tertiary, fontSize: fontSize.sm }}>
                {durationMin} min
              </Text>
            </Row>
            <LocationBadge type={slot.location_type} />
          </Row>
          {slot.location_details && (
            <Text style={{ color: colors.text[theme].tertiary, fontSize: fontSize.sm }}>
              {slot.location_details}
            </Text>
          )}
        </Stack>
        {isSelected && (
          <Stack
            style={{
              width: 28,
              height: 28,
              borderRadius: borderRadius.max,
              backgroundColor: colors.fg[theme].success,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Check size={16} color={colors.text[theme].quaternary} />
          </Stack>
        )}
      </Row>
    </Pressable>
  )
}

// ============================================================================
// Main Component
// ============================================================================

export interface SelfScheduleScreenProps {
  /** Scheduling link token. Slots are fetched and booked against it. */
  token?: string
}

/**
 * Without a token there is no link, so there are no times to show.
 *
 * This used to fall back to hardcoded slots dated March 2026 under "Apex
 * Construction LLC — Senior Electrician", and the Office's ATS tab rendered
 * exactly that as a live candidate page an admin could not tell was fake
 * (#1169, the same failure #1024 fixed for Integrations). The candidate page
 * is reached at /schedule/:token; the Office tab now says so and points at the
 * screen where links are made.
 */
function NoSchedulingLink() {
  const router = useRouter()
  return (
    <Stack gap={16}>
      <ScreenHeader
        kicker="ATS"
        title="Self-scheduling"
        tip="The page a candidate opens from a scheduling link to book an interview time."
      />
      <EmptyState
        icon={Calendar}
        title="No scheduling link to show"
        description="Candidates pick an interview time from a link you send them. This page has no link, so there are no real times to preview. Create links and see their bookings under Scheduling."
        action={{
          label: 'Go to scheduling',
          onPress: () => router.push(ROUTES.OFFICE.ATS.SCHEDULING.path as never),
        }}
      />
    </Stack>
  )
}

export function SelfScheduleScreen({ token }: SelfScheduleScreenProps = {}) {
  const { theme } = useThemeContext()
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null)
  const [isBooked, setIsBooked] = useState(false)

  const live = !!token
  const linkQuery = useSchedulingLink(token, { enabled: live })
  const book = useBookSlotMutation(token ?? '')

  const orgName = linkQuery.data?.organizationName ?? 'the employer'
  const jobTitle = linkQuery.data?.jobTitle ?? 'this position'
  const slots: AvailableSlot[] = useMemo(
    () =>
      (linkQuery.data?.slots ?? []).map((s) => ({
        id: s.id,
        slot_start: s.slot_start,
        slot_end: s.slot_end,
        location_type: s.location_type,
        location_details: s.location_details ?? undefined,
        meeting_link: s.meeting_link ?? undefined,
      })),
    [linkQuery.data]
  )

  // Group slots by date
  const slotsByDate = useMemo(() => {
    const groups: Record<string, AvailableSlot[]> = {}
    for (const slot of slots) {
      const dateKey = new Date(slot.slot_start).toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
      })
      if (!groups[dateKey]) groups[dateKey] = []
      groups[dateKey].push(slot)
    }
    return groups
  }, [slots])

  const handleConfirm = () => {
    if (!selectedSlotId) return
    book.mutate(selectedSlotId, { onSuccess: () => setIsBooked(true) })
  }

  if (!live) return <NoSchedulingLink />

  if (linkQuery.isLoading) {
    return (
      <Stack align="center" justify="center" gap={12} style={{ paddingVertical: 64 }}>
        <Spinner size="lg" />
        <Text style={{ color: colors.text[theme].secondary }}>Loading available times…</Text>
      </Stack>
    )
  }

  if (linkQuery.isError) {
    return (
      <Stack align="center" gap={6} style={{ padding: 32 }}>
        <Text weight="semibold" style={{ color: colors.text[theme].primary, textAlign: 'center' }}>
          This scheduling link isn't available
        </Text>
        <Text size="sm" style={{ color: colors.text[theme].secondary, textAlign: 'center' }}>
          {linkQuery.error?.message || 'It may have expired or already been used.'}
        </Text>
      </Stack>
    )
  }

  if (isBooked) {
    const bookedSlot = slots.find((s) => s.id === selectedSlotId)
    return (
      <ScrollView showsVerticalScrollIndicator={false}>
        <Stack gap={24} align="center" style={{ paddingVertical: 60, paddingHorizontal: 20 }}>
          <Stack
            style={{
              width: 64,
              height: 64,
              borderRadius: borderRadius.max,
              backgroundColor: `${colors.success[500]}20`,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Check size={32} color={colors.success[500]} />
          </Stack>
          <Stack gap={8} align="center">
            <Text
              style={{
                color: colors.text[theme].primary,
                fontSize: fontSize.xl,
                fontWeight: '700',
              }}
            >
              Interview Booked!
            </Text>
            <Text
              style={{
                color: colors.text[theme].secondary,
                fontSize: fontSize.md,
                textAlign: 'center',
              }}
            >
              Your interview with {orgName} has been scheduled.
            </Text>
          </Stack>
          {bookedSlot && (
            <Card variant="glass" padding="lg" style={{ width: '100%', maxWidth: 400 }}>
              <Stack gap={12} align="center">
                <Row gap={8} align="center">
                  <Calendar size={18} color={colors.icon[theme].default} />
                  <Text style={{ color: colors.text[theme].primary, fontWeight: '600' }}>
                    {new Date(bookedSlot.slot_start).toLocaleDateString('en-US', {
                      weekday: 'long',
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </Text>
                </Row>
                <Row gap={8} align="center">
                  <Clock size={18} color={colors.icon[theme].default} />
                  <Text style={{ color: colors.text[theme].primary }}>
                    {new Date(bookedSlot.slot_start).toLocaleTimeString('en-US', {
                      hour: 'numeric',
                      minute: '2-digit',
                    })}{' '}
                    –{' '}
                    {new Date(bookedSlot.slot_end).toLocaleTimeString('en-US', {
                      hour: 'numeric',
                      minute: '2-digit',
                    })}
                  </Text>
                </Row>
                <LocationBadge type={bookedSlot.location_type} />
              </Stack>
            </Card>
          )}
          {/* This said a calendar invite had been emailed and offered an "Add
              to Calendar" button with an empty onPress. Booking writes the
              booking and nothing else — no invite is sent — so neither claim
              stays (#1169). */}
        </Stack>
      </ScrollView>
    )
  }

  return (
    <ScrollView showsVerticalScrollIndicator={false}>
      <Stack
        gap={24}
        style={{
          paddingVertical: 20,
          paddingHorizontal: 20,
          maxWidth: 600,
          alignSelf: 'center',
          width: '100%',
        }}
      >
        {/* Header */}
        <Stack gap={8} align="center">
          <Text
            style={{ color: colors.text[theme].primary, fontSize: fontSize.xl, fontWeight: '700' }}
          >
            Schedule Your Interview
          </Text>
          <Text
            style={{
              color: colors.text[theme].secondary,
              fontSize: fontSize.md,
              textAlign: 'center',
            }}
          >
            {orgName} — {jobTitle}
          </Text>
          <Text
            style={{
              color: colors.text[theme].tertiary,
              fontSize: fontSize.md,
              textAlign: 'center',
            }}
          >
            Select a time that works best for you
          </Text>
        </Stack>

        {slots.length === 0 ? (
          <Stack align="center" gap={6} style={{ paddingVertical: 32 }}>
            <Text size="sm" style={{ color: colors.text[theme].secondary, textAlign: 'center' }}>
              No interview times are available yet. Check back soon.
            </Text>
          </Stack>
        ) : null}

        {/* Slot Groups */}
        {Object.entries(slotsByDate).map(([date, slots]) => (
          <Stack key={date} gap={8}>
            <Text
              style={{
                color: colors.text[theme].secondary,
                fontWeight: '600',
                fontSize: fontSize.md,
              }}
            >
              {date}
            </Text>
            <Stack gap={6}>
              {slots.map((slot) => (
                <SlotCard
                  key={slot.id}
                  slot={slot}
                  isSelected={selectedSlotId === slot.id}
                  onSelect={() => setSelectedSlotId(slot.id)}
                />
              ))}
            </Stack>
          </Stack>
        ))}

        {/* Confirm Button */}
        {slots.length > 0 ? (
          <Button
            variant="filled"
            color="primary"
            size="lg"
            disabled={!selectedSlotId || book.isPending}
            onPress={handleConfirm}
          >
            {book.isPending
              ? 'Confirming…'
              : selectedSlotId
                ? 'Confirm Selection'
                : 'Select a Time Slot'}
          </Button>
        ) : null}

        <Text
          style={{ color: colors.text[theme].tertiary, fontSize: fontSize.sm, textAlign: 'center' }}
        >
          All times shown in your local timezone
        </Text>
      </Stack>
    </ScrollView>
  )
}
