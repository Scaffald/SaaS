import { ROUTES } from '@scf/core/constants/routes'
import {
  CHECK_QUEUE_CAP,
  computeBoundedQueueMetrics,
} from '@scf/core/features/background-check/check-sla'
import { useVerificationQueue } from '@scf/core/utils/office-communities-sdk-hooks'
import { useViolationReports } from '@scf/core/utils/legal-agreements-sdk-hooks'
import { useNotificationDeliveries } from '@scf/core/utils/notifications-admin-sdk-hooks'
import { useAdminChecks } from '@scf/core/utils/background-checks-sdk-hooks'
import { useIdVerificationList } from '@scf/core/utils/id-verification-sdk-hooks'
import { useOfficeListUsers } from '@scf/core/utils/office-users-sdk-hooks'
import { useOfficeOrganizationsList } from '@scf/core/utils/office-organizations-sdk-hooks'
import { usePublishedJobs } from '@scf/core/utils/jobs-sdk-hooks'
import { useUserRoles } from '@scf/core/utils/auth/useUserRoles'
import {
  Card,
  Grid,
  H3,
  MetricBlock,
  MetricRow,
  ScreenHeader,
  Stack,
  Row,
  Text,
  TextLink,
  useThemeContext,
} from '@scaffald/ui'
import { colors, fontSize } from '@scaffald/ui/tokens'
import { ChevronRight } from 'lucide-react-native'
import { useRouter } from 'expo-router'
import { type ReactNode, useMemo } from 'react'
import { Pressable } from 'react-native'
import {
  type BoundedCount,
  boundedCount,
  countOpenReports,
  countPendingIdVerifications,
  formatBoundedCount,
  sumBoundedCounts,
} from './office-overview-counts'
import { openReportRows, type PreviewRow, screeningPreviewRows } from './office-overview-preview'

/** Rows fetched to count failed deliveries. One over the cap — see `boundedCount`. */
const FAILED_DELIVERY_CAP = 50
/** The ID verification list's own maximum page. */
const ID_VERIFICATIONS_CAP = 200
/** Items each preview card shows before "View all". */
const PREVIEW_ROWS = 4

/**
 * What the Office opens on: the platform at a glance, then what is waiting on
 * an administrator (#839, #1170, #1201).
 *
 * It used to stack the whole Notification operations console and the Storage
 * dashboard (also /office/storage) under three queue figures, several screens
 * of consoles at 390. The prototype's admin Overview is a header, a band of
 * figures, and two cards — the screening queue and open reports — each with
 * "View all". The consoles are a list of links underneath; notifications has
 * its own route now.
 *
 * Every figure is a real count. Totals come from endpoints that return an
 * exact count; queues read off a capped list say so ("200+"); anything not
 * loaded yet is a dash, never a zero.
 */
