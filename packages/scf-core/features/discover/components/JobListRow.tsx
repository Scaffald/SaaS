import { useRouter } from 'expo-router'
import { Pressable, View } from 'react-native'
import { Button, Row, Stack, Text, useResponsive, useThemeContext } from '@scaffald/ui'
import { colors } from '@scaffald/ui/tokens'
import { ROUTES, buildPath } from '@scf/core/constants/routes'
import { formatRelativeDate } from '@scf/core/utils/relative-date'
import { StatusBadge } from '@scf/core/components/ui/StatusBadge'
import { type ExternalJob, formatCompensation } from './ExternalJobCard'
import {
  type InternalJob,
  formatEmploymentType,
  formatPayRange,
  formatRemoteOption,
} from './InternalJobCard'
import { SaveJobButton } from './SaveJobButton'

type JobListRowProps =
  | { kind: 'internal'; job: InternalJob; hasApplied?: boolean; applicationId?: string | null }
  | { kind: 'external'; job: ExternalJob }

/**
 * One job as a hairline-ruled row: the prototype's job list (#1035).
 *
 * The browse screen drew every posting as a boxed glass card with an icon on
 * each fact, so a page of results was a stack of boxes and the eye had to
 * hunt for the pay. A row reads like a listing: title and type, then one line
 * of facts (employer · place · pay · posted), and the action at the right.
 * The cards remain, behind the toolbar's List/Cards switch.
 *
 * Only facts the posting carries are shown. The prototype's "5 of 7 met" and
 * employer response rates have no source yet, so they are not drawn.
 */
export function JobListRow(props: JobListRowProps) {
  const router = useRouter()
  const { theme } = useThemeContext()
  const { isMobile } = useResponsive()
  const t = theme === 'dark' ? 'dark' : 'light'

  const detailPath = buildPath(ROUTES.JOBS.DETAIL, { id: props.job.id })
  const inquiryPath =
    props.kind === 'internal' && props.hasApplied && props.applicationId
      ? buildPath(ROUTES.JOBS.APPLICATIONS.INQUIRY, { applicationId: props.applicationId })
      : null

  let title: string
  let type: string
  let facts: Array<string | null | undefined>
  if (props.kind === 'internal') {
    const { job } = props
    title = job.title
    type = formatEmploymentType(job.employment_type)
    facts = [
      job.organization?.name,
      job.location,
      formatRemoteOption(job.remote_option),
      formatPayRange(job.pay_range_min_cents, job.pay_range_max_cents, job.pay_range_type),
      formatRelativeDate(job.posted_at || job.created_at),
    ]
  } else {
    const { job } = props
    title = job.title
    type = job.job_type ?? ''
    facts = [
      job.company_name,
      job.job_location,
      formatCompensation(job),
      job.posted_date ? formatRelativeDate(job.posted_date) : null,
    ]
  }
  const factLine = facts.filter((fact): fact is string => !!fact).join(' · ')
  const applied = props.kind === 'internal' && props.hasApplied

  return (
    <Row
      gap={16}
      align="center"
      paddingVertical={16}
      testID="job-card"
      style={{ borderBottomWidth: 1, borderBottomColor: colors.border[t].default }}
    >
      <Pressable
        onPress={() => router.push((inquiryPath ?? detailPath) as never)}
        accessibilityRole="link"
        accessibilityLabel={`View ${title}`}
        style={{ flex: 1, minWidth: 0 }}
      >
        <Stack gap={6}>
          <Row gap={8} align="center" wrap>
            <Text style={{ color: colors.text[t].primary, fontWeight: '600' }}>{title}</Text>
            {type ? <StatusBadge>{type}</StatusBadge> : null}
            {applied ? <StatusBadge variant="success">Applied</StatusBadge> : null}
            {props.kind === 'external' ? <StatusBadge>External</StatusBadge> : null}
          </Row>
          {factLine ? (
            <Text style={{ color: colors.text[t].secondary }}>{factLine}</Text>
          ) : null}
        </Stack>
      </Pressable>

      <Row gap={8} align="center">
        {isMobile ? null : (
          <Button
            size="sm"
            variant="outline"
            onPress={() => router.push((inquiryPath ?? detailPath) as never)}
          >
            {applied ? 'Open' : 'View'}
          </Button>
        )}
        {props.kind === 'internal' ? (
          <View>
            <SaveJobButton jobId={props.job.id} size={18} />
          </View>
        ) : null}
      </Row>
    </Row>
  )
}
