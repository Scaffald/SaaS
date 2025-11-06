import { useState, useEffect } from 'react'
import { YStack, XStack, Text, Input, Button, Spinner, ScrollView, AddressForm } from '@app/ui'
import { TextArea, Adapt, Sheet, Select } from 'tamagui'
import type { AddressResult } from '@app/ui'
import { api } from '@app/core/utils/api'
import { useToastController } from '@tamagui/toast'
import { useRouter } from 'expo-router'
import { useAllOrganizations } from '@app/core/utils/useAllOrganizations'
import { Check, ChevronDown } from '@tamagui/lucide-icons'
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
  description: string
  organization_id: string
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

const EMPLOYMENT_TYPES = [
  { value: 'full_time', label: 'Full Time' },
  { value: 'part_time', label: 'Part Time' },
  { value: 'contract', label: 'Contract' },
  { value: 'temp', label: 'Temporary' },
  { value: 'intern', label: 'Internship' },
]

const REMOTE_OPTIONS = [
  { value: 'on_site', label: 'On-Site' },
  { value: 'hybrid', label: 'Hybrid' },
  { value: 'remote', label: 'Remote' },
]

const PAY_RANGE_TYPES = [
  { value: 'hourly', label: 'Hourly' },
  { value: 'salary', label: 'Salary' },
  { value: 'contract', label: 'Contract' },
  { value: 'project', label: 'Project' },
]

