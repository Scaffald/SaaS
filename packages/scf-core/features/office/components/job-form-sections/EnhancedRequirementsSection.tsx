import { Input, ResponsiveSelect, Text, ToggleSwitch, Row, Stack } from '@unicornlove/beyond-ui'
import { useState } from 'react'
import { Label } from '@unicornlove/beyond-ui'

interface EnhancedRequirementsSectionProps {
  minimumEducationLevel?: 'none' | 'high_school' | 'associate' | 'bachelor' | 'master' | 'phd'
  requireBackgroundCheck?: boolean
  backgroundCheckType?: string
  requireDrugTest?: boolean
  requireDriversLicense?: boolean
  driversLicenseType?: string
  securityClearanceRequired?: string
  travelPercentage?: number
  shiftRequirements?: string
  onUpdate: (data: {
    minimum_education_level?: 'none' | 'high_school' | 'associate' | 'bachelor' | 'master' | 'phd'
    require_background_check?: boolean
    background_check_type?: string
    require_drug_test?: boolean
    require_drivers_license?: boolean
    drivers_license_type?: string
    security_clearance_required?: string
    travel_percentage?: number
    shift_requirements?: string
  }) => void
}

const EDUCATION_LEVELS = [
  { value: 'none', label: 'No education requirement' },
  { value: 'high_school', label: 'High School / GED' },
  { value: 'associate', label: "Associate's Degree" },
  { value: 'bachelor', label: "Bachelor's Degree" },
  { value: 'master', label: "Master's Degree" },
  { value: 'phd', label: 'Doctorate / PhD' },
]

export function EnhancedRequirementsSection({
  minimumEducationLevel,
  requireBackgroundCheck,
  backgroundCheckType,
  requireDrugTest,
  requireDriversLicense,
  driversLicenseType,
  securityClearanceRequired,
  travelPercentage,
  shiftRequirements,
  onUpdate,
}: EnhancedRequirementsSectionProps) {
  const [localState, setLocalState] = useState({
    minimum_education_level: minimumEducationLevel,
    require_background_check: requireBackgroundCheck,
    background_check_type: backgroundCheckType,
    require_drug_test: requireDrugTest,
    require_drivers_license: requireDriversLicense,
    drivers_license_type: driversLicenseType,
    security_clearance_required: securityClearanceRequired,
    travel_percentage: travelPercentage,
    shift_requirements: shiftRequirements,
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
    <Stack
      gap={16}
      padding="md"
      backgroundColor="$background"
      borderRadius={16}
      borderWidth={1}
      borderColor="$borderColor"
    >
      <Text>Enhanced Requirements</Text>
      <Text color="$gray11">Additional job requirements and qualifications</Text>

      {/* Minimum Education Level */}
      <Stack gap={8}>
        <Label>Minimum education level</Label>
        <ResponsiveSelect
          value={localState.minimum_education_level || ''}
          onValueChange={(value) => handleChange('minimum_education_level', value || undefined)}
          placeholder="Select education level"
          label="Minimum education level"
          options={EDUCATION_LEVELS.map((level) => ({
            value: level.value,
            label: level.label,
          }))}
        />
      </Stack>

      {/* Background Check */}
      <Row gap={12} align="center" justify="space-between">
        <Stack gap={4} flex={1}>
          <Label>Require background check</Label>
          <Text color="$gray11">Background screening required for this position</Text>
        </Stack>
        <ToggleSwitch
          checked={localState.require_background_check || false}
          onChange={(checked) => handleChange('require_background_check', checked)}
          aria-label="Require background check"
        />
      </Row>

      {localState.require_background_check && (
        <Stack gap={8}>
          <Label>Background check type</Label>
          <Input
            placeholder="e.g. Criminal, Credit, Employment history"
            value={localState.background_check_type || ''}
            onChangeText={(text) => handleChange('background_check_type', text || undefined)}
          />
        </Stack>
      )}

      {/* Drug Test */}
      <Row gap={12} align="center" justify="space-between">
        <Stack gap={4} flex={1}>
          <Label>Require drug test</Label>
          <Text color="$gray11">Pre-employment drug screening required</Text>
        </Stack>
        <ToggleSwitch
          checked={localState.require_drug_test || false}
          onChange={(checked) => handleChange('require_drug_test', checked)}
          aria-label="Require drug test"
        />
      </Row>

      {/* Driver's License */}
      <Row gap={12} align="center" justify="space-between">
        <Stack gap={4} flex={1}>
          <Label>Require driver's license</Label>
          <Text color="$gray11">Valid driver's license required</Text>
        </Stack>
        <ToggleSwitch
          checked={localState.require_drivers_license || false}
          onChange={(checked) => handleChange('require_drivers_license', checked)}
          aria-label="Require driver's license"
        />
      </Row>

      {localState.require_drivers_license && (
        <Stack gap={8}>
          <Label>License type</Label>
          <Input
            placeholder="e.g. Class A CDL, Standard"
            value={localState.drivers_license_type || ''}
            onChangeText={(text) => handleChange('drivers_license_type', text || undefined)}
          />
        </Stack>
      )}

      {/* Security Clearance */}
      <Stack gap={8}>
        <Label>Security clearance required</Label>
        <Input
          placeholder="e.g. Secret, Top Secret, Confidential"
          value={localState.security_clearance_required || ''}
          onChangeText={(text) => handleChange('security_clearance_required', text || undefined)}
        />
      </Stack>

      {/* Travel Percentage */}
      <Stack gap={8}>
        <Label>Travel percentage (%)</Label>
        <Input
          placeholder="0-100"
          keyboardType="numeric"
          value={localState.travel_percentage?.toString() || ''}
          onChangeText={(text) => {
            const num = Number.parseInt(text, 10)
            if (num >= 0 && num <= 100) {
              handleChange('travel_percentage', Number.isNaN(num) ? undefined : num)
            }
          }}
        />
        <Text color="$gray11">Percentage of time spent traveling for work</Text>
      </Stack>

      {/* Shift Requirements */}
      <Stack gap={8}>
        <Label>Shift requirements</Label>
        <Input
          placeholder="e.g. Day shift, Night shift, Rotating shifts"
          value={localState.shift_requirements || ''}
          onChangeText={(text) => handleChange('shift_requirements', text || undefined)}
        />
      </Stack>
    </Stack>
  )
}
