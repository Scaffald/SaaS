// src/components/settings/SettingsForm.tsx
import React from 'react';
import { YStack, XStack, Button } from '@unicornlove/ui';

interface SettingsFormProps {
  children: React.ReactNode;
  onSubmit: () => void;
  isLoading?: boolean;
  isDirty?: boolean;
}

function SettingsForm({ children, onSubmit, isLoading = false, isDirty = false }: SettingsFormProps) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit();
  };

  return (
    <form onSubmit={handleSubmit}>
      <YStack gap="$6">
        {children}
        <XStack justifyContent="flex-end">
          <Button type="submit" disabled={isLoading || !isDirty}>
            Save Changes
          </Button>
        </XStack>
      </YStack>
    </form>
  );
}

export default SettingsForm;
