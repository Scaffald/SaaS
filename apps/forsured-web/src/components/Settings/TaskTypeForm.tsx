/**
 * REQ-261: Task Type Definitions & Settings Page
 * TASK-3: Build Task Type Settings Page UI
 *
 * Form component for creating and editing task types.
 */

import React, { useState, useEffect } from 'react';
import Button from '../Common/Button';
import Input from '../Common/Input';
import Select from '../Common/Select';
import Textarea from '../Common/Textarea';
import { TaskType, TaskTypeCategory, TaskPriority } from '../../types';
import {
  VALID_CATEGORIES,
  VALID_PRIORITIES,
  validateColor,
} from '../../lib/tasks/taskTypeService';

// Category display names
const CATEGORY_OPTIONS: { value: TaskTypeCategory; label: string }[] = [
  { value: 'document_review', label: 'Document Review' },
  { value: 'policy_management', label: 'Policy Management' },
  { value: 'compliance', label: 'Compliance' },
  { value: 'onboarding', label: 'Onboarding' },
  { value: 'custom', label: 'Custom' },
];

// Priority options
const PRIORITY_OPTIONS: { value: TaskPriority; label: string }[] = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' },
];

// Assignee role options
const ASSIGNEE_ROLE_OPTIONS: { value: string; label: string }[] = [
  { value: '', label: 'None' },
  { value: 'broker', label: 'Broker' },
  { value: 'gc', label: 'General Contractor' },
  { value: 'subcontractor', label: 'Subcontractor' },
];

// Common icon options
const ICON_OPTIONS: { value: string; label: string }[] = [
  { value: '', label: 'None' },
  { value: 'file-text', label: 'Document' },
  { value: 'shield', label: 'Shield' },
  { value: 'clipboard', label: 'Clipboard' },
  { value: 'user-plus', label: 'User Add' },
  { value: 'check-circle', label: 'Check Circle' },
  { value: 'alert-triangle', label: 'Alert' },
  { value: 'calendar', label: 'Calendar' },
  { value: 'clock', label: 'Clock' },
  { value: 'folder', label: 'Folder' },
  { value: 'settings', label: 'Settings' },
];

export interface TaskTypeFormData {
  name: string;
  description: string;
  default_priority: TaskPriority;
  default_due_date_offset: number;
  category: TaskTypeCategory;
  icon: string;
  color: string;
  default_assignee_role: 'broker' | 'gc' | 'subcontractor' | '';
  is_active: boolean;
}

interface TaskTypeFormProps {
  initialData?: TaskType;
  onSubmit: (data: TaskTypeFormData) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
}

interface FormErrors {
  name?: string;
  category?: string;
  default_due_date_offset?: string;
  color?: string;
}

export default function TaskTypeForm({
  initialData,
  onSubmit,
  onCancel,
  isSubmitting = false,
}: TaskTypeFormProps) {
  const [formData, setFormData] = useState<TaskTypeFormData>({
    name: initialData?.name || '',
    description: initialData?.description || '',
    default_priority: initialData?.default_priority || 'medium',
    default_due_date_offset: initialData?.default_due_date_offset ?? 7,
    category: initialData?.category || 'custom',
    icon: initialData?.icon || '',
    color: initialData?.color || '',
    default_assignee_role: initialData?.default_assignee_role || '',
    is_active: initialData?.is_active ?? true,
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Validate form
  const validate = (): FormErrors => {
    const newErrors: FormErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    } else if (formData.name.length > 100) {
      newErrors.name = 'Name must be 100 characters or less';
    }

    if (!formData.category) {
      newErrors.category = 'Category is required';
    } else if (!VALID_CATEGORIES.includes(formData.category)) {
      newErrors.category = 'Invalid category';
    }

    if (formData.default_due_date_offset < 0) {
      newErrors.default_due_date_offset = 'Due date offset must be 0 or greater';
    } else if (!Number.isInteger(formData.default_due_date_offset)) {
      newErrors.default_due_date_offset = 'Due date offset must be a whole number';
    }

    if (formData.color && validateColor(formData.color)) {
      newErrors.color = 'Color must be a valid hex code (e.g., #3B82F6)';
    }

    return newErrors;
  };

  // Validate on change
  useEffect(() => {
    if (Object.keys(touched).length > 0) {
      setErrors(validate());
    }
  }, [formData, touched]);

  // Handle field change
  const handleChange = (
    field: keyof TaskTypeFormData,
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

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Information */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider">
          Basic Information
        </h3>

        <Input
          label="Name"
          value={formData.name}
          onChange={(e) => handleChange('name', e.target.value)}
          error={touched.name ? errors.name : undefined}
          required
          fullWidth
          placeholder="e.g., Policy Renewal"
          maxLength={100}
        />

        <Textarea
          label="Description"
          value={formData.description}
          onChange={(e) => handleChange('description', e.target.value)}
          fullWidth
          placeholder="Describe what this task type is used for..."
          rows={3}
        />

        <Select
          label="Category"
          options={CATEGORY_OPTIONS}
          value={formData.category}
          onChange={(e) => handleChange('category', e.target.value as TaskTypeCategory)}
          error={touched.category ? errors.category : undefined}
          required
          fullWidth
        />
      </div>

      {/* Default Settings */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider">
          Default Settings
        </h3>

        <div className="grid grid-cols-2 gap-4">
          <Select
            label="Default Priority"
            options={PRIORITY_OPTIONS}
            value={formData.default_priority}
            onChange={(e) =>
              handleChange('default_priority', e.target.value as TaskPriority)
            }
            fullWidth
          />

          <Input
            label="Due Date Offset (days)"
            type="number"
            min={0}
            value={formData.default_due_date_offset}
            onChange={(e) =>
              handleChange('default_due_date_offset', parseInt(e.target.value, 10) || 0)
            }
            error={touched.default_due_date_offset ? errors.default_due_date_offset : undefined}
            fullWidth
            helperText="Days from task creation"
          />
        </div>

        <Select
          label="Default Assignee Role"
          options={ASSIGNEE_ROLE_OPTIONS}
          value={formData.default_assignee_role}
          onChange={(e) =>
            handleChange(
              'default_assignee_role',
              e.target.value as 'broker' | 'gc' | 'subcontractor' | ''
            )
          }
          fullWidth
          helperText="Tasks of this type will be assigned to users with this role by default"
        />
      </div>

      {/* Visual Customization */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider">
          Visual Customization
        </h3>

        <div className="grid grid-cols-2 gap-4">
          <Select
            label="Icon"
            options={ICON_OPTIONS}
            value={formData.icon}
            onChange={(e) => handleChange('icon', e.target.value)}
            fullWidth
          />

          <div>
            <label className="block text-sm font-medium text-text-primary mb-1.5">
              Color
            </label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={formData.color || '#3B82F6'}
                onChange={(e) => handleChange('color', e.target.value)}
                className="h-10 w-14 rounded border border-border cursor-pointer"
              />
              <Input
                value={formData.color}
                onChange={(e) => handleChange('color', e.target.value)}
                placeholder="#3B82F6"
                error={touched.color ? errors.color : undefined}
                className="flex-1"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Status */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider">
          Status
        </h3>

        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={formData.is_active}
            onChange={(e) => handleChange('is_active', e.target.checked)}
            className="w-4 h-4 text-primary-600 border-border rounded focus:ring-primary-500"
          />
          <span className="text-text-primary">Active</span>
          <span className="text-text-tertiary text-sm">
            (Inactive task types won't appear in task creation)
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
              : 'Create Task Type'}
        </Button>
      </div>
    </form>
  );
}
