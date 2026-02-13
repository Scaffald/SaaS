import { ROUTES } from '@scf/core/constants/routes'
import { OpenToTravelCard } from '@scf/core/features/profile/components/employment-fields'
import { useGeneralInfo } from '@scf/core/utils/profile-general-sdk-hooks'
import { useExperience } from '@scf/core/utils/profile-experience-sdk-hooks'
import { useEmployment } from '@scf/core/utils/profile-employment-sdk-hooks'
import { useEducation } from '@scf/core/utils/profile-education-sdk-hooks'
import { useUserCertificationTree } from '@scf/core/utils/profile-certifications-sdk-hooks'
import { useUserSkillsMultiTaxonomy } from '@scf/core/utils/profile-skills-sdk-hooks'
import { Button, ToggleCard, spacing } from '@unicornlove/beyond-ui'
import {
  AlertCircle,
  CheckCircle2,
  CornerDownLeft,
  SkipForward,
  UploadCloud,
} from 'lucide-react-native'
import { useRouter } from 'expo-router'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Checkbox,
  Input,
  Paragraph,
  ScrollView,
  Separator,
  Spinner,
  Text,
  Row,
  Stack,
} from '@unicornlove/beyond-ui'
import { useResumeWizardContext } from '../context/ResumeWizardProvider'
import {
  type ResumeMergeStrategy,
  type ResumeWizardSection,
  useResumeWizard,
} from '../hooks/useResumeWizard'
import { MergeComparisonView } from './MergeComparisonView'

interface ResumeWizardProps {
  resumeId: string
}

interface GeneralFormState {
  firstName: string
  lastName: string
  summary: string
}

interface EmploymentFormState {
  openToTravel: boolean
  travelDistanceMiles: number | null
  hourlyRate: number | null
  locations: Array<{ id: string; value: string }>
}

interface ParsedResumeData {
  general?: Array<{ firstName?: string; lastName?: string; bio?: string }>
  experience?: Array<{
    title?: string
    company?: string
    startDate?: string
    endDate?: string
    summary?: string
  }>
  education?: Array<{
    school?: string
    degree?: string
    fieldOfStudy?: string
    startDate?: string
    endDate?: string
  }>
  skills?: Array<{ name: string; confidence?: number }>
  certifications?: Array<{ name?: string; issuer?: string; issuedOn?: string; expiresOn?: string }>
  employment?: {
    openToTravel?: boolean
    travelDistanceMiles?: number
    hourlyRate?: number
    locations?: string[]
  }
}

interface WizardError {
  section: ResumeWizardSection | 'review'
  message: string
  rawText?: string
}

type ParsedExperienceEntry = NonNullable<ParsedResumeData['experience']>[number]
type ParsedEducationEntry = NonNullable<ParsedResumeData['education']>[number]
type ParsedCertificationEntry = NonNullable<ParsedResumeData['certifications']>[number]
type ParsedSkillEntry = NonNullable<ParsedResumeData['skills']>[number]

type MergeStrategyMap = Record<ResumeWizardSection, ResumeMergeStrategy>

const MERGEABLE_SECTIONS: readonly ResumeWizardSection[] = [
  'experience',
  'education',
  'skills',
  'certifications',
]

const OPENAI_DISABLED_MESSAGE =
  'Resume parsing is disabled because the OpenAI API key is not configured. Please fill in this section manually.'

