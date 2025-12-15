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
  useCreateComplianceRequirement,
  useUpdateComplianceRequirement,
  type ComplianceRequirement,
  type CoverageType,
  type RequirementStatus,
  type RequirementDefinition,
} from '../../../hooks/useComplianceRequirements'
import { Button } from '../../Common/Button'
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
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">
            {isEditing ? 'Edit Requirement' : 'New Compliance Requirement'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Error Alert */}
          {(createMutation.error || updateMutation.error) && (
            <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              <AlertCircle size={20} className="flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">Error saving requirement</p>
                <p className="text-sm">{(createMutation.error || updateMutation.error)?.message}</p>
              </div>
            </div>
          )}

          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Code <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.code}
                onChange={(e) => handleChange('code', e.target.value.toUpperCase())}
                placeholder="GL-REQ-001"
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.code ? 'border-red-500' : 'border-gray-300'
                }`}
                disabled={isEditing}
              />
              {errors.code && <p className="mt-1 text-sm text-red-500">{errors.code}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Type <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.type}
                onChange={(e) => handleChange('type', e.target.value as CoverageType)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {COVERAGE_TYPE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="General Liability - Standard Construction"
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.name ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.name && <p className="mt-1 text-sm text-red-500">{errors.name}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="Describe the requirement..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Coverage Limits */}
          <div className="border-t pt-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Coverage Limits</h3>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Per Occurrence
                </label>
                <input
                  type="text"
                  value={formData.per_occurrence}
                  onChange={(e) => handleCurrencyChange('per_occurrence', e.target.value)}
                  placeholder="$1,000,000"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Aggregate</label>
                <input
                  type="text"
                  value={formData.aggregate}
                  onChange={(e) => handleCurrencyChange('aggregate', e.target.value)}
                  placeholder="$2,000,000"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Max Deductible
                </label>
                <input
                  type="text"
                  value={formData.deductible_max}
                  onChange={(e) => handleCurrencyChange('deductible_max', e.target.value)}
                  placeholder="$10,000"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Effective Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={formData.effective_date}
                onChange={(e) => handleChange('effective_date', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.effective_date ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.effective_date && (
                <p className="mt-1 text-sm text-red-500">{errors.effective_date}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Expiration Date
              </label>
              <input
                type="date"
                value={formData.expiration_date}
                onChange={(e) => handleChange('expiration_date', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Status and Template */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={formData.status}
                onChange={(e) => handleChange('status', e.target.value as RequirementStatus)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center pt-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.is_template}
                  onChange={(e) => handleChange('is_template', e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Save as template</span>
              </label>
            </div>
          </div>

          {/* Change Summary (for updates) */}
          {isEditing && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Change Summary <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={changeSummary}
                onChange={(e) => setChangeSummary(e.target.value)}
                placeholder="Brief description of changes..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="mt-1 text-xs text-gray-500">
                This will be recorded in the version history
              </p>
            </div>
          )}
        </form>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t px-6 py-4 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
          >
            Cancel
          </button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <LoadingSpinner size="sm" className="mr-2" />
                Saving...
              </>
            ) : (
              <>
                <Save size={16} className="mr-1" />
                {isEditing ? 'Update' : 'Create'} Requirement
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}

export default RequirementEditor
