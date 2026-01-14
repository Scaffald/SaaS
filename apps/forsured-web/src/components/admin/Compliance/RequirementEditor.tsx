/**
 * RequirementEditor Component
 * REQ-2, TASK-14: Requirement Editor Form with Coverage Configuration
 *
 * Modal form for creating and editing compliance requirements with:
 * - All requirement fields
 * - Coverage limits configuration
 * - Draft/publish workflow
 * - Validation
 */

import React, { useState, useEffect } from 'react'
import { X, Save, AlertCircle } from 'lucide-react'
import {
  Stack,
  Row,
  Text,
  Input,
  Button,
  H2,
} from '@unicornlove/beyond-ui'
import Textarea from '../../Common/Textarea'
import {
  useCreateComplianceRequirement,
  useUpdateComplianceRequirement,
  type ComplianceRequirement,
  type CoverageType,
  type RequirementStatus,
  type RequirementDefinition,
} from '../../../hooks/useComplianceRequirements'
import { LoadingSpinner } from '../../Common/LoadingSpinner'

// =============================================================================
// Types
// =============================================================================

interface RequirementEditorProps {
  organizationId: string
  requirement?: ComplianceRequirement | null
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

interface FormData {
  code: string
  name: string
  type: CoverageType
  description: string
  status: RequirementStatus
  is_template: boolean
  effective_date: string
  expiration_date: string
  per_occurrence: string
  aggregate: string
  deductible_max: string
}

interface FormErrors {
  code?: string
  name?: string
  type?: string
  effective_date?: string
  per_occurrence?: string
  aggregate?: string
}

// =============================================================================
// Constants
// =============================================================================

const COVERAGE_TYPE_OPTIONS: { value: CoverageType; label: string }[] = [
  { value: 'general_liability', label: 'General Liability' },
  { value: 'workers_comp', label: 'Workers Compensation' },
  { value: 'auto_liability', label: 'Auto Liability' },
  { value: 'umbrella', label: 'Umbrella/Excess Liability' },
  { value: 'professional_liability', label: 'Professional Liability' },
  { value: 'custom', label: 'Custom' },
]

const STATUS_OPTIONS: { value: RequirementStatus; label: string }[] = [
  { value: 'draft', label: 'Draft' },
  { value: 'active', label: 'Active' },
  { value: 'archived', label: 'Archived' },
]

const DEFAULT_FORM_DATA: FormData = {
  code: '',
  name: '',
  type: 'general_liability',
  description: '',
  status: 'draft',
  is_template: false,
  effective_date: new Date().toISOString().split('T')[0],
  expiration_date: '',
  per_occurrence: '',
  aggregate: '',
  deductible_max: '',
}

// =============================================================================
// Helper Functions
// =============================================================================

function formatCurrency(value: string): string {
  const num = value.replace(/[^\d]/g, '')
  if (!num) return ''
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(parseInt(num, 10))
}

function parseCurrency(value: string): number | undefined {
  const num = value.replace(/[^\d]/g, '')
  return num ? parseInt(num, 10) : undefined
}

function validateForm(data: FormData): FormErrors {
  const errors: FormErrors = {}

  if (!data.code.trim()) {
    errors.code = 'Code is required'
  } else if (!/^[A-Z0-9-]+$/i.test(data.code)) {
    errors.code = 'Code must be alphanumeric with dashes only'
  }

  if (!data.name.trim()) {
    errors.name = 'Name is required'
  }

  if (!data.effective_date) {
    errors.effective_date = 'Effective date is required'
  }

  return errors
}

// =============================================================================
// Component
// =============================================================================

export function RequirementEditor({
  organizationId,
  requirement,
  isOpen,
  onClose,
  onSuccess,
}: RequirementEditorProps) {
  const isEditing = !!requirement
  const [formData, setFormData] = useState<FormData>(DEFAULT_FORM_DATA)
  const [errors, setErrors] = useState<FormErrors>({})
  const [changeSummary, setChangeSummary] = useState('')

  const createMutation = useCreateComplianceRequirement()
  const updateMutation = useUpdateComplianceRequirement()

  const isSubmitting = createMutation.isPending || updateMutation.isPending

  // Initialize form data when requirement changes
  useEffect(() => {
    if (requirement) {
      const limits = requirement.requirement_definition?.coverage_limits ?? {}
      setFormData({
        code: requirement.code,
        name: requirement.name,
        type: requirement.type,
        description: requirement.description ?? '',
        status: requirement.status,
        is_template: requirement.is_template,
        effective_date: requirement.effective_date.split('T')[0],
        expiration_date: requirement.expiration_date?.split('T')[0] ?? '',
        per_occurrence: limits.per_occurrence ? formatCurrency(String(limits.per_occurrence)) : '',
        aggregate: limits.aggregate ? formatCurrency(String(limits.aggregate)) : '',
        deductible_max: limits.deductible_max ? formatCurrency(String(limits.deductible_max)) : '',
      })
      setChangeSummary('')
    } else {
      setFormData(DEFAULT_FORM_DATA)
      setChangeSummary('')
    }
    setErrors({})
  }, [requirement, isOpen])

  // Handle input changes
  const handleChange = (field: keyof FormData, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    // Clear error when field is edited
    if (errors[field as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }))
    }
  }

  // Handle currency input
  const handleCurrencyChange = (
    field: 'per_occurrence' | 'aggregate' | 'deductible_max',
    value: string
  ) => {
    const formatted = formatCurrency(value)
    setFormData((prev) => ({ ...prev, [field]: formatted }))
  }

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const validationErrors = validateForm(formData)
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }

    if (isEditing && !changeSummary.trim()) {
      alert('Please provide a change summary for this update')
      return
    }

    const requirementDefinition: RequirementDefinition = {
      coverage_limits: {
        per_occurrence: parseCurrency(formData.per_occurrence),
        aggregate: parseCurrency(formData.aggregate),
        deductible_max: parseCurrency(formData.deductible_max),
      },
      required_endorsements: requirement?.requirement_definition?.required_endorsements ?? [],
      policy_conditions: requirement?.requirement_definition?.policy_conditions ?? [],
      documentation_requirements:
        requirement?.requirement_definition?.documentation_requirements ?? [],
    }

    try {
      if (isEditing) {
        await updateMutation.mutateAsync({
          organizationId,
          requirementId: requirement.id,
          updates: {
            code: formData.code !== requirement.code ? formData.code : undefined,
            name: formData.name !== requirement.name ? formData.name : undefined,
            description: formData.description || null,
            status: formData.status,
            effective_date: formData.effective_date,
            expiration_date: formData.expiration_date || null,
            requirement_definition: requirementDefinition,
          },
          change_summary: changeSummary,
        })
      } else {
        await createMutation.mutateAsync({
          organizationId,
          code: formData.code.toUpperCase(),
          name: formData.name,
          type: formData.type,
          description: formData.description || undefined,
          status: formData.status,
          is_template: formData.is_template,
          effective_date: formData.effective_date,
          expiration_date: formData.expiration_date || undefined,
          requirement_definition: requirementDefinition,
        })
      }

      onSuccess?.()
      onClose()
    } catch (error) {
      console.error('Failed to save requirement:', error)
      // Error is handled by mutation state
    }
  }

  if (!isOpen) return null

  return (
    <Stack
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 50,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* Backdrop */}
      <Stack
        style={{
          position: 'absolute',
          inset: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
        }}
        onClick={onClose}
      />

      {/* Modal */}
      <Stack
        style={{
          position: 'relative',
          backgroundColor: 'var(--color-background)',
          borderRadius: 12,
          boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
          width: '100%',
          maxWidth: '42rem',
          maxHeight: '90vh',
          overflow: 'auto',
        }}
      >
        {/* Header */}
        <Row
          style={{
            position: 'sticky',
            top: 0,
            backgroundColor: 'var(--color-background)',
            borderBottom: '1px solid var(--color-border)',
            paddingLeft: 24,
            paddingRight: 24,
            paddingTop: 16,
            paddingBottom: 16,
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <H2 style={{ fontWeight: 600 }}>
            {isEditing ? 'Edit Requirement' : 'New Compliance Requirement'}
          </H2>
          <Button
            variant="ghost"
            style={{ padding: 8, color: 'var(--color-gray-10)', borderRadius: 6 }}
            onClick={onClose}
          >
            <X size={20} />
          </Button>
        </Row>

        {/* Form */}
        <Stack as="form" onSubmit={handleSubmit} style={{ padding: 24, gap: 24 }}>
          {/* Error Alert */}
          {(createMutation.error || updateMutation.error) && (
            <Row
              style={{
                alignItems: 'flex-start',
                gap: 12,
                padding: 16,
                backgroundColor: 'var(--color-red-2)',
                borderWidth: 1,
                borderColor: 'var(--color-red-6)',
                borderRadius: 12,
                color: 'var(--color-red-10)',
              }}
            >
              <Stack style={{ flexShrink: 0, marginTop: 2 }}>
                <AlertCircle size={20} style={{ color: 'var(--color-red-10)' }} />
              </Stack>
              <Stack>
                <Text style={{ fontWeight: 600 }}>Error saving requirement</Text>
                <Text style={{ fontSize: 14 }}>{(createMutation.error || updateMutation.error)?.message}</Text>
              </Stack>
            </Row>
          )}

          {/* Basic Info */}
          <Row style={{ gap: 16, flexWrap: 'wrap' }}>
            <Stack style={{ flex: 1, minWidth: 200 }}>
              <Text style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-11)', marginBottom: 4 }}>
                Code <Text style={{ color: 'var(--color-red-10)' }}>*</Text>
              </Text>
              <Input
                style={{
                  width: '100%',
                  paddingLeft: 12,
                  paddingRight: 12,
                  paddingTop: 8,
                  paddingBottom: 8,
                  borderWidth: 1,
                  borderRadius: 12,
                  borderColor: errors.code ? 'var(--color-red-8)' : 'var(--color-gray-8)',
                }}
                value={formData.code}
                onChange={(e) => handleChange('code', e.target.value.toUpperCase())}
                placeholder="GL-REQ-001"
                disabled={isEditing}
              />
              {errors.code && (
                <Text style={{ marginTop: 4, fontSize: 14, color: 'var(--color-red-10)' }}>{errors.code}</Text>
              )}
            </Stack>

            <Stack style={{ flex: 1, minWidth: 200 }}>
              <Text style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-11)', marginBottom: 4 }}>
                Type <Text style={{ color: 'var(--color-red-10)' }}>*</Text>
              </Text>
              <select
                value={formData.type}
                onChange={(e) => handleChange('type', e.target.value as CoverageType)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid var(--color-gray-8)',
                  borderRadius: 8,
                  fontSize: 14,
                }}
              >
                {COVERAGE_TYPE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </Stack>
          </Row>

          <Stack>
            <Text style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-11)', marginBottom: 4 }}>
              Name <Text style={{ color: 'var(--color-red-10)' }}>*</Text>
            </Text>
            <Input
              style={{
                width: '100%',
                paddingLeft: 12,
                paddingRight: 12,
                paddingTop: 8,
                paddingBottom: 8,
                borderWidth: 1,
                borderRadius: 12,
                borderColor: errors.name ? 'var(--color-red-8)' : 'var(--color-gray-8)',
              }}
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="General Liability - Standard Construction"
            />
            {errors.name && (
              <Text style={{ marginTop: 4, fontSize: 14, color: 'var(--color-red-10)' }}>{errors.name}</Text>
            )}
          </Stack>

          <Stack>
            <Text style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-11)', marginBottom: 4 }}>Description</Text>
            <Textarea
              style={{
                width: '100%',
                paddingLeft: 12,
                paddingRight: 12,
                paddingTop: 8,
                paddingBottom: 8,
                borderWidth: 1,
                borderColor: 'var(--color-gray-8)',
                borderRadius: 12,
              }}
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="Describe the requirement..."
              rows={3}
            />
          </Stack>

          {/* Coverage Limits */}
          <Stack style={{ borderTop: '1px solid var(--color-border)', paddingTop: 16 }}>
            <Text style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-12)', marginBottom: 12 }}>Coverage Limits</Text>
            <Row style={{ gap: 16, flexWrap: 'wrap' }}>
              <Stack style={{ flex: 1, minWidth: 150 }}>
                <Text style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-11)', marginBottom: 4 }}>
                  Per Occurrence
                </Text>
                <Input
                  style={{
                    width: '100%',
                    paddingLeft: 12,
                    paddingRight: 12,
                    paddingTop: 8,
                    paddingBottom: 8,
                    borderWidth: 1,
                    borderColor: 'var(--color-gray-8)',
                    borderRadius: 12,
                  }}
                  value={formData.per_occurrence}
                  onChange={(e) => handleCurrencyChange('per_occurrence', e.target.value)}
                  placeholder="$1,000,000"
                />
              </Stack>
              <Stack style={{ flex: 1, minWidth: 150 }}>
                <Text style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-11)', marginBottom: 4 }}>Aggregate</Text>
                <Input
                  style={{
                    width: '100%',
                    paddingLeft: 12,
                    paddingRight: 12,
                    paddingTop: 8,
                    paddingBottom: 8,
                    borderWidth: 1,
                    borderColor: 'var(--color-gray-8)',
                    borderRadius: 12,
                  }}
                  value={formData.aggregate}
                  onChange={(e) => handleCurrencyChange('aggregate', e.target.value)}
                  placeholder="$2,000,000"
                />
              </Stack>
              <Stack style={{ flex: 1, minWidth: 150 }}>
                <Text style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-11)', marginBottom: 4 }}>
                  Max Deductible
                </Text>
                <Input
                  style={{
                    width: '100%',
                    paddingLeft: 12,
                    paddingRight: 12,
                    paddingTop: 8,
                    paddingBottom: 8,
                    borderWidth: 1,
                    borderColor: 'var(--color-gray-8)',
                    borderRadius: 12,
                  }}
                  value={formData.deductible_max}
                  onChange={(e) => handleCurrencyChange('deductible_max', e.target.value)}
                  placeholder="$10,000"
                />
              </Stack>
            </Row>
          </Stack>

          {/* Dates */}
          <Row style={{ gap: 16, flexWrap: 'wrap' }}>
            <Stack style={{ flex: 1, minWidth: 200 }}>
              <Text style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-11)', marginBottom: 4 }}>
                Effective Date <Text style={{ color: 'var(--color-red-10)' }}>*</Text>
              </Text>
              <Input
                type="date"
                style={{
                  width: '100%',
                  paddingLeft: 12,
                  paddingRight: 12,
                  paddingTop: 8,
                  paddingBottom: 8,
                  borderWidth: 1,
                  borderRadius: 12,
                  borderColor: errors.effective_date ? 'var(--color-red-8)' : 'var(--color-gray-8)',
                }}
                value={formData.effective_date}
                onChange={(e) => handleChange('effective_date', e.target.value)}
              />
              {errors.effective_date && (
                <Text style={{ marginTop: 4, fontSize: 14, color: 'var(--color-red-10)' }}>{errors.effective_date}</Text>
              )}
            </Stack>
            <Stack style={{ flex: 1, minWidth: 200 }}>
              <Text style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-11)', marginBottom: 4 }}>
                Expiration Date
              </Text>
              <Input
                type="date"
                style={{
                  width: '100%',
                  paddingLeft: 12,
                  paddingRight: 12,
                  paddingTop: 8,
                  paddingBottom: 8,
                  borderWidth: 1,
                  borderColor: 'var(--color-gray-8)',
                  borderRadius: 12,
                }}
                value={formData.expiration_date}
                onChange={(e) => handleChange('expiration_date', e.target.value)}
              />
            </Stack>
          </Row>

          {/* Status and Template */}
          <Row style={{ gap: 16, flexWrap: 'wrap' }}>
            <Stack style={{ flex: 1, minWidth: 200 }}>
              <Text style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-11)', marginBottom: 4 }}>Status</Text>
              <select
                value={formData.status}
                onChange={(e) => handleChange('status', e.target.value as RequirementStatus)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid var(--color-gray-8)',
                  borderRadius: 8,
                  fontSize: 14,
                }}
              >
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </Stack>
            <Stack style={{ flex: 1, alignItems: 'center', paddingTop: 24 }}>
              <Row style={{ alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={formData.is_template}
                  onChange={(e) => handleChange('is_template', e.target.checked)}
                  style={{
                    width: 16,
                    height: 16,
                    borderRadius: 4,
                    border: '1px solid var(--color-gray-8)',
                  }}
                />
                <Text style={{ fontSize: 14, color: 'var(--color-11)' }}>Save as template</Text>
              </Row>
            </Stack>
          </Row>

          {/* Change Summary (for updates) */}
          {isEditing && (
            <Stack>
              <Text style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-11)', marginBottom: 4 }}>
                Change Summary <Text style={{ color: 'var(--color-red-10)' }}>*</Text>
              </Text>
              <Input
                style={{
                  width: '100%',
                  paddingLeft: 12,
                  paddingRight: 12,
                  paddingTop: 8,
                  paddingBottom: 8,
                  borderWidth: 1,
                  borderColor: 'var(--color-gray-8)',
                  borderRadius: 12,
                }}
                value={changeSummary}
                onChange={(e) => setChangeSummary(e.target.value)}
                placeholder="Brief description of changes..."
              />
              <Text style={{ marginTop: 4, fontSize: 11, color: 'var(--color-gray-11)' }}>
                This will be recorded in the version history
              </Text>
            </Stack>
          )}
        </Stack>

        {/* Footer */}
        <Row
          style={{
            position: 'sticky',
            bottom: 0,
            backgroundColor: 'var(--color-background)',
            borderTop: '1px solid var(--color-border)',
            paddingLeft: 24,
            paddingRight: 24,
            paddingTop: 16,
            paddingBottom: 16,
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: 12,
          }}
        >
          <Button
            variant="ghost"
            style={{
              paddingLeft: 16,
              paddingRight: 16,
              paddingTop: 8,
              paddingBottom: 8,
              color: 'var(--color-gray-12)',
              borderRadius: 12,
            }}
            onClick={onClose}
          >
            <Text>Cancel</Text>
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? (
              <Row style={{ alignItems: 'center', gap: 8 }}>
                <LoadingSpinner size="sm" />
                <Text>Saving...</Text>
              </Row>
            ) : (
              <Row style={{ alignItems: 'center', gap: 4 }}>
                <Save size={16} />
                <Text>{isEditing ? 'Update' : 'Create'} Requirement</Text>
              </Row>
            )}
          </Button>
        </Row>
      </Stack>
    </Stack>
  )
}

export default RequirementEditor
