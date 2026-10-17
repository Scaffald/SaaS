import { ROUTES } from '@scf/core/constants/routes'
import { computeQueueMetrics } from '@scf/core/features/background-check/check-sla'
import { useVerificationQueue } from '@scf/core/utils/office-communities-sdk-hooks'
import { useViolationReports } from '@scf/core/utils/legal-agreements-sdk-hooks'
import { useNotificationDeliveries } from '@scf/core/utils/notifications-admin-sdk-hooks'
import { useAdminChecks } from '@scf/core/utils/background-checks-sdk-hooks'
import { useIdVerificationList } from '@scf/core/utils/id-verification-sdk-hooks'
import { useUserRoles } from '@scf/core/utils/auth/useUserRoles'
import {
  H3,
  MetricBlock,
  MetricRow,
  ScreenHeader,
  Separator,
  Stack,
  Row,
  Text,
  useThemeContext,
} from '@scaffald/ui'
import { colors } from '@scaffald/ui/tokens'
import { ChevronRight } from 'lucide-react-native'
import { useRouter } from 'expo-router'
import { useMemo } from 'react'
import { Pressable } from 'react-native'
import {
  type BoundedCount,
  boundedCount,
  countPendingIdVerifications,
  formatBoundedCount,
} from './office-overview-counts'

/** Rows fetched to count failed deliveries. One over the cap — see `boundedCount`. */
const FAILED_DELIVERY_CAP = 50
/** The admin checks endpoint's own maximum page. */
const CHECKS_CAP = 200
/** The ID verification list's own maximum page. */
const ID_VERIFICATIONS_CAP = 200

/**
 * What the Office opens on (#839).
 *
 * `/office` opened straight into the notification delivery queue — an
 * operations table — with the storage dashboard and a list of developer links
 * below it. Nothing on the page said how much was waiting for an
 * administrator, and the queues that do need a person were each somewhere
 * else entirely.
 *
 * The counts first, then what needs a decision, then the consoles.
 *
 * Screening is part of that (#1170). The page read only community
 * verification, violation reports and failed deliveries, so with six
 * background checks open and every one of them over SLA on /office/ats/admin,
 * it said "Nothing is waiting on an administrator right now."
 */
