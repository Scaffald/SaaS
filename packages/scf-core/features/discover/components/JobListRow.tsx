import { useRouter } from 'expo-router'
import { Pressable, View } from 'react-native'
import { Button, Row, Stack, Text, useResponsive, useThemeContext } from '@scaffald/ui'
import { colors } from '@scaffald/ui/tokens'
import { ROUTES, buildPath } from '@scf/core/constants/routes'
import { formatRelativeDate } from '@scf/core/utils/relative-date'
import { StatusBadge } from '@scf/core/components/ui/StatusBadge'
import { type RequirementInputs, rowRequirementsSummary } from '../job-requirements'
import { type ExternalJob, formatCompensation } from './ExternalJobCard'
import {
  type InternalJob,
  formatEmploymentType,
  formatPayRange,
  formatRemoteOption,
} from './InternalJobCard'
import { SaveJobButton } from './SaveJobButton'

type JobListRowProps =
  | {
      kind: 'internal'
      job: InternalJob
      /** The viewer has *submitted* an application to this posting. */
      hasApplied?: boolean
      /** The viewer's application to it, submitted or still a draft. */
      applicationId?: string | null
      /**
       * The viewer's own record, for "N of M met" (#1180). Undefined when
       * signed out or still loading — the row then shows no score at all.
       */
      profile?: RequirementInputs['profile']
      signedIn?: boolean
    }
  | { kind: 'external'; job: ExternalJob; signedIn?: boolean }

/**
 * One job as a hairline-ruled row: the prototype's job list (#1035).
 *
 * The browse screen drew every posting as a boxed glass card with an icon on
 * each fact, so a page of results was a stack of boxes and the eye had to
 * hunt for the pay. A row reads like a listing: title and type, then one line
 * of facts (employer · place · pay · posted), and the action at the right.
 * The cards remain, behind the toolbar's List/Cards switch.
 *
 * The right-hand cluster is the prototype's: how many of the posting's
 * requirements the viewer's profile meets, over a thin meter, then the one
 * action that moves them forward — Apply, Continue, or Open (#1180). The
 * score counts only what `job-requirements.ts` can honestly answer, the same
 * rule the detail screen uses, so a row with nothing checkable shows no meter
 * rather than "0 of 0". Employer response rates still have no source (#632)
 * and are not drawn.
 */
