/**
 * AccessLevelSelector - Access level selector using Tamagui
 * REQ-283: Team Member Management UI
 */
import React from 'react';
import { YStack, Text } from '@unicornlove/ui';
import { Select } from '@unicornlove/ui';

export type AccessLevel = 'admin' | 'manager' | 'user' | 'broker' | 'subcontractor';

interface AccessLevelOptionConfig {
  value: AccessLevel;
  label: string;
  description: string;
}

const ACCESS_LEVEL_CONFIG: AccessLevelOptionConfig[] = [
  {
    value: 'admin',
    label: 'Admin',
    description: 'Full access to all features and settings',
  },
  {
    value: 'manager',
    label: 'Manager',
    description: 'Manage team members and projects',
  },
  {
    value: 'broker',
    label: 'Broker',
    description: 'Manage insurance policies and compliance',
  },
  {
    value: 'subcontractor',
    label: 'Subcontractor',
    description: 'Limited access for external contractors',
  },
  {
    value: 'user',
    label: 'Member',
    description: 'Standard access to assigned resources',
  },
];

// Convert to Select options format
const SELECT_OPTIONS = ACCESS_LEVEL_CONFIG.map((opt) => ({
  value: opt.value,
  label: opt.label,
}));

interface AccessLevelSelectorProps {
  value: AccessLevel;
  onChange: (level: AccessLevel) => void;
  disabled?: boolean;
  loading?: boolean;
}

export function AccessLevelSelector({
  value,
  onChange,
  disabled = false,
  loading = false,
}: AccessLevelSelectorProps) {
  const handleChange = (newValue: string) => {
    onChange(newValue as AccessLevel);
  };

  const selectedConfig = ACCESS_LEVEL_CONFIG.find((opt) => opt.value === value);

  return (
    <YStack gap="$1">
      <Select
        label="Access Level"
        value={value}
        onValueChange={handleChange}
        options={SELECT_OPTIONS}
        disabled={disabled || loading}
      />
      {selectedConfig && (
        <Text id="access-level-description" fontSize="$1" color="$color9">
          {selectedConfig.description}
        </Text>
      )}
      {loading && (
        <Text fontSize="$1" color="$blue9" aria-live="polite">
          Saving...
        </Text>
      )}
    </YStack>
  );
}

export default AccessLevelSelector;
