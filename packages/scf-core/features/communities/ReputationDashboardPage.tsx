import { useState } from 'react'
import {
  Text,
  Stack,
  Row,
  Separator,
  Spinner,
  Button,
  Input,
  H4,
  MetricBlock,
  MetricRow,
  useThemeContext,
} from '@scaffald/ui'
import { colors } from '@scaffald/ui/tokens'
import { useQueryClient } from '@tanstack/react-query'
import {
  useScaffoldScore,
  useReputationHistory,
  useGiftKarmaMutation,
} from '@scf/core/utils/communities-sdk-hooks'
import { MemberPicker } from './components/MemberPicker'
import type { CommunityMember } from '@scaffald/sdk/resources/communities'

export function ReputationDashboardPage() {
  const { theme } = useThemeContext()
  const t = theme === 'dark' ? 'dark' : 'light'

  const queryClient = useQueryClient()
  const { data: scoreData, isLoading: isScoreLoading } = useScaffoldScore()
  const { data: historyData, isLoading: isHistoryLoading } = useReputationHistory({ limit: 50 })

  const score = scoreData?.data
  const events = historyData?.data ?? []

  // Karma gifting state
  const [giftReceiver, setGiftReceiver] = useState<CommunityMember | null>(null)
  const [giftAmount, setGiftAmount] = useState('')
  const [giftMessage, setGiftMessage] = useState('')

  const giftKarma = useGiftKarmaMutation({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['communities', 'reputation'] })
      setGiftReceiver(null)
      setGiftAmount('')
      setGiftMessage('')
    },
  })

  if (isScoreLoading) {
    return (
      <Stack align="center" justify="center" style={{ minHeight: 200 }}>
        <Spinner variant="ios" size="lg" />
      </Stack>
    )
  }

  return (
    <Stack gap={24}>
      {/* The shell's ScreenHeader carries the title and the explainer, so the
          page opens on the figures rather than a second hand-sized heading
          and label/value rows (#1176). */}
      {score && (
        <MetricRow bordered minColumnWidth={140}>
          <MetricBlock label="Scaffald score" value={score.score} />
          <MetricBlock label="Karma bank" value={score.karma_bank} />
          <MetricBlock label="Earned" value={score.total_earned} />
          <MetricBlock label="Spent" value={score.total_spent} />
        </MetricRow>
      )}

      <Separator />

      {/* Gift Karma */}
      <Stack
        gap={16}
        style={{
          padding: 20,
          borderWidth: 1,
          borderColor: colors.border[t].default,
          borderRadius: 7,
          backgroundColor: colors.bg[t].default,
        }}
      >
        <Stack gap={4}>
          <H4>Gift karma</H4>
          <Text size="sm" color="secondary">
            Send karma to community members who helped you. Max 10 per gift, 5 gifts per day.
          </Text>
        </Stack>
        <MemberPicker
          selected={giftReceiver}
          onSelect={setGiftReceiver}
          disabled={giftKarma.isPending}
        />
        <Row gap={8} style={{ flexWrap: 'wrap' }}>
          <Input
            placeholder="Amount (1-10)"
            value={giftAmount}
            onChangeText={setGiftAmount}
            keyboardType="numeric"
            style={{ flex: 1, minWidth: 120 }}
          />
        </Row>
        <Input placeholder="Optional message" value={giftMessage} onChangeText={setGiftMessage} />
        <Row justify="flex-end">
          <Button
            variant="filled"
            color="primary"
            size="md"
            onPress={() => {
              if (!giftReceiver) return
              giftKarma.mutate({
                receiver_id: giftReceiver.id,
                amount: parseInt(giftAmount, 10) || 1,
                message: giftMessage || undefined,
              })
            }}
            disabled={!giftReceiver || !giftAmount || giftKarma.isPending}
          >
            Send Karma
          </Button>
        </Row>
      </Stack>

      <Separator />

      {/* Reputation History */}
      <Stack gap={12}>
        <H4>History ({historyData?.total ?? 0})</H4>
        {isHistoryLoading ? (
          <Stack align="center" style={{ paddingVertical: 24 }}>
            <Spinner variant="ios" />
          </Stack>
        ) : events.length === 0 ? (
          <Text color="secondary">No reputation events yet.</Text>
        ) : (
          <Stack gap={4}>
            {events.map(
              (event: {
                id: string
                reason?: string | null
                action: string
                created_at: string
                delta: number
              }) => (
                <Row
                  key={event.id}
                  align="center"
                  justify="space-between"
                  style={{
                    paddingVertical: 8,
                    paddingHorizontal: 12,
                    borderBottomWidth: 1,
                    borderBottomColor: colors.border[t].default,
                  }}
                >
                  <Stack style={{ flex: 1 }} gap={2}>
                    <Text size="sm">{event.reason || event.action.replace(/_/g, ' ')}</Text>
                    <Text size="xs" color="secondary">
                      {new Date(event.created_at).toLocaleDateString()}
                    </Text>
                  </Stack>
                  <Text
                    weight="bold"
                    style={{
                      color:
                        event.delta > 0
                          ? t === 'dark'
                            ? colors.green[300]
                            : colors.green[600]
                          : t === 'dark'
                            ? colors.error[300]
                            : colors.error[600],
                    }}
                  >
                    {event.delta > 0 ? '+' : ''}
                    {event.delta}
                  </Text>
                </Row>
              )
            )}
          </Stack>
        )}
      </Stack>
    </Stack>
  )
}
