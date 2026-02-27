// src/components/settings/SettingsForm.tsx
import React from 'react';
import { Stack, Row, Button } from '@scaffald/ui';

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
      <Stack style={{ gap: 24 }}>
        {children}
        <Row style={{ justifyContent: 'flex-end' }}>
          <Button type="submit" disabled={isLoading || !isDirty}>
            Save Changes
          </Button>
        </Row>
      </Stack>
    </form>
  );
}

export default SettingsForm;
