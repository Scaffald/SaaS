import type {
  OfficeCreateJobParams,
  OfficeJobDetailParams,
  OfficeUpdateJobParams,
} from '@scaffald/sdk'
import { useTeams } from '@scaffald/sdk/react'
import { useAllOrganizations } from '@scf/core/utils/useAllOrganizations'
import {
  useOfficeCreateJobMutation,
  useOfficeUpdateJobMutation,
} from '@scf/core/utils/jobs-sdk-hooks'

// SC-122 / SC-123: shared with `createJobBodySchema` on the server
// (packages/supabase/functions/api/routes/office-jobs.ts) so the disable
// predicate on the draft button matches what the API will accept.
const JOB_TITLE_MIN_LENGTH = 3
const JOB_DESCRIPTION_MIN_LENGTH = 10

type EmploymentType = NonNullable<OfficeCreateJobParams['employment_type']>
type RemoteOption = NonNullable<OfficeCreateJobParams['remote_option']>
type PayRangeType = NonNullable<OfficeCreateJobParams['pay_range_type']>
import {
  useSearchParentSkillsMutation,
  usePrimaryIndustry,
} from '@scf/core/utils/profile-skills-sdk-hooks'
import type { AddressResult } from '@scaffald/ui'
import {
  AddressForm,
  Button,
  H3,
  Input,
  ResponsiveSelect,
  ScreenHeader,
  Separator,
  Spinner,
  Text,
  Row,
  Stack,
  useThemeContext,
} from '@scaffald/ui'
import { extractPlainText, plainTextToTipTap, RichTextEditor } from '@scaffald/ui'
import type { JSONContent } from '@tiptap/core'
import { Eye } from 'lucide-react-native'
import { useToast } from '@scaffald/ui'
import { useRouter } from 'expo-router'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Toggle } from '@scaffald/ui'
import { JobPreviewModal } from './JobPreviewModal'
import { JobTaxonomyPicker } from './JobTaxonomyPicker'
import { useMapboxGeocodingProvider } from '@scf/core/utils/mapbox-geocoding-provider'
import { useScaffaldJobsClient } from '@scf/core/utils/jobs-sdk-context'
import { colors } from '@scaffald/ui/tokens'
import {
  ApplicationProcessSection,
  ApplicationScreeningSection,
  AutoRejectionSection,
  CompensationBenefitsSection,
  ComplianceAnalyticsSection,
  DistributionVisibilitySection,
  EnhancedRequirementsSection,
  JobMetadataSection,
  LocationSchedulingSection,
  ScoreThresholdSection,
  SoftSkillsRequirementsSection,
} from './job-form-sections'

type JobFormData = {
  // Basic fields
  title: string
  description: string | JSONContent | null
  organization_id: string
  skill_ids?: string[]
  optional_skill_ids?: string[]
  certification_ids?: string[]
  assigned_team_id?: string | null
  team_ids?: string[]
  primary_team_id?: string | null
  employment_type?: string
  remote_option?: string
  location?: string
  address?: {
    street?: string
    city?: string
    state?: string
    zip?: string
    country?: string
    latitude?: number
    longitude?: number
  }
  pay_range_min_cents?: number
  pay_range_max_cents?: number
  pay_range_type?: string
  position_level?: string

  // Hiring Team
  hiring_manager_id?: string
  recruiter_id?: string

  // Application Screening
  require_current_location?: boolean
  require_relocation_willingness?: boolean
  minimum_years_experience?: number
  require_work_authorization?: boolean
  require_earliest_start_date?: boolean

  // Auto-Rejection & Score
  enable_auto_reject?: boolean
  auto_reject_criteria?: {
    score_minimum?: number
    require_work_authorization?: boolean
    require_all_skills?: boolean
    require_all_certifications?: boolean
  }
  minimum_score?: number

  // Job Metadata
  internal_job_code?: string
  department?: string
  cost_center?: string
  number_of_openings?: number
  priority_level?: 'urgent' | 'high' | 'normal' | 'low'
  requisition_number?: string
  job_category?: string
  is_confidential?: boolean
  application_deadline?: string
  target_start_date?: string
  estimated_hire_date?: string
  scheduled_publish_at?: string

  // Enhanced Requirements
  minimum_education_level?: 'none' | 'high_school' | 'associate' | 'bachelor' | 'master' | 'phd'
  require_background_check?: boolean
  background_check_type?: string
  require_drug_test?: boolean
  require_drivers_license?: boolean
  drivers_license_type?: string
  security_clearance_required?: string
  travel_percentage?: number
  shift_requirements?: string

  // Compensation & Benefits
  benefits_summary?: string
  has_bonus_structure?: boolean
  bonus_details?: string
  has_equity?: boolean
  equity_details?: string
  sign_on_bonus_cents?: number
  has_relocation_package?: boolean
  relocation_package_details?: string
  overtime_eligible?: boolean
  pay_frequency?: 'hourly' | 'weekly' | 'biweekly' | 'semimonthly' | 'monthly'

  // Application Process
  requires_assessment?: boolean
  assessment_details?: string
  requires_video_interview?: boolean
  estimated_application_time_minutes?: number
  application_expiry_days?: number
  inquiry_capability_questions?: Array<{
    name: string
    label: string
    type: 'boolean' | 'number' | 'text'
    unit?: string
    required: boolean
  }>

  // Location & Scheduling
  relocation_assistance_offered?: boolean
  relocation_assistance_details?: string
  work_schedule_details?: string
  timezone?: string

  // Distribution & Visibility
  is_featured?: boolean
  featured_until?: string
  seo_keywords?: string[]
  external_application_url?: string

  // Compliance & Analytics
  eeo_job_category?: string
  is_veteran_friendly?: boolean
  is_disability_friendly?: boolean
  affirmative_action_plan?: boolean
  source_tracking_enabled?: boolean

  // Soft Skills Requirements
  required_soft_skills?: Array<{ skill_id: string; importance: number }> | null
}

