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

import { useState, useEffect } from 'react'
import { X, Save, AlertCircle } from 'lucide-react'
import {
  YStack,
  XStack,
  Text,
  Input,
  TextArea,
  Button,
  H2,
} from '@unicornlove/ui'
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
    <YStack
      position="fixed"
      inset={0}
      zIndex={50}
      alignItems="center"
      justifyContent="center"
    >
      {/* Backdrop */}
      <YStack
        position="absolute"
        inset={0}
        backgroundColor="rgba(0,0,0,0.5)"
        onPress={onClose}
      />

      {/* Modal */}
      <YStack
        position="relative"
        backgroundColor="$background"
        borderRadius="$4"
        elevation={4}
        width="100%"
        maxWidth="42rem"
        maxHeight="90vh"
        overflow="scroll"
      >
        {/* Header */}
        <XStack
          position="sticky"
          top={0}
          backgroundColor="$background"
          borderBottomWidth={1}
          borderColor="$borderColor"
          paddingHorizontal="$6"
          paddingVertical="$4"
          alignItems="center"
          justifyContent="space-between"
        >
          <H2 fontWeight="600">
            {isEditing ? 'Edit Requirement' : 'New Compliance Requirement'}
          </H2>
          <Button
            unstyled
            padding="$2"
            color="$gray10"
            hoverStyle={{ color: '$gray12', backgroundColor: '$gray2' }}
            borderRadius="$2"
            onPress={onClose}
          >
            <X size={20} />
          </Button>
        </XStack>

        {/* Form */}
        <YStack as="form" onSubmit={handleSubmit} padding="$6" gap="$6">
          {/* Error Alert */}
          {(createMutation.error || updateMutation.error) && (
            <XStack
              alignItems="flex-start"
              gap="$3"
              padding="$4"
              backgroundColor="$red2"
              borderWidth={1}
              borderColor="$red6"
              borderRadius="$4"
              color="$red10"
            >
              <YStack flexShrink={0} mt="$0.5">
                <AlertCircle size={20} style={{ color: 'var(--color-red-10)' }} />
              </YStack>
              <YStack>
                <Text fontWeight="600">Error saving requirement</Text>
                <Text fontSize="$3">{(createMutation.error || updateMutation.error)?.message}</Text>
              </YStack>
            </XStack>
          )}

          {/* Basic Info */}
          <XStack gap="$4" flexWrap="wrap">
            <YStack flex={1} minWidth="200px">
              <Text fontSize="$3" fontWeight="600" color="$color11" mb="$1">
                Code <Text color="$red10">*</Text>
              </Text>
              <Input
                width="100%"
                paddingHorizontal="$3"
                paddingVertical="$2"
                borderWidth={1}
                borderRadius="$4"
                borderColor={errors.code ? '$red8' : '$gray8'}
                value={formData.code}
                onChange={(e) => handleChange('code', e.target.value.toUpperCase())}
                placeholder="GL-REQ-001"
                disabled={isEditing}
              />
              {errors.code && (
                <Text mt="$1" fontSize="$3" color="$red10">{errors.code}</Text>
              )}
            </YStack>

            <YStack flex={1} minWidth="200px">
              <Text fontSize="$3" fontWeight="600" color="$color11" mb="$1">
                Type <Text color="$red10">*</Text>
              </Text>
              <select
                value={formData.type}
                onChange={(e) => handleChange('type', e.target.value as CoverageType)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid var(--color-gray-8)',
                  borderRadius: '8px',
                  fontSize: '14px',
                }}
              >
                {COVERAGE_TYPE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </YStack>
          </XStack>

          <YStack>
            <Text fontSize="$3" fontWeight="600" color="$color11" mb="$1">
              Name <Text color="$red10">*</Text>
            </Text>
            <Input
              width="100%"
              paddingHorizontal="$3"
              paddingVertical="$2"
              borderWidth={1}
              borderRadius="$4"
              borderColor={errors.name ? '$red8' : '$gray8'}
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="General Liability - Standard Construction"
            />
            {errors.name && (
              <Text mt="$1" fontSize="$3" color="$red10">{errors.name}</Text>
            )}
          </YStack>

          <YStack>
            <Text fontSize="$3" fontWeight="600" color="$color11" mb="$1">Description</Text>
            <TextArea
              width="100%"
              paddingHorizontal="$3"
              paddingVertical="$2"
              borderWidth={1}
              borderColor="$gray8"
              borderRadius="$4"
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="Describe the requirement..."
              rows={3}
            />
          </YStack>

          {/* Coverage Limits */}
          <YStack borderTopWidth={1} borderColor="$borderColor" paddingTop="$4">
            <Text fontSize="$3" fontWeight="600" color="$color12" mb="$3">Coverage Limits</Text>
            <XStack gap="$4" flexWrap="wrap">
              <YStack flex={1} minWidth="150px">
                <Text fontSize="$3" fontWeight="600" color="$color11" mb="$1">
                  Per Occurrence
                </Text>
                <Input
                  width="100%"
                  paddingHorizontal="$3"
                  paddingVertical="$2"
                  borderWidth={1}
                  borderColor="$gray8"
                  borderRadius="$4"
                  value={formData.per_occurrence}
                  onChange={(e) => handleCurrencyChange('per_occurrence', e.target.value)}
                  placeholder="$1,000,000"
                />
              </YStack>
              <YStack flex={1} minWidth="150px">
                <Text fontSize="$3" fontWeight="600" color="$color11" mb="$1">Aggregate</Text>
                <Input
                  width="100%"
                  paddingHorizontal="$3"
                  paddingVertical="$2"
                  borderWidth={1}
                  borderColor="$gray8"
                  borderRadius="$4"
                  value={formData.aggregate}
                  onChange={(e) => handleCurrencyChange('aggregate', e.target.value)}
                  placeholder="$2,000,000"
                />
              </YStack>
              <YStack flex={1} minWidth="150px">
                <Text fontSize="$3" fontWeight="600" color="$color11" mb="$1">
                  Max Deductible
                </Text>
                <Input
                  width="100%"
                  paddingHorizontal="$3"
                  paddingVertical="$2"
                  borderWidth={1}
                  borderColor="$gray8"
                  borderRadius="$4"
                  value={formData.deductible_max}
                  onChange={(e) => handleCurrencyChange('deductible_max', e.target.value)}
                  placeholder="$10,000"
                />
              </YStack>
            </XStack>
          </YStack>

          {/* Dates */}
          <XStack gap="$4" flexWrap="wrap">
            <YStack flex={1} minWidth="200px">
              <Text fontSize="$3" fontWeight="600" color="$color11" mb="$1">
                Effective Date <Text color="$red10">*</Text>
              </Text>
              <Input
                type="date"
                width="100%"
                paddingHorizontal="$3"
                paddingVertical="$2"
                borderWidth={1}
                borderRadius="$4"
                borderColor={errors.effective_date ? '$red8' : '$gray8'}
                value={formData.effective_date}
                onChange={(e) => handleChange('effective_date', e.target.value)}
              />
              {errors.effective_date && (
                <Text mt="$1" fontSize="$3" color="$red10">{errors.effective_date}</Text>
              )}
            </YStack>
            <YStack flex={1} minWidth="200px">
              <Text fontSize="$3" fontWeight="600" color="$color11" mb="$1">
                Expiration Date
              </Text>
              <Input
                type="date"
                width="100%"
                paddingHorizontal="$3"
                paddingVertical="$2"
                borderWidth={1}
                borderColor="$gray8"
                borderRadius="$4"
                value={formData.expiration_date}
                onChange={(e) => handleChange('expiration_date', e.target.value)}
              />
            </YStack>
          </XStack>

          {/* Status and Template */}
          <XStack gap="$4" flexWrap="wrap">
            <YStack flex={1} minWidth="200px">
              <Text fontSize="$3" fontWeight="600" color="$color11" mb="$1">Status</Text>
              <select
                value={formData.status}
                onChange={(e) => handleChange('status', e.target.value as RequirementStatus)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid var(--color-gray-8)',
                  borderRadius: '8px',
                  fontSize: '14px',
                }}
              >
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </YStack>
            <YStack flex={1} alignItems="center" paddingTop="$6">
              <XStack alignItems="center" gap="$2" cursor="pointer">
                <input
                  type="checkbox"
                  checked={formData.is_template}
                  onChange={(e) => handleChange('is_template', e.target.checked)}
                  style={{
                    width: '16px',
                    height: '16px',
                    borderRadius: '4px',
                    border: '1px solid var(--color-gray-8)',
                  }}
                />
                <Text fontSize="$3" color="$color11">Save as template</Text>
              </XStack>
            </YStack>
          </XStack>

          {/* Change Summary (for updates) */}
          {isEditing && (
            <YStack>
              <Text fontSize="$3" fontWeight="600" color="$color11" mb="$1">
                Change Summary <Text color="$red10">*</Text>
              </Text>
              <Input
                width="100%"
                paddingHorizontal="$3"
                paddingVertical="$2"
                borderWidth={1}
                borderColor="$gray8"
                borderRadius="$4"
                value={changeSummary}
                onChange={(e) => setChangeSummary(e.target.value)}
                placeholder="Brief description of changes..."
              />
              <Text mt="$1" fontSize="$1" color="$gray11">
                This will be recorded in the version history
              </Text>
            </YStack>
          )}
        </YStack>

        {/* Footer */}
        <XStack
          position="sticky"
          bottom={0}
          backgroundColor="$background"
          borderTopWidth={1}
          borderColor="$borderColor"
          paddingHorizontal="$6"
          paddingVertical="$4"
          alignItems="center"
          justifyContent="flex-end"
          gap="$3"
        >
          <Button
            unstyled
            paddingHorizontal="$4"
            paddingVertical="$2"
            color="$gray12"
            hoverStyle={{ backgroundColor: '$gray2' }}
            borderRadius="$4"
            onPress={onClose}
          >
            <Text>Cancel</Text>
          </Button>
          <Button onPress={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? (
              <XStack alignItems="center" gap="$2">
                <LoadingSpinner size="sm" />
                <Text>Saving...</Text>
              </XStack>
            ) : (
              <XStack alignItems="center" gap="$1">
                <Save size={16} />
                <Text>{isEditing ? 'Update' : 'Create'} Requirement</Text>
              </XStack>
            )}
          </Button>
        </XStack>
      </YStack>
    </YStack>
  )
}

export default RequirementEditor
