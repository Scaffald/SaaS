/**
 * AccessLevelSelector - Access level selector using Beyond UI
 * Team Member Management UI
 */
import React from 'react';
import { Stack, Text } from '@unicornlove/beyond-ui';

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
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange(e.target.value as AccessLevel);
  };

  const selectedConfig = ACCESS_LEVEL_CONFIG.find((opt) => opt.value === value);

  return (
    <Stack style={{ gap: 4 }}>
      <label htmlFor="access-level-select">
        <Text style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-gray-11)' }}>
          Access Level
        </Text>
      </label>
      <select
        id="access-level-select"
        value={value}
        onChange={handleChange}
        disabled={disabled || loading}
        style={{
          width: '100%',
          padding: '8px 12px',
          border: '1px solid var(--color-border)',
          borderRadius: 8,
          backgroundColor: 'var(--color-background)',
          fontSize: 14,
          color: 'var(--color-gray-12)',
          cursor: disabled || loading ? 'not-allowed' : 'pointer',
          opacity: disabled || loading ? 0.5 : 1,
        }}
        aria-describedby="access-level-description"
      >
        {ACCESS_LEVEL_CONFIG.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {selectedConfig && (
        <Text id="access-level-description" style={{ fontSize: 12, color: 'var(--color-gray-9)' }}>
          {selectedConfig.description}
        </Text>
      )}
      {loading && (
        <Text style={{ fontSize: 12, color: 'var(--color-blue-9)' }} aria-live="polite">
          Saving...
        </Text>
      )}
    </Stack>
  );
}

export default AccessLevelSelector;