export function OfficeOverview() {
  const { theme } = useThemeContext()
  const t = theme === 'dark' ? 'dark' : 'light'
  const router = useRouter()
  const { hasRole, isLoading: isLoadingRoles } = useUserRoles()
  // The checks queue is the background-check admin's. Someone without the role
  // is turned away at /office/ats/admin, so it is not their queue to be shown.
  const isCheckAdmin = hasRole('background_check_admin')

  // Platform totals. Each endpoint returns an exact `count`, not a page length.
  // Users is every account — the list Content Management → Workers shows, and
  // the same query, so the two agree. Live postings is the public board: open
  // and not confidential.
  const usersQuery = useOfficeListUsers()
  const organizationsQuery = useOfficeOrganizationsList({ limit: 1, offset: 0 })
  const postingsQuery = usePublishedJobs({ limit: 1 })

  const verificationQuery = useVerificationQueue({ limit: PREVIEW_ROWS })
  const violationsQuery = useViolationReports(undefined, { staleTime: 30_000 })
  const deliveriesQuery = useNotificationDeliveries({
    status: 'failed',
    limit: FAILED_DELIVERY_CAP + 1,
  })
  // Unfiltered, like the admin page's own queue strip: open and over-SLA are
  // properties of the whole queue, not of one status.
  const checksQuery = useAdminChecks(
    { limit: CHECK_QUEUE_CAP },
    { enabled: isCheckAdmin, staleTime: 30_000 }
  )
  // Only `active` rows can still be waiting; expired and revoked are finished.
  const idVerificationsQuery = useIdVerificationList({
    limit: ID_VERIFICATIONS_CAP,
    offset: 0,
    status: 'active',
  })

  const workers = usersQuery.data ? usersQuery.data.total : null
  const employers = organizationsQuery.data ? organizationsQuery.data.total : null
  const livePostings = postingsQuery.data ? postingsQuery.data.total : null

  const pendingVerifications: BoundedCount | null =
    verificationQuery.data == null ? null : { value: verificationQuery.data.total, overflow: false }

  const openReports = useMemo(() => countOpenReports(violationsQuery.data), [violationsQuery.data])

  // There is no count endpoint for deliveries, so this is honest about the
  // list it was read from: "50+" rather than a number that stops at 50.
  const failedDeliveries = useMemo(
    () => boundedCount(deliveriesQuery.data, FAILED_DELIVERY_CAP),
    [deliveriesQuery.data]
  )

  const checks = useMemo(() => {
    const rows = checksQuery.data
    if (!Array.isArray(rows)) return null
    // The same count as the admin page's queue strip, so the two agree (#1248).
    const queue = computeBoundedQueueMetrics(rows, CHECK_QUEUE_CAP)
    return {
      open: queue.openCount satisfies BoundedCount,
      overSla: queue.overSlaCount satisfies BoundedCount,
    }
  }, [checksQuery.data])

  const pendingIds = useMemo((): BoundedCount | null => {
    const data = idVerificationsQuery.data
    if (!data) return null
    return { value: countPendingIdVerifications(data.items), overflow: data.hasMore }
  }, [idVerificationsQuery.data])

  // The screening queue is everything waiting on a screening decision: open
  // background checks (for whoever works them), ID checks with no result, and
  // trade licences waiting on community verification.
  const screeningQueue = useMemo(
    () =>
      isLoadingRoles
        ? null
        : sumBoundedCounts([
            ...(isCheckAdmin ? [checks?.open ?? null] : []),
            pendingIds,
            pendingVerifications,
          ]),
    [isLoadingRoles, isCheckAdmin, checks, pendingIds, pendingVerifications]
  )
  const overSla = checks && checks.overSla.value > 0 ? checks.overSla : null

  const screeningRows = useMemo(
    () =>
      screeningPreviewRows(
        isCheckAdmin ? (checksQuery.data ?? []) : [],
        verificationQuery.data?.data ?? [],
        PREVIEW_ROWS
      ),
    [isCheckAdmin, checksQuery.data, verificationQuery.data]
  )
  const reportRows = useMemo(
    () => openReportRows(violationsQuery.data?.items ?? [], PREVIEW_ROWS),
    [violationsQuery.data]
  )

  const screeningLoading =
    isLoadingRoles || verificationQuery.isLoading || (isCheckAdmin && checksQuery.isLoading)
  const screeningFailed = verificationQuery.isError || (isCheckAdmin && checksQuery.isError)

  // A check admin's queue starts at the review queue; anyone else's at the
  // community verification queue, the one they can act on.
  const screeningHref = isCheckAdmin
    ? ROUTES.OFFICE.ATS.CHECKS.ADMIN.path
    : ROUTES.OFFICE.COMMUNITIES.VERIFICATION.path

  return (
    <Stack gap={24}>
      <ScreenHeader
        kicker="Administration"
        title="Overview"
        tip="The platform at a glance, and what is waiting on an administrator."
      />

      <MetricRow bordered minColumnWidth={150}>
        <MetricBlock label="Workers" value={formatCount(workers)} />
        <MetricBlock label="Employers" value={formatCount(employers)} />
        <MetricBlock label="Live postings" value={formatCount(livePostings)} />
        <MetricBlock
          label="Screening queue"
          value={formatBoundedCount(screeningQueue)}
          delta={overSla ? `${formatBoundedCount(overSla)} over SLA` : undefined}
          tone={overSla ? 'attention' : 'neutral'}
          emphasis={(screeningQueue?.value ?? 0) > 0}
        />
        <MetricBlock
          label="Open reports"
          value={formatBoundedCount(openReports)}
          tone="attention"
          emphasis={(openReports?.value ?? 0) > 0}
        />
      </MetricRow>

      <Grid columns={{ base: 1, lg: 2 }} gap={16} rowGap={16}>
        <PreviewCard
          title="Screening queue"
          viewAllLabel="View all screening"
          onViewAll={() => router.push(screeningHref)}
          rows={screeningRows}
          loading={screeningLoading}
          failed={screeningFailed}
          empty={
            (pendingIds?.value ?? 0) > 0
              ? 'Nothing else is waiting.'
              : 'No one is waiting on screening.'
          }
          footer={
            (pendingIds?.value ?? 0) > 0 ? (
              <TextLink onPress={() => router.push(ROUTES.OFFICE.ATS.ID_VERIFICATIONS.path)}>
                {`${formatBoundedCount(pendingIds)} ID ${
                  pendingIds?.value === 1 && !pendingIds.overflow ? 'check' : 'checks'
                } with no result yet`}
              </TextLink>
            ) : null
          }
          onRowPress={(row) => router.push(row.route)}
        />
        <PreviewCard
          title="Open reports"
          viewAllLabel="View all reports"
          onViewAll={() => router.push(ROUTES.OFFICE.VIOLATIONS.path)}
          rows={reportRows}
          loading={violationsQuery.isLoading}
          failed={violationsQuery.isError}
          empty="No reports are open."
          onRowPress={(row) => router.push(row.route)}
        />
      </Grid>

      <Stack gap={4}>
        <H3>Consoles</H3>
        <ConsoleLink
          t={t}
          label="Notification operations"
          hint={
            (failedDeliveries?.value ?? 0) > 0
              ? `${formatBoundedCount(failedDeliveries)} failed deliveries, plus system alerts and the digest backlog.`
              : 'Delivery queue, system alerts and the digest backlog.'
          }
          attention={(failedDeliveries?.value ?? 0) > 0}
          onPress={() =>
            router.push(
              (failedDeliveries?.value ?? 0) > 0
                ? { pathname: ROUTES.OFFICE.NOTIFICATIONS.path, params: { status: 'failed' } }
                : ROUTES.OFFICE.NOTIFICATIONS.path
            )
          }
        />
        <ConsoleLink
          t={t}
          label="Storage analytics"
          hint="How workers use storage across work logs, portfolios and certifications."
          onPress={() => router.push(ROUTES.OFFICE.STORAGE.path)}
        />
      </Stack>
    </Stack>
  )
}

