/**
 * AddTeamMemberForm - Form for adding new team members
 * Team Member Management UI
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
import { Loader2 } from 'lucide-react';
import { Stack, Row, Text, Input, Button } from '@unicornlove/beyond-ui';
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
    <form onSubmit={handleSubmit}>
      <Stack style={{ gap: 16 }}>
        {/* General Error */}
        {errors.general && (
          <div
            style={{
              padding: 12,
              backgroundColor: 'var(--color-red-2)',
              border: '1px solid var(--color-red-6)',
              borderRadius: 8,
            }}
          >
            <Text style={{ fontSize: 14, color: 'var(--color-red-11)' }}>
              {errors.general}
            </Text>
          </div>
        )}

        {/* Name Field */}
        <Stack style={{ gap: 4 }}>
          <label htmlFor="member-name">
            <Text style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-gray-11)' }}>
              Full Name <Text style={{ color: 'var(--color-red-10)' }}>*</Text>
            </Text>
          </label>
          <Input
            id="member-name"
            type="text"
            value={name}
            onChange={handleNameChange}
            onBlur={handleNameBlur}
            placeholder="Enter full name"
            disabled={loading}
            aria-invalid={!!(errors.name && touched.name)}
            aria-describedby={errors.name ? 'name-error' : undefined}
            style={{
              width: '100%',
              borderColor: errors.name && touched.name ? 'var(--color-red-6)' : undefined,
              backgroundColor: errors.name && touched.name ? 'var(--color-red-2)' : undefined,
            }}
          />
          {errors.name && touched.name && (
            <Text id="name-error" style={{ fontSize: 12, color: 'var(--color-red-10)' }}>
              {errors.name}
            </Text>
          )}
        </Stack>

        {/* Email Field */}
        <Stack style={{ gap: 4 }}>
          <label htmlFor="member-email">
            <Text style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-gray-11)' }}>
              Email Address <Text style={{ color: 'var(--color-red-10)' }}>*</Text>
            </Text>
          </label>
          <Input
            id="member-email"
            type="email"
            value={email}
            onChange={handleEmailChange}
            onBlur={handleEmailBlur}
            placeholder="Enter email address"
            disabled={loading}
            aria-invalid={!!(errors.email && touched.email)}
            aria-describedby={errors.email ? 'email-error' : undefined}
            style={{
              width: '100%',
              borderColor: errors.email && touched.email ? 'var(--color-red-6)' : undefined,
              backgroundColor: errors.email && touched.email ? 'var(--color-red-2)' : undefined,
            }}
          />
          {errors.email && touched.email && (
            <Text id="email-error" style={{ fontSize: 12, color: 'var(--color-red-10)' }}>
              {errors.email}
            </Text>
          )}
        </Stack>

        {/* Access Level Field */}
        <AccessLevelSelector value={role} onChange={setRole} disabled={loading} />

        {/* Action Buttons */}
        <Row style={{ gap: 12, paddingTop: 16 }}>
          <Button
            type="submit"
            disabled={loading}
            style={{
              flex: 1,
              backgroundColor: 'var(--color-blue-10)',
              color: 'white',
              opacity: loading ? 0.5 : 1,
            }}
          >
            {loading ? (
              <Row style={{ alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <Loader2 size={16} className="animate-spin" />
                <Text style={{ fontSize: 14, color: 'white' }}>
                  Sending Invitation...
                </Text>
              </Row>
            ) : (
              'Send Invitation'
            )}
          </Button>
          <Button
            type="button"
            onPress={onCancel}
            disabled={loading}
            variant="outline"
            style={{ opacity: loading ? 0.5 : 1 }}
          >
            Cancel
          </Button>
        </Row>

        {/* Help Text */}
        <Text style={{ fontSize: 12, color: 'var(--color-gray-10)', textAlign: 'center' }}>
          An invitation email will be sent to the provided email address.
        </Text>
      </Stack>
    </form>
  );
}

export default AddTeamMemberForm;