export function ResumeWizard({ resumeId }: ResumeWizardProps) {
  const router = useRouter()
  const wizardController = useResumeWizardContext()
  const {
    currentIndex,
    currentStep,
    parsedData: rawParsedData,
    errors: rawErrors,
    wizard,
    isLoading,
    isSaving,
    goPrevious,
    saveSection,
    skipSection,
  } = wizardController ?? useResumeWizard(resumeId)

  const generalProfileQuery = useGeneralInfo({
    refetchOnWindowFocus: false,
  })
  const experienceQuery = useExperience({
    refetchOnWindowFocus: false,
  })
  const educationQuery = useEducation({
    refetchOnWindowFocus: false,
  })
  const skillsQuery = useUserSkillsMultiTaxonomy({
    refetchOnWindowFocus: false,
  })
  const certificationsQuery = useUserCertificationTree({
    refetchOnWindowFocus: false,
  })
  const employmentQuery = useEmployment({
    refetchOnWindowFocus: false,
  })

  const parsedData = (rawParsedData ?? {}) as ParsedResumeData
  const errors = (rawErrors ?? []) as WizardError[]

  const [generalForm, setGeneralForm] = useState<GeneralFormState>({
    firstName: '',
    lastName: '',
    summary: '',
  })
  const [employmentForm, setEmploymentForm] = useState<EmploymentFormState>({
    openToTravel: false,
    travelDistanceMiles: null,
    hourlyRate: null,
    locations: [],
  })

  const experienceSelections = useBooleanSelections(parsedData.experience?.length ?? 0)
  const educationSelections = useBooleanSelections(parsedData.education?.length ?? 0)
  const certificationSelections = useBooleanSelections(parsedData.certifications?.length ?? 0)
  const skillSelections = useBooleanSelections(parsedData.skills?.length ?? 0)

  const [mergeStrategies, setMergeStrategies] = useState<MergeStrategyMap>(() => ({
    general: 'replace',
    experience: 'replace',
    education: 'replace',
    skills: 'replace',
    certifications: 'replace',
    employment: 'replace',
  }))
  const mergeDefaultsInitialized = useRef(false)

  const existingGeneral = generalProfileQuery.data
  const existingExperience = (experienceQuery.data ?? []) as Array<Record<string, unknown>>
  const existingEducation = (educationQuery.data ?? []) as Array<Record<string, unknown>>

  const existingSkillNames = useMemo(() => {
    const rawSkills =
      (skillsQuery.data?.skills as Array<{ skill_name?: unknown; name?: unknown }> | undefined) ??
      []
    return rawSkills
      .map((skill) => {
        if (typeof skill.skill_name === 'string') {
          return skill.skill_name
        }
        if (typeof skill.name === 'string') {
          return skill.name
        }
        return null
      })
      .filter((value): value is string => Boolean(value))
  }, [skillsQuery.data])

  const existingCertificationNames = useMemo(() => {
    const titles: string[] = []
    const tree = certificationsQuery.data
    if (!tree) {
      return titles
    }

    const collectTitles = (entries: Array<Record<string, unknown>> | undefined) => {
      if (!entries) return
      for (const entry of entries) {
        if (entry && typeof entry === 'object') {
          const record = entry as Record<string, unknown>
          const catalog = record.catalog as Record<string, unknown> | undefined
          const title =
            (typeof catalog?.title === 'string' ? catalog.title : undefined) ??
            (typeof catalog?.name === 'string' ? catalog.name : undefined) ??
            (typeof record.description === 'string' ? record.description : undefined) ??
            (typeof record.credential_id === 'string' ? record.credential_id : undefined)
          if (title) {
            titles.push(title)
          }
        }
      }
    }

    collectTitles(tree.depth0 as Array<Record<string, unknown>> | undefined)
    for (const entries of Object.values(tree.depth1ByParent ?? {})) {
      collectTitles(entries as Array<Record<string, unknown>> | undefined)
    }
    for (const entries of Object.values(tree.depth2ByParent ?? {})) {
      collectTitles(entries as Array<Record<string, unknown>> | undefined)
    }

    return titles
  }, [certificationsQuery.data])

  const existingEmployment = employmentQuery.data ?? null

  const mergeDataLoading =
    generalProfileQuery.isLoading ||
    experienceQuery.isLoading ||
    educationQuery.isLoading ||
    skillsQuery.isLoading ||
    certificationsQuery.isLoading ||
    employmentQuery.isLoading

  useEffect(() => {
    if (mergeDefaultsInitialized.current || mergeDataLoading) {
      return
    }

    mergeDefaultsInitialized.current = true
    setMergeStrategies((previous) => ({
      ...previous,
      experience: existingExperience.length > 0 ? 'append' : previous.experience,
      education: existingEducation.length > 0 ? 'append' : previous.education,
      skills: existingSkillNames.length > 0 ? 'append' : previous.skills,
      certifications: existingCertificationNames.length > 0 ? 'append' : previous.certifications,
    }))
  }, [
    existingCertificationNames.length,
    existingEducation.length,
    existingExperience.length,
    existingSkillNames.length,
    mergeDataLoading,
  ])

  useEffect(() => {
    const general = parsedData.general?.[0]
    setGeneralForm({
      firstName: general?.firstName ?? '',
      lastName: general?.lastName ?? '',
      summary: general?.bio ?? '',
    })
  }, [parsedData.general])

  useEffect(() => {
    const employment = parsedData.employment
    setEmploymentForm({
      openToTravel: Boolean(employment?.openToTravel),
      travelDistanceMiles: employment?.travelDistanceMiles ?? null,
      hourlyRate: employment?.hourlyRate ?? null,
      locations: (employment?.locations ?? []).map((location, index) => ({
        id: `${index}-${location ?? 'location'}`,
        value: location ?? '',
      })),
    })
  }, [parsedData.employment])

  const selectedExperience = useMemo<ParsedExperienceEntry[]>(() => {
    const experience = (parsedData.experience ?? []) as ParsedExperienceEntry[]
    return experience.filter((_entry, index) => experienceSelections[index])
  }, [parsedData.experience, experienceSelections])

  const selectedEducation = useMemo<ParsedEducationEntry[]>(() => {
    const education = (parsedData.education ?? []) as ParsedEducationEntry[]
    return education.filter((_entry, index) => educationSelections[index])
  }, [educationSelections, parsedData.education])

  const selectedSkills = useMemo<ParsedSkillEntry[]>(() => {
    const skills = (parsedData.skills ?? []) as ParsedSkillEntry[]
    return skills.filter((_entry, index) => skillSelections[index])
  }, [parsedData.skills, skillSelections])

  const selectedCertifications = useMemo<ParsedCertificationEntry[]>(() => {
    const certifications = (parsedData.certifications ?? []) as ParsedCertificationEntry[]
    return certifications.filter((_entry, index) => certificationSelections[index])
  }, [certificationSelections, parsedData.certifications])

  const hasExistingProfileData = useMemo(() => {
    const hasGeneral =
      Boolean(existingGeneral?.first_name) ||
      Boolean(existingGeneral?.last_name) ||
      Boolean(existingGeneral?.about)
    const hasEmployment =
      Boolean(existingEmployment?.preferred_work_locations?.length) ||
      typeof existingEmployment?.hourly_rate === 'number'
    return (
      hasGeneral ||
      existingExperience.length > 0 ||
      existingEducation.length > 0 ||
      existingSkillNames.length > 0 ||
      existingCertificationNames.length > 0 ||
      hasEmployment
    )
  }, [
    existingCertificationNames.length,
    existingEducation.length,
    existingEmployment?.hourly_rate,
    existingEmployment?.preferred_work_locations?.length,
    existingExperience.length,
    existingGeneral?.about,
    existingGeneral?.first_name,
    existingGeneral?.last_name,
    existingSkillNames.length,
  ])

  const aiParsingDisabled = useMemo(
    () => errors?.some((error) => error.message?.includes(OPENAI_DISABLED_MESSAGE)) ?? false,
    [errors]
  )

  useEffect(() => {
    if (aiParsingDisabled) {
      console.warn(
        '[ResumeWizard] AI parsing is disabled because the OpenAI API key is not configured.'
      )
    }
  }, [aiParsingDisabled])

  const mergedErrors = useMemo(() => {
    if (!errors?.length) return null
    return errors
      .filter((error) => error.section === currentStep.id)
      .filter((error) => !(aiParsingDisabled && error.message.includes(OPENAI_DISABLED_MESSAGE)))
  }, [aiParsingDisabled, currentStep.id, errors])

  const _completedSteps = wizard?.completedSteps ?? []

  const updateMergeStrategy = useCallback(
    (section: ResumeWizardSection, strategy: ResumeMergeStrategy) => {
      if (!MERGEABLE_SECTIONS.includes(section)) {
        return
      }
      setMergeStrategies((previous) => ({
        ...previous,
        [section]: strategy,
      }))
    },
    []
  )

  const mergeComparisonSections = useMemo(() => {
    const sectionsForReview = [
      {
        id: 'general' as const,
        label: 'General Information',
        strategy: mergeStrategies.general,
        existingItems: buildGeneralSummary(existingGeneral),
        incomingItems: buildSelectedGeneralSummary(generalForm),
        hasIncoming: Boolean(
          generalForm.firstName?.trim() ||
            generalForm.lastName?.trim() ||
            generalForm.summary?.trim()
        ),
      },
      {
        id: 'experience' as const,
        label: 'Work Experience',
        strategy: mergeStrategies.experience,
        existingItems: previewList(
          existingExperience.map((entry) => formatExperienceEntry(entry as Record<string, unknown>))
        ),
        incomingItems: previewList(
          selectedExperience.map((entry) => formatParsedExperience(entry))
        ),
        hasIncoming: selectedExperience.length > 0,
      },
      {
        id: 'education' as const,
        label: 'Education',
        strategy: mergeStrategies.education,
        existingItems: previewList(
          existingEducation.map((entry) => formatEducationEntry(entry as Record<string, unknown>))
        ),
        incomingItems: previewList(selectedEducation.map((entry) => formatParsedEducation(entry))),
        hasIncoming: selectedEducation.length > 0,
      },
      {
        id: 'skills' as const,
        label: 'Skills',
        strategy: mergeStrategies.skills,
        existingItems: previewList(existingSkillNames),
        incomingItems: previewList(selectedSkills.map((skill) => skill.name)),
        hasIncoming: selectedSkills.length > 0,
      },
      {
        id: 'certifications' as const,
        label: 'Certifications',
        strategy: mergeStrategies.certifications,
        existingItems: previewList(existingCertificationNames),
        incomingItems: previewList(
          selectedCertifications
            .map((cert) => cert.name)
            .filter((name): name is string => Boolean(name?.trim()))
        ),
        hasIncoming: selectedCertifications.length > 0,
      },
      {
        id: 'employment' as const,
        label: 'Employment Preferences',
        strategy: mergeStrategies.employment,
        existingItems: buildEmploymentSummary(existingEmployment),
        incomingItems: buildIncomingEmploymentSummary(employmentForm),
        hasIncoming:
          employmentForm.locations.some((location) => location.value.trim().length > 0) ||
          employmentForm.hourlyRate !== null ||
          employmentForm.travelDistanceMiles !== null ||
          employmentForm.openToTravel !== existingEmployment?.open_to_travel,
      },
    ]

    return sectionsForReview
  }, [
    employmentForm,
    existingCertificationNames,
    existingEducation,
    existingEmployment,
    existingExperience,
    existingGeneral,
    existingSkillNames,
    generalForm,
    mergeStrategies.certifications,
    mergeStrategies.education,
    mergeStrategies.employment,
    mergeStrategies.experience,
    mergeStrategies.general,
    mergeStrategies.skills,
    selectedCertifications,
    selectedEducation,
    selectedExperience,
    selectedSkills,
  ])

  const mergeComparisonLoading = mergeDataLoading && !mergeDefaultsInitialized.current

  if (isLoading) {
    return (
      <Stack align="center" justify="center" flex={1} gap={12} paddingVertical="$10">
        <Spinner size="lg" />
        <Text color="gray">Loading resume import wizard...</Text>
      </Stack>
    )
  }

  if (!wizard) {
    return (
      <Stack align="center" justify="center" flex={1} gap={12} paddingVertical="$10">
        <AlertCircle size={32} color="$red10" />
        <Text color="$red11">Wizard session not found</Text>
        <Text color="gray">Please upload your resume again to kick off the import flow.</Text>
      </Stack>
    )
  }

  const handleSaveCurrentStep = async () => {
    switch (currentStep.id) {
      case 'general': {
        await saveSection('general', {
          first_name: generalForm.firstName.trim() || undefined,
          last_name: generalForm.lastName.trim() || undefined,
          about: generalForm.summary.trim() || undefined,
        })
        return
      }
      case 'experience': {
        const experience = selectedExperience
        const safeStrategy = resolveMergeStrategy(
          mergeStrategies.experience,
          experience.length,
          existingExperience.length
        )
        await saveSection('experience', experience, safeStrategy)
        return
      }
      case 'education': {
        const education = selectedEducation
        const safeStrategy = resolveMergeStrategy(
          mergeStrategies.education,
          education.length,
          existingEducation.length
        )
        await saveSection('education', education, safeStrategy)
        return
      }
      case 'skills': {
        const skills = selectedSkills
        const safeStrategy = resolveMergeStrategy(
          mergeStrategies.skills,
          skills.length,
          existingSkillNames.length
        )
        await saveSection('skills', skills, safeStrategy)
        return
      }
      case 'certifications': {
        const certifications = selectedCertifications
        const safeStrategy = resolveMergeStrategy(
          mergeStrategies.certifications,
          certifications.length,
          existingCertificationNames.length
        )
        await saveSection('certifications', certifications, safeStrategy)
        return
      }
      case 'employment': {
        await saveSection('employment', {
          openToTravel: employmentForm.openToTravel,
          travelDistanceMiles: employmentForm.travelDistanceMiles ?? undefined,
          hourlyRate: employmentForm.hourlyRate ?? undefined,
          locations: employmentForm.locations
            .map((entry) => entry.value.trim())
            .filter((location) => location.length > 0),
        })
        return
      }
      case 'review': {
        router.push(ROUTES.DASHBOARD.PROFILE.GENERAL.path)
        return
      }
      default:
        return
    }
  }

  return (
    <Stack flex={1} gap={spacing.lg}>
      <Stack gap={8}>
        <Text>Resume Import</Text>
        <Text color="gray">
          Review each section parsed from your resume. Make edits or skip sections you don't want to
          import.
        </Text>
      </Stack>

      {hasExistingProfileData ? (
        <Stack gap={8} backgroundColor="$blue3" padding={12} borderRadius={16}>
          <Text color="$blue11">Merge resume with existing profile data</Text>
          <Text color="$blue11">
            We found previously saved information. Choose how each section merges to avoid
            overwriting details you want to keep.
          </Text>
        </Stack>
      ) : null}

      {mergedErrors && mergedErrors.length > 0 && (
        <Stack gap={8} backgroundColor="$yellow3" padding={12} borderRadius={16}>
          <Text color="$yellow11">We couldn’t parse everything in this section.</Text>
          {mergedErrors.map((error) => (
            <Text key={`${error.section}-${error.message}`} color="$yellow11">
              {error.message}
            </Text>
          ))}
        </Stack>
      )}

      <ScrollView flex={1}>
        <Stack gap={spacing.lg} paddingBottom={32}>
          {renderCurrentStep()}
        </Stack>
      </ScrollView>

      <Separator />

      <Row gap={12} justify="space-between" flexWrap="wrap">
        <Row gap={8}>
          <Button
            size={16}
            variant="outline"
            icon={CornerDownLeft}
            disabled={currentIndex === 0 || isSaving}
            onPress={goPrevious}
          >
            Previous
          </Button>
          {currentStep.id !== 'review' && (
            <Button
              size={16}
              variant="outline"
              theme="blue"
              icon={SkipForward}
              disabled={isSaving}
              onPress={() => void skipSection()}
            >
              Skip
            </Button>
          )}
        </Row>

        <Button
          variant="primary"
          size={16}
          icon={isSaving ? Spinner : UploadCloud}
          disabled={isSaving}
          onPress={() => void handleSaveCurrentStep()}
        >
          {currentStep.id === 'review' ? 'Finish Import' : 'Save & Continue'}
        </Button>
      </Row>
    </Stack>
  )

  function renderCurrentStep() {
    switch (currentStep.id) {
      case 'general':
        return renderGeneralStep()
      case 'experience':
        return renderExperienceStep()
      case 'education':
        return renderEducationStep()
      case 'skills':
        return renderSkillsStep()
      case 'certifications':
        return renderCertificationsStep()
      case 'employment':
        return renderEmploymentStep()
      case 'review':
        return renderReviewStep()
      default:
        return null
    }
  }

  function renderGeneralStep() {
    return (
      <Stack gap={16}>
        <Text>General Information</Text>
        <Paragraph color="gray">
          Update your basic profile details. We only update the fields you confirm.
        </Paragraph>
        <Row gap={16} flexWrap="wrap">
          <Stack gap={8} flex={1}>
            <Text>First Name</Text>
            <Input
              value={generalForm.firstName}
              onChangeText={(value) => setGeneralForm((prev) => ({ ...prev, firstName: value }))}
            />
          </Stack>
          <Stack gap={8} flex={1}>
            <Text>Last Name</Text>
            <Input
              value={generalForm.lastName}
              onChangeText={(value) => setGeneralForm((prev) => ({ ...prev, lastName: value }))}
            />
          </Stack>
        </Row>
        <Stack gap={8}>
          <Text>Summary</Text>
          <Input
            multiline
            numberOfLines={4}
            value={generalForm.summary}
            onChangeText={(value) => setGeneralForm((prev) => ({ ...prev, summary: value }))}
          />
        </Stack>
      </Stack>
    )
  }

  function renderExperienceStep() {
    const experience = parsedData.experience ?? []
    if (experience.length === 0) {
      return <EmptyState message="No experience entries detected in your resume." />
    }
    return (
      <Stack gap={16}>
        <Text>Work Experience</Text>
        <MergeStrategySelector
          section="experience"
          strategy={mergeStrategies.experience}
          onChange={updateMergeStrategy}
          existingCount={existingExperience.length}
          disabled={isSaving}
        />
        {experience.map((entry, index) => {
          const details = buildDetails([
            entry.startDate && entry.endDate ? `${entry.startDate} – ${entry.endDate}` : undefined,
            entry.summary,
          ])
          return (
            <SelectableCard
              key={`${entry.title}-${entry.company}-${index}`}
              checked={experienceSelections[index]}
              onCheckedChange={(value) => experienceSelections.set(index, value)}
              title={entry.title ?? 'Untitled Role'}
              subtitle={entry.company ?? 'Unknown Company'}
              details={details}
            />
          )
        })}
      </Stack>
    )
  }

  function renderEducationStep() {
    const education = parsedData.education ?? []
    if (education.length === 0) {
      return <EmptyState message="We didn’t find education entries in this resume." />
    }
    return (
      <Stack gap={16}>
        <Text>Education</Text>
        <MergeStrategySelector
          section="education"
          strategy={mergeStrategies.education}
          onChange={updateMergeStrategy}
          existingCount={existingEducation.length}
          disabled={isSaving}
        />
        {education.map((entry, index) => {
          const details = buildDetails([
            entry.startDate && entry.endDate ? `${entry.startDate} – ${entry.endDate}` : undefined,
            entry.fieldOfStudy,
          ])
          return (
            <SelectableCard
              key={`${entry.school}-${index}`}
              checked={educationSelections[index]}
              onCheckedChange={(value) => educationSelections.set(index, value)}
              title={entry.school ?? 'Institution'}
              subtitle={entry.degree}
              details={details}
            />
          )
        })}
      </Stack>
    )
  }

  function renderSkillsStep() {
    const skills = parsedData.skills ?? []
    if (skills.length === 0) {
      return (
        <EmptyState message="No skills were detected. You can always add skills manually later." />
      )
    }
    return (
      <Stack gap={16}>
        <Text>Skills</Text>
        <MergeStrategySelector
          section="skills"
          strategy={mergeStrategies.skills}
          onChange={updateMergeStrategy}
          existingCount={existingSkillNames.length}
          disabled={isSaving}
        />
        {skills.map((skill, index) => (
          <ToggleCard
            key={`${skill.name}-${index}`}
            checked={skillSelections[index]}
            onCheckedChange={(value) => skillSelections.set(index, value)}
            title={skill.name}
          />
        ))}
      </Stack>
    )
  }

  function renderCertificationsStep() {
    const certifications = parsedData.certifications ?? []
    if (certifications.length === 0) {
      return <EmptyState message="No certifications were found in this resume." />
    }
    return (
      <Stack gap={16}>
        <Text>Certifications</Text>
        <MergeStrategySelector
          section="certifications"
          strategy={mergeStrategies.certifications}
          onChange={updateMergeStrategy}
          existingCount={existingCertificationNames.length}
          disabled={isSaving}
        />
        {certifications.map((cert, index) => {
          const details = buildDetails([
            cert.issuedOn ? `Issued ${cert.issuedOn}` : undefined,
            cert.expiresOn ? `Expires ${cert.expiresOn}` : undefined,
          ])
          return (
            <ToggleCard
              key={`${cert.name}-${index}`}
              checked={certificationSelections[index]}
              onCheckedChange={(value) => certificationSelections.set(index, value)}
              title={cert.name ?? 'Certification'}
              description={cert.issuer}
              expandedContent={
                details.length > 0 ? (
                  <Stack gap={4} paddingTop={8}>
                    {details.map((detail) => (
                      <Text key={detail} color="gray">
                        • {detail}
                      </Text>
                    ))}
                  </Stack>
                ) : undefined
              }
            />
          )
        })}
      </Stack>
    )
  }

  function renderEmploymentStep() {
    return (
      <Stack gap={16}>
        <Text>Employment Preferences</Text>
        <Paragraph color="gray">
          Tell us about your ideal working conditions. We'll update your profile with these
          preferences.
        </Paragraph>
        <OpenToTravelCard
          checked={employmentForm.openToTravel}
          onCheckedChange={(checked) =>
            setEmploymentForm((prev) => ({ ...prev, openToTravel: checked }))
          }
          travelDistanceValue={employmentForm.travelDistanceMiles ?? 25}
          onTravelDistanceChange={(value) =>
            setEmploymentForm((prev) => ({
              ...prev,
              travelDistanceMiles: value,
            }))
          }
        />
        <Row gap={12} flexWrap="wrap">
          <Stack gap={8} flex={1}>
            <Text>Hourly rate (USD)</Text>
            <Input
              keyboardType="numeric"
              value={employmentForm.hourlyRate?.toString() ?? ''}
              onChangeText={(value) =>
                setEmploymentForm((prev) => ({
                  ...prev,
                  hourlyRate: parseNumericInput(value),
                }))
              }
            />
          </Stack>
        </Row>
        <Stack gap={8}>
          <Text>Preferred locations</Text>
          {employmentForm.locations.map((entry) => (
            <Row key={entry.id} gap={8} align="center">
              <Input
                flex={1}
                value={entry.value}
                onChangeText={(value) =>
                  setEmploymentForm((prev) => {
                    const next = prev.locations.map((item) =>
                      item.id === entry.id ? { ...item, value } : item
                    )
                    return { ...prev, locations: next }
                  })
                }
              />
              <Button
                size={12}
                variant="outline"
                onPress={() =>
                  setEmploymentForm((prev) => ({
                    ...prev,
                    locations: prev.locations.filter((item) => item.id !== entry.id),
                  }))
                }
              >
                Remove
              </Button>
            </Row>
          ))}
          <Button
            size={12}
            variant="outline"
            onPress={() =>
              setEmploymentForm((prev) => ({
                ...prev,
                locations: [
                  ...prev.locations,
                  {
                    id: `new-${Date.now()}`,
                    value: '',
                  },
                ],
              }))
            }
          >
            Add Location
          </Button>
        </Stack>
      </Stack>
    )
  }

  function renderReviewStep() {
    return (
      <Stack gap={16}>
        <Text>Review & Confirm</Text>
        <Paragraph color="gray">
          All set! When you finish, we’ll save the confirmed details to your profile. You can always
          make further edits from the profile sections later on.
        </Paragraph>
        <MergeComparisonView
          sections={mergeComparisonSections}
          isLoading={mergeComparisonLoading}
        />
        <Stack gap={8} backgroundColor="$green3" padding={12} borderRadius={16}>
          <Row gap={8} align="center">
            <CheckCircle2 color="$green10" />
            <Text color="$green11">Ready to finalize</Text>
          </Row>
          <Text color="$green11">
            Click “Finish Import” to exit the wizard and continue updating your profile.
          </Text>
        </Stack>
      </Stack>
    )
  }
}

