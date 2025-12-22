// src/components/onboarding/steps/broker/ClientInviteStep.tsx
// REQ-126: Broker Onboarding - Client Invitation Step (Optional)
import { useState } from 'react';
import { YStack, Text, H2, Input, Button } from '@unicornlove/ui';

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
      <H2 mb="$2">Add Your First Client (Optional)</H2>
      <Text mb="$6" color="$color10">
        You can skip this step and add clients later from your dashboard
      </Text>
      <YStack tag="form" onSubmit={handleSubmit} gap="$4">
        <YStack gap="$2">
          <Text fontWeight="600" color="$color12">Client Name</Text>
          <Input
            value={clientName}
            onChangeText={setClientName}
            placeholder="Enter client company name"
          />
        </YStack>
        <YStack gap="$2">
          <Text fontWeight="600" color="$color12">Client Email</Text>
          <Input
            value={clientEmail}
            onChangeText={setClientEmail}
            placeholder="client@example.com"
          />
          <Text fontSize="$2" color="$color10">We'll send them an invitation to connect</Text>
          {errors.clientEmail && <Text color="$red10" fontSize="$2">{errors.clientEmail}</Text>}
        </YStack>
        <YStack mt="$6">
          <Button
            onPress={handleSubmit}
            variant="primary"
            disabled={isLoading}
          >
            {isLoading ? 'Saving...' : 'Continue'}
          </Button>
        </YStack>
      </YStack>
    </YStack>
  );
}

export default ClientInviteStep;
