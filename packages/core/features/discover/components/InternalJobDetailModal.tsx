/**
 * @deprecated This modal component is deprecated in favor of the route-based job detail flow.
 * Use the router navigation to /dashboard/discover/jobs/[id] instead.
 * This component is kept for backward compatibility but will be removed in a future version.
 */
import { useState } from 'react'
import {
  Dialog,
  YStack,
  XStack,
  Text,
  Button,
  ScrollView,
  Separator,
  TextArea,
  Spinner,
  Input,
  Switch,
  Label,
} from 'tamagui'
import {
  Building2,
  MapPin,
  DollarSign,
  Briefcase,
  Clock,
  X,
  CheckCircle2,
  Calendar,
  Award,
  Shield,
  Plane,
  Home,
  Heart,
} from '@tamagui/lucide-icons'
import { Chip } from '@app/ui'
import type { InternalJob } from './InternalJobCard'
import { api } from '@app/core/utils/api'
import { ApplicationWizard, QuickApplyModal } from '@app/core/features/applications/components'
import { getApplicationFlow } from '@app/core/features/applications/utils/getApplicationFlow'

interface InternalJobDetailModalProps {
  job: InternalJob | null
  open: boolean
  onOpenChange: (open: boolean) => void
  hasApplied?: boolean
  onApplySuccess?: () => void
}

interface ApplicationFormData {
  cover_letter: string
  current_location?: string
  willing_to_relocate?: boolean
  years_of_experience?: number
  work_authorization?: boolean
  earliest_start_date?: string
}

/**
 * Format pay range for display
 */
function formatPayRange(minCents?: number, maxCents?: number, type?: string): string {
  if (!minCents || !maxCents || !type) return ''

  const min = (minCents / 100).toFixed(2)
  const max = (maxCents / 100).toFixed(2)

  const formatCurrency = (value: string) => {
    return `$${Number.parseFloat(value).toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    })}`
  }

  const range = `${formatCurrency(min)} - ${formatCurrency(max)}`

  switch (type) {
    case 'hourly':
      return `${range}/hr`
    case 'salary':
      return `${range}/yr`
    case 'contract':
      return `${range} contract`
    case 'project':
      return `${range} project`
    default:
      return range
  }
}

/**
 * Format employment type for display
 */
function formatEmploymentType(type?: string): string {
  if (!type) return ''

  const typeMap: Record<string, string> = {
    full_time: 'Full-Time',
    part_time: 'Part-Time',
    contract: 'Contract',
    temp: 'Temporary',
    intern: 'Internship',
  }

  return typeMap[type] || type
}

/**
 * Format remote option for display
 */
function formatRemoteOption(option?: string): string {
  if (!option) return ''

  const optionMap: Record<string, string> = {
    on_site: 'On-site',
    hybrid: 'Hybrid',
    remote: 'Remote',
  }

  return optionMap[option] || option
}

/**
 * Format education level for display
 */
function formatEducationLevel(level?: string): string {
  if (!level) return ''

  const levelMap: Record<string, string> = {
    none: 'No formal education required',
    high_school: 'High School Diploma',
    associate: "Associate's Degree",
    bachelor: "Bachelor's Degree",
    master: "Master's Degree",
    phd: 'Ph.D.',
  }

  return levelMap[level] || level
}

/**
 * Enhanced Internal Job Detail Modal Component
 * Displays comprehensive job details with robust application process
 */
