// src/components/settings/SettingsForm.tsx
import React from 'react';
// import { Button } from '@unicornlove/ui'; // Assuming Button component exists

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
    <form onSubmit={handleSubmit} className="space-y-6">
      {children}
      <div className="flex justify-end">
        {/* <Button type="submit" disabled={isLoading || !isDirty}>
          Save Changes
        </Button> */}
        <button type="submit" disabled={isLoading || !isDirty}>Save Changes</button>
      </div>
    </form>
  );
}

export default SettingsForm;
