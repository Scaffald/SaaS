import { useState } from 'react'
import { YStack, XStack, Text, Input } from '@app/ui'
import { Label, Switch } from 'tamagui'

interface ApplicationProcessSectionProps {
  requiresAssessment?: boolean
  assessmentDetails?: string
  requiresVideoInterview?: boolean
  estimatedApplicationTimeMinutes?: number
  applicationExpiryDays?: number
  onUpdate: (data: {
    requires_assessment?: boolean
    assessment_details?: string
    requires_video_interview?: boolean
    estimated_application_time_minutes?: number
    application_expiry_days?: number
  }) => void
}

export function ApplicationProcessSection({
  requiresAssessment,
  assessmentDetails,
  requiresVideoInterview,
  estimatedApplicationTimeMinutes,
  applicationExpiryDays,
  onUpdate,
}: ApplicationProcessSectionProps) {
  const [localState, setLocalState] = useState({
    requires_assessment: requiresAssessment,
    assessment_details: assessmentDetails,
    requires_video_interview: requiresVideoInterview,
    estimated_application_time_minutes: estimatedApplicationTimeMinutes,
    application_expiry_days: applicationExpiryDays,
  })

  const handleChange = (
    key: keyof typeof localState,
    value: string | number | boolean | undefined
  ) => {
    const newState = { ...localState, [key]: value }
    setLocalState(newState)
    onUpdate(newState)
  }

  return (
    <YStack
      gap="$4"
      p="$4"
      bg="$background"
      borderRadius="$4"
      borderWidth={1}
      borderColor="$borderColor"
    >
      <Text fontSize="$6" fontWeight="600">
        Application Process
      </Text>
      <Text fontSize="$2" color="$gray10">
        Configure the application process and requirements
      </Text>

      {/* Requires Assessment */}
      <XStack gap="$3" alignItems="center" justifyContent="space-between">
        <YStack gap="$1" flex={1}>
          <Label htmlFor="assessment">Requires assessment</Label>
          <Text fontSize="$2" color="$gray10">
            Skills or aptitude test required
          </Text>
        </YStack>
        <Switch
          id="assessment"
          checked={localState.requires_assessment || false}
          onCheckedChange={(checked) => handleChange('requires_assessment', checked)}
        >
          <Switch.Thumb animation="quick" />
        </Switch>
      </XStack>

      {localState.requires_assessment && (
        <YStack gap="$2">
          <Label>Assessment details</Label>
          <Input
            placeholder="Describe the assessment or test"
            value={localState.assessment_details || ''}
            onChangeText={(text) => handleChange('assessment_details', text || undefined)}
          />
        </YStack>
      )}

      {/* Requires Video Interview */}
      <XStack gap="$3" alignItems="center" justifyContent="space-between">
        <YStack gap="$1" flex={1}>
          <Label htmlFor="videoInterview">Requires video interview</Label>
          <Text fontSize="$2" color="$gray10">
            Pre-recorded video interview required
          </Text>
        </YStack>
        <Switch
          id="videoInterview"
          checked={localState.requires_video_interview || false}
          onCheckedChange={(checked) => handleChange('requires_video_interview', checked)}
        >
          <Switch.Thumb animation="quick" />
        </Switch>
      </XStack>

      {/* Estimated Application Time */}
      <YStack gap="$2">
        <Label>Estimated application time (minutes)</Label>
        <Input
          placeholder="e.g. 15"
          keyboardType="numeric"
          value={localState.estimated_application_time_minutes?.toString() || ''}
          onChangeText={(text) => {
            const num = Number.parseInt(text, 10)
            handleChange('estimated_application_time_minutes', Number.isNaN(num) ? undefined : num)
          }}
        />
        <Text fontSize="$2" color="$gray10">
          How long it takes to complete the application
        </Text>
      </YStack>

      {/* Application Expiry */}
      <YStack gap="$2">
        <Label>Application expiry (days)</Label>
        <Input
          placeholder="e.g. 30"
          keyboardType="numeric"
          value={localState.application_expiry_days?.toString() || ''}
          onChangeText={(text) => {
            const num = Number.parseInt(text, 10)
            handleChange('application_expiry_days', Number.isNaN(num) ? undefined : num)
          }}
        />
        <Text fontSize="$2" color="$gray10">
          Days after which started applications expire
        </Text>
      </YStack>
    </YStack>
  )
}
