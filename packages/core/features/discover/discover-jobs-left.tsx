import { useState } from 'react'
import { YStack, ScrollView, Text, Spinner, XStack } from 'tamagui'
import { ExternalJobCard, type ExternalJob } from './components/ExternalJobCard'
import { ExternalJobDetailModal } from './components/ExternalJobDetailModal'
import { InternalJobCard, type InternalJob } from './components/InternalJobCard'
import { InternalJobDetailModal } from './components/InternalJobDetailModal'
import { api } from '@app/core/utils/api'

interface DiscoverJobsLeftProps {
  searchQuery: string
  selectedIndustries: string[]
  selectedJobTypes: string[]
  jobSource?: 'all' | 'internal' | 'external'
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
}: DiscoverJobsLeftProps) {
  const [selectedExternalJob, setSelectedExternalJob] = useState<ExternalJob | null>(null)
  const [selectedInternalJob, setSelectedInternalJob] = useState<InternalJob | null>(null)
  const [externalModalOpen, setExternalModalOpen] = useState(false)
  const [internalModalOpen, setInternalModalOpen] = useState(false)

  // Fetch external jobs
  const { data: externalData, isLoading: externalLoading } = api.jobs.getExternalJobs.useQuery(
    undefined,
    {
      enabled: jobSource === 'all' || jobSource === 'external',
    }
  )

  // Fetch internal jobs
  const { data: internalData, isLoading: internalLoading } = api.jobs.getPublishedJobs.useQuery(
    {
      search: searchQuery,
    },
    {
      enabled: jobSource === 'all' || jobSource === 'internal',
    }
  )

  const externalJobs = externalData?.jobs || []
  const internalJobs = internalData?.jobs || []

  const isLoading = externalLoading || internalLoading

  // Combine and filter both job types
  const mixedJobs: MixedJob[] = [
    ...externalJobs.map((job: ExternalJob): MixedJob => ({ type: 'external', job })),
    ...internalJobs.map((job: InternalJob): MixedJob => ({ type: 'internal', job })),
  ]

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
        const matchesSearch =
          intJob.title.toLowerCase().includes(query) ||
          intJob.organization?.name?.toLowerCase().includes(query) ||
          intJob.description?.toLowerCase().includes(query)
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

  const handleViewExternalDetails = (job: ExternalJob) => {
    setSelectedExternalJob(job)
    setExternalModalOpen(true)
  }

  const handleViewInternalDetails = (job: InternalJob) => {
    setSelectedInternalJob(job)
    setInternalModalOpen(true)
  }

  const handleExternalJobApply = (jobId: string) => {
    console.log('Applied to external job:', jobId)
    setExternalModalOpen(false)
  }

  const handleInternalJobApply = () => {
    // Refetch jobs to update application status
    internalData && api.jobs.getPublishedJobs.useQuery.refetch?.()
  }

  if (isLoading) {
    return (
      <YStack flex={1} items="center" justify="center" p="$4">
        <Spinner size="large" color="$blue10" />
        <Text mt="$2" color="$color11">
          Loading jobs...
        </Text>
      </YStack>
    )
  }

  if (filteredJobs.length === 0) {
    return (
      <YStack flex={1} items="center" justify="center" p="$4" gap="$2">
        <Text fontSize="$6" fontWeight="600" color="$color12">
          No jobs found
        </Text>
        <Text fontSize="$4" color="$color11">
          Try adjusting your filters or search query
        </Text>
      </YStack>
    )
  }

  return (
    <>
      <ScrollView flex={1} showsVerticalScrollIndicator={false}>
        <YStack gap="$3" p="$4">
          <Text fontSize="$5" fontWeight="600" color="$color12">
            {filteredJobs.length} {filteredJobs.length === 1 ? 'Job' : 'Jobs'} Available
          </Text>

          {filteredJobs.map((item) => {
            if (item.type === 'external') {
              return (
                <ExternalJobCard
                  key={`external-${item.job.id}`}
                  job={item.job}
                  onViewDetails={handleViewExternalDetails}
                />
              )
            }
            return (
              <InternalJobCard
                key={`internal-${item.job.id}`}
                job={item.job}
                onViewDetails={handleViewInternalDetails}
              />
            )
          })}
        </YStack>
      </ScrollView>

      <ExternalJobDetailModal
        job={selectedExternalJob}
        open={externalModalOpen}
        onOpenChange={setExternalModalOpen}
        onApply={handleExternalJobApply}
      />

      <InternalJobDetailModal
        job={selectedInternalJob}
        open={internalModalOpen}
        onOpenChange={setInternalModalOpen}
        onApplySuccess={handleInternalJobApply}
      />
    </>
  )
}
