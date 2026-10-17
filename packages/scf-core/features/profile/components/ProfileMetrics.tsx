import { MetricBlock, MetricRow, Text, useThemeContext } from '@scaffald/ui'
import { colors, fontSize, fontWeight, lineHeight } from '@scaffald/ui/tokens'
import { useUserScaffoldScore } from '@scf/core/utils/communities-sdk-hooks'
import { useViewAnalytics } from '@scf/core/utils/profile-views-sdk-hooks'
import { useCertificationsWidget, useSkillsWidget } from '@scf/core/utils/profile-widgets-sdk-hooks'

/**
 * The profile's figures, under the identity block (#1034).
 *
 * The prototype's row is score · profile views · proven skills · endorsements.
 * The Scaffald score is the community reputation figure the app already shows
 * on /communities and the public profile (useUserScaffoldScore), so it leads
 * here too (#1188). There is no endorsement count yet, so that one is not
 * drawn. The rest come from queries the page's own widgets already make:
 * views from profile analytics, verified skills out of those listed, and
 * certifications on record.
 */
export function ProfileMetrics({ userId }: { userId?: string }) {
  const { theme } = useThemeContext()
  const t = theme === 'dark' ? 'dark' : 'light'
  const { data: scoreResponse } = useUserScaffoldScore(userId)
  const { data: analytics } = useViewAnalytics()
  const { data: skills } = useSkillsWidget({ userId })
  const { data: certifications } = useCertificationsWidget({ userId })

  const score = scoreResponse?.data?.score
  const listed = skills?.length ?? 0
  const verified = skills?.filter((skill) => skill.verified).length ?? 0
  const trend = analytics?.trend

  return (
    <MetricRow bordered>
      {score != null ? (
        <MetricBlock
          label="Scaffald score"
          // The accent figure, as in the prototype. MetricBlock has no accent
          // tone, so the value keeps its figure type and takes the emphasis
          // colour, which the tokens define as "the figure in a metric block".
          value={
            <Text
              style={{
                fontSize: fontSize.h2,
                lineHeight: lineHeight.h2,
                fontWeight: fontWeight.semibold,
                fontVariant: ['tabular-nums'],
                color: colors.text[t].emphasis,
              }}
            >
              {String(score)}
            </Text>
          }
          delta="Community reputation"
        />
      ) : null}
      <MetricBlock
        label="Profile views"
        value={String(analytics?.views30d ?? 0)}
        delta={
          trend != null && trend !== 0
            ? `${trend > 0 ? '▲' : '▼'} ${Math.abs(trend)}% this month`
            : 'Last 30 days'
        }
        tone={trend != null && trend !== 0 ? (trend > 0 ? 'positive' : 'attention') : 'neutral'}
      />
      <MetricBlock
        label="Verified skills"
        value={String(verified)}
        delta={listed > 0 ? `of ${listed} listed` : 'None listed yet'}
      />
      <MetricBlock
        label="Certifications"
        value={String(certifications?.length ?? 0)}
        delta="On record"
      />
    </MetricRow>
  )
}