function EmptyState({ message }: { message: string }) {
  return (
    <Stack gap={8} backgroundColor="$gray3" padding={12} borderRadius={16}>
      <Text color="gray">{message}</Text>
    </Stack>
  )
}

function SelectableCard({
  checked,
  onCheckedChange,
  title,
  subtitle,
  details,
}: {
  checked: boolean
  onCheckedChange: (next: boolean) => void
  title: string
  subtitle?: string
  details?: string[]
}) {
  return (
    <Stack
      gap={8}
      padding={12}
      borderWidth={1}
      borderColor={checked ? '$blue8' : '$borderColor'}
      backgroundColor={checked ? '$blue3' : '$background'}
      borderRadius={16}
    >
      <Row gap={8} align="center">
        <Checkbox
          size={12}
          checked={checked}
          onCheckedChange={(value) => onCheckedChange(value === true)}
        />
        <Stack gap={4} flex={1}>
          <Text>{title}</Text>
          {subtitle ? <Text color="gray">{subtitle}</Text> : null}
        </Stack>
      </Row>
      {!!details?.length && (
        <Stack gap={4} paddingLeft={16}>
          {details.map((detail) => (
            <Text key={detail} color="gray">
              • {detail}
            </Text>
          ))}
        </Stack>
      )}
    </Stack>
  )
}

