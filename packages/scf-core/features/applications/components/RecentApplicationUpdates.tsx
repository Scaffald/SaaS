/**
 * Recent Application Updates rail (SC-37).
 *
 * Surfaces the worker's most recently-changed applications at the top
 * of /jobs/applications so the screen feels alive after they apply.
 * Drives the "momentum" loop in the SC-37 retention goals.
 *
 * Data source: the existing application list — we sort by
 * `stage_changed_at ?? created_at` descending and slice. No extra
 * queries, no new SDK endpoint, no schema work. v1.4.0 can move this
 * to a dedicated cross-application activity feed if/when one ships.
 *
 * Hidden when:
 *  - the user has no applications at all (handled by parent's empty
 *    state),
 *  - the only "update" is the initial `created_at` (i.e. no status
 *    transitions yet — the cards in the list below already show that).
 */

import type { Application } from '@scaffald/sdk/resources/applications'
import { formatDistanceToNow } from 'date-fns'
import { ChevronRight, Sparkles } from 'lucide-react-native'
import { Link } from 'expo-router'
import { useMemo } from 'react'
import { DashboardWidget, Row, Stack, Text, useThemeContext } from '@scaffald/ui'
import { colors } from '@scaffald/ui/tokens'

import { ApplicationStatusBadge } from './ApplicationStatusBadge'

interface RecentApplicationUpdatesProps {
  applications: Application[]
  /** How many rows to show. Defaults to 3 — any more crowds the rail above the filter chips. */
  limit?: number
}

type ScoredApp = {
  app: Application
  changedAt: number
  hasMoved: boolean
}

function scoreApplications(applications: Application[], limit: number): ScoredApp[] {
  const scored: ScoredApp[] = applications.map((app) => {
    const stage = app.stage_changed_at ? Date.parse(app.stage_changed_at) : Number.NaN
    const created = app.created_at ? Date.parse(app.created_at) : Number.NaN
    const changedAt = !Number.isNaN(stage) ? stage : (!Number.isNaN(created) ? created : 0)
    // "Moved" means the status has changed since submission. Without
    // `stage_changed_at` we can't tell — treat as not-moved so the rail
    // doesn't surface noise for users with all-pending applications.
    const hasMoved =
      !!app.stage_changed_at &&
      !Number.isNaN(stage) &&
      !Number.isNaN(created) &&
      stage - created > 1000

    return { app, changedAt, hasMoved }
  })

  return scored
    .filter((entry) => entry.hasMoved)
    .sort((a, b) => b.changedAt - a.changedAt)
    .slice(0, limit)
}

export function RecentApplicationUpdates({
  applications,
  limit = 3,
}: RecentApplicationUpdatesProps) {
  const { theme } = useThemeContext()

  const updates = useMemo(() => scoreApplications(applications, limit), [applications, limit])

  if (updates.length === 0) return null

  return (
    <DashboardWidget gap={12}>
      <Row gap={8} align="center">
        <Sparkles size={16} color={colors.primary[600]} />
        <Text
          style={{
            color: colors.text[theme].primary,
            fontSize: 15,
            fontWeight: '600',
          }}
        >
          Recent updates
        </Text>
      </Row>

      <Stack gap={8}>
        {updates.map(({ app, changedAt }) => {
          const job = app.job
          const when = !Number.isNaN(changedAt)
            ? formatDistanceToNow(new Date(changedAt), { addSuffix: true })
            : null

          return (
            <Link
              key={app.id}
              href={`/jobs/applications/${app.id}` as never}
              style={{ textDecorationLine: 'none' } as never}
            >
              <Row
                gap={12}
                align="center"
                justify="space-between"
                padding={10}
                style={{
                  backgroundColor: colors.bg[theme].subtle,
                  borderRadius: 10,
                  borderWidth: 1,
                  borderColor: colors.border[theme].subtle,
                }}
              >
                <Stack gap={2} style={{ flex: 1, minWidth: 0 }}>
                  <Text
                    style={{
                      color: colors.text[theme].primary,
                      fontSize: 14,
                      fontWeight: '600',
                    }}
                    numberOfLines={1}
                  >
                    {job?.title ?? 'Application updated'}
                  </Text>
                  <Text
                    style={{ color: colors.text[theme].secondary, fontSize: 12 }}
                    numberOfLines={1}
                  >
                    {job?.organization?.name ?? 'Employer'}
                    {when ? ` • ${when}` : ''}
                  </Text>
                </Stack>
                <Row gap={8} align="center">
                  <ApplicationStatusBadge status={app.status} />
                  <ChevronRight size={16} color={colors.text[theme].tertiary} />
                </Row>
              </Row>
            </Link>
          )
        })}
      </Stack>
    </DashboardWidget>
  )
}