type JobFormProps = {
  mode: 'create' | 'edit'
  jobId?: string
  initialData?: Partial<JobFormData>
  /** Names for the saved skills and certificates, so their chips can show. */
  initialRelations?: {
    skills?: Array<{ id: string; name: string }>
    certifications?: Array<{ id: string; name: string }>
  }
  onSuccess?: () => void
}

/**
 * Every core.jobs column the form edits beyond the basics. buildJobParams
 * sends them all; before #1342 it sent ten fields and the rest of the form was
 * never saved.
 */
const DETAIL_FIELDS = [
  'address',
  'hiring_manager_id',
  'recruiter_id',
  'require_current_location',
  'require_relocation_willingness',
  'minimum_years_experience',
  'require_work_authorization',
  'require_earliest_start_date',
  'enable_auto_reject',
  'auto_reject_criteria',
  'minimum_score',
  'internal_job_code',
  'department',
  'cost_center',
  'number_of_openings',
  'priority_level',
  'requisition_number',
  'job_category',
  'is_confidential',
  'application_deadline',
  'target_start_date',
  'estimated_hire_date',
  'scheduled_publish_at',
  'minimum_education_level',
  'require_background_check',
  'background_check_type',
  'require_drug_test',
  'require_drivers_license',
  'drivers_license_type',
  'security_clearance_required',
  'travel_percentage',
  'shift_requirements',
  'benefits_summary',
  'has_bonus_structure',
  'bonus_details',
  'has_equity',
  'equity_details',
  'sign_on_bonus_cents',
  'has_relocation_package',
  'relocation_package_details',
  'overtime_eligible',
  'pay_frequency',
  'requires_assessment',
  'assessment_details',
  'requires_video_interview',
  'estimated_application_time_minutes',
  'application_expiry_days',
  'inquiry_capability_questions',
  'relocation_assistance_offered',
  'relocation_assistance_details',
  'work_schedule_details',
  'timezone',
  'is_featured',
  'featured_until',
  'seo_keywords',
  'external_application_url',
  'eeo_job_category',
  'is_veteran_friendly',
  'is_disability_friendly',
  'affirmative_action_plan',
  'source_tracking_enabled',
  'required_soft_skills',
] as const satisfies ReadonlyArray<keyof JobFormData & keyof OfficeJobDetailParams>

/** Typed as YYYY-MM-DD in the form; checked before saving. */
const DATE_FIELDS = [
  'application_deadline',
  'target_start_date',
  'estimated_hire_date',
  'featured_until',
] as const

const isBlank = (value: unknown) =>
  value === undefined || value === null || (typeof value === 'string' && value.trim() === '')

/**
 * The form's starting values from a saved job (GET /v1/office/jobs/:id).
 * Date-only inputs show YYYY-MM-DD, so stored timestamps are cut to the day.
 */
export function officeJobToFormData(job: Record<string, unknown>): Partial<JobFormData> {
  const data: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(job)) {
    if (value !== null) data[key] = value
  }
  for (const key of DATE_FIELDS) {
    if (typeof data[key] === 'string') data[key] = (data[key] as string).slice(0, 10)
  }
  const skills = (job.skills ?? []) as Array<{ id: string; is_required: boolean }>
  data.skill_ids = skills.filter((s) => s.is_required).map((s) => s.id)
  data.optional_skill_ids = skills.filter((s) => !s.is_required).map((s) => s.id)
  data.certification_ids = ((job.certifications ?? []) as Array<{ id: string }>).map((c) => c.id)
  delete data.skills
  delete data.certifications
  return data as Partial<JobFormData>
}

