/**
 * Self-Schedule Screen
 *
 * Public-facing view where candidates can select an available interview slot.
 * Accessed via a self-scheduling link token.
 *
 * @see Issue #88 - Candidate Self-Scheduling
 */

import { useState, useMemo } from 'react'
import {
  Button,
  Card,
  Separator,
  Text,
  Row,
  Stack,
  useThemeContext,
} from '@scaffald/ui'
import { colors } from '@scaffald/ui/tokens'
import {
  Calendar,
  Check,
  Clock,
  MapPin,
  Phone,
  Video,
} from 'lucide-react-native'
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
// Mock Data
// ============================================================================

const MOCK_AVAILABLE_SLOTS: AvailableSlot[] = [
  { id: '1', slot_start: '2026-03-12T10:00:00Z', slot_end: '2026-03-12T10:30:00Z', location_type: 'video', meeting_link: 'https://meet.google.com/abc' },
  { id: '2', slot_start: '2026-03-12T14:00:00Z', slot_end: '2026-03-12T14:45:00Z', location_type: 'video', meeting_link: 'https://meet.google.com/def' },
  { id: '3', slot_start: '2026-03-13T09:00:00Z', slot_end: '2026-03-13T09:30:00Z', location_type: 'phone' },
  { id: '4', slot_start: '2026-03-13T11:00:00Z', slot_end: '2026-03-13T12:00:00Z', location_type: 'in_person', location_details: '123 Main St, Suite 200' },
  { id: '5', slot_start: '2026-03-14T10:00:00Z', slot_end: '2026-03-14T10:30:00Z', location_type: 'video', meeting_link: 'https://meet.google.com/ghi' },
  { id: '6', slot_start: '2026-03-14T15:00:00Z', slot_end: '2026-03-14T15:45:00Z', location_type: 'video', meeting_link: 'https://meet.google.com/jkl' },
]

const MOCK_ORG_NAME = 'Apex Construction LLC'
const MOCK_JOB_TITLE = 'Senior Electrician'

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
      <Text style={{ color: colors.gray[500], fontSize: 12 }}>{labelMap[type]}</Text>
    </Row>
  )
}

function SlotCard({ slot, isSelected, onSelect }: { slot: AvailableSlot; isSelected: boolean; onSelect: () => void }) {
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
          borderRadius: 10,
          borderWidth: isSelected ? 2 : 1,
          borderColor: isSelected ? colors.border[theme].active : colors.border[theme].default,
        }}
      >
        <Stack style={{ width: 56, alignItems: 'center' }}>
          <Text style={{ color: colors.text[theme].tertiary, fontSize: 11 }}>
            {start.toLocaleDateString('en-US', { weekday: 'short' })}
          </Text>
          <Text style={{ color: colors.text[theme].primary, fontWeight: '700', fontSize: 16 }}>
            {start.getDate()}
          </Text>
          <Text style={{ color: colors.text[theme].tertiary, fontSize: 11 }}>
            {start.toLocaleDateString('en-US', { month: 'short' })}
          </Text>
        </Stack>
        <Separator orientation="vertical" />
        <Stack style={{ flex: 1 }} gap={4}>
          <Text style={{ color: colors.text[theme].primary, fontWeight: '600', fontSize: 15 }}>
            {start.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })} –{' '}
            {end.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
          </Text>
          <Row gap={8} align="center">
            <Row gap={4} align="center">
              <Clock size={12} color={colors.text[theme].tertiary} />
              <Text style={{ color: colors.text[theme].tertiary, fontSize: 12 }}>{durationMin} min</Text>
            </Row>
            <LocationBadge type={slot.location_type} />
          </Row>
          {slot.location_details && (
            <Text style={{ color: colors.text[theme].tertiary, fontSize: 12 }}>{slot.location_details}</Text>
          )}
        </Stack>
        {isSelected && (
          <Stack style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: colors.fg[theme].success, alignItems: 'center', justifyContent: 'center' }}>
            <Check size={16} color="#fff" />
          </Stack>
        )}
      </Row>
    </Pressable>
  )
}

// ============================================================================
// Main Component
// ============================================================================

