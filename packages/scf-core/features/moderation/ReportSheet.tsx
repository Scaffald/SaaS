/**
 * The single report affordance, used everywhere something can be reported.
 *
 * One component rather than a per-surface dialog, because the thing a user is
 * doing is identical on a post, a message, and a profile — and because a store
 * reviewer looking for "can I report this?" should find the same answer in
 * every place they look (#690).
 */

import { useCallback, useState } from 'react'
import { Pressable, View } from 'react-native'
import { Button, Row, Sheet, Stack, Text, TextArea, useThemeContext, useToast } from '@scaffald/ui'
import { colors } from '@scaffald/ui/tokens'
import { Check } from 'lucide-react-native'
import {
  isAlreadyReported,
  useBlockUserMutation,
  useReportMutation,
} from '@scf/core/utils/moderation-sdk-hooks'
import type {
  ReportReason,
  ReportSubjectType,
} from '@scaffald/sdk/resources/moderation'

/**
 * Deliberately short. A longer list produces worse reports, not better ones:
 * people pick the first plausible row and stop reading, and `details` carries
 * the specifics anyway.
 */
const REASONS: Array<{ value: ReportReason; label: string }> = [
  { value: 'harassment', label: 'Harassment or bullying' },
  { value: 'spam', label: 'Spam' },
  { value: 'scam_or_fraud', label: 'Scam or fraud' },
  { value: 'hate_speech', label: 'Hate speech' },
  { value: 'sexual_content', label: 'Sexual content' },
  { value: 'violence_or_threats', label: 'Violence or threats' },
  { value: 'off_platform_solicitation', label: 'Asked me to go off Scaffald' },
  { value: 'other', label: 'Something else' },
]

export interface ReportSheetProps {
  visible: boolean
  onClose: () => void
  subjectType: ReportSubjectType
  subjectId: string
  /** Shown in the confirmation, and the person blocked if they choose to. */
  reportedUserId?: string | null
  reportedUserName?: string | null
}

export function ReportSheet({
  visible,
  onClose,
  subjectType,
  subjectId,
  reportedUserId,
  reportedUserName,
}: ReportSheetProps) {
  const { theme } = useThemeContext()
  const toast = useToast()
  const [reason, setReason] = useState<ReportReason | null>(null)
  const [details, setDetails] = useState('')
  const [sent, setSent] = useState(false)

  const reportMutation = useReportMutation()
  const blockMutation = useBlockUserMutation()

  const reset = useCallback(() => {
    setReason(null)
    setDetails('')
    setSent(false)
  }, [])

  const close = useCallback(() => {
    reset()
    onClose()
  }, [reset, onClose])

  // 'other' with nothing written is an empty report — it tells a moderator
  // nothing and cannot be actioned. The API rejects it; the button is disabled
  // so nobody discovers that by being refused.
  const canSubmit =
    reason !== null && (reason !== 'other' || details.trim().length > 0)

  const submit = useCallback(() => {
    if (!reason) return
    reportMutation.mutate(
      { subjectType, subjectId, reason, details: details.trim() || undefined },
      {
        onSuccess: () => setSent(true),
        onError: (error) => {
          // Already reported is the outcome they wanted, not a failure.
          if (isAlreadyReported(error)) {
            setSent(true)
            return
          }
          toast.show({
            title: "Couldn't send that report",
            message: error.message || 'Please try again.',
            variant: 'error',
          })
        },
      }
    )
  }, [reason, details, subjectType, subjectId, reportMutation, toast])

  const block = useCallback(() => {
    if (!reportedUserId) return
    blockMutation.mutate(reportedUserId, {
      onSuccess: () => {
        toast.show({
          title: reportedUserName ? `${reportedUserName} blocked` : 'Blocked',
          message: "You won't see each other's messages or posts.",
          variant: 'success',
        })
        close()
      },
      onError: (error) =>
        toast.show({
          title: "Couldn't block",
          message: error.message || 'Please try again.',
          variant: 'error',
        }),
    })
  }, [reportedUserId, reportedUserName, blockMutation, toast, close])

  const muted = { color: colors.text[theme].secondary }

  return (
    <Sheet visible={visible} onClose={close} height="auto">
      <Stack gap={16} padding={20}>
        {sent ? (
          // Deliberately does not promise a timeline we cannot keep, and does
          // not say the content was removed — a moderator has not looked yet.
          <Stack gap={12}>
            <Row gap={8} align="center">
              <Check size={20} color={colors.text[theme].primary} />
              <Text style={{ fontSize: 17, fontWeight: '600' }}>Report sent</Text>
            </Row>
            <Text style={muted}>
              Our moderation team will review this. Thanks for telling us.
            </Text>

            {reportedUserId ? (
              <Stack gap={8} style={{ marginTop: 4 }}>
                <Text style={muted}>
                  You can also stop {reportedUserName || 'this person'} reaching you.
                  Blocking works both ways and you can undo it in Settings.
                </Text>
                <Button
                  variant="outline"
                  onPress={block}
                  disabled={blockMutation.isPending}
                  accessibilityLabel={`Block ${reportedUserName || 'this person'}`}
                >
                  {blockMutation.isPending ? 'Blocking…' : 'Block them too'}
                </Button>
              </Stack>
            ) : null}

            <Button variant="text" onPress={close}>
              Done
            </Button>
          </Stack>
        ) : (
          <Stack gap={16}>
            <Stack gap={4}>
              <Text style={{ fontSize: 17, fontWeight: '600' }}>
                Report {subjectType === 'user' ? 'this person' : 'this content'}
              </Text>
              <Text style={muted}>What's wrong with it?</Text>
            </Stack>

            <Stack gap={2} accessibilityRole="radiogroup">
              {REASONS.map((r) => {
                const selected = reason === r.value
                return (
                  <Pressable
                    key={r.value}
                    onPress={() => setReason(r.value)}
                    accessibilityRole="radio"
                    accessibilityState={{ selected }}
                    accessibilityLabel={r.label}
                    style={{
                      paddingVertical: 12,
                      paddingHorizontal: 12,
                      borderRadius: 10,
                      backgroundColor: selected
                        ? colors.bg[theme].emphasis
                        : 'transparent',
                    }}
                  >
                    <Row justify="space-between" align="center" gap={12}>
                      <Text style={{ fontSize: 15 }}>{r.label}</Text>
                      {selected ? (
                        <Check size={18} color={colors.text[theme].primary} />
                      ) : (
                        <View />
                      )}
                    </Row>
                  </Pressable>
                )
              })}
            </Stack>

            {reason === 'other' ? (
              <TextArea
                value={details}
                onChangeText={setDetails}
                placeholder="Tell us what happened"
                accessibilityLabel="What happened"
                numberOfLines={3}
                maxLength={2000}
              />
            ) : null}

            <Row gap={8}>
              <Button variant="text" onPress={close} style={{ flex: 1 }}>
                Cancel
              </Button>
              <Button
                onPress={submit}
                disabled={!canSubmit || reportMutation.isPending}
                style={{ flex: 1 }}
                accessibilityLabel="Send report"
              >
                {reportMutation.isPending ? 'Sending…' : 'Send report'}
              </Button>
            </Row>
          </Stack>
        )}
      </Stack>
    </Sheet>
  )
}
