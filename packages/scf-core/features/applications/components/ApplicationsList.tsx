import { ROUTES, buildPath } from '@scf/core/constants/routes'
import { useUserApplications } from '@scf/core/utils/jobs-sdk-hooks'
import type { Application } from '@scaffald/sdk/resources/applications'
import { useMemo, useState } from 'react'
import { useRouter } from 'expo-router'
import {
  Button,
  Lane,
  LaneGroup,
  ListToolbar,
  Row,
  Spinner,
  Stack,
  Tabs,
  Text,
  useThemeContext,
} from '@scaffald/ui'
import { colors } from '@scaffald/ui/tokens'
import {
  APPLICATION_STAGES,
  daysInStage,
  FILTER_GROUPS,
  type FilterGroup,
  statusesForFilter,
} from '../application-status'

/**
 * The worker's own applications, grouped by where each one stands.
 *
 * This was a flat list of cards under a row of pill buttons, with a "recently
 * moved" rail above it repeating three of the same rows. The one question the
 * screen has to answer — what is happening with each of these, and which one
 * needs me — was spread across a badge, a filter chip and a next-step line
 * that each named the same status differently.
 *
 * Now the stages *are* the structure: `LaneGroup` per stage, in the order an
 * application moves, the ones that want the worker first. Each row leads with
 * how long it has sat where it is, which is the number that says "this one
 * has stalled" — a date applied cannot.
 */

function payLabel(
  minCents: number | null | undefined,
  maxCents: number | null | undefined,
  type: string | null | undefined
): string | null {
  if (!minCents && !maxCents) return null
  const suffix = type === 'hourly' ? '/hr' : type === 'salary' ? '/yr' : ''
  const format = (cents: number) => {
    const dollars = cents / 100
    return dollars >= 1000 ? `$${Math.round(dollars / 1000)}K` : `$${dollars}`
  }
  if (minCents && maxCents) return `${format(minCents)} – ${format(maxCents)}${suffix}`
  if (minCents) return `${format(minCents)}+${suffix}`
  if (maxCents) return `Up to ${format(maxCents)}${suffix}`
  return null
}

