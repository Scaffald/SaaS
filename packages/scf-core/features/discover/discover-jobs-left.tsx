import {
  useExternalJobs,
  useJobsWithSoftSkillsMatch,
  usePublishedJobs,
  useUserApplications,
} from '@scf/core/utils/jobs-sdk-hooks'
import { extractPlainText, SkeletonList } from '@scaffald/ui'
import type { JSONContent } from '@tiptap/core'
import { ScrollView, Text, Stack } from '@scaffald/ui'
import { type ExternalJob, ExternalJobCard } from './components/ExternalJobCard'
import { type InternalJob, InternalJobCard } from './components/InternalJobCard'

interface DiscoverJobsLeftProps {
  searchQuery: string
  selectedIndustries: string[]
  selectedJobTypes: string[]
  jobSource?: 'all' | 'internal' | 'external'
  minSoftSkillsMatch?: number | null
  sortBy?: 'relevance' | 'match_score'
}

type MixedJob = { type: 'external'; job: ExternalJob } | { type: 'internal'; job: InternalJob }

/**
 * Discover Jobs Left Component
 * Left panel content for the jobs discovery page - displays job listings
 */
export function DiscoverJobsLeft({
  searchQuery,
  selectedIndustries,
  selectedJobTypes,
  jobSource = 'all',
  minSoftSkillsMatch,
  sortBy,
}: DiscoverJobsLeftProps) {
  // Check if soft skills filter is active
  const useSoftSkillsFilter =
    (minSoftSkillsMatch !== null && minSoftSkillsMatch !== undefined && minSoftSkillsMatch > 0) ||
    sortBy === 'match_score'
  const shouldUseSoftSkillsMatch =
    useSoftSkillsFilter && (jobSource === 'all' || jobSource === 'internal')

  // Fetch external jobs (SDK)
  const { data: externalData, isLoading: externalLoading } = useExternalJobs({
    enabled: jobSource === 'all' || jobSource === 'external',
  })

  // Fetch internal jobs with soft skills match if filter is active (SDK)
  const { data: softSkillsMatchData, isLoading: isLoadingSoftSkillsMatch } =
    useJobsWithSoftSkillsMatch(
      {
        minMatchScore: minSoftSkillsMatch ?? undefined,
        sortBy: sortBy === 'match_score' ? 'match_score' : undefined,
        limit: 100,
        offset: 0,
      },
      { enabled: shouldUseSoftSkillsMatch }
    )

  // Fetch regular internal jobs (SDK)
  const { data: internalData, isLoading: internalLoading } = usePublishedJobs(
    { search: searchQuery },
    { enabled: jobSource === 'all' || jobSource === 'internal' }
  )

  // Fetch user's applications to show applied status
  const { data: userApplications } = useUserApplications(
    { limit: 100, offset: 0 },
    { enabled: true }
  )

  const externalJobs = externalData ?? []
  let internalJobs = internalData?.data ?? []
  const matchingJobs = softSkillsMatchData?.jobs ?? []

  // If soft skills filter is active, filter internal jobs to only matching ones
  if (shouldUseSoftSkillsMatch && matchingJobs.length > 0) {
    const matchingJobIds = new Set(matchingJobs.map((j: { jobId: string }) => j.jobId))
    internalJobs = internalJobs.filter((job) => matchingJobIds.has(job.id))
  }

  // Create a set of job IDs user has applied to
  type ApplicationSummary = { job_id?: string | null; id?: string }
  const applicationsList = (userApplications?.data ?? []) as ApplicationSummary[]

  const appliedJobIds = new Set<string>(
    applicationsList
      .map((application) => application.job_id)
      .filter((jobId): jobId is string => Boolean(jobId))
  )

  const applicationIdByJobId = new Map<string, string>()
  for (const application of applicationsList) {
    if (application.job_id && application.id) {
      applicationIdByJobId.set(application.job_id, application.id)
    }
  }

  const isLoading =
    externalLoading || internalLoading || (shouldUseSoftSkillsMatch && isLoadingSoftSkillsMatch)

  // Combine and filter both job types
  const mixedJobs: MixedJob[] = [
    ...externalJobs.map((job) => ({ type: 'external' as const, job: job as ExternalJob })),
    ...internalJobs.map((job) => ({ type: 'internal' as const, job: job as InternalJob })),
  ]

  // If soft skills sort is active, sort internal jobs by match score
  if (sortBy === 'match_score' && shouldUseSoftSkillsMatch && matchingJobs.length > 0) {
    const matchScoresByJobId = new Map<string, number>()
    for (const matchJob of matchingJobs) {
      if (matchJob.matchScore !== null && matchJob.matchScore !== undefined) {
        matchScoresByJobId.set(matchJob.jobId, matchJob.matchScore)
      }
    }

    // Sort mixed jobs: internal jobs by match score (descending), external jobs by date
    mixedJobs.sort((a, b) => {
      if (a.type === 'internal' && b.type === 'internal') {
        const aScore = matchScoresByJobId.get(a.job.id) ?? 0
        const bScore = matchScoresByJobId.get(b.job.id) ?? 0
        return bScore - aScore // Descending order
      }
      // Keep external jobs in their original order (newest first)
      return 0
    })
  }

  const filteredJobs = mixedJobs.filter((item) => {
    const job = item.job

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      if (item.type === 'external') {
        const extJob = job as ExternalJob
        const matchesSearch =
          extJob.title.toLowerCase().includes(query) ||
          extJob.company_name?.toLowerCase().includes(query) ||
          extJob.description?.toLowerCase().includes(query) ||
          extJob.job_category?.toLowerCase().includes(query)
        if (!matchesSearch) return false
      } else {
        const intJob = job as InternalJob
        // Extract plain text from description if it's rich text JSON
        const descriptionText =
          typeof intJob.description === 'string'
            ? intJob.description
            : intJob.description
              ? extractPlainText(intJob.description as JSONContent)
              : ''
        const matchesSearch =
          intJob.title.toLowerCase().includes(query) ||
          intJob.organization?.name?.toLowerCase().includes(query) ||
          descriptionText.toLowerCase().includes(query)
        if (!matchesSearch) return false
      }
    }

    // Industry filter (external jobs only for now)
    if (selectedIndustries && selectedIndustries.length > 0 && item.type === 'external') {
      const extJob = job as ExternalJob
      const hasMatchingIndustry = extJob.industries?.some(
        (industry: { industry_name: string; confidence_score: number }) =>
          selectedIndustries.includes(industry.industry_name)
      )
      if (!hasMatchingIndustry) return false
    }

    // Job type filter
    if (selectedJobTypes && selectedJobTypes.length > 0) {
      if (item.type === 'external') {
        const extJob = job as ExternalJob
        if (!extJob.job_type || !selectedJobTypes.includes(extJob.job_type)) {
          return false
        }
      } else {
        const intJob = job as InternalJob
        if (!intJob.employment_type || !selectedJobTypes.includes(intJob.employment_type)) {
          return false
        }
      }
    }

    return true
  })

  const renderContent = () => {
    // Handle soft skills assessment required state
    if (shouldUseSoftSkillsMatch && softSkillsMatchData?.needsSelfAssessment) {
      return (
        <Stack flex={1} align="center" justify="center" padding="md" gap={12}>
          <Text color="$gray11">Complete Your Assessment</Text>
          <Text color="$gray11" style={{ textAlign: 'center' }}>
            Complete your soft skills assessment to filter and sort jobs by match score.
          </Text>
        </Stack>
      )
    }

    if (isLoading) {
      return (
        <Stack flex={1} padding="md">
          <SkeletonList count={5} gap={12} variant="job" />
        </Stack>
      )
    }

    if (filteredJobs.length === 0) {
      return (
        <Stack flex={1} align="center" justify="center" padding="md" gap={8}>
          <Text color="$gray11">No jobs found</Text>
          <Text color="$gray11">
            {shouldUseSoftSkillsMatch
              ? 'No jobs match your soft skills filter criteria'
              : 'Try adjusting your filters or search query'}
          </Text>
        </Stack>
      )
    }

    return (
      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        <Stack gap={12} padding="md">
          <Text color="$gray11">
            {filteredJobs.length} {filteredJobs.length === 1 ? 'Job' : 'Jobs'} Available
          </Text>

          {filteredJobs.map((item) => {
            if (item.type === 'external') {
              return <ExternalJobCard key={`external-${item.job.id}`} job={item.job} />
            }
            return (
              <InternalJobCard
                key={`internal-${item.job.id}`}
                job={item.job}
                hasApplied={appliedJobIds.has(item.job.id)}
                applicationId={applicationIdByJobId.get(item.job.id)}
              />
            )
          })}
        </Stack>
      </ScrollView>
    )
  }

  return (
    <Stack style={{ flex: 1, overflow: 'hidden' }}>
      {renderContent()}
    </Stack>
  )
}