export function SelfScheduleScreen() {
  const { theme } = useThemeContext()
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null)
  const [isBooked, setIsBooked] = useState(false)

  // Group slots by date
  const slotsByDate = useMemo(() => {
    const groups: Record<string, AvailableSlot[]> = {}
    for (const slot of MOCK_AVAILABLE_SLOTS) {
      const dateKey = new Date(slot.slot_start).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
      if (!groups[dateKey]) groups[dateKey] = []
      groups[dateKey].push(slot)
    }
    return groups
  }, [])

  if (isBooked) {
    const bookedSlot = MOCK_AVAILABLE_SLOTS.find((s) => s.id === selectedSlotId)
    return (
      <ScrollView showsVerticalScrollIndicator={false}>
        <Stack gap={24} align="center" style={{ paddingVertical: 60, paddingHorizontal: 20 }}>
          <Stack style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: `${colors.success[500]}20`, alignItems: 'center', justifyContent: 'center' }}>
            <Check size={32} color={colors.success[500]} />
          </Stack>
          <Stack gap={8} align="center">
            <Text style={{ color: colors.text[theme].primary, fontSize: 22, fontWeight: '700' }}>
              Interview Booked!
            </Text>
            <Text style={{ color: colors.text[theme].secondary, fontSize: 15, textAlign: 'center' }}>
              Your interview with {MOCK_ORG_NAME} has been scheduled.
            </Text>
          </Stack>
          {bookedSlot && (
            <Card variant="glass" padding="lg" style={{ width: '100%', maxWidth: 400 }}>
              <Stack gap={12} align="center">
                <Row gap={8} align="center">
                  <Calendar size={18} color={colors.icon[theme].default} />
                  <Text style={{ color: colors.text[theme].primary, fontWeight: '600' }}>
                    {new Date(bookedSlot.slot_start).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                  </Text>
                </Row>
                <Row gap={8} align="center">
                  <Clock size={18} color={colors.icon[theme].default} />
                  <Text style={{ color: colors.text[theme].primary }}>
                    {new Date(bookedSlot.slot_start).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })} –{' '}
                    {new Date(bookedSlot.slot_end).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                  </Text>
                </Row>
                <LocationBadge type={bookedSlot.location_type} />
              </Stack>
            </Card>
          )}
          <Text style={{ color: colors.text[theme].tertiary, fontSize: 13, textAlign: 'center' }}>
            A calendar invite has been sent to your email. You can also add it to your calendar below.
          </Text>
          <Button variant="outline" iconStart={Calendar} onPress={() => {}}>
            Add to Calendar
          </Button>
        </Stack>
      </ScrollView>
    )
  }

  return (
    <ScrollView showsVerticalScrollIndicator={false}>
      <Stack gap={24} style={{ paddingVertical: 20, paddingHorizontal: 20, maxWidth: 600, alignSelf: 'center', width: '100%' }}>
        {/* Header */}
        <Stack gap={8} align="center">
          <Text style={{ color: colors.text[theme].primary, fontSize: 24, fontWeight: '700' }}>
            Schedule Your Interview
          </Text>
          <Text style={{ color: colors.text[theme].secondary, fontSize: 15, textAlign: 'center' }}>
            {MOCK_ORG_NAME} — {MOCK_JOB_TITLE}
          </Text>
          <Text style={{ color: colors.text[theme].tertiary, fontSize: 14, textAlign: 'center' }}>
            Select a time that works best for you
          </Text>
        </Stack>

        {/* Slot Groups */}
        {Object.entries(slotsByDate).map(([date, slots]) => (
          <Stack key={date} gap={8}>
            <Text style={{ color: colors.text[theme].secondary, fontWeight: '600', fontSize: 14 }}>{date}</Text>
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
        <Button
          variant="filled"
          color="primary"
          size="lg"
          disabled={!selectedSlotId}
          onPress={() => setIsBooked(true)}
        >
          {selectedSlotId ? 'Confirm Selection' : 'Select a Time Slot'}
        </Button>

        <Text style={{ color: colors.text[theme].tertiary, fontSize: 12, textAlign: 'center' }}>
          All times shown in your local timezone
        </Text>
      </Stack>
    </ScrollView>
  )
}
