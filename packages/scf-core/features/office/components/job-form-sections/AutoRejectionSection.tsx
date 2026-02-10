import { Text, ToggleSwitch, Row, Stack } from '@unicornlove/beyond-ui'
import { HelpCircle } from 'lucide-react-native'
import { useState } from 'react'
import { Label } from '@unicornlove/beyond-ui'

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
    <Stack gap="$4" padding="$4">
      <Stack gap="$2">
        <Text fontSize="$6" fontWeight="600">
          Auto-Rejection
        </Text>
        <Text fontSize="$2">Automatically reject applicants who don't meet minimum criteria</Text>
      </Stack>

      {/* Enable Auto-Rejection */}
      <Row gap="$3" alignItems="center" justifyContent="space-between">
        <Row gap="$2" alignItems="center" flex={1}>
          <Label fontWeight="600">Reject automatically</Label>
          <HelpCircle size={16} color="$color10" />
        </Row>
        <ToggleSwitch
          checked={localState.enabled}
          onCheckedChange={handleToggle}
          aria-label="Enable auto-rejection"
        />
      </Row>
      <Text fontSize="$2" color="$color10">
        Based on Elevate score, work authorization and required skills
      </Text>

      {/* Criteria (only show when enabled) */}
      {localState.enabled && (
        <Stack gap="$3" padding="$3">
          <Text fontSize="$3" fontWeight="600">
            Rejection Criteria
          </Text>

          {/* Work Authorization */}
          <Row gap="$3">
            <Stack gap="$1" flex={1}>
              <Label>Work authorization required</Label>
              <Text fontSize="$1">Reject if not authorized to work</Text>
            </Stack>
            <ToggleSwitch
              checked={localState.criteria.require_work_authorization || false}
              onCheckedChange={(checked: boolean) =>
                handleCriteriaChange('require_work_authorization', checked)
              }
              aria-label="Work authorization required"
            />
          </Row>

          {/* All Skills Required */}
          <Row gap="$3">
            <Stack gap="$1" flex={1}>
              <Label>All skills required</Label>
              <Text fontSize="$1">Reject if missing any required skills</Text>
            </Stack>
            <ToggleSwitch
              checked={localState.criteria.require_all_skills || false}
              onCheckedChange={(checked: boolean) =>
                handleCriteriaChange('require_all_skills', checked)
              }
              aria-label="All skills required"
            />
          </Row>

          {/* All Certifications Required */}
          <Row gap="$3">
            <Stack gap="$1" flex={1}>
              <Label>All certifications required</Label>
              <Text fontSize="$1">Reject if missing any required certifications</Text>
            </Stack>
            <ToggleSwitch
              checked={localState.criteria.require_all_certifications || false}
              onCheckedChange={(checked: boolean) =>
                handleCriteriaChange('require_all_certifications', checked)
              }
              aria-label="All certifications required"
            />
          </Row>

          <Stack gap="$2" padding="$3">
            <Text fontSize="$2" fontWeight="600" color="$yellow11">
              ⚠️ Important
            </Text>
            <Text fontSize="$1" color="$yellow11">
              Auto-rejected applicants will be notified and moved to a "Rejected" status. This
              action cannot be undone automatically. Review your criteria carefully.
            </Text>
          </Stack>
        </Stack>
      )}
    </Stack>
  )
}
