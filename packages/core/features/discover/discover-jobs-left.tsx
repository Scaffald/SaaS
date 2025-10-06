import { useState } from 'react'
import { YStack, ScrollView, Text, Spinner } from 'tamagui'
import { ExternalJobCard, type ExternalJob } from './components/ExternalJobCard'
import { ExternalJobDetailModal } from './components/ExternalJobDetailModal'
import { api } from '@app/core/utils/api'

interface DiscoverJobsLeftProps {
  searchQuery: string
  selectedIndustries: string[]
  selectedJobTypes: string[]
}

/**
 * Discover Jobs Left Component
 * Left panel content for the jobs discovery page - displays job listings
 */
export function DiscoverJobsLeft({
  searchQuery,
  selectedIndustries,
  selectedJobTypes,
}: DiscoverJobsLeftProps) {
  const [selectedJob, setSelectedJob] = useState<ExternalJob | null>(null)
  const [modalOpen, setModalOpen] = useState(false)

  // Fetch real jobs from API
  const { data, isLoading } = api.jobs.getExternalJobs.useQuery()
  const jobs = data?.jobs || []

  // Filter jobs based on search and filters
  const filteredJobs = jobs.filter((job: ExternalJob) => {
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      const matchesSearch =
        job.title.toLowerCase().includes(query) ||
        job.company_name?.toLowerCase().includes(query) ||
        job.description?.toLowerCase().includes(query) ||
        job.job_category?.toLowerCase().includes(query)

      if (!matchesSearch) return false
    }

    // Industry filter
    if (selectedIndustries && selectedIndustries.length > 0) {
      const hasMatchingIndustry = job.industries?.some(
        (industry: { industry_name: string; confidence_score: number }) =>
          selectedIndustries.includes(industry.industry_name)
      )
      if (!hasMatchingIndustry) return false
    }

    // Job type filter
    if (selectedJobTypes && selectedJobTypes.length > 0) {
      if (!job.job_type || !selectedJobTypes.includes(job.job_type)) {
        return false
      }
    }

    return true
  })

  const handleViewDetails = (job: ExternalJob) => {
    setSelectedJob(job)
    setModalOpen(true)
  }

  const handleJobApply = (jobId: string) => {
    console.log('Applied to job:', jobId)
    // TODO: Track application analytics
    setModalOpen(false)
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

          {filteredJobs.map((job: ExternalJob) => (
            <ExternalJobCard key={job.id} job={job} onViewDetails={handleViewDetails} />
          ))}
        </YStack>
      </ScrollView>

      <ExternalJobDetailModal
        job={selectedJob}
        open={modalOpen}
        onOpenChange={setModalOpen}
        onApply={handleJobApply}
      />
    </>
  )
}
