/**
 * REQ-263: Org-Level vs Project-Level Coverage Distinction
 * TASK-3: Build Org Coverage Requirements Settings UI
 *
 * Form component for creating and editing coverage limit requirements.
 */

import React, { useState, useEffect, useCallback } from 'react'
import { Stack, Row, Text, H3, Button, Grid } from '@unicornlove/beyond-ui'
import ButtonCommon from '../Common/Button'
import Input from '../Common/Input'
import Select from '../Common/Select'
import { CoverageLimitRequirement, CoverageLimitType, CoverageRequirementLevel } from '../../types'
import {
  validateCoverageType,
  validateMinimumLimit,
} from '../../lib/coverageRequirements/coverageLimitRequirementService'

// Coverage type display names
const COVERAGE_TYPE_OPTIONS: { value: CoverageLimitType; label: string }[] = [
  { value: 'general_liability', label: 'General Liability' },
  { value: 'workers_comp', label: "Workers' Compensation" },
  { value: 'commercial_auto', label: 'Commercial Auto' },
  { value: 'umbrella_excess', label: 'Umbrella/Excess Liability' },
  { value: 'professional_liability', label: 'Professional Liability' },
  { value: 'pollution_liability', label: 'Pollution Liability' },
  { value: 'builders_risk', label: "Builder's Risk" },
  { value: 'equipment_floater', label: 'Equipment Floater' },
]

export interface CoverageRequirementFormData {
  name: string
  coverage_type: CoverageLimitType
  minimum_limit: number
  required: boolean
}

interface CoverageRequirementFormProps {
  initialData?: CoverageLimitRequirement
  level: CoverageRequirementLevel
  onSubmit: (data: CoverageRequirementFormData) => Promise<void>
  onCancel: () => void
  isSubmitting?: boolean
}

interface FormErrors {
  name?: string
  coverage_type?: string
  minimum_limit?: string
}