export function InternalJobDetailModal({
  job,
  open,
  onOpenChange,
  hasApplied = false,
  onApplySuccess,
}: InternalJobDetailModalProps) {
  const [formData, setFormData] = useState<ApplicationFormData>({
    cover_letter: '',
    current_location: '',
    willing_to_relocate: false,
    years_of_experience: undefined,
    work_authorization: false,
    earliest_start_date: '',
  })
  const [showApplicationForm, setShowApplicationForm] = useState(false)
  const [showApplicationWizard, setShowApplicationWizard] = useState(false)
  const [showQuickApplyModal, setShowQuickApplyModal] = useState(false)
  const [applicationSuccess, setApplicationSuccess] = useState(false)

  const applyMutation = api.jobs.createApplication.useMutation({
    onSuccess: () => {
      setApplicationSuccess(true)
      setFormData({
        cover_letter: '',
        current_location: '',
        willing_to_relocate: false,
        years_of_experience: undefined,
        work_authorization: false,
        earliest_start_date: '',
      })
      setTimeout(() => {
        setShowApplicationForm(false)
        setApplicationSuccess(false)
        onApplySuccess?.()
      }, 2000)
    },
  })

  if (!job) return null

  const payRange = formatPayRange(
    job.pay_range_min_cents,
    job.pay_range_max_cents,
    job.pay_range_type
  )
  const employmentType = formatEmploymentType(job.employment_type)
  const remoteOption = formatRemoteOption(job.remote_option)

  // Check if screening questions are required
  const hasScreeningQuestions =
    job.require_current_location ||
    job.require_relocation_willingness ||
    job.minimum_years_experience ||
    job.require_work_authorization ||
    job.require_earliest_start_date

  // Extract required and optional skills from job
  // Note: InternalJob type doesn't include is_required, so we'll show all skills as required for now
  const requiredSkills = (job.skills || [])
    .map((skill) => skill.name || skill.id)
    .filter((name): name is string => Boolean(name))
  const optionalSkills: string[] = [] // Will be populated when job_skills includes is_required

  // Determine which application flow to use based on job requirements
  const flowType = getApplicationFlow({
    id: job.id,
    title: job.title,
    organization: job.organization,
    custom_application_questions: job.custom_application_questions,
    required_attachments: job.required_attachments,
  })

  const handleApply = () => {
    if (hasApplied) return

    if (flowType === 'quick') {
      setShowQuickApplyModal(true)
    } else {
      setShowApplicationWizard(true)
    }
  }

  const handleClose = () => {
    setShowApplicationForm(false)
    setApplicationSuccess(false)
    setFormData({
      cover_letter: '',
      current_location: '',
      willing_to_relocate: false,
      years_of_experience: undefined,
      work_authorization: false,
      earliest_start_date: '',
    })
    onOpenChange(false)
  }

  // Check if form is valid based on required fields
  const isFormValid = () => {
    if (job.require_current_location && !formData.current_location) return false
    if (job.require_work_authorization && !formData.work_authorization) return false
    if (
      job.minimum_years_experience &&
      (!formData.years_of_experience || formData.years_of_experience < job.minimum_years_experience)
    )
      return false
    return true
  }

  return (
    <Dialog modal open={open} onOpenChange={handleClose}>
      <Dialog.Portal>
        <Dialog.Overlay
          key="overlay"
          animation="quick"
          opacity={0.5}
          enterStyle={{ opacity: 0 }}
          exitStyle={{ opacity: 0 }}
        />
        <Dialog.Content
          bordered
          elevate
          key="content"
          animateOnly={['transform', 'opacity']}
          animation={[
            'quick',
            {
              opacity: {
                overshootClamping: true,
              },
            },
          ]}
          enterStyle={{ x: 0, y: -20, opacity: 0, scale: 0.9 }}
          exitStyle={{ x: 0, y: 10, opacity: 0, scale: 0.95 }}
          gap="$4"
          width="90%"
          maxH="90%"
        >
          <Dialog.Title fontSize="$7" fontWeight="700">
            {job.title}
          </Dialog.Title>

          <Dialog.Close asChild>
            <Button size="$3" circular icon={X} chromeless />
          </Dialog.Close>

          <ScrollView showsVerticalScrollIndicator={false}>
            <YStack gap="$4" pb="$4">
              {/* Company info */}
              {job.organization && (
                <XStack gap="$2" items="center">
                  <Building2 size={20} color="$color11" />
                  <Text fontSize="$5" color="$color11" fontWeight="600">
                    {job.organization.name}
                  </Text>
                </XStack>
              )}

              {/* Job metadata */}
              <XStack gap="$3" flexWrap="wrap">
                {job.location && (
                  <XStack gap="$2" items="center">
                    <MapPin size={16} color="$color10" />
                    <Text fontSize="$3" color="$color10">
                      {job.location}
                    </Text>
                  </XStack>
                )}
                {employmentType && (
                  <XStack gap="$2" items="center">
                    <Briefcase size={16} color="$color10" />
                    <Text fontSize="$3" color="$color10">
                      {employmentType}
                    </Text>
                  </XStack>
                )}
                {remoteOption && (
                  <Chip bg="$blue9" color="$blue1" fontSize="$2" px="$2" py="$1">
                    {remoteOption}
                  </Chip>
                )}
              </XStack>

              {/* Pay range */}
              {payRange && (
                <XStack gap="$2" items="center">
                  <DollarSign size={18} color="$green10" />
                  <Text fontSize="$4" color="$green10" fontWeight="600">
                    {payRange}
                  </Text>
                </XStack>
              )}

              {/* Benefits Summary */}
              {job.benefits_summary && (
                <YStack gap="$2" bg="$green2" p="$3" rounded="$4">
                  <XStack gap="$2" items="center">
                    <Heart size={16} color="$green10" />
                    <Text fontSize="$4" fontWeight="600" color="$green11">
                      Benefits
                    </Text>
                  </XStack>
                  <Text fontSize="$3" color="$green11">
                    {job.benefits_summary}
                  </Text>
                </YStack>
              )}

              <Separator />

              {/* Description */}
              <YStack gap="$2">
                <Text fontSize="$5" fontWeight="600" color="$color12">
                  Job Description
                </Text>
                <Text fontSize="$3" color="$color11" lineHeight="$4">
                  {job.description}
                </Text>
              </YStack>

              {/* Requirements Section */}
              {(job.minimum_education_level ||
                job.minimum_years_experience ||
                job.require_background_check ||
                job.require_drug_test ||
                job.require_drivers_license ||
                job.security_clearance_required ||
                job.travel_percentage) && (
                <>
                  <Separator />
                  <YStack gap="$3">
                    <Text fontSize="$5" fontWeight="600" color="$color12">
                      Requirements
                    </Text>
                    <YStack gap="$2">
                      {job.minimum_education_level && (
                        <XStack gap="$2" items="center">
                          <Award size={16} color="$red10" />
                          <Text fontSize="$3" color="$color11">
                            {formatEducationLevel(job.minimum_education_level)}
                          </Text>
                        </XStack>
                      )}
                      {job.minimum_years_experience && (
                        <XStack gap="$2" items="center">
                          <Clock size={16} color="$blue10" />
                          <Text fontSize="$3" color="$color11">
                            {job.minimum_years_experience}+ years of experience
                          </Text>
                        </XStack>
                      )}
                      {job.require_background_check && (
                        <XStack gap="$2" items="center">
                          <Shield size={16} color="$blue10" />
                          <Text fontSize="$3" color="$color11">
                            Background check required
                            {job.background_check_type && ` (${job.background_check_type})`}
                          </Text>
                        </XStack>
                      )}
                      {job.require_drug_test && (
                        <XStack gap="$2" items="center">
                          <Shield size={16} color="$blue10" />
                          <Text fontSize="$3" color="$color11">
                            Drug test required
                          </Text>
                        </XStack>
                      )}
                      {job.require_drivers_license && (
                        <XStack gap="$2" items="center">
                          <Briefcase size={16} color="$blue10" />
                          <Text fontSize="$3" color="$color11">
                            Driver's license required
                            {job.drivers_license_type && ` (${job.drivers_license_type})`}
                          </Text>
                        </XStack>
                      )}
                      {job.security_clearance_required && (
                        <XStack gap="$2" items="center">
                          <Shield size={16} color="$red10" />
                          <Text fontSize="$3" color="$color11">
                            Security clearance: {job.security_clearance_required}
                          </Text>
                        </XStack>
                      )}
                      {job.travel_percentage && job.travel_percentage > 0 && (
                        <XStack gap="$2" items="center">
                          <Plane size={16} color="$blue10" />
                          <Text fontSize="$3" color="$color11">
                            Travel: {job.travel_percentage}%
                          </Text>
                        </XStack>
                      )}
                    </YStack>
                  </YStack>
                </>
              )}

              {/* Work Schedule & Location */}
              {(job.work_schedule_details || job.relocation_assistance_offered || job.timezone) && (
                <>
                  <Separator />
                  <YStack gap="$3">
                    <Text fontSize="$5" fontWeight="600" color="$color12">
                      Work Details
                    </Text>
                    <YStack gap="$2">
                      {job.work_schedule_details && (
                        <XStack gap="$2" items="center">
                          <Clock size={16} color="$blue10" />
                          <Text fontSize="$3" color="$color11">
                            {job.work_schedule_details}
                          </Text>
                        </XStack>
                      )}
                      {job.timezone && (
                        <XStack gap="$2" items="center">
                          <MapPin size={16} color="$blue10" />
                          <Text fontSize="$3" color="$color11">
                            Timezone: {job.timezone}
                          </Text>
                        </XStack>
                      )}
                      {job.relocation_assistance_offered && (
                        <XStack gap="$2" items="center">
                          <Home size={16} color="$green10" />
                          <Text fontSize="$3" color="$color11">
                            Relocation assistance available
                            {job.relocation_assistance_details &&
                              `: ${job.relocation_assistance_details}`}
                          </Text>
                        </XStack>
                      )}
                    </YStack>
                  </YStack>
                </>
              )}

              {/* Deadlines */}
              {job.application_deadline && (
                <>
                  <Separator />
                  <YStack gap="$2" bg="$yellow2" p="$3" rounded="$4">
                    <XStack gap="$2" items="center">
                      <Calendar size={16} color="$yellow10" />
                      <Text fontSize="$4" fontWeight="600" color="$yellow11">
                        Application Deadline
                      </Text>
                    </XStack>
                    <Text fontSize="$3" color="$yellow11">
                      {new Date(job.application_deadline).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </Text>
                  </YStack>
                </>
              )}

              {/* Required Certifications */}
              {job.certifications && job.certifications.length > 0 && (
                <>
                  <Separator />
                  <YStack gap="$3">
                    <Text fontSize="$5" fontWeight="600" color="$color12">
                      Required Certifications
                    </Text>
                    <XStack gap="$2" flexWrap="wrap">
                      {job.certifications.map((cert) => (
                        <Chip
                          key={cert.id}
                          bg="$red10"
                          color="$color1"
                          fontSize="$3"
                          px="$3"
                          py="$2"
                        >
                          {cert.name}
                        </Chip>
                      ))}
                    </XStack>
                  </YStack>
                </>
              )}

              {/* Required Skills */}
              {job.skills && job.skills.length > 0 && (
                <>
                  <Separator />
                  <YStack gap="$3">
                    <Text fontSize="$5" fontWeight="600" color="$color12">
                      Required Skills
                    </Text>
                    <XStack gap="$2" flexWrap="wrap">
                      {job.skills.map((skill) => {
                        const label =
                          skill.name ??
                          (skill.taxonomy ? `${skill.taxonomy.toUpperCase()} ${skill.id}` : skill.id)
                        if (!label) {
                          return null
                        }
                        return (
                          <Chip
                            key={skill.id}
                            bg="$blue10"
                            color="$color1"
                            fontSize="$3"
                            px="$3"
                            py="$2"
                          >
                            {label}
                          </Chip>
                        )
                      })}
                    </XStack>
                  </YStack>
                </>
              )}

              {/* Application Section */}
              {!hasApplied && !showApplicationForm && !showApplicationWizard && !showQuickApplyModal && (
                <>
                  <Separator />
                  <Button
                    size="$4"
                    theme="info"
                    onPress={handleApply}
                    mt="$2"
                  >
                    Apply for this Position
                  </Button>
                </>
              )}

              {/* Application Wizard (New) */}
              {!hasApplied && showApplicationWizard && (
                <YStack flex={1} height="100%" width="100%">
                  <ApplicationWizard
                    jobId={job.id}
                    jobTitle={job.title}
                    organizationName={job.organization?.name || 'Unknown Organization'}
                    onSuccess={(applicationId) => {
                      console.log('Application submitted successfully:', applicationId)
                      setShowApplicationWizard(false)
                      setApplicationSuccess(true)
                      onApplySuccess?.()
                    }}
                    onCancel={() => {
                      setShowApplicationWizard(false)
                    }}
                    onReturnToJobs={() => {
                      setShowApplicationWizard(false)
                      onOpenChange(false)
                    }}
                  />
                </YStack>
              )}

              {/* Enhanced Application Form */}
              {!hasApplied && showApplicationForm && !applicationSuccess && (
                <>
                  <Separator />
                  <YStack gap="$4">
                    <Text fontSize="$6" fontWeight="600" color="$color12">
                      Submit Application
                    </Text>

                    {/* Screening Questions */}
                    {hasScreeningQuestions && (
                      <YStack gap="$3" bg="$blue2" p="$3" rounded="$4">
                        <Text fontSize="$4" fontWeight="600" color="$blue11">
                          Screening Questions
                        </Text>

                        {job.require_current_location && (
                          <YStack gap="$2">
                            <Label fontSize="$3" color="$blue11">
                              Current Location *
                            </Label>
                            <Input
                              placeholder="City, State"
                              value={formData.current_location}
                              onChangeText={(text) =>
                                setFormData({ ...formData, current_location: text })
                              }
                            />
                          </YStack>
                        )}

                        {job.require_relocation_willingness && (
                          <XStack gap="$3" items="center">
                            <Switch
                              checked={formData.willing_to_relocate}
                              onCheckedChange={(checked) =>
                                setFormData({ ...formData, willing_to_relocate: checked })
                              }
                            >
                              <Switch.Thumb animation="quick" />
                            </Switch>
                            <Label fontSize="$3" color="$blue11">
                              Willing to relocate
                            </Label>
                          </XStack>
                        )}

                        {job.minimum_years_experience && (
                          <YStack gap="$2">
                            <Label fontSize="$3" color="$blue11">
                              Years of Experience *
                              <Text color="$blue9"> (minimum: {job.minimum_years_experience})</Text>
                            </Label>
                            <Input
                              placeholder="e.g., 5"
                              keyboardType="numeric"
                              value={formData.years_of_experience?.toString() || ''}
                              onChangeText={(text) => {
                                const num = Number.parseInt(text, 10)
                                setFormData({
                                  ...formData,
                                  years_of_experience: Number.isNaN(num) ? undefined : num,
                                })
                              }}
                            />
                          </YStack>
                        )}

                        {job.require_work_authorization && (
                          <XStack gap="$3" items="center">
                            <Switch
                              checked={formData.work_authorization}
                              onCheckedChange={(checked) =>
                                setFormData({ ...formData, work_authorization: checked })
                              }
                            >
                              <Switch.Thumb animation="quick" />
                            </Switch>
                            <Label fontSize="$3" color="$blue11">
                              Authorized to work in the US *
                            </Label>
                          </XStack>
                        )}

                        {job.require_earliest_start_date && (
                          <YStack gap="$2">
                            <Label fontSize="$3" color="$blue11">
                              Earliest Start Date
                            </Label>
                            <Input
                              placeholder="MM/DD/YYYY"
                              value={formData.earliest_start_date}
                              onChangeText={(text) =>
                                setFormData({ ...formData, earliest_start_date: text })
                              }
                            />
                          </YStack>
                        )}
                      </YStack>
                    )}

                    {/* Cover Letter */}
                    <YStack gap="$2">
                      <Label fontSize="$3" color="$color11">
                        Cover Letter (Optional)
                      </Label>
                      <TextArea
                        placeholder="Tell us why you're a great fit for this position..."
                        value={formData.cover_letter}
                        onChangeText={(text) => setFormData({ ...formData, cover_letter: text })}
                        height={120}
                        maxLength={2000}
                      />
                      <Text fontSize="$2" color="$color9">
                        {formData.cover_letter.length}/2000 characters
                      </Text>
                    </YStack>

                    <XStack gap="$2" mt="$2">
                      <Button
                        flex={1}
                        size="$4"
                        theme="info"
                        onPress={handleApply}
                        disabled={applyMutation.isPending || !isFormValid()}
                        icon={applyMutation.isPending ? <Spinner /> : undefined}
                      >
                        {applyMutation.isPending ? 'Submitting...' : 'Submit Application'}
                      </Button>
                      <Button
                        size="$4"
                        chromeless
                        onPress={() => setShowApplicationForm(false)}
                        disabled={applyMutation.isPending}
                      >
                        Cancel
                      </Button>
                    </XStack>

                    {applyMutation.isError && (
                      <Text fontSize="$3" color="$red10" mt="$2">
                        {applyMutation.error?.message || 'Failed to submit application'}
                      </Text>
                    )}
                  </YStack>
                </>
              )}

              {/* Application Success */}
              {applicationSuccess && (
                <YStack gap="$3" items="center" py="$4">
                  <CheckCircle2 size={48} color="$green10" />
                  <Text fontSize="$5" fontWeight="600" color="$green10" text="center">
                    Application Submitted!
                  </Text>
                  <Text fontSize="$3" color="$color11" text="center">
                    Your application has been submitted successfully. The employer will review your
                    application and contact you if you're a good fit.
                  </Text>
                </YStack>
              )}

              {/* Already Applied */}
              {hasApplied && (
                <>
                  <Separator />
                  <YStack gap="$3" items="center" py="$3">
                    <Chip bg="$green9" color="$green1" fontSize="$4" px="$4" py="$3">
                      ✓ Applied
                    </Chip>
                    <Text fontSize="$3" color="$color11" text="center">
                      You have already applied to this position
                    </Text>
                  </YStack>
                </>
              )}
            </YStack>
          </ScrollView>
        </Dialog.Content>
      </Dialog.Portal>

      {/* Quick Apply Modal */}
      {job && (
        <QuickApplyModal
          jobId={job.id}
          jobTitle={job.title}
          organizationName={job.organization?.name || 'Unknown Organization'}
          open={showQuickApplyModal}
          onOpenChange={setShowQuickApplyModal}
          onSuccess={(applicationId) => {
            console.log('Quick application submitted successfully:', applicationId)
            setShowQuickApplyModal(false)
            setApplicationSuccess(true)
            onApplySuccess?.()
          }}
          requiredSkills={requiredSkills}
          optionalSkills={optionalSkills}
        />
      )}
    </Dialog>
  )
}
