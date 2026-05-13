import { useState } from 'react'
import { Text, Stack, Row, Separator, Spinner, Button, Input, useThemeContext } from '@scaffald/ui'
import { colors } from '@scaffald/ui/tokens'
import { useQueryClient } from '@tanstack/react-query'
import {
  useScaffoldScore,
  useReputationHistory,
  useGiftKarmaMutation,
} from '@scf/core/utils/communities-sdk-hooks'
import { ScaffoldScoreBadge } from './components/ScaffoldScoreBadge'
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
      {/* Score Overview */}
      <Stack gap={8}>
        <Text style={{ fontSize: 24, fontWeight: '700' }}>Scaffold Score</Text>
        <Text style={{ color: colors.text[t].secondary }}>
          Your reputation in the Scaffold community. Earn points by contributing quality content.
        </Text>
      </Stack>

      {score && (
        <Row gap={24} style={{ flexWrap: 'wrap' }}>
          <Stack align="center" gap={4}>
            <ScaffoldScoreBadge score={score.score} size={80} />
            <Text style={{ fontWeight: '600' }}>Score</Text>
          </Stack>
          <Stack gap={4}>
            <Row gap={8}>
              <Text style={{ color: colors.text[t].secondary }}>Karma Bank:</Text>
              <Text style={{ fontWeight: '600' }}>{score.karma_bank}</Text>
            </Row>
            <Row gap={8}>
              <Text style={{ color: colors.text[t].secondary }}>Total Earned:</Text>
              <Text style={{ fontWeight: '600' }}>{score.total_earned}</Text>
            </Row>
            <Row gap={8}>
              <Text style={{ color: colors.text[t].secondary }}>Total Spent:</Text>
              <Text style={{ fontWeight: '600' }}>{score.total_spent}</Text>
            </Row>
          </Stack>
        </Row>
      )}

      <Separator />

      {/* Gift Karma */}
      <Stack
        gap={16}
        style={{
          padding: 20,
          borderWidth: 1,
          borderColor: colors.border[t].default,
          borderRadius: 16,
          backgroundColor: colors.bg[t].default,
        }}
      >
        <Stack gap={4}>
          <Text style={{ fontSize: 18, fontWeight: '700', color: colors.text[t].primary }}>
            Gift Karma
          </Text>
          <Text style={{ fontSize: 14, color: colors.text[t].secondary }}>
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
        <Text style={{ fontSize: 18, fontWeight: '600' }}>History ({historyData?.total ?? 0})</Text>
        {isHistoryLoading ? (
          <Stack align="center" style={{ paddingVertical: 24 }}>
            <Spinner variant="ios" />
          </Stack>
        ) : events.length === 0 ? (
          <Text style={{ color: colors.text[t].secondary }}>No reputation events yet.</Text>
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
                    <Text style={{ fontSize: 14 }}>
                      {event.reason || event.action.replace(/_/g, ' ')}
                    </Text>
                    <Text style={{ color: colors.text[t].secondary, fontSize: 12 }}>
                      {new Date(event.created_at).toLocaleDateString()}
                    </Text>
                  </Stack>
                  <Text
                    style={{
                      fontWeight: '700',
                      color: event.delta > 0
                        ? (t === 'dark' ? colors.green[300] : colors.green[600])
                        : (t === 'dark' ? colors.error[300] : colors.error[600]),
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
