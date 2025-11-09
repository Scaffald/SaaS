import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'expo-router'
import {
  Button,
  Checkbox,
  Input,
  Paragraph,
  ScrollView,
  Separator,
  Spinner,
  Text,
  XStack,
  YStack,
} from 'tamagui'
import { AlertCircle, CheckCircle2, CornerDownLeft, SkipForward, UploadCloud } from '@tamagui/lucide-icons'
import { spacing } from '@app/ui'
import { useResumeWizard, type ResumeWizardSection } from '../hooks/useResumeWizard'
import { ProgressIndicator } from './ProgressIndicator'
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
  locations: string[]
}

export function ResumeWizard({ resumeId }: ResumeWizardProps) {
  const router = useRouter()
  const {
    steps,
    currentIndex,
    currentStep,
    parsedData,
    errors,
    wizard,
    isLoading,
    isRefetching,
    isSaving,
    setCurrentIndex,
    goNext,
    goPrevious,
    saveSection,
    skipSection,
  } = useResumeWizard(resumeId)

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

  useEffect(() => {
    const general = parsedData.general?.[0]
    setGeneralForm({
      firstName: general?.firstName ?? '',
      lastName: general?.lastName ?? '',
      summary: general?.bio ?? '',
    })
  }, [parsedData.general])

  useEffect(() => {
    const employment = parsedData.employment ?? {}
    setEmploymentForm({
      openToTravel: Boolean(employment.openToTravel),
      travelDistanceMiles: employment.travelDistanceMiles ?? null,
      hourlyRate: employment.hourlyRate ?? null,
      locations: employment.locations ?? [],
    })
  }, [parsedData.employment])

  if (isLoading) {
    return (
      <YStack items="center" justify="center" flex={1} gap="$3" py="$10">
        <Spinner size="large" />
        <Text color="$color11">Loading resume import wizard...</Text>
      </YStack>
    )
  }

  if (!wizard) {
    return (
      <YStack items="center" justify="center" flex={1} gap="$3" py="$10">
        <AlertCircle size={32} color="$red10" />
        <Text fontWeight="700" color="$red11">
          Wizard session not found
        </Text>
        <Text color="$color11">
          Please upload your resume again to kick off the import flow.
        </Text>
      </YStack>
    )
  }

  const renderStep = () => {
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

  const mergedErrors = useMemo(() => {
    if (!errors || errors.length === 0) return null
    return errors.filter((error) => error.section === currentStep.id)
  }, [currentStep.id, errors])

  const completedSteps = wizard.completedSteps ?? []

  return (
    <YStack flex={1} gap={spacing.lg}>
      <YStack gap="$2">
        <Text fontSize="$7" fontWeight="700">Resume Import</Text>
        <Text color="$color11">
          Review each section parsed from your resume. Make edits or skip sections you don’t want to import.
        </Text>
      </YStack>

      <ProgressIndicator
        steps={steps}
        currentIndex={currentIndex}
        completedSteps={completedSteps}
        onStepChange={setCurrentIndex}
      />

      {mergedErrors && mergedErrors.length > 0 && (
        <YStack gap="$2" bg="$yellow3" p="$3" rounded="$4">
          <Text fontWeight="700" color="$yellow11">
            We couldn’t parse everything in this section.
          </Text>
          {mergedErrors.map((error) => (
            <Text key={`${error.section}-${error.message}`} color="$yellow11">
              {error.message}
            </Text>
          ))}
        </YStack>
      )}

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: spacing['2xl'] }}>
        <YStack gap={spacing.lg}>
          {renderStep()}
        </YStack>
      </ScrollView>

      <Separator />

      <XStack gap="$3" justify="space-between" flexWrap="wrap">
        <XStack gap="$2">
          <Button
            size="$4"
            variant="outlined"
            icon={CornerDownLeft}
            disabled={currentIndex === 0 || isSaving}
            onPress={goPrevious}
          >
            Previous
          </Button>
          {currentStep.id !== 'review' && (
            <Button
              size="$4"
              variant="outlined"
              theme="blue"
              icon={SkipForward}
              disabled={isSaving}
              onPress={() => skipSection()}
            >
              Skip
            </Button>
          )}
        </XStack>

        <Button
          size="$4"
          theme="blue"
          icon={isSaving ? Spinner : UploadCloud}
          disabled={isSaving}
          onPress={() => {
            if (currentStep.id === 'review') {
              router.push('/dashboard/profile/general')
              return
            }
            handleSaveCurrentStep()
          }}
        >
          {currentStep.id === 'review' ? 'Finish Import' : 'Save & Continue'}
        </Button>
      </XStack>
    </YStack>
  )

  function handleSaveCurrentStep() {
    switch (currentStep.id) {
      case 'general':
        return saveSection('general', {
          first_name: generalForm.firstName.trim() || undefined,
          last_name: generalForm.lastName.trim() || undefined,
          about: generalForm.summary.trim() || undefined,
        })
      case 'experience':
        return saveSection('experience', (parsedData.experience ?? []).filter((_, index) => experienceSelections[index]))
      case 'education':
        return saveSection('education', (parsedData.education ?? []).filter((_, index) => educationSelections[index]))
      case 'skills':
        return saveSection('skills', (parsedData.skills ?? []).filter((_, index) => skillSelections[index]))
      case 'certifications':
        return saveSection(
          'certifications',
          (parsedData.certifications ?? []).filter((_, index) => certificationSelections[index])
        )
      case 'employment':
        return saveSection('employment', {
          openToTravel: employmentForm.openToTravel,
          travelDistanceMiles: employmentForm.travelDistanceMiles ?? undefined,
          hourlyRate: employmentForm.hourlyRate ?? undefined,
          locations: employmentForm.locations,
        })
      default:
        return Promise.resolve()
    }
  }

  function renderGeneralStep() {
    return (
      <YStack gap="$4">
        <Text fontSize="$6" fontWeight="700">General Information</Text>
        <Paragraph color="$color11">
          Update your basic profile details. We only update the fields you confirm.
        </Paragraph>
        <XStack gap="$4" flexWrap="wrap">
          <YStack gap="$2" flex={1} minWidth={200}>
            <Text fontWeight="600">First Name</Text>
            <Input value={generalForm.firstName} onChangeText={(value) => setGeneralForm((prev) => ({ ...prev, firstName: value }))} />
          </YStack>
          <YStack gap="$2" flex={1} minWidth={200}>
            <Text fontWeight="600">Last Name</Text>
            <Input value={generalForm.lastName} onChangeText={(value) => setGeneralForm((prev) => ({ ...prev, lastName: value }))} />
          </YStack>
        </XStack>
        <YStack gap="$2">
          <Text fontWeight="600">Summary</Text>
          <Input
            multiline
            numberOfLines={4}
            value={generalForm.summary}
            onChangeText={(value) => setGeneralForm((prev) => ({ ...prev, summary: value }))}
          />
        </YStack>
      </YStack>
    )
  }

  function renderExperienceStep() {
    const experience = parsedData.experience ?? []
    if (experience.length === 0) {
      return <EmptyState message="No experience entries detected in your resume." />
    }
    return (
      <YStack gap="$4">
        <Text fontSize="$6" fontWeight="700">Work Experience</Text>
        {experience.map((entry, index) => (
          <SelectableCard
            key={`${entry.title}-${entry.company}-${index}`}
            checked={experienceSelections[index]}
            onCheckedChange={(value) => experienceSelections.set(index, value)}
            title={entry.title ?? 'Untitled Role'}
            subtitle={entry.company ?? 'Unknown Company'}
            details={[
              entry.startDate && entry.endDate
                ? `${entry.startDate} – ${entry.endDate}`
                : entry.startDate
                  ? `${entry.startDate} – Present`
                  : undefined,
              entry.summary ?? undefined,
            ].filter(Boolean)}
          />
        ))}
      </YStack>
    )
  }

  function renderEducationStep() {
    const education = parsedData.education ?? []
    if (education.length === 0) {
      return <EmptyState message="We didn’t find education entries in this resume." />
    }
    return (
      <YStack gap="$4">
        <Text fontSize="$6" fontWeight="700">Education</Text>
        {education.map((entry, index) => (
          <SelectableCard
            key={`${entry.school}-${index}`}
            checked={educationSelections[index]}
            onCheckedChange={(value) => educationSelections.set(index, value)}
            title={entry.school ?? 'Institution'}
            subtitle={entry.degree ?? undefined}
            details={[
              entry.startDate && entry.endDate ? `${entry.startDate} – ${entry.endDate}` : undefined,
              entry.fieldOfStudy ?? undefined,
            ].filter(Boolean)}
          />
        ))}
      </YStack>
    )
  }

  function renderSkillsStep() {
    const skills = parsedData.skills ?? []
    if (skills.length === 0) {
      return <EmptyState message="No skills were detected. You can always add skills manually later." />
    }
    return (
      <YStack gap="$4">
        <Text fontSize="$6" fontWeight="700">Skills</Text>
        {skills.map((skill, index) => (
          <SelectableCard
            key={`${skill.name}-${index}`}
            checked={skillSelections[index]}
            onCheckedChange={(value) => skillSelections.set(index, value)}
            title={skill.name}
            subtitle={skill.confidence ? `Confidence: ${(skill.confidence * 100).toFixed(0)}%` : undefined}
            details={[]}
          />
        ))}
      </YStack>
    )
  }

  function renderCertificationsStep() {
    const certifications = parsedData.certifications ?? []
    if (certifications.length === 0) {
      return <EmptyState message="No certifications were found in this resume." />
    }
    return (
      <YStack gap="$4">
        <Text fontSize="$6" fontWeight="700">Certifications</Text>
        {certifications.map((cert, index) => (
          <SelectableCard
            key={`${cert.name}-${index}`}
            checked={certificationSelections[index]}
            onCheckedChange={(value) => certificationSelections.set(index, value)}
            title={cert.name ?? 'Certification'}
            subtitle={cert.issuer ?? undefined}
            details={[
              cert.issuedOn ? `Issued ${cert.issuedOn}` : undefined,
              cert.expiresOn ? `Expires ${cert.expiresOn}` : undefined,
            ].filter(Boolean)}
          />
        ))}
      </YStack>
    )
  }

  function renderEmploymentStep() {
    return (
      <YStack gap="$4">
        <Text fontSize="$6" fontWeight="700">Employment Preferences</Text>
        <Paragraph color="$color11">
          Tell us about your ideal working conditions. We’ll update your profile with these preferences.
        </Paragraph>
        <CheckboxRow
          label="Open to travel"
          checked={employmentForm.openToTravel}
          onCheckedChange={(value) => setEmploymentForm((prev) => ({ ...prev, openToTravel: value }))}
        />
        <XStack gap="$3" flexWrap="wrap">
          <YStack gap="$2" flex={1} minWidth={160}>
            <Text fontWeight="600">Travel distance (miles)</Text>
            <Input
              keyboardType="numeric"
              value={employmentForm.travelDistanceMiles?.toString() ?? ''}
              onChangeText={(value) => setEmploymentForm((prev) => ({
                ...prev,
                travelDistanceMiles: value ? Number.parseInt(value, 10) : null,
              }))}
            />
          </YStack>
          <YStack gap="$2" flex={1} minWidth={160}>
            <Text fontWeight="600">Hourly rate (USD)</Text>
            <Input
              keyboardType="numeric"
              value={employmentForm.hourlyRate?.toString() ?? ''}
              onChangeText={(value) => setEmploymentForm((prev) => ({
                ...prev,
                hourlyRate: value ? Number.parseInt(value, 10) : null,
              }))}
            />
          </YStack>
        </XStack>
        <YStack gap="$2">
          <Text fontWeight="600">Preferred locations</Text>
          <Paragraph color="$color11">
            We detected {employmentForm.locations.length} location(s) in your resume. Add or remove locations as needed.
          </Paragraph>
          {employmentForm.locations.map((location, index) => (
            <XStack key={`${location}-${index}`} gap="$2" items="center">
              <Input
                flex={1}
                value={location}
                onChangeText={(value) => {
                  setEmploymentForm((prev) => {
                    const next = [...prev.locations]
                    next[index] = value
                    return { ...prev, locations: next }
                  })
                }}
              />
              <Button
                size="$3"
                variant="outlined"
                onPress={() => {
                  setEmploymentForm((prev) => ({
                    ...prev,
                    locations: prev.locations.filter((_, locIndex) => locIndex !== index),
                  }))
                }}
              >
                Remove
              </Button>
            </XStack>
          ))}
          <Button
            size="$3"
            variant="outlined"
            onPress={() => {
              setEmploymentForm((prev) => ({
                ...prev,
                locations: [...prev.locations, ''],
              }))
            }}
          >
            Add Location
          </Button>
        </YStack>
      </YStack>
    )
  }

  function renderReviewStep() {
    return (
      <YStack gap="$4">
        <Text fontSize="$6" fontWeight="700">Review & Confirm</Text>
        <Paragraph color="$color11">
          All set! When you finish, we’ll save the confirmed details to your profile. You can always make further edits
          from the profile sections later on.
        </Paragraph>
        <MergeComparisonView existingData={wizard} newData={parsedData} />
        <YStack gap="$2" bg="$green3" p="$3" rounded="$4">
          <XStack gap="$2" items="center">
            <CheckCircle2 color="$green10" />
            <Text fontWeight="700" color="$green11">
              Ready to finalize
            </Text>
          </XStack>
          <Text color="$green11">
            Click “Finish Import” to exit the wizard and continue updating your profile.
          </Text>
        </YStack>
      </YStack>
    )
  }
}

