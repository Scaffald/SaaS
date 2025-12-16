// src/components/onboarding/steps/broker/ClientInviteStep.tsx
// REQ-126: Broker Onboarding - Client Invitation Step (Optional)
import { useState } from 'react';
import { Input as TextInput, Button, Heading2, BodyText } from '@unicornlove/ui';
import { YStack } from 'tamagui';

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
    <YStack>
      <Heading2 marginBottom="$2">Add Your First Client (Optional)</Heading2>
      <BodyText marginBottom="$6" color="$color10">
        You can skip this step and add clients later from your dashboard
      </BodyText>
      <YStack asChild gap="$4">
        <form onSubmit={handleSubmit}>
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
          <YStack marginTop="$6">
            <Button
              type="submit"
              variant="primary"
              disabled={isLoading}
            >
              {isLoading ? 'Saving...' : 'Continue'}
            </Button>
          </YStack>
        </form>
      </YStack>
    </YStack>
  );
}

export default ClientInviteStep;