export default function CoverageRequirementForm({
  initialData,
  level,
  onSubmit,
  onCancel,
  isSubmitting = false,
}: CoverageRequirementFormProps) {
  const [formData, setFormData] = useState<CoverageRequirementFormData>({
    name: initialData?.name || '',
    coverage_type: initialData?.coverage_type || 'general_liability',
    minimum_limit: initialData?.minimum_limit ?? 1000000,
    required: initialData?.required ?? true,
  })

  const [errors, setErrors] = useState<FormErrors>({})
  const [touched, setTouched] = useState<Record<string, boolean>>({})

  // Validate form
  const validate = useCallback((): FormErrors => {
    const newErrors: FormErrors = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required'
    } else if (formData.name.length > 200) {
      newErrors.name = 'Name must be 200 characters or less'
    }

    const coverageTypeError = validateCoverageType(formData.coverage_type)
    if (coverageTypeError) {
      newErrors.coverage_type = coverageTypeError.message
    }

    const limitError = validateMinimumLimit(formData.minimum_limit)
    if (limitError) {
      newErrors.minimum_limit = limitError.message
    }

    return newErrors
  }, [formData])

  // Validate on change
  useEffect(() => {
    if (Object.keys(touched).length > 0) {
      setErrors(validate())
    }
  }, [touched, validate])

  // Handle field change
  const handleChange = (
    field: keyof CoverageRequirementFormData,
    value: string | number | boolean
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    setTouched((prev) => ({ ...prev, [field]: true }))
  }

  // Handle submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Mark all fields as touched
    const allTouched: Record<string, boolean> = {}
    Object.keys(formData).forEach((key) => {
      allTouched[key] = true
    })
    setTouched(allTouched)

    // Validate
    const validationErrors = validate()
    setErrors(validationErrors)

    if (Object.keys(validationErrors).length > 0) {
      return
    }

    await onSubmit(formData)
  }

  // Format number as currency
  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  return (
    <form onSubmit={handleSubmit}>
      <Stack style={{ gap: 24 }}>
        {/* Level Badge */}
        <Row style={{ alignItems: 'center', gap: 8 }}>
          <Text style={{ fontSize: 14, color: 'var(--color-color11)' }}>Requirement Level:</Text>
          <Text
            style={{
              paddingLeft: 8,
              paddingRight: 8,
              paddingTop: 4,
              paddingBottom: 4,
              borderRadius: 9999,
              fontSize: 12,
              fontWeight: 600,
              backgroundColor: level === 'org' ? 'var(--color-blue2)' : 'var(--color-purple2)',
              color: level === 'org' ? 'var(--color-blue11)' : 'var(--color-purple11)',
            }}
          >
            {level === 'org' ? 'ORGANIZATION' : 'PROJECT'}
          </Text>
        </Row>

        {/* Basic Information */}
        <Stack style={{ gap: 16 }}>
          <H3
            style={{
              fontSize: 14,
              fontWeight: 600,
              color: 'var(--color-color11)',
              textTransform: 'uppercase',
              letterSpacing: 1,
            }}
          >
            Requirement Details
          </H3>

          <Input
            label="Name"
            value={formData.name}
            onChange={(e) => handleChange('name', e.target.value)}
            error={touched.name ? errors.name : undefined}
            required
            fullWidth
            placeholder="e.g., Minimum General Liability Coverage"
            maxLength={200}
          />

          <Select
            label="Coverage Type"
            options={COVERAGE_TYPE_OPTIONS}
            value={formData.coverage_type}
            onChange={(e) => handleChange('coverage_type', e.target.value as CoverageLimitType)}
            error={touched.coverage_type ? errors.coverage_type : undefined}
            required
            fullWidth
          />
        </Stack>

        {/* Limit Settings */}
        <Stack style={{ gap: 16 }}>
          <H3
            style={{
              fontSize: 14,
              fontWeight: 600,
              color: 'var(--color-color11)',
              textTransform: 'uppercase',
              letterSpacing: 1,
            }}
          >
            Limit Requirements
          </H3>

          <Stack>
            <Input
              label="Minimum Limit"
              type="number"
              min={0}
              step={100000}
              value={formData.minimum_limit}
              onChange={(e) => handleChange('minimum_limit', parseFloat(e.target.value) || 0)}
              error={touched.minimum_limit ? errors.minimum_limit : undefined}
              required
              fullWidth
              helperText={`Current value: ${formatCurrency(formData.minimum_limit)}`}
            />
          </Stack>

          {/* Common limit quick-select buttons */}
          <Stack style={{ gap: 8 }}>
            <Text style={{ fontSize: 14, color: 'var(--color-color10)' }}>Quick select:</Text>
            <Grid columns={{ base: 2, sm: 4 }} gap={8}>
              {[500000, 1000000, 2000000, 5000000].map((amount) => (
                <Button
                  key={amount}
                  type="button"
                  onPress={() => handleChange('minimum_limit', amount)}
                  style={{
                    paddingLeft: 12,
                    paddingRight: 12,
                    paddingTop: 4,
                    paddingBottom: 4,
                    fontSize: 14,
                    borderRadius: 8,
                    borderWidth: 1,
                    borderStyle: 'solid',
                    backgroundColor:
                      formData.minimum_limit === amount
                        ? 'var(--color-blue2)'
                        : 'var(--color-backgroundHover)',
                    borderColor:
                      formData.minimum_limit === amount
                        ? 'var(--color-blue6)'
                        : 'var(--color-border)',
                    color:
                      formData.minimum_limit === amount
                        ? 'var(--color-blue11)'
                        : 'var(--color-color11)',
                  }}
                >
                  {formatCurrency(amount)}
                </Button>
              ))}
            </Grid>
          </Stack>
        </Stack>

        {/* Status */}
        <Stack style={{ gap: 16 }}>
          <H3
            style={{
              fontSize: 14,
              fontWeight: 600,
              color: 'var(--color-color11)',
              textTransform: 'uppercase',
              letterSpacing: 1,
            }}
          >
            Enforcement
          </H3>

          <Row style={{ alignItems: 'center', gap: 12, cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={formData.required}
              onChange={(e) => handleChange('required', e.target.checked)}
              style={{ width: 16, height: 16 }}
            />
            <Text style={{ color: 'var(--color-color12)' }}>Required</Text>
            <Text style={{ color: 'var(--color-color10)', fontSize: 14 }}>
              (Subcontractors must meet this requirement for compliance)
            </Text>
          </Row>
        </Stack>

        {/* Form Actions */}
        <Row
          style={{
            justifyContent: 'flex-end',
            gap: 12,
            paddingTop: 16,
            borderTop: '1px solid var(--color-border)',
          }}
        >
          <ButtonCommon variant="ghost" onPress={onCancel} disabled={isSubmitting}>
            Cancel
          </ButtonCommon>
          <ButtonCommon variant="primary" type="submit" disabled={isSubmitting}>
            {isSubmitting
              ? initialData
                ? 'Saving...'
                : 'Creating...'
              : initialData
                ? 'Save Changes'
                : 'Create Requirement'}
          </ButtonCommon>
        </Row>
      </Stack>
    </form>
  )
}
