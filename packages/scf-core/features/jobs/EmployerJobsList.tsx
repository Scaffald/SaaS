import { ROUTES, buildPath } from '@scf/core/constants/routes'
import { useEmployerApplications } from '@scf/core/utils/applications-sdk-hooks'
import { useOfficeListJobs } from '@scf/core/utils/jobs-sdk-hooks'
import { useOrganizations } from '@scf/core/utils/useOrganizations'
import { useRouter } from 'expo-router'
import { useMemo, useState } from 'react'
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
  daysOpen,
  LISTING_FILTERS,
  type ListingFilter,
  listingStatus,
  statusesForListingFilter,
} from './employer-jobs-status'

/**
 * The employer's own job postings.
 *
 * This lived entirely in the route file as a stack of cards, each drawing
 * the raw database status in uppercase in one of five hardcoded hex colours
 * — OPEN in green, DRAFT in grey — with no heading on the screen, no way to
 * post a job from it, and none of the two numbers an employer actually
 * opens this screen for: how many people have applied, and how long the
 * posting has been up.
 *
 * Rows grouped by status, in the order a posting moves. Applicant counts
 * come from the organisation's own applications, in one request, counted by
 * job — no new endpoint.
 */
export function EmployerJobsList() {
  const router = useRouter()
  const { theme } = useThemeContext()
  const t = theme === 'dark' ? 'dark' : 'light'
  const [filter, setFilter] = useState<ListingFilter>('all')
  const [search, setSearch] = useState('')

  const { data: memberships } = useOrganizations()

  const orgIds = useMemo(() => {
    if (!memberships?.length) return []
    const seen = new Set<string>()
    return memberships
      .filter((m) => {
        if (seen.has(m.organization_id)) return false
        seen.add(m.organization_id)
        return true
      })
      .map((m) => m.organization_id)
  }, [memberships])

  const organizationId = orgIds[0]

  // The SDK takes one org at a time; multi-org employers see their first.
  const { data: response, isLoading, isError, refetch } = useOfficeListJobs(
    organizationId ? { organization_id: organizationId } : undefined,
    { enabled: !!organizationId },
  )

  // One request for the org's applications, counted by job. The alternative
  // is a request per posting, and the count is the first thing an employer
  // looks at.
  //
  // 100 is the endpoint's own ceiling — asking for more fails the whole
  // query, which is how this first shipped showing "0 applicants" on every
  // row. Past a hundred applications the per-job counts become a floor; the
  // fix is a counts endpoint, not a bigger page.
  const { data: applications } = useEmployerApplications(
    organizationId ? { organization_id: organizationId, limit: 100 } : undefined,
    { enabled: !!organizationId },
  )

  const applicantsByJob = useMemo(() => {
    const counts = new Map<string, number>()
    for (const application of applications?.data ?? []) {
      counts.set(application.job_id, (counts.get(application.job_id) ?? 0) + 1)
    }
    return counts
  }, [applications?.data])

  const jobs = useMemo(() => response?.jobs ?? [], [response?.jobs])

  const counts = useMemo(() => {
    const out: Record<ListingFilter, number> = { all: jobs.length, live: 0, draft: 0, closed: 0 }
    for (const { key } of LISTING_FILTERS) {
      const allowed = statusesForListingFilter(key)
      if (!allowed) continue
      out[key] = jobs.filter((job) => allowed.includes(job.status)).length
    }
    return out
  }, [jobs])

  const visible = useMemo(() => {
    const allowed = statusesForListingFilter(filter)
    const term = search.trim().toLowerCase()
    return jobs.filter((job) => {
      if (allowed && !allowed.includes(job.status)) return false
      if (!term) return true
      return `${job.title} ${job.location ?? ''}`.toLowerCase().includes(term)
    })
  }, [jobs, filter, search])

  // Grouped by what an employer is looking for: live postings first, then
  // the ones still being written, then the ones that are over.
  const groups = useMemo(() => {
    const order: { key: ListingFilter; title: string; hint: string }[] = [
      { key: 'live', title: 'Live', hint: 'Visible, and taking applications.' },
      { key: 'draft', title: 'Not live', hint: 'Drafts and paused postings.' },
      { key: 'closed', title: 'Closed', hint: 'No longer taking applications.' },
    ]
    return order
      .map((group) => {
        const allowed = statusesForListingFilter(group.key) ?? []
        return { ...group, rows: visible.filter((job) => allowed.includes(job.status)) }
      })
      .filter((group) => group.rows.length > 0)
  }, [visible])

  if (isLoading) {
    return (
      <Stack align="center" justify="center" paddingVertical={48} gap={12}>
        <Spinner variant="ios" size="lg" />
        <Text style={{ color: colors.text[t].secondary }}>Loading your postings…</Text>
      </Stack>
    )
  }

  // A failed request is not an empty list.
  if (isError) {
    return (
      <Stack gap={16} align="flex-start" paddingVertical={24}>
        <Text style={{ color: colors.text[t].secondary }}>
          We couldn't load your postings. They are still there — this screen just could not reach
          them.
        </Text>
        <Button size="md" variant="filled" color="primary" onPress={() => refetch()}>
          Try again
        </Button>
      </Stack>
    )
  }

  if (jobs.length === 0) {
    return (
      <Stack gap={16} align="flex-start" paddingVertical={24}>
        <Text style={{ color: colors.text[t].secondary }}>
          Nothing posted yet. A posting appears here as soon as you save it, draft or live.
        </Text>
        <Button
          size="md"
          variant="filled"
          color="primary"
          onPress={() => router.push(ROUTES.OFFICE.CMS.JOBS.CREATE.path)}
        >
          Post a job
        </Button>
      </Stack>
    )
  }

  return (
    <Stack gap={20}>
      <Tabs type="folder" value={filter} onValueChange={(next) => setFilter(next as ListingFilter)}>
        {LISTING_FILTERS.map((group) => (
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
        searchPlaceholder="Search your postings…"
        resultCount={visible.length}
        resultNoun="posting"
      />

      {groups.length === 0 ? (
        <Text style={{ color: colors.text[t].secondary }}>No postings match this filter.</Text>
      ) : (
        groups.map((group) => (
          <LaneGroup
            key={group.key}
            title={group.title}
            count={group.rows.length}
            hint={group.hint}
            tone={group.key === 'live' ? 'active' : 'neutral'}
          >
            {group.rows.map((job) => {
              const status = listingStatus(job.status)
              const applicants = applicantsByJob.get(job.id) ?? 0
              const age = daysOpen(job.posted_at, job.created_at)

              return (
                <Lane
                  key={job.id}
                  age={age != null ? `${age}d` : undefined}
                  ageLabel={job.posted_at ? 'open' : 'in draft'}
                  title={job.title}
                  subtitle={job.location ?? undefined}
                  columns={[
                    <Text key="applicants" style={{ color: colors.text[t].secondary }}>
                      {applicants} {applicants === 1 ? 'applicant' : 'applicants'}
                    </Text>,
                    <Text
                      key="status"
                      style={{
                        color:
                          status.tone === 'active'
                            ? colors.text[t].emphasis
                            : status.tone === 'attention'
                              ? colors.text[t].attention
                              : colors.text[t].secondary,
                      }}
                    >
                      {status.label}
                    </Text>,
                  ]}
                  actions={
                    <Row gap={8} wrap>
                      <Button
                        size="sm"
                        variant="outline"
                        onPress={() =>
                          router.push(
                            buildPath(ROUTES.OFFICE.CMS.JOBS.EDIT, { id: job.id }),
                          )
                        }
                      >
                        Edit
                      </Button>
                    </Row>
                  }
                  onPress={() => router.push(buildPath(ROUTES.JOBS.DETAIL, { id: job.id }))}
                />
              )
            })}
          </LaneGroup>
        ))
      )}
    </Stack>
  )
}
