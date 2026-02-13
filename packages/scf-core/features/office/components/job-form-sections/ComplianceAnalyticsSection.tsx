import { Input, Text, ToggleSwitch, Row, Stack, useThemeContext } from '@unicornlove/beyond-ui'
import { useState } from 'react'
import { Label } from '@unicornlove/beyond-ui'
import { colors } from '@unicornlove/beyond-ui/tokens'

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
  const { theme } = useThemeContext()
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
    <Stack
      gap={16}
      padding="md"
      style={{ backgroundColor: colors.bg[theme].default }}
      borderRadius={16}
      borderWidth={1}
      borderColor={colors.border[theme].default}
    >
      <Text>Compliance & Analytics</Text>
      <Text style={{ color: colors.text[theme].secondary }}>
        EEO compliance and tracking settings
      </Text>

      {/* EEO Job Category */}
      <Stack gap={8}>
        <Label>EEO job category</Label>
        <Input
          placeholder="e.g. Craft Workers, Laborers, Operatives"
          value={localState.eeo_job_category || ''}
          onChangeText={(text) => handleChange('eeo_job_category', text || undefined)}
        />
        <Text style={{ color: colors.text[theme].secondary }}>
          Equal Employment Opportunity category
        </Text>
      </Stack>

      {/* Veteran Friendly */}
      <Row gap={12} align="center" justify="space-between">
        <Stack gap={4} flex={1}>
          <Label>Veteran friendly</Label>
          <Text style={{ color: colors.text[theme].secondary }}>
            Position suitable for veterans
          </Text>
        </Stack>
        <ToggleSwitch
          checked={localState.is_veteran_friendly || false}
          onChange={(checked) => handleChange('is_veteran_friendly', checked)}
          aria-label="Veteran friendly"
        />
      </Row>

      {/* Disability Friendly */}
      <Row gap={12} align="center" justify="space-between">
        <Stack gap={4} flex={1}>
          <Label>Disability friendly</Label>
          <Text style={{ color: colors.text[theme].secondary }}>
            Accommodations available for disabilities
          </Text>
        </Stack>
        <ToggleSwitch
          checked={localState.is_disability_friendly || false}
          onChange={(checked) => handleChange('is_disability_friendly', checked)}
          aria-label="Disability friendly"
        />
      </Row>

      {/* Affirmative Action Plan */}
      <Row gap={12} align="center" justify="space-between">
        <Stack gap={4} flex={1}>
          <Label>Affirmative action plan</Label>
          <Text style={{ color: colors.text[theme].secondary }}>
            Part of affirmative action hiring
          </Text>
        </Stack>
        <ToggleSwitch
          checked={localState.affirmative_action_plan || false}
          onChange={(checked) => handleChange('affirmative_action_plan', checked)}
          aria-label="Affirmative action plan"
        />
      </Row>

      {/* Source Tracking */}
      <Row gap={12} align="center" justify="space-between">
        <Stack gap={4} flex={1}>
          <Label>Source tracking enabled</Label>
          <Text style={{ color: colors.text[theme].secondary }}>
            Track where applicants find this job
          </Text>
        </Stack>
        <ToggleSwitch
          checked={localState.source_tracking_enabled || false}
          onChange={(checked) => handleChange('source_tracking_enabled', checked)}
          aria-label="Source tracking enabled"
        />
      </Row>
    </Stack>
  )
}
