import { useState, useEffect, useCallback } from 'react'
import {
  YStack,
  XStack,
  Text,
  Input,
  Button,
  Spinner,
  ScrollView,
  AddressForm,
  CustomCheckbox,
} from '@app/ui'
import { Adapt, Sheet, Select, Card } from 'tamagui'
import type { AddressResult } from '@app/ui'
import type { JSONContent } from '@tiptap/core'
import { RichTextEditor } from '@app/ui/components/rich-text'
import { plainTextToTipTap, extractPlainText } from '@app/ui/components/rich-text'
import { api } from '@app/core/utils/api'
import { useToastController } from '@tamagui/toast'
import { useRouter } from 'expo-router'
import { useAllOrganizations } from '@app/core/utils/useAllOrganizations'
import { Check, ChevronDown, X, Eye, Calendar } from '@tamagui/lucide-icons'
import { Switch } from 'tamagui'
import { JobPreviewModal } from './JobPreviewModal'
import {
  ApplicationScreeningSection,
  AutoRejectionSection,
  ScoreThresholdSection,
  JobMetadataSection,
  EnhancedRequirementsSection,
  CompensationBenefitsSection,
  ApplicationProcessSection,
  LocationSchedulingSection,
  DistributionVisibilitySection,
  ComplianceAnalyticsSection,
} from './job-form-sections'

type JobFormData = {
  // Basic fields
  title: string
  description: string | JSONContent | null
  organization_id: string
  skill_ids?: string[]
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
}

type JobFormProps = {
  mode: 'create' | 'edit'
  jobId?: string
  initialData?: Partial<JobFormData>
  onSuccess?: () => void
}


