// src/components/onboarding/steps/broker/ClientInviteStep.tsx
// REQ-126: Broker Onboarding - Client Invitation Step (Optional)
import { useState } from 'react';
import { Stack, Text, H2, Input, Button } from '@unicornlove/beyond-ui';

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
    <Stack>
      <H2 style={{ marginBottom: 8 }}>Add Your First Client (Optional)</H2>
      <Text style={{ marginBottom: 24, color: 'var(--color-text-secondary)' }}>
        You can skip this step and add clients later from your dashboard
      </Text>
      <form onSubmit={handleSubmit}>
        <Stack style={{ gap: 16 }}>
          <Stack style={{ gap: 8 }}>
            <Text style={{ fontWeight: 600, color: 'var(--color-text)' }}>Client Name</Text>
            <Input
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              placeholder="Enter client company name"
            />
          </Stack>
          <Stack style={{ gap: 8 }}>
            <Text style={{ fontWeight: 600, color: 'var(--color-text)' }}>Client Email</Text>
            <Input
              value={clientEmail}
              onChange={(e) => setClientEmail(e.target.value)}
              placeholder="client@example.com"
            />
            <Text style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>We'll send them an invitation to connect</Text>
            {errors.clientEmail && <Text style={{ color: 'var(--color-red-10)', fontSize: 12 }}>{errors.clientEmail}</Text>}
          </Stack>
          <Stack style={{ marginTop: 24 }}>
            <Button
              onClick={handleSubmit}
              variant="primary"
              disabled={isLoading}
            >
              {isLoading ? 'Saving...' : 'Continue'}
            </Button>
          </Stack>
        </Stack>
      </form>
    </Stack>
  );
}

export default ClientInviteStep;
