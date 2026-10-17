import { ROUTES, buildPath } from '@scf/core/constants/routes'
import { useEmployerApplications } from '@scf/core/utils/applications-sdk-hooks'
import { useOfficeListJobs } from '@scf/core/utils/jobs-sdk-hooks'
import { useOrganizations } from '@scf/core/utils/useOrganizations'
import { useRouter } from 'expo-router'
import { useMemo, useState } from 'react'
import { Pressable, View } from 'react-native'
import {
  Button,
  Lane,
  LaneGroup,
  ListToolbar,
  Row,
  Spinner,
  Stack,
  Text,
  useResponsive,
  useThemeContext,
} from '@scaffald/ui'
import { colors, fontSize, fontWeight } from '@scaffald/ui/tokens'
import {
  daysOpen,
  LISTING_FILTERS,
  listingAgeLabel,
  type ListingFilter,
  listingMetaLine,
  listingStatus,
  statusesForListingFilter,
  statusWordInGroup,
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
/** Fixed so the applicant column lines up down a wide list (#1199). */
const LISTING_TITLE_WIDTH = 360
const LISTING_APPLICANTS_WIDTH = 200

export function EmployerJobsList() {
  const router = useRouter()
  const { theme } = useThemeContext()
  const t = theme === 'dark' ? 'dark' : 'light'
  const [filter, setFilter] = useState<ListingFilter>('all')
  const [search, setSearch] = useState('')
  // Lane's own stackBelow default, so the row and its cells agree on narrow.
  const { width } = useResponsive()
  const stacked = width > 0 && width < 768

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
  const {
    data: response,
    isLoading,
    isError,
    refetch,
  } = useOfficeListJobs(organizationId ? { organization_id: organizationId } : undefined, {
    enabled: !!organizationId,
  })

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
    { enabled: !!organizationId }
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
          variant="outline"
          onPress={() => router.push(ROUTES.OFFICE.CMS.JOBS.CREATE.path)}
        >
          Post a job
        </Button>
      </Stack>
    )
  }

  return (
    <Stack gap={20}>
      <ListToolbar
        // An empty partition is not a place to go: "Draft · 0" was a tab
        // that could only show nothing (#1199). All and the tab you are on
        // always stay.
        tabs={LISTING_FILTERS.filter(
          (group) => group.key === 'all' || group.key === filter || counts[group.key] > 0
        ).map((group) => ({
          key: group.key,
          label: group.label,
          count: counts[group.key],
        }))}
        activeTab={filter}
        onTabChange={(next) => setFilter(next as ListingFilter)}
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
              const statusWord = statusWordInGroup(job.status, group.title)
              const applicants = applicantsByJob.get(job.id) ?? 0
              const age = daysOpen(job.posted_at, job.created_at)
              const meta = listingMetaLine(job)
              const statusColor =
                status.tone === 'active'
                  ? colors.text[t].emphasis
                  : status.tone === 'attention'
                    ? colors.text[t].attention
                    : colors.text[t].secondary

              const openPosting = () => router.push(buildPath(ROUTES.JOBS.DETAIL, { id: job.id }))

              // The row opens the posting. Lane keeps Edit outside its press
              // area (#1288), and the applicants link is a Pressable of its
              // own, which takes its click before the row sees it.
              return (
                <Lane
                  key={job.id}
                  onPress={openPosting}
                  accessibilityLabel={`Open ${job.title}`}
                  age={age != null ? `${age}d` : undefined}
                  ageLabel={listingAgeLabel(job.posted_at)}
                  // Title and meta in a fixed-width block so the applicant
                  // count starts at one x down the list.
                  title={
                    <View style={stacked ? undefined : { width: LISTING_TITLE_WIDTH }}>
                      <Text
                        numberOfLines={1}
                        style={{
                          fontSize: fontSize.lg,
                          fontWeight: fontWeight.semibold,
                          color: colors.text[t].primary,
                        }}
                      >
                        {job.title}
                      </Text>
                      {meta ? (
                        <Text
                          numberOfLines={stacked ? 2 : 1}
                          style={{ fontSize: fontSize.md, color: colors.text[t].secondary }}
                        >
                          {meta}
                        </Text>
                      ) : null}
                    </View>
                  }
                  columns={[
                    // The count is the way into the pipeline for this posting
                    // (#1199): it used to be plain text, so an employer read
                    // "4 applicants" and then had to go and find them.
                    applicants > 0 ? (
                      <Pressable
                        key="applicants"
                        style={stacked ? undefined : { width: LISTING_APPLICANTS_WIDTH }}
                        accessibilityRole="link"
                        accessibilityLabel={`View ${applicants} ${
                          applicants === 1 ? 'applicant' : 'applicants'
                        } for ${job.title}`}
                        onPress={() =>
                          router.push({
                            pathname: ROUTES.OFFICE.APPLICATIONS.path,
                            params: { job: job.id },
                          })
                        }
                      >
                        <Row gap={8} align="baseline">
                          <Text
                            style={{
                              fontSize: fontSize.lg,
                              fontWeight: fontWeight.semibold,
                              fontVariant: ['tabular-nums'],
                              color: colors.text[t].emphasis,
                            }}
                          >
                            {applicants}
                          </Text>
                          <Text style={{ fontSize: fontSize.md, color: colors.text[t].emphasis }}>
                            View applicants →
                          </Text>
                        </Row>
                      </Pressable>
                    ) : (
                      <View
                        key="applicants"
                        style={stacked ? undefined : { width: LISTING_APPLICANTS_WIDTH }}
                      >
                        <Text style={{ color: colors.text[t].tertiary }}>No applicants yet</Text>
                      </View>
                    ),
                    // Only where the group's title does not already say it.
                    ...(statusWord
                      ? [
                          <Text key="status" style={{ color: statusColor }}>
                            {statusWord}
                          </Text>,
                        ]
                      : []),
                  ]}
                  actions={
                    // Stacked, a full button under every posting made each one
                    // five lines tall (#1199); a text button keeps Edit on
                    // the row without spending a line on its outline.
                    <Button
                      size="sm"
                      variant={stacked ? 'text' : 'outline'}
                      onPress={() =>
                        router.push(buildPath(ROUTES.OFFICE.CMS.JOBS.EDIT, { id: job.id }))
                      }
                    >
                      Edit
                    </Button>
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