export function JobListRow(props: JobListRowProps) {
  const router = useRouter()
  const { theme } = useThemeContext()
  const { isMobile } = useResponsive()
  const t = theme === 'dark' ? 'dark' : 'light'
  const signedIn = !!props.signedIn

  const detailPath = buildPath(ROUTES.JOBS.DETAIL, { id: props.job.id })
  const applyPath = buildPath(ROUTES.JOBS.DETAIL.APPLY, { id: props.job.id })
  const inquiryPath =
    props.kind === 'internal' && props.hasApplied && props.applicationId
      ? buildPath(ROUTES.JOBS.APPLICATIONS.INQUIRY, { applicationId: props.applicationId })
      : null

  let title: string
  let type: string
  let employer: { name: string; id?: string } | null
  let facts: Array<string | null | undefined>
  if (props.kind === 'internal') {
    const { job } = props
    title = job.title
    type = formatEmploymentType(job.employment_type)
    employer = job.organization?.name
      ? { name: job.organization.name, id: job.organization.id }
      : null
    facts = [
      job.location,
      formatRemoteOption(job.remote_option),
      formatPayRange(job.pay_range_min_cents, job.pay_range_max_cents, job.pay_range_type),
      formatRelativeDate(job.posted_at || job.created_at),
    ]
  } else {
    const { job } = props
    title = job.title
    type = job.job_type ?? ''
    employer = job.company_name ? { name: job.company_name } : null
    facts = [
      job.job_location,
      formatCompensation(job),
      job.posted_date ? formatRelativeDate(job.posted_date) : null,
    ]
  }
  const factLine = facts.filter((fact): fact is string => !!fact).join(' · ')
  const applied = props.kind === 'internal' && props.hasApplied
  const drafted = props.kind === 'internal' && !applied && !!props.applicationId

  const summary =
    props.kind === 'internal' ? rowRequirementsSummary(props.job, props.profile) : null

  // The one action per row. Internal postings apply here — the apply route is
  // protected, so a signed-out visitor goes straight to sign-in rather than
  // through a redirect. Outside listings apply on the host's site, which the
  // detail screen links to.
  let action: { label: string; path: string }
  if (props.kind === 'external') {
    action = { label: 'View', path: detailPath }
  } else if (applied) {
    action = { label: 'Open', path: inquiryPath ?? detailPath }
  } else if (drafted) {
    action = { label: 'Continue', path: applyPath }
  } else {
    action = { label: 'Apply', path: signedIn ? applyPath : ROUTES.AUTH.LOGIN.path }
  }

  // The employer leads the fact line and, for a Scaffald posting, links to
  // the employer's page (#1181). /employers/<id> is a signed-in screen, so a
  // visitor on the public listing gets the name as plain text.
  const employerLinked = !!employer?.id && signedIn
  const employerColor = t === 'dark' ? colors.primary[300] : colors.primary[600]

  const meter = summary ? (
    <Stack
      gap={6}
      style={{ width: isMobile ? undefined : 140, flex: isMobile ? 1 : undefined }}
      accessible
      accessibilityLabel={`${summary.met} of ${summary.checkable} requirements met`}
    >
      <Text size="sm" style={{ color: colors.text[t].secondary }}>
        {summary.met} of {summary.checkable} met
      </Text>
      <View
        style={{
          height: 3,
          borderRadius: 2,
          backgroundColor: colors.border[t].default,
          overflow: 'hidden',
        }}
      >
        <View
          style={{
            height: 3,
            width: `${Math.round((summary.met / summary.checkable) * 100)}%`,
            backgroundColor: colors.text[t].emphasis,
          }}
        />
      </View>
    </Stack>
  ) : null

  const cluster = (
    <Row gap={12} align="center" style={isMobile ? { alignSelf: 'stretch' } : undefined}>
      {meter}
      {isMobile && !meter ? <View style={{ flex: 1 }} /> : null}
      <Button
        size="sm"
        variant="outline"
        onPress={() => router.push(action.path as never)}
        accessibilityLabel={`${action.label} — ${title}`}
        // One width for Apply / Continue / Open, so the meters line up down
        // the list whatever each row's action says.
        style={{ minWidth: 88 }}
      >
        {action.label}
      </Button>
      {props.kind === 'internal' ? (
        <View>
          <SaveJobButton jobId={props.job.id} size={18} />
        </View>
      ) : null}
    </Row>
  )

  const body = (
    <Stack gap={6} style={{ flex: isMobile ? undefined : 1, minWidth: 0 }}>
      {/* The title opens the posting; the employer name is its own link, so
          the two are siblings rather than one link nested in another. */}
      <Pressable
        onPress={() => router.push(detailPath as never)}
        accessibilityRole="link"
        accessibilityLabel={`View ${title}`}
      >
        <Row gap={8} align="center" wrap>
          <Text style={{ color: colors.text[t].primary, fontWeight: '600' }}>{title}</Text>
          {type ? <StatusBadge>{type}</StatusBadge> : null}
          {applied ? <StatusBadge variant="success">Applied</StatusBadge> : null}
          {props.kind === 'external' ? <StatusBadge>External</StatusBadge> : null}
        </Row>
      </Pressable>
      {employer || factLine ? (
        <Text style={{ color: colors.text[t].secondary }}>
          {employer ? (
            employerLinked && employer.id ? (
              <Text
                accessibilityRole="link"
                onPress={() =>
                  router.push(
                    buildPath(ROUTES.EMPLOYERS.DETAIL, { id: employer.id as string }) as never
                  )
                }
                style={{ color: employerColor, textDecorationLine: 'underline' }}
              >
                {employer.name}
              </Text>
            ) : (
              employer.name
            )
          ) : null}
          {employer && factLine ? ' · ' : null}
          {factLine}
        </Text>
      ) : null}
    </Stack>
  )

  return isMobile ? (
    <Stack
      gap={12}
      paddingVertical={16}
      testID="job-card"
      style={{ borderBottomWidth: 1, borderBottomColor: colors.border[t].default }}
    >
      {body}
      {cluster}
    </Stack>
  ) : (
    <Row
      gap={16}
      align="center"
      paddingVertical={16}
      testID="job-card"
      style={{ borderBottomWidth: 1, borderBottomColor: colors.border[t].default }}
    >
      {body}
      {cluster}
    </Row>
  )
}