export function JobForm({ mode, jobId, initialData, onSuccess }: JobFormProps) {
  const router = useRouter()
  const toast = useToastController()
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
    certification_ids: initialData?.certification_ids || [],
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
  const { data: teamsData, isLoading: teamsLoading } = api.teams.list.useQuery(
    {
      organizationId: formData.organization_id || undefined,
      includeArchived: false,
    },
    { enabled: teamsQueryEnabled },
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
      const nextAssigned = prev.assigned_team_id && availableIds.has(prev.assigned_team_id)
        ? prev.assigned_team_id
        : null
      const nextPrimary = prev.primary_team_id && availableIds.has(prev.primary_team_id)
        ? prev.primary_team_id
        : null

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
      if (
        prev.assigned_team_id === primaryTeamId &&
        prev.primary_team_id === primaryTeamId
      ) {
        return prev
      }

      return {
        ...prev,
        assigned_team_id: primaryTeamId ?? null,
        primary_team_id: primaryTeamId ?? null,
      }
    })
  }, [primaryTeamId])

  const createJob = api.office.createJob.useMutation({
    onSuccess: () => {
      toast.show('Job created successfully', { variant: 'success' })
      onSuccess?.()
      router.back()
    },
    onError: (error: Error) => {
      toast.show(`Error: ${error.message}`, { variant: 'error' })
    },
  })

  const updateJob = api.office.updateJob.useMutation({
    onSuccess: () => {
      toast.show('Job updated successfully', { variant: 'success' })
      onSuccess?.()
      router.back()
    },
    onError: (error: Error) => {
      toast.show(`Error: ${error.message}`, { variant: 'error' })
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

  const handleSubmit = (asDraft = true) => {
    // Build submit data, excluding empty strings for optional enums
    // Convert description to plain text or JSON based on API expectations
    const descriptionValue = formData.description
      ? typeof formData.description === 'string'
        ? formData.description
        : extractPlainText(formData.description as JSONContent)
      : ''

    // If scheduled_publish_at is set, always keep as draft (cron will publish it)
    // Otherwise, use the asDraft parameter
    const shouldBeDraft = asDraft || !!formData.scheduled_publish_at

    const submitData: Record<string, unknown> = {
      title: formData.title,
      description: descriptionValue,
      organization_id: formData.organization_id,
      status: shouldBeDraft ? ('draft' as const) : ('open' as const),
    }

    // Include all optional fields if they have values
    for (const key of Object.keys(formData)) {
      const value = formData[key as keyof JobFormData]
      if (
        value !== undefined &&
        value !== '' &&
        value !== null &&
        key !== 'title' &&
        key !== 'description' &&
        key !== 'organization_id'
      ) {
        // Handle arrays
        if (Array.isArray(value)) {
          if (value.length > 0) {
            submitData[key] = value
          }
        } else {
          submitData[key] = value
        }
      }
    }

    if (mode === 'create') {
      createJob.mutate(submitData)
    } else if (jobId) {
      updateJob.mutate({ id: jobId, ...submitData })
    }
  }

  const isLoading = createJob.isPending || updateJob.isPending
  const organizations = organizationsData?.organizations || []
  const [previewOpen, setPreviewOpen] = useState(false)

  type Organization = { id: string; name: string; slug: string; owner_user_id: string | null }

  // Skills and certifications handlers
  const searchSkillsMutation = api.profile.skillsMultiTaxonomy.searchSkills.useMutation()
  const { data: primaryIndustryData } = api.profile.skillsMultiTaxonomy.getPrimaryIndustry.useQuery()
  const searchCertificationsQuery = api.office.searchCertifications.useQuery(
    { query: '', limit: 50 },
    { enabled: false }
  )

  const handleSearchSkills = useCallback(
    async (query: string) => {
      if (!query.trim()) return []
      const industrySlug = primaryIndustryData?.industry?.slug ?? 'construction'
      try {
        const result = await searchSkillsMutation.mutateAsync({
          query,
          industrySlug,
          taxonomy: 'both',
          limit: 25,
        })
        return result.skills.map((skill: { skill_id: string; name: string; display_code?: string; code?: string }) => ({
          id: skill.skill_id,
          name: skill.name,
          code: skill.display_code || skill.code || skill.skill_id,
        }))
      } catch (error) {
        console.error('Failed to search skills', error)
        return []
      }
    },
    [searchSkillsMutation, primaryIndustryData]
  )

  const handleSearchCertifications = useCallback(
    async (query: string) => {
      if (!query.trim()) return []
      try {
        const result = await searchCertificationsQuery.refetch({ query, limit: 50 })
        return (
          result.data?.certifications?.map((cert: { id: string; name: string; slug: string }) => ({
            id: cert.id,
            name: cert.name,
            slug: cert.slug,
            parent_slug: null,
          })) || []
        )
      } catch (error) {
        console.error('Failed to search certifications', error)
        return []
      }
    },
    [searchCertificationsQuery]
  )

  // Inline component for skills input
  const JobSkillsInput = ({
    selectedSkillIds,
    onSkillsChange,
    onSearchSkills,
    placeholder,
    disabled,
  }: {
    selectedSkillIds: string[]
    onSkillsChange: (skillIds: string[]) => void
    onSearchSkills: (query: string) => Promise<Array<{ id: string; name: string; code: string }>>
    placeholder: string
    disabled?: boolean
  }) => {
    const [searchQuery, setSearchQuery] = useState('')
    const [searchResults, setSearchResults] = useState<
      Array<{ id: string; name: string; code: string }>
    >([])
    const [showResults, setShowResults] = useState(false)

    const handleSearch = useCallback(
      async (query: string) => {
        if (!query.trim()) {
          setSearchResults([])
          setShowResults(false)
          return
        }
        try {
          const results = await onSearchSkills(query)
          setSearchResults(results)
          setShowResults(true)
        } catch (error) {
          console.error('Error searching skills:', error)
        }
      },
      [onSearchSkills]
    )

    const debouncedSearch = useCallback(
      (() => {
        let timeout: ReturnType<typeof setTimeout>
        return (query: string) => {
          clearTimeout(timeout)
          timeout = setTimeout(() => handleSearch(query), 300)
        }
      })(),
      [handleSearch]
    )

    const handleAddSkill = (skill: { id: string; name: string; code: string }) => {
      if (!selectedSkillIds.includes(skill.id)) {
        setSelectedSkillsMap((prev) => new Map(prev).set(skill.id, skill))
        onSkillsChange([...selectedSkillIds, skill.id])
      }
      setSearchQuery('')
      setShowResults(false)
    }

    const handleRemoveSkill = (skillId: string) => {
      onSkillsChange(selectedSkillIds.filter((id) => id !== skillId))
    }

    // Store selected skills with names in component state
    const [selectedSkillsMap, setSelectedSkillsMap] = useState<
      Map<string, { id: string; name: string; code: string }>
    >(new Map())

    // Update map when skillIds change
    useEffect(() => {
      // Keep existing skills, remove ones not in selectedSkillIds
      setSelectedSkillsMap((prev) => {
        const next = new Map(prev)
        for (const [id] of next) {
          if (!selectedSkillIds.includes(id)) {
            next.delete(id)
          }
        }
        return next
      })
    }, [selectedSkillIds])

    const availableResults = searchResults.filter((skill) => !selectedSkillIds.includes(skill.id))
    const selectedSkills = Array.from(selectedSkillsMap.values())

    return (
      <YStack gap="$2" position="relative">
        <Input
          placeholder={placeholder}
          value={searchQuery}
          onChangeText={(text) => {
            setSearchQuery(text)
            debouncedSearch(text)
          }}
          onFocus={() => searchQuery && setShowResults(true)}
          disabled={disabled}
        />
        {selectedSkillIds.length > 0 && (
          <XStack gap="$2" flexWrap="wrap">
            {selectedSkills.map((skill) => (
              <XStack
                key={skill.id}
                bg="$gray3"
                px="$2"
                py="$1"
                rounded="$3"
                gap="$1"
                items="center"
              >
                <Text fontSize="$2">{skill.name}</Text>
                <Button
                  size="$1"
                  circular
                  unstyled
                  onPress={() => handleRemoveSkill(skill.id)}
                  disabled={disabled}
                >
                  <X size={12} />
                </Button>
              </XStack>
            ))}
          </XStack>
        )}
        {showResults && availableResults.length > 0 && (
          <Card
            position="absolute"
            top="$12"
            left={0}
            right={0}
            zIndex={1000}
            elevation="$4"
            height={300}
            overflow="hidden"
          >
            <ScrollView height={300}>
              <YStack>
                {availableResults.map((skill) => (
                  <Button
                    key={skill.id}
                    unstyled
                    onPress={() => handleAddSkill(skill)}
                    p="$3"
                    hoverStyle={{ bg: '$gray2' }}
                  >
                    <Text>{skill.name}</Text>
                  </Button>
                ))}
              </YStack>
            </ScrollView>
          </Card>
        )}
      </YStack>
    )
  }

  // Inline component for certifications input
  const JobCertificationsInput = ({
    selectedCertificationIds,
    onCertificationsChange,
    onSearchCertifications,
    placeholder,
    disabled,
  }: {
    selectedCertificationIds: string[]
    onCertificationsChange: (certIds: string[]) => void
    onSearchCertifications: (
      query: string
    ) => Promise<Array<{ id: string; name: string; slug: string; parent_slug: string | null }>>
    placeholder: string
    disabled?: boolean
  }) => {
    const [searchQuery, setSearchQuery] = useState('')
    const [searchResults, setSearchResults] = useState<
      Array<{ id: string; name: string; slug: string; parent_slug: string | null }>
    >([])
    const [showResults, setShowResults] = useState(false)

    const handleSearch = useCallback(
      async (query: string) => {
        if (!query.trim()) {
          setSearchResults([])
          setShowResults(false)
          return
        }
        try {
          const results = await onSearchCertifications(query)
          setSearchResults(results)
          setShowResults(true)
        } catch (error) {
          console.error('Error searching certifications:', error)
        }
      },
      [onSearchCertifications]
    )

    const debouncedSearch = useCallback(
      (() => {
        let timeout: ReturnType<typeof setTimeout>
        return (query: string) => {
          clearTimeout(timeout)
          timeout = setTimeout(() => handleSearch(query), 300)
        }
      })(),
      [handleSearch]
    )

    const handleAddCertification = (cert: {
      id: string
      name: string
      slug: string
      parent_slug: string | null
    }) => {
      if (!selectedCertificationIds.includes(cert.id)) {
        setSelectedCertsMap((prev) => new Map(prev).set(cert.id, cert))
        onCertificationsChange([...selectedCertificationIds, cert.id])
      }
      setSearchQuery('')
      setShowResults(false)
    }

    const handleRemoveCertification = (certId: string) => {
      onCertificationsChange(selectedCertificationIds.filter((id) => id !== certId))
    }

    // Store selected certifications with names in component state
    const [selectedCertsMap, setSelectedCertsMap] = useState<
      Map<string, { id: string; name: string; slug: string; parent_slug: string | null }>
    >(new Map())

    // Update map when certIds change
    useEffect(() => {
      setSelectedCertsMap((prev) => {
        const next = new Map(prev)
        for (const [id] of next) {
          if (!selectedCertificationIds.includes(id)) {
            next.delete(id)
          }
        }
        return next
      })
    }, [selectedCertificationIds])

    const availableResults = searchResults.filter(
      (cert) => !selectedCertificationIds.includes(cert.id)
    )
    const selectedCerts = Array.from(selectedCertsMap.values())

    return (
      <YStack gap="$2" position="relative">
        <Input
          placeholder={placeholder}
          value={searchQuery}
          onChangeText={(text) => {
            setSearchQuery(text)
            debouncedSearch(text)
          }}
          onFocus={() => searchQuery && setShowResults(true)}
          disabled={disabled}
        />
        {selectedCertificationIds.length > 0 && (
          <XStack gap="$2" flexWrap="wrap">
            {selectedCerts.map((cert) => (
              <XStack
                key={cert.id}
                bg="$gray3"
                px="$2"
                py="$1"
                rounded="$3"
                gap="$1"
                items="center"
              >
                <Text fontSize="$2">{cert.name}</Text>
                <Button
                  size="$1"
                  circular
                  unstyled
                  onPress={() => handleRemoveCertification(cert.id)}
                  disabled={disabled}
                >
                  <X size={12} />
                </Button>
              </XStack>
            ))}
          </XStack>
        )}
        {showResults && availableResults.length > 0 && (
          <Card
            position="absolute"
            top="$12"
            left={0}
            right={0}
            zIndex={1000}
            elevation="$4"
            height={300}
            overflow="hidden"
          >
            <ScrollView height={300}>
              <YStack>
                {availableResults.map((cert) => (
                  <Button
                    key={cert.id}
                    unstyled
                    onPress={() => handleAddCertification(cert)}
                    p="$3"
                    hoverStyle={{ bg: '$gray2' }}
                  >
                    <Text>{cert.name}</Text>
                  </Button>
                ))}
              </YStack>
            </ScrollView>
          </Card>
        )}
      </YStack>
    )
  }

  return (
    <ScrollView>
      <YStack gap="$4" p="$4">
        {/* Organization Selector */}
        <YStack gap="$2">
          <Text fontWeight="600">Organization *</Text>
          <Select
            data-testid="job-organization-select"
            value={formData.organization_id}
            onValueChange={(value: string) => setFormData({ ...formData, organization_id: value })}
          >
            <Select.Trigger iconAfter={ChevronDown}>
              <Select.Value placeholder="Select organization" />
            </Select.Trigger>

            <Adapt when="sm" platform="touch">
              <Sheet modal dismissOnSnapToBottom>
                <Sheet.Frame>
                  <Sheet.ScrollView>
                    <Adapt.Contents />
                  </Sheet.ScrollView>
                </Sheet.Frame>
                <Sheet.Overlay />
              </Sheet>
            </Adapt>

            <Select.Content zIndex={200000}>
              <Select.ScrollUpButton />
              <Select.Viewport>
                <Select.Group>
                  <Select.Label>Organizations</Select.Label>
                  {organizations.map((org: Organization, i: number) => (
                    <Select.Item key={org.id} index={i} value={org.id}>
                      <Select.ItemText>{org.name}</Select.ItemText>
                      <Select.ItemIndicator>
                        <Check size={16} />
                      </Select.ItemIndicator>
                    </Select.Item>
                  ))}
                </Select.Group>
              </Select.Viewport>
              <Select.ScrollDownButton />
            </Select.Content>
          </Select>
        </YStack>

        {/* Details Section */}
        <YStack
          gap="$4"
          p="$4"
          bg="$background"
          rounded="$4"
          borderWidth={1}
          borderColor="$borderColor"
        >
          <Text fontSize="$6" fontWeight="600">
            Details
          </Text>

          {/* Title */}
          <YStack gap="$2">
            <Text fontWeight="600">Job title *</Text>
            <Input
              data-testid="job-title-input"
              placeholder="e.g. Senior Construction Manager"
              value={formData.title}
              onChangeText={(text: string) => setFormData({ ...formData, title: text })}
              disabled={isLoading}
            />
          </YStack>

          {/* Description */}
          <YStack gap="$2">
            <Text fontWeight="600">Job description *</Text>
            <RichTextEditor
              data-testid="job-description-input"
              value={formData.description as JSONContent | null}
              onChange={(content: JSONContent) =>
                setFormData({ ...formData, description: content })
              }
              fieldType="JOB_DESCRIPTION"
              placeholder="e.g. responsibilities, expectations and requirements"
              disabled={isLoading}
              showCharacterCount
              minHeight={200}
            />
          </YStack>

          {/* Location with Smart Autocomplete */}
          <YStack gap="$2">
            <Text fontWeight="600">Location *</Text>
            <AddressForm
              mode="hybrid"
              placeholder="Search location"
              provider="mapbox"
              apiKey={process.env.EXPO_PUBLIC_MAPBOX_TOKEN}
              zoomLevel="city"
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
                console.log('Selected job location:', address)
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
          </YStack>

          {/* Minimum Elevate Score */}
          <ScoreThresholdSection minimumScore={formData.minimum_score} onUpdate={handleScoreUpdate} />

          {/* Elevate Teams */}
          <YStack gap="$2">
            <Text fontWeight="600">Elevate Teams</Text>
            {!formData.organization_id ? (
              <Text fontSize="$2" color="$color10">
                Select an organization to load available teams.
              </Text>
            ) : teamsLoading ? (
              <Text fontSize="$2" color="$color10">
                Loading teams…
              </Text>
            ) : teams.length === 0 ? (
              <Text fontSize="$2" color="$color10">
                No teams available for this organization.
              </Text>
            ) : (
              <Select
                value={primaryTeamId || ''}
                onValueChange={(value: string) => {
                  if (value) {
                    setPrimaryTeamId(value)
                    toggleTeamSelection(value, true)
                  }
                }}
              >
                <Select.Trigger iconAfter={ChevronDown}>
                  <Select.Value placeholder="Select one" />
                </Select.Trigger>
                <Adapt when="sm" platform="touch">
                  <Sheet modal dismissOnSnapToBottom>
                    <Sheet.Frame>
                      <Sheet.ScrollView>
                        <Adapt.Contents />
                      </Sheet.ScrollView>
                    </Sheet.Frame>
                    <Sheet.Overlay />
                  </Sheet>
                </Adapt>
                <Select.Content zIndex={200000}>
                  <Select.ScrollUpButton />
                  <Select.Viewport>
                    <Select.Group>
                      <Select.Label>Teams</Select.Label>
                      {teams.map((team, i) => (
                        <Select.Item key={team.id} index={i} value={team.id}>
                          <Select.ItemText>{team.name ?? 'Untitled Team'}</Select.ItemText>
                          <Select.ItemIndicator>
                            <Check size={16} />
                          </Select.ItemIndicator>
                        </Select.Item>
                      ))}
                    </Select.Group>
                  </Select.Viewport>
                  <Select.ScrollDownButton />
                </Select.Content>
              </Select>
            )}
            <Text fontSize="$2" color="$color10">
              Not visible on job posting
            </Text>
          </YStack>
        </YStack>

        {/* Application Section */}
        <YStack
          gap="$4"
          p="$4"
          bg="$background"
          rounded="$4"
          borderWidth={1}
          borderColor="$borderColor"
        >
          <Text fontSize="$6" fontWeight="600">
            Application
          </Text>

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
          <YStack gap="$2">
            <Text fontWeight="600">Required skills</Text>
            <JobSkillsInput
              selectedSkillIds={formData.skill_ids || []}
              onSkillsChange={(skillIds) => setFormData({ ...formData, skill_ids: skillIds })}
              onSearchSkills={handleSearchSkills}
              placeholder="Search and add skills"
              disabled={isLoading}
            />
          </YStack>

          {/* Optional Skills */}
          <YStack gap="$2">
            <Text fontWeight="600">Optional skills</Text>
            <JobSkillsInput
              selectedSkillIds={[]}
              onSkillsChange={() => {}}
              onSearchSkills={handleSearchSkills}
              placeholder="Search and add skills"
              disabled={isLoading}
            />
          </YStack>

          {/* Required Certificates */}
          <YStack gap="$2">
            <Text fontWeight="600">Required certificates</Text>
            <JobCertificationsInput
              selectedCertificationIds={formData.certification_ids || []}
              onCertificationsChange={(certIds) =>
                setFormData({ ...formData, certification_ids: certIds })
              }
              onSearchCertifications={handleSearchCertifications}
              placeholder="Search certificates"
              disabled={isLoading}
            />
          </YStack>

          {/* Auto-Rejection Section */}
          <AutoRejectionSection
            enabled={formData.enable_auto_reject || false}
            criteria={formData.auto_reject_criteria || {}}
            onUpdate={handleAutoRejectUpdate}
          />
        </YStack>

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

        {/* Schedule Publish Section */}
        <YStack gap="$3" p="$4" bg="$color2" rounded="$4" borderWidth={1} borderColor="$borderColor">
          <XStack gap="$3" items="center" justify="space-between">
            <YStack flex={1} gap="$1">
              <Text fontSize="$4" fontWeight="600" color="$color12">
                Schedule Publish
              </Text>
              <Text fontSize="$2" color="$color11">
                Set a date and time to automatically publish this job
              </Text>
            </YStack>
            <Switch
              checked={!!formData.scheduled_publish_at}
              onCheckedChange={(checked) => {
                if (checked) {
                  // Set default to 1 hour from now
                  const defaultDate = new Date()
                  defaultDate.setHours(defaultDate.getHours() + 1)
                  defaultDate.setMinutes(0) // Round to nearest hour
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
            >
              <Switch.Thumb />
            </Switch>
          </XStack>
          {formData.scheduled_publish_at && (
            <YStack gap="$2">
              <Text fontSize="$3" fontWeight="600" color="$color11">
                Publish Date & Time
              </Text>
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
                icon={Calendar}
                disabled={isLoading}
                keyboardType="default"
              />
              <Text fontSize="$2" color="$color10">
                {formData.scheduled_publish_at &&
                  `Will be published on ${new Date(formData.scheduled_publish_at).toLocaleString()}`}
              </Text>
            </YStack>
          )}
        </YStack>

        {/* Actions */}
        <XStack 
          gap="$3" 
          pt="$4"
          $sm={{ flexDirection: 'column' }}
          $gtSm={{ flexDirection: 'row' }}
        >
          <Button 
            data-testid="job-cancel-button" 
            flex={1} 
            variant="outlined" 
            onPress={() => router.back()} 
            disabled={isLoading}
            $sm={{ height: 44, width: '100%' }}
            $gtSm={{ height: undefined, width: undefined }}
          >
            Cancel
          </Button>
          {jobId && (
            <Button
              data-testid="job-preview-button"
              variant="outlined"
              icon={Eye}
              onPress={() => setPreviewOpen(true)}
              disabled={isLoading || !formData.title || !formData.organization_id}
              $sm={{ height: 44 }}
              $gtSm={{ height: undefined }}
            >
              Preview
            </Button>
          )}
          <Button
            data-testid="job-save-draft-button"
            flex={1}
            onPress={() => handleSubmit(true)}
            disabled={
              isLoading ||
              !formData.title ||
              !formData.description ||
              !formData.organization_id ||
              (typeof formData.description === 'object' &&
                formData.description !== null &&
                extractPlainText(formData.description).trim().length === 0)
            }
            $sm={{ height: 44, width: '100%' }}
            $gtSm={{ height: undefined, width: undefined }}
          >
            {isLoading && <Spinner />}
            {!isLoading && 'Save as Draft'}
          </Button>
          <Button
            data-testid="job-publish-button"
            flex={1}
            themeInverse
            onPress={() => handleSubmit(false)}
            disabled={
              isLoading ||
              !formData.title ||
              !formData.description ||
              !formData.location ||
              !formData.organization_id ||
              (formData.scheduled_publish_at &&
                new Date(formData.scheduled_publish_at) <= new Date())
            }
            $sm={{ height: 44, width: '100%' }}
            $gtSm={{ height: undefined, width: undefined }}
          >
            {isLoading && <Spinner />}
            {!isLoading && (formData.scheduled_publish_at ? 'Schedule' : 'Post')}
          </Button>
        </XStack>
        {jobId && (
          <JobPreviewModal
            jobId={jobId}
            open={previewOpen}
            onOpenChange={setPreviewOpen}
          />
        )}
      </YStack>
    </ScrollView>
  )
}
