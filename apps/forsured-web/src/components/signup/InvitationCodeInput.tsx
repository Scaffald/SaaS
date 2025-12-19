/**
 * InvitationCodeInput - Invitation code input using Tamagui
 */
import React from 'react';
import { YStack, Text } from '@unicornlove/ui';
import { Input as TextInput } from '@unicornlove/ui';

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
    <YStack gap="$1">
      <TextInput
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value.toUpperCase())}
        placeholder={placeholder}
        maxLength={maxLength}
        disabled={disabled}
        error={error}
      />
      {error && (
        <Text fontSize="$2" color="$red9" marginTop="$1">
          {error}
        </Text>
      )}
    </YStack>
  );
}

export default InvitationCodeInput;
