import { useState } from 'react'
import { YStack, XStack, Text } from '@app/ui'
import { Switch, Label } from 'tamagui'

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
    <YStack gap="$4" p="$4">
      <YStack gap="$2">
        <Text fontSize="$6" fontWeight="600">
          Auto-Rejection
        </Text>
        <Text fontSize="$2">Automatically reject applicants who don't meet minimum criteria</Text>
      </YStack>

      {/* Enable Auto-Rejection */}
      <XStack gap="$3">
        <YStack gap="$1" flex={1}>
          <Label htmlFor="autoReject" fontWeight="600">
            Enable auto-rejection
          </Label>
          <Text fontSize="$2">Automatically screen out unqualified applicants</Text>
        </YStack>
        <Switch id="autoReject" checked={localState.enabled} onCheckedChange={handleToggle}>
          <Switch.Thumb animation="quick" />
        </Switch>
      </XStack>

      {/* Criteria (only show when enabled) */}
      {localState.enabled && (
        <YStack gap="$3" p="$3">
          <Text fontSize="$3" fontWeight="600">
            Rejection Criteria
          </Text>

          {/* Work Authorization */}
          <XStack gap="$3">
            <YStack gap="$1" flex={1}>
              <Label htmlFor="autoRejectAuth">Work authorization required</Label>
              <Text fontSize="$1">Reject if not authorized to work</Text>
            </YStack>
            <Switch
              id="autoRejectAuth"
              checked={localState.criteria.require_work_authorization || false}
              onCheckedChange={(checked: boolean) =>
                handleCriteriaChange('require_work_authorization', checked)
              }
            >
              <Switch.Thumb animation="quick" />
            </Switch>
          </XStack>

          {/* All Skills Required */}
          <XStack gap="$3">
            <YStack gap="$1" flex={1}>
              <Label htmlFor="autoRejectSkills">All skills required</Label>
              <Text fontSize="$1">Reject if missing any required skills</Text>
            </YStack>
            <Switch
              id="autoRejectSkills"
              checked={localState.criteria.require_all_skills || false}
              onCheckedChange={(checked: boolean) =>
                handleCriteriaChange('require_all_skills', checked)
              }
            >
              <Switch.Thumb animation="quick" />
            </Switch>
          </XStack>

          {/* All Certifications Required */}
          <XStack gap="$3">
            <YStack gap="$1" flex={1}>
              <Label htmlFor="autoRejectCerts">All certifications required</Label>
              <Text fontSize="$1">Reject if missing any required certifications</Text>
            </YStack>
            <Switch
              id="autoRejectCerts"
              checked={localState.criteria.require_all_certifications || false}
              onCheckedChange={(checked: boolean) =>
                handleCriteriaChange('require_all_certifications', checked)
              }
            >
              <Switch.Thumb animation="quick" />
            </Switch>
          </XStack>

          <YStack gap="$2" p="$3">
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
