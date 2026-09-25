import { ROUTES } from '@scf/core/constants/routes'
import { useVerificationQueue } from '@scf/core/utils/office-communities-sdk-hooks'
import { useViolationReports } from '@scf/core/utils/legal-agreements-sdk-hooks'
import { useNotificationDeliveries } from '@scf/core/utils/notifications-admin-sdk-hooks'
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

/**
 * What the Office opens on (#839).
 *
 * `/office` opened straight into the notification delivery queue — an
 * operations table — with the storage dashboard and a list of developer links
 * below it. Nothing on the page said how much was waiting for an
 * administrator, and the three queues that do need a person (community
 * verification, violation reports, failed notification deliveries) were each
 * somewhere else entirely.
 *
 * The counts first, then what needs a decision, then the consoles.
 */
export function OfficeOverview() {
  const { theme } = useThemeContext()
  const t = theme === 'dark' ? 'dark' : 'light'
  const router = useRouter()

  const verificationQuery = useVerificationQueue({ limit: 1 })
  const violationsQuery = useViolationReports(undefined, { staleTime: 30_000 })
  const deliveriesQuery = useNotificationDeliveries({ status: 'failed', limit: 50 })

  const pendingVerifications = verificationQuery.data?.total ?? null

  const openViolations = useMemo(() => {
    const reports = violationsQuery.data?.items
    if (!Array.isArray(reports)) return null
    // Anything not yet resolved or dismissed is still somebody's decision.
    return reports.filter((report) => report.status !== 'resolved' && report.status !== 'dismissed')
      .length
  }, [violationsQuery.data])

  const failedDeliveries = useMemo(() => {
    const rows = deliveriesQuery.data
    return Array.isArray(rows) ? rows.length : null
  }, [deliveriesQuery.data])

  const queues = [
    {
      key: 'verification',
      label: 'Community verification',
      hint: 'People waiting to be let into a trade community.',
      count: pendingVerifications,
      route: ROUTES.OFFICE.COMMUNITIES.VERIFICATION.path,
    },
    {
      key: 'violations',
      label: 'Violation reports',
      hint: 'Reports raised against a posting or a person.',
      count: openViolations,
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

  const waiting = queues.filter((queue) => (queue.count ?? 0) > 0)

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
          value={formatCount(failedDeliveries)}
          tone="attention"
          emphasis={(failedDeliveries ?? 0) > 0}
          delta={failedDeliveries != null && failedDeliveries >= 50 ? 'at least' : undefined}
        />
      </MetricRow>

      <Separator />

      <Stack gap={12}>
        <H3>Needs a decision</H3>
        {waiting.length === 0 ? (
          <Text style={{ color: colors.text[t].secondary }}>
            Nothing is waiting on an administrator right now.
          </Text>
        ) : (
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
                  <Text style={{ color: colors.text[t].attention }}>{queue.count}</Text>
                  <ChevronRight size={16} color={colors.icon[t].muted} />
                </Row>
              </Pressable>
            ))}
          </Stack>
        )}
      </Stack>
    </Stack>
  )
}

/** A count we do not have yet is a dash, not a zero — those are different claims. */
function formatCount(value: number | null): string {
  return value == null ? '—' : String(value)
}
