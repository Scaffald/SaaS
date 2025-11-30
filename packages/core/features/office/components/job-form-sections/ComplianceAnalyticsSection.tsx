import { Input, Text, ToggleSwitch, XStack, YStack } from '@scaffald/tamagui-ui'
import { useState } from 'react'
import { Label } from 'tamagui'

interface ComplianceAnalyticsSectionProps {
  eeoJobCategory?: string
  isVeteranFriendly?: boolean
  isDisabilityFriendly?: boolean
  affirmativeActionPlan?: boolean
  sourceTrackingEnabled?: boolean
  onUpdate: (data: {
    eeo_job_category?: string
    is_veteran_friendly?: boolean
    is_disability_friendly?: boolean
    affirmative_action_plan?: boolean
    source_tracking_enabled?: boolean
  }) => void
}

export function ComplianceAnalyticsSection({
  eeoJobCategory,
  isVeteranFriendly,
  isDisabilityFriendly,
  affirmativeActionPlan,
  sourceTrackingEnabled,
  onUpdate,
}: ComplianceAnalyticsSectionProps) {
  const [localState, setLocalState] = useState({
    eeo_job_category: eeoJobCategory,
    is_veteran_friendly: isVeteranFriendly,
    is_disability_friendly: isDisabilityFriendly,
    affirmative_action_plan: affirmativeActionPlan,
    source_tracking_enabled: sourceTrackingEnabled,
  })

  const handleChange = (key: keyof typeof localState, value: string | boolean | undefined) => {
    const newState = { ...localState, [key]: value }
    setLocalState(newState)
    onUpdate(newState)
  }

  return (
    <YStack
      gap="$4"
      p="$4"
      bg="$background"
      rounded="$4"
      borderWidth={1}
      borderColor="$borderColor"
    >
      <Text fontSize="$6" fontWeight="600">
        Compliance & Analytics
      </Text>
      <Text fontSize="$2" color="$color10">
        EEO compliance and tracking settings
      </Text>

      {/* EEO Job Category */}
      <YStack gap="$2">
        <Label>EEO job category</Label>
        <Input
          placeholder="e.g. Craft Workers, Laborers, Operatives"
          value={localState.eeo_job_category || ''}
          onChangeText={(text) => handleChange('eeo_job_category', text || undefined)}
        />
        <Text fontSize="$2" color="$color10">
          Equal Employment Opportunity category
        </Text>
      </YStack>

      {/* Veteran Friendly */}
      <XStack gap="$3" items="center" justify="space-between">
        <YStack gap="$1" flex={1}>
          <Label>Veteran friendly</Label>
          <Text fontSize="$2" color="$color10">
            Position suitable for veterans
          </Text>
        </YStack>
        <ToggleSwitch
          checked={localState.is_veteran_friendly || false}
          onCheckedChange={(checked) => handleChange('is_veteran_friendly', checked)}
          aria-label="Veteran friendly"
        />
      </XStack>

      {/* Disability Friendly */}
      <XStack gap="$3" items="center" justify="space-between">
        <YStack gap="$1" flex={1}>
          <Label>Disability friendly</Label>
          <Text fontSize="$2" color="$color10">
            Accommodations available for disabilities
          </Text>
        </YStack>
        <ToggleSwitch
          checked={localState.is_disability_friendly || false}
          onCheckedChange={(checked) => handleChange('is_disability_friendly', checked)}
          aria-label="Disability friendly"
        />
      </XStack>

      {/* Affirmative Action Plan */}
      <XStack gap="$3" items="center" justify="space-between">
        <YStack gap="$1" flex={1}>
          <Label>Affirmative action plan</Label>
          <Text fontSize="$2" color="$color10">
            Part of affirmative action hiring
          </Text>
        </YStack>
        <ToggleSwitch
          checked={localState.affirmative_action_plan || false}
          onCheckedChange={(checked) => handleChange('affirmative_action_plan', checked)}
          aria-label="Affirmative action plan"
        />
      </XStack>

      {/* Source Tracking */}
      <XStack gap="$3" items="center" justify="space-between">
        <YStack gap="$1" flex={1}>
          <Label>Source tracking enabled</Label>
          <Text fontSize="$2" color="$color10">
            Track where applicants find this job
          </Text>
        </YStack>
        <ToggleSwitch
          checked={localState.source_tracking_enabled || false}
          onCheckedChange={(checked) => handleChange('source_tracking_enabled', checked)}
          aria-label="Source tracking enabled"
        />
      </XStack>
    </YStack>
  )
}
