/**
 * InvitationForm - Invitation form using Tamagui
 */
import React, { useState } from 'react';
import { YStack, XStack, Text } from '@unicornlove/ui';
import { Button as CoreButton } from '@unicornlove/ui';
import { Input as TextInput } from '@unicornlove/ui';
import { Card } from '@unicornlove/ui';

interface InvitationFormProps {
  onSubmit: (data: { email: string; expiresAt: string; maxUses: number }) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

function InvitationForm({ onSubmit, onCancel, isLoading = false }: InvitationFormProps) {
  const [email, setEmail] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [maxUses, setMaxUses] = useState(1);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ email, expiresAt, maxUses });
  };

  return (
    <Card padding="$4" gap="$4">
      <Text fontSize="$5" fontWeight="600" marginBottom="$4">
        Create New Broker Invitation
      </Text>
      <YStack as="form" onSubmit={handleSubmit} gap="$4">
        <YStack gap="$1.5">
          <Text fontSize="$2" fontWeight="500" color="$color11">
            Email (Optional)
          </Text>
          <TextInput
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="broker@example.com"
          />
        </YStack>
        <YStack gap="$1.5">
          <Text fontSize="$2" fontWeight="500" color="$color11">
            Expires At
          </Text>
          <TextInput
            type="date"
            value={expiresAt}
            onChange={(e) => setExpiresAt(e.target.value)}
            required
          />
        </YStack>
        <YStack gap="$1.5">
          <Text fontSize="$2" fontWeight="500" color="$color11">
            Max Uses
          </Text>
          <TextInput
            type="number"
            value={maxUses.toString()}
            onChange={(e) => setMaxUses(parseInt(e.target.value) || 1)}
            min="1"
            required
          />
        </YStack>
        <XStack justifyContent="flex-end" gap="$2">
          <CoreButton
            variant="secondary"
            onPress={onCancel}
            disabled={isLoading}
          >
            Cancel
          </CoreButton>
          <CoreButton
            type="submit"
            variant="primary"
            disabled={isLoading}
          >
            Create
          </CoreButton>
        </XStack>
      </YStack>
    </Card>
  );
}

export default InvitationForm;