function EmptyState({ message }: { message: string }) {
  return (
    <YStack gap="$2" bg="$gray3" p="$3" rounded="$4">
      <Text color="$color11">{message}</Text>
    </YStack>
  )
}

function CheckboxRow({
  label,
  checked,
  onCheckedChange,
}: {
  label: string
  checked: boolean
  onCheckedChange: (next: boolean) => void
}) {
  return (
    <XStack gap="$2" items="center">
      <Checkbox
        size="$3"
        checked={checked}
        onCheckedChange={(value) => onCheckedChange(value === true)}
      />
      <Text>{label}</Text>
    </XStack>
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
    <YStack
      gap="$2"
      p="$3"
      borderWidth={1}
      borderColor={checked ? '$blue8' : '$borderColor'}
      bg={checked ? '$blue3' : '$background'}
      rounded="$4"
    >
      <XStack gap="$2" items="center">
        <Checkbox
          size="$3"
          checked={checked}
          onCheckedChange={(value) => onCheckedChange(value === true)}
        />
        <YStack gap="$1" flex={1}>
          <Text fontWeight="700">{title}</Text>
          {subtitle ? <Text color="$color11">{subtitle}</Text> : null}
        </YStack>
      </XStack>
      {details && details.length > 0 ? (
        <YStack gap="$1" pl="$4">
          {details.map((detail, index) => (
            <Text key={`${detail}-${index}`} color="$color11">
              • {detail}
            </Text>
          ))}
        </YStack>
      ) : null}
    </YStack>
  )
}

function useBooleanSelections(count: number) {
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

  return Object.assign(state, { set })
}

