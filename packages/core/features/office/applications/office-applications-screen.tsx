import { Button, H2, Spinner, Text, XStack, YStack } from '@app/ui'
import { useMemo, useState } from 'react'
import type { ApplicationStatus, MockApplication } from '../mock-data/ats-mock-data'
import { ApplicationsFilters } from './components/ApplicationsFilters'
import { ApplicationsKanbanBoard } from './components/ApplicationsKanbanBoard'
import type { Applications } from './hooks/useApplications'
import { useApplications } from './hooks/useApplications'

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
})

function formatPayRange(minCents?: number | null, maxCents?: number | null, type?: string | null) {
  if (!minCents && !maxCents) return ''
  const label =
    minCents && maxCents
      ? `${currencyFormatter.format(minCents / 100)} - ${currencyFormatter.format(maxCents / 100)}`
      : currencyFormatter.format((maxCents ?? minCents ?? 0) / 100)
  const suffix =
    type === 'hourly'
      ? '/hr'
      : type === 'salary'
        ? '/yr'
        : type === 'contract'
          ? ' (contract)'
          : type === 'project'
            ? ' (project)'
            : ''
  return `${label}${suffix}`
}

export const OfficeApplicationsScreen = () => {
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban')
  const [filters, setFilters] = useState<{
    jobId: string | null
    status: ApplicationStatus | null
    minScore: number
  }>({
    jobId: null,
    status: null,
    minScore: 0,
  })

  // Fetch applications using tRPC
  const { applications, isLoading, isError, error } = useApplications({
    status:
      (filters.status as
        | 'pending'
        | 'reviewing'
        | 'interview'
        | 'offer'
        | 'hired'
        | 'rejected'
        | 'withdrawn'
        | undefined) || undefined,
  })

  // Transform real database records to MockApplication format for UI compatibility
  // Data comes from v_applications_with_user_profiles view with flattened fields
  const transformedApplications = useMemo(() => {
    return applications.map((app: Applications[number]): MockApplication => {
      const jobInfo = app.job as {
        primary_team_id?: string | null
        teamAssignments?: Array<{
          teamId: string
          isPrimary: boolean
          team?: { name: string | null }
        }>
        pay_range_min_cents?: number | null
        pay_range_max_cents?: number | null
        pay_range_type?: string | null
        employment_type?: string | null
        organization_id?: string | null
        // target_start_date?: string | null // Column doesn't exist in database yet
      } | null
      const assignments = jobInfo?.teamAssignments ?? []
      const primaryAssignment =
        assignments.find((assignment) => assignment.isPrimary) ?? assignments[0] ?? null
      const primaryTeamId = jobInfo?.primary_team_id ?? primaryAssignment?.teamId ?? null
      const primaryTeamName = primaryAssignment?.team?.name ?? null

      // Map database status to UI status
      const statusMap: Record<string, ApplicationStatus> = {
        pending: 'new',
        reviewing: 'screen',
        inquired: 'inquired',
        interview: 'interview',
        offer: 'offer',
        hired: 'hired',
        rejected: 'rejected',
        withdrawn: 'rejected',
      }

      return {
        id: app.id,
        status: statusMap[app.status] || 'new',
        appliedAt: app.applied_at,
        updatedAt: app.updated_at,
        score: app.application_score || 0,
        autoRejected: app.auto_rejected || false,
        screeningAnswers: {
          currentLocation: app.current_location || '',
          willingToRelocate: app.willing_to_relocate || false,
          yearsExperience: app.years_experience || 0,
          isAuthorizedToWork: app.is_authorized_to_work || false,
          earliestStartDate: app.earliest_start_date || '',
        },
        customAnswers: (app.custom_question_answers || []).map(
          (qa: { question: string; answer: string }) => ({
            question: qa.question || '',
            answer: qa.answer || '',
          })
        ),
        attachments: app.attachments || {},
        notes: [], // Notes not included in current query
        messages: [], // Messages not included in current query
        stageHistory: [], // Stage history not included in current query
        candidate: {
          id: app.candidate_id || app.user_id,
          name: app.candidate_name || 'Unknown',
          email: '', // Not included in view
          phone: '', // Not included in view
          title: app.profile_about ? app.profile_about.substring(0, 50) : 'Applicant',
          photo: app.profile_avatar_path || '',
          location: app.current_location || '',
          yearsExperience: app.years_experience || 0,
          skills: [], // Not displayed in kanban view
          certifications: [], // Not displayed in kanban view
          experience: [], // Not displayed in kanban view
        },
        job: {
          id: app.job_id,
          title: app.job_title || 'Position',
          company: '', // Not in current schema
          location: app.job_location || '',
          payRange: formatPayRange(
            jobInfo?.pay_range_min_cents,
            jobInfo?.pay_range_max_cents,
            jobInfo?.pay_range_type
          ),
          organizationId: jobInfo?.organization_id ?? null,
          payRangeMinCents: jobInfo?.pay_range_min_cents ?? null,
          payRangeMaxCents: jobInfo?.pay_range_max_cents ?? null,
          payRangeType: jobInfo?.pay_range_type ?? null,
          employmentType: jobInfo?.employment_type ?? null,
          targetStartDate: null, // target_start_date column doesn't exist in database yet
        },
        organizationId: jobInfo?.organization_id ?? null,
        workerUserId: app.user_id ?? null,
        team: {
          id: primaryTeamId,
          name: primaryTeamName,
          assignedUserId: (app as { assigned_to?: string | null }).assigned_to ?? null,
        },
      }
    })
  }, [applications])

  // Filter applications by score (client-side for now)
  const filteredApplications = useMemo(() => {
    return transformedApplications.filter((app: MockApplication) => {
      if (app.score < filters.minScore) return false
      return true
    })
  }, [transformedApplications, filters.minScore])

  // Loading state
  if (isLoading) {
    return (
      <YStack flex={1} items="center" justify="center" bg="$background">
        <Spinner size="large" />
        <Text mt="$4" color="$color11">
          Loading applications...
        </Text>
      </YStack>
    )
  }

  // Error state
  if (isError) {
    return (
      <YStack flex={1} items="center" justify="center" p="$4">
        <Text color="$red10" fontSize="$5" fontWeight="bold">
          Error Loading Applications
        </Text>
        <YStack items="center">
          <Text color="$color11" mt="$2">
            {error?.message || 'Failed to load applications. Please try again.'}
          </Text>
        </YStack>
      </YStack>
    )
  }

  return (
    <YStack flex={1} p="$4" bg="$background">
      {/* Header */}
      <XStack justify="space-between" items="center" mb="$4">
        <YStack>
          <H2>Applications</H2>
          <Text color="$color11" fontSize="$3">
            {filteredApplications.length} total applications
          </Text>
        </YStack>

        <XStack gap="$2">
          <Button
            size="$3"
            onPress={() => setViewMode('kanban')}
            variant={viewMode === 'kanban' ? 'outlined' : undefined}
          >
            Kanban
          </Button>
          <Button
            size="$3"
            onPress={() => setViewMode('list')}
            variant={viewMode === 'list' ? 'outlined' : undefined}
          >
            List
          </Button>
        </XStack>
      </XStack>

      {/* Filters - Note: needs jobs list from API */}
      <ApplicationsFilters filters={filters} onFiltersChange={setFilters} jobs={[]} />

      {/* Content */}
      {viewMode === 'kanban' ? (
        <ApplicationsKanbanBoard applications={filteredApplications} />
      ) : (
        <YStack p="$4">
          <Text>List view coming soon...</Text>
        </YStack>
      )}
    </YStack>
  )
}
