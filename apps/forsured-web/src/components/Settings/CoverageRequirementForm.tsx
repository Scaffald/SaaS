/**
 * REQ-263: Org-Level vs Project-Level Coverage Distinction
 * TASK-3: Build Org Coverage Requirements Settings UI
 *
 * Form component for creating and editing coverage limit requirements.
 */

import React, { useState, useEffect, useCallback } from 'react';
import Button from '../Common/Button';
import Input from '../Common/Input';
import Select from '../Common/Select';
import {
  CoverageLimitRequirement,
  CoverageLimitType,
  CoverageRequirementLevel,
} from '../../types';
import {
  validateCoverageType,
  validateMinimumLimit,
} from '../../lib/coverageRequirements/coverageLimitRequirementService';

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
];

export interface CoverageRequirementFormData {
  name: string;
  coverage_type: CoverageLimitType;
  minimum_limit: number;
  required: boolean;
}

interface CoverageRequirementFormProps {
  initialData?: CoverageLimitRequirement;
  level: CoverageRequirementLevel;
  onSubmit: (data: CoverageRequirementFormData) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
}

interface FormErrors {
  name?: string;
  coverage_type?: string;
  minimum_limit?: string;
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
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Validate form
  const validate = useCallback((): FormErrors => {
    const newErrors: FormErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    } else if (formData.name.length > 200) {
      newErrors.name = 'Name must be 200 characters or less';
    }

    const coverageTypeError = validateCoverageType(formData.coverage_type);
    if (coverageTypeError) {
      newErrors.coverage_type = coverageTypeError.message;
    }

    const limitError = validateMinimumLimit(formData.minimum_limit);
    if (limitError) {
      newErrors.minimum_limit = limitError.message;
    }

    return newErrors;
  }, [formData]);

  // Validate on change
  useEffect(() => {
    if (Object.keys(touched).length > 0) {
      setErrors(validate());
    }
  }, [touched, validate]);

  // Handle field change
  const handleChange = (
    field: keyof CoverageRequirementFormData,
    value: string | number | boolean
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  // Handle submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Mark all fields as touched
    const allTouched: Record<string, boolean> = {};
    Object.keys(formData).forEach((key) => {
      allTouched[key] = true;
    });
    setTouched(allTouched);

    // Validate
    const validationErrors = validate();
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    await onSubmit(formData);
  };

  // Format number as currency
  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Level Badge */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-text-secondary">Requirement Level:</span>
        <span
          className={`px-2 py-1 rounded-full text-xs font-semibold ${
            level === 'org'
              ? 'bg-primary-100 text-primary-700'
              : 'bg-purple-100 text-purple-700'
          }`}
        >
          {level === 'org' ? 'ORGANIZATION' : 'PROJECT'}
        </span>
      </div>

      {/* Basic Information */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider">
          Requirement Details
        </h3>

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
          onChange={(e) =>
            handleChange('coverage_type', e.target.value as CoverageLimitType)
          }
          error={touched.coverage_type ? errors.coverage_type : undefined}
          required
          fullWidth
        />
      </div>

      {/* Limit Settings */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider">
          Limit Requirements
        </h3>

        <div>
          <Input
            label="Minimum Limit"
            type="number"
            min={0}
            step={100000}
            value={formData.minimum_limit}
            onChange={(e) =>
              handleChange('minimum_limit', parseFloat(e.target.value) || 0)
            }
            error={touched.minimum_limit ? errors.minimum_limit : undefined}
            required
            fullWidth
            helperText={`Current value: ${formatCurrency(formData.minimum_limit)}`}
          />
        </div>

        {/* Common limit quick-select buttons */}
        <div className="flex flex-wrap gap-2">
          <span className="text-sm text-text-tertiary mr-2">Quick select:</span>
          {[500000, 1000000, 2000000, 5000000].map((amount) => (
            <button
              key={amount}
              type="button"
              onClick={() => handleChange('minimum_limit', amount)}
              className={`px-3 py-1 text-sm rounded-lg border transition-colors ${
                formData.minimum_limit === amount
                  ? 'bg-primary-100 border-primary-300 text-primary-700'
                  : 'bg-bg-secondary border-border text-text-secondary hover:bg-bg-tertiary'
              }`}
            >
              {formatCurrency(amount)}
            </button>
          ))}
        </div>
      </div>

      {/* Status */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider">
          Enforcement
        </h3>

        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={formData.required}
            onChange={(e) => handleChange('required', e.target.checked)}
            className="w-4 h-4 text-primary-600 border-border rounded focus:ring-primary-500"
          />
          <span className="text-text-primary">Required</span>
          <span className="text-text-tertiary text-sm">
            (Subcontractors must meet this requirement for compliance)
          </span>
        </label>
      </div>

      {/* Form Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t border-border">
        <Button variant="ghost" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button variant="primary" type="submit" disabled={isSubmitting}>
          {isSubmitting
            ? initialData
              ? 'Saving...'
              : 'Creating...'
            : initialData
              ? 'Save Changes'
              : 'Create Requirement'}
        </Button>
      </div>
    </form>
  );
}