export function JobForm({ mode, jobId, initialData, onSuccess }: JobFormProps) {
  const router = useRouter()
  const toast = useToastController()
  const { data: organizationsData } = useAllOrganizations()

  const [formData, setFormData] = useState<JobFormData>({
    title: initialData?.title || '',
    description: initialData?.description || '',
    organization_id: initialData?.organization_id || '',
    employment_type: initialData?.employment_type,
    remote_option: initialData?.remote_option,
    location: initialData?.location || '',
    address: initialData?.address,
    pay_range_min_cents: initialData?.pay_range_min_cents,
    pay_range_max_cents: initialData?.pay_range_max_cents,
    pay_range_type: initialData?.pay_range_type,
    position_level: initialData?.position_level || '',
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
    const submitData: Record<string, unknown> = {
      title: formData.title,
      description: formData.description,
      organization_id: formData.organization_id,
      status: asDraft ? ('draft' as const) : ('open' as const),
    }

    // Include all optional fields if they have values
    for (const key of Object.keys(formData)) {
      const value = formData[key as keyof JobFormData]
      if (
        value !== undefined &&
        value !== '' &&
        key !== 'title' &&
        key !== 'description' &&
        key !== 'organization_id'
      ) {
        submitData[key] = value
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

  type Organization = { id: string; name: string; slug: string; owner_user_id: string | null }

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

        {/* Title */}
        <YStack gap="$2">
          <Text fontWeight="600">Job Title *</Text>
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
          <Text fontWeight="600">Description *</Text>
          <TextArea
            data-testid="job-description-input"
            placeholder="Describe the job role, responsibilities, and requirements..."
            value={formData.description}
            onChangeText={(text: string) => setFormData({ ...formData, description: text })}
            disabled={isLoading}
            height={150}
          />
        </YStack>

        {/* Employment Type */}
        <YStack gap="$2">
          <Text fontWeight="600">Employment Type</Text>
          <Select
            data-testid="job-employment-type-select"
            value={formData.employment_type || ''}
            onValueChange={(value: string) =>
              setFormData({ ...formData, employment_type: value || undefined })
            }
          >
            <Select.Trigger iconAfter={ChevronDown}>
              <Select.Value placeholder="Select employment type" />
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
                  <Select.Label>Employment Type</Select.Label>
                  {EMPLOYMENT_TYPES.map((type, i) => (
                    <Select.Item key={type.value} index={i} value={type.value}>
                      <Select.ItemText>{type.label}</Select.ItemText>
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

        {/* Remote Option */}
        <YStack gap="$2">
          <Text fontWeight="600">Work Location</Text>
          <Select
            data-testid="job-remote-option-select"
            value={formData.remote_option || ''}
            onValueChange={(value: string) =>
              setFormData({ ...formData, remote_option: value || undefined })
            }
          >
            <Select.Trigger iconAfter={ChevronDown}>
              <Select.Value placeholder="Select work location type" />
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
                  <Select.Label>Work Location</Select.Label>
                  {REMOTE_OPTIONS.map((option, i) => (
                    <Select.Item key={option.value} index={i} value={option.value}>
                      <Select.ItemText>{option.label}</Select.ItemText>
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

        {/* Location with Smart Autocomplete */}
        <YStack gap="$2">
          <Text fontWeight="600">Location *</Text>
          <AddressForm
            mode="hybrid"
            placeholder="Search for city or address..."
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
          {formData.address?.latitude && formData.address?.longitude && (
            <Text fontSize="$2" color="$color10">
              📍 Coordinates: {formData.address.latitude.toFixed(4)},{' '}
              {formData.address.longitude.toFixed(4)}
            </Text>
          )}
        </YStack>

        {/* Pay Range */}
        <YStack gap="$2">
          <Text fontWeight="600">Pay Range</Text>
          <XStack gap="$2">
            <YStack gap="$2" flex={1}>
              <Text fontSize="$2">Min ($)</Text>
              <Input
                data-testid="job-pay-min-input"
                placeholder="Min"
                keyboardType="numeric"
                value={
                  formData.pay_range_min_cents
                    ? (formData.pay_range_min_cents / 100).toString()
                    : ''
                }
                onChangeText={(text: string) => {
                  const value = Number.parseFloat(text) || 0
                  setFormData({ ...formData, pay_range_min_cents: Math.round(value * 100) })
                }}
                disabled={isLoading}
              />
            </YStack>
            <YStack gap="$2" flex={1}>
              <Text fontSize="$2">Max ($)</Text>
              <Input
                data-testid="job-pay-max-input"
                placeholder="Max"
                keyboardType="numeric"
                value={
                  formData.pay_range_max_cents
                    ? (formData.pay_range_max_cents / 100).toString()
                    : ''
                }
                onChangeText={(text: string) => {
                  const value = Number.parseFloat(text) || 0
                  setFormData({ ...formData, pay_range_max_cents: Math.round(value * 100) })
                }}
                disabled={isLoading}
              />
            </YStack>
          </XStack>
          <Select
            data-testid="job-pay-type-select"
            value={formData.pay_range_type || ''}
            onValueChange={(value: string) =>
              setFormData({ ...formData, pay_range_type: value || undefined })
            }
          >
            <Select.Trigger iconAfter={ChevronDown}>
              <Select.Value placeholder="Select pay range type" />
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
                  <Select.Label>Pay Range Type</Select.Label>
                  {PAY_RANGE_TYPES.map((type, i) => (
                    <Select.Item key={type.value} index={i} value={type.value}>
                      <Select.ItemText>{type.label}</Select.ItemText>
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

        {/* Position Level */}
        <YStack gap="$2">
          <Text fontWeight="600">Position Level</Text>
          <Input
            data-testid="job-position-level-input"
            placeholder="e.g. Senior, Mid-Level, Entry Level"
            value={formData.position_level}
            onChangeText={(text: string) => setFormData({ ...formData, position_level: text })}
            disabled={isLoading}
          />
        </YStack>

        {/* Divider */}
        <YStack height={1} bg="$borderColor" my="$4" />

        {/* Job Metadata Section */}
        <JobMetadataSection
          internalJobCode={formData.internal_job_code}
          department={formData.department}
          costCenter={formData.cost_center}
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

        {/* Application Screening Section */}
        <ApplicationScreeningSection
          requireCurrentLocation={formData.require_current_location || false}
          requireRelocationWillingness={formData.require_relocation_willingness || false}
          minimumYearsExperience={formData.minimum_years_experience}
          requireWorkAuthorization={formData.require_work_authorization || false}
          requireEarliestStartDate={formData.require_earliest_start_date || false}
          onUpdate={handleSectionUpdate}
        />

        {/* Score Threshold Section */}
        <ScoreThresholdSection minimumScore={formData.minimum_score} onUpdate={handleScoreUpdate} />

        {/* Auto-Rejection Section */}
        <AutoRejectionSection
          enabled={formData.enable_auto_reject || false}
          criteria={formData.auto_reject_criteria || {}}
          onUpdate={handleAutoRejectUpdate}
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

        {/* Actions */}
        <XStack gap="$3" pt="$4">
          <Button data-testid="job-cancel-button" flex={1} variant="outlined" onPress={() => router.back()} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            data-testid="job-save-draft-button"
            flex={1}
            onPress={() => handleSubmit(true)}
            disabled={
              isLoading || !formData.title || !formData.description || !formData.organization_id
            }
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
              !formData.organization_id
            }
          >
            {isLoading && <Spinner />}
            {!isLoading && 'Publish'}
          </Button>
        </XStack>
      </YStack>
    </ScrollView>
  )
}
