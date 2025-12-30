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

import { useState, useCallback } from 'react';
import { Loader2 } from 'lucide-react';
import { YStack, XStack, Text, Input, Button, SizableText, Spinner } from '@unicornlove/ui';
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
      <YStack gap="$4">
      {/* General Error */}
      {errors.general && (
        <YStack
          padding="$3"
          backgroundColor="$red2"
          borderWidth={1}
          borderColor="$red6"
          borderRadius="$4"
        >
          <SizableText fontSize="$3" color="$red11">
            {errors.general}
          </SizableText>
        </YStack>
      )}

      {/* Name Field */}
      <YStack gap="$1">
        <label htmlFor="member-name">
          <SizableText fontSize="$3" fontWeight="500" color="$color11">
            Full Name <Text color="$red10">*</Text>
          </SizableText>
        </label>
        <Input
          id="member-name"
          type="text"
          value={name}
          onChange={handleNameChange}
          onBlur={handleNameBlur}
          placeholder="Enter full name"
          width="100%"
          padding="$2"
          borderWidth={1}
          borderColor={errors.name && touched.name ? '$red6' : '$borderColor'}
          backgroundColor={errors.name && touched.name ? '$red2' : '$background'}
          borderRadius="$4"
          disabled={loading}
          aria-invalid={!!(errors.name && touched.name)}
          aria-describedby={errors.name ? 'name-error' : undefined}
        />
        {errors.name && touched.name && (
          <SizableText id="name-error" fontSize="$1" color="$red10">
            {errors.name}
          </SizableText>
        )}
      </YStack>

      {/* Email Field */}
      <YStack gap="$1">
        <label htmlFor="member-email">
          <SizableText fontSize="$3" fontWeight="500" color="$color11">
            Email Address <Text color="$red10">*</Text>
          </SizableText>
        </label>
        <Input
          id="member-email"
          type="email"
          value={email}
          onChange={handleEmailChange}
          onBlur={handleEmailBlur}
          placeholder="Enter email address"
          width="100%"
          padding="$2"
          borderWidth={1}
          borderColor={errors.email && touched.email ? '$red6' : '$borderColor'}
          backgroundColor={errors.email && touched.email ? '$red2' : '$background'}
          borderRadius="$4"
          disabled={loading}
          aria-invalid={!!(errors.email && touched.email)}
          aria-describedby={errors.email ? 'email-error' : undefined}
        />
        {errors.email && touched.email && (
          <SizableText id="email-error" fontSize="$1" color="$red10">
            {errors.email}
          </SizableText>
        )}
      </YStack>

      {/* Access Level Field */}
      <AccessLevelSelector value={role} onChange={setRole} disabled={loading} />

      {/* Action Buttons */}
      <XStack gap="$3" paddingTop="$4">
        <Button
          type="submit"
          disabled={loading}
          flex={1}
          backgroundColor="$blue10"
          color="white"
          size="$3"
          opacity={loading ? 0.5 : 1}
        >
          {loading ? (
            <XStack alignItems="center" justifyContent="center" gap="$2">
              <Spinner size="small" color="white" />
              <SizableText fontSize="$3" color="white">
                Sending Invitation...
              </SizableText>
            </XStack>
          ) : (
            'Send Invitation'
          )}
        </Button>
        <Button
          type="button"
          onPress={onCancel}
          disabled={loading}
          variant="outlined"
          size="$3"
          opacity={loading ? 0.5 : 1}
        >
          Cancel
        </Button>
      </XStack>

      {/* Help Text */}
      <SizableText fontSize="$1" color="$color10" style={{ textAlign: 'center' }}>
        An invitation email will be sent to the provided email address.
      </SizableText>
      </YStack>
    </form>
  );
}

export default AddTeamMemberForm;
