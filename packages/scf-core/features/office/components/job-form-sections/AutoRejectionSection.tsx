import { Text, ToggleSwitch, XStack, YStack } from '@unicornlove/ui'
import { HelpCircle } from '@tamagui/lucide-icons'
import { useState } from 'react'
import { Label } from '@unicornlove/ui'

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
    <YStack gap="$4" padding="$4">
      <YStack gap="$2">
        <Text fontSize="$6" fontWeight="600">
          Auto-Rejection
        </Text>
        <Text fontSize="$2">Automatically reject applicants who don't meet minimum criteria</Text>
      </YStack>

      {/* Enable Auto-Rejection */}
      <XStack gap="$3" alignItems="center" justifyContent="space-between">
        <XStack gap="$2" alignItems="center" flex={1}>
          <Label fontWeight="600">Reject automatically</Label>
          <HelpCircle size={16} color="$color10" />
        </XStack>
        <ToggleSwitch
          checked={localState.enabled}
          onCheckedChange={handleToggle}
          aria-label="Enable auto-rejection"
        />
      </XStack>
      <Text fontSize="$2" color="$color10">
        Based on Elevate score, work authorization and required skills
      </Text>

      {/* Criteria (only show when enabled) */}
      {localState.enabled && (
        <YStack gap="$3" padding="$3">
          <Text fontSize="$3" fontWeight="600">
            Rejection Criteria
          </Text>

          {/* Work Authorization */}
          <XStack gap="$3">
            <YStack gap="$1" flex={1}>
              <Label>Work authorization required</Label>
              <Text fontSize="$1">Reject if not authorized to work</Text>
            </YStack>
            <ToggleSwitch
              checked={localState.criteria.require_work_authorization || false}
              onCheckedChange={(checked: boolean) =>
                handleCriteriaChange('require_work_authorization', checked)
              }
              aria-label="Work authorization required"
            />
          </XStack>

          {/* All Skills Required */}
          <XStack gap="$3">
            <YStack gap="$1" flex={1}>
              <Label>All skills required</Label>
              <Text fontSize="$1">Reject if missing any required skills</Text>
            </YStack>
            <ToggleSwitch
              checked={localState.criteria.require_all_skills || false}
              onCheckedChange={(checked: boolean) =>
                handleCriteriaChange('require_all_skills', checked)
              }
              aria-label="All skills required"
            />
          </XStack>

          {/* All Certifications Required */}
          <XStack gap="$3">
            <YStack gap="$1" flex={1}>
              <Label>All certifications required</Label>
              <Text fontSize="$1">Reject if missing any required certifications</Text>
            </YStack>
            <ToggleSwitch
              checked={localState.criteria.require_all_certifications || false}
              onCheckedChange={(checked: boolean) =>
                handleCriteriaChange('require_all_certifications', checked)
              }
              aria-label="All certifications required"
            />
          </XStack>

          <YStack gap="$2" padding="$3">
            <Text fontSize="$2" fontWeight="600" color="$yellow11">
              ⚠️ Important
            </Text>
            <Text fontSize="$1" color="$yellow11">
              Auto-rejected applicants will be notified and moved to a "Rejected" status. This
              action cannot be undone automatically. Review your criteria carefully.
            </Text>
          </YStack>
        </YStack>
      )}
    </YStack>
  )
}