interface BooleanSelections extends Array<boolean> {
  set: (index: number, value: boolean) => void
}

function useBooleanSelections(count: number): BooleanSelections {
  const [state, setState] = useState<boolean[]>(() => Array.from({ length: count }, () => true))

  useEffect(() => {
    setState(Array.from({ length: count }, () => true))
  }, [count])

  const set = (index: number, value: boolean) => {
    setState((prev) => {
      const next = [...prev]
      next[index] = value
      return next
    })
  }

  const selections = [...state] as BooleanSelections
  selections.set = set
  return selections
}

function MergeStrategySelector({
  section,
  strategy,
  onChange,
  existingCount,
  disabled,
}: {
  section: ResumeWizardSection
  strategy: ResumeMergeStrategy
  onChange: (section: ResumeWizardSection, next: ResumeMergeStrategy) => void
  existingCount: number
  disabled?: boolean
}) {
  const hasExistingData = existingCount > 0
  const options: Array<{
    value: ResumeMergeStrategy
    label: string
    description: string
    disabled?: boolean
  }> = [
    {
      value: 'replace',
      label: 'Replace existing data',
      description: hasExistingData
        ? 'Remove current entries and use only the selections from your resume.'
        : 'Import the selected entries into your profile.',
      disabled: false,
    },
  ]

  if (hasExistingData) {
    options.push(
      {
        value: 'append',
        label: 'Append to profile',
        description: 'Keep existing entries and add the selected resume items.',
      },
      {
        value: 'keepExisting',
        label: 'Keep existing only',
        description: 'Skip importing this section and preserve your current profile data.',
      }
    )
  }

  return (
    <Stack gap={8} backgroundColor="$color2" padding={12} borderRadius={16}>
      <Text>Merge strategy</Text>
      <Stack gap={8}>
        {options.map((option) => (
          <Button
            key={`${section}-${option.value}`}
            size={12}
            disabled={disabled || option.disabled}
            onPress={() => onChange(section, option.value)}
            borderWidth={1}
            borderColor={strategy === option.value ? '$blue7' : '$color6'}
            backgroundColor={strategy === option.value ? '$blue3' : '$color1'}
            pressStyle={{ backgroundColor: strategy === option.value ? '$blue4' : '$color2' }}
          >
            <Stack gap={4} align="flex-start">
              <Text>{option.label}</Text>
              <Text color="gray">{option.description}</Text>
            </Stack>
          </Button>
        ))}
      </Stack>
    </Stack>
  )
}