export function OfficeOverview() {
  const { theme } = useThemeContext()
  const t = theme === 'dark' ? 'dark' : 'light'
  const router = useRouter()
  const { hasRole, isLoading: isLoadingRoles } = useUserRoles()
  // The checks queue is the background-check admin's. Someone without the role
  // is turned away at /office/ats/admin, so it is not their queue to be shown.
  const isCheckAdmin = hasRole('background_check_admin')

  const verificationQuery = useVerificationQueue({ limit: 1 })
  const violationsQuery = useViolationReports(undefined, { staleTime: 30_000 })
  const deliveriesQuery = useNotificationDeliveries({
    status: 'failed',
    limit: FAILED_DELIVERY_CAP + 1,
  })
  // Unfiltered, like the admin page's own queue strip: open and over-SLA are
  // properties of the whole queue, not of one status.
  const checksQuery = useAdminChecks(
    { limit: CHECKS_CAP },
    { enabled: isCheckAdmin, staleTime: 30_000 }
  )
  // Only `active` rows can still be waiting; expired and revoked are finished.
  const idVerificationsQuery = useIdVerificationList({
    limit: ID_VERIFICATIONS_CAP,
    offset: 0,
    status: 'active',
  })

  const pendingVerifications = verificationQuery.data?.total ?? null

  const openViolations = useMemo(() => {
    const reports = violationsQuery.data?.items
    if (!Array.isArray(reports)) return null
    // Anything not yet resolved or dismissed is still somebody's decision.
    return reports.filter((report) => report.status !== 'resolved' && report.status !== 'dismissed')
      .length
  }, [violationsQuery.data])

  // There is no count endpoint for deliveries, so this is honest about the
  // list it was read from: "50+" rather than a number that stops at 50.
  const failedDeliveries = useMemo(
    () => boundedCount(deliveriesQuery.data, FAILED_DELIVERY_CAP),
    [deliveriesQuery.data]
  )

  const checks = useMemo(() => {
    const rows = checksQuery.data
    if (!Array.isArray(rows)) return null
    const queue = computeQueueMetrics(rows)
    // A full page means there may be open cases beyond it.
    const overflow = rows.length >= CHECKS_CAP
    return {
      open: { value: queue.openCount, overflow } satisfies BoundedCount,
      overSla: { value: queue.overSlaCount, overflow } satisfies BoundedCount,
    }
  }, [checksQuery.data])

  const pendingIds = useMemo((): BoundedCount | null => {
    const data = idVerificationsQuery.data
    if (!data) return null
    return { value: countPendingIdVerifications(data.items), overflow: data.hasMore }
  }, [idVerificationsQuery.data])

  const queues: Array<{
    key: string
    label: string
    hint: string
    count: BoundedCount | null
    route: string
  }> = [
    ...(isCheckAdmin
      ? [
          {
            key: 'background-checks',
            label: 'Background checks',
            hint:
              checks && checks.overSla.value > 0
                ? `Open cases. ${formatBoundedCount(checks.overSla)} over SLA and need chasing.`
                : 'Open cases waiting on a processor.',
            count: checks?.open ?? null,
            route: ROUTES.OFFICE.ATS.CHECKS.ADMIN.path,
          },
        ]
      : []),
    {
      key: 'id-verifications',
      label: 'ID verifications',
      hint: 'Paid identity checks with no result yet.',
      count: pendingIds,
      route: ROUTES.OFFICE.ATS.ID_VERIFICATIONS.path,
    },
    {
      key: 'verification',
      label: 'Community verification',
      hint: 'People waiting to be let into a trade community.',
      count: pendingVerifications == null ? null : { value: pendingVerifications, overflow: false },
      route: ROUTES.OFFICE.COMMUNITIES.VERIFICATION.path,
    },
    {
      key: 'violations',
      label: 'Violation reports',
      hint: 'Reports raised against a posting or a person.',
      count: openViolations == null ? null : { value: openViolations, overflow: false },
      route: ROUTES.OFFICE.VIOLATIONS.path,
    },
    {
      key: 'deliveries',
      label: 'Failed notifications',
      hint: 'Messages the platform could not deliver.',
      count: failedDeliveries,
      route: ROUTES.OFFICE.path,
    },
  ]

  const waiting = queues.filter((queue) => (queue.count?.value ?? 0) > 0)
  // "Nothing is waiting" is a claim about every queue. While any count is still
  // unknown — loading, failed, or roles not resolved — it cannot be made.
  const everyQueueKnown = !isLoadingRoles && queues.every((queue) => queue.count != null)
  const anyQueueFailed = [
    verificationQuery,
    violationsQuery,
    deliveriesQuery,
    idVerificationsQuery,
    ...(isCheckAdmin ? [checksQuery] : []),
  ].some((query) => query.isError)

  return (
    <Stack gap={24}>
      <ScreenHeader
        kicker="Administration"
        title="Office"
        tip="What is waiting on someone here, and the consoles behind it."
      />

      {/*
        Counts the page can already answer. Rendered as a band rather than
        tiles so it reads the same as the employer's own numbers.
      */}
      <MetricRow bordered minColumnWidth={150}>
        {isCheckAdmin ? (
          <MetricBlock
            label="Background checks open"
            value={formatBoundedCount(checks?.open ?? null)}
            delta={
              checks && checks.overSla.value > 0
                ? `${formatBoundedCount(checks.overSla)} over SLA`
                : undefined
            }
            tone={checks && checks.overSla.value > 0 ? 'attention' : 'neutral'}
            emphasis={(checks?.overSla.value ?? 0) > 0}
          />
        ) : null}
        <MetricBlock
          label="ID verifications pending"
          value={formatBoundedCount(pendingIds)}
          emphasis={(pendingIds?.value ?? 0) > 0}
        />
        <MetricBlock
          label="Awaiting verification"
          value={formatCount(pendingVerifications)}
          emphasis={(pendingVerifications ?? 0) > 0}
        />
        <MetricBlock
          label="Open violation reports"
          value={formatCount(openViolations)}
          tone="attention"
          emphasis={(openViolations ?? 0) > 0}
        />
        <MetricBlock
          label="Failed notifications"
          value={formatBoundedCount(failedDeliveries)}
          tone="attention"
          emphasis={(failedDeliveries?.value ?? 0) > 0}
        />
      </MetricRow>

      <Separator />

      <Stack gap={12}>
        <H3>Needs a decision</H3>
        {waiting.length > 0 ? (
          <Stack gap={0}>
            {waiting.map((queue) => (
              <Pressable key={queue.key} onPress={() => router.push(queue.route)}>
                <Row
                  gap={12}
                  align="center"
                  paddingVertical={12}
                  style={{
                    borderBottomWidth: 1,
                    borderBottomColor: colors.border[t].default,
                  }}
                >
                  <Stack gap={2} style={{ flex: 1, minWidth: 0 }}>
                    <Text style={{ color: colors.text[t].primary }}>{queue.label}</Text>
                    <Text style={{ color: colors.text[t].tertiary }}>{queue.hint}</Text>
                  </Stack>
                  <Text style={{ color: colors.text[t].attention }}>
                    {formatBoundedCount(queue.count)}
                  </Text>
                  <ChevronRight size={16} color={colors.icon[t].muted} />
                </Row>
              </Pressable>
            ))}
          </Stack>
        ) : null}
        {anyQueueFailed ? (
          <Text style={{ color: colors.text[t].secondary }}>
            Some queues could not be counted, so this list may be incomplete.
          </Text>
        ) : waiting.length === 0 && everyQueueKnown ? (
          <Text style={{ color: colors.text[t].secondary }}>
            Nothing is waiting on an administrator right now.
          </Text>
        ) : waiting.length === 0 ? (
          <Text style={{ color: colors.text[t].tertiary }}>Counting…</Text>
        ) : null}
      </Stack>
    </Stack>
  )
}

/** A count we do not have yet is a dash, not a zero — those are different claims. */
function formatCount(value: number | null): string {
  return value == null ? '—' : String(value)
}
