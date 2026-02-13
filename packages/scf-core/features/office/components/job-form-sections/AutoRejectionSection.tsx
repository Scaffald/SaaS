import { Text, ToggleSwitch, Row, Stack, useThemeContext } from '@unicornlove/beyond-ui'
import { HelpCircle } from 'lucide-react-native'
import { useState } from 'react'
import { Label } from '@unicornlove/beyond-ui'
import { colors } from '@unicornlove/beyond-ui/tokens'

interface AutoRejectCriteria {
  score_minimum?: number
  require_work_authorization?: boolean
  require_all_skills?: boolean
  require_all_certifications?: boolean
}

interface AutoRejectionSectionProps {
  enabled: boolean
  criteria: AutoRejectCriteria
  onUpdate: (data: {
    enable_auto_reject: boolean
    auto_reject_criteria: AutoRejectCriteria
  }) => void
}

export function AutoRejectionSection({ enabled, criteria, onUpdate }: AutoRejectionSectionProps) {
  const { theme } = useThemeContext()
  const [localState, setLocalState] = useState({
    enabled,
    criteria: criteria || {},
  })

  const handleToggle = (checked: boolean) => {
    const newState = { ...localState, enabled: checked }
    setLocalState(newState)
    onUpdate({
      enable_auto_reject: checked,
      auto_reject_criteria: newState.criteria,
    })
  }

  const handleCriteriaChange = (key: keyof AutoRejectCriteria, value: boolean | number) => {
    const newCriteria = { ...localState.criteria, [key]: value }
    const newState = { ...localState, criteria: newCriteria }
    setLocalState(newState)
    onUpdate({
      enable_auto_reject: localState.enabled,
      auto_reject_criteria: newCriteria,
    })
  }

  return (
    <Stack gap={16} padding="md">
      <Stack gap={8}>
        <Text>Auto-Rejection</Text>
        <Text>Automatically reject applicants who don't meet minimum criteria</Text>
      </Stack>

      {/* Enable Auto-Rejection */}
      <Row gap={12} align="center" justify="space-between">
        <Row gap={8} align="center" flex={1}>
          <Label>Reject automatically</Label>
          <HelpCircle size="md" style={{ color: colors.text[theme].secondary }} />
        </Row>
        <ToggleSwitch
          checked={localState.enabled}
          onChange={handleToggle}
          aria-label="Enable auto-rejection"
        />
      </Row>
      <Text style={{ color: colors.text[theme].secondary }}>
        Based on Elevate score, work authorization and required skills
      </Text>

      {/* Criteria (only show when enabled) */}
      {localState.enabled && (
        <Stack gap={12} padding="sm">
          <Text>Rejection Criteria</Text>

          {/* Work Authorization */}
          <Row gap={12}>
            <Stack gap={4} flex={1}>
              <Label>Work authorization required</Label>
              <Text>Reject if not authorized to work</Text>
            </Stack>
            <ToggleSwitch
              checked={localState.criteria.require_work_authorization || false}
              onChange={(checked: boolean) =>
                handleCriteriaChange('require_work_authorization', checked)
              }
              aria-label="Work authorization required"
            />
          </Row>

          {/* All Skills Required */}
          <Row gap={12}>
            <Stack gap={4} flex={1}>
              <Label>All skills required</Label>
              <Text>Reject if missing any required skills</Text>
            </Stack>
            <ToggleSwitch
              checked={localState.criteria.require_all_skills || false}
              onChange={(checked: boolean) => handleCriteriaChange('require_all_skills', checked)}
              aria-label="All skills required"
            />
          </Row>

          {/* All Certifications Required */}
          <Row gap={12}>
            <Stack gap={4} flex={1}>
              <Label>All certifications required</Label>
              <Text>Reject if missing any required certifications</Text>
            </Stack>
            <ToggleSwitch
              checked={localState.criteria.require_all_certifications || false}
              onChange={(checked: boolean) =>
                handleCriteriaChange('require_all_certifications', checked)
              }
              aria-label="All certifications required"
            />
          </Row>

          <Stack gap={8} padding="sm">
            <Text style={{ color: colors.text[theme].warning }}>⚠️ Important</Text>
            <Text style={{ color: colors.text[theme].warning }}>
              Auto-rejected applicants will be notified and moved to a "Rejected" status. This
              action cannot be undone automatically. Review your criteria carefully.
            </Text>
          </Stack>
        </Stack>
      )}
    </Stack>
  )
}