export function JobForm({ mode, jobId, initialData, initialRelations, onSuccess }: JobFormProps) {
  const { theme } = useThemeContext()
  const geocodingProvider = useMapboxGeocodingProvider()
  const router = useRouter()
  const toast = useToast()
  const { data: organizationsData } = useAllOrganizations()

  const initialTeamIds =
    initialData?.team_ids ?? (initialData?.assigned_team_id ? [initialData.assigned_team_id] : [])
  const initialPrimaryTeamId =
    initialData?.primary_team_id ??
    initialData?.assigned_team_id ??
    (initialTeamIds.length > 0 ? initialTeamIds[0] : null)
  const [primaryTeamId, setPrimaryTeamId] = useState<string | null>(initialPrimaryTeamId)

  // Convert description to JSONContent if it's a string
  const getInitialDescription = (): JSONContent | null => {
    const desc = initialData?.description
    if (!desc) return null
    if (typeof desc === 'string') {
      return desc.trim() ? plainTextToTipTap(desc) : null
    }
    return desc as JSONContent
  }

  const [formData, setFormData] = useState<JobFormData>({
    // Every saved field, then the ones that need a default or a conversion.
    ...initialData,
    title: initialData?.title || '',
    description: getInitialDescription(),
    organization_id: initialData?.organization_id || '',
    assigned_team_id: initialPrimaryTeamId ?? null,
    team_ids: initialTeamIds,
    primary_team_id: initialPrimaryTeamId ?? null,
    employment_type: initialData?.employment_type,
    remote_option: initialData?.remote_option,
    location: initialData?.location || '',
    address: initialData?.address,
    pay_range_min_cents: initialData?.pay_range_min_cents,
    pay_range_max_cents: initialData?.pay_range_max_cents,
    pay_range_type: initialData?.pay_range_type,
    position_level: initialData?.position_level || '',
    hiring_manager_id: initialData?.hiring_manager_id,
    recruiter_id: initialData?.recruiter_id,
    skill_ids: initialData?.skill_ids || [],
    optional_skill_ids: initialData?.optional_skill_ids || [],
    certification_ids: initialData?.certification_ids || [],
    inquiry_capability_questions: initialData?.inquiry_capability_questions || [],
    required_soft_skills: initialData?.required_soft_skills || null,
  })

  // Auto-select organization if only one available
  useEffect(() => {
    if (
      organizationsData?.organizations &&
      organizationsData.organizations.length === 1 &&
      !formData.organization_id
    ) {
      const orgId = organizationsData.organizations[0].id
      if (orgId) {
        setFormData((prev) => ({
          ...prev,
          organization_id: orgId,
        }))
      }
    }
  }, [organizationsData, formData.organization_id])

  const toggleTeamSelection = (teamId: string, checked: boolean) => {
    setFormData((prev) => {
      const current = prev.team_ids ?? []
      let next = current
      if (checked) {
        if (!current.includes(teamId)) {
          next = [...current, teamId]
        }
      } else {
        next = current.filter((id) => id !== teamId)
      }

      if (next === current) {
        return prev
      }

      return {
        ...prev,
        team_ids: next,
      }
    })

    if (checked) {
      setPrimaryTeamId((prev) => prev ?? teamId)
    } else {
      setPrimaryTeamId((prev) => (prev === teamId ? null : prev))
    }
  }

  const teamsQueryEnabled = Boolean(formData.organization_id)
  const { data: teamsData, isLoading: teamsLoading } = useTeams(
    {
      organizationId: formData.organization_id || undefined,
      includeArchived: false,
    },
    { enabled: teamsQueryEnabled }
  )
  const teams = (teamsData?.teams ?? []) as Array<{ id: string; name: string | null }>

  useEffect(() => {
    if (formData.organization_id) {
      return
    }

    if (
      (formData.team_ids && formData.team_ids.length > 0) ||
      formData.assigned_team_id ||
      formData.primary_team_id
    ) {
      setFormData((prev) => {
        if (
          (!prev.team_ids || prev.team_ids.length === 0) &&
          prev.assigned_team_id === null &&
          prev.primary_team_id === null
        ) {
          return prev
        }

        return {
          ...prev,
          team_ids: [],
          assigned_team_id: null,
          primary_team_id: null,
        }
      })
      setPrimaryTeamId(null)
    }
  }, [
    formData.organization_id,
    formData.team_ids,
    formData.assigned_team_id,
    formData.primary_team_id,
  ])

  useEffect(() => {
    if (teamsLoading) {
      return
    }

    const availableIds = new Set(teams.map((team) => team.id))

    setFormData((prev) => {
      const currentTeamIds = prev.team_ids ?? []
      const filtered = currentTeamIds.filter((id) => availableIds.has(id))
      const nextAssigned =
        prev.assigned_team_id && availableIds.has(prev.assigned_team_id)
          ? prev.assigned_team_id
          : null
      const nextPrimary =
        prev.primary_team_id && availableIds.has(prev.primary_team_id) ? prev.primary_team_id : null

      if (
        filtered.length === currentTeamIds.length &&
        nextAssigned === prev.assigned_team_id &&
        nextPrimary === prev.primary_team_id
      ) {
        return prev
      }

      return {
        ...prev,
        team_ids: filtered,
        assigned_team_id: nextAssigned,
        primary_team_id: nextPrimary,
      }
    })
  }, [teamsLoading, teams])

  useEffect(() => {
    const selectedTeamIds = formData.team_ids ?? []
    if (selectedTeamIds.length === 0) {
      if (primaryTeamId !== null) {
        setPrimaryTeamId(null)
      }
      return
    }

    if (!primaryTeamId || !selectedTeamIds.includes(primaryTeamId)) {
      const nextPrimary = selectedTeamIds[0] ?? null
      if (nextPrimary !== primaryTeamId) {
        setPrimaryTeamId(nextPrimary)
      }
    }
  }, [formData.team_ids, primaryTeamId])

  useEffect(() => {
    setFormData((prev) => {
      if (prev.assigned_team_id === primaryTeamId && prev.primary_team_id === primaryTeamId) {
        return prev
      }

      return {
        ...prev,
        assigned_team_id: primaryTeamId ?? null,
        primary_team_id: primaryTeamId ?? null,
      }
    })
  }, [primaryTeamId])

  const createJob = useOfficeCreateJobMutation({
    onSuccess: () => {
      toast.show({
        title: 'Job created successfully',
        message: '',
        variant: 'success',
      })
      onSuccess?.()
      router.back()
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : 'An error occurred'
      toast.show({
        title: `Error: ${message}`,
        message: '',
        variant: 'error',
      })
    },
  })

  const updateJob = useOfficeUpdateJobMutation({
    onSuccess: () => {
      toast.show({
        title: 'Job updated successfully',
        message: '',
        variant: 'success',
      })
      onSuccess?.()
      router.back()
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : 'An error occurred'
      toast.show({
        title: `Error: ${message}`,
        message: '',
        variant: 'error',
      })
    },
  })

  // Section update handlers
  const handleSectionUpdate = (data: Partial<JobFormData>) => {
    setFormData((prev) => ({ ...prev, ...data }))
  }

  const handleScoreUpdate = (score?: number) => {
    setFormData((prev) => ({ ...prev, minimum_score: score }))
  }

  const handleAutoRejectUpdate = (data: {
    enable_auto_reject: boolean
    auto_reject_criteria: {
      score_minimum?: number
      require_work_authorization?: boolean
      require_all_skills?: boolean
      require_all_certifications?: boolean
    }
  }) => {
    setFormData((prev) => ({ ...prev, ...data }))
  }

  // SC-123 / SC-124: derive both the plain-text description (for the
  // disable predicate and for submission) and a fully-typed params object
  // from `formData`. Previously `handleSubmit` built a generic
  // `Record<string, unknown>` and double-cast through `unknown` into the
  // mutation params, so a missing required field (title / description /
  // organization_id) was only caught by the server 400 — and the
  // Save-as-draft button didn't enforce the same minimums as the server.
  const descriptionPlainText = useMemo(() => {
    if (!formData.description) return ''
    return typeof formData.description === 'string'
      ? formData.description
      : extractPlainText(formData.description as JSONContent)
  }, [formData.description])

  const meetsDraftMinimums =
    formData.title.trim().length >= JOB_TITLE_MIN_LENGTH &&
    descriptionPlainText.trim().length >= JOB_DESCRIPTION_MIN_LENGTH &&
    !!formData.organization_id

  const buildJobParams = (asDraft: boolean): OfficeCreateJobParams => {
    const shouldBeDraft = asDraft || !!formData.scheduled_publish_at
    const params: OfficeCreateJobParams = {
      organization_id: formData.organization_id,
      title: formData.title,
      description: descriptionPlainText,
      status: shouldBeDraft ? 'draft' : 'open',
    }
    if (formData.employment_type) {
      params.employment_type = formData.employment_type as EmploymentType
    }
    if (formData.remote_option) {
      params.remote_option = formData.remote_option as RemoteOption
    }
    if (formData.position_level) params.position_level = formData.position_level
    if (formData.location) params.location = formData.location
    if (typeof formData.pay_range_min_cents === 'number') {
      params.pay_range_min_cents = formData.pay_range_min_cents
    }
    if (typeof formData.pay_range_max_cents === 'number') {
      params.pay_range_max_cents = formData.pay_range_max_cents
    }
    if (formData.pay_range_type) {
      params.pay_range_type = formData.pay_range_type as PayRangeType
    }

    // The rest of the form (#1342). Creating, a blank field is left out;
    // editing, it is sent as null so clearing a field clears it.
    const detail = params as unknown as Record<string, unknown>
    for (const key of DETAIL_FIELDS) {
      const value = formData[key]
      if (!isBlank(value)) detail[key] = value
      else if (mode === 'edit') detail[key] = null
    }
    if (mode === 'edit') {
      for (const key of [
        'employment_type',
        'remote_option',
        'position_level',
        'location',
        'pay_range_min_cents',
        'pay_range_max_cents',
        'pay_range_type',
      ] as const) {
        if (isBlank(formData[key])) detail[key] = null
      }
    }
    params.skill_ids = formData.skill_ids ?? []
    params.optional_skill_ids = formData.optional_skill_ids ?? []
    params.certification_ids = formData.certification_ids ?? []
    params.team_ids = formData.team_ids ?? []
    params.primary_team_id = formData.primary_team_id ?? null
    return params
  }

  /** A half-typed date would fail the save; say which one instead. */
  const invalidDateField = DATE_FIELDS.find((key) => {
    const value = formData[key]
    return !isBlank(value) && !/^\d{4}-\d{2}-\d{2}$/.test(String(value).trim())
  })

  const handleSubmit = (asDraft = true) => {
    if (!meetsDraftMinimums) {
      // The disable predicate should have caught this, but guard anyway —
      // mirrors the server-side createJobBodySchema floor.
      toast.show({
        title: 'Missing required fields',
        message: `Title must be at least ${JOB_TITLE_MIN_LENGTH} characters, description at least ${JOB_DESCRIPTION_MIN_LENGTH}, and an organization is required.`,
        variant: 'error',
      })
      return
    }

    if (invalidDateField) {
      toast.show({
        title: 'Check the dates',
        message: `${invalidDateField.replace(/_/g, ' ')} must be a date like 2027-01-31.`,
        variant: 'error',
      })
      return
    }

    const params = buildJobParams(asDraft)

    if (mode === 'create') {
      createJob.mutate(params)
    } else if (jobId) {
      const updateParams: OfficeUpdateJobParams = { ...params }
      updateJob.mutate({ id: jobId, params: updateParams })
    }
  }

  const isLoading = createJob.isPending || updateJob.isPending
  const organizations = organizationsData?.organizations || []
  const [previewOpen, setPreviewOpen] = useState(false)

  type Organization = { id: string; name: string; slug: string; owner_user_id: string | null }

  // Skills and certifications handlers
  const searchParentSkillsMutation = useSearchParentSkillsMutation()
  const { data: primaryIndustryData } = usePrimaryIndustry()
  const jobsClient = useScaffaldJobsClient()

  const handleSearchSkills = useCallback(
    async (query: string) => {
      if (!query.trim()) return []
      const industryId = primaryIndustryData?.primary_industry_id
      if (!industryId) {
        return []
      }
      try {
        const result = await searchParentSkillsMutation.mutateAsync({
          query,
          industryId,
          limit: 25,
        })
        type SkillHit = {
          skill_id: string
          skill_name: string
          csi_display: string | null
          csi_code: string[] | null
          child_count: number
        }
        // Jobs store CSI MasterFormat skills only (core.job_skills); the
        // search also returns industry skills, which have no CSI code.
        return ((result.skills || []) as unknown as SkillHit[])
          .filter((skill) => skill.csi_display !== null)
          .map((skill) => ({
          id: skill.skill_id,
          name: skill.skill_name,
          code: skill.csi_display || skill.skill_id,
        }))
      } catch (error) {
        console.error('Failed to search skills', error)
        return []
      }
    },
    [searchParentSkillsMutation, primaryIndustryData]
  )

  // The certification catalog the profile uses (data.certifications), which
  // job_certifications now references (migration 394). This was a stub that
  // always answered nothing (#1342).
  const handleSearchCertifications = useCallback(
    async (query: string) => {
      if (!query.trim() || !jobsClient) return []
      try {
        const result = await jobsClient.certifications.getTopLevelCertifications({
          search: query.trim(),
          limit: 25,
        })
        return ((result.certifications ?? []) as Array<{ id: string; title: string }>).map(
          (cert) => ({ id: cert.id, name: cert.title })
        )
      } catch (error) {
        console.error('Failed to search certifications', error)
        return []
      }
    },
    [jobsClient]
  )

  return (
    // The page scrolls; a scroll view here boxed the form inside the screen
    // shell, and on a phone the inner box was the one that scrolled.
    <Stack gap={20}>
      <ScreenHeader
        title={mode === 'edit' ? 'Edit posting' : 'Post a job'}
        tip="Everything here is editable later. A draft is saved as soon as it has a title and an organisation."
        actions={
          <Row gap={8} wrap>
            <Button
              data-testid="job-save-draft-button"
              size="sm"
              variant="outline"
              onPress={() => handleSubmit(true)}
              // SC-123: mirror the server's createJobBodySchema floor so a
              // tap can't bypass into a guaranteed-fail submission.
              disabled={isLoading || !meetsDraftMinimums}
            >
              {isLoading && <Spinner variant="ios" />}
              {!isLoading && 'Save draft'}
            </Button>
            <Button
              data-testid="job-publish-button"
              size="sm"
              variant="filled"
              color="primary"
              onPress={() => handleSubmit(false)}
              // SC-123: same floor as Save-as-draft plus a location and a
              // valid (future) scheduled-publish-at if set.
              disabled={Boolean(
                isLoading ||
                  !meetsDraftMinimums ||
                  !formData.location ||
                  (formData.scheduled_publish_at &&
                    new Date(formData.scheduled_publish_at) <= new Date())
              )}
            >
              {isLoading && <Spinner variant="ios" />}
              {!isLoading && (formData.scheduled_publish_at ? 'Schedule' : 'Post')}
            </Button>
          </Row>
        }
      />
        {/* Organization Selector */}
        <Stack gap={8}>
          <ResponsiveSelect
            testID="job-organization-select"
            value={formData.organization_id}
            onValueChange={(value: string) => setFormData({ ...formData, organization_id: value })}
            placeholder="Select organization"
            // Required, marked like the other required fields; the separate
            // "Organization *" text above printed the label twice (#1026).
            label="Organization *"
            options={organizations.map((org: Organization) => ({
              value: org.id,
              label: org.name,
            }))}
          />
        </Stack>

        {/* The role. Sections sit on hairlines rather than in bordered
            boxes, and open with a real heading — the form had three nested
            cards each titled by a plain <Text> (#835). */}
        <Separator />
        <Stack gap={16}>
          <H3>The role</H3>

          {/* Title */}
          <Stack gap={8}>
            <Text>Job title *</Text>
            <Input
              data-testid="job-title-input"
              placeholder="e.g. Senior Construction Manager"
              value={formData.title}
              onChangeText={(text: string) => setFormData({ ...formData, title: text })}
              disabled={isLoading}
            />
          </Stack>

          {/* Description */}
          <Stack gap={8}>
            <Text>Job description *</Text>
            <RichTextEditor
              data-testid="job-description-input"
              value={
                formData.description != null
                  ? typeof formData.description === 'string'
                    ? formData.description
                    : extractPlainText(formData.description as JSONContent)
                  : ''
              }
              onChange={(value: string) =>
                setFormData({ ...formData, description: value })
              }
              placeholder="e.g. responsibilities, expectations and requirements"
              disabled={isLoading}
              minHeight={200}
            />
          </Stack>

          {/* Location with Smart Autocomplete */}
          <Stack gap={8}>
            <Text>Location *</Text>
            <AddressForm
              mode="hybrid"
              placeholder="Search location"
              provider={geocodingProvider}
              searchOptions={{ zoomLevel: 'city' }}
              addressValue={{
                streetAddress: formData.address?.street || '',
                locality: formData.address?.city || '',
                stateAbbreviation: formData.address?.state || '',
                postalCode: formData.address?.zip || '',
                country: formData.address?.country || '',
                formattedAddress: formData.location || '',
              }}
              value={formData.location}
              onChange={(text: string) => setFormData({ ...formData, location: text })}
              onAddressSelect={(address: AddressResult) => {
                setFormData({
                  ...formData,
                  location: address.formattedAddress,
                  address: {
                    street: address.streetAddress || address.route || '',
                    city: address.locality || '',
                    state: address.stateAbbreviation || address.administrativeAreaLevel1 || '',
                    zip: address.postalCode || '',
                    country: address.country || 'United States',
                    latitude: address.coordinates?.lat,
                    longitude: address.coordinates?.lng,
                  },
                })
              }}
            />
          </Stack>

          {/* SC-121: employment_type, remote_option, pay_range — these fields
              live on createJobBodySchema (server) and OfficeCreateJobParams
              (SDK) but had no UI surface in the form, so jobs always shipped
              with `employment_type = null` / `remote_option = null` / no pay
              range. Workers couldn't filter by them on the discovery side. */}
          <Row gap={8}>
            <Stack gap={8} flex={1}>
              <ResponsiveSelect
                value={formData.employment_type ?? ''}
                onValueChange={(value: string) =>
                  setFormData({ ...formData, employment_type: value || undefined })
                }
                placeholder="Select"
                label="Employment type"
                options={[
                  { value: 'full_time', label: 'Full-time' },
                  { value: 'part_time', label: 'Part-time' },
                  { value: 'contract', label: 'Contract' },
                  { value: 'temp', label: 'Temporary' },
                  { value: 'intern', label: 'Internship' },
                ]}
              />
            </Stack>
            <Stack gap={8} flex={1}>
              <ResponsiveSelect
                value={formData.remote_option ?? ''}
                onValueChange={(value: string) =>
                  setFormData({ ...formData, remote_option: value || undefined })
                }
                placeholder="Select"
                label="Work arrangement"
                options={[
                  { value: 'on_site', label: 'On-site' },
                  { value: 'hybrid', label: 'Hybrid' },
                  { value: 'remote', label: 'Remote' },
                ]}
              />
            </Stack>
          </Row>

          <Stack gap={8}>
            <Text>Pay range</Text>
            <Row gap={8}>
              <Stack gap={4} flex={1}>
                <Input
                  data-testid="job-pay-min-input"
                  placeholder="Min ($)"
                  keyboardType="numeric"
                  value={
                    typeof formData.pay_range_min_cents === 'number'
                      ? (formData.pay_range_min_cents / 100).toString()
                      : ''
                  }
                  onChangeText={(text: string) => {
                    const parsed = parseFloat(text)
                    setFormData({
                      ...formData,
                      pay_range_min_cents: Number.isFinite(parsed)
                        ? Math.max(0, Math.round(parsed * 100))
                        : undefined,
                    })
                  }}
                  disabled={isLoading}
                />
              </Stack>
              <Stack gap={4} flex={1}>
                <Input
                  data-testid="job-pay-max-input"
                  placeholder="Max ($)"
                  keyboardType="numeric"
                  value={
                    typeof formData.pay_range_max_cents === 'number'
                      ? (formData.pay_range_max_cents / 100).toString()
                      : ''
                  }
                  onChangeText={(text: string) => {
                    const parsed = parseFloat(text)
                    setFormData({
                      ...formData,
                      pay_range_max_cents: Number.isFinite(parsed)
                        ? Math.max(0, Math.round(parsed * 100))
                        : undefined,
                    })
                  }}
                  disabled={isLoading}
                />
              </Stack>
              <Stack gap={4} flex={1}>
                <ResponsiveSelect
                  value={formData.pay_range_type ?? ''}
                  onValueChange={(value: string) =>
                    setFormData({ ...formData, pay_range_type: value || undefined })
                  }
                  placeholder="Type"
                  label="Pay range type"
                  options={[
                    { value: 'hourly', label: 'Hourly' },
                    { value: 'salary', label: 'Salary' },
                    { value: 'contract', label: 'Contract' },
                    { value: 'project', label: 'Project' },
                  ]}
                />
              </Stack>
            </Row>
          </Stack>

          {/* Minimum Scaffald Score */}
          <ScoreThresholdSection
            minimumScore={formData.minimum_score}
            onUpdate={handleScoreUpdate}
          />

          {/* Scaffald Teams */}
          <Stack gap={8}>
            <Text>Scaffald Teams</Text>
            {!formData.organization_id ? (
              <Text style={{ color: colors.text[theme].secondary }}>
                Select an organization to load available teams.
              </Text>
            ) : teamsLoading ? (
              <Text style={{ color: colors.text[theme].secondary }}>Loading teams…</Text>
            ) : teams.length === 0 ? (
              <Text style={{ color: colors.text[theme].secondary }}>
                No teams available for this organization.
              </Text>
            ) : (
              <ResponsiveSelect
                value={primaryTeamId || ''}
                onValueChange={(value: string) => {
                  if (value) {
                    setPrimaryTeamId(value)
                    toggleTeamSelection(value, true)
                  }
                }}
                placeholder="Select one"
                label="Primary Team"
                options={teams.map((team) => ({
                  value: team.id,
                  label: team.name ?? 'Untitled Team',
                }))}
              />
            )}
            <Text style={{ color: colors.text[theme].secondary }}>Not visible on job posting</Text>
          </Stack>
        </Stack>

        {/* What the applicant is asked for. */}
        <Separator />
        <Stack gap={16}>
          <H3>Applying</H3>

          {/* Application Screening Section */}
          <ApplicationScreeningSection
            requireCurrentLocation={formData.require_current_location || false}
            requireRelocationWillingness={formData.require_relocation_willingness || false}
            minimumYearsExperience={formData.minimum_years_experience}
            requireWorkAuthorization={formData.require_work_authorization || false}
            requireEarliestStartDate={formData.require_earliest_start_date || false}
            onUpdate={handleSectionUpdate}
          />

          {/* Required Skills */}
          <Stack gap={8}>
            <Text>Required skills</Text>
            <JobTaxonomyPicker
              testID="job-required-skills"
              selectedIds={formData.skill_ids || []}
              onChange={(skillIds) => setFormData((prev) => ({ ...prev, skill_ids: skillIds }))}
              onSearch={handleSearchSkills}
              initialItems={initialRelations?.skills}
              placeholder="Search and add skills"
              disabled={isLoading}
            />
          </Stack>

          {/* Optional Skills */}
          <Stack gap={8}>
            <Text>Optional skills</Text>
            <JobTaxonomyPicker
              testID="job-optional-skills"
              selectedIds={formData.optional_skill_ids || []}
              onChange={(skillIds) =>
                setFormData((prev) => ({ ...prev, optional_skill_ids: skillIds }))
              }
              onSearch={handleSearchSkills}
              initialItems={initialRelations?.skills}
              placeholder="Search and add skills"
              disabled={isLoading}
            />
          </Stack>

          {/* Required Certificates */}
          <Stack gap={8}>
            <Text>Required certificates</Text>
            <JobTaxonomyPicker
              testID="job-required-certificates"
              selectedIds={formData.certification_ids || []}
              onChange={(certIds) => setFormData((prev) => ({ ...prev, certification_ids: certIds }))}
              onSearch={handleSearchCertifications}
              initialItems={initialRelations?.certifications}
              placeholder="Search certificates"
              disabled={isLoading}
            />
          </Stack>

          {/* Auto-Rejection Section */}
          <AutoRejectionSection
            enabled={formData.enable_auto_reject || false}
            criteria={formData.auto_reject_criteria || {}}
            onUpdate={handleAutoRejectUpdate}
          />
        </Stack>

        {/* Additional Sections (keep existing advanced sections) */}
        <JobMetadataSection
          internalJobCode={formData.internal_job_code}
          department={formData.department}
          costCenter={formData.cost_center}
          hiringManagerId={formData.hiring_manager_id}
          recruiterId={formData.recruiter_id}
          numberOfOpenings={formData.number_of_openings}
          priorityLevel={formData.priority_level}
          requisitionNumber={formData.requisition_number}
          jobCategory={formData.job_category}
          isConfidential={formData.is_confidential}
          applicationDeadline={formData.application_deadline}
          targetStartDate={formData.target_start_date}
          estimatedHireDate={formData.estimated_hire_date}
          onUpdate={handleSectionUpdate}
        />

        {/* Enhanced Requirements Section */}
        <EnhancedRequirementsSection
          minimumEducationLevel={formData.minimum_education_level}
          requireBackgroundCheck={formData.require_background_check}
          backgroundCheckType={formData.background_check_type}
          requireDrugTest={formData.require_drug_test}
          requireDriversLicense={formData.require_drivers_license}
          driversLicenseType={formData.drivers_license_type}
          securityClearanceRequired={formData.security_clearance_required}
          travelPercentage={formData.travel_percentage}
          shiftRequirements={formData.shift_requirements}
          onUpdate={handleSectionUpdate}
        />

        {/* Soft Skills Requirements Section */}
        <SoftSkillsRequirementsSection
          requiredSoftSkills={formData.required_soft_skills}
          onUpdate={handleSectionUpdate}
        />

        {/* Compensation & Benefits Section */}
        <CompensationBenefitsSection
          benefitsSummary={formData.benefits_summary}
          hasBonusStructure={formData.has_bonus_structure}
          bonusDetails={formData.bonus_details}
          hasEquity={formData.has_equity}
          equityDetails={formData.equity_details}
          signOnBonusCents={formData.sign_on_bonus_cents}
          hasRelocationPackage={formData.has_relocation_package}
          relocationPackageDetails={formData.relocation_package_details}
          overtimeEligible={formData.overtime_eligible}
          payFrequency={formData.pay_frequency}
          onUpdate={handleSectionUpdate}
        />

        {/* Application Process Section */}
        <ApplicationProcessSection
          requiresAssessment={formData.requires_assessment}
          assessmentDetails={formData.assessment_details}
          requiresVideoInterview={formData.requires_video_interview}
          estimatedApplicationTimeMinutes={formData.estimated_application_time_minutes}
          applicationExpiryDays={formData.application_expiry_days}
          inquiryCapabilityQuestions={formData.inquiry_capability_questions}
          onUpdate={handleSectionUpdate}
        />

        {/* Location & Scheduling Section */}
        <LocationSchedulingSection
          relocationAssistanceOffered={formData.relocation_assistance_offered}
          relocationAssistanceDetails={formData.relocation_assistance_details}
          workScheduleDetails={formData.work_schedule_details}
          timezone={formData.timezone}
          onUpdate={handleSectionUpdate}
        />

        {/* Distribution & Visibility Section */}
        <DistributionVisibilitySection
          isFeatured={formData.is_featured}
          featuredUntil={formData.featured_until}
          seoKeywords={formData.seo_keywords}
          externalApplicationUrl={formData.external_application_url}
          onUpdate={handleSectionUpdate}
        />

        {/* Compliance & Analytics Section */}
        <ComplianceAnalyticsSection
          eeoJobCategory={formData.eeo_job_category}
          isVeteranFriendly={formData.is_veteran_friendly}
          isDisabilityFriendly={formData.is_disability_friendly}
          affirmativeActionPlan={formData.affirmative_action_plan}
          sourceTrackingEnabled={formData.source_tracking_enabled}
          onUpdate={handleSectionUpdate}
        />

        {/* When it goes live. */}
        <Separator />
        <Stack gap={12}>
          <H3>Publishing</H3>
          <Row gap={12} align="center" justify="space-between">
            <Toggle
              checked={!!formData.scheduled_publish_at}
              onChange={(checked) => {
                if (checked) {
                  const defaultDate = new Date()
                  defaultDate.setHours(defaultDate.getHours() + 1)
                  defaultDate.setMinutes(0)
                  setFormData((prev) => ({
                    ...prev,
                    scheduled_publish_at: defaultDate.toISOString(),
                  }))
                } else {
                  setFormData((prev) => ({
                    ...prev,
                    scheduled_publish_at: undefined,
                  }))
                }
              }}
              label="Schedule Publish"
              helperText="Set a date and time to automatically publish this job"
            />
          </Row>
          {formData.scheduled_publish_at && (
            <Stack gap={8}>
              <Text style={{ color: colors.text[theme].secondary }}>Publish Date & Time</Text>
              <Input
                value={
                  formData.scheduled_publish_at
                    ? new Date(formData.scheduled_publish_at).toISOString().slice(0, 16)
                    : ''
                }
                onChangeText={(text) => {
                  if (text) {
                    try {
                      // Parse datetime-local format (YYYY-MM-DDTHH:mm)
                      const date = new Date(text)
                      if (!Number.isNaN(date.getTime())) {
                        setFormData((prev) => ({
                          ...prev,
                          scheduled_publish_at: date.toISOString(),
                        }))
                      }
                    } catch (_error) {
                      // Invalid date, ignore
                    }
                  } else {
                    setFormData((prev) => ({
                      ...prev,
                      scheduled_publish_at: undefined,
                    }))
                  }
                }}
                placeholder="YYYY-MM-DDTHH:mm (e.g., 2024-12-25T09:00)"
                disabled={isLoading}
                keyboardType="default"
              />
              <Text style={{ color: colors.text[theme].secondary }}>
                {formData.scheduled_publish_at &&
                  `Will be published on ${new Date(formData.scheduled_publish_at).toLocaleString()}`}
              </Text>
            </Stack>
          )}
        </Stack>

        {/* Actions */}
        {/* Cancel and Preview stay at the foot of the form. Save and Post
            are in the header (#835) — they are what the screen is for, and
            on a long form they were a scroll away from everything. */}
        <Separator />
        <Row gap={12} paddingTop={4} wrap>
          <Button
            data-testid="job-cancel-button"
            variant="outline"
            onPress={() => router.back()}
            disabled={isLoading}
          >
            Cancel
          </Button>
          {jobId && (
            <Button
              data-testid="job-preview-button"
              variant="outline"
              iconStart={Eye}
              onPress={() => setPreviewOpen(true)}
              disabled={isLoading || !formData.title || !formData.organization_id}
            >
              Preview
            </Button>
          )}
        </Row>
        {jobId && (
          <JobPreviewModal jobId={jobId} open={previewOpen} onOpenChange={setPreviewOpen} />
        )}
    </Stack>
  )
}
