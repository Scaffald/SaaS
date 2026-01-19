/**
 * ManualUserForm - Form for creating manual users
 * REQ-12: Add Manual Broker and Contractor Registration
 * TASK-7: Build manual user creation UI components
 *
 * Form with:
 * - Name input (required)
 * - Email input (optional - enables invitation checkbox)
 * - Phone input (optional)
 * - Company input (optional)
 * - Send invitation checkbox (only when email provided)
 */

'use client';

import React, { useState, useCallback } from 'react';
import { Loader2 } from 'lucide-react';
import { Stack, Row, Text, Input, Button } from '@unicornlove/beyond-ui';

export type ManualUserRole = 'contractor' | 'broker';

export interface ManualUserFormData {
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  role: ManualUserRole;
  sendInvitation: boolean;
}

interface ManualUserFormProps {
  role: ManualUserRole;
  onSubmit: (data: ManualUserFormData) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
  existingEmails?: string[];
}

// Email validation regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Phone validation regex (basic US format)
const PHONE_REGEX = /^[\d\s\-()]+$/;

interface FormErrors {
  name?: string;
  email?: string;
  phone?: string;
  company?: string;
  general?: string;
}

export function ManualUserForm({
  role,
  onSubmit,
  onCancel,
  loading = false,
  existingEmails = [],
}: ManualUserFormProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [company, setCompany] = useState('');
  const [sendInvitation, setSendInvitation] = useState(true);
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Validate name (required)
  const validateName = useCallback((value: string): string | undefined => {
    if (!value.trim()) {
      return 'Name is required';
    }
    if (value.trim().length < 2) {
      return 'Name must be at least 2 characters';
    }
    return undefined;
  }, []);

  // Validate email (optional, but if provided must be valid)
  const validateEmail = useCallback(
    (value: string): string | undefined => {
      if (!value.trim()) {
        return undefined; // Email is optional
      }
      if (!EMAIL_REGEX.test(value)) {
        return 'Please enter a valid email address';
      }
      if (existingEmails.includes(value.toLowerCase())) {
        return 'A user with this email already exists';
      }
      return undefined;
    },
    [existingEmails]
  );

  // Validate phone (optional, but if provided must be valid)
  const validatePhone = useCallback((value: string): string | undefined => {
    if (!value.trim()) {
      return undefined; // Phone is optional
    }
    if (!PHONE_REGEX.test(value)) {
      return 'Please enter a valid phone number';
    }
    if (value.replace(/\D/g, '').length < 10) {
      return 'Phone number must have at least 10 digits';
    }
    return undefined;
  }, []);

  // Handle field changes with validation
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setName(value);
    if (touched.name) {
      setErrors((prev) => ({ ...prev, name: validateName(value) }));
    }
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEmail(value);
    if (touched.email) {
      setErrors((prev) => ({ ...prev, email: validateEmail(value) }));
    }
    // Disable send invitation if email is cleared
    if (!value.trim()) {
      setSendInvitation(false);
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPhone(value);
    if (touched.phone) {
      setErrors((prev) => ({ ...prev, phone: validatePhone(value) }));
    }
  };

  const handleCompanyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCompany(e.target.value);
  };

  // Handle blur events for validation
  const handleBlur = (field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    switch (field) {
      case 'name':
        setErrors((prev) => ({ ...prev, name: validateName(name) }));
        break;
      case 'email':
        setErrors((prev) => ({ ...prev, email: validateEmail(email) }));
        break;
      case 'phone':
        setErrors((prev) => ({ ...prev, phone: validatePhone(phone) }));
        break;
    }
  };

  // Handle form submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate all fields
    const nameError = validateName(name);
    const emailError = validateEmail(email);
    const phoneError = validatePhone(phone);

    setErrors({ name: nameError, email: emailError, phone: phoneError });
    setTouched({ name: true, email: true, phone: true });

    if (nameError || emailError || phoneError) {
      return;
    }

    try {
      await onSubmit({
        name: name.trim(),
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
        company: company.trim() || undefined,
        role,
        sendInvitation: sendInvitation && !!email.trim(),
      });
    } catch (err) {
      setErrors((prev) => ({
        ...prev,
        general: err instanceof Error ? err.message : 'Failed to create user',
      }));
    }
  };

  const roleLabel = role === 'contractor' ? 'Contractor' : 'Broker';
  const hasEmail = !!email.trim();

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

        {/* Name Field (Required) */}
        <Stack style={{ gap: 4 }}>
          <label htmlFor="manual-user-name">
            <Text style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-gray-11)' }}>
              Full Name <Text style={{ color: 'var(--color-red-10)' }}>*</Text>
            </Text>
          </label>
          <Input
            id="manual-user-name"
            type="text"
            value={name}
            onChange={handleNameChange}
            onBlur={() => handleBlur('name')}
            placeholder={`Enter ${roleLabel.toLowerCase()} name`}
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

        {/* Email Field (Optional) */}
        <Stack style={{ gap: 4 }}>
          <label htmlFor="manual-user-email">
            <Text style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-gray-11)' }}>
              Email Address
            </Text>
          </label>
          <Input
            id="manual-user-email"
            type="email"
            value={email}
            onChange={handleEmailChange}
            onBlur={() => handleBlur('email')}
            placeholder="Enter email address (optional)"
            disabled={loading}
            aria-invalid={!!(errors.email && touched.email)}
            aria-describedby={errors.email ? 'email-error' : 'email-help'}
            style={{
              width: '100%',
              borderColor: errors.email && touched.email ? 'var(--color-red-6)' : undefined,
              backgroundColor: errors.email && touched.email ? 'var(--color-red-2)' : undefined,
            }}
          />
          {errors.email && touched.email ? (
            <Text id="email-error" style={{ fontSize: 12, color: 'var(--color-red-10)' }}>
              {errors.email}
            </Text>
          ) : (
            <Text id="email-help" style={{ fontSize: 12, color: 'var(--color-gray-9)' }}>
              Required to send invitation
            </Text>
          )}
        </Stack>

        {/* Phone Field (Optional) */}
        <Stack style={{ gap: 4 }}>
          <label htmlFor="manual-user-phone">
            <Text style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-gray-11)' }}>
              Phone Number
            </Text>
          </label>
          <Input
            id="manual-user-phone"
            type="tel"
            value={phone}
            onChange={handlePhoneChange}
            onBlur={() => handleBlur('phone')}
            placeholder="Enter phone number (optional)"
            disabled={loading}
            aria-invalid={!!(errors.phone && touched.phone)}
            aria-describedby={errors.phone ? 'phone-error' : undefined}
            style={{
              width: '100%',
              borderColor: errors.phone && touched.phone ? 'var(--color-red-6)' : undefined,
              backgroundColor: errors.phone && touched.phone ? 'var(--color-red-2)' : undefined,
            }}
          />
          {errors.phone && touched.phone && (
            <Text id="phone-error" style={{ fontSize: 12, color: 'var(--color-red-10)' }}>
              {errors.phone}
            </Text>
          )}
        </Stack>

        {/* Company Field (Optional) */}
        <Stack style={{ gap: 4 }}>
          <label htmlFor="manual-user-company">
            <Text style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-gray-11)' }}>
              Company Name
            </Text>
          </label>
          <Input
            id="manual-user-company"
            type="text"
            value={company}
            onChange={handleCompanyChange}
            placeholder="Enter company name (optional)"
            disabled={loading}
            style={{ width: '100%' }}
          />
        </Stack>

        {/* Send Invitation Checkbox */}
        <Row style={{ alignItems: 'center', gap: 8 }}>
          <input
            type="checkbox"
            id="send-invitation"
            checked={sendInvitation && hasEmail}
            onChange={(e) => setSendInvitation(e.target.checked)}
            disabled={loading || !hasEmail}
            style={{
              width: 18,
              height: 18,
              cursor: hasEmail ? 'pointer' : 'not-allowed',
              opacity: hasEmail ? 1 : 0.5,
            }}
          />
          <label
            htmlFor="send-invitation"
            style={{
              cursor: hasEmail ? 'pointer' : 'not-allowed',
              opacity: hasEmail ? 1 : 0.5,
            }}
          >
            <Text style={{ fontSize: 14, color: 'var(--color-gray-11)' }}>
              Send invitation email
            </Text>
          </label>
        </Row>
        {!hasEmail && (
          <Text style={{ fontSize: 12, color: 'var(--color-gray-9)', marginTop: -8 }}>
            Enter an email address to enable invitations
          </Text>
        )}

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
                  Creating {roleLabel}...
                </Text>
              </Row>
            ) : (
              `Add ${roleLabel}`
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
          {hasEmail && sendInvitation
            ? `An invitation will be sent. When they register, their account will be merged automatically.`
            : `This ${roleLabel.toLowerCase()} will be added as a placeholder. Tasks can be assigned but no notifications will be sent until they register.`}
        </Text>
      </Stack>
    </form>
  );
}

export default ManualUserForm;
