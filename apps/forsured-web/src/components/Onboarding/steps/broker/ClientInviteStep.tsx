// src/components/onboarding/steps/broker/ClientInviteStep.tsx
// REQ-126: Broker Onboarding - Client Invitation Step (Optional)
import React, { useState } from 'react';
import { Input as TextInput } from '@unicornlove/ui';
import { Button } from '@unicornlove/ui';
import { Heading2, BodyText } from '@unicornlove/ui';

interface ClientInviteStepProps {
  onComplete: (data: any) => Promise<void>;
  initialData?: any;
  isLoading?: boolean;
}

function ClientInviteStep({ onComplete, initialData = {}, isLoading = false }: ClientInviteStepProps) {
  const firstClient = initialData.firstClient || {};
  const [clientName, setClientName] = useState(firstClient.name || '');
  const [clientEmail, setClientEmail] = useState(firstClient.email || '');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (clientName && !clientEmail) {
      newErrors.clientEmail = 'Email is required if client name is provided';
    }
    if (clientEmail && !clientEmail.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      newErrors.clientEmail = 'Please enter a valid email address';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    await onComplete({
      firstClient: clientName && clientEmail ? {
        name: clientName,
        email: clientEmail,
      } : undefined,
    });
  };

  return (
    <div className="client-invite-step">
      <Heading2 className="mb-2">Add Your First Client (Optional)</Heading2>
      <BodyText className="mb-6 text-gray-600">
        You can skip this step and add clients later from your dashboard
      </BodyText>
      <form onSubmit={handleSubmit} className="space-y-4">
        <TextInput
          label="Client Name"
          value={clientName}
          onChangeText={setClientName}
          placeholder="Enter client company name"
        />
        <TextInput
          label="Client Email"
          value={clientEmail}
          onChangeText={setClientEmail}
          error={errors.clientEmail}
          placeholder="client@example.com"
          keyboardType="email"
          helperText="We'll send them an invitation to connect"
        />
        <div className="mt-6">
          <Button
            type="submit"
            variant="primary"
            disabled={isLoading}
          >
            {isLoading ? 'Saving...' : 'Continue'}
          </Button>
        </div>
      </form>
    </div>
  );
}

export default ClientInviteStep;