function appliedLabel(createdAt: string | null | undefined): string | null {
  if (!createdAt) return null
  const applied = new Date(createdAt)
  if (Number.isNaN(applied.getTime())) return null
  return applied.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export function ApplicationsList() {
  const router = useRouter()
  const { theme } = useThemeContext()
  const t = theme === 'dark' ? 'dark' : 'light'
  const [filter, setFilter] = useState<FilterGroup>('all')
  const [search, setSearch] = useState('')

  const {
    data: response,
    isLoading,
    isError,
    refetch,
    isFetching,
  } = useUserApplications({ limit: 50, offset: 0 })

  const allApplications: Application[] = useMemo(
    () => (response?.data ?? []) as Application[],
    [response?.data]
  )

  const counts = useMemo(() => {
    const out: Record<FilterGroup, number> = {
      all: allApplications.length,
      active: 0,
      interview: 0,
      offers: 0,
      closed: 0,
    }
    for (const { key } of FILTER_GROUPS) {
      const allowed = statusesForFilter(key)
      if (!allowed) continue
      out[key] = allApplications.filter((app) =>
        allowed.includes(app.status as (typeof allowed)[number])
      ).length
    }
    return out
  }, [allApplications])

  const visible = useMemo(() => {
    const allowed = statusesForFilter(filter)
    const term = search.trim().toLowerCase()
    return allApplications.filter((app) => {
      if (allowed && !allowed.includes(app.status as (typeof allowed)[number])) return false
      if (!term) return true
      const haystack = `${app.job?.title ?? ''} ${app.job?.organization?.name ?? ''}`.toLowerCase()
      return haystack.includes(term)
    })
  }, [allApplications, filter, search])

  // Only stages that actually hold something. Eight headings with seven of
  // them empty is a worse answer than a short list.
  const groups = useMemo(
    () =>
      APPLICATION_STAGES.map((stage) => ({
        stage,
        rows: visible.filter((app) => app.status === stage.status),
      })).filter((group) => group.rows.length > 0),
    [visible]
  )

  if (isLoading) {
    return (
      <Stack align="center" justify="center" paddingVertical={48} gap={12}>
        <Spinner variant="ios" size="lg" />
        <Text style={{ color: colors.text[t].secondary }}>Loading applications…</Text>
      </Stack>
    )
  }

  // A failed request is not an empty list. This screen used to render the
  // "no applications yet" state whenever the query came back without data,
  // so a request that 401'd inside the auth window told a worker with six
  // live applications that they had never applied to anything.
  if (isError) {
    return (
      <Stack gap={16} align="flex-start" paddingVertical={24}>
        <Text style={{ color: colors.text[t].secondary }}>
          We couldn't load your applications. They are still there — this screen just could not
          reach them.
        </Text>
        <Button
          size="md"
          variant="filled"
          color="primary"
          onPress={() => refetch()}
          disabled={isFetching}
        >
          {isFetching ? 'Trying again…' : 'Try again'}
        </Button>
      </Stack>
    )
  }

  if (allApplications.length === 0) {
    return (
      <Stack gap={16} align="flex-start" paddingVertical={24}>
        <Text style={{ color: colors.text[t].secondary }}>
          Nothing here yet. When you apply to a job it appears on this screen, grouped by where it
          stands — from applied through to an offer.
        </Text>
        <Row gap={12} wrap>
          <Button
            size="md"
            variant="filled"
            color="primary"
            onPress={() => router.push(ROUTES.JOBS.path)}
          >
            Browse jobs
          </Button>
          <Button size="md" variant="outline" onPress={() => router.push(ROUTES.PROFILE.path)}>
            Finish your profile
          </Button>
        </Row>
      </Stack>
    )
  }

  return (
    <Stack gap={20}>
      {/* The status partition as folder tabs, the treatment the rest of the
          app uses for a view switch. It was five pill buttons that looked
          like actions. */}
      <Tabs type="folder" value={filter} onValueChange={(next) => setFilter(next as FilterGroup)}>
        {FILTER_GROUPS.map((group) => (
          <Tabs.Item key={group.key} value={group.key}>
            <Tabs.Trigger>
              {group.label} {counts[group.key]}
            </Tabs.Trigger>
          </Tabs.Item>
        ))}
      </Tabs>

      <ListToolbar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by role or employer…"
        resultCount={visible.length}
        resultNoun="application"
      />

      {groups.length === 0 ? (
        <Text style={{ color: colors.text[t].secondary }}>No applications match this filter.</Text>
      ) : (
        groups.map(({ stage, rows }) => (
          <LaneGroup
            key={stage.status}
            title={stage.label}
            count={rows.length}
            hint={stage.hint}
            tone={stage.tone}
          >
            {rows.map((application) => {
              const job = application.job
              const days = daysInStage(application.stage_changed_at)
              const pay = payLabel(
                job?.pay_range_min_cents,
                job?.pay_range_max_cents,
                job?.pay_range_type
              )
              const applied = appliedLabel(application.created_at)
              const columns = [
                job?.location ? (
                  <Text key="where" style={{ color: colors.text[t].secondary }}>
                    {job.location}
                  </Text>
                ) : null,
                pay ? (
                  <Text key="pay" style={{ color: colors.text[t].secondary }}>
                    {pay}
                  </Text>
                ) : null,
                applied ? (
                  <Text key="applied" style={{ color: colors.text[t].secondary }}>
                    Applied {applied}
                  </Text>
                ) : null,
              ].filter((column): column is React.ReactElement => column !== null)

              return (
                <Lane
                  key={application.id}
                  age={days != null ? `${days}d` : undefined}
                  // An offer or a question is waiting on the worker; anything
                  // else sitting is waiting on the employer, and marking that
                  // in the attention hue would blame the wrong party.
                  overdue={stage.tone === 'attention'}
                  title={job?.title ?? 'Job'}
                  subtitle={job?.organization?.name ?? undefined}
                  columns={columns}
                  onPress={() =>
                    router.push(
                      buildPath(ROUTES.JOBS.APPLICATIONS.DETAIL, {
                        applicationId: application.id,
                      })
                    )
                  }
                />
              )
            })}
          </LaneGroup>
        ))
      )}
    </Stack>
  )
}
