/**
 * AddTeamMemberForm - Form for adding new team members
 * REQ-283: Team Member Management UI
 * TASK-3: Implement Add Team Member Form with Email Invitation
 *
 * Form with:
 * - Email input (required)
 * - Name input (optional)
 * - Access level selector (default to "user")
 * - Submit button with loading state
 */

'use client';

import React, { useState, useCallback } from 'react';
import { AccessLevelSelector, type AccessLevel } from './AccessLevelSelector';

interface AddTeamMemberFormProps {
  onSubmit: (data: { email: string; name: string; role: AccessLevel }) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
  existingEmails?: string[];
}

// Email validation regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface FormErrors {
  email?: string;
  name?: string;
  general?: string;
}

export function AddTeamMemberForm({
  onSubmit,
  onCancel,
  loading = false,
  existingEmails = [],
}: AddTeamMemberFormProps) {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<AccessLevel>('user');
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<{ email?: boolean; name?: boolean }>({});

  // Validate email
  const validateEmail = useCallback(
    (value: string): string | undefined => {
      if (!value.trim()) {
        return 'Email is required';
      }
      if (!EMAIL_REGEX.test(value)) {
        return 'Please enter a valid email address';
      }
      if (existingEmails.includes(value.toLowerCase())) {
        return 'This email is already on your team';
      }
      return undefined;
    },
    [existingEmails]
  );

  // Validate name
  const validateName = useCallback((value: string): string | undefined => {
    if (!value.trim()) {
      return 'Name is required';
    }
    if (value.trim().length < 2) {
      return 'Name must be at least 2 characters';
    }
    return undefined;
  }, []);

  // Handle email change
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEmail(value);

    if (touched.email) {
      setErrors((prev) => ({ ...prev, email: validateEmail(value) }));
    }
  };

  // Handle email blur
  const handleEmailBlur = () => {
    setTouched((prev) => ({ ...prev, email: true }));
    setErrors((prev) => ({ ...prev, email: validateEmail(email) }));
  };

  // Handle name change
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setName(value);

    if (touched.name) {
      setErrors((prev) => ({ ...prev, name: validateName(value) }));
    }
  };

  // Handle name blur
  const handleNameBlur = () => {
    setTouched((prev) => ({ ...prev, name: true }));
    setErrors((prev) => ({ ...prev, name: validateName(name) }));
  };

  // Handle form submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate all fields
    const emailError = validateEmail(email);
    const nameError = validateName(name);

    setErrors({ email: emailError, name: nameError });
    setTouched({ email: true, name: true });

    if (emailError || nameError) {
      return;
    }

    try {
      await onSubmit({ email: email.trim().toLowerCase(), name: name.trim(), role });
    } catch (err) {
      setErrors((prev) => ({
        ...prev,
        general: err instanceof Error ? err.message : 'Failed to invite team member',
      }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* General Error */}
      {errors.general && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-700">{errors.general}</p>
        </div>
      )}

      {/* Name Field */}
      <div className="space-y-1">
        <label htmlFor="member-name" className="block text-sm font-medium text-gray-700">
          Full Name <span className="text-red-500">*</span>
        </label>
        <input
          id="member-name"
          type="text"
          value={name}
          onChange={handleNameChange}
          onBlur={handleNameBlur}
          placeholder="Enter full name"
          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
            errors.name && touched.name
              ? 'border-red-300 bg-red-50'
              : 'border-gray-300'
          }`}
          disabled={loading}
          aria-invalid={!!(errors.name && touched.name)}
          aria-describedby={errors.name ? 'name-error' : undefined}
        />
        {errors.name && touched.name && (
          <p id="name-error" className="text-xs text-red-600">
            {errors.name}
          </p>
        )}
      </div>

      {/* Email Field */}
      <div className="space-y-1">
        <label htmlFor="member-email" className="block text-sm font-medium text-gray-700">
          Email Address <span className="text-red-500">*</span>
        </label>
        <input
          id="member-email"
          type="email"
          value={email}
          onChange={handleEmailChange}
          onBlur={handleEmailBlur}
          placeholder="Enter email address"
          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
            errors.email && touched.email
              ? 'border-red-300 bg-red-50'
              : 'border-gray-300'
          }`}
          disabled={loading}
          aria-invalid={!!(errors.email && touched.email)}
          aria-describedby={errors.email ? 'email-error' : undefined}
        />
        {errors.email && touched.email && (
          <p id="email-error" className="text-xs text-red-600">
            {errors.email}
          </p>
        )}
      </div>

      {/* Access Level Field */}
      <AccessLevelSelector value={role} onChange={setRole} disabled={loading} />

      {/* Action Buttons */}
      <div className="flex gap-3 pt-4">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              Sending Invitation...
            </span>
          ) : (
            'Send Invitation'
          )}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50"
        >
          Cancel
        </button>
      </div>

      {/* Help Text */}
      <p className="text-xs text-gray-500 text-center">
        An invitation email will be sent to the provided email address.
      </p>
    </form>
  );
}

export default AddTeamMemberForm;