function buildDetails(lines: Array<string | undefined>) {
  return lines.filter((line): line is string => Boolean(line?.trim()))
}

function formatExperienceEntry(entry: Record<string, unknown>): string {
  const title = typeof entry.job_title === 'string' ? entry.job_title : undefined
  const company = typeof entry.company_name === 'string' ? entry.company_name : undefined
  if (title && company) {
    return `${title} · ${company}`
  }
  return title ?? company ?? 'Experience entry'
}

function formatParsedExperience(entry: ParsedExperienceEntry): string {
  const title = entry.title ?? ''
  const company = entry.company ?? ''
  const range =
    entry.startDate && entry.endDate
      ? `${entry.startDate} – ${entry.endDate}`
      : entry.startDate
        ? `${entry.startDate} – Present`
        : ''
  return [title, company, range].filter(Boolean).join(' · ') || 'Experience entry'
}

function formatEducationEntry(entry: Record<string, unknown>): string {
  const school = typeof entry.school === 'string' ? entry.school : undefined
  const degree = typeof entry.degree === 'string' ? entry.degree : undefined
  if (school && degree) {
    return `${degree} · ${school}`
  }
  return school ?? degree ?? 'Education entry'
}

function formatParsedEducation(entry: ParsedEducationEntry): string {
  const school = entry.school ?? ''
  const degree = entry.degree ?? ''
  return [degree, school].filter(Boolean).join(' · ') || 'Education entry'
}

