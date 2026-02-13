/**
 * InvitationCodeInput - Invitation code input using Beyond UI
 */
import React from 'react';
import { Stack, Text, Input } from '@scaffald/ui';

interface InvitationCodeInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  maxLength?: number;
  disabled?: boolean;
  error?: string;
}

function InvitationCodeInput({
  value,
  onChange,
  placeholder = "Enter code (e.g., ABCD1234)",
  maxLength = 20,
  disabled = false,
  error,
}: InvitationCodeInputProps) {
  return (
    <Stack style={{ gap: 4 }}>
      <Input
        value={value}
        onChangeText={(text) => onChange(text.toUpperCase())}
        placeholder={placeholder}
        maxLength={maxLength}
        disabled={disabled}
        error={error}
      />
      {error && (
        <Text size="sm" color="error" style={{ marginTop: 4 }}>
          {error}
        </Text>
      )}
    </Stack>
  );
}

export default InvitationCodeInput;
