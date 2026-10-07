import { MetricBlock, MetricRow } from '@scaffald/ui'
import { useViewAnalytics } from '@scf/core/utils/profile-views-sdk-hooks'
import {
  useCertificationsWidget,
  useSkillsWidget,
} from '@scf/core/utils/profile-widgets-sdk-hooks'

/**
 * The profile's figures, under the identity block (#1034).
 *
 * The prototype's row is score · profile views · proven skills · endorsements.
 * Only some of those exist yet. There is no Scaffald score aggregate (#632) or
 * endorsement count, so neither is drawn. What is drawn comes from queries the
 * page's own widgets already make: views from profile analytics, verified
 * skills out of those listed, and certifications on record.
 */
export function ProfileMetrics({ userId }: { userId?: string }) {
  const { data: analytics } = useViewAnalytics()
  const { data: skills } = useSkillsWidget({ userId })
  const { data: certifications } = useCertificationsWidget({ userId })

  const listed = skills?.length ?? 0
  const verified = skills?.filter((skill) => skill.verified).length ?? 0
  const trend = analytics?.trend

  return (
    <MetricRow bordered>
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