function previewList(items: string[], limit = 3): string[] {
  if (items.length === 0) {
    return []
  }
  if (items.length <= limit) {
    return items
  }
  return [...items.slice(0, limit), `+${items.length - limit} more`]
}

function buildGeneralSummary(
  existing:
    | {
        first_name?: string
        last_name?: string
        about?: unknown
      }
    | null
    | undefined
) {
  if (!existing) {
    return ['No data saved yet']
  }
  const name = combineName(existing.first_name, existing.last_name)
  const about =
    existing.about && typeof existing.about === 'object'
      ? 'Profile summary present'
      : 'Summary not set'
  return [name || 'Name not set', about]
}

function buildSelectedGeneralSummary(form: GeneralFormState) {
  const name = combineName(form.firstName, form.lastName) || 'No name provided'
  const summary = form.summary.trim().length > 0 ? 'New summary from resume' : 'Summary unchanged'
  return [name, summary]
}

function combineName(first?: string, last?: string) {
  const parts = [first?.trim(), last?.trim()].filter(Boolean)
  return parts.join(' ') || ''
}

function buildEmploymentSummary(
  existing: {
    preferred_work_locations?: unknown[]
    hourly_rate?: number | null
    open_to_travel?: boolean
    travel_distance_miles?: number | null
  } | null
) {
  if (!existing) {
    return ['No employment preferences saved']
  }
  const locations = Array.isArray(existing.preferred_work_locations)
    ? existing.preferred_work_locations
        .map((location) => (typeof location === 'string' ? location : null))
        .filter((location): location is string => Boolean(location))
    : []
  const hourlyRate =
    typeof existing.hourly_rate === 'number'
      ? `Hourly rate: ${formatCurrency(existing.hourly_rate)}`
      : null
  const travel =
    typeof existing.travel_distance_miles === 'number'
      ? `Travel up to ${existing.travel_distance_miles} miles`
      : existing.open_to_travel === false
        ? 'Not open to travel'
        : null
  return [
    locations.length > 0 ? `Locations: ${locations.join(', ')}` : 'No preferred locations saved',
    hourlyRate ?? 'No hourly rate saved',
    travel ?? 'Travel preferences not set',
  ]
}