/** One console in the list under the cards. */
function ConsoleLink({
  label,
  hint,
  attention = false,
  onPress,
  t,
}: {
  t: 'light' | 'dark'
  label: string
  hint: string
  attention?: boolean
  onPress: () => void
}) {
  return (
    <Pressable onPress={onPress} accessibilityRole="link" accessibilityLabel={label}>
      <Row
        gap={12}
        align="center"
        paddingVertical={12}
        style={{ borderBottomWidth: 1, borderBottomColor: colors.border[t].default }}
      >
        <Stack gap={2} style={{ flex: 1, minWidth: 0 }}>
          <Text style={{ color: colors.text[t].primary }}>{label}</Text>
          <Text style={{ color: attention ? colors.text[t].attention : colors.text[t].tertiary }}>
            {hint}
          </Text>
        </Stack>
        <ChevronRight size={16} color={colors.icon[t].muted} />
      </Row>
    </Pressable>
  )
}

/**
 * One of the two cards under the figures: a few items from a queue, and a way
 * to the whole of it. The prototype puts Clear / Flag on each screening row;
 * those decisions need the case in front of you, so a row opens its queue.
 */
function PreviewCard({
  title,
  viewAllLabel,
  onViewAll,
  rows,
  loading,
  failed,
  empty,
  footer,
  onRowPress,
}: {
  title: string
  viewAllLabel: string
  onViewAll: () => void
  rows: PreviewRow[]
  loading: boolean
  failed: boolean
  empty: string
  footer?: ReactNode
  onRowPress: (row: PreviewRow) => void
}) {
  const { theme } = useThemeContext()
  const t = theme === 'dark' ? 'dark' : 'light'

  return (
    <Card variant="outlined" padding="md">
      <Stack gap={8}>
        <Row justify="space-between" align="center" gap={12}>
          <H3>{title}</H3>
          <TextLink onPress={onViewAll} accessibilityLabel={viewAllLabel}>
            View all
          </TextLink>
        </Row>

        {rows.length > 0 ? (
          <Stack gap={0}>
            {rows.map((row) => (
              <Pressable
                key={row.key}
                onPress={() => onRowPress(row)}
                accessibilityRole="link"
                accessibilityLabel={`${row.tag}: ${row.title}`}
              >
                <Row
                  gap={12}
                  align="center"
                  paddingVertical={10}
                  style={{ borderTopWidth: 1, borderTopColor: colors.border[t].subtle }}
                >
                  <Stack gap={2} style={{ flex: 1, minWidth: 0 }}>
                    <Text numberOfLines={1} style={{ color: colors.text[t].primary }}>
                      {row.title}
                    </Text>
                    <Text
                      numberOfLines={1}
                      style={{ color: colors.text[t].tertiary, fontSize: fontSize.sm }}
                    >
                      {[row.tag, row.detail].filter(Boolean).join(' · ')}
                    </Text>
                  </Stack>
                  {row.note ? (
                    <Text
                      style={{
                        fontSize: fontSize.sm,
                        color: row.attention ? colors.text[t].attention : colors.text[t].secondary,
                      }}
                    >
                      {row.note}
                    </Text>
                  ) : null}
                  <ChevronRight size={16} color={colors.icon[t].muted} />
                </Row>
              </Pressable>
            ))}
          </Stack>
        ) : (
          <Text style={{ color: colors.text[t].secondary }}>
            {failed ? 'This queue could not be loaded.' : loading ? 'Loading…' : empty}
          </Text>
        )}

        {/* Some rows can still have loaded when one source failed; say so
            rather than let a short list pass for the whole queue. */}
        {failed && rows.length > 0 ? (
          <Text style={{ color: colors.text[t].secondary }}>
            Part of this queue could not be loaded, so it may be incomplete.
          </Text>
        ) : null}

        {footer}
      </Stack>
    </Card>
  )
}

/** A count we do not have yet is a dash, not a zero — those are different claims. */
function formatCount(value: number | null): string {
  return value == null ? '—' : String(value)
}
