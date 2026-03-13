/**
 * ReviewImpactSummary - Shows the impact of a submitted review on the subject's skills.
 * Displayed after a review is successfully submitted, showing category-level deltas
 * and triggering a skill snapshot.
 */

import {
  Card,
  Text,
  Row,
  Stack,
  Button,
  Spinner,
  useThemeContext,
} from '@scaffald/ui'
import { DeltaBadge, RadarChart } from '@scaffald/ui/chart'
import { colors } from '@scaffald/ui/tokens'
import { CheckCircle2 } from 'lucide-react-native'
import { useEffect, useMemo, useRef } from 'react'
import {
  useLatestSnapshot,
  useCreateSnapshotMutation,
} from '../../../utils/skill-analytics-sdk-hooks'

const CATEGORY_LABELS: Record<string, string> = {
  reliability: 'Reliability',
  collaboration: 'Collaboration',
  professionalism: 'Professionalism',
  technical: 'Technical',
}

interface ReviewImpactSummaryProps {
  subjectId: string
  subjectName: string
  reviewId: string
  onDismiss: () => void
}

export function ReviewImpactSummary({
  subjectId,
  subjectName,
  reviewId,
  onDismiss,
}: ReviewImpactSummaryProps) {
  const { theme } = useThemeContext()
  const { data: snapshot, isLoading: snapshotLoading } = useLatestSnapshot(subjectId)
  const createSnapshotMutation = useCreateSnapshotMutation()

  // Trigger a skill snapshot once on mount after review submission
  const hasTriggered = useRef(false)
  useEffect(() => {
    if (hasTriggered.current) return
    hasTriggered.current = true
    createSnapshotMutation.mutate({
      userId: subjectId,
      triggerType: 'review_received',
      triggerId: reviewId,
    })
  }, [createSnapshotMutation, subjectId, reviewId])

  const categories = Object.keys(CATEGORY_LABELS)

  const radarAxes = useMemo(() => {
    if (!snapshot?.snapshotData?.soft_skills?.categories) return []
    return categories.map((cat) => ({
      label: CATEGORY_LABELS[cat],
      value: snapshot.snapshotData.soft_skills.categories[cat]?.average ?? 0,
      maxValue: 5,
    }))
  }, [snapshot, categories])

  const previousOverall = snapshot?.summary?.previous_overall ?? null
  const currentOverall =
    snapshot?.snapshotData?.soft_skills?.overall_average ?? null

  if (snapshotLoading) {
    return (
      <Card elevate bordered>
        <Stack gap={16} padding="lg" align="center" paddingVertical={40}>
          <Spinner size="lg" color="primary" />
          <Text style={{ color: colors.text[theme].secondary, fontSize: 14 }}>
            Calculating review impact...
          </Text>
        </Stack>
      </Card>
    )
  }

  return (
    <Card elevate bordered>
      <Stack gap={20} padding="lg">
        {/* Success header */}
        <Row gap={10} align="center">
          <CheckCircle2 size={24} color={colors.green[500]} />
          <Stack gap={2}>
            <Text
              style={{
                fontSize: 16,
                fontWeight: '700',
                color: colors.text[theme].primary,
              }}
            >
              Review Submitted
            </Text>
            <Text
              style={{
                fontSize: 13,
                color: colors.text[theme].secondary,
              }}
            >
              Your review of {subjectName} has been recorded.
            </Text>
          </Stack>
        </Row>

        {/* Radar chart showing current state */}
        {radarAxes.length >= 3 && (
          <Stack align="center" paddingVertical={8}>
            <RadarChart
              axes={radarAxes}
              size="sm"
              showLabels
              showValues
            />
          </Stack>
        )}

        {/* Category deltas */}
        {snapshot?.summary && previousOverall !== null && currentOverall !== null && (
          <Stack gap={8}>
            <Text
              style={{
                fontSize: 13,
                fontWeight: '600',
                color: colors.text[theme].primary,
              }}
            >
              Impact Summary
            </Text>

            <Row
              gap={8}
              align="center"
              style={{
                paddingVertical: 8,
                paddingHorizontal: 12,
                backgroundColor: colors.bg[theme].subtle,
                borderRadius: 6,
              }}
            >
              <Text
                style={{
                  flex: 1,
                  fontSize: 13,
                  color: colors.text[theme].primary,
                }}
              >
                Overall Average
              </Text>
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: '600',
                  color: colors.text[theme].primary,
                }}
              >
                {currentOverall.toFixed(1)}
              </Text>
              <DeltaBadge
                current={currentOverall}
                previous={previousOverall}
                format="absolute"
                size="sm"
              />
            </Row>

            {categories.map((cat) => {
              const current =
                snapshot?.snapshotData?.soft_skills?.categories?.[cat]?.average ?? 0
              const previous =
                (snapshot?.summary as unknown as Record<string, number>)?.[`previous_${cat}`] ?? current
              return (
                <Row
                  key={cat}
                  gap={8}
                  align="center"
                  style={{
                    paddingVertical: 6,
                    paddingHorizontal: 12,
                  }}
                >
                  <Text
                    style={{
                      flex: 1,
                      fontSize: 13,
                      color: colors.text[theme].secondary,
                    }}
                  >
                    {CATEGORY_LABELS[cat]}
                  </Text>
                  <Text
                    style={{
                      fontSize: 13,
                      fontWeight: '600',
                      color: colors.text[theme].primary,
                    }}
                  >
                    {current.toFixed(1)}
                  </Text>
                  <DeltaBadge current={current} previous={previous} format="absolute" size="sm" />
                </Row>
              )
            })}
          </Stack>
        )}

        {/* Dismiss */}
        <Button variant="outline" onPress={onDismiss}>
          Done
        </Button>
      </Stack>
    </Card>
  )
}
