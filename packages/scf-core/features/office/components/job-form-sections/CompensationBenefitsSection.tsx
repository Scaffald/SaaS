import { Input, ResponsiveSelect, Text, ToggleSwitch, Row, Stack } from '@unicornlove/beyond-ui'
import { useState } from 'react'
import { Label, TextArea } from '@unicornlove/beyond-ui'

interface CompensationBenefitsSectionProps {
  benefitsSummary?: string
  hasBonusStructure?: boolean
  bonusDetails?: string
  hasEquity?: boolean
  equityDetails?: string
  signOnBonusCents?: number
  hasRelocationPackage?: boolean
  relocationPackageDetails?: string
  overtimeEligible?: boolean
  payFrequency?: 'hourly' | 'weekly' | 'biweekly' | 'semimonthly' | 'monthly'
  onUpdate: (data: {
    benefits_summary?: string
    has_bonus_structure?: boolean
    bonus_details?: string
    has_equity?: boolean
    equity_details?: string
    sign_on_bonus_cents?: number
    has_relocation_package?: boolean
    relocation_package_details?: string
    overtime_eligible?: boolean
    pay_frequency?: 'hourly' | 'weekly' | 'biweekly' | 'semimonthly' | 'monthly'
  }) => void
}

const PAY_FREQUENCIES = [
  { value: 'hourly', label: 'Hourly' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'biweekly', label: 'Bi-weekly' },
  { value: 'semimonthly', label: 'Semi-monthly' },
  { value: 'monthly', label: 'Monthly' },
]

export function CompensationBenefitsSection({
  benefitsSummary,
  hasBonusStructure,
  bonusDetails,
  hasEquity,
  equityDetails,
  signOnBonusCents,
  hasRelocationPackage,
  relocationPackageDetails,
  overtimeEligible,
  payFrequency,
  onUpdate,
}: CompensationBenefitsSectionProps) {
  const [localState, setLocalState] = useState({
    benefits_summary: benefitsSummary,
    has_bonus_structure: hasBonusStructure,
    bonus_details: bonusDetails,
    has_equity: hasEquity,
    equity_details: equityDetails,
    sign_on_bonus_cents: signOnBonusCents,
    has_relocation_package: hasRelocationPackage,
    relocation_package_details: relocationPackageDetails,
    overtime_eligible: overtimeEligible,
    pay_frequency: payFrequency,
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
      padding={16}
      backgroundColor="$background"
      borderRadius={16}
      borderWidth={1}
      borderColor="$borderColor"
    >
      <Text>Compensation & Benefits</Text>
      <Text color="gray">Detailed compensation information and benefits package</Text>

      {/* Benefits Summary */}
      <Stack gap={8}>
        <Label>Benefits summary</Label>
        <TextArea
          placeholder="Describe health insurance, PTO, retirement plans, etc."
          value={localState.benefits_summary || ''}
          onChangeText={(text) => handleChange('benefits_summary', text || undefined)}
          height={100}
        />
      </Stack>

      {/* Bonus Structure */}
      <Row gap={12} align="center" justify="space-between">
        <Stack gap={4} flex={1}>
          <Label>Has bonus structure</Label>
          <Text color="gray">Performance or other bonus opportunities</Text>
        </Stack>
        <ToggleSwitch
          checked={localState.has_bonus_structure || false}
          onCheckedChange={(checked) => handleChange('has_bonus_structure', checked)}
          aria-label="Has bonus structure"
        />
      </Row>

      {localState.has_bonus_structure && (
        <Stack gap={8}>
          <Label>Bonus details</Label>
          <TextArea
            placeholder="Describe bonus structure, eligibility, and potential amounts"
            value={localState.bonus_details || ''}
            onChangeText={(text) => handleChange('bonus_details', text || undefined)}
            height={80}
          />
        </Stack>
      )}

      {/* Equity */}
      <Row gap={12} align="center" justify="space-between">
        <Stack gap={4} flex={1}>
          <Label>Has equity compensation</Label>
          <Text color="gray">Stock options, RSUs, or other equity</Text>
        </Stack>
        <ToggleSwitch
          checked={localState.has_equity || false}
          onCheckedChange={(checked) => handleChange('has_equity', checked)}
          aria-label="Has equity compensation"
        />
      </Row>

      {localState.has_equity && (
        <Stack gap={8}>
          <Label>Equity details</Label>
          <TextArea
            placeholder="Describe equity compensation structure"
            value={localState.equity_details || ''}
            onChangeText={(text) => handleChange('equity_details', text || undefined)}
            height={80}
          />
        </Stack>
      )}

      {/* Sign-on Bonus */}
      <Stack gap={8}>
        <Label>Sign-on bonus ($)</Label>
        <Input
          placeholder="0.00"
          keyboardType="numeric"
          value={
            localState.sign_on_bonus_cents ? (localState.sign_on_bonus_cents / 100).toString() : ''
          }
          onChangeText={(text) => {
            const value = Number.parseFloat(text) || 0
            handleChange('sign_on_bonus_cents', value > 0 ? Math.round(value * 100) : undefined)
          }}
        />
      </Stack>

      {/* Relocation Package */}
      <Row gap={12} align="center" justify="space-between">
        <Stack gap={4} flex={1}>
          <Label>Has relocation package</Label>
          <Text color="gray">Relocation assistance available</Text>
        </Stack>
        <ToggleSwitch
          checked={localState.has_relocation_package || false}
          onCheckedChange={(checked) => handleChange('has_relocation_package', checked)}
          aria-label="Has relocation package"
        />
      </Row>

      {localState.has_relocation_package && (
        <Stack gap={8}>
          <Label>Relocation package details</Label>
          <TextArea
            placeholder="Describe relocation assistance offered"
            value={localState.relocation_package_details || ''}
            onChangeText={(text) => handleChange('relocation_package_details', text || undefined)}
            height={80}
          />
        </Stack>
      )}

      {/* Overtime Eligible */}
      <Row gap={12} align="center" justify="space-between">
        <Stack gap={4} flex={1}>
          <Label>Overtime eligible</Label>
          <Text color="gray">Position eligible for overtime pay</Text>
        </Stack>
        <ToggleSwitch
          checked={localState.overtime_eligible || false}
          onCheckedChange={(checked) => handleChange('overtime_eligible', checked)}
          aria-label="Overtime eligible"
        />
      </Row>

      {/* Pay Frequency */}
      <Stack gap={8}>
        <Label>Pay frequency</Label>
        <ResponsiveSelect
          value={localState.pay_frequency || ''}
          onValueChange={(value) => handleChange('pay_frequency', value || undefined)}
          placeholder="Select pay frequency"
          options={PAY_FREQUENCIES.map((freq) => ({
            value: freq.value,
            label: freq.label,
          }))}
        />
      </Stack>
    </Stack>
  )
}