function buildIncomingEmploymentSummary(form: EmploymentFormState) {
  const locations = form.locations
    .map((location) => location.value.trim())
    .filter((location) => location.length > 0)
  const hourlyRate =
    typeof form.hourlyRate === 'number'
      ? `Hourly rate: ${formatCurrency(form.hourlyRate)}`
      : 'No hourly rate from resume'
  const travel =
    typeof form.travelDistanceMiles === 'number'
      ? `Travel up to ${form.travelDistanceMiles} miles`
      : form.openToTravel
        ? 'Open to travel'
        : 'Not open to travel'

  return [
    locations.length > 0 ? `Locations: ${locations.join(', ')}` : 'No locations detected in resume',
    hourlyRate,
    travel,
  ]
}

function formatCurrency(value: number) {
  if (!Number.isFinite(value)) {
    return '$0'
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value)
}

function parseNumericInput(value: string): number | null {
  if (!value.trim()) {
    return null
  }
  const parsed = Number.parseInt(value, 10)
  return Number.isNaN(parsed) ? null : parsed
}

function resolveMergeStrategy(
  strategy: ResumeMergeStrategy,
  selectedCount: number,
  existingCount: number
): ResumeMergeStrategy {
  if (existingCount === 0 && strategy === 'append') {
    return 'replace'
  }
  if (existingCount > 0 && selectedCount === 0 && strategy === 'replace') {
    return 'keepExisting'
  }
  return strategy
}
